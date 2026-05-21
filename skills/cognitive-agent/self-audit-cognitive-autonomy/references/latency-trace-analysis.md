# Latency Trace Analysis — Real-Turn Performance Diagnosis

**Context:** Greg requested real latency traces (not code audits) to identify bottlenecks. After a previous false-audit incident, this is the canonical approach for performance investigations.

**Source:** `~/.hermes/logs/agent.log` — contains `_latency_trace` log lines for EVERY turn.

---

## Trace Format

Each turn produces a sequence of events identified by `turn=<session_id_prefix>`:

```
LATENCY_TRACE turn=f94a9da3 event=gateway_receive ts_ms=<unix_ms>
LATENCY_TRACE turn=f94a9da3 event=run_start ts_ms=<unix_ms>
LATENCY_TRACE turn=f94a9da3 event=iter_start n=1 ts_ms=<unix_ms>
LATENCY_TRACE turn=f94a9da3 event=llm_first_token ts_ms=<unix_ms>     # first token of LLM response in this iteration
LATENCY_TRACE turn=f94a9da3 event=tool_dispatch n=1 tools=<comma_sep> ts_ms=<unix_ms>
LATENCY_TRACE turn=f94a9da3 event=iter_start n=2 ts_ms=<unix_ms>
...repeat iter_start → llm_first_token → tool_dispatch...
LATENCY_TRACE turn=f94a9da3 event=send_start ts_ms=<unix_ms>
LATENCY_TRACE turn=f94a9da3 event=send_end ts_ms=<unix_ms>
```

---

## Extraction Script

```bash
# Filter traces for a specific turn
grep "LATENCY_TRACE turn=THE_PREFIX" ~/.hermes/logs/agent.log

# Or extract all traces from last N minutes
grep LATENCY_TRACE ~/.hermes/logs/agent.log | tail -100

# Parse into readable timeline
grep LATENCY_TRACE ~/.hermes/logs/agent.log | tail -100 | python3 -c "
import sys, re
lines = [l.strip() for l in sys.stdin if l.strip()]
events = []
for line in lines:
    # Extract turn, event, n, tools, ts_ms
    m = re.search(r'turn=(\w+)\s+event=(\w+)\s+((?:n=(\d+)\s+)?)((?:tools=([\w,]+)\s+)?)ts_ms=(\d+)', line)
    if m:
        events.append({
            'turn': m.group(1),
            'event': m.group(2),
            'n': m.group(4),
            'tools': m.group(5),
            'ts_ms': int(m.group(6)),
        })

# Group by turn
turns = {}
for e in events:
    turns.setdefault(e['turn'], []).append(e)

for turn_id, evts in sorted(turns.items()):
    print(f'\\n=== Turn {turn_id} ===')
    base = evts[0]['ts_ms']
    for e in evts:
        delta = (e['ts_ms'] - base) / 1000
        extra = ''
        if e['event'] == 'tool_dispatch' and e['tools']:
            extra = f'  🛠️ {e[\"tools\"]}'
        elif e['event'] == 'iter_start' and e['n']:
            extra = f'  (iteration {e[\"n\"]})'
        elif e['event'] == 'send_end':
            total_turn = (e['ts_ms'] - base) / 1000
            extra = f'  🏁 TOTAL: {total_turn:.1f}s'
        print(f'  +{delta:>8.1f}s  {e[\"event\"]}{extra}')
"
```

---

## Interpretation Rules

| Event | What It Measures | Typical Duration |
|-------|-----------------|-----------------|
| `gateway_receive` → `run_start` | Gateway dispatch overhead (message routing, session lookup) | <1s |
| `run_start` → `iter_start n=1` | Cognitive processor augmentation (if ATHENA sidecar is wired) | 0.5-3s |
| `iter_start` → `llm_first_token` | Time to first token from LLM (includes prompt processing) | 5-30s for cloud models |
| `llm_first_token` → `tool_dispatch` | Time to emit tool call (streaming completion) | 1-10s |
| `tool_dispatch` → `iter_start n=N+1` | Tool execution time | Varies wildly |
| Final `llm_first_token` → `send_start` | Time to build final response text | 1-5s |
| `send_start` → `send_end` | Telegram API delivery | <1s |

**Critical path for response time:** sum of all `iter_start→llm_first_token` gaps + tool execution times. Telegram delivery is rarely the bottleneck.

**Key metric:** Count how many iterations (tool calls) the turn needed. Each iteration adds one LLM round-trip (~15-60s on cloud models).

---

## Diagnosing Specific Bottlenecks

### "Why was this turn slow?"

1. Count iterations: `grep "iter_start"` for the turn — each one is an LLM round-trip
2. Identify which tool calls took the longest: look at the gap between tool_dispatch and the next iter_start
3. Check if a single tool call accounted for >50% of total time

### "Is cognitive augmentation adding overhead?"

Compare `gateway_receive→run_start` duration:
- If consistently >3s, the ATHENA sidecar on :8765 is slow to augment
- Check `~/cognitive-agent/hermes/logs/athena_server.error.log` for sidecar errors

### "Is the post-processing pipeline a bottleneck?"

Look for `send_start` → `send_end`:
- If >5s, verify_and_revise/faithfulness filters are running
- This is after the response is assembled but before delivery — Greg flagged this as the suspected bottleneck

---

## Verification Protocol

**Before claiming any performance bottleneck exists, verify:**
1. Extract the raw trace lines for a specific turn (not aggregated stats)
2. Compute the durations manually from the ts_ms fields
3. Identify which specific event accounts for the largest fraction of total time
4. Only then propose a fix

**Do NOT:**
- Claim bottlenecks from code-reading alone ("this function looks slow")
- Aggregate across turns in averages — real traces are per-turn
- Assume post-processing is the bottleneck without checking send_start→send_end
