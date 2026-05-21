# Continuous Experience — Item #3 Implementation

**Date:** 2026-05-14
**Status:** Complete ✅ (7 tests: 1 new file + heartbeat handler + method)

## What was built

A heartbeat handler that keeps Athena's inner speech alive during idle periods so the bridge state carries temporal continuity when the user returns.

## Key files

- `cognitive_agent/agent.py` — `_generate_idle_thought()` method (lines 2517-2620) + `idle_think` handler registration (lines 1108-1132)
- `cognitive_agent/heartbeat.py` — existing `HeartbeatScheduler` (unchanged)
- `tests/cognition/test_idle_think.py` — 6 tests (new file)

## Architecture

```
HeartbeatScheduler tick (60s)
  └─ idle_think handler (only_when_idle=True, idle_threshold_sec=120)
       └─ _generate_idle_thought()
            ├─ reads _last_user_activity_at → computes idle_min
            ├─ checks speech_monitor for recent idle_think → skip if <60s old
            ├─ scans episodic for last user/proactive episode → topic context
            ├─ builds template: "I've been idle for 12 minutes..."
            ├─ emits InnerUtterance(context="idle_think") to speech_monitor
            └─ stores Episode(source_kind=self, idle_think="1")
```

## Design decisions

- **No LLM calls** — deterministic templates only. Prevents cost accumulation during idle periods.
- **Self-limiting** — skips if last idle thought was <60s ago, returns `False` (defer) so heartbeat doesn't advance last_run
- **Topic-aware** — reads last 2h of episodes for user/proactive content to include in the thought
- **Low importance** (0.15) — idle thoughts are background noise in episodic memory
- **Tagged** `idle_think="1"` in emotional_tags — queryable via `get_by_tags({"idle_think": "1"})`

## Bridge state interaction

The inner speech is emitted to `InnerSpeechMonitor`, which feeds into the bridge state serialization. When the user returns after idle, the next turn's `[ATHENA COGNITIVE STATE]` block includes the idle thought as the most recent inner speech arc entry — giving continuity across the gap.

## Key patterns for future implementation of Items #4, #2, #1, #5, #6

1. Add a method to CognitiveAgent first, register it as a heartbeat handler second
2. Use `_record_maintenance_event()` for visibility in /think and telemetry
3. Return `False` from handlers to defer (don't advance last_run, retry next tick)
4. Tag episodes with emotional_tags for `get_by_tags()` queryability
5. Test with the existing `agent` conftest fixture — use `_last_user_activity_at` manipulation
