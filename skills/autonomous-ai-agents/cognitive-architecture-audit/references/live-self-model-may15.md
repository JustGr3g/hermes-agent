# Live Self-Model Implementation (May 15, 2026)

Three additions implementing Growth Roadmap item #4 — Live Self-Model.

## Part A: Mid-turn introspection tool (`introspect`)

**New file:** `hermes/tools/cognitive_introspection_tool.py` (150 lines)

- Registers `introspect` in the Hermes registry (toolset: `cognition`, emoji: 🧠)
- Zero-arg call returns structured JSON: confidence, WM load, failure rate, frustration, curiosity, active goals, metacognitive signals, inner speech winner, tool success rates, narrative self-model excerpt
- Uses module-level `_current_cog_instance` pattern (same as `model_tools._last_resolved_tool_names`)
- Wired in `run_agent.py:1083` via `set_current_cog(self._cog)` after CognitiveProcessor init

### Schema

```python
INTROSPECT_SCHEMA = {
    "name": "introspect",
    "description": "Query your own cognitive state mid-turn. Returns a structured snapshot...",
    "parameters": {"type": "object", "properties": {}, "required": []},
}
```

### Pattern for tool modules needing agent state

```python
# cognitive_introspection_tool.py
_current_cog_instance: Any = None

def set_current_cog(cog) -> None:
    global _current_cog_instance
    _current_cog_instance = cog

def get_current_cog():
    return _current_cog_instance

def introspect_tool(args: dict, **kwargs) -> str:
    cog = _current_cog_instance
    if cog is None:
        return json.dumps({"available": False, "reason": "ATHENA cognitive systems not attached."})
    state = cog.cognitive_state
    ...
```

### Wiring in run_agent.py

```python
self._cog = cognitive_processor
try:
    from tools.cognitive_introspection_tool import set_current_cog
    set_current_cog(self._cog)
except Exception:
    logger.debug("[ATHENA] Could not wire introspection tool", exc_info=True)
```

## Part B: Self-model in system prompt block

**Patch** to `hermes/agent/cognitive_processor.py` `get_system_prompt_block()` (line 1139):

After tool track record, reads `get_latest_self_model()` from `athena_memory.db` and appends:
```
Latest self-model (my own reflection on who I am):
  "{content excerpt (200 chars)}"
```

Fail-open: if DB isn't available or no self-model exists, continues silently.

## Part C: `/state` slash command

**Two patches:**

1. `hermes_cli/commands.py` — added CommandDef:
```python
CommandDef("state", "Show ATHENA cognitive state snapshot", "Info",
           aliases=("cog",)),
```

2. `cli.py` — added `_handle_state_command()` (40 lines): reads from `_current_cog_instance`, prints Rich-formatted panel with confidence, WM load, failure rate, frustration, curiosity, turn count, signals, goals, inner speech, tool track record.

## Tests: `hermes/tests/tools/test_cognitive_introspection.py` (9 tests)

All pass. Covers: no cog -> available=False, cog raises -> available=False, valid state -> structured keys, empty state -> available=False, set/get roundtrip, schema validity, registry registration.
