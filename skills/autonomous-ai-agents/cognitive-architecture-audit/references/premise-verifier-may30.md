# PremiseVerifier — Concrete-Reference Probe Gate

**Source:** `cognitive_agent/cognition/premise_verifier.py`
**Created:** 2026-05-30
**Wired into:** `GoalDecomposer.decompose()` (goal_decomposer.py, subtask-creation loop)

## What It Is

A stateless verifier that scans generated subtask text for concrete artifact references
(file paths, tool names, named artifacts) and checks whether they actually exist in the
current environment *before* the subtask is committed. Subtasks with failed probes are
marked `BLOCKED` instead of `PENDING`, preventing the phantom-artifact failure loop
documented in [ENG-2026-0520-008].

## Design

**Intentional scope:** The verifier only blocks *concrete references* — specific file
paths, tool names, named artifacts. Generic vagueness like "research existing solutions"
passes through by design. The [ENG-2026-0520-008] failure was a concrete phantom
artifact ("Claude Code review dry-run findings"), not vagueness. Precision instrument,
not vagueness detector.

**Pattern:** Verify → Remediate gating loop (Babysitter Pattern 1):
1. Extract concrete references from subtask text via regex
2. Probe each reference against environment (filesystem stat, tool registry)
3. If a reference fails, mark subtask BLOCKED with verification-failure note
4. Feedback loop: blocked subtasks are visible to the cycle's `next_subtask` property
   (which already filters BLOCKED), and the goal's frustration_threshold surfaces
   the pattern

## Probe Patterns

| Pattern | Regex trigger | What it checks |
|---------|--------------|----------------|
| Verb+file_path | `read/check/review/inspect … path.ext` | `os.path.isfile()` |
| Preposition+path | `in/from/at/to … path.ext` | `os.path.isfile()` |
| Tool reference | `the tool/API/function … name` | `registry.get_entry(name)` |
| Artifact reference | `the plan/note/result from …` | recall_fn (callback — not yet wired) |

Dedup: results keyed on `pattern:reference` to avoid double-reporting when both
verb and prepositional patterns catch the same path.

## Wiring Point

In `GoalDecomposer.decompose()`, after `Subtask(...)` is created but before it's
appended to the subtask list:

```python
try:
    from cognitive_agent.cognition.premise_verifier import verify_subtask_blocking
    should_block, _evidence = verify_subtask_blocking(st_content, goal_content)
    if should_block:
        st.status = MilestoneStatus.BLOCKED
        fail_refs = [e["reference"] for e in _evidence if not e["exists"]]
        st.notes = f"Premise verification failed: references {fail_refs} ..."
except ImportError:
    pass  # premise_verifier not available (tests, bootstrap)
```

## Test Results (2026-05-30)

| Subtask pattern | Result |
|----------------|--------|
| "Review the analysis in /tmp/phantom_report.txt" → `os.path.isfile()` = False | 6/7 subtasks BLOCKED ✓ |
| "Research existing solutions for: Build confidence..." → no concrete refs | 0/7 blocked (passes) ✓ |
| "Review /Users/.../cognitive_cycle.py" → `os.path.isfile()` = True | 0 blocked ✓ |

## What's NOT Wired Yet

- **recall_fn callback** — artifact references (named entities not on filesystem)
  currently always probe-fail because no recall callback is passed. This is acceptable
  because artifact references from the proposer (e.g. "the plan from goal X") are rare
  and the BLOCKED subtask is a softer failure than the 8-retrieval-attempt loop it
  replaces.
- **No stat/probe for the proposer itself** — the verifier fires at decompose time,
  not at proposal time. The proposer can still generate phantom premise goals; they're
  just caught one step earlier than before.

## Future Direction

The natural next step is a **premise verifier hook in the goal proposer**, so that
goals referencing nonexistent artifacts are refused at proposal time rather than at
decomposition time. This would close the loop fully: proposer → premise check →
proposer reframes → decomposer receives validated premises.


## Extension: Runtime Dependency Re-Probe (M1)

**Date:** 2026-05-30
**Code:** `DecompositionPlan.compute_next_actionable()` in goal_decomposer.py
**Wired into:** `CognitiveCycle._tick_locked()` at line 708, after plan/milestone
resolution, before attempt-ceiling gate.

### What It Does

`next_subtask` checks status flags set at decomposition time — but the world may
change between decomposition and execution tick N. `compute_next_actionable()` is a
second gate that re-probes the environment *at dispatch time* for every candidate
subtask. If a referenced file was deleted or restructured, the subtask is stamped
BLOCKED with a runtime explanation and skipped.

### Key difference from the creation-time gate

| Gate | When | What it catches | Attempt cost |
|------|------|----------------|--------------|
| `PremiseVerifier` in `decompose()` | Creation | Phantom refs in goal text | None — never attempted |
| `compute_next_actionable()` in tick | Dispatch | Stale refs (deleted between decomposition and execution) | None — returns `runtime_dep_blocked` without `record_attempt()` |

### Tick hook behavior

```python
if plan_id:
    plan = decomp.get_plan(goal.id)
    if plan and isinstance(plan, DecompositionPlan):
        actionable = plan.compute_next_actionable(
            retrieval=getattr(ag, "retrieval", None),
        )
        if actionable is None:
            # All candidates blocked at runtime. Skip without burning attempt.
            self._record_synth_outcome(ag, goal.id, "runtime_dep_blocked", ...)
            return self._mk_skipped("runtime_dep_blocked", goal=goal, ...)
```

The hook fires **before** Gate 2b (attempt ceiling, line 708), so a blocked subtask
doesn't consume attempt budget. The goal exhausts naturally via `MAX_GOAL_ATTEMPTS`
(12 ticks of no-op) instead of 8 wasted retrieval tool calls.

### Test results

| Scenario | `next_subtask` | `compute_next_actionable` |
|----------|---------------|-------------------------|
| Phantom file (never existed) | First pending subtask | None — all blocked at runtime ✓ |
| Generic research (no refs) | First pending subtask | First pending subtask ✓ |
| File existed at creation, deleted by dispatch | First pending subtask | None — newly blocked at runtime ✓ |

## Extension: Goal-Level Transaction Lifecycle (M3)

**Date:** 2026-05-30
**Code:** `PlanTransaction` + `SubtaskAttempt` dataclasses in goal_decomposer.py

### What It Is

A lightweight transactional wrapper around a goal's multi-step execution. Not
persisted to DB — lives alongside `DecompositionPlan` in memory during the
cycle's lifetime.

### Dataclasses

```python
@dataclass
class SubtaskAttempt:
    subtask_id: str
    content: str
    tool_name: str
    success: bool
    timestamp: float
    compensation_note: str  # idempotent "undo" hint (note_id, file_path)

@dataclass
class PlanTransaction:
    plan_id: str
    goal_id: str
    status: str  # active | compensating | completed | abandoned
    subtask_log: list[SubtaskAttempt]
    compensated: list[str]
    started_at: float
    completed_at: Optional[float]
```

### Compensation Stack

- `record_attempt()` appends every subtask execution to a log
- `compensation_stack` property returns **successful** attempts in reverse order
  (failures left no side-effects that need undoing)
- `begin_compensation()` transitions status to `compensating` and generates a
  structured audit summary listing everything done and what would need rollback

### Design principle — audit, not automatic rollback

The compensation stack is structured for *human review*, not automatic undo.
`compensation_note` carries idempotent hints (e.g. note_id for `save_note`,
file_path for `opencode_edit`) so a compensation phase can inform rather than
assume. Automatic rollback of autonomous actions is a future capability that
should remain gated by Greg until the system has demonstrated reliable
self-correction.

### Integration Audit (2026-05-31 — Three Gaps, Not Two)

Live investigation found the `PlanTransaction` integration has **three gaps**, not two:

**Gap 1 (hidden) — `_transactions` dict is never populated.**  
`CognitiveCycle.__init__()` declares `self._transactions: dict[str, PlanTransaction] = {}`  
at line 376. The M4a block at line 1089 reads `self._transactions.get(goal.id)` which  
always returns `None`. The entire record_attempt() path is dead code. Fix: create a  
`PlanTransaction` when `compute_next_actionable()` returns a subtask, capturing `plan_id`  
and the current subtask ID.

**Gap 2 (M4b) — `begin_compensation()` not called at exhaustion.**  
Before `abandon_goal()` at line 780: read the transaction, check `tx.status == "active"`,  
call `tx.begin_compensation()`, log the audit summary.

**Gap 3 (M4c) — Soft-skip uses raw attempt ratio, not transaction completion_pct.**  
`_soft_skip()` at line 575 uses goal.attempt_count/goal.failure_count. Upgrade to  
check `self._transactions.get(g.id)` — if a transaction exists, use `tx.completion_pct`  
instead of the raw ratio for decomposed goals.

All three patches together were ~30 lines. **All three are applied as of 2026-05-31.**  \n\n### Applied Fixes\n\n**M4a (creation + record):**  \n- `_current_subtask_id: Optional[str]` added to `CognitiveCycle.__init__`  \n- Re-probe block (cognitive_cycle.py:~774) lazily creates `PlanTransaction(plan_id, goal_id)`  \n  when `compute_next_actionable()` returns a valid subtask, captured in `_current_subtask_id`  \n- Post-tool block (~1123) looks up `self._transactions.get(tx_key)` where `tx_key = plan_id` (not  \n  `goal.id`), calls `tx.record_attempt(subtask_id, content, tool_name, success_flag, comp_note)`  \n\n**M4b (exhaustion):**  \n- Before `abandon_goal()` at attempt ceiling (~799), fires `tx.begin_compensation()` if transaction  \n  exists and status is `"active"`, logs structured audit summary  \n\n**M4c (soft-skip):**  \n- `_soft_skip(g)` now checks `self._transactions.get(g_plan_id)` — if a transaction with  \n  subtask_history exists, uses `(1.0 - tx.completion_pct) > SOFT_SKIP_FAIL_RATE` instead  \n  of raw attempt/failure ratio\n\n### Root Cause Pattern\n\nThe `_transactions` dict was **initialized but never populated** — the classic architecture  \nbug where consumer wiring (the M4a block reading `self._transactions.get()`) was written  \nfirst, and the producer path (creating PlanTransaction objects) was never connected. The  \ndict existed, methods existed, tests passed for the dataclasses — but the runtime  \n`_transactions` was always empty. This is a specific subclass of Pitfall #8 (data exists but  \nisn't consumed): **data doesn't exist because the insertion path was never written.**
