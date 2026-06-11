#!/usr/bin/env python3
"""
Pre-run facts gatherer for Athena's Daily Autonomous Actions Summary cron.

Athena had been fabricating system facts in her summaries (hallucinated cron
jobs, message counts off by 5x, non-existent worktrees, fake 503 errors).
This script gathers ground-truth from the actual DBs/logs and emits it as a
markdown block that the cron scheduler prepends to the prompt. The cron
prompt then references THESE facts rather than generating numbers.

Output goes to stdout. The scheduler picks it up via the job's `script`
field and prepends it as a "## Script Output" section.

Runs in the user's normal environment — no special venv required since
we only use stdlib + sqlite3.
"""
from __future__ import annotations

import datetime
import glob
import json
import os
import re
import sqlite3
import subprocess
import sys
from collections import Counter
from pathlib import Path

HOME = Path.home()
DB = HOME / "athena_memory.db"
REPO = HOME / "cognitive-agent"
ERROR_LOG = HOME / "cognitive-agent" / "hermes" / "logs" / "athena_server.error.log"
GATEWAY_LOG = HOME / "cognitive-agent" / "hermes" / "logs" / "gateway.log"
CRON_JOBS = HOME / "cognitive-agent" / "hermes" / "cron" / "jobs.json"
NOTES_DIR = HOME / "cognitive-agent" / "notes"
# Sidecar JSON that verify_summary_numbers.py reads to fact-check the LLM
# output. Lives next to the script so both halves of the pipeline find it
# at a stable path without depending on env vars.
FACTS_JSON = HOME / "cognitive-agent" / "hermes" / "state" / "last_summary_facts.json"


def _today_bounds() -> tuple[float, float]:
    """Return (start, now) epoch — today is local-time 00:00:00 → now."""
    now = datetime.datetime.now()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return (start.timestamp(), now.timestamp())


def _yesterday_bounds() -> tuple[float, float]:
    """Yesterday in local time, full 24h."""
    now = datetime.datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yest_start = today_start - datetime.timedelta(days=1)
    return (yest_start.timestamp(), today_start.timestamp())


def _rolling_24h_bounds() -> tuple[float, float]:
    """Return (now-24h, now) epoch.

    The cron fires at ~06:30 local, so `_today_bounds()` ("local midnight →
    now") only covers ~6.5h of mostly-overnight time — Athena's quietest
    window. Activity that ran steadily until late the previous evening shows
    up as ZERO under that window, which is what produced the recurring
    "Musing didn't fire / opencode stopped / X is broken" false alarms (see
    notes/routine-2026-05-27.md, -05-29.md, -05-30.md: musing fired 16× on
    2026-05-29 but 0× after local midnight, so the calendar-day window read
    it as "never fired"). For overnight-activity metrics (musing, synth
    markers, tool fires, goal transitions) a rolling 24h window is the
    correct denominator at summary time."""
    now = datetime.datetime.now()
    return ((now - datetime.timedelta(hours=24)).timestamp(), now.timestamp())


_WEEKDAY_SHORT = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")


def _weekday_label(date_str: str) -> str:
    """Map YYYY-MM-DD → short weekday name. Returns '?' on parse failure.

    Added 2026-05-24 after Athena's morning summary repeatedly mis-
    attributed peak-day labels (e.g. called 2026-05-20 'Tuesday' when
    Tuesday was 2026-05-19). The dates and numbers were already correct
    in this script's output — the LLM was guessing the day-of-week. By
    rendering it explicitly, the LLM has no reason to guess.
    """
    try:
        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
        return _WEEKDAY_SHORT[dt.weekday()]
    except Exception:
        return "?"


def _count_loglines(path: Path, date_prefix: str, pattern: str) -> int:
    """Count log lines matching pattern AND containing date_prefix."""
    if not path.exists():
        return 0
    n = 0
    try:
        with open(path, "r", errors="replace") as f:
            for line in f:
                if date_prefix in line and pattern in line:
                    n += 1
    except Exception:
        pass
    return n


# ── Verified-actions ledger (2026-06-11) ──────────────────────────────────
# Port of the daily-reflection verified-actions gate (cognitive_agent/
# messaging.py::_verified_actions_block) onto the live daily-summary
# surface. The existing "Tool fires" section gives per-tool COUNTS but no
# args, so the narrative LLM can write "I refactored the proposer" with no
# args-level ground truth. `tool_outcomes` is the only record of what
# actually ran — every firing writes a row — so this ledger is the complete
# list of effect-producing actions in the window, and the rendered section
# forbids any "I did X" claim not backed by an entry here (the recurring
# morning-summary confabulation class — see feedback: verify her self-
# reports).
#
# Read-only / inspection tools are excluded: they are never the subject of
# an "I did X" accomplishment claim, and at ~90 fires/day they would bury
# the real actions. SAFETY DIRECTION — when unsure whether a tool produces
# an effect, leave it OUT of this set: its fires then still surface and the
# gate never suppresses a true claim. Over-inclusion here = mild noise;
# under-inclusion = a real action goes unlisted and the gate wrongly bars a
# true "I've". Bias to inclusion.
_NON_ACTION_TOOLS = frozenset({
    "read_athena_vault",
    "recall_memory",
    "recall_hybrid",
    "list_goals",
    "list_self_tools",
    "list_notes",
    "list_tasks",
    "get_goal",
    "think",
})

_VERIFIED_ACTIONS_SAMPLES_PER_TOOL = 15


def _build_verified_actions(rows: list[dict]) -> dict:
    """Aggregate effect-producing tool_outcomes rows into a bounded ledger.

    `rows` is a list of {tool_name, success, args_summary} dicts already
    windowed by the caller. Read-only tools (`_NON_ACTION_TOOLS`) are
    dropped and counted separately. Per tool we keep the distinct args
    (deduped, capped) so the narrative LLM can see WHAT was saved/edited/
    completed — the grounding the bare counts in `tool_fires_today` lack.

    Pure function — no DB, no clock — so it is unit-testable in isolation,
    mirroring messaging.py::_verified_actions_block.
    """
    by_tool: dict[str, dict] = {}
    excluded = 0
    for r in rows:
        tool = r.get("tool_name") or "?"
        if tool in _NON_ACTION_TOOLS:
            excluded += 1
            continue
        slot = by_tool.setdefault(
            tool,
            {"tool": tool, "n": 0, "ok": 0, "fail": 0, "_args": [], "_seen": set()},
        )
        slot["n"] += 1
        if r.get("success"):
            slot["ok"] += 1
        else:
            slot["fail"] += 1
        args = (r.get("args_summary") or "").replace("\n", " ").strip()[:140]
        if args and args not in slot["_seen"]:
            slot["_seen"].add(args)
            slot["_args"].append(args)

    out_tools = []
    for _tool, slot in sorted(
        by_tool.items(), key=lambda kv: kv[1]["n"], reverse=True
    ):
        distinct = slot["_args"]
        samples = distinct[:_VERIFIED_ACTIONS_SAMPLES_PER_TOOL]
        out_tools.append(
            {
                "tool": slot["tool"],
                "n": slot["n"],
                "ok": slot["ok"],
                "fail": slot["fail"],
                "samples": samples,
                "more_distinct": max(0, len(distinct) - len(samples)),
            }
        )
    return {
        "total_effect_fires": sum(t["n"] for t in out_tools),
        "excluded_read_fires": excluded,
        "by_tool": out_tools,
    }


def gather() -> dict:
    """Pull every fact we can verify deterministically."""
    out: dict = {}
    now = datetime.datetime.now()
    out["generated_at"] = now.isoformat()
    today_str = now.strftime("%Y-%m-%d")
    yesterday_str = (now - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    # ── Cron jobs that ACTUALLY exist ──────────────────────────────────
    try:
        with open(CRON_JOBS) as f:
            jobs = json.load(f).get("jobs", [])
        out["cron_jobs"] = [
            {
                "id": j["id"],
                "name": j.get("name", "?"),
                "schedule": j.get("schedule_display") or j.get("schedule", "?"),
                "enabled": j.get("enabled", True),
                "last_status": j.get("last_status"),
                "last_run_at": j.get("last_run_at"),
            }
            for j in jobs
        ]
    except Exception as e:
        out["cron_jobs"] = []
        out["cron_jobs_error"] = str(e)

    # ── LLM call counts (last 7 days) ──────────────────────────────────
    out["llm_calls_by_day"] = {}
    for d in [now - datetime.timedelta(days=i) for i in range(7)]:
        ds = d.strftime("%Y-%m-%d")
        out["llm_calls_by_day"][ds] = _count_loglines(
            ERROR_LOG, ds, "HTTP Request"
        )

    # ── Inbound Telegram messages (today + yesterday) ──────────────────
    out["telegram_inbound"] = {
        today_str: _count_loglines(GATEWAY_LOG, today_str, "inbound message"),
        yesterday_str: _count_loglines(
            GATEWAY_LOG, yesterday_str, "inbound message"
        ),
    }

    # ── Goal status totals ────────────────────────────────────────────
    try:
        conn = sqlite3.connect(DB)
        rows = conn.execute(
            "SELECT status, COUNT(*) FROM goals GROUP BY status"
        ).fetchall()
        out["goals_by_status"] = {r[0]: r[1] for r in rows}
        # Today's goals
        today_start, _now = _today_bounds()
        rows = conn.execute(
            "SELECT status, COUNT(*) FROM goals WHERE created_at >= ? GROUP BY status",
            (today_start,),
        ).fetchall()
        out["goals_created_today_by_status"] = {r[0]: r[1] for r in rows}
        # Yesterday's goals
        yest_start, yest_end = _yesterday_bounds()
        rows = conn.execute(
            "SELECT status, COUNT(*) FROM goals "
            "WHERE created_at >= ? AND created_at < ? GROUP BY status",
            (yest_start, yest_end),
        ).fetchall()
        out["goals_created_yesterday_by_status"] = {r[0]: r[1] for r in rows}
        # Rolling-24h goal transitions BY updated_at. The morning summary
        # repeatedly compared incompatible windows — e.g. "4 suspended vs 7
        # completed" took today's (overnight-only) suspensions and
        # yesterday's full-day completions, an apples-to-oranges ratio
        # (notes/routine-2026-05-30.md). This single consistent-window block
        # is the canonical "recent goal activity" denominator — suspended vs
        # completed should only ever be compared within it.
        win_start, _now2 = _rolling_24h_bounds()
        rows = conn.execute(
            "SELECT status, COUNT(*) FROM goals "
            "WHERE updated_at >= ? GROUP BY status ORDER BY 2 DESC",
            (win_start,),
        ).fetchall()
        out["goals_transitions_24h_by_status"] = {r[0]: r[1] for r in rows}
        # Recent completed (titles)
        rows = conn.execute(
            "SELECT substr(id,1,8), substr(content,1,80) FROM goals "
            "WHERE status='completed' AND updated_at >= ? "
            "ORDER BY updated_at DESC LIMIT 10",
            (today_start - 86400,),  # last 48h
        ).fetchall()
        out["recent_completed_goals"] = [{"id": r[0], "content": r[1]} for r in rows]
        # Recent suspended (with failure rates)
        rows = conn.execute(
            "SELECT substr(id,1,8), attempt_count, failure_count, substr(content,1,70) "
            "FROM goals WHERE status='suspended' "
            "ORDER BY updated_at DESC LIMIT 6"
        ).fetchall()
        out["recent_suspended_goals"] = [
            {
                "id": r[0],
                "attempts": r[1],
                "failures": r[2],
                "fail_rate": round(r[2] / r[1], 2) if r[1] else 0,
                "content": r[3],
            }
            for r in rows
        ]
    except Exception as e:
        out["goals_error"] = str(e)
    finally:
        try: conn.close()
        except Exception: pass

    # ── Tool fire stats (today) ────────────────────────────────────────
    # `synth:*` rows are excluded: they are post-hoc telemetry markers
    # written by `cognitive_cycle._record_synth_outcome` with success=False
    # hardcoded — not real tool executions. Including them tricked the
    # narrative LLM into reading them as "100% failing tools" (see
    # notes/routine-2026-05-22.md / 2026-05-23.md / 2026-05-27.md).
    # They surface separately under synth_markers_today below.
    try:
        conn = sqlite3.connect(DB)
        # Rolling 24h, not calendar-day-so-far — see _rolling_24h_bounds().
        win_start, _now = _rolling_24h_bounds()
        # A "validation rejection" is a success=0 row that never ran the tool:
        # the dispatch/validation guard rejected it pre-execution (latency ~0)
        # — most commonly opencode_run's anchor guard rejecting an abstract
        # prompt. Counting these as "failures" produced the misleading
        # "opencode_run 26% failure rate / reliability bottleneck" claim
        # (notes/routine-2026-05-30.md): of 6 opencode_run failures, 5 were
        # 0ms anchor-guard rejections, only 1 was a real subprocess failure.
        # Split them out so the summary distinguishes reliability from
        # proposer-quality signal.
        # A "no-op" (added 2026-06-03) is a success=0 row where the tool DID
        # run cleanly (returncode 0, real latency) but made no on-disk change
        # — opencode_edit's "no file changes" outcome. Like an anchor
        # rejection, it is not a tool-reliability failure: either the work was
        # already present or the model declined to act. Counting these as
        # failures minted the spurious "opencode_edit 100% failure" pattern +
        # avoid-tool policy override. Kept separate from `rejected` so the
        # narrative doesn't mislabel a clean no-op as an anchor rejection.
        # The latency_ms >= 50 guard keeps it disjoint from `rejected`.
        rows = conn.execute(
            "SELECT tool_name, "
            "  SUM(CASE WHEN success=1 THEN 1 ELSE 0 END) AS ok, "
            "  SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) AS fail, "
            "  SUM(CASE WHEN success=0 AND (latency_ms < 50 "
            "      OR error LIKE '%no concrete anchor%' "
            "      OR error LIKE '%anchor guard%') THEN 1 ELSE 0 END) AS rejected, "
            "  SUM(CASE WHEN success=0 AND latency_ms >= 50 "
            "      AND (error LIKE '%no file changes%' "
            "        OR error LIKE '%no on-disk modification%') "
            "      THEN 1 ELSE 0 END) AS no_op, "
            "  ROUND(AVG(CASE WHEN success=1 THEN latency_ms END), 1) AS avg_ok_ms "
            "FROM tool_outcomes WHERE timestamp >= ? "
            "  AND tool_name NOT LIKE 'synth:%' "
            "GROUP BY tool_name ORDER BY (ok+fail) DESC",
            (win_start,),
        ).fetchall()
        out["tool_fires_today"] = [
            {
                "tool": r[0],
                "ok": r[1],
                "fail": r[2],
                # Genuine reliability failures that actually ran the tool, vs
                # pre-exec guard rejections vs clean no-ops.
                # real_fail + validation_rejected + no_op == fail.
                "real_fail": r[2] - r[3] - r[4],
                "validation_rejected": r[3],
                "no_op": r[4],
                "avg_ms": r[5],
            }
            for r in rows
        ]
        # Separate synth-marker rollup so the cycle's no_tool_resolution
        # behavior remains visible — but framed correctly as "abstract
        # output goals the LLM couldn't decompose," not as tool failures.
        rows = conn.execute(
            "SELECT tool_name, COUNT(*) AS n, "
            "  ROUND(AVG(latency_ms), 1) AS avg_ms "
            "FROM tool_outcomes WHERE timestamp >= ? "
            "  AND tool_name LIKE 'synth:%' "
            "GROUP BY tool_name ORDER BY n DESC",
            (win_start,),
        ).fetchall()
        out["synth_markers_today"] = [
            {"marker": r[0], "count": r[1], "avg_decide_latency_ms": r[2]}
            for r in rows
        ]
    except Exception as e:
        out["tool_fires_error"] = str(e)
    finally:
        try: conn.close()
        except Exception: pass

    # ── Verified-actions ledger (rolling 24h) ──────────────────────────
    # The ground truth for "what Athena actually DID" — every tool firing
    # records a tool_outcomes row, so this is the complete record of
    # effect-producing actions. The rendered section (render_markdown)
    # turns it into a hard ACTION CLAIMS gate over the narrative prose.
    try:
        conn = sqlite3.connect(DB)
        win_start, _now = _rolling_24h_bounds()
        rows = conn.execute(
            "SELECT tool_name, success, COALESCE(args_summary,'') "
            "FROM tool_outcomes WHERE timestamp >= ? "
            "  AND tool_name NOT LIKE 'synth:%' "
            "ORDER BY timestamp ASC",
            (win_start,),
        ).fetchall()
        out["verified_actions"] = _build_verified_actions(
            [
                {"tool_name": r[0], "success": bool(r[1]), "args_summary": r[2]}
                for r in rows
            ]
        )
    except Exception as e:
        out["verified_actions_error"] = str(e)
    finally:
        try: conn.close()
        except Exception: pass

    # ── Musing activity (today) ────────────────────────────────────────
    # Musing fires from `cognitive_cycle._break_stuck_cycle` Scenario 2
    # when `athena_musing_enabled` is on and a focus has accumulated. Each
    # fire emits a `stuck_cycle_musing` metacog event with the focus +
    # thought_preview + has_followup flag in the `data` field. Reading
    # these directly prevents the morning summary from claiming "Musing
    # hasn't fired" when it has (see notes/routine-2026-05-27.md §4.3).
    try:
        conn = sqlite3.connect(DB)
        # Rolling 24h, NOT calendar-day-so-far. Musing runs through the
        # evening and goes quiet overnight; at the 06:30 cron the local-day
        # window (00:00→06:30) catches only the quiet hours and reads "0
        # fires" even when musing fired 16× the prior day (last fire 23:50).
        # That is the exact recurring false alarm this fix targets — see
        # _rolling_24h_bounds() and notes/routine-2026-05-30.md.
        win_start, _now = _rolling_24h_bounds()
        rows = conn.execute(
            "SELECT timestamp, context, COALESCE(data, '{}') "
            "FROM metacognitive_events "
            "WHERE timestamp >= ? "
            "  AND context IN ('stuck_cycle_musing', 'stuck_cycle_force_propose') "
            "ORDER BY timestamp DESC",
            (win_start,),
        ).fetchall()
        musing_fires = []
        force_propose_fires = 0
        for ts, ctx, data_raw in rows:
            if ctx == "stuck_cycle_force_propose":
                force_propose_fires += 1
                continue
            try:
                d = json.loads(data_raw) if data_raw else {}
            except Exception:
                d = {}
            musing_fires.append({
                "at": datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S"),
                "focus": str(d.get("focus", ""))[:60],
                "has_followup": bool(d.get("has_followup", False)),
                "thought_preview": str(d.get("thought_preview", ""))[:140],
            })
        out["musing_fires_24h"] = musing_fires
        out["musing_followup_count_24h"] = sum(
            1 for m in musing_fires if m["has_followup"]
        )
        out["force_propose_fallback_24h"] = force_propose_fires
    except Exception as e:
        out["musing_error"] = str(e)
    finally:
        try: conn.close()
        except Exception: pass

    # ── motivation_edit audit (last 24h) ───────────────────────────────
    # Surfaces every self-driven goal/aspiration edit so drift in goal
    # intent stays visible. tool_outcomes.args_summary captures the id +
    # new_content snippet; pairing it with the current goal content gives
    # a rough before/after.
    try:
        conn = sqlite3.connect(DB)
        cutoff = (now - datetime.timedelta(hours=24)).timestamp()
        rows = conn.execute(
            "SELECT timestamp, success, COALESCE(args_summary,'') "
            "FROM tool_outcomes "
            "WHERE tool_name='motivation_edit' AND timestamp >= ? "
            "ORDER BY timestamp DESC LIMIT 20",
            (cutoff,),
        ).fetchall()
        out["motivation_edits_24h"] = [
            {
                "at": datetime.datetime.fromtimestamp(r[0]).strftime("%Y-%m-%d %H:%M"),
                "success": bool(r[1]),
                "args": r[2][:300],
            }
            for r in rows
        ]
    except Exception as e:
        out["motivation_edits_error"] = str(e)
    finally:
        try: conn.close()
        except Exception: pass

    # ── Errors / warnings in log today ─────────────────────────────────
    err_patterns: Counter[str] = Counter()
    error_examples: list[str] = []
    if ERROR_LOG.exists():
        try:
            with open(ERROR_LOG, "r", errors="replace") as f:
                for line in f:
                    if today_str not in line:
                        continue
                    if "ERROR" in line or "503" in line or "timeout" in line.lower():
                        # extract a short signature
                        if "503" in line:
                            err_patterns["http_503"] += 1
                        elif "timeout" in line.lower():
                            err_patterns["timeout"] += 1
                        elif "ERROR" in line:
                            err_patterns["error_other"] += 1
                        if len(error_examples) < 5:
                            error_examples.append(line.strip()[:200])
        except Exception:
            pass
    out["errors_today"] = dict(err_patterns)
    out["error_examples_today"] = error_examples

    # ── Notes saved today ─────────────────────────────────────────────
    try:
        today_start, _now = _today_bounds()
        notes = []
        for p in sorted(NOTES_DIR.glob("*.md")):
            mt = p.stat().st_mtime
            if mt >= today_start:
                # Strip auto-completion summary notes
                if "[auto]" in p.name.lower():
                    continue
                notes.append(p.name)
        out["notes_saved_today"] = notes
    except Exception as e:
        out["notes_error"] = str(e)

    # ── Goal pursuit refusals (cycle-level) ────────────────────────────
    # A goal pursuit refusal is when the cognitive cycle DECLINED to run a
    # goal — distinct from suppressing the announcement that the goal is
    # running. Sources: metacognitive_events with type containing
    # 'self_goal_blocked' / 'pursuit_refused', plus tool_outcomes rows
    # where tool_name is one of the goal-control tools and success=0 with
    # an explicit guard reason. Today we expose just the metacog event
    # count — the cycle code paths that emit these are limited and stable.
    try:
        conn = sqlite3.connect(DB)
        today_start, _now = _today_bounds()
        rows = conn.execute(
            "SELECT signal, COUNT(*) FROM metacognitive_events "
            "WHERE timestamp >= ? AND ("
            "  signal LIKE '%blocked%' OR signal LIKE '%refused%' "
            "  OR signal LIKE 'self_goal%' OR signal = 'pursuit_skipped'"
            ") GROUP BY signal ORDER BY 2 DESC",
            (today_start,),
        ).fetchall()
        out["goal_pursuit_refusals_today"] = {r[0]: r[1] for r in rows}
        out["goal_pursuit_refusals_today_total"] = sum(r[1] for r in rows)
    except Exception as e:
        out["goal_pursuit_refusals_error"] = str(e)
    finally:
        try: conn.close()
        except Exception: pass

    # ── Recently shipped code (git, last 48h) ──────────────────────────
    # Added 2026-06-03. The morning summary kept (a) recommending features
    # that already shipped and (b) the proposer kept minting goals to patch
    # things Greg had just fixed by hand the night before (e.g. the 7-day
    # self_improvement anchor, committed fd926e8 the evening before the cron
    # flagged it as still-broken). Surfacing the recent commit log gives the
    # summary LLM (and, downstream, the proposer's awareness) a cheap "what
    # just landed" signal so it stops chasing already-done work. 48h window
    # so an evening commit is still visible to the next-morning cron.
    try:
        proc = subprocess.run(
            ["git", "-C", str(REPO), "log", "--since=48 hours ago",
             "--no-merges", "--pretty=format:%h\x1f%ct\x1f%s"],
            capture_output=True, text=True, timeout=15,
        )
        commits = []
        if proc.returncode == 0:
            for line in proc.stdout.splitlines():
                if not line.strip():
                    continue
                parts = line.split("\x1f")
                if len(parts) != 3:
                    continue
                sha, ct, subject = parts
                try:
                    ts = int(ct)
                except ValueError:
                    continue
                commits.append({"sha": sha, "ts": ts, "subject": subject})
        out["recent_commits_48h"] = commits[:40]
        if proc.returncode != 0:
            out["recent_commits_error"] = (proc.stderr or "").strip()[:200]
    except Exception as e:
        out["recent_commits_error"] = str(e)

    return out


def render_markdown(facts: dict) -> str:
    """Render the gathered facts as a markdown block. The cron prompt is
    instructed to USE these numbers rather than synthesizing them."""
    lines: list[str] = []
    lines.append("# Verified System Facts (ground truth — use these, do NOT fabricate)\n")
    lines.append(f"_Generated: {facts.get('generated_at')}_\n")

    lines.append("## Standing operational reminders\n")
    lines.append(
        "- **Note storage:** to record any finding, hypothesis, diagnostic, or "
        "recommendation, call `save_note` (it writes both the markdown file and "
        "the `athena_notes` SQLite row automatically). NEVER use terminal+SQL "
        "to INSERT into a `notes` table — that table does not exist; the real "
        "table is `athena_notes` and `save_note` is the only correct write path."
    )
    lines.append("")

    # Recently shipped — high-signal context placed early so it informs both
    # the #4/#5 narrative and any code-modification goals the proposer emits.
    commits = facts.get("recent_commits_48h")
    if commits is not None:
        lines.append("## Recently shipped code (git log, last 48h)\n")
        if commits:
            for c in commits:
                lines.append(f"- `{c['sha']}` — {c['subject']}")
            lines.append("")
            lines.append(
                "_These commits ALREADY LANDED on the working branch. Before "
                "recommending a code change or proposing a code-modification "
                "goal, check this list: do NOT recommend a feature that one of "
                "these already implements, and do NOT propose patching a file a "
                "commit here just changed (the edit will no-op and the goal "
                "will suspend). If a recommendation overlaps a recent commit, "
                "say 'already shipped in <sha>' instead._"
            )
        elif facts.get("recent_commits_error"):
            lines.append(
                f"- (error reading git log: {facts['recent_commits_error']})"
            )
        else:
            lines.append("- (no commits in the last 48h)")
        lines.append("")

    lines.append("## Cron jobs that exist\n")
    if facts.get("cron_jobs"):
        for j in facts["cron_jobs"]:
            lines.append(
                f"- `{j['id']}` — {j['name']} — schedule: {j['schedule']} — "
                f"last_status: {j['last_status']} — last_run_at: {j['last_run_at']}"
            )
    else:
        lines.append(
            f"- (error reading jobs.json: {facts.get('cron_jobs_error', 'unknown')})"
        )
    lines.append("")
    lines.append(
        "**IMPORTANT:** This is the COMPLETE list of cron jobs. Do not invent or "
        "reference cron jobs that are not in this list."
    )
    lines.append("")

    lines.append("## LLM call volume (last 7 days)\n")
    for d, n in facts.get("llm_calls_by_day", {}).items():
        lines.append(f"- {d} ({_weekday_label(d)}): {n} HTTP/LLM calls")
    lines.append(
        "\n_Day-of-week labels above are computed from the date — when "
        "writing the summary, refer to peak days by these labels rather "
        "than guessing (e.g. if 2026-05-20 (Wed) is the highest, write "
        '"Wednesday peaked", not "Tuesday peaked")._'
    )
    lines.append("")

    lines.append("## Inbound Telegram messages from Greg\n")
    for d, n in facts.get("telegram_inbound", {}).items():
        lines.append(f"- {d} ({_weekday_label(d)}): {n} inbound messages")
    lines.append("")

    lines.append("## Goal status totals (all-time)\n")
    for s, n in facts.get("goals_by_status", {}).items():
        lines.append(f"- {s}: {n}")
    lines.append("")

    lines.append("## Goal transitions — last 24h (canonical recent activity)\n")
    lines.append(f"- {facts.get('goals_transitions_24h_by_status', {})}")
    lines.append(
        "\n_This is the ONLY window to use when comparing suspended vs "
        "completed vs abandoned. It counts goals by `updated_at` over a "
        "rolling 24h. Do NOT build a 'suspended vs completed' ratio by "
        "mixing the today/yesterday rows below — at 06:30 'today' is only "
        "the overnight hours, so pairing today-suspended with yesterday-"
        "completed gives a false ratio (the 2026-05-30 '4 suspended vs 7 "
        "completed' error)._"
    )
    lines.append("")

    lines.append("## Goals created today / yesterday (by created_at — reference only)\n")
    lines.append(f"- Today (overnight only): {facts.get('goals_created_today_by_status', {})}")
    lines.append(f"- Yesterday (full day): {facts.get('goals_created_yesterday_by_status', {})}")
    lines.append(
        "\n_These two rows cover DIFFERENT-LENGTH windows and count creation, "
        "not outcome. Use the 'Goal transitions — last 24h' block above for "
        "any completed/suspended/abandoned comparison._"
    )
    lines.append("")

    if facts.get("recent_completed_goals"):
        lines.append("## Recently completed goals (last 48h)\n")
        for g in facts["recent_completed_goals"]:
            lines.append(f"- [{g['id']}] {g['content']}")
        lines.append("")

    if facts.get("recent_suspended_goals"):
        lines.append("## Recently suspended goals (with fail rates)\n")
        for g in facts["recent_suspended_goals"]:
            lines.append(
                f"- [{g['id']}] attempts={g['attempts']} failures={g['failures']} "
                f"fail_rate={g['fail_rate']} — {g['content']}"
            )
        lines.append("")

    lines.append(
        "## Tool fires — last 24h (ok / real_fail / anchor_rejected / no_op / avg latency)\n"
    )
    for t in facts.get("tool_fires_today", []):
        rej = t.get("validation_rejected", 0) or 0
        nop = t.get("no_op", 0) or 0
        real = t.get("real_fail", t.get("fail", 0))
        seg = f"- {t['tool']}: ok={t['ok']} real_fail={real}"
        if rej:
            seg += f" anchor_rejected={rej}"
        if nop:
            seg += f" no_op={nop}"
        seg += f" avg_ok_ms={t['avg_ms']}"
        lines.append(seg)
    lines.append("")
    lines.append(
        "_**`anchor_rejected`** counts success=0 rows the dispatch/anchor "
        "guard rejected BEFORE running the tool (≈0ms) — almost always "
        "opencode_run declining an abstract, anchorless prompt. **`no_op`** "
        "counts success=0 rows where the tool ran cleanly but made no on-disk "
        "change (opencode_edit's 'no file changes' — work already present, or "
        "the model declined to act). NEITHER is a reliability failure: "
        "`anchor_rejected` is a proposer-quality signal (no concrete "
        "file/identifier to act on) and `no_op` is a model/prompt-quality "
        "signal. Report reliability using `real_fail` ONLY, and mention "
        "`anchor_rejected` / `no_op` separately — do NOT fold either into a "
        "single 'X% failure rate' for the tool (doing so minted the bogus "
        "'opencode_edit 100% failure' pattern). `avg_ok_ms` is the latency of "
        "successful runs only, so rejections don't deflate it._"
    )
    lines.append("")
    lines.append(
        "_`synth:*` rows are NOT in the list above. They are post-hoc "
        "telemetry markers (always `success=0` by construction) — not "
        "tool executions. Do NOT describe them as 'failing tools' in the "
        "summary. See the next section if you want to talk about them._"
    )
    lines.append("")

    # ── Verified actions ledger — the ACTION CLAIMS gate ───────────────
    va = facts.get("verified_actions") or {}
    by_tool = va.get("by_tool") or []
    total_actions = va.get("total_effect_fires", 0)
    excl_reads = va.get("excluded_read_fires", 0)
    lines.append(
        "## Verified actions — last 24h (ground truth — the ONLY things you "
        f"actually did): {total_actions}\n"
    )
    if by_tool:
        for t in by_tool:
            lines.append(
                f"- **{t['tool']}**: {t['n']} fired (ok={t['ok']} fail={t['fail']})"
            )
            for s in t["samples"]:
                lines.append(f"    • {s}")
            if t.get("more_distinct"):
                lines.append(f"    • …and {t['more_distinct']} more distinct")
        lines.append("")
        lines.append(
            "**ACTION CLAIMS (hard rule):** every statement that you DID "
            'something — "I edited…", "I saved…", "I completed…", "I sent…", '
            '"I cleaned up…", "I fixed…" — MUST correspond to an entry above. '
            "Each row is a real `tool_outcomes` firing; this is the COMPLETE "
            "list of effect-producing actions in the window. Do NOT invent, "
            "paraphrase, or aggregate an action that isn't here. If a topic "
            'has no entry, write about it WITHOUT claiming you acted — use "I\'ll" '
            '/ "I\'m going to", never the "I\'ve" stem. A `fail` row means the '
            "action did NOT take effect — do not claim its result."
        )
        if excl_reads:
            lines.append(
                f"\n_({excl_reads} read-only / inspection fires — recall_memory, "
                "read_athena_vault, list_* — are deliberately excluded above; "
                "they are not 'I did X' actions, not omitted in error.)_"
            )
    else:
        lines.append(
            "**ACTION CLAIMS (hard rule):** you have NO recorded effect-"
            "producing actions in this window. Do NOT claim you edited, saved, "
            "sent, completed, fetched, or cleaned up anything — do NOT use the "
            '"I\'ve" stem. Commit forward with "I\'ll" / "I\'m going to" instead.'
        )
        if excl_reads:
            lines.append(
                f"\n_({excl_reads} read-only / inspection fires occurred, but "
                "none produced an effect — reads are not actions.)_"
            )
    lines.append("")

    synth = facts.get("synth_markers_today", []) or []
    lines.append(
        f"## Synth markers — last 24h (no_tool_resolution etc.): "
        f"{sum(m['count'] for m in synth)}\n"
    )
    if synth:
        lines.append(
            "These are NOT tool failures. Each row is the cognitive cycle "
            "recording that an abstract goal's LLM-decide phase returned "
            "no resolvable tool. The latency is the LLM call cost, not "
            "wasted work by a 'synth tool'. Frame this as 'goals the LLM "
            "couldn't decompose into a single tool call,' if at all."
        )
        lines.append("")
        for m in synth:
            lines.append(
                f"- {m['marker']}: count={m['count']} "
                f"avg_decide_latency_ms={m['avg_decide_latency_ms']}"
            )
    else:
        lines.append("- (zero synth markers today)")
    lines.append("")

    musing_fires = facts.get("musing_fires_24h", []) or []
    followup_n = facts.get("musing_followup_count_24h", 0)
    force_n = facts.get("force_propose_fallback_24h", 0)
    lines.append(
        f"## Musing activity — last 24h (Crystalline Quilt P1): "
        f"{len(musing_fires)} fires, {followup_n} with follow-up action\n"
    )
    if musing_fires:
        lines.append(
            "Each row is a `stuck_cycle_musing` metacog event — Musing "
            "fired, the LLM crystallized a thought, and decided whether "
            "to propose a follow-up action. `has_followup=False` is a "
            "first-class outcome (sitting with the thought is fine). "
            "**This is a rolling 24h count.** Musing runs through the "
            "evening and goes quiet overnight, so if the most recent fire "
            "is several hours before this cron, that is normal — do NOT "
            "write 'Musing didn't fire today' or infer the flag is off."
        )
        lines.append("")
        for m in musing_fires[:8]:
            tag = "→action" if m["has_followup"] else "→sit"
            lines.append(
                f"- {m['at']} [{tag}] focus={m['focus']!r} "
                f"thought={m['thought_preview']!r}"
            )
        if len(musing_fires) > 8:
            lines.append(f"- … and {len(musing_fires) - 8} more")
    else:
        lines.append(
            "- (Musing did not fire in the last 24h — only now, after a full "
            "24h of zero fires, is it worth checking whether the runtime flag "
            "`athena_musing_enabled` is off, no focus accumulated, or no "
            "`no_top_goal` stuck-cycle was hit)"
        )
    if force_n > 0:
        lines.append("")
        lines.append(
            f"_Legacy `stuck_cycle_force_propose` fallback fired {force_n}× "
            "today (Musing path was off or failed → old force-propose ran)._"
        )
    lines.append("")

    edits = facts.get("motivation_edits_24h", [])
    lines.append(f"## Motivation edits (last 24h): {len(edits)}\n")
    if edits:
        lines.append(
            "Each row is an autonomous edit Athena made to her own goals / "
            "aspirations / tasks via `motivation_edit`. Review for intent drift."
        )
        lines.append("")
        for e in edits:
            status = "ok" if e["success"] else "FAIL"
            lines.append(f"- {e['at']} [{status}] {e['args']}")
        lines.append("")

    _refusals_total = facts.get("goal_pursuit_refusals_today_total", 0)
    lines.append(
        f"## Goal pursuit refusals today (cycle-level): {_refusals_total}\n"
    )
    if _refusals_total > 0:
        for k, v in (facts.get("goal_pursuit_refusals_today") or {}).items():
            lines.append(f"- {k}: {v}")
        lines.append("")
    else:
        lines.append(
            "- (zero — the cycle did not decline any goal pursuits today)"
        )
        lines.append("")

    lines.append("## Errors / timeouts today\n")
    if facts.get("errors_today"):
        for k, v in facts["errors_today"].items():
            lines.append(f"- {k}: {v}")
        if facts.get("error_examples_today"):
            lines.append("\nFirst examples:")
            for ex in facts["error_examples_today"][:3]:
                lines.append(f"  - {ex}")
    else:
        lines.append("- (no errors logged today)")
    lines.append("")

    lines.append(f"## Notes saved today: {len(facts.get('notes_saved_today', []))}\n")
    for n in facts.get("notes_saved_today", [])[:5]:
        lines.append(f"- {n}")
    lines.append("")

    return "\n".join(lines)


def _write_facts_sidecar(facts: dict) -> None:
    """Persist the gathered facts to a stable path so the post-LLM verifier
    can cross-check numeric claims without re-querying the source DBs."""
    try:
        FACTS_JSON.parent.mkdir(parents=True, exist_ok=True)
        FACTS_JSON.write_text(json.dumps(facts, default=str, indent=2))
    except Exception as e:
        # Don't fail the whole pre-run if sidecar write fails — the
        # markdown facts still ship to the LLM and the verifier will
        # just skip with a "facts unavailable" footer.
        print(f"[warn] failed to write facts sidecar: {e}", file=sys.stderr)


def main() -> None:
    facts = gather()
    _write_facts_sidecar(facts)
    md = render_markdown(facts)
    # Print to stdout for the scheduler to capture.
    print(md)


if __name__ == "__main__":
    main()
