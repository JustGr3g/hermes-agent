# Compose Direct-Resolution Pattern (June 1, 2026)

When a goal is stuck in `needs_review` and its success_criteria is a clear note/synthesis deliverable, the fastest path is executing it directly rather than waiting for the cognitive cycle to discover it.

## Context

Goals that land in `needs_review` are often compose-shaped — their action is reasoning + writing, not an external tool call. The `athena_compose_resolution` flag (when `live`) lets the cycle resolve these via `_attempt_compose()`, but this only fires during a `CognitiveCycle.tick()` heartbeat. If no heartbeat fires while you're in a conversation with Greg, the goal sits in `needs_review` forever.

## The Pattern

1. Read the goal's `success_criteria` to confirm it's a note/synthesis deliverable
2. Gather evidence from the codebase (search_files, read_file on relevant modules)
3. Synthesize directly into a vault note
4. Persist to `athena_notes` via SQLite INSERT
5. Mark the goal `completed` in the `goals` table

## When to Use

- Goal status is `needs_review` (not a blocking state, just classification)
- Success_criteria describes an insight note, calibration note, or synthesis
- The goal is compose-shaped (reasoning + writing, not a tool call chain)
- You're already in a conversation and can execute faster than waiting for the next heartbeat

## When NOT to Use

- The goal requires tool execution (terminal, opencode_edit, send_message) — let the cycle handle it
- The goal has complex dependencies or plan milestones — let the decomposer work
- The goal is escalated-tier and Greg hasn't approved it yet

## Example from June 1, 2026

Goal `3fdcc8b5`: "A note working through how the Simulator surprise-path fix changes my self-model snapshot reading and metacognitive calibration."

Success_criteria: "An insight note exists in the vault that contrasts the pre-fix and post-fix reading..."

Actions taken:
1. Read `cognition/simulate.py` (402 lines) — understood P4 architecture
2. Read `cognition/predictive.py` (483 lines) — understood SurpriseCalculator
3. Read `cognition/cognitive_cycle.py` lines 2114-2160 — understood _simulate_gate flow
4. Read `self_model.py` lines 336-397 — understood SelfModelSnapshot storage/retrieval
5. Synthesized into a 4222-byte note contrasting pre-fix vs post-fix self-model reading
6. Persisted to vault + athena_notes + marked goal completed

Total time: ~5 minutes, bypassed the need for 12-cycle heartbeat loop.