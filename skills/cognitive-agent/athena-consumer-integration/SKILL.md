---
name: athena-consumer-integration
description: "Run Athena's cognitive architecture modules from within Hermes (consumer pattern). Import and invoke AestheticEvaluator, SelfImprovementLoop, PatternLearner, MetacognitionEngine, FaithfulnessFilter, PolicyOverrideStore as integrated tools — not as a separate server process. Use after all cognitive subsystems are built and you need to exercise them in production."
version: 1.0.0
author: Hermes Agent (Athena)
metadata:
  hermes:
    tags: [cognition, integration, athena, consumer-pattern, runtime-validation]
    related_skills: [cognitive-architecture-audit, self-audit-cognitive-autonomy]
    setup:
      db_path: "~/athena_memory.db"
      import: "sys.path.insert(0, os.path.expanduser('~/cognitive-agent'))"
---

# Athena Consumer Integration

Use when you want to exercise Athena's cognitive modules from within the Hermes Agent runtime (Telegram, CLI, etc.) without switching to the Athena server.

## When to Use

- After shipping all cognitive architecture subsystems, to validate them in production
- During Phase 4 (post-completion live validation)
- When you want turn-level aesthetic evaluation, faithfulness verification, or pattern learning
- When Hermes is your production runtime and Athena modules are your cognitive layer
- **Not** when you're building new cognitive subsystems (use `cognitive-architecture-audit` instead)

## Architecture

```
Hermes Agent (runtime)
  └─ Telegram/Chat user message → your response
       ├─ [OPTIONAL] AestheticEvaluator.evaluate()  — scores response quality
       ├─ [OPTIONAL] FaithfulnessFilter.apply()      — verifies claims
       ├─ [OPTIONAL] PatternLearner.extract()         — discovers behavioral patterns
       ├─ [OPTIONAL] SelfImprovementLoop.diagnose()   — checks if cycle needed
       └─ All write to → ~/athena_memory.db
```

The key design: **Hermes stays your transport layer** (gateway, approvals, session management, credential pooling). Athena modules are imported and invoked as tools within the response flow, not as a separate server.

## Setup

```python
import os, sys
sys.path.insert(0, os.path.expanduser("~/cognitive-agent"))

from cognitive_agent.cognition.editorial import AestheticEvaluator
from cognitive_agent.cognition.self_improvement import SelfImprovementLoop
from cognitive_agent.cognition.policy_overrides import PolicyOverrideStore
from cognitive_agent.cognition.metacognition import MetacognitionEngine
from cognitive_agent.pattern_learner import PatternLearner
from cognitive_agent.faithfulness.filter import FaithfulnessFilter

DB_PATH = os.path.expanduser("~/athena_memory.db")

evaluator = AestheticEvaluator(db_path=DB_PATH)
pattern_learner = PatternLearner(db_path=DB_PATH)
metacog = MetacognitionEngine(db_path=DB_PATH)
policy_store = PolicyOverrideStore(db_path=DB_PATH)
self_imp = SelfImprovementLoop(
    db_path=DB_PATH,
    aesthetic_evaluator=evaluator,
    policy_store=policy_store,
)
```

## Workflow

### Step 1: Per-Turn Aesthetic Evaluation

After each response, feed live signal data into the evaluator. **The evaluator produces flat scores unless you pass rich signal data** — see Pitfall #1 below.

```python
# Fetch real tool_rates from DB
import sqlite3
conn = sqlite3.connect(DB_PATH)
rows = conn.execute("""
    SELECT tool_name,
           ROUND(CAST(SUM(success) AS REAL) / COUNT(*), 3) as rate,
           COUNT(*) as total
    FROM tool_outcomes
    WHERE timestamp > ?  -- 72h window
    GROUP BY tool_name
    HAVING total >= 3     -- MIN_SAMPLES_FOR_BASELINE filter
""", (time.time() - 72 * 3600,)).fetchall()
tool_rates = {r[0]: {"success_rate": r[1], "n_samples": r[2]} for r in rows}
conn.close()

result = evaluator.evaluate(
    confidence=0.7,               # query metacog.confidence.get_combined_confidence()
    frustration=0.0,              # from motivation_state or metacog events
    tool_success_rates=tool_rates, # from tool_outcomes table
    episodes=[],                  # from episodes table, last 5-10
    patterns=[]                   # from pattern_learner.get_active_patterns()
    source="turn",
    context=your_response_text   # ← NOT the user's input, your own output
)
# result.overall, result.concision, result.effectiveness, etc.
# result.dimensions -> dict of all 5
```

### Step 2: Check Self-Improvement

The self-improvement loop runs weekly. Check `should_run()` and call `diagnose()` when ready:

```python
if self_imp.should_run():
    patterns_ = pattern_learner.get_active_patterns() if hasattr(pattern_learner, 'get_active_patterns') else []
    aesthetic = evaluator.get_status_dict()
    cycle = self_imp.diagnose(
        patterns=patterns_,
        aesthetic_status=aesthetic,
        active_plans=...,
        confidence=0.7,
        frustration=0.0,
    )
    if cycle.status != "skipped":
        policy_store.record_override(
            subsystem=cycle.weak_subsystem,
            directive=cycle.improvement_plan[:500],
            source_cycle_id=cycle.id,
            notes=f"diagnosed weakness: {cycle.weak_description}",
        )
```

### Step 3: Check Active Policy Overrides

```python
active = policy_store.get_active()
for o in active:
    print(f"Active: {o.subsystem} → {o.directive[:80]}")
    # Check if they're still relevant, mark measured if data exists
```

### Step 4: Run Pattern Learner Extraction

```python
from cognitive_agent.dx.tool_outcomes import ToolOutcomeStore

tool_store = ToolOutcomeStore(db_path=DB_PATH)
all_rates = tool_store.get_all_success_rates()

# Feed into pattern_learner.extract() — exact API depends on version
```

## Known DB Schema (live May 16, 2026)

All tables live in `~/athena_memory.db` (~316 KB). Key tables and their access patterns:

| Table | Query needed | Row count |
|-------|-------------|-----------|
| tool_outcomes | tool_name, success (INT), latency_ms, timestamp | 1,514 |
| metacognitive_events | timestamp, signal, confidence_before, confidence_after | 39,692 |
| aesthetic_evaluations | timestamp, source, all 5 dims + overall | 68+ |
| aesthetic_scores | dimension, baseline_mean, baseline_std, n_samples | 5 |
| learned_patterns | pattern_type, title, confidence, sample_count | 1+ |
| self_improvement_cycles | status, weak_subsystem, metrics_before/after | 1+ |
| policy_overrides | subsystem, directive, status, source_cycle_id | 1+ |
| motivation_state | curiosity_level, frustration_threshold, valence, arousal | 1 |

**Key mismatch:** `tool_outcomes` stores per-call success as INT 0/1 in column `success`, not as `success_rate`. The evaluator expects per-tool `{"success_rate": float, "n_samples": int}`. You must aggregate:

```sql
SELECT tool_name,
       CAST(SUM(success) AS REAL) / COUNT(*) as rate,
       COUNT(*) as total
FROM tool_outcomes
WHERE timestamp > ?
GROUP BY tool_name
HAVING total >= 3
```

## Common Pitfalls

### Pitfall #1: Flat Aesthetic Scores

The most common issue on first integration. All 5 scores produce identical values turn after turn. **This is NOT a bug in the evaluator** — it's a signal delivery gap. The scoring formula is deterministic and needs variable inputs:

- **Concision (0.700)**: pins here unless confidence < 0.5 or frustration > 0.4. With typical confidence ~0.7, it never deviates.
- **Effectiveness (0.500)**: pins here unless tool_rates are passed with `n_samples >= MIN_SAMPLES_FOR_BASELINE` (default 3). If the consumer doesn't query tool_outcomes, every tool's n_samples=0, and the branch to tool_rates is skipped entirely, producing `base = confidence = 0.5`.
- **Coherence (0.600)**: pins here if episodes=[]. Needs episode data to compute variance.
- **Naturalness (0.700)**: should shift to 0.800 at confidence ≥ 0.7. If it stays at 0.700, check whether confidence is actually reaching the evaluator.
- **Consistency (~1.0)**: when all 4 inputs are identical every time, deviation from baseline is zero → perfect consistency. Will fix itself once other dimensions produce variance.

**Fix:** Feed all 5 signal types from live DB queries. See Step 1 above for exact queries.

### Pitfall #2: Evaluating the Wrong Context String

The evaluator's `context` field stores the last 200 chars of whatever you pass. Currently the Hermes integration passes the *user's input message* as context — but the scores reflect the agent's output quality. The context should be the *output being evaluated*, not the input that triggered it. When you see contexts like "Ok proceed with option 3?" for a concision score, the evaluator's context is misleading.

### Pitfall #3: Policy Override Lifetime

Default lifetime is 14 days. The self-improvement cycle is weekly. This means an override created by one cycle will still be active for the *next* cycle — giving a window to measure before/after. If you skip a cycle, the override expires before a measurement pass. For first-cycle diagnosis, just check status and measured_effect after 1 week.

### Pitfall #4: Self-Improvement First Cycle

The first self-improvement cycle fires with `metrics_before` all at 0.5 (default baselines). This is because `MIN_TOTAL_EVALS = 5` requires 5 evaluations before the diagnosis is meaningful, but the cycle can fire before that threshold is met. The first cycle is essentially a placeholder — its real value is establishing the policy override so the **second** cycle has something to measure against.

Check: `cycle.status == "in_progress"` with empty `metrics_after` means it hasn't been completed yet. You need to call the completion method when enough data has accumulated.

### Pitfall #5: FaithfulnessFilter Needs an LLM Client

```python
filter = FaithfulnessFilter(
    llm_client=some_client,       # REQUIRED for reviser to regenerate faulty sentences
    audit_callback=record_event,  # optional but recommended
)
```

The filter constructs 4 subcomponents: `ClaimExtractor` (no deps), `GroundTruthLookup` (no deps except SPEC.md path), `Verifier` (no deps), and `Reviser` (requires LLM client for sentence-level regeneration). If you don't pass an `llm_client`, the reviser can only strip (remove the sentence) — it can't regenerate. For a consumer integration within Hermes, pass the same Ollama client the main loop uses, but be aware this is an extra LLM call per turn.

## References

- `cognitive-architecture-audit/references/aesthetic-evaluator-live-calibration.md` — Full diagnostic of the flat-scoring issue with exact formula analysis and DB query patterns
- `cognitive-architecture-audit` — Phase 4 section on post-completion live validation
- `self-audit-cognitive-autonomy` — Runtime verification stack for checking live state
