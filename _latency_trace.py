"""Latency-trace instrumentation for one Telegram turn end-to-end.

A module-level `ContextVar` carries a short turn_id from `gateway_receive` in
`gateway/platforms/base.py` through every checkpoint down to `send_end`,
crossing the asyncio→thread boundary via `asyncio.to_thread` (which copies
the current context into the worker thread on Python 3.9+).

Usage:
    from _latency_trace import new_turn, mark
    new_turn()        # at gateway entry
    mark("run_start") # at every other checkpoint

Greppable line format: `LATENCY_TRACE turn=<8hex> event=<name> ts_ms=<int>`.
"""
import contextvars
import logging
import time
import uuid

logger = logging.getLogger(__name__)

TURN_ID: contextvars.ContextVar[str] = contextvars.ContextVar(
    "latency_turn_id", default="-"
)


def new_turn() -> str:
    tid = uuid.uuid4().hex[:8]
    TURN_ID.set(tid)
    logger.info(
        "LATENCY_TRACE turn=%s event=gateway_receive ts_ms=%d",
        tid, time.monotonic_ns() // 1_000_000,
    )
    return tid


def mark(event: str) -> None:
    logger.info(
        "LATENCY_TRACE turn=%s event=%s ts_ms=%d",
        TURN_ID.get(), event, time.monotonic_ns() // 1_000_000,
    )
