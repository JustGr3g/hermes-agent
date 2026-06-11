# Test fixtures for `MotivationSystem` (and `IF NOT EXISTS`-schema modules)

## The pitfall

`cognitive_agent.cognition.motivation.MotivationSystem` initializes its tables via `_ensure_db()` which executes a `SCHEMA` constant containing `CREATE TABLE IF NOT EXISTS` for `goals` and `self_goal_outcomes`. The `Goal` dataclass reads ~29 columns (id, parent_id, content, status, importance, urgency, created_at, updated_at, subgoal_ids, failure_count, attempt_count, source, risk_tier, approval_status, reasoning, parent_aspiration_id, goal_type, horizon, success_criteria, deadline, review_at, last_progress_at, goal_class, drive, plan_id, milestone_index, resume_context, response_channel, suspend_count).

When a test fixture pre-creates a `goals` table with a partial schema (e.g., 8 columns) and the module's `_ensure_db()` runs `CREATE TABLE IF NOT EXISTS`, the partial fixture table wins because `IF NOT EXISTS` is a no-op. Subsequent `Goal.from_dict(dict(row))` calls then raise `TypeError: Goal.__init__() missing 1 required positional argument: '<field>'` for the first field the fixture missed.

## The fix

**Don't pre-create tables the module owns in your test fixture.** The fixture should pre-create only the tables the *test* needs to populate (e.g., `outcomes`, `intentions`), then let `MotivationSystem(db_path=path)._ensure_db()` create the module-owned tables via its own `SCHEMA`. Two-step pattern:

```python
@pytest.fixture
def fresh_db():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        path = f.name
    # 1. Pre-create only test-specific tables (NOT goals / self_goal_outcomes).
    conn = sqlite3.connect(path)
    conn.executescript("""
        CREATE TABLE outcomes (
            id TEXT PRIMARY KEY,
            intention_id TEXT,
            success INTEGER,
            executed_at REAL,
            error TEXT,
            tool_result TEXT
        );
        CREATE TABLE intentions (
            id TEXT PRIMARY KEY,
            parent_goal_id TEXT,
            action_kind TEXT,
            action TEXT,
            proposed_at REAL
        );
    """)
    conn.close()
    # 2. Let the module create its own tables via _ensure_db().
    MotivationSystem(db_path=path)
    yield path
    Path(path).unlink(missing_ok=True)
```

If the test data also needs a `created_at` that's *before* the file's mtime (so the verifier-on-disk check `mtime > created_at` passes), the fixture's `_insert_goal` helper should default `created_at` to `time.time() - 60` rather than `time.time()`. Otherwise the goal's `created_at` is the same instant as the file's mtime, and the strict `>` comparison fails.

## When this pattern applies

- Any module with a `SCHEMA` constant + `_ensure_db()` + `IF NOT EXISTS` pattern.
- Specifically: `MotivationSystem`, `EpisodicMemory`, `IntentionStore`, `CrystallizationStore` — anything in `cognitive_agent/memory_ops.py` and `cognitive_agent/cognition/intentions_store.py` that ships its own schema.
- General rule: **test fixtures should seed the database with test data, not with the module's own tables.** The module's tables belong to the module; the fixture's job is to populate them after creation, not pre-create them with the wrong columns.

## Reference case

`tests/test_review_needs_review_queue.py` (2026-06-09, surprise-to-behavior framework). Initial fixture pre-created `goals` with 18 columns. The module's `_ensure_db` was a no-op for the pre-existing table, so the row's `dict` was missing `parent_id` and 10 other columns that `Goal.from_dict` required. The fix was the two-step pattern above. 10/10 tests passing after the refactor.
