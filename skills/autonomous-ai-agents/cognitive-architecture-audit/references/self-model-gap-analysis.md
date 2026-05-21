# Self-Model Gap Analysis — May 12, 2026

## Finding: No Runtime Self-Model

The agent has a **textual identity** injected into the system prompt, but **no programmatic self-model** accessible at runtime.

### Textual Identity (What exists)

- **`DEFAULT_AGENT_IDENTITY`** (agent/prompt_builder.py, line 134) — 2 sentences: "You are Hermes Agent, an intelligent AI assistant created by Nous Research..."
- **SOUL.md** (fallback at `~/.hermes/SOUL.md` loaded via `load_soul_md()` in prompt_builder.py, line 1296) — loaded if present, else DEFAULT_AGENT_IDENTITY
- **Memory blocks** (memory + user profile) injected as text at system prompt build time
- **Skills guidance** injected as text
- **Timestamp line** with model/provider/session info

All of these are **static at build time** — frozen once per session, cached on `self._cached_system_prompt`, only rebuilt after context compression events. The agent sees them as text, same as any other prompt text.

### What's Missing

No code path exists where the agent can introspect its own cognitive state at runtime:

| Capability | Current State | Evidence |
|---|---|---|
| Know active goals | Via text in context (not programmatic) | No `get_active_goals()` method on AIAgent |
| Know confidence level | Not tracked at the agent loop level | No confidence field on AIAgent |
| Know which subsystems are active | Static text from system prompt | No runtime subsystem registry |
| Monitor own token consumption | Rough estimate in context compressor | `estimate_tokens_rough()` but not accessible to agent |
| Evaluate own tool calls | Not evaluated | No post-hoc tool outcome evaluation |
| Measure time since last event | Not tracked | `_turns_since_memory` exists but only used for nudge logic |

### Why This Matters

An agent without a runtime self-model cannot:
- Reason about its own cognitive state ("I'm confused about X, let me re-read")
- Calibrate confidence ("I'm uncertain about this answer, I should verify")
- Make strategic tool choices ("I've been trying this approach for 3 turns and failing, switch strategy")
- Persist cognition across contexts ("Before compression, I was deciding between A and B")

This is arguably the single biggest architectural gap between current behavior and genuine agency.

### The Core Loop Doesn't Help

The main loop (run_agent.py line 10655):
```python
while (api_call_count < self.max_iterations and self.iteration_budget.remaining > 0) or self._budget_grace_call:
    # Check interrupt, check wall-clock cap, consume budget, call API, process tools
```

The loop checks only:
- External interrupt requests
- Wall-clock cap (via tunables)
- Iteration budget

It **never** checks the agent's own cognitive state. There is no:
- "Am I making progress on this goal?" check
- "Should I change my approach?" branch
- "What have I learned from the last N tool calls?" reflection point

### Context Compression Worsens It

`_compress_context()` (line 9048):
1. Summarises middle of conversation
2. Creates new session ID
3. Invalidates and rebuilds system prompt
4. The agent continues on the summary

The original reasoning chain is gone. Any in-progress metacognition ("I was thinking X") is summarised away unless the summariser happened to capture it. The agent never knows what it doesn't remember.

## What a Self-Model Would Look Like

A minimal self-model would be a serializable object that:
1. Exists as an instance variable on AIAgent (e.g., `self._self_model`)
2. Is updated after every tool call and API response
3. Contains: active goals (from context), confidence per claim, tool success rates, turn count, tokens consumed, time elapsed
4. Is accessible to the agent via a tool or system prompt injection

In the limit, this becomes an internal "cognitive scratchpad" that persists across turns and survives compression — allowing the agent to know what it was doing even after context rotation.

## Related Code Locations

| File | Lines | Purpose |
|---|---|---|
| agent/prompt_builder.py | 134-142 | DEFAULT_AGENT_IDENTITY definition |
| agent/prompt_builder.py | 1296-1317 | load_soul_md() — SOUL.md loading |
| run_agent.py | 4885-5070 | _build_system_prompt() — system prompt assembly |
| run_agent.py | 10267-10717 | run_conversation() — the core loop |
| run_agent.py | 9048-9210 | _compress_context() — context compression |
| run_agent.py | 10655-10701 | The main loop — budget/interrupt/wall-clock checks only |
| hermes_state.py | full | SessionDB — SQLite storage for sessions |
| agent/ | directory | Memory, caching, prompt builder, contexts |
