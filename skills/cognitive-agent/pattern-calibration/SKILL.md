---
name: pattern-calibration
description: "PatternLearner confidence calibration — FDR correction, regime-change detection, and empirical confidence blending for distinguishing genuine patterns from statistical artifacts."
category: cognitive-agent
version: 1.0.0
triggers:
  - "pattern learner calibration"
  - "FDR correction"
  - "regime change detection"
  - "confidence calibration"
  - "false discovery rate"
  - "how does the pattern learner distinguish artifacts"
  - "pattern_fdr"
  - "pattern_regime"
  - "pattern_calibrator"
  - "calibration_history"
metadata:
  hermes:
    tags: [pattern-learner, calibration, FDR, regime-change, confidence]
    related_skills: [self-audit-cognitive-autonomy, hermes-agent]
---

# PatternLearner Calibration

Three subsystems that help PatternLearner distinguish genuine behavioral patterns from statistical artifacts.

## 1. FDR Correction (`pattern_fdr.py`)

**Problem:** 10 tools each evaluated independently against a 40% failure threshold. Even with a 50% true success rate, expected false patterns from noise alone is ~4.

**Solution:** Beta-binomial shrinkage of each tool's observed failure rate toward the global mean.

```
adjusted_rate = (failures + alpha × global_rate) / (n + alpha)
```

Where `alpha` (default 5) is the number of prior pseudo-observations. A tool with 6 samples at 50% failure against a global 20% baseline shrinks to ~39% — below the 40% threshold, no pattern. A tool with 100 samples at 60% barely moves.

**Hook location:** `_detect_tool_failure_conditions()` in `pattern_learner.py`, before the 40% gate check.

## 2. Regime-Change Detection (`pattern_regime.py`)

**Problem:** A tool had 60% failure for 2 weeks, then a fix was deployed. The decay override handles this slowly (30-day rolling window). Regime-change detection accelerates it.

**Solution:** During `decay()`, compares each active tool-failure pattern's recent 48h success rate against its long-term 30d rate.

Detection logic (3 gates):
1. `recent_samples >= 5` (enough data to judge)
2. `recent_rate > threshold` (default 0.85 — clearly good behavior)
3. `recent_rate - long_rate > 0.20` OR `recent_rate > 0.90`

When all gates pass: force-decay the pattern to 0.10 confidence, append `[REGIME_CHANGED: tool=X recent=95%]` to the recommendation field.

**Hook location:** `decay()` method, inside the success-rate override loop, before the existing 80% blanket override.

## 3. Empirical Confidence Calibration (`pattern_calibrator.py`)

**Problem:** PatternLearner's confidence formula is a heuristic with no feedback loop.

**Solution V1 (append-only):** Records `(stored_confidence, empirical_rate, deviation)` in the `calibration_history` table each time a pattern is re-observed. Viewable via `get_recent()` and `get_stats(pattern_id)`.

**Solution V2 (adaptive blending):** `calibrate()` reads calibration history and blends stored confidence toward empirical reality:

```
blended = current × (1 - weight) + avg_empirical × weight
```

Default `blend_weight=0.3`, `min_records=3`. A pattern stored at 0.90 whose 3 calibration records show avg_empirical=0.50 gets blended to 0.78. Requires ≥3 observations before any adjustment.

**Hook location:** `_store_if_new()` update path, after recording the calibration pair.

## Tunables

| Tunable | Env var | Default | What it controls |
|---|---|---|---|
| `fdr_shrinkage_alpha` | `ATHENA_FDR_SHRINKAGE_ALPHA` | 5.0 | Prior pseudo-observations for FDR shrinkage |
| `regime_change_recent_window_hours` | `ATHENA_REGIME_WINDOW` | 48 | Hours of recent data for regime detection |
| `regime_change_recent_rate_threshold` | `ATHENA_REGIME_THRESHOLD` | 0.85 | Recent success rate threshold for regime flag |

## Schema

`calibration_history` table bootstrapped alongside `learned_patterns` in `LEARNED_PATTERNS_SCHEMA` (columns: `id`, `pattern_id`, `pattern_type`, `stored_confidence`, `empirical_rate`, `deviation`, `sample_count`, `calculated_at`).

## Files

| File | Role |
|---|---|
| `cognitive_agent/pattern_fdr.py` | `FDRCorrector` with `correct()`, `correct_many()`, `compute_global_mean()` |
| `cognitive_agent/pattern_regime.py` | `RegimeChangeDetector` with 3-gate detection |
| `cognitive_agent/pattern_calibrator.py` | `ConfidenceCalibrator` with `record()`, `get_recent()`, `get_stats()`, `calibrate()` |
| `cognitive_agent/pattern_learner.py` | 3 hooks: FDR in `_detect_tool_failure_conditions`, regime in `decay()`, calibration in `_store_if_new()` |
| `cognitive_agent/tunables.py` | 3 tunables |

## Verification

All tests pass: `tests/test_pattern_fdr.py` (30+), `tests/test_pattern_regime.py` (14), `tests/test_pattern_calibrator.py` (14), `tests/test_integration_pattern_calibration.py` (4), `tests/cognition/test_pattern_learner.py` (25) = 81 total.

```python
from cognitive_agent.pattern_learner import PatternLearner
learner = PatternLearner(db_path)
# FDR happens automatically during extract
# Regime change happens automatically during decay()
# Calibration records happen automatically during re-extract
stats = learner.get_stats()
print(stats)
```