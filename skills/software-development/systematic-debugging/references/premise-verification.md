# Premise Verification — Subtask Dependency Gate

**Context:** The GoalDecomposer generates subtasks from templates. Before a subtask is committed, the PremiseVerifier probe scans it for concrete artifact references (file paths, tool names, named artifacts). If any referenced entity doesn't exist, the subtask is marked `BLOCKED` instead of `PENDING`.

**When to use:** Any time the cognitive cycle's goal proposer generates a goal that references a concrete artifact (file, prior note, tool, API). The verifier won't catch vagueness ("research existing solutions") — that's intentional. It catches *specific* references to things that don't exist.

## Files

- `cognitive_agent/cognition/premise_verifier.py` — probe functions + verify pipeline
- `cognitive_agent/cognition/goal_decomposer.py` — integration point (in `decompose()`)

## Architecture

```
GoalProposer → goal text → GoalDecomposer.decompose()
                                ↓
                      _generate_subtasks() → raw subtask strings
                                ↓
                      verify_subtask_blocking(content)
                                ↓
                      Subtask created (PENDING or BLOCKED)
                                ↓
                      CognitiveCycle.tick() → next_subtask → BLOCKED subtasks skipped
```

## Probe Patterns

| Pattern | Regex | Example |
|---------|-------|---------|
| Verb + file path | `(read\|check\|review\|...) path.ext` | "read /tmp/report.md" |
| Standalone path | `(in\|from\|at\|to\|of\|via\|for) path.ext` | "the analysis in /tmp/report.md" |
| Tool reference | `(tool\|API\|endpoint\|...) tool_name` | "use the web_search tool" |
| Artifact name | `(plan\|note\|artifact\|...) titled "name"` | "the note titled 'findings'" |

## Behavior

- **Generic goal** ("Research existing solutions for X") → no concrete refs → all subtasks PENDING (correct)
- **Phantom artifact** ("Review the analysis in /tmp/phantom.md") → all subtasks with that ref → BLOCKED
- **Existing artifact** ("Inspect /etc/hosts for patterns") → all subtasks PENDING (correct)
- **Dependency cascade** — if milestone 0's subtasks are all BLOCKED, milestone 1's become unreachable via the dependency chain, so `next_subtask` returns None from the BLOCKED subtree.

## Design Limitation — Generic Vagueness

The premise verifier is a **precision instrument by design**. It only blocks subtasks that reference *concrete* named entities. Generic phrases like:

- "Research existing solutions for X" — passes through (no concrete file/tool/artifact named)
- "Gather information about Y" — passes through
- "Review prior work on Z" — passes through

This is intentional because:

1. **Generic research is valid.** The first step of many goals IS to discover what exists. Blocking "Research existing solutions" would prevent the cycle from ever starting legitimate exploration.

2. **The actual failure mode was concrete, not vague.** [ENG-2026-0520-008] happened because the proposer named a specific artifact that didn't exist ("Claude Code review dry-run findings"), not because it was vague.

3. **Vagueness is a goal quality problem, not a premise-existence problem.** Vague goals that loop without progress are addressed by the cycle's existing mechanisms: `MAX_GOAL_ATTEMPTS` (auto-abandon at 12 attempts), `_MAX_CONSECUTIVE_SKIPS` (stuck detection), and the soft-fail-rate gate.

**Future enhancement path:** If vagueness becomes a measurable problem (goals exhausting via `no_tool_resolution` without ever firing a tool), a *separate* "vagueness classifier" could be added to the proposer or the classifier. The premise verifier should not be extended to guess about what might exist — that's the direction that leads back to ghost artifacts.
