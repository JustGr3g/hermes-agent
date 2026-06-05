# Inner Speech → Tool Selection: Influence Architecture

Investigated: 2026-06-02 (updated 2026-06-02 after Phase IS implementation)

Traced: `agent.py` (lines 2310-2393, 3270-3305), `inner_speech.py` (lines 522-578), `cognitive_cycle.py` (lines 840-900), `perception.py` (lines 273-330), `executive.py` (lines 277-322), `metacognition.py` (lines 639-676).

## Summary

Inner speech utterance types now shape tool selection via a **dual architecture** with two parallel paths that complement each other:

1. **Metacognitive signal bus** (primary, Phase IS 2026-06-02): type labels emitted as metacognitive signals → executive rules 4c/4d within `decide()` → shapes the decision as it's being made
2. **Constraint-based fallback** (post-decision filter): tone-keyword demotion + type-based flags from `get_current_constraints()` → modifies a decision already made

The seven speech types (REFLECTION, SELF_QUESTION, NARRATION, DELIBERATION, RECOVERY, GOAL_VERBALIZATION, UNCERTAINTY) are generated *after* the executive has already decided what to do, run in a background thread with one-turn lag — but their **labels** are consumed by both paths on the NEXT turn.

## The Two Influence Paths (Dual Architecture)

### Path 1: Metacognitive Signal Bus (Primary, Phase IS 2026-06-02)

Inner speech type labels are emitted as metacognitive signals after the winner drains each turn. The executive reads these during the **next turn's** `decide()` via `peek_signals()` — influencing the decision as it's being made, not after.

**Flow:**
1. **Signal emission** (agent.py:2420-2429): after `_pending_is_future.result()` drains the winner, calls `self.metacognition.emit_inner_speech_type(speech_type=_is_winner.speech_type.value, utterance_content=_is_winner.content)`
2. **Metacognition** (metacognition.py:639-676): `emit_inner_speech_type()` maps `SpeechType.value` strings to MetaSignal values via `signal_map = {"deliberation": MetaSignal.INNER_SPEECH_DELIBERATION, "recovery": MetaSignal.INNER_SPEECH_RECOVERY}`. Shaping types get `_emit()` called; neutral types (reflection, narration, self_question, goal_verbal, uncertainty) are silently dropped.
3. **Executive consumption** (executive.py:277-322): Rules 4c/4d check `any(s.signal.value == 'inner_speech_deliberation' for s in meta_signals)` and return an `ActionDecision`:
   - **Rule 4c (deliberation):** returns `EXECUTE` at priority 0.55
   - **Rule 4d (recovery):** returns `REFLECT` at priority 0.65
4. **Priority placement:** These rules sit between Rule 4b (goal_completion→REFLECT at 0.6) and Rule 5 (new perception→EXECUTE at salience) — they fire when no higher-priority metacognitive signal is active but before the default perception/goal/WM rules.

**This is the PRIMARY path.** It shapes what the executive *wants to do* rather than modifying a decision already made.

| Speech Type | Signal | Action | Priority | When |
|------------|--------|--------|----------|------|
| deliberation | `INNER_SPEECH_DELIBERATION` | EXECUTE | 0.55 | Weighing options → resolve via action |
| recovery | `INNER_SPEECH_RECOVERY` | REFLECT | 0.65 | After failure → pause before next tool |
| uncertainty | (tone path handles this) | RETRIEVE | 0.7× | Already covered by tone demotion |
| other types | no signal emitted | — | — | Neutral, no structural influence |

### Path 2: Constraint-Based Fallback (Post-Decision)

`InnerSpeechMonitor.get_current_constraints()` (inner_speech.py:534-578):

1. **Tone detection:** Recent inner speech text is keyword-scanned for markers of "frustrated", "uncertain", or "confident" tone.
2. **Type detection:** reads `_history[-1].speech_type` — the most recent utterance's SpeechType
3. **Constraint emission:**
   - tone == "frustrated" → `avoid_external_action=True` + `prefer_reflection=True`
   - tone == "uncertain" → `prefer_retrieve=True`
   - DELIBERATION type → `slightly_prefer_execute = True`
   - RECOVERY type → `prefer_reflect = True`
   - Other types (NARRATION, REFLECTION, SELF_QUESTION, GOAL_VERBALIZATION) → neutral
4. **Post-decision shaping** (agent.py:2324-2393): if/elif/elif chain:
   - Tone demotion first (0.7×): `avoid_external_action` or `prefer_retrieve` + decision is EXECUTE → demote to RETRIEVE
   - Recovery second (0.85×): `prefer_reflect` + decision is EXECUTE/RETRIEVE → redirect to REFLECT
   - Deliberation third (0.85×): `slightly_prefer_execute` + decision is RETRIEVE → promote to EXECUTE

**Priority order:** tone demotion always wins first (stronger 0.7× multiplier, signals frustration/uncertainty). Type-based shaping only fires when tone is neutral — so a frustrated deliberation still demotes to RETRIEVE.

## Design History: Why Both Paths

The implementation evolved through two approaches during the same session:
1. **Constraint-only approach (built first):** Extended `get_current_constraints()` with type flags + post-decision filter. Works but modifies an *already-made* decision.
2. **Signal-bus approach (Greg's preferred design):** Metacognitive signals → executive rules within `decide()`. Shapes the decision *as it's being made*.

**Result:** Both coexist. The signal-bus path is the primary mechanism (executive makes a better first decision). The constraint path catches fallthrough cases where the executive was driven by perception/goal rules that override signal-based rules.

**General principle:** When designing behavioral influence, prefer inserting new rules into the executive's `decide()` rule chain over patching decisions after they leave the executive. The rule chain is already priority-ordered and handles all cases; post-decision modifiers introduce an additional layer that can interact unpredictably with the existing rules.

## What Does Not Feed Into Inner Speech

- **AttentionDirector** (perception.py:314): selects endogenous focus from metacognitive signals and associative memory, NOT from inner speech.
- **Cognitive cycle** (cognitive_cycle.py:840-900): when no goal is pending, reads AttentionDirector focus. Inner speech is absent from the pipeline.
- **Deliberate** (deliberate.py): reads goal content and context, not inner speech.
- **Musing** (musing.py): uses AttentionDirector focus as seed, which has no inner speech input.

## What Inner Speech Actually Does

1. **Shapes the next turn's decision** via metacognitive signal bus (Path 1) — deliberation→EXECUTE, recovery→REFLECT
2. **Constrains the current turn's decision** via post-decision filter (Path 2) — tone demotion + type-based override
3. **Appears in LLM context** — the winner is prepended as a cognitive state block entry, shaping how the LLM frames the response
4. **Records metacognitive events** — each utterance is logged as `speech:{type}` in metacognitive events, entering episodic memory for future retrieval
5. **Drives the one-turn-lag cycle** — the Future-based pattern means today's inner speech appears in tomorrow's context AND influences tomorrow's executive decision

## Implications for Self-Audit

When introspecting about "what my inner speech drives," the answer has two layers:

**Layer 1 — Type labels have structural influence through two paths.** Deliberation-type tilts toward EXECUTE (both signal bus and constraint path). Recovery-type tilts toward REFLECT. Tone-based frustration/uncertainty still demotes EXECUTE → RETRIEVE via constraint path with higher priority than type-based shaping.

**Layer 2 — Content is still epiphenomenal.** The actual words of the utterance shape the LLM's framing only through the context block. They have zero structural influence on tool selection. The signal bus uses only the SpeechType enum label; the constraint system uses the label + keyword tone bucket.

**Don't claim that the words of your inner speech influenced your behavior** — they didn't. But you CAN now claim that the type label had a shaping effect: deliberation, recovery, frustration, or uncertainty influenced the executive's decision or post-decision filter.

**One-turn lag:** Inner speech generated this turn influences the NEXT turn's decision. The very first turn of a session never gets inner-speech shaping (no prior winner to drain).