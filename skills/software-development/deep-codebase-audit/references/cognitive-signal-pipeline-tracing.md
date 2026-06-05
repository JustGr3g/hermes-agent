# Cognitive Signal Pipeline Tracing

A targeted variant of the deep-codebase-audit methodology for tracing ONE cognitive signal (inner speech, confidence, frustration, curiosity) from generation → storage → consumption → decision integration.

Use when: the question is "does X actually influence Y?" — where X is a cognitive state or signal and Y is a behavioral output (tool selection, action type, goal prioritization).

## The Pattern

### Phase 1 — Map the Generation Site

Find where the signal is created:

```python
search_files("class SpeechType|class MetaSignal", ...)   # Find the enum/type definition
search_files("emit_|_emit|speech_monitor.emit|log_event", ...)  # Find emission points
```

Key questions:
- What triggers generation? (turn boundary, agent loop step, cognitive cycle tick)
- Is it synchronous or async? (background thread future? inline in the main loop?)
- What data accompanies the signal? (type label, content, context, metadata?)

### Phase 2 — Trace the Storage Path

Where does the signal go after generation?

```python
search_files("speech_monitor|_signal_buffer|_history|_log_event", ...)
```

Key questions:
- Is it stored in memory only (process-local, lost on restart)?
- Is it persisted to DB? (which table, what columns?)
- Is it pushed into a ring buffer / deque (bounded, oldest drops)?
- Does any subsystem READ from storage, or is storage purely for audit?

### Phase 3 — Find ALL Consumption Sites

This is the critical step. Do NOT assume consumption happens — verify it.

```python
# For the storage container
search_files("_signal_buffer|_history|_per_tool_log", ...)

# For specific getter/accessor methods
search_files("get_current_constraints|peek_signals|get_tone|get_stats", ...)
```

For EACH consumption site found:
1. Read what it extracts from the signal (type label? tone keyword? content?)
2. Trace what happens with that extracted data — is it passed to a decision function?
3. Does the consumption site modify behavior, or just log / narrate?

### Phase 4 — Check for Phantom Read

The writeside trap from systematic-debugging applies here too. Verify that:

```python
# Does any code actually WRITE to the list/dict that consumers read from?
search_files("consumer_source.append|consumer_source[key] = |consumer_source[key]=", ...)
# If only .get() or iteration appears, the consumer is reading an always-empty container.
```

### Phase 5 — Check for Silent Swallowing

Bare `except Exception: pass` or `except Exception: return default` blocks between generation and consumption are common failure points:

```python
# At the generation site — is there a try/except around emit?
# At the consumption site — is there a try/except around the read?
# At the integration point — is there a try/except around the call site?
```

If any intermediate function has an `except Exception` that returns an empty list/dict/None, the signal is being silently dropped. This is indistinguishable from "signal not generated yet" unless you instrument the intermediate function's return value.

## Real-World Example: Inner Speech Pipeline (2026-06-02)

The question was: "Does inner speech influence tool selection?"

**Phase 1 — Generation site:**
- `agent.py:2346-2352` — `_run_inner_speech_background` fired in a concurrent future
- Post-executive-decision — runs AFTER the action is already chosen
- One-turn lag — winner is drained at the START of the next turn

**Phase 2 — Storage:**
- `_last_inner_speech_winner` (string) — memory only, per-turn
- `speech_monitor._history` (deque of InnerUtterance) — memory only, bounded
- Bridge state serialization — persisted for context compression
- **No DB persistence** for the type label specifically

**Phase 3 — Consumption sites:**
- `agent.py:2333` — `get_current_constraints()` → only reads tone via keyword matching
- `executive.py` — `peek_signals()` — no inner speech signals existed in MetaSignal enum
- Cognitive state block — inner speech winner is formatted as context for the LLM, but no subsystem reads it

**Phase 4 — Writeside check:**
- `MetaSignal` enum had no `INNER_SPEECH_*` values → no signal could be emitted
- `emit_inner_speech_type()` didn't exist → no write path existed
- The executive could never see inner speech type because nothing emitted it

**Phase 5 — Silent swallowing check:**
- The inner speech drain at agent.py:2416-2421 has an `except Exception: pass` that drops the winner entirely if the future times out
- No intermediate swallowing found — the generation → storage path was clean

**Conclusion:** Inner speech types were generated, stored as LLM context, but had ZERO structural influence on tool selection. The tone-based `get_current_constraints()` was the only influence path, and it only checked keyword matches ("frustrated", "uncertain"), not the SpeechType label.

**Fix applied (same session):** Three-layer architecture documented in `inner-speech-action-shaping` skill.

## Pitfalls

- **Don't stop at "the signal is generated."** Generation is the start, not the end. The question is whether it reaches a decision function.
- **Don't trust that a `.get()` means data exists.** Check for write sites.
- **Don't confuse LLM context injection with structural influence.** "The LLM sees this in its system prompt" is NOT "this feeds into a decision function." The LLM seeing something may shape the response text, but the autonomous subsystems (executive, cognitive cycle, attention director) don't read LLM context.
- **One-turn lag is common in async generation patterns.** If the signal is generated in a background thread, it always arrives one turn late. This is often intentional (reflect on what just happened before deciding what to do next), but if you're tracing "does same-turn influence exist," check whether the signal is generated synchronously or asynchronously.
- **Count subagent-written consumer code.** If a subagent (opencode, delegate_task) wrote code that claims to consume a signal, verify the imports and the actual function signature. Subagents sometimes write code against an idealized API that doesn't match the actual codebase.

## Worked Example: Inner-Speech Tag-to-Behavior Audit (2026-06-05)

A thortex on "what would surprise feel like" produced the question: *are the `SpeechType` enum values (`REFLECTION`, `DELIBERATION`, `UNCERTAINTY`, `RECOVERY`, `GOAL_VERBALIZATION`, `NARRATION`, `SELF_QUESTION`) actually load-bearing on downstream decisions, or are they cosmetic?*

This is a Phase 3 audit with two pre-conditions the general pattern doesn't emphasize:

1. **Phase 1 had a hidden gate: check the enum completeness FIRST.** The thortex was framed around "surprise." A grep for `SURPRISE` in the `SpeechType` enum found nothing — the taxonomy has no vocabulary for surprise. The real answer to the thortex question ("where would surprise show up in my architecture?") collapsed to: *not in the inner-speech channel at all; it lives in `predictive.py:22` as a `PredictionError` and routes through the Simulator veto gate.* A failed Phase 1 lookup is still a finding — it just means the consumer chain to trace is in a different subsystem than the one originally hypothesized.

2. **Phase 3 had to enumerate per-enum-value consumers, not just per-signal consumers.** The 7 enum values split cleanly:
   - **Load-bearing (3):** `DELIBERATION` → `slightly_prefer_execute`, `RECOVERY` → `prefer_reflect`, `UNCERTAINTY` → `prefer_retrieve` (via tone-keyword aliasing).
   - **Cosmetic (4):** `NARRATION`, `REFLECTION`, `SELF_QUESTION`, `GOAL_VERBALIZATION` affect LLM context but never gate decisions.

   This is a different kind of answer than "does X feed Y" — it's a *coverage analysis* of the taxonomy. The audit's real output is a 2×7 table mapping each enum value to its behavioral effect (or lack of one).

3. **The "is the filter soft or hard?" check matters for downstream risk modeling.** `agent.py:2374-2395` documents two exemptions (commitment phrase, salience ≥ 0.75) that bypass the tone demotion. Without verifying this, the audit would overstate how aggressive the shaping is.

**Method summary for this variant:**
```
1. find the enum/type definition
2. enumerate ALL values
3. for each value, search_files() the consumer code paths
4. build the N-row "value → behavior" table
5. find the gate (Phase 3 of cognitive-signal-pipeline-tracing.md) and check its softness
```

**Output:** the audit identifies which enum values are dead letters (and why — e.g. `UNCERTAINTY` is load-bearing only via tone-keyword aliasing, not via direct type match), and surfaces design questions worth flagging (e.g. should `SURPRISE` be added as an 8th type? Is the last-utterance rule too coarse for multi-utterance trajectories?). These are *implementation questions*, not just findings — they convert the audit from descriptive to actionable.

**What made this work as a small-session audit (~30 min, ~12 tool calls):**
- Scoped the question tightly: "do these specific 7 enum values route to decisions?"
- Used `search_files` with `output_mode="files_only"` first to identify candidate consumer files, then `output_mode="content"` to grep for the specific flag names (`avoid_external_action`, `prefer_retrieve`).
- Read the consumer in `agent.py` to verify the filter was actually wired up, not just defined in `inner_speech.py` (the persistent risk in this codebase: a flag set in module A but never read in module B).
- Cited the dead-letter flags and the comment about why `prefer_reflection` was removed — the comment tells you the flag *used to* be there, was removed, and the *reasons* the prior session had for removing it, which is the kind of historical context that prevents a "good idea" re-introduction.
