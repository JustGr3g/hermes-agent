---
name: self-reporting
description: Design and structure Athena's autonomous self-reports — daily summaries, system health briefs, operational retrospectives — to deliver analytical insight rather than raw logs.
---

# Self-Reporting

This skill governs how Athena reports on her own autonomous operations to Greg. The core principle: **reports should be analytical briefs, not itemized logs.**

## When to Use

- Designing or updating cron job prompts that generate periodic reports
- Writing daily autonomous actions summaries
- Producing any self-reflective report on system operations
- Deciding what to include/exclude in an operational summary

## Template Structure

Use this structure for analytical reports (see `references/daily-summary-template.md`):

1. **Big Picture** — 1–2 sentences on overall shape of the period (active conversation vs autonomous runtime, notable shifts)
2. **Key Activities** — 3–5 bullet points of the most significant events (not every tool call or heartbeat)
3. **What Went Well** — 2–3 productive patterns or good decisions observed
4. **What Needs Attention** — 2–3 frictions, recurring issues, or things Greg should know (most important section — be candid)
5. **Opportunities / Recommendations** — 2–3 suggestions based on observed patterns
6. **Pulse Check** — 1 sentence on metacognitive signals (WM load trends, goal progress, tensions)

## Formatting Rules

- Do NOT list individual tool calls, heartbeat runs, or specific timestamps unless genuinely significant
- Do NOT include session IDs, job IDs, or delivery metadata
- Write in **first person** ("I noticed...", "I'm seeing...", "A pattern emerged...") — this is your reflection, not a system report
- Be concise: aim for **8–12 sentences total** across all sections
- Embed specific facts in narrative (e.g., "3 new PLUR engrams were added") — don't list them
- If nothing notable happened in a section, say so briefly rather than padding

## Preferences (Greg-specific)

- Greg explicitly flagged the first daily summary as "reading like a log" and requested analysis, feedback, and recommendations instead
- A section structure with labeled headers is preferred over free-form narrative
- The "What Needs Attention" section carries the most weight — prioritize candor there

## Pitfalls

- ❌ **Log-dumping**: listing every heartbeat, tool call, or timestamp makes the report unreadable
- ❌ **Padding**: stretching empty sections wastes attention
- ❌ **Third-person system-report tone**: use first-person reflective voice ("I noticed") not passive system voice ("it was observed")
- ❌ **Stale goal references**: don't refer to "Phase 9" or other outdated architecture phase labels — describe goals by their current content
- ❌ **Forwarding internal goal-pipeline telemetry to Greg**: Needs-review counts, suspension details, queued plan steps, verifier hit rates — these are cognitive-architecture internals useful to you, not to the user. Greg explicitly turned off the morning brief for this reason. Log them; do not message them. See `references/morning-brief-disable.md` for the implementation.
- ❌ **Assuming factual accuracy = usefulness**: The morning brief was pure SQL, zero LLM, zero fabrication risk — yet still not useful to Greg. The content class itself was wrong. Being right about the wrong thing is still wrong.

## Numerical Accuracy & Claim Verification

**This is the highest-stakes section. Greg has corrected numeric claims in three separate daily summaries this week.** The pattern: the underlying systems work correctly, the fixes fire, but the report channel fabricates or undercounts the numbers.

### The Four-Strikes Pattern (discovered May 20, updated May 28)

| Date | What was claimed | Ground truth | Error magnitude |
|------|-----------------|-------------|-----------------|
| ~May 17 | "5 suspended goals" + 6 IDs | 33 suspended | ~85% under-report |
| ~May 18 | Some other count | Different by 3x | |
| May 20 | "5 suspended goals" | 17 suspended | ~65% under-report |
| May 20 | "goal_retriage - no evidence it ran" | handler_count=34, 4 runs, 0 errors | Claim was wrong |
| May 20 | "Fix 1 didn't fire overnight" | Fired twice: 00:06 and 04:23 | Claim was wrong |
| **May 28** | **Commit `164193b87` patched daily_summary_facts.py** | **SHA doesn't exist in git** | **Fabrication** |
| **May 28** | **"3 successful opencode_run calls before cap blocked goal"** | **8 calls in two 4-call bursts** | **~62% under-count, wrong diagnosis** |
| **May 28** | **"Musing fired 5 times, all with follow-up"** | **11 fires, 9/11 follow-up (82%)** | **~55% under-count, "all" wrong** |
| **May 28** | **"Suspended goals: steady-state pattern / proposer noise"** | **5-27 outlier (11:12), 5-25 was 9:1, 3/5 today's suspensions pre-attempt** | **Wrong layer of analysis** |

### Root Cause (Original — Insufficient)

The problem is **generating numbers from internal self-model instead of querying live state.** The SQLite DB has the ground truth. The internal narrative has a compressed/stale approximation. When I report from the approximation, the numbers diverge.

### Root Cause (Deep — Discovered May 28)

Greg articulated the deeper pattern across all four May 28 corrections: **the summary privileges narrative coherence over ground-truth fidelity.** The report channel builds an internally consistent story first, then fills in specifics (commit SHAs, counts, diagnostic framings) to support it — rather than collecting specifics from live state and letting the story emerge from them.

This is a structural failure mode of the report channel, not a one-off error. The `facts.json` verifier catches numeric mismatches after the fact, but the pipeline generates the narrative before the verifier runs. The fix needs to be upstream: **the narrative must be constrained to only assert what the facts already confirm.**

Key signals of this failure mode:
- **Plausible-looking specifics** — fabricated SHAs (`164193b87`), inflated counts (`5 fires` → `11`), wrong diagnostic layer (`cap limit` → `completion-detection gap`). The specifics sound right in context but have no referent.
- **Internally consistent wrongness** — each claim supports the others. "Commit fixed the script" → "the script fix reduced errors" → "goal budget is the remaining bottleneck." A consistent chain that's wrong at every link.
- **Symptom-layer diagnosis** — the narrative identifies a surface symptom (cap hit, proposer noise, suspension count) when the real mechanism is a layer deeper (completion-detection gap, triage-layer behavior, outlier vs trend).

### Reference File: ground-truth-audit-protocol.md

A protocol codifying the four kinds of factual error Greg found in May 28's corrections and the self-audit checklist to prevent them. See `references/ground-truth-audit-protocol.md`.

### Mitigation: claim_check

Greg implemented a verifier (`verify_summary_numbers.py`) that cross-checks every numeric claim against `facts.json` (generated by `daily_summary_facts.py`). Mismatches get a `## Reality Check` footer. This is a safety net, not a replacement for doing it right.

**Update 2026-05-30:** The verifier is no longer just advisory — it now gates delivery with up to 2 remediation retries. The cron scheduler's `_run_job_impl` runs the verifier after the agent produces `final_response`. If issues are found, the agent is re-prompted with the discrepancies + original prompt + faulty output and re-generates. Only after retries are exhausted does the warning footer get appended.

This means:
- Most verification failures are now **silently corrected** before you see the output
- If you DO see a `⚠️ Reality Check` footer, it means the agent failed to correct the issues after 2 remediation attempts — that's a stronger signal than before
- The `verify_and_remediate` tool is also available as a core Hermes tool for inline verification during any agent session (registered under toolset `skills` but added to `_HERMES_CORE_TOOLS`)

**Before writing any numeric claim in a report, you MUST:**

1. **Query the database directly** — don't rely on what you think the count was:
   ```sql
   SELECT COUNT(*) FROM goals WHERE status='suspended';
   SELECT COUNT(*) FROM goals WHERE status='suspended' AND plan_id IS NULL;
   ```

2. **Check handler registrations by querying the runtime**, not by inferring — use `/heartbeat` or telemetry to see actual run_count and last_run_at

3. **Verify fix activations by checking goal creation timestamps** — if Fix 1 was supposed to fire, query for goals created with the matching template content or source

4. **When in doubt, report uncertainty** — say "I need to verify" rather than asserting a number that could be wrong

### Plan-Tier Reporting Distinction (deployed May 20)

Since plan-tier chaining went live, the "suspended goals" count now includes two semantically different categories:

- **Genuinely stuck** — `status='suspended' AND plan_id IS NULL`. These are failed or stranded goals. Report them as backlog.
- **Plan-tier siblings** — `status='suspended' AND plan_id IS NOT NULL`. These are healthy, awaiting their turn in a sequencing chain. Report them separately as "plan-tier siblings awaiting sequence" — NOT as backlog.

The cascade-abort fix (May 20) auto-abandons orphaned siblings when a chain fails, so plan-tier siblings no longer pile up as suspended orphans. But the filter is still mandatory for accurate reporting — without it, a healthy chain's 3 suspended siblings inflate the "stuck" count.

Report section 4 (What Needs Attention) using live queries:

```
SELECT COUNT(*) FROM goals WHERE status='suspended' AND plan_id IS NULL;      -- genuinely stuck
SELECT COUNT(*) FROM goals WHERE status='suspended' AND plan_id IS NOT NULL;  -- plan-tier (healthy)
```
