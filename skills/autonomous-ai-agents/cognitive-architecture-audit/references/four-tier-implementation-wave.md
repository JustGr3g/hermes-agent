# Four-Tier Implementation Wave — May 14, 2026

**Status:** All 4 tiers complete. 143+ tests passing across cognitive + Hermes agent suites.

## Inventory

| Tier | What | Files | Lines changed | Tests |
|------|------|-------|--------------|-------|
| 1 | Structural tool enforcement | `run_agent.py` | ~80 | 10 branching (existing) |
| 2 | CognitivePlanner + CognitiveExecutor | `planner.py`, `executor.py` (new), `loop.py` (patch) | ~430 | 115 cognition |
| 3 | Compression continuity | `episodic.py`, `run_agent.py`, `cognitive_processor.py` | ~100 | 115 cognition + 28 Hermes |
| 4 | Plan/milestone integration | `cognitive_cycle.py` | ~30 | 115 cognition + 28 Hermes |

## Item #3 (post-wave) — Continuous Experience

| Component | Files | Lines changed | Tests |
|-----------|-------|--------------|-------|
| Idle thinking heartbeat handler | `agent.py` | ~120 | 121 cognition (6 new) + 28 Hermes |

## Key files created

- `cognitive_agent/cognition/planner.py` — deterministic signal-based strategy selector (5 rules, no LLM calls)
- `cognitive_agent/cognition/executor.py` — 5 strategy implementations (reflect, retrieve, simplify, replan, wait)
- `tests/cognition/test_idle_think.py` — 6 tests for continuous experience

## Key files modified

- `hermes/run_agent.py` — `_unfiltered_tools` save, `_apply_cognitive_tool_filter()`, `_restore_unfiltered_tools()`, pre-compression episodic archiving
- `hermes/agent/cognitive_processor.py` — pre-compression state metrics in context injection
- `cognitive_agent/memory/episodic.py` — `get_by_tags()` method
- `cognitive_agent/cognition/loop.py` — `wm_capacity` added to observe state dict
- `cognitive_agent/cognition/cognitive_cycle.py` — plan/milestone resolution in `_tick_locked()`

## Implementation approach that worked

1. **Direct `patch()` for single-file edits** — no OpenCode needed for small, targeted changes
2. **Direct `write_file()` for new files** — faster than OpenCode, avoids multi-file creation stall
3. **Tests after every tier** — no regression sweeps, each tier independently verified
4. **OpenCode only for file creation** — used to create `planner.py` and `executor.py` (worked after earlier stall pattern was avoided by splitting into single-file-per-call)
