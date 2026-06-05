---
name: adaptive-cap-calibration
description: "Adaptive tool cap calibration — AutonomyGuard's three-factor effective cap composition (static × adaptive × confidence) and how to tune the bands via env vars."
category: cognitive-agent
version: 1.0.0
triggers:
  - "how are tool caps adjusted"
  - "what is the effective cap formula"
  - "tune adaptive cap bands"
  - "ATHENA_CAP_EXPAND_EXCELLENT"
  - "ATHENA_CAP_EXPAND_GOOD"
  - "ATHENA_CAP_CALIB_MIN_SAMPLES"
  - "adaptive cap calibration"
  - "cap calibration"
  - "calibrate_caps"
  - "adaptive_cap_info"
metadata:
  hermes:
    tags: [autonomy, caps, calibration, budgets]
    related_skills: [hermes-agent]
---

# Adaptive Cap Calibration

## Architecture

The effective cap for any self-driven tool call is a **three-factor composition**:

```
effective_cap = static_cap × adaptive_multiplier × confidence_multiplier
```

Where:
- **static_cap** — the hardcoded default in `DEFAULT_PER_TOOL_HOURLY_CAPS` (`autonomy_guard.py:48`). Source of truth.
- **adaptive_multiplier** — long-term trust from `tool_outcomes` history (30-day window). Computed by `AdaptiveCapCalibrator` (`adaptive_caps.py`).
- **confidence_multiplier** — short-term in-memory contraction from `action_success_rate()` (`metacognition.py:163`).

Only static cap = 0 is absolute (tools explicitly disabled stay off). Effective cap is floor 1.

## Multiplier Bands

| Rate range | Multiplier | Effect |
|---|---|---|
| ≥ excellent_threshold (default 0.90) | 1.5× | Expand (reward reliability) |
| ≥ good_threshold (default 0.75) | 1.0× | Neutral (maintain default) |
| ≥ 0.45 | 0.75× | Mild contraction |
| < 0.45 | 0.25× | Heavy contraction |

## Tunables (env-var overridable)

| Tunable | Env var | Default | What it controls |
|---|---|---|---|
| `cap_expand_excellent_threshold` | `ATHENA_CAP_EXPAND_EXCELLENT` | 0.90 | Success rate above which cap expands to 1.5× |
| `cap_expand_good_threshold` | `ATHENA_CAP_EXPAND_GOOD` | 0.75 | Success rate above which cap stays neutral |
| `cap_expand_max_multiplier` | `ATHENA_CAP_EXPAND_MAX` | 2.0 | Maximum upward multiplier ceiling |
| `cap_calibration_min_samples` | `ATHENA_CAP_CALIB_MIN_SAMPLES` | 15 | Min tool_outcomes rows before calibration applies |
| `cap_calibration_interval_cycles` | `ATHENA_CAP_CALIB_INTERVAL` | 12 | Cognitive cycles between calibration passes |
| `cap_calibration_warmup_cycles` | `ATHENA_CAP_CALIB_WARMUP` | 24 | Cycles before first calibration run |

## Persistence

Adaptive multipliers are stored in the `adaptive_cap_state` SQLite table (columns: `tool_name`, `multiplier`, `samples`, `computed_rate`, `updated_at`). Loaded on guard construction via `set_db_path()` (`autonomy_guard.py:703`). This survives restarts.

## Calibration Trigger

The cognitive cycle (`cognitive_cycle.py:1724-1745`) increments `guard._calibration_cycle_count` on each fired tick. When count >= warmup AND count % interval == 0, it calls `guard.calibrate_caps()` which:
1. Instantiates `AdaptiveCapCalibrator`
2. Queries `tool_outcomes` for the last 30 days
3. Groups by tool, computes success rate
4. Maps rate to multiplier via bands
5. Merges into `self._adaptive_cap_multipliers`
6. Persists to `adaptive_cap_state`

## Reading Adaptive State

```python
status = guard.status()
adaptive = status.get("adaptive_cap_info", {})
# {"terminal": 1.5, "web_search": 0.75, ...}
```

## CAP_SHRINK_EXEMPT

Tools in `CAP_SHRINK_EXEMPT` (`autonomy_guard.py:133`) bypass the confidence multiplier but NOT the adaptive multiplier. The adaptive multiplier is trust-based, not panic-based, so it applies fairly.

Current exempt set: `complete_goal`, `abandon_goal`, `save_note`, `terminal`, `recall_memory`, `read_athena_vault`, `list_goals`, `web_search`, `perplexity_search`, `web_fetch`, `read_vault`, `gmail_search`, `calendar_list_events`, `drive_search`.

## Files

| File | Role |
|---|---|
| `cognitive_agent/adaptive_caps.py` | `AdaptiveCapCalibrator` class — queries DB, maps bands |
| `cognitive_agent/autonomy_guard.py` | `_compute_effective_cap()`, `calibrate_caps()`, `_load/_save_adaptive_caps()` |
| `cognitive_agent/agent.py:755` | Wires `db_path` to guard via `set_db_path()` |
| `cognitive_agent/cognition/cognitive_cycle.py:1724` | Periodic calibration trigger |
| `cognitive_agent/tunables.py` | 6 calibration tunables |

## Verification

```python
guard = AutonomyGuard(...)
guard.set_db_path(db_path)
mults = guard.calibrate_caps()
cap = guard._compute_effective_cap("terminal", 1.0)
print(f"terminal effective cap: {cap}")
```

All tests in `tests/test_adaptive_caps.py` and `tests/test_integration_adaptive_caps.py`.