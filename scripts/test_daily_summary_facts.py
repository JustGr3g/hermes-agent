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


def _test_verified_actions_helper() -> None:
    """Pure-function contract for the verified-actions ledger (2026-06-11).

    Mirrors messaging.py::_verified_actions_block's role: tool_outcomes is
    the only ground truth for what actually ran; read-only tools are
    excluded; distinct args are kept (deduped, capped) so the gate can
    back "I did X" prose.
    """
    rows = [
        {"tool_name": "save_note", "success": True, "args_summary": "title='a'"},
        {"tool_name": "save_note", "success": True, "args_summary": "title='a'"},  # dup
        {"tool_name": "save_note", "success": False, "args_summary": "title='b'"},
        {"tool_name": "send_message", "success": True, "args_summary": "to=greg"},
        {"tool_name": "read_athena_vault", "success": True, "args_summary": "q=x"},
        {"tool_name": "recall_memory", "success": True, "args_summary": "q=y"},
    ]
    va = dsf._build_verified_actions(rows)
    # 2 read-only fires excluded, 4 effect fires counted.
    assert va["excluded_read_fires"] == 2, va
    assert va["total_effect_fires"] == 4, va
    sn = next(t for t in va["by_tool"] if t["tool"] == "save_note")
    assert sn["n"] == 3 and sn["ok"] == 2 and sn["fail"] == 1, sn
    # Distinct args deduped: 'a' appears twice but listed once.
    assert sn["samples"] == ["title='a'", "title='b'"], sn
    # by_tool ordered by fire count desc (save_note=3 before send_message=1).
    assert va["by_tool"][0]["tool"] == "save_note", va["by_tool"]

    # Args truncation + dedup cap.
    many = [
        {"tool_name": "opencode_edit", "success": True, "args_summary": f"file=f{i}.py"}
        for i in range(dsf._VERIFIED_ACTIONS_SAMPLES_PER_TOOL + 5)
    ]
    va2 = dsf._build_verified_actions(many)
    oc = va2["by_tool"][0]
    assert len(oc["samples"]) == dsf._VERIFIED_ACTIONS_SAMPLES_PER_TOOL, oc
    assert oc["more_distinct"] == 5, oc

    # Empty / all-reads case → no effect actions, reads counted.
    va3 = dsf._build_verified_actions(
        [{"tool_name": "recall_memory", "success": True, "args_summary": "q"}]
    )
    assert va3["total_effect_fires"] == 0 and va3["by_tool"] == [], va3
    assert va3["excluded_read_fires"] == 1, va3


def _test_action_claims_gate_renders(facts: dict) -> None:
    """The rendered facts must carry the hard ACTION CLAIMS clause so the
    gate travels with the data into the cron prompt."""
    md = dsf.render_markdown(facts)
    assert "Verified actions — last 24h" in md, "ledger header missing"
    assert "ACTION CLAIMS (hard rule)" in md, "action-claims clause missing"
    # The seeded DB has only opencode_run fires (an effect tool) → populated
    # branch, which forbids the "I've" stem on unbacked claims.
    assert 'never the "I\'ve" stem' in md, md[md.find("Verified actions"):][:800]
    assert "opencode_run" in md[md.find("Verified actions — last 24h"):], "ledger row missing"


def main() -> int:
    # Pure-function contract first — no DB needed.
    _test_verified_actions_helper()

    with tempfile.TemporaryDirectory() as td:
        db = Path(td) / "athena_memory.db"
        _seed_db(db)
        dsf.DB = db  # monkeypatch the module global

        facts = dsf.gather()

        # Verified-actions ledger end-to-end: opencode_run fires are effect
        # actions (3 rows: 1 ok, 2 fail), read-only excludes = 0 here.
        va = facts["verified_actions"]
        assert va["total_effect_fires"] == 3, va
        oc_action = next(t for t in va["by_tool"] if t["tool"] == "opencode_run")
        assert oc_action["ok"] == 1 and oc_action["fail"] == 2, oc_action
        _test_action_claims_gate_renders(facts)

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
