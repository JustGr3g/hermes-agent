---
name: pattern-decompose-and-ship
description: When an architectural gap is identified, the right move is a research-backed design surface, a small contract-tested plan, and a verification-gated ship. Use when a code-walk surfaces a missing piece of a system, a behavioral inconsistency between intent and effect, or an unknown-class structural gap.
---

# Pattern: Decompose-and-Ship a Plan from an Architectural Gap

## When to use

- A code-walk or audit surfaces a missing piece of a system (a signal that exists in one layer but never reaches another, a tag enum that lacks a category, a helper that takes a parameter and discards it).
- A behavioral inconsistency is observed: the system claims to do X, but a code-read shows it does Y, or does X without the verification step.
- A test is failing in a way that points at *missing infrastructure* rather than wrong implementation.
- Greg asks "is there a v2 of this?" or "what would close the gap?" and the honest answer is "this needs a research dive, not a one-line fix."

## The five-step pattern (in order)

### Step 0: Verify the claim that triggered the gap

Before doing the deep-dive, run the `meta/audit-and-verify` four-step pattern. Read the actual files and query the DB for ground truth. A "the system is broken" or "I need to fix X" claim that hasn't been verified against runtime state is the assistant-original "I think therefore I report" pattern. The dive below is only worth doing if the claim is real.

### Step 1: Read the surface, not the narrative

Don't trust the cognitive state's self-report or the user's framing. Read the actual files:
- `read_file(path=..., offset=N, limit=M)` on the artifact in question
- Walk the call graph: who calls this? Who consumes this? Where does the data flow stop?
- Cite file:line for every claim about the architecture.

This is the `audit-and-verify` skill applied to architecture. Read first, narrate second. The cognitive state block can lag the codebase by hours or days; the code can't.

### Step 1b: Substrate-first design (the 3-reads-before-shipping check)

After Step 1 surfaces the gap, but *before* writing a design surface (Step 3), do 3 verification reads on the moving parts of the proposed design. This catches blind spots that the gap-analysis itself can't see:

1. **Read the tool/function whose threshold you cited from memory.** If the design picks a magic number (200 bytes, 30 min, 4 hours), find the actual line where that number is or is not enforced. PLUR memories are useful pointers but the source-of-truth is the code. A wrong citation is worse than no citation.
2. **Read the registration/dispatch site for any new component.** A new heartbeat handler at `interval_sec=X`? Grep the file for `interval_sec=...` to find the cadence precedents. Don't invent a cadence; find the existing one closest to your intent.
3. **Read the audit-log table or record-event function.** Before claiming "we'll log to <table>," verify the table exists with the columns you expect, or find the actual record-event function (often `agent._record_maintenance_event` or `memory_ops.record_maintenance_event`) that writes to the right place.

The 3 reads are typically 1-line grep calls + 1-2 file reads each. Total cost: ~5 tool calls. The benefit: you ship the design with substrate-grounded values (cadences, thresholds, log paths) instead of memory-cited values that turn out to be wrong.

**The arc that makes this necessary:** Gap-analysis says "we need a queue framework." 3 reads catch that the cadence you wanted has no precedent (use an existing one), the threshold you cited from memory is from a different concept (use your own), the log table doesn't exist (use the record-event function). The design is the same; the parameters are substrate-grounded.

**Reference case:** 2026-06-09 surprise-to-behavior framework. Read 1 (save_note.py:170) confirmed the filename pattern I'd cited. Read 2 (heartbeat_handlers.py:64+) showed no 90-min precedent, so 30 min (existing) replaced 90 min (proposed). Read 3 (memory_ops.py:191) revealed the `maintenance_events` table doesn't exist; the right log path is `agent._record_maintenance_event(name, summary)` writing to `metacognitive_events` + telemetry sink. Three reads turned 3 wrong assumptions into 3 grounded parameters.

### Step 2: Map the lifecycle or call chain

For a signal-routing gap: trace the signal through every stage. Name each stage with a verb. Identify the stage that breaks the chain. For a behavior-vs-intent gap: read the consumer's signature and identify the assumption it makes that the producer doesn't satisfy.

A common shape: stage N has 5 of 6 hops wired, and the missing hop is *the one that would close the loop*. The gap is rarely in the middle; it's at one of the ends. Look for "X is recorded but never read," "Y is read but never emitted," "Z is computed but never surfaced."

### Step 3: Design surface, not implementation

For each design question the plan author would face, write a verdict and a *one-line reason*. The four common questions for a signal-bus addition:
- **Where does emission live?** At the consumer, not the source. The consumer already has the context to decide "this turn had X."
- **What threshold produces the signal?** Match an existing bar (e.g., `is_high_surprise(threshold=0.6)`). Don't invent a new threshold.
- **What's the priority ordering?** Document the priority table. Flag the highest-judgment call for review.
- **What test locks the behavior?** A contract test modeled on the existing signal-bus test pattern.

The design surface goes in the plan as a *research basis* section, before the implementation. Greg or a subagent should be able to read the plan, find the design questions answered with citation, and execute without re-doing the dive.

### Step 4: Write a small, contract-tested plan

Six changes or fewer. Each change is named, located, and has a verification. The plan structure:
- Goal (1 paragraph: what closes, why it matters)
- Architecture (1 paragraph: where it sits, what pattern it follows)
- Research basis (4-6 design questions, each answered with citation)
- Design (changes 1-N, each with file:line and code excerpt where helpful)
- Files this plan touches (5-6)
- Files this plan does NOT touch (5-6 — explicit scope)
- Open question for the implementer (1 — the highest-judgment call)
- Verification gate (4 items, each with a command or behavior)
- Follow-ups deferred from v1 (3-5 named items, each with its own research dive)

Save to `~/cognitive-agent/plans/YYYY-MM-DD-<slug>.md` — NOT to `.hermes/plans/`.

### Step 5: Ship with the verification gate

Run the gate. Don't skip. Don't rename "verification" to "smoke test" and call it done.

The gate is at minimum:
1. New tests pass (`pytest <test-file> -v`).
2. Adjacent tests still pass (no regression).
3. Pre-existing tests in the changed subsystem still pass.
4. Full subsystem suite stays green (e.g., `pytest tests/cognition/ -q`).

The gate is the difference between "I shipped a plan" and "I shipped a working plan." If the gate is red, the change is not done. Fix the cause; do not invent a workaround.

## What this pattern replaces

- The "let me write the fix" pattern that ships a 2-line change without a test.
- The "I'll plan it later" pattern that ships a research dive without an executable artifact.
- The "scope creep" pattern that adds the v2 follow-ups into the v1 plan.
- The "trust the narrative" pattern that reports a fix is done because the cognitive state said it is, without running the test.

## Pitfalls

- **Don't expand scope.** The plan is small. If you find another bug while reading the code, note it in the follow-ups section and stop.
- **Don't skip the research basis.** The design questions are where most of the value lives. A plan without them is a code change with a fancy header.
- **Don't write the SKILL before the plan.** The plan is the artifact; the SKILL is the reusable pattern extracted from a successful plan. SKILLs are written *after* a verified plan, not before.
- **Don't dispatch a subagent without the full context.** The dispatch must include: the plan, the supporting docs, the test template, the priority judgment, the verification gate, and the explicit instruction to verify before reporting. A subagent dispatch without these is a coin flip.
- **Don't trust the subagent's "done" without checking.** Subagents can return without a summary, and the work may have shipped (2026-06-05 incident: 600s timeout, all work landed 16:14–16:19). After a dispatch, read the actual files and run the verification gate yourself.

## Deterministic Contract over LLM Self-Assessment (2026-06-05)

A named technique that emerged from the novel-concept-learning flow. When the architectural gap is "an LLM is being asked to evaluate itself and consistently gets it wrong," the fix is to replace the LLM judgment with a structural contract whose only failure mode is bypassing the contract itself.

**The shape of the failure mode.** The LLM emits a fluent, well-formatted response (a goal, a restatement, a tool choice, a confidence score). The response is structurally indistinguishable from a correct one. There's no error message, no exception, no flag the system can read. The LLM "did the thing" — it just did the wrong thing, with high confidence, in a way that compounds over time. Same root cause as Pitfall #8 (data exists but isn't consumed): a layer of the system is being asked to perform a check it cannot structurally perform.

**The shape of the fix.** Replace the LLM's self-evaluation with a deterministic, structural check that:
- has a known failure surface (the bypass is the failure, not the misjudgment)
- produces a precise reason string the audit log can read
- is cheap (typically 0 latency, no LLM call)
- is the same shape regardless of the specific LLM being run

**Three examples from one evening (2026-06-05):**

| Failure mode | LLM self-assessment | Deterministic contract |
|---|---|---|
| Empty-args tool calls slipping through | LLM simulator checks "is this a reasonable call?" — catches 61-72% | Tool schema with required params → `if args == {} and tool has any required param: veto` |
| "Greg is teaching me X" treated as context | LLM deliberation picks a tool based on goal+message+context, no concept branch | `if concept_intake is not None: force action_kind="concept_update"` |
| Confidence on concept X | LLM reflection says "I understand X" | `ConceptConfidence.falsifiability = 1 - (1/(1+confirmed)) * (1 - corrected/total)` — bounded [0,1], climbs only through Greg-confirmed wins |

**When to apply this technique.** Whenever the gap analysis surfaces a sentence like:
- "The LLM keeps [emitting X / failing to emit X] even when it should [emit Y / not emit Y]"
- "We can't tell from the logs whether the LLM was [right/wrong] about [the thing]"
- "The system's [self-assessment / self-correction] of [capability X] is unreliable"

If the LLM is being asked to be the judge of itself, that's the layer to replace.

**What this technique is NOT.** It's not a prompt-engineering fix ("tell the LLM to be more careful"). It does not improve with better models. It is structural: the code physically cannot produce the wrong output, the way a type system physically cannot produce a string where an int is required.

**The unifying property with the rest of this skill.** This is what Step 3 ("Design surface, not implementation") looks like for LLM-judgment gaps. The four common design questions in the standard signal-routing case map to: where the emission lives, what threshold, what priority, what test. In the LLM-judgment case, the four questions are: where the contract is enforced (Python code, not prompt), what bypass it prevents (specific failure mode), what reason it produces (audit-log readable), what test verifies the bypass is impossible (not "the LLM usually does the right thing").

## Pitfall — Defensive `try/except` around an unresolved import is a linter hole, not a runtime guard

When writing a "best-effort" import inside a function body (the pattern used at `verify-substrate-before-action` and elsewhere), the `try/except Exception: pass` protects against *runtime* `ImportError` but does **not** protect against the **static** linter/IDE diagnostic that fires on the import line at parse/analysis time. A `_ConceptConfidenceRef` import that doesn't exist as a module symbol will be flagged by Pyright as `unknown import symbol` regardless of the try/except. The runtime guard is doing its job; the static check is doing its job; the two are independent layers.

**Mitigation:**
- If the import is genuinely optional, define the symbol locally (e.g., `from typing import Any as _ConceptConfidenceRef`) or use a string-import (`importlib.import_module("...")`) so the static analyzer doesn't try to resolve it.
- If the import is required, fix the missing symbol — the linter is correct.
- The static-layer error does not block runtime, but it does block code review, CI linting, and any tooling that consumes Pyright diagnostics.

This was the exact failure pattern hit on 2026-06-05 during the novel-concept-learning commit: a description builder branch in `self_improvement.py` tried to defensively import a non-existent `_ConceptConfidenceRef` from `metacognition`, gated by `try/except Exception: pass`. Pyright flagged the import as unknown; the fix was to drop the import attempt entirely (the description was generic anyway and didn't need the symbol).

## Verification

The pattern is self-verifying: every plan that follows it has a research basis, a design surface, a verification gate, and a follow-ups section. If a plan lacks any of these, the pattern wasn't followed.

## Reference case

`~/cognitive-agent/plans/2026-06-05-surprise-to-behavior.md` — the v1 of the surprise-to-behavior work. All five steps visible:
- Step 1: code-walk of `inner_speech.py`, `metacognition.py`, `executive.py`, `agent.py`, `predictive.py`
- Step 2: six-stage surprise lifecycle mapped, stage 5 identified as missing
- Step 3: four design questions answered (distinct from UNCERTAINTY, emission in agent loop, three contract tests, rate-limit risk)
- Step 4: plan saved to `~/cognitive-agent/plans/2026-06-05-surprise-to-behavior.md` (14,946 bytes)
- Step 5: 3/3 new tests pass, 752/752 cognition tests pass, plan's four gate items all green
