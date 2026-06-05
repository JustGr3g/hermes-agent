# Pre-Flight Tool Parameter Verification

## When to Use

When the SelfImprovementLoop flags `tool_selection` as a focus area, or when you observe a pattern of tool calls failing due to bad parameters (missing required fields, wrong enum values, nonexistent paths). Apply this pattern BEFORE the tool dispatches — catch errors at the call site, not in error handlers.

## The Pattern

A `pre_tool_call` hook that validates parameters against the tool's registered JSON Schema **before** the dispatch layer runs. The validator returns a block message when parameters are invalid, short-circuiting the tool entirely and saving a failed call + retry cycle.

### Three Validation Layers

```
Call site → 1. Required-param completeness → 2. Enum correctness → 3. Path sanity → Dispatch
```

**Layer 1 — Required-Param Completeness**

Check every field in the schema's `required` list. Reject when:
- The field is absent from `function_args` entirely
- The value is a sentinel: `""`, `None`, `"None"`, `"null"`, `"undefined"`
- The value is `None` (Python None, not the string)

```python
_REQUIRED_SENTINELS = {"", None, "None", "null", "undefined"}
for rp in required_params:
    if rp not in function_args:
        return block_message(f"required parameter `{rp}` not provided")
    val = function_args[rp]
    if isinstance(val, str) and val.strip().lower() in _REQUIRED_SENTINELS:
        return block_message(f"required parameter `{rp}` has no usable value")
```

**Layer 2 — Enum Value Correctness**

For each argument whose schema declares an `enum` constraint, check the value against the allowed set. LLMs frequently produce near-miss values (whitespace, case mismatch, synonyms) that the schema won't accept.

```python
enum_vals = prop.get("enum")
if not enum_vals or not isinstance(value, str):
    continue
if value not in enum_vals:
    return block_message(f"`{function_name}.{key}` got `{value}`, must be one of: {enum_vals}")
```

**Layer 3 — Path Sanity**

For path-sensitive tools (`read_file`, `write_file`, `search_files`, `terminal`, `vision_analyze`), check that the referenced path exists — unless the tool is intended to create it (`write_file`).

```python
_PATH_TOOLS = {"read_file", "write_file", "patch", "search_files", "terminal", "vision_analyze"}
if function_name in _PATH_TOOLS:
    path_val = _get_path_arg(function_name, function_args)
    if path_val is not None:
        path_obj = Path(path_val).expanduser().resolve()
        if function_name != "write_file" and not path_obj.exists():
            return block_message(f"path `{path_val}` does not exist (resolved: {path_obj})")
```

### Integration Point

The validator plugs into the `pre_tool_call` hook pipeline in `model_tools.py`, just before `registry.dispatch()`. Same hook point used for ACP edit approval and plugin blocks — a `block_message` return short-circuits the tool.

```python
# In handle_function_call(), after coercion but before dispatch:
block_msg = validate_tool_call(function_name, function_args)
if block_msg is not None:
    return block_msg  # short-circuit — no dispatch
```

## Implementation Reference

**File:** `tools/tool_prevalidation.py` (Athena codebase) or `~/.hermes/plugins/<name>/__init__.py` (plugin route)

The module exposes a single function:
```python
def validate_tool_call(function_name: str, function_args: dict) -> Optional[str]:
```

Returns `None` for "good to proceed" or a human-readable block message string for "rejected."

## Prevention, Not Debugging

This pattern is about *preventing* tool errors from happening in the first place. It complements but is distinct from the debugging patterns in the parent skill:

| Pattern | When | What |
|---------|------|------|
| Pre-flight validation | Before dispatch | Catch bad params, short-circuit |
| Post-hoc debugging | After error | Find root cause, fix permanently |
| Claim verification | After deploy | Verify running code matches intent |

All three work together: pre-validation reduces error frequency, claim verification catches deployment drift, and systematic debugging fixes what slips through.

## Real Instance

May 30, 2026 — SelfImprovementLoop flagged `tool_selection` focus area: "Reduce tool failure rate: verify tool parameters before calling." Built `tools/tool_prevalidation.py` with the three-layer pattern. Ready to wire into `model_tools.py` pre_tool_call hook.
