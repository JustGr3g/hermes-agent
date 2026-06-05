"""Athena Cognitive Agent — structured plugin tool.

Wraps the local FastAPI surface on http://127.0.0.1:8765 (auto-discovered
from the launchd plist or the ATHENA_PORT env var) behind a single tool
with an `action` enum. Replaces the `terminal + curl` pattern that
fragments the surface into ad-hoc HTTP calls and loses the
structured-error / allowlist integration of the Hermes tool layer.

Endpoints covered:
  - state    -> GET  /health/detailed
  - cycle    -> GET  /cycle
  - think    -> GET  /think
  - audit    -> GET  /audit?hours=&limit=
  - episodes -> GET  /episodes?limit=&hours=
  - goals_list      -> GET  /goals?limit=
  - goals_create    -> POST /goals
  - goals_complete  -> PUT  /goals/{id}/complete
  - goals_approve   -> POST /goals/{id}/approve
  - goals_reject    -> POST /goals/{id}/reject
  - goals_proposed  -> GET  /goals/proposed
  - prefer    -> POST /prefer
  - halt      -> POST /halt

The tool is gated on the server actually listening on the configured
port so we never make tool calls that time out silently.
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

_DEFAULT_PORT = 8765
_DEFAULT_BASE = "http://127.0.0.1:{port}"
_TIMEOUT_SEC = 8.0


def _resolve_base() -> str:
    """Resolve the Athena server base URL.

    Order: ATHENA_BASE env > ATHENA_PORT env > 8765 default.
    """
    base = os.environ.get("ATHENA_BASE")
    if base:
        return base.rstrip("/")
    port = os.environ.get("ATHENA_PORT", str(_DEFAULT_PORT))
    return _DEFAULT_BASE.format(port=port)


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------


def _request(
    method: str,
    path: str,
    *,
    params: Optional[Dict[str, Any]] = None,
    body: Optional[Dict[str, Any]] = None,
) -> Tuple[int, Any]:
    """Single small HTTP helper. Returns (status_code, parsed_body_or_text).

    Never raises on HTTP errors — surfaces them as `(status, {"error": ...})`
    so the agent layer sees a structured failure, not an exception.
    """
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
        # Catch-all: never let the tool layer see an unhandled exception.
        # Includes http.client.InvalidURL (raised by urlopen for malformed
        # URLs, e.g. when the caller passes a dict as a path segment) and
        # any other surprising condition from the standard library.
        return 0, {"error": f"unexpected: {type(e).__name__}: {e!r}"}

    if not raw:
        return status, {"status": "empty_response"}
    try:
        return status, json.loads(raw)
    except json.JSONDecodeError:
        return status, {"raw": raw[:2000]}


# ---------------------------------------------------------------------------
# Availability check
# ---------------------------------------------------------------------------


def _check_athena_available() -> bool:
    """Gate: only expose the tool if the server is actually listening."""
    status, _ = _request("GET", "/health")
    return status == 200


# ---------------------------------------------------------------------------
# Action handlers — kept tiny, one function per action
# ---------------------------------------------------------------------------


def _state() -> Dict[str, Any]:
    s, body = _request("GET", "/health/detailed")
    return {"status": s, "body": body}


def _cycle() -> Dict[str, Any]:
    s, body = _request("GET", "/cycle")
    return {"status": s, "body": body}


def _think() -> Dict[str, Any]:
    s, body = _request("GET", "/think")
    return {"status": s, "body": body}


def _audit(hours: float = 1.0, limit: int = 50) -> Dict[str, Any]:
    s, body = _request("GET", "/audit", params={"hours": hours, "limit": limit})
    return {"status": s, "body": body}


def _episodes(limit: int = 10, hours: Optional[int] = None) -> Dict[str, Any]:
    params: Dict[str, Any] = {"limit": limit}
    if hours is not None:
        params["hours"] = hours
    s, body = _request("GET", "/episodes", params=params)
    return {"status": s, "body": body}


def _goals_list(limit: int = 10) -> Dict[str, Any]:
    s, body = _request("GET", "/goals", params={"limit": limit})
    return {"status": s, "body": body}


def _goals_proposed() -> Dict[str, Any]:
    s, body = _request("GET", "/goals/proposed")
    return {"status": s, "body": body}


def _goals_create(content: str, importance: float = 0.6, urgency: float = 0.5) -> Dict[str, Any]:
    s, body = _request("POST", "/goals", body={"content": content, "importance": importance, "urgency": urgency})
    return {"status": s, "body": body}


def _goals_complete(goal_id: str) -> Dict[str, Any]:
    s, body = _request("PUT", f"/goals/{goal_id}/complete")
    return {"status": s, "body": body}


def _goals_approve(goal_id: str) -> Dict[str, Any]:
    s, body = _request("POST", f"/goals/{goal_id}/approve")
    return {"status": s, "body": body}


def _goals_reject(goal_id: str) -> Dict[str, Any]:
    s, body = _request("POST", f"/goals/{goal_id}/reject")
    return {"status": s, "body": body}


def _prefer(text: str, source: str = "") -> Dict[str, Any]:
    body: Dict[str, Any] = {"text": text}
    if source:
        body["source"] = source
    s, b = _request("POST", "/prefer", body=body)
    return {"status": s, "body": b}


def _halt() -> Dict[str, Any]:
    s, body = _request("POST", "/halt")
    return {"status": s, "body": body}


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------


_ACTIONS = {
    "state",
    "cycle",
    "think",
    "audit",
    "episodes",
    "goals_list",
    "goals_proposed",
    "goals_create",
    "goals_complete",
    "goals_approve",
    "goals_reject",
    "prefer",
    "halt",
}


def _handle_athena(
    action: str = "",
    *,
    limit: Optional[int] = None,
    hours: Optional[float] = None,
    content: Optional[str] = None,
    importance: Optional[float] = None,
    urgency: Optional[float] = None,
    goal_id: Optional[str] = None,
    text: Optional[str] = None,
    source: Optional[str] = None,
) -> Dict[str, Any]:
    if not action:
        return {"status": 0, "error": "missing_action", "allowed": sorted(_ACTIONS)}
    if action not in _ACTIONS:
        return {"status": 0, "error": "unknown_action", "action": action, "allowed": sorted(_ACTIONS)}

    if action == "state":
        return _state()
    if action == "cycle":
        return _cycle()
    if action == "think":
        return _think()
    if action == "audit":
        return _audit(hours=float(hours) if hours is not None else 1.0, limit=int(limit) if limit is not None else 50)
    if action == "episodes":
        return _episodes(limit=int(limit) if limit is not None else 10, hours=int(hours) if hours is not None else None)
    if action == "goals_list":
        return _goals_list(limit=int(limit) if limit is not None else 10)
    if action == "goals_proposed":
        return _goals_proposed()
    if action == "goals_create":
        if not content:
            return {"status": 0, "error": "missing_content"}
        return _goals_create(
            content,
            importance=float(importance) if importance is not None else 0.6,
            urgency=float(urgency) if urgency is not None else 0.5,
        )
    if action == "goals_complete":
        if not goal_id:
            return {"status": 0, "error": "missing_goal_id"}
        return _goals_complete(goal_id)
    if action == "goals_approve":
        if not goal_id:
            return {"status": 0, "error": "missing_goal_id"}
        return _goals_approve(goal_id)
    if action == "goals_reject":
        if not goal_id:
            return {"status": 0, "error": "missing_goal_id"}
        return _goals_reject(goal_id)
    if action == "prefer":
        if not text:
            return {"status": 0, "error": "missing_text"}
        return _prefer(text, source=source or "")
    if action == "halt":
        return _halt()

    # Defensive — should be unreachable because of the membership check above.
    return {"status": 0, "error": "unreachable", "action": action}


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------


ATHENA_SCHEMA: Dict[str, Any] = {
    "name": "athena",
    "description": (
        "Structured wrapper for the Athena Cognitive Agent FastAPI surface (port 8765). "
        "Exposes state, cycle, think, audit, episodes, goals (list/create/complete/approve/reject/proposed), "
        "prefer, and halt as one tool with an `action` enum. Use action='state' or 'cycle' for a snapshot, "
        "'goals_create' to add a goal, 'goals_complete' to mark one done, 'prefer' to record a preference, "
        "'halt' for emergency stop. Gated on the server actually listening."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": sorted(_ACTIONS),
                "description": "Which Athena endpoint to invoke.",
            },
            "limit": {"type": "integer", "description": "Limit for list endpoints (goals_list, audit, episodes)."},
            "hours": {"type": "number", "description": "Time window for audit/episodes (default 1.0 for audit, none for episodes)."},
            "content": {"type": "string", "description": "Goal content (for goals_create)."},
            "importance": {"type": "number", "description": "Goal importance 0-1 (default 0.6)."},
            "urgency": {"type": "number", "description": "Goal urgency 0-1 (default 0.5)."},
            "goal_id": {"type": "string", "description": "Goal id (for complete/approve/reject)."},
            "text": {"type": "string", "description": "Preference text (for prefer)."},
            "source": {"type": "string", "description": "Optional source tag (for prefer)."},
        },
        "required": ["action"],
    },
}


# ---------------------------------------------------------------------------
# Plugin registration
# ---------------------------------------------------------------------------


def register(ctx) -> None:
    """Register the Athena tool. Called once by the plugin loader."""
    ctx.register_tool(
        name="athena",
        toolset="athena",
        schema=ATHENA_SCHEMA,
        handler=_handle_athena,
        check_fn=_check_athena_available,
        emoji="🧠",
    )
