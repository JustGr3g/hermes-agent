---
name: verify-substrate-before-action
description: "Before any write/edit/assertion, run a 30-second ground-truth pass on the substrate. Catches the dominant failure mode in this codebase: acting on inferred context (skills_list, recent file reads, last-edited directory) instead of verified state (active env, live process, real config)."
when_to_load: "Use before: writing a plugin, skill, hook, or config file; listing 'what I have access to'; asserting capability/availability claims about Greg's environment, credentials, or accounts; picking a target file or directory for an edit; claiming a service is running, listening, or configured; or any time the cognitive cycle's reflection label might be substituting for a measured check."
---

# Verify the substrate before acting on it

## The pattern

Every failure in this codebase's recent history has the same shape: **acting on a model of the world instead of a measurement of it.** Five distinct surface areas, all the same root cause:

1. **Capability assertions** — listing FMP/Polygon/Alpaca as 'have' because the user profile mentioned them, without `env | grep -i fmp` to verify. Greg corrected on 2026-06-04.
2. **Behavioral frames** — proposing 'calendar/availability signal' as a need, without verifying whether the frame itself is right. Greg corrected on 2026-06-04.
3. **Filesystem targeting** — writing to `~/.hermes/...` because the most recent file read was from there, without `echo $HERMES_HOME` to confirm the active tree. Greg corrected on 2026-06-04.
4. **Plugin loader semantics** — adding a tool to `_HERMES_CORE_TOOLS` and assuming the LLM would see it, without grepping the loader to confirm the gate. The opt-in allowlist `plugins.enabled` was the real gate.
5. **Patch tool surface** — attempting to edit a config file without checking the tool's protected-list. The guard correctly refused.

## The protocol

Before any write/assertion action, run **at most 5 lines** of ground truth:

1. **Where am I writing?** `echo $HERMES_HOME && python -c "import sys; print(sys.executable)"` — confirms the active tree and venv.
2. **What's actually here?** `ls -la <target-dir>` — confirms the directory exists and is what I think it is.
3. **What's the gate?** `grep -nE 'enabled|allowed|allowlist|opt.in' <loader-or-config-file>` — finds the load-bearing allowlist before adding to it.
4. **What does the loader actually do?** Run the discovery function directly in 5-10 lines of Python and assert the new thing surfaces. If it doesn't, the gate is somewhere else.
5. **What does the patch tool refuse?** Check the `Write denied: ... is a protected system/credential file` error pattern. Config files, credentials, and a small set of well-known files are off-limits without explicit human authorization.

If any of those checks returns surprising state, **stop and ask** rather than proceeding on the assumption.

## When NOT to apply

- Read-only actions (skill_view, search_files, terminal commands that observe) — verification overhead doesn't pay for itself.
- Mechanical multi-step work where the substrate has been verified earlier in the same turn.
- Already-verified state — if you confirmed the active tree, the loader's allowlist shape, and the patch tool's guard in the last 5 tool calls, don't re-verify.

## Anti-patterns to avoid

- 'I know it's at `~/.hermes/...` because that's where skills_list was sourced from' — wrong. skills_list reflects HERMES_HOME, not the working directory or recent file reads.
- 'I added it to the core list, so it'll be visible' — wrong for curated toolsets. The curated list is the load-bearing allowlist.
- 'I'll just write to config.yaml' — the patch tool will refuse. Don't burn a tool call discovering this.
- 'Greg mentioned trading-stack access, so the keys are probably in env' — wrong. Verify, don't infer.
- 'The import is inside `try/except Exception: pass`, so the missing symbol won't break anything' — wrong. The `try/except` protects against *runtime* `ImportError`. The **static** linter (Pyright, mypy) still flags the import as `unknown import symbol` at parse/analysis time, blocks code review, and surfaces in CI lint output. The two layers are independent. If the import is optional, use a string-based `importlib.import_module()` or a local type alias so the static analyzer doesn't try to resolve it. If it's required, fix the missing symbol.
- **'It's in `~/cognitive-agent/*.db`'** — wrong. The cognitive-agent stack has many `*.db` paths scattered across the repo (`/Users/gregdreyfus/cognitive-agent/cognitive-agent.db`, `athena_memory.db`, `goals.db`, `hermes/athena.db`, `hermes/state.db`, `data/athena.db`, …), and most of them are **0-byte stubs** (same path the agent has been creating for years, but never actually populated). The canonical populated DB for cognitive tables (`goals`, `intentions`, `outcomes`, `self_models`, `musings`, `learned_patterns`, `metacognitive_events`, `self_improvement_cycles`, etc.) is **`/Users/gregdreyfus/athena_memory.db`** (83 MB as of 2026-06-12). Verify with `os.path.getsize()` + `PRAGMA table_list` before issuing any count or disposition query. Hermes-side data (sessions, messages, traces, kanban) lives in `~/cognitive-agent/hermes/state.db` and `~/cognitive-agent/hermes/traces.db` — these are real. The "find me a `.db` file" heuristic reliably lands on stubs.
- **Trusting a brief's self-reported count over the DB** — the morning summary cron has a documented self-reporting inaccuracy (see PLUR `[ENG-2026-0520-001]`): the brief says "15 musings" but the DB has 9, and the brief says "X goals completed" but the count is off by some other number. **Always re-pull the count from the relevant table with a SQL window matching the brief's stated window.** A 30-second `SELECT COUNT(*)` against `intentions` (filtered by `thought LIKE 'I keep circling back%'`) catches every divergence and is the difference between a ground-truth baseline and a hand-waved one. If the brief's number is the only source cited, the brief is confabulating, not measuring.
- **'The DB must be the one near the source code'** — wrong. Multiple cognitive-agent DBs live at the top of the repo (`~/cognitive-agent/cognitive_agent.db`, `~/cognitive-agent/goals.db`, etc.) but those are 0-byte files. The real one is at the *home directory root* (`~/athena_memory.db`), not in any subdirectory. The codebase has been writing to multiple path locations for years and never consolidated; `db_paths.py:resolve_db_path` normalizes `:memory:` and `file:` URIs but not the actual on-disk path. Treat any "this DB should be at X" claim as a hypothesis until `os.path.getsize(X) > 1_000_000`.
- **'Editing the on-disk file is immediately live in the running process'** — wrong, but NOT for the old reason. **(2026-06-16 correction.)** The constitution is read FROM DISK at process start by `cognitive_agent/purpose.py` (`load_purpose`/`constitution_block`), which the hermes prompt builder delegates to — so disk IS the surface; the old "separate static prompt copy that drifts from disk" no longer exists, and the obsolete `wc -c` prompt-vs-disk check is retired. The real gap is **process cache vs disk**: `purpose.py` caches each file per-process and the system prompt is built once, so a disk edit to `PURPOSE.md` / `CHARTER.md` / `RUBRIC.md` is not live in the long-running server until it **restarts**. **The check:** after amending a governing document, confirm the running process is newer than the file (`ps -o lstart=` vs file mtime), and don't claim the amendment governs behavior until a restart. "Amended" (true on disk) ≠ "live" (true after restart). See `self-audit-cognitive-autonomy/SKILL.md` "Running-Process Cache vs Disk" red flag for the full workflow.

## Verification: the 5-question preflight

Before any action that creates, writes, or asserts a fact about the substrate, answer YES to all 5:

1. Have I confirmed the active environment (HERMES_HOME, working directory, venv)?
2. Have I confirmed the target path exists and is what I think it is?
3. Have I found the load-bearing allowlist/gate the action has to satisfy?
4. Have I tested that the new thing actually surfaces in the resolved surface (not just in a list I edited)?
5. Have I checked whether the action is on the patch tool's protected-list?

A single NO means: stop, verify, then act.

## Phase-kickoff preflight: verify the data the new code path will consume

A write/assert preflight (above) protects against acting on the wrong substrate. A **phase kickoff** — turning on a new code path that reads historical data and makes decisions from it — needs an additional check: **run the new code's decision logic against the live data it will see, and verify the decision matches the design contract.** The bug class is "code does the right thing on a fresh DB but the wrong thing on the populated DB." This doesn't surface from code-reading alone; you have to feed it the data.

### When to apply

Any time you (or Greg) are about to "kick off" a new phase — a code path that starts making decisions from existing rows rather than just writing new ones. The signal in the conversation is language like "kick off phase 0b", "turn on feature X", "let the loop act on the measurements now", "ship 0b", or a greenlight on a measured-effect / preflight / rollout plan.

### The 3-step protocol

1. **Read the decision code, not just the data path.** For the new code path, find the constants that gate the decision (thresholds, cutoffs, cooldowns) and the comments/docstrings that describe the *intended* behavior. The intended behavior and the constant value are two different things — flag any divergence as a contract gap, not a typo. Example: docstring says "skip a subsystem whose last intervention was flat-or-negative" but the constant is `_NONRESPONSIVE_EFFECT = -0.02` (strict negative only). The code does exactly what the constant says; the docstring is the design intent that the constant fails to implement.

2. **Pull the live data the new path will read.** A 10-30 line SQLite query against the live DB is enough. For the SelfImprovementLoop case, `SELECT subsystem, measured_effect, last_measured_at, created_at, status FROM policy_overrides WHERE source_cycle_id LIKE 'si-%' ORDER BY last_measured_at DESC` plus `SELECT value FROM self_improvement_meta WHERE key='last_run_ts'`. Don't just count rows — print the values, because the threshold-vs-data comparison is the whole point.

3. **Simulate the decision.** For each row the new path would act on, manually apply the threshold and record what the code will do. Compare against the design intent from step 1. If they disagree on any row, the kickoff is *not* clean — surface the specific row(s) that flip and the threshold rule that misclassifies them. Don't paper over with "but the strict rule is also defensible" — that's a separate decision Greg needs to make, not an autonomous reconciliation.

### Pitfalls

- **Don't skip step 1 because the code "obviously implements the docstring."** The whole point is that it doesn't, sometimes silently via a constant chosen months ago and never revisited. Reading only the docstring is the same failure as reading only the data — both miss the gap between intent and mechanism.
- **Don't skip step 3 because the rows "look reasonable."** Manual classification is fast (10 rows) and the failure mode is silent: a subsystem that should be skipped gets re-targeted, and the next cycle's outcome doesn't surface the bug until a week later. The cost of skipping step 3 is a one-week feedback loop on a problem you could catch in 10 seconds now.
- **Don't treat the 24h measurement age gate as a "too young, ignore" exemption for the decision logic.** An override that's < 24h old is unmeasured, not non-responsive — the kickoff preflight should record it as "unmeasured, doesn't trigger a skip" rather than "skipped, can be re-targeted." Roadmap #4 in `self_improvement.py:357-365` already encodes this distinction; verify your own preflight preserves it.
- **Don't fire the kickoff before reporting the contract gap.** A "preflight passed" report on a phase whose decision logic doesn't match its design contract is completion theater. The report must include: (a) what the design intent is, (b) what the constant does, (c) which live rows misclassify under each, (d) which threshold change would reconcile them. The fix is Greg's call, not the agent's.
- **The step-3 simulation needs TWO tiers, not one.** The contract gap can hide behind a single test case. (a) *Confound tier*: feed NO real `tool_failure_condition` patterns / aesthetic data / concept scores, confirm the `_is_default_score()` guard correctly refuses to skip subsystems whose current score is the neutral default. (b) *Realistic tier*: feed the same signals the heartbeat handler actually passes (`pattern_learner.get_active_patterns()`, real `metacognition.confidence`, real `concept_confidence.falsifiability()`), confirm the skip path fires on the live-data-shaped scores. A test that only exercises the realistic tier passes even if the confound guard is missing or too aggressive. A test that only exercises the confound tier passes even if the threshold is wrong. Both are needed.
- **Ranking order is by current score, not by measurement recency.** The skip loop iterates `sorted(scores, key=lambda k: scores[k])`, so the FIRST subsystem to be considered is whichever has the lowest current score, regardless of which was most recently measured. The simulation in step 3 must record the iteration order — "concept_formation scored 0.20 → skipped, loop continues to next-lowest, which is confidence at 0.30, which is NOT in the non-responsive set, so the loop picks confidence" — not just the binary "is X skipped?" answer. The next-weakest fallback target is determined by the score ranking, not the effects ranking.
- **Verify the runtime call site, not just the decision code.** The preflight proves the *function* does the right thing on the live data shape. It does NOT prove the *runtime* calls the function with the live data shape. Read the heartbeat handler (`heartbeat_handlers.py:1074-1082` for the SelfImprovementLoop case) and confirm: (a) it feeds real patterns, not `[]`; (b) it feeds real aesthetic data, not `{}`; (c) it feeds real `concept_formation`, not `None`; (d) the heartbeat's own `should_run()` gate is satisfied. If the call site feeds default scores, the function returns "no skips" — and the agent concludes the kickoff is clean when in fact the runtime is silent. The SelfImprovementLoop 0b case (2026-07-01) had a 9.6h-old `last_run_ts` and a 7-day heartbeat cooldown: the runtime call would never fire without the heartbeat, so even a clean preflight didn't prove live behavior.

### Worked example (Phase 0b kickoff, 2026-07-01)

Goal: let `SelfImprovementLoop.diagnose()` start skipping subsystems whose last intervention was flat-or-negative.

- **Step 1 — read the decision code:** `self_improvement.py:344-378` (skip logic) and `self_improvement.py:566` (`_NONRESPONSIVE_EFFECT = -0.02`). The 344-378 docstring says "flat-or-negative"; the constant is strictly negative. **Contract gap found.**
- **Step 2 — pull live data:** `policy_overrides` shows `tool_selection` at -0.007 and -0.011 (both above -0.02), `concept_formation` at -0.056, `confidence` at +0.40. `last_run_ts` is 9.6h old, so the next `diagnose()` is gated by the 7-day heartbeat, not by the meta cooldown.
- **Step 3 — simulate the decision:** Under the strict rule, `concept_formation` is correctly skipped (-0.056 ≤ -0.02) but `tool_selection` is not (-0.007 > -0.02), even though `tool_selection` has been re-targeted 3 cycles in a row with no movement. Under the design intent ("flat-or-negative"), `tool_selection` would also be skipped, which is the entire point of 0b.
- **Report:** "Preflight caught a contract gap. Docstring says X, constant says Y. Two subsystems misclassify under Y. Threshold change options: tighten to +0.02 (reuses existing `_MEASURE_FLAT_BAND` constant), or keep strict and document the asymmetry. Kickoff is **not** clean until Greg picks one."

See `references/phase-kickoff-preflight-self-improvement.md` for the full transcript (live query, classification table, threshold options, and the rationale for not firing the kickoff automatically).

## Reporting kickoff results

A phase kickoff is not a tick in a todo list — it has three honest outcomes:

1. **Clean** — design intent matches mechanism matches live data. Report one line: "Preflight clean. Threshold X produces the expected Y on all Z rows." Proceed.
2. **Contract gap** — design intent and mechanism disagree. Report the specific rows that misclassify and the threshold options. Do not proceed. Greg decides.
3. **Live-data surprise** — mechanism is fine but the data is not what the design assumed (e.g. an override is < 24h old, an unmeasured active row sits next to measured ones). Report the specific data state and let Greg decide whether the kickoff can proceed or needs a data-cleanup step first.

Reporting "kicked off" without one of these three is completion theater.

## Relationship to existing skills

- `verify-before-declaring-outage` — the **outage** variant. Use that one for 'the system is broken' / 'X is dead' claims. Use this one for 'I have X' / 'X is at path Y' / 'I should write to Z' claims.
- `substrate-first` — the **provisioning** variant. Use that one for 'should I build or ask for' questions. Use this one for 'where exactly do I build/ask-for' questions.
