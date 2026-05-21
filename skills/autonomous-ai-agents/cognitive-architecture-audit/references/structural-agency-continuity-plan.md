# Structural Agency & Cognitive Continuity — Plan & Status

**Source:** `plans/structural-agency-and-continuity.md` (May 14, 2026)
**Context:** Following the three-wave implementation (tool success rates in cog block, rich strategic branching flags, cognitive advisory injection), this plan addressed four remaining architectural gaps.

## Four Tiers — ALL BUILT

| Tier | What | Status | Files | Tests |
|------|------|--------|-------|-------|
| 1 | Structural enforcement of branching flags — physically strip tool schemas from the API call when flags are active | **DONE** | `run_agent.py` (~80 lines) | 10 branching tests |
| 2A | CognitivePlanner — deterministic signal-based strategy selector | **DONE** | `cognitive_agent/cognition/planner.py` (4.1k) | 115 cognition tests |
| 2B | CognitiveExecutor — strategy runner with safe degradation | **DONE** | `cognitive_agent/cognition/executor.py` (7.8k) | 115 cognition tests |
| 3 | Compression continuity — save pre-compression reasoning traces as tagged episodes | **DONE** | `run_agent.py`, `episodic.py`, `cognitive_processor.py` (~100 lines) | 115 + 28 tests |
| 4 | Plan tree integration — connect goals to plan milestones in CognitiveCycle.tick() | **DONE** | `cognitive_cycle.py` (~30 lines) | 115 + 28 tests |

## Key files

- `cognitive_agent/cognition/planner.py` — 5 deterministic strategy rules (no LLM calls)
- `cognitive_agent/cognition/executor.py` — 5 strategy implementations: reflect, retrieve, simplify, replan, wait
- `hermes/run_agent.py` — `_unfiltered_tools` save, `_apply_cognitive_tool_filter()`, `_restore_unfiltered_tools()`, pre-compression episodic archiving
- `hermes/agent/cognitive_processor.py` — pre-compression state metrics in context injection
- `cognitive_agent/memory/episodic.py` — `get_by_tags()` method
- `cognitive_agent/cognition/loop.py` — `wm_capacity` added to observe state dict
- `cognitive_agent/cognition/cognitive_cycle.py` — plan/milestone resolution in `_tick_locked()`

## Post-wave addition: Continuous Experience (Item #3)

Idle thinking heartbeat handler added (`cognitive_agent/agent.py`, ~120 lines) with 6 dedicated tests in `tests/cognition/test_idle_think.py`.

## May 17 live verification

All 4 tiers verified on disk with grep for method signatures, file existence checks, and test file counts. `planner.py` and `executor.py` confirmed present (not missing as earlier PLUR memory had claimed). See conversation May 17, 2026 for the full verification transcript.

## Current phase

All tiers are built and unit-tested. The architecture now enters Phase 4: post-completion live validation — proving each subsystem works in real production sessions, not just test isolation.
