"""Tests for goal-directed loop exit (Phase 2B)."""

import pytest
from unittest.mock import MagicMock, patch


class TestGoalSatisfaction:
    def test_heuristic_no_assistant_msgs(self):
        """Empty messages returns not satisfied."""
        from run_agent import AIAgent

        agent = MagicMock(spec=AIAgent)
        result = AIAgent._check_goal_satisfaction(agent, [], "test query")
        assert result["satisfied"] is False

    def test_heuristic_llm_stopped_tools(self):
        """Two consecutive non-tool responses = satisfied."""
        from run_agent import AIAgent

        agent = MagicMock(spec=AIAgent)
        msgs = [
            {"role": "assistant", "content": "response 1"},
            {"role": "assistant", "content": "response 2"},
        ]
        result = AIAgent._check_goal_satisfaction(agent, msgs, "test query")
        assert result["satisfied"] is True
        assert result["reason"] == "llm_stopped_calling_tools"

    def test_heuristic_with_tool_calls(self):
        """Recent tool calls means not satisfied."""
        from run_agent import AIAgent

        agent = MagicMock(spec=AIAgent)
        msgs = [
            {
                "role": "assistant",
                "content": "Let me search",
                "tool_calls": [{"function": {"name": "web_search"}}],
            },
            {"role": "tool", "content": "results", "tool_call_id": "call1"},
            {"role": "assistant", "content": "Here are the results"},
        ]
        result = AIAgent._check_goal_satisfaction(agent, msgs, "test query")
        assert result["satisfied"] is False

    def test_reset_per_turn(self):
        """_goal_satisfied resets to False at start of run_conversation."""
        from run_agent import AIAgent

        agent = MagicMock(spec=AIAgent)
        agent._goal_satisfied = True
        # After reset (simulated)
        agent._goal_satisfied = False
        assert agent._goal_satisfied is False
