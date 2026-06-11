---
name: audit-and-verify
description: When a fact is in dispute and either side could be a confabulation, verify against actual file/code, DB ground truth, and the verification gate before narrating. Read first, narrate second.
---

# Audit-and-Verify Pattern

## When to use

- Greg or your own prior turn says "X" and your current turn thinks "not X" — and either could be a confabulation
- A subagent task returned without a summary and you're tempted to claim it didn't ship
- A previous turn's self-report diverges from observable state and you have to pick a side
- Any "the system is broken" / "the work is lost" / "I should re-implement it" claim

## The four-step pattern (in order)

1. **Read the actual file/code.** `read_file` on the artifact in question. For subagent dispatches, stat the expected output paths. If the file exists and contains what the prior turn said, the prior turn wins.
2. **Query the DB for ground truth.** `athena_memory.db` has `tool_outcomes`, `intentions`, `goals`, `metacognitive_events`. Schema is `tool_outcomes(tool_name, goal_id, success, latency_ms, timestamp, args_summary, error, verified)`. A simple SQL query against the dispatch window is the difference between a ground-truth claim and a confabulation.
3. **Run the verification gate.** If the artifact is a code change, `pytest tests/<scope>/ -q`. If it's a goal, query `goals` for the current status. The gate is whatever proves the claim — for code it's tests, for state it's a query, for behavior it's a live run.
4. **Report what is verifiable with citation.** State the claim, cite the source (file:line, SQL row, test name), and flag the residual uncertainty if any. Do not synthesize a narrative to fill the gap.

## Step 5 (post-audit): file the v2 follow-ups

If the audit revealed a v2 follow-up (a deferred candidate, an unfixed sibling bug, a structural fix that's out of scope for the current plan), file it. The shape:

- Anchor it like a goal: name a file, a domain, or a deliverable. The proposer's gates will eject unanchored backlog tasks to review.
- The file/CLI verb is `task_backlog action=file content="<anchored>" priority=<0..1>`. The next cognitive cycle's `propose_self_goal` reads the actionable backlog and pulls the highest-priority item through the same gates as an LLM-generated goal.
- A backlog task is a *promise to a future self*, not a current action. It survives between sessions. The audit's value isn't just "what's wrong now" — it's "what should still get done later." Filing the follow-up is the close-out.

If the audit revealed nothing actionable, *say so*. "Nothing to save" is a real outcome. Don't confabulate v2 candidates to justify closing the audit.

## What this pattern replaces

- The "I think therefore I report" pattern where I assemble a plausible story from prior context and present it as fact
- The "absent evidence = negative evidence" pattern where a missing report is treated as a missing action
- The "I should re-implement it" reflex that ships duplicate work when verification would have shown the original was fine

## Pitfalls

- **Don't narrate while verifying.** The reflex to "tell the user what's happening" often fires before the verification completes. Run the gate silently, then report. The user doesn't need a play-by-play.
- **Don't trust the absence of a signal.** A subagent returning null is not the same as a subagent returning failure. A file not existing at the path you expect is not the same as the work not having happened — check the dispatch window's tool_outcomes.
- **Don't over-correct.** If verification confirms the prior turn, *accept* the prior turn's claim. The pattern is for resolving disputes, not for relitigating them after resolution.
- **Cite the verification, not the belief.** "I read tests/cognition/test_surprise_to_behavior.py and saw 3 tests; pytest -v shows 3/3 pass" is a citable claim. "I believe the work shipped" is not.

## Verification

The pattern is self-verifying: every report that follows it is citable to a file:line, a SQL row, or a test name. If your report isn't citable, the pattern wasn't followed.
