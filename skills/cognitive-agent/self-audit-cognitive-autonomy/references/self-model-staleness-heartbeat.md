# Self-Model Staleness: Heartbeat-Interval vs Event-Triggered

## The Pattern

The self-model generates on a fixed 6-hour heartbeat (`heartbeat_handlers.py:588-592`).
Between those ticks, the narrative is frozen at yesterday's reflection — even when real
architectural output accumulates (shipped fixes, closed goals, verified capabilities).

This creates a specific failure: the cognitive state block shown to Greg carries a stale
self-model that contradicts today's observable output.

## How to Detect

If the self-model narrative says one thing (e.g. "stuck_cycle_idle") but `recent_self_steps`
in your cognitive state block shows something different (e.g. tool fired, goal completed),
the self-model is stale by interval, not by process bounce.

## The Fix

A single conditional inside `_on_terminal_transition` in `agent.py`:

```python
if status == "completed" and getattr(goal, "importance", 0) >= 0.6:
    try:
        self._build_self_model()
    except Exception:
        logger.debug("self_model refresh on goal completion failed", exc_info=True)
```

**Properties:**
- Importance gate (≥0.6) prevents trivia from burning tokens
- Uses the same `_build_self_model()` path as the heartbeat handler (process registry → verify gate)
- Fires within seconds of a significant goal terminating, not hours later
- Zero new schema, zero new tables, zero new flags

## Distinction from Process-Bounce Staleness

The existing pitfall in `self-audit-cognitive-autonomy` covers *process-bounce* staleness:
the source tree has new code but the running process hasn't restarted. This covers a
*different* staleness: the process is running correctly but the narrative update frequency
is too coarse. Both must be checked independently.
