# Mid-Turn Introspection Pattern

Introduced May 15, 2026. The `introspect` tool lets the LLM query its own cognitive state mid-turn — confidence, WM load, active goals, metacognitive signals, frustration, curiosity, inner speech winner, tool success rates, and the latest narrative self-model.

## Architecture

```
tools/cognitive_introspection_tool.py
  - Module-level _current_cog_instance (Optional[CognitiveProcessor])
  - set_current_cog(cog) — called by AIAgent.__init__
  - introspect_tool(args, **kwargs) → JSON string
  - Registered as "introspect" in toolset "cognition"

run_agent.py (AIAgent.__init__, ~line 1079)
  - After self._cog = cognitive_processor:
      from tools.cognitive_introspection_tool import set_current_cog
      set_current_cog(self._cog)
```

## Tool Schema

```python
INTROSPECT_SCHEMA = {
    "name": "introspect",
    "description": (
        "Query your own cognitive state mid-turn. Returns a structured snapshot "
        "of current confidence, working memory load, active goals, metacognitive "
        "signals, frustration level, curiosity level, recent inner speech "
        "utterances, and the latest narrative self-model. "
        "Use this when you need to decide how to proceed — e.g., 'am I confident "
        "enough to act?' or 'should I simplify because WM is overloaded?' or "
        "'what was I thinking about earlier?' "
        "Takes no arguments — just returns current state."
    ),
    "parameters": {"type": "object", "properties": {}, "required": []},
}
```

## Response Format

```json
{
  "available": true,
  "confidence": 0.85,
  "wm_load": 0.32,
  "failure_rate": 0.05,
  "curiosity_level": 0.7,
  "frustration": 0.1,
  "turn_count": 12,
  "metacognitive_signals": ["GOAL_COMPLETION"],
  "active_goals": [{"id": "abc12345", "content": "Review test results", ...}],
  "inner_speech_winner": "I should verify the output before sending...",
  "tool_success_rates": {"terminal": 0.92, "search": 0.88},
  "latest_self_model": "I've been focused on cognitive improvements this week...",
  "self_model_age_hours": 3
}
```

## Graceful Degradation

- No CognitiveProcessor attached → `{"available": false, "reason": "ATHENA cognitive systems not attached to this agent."}`
- cognitive_state() raises → returns error reason
- Narrative self-model loads via `cognitive_agent.self_model.get_latest_self_model()` — fails silently on import or DB errors