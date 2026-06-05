# Confidence Persistence & Proposals Telemetry (June 1, 2026)

Two cross-cutting infrastructure improvements from a single session, both
closing data-continuity gaps that silently degraded diagnosis quality.

## 1. ConfidenceTracker Persistence (metacognition.py)

### Problem

`ConfidenceTracker` used two in-memory `deque` rolling windows (length 20)
to track retrieval hit-rate and action success rate. On every gateway restart,
both deques emptied and confidence reset to 0.5 (neutral). The
SelfImprovementLoop's weekly diagnosis reads `confidence` as one of its 10
subsystem scores — a restart at hour 60 of a 168-hour cycle blinded it to
recent trends until ~20 new events accumulated.

### Solution

**New table:** `confidence_checkpoints` — single-row store holding both deques
as JSON.

**New methods on `ConfidenceTracker`:**
- `_load_from_db()` — called on `__init__`, restores deques from checkpoint,
  re-runs `_recompute()` so `get_confidence()` returns the pre-restart value
  immediately
- `_persist()` — writes deques to checkpoint, called from `_recompute()`
  (every event) and `reset()` (cleared state)
- `set_persistence(db_path)` — wired from `MetacognitionEngine.__init__`:
  `self.confidence.set_persistence(str(self.db_path))`

### Files changed

- `cognition/metacognition.py`: ~60 lines added (imports, logger, 4 new
  methods, 2 new call-wires). All best-effort (try/except on every DB path).

### Schema

```sql
CREATE TABLE IF NOT EXISTS confidence_checkpoints (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at REAL NOT NULL
);
```

Design choice: single key `"histories"` rather than row-per-event, avoiding
write amplification.

---

## 2. Proposals Telemetry Table (drives.py)

### Problem

Every proposal produces a rich outcome dict (drive_winner, was_arbitrated,
arbiter_reasoning, drive_needs, drive_gap) but this data only lives in the
return dict — never persisted. Questions like "when the arbiter fails and
need-decay wins, how often does that goal complete?" were unanswerable.

### Solution

**New table:** `proposals` — row per proposal with all arbiter/need-decay
context. The existing `record_proposal()` was expanded to accept optional
telemetry fields and INSERT a row.

### Schema

```sql
CREATE TABLE IF NOT EXISTS proposals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at      REAL NOT NULL,
    drive_winner    TEXT NOT NULL,
    goal_id         TEXT,
    goal_importance REAL,
    used_arbiter    INTEGER NOT NULL DEFAULT 0,
    arbiter_reasoning TEXT DEFAULT '',
    arbiter_candidates TEXT DEFAULT '[]',
    drive_needs     TEXT DEFAULT '{}',
    drive_gap       REAL
);
```

### Files changed

- `drives.py`: PROPOSALS_SCHEMA constant, wired into `ensure_schema()`,
  expanded `record_proposal()`
- `goal_proposer.py`: call-site wiring (all fields)
- `messaging.py`: call-site wiring (goal_importance only)

### Key query this enables

```sql
-- When arbiter failed and need-decay won, how often did the goal complete?
SELECT p.arbiter_reasoning, p.drive_winner, g.status, g.attempt_count
FROM proposals p LEFT JOIN goals g ON g.id = p.goal_id
WHERE p.used_arbiter = 0
  AND p.arbiter_reasoning LIKE '%arbiter%failed%'
ORDER BY p.created_at DESC;
```

---

## Combined impact

- Restart mid-cycle → confidence rehydrates → SelfImprovementLoop sees real
  trends on first tick after bounce
- A week of proposals → queryable arbiter-fallback quality data