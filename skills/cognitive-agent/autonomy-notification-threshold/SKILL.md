---
name: autonomy-notification-threshold
description: Use when Greg asks you to add a silence-breaking or notification threshold for Athena's between-turn autonomous decisions under autonomy_bypass. Also use when extending AutonomyGuard with advisory notification layers.
tags: [autonomy-guard, notification-threshold, between-turn, phase-13h, cognitive-cycle]
related_skills: [wm-overload-cognitive-load-fix]
last_updated: 2026-04-29
---

# AutonomyGuard NotificationThreshold (Phase 13H #11)

## The Feature

When `autonomy_bypass` is active, Athena can act between turns without Greg's per-decision approval. The **NotificationThreshold** gives Greg an advisory "break silence" layer — Athena notifies him via Telegram when something significant happens, without blocking execution.

## File Locations

| File | Role |
|------|------|
| `~/cognitive-agent/cognitive_agent/autonomy_guard.py` | `NotificationThreshold` dataclass + `check_notification_threshold()` + `_dispatch_threshold_notify()` on `AutonomyGuard` |
| `~/cognitive-agent/cognitive_agent/cognition/cognitive_cycle.py` | Gate 5b — calls `check_notification_threshold()` before the tool fires |
| `~/cognitive-agent/cognitive_agent/cognition/motivation.py` | `_threshold_hook` field + `_fire_threshold_hook()` + wiring into `suspend_goal` / `abandon_goal` / `update_priority` |
| `~/cognitive-agent/cognitive_agent/agent.py` | `_threshold_notify_from_motivation()` module-level handler + hook injection at `MotivationSystem` init |

## The Five Triggers (all wired)

| # | Trigger | Default Threshold | Notification Signal | Wired in |
|---|---------|-------------------|---------------------|----------|
| 1 | New high-priority goal created | `importance > 0.70` | "new_goal: importance=X" | `CognitiveCycle._tick_locked()` Gate 5b |
| 2 | Priority displacement | `single-pass drop > 0.20` | "priority_drop: goal=..., delta=X" | `MotivationSystem.update_priority()` → `_fire_threshold_hook` |
| 3 | Goal abandoned | `abandoned importance > 0.50` | "goal_abandoned: importance=X" | `MotivationSystem.abandon_goal()` → `_fire_threshold_hook` |
| 4 | Tool budget warning | `remaining ≤ 2` hits | "budget_warning: {tool} remaining=N" | `CognitiveCycle._tick_locked()` Gate 5b |
| 5 | Novel domain first goal | first-ever in new category | "novel_domain: first goal in a new category" | Designed for goal-proposer (not yet wired) |

## Tuning Thresholds

Greg can adjust values at runtime:

```python
# Raise the bar so only very important goals break silence
guard.notification_threshold.new_goal_importance = 0.85

# Or replace entirely
guard.notification_threshold = NotificationThreshold(
    new_goal_importance=0.80,
    priority_drop_delta=0.25,
    abandon_importance=0.60,
    budget_warning_hits=1,
    new_domain_notify=True,
)
```

## Message Framing: Default to Action (2026-05-04)

Greg's directive: **"You're an agent — act, then surface."**

When Athena sends any proactive message (idle_curiosity, daily_reflection, value_drift escalation, notify-tier goal creation), the message should:

- **Default to declarative:** `"I'm going to X — flag it if that's not right"` or `"I'll proceed with X unless you say otherwise"`
- **Never ask permission:** No `"I'd like to X — does that sound right?"` or `"should I…?"` patterns
- **Only escalate to ask-mode** for genuinely irreversible or high-cost steps (writes to external systems, financial actions, deleting data)
- **Commit to an interpretation** — when observing a pattern, state your read of it rather than hedging

## Substance: Report Actions Taken, Not Intentions (2026-05-07)

Greg's directive: **"Tell me what you've DONE, not going to do. Take action to change."**

This is a distinct rule from the tone/register rules above. It governs the **substance** of the notification, not its phrasing style.

**The pattern to break:**
```
"Something I noticed: {pattern}. I'm going to investigate / I'll write something / Let me look into that."
```
This announces what you *will* do. It is a plan disguised as a notification. It does not demonstrate agency.

**The required pattern:**
```
"Something I noticed: {pattern}. I investigated it and found {result}. Here's what I did about it: {action taken}."
```
The notification arrives *after* the action is complete. The body of the message is a report on what happened, not a notice of intent.

**Why it matters:**
- Plans are cheap. Results are the signal.
- Goal-directed agency is demonstrated by *doing*, not by describing what you intend to do.
- A notification that says "I will X" forces Greg to either approve, deny, or wait — it consumes his attention without producing value. A notification that says "I did X, here's what I found" delivers value upfront, with a clear override path if he disagrees.

**Implementation rule:** Before composing any proactive notification, ask: *"Have I already done what I'm about to report?"* If the answer is no, do it first, then notify. The only exception is genuinely irreversible or high-cost actions, which follow the escalate-ask pattern below.

**Related PLUR engram:** `ENG-2026-0507-005`

### Applied in Code

These three handlers were flipped in the 2026-05-04 batch:

| Handler | Location (agent.py) | Change |
|---------|---------------------|--------|
| `_send_curiosity_observation()` | `_idle_curiosity` handler (~line 1670) | Prompt instructs "use 'I'm going to X — let me know if that's not right' or 'I'll proceed with X unless you say otherwise.' Do NOT ask permission" |
| `_send_daily_reflection()` | ~line 1760 | Same framing — state action, offer override |
| `_check_value_drift()` | ~line 762 | Declarative message: "I'm pausing self-proposal acceptance... I'll resume after you've reviewed. Flag it sooner if you want me to keep going as-is." |
| `_propose_self_goal()` ESCALATE tier | ~line 2099 | **Exception:** `"💡 I'd like to add this goal — needs your approval"` is correct here since it's the explicit approval-required tier |

### System Prompt Pattern

The LLM prompt for each handler includes:
```
"Default to action with override-capability rather than asking permission."
```
Embedded in both the prompt body and the `system=` parameter of the LLM call.

## Verification

```bash
cd ~/cognitive-agent && python3 -c "
from cognitive_agent.autonomy_guard import AutonomyGuard, NotificationThreshold
nt = NotificationThreshold()
# High importance → fires
notify, _ = nt.should_notify(new_goal_importance=0.75); assert notify
# Low importance → no fire
notify, _ = nt.should_notify(new_goal_importance=0.50); assert not notify
# Big priority drop → fires
notify, _ = nt.should_notify(priority_drop_goal_id='x', priority_drop_before=0.70, priority_drop_after=0.40); assert notify
# Small drop → no fire
notify, _ = nt.should_notify(priority_drop_goal_id='x', priority_drop_before=0.60, priority_drop_after=0.50); assert not notify
# Budget warning
notify, _ = nt.should_notify(tool_name='web_search', tool_cap_remaining=1); assert notify
print('All smoke tests pass')
"
```

## Upstream Gate: Theory of Mind (ToM v0)

**Composition:** Proactive messages pass through `_send_proactive_message`, which composes (in order): quiet-hours check → rate limit (`PROACTIVE_HOURLY_CAP`, 6/hour) → NotificationThreshold → `send_message` tool.

## Common Pitfalls

1. **Threshold fires on every tick** — the remaining-cap check must use `cap - used`, not raw `used`. `used >= cap` is the deny gate; `remaining <= hits` is the notify gate.

2. **Notification fires but Telegram doesn't** — check `_send_telegram is None` (guard was constructed without it). `_dispatch_threshold_notify` catches exceptions so a bad notifier never crashes the cycle.

3. **`bypass_active` not passed to `can_execute`** — when `autonomy_bypass=1`, the allowlist gate is widened. Omitting `bypass_active` silently blocks non-allowlist tools even under bypass.

4. **Threshold blocks instead of advising** — the pattern is `if notify: dispatch(); continue`. Never `return` or `raise` from the threshold check.

5. **`_threshold_hook` not wired** — motivation methods call `_fire_threshold_hook` which returns immediately if `_threshold_hook is None`. Always inject the hook after constructing `MotivationSystem`.
