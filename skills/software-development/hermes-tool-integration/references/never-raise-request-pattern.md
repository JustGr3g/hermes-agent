# The Never-Raise `_request` Pattern

When a tool's handler calls out to a local daemon (HTTP, gRPC, file, CLI subprocess), the handler must **never** let an unhandled exception reach the agent loop. The agent layer treats exceptions as a hard error and may abort the turn; structured 0-error returns let the LLM see the failure and decide what to do (retry, escalate, drop the goal).

## Minimal pattern

```python
import json
import urllib.error
import urllib.request
from typing import Any, Dict, Tuple, Optional

_TIMEOUT_SEC = 8.0

def _request(
    method: str,
    path: str,
    *,
    params: Optional[Dict[str, Any]] = None,
    body: Optional[Dict[str, Any]] = None,
) -> Tuple[int, Any]:
    """Return (status_code, parsed_body_or_text). Never raises."""
    url = _base() + path
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
    except Exception as e:                                # ← the safety net
        # http.client.InvalidURL inherits from HTTPException, NOT ValueError.
        # Anything you don't catch here leaks to the agent loop.
        return 0, {"error": f"unexpected: {type(e).__name__}: {e!r}"}

    if not raw:
        return status, {"status": "empty_response"}
    try:
        return status, json.loads(raw)
    except json.JSONDecodeError:
        return status, {"raw": raw[:2000]}
```

## Why the broad `except Exception` is right, not lazy

Stdlib exceptions that look related often aren't:

| Exception | What it looks like | Actual MRO |
|---|---|---|
| `http.client.InvalidURL` | "URL is invalid → ValueError" | `HTTPException` → `Exception` |
| `ssl.SSLError` | "TLS handshake → OSError" | `OSError` is its parent — caught by the OSError catch |
| `socket.timeout` | "TimeoutError" | `OSError` — also caught |
| `urllib.error.URLError` | "URL-related error" | `OSError` — caught |
| `json.JSONDecodeError` | "JSON parsing" | `ValueError` — caught after the read |

A targeted catch list (`ValueError`, `TypeError`) misses `InvalidURL` and friends. The `except Exception` net catches what slips through, preserves the type name in a structured error, and the LLM can still diagnose.

## Verify the contract

Before shipping, test with a known-bad input. The point is to prove *no traceback escapes*:

```python
# Should return structured error, NOT raise
r = _request("PUT", f"/goals/{'a string'}/complete")  # ok
r = _request("PUT", f"/goals/{None}/complete")         # None in path
r = _request("PUT", f"/goals/{{'id': 'x'}}/complete")  # dict in path

for r in [r1, r2, r3]:
    assert isinstance(r, tuple)
    assert r[0] == 0
    assert "error" in r[1]
    print("ok:", r[1]["error"][:60])
```

If any of these raise, your catch list has a hole.

## Where the error surfaces

The agent layer sees a tool result like:

```json
{
  "role": "tool",
  "name": "athena",
  "content": "{\"status\": 0, \"body\": {\"error\": \"unexpected: InvalidURL: ...\"}}"
}
```

The LLM can then decide: retry, skip, surface to the user. Compare to letting `InvalidURL` propagate — the agent loop logs the traceback and either retries the whole turn or aborts, neither of which is what the LLM needs to recover gracefully.

## When a *narrower* catch list is OK

If the tool's handler does only well-bounded work (no stdlib calls that have surprising hierarchies), a targeted list is fine and more self-documenting. For example, a pure-Python calculator tool that takes only `int` and `float` arguments can catch `TypeError` and `ZeroDivisionError` and call it a day.

The broad `except Exception` net is for *outbound* calls — anywhere the standard library or a third-party SDK can surprise you.
