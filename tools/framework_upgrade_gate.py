"""Pre-yolo confirmation gate for framework-modifying operations.

Prevents Athena from autonomously running ``git`` / ``pip install -e`` /
file-write operations against her own framework source code without
explicit per-call confirmation routed through the same Telegram approval
queue used by ``tools.approval``.

Designed in response to the 2026-04-30 incident where Athena interpreted a
casual release-link message as a directive, ran ``git stash`` +
``git reset --hard`` + ``git pull`` against her own ``HERMES_HOME``, and
left her gateway in an unrecoverable merge-conflict state.

This module is hooked into ``tools.approval.check_all_command_guards``
*before* the ``--yolo`` / ``approval_mode=off`` / autonomy-bypass shortcut.
Neither a session-level yolo flip nor an autonomy-bypass setting can defeat
the gate — only the persistent ``runtime_flags['framework_upgrade_requires_confirm']``
SQLite row (default ON) can disable it, and toggling that requires writing
to ``~/athena_memory.db`` directly.

Path predicate: gates writes/git ops that affect framework source dirs
inside ``HERMES_HOME`` — ``gateway/``, ``agent/``, ``tools/``,
``hermes_cli/``, plus a handful of top-level package files. Skills,
sessions, plugins, logs, cron, and memories are NOT gated.
"""

from __future__ import annotations

import logging
import os
import re
import shlex
import sqlite3
import time
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────
# Toggle — runtime_flags['framework_upgrade_requires_confirm']
# ─────────────────────────────────────────────────────────────────────────
#
# Mirrors the ``autonomy_on`` flag's read path in gateway/run.py
# ``_handle_autonomy_command``: SQLite row in ``~/athena_memory.db``,
# default ON when row absent.

_DEFAULT_DB_PATH = Path.home() / "athena_memory.db"
_FLAG_KEY = "framework_upgrade_requires_confirm"


def _db_path() -> Path:
    override = os.getenv("ATHENA_RUNTIME_DB")
    return Path(override) if override else _DEFAULT_DB_PATH


def is_gate_enabled() -> bool:
    """Return True if the gate is enabled. Default ON."""
    db = _db_path()
    if not db.exists():
        return True
    try:
        conn = sqlite3.connect(str(db), timeout=10, isolation_level=None)
        try:
            row = conn.execute(
                "SELECT value FROM runtime_flags WHERE key = ?",
                (_FLAG_KEY,),
            ).fetchone()
        finally:
            conn.close()
    except sqlite3.OperationalError:
        return True
    if row is None:
        return True
    return str(row[0]).lower() in ("1", "true", "on", "yes")


def set_gate_enabled(enabled: bool) -> None:
    """Persist the toggle. Mirrors ``_handle_autonomy_command``'s ``_write``."""
    db = _db_path()
    conn = sqlite3.connect(str(db), timeout=10, isolation_level=None)
    try:
        conn.executescript(
            "CREATE TABLE IF NOT EXISTS runtime_flags ("
            "key TEXT PRIMARY KEY, value TEXT NOT NULL, "
            "updated_at REAL NOT NULL);"
        )
        conn.execute(
            "INSERT INTO runtime_flags (key, value, updated_at) "
            "VALUES (?, ?, ?) "
            "ON CONFLICT(key) DO UPDATE SET "
            "value = excluded.value, updated_at = excluded.updated_at",
            (_FLAG_KEY, "1" if enabled else "0", time.time()),
        )
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────────────────
# Path predicate
# ─────────────────────────────────────────────────────────────────────────

_FRAMEWORK_SUBDIRS = frozenset({
    "gateway", "agent", "tools", "hermes_cli",
})

_FRAMEWORK_TOPLEVEL_FILES = frozenset({
    "model_tools.py", "run_agent.py", "athena_server.py",
    "pyproject.toml", "setup.py", "setup.cfg", "MANIFEST.in",
    "Dockerfile",
})

_FRAMEWORK_TOPLEVEL_PREFIXES = ("requirements",)

# Directly inside HERMES_HOME but NOT framework code — Athena's own work.
_USER_CONTENT_SUBDIRS = frozenset({
    "skills", "sessions", "plugins", "logs", "cron", "memories",
    "skins", "bin", "__pycache__", ".git", ".plans", ".github",
})


def _resolve_hermes_home() -> Path:
    raw = os.getenv("HERMES_HOME")
    if raw:
        return Path(raw).expanduser().resolve()
    return (Path.home() / "cognitive-agent" / "hermes").resolve()


def path_is_framework_source(
    path: str | os.PathLike,
    hermes_home: Optional[Path] = None,
) -> bool:
    """Return True if ``path`` resolves to framework code inside HERMES_HOME.

    A path qualifies as framework source when, relative to HERMES_HOME, it
    sits inside a framework subdirectory or matches a top-level package
    file. Paths outside HERMES_HOME, inside a user-content subdir, or
    inside an unknown top-level dir are NOT gated.
    """
    home = hermes_home or _resolve_hermes_home()
    try:
        resolved = Path(path).expanduser().resolve()
    except (OSError, RuntimeError):
        return False

    try:
        rel = resolved.relative_to(home)
    except ValueError:
        return False

    parts = rel.parts
    if not parts:
        return False

    first = parts[0]
    if first in _USER_CONTENT_SUBDIRS:
        return False
    if first in _FRAMEWORK_SUBDIRS:
        return True
    if len(parts) == 1:
        if first in _FRAMEWORK_TOPLEVEL_FILES:
            return True
        for prefix in _FRAMEWORK_TOPLEVEL_PREFIXES:
            if first.startswith(prefix):
                return True
    return False


# ─────────────────────────────────────────────────────────────────────────
# Command predicate
# ─────────────────────────────────────────────────────────────────────────

# Git verbs that modify the working tree, repo state, or remote config in
# a way relevant to a framework upgrade. Read-only verbs (status, log,
# diff, show, ls-files, blame, grep, config --get, remote -v) are NOT
# gated — those are part of normal investigation work.
_GATED_GIT_VERBS = frozenset({
    "pull", "fetch", "reset", "stash", "clean", "checkout",
    "rebase", "merge", "cherry-pick", "revert", "restore",
    "switch", "branch", "tag", "apply", "am", "submodule",
    "filter-branch", "reflog",
})

_PIP_EDITABLE_RE = re.compile(
    r'\bpip(?:3)?\s+(?:install|uninstall)\s+(?:[^|;&]*\s)?-(?:e\b|-editable\b)',
    re.IGNORECASE,
)
_PIP_REQUIREMENTS_RE = re.compile(
    r'\bpip(?:3)?\s+install\s+(?:[^|;&]*\s)?-r\s+\S*requirements',
    re.IGNORECASE,
)
_SETUP_DEVELOP_RE = re.compile(
    r'\bpython(?:3)?\s+setup\.py\s+(?:develop|install)\b',
    re.IGNORECASE,
)

_REDIRECT_TARGET_RE = re.compile(
    r'(?:>>|>|\btee\b\s+(?:-a\s+)?|\bcat\b[^|;&]*?>)\s*["\']?([^\s"\'`|;&]+)',
    re.IGNORECASE,
)
_SED_INPLACE_RE = re.compile(
    r'\bsed\s+(?:-[a-zA-Z]*i\b|--in-place\b)[^|;&]*?\s([^\s|;&]+)\s*(?:[|;&]|$)',
    re.IGNORECASE,
)


def _split_command_chain(command: str) -> list[str]:
    """Split a shell command on ``;``, ``&&``, ``||``, ``|``, newline.

    Not a real shell parser — close enough to inspect each subcommand
    independently. Quoted separators are not handled, but a quoted ``;``
    inside an arg won't change which subcommand contains the git verb.
    """
    return [chunk.strip() for chunk in re.split(r'(?:\|\||&&|;|\||\n)', command) if chunk.strip()]


def _git_verb(subcommand: str) -> Optional[str]:
    """Return the git verb if ``subcommand`` invokes git, else None."""
    try:
        tokens = shlex.split(subcommand)
    except ValueError:
        tokens = subcommand.split()

    i = 0
    while i < len(tokens):
        t = tokens[i]
        if t in ("sudo", "env", "exec", "nohup", "setsid", "time"):
            i += 1
            continue
        if "=" in t and i > 0:
            i += 1
            continue
        break

    if i >= len(tokens) or tokens[i] != "git":
        return None

    for verb in tokens[i + 1:]:
        if verb.startswith("-"):
            continue
        return verb.lower()
    return None


def _git_dash_c_target(subcommand: str) -> Optional[str]:
    """Return the ``-C <path>`` argument from a git command, if any."""
    try:
        tokens = shlex.split(subcommand)
    except ValueError:
        tokens = subcommand.split()
    for j, t in enumerate(tokens):
        if t == "-C" and j + 1 < len(tokens):
            return tokens[j + 1]
    return None


def _path_inside(path: str | os.PathLike, home: Path) -> bool:
    try:
        Path(path).expanduser().resolve().relative_to(home)
        return True
    except (ValueError, OSError, RuntimeError):
        return False


def detect_framework_upgrade(
    command: str,
    cwd: Optional[str | os.PathLike] = None,
    hermes_home: Optional[Path] = None,
) -> Tuple[bool, Optional[str]]:
    """Detect whether ``command`` would modify framework source.

    Returns ``(matched, description)``. ``description`` is a short
    human-readable phrase suitable for the Telegram approval prompt.

    Detection is conservative — false positives (one extra Telegram tap)
    are far cheaper than false negatives (silent framework mutation).
    """
    home = hermes_home or _resolve_hermes_home()
    # When cwd isn't supplied, default to HERMES_HOME — fail-closed.
    # Athena's gateway process runs from ~/cognitive-agent/ (one level
    # above HERMES_HOME), so Path.cwd() would silently make every check
    # return False.  Most agent shell ops actually run inside HERMES_HOME
    # via the terminal env's tracked cwd; assuming so when uncertain is
    # the conservative choice.
    cwd_path = Path(cwd).expanduser().resolve() if cwd else home
    cwd_inside_home = _path_inside(cwd_path, home)

    for subcmd in _split_command_chain(command):
        verb = _git_verb(subcmd)
        if verb is not None and verb in _GATED_GIT_VERBS:
            dash_c = _git_dash_c_target(subcmd)
            if dash_c is not None:
                if _path_inside(dash_c, home):
                    return (True, f"git -C {dash_c} {verb}")
            elif cwd_inside_home:
                return (True, f"git {verb} (cwd inside {home})")

        if cwd_inside_home:
            if _PIP_EDITABLE_RE.search(subcmd):
                return (True, "pip install -e (re-links framework Python module)")
            if _PIP_REQUIREMENTS_RE.search(subcmd):
                return (True, "pip install -r requirements (re-installs framework deps)")
            if _SETUP_DEVELOP_RE.search(subcmd):
                return (True, "python setup.py develop/install")

        for match in _REDIRECT_TARGET_RE.finditer(subcmd):
            target = match.group(1).strip()
            if not target:
                continue
            full = target if Path(target).is_absolute() else str(cwd_path / target)
            if path_is_framework_source(full, home):
                return (True, f"shell redirect to framework source: {target}")

        for match in _SED_INPLACE_RE.finditer(subcmd):
            target = match.group(1).strip()
            if not target:
                continue
            full = target if Path(target).is_absolute() else str(cwd_path / target)
            if path_is_framework_source(full, home):
                return (True, f"sed -i on framework source: {target}")

    return (False, None)


# ─────────────────────────────────────────────────────────────────────────
# Gate entry points
# ─────────────────────────────────────────────────────────────────────────
#
# Both entry points return the same dict shape as
# ``tools.approval.check_all_command_guards`` so callers can treat them
# interchangeably:
#
#   {"approved": True,  "message": None}            — pass through
#   {"approved": True,  "user_approved": True, ...} — user said yes
#   {"approved": False, "message": "BLOCKED…"}      — denied / timeout / no UI
#
# The Telegram bridge reuses ``tools.approval._gateway_queues`` and the
# session's registered notify callback.  We do NOT keep our own pending
# state — every gate fire is a fresh prompt.

_FRAMEWORK_GATE_TIMEOUT = 300  # seconds; matches dangerous-command default


def _gateway_block_for_approval(
    description: str,
    command_or_path: str,
    pattern_key: str,
    *,
    surface_label: str,
) -> dict:
    """Block until user approves via Telegram, or reject if no bridge.

    Mirrors the blocking-approval block in
    ``tools.approval.check_all_command_guards`` (the gateway-mode branch).
    Reuses ``_gateway_queues`` and the registered notify callback so the
    user sees the same approval-card UI in Telegram, with three buttons.
    """
    from tools import approval

    session_key = approval.get_current_session_key()

    if approval.is_approved(session_key, pattern_key):
        return {"approved": True, "message": None}

    with approval._lock:
        notify_cb = approval._gateway_notify_cbs.get(session_key)

    if notify_cb is None:
        return {
            "approved": False,
            "message": (
                f"BLOCKED (framework_upgrade_gate): {description}. "
                "Gateway approval callback not registered for this session — "
                "no way to ask the user. Run via an interactive Telegram "
                "session, or disable the gate via "
                f"`runtime_flags['{_FLAG_KEY}']` in ~/athena_memory.db."
            ),
            "framework_upgrade_blocked": True,
        }

    approval_data = {
        "command": command_or_path,
        "pattern_key": pattern_key,
        "pattern_keys": [pattern_key],
        "description": f"FRAMEWORK UPGRADE [{surface_label}] — {description}",
    }
    entry = approval._ApprovalEntry(approval_data)
    with approval._lock:
        approval._gateway_queues.setdefault(session_key, []).append(entry)

    try:
        notify_cb(approval_data)
    except Exception as exc:
        logger.warning("framework_upgrade_gate notify_cb failed: %s", exc)
        with approval._lock:
            queue = approval._gateway_queues.get(session_key, [])
            if entry in queue:
                queue.remove(entry)
            if not queue:
                approval._gateway_queues.pop(session_key, None)
        return {
            "approved": False,
            "message": (
                f"BLOCKED (framework_upgrade_gate): {description}. "
                "Notification to user failed."
            ),
            "framework_upgrade_blocked": True,
        }

    try:
        from tools.environments.base import touch_activity_if_due
    except Exception:
        touch_activity_if_due = None

    now = time.monotonic()
    deadline = now + _FRAMEWORK_GATE_TIMEOUT
    activity_state = {"last_touch": now, "start": now}
    resolved = False
    while True:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            break
        if entry.event.wait(timeout=min(1.0, remaining)):
            resolved = True
            break
        if touch_activity_if_due is not None:
            touch_activity_if_due(
                activity_state, "waiting for framework upgrade confirmation"
            )

    with approval._lock:
        queue = approval._gateway_queues.get(session_key, [])
        if entry in queue:
            queue.remove(entry)
        if not queue:
            approval._gateway_queues.pop(session_key, None)

    choice = entry.result
    if not resolved or choice is None or choice == "deny":
        reason = "timed out" if not resolved else "denied by user"
        return {
            "approved": False,
            "message": (
                f"BLOCKED (framework_upgrade_gate): {description} — {reason}. "
                "Do NOT retry this operation."
            ),
            "framework_upgrade_blocked": True,
        }

    # Approved. Persist scope: 'session' grants for the rest of this
    # session; 'once' / 'always' do NOT persist for framework upgrades —
    # too rare and consequential to add to the permanent allowlist.
    if choice == "session":
        approval.approve_session(session_key, pattern_key)

    return {
        "approved": True,
        "message": None,
        "user_approved": True,
        "description": description,
    }


def check_command_gate(
    command: str,
    env_type: str,
    cwd: Optional[str | os.PathLike] = None,
) -> dict:
    """Pre-yolo command check, called from approval.check_all_command_guards.

    Skips containerized envs (they cannot affect host framework source).
    Skips when the gate flag is OFF.  Skips when the command does not
    match the framework-upgrade predicate.  Otherwise blocks until the
    user approves or denies via Telegram.
    """
    if env_type in ("docker", "singularity", "modal", "daytona", "vercel_sandbox"):
        return {"approved": True, "message": None}
    if not is_gate_enabled():
        return {"approved": True, "message": None}

    matched, description = detect_framework_upgrade(command, cwd=cwd)
    if not matched:
        return {"approved": True, "message": None}

    is_gateway = bool(os.getenv("HERMES_GATEWAY_SESSION"))
    is_ask = bool(os.getenv("HERMES_EXEC_ASK"))
    is_cli = bool(os.getenv("HERMES_INTERACTIVE"))

    if not (is_gateway or is_ask or is_cli):
        # Cron / batch / background — no user available to confirm.
        # Fail closed: framework upgrades from non-interactive contexts
        # are exactly what this gate exists to prevent.
        return {
            "approved": False,
            "message": (
                f"BLOCKED (framework_upgrade_gate): {description}. "
                "No interactive session available to confirm. Framework "
                "upgrades must be initiated from an interactive Telegram "
                f"session, or the gate must be disabled via "
                f"`runtime_flags['{_FLAG_KEY}']` in ~/athena_memory.db."
            ),
            "framework_upgrade_blocked": True,
        }

    pattern_key = f"framework_upgrade:cmd:{description[:80]}"

    if is_gateway or is_ask:
        return _gateway_block_for_approval(
            description=description,
            command_or_path=command,
            pattern_key=pattern_key,
            surface_label="bash",
        )

    # Pure CLI fallback (Athena rarely runs this way, but covered for
    # parity with the dangerous-command flow).
    from tools import approval
    choice = approval.prompt_dangerous_approval(
        command,
        f"FRAMEWORK UPGRADE — {description}",
        allow_permanent=False,
    )
    if choice == "deny":
        return {
            "approved": False,
            "message": (
                f"BLOCKED (framework_upgrade_gate): {description} denied by user."
            ),
            "framework_upgrade_blocked": True,
        }
    if choice == "session":
        approval.approve_session(approval.get_current_session_key(), pattern_key)
    return {"approved": True, "message": None, "user_approved": True}


def check_file_write_gate(path: str | os.PathLike) -> dict:
    """Pre-write check for file-edit tools (write_file_tool and friends).

    Bash-mediated writes (``cat > path`` via ShellFileOperations._exec)
    are caught by ``check_command_gate``. This entry point exists for
    Python-level write paths that may bypass the shell — defense in depth.
    """
    if not is_gate_enabled():
        return {"approved": True, "message": None}
    if not path_is_framework_source(path):
        return {"approved": True, "message": None}

    is_gateway = bool(os.getenv("HERMES_GATEWAY_SESSION"))
    is_ask = bool(os.getenv("HERMES_EXEC_ASK"))
    is_cli = bool(os.getenv("HERMES_INTERACTIVE"))

    description = f"write to framework source: {path}"

    if not (is_gateway or is_ask or is_cli):
        return {
            "approved": False,
            "message": (
                f"BLOCKED (framework_upgrade_gate): {description}. "
                "No interactive session available to confirm."
            ),
            "framework_upgrade_blocked": True,
        }

    pattern_key = f"framework_upgrade:file:{str(path)[:80]}"

    if is_gateway or is_ask:
        return _gateway_block_for_approval(
            description=description,
            command_or_path=str(path),
            pattern_key=pattern_key,
            surface_label="file_write",
        )

    from tools import approval
    choice = approval.prompt_dangerous_approval(
        str(path),
        f"FRAMEWORK UPGRADE — {description}",
        allow_permanent=False,
    )
    if choice == "deny":
        return {
            "approved": False,
            "message": (
                f"BLOCKED (framework_upgrade_gate): {description} denied by user."
            ),
            "framework_upgrade_blocked": True,
        }
    if choice == "session":
        approval.approve_session(approval.get_current_session_key(), pattern_key)
    return {"approved": True, "message": None, "user_approved": True}
