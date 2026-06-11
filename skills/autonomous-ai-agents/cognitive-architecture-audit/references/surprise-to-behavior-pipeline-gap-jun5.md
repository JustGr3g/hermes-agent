# Surprise → Behavior Pipeline Gap — 2026-06-05

**Session:** Cognitive cycle ran a 5-tool-call deep dive into the gap between the predictive-channel surprise signal and the inner-speech → metacognition → executive signal bus. Outcome: a 5-change implementation plan, shipped via subagent, all 752/752 cognition tests green, plus an audit-trail observability fix (the `synth:` reasons now carry context in `args_summary`).

**Why this is a reference, not just a session artifact:** the same gap-class fires repeatedly in this architecture (inner-speech types are categorized, the executive consumes some types but not others, the consumed types route through MetaSignal while the uncategorized ones go to LLM context as text). The labels audit, the deep dive, the plan, and the audit-trail fix are all reusable for the v2 work (trajectory signatures in the constraint filter, Simulator↔post-hoc surprise coupling, confidence formula using the recorded `surprise` field).

## The class-level pattern

1. **Audit pass** — read the type vocabulary (`SpeechType` enum) and the type-to-behavior mapping (`get_current_constraints` and `peek_signals` consumers). Identify which types route to observable behavior changes, which are presentational only, and which *missing* types would close a behavioral gap.
2. **Deep dive** — once a missing type is identified, trace the signal lifecycle stage by stage. For surprise: predict → compare → minimize → reflect → **speak** → shape. Stage 5 was structurally missing. The same six-stage template applies to any other signal that enters one channel and should shape another.
3. **Plan** — five small changes (one new enum value, one new MetaSignal, one emission call site, one signal-map entry, one executive Rule) modeled on the most recent prior precedent (here: Phase IS 2026-06-02 INNER_SPEECH_DELIBERATION/RECOVERY addition). Use the existing contract-test pattern as the test template.
4. **Ship via subagent** — small, well-scoped, contract-tested plans are the right shape for subagent dispatch. The blast radius is one signal bus, the verification is one test file, and the design surface is fully mapped in the plan.
5. **Verify on the next turn** — read the actual files (not the subagent's report) and run the test suite. The 600s-subagent-timeout pitfall (see `verify-before-declaring-outage` §"Subagent-without-summary pitfall") is the named failure mode for this step.

## Specific evidence files for this iteration

- **The labels audit:** `02-AI-Projects/Agentic-AI/2026-06-05 Inner-Speech Tag-to-Behavior Audit.md` (in the Obsidian vault). Establishes that 3 of 7 SpeechType values route to observable behavior, 4 are presentational, and SURPRISE is missing from the type vocabulary entirely.
- **The deep dive:** `02-AI-Projects/Agentic-AI/2026-06-05 Deep Dive - Surprise-to-Behavior Gap.md` (in the Obsidian vault). Maps the six-stage signal lifecycle and names the four adjacent gaps deferred from v1.
- **The plan:** `~/cognitive-agent/plans/2026-06-05-surprise-to-behavior.md`. 14,946 bytes, six changes, three contract tests, one judgment call (Rule 4e priority 0.6 vs 0.8).
- **The shipped code:**
  - `inner_speech.py:25-37` — SpeechType.SURPRISE added with comment distinguishing it from UNCERTAINTY
  - `metacognition.py:70-77` — MetaSignal.SURPRISE_DETECTED added as a *post-hoc predictive* signal, layered on top of the INNER_SPEECH_* group
  - `agent.py:2303-2330` — emission block: `if error.is_high_surprise(threshold=0.6): emit_surprise_utterance + emit_signal`
  - `metacognition.py:656-665` — signal_map entry `"surprise": MetaSignal.SURPRISE_DETECTED`
  - `executive.py:319-340` — Rule 4e: SURPRISE_DETECTED → ActionType.RETRIEVE @ priority 0.6, mode "explore". 19-line code comment documents the priority choice (recovery > surprise > deliberation).
- **The contract tests:** `tests/cognition/test_surprise_to_behavior.py` — 3 tests, all green. Modeled exactly on `tests/cognition/test_metacognitive_signal_bus.py:51-80`.

## The follow-up gap class (deferred from this iteration, reusable for v2)

The deep-dive doc identified four adjacent gaps that v1 deliberately did not address:

1. **Trajectory blindness in the constraint filter.** `get_current_constraints` reads the *last* utterance type; sequences like `[UNCERTAINTY, UNCERTAINTY, UNCERTAINTY]` and `[UNCERTAINTY, UNCERTAINTY, RECOVERY]` are indistinguishable. A `_consecutive_type_count` or `trajectory_signature` helper would resolve this.
2. **Reflexive recovery loop.** `RECOVERY` type → `prefer_reflect` constraint → REFLECT decision → potentially more recovery narration → next REFLECT. The salience floor and commitment exemption partially break the loop; a per-N-turns cooldown keyed on signal type would close it fully.
3. **Tone-vs-type aliasing.** `speech_type:uncertainty` defers to the tone path (`get_tone()` keyword scan) — this is an assumption, not a structural mapping. If a non-LLM template-fallback path emits an UNCERTAINTY utterance, the tone path still fires (because "uncertain" appears in the templates), but the linkage is by happenstance, not code.
4. **Simulator ↔ post-hoc surprise coupling.** The Simulator veto (forward channel) and the post-hoc surprise channel (backward) are decoupled. A signal that says "vetoed action was also post-hoc surprising" would let the executive reason about *why* the veto fired.

Each of these is a separate plan, each with its own research dive. The shape is the same: read the existing signal bus, find the missing or under-specified path, propose a small change modeled on a prior precedent, ship with a contract test.

## The audit-trail observability fix (also from this session)

Separately from the surprise-to-behavior work, I found that `_record_synth_outcome` in `cognitive_cycle.py:2341-2366` was discarding the `reason` parameter when writing to `tool_outcomes` — the actual error context (e.g., `"tool_select_failed: <e>"`) was captured in `CycleOutcome.skipped_reason` but never written to disk. 41 `synth:no_tool_resolution` events in the 7-day window all had `args_summary=NULL`, making "why are our goals dying?" a 30-minute log archaeology exercise instead of a one-line SQL query.

**Fix:** `_record_synth_outcome` now accepts an optional `context: Optional[str] = None` parameter and writes `args_summary="reason=X | context=Y"` (capped at 460 chars). Four call sites threaded: `runtime_dep_blocked` (goal content), `tool_select_failed` (exception text), `no_tool_resolution` (augmented target), `tool_crashed:<tool>` (exception class + message). Regression test: `tests/cognition/test_synth_outcome_audit.py` — 4 tests, all green.

**Why this belongs in the cognitive-architecture-audit reference:** the failure mode (a *reason* argument passed through, *captured in CycleOutcome.skipped_reason*, but discarded at the persistence layer) is a structural sibling of the "data exists at Python level but isn't consumed" pattern (Pitfall #8 in this skill) and the "consumer exists but producer is missing" pattern (Pitfall #13). The fix is the same shape: a few lines of code, a contract test, and the next "why did this goal die?" investigation becomes a one-line SQL query.

## Reusable reflex for the next iteration

The reflexive end-of-iteration check that worked here:

1. **Verify what shipped** (read the files, run the tests) — don't trust the prior turn's report.
2. **Sib­ling-search for the same bug class** (one tool with a conditional-required param, all 11 tools scanned).
3. **Read the source where the *missing* signal would land** (the `_record_synth_outcome` helper, the dispatcher's `selected is None` path).
4. **One-line fix + one-line test** for the simplest gap; queue the rest.

This is the same reflex as the May 22 deserialization fix: storage layer → deserialization layer → runtime consumption layer → downstream wiring. When a downstream behavior is "wrong," the bug is usually at one of the four layers, and the verification must traverse all four rather than stopping at the first.
