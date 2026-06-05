# Inner Speech → Tool Selection Pipeline Gap

**Date discovered:** 2026-06-02
**PLUR:** [ENG-2026-0603-001]

## Executive Summary

Inner speech generates rich, typed utterances (7 subtypes: `reflection`, `self_question`, `narration`, `deliberation`, `recovery`, `goal_verbal`, `uncertainty`) — but these types are structurally orphaned from the tool-selection pipeline. They're generated post-decision, stored as text in the LLM context block, and never read back by any decision-making subsystem. The only influence path is tone-keyword demotion (InnerSpeechAsPlanConstraint), which uses keyword bucket matching ("frustrated", "uncertain") — not the rich subtype label.

## Current Architecture (traced end-to-end)

### Generation Pipeline

```
agent.py:2346-2352  — Inner speech generated in background thread
                         AFTER executive.decide() at line 2305
agent.py:2364-2369  — Prior turn's winner drained + stored as
                         self._last_inner_speech_winner
agent.py:2604       — Winner injected into cognitive_state dict
                         as text key "inner_speech_winner"
```

The winner appears in the LLM context block as a text string. No subsystem reads the label back.

### The Only Influence Path: InnerSpeechAsPlanConstraint

```
inner_speech.py:522-558  — get_current_constraints():
                           Keyword-based tone detection → constraint flags
agent.py:2310-2343      — Post-decision filter:
                           If tone=="frustrated" → avoid_external_action
                           If tone=="uncertain" → prefer_retrieve
                           If not consistent → prefer_retrieve + avoid_external
executive.py:91-360     — Constraints applied as priority multipliers
                           (0.7 floor, never blocks)
```

This is:
- **Not content-aware** — "frustrated", "uncertain", "confident" are the only tone buckets
- **Post-decision** — can only downgrade an already-made EXECUTE to RETRIEVE
- **Not subtype-aware** — a `[deliberation]` weighing options and a `[recovery]` after failure express the same tone if they match the same keywords

### What Inner Speech Is NOT Wired Into

| Subsystem | File | Evidence |
|-----------|------|----------|
| ExecutiveControl.decide() | executive.py:91 | No inner speech input — reads metacog signals, motivation, WM, perception |
| CognitiveCycle | cognitive_cycle.py | Processes goals via motivation + endogenous focus |
| AttentionDirector.select_focus() | perception.py:314 | Reads metacog signals + associative memory, NOT inner speech |
| Deliberation system | deliberate.py | Processes goal content + context |
| Musing | musing.py | Uses AttentionDirector focus as seed — no inner speech input |

### What CAN Influence Tool Selection (Existing)

| Mechanism | File | Description |
|-----------|------|-------------|
| Metacognitive signals | metacognition.py | WM_OVERLOAD → PLAN; LOW_CONFIDENCE → RETRIEVE; UNCERTAINTY_RISE → RETRIEVE; CORRECTED → RETRIEVE; GOAL_COMPLETION → REFLECT; frustration → SUSPEND_GOAL |
| Motivation goals | executive.py:301-339 | Active goals with goal-context relevance determine EXECUTE vs RETRIEVE |
| Adaptive cap calibration | adaptive_caps.py | 30-day tool_outcomes success-rate → cap multiplier |
| Confidence-modulated cap shrink | autonomy_guard.py:789-812 | Low success rate → caps shrink to 25% |
| Behavioral patterns | pattern_learner.py | Tool-failure conditions surfaced as LLM advisory text |
| Tool-outcome feedback | cognitive_cycle.py:1734 | Record attempt outcomes, feed back into guard calibration |

## Design: Bridge Speech Type → Executive Bias

### Approach

Wire the winner's **subtype label** (not content) into the metacognitive signal bus, where ExecutiveControl already listens. Each subtype gets a soft priority bias on an existing decision path.

### Changes Required (~60 lines, 3 files)

#### 1. Add `emit_inner_speech_type()` to Metacognition

In `metacognition.py`, a new method that accepts the winner's subtype string and emits it as a structured metacognitive signal. The signal surfaces in the adaptive_signal dict that ExecutiveControl already reads.

#### 2. Add Executive Rules

One new rule per subtype, implemented as priority adjustments on existing ActionType decisions (never new action types):

| Subtype | Effect | Priority delta |
|---------|--------|----------------|
| `deliberation` | Bump EXECUTE priority +0.15 (deciding means you have context to act on) | low |
| `uncertainty` | Lower confidence floor -0.1 → more likely RETRIEVE before tool | low |
| `recovery` | After failure narration, skip next tool → REFLECT cycle | medium |
| `goal_verbal` | Boost goal-context relevance multiplier in Rule 6 | low |
| `self_question` | Widen retrieval breadth +1 for next cycle | low |
| `narration` | Neutral — observational, no override | none |
| `reflection` | Mild tilt toward REFLECT action type (+0.05) | minimal |

Each rule applies only when no higher-priority executive rule (frustration, WM overload, low confidence, etc.) has already decided. The confidence-modulated constraint system in `get_current_constraints()` still runs independently — this is additive, not a replacement.

#### 3. Wire the Call Site in agent.py

After the inner speech winner drains at line 2369, extract the subtype via reverse lookup (SpeechType enum values match bracketed labels) and emit the signal.

### Tunables

Two new entries in `tunables.py`:
- `inner_speech_deliberation_bias: float = 0.15` — priority bump for deliberation
- `inner_speech_uncertainty_penalty: float = 0.1` — confidence floor reduction

Both overrideable via env var.

### Non-Goals

- **Not content-aware.** Uses only the subtype label, not semantics. Content-aware injection is a future step.
- **Not an override.** Existing executive rules always win — inner speech shaping only fills the gap when no higher-priority rule has decided.
- **Not guaranteed to change behavior.** It's a soft bias on existing paths, not a command. Attended items and active goals still dominate.