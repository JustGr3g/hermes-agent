#!/usr/bin/env python3
"""
Post-LLM verifier for Athena's Daily Autonomous Actions Summary.

Reads the LLM-generated summary on stdin and the ground-truth facts dict
written by daily_summary_facts.py at hermes/state/last_summary_facts.json.
Extracts numeric claims tied to verifiable system metrics and flags any
that don't match the facts. Discrepancies are printed to stdout as a
Markdown footer block. Empty output = no issues found.

Scope is intentionally narrow — only claims about named tools, today's
goal/error/block counts. Narrative numbers (% trends, "feel ~30% busier")
are left alone to avoid false positives.

Runs in soft mode by default: the scheduler appends the footer to the
delivered message and ships it anyway. Future iteration may escalate to
hard-fail + re-prompt once the catch-rate is calibrated.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

FACTS_JSON = (
    Path.home() / "cognitive-agent" / "hermes" / "state" / "last_summary_facts.json"
)


def _load_facts() -> dict | None:
    try:
        return json.loads(FACTS_JSON.read_text())
    except Exception:
        return None


def _tool_truth(facts: dict) -> dict[str, dict]:
    """Map tool_name -> {'ok': int, 'fail': int, 'total': int} for today."""
    out: dict[str, dict] = {}
    for row in facts.get("tool_fires_today", []) or []:
        name = row.get("tool")
        if not name:
            continue
        ok = int(row.get("ok") or 0)
        fail = int(row.get("fail") or 0)
        # daily_summary_facts.py now splits fail into genuine failures vs
        # pre-execution anchor-guard rejections. A summary may legitimately
        # report either the total fail or just real_fail — accept both.
        real_fail = int(row.get("real_fail", fail) or 0)
        out[name] = {
            "ok": ok,
            "fail": fail,
            "real_fail": real_fail,
            "total": ok + fail,
        }
    return out


# Match "N/M", "N out of M", "N of M" patterns near a tool name.
# Example matches: "opencode_edit failed 4/4 times", "0 of 4"
_FRAC_RE = re.compile(r"\b(\d+)\s*(?:/|of|out of)\s*(\d+)\b", re.IGNORECASE)
_FAIL_COUNT_RE = re.compile(
    r"\b(\d+)\s+(?:failure|failures|fails|failed)\b", re.IGNORECASE
)
# "ok" intentionally excluded — it's too generic ("12 ok on tool_X" in
# narration trips false matches; "N successes" / "succeeded" are the
# disciplined forms we actually want to catch.
_SUCCESS_COUNT_RE = re.compile(
    r"\b(\d+)\s+(?:success|successes|succeeded)\b", re.IGNORECASE
)

# Maximum char distance between a numeric claim and a tool mention for
# attribution. The buggy prior implementation scanned a 150-char window per
# tool, which let claims about one tool be misattributed to a different
# tool mentioned in the same sentence. Closest-tool-wins with a tight cap
# AND sentence-boundary respect keeps cross-clause leakage out.
_TOOL_CLAIM_MAX_DISTANCE = 80

# Treat these characters as sentence/clause separators. A claim and a tool
# mention separated by one of these are considered different clauses, so
# the tool cannot own the claim — even if it's physically closer than a
# same-sentence alternative.
_SENTENCE_BREAK_RE = re.compile(r"[.!?\n]")


def _separated_by_break(summary: str, a: int, b: int) -> bool:
    lo, hi = (a, b) if a <= b else (b, a)
    return _SENTENCE_BREAK_RE.search(summary, lo, hi) is not None


def _nearest_tool(
    match_pos: int,
    tool_spans: list[tuple[str, int, int]],
    summary: str,
) -> tuple[str, int] | None:
    """Return (tool_name, char_distance) of the tool mention closest to
    match_pos within the same sentence. Distance is 0 when match_pos falls
    inside the tool span. Tools separated from match_pos by a sentence
    break are skipped."""
    best: tuple[str, int] | None = None
    for name, s, e in tool_spans:
        if s <= match_pos <= e:
            dist = 0
        elif match_pos < s:
            if _separated_by_break(summary, match_pos, s):
                continue
            dist = s - match_pos
        else:
            if _separated_by_break(summary, e, match_pos):
                continue
            dist = match_pos - e
        if best is None or dist < best[1]:
            best = (name, dist)
    return best


def _check_tool_claims(summary: str, truth: dict[str, dict]) -> list[str]:
    """Find numeric claims (fractions, failure/success counts) and attribute
    each to the nearest mention of a tracked tool. Flag claims that
    contradict that tool's ground-truth counts. Claims that aren't within
    _TOOL_CLAIM_MAX_DISTANCE of any tool mention are ignored — they're
    probably general narrative numbers, not per-tool stats."""
    issues: list[str] = []
    if not truth:
        return issues

    tool_spans: list[tuple[str, int, int]] = []
    for tool_name in truth.keys():
        for m in re.finditer(re.escape(tool_name), summary):
            tool_spans.append((tool_name, m.start(), m.end()))
    if not tool_spans:
        return issues

    def _attribute(start: int, end: int) -> str | None:
        nearest = _nearest_tool((start + end) // 2, tool_spans, summary)
        if nearest is None or nearest[1] > _TOOL_CLAIM_MAX_DISTANCE:
            return None
        return nearest[0]

    # Fraction claims: "4/4", "0 of 4", etc.
    for frac in _FRAC_RE.finditer(summary):
        name = _attribute(frac.start(), frac.end())
        if name is None:
            continue
        t = truth[name]
        claim_n, claim_d = int(frac.group(1)), int(frac.group(2))
        fits = (
            (claim_n == t["fail"] and claim_d == t["total"])
            or (claim_n == t["real_fail"] and claim_d == t["total"])
            or (claim_n == t["ok"] and claim_d == t["total"])
        )
        if not fits:
            issues.append(
                f"- `{name}` claimed `{claim_n}/{claim_d}`; "
                f"actual today: {t['ok']} ok / {t['fail']} fail "
                f"({t['total']} total)"
            )

    # Bare "N failures" claims.
    for fc in _FAIL_COUNT_RE.finditer(summary):
        name = _attribute(fc.start(), fc.end())
        if name is None:
            continue
        t = truth[name]
        claim = int(fc.group(1))
        if claim not in (t["fail"], t["real_fail"]):
            issues.append(
                f"- `{name}` claimed `{claim} failures`; "
                f"actual: {t['fail']} total ({t['real_fail']} real, "
                f"{t['fail'] - t['real_fail']} anchor-rejected)"
            )

    # Bare "N successes" claims.
    for sc in _SUCCESS_COUNT_RE.finditer(summary):
        name = _attribute(sc.start(), sc.end())
        if name is None:
            continue
        t = truth[name]
        claim = int(sc.group(1))
        if claim != t["ok"]:
            issues.append(
                f"- `{name}` claimed `{claim} successes`; "
                f"actual today: {t['ok']}"
            )
    return issues


# "N error(s)", "N timeout(s)", "N 503", etc.
_HTTP503_RE = re.compile(r"\b(\d+)\s*(?:http[_ -]?)?503", re.IGNORECASE)


def _check_block_and_error_claims(summary: str, facts: dict) -> list[str]:
    issues: list[str] = []

    # http_503 / 503 claims.
    err = facts.get("errors_today") or {}
    actual_503 = int(err.get("http_503") or 0)
    for m in _HTTP503_RE.finditer(summary):
        claim = int(m.group(1))
        if claim != actual_503:
            issues.append(
                f"- claimed `{claim} × 503`; actual today: {actual_503}"
            )
    return issues


def verify(summary: str, facts: dict) -> list[str]:
    issues: list[str] = []
    issues.extend(_check_tool_claims(summary, _tool_truth(facts)))
    issues.extend(_check_block_and_error_claims(summary, facts))
    # Dedupe while preserving order — the regex windows overlap.
    seen: set[str] = set()
    deduped: list[str] = []
    for i in issues:
        if i not in seen:
            seen.add(i)
            deduped.append(i)
    return deduped


def main() -> int:
    summary = sys.stdin.read()
    if not summary.strip():
        return 0
    facts = _load_facts()
    if facts is None:
        # No ground truth available — skip silently rather than appending
        # a misleading footer.
        return 0
    issues = verify(summary, facts)
    if not issues:
        return 0
    print("\n\n---\n## ⚠️ Reality Check (auto-generated)\n")
    print(
        "The following numeric claims in this summary do not match the "
        "ground-truth facts gathered before generation:\n"
    )
    for i in issues:
        print(i)
    print(
        "\n_If a flagged claim is correct in context the regex got confused; "
        "if not, treat the summary as partially confabulated._"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
