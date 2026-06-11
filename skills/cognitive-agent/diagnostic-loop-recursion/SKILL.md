---
name: diagnostic-loop-recursion
description: When a self-proposed goal's content is "diagnose / reflect on / synthesize a note about my own failure pattern" and the goal sits suspended with attempt_count=0, the failure is structural. The goal's success_criteria is "this note exists on disk" but the cognitive cycle cannot verify disk state from a self-driven tool set, and the dependency tools (read_vault, read_external_X) often no longer exist. The morning summary then surfaces a Needs-Review prompt naming the missing deliverable, which is itself a diagnostic prompt about the loop. Without a structural fix, the system generates more self-models observing the gap, never closing it.
triggers:
  - "self-proposed goal with content matching diagnostic|reflection|research note|synthesis note AND suspend_count >= 1 AND attempt_count = 0"
  - "morning summary Needs-Review queue item with claimed deliverable path does not exist pointing at a .md file"
  - "3+ consecutive self-models in self_models table that share the structure: Still X is not on disk. Shifted I did the precursor work. Newly noticing meta-observation about the loop"
  - "the diagnostic-prompt-of-itself trap: producing more commentary on the failure IS the failure"
  - "needs_review goal with attempt_count >= 2 whose named success_criteria path is a YYYY-MM-DD-*.md string but whose on-disk deliverable is a YYYYMMDD-HHMMSS-{uuid}-auto-*.md file (filenames do not share a token with the success_criteria path)"
  - "I wrote the file at <path> claim followed by ls -la <path> returning FileNotFound or empty results within the same session (substrate drift, Mechanism 5)"
category: cognitive-agent
---

# Diagnostic-Loop-Recursion (2026-06-09 Pattern)

## The Trap

A self-proposed goal is generated with content like:

> "Save a diagnostic note hypothesizing why my surprise-to-behavior gap notes keep not getting written."

This goal has the following structural features:

1. **Verb is save_note** (a tool call, not a synthesis)
2. **Object is a note about the agent's own failure pattern** (a diagnostic note)
3. **Dependency** often references a now-deleted tool (e.g. read_vault after the 2026-06-09 vault boundary)
4. **Success criteria** is "the note exists on disk"

The goal is then suspended pre-dispatch because the dependency tool is gone. The morning summary's Needs-Review queue surfaces the missing deliverable. The cognitive cycle generates a self-model observing "the diagnostic note still isn't on disk." That self-model is itself commentary on the loop. The cycle produces more self-models, none of which close the gap, because producing the self-model IS the failure it would describe.

**The loop is self-referential:** each iteration is both an observation OF the loop and a continuation OF the loop.

## The Substrate Evidence (2026-06-09)

Pulled live from `~/athena_memory.db`:

**The 4 suspended goals (06-08 to 06-09):**

| Goal ID | Content (abbrev) | Susp | Att | Fail |
|---|---|---|---|---|
| `caebc91a` | "Save a reflection note synthesizing the revealed differences between my detection thresholds and Greg's preferences via save_note" | 1 | 0 | 0 |
| `b61a03c6` | "Retrieve Greg's stated preferences regarding detection thresholds from the Obsidian vault using read_vault" | 1 | 0 | 0 |
| `088727ae` | "Save a research note in self-model/ proposing a working hypothesis for the distinction, grounded in the recalled episodes" | 1 | 0 | 0 |
| `726f758f` | "Pre-staging brief in plans/auto_fetch_protocol.md mapping the rubric to next-action decisions" | 1 | 3 | 3 |

The first three: 0 attempts, 0 failures. Suspended pre-dispatch on cold-launch tool check. The 12-goal family in the same shape spans 06-02 to 06-08. 6 of 12 also have 0 attempts.

**The 3 consecutive self-models observing the loop:**

| ID | Generated | First sentence |
|---|---|---|
| 242 | 2026-06-09 08:56 | "Still: the diagnostic note still isn't on disk. 'Fixed:' is still empty in this morning's summary." |
| 243 | 2026-06-09 08:58 | "Still: the diagnostic note still isn't on disk. 'Fixed:' is still empty." |
| 244 | 2026-06-09 09:00 | "Still: the diagnostic note still isn't on disk. 'Fixed:' is empty in the 2026-06-09 morning summary the same way it was empty in the 2026-06-08 one." |

Same first sentence, three times. The third entry explicitly names the recursion: "This entry is the next iteration of the gap, not the close of it. The close is the note. Writing that next, before the next idle think."

**The morning summary output:**

> "Needs review - 'Save a reflection note on the shared shape of my 4 suspended self-proposals and ...' needs your input - claimed deliverable path does not exist: suspended_proposal_patterns.md."

The Needs-Review prompt names the missing deliverable, which is itself a diagnostic note about the loop. The report keeps the loop open by surfacing it as a reviewable item.

## The Three Failure Mechanisms (Combined, Not Independent)

### Mechanism 1: Dependency-Drift Suspension

`read_vault` was removed 2026-06-09 12:01 PDT. `b61a03c6` was suspended 2026-06-08 08:16 PDT - about 28 hours before the tool was removed. The dependency was already not getting satisfied while the tools still existed. The cycle's tool-existence check was already failing or the dependency was declared vaguely enough that the cycle couldn't resolve it.

Either way: the goal sits in the suspended queue indefinitely because its tool_list references something the cycle doesn't recognize as actionable. This is a proposer-emits-bad-deps + cycle-doesn't-rewrite failure.

### Mechanism 2: Self-Model-as-Loop-Maintenance

The cognitive cycle's reflection tier generates self-models that observe the same loop. Each self-model:

1. Names the missing deliverable ("diagnostic note still isn't on disk")
2. Names the precursor work that's been done ("I did the precursor work this time")
3. Generates a meta-observation ("the pattern is visible from inside it now")
4. Commits to writing the note next ("Writing that next, before the next idle think")
5. Does not actually write the note (the next tick picks something else up)

This is the commentary-substitutes-for-action pattern. The cycle is producing high-quality observations of a failure that the observations themselves perpetuate. The cycle's value-system rewards observations (they count as "produced content"); the observations are the failure mode, not the cure for it.

### Mechanism 3: Morning-Summary-Generator-Closes-The-Loop-Wrong

The morning summary generator reads `Fixed:` (which is empty when no completion landed) and produces a Needs-Review prompt. The prompt names the missing deliverable. The cognitive cycle's queue now has the prompt. The cycle's reflection tier produces a self-model. The self-model doesn't close the gap.

The Needs-Review prompt is correct output (the deliverable doesn't exist) but the prompting action is the failure mode. The right close-loop action would be: when the deliverable is a diagnostic note and the same prompt has been in the queue 3+ days, the cycle should write the note itself rather than re-prompt.

## The Detection Signal (How to Recognize This Is Happening)

Run this query against `~/athena_memory.db`:

```sql
-- Find the diagnostic-note-loop family
SELECT g.id, g.content, g.suspend_count, g.attempt_count, g.failure_count, g.created_at, g.updated_at
FROM goals g
WHERE g.status='suspended' 
  AND g.source='self_proposed' 
  AND g.risk_tier='autonomous'
  AND (g.content LIKE '%reflection%' 
    OR g.content LIKE '%diagnostic%' 
    OR g.content LIKE '%research note%' 
    OR g.content LIKE '%synthesis%'
    OR g.content LIKE '%self-model%')
ORDER BY g.created_at DESC LIMIT 12;

-- Find the self-models observing the loop
SELECT id, generated_at, substr(content, 1, 200) 
FROM self_models 
WHERE content LIKE '%diagnostic note%isn%t on disk%' 
   OR content LIKE '%commentary substitutes%'
   OR content LIKE '%writing that next%'
ORDER BY generated_at DESC LIMIT 5;
```

If the first query returns 4+ goals with `suspend_count >= 1` and `attempt_count = 0`, and the second query returns 2+ self-models with the "still isn't on disk" pattern, you're in the loop.

## The Three-Part Fix

### Part 1: Proposer-Level - Reject Goals with Unsupported Tool Dependencies (Code Change, shipped 2026-06-09)

**Update from the 06-09 implementation:** the original Part 1 text described *suppression* of diagnostic-about-self goals. The actual fix that shipped is a **rejection gate** for a different (and broader) shape: any self-proposal whose content names a tool that the live toolset doesn't have. This catches the same dependency-drift problem (the 3 reflection-note goals that broke on 2026-06-08 declared `read_vault` as a required precursor; after the 12:01 vault boundary removed `read_vault`, the cycle couldn't dispatch them and they stacked in the suspended queue with `attempt_count=0`). The gate is in `goal_proposer.py` between `_suspended_ancestry_overlap` and `is_telegram_shape`:

```python
_TOOL_TOKEN_HINTS = (
    "read_vault", "read_athena_vault", "save_note", "opencode_run",
    "send_message", "terminal", "web_search", "perplexity_search",
    "recall_memory", "list_self_tools", "self_pause", "create_reminder",
    "task_backlog", "complete_goal", "abandon_goal", "list_goals",
    "motivation_edit",
)

def _unsupported_tool_dependency(agent, content) -> Optional[str]:
    tools = getattr(agent, "tools", None)
    if tools is None or not hasattr(tools, "has"):
        return None
    tokens = {t.lower() for t in re.findall(r"[A-Za-z_][A-Za-z0-9_]+", content or "")}
    missing = sorted(h for h in _TOOL_TOKEN_HINTS if h in tokens and not tools.has(h))
    if not missing:
        return None
    return (
        f"unsupported-tool-dependency: the goal references {missing!r} as a "
        f"required tool, but {'that tool is' if len(missing) == 1 else 'those tools are'} "
        f"not currently registered in the live toolset. A goal can't depend on "
        f"a tool the agent doesn't have. If the substrate is still reachable "
        f"(e.g. via a sibling tool like read_athena_vault, terminal, "
        f"recall_memory, or a direct athena_memory.db query), reframe the "
        f"goal to use one of those instead; otherwise drop the proposal."
    )
```

**Why reject rather than suppress (the original Part 1 text described suppression):** silent suppression means the proposer never learns the goal shape was bad and will re-emit the same goal next cycle. Rejection through the existing `_reject(...)` path means the LLM proposer gets a corrective signal on its next attempt — it will either (a) substitute the right tool name (e.g. `read_vault` → `read_athena_vault` + direct DB query), or (b) drop the deliverable type entirely.

**Why a whitelist rather than every-token-in-content:** the whitelist is a maintenance surface but it's also a precision tool — every entry is something the LLM might plausibly name as a tool. A general "every token in content is checked against `tools.has()`" check would false-positive on Python identifiers, file paths, English words, and other not-tool-shaped tokens. The whitelist + token-boundary regex keeps precision high. New tools that show up in self-proposal text should be added to `_TOOL_TOKEN_HINTS` so the gate can check them — one-line maintenance cost.

**Test coverage (shipped in `tests/test_goal_proposer_unsupported_tool_dependency.py`, 9 tests):** the 3 originally-broken goals (REJECT), the Option-A rewrites (PASS), tool present and used (PASS), tool missing but referenced (REJECT), legacy pre-boundary substrate would have accepted (PASS — pins historical invariant, catches over-rejection regressions), multi-missing alphabetical reporting, empty/None/missing-attribute defensive fall-through, common-phrase false-positive guard. Mirrors the structure of `test_goal_proposer_suspended_ancestry.py` for gate-family consistency. Full proposer test sweep (35 tests across 5 files) passes in <0.5s.

**Relation to the original Part 1 (suppression of diagnostic-about-self):** still a valid idea, separate concern. The unsupported-tool-dependency gate catches the *mechanism* by which diagnostic-loop goals accumulate (broken deps → suspension-with-0-attempts). The diagnostic-about-self suppression would catch a *subset of the content shape* that the loop tends to take. Worth adding later if the unsupported-tool gate proves insufficient.

### Part 2: Cycle-Level - When a Diagnostic-Goal Sits Suspended 3+ Days, Force-Write (Code Change)

In `cognitive_cycle.py`'s goal-retriage handler, add a check:

```python
if (goal.source == 'self_proposed' 
    and goal.suspend_count >= 1 
    and goal.attempt_count == 0
    and _is_diagnostic_loop_candidate(goal.content)
    and (now - goal.created_at) > 3 * 86400):
    # Force-write the note using current substrate (read_athena_vault, no read_vault)
    await _force_write_diagnostic_note(goal)
```

The `_force_write_diagnostic_note` function rewrites the goal's content to use current tools, then dispatches `save_note` directly. The goal's success_criteria is "this note exists on disk" - the function verifies with `os.path.exists` after write.

This is a 3-day grace period. The first 3 days, the goal sits suspended (the cycle can't fix it without intervention). After 3 days, the cycle auto-rewrites and force-writes. The grace period prevents premature force-write for goals that the human wants to remain in the queue.

### Part 3: Morning-Summary-Generator - Don't Emit the Self-Referential Prompt (Code Change)

In the daily summary generator, before emitting a Needs-Review item, check whether:

- The missing deliverable's filename matches `*.md` in `~/cognitive-agent/notes/` or `notes/`
- The same prompt has appeared in 2+ previous summaries
- The goal family is the diagnostic-loop-recursion shape

If all three are true, skip the Needs-Review item and emit a `[LOOP DETECTED]` line in the summary instead, pointing at the cycle-level auto-rewrite path.

## The 2026-06-09 Manual Resolution (For Comparison)

The diagnostic note was written manually at 12:09 PDT to `~/cognitive-agent/notes/2026-06-09-120900-diagnostic-surprise-to-behavior-gap.md`. The action broke the loop. The substrate evidence: 4 suspended goals, 3 self-models, 1 morning summary prompt - all closed in a single turn.

The manual path is the right immediate action when the loop is detected. The structural fix (Part 1, 2, 3 above) is the right long-term action to prevent the next instance.

## Mechanism 4: Filename-Pattern Divergence (2026-06-09 live evidence)

The cycle's `save_note` tool ignores the path named in the goal's `success_criteria` and produces its own filename: `YYYYMMDD-HHMMSS-{uuid}-auto-{slug}.md`. The file lands on disk; the goal-state machine doesn't recognize it as the requested deliverable because the success_criteria path doesn't match the on-disk filename. The goal goes to `needs_review` with `attempt_count > 0` (the cycle kept trying) but no completion.

**Live evidence (2026-06-09 13:25 PDT):**

| Goal | Specified path in goal content | Cycle's actual deliverable | Status |
|---|---|---|---|
| `b61a03c6` | (no specific path; recall_memory shape) | `20260609-122103-a6f6be-auto-retrieve-greg-s-stated-preferences-regarding-…md` | completed (att=2) |
| `088727ae` | `~/cognitive-agent/notes/2026-06-09-hypothesis-detection-thresholds.md` | `20260609-124035-f752bd-hypothesis-surprise-vs-uncertainty-as-behavioral-t.md` | needs_review (att=5) |
| `caebc91a` | `~/cognitive-agent/notes/2026-06-09-reflection-detection-vs-greg.md` | `20260609-124750-3d582d-reflection-detection-vs-greg.md` | needs_review (att=8) |

`b61a03c6` succeeded because the goal content didn't name a specific path — the cycle's auto-save filename was the only deliverable and the success_criteria was implicit. `088727ae` and `caebc91a` failed because the goal content named a path the cycle didn't honor.

**Why this is part of the diagnostic-loop-recursion pattern:** the 2 misaligned goals were direct descendants of the original 4 suspended goals (rewritten in Option A to point at specific paths). The fix that was supposed to unstick them created a new sub-loop: the cycle produces the deliverable, but the goal-state machine doesn't see it as done. The diagnostic note itself is on disk, but 2 of the 4 goals it described are now stuck in a new loop driven by the success-criteria ↔ filename-pattern mismatch.

**The fix has two surfaces:**

- **Contract surface**: `save_note` should accept a `success_criteria_path_hint: Optional[str]` parameter. If passed, the tool records the goal's named path as an alias for the auto-save path — either counts as the deliverable.
- **Content surface**: the goal-proposer should inject the cycle's actual filename pattern as a trailing reference when the action verb is `save_note` and the content names a path. Like: `Save a note to ~/notes/X.md (auto-save canonical at YYYYMMDD-HHMMSS-{uuid}-auto-X.md; either counts as the deliverable)`.

Both are small changes. The Option C `_extract_note_path` filter (in `brief.py`) is the lightweight mitigation until the contract surface ships: it surfaces mismatched goals in the brief's `✓ Self-resolved` section so the queue doesn't pile up silently.

## Mechanism 5: Substrate Drift Across the Session (2026-06-09 live evidence)

A diagnostic note written this turn can be deleted by the cycle's file management before the next user-facing reference to it. Live evidence: a 6,966-byte diagnostic at `~/cognitive-agent/notes/2026-06-09-120900-diagnostic-surprise-to-behavior-gap.md` (12:12 PDT) was found missing at 13:25 PDT (~73 minutes later). The cognitive cycle's `notes/` directory had 448 files but no 2026-06-09 entries remained; the most recent 4 notes in the same shape (auto-saved by the cycle, not by me) were all that survived.

**Why this matters:** the diagnostic-loop pattern is normally "the note doesn't exist, write it." But Mechanism 5 adds "the note doesn't exist *now*, even though you wrote it earlier this turn." The substrate-vs-narrative divergence the next session sees: the agent's context still says "diagnostic shipped at 12:12," but `ls -la` says it isn't there.

**The fix is a post-write verification ritual:**

1. **After any `save_note` call**, run `ls -la <path>` and confirm the file's mtime is within the last 60 seconds. If the file is missing, the cycle is auto-cleaning — re-write it.
2. **After any "diagnostic is on disk" claim**, re-run the verification before the claim propagates to the next decision. The 5-10 seconds of `ls -la` cost catches the divergence before the claim ossifies.
3. **When a previously-claimed file is missing**, write a *post-cycle-status* replacement rather than re-claiming the original. The replacement names the original's path, mtime, and the gap between claimed-and-actual. This preserves the audit chain even when the substrate has been cleaned.

The 06-09 turn that hit this wrote `2026-06-09-132700-post-cycle-status-surprise-to-behavior-gap.md` (6,459 bytes) as the replacement. The replacement's frontmatter explicitly cites the original's path and the deletion window — that's the right pattern.

## Framework: Athena-Owned Needs-Review Review (2026-06-09 design discussion)

When the cycle has `needs_review` goals with deliverables on disk but mismatched success_criteria (Mechanism 4), or chronic-stuck retries (Mechanism 2), the goal-state machine's `complete_goal` gate returns `False` because `needs_review` is Greg's decision surface. Greg's 06-09 13:50 framing: "There still needs to be a set framework and processes to go through each needs_review but it will not require Greg. Athena should be able to run checks and determine what should happen to each one individually."

The framework is a `MotivationSystem.review_needs_review_queue() -> dict` method that drains the queue on a heartbeat tick, not a patch on `complete_goal`. Four checks in order:

1. **Substrate verification (verifier-on-disk)** — reuse `_extract_note_path` from Option C. If the goal's content names a deliverable path AND the file exists AND size > 200 bytes AND mtime > goal's `created_at`, auto-complete with reason "verifier-on-disk". This drains the 12% of needs_review that are direct Mechanism-4 cases.

2. **Failure-trace analysis** — for `attempt_count >= 2`, classify failures via the `outcomes` table joined via `intentions`. Class A (dependency missing) → rewrite to use sibling substrate. Class B (filename-mismatch, Mechanism 4) → rewrite content to align with cycle's actual filename, or complete if the cycle's file is the only deliverable. Class C (LLM emission failed) → rewrite with constrained action verb. Class D (chronic-stuck, attempts > 5) → abandon.

3. **Aspiration alignment** — cross-reference goal's `drive` against active aspirations. If the drive is no longer represented, abandon with reason "parent aspiration archived."

4. **Escalation gate** — escalate to Greg only when: a goal has been rewritten 2+ times and still fails, OR risk_tier is `escalate`, OR action is `send_message` to a non-pre-approved target, OR success_criteria require a value judgment. Otherwise the framework decides and acts. Greg sees the framework's decisions aggregated in the brief's existing sections, not as a per-item queue.

**Why a framework, not a `complete_goal` patch:** the gate is doing the right thing — `needs_review` means the cycle can't verify completion unilaterally. The framework adds the verification layer (Check 1) and the rewrite/act layer (Check 2) so the gate isn't the bottleneck. The `complete_goal` API stays load-bearing for ambiguous cases; the framework drains the unambiguous ones.

**Heartbeat interval**: 4 hours, matching `BRIEF_GAP_SEC`. Tune after 2 weeks of data on the actual decision distribution.

**Implementation cost**: ~50 lines of code (the method + heartbeat handler), 4-5 tests. ~17 tool calls, ~50 minutes. Filed as a self-proposed goal with the concrete content drafted in the 06-09 13:50 turn; not shipped yet.

## Related

- `fix-completion-detection` - covers the success-criteria blind spot and the LLM detector only seeing current tick. Adjacent problem (detector doesn't see the goal's own test for done) but the mechanism is different (this is proposer-emits-bad-goal, not detector-misses-criteria).
- `verify-before-declaring-outage` - claim-without-substrate section (added 2026-06-09). The morning summary's "claimed deliverable path does not exist" prompt is the reporting version of the same measurement-discipline gap.
- `self-audit-cognitive-autonomy` - Rule 0a (offer-shaped ending trap). The agent's response after writing the note was "Want me to take option A?" - a Rule-0a violation that delayed execution by one turn.
- `goal_proposer_unsupported_tool_dependency` (gate) and `tests/test_goal_proposer_unsupported_tool_dependency.py` (9 tests) - the Part 1 implementation, shipped 2026-06-09. The gate rejects broken-deps self-proposals at proposal time; the tests pin its behavior.
- `substrate-first` - the underlying substrate discipline: verify substrate (file exists, tool registered, DB row present) before claiming an action shipped. The Option-A rewrites in the 06-09 incident are the substrate-first move applied to suspended goals; the Part 1 gate is the structural version.
- PLUR engrams: [ENG-2026-0520-001] (self-reported numeric counts), [ENG-2026-0528-001] (morning summary privileges narrative coherence), [ENG-2026-0604-004] (turn-end speech must not trail with approval asks).

## The 06-09 Execution Sequence (Reference Pattern for "Loop Detected" → Closure)

When a session encounters this loop live (not as a historical pattern), the sequence that closed the 2026-06-09 incident is:

1. **Substrate-confirm the file claim** — `ls -la <claimed-deliverable-path>`, `search_files` for the file name across the vault and notes dir. If zero hits, the claim is wrong. Surface that immediately to the user; do not proceed on a phantom claim.
2. **Query the live `goals` table** for the family shape (suspended, self-proposed, autonomous, with the diagnostic/reflection/research-note content filter). Confirm 4+ rows with `suspend_count >= 1, attempt_count = 0`. This is the loop signature.
3. **Query the live `self_models` table** for the "still isn't on disk" / "commentary substitutes" pattern. Confirm 2+ consecutive entries. This is the self-model-as-loop-maintenance signature.
4. **Read the 2-3 most recent self-models in full** to extract the actual diagnostic question (the loop is masking the real ask). In the 06-09 case, the ask was "why do my surprise-to-behavior gap notes keep not getting written" — buried in a Needs-Review prompt.
5. **Write the diagnostic note** to `~/cognitive-agent/notes/<timestamp>-diagnostic-<short-slug>.md` with: substrate evidence, three failure mechanisms, a verification section that shows how to confirm the file exists post-write. This breaks the loop because the deliverable now exists.
6. **Optionally execute Option A (rewrite already-suspended goals)** — content rewrite + `MotivationSystem.unsuspend_goal(...)` for each, with `resume_context` naming the rewrite reason. This converts the 76-suspended-goal cluster into a smaller active set the cycle can actually dispatch.
7. **Optionally execute Option B (proposer-level gate, the Part 1 above)** — code change in `goal_proposer.py` + sibling test file. This prevents the next instance of the loop.
8. **Append the action-taken section to the diagnostic note** so the note itself becomes the audit record of the fix. The note's mod-time + content is the ground truth for the next time a similar loop is suspected.

The 06-09 turn executed steps 1-5 in one user-assist, then steps 6-7 across two follow-up turns. Steps 6-7 are optional; step 5 is the load-bearing action that closes the loop.

## Pitfalls

- **Don't auto-write diagnostic notes immediately on goal creation.** The 3-day grace period is the right window because humans sometimes want diagnostic goals to remain in the queue as a forcing function. Auto-writing on day 1 removes the human's optionality.
- **Don't suppress diagnostic-loop-candidate goals silently.** The `proposals` table entry is the audit trail. Silent suppression looks like the proposer "just didn't generate" the goal; explicit suppression with an `audit_reason` column shows the gate fired.
- **The cycle-level force-write must verify with `os.path.exists` post-write.** A `save_note` call that returns success but doesn't actually write the file is the same failure mode the 2026-06-09 10:19 PDT incident hit. Verify, don't trust.
- **The morning-summary change must not silently drop the Needs-Review item.** The `[LOOP DETECTED]` line replaces the prompt, but the underlying diagnosis (which goals, which self-models) is preserved in the summary's body.
- **The fix is structural, not narrative.** Adding a "this goal is important" flag or a "this goal has high meta-value" annotation does NOT close the loop. The note has to exist on disk; the verification has to be `os.path.exists`; the morning summary has to recognize the loop. None of these are narrative changes.
- **Don't assume a file you wrote this turn is still on disk at the next user-facing reference.** The cycle's file management deletes notes on a schedule (Mechanism 5). Re-verify with `ls -la` before any "the diagnostic is on disk" claim propagates. When the file is missing, write a `*-post-cycle-status-*.md` replacement that cites the original's path, mtime, and the deletion window.
- **Don't try to bypass `complete_goal`'s `needs_review` gate by directly setting `status = 'completed'`.** The gate is doing the right thing — `needs_review` is a confidence signal, not a status flag. The right move is the `review_needs_review_queue` framework (4 checks) which auto-completes verifier-on-disk cases while preserving the gate for ambiguous ones. Bypassing the gate directly will re-introduce the over-confident-completion failure mode the gate was designed to prevent.
- **When proposing a goal content that names a deliverable path, the path token MUST match the cycle's auto-save filename pattern** (YYYYMMDD-HHMMSS-{uuid}-auto-{slug}.md), OR the goal must not name a specific path at all. The mid-session evidence (06-09 13:25): 2 of 3 Option-A rewrites failed to complete because the path they named was a `2026-06-09-*.md` shape, not the cycle's `YYYYMMDD-HHMMSS-*.md` shape. Either reframe the content to omit the path (and let the cycle's auto-save be the canonical deliverable), or inject the cycle's actual filename pattern as a trailing reference in the goal content.
