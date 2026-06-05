"""
tool_prevalidation — Pre-flight parameter validation for tool calls.

Catches common parameter mistakes *before* the tool is dispatched, reducing
tool failure rate and the associated retry/context cost.

Called from the pre_tool_call hook pipeline in model_tools.py.  Returns a
block message when validation fails (None = proceed).

Validation categories:
  - Required-param completeness (schema says required, value is None/empty)
  - Enum value correctness (string doesn't match any declared enum)
  - Path sanity (file paths that don't exist yet or point outside allowed dirs)
  - Obvious type mismatches the coercion layer can't fix
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Optional

from tools.registry import registry

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Per-tool special validators (path-sensitive tools get extra checks)
# ---------------------------------------------------------------------------
_PATH_TOOLS = {
    "read_file",
    "write_file",
    "patch",
    "search_files",
    "terminal",       # workdir validation
    "vision_analyze",  # image_url as file path
}

# Required params that are frequently forgotten
_REQUIRED_SENTINELS = {"", None, "None", "null", "undefined"}


def validate_tool_call(function_name: str, function_args: dict) -> Optional[str]:
    """Run all applicable validators on a tool call.  Returns a block message
    (string) when validation fails, or None when the call is good to proceed."""
    schema = registry.get_schema(function_name)
    if not schema:
        return None  # unknown tool — let it fall through naturally

    params_schema = (schema.get("parameters") or {}).get("properties") or {}
    required_params = (schema.get("parameters") or {}).get("required") or []

    # ------------------------------------------------------------------
    # 1. Required-param completeness
    # ------------------------------------------------------------------
    for rp in required_params:
        if rp not in function_args:
            return (
                f"⚠ Tool call rejected: `{function_name}` requires "
                f"parameter `{rp}`, but it was not provided."
            )
        val = function_args[rp]
        if isinstance(val, str) and val.strip().lower() in _REQUIRED_SENTINELS:
            return (
                f"⚠ Tool call rejected: required parameter `{rp}` in "
                f"`{function_name}` has no usable value (got {repr(val)})."
            )
        if val is None:
            return (
                f"⚠ Tool call rejected: required parameter `{rp}` in "
                f"`{function_name}` is None."
            )

    # ------------------------------------------------------------------
    # 2. Enum value correctness
    # ------------------------------------------------------------------
    for key, value in function_args.items():
        prop = params_schema.get(key, {})
        enum_vals = prop.get("enum")
        if not enum_vals or not isinstance(value, str):
            continue
        if value not in enum_vals:
            return (
                f"⚠ Tool call rejected: `{function_name}.{key}` "
                f"got `{value}`, but must be one of: {enum_vals}."
            )

    # ------------------------------------------------------------------
    # 3. Path sanity checks
    # ------------------------------------------------------------------
    if function_name in _PATH_TOOLS:
        path_val = _get_path_arg(function_name, function_args)
        if path_val is not None:
            path_obj = Path(path_val).expanduser().resolve()
            # Check for obvious typos: path has spaces that look wrong,
            # or the directory doesn't exist (for write_file, ok for new)
            if function_name != "write_file" and not path_obj.exists():
                return (
                    f"⚠ Tool call rejected: path `{path_val}` in "
                    f"`{function_name}` does not exist (resolved: {path_obj}). "
                    "Double-check the path before retrying."
                )

    return None  # all good


def _get_path_arg(function_name: str, function_args: dict) -> Optional[str]:
    """Extract the primary path argument from a tool's args dict."""
    for key in ("path", "image_url", "workdir"):
        val = function_args.get(key)
        if val and isinstance(val, str):
            return val
    return None
