# Goal Pipeline Diagnosis (June 1, 2026)

Diagnostic methodology used when the cycle shows zero active goals or a high abandonment rate. Structured DB queries, traced end-to-end from proposal through selection to outcome.

## When to run this diagnosis

- Self-model or cognitive state reports "zero active goals"
- Abandonment rate > 50% on recent self-proposed goals
- The cycle is firing ticks but producing no completed goals
- A specific goal shape (e.g. Telegram-shaped) keeps being abandoned with 12 attempts and 0-2 failures

## Step 1: Status distribution

```sql
SELECT status, COUNT(*) FROM goals GROUP BY status;
```

If `active` is 0, the pipeline is broken upstream of the cycle (proposer or dispatch). If `active` > 0 but the cycle isn't making progress, the bottleneck is in the cycle itself.

## Step 2: Recent goals

```sql
SELECT id, substr(content, 1, 80) AS content, status, importance, urgency,
       attempt_count, failure_count, source, approval_status, risk_tier,
       created_at
FROM goals
ORDER BY created_at DESC
LIMIT 10;
```

Key patterns to look for:
- **Telegram-shaped goals with attempt_count=12 and failure_count<3**: The LLM selector never picked `send_message` despite the goal requiring it. The cycle successfully researched but never delivered. This is a **selector-routing failure**, not a tool-availability problem.
- **Calibration/diagnostic notes with attempt_count=1**: Trivial `save_note` completions. These indicate the proposer is falling back to low-value goals when no high-quality opportunity exists.
- **Suspended goals with attempt_count=0**: Pre-attempt suspension — the dispatch/triage layer rejected the goal before the cycle could try anything.

## Step 3: Flag state check

```sql
SELECT key, value FROM runtime_flags
WHERE key LIKE '%telegram%' OR key LIKE '%self_driven%'
   OR key LIKE '%autonomy%' OR key LIKE '%pipeline%';
```

The `self_driven_telegram` flag was hypothesised as the bottleneck for Telegram-shaped goals, but in practice it's usually `1` (ON). The real bottleneck is the LLM selector never picking `send_message` — not a permission layer. Always verify the flag before diagnosing permission issues.

## Step 4: Tool outcomes per goal

```sql
SELECT goal_id, tool_name, success, COUNT(*)
FROM tool_outcomes
WHERE goal_id IN (
    SELECT id FROM goals
    WHERE source='self_proposed'
    ORDER BY created_at DESC
    LIMIT 10
)
GROUP BY goal_id, tool_name
ORDER BY goal_id;
```

This is the smoking gun. For Telegram-shaped goals, look for zero `send_message` rows. If all rows are research tools (`recall_memory`, `opencode_run`, `read_vault`, `list_goals`, `drive_search`), the selector structurally refuses to route to delivery.

**Observed pathology (June 1, 2026):** Goal `7c879f62` ("A Telegram to Greg about structural_retention.py") fired 10× `opencode_run` successfully, then hit the 12-attempt ceiling and was abandoned. Zero `send_message` calls. Goal `c324b840` fired 12× `list_goals`. The LLM selector treats "Telegram Greg about X" as a research task rather than a delivery task.

## Step 5: Completion/abandonment pattern

```sql
SELECT id, substr(content, 1, 60) AS content, status, attempt_count, failure_count, created_at
FROM goals WHERE source='self_proposed'
ORDER BY created_at DESC
LIMIT 20;
```

On June 1, 2026, the pattern was: 3 completed (calibration notes, 1-3 attempts) + 6 abandoned/suspended (Telegram-shaped, all hit 12-attempt ceiling with <3 failures) + 1 needs_review. The completed goals were trivially satisfiable; the abandoned ones had genuine findings that were never delivered.

## Step 6: Proposer feedback loop check

The proposer's prompt includes a `shape_perf_block` computed from recent self-proposed goals. To validate it's rendering correctly:

```sql
SELECT COUNT(*) as cnt, terminal_status, drive FROM self_goal_outcomes
GROUP BY terminal_status, drive ORDER BY cnt DESC;
```

The shape classifier in `goal_proposer.py` (`_classify_shape`) tags goals by deliverable type. The computed block renders completion rate per shape and annotates high-abandon shapes. If Telegram-shaped goals are still being proposed despite the annotation, either:
- The annotation threshold (≥3 abandoned, >50% rate) is too low to fire — check recent self_goal_outcomes
- The LLM is ignoring the annotation — the shape performance block is advisory, not a hard gate
- The no-better-alternative corner case fires: the proposer defaults to Telegram when no other shape makes sense with the available evidence

The per-shape performance block feeds back into proposal quality. A goal that completes via the delivery force-route still records a completed outcome in `self_goal_outcomes`, which improves the shape's performance statistics for future proposals.

## Full pipeline closure diagram

```
Proposer (goal_proposer.py)
  │
  ├── shape_perf_block ← reads self_goal_outcomes ← ─ ─ ─ ─ ─ ─ ┐
  │   (deprioritizes high-abandon shapes)                         │
  │                                                                │
  ▼                                                                │
Goal created → motivation.create_goal()                            │
  │                                                                │
  ▼                                                                │
Cycle picks goal (cognitive_cycle.py _tick_locked)                 │
  │                                                                │
  ├── cumulative completion check (deterministic + LLM)            │
  ├── progress ceiling (12→18 if Jaccard-diverse)                  │
  ├── delivery enforcement (force-route Telegram after 2 refusals) │
  │                                                                │
  ▼                                                                │
Goal completes → ag.motivation.complete_goal()                     │
  │               → self_goal_outcomes.insert() ────────────────────┘
  │
  ▼
Proposer sees improved shape stats → different proposal next cycle
```

In `cognitive_cycle.py`, two-tier fix at the augmented target and tool-resolution steps:

**Tier 1 — Prompt directive** (after the progress-stall signal block): When a Telegram-shaped goal has gathered evidence in prior ticks, inject `[DELIVERY REQUIRED: this goal's deliverable is a Telegram to Greg. You MUST call send_message now with the findings as the message body — do NOT research further.]` into the augmented target.

**Tier 2 — Force route** (after tool selection, before goal_id injection): If the selector picks a research tool despite the directive, increment a per-goal refusal counter. After 2 refusals, override the selected tool to `send_message` with accumulated evidence from `_recent_tool_calls` as the message body. The refusal counter resets when the selector correctly picks `send_message`.

Implementation details:
- Force-route builds message from last 5 successful tool output previews (600 chars each) + goal content as "Found: ..." prefix
- Total message capped at 1500 chars
- Resets on correct selection so one good pick doesn't carry baggage

This is necessary because the observed pathology shows the LLM structurally refuses to switch from research to delivery even with strong prompt directives (10+ ticks of research after the directive was injected).