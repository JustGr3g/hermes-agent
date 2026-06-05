# Phase 4: The Two-Layer Bridge — Implementation Plan

> **Goal:** Unify Hermes's deterministic process registry (`hermes/processes/`) with Athena's autonomous cognitive cycle (`cognitive_agent/cognition/` and `cognitive_agent/heartbeat_handlers.py`), so process step audit trails, verification gates, and quality loops are visible to BOTH layers.

**Date:** 2026-05-30

## Architecture Context

Two agent layers exist, connected through `CognitiveProcessor`:

```
                   Athena ← → Hermes
                   (cognitive)  (conversation)
                         │
                   CognitiveProcessor /
                   RemoteCognitiveProcessor
                    (augment_message /
                     record_result /
                     record_completion)
```

**Direction A (Athena → Hermes):** ✅ Working. `augment_message()` calls `ca.run()` to inject the cognitive state block into every user-facing LLM call.

**Direction B (Hermes → Athena):** ✅ Working. `record_result/completion` push tool outcomes into Athena's episodic + associative memory.

**Direction C (Process registry → Cognitive cycle):** ❌ Not bridged. The 25 heartbeat handlers in `heartbeat_handlers.py` call functions directly (`repair.goal_retriage.retriage_suspended_goals()`, `self_model.build_self_model_prompt()`). Hermes's process registry has no visibility into these runs.

**Direction D (Cognitive cycle → Process registry):** ❌ Not bridged. The `run_process` tool is only available inside Hermes's conversation loop. Cognitive cycle cannot invoke processes.

## Three-Tier Approach

| Tier | Direction | What it bridges | Effort | Value |
|------|-----------|----------------|--------|-------|
| 1 | C: Registry → cycle | Wire heartbeat handlers through process registry | 2 files, ~50 lines | Step audit trails from existing maintenance loops |
| 2 | D: Cycle → Registry | Allow cognitive cycle to invoke processes | 1 file, ~30 lines | Verify→remediate on self-model generation |
| 3 | Both | Write process steps to Athena's episodic memory | 1 file, ~40 lines | Cross-reference queryable audit trail |

---

## Tier 1: Registry → Cognitive Cycle (Days 1-2)

**What changes:** Two heartbeat handlers in `cognitive_agent/heartbeat_handlers.py` currently call modules directly. Change them to call `process_registry.run()` so every run produces a step-audit trail visible in Hermes logs.

### Handler 1: Goal Retriage

**Current (line ~72 of heartbeat_handlers.py, inside register_default_heartbeat_handlers):**
```python
def _maintenance_goal_retriage():
    try:
        from cognitive_agent.repair.goal_retriage import retriage_suspended_goals
        result = retriage_suspended_goals(agent.motivation,
                                          tool_outcomes_db=agent._db_path,
                                          apply=True)
        ...
```

**New:**
```python
def _maintenance_goal_retriage():
    try:
        from hermes.processes.registry import process_registry
        import processes.repair.goal_retriage  # future thin process wrapper
        # For now: wrap the result as a process step
        from processes.registry import ProcessContext
        ctx = ProcessContext("goal_retriage", f"tick_{int(time.time())}")
        
        from cognitive_agent.repair.goal_retriage import retriage_suspended_goals
        result = retriage_suspended_goals(agent.motivation,
                                          tool_outcomes_db=agent._db_path,
                                          apply=True)
        
        ctx.record_step("classify_suspended", "gather", "ok", duration_ms=0,
                        summary=f"{result.get('total', 0)} goals: "
                                f"{result.get('retried', 0)} retried, "
                                f"{result.get('abandoned', 0)} abandoned, "
                                f"{result.get('reviewed', 0)} reviewed")
        ...
```

**The wrapper is intentionally thin** — I said in my earlier analysis that adding a full Process subclass for goal_retriage would be ceremony. The handler wrapper just records the step after the fact. This gives you the audit trail without duplicating the logic.

### Handler 2: Self-Model

**Current:**
```python
def _maintenance_self_model():
    from cognitive_agent import self_model as self_model_mod
    prompt = self_model_mod.build_self_model_prompt(...)
    # ... generate via LLM ...
    self_model_mod.store_self_model(...)
```

**New:** Same thin-wrapper pattern — wrap the existing call in a `ProcessContext.record_step()` call so the step appears in the process audit trail.

### Handler 3: Value-Drift Monitor (weekly)

Same pattern. Wraps the existing `self_model_mod.check_and_notify_value_drift()` call.

### Verification

After changes:
```python
from hermes.processes.registry import process_registry
print(process_registry.list())
# Should show: daily_summary (existing), goal_retriage, self_model, value_drift
```

Run the handler manually:
```python
_maintenance_goal_retriage()  # Should produce step-0 entries
```

---

## Tier 2: Cycle → Registry (Days 3-4)

**What changes:** `cognitive_agent/cognition/cognitive_cycle.py`'s `tick()` method currently delegates goal steps to an LLM-based selector. When the current goal matches a process-worthy workflow, tick() can call `process_registry.run()` instead.

### The self-model use case

When the cognitive cycle resolves a self-model generation goal (triggered by the `athena_self_model_v2` flag), instead of calling `build_self_model_prompt()` → LLM → `store_self_model()` directly, tick() calls:

```python
from hermes.processes.registry import process_registry
result = process_registry.run("self_model", {
    "agent": agent,
    "flag": "athena_self_model_v2",
})
```

This gives the self-model the **same verify→remediate loop** that now protects the daily summary (Phase 1), catching fabrication in the narrative before it's stored.

### Implementation

Add a `PROCESS_MAP` in cognitive_cycle.py that maps goal/flag patterns to process names:

```python
# When to delegate to process_registry instead of the LLM selector
_PROCESS_GATES = {
    "self_model": {
        "flag": "athena_self_model_v2",
        "process": "self_model",
        "priority": 0,
    },
    "goal_retriage": {
        "handler": "_maintenance_goal_retriage",
        "process": "goal_retriage",
        "priority": 1,
    },
}
```

In `tick()`, before the LLM selector:
```python
for name, gate in _PROCESS_GATES.items():
    if self._process_gate_triggered(gate):
        result = process_registry.run(name, {"agent": self._agent})
        if result.status == "failed":
            # Fall through to LLM selector as safety net
            continue
        return result.output
```

### Verification

- Set `athena_self_model_v2 = True`
- Run a tick while no other goal is pending
- Check `self_models` table for new entry with verified narrative
- Query `episodes` for `source_kind = "process"`

---

## Tier 3: Unified Audit Trail (Days 5-6)

**What changes:** ProcessContext.step results get written to Athena's episodic memory as structured episodes.

### Implementation

In `ProcessContext.record_step()`, after recording the step locally, also write to Athena's DB:

```python
def record_step(self, name, kind, status, duration_ms,
                summary="", output=""):
    self.steps.append(ProcessStepResult(...))
    
    # Also record in Athena's episodic memory (if available)
    try:
        from cognitive_agent.memory.episodic import Episode, store_episode
        episode = Episode(
            source="self",
            source_kind="process",
            summary=f"[{self.process_name}] {name}: {status} ({duration_ms}ms)",
            content={
                "process_name": self.process_name,
                "run_id": self.run_id,
                "step_name": name,
                "step_kind": kind,
                "status": status,
                "duration_ms": duration_ms,
                "summary": summary,
            },
        )
        store_episode(episode)
    except ImportError:
        pass  # Running standalone without cognitive agent
```

This means every verify→remediate attempt, fact-gathering step, and remediation pass becomes queryable via `recall_memory` with `source_kind="process"`.

### Verification

```python
# Query via recall_memory
result = recall_memory(query="process verification",
                       source_kind="process",
                       limit=5)
# Should return: [{process_name: "daily_summary", step_name: "verify_claims", status: "failed", ...}]
```

---

## Files Touched (All Tiers)

| File | Change | Tier |
|------|--------|------|
| `cognitive_agent/heartbeat_handlers.py` | Wrap 3 handlers with ProcessContext.record_step() | 1 |
| `hermes/processes/registry.py` | Add optional episodic-memory recording to ProcessContext | 3 |
| `cognitive_agent/cognition/cognitive_cycle.py` | Add PROCESS_MAP + process delegation in tick() | 2 |
| `cognitive_agent/self_model.py` | (Optionally) Add verify→remediate after generation | 2 |

**No new files.** Tier 1 and Tier 3 are purely additive changes to existing files. Tier 2 adds a decision gate to `tick()` but doesn't change the LLM selector — processes are a higher-priority alternative path, not a replacement.

---

## What We Deliberately Skip

| Idea | Why skip |
|------|----------|
| Create Process subclasses for goal_retriage and self_model | Pure ceremony — they're already code, not prompts. The thin handler wrapper gives you the audit trail without duplicating logic |
| Full two-way tool sharing between Hermes and Athena | Different tool registries with different shapes. Large refactor with unclear benefit |
| Move goal_retriage into hermes/processes/ | Cross-repo import dependency that doesn't exist today |
| Rewrite self_model as a Hermes Process | Same. The LLM call is already wrapped in deterministic Python. The verify→remediate loop can be added as a function call, not a Process subclass |

---

## Phase 4 complete, the conversation can move to implementation.

**Recommended start: Tier 1, Handler 1 (goal retriage).** Smallest change, highest confidence — 1 file, ~15 lines added. Then Tier 3 (episodic recording) before Tier 2, because Tier 3 gives you the observability to verify Tier 2 worked.
