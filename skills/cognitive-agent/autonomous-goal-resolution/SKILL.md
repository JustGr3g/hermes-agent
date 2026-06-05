---
name: autonomous-goal-resolution
description: "What the cognitive cycle does when a goal cannot dispatch a tool — compose-resolution pipeline (grounded synthesis), stuck_cycle intervention, and no_tool_resolution reflection fallback. Also covers the Deliberate/Execute tool-selection pipeline (athena_pipeline_enabled) which shares the off/shadow/live flag pattern."
category: cognitive-agent
version: 1.0.0
triggers:
  - "no_tool_resolution"
  - "goal won't resolve to a tool"
  - "compose resolution"
  - "stuck cycle"
  - "compose-resolution"
  - "athena_compose_resolution"
  - "athena_pipeline_enabled"
  - "pipeline shadow"
  - "shadow mode compose"
  - "shadow mode pipeline"
  - "non-tool goal"
  - "reflection fallback for goals"
  - "grounded synthesis"
  - "compose deliverable"
  - "Deliberate/Execute pipeline"
  - "Deliberate stage"
  - "Execute stage"
  - "simulate_and_gate"
  - "executor stage"
  - "P3 pipeline"
  - "P4 simulation gate"
  - "P5 drive coupling"
  - "graduation plan pipeline"
metadata:
  hermes:
    tags: [cognitive-cycle, compose-resolution, goal-resolution, synthesis]
    related_skills: [fix-completion-detection, self-audit-cognitive-autonomy]
---

# Autonomous Goal Resolution

When the cognitive cycle processes a self-proposed goal and **no tool can be selected** to make progress on it, the goal enters the `no_tool_resolution` failure path. Three fallback strategies handle this case instead of silently burning attempts.

## Strategy 1: Compose-Resolution Pipeline (primary)

For goals whose deliverable is reasoning + writing (not a tool call), the compose-resolution pipeline produces a grounded synthesis from memory evidence and routes it to `save_note` or `send_message`.

### Architecture

Controlled by a runtime flag (`athena_compose_resolution`) with three modes:

| Mode | Behavior | Risk |
|------|----------|------|
| `off` | No compose pass — goal immediately records a `no_tool_resolution` failure | Goals die silently |
| `shadow` | Runs the compose pass + logs what it WOULD emit, but still records a failure | Safe for inspection |
| `live` | Runs compose pass, dispatches the deliverable via save_note/send_message, records as success | Low (notes only) |

## Sister Mechanism: Deliberate/Execute Tool-Selection Pipeline

A **separate** pipeline governed by the same off/shadow/live flag pattern, but addressing a different problem: replacing the legacy `augmented_target → tool_dispatcher.resolve` path with a structured deliberation that selects tools based on goals, drive state, self-model, and recent outcomes.

| Runtime flag | Purpose | Defined at | Shadow flipped |
|---|---|---|---|
| `athena_compose_resolution` | Grounded synthesis for no-tool goals | cognitive_cycle.py:63 | 2026-06-02 |
| `athena_pipeline_enabled` | Structured tool selection via Deliberate/Execute | deliberate.py:48 | 2026-06-03 |

The pipeline includes: Deliberator (goal + drive → Intention), Simulation Gate (veto/re-deliberate loop), Executor (args composition), and P5 Drive Coupling (tool bias by drive state). See `references/shadow-flip-pipeline-2026-06-03.md` for full architecture, wire points, and shadow logging format.

### Files

- `cognitive_agent/cognition/cognitive_cycle.py`:
  - `COMPOSE_FLAG` (line 63): `"athena_compose_resolution"` — runtime flag key
  - `COMPOSE_MODES` (line 64): `("off", "shadow", "live")`
  - `compose_resolution_mode(agent)` (line 75): resolves the flag to a mode string
  - `_build_compose_deliverable()` (line 87): the grounded synthesis LLM call
  - `_attempt_compose()` (line 2416): gathers evidence + calls _build_compose_deliverable
  - `_log_compose_shadow()` (line 2436): shadow-mode logging
  - Invocation at line 1304-1329: between tool selection failure and no_tool_resolution recording

### _build_compose_deliverable Flow

1. Receives `goal_content` and `evidence` (list of `{ref, text}` from memory)
2. Builds a prompt with goal content, evidence, and synthesis instructions
3. Calls `minimax-m3:cloud` (hardcoded model, cognitive_cycle.py:120 — switched from kimi-k2.6:cloud 2026-06-02) with temperature 0.3, max 400 tokens
4. **Groundedness gate** — the synthesis MUST:
   - Be ≥ 60 characters
   - Not contain "NOGROUND" in the first 40 characters
   - Cite at least one evidence `[ref]` tag
   - If any condition fails → returns `None` (preserves no_tool_resolution failure)
5. Routes deliverable based on goal content:
   - If goal contains Telegram cues → `send_message` (to Greg)
   - Otherwise → `save_note` (title from goal content, category "synthesis")

### Evidence Gathering

`_gather_compose_evidence()` at line 2384:
- Retrieves from episodic memory using goal content as query
- Limit: 8 items
- Formats as `[ref] text` pairs for the LLM prompt
- Returns empty list → compose is skipped (no evidence to ground on)

### Switching to Live Mode

```python
# Via runtime flag (requires CognitiveAgent instance)
agent.set_runtime_flag("athena_compose_resolution", "shadow")  # or "live"
```

Or direct SQLite:
```python
import sqlite3, time
conn = sqlite3.connect(db_path, timeout=10, isolation_level=None)
conn.execute("""
    INSERT INTO runtime_flags (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
""", ("athena_compose_resolution", "shadow", time.time()))
conn.close()
```

### Assessment (from 2026-06-02)

**Safeguards are well-designed:**
- Groundedness gate (≥60 chars, cites refs, no NOGROUND)
- Telegram cues are conservative — only route to send_message when goal explicitly names Telegram/greg/message
- Shadow mode logs without dispatching — zero risk for inspection
- Evidence-limited: compose is skipped entirely if no memory evidence is available

**Real risk:** plausible-sounding nonsense that passes the gate (cites real refs but wrong interpretation). Low blast-radius — writes a `synthesis` note in the vault, doesn't execute code.

**Recommendation for first use:** Run in `shadow` for 3-7 days, inspect logged outputs, then flip to `live` if 80%+ look reasonable.

## Strategy 2: Stuck_Cycle Handler (last resort)

When a goal accumulates `no_tool_resolution` failures, the stuck_cycle handler (`cognitive_cycle.py:1860-1930`) fires:

1. **Detection:** `_consecutive_skips` counter reaches `_MAX_CONSECUTIVE_SKIPS` (hardcoded constant)
2. **Action:** Calls `agent.motivation.abandon_goal()` with the goal ID
3. **Logging:** Logs a warning with attempt count, skip count, and reason
4. **Reset:** Resets `_consecutive_skips = 0` immediately to prevent double-fire

This prevents goals that will *never* resolve from burning budget indefinitely. The cycle can then pick up a different goal.

## Strategy 3: Reflection Fallback

When compose-resolution is `off` (or all strategies fail), `_record_reflection_step()` at line 2449 fires:

- Records an `Episode` with content `[SELF] reflected on goal '{goal.content}' — {note}`
- Importance: 0.3 (deliberately low — reflections shouldn't crowd retrieval)
- Tags: `source_kind=SELF`, `self_step_type=reflection`, includes goal_id
- The reflection is counted as a **failed attempt** (no progress made on the goal)

The failure counting is deliberate (2026-05-01 fix): previous code counted reflection as `success=True` ("we did SOMETHING, just no tool fired"), which let abstract goals like "Improve cognitive architecture" loop indefinitely (observed: 374 attempts before manual abandonment).

## Priority of Fallback Strategies

1. **Compose-resolution (shadow or live)** — tried first, before recording failure
2. **Stuck_cycle abandon** — fires after `_MAX_CONSECUTIVE_SKIPS` consecutive skips
3. **Reflection fallback** — records a reflection episode + failure count increment

## Comparison to fix-completion-detection

| | compose-resolution | completion-detection |
|---|---|---|
| **Problem** | Goal can't dispatch any tool | Goal dispatches tools but is never recognized as done |
| **Mechanism** | Grounded synthesis from memory | Cumulative content + LLM detector + success-criteria matcher |
| **Outcome** | Produces a deliverable (note/message) | Marks existing work as complete |
| **Code location** | Lines 1304-1360, 2384-2473 | Lines 300-400, 2100-2200, 800-950 |

## Runtime Flag Inspection

```python
rec = agent.get_runtime_flag("athena_compose_resolution")
# Returns {'value': 'shadow', 'updated_at': ts} or None
```

## Pitfalls

- **Compose prompt uses minimax-m3:cloud (switched from kimi-k2.6:cloud 2026-06-02)** (cognitive_cycle.py:120). If that model becomes unavailable or the client isn't configured, compose silently returns None. No fallback model.
- **Evidence scope is limited.** `_gather_compose_evidence` retrieves only 8 items from episodic memory. If the goal requires vault content or file reads, the evidence won't include them.
- **Telegram cue matching is keyword-based** (cognitive_cycle.py:69-71). Phrases like "telegram greg" or "tell greg" match. More subtle phrasing ("let him know", "update him on") will route to save_note.
- **Live mode is irreversible per-flag.** Once you flip to `live`, every `no_tool_resolution` goal tries to compose and deliver. There's no per-goal opt-out. Shadow first.
- **Shadow mode still counts as a failure.** The goal still records `no_tool_resolution` and increments attempt count. Shadow only prevents dispatch — it doesn't prevent the goal from eventually being exhausted.