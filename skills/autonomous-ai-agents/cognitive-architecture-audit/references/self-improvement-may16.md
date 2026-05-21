# Structural Self-Improvement (Phase 13H #6) — May 16, 2026

## Module
`cognitive_agent/cognition/self_improvement.py` (678 lines)

## Architecture
```
PatternLearner (#2) ─┐
AestheticEvaluator   ├──→ SelfImprovementLoop.diagnose() → weakest subsystem
(#5)                 │             │
Metacognition       ┘             │
                                  ↓
                    GoalDecomposer (#1) → improvement goals
                                  │
                                  ↓
                    SQLite cycle tracking (complete/fail/skip lifecycle)
```

## Diagnosis — 10 Subsystems Scored

| Subsystem | Source | When score = 0.3 (weak) |
|-----------|--------|------------------------|
| concision | AestheticEvaluator | Outputs are verbose/rambling |
| effectiveness | AestheticEvaluator | Tool success rates are low |
| coherence | AestheticEvaluator | Topic fragmentation |
| naturalness | AestheticEvaluator | AI-isms detected via correction patterns |
| consistency | AestheticEvaluator | Output deviates from baselines |
| tool_selection | PatternLearner | tool_failure_condition patterns with high confidence |
| strategy | PatternLearner | strategy_mismatch patterns |
| wm_management | PatternLearner | wm_overload_trigger patterns |
| confidence | Metacognition | Low confidence value |
| frustration | Motivation (inverted) | High frustration value |

Diagnosis is deterministic: the subsystem with the lowest score is selected.

## Cycle Lifecycle
1. **should_run()** → checks if HEARTBEAT_INTERVAL_SEC (7 days) has passed since last cycle
2. **diagnose()** → gathers data from all subsystems, returns {weak_subsystem, score, metrics, description}
3. **create_improvement()** → creates cycle record + tries GoalDecomposer plan
4. **Cooldown**: if same subsystem failed >= MAX_CONSECUTIVE_FAILURES (3) in SUBSYSTEM_COOLDOWN_CYCLES (4), cycle is skipped
5. **complete_cycle()** / **fail_cycle()** → mark done with outcome + final metrics

## Key Constants
- `HEARTBEAT_INTERVAL_SEC = 604800` (7 days)
- `HEARTBEAT_IDLE_THRESHOLD_SEC = 1800` (30 min idle required)
- `MAX_CONSECUTIVE_FAILURES = 3` — subsystem is skipped after 3 failures
- `SUBSYSTEM_COOLDOWN_CYCLES = 4` — cycles to skip before retrying same subsystem
- `MIN_PATTERNS_FOR_DIAGNOSIS = 2`
- `MIN_EVALS_FOR_TREND = 3`
- `MIN_TOTAL_EVALS = 5`

## Wiring Points
- **Init**: `agent.py:602` — after AestheticEvaluator, with pattern_learner, aesthetic_evaluator, goal_decomposer refs
- **cognitive_state**: `agent.py:5183` — `state["self_improvement"]`
- **get_status**: `agent.py:5928` — `status["self_improvement"]`
- **Heartbeat**: `agent.py:~1285` — `"self_improvement"` handler, weekly, idle≥30min, gathers all diagnostic data and calls diagnose→create_improvement
- **cognitive_processor**: `cognitive_processor.py:1187` — renders `[ATHENA SELF-IMPROVEMENT STATE]` with cycle stats + current focus

## Heartbeat Handler Flow
```python
def _self_improve():
    si = self.self_improvement
    if not si.should_run(): return

    patterns = self.pattern_learner.get_active_patterns(limit=10)
    aesthetic = self.aesthetic_evaluator.get_status_dict()
    plans = self.goal_decomposer.get_all_active_plans()
    confidence = self.metacognition.confidence.get_confidence()
    frustration = self.motivation.get_state().frustration_level
    rates = self.tool_registry.outcome_store.get_all_success_rates()

    diagnosis = si.diagnose(patterns=patterns, aesthetic_status=aesthetic, ...)
    cycle = si.create_improvement(diagnosis)
    if cycle.status != "skipped":
        # record maintenance event with weak_subsystem, score, cycle_id, goal_id
```

## Test Statistics
- 42 tests in `tests/cognition/test_self_improvement.py`
- 4 ImprovementCycle tests (defaults, to_dict, from_dict, bad_json)
- 5 SelfImprovementLoop init tests (schema, refs, no-refs, should_run on empty, should_run recent)
- 8 diagnose tests (all keys, returns subsystem, with aesthetic, with confidence, with frustration, with tool patterns, with strategy patterns, metrics completeness, description)
- 6 create tests (returns cycle, stores to DB, sets metrics, goal_content, plan, multiple)
- 4 lifecycle tests (complete, fail, complete_nonexistent, get_active)
- 4 summary/status tests (empty, after_cycles, mixed_status, status_dict)
- 2 cooldown tests (skip on repeated failures, in-progress not blocked)
- 5 edge case tests (empty patterns, None values, empty active, empty recent, multi-instance)
- 3 integration tests (agent init, cognitive_state, get_status)
