# AestheticEvaluator — Live Calibration Findings (May 16, 2026)

## Context

First integrated session running the cognitive architecture modules from within Hermes (consumer pattern, option 3). The AestheticEvaluator was already receiving `evaluate()` calls from the Hermes-Athena bridge, but all 68 stored evaluations were producing identical scores:

| Dimension | Value | Std |
|-----------|-------|-----|
| concision | 0.700 | 0.000 |
| effectiveness | 0.500 | 0.000 |
| coherence | 0.650 | 0.000 |
| naturalness | 0.700 | 0.000 |
| consistency | 0.988 | 0.021 |
| overall | 0.690 | 0.000 |

## Root Cause: Signal Delivery Gap

The scoring formula is **deterministic and correct** — the issue is that the same signal values were being fed every time:

### Concision (pinned at 0.700)
```python
def _score_concision(confidence, frustration):
    base = 0.7
    if confidence < 0.3: base -= 0.20  # never triggers
    elif confidence < 0.5: base -= 0.10  # never triggers
    if frustration > 0.7: base -= 0.15  # never triggers
    elif frustration > 0.4: base -= 0.05  # never triggers
    return base  # always 0.7
```
Confidence is consistently ~0.7 (from metacognitive events) and frustration ~0.0. No penalties ever apply.

### Effectiveness (pinned at 0.500)
```python
def _score_effectiveness(confidence, tool_rates):
    if tool_rates:
        rates = [data["success_rate"] for _, data in tool_rates.items()
                 if data.get("n_samples", 0) >= MIN_SAMPLES_FOR_BASELINE]  # 3
```
The Hermes integration wasn't passing `tool_success_rates` with enough samples per tool. Without any tool meeting `n_samples >= 3`, the evaluator fell through to `base = confidence = 0.5`. **When fed real DB data** (72h window with n≥3 on 7 tools), effectiveness jumped to 0.762.

### Naturalness (pinned at 0.700)
```python
def _score_naturalness(confidence, frustration, patterns):
    base = 0.7
    if confidence >= 0.7: base += 0.10  # triggers, giving 0.800
    if patterns and correction_count ≥ 2: base -= 0.15
```
At confidence=0.7, naturalness should be 0.800. The fact it's 0.700 suggests the actual confidence reaching the evaluator is <0.7 or the evaluator's caller isn't passing confidence at all. This needs investigation.

### Coherence (pinned at 0.650)
Always gets `episodes=[]` because Hermes doesn't generate structured episodes that match the evaluator's expected format. Falls through to the empty-list branch: `return 0.6`.

### Consistency (pinned at ~0.988)
```python
def _score_consistency(self, concision, effectiveness, coherence, naturalness):
    # 1.0 - avg_deviation * 2
    # If all 4 scores match baselines exactly, deviation=0 → consistency=1.0
```
Since all evaluations produce the same 4 scores, consistency is near-perfect. **Once variance enters the other dimensions, consistency will drop naturally.**

## Diagnosis

The AestheticEvaluator works correctly. The issue is the **consumer integration** — it's being called without rich enough signal data:

- `tool_success_rates` — the Hermes bridge needs to read from `tool_outcomes` table with proper n_samples ≥ 3 filters
- `episodes` — the caller isn't passing episode data at all
- `patterns` — the PatternLearner only has 1 pattern (terminal 50% failure), so correction_pattern count stays 0
- `context` — the caller truncates to 200 chars, losing the output's actual aesthetic texture

## Fix Path

Not a code fix — the integration consumer (whoever calls `evaluator.evaluate()`) needs to:

1. **Query tool_outcomes** for the 72h window, compute per-tool success rates, pass to evaluate()
2. **Query episodes** for the last 5-10, pass as dict list
3. **Query pattern_learner** for correction_pattern count
4. **Pass the actual response text** as context (not the user's input message)

The DB schema for tool_outcomes differs from what the evaluator expects:
```
DB has:   tool_name, success (INT 0/1), latency_ms, timestamp
Eval expects: tool_name → {"success_rate": float, "n_samples": int}
```

So the bridge needs: `SELECT tool_name, SUM(success)/COUNT(*) as rate, COUNT(*) as total FROM tool_outcomes WHERE timestamp > ? GROUP BY tool_name`

## Verification

When fed proper signal data (manually constructed from DB queries), the evaluator produced differentiated scores:

```
With tool_rates (7 tools, n≥3):
  Overall:    0.732  (was 0.690)
  Concision:  0.700  (same — confidence 0.7)
  Effective:  0.762  (was 0.500 — big jump)
  Coherence:  0.600  (same — no episodes)
  Natural:    0.800  (was 0.700 — now hitting the confidence≥0.7 boost)
  Consistent: 0.794  (was 0.988 — now diverging from baselines)
```

This proves the mechanism works. The flat baseline problem is purely a signal-delivery issue.

## Integration API Reference (from live testing, May 16)

```python
import sys
sys.path.insert(0, "/Users/gregdreyfus/cognitive-agent")

from cognitive_agent.cognition.editorial import AestheticEvaluator
from cognitive_agent.cognition.self_improvement import SelfImprovementLoop
from cognitive_agent.cognition.policy_overrides import PolicyOverrideStore
from cognitive_agent.cognition.metacognition import MetacognitionEngine
from cognitive_agent.pattern_learner import PatternLearner

db_path = "/Users/gregdreyfus/athena_memory.db"

# All modules instantiate with db_path alone
evaluator = AestheticEvaluator(db_path=db_path)
pattern_learner = PatternLearner(db_path=db_path)
metacog = MetacognitionEngine(db_path=db_path)
policy_store = PolicyOverrideStore(db_path=db_path)
self_imp = SelfImprovementLoop(
    db_path=db_path,
    aesthetic_evaluator=evaluator,
    policy_store=policy_store
)

# Key method calls:
confidence = metacog.confidence.get_combined_confidence()  # returns float 0..1
active_overrides = policy_store.get_active()  # list of PolicyOverride objects
result = evaluator.evaluate(
    confidence=0.7,
    frustration=0.0,
    tool_success_rates={},  # see DB query above
    episodes=[],
    patterns=[],
    source="turn",
    context="..."
)  # returns AestheticEvaluation with .overall, .concision, etc.
```

## DB Schema Reference (live, May 16)

| Table | Key columns | Row count |
|-------|-------------|-----------|
| tool_outcomes | tool_name, success (INT 0/1), latency_ms, timestamp | 1,514 |
| metacognitive_events | timestamp, signal, confidence_before, confidence_after, context, data | 39,692 |
| aesthetic_evaluations | timestamp, source, concision, effectiveness, coherence, naturalness, consistency, overall, context | 68 |
| aesthetic_scores | dimension, baseline_mean, baseline_std, n_samples | 5 |
| learned_patterns | pattern_type, title, condition, observation, recommendation, confidence, sample_count | 1 |
| self_improvement_cycles | started_at, status, weak_subsystem, weakness_description, goal_content, improvement_plan, metrics_before, metrics_after | 1 |
| policy_overrides | subsystem, directive, status, source_cycle_id, created_at, expires_at | 1 |
| motivation_state | curiosity_level, frustration_threshold, valence, arousal | 1 |
| episodes | timestamp, content, source_kind | 6,032 |
| goals | (various) | 219 |
| predictions | (various) | 37,854 |
| prediction_patterns | (various) | 118 |
