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
