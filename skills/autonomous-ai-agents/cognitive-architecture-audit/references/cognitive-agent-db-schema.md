# Cognitive Agent DB Schema & State

Source DB: `/Users/gregdreyfus/cognitive-agent/cognitive_agent.db` (221 KB)

## Tables (12 total)

| Table | Purpose | Status (Jun 1) |
|-------|---------|-----------------|
| `aspirations` | Perpetual identity markers | 3 rows, 0 goals attached |
| `athena_notes` | Athena's saved notes | 0 rows |
| `episodes` | Episode memory | 0 rows |
| `episodes_archive` | Archived episodes | 0 rows |
| `goals` | Self-proposed goals | **0 rows** — ALL goals have been cleared / never persisted |
| `graph_state` | Concept graph state | 0 rows |
| `motivation_state` | Drive/motivation system state | 1 row (importance=0.5, urgency=0.8) |
| `pending_reminders` | Pending reminders | 0 rows |
| `policy_overrides` | Override policies | 0 rows |
| `self_goal_outcomes` | Completed/abandoned goal records | 0 rows |
| `self_improvement_cycles` | Self-improvement cycle state | 0 rows |
| `tasks` | Decomposed subtasks | **42 rows** (29 pending, 13 blocked) |

## stale-task orphan pattern

42 tasks from 5 exploded goal plans, all parented to goals that were never persisted (proposer crashed before writing to `goals` table). Task IDs reveal the phantom-premise genealogy:

```
decomp_m1_test_exists_now_st_*   (10 tasks) — "Test existence of now-stale artifacts"
decomp_m1_test_generic_st_*      (5 tasks)  — "Generic test"
decomp_m1_test_phantom_st_*      (7 tasks)  — "Phantom artifact check"
decomp_prod_test_existing_st_*   (7 tasks)  — "Test existing production artifacts"
decomp_prod_test_generic_st_*    (7 tasks)  — "Generic production test"
decomp_prod_test_phantom_st_*    (7 tasks)  — "Phantom production artifact check"
```

All created May 30, 2026 (timestamp ~17802xxxxx). All reference `/tmp/athena_premise_verifier/` or `/tmp/phantom_premise_verifier/` — directories that never existed.

### Cleanup Query

```sql
DELETE FROM tasks WHERE parent_goal_id IS NULL;
```

Or to preserve the record of the hallucination event:

```sql
UPDATE tasks SET status = 'retired' WHERE paren_id IS NULL;
```

## Full Schema

```sql
-- goals
CREATE TABLE goals (
    id              TEXT PRIMARY KEY,
    parent_id       TEXT,
    content         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active',
    importance      REAL NOT NULL DEFAULT 0.5,
    urgency         REAL NOT NULL DEFAULT 0.5,
    created_at      REAL NOT NULL,
    updated_at      REAL NOT NULL,
    subgoal_ids     TEXT NOT NULL DEFAULT '[]',
    failure_count   INTEGER NOT NULL DEFAULT 0,
    attempt_count   INTEGER NOT NULL DEFAULT 0,
    source          TEXT NOT NULL DEFAULT 'user',
    risk_tier       TEXT NOT NULL DEFAULT 'autonomous',
    approval_status TEXT NOT NULL DEFAULT 'approved',
    reasoning       TEXT NOT NULL DEFAULT '',
    parent_aspiration_id TEXT,
    goal_type       TEXT NOT NULL DEFAULT 'project',
    horizon         TEXT NOT NULL DEFAULT 'medium_term',
    success_criteria TEXT NOT NULL DEFAULT '',
    deadline        REAL,
    review_at       REAL,
    last_progress_at REAL,
    goal_class      TEXT NOT NULL DEFAULT 'unknown',
    drive           TEXT,
    plan_id         TEXT,
    milestone_index INTEGER,
    resume_context  TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (parent_id) REFERENCES goals(id)
);

-- aspirations
CREATE TABLE aspirations (
    id          TEXT PRIMARY KEY,
    content     TEXT NOT NULL,
    summary     TEXT NOT NULL DEFAULT '',
    importance  REAL NOT NULL DEFAULT 0.5,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  REAL NOT NULL,
    updated_at  REAL NOT NULL,
    source      TEXT NOT NULL DEFAULT 'user',
    reasoning   TEXT NOT NULL DEFAULT ''
);

-- tasks
CREATE TABLE tasks (
    id              TEXT PRIMARY KEY,
    parent_goal_id  TEXT,
    content         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active',
    due_at          REAL,
    created_at      REAL NOT NULL,
    completed_at    REAL,
    FOREIGN KEY (parent_goal_id) REFERENCES goals(id)
);
```

## State Analysis (June 1, 2026)

The DB is in a **resetting state**: zero goals, zero outcomes, zero episodes, but 42 orphaned tasks and 3 aspirations with no children. The cycle has fired, the proposer has run and crashed, the decomposer has created subtasks, but no goals were ever persisted. This is consistent with the proposer crash (AttributeError from stale .pyc) that prevented goal creation for ~3 days.

The `motivation_state` row shows importance=0.5 (neutral) and urgency=0.8 (high) — the system is motivated but has nothing to act on. Once the proposer fixes and creates goals, the DB will populate from the top (`goals` with `aspirations` as parents → `tasks` as children → `self_goal_outcomes` as completion records).

## Diagnostic Queries

```sql
-- Full state snapshot
SELECT 'goals', count(*) FROM goals
UNION ALL SELECT 'aspirations', count(*) FROM aspirations
UNION ALL SELECT 'tasks', count(*) FROM tasks
UNION ALL SELECT 'outcomes', count(*) FROM self_goal_outcomes
UNION ALL SELECT 'episodes', count(*) FROM episodes;

-- Orphaned tasks (no parent goal)
SELECT count(*) FROM tasks WHERE parent_goal_id IS NULL;

-- Motivation state
SELECT * FROM motivation_state;

-- Recent outcomes (after proposer is fixed and running)
SELECT goal_id, terminal_status, attempt_count, drive
FROM self_goal_outcomes
ORDER BY recorded_at DESC LIMIT 10;
```