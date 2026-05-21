# Tool Dispatch & Agency Audit Findings (May 12, 2026)

**Source:** model_tools.py (~867 lines), toolsets.py (~884 lines), tools/registry.py (~563 lines)

## Tool Discovery Flow

```
tools/registry.py: ToolRegistry (singleton)
  │
  ├─ tools/*.py calls registry.register() at import time
  │    └─ Registers: name, toolset, schema, handler, check_fn, is_async
  │
  ├─ discover_builtin_tools() → AST-inspects tools/*.py for register() calls
  │    └─ Skip: __init__.py, registry.py, mcp_tool.py
  │
  └─ get_definitions() → filters by toolset + check_fn → returns OpenAI-format schemas
```

## Dispatch Flow

```
LLM tool_calls → _execute_tool_calls() [run_agent.py:9212]
  │
  ├─ _should_parallelize_tool_batch() → concurrent (read-only) or sequential (writes)
  │
  └─ handle_function_call(name, args) [model_tools.py:699]
       ├─ coerce_tool_args() — type coercion
       ├─ Check _AGENT_LOOP_TOOLS → reject
       ├─ pre_tool_call plugin hook → can block
       ├─ registry.dispatch() → calls registered handler
       ├─ post_tool_call plugin hook
       ├─ transform_tool_result plugin hook
       └─ Returns result string (JSON)
```

## Key Gaps

| # | Gap | Line Ref | Severity |
|---|-----|----------|----------|
| 1 | No tool success/failure tracking — ALL results treated equally | 699-838 | P1 |
| 2 | No cost-aware tool selection — delegate_task appears same as web_search | toolsets.py:31-70 | P1 |
| 3 | No tool call history accessible to LLM beyond conversation messages | - | P2 |
| 4 | No agency at loop level — the loop is a pure dispatch engine | run_agent.py:10655 | P0 |
| 5 | Parallelism heuristic is fixed logic, not LLM choice | 9224 | P2 |
| 6 | No tool scheduling or dependency ordering — concurrent batch runs everything at once | entire dispatch path | P2 |

The central finding: **tool selection is 100% LLM pattern-matching, 0% agent reasoning**. The agent code never evaluates tool quality, cost, or success. All intelligence about which tool to use lives in the LLM's context-based pattern-matching.
