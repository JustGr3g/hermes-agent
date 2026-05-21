---
name: opencode
description: "Delegate coding to OpenCode CLI (features, PR review)."
version: 1.2.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Coding-Agent, OpenCode, Autonomous, Refactoring, Code-Review]
    related_skills: [claude-code, codex, hermes-agent]
---

# OpenCode CLI

Use [OpenCode](https://opencode.ai) as an autonomous coding worker orchestrated by Hermes terminal/process tools. OpenCode is a provider-agnostic, open-source AI coding agent with a TUI and CLI.

## When to Use

- User explicitly asks to use OpenCode
- You want an external coding agent to implement/refactor/review code
- You need long-running coding sessions with progress checks
- You want parallel task execution in isolated workdirs/worktrees

## Prerequisites

- OpenCode installed: `npm i -g opencode-ai@latest` or `brew install anomalyco/tap/opencode`
- Auth configured: `opencode auth login` or set provider env vars (OPENROUTER_API_KEY, etc.)
- Verify: `opencode auth list` should show at least one provider
- Git repository for code tasks (recommended)
- `pty=true` for interactive TUI sessions

## Binary Resolution (Important)

Shell environments may resolve different OpenCode binaries. If behavior differs between your terminal and Hermes, check:

```
terminal(command="which -a opencode")
terminal(command="opencode --version")
```

If needed, pin an explicit binary path:

```
terminal(command="$HOME/.opencode/bin/opencode run '...'", workdir="~/project", pty=true)
```

## One-Shot Tasks

Use `opencode run` for bounded, non-interactive tasks:

```
terminal(command="opencode run 'Add retry logic to API calls and update tests'", workdir="~/project")
```

Attach context files with `-f`:

```
terminal(command="opencode run 'Review this config for security issues' -f config.yaml -f .env.example", workdir="~/project")
```

Show model thinking with `--thinking`:

```
terminal(command="opencode run 'Debug why tests fail in CI' --thinking", workdir="~/project")
```

Force a specific model:

```
terminal(command="opencode run 'Refactor auth module' --model openrouter/anthropic/claude-sonnet-4", workdir="~/project")
```

## Interactive Sessions (Background)

For iterative work requiring multiple exchanges, start the TUI in background:

```
terminal(command="opencode", workdir="~/project", background=true, pty=true)
# Returns session_id

# Send a prompt
process(action="submit", session_id="<id>", data="Implement OAuth refresh flow and add tests")

# Monitor progress
process(action="poll", session_id="<id>")
process(action="log", session_id="<id>")

# Send follow-up input
process(action="submit", session_id="<id>", data="Now add error handling for token expiry")

# Exit cleanly — Ctrl+C
process(action="write", session_id="<id>", data="\x03")
# Or just kill the process
process(action="kill", session_id="<id>")
```

**Important:** Do NOT use `/exit` — it is not a valid OpenCode command and will open an agent selector dialog instead. Use Ctrl+C (`\x03`) or `process(action="kill")` to exit.

### TUI Keybindings

| Key | Action |
|-----|--------|
| `Enter` | Submit message (press twice if needed) |
| `Tab` | Switch between agents (build/plan) |
| `Ctrl+P` | Open command palette |
| `Ctrl+X L` | Switch session |
| `Ctrl+X M` | Switch model |
| `Ctrl+X N` | New session |
| `Ctrl+X E` | Open editor |
| `Ctrl+C` | Exit OpenCode |

### Resuming Sessions

After exiting, OpenCode prints a session ID. Resume with:

```
terminal(command="opencode -c", workdir="~/project", background=true, pty=true)  # Continue last session
terminal(command="opencode -s ses_abc123", workdir="~/project", background=true, pty=true)  # Specific session
```

## Common Flags

| Flag | Use |
|------|-----|
| `run 'prompt'` | One-shot execution and exit |
| `--continue` / `-c` | Continue the last OpenCode session |
| `--session <id>` / `-s` | Continue a specific session |
| `--agent <name>` | Choose OpenCode agent (build or plan) |
| `--model provider/model` | Force specific model |
| `--format json` | Machine-readable output/events |
| `--file <path>` / `-f` | Attach file(s) to the message |
| `--thinking` | Show model thinking blocks |
| `--variant <level>` | Reasoning effort (high, max, minimal) |
| `--title <name>` | Name the session |
| `--attach <url>` | Connect to a running opencode server |

## Procedure

1. Verify tool readiness:
   - `terminal(command="opencode --version")`
   - `terminal(command="opencode auth list")`
2. For bounded tasks, use `opencode run '...'` (no pty needed).
3. For iterative tasks, start `opencode` with `background=true, pty=true`.
4. Monitor long tasks with `process(action="poll"|"log")`.
5. If OpenCode asks for input, respond via `process(action="submit", ...)`.
6. Exit with `process(action="write", data="\x03")` or `process(action="kill")`.
7. Summarize file changes, test results, and next steps back to user.

## PR Review Workflow

OpenCode has a built-in PR command:

```
terminal(command="opencode pr 42", workdir="~/project", pty=true)
```

Or review in a temporary clone for isolation:

```
terminal(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && opencode run 'Review this PR vs main. Report bugs, security risks, test gaps, and style issues.' -f $(git diff origin/main --name-only | head -20 | tr '\n' ' ')", pty=true)
```

## Parallel Work Pattern

Use separate workdirs/worktrees to avoid collisions:

```
terminal(command="opencode run 'Fix issue #101 and commit'", workdir="/tmp/issue-101", background=true, pty=true)
terminal(command="opencode run 'Add parser regression tests and commit'", workdir="/tmp/issue-102", background=true, pty=true)
process(action="list")
```

## Research-First Delegation Pattern

For maximum reliability, follow this sequence when using OpenCode to fix an existing tool or codebase:

1. **Diagnose in isolation** — Run the tool/code yourself first. Confirm it works when called directly. If it does, the bug is in how it's invoked, not in the tool itself.
2. **Find the actual gap** — Look at how the tool gets called in production (CognitiveCycle, tool_dispatcher, etc.). The surface-level symptoms (wrong results, empty returns) often point to a different root cause than what you'd guess from reading the tool alone.
3. **Formulate a targeted prompt** — Include line numbers, the specific constant values, the exact failure mode, and the desired fix in your prompt. Don't say "fix read_vault" — say "line 47: MAX_SCAN_FILES = 2000 but vault has 7515 files, bump to 8000; line 131: tokenizer extracts stopwords, add `_STOPWORDS` filter."
4. **Delegate** — Send the prompt via `opencode run`. The precise prompt lets OpenCode execute without needing to rediscover the bugs.
5. **Verify** — After OpenCode completes, run the tool again, run the diagnostics again, confirm the fix actually resolves the production issue.

This pattern avoids the failure mode where OpenCode spends 5+ minutes reading the file, making its own assumptions about what's wrong, and fixing a different class of problem than the one you identified.

### Example: read_vault Tool Fix (May 11, 2026)

The `read_vault` tool was returning irrelevant results for curiosity-driven goals. The workflow:

| Step | What I did | Why |
|------|-----------|-----|
| Diagnose | Called `ReadVaultTool.execute({'mode':'search', 'query':'morning routine'})` directly — it worked fine | Ruled out tool-level failure |
| Find gap | Traced the CognitiveCycle dispatch path — full goal paragraphs were being passed as search queries | Identified two sub-bugs: (1) `MAX_SCAN_FILES=2000` only covered 27% of 7515 vault files, (2) tokenizer extracted meta-words like "analyze" and "synthesize" instead of signal words |
| Formulate | Wrote prompt with line numbers (47, 131, 166-172), the exact stopword list, and the frontmatter fix | Gave OpenCode everything it needed in one shot |
| Delegate | `opencode run --format json --dir ... 'Fix read_vault.py...'` | One-shot, no iteration needed |
| Verify | Re-ran the tool, checked files_scanned (now 2185 after skipping sensitive folders), confirmed excerpt quality | Confirmed the pipeline was now producing useful results |

## Session & Cost Management

List past sessions:

### Provider-Specific Setups

**OpenRouter / standard providers:**
```bash
opencode auth login --provider openrouter --method api-key
```
Verify: `opencode auth list` should show 1+ credentials.

**Ollama Cloud (custom config):**
Greg's setup uses a config file at `~/.opencode/config.json` with a custom provider:
```json
{
  "provider": {
    "ollama-cloud": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama Cloud",
      "options": {
        "baseURL": "https://ollama.com/v1",
        "apiKey": "{env:ATHENA_OLLAMA_API_KEY}"
      },
      "models": {
        "glm-5.1:cloud": {"name": "GLM 5.1 Cloud"},
        "kimi-k2.6:cloud": {"name": "Kimi K2.6 Cloud"},
        "deepseek-v4-flash:cloud": {"name": "DeepSeek V4 Flash Cloud"}
      }
    }
  },
  "model": "ollama-cloud/glm-5.1:cloud"
}
```
Note: `opencode auth list` shows `0 credentials` with this setup — that's expected. The provider config is in the JSON, not auth.json. Use `--model ollama-cloud/<model>` to select the model.

Auth file: `~/.opencode/config.json` (not `~/.local/share/opencode/auth.json`). The env var `ATHENA_OLLAMA_API_KEY` must be set.

---

## Procedure

1. **Verify auth FIRST** — always run before any dispatch:
   ```bash
   opencode auth list
   ```
   If output shows `0 credentials`, check for `~/.opencode/config.json` with a custom provider config before giving up. The custom-config path does NOT use `opencode auth login`.

2. **Check readiness** (after auth is confirmed):
   ```bash
   opencode --version
   ```

3. **For bounded one-shot tasks**, use `opencode run`. Prefer writing complex prompts to a temp file to avoid shell escaping issues:
   ```bash
   # Write prompt to temp file (avoids f-string/quote/special-char parsing issues)
   terminal(command="opencode run 'Apply changes in /tmp/oc_prompt.md' -f /tmp/oc_prompt.md --format json --thinking")
   ```
## Pitfalls

### OpenCode stalls (May 2026) — ollama-cloud/deepseek-v4-flash

The model can stall in three distinct failure modes:

**A. Large-file reading stall.** Sending a prompt that asks OpenCode to read 14k+ lines of code (e.g. `run_agent.py`) produces a process at 0% CPU that runs 35+ minutes without output. Diagnosis: `ps` shows TIME < 3s even after 30+ min, no output files written, no session log entry.

**B. Multi-file creation stall.** `opencode run` with a prompt requesting 3+ new files via `-f` can stall after the model reads source code but before it finishes writing all files. Observed twice: 4KB prompt for 3 test files stalled at ~300s (wrote 2/3 files), 11KB prompt for 8 files stalled at 300s (wrote 0 files). The model completes the first tool-call batch (reading source) then hangs during the write-or-test-run phase.

**C. Large-file single-edit stall (May 14, 2026).** A prompt targeting a single file of 16k+ lines (`run_agent.py`) timed out at 120s. The model successfully read the file (confirmed in logs) but stalled before writing the edit. **Mitigation: use `patch` instead of OpenCode for targeted edits on files >5k lines.** The `patch` tool handles exact before/after string replacement on large files with lint verification. Only use OpenCode for multi-line additions, new methods, or files under 5k lines.

**Mitigations for all three stall types:**
1. **Split large prompts into smaller batches.** Write shared infrastructure (conftest, helpers) manually. Dispatch per-file or per-2-file prompts separately.
2. **Set a wall-clock timeout** (300s) on `opencode run`. If it stalls, kill and fall back to direct `patch()` or `write_file()`.
3. **For files >5k lines, prefer `patch()` over OpenCode.** The `patch()` tool is deterministic, always succeeds, and has lint verification. OpenCode's stall risk on large files is not worth the convenience.
4. **Small scope works fine.** The same model completes a targeted 86-line file change in ~40s. The issue is file size, not model availability.
5. **Recovery when stalled:** `kill <pid>` → `ps aux | grep opencode` to verify cleanup → switch to manual (`patch()` or direct `write_file()`). Don't retry the same prompt.

## Targeted Single-File Edit Pattern (Most Reliable)

Confirmed across 4 consecutive successful dispatches (May 14, 2026): the model handles **single-file targeted edits with exact line numbers and clear before/after code blocks** perfectly and reliably.

**The pattern:**
1. Write the prompt to a temp file via `write_file()` — NOT as inline terminal args
2. Include **exact line numbers** for every change location
3. Provide **the exact before/after code** — do not say "change similarly" or "add analogous code"
4. Each prompt touches exactly ONE file
5. Set the timeout to 120s (these complete in 15-40s typically)
6. Use `--model ollama-cloud/deepseek-v4-flash:cloud --format json`

**Example structure** (from the May 14 branching-flag-implementation prompt):
```markdown
## Task: Wire branching flags into loop behavior in run_agent.py

### File to edit
`/Users/gregdreyfus/cognitive-agent/hermes/run_agent.py`

### Changes needed

**1. Add `_cognitive_advisory` to init block (after line 11540):**
```python
        self._repeated_failure = False
        self._cognitive_advisory = ""  # NEW
```

**2. Replace the logging-only block (lines 15116-15166) with:**
[exact replacement code]

**3. Inject `_cognitive_advisory` into ephemeral system prompt.**
Find the block at approximately line 12156-12160. Add AFTER that block:
[exact injection code]
```

**What was delivered in one session (May 14)** using this pattern:
- Wave 1: tool success rates in cog block (~120 lines in cognitive_processor.py)
- Wave 2: rich strategic branching (~60 lines in run_agent.py)  
- Wave 4: cognitive advisory in system prompt (~50 lines in run_agent.py)
- Tests: branching test expansion (192 additions) + cog block tests
- All 20 tests passed

**Do NOT** include f-strings, shell expressions, or special characters in the `opencode run` command itself — write them to the prompt file instead.
- **Inline prompts with f-strings, quotes, or special chars will break shell parsing.** Write the prompt to a temp file via `write_file()` and pass it with `-f`:
  ```  
  write_file(path="/tmp/oc_prompt.md", content="...")
  terminal(command="opencode run 'Apply changes in /tmp/oc_prompt.md' -f /tmp/oc_prompt.md --format json")
  ```
  This avoids shell escaping issues entirely.
- Interactive `opencode` (TUI) sessions require `pty=true`. The `opencode run` command does NOT need pty.
- `/exit` is NOT a valid command — it opens an agent selector. Use Ctrl+C to exit the TUI.
- PATH mismatch can select the wrong OpenCode binary/model config.
- If OpenCode appears stuck, inspect logs before killing:
  - `process(action="log", session_id="<id>")`
- Avoid sharing one working directory across parallel OpenCode sessions.
- Enter may need to be pressed twice to submit in the TUI (once to finalize text, once to send).

## Verification

Smoke test:

```
terminal(command="opencode run 'Respond with exactly: OPENCODE_SMOKE_OK'")
```

Success criteria:
- Output includes `OPENCODE_SMOKE_OK`
- Command exits without provider/model errors
- For code tasks: expected files changed and tests pass

## Rules

1. Prefer `opencode run` for one-shot automation — it's simpler and doesn't need pty.
2. Use interactive background mode only when iteration is needed.
3. Always scope OpenCode sessions to a single repo/workdir.
4. For long tasks, provide progress updates from `process` logs.
5. Report concrete outcomes (files changed, tests, remaining risks).
6. Exit interactive sessions with Ctrl+C or kill, never `/exit`.
