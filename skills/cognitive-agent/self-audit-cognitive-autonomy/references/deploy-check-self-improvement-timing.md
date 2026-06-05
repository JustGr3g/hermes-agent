# Deploy Check vs Self-Improvement Timing

Investigated: 2026-06-02

## The Question

The `deploy_check.py` script restarts `athena_server` daily at 05:00 if any source file is newer than the running process. The `SelfImprovementLoop.should_run()` requires 7 days between runs. Does the daily restart prevent the self-improvement cycle from ever firing?

## Answer: No — they're independent clocks

**The restart resets process uptime, but `should_run()` checks DB timestamp, not process age.**

### Key Code

**deploy_check.py** (scripts/deploy_check.py):
- Compares file mtime to `ps lstart` (process start time)
- If any source file is newer than the running process + 2s → restarts via launchctl kickstart
- Guard: MIN_PROCESS_AGE_S = 180 (skips if process younger than 3 min)

**SelfImprovementLoop** (cognitive_agent/cognition/self_improvement.py):
```python
def should_run(self) -> bool:
    if self._last_run == 0.0:  # never run before
        return True
    return time.time() - self._last_run >= HEARTBEAT_INTERVAL_SEC  # 604800 = 7 days
```

`_last_run` is initialized from the DB at line 179:
```python
self._last_run: float = self._get_last_run_from_cycles()
```

Which queries (line 776-785):
```python
def _get_last_run_from_cycles(self) -> float:
    with sqlite3.connect(self._db_path) as conn:
        row = conn.execute(
            "SELECT MAX(started_at) FROM self_improvement_cycles"
        ).fetchone()
        return float(row[0]) if row and row[0] is not None else 0.0
```

### Why the restart doesn't reset the schedule

The restart at 05:00 resets `ps lstart` (process birth timestamp). But `should_run()` computes its interval against `self_improvement_cycles.MAX(started_at)` — a SQLite timestamp that survives process restarts. A 7-day-old DB row remains 7 days old no matter how many times the process restarts.

### Two Scenarios

1. **No code changes that day** — `deploy_check.py` finds no source newer than the process start, logs "up to date", and does nothing. The process runs continuously. Self-improvement fires on its 7-day cadence normally.

2. **Code changes land overnight** — `deploy_check.py` finds a stale source file (e.g., a git pull rewrote files at 04:55), restarts the server at 05:00. `SelfImprovementLoop.__init__` creates a new instance, reads `_last_run` from the DB (e.g., "last cycle: Sunday 02:00"), computes `time.time() - Sunday_02:00 >= 604800`. The 7-day clock is preserved. The process is younger, but the DB timestamp hasn't changed.

### What Does Get Reset

Things that depend on process uptime or in-memory state:

| Component | Resets on deploy_check restart | Impact |
|-----------|-------------------------------|--------|
| AutonomyGuard `_per_tool_log` (1h rolling window) | Yes | Loses recent self-step history; caps reset to full |
| Heartbeat handler idle timer | Yes | `idle_sec` starts from 0; handlers with high idle_threshold (1h+) won't fire immediately |
| CognitiveCycle `_consecutive_skips` | Yes | Stuck-cycle breaker counter resets; takes 8 more consecutive skips before it fires |
| SelfImprovementLoop `_last_run` (in-memory) | Yes, but immediately re-loaded from DB | One-turn gap where 0.0 could trigger false "never run" — but re-loaded in __init__ before should_run() is called |

The last row is worth noting: `_get_last_run_from_cycles()` loads from DB during `__init__` (line 179). If no cycle has ever been recorded (DB returns 0.0), `should_run()` returns True. A brand-new install or a wiped DB would schedule an immediate first run, which is correct behavior — the 7-day clock starts from that first run's record.

### Practical Conclusion

The daily deploy_check restart is **invisible** to the self-improvement schedule. The only scenario where it could matter is if restarts happen more frequently than once per day (e.g., multiple git pushes in a single night triggering multiple bounces), in which case the 180-second MIN_PROCESS_AGE guard prevents restart cascading. Even so, the self-improvement clock remains stable because it's DB-backed.

## What to Watch

- If the self-improvement cycle never fires for >7 days, check whether `_last_run` is actually being persisted (was the `self_improvement_cycles` table empty?)
- If a cycle runs but `_store_cycle()` fails silently (exception caught), the DB timestamp won't advance and the cycle will run every tick — check logs for persistence failures
- The `_get_last_run_from_cycles()` method uses `MAX(started_at)`, not `MAX(completed_at)`. A cycle that starts but never completes still advances the clock. This is intentional — a stuck cycle shouldn't trigger a redundant run