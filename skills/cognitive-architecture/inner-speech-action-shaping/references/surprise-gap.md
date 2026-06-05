# Surprise-to-Behavior Architectural Gap

Investigation date: 2026-06-05
Source vault notes: `~/Documents/Obsidian/Hermes/02-AI-Projects/Agentic-AI/2026-06-05 Inner-Speech Tag-to-Behavior Audit.md` and `.../2026-06-05 Deep Dive - Surprise-to-Behavior Gap.md`

## The gap in one sentence

`PredictionError` events (surprise) flow through `predictive.py` → `metacognition.py` and through `simulate.py` (forward veto), but **never produce an `InnerUtterance`**, so they never appear in `speech_monitor._history` and therefore never trigger the type-based constraint filter at `agent.py:2353-2430`.

## Why this matters for this skill

This skill describes a three-layer architecture. Layers 1 (signal bus) and 2 (executive rules) handle surprise correctly:

- **Layer 1 (signal bus):** The predictive surprise path could in principle emit `INNER_SPEECH_SURPRISE` via the metacog bus, but it doesn't — there is no emit site, and there is no `MetaSignal` value.
- **Layer 2 (executive rules):** `executive.py:229-243` Rule 4 has a "Predictive surprise → REFLECT" at priority 0.8. Works.
- **Layer 3 (constraint fallback):** Blind. `get_current_constraints()` only sees utterances in `speech_monitor._history`. No surprise utterance → no constraint.

So a future session implementing a new `SURPRISE` speech type must wire it through Layer 1 or 2 (NOT Layer 3) for it to be observable in the constraint path. The cleanest fix is to add the type to `SpeechType`, add an `emit()` call in either the `FreeEnergyMinimizer.update()` site (predictive.py:287) or the agent-loop wrapper (agent.py ~line 2271, right after `predictive.process()` returns), and then add either:

- A new executive rule at appropriate priority, OR
- A new `MetaSignal` value + signal-bus emit, OR
- A new constraint flag in `get_current_constraints()` for the fallback path.

## Six-stage surprise lifecycle (where stage 5 is missing)

| Stage | Where | What happens |
|---|---|---|
| 1. Predict | `predictive.py:381-398` | Top-down predictions stored |
| 2. Compare | `predictive.py:400-414` | `PredictionError(sign, magnitude, predicted, actual)` |
| 3. Minimize | `predictive.py:270-337` | FreeEnergyMinimizer: episodic boost, associative edge updates, LOW_CONFIDENCE to metacog, `mode="explore"` |
| 4. Reflect | `reflect.py:90` | If `outcome.surprise >= 0.4`, Reflector records it |
| 5. **Speak** | **`speech_monitor._history` ← MISSING** | **No InnerUtterance generated from surprise** |
| 6. Shape | `agent.py:2353-2430` | Constraint filter reads last-utterance type — can't see surprise |

## Forward (Simulator) vs backward (post-hoc) surprise — the decoupling

- **Forward:** `simulate.py` predicts action outcomes before execution. Veto mode blocks the action.
- **Backward:** `predictive.py` compares actual tool output to predictions after execution. Records numerically, updates beliefs, emits LOW_CONFIDENCE.

These two channels do not communicate. A high-surprise veto AND a high post-hoc surprise on the subsequent alternative are two separate signals; no current code correlates them. This is a load-bearing design limitation, not a bug — but a future "learning from surprise" feature needs to bridge them.

## Concrete code sites for a SURPRISE implementation

| Decision | Location | Notes |
|---|---|---|
| Where to add `SURPRISE` to enum | `inner_speech.py:25-32` | Add as 8th value |
| Where to emit | `predictive.py:287` (inside `is_high_surprise` branch) OR `agent.py:2271` (after `predictive.process()`) | Minimizer is more cohesive; agent-loop is more discoverable. Threshold: 0.6 (matches `is_high_surprise`) |
| Threshold for emission | `0.6` | Matches existing `is_high_surprise(threshold=0.6)` at `predictive.py:50-51` |
| Constraint flag (if Layer 3 chosen) | `inner_speech.py:610-623` (extend the type-switch in `get_current_constraints`) | `SURPRISE` → set `prefer_retrieve` (parallels `UNCERTAINTY`) |
| Test | New test asserting "high-surprise event produces an `InnerUtterance` in `speech_monitor._history`" | Locks the behavior in; serves as verification gate |
| Risk: reflexive loop | `prefer_retrieve` can self-reinforce if surprise → retrieve → surprise → retrieve | Consider rate-limiting; the salience floor and commitment exemption at `agent.py:2395` partially address this |

## Three adjacent gaps that came up in the same code-walk

1. **Trajectory blindness** in the constraint filter (last-utterance rule is too coarse; see Pitfalls in SKILL.md).
2. **Reflexive recovery loop** — `RECOVERY` type → `prefer_reflect` → REFLECT action → narrate recovery → `RECOVERY` type, ad infinitum. Salience floor + commitment exemption partially break it; an "N-consecutive-recoveries" counter would be a clean fix.
3. **Affective tone vs. speech-type aliasing** — `UNCERTAINTY` is tone-routed, not type-routed. This is fragile (the two paths could drift if the keyword list changes) but works today.

## What an implementation plan would need to decide

Four design decisions (full text in the deep-dive vault note):

- **A.** Add `SURPRISE` to enum (option 1) vs. add `surprise_magnitude: float` field to existing `InnerUtterance` (option 2).
- **B.** Threshold for emission (0.6 is the right bar).
- **C.** Trajectory improvements in v1 (defer) vs. follow-up.
- **D.** Close the Simulator ↔ post-hoc surprise gap (defer; own project).

## Open questions

1. Should `SpeechType.SURPRISE` be distinct from `SpeechType.UNCERTAINTY`? Surprise is backward-looking; uncertainty is forward-looking. They feel conceptually different.
2. Should the surprise→speech emission happen at the minimizer or at the agent-loop level?
3. Should the implementation include a test that locks the behavior in?
4. Is there a self-reinforcing `prefer_retrieve` risk, and should the constraint be rate-limited?
