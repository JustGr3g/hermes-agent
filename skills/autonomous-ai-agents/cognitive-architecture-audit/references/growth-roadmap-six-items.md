# Growth Roadmap — Six Cognitive Items

**Date:** 2026-05-15
**Status:** #3 done, rest pending in priority order
**Source:** Derived from next-three-waves plan and this session's verification audit

## The Six Items and Dependencies

```
#3 (experience) → #4 (self-model) → #2 (learning) → #1 (decomposition) → #5 (taste) → #6 (self-improvement)
```

Each step unlocks the next. The first three (#3, #4, #2) form a tight cluster that turns the system from reactive to continuous and adaptive. The last three (#1, #5, #6) build genuine agency and self-direction on top.

## Current Status Per Item

### ✅ #3 — Continuous Experience (DONE)
**What:** Idle thinking keeps inner speech alive across idle gaps so the bridge carries temporal continuity.
**Files:** `agent.py:2519` (`_generate_idle_thought`), heartbeat registered at `agent.py:1127-1132` (60s interval, 120s idle threshold)
**Tests:** `tests/cognition/test_idle_think.py` — 6 tests
**Key detail:** Deterministic templates only (no LLM), self-limiting (skips if <60s since last), stores episodes tagged `idle_think=1`
### ✅ #4 — Live Self-Model (DONE — May 15 session)\n\n**What:** The agent can query its own cognitive state mid-turn, not just at turn start. Includes introspection tool + surfaced narrative model + /state command.\n**What exists:**\n- `CognitiveAgent.cognitive_state` property (agent.py:4931) — structured dict: confidence, wm_load, goals, signals, inner_speech, tool_success_rates\n- `CognitiveProcessor.get_cognitive_state()` (cog_proc.py:1010) — richer version covering all 8 subsystems\n- `get_system_prompt_block()` (cog_proc.py:1101) — injects state into system prompt each turn, now includes narrative self-model excerpt\n- `bridge_state` serialization (cog_proc.py:1145) — survives gateway boundaries\n- NarrativeSelfModel (self_model.py:1-145) — daily 200-word LLM-generated self-summary, persisted to SQLite\n- ValueDriftMonitor (self_model.py:148-217) — weekly cosine-similarity check on goal concept drift\n- Heartbeat: `generate_self_model` every 6h, `check_value_drift` weekly\n- `introspect` tool (`tools/cognitive_introspection_tool.py`) — LLM-callable mid-turn tool, module-level `_current_cog_instance` pattern, wired in `run_agent.py` line 1079\n- `/state` slash command with `cog` alias — Rich-formatted panel showing confidence, WM load, goals, signals, tool rates\n- 9 tests in `tests/tools/test_cognitive_introspection.py` — full coverage of tool behavior, schema, registry\n**Next:** Move to #2 (Behavioral Learning)

### ❌ #2 — Behavioral Learning
**What:** Structured pipeline that reads recent episodes, identifies patterns ("when frustrated, I pick failing tools"), and writes generalized lessons to a queryable store.
**What exists (partial):** Episodic memory stores outcomes, tool_success_rates tracks per-tool stats, Critic writes lesson episodes
**Missing:** No learning cycle that produces actionable knowledge, not just logged data

### ❌ #1 — Plan Decomposition
**What:** When a plan milestone is active, the system decomposes it into sub-Goal objects with dependencies, deadlines, and completion criteria. Motivation system pursues subgoals; when all done, milestone completes automatically.
**What exists:** Plans.py infrastructure, Goal dataclass with `plan_id`/`milestone_index`, auto-completion wiring via `_on_terminal_transition`
**Missing:** No `PlanDecomposer` handler that calls LLM to decompose milestones into 2-5 sub-Goals

### ❌ #5 — Editorial Judgment / Taste
**What:** The ability to distinguish elegant from adequate. An AestheticEvaluator that scores outputs on simplicity, coherence, parsimony against a baseline from past episodes.
**Missing:** No module exists. Requires #2 (pattern data) and #4 (perspective) to ground judgments.

| ❌ (completed) #2 | Behavioral Learning | 2026-05-15 | ✅ Implemented |

### ✅ #6 — Structural Self-Improvement Loop
**What:** Weekly self-audit diagnostic reads cognitive metrics, identifies weakest subsystem, creates improvement goal via GoalDecomposer, tracks completion.
**Status:** ✅ FULLY DONE — `cognitive_agent/cognition/self_improvement.py` (679 lines). `SelfImprovementLoop` class with deterministic multi-subsystem diagnosis (10 subsystems: 5 aesthetic dims + tool_selection + strategy + wm_management + confidence + frustration), creates improvement goals, tracks lifecycle in SQLite with cooldown (skip after 3 consecutive failures per subsystem). Heartbeat at 7-day interval, 30min idle threshold. Surfaces `[ATHENA SELF-IMPROVEMENT STATE]` in system prompt. Wired in agent.py init, cognitive_state, get_status, heartbeat handler gathers diagnostic data from PatternLearner + AestheticEvaluator + GoalDecomposer + metacognition + tool_outcomes. 42 tests pass. May 16, 2026.

## Verification Procedure for Picking Up

When resuming work on a new item from this roadmap, always:

1. **Read the item's description** from the reference above to understand what "done" means
2. **Search codebase** for existing implementations before claiming anything missing:
   ```python
   search_files(path="agent.py", pattern="def method_name")
   search_files(path="*.py", pattern="heartbeat.register.*handler_name")
   ```
3. **Verify consumption path** — even if a method exists, check whether its output actually gets to the LLM or the agent loop
4. **Run the full cognition suite** after any change:
   ```bash
   cd ~/cognitive-agent && hermes/venv/bin/python3 -m pytest tests/cognition/ tests/test_cognitive_benchmark.py -q
   cd ~/cognitive-agent/hermes && scripts/run_tests.sh -q -- tests/agent/test_strategic_branching.py tests/agent/test_cognitive_state_persistence.py tests/agent/test_cognitive_processor_bridge.py tests/agent/test_context_compressor_summary_continuity.py tests/test_hermes_state_cog.py
   ```

## Session Reference

This roadmap was first articulated in a May 15, 2026 session where it was verified against live code (all 93 cognitive + 146 Hermes integration tests passing). Item #3 (idle_think) was confirmed fully implemented. The prioritized order and dependency chain were preserved from the original "next three waves" plan.
