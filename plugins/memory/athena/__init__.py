"""ATHENA Memory Provider — Cognitive Memory plugin for Hermes.

Provides episodic + associative memory retrieval for the ATHENA cognitive agent.
Follows the Hermes MemoryProvider interface (honcho plugin pattern).

Three tools exposed:
  - athena_recall:      Unified episodic + associative retrieval
  - athena_episodic:    Raw episodic memory query
  - athena_context:     Spreading activation context for related concepts

Config: Uses ATHENA_OLLAMA_API_KEY env var or
        ~/.openclaw/openclaw.json → models.providers.ollama-cloud.apiKey
"""

from __future__ import annotations

import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from agent.memory_provider import MemoryProvider
from cognitive_agent.ollama_client import OllamaClient, get_api_key as _get_athena_key

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tool schemas
# ---------------------------------------------------------------------------

RECALL_SCHEMA = {
    "name": "athena_recall",
    "description": (
        "Retrieve memories from ATHENA's cognitive memory system. "
        "Searches both episodic memory (what happened, when, and why) and "
        "associative memory (conceptually related information via spreading activation). "
        "Returns ranked results combining temporal and conceptual relevance."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "What to recall. Natural language query.",
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of results (default 5, max 20).",
            },
            "time_range": {
                "type": "string",
                "description": (
                    "Optional time filter. Examples: '1h', '24h', '7d', '30d'. "
                    "Omit for all time."
                ),
            },
        },
        "required": ["query"],
    },
}

EPISODIC_SCHEMA = {
    "name": "athena_episodic",
    "description": (
        "Query ATHENA's episodic memory directly. Returns raw episode records "
        "with timestamps, emotional tags, and causal links. "
        "Use for time-based queries (what happened when)."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "What episodes to find.",
            },
            "since": {
                "type": "string",
                "description": "ISO timestamp or relative time (e.g., '2025-01-01', '3d').",
            },
            "limit": {
                "type": "integer",
                "description": "Max results (default 10).",
            },
        },
        "required": ["query"],
    },
}

CONTEXT_SCHEMA = {
    "name": "athena_context",
    "description": (
        "Get spreading-activation context from ATHENA's associative memory. "
        "Given seed concepts, returns related concepts and their association strengths. "
        "Use for expanding context around a topic."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "concepts": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Seed concepts to activate spreading retrieval.",
            },
            "depth": {
                "type": "integer",
                "description": "Spreading depth (default 2, max 3).",
            },
            "threshold": {
                "type": "number",
                "description": "Minimum activation threshold (default 0.3).",
            },
        },
        "required": ["concepts"],
    },
}


# ---------------------------------------------------------------------------
# AthenaMemoryProvider
# ---------------------------------------------------------------------------

class AthenaMemoryProvider(MemoryProvider):
    """ATHENA cognitive memory — episodic + associative retrieval.

    Integrates with the cognitive_agent memory system to provide
    structured recall, episodic queries, and spreading activation context.

    Key API mappings (cognitive_agent vs what we expose to Hermes tools):
      self._ca.retrieval.retrieve(...)  →  athena_recall tool
      self._ca.episodic.get_recent(...)  →  athena_episodic tool
      ollama_client.spreading_activation(...)  →  athena_context tool
    """

    def __init__(self):
        self._ca: Optional[Any] = None  # CognitiveAgent instance
        self._ollama: Optional[OllamaClient] = None
        self._db_path: Optional[Path] = None
        self._initialized = False

    @property
    def name(self) -> str:
        return "athena"

    def is_available(self) -> bool:
        """Check if ATHENA's memory database exists and the cognitive agent can load."""
        try:
            # Database presence check
            db_path = Path.home() / "athena_memory.db"
            cog_path = Path.home() / "cognitive-agent" / "cognitive_agent"
            if db_path.exists() or cog_path.exists():
                return True
            # Also available if cognitive_agent module can be imported
            from cognitive_agent.agent import CognitiveAgent  # noqa: F401
            return True
        except ImportError:
            logger.debug("cognitive_agent module not available — athena plugin inactive")
            return False
        except Exception:
            return False

    def initialize(self, session_id: str, **kwargs) -> None:
        """Initialize ATHENA cognitive memory for this session.

        Creates the CognitiveAgent (which initializes episodic SQLite + associative
        networkx memory) and the OllamaClient for cognitive LLM calls.
        """
        try:
            from cognitive_agent.agent import AgentConfig, CognitiveAgent

            # OllamaClient for cognitive LLM calls (saliency, inner speech, prediction)
            # Use the same key resolution as cognitive_agent — cognitive_agent/ollama_client.py
            # is the canonical source for ATHENA's API key, with priority:
            #   1. ATHENA_OLLAMA_API_KEY env var
            #   2. ~/.openclaw/openclaw.json → models.providers.minimax.apiKey
            #   3. ~/.openclaw/openclaw.json → models.providers.ollama-cloud.apiKey
            try:
                api_key = _get_athena_key()
            except ValueError:
                api_key = None
            self._ollama = OllamaClient(api_key=api_key) if api_key else None

            # CognitiveAgent: uses AgentConfig, not raw kwargs
            db = Path.home() / "athena_memory.db"
            self._db_path = db
            cfg = AgentConfig(
                db_path=str(db),
                ollama_client=self._ollama,
                session_id=session_id,
            )
            self._ca = CognitiveAgent(config=cfg)
            self._initialized = True
            logger.info("[ATHENA] MemoryProvider initialized for session=%s", session_id)

        except ImportError as e:
            logger.debug("[ATHENA] cognitive_agent not importable: %s", e)
        except Exception as e:
            logger.warning("[ATHENA] MemoryProvider init failed: %s", e)
            self._ca = None

    def system_prompt_block(self) -> str:
        """Return system prompt text describing ATHENA memory availability."""
        if not self._initialized or not self._ca:
            return ""
        return (
            "# ATHENA Cognitive Memory\n"
            "Active. Episodic and associative memory retrieval is available.\n"
            "Use athena_recall for unified memory search, "
            "athena_episodic for time-based episode queries, "
            "athena_context for spreading activation around concepts."
        )

    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        """Return tool schemas for ATHENA memory tools."""
        if not self._initialized:
            return []
        return [RECALL_SCHEMA, EPISODIC_SCHEMA, CONTEXT_SCHEMA]

    def _tool_error(self, message: str) -> str:
        """Format a tool error response."""
        return json.dumps({"error": message})

    def handle_tool_call(self, tool_name: str, args: dict, **kwargs) -> str:
        """Route ATHENA memory tool calls to the correct cognitive system."""
        if not self._initialized or not self._ca:
            return self._tool_error("ATHENA memory is not available for this session.")

        try:
            if tool_name == "athena_recall":
                return self._handle_recall(args)
            elif tool_name == "athena_episodic":
                return self._handle_episodic(args)
            elif tool_name == "athena_context":
                return self._handle_context(args)
            return self._tool_error(f"Unknown ATHENA tool: {tool_name}")
        except Exception as e:
            logger.error("[ATHENA] tool %s failed: %s", tool_name, e)
            return self._tool_error(f"ATHENA {tool_name} failed: {e}")

    def _handle_recall(self, args: dict) -> str:
        """athena_recall: unified retrieval across episodic + associative."""
        query = args.get("query", "")
        if not query:
            return self._tool_error("Missing required parameter: query")
        max_results = min(int(args.get("max_results", 5)), 20)

        # CognitiveAgent.retrieval.retrieve() is the correct API
        result = self._ca.retrieval.retrieve(
            context={"query": query, "session_id": self._ca.session_id},
            affective_state={"valence": 0.5, "arousal": 0.5},
            limit=max_results,
        )
        # result is a RetrievalResult — serialize items
        items = []
        for item in (result.items if hasattr(result, "items") else []):
            if hasattr(item, "__dict__"):
                items.append(vars(item) if hasattr(item, "__dict__") else {})
            else:
                items.append(item)
        return json.dumps({
            "query": query,
            "count": len(items),
            "items": items,
        }, default=str)

    def _handle_episodic(self, args: dict) -> str:
        """athena_episodic: raw episodic query by time or content."""
        query = args.get("query", "")
        if not query:
            return self._tool_error("Missing required parameter: query")
        limit = min(int(args.get("limit", 10)), 50)

        # CognitiveAgent.episodic.get_recent() is the correct API
        # (query parameter is used as a free-text filter)
        episodes = self._ca.episodic.get_recent(limit=limit)
        results = []
        for ep in episodes:
            if hasattr(ep, "__dict__"):
                results.append(vars(ep))
            else:
                results.append(ep)
        return json.dumps({
            "query": query,
            "count": len(results),
            "episodes": results,
        }, default=str)

    def _handle_context(self, args: dict) -> str:
        """athena_context: spreading activation over associative memory."""
        concepts = args.get("concepts", [])
        if not concepts:
            return self._tool_error("Missing required parameter: concepts")
        depth = min(int(args.get("depth", 2)), 3)
        threshold = float(args.get("threshold", 0.3))

        # Use OllamaClient.spreading_activation over the networkx graph
        if self._ollama is None:
            return self._tool_error("Ollama client not available for spreading activation.")
        graph = self._ca.associative.graph()
        activations = self._ollama.spreading_activation(
            concept_graph=graph,
            seed_concepts=concepts,
            depth=depth,
            threshold=threshold,
        )
        return json.dumps({
            "seed_concepts": concepts,
            "activations": activations,
        }, default=str)

    def prefetch(self, query: str, *, session_id: str = "") -> str:
        """Pre-fetch goals and motivation state before a turn.

        Returns a lightweight context block for injection into the system prompt.
        """
        if not self._initialized or not self._ca:
            return ""

        try:
            goals = self._ca.motivation.get_active_goals(limit=5)
            if not goals:
                return ""
            lines = ["## ATHENA Active Goals"]
            for g in goals:
                # Goal is a dataclass; serialize to dict first
                g_dict = g.to_dict() if hasattr(g, "to_dict") else g
                status = g_dict.get("status", "active")
                importance = g_dict.get("importance", 0.5)
                content = g_dict.get("content", str(g))
                lines.append(f"- [{status}] {content} (importance: {importance:.1f})")
            return "\n".join(lines)
        except Exception as e:
            logger.debug("[ATHENA] prefetch failed: %s", e)
            return ""

    def sync_turn(self, user_content: str, assistant_content: str, *, session_id: str = "") -> None:
        """Record a conversation turn in episodic memory."""
        if not self._initialized or not self._ca:
            return

        try:
            from cognitive_agent.agent import Episode
            import uuid

            # Store user turn
            ep_user = Episode(
                id=str(uuid.uuid4()),
                session_id=session_id or self._ca.session_id,
                timestamp=time.time(),
                content=user_content,
                emotional_tags={"valence": 0.5},
                importance=0.5,
            )
            self._ca.episodic.store(ep_user)

            # Store assistant turn
            ep_asst = Episode(
                id=str(uuid.uuid4()),
                session_id=session_id or self._ca.session_id,
                timestamp=time.time(),
                content=assistant_content,
                emotional_tags={"valence": 0.5},
                importance=0.5,
            )
            self._ca.episodic.store(ep_asst)
        except Exception as e:
            logger.debug("[ATHENA] sync_turn failed: %s", e)

    def on_session_end(self, messages: List[Dict[str, Any]]) -> None:
        """Flush pending memory writes on session end."""
        if not self._initialized or not self._ca:
            return

        try:
            # EpisodicMemory.persist() flushes WAL and closes connections
            self._ca.episodic.persist()
            logger.debug("[ATHENA] memory persisted on session end")
        except Exception as e:
            logger.debug("[ATHENA] session-end persist failed: %s", e)


# ---------------------------------------------------------------------------
# Plugin entry point
# ---------------------------------------------------------------------------

def register(ctx) -> None:
    """Register ATHENA as a memory provider plugin with Hermes."""
    ctx.register_memory_provider(AthenaMemoryProvider())
