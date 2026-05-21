"""
Cognitive introspection tool — mid-turn query of ATHENA cognitive state.

Allows the LLM to call ``introspect`` during a turn to get a fresh snapshot
of its own cognitive state: confidence, WM load, active goals, metacognitive
signals, frustration, curiosity, inner speech history, and the latest
narrative self-model.

Pattern: module-level ``_current_cog_instance``, set by AIAgent.__init__,
so the tool handler can reach the CognitiveProcessor without needing a
run_agent import or agent-arg plumbing. Same pattern as
model_tools._last_resolved_tool_names.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional
from tools.registry import registry

logger = logging.getLogger(__name__)

# Module-level reference — set by AIAgent.__init__ when a CognitiveProcessor
# is attached.  Tools read this to return live cognitive state without
# coupling to run_agent.py's internals.
_current_cog_instance: Any = None  # Optional[CognitiveProcessor]


def set_current_cog(cog) -> None:
    """Stash the active CognitiveProcessor for introspection tools.

    Called by AIAgent.__init__ after attaching the processor.
    """
    global _current_cog_instance
    _current_cog_instance = cog


def get_current_cog():
    """Return the stashed CognitiveProcessor, or None."""
    return _current_cog_instance


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
    "parameters": {
        "type": "object",
        "properties": {},
        "required": [],
    },
}


def introspect_tool(args: dict, **kwargs) -> str:
    """Handle the ``introspect`` invocation.

    Pulls state from the module-level _current_cog_instance.
    Falls back gracefully when no CognitiveProcessor is attached.
    """
    cog = _current_cog_instance
    if cog is None:
        return json.dumps({
            "available": False,
            "reason": "ATHENA cognitive systems not attached to this agent.",
        })

    try:
        state = cog.cognitive_state
    except Exception as e:
        logger.debug("[introspect] cognitive_state failed: %s", e)
        return json.dumps({
            "available": False,
            "reason": f"cognitive_state unavailable: {e}",
        })

    if not state:
        return json.dumps({
            "available": False,
            "reason": "cognitive_state returned empty.",
        })

    # Build a clean, compact result
    result = {"available": True}
    result["confidence"] = state.get("confidence", 0.5)
    result["wm_load"] = state.get("wm_load", 0.0)
    result["failure_rate"] = state.get("failure_rate", 0.0)
    result["curiosity_level"] = state.get("curiosity_level", 0.5)
    result["frustration"] = state.get("frustration", 0.0)
    result["turn_count"] = state.get("turn_count", 0)

    signals = state.get("metacognitive_signals", [])
    result["metacognitive_signals"] = [
        s.get("signal", "") for s in signals[:5]
    ]

    goals = state.get("active_goals", [])
    result["active_goals"] = [
        {
            "id": g.get("id", "")[:8],
            "content": g.get("content", "")[:80],
            "priority": g.get("priority", 0.5),
            "status": g.get("status", ""),
        }
        for g in goals[:5]
    ]

    result["inner_speech_winner"] = state.get("inner_speech_winner", "")[:120]

    tool_rates = state.get("tool_success_rates", {})
    result["tool_success_rates"] = {
        name: data.get("success_rate", 0.5)
        for name, data in tool_rates.items()
        if data.get("n_samples", 0) >= 3
    }

    # Try loading the latest narrative self-model for richer introspection
    try:
        from cognitive_agent.self_model import get_latest_self_model
        from pathlib import Path
        _db = str(Path.home() / "athena_memory.db")
        sm = get_latest_self_model(_db)
        if sm and sm.get("content"):
            result["latest_self_model"] = sm["content"][:200]
            result["self_model_age_hours"] = max(
                0, round((sm.get("generated_at", 0) if "generated_at" in sm else 0), 0)
            )
    except Exception:
        pass

    return json.dumps(result, default=str)


# --- Registry ---
registry.register(
    name="introspect",
    toolset="cognition",
    schema=INTROSPECT_SCHEMA,
    handler=introspect_tool,
    emoji="🧠",
)
