# Audit: Tool Dispatch & Agency

**Date:** 2026-05-12
**Source:** Manual code reading of model_tools.py, toolsets.py, tools/registry.py
**Honesty level:** Critical

---

## 1. Tool Discovery Flow

```
tools/registry.py: ToolRegistry class (singleton via module-level `registry`)
  │
  ├─ Each tool file in tools/*.py calls `registry.register()` at import time
  │    └─ Registers: name, toolset, schema (JSON), handler (callable), check_fn (availability gate), is_async
  │
  ├─ discover_builtin_tools() → scans tools/*.py for registry.register() calls, imports them
  │    └─ Uses AST inspection to find register calls (avoids importing files that don't register)
  │    └─ Skip list: __init__.py, registry.py, mcp_tool.py
  │
  └─ get_definitions(tools_to_include, quiet) → returns schemas for toolset-filtered + check_fn-passed tools
       ├─ Filters by toolset membership (enabled_toolsets / disabled_toolsets)
       ├─ Runs check_fn for each tool (availability gate: env vars, binary existence, etc.)
       └─ Returns OpenAI-format tool schemas: [{"type": "function", "function": {name, description, parameters}}]
```

**Critical detail:** Tool schemas are baked into the API call at the START of each turn and stay static throughout the agent loop. The LLM sees all available tools every iteration.

## 2. Dispatch Mechanics

```
LLM responds with tool_calls → run_agent.py _execute_tool_calls()
  │
  ├─ _should_parallelize_tool_batch(tool_calls) → decides concurrent vs sequential
  │    └─ Read-only tools always parallel; file tools parallel if paths don't overlap
  │
  ├─ handle_function_call(name, args, task_id)
  │    ├─ coerce_tool_args() → type coercion ("42" → 42)
  │    ├─ Check _AGENT_LOOP_TOOLS → reject (must be handled by agent loop, not model_tools)
  │    ├─ pre_tool_call hook → plugin block check (can block a tool call)
  │    ├─ registry.dispatch(name, args) → calls the registered handler
  │    ├─ post_tool_call hook → plugin observation
  │    ├─ transform_tool_result hook → plugin result rewriting
  │    └─ Returns result string (JSON)
  │
  └─ Result appended to messages as {"role": "tool", "tool_call_id": id, "content": result}
```

**Agent loop integration (run_agent.py line 10717+):**
- After _execute_tool_calls(), the loop iterates again
- The LLM sees all prior messages + new tool results
- If the LLM produces more tool_calls, they're dispatched
- If the LLM produces a response without tool_calls, the loop exits

## 3. Agency Analysis: Does the LLM *Choose* Tools or Pattern-Match?

**Arguments for "chooses":**
- The LLM sees the full tool schema with descriptions and parameter constraints
- Tool descriptions are rich enough to distinguish similar tools
- The LLM can decide to stop calling tools and produce a final response

**Arguments for "pattern-matches":**
- The LLM is primed by the last N assistant messages. If the last 3 turns all used `web_search`, the LLM is more likely to reach for `web_search` again regardless of whether it's the right tool.
- Tool descriptions are static strings — the LLM has no feedback about tool *quality* or *cost* from previous calls (except what's visible in the tool result text)
- There's no utility function guiding tool selection. The LLM doesn't ask "which tool would be most efficient?" — it asks "which tool matches the current string pattern?"
- The agent loop itself has zero tool selection logic. All intelligence about *which* tool to call lives in the LLM's pattern-matching. The agent code just dispatches whatever the LLM requests.

## 4. Tool Selection Biases

| Bias | Source | Effect |
|------|--------|--------|
| Recency | LLM context window | Tools used in recent assistant messages are more likely to be chosen again |
| Description length | Schema design | Tools with longer/more specific descriptions get better matching |
| First-in-list | Schema ordering | Tools listed first in the tool array may be preferred (positional bias varies by model) |
| Name similarity | LLM tokenization | `web_search` and `web_extract` are more likely to co-occur than `web_search` and `delegate_task` |
| Result feedback | Conversation history | A tool that previously returned "error" is not explicitly avoided — the LLM might try it again |

## 5. Concrete Gaps (with references)

**Gap 1 — No tool success/failure tracking (model_tools.py line 699–838)**
handle_function_call() returns errors as JSON {"error": msg} but the agent loop treats ALL tool results identically. A crashed tool and a successful tool look the same to the loop controller. The LLM can infer failure from content, but the agent never explicitly tracks "tool X failed, don't retry."

**Gap 2 — No cost-aware tool selection (toolsets.py line 31–70)**
All tools are equal in cost to the agent — web_search ($0.001/call) and delegate_task ($0.10/call) are presented identically. The LLM has no visibility into the cost implications of its tool choices.

**Gap 3 — No tool usage history (model_tools.py, run_agent.py loop)**
The agent doesn't maintain a tool call history accessible to the LLM beyond what's in the conversation messages. A 50-iteration tool turn means the LLM must search 50+ tool result messages to find "did I already call web_search for this query?" This wastes context on duplicate work.

**Gap 4 — No agency at the loop level (run_agent.py line 10655)**
The loop is a pure dispatch engine: call LLM → dispatch tools → loop. There's no branching logic that says "if the last 3 tool calls all returned errors, try a different strategy" or "if we've been in the loop for 20 iterations and haven't made progress, ask the user." The LLM *is* the agency — the loop just provides the budget.

**Gap 5 — No parallel strategy (run_agent.py line 9224)**
_should_parallelize_tool_batch() makes a crude heuristic decision based on tool read/write characteristics. The LLM doesn't choose parallelism — the agent's rule engine decides based on tool type. This isn't agency, it's fixed logic.

**Gap 6 — No tool scheduling or sequencing (entire dispatch path)**
The LLM emits tool calls in whatever order it produces them in a single response. The agent doesn't reorder, sequence, or schedule them based on dependencies. If the LLM emits web_search and write_file in the same batch, both run concurrently even though the write might depend on the search result.
