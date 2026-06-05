# Stuck Plans: Obsidian Vault Search Mismatch Pattern

## The Pattern

Four plans (discovered 2026-05-24) share an identical failure signature:

| Pattern element | Description |
|----------------|-------------|
| M0 goal status | `needs_review` |
| M0 attempt count | 9 (exactly — the max before plan-tier parks the plan) |
| M0 tool attempted | `read_vault` or vault search |
| Failure cause | The target artifact doesn't exist in Greg's Obsidian vault — it's internal thinking (episodic memory) |
| M1/M2 goals | `suspended` at 0 attempts |
| Plan age | 1-3 days stuck |

## Diagnosis Query

```bash
sqlite3 ~/athena_memory.db "
SELECT 
  g.id AS goal_id,
  g.content,
  g.status,
  g.attempt_count,
  g.plan_id,
  p.name AS plan_name
FROM goals g
LEFT JOIN plans p ON g.plan_id = p.id
WHERE g.status = 'needs_review' 
  AND g.attempt_count >= 8
ORDER BY g.updated_at DESC
"
```

## Root Cause (Pre-May-24)

The classifier prompt taught three retrieval surfaces:
- `read_vault` → Greg's Obsidian notes
- `web_search` → the world
- (no third option for introspective recall)

Self-referential goals ("recall the sovereignty reframe I had", "retrieve context about the Saturday sovereignty shift") got force-mapped to `read_vault`. The vault doesn't contain Athena's internal thinking. 9 attempts later the plan parks in `needs_review`.

## The Fix

Three new tools added 2026-05-24:

| Tool | What it replaces | Role |
|------|-----------------|------|
| `recall_memory` | Vault search for internal thinking | `introspective_recall` |
| `read_athena_vault` | (own notes read) | `self_artifact_retrieval` |
| `abandon_goal` | (goal retirement) | `goal_lifecycle` |

These tools give the goal_proposer and classifier three distinct targets:
- *My own past thinking* → `recall_memory` (episodic + associative graph)
- *My own saved notes* → `read_athena_vault` (Obsidian vault at ~/cognitive-agent/notes/)
- *Greg's notes* → `read_vault` (unchanged)
- *The world* → `web_search` (unchanged)

## Recovery Path

For stuck plans with this pattern:

1. `recall_memory(query=<topic>, limit=8)` — retrieve from episodic store
2. `complete_goal(<M0_goal_id>)` if recall succeeds — the plan-tier M1/M2 auto-activate on M0 completion
3. Optionally: `read_athena_vault(mode='search', query=<topic>)` to cross-reference against written notes
4. Write an insight note: `save_note(title=..., content=..., category='insight')` to persist the synthesis

If the recall returns nothing useful despite being the right tool for the goal's shape:
- `abandon_goal(goal_id=<M0_or_plan_id>, reason="recall returned nothing relevant — no episodal base to anchor from")`
- The cascade-abandon fires, cleaning suspended siblings

## Related

- The four stuck plans: `plan_bd2935ac` (sovereignty reframe), `plan_af9a777f` (May 23 sovereignty), `plan_1f4cd01b` (consolidation episodes), `plan_5b609522` (May 22 "How did you know that?")
- 312 total goals in `~/athena_memory.db` as of 2026-05-24
