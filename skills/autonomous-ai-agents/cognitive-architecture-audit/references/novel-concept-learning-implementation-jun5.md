# Novel-Concept Learning: From Conversation to Structural Implementation

**Session:** 2026-06-05, 21:00–21:37 PDT
**Trigger:** Greg asked "If you had to teach a concept you have never encountered before — something I invented right now, with no prior training data — what is the actual cognitive process you would use, and where exactly would it break down?"

## The flow that worked

This is the reference case for the "deterministic contract over LLM self-assessment" pattern (see `pattern-decompose-and-ship` SKILL.md, "Deterministic Contract" section). The conversation moved through five distinct steps in 37 minutes, and each step produced a concrete artifact. A future audit that surfaces "the system is being asked to evaluate itself and consistently gets it wrong" should pattern-match this flow.

### Step 1 — Diagnose (in conversation, no code)

Greg asked an introspection question. I gave an honest answer that named the failure modes:
- No failure signal (can't tell derivation from confabulation)
- No persistence (re-derive each turn)
- Hallucination trap on elaboration
- Teach-back test fails open
- No compounding compression

The key discipline: the answer named the *class* of failure, not a specific instance. Every bullet pointed at a structural property of the LLM, not a tactical bug. This is what makes the diagnosis auditable — Greg can verify the failure class is real, not just my interpretation.

### Step 2 — Pen (with file:line citations)

Greg asked for an "elegant implementation pen." I read the live code (5 files: `contracts.py`, `deliberate.py`, `metacognition.py`, `self_improvement.py`, plus `goal_proposer.py` for the recent-fix history) and proposed 3 specific gaps + 3 specific fixes:
- Gap 1: DeliberationInput has no `concept_intake` field → add `ConceptIntake` Pydantic + `concept_update` action_kind + structural gate in `Deliberator.deliberate()`
- Gap 2: `ConfidenceTracker` measures retrieval+action, not concept stability → add `ConceptConfidence` class + `CONCEPT_INSTABILITY` signal
- Gap 3: `SUBSYSTEMS` list is closed; concept formation isn't a diagnosable subsystem → add `"concept_formation"` + falsifiability score

Each pen was grounded in a real file:line reference, a real pattern observable in the codebase, and a real failure mode traceable to specific behavior. The unifying pattern: **replace an LLM judgment with a structural contract whose only failure mode is bypassing the contract.**

### Step 3 — Verify the pen (before any code)

Greg said "proceed" without approving each gap individually. Before patching, I:
- Re-read the actual files (not the cached narrative)
- Confirmed the action_kind Literal needed extension
- Confirmed `Metacognition` had `__init__` to wire the new tracker into
- Confirmed `SelfImprovementLoop.diagnose()` had the right shape for an additional score line

The verification step caught the file size of the target patches (>50 lines per file) and the consequent need to use `patch()` not `write_file()` — both per the rules-of-engagement for this codebase.

### Step 4 — Ship with structural verification

Four files patched, 16/16 structural checks pass, 9/9 behavioral tests pass, 4/4 files parse. Each patch was minimal, additive, and backward-compatible. The verification gate ran at three levels:
- Parse (`ast.parse` on each file)
- Structural (presence of expected symbols)
- Behavioral (`is_unstable()`, `diagnose()`, `Intention(action_kind="concept_update")`)

The behavioral test was the load-bearing one — it confirmed the structural changes actually work as a system, not just that the symbols exist.

### Step 5 — Connect to active self-improvement focus

After shipping, I connected the work back to `[from self-improvement: focus area=confidence]`. The gap I filled isn't an "improve confidence" feeling-state goal — it's three concrete mechanisms (deterministic contracts) that, by their existence, raise the architecture's structural confidence. The connection is the active-focus audit, not a new goal. This is the pattern that prevents "improve confidence" from being a meta-emotional target (see `cognitive-architecture-audit` SKILL.md Pitfall #14 / `behavioral-learning-may15.md` "Synth synthetic telemetry" sidebar).

## What the flow produced

| File | Lines added | Verification |
|---|---|---|
| `cognition/contracts.py` | ~50 (ConceptIntake + Intention.action_kind + Intention.concept_id) | Backward-compat: existing action_kinds still validate |
| `cognition/deliberate.py` | ~80 (concept_intake field + concept_block prompt + structural gate) | Backward-compat: `concept_intake=None` keeps old behavior |
| `cognition/metacognition.py` | ~250 (ConceptConfidence class + CONCEPT_INSTABILITY + emit) | Backward-compat: ConfidenceTracker untouched, new attribute additive |
| `cognition/self_improvement.py` | ~40 (SUBSYSTEMS entry + diagnose() score + description + goal template) | Backward-compat: `concept_formation` defaults to 0.5 (neutral), no other scores change |

**Total: ~420 lines, 4 files, all additive, all backward-compatible, all behaviorally tested.**

## How to pattern-match this in a future audit

When the gap analysis surfaces any of these sentences, this flow applies:

- "The LLM is being asked to evaluate [X] and consistently gets it wrong"
- "The system has no first-class concept of [thing it should track]"
- "We can detect the failure but not prevent it"
- "The audit log shows [correct-looking output] that was actually [wrong]"

The flow's distinguishing feature is that the diagnosis is **in-conversation** and the implementation is **structural**. The diagnosis is the part that takes courage (naming your own failure mode); the implementation is the part that takes discipline (small additive patches with structural verification).

## Three things I deliberately did NOT do (and would do again)

1. **Did not touch `goal_proposer.py`** — most-edited file in the repo, root of two shipped bugs, no business in a 40-line patch
2. **Did not add a new LLM call** — every gap was solved by removing an LLM judgment, not adding one
3. **Did not wire a full executive.decide() rule for `CONCEPT_INSTABILITY`** — the signal exists, the existing executive bus can consume it later, but cross-system wiring in a same-commit change is the kind of scope creep this skill exists to prevent

The third item is the only one I'd revisit if doing this again. The conservative move (emit signal, don't wire rule) is right for v1; the follow-up (wire the rule in a separate commit) is the v2.
