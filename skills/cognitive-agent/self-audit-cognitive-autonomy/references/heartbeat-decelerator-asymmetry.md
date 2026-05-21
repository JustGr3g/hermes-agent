# Heartbeat Handler Decelerator Asymmetry — 2026-05-06

## The Observation

During an idle/no-goal window in session `87cb0b90` (2026-05-06 15:00–17:00 UTC):

| Handler | Firings | Effective Interval |
|---------|---------|-------------------|
| `reactivate_memory` | 12 | ~10 min (always fired) |
| `pursue_goal_step` | 4 | ~30 min (after decelerator) |

Ratio: **3:1** — but not because `reactivate_memory` does more work. Both handlers complete in ~10–50ms when idle. The ratio exists because one has a no-goal decelerator and the other doesn't.

## Telemetry Proof

```json
// Session 87cb0b90 — raw telemetry events
{"ts":"2026-05-06T14:59:28.688051+00:00","type":"athena.reactivate_memory","boosted_count":2}
{"ts":"2026-05-06T15:09:29.339218+00:00","type":"athena.reactivate_memory","boosted_count":2}
{"ts":"2026-05-06T15:19:30.103458+00:00","type":"athena.reactivate_memory","boosted_count":2}
{"ts":"2026-05-06T15:22:30.398233+00:00","type":"athena.pursue_goal_step","fired":false,"skipped_reason":"no_top_goal_focus_only"}
{"ts":"2026-05-06T15:29:31.303422+00:00","type":"athena.reactivate_memory","boosted_count":1}
{"ts":"2026-05-06T15:39:32.805490+00:00","type":"athena.reactivate_memory","boosted_count":1}
{"ts":"2026-05-06T15:49:34.260449+00:00","type":"athena.reactivate_memory","boosted_count":1}
{"ts":"2026-05-06T15:52:34.686522+00:00","type":"athena.pursue_goal_step","fired":false,"skipped_reason":"no_top_goal_focus_only"}
{"ts":"2026-05-06T15:59:53.616342+00:00","type":"athena.reactivate_memory","boosted_count":1}
{"ts":"2026-05-06T16:09:55.076969+00:00","type":"athena.reactivate_memory","boosted_count":1}
{"ts":"2026-05-06T16:19:56.558960+00:00","type":"athena.reactivate_memory","boosted_count":1}
{"ts":"2026-05-06T16:22:57.004586+00:00","type":"athena.pursue_goal_step","fired":false,"skipped_reason":"no_top_goal_focus_only"}
{"ts":"2026-05-06T16:29:58.034443+00:00","type":"athena.reactivate_memory","boosted_count":1}
{"ts":"2026-05-06T16:39:59.533983+00:00","type":"athena.reactivate_memory","boosted_count":1}
{"ts":"2026-05-06T16:50:00.910401+00:00","type":"athena.reactivate_memory","boosted_count":1}
{"ts":"2026-05-06T16:53:01.292896+00:00","type":"athena.pursue_goal_step","fired":false,"skipped_reason":"no_top_goal_focus_only"}
```

## The Code (before fix)

**pursue_goal_step** had a decelerator at `agent.py:685-695`:
```python
if not self.motivation.get_top_goals(n=1):
    self._no_goal_skip_count = getattr(self, '_no_goal_skip_count', 0) + 1
    if self._no_goal_skip_count < 6:
        return  # skip 5/6 ticks
    self._no_goal_skip_count = 0
```

**reactivate_memory** had NO decelerator — fired every 10 min regardless.

## The Fix (applied 2026-05-06)

Mirrored the exact same pattern into `_reactivate_memory` (agent.py:729-741):
```python
if not self.motivation.get_top_goals(n=1):
    self._reactivate_skip_count = getattr(self, '_reactivate_skip_count', 0) + 1
    if self._reactivate_skip_count < 6:
        return
    self._reactivate_skip_count = 0
else:
    self._reactivate_skip_count = 0
```

Now both handlers decelerate identically during no-goal periods. When goals exist, both fire at their configured intervals.

## The Lesson

Maintenance event frequency is not a measure of effort. Before inferring priority from event distribution:
1. Check that all comparable handlers have comparable throttles
2. Check the code, don't just count signals
3. If one handler has a skip-counter and another doesn't, the ratio is noise
