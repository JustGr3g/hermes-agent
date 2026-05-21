# Goal Retriage Verdicts — May 19, 2026

Run by inline SQLite execution (heartbeat handler `goal_retriage` was on disk but not registered in the running `ai.athena.server` process — required a server restart to load).

## Context

33 SUSPENDED goals existed in `athena_memory.db` (at `~/athena_memory.db`). Most were suspended by the fail-rate gate during the May 15-18 period when `tool_dispatcher` had an f-string regression, `auto_fetch` had an OAuth failure, and various tools were flaky.

Two fixes landed on May 19:
1. `motivation.unsuspend_goal()` — clears failure_count, preserves attempt_count
2. `repair/goal_retriage` heartbeat — 6h interval, idle≥1h, reads tool_outcomes per suspended goal

But the heartbeat wasn't registered until the server restarted. Inline execution was used to classify and apply verdicts immediately.

## Classification Logic

```
For each SUSPENDED goal:
1. If attempt_count >= 12:
   → ABANDON (at ceiling, would re-exhaust)
2. Query tool_outcomes for DISTINCT tools the goal FAILED on (success=0)
   If no tool_outcomes rows link to this goal:
   → REVIEW (no telemetry signal to judge)
3. For each failed tool:
   - Count calls in last 24h (timestamp >= now - 86400)
   - If >=5 calls AND success_rate >= 0.80:
     → mark as RECOVERED
4. If any failed tool is RECOVERED:
   → RETRY (unsuspend: status='active', failure_count=0, resume_context cites recovered tools)
   Else:
   → REVIEW (failed tools have no recent recovery signal)
```

## Results

| Verdict | Count | Detail |
|---------|-------|--------|
| RETRY | 16 | Unsuspended, now ACTIVE |
| ABANDON | 0 | None at attempt ceiling |
| REVIEW | 17 | Left SUSPENDED — no telemetry to judge |

### Recovery Drivers

- **terminal**: 11 calls, 9 ok (82%) — unsuspended 12 goals
- **read_vault**: 9 calls, 9 ok (100%) — unsuspended 4 goals

### Review Bucket

Two sub-categories:

1. **OpenCode-blocked (2 goals):**
   - `bc3648b9` — failed on `opencode_edit` (0 calls in 24h)
   - `b50c0e35` — failed on `opencode_run` (0 calls in 24h)
   - These need the tool to fire >=5 times with >=80% success before retriage can act

2. **No tool_outcomes data (15 goals):**
   - Goals were suspended but have zero rows in the tool_outcomes table
   - May have been suspended via non-tool path (frustration before first tool call, or suspension predated tool_outcomes tracking)
   - Cannot make data-driven classification — needs manual review

## SQL Used

```sql
-- Find suspended goals
SELECT id, status, content, attempt_count, failure_count 
FROM goals WHERE status = 'suspended' ORDER BY content;

-- Tools a specific goal failed on
SELECT DISTINCT tool_name FROM tool_outcomes 
WHERE goal_id = ? AND success = 0;

-- Recent health of a tool
SELECT COUNT(*) as n, SUM(CASE WHEN success=1 THEN 1 ELSE 0 END) as s 
FROM tool_outcomes 
WHERE tool_name = ? AND timestamp >= ?;

-- Unsuspend (apply retry verdict)
UPDATE goals SET status = 'active', failure_count = 0, 
    resume_context = ?, updated_at = ? 
WHERE id = ? AND status = 'suspended';
```

## Key Insight

The 15 "no tool_outcomes data" goals reveal a gap: the suspension mechanism (MotivationSystem.suspend_goal) doesn't require tool_outcomes rows to be created. Goals can be suspended due to frustration (≥3 ticks of `no_tool_resolution`, `guard_denied`, or other non-tool failures) without ever producing a tool_outcomes record. The retriage module's `_tools_failed_on_goal` query returns empty → verdict is "review" with no actionable path forward.

For future: if a goal has `failure_count > 0` and `attempt_count > 0` but zero tool_outcomes, the suspension reason is probably frustration-driven (non-tool failure). These need a different classification basis — possibly from metacognitive_events or heartbeat_state tables.
