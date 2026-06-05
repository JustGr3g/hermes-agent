---
name: deterministic-process-definitions
description: "Build Python-coded workflow definitions (Process classes) as an alternative to prompt-defined cron jobs. Processes have explicit steps that CANNOT be skipped, quality gates as real assertions, conditional branching as real control flow, and replayable step logging."
version: 1.0.0
author: Athena
license: MIT
platforms: [macos, linux, windows]
metadata:
  hermes:
    tags: [process, workflow, automation, cron, reliability]
    related_skills: [external-tool-evaluation, writing-plans, hermes-agent]
---

# Deterministic Process Definitions

## Trigger

Use this when:
- A recurring workflow produces fabrication errors (hallucinated claims, skipped steps, wrong numbers)
- A prompt-defined cron job's output quality is measured as unreliable (verify_script finds issues >2× in a row)
- You need conditional branching or quality gates that actual code logic provides but prompt instructions don't enforce
- A workflow is complex enough that "remember to do X" in a prompt keeps failing

**Do NOT use when:**
- The workflow is simple and reliable as a prompt (measure first — don't over-engineer)
- The workflow needs to change rapidly (code changes require commit & deploy; prompt changes are just edit-and-save)
- The workflow is a one-off (processes are for recurring patterns)

## Architecture

```
processes/
├── __init__.py          # Package init
├── registry.py          # Process base class, ProcessContext, ProcessRegistry
├── daily_summary.py     # Example: DailySummaryProcess
├── goal_retriage.py     # (future) Goal retriage process
└── self_model.py        # (future) Self-model generation process
```

### Key classes

- **Process** (ABC) — Subclass defines `run(inputs, ctx)` with explicit steps
- **ProcessContext** — Logging, step recording (`ctx.record_step()`), timing (`ctx.elapsed()`)
- **ProcessResult** — Status (ok/with_issues/failed), output string, step list, error string
- **ProcessRegistry** — Singleton; `register(cls)`, `run(name, inputs)`, `list()`

### Two execution modes

1. **Cron mode** — injected `generate_fn` wraps the warm AIAgent. No subprocess overhead.
2. **Standalone mode** — runs `hermes chat -q` via subprocess. No AIAgent dependency.

## Workflow

### Step 1: Identify the right workflow

Look for cron jobs that:
- Have `verify_script` configured (existing quality concerns) [from M1: daily summary with verify_summary_numbers.py]
- Have a history of fabrication in output [from M2: self-reporting fabrication failure ENG-2026-0528-001]
- Have complex branching logic that keeps getting wrong in prompt form [from M2: goal retriage suspend/deprioritize logic]

### Step 2: Create the process module

```python
# processes/my_process.py
from processes.registry import Process, ProcessContext, ProcessResult, process_registry

class MyProcess(Process):
    name = "my_process"
    version = "1.0.0"
    description = "..."

    def run(self, inputs: dict, ctx: ProcessContext) -> ProcessResult:
        # Step 1: Gather data
        data = self._step_one(inputs)
        ctx.record_step("step_one", "gather", "ok", ...)

        # Step 2: Process
        result = self._step_two(data)
        ctx.record_step("step_two", "process", "ok", ...)

        # Step 3: Verify (quality gate)
        if not self._verify(result):
            # Remediate
            ...
            return ProcessResult(status="with_issues", output=..., error=...)

        return ProcessResult(status="ok", output=result)

# Auto-register
process_registry.register(MyProcess)
```

### Step 3: Wire into cron scheduler

In `cron/scheduler.py` `_run_job_impl`, add a short-circuit BEFORE the AIAgent construction block:

```python
_process_name = (job.get("process") or "").strip()
if _process_name:
    # Import process modules
    from processes.registry import process_registry
    import processes.my_process  # triggers registration

    _process_inputs = {
        "prompt": prompt,
        # ... map job fields to process inputs
    }
    _process_result = process_registry.run(_process_name, _process_inputs)

    if _process_result.status == "failed":
        raise RuntimeError(_process_result.error)

    # Format output with step-by-step results
    return True, formatted_output, _process_result.output, None
```

### Step 4: Update job config

Add `"process": "my_process"` to the cron job in `cron/jobs.json`.

### Step 5: Create inline tool

Create `tools/run_process.py` so the agent can invoke processes inline during sessions:

```python
registry.register(
    name="run_process",
    toolset="skills",  # or core tools in _HERMES_CORE_TOOLS
    schema={...},
    handler=_handle_run_process,
    ...
)
```

Add to `_HERMES_CORE_TOOLS` in `toolsets.py` if it should be always available.

### CognitiveProcess — wrapping CognitiveAgent handlers as Processes

When an Athena cognitive-layer function (heartbeat handler, self-model generator, goal retriage) needs a Process wrapper, use `CognitiveProcess` from `processes.cognitive_base`:

```python
# processes/cognitive_goal_retriage.py
from processes.cognitive_base import CognitiveProcess, process_registry

class CognitiveGoalRetriageProcess(CognitiveProcess):
    name = "cognitive_goal_retriage"
    handler_fn_name = "cognitive_agent.repair.goal_retriage.retriage_suspended_goals"

process_registry.register(CognitiveGoalRetriageProcess)
```

**Key rules:**
- The CognitiveAgent instance passes in `inputs["_cognitive_agent"]` — required
- All non-underscore-prefixed inputs are forwarded as kwargs to the handler
- The handler is lazy-imported by dotted path on first `run()` call
- Handler return values (dicts) become JSON-serialized output

**Import path works** because `hermes/` is a subdirectory of `~/cognitive-agent/`. `CognitiveProcessor` at `hermes/agent/cognitive_processor.py:252` already does `from cognitive_agent.cognition.perception import PerceptionPipeline` — the reverse direction of the same cross-repo path. No `sys.path` manipulation needed.

**For self-model generation specifically**, use `CognitiveSelfModelProcess` which wraps `once_handlers.build_self_model()` with an additional verify→remediate gate:

```python
result = process_registry.run("cognitive_self_model", {
    "_cognitive_agent": agent,
    "verify_script": "verify_self_model.py",
    "max_verify_retries": 2,
})
```

The process:
1. Generates narrative via the existing handler (stores to DB)
2. Reads back the narrative text
3. Runs `verify_self_model.py` checking for fabricated goal IDs, count claims, capability claims
4. If issues found, re-generates (max 2 retries)
5. Returns ProcessResult with verification metadata

**CognitiveProcess — wrapping CognitiveAgent handlers**

When a workflow lives in Athena's cognitive layer (`cognitive_agent/`) but needs Process audit trails or verify gates, don't move the code — wrap it with `CognitiveProcess`:

```python
from processes.cognitive_base import CognitiveProcess, process_registry

class CognitiveGoalRetriageProcess(CognitiveProcess):
    name = "cognitive_goal_retriage"
    handler_fn_name = "cognitive_agent.repair.goal_retriage.retriage_suspended_goals"

process_registry.register(CognitiveGoalRetriageProcess)
```

**Key rules:**
- The CognitiveAgent instance passes in `inputs["_cognitive_agent"]` — required
- All non-underscore-prefixed inputs forward as kwargs to the handler
- The handler is lazy-imported by dotted path on first `run()` call — no import-time coupling
- Handler return values (dicts) become JSON-serialized ProcessResult output
- **The import path works** because `hermes/` is a subdirectory of `~/cognitive-agent/`. `CognitiveProcessor` at `hermes/agent/cognitive_processor.py:252` already does `from cognitive_agent.cognition.perception import PerceptionPipeline` — the reverse direction of the same cross-repo path. No `sys.path` manipulation needed.

**For self-model generation with verification gates specifically**, use `CognitiveSelfModelProcess` (processes/cognitive_self_model.py) which wraps `once_handlers.build_self_model()`:

```python
result = process_registry.run("cognitive_self_model", {
    "_cognitive_agent": agent,
    "verify_script": "verify_self_model.py",
    "max_verify_retries": 2,
})
```

The process: generate narrative → read back from DB → verify claims (goal IDs, count claims, capability claims) → remediate if issues found (max 2 retries) → return with verification metadata.

**Heartbeat handler wiring pattern** (for connecting cognitive handlers to the process registry):

```python
def _handler_name():
    _outcome = None
    try:
        from hermes.processes.registry import process_registry
        import hermes.processes.cognitive_self_model  # noqa: F401 — trigger registration

        _result = process_registry.run("cognitive_self_model", {
            "_cognitive_agent": agent,
        })
        if _result.status in ("ok", "with_issues"):
            _outcome = json.loads(_result.output)
    except Exception:
        logger.debug("process registry unavailable (non-fatal)", exc_info=True)

    if _outcome is None:
        # Fallback: direct call (pre-Phase 4 behaviour) — fail-open
        _outcome = agent._original_handler()

    if _outcome.get("stored"):
        agent._record_maintenance_event("event_name", _outcome)
```

**Fail-open discipline:** Every process registry call from a cognitive handler must have a try/except with a fallback to the original direct call. The process registry is an enhancement, not a dependency — the cognitive cycle must keep running if the import path is wrong or the module isn't installed.

## Two execution modes

1. **Cron mode** — injected `generate_fn` wraps the warm AIAgent. The process is invoked from `_run_job_impl` before the AIAgent is constructed. No subprocess overhead.
2. **Standalone mode** — runs `hermes chat -q` via subprocess. Used only when no AIAgent is available (e.g. from `run_process` tool during a session).

## Pitfalls

- **Don't forget the enablement chain.** A process needs ALL of: registry import → process module (register) → scheduler short-circuit → job config → optional tool. One missing link = silent failure (process `not found`).
- **Don't keep the old verifier loop.** When a process takes over a cron job, remove the duplicate verify+remediate logic that might still live in `_run_job_impl` or `_process_job`. The process handles this itself. [from Babysitter Phase 1: stale duplicate at scheduler.py ~2024]
- **Keep the verify→remediate loop inside the process.** Don't rely on external wrapping — the process is the authority on its own quality gates. External verify scripts should be invoked BY the process, not wrapped around it.
- **Prefer cron mode over standalone mode.** Cron mode reuses the warm AIAgent (fast, no subprocess). Standalone mode spawns `hermes chat -q` (slow, needs PATH). Only use standalone for testing/debug.
- **Process names must match the `name` field on the class.** The registry key is `cls.name`, not the module name or filename.

## References

- `external-tool-evaluation:references/babysitter-implementation-detail.md` — Full implementation specifics from the Babysitter patterns (2026-05-30)
- `cron/scheduler.py` — see `_run_job_impl` for the process short-circuit pattern
- `processes/registry.py` — Process base class and registry
- `processes/daily_summary.py` — Complete working example
- `tools/run_process.py` — Inline invocation tool
