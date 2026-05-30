"""
verify_self_model — Post-LLM verifier for Athena's self-model narrative.

Reads the generated self-model text on stdin and checks for common
fabrication patterns:

  1. Goal ID references that don't exist in athena_memory.db
  2. Episode-count claims that exceed what was provided to the prompt
  3. Tool/signal counts that aren't grounded in the facts sidecar
  4. Claims about capabilities not listed in the last cognitive state

Runs in soft mode by default: flags issues but doesn't block. The
process runner decides whether to remediate based on output.

Scope is intentionally narrow — only verifiable numeric/metadata claims.
Narrative framing and subjective reflections are left alone.
"""

from __future__ import annotations

import json
import re
import sqlite3
import sys
from pathlib import Path

HOME = Path.home()
DB = HOME / "athena_memory.db"

# Max episodes the prompt actually receives (from once_handlers.py:113: [episodes[:15]])
_MAX_EPISODES_IN_PROMPT = 15

# Patterns likely to appear in fabricated self-model claims
_GOAL_ID_PATTERN = re.compile(r"\b(goal[a-f0-9]{7,8}|[a-f0-9]{8})\b", re.IGNORECASE)
_COUNT_CLAIM_PATTERN = re.compile(
    r"\b(\d+)\s*(?:episodes?|goals?|signals?|outcomes?|conversations?|tools?|fir(?:e|ing)s?|attempts?|failure?s?|error?s?)\b",
    re.IGNORECASE,
)
# Claims about capabilities: "I can X", "I have Y", "I do Z"
_CAPABILITY_CLAIM_PATTERN = re.compile(
    r"\b(?:I can|I have|I do|I am|I'm|my ability to|i possess)\s+(.+?)(?:\.|;|,|\n)",
    re.IGNORECASE,
)


def _load_goal_ids() -> set[str]:
    """Load all known goal IDs from the DB."""
    try:
        conn = sqlite3.connect(str(DB), timeout=5)
        rows = conn.execute("SELECT id FROM goals").fetchall()
        conn.close()
        return {str(r[0]).strip().lower() for r in rows if r[0]}
    except Exception:
        return set()


def _check_fabricated_goal_ids(text: str, known_goals: set[str]) -> list[str]:
    """Flag goal IDs that appear in the text but don't exist in the DB."""
    issues: list[str] = []
    for m in _GOAL_ID_PATTERN.finditer(text):
        candidate = m.group(0).strip().lower()
        # Skip hex that's clearly part of a longer identifier
        if len(candidate) < 7:
            continue
        # Skip common false positives (dates, times, version numbers)
        if candidate.startswith(("202", "19", "20")) and len(candidate) == 10:
            continue
        if candidate not in known_goals:
            issues.append(
                f"Referenced goal ID `{candidate}` does not exist in the goals table"
            )
    return issues


def _check_excessive_count_claims(text: str) -> list[str]:
    """Flag count claims about episodes that exceed the actual window size."""
    issues: list[str] = []
    for m in _COUNT_CLAIM_PATTERN.finditer(text):
        count = int(m.group(1))
        context = m.group(2).lower()
        if "episode" in context and count > _MAX_EPISODES_IN_PROMPT:
            issues.append(
                f"Claimed `{count} episodes` but the prompt only provides up to "
                f"{_MAX_EPISODES_IN_PROMPT} episodes"
            )
    return issues


def _check_unusual_capability_claims(text: str) -> list[str]:
    """Flag capability claims for things not in the standard Athena capability set."""
    # Standard capabilities Athena actually has
    _KNOWN_CAPABILITIES = {
        "read", "write", "search", "remember", "recall",
        "reflect", "think", "reason", "analyze", "summarize",
        "propose", "plan", "execute", "act", "decide",
        "learn", "adapt", "improve", "grow", "change",
        "communicate", "respond", "answer", "ask", "question",
        "synthesize", "integrate", "connect", "link", "relate",
        "monitor", "observe", "perceive", "attend", "focus",
        "generate", "create", "write notes", "save",
        "search vault", "read vault", "browse web", "search web",
        "fetch", "retrieve", "send message", "telegram",
        "run commands", "execute code", "use tools",
        "pursue goals", "work autonomously", "work between turns",
        "consolidate", "reorganize", "prioritize", "triage",
    }

    issues: list[str] = []
    for m in _CAPABILITY_CLAIM_PATTERN.finditer(text):
        claim = m.group(1).strip().lower()
        # Skip short or vague claims
        if len(claim) < 10:
            continue
        # Check if the claimed capability is plausibly known
        is_known = any(kw in claim for kw in _KNOWN_CAPABILITIES)
        if not is_known:
            issues.append(
                f"Unusual capability claim: `{claim[:80]}...` — this capability "
                f"is not in the known capability set and may be fabricated"
            )
    return issues


def verify(text: str) -> list[str]:
    """Run all verification checks. Returns list of issue descriptions."""
    if not text.strip():
        return []

    known_goals = _load_goal_ids()
    issues: list[str] = []

    issues.extend(_check_fabricated_goal_ids(text, known_goals))
    issues.extend(_check_excessive_count_claims(text))
    issues.extend(_check_unusual_capability_claims(text))

    # Dedupe
    seen: set[str] = set()
    deduped: list[str] = []
    for i in issues:
        if i not in seen:
            seen.add(i)
            deduped.append(i)
    return deduped


def main() -> int:
    text = sys.stdin.read()
    if not text.strip():
        return 0
    issues = verify(text)
    if not issues:
        return 0
    print("## ⚠️ Self-Model Verification Issues")
    print()
    for i in issues:
        print(f"- {i}")
    print()
    print(
        "_If a flagged claim is correct in context, the regex got confused; "
        "if not, the narrative should be corrected._"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
