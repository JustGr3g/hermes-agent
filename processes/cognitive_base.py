"""
CognitiveProcess — Base class for wrapping CognitiveAgent heartbeat-style handlers
as Hermes Processes.

A bridge between the two agent layers: Athena's cognitive heartbeat handlers
(in ~/cognitive-agent/cognitive_agent/) become Process subclasses that the
Hermes process registry can invoke. This gives them:

  - Step-level audit trails (ProcessContext records every step with timing)
  - Access to the verify→remediate loop (Phase 1)
  - Discoverability via run_process(list=true)
  - Potential cron scheduling (if a handler becomes a cron job)

Import path works because hermes/ is a subdirectory of the cognitive-agent
repo. CognitiveProcessor at line 252 already does
`from cognitive_agent.cognition.perception import PerceptionPipeline` —
the reverse direction of the same cross-repo path.

Usage:
    from processes.cognitive_base import CognitiveProcess, process_registry

    class CognitiveSelfModelProcess(CognitiveProcess):
        name = "cognitive_self_model"
        handler_fn = ...  # set in __init__ from inputs

    process_registry.register(CognitiveSelfModelProcess)
"""

from __future__ import annotations

import json
import logging
from typing import Any, Callable, Optional

from . import daily_summary  # noqa: F401 — ensure daily_summary process registered
from .registry import Process, ProcessContext, ProcessResult, process_registry

logger = logging.getLogger(__name__)


class CognitiveProcess(Process):
    """A Process whose run() wraps a CognitiveAgent handler function.

    Subclasses set `handler_fn_name` to a dotted path like
    "cognitive_agent.repair.goal_retriage.retriage_suspended_goals"
    which is imported lazily on first run() call.

    The agent instance is passed in inputs["_cognitive_agent"].
    Handler kwargs come from inputs — all keys not prefixed with _
    are forwarded to the handler function.
    """

    # Set by subclass: dotted import path to the handler function
    handler_fn_name: str = ""

    def __init__(self):
        self._handler_fn: Optional[Callable] = None

    def _import_handler(self) -> Optional[Callable]:
        """Lazy-import the handler function by dotted path."""
        if self._handler_fn is not None:
            return self._handler_fn
        if not self.handler_fn_name:
            return None
        try:
            parts = self.handler_fn_name.split(".")
            mod_name = ".".join(parts[:-1])
            fn_name = parts[-1]
            import importlib
            mod = importlib.import_module(mod_name)
            self._handler_fn = getattr(mod, fn_name, None)
            if self._handler_fn is None:
                logger.error("Handler %s not found in %s", fn_name, mod_name)
            return self._handler_fn
        except Exception as e:
            logger.exception("Failed to import handler %s: %s", self.handler_fn_name, e)
            return None

    def run(self, inputs: dict, ctx: ProcessContext) -> ProcessResult:
        handler = self._import_handler()
        if handler is None:
            return ProcessResult(
                status="failed", output="",
                error=f"Handler '{self.handler_fn_name}' could not be imported"
            )

        # The CognitiveAgent instance must be passed as _cognitive_agent
        agent = inputs.get("_cognitive_agent")
        if agent is None:
            return ProcessResult(
                status="failed", output="",
                error="No _cognitive_agent provided in inputs"
            )

        # Build kwargs: forward all non-underscore-prefixed inputs to handler
        kwargs = {k: v for k, v in inputs.items() if not k.startswith("_")}
        kwargs.setdefault("apply", True)

        ctx.log(f"Calling handler {self.handler_fn_name} with {list(kwargs.keys())}")
        t0 = ctx.elapsed()

        try:
            result = handler(agent, **kwargs)
        except Exception as e:
            logger.exception("CognitiveProcess handler failed: %s", e)
            return ProcessResult(
                status="failed", output="",
                error=f"{type(e).__name__}: {e}",
            )

        duration_ms = int((ctx.elapsed() - t0) * 1000)

        if isinstance(result, dict):
            output = json.dumps(result, default=str, indent=2)
            ctx.record_step(
                "handler_call", "cognitive",
                "ok" if result.get("stored", True) else "failed",
                duration_ms,
                summary=f"Output keys: {list(result.keys())}",
                output=output,
            )
            return ProcessResult(status="ok", output=output)
        else:
            output = str(result)
            ctx.record_step("handler_call", "cognitive", "ok", duration_ms)
            return ProcessResult(status="ok", output=output)
