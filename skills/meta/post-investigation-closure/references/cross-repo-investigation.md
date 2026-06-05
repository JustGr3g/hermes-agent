# Cross-Repo Investigation Patterns

Athena has components in at least two repos (cognitive_agent/ and hermes/).
A test or feature importing from the *other* repo is a strong signal to trace
the actual implementation there, not just the repo you assumed it lived in.

## Pattern: The Other Repo Has the Endpoints

**Discovered:** May 31 2026 — compression-continuity investigation.
- Found `tests/test_continuity.py` importing from `hermes.agent.cognitive_processor`
- Assumed compression capture was "partial" in cognitive_agent
- Read `hermes/run_agent.py:9761` — `_last_pre_compress_state` was fully wired
- Read `cognitive_processor.py:347` — injection was fully wired
- Both endpoints existed in hermes/; the assumption was false

**Procedure:**
1. Note which repo the test imports from
2. Open that repo's relevant module first
3. Trace the data flow: capture site → storage → injection site
4. Only declare "missing" after confirming neither repo has the endpoint

## Pattern: One-Line Allowlist Fixes

When a tool is in `SELF_DRIVEN_TOOL_DEFAULT_FILTER` (the cycle can fire it)
but NOT in `_RETRIEVAL_TOOLS` (the deterministic completion fast-path skips it),
the cycle fires the tool successfully but never recognizes the goal as complete.
The LLM detector's "prefer NOT complete" bias then produces N-iteration loops.

**Diagnosis:** If a goal is making successful tool calls and never completing,
check whether the tool is in ALL the sets it needs to be in — especially
`_RETRIEVAL_TOOLS` at `cognitive_cycle.py` line ~189.

## Pattern: Advisory → Structural Enforcement

When a code comment says "advisory, not enforced":
1. Find the comment — it's the author's invitation
2. Trace the data flow from the advisory signal to where the decision is made
3. Find the parsing/validation function (`_intention_from_parsed` in deliberate.py)
4. Add a gate that demotes non-compliant picks to `wait` with a logged reason
5. Backward compatibility: gate only fires when the signal is active

**Discovered:** May 31 2026 — `deliberate.py:91` said "Values are advisory,
not exclusive — the LLM still picks any tool." Added drive-family enforcement
gate at `_intention_from_parsed()` line 336.

## Pattern: PLUR Correction Over Deletion

When a roadmap engram is partially stale (some claims accurate, some false):
1. Create a correction engram with the updated truth and disk citations
2. The correction explicitly supersedes the stale parts
3. Only retire the original engram when ALL its claims are superseded
4. This preserves the accurate signal while removing the noise

**Discovered:** May 31 2026 — ENG-2026-0514-002 correctly identified compression
continuity as unverified but falsely claimed Planner/Executor were missing.
Created ENG-2026-0531-001 as correction, retired the original only after
all 4 tiers were verified on disk.
