"""local_traces — SQLite-backed LLM call tracing for Hermes.

Hooks into post_api_request (per-API-call event in run_agent.py) and
forwards each call to cognitive_agent.trace_writer.record_llm_call,
which is the single writer to ~/cognitive-agent/hermes/traces.db.

OllamaClient writes to the same file via the same module on the
in-process heartbeat code path that bypasses Hermes' hook bus.
Together the two callers produce one row per LLM call regardless of
which path it came through; the `source` column distinguishes them.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


def _normalize(response: Any, *, provider: str, api_mode: str, model: str,
               base_url: str, usage_dict: Optional[dict]
               ) -> tuple[dict, Optional[float], Optional[str], Optional[str]]:
    """Return (token_dict, cost_usd, cost_status, cost_source)."""
    canonical = None
    raw = getattr(response, "usage", None) if response is not None else None

    if raw:
        try:
            from agent.usage_pricing import normalize_usage
            canonical = normalize_usage(raw, provider=provider, api_mode=api_mode)
        except Exception as exc:
            logger.debug("local_traces: normalize_usage failed: %s", exc)

    if canonical is None and usage_dict:
        try:
            from agent.usage_pricing import CanonicalUsage
            canonical = CanonicalUsage(
                input_tokens=int(usage_dict.get("input_tokens", 0)),
                output_tokens=int(
                    usage_dict.get("output_tokens", 0)
                    or usage_dict.get("completion_tokens", 0)
                ),
                cache_read_tokens=int(usage_dict.get("cache_read_tokens", 0)),
                cache_write_tokens=int(usage_dict.get("cache_write_tokens", 0)),
                reasoning_tokens=int(usage_dict.get("reasoning_tokens", 0)),
            )
        except Exception:
            canonical = None

    if canonical is None:
        return {}, None, None, None

    cost_usd: Optional[float] = None
    cost_status: Optional[str] = None
    cost_source: Optional[str] = None
    try:
        from agent.usage_pricing import estimate_usage_cost
        cost = estimate_usage_cost(model, canonical, provider=provider,
                                   base_url=base_url, api_key="")
        if getattr(cost, "amount_usd", None) is not None:
            cost_usd = float(cost.amount_usd)
        cost_status = getattr(cost, "status", None)
        cost_source = getattr(cost, "source", None)
    except Exception as exc:
        logger.debug("local_traces: estimate_usage_cost failed: %s", exc)

    return ({
        "input_tokens": canonical.input_tokens,
        "output_tokens": canonical.output_tokens,
        "cache_read_tokens": canonical.cache_read_tokens,
        "cache_write_tokens": canonical.cache_write_tokens,
        "reasoning_tokens": canonical.reasoning_tokens,
    }, cost_usd, cost_status, cost_source)


def on_post_llm_call(*, task_id: str = "", session_id: str = "",
                     platform: str = "", provider: str = "", base_url: str = "",
                     api_mode: str = "", model: str = "", api_call_count: int = 0,
                     api_duration: float = 0.0, finish_reason: str = "",
                     response: Any = None, usage: Any = None, **_: Any) -> None:
    """Fail-open hook adapter. Forwards the call to the shared writer."""
    try:
        token_dict, cost_usd, cost_status, cost_source = _normalize(
            response,
            provider=provider, api_mode=api_mode, model=model, base_url=base_url,
            usage_dict=usage if isinstance(usage, dict) else None,
        )
        latency_ms = int(api_duration * 1000) if api_duration else None

        from cognitive_agent.trace_writer import record_llm_call
        record_llm_call(
            session_id=session_id or None, task_id=task_id or None,
            platform=platform or None, provider=provider or None,
            base_url=base_url or None, model=model or None,
            api_mode=api_mode or None,
            input_tokens=token_dict.get("input_tokens", 0),
            output_tokens=token_dict.get("output_tokens", 0),
            cache_read_tokens=token_dict.get("cache_read_tokens", 0),
            cache_write_tokens=token_dict.get("cache_write_tokens", 0),
            reasoning_tokens=token_dict.get("reasoning_tokens", 0),
            cost_usd=cost_usd, cost_status=cost_status, cost_source=cost_source,
            latency_ms=latency_ms, finish_reason=finish_reason or None,
            api_call_count=api_call_count or None,
            source="hermes_hook",
        )
    except Exception as exc:
        logger.debug("local_traces: hook adapter failed: %s", exc)


def register(ctx) -> None:
    # post_api_request fires once per LLM API call inside the tool loop and
    # carries usage/api_duration/model — the only hook with the data needed
    # for cost accounting. post_llm_call fires once per turn AFTER the loop
    # completes and carries no usage data; registering it would create
    # zero-token rows. Stick to post_api_request only.
    ctx.register_hook("post_api_request", on_post_llm_call)
