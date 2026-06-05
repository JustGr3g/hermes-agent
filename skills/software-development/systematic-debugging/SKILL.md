---
name: systematic-debugging
description: "4-phase root cause debugging: understand bugs before fixing."
version: 1.1.0
author: Hermes Agent (adapted from obra/superpowers)
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [debugging, troubleshooting, problem-solving, root-cause, investigation]
    related_skills: [test-driven-development, writing-plans, subagent-driven-development]
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

> **Reference files:**
> - `references/premise-verification.md` — pre-subtask premise probes that catch phantom-artifact references before the cycle wastes attempts on nonexistent premises. Use when the cognitive cycle repeatedly fails on [ENG-2026-0520-008]-shaped phantom artifact goals, or whenever you're decomposing a goal that references concrete files/artifacts.
> - `references/claim-verification.md` — protocol for independently verifying deployment claims against live runtime state. Use when someone tells you what changed in a running system.
- `references/mixed-type-queue-dispatch.md` — pattern for handling signal tuples in async queue consumers. Use when `"\n".join(lines)` throws `TypeError: expected str instance, tuple found` in a stream pipeline.
- `references/stale-pyc-bytecode-cache.md` — pattern for bugs that persist after source-fix because Python loaded old `.pyc` bytecode. Use when a fix exists in source but the running process still shows the old behavior.
> - `references/preflight-tool-validation.md` — pre-flight parameter validation against JSON Schema to catch bad tool calls before dispatch. Use when the SelfImprovementLoop flags `tool_selection` or you observe a pattern of tool failures from bad parameters.
> - `references/cross-repo-investigation.md` — patterns for cross-repo traces, one-line allowlist fixes, advisory-to-structural enforcement, and PLUR correction over deletion. Use when a feature gap spans two repos or a comment says "advisory, not enforced."
> - `references/dirty-branch-cleanup.md` — scope check (git grep before reading diff) + 4-step pre-commit checklist for landing N uncommitted changes as isolated commits. Use when a feature branch has accumulated dirty files and you want to land them safely.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue


**Also use this for cognitive architecture self-audit:**
- Metacognitive signals firing too often or not enough
- Working memory, motivation, or executive behaving oddly
- Curious about why a cognitive system makes a particular decision
- Athena has been running for a while and you want to understand what's actually in memory

When auditing Athena's cognitive architecture specifically:
1. Read the source code first — `~/cognitive-agent/cognitive_agent/cognition/` has all 8 systems
2. Check the SQLite DB (`~/athena_memory.db`) for actual state: `episodes`, `metacognitive_events`, `goals`, `pending_reminders`
3. Compare what the code *should* do vs. what the DB shows it *is* doing
4. Verify math/computation manually before changing code (e.g. WM load formula)
5. After fixing, update tests to match the new intended behavior — old tests may be testing old (broken) behavior

### Crucial: Filesystem != Running Process

**Code on disk and running code are two different things.** A fix can be committed to the filesystem but not active if the process hasn't been restarted. This applies to all daemonized services (launchd agents, cron-triggered gateways, heartbeat schedulers).

When investigating a discrepancy between what the code *says* it should do and what behavior you observe:

- **Check the running process** first, not just the file on disk:
  ```bash
  # Is the process running on the old or new code?
  ps aux | grep athena_server | grep -v grep
  # What launchd service controls it?
  ls ~/Library/LaunchAgents/ai.athena.*.plist
  launchctl list | grep athena
  # Since when has it been running?
  ps -eo pid,lstart,comm | grep athena
  ```

- **Check the actual log output** for behavior — the log lines show what the *running* code did, not what the *file* says it should do:
  ```bash
  tail -50 ~/cognitive-agent/hermes/logs/athena_server.error.log
  ```

- **Restart to pick up file changes** after a code fix is applied:
  ```bash
  launchctl kickstart gui/501/ai.athena.server   # modern launchctl
  # or legacy:
  launchctl unload ~/Library/LaunchAgents/ai.athena.server.plist
  launchctl load ~/Library/LaunchAgents/ai.athena.server.plist
  ```

A classic failure mode: you read a `.py` file, see the fix, assume the fix is active. But the Python process loaded the module at startup and hasn't reloaded. The code on disk is the *intended* behavior; the running process is the *actual* behavior. Always verify both before claiming a fix is in effect.

### Crucial: Scoping — Check the Right Codebase

In multi-agent systems (Hermes, Athena), a tool referenced in one agent's registry may not exist in another's. **Always verify the exact codebase path** before concluding something is missing:

- Athena's tools live in `~/cognitive-agent/cognitive_agent/tools/`
- Hermes' tools live in `~/cognitive-agent/hermes/tools/`

A claim like "read_vault is registered in the allowlist but doesn't exist" must be verified against the *same codebase* the autonomous loop uses. If Athena's `CognitiveAgent` registers `ReadVaultTool` via `cognitive_agent/agent.py:577`, the fact that it's absent from `hermes/tools/` is irrelevant — Athena's tool dispatcher uses `cognitive_agent/tools/registry.py`, not Hermes'. 

Always trace the **actual dispatch path** (`from .tools.read_vault import ReadVaultTool` in imports, then `self.tools.register(...)`) before making a claim about tool registration.

### Multi-Repo Cognitive Systems: Verify the Right Codebase

Athena has components in at least two separate repos:
- **cognitive_agent/** — the `CognitiveAgent`, cognitive_cycle, deliberation, memory subsystems
- **hermes/** — the agent loop layer (`run_agent.py`), tool dispatch, platform adapters

A feature gap you assume exists in one repo may already be implemented in the other. **Before declaring something missing, check both.**

The diagnostic sequence that caught this (May 31 2026):
1. Found a test (`tests/test_continuity.py`) importing from `hermes.agent.cognitive_processor`
2. Assumed the compression capture was "partial" in cognitive_agent
3. Read `hermes/run_agent.py:9761` — found `_last_pre_compress_state` capture was fully wired there
4. Read `cognitive_processor.py:347` — found the injection was fully wired there too
5. Both endpoints existed; the "gap" was an assumption

**Rule:** When a test imports from a different repo, trace the actual implementation path in that repo before concluding the feature is incomplete. The test's import is a strong signal about where the real code lives.

**Don't skip when:**
- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Someone wants it fixed NOW (systematic is faster than thrashing)

## The Four Phases

You MUST complete each phase before proceeding to the next.

---

## Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

### 1. Read Error Messages Carefully

- Don't skip past errors or warnings
- They often contain the exact solution
- Read stack traces completely
- Note line numbers, file paths, error codes

**Action:** Use `read_file` on the relevant source files. Use `search_files` to find the error string in the codebase.

### 2. Reproduce Consistently

- Can you trigger it reliably?
- What are the exact steps?
- Does it happen every time?
- If not reproducible → gather more data, don't guess

**Action:** Use the `terminal` tool to run the failing test or trigger the bug:

```bash
# Run specific failing test
pytest tests/test_module.py::test_name -v

# Run with verbose output
pytest tests/test_module.py -v --tb=long
```

### 3. Check Recent Changes

- What changed that could cause this?
- Git diff, recent commits
- New dependencies, config changes

**Action:**

```bash
# Recent commits
git log --oneline -10

# Uncommitted changes
git diff

# Changes in specific file
git log -p --follow src/problematic_file.py | head -100
```

### 4. Gather Evidence in Multi-Component Systems

**WHEN system has multiple components (API → service → database, CI → build → deploy):**

**BEFORE proposing fixes, add diagnostic instrumentation:**

For EACH component boundary:
- Log what data enters the component
- Log what data exits the component
- Verify environment/config propagation
- Check state at each layer

Run once to gather evidence showing WHERE it breaks.
THEN analyze evidence to identify the failing component.
THEN investigate that specific component.

### 5. Trace Data Flow

**WHEN error is deep in the call stack:**

- Where does the bad value originate?
- What called this function with the bad value?
- Keep tracing upstream until you find the source
- Fix at the source, not at the symptom

**Action:** Use `search_files` to trace references:

```python
# Find where the function is called
search_files("function_name(", path="src/", file_glob="*.py")

# Find where the variable is set
search_files("variable_name\\s*=", path="src/", file_glob="*.py")
```

### Phase 1 Completion Checklist

- [ ] Error messages fully read and understood
- [ ] Issue reproduced consistently
- [ ] Recent changes identified and reviewed
- [ ] Evidence gathered (logs, state, data flow)
- [ ] Problem isolated to specific component/code
- [ ] Root cause hypothesis formed

**STOP:** Do not proceed to Phase 2 until you understand WHY it's happening.

---

## Phase 2: Pattern Analysis

**Find the pattern before fixing:**

### 1. Find Working Examples

- Locate similar working code in the same codebase
- What works that's similar to what's broken?

**Action:** Use `search_files` to find comparable patterns:

```python
search_files("similar_pattern", path="src/", file_glob="*.py")
```

### 2. Compare Against References

- If implementing a pattern, read the reference implementation COMPLETELY
- Don't skim — read every line
- Understand the pattern fully before applying

### 3. Identify Differences

- What's different between working and broken?
- List every difference, however small
- Don't assume "that can't matter"

### 4. Understand Dependencies

- What other components does this need?
- What settings, config, environment?
- What assumptions does it make?

---

## Phase 3: Hypothesis and Testing

**Scientific method:**

### 1. Form a Single Hypothesis

- State clearly: "I think X is the root cause because Y"
- Write it down
- Be specific, not vague

### 2. Test Minimally

- Make the SMALLEST possible change to test the hypothesis
- One variable at a time
- Don't fix multiple things at once

### 3. Verify Before Continuing

- Did it work? → Phase 4
- Didn't work? → Form NEW hypothesis
- DON'T add more fixes on top

### 4. When You Don't Know

- Say "I don't understand X"
- Don't pretend to know
- Ask the user for help
- Research more

---

## Phase 4: Implementation

**Fix the root cause, not the symptom:**

### 1. Create Failing Test Case

- Simplest possible reproduction
- Automated test if possible
- MUST have before fixing
- Use the `test-driven-development` skill

### 2. Implement Single Fix

- Address the root cause identified
- ONE change at a time
- No "while I'm here" improvements
- No bundled refactoring

### 3. Verify Fix

```bash
# Run the specific regression test
pytest tests/test_module.py::test_regression -v

# Run full suite — no regressions
pytest tests/ -q
```

### 4. If Fix Doesn't Work — The Rule of Three

- **STOP.**
- Count: How many fixes have you tried?
- If < 3: Return to Phase 1, re-analyze with new information
- **If ≥ 3: STOP and question the architecture (step 5 below)**
- DON'T attempt Fix #4 without architectural discussion

### 5. If 3+ Fixes Failed: Question Architecture

**Pattern indicating an architectural problem:**
- Each fix reveals new shared state/coupling in a different place
- Fixes require "massive refactoring" to implement
- Each fix creates new symptoms elsewhere

**STOP and question fundamentals:**
- Is this pattern fundamentally sound?
- Are we "sticking with it through sheer inertia"?
- Should we refactor the architecture vs. continue fixing symptoms?

**Discuss with the user before attempting more fixes.**

This is NOT a failed hypothesis — this is a wrong architecture.

---

## Red Flags — STOP and Follow Process

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals a new problem in a different place**

**ALL of these mean: STOP. Return to Phase 1.**

**If 3+ fixes failed:** Question the architecture (Phase 4 step 5).

## The Writeside Trap — Container reads return defaults while writes never fire

A particularly subtle failure mode in Python codebases: a container (`dict`, `list`, in-memory cache) is **declared but never written to**. Every read returns a sane default (`.get()` returns `None`, `.get_or_create()` returns a fresh object), so there's no crash — but the integration is dead code.

**Symptoms:**
- A `.get()` on a dict always falls through to the `None` branch
- A feature "works in tests" (tests inject the data directly) but never triggers in production
- Logs show the read path executing but the "create if missing" path never fires
- The dict appears in `__init__` but doing a `search_files` for `dict_name[key] = value` or `dict_name[key] = ` across the file returns zero hits

**Detection pattern:**

```python
# 1. Verify container declaration
read_file(path, offset=N, limit=5)  # e.g. self._transactions: dict[str, PlanTransaction] = {}

# 2. Search for WRITE sites — NOT read sites
search_files(path="target_file.py", pattern="dict_name[")   # find BOTH get() AND assignment
# If only .get() / .get(key) appears, there's no write site.

# 3. Check the READ site — does it defensively create?
# If the read does .get(key) and returns on None without creating,
# and step 2 shows no write site, the container is permanently empty.
```

**Real-world example discovered May 31, 2026:** `CognitiveCycle._transactions` was declared at line 376 (`self._transactions: dict[str, PlanTransaction] = {}`) and read at line 1089 (`tx = self._transactions.get(goal.id)`). Every tool execution called `.get()`, got `None`, and skipped the record_attempt block. The `PlanTransaction` integration was structurally dead. None of the three patch tasks (M4a, M4b, M4c) would have worked because the dict was never written to — the first patch that "creates a PlanTransaction on first subtask resolve" was hidden behind the assumption that M4a was already working.

**The key insight:** An `.get()` that returns a safe default (None, empty list) is **indistinguishable from "data not ready yet"** unless you verify the write site. A plan that says "wire A into B" must check: does B actually have a path for data to enter it? If not, all downstream reads are phantom reads.

A particularly insidious failure mode in Python codebases: **`except Exception:»pass` (or bare `except Exception:»return default`) that makes a subsystem silently invisible.**

Symptoms to watch for:
- A function returns a plausible-looking default (empty list, empty dict, empty `nx.Graph()`) instead of raising
- The error is logged at `debug` or `warning` level (not `error`) — visible in log analysis but never surfaced to the runtime
- Data arrives at a subsystem's entry point (confirmed via logs) but produces no effect downstream
- The module appears loaded and imported correctly — no ImportError — but produces no output

Detection pattern when you suspect silent swallowing:
```python
# 1. Read the actual function body — don't trust what it "should" do
read_file(path, offset=N, limit=M)  # Read the except block

# 2. Check whether the except clause logs the error or swallows it silently
# If it only logs at debug/warning AND returns a default → silent swallowing

# 3. Read the raw stored data directly (bypassing the deserializer)
# Example: open the SQLite blob, read the JSON, try parsing it with the SAME
# library version that the function uses
```

**Real-world example discovered May 22, 2026:** `GraphSerializer.deserialize()` in `cognitive_agent/persistence.py` wraps `nx.node_link_graph(data)` in a bare `except Exception` that returns `nx.Graph()` — an empty graph. A legacy blob used `"edges"` as the edge-list key but nx 3.x expects `"links"`, so every load silently returned an empty graph. 6,642 nodes and 75,852 edges persisted in SQLite but the runtime never saw them. Fix: `nx.node_link_graph(data, link='edges')` handles both key conventions.

**Detection sequence that found it (reusable for similar cases):**
1. **Check the stored data directly**, bypassing the deserializer — open the file/DB, read the raw blob, parse it with the same library version:
   ```python
   row = conn.execute("SELECT graph_json FROM graph_state").fetchone()
   data = json.loads(row[0])
   G = nx.node_link_graph(data, directed=False)  # ← THIS fails
   ```
2. **Inspect the data's actual key names** — if the blob uses a different key convention than the deserializer expects, that's the smoking gun:
   ```python
   print(list(data.keys()))  # ['directed', 'multigraph', 'graph', 'nodes', 'edges']
   ```
3. **Try both key conventions** — `nx.node_link_graph(data, link='edges')` vs default `link='links'` — to see which succeeds.
4. **Confirm via an independent consumer** — if the blob has data but the loaded graph is empty, the deserializer is the problem:
   ```python
   data['links'] = data.pop('edges')
   G = nx.node_link_graph(data)  # now works
   ```

The key insight: **a function that returns an empty default instead of raising is indistinguishable from "nothing stored yet"** unless you independently verify the persisted data. The detection pattern is: **read the raw store directly** — if the store has data and the runtime returns empty, the deserialization layer is the problem.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "I see the problem, let me fix it" | Seeing symptoms ≠ understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question the pattern, don't fix again. |

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence, trace data flow | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare, identify differences | Know what's different |
| **3. Hypothesis** | Form theory, test minimally, one variable at a time | Confirmed or new hypothesis |
| **4. Implementation** | Create regression test, fix root cause, verify | Bug resolved, all tests pass |

## Hermes Agent Integration

### Investigation Tools

Use these Hermes tools during Phase 1:

- **`search_files`** — Find error strings, trace function calls, locate patterns
- **`read_file`** — Read source code with line numbers for precise analysis
- **`terminal`** — Run tests, check git history, reproduce bugs
- **`web_search`/`web_extract`** — Research error messages, library docs

### With delegate_task

For complex multi-component debugging, dispatch investigation subagents:

```python
delegate_task(
    goal="Investigate why [specific test/behavior] fails",
    context="""
    Follow systematic-debugging skill:
    1. Read the error message carefully
    2. Reproduce the issue
    3. Trace the data flow to find root cause
    4. Report findings — do NOT fix yet

    Error: [paste full error]
    File: [path to failing code]
    Test command: [exact command]
    """,
    toolsets=['terminal', 'file']
)
```

### With test-driven-development

When fixing bugs:
1. Write a test that reproduces the bug (RED)
2. Debug systematically to find root cause
3. Fix the root cause (GREEN)
4. The test proves the fix and prevents regression

## Real-World Impact

From debugging sessions:
- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common

**No shortcuts. No guessing. Systematic always wins.**
