#!/usr/bin/env python3
"""Load the latest 'Daily Autonomous Actions Summary' for the morning-review cron.

Output goes to stdout and is injected into the review agent's prompt.

Logic:
  - Find the newest `session_cron_19afc91d5544_*.json` (the autonomous-summary cron's
    own session log; the cron's id is `19afc91d5544`).
  - **Freshness gate (primary):** the summary must be from *today's* local
    calendar day. The summary cron fires at ~06:30 and this review runs at
    ~07:00 the same morning, so exactly one summary is valid per day. If the
    newest session is from a prior day, today's cron has not produced a summary
    yet, and serving yesterday's would make the review re-process an
    already-adjudicated report. The session's own embedded timestamp
    (`YYYYMMDD_HHMMSS` in the filename) is the authoritative fire time — we do
    not trust mtime, which a copy/touch could move.
  - **Age backstop (secondary):** a `MAX_AGE_HOURS` cap still applies, as
    defense-in-depth and as the fallback when a filename can't be parsed.
  - Extract the final assistant message that contains the rendered summary (look
    for the section header 'What Needs Attention').
  - If the message also contains '[SILENT]' or is empty, output a sentinel so the
    review agent knows to no-op.

All "skip today" paths emit a single line beginning with `[NO_SUMMARY] ` so the
review SKILL's existing "starts-with [NO_SUMMARY] → post and stop" branch fires
without modification.
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

SESSIONS_DIR = Path(os.path.expanduser(
    "~/cognitive-agent/hermes/sessions"
))
CRON_ID = "19afc91d5544"   # the "Daily Autonomous Actions Summary" cron's id
SUMMARY_MARKER = "What Needs Attention"
MAX_AGE_HOURS = 30   # secondary backstop / fallback when the filename won't parse

# session_cron_<id>_<YYYYMMDD>_<HHMMSS>.json — the date/time block is the cron's
# local fire time, which is the source of truth for "which day is this summary?"
_SESSION_RE = re.compile(
    r"session_cron_" + re.escape(CRON_ID) + r"_(\d{8})_(\d{6})\.json$"
)


def parse_session_dt(path: Path) -> datetime | None:
    """Return the local datetime embedded in the session filename, or None if
    the name doesn't match the expected `<YYYYMMDD>_<HHMMSS>` shape."""
    m = _SESSION_RE.search(path.name)
    if not m:
        return None
    try:
        return datetime.strptime(m.group(1) + m.group(2), "%Y%m%d%H%M%S")
    except ValueError:
        return None


def find_latest_session() -> Path | None:
    """Newest cron-summary session file by mtime, or None if there are none."""
    candidates = sorted(
        SESSIONS_DIR.glob(f"session_cron_{CRON_ID}_*.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


def is_fresh(session: Path, now: datetime) -> tuple[bool, str]:
    """Decide whether `session` is today's summary.

    Returns (fresh, reason). When not fresh, `reason` is a human-readable
    explanation suitable for the `[NO_SUMMARY]` line.
    """
    session_dt = parse_session_dt(session)
    if session_dt is not None:
        # Primary gate: same local calendar day as the review run.
        if session_dt.date() != now.date():
            return False, (
                f"Newest summary is from {session_dt.date()} ({session.name}), "
                f"but today is {now.date()}. Today's 06:30 cron has not produced "
                f"a summary yet — skipping to avoid re-reviewing yesterday's "
                f"report."
            )
        return True, ""
    # Fallback: filename didn't parse — fall back to the mtime age backstop so we
    # never crash on an unexpected name.
    age = now - datetime.fromtimestamp(session.stat().st_mtime)
    if age > timedelta(hours=MAX_AGE_HOURS):
        return False, (
            f"Newest summary {session.name} is {age.total_seconds() / 3600:.0f}h "
            f"old (> {MAX_AGE_HOURS}h) and its filename could not be parsed for a "
            f"date — treating as stale."
        )
    return True, ""


def extract_summary(session_path: Path) -> str | None:
    try:
        d = json.loads(session_path.read_text())
    except Exception as e:
        print(f"# error reading {session_path}: {e}", file=sys.stderr)
        return None
    messages = d.get("messages") or []
    # Walk backwards — the rendered summary is the final assistant message.
    for m in reversed(messages):
        if m.get("role") != "assistant":
            continue
        content = m.get("content")
        if isinstance(content, list):
            # Multi-part — concatenate text parts.
            content = " ".join(
                (c.get("text") if isinstance(c, dict) else str(c))
                for c in content
            )
        if not isinstance(content, str):
            continue
        if SUMMARY_MARKER in content:
            return content
    return None


def main() -> int:
    now = datetime.now()
    session = find_latest_session()
    if session is None:
        print("[NO_SUMMARY] No Daily Autonomous Actions Summary found at all. "
              "Skip today's review.")
        return 0
    fresh, reason = is_fresh(session, now)
    if not fresh:
        print(f"[NO_SUMMARY] {reason}")
        return 0
    summary = extract_summary(session)
    if not summary:
        print(f"[NO_SUMMARY] Session {session.name} contained no summary text (cron may have "
              f"emitted [SILENT]). Skip today's review.")
        return 0
    if "[SILENT]" in summary:
        print("[NO_SUMMARY] Latest cron run emitted [SILENT]. Skip today's review.")
        return 0
    # Prepend a header so the agent prompt can match on it.
    print(f"=== DAILY_SUMMARY_FROM {session.name} ===")
    print(summary.strip())
    print(f"=== END_DAILY_SUMMARY ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
