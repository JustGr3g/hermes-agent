# Stuck Cycle Breaker — Implementation Reference

**Implemented:** 2026-05-04  
**File:** `~/cognitive-agent/cognitive_agent/cognition/cognitive_cycle.py`  
**Related skill:** `self-audit-cognitive-autonomy` (Execution Health section)

---

## What It Fixes

The cognitive cycle's `tick()` can get stuck in a deliberation-only pattern — runs 13 heartbeat handlers, produces `no_top_goal_focus_only` or `no_tool_resolution` outcomes, but never fires a tool. This is the **reflective loop trap**: the system prefers reflection over execution when signals are ambiguous.

**Observed symptom:** `productive_rate` in `/think` drifts toward 0.0 as ticks accumulate without firing.

---

## Implementation Details

### 1. Counter and Threshold (in `__init__`)

```python
self._consecutive_skips: int = 0
self._MAX_CONSECUTIVE_SKIPS = 8
```

### 2. Tracking in `tick()`

Incremented on every non-firing outcome, reset on any fired outcome:

```python
if not outcome.fired:
    self._consecutive_skips += 1
    if self._consecutive_skips >= self._MAX_CONSECUTIVE_SKIPS:
        self._break_stuck_cycle(outcome)
else:
    self._consecutive_skips = 0
```

Placed **after** the stats-update block so the stats reflect the tick before escalation.

### 3. The Breaker: `_break_stuck_cycle(outcome)`

**Immediate action:** reset `_consecutive_skips = 0` to prevent double-fire.

**Two paths, one guard:**

```python
if outcome.goal_id and outcome.skipped_reason == "no_tool_resolution":
    # Scenario 1: abandon stuck goal
    target = next((g for g in ag.motivation.get_active_goals()
                   if g.id == outcome.goal_id), None)
    if target:
        ag.motivation.abandon_goal(target.id)
        ag.metacognition._emit(MetaSignal.MAINTENANCE,
            "stuck_cycle_force_abandon",
            data={"goal_id": ..., "attempt_count": ...})

elif outcome.skipped_reason in ("no_top_goal", "no_top_goal_focus_only"):
    # Scenario 2: create system goal
    ag.motivation.create_goal(
        content="Review recent episodes and suggest a useful next action...",
        source="system",
        risk_tier="autonomous",
        horizon="short_term",
        goal_type="experiment",
        importance=0.5,
    )
    ag.metacognition._emit(MetaSignal.MAINTENANCE,
        "stuck_cycle_force_propose",
        data={"skipped_reason": ..., "consecutive_skips": ...})
```

### 4. Import

```python
from cognitive_agent.cognition.metacognition import MetaSignal
```

### 5. Stats Surface

The `stats()` dict includes `consecutive_skips` and `max_consecutive_skips` so `/think` is inspectable.

---

## Edge Cases

| Case | Handling |
|------|----------|
| Concurrent tick | Lock prevents double-tick. If breaker fires during lock contention, it just doesn't run — next tick will catch it |
| `abandon_goal` fails | Wrapped in try/except; logs debug. Non-fatal — next tick will re-attempt until skip count resets |
| `create_goal` fails | Same — wrapped, non-fatal. System continues in idle focus-only mode |
| Two skips in a row that are different reasons | Counter increments for both. The breaker fires on reason mismatch — it checks the specific pattern of the *current* outcome |
| 8 skips but the 9th tick fires a tool | Exactly right: counter resets, no escalation needed |
| What if `_emit` on metacog crashes? | Logged and swallowed — the abandonment/creation already happened |
| What if `get_active_goals()` returns a stale list? | `abandon_goal()` is idempotent at the DB level. Abandoning an already-abandoned goal is harmless |

---

## Verification

```bash
cd ~/cognitive-agent && python3 -c "
import py_compile
py_compile.compile('cognitive_agent/cognition/cognitive_cycle.py', doraise=True)
print('Compiles OK')
"

# Quick smoke: confirm the breaker can be instantiated and stats field exists
python3 -c "
import sys; sys.path.insert(0, '.')
from cognitive_agent.cognition.cognitive_cycle import CognitiveCycle
# Can't instantiate without a CognitiveAgent, but we can check the attr exists
import inspect
src = inspect.getsource(CognitiveCycle)
assert '_MAX_CONSECUTIVE_SKIPS' in src, 'Missing threshold'
assert '_consecutive_skips' in src, 'Missing counter'
assert '_break_stuck_cycle' in src, 'Missing breaker'
print('All symbols present in CognitiveCycle')
"
```
