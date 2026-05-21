# Next Three Waves Implementation — May 14, 2026

## Session Overview
Implemented 4 code changes across `run_agent.py` and `agent/cognitive_processor.py`, all verified with passing tests. Gap closed: signals detected but not consumed → signals drive actual loop behavior.

## Wave 1 — Tool Success Rates in ATHENA COGNITIVE STATE Block
**File:** `hermes/agent/cognitive_processor.py`

- `get_cognitive_state()` now includes `tool_success_rates` from `ca.cognitive_state`
- `get_system_prompt_block()` renders a `Tool track record:` line (≥3 call threshold, sorted descending)
- Edge case: `state.get("tool_success_rates") or {}` — handles `None`

**Tests:** 4 new in `TestSystemPromptBlockToolRates`. 12/12 passed.

## Wave 2 — Richer Strategic Branching
**File:** `hermes/run_agent.py`

4 new state flags: `_wm_overloaded`, `_high_frustration`, `_high_failure_rate`, `_repeated_failure`
Expanded from single confidence check to 5 signals (confidence, wm_load, frustration, failure_rate, REPEATED_FAILURE)

**Tests:** 10 tests, 10/10 passed.

## Wave 4 — Cognitive Advisory in System Prompt
**File:** `hermes/run_agent.py`

Branching block builds `_cognitive_advisory` string (e.g. `[COGNITIVE ADVISORY: Low confidence (22%)]`) injected into `effective_system`. Each flag's advisory persists across loop iterations.

## Tier 1 — Structural Tool Enforcement
**File:** `hermes/run_agent.py`

1. `_unfiltered_tools` saved at init
2. Branching calls `_apply_cognitive_tool_filter()` or `_restore_unfiltered_tools()`
3. Enforcement: repeated_failure OR wm_overloaded → strip write tools; high_frustration → strip terminal/code_execution

## Testing Patterns
- **Branching:** FakeAgent with dict cognitive_state, no mocking framework
- **Cog block:** `monkeypatch.setattr(cp, "get_cognitive_state", lambda: state)` avoids delegation chain
- **Large-file edits:** Use `patch` tool for files > 5k lines; OpenCode for smaller files
