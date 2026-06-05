# Morning Brief — Disabled

## History

The morning brief was a proactive notification system built into the cognitive architecture (`cognitive_agent/brief.py`). It fired on Greg's first Telegram message after a ≥4h gap of inactivity, sending a preamble before Athena's normal reply.

## How It Worked

- **Trigger**: Every inbound message via `/cognitive/augment` calls `Agent.maybe_send_morning_brief()`
- **Gap check**: `brief.should_fire_brief()` compares last-brief timestamp against 4-hour threshold
- **Data gathering**: `brief.build_morning_brief()` runs SQL queries against `athena_memory.db`:
  - `needs_review` — goals flagged by completion-verifier or staleness sweeper
  - `new_suspensions` — goals that genuinely failed (plan-tier siblings excluded)
  - `queued_plan_steps` — plan-tier siblings parked by design (healthy)
  - `retriaged_active` — goals unsuspended by auto-retriage
  - `heartbeat_new_errors` — handler error-count deltas
  - `force_proposed` — system-seeded goals since last brief
  - `anomaly` — synth: event spikes vs 7-day baseline
- **Rendering**: `brief.render_brief()` is a pure function of `BriefData` — no LLM, no I/O
- **Delivery**: Calls `tools.execute("send_message", ...)` with `goal_id: "ambient:morning_brief"`

## Why It Was Disabled

The brief was factually accurate (pure SQL, zero fabrication risk) but surfaced **internal cognitive-architecture telemetry** that Greg has no use for. Needs-review counts, suspension details, plan-step queues, and verifier hit rates are machinery internals — useful to the agent, noise to the user.

**Lesson**: factual accuracy does not equal usefulness. The content class itself was wrong.

## Disable Implementation

`cognitive_agent/agent.py` — `maybe_send_morning_brief()` replaced with a 2-line stub:

```python
def maybe_send_morning_brief(self) -> dict:
    """Morning brief permanently disabled per Greg 2026-05-22."""
    return {"sent": False, "reason": "disabled_by_user", "preview": None}
```

The `brief.py` module (`cognitive_agent/brief.py`) and all its tests remain untouched — only the call site was stubbed.

## Reversal (if ever needed)

Remove the stub and uncomment/restore the original method body. The `brief.py` query functions and `BriefData` dataclass are still fully functional.
