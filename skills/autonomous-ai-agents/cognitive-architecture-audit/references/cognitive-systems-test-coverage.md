# Cognitive Systems Test Coverage (May 13, 2026)

## Total Tests: 152 cognitive tests across 10 files

### Phase 2A-2 (new): `tests/cognition/` — 84 tests, 0.47s

| System | File | Tests | Coverage |
|--------|------|-------|----------|
| WorkingMemory | `test_working_memory.py` | 15 | Capacity, TTL, eviction, source filter, clear, serialization, cognitive load, summary, priority, remove, evict_lowest, duplicate ID, arousal factor, empty state |
| Metacognition | `test_metacognition.py` | 16 | Low confidence, repeated failure, correction dampening, goal completion, signal buffer, peek non-destructive, WM overload threshold, uncertainty assessment, retrieval confidence, adaptive signal shape, double-correction safety, decision outcomes, uncertainty rise, maintenance, corrected trigger |
| Motivation | `test_motivation.py` | 15 | Create goal, by-source, complete idempotent, suspend/resume, abandon, priority ordering, frustration threshold, active filtering, not-found, autonomy bypass, pursuit toggle, transitions, self-proposed count, persistence, goal attributes |
| InnerSpeech | `test_inner_speech.py` | 8 | Generate all 5 speech types, content non-empty, monitor tracking, window limit |
| EpisodicMemory | `test_episodic_memory.py` | 12 | Store/retrieve, activation decay, session scoping, importance ordering, multi-session, nonexistent, terminal flag, retrieval API, associative basic ops, spreading activation, query classifier |
| Perception | `test_perception.py` | 10 | Saliency threshold, set_threshold, construct, raw input modalities (text/image), fast_path state, PreAttentiveFilter returns dict, urgency detection, emotion detection, pipeline process shape |
| Executive | `test_executive.py` | 8 | Construct, returns ActionDecision, initial valid type, status shape, reasoning included, corrected→RETRIEVE, repeated_failure→SUSPEND, valid action type, priority range |

### Phase 2A (previous): `tests/agent/` + `tests/` — 11 tests

| Feature | File | Tests |
|---------|------|-------|
| Cognitive state persistence | `test_cognitive_state_persistence.py` | 6 (empty state, serialization round-trip, None-safe, idempotent) |
| Hermes state cog column | `test_hermes_state_cog.py` | 5 (DB read/write, round-trip, overwrite, column existence, nonexistent session) |

### Phase 2B-1: `tests/run_agent/` — 4 tests

| Feature | File | Tests |
|---------|------|-------|
| Goal-directed loop exit | `test_goal_directed_exit.py` | 4 (goals satisfaction check, heuristic branches) |

### Phase 2B-2: `tests/run_agent/` — 20 tests

| Feature | File | Tests |
|---------|------|-------|
| Signal-driven memory extraction | `test_signal_driven_memory.py` | 20 (signal-triggered nudge, timer fallback, signal types) |

### Phase 2B-3: `tests/` — 32 tests

| Benchmark | File | Tests | Measures |
|-----------|------|-------|----------|
| RecallPrecision | `test_cognitive_benchmark.py` | 5 | >80% precision@3, session-ID filtering, importance ranking, false positive rejection |
| ToolSelection | `test_cognitive_benchmark.py` | 5 | >90% first-choice correctness for 5 scenarios (goal pursuit, low confidence, surprise, execute, strategy shift) |
| SelfConsistency | `test_cognitive_benchmark.py` | 5 | <10% contradiction rate across inner speech, executive, metacognition, WM |
| MemoryExtraction | `test_cognitive_benchmark.py` | 5 | Signal-driven fires immediately, timer fallback, buffer clear, correction→confidence drop, surprise→adaptive retrieval |
| GoalCompletion | `test_cognitive_benchmark.py` | 6 | Active→completed/suspended/abandoned, priority ordering, double-complete idempotent, invalid transitions |
| CompressionLoss | `test_cognitive_benchmark.py` | 5 | Importance-weighted retrieval, key-term preservation, recency preference, baseline measurement |

### Pre-existing: `tests/test_smoke.py` — ~160 tests (not duplicated)

160 tests across all 8 cognitive systems in a monolithic 107KB file. The new `tests/cognition/` files add coverage for edge cases, boundary conditions, and state machine transitions that `test_smoke.py` doesn't cover.

## Running

```bash
# All cognitive unit tests
cd ~/cognitive-agent && hermes/venv/bin/python -m pytest tests/cognition/ -v --tb=short

# Plus benchmarks
cd ~/cognitive-agent && hermes/venv/bin/python -m pytest tests/test_cognitive_benchmark.py -v --tb=short -m benchmark

# Plus Phase 2B tests
cd ~/cognitive-agent && hermes/venv/bin/python -m pytest tests/run_agent/ -v --tb=short

# All together
cd ~/cognitive-agent && hermes/venv/bin/python -m pytest tests/cognition/ tests/run_agent/ tests/test_cognitive_benchmark.py -v --tb=short
```

## Running Time: ~1.2s for all 116 new tests

## Existing Implementation (no new tests needed)

- **Consolidation cycle** (Phase 9B): `agent.py:5191` `CognitiveAgent.consolidate()` — clusters episodes by concept, generates summaries, marks sources terminal, archives overflow. Registered as `consolidate` heartbeat handler at `agent.py:756` (30min idle, 30min interval). Tests at `test_smoke.py:1665-1767` (4 tests: cluster formation, no-theme skip, tool-result skip, empty skip).
- **Adaptive thresholds** (Phase 9A): `metacognition.py` `MetacognitionEngine.adapt_thresholds()` — adjusts WM overload/frustration thresholds based on 7-day event history. Registered as `adapt_thresholds` heartbeat handler.
- **Activation decay**: `agent.py` `_maintenance_decay()` — calls `episodic.decay_activation(factor=0.02)`. Registered as `decay_activation` heartbeat handler.
