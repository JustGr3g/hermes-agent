# ToM Threshold Calibration — May 11, 2026

## Context

The `unavailable` attention state threshold in `tom.py` was 1.10 — an impossible-to-clear value (importance caps at 1.0). This meant every proactive message generated during a >4h gap was silently discarded.

Observed proactive message importance was consistently 0.60–0.75 across May 8-11, based on TOM gate-block telemetry reported in daily summaries. System was generating Telegram-ready hypotheses but delivering zero.

## Calibration Sequence

| Step | Who | Value | Reasoning |
|------|-----|-------|-----------|
| Original | Greg (Sprint 2) | 1.10 | Conservative: nothing disturbs unavailable user |
| First adjustment | Greg (sometime May 11) | 0.85 | Saw daily summary data, lowered manually |
| Final target | Athena (per discussion) | 0.70 | Matches FOCUSED-level bar; catches 0.60-0.75 range; filters sub-0.50 noise |

## The Feedback Loop

The 0.70 value is intentionally stated as a starting point, not a final calibration. The mechanism is:

1. Athena sends pings at `importance >= 0.70` when Greg is unavailable (long gap)
2. Greg either engages, ignores, or says "not now"
3. Based on response, threshold adjusts:
   - Unwanted pings → raise threshold
   - Missed valuable insights → lower it
   - Right-frequency engagement patterns → lock the value

This means the TOM threshold is now explicitly meant to be dynamic, tuned by observed response patterns rather than set once.

## Audit Trail

The change to `tom.py` includes inline comments documenting the provenance:
```python
# 2026-05-11: lowered from 1.10 → 0.85 (Greg) → 0.70 (Athena,
# per discussion). The original 1.10 blocked everything. 0.85
# still blocks most (imp 0.60-0.75 was the observed range). 0.70
# is the calibration target: catches everything I've actually
# wanted to say recently while still filtering noise (sub-0.50).
# Intent: start here, tune based on Greg's feedback to each ping.
```

## What This Means for the Gate

| ToM State | Threshold | Effect |
|-----------|-----------|--------|
| available | 0.40 | Almost anything fires |
| interruptible | 0.60 | Medium+ importance |
| focused | 0.85 | Only high-importance |
| unavailable | **0.70** | What was previously blocked now gets through |

The practical effect: most proactive messages the system generates (scoring 0.60-0.75) will now reach Greg when he's in a long gap. The gate is open enough to matter while still filtering noise.
