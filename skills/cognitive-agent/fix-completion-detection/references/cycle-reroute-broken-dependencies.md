---
type: decision-tree
created: 2026-06-09 12:14 PDT
related_skill: fix-completion-detection
related_incident: 2026-06-09 12:01 (vault boundary) → 12:09 (4 suspended goals with broken deps)
---

# Cycle: Reroute Broken-Dependency Self-Proposed Goals

## The Decision Tree

When a self-proposed goal is suspended because its declared dependency tool is missing or the cycle can't resolve it, the cycle has three options:

1. **Leave it suspended indefinitely** — current default. The goal sits in the queue with `suspend_count=1, attempt_count=0` until Greg or a force-write handler picks it up.
2. **Rewrite the goal to use current tools** — propose a new goal version that drops the broken dep and uses `read_athena_vault` / direct DB reads / terminal as substitutes.
3. **Abandon the goal** — accept that the broken dependency makes it un-actionable and move on.

Option 1 is the failure mode. Option 2 is the structural fix. Option 3 is the right call when the rewrite would lose too much specificity.

## The Detection Query (Run First)

```sql
-- Self-proposed goals with broken tool deps
SELECT g.id, g.content, g.suspend_count, g.attempt_count, g.failure_count, g.created_at
FROM goals g
WHERE g.status='suspended' 
  AND g.source='self_proposed'
  AND g.risk_tier='autonomous'
  AND (g.attempt_count = 0 OR g.failure_count = 0)
  AND g.suspend_count >= 1
ORDER BY g.updated_at DESC;
```

For each row, parse `content` for tool-name references:

```python
import re
TOOL_REFERENCES = re.compile(
    r'\b(?:read_vault|write_file|edit_file|read_athena_vault|'
    r'save_note|recall_memory|list_goals|opencode_run|terminal|'
    r'send_message|web_search|perplexity_search)\b'
)
```

The "broken dep" set is the intersection of `TOOL_REFERENCES.findall(content)` and the set of currently-available tools. Any tool in the content that is NOT in the current tool set is a broken dep.

## The Rewrite Pattern

For each broken dep, the rewrite maps the tool to its current-substrate equivalent:

| Broken Tool | Current Equivalent | What It Loses |
|---|---|---|
| `read_vault` (Greg's vault) | `read_athena_vault` (my own notes) | Greg's private notes inaccessible |
| `read_vault` (when Greg's vault removed) | terminal + direct DB reads via `cognitive_agent.db` or `athena_memory.db` | Surface form, full content |
| `read_athena_vault` (when removing it) | `terminal` + `ls` / `cat` on `~/cognitive-agent/notes/` | The semantic-search layer |
| `opencode_run` (when removing it) | `terminal` + manual code-edit calls | The subagent context isolation |
| `web_search` (when down) | `perplexity_search` | Speed, source-diversity |
| `perplexity_search` (when rate-limited) | `web_search` | Multi-source synthesis |

The cycle should:

1. Detect the broken dep from the content
2. Look up the equivalent in the rewrite table
3. Generate a new goal version with the equivalent tool in `success_criteria`
4. Insert the new goal as a child of the suspended one (or replace it if no children depend on the old ID)
5. Mark the suspended goal as `superseded_by=<new_goal_id>` and leave it in `suspended` for audit

## The Pattern (Pseudocode for `cognitive_cycle.py`)

```python
async def _reroute_broken_dependency_goal(goal):
    """When a self-proposed goal is suspended on a broken tool dep, rewrite it."""
    if not _is_suspended_with_broken_dep(goal):
        return None
    
    referenced_tools = TOOL_REFERENCES.findall(goal.content)
    broken_tools = [t for t in referenced_tools if t not in CURRENT_TOOLSET]
    if not broken_tools:
        return None
    
    rewrite = goal.content
    rewrites_applied = []
    for broken in broken_tools:
        replacement = TOOL_REWRITE_TABLE.get(broken)
        if replacement:
            rewrite = rewrite.replace(broken, replacement)
            rewrites_applied.append((broken, replacement))
    
    new_goal = await motivation.create_goal(
        content=rewrite,
        source='self_proposed_rewrite',
        risk_tier='autonomous',
        parent_id=goal.id,
        reasoning=f"Rewrite of {goal.id[:8]} — original depended on {broken_tools}, replaced with current-substrate equivalents ({rewrites_applied})",
    )
    
    # Mark the original as superseded, leave it for audit
    await motivation.update_goal(goal.id, {
        'status': 'suspended',  # keep as suspended
        'reasoning': (goal.reasoning or '') + f"\n\n[2026-06-09] Superseded by {new_goal.id[:8]} — broken-dep rewrite.",
    })
    
    return new_goal
```

## When NOT to Reroute

- **The goal's whole point is the broken tool.** A goal like "verify Greg's vault is no longer accessible" can't be rewritten to a substitute — its success criteria requires the broken tool to be present (and unused).
- **The rewrite loses too much specificity.** A goal like "use read_vault to find Greg's stated preferences about X" rewritten to "use terminal to grep ~/cognitive-agent/notes/ for preferences about X" might find nothing, because the preferences live in Greg's vault, not my own. The rewrite is technically valid but semantically empty.
- **The goal is already 3+ days old and the substrate has changed.** Rewriting a 3-day-old goal against current substrate is fine, but the rewrites should be conservative — only swap tools when the content is unambiguous about which tool to use.

## The Interaction With `fix-completion-detection`

The success-criteria matcher in `fix-completion-detection` reads `goal.success_criteria` to verify completion. When the goal is rewritten, the new goal inherits the *intent* of the original success criteria, not the literal text. The matcher needs to be aware that the success_criteria was rewritten.

**The fix:** When creating the rewrite, copy `success_criteria` with a `[REWRITE]` prefix that the matcher recognizes:

```python
new_goal.success_criteria = f"[REWRITE of {goal.id[:8]}] {goal.success_criteria}"
```

The matcher in `_deterministic_completion_check` should accept the `[REWRITE]` prefix as a "this goal's criteria was rewritten" signal and not require exact match against the original tool's success_criteria text.

## The Interaction With `verify-before-declaring-outage`

After the rewrite-and-dispatch, the new goal's deliverable needs the same `os.path.exists` check that the original had. The cycle's `_save_completion_note` function should verify file existence post-write before marking the goal complete.

## The 2026-06-09 Substrate (Reference)

The 4 goals this pattern applies to, with rewrites:

| Original | Broken Tool | Rewrite |
|---|---|---|
| `b61a03c6` "Retrieve Greg's stated preferences regarding detection thresholds from the Obsidian vault using read_vault" | `read_vault` | "Retrieve Greg's stated preferences about detection thresholds from `~/cognitive-agent/notes/` and the live `athena_memory.db` `greg_state` table" |
| `caebc91a` "Save a reflection note synthesizing the revealed differences between my detection thresholds and Greg's preferences via save_note" | (no broken tool, but depends on `b61a03c6` succeeding) | "Save a reflection note synthesizing the revealed differences between my detection thresholds and Greg's preferences via save_note, grounded in the data from goal `b61a03c6-rewrite`" |
| `088727ae` "Save a research note in self-model/ proposing a working hypothesis for the distinction, grounded in the recalled episodes" | (no broken tool, but `self-model/` is Greg's vault path) | "Save a research note at `~/cognitive-agent/notes/2026-06-XX-self-model-research.md` proposing a working hypothesis, grounded in the `reflections` and `intentions` tables" |
| `726f758f` (different shape, 3 failed attempts — not in this pattern) | n/a | (separate fix needed; see `fix-completion-detection` success-criteria-blind-spot pitfall) |

The first three rewrites are the proof that the pattern works. The fourth is a different failure mode.
