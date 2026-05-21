# Tiered Implementation Wave — May 14, 2026

## What was built

4 tiers across a single long session, implementing the structural-agency-and-continuity plan:

| Tier | What | Files | Tests |
|------|------|-------|-------|
| 1 | Structural enforcement of branching flags | `run_agent.py` (~80 lines) | 10/10 branching |
| 2 | CognitivePlanner + CognitiveExecutor | 2 new files (~430 lines) + `loop.py` patch | 115 cognitive |
| 3 | Compression continuity via episodic archiving | `episodic.py`, `run_agent.py`, `cognitive_processor.py` (~100 lines) | 143 total |
| 4 | Plan tree integration in CognitiveCycle | `cognitive_cycle.py` (~30 lines) | 143 total |

## Key techniques

- **For creating new files:** Use `write_file()` directly — faster and more reliable than OpenCode for pure creation. Both CognitivePlanner (~180 lines) and CognitiveExecutor (~250 lines) were written this way with lint-verified success.
- **For editing large files (>5k lines):** Use `patch()` with exact before/after strings instead of OpenCode. Three successful patches on `run_agent.py` (16k lines) with no timeouts.
- **For editing smaller files (<5k lines):** OpenCode with the targeted single-file pattern works well. `cognitive_processor.py` (~1.3k lines) had two successful OpenCode edits.
- **For test updates:** OpenCode handles bulk test additions reliably. The branching test file grew from 6→10 tests (164→467 lines) in one successful OpenCode dispatch.

## Verification pattern

After each tier, run BOTH test suites:
```bash
# Cognitive tests
cd ~/cognitive-agent && hermes/venv/bin/python3 -m pytest tests/cognition/ -q
# Hermes tests (via wrapper for CI parity)
cd ~/cognitive-agent/hermes && scripts/run_tests.sh tests/agent/test_*.py -q
```

All tiers passed without regression. Total test count: 143 cognitive + 28 Hermes.

## Architecture state after this wave

| Subsystem | Status |
|-----------|--------|
| 8-system cognitive engine | ✅ Full |
| Cross-session state persistence | ✅ Full |
| Autonomous heartbeat + goal pursuit | ✅ Full |
| Goal-directed loop exit | ✅ Full |
| Signal-driven memory extraction | ✅ Full |
| Tool success rates tracked + LLM-visible | ✅ Full |
| Strategic branching (5 signals → LLM advisory) | ✅ Full |
| Structural enforcement (tool stripping) | ✅ Full |
| CognitivePlanner + CognitiveExecutor | ✅ Full (NEW) |
| Compression reasoning continuity | ✅ Full (NEW) |
| Plan tree → goal resolution | ✅ Full (NEW) |
| Sleep/consolidation cycle | ✅ Full |
| Narrative self-model + value drift | ✅ Full |
| Faithfulness filter | ✅ Full |

## File paths created this session

- `cognitive_agent/cognition/planner.py` (180 lines)
- `cognitive_agent/cognition/executor.py` (250 lines)
- `plans/structural-agency-and-continuity.md` (plan document)

## Plans/initiatives hierarchy (for context)

The plans.py system (723 lines) provides initiatives→plans→miletones→goals hierarchy. The Goal dataclass in motivation.py already has `plan_id` and `milestone_index` fields. The auto-completion wiring via `_on_terminal_transition` was already in place. Tier 4 connected CognitiveCycle.tick() to this existing infrastructure.
