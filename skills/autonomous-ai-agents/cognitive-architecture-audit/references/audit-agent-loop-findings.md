# Agent Loop Audit Findings (May 12, 2026)

**Source:** run_agent.py (~14,111 lines), agent/cognitive_processor.py (~1,031 lines)

## Architecture

```
User message → run_conversation()
  │
  ├─ Reset per-turn retry counters & budget
  ├─ Preflight connection health check + context compression
  ├─ Build/inject system prompt (cached, rebuilt on compression)
  ├─ Inject ATHENA cog state via augment_message()
  │
  └─ MAIN LOOP (while budget OR grace_call remain)
       │
       ├─ Check interrupt → break
       ├─ Check wall-clock cap → break
       ├─ Check budget → break if exhausted
       ├─ API call: LLM(messages + tool schemas + cog block)
       ├─ Has tool_calls?
       │    ├─ YES → _execute_tool_calls() → record_result()
       │    └─ NO  → final_response, break
       │
       └─ verify_and_revise() → record_completion() → return
```

## Key Gaps

| # | Gap | Line Ref | Severity |
|---|-----|----------|----------|
| 1 | No runtime self-model — loop never asks "how am I doing?" | 10655+ | P0 |
| 2 | No goal-directed loop exit — terminates on budget/interrupt/LLM-choice | 10655 cond | P0 |
| 3 | All tool results treated uniformly regardless of success/failure | 9212-9248 | P1 |
| 4 | Memory extraction is trigger-based (turn count), not signal-driven | 10411-10421 | P1 |
| 5 | Gateway creates fresh AIAgent per message → cognitive state loss | 10387 comment | P0 |
| 6 | Context compression destroys continuity (new session ID + summary) | 9048-9210 | P1 |
| 7 | No self-directed learning — agent never asks "what did I just learn?" | entire loop | P2 |

## ATHENA Integration Points

| Method | Called When | Purpose |
|--------|-------------|---------|
| `augment_message()` | Before each LLM call (line 10855) | Runs 8-system cognitive cycle, injects state block into user message |
| `record_result()` | After each tool cycle (line 13261) | Stores episode in episodic memory, updates metacognition |
| `verify_and_revise()` | Before response emission (line 13838) | FaithfulnessFilter — checks response claims vs cog state |
| `record_completion()` | After turn ends (line 13847) | Final episode, inner speech summary, motivation update |

**Critical architectural insight:** The ATHENA cognitive state block is sent TO the LLM as part of the user message, but the agent loop NEVER reads it. The loop can't branch on "confidence is low, narrow tool options" because it has no access to the cognitive state it helped generate. This is the central disconnect between Hermes (the dispatch loop) and Athena (the cognitive wrapper).

## Key Line References

- `_build_system_prompt`: line 4885 — 7-layer system prompt assembly
- Main loop: line 10655 — `while (api_call_count < self.max_iterations and self.iteration_budget.remaining > 0) or self._budget_grace_call`
- Wall-clock cap: line 10671-10681 — from cognitive_agent tunables
- Context compression: line 9048-9210 — splits session, creates new session_id
- Tool execution: line 9212-9248 — _execute_tool_calls
- `DEFAULT_AGENT_IDENTITY`: agent/prompt_builder.py line 134 — 2-sentence hardcoded identity
- load_soul_md(): agent/prompt_builder.py line 1296 — loads SOUL.md from HERMES_HOME
