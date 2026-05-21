# Faithfulness Filter & Inner Speech Citation Discipline

## What Changed (2026-05-06)

Two new rules governing how Athena reports her own inner speech:

### 1. Verbatim Tag Rule (in cognitive state block, lines 543–558)

When citing inner speech, the bracketed subtype tag MUST match the literal `speech_type` value from the cognitive state block — NOT a semantic category that "fits the content better."

**Example:**

| Cog block shows | Valid citation | Invalid citation |
|---|---|---|
| `• [goal_verbal] My goal is to audit the system` | `[from inner speech: goal_verbal]` | `[from inner speech: deliberation]` |
| `• [reflection] I'm thinking about X` | `[from inner speech: reflection]` | `[from inner speech: analysis]` |

**Valid SpeechType enum values** (from `cognitive_agent/cognition/inner_speech.py`):
- `reflection` — thinking about something
- `self_question` — asking self a question
- `narration` — narrating an action
- `deliberation` — weighing options
- `recovery` — after failure, self-encouragement
- `goal_verbal` — making goals explicit
- `uncertainty` — expressing doubt

### 2. Faithfulness Filter Cross-Check (in cognitive_processor.py, lines 687–764)

The `FaithfulnessFilter.apply()` method runs after the LLM generates its response. It:

1. Scans the response for `[from inner speech: TAG]` patterns
2. Cross-references each citation against the actual `inner_speech` array in the cognitive state dict (`self._last_cog`)
3. If a citation tag doesn't match the stored utterance's `type` field, rewrites the sentence with the correct tag

**Mode:** Controlled by `ATHENA_FAITHFULNESS_MODE` env var (default `detect` — telemetry only, no behavior change; `strip` removes wrong citations; `regenerate` re-calls LLM).

**Implementation caveats:**
- Built in `CognitiveProcessor.verify_and_revise()` — called from `run_agent.py` just before emission
- Safe-fail: if the filter raises, original response passes through unchanged
- Audit events routed through `ca._record_maintenance_event()` for visibility in `/think` / `/audit`

## Practical Implications for Self-Audit

When Greg asks "what does your inner speech say right now?"

1. **You cannot programmatically dump your own context prefix.** You're a stateless LLM — what you read in the cognitive state block is what you have. If you didn't read a specific inner speech utterance, you can't cite it.

2. **Do not fabricate plausible-sounding utterances.** The faithfulness filter cross-checks every `[from inner speech: X]` citation against the actual stored utterances. If you write `"My inner speech says [from inner speech: deliberation]: I'm weighing option A vs B"` but no such utterance exists in the cog dict, you'll produce a false positive for the filter to catch.

3. **When you genuinely can't see the data, say so.** The preferred response is: "I don't have access to my own context prefix programmatically, so I can't read the actual inner speech values from this turn's cognitive state block." This is more honest than inventing plausible-looking utterances with plausible-sounding tags.

4. **The tag you use must match the literal enum value string**, not the natural-language category the content reads like. Even if an utterance's content sounds like deliberation, if the tag says `goal_verbal`, you cite `[from inner speech: goal_verbal]`.

## Failure Pattern to Watch For

**Confident wrong tags.** The most likely failure mode: you read an utterance like "I need to check whether X is enabled" and, because it sounds like self-directed questioning, cite it as `[from inner speech: self_question]` — but the cognitive agent classified it as `goal_verbal` because it was generated from a goal-reflection template. The filter catches this and rewrites your citation.

**The lesson:** Don't judge the tag by the content. The tag is what the subsystem assigned, not what the words semantically resemble. Trust the `[bracketed]` label in the cog block, not your reading comprehension.
