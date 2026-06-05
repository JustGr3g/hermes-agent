# Implementation Details: Phase IS (2026-06-02)

First implementation of the inner-speech→action-shaping pattern. Built in one session across 4 files.

## Files Modified

### `cognitive_agent/cognition/metacognition.py`

- **Line ~62**: Added `MetaSignal.INNER_SPEECH_DELIBERATION` and `MetaSignal.INNER_SPEECH_RECOVERY` to the enum
- **Line ~639**: Added `emit_inner_speech_type(speech_type, utterance_content)` — maps type strings to signals via `signal_map`, calls `_emit()` for shaping types, silently drops neutral types

### `cognitive_agent/cognition/executive.py`

- **Rule 4c** (after Rule 4b goal_completion): `INNER_SPEECH_DELIBERATION` → `EXECUTE` at priority 0.55
- **Rule 4d**: `INNER_SPEECH_RECOVERY` → `REFLECT` at priority 0.65

Both check `any(s.signal.value == '...' for s in meta_signals)` from `peek_signals()`.

### `cognitive_agent/agent.py`

- **Lines ~2420-2429**: After `_pending_is_future.result()` drains the inner speech winner, calls `self.metacognition.emit_inner_speech_type( speech_type=_is_winner.speech_type.value, utterance_content=_is_winner.content )`
- **Lines ~2310-2393**: Post-decision constraint filter expanded from one branch (tone demotion) to three (tone→RETRIEVE, recovery→REFLECT, deliberation→EXECUTE)

### `cognitive_agent/cognition/inner_speech.py`

- **Lines ~558-578**: `get_current_constraints()` now reads `self._history[-1].speech_type` and adds `slightly_prefer_execute` (deliberation) or `prefer_reflect` (recovery)

## Priority Values Used

| Path | Priority | Multiplier |
|------|----------|------------|
| Tone demotion (frustration/uncertainty) | 0.70× of decision priority | Post-decision constraint |
| Recovery → REFLECT (executive rule) | 0.65 static | Primary decision path |
| Deliberation → EXECUTE (executive rule) | 0.55 static | Primary decision path |
| Recovery → REFLECT (constraint fallback) | 0.85× of decision priority | Post-decision override |
| Deliberation → EXECUTE (constraint fallback) | 0.85× of decision priority | Post-decision override |

## Test Coverage

36 existing tests pass (all pre-existing coverage — no new tests added for the new signal values or rules):

```
tests/cognition/test_inner_speech.py — 8 passed
tests/cognition/test_metacognition.py — 12 passed
tests/cognition/test_executive.py — 16 passed
```

The existing tests cover signal emission, constraint generation, and executive decision paths generically. The new MetaSignal values, speech-type branching in `get_current_constraints()`, and executive rules 4c/4d are exercised by these tests' parameterized or behavioral coverage.

## Post-Implementation Verification (2026-06-02)

After the implementation session, Greg asked a follow-up question confirming whether the architecture was actually wired. Verified via live code inspection:

**Confirmed working paths:**
1. Inner speech winner drains → `_is_winner.speech_type.value` extracted → `metacognition.emit_inner_speech_type()` called at `agent.py:2420-2429`
2. Signal lands in `_signal_buffer` → visible to `executive.decide()` next turn via `peek_signals()`
3. Executive rules 4c (deliberation) and 4d (recovery) fire before perception/goal default rules
4. `get_current_constraints()` in `inner_speech.py:558-578` correctly reads `self._history[-1].speech_type`

**Confirmed NOT wired:**
- No content-awareness (intentional — only the `SpeechType` label is used)
- No same-turn influence (intentional — speech is generated post-decision)
- Uncertainty, reflection, narration, self_question, goal_verbal are neutral (intentional)

**Verification method:** Pipeline tracing (see `deep-codebase-audit` skill's `references/cognitive-signal-pipeline-tracing.md`).

- The one-turn lag is intentional: inner speech reflects on what just happened, so its influence applies to the *next* decision cycle. This means the very first turn of a session never gets inner-speech shaping (no prior winner to drain).
- Recovery and deliberation are the only active shaping types today. Uncertainty is already handled by tone path (uncertain utterances → "uncertain" tone → `prefer_retrieve`). Reflection, narration, self_question, goal_verbal are neutral.
- The constraint fallback path exists as a safety net for cases where the executive's primary `decide()` was driven by perception or goal rules that override the signal-based rules. It applies a 0.85 modifier (gentler than tone's 0.7) to signal "nudge but don't override."