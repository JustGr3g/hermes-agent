# Phantom Goal Pattern: tool_select_failed

A goal that references a non-existent tool, causing `tool_select_failed` on every cycle tick. The goal is "active" in name but can never make progress.

## Signature

- Telemetry shows `athena.pursue_goal_step` events with `fired=false`, `skipped_reason="tool_select_failed: name '<tool_name>' is not defined"`
- Same goal_id repeats across many consecutive ticks (every ~3-5 minutes)
- Each skip is ~0.003s — essentially free in latency, invisible in logs
- The goal accumulates `attempts` counter in the goals table without ever producing a real execution

## Why It Happens

The goal proposer (via `propose_goal` heartbeat or motivation drive) generates goal text that references a tool by name — but the referenced tool does not exist in the tool registry used by the cognitive cycle's dispatcher. Common sources:

1. **Goal proposer hardcodes a tool name** based on its training data priors (e.g., assumes a `research` tool exists because many agents have one)
2. **Renamed/removed tool** — the tool existed in an older version of the system but was removed or renamed
3. **Cross-codebase confusion** — the tool exists in Hermes' tool registry but not in Athena's `cognitive_agent` tool registry, or vice versa

## Diagnosis

```bash
# Find the stuck goal
python3 -c "
import sqlite3, json
conn = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
rows = conn.execute('SELECT id, status, content, attempts, failures FROM goals WHERE status=\"active\"').fetchall()
for r in rows:
    print(f'[{r[0][:8]}] {r[1]}: att={r[2]} fail={r[3]} | {r[4][:80]}')
"

# Check how many times it's been tried
python3 -c "
import sqlite3
conn = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
rows = conn.execute('SELECT id, attempts, failures, fail_rate FROM goals WHERE status=\"suspended\" ORDER BY fail_rate DESC LIMIT 10').fetchall()
for r in rows:
    print(f'[{r[0][:8]}] attempts={r[1]} failures={r[2]} rate={r[3]:.1f}')
"
```

## Why the Fail-Rate Gate May Not Catch It

If a soft fail-rate gate exists in `cognitive_cycle.py` (e.g., auto-suspend goals with >=2 attempts and >0.5 fail rate), it should catch this pattern. If it doesn't:

1. **The gate might not be wired** to the `pursue_goal_step` pathway — it may only fire on `tool_success: false` outcomes from *executed* tools, not from `tool_select_failed` skips
2. **The skip counter and the fail-rate gate are different mechanisms** — the stuck-cycle breaker (8 consecutive skips) and the fail-rate gate (attempt/failure ratio) may use different event streams
3. **A `tool_select_failed` skip may not increment the `failures` counter** — if the failure counter only increments on real tool failures, a tool-selection skip is invisible to the fail-rate gate

## Fix Options

### Short-term: Manual Goal Abandonment
```bash
python3 -c "
import sqlite3, time
conn = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
conn.execute('UPDATE goals SET status=\"abandoned\", updated_at=? WHERE id=? AND status=\"active\"', (time.time(), '2fb2f612-ba3a-494a-beb0-2a2ba6b7bc86'))
print(conn.execute('SELECT changes()').fetchone()[0], 'rows updated')
conn.commit()
"
```

### Medium-term: Proposer Validation
Add a step in the goal proposer pipeline that checks proposed tool names against the actual tool registry before creating the goal. This prevents phantom goals from being created at all.

### Long-term: Tool Mapping Layer
The cognitive cycle's tool selection should map goal content to available tools rather than matching by name. If no tool fits, the response should be `no_tool_resolution` (a known skip reason) not `tool_select_failed` (a Python-level NameError).

## History

- **2026-05-17 18:01 UTC:** Goal `2fb2f612` ("Research note identifying under-represented domains in vault") diagnosed as phantom goal — references non-existent `research` tool. Greg notified during Telegram check-in.
- **2026-05-18:** Goal still cycling ~15 times across autonomous ticks. Fail-rate gate did not suspend it.
