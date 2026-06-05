"""my_thing plugin — replace this docstring with what the tool does.

Wraps the MyThing service (replace with real description). Edit:
- _resolve_base(): the URL of the local service
- _check_my_thing_available(): the liveness probe (gate the tool on this)
- _handle_my_thing(): the dispatcher — split by `action` if multi-endpoint
- MY_THING_SCHEMA: the JSON-schema the LLM sees in the tool catalog

The contract:
- _check_my_thing_available() must return False (not raise) when the service
  is down. The tool surfaces in the agent schema only when True.
- _handle_my_thing() must return a JSON-serializable dict. Never raise.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Optional, Tuple

import logging

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_DEFAULT_PORT = 8000
_TIMEOUT_SEC = 8.0


def _resolve_base() -> str:
    """Resolve the MyThing service base URL.

    Order: MY_THING_BASE env > MY_THING_PORT env > default port.
    """
    base = os.environ.get("MY_THING_BASE")
    if base:
        return base.rstrip("/")
    port = os.environ.get("MY_THING_PORT", str(_DEFAULT_PORT))
    return f"http://127.0.0.1:{port}"


# ---------------------------------------------------------------------------
# HTTP helper — NEVER raises (see references/never-raise-request-pattern.md)
# ---------------------------------------------------------------------------


def _request(
    method: str,
    path: str,
    *,
    params: Optional[Dict[str, Any]] = None,
    body: Optional[Dict[str, Any]] = None,
) -> Tuple[int, Any]:
    base = _resolve_base()
    url = base + path
    if params:
        from urllib.parse import urlencode
        url = f"{url}?{urlencode(params)}"

    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT_SEC) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            status = resp.status
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace") if e.fp else ""
        status = e.code
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return 0, {"error": f"connection_failed: {e!r}"}
    except Exception as e:
        # Safety net — http.client.InvalidURL and friends don't always
        # inherit from ValueError. Preserve the type name for diagnosis.
        return 0, {"error": f"unexpected: {type(e).__name__}: {e!r}"}

    if not raw:
        return status, {"status": "empty_response"}
    try:
        return status, json.loads(raw)
    except json.JSONDecodeError:
        return status, {"raw": raw[:2000]}


# ---------------------------------------------------------------------------
# Availability check (gate)
# ---------------------------------------------------------------------------


def _check_my_thing_available() -> bool:
    """Gate: only expose the tool if the service is actually listening."""
    status, _ = _request("GET", "/health")
    return status == 200


# ---------------------------------------------------------------------------
# Handler (single-endpoint example; expand for action-enum pattern)
# ---------------------------------------------------------------------------


def _handle_my_thing(
    query: str = "",
    *,
    limit: Optional[int] = None,
) -> Dict[str, Any]:
    if not query:
        return {"status": 0, "error": "missing_query"}
    params: Dict[str, Any] = {"q": query}
    if limit is not None:
        params["limit"] = limit
    status, body = _request("GET", "/search", params=params)
    return {"status": status, "body": body}


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------


MY_THING_SCHEMA: Dict[str, Any] = {
    "name": "my_thing",
    "description": (
        "Search the MyThing service. Replace this with a one-line description "
        "the LLM will see in its tool catalog."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query."},
            "limit": {"type": "integer", "description": "Max results to return."},
        },
        "required": ["query"],
    },
}


# ---------------------------------------------------------------------------
# Plugin registration
# ---------------------------------------------------------------------------


def register(ctx) -> None:
    """Register the my_thing tool. Called once by the plugin loader."""
    ctx.register_tool(
        name="my_thing",
        toolset="my_thing",
        schema=MY_THING_SCHEMA,
        handler=_handle_my_thing,
        check_fn=_check_my_thing_available,
        emoji="🔧",
    )
