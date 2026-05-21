# Audit: Core Agent Loop (run_agent.py)

**Date:** 2026-05-12
**Source:** Manual code reading, lines 4885–11100+
**Honesty level:** Critical

---

## 1. Message Flow

```
User message → run_conversation()
  │
  ├─ Reset per-turn state (retry counters, budget, interrupt flags)
  ├─ Preflight connection health check (stale TCP cleanup)
  ├─ Preflight context compression (if history exceeds threshold_tokens)
  │    └─ _compress_context() — splits SQLite session, creates new session_id
  ├─ Build/inject system prompt (cached, rebuilt only on compression)
  ├─ Inject plugin context (pre_llm_call hook)
  │
  └─ MAIN LOOP (while budget OR grace_call remain)
       │
       ├─ Check interrupt_requested → break
       ├─ Check wall-clock cap → break
       ├─ Consume iteration budget → break if exhausted
       │
       ├─ API call: client.chat.completions.create(messages, tools)
       │    └─ system_prompt + conversation_history + tool_schemas → LLM
       │
       ├─ Response has tool_calls?
       │    ├─ YES → _execute_tool_calls()
       │    │    ├─ _should_parallelize_tool_batch() → concurrent or sequential
       │    │    ├─ Handle each toolcall: handle_function_call(name, args)
       │    │    └─ Append result to messages
       │    │    └─ [ATHENA] record_result() → episodic/associative/metacognition
       │    └─ NO  → final_response, break loop
       │
       └─ Loop back
  │
  └─ Post-loop:
       ├─ [ATHENA] verify_and_revise() → FaithfulnessFilter
       ├─ [ATHENA] record_completion() → episodic/inner speech/motivation
       ├─ Memory sync (if memory nudge interval hit)
       └─ Save session state to SQLite
```

## 2. State Lifecycle

**Per-turn (reset in run_conversation, line 10335–10347):**
- `_invalid_tool_retries`, `_invalid_json_retries`, `_empty_content_retries`, `_incomplete_scratchpad_retries`
- `_codex_incomplete_retries`, `_thinking_prefill_retries`, `_post_tool_empty_retried`
- `_last_content_with_tools`, `_last_content_tools_all_housekeeping`, `_mute_post_response`
- `iteration_budget` (fresh IterationBudget each turn)

**Per-session (lives across turns in CLI mode):**
- `_cached_system_prompt` — stable unless compression invalidates it
- `_memory_store` — built-in memory provider state (file-backed engrams)
- `_turns_since_memory`, `_iters_since_skill` — persistent across turns (line 10368–10370)
- `_interrupt_requested` — set externally, checked at top of each loop iteration
- Session DB connection — SQLite file persists across sessions

**Per-conversation-turn (what a gateway agent sees):**
- Gateway creates FRESH AIAgent per message (line 10387–10391 comment: _hydrate_todo_store recovers from history)
- Most state is lost between gateway messages except what's in session DB

## 3. Budget / Interrupt / Grace Mechanics

| Mechanism | Line | Behavior |
|-----------|------|----------|
| `max_iterations` | 10655 | Hard cap on API calls per turn (default 90) |
| `iteration_budget.consume()` | 10697 | Consumes from budget; loop exits when `remaining == 0` |
| `_budget_grace_call` | 10692–10701 | One extra API call after budget exhaustion; consumed immediately |
| `_interrupt_requested` | 10659–10665 | User sent new message mid-turn; breaks with `interrupted = True` |
| Wall-clock cap | 10671–10681 | `max_response_seconds` from cognitive_agent tunables; breaks if exceeded |
| `compression_attempts` | — | Multiple compression passes (line 10520: up to 3 passes preflight) |

**Critical gap:** These are all **reactive** safety mechanisms, not agentic cognitive state. The agent doesn't *decide* to stop because it's satisfied — it stops because a counter hit zero or a signal arrived.

## 4. Reasoning Analysis: Where is the agent actually thinking vs. pattern-matching?

**Where genuine structure exists:**
- System prompt assembly (line 4885–5070): 7-layer composition with conditional injection per tool availability
- Context compression (line 9048–9210): Uses an aux model to summarize, splits sessions, notifies memory providers
- The ATHENA CognitiveProcessor.augment_message() (line 122–603): Runs a full 8-system cognitive cycle BEFORE the API call, then prepends the cognitive state block as a "scaffold" for the LLM's response

**Where pattern-matching dominates:**
- The MAIN LOOP (line 10655–): No branching based on response quality. Every tool call result is treated equally — no "that result was bad, try differently" logic at the agent level
- Tool selection is entirely LLM-driven: the model sees the tool schema and pattern-matches from context. No agent-level reasoning about which tool to call
- Response is whatever the LLM produces — the FaithfulnessFilter (line 689–766) is the only cross-check, and it only verifies claims against the cognitive state block, not against the actual conversation

## 5. Concrete Gaps (with line references)

**Gap 1 — No runtime self-model (line 10655 loop body)**
The loop checks budget and interrupts but never asks "how am I doing?". There's no introspection point where the agent evaluates its own reasoning quality mid-turn. The ATHENA cognitive state block (cognitive_processor.py line 575) is prepended to the USER message — it informs the LLM, but the agent loop never reads it.

**Gap 2 — No goal-directed loop exit (line 10655 condition)**
Loop terminates on budget exhaustion, interrupt, wall-clock cap, or the LLM producing a non-tool-call response. It never terminates because "the task is complete to satisfaction." The LLM decides when to stop producing tools; the agent has no independent goal-satisfaction check.

**Gap 3 — Tool results treated uniformly (line 9212–9248)**
All tool results are appended to messages regardless of success/failure. Error results get logged but don't change the agent's strategy. A failed tool call and a successful one look identical to the loop — it just runs the next iteration.

**Gap 4 — Memory extraction is trigger-based, not continuous (line 10411–10421)**
Memory review is triggered by `_memory_nudge_interval` (turn count threshold). There's no signal-driven extraction — the agent doesn't independently decide "this was important, save it" mid-conversation. It relies on the turn count timer.

**Gap 5 — Gateway state loss (fresh AIAgent per message, line 10387 comment)**
Every gateway message creates a new AIAgent. Todo state is recovered from conversation history (`_hydrate_todo_store`). Memory state is loaded from disk. But ephemeral cognitive state (inner speech arc, working memory contents) is lost between turns. The ATHENA cognitive cycle runs fresh each turn.

**Gap 6 — Compression destroys continuity (line 9048–9210)**
Context compression creates a NEW session ID, summarizes messages, and continues on the summary. This is equivalent to short-term memory loss — everything before the compression boundary is reduced to a paragraph. The LLM doesn't "remember" the earlier conversation; it reads a summary. After 3+ compressions, the model warns accuracy may degrade (line 9180–9185).

**Gap 7 — No self-directed learning (entire loop)**
The agent never asks "what did I just learn?" or updates its own behavior based on outcomes. The ATHENA metacognition system *does* record retrieval quality (cognitive_processor.py line 669–685), but this doesn't loop back to change agent behavior in the same session.
