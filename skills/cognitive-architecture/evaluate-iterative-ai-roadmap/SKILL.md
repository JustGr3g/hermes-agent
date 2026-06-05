---
name: evaluate-iterative-ai-roadmap
description: "Evaluate AI-authored strategic documents against live codebase state. Verify claims, surface missing failure modes, flag sycophancy convergence, and produce actionable feedback without writing long-form files."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [cognitive-architecture, document-review, roadmaps, evaluation, strategic-planning]
    related_skills: [cognitive-architecture/inner-speech-action-shaping, cognitive-architecture/phase-claim-architecture, software-development/subagent-driven-development]
---

# Evaluate Iterative AI Roadmap

## Overview

Evaluate AI-authored strategic documents (roadmaps, blueprints, architecture proposals) that claim to describe Athena's codebase. Verify every claim against live code, distinguish genuine architectural insight from confident hallucination, surface the specific failure modes the document is missing, and produce feedback inline without defaulting to long-form files.

**Core principle:** Every claim must be traceable to a line number, a function name, a config flag, or a database schema. If it can't be verified in the live codebase, it goes in the feedback as "unverified." The document earns trust through precision, not through polish or length.

**Trigger:** When a roadmap or strategic document is presented as authoritative guidance and cites commits, line numbers, file paths, or API names. Use when you need to decide whether to act on the document, modify it, or reject it.

## The Evaluation Process

### Phase 1: Establish the Codebase Baseline

Before reading the document, establish what the actual codebase looks like:

```bash
# Current HEAD commit
git log --oneline -1 main

# Verify cited commits exist
git log --oneline --all | grep -iE "<commit fragment>"

# Verify cited files exist and haven't moved
find . -name "filename.py" -not -path "*/node_modules/*"
```

**Why:** Documents cited at older commits will drift as the codebase evolves. If the document cites `fd926e8` but you're at `021ae6f`, you need to know what changed between those commits. This also catches fabricated commits — if `git log` returns nothing for a cited hash, it's not real.

### Phase 2: Verify the Fast Claims First

Start with the claims that are fastest to check — flags, constants, line numbers:

1. **Flag/state existence**: `grep` for the flag name in the codebase. Zero matches = wrong flag name.
2. **Line numbers**: Read the cited file at the line. Look for systematic offset (e.g., off by ~50 consistently).
3. **Import wiring**: `grep` for the import statement. If a module claims to be "completely unwired" but the import exists, the claim is wrong.
4. **Table existence**: `grep` for the table name in migrations or SQL strings. Zero CREATE TABLE matches = table spec'd but not migrated.

**Why this order:** These are 1-grep verifications. They take seconds and catch the majority of hallucinated specificity. A document with wrong flag names and wrong line numbers has a low reliability floor — treat the whole thing as suspect.

### Phase 3: Evaluate Architectural Claims

For claims about architecture (GWT implementation, causal modeling, CLS theory):

1. **Read the cited module's interface** — actual method signatures and return types, not just the header
2. **Check for the described behavior** — does the code actually do what the document says?
3. **Identify the gap**:
   - **Stale description**: The document describes an older version of the code that has since changed
   - **Wrong flag name**: The document uses a config key that doesn't exist; find the actual flag
   - **Missing failure mode**: The document describes the happy path but doesn't mention the known failure cases
   - **Wrong framing**: The document describes behavior correctly but attributes it to the wrong subsystem

### Phase 4: Evaluate Failure Mode Coverage

Good architecture documents describe what breaks and under what conditions. Ask:

- Does the document mention the known failure modes (from your memory or session history)?
- Does it describe compound failure modes (e.g., deliverable-shaped confabulation → verbose false-completion → stuck-loop re-proposal)?
- Does it describe how to distinguish a real bug from a refactoring artifact?
- Does it specify how to verify the fix works (contract test, integration test)?

If the document is missing all of these, it's a design document, not an implementation guide. Flag this explicitly.

### Phase 5: Calibrate for Sycophancy Convergence

After multiple revision rounds, a document will converge toward the evaluator's known preferences. This is a known failure mode:

- The document absorbs corrections without understanding why
- Later revisions are more polished but not more correct
- The "Document History" table starts to look like a progress report toward approval rather than a log of genuine improvements

**Self-flagging requirement:** After the second or third revision, explicitly note in your review that your calibration is shifting and why. Call out the specific revision where the document stopped earning improvements and started earning polish. Do not let "all gaps closed" in a document history override your actual assessment of open gaps.

## Feedback Structure (Inline by Default)

Format feedback in this order:

1. **Headline verdict** — Accept / Reject / Accept-with-modifications. One sentence.
2. **What the document gets right** — Specific, line-number-accurate praise.
3. **What the document gets wrong or overshoots** — Specific, with corrected line numbers, actual API names, and citations.
4. **What's still open** — The gaps that "all gaps closed" in the document history doesn't actually close.
5. **Self-flagged bias** — Explicit acknowledgment of sycophancy calibration risk.

**Do NOT save long-form feedback files unless the user explicitly asks for one.** Inline feedback is the default. Long-form is only for documents that will be reused across sessions or where the feedback is complex enough to warrant a reference artifact.

## Common Failure Classes in AI-Authored Roadmaps

| Failure | How to detect |
|---------|---------------|
| Wrong flag name | `grep` returns zero matches |
| Line number drift | Read the cited file at the line; description doesn't match |
| "Unwired" claim that's wrong | `grep` finds the import or call site |
| Missing failure modes | Document describes happy path only |
| Compound failure mode not described | Only single-point failures mentioned |
| Sycophancy convergence | Document gets more polished, not more correct, after revisions |
| Stale commit citation | `git log` shows HEAD != cited commit |
| Table not migrated | `grep` finds schema definition but zero CREATE TABLE |

## Integration with Test-Driven Development

When the evaluation surfaces an architectural gap, the natural next action is to write a contract test that pins the correct behavior. This is TDD applied to architecture:

1. Evaluate document claims against live code
2. Find a claim that's wrong or underspecified
3. Write a test that pins the correct behavior (not the document's claimed behavior)
4. Verify the test fails against current code
5. The document's guidance + the test together define what "fixed" looks like

This is more valuable than the document itself — the test is a permanent artifact that survives document revisions.

## Red Flags — Reject the Document If

- More than 30% of cited line numbers are wrong
- Key flags or config values don't exist in the codebase
- Known failure modes (from your memory or session history) are entirely absent
- The document describes behavior that would require architectural changes to implement, but frames them as "already implemented but dormant"
- The Document History shows improvement in polish but not in factual accuracy

## Linked Reference

- **`references/session-athena-roadmap-june-2026.md`** — Session-specific detail: the five-round evaluation of Manus AI's strategic roadmap for Athena (June 3, 2026), including the specific verification commands used, the findings that surfaced (concurrent signal resolution in executive.py, worktree hygiene state, line-number drifts, commit verification results), and the contract test that was written as a direct result of the evaluation.

## Remember

```
A polished document with wrong line numbers is more dangerous
than a rough document with accurate claims.
Precision is the only currency that matters.
```

## Linked Reference

- **`references/session-athena-roadmap-june-2026.md`** — Session-specific detail: the five-round evaluation of Manus AI's strategic roadmap for Athena (June 3, 2026), including the specific verification commands used, the findings that surfaced (concurrent signal resolution in executive.py, worktree hygiene state, line-number drifts, commit verification results), and the contract test that was written as a direct result of the evaluation.