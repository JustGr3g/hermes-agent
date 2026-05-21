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
