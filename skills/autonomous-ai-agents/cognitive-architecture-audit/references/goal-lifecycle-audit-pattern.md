# Goal Lifecycle Audit Pattern

Walk the full completion/abandon decision chain end-to-end. Use when investigating false abandonments, infinite-loop goals, or zero-active-goals states.

## The 4 Defense Layers

| Layer | What | Where | When |
|-------|------|-------|------|
| 1 | Deterministic fast-path | `_deterministic_completion_check()` — module function | After every successful tool call |
| 2 | LLM detector | `_check_goal_completion()` — method on CognitiveCycle | After #1 passes (no deterministic match) |
| 3 | Augmented target nudge | In `_tick_locked()`, before tool selection | At attempt 3+ and 8+ |
| 4 | Attempt-ceiling gate | In `_tick_locked()`, Gate 2b | Every tick, before tool selection |

Plus: progress-sensitive ceiling extension (12→18), pipeline routing (complete/abandon from Deliberator), delivery force-route (Telegram-shaped goals), and proposer feedback loop (shape performance block).

## Audit Sequence

### Step 1: Check layer 1 — deterministic fast-path
- Read `_deterministic_completion_check()` — verify ALL patterns covered:
  - send_message on telegram-shape goal → done
  - save_note with matching title → done
  - retrieval tool + single result ≥ 40 chars → done
  - retrieval tool + cumulative ≥ 200 chars across ≥3 calls → done
- Verify `_RETRIEVAL_OUTPUT_MIN_CHARS`, `_CUMULATIVE_RETRIEVAL_MIN_CHARS`, `_CUMULATIVE_RETRIEVAL_MIN_CALLS` constants
- **Check for double-count bug:** `recent_tool_calls` already includes the current tick's output (appended at line 1549). If the cumulative fallback adds `len(output_text)` then loops the list, it double-counts.

### Step 2: Check layer 2 — LLM detector
- Read `_check_goal_completion()` — verify cumulative context is built from `recent_tool_calls` and injected into the prompt
- Verify the prompt says "even if this tick's result alone is insufficient" — without this, cumulative context is ignored
- Verify `_save_completion_note()` also receives cumulative context
- **Check for Telegram clutter:** If the goal is a telegram-shape and completed via send_message, `_save_completion_note` should skip writing — the episode log already captures it.

### Step 3: Check layer 3 — augmented target nudges
- At attempt 3+: `[CYCLE NOTE: if prior steps have already gathered the needed information, call complete_goal]`
- At attempt 8+: `[CYCLE NOTE: you MUST call complete_goal now — do NOT repeat the same tool again]`
- Verify `RECENT FIRES` block shows per-tool counts and last output
- Verify `PROGRESS WARNING` injects on stall detection
- Verify `DELIVERY REQUIRED` injects on telegram-shaped goals with evidence

### Step 4: Check layer 4 — attempt ceiling  
- Default: `_MAX_GOAL_ATTEMPTS = 12`
- Progressing: `12 + _PROGRESS_CEILING_EXTENSION = 18`
- Verify `_compute_cumulative_progress()` classifies correctly:
  - Jaccard word-set overlap between consecutive outputs
  - Tool diversity counting
  - Content growth measurement
- Check the "borderline" branch — `"progressing" if cumulative >= 100 else "stalled"`

### Step 5: Check pipeline routing (when `athena_pipeline_enabled=live`)
- `_pipeline_resolve_self()` returns:
  - `complete_goal` tuple for `action_kind == "complete"`
  - `abandon_goal` tuple for `action_kind == "abandon"`
  - `None` for `action_kind == "wait"`
  - `(tool_name, args)` for `tool_call`
- Verify both `complete_goal` and `abandon_goal` are in `SELF_DRIVEN_TOOL_DEFAULT_FILTER`
- Verify DeliberationInput includes `prior_outputs` so the Deliberator sees actual content

### Step 6: Check delivery force-route
- Per-goal `_delivery_refusals_by_goal` counter
- After 2 refusals: override to `send_message` with accumulated evidence
- Reset on correct selection

### Step 7: Check proposer feedback loop
- `shape_perf_block` computed from `self_goal_outcomes` (limit=25)
- Classification by deliverable shape: `telegram-message`, `obsidian-note`, `reminder`, `peer-message`, `code-draft`, `other`
- HIGH ABANDON annotation: ≥3 abandoned AND >50% abandonment rate

## Diagnostic Queries

```sql
-- What tools actually fired for a goal?
SELECT tool_name, success, output_preview
FROM tool_outcomes
WHERE goal_id = '...'
ORDER BY timestamp;

-- What do runtime flags actually say?
SELECT key, value FROM runtime_flags
WHERE key IN ('self_driven_telegram', 'athena_pipeline_enabled');

-- Shape completion rates
SELECT
  CASE
    WHEN content LIKE '%telegram%' THEN 'telegram'
    WHEN content LIKE '%note%' THEN 'note'
    ELSE 'other'
  END AS shape,
  status,
  COUNT(*) as cnt
FROM self_goal_outcomes
GROUP BY shape, status;

-- How many goals are active right now?
SELECT id, content, attempt_count, status
FROM goals
WHERE source_kind = 'self' AND status IN ('active', 'suspended', 'completed', 'abandoned')
ORDER BY created_at DESC;
```

## What to Check in the Runtime Logs

```bash
# Deterministic completions
grep "deterministic completion" ~/.hermes/logs/agent.log

# LLM detector verdicts
grep "_check_goal_completion: complete=" ~/.hermes/logs/agent.log

# Delivery force-routes
grep "delivery_force\|delivery_refusal" ~/.hermes/logs/agent.log

# Progress signals
grep "progress=" ~/.hermes/logs/agent.log

# Pipeline termination judgments
grep "pipeline_self: deliberation returned" ~/.hermes/logs/agent.log

# Auto-exhaustion
grep "auto-abandoning stale goal" ~/.hermes/logs/agent.log

# Proposer crashes
grep "propose_goal failed" ~/.hermes/logs/agent.log
```

## Known False-Abandonment Patterns

| Pattern | Root Cause | Fix |
|---------|-----------|-----|
| 8-12 successful retrievals, zero completions | Cumulative context not fed to detectors | Add `recent_tool_calls` parameter + cumulative logic |
| Telegram-shaped goals hit ceiling with 0`send_message` calls | LLM selector treats it as research task | Delivery directive + force-route after 2 refusals |
| Pipeline returns complete/abandon but cycle ignores it | Silent None return for non-tool_call actions | Route complete→complete_goal, abandon→abandon_goal |
| Proposer keeps generating Telegram goals | Never sees shape performance data | Add `shape_perf_block` with HIGH ABANDON annotation |
| All goals crash silently | Stale `.pyc` from un-recompiled fix | Clear `__pycache__/` after editing lazily-imported modules |