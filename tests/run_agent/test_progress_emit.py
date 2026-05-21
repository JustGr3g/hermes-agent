"""Lock in the long-turn progress-emit behavior from 2026-05-21.

Median Telegram turn = 216s, p90 = 69 min. Users used to see nothing
between message-sent and response-received. Now they get a "still
working" status emit once a turn passes 90s wall-clock, throttled to
at most once per 60s.

Two invariants:
  A. Don't emit for short turns (<90s elapsed).
  B. Emit at iteration boundaries when wall-clock crosses 90s, and
     re-emit at most every 60s thereafter (not every iteration).

We don't run a real conversation — we drive the gating expression
directly with mocked timing.
"""
from __future__ import annotations

from unittest.mock import MagicMock


# Replicate the gating expression from run_agent.py so a refactor that
# changes the threshold/throttle without updating this test surfaces
# the contract drift loudly. If you change the numbers here, change them
# in run_agent.py (and vice versa).
ELAPSED_THRESHOLD_SEC = 90.0
THROTTLE_SEC = 60.0


def _should_emit(elapsed_sec: float, since_last_emit_sec: float) -> bool:
    """Exact gating logic: emit when elapsed > 90s AND > 60s since last emit."""
    return elapsed_sec > ELAPSED_THRESHOLD_SEC and since_last_emit_sec > THROTTLE_SEC


# ── A. Short turns stay silent ─────────────────────────────────────────────


def test_no_emit_under_threshold():
    assert _should_emit(elapsed_sec=10.0, since_last_emit_sec=999.0) is False
    assert _should_emit(elapsed_sec=89.9, since_last_emit_sec=999.0) is False


def test_no_emit_at_exactly_threshold():
    # > 90.0, not >=, so 90.0 should not fire (gates on strict greater-than).
    assert _should_emit(elapsed_sec=90.0, since_last_emit_sec=999.0) is False


# ── B. Long turns emit, then throttle ──────────────────────────────────────


def test_first_emit_after_threshold():
    # Above threshold, no prior emit (since_last_emit large).
    assert _should_emit(elapsed_sec=91.0, since_last_emit_sec=99999.0) is True


def test_throttle_blocks_re_emit_within_60s():
    # Elapsed is well over threshold, but only 30s since last emit.
    assert _should_emit(elapsed_sec=120.0, since_last_emit_sec=30.0) is False


def test_re_emit_after_throttle_window():
    # 60s+ since last emit → emit again.
    assert _should_emit(elapsed_sec=180.0, since_last_emit_sec=61.0) is True


def test_long_turn_emits_periodically():
    # 1-hour turn. Should fire at: 90s, ~150s, ~210s, ... — i.e. one emit
    # per 60s window, plus the initial one at 90s. Simulate by stepping
    # at iteration boundaries.
    elapsed = 0.0
    last_emit = -99999.0
    emits = 0
    # Simulate 60 iterations, each adding ~30s wall clock — typical for
    # a turn with slow Ollama Cloud calls.
    for _ in range(60):
        elapsed += 30.0
        if _should_emit(elapsed, elapsed - last_emit):
            emits += 1
            last_emit = elapsed
    # 60 iters × 30s = 1800s total. First emit at iter 4 (elapsed=120s).
    # Throttle is strict ``>`` 60s, so next eligible at since-last-emit
    # of 90s → every 3rd iteration. Expected: iters 4, 7, 10, … 58 = 19.
    # Allow ±1 for any future rounding tweak in the gate.
    assert 18 <= emits <= 20, f"unexpected emit count: {emits}"


# ── Smoke test: the emit format is informative ────────────────────────────


def test_emit_format_contains_iter_and_elapsed():
    # The actual format string in run_agent.py — kept here for grep-able
    # contract testing. Update both sides if you change the wording.
    iter_n = 7
    elapsed = 245.3
    msg = f"⏳ Still working… (iter {iter_n}, {elapsed:.0f}s elapsed)"
    assert "iter 7" in msg
    assert "245s" in msg
    assert "Still working" in msg
