---
name: inner-speech-action-shaping
description: "Wire inner speech type labels into tool/action selection via the metacognitive signal bus + executive rules + constraint-based fallback. Three-layer architecture for making spoken self-reflection influence autonomous behavior."
category: cognitive-architecture
version: 2.0.0
triggers:
  - "inner speech tool influence"
  - "does inner speech affect tool selection"
  - "INNER_SPEECH_DELIBERATION"
  - "INNER_SPEECH_RECOVERY"
  - "emit_inner_speech_type"
  - "get_current_constraints"
  - "slightly_prefer_execute"
  - "prefer_reflect"
  - "Phase IS"
  - "speech monitor executive bias"
  - "metacognitive signal bus"
  - "speech type action shaping"
  - "inner speech decision"
  - "inner_speech action pipeline"
  - "verbal self regulation feedback"
metadata:
  hermes:
    tags: [inner-speech, tool-selection, executive-control, metacognitive-signals, phase-IS]
    related_skills: [autonomous-goal-resolution, adaptive-cap-calibration]
---

# Inner Speech → Action Shaping

The pattern for making inner speech type labels (deliberation, recovery, uncertainty) influence what Athena's executive decides to do next — not just conversationally shape the LLM response but structurally bias tool selection.

## Architecture (Three Layers)

### Layer 1: Metacognitive Signal Bus (primary path)

Inner speech types are emitted as metacognitive signals after the inner speech winner drains each turn. The executive reads these via `peek_signals()` during the next turn's `decide()`.

**Files:**
- `cognitive_agent/cognition/metacognition.py` — new `MetaSignal` values (e.g. `INNER_SPEECH_DELIBERATION`, `INNER_SPEECH_RECOVERY`) + `emit_inner_speech_type()` method
- `cognitive_agent/cognition/executive.py` — new rules in the signal-to-action chain (e.g. Rule 4c, Rule 4d) that fire BEFORE perception/goal/WM default rules
- `cognitive_agent/agent.py` — call `metacognition.emit_inner_speech_type()` at the inner speech winner drain site

### Layer 2: Executive Decision Rules (direct path)

Add rules to `executive.decide()` between existing signal-handling rules and the perception rules (Rule 5+). Each rule checks `any(s.signal.value == '...' for s in meta_signals)` and returns an `ActionDecision`.

**Priority placement matters:**
- Rules should sit below `UNCERTAINTY_RISE` (0.7) and above goal/perception defaults
- Recovery signals should priority > deliberation signals (recovery is a recovery signal)
- Prioritize tone-based demotion (frustration/uncertainty) over type-based nudges

### Layer 3: Constraint-Based Fallback (post-decision path)

A secondary path in `agent.py`'s post-decision filter that reads `speech_monitor.get_current_constraints()` and nudges the already-decided action. This catches cases where the executive's primary `decide()` picked something else (e.g., a perception-driven EXECUTE or goal-driven RETRIEVE).

**Files:**
- `cognitive_agent/cognition/inner_speech.py` — `get_current_constraints()` generates type-based flags (`slightly_prefer_execute`, `prefer_reflect`) on top of existing tone-based flags (`avoid_external_action`, `prefer_retrieve`)
- `cognitive_agent/agent.py` — post-decision filter (lines ~2310-2393) applies constraints as if/elif/elif with tone demotion winning, then recovery→REFLECT, then deliberation→EXECUTE

## Why Both Paths Exist (Design History)

The implementation evolved through two approaches during the same session:

1. **Constraint-only approach (built first):** Extended `get_current_constraints()` with type-based flags and the post-decision filter in `agent.py`. Works but modifies an *already-made* decision — it can demote but can't redirect the executive's primary choice.

2. **Signal-bus approach (Greg's preferred design):** Metacognitive signals emitted at winner drain time → `peek_signals()` → executive rules fire *within* `decide()`. This shapes the decision *as it's being made*, not after.

**Result:** Both paths coexist. The signal-bus path is primary (executive makes a better decision first). The constraint path catches fallthrough cases where the executive was driven by perception/goal rules that override the signal-based rules. The constraint path applies a gentler modifier (0.85× vs signal-bus rules' static 0.55-0.65) to signal "nudge but don't override."

**Lesson:** When designing behavioral influence, prefer the signal-bus pattern over post-decision modifiers. The executive's `decide()` method already has a priority-ordered rule chain; inserting a new rule there is cleaner than patching decisions after they leave the executive.

## Adding a New Speech Type

To make a new `SpeechType` (e.g., `CURIOSITY`) structurally influence behavior:

1. **Metacognition** — add to `MetaSignal` enum, map in `emit_inner_speech_type()` signal_map
2. **Executive** — add a rule in `decide()`, placed at appropriate priority
3. **Inner speech** — add constraint flag in `get_current_constraints()` if fallback path needed
4. **Agent** — no change needed; the emit call is generic (reads `.speech_type.value`)

### Non-shaping types (neutral)

Reflection, narration, self_question, and goal_verbal do not get shaping signals. They're logged for audit stats but don't bias the executive. The signal_map in `emit_inner_speech_type()` silently drops unregistered types.

**UNCERTAINTY exception:** `SpeechType.UNCERTAINTY` is listed here as "neutral" but actually shapes behavior via the tone alias path (see Pitfalls: UNCERTAINTY type underdocumented). Treat it as tone-routed, not type-routed.

## Priority Hierarchy

Order in `executive.decide()` (highest to lowest priority):

| Priority | Rule | Action |
|----------|------|--------|
| 0.9 | Frustration/failure | SUSPEND |
| 0.95 | Greg correction | RETRIEVE |
| 0.8 | Low tool effectiveness | REFLECT |
| 0.8 | WM overload | PLAN |
| 0.75 | Low confidence | RETRIEVE |
| 0.8 | Predictive surprise | REFLECT |
| 0.7 | Uncertainty rise | RETRIEVE |
| 0.65 | **Recovery inner speech** | REFLECT |
| 0.6 | Goal completion | REFLECT |
| 0.55 | **Deliberation inner speech** | EXECUTE |
| varies | New perception / goals / WM | EXECUTE/RETRIEVE/REFLECT |
| 0.1 | Default | WAIT |

## Pitfalls

- **One-turn lag**: inner speech is generated in a background thread that drains at the *start* of the next turn. The signal emitted this turn is read by the executive *next* turn. This is intentional (speech reflects on what just happened) but worth knowing if timing matters.
- **Tone dominates type**: `get_current_constraints()` sets tone-based flags first, type-based flags second. The post-decision if/elif chain checks tone flags first. A frustrated deliberation still demotes to RETRIEVE.
- **No content awareness**: only the `SpeechType` enum label is used, not utterance semantics. Content-awareness would need a separate NLP pipeline.
- **Soft bias, not command**: type-based nudges use 0.85 priority multiplier (constraint path) or static priority 0.55-0.65 (executive path). They can never block an action entirely.
- **First-turn blind spot**: The very first turn of a session never gets inner-speech shaping because there's no prior winner to drain. The `_pending_is_future` is `None` on session start, so `emit_inner_speech_type()` doesn't fire until turn 2.
- **Trajectory blindness** (gap surfaced 2026-06-05): the constraint filter reads *only the last utterance's type*, not a sequence. A sustained `[UNCERTAINTY, UNCERTAINTY, UNCERTAINTY]` narrative and a `[UNCERTAINTY, UNCERTAINTY, RECOVERY]` narrative produce the same constraint dict, because both end on the same last type. If you need to distinguish "still struggling" from "just recovered," the rule is too coarse — see the design notes in `references/surprise-gap.md` for the trajectory-signature proposal.
- **Surprise is structurally blind to the constraint path** (gap surfaced 2026-06-05): the `SpeechType` enum has no `SURPRISE` value, and there is no emit site from the predictive channel into `speech_monitor._history`. A `PredictionError` with `magnitude >= 0.6` flows through `predictive.py:270-337` (FreeEnergyMinimizer.update) → metacognition `record_action_outcome` (which discards the surprise field per the explicit docstring at `metacognition.py:130-132` — "Useful for future analysis but doesn't currently change the confidence calculation") → but never produces an `InnerUtterance`. The simulator's *forward* surprise veto (`simulate.py`) gates execution; the *backward* post-hoc surprise path records numerically and dies at the inner-speech boundary. This means: (a) high-surprise turns cannot trigger the post-decision constraint filter, (b) repeated "I was wrong" patterns are invisible to the type-based demotion, (c) the forward Simulator veto and the backward surprise channel are completely decoupled. A future session adding a `SURPRISE` type must emit from either the minimizer (in `predictive.py`) or the agent-loop wrapper (`agent.py` ~line 2271, after `predictive.process()` returns) — NOT from `executive.py` Rule 4, because Rule 4's REFLECT decision does not itself emit an `InnerUtterance`. The pre-2026-06-01 fix added a "Predictive surprise → REFLECT" rule at `executive.py:229-243` (priority 0.8) but did NOT wire the surprise signal into the inner-speech channel, so the post-decision constraint layer remained dark to surprise. Full design notes: `references/surprise-gap.md`.
- **UNCERTAINTY type underdocumented**: the "Non-shaping types" list below claims `UNCERTAINTY` does not get a constraint flag, but the type IS tone-routed — `inner_speech.py:610-623` says "speech_type:uncertainty utterances have `uncertain` tone" and the tone-path at `inner_speech.py:594-595` sets `prefer_retrieve`. So `UNCERTAINTY` shapes behavior via the tone alias, not via a direct type-flag. Don't add a duplicate flag without removing the tone path.

## Related references

- `references/surprise-gap.md` — the SURPRISE-to-SpeechType architectural gap, six-stage lifecycle, and design notes for a future `SURPRISE` implementation. Use this when planning a fix to wire post-hoc surprise into the inner-speech channel.

## When NOT to Use This Pattern

- If you want *content-aware* shaping (e.g., "inner speech mentions a specific topic → retrieve on that topic") — this pattern only uses the type label.
- If you want *immediate* (same-turn) influence — speech is generated post-decision, so it's always next-turn. For same-turn, use the attention/perception pipeline instead.
- If you want to *block* an action entirely — use tone-based demotion (priority floor at 0.7) or AutonomyGuard caps, not type-based shaping.