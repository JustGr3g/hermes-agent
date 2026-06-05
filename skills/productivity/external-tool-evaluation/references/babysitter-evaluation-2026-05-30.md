# Babysitter (a5c-ai) Evaluation — 2026-05-30

## Summary

**Decision:** Don't depend on Babysitter. Three patterns worth extracting.

**Repository:** [github.com/a5c-ai/babysitter](https://github.com/a5c-ai/babysitter)
**Stars:** ~1,000 | **Language:** JavaScript/TypeScript | **License:** MIT
**Description:** Enforces obedience on agentic workforces through deterministic, hallucination-free self-orchestration.

## Feature Map

| Feature | Babysitter approach | Our equivalent | Gap/decision |
|---------|--------------------|----------------|-------------|
| Process-as-code | JS workflow code agent cannot bypass | Prompt-defined workflows (cron jobs, agent prompts) | **Extract** — migrate 3 workflows to Python process definitions |
| Verify→remediate | `task(verify) → if score < 80 → task(refine)` | `verify_script` post-hoc, non-fatal (scheduler.py:1964-1969) | **Implement** — upgrade to gated loop with retries |
| Compression | 4-layer, configurable hooks at 50-67% reduction | None | **Implement** — plugin with 4 engines |
| Mandatory stop per step | Agent forced to halt after every task | No equivalent (continuous loop) | **Skip** — antithetical to cognitive continuity |
| Event-sourced journal | `.a5c/runs/` immutable, replayable | Hermes session DB + FTS5 | **Skip** — already have |
| Structured breakpoints | Human gate blocks progression | `/approval` via tool | **Skip** — low value in DM |
| Parallel execution | DAG-based task dispatch | Delegation + cron + kanban | **Skip** — already have |

## Key Evidence

The single strongest reason to extract patterns rather than adopt directly: **Babysitter is designed to constrain agents; Athena is designed to empower them.** The mandatory-stop model and "enforces obedience" framing are philosophically orthogonal to Athena's autonomy trajectory [from cognitive state: 75% aesthetic coherence, active goals for self-direction].

## Phase Order (from the plan at .hermes/plans/babysitter-patterns/README.md)

1. **Verify→remediate loop** (days 1-2) — fixes measured fabrication failure
2. **Process-as-code registry** (days 5-10) — structural fix for same failure
3. **Content-type-aware compression plugin** (days 3-5) — independent, improves every session
