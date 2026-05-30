"""
content-compression plugin — Babysitter-inspired content-type-aware compression.

Registers two hooks:

  transform_terminal_output  → command-compressor layer
      Truncates long shell output: keeps first N lines, last N lines, drops
      the middle with a summary line. Configurable threshold and keep-count.
      Toggle: CONTENT_COMPRESSION_LAYER_TERMINAL=false

  transform_tool_result → density-filter + match-summarizer for read_file/search_files
      For read_file: density-filter keeps lines with high information content
      (drops whitespace-only lines, comment blocks, import blocks).
      For search_files: match-summarizer collapses consecutive similar results
      into range notation.
      Toggle: CONTENT_COMPRESSION_LAYER_FILE=false, CONTENT_COMPRESSION_LAYER_SEARCH=false

Each layer has independent env-var toggle, threshold, and compression target.
Compression is tracked per-layer: tokens saved logged on agent restart.
"""

from __future__ import annotations

import logging
import os
import re
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration helpers
# ---------------------------------------------------------------------------

def _env_bool(name: str, default: bool = True) -> bool:
    val = os.environ.get(name, "").strip().lower()
    if val in ("0", "false", "off", "no"):
        return False
    if val in ("1", "true", "on", "yes"):
        return True
    return default

def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, str(default)))
    except (ValueError, TypeError):
        return default

# ---------------------------------------------------------------------------
# Compression statistics (reset each agent start)
# ---------------------------------------------------------------------------

_stats: dict[str, int] = {
    "terminal_chars_before": 0,
    "terminal_chars_after": 0,
    "terminal_calls": 0,
    "file_chars_before": 0,
    "file_chars_after": 0,
    "file_calls": 0,
    "search_chars_before": 0,
    "search_chars_after": 0,
    "search_calls": 0,
}

# ---------------------------------------------------------------------------
# Compression engines
# ---------------------------------------------------------------------------

# Tokens (roughly) = chars / 4
_CHARS_PER_TOKEN = 4.0


def _compress_terminal_output(output: str) -> str:
    """Command-compressor: truncate long shell output.

    Behaviour:
      - Short output (< threshold): pass through unchanged.
      - Long output: keep first N lines + last N lines, drop middle with
        a summary line showing how many lines were suppressed.

    Tunables (env vars):
      CONTENT_COMPRESSION_TERMINAL_THRESHOLD (default 500 chars)
      CONTENT_COMPRESSION_TERMINAL_KEEP (default 15 lines each side)
    """
    threshold = _env_int("CONTENT_COMPRESSION_TERMINAL_THRESHOLD", 500)
    keep = _env_int("CONTENT_COMPRESSION_TERMINAL_KEEP", 15)

    if len(output) <= threshold:
        return output

    lines = output.splitlines()
    if len(lines) <= keep * 3:
        return output

    first = lines[:keep]
    last = lines[-keep:]
    suppressed = len(lines) - (keep * 2)

    compressed = "\n".join(first)
    compressed += f"\n...({suppressed} lines / ~{_estimate_tokens(suppressed * 80)} tokens suppressed by content-compression plugin)...\n"
    compressed += "\n".join(last)

    _stats["terminal_chars_before"] += len(output)
    _stats["terminal_chars_after"] += len(compressed)
    _stats["terminal_calls"] += 1

    logger.debug(
        "content-compression: terminal %d → %d chars (%.0f%% reduction)",
        len(output), len(compressed),
        100 * (1 - len(compressed) / len(output)) if output else 0,
    )

    return compressed


def _density_filter(text: str) -> str:
    """Density-filter: keep lines with high information content.

    Drops:
      - Whitespace-only lines (collapses consecutive runs to 1 blank line)
      - Lines that are only imports (Python: 'import X', 'from X import Y')
      - Lines that are only closing brackets/braces
      - Lines that are only comment markers (single-line comments, docstring fences)

    Tunables (env vars):
      CONTENT_COMPRESSION_FILE_THRESHOLD (default 1000 chars — min size to activate)
    """
    threshold = _env_int("CONTENT_COMPRESSION_FILE_THRESHOLD", 1000)
    if len(text) <= threshold:
        return text

    lines = text.splitlines()
    if len(lines) < 30:
        return text

    # Patterns for low-info lines
    _import_pat = re.compile(r"^\s*(import\s+\w+|from\s+\w+\s+import\s+)")
    _bracket_pat = re.compile(r"^\s*[}\]\)]+\s*$")
    _comment_pat = re.compile(r"^\s*(#|//|--|<!--|%|\*)\s*$")
    _blank_pat = re.compile(r"^\s*$")

    filtered: list[str] = []
    prev_blank = False

    for line in lines:
        stripped = line.strip()

        # Blank lines: collapse consecutive to one
        if _blank_pat.match(line) or not stripped:
            if not prev_blank:
                filtered.append("")
                prev_blank = True
            continue
        prev_blank = False

        # Keep non-blank lines, skip pure boilerplate
        if _import_pat.match(line):
            continue  # skip import lines in long files
        if _bracket_pat.match(line):
            continue  # skip lone closing brackets
        if _comment_pat.match(line):
            continue  # skip bare comment markers

        filtered.append(line)

    result = "\n".join(filtered)

    _stats["file_chars_before"] += len(text)
    _stats["file_chars_after"] += len(result)

    logger.debug(
        "content-compression: file %d → %d chars (%.0f%% reduction)",
        len(text), len(result),
        100 * (1 - len(result) / len(text)) if text else 0,
    )

    return result


def _match_summarizer(text: str) -> str:
    """Match-summarizer: collapse consecutive similar search results.

    When search_files returns many consecutive lines from the same file,
    collapse them into a range notation:  file.py lines 12-45

    Tunables (env vars):
      CONTENT_COMPRESSION_SEARCH_THRESHOLD (default 800 chars)
    """
    threshold = _env_int("CONTENT_COMPRESSION_SEARCH_THRESHOLD", 800)
    if len(text) <= threshold:
        return text

    lines = text.splitlines()
    if len(lines) < 20:
        return text

    # Try to detect "path:lineno|content" pattern from search_files output
    # Format: /path/file.py|LINE_NUM|CONTENT
    _search_line = re.compile(r"^([^|]+)\|(\d+)\|(.*)$")

    collapsed: list[str] = []
    i = 0
    total_before = len(text)

    while i < len(lines):
        m = _search_line.match(lines[i])
        if not m:
            collapsed.append(lines[i])
            i += 1
            continue

        path = m.group(1)
        lineno = int(m.group(2))

        # Scan ahead for consecutive lines from the same file
        run_start = lineno
        run_end = lineno
        j = i + 1
        while j < len(lines):
            nm = _search_line.match(lines[j])
            if not nm or nm.group(1) != path or int(nm.group(2)) != run_end + 1:
                break
            run_end = int(nm.group(2))
            j += 1

        run_len = j - i
        if run_len >= 3:
            # Collapse to range notation
            collapsed.append(f"{path}|{run_start}-{run_end}|({run_len} matches)")
            i = j
        else:
            collapsed.append(lines[i])
            i += 1

    result = "\n".join(collapsed)

    _stats["search_chars_before"] += total_before
    _stats["search_chars_after"] += len(result)
    _stats["search_calls"] += 1

    logger.debug(
        "content-compression: search %d → %d chars (%.0f%% reduction)",
        total_before, len(result),
        100 * (1 - len(result) / total_before) if total_before else 0,
    )

    return result


def _estimate_tokens(char_count: int) -> int:
    """Rough token estimate: ~4 chars/token for typical text."""
    return max(1, int(char_count / _CHARS_PER_TOKEN))


# ---------------------------------------------------------------------------
# Hook callbacks
# ---------------------------------------------------------------------------

def _on_transform_terminal_output(
    output: str = "",
    command: str = "",
    returncode: int = 0,
    **kwargs,
) -> Optional[str]:
    """Compress long shell command output."""
    if not _env_bool("CONTENT_COMPRESSION_LAYER_TERMINAL", True):
        return None
    if not output:
        return None
    return _compress_terminal_output(output)


def _on_transform_tool_result(
    tool_name: str = "",
    args: Optional[dict] = None,
    result: str = "",
    **kwargs,
) -> Optional[str]:
    """Compress file reads and search results."""
    if not isinstance(result, str) or not result:
        return None

    if tool_name in ("read_file", "write_file") and _env_bool("CONTENT_COMPRESSION_LAYER_FILE", True):
        return _density_filter(result)

    if tool_name == "search_files" and _env_bool("CONTENT_COMPRESSION_LAYER_SEARCH", True):
        return _match_summarizer(result)

    return None


# ---------------------------------------------------------------------------
# Plugin registration
# ---------------------------------------------------------------------------

def register(ctx) -> None:
    ctx.register_hook("transform_terminal_output", _on_transform_terminal_output)
    ctx.register_hook("transform_tool_result", _on_transform_tool_result)
    logger.info(
        "content-compression plugin loaded. Layers: terminal=%s, file=%s, search=%s "
        "(toggle with CONTENT_COMPRESSION_LAYER_* env vars)",
        _env_bool("CONTENT_COMPRESSION_LAYER_TERMINAL", True),
        _env_bool("CONTENT_COMPRESSION_LAYER_FILE", True),
        _env_bool("CONTENT_COMPRESSION_LAYER_SEARCH", True),
    )
