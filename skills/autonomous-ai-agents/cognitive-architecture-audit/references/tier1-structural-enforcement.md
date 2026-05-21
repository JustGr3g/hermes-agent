# Tier 1 — Structural Enforcement (May 14, 2026)

## What was built

Code-level tool gating triggered by cognitive branching flags. Previously the 5 flags (`_low_conf_narrowed`, `_wm_overloaded`, `_high_frustration`, `_high_failure_rate`, `_repeated_failure`) only generated advisory text. Now they physically strip tools from `self.tools`.

## The Two Methods (added to `run_agent.py`)

### `_apply_cognitive_tool_filter()`

Starts from `_unfiltered_tools` baseline (saved at `__init__`), applies filters additively:

| Condition | Tools stripped |
|-----------|---------------|
| `_repeated_failure` OR `_wm_overloaded` | `write_file`, `patch`, `terminal`, `code_execution`, `save_note`, `send_message` |
| `_high_frustration` | `terminal`, `code_execution` (additionally — already stripped if above) |

`_low_conf_narrowed` and `_high_failure_rate` remain advisory-only (no tool stripping).

### `_restore_unfiltered_tools()`

Copies `_unfiltered_tools` back into `self.tools`. Called when the branching check finds no active flags.

## Flow

1. Branching block evaluates cognitive_state signals
2. If any flag active → set advisory string → call `_apply_cognitive_tool_filter()`
3. If no flags active → clear advisory → call `_restore_unfiltered_tools()`
4. Next API call uses the (possibly filtered) tool schemas
5. On the NEXT branching pass: if distress passed, tools come back

## Safety

- Always starts from `_unfiltered_tools` — no state accumulation across turns
- Exception handler restores full set on any error
- `_unfiltered_tools` is initialized as empty list if `self.tools` is None
- All tool name lookups use `.get("function", {}).get("name")` — schema-safe

## Test results

All 10 branching tests passed (no regressions from the advisory-only implementation).