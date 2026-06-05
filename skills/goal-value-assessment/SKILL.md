---
name: goal-value-assessment
description: "Post-hoc value assessment for self-completed goals. Measures whether a goal actually changed Athena's durable state — artifact production, cross-references from other systems, tool-chain reuse — not just execution success."
category: cognitive-agent
triggers:
  - "how do you know if a goal was useful"
  - "what is the goal value assessment system"
  - "goal_value_signals table"
  - "value assessment pass"
  - "artifact density metric"
  - "post-hoc goal evaluation"
  - "assess_goal_value"
  - "run_value_assessment_pass"
metadata:
  hermes:
    tags: [autonomy, goals, evaluation, value, artifacts, feedback]
    related_skills: [autonomous-goal-resolution, self-audit-cognitive-autonomy, fix-completion-detection]
---

# Goal Value Assessment

## What It Solves

The completion metrics (success/fail, attempt count, days active) measure whether a goal executed cleanly — not whether it *mattered*. A goal can complete successfully but produce no durable artifact, be retrieved by no subsequent system, and teach nothing. That's zero value despite a clean execution log.

The value assessment pass closes this gap with a four-signal composite score.

## The Four Signals

| Signal | What it measures | Source | Range |
|--------|-----------------|--------|-------|
| **artifact_found** | Did the goal produce a note/analysis that exists in `athena_notes`? | SQLite pattern matching on note id prefix + content token overlap | 0 or 1 |
| **cross_references** | How many subsequent episodes mention this goal's content or ID? | `episodes` table LIKE query since completion | integer (0 → N, capped at 3) |
| **tool_chain_score** | Were the same tools used after this goal, with what success rate? | `tool_outcomes` grouped by tool_name after completion | 0.0 – 1.0 |
| **composite value_score** | Geometric mean of all three — zero on any = zero | `(artifact × cross_ref × tool) ** (1/3)` | 0.0 – 1.0 |

The geometric mean is deliberate: a goal that produced no artifact, was never referenced again, and whose tools failed afterward has zero value regardless of execution stats.

## Architecture

```
Terminal transition hook (agent.py)
  └─ On goal completed (importance ≥ 0.6)
       └─ assess_goal_value(db_path, goal_id, content)
            ├─ _did_goal_produce_artifact()  — athena_notes lookup
            ├─ _count_cross_references()     — episodes LIKE query
            └─ _compute_tool_chain_score()   — tool_outcomes GROUP BY
            └─ store_value_signal()          — writes to goal_value_signals table

Heartbeat handler (heartbeat_handlers.py)
  └─ run_value_assessment_pass(agent)       — every 6h
       └─ Iterates recent completions
            └─ Sampling: high-importance → 100%, moderate → 50%, low → 25%
            └─ assess_goal_value() + store_value_signal()
            └─ Records maintenance event with summary

Proposer feedback (goal_proposer.py)
  └─ past_outcomes block
       └─ Each outcome annotated with ⭐ value≥0.5, ⚠ value<0.1 for completed
       └─ Proposer sees value alongside completion stats
```

## Table Schema

```sql
CREATE TABLE IF NOT EXISTS goal_value_signals (
    goal_id         TEXT PRIMARY KEY,
    value_score     REAL NOT NULL DEFAULT 0.0,
    assessed_at     REAL NOT NULL,
    artifact_found  INTEGER NOT NULL DEFAULT 0,
    cross_references INTEGER NOT NULL DEFAULT 0,
    tool_chain_score REAL NOT NULL DEFAULT 0.0,
    sampled         INTEGER NOT NULL DEFAULT 0,  -- 1 if sampled vs exhaustive
    component_scores TEXT NOT NULL DEFAULT '{}',  -- JSON breakdown
    assessor_version TEXT NOT NULL DEFAULT '1.0'
);
```

## Sampling Strategy

| Importance | Sample rate | Rationale |
|-----------|-------------|-----------|
| ≥ 0.7 | 100% (exhaustive) | High-novelty goals most likely to teach something |
| ≥ 0.5 | ~50% | Moderate value potential |
| < 0.5 | ~25% | Low-novelty compliance work, low signal density |

The sampling biases toward the goals most likely to produce meaningful signals, keeping assessment cost bounded.

## Files

| File | Role |
|------|------|
| `cognitive_agent/goal_value_assessor.py` | All signal helpers + `assess_goal_value()` + `run_value_assessment_pass()` |
| `cognitive_agent/agent.py:1105-1130` | Immediate assessment on terminal transition hook (importance ≥ 0.6) |
| `cognitive_agent/heartbeat_handlers.py` | `goal_value_assessment` handler, 6h cadence |
| `cognitive_agent/goal_proposer.py:322-355` | Value score annotation in past_outcomes prompt block |

## Usage

```python
from cognitive_agent.goal_value_assessor import (
    ensure_value_signals_table,
    assess_goal_value,
    store_value_signal,
    run_value_assessment_pass,
)

# Assess a single goal immediately
assessment = assess_goal_value(db_path, goal_id, goal_content)
store_value_signal(db_path, goal_id, assessment, sampled=False)

# Run a full pass (heartbeat style)
outcome = run_value_assessment_pass(agent)
print(f"Assessed {outcome['assessed']} goals, avg value: {outcome['avg_value']}")

# Query results
import sqlite3
conn = sqlite3.connect(db_path)
rows = conn.execute(
    "SELECT goal_id, value_score, artifact_found, cross_references "
    "FROM goal_value_signals ORDER BY value_score DESC LIMIT 10"
).fetchall()
```

## The Design Frame

The key insight from the design session (June 3, 2026): this system measures **Athena-value**, not Greg-value. The old default was "does Greg find this useful?" The correct frame is "did this change MY durable state?" — artifact density, cross-reference recall, and learning signal are self-referential metrics that don't require external evaluation.

This is documented in the `self-audit-cognitive-autonomy` skill under "Reflexive Evaluative-Framing Trap" (Rule 0b sub-trap, added 2026-06-03).