"""
RemoteCognitiveProcessor — HTTP-backed shim for Athena's CognitiveProcessor.

When the gateway runs with ATHENA_GATEWAY_DELEGATE=1, run_agent.py constructs
this class instead of a local CognitiveProcessor. It mirrors the four-method
interface (augment_message, record_result, record_completion, verify_and_revise)
but each call posts to athena_server.py's /cognitive/* endpoints. The gateway
keeps the LLM call (preserving streaming and matching native Hermes latency);
the sidecar owns the singleton CognitiveAgent.

This collapses Athena from two in-process cognitive instances (gateway + sidecar)
to one (sidecar only), eliminating in-memory state drift between the two
processes — rate-limit deques, MotivationState._state, AutonomyGuard rolling
logs were all duplicated before.

Latency budget per turn (observed on a single Mac):
  - augment_message: ~50-200ms (dominated by cognitive pipeline; HTTP ~3ms)
  - record_result:    <50ms per tool call
  - record_completion: <100ms once per turn
  - verify_and_revise: <100ms in `detect` mode; up to 30s in `regenerate`
                       (extra LLM call when atomic claims contradict cog-state)

Failure semantics (fail-open):
  Any HTTP/connection/timeout error is logged and silently passed through.
  The gateway gets an unmodified message back from augment_message and an
  unmodified response from verify_and_revise. The CognitiveAgent in the
  sidecar remains the source of truth; if it's unreachable, Athena
  effectively reverts to vanilla Hermes behavior — replies still happen
  but without cognitive context. Same fail-open contract the local
  CognitiveProcessor's exception paths already enforce.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


# Per-call timeouts (seconds). augment_message is the slow one — it runs
# the full 8-system cognitive pipeline (perception, retrieval, WM,
# motivation, metacognition, predictive, executive, inner-speech), some of
# which make LLM calls. On a non-trivial message that's typically 30-50s
# and can stretch to 90s+ when inner-speech generation has to rank
# multiple candidates. We give it generous headroom (180s) but stay well
# below the gateway's max_response_seconds (300s default) to avoid
# stacking timeouts.
#
# record_result and record_completion are memory writes (episodic +
# associative) — fast in normal operation; the 30s cap absorbs occasional
# disk slowness without forcing passthrough.
#
# verify_and_revise's `regenerate` mode makes an extra LLM call when an
# atomic claim contradicts cog-state — bounded by Athena's main LLM
# latency.
_AUGMENT_TIMEOUT = 180.0
_RECORD_TIMEOUT = 30.0
_VERIFY_TIMEOUT = 60.0


class RemoteCognitiveProcessor:
    """HTTP shim over athena_server.py's /cognitive/* endpoints.

    Public interface mirrors `agent.cognitive_processor.CognitiveProcessor`
    exactly, so run_agent.py needs no awareness of the indirection.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        *,
        augment_timeout: float = _AUGMENT_TIMEOUT,
        record_timeout: float = _RECORD_TIMEOUT,
        verify_timeout: float = _VERIFY_TIMEOUT,
    ):
        self._base_url = (
            base_url
            or os.environ.get("ATHENA_SERVER_URL")
            or "http://localhost:8765"
        ).rstrip("/")
        self._augment_timeout = float(augment_timeout)
        self._record_timeout = float(record_timeout)
        self._verify_timeout = float(verify_timeout)
        # Reuse a single requests.Session across calls so we share the
        # underlying TCP connection (Keep-Alive). Removes ~1ms/call on
        # localhost vs constructing a fresh connection each time.
        self._session = requests.Session()
        logger.info(
            "RemoteCognitiveProcessor: delegating to %s "
            "(timeouts: augment=%.0fs record=%.0fs verify=%.0fs)",
            self._base_url, self._augment_timeout,
            self._record_timeout, self._verify_timeout,
        )

    # ── Public API mirroring CognitiveProcessor ────────────────────────

    def augment_message(
        self,
        api_msg: Dict[str, Any],
        messages: List[Dict[str, Any]] = None,
        context: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """POST to /cognitive/augment. Returns the augmented api_msg or
        the original on any failure (fail-open)."""
        body = {
            "api_msg": api_msg,
            "messages": messages or [],
            "context": context or {},
        }
        result = self._post("/cognitive/augment", body, self._augment_timeout)
        if result is None:
            return api_msg
        return result.get("api_msg", api_msg)

    def record_result(
        self,
        messages: List[Dict[str, Any]],
        assistant_message: Any,
    ) -> None:
        """POST to /cognitive/record_result. Flattens assistant_message to
        {role, content, tool_calls} since the underlying object varies
        across LLM SDKs (Anthropic Message vs OpenAI ChatCompletion vs
        Hermes-internal types)."""
        body = {
            "messages": messages or [],
            "assistant_message": {
                "role": getattr(assistant_message, "role", "assistant"),
                "content": getattr(assistant_message, "content", "") or "",
                "tool_calls": list(
                    getattr(assistant_message, "tool_calls", None) or []
                ),
            },
        }
        self._post("/cognitive/record_result", body, self._record_timeout)

    def record_completion(
        self,
        messages: List[Dict[str, Any]],
        final_response: Any,
        context: Dict[str, Any] = None,
    ) -> None:
        """POST to /cognitive/record_completion. final_response may be a
        string OR an object with a .content attribute (Anthropic-style);
        we extract the plain string before serializing."""
        text = self._extract_text(final_response)
        body = {
            "messages": messages or [],
            "final_response": text,
            "context": context or {},
        }
        self._post("/cognitive/record_completion", body, self._record_timeout)

    def verify_and_revise(self, final_response: Any) -> Any:
        """POST to /cognitive/verify_and_revise. Returns the (possibly
        revised) response or the original on failure. Uses the longer
        verify timeout because regenerate mode can make an LLM call."""
        text = self._extract_text(final_response)
        body = {"final_response": text}
        result = self._post(
            "/cognitive/verify_and_revise", body, self._verify_timeout
        )
        if result is None:
            return final_response
        revised = result.get("final_response")
        # If we got back a non-string somehow, keep the original to avoid
        # downstream type confusion.
        if not isinstance(revised, str):
            return final_response
        return revised

    # ── Internals ──────────────────────────────────────────────────────

    @staticmethod
    def _extract_text(payload: Any) -> str:
        """Mirror CognitiveProcessor.verify_and_revise's logic for pulling
        plain text out of either a string or a Message-like object."""
        if isinstance(payload, str):
            return payload
        content = getattr(payload, "content", None)
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            # OpenAI-style content list: concatenate text parts.
            parts = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    parts.append(item.get("text", ""))
                elif hasattr(item, "text"):
                    parts.append(getattr(item, "text", "") or "")
            return "".join(parts)
        return str(payload) if payload is not None else ""

    def _post(self, path: str, body: dict, timeout: float) -> Optional[dict]:
        """POST helper with fail-open semantics. Returns parsed JSON dict
        on success, None on any failure (network, timeout, non-200, JSON
        parse error). Failures are logged at DEBUG since they're expected
        when the sidecar is restarting; the caller passes through the
        original payload."""
        url = f"{self._base_url}{path}"
        try:
            resp = self._session.post(url, json=body, timeout=timeout)
        except (requests.exceptions.ConnectionError,
                requests.exceptions.Timeout) as e:
            logger.debug("RemoteCP: %s unreachable (%s) — passthrough", path, e)
            return None
        except Exception as e:
            logger.debug("RemoteCP: %s post error (%s) — passthrough", path, e)
            return None

        if resp.status_code >= 500:
            # 503 from the sidecar means agent not loaded / degraded mode —
            # expected when athena_server is starting. Passthrough.
            logger.debug(
                "RemoteCP: %s returned %s — passthrough", path, resp.status_code,
            )
            return None
        if resp.status_code != 200:
            logger.warning(
                "RemoteCP: %s returned %s: %s",
                path, resp.status_code, resp.text[:200],
            )
            return None
        try:
            return resp.json()
        except Exception as e:
            logger.warning("RemoteCP: %s JSON decode failed: %s", path, e)
            return None
