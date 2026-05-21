# Editorial Judgment (Phase 13H #5) — May 16, 2026

## Module
`cognitive_agent/cognition/editorial.py` (479 lines)

## Architecture
```
Signal data ─┐
(confidence,  │
 frustration, ├──→ AestheticEvaluator.evaluate() ──→ AestheticEvaluation
 tool_rates,  │                                            │
 episodes,    ┘                                     stored in SQLite
 patterns)                                            │
                                                     ↓
                                              baselines updated
                                              (streaming mean/std)
```

## 5 Scoring Dimensions

| Dimension | Weight | Scoring Logic |
|-----------|--------|---------------|
| concision | 0.15 | Base 0.7, -0.20 if confidence&lt;0.3, -0.10 if&lt;0.5, -0.15 if frustration&gt;0.7, -0.05 if&gt;0.4 |
| effectiveness | 0.30 | Average of tool success rates (with ≥3 samples). Falls back to confidence. Multiplied by 0.85 if confidence&lt;0.3 |
| coherence | 0.20 | From episode content length: avg&lt;30 with >3 episodes = 0.45, avg&gt;150 = 0.75, avg&gt;80 = 0.65, default 0.6 |
| naturalness | 0.15 | Base 0.7. +0.10 if confidence≥0.7, -0.15 if&lt;0.3. -0.20 if frustration&gt;0.7, -0.08 if&gt;0.4. -0.15 if ≥2 correction_patterns |
| consistency | 0.20 | 1.0 - avg_deviation*2 vs historical baselines. Defaults to 0.7 when no baseline exists |

Overall = weighted sum, clamped 0.0–1.0.

## Schemas (SQLite)

- `aesthetic_scores`: per-dimension baseline (mean, std, n_samples, last_updated)
- `aesthetic_evaluations`: individual evaluation records with all 5 dimension scores + overall + context

## Key Constants
- `MIN_SAMPLES_FOR_BASELINE = 3` — minimum evaluations before baseline is meaningful
- `NOTABLE_IMPROVEMENT_THRESHOLD = 0.15` — overall > baseline + this → "improving"
- `NOTABLE_DECLINE_THRESHOLD = -0.15` — overall < baseline + this → "declining"
- `MIN_EVALS_FOR_TREND = 5` — minimum evaluations before trend is computed

## Wiring Points
- **Init**: `agent.py:587` — after GoalDecomposer, with `pattern_learner` reference
- **cognitive_state**: `agent.py:5069` — `state["aesthetic_scores"]` via `get_status_dict()`
- **get_status**: `agent.py:5826` — `status["aesthetic_evaluation"]`
- **cognitive_processor.get_cognitive_state()**: `cognitive_processor.py:1102` — `state["aesthetic"]`
- **system prompt block**: `cognitive_processor.py:1169-1185` — renders `[ATHENA AESTHETIC STATE]` section with per-dim scores and trend
- **No heartbeat yet**: evaluations are event-driven (triggered when confidence/frustration/tool data is available). Automatic self-evaluation heartbeat deferred to #6.

## Pattern Awareness
- Reads `correction_pattern` type from PatternLearner (passed via `patterns` parameter)
- ≥2 correction patterns → -0.15 penalty to naturalness
- 1 correction pattern → -0.05 penalty to naturalness

## Baseline Tracking
Uses streaming Welford-like algorithm:
- `new_mean = (old_mean * n + score) / (n + 1)`
- `new_var = ((old_var * (n-1)) + (score - old_mean)*(score - new_mean)) / n` (when n ≥ 1)
- Baselines are dimension-specific and converge toward running average

## Test Statistics
- 57 tests in `tests/cognition/test_editorial.py`
- 7 AestheticScore unit tests (defaults, deviation, z-score, to_dict)
- 7 AestheticEvaluation unit tests (defaults, overall-weighted, overall-min, asymmetric, clamped, dimensions, to_dict)
- 4 AestheticEvaluator init tests (schema, baselines, pattern_learner, close)
- 12 AestheticEvaluator scoring tests (3 concision, 3 effectiveness, 3 coherence, 3 naturalness, 2 consistency)
- 7 AestheticEvaluator evaluate tests (return type, store, baselines, multi, tool_rates, episodes, patterns, context)
- 3 AestheticEvaluator baseline tests (update, converge, variance)
- 3 AestheticEvaluator summary tests (empty, after-evals, trend, structure)
- 8 AestheticEvaluator edge case tests (empty path, negative conf, high frust, string episodes, empty episodes, insufficient samples, multi-instance)
- 3 integration tests (agent init, cognitive_state, get_status)
- All pass in 0.33s
- 199 total cognition tests pass (no regressions)
