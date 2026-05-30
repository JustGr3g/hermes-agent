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


# Match "N/M", "N out of M", "N of M", or "N times" patterns near a tool name.
# Example matches: "opencode_edit failed 4/4 times", "0 successes against 4 failures"
_FRAC_RE = re.compile(r"\b(\d+)\s*(?:/|of|out of)\s*(\d+)\b", re.IGNORECASE)
_FAIL_COUNT_RE = re.compile(
    r"\b(\d+)\s+(?:failure|failures|fails|failed)\b", re.IGNORECASE
)
_SUCCESS_COUNT_RE = re.compile(
    r"\b(\d+)\s+(?:success|successes|succeeded|ok)\b", re.IGNORECASE
)


def _check_tool_claims(summary: str, truth: dict[str, dict]) -> list[str]:
    """For each tool that appears in the summary, check that nearby
    fraction / failure-count / success-count claims match the truth."""
    issues: list[str] = []
    if not truth:
        return issues

    for tool_name, t in truth.items():
        # Find each mention of the tool and inspect a +/- 120 char window.
        for m in re.finditer(re.escape(tool_name), summary):
            start = max(0, m.start() - 30)
            end = min(len(summary), m.end() + 120)
            window = summary[start:end]

            # Fraction claims: "4/4", "0 of 4", etc.
            for frac in _FRAC_RE.finditer(window):
                claim_n, claim_d = int(frac.group(1)), int(frac.group(2))
                # Compare against (fail, total) and (ok, total) — flag only if
                # neither interpretation matches reality.
                fits_fail = (claim_n == t["fail"] and claim_d == t["total"])
                fits_real_fail = (claim_n == t["real_fail"] and claim_d == t["total"])
                fits_ok = (claim_n == t["ok"] and claim_d == t["total"])
                if not (fits_fail or fits_real_fail or fits_ok):
                    issues.append(
                        f"- `{tool_name}` claimed `{claim_n}/{claim_d}`; "
                        f"actual today: {t['ok']} ok / {t['fail']} fail "
                        f"({t['total']} total)"
                    )

            # Bare "N failures" claims.
            for fc in _FAIL_COUNT_RE.finditer(window):
                claim = int(fc.group(1))
                if claim not in (t["fail"], t["real_fail"]):
                    issues.append(
                        f"- `{tool_name}` claimed `{claim} failures`; "
                        f"actual: {t['fail']} total ({t['real_fail']} real, "
                        f"{t['fail'] - t['real_fail']} anchor-rejected)"
                    )

            # Bare "N successes" claims.
            for sc in _SUCCESS_COUNT_RE.finditer(window):
                claim = int(sc.group(1))
                if claim != t["ok"]:
                    issues.append(
                        f"- `{tool_name}` claimed `{claim} successes`; "
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
