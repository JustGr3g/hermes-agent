# GoalDecomposer — Phase 13H #1 Implementation (May 16, 2026)

## Module
`cognitive_agent/cognition/goal_decomposer.py` (477 lines)

## Architecture
```
GoalDecomposer.decompose(goal_id, goal_content, goal_type, horizon, success_criteria, learned_patterns)
  → DecompositionPlan
     ├── milestones: list[Milestone]   (named checkpoints)
     ├── subtasks: list[Subtask]       (units of work with dependency chains)
     ├── current_milestone → Milestone | None
     ├── next_subtask → Subtask | None  (first pending with satisfied deps)
     ├── progress_pct → float          (0.0–1.0)
     ├── advance_subtask(id) → None    (marks complete, reconciles milestone)
     └── block_subtask(id, reason) → None (marks blocked, notes appended)
```

## Templates
| goal_type | Milestones |
|-----------|-----------|
| project | Research → Design → Implement → Test → Deliver (5) |
| capability | Learn → Practice → Validate → Integrate (4) |
| ritual | Setup → Execute → Review → Record (4) |
| experiment | Hypothesize → Design → Run → Analyze → Conclude (5) |

Unknown type defaults to project.

## Content-Aware Subtask Generation
The `_decompose_content_for_milestone()` function detects keywords in goal content:
- `code`/`implement`/`build`: generates research, design, implementation, testing, documentation subtasks
- `research`/`investigate`/`learn`: generates scope, gather, synthesize, document, review subtasks
- `write`/`document`/`create`: generates outline, draft, review, polish, deliver subtasks
- Generic fallback: milestone prefix + "(step 1)", "(step 2)"

## Dependency Chains
`_build_dependencies()` creates a linear chain:
- Within a milestone: subtask N depends on subtask N-1
- Across milestones: milestone M's first subtask depends on milestone M-1's last subtask
- This ensures sequential execution: you can't start milestone 2 until milestone 1 finishes

## Horizon Factor
Controls subtask density per milestone:
| horizon | max_subtasks/milestone |
|---------|----------------------|
| now | 1 |
| short_term | 2 |
| medium_term | 3 |
| long_term | 4 |

## Pattern Awareness
Learned patterns from #2 adjust decomposition:
- `tool_failure_condition` patterns → verification subtasks added to milestone 3+ (Testing/Validation)
- `strategy_mismatch` patterns → review subtasks added to milestone 0 (Research)

## Wiring Points
- **Init**: `agent.py:582` — `self.goal_decomposer = GoalDecomposer(db_path=self.config.db_path)` after pattern_learner
- **Cognitive state**: `agent.py:5058` — `get_status()["decomposition_plans"]` via `goal_decomposer.get_all_active_plans()`
- **No heartbeat yet**: No automatic decomposition of new goals — that'll come in #6 (Self-Improvement Loop)

## Test Statistics
- 30 tests in `tests/cognition/test_goal_decomposer.py`
- 7 DecompositionPlan unit tests (empty plan, dependencies, advance, milestones, progress, block, serialization)
- 15 GoalDecomposer integration tests (all 4 templates, patterns, horizon, CRUD, content keywords, reasoning)
- 4 edge case tests (empty content, max subtasks, success criteria, multiple plans)
- All pass in 0.06s
