# Quiet Hours Evolution

## Phase 1: Original Design (April 2026)

`ATHENA_QUIET_HOURS=22-7` in `~/Library/LaunchAgents/ai.athena.server.plist`.

**Behavior:**
- `AutonomyGuard.can_execute()` blocked ALL self-driven tool calls during quiet hours (line 305-312)
- `_can_send_proactive()` in agent.py also blocked Telegram sends
- Intended purpose: "don't disturb Greg while sleeping"

**Problem:** The guard conflated "don't send Telegram messages" with "don't do any work at all." Non-visible tools (terminal, pi_run, web_search, read_vault) had no reason to be blocked.

## Phase 2: Narrowed Gate (2026-05-02)

Patched `autonomy_guard.py` to only block notification tools:

```python
_QUIET_HOURS_EXEMPT = {"send_message", "send_voice", "post_to_peer"}
if self._in_quiet_hours() and tool_name in _QUIET_HOURS_EXEMPT:
    ...deny...
```

**Also cleaned up:**
- `ATHENA_QUIET_HOURS` corrected from `22-7` to `23-6` (Greg's actual sleep window)
- `read_file` and `search_files` added to pursuit allowlist (were missing)
- `terminal` cap bumped 4→8/hr, `read_file`/`search_files` set to 20/hr

## Phase 3: Removed (2026-05-02)

Greg decided to handle DND at the phone level. Removed entirely:

- Quiet-hours block logic stripped from `autonomy_guard.py`
- `ATHENA_QUIET_HOURS` commented out in plist (not deleted, left as historical reference)
- Agent restarted via `launchctl unload/load`

## Final State

No quiet-hours gating exists anywhere. The `_in_quiet_hours()` method, `_parse_quiet_hours()`, and `_can_send_proactive()` still exist in agent.py (used by reminder deferral and rate-limiting logic) but `AutonomyGuard.can_execute()` no longer consults them.

## Verification

```bash
# Check env var is unset
echo "ATHENA_QUIET_HOURS=$ATHENA_QUIET_HOURS"

# Check plist
grep QUIET ~/Library/LaunchAgents/ai.athena.server.plist
# Expected: commented out (<!-- <key>ATHENA_QUIET_HOURS</key> -->)

# Check autonomy guard has no quiet-hours block
grep "quiet-hours" ~/cognitive-agent/cognitive_agent/autonomy_guard.py
# Expected: only the docstring line mentioning it's disabled
```

## Gotcha

If the agent is restarted while `ATHENA_QUIET_HOURS` is still set (e.g., stale shell env, or plist wasn't reloaded), the env variable still gets picked up by `os.environ.get("ATHENA_QUIET_HOURS", "")` in `_in_quiet_hours()`. But since `can_execute()` no longer calls `_in_quiet_hours()`, this is harmless — the env var is dead code now. Only `_can_send_proactive()` still uses it.
