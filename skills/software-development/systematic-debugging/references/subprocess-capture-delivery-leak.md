# Subprocess Capture → Delivery-Channel Leak

A delivery channel (Telegram, Slack, scheduled cron output) is wired to capture
the stdout of a subprocess. The subprocess's *human-facing* output path
includes UX scaffolding around the real answer — and the channel ships the
scaffolding verbatim.

## Pattern

A scheduler / dispatcher invokes a CLI (often `hermes chat`, `claude -p`,
`opencode ...`) via `subprocess.run(..., capture_output=True)`. It treats
`proc.stdout` as the "response" and ships it to a delivery channel. The CLI's
default mode prints:

- The prompt echo ("Query: <full prompt>")
- A banner ("Initializing agent...")
- A styled response box (borders, color codes, separators)
- The actual response, often at the end

If the response is one short paragraph and the scaffolding is many lines, the
**scaffolding dominates the delivery** — and it leaks internal prompt content
(ground-truth facts blocks, system instructions, the entire user prompt) into
the user's channel.

## Real-World Example (2026-06-04)

`hermes/processes/daily_summary.py::_run_hermes_agent` invoked:

```python
proc = subprocess.run(
    ["hermes", "chat", "-q", prompt],   # ← HUMAN-FACING path
    capture_output=True, text=True, timeout=900,
)
```

And the scheduler shipped `proc.stdout` to Telegram. Result:

- Manual re-run: 686 lines of stdout
- ~8 of ~10 Telegram messages were prompt/facts leakage
- Daily Autonomous Actions Summary arrived as 10 separate messages instead of 1-2

**Root cause:** `hermes chat -q <prompt>` is the *human-facing* single-query
path. It echoes `Query: <full_prompt>`, prints the "Initializing agent..."
banner, and renders the styled response box. `proc.stdout` captured all of it.

**Fix:** pass `--quiet` (machine-readable path at `cli.py`):

```python
proc = subprocess.run(
    ["hermes", "chat", "-q", prompt, "--quiet"],  # machine-readable
    capture_output=True, text=True, timeout=900,
)
```

Verified: 686 lines → 69 lines, zero prompt/fact/banner echo, 2 clean
Telegram messages.

## Diagnostic Sequence

1. **Reproduce manually** — run the subprocess interactively and look at
   *all* of stdout, not just the tail. The bug is structural: the response is
   buried in scaffolding, not the leak.
2. **Count lines** — `proc.stdout.splitlines()` and `len(...)`. If the count
   is wildly out of proportion to the response, scaffolding is leaking.
3. **Check the CLI's flags** — most CLIs have a `--quiet`, `--json`, `--raw`,
   or `--no-banner` mode. The machine-readable path almost always exists;
   it's just not the default.
4. **Read the CLI's output-format code path** — `cli.py` for hermes, etc. Find
   the entry point and check whether stdout is wrapped in styled printing.

## Generic Detection Heuristic

For any subprocess whose stdout is being shipped to a delivery channel:

```bash
# Capture the subprocess's stdout to a file
your-cli --some-flags "your prompt" > /tmp/captured.txt
wc -l /tmp/captured.txt
head -5 /tmp/captured.txt
tail -5 /tmp/captured.txt
```

If `head` shows prompt/banner/box content and `wc -l` is large (>5x the
expected response length), you have a leak. Find the machine-readable flag
and switch to it.

## Why This Isn't Caught Earlier

- **Tests pass** — the response content is correct, just wrapped in noise
- **Manual re-runs in dev** — developer reads tail of stdout, sees the
  response, doesn't notice the surrounding scaffolding
- **The bug is silent in the producer** — the CLI is doing exactly what it
  was told; the wrong path was selected

## Prevention

When wiring a subprocess's stdout to a delivery channel:

1. **Default to the machine-readable path** if one exists (`--quiet`,
   `--json`, `--no-banner`, `--raw`)
2. **If the human-facing path is the only option**, strip the wrapping —
   e.g., parse out the response box, regex-extract after a known separator,
   or pipe through `tail -n +N` to drop banner lines
3. **Always do a one-shot manual re-run** when wiring a new subprocess to a
   delivery channel. `wc -l` the output. If it's >5x the response length,
   fix before scheduling.
4. **Log the line count** in the delivery step so future regressions are
   visible in the run logs

## Related Patterns

- **`stale-pyc-bytecode-cache.md`** — same symptom (content "fine but
  wrong"), different root cause (compiled bytecode, not stdout capture)
- **`cross-repo-investigation.md`** — when the subprocess invocation lives
  in one repo (e.g., the `hermes/` dispatch layer) and the file you need to
  edit lives in another (e.g., the `hermes/` CLI itself), verify the path
  namespace carefully — `hermes/processes/daily_summary.py` doesn't exist;
  the correct path is `processes/daily_summary.py` (the `hermes/` subdir
  is the repo root, not a path prefix inside it)
