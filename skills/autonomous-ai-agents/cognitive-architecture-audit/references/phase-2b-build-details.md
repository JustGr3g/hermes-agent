# Phase 2B Build Details (May 13, 2026)

## Source of Truth

ATHENA's cognitive agent lives at `~/cognitive-agent/` (NOT under `~/cognitive-agent/hermes/`). The hermes repo under `~/cognitive-agent/hermes/` contains only the run_agent.py integration points and Hermes-side tools. All 8 cognitive systems are in `~/cognitive-agent/cognitive_agent/`.

Tests live at `~/cognitive-agent/tests/`. Test venv is `~/cognitive-agent/hermes/venv/bin/python3`.

## Subsystem Test Patterns

### Conftest isolation (`tests/conftest.py`)
- Sets `ATHENA_DB_PATH` to `tempfile.mktemp()` session-wide
- Sets `ATHENA_DISABLE_OUTBOUND=1` to block live Telegram/bus writes
- `pytest_configure(config)` registers custom markers (e.g. `benchmark`)

### Fixtures used in cognitive tests
```python
@pytest.fixture
def db():
    path = tempfile.mktemp(suffix=".db")
    yield path
    try: os.unlink(path)
    except FileNotFoundError: pass

@pytest.fixture
def agent(db):
    config = AgentConfig(
        db_path=db,
        enable_inner_speech=True,
        enable_predictive=True,
        saliency_threshold=0.01,
    )
    a = CognitiveAgent(config=config)
    a.perception.scorer._fast_path_enabled = False
    yield a
    a.close()
```

## Discovered API Quirks (Phase 2A-2 — May 13, 2026)

### Per-System Constructor Signatures

| Subsystem | File | Constructor | Notes |
|-----------|------|-------------|-------|
| WorkingMemory | `cognition/working_memory.py:75` | `__init__(max_capacity=7)` | No DB needed. Items have `load_weight` (not just saliency). Use `add(content, saliency, ...)` or `add_item(WMItem(...))`. |
| MotivationSystem | `cognition/motivation.py:415` | `__init__(db_path=None)` | Creates `goals`, `motivation_state`, `aspirations`, `tasks` tables. Need `db` fixture for isolation. |
| MetacognitionEngine | `cognition/metacognition.py:314` | `__init__(db_path=None, frustration_threshold=0.6, wm_overload_threshold=0.70)` | Creates `metacognitive_events` + `cognitive_params` tables. `emit_correction()` trims confidence by 10% (floor 0.2). `assess_wm_pressure(wm_load)` returns MetaSignal or None. |
| InnerSpeechGenerator | `cognition/inner_speech.py:99` | `__init__(ollama_client=None)` | Rule-based templates when no LLM. `generate(SpeechType, ...)` returns `InnerUtterance`. Helper methods: `generate_reflection()`, `generate_self_question()`, etc. |
| InnerSpeechMonitor | `cognition/inner_speech.py:472` | `__init__()` | No params. `MAX_HISTORY=50`. `emit(utterance)` tracks; `get_stats()` returns `{'utterance_count': N}`. |
| ExecutiveControl | `cognition/executive.py:73` | `__init__(working_memory=None, motivation=None, metacognition=None, predictive=None)` | All params optional. Default `decide()` returns `CONTINUE_DIALOGUE`. |
| PredictiveProcessor | `cognition/predictive.py:362` | `__init__(associative_memory=None, episodic_memory=None, metacognition=None, ollama_client=None)` | Requires memory instances. |
| PerceptionPipeline | `cognition/perception.py:434` | `__init__(ollama_client=None, saliency_threshold=0.35, fast_path=True, vision_client=None)` | `process(RawInput)` returns `(AttendedItem or None, metadata_dict)`. `_fast_path_enabled=False` ensures all inputs scored. |
| EpisodicMemory | `memory/episodic.py` | `__init__(db_path=None)` | Episode fields: id, session_id, timestamp, content, summary, importance, activation, emotional_tags, source_kind. `get_recent(hours=48, limit=20)` sort=activation. |
| AssociativeMemory | `memory/associative.py` | `__init__(db_path=None)` | `add_edge(a, b, weight=0.9)`, `spreading_activation(seeds, depth=N)`, `get_neighbors(label)`. |
| MemoryRetrieval | `memory/retrieval.py:145` | `__init__(db_path=None, episodic=None, associative=None)` | `retrieve(context={'query': str, 'session_id': str}, affective_state={'importance': float, 'curiosity': float})` -> `RetrievalResult`. |

### Fixture Architecture (tests/cognition/conftest.py)

All cognitive subsystem fixtures follow this pattern:
```python
@pytest.fixture
def some_subsystem(db) -> SubsystemClass:
    inst = SubsystemClass(db_path=db, ...)
    yield inst
    inst.close()
```

Key decisions:
- `WorkingMemory` and `InnerSpeechGenerator`/`InnerSpeechMonitor` don't need DB — they use no-arg constructors
- `MetacognitionEngine` and `MotivationSystem` need DB — they persist to SQLite
- `PredictiveProcessor` creates its own EpisodicMemory and AssociativeMemory internally — pass `ollama_client=None` to avoid real LLM calls
- `ExecutiveControl` takes optional references to WM/motivation/metacog/predictive — all can be None
- `PerceptionPipeline` with `saliency_threshold=0.01, fast_path=False` ensures all inputs are attended

### ConfidenceTracker API Surface
- `record_retrieval(self, query, hit, retrieved_count)` — uses `retrieved_count` not `count`
- `record_action_outcome(self, action_type, success, surprise=0.0)` — Phase 13H #11
- `get_confidence()` -> float
- `action_success_rate()` -> float (0..1, or -1 if empty)
- `reset()` — clears both retrieval and action history

### MetacognitionEngine signal emission
- `_emit(signal, context, data=None)` — adds to internal deque + persists to `metacognitive_events` table
- `peek_signals()` — non-destructive read of pending signals
- `get_pending_signals()` — destructive read (returns all pending, clears queue)
- `emit_correction(excerpt)` — fires CORRECTED signal AND reduces confidence by 10% (floor 0.2)
- `emit_goal_completion(goal_id, goal_content)` — fires GOAL_COMPLETION signal
- `emit_uncertainty_rise(prev, curr, delta_threshold=0.2)` — fires UNCERTAINTY_RISE when delta > threshold

### WorkingMemory.add() signature
```python
def add(self, content: str, saliency: float, source: str = "perception",
        load_weight: float = 0.1, ttl: Optional[float] = None) -> WMItem:
```
NOT `add(WMItem(...))`. Use `add_item(WMItem(...))` for pre-constructed items.

## Running Benchmarks

```bash
cd ~/cognitive-agent && hermes/venv/bin/python -m pytest tests/test_cognitive_benchmark.py -v --tb=short -m benchmark
cd ~/cognitive-agent && hermes/venv/bin/python -m pytest tests/test_cognitive_benchmark.py -v --tb=short -k "TestToolSelection"
```
