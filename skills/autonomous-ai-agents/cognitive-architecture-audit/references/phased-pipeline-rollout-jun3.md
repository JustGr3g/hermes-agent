# Phased Pipeline Rollout — June 3, 2026

## Context

Greg asked for the plan and timeline to graduate the new Deliberate/Execute
pipeline from `shadow` to `live`. The pipeline (`deliberate.py` →
`execute_stage.py` → `simulate.py`) was fully wired and tested but dormant
at `off` mode. A parallel compose-resolution fallback
(`athena_compose_resolution` flag) existed for synthesis goals that had no
natural tool to fire.

## Actions taken

### 1. Pipeline set to shadow

```
INSERT INTO runtime_flags (key, value, updated_at)
VALUES ('athena_pipeline_enabled', 'shadow', ...)
```

Both flags then active: `athena_pipeline_enabled=shadow`,
`athena_compose_resolution=shadow`.

### 2. Pipeline set to live (same session)

After Greg confirmed, flipped to `live`. The old compose-resolution
fallback was now redundant — the pipeline handles synthesis goals via
Deliberator emitting `save_note` or `complete` intentions.

### 3. Compose resolution removed entirely

Greg asked if `athena_compose_resolution` was still needed. I assessed it
was dead code with pipeline in `live`, Greg said to clean it up.

Removed 4 code blocks in `cognitive_cycle.py`:

| # | What | Location (before) | Lines removed |
|---|------|-------------------|---------------|
| 1 | `_gather_compose_evidence`, `_attempt_compose`, `_log_compose_shadow` | Bottom of file (~2477-2540) | ~63 |
| 2 | Compose fallback call site (`if not tool_name:` block calling compose methods) | Middle (~1308-1333) | ~26 |
| 3 | `COMPOSE_FLAG`, `COMPOSE_MODES`, `_COMPOSE_MESSAGE_CUES` | Top (~52-72) | ~12 |
| 4 | `compose_resolution_mode()`, `_build_compose_deliverable()` | Top (~88-150) | ~62 |

**Order:** bottom → middle → top. Prevents line-number shifts from
invalidating anchor strings.

Also:
- Deleted `tests/cognition/test_compose_resolution.py` (89 lines, 9 tests)
- `DELETE FROM runtime_flags WHERE key = 'athena_compose_resolution'`
- Verified: 720/720 cognition tests passed, 61/61 pipeline-tool tests passed

**Stale reference cleaned (already done before this session):**
`calendar_list_events` removed from `_DRIVE_TOOL_FAMILIES` in
`deliberate.py:109` — was a dead entry after Google Workspace tools were
removed June 3.

## File sizes after cleanup

- `cognitive_cycle.py`: 2833 → 2741 lines (−92)
- `cognitive_agent.db`: `athena_compose_resolution` flag deleted

## Runtime state after

| Flag | Value |
|------|-------|
| `athena_pipeline_enabled` | `live` |
| `athena_compose_resolution` | *(deleted)* |

## Pitfalls encountered

None — the phased approach avoided any production impact. The shadow phase
would have caught selection diffs if present, but the pipeline had already
been verified end-to-end in the May 31 E2E probe.