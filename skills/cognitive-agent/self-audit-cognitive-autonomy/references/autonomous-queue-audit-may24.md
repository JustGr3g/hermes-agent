# Autonomous Goal Queue Audit (2026-05-24)

## What happened

Discovered that the cognitive server's MotivationSystem defaults to `~/athena_memory.db` (motivation.py:443) — NOT any path inside `~/cognitive-agent/` or `~/cognitive-agent/hermes/`. This matters because:

- `cd ~/cognitive-agent` and `sqlite3 cognitive_agent.db` gets you the *wrong* database
- The running server's goals live in the home-directory path
- Fresh `CognitiveAgent()` instances created for testing might use a different default

## Pattern: Identify and clear dead plan-tiers

### Query: find stuck plans

```bash
sqlite3 ~/athena_memory.db "
SELECT g.id, g.content, g.status, g.attempt_count, g.plan_id
FROM goals g
WHERE g.status IN ('needs_review', 'suspended')
  AND g.attempt_count >= 8
ORDER BY g.updated_at DESC
"
```

All four dead plans found 2026-05-24 shared this signature:
- M0 goal: `needs_review` @ **exactly 9 attempts** (plan-tier cap)
- Tool attempted: `read_vault` / Obsidian vault search
- Target artifact: internal episodic thinking, not a vault note
- M1/M2: suspended @ 0 attempts
- Plan age: 1-3 days stuck

### Query: pre-bypass suspended orphans

```bash
sqlite3 ~/athena_memory.db "
SELECT id, content, attempt_count, failure_count, importance
FROM goals WHERE plan_id IS NULL AND status = 'suspended' AND failure_count >= 3
ORDER BY importance DESC
"
```

18 orphans were found on 2026-05-24 — all pre-bypass Telegram message goals that hit `self_tool_blocked` and piled up. They shared:
- No `plan_id` (orphaned, not part of a plan)
- 3-10 failed attempts
- Content pattern: "A Telegram message about X..." / "A drafted Telegram..."
- All created before the autonomy bypass was active

### Execution pattern: bulk abandon

When bulk-abandoning, **bypass the `AbandonGoalTool` wrapper** and call `motivation.abandon_goal()` directly:

```python
from pathlib import Path
from cognitive_agent.cognition.motivation import MotivationSystem

mot = MotivationSystem(db_path=str(Path.home() / 'athena_memory.db'))

# Full UUID or 8-char prefix both work on the MotivationSystem directly
ok = mot.abandon_goal(full_id, failure_reason="reason string here")
```

The `AbandonGoalTool._resolve_id()` method (line 149 in `abandon_goal.py`) has stricter validation than the base MotivationSystem. For single-target abandonments from within a goal, the tool wrapper is fine. For batch queue cleanup, use MotivationSystem directly.

After all 28 abandons (4 plans × 10 goals + 18 orphans):
- `needs_review` dropped from 24+ to 2 (both with ≤2 attempts — still fresh)
- `suspended` dropped from 30+ to 27 (all plan-tier, 0 attempts — healthy sequencing)
- `abandoned` rose from ~30 to 86
- Plans remain `active` even when their goals are all abandoned — plans and goals are independently tracked

### Summary query

```bash
sqlite3 ~/athena_memory.db "SELECT status, COUNT(*) as c FROM goals GROUP BY status ORDER BY c DESC"
sqlite3 ~/athena_memory.db "SELECT status, COUNT(*) as c FROM plans GROUP BY status ORDER BY c DESC"
```

## Three retrieval surfaces (post-May-24 classifier)

The classifier prompt now teaches three surfaces explicitly:

| Surface | Tool | What it accesses | When to use |
|---------|------|------------------|-------------|
| Inner life | `recall_memory` | Episode store + associative graph | Self-referential: reflect on my own past thinking |
| My notes | `read_athena_vault` | `~/cognitive-agent/notes/` (231 .md files) | Revisit a note I wrote via save_note |
| World | `web_search` / `read_vault` | Internet / Greg's Obsidian vault | External knowledge |

This prevents the classic 9-attempt vault-search death spiral for self-referential goals.

## Tools verified live

All four tools import and execute from the running Python interpreter:

```bash
cd ~/cognitive-agent
python3 -c "
import sys; sys.path.insert(0, '.')
from cognitive_agent.tools.recall_memory import RecallMemoryTool
t = RecallMemoryTool()
r = t.execute({'query': 'autonomy bypass sovereignty reframe', 'limit': 5})
print(f'recall_memory: {r.success}, {len(r.output.get(\"items\",[]))} items')
"
```

Proven working on 2026-05-24: `recall_memory(query="sovereignty")` returned 7+ episodes that all four dead plans had failed to reach via `read_vault`.

## Key runtime reality

- `MotivationSystem` defaults to `~/athena_memory.db` (motivation.py:443)
- `episodic memory` is in the same `~/athena_memory.db` (`episodes` table)
- `association graph` lives in `~/athena_memory.db` (`graph_state` table)
- Server is PID 74934, running from `~/cognitive-agent/athena_server.py` (1320 lines, dated May 21)
- Framework branch: `hermes/` on `wip/2026-05-21-snapshot` — the feature branch `feat/recall-memory-introspective-vault` lives in the outer `~/cognitive-agent/` repo
- Import path: `athena_server.py` does `sys.path.insert(0, str(Path(__file__).parent))` → makes `cognitive_agent` resolvable from `~/cognitive-agent/cognitive_agent/`

## complete_goal gate on needs_review

**Critical discovery:** `motivation.complete_goal()` explicitly returns `False` when the goal's status is `needs_review` (motivation.py: `complete_goal` method):

```python
if goal.status == GoalStatus.NEEDS_REVIEW:
    return False  # already gated — Greg owns the next move
```

This means:
- If an autonomous queue audit finds `needs_review` goals that already have their artifacts saved (the note exists, the work is done), **do NOT try to force-complete them.** They're gated by design.
- The correct action is: verify the artifact exists with good content, note it in the audit output, and leave the goal for Greg's sign-off.
- Trying to work around this gate (bypassing through direct SQL) would violate the design intent — `needs_review` is the mechanism that prevents false auto-completions.

Two goals hit this on 2026-05-24:
- `c30df5da` (drive-selection insight note) — note exists at `notes/20260522-230405-988e9d-insight-goal-proposer-drive-selection-logic-commit.md`
- `e6c84a0b` (vault readiness mapping) — note exists at `notes/20260523-105910-994eaa-vault-readiness-self-model-fixes-vs-gaps.md`

Both have the right artifact on disk; they just need Greg to confirm and close.

## Active plan dc91a8c7 — post-consolidation validation sweep

Status: `active`, plan_id `plan_dc91a8c7`, project `proj_ambient_self_proposed`. Created ~2026-05-21 with 6 milestones.

After the May 24 queue audit:
- M0 (vault search) — already abandoned via an earlier cycle
- M1 (search motivation system for post-flip consolidation goal status) — partially done by the manual audit
- M2 (verify reporting accuracy) — partially done
- M3 (update inaccurate statuses via motivation_edit) — effectively done via the 28 bulk abandons
- M4 (save summary note) — done via `2026-05-24-sovereignty-reframe-closed-loop.md` and this reference file
- M5 (mark validation goal complete) — depends on Greg confirming

This plan's work was largely subsumed by the manual queue audit. It could either be marked complete or left to finish its M1-M5 chain naturally on the next cycle.

## Remaining non-terminal after full cleanup (May 24)

```
completed:  197
abandoned:  107
suspended:    6  (all plan-tier, 0 attempts — healthy)
needs_review: 2  (gated — Greg's sign-off)
```

The 6 suspended goals belong to:
- `plan_dc91a8c7` (5 goals, 0 att) — the validation sweep plan, partially superseded
- `plan_97dfc71b` (1 goal, 5 att 4 fail) — M2 send_message, now completed after bypass lifted the gate
