# Behavioral Learning (Phase 13H #2) — May 15, 2026

## Architecture

```
ToolOutcomeStore ─┐
Critic (episodic) ─┤──→ PatternLearner.extract() ──→ learned_patterns table ──→ get_status() → /think
Metacognition    ─┘
```

## Module: `cognitive_agent/pattern_learner.py` (518 lines)

### Schema
- SQLite table `learned_patterns` with columns: id, pattern_hash (16-char SHA-256 suffix), pattern_type, title, condition, observation, recommendation, confidence, sample_count, first_seen_at, last_seen_at, dismissed
- Hash-based dedup: same `pattern_type||condition` hash only stores once per 24h

### Detection types

Each runs in a `_detect_*` method and returns `list[LearnedPattern]`:

1. **`_detect_tool_failure_conditions`** — Per-tool failure rate >40% with >=5 samples -> pattern with confidence 0.5 + (fail_rate - 0.4)*0.5, capped at 0.95
2. **`_detect_kind_failure_conditions`** — Per-kind failure rate >40% with >=5 samples across any tools sharing that kind (added May 31, Phase 5 domain transfer). Uses `_resolve_kind(tool_name)` callable wired from `ToolRegistry`. Condition format: `kind:<name>`. Cold-start: a new tool with 0 samples inherits its kind's failure pattern immediately.
3. **`_detect_repeated_failure_chains`** — Tool failures within 10min preceding HIGH_FRUSTRATION/REPEATED_FAILURE signals -> "tool failures trigger stress"
3. **`_detect_wm_overload_triggers`** — >3 tool calls in 2 minutes preceding WM_OVERLOAD -> pattern with density-based confidence
4. **`_detect_strategy_mismatches`** — Critic lesson episodes (content starts with "Turn quality=") with `failed_strategies:` token -> patterns for strategies that degraded 2+ times

### Constants
- `MIN_SAMPLES = 5` — minimum observations before pattern stored
- `MIN_CONFIDENCE = 0.35` — minimum confidence to surface
- `DEDUP_WINDOW_HOURS = 24` — same hash dedup window
- `MIN_RUN_INTERVAL_SEC = 1800` — 30 min cooldown between runs
- `SCAN_WINDOW_HOURS = 72` — lookback window per extraction

### Public API
- `extract(tool_outcomes, recent_episodes, metacognitive_events, now=None, force=False) -> int`
- `get_active_patterns(limit=10) -> list[dict]`
- `get_active_patterns_by_type(pattern_type, limit=5) -> list[dict]`
- `dismiss(pattern_id) -> bool`
- `get_stats() -> dict`

### Wiring points
- `CognitiveAgent.__init__` (agent.py:569-575): after tool_outcomes, `self.pattern_learner = PatternLearner(...)`
- `CognitiveAgent._run_pattern_extraction()` (agent.py:5775): gathers data from ToolOutcomeStore + episodic + metacognition -> PatternLearner.extract()
- Heartbeat `extract_patterns` (agent.py:1228-1249): 1800s interval, idle>=5min
- `cognitive_state` property (agent.py:5044): `state["patterns"] = pattern_learner.get_active_patterns(limit=5)`
- `get_cognitive_state()` in cognitive_processor.py (line 1098): mirrors patterns from ca
- `get_system_prompt_block()` in cognitive_processor.py (line 1155): "Learned patterns from experience:" section
- `get_status()` in agent.py (line 5771): returns patterns for /think

## Resolved — API mismatch fixed (May 15, follow-up session)

The original `_run_pattern_extraction()` called `self.tool_outcomes.get_recent(hours=72, limit=500)` — a method that doesn't exist on `ToolOutcomeStore`. `ToolOutcomeStore` has:
- `get_success_rate(tool_name, window_days)`
- `get_all_success_rates(window_days)`
- `record(tool_name, success, latency_ms, ...)`
- `rank_tools(candidates, window_days)`
- `get_recent_outcomes(hours, limit)` — added May 15 for the pattern learner

**Fix applied:** `_run_pattern_extraction()` now calls `get_recent_outcomes()` instead of `get_recent()`. All 183 tests pass across:
- `test_pattern_learner.py` (19 tests)
- Full cognition suite (112 tests)
- Cognitive benchmarks (32 tests)
- Self-model runtime (11 tests)
- Hermes cognitive integration (28 tests, including bridge + introspection + persistence + drift)

## Tests: `tests/cognition/test_pattern_learner.py` (19 tests)

All pass in 0.06s. Covers: schema, tool failure detection (4 sub-tests), repeated failure chain (2), WM overload (2), strategy mismatch (2), dedup, dismiss (2), cooldown, stats.
