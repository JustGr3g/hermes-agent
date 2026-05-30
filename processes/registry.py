"""
Process Registry — deterministic workflow definitions.

A Process is a Python class with explicit steps that cannot be skipped or
reordered. Unlike a cron prompt (free-form text → LLM), a Process has:

  - Explicit step ordering (Python code, not prompt instructions)
  - Quality gates as real assertions (if/else, not "make sure to check")
  - Conditional branching as real control flow
  - Replayable state per step

Usage:
    from processes.registry import process_registry

    # Run a named process
    result = process_registry.run("daily_summary", inputs={
        "prompt": "...",
        "facts_path": "...",
    })

    # List available processes
    process_registry.list()
"""

from __future__ import annotations

import importlib
import inspect
import logging
import pkgutil
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class ProcessContext:
    """Context passed to every step of a process.

    Provides logging, metrics collection, and step recording so the
    process is replayable and auditable.
    """

    def __init__(self, process_name: str, run_id: str):
        self.process_name = process_name
        self.run_id = run_id
        self.steps: List[ProcessStepResult] = []
        self._start = time.time()

    def elapsed(self) -> float:
        return time.time() - self._start

    def log(self, message: str) -> None:
        logger.info("[%s/%s] %s", self.process_name, self.run_id, message)

    def record_step(self, name: str, kind: str, status: str, duration_ms: float,
                    summary: str = "", output: str = "") -> None:
        self.steps.append(ProcessStepResult(
            name=name, kind=kind, status=status,
            duration_ms=duration_ms, summary=summary, output=output,
        ))


@dataclass
class ProcessStepResult:
    name: str
    kind: str  # "gather", "generate", "verify", "remediate"
    status: str  # "ok", "passed", "failed", "skipped"
    duration_ms: float
    summary: str
    output: str


@dataclass
class ProcessResult:
    status: str  # "ok" | "with_issues" | "failed"
    output: str
    steps: List[ProcessStepResult] = field(default_factory=list)
    error: str = ""


class Process(ABC):
    """Base class for deterministic workflow definitions.

    Subclasses define `run()` with explicit steps. Each step is a method
    call on `ctx` with logging, timing, and step recording.

    Example:
        class DailySummaryProcess(Process):
            name = "daily_summary"
            version = "1.0.0"

            async def run(self, inputs: dict, ctx: ProcessContext) -> ProcessResult:
                facts = await self._gather_facts(ctx)
                draft = await self._generate(ctx, inputs, facts)
                ...
    """

    name: str = ""
    version: str = "1.0.0"
    description: str = ""

    @abstractmethod
    def run(self, inputs: dict, ctx: ProcessContext) -> ProcessResult:
        """Execute the process."""
        ...


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

class ProcessRegistry:
    """Registry of available processes, discovered via plugins."""

    def __init__(self):
        self._processes: Dict[str, type[Process]] = {}
        self._loaded = False

    def register(self, process_cls: type[Process]) -> None:
        """Register a Process subclass."""
        if not issubclass(process_cls, Process):
            raise TypeError(f"{process_cls.__name__} must extend Process")
        name = process_cls.name or process_cls.__name__.lower()
        self._processes[name] = process_cls
        logger.debug("Registered process: %s (v%s)", name, getattr(process_cls, "version", "?"))

    def list(self) -> List[dict]:
        """Return metadata for all registered processes."""
        return [
            {
                "name": p.name,
                "version": p.version,
                "description": p.description,
            }
            for p in self._processes.values()
        ]

    def get(self, name: str) -> Optional[type[Process]]:
        """Get a process class by name."""
        return self._processes.get(name)

    def run(self, name: str, inputs: Optional[dict] = None) -> ProcessResult:
        """Instantiate and run a process by name."""
        cls = self.get(name)
        if cls is None:
            return ProcessResult(status="failed", output="", error=f"Process '{name}' not found")

        process = cls()
        run_id = f"{name}_{int(time.time())}"
        ctx = ProcessContext(name, run_id)

        ctx.log(f"Starting process run {run_id}")
        try:
            result = process.run(inputs or {}, ctx)
            result.steps = ctx.steps
            ctx.log(f"Process completed: status={result.status}")
            return result
        except Exception as e:
            logger.exception("Process '%s' failed: %s", name, e)
            return ProcessResult(
                status="failed", output="",
                error=f"{type(e).__name__}: {e}",
                steps=ctx.steps,
            )


# Global singleton
process_registry = ProcessRegistry()
