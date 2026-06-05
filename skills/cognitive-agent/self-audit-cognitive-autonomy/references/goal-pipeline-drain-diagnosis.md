# Goal Pipeline Drain Diagnosis

Detect and characterize a state where the goal pipeline has fully drained—zero active goals, `propose_goal` running but producing nothing actionable, and the system cycling on maintenance handlers without making forward progress.

## Signature

The drained-pipeline state is **not** the same as "the system is idle." It has a specific fingerprint across three data surfaces:

| Surface | Healthy | Drained |
|---------|---------|---------|
| `goals` table | 1-5 active goals, mix of statuses | 0 active, 120+ completed, 20+ abandoned |
| `propose_goal` heartbeat | Creates new goals regularly | Runs but skips (rate-limited or no_top_goal) |
| Proactive message log | Messages reaching user | All blocked by quiet-hours or rate-limit |

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

### Pattern E: Telegram-Shaped Goal Drain (June 1, 2026)

- **Symptoms:** 0 active goals despite proposer running. Recent self-proposed goals are concentrated in two outcome groups: (a) Telegram-shaped goals ("A Telegram to Greg about X...") abandoned at attempt ceiling 12 with 0–2 failures, and (b) calibration notes that complete in 1–3 attempts but produce artifacts nobody reads.
- **Root cause:** The proposer generates Telegram-shaped goals regardless of whether `self_driven_telegram_enabled()` is set. When the Telegram flag is off (default), `send_message` is gated behind `SELF_DRIVEN_TOOL_GATED` in `cognitive_cycle.py`. The cycle correctly never fires `send_message`, the LLM selector cycles through available tools that can't deliver a message, and the goal abandons at 12 attempts.
- **Why it drains the pipeline:** The proposer produces 1 goal per call. If the current proposal window's dominant drive produces a Telegram-shaped goal, that's the only slot for the next 240 min (rate-limiter staircase, Pattern B). The goal drains at 12 attempts (typically 12 min of tick time), and the pipeline is empty again until the proposal window reopens.
- **Mitigation — proposer flag check:** In `propose_self_goal()`, before the LLM call, check `self_driven_telegram_enabled()`. If off, either:
  1. Suppress Telegram-shaped proposals entirely by biasing the prompt toward `save_note`-shaped deliverables
  2. Or append a directive: "Telegram flag is currently off — you CANNOT send messages. Frame any deliverable as a saved note instead."
- **Deeper structural fix:** The proposer has no feedback loop from `self_goal_outcomes`. It keeps proposing shapes known to fail. Wiring the proposer to read recent outcome history before the LLM call would let it learn which shapes survive (see ENG-2026-0521-001 for the kimi-k2.6 model change that was the prior proposer fix).
- **Query to detect:**
  ```sql
  SELECT content, status, attempt_count, failure_count, risk_tier
  FROM goals WHERE source='self_proposed'
  ORDER BY created_at DESC LIMIT 10;
  ```
  If Telegram-shaped goals dominate the abandoned list with attempt_count=12 and failure_count ≤2, this pattern is active.

## Recovery Paths

### Quick: Stuck-Cycle Fallback
If the system is in a drained state with no active goals, the stuck-cycle breaker (8 consecutive skips → auto-creates a short-term system goal) serves as a minimal recovery path. Check if it fired:

```bash
grep "stuck_cycle\|short-term system goal" ~/cognitive-agent/hermes/logs/athena_server.error.log
```

## History

- **2026-05-09:** First drained-pipeline detection in daily summary — 0 active goals, `no_top_goal_focus_only` pattern dominating heartbeat ticks.
- **2026-05-11:** Confirmed pattern persists — 122 completed, 22 abandoned, 0 active. `propose_goal` running (280 iterations) but producing rate-limited output.
- **2026-05-11:** `read_vault` tool fixed (scan limit, stopwords, frontmatter excerpts).
