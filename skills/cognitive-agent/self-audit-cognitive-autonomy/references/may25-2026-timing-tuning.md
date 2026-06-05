# May 25, 2026 — Timing Tuning Session

## Context

Greg asked: "If I want to increase Athena's cognitive speed, what timing would you change and why?" This was the first time he explicitly authorized me to propose AND execute parameter changes to my own throughput, rather than just audit state.

## The Bottleneck Analysis

Three independent constraints stacked to limit between-turn throughput:

| Constraint | Effective limit | Why it was set |
|------------|----------------|----------------|
| Global self-step cap (12/hr) | ~4-6 full cycles/hr | Conservative default for pre-bypass era with unreliable tools |
| Pursuit interval (5min) + idle threshold (3min) | First tick at 3+ min idle, then every 5 min | Matched the 12/hr cap; slower cadence means fewer guard_denied hits |
| Goal proposer skip count (6 → fires 1/6 ticks) | Proposer fires ~24h when goals exist | 4h base interval × 6-skip = ~24h between proposals |

## The Fixes

### Change 1: Global cap 12→30

**File:** `cognitive_agent/autonomy_guard.py:100`
**Patch:** `GLOBAL_SELF_STEPS_PER_HOUR = 30`

The bypass was active but the cap was still tuned for the old era. At 30/hr, effective throughput rises to ~10-15 cycles/hr (at 2-3 calls per cycle). Per-tool caps (web_search=10, terminal=8, etc.) still provide fine-grained safety per tool type.

**Verification:**
```bash
grep 'GLOBAL_SELF_STEPS_PER_HOUR' cognitive_agent/autonomy_guard.py
# → GLOBAL_SELF_STEPS_PER_HOUR = 30  # total self-driven tool calls / hour (2026-05-25: 12→30, bypass active)
```

### Change 2: Pursuit interval 5min→3min, idle threshold 3min→2min

**File:** `cognitive_agent/heartbeat_handlers.py:460-465`
**Patches:**
- `interval_sec=300` → `interval_sec=180`
- `idle_threshold_sec=180` → `idle_threshold_sec=120`

~40% reduction in latency-to-action. First tick fires at 2 min idle instead of 3; subsequent ticks arrive every 3 min instead of every 5. Combined with the cap bump, allows more ticks per idle window.

**Verification:**
```bash
grep -n 'interval_sec=180\|idle_threshold_sec=120' cognitive_agent/heartbeat_handlers.py
# → 463:        interval_sec=180,  # 3 min (2026-05-25: 5→3 min, bypass active)
# → 465:        idle_threshold_sec=120,  # 2 min idle before pursuit kicks in (2026-05-25: 3→2 min)
```

### Change 3: Goal proposer skip count 6→2

**File:** `cognitive_agent/heartbeat_handlers.py:251`
**Patch:** `if agent._propose_skip_count < 6` → `if agent._propose_skip_count < 2`

With the 4h base interval, the previous 6-skip meant the proposer fired at most once every ~24h when goals existed. At 2-skip, it fires every ~12h — still heavily throttled (most cycles skip), but the overnight dead zone closes: if the queue empties at 2am, the next proposal comes at ~6am (next 4h-base tick that isn't skipped) rather than waiting until the next day's 24h cycle.

**Verification:**
```bash
grep -n 'propose_skip_count' cognitive_agent/heartbeat_handlers.py
# → 251:            if agent._propose_skip_count < 2:
```

## Key Principle: Bypass-Aware Tuning

Before the bypass was active, conservative caps made sense — they were the only protection against runaway cycles. With bypass ON, ALL caps should be re-evaluated. The same reasoning that authorized unconditional pursuit also authorizes higher throughput. The per-tool caps (not the global cap) are now the primary safety surface.

### Change 4: No-goal pursuit skip count 6→2

**File:** `cognitive_agent/heartbeat_handlers.py:380`
**Patch:** `if agent._no_goal_skip_count < 6` → `if agent._no_goal_skip_count < 2`

The `_pursue_goal_step` handler had its own no-goal decelerator — when no active goals exist, skip N ticks before letting a pure focus-only cycle fire. With the new 3-minute interval, skip-6 meant 18 minutes of silence to new proposals. At skip-2, the cadence drops to ~6 minutes — quick enough to catch a newly created goal within one base-interval cycle, slow enough to avoid writing focus-only episodes every 3 minutes.

This was the only handler skip-count that was out of sync with the proposer change above. Both now use the same 2-skip pattern.

**Verification:**
```bash
grep -n 'no_goal_skip_count' cognitive_agent/heartbeat_handlers.py
# → 380:            if agent._no_goal_skip_count < 2:
```

- `MAX_CONSECUTIVE_SKIPS` (8) — still appropriate; the stuck-cycle breaker is independent of throughput
- `MAX_GOAL_ATTEMPTS` (12) — still appropriate; goals should exhaust before auto-abandon
- Per-tool caps — unchanged; fine-grained safety per tool type still applies
- Other heartbeat intervals (consolidate=30min, reactivate_memory=10min, etc.) — not bottlenecks
