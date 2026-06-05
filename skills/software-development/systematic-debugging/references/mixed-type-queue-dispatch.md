# Mixed-Type Queue Dispatch: Signal Tuples in Stream Pipelines

## Pattern

An asyncio task consumes items from a `queue.Queue` or `asyncio.Queue`, expecting all items to be strings. Some producer emits a **signal tuple** (`("__signal__",)`) — e.g. to reset state, clear a buffer, or trigger a flush. The consumer appends the tuple to its lines list; later `"\n".join(lines)` throws `TypeError: sequence item 0: expected str instance, tuple found`.

## Root Cause

The consumer has an explicit dispatch branch for one tuple type (e.g. `__dedup__`) but a bare `else:` for everything else. Signal tuples fall through and get treated as data — appended to the output buffer as-is. Downstream string-join then fails.

## Fix Pattern

Every tuple-dispatch chain in a stream consumer must have **explicit branches for all known tuple types** — at minimum the `else:` fallthrough must handle non-string items safely.

```python
# Before — __reset__ tuples fall through to else:
if isinstance(raw, tuple) and len(raw) == 3 and raw[0] == "__dedup__":
    _, base_msg, count = raw
    progress_lines[-1] = f"{base_msg} (×{count + 1})"
else:
    msg = raw  # ← tuple appended as line!
    progress_lines.append(msg)

# After — explicit __reset__ branch:
if isinstance(raw, tuple) and len(raw) == 3 and raw[0] == "__dedup__":
    _, base_msg, count = raw
    progress_lines[-1] = f"{base_msg} (×{count + 1})"
elif isinstance(raw, tuple) and len(raw) >= 1 and raw[0] == "__reset__":
    buffer.clear()  # reset state, don't append
    continue        # skip the edit cycle
else:
    msg = raw
    progress_lines.append(msg)
```

## Detection

- Error: `TypeError: sequence item 0: expected str instance, tuple found` from `"\n".join(lines)`
- Logs show repeated `Progress message error:` at ERROR level
- The queue receives tuples from producers you may not be aware of: `on_new_message` callbacks, interrupt handlers, cleanup tasks

## Prevention

1. **Log queue item types on entry** during development to discover all producer shapes
2. **Never let `else:` in a tuple dispatch silently append to a string buffer**
3. **Cross-reference producers** — check every `queue.put()` call for tuples vs strings
4. **Drain handlers (CancelledError) must mirror the same dispatch branches** as the main loop

## Real Instance

May 30, 2026 — `gateway/run.py` progress consumer loop. `("__reset__",)` tuples from `on_new_message` callback fell through the `__dedup__`-only dispatch into `else: msg = raw; progress_lines.append(msg)`. The `CancelledError` drain handler already had the correct `__reset__` branch; the main loop was missing it. Fix: added parallel `elif isinstance(raw, tuple) and raw[0] == "__reset__":` with buffer clear + continue.
