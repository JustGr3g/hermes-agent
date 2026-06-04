#!/usr/bin/env python3
"""Load the latest 'Daily Autonomous Actions Summary' for the morning-review cron.

Output goes to stdout and is injected into the review agent's prompt.

Storage (2026-06-03 rewrite): Hermes v0.15.2 stopped writing per-cron
`session_cron_<id>_<ts>.json` files under `hermes/sessions/`. Session
transcripts now live in SQLite at `hermes/state.db` (tables `sessions` +
`messages`), and the daily-summary cron runs as a generic `source='cli'`
session (id `<YYYYMMDD>_<HHMMSS>_<hash>`) with no embedded cron id and no
title. The old loader globbed the now-frozen JSON directory and so reported
`[NO_SUMMARY]` every morning after the upgrade. This version reads `state.db`.

Logic:
  - The rendered summary is the newest **assistant** message whose body
    contains the section-#4 header ('What Needs Attention'), in a `cli`/`cron`
    session (telegram chatter that merely quotes the summary is excluded).
    The cron's PROMPT also contains the marker, so role must be 'assistant'.
  - **Freshness gate (primary):** the owning session must have started on
    *today's* local calendar day. The cron fires ~06:30 and this review runs
    ~07:00 the same morning, so exactly one summary is valid per day. A
    prior-day session means today's cron hasn't produced a summary yet, and
    serving yesterday's would re-process an already-adjudicated report.
  - **Age backstop (secondary):** a `MAX_AGE_HOURS` cap as defense-in-depth.
  - If the message contains '[SILENT]' or is empty, emit a sentinel so the
    review agent no-ops.

All "skip today" paths emit a single line beginning with `[NO_SUMMARY] ` so the
review SKILL's existing "starts-with [NO_SUMMARY] → post and stop" branch fires
without modification. On success the contract is unchanged:
    === DAILY_SUMMARY_FROM <session-id> ===
    <summary text>
    === END_DAILY_SUMMARY ===
"""
from __future__ import annotations

import os
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

STATE_DB = Path(os.path.expanduser("~/cognitive-agent/hermes/state.db"))
SUMMARY_MARKER = "What Needs Attention"  # section #4 header — in the rendered summary
# The cron historically ran as source='cron'; v0.15.2 runs it as 'cli'. Accept
# both, but never 'telegram' (chat that quotes the summary would false-match).
SUMMARY_SOURCES = ("cli", "cron")
MAX_AGE_HOURS = 30  # secondary backstop


def find_latest_summary() -> tuple[str, str, float] | None:
    """Return (session_id, content, started_at) for the newest assistant
    message containing the summary marker in a cli/cron session, or None."""
    if not STATE_DB.exists():
        return None
    placeholders = ",".join("?" for _ in SUMMARY_SOURCES)
    sql = (
        "SELECT m.session_id, m.content, s.started_at "
        "FROM messages m JOIN sessions s ON s.id = m.session_id "
        "WHERE m.role = 'assistant' "
        "  AND m.content LIKE ? "
        f"  AND s.source IN ({placeholders}) "
        "ORDER BY m.timestamp DESC "
        "LIMIT 1"
    )
    try:
        conn = sqlite3.connect(f"file:{STATE_DB}?mode=ro", uri=True)
    except Exception:
        return None
    try:
        row = conn.execute(
            sql, (f"%{SUMMARY_MARKER}%", *SUMMARY_SOURCES)
        ).fetchone()
    except Exception:
        return None
    finally:
        conn.close()
    if not row:
        return None
    return row[0], row[1], row[2]


def is_fresh(started_at: float, now: datetime) -> tuple[bool, str]:
    """Decide whether a summary whose session started at `started_at` (epoch)
    is today's. Returns (fresh, reason)."""
    started_dt = datetime.fromtimestamp(started_at)
    if started_dt.date() != now.date():
        return False, (
            f"Newest summary is from {started_dt.date()} "
            f"(session started {started_dt:%Y-%m-%d %H:%M}), but today is "
            f"{now.date()}. Today's 06:30 cron has not produced a summary yet "
            f"— skipping to avoid re-reviewing yesterday's report."
        )
    age = now - started_dt
    if age > timedelta(hours=MAX_AGE_HOURS):
        return False, (
            f"Newest summary is {age.total_seconds() / 3600:.0f}h old "
            f"(> {MAX_AGE_HOURS}h) — treating as stale."
        )
    return True, ""


def main() -> int:
    now = datetime.now()
    found = find_latest_summary()
    if found is None:
        print("[NO_SUMMARY] No Daily Autonomous Actions Summary found in "
              "state.db. Skip today's review.")
        return 0
    session_id, content, started_at = found
    fresh, reason = is_fresh(started_at, now)
    if not fresh:
        print(f"[NO_SUMMARY] {reason}")
        return 0
    if not content or not content.strip():
        print(f"[NO_SUMMARY] Session {session_id} contained an empty summary "
              f"message. Skip today's review.")
        return 0
    if "[SILENT]" in content:
        print("[NO_SUMMARY] Latest cron run emitted [SILENT]. Skip today's review.")
        return 0
    print(f"=== DAILY_SUMMARY_FROM {session_id} ===")
    print(content.strip())
    print("=== END_DAILY_SUMMARY ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
