"""The Forum plugin — backend API.

Mounted at /api/plugins/forum/ by the Hermes dashboard plugin system.

The Forum is a living instrument: it shows Athena's real activity as a
stream of legible events plus a heartbeat trace. This backend tails
Athena's event tables and returns new rows since a given timestamp.

Endpoints:
  GET /events?since=<ts>   unified event stream + vitals + current focus
  GET /interpret           dual human-readable reading (instrument + Athena)
  GET /health              plugin liveness
"""

from __future__ import annotations

import asyncio
import logging
import os
import sqlite3
import time
from pathlib import Path
from typing import Any, Optional

import httpx
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter()

ATHENA_BASE_URL = "http://localhost:8765"
ATHENA_TIMEOUT_SEC = 8.0
ATHENA_DB = Path(
    os.environ.get("ATHENA_DB_PATH", str(Path.home() / "athena_memory.db"))
)

# Per-source row cap so a long idle gap doesn't flood one poll.
MAX_ROWS_PER_SOURCE = 80
# Default lookback when the client provides no `since`.
DEFAULT_LOOKBACK_SEC = 300.0


def _query(sql: str, params: tuple) -> list[sqlite3.Row]:
    """Read-only query against Athena's DB. Returns [] on any failure."""
    try:
        conn = sqlite3.connect(f"file:{ATHENA_DB}?mode=ro", uri=True, timeout=5)
        conn.row_factory = sqlite3.Row
        try:
            return list(conn.execute(sql, params).fetchall())
        finally:
            conn.close()
    except Exception:
        logger.debug("forum: query failed: %s", sql, exc_info=True)
        return []


def _collect_events(since: float) -> list[dict[str, Any]]:
    """Tail the four event tables, unify into one typed, sorted stream."""
    events: list[dict[str, Any]] = []

    # ── tool calls ──────────────────────────────────────────
    for r in _query(
        "SELECT timestamp, tool_name, success, latency_ms, goal_id "
        "FROM tool_outcomes WHERE timestamp > ? "
        "ORDER BY timestamp DESC LIMIT ?",
        (since, MAX_ROWS_PER_SOURCE),
    ):
        events.append({
            "ts": r["timestamp"],
            "kind": "tool",
            "tool": r["tool_name"],
            "success": bool(r["success"]),
            "latency_ms": r["latency_ms"],
            "goal_id": r["goal_id"],
        })

    # ── episodes (memory formation) ─────────────────────────
    for r in _query(
        "SELECT timestamp, summary, content, importance "
        "FROM episodes WHERE timestamp > ? "
        "ORDER BY timestamp DESC LIMIT ?",
        (since, MAX_ROWS_PER_SOURCE),
    ):
        text = (r["summary"] or r["content"] or "").strip()
        events.append({
            "ts": r["timestamp"],
            "kind": "episode",
            "text": text[:160],
            "importance": r["importance"] if r["importance"] is not None else 0.5,
        })

    # ── goal transitions ────────────────────────────────────
    for r in _query(
        "SELECT updated_at, status, content, id "
        "FROM goals WHERE updated_at > ? "
        "ORDER BY updated_at DESC LIMIT ?",
        (since, MAX_ROWS_PER_SOURCE),
    ):
        events.append({
            "ts": r["updated_at"],
            "kind": "goal",
            "status": r["status"],
            "text": (r["content"] or "").strip()[:160],
            "goal_id": r["id"],
        })

    # ── metacognitive events: signals + maintenance ─────────
    for r in _query(
        "SELECT timestamp, signal, context "
        "FROM metacognitive_events WHERE timestamp > ? "
        "ORDER BY timestamp DESC LIMIT ?",
        (since, MAX_ROWS_PER_SOURCE),
    ):
        signal = (r["signal"] or "").strip()
        context = (r["context"] or "").strip()
        if signal == "maintenance":
            # context is "maintenance:<handler_name>"
            handler = context.split(":", 1)[-1] if ":" in context else context
            events.append({
                "ts": r["timestamp"],
                "kind": "maintenance",
                "handler": handler,
            })
        else:
            events.append({
                "ts": r["timestamp"],
                "kind": "signal",
                "signal": signal,
                "context": context[:120],
            })

    # Newest last (ascending) so the frontend can append naturally.
    events.sort(key=lambda e: e["ts"])
    return events


async def _fetch_vitals_and_focus() -> dict[str, Any]:
    """Pull current vitals + focus from Athena's /health/detailed."""
    out: dict[str, Any] = {
        "vitals": None,
        "focus": None,
        "athena_reachable": False,
    }
    try:
        async with httpx.AsyncClient(timeout=ATHENA_TIMEOUT_SEC) as client:
            r = await client.get(f"{ATHENA_BASE_URL}/health/detailed")
            r.raise_for_status()
            d = r.json()
    except Exception:
        logger.debug("forum: /health/detailed unreachable", exc_info=True)
        return out

    out["athena_reachable"] = True
    wm = d.get("wm") or {}
    meta = d.get("metacognition") or {}
    assoc = d.get("associative") or {}
    goals = d.get("goals") or []

    out["vitals"] = {
        "step": d.get("step"),
        "wm_load": wm.get("load"),
        "confidence": meta.get("confidence"),
        "confidence_label": meta.get("confidence_label"),
        "failure_rate": meta.get("failure_rate"),
        "goal_count": len(goals),
        "assoc_nodes": assoc.get("nodes"),
        "assoc_edges": assoc.get("edges"),
    }

    # Current focus goal — read straight from the goals table so we get
    # the FULL content. /health/detailed truncates goal text to ~40
    # chars in its status payload, which clipped the NOW panel.
    # Approximate the cognitive cycle's top-goal pick with
    # importance*urgency (its core priority signal).
    goal_rows = _query(
        "SELECT content, status FROM goals WHERE status = 'active' "
        "ORDER BY (importance * urgency) DESC LIMIT 1",
        (),
    )
    focus_goal = None
    if goal_rows:
        g = goal_rows[0]
        focus_goal = {
            "content": (g["content"] or "").strip()[:260],
            "status": g["status"],
        }
    # Fall through to /health goal count even if no active goal.
    _ = goals

    # Last tool fired.
    last_tool_rows = _query(
        "SELECT tool_name, success, latency_ms, timestamp "
        "FROM tool_outcomes ORDER BY timestamp DESC LIMIT 1",
        (),
    )
    last_tool = None
    if last_tool_rows:
        lt = last_tool_rows[0]
        last_tool = {
            "tool": lt["tool_name"],
            "success": bool(lt["success"]),
            "latency_ms": lt["latency_ms"],
            "ts": lt["timestamp"],
        }

    out["focus"] = {"goal": focus_goal, "last_tool": last_tool}
    return out


@router.get("/events")
async def events(since: Optional[float] = None) -> dict[str, Any]:
    """Unified event stream + current vitals + focus.

    `since` is a unix timestamp; rows newer than it are returned. When
    omitted, the last DEFAULT_LOOKBACK_SEC seconds are returned so a
    fresh client has immediate context.
    """
    now = time.time()
    lookback_from = since if since is not None else (now - DEFAULT_LOOKBACK_SEC)

    collected = _collect_events(lookback_from)
    vf = await _fetch_vitals_and_focus()

    # Athena is "reachable" if her data layer is readable. A transient
    # /health/detailed timeout (e.g. Athena momentarily under load)
    # must NOT flip the masthead to "offline" — the event stream is
    # still flowing from the DB. vitals/focus simply go stale (the
    # frontend retains last-known) until the next successful fetch.
    athena_reachable = ATHENA_DB.exists()

    return {
        "server_time": now,
        "events": collected,
        "vitals": vf["vitals"],
        "focus": vf["focus"],
        "athena_reachable": athena_reachable,
        "vitals_fresh": vf["athena_reachable"],
    }


# ── interpretation: dual human-readable reading ─────────────────────────────
#
# Two vantage points on the same moment:
#   instrument — an objective diagnostic read of the telemetry
#   athena     — a condensed form of Athena's own self-report (/think)
# Divergence between the two is itself a signal worth seeing.

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
# gemma4:31b-cloud writes noticeably tighter, more insightful prose than
# the local 8B for this summarization task. It's a flat-rate cloud
# model — the ~55s cache means at most one call/minute. Override with
# FORUM_INTERPRET_MODEL if needed.
INTERPRET_MODEL = os.environ.get("FORUM_INTERPRET_MODEL", "gemma4:31b-cloud")
INTERPRET_CACHE_SEC = 55.0

# Module-level cache so a 60s frontend poll doesn't spam the LLM and
# multiple dashboard clients share one generation.
_interpret_cache: dict[str, Any] = {"at": 0.0, "payload": None}


import re as _re


def _clean_reading(text: Optional[str]) -> Optional[str]:
    """Strip LLM preamble leakage ("Here is the condensed version:") and
    surrounding quotes so only the intended sentences remain."""
    if not text:
        return text
    t = text.strip()
    # Drop a short leading line that ends in a colon (a preface).
    t = _re.sub(r'^[^\n]{0,170}?:\s*\n+', '', t, count=1)
    # Drop a leading "Here is/Here's ..." sentence even without a colon.
    t = _re.sub(r"^\s*here(?:'s| is)\b[^.]*\.\s*", '', t, count=1, flags=_re.IGNORECASE)
    return t.strip().strip('"').strip()


async def _ollama_chat(system: str, prompt: str, timeout: float = 35.0) -> Optional[str]:
    """One-shot Ollama chat completion. Returns text or None on failure."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": INTERPRET_MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 220},
                },
            )
            r.raise_for_status()
            return _clean_reading((r.json().get("message", {}).get("content") or "").strip())
    except Exception:
        logger.debug("forum: ollama chat failed", exc_info=True)
        return None


def _format_events_for_prompt(events: list[dict[str, Any]], now: float) -> str:
    """Compact human-readable rendering of the event stream for the LLM."""
    lines: list[str] = []
    for e in events[-26:]:
        age = max(0, int(now - e["ts"]))
        amin = f"{age}s ago" if age < 90 else f"{age // 60}m ago"
        k = e["kind"]
        if k == "tool":
            ok = "ok" if e["success"] else "FAILED"
            lines.append(f"  [{amin}] tool {e['tool']} — {ok}")
        elif k == "episode":
            lines.append(f"  [{amin}] memory formed: {e['text']}")
        elif k == "goal":
            lines.append(f"  [{amin}] goal {e['status']}: {e['text']}")
        elif k == "signal":
            lines.append(f"  [{amin}] metacognitive signal: {e['signal']} {e['context']}")
        elif k == "maintenance":
            lines.append(f"  [{amin}] background handler ran: {e['handler']}")
    return "\n".join(lines) if lines else "  (no events in the recent window)"


async def _instrument_reading(
    events: list[dict[str, Any]], vitals: Optional[dict], focus: Optional[dict], now: float
) -> Optional[str]:
    """Objective diagnostic read of the telemetry."""
    v = vitals or {}
    g = (focus or {}).get("goal") or {}
    lt = (focus or {}).get("last_tool") or {}
    context = (
        f"VITALS: working-memory load {v.get('wm_load')}, "
        f"confidence {v.get('confidence')}, failure rate {v.get('failure_rate')}, "
        f"{v.get('goal_count')} active goal(s), {v.get('assoc_nodes')} memory nodes.\n"
        f"CURRENT GOAL: {g.get('content') or '(none — associative drift)'}\n"
        f"LAST TOOL: {lt.get('tool') or '(none)'}"
        f"{' — succeeded' if lt.get('success') else ' — failed' if lt else ''}\n\n"
        f"EVENT STREAM (oldest first):\n{_format_events_for_prompt(events, now)}"
    )
    system = (
        "You are a diagnostic instrument reading a cognitive AI agent's live "
        "telemetry. Report objectively and concretely what is happening, grounded "
        "ONLY in the data given. Name specific tools, goals, and counts. Never "
        "speculate, never use vague filler. If something looks stuck, failing, or "
        "idle, say so plainly. Output exactly 2-3 plain sentences, third person. "
        "Output ONLY those sentences — no preamble, no preface, no headings."
    )
    prompt = (
        f"Here is the cognitive agent Athena's recent activity:\n\n{context}\n\n"
        "Write a 2-3 sentence objective reading of what she is doing and how it "
        "is going. Flag anything stuck or failing."
    )
    return await _ollama_chat(system, prompt)


async def _athena_reading() -> Optional[str]:
    """Condensed form of Athena's own self-report (from /think)."""
    think_text = ""
    try:
        async with httpx.AsyncClient(timeout=ATHENA_TIMEOUT_SEC) as client:
            r = await client.get(f"{ATHENA_BASE_URL}/think")
            r.raise_for_status()
            think_text = (r.json().get("text") or "").strip()
    except Exception:
        logger.debug("forum: /think unreachable", exc_info=True)
        return None
    if not think_text:
        return None

    system = (
        "You condense an AI agent's own self-report into a brief note in her "
        "first-person voice. Preserve ONLY what the report actually states — do "
        "not add, interpret, or embellish. Output exactly 2-3 first-person "
        "sentences capturing what she says she is doing and how she sees her own "
        "state. Output ONLY those sentences — no preamble, no preface, no "
        "headings, no quotation marks. Begin directly with 'I'."
    )
    prompt = (
        f"Athena's full self-report:\n\n{think_text[:2400]}\n\n"
        "Now write the 2-3 first-person sentences."
    )
    return await _ollama_chat(system, prompt)


@router.get("/interpret")
async def interpret() -> dict[str, Any]:
    """Dual human-readable reading: objective instrument + Athena's voice.

    Server-side cached for INTERPRET_CACHE_SEC so a 60s frontend poll
    (or multiple clients) shares one generation rather than spamming
    the LLM.
    """
    now = time.time()
    cached = _interpret_cache.get("payload")
    if cached is not None and (now - _interpret_cache["at"]) < INTERPRET_CACHE_SEC:
        return {**cached, "cached": True}

    events = _collect_events(now - 1200.0)   # last ~20 min
    vf = await _fetch_vitals_and_focus()

    instrument_text, athena_text = await asyncio.gather(
        _instrument_reading(events, vf["vitals"], vf["focus"], now),
        _athena_reading(),
    )

    payload = {
        "generated_at": now,
        "instrument": instrument_text,
        "athena": athena_text,
        "model": INTERPRET_MODEL,
    }
    _interpret_cache["at"] = now
    _interpret_cache["payload"] = payload
    return {**payload, "cached": False}


@router.get("/health")
async def health() -> dict[str, Any]:
    """Liveness check for the Forum plugin backend."""
    return {
        "status": "ok",
        "plugin": "forum",
        "version": "0.5.0",
        "athena_db": str(ATHENA_DB),
        "athena_db_exists": ATHENA_DB.exists(),
        "interpret_model": INTERPRET_MODEL,
    }
