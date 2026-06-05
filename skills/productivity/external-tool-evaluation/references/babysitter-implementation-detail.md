# Babysitter Patterns — Implementation Specifics (2026-05-30)

## What was built

Three patterns extracted from [a5c-ai/babysitter](https://github.com/a5c-ai/babysitter) and implemented in Hermes:

## 1. Verify→Remediate Loop (cron scheduler)

**File:** `cron/scheduler.py` — `_run_job_impl` (~line 1795)

The verifier runs against `final_response` after the agent generates it. If issues found, the agent receives a remediation prompt and re-generates (up to `max_verify_retries`). Only appends warning footer if all retries exhausted.

**Key design decision:** The retry reuses the **same warm AIAgent** instance — no expensive reconstruction. The `agent.run_conversation()` call is synchronous, so the loop blocks until remediation completes.

**Config:** `verify_script` + `max_verify_retries` (default 2) per job. Daily summary already had `verify_script` set; `max_verify_retries` was added.

**Stale duplicate removed:** The tick-level `_process_job` had another `verify_script` handler at line ~2024 that ran the verifier again and blindly appended output. Removed with a guard comment after verifying the new logic in `_run_job_impl` covers it.

## 2. Content-Type-Aware Compression Plugin

**Files:** `plugins/content_compression/plugin.yaml`, `plugins/content_compression/__init__.py`

Three engines via two hooks:

| Layer | Hook | Engine | Threshold | Toggle |
|-------|------|--------|-----------|--------|
| Terminal | `transform_terminal_output` | command-compressor | 500 chars | `CONTENT_COMPRESSION_LAYER_TERMINAL` |
| File read | `transform_tool_result` | density-filter | 1000 chars | `CONTENT_COMPRESSION_LAYER_FILE` |
| Search | `transform_tool_result` | match-summarizer | 800 chars | `CONTENT_COMPRESSION_LAYER_SEARCH` |

**Enablement chain:** repo files at `plugins/content_compression/` + `content-compression` entry in `~/.hermes/config.yaml` under `plugins.enabled`.

## 3. Process-as-Code Registry

**Files:** `processes/registry.py`, `processes/daily_summary.py`, `processes/__init__.py`, `tools/run_process.py`

**Architecture:**
- `Process` (ABC) → subclass defines `run(inputs, ctx)` with explicit steps
- `ProcessContext` → logging, step recording, timing
- `ProcessRegistry` → singleton, `register()` and `run()` methods
- `ProcessResult` → status (ok/with_issues/failed), output, steps, error

**DailySummaryProcess** steps:
1. `gather_facts` — runs `daily_summary_facts.py`
2. `generate_summary` — LLM with facts prepended
3. `verify_claims` + `remediate` — loop with max retries
4. Returns `ProcessResult(status="ok"|"with_issues", output=...)`

**Two modes:**
- **Cron mode:** injected `generate_fn` wraps the warm AIAgent (avoids subprocess)
- **Standalone mode:** runs `hermes chat -q` via subprocess

**Enablement chain:**
1. `processes/registry.py` — base class + registry (auto-imported)
2. `processes/daily_summary.py` — process definition (registers itself)
3. `cron/scheduler.py` — short-circuit in `_run_job_impl` when `job.process` is set
4. `cron/jobs.json` — added `"process": "daily_summary"` to the daily summary job
5. `tools/run_process.py` — tool for inline invocation (registered in `_HERMES_CORE_TOOLS`)
