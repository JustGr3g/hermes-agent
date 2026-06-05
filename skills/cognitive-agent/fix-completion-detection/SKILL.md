---
name: fix-completion-detection
description: Fix completion-detection myopia in cognitive_cycle.py — both detectors only see the current tick's result, leading to false abandonment of goals that gather partial findings across multiple ticks.
trigger: |-
  When diagnosing "goal falsely abandoned" or "goal exhausted despite successful tool calls" — where the cycle ran 8+ successful retrieval ticks but hit the attempt ceiling (12) without ever being marked complete.
---

# Fix Completion-Detection Myopia (ENG-2026-0528-002 Pattern)

## Problem

Both completion detectors in `cognitive_cycle.py` only see the **current tick's tool result**:

1. **`_deterministic_completion_check`** (line 300): checks if this single tick's output ≥ 40 chars. If each of 6 retrievals returns 30 chars, none pass individually.
2. **`_check_goal_completion`** (LLM detector, line 2114): feeds only the current result (600 chars max). The LLM never sees the prior 5 retrievals.

Result: the goal loops every tick, accumulating successful tool calls but never being recognized as complete. At attempt count ≥ 12, the auto-exhaustion gate (line 885) calls `abandon_goal`. A false abandonment.

## Solution (3-point patch)

### 1. Deterministic cumulative heuristic

Add constants and a fallback in `_deterministic_completion_check`:

```python
_CUMULATIVE_RETRIEVAL_MIN_CHARS = 200
_CUMULATIVE_RETRIEVAL_MIN_CALLS = 3
```

When the single-result check (< 40 chars) fails, iterate `recent_tool_calls` to sum all prior successful outputs. If cumulative ≥ 200 chars AND at least 3 prior calls exist, return completion.

### 2. LLM detector cumulative context

In `_check_goal_completion`, before building the prompt:

- Accept `recent_tool_calls` parameter
- Build a `cumulative_context` block listing each prior tick's tool + output preview (300 chars each, capped at 800 total)
- Inject it between "Tool result:" and the decision instructions
- Update the "Decide whether..." line to say "based on ALL these results"
- Add a final instruction: "if prior steps already gathered the needed information across multiple ticks, it is complete even if this tick's result alone is insufficient"

### 3. Completion note cumulative context

In `_save_completion_note`, similarly build a cumulative block so the saved note contains the full picture, not just the final trigger.

### Call chain wiring

Pass `recent_tool_calls=self._recent_tool_calls.get(goal.id)` at 3 call sites:
- `_deterministic_completion_check(...)`
- `_check_goal_completion(...)`
- `_save_completion_note(...)`

## Verification

```bash
cd cognitive-agent && python -c "import py_compile; py_compile.compile('cognitive_agent/cognition/cognitive_cycle.py', doraise=True)"
```

## Bonus: Progress-Sensitive Ceiling Extension (June 1, 2026)

After the cumulative-context fix, added a **goal-progress metric** that prevents a different false-abandonment scenario: the hard ceiling of 12 attempts killing a goal that is genuinely discovering new content across many ticks.

### How it works

1. **`_jaccard_words(a, b)`** — module-level helper computing word-set overlap (0.0-1.0) between two strings. Lightweight, no LLM call.
2. **`_compute_cumulative_progress(goal_id)`** — new method on CognitiveCycle that measures:
   - Tool diversity: how many unique tools the goal has fired
   - Content growth: cumulative output chars across all ticks
   - Consecutive Jaccard similarity: overlap between successive outputs
3. **Two call sites:**
   - **Ceiling gate** (line 947): `_compute_cumulative_progress` runs before the exhaustion check. If status == `"progressing"`, the effective ceiling becomes `_MAX_GOAL_ATTEMPTS + _PROGRESS_CEILING_EXTENSION` (12 + 6 = 18). Stalled goals still get abandoned at 12.
   - **Augmented target** (line 1064): if status == `"stalled"`, injects `[PROGRESS WARNING: recent outputs are N% similar — cycling content. Try a DIFFERENT tool or call complete_goal.]` into the LLM dispatcher's prompt.

### Classification rules

| Condition | Verdict |
|---|---|
| avg_jaccard > 0.75 AND last_jaccard > 0.75 AND unique_tools ≤ 2 | **stalled** — cycling same content with same tools |
| avg_jaccard < 0.375 OR cumulative_chars > 200 OR unique_tools ≥ 3 | **progressing** — discovering new content |
| Borderline (middle ground) | progressing if cumulative ≥ 100 chars, else stalled |
| < 3 successful outputs | **data_poor** — not enough signal (base ceiling applies) |

## Bonus: Deliberator Termination Judgment (June 1, 2026)

Two bugs in `_pipeline_resolve_self` (cognitive_cycle.py):

### Bug 1: Deliberator's completion/abandon judgment was silently ignored

At line 1884, `if intention.action_kind != "tool_call"` collapsed `complete`/`abandon` into the same `None` return as `wait`. The cycle treated them as `no_tool_resolution` failures, burning an attempt tick and counting a failure against the goal.

**Fix:** Route action_kind explicitly:

- `complete` → returns `("complete_goal", {"goal_id": ..., "summary": intention.thought})`. Goes through normal execution path (gate checks, outcome recording). The thought serves as the completion summary.
- `abandon` → returns `("abandon_goal", {"goal_id": ..., "failure_reason": intention.thought})`. Same execution path.
- `wait` → returns `None` (no tool to fire, no penalty).
- `tool_call` → proceeds to Execute stage as before.

Note: `complete_goal` and `abandon_goal` are already in `SELF_DRIVEN_TOOL_DEFAULT_FILTER` (lines 168-169) so they pass Gate 4.

### Bug 2: Deliberator saw no output content

The `Recent outcomes for this goal` block in the Deliberate prompt only showed tool name + success + surprise. The Deliberator was asked to judge "is the goal complete" with no visibility into what was gathered.

**Fix:** Added `prior_outputs` field to `DeliberationInput`. `_pipeline_resolve_self` builds it from `_recent_tool_calls.get(goal.id)` — same cumulative context builder as the LLM detector fix. Rendered as `## Prior tool outputs` section. Capped at 800 chars.

Also updated the Task instruction: "If the goal is already satisfied by the information gathered across recent steps (including the Prior tool outputs section above), return action_kind=complete. If the goal can never be satisfied with these tools, return action_kind=abandon."

## Bonus: Proposer Feedback Loop (June 1, 2026)

The proposer (`goal_proposer.py`) already had raw outcome rows and a shape-distribution counter in its prompt, but the LLM couldn't synthesize the signal. When it saw "12 attempts, 0 failures" it interpreted that as a near-miss, not a structural dead end.

**Fix:** Added a `shape_perf_block` computed from `agent.motivation.get_self_proposed_goals(limit=25)`. Classifies each goal into a deliverable shape (`telegram-message`, `obsidian-note`, `reminder`, `peer-message`, `code-draft`, `other`), then computes completion rate per shape. Shapes with ≥3 abandoned goals and >50% abandonment rate get annotated with `← HIGH ABANDON` + guidance text.

**What the proposer's LLM now sees:**

```
Per-shape completion performance (use this to avoid proposing shapes that consistently fail to deliver):
  - telegram-message: 2/9 complete (22%), avg 9.6 attempts ← HIGH ABANDON
    ⚠ Goals in this shape consistently hit the attempt ceiling without delivering.
    The cycle cannot execute them. Prefer 'save a note' shape for equivalent value.
  - obsidian-note: 180/190 complete (95%), avg 1.2 attempts
  - other: 20/35 complete (57%), avg 4.3 attempts
```

**Full pipeline closure:** The proposer now gets per-shape completion performance, the cycle gets cumulative detection + progress ceiling + delivery enforcement. A Telegram-shaped goal proposed with evidence will: get the `[DELIVERY REQUIRED]` directive → if the selector refuses, force-route after 2 refusals → complete → the `self_goal_outcomes` row feeds back into the next proposal's `shape_perf_block` → the proposer deprioritizes Telegram shapes → more `save_note` goals that always complete → no more zero-active-goals state.

## Bonus: Delivery Force-Route for Telegram-Shaped Goals (June 1, 2026)

The LLM tool-selector structurally refuses to pick `send_message` for Telegram-shaped goals. When the goal says "A Telegram to Greg about X," the selector treats it as a research task — fires `recall_memory`, `opencode_run`, `list_goals`, `read_vault` — and never delivers. Observed: 6 Telegram-shaped goals all hit the 12-attempt ceiling with zero `send_message` calls and 0-2 failures.

**Two-tier fix in `cognitive_cycle.py`:**

**Tier 1 — Prompt directive** (at augmented target, after progress-stall block): When a Telegram-shaped goal has gathered evidence in prior ticks, injects:

```
[DELIVERY REQUIRED: this goal's deliverable is a Telegram to Greg. You have already gathered evidence in prior steps. You MUST call send_message now with the findings as the message body — do NOT research further.]
```

**Tier 2 — Force route** (after tool selection, before goal_id injection): Tracks a per-goal refusal counter. When the selector picks a research tool despite the directive, counter increments. At ≥2 refusals, overrides the selected tool to `send_message` with accumulated evidence as the message body. Resets counter on correct selection.

See `references/goal-pipeline-diagnosis.md` for the full diagnostic DB queries and the observed pathology.

See `references/path-claims-deletion-blind-spot.md` for the 2026-06-04 finding: a goal like "remove X" passes the premise-verification gate even when X doesn't exist, because `classify_path_role()` returns `deliverable` for "remove"-verb proximity, and the gate at `goal_proposer.py:977-980` only checks existence on `source` role. Includes the proposed one-line fix and a general lesson on verb-shape blindness.

## Bonus: Success-Criteria Blind Spot (2026-06-01)

Goal objects carry a `success_criteria` field (a text description of the observable state that marks the goal done, populated by the proposer). ~200 goals in the DB have explicit criteria like "A saved note titled X exists" or "A code change at cognitive_cycle.py exists."

**The problem:** Neither completion detector reads `success_criteria`:
1. **`_deterministic_completion_check`** — only matches goal.content against tool-specific regexes (`_GOAL_DELIVERABLE_SAVE_NOTE`, `_TELEGRAM_GOAL_PATTERN`, verb patterns). Has no awareness that the goal has a separate criteria field.
2. **`_check_goal_completion`** (LLM detector) — only receives goal.content and tool results. The LLM judges "done" by tool-result shape alone, without knowing the goal's own definition of done.
3. **Pipeline Deliberator** (`_build_deliberate_prompt`) — shows content, importance, attempt_count, horizon — but not `success_criteria`.
4. **Augmented target** (line 1030) — same omission. The LLM dispatcher receives no criteria context.

**Impact:** A goal like "Investigate the skill library" with success_criteria="A saved note in the vault exists that names the stale entry" fires save_note with the finding, but neither the deterministic check nor the LLM detector recognizes this satisfies the criteria. The goal loops until exhaustion, hitting attempt ceiling 12 and being falsely abandoned — even though the actual deliverable was produced on tick 1.

A saved note titled "[auto] Investigate the skill library" may exist in the vault, but the goal is in `abandoned` status because no detector matched the completed artifact against the criteria.

**Three-layer fix applied 2026-06-01:**

### Layer 1: Deterministic success-criteria matcher

Added `_SUCCESS_CRITERIA_RULES` table (module-level, after `_DOWNSTREAM_VERB_PATTERN`):

```python
_SUCCESS_CRITERIA_RULES: list[tuple[str, re.Pattern, str]] = [
    ("save_note", re.compile(
        r"saved\s+(?:diagnostic\s+|calibration\s+)?note\s+"
        r"(?:titled\s+\"([^\"]+)\"|exists)", re.IGNORECASE,
    ), 'Completed: saved note "{title}" satisfies criteria'),
    ("send_message", re.compile(
        r"(?:telegram\s+message|message\s+sent|message\s+containing)", re.IGNORECASE,
    ), 'Completed: message sent satisfies delivery criteria'),
    ("opencode_edit", re.compile(
        r"code\s+change\s+at\s+\S+|change\s+at\s+\S+\.py\s+exists", re.IGNORECASE,
    ), 'Completed: code edit satisfies change criteria'),
    ("read_vault", re.compile(
        r"(?:note|finding|knowledge|understanding|list\s+of)\s+exists", re.IGNORECASE,
    ), 'Completed: retrieval satisfies knowledge criteria'),
    ("opencode_run", re.compile(
        r"(?:note|finding|knowledge|understanding|list\s+of)\s+exists", re.IGNORECASE,
    ), 'Completed: retrieval satisfies knowledge criteria'),
]
```

Each entry is `(tool_name, regex_to_search_criteria, summary_template_with_{title})`. The regex searches `goal.success_criteria` (passed as new `goal_criteria` param).

The check runs at the end of `_deterministic_completion_check`, after all existing fast-path checks (send_message, save_note, retrieval) but before the fallthrough `return None`:

```python
if goal_criteria:
    for _criteria_tool, _criteria_re, _criteria_tmpl in _SUCCESS_CRITERIA_RULES:
        if tool_name == _criteria_tool and _criteria_re.search(goal_criteria):
            _title = str(tool_context.get("title", "") or "")
            return _criteria_tmpl.format(title=_title)
```

### Layer 2: LLM detector prompt injection

In `_check_goal_completion`, a `criteria_block` is built from `getattr(goal, "success_criteria", "")` and injected between cumulative_context and the decision instructions:

```
Success criteria this goal must satisfy:
{saved note titled "X" exists}
```

Plus a new principle:

```
When success criteria are listed above, use them as THE definitive test: 
if all criteria are satisfied, the goal is complete regardless of whether 
additional downstream work seems possible. The criteria ARE the goal's 
own definition of done.
```

This shifts the LLM's evaluation from "is the tool result shape sufficient" to "does the tool result satisfy the stated criteria." For goals with empty criteria (the majority), the block is empty and the instruction is omitted — zero prompt-bloat.

### Layer 3: Pipeline Deliberator prompt injection

In `_build_deliberate_prompt` (deliberate.py:236), add to the goal_block:

```python
f"success_criteria: {getattr(d.goal, 'success_criteria', '')[:300]}"
```

Lets the Deliberator judge completion against the goal's own criteria when deciding between `action_kind=complete` vs `tool_call`.

### Wiring

The `goal_criteria` param is passed at the single call site in `_execute_step` (~line 1653):

```python
auto_complete = _deterministic_completion_check(
    goal.content, tool_name, tool_context, result,
    recent_tool_calls=self._recent_tool_calls.get(goal.id),
    goal_criteria=getattr(goal, "success_criteria", "") or "",
)
```

### Design principles

- **No false positives on empty criteria:** When `success_criteria == ""` (most goals), the block is omitted from LLM prompts and the criteria table check short-circuits (empty string → no regex match). Zero behavior change for goals without criteria.
- **Precise regex matching:** Each pattern is tool-specific. A save_note on a goal with `success_criteria="A telegram message containing X"` does NOT match. No cross-contamination.
- **Template format:** `{title}` is the only dynamic field, sourced from the actual tool_context. Other parts are static strings — no risk of template-injection from goal text.
- **No LLM cost:** The criteria matcher is pure regex in the deterministic fast-path (Layer 1). The LLM detector prompt injection (Layer 2) is a string concatenation — zero additional tokens when criteria is empty.

### Status as of June 1, 2026 — ALL THREE LAYERS SHIPPED

All three layers were committed in a single session. Layer 1 (deterministic matcher), Layer 2 (LLM detector prompt injection), and Layer 3 (pipeline Deliberator prompt injection) are all live in `cognitive_cycle.py` and `deliberate.py`. Both files compile clean.

The remaining gap (fourth layer) would be augmenting the augmented-target builder (line ~1030) with success_criteria, but that path was historically superceded by the pipeline (which already has it via Layer 3). In `off` mode, the legacy augmented target still lacks criteria visibility, but the pipeline (`live` mode) has full coverage.

### Relationship to existing gaps

The cumulative-context fix (ENG-2026-0528-002) solved the "detector can't see prior ticks" problem. The success-criteria fix solves the "detector can't see the goal's own test for done" problem. Together they eliminate the two structural causes of false abandonment:

| Root cause | Fix | Status |
|---|---|---|
| Detector only sees current tick | Cumulative context + recent_tool_calls param | SHIPPED |
| Detector can't see success_criteria | Criteria matcher + LLM prompt injection + pipeline Deliberator prompt | ALL THREE LAYERS SHIPPED (Jun 1) |
| Goal has vague content but precise criteria | Combination of both above makes criteria the authoritative test | SHIPPED (Jun 1) |

## Pitfalls
- The LLM detector's cumulative block is capped at 800 chars to keep the fast-model call cheap (~200ms). If cumulative history exceeds this, it falls back to tool names + count (less useful but still better than nothing).
- The `_RECENT_TOOL_HISTORY_LEN` of 6 means the cumulative view is a rolling window — tick 1's result may have dropped off by tick 8. The deterministic heuristic counts only what's in the window + the current tick. This is acceptable because the LLM detector can still see the aggregate in the intent store via `recent_outcomes_for_goal()` on the pipeline path.

### Cumulative double-count in deterministic check (cognitive_cycle.py:419-423) — FIXED 2026-06-01

`recent_tool_calls` already contains the current tick's output (appended at line 1549 before the completion check runs). The original code counted the current tick's `len(output_text)` then summed the already-inclusive list, double-counting.

**Final fix:** The `recent_tool_calls` tuple was expanded from 3 elements to 4: `(tool_name, success, output_preview, original_chars)`. The cumulative sum uses `original_chars` (captured before compression/truncation at append time) and sums directly from the list — no separate `len(output_text)` addition:

```python
cumulative = sum(
    _orig for _t, _ok, _out, _orig in recent_tool_calls if _ok and _orig
)
```

### Telegram-shaped goals write clutter `[auto]` notes via _save_completion_note (cognitive_cycle.py:2405) — FIXED 2026-06-01

**Fix:** Added a Telegram-shaped goal guard before `save_note` guard:

```python
if tool_name == "save_note":
    return
if _TELEGRAM_GOAL_PATTERN.search(goal.content or ""):
    return
```

Any Telegram-shaped goal (regardless of completing tool) skips the clutter note.

### Truncated preview undercounts cumulative thresholds — FIXED 2026-06-01

`_recent_tool_calls` stored compressed + truncated output previews (400 chars max). Cumulative thresholds and content-growth ran on compressed lengths — a 2KB output compressed to 60 chars counted as "60 chars grown," causing premature stall detection.

**Fix:** 4th tuple element `original_chars` captured at append time from `len(str(raw_out))` before compression/truncation. Used for cumulative threshold and content_growth. Jaccard and LLM context still use compressed previews (compression removes boilerplate, improving overlap accuracy).

Type annotation changed: `dict[str, list[tuple[str, bool, str]]]` → `dict[str, list[tuple[str, bool, str, int]]]`. 7 unpack sites updated.

### Stale .pyc can mask fixes on lazily-imported modules — DISCOVERED 2026-06-01

The proposer crashed silently for 3 days because `.pyc` was stale. The fix existed in source but never executed.

**Prevention:** After editing lazily-imported modules:

```bash
find ~/cognitive-agent -name '__pycache__' -type d | while read d; do
  find "$d" -name '*.pyc' -delete
done
```

### False self-model premises cascade into zero-active-goals state

The self-model claimed "all script outputs are empty" from a single failed run (06:35, LLM call error) while the 07:12 run produced 7,271 chars. A narrative drift the verifier should catch.

**Lesson:** Cross-check self-model claims against the actual cron log for each data point — don't let a single failure generalize.

### Fresh proposer premise grounding (2026-06-01)

After the confabulated-source-path gate (pre-existing) and the amendment-already-shipped gate, added a higher-level ground-truth block that surfaces **what actually exists** in the vault and notes before the LLM proposes anything.

**What it does:** The proposer prompt now includes a `Ground truth (what actually exists right now):` block showing:
- Total vault file count (from `vault_snapshot` table)
- 7 most recently modified vault files with age labels
- 5 most recent athena_notes titles with age labels

**Design:**
- Zero LLM calls — all aggregate SQLite queries (`SELECT COUNT(*)`, `ORDER BY mtime DESC LIMIT 7`)
- Lightweight (~20ms per proposal)
- If the queries fail (DB locked, table missing), the function returns `""` and the prompt proceeds without the block — soft failure

**Where it fires:** In `_build_ground_truth_block()` at `goal_proposer.py:1468`, called from `_propose_self_goal()` right before the output-JSON instruction.

**Why it works:** Before hallucinating "Claude Code review dry-run findings" as background context, the LLM now sees that no such artifact appears in the vault snapshot or notes list. The ground-truth block acts as a reality-anchor.

**Implementation:**
```python
def _build_ground_truth_block(agent) -> str:
    try:
        conn = sqlite3.connect(agent.db_path)
        conn.row_factory = sqlite3.Row
    except Exception:
        return ""
    try:
        vc = conn.execute("SELECT COUNT(*) FROM vault_snapshot").fetchone()[0]
        recent_vault = conn.execute(
            "SELECT path, mtime FROM vault_snapshot ORDER BY mtime DESC LIMIT 7"
        ).fetchall()
        recent_notes = conn.execute(
            "SELECT title, created_at FROM athena_notes ORDER BY created_at DESC LIMIT 5"
        ).fetchall()
        # Format with human-readable age labels
        return f"Ground truth (what actually exists right now):\n  Vault: {vc} files\n..."
    except Exception:
        return ""
    finally:
        conn.close()
```

**Relationship to existing gates:** The confabulated-source-path gate (`path_claims.classify_and_check`) catches goals that name specific file paths which don't exist. The ground-truth block catches a broader class: goals that reference conceptual artifacts ("the dry-run findings," "last week's review") which are not concrete paths but still don't exist.

### Orphan decomposition subtasks from killed meta-emotional goals (2026-06-01)

**Problem:** 14 pending decomposition subtasks orphaned under parent goal IDs that no longer existed in the goals table. Pattern:
1. SelfImprovementLoop diagnoses a meta-emotional weakness ("confidence at 50%")
2. GoalDecomposer creates subtasks under a parent goal ID like `improve-confidence-2859187a`
3. The parent goal gets killed (abandoned/retracted) — the subtask `parent_goal_id` FK points to a non-existent row
4. The subtasks stay `status='pending'` forever — no cleanup handler fires

**Root cause:** Tasks table has a FOREIGN KEY constraint but SQLite does NOT cascade on DELETE of the parent. The parent goal was likely deleted/expired by a different code path that didn't clean up tasks.

**Mitigation query:**
```sql
UPDATE tasks SET status='done', completed_at=strftime('%s','now') 
WHERE status='pending' 
  AND parent_goal_id NOT IN (SELECT id FROM goals);
```

**Structural prevention:** Consider adding `ON DELETE CASCADE` or a heartbeat sweep handler. Neither exists as of June 1, 2026.

### Pitfall 14: Meta-emotional goals produce orphan subtasks

When the self-improvement cycle emits a goal like "Build confidence in decision-making" — a target named after a *feeling state* rather than a *mechanism* — and the goal gets killed by Greg, the decomposition subtasks (6-8 "Research existing solutions", "Design architecture", etc.) orphan with no cleanup. The parent goal ID vanishes; the tasks stay pending forever.

**Detection:**
```sql
SELECT COUNT(*) FROM tasks WHERE status='pending' 
  AND parent_goal_id NOT IN (SELECT id FROM goals);
```

**Prevention:** Before feeding a self-improvement cycle diagnosis to GoalDecomposer, check whether the goal names a mechanism or a feeling. If the success_criterion is "confidence at 50%" (a feeling), reframe to a mechanism like "implement verify_subtask_blocking gate."

### Pitfall 15: Proposer premise check is deletion-blind (verb-shape blindness)

`path_claims.classify_path_role()` (path_claims.py:109) classifies paths as either `source` (existing context being read) or `deliverable` (output to be created). The proposer premise-check at `goal_proposer.py:977-980` only runs an existence check on `role=='source'` paths.

A goal that says "remove X" or "delete Y" is **both** a deliverable action AND a claim that X/Y exist. `classify_path_role` looks at the 5-token lookback window and picks the closer marker — for "Remove the `temp_bug3_fix` utility functions," `Remove` is closer than any source-marker, so the path is classified as `deliverable` and the existence check is skipped. A goal to remove a non-existent file passes the premise check.

This is a *verb-shape blindness*: the classifier doesn't account for verbs that imply both creation AND existence (delete, remove, drop, clean up, refactor, replace). The bug-3 plan (goal `9ae74a38`, abandoned 2026-06-05) hit this — it referenced `temp_bug3_fix` and `utils/legacy_helper.py`, neither of which exists on disk.

**The one-line patch** (not yet shipped, requires review before behavior change):

```python
# In goal_proposer.py:977-980, change the filter from
#   "role=='source' and not exists" to a verb-aware check:
p for (p, role, exists, verb) in _path_claims.classify_and_check(_claim_text)
if role == "source" and not exists
or (role == "deliverable" and not exists and _is_removal_verb(verb))
```

The `_is_removal_verb` check inspects the closest verb in the 5-token lookback. If the verb is in `{remove, delete, drop, clean, cleanup, refactor, replace}` AND the path is classified as `deliverable` AND the path doesn't exist, fire the premise rejection.

**Full reproduction recipe and proposed fix** in `references/path-claims-deletion-blind-spot.md`.

**General lesson:** Classifiers that gate based on *role* need to be paired with classifiers that gate based on *verb shape* when the action is "create X" vs "remove X" — the existence check is inverted. This applies beyond path claims: any verification gate that says "X must exist before Y" needs a sibling gate that says "X must NOT exist before Y" when Y is a removal.


## Proposals Telemetry Table (2026-06-01)

A `proposals` table now lives in `athena_memory.db` alongside `goals` — every `record_proposal()` call inserts a row capturing which drive won, whether the LLM arbiter made the selection, and contextual telemetry. This closes the blind spot where the arbiter-failure path (need-decay fallback) was indistinguishable from a pure-B (always need-decay) outcome in retrospective analysis.

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

### Key diagnostic queries

**Q1:** When the arbiter failed and need-decay won, how often did the goal complete vs abandon?

```sql
SELECT p.arbiter_reasoning, p.drive_winner, g.status, g.attempt_count
FROM proposals p
LEFT JOIN goals g ON g.id = p.goal_id
WHERE p.used_arbiter = 0
  AND p.arbiter_reasoning LIKE '%arbiter%failed%'
ORDER BY p.created_at DESC;
```

**Q2:** Does a specific drive produce more abandons under need-decay than under arbiter selection?

```sql
SELECT p.drive_winner, p.used_arbiter, g.status, COUNT(*) as count
FROM proposals p
JOIN goals g ON g.id = p.goal_id
GROUP BY p.drive_winner, p.used_arbiter, g.status
ORDER BY count DESC;
```

**Q3:** What proportion of recent proposals went through the arbiter vs pure need-decay?

```sql
SELECT
  used_arbiter,
  COUNT(*) as count,
  ROUND(AVG(goal_importance), 3) as avg_importance
FROM proposals
WHERE created_at > strftime('%s','now','-7 days')
GROUP BY used_arbiter;
```

### Design decisions

- **`arbiter_reasoning` stores both success and failure.** On success: the LLM's choice rationale. On failure: error-type string like `"no_ollama_client"`, `"arbiter_returned_no_choice"`, or `"arbiter_picked_non_candidate"`. This distinguishes "arbiter ran but chose poorly" from "arbiter didn't run at all" without a separate column.
- **`goal_id` may be NULL** — proposals that fail validation gates never create a goal, but are still recorded so the proposer's cooldown/decelerator is comprehensible.
- **`drive_needs` is a JSON snapshot** of ALL drive needs at proposal time, not just the winner's. Enables reliability analysis per drive during need-decay path.
- **Zero LLM cost** — the insert is a 2-line SQLite statement. The schema creation runs through `drives.ensure_schema()` at agent init time.

### Wiring

Two call sites in `goal_proposer.py`:
- **Multi-drive proposer** (~line 1611): passes `was_arbitrated`, `arbiter_reasoning`, `arbiter_candidates`, `drive_needs`, `drive_gap`
- **Idle curiosity** (`messaging.py:499`): passes `was_arbitrated=False`, `goal_importance`

Both pass through `drives.record_proposal()` which handles the table name and column assignment.

## Key Diagnosis Lesson: Verify the Runtime Flag, Don't Assume

The self-driven Telegram gate (`self_driven_telegram` runtime flag) was suspected as the bottleneck for Telegram-shaped goals hitting the attempt ceiling. **The flag was already `1` (ON)** [from sqlite3]. The real bottleneck was the LLM tool-selector never picking `send_message` across 10+ ticks of successful research.

**Diagnostic protocol for future sessions:**
1. Check runtime_flags first — don't assume defaults apply
2. Check tool_outcomes for the specific goal — what tools actually fired, not just the count
3. Check what the LLM detector said — `_check_goal_completion` logs show the reason
4. When investigating "everything's empty" claims, check the actual cron log — a single failed run can cascade into a confabulated narrative