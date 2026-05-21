#!/usr/bin/env python3
"""Load the latest 'Daily Autonomous Actions Summary' for the morning-review cron.

Output goes to stdout and is injected into the review agent's prompt.

Logic:
  - Find the newest `session_cron_19afc91d5544_*.json` (the autonomous-summary cron's
    own session log; the cron's id is `19afc91d5544`).
  - Extract the final assistant message that contains the rendered summary (look
    for the section header 'What Needs Attention').
  - If the message also contains '[SILENT]' or is empty, output a sentinel so the
    review agent knows to no-op.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

SESSIONS_DIR = Path(os.path.expanduser(
    "~/cognitive-agent/hermes/sessions"
))
CRON_ID = "19afc91d5544"   # the "Daily Autonomous Actions Summary" cron's id
SUMMARY_MARKER = "What Needs Attention"
MAX_AGE_HOURS = 30   # if newest run is older than this, treat as missing


def find_latest_session() -> Path | None:
    candidates = sorted(
        SESSIONS_DIR.glob(f"session_cron_{CRON_ID}_*.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        return None
    newest = candidates[0]
    age = datetime.now() - datetime.fromtimestamp(newest.stat().st_mtime)
    if age > timedelta(hours=MAX_AGE_HOURS):
        return None
    return newest


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
    session = find_latest_session()
    if session is None:
        print("[NO_SUMMARY] No recent Daily Autonomous Actions Summary found in the last "
              f"{MAX_AGE_HOURS}h. Skip today's review.")
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
