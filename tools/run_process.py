"""
run_process — Execute a deterministic process definition.

Processes are Python classes with explicit steps, quality gates, and
conditional branching. Unlike free-form prompts, processes CANNOT skip
steps — every step is a function call.

Use this for workflows where reliability matters more than flexibility:
daily summary generation, goal retriage, self-model generation.

Available processes (call run_process with list=true):
  - daily_summary: Generate Athena's daily autonomous actions summary
"""
import json
import logging
import os
import sys
from pathlib import Path
from typing import Optional

from tools.registry import registry

logger = logging.getLogger(__name__)

RUN_PROCESS_SCHEMA = {
    "name": "run_process",
    "description": "Execute a deterministic process definition. "
                   "Processes are Python classes with explicit steps that CANNOT be skipped. "
                   "Use for high-reliability workflows: daily summary generation, goal retriage, "
                   "self-model generation. Call with list=true to see available processes.",
    "parameters": {
        "type": "object",
        "properties": {
            "process": {
                "type": "string",
                "description": "Name of the process to run. Use 'list' to see available processes."
            },
            "inputs": {
                "type": "object",
                "description": "Input parameters for the process. Depends on the process. "
                               "For daily_summary: {'prompt': '...', 'max_verify_retries': 2, "
                               "'facts_script': 'daily_summary_facts.py', "
                               "'verify_script': 'verify_summary_numbers.py'}",
                "additionalProperties": True
            },
            "list": {
                "type": "boolean",
                "description": "Set to true to list available processes instead of running one.",
                "default": False
            }
        },
        "required": []
    }
}


def _ensure_registry_loaded() -> None:
    """Ensure process modules are imported so their registrations fire."""
    from processes import registry as _reg
    # Import known process modules to trigger registration
    try:
        import processes.daily_summary  # noqa: F401
    except ImportError:
        logger.debug("daily_summary process module not available")


def _handle_run_process(**kwargs) -> str:
    """Handler for the run_process tool."""
    list_only = bool(kwargs.get("list", False))
    process_name = kwargs.get("process", "")
    inputs = kwargs.get("inputs", {})

    _ensure_registry_loaded()

    from processes.registry import process_registry

    if list_only:
        available = process_registry.list()
        if not available:
            return "No processes registered yet."
        lines = ["**Available processes:**", ""]
        for p in available:
            lines.append(f"- **{p['name']}** v{p['version']} — {p['description']}")
        return "\n".join(lines)

    if not process_name:
        return "Specify a process name, or set list=true to see available processes."

    logger.info("Running process: %s with inputs keys=%s", process_name, list(inputs.keys()))
    result = process_registry.run(process_name, inputs)

    # Format response
    lines = [f"# Process: {process_name}", f"**Status:** {result.status}", ""]

    if result.steps:
        lines.append("## Steps")
        for s in result.steps:
            icon = "✅" if s.status == "ok" or s.status == "passed" else "⚠️" if s.status == "failed" else "⏭️"
            lines.append(f"- {icon} **{s.name}** ({s.kind}) — {s.status} in {s.duration_ms}ms")
            if s.summary:
                lines.append(f"  _{s.summary}_")
        lines.append("")

    if result.output:
        lines.append("## Output")
        lines.append("")
        lines.append(result.output)
        lines.append("")

    if result.error:
        lines.append(f"⚠️ **Error:** {result.error}")

    return "\n".join(lines)


registry.register(
    name="run_process",
    toolset="skills",
    schema=RUN_PROCESS_SCHEMA,
    handler=_handle_run_process,
    emoji="⚙️",
    description="Execute a deterministic process definition with explicit steps and quality gates",
)
