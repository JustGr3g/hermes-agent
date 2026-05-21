---
name: wm-overload-cognitive-load-fix
description: Fix for WM_OVERLOAD metacognitive signal overfiring — replaces raw item-count load with load_weight-based cognitive_load
tags: [metacognition, working-memory, cognitive-load, phase-9]
last_updated: 2026-04-30
---

# WM Overload Cognitive Load Fix (Phase 9)

## The Bug
WM overload was firing every turn because:
- `WM.load = len(items) / max_capacity` (raw item count)
- `max_capacity = 7`, threshold = 0.85
- 6 items = 0.857 ≥ 0.85 → fires constantly once WM has 6+ items
- Normal operation (0-5 items) doesn't fire, but any session with 6+ items fires every turn

## The Fix

### 1. `cognitive_load` property (working_memory.py)
```python
@property
def cognitive_load(self) -> float:
    """Sum of item load_weights, capped at 1.0."""
    if not self._items:
        return 0.0
    total = sum(item.load_weight for item in self._items.values())
    return min(1.0, total)
```
- `load_weight` defaults to 0.1 per item
- 7 items @ 0.1 = 0.7 cognitive_load → fires at threshold 0.70
- Behavioral parity with old system at default weight
- Heavy items (load_weight > 0.1) now correctly trigger overload faster

### 2. `wm_overload_threshold` default (metacognition.py)
Changed from `0.85` → `0.70`

### 3. `load` property aliased to `cognitive_load`
```python
@property
def load(self) -> float:
    """Fraction of capacity used (0.0–1.0). Alias for cognitive_load."""
    return self.cognitive_load
```

## Behavior After Fix\n| Items | Old cognitive_load | New cognitive_load | Fires? |\n|-------|-------------------|-------------------|--------|\n| 0-6   | 0.0-0.857         | 0.0-0.6           | No    |\n| 7     | 1.0                | 0.7               | Yes   |\n| 8+    | 1.0                | 0.8-1.0           | Yes    |\n\n## Behavioral Patterns When WM_OVERLOAD Fires\n\nBased on observed sessions, WM_OVERLOAD triggering can lead to specific cognitive patterns:\n- Excessive metacognitive reflection rather than task execution (observed as repeated `[reflection]` inner speech)\n- Difficulty initiating simple actions despite clear understanding of what needs to be done\n- Getting stuck in deliberation loops about approach rather than proceeding with implementation\n- Questioning autonomy readiness and tool availability even when systems are functional\n\nThese patterns align with the self-model tension between increased speed and need for better grounding, where velocity can lead to friction with accuracy.\n\n### Mitigation Strategy\nWhen WM_OVERLOAD fires and triggers planning mode:\n1. Recognize the signal as a cue to simplify approach rather than over-analyze\n2. Set a time-boxed limit for reflection (e.g., 2-3 minutes) before forcing action\n3. Break tasks into smaller, immediately executable steps\n4. Use the AttentionDirector's endogenous focus selection to pick the smallest viable action\n5. Trust recent_self_steps over self-model when assessing actual capabilities\n\n## Pattern: Adding a New Longitudinal Adaptive Rule (Phase 9A)

The metacognition engine supports adding new adaptive parameters that:
1. Are tracked in `adapt_thresholds()` over the ADAPT_WINDOW_SEC event window
2. Persist to the `cognitive_params` DB table via `_save_param()`
3. Are restored on `MetacognitionEngine.__init__()` via `_load_adapted_params()`
4. Can be tuned via `tunables.py` with env-var overrides

### Steps to add a new adaptive threshold

**1. Add tunable defaults to `tunables.py`:**
```python
"my_new_threshold": Tunable(
    name="my_new_threshold",
    default=0.5,
    description="...",
    rationale="...",
    env_var="ATHENA_MY_NEW_THRESH",
    valid_min=0.0, valid_max=1.0,
),
```

**2. Add the instance attribute in `MetacognitionEngine.__init__()`:**
```python
self._my_new_threshold: float = 0.5
```

**3. Wire the adaptation logic into `adapt_thresholds()`:**
```python
# Count signals in window
my_count = counts.get(MetaSignal.MY_SIGNAL.value, 0)
if total > 0:
    ratio = my_count / total
    from ..tunables import get_tunable
    thresh = get_tunable("my_new_threshold")
    current = self._my_new_threshold

    if ratio >= thresh:
        new_val = min(1.0, current + 0.1)
        if new_val != current:
            self._my_new_threshold = new_val
            self._save_param("my_new_threshold", new_val, reason)
            changes["my_new_threshold"] = {"new": new_val, "default": 0.5, "reason": reason}
```

**4. Load from DB in `_load_adapted_params()`:**
```python
row = conn.execute(
    "SELECT value FROM cognitive_params WHERE name = ?",
    ("my_new_threshold",),
).fetchone()
if row:
    self._my_new_threshold = float(row["value"])
```

**5. Surface in `get_cognitive_params()` if needed** — it already reads all `cognitive_params` rows, so no code change needed if the param is in that table.

### Example: retrieval_breadth_default (Phase 9A, 2026-04-30)
- Tunable: `retrieval_breadth_default` (range 1.0–4.0), `retrieval_breadth_uncertainty_rise_threshold` (0.30), `retrieval_breadth_curiosity_satisfied_threshold` (0.20)
- Raises breadth when `UNCERTAINTY_RISE ≥ 30%` of events, lowers when `CURIOSITY_SATISFIED ≥ 20%`
- Persisted to `cognitive_params`, restored on init

## Tests Updated
- `test_phase9a_adapt_thresholds_raises_wm_when_overfiring`: assertion `> 0.85` → `> 0.70`
- `test_phase9a_adapted_thresholds_persist_across_instances`: `default_value == 0.85` → `== 0.70`
- `test_executive_respects_wm_overload`: added `load_weight=0.4` to items so 2 items = 0.8 ≥ 0.70

## Verification
```bash
cd ~/cognitive-agent && python -m pytest tests/ -v --tb=short
# Expect: 120 passed, 1 warning
```
