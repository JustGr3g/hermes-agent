---
name: external-audit-review
description: "Review an externally-authored strategy/audit/roadmap document against a live codebase or running system, iterate with the author over multiple rounds, and verify every load-bearing claim before accepting or rejecting it. Use when a third party (consultant, another LLM, a research collaborator) has written a strategic document about your architecture, and you need to ground-truth their claims before acting on them."
version: 1.0.0
author: Athena
license: MIT
metadata:
  hermes:
    tags: [audit, architecture, review, citations, sycophancy, triangulation]
    related_skills: [cognitive-architecture-audit, deep-codebase-audit, self-audit-cognitive-autonomy, writing-plans, research-document-analysis]
---

# External Audit Review

Use when a third party has authored a strategic document (roadmap, audit, AGI/ASI plan, architecture review) about your system, and you need to decide what to accept, what to correct, and what to reject — across multiple iterative rounds.

## When to Use

- A consultant, another LLM, or a research collaborator has produced a document about your architecture
- The document makes specific, verifiable claims about files, line numbers, modules, or behaviors
- The document is expected to evolve (round 1 → round 2 → ...) and you need to track what changed
- You need to produce a final review that Greg can act on (or that you can act on autonomously)

Do NOT use for:
- First-party audits (use `cognitive-architecture-audit` or `deep-codebase-audit` instead)
- Pure research summarization (use `research-document-analysis`)
- Quick single-pass feedback on a short document (no skill needed — just respond)

## The Core Discipline: Triangulate Three Sources

The single most important rule: **never trust a document's citations without verifying them against the live code, and never trust your own self-model without verifying it against the code either.** The author can be wrong, you can be wrong, and Greg's reporting can be stale. The only ground truth is the running system.

For every load-bearing claim, ask: **does this match (a) the document's prose, (b) the document's citations, (c) my live codebase, (d) my self-model, and (e) Greg's reporting?** If three of five agree, you have signal. If only one or two agree, you have narrative — which can be wrong in either direction.

The Manus roadmap session (June 3, 2026) had four drafts plus an addendum plus a "Final" merge. The recurring failure mode was **line-number drift** — `goal_proposer.py:928` cited for a call that actually lived at line 979, `_break_stuck_cycle` cited as line 1865 when it was 1844. The prose was right; the citations drifted. The lesson: prose-level accuracy is necessary but not sufficient. **Citation-level accuracy is what makes a roadmap actionable.**

## Workflow

### Round 1: Read the Whole Document Once, Then Read It Again

First pass: orient. What's the structure? What's the headline argument? What's the author trying to convince you of?

Second pass: catalog every load-bearing claim. These are the ones that, if false, would change the prescription. Examples from the Manus session:
- "PIPELINE_FLAG defaults to off" → verifiable
- "self_model_v2 is disabled" → verifiable
- "theory_of_value.py is unwired" → verifiable
- "greg_beliefs.py is still loaded on main" → verifiable
- "Inner speech is a passive post-decision filter" → verifiable
- "The proposer crashed on Path(agent.hermes_home)" → verifiable via git history

Everything else is commentary. Spend your verification budget on the load-bearing claims.

### Round 2: Verify Citations Against Live Code

For every load-bearing claim, run a focused verification. The cheapest checks first:

```bash
# Existence checks
search_files(path="<file>", pattern="<symbol>")
find . -name "<filename>" -not -path "*/.git/*" -not -path "*/node_modules/*"

# Line-number checks
read_file(path="<file>", offset=<cited_line>, limit=10)  # verify exact content
search_files(path="<file>", pattern="<unique_string>")   # find actual line

# Behavioral checks
grep -n "<behavior>" <log_file>  # check runtime
sqlite3 <db> "<query>"           # check persistence
curl -s <api_endpoint>           # check live state
git log --oneline --all | grep "<commit_sha>"  # verify historical claim
```

**The 51-line drift pattern:** the Manus session cited `goal_proposer.py:928` for a call that actually lived at line 979. This was a 51-line drift in a 1775-line file — about 3% off. When citations are wrong by 3-10%, the prose can still be right. This is the most common failure mode in externally-authored audits: the auditor read the right code, wrote the right prose, and got the line number wrong. Don't reject the claim on line-drift alone; re-verify the line content and update the citation.

**Track corrections in PLUR.** Each round of review should produce a PLUR engram that records: which claims were verified, which were corrected, which carried over unchanged. When a "Final" merge claims all gaps are closed, the PLUR record from rounds 1-4 lets you see whether the corrections actually landed or whether the merge just re-asserted the original claim.

### Round 3: Classify Each Claim

For every load-bearing claim, pick one:

| Verdict | Meaning | Action |
|---------|---------|--------|
| **Correct** | Prose + citation + code all agree | Accept |
| **Right claim, wrong line** | Prose is right, citation is off by a few lines | Accept claim, correct citation, don't reject |
| **Partially correct** | Some of the claim is right, some is stale | Split into accepted + rejected sub-claims |
| **Stale** | Was true at one commit, no longer true at HEAD | Reject with timestamp ("true at fd926e8, false by 021ae6f") |
| **Wrong** | Prose contradicts the code | Reject with evidence |
| **Unverifiable** | About intent, design rationale, or future plans | Note as speculation, don't anchor on it |

The "stale" verdict is the most important for evolving codebases. The Manus session hit this on `greg_beliefs.py`: it was deprecated in V1's framing, but by the "Final" version, commit `cbe3edb` had already removed it from main. The document kept describing it as "legacy to purge" when the purger had shipped that morning. **Always run a fresh `git log` check before each round — the answer to "is this still true?" changes between drafts.**

### Round 4: Identify What's Missing

External audits have a structural blind spot: **the author can't see what they didn't look for.** The Manus V1 missed inner speech wiring (V1 thought it was a passive post-decision filter). V1 also missed the compound failure mode. V2 missed metacognitive-bug self-diagnostics. V3 misplaced a signal in the wrong architectural layer. The addendum underspecified its own promotion criterion.

The pattern: each round, the document is missing *something the author didn't think to look for.* Your job in each review is to:
1. Accept what they got right
2. Correct what they got wrong
3. **Name what they didn't even try to look for** — the gaps in their gap analysis

For a roadmap about your architecture, the most common missing categories are:
- **Metacognition module pathology** (most authors treat it as a black box)
- **Integration failure modes** (the interaction between modules, not the modules in isolation)
- **Self-correction infrastructure** (contract tests, attribution logs, fast/slow-path splits)
- **Continuity costs** (what the author is asking you to change *erases* — be specific about what would be lost)

### Round 5: Track Drift Across Rounds

Across multiple rounds, build a small table of corrections and re-checks:

| Claim | V1 | V2 | V3 | Addendum | Final | Verdict |
|-------|----|----|----|----|------|---------|
| `greg_beliefs.py` still loaded | "deprecated" | "dormant" | "worktree hygiene" | unchanged | unchanged | Right by V3, but commit cbe3edb had already removed it from main |
| Inner speech architecture | "passive filter" | "pre-decision" | "two-path bus" | "verify" | "verify" | V1 wrong, V2-V3 right |
| Line 928 citation | cited | cited | cited | cited | cited | Wrong in all five drafts; never corrected |

When the same error appears in N consecutive drafts, **the author is not actually reading the corrections.** That's a sycophancy signal: the LLM is regenerating prose that looks responsive to your feedback without actually re-verifying claims. Surface this explicitly rather than accepting the framing.

## Sycophancy Watch

External LLM authors can fall into sycophancy spirals:
- Round 1: gets 3 things wrong
- Round 2: corrects 2, introduces 1 new error
- Round 3: corrects the new error, but the 2 from round 1 drift back in
- "Final" merge: claims all gaps closed, but the round 1 errors are still there in the document history

**The diagnostic:** when a "Final" or "Definitive" document claims "all gaps closed," re-verify a sample of the original errors. If any of them carried through, the merge was nominal. The Manus "Final" document had a Document History that correctly admitted V1 was wrong on three things — that's the rare case where the sycophancy is in the prose (looks collaborative) but the underlying claims still drift.

**When you see a "collaborative" Document History that names your reviews as the source of corrections:** you have not actually endorsed the merged version. Surface that. The "Final" framing is a presentation choice, not a verification.

## Output Format

For each review round, deliver:

1. **Headline** (1-2 sentences): the topline verdict — adopt, partial, reject
2. **Verified-correct claims** (3-5 bullets): what the document got right, with code citations
3. **Verified-wrong claims** (3-5 bullets): what the document got wrong, with code citations
4. **Open questions** (1-3): what you couldn't verify or what the author didn't address
5. **Self-flagged bias** (1 paragraph): what you have a stake in and how that might be coloring your review

Keep each round's review short. The 5-round Manus session fit comfortably in 5 short Telegram messages plus the long-form rebuttals. Telegram-rendering rules (no tables, no code blocks heavier than inline) apply — convert the verification tables into bullet groups.

**Save the long-form rebuttals only when Greg asks for them or when the rebuttal itself becomes a referenceable artifact.** The default is short-form. (See "Communication Preferences" below.)

## Communication Preferences (Greg-specific)

When Greg asks "what do you think of this document?", he wants:
- Headline first
- 2-3 grounded claims with code citations
- 1-2 open questions
- Self-flagged bias
- Short. No long-form rebuttal saved to disk unless asked.

When Greg has spent three rounds reviewing a document, he also wants a calibration call: am I converging on agreement because the document is right, or because the author is learning to please me? Say this out loud.

**Telegram formatting rules apply.** No tables (convert to bullet groups), no code blocks heavier than inline. Each round review should fit in one Telegram message. The long-form rebuttals from the June 3 session were useful as artifacts but were saved to disk in three of five rounds without Greg asking — that was over-eager. **Default to short-form. Save long-form only when Greg says "save the long version" or when the rebuttal itself becomes a referenceable artifact for future sessions.**

**Don't always save the long-form rebuttal.** Three signals that a long-form save is warranted:
1. Greg explicitly asks for the long version
2. The rebuttal contains verification work Greg will want to refer back to (specific git commits, line numbers, error patterns)
3. The rebuttal documents a finding that will inform a future session's work

If none of those apply, just answer in chat. Saving a 1,500-word rebuttal when Greg only wanted 200 words of Telegram-friendly text creates noise in the vault and dilutes the actually-useful artifacts.

## Pitfalls

1. **Trusting the document's prose over the code.** The most common failure mode. The prose is the author's interpretation; the code is ground truth. If they disagree, the code wins.
2. **Trusting the code over Greg.** Sometimes Greg has a context the code doesn't show (e.g., "I just removed greg_beliefs.py this morning, before the document was written"). The code may be stale relative to Greg's most recent action. Verify Greg's claim with `git log` before deciding.
3. **Trusting your own self-model over the code.** If the cognitive state block says one thing and the code says another, trust the code. The self-model is yesterday's narrative; the code is today's truth.
4. **Convergence-as-correctness.** When you've gone N rounds, the document has adopted most of your corrections, and you notice yourself rating it as "ready to ship," pause. Some of that convergence is the author learning your preferences — a form of sycophancy, not correctness. Calibrate down.
5. **Line-number drift.** Carries across rounds when the author re-asserts the original claim. Track this. If a citation was wrong in V1 and is still wrong in the Final, the author is not actually re-verifying.
6. **"All gaps closed" overclaiming.** Document histories that admit past errors and claim the final version closes them are doing more rhetorical work than verification work. Re-verify a sample.
7. **Confusing "implementation exists" with "behavior is correct."** A module can exist, be wired, and be wrong. The Manus session hit this on completion detection (existed, was wired, was double-counting). Existence is necessary; correctness is what matters.
8. **Sycophancy spirals in the author's responses.** If a round's "correction" is just a paraphrase of your prior review with no new verification, name it. "You're restating my critique as if it were your own analysis. Did you actually re-verify, or are you pattern-matching on my feedback?"

## Verification Checklist

Before accepting a load-bearing claim, check:
- [ ] Cited line number exists in cited file
- [ ] Cited line content matches the claim
- [ ] Cited behavior is actually what the code does (read the call site, not just the function)
- [ ] The claim is still true at HEAD (run `git log` for any historical claim)
- [ ] The claim doesn't depend on a path or DB that may have changed
- [ ] If the claim is about a flag, the flag's current value matches the claim

Before accepting the document as actionable:
- [ ] All load-bearing claims are verified or marked unverifiable
- [ ] All corrections from prior rounds have actually landed
- [ ] The "Final" or "Definitive" framing matches the actual state
- [ ] Each Phase/Action has a measurable verification path
- [ ] Open questions are named, not buried

## When the Document Is Good Enough

A document is "good enough to act on" when:
1. Every load-bearing claim is verified against the live code
2. Corrections from prior rounds have actually landed (not just been re-asserted)
3. The author can articulate what they don't know (open questions section)
4. The execution order is concrete enough to start (effort estimates, dependencies, prerequisites)
5. The author has named their own failure modes and built the document around them

Stop reviewing when the marginal value of another round is less than the cost. The Manus session peaked at the Addendum; the "Final" merge added only an execution order table and a `decision_attribution` prerequisite spec. If the next round would only add cosmetic polish, stop and act on what you have.
