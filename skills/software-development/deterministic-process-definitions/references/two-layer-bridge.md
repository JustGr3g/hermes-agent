# Phase 4 Architecture: The Two-Layer Bridge

## Architecture

Two agent layers share the same process tree at `~/cognitive-agent/`:

| Layer | Entry point | What it owns | Location |
|---|---|---|---|
| **Athena** (cognitive) | `CognitiveAgent` in `agent.py` | 8-system cognitive pipeline, `CognitiveCycle.tick()` (between-turn, 3min cadence), 25 heartbeat maintenance handlers (consolidation, goal retriage, self-model, staleness, value drift, vault scan, auto-fetch) | `~/cognitive-agent/cognitive_agent/` |
| **Hermes** (conversation) | `AIAgent` in `run_agent.py` | User-facing conversation loop, tool system, cron scheduler, process registry, plugins, compression | `~/cognitive-agent/hermes/` |

## The bridge

`CognitiveProcessor` / `RemoteCognitiveProcessor` (~1538 lines) injects Athena's cognitive state into Hermes's LLM calls via `augment_message()`. It's one-directional — Hermes reads Athena's state, but Athena's heartbeat handlers never invoke Hermes processes.

## Cross-repo import path

`hermes/` is a **subdirectory** of `~/cognitive-agent/`. Python's `sys.path` resolution means modules in `hermes/` can import from `cognitive_agent.*` and vice versa. Already proven by `cognitive_processor.py:252` which does:

```python
from cognitive_agent.cognition.perception import PerceptionPipeline
```

No `sys.path` manipulation, no symlinks, no install hooks. The same path works in reverse for Hermes processes importing from `cognitive_agent.*`.

## Current gaps (Phase 4)

1. **Self-model has no verify→remediate gate** — `_build_self_model()` generates a narrative via LLM every 6h with zero verification. Same fabrication risk as the daily summary before Phase 1. Fixed by `CognitiveSelfModelProcess` in `hermes/processes/cognitive_self_model.py`.

2. **Goal retriage drops per-goal decisions** — `retriage_suspended_goals()` computes `RetriageDecision` per goal then collapses them to `{"retried": 2}`. Step audit trails lost. A `CognitiveGoalRetriageProcess` wrapper would record each decision.

3. **No cross-layer scheduling** — The cron system and heartbeat system are independent. The daily summary cron can't trigger self-model regeneration. A post-step in `DailySummaryProcess` would fix this.

## Future directions

- **Tier 3 wiring:** Heartbeat handlers call `process_registry.run()` instead of importing modules directly. Fail-open fallback handles import failures.
- **Episodic audit trail:** Every ProcessRecord step written to Athena's episodic memory as `source_kind="process"` so recall_memory queries can discover process outcomes.
