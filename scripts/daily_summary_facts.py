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
import sys
from collections import Counter
from pathlib import Path

HOME = Path.home()
DB = HOME / "athena_memory.db"
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
        today_start, _now = _today_bounds()
        rows = conn.execute(
            "SELECT tool_name, "
            "  SUM(CASE WHEN success=1 THEN 1 ELSE 0 END) AS ok, "
            "  SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) AS fail, "
            "  ROUND(AVG(latency_ms), 1) AS avg_ms "
            "FROM tool_outcomes WHERE timestamp >= ? "
            "  AND tool_name NOT LIKE 'synth:%' "
            "GROUP BY tool_name ORDER BY (ok+fail) DESC",
            (today_start,),
        ).fetchall()
        out["tool_fires_today"] = [
            {"tool": r[0], "ok": r[1], "fail": r[2], "avg_ms": r[3]} for r in rows
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
            (today_start,),
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

    # ── Musing activity (today) ────────────────────────────────────────
    # Musing fires from `cognitive_cycle._break_stuck_cycle` Scenario 2
    # when `athena_musing_enabled` is on and a focus has accumulated. Each
    # fire emits a `stuck_cycle_musing` metacog event with the focus +
    # thought_preview + has_followup flag in the `data` field. Reading
    # these directly prevents the morning summary from claiming "Musing
    # hasn't fired" when it has (see notes/routine-2026-05-27.md §4.3).
    try:
        conn = sqlite3.connect(DB)
        today_start, _now = _today_bounds()
        rows = conn.execute(
            "SELECT timestamp, context, COALESCE(data, '{}') "
            "FROM metacognitive_events "
            "WHERE timestamp >= ? "
            "  AND context IN ('stuck_cycle_musing', 'stuck_cycle_force_propose') "
            "ORDER BY timestamp DESC",
            (today_start,),
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
        out["musing_fires_today"] = musing_fires
        out["musing_followup_count_today"] = sum(
            1 for m in musing_fires if m["has_followup"]
        )
        out["force_propose_fallback_today"] = force_propose_fires
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

    lines.append("## Goals created today / yesterday\n")
    lines.append(f"- Today: {facts.get('goals_created_today_by_status', {})}")
    lines.append(f"- Yesterday: {facts.get('goals_created_yesterday_by_status', {})}")
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

    lines.append("## Tool fires today (success / fail / avg latency)\n")
    for t in facts.get("tool_fires_today", []):
        lines.append(
            f"- {t['tool']}: ok={t['ok']} fail={t['fail']} avg_ms={t['avg_ms']}"
        )
    lines.append("")
    lines.append(
        "_`synth:*` rows are NOT in the list above. They are post-hoc "
        "telemetry markers (always `success=0` by construction) — not "
        "tool executions. Do NOT describe them as 'failing tools' in the "
        "summary. See the next section if you want to talk about them._"
    )
    lines.append("")

    synth = facts.get("synth_markers_today", []) or []
    lines.append(
        f"## Synth markers today (no_tool_resolution etc.): "
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

    musing_fires = facts.get("musing_fires_today", []) or []
    followup_n = facts.get("musing_followup_count_today", 0)
    force_n = facts.get("force_propose_fallback_today", 0)
    lines.append(
        f"## Musing activity today (Crystalline Quilt P1): "
        f"{len(musing_fires)} fires, {followup_n} with follow-up action\n"
    )
    if musing_fires:
        lines.append(
            "Each row is a `stuck_cycle_musing` metacog event — Musing "
            "fired, the LLM crystallized a thought, and decided whether "
            "to propose a follow-up action. `has_followup=False` is a "
            "first-class outcome (sitting with the thought is fine)."
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
            "- (Musing did not fire today — either the runtime flag "
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
