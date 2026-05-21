"""Tests for Phase 2B-2: signal-driven memory extraction.

Verifies that the memory nudge block in run_conversation() checks ATHENA's
metacognitive signals (CORRECTED, GOAL_COMPLETION, CURIOSITY_SATISFIED) in
addition to the timer-based fallback, and that signal-driven review fires
regardless of timer state.
"""

from __future__ import annotations

from typing import Any

from pathlib import Path


_SENTINEL = object()


def _run_nudge_block(
    memory_nudge_interval: int = 10,
    turns_since_memory: int = 0,
    cog_last_cog: dict | None = None,
    has_cog: bool = True,
    valid_tool_names: set | None = None,
    memory_store: Any = _SENTINEL,
    quiet_mode: bool = False,
) -> dict:
    """Replicate the signal + timer memory nudge block from run_agent.py."""
    if valid_tool_names is None:
        valid_tool_names = {"memory"}
    if memory_store is _SENTINEL:
        memory_store = object()

    _should_review_memory = False
    _signal_review = False
    _signal_review_reason = ""

    if has_cog and cog_last_cog is not None:
        meta = cog_last_cog.get("metacognition", {}) or {}
        metacog_signal = meta.get("signal", "")
        if metacog_signal in ("CORRECTED", "GOAL_COMPLETION"):
            _signal_review = True
            _signal_review_reason = metacog_signal.lower()
        recent_signals = meta.get("recent_signals", [])
        for sig in recent_signals or []:
            sig_name = sig.get("signal", "") if isinstance(sig, dict) else ""
            if sig_name in ("CORRECTED", "GOAL_COMPLETION", "CURIOSITY_SATISFIED"):
                _signal_review = True
                _signal_review_reason = sig_name.lower()
                break

    if memory_nudge_interval > 0 and "memory" in valid_tool_names and memory_store:
        turns_since_memory += 1
        if turns_since_memory >= max(memory_nudge_interval * 2, 20):
            _should_review_memory = True
            turns_since_memory = 0

    if _signal_review and "memory" in valid_tool_names and memory_store:
        _should_review_memory = True
        turns_since_memory = 0

    return {
        "_should_review_memory": _should_review_memory,
        "_signal_review": _signal_review,
        "_signal_review_reason": _signal_review_reason,
        "_turns_since_memory": turns_since_memory,
    }


# ── Signal-path tests ──────────────────────────────────────────────


def test_corrected_signal_triggers_review():
    cog = {"metacognition": {"signal": "CORRECTED"}}
    result = _run_nudge_block(cog_last_cog=cog, turns_since_memory=1)
    assert result["_should_review_memory"] is True
    assert result["_signal_review_reason"] == "corrected"


def test_goal_completion_signal_triggers_review():
    cog = {"metacognition": {"signal": "GOAL_COMPLETION"}}
    result = _run_nudge_block(cog_last_cog=cog, turns_since_memory=1)
    assert result["_should_review_memory"] is True
    assert result["_signal_review_reason"] == "goal_completion"


def test_curiosity_satisfied_in_recent_signals_triggers_review():
    cog = {"metacognition": {"recent_signals": [{"signal": "CURIOSITY_SATISFIED"}]}}
    result = _run_nudge_block(cog_last_cog=cog)
    assert result["_should_review_memory"] is True
    assert result["_signal_review_reason"] == "curiosity_satisfied"


def test_signals_in_recent_signals_array():
    cog = {
        "metacognition": {
            "recent_signals": [
                {"signal": "LOW_CONFIDENCE"},
                {"signal": "CORRECTED"},
            ]
        }
    }
    result = _run_nudge_block(cog_last_cog=cog)
    assert result["_should_review_memory"] is True
    assert result["_signal_review_reason"] == "corrected"


def test_non_signal_metacognition_does_not_trigger_review():
    cog = {"metacognition": {"confidence": 0.9, "signal": "NORMAL"}}
    result = _run_nudge_block(cog_last_cog=cog, turns_since_memory=1)
    assert result["_should_review_memory"] is False
    assert result["_signal_review_reason"] == ""


def test_signal_fires_early_not_waiting_for_timer():
    cog = {"metacognition": {"signal": "CORRECTED"}}
    result = _run_nudge_block(cog_last_cog=cog, turns_since_memory=1)
    assert result["_should_review_memory"] is True
    # Timer was also reset
    assert result["_turns_since_memory"] == 0


def test_signal_resets_timer_counter():
    cog = {"metacognition": {"signal": "GOAL_COMPLETION"}}
    result = _run_nudge_block(
        cog_last_cog=cog,
        turns_since_memory=15,
        memory_nudge_interval=10,
    )
    assert result["_should_review_memory"] is True
    assert result["_turns_since_memory"] == 0


# ── Timer-path tests (fallback safety net) ─────────────────────────


def test_timer_fires_at_doubled_interval():
    with_twenty = _run_nudge_block(memory_nudge_interval=10, turns_since_memory=19)
    assert with_twenty["_should_review_memory"] is True
    assert with_twenty["_turns_since_memory"] == 0

    at_nineteen = _run_nudge_block(memory_nudge_interval=10, turns_since_memory=18)
    assert at_nineteen["_should_review_memory"] is False
    assert at_nineteen["_turns_since_memory"] == 19


def test_timer_floor_is_20_even_for_small_intervals():
    result = _run_nudge_block(memory_nudge_interval=1, turns_since_memory=19)
    assert result["_should_review_memory"] is True
    assert result["_turns_since_memory"] == 0

    below = _run_nudge_block(memory_nudge_interval=1, turns_since_memory=18)
    assert below["_should_review_memory"] is False
    assert below["_turns_since_memory"] == 19


def test_timer_respects_zero_interval_disabled():
    result = _run_nudge_block(memory_nudge_interval=0, turns_since_memory=50)
    assert result["_should_review_memory"] is False
    assert result["_turns_since_memory"] == 50  # not incremented


def test_timer_noop_when_memory_not_in_valid_tool_names():
    result = _run_nudge_block(valid_tool_names=set(), turns_since_memory=50)
    assert result["_should_review_memory"] is False
    assert result["_turns_since_memory"] == 50  # not incremented


def test_timer_noop_when_no_memory_store():
    result = _run_nudge_block(memory_store=None, turns_since_memory=50)
    assert result["_should_review_memory"] is False
    assert result["_turns_since_memory"] == 50


# ── No-ATHENA sessions (no cog) ──────────────────────────────────


def test_no_cog_uses_only_timer():
    result = _run_nudge_block(
        has_cog=False,
        cog_last_cog=None,
        memory_nudge_interval=10,
        turns_since_memory=19,
    )
    assert result["_should_review_memory"] is True
    assert result["_signal_review"] is False


def test_cog_is_none_falls_back_to_timer():
    result = _run_nudge_block(
        has_cog=True,
        cog_last_cog=None,
        memory_nudge_interval=10,
        turns_since_memory=19,
    )
    assert result["_should_review_memory"] is True
    assert result["_signal_review"] is False


# ── Edge cases ─────────────────────────────────────────────────────


def test_empty_metacognition_dict():
    cog = {"metacognition": {}}
    result = _run_nudge_block(cog_last_cog=cog, turns_since_memory=1)
    assert result["_should_review_memory"] is False
    assert result["_signal_review"] is False


def test_signal_without_memory_in_toolset_does_not_review():
    cog = {"metacognition": {"signal": "CORRECTED"}}
    result = _run_nudge_block(
        cog_last_cog=cog,
        valid_tool_names=set(),
        memory_store=object(),
        turns_since_memory=1,
    )
    assert result["_should_review_memory"] is False
    assert result["_signal_review"] is True


def test_signal_without_memory_store_does_not_review():
    cog = {"metacognition": {"signal": "CORRECTED"}}
    result = _run_nudge_block(
        cog_last_cog=cog,
        memory_store=None,
        turns_since_memory=1,
    )
    assert result["_should_review_memory"] is False
    assert result["_signal_review"] is True


def test_non_dict_recent_signals_item_skipped():
    cog = {"metacognition": {"recent_signals": ["NON_DICT"]}}
    result = _run_nudge_block(cog_last_cog=cog)
    assert result["_should_review_memory"] is False
    assert result["_signal_review"] is False


def test_signal_and_timer_both_ready():
    cog = {"metacognition": {"signal": "CORRECTED"}}
    turns = max(10 * 2, 20) + 1
    result = _run_nudge_block(cog_last_cog=cog, turns_since_memory=turns)
    assert result["_should_review_memory"] is True
    # Timer was reset by signal path
    assert result["_turns_since_memory"] == 0


# ── Source-code smoke test ─────────────────────────────────────────


def test_production_code_contains_signal_block():
    """Smoke test: confirm the Phase 2B signal-driven block is actually
    wired into run_conversation(). If someone reverts it, the inline
    tests above still pass — this fails them awake.
    """
    src = Path(__file__).resolve().parents[2] / "run_agent.py"
    content = src.read_text(encoding="utf-8")
    assert "Signal-triggered memory review" in content
    assert "metacog_signal" in content
    assert "recent_signals" in content
    assert "CORRECTED" in content
    assert "GOAL_COMPLETION" in content
