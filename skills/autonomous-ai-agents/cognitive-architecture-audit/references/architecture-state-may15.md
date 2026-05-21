# Architecture State — May 15, 2026

Verified assessment of all 6 growth roadmap items after implementing #4 (Live Self-Model) and #2 (Behavioral Learning).

## Six-Item Roadmap

| # | Item | Status | What exists | What's missing |
|---|------|--------|-------------|----------------|
| 3 | Continuous Experience | ✅ FULLY DONE | `_generate_idle_thought()` in agent.py, heartbeat at 60s/120s-idle threshold, 6 tests in test_idle_think.py | Nothing — produces inner speech utterances, stores episodes, self-limiting |
| 4 | Live Self-Model | ✅ FULLY DONE | `introspect` tool (cognitive_introspection_tool.py, 9 tests), narrative self-model in get_system_prompt_block(), `/state` slash command + CLI handler (aliases: `cog`), 9 tool tests | Nothing — covers mid-turn query, narrative self-excerpt, and user-facing state display |
| 2 | Behavioral Learning | 🟡 PARTIAL | PatternLearner module (518 lines, 19 tests), ToolOutcomeStore.get_recent_outcomes(), heartbeat handler at 1800s, wired in `__init__`, `cognitive_state`, and `get_system_prompt_block()` | One API mismatch in `_run_pattern_extraction()` calls `ToolOutcomeStore.get_recent()` which doesn't exist — needs changing to `get_recent_outcomes()` |
| 1 | Plan Decomposition | ❌ NOT BUILT | Plans.py (723 lines) + Goal dataclass with plan_id/milestone_index exists. Auto-completion wiring via `_on_terminal_transition` exists. | No PlanDecomposer heartbeat that calls LLM to convert milestones into sub-Goals with dependencies/completion criteria |
| 5 | Editorial Judgment | ❌ NOT BUILT | Nothing exists | No AestheticEvaluator module — emergent property requiring all previous layers |
| 6 | Self-Improvement Loop | ❌ NOT BUILT | Nothing exists | Capstone — requires all 5 preceding layers to be trustworthy |

## Key verification pattern used correctly

When checking #3 (idle_think), this pattern was run:

```python
search_files(path="agent.py", pattern="def _idle_think|def _generate_idle_thought")
search_files(path="test_idle_think.py")  # check if tests exist
search_files(path="agent.py", pattern="idle_think")  # heartbeat registration
```

All four turned up positive — method, contentful logic, registration, and 6 tests. Correctly reported as DONE rather than proposing redundant work. This is the same discipline that failed in May 12-14 sessions (Pitfall #8) now being applied correctly.

## Test counts

| Suite | Tests | Notes |
|-------|-------|-------|
| All cognition unit | 112 | 8 files (perception, wm, metacog, motivation, executive, inner_speech, episodic, idle_think, pattern_learner) |
| Cognitive benchmarks | 32 | recall precision, tool selection, self-consistency, memory extraction, goal completion, compression loss |
| Introspection tool | 9 | available states, schema, registry, roundtrip |
| Strategic branching | 10 | branching flags, tool filtering |
| Cognitive state persistence | 6 | bridge state |
| Cognitive processor bridge | 7 | state delegation, system prompt block |
| Signal-driven memory | 20 | extraction triggers |
| **Total** | **196** | |
