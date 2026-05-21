"""Tests for ATHENA cognitive state serialization/deserialization (Phase 2A)."""

import json
import pytest
from agent.cognitive_processor import CognitiveProcessor


class TestBridgeStateEmpty:
    """A fresh CognitiveProcessor with no cog state."""

    def test_bridge_state_empty(self):
        """A fresh processor returns empty string."""
        cp = CognitiveProcessor()
        assert cp.bridge_state == ""

    def test_load_empty_jsons(self):
        """Loading empty, null, or invalid JSON is a no-op (not a crash)."""
        cp = CognitiveProcessor()
        cp.load_cog_state("")
        cp.load_cog_state(None)  # type: ignore[arg-type]
        cp.load_cog_state("not valid json")
        assert cp._last_cog is None

    def test_none_bridge_state(self):
        """bridge_state is also empty when _last_cog is None."""
        cp = CognitiveProcessor()
        assert cp._last_cog is None
        assert cp.bridge_state == ""


class TestBridgeStateRoundTrip:
    """Test that serialize → deserialize preserves key fields."""

    def test_serialized_structure(self):
        """Manually set _last_cog and verify bridge_state output."""
        cp = CognitiveProcessor()
        cp._last_cog = {
            "session_id": "ses_test123",
            "inner_speech_winner": "I should research more",
            "goals": [{"content": "audit codebase", "priority": 0.8}],
            "aspirations": [{"id_short": "asp001", "summary": "become AGI"}],
            "metacognition": {"confidence": 0.75},
            "wm": {"load": 0.4, "items": ["item1"]},
            "greg_profile_excerpt": "Greg is...",
            "self_disclosure": {"text": "I feel uncertain"},
            "time_context": {"phase": "active-hours"},
            "autonomy_bypass": {"on": True},
        }
        raw = cp.bridge_state
        assert raw, "bridge_state should not be empty"
        data = json.loads(raw)

        # Verify expected keys
        assert data["session_id"] == "ses_test123"
        assert data["inner_speech_winner"] == "I should research more"
        assert len(data["goals"]) == 1
        assert data["confidence"] == 0.75
        assert data["autonomy_bypass"]["on"] is True

        # Round trip: deserialize into a fresh processor
        cp2 = CognitiveProcessor()
        cp2.load_cog_state(raw)
        assert cp2._last_cog is not None
        assert cp2._last_cog["inner_speech_winner"] == "I should research more"
        assert cp2._last_cog["metacognition"]["confidence"] == 0.75
        # Goals stored in _last_cog under "goals"
        assert len(cp2._last_cog["goals"]) == 1

    def test_bridge_state_handles_none_nested(self):
        """None values inside nested dicts don't break serialization."""
        cp = CognitiveProcessor()
        cp._last_cog = {
            "session_id": "ses_none_test",
            "inner_speech_winner": "",
            "goals": [],
            "aspirations": [],
            "metacognition": None,
            "wm": None,
            "greg_profile_excerpt": None,
            "self_disclosure": None,
            "time_context": None,
            "autonomy_bypass": None,
        }
        raw = cp.bridge_state
        data = json.loads(raw)
        # Should degrade gracefully to empty/defaults
        assert data.get("confidence", 0.5) == 0.5

    def test_multiple_deserialize_same_state(self):
        """Deserializing the same bridge state twice is idempotent."""
        cp = CognitiveProcessor()
        cp._last_cog = {
            "session_id": "ses_multi",
            "inner_speech_winner": "winner",
            "goals": [{"content": "test"}],
            "aspirations": [],
            "metacognition": {"confidence": 0.6},
            "wm": {},
            "greg_profile_excerpt": "",
            "self_disclosure": {},
            "time_context": {},
            "autonomy_bypass": {},
        }
        raw = cp.bridge_state
        cp2 = CognitiveProcessor()
        cp2.load_cog_state(raw)
        cp2.load_cog_state(raw)  # second load — should not error
        assert cp2._last_cog["inner_speech_winner"] == "winner"

    def test_inner_speech_arc_roundtrip(self):
        """Full inner speech arc survives serialize → deserialize → load_cog_state."""
        cp = CognitiveProcessor()
        arc = [
            {"type": "reflection", "content": "Let me think about this", "tone": "neutral"},
            {"type": "deliberation", "content": "I should trace the code path first", "tone": "analytical"},
            {"type": "goal_verbal", "content": "Phase 3C needs the arc to persist", "tone": "focused"},
        ]
        cp._last_cog = {
            "session_id": "ses_arc_test",
            "inner_speech_winner": "Phase 3C needs the arc to persist",
            "inner_speech_arc": arc,
            "goals": [],
            "aspirations": [],
            "metacognition": {"confidence": 0.8},
            "wm": {},
            "greg_profile_excerpt": "",
            "self_disclosure": {},
            "time_context": {},
            "autonomy_bypass": {},
        }
        raw = cp.bridge_state
        data = json.loads(raw)
        assert "inner_speech_arc" in data
        assert data["inner_speech_arc"] == arc
        assert data["inner_speech_winner"] == "Phase 3C needs the arc to persist"
        # Deserialize into a fresh processor
        cp2 = CognitiveProcessor()
        cp2.load_cog_state(raw)
        assert cp2._last_cog is not None
        assert cp2._last_cog["inner_speech_arc"] == arc
        assert cp2._last_cog["inner_speech_winner"] == "Phase 3C needs the arc to persist"

    def test_bridge_state_prev_arc_preserved(self):
        """prev_inner_speech_arc in cog dict survives bridge round trip."""
        cp = CognitiveProcessor()
        cp._last_cog = {
            "session_id": "ses_prev_arc",
            "inner_speech_winner": "current winner",
            "inner_speech_arc": [{"type": "narration", "content": "current arc", "tone": "neutral"}],
            "prev_inner_speech_arc": [
                {"type": "reflection", "content": "prior thought", "tone": "neutral"},
                {"type": "deliberation", "content": "prior analysis", "tone": "analytical"},
            ],
            "goals": [],
            "aspirations": [],
            "metacognition": {"confidence": 0.7},
            "wm": {},
            "greg_profile_excerpt": "",
            "self_disclosure": {},
            "time_context": {},
            "autonomy_bypass": {},
        }
        raw = cp.bridge_state
        data = json.loads(raw)
        assert data["inner_speech_winner"] == "current winner"
        # Deserialize and verify prev arc preserved
        cp2 = CognitiveProcessor()
        cp2.load_cog_state(raw)
        assert cp2._last_cog["inner_speech_arc"] is not None
