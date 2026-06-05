# Superseded Goal Triage

When Greg says "clear the superseded ones" from a needs_review queue, follow this workflow.

## Signals That a Goal Is Superseded

Any one of these is sufficient to mark it completed with a note:

1. **Plan-chain staleness** — goal is M(N) on a `plan_id` whose M0 is itself needs_review/abandoned/stale. The whole chain is dead; prune all siblings.
2. **Age + no execution** — 7+ days old with ≤3 attempts and none in the last 48h. The diagnostic window has closed.
3. **Content resolved by live work** — the question the goal asks (e.g. "diagnose accuracy gaps") has been answered by a code patch or a different investigation that Greg or you shipped since the goal was created.
4. **Supporting goal for a superseded parent** — goal whose content references/is structurally dependent on another goal that is itself superseded. Prune the support file, not just the root.

## Workflow

### 1. Find the canonical DB

The goals live in `~/athena_memory.db` (not `cognitive_agent.db` or any DB inside the hermes checkout). Verify:

```bash
python3 -c "
import sqlite3
db = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
cur = db.execute('SELECT status, COUNT(*) FROM goals GROUP BY status ORDER BY COUNT(*) DESC')
for r in cur.fetchall():
    print(f'{r[0]}: {r[1]}')
db.close()
"
```

### 2. Get the full needs_review list

```python
cur = db.execute("SELECT id, content, status, importance, attempt_count, failure_count, created_at, plan_id FROM goals WHERE status='needs_review' ORDER BY created_at ASC")
```

Key fields for triage:
- `plan_id` — if set, the goal is part of a plan chain. Check the other milestones' statuses.
- `attempt_count` — low + old = never prioritized, likely superseded by context shift.
- `created_at` — convert with `datetime.fromtimestamp(ts).strftime('%m-%d')`. 7+ days in this queue is very stale.

### 3. Cross-reference against current state

For each candidate, ask:
- Does the plan chain still have healthy siblings? If the chain is dead, the whole set is superseded.
- Has the question been answered by work done since the goal was proposed? (e.g. "diagnose accuracy gaps" → answered by verifying `__pycache__` was the root cause, not accuracy; the triple patch shipped.)
- Is the premise still true? (e.g. "search vault for X notes" only useful if X notes still need searching.)

### 4. Update with reason

```python
reason = "Concise reason string — e.g. 'plan chain stale, sibling abandoned' or 'content resolved by cdee83a triple patch'"
db.execute("UPDATE goals SET status='completed', updated_at=? WHERE id=?", (time.time(), goal_id))
```

Each update needs an independent reason. Don't bulk-apply — the reason is the audit trail for Greg to verify without re-tracing.

### 5. Verify remaining

After clearing, re-query the status distribution:

```python
cur = db.execute("SELECT status, COUNT(*) FROM goals GROUP BY status ORDER BY COUNT(*) DESC")
```

Expected after a pass: needs_review count dropped by N, completed count increased by N.

## Common Patterns

| Pattern | Example | Triage |
|---------|---------|--------|
| Plan-chain orphan | M0 abandoned, M1–M2 still needs_review | All siblings superseded |
| Old diagnosis | "Diagnose CONNECTION_SAT redirects" (May 25) | Context too stale; mark superseded |
| Superseded by fix | "Search vault for accuracy notes" → fix shipped directly | Supporting goal; superseded |
| Still relevant | "Simulator surprise-path → self-model calibration" | Keep — question is still open |