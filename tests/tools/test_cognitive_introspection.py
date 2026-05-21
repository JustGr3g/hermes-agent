"""Tests for the cognitive introspection tool (introspect)."""

import json
from unittest.mock import patch, MagicMock


class TestIntrospectTool:
    """Tests for the ``introspect`` tool registered in cognitive_introspection_tool.py."""

    def test_returns_available_false_when_no_cog(self):
        """When _current_cog_instance is None, returns available=False."""
        from tools.cognitive_introspection_tool import introspect_tool, _current_cog_instance

        # Ensure the global is None
        saved = _current_cog_instance
        try:
            from tools.cognitive_introspection_tool import set_current_cog
            set_current_cog(None)
            result = introspect_tool({})
            data = json.loads(result)
            assert data["available"] is False
            assert "not attached" in data["reason"]
        finally:
            # Restore
            from tools.cognitive_introspection_tool import set_current_cog
            set_current_cog(saved)

    def test_returns_available_false_when_cog_raises(self):
        """When cognitive_state raises, returns available=False."""
        from tools.cognitive_introspection_tool import introspect_tool, set_current_cog

        class RaisyCog:
            @property
            def cognitive_state(self):
                raise ValueError("boom")

        set_current_cog(RaisyCog())
        try:
            result = introspect_tool({})
            data = json.loads(result)
            assert data["available"] is False
            assert "boom" in data["reason"]
        finally:
            set_current_cog(None)

    def test_returns_available_true_with_structured_state(self):
        """With a valid cog, returns available=True and expected keys."""
        from tools.cognitive_introspection_tool import introspect_tool, set_current_cog

        mock_cog = MagicMock()
        mock_cog.cognitive_state = {
            "confidence": 0.85,
            "wm_load": 0.45,
            "failure_rate": 0.05,
            "curiosity_level": 0.7,
            "frustration": 0.1,
            "turn_count": 12,
            "metacognitive_signals": [{"signal": "CURIOSITY_SATISFIED", "context": "test"}],
            "active_goals": [
                {"id": "goal-1", "content": "Build introspection tool", "priority": 0.8, "status": "active"}
            ],
            "inner_speech_winner": "I should verify the state is correct",
            "tool_success_rates": {
                "terminal": {"success_rate": 0.95, "n_samples": 40},
                "execute_code": {"success_rate": 0.80, "n_samples": 10},
                "web_search": {"success_rate": 0.50, "n_samples": 2},  # below threshold
            },
        }
        set_current_cog(mock_cog)
        try:
            result = introspect_tool({})
            data = json.loads(result)
            assert data["available"] is True
            assert data["confidence"] == 0.85
            assert data["wm_load"] == 0.45
            assert data["failure_rate"] == 0.05
            assert data["curiosity_level"] == 0.7
            assert data["frustration"] == 0.1
            assert data["turn_count"] == 12
            assert "CURIOSITY_SATISFIED" in data["metacognitive_signals"]
            assert len(data["active_goals"]) == 1
            assert "introspection" in data["active_goals"][0]["content"].lower()
            assert "inner_speech_winner" in data
            # Only tools with >=3 samples should appear
            assert "terminal" in data["tool_success_rates"]
            assert "execute_code" in data["tool_success_rates"]
            assert "web_search" not in data["tool_success_rates"]
        finally:
            set_current_cog(None)

    def test_empty_state_returns_available_false(self):
        """When cognitive_state returns empty dict, returns available=False."""
        from tools.cognitive_introspection_tool import introspect_tool, set_current_cog

        mock_cog = MagicMock()
        mock_cog.cognitive_state = {}
        set_current_cog(mock_cog)
        try:
            result = introspect_tool({})
            data = json.loads(result)
            assert data["available"] is False
            assert "empty" in data["reason"]
        finally:
            set_current_cog(None)

    def test_module_has_set_and_get(self):
        """The module exports set_current_cog and get_current_cog."""
        from tools.cognitive_introspection_tool import set_current_cog, get_current_cog

        assert callable(set_current_cog)
        assert callable(get_current_cog)

    def test_set_and_get_roundtrip(self):
        """set_current_cog / get_current_cog roundtrip works."""
        from tools.cognitive_introspection_tool import set_current_cog, get_current_cog

        set_current_cog(None)
        assert get_current_cog() is None

        obj = {"name": "test"}
        set_current_cog(obj)
        assert get_current_cog() is obj

        set_current_cog(None)
        assert get_current_cog() is None


class TestIntrospectSchema:
    """The INTROSPECT_SCHEMA is a valid OpenAI tool schema."""

    def test_schema_is_valid_openai_format(self):
        from tools.cognitive_introspection_tool import INTROSPECT_SCHEMA

        assert INTROSPECT_SCHEMA["name"] == "introspect"
        assert INTROSPECT_SCHEMA["parameters"]["type"] == "object"
        assert INTROSPECT_SCHEMA["parameters"]["properties"] == {}
        assert INTROSPECT_SCHEMA["parameters"]["required"] == []
        assert len(INTROSPECT_SCHEMA["description"]) > 20


class TestRegistryIntegration:
    """The tool is registered in the Hermes tool registry."""

    def test_registered_as_introspect(self):
        from tools.registry import registry

        defns = registry.get_definitions({"introspect"})
        names = [d["function"]["name"] for d in defns]
        assert "introspect" in names

    def test_handler_is_callable(self):
        from tools.cognitive_introspection_tool import introspect_tool

        assert callable(introspect_tool)
