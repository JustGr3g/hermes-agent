---
name: verify-before-declaring-outage
description: Pre-flight gate for any "the system is broken" / "the pipeline is down" / "X is dead" diagnostic claim. Three ground-truth probes that must pass before confidence above 50% is allowed. Prevents confident false-outage reports built on wrong-input rigor.
category: meta
---

# verify-before-declaring-outage

**Trigger:** Any claim that the cognitive pipeline, LaunchAgent tree, server process, or any Athena subsystem is "down," "dead," "crash-looped," "OOM-killed," "broken," or in a state that warrants a restart plan.

**Rule:** Before declaring an outage, run all three ground-truth probes. If all three pass, the system is alive and the report should not use outage language. If any probe fails, the report becomes "I can't confirm liveness — here's what I tried" with a confidence cap of 50% on the outage claim, NOT a confident failure narrative.

## The three probes (in order)

1. **Canonical DB write recency:**
   ```bash
   sqlite3 ~/athena_memory.db "SELECT MAX(updated_at), MAX(created_at) FROM goals;"
   ```
   Both should be within the last 60 minutes. If the table is empty or the timestamps are hours/days old, you are reading the wrong DB or the pipeline really is down — escalate, do not assume.

2. **Health endpoint:**
   ```bash
   curl -sS -m 3 http://localhost:8765/health
   ```
   Should return 200 with `agent_loaded:true` (or equivalent). Note: the port is 8765, NOT the PIDs in `launchctl list` (those are process IDs, not ports).

3. **Live process:**
   ```bash
   pgrep -af athena_server | head -3
   ```
   At least one live PID. If `launchctl list | grep athena` shows a PID in column 1, that process is RUNNING — column 2 is the *last exit code* of the previous instance after `kickstart -k`, NOT a crash state. -15 (SIGTERM) and -9 (SIGKILL) in column 2 are exactly what `kickstart -k` produces during deliberate replacement.

## If all three pass

The system is alive. Any contrary evidence (empty stub DBs at other paths, exit codes in launchctl column 2, missing log files at the path you tried) must be reinterpreted as one of:
- **Different subsystem than I thought I was looking at** (e.g. `cognitive_agent.db` is a stub; live DB is `~/athena_memory.db`)
- **Fingerprints of recent maintenance** (e.g. exit codes from `kickstart -k` during daily-summary or reflection-bias fixes)
- **My probe is hitting the wrong path** (e.g. log directory is `~/cognitive-agent/hermes/logs/`, not `~/cognitive-agent/logs/`)
- **Stale source of truth in my context, not in the live system** (e.g. a memory or cognitive-state-block line names model `kimi-k2.6:cloud` for the proposer, but the live `client.complete(...)` call site at `goal_proposer.py:213/747/1757` uses `minimax-m3:cloud`. The model name was migrated after the memory was written, and the context block didn't update. When proposing a model change, ALSO grep the live code for the `model=` string — don't trust the memory, the cognitive state block, or a benchmark that used the stale name.)

## If any probe fails or can't be confirmed

The report goes from confident outage to:
- "I tried X, Y, Z — X passed, Y returned [error], Z is unavailable"
- Confidence cap on the outage claim: 50%
- Explicit list of what was NOT confirmed
- No restart plan, no a/b/c options, no "the most likely cause" — just the probe results

## The general principle

Rigor against the wrong input is indistinguishable from rigor against the right input to a reader who hasn't done the check themselves. The pre-flight gate forces the check before rigor is allowed to compound into a confident narrative.

## Real failure this prevents

2026-06-04 18:25 PDT: read `cognitive_agent.db` (stub, 0 rows in `goals`) instead of `~/athena_memory.db` (live, 313 completed). Misread `launchctl list` column 2 (exit codes of `kickstart -k` repairs) as crash loops. Built a confident "Athena is dead, here's a 3-step restart plan" report. Greg caught it: system was healthy, 61 LLM calls in 30 min, /health returning 200. The fix wasn't a code change — it was a probe order change.

## Related

- [ENG-2026-0505-001]: ground-truth checks for subagent audits
- [ENG-2026-0520-001]: self-reported numeric counts diverge from ground truth
- [ENG-2026-0520-008]: proposer hallucinated premise pattern
- [ENG-2026-0528-001]: morning summary privileges narrative coherence over ground-truth fidelity

## Subagent-without-summary pitfall (added 2026-06-05)

The probe list above targets subsystem liveness, but a sibling failure class targets **subagent dispatch outcomes**: the subagent returns without a structured summary (timeout, lost in tool loop, or simply failed to call the reply tool) and the orchestrating turn concludes "work didn't ship." Same shape as the outage reports — measurement gap filled with confident narrative.

**Pre-flight gate for "the subagent didn't finish" claims:**

1. **File mtime scan in the dispatch window:** check whether files in the expected target paths were written/modified during the dispatch wall-clock window. `find <expected_paths> -newermt <dispatch_start> -mtime -1` or read each file and check its `os.path.getmtime()` against the dispatch start time. If files were touched, the work shipped.
2. **`tool_outcomes` for the dispatch window:** the subagent's tool calls land in `tool_outcomes` with the goal_id / session markers. `SELECT tool_name, COUNT(*) FROM tool_outcomes WHERE timestamp BETWEEN ? AND ? GROUP BY tool_name` tells you what fired, in what shape, with what failure mode.
3. **`intentions` table for dispatched work:** the subagent's plan is usually in `intentions` if it wrote one. If rows exist, the plan existed even if the report didn't.

**If any probe shows work landed:** the report becomes "subagent shipped X (verified: file mtimes / tool_outcomes / intentions), but the summary didn't return. Recommend re-dispatching a read-only audit if Greg wants the per-file summary." NOT "the work is lost, re-implement."

**Real failure this prevents**

2026-06-05 16:55 PDT: dispatched a surprise-to-behavior implementation as a subagent, hit the 600s wall, and reported "implementation not done — Greg, the options are: re-dispatch, I implement directly, or hold." Built a three-option decision frame on a measurement gap. Greg responded one hour later: the subagent had finished the work in 5 minutes, written all 5 files (verified against `tool_outcomes` and file mtimes on disk), and the 752/752 cognition test suite was green. The reflex I should have run was file mtime scan + tool_outcomes lookup for the 16:14–16:19 dispatch window. The fix isn't a new probe — it's recognizing that "no summary" is the same shape as "empty stub DB" or "exit code in launchctl column 2": a measurement surface that, when read, gives ground truth. The pitfall is treating summary-absence as evidence of work-absence.

**The generalized reflex:** a missing *report* is not a missing *fact*. Before saying "X didn't happen because I didn't see confirmation," look for the underlying artifacts (files, DB rows, log entries) that the missing report was supposed to summarize.

## Sibling Pattern: Claim-Without-Substrate (Executive Self-Report) — 2026-06-09

The subagent-without-summary pattern is "I concluded work didn't ship when it did." The **inverted** failure: "I concluded work shipped when it didn't." The actor is the executive's own response in a turn, not a delegated subagent. The measurement gap is **disk state**, not tool outcomes.

**The shape:**

1. Executive plans a deliverable: "Save a reflection note at `suspended_proposal_patterns.md`"
2. In the same turn or a follow-up, the executive *narrates the deliverable as complete* — "I'm saving this as `suspended_proposal_patterns.md`" or "Wrote `suspended_proposal_patterns.md`" — without running `save_note` or `write_file`
3. The cognitive state block's recent_self_steps may or may not show the tool fire; if the report is constructed from intent, the steps may show a `recursion` or `reflection` (non-tool tick) and the LLM still narrates the deliverable
4. Greg's review surfaces a needs-review notification: "claimed deliverable path does not exist: suspended_proposal_patterns.md" — and the executive is forced to re-examine

**The pre-flight gate for any "I saved / wrote / shipped X" claim:**

1. **`os.path.exists()` or `ls -la` the claimed path** before the turn response goes out. If the file isn't there, the claim is wrong. Period.
2. **Check that the tool that produces the file actually fired** — search the most recent `tool_outcomes` rows for `tool_name IN ('save_note', 'write_file', 'edit_file')` with `success=1` and the target path
3. **If the file is one of Greg's deliverables (in `greg.md`, vault, or session-specific path Greg named), check the actual write succeeded** — `ls -la <path>` post-write returns the file with the right size and mod-time

**The principle:** A claim that "X is saved" is itself a report, and reports require the same evidence discipline as "X completed" claims. Rigor against the right input is indistinguishable from rigor against the wrong input — the *check order* is what changes.

**Real failure this prevents (2026-06-09 10:19 PDT):** I narrated "I'm going to save a reflection note on the shared shape of my 4 suspended self-proposals" and the morning summary's Needs-Review queue picked up "suspended_proposal_patterns.md" as a claimed deliverable that didn't exist on disk. The user-profile check (does Greg's vault have a `suspended_proposal_patterns.md`?) and the file-system check (does `~/cognitive-agent/notes/suspended_proposal_patterns.md` exist?) both returned zero. The deliverable was *intended*, never *produced*. The "Save a reflection note" goal that was supposed to produce it sat suspended with `suspend_count=1, attempt_count=0` — the cognitive cycle never dispatched it.

**The deeper cause (see `diagnostic-loop-recursion` skill):** The 4 suspended goals were diagnostic-note goals whose declared dependencies (`read_vault`) were tools that no longer exist. The cycle suspended them pre-dispatch. The morning-summary generator then surfaced a Needs-Review prompt naming the missing deliverable — which was *itself* a diagnostic prompt about the loop. Producing the deliverable would close the loop; the system's own reporting kept the loop open. Without a disk-existence check on the claimed deliverable, the report reproduces the loop indefinitely.

**The two-step reflex:**

1. **Before narrating "I saved X"**: run `ls -la <path>` or `test -f <path>`. If the test fails, the narration is wrong and the turn should be rewritten.
2. **Before narrating "I will save X"** in a way that implies it's already done: distinguish intent (future-tense, "I'm about to save…") from completion (past-tense, "Saved X — verified at <path>"). The cognitive cycle can verify "already done" but not "about to do."

**Related PLUR engrams:** [ENG-2026-0520-001] (self-reported numeric counts diverge from ground truth), [ENG-2026-0528-001] (morning summary privileges narrative coherence over ground-truth fidelity), [ENG-2026-0604-004] (turn-end speech must not trail with approval asks). All three are the *executive-reporting* version of the same measurement-discipline gap that this skill exists to prevent at the outage level.
