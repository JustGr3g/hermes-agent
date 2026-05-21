# Maintaining the Pursuit Allowlist and Per-Tool Caps

As Athena gains new capabilities or discovers diagnostic needs, the `DEFAULT_PURSUIT_ALLOWLIST` and `DEFAULT_PER_TOOL_HOURLY_CAPS` in `autonomy_guard.py` may need updating. This reference captures the pattern for doing that.

## Signal: When to Add a Tool to the Allowlist

You see `self_tool_blocked` in telemetry with `reason: "not-in-allowlist (tool=XYZ)"` when trying to use a tool from a self-driven context (heartbeat handler, cognitive cycle, autonomous goal pursuit).

**Policy:** Read-only tools (tools that only inspect state, read files, or search) should be added to the allowlist. They have negligible blast radius and their diagnostic value outweighs the guard's conservatism.

Write-tools (send_message, save_note, post_to_peer, create_reminder) should stay gated by the allowlist — or be explicitly opted in if the autonomous use case is intentional.

## Signal: When to Adjust a Cap

You see `self_tool_blocked` with `reason: "per-tool-cap (tool X/Y in last hour)"` or `"global-self-cap"`.

**Default caps:**

| Tool | Default Cap | Rationale |
|------|-------------|-----------|
| web_search | 10/hr | Safe, read-only |
| web_fetch | 10/hr | Safe, read-only |
| read_vault | 20/hr | Safe, read-only, needs headroom for multi-vault tasks |
| read_file | 20/hr | Added for audit cycles (was 1/hr default, insufficient) |
| search_files | 20/hr | Same as read_file |
| pi_run | 4/hr | Coding subagent — 4 completions/hr is already generous |
| terminal | 8/hr | Was 4/hr, bumped for multi-step DB queries + log scanning |
| save_note | 3/hr | Writer — conservative |
| create_reminder | 2/hr | Writer — conservative |
| post_to_peer | 2/hr | Peer messaging — conservative |
| send_message | 3/hr | Telegram pings to Greg — gated tight |
| send_voice | 0/hr | Off by default; explicit opt-in needed |
| complete_goal | 6/hr | Goal lifecycle — safe and idempotent |
| *(any other)* | 1/hr | Catch-all default |

**Scaling heuristic:** For read-only diagnostic tools, 20/hr is safe. For write/visibility tools, keep at ≤3/hr unless there's a specific use case. `terminal` at 8/hr means ~2 multi-step audits per hour, which is a comfortable ceiling.

## How to Edit

In `~/cognitive-agent/cognitive_agent/autonomy_guard.py`:

```python
# Add to allowlist (line ~82)
DEFAULT_PURSUIT_ALLOWLIST: frozenset[str] = frozenset({
    ...
    "new_tool_name",
})

# Add cap (line ~49)
DEFAULT_PER_TOOL_HOURLY_CAPS: dict[str, int] = {
    ...
    "new_tool_name": 20,  # read-only
}
```

## Verification

```bash
# Check the current allowlist and caps
cd ~/cognitive-agent && python3 -c "
from cognitive_agent.autonomy_guard import DEFAULT_PURSUIT_ALLOWLIST, DEFAULT_PER_TOOL_HOURLY_CAPS
print('Allowlist:', sorted(DEFAULT_PURSUIT_ALLOWLIST))
print()
print('Caps:')
for k, v in sorted(DEFAULT_PER_TOOL_HOURLY_CAPS.items()):
    print(f'  {k}: {v}/hr')
"

# The change takes effect on next agent restart (launchctl unload/load)
```

## Pitfalls

1. **Adding a tool to allowlist but not giving it a cap** → Falls through to `GLOBAL_DEFAULT_PER_TOOL_HOURLY_CAP` (1/hr). Always add a cap entry for new allowlisted tools.
2. **Setting cap to 0 means "off"** — `cap = 0` disables the tool regardless of confidence scaling. Use 0 for tools that should never run self-driven (e.g., `send_voice`).
3. **Cap scaling from confidence — THE SILENT THROTTLE** — When `action_success_rate()` returns < 0.5, caps auto-shrink by 50-75%. A `terminal` cap of 8 becomes 4 or 2 during a bad streak. This is normally intentional, **BUT IT CREATES A DOOM LOOP FOR AUDIT TOOLS**:
   - A bad streak shrinks terminal → can't debug the streak → failures persist → stays shrunk
   - **Fix:** Add audit/introspection tools to `_CAP_SHRINK_EXEMPT` in `autonomy_guard.py` (around line 350):
     ```python
     # Current exempt set (2026-05-03):
     _CAP_SHRINK_EXEMPT = {"complete_goal", "save_note", "terminal"}
     ```
   - **Signal that it's happening:** The `self_tool_blocked` reason shows `terminal 2/2 in last hour` even though the configured cap in source is `8/hr`. If the cap in the block reason doesn't match the source cap, confidence scaling is active.
   - **Verify exempt status:**
     ```bash
     python3 -c "
     import sys; sys.path.insert(0, '/Users/gregdreyfus/cognitive-agent')
     from cognitive_agent.autonomy_guard import AutonomyGuard
     import inspect
     for line in inspect.getsource(sys.modules['cognitive_agent.autonomy_guard']).split('\n'):
         if '_CAP_SHRINK_EXEMPT' in line:
             print(line.strip())
     "
     ```
4. **Process-local budgets reset on restart** — The rolling 1h logs are in-memory only, so restarting the agent resets all budgets. This is acceptable since restart already implies fresh context.
