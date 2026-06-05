# Proposals Table Architecture (2026-06-01)

## Purpose

The `proposals` table enables retrospective analysis of the arbiter-vs-need-decay path that was previously invisible. Every proposal creates a row; joining against `goals.status` answers "when the arbiter failed and need-decay won, how often did the goal complete?"

## Schema

Created by `drives.PROPOSALS_SCHEMA` constant, executed by `drives.ensure_schema()`:

```sql
CREATE TABLE IF NOT EXISTS proposals (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at        REAL NOT NULL,
    drive_winner      TEXT NOT NULL,
    goal_id           TEXT,
    goal_importance   REAL,
    used_arbiter      INTEGER NOT NULL DEFAULT 0,
    arbiter_reasoning TEXT DEFAULT '',
    arbiter_candidates TEXT DEFAULT '[]',
    drive_needs       TEXT DEFAULT '{}',
    drive_gap         REAL
);
```

## Wiring

### Multi-drive proposer (`goal_proposer.py:1611`)

Called from `_orchestrate_propose_goal` after the arbiter (if used) or pure-B winner is determined:

```python
drives_mod.record_proposal(
    agent.db_path,
    winner,
    outcome.get("goal_id"),
    was_arbitrated=needs_arbiter,
    goal_importance=outcome.get("importance"),
    arbiter_reasoning=arbiter_reasoning,
    arbiter_candidates=list(candidates.keys()) if candidates else None,
    drive_needs={k: round(v, 3) for k, v in needs.items()},
    drive_gap=round(gap, 3),
)
```

### Idle curiosity (`messaging.py:499`)

Called from `send_curiosity_observation` after the single-drive proposal:

```python
drives_mod.record_proposal(
    agent.db_path,
    drives_mod.DRIVE_CURIOSITY,
    outcome.get("goal_id"),
    was_arbitrated=False,
    goal_importance=outcome.get("importance"),
)
```

## Design Decisions

- **goal_id may be NULL.** Proposals that fail validation gates (confabulated source path, shape rejection) never create a goal row. Recording them anyway lets cooldown/decelerator analysis work — you can see "proposer fired 3 times, all rejected" rather than "proposer seems idle."
- **arbiter_reasoning stores both success and failure strings.** On arbiter failure, stores the error type (`"no_ollama_client"`, `"arbiter_returned_no_choice"`, `"arbiter_picked_non_candidate"`). On success, stores the LLM's actual rationale. No separate column needed.
- **drive_needs is a full snapshot.** All four drives' needs at proposal time, not just the winner's. Enables "was the gap really that close?" type queries against the arbiter invocation condition.
- **Zero LLM cost.** The insert is a 2-line SQLite statement. Schema creation is a cron-once via `ensure_schema`.

## Production DB

The table lives at `~/athena_memory.db` alongside 56+ other tables (goals, tool_outcomes, episodes, etc.). Created by importing `drives.ensure_schema()` in the same process:

```python
from cognitive_agent.drives import ensure_schema
ensure_schema('/Users/gregdreyfus/athena_memory.db')
```

## See also

- `fix-completion-detection` skill — Proposals Telemetry Table section for query templates
- `drives.py` — `record_proposal()` function at line 214, schema constant at line 138
- `goal_proposer.py` — call site at line 1611
- `messaging.py` — call site at line 499