# Phantom Tool Detection

A **phantom tool** is a tool name that appears in the AutonomyGuard's allowlist and per-tool caps but does not exist in the actual tool registry. When the cognitive cycle tries to call it, the tool dispatcher returns `tool_success: false` with sub-millisecond latency (~0.5ms) — the signature of a tool-name lookup miss, not a real tool execution failure.

Phantom tools are dangerous because they:
- **Accept the guard's hourly budget** — each failed attempt consumes a budget slot
- **Pass the allowlist gate** — the guard thinks the tool is valid
- **Kill goals that depend on them** — a goal that needs `read_vault` will fail after `attempt_count` hits 3–5 then get abandoned
- **Erode confidence** — repeated failures trigger the confidence-modulated cap shrink, shrinking budgets for even *other* tools

## Detection Signature

Query `tool_outcomes` in `athena_memory.db` for the phantom pattern:

```
tool_name: "read_vault"
success: 0
latency_ms: < 1.0
args_summary: "SOUL.md" (or whatever the goal passed)
```

Sub-millisecond latency is the distinguishing feature. Real tool failures (e.g. terminal returning a non-zero exit) take 10s+ ms because the tool actually dispatched.

## How to Check

```bash
# 1. List all tool outcomes in last 24h with sub-1ms failures
python3 -c "
import sqlite3, time
c = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
rows = c.execute('''
  SELECT tool_name, COUNT(*), SUM(success), AVG(latency_ms)
  FROM tool_outcomes
  WHERE timestamp > ?
    AND latency_ms < 1.0
    AND success = 0
  GROUP BY tool_name
''', (time.time() - 86400,)).fetchall()
for r in rows:
    print(f'{r[0]}: {r[2]}/{r[1]} successful, avg {r[3]:.1f}ms (PHANTOM)')
"

# 2. Check what tool names the guard thinks exist vs what the registry knows
# Look at DEFAULT_PURSUIT_ALLOWLIST in autonomy_guard.py (line ~80)
# vs the actual tool registry

# 3. Verify the tool name doesn't resolve by checking the dispatch path
grep -rn '"read_vault"\|"read_vault"\|name.*=.*"read_vault"' ~/cognitive-agent/hermes/tools/*.py
```

## Known Phantom Tools

| Tool | Status | Impact |
|------|--------|--------|
| `read_vault` | Listed in AutonomyGuard allowlist + per-tool caps (20/hr) but no `tools/*.py` file registers it. Goal `5efdc00e` (image-prompt visualization) killed after 3 phantom failures. | Direct goal killer. 12/12 failures in last 24h window. |

## How to Fix a Phantom Tool

Two options:

### Option A: Wire it to a working backend
Find what the tool was supposed to do (e.g. `read_vault` is listed in the guard at `autonomy_guard.py:52` and `autonomy_guard.py:83` as a safe read-only tool) and either make it read from the relevant source (Obsidian vault? athena_notes table?) or create a tool that does what its name implies.

### Option B: Remove it
Remove the tool name from:
1. `DEFAULT_PER_TOOL_HOURLY_CAPS` dict (autonomy_guard.py ~line 48-70)
2. `DEFAULT_PURSUIT_ALLOWLIST` frozenset (autonomy_guard.py ~line 80-90)
3. Any tool registry that lists it

This way the guard correctly denies it with `not-in-allowlist` instead of admitting it to a runtime miss.

## Prevention

When adding a new tool to the guard's allowlist or cap map, **verify it exists in the tool registry first**:

```bash
grep -r 'registry.register.*name="<tool_name>"' ~/cognitive-agent/hermes/tools/
```

If no registry registration exists, the tool is effectively phantom — add the tool implementation first, *then* add it to the guard configuration.
