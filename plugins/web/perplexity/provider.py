"""Perplexity Sonar — plugin form.

Subclasses :class:`agent.web_search_provider.WebSearchProvider`. Perplexity
is unusual among the web backends because the Sonar endpoint returns both
a synthesized natural-language answer *and* the citations it was grounded
in. We surface both:

- The synthesized answer becomes the first row in ``data.web`` (title
  ``"Perplexity Answer"``, ``url`` = first citation, ``description`` =
  the answer text). Consumers that just dump rows will see Perplexity's
  signature output first; consumers that walk by ``position`` get the
  real source pages in positions 2..N.
- The structured ``search_results`` (or legacy ``citations`` array) fill
  positions 2..N as normal web rows.

Capabilities:

- ``supports_search()``  -> True (Perplexity ``/v1/sonar`` endpoint)
- ``supports_extract()`` -> False (Perplexity has no page-extraction API;
  pair this with Tavily/Exa/Firecrawl for ``web_extract``)

Config keys this provider responds to::

    web:
      search_backend: "perplexity"     # explicit per-capability
      backend: "perplexity"            # shared fallback
      perplexity:
        model: "sonar"                 # sonar, sonar-pro, sonar-reasoning-pro, sonar-deep-research
        search_recency_filter: "month" # hour | day | week | month | year
        search_domain_filter: ["arxiv.org", "wikipedia.org"]
        search_mode: "web"             # web | academic | sec
        timeout: 60                    # seconds (default 60)

Env vars::

    PERPLEXITY_API_KEY=...          # https://www.perplexity.ai/settings/api (required)
    PERPLEXITY_BASE_URL=...         # optional override of https://api.perplexity.ai
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List

from agent.web_search_provider import WebSearchProvider

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "sonar"
DEFAULT_TIMEOUT = 60
DEFAULT_BASE_URL = "https://api.perplexity.ai"
SONAR_ENDPOINT = "/v1/sonar"

_VALID_RECENCY = {"hour", "day", "week", "month", "year"}
_VALID_SEARCH_MODE = {"web", "academic", "sec"}


def _load_perplexity_config() -> Dict[str, Any]:
    """Read ``web.perplexity`` from config.yaml (returns {} on miss)."""
    try:
        from hermes_cli.config import load_config

        cfg = load_config()
        web_section = cfg.get("web") if isinstance(cfg, dict) else None
        section = web_section.get("perplexity") if isinstance(web_section, dict) else None
        return section if isinstance(section, dict) else {}
    except Exception as exc:  # noqa: BLE001
        logger.debug("Could not load web.perplexity config: %s", exc)
        return {}


def _coerce_domain_list(value: Any) -> List[str]:
    """Coerce a config value to a clean list of non-empty domain strings."""
    if not isinstance(value, list):
        return []
    cleaned: List[str] = []
    for item in value:
        if isinstance(item, str) and item.strip():
            cleaned.append(item.strip())
    return cleaned


def _build_payload(query: str, limit: int, cfg: Dict[str, Any]) -> Dict[str, Any]:
    """Assemble the Sonar request body from query + optional config."""
    model = cfg.get("model") if isinstance(cfg.get("model"), str) else DEFAULT_MODEL
    model = model.strip() or DEFAULT_MODEL

    payload: Dict[str, Any] = {
        "model": model,
        "messages": [{"role": "user", "content": query}],
    }

    recency = cfg.get("search_recency_filter")
    if isinstance(recency, str) and recency.strip().lower() in _VALID_RECENCY:
        payload["search_recency_filter"] = recency.strip().lower()

    mode = cfg.get("search_mode")
    if isinstance(mode, str) and mode.strip().lower() in _VALID_SEARCH_MODE:
        payload["search_mode"] = mode.strip().lower()

    domains = _coerce_domain_list(cfg.get("search_domain_filter"))
    if domains:
        # Perplexity caps the filter list; pass what we have and let the
        # API validate. Their docs note "up to 10".
        payload["search_domain_filter"] = domains[:10]

    # Cap the synthesized answer length proportional to requested limit so
    # large limits don't blow token cost; Perplexity returns ~50-200 tok
    # per cited source typically.
    payload["max_tokens"] = max(256, min(int(limit) * 200, 2048))

    return payload


def _normalize_response(
    response: Dict[str, Any], limit: int
) -> Dict[str, Any]:
    """Map a Sonar response to the standard web-search shape.

    Position 1 is the synthesized answer (title="Perplexity Answer",
    url=first citation if present, description=answer text). Positions
    2..N come from ``search_results`` (preferred — has title/snippet) or
    fall back to the legacy ``citations`` URL list (URL only, no title).
    """
    rows: List[Dict[str, Any]] = []

    # --- Synthesized answer (position 1) ---
    answer_text = ""
    try:
        choices = response.get("choices") or []
        if choices and isinstance(choices[0], dict):
            msg = choices[0].get("message") or {}
            answer_text = str(msg.get("content") or "").strip()
    except Exception:  # noqa: BLE001
        answer_text = ""

    # Prefer structured search_results; fall back to flat citations list.
    structured = response.get("search_results") if isinstance(
        response.get("search_results"), list
    ) else []
    citations = response.get("citations") if isinstance(response.get("citations"), list) else []

    first_url = ""
    if structured:
        first = structured[0]
        if isinstance(first, dict):
            first_url = str(first.get("url") or "")
    if not first_url and citations:
        first_url = str(citations[0]) if citations[0] else ""

    if answer_text:
        rows.append(
            {
                "title": "Perplexity Answer",
                "url": first_url,
                "description": answer_text,
                "position": 1,
            }
        )

    # --- Source rows (positions 2..N) ---
    next_pos = len(rows) + 1
    if structured:
        for item in structured:
            if not isinstance(item, dict):
                continue
            url = str(item.get("url") or "")
            if not url:
                continue
            description = str(
                item.get("snippet")
                or item.get("date")
                or item.get("last_updated")
                or ""
            )
            rows.append(
                {
                    "title": str(item.get("title") or url),
                    "url": url,
                    "description": description,
                    "position": next_pos,
                }
            )
            next_pos += 1
            if len(rows) >= limit + 1:  # +1 for the answer row
                break
    else:
        for url in citations:
            if not isinstance(url, str) or not url.strip():
                continue
            rows.append(
                {
                    "title": url,
                    "url": url,
                    "description": "",
                    "position": next_pos,
                }
            )
            next_pos += 1
            if len(rows) >= limit + 1:
                break

    return {"success": True, "data": {"web": rows}}


class PerplexityWebSearchProvider(WebSearchProvider):
    """Search-only provider backed by Perplexity's Sonar API.

    Returns the synthesized answer as the first row plus the cited source
    pages as subsequent rows. No extract capability — pair with Tavily,
    Exa, or Firecrawl for ``web_extract``.
    """

    @property
    def name(self) -> str:
        return "perplexity"

    @property
    def display_name(self) -> str:
        return "Perplexity Sonar"

    def is_available(self) -> bool:
        """Return True when ``PERPLEXITY_API_KEY`` is set to a non-empty value."""
        return bool(os.getenv("PERPLEXITY_API_KEY", "").strip())

    def supports_search(self) -> bool:
        return True

    def supports_extract(self) -> bool:
        return False

    def search(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """Execute a Perplexity Sonar search.

        Sync — the underlying call is ``httpx.post(...)``.
        """
        try:
            from tools.interrupt import is_interrupted

            if is_interrupted():
                return {"success": False, "error": "Interrupted"}
        except Exception:  # noqa: BLE001 — interrupt module is best-effort
            pass

        api_key = os.getenv("PERPLEXITY_API_KEY", "").strip()
        if not api_key:
            return {
                "success": False,
                "error": (
                    "PERPLEXITY_API_KEY environment variable not set. "
                    "Get your API key at https://www.perplexity.ai/settings/api"
                ),
            }

        try:
            limit = int(limit)
        except (TypeError, ValueError):
            limit = 5
        limit = max(1, min(limit, 20))

        cfg = _load_perplexity_config()
        try:
            timeout = float(cfg.get("timeout", DEFAULT_TIMEOUT))
        except (TypeError, ValueError):
            timeout = DEFAULT_TIMEOUT

        base_url = os.getenv("PERPLEXITY_BASE_URL", DEFAULT_BASE_URL).strip().rstrip("/")
        url = f"{base_url}{SONAR_ENDPOINT}"
        payload = _build_payload(query, limit, cfg)

        logger.info("Perplexity search: '%s' (limit=%d, model=%s)", query, limit, payload["model"])

        try:
            import httpx

            response = httpx.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                timeout=timeout,
            )
            response.raise_for_status()
            data = response.json()
        except Exception as exc:  # noqa: BLE001 — including httpx errors
            logger.warning("Perplexity search error: %s", exc)
            return {"success": False, "error": f"Perplexity search failed: {exc}"}

        return _normalize_response(data, limit)

    def get_setup_schema(self) -> Dict[str, Any]:
        return {
            "name": "Perplexity Sonar",
            "badge": "paid",
            "tag": "Search-grounded LLM answers with citations.",
            "env_vars": [
                {
                    "key": "PERPLEXITY_API_KEY",
                    "prompt": "Perplexity API key",
                    "url": "https://www.perplexity.ai/settings/api",
                },
            ],
        }
