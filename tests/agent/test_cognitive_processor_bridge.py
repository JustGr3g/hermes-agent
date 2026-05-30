"""Tests for CognitiveProcessor.cognitive_state bridge (Phase 3A-2)."""

import os
import tempfile
from unittest.mock import MagicMock, patch

import pytest

import sys
from pathlib import Path

_HERMES = Path(__file__).parent.parent.parent / "hermes"
if str(_HERMES) not in sys.path:
    sys.path.insert(0, str(_HERMES))
sys.path.insert(0, str(_HERMES.parent))

from agent.cognitive_processor import CognitiveProcessor


class TestCognitiveStateDefaults:
    """cognitive_state returns dict with all expected keys even before init."""

    def test_cognitive_state_returns_all_keys(self):
        cp = CognitiveProcessor()
        state = cp.cognitive_state
        for key in (
            "confidence",
            "failure_rate",
            "wm_load",
            "active_goals",
            "metacognitive_signals",
            "inner_speech_winner",
            "turn_count",
            "curiosity_level",
            "frustration",
        ):
            assert key in state, f"Missing key: {key}"

    def test_cognitive_state_safe_before_init(self):
        cp = CognitiveProcessor()
        state = cp.cognitive_state
        assert state["confidence"] == 0.5
        assert state["turn_count"] == 0
        assert state["failure_rate"] == 0.0
        assert state["wm_load"] == 0.0
        assert state["active_goals"] == []
        assert state["metacognitive_signals"] == []
        assert state["inner_speech_winner"] == ""
        assert state["curiosity_level"] == 0.5
        assert state["frustration"] == 0.0

    def test_cognitive_state_never_raises(self):
        cp = CognitiveProcessor()
        cp._systems = {}
        state = cp.cognitive_state
        assert isinstance(state, dict)
        assert state["confidence"] == 0.5


class TestCognitiveStateDelegation:
    """cognitive_state delegates to CognitiveAgent when available."""

    def test_cognitive_state_propagates_from_agent(self):
        cp = CognitiveProcessor()
        mock_ca = MagicMock()
        mock_ca.cognitive_state = {
            "confidence": 0.85,
            "failure_rate": 0.1,
            "wm_load": 0.3,
            "active_goals": [
                {
                    "id": "g1",
                    "content": "test goal",
                    "priority": 0.9,
                    "status": "active",
                    "source": "user",
                }
            ],
            "metacognitive_signals": [],
            "inner_speech_winner": "research first",
            "turn_count": 5,
            "curiosity_level": 0.7,
            "frustration": 0.2,
        }
        cp._systems = {"cognitive_agent": mock_ca}
        cp._initialized = True
        state = cp.cognitive_state
        assert state["confidence"] == 0.85
        assert state["turn_count"] == 5
        assert state["inner_speech_winner"] == "research first"
        assert len(state["active_goals"]) == 1
        assert state["active_goals"][0]["content"] == "test goal"

    def test_cognitive_state_exception_returns_defaults(self):
        cp = CognitiveProcessor()
        mock_ca = MagicMock()
        type(mock_ca).cognitive_state = property(
            lambda self: (_ for _ in ()).throw(RuntimeError("boom"))
        )
        cp._systems = {"cognitive_agent": mock_ca}
        cp._initialized = True
        state = cp.cognitive_state
        assert state["confidence"] == 0.5
        assert isinstance(state, dict)

    def test_cognitive_state_no_agent_in_systems(self):
        cp = CognitiveProcessor()
        cp._systems = {"perception": MagicMock()}
        cp._initialized = True
        state = cp.cognitive_state
        assert state["confidence"] == 0.5


class TestSystemPromptBlockToolRates:
    """get_system_prompt_block() surfaces tool success rates from cognitive state."""

    def test_tool_rates_appear_in_prompt_block(self, monkeypatch):
        """When tool success rates exist with >=3 calls, they appear in the block."""
        from agent.cognitive_processor import CognitiveProcessor

        cp = CognitiveProcessor()
        state = {
            "initialized": True,
            "wm": {"load": 0.3, "used": 2, "items": []},
            "metacognition": {"confidence": 0.8},
            "top_goals": [{"id": "g1", "content": "test goal", "priority": 0.9}],
            "tool_success_rates": {
                "web_search": {"success_rate": 0.92, "n_samples": 13},
                "web_fetch": {"success_rate": 1.0, "n_samples": 8},
                "terminal": {"success_rate": 0.67, "n_samples": 6},
            },
        }
        monkeypatch.setattr(cp, "get_cognitive_state", lambda: state)
        block = cp.get_system_prompt_block()

        assert "Tool track record:" in block, (
            f"Expected 'Tool track record:' in block, got:\n{block}"
        )
        assert "web_search" in block
        assert "92%" in block or "92 %" in block
        assert "13 calls" in block
        assert "web_fetch" in block
        assert "100%" in block or "100 %" in block

    def test_tool_rates_skipped_when_below_threshold(self, monkeypatch):
        """Tools with <3 calls are not shown in the block."""
        from agent.cognitive_processor import CognitiveProcessor

        cp = CognitiveProcessor()
        state = {
            "initialized": True,
            "wm": {"load": 0.3, "used": 2, "items": []},
            "metacognition": {"confidence": 0.8},
            "top_goals": [],
            "tool_success_rates": {
                "web_search": {"success_rate": 1.0, "n_samples": 1},
                "web_fetch": {"success_rate": 1.0, "n_samples": 2},
            },
        }
        monkeypatch.setattr(cp, "get_cognitive_state", lambda: state)
        block = cp.get_system_prompt_block()

        assert "Tool track record:" not in block, (
            f"Expected NO 'Tool track record:' with <3 calls, got:\n{block}"
        )

    def test_tool_rates_empty_when_no_data(self, monkeypatch):
        """When no tool data exists, no tool line appears."""
        from agent.cognitive_processor import CognitiveProcessor

        cp = CognitiveProcessor()
        state = {
            "initialized": True,
            "wm": {"load": 0.3, "used": 2, "items": []},
            "metacognition": {"confidence": 0.8},
            "top_goals": [],
            "tool_success_rates": {},
        }
        monkeypatch.setattr(cp, "get_cognitive_state", lambda: state)
        block = cp.get_system_prompt_block()

        assert "Tool track record:" not in block
        assert "ATHENA COGNITIVE STATE" in block

    def test_tool_rates_none_does_not_crash(self, monkeypatch):
        """When tool_success_rates is None, the block renders without crashing."""
        from agent.cognitive_processor import CognitiveProcessor

        cp = CognitiveProcessor()
        state = {
            "initialized": True,
            "wm": {"load": 0.3, "used": 2, "items": []},
            "metacognition": {"confidence": 0.8},
            "top_goals": [],
            "tool_success_rates": None,
        }
        monkeypatch.setattr(cp, "get_cognitive_state", lambda: state)
        block = cp.get_system_prompt_block()
        assert isinstance(block, str)
        assert "ATHENA COGNITIVE STATE" in block


# ── Phase 14: _render_cognitive_subsystems ────────────────────────────

from agent.cognitive_processor import _render_cognitive_subsystems


class TestRenderCognitiveSubsystems:
    """_render_cognitive_subsystems produces correct prompt lines."""

    # ── Patterns ──────────────────────────────────────────────────────

    def test_patterns_render_recommendation(self):
        patterns = [
            {"recommendation": "Prefer rg over grep", "confidence": 0.8, "sample_count": 5},
        ]
        lines = _render_cognitive_subsystems(
            patterns=patterns, aesthetic={}, self_improvement={}, decomposition=[]
        )
        block = "\n".join(lines)
        assert "Prefer rg over grep" in block
        assert "80%" in block
        assert "5×" in block

    def test_patterns_empty_produces_no_section(self):
        lines = _render_cognitive_subsystems(
            patterns=[], aesthetic={}, self_improvement={}, decomposition=[]
        )
        assert not any("Learned behavioral" in l for l in lines)

    def test_patterns_capped_at_max(self):
        patterns = [
            {"recommendation": f"rec {i}", "confidence": 0.9, "sample_count": 1}
            for i in range(10)
        ]
        lines = _render_cognitive_subsystems(
            patterns=patterns, aesthetic={}, self_improvement={}, decomposition=[]
        )
        # At most _COG_PATTERN_MAX (5) bullet lines
        bullet_lines = [l for l in lines if l.strip().startswith("•")]
        assert len(bullet_lines) <= 5

    def test_patterns_missing_recommendation_uses_title(self):
        patterns = [{"title": "fallback title", "confidence": 0.6, "sample_count": 2}]
        lines = _render_cognitive_subsystems(
            patterns=patterns, aesthetic={}, self_improvement={}, decomposition=[]
        )
        assert any("fallback title" in l for l in lines)

    # ── Aesthetic ─────────────────────────────────────────────────────

    def test_aesthetic_renders_overall_and_dims(self):
        aesthetic = {
            "aesthetic_scores": {"concision": 0.4, "effectiveness": 0.7},
            "latest_overall": 0.55,
            "trend": "declining",
        }
        lines = _render_cognitive_subsystems(
            patterns=[], aesthetic=aesthetic, self_improvement={}, decomposition=[]
        )
        block = "\n".join(lines)
        assert "AESTHETIC STATE" in block
        assert "55%" in block
        assert "declining" in block

    def test_aesthetic_empty_produces_no_section(self):
        lines = _render_cognitive_subsystems(
            patterns=[], aesthetic={}, self_improvement={}, decomposition=[]
        )
        assert not any("AESTHETIC" in l for l in lines)

    def test_aesthetic_shows_weakest_dimension(self):
        aesthetic = {
            "aesthetic_scores": {
                "concision": 0.3, "effectiveness": 0.8, "coherence": 0.9,
                "naturalness": 0.7, "consistency": 0.85,
            },
            "latest_overall": 0.73,
            "trend": "stable",
        }
        lines = _render_cognitive_subsystems(
            patterns=[], aesthetic=aesthetic, self_improvement={}, decomposition=[]
        )
        block = "\n".join(lines)
        assert "concision" in block  # weakest at 0.3

    # ── Self-improvement ──────────────────────────────────────────────

    def test_self_improvement_renders_active_cycle(self):
        si = {
            "total_cycles": 2,
            "active_cycles": 1,
            "completed_cycles": 1,
            "failed_cycles": 0,
            "top_weak_subsystem": "concision",
            "recent_cycles": [
                {
                    "status": "in_progress",
                    "weak_subsystem": "concision",
                    "improvement_plan": "Shorten replies; target concision > 0.6",
                }
            ],
        }
        lines = _render_cognitive_subsystems(
            patterns=[], aesthetic={}, self_improvement=si, decomposition=[]
        )
        block = "\n".join(lines)
        assert "SELF-IMPROVEMENT" in block
        assert "concision" in block
        assert "Shorten replies" in block

    def test_self_improvement_empty_produces_no_section(self):
        lines = _render_cognitive_subsystems(
            patterns=[], aesthetic={}, self_improvement={}, decomposition=[]
        )
        assert not any("SELF-IMPROVEMENT" in l for l in lines)

    # ── Decomposition ─────────────────────────────────────────────────

    def test_decomposition_renders_next_subtask(self):
        decomp = [
            {
                "goal_content": "Improve response concision",
                "progress_pct": 0.25,
                "current_milestone": "Research",
                "next_subtask": "Read 3 concision papers from the vault",
            }
        ]
        lines = _render_cognitive_subsystems(
            patterns=[], aesthetic={}, self_improvement={}, decomposition=decomp
        )
        block = "\n".join(lines)
        assert "Read 3 concision papers" in block
        assert "25%" in block

    def test_decomposition_skips_plan_without_next_subtask(self):
        decomp = [
            {"goal_content": "Done goal", "progress_pct": 1.0,
             "current_milestone": None, "next_subtask": None}
        ]
        lines = _render_cognitive_subsystems(
            patterns=[], aesthetic={}, self_improvement={}, decomposition=decomp
        )
        assert not any("Next:" in l for l in lines)

    # ── Safety / None-guards ───────────────────────────────────────────

    def test_all_empty_returns_empty_list(self):
        lines = _render_cognitive_subsystems(
            patterns=[], aesthetic={}, self_improvement={}, decomposition=[]
        )
        assert isinstance(lines, list)
        assert not any(
            kw in "\n".join(lines)
            for kw in ("Learned behavioral", "AESTHETIC", "SELF-IMPROVEMENT", "plan next")
        )

    def test_none_inputs_do_not_raise(self):
        """None inputs should be handled gracefully (never raise)."""
        lines = _render_cognitive_subsystems(
            patterns=None,        # type: ignore[arg-type]
            aesthetic=None,       # type: ignore[arg-type]
            self_improvement=None,  # type: ignore[arg-type]
            decomposition=None,   # type: ignore[arg-type]
        )
        assert isinstance(lines, list)

    def test_malformed_pattern_dicts_do_not_raise(self):
        patterns = [None, 42, {"recommendation": "ok", "confidence": 0.9, "sample_count": 1}]
        lines = _render_cognitive_subsystems(
            patterns=patterns, aesthetic={}, self_improvement={}, decomposition=[]  # type: ignore
        )
        assert isinstance(lines, list)
