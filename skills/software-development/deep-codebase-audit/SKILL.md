---
name: deep-codebase-audit
description: "Systematic multi-file architecture audit: read core files, trace integration points, identify gaps with line-number evidence, synthesize into priority-ordered build plan."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [macos, linux]
metadata:
  hermes:
    tags: [Architecture, Audit, Code-Review, Cognitive-Agent, Gap-Analysis]
    related_skills: [self-audit-cognitive-autonomy, systematic-debugging, writing-plans, opencode]
---

# Deep Codebase Audit

Systematic architecture audit that produces gap analyses grounded in line-number evidence and a priority-ordered build plan.

**Use when:** You need to deeply understand a subsystem's architecture, identify where it falls short of goals (AGI, performance, reliability), and produce an actionable improvement roadmap.

**Do NOT use when:** You need a quick answer about a single file, a line-of-code count, or debugging a specific bug — use `codebase-inspection` or `systematic-debugging` instead.

## When to Use

- User asks "audit the cognitive architecture" / "find gaps in X"
- Long-term architecture improvement project (AGI roadmap, system redesign)
- Understanding how N subsystems interconnect before making changes
- Producing a priority-ordered build plan from architecture gaps

## Pattern: Multi-Workstream Audit

Split the audit into parallel workstreams, each targeting a single subsystem. Within each workstream, use the **manual deep-read pattern** described below.

### Workstream Template

For each subsystem, produce a document answering:

1. **Message/Data flow** — text-based diagram: what happens from input to output
2. **State lifecycle** — what persists across turns/calls, what's ephemeral
3. **Critical code paths** — budget/grace/interrupt/error handling
4. **Gap analysis** — at least 5 concrete gaps between current behavior and ideal, each with line-number references
5. **Honesty level** — critical, not complimentary

### Example Workstreams (from the May 12, 2026 cognitive architecture audit)

| Workstream | Target | Lines covered | Gaps found |
|------------|--------|--------------|------------|
| Agent loop | run_agent.py (~14k lines) | 15 targeted reads | 7 gaps (no self-model, no goal-directed exit, gateway state loss, etc.) |
| Memory | hermes_state.py + agent/ (3.5k lines) | 10 targeted reads | 5 gaps (no consolidation, no WM, shallow retrieval) |
| Tool dispatch | model_tools.py + tools/ (1.7k lines) | 8 targeted reads | 6 gaps (no success tracking, no cost awareness, pure LLM pattern-matching) |
| Self-model | cognitive_agent/agent.py (5.5k lines) | 12 targeted reads | Architecture map of 8 cognitive systems + integration points |
| Test gaps | tests/ (367k lines total) | grep + wc | ~16k lines of cognitive code with ~0 unit tests |

## Manual Deep-Read Pattern (Preferred)

For broad codebase survey (30k+ lines across multiple files), this pattern is **more reliable** than delegating to subagents like OpenCode:

```
1. search_files() — grep for key patterns (function names, class names, integration points)
2. read_file() targeted sections — read the specific lines around each match
3. Write analysis directly — compose findings as you go, don't accumulate raw notes
```

**Why this beats delegation for architecture work:**
- You can follow integration chains in real-time (find `augment_message` → read its call site → find `CognitiveAgent.run()` → read its signature)
- You maintain awareness of the whole picture — no "lost in one file" tunnel vision
- You can triangulate: same constant name appears in 3 files → you know the integration exists

## Writing the Audit Documents

Each audit document should be a standalone markdown file with:

### Required Sections

1. **Message/Data Flow** — text-based architecture diagram showing:
   - Entry points → transformations → storage → exit points
   - Integration points between subsystems (call sites with line numbers)

2. **State Lifecycle** — what persists vs. what's ephemeral:
   - Per-turn state (resets every run_conversation call)
   - Per-session state (lives across turns in CLI)
   - Per-message state (lost on gateway boundaries)

3. **Critical Code Paths** — budget gates, interrupt handling, error recovery

4. **Reasoning Analysis** — where does actual cognition happen vs. pattern-matching?

5. **Gap Analysis** — 5+ concrete gaps with line-number references:
   - Describe the gap
   - Cite the exact line(s) where the limiting behavior is
   - Explain why it matters for the target (AGI, reliability, etc.)

### Example Gap Format

```
**Gap N — No runtime self-model (run_agent.py line 10655 loop body)**
The loop checks budget and interrupts but never asks "how am I doing?".
There's no introspection point where the agent evaluates its own reasoning
quality mid-turn.
```

## Synthesis: Priority-Ordered Build Plan

After all workstream documents are written, synthesize into a single document:

1. **Architecture overview** — unified diagram showing how subsystems interconnect
2. **Priority-ranked gap map** — P0 (blocking), P1 (major), P2 (polish)
3. **Build plan by phase** — what to build in each phase, with LOC estimates
4. **Measurement framework** — how to know when each gap is closed

### Priority Assignment Rules

| Priority | Criteria |
|----------|----------|
| P0 | Blocks any AGI trajectory. Without this, no between-turn learning or continuity is possible. |
| P1 | Major capability unlock. Enables new cognitive behaviors. |
| P2 | Important for polish. Improves quality but doesn't block new capabilities. |

## Pitfalls

- **OpenCode/delegate_task will STALL on large file-reading prompts.** Never send "read 14k lines of run_agent.py and write analysis" as a single OpenCode job. Break into smaller scope per workstream and write analysis yourself.
- **Don't trust grep alone.** `search_files` finds strings but not integration intent. Always verify: read the call site, trace the parameter, check what the function actually does vs. what its docstring says.
- **Counter dead reckoning.** After reading a file path, verify with `ls` or `find` — assumptions about directory layout are wrong more often than not.
- **Document gaps with line numbers before moving on.** You won't remember which line had the critical loop condition after reading 4 more files. Write as you go.
- **Synthesis is not a summary.** The synthesis document should identify GAPS not described in any single workstream — e.g., "CognitiveProcessor runs 8 systems per turn, but the agent loop never reads the output" is a cross-cutting gap that no single workstream would find.
- **Use `wc -l` for test file sizes, `grep -c` for test count.** Don't guess coverage — measure it.

## Verification

After writing a build plan, verify every priority claim:
- P0: can you articulate *exactly* why this blocks continuity/learning?
- P1: what capability does this unlock that doesn't exist now?
- P2: what quality metric improves, and by how much?

## Related Skills

- `self-audit-cognitive-autonomy` — verifying runtime state vs. assuming it. Use this BEFORE planning changes (verify what you actually have).
- `systematic-debugging` — 4-phase bug root-causing. Use when audits reveal bugs, not architecture gaps.
- `writing-plans` — writing implementation plans once gaps are identified.
- `opencode` — use for targeted ONE-SHOT code changes (not broad reading). Patch after audit, don't read-via-opencode.
