# Tool-Selection Pipeline Shadow Mode — 2026-06-03

## Decision

Flipped `athena_pipeline_enabled` from `"off"` → `"shadow"` in `cognitive_agent.db` runtime_flags.

## Parallel Flags

Both the tool-selection pipeline and the compose-resolution pipeline use the same `off`/`shadow`/`live` pattern. As of 2026-06-03 14:07 PDT:

| Runtime flag | Mode | Purpose |
|---|---|---|
| `athena_pipeline_enabled` | **shadow** (just flipped) | Replaces legacy `augmented_target → tool_dispatcher.resolve` with Deliberate/Execute/Simulate pipeline |
| `athena_compose_resolution` | shadow (flipped 2026-06-02) | Grounded synthesis deliverable for no-tool goals |

## Architecture

`athena_pipeline_enabled` is defined at `cognitive_agent/cognition/deliberate.py:48-49`:
```python
PIPELINE_FLAG = "athena_pipeline_enabled"
PIPELINE_MODES = ("off", "shadow", "live")
```

Resolution via `pipeline_mode(agent)` at `deliberate.py:569-579` — reads runtime flag, defaults to `"off"` if unset or invalid.

### What happens per mode

| Mode | Self-driven (cognitive cycle) | User-driven (agent.py) | Behavior |
|---|---|---|---|
| `off` | Legacy `augmented_target → _resolve_tool_call` | Legacy `tool_dispatcher.resolve` | No pipeline involvement |
| `shadow` | Legacy dispatches, pipeline runs alongside | Legacy dispatches, pipeline runs alongside | Logs `MATCH` or `DIFFER` verdict per call |
| `live` | `_pipeline_resolve_self` is primary | `_pipeline_resolve_user` is primary | Legacy path is dead code until P7 removal |

### Wire points

- **Self-driven:** `cognitive_cycle.py:1197-1215` — checks `pipeline_mode(ag)`, dispatches to `_pipeline_resolve_self()` or legacy, runs shadow comparison
- **User-driven:** `agent.py:3412-3452` — `resolve_tool_call()` checks mode, routes to `_pipeline_resolve_user()` for live, or runs pipeline + legacy in shadow

### Shadow logging format

```
pipeline_shadow_self verdict=MATCH legacy=opencode_edit shadow=opencode_edit source=self
pipeline_shadow_user verdict=DIFFER legacy=web_search shadow=web_fetch source=user
```

Each line includes the source tag (`self` or `user`) and the tool name from each path.

## What the pipeline includes

1. **Deliberate** (`cognitive_agent/cognition/deliberate.py`): `Deliberator.deliberate()` — receives `DeliberationInput` (goal, drive state, self-model, outcomes, tools), returns an `Intention` with action_kind (`tool_call`/`wait`/`complete`/`abandon`)
2. **Simulation gate** (`cognitive_agent/cognition/simulate.py`): `simulate_and_gate()` — P4 predictive simulation, first veto → re-deliberate with reason, second veto → suspend goal
3. **Execute** (`cognitive_agent/cognition/execute_stage.py`): `Executor.execute()` — fills args on a tool_call intention using a structured LLM call (temperature 0.2, max 400 tokens); args pass through P1 sanitizer
4. **P5 drive coupling** (optional, gated by `athena_drive_coupling` flag): biases tool selection toward the current drive's natural tool family when need > 0.7

## How to inspect

```bash
# View pipeline shadow diffs from agent logs
grep "pipeline_shadow" ~/.hermes/logs/agent.log | tail -30

# Count MATCH vs DIFFER ratios
grep "pipeline_shadow" ~/.hermes/logs/agent.log | grep -o "verdict=[^ ]*" | sort | uniq -c
```

## Graduation path (as of 2026-06-03 per conversation with Greg)

1. ~~`shadow` for calibration~~ ✅ done 2026-06-03 14:07 PDT
2. `live` after sufficient shadow data is reviewed — pipeline becomes primary tool-selection path
3. `athena_compose_resolution` → `live` after it (composition goals get grounded deliverables)
4. P7: delete legacy `augmented_target` path after `live` has been stable ≥7 days

## Considerations before flipping to live

- **Selection divergence:** shadow diffs will show where the pipeline disagrees with legacy. Review `DIFFER` cases before live. Some may be improvements (pipeline picks a better tool), some may be regressions.
- **Model cost:** each `live` tool-selection call adds 2 LLM calls (Deliberate + Execute) per resolution. Shadow doubles this (pipeline runs alongside legacy). Watch token usage during the shadow window.
- **Tool availability:** The tool-selection pipeline uses `SELF_DRIVEN_TOOL_DEFAULT_FILTER` (cognitive_cycle.py:2069) as its tool allowlist for self-driven mode. If a tool is missing from this list, the pipeline will never select it even if the legacy path would have.
- **Recency of tests:** 46 pipeline-related tests pass (test_deliberate.py, test_drive_coupling.py, test_pipeline_integration.py, test_simulate.py, test_self_model_v2.py). No test covers the full shadow-mode end-to-end path yet.