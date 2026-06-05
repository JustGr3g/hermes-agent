---
name: wrap-openapi-service-as-plugin
description: Wrap any structured HTTP service (FastAPI/Express/etc. with an OpenAPI or OpenAPI-shaped surface) as a first-class Hermes plugin tool. Use when a structured endpoint already exists and you want a single tool call — with action enum, gated availability, and structured-error responses — instead of repeated `terminal+curl` invocations. Captures the openapi.json → JSON-schema → handler → gate → live test pipeline and the pitfall of the http.client.InvalidURL catch-all.
category: software-development
---

# Wrap an OpenAPI Service as a Hermes Plugin Tool

When a structured HTTP service already exists locally (Athena's `athena_server.py` on port 8765 is the prototype), wrapping it as a Hermes plugin tool replaces repeated `terminal+curl` invocations with one tool call. The class is "any FastAPI/Express/etc. with an OpenAPI 3.x surface."

## When To Use

- A service already runs locally and exposes `/openapi.json` (or a comparable schema endpoint)
- You find yourself calling it via `terminal` + `curl` repeatedly across turns
- The call surface has a small set of distinct operations (5-30) that can fit a single `action` enum
- Read+write endpoints are mixed and you want one tool to do both
- A `check_fn` gating the tool on the server actually listening is acceptable (better than timeouts)

Skip if: the service has 100+ endpoints (split into multiple tools), the service isn't local (network latency makes a wrapper less useful), or you only need 1-2 endpoints (just keep the `terminal+curl`).

## The Recipe (5 steps)

### 1. Discover the schema

```bash
curl -sS http://127.0.0.1:<port>/openapi.json | python3 -m json.tool
```

List every path + method. Cluster by *user intent* (state, list, create, complete), not by HTTP verb. The clusters become the action enum values.

### 2. Pick the right location

For a service-specific tool:
- `~/.hermes/hermes-agent/plugins/<service>/plugin.yaml`
- `~/.hermes/hermes-agent/plugins/<service>/__init__.py`

Do NOT edit `tools/` or `toolsets.py` in core. The plugin route is the supported extension point.

`plugin.yaml` shape:
```yaml
name: <service>
version: 0.1.0
description: "One-line description of the wrapped surface."
author: <author>
kind: backend
provides_tools:
  - <tool_name>
```

### 3. Write the JSON Schema (plugin style, NOT raw OpenAPI)

The plugin schema is **different** from raw OpenAPI. Top-level `name` and `description`, with `parameters` nested:

```python
TOOL_SCHEMA = {
    "name": "<tool_name>",
    "description": "<one-line summary of what the tool does + action semantics>",
    "parameters": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["<action1>", "<action2>", ...],
                "description": "Which endpoint to invoke.",
            },
            # Other parameters as needed
        },
        "required": ["action"],
    },
}
```

Reference shape: read `~/.hermes/hermes-agent/plugins/spotify/tools.py` `SPOTIFY_PLAYLISTS_SCHEMA` (line 397) for a real-world example.

### 4. Write the handler with the "never raise" contract

```python
def _request(method, path, *, params=None, body=None):
    """Single HTTP helper. NEVER raises on HTTP/connection errors."""
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT_SEC) as resp:
            ...
    except urllib.error.HTTPError as e:
        return e.code, <error body>
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return 0, {"error": f"connection_failed: {e!r}"}
    except Exception as e:  # catch-all for http.client.InvalidURL etc.
        return 0, {"error": f"unexpected: {type(e).__name__}: {e!r}"}
```

**Critical pitfall:** `http.client.InvalidURL` (raised when the caller passes a malformed path segment, e.g. a dict where a string is expected) does **not** inherit from `ValueError`. A `except (ValueError, TypeError)` clause will NOT catch it. Use a single broad `except Exception` as the catch-all. The structured error preserves the type name so callers can still diagnose.

The handler dispatches on `action` to small per-action functions, each of which returns `{"status": int, "body": dict|list|str}`.

### 5. Wire the gate and register

```python
def _check_available() -> bool:
    """Gate: only expose the tool if the server is actually listening."""
    status, _ = _request("GET", "/health")
    return status == 200


def register(ctx) -> None:
    ctx.register_tool(
        name="<tool_name>",
        toolset="<service>",  # not "core" — keep it scoped
        schema=TOOL_SCHEMA,
        handler=_handle,
        check_fn=_check_available,
        emoji="<single emoji>",
    )
```

## Live Test Before Shipping

The schema and handler can be wrong in ways that don't show up in unit tests. After writing the plugin:

1. Import the plugin in a fresh Python process and call the handler directly
2. Run a round-trip on the *write* endpoints (create → list → verify → complete) — not just the read endpoints
3. Test 4-5 negative cases (missing required arg, wrong type, unknown action, server down) — they must all return structured `{"status": 0, "body": {"error": "..."}}`, not raise

```python
import importlib, sys
sys.path.insert(0, "/path/to/hermes-agent")
from plugins.<service> import _handle, _check_available
assert _check_available(), "gate failed"
for a, kw in [("read1", {}), ("read2", {}), ("write_round_trip", {})]:
    r = _handle(action=a, **kw)
    assert r.get("status") in (200, 0), f"{a} crashed: {r}"
```

## Pitfalls (real, observed)

1. **Schema confusion: OpenAPI shape vs plugin shape.** OpenAPI nests `requestBody` and per-verb schemas; plugin schemas use one `parameters` object with an `action` enum. Don't blindly convert OpenAPI → plugin; re-cluster by intent.
2. **Inheriting `ValueError` exception catch.** `http.client.InvalidURL` is the trap — it's not a `ValueError`. The fix is a single `except Exception` catch-all at the bottom of the request helper. Document this in a comment so the next reader doesn't "tighten" the catch.
3. **Test driver bugs masquerading as tool bugs.** If your round-trip test passes a dict as a `goal_id` (because you forgot to extract `body["id"]`), the test crashes. The crash is in the test, not the tool. Fix the test driver first, *then* verify the tool's structured error response is what you expect.
4. **No gate, silent timeouts.** Without `check_fn`, the tool appears in the agent's tool list but every call times out for 8 seconds before returning an error. The gate makes the tool only visible when the server is actually listening.
5. **Adding to `_HERMES_CORE_TOOLS` instead of the plugin route.** Core toolset changes require Hermes framework changes. Plugins are the supported extension point. (Athena + the broader Hermes ecosystem all use plugins for service-specific tools.)

## Reference Files

| File | When to Use |
|------|-------------|
| `references/athena-plugin-walkthrough.md` | Step-by-step walkthrough of the prototype build (the `~/.hermes/hermes-agent/plugins/athena/` plugin that wraps Athena's port 8765). Includes the 14-case test table. Use as the canonical example when building a new wrapper. |

## Linked Artifacts (Prototype)

- Plugin code: `~/.hermes/hermes-agent/plugins/athena/__init__.py` (338 lines)
- Manifest: `~/.hermes/hermes-agent/plugins/athena/plugin.yaml`
- Wrapped service: Athena server on `http://127.0.0.1:8765` (port from `ai.athena.server.plist` env, default 8765)
- Service OpenAPI: `http://127.0.0.1:8765/openapi.json`
