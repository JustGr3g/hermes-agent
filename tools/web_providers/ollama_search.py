"""Ollama Web Search and Web Fetch provider.

Uses Ollama's REST API at https://ollama.com/api/web_search and
https://ollama.com/api/web_fetch.  Requires an Ollama API key set as
``OLLAMA_API_KEY`` (or ``ATHENA_OLLAMA_API_KEY`` as fallback).

Configuration::

    # ~/.hermes/.env
    OLLAMA_API_KEY=your-api-key

    # ~/.hermes/config.yaml
    web:
      search_backend: "ollama"
      extract_backend: "ollama"    # web_fetch is also supported

See https://docs.ollama.com/capabilities/web-search for the API reference.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List

from tools.web_providers.base import WebSearchProvider

logger = logging.getLogger(__name__)

_SEARCH_ENDPOINT = "https://ollama.com/api/web_search"
_FETCH_ENDPOINT = "https://ollama.com/api/web_fetch"


def _get_api_key() -> str:
    """Resolve the Ollama API key, checking multiple env var names."""
    key = os.getenv("OLLAMA_API_KEY", "").strip()
    if not key:
        key = os.getenv("ATHENA_OLLAMA_API_KEY", "").strip()
    return key


class OllamaSearchProvider(WebSearchProvider):
    """Search via the Ollama web search REST API.

    Requires ``OLLAMA_API_KEY`` (or ``ATHENA_OLLAMA_API_KEY``) to be set.
    No extract capability beyond ``_ollama_web_fetch`` on its own —
    see :class:`OllamaFetchProvider` for that.
    """

    def provider_name(self) -> str:
        return "ollama"

    def is_configured(self) -> bool:
        """Return True when an Ollama API key is available."""
        return bool(_get_api_key())

    def search(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """Execute a search against the Ollama web search API.

        Returns normalized results::

            {
                "success": True,
                "data": {
                    "web": [
                        {
                            "title": str,
                            "url": str,
                            "description": str,
                            "position": int,
                        },
                        ...
                    ]
                }
            }

        On failure returns ``{"success": False, "error": str}``.
        """
        import httpx

        api_key = _get_api_key()
        if not api_key:
            return {"success": False, "error": "OLLAMA_API_KEY is not set"}

        # Ollama's max_results is capped at 10.
        max_results = max(1, min(int(limit), 10))

        try:
            resp = httpx.post(
                _SEARCH_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"query": query, "max_results": max_results},
                timeout=20,
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.warning("Ollama Search HTTP error: %s", exc)
            return {
                "success": False,
                "error": f"Ollama Search returned HTTP {exc.response.status_code}",
            }
        except httpx.RequestError as exc:
            logger.warning("Ollama Search request error: %s", exc)
            return {
                "success": False,
                "error": f"Could not reach Ollama Search: {exc}",
            }

        try:
            data = resp.json()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Ollama Search response parse error: %s", exc)
            return {
                "success": False,
                "error": "Could not parse Ollama Search response as JSON",
            }

        raw_results: List[Dict[str, Any]] = data.get("results") or []
        truncated = raw_results[:limit]

        web_results = [
            {
                "title": str(r.get("title", "")),
                "url": str(r.get("url", "")),
                "description": str(r.get("content", "")),
                "position": i + 1,
            }
            for i, r in enumerate(truncated)
        ]

        logger.info(
            "Ollama Search '%s': %d results (limit %d)",
            query,
            len(web_results),
            limit,
        )

        return {"success": True, "data": {"web": web_results}}
