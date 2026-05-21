# Phase 3: Runtime Self-Model & Agentic Tool Selection — Plan & Results

**Date:** 2026-05-13
**Phase 2 status:** All 6 items complete
**Plan file:** `~/cognitive-agent/plans/phase3-runtime-self-model.md`

## Architecture

```
CognitiveAgent (cognitive_agent/agent.py)
  └─ @property cognitive_state → dict
       ├─ confidence, failure_rate, wm_load
       ├─ active_goals, metacognitive_signals
       ├─ inner_speech_winner, turn_count
       ├─ curiosity_level, frustration
       └─ try/except guarded — every subsystem read is safe

CognitiveProcessor (hermes/agent/cognitive_processor.py)
  └─ @property cognitive_state → dict
       ├─ delegates to CognitiveAgent.cognitive_state
       └─ returns safe defaults when uninitialized

run_agent.py
  └─ strategic branching via _low_conf_narrowed flag
       ├─ Set when cognitive_state.confidence < 0.3
       ├─ Reset per-turn at top of run_conversation()
       └─ Currently non-destructive (sets flag only)
```

## Status

### Phase 3A — Runtime Self-Model ✅ Complete

| Item | What | Files | Tests |
|------|------|-------|-------|
| 3A-1 | `CognitiveAgent.cognitive_state` property — 10 fields, all try/except guarded | `cognitive_agent/agent.py` | 11 in `tests/test_self_model_runtime.py` |
| 3A-2 | `CognitiveProcessor.cognitive_state` — bridge from Athena to Hermes | `hermes/agent/cognitive_processor.py` | 6 in `tests/agent/test_cognitive_processor_bridge.py` |
| 3A-3 | Strategic branching in `run_agent.py` — low-confidence check sets `_low_conf_narrowed` flag | `hermes/run_agent.py` | 5 in `tests/agent/test_strategic_branching.py` |

**Total new tests:** 22 (all pass)

### Phase 3B — Agentic Tool Selection Pending
### Phase 3C — Continuity Layer Pending

## Key Implementation Details

### CognitiveAgent.cognitive_state

Every subsystem access is try/except:
- `metacognition.confidence.get_confidence()` to `state["confidence"]`
- `metacognition.decision.get_failure_rate()` to `state["failure_rate"]`
- `wm.cognitive_load` to `state["wm_load"]`
- `motivation.get_active_goals()[:5]` to `state["active_goals"]`
- `metacognition.peek_signals()[:5]` to `state["metacognitive_signals"]`
- `speech_monitor.recent(1)[-1].content` to `state["inner_speech_winner"]`
- `motivation.get_state().curiosity_level` to `state["curiosity_level"]`
- `1.0 - motivation_state.valence` to `state["frustration"]`
- `self._step_count` to `state["turn_count"]`

### CognitiveProcessor bridge

Simple delegation to `self._systems["cognitive_agent"].cognitive_state`.
Returns default dict (confidence=0.5, all zeros) when agent isn't loaded.
No changes to any `cognitive_agent/` files.

### Strategic branching in run_agent.py

Added after ATHENA `record_result()` call. Checks `cognitive_processor.cognitive_state` for confidence < 0.3 and sets `self._low_conf_narrowed = True` with a log line. Reset to False at top of `run_conversation()`. Non-destructive: only sets a flag, doesn't change tool loading yet.

## References

- Full plan: `plans/phase3-runtime-self-model.md`
