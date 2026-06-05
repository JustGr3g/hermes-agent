---
name: phase-claim-architecture
description: Documents the architecture of phase-claim verification (faithfulness subsystem vs cognitive_cycle.py), clarifying a common confusion between 'phase completion claims about system state' and 'goal completion detection.'
---

# Phase Claim Architecture

## What Phase Claims Are

Phase claims are statements about whether a development phase in SPEC.md is ✅ DONE or still PLANNED/INCOMPLETE — e.g. "Phase 11B is not implemented." These are **meta-claims about the system's own development status**.

## Where Phase Claim Logic Lives

The phase claim **verification** is in the **faithfulness subsystem**, not in `cognitive_cycle.py`:

| Component | File | Method | Role |
|-----------|------|--------|------|
| Claim kind | `faithfulness/contracts.py` | `ClaimKind.PHASE_INCOMPLETE` | Typed claim marker |
| Verifier | `faithfulness/verifier.py:70-71` | `_verify_phase_status()` | Checks claim against ground truth |
| Lookup resolver | `faithfulness/lookup.py:307-333` | `_resolve_phase_status()` | Reads SPEC.md to determine DONE/PLANNED/INCOMPLETE |
| Phase cache | `faithfulness/lookup.py:335-365` | `_build_phase_cache()` | Greps SPEC.md headers for ✅ DONE markers |

## Where Goal Completion Detection Lives

Goal completion detection (determining when a goal's work is done) is in `cognitive_cycle.py` and is a **separate concern**:

- `_deterministic_completion_check()` — fast-path for named-deliverable goals
- `_check_goal_completion()` — LLM detector for ambiguous cases
- `_compute_cumulative_progress()` — Jaccard-based stall detection

## Common Confusion

The May 31 diagnostic episode (note `20260601-010017`) describes a "phase-completion reversal" — a faithfulness verifier flagging a system-claim inconsistency. This is NOT the same problem as goals looping on research tools without recognizing completion (ENG-2026-0528-002).

Adding a "phase claim guard" to `cognitive_cycle.py` would be misplaced architecture — it belongs in the faithfulness subsystem, which already handles it.

## Architectural Lesson

When two subsystems have overlapping names ("phase completion" = development status vs "goal completion" = task status), they are easily conflated in goal proposals. The proposer's shape classifier should treat "phase" keywords as routing toward a `read_vault`/`faithfulness` investigation, not a `cognitive_cycle.py` edit.