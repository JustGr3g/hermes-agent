"""
Athena Telegram Proxy Plugin
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Registers /think, /athena, and /full-restart slash commands in the
Hermes gateway. The first two proxy to Athena's FastAPI server
(athena_server.py on :8765); /full-restart bounces both LaunchAgents.

Why a slash-command plugin (not pre_gateway_dispatch hook):
    The pre_gateway_dispatch hook signature drifted in Hermes ≥0.11 and
    "skip" actions no longer carry reply text — they drop messages
    silently. register_command() returns reply text directly to the
    sender, which is the behaviour we want.

Usage:
    /think              — human-readable cognitive snapshot
    /athena <message>   — chat with Athena (returns cognitive summary)
    /athena             — ping (returns Athena's status)
    /full-restart       — restart BOTH the gateway and the FastAPI server
                          (clears in-memory cognitive state; SQLite is preserved)
"""

from __future__ import annotations

import os
import subprocess
from typing import Optional

import requests

ATHENA_HOST = os.getenv("ATHENA_HOST", "localhost")
ATHENA_PORT = os.getenv("ATHENA_PORT", "8765")
ATHENA_URL = f"http://{ATHENA_HOST}:{ATHENA_PORT}"


def _call_think() -> str:
    """GET /think and return the markdown text body (or an error message)."""
    try:
        resp = requests.get(f"{ATHENA_URL}/think", timeout=10)
        if resp.status_code != 200:
            return f"(/think error {resp.status_code}: {resp.text[:200]})"
        data = resp.json()
        return data.get("text") or "(empty cognitive snapshot)"
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765)"
    except Exception as e:
        return f"(/think proxy error: {e})"


def _call_athena(message: str) -> str:
    """POST to Athena's /chat endpoint, extract a human-readable response."""
    payload = {"message": message.strip()}
    try:
        resp = requests.post(f"{ATHENA_URL}/chat", json=payload, timeout=30)
        if resp.status_code != 200:
            return f"(Athena error {resp.status_code}: {resp.text[:200]})"

        data = resp.json()
        lines = []

        inner_speech = data.get("inner_speech", [])
        if inner_speech:
            thoughts = [s["content"] for s in inner_speech[-2:] if s.get("content")]
            if thoughts:
                lines.append(f"💭 {' / '.join(thoughts)}")

        decision = data.get("decision", {})
        if decision:
            action = decision.get("action_type", "")
            target = decision.get("target", "")
            mode = decision.get("mode", "")
            if target:
                lines.append(f"🎯 {action} → {target} [{mode}]")
            elif action:
                lines.append(f"🎯 {action} [{mode}]")

        goals = data.get("goals", [])
        if goals:
            lines.append(f"📋 {len(goals)} active goal(s)")

        loop = data.get("cognitive_loop", {})
        quality = loop.get("overall_quality")
        degraded = loop.get("degraded")
        if quality is not None:
            quality_str = f"{quality:.0%}"
            flag = " ⚠️ degraded" if degraded else ""
            lines.append(f"Cognition: {quality_str}{flag}")

        wm = data.get("wm", {})
        wm_load = wm.get("load", 0)
        if wm_load > 0:
            lines.append(f"WM: {wm_load:.0%} full ({wm.get('used', 0)}/{wm.get('capacity', 7)})")

        step = data.get("step", 0)
        elapsed = data.get("elapsed_sec", 0)

        if not lines:
            return "(Athena processed your message but had nothing to report.)"

        lines.append(f"\n[step {step} · {elapsed:.1f}s]")
        return "\n".join(lines)

    except requests.exceptions.ConnectionError:
        return "(Athena is not running. Start her with: cd ~/cognitive-agent && python athena_server.py)"
    except Exception as e:
        return f"(Athena proxy error: {e})"


# ── Slash-command handlers ────────────────────────────────────────────────

def _handle_think(raw_args: str) -> Optional[str]:
    return _call_think()


def _handle_proposed_goals(raw_args: str) -> Optional[str]:
    """List recent self-proposed goals with tier and approval state."""
    try:
        resp = requests.get(f"{ATHENA_URL}/goals/proposed", timeout=10)
        if resp.status_code != 200:
            return f"(/proposed-goals error {resp.status_code})"
        goals = resp.json().get("goals", [])
        if not goals:
            return "_No self-proposed goals yet._"
        lines = ["*Self-proposed goals:*"]
        for g in goals[:10]:
            short = g["id"][:8]
            tier_emoji = {"autonomous": "🟢", "notify": "🟡", "escalate": "🔴"}.get(g["risk_tier"], "⚪")
            lines.append(
                f"{tier_emoji} `{short}` [{g['risk_tier']}/{g['approval_status']}] "
                f"{g['content'][:90]}"
            )
        return "\n".join(lines)
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765)"
    except Exception as e:
        return f"(/proposed-goals proxy error: {e})"


def _handle_approve_goal(raw_args: str) -> Optional[str]:
    """Approve a pending escalate-tier self-proposed goal."""
    goal_id = (raw_args or "").strip()
    if not goal_id:
        return "Usage: `/approve-goal <id-prefix>` (8-char prefix is fine)"
    try:
        resp = requests.post(f"{ATHENA_URL}/goals/{goal_id}/approve", timeout=10)
        if resp.status_code != 200:
            return f"(approve error {resp.status_code}: {resp.text[:200]})"
        data = resp.json()
        if data.get("approved"):
            return f"✅ Approved goal `{data['goal_id'][:8]}`. It's now active."
        return (
            f"Could not approve goal `{goal_id}`. It may not exist, "
            f"already be approved, or not be self-proposed."
        )
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765)"
    except Exception as e:
        return f"(/approve-goal error: {e})"


def _handle_dismiss_goal(raw_args: str) -> Optional[str]:
    """Dismiss/retract a pending or active self-proposed goal."""
    goal_id = (raw_args or "").strip()
    if not goal_id:
        return "Usage: `/dismiss-goal <id-prefix>` (8-char prefix is fine)"
    try:
        resp = requests.post(f"{ATHENA_URL}/goals/{goal_id}/reject", timeout=10)
        if resp.status_code != 200:
            return f"(dismiss error {resp.status_code}: {resp.text[:200]})"
        data = resp.json()
        if data.get("rejected"):
            return f"❌ Dismissed goal `{data['goal_id'][:8]}`."
        return f"Could not dismiss goal `{goal_id}` (not found or not self-proposed)."
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765)"
    except Exception as e:
        return f"(/dismiss-goal error: {e})"


def _handle_resume_selfmod(raw_args: str) -> Optional[str]:
    """Resume autonomous self-modification after a drift pause. Re-pins the
    drift baseline to 'now' (accepts the current direction as the new normal)
    and re-arms the autonomous_self_mod flag."""
    try:
        resp = requests.post(f"{ATHENA_URL}/selfmod/resume", timeout=15)
        if resp.status_code != 200:
            return f"(/resume-selfmod error {resp.status_code}: {resp.text[:200]})"
        data = resp.json()
        if data.get("ok"):
            return (
                "✅ Autonomous self-mod resumed and re-armed. Baseline re-pinned "
                f"to now ({data.get('baseline_size', 0)} goals)."
            )
        return f"(/resume-selfmod: {data.get('reason', 'failed')})"
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765)"
    except Exception as e:
        return f"(/resume-selfmod proxy error: {e})"


def _handle_selfmod_status(raw_args: str) -> Optional[str]:
    """Show self-modification state: armed/paused, drift, and the self-edits
    made since the baseline was pinned."""
    try:
        resp = requests.get(f"{ATHENA_URL}/selfmod/status", timeout=10)
        if resp.status_code != 200:
            return f"(/selfmod-status error {resp.status_code})"
        data = resp.json()
        if not data.get("baseline_pinned"):
            return "🔧 Autonomous self-mod is not armed (no baseline pinned)."
        armed = data.get("armed")
        drift = data.get("drift") or {}
        sim = drift.get("similarity")
        lines = [f"🔧 *Autonomous self-mod:* {'🟢 ARMED' if armed else '🔴 PAUSED'}"]
        lines.append(
            f"Drift similarity: {sim} (floor {drift.get('threshold', 0.4)})"
            + (" — ⚠️ DRIFTED" if drift.get("drifted") else "")
        )
        suspects = data.get("suspect_edits", [])
        lines.append(f"Self-edits since baseline: {len(suspects)}")
        for s in suspects[:6]:
            lines.append(f"  `{s['sha']}` {s['subject'][:60]}")
        if not armed:
            lines.append("\nReply /resume-selfmod to re-arm (re-pins baseline to now).")
        return "\n".join(lines)
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765)"
    except Exception as e:
        return f"(/selfmod-status proxy error: {e})"


def _handle_audit(raw_args: str) -> Optional[str]:
    """Show a chronological view of Athena's autonomous behavior.

    Defaults to last 6 hours. Pass an integer arg to override (e.g.
    /audit 24). Each line is one event: tool fire, self-driven step,
    or maintenance handler run. Shows up to 20 most recent."""
    arg = (raw_args or "").strip()
    try:
        hours = float(arg) if arg else 6.0
    except ValueError:
        hours = 6.0
    hours = max(0.5, min(168.0, hours))  # clamp 30min .. 1 week

    try:
        resp = requests.get(
            f"{ATHENA_URL}/audit", params={"hours": hours, "limit": 200},
            timeout=10,
        )
        if resp.status_code != 200:
            return f"(audit error {resp.status_code})"
        data = resp.json()
        events = data.get("events", [])
        if not events:
            return f"_No autonomous behavior in last {hours:.1f}h._"

        from datetime import datetime
        # Show the 20 most recent; reverse so newest is at the top of
        # the rendered output (Telegram users scroll down to scroll back).
        recent = events[-20:][::-1]
        lines = [f"📓 *Autonomy audit (last {hours:.1f}h, {len(events)} events total):*"]
        for e in recent:
            ts = datetime.fromtimestamp(e["ts"]).strftime("%H:%M")
            kind = e.get("kind", "?")
            icon = {"self_episode": "🤖", "maintenance": "⚙️", "tool": "🔧"}.get(kind, "•")
            summary = (e.get("summary") or "")[:90]
            lines.append(f"  {icon} {ts} | {summary}")
        if len(events) > 20:
            lines.append(f"\n_(showing 20 of {len(events)} — pass `/audit 1` for shorter window)_")
        return "\n".join(lines)
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765)"
    except Exception as e:
        return f"(/audit error: {e})"


def _handle_halt(raw_args: str) -> Optional[str]:
    """Emergency stop for between-turn autonomy. Use when something
    feels off — fully arrests autonomous behavior, retracts pending
    self-proposed goals, abandons in-flight ones, clears budget."""
    try:
        resp = requests.post(f"{ATHENA_URL}/halt", timeout=10)
        if resp.status_code != 200:
            return f"(halt error {resp.status_code}: {resp.text[:200]})"
        r = resp.json()
        lines = ["🛑 *Autonomy halted.*"]
        if r.get("pursuit_disabled"):
            lines.append("  • Pursuit OFF")
        if r.get("active_self_goals_abandoned", 0) > 0:
            lines.append(f"  • Abandoned {r['active_self_goals_abandoned']} active self-proposed goal(s)")
        if r.get("pending_proposals_rejected", 0) > 0:
            lines.append(f"  • Rejected {r['pending_proposals_rejected']} pending proposal(s)")
        if r.get("guard_logs_cleared"):
            lines.append("  • Cleared AutonomyGuard rolling budget")
        if r.get("cycle_outcome_cleared"):
            lines.append("  • Reset cognitive cycle state")
        if r.get("errors"):
            lines.append(f"  ⚠ Partial errors: {', '.join(r['errors'][:2])}")
        lines.append("\nUser-set goals are untouched. autonomy_bypass flag unchanged.")
        lines.append("Re-enable autonomy with `/pursuit on` when ready.")
        return "\n".join(lines)
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765)"
    except Exception as e:
        return f"(/halt error: {e})"


def _handle_pursuit(raw_args: str) -> Optional[str]:
    """Toggle/inspect the pursuit_enabled master switch (Phase 13H #4).

    pursuit_enabled gates whether Athena can fire tools self-driven (between
    user turns). This is INDEPENDENT of autonomy_bypass — bypass only changes
    goal-creation approval, this changes execution. Today the switch primarily
    arms the guard for the upcoming CognitiveCycle (#1).

    Usage:
        /pursuit         — show current state + recent guard activity
        /pursuit on      — enable between-turn tool execution
        /pursuit off     — disable (default)
    """
    arg = (raw_args or "").strip().lower()

    if arg == "" or arg == "status":
        try:
            resp = requests.get(f"{ATHENA_URL}/pursuit", timeout=5)
            if resp.status_code != 200:
                return f"(pursuit status error {resp.status_code})"
            data = resp.json()
            on = bool(data.get("on"))
            guard = data.get("guard") or {}
            global_used = guard.get("global_used_last_hour", 0)
            global_cap = guard.get("global_cap_per_hour", 0)
            per_tool = guard.get("per_tool_usage") or {}

            lines = [
                f"🤖 Pursuit (between-turn tool execution) is **{'ON' if on else 'OFF'}**.",
                f"Self-driven steps last hour: {global_used}/{global_cap}.",
            ]
            if per_tool:
                lines.append("Per-tool usage (last hour):")
                for name, info in per_tool.items():
                    lines.append(f"  • {name}: {info['used']}/{info['cap']}")
            else:
                lines.append("_No self-driven tool calls yet._")
            return "\n".join(lines)
        except requests.exceptions.ConnectionError:
            return "(Athena server is not reachable on :8765)"
        except Exception as e:
            return f"(/pursuit status error: {e})"

    if arg in ("on", "true", "1", "enable"):
        target = True
    elif arg in ("off", "false", "0", "disable"):
        target = False
    else:
        return "Usage: `/pursuit on`, `/pursuit off`, or `/pursuit` to see current state."

    try:
        resp = requests.post(
            f"{ATHENA_URL}/pursuit", json={"on": target}, timeout=5,
        )
        if resp.status_code != 200:
            return f"(pursuit toggle error {resp.status_code}: {resp.text[:200]})"
        data = resp.json()
        if data.get("on") == target and data.get("previous") == target:
            return f"🤖 Pursuit was already {'ON' if target else 'OFF'} — no change."
        if target:
            # 2026-05-12: render the live allowlist from the server's
            # response instead of hardcoding tool names. The hardcoded
            # list had drifted (`pi_run` removed 2026-05-05, replaced by
            # opencode_run; 9 other tools added since the original text).
            allowlist = data.get("allowlist") or []
            if allowlist:
                tool_list = ", ".join(f"`{t}`" for t in allowlist)
                tool_blurb = f"Athena can now fire these allowlisted tools self-driven: {tool_list}."
            else:
                tool_blurb = "Athena can now fire allowlisted tools self-driven (allowlist not returned by server)."
            return (
                "🟢 *Pursuit is now ON.*\n\n"
                f"{tool_blurb} Subject to per-tool and global hourly budgets. "
                "With autonomy_bypass also ON, the allowlist widens to all tools.\n\n"
                "Turn off with `/pursuit off`."
            )
        else:
            return (
                "🔴 *Pursuit is now OFF.*\n\n"
                "Self-driven tool calls are blocked. Reactive (user-prompted) "
                "behavior is unchanged."
            )
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765)"
    except Exception as e:
        return f"(/pursuit toggle error: {e})"


def _handle_bypass(raw_args: str) -> Optional[str]:
    """Toggle/inspect the autonomy_bypass flag.

    Usage:
        /bypass         — show current state
        /bypass on      — enable bypass (all self-proposed goals auto-approved)
        /bypass off     — disable bypass (revert to three-tier flow)
    """
    arg = (raw_args or "").strip().lower()

    # Status read
    if arg == "" or arg == "status":
        try:
            resp = requests.get(f"{ATHENA_URL}/bypass", timeout=5)
            if resp.status_code != 200:
                return f"(bypass status error {resp.status_code})"
            data = resp.json()
            on = bool(data.get("on"))
            ts = data.get("updated_at")
            from datetime import datetime
            ts_str = ""
            if ts:
                try:
                    ts_str = f" (last toggled {datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')})"
                except Exception:
                    pass
            return (
                f"🛡️ Autonomy bypass is **{'ON' if on else 'OFF'}**{ts_str}.\n"
                + ("All self-proposed goals are auto-approved with no notification."
                   if on else
                   "Self-proposed goals follow the normal three-tier flow.")
            )
        except requests.exceptions.ConnectionError:
            return "(Athena server is not reachable on :8765)"
        except Exception as e:
            return f"(/bypass status error: {e})"

    # Toggle
    if arg in ("on", "true", "1", "enable"):
        target = True
    elif arg in ("off", "false", "0", "disable"):
        target = False
    else:
        return "Usage: `/bypass on`, `/bypass off`, or `/bypass` to see current state."

    try:
        resp = requests.post(
            f"{ATHENA_URL}/bypass", json={"on": target}, timeout=5,
        )
        if resp.status_code != 200:
            return f"(bypass toggle error {resp.status_code}: {resp.text[:200]})"
        data = resp.json()
        if data.get("on") == target and data.get("previous") == target:
            return f"🛡️ Bypass was already {'ON' if target else 'OFF'} — no change."
        if target:
            return (
                "🟢 *Autonomy bypass is now ON.*\n\n"
                "Athena will now act on all self-proposed goals (autonomous, notify, "
                "and escalate tiers) WITHOUT approval and WITHOUT Telegram notification. "
                "Risk-tier classifications are still recorded for audit.\n\n"
                "Turn off with `/bypass off`."
            )
        else:
            return (
                "🔴 *Autonomy bypass is now OFF.*\n\n"
                "New self-proposed goals will revert to the three-tier flow. "
                "Goals approved while bypass was on remain active — review them "
                "with `/proposed-goals` and use `/retract-goal <id>` if needed."
            )
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765)"
    except Exception as e:
        return f"(/bypass toggle error: {e})"


def _handle_full_restart(raw_args: str) -> Optional[str]:
    """Bounce both ai.athena.server and ai.athena.gateway.

    Reply is computed and returned synchronously so the gateway can
    deliver it before the kickstart fires. The kickstart runs in a
    detached child shell that sleeps briefly first — this gives the
    gateway time to flush the reply to Telegram before it gets killed
    and respawned by launchd. The FastAPI server is bounced in the
    same shell, sandwiched between the reply and the gateway kill so
    her cognitive process restarts as part of the same window.
    """
    uid = os.getuid()
    # Detach via start_new_session=True so the child survives the
    # gateway's own death. Both kickstarts use -k (force-kill if
    # already running) so a stuck process doesn't block the bounce.
    cmd = (
        "sleep 3 && "
        f"launchctl kickstart -k gui/{uid}/ai.athena.server && "
        f"launchctl kickstart -k gui/{uid}/ai.athena.gateway"
    )
    try:
        subprocess.Popen(
            ["/bin/sh", "-c", cmd],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            start_new_session=True,
        )
    except Exception as e:
        return f"(/full-restart failed to dispatch: {e})"
    return (
        "🔁 Full restart scheduled.\n"
        "Bouncing FastAPI server (~5s) and gateway (~3s after that).\n"
        "Athena's in-memory cognitive state will reset; SQLite stays intact."
    )



# ── /profile — Standard (Ollama) vs Power (Claude Max OAuth) ──────────────

# Hermes conversation-layer settings per profile. Keep in sync with
# cognitive_agent/model_profiles.py::CONVERSATION_LAYER — duplicated here
# (two small dicts) instead of imported so the gateway process never
# depends on cognitive_agent being importable.
#
# base_url is load-bearing: runtime_provider.py resolves provider
# "anthropic" as `cfg_base_url or "https://api.anthropic.com"` — a stale
# Ollama base_url left in config.yaml pointed the Anthropic client at
# ollama.com and every Power-mode conversation fell back to minimax-m2.7
# (observed live 2026-06-10 20:02). The built-in /model switch writes all
# three keys on every change (gateway/run.py model_cfg["base_url"] =
# result.base_url); this sync must do the same.
_OLLAMA_FALLBACK_M3 = {
    "provider": "ollama-cloud",
    "model": "minimax-m3:cloud",
    "base_url": "https://ollama.com/v1",
    "key_env": "OLLAMA_API_KEY",
}
_OLLAMA_FALLBACK_M27 = {
    "provider": "ollama-cloud",
    "model": "minimax-m2.7:cloud",
    "base_url": "https://ollama.com/v1",
    "key_env": "OLLAMA_API_KEY",
}
_OLLAMA_FALLBACK_DEEPSEEK = {
    "provider": "ollama-cloud",
    "model": "deepseek-v4-flash:cloud",
    "base_url": "https://ollama.com/v1",
    "key_env": "OLLAMA_API_KEY",
}

# The fallback chain is per-profile: in Standard the primary IS minimax-m3,
# so its first fallback is m2.7 (retrying the failed model would be
# pointless). In Power the primary is Claude — when the Max usage window
# is exhausted (Anthropic 400 "out of extra usage"), the right first
# fallback is minimax-m3, the Standard primary, then the Standard chain.
_PROFILE_CONVERSATION = {
    "standard": {
        "model": "minimax-m3:cloud",
        "provider": "ollama-cloud",
        "base_url": "https://ollama.com/v1",
        "fallback_providers": [_OLLAMA_FALLBACK_M27, _OLLAMA_FALLBACK_DEEPSEEK],
    },
    "power": {
        "model": "claude-opus-4-8",
        "provider": "anthropic",
        "base_url": "https://api.anthropic.com",
        "fallback_providers": [
            _OLLAMA_FALLBACK_M3,
            _OLLAMA_FALLBACK_M27,
            _OLLAMA_FALLBACK_DEEPSEEK,
        ],
    },
}

_PROFILE_SUMMARY = {
    "standard": (
        "conversation minimax-m3 · reasoning minimax-m3 · pipeline gemma4 "
        "· vision ministral-3:14b"
    ),
    "power": (
        "conversation opus-4.8 · reasoning sonnet-4.6 · pipeline haiku-4.5 "
        "· vision haiku-4.5 (salience/micro-calls + opencode stay on Ollama)"
    ),
}


def _anthropic_usage_lines() -> list:
    """Claude Max window usage, best-effort. Empty list when unavailable."""
    try:
        from agent.account_usage import fetch_account_usage, render_account_usage_lines

        snapshot = fetch_account_usage("anthropic")
        if snapshot is None or not snapshot.available():
            return []
        return render_account_usage_lines(snapshot, markdown=True)
    except Exception:
        return []


def _sync_hermes_conversation_layer(profile: str) -> bool:
    """Point config.yaml model.default/provider/base_url and the
    fallback_providers chain at the profile's conversation settings.
    Returns True when the config actually changed."""
    from hermes_cli.config import load_config, save_config

    target = _PROFILE_CONVERSATION[profile]
    cfg = load_config() or {}
    model_cfg = cfg.setdefault("model", {})
    fallbacks = [dict(fb) for fb in target["fallback_providers"]]
    if (
        model_cfg.get("default") == target["model"]
        and model_cfg.get("provider") == target["provider"]
        and model_cfg.get("base_url") == target["base_url"]
        and cfg.get("fallback_providers") == fallbacks
    ):
        return False
    model_cfg["default"] = target["model"]
    model_cfg["provider"] = target["provider"]
    model_cfg["base_url"] = target["base_url"]
    cfg["fallback_providers"] = fallbacks
    save_config(cfg)
    return True


def _handle_mode(raw_args: str) -> Optional[str]:
    """/mode — show the active model profile; /mode power|standard
    switches it: flips the runtime flag on the FastAPI server, repoints
    the Hermes conversation model, then bounces both LaunchAgents (the
    profile is read once at server startup by design).

    Named /mode, not /profile: the gateway has a built-in /profile
    (Hermes config-profile + home dir) that intercepts before plugin
    commands — register_command would reject the collision."""
    arg = (raw_args or "").strip().lower()

    if not arg:
        try:
            resp = requests.get(f"{ATHENA_URL}/profile", timeout=10)
            if resp.status_code != 200:
                return f"(/profile error {resp.status_code}: {resp.text[:200]})"
            data = resp.json()
        except requests.exceptions.ConnectionError:
            return "(Athena server is not reachable on :8765)"
        except Exception as e:
            return f"(/profile error: {e})"
        profile = data.get("profile", "standard")
        emoji = "⚡" if profile == "power" else "🦙"
        lines = [
            f"{emoji} *Model profile: {profile}*",
            _PROFILE_SUMMARY.get(profile, ""),
        ]
        if data.get("restart_required"):
            lines.append(
                f"⚠️ Server still running the *{data.get('booted_with')}* "
                "profile — restart pending (/full-restart applies it)."
            )
        usage = _anthropic_usage_lines()
        if usage:
            lines.append("")
            lines.extend(usage)
        lines.append("\nSwitch with `/mode power` or `/mode standard`.")
        return "\n".join(line for line in lines if line is not None)

    if arg not in _PROFILE_CONVERSATION:
        return "Usage: `/mode` (status), `/mode power`, `/mode standard`."

    # 1. Flip the runtime flag on the server. Abort the whole switch if
    #    it's unreachable — never restart into an unknown state.
    try:
        resp = requests.post(
            f"{ATHENA_URL}/profile", json={"profile": arg}, timeout=10
        )
        if resp.status_code != 200:
            return f"(profile switch error {resp.status_code}: {resp.text[:200]})"
        data = resp.json()
    except requests.exceptions.ConnectionError:
        return "(Athena server is not reachable on :8765 — profile unchanged.)"
    except Exception as e:
        return f"(profile switch error: {e})"

    # 2. Repoint the Hermes conversation layer (config.yaml).
    try:
        config_changed = _sync_hermes_conversation_layer(arg)
    except Exception as e:
        return (
            f"⚠️ Athena's flag is now *{arg}* but the Hermes config update "
            f"failed ({e}). Fix config.yaml manually, then /full-restart."
        )

    already = (
        data.get("previous") == arg
        and not data.get("restart_required")
        and not config_changed
    )
    if already:
        return f"Profile *{arg}* is already active everywhere — no restart needed."

    # 3. Bounce both LaunchAgents, same detached pattern as /full-restart:
    #    reply flushes first, then the server re-reads the flag and the
    #    gateway re-reads config.yaml.
    uid = os.getuid()
    cmd = (
        "sleep 3 && "
        f"launchctl kickstart -k gui/{uid}/ai.athena.server && "
        f"launchctl kickstart -k gui/{uid}/ai.athena.gateway"
    )
    try:
        subprocess.Popen(
            ["/bin/sh", "-c", cmd],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            start_new_session=True,
        )
    except Exception as e:
        return (
            f"⚠️ Profile flag and config are set to *{arg}* but the restart "
            f"failed to dispatch ({e}). Run /full-restart to apply."
        )

    conv = _PROFILE_CONVERSATION[arg]
    emoji = "⚡" if arg == "power" else "🦙"
    return (
        f"{emoji} *Switching to the {arg} profile.*\n"
        f"{_PROFILE_SUMMARY[arg]}\n"
        f"Conversation layer → {conv['model']} ({conv['provider']}).\n"
        "Restarting server (~5s) and gateway (~3s after) to apply. "
        "In-memory cognitive state resets; SQLite stays intact."
    )


def _handle_athena(raw_args: str) -> Optional[str]:
    body = (raw_args or "").strip()
    if not body:
        try:
            health = requests.get(f"{ATHENA_URL}/health", timeout=5)
            if health.status_code == 200:
                return "✅ Athena proxy is active and Athena is running."
        except Exception:
            pass
        return (
            "Athena proxy is active, but Athena is not running. "
            "Start her with: cd ~/cognitive-agent && python athena_server.py"
        )
    return _call_athena(body)


def register(ctx):
    """Register slash commands. DM delegation lives at a deeper layer:
    when ATHENA_GATEWAY_DELEGATE=1 the gateway's run_agent.py wires a
    RemoteCognitiveProcessor that proxies the cognitive method calls to
    athena_server.py over HTTP — preserving streaming and matching
    native Hermes latency. This plugin's sole role is the slash-command
    UI surface (/think, /athena <msg>, /audit, /halt, etc.)."""
    ctx.register_command(
        "think",
        handler=_handle_think,
        description="Show Athena's cognitive snapshot (inner speech, goals, "
                    "metacognition, recent signals, opencode_run activity).",
    )
    ctx.register_command(
        "athena",
        handler=_handle_athena,
        description="Chat with Athena via her cognitive loop, or ping with no args.",
        args_hint="<message>",
    )
    ctx.register_command(
        "mode",
        handler=_handle_mode,
        description="Show or switch Athena's model profile. /mode shows the "
                    "active profile + Claude Max usage; /mode power routes "
                    "cognition to Claude (Max subscription, no API billing); "
                    "/mode standard restores the Ollama models. Switching "
                    "restarts the server and gateway (~8s).",
        args_hint="[power|standard]",
    )
    ctx.register_command(
        "full-restart",
        handler=_handle_full_restart,
        description="Restart BOTH Athena's FastAPI server and the Telegram gateway. "
                    "Clears in-memory cognitive state; SQLite is preserved.",
    )
    # Phase 13F: self-proposed goal flow
    ctx.register_command(
        "proposed-goals",
        handler=_handle_proposed_goals,
        description="List Athena's self-proposed goals with their risk tier and approval status.",
    )
    ctx.register_command(
        "approve-goal",
        handler=_handle_approve_goal,
        description="Approve a pending escalate-tier self-proposed goal so it joins her active list.",
        args_hint="<goal-id-prefix>",
    )
    ctx.register_command(
        "dismiss-goal",
        handler=_handle_dismiss_goal,
        description="Dismiss/retract a self-proposed goal (works for pending or active).",
        args_hint="<goal-id-prefix>",
    )
    # /retract-goal is an alias for /dismiss-goal — they have the same effect.
    ctx.register_command(
        "retract-goal",
        handler=_handle_dismiss_goal,
        description="Alias for /dismiss-goal — drop a self-proposed goal Athena added.",
        args_hint="<goal-id-prefix>",
    )
    # Phase 13G: autonomy bypass — opt-in 100% autonomy mode.
    ctx.register_command(
        "bypass",
        handler=_handle_bypass,
        description="Toggle Athena's autonomy bypass. /bypass on auto-approves all "
                    "self-proposed goals; /bypass off restores the three-tier flow; "
                    "/bypass shows current state.",
        args_hint="on|off",
    )
    # Phase 13H (#4): pursuit_enabled — master switch for self-driven execution.
    ctx.register_command(
        "pursuit",
        handler=_handle_pursuit,
        description="Toggle Athena's between-turn tool execution. /pursuit on arms "
                    "the AutonomyGuard for self-driven tool calls; /pursuit off "
                    "blocks them; /pursuit shows current state and budgets.",
        args_hint="on|off",
    )
    # Phase 13H panic button — full emergency stop for autonomy.
    ctx.register_command(
        "halt",
        handler=_handle_halt,
        description="EMERGENCY STOP for autonomous behavior. Disables pursuit, "
                    "abandons in-flight self-proposed goals, rejects pending "
                    "escalations, clears AutonomyGuard budget, resets cycle state. "
                    "Use when Athena is doing something unexpected.",
    )
    # Phase 13H audit log — chronological view of autonomous behavior.
    ctx.register_command(
        "audit",
        handler=_handle_audit,
        description="Show a chronological view of Athena's autonomous behavior. "
                    "Default 6 hours; pass a number for custom window (e.g. /audit 24).",
        args_hint="[hours]",
    )
    # needs_review triage commands (/approve-review, /retry-review,
    # /abandon-review, /abandon) removed 2026-06-17. Self-proposed needs_review
    # is fully internal (the review_needs_review_queue owns it); user-goal
    # needs_review is now a plain FYI with no manual triage command. Nothing to
    # register here.
    # Autonomous self-modification controls. The drift governor may auto-pause
    # self-mod when value drift keeps worsening; these let Greg inspect + resume.
    ctx.register_command(
        "selfmod-status",
        handler=_handle_selfmod_status,
        description="Show autonomous self-mod state: armed/paused, drift similarity, "
                    "and the self-edits made since the baseline was pinned.",
    )
    ctx.register_command(
        "resume-selfmod",
        handler=_handle_resume_selfmod,
        description="Resume autonomous self-mod after a drift pause. Re-pins the "
                    "drift baseline to now (accepts the current direction) and re-arms.",
    )
