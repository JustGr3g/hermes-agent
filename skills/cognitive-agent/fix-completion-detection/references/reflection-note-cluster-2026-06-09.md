# Reference: 2026-06-09 Reflection-Note Cluster — Three-Layer Closure

The first production case where the three-layer pattern (proposer rewrite + proposer gate + brief filter) was applied end-to-end. Captures the diagnostic substrate, the exact code paths touched, and the test results so future sessions can compare new occurrences against a known-good template.

## The Symptom (substrate-confirmed)

The cognitive cycle generated 4 reflection-note self-proposals between 2026-06-06 and 2026-06-08, all with the same shape: "synthesize / diagnose / save a note about my own failure pattern." Three of them declared `read_vault` (Greg's personal Obsidian vault) as a required precursor:

| Goal | Content (abbrev) | Source | Created | Status |
|---|---|---|---|---|
| `caebc91a-c8e5-4b8f-8b9d-a671c386837f` | "Save a reflection note synthesizing the revealed differences between my detection thresholds and Greg's preferences via save_note" | self_proposed | 2026-06-08 08:16 | suspended, att=0, fail=0 |
| `b61a03c6-c1db-46e1-abad-59c3cb423175` | "Retrieve Greg's stated preferences regarding detection thresholds from the Obsidian vault using read_vault" | self_proposed | 2026-06-08 08:16 | suspended, att=0, fail=0 |
| `088727ae-f982-4491-aacd-19969465ab2f` | "Save a research note in self-model/ proposing a working hypothesis for the distinction, grounded in the recalled episodes" | self_proposed | 2026-06-08 05:58 | suspended, att=0, fail=0 |
| `726f758f-f8d9-4b95-a86e-f18a4f5c97fa` | (different: auto-fetch pre-staging brief) | self_proposed | 2026-06-08 ~12:00 | suspended, att=3, fail=3 |

All three reflection-note goals had `suspend_count=1, attempt_count=0, failure_count=0`. They were suspended **without ever being dispatched** — the cycle's pre-flight check suspended them rather than risk a failed attempt against a tool it knew was missing.

The 4th goal (`726f758f`) was a different shape (auto-fetch pre-staging brief) with real attempts and real failures. Treated separately.

## Live substrate (what the data showed)

From `~/athena_memory.db` query at 2026-06-09 12:09 PDT:
- 76 total suspended goals; 74 from `source='self_proposed'`
- 12-goal family in the same "diagnostic / reflection / synthesis note" shape spanning 2026-06-02 → 2026-06-08 (7 days)
- 6 of 12 had `att=0` (never attempted); 6 had 1-2 failed attempts then suspension
- The completed-with-similar-shape set was empty for the most recent 5 completions
- The 3 morning self-model entries (2026-06-09 08:56, 08:58, 09:00 — ids 242, 243, 244) all observed the same loop: "diagnostic note still not on disk. Fixed: is empty in this morning's summary too."

## Root cause (current best hypothesis)

The cognitive cycle's reflection-then-act gap is structurally self-referential. The morning-summary generator emits a Needs-Review prompt when `Fixed:` is empty, the cognitive cycle produces a self-model *about* the failure, and the self-model never closes the failure because producing it *is* the failure. The diagnostic on disk is the action, not commentary on it.

When Greg revoked `read_vault` access at 2026-06-09 12:01 PDT, the 3 reflection-note goals that declared `read_vault` as a precursor became pre-flight-blocked. The cycle suspended them rather than dispatching to a guaranteed-failure path. This converted a chronic-loop symptom into a pre-flight-block symptom — actually a small improvement (no failed attempts) but the goals were still stuck in the queue.

## The Three Layers Applied

### Layer 1: Goal rewrites (Option A — 12:15 PDT)

**File touched:** `~/athena_memory.db` (goals table, content + status + resume_context fields)

**Path:** canonical `MotivationSystem.unsuspend_goal(gid, reason=...)` not raw SQL — fires the `goal_unsuspended` threshold hook and rebuilds the priority queue.

**Rewrites (key changes):**
- `b61a03c6` was "Retrieve ... from the Obsidian vault using read_vault" → "Retrieve ... from PLUR + episodes + inner-speech"
- `088727ae` was "Save a research note in self-model/..." → "Save a working hypothesis to ~/cognitive-agent/notes/2026-06-09-hypothesis-detection-thresholds.md"
- `caebc91a` was "Save a reflection note via save_note" → "Save a reflection note sourced from b61a03c6 output, no external tool"

**Result:** 3 active, `failure_count=0` cleared, importance 0.72-0.75 (above the 0.25 priority floor), `resume_context` names the rewrite reason for future `/think` traces.

**`726f758f` left alone** — different shape, real failures, different fix path. Surfaced for next cycle.

### Layer 2: Proposer pre-flight gate (Option B — 12:18 PDT)

**File touched:** `~/cognitive-agent/cognitive_agent/goal_proposer.py`

**Helper added (line ~437):**
```python
_TOOL_TOKEN_HINTS = (
    "read_vault", "read_athena_vault", "save_note", "opencode_run",
    "send_message", "terminal", "web_search", "perplexity_search",
    "recall_memory", "list_self_tools", "self_pause", "create_reminder",
    "task_backlog", "complete_goal", "abandon_goal", "list_goals",
    "motivation_edit",
)

def _unsupported_tool_dependency(agent, content: "Optional[str]") -> Optional[str]:
    """Dependency-availability pre-flight.

    Rejects self-proposals whose content references a tool name that
    agent.tools does not have registered. Conservative: only the small
    _TOOL_TOKEN_HINTS whitelist is checked, exact-match-on-token-boundary,
    case-insensitive. Cannot false-positive on common phrases.

    Returns a rejection reason string, or None.
    """
```

**Gate dispatch wired in (line 1456)** between `_suspended_ancestry_overlap` (1440) and `is_telegram_shape` (1473). Rejection payload mirrors `suspended_ancestry`.

**Test file:** `~/cognitive-agent/tests/test_goal_proposer_unsupported_tool_dependency.py` (9 tests, all passing). Test categories: original-broken goal rejected, healthy rewrites pass, save_note present passes, legacy pre-boundary substrate accepted (historical invariant pinned), multi-missing alphabetical, empty/None/missing-attr defensive, common-phrase false-positive guard.

**Test results:**
```
tests/test_goal_proposer_*.py ... 35 passed in 0.38s
```

### Layer 3: Self-referential brief filter (Option C — 12:27 PDT)

**File touched:** `~/cognitive-agent/cognitive_agent/brief.py`

**Helper added (line ~38):**
```python
_NOTES_ROOTS = (Path.home() / "cognitive-agent" / "notes",)

def _extract_note_path(content: str) -> Optional[Path]:
    """Pure: returns a candidate Path or None. No disk I/O for existence.

    Three regex patterns:
    - ~/cognitive-agent/notes/X.md
    - self-model/X.md (legacy vault path, maps to notes/)
    - titled "X.md" / named "X.md"
    """
```

**Filter wired into `_query_needs_review` (line ~190).** Return type changed from `tuple[GoalSummary, ...]` to `tuple[tuple[GoalSummary, ...], tuple[GoalSummary, ...]]` — `(kept, self_resolved)`. For each row, call `_extract_note_path` and check existence. If both, demote to `self_resolved` with detail `verifier-on-disk: <filename>`. Goal status is NOT auto-transitioned (separate concern).

**`BriefData.self_resolved: tuple[GoalSummary, ...] = ()` field added.** `has_content()` updated to include `self_resolved`.

**Renderer section (line ~523, after Heartbeat errors):**
```
✓ Self-resolved (deliverable on disk, N):
  abc12345 "Save a diagnostic note" — verifier-on-disk: 2026-06-09-...md
```
Capped at 5 items + overflow marker.

**Test file:** `~/cognitive-agent/tests/test_brief_self_referential_filter.py` (13 tests, all passing). Categories: pure-function extraction (6), filter behavior (3), mixed-corpus split (1), renderer (2), end-to-end (1).

**Test results:**
```
tests/test_brief_*.py + tests/test_goal_proposer_*.py ... 72 passed in 0.61s
```

## Live Verification (post-fix)

Ran `_query_needs_review` against live `~/athena_memory.db` at 2026-06-09 12:32 PDT:
- 17 needs_review goals in queue, 0 demoted to self_resolved
- The filter is a no-op when nothing in the queue references an existing on-disk file
- Current needs_review goals (e.g. `8f6eee8f` "Save a diagnostic note hypothesizing why my surprise-to-behavior gap notes keep suspending") don't name a concrete file path in their content, so the filter correctly leaves them in place
- If those goals' content were rewritten (per Layer 1) to name `~/cognitive-agent/notes/X.md`, the filter would demote them on the next brief

## Verification Steps for the Pattern

When applying this pattern to a new occurrence:

1. **Confirm the symptom:** query the goals table for the same `source='self_proposed'` cluster with `suspend_count` ≥ 1 and inspect the content for the missing-substrate token
2. **Apply Layer 1 first:** rewrite + unsuspend the existing cluster. Use canonical `MotivationSystem.unsuspend_goal()` not raw SQL so the priority queue rebuilds cleanly
3. **Apply Layer 2 second:** add the gate with a small whitelist, exact-match-on-token-boundary regex, defensive fall-through. Test before committing
4. **Apply Layer 3 third:** add the brief filter with pure extraction (existence check at the call site, not in the helper). Surface the count not the full list
5. **Run a unified test sweep** across all three families (the goals you modified, the gate's test file, the brief filter's test file). 0 regressions required before declaring done
6. **Verify live:** query the live substrate to confirm the filter is a no-op when nothing matches, fires when something does

## Diagnostic Note on Disk

The full session write-up is at `~/cognitive-agent/notes/2026-06-09-120900-diagnostic-surprise-to-behavior-gap.md`. It includes the substrate query that identified the cluster, the 3 morning self-model entries that documented the loop, and the action-taken sections for each layer.
