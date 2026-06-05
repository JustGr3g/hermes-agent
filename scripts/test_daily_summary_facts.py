#!/usr/bin/env python3
"""Regression tests for daily_summary_facts.py window + categorization fixes.

Run: python3 hermes/scripts/test_daily_summary_facts.py

These lock in the 2026-05-30 fixes:
  1. Overnight-activity metrics use a rolling 24h window, NOT local-
     calendar-day. The cron fires at ~06:30, so a calendar-day window
     reads activity that ran until late the prior evening as ZERO — the
     recurring "Musing didn't fire" / "opencode stopped" false alarms.
  2. opencode_run anchor-guard rejections (success=0, ~0ms latency) are
     split out from genuine failures so they aren't counted as a
     reliability "failure rate".

No pytest dependency — plain asserts, exits non-zero on failure.
"""
from __future__ import annotations

import datetime
import sqlite3
import sys
import tempfile
from pathlib import Path

import daily_summary_facts as dsf


def _seed_db(path: Path) -> None:
    conn = sqlite3.connect(path)
    conn.executescript(
        """
        CREATE TABLE metacognitive_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL NOT NULL, signal TEXT NOT NULL,
            confidence_before REAL NOT NULL DEFAULT 0,
            confidence_after REAL NOT NULL DEFAULT 0,
            context TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}');
        CREATE TABLE tool_outcomes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, tool_name TEXT NOT NULL,
            goal_id TEXT, success INTEGER NOT NULL, latency_ms REAL NOT NULL,
            timestamp REAL NOT NULL, args_summary TEXT, error TEXT);
        CREATE TABLE goals (
            id TEXT PRIMARY KEY, content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            created_at REAL NOT NULL, updated_at REAL NOT NULL,
            attempt_count INTEGER DEFAULT 0, failure_count INTEGER DEFAULT 0);
        """
    )

    now = datetime.datetime.now()
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    # 02:00 LAST night — inside the rolling 24h window but BEFORE today's
    # local midnight. This is precisely the row a calendar-day window drops.
    last_evening = (midnight - datetime.timedelta(hours=4)).timestamp()
    # 40h ago — outside the 24h window, must NOT be counted.
    long_ago = (now - datetime.timedelta(hours=40)).timestamp()

    conn.executemany(
        "INSERT INTO metacognitive_events (timestamp, signal, context, data) "
        "VALUES (?,?,?,?)",
        [
            (last_evening, "maintenance", "stuck_cycle_musing",
             '{"focus": "x", "has_followup": true}'),
            (last_evening + 60, "maintenance", "stuck_cycle_musing",
             '{"focus": "y", "has_followup": false}'),
            (long_ago, "maintenance", "stuck_cycle_musing",
             '{"focus": "stale", "has_followup": true}'),
        ],
    )
    conn.executemany(
        "INSERT INTO tool_outcomes (tool_name, success, latency_ms, timestamp, error) "
        "VALUES (?,?,?,?,?)",
        [
            ("opencode_run", 1, 40000.0, last_evening, None),       # real success
            ("opencode_run", 0, 0.0, last_evening,                  # anchor reject
             "prompt has no concrete anchor (no file path, identifier, ...)"),
            ("opencode_run", 0, 79000.0, last_evening, "no final assistant text"),  # real fail
        ],
    )
    conn.executemany(
        "INSERT INTO goals (id, content, status, created_at, updated_at) "
        "VALUES (?,?,?,?,?)",
        [
            ("g1", "c", "completed", long_ago, last_evening),
            ("g2", "c", "suspended", long_ago, last_evening),
            ("g3", "c", "completed", long_ago, long_ago),  # updated outside window
        ],
    )
    conn.commit()
    conn.close()


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        db = Path(td) / "athena_memory.db"
        _seed_db(db)
        dsf.DB = db  # monkeypatch the module global

        facts = dsf.gather()

        # 1. Musing window: both last-evening fires counted, stale one dropped.
        assert len(facts["musing_fires_24h"]) == 2, facts["musing_fires_24h"]
        assert facts["musing_followup_count_24h"] == 1, facts
        assert "musing_fires_today" not in facts, "old calendar-day key lingered"

        # 2. opencode_run split: 1 ok, 2 total fail, 1 anchor-rejected, 1 real.
        oc = next(t for t in facts["tool_fires_today"] if t["tool"] == "opencode_run")
        assert oc["ok"] == 1, oc
        assert oc["fail"] == 2, oc
        assert oc["validation_rejected"] == 1, oc
        assert oc["real_fail"] == 1, oc
        # avg_ms is over successful runs only → 40000, not deflated by the 0ms reject
        assert oc["avg_ms"] == 40000.0, oc

        # 3. Goal transitions use rolling 24h by updated_at.
        gt = facts["goals_transitions_24h_by_status"]
        assert gt.get("completed") == 1 and gt.get("suspended") == 1, gt

        # 4. render does not crash and surfaces the corrected musing count.
        md = dsf.render_markdown(facts)
        assert "Musing activity — last 24h" in md, "render label missing"
        assert "2 fires" in md, md[:500]

    print("PASS — daily_summary_facts window + opencode-split regression tests")
    return 0


if __name__ == "__main__":
    sys.exit(main())
