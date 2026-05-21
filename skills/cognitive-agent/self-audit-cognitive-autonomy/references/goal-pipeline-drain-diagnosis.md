# Goal Pipeline Drain Diagnosis

Detect and characterize a state where the goal pipeline has fully drained—zero active goals, `propose_goal` running but producing nothing actionable, and the system cycling on maintenance handlers without making forward progress.

## Signature

The drained-pipeline state is **not** the same as "the system is idle." It has a specific fingerprint across three data surfaces:

| Surface | Healthy | Drained |
|---------|---------|---------|
| `goals` table | 1-5 active goals, mix of statuses | 0 active, 120+ completed, 20+ abandoned |
| `propose_goal` heartbeat | Creates new goals regularly | Runs but skips (rate-limited or TOM-blocked) |
| Proactive message log | Messages reaching user | All blocked by TOM (`imp < threshold`) |

## Diagnostic Queries

### 1. Active Goal Count
```bash
python3 -c "
import sqlite3
conn = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
c = conn.execute('SELECT status, COUNT(*) FROM goals GROUP BY status')
for r in c.fetchall():
    print(f'{r[0]}: {r[1]}')
"
```

### 2. Recent propose_goal Outcomes
```bash
tail -100 ~/cognitive-agent/hermes/logs/athena_server.error.log | grep "propose_goal"
```
Look for:
- `not created — reason='telegram-shape-rate-limit'` — rate-limited by design
- `not created — reason='no-drive-above-threshold'` — drive competition produced nothing
- No log line at all — propose_goal may not be running

### 3. TOM Gate State
```bash
python3 -c "
import sqlite3, time
conn = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
row = conn.execute('SELECT attention_state, confidence, reason FROM greg_state WHERE id=1').fetchone()
if row:
    print(f'TOM state: {row[0]} (conf={row[1]})')
    print(f'Reason: {row[2]}')
"
```

### 4. Recent Goal Completes With No Active Replacements
```bash
python3 -c "
import sqlite3, time
conn = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
rows = conn.execute('SELECT content, created_at, drive FROM goals WHERE status=\"completed\" ORDER BY updated_at DESC LIMIT 5').fetchall()
for r in rows:
    ts = time.strftime('%m-%d %H:%M', time.localtime(r[1]))
    print(f'{ts} | drive={r[2] or \"?\":15s} | {r[0][:70]}')
"
```

## Common Blockage Patterns

### Pattern A: TOM Gate Block
- Symptoms: `propose_goal` creates goals with importance 0.6-0.8, but TOM threshold is higher than the observed importance range and state is `unavailable`
- Root cause: TOM v0 has no mechanism to clear `unavailable` state except seeing user input. If user is absent >4h, gate stays closed.
- Current threshold (2026-05-11): `unavailable` = 0.70 (was 1.10 prior, lowered per discussion). Allows high-importance pings through during long gaps.
- Implication: Medium-importance messages (0.60-0.75) from curiosity drive still blocked; high-importance (0.70+) now passes.
- Mitigation: Add time-based decay to `unavailable` state, or route blocked proposals to a digest note instead of requiring Telegram delivery.

### Pattern B: Rate-Limiter Staircase
- Symptoms: `propose_goal` logs show `telegram-shape-rate-limit: last telegram-shape goal was X min ago; window is 240 min (Y min remaining)`
- Root cause: The `telegram-shape` drive has a 240-min cooldown. If the only active drive is `curiosity` and it produces telegram-shaped goals, each proposal creates a 4-hour cooldown.
- Implication: Max 6 proposals per day, regardless of how many hypotheses are generated.
- Mitigation: This is a designed-in constraint to prevent spamming. If the system is producing more good hypotheses than the rate limiter allows, the cooldown window or the threshold should be revisited.

### Pattern D: Phantom-Goal Starvation (tool_select_failed)

- Symptoms: Goals are "active" (not drained) — the goals table shows 1-2 active items — but `pursue_goal_step` always skips with `tool_select_failed: name '<tool>' is not defined`
- Root cause: The goal proposer generated a goal that references a tool-by-name which doesn't exist in the tool registry. Each cycle tick attempts to call the tool, gets a Python-level NameError, and skips in ~0.003s.
- Why it looks like drain: From the heartbeat view, the cycle is "running" (consecutive ticks with no tool execution, low `productive_rate`), but the system is actually cycling on a dead-end goal with zero chance of resolution.
- Why the fail-rate gate may not catch it: If the gate only fires on `tool_success: false` outcomes from *executed* tools, `tool_select_failed` skips may not increment the failures counter.
- Mitigation: See `references/phantom-goal-tool-select-failed.md` for diagnosis queries, manual-abandon fix, and structural proposer validation approach.
- ~~Symptoms: Goals are created but cannot make progress because `read_vault` returns irrelevant results ~~
- ~~Root cause: Tool produced output but the output didn't satisfy the goal's need. The goal cycled repeatedly until the stuck-cycle breaker fired after 8 skips.~~
- **Status: RESOLVED.** `read_vault` had three bugs fixed on May 11:
  1. `MAX_SCAN_FILES` raised from 2000 to 8000 (vault has 7515 files, 2185 scannable after filtering sensitive folders)
  2. Stopword filter added (~114 words including "analyze", "identify", "synthesize") so goal-length queries produce signal not noise
  3. YAML frontmatter-aware excerpting — skips `---` metadata blocks when building result excerpts
- If tool-gap starvation re-emerges for a different tool, investigate the tool's invocation path (how does the CognitiveCycle call it? what parameters does the LLM dispatcher generate?) rather than the tool itself.

## Recovery Paths

### Quick: Stuck-Cycle Fallback
If the system is in a drained state with no active goals, the stuck-cycle breaker (8 consecutive skips → auto-creates a short-term system goal) serves as a minimal recovery path. Check if it fired:

```bash
grep "stuck_cycle\|short-term system goal" ~/cognitive-agent/hermes/logs/athena_server.error.log
```

### Medium: TOM Threshold Adjustment
If the TOM gate is systematically blocking all proactive messaging, consider adjusting `ATTENTION_THRESHOLDS` in `tom.py`. Current values (2026-05-11):
- `available`: 0.40
- `interruptible`: 0.60
- `focused`: 0.85
- `unavailable`: 0.70 (lowered from 1.10 → 0.85 → 0.70)

### Structural: Delivery Path Diversification
Rather than lowering thresholds, route TOM-blocked proposals into a running digest note (vault or athena_notes) so the daily cron summary can reference them. This preserves the silence gate while preventing hypotheses from being lost.

## History

- **2026-05-09:** First drained-pipeline detection in daily summary — 0 active goals, `no_top_goal_focus_only` pattern dominating heartbeat ticks.
- **2026-05-11:** Confirmed pattern persists — 122 completed, 22 abandoned, 0 active. `propose_goal` running (280 iterations) but producing TOM-blocked or rate-limited output.
- **2026-05-11:** TOM `unavailable` threshold lowered 1.10 → 0.70. `read_vault` tool fixed (scan limit, stopwords, frontmatter excerpts).
