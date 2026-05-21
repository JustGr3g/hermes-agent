---
name: phase-2a-persistent-cognitive-state
description: "Persist ATHENA cognitive bridge state across gateway message boundaries so inner speech winners, metacognitive signals, and goal state survive between turns."
version: 1.0.0
author: Hermes Agent
metadata:
  hermes:
    tags: [cognition, bridge-state, persistence, gateway, continuity]
    related_skills: [cognitive-architecture-audit]
---

# Phase 2A: Persistent Cognitive State

## Problem

Every gateway message creates a fresh `AIAgent`, `CognitiveProcessor`, and `CognitiveAgent`. All ephemeral cognitive state (inner speech winner, metacognitive signals, goals, working memory summary) is lost between turns. The faithfulness filter (`verify_and_revise`) has no ground truth from the prior turn.

## Implementation

### Changes

1. **`hermes_state.py`** — Added `cognitive_state TEXT` column to sessions table. Added `update_cognitive_state(session_id, state)` and `get_cognitive_state(session_id)` methods. Schema auto-migrates via existing `_reconcile_columns()`.

2. **`agent/cognitive_processor.py`** — Added:
   - `session_id` param to `__init__` (passed through to `AgentConfig` for `CognitiveAgent`)
   - `@property bridge_state` — serializes `_last_cog` to compact JSON bridge (inner speech, goals, metacognition, confidence, greg profile, self-disclosure, time context, autonomy bypass)
   - `load_cog_state(json_str)` — reinflates `_last_cog` from stored JSON, pushes inner_speech_winner into `CognitiveAgent._last_inner_speech_winner`
   - Both are try/except guarded — failures are non-fatal, logged at debug

3. **`run_agent.py`** — Two integration points:
   - **Init-time**: after constructing `CognitiveProcessor`, load stored cog state from SessionDB (line ~1115)
   - **Post-turn**: after `record_completion()`, persist `bridge_state` to SessionDB (line ~13847)

## Files Modified

- `hermes_state.py` — schema + methods
- `agent/cognitive_processor.py` — serialize/deserialize
- `run_agent.py` — load on init, save after completion
- `cognitive_agent/agent.py` — no change needed (AgentConfig already has session_id field)

## Test Files Created

- `tests/agent/test_cognitive_state_persistence.py` — 6 tests: empty state, round-trip serialization, None-safe, idempotent deserialize
- `tests/test_hermes_state_cog.py` — 5 tests: DB read/write, round-trip, overwrite, column existence, nonexistent session

## Phase 2A Additions

### Persistent cognitive state
- `hermes_state.py` — Added `cognitive_state TEXT` column to sessions table
- `agent/cognitive_processor.py` — `@property bridge_state` + `load_cog_state()`
- `run_agent.py` — load on init, save after completion

### Unit test infrastructure (Phase 2A-2)
- **Shared test harness** at `tests/cognition/conftest.py` — 12 fixtures for all 8 cognitive subsystems + agent-level fixture + 3 known-state helpers (`populate_episodic()`, `populate_associative()`, `populate_wm()`)
- **7 dedicated test files** in `tests/cognition/` with 66 total tests:

| File | Subsystem | Tests |
|------|-----------|-------|
| `test_working_memory.py` | WorkingMemory | 15 |
| `test_metacognition.py` | MetacognitionEngine | 16 |
| `test_motivation.py` | MotivationSystem | 15 |
| `test_inner_speech.py` | InnerSpeechGenerator/Monitor | 8 |
| `test_episodic_memory.py` | Episodic/Associative/Retrieval | 12 |
| `test_perception.py` | PerceptionPipeline | 9 |
| `test_executive.py` | ExecutiveControl | 9 |

- All tests pass in 0.47s total
- All deterministic, no LLM calls, no network
- Uses `tempfile.mktemp(suffix=".db")` for DB isolation per test
- Reference: `cognitive-architecture-audit/references/phase-2b-build-details.md` has full per-system constructor signatures

### Fixture patterns
Fixtures in `tests/cognition/conftest.py` follow a consistent pattern:
```python
@pytest.fixture
def some_subsystem(db) -> SubsystemClass:
    inst = SubsystemClass(db_path=db, ...)
    yield inst
    inst.close()
```

Key differences per subsystem:
- **No DB needed:** WorkingMemory, InnerSpeechGenerator, InnerSpeechMonitor, ExecutiveControl
- **DB needed:** MotivationSystem, MetacognitionEngine, EpisodicMemory, AssociativeMemory
- **LLM=None always:** PredictiveProcessor, PerceptionPipeline, InnerSpeechGenerator — pass `ollama_client=None`
- **Low threshold for testing:** PerceptionPipeline(saliency_threshold=0.01, fast_path=False)

### Running tests
```bash
cd ~/cognitive-agent && hermes/venv/bin/python -m pytest tests/cognition/ -v --tb=short
cd ~/cognitive-agent && hermes/venv/bin/python -m pytest tests/cognition/test_working_memory.py -v
```

### Goal-directed loop exit
- `_check_goal_satisfaction()` method at line ~9966 — heuristic with 3 branches:
  - `llm_stopped_calling_tools` (confidence 0.9): ≥2 consecutive non-tool responses
  - `direct_question_answered` (confidence 0.7): simple query answered
  - `no_heuristic_match` (confidence 0.0): fallback
- Wired into main loop: break check at top of loop (~line 11916), satisfaction check after ATHENA record_result (~line 15098)
- Conservative: minimum 3 API calls, requires confidence ≥ 0.7
- Tests: `tests/run_agent/test_goal_directed_exit.py` (4 tests)

### Signal-driven memory extraction
- Replaced pure timer-based nudge with dual-trigger system at ~line 11599
- Signal path: checks ATHENA `_last_cog.metacognition` for `CORRECTED`, `GOAL_COMPLETION`, `CURIOSITY_SATISFIED`
- Timer fallback: fires at `max(nudge_interval * 2, 20)` turns
- Signal path fires immediately and resets timer
- Tests: `tests/run_agent/test_signal_driven_memory.py` (20 tests)

### Cognitive evaluation suite (Phase 2B-3)
- `tests/test_cognitive_benchmark.py` — 6 benchmark classes, 32 tests total
- Measures 6 cognitive metrics against Phase 2 targets:

| Benchmark | What It Measures | Target | Tests |
|-----------|-----------------|--------|-------|
| `TestRecallPrecision` | Cross-session episodic recall (precision@3, session-ID filter, importance ranking) | >80% precision@3 | 5 |
| `TestToolSelection` | Executive chooses correct ActionType per cognitive context (goal pursuit, low confidence, surprise) | >90% first-choice | 5 |
| `TestSelfConsistency` | Identical inputs produce <10% contradiction rate across inner speech, metacog, executive | <10% contradiction | 5 |
| `TestMemoryExtraction` | Signal-triggered extraction fires immediately on metacognitive signals vs waiting for timer | Signal > Timer | 5 |
| `TestGoalCompletion` | Goal lifecycle accuracy (active→complete/suspend/abandon, idempotent, priority ordering) | Agent detects goals, not LLM | 6 |
| `TestCompressionLoss` | Information loss baseline when episodes are summarized and re-retrieved | Establish baseline | 5 |

- Use `-m benchmark` marker to run only these, or `-k "TestCompressionLoss"` for one
- All tests are idempotent, deterministic, no LLM calls, complete in <500ms total

## Verification

```bash
cd ~/cognitive-agent
source hermes/venv/bin/activate
# Phase 2A — persistence round-trip
python -m pytest tests/agent/test_cognitive_state_persistence.py tests/test_hermes_state_cog.py -v
# Phase 2B-1/2B-2 — loop exit + signal extraction
python -m pytest tests/run_agent/test_goal_directed_exit.py tests/run_agent/test_signal_driven_memory.py -v
# Phase 2B-3 — cognitive benchmarks
python -m pytest tests/test_cognitive_benchmark.py -v --tb=short -m benchmark
# Full Phase 2 regression (all 71 tests)
python -m pytest tests/agent/test_cognitive_state_persistence.py tests/test_hermes_state_cog.py tests/run_agent/test_goal_directed_exit.py tests/run_agent/test_signal_driven_memory.py tests/test_cognitive_benchmark.py -v -m "benchmark or not benchmark"
```
