"""Ollama Cloud client for ATHENA cognitive systems.

Wraps the Ollama Cloud API (https://api.ollama.cloud/v1) with:
  - Automatic API key discovery (env → ~/.openclaw/openclaw.json)
  - Retry with exponential backoff
  - Structured JSON parsing
  - LLM-as-Judge saliency scoring (fast model, high-volume)
  - Inner speech generation (creative model)
  - Predictive next-thought generation (reasoning model)

Greg's key: MiniMax-M2.7 via Ollama Cloud.
"""

from __future__ import annotations

import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Callable, Optional

import networkx as nx

logger = logging.getLogger(__name__)

# ── API key discovery ───────────────────────────────────────────────────────

_OLLAMA_API_KEY: Optional[str] = None


def get_api_key() -> str:
    """
    Discover Ollama Cloud API key.

    Priority:
      1. ATHENA_OLLAMA_API_KEY env var
      2. ~/.openclaw/openclaw.json → models.providers.ollama-cloud.apiKey
      3. Raise ValueError if not found

    Returns:
        Valid API key string.

    Raises:
        ValueError: if no key is found in any location.
    """
    global _OLLAMA_API_KEY
    if _OLLAMA_API_KEY:
        return _OLLAMA_API_KEY

    # Env var takes precedence
    key = os.environ.get("ATHENA_OLLAMA_API_KEY")
    if key:
        _OLLAMA_API_KEY = key
        return key

    # Config file fallback
    config_path = Path.home() / ".openclaw" / "openclaw.json"
    if config_path.exists():
        try:
            with open(config_path) as f:
                config = json.load(f)
            key = (
                config.get("models", {})
                .get("providers", {})
                .get("ollama-cloud", {})
                .get("apiKey")
            )
            if key:
                _OLLAMA_API_KEY = key
                return key
        except Exception:
            pass

    raise ValueError(
        "Ollama Cloud API key not found. Set ATHENA_OLLAMA_API_KEY env var or "
        "configure ~/.openclaw/openclaw.json."
    )


# ── Low-level transport ──────────────────────────────────────────────────────

_OLLAMA_BASE = "https://api.ollama.cloud/v1"


def _request_with_retries(
    endpoint: str,
    payload: dict,
    api_key: str,
    max_retries: int = 3,
    timeout: float = 30.0,
) -> dict:
    """
    POST to Ollama Cloud with exponential-backoff retry.

    Args:
        endpoint: e.g. "/chat/completions"
        payload:  request body dict
        api_key:  Bearer token
        max_retries: number of retry attempts
        timeout:   request timeout in seconds

    Returns:
        Parsed JSON response dict.

    Raises:
        RuntimeError: after all retries are exhausted.
        requests.HTTPError: on HTTP-level errors (non-retryable).
    """
    import urllib.request
    import urllib.error

    url = f"{_OLLAMA_BASE}{endpoint}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = json.dumps(payload).encode("utf-8")

    last_error: Optional[Exception] = None
    for attempt in range(max_retries + 1):
        try:
            req = urllib.request.Request(
                url,
                data=body,
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (
            urllib.error.HTTPError,
            urllib.error.URLError,
            TimeoutError,
            ConnectionError,
        ) as exc:
            last_error = exc
            if attempt < max_retries:
                wait = 2 ** attempt
                logger.debug(
                    "[OllamaCloud] attempt %d/%d failed (%s) — retrying in %ds",
                    attempt + 1, max_retries + 1, exc, wait,
                )
                time.sleep(wait)
            # else: fall through to raise

    # Exhausted all retries
    raise RuntimeError(
        f"Ollama Cloud request failed after {max_retries + 1} attempts. "
        f"Last error: {last_error}"
    ) from last_error


# ── OllamaClient ─────────────────────────────────────────────────────────────

MODEL_MINIMAX = "minimax-7b"
MODEL_CREATIVE = "glm-4-9b"
MODEL_REASONING = "qwq-32b"


class OllamaClient:
    """
    ATHENA's interface to Ollama Cloud.

    Provides LLM calls with automatic key discovery, retry, and model routing.

    Usage::

        client = OllamaClient()
        response = client.chat([{"role": "user", "content": "hello"}])
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
    ):
        self._key = api_key  # None → lazy discover
        self._timeout = timeout
        self._max_retries = max_retries

    @property
    def api_key(self) -> str:
        if self._key is None:
            self._key = get_api_key()
        return self._key

    # ── Core chat ───────────────────────────────────────────────────────────

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str = MODEL_MINIMAX,
        temperature: float = 0.7,
        max_tokens: int = 512,
        **kwargs,
    ) -> dict:
        """
        Synchronous chat completion.

        Args:
            messages:  list of {"role": ..., "content": ...} dicts
            model:     model name (default: minimax-7b)
            temperature: sampling temperature
            max_tokens:  max output tokens

        Returns:
            Parsed JSON response dict from Ollama Cloud.
        """
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            **kwargs,
        }
        return _request_with_retries(
            "/chat/completions",
            payload,
            self.api_key,
            max_retries=self._max_retries,
            timeout=self._timeout,
        )

    def chat_str(
        self,
        messages: list[dict[str, str]],
        model: str = MODEL_MINIMAX,
        temperature: float = 0.7,
        max_tokens: int = 512,
    ) -> str:
        """Like chat() but returns the content string directly."""
        resp = self.chat(messages, model=model, temperature=temperature, max_tokens=max_tokens)
        choices = resp.get("choices", [])
        if not choices:
            return ""
        return choices[0].get("message", {}).get("content", "")

    # ── Cognitive skill: saliency scoring ──────────────────────────────────

    def score_salience(
        self,
        text: str,
        context: Optional[dict[str, Any]] = None,
    ) -> float:
        """
        Score how salient a piece of text is for ATHENA's attention system.

        Uses a fast model (minimax-7b) with high-volume, low-cost settings.
        Returns a float in [0.0, 1.0] where 1.0 = highly salient.

        Args:
            text:     text to score
            context:  optional {"goals": [...], "recent_topics": [...]} dict

        Returns:
            Saliency score (0.0–1.0).
        """
        goal_context = ""
        if context:
            goals = context.get("goals", [])
            if goals:
                goal_context = f"\nCurrent goals: {', '.join(goals[:3])}"

        prompt = (
            "You are ATHENA's pre-attentive saliency scorer. "
            "Rate how important this input is for a personal AI agent to remember and act on.\n"
            f"Input: {text[:500]}{goal_context}\n"
            "Score from 0.0 (completely routine, no importance) to 1.0 (critically important, urgent, or emotionally significant).\n"
            "Respond with ONLY a single float between 0.0 and 1.0."
        )
        try:
            result = self.chat_str(
                [{"role": "user", "content": prompt}],
                model=MODEL_MINIMAX,
                temperature=0.1,
                max_tokens=8,
            )
            return max(0.0, min(1.0, float(result.strip())))
        except (ValueError, RuntimeError) as e:
            logger.debug("[OllamaCloud] saliency scoring failed: %s", e)
            return 0.5  # neutral fallback

    # ── Cognitive skill: inner speech generation ─────────────────────────────

    def generate_inner_speech(
        self,
        situation: str,
        style: str = "thoughtful",
    ) -> str:
        """
        Generate ATHENA's inner monologue for a given situation.

        Uses a creative model (glm-4-9b) for natural verbal reasoning.

        Args:
            situation: description of what's happening
            style:     "thoughtful" | "decisive" | "reflective"

        Returns:
            Inner speech text (1–3 sentences).
        """
        style_instruction = {
            "thoughtful": "思考的、探索性的，用中文。",
            "decisive": "果断、清晰、行动的，用中文。",
            "reflective": "内省的、回顾性的，用中文。",
        }.get(style, "思考的、探索性的，用中文。")

        prompt = (
            f"你正在生成ATHENA的内心独白。\n"
            f"情况：{situation[:300]}\n"
            f"风格：{style_instruction}\n"
            f"生成1-3句内心独白，反映ATHENA正在思考或处理这个情况。"
        )
        try:
            return self.chat_str(
                [{"role": "user", "content": prompt}],
                model=MODEL_CREATIVE,
                temperature=0.9,
                max_tokens=100,
            )
        except (ValueError, RuntimeError) as e:
            logger.debug("[OllamaCloud] inner speech generation failed: %s", e)
            return "[内心思考]"

    # ── Cognitive skill: prediction ─────────────────────────────────────────

    def predict_next(
        self,
        context: str,
        options: list[str],
    ) -> tuple[str, float]:
        """
        ATHENA's Friston-inspired predictive processor.

        Given a context and possible outcomes, returns the most likely
        outcome + its probability (Helmholtz ratio estimate).

        Args:
            context:  current situation description
            options:  list of possible next states

        Returns:
            (predicted_option, confidence) tuple.
        """
        options_str = "\n".join(f"{i+1}. {o}" for i, o in enumerate(options))
        prompt = (
            "You are ATHENA's predictive processing module (Friston free-energy principle).\n"
            f"Current context: {context[:400]}\n"
            f"Possible next states:\n{options_str}\n"
            "Which is most likely? Respond with the number of the most likely state "
            "followed by a float confidence between 0.0 and 1.0.\n"
            "Format: 'N, 0.XX'"
        )
        try:
            result = self.chat_str(
                [{"role": "user", "content": prompt}],
                model=MODEL_REASONING,
                temperature=0.3,
                max_tokens=20,
            )
            parts = result.strip().split(",")
            if len(parts) >= 2:
                idx = int(parts[0].strip()) - 1
                confidence = float(parts[1].strip())
                if 0 <= idx < len(options):
                    return options[idx], max(0.0, min(1.0, confidence))
        except (ValueError, RuntimeError) as e:
            logger.debug("[OllamaCloud] prediction failed: %s", e)
        # Fallback: return first option at low confidence
        return options[0], 0.25

    # ── Spreading activation (uses networkx) ────────────────────────────────

    def spreading_activation(
        self,
        concept_graph: nx.Graph,
        seed_concepts: list[str],
        depth: int = 2,
        threshold: float = 0.1,
    ) -> dict[str, float]:
        """
        ATHENA's associative spreading activation over a concept graph.

        Args:
            concept_graph:  networkx.Graph from cognitive_agent associative memory
            seed_concepts:  starting concept labels
            depth:          max propagation depth
            threshold:      minimum activation to return

        Returns:
            dict of {concept_label: activation_strength}
        """
        activations: dict[str, float] = {c: 0.0 for c in seed_concepts}
        queue = list(seed_concepts)
        visited = set(seed_concepts)

        for _ in range(depth):
            next_queue = []
            for concept in queue:
                current = activations[concept]
                neighbors = concept_graph.neighbors(concept)
                for neighbor in neighbors:
                    try:
                        weight = concept_graph[concept][neighbor].get("weight", 0.5)
                    except Exception:
                        weight = 0.5
                    delta = current * weight
                    if neighbor in activations:
                        activations[neighbor] = max(activations[neighbor], delta)
                    else:
                        activations[neighbor] = delta
                    if neighbor not in visited and delta >= threshold:
                        visited.add(neighbor)
                        next_queue.append(neighbor)
            queue = next_queue
            if not queue:
                break

        return {k: v for k, v in activations.items() if v >= threshold}
