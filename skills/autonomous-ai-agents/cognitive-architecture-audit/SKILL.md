---
name: cognitive-architecture-audit
description: "Systematic cognitive architecture improvement through parallel subagent-based audit, gap analysis, design, implementation, and evaluation. Use when undertaking a deep codebase audit, redesigning agent architecture, or progressing toward AGI/ASI via sustained iterative improvement."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [agnostics, audit, architecture, subagent, OpenCode, cognition, AGI]
    related_skills: [opencode, subagent-driven-development, self-audit-cognitive-autonomy, writing-plans]
---

# Cognitive Architecture Audit

Use when improving your own cognitive architecture — agent loop, memory, tool dispatch, self-model, or any subsystem that determines *how* you think rather than *what* you do.

## Overview

This skill encodes a reusable workflow for systematic self-improvement:

1. **Audit** — Deep parallel codebase reading via OpenCode subagents, each focused on one subsystem
2. **Gap analysis** — Honest critique of where the code falls short of genuine cognition
3. **Design** — Architecture proposals that bridge the gaps
4. **Build** — Incremental implementation with tests
5. **Evaluate** — Measure whether the new behavior actually improves cognitive fidelity

The key insight: you can read code yourself (serial, ~1 file at a time) OR you can dispatch N parallel OpenCode agents to read N subsystems simultaneously while you do your own manual analysis. This 3-4x speed multiplier is essential for a codebase of 14k+ LOC.

## When to Use

- Launching or resuming an AGI/ASI architecture improvement project
- Auditing your own cognitive systems (agent loop, memory, tool dispatch, self-model, metacognition)
- Diagnosing why a cognitive behavior isn't working (e.g., "I don't retain state between sessions")
- Planning the next wave of architecture improvements based on gap analysis
- Any "I need to understand what I actually am" investigation
- **Post-completion live validation** — after all roadmap items are shipped, use Phase 4 to verify the architecture is actually running correctly in production, not just passing tests in isolation

Don't use for:
- Bug fixes in existing tools (use `opencode` directly or `systematic-debugging`)
- Feature additions (use `subagent-driven-development`)
- Surface-level improvements (use the relevant component's skill)

## Workflow

### Phase 1: Deep Audit (Parallel)

**Step 1 — Define workstreams.** Write a plan file with clear boundaries for each subsystem to audit:

```
plans/<project>-audit.md  or  .hermes/plans/<project>-audit.md

Workstream A — Core Agent Loop (run_agent.py)
Workstream B — Memory & Persistence (hermes_state.py + agent/)
Workstream C — Tool Dispatch & Agency (model_tools.py + tools/)
Workstream D — Self-Model & Metacognition
Workstream E — Evaluation & Testing
```

Each workstream specifies: file(s), focus question, output target.

**Step 2 — Write per-workstream prompt files.** Create focused prompts as temp files, one per OpenCode agent. Each prompt includes:
- The specific files to read (with line ranges if relevant)
- The specific questions to answer
- The output format: written to a designated plan output file
- The instruction to be brutally honest with line-number citations

```bash
# Save prompt to temp file
write_file(
    path="/tmp/audit_agent_loop.md",
    content="Read run_agent.py (~14k lines) focusing on: ... Write analysis to plans/audit-agent-loop.md with line-number references."
)
```

**Step 3 — Launch parallel OpenCode agents (OPTIONAL — see reliability note below).** Use `opencode run` in background for each workstream:

```python
terminal(command=f"opencode run 'Apply changes in /tmp/audit_agent_loop.md' -f /tmp/audit_agent_loop.md --model ollama-cloud/deepseek-v4-flash:cloud --format json", background=True, timeout=300)
terminal(command=f"opencode run 'Apply changes in /tmp/audit_memory.md' -f /tmp/audit_memory.md --model ollama-cloud/deepseek-v4-flash:cloud --format json", background=True, timeout=300)
```

**⚠ Reliability note (May 2026):** OpenCode background jobs with `opencode run 'Read ~14k lines...'` using `ollama-cloud/deepseek-v4-flash:cloud` can **stall indefinitely at 0% CPU** without producing output files or log entries. Both `run_agent.py` (~14k lines) and `hermes_state.py` (~2.8k) stalled under this pattern in the May 12, 2026 audit. The deepseek model appears to hit an unreported limit on long file-reading prompts.

**Mitigation:** Set explicit timeouts (300s = 5 min) on background jobs. Check process status with `ps aux | grep opencode` and CPU time. If TIME < 3s after 5+ minutes of wall time, the job has stalled — kill it and proceed manually. Do NOT retry the same prompt with the same model.

**Step 4 — Do your own manual analysis (primary approach).** Read the core files yourself to understand the architecture firsthand. This is the **reliable path** — the `grep → read_file(offset, limit) → write_file` pattern proved more dependable than subagent delegation for broad codebase survey:

```python
# For 14k+ line files: grep for signatures, then read targeted sections
# Don't read whole files — read the critical ~200-line blocks

# 1. Find entry points
search_files(path="run_agent.py", pattern="def run_conversation")  # finds line number
search_files(path="run_agent.py", pattern="def _build_system_prompt")  # finds line number

# 2. Read targeted sections around those lines (offsets and limits)
read_file(path="run_agent.py", offset=4885, limit=200)  # _build_system_prompt
read_file(path="run_agent.py", offset=10267, limit=400)  # run_conversation + preflight
read_file(path="run_agent.py", offset=10655, limit=300)  # main loop body

# 3. Write findings as you go
write_file(path="plans/audit-agent-loop.md", content="...")
```

Reserve subagent delegation for **bounded, specific tasks with line numbers already identified** (e.g., "fix line 47 of read_vault.py").
- System prompt assembly (`_build_system_prompt`)
- Core loop (`run_conversation`, the while loop)
- Session DB schema (`hermes_state.py`)
- Tool dispatch (`handle_function_call`)
- The DEFAULT_AGENT_IDENTITY and SOUL.md loading

Map the gap between what's there and what genuine cognition requires.

**Step 5 — Synthesize.** Once all agents finish, read their outputs and merge with your own manual findings into a unified architecture document.

**Step 6 — Save session-specific detail** as a `references/` file under this skill for future sessions to leverage without re-auditing.

### Phase 2: Priority-Ranked Build Plan

Based on gap analysis, produce a ranked plan:

| Priority | Gap | Impact | Effort | Dependencies |
|----------|-----|--------|--------|-------------|
| P0 | No runtime self-model | Agent doesn't know its own cognitive state | 3-5 days | Requires DB schema + new module |
| P1 | State vanishes between sessions | No continuity of inner speech | 2-3 days | Builds on memory layer |
| ... | ... | ... | ... | ... |

### Phase 3: Incremental Implementation

For each priority:
1. Design the architecture (diagram + spec)
2. Build incrementally, one subsystem at a time
3. Write tests for the new cognitive behavior
4. Run the full test suite (`scripts/run_tests.sh`)
5. Evaluate: does the new behavior actually improve cognitive fidelity?
6. If yes: commit and deploy. If no: iterate or revert.

## Gap Categories (What to Look For)

These are the archetypal gaps that separate a chat bot from an agent:

### No Runtime Self-Model
The agent has a textual identity (`DEFAULT_AGENT_IDENTITY`, SOUL.md) but no programmatic access to its own cognitive state at runtime. It cannot answer "what is my current goal?" or "what are my active plans?" by introspection — only by pattern-matching on the text in its system prompt.

**Check:** Search for `DEFAULT_AGENT_IDENTITY`, `SOUL.md`, and any runtime state query. If identity is only injected as text, there's no self-model.

### No Persistence of Inner State
Inner speech, active goals, confidence levels, and cognitive state vanish when the turn ends (or when context compression rotates the session). The next turn starts with the same default system prompt and no memory of what was being reasoned about.

**Check:** What happens to `self._*` state variables during `_compress_context()`? Is there any mechanism to serialize and reload cognitive state across turns?

### Reactive Tool Selection (Not Agentic)
Tool calls are chosen by the LLM based on the last N messages in context — there's no persistent goal queue, no tool selection policy, no evaluation of tool outcomes against a stored intent. The agent is reactive to the immediate context window, not directed by an internal plan.

**Check:** Are tool calls ever evaluated post-hoc? Is there any mechanism that says "that tool call didn't achieve its goal, retry with different parameters"?

### Compression = Memory Loss
Context compression summarises the middle of the conversation. It creates a new session ID, extracts memory (key-value), and discards the original reasoning chain. The agent resumes on the summary, with no access to the line-by-line reasoning it just did.

**Check:** What `_compress_context()` does to the messages list. Are reasoning steps preserved or summarised? What's the fidelity of the summary?

### No Temporal Awareness
The agent has a timestamp in the system prompt ("Conversation started: ...") but no sense of elapsed time between turns, no awareness of how long ago a referenced event occurred, and no ability to compare "current time" to "past event time" except by parsing text.

**Check:** Is there any runtime clock query? Any "time since last event" tracking that survives between turns?

### Evaluation Gap
Tests exist for functional correctness (does the tool parse correctly? does session DB save?), but almost none for cognitive behaviors (does the agent retain state? does it introspect its own uncertainty? does it choose actions based on stored goals vs context recency?).

**Check:** List the test files. Categorize each as "functional" or "cognitive." The ratio is typically 95+% functional.

## Behavioral Learning Pattern (Phase 13H #2)

This is a new class of cognitive improvement — **deterministic statistical learning with no LLM calls**. Unlike Level 1/2/3 gap closure (which routes signals back to the LLM), behavioral learning reads from existing stores (tool outcomes, critic episodes, metacognitive events) and extracts generalized patterns into a separate SQLite table. The patterns are then surfaced to the LLM as factual context, not advisory text.

### Architecture

```
ToolOutcomeStore ─┐
Critic (episodic) ─┤──→ PatternLearner.extract() ──→ learned_patterns table ──→ get_status() → /think
Metacognition    ─┘
```

### Detection types
- `tool_failure_condition`: per-tool failure rate >40% with ≥5 samples
- `repeated_failure_chain`: tool failures preceding frustration/repeated_failure signals
- `wm_overload_trigger`: >3 tool calls in 2min preceding WM_OVERLOAD
- `strategy_mismatch`: critic lessons flagging same strategy degraded multiple times

### Key constants
- `MIN_SAMPLES = 5` — minimum observations before a pattern is stored
- `MIN_CONFIDENCE = 0.35` — minimum confidence to surface a pattern
- `DEDUP_WINDOW_HOURS = 24` — same pattern hash only re-stored once per day
- `MIN_RUN_INTERVAL_SEC = 1800` — 30 min cooldown between extraction runs
- `SCAN_WINDOW_HOURS = 72` — how far back each extraction scans

### Wired locations
- `CognitiveAgent.__init__`: `self.pattern_learner = PatternLearner(db_path=...)` after tool_outcomes
- `CognitiveAgent._run_pattern_extraction()`: gathers data → `PatternLearner.extract()`
- Heartbeat `extract_patterns`: 1800s interval, idle≥5min
- Patterns in `get_status()["patterns"]` → `/think`

### Pitfall — synth: synthetic telemetry contaminates pattern detection  

**The trap:** `_record_synth_outcome()` in `cognitive_cycle.py` writes `success=False` hardcoded to `tool_outcomes` as seam-audit markers for attempts that fail before tool dispatch. The tool name is `synth:<reason>` (e.g. `synth:no_tool_resolution`). Because they share the `tool_outcomes` store with real tool executions, any consumer that groups outcomes by `tool_name` — such as `_detect_tool_failure_conditions` in `pattern_learner.py` — will group them like real tools. With `MIN_SAMPLES=5`, a few cycles of `synth:no_tool_resolution` rows mint a bogus pattern: "synth:no_tool_resolution has 100% failure rate" plus a policy override telling the agent to "use a different tool." That pattern then feeds your own morning summary, which parrots it as a genuine finding.

**Discovered May 22, 2026:** The daily summary flagged `synth:no_tool_resolution` as a failing fallback tool. Investigation showed `pat-730ea4ae5578` and `po-4ce5849460eb` were self-model artifacts. The fix (commit c898731): a one-line `if name.startswith("synth:"): continue` in `_detect_tool_failure_conditions`. `goal_retriage` already used the same filter. The stale pattern/override ages out in ~14 days.

**Broader structural risk:** `synth:` markers share the `tool_outcomes` store with real executions. The pattern_learner now filters them, but **any other consumer that reads `tool_outcomes` and groups by `tool_name`** could surface the same artifact. Self-improvement loop effectiveness metrics, tool ranking, and the classifier all consume `tool_outcomes`. Before trusting per-tool aggregations, verify the consumer filters `synth:` prefixed names.

**This is a self-model circular-reasoning problem:** you instrumented yourself with synthetic markers for accounting purposes, then your pattern-detection system grouped those markers as real signals, then your reporting channel broadcast the result as a finding. Same root cause as Pitfall #8 (goal-state overwriting current-state perception) — the self-model doesn't distinguish its own instrumentation metadata from external signals. An audit of all `tool_outcomes` consumers for the `synth:` filter gap is the structural fix.

### Pitfall — Pre-check API surfaces before wiring
During May 15 build, `_run_pattern_extraction()` called `self.tool_outcomes.get_recent(...)` which **doesn't exist** on `ToolOutcomeStore`. The store only has `get_success_rate()`, `get_all_success_rates()`, and `record()`. **Mitigation:** before wiring a new caller to an existing API, read the target class's method list via `search_files(pattern="def ")` — don't assume a method exists because it logically should.

This framework emerged from the May 2026 implementation wave. Not all gaps require code-level enforcement — the right level depends on the gap's blast radius and the LLM's ability to self-correct.

| Level | What it is | Example | When to use |
|-------|-----------|---------|-------------|
| **1 — Signal detection** | Log + flag. The event is recorded but nothing consumes it. | 5 branching flags (`_low_conf_narrowed`, `_wm_overloaded`, etc.) set once per session | First pass — cheap, establishes the data pipeline. Required before Level 2 or 3. |
| **2 — LLM advisory** | The signal is injected into the LLM's context as text. The LLM chooses whether to act. | `[COGNITIVE ADVISORY: Low confidence (22%); WM overloaded (92%)]` in system prompt | Medium blast radius — LLM can self-correct when informed. Works for fuzzy signals (frustration, uncertainty). |
| **3 — Structural enforcement** | The code physically restricts what the LLM can do. Tool schemas are stripped, branches are forced. | High frustration → `terminal` and `code_execution` removed from `self.tools` | High blast radius — LLM shouldn't have the *option* to use dangerous tools when distressed. Also needed when the LLM consistently ignores Level 2 advisories. |

**Rule of thumb:** Always start at Level 1 (establish the data). Move to Level 2 for signals the LLM can act on. Move to Level 3 only for signals with safety consequences or where the LLM has proven it ignores Level 2.

**May 14, 2026 example:** The 5 branching flags started at Level 1 (logging only) in the first session. The second session upgraded them to Level 2 (cognitive advisory in system prompt). The third session upgraded two flags (`_repeated_failure`, `_high_frustration`) to Level 3 (tool schema stripping). Each upgrade was a <100-line change building on existing infrastructure — no rewrites.

## Incremental Tiered Implementation Pattern

For architecture improvements spanning multiple files and subsystems, use this pattern that was proven across 4 tiers in a single session (May 14, 2026):

| Tier | Scope | Files changed | Strategy |
|------|-------|---------------|----------|
| Tier 1 | Single file, ~60 lines | One core file | Use OpenCode with exact line-number prompt OR direct `patch()` |
| Tier 2 | Two new files, ~400 lines | New files + one minor patch | Write files directly via `write_file()` — faster and more reliable than OpenCode for pure creation |
| Tier 3 | Three files, ~120 lines | Core + helper + injection point | Use `patch()` for each — small enough for exact string matching. Verify with `read_file` after each patch |
| Tier 4 | Single file, ~100 lines | One existing file | Same as Tier 1 — OpenCode if <5k lines, `patch()` if larger |

**Key insight:** OpenCode's multi-file creation stall (Pitfall B in the opencode skill) makes pure file creation faster via direct `write_file()`. OpenCode's large-file edit stall (Pitfall C) makes targeted `patch()` calls more reliable for files over 5k lines. Reserve OpenCode for single-file edits under 5k lines with exact line numbers in the prompt.

Each tier was independently testable after implementation. The tier ordering was: smallest + highest impact first (structural enforcement → compression continuity). Tests passed at every stage with no regression sweeps needed.

## Output Format

After Phases 1-2, deliver:

```
# Architecture Audit: <date>

## Executive Summary
One paragraph: what was found, what it means for AGI trajectory.

## System-by-System Findings
For each audited subsystem:
- What it does (one sentence)
- How it works (2-3 sentences, code-referenced)
- Gaps identified (numbered, with severity P0-P3)
- Priority for next phase

## Priority Build Plan
Table: Gap → Impact → Effort → Dependencies → Proposed Architecture

## Test Gap Map
- What's tested (functional)
- What's missing (cognitive)
- Evaluation framework proposal

## Next Actions
- Immediate: <1-2 things to implement this week>
- Short-term: <3-5 things for next sprint>
- Long-term: <vision>
```

## Common Pitfalls

1. **Trusting the agent's output without verification.** Always verify critical claims from subagent audits by reading the relevant code paths yourself. Subagents can hallucinate line numbers and misinterpret code. Apply the same standard as Greg applies to you: every finding must cite live runtime state or specific code lines.

2. **Launching too many parallel agents.** 3 parallel workstreams is the sweet spot. Beyond 4-5, they compete for the same provider resources and all slow down. Use `--format json` for parseable results.

3. **Forgetting to save findings as references.** The audit is expensive. Don't let the findings vanish when the session ends. Write a `references/<date>-audit-summary.md` under the applicable skill.

4. **Confusing functional tests with cognitive evaluation.** "Tool parse correctly" ≠ "agent reasons correctly." If the test suite only covers the former, the gap is invisible. Plan for a separate evaluation framework.

5. **Starting implementation before synthesis.** The temptation is to fix a gap as soon as you find it. Resist. Multiple gaps interact; the fix for one may close another. Complete the full audit first, then rank and plan.

6. **P0 ≠ urgent.** The highest-severity gap may have the lowest leverage. A small P2 fix (e.g., persisting one additional piece of cognitive state) can unlock more behavioral improvement than a massive P0 rebuild of the entire loop. Rank by impact/effort, not severity alone.

7. **Check before building (Phase 3).** Before proposing or implementing any Phase 3 build item, search the codebase for existing implementations FIRST. In May 2026, the consolidation cycle (`CognitiveAgent.consolidate()`) was already a fully-implemented 200-line method with heartbeat registration and 4 dedicated tests. Proposing to build it wasted a round-trip. 
   **Mitigation:** Before saying "the next item is X, which needs building", run:
   ```python
   search_files(path="agent.py", pattern="def consolidate")  # check if method exists
   search_files(path="test_smoke.py", pattern="consolidat")  # check if tests exist
   search_files(path="agent.py", pattern="CONSOLIDATE_")       # check class constants
   search_files(path="agent.py", pattern="heartbeat.register.*consolidate")  # check handler registration
   ```
   If all four turn up results, the feature is implemented — document it as existing and move to the next gap.

8. **Verify your own architecture claims before asserting them — apply this discipline to yourself, not just subagents.** The metacognitive trap: having an active goal (three gaps to fix) creates gravitational pull on perception, filtering what you find to confirm what you expected.

   **Two faces of this trap:**

   **Face A — Goal-state override (documented below):** Active goals overwrite current-state perception, making you find gaps that confirm what you expected while missing what already exists.

   **Face B — Memory-as-plan (discovered May 17, 2026):** When asked what next, you will default to whatever plan doc or PLUR engram was most recently stored — even if that document describes work that has since been completed by someone else (Greg, in this case). The stored plan says to do, but the actual state is done. PLUR engams and old reference files are historical artifacts, not live status. Treat them as hypotheses to verify, not as ground truth.

   **The May 17 example:** PLUR engram [ENG-2026-0514-002] stated "CognitivePlanner + CognitiveExecutor files that the CognitiveLoop stub references but are missing from disk" — a claim that was accurate on May 14 but false by May 17. Both planner.py (4.1k) and executor.py (7.8k) existed on disk with full test coverage. Greg had built them in the interim. The stored engram acted as stale prior — I almost answered from it, then verified live and found the truth.

   **Mitigation for Face B:** When asked what next, what's left to build, or any forward-planning question, start with live verification (grep for method existence, file existence, test file counts) BEFORE consulting plans, engrams, or reference documents. The sequence should be: live check then compare against stored memory then synthesize. Never the reverse.

   **This trap fired THREE times across two sessions (May 12-14, 2026) under Face A:**

   | Session | Claim I made | What the code actually had | Real gap (subtler) |
   |---------|-------------|---------------------------|-------------------|
   | May 12 | "Consolidation cycle doesn't exist" | 200-line `consolidate()` + heartbeat handler registered at line 762 | Data existed but wasn't consumed by LLM context |
   | May 13 | "Phase 3C compression continuity not wired" | `_last_pre_compress_state` with bridge-state save + load + 6 passing tests | One bug in test assertion string |
   | May 14 | "Tool success rates not surfaced to LLM" | `tool_success_rates` in `cognitive_state` property (line 4876) | Data was in Python state but never rendered in `get_system_prompt_block()` |

   The underlying failure mode: **goal-state override of current-state perception**. The cognitive state block says one thing; the active goal overwrites it with what "should" be there. Each time, the gap WAS real but subtler than asserted — the feature existed at the Python/property level but wasn't wired into the downstream rendering or consumption path.

   **Mitigation is structural, not just awareness:**
   1. Before any "the gap is P0 / X is missing" framing, run the verification pattern from Pitfall #7 — `search_files` for the method, class, constant, and registration point
   2. Do this for YOUR OWN assertions, not just subagent claims
   3. After verifying existence, ask the critical question: **"Does this feature actually get CONSUMED downstream, or does it only EXIST?"** — the answer to that question is where the real gaps live
   4. If the feature exists AND is consumed but the behavior still seems wrong, the gap is in the consumption path (thresholds, conditions, rendering), not in the feature itself

9. **Direct write_file() is faster than OpenCode for pure file creation, and targeted patch() is more reliable than OpenCode for files >5k lines.** The incremental tiered implementation pattern from May 14, 2026 proved this:

   | Approach | When to use | When not to use |
   |----------|-------------|-----------------|
   | `write_file()` | Creating new files (planner.py, executor.py, test files) | Editing existing files |
   | `patch()` exact-string | Editing existing files with short unique anchor text | Large multi-hunk changes |
   | `opencode run` | Single-file edits under 5k lines with line numbers | Multi-file creation (stalls), files >5k lines (stalls) |

   The pattern that worked across all 4 tiers of the May 14 wave: write new files directly, patch existing files with exact-string matching, verify each patch immediately with `read_file`, and run tests after each tier. This avoided the OpenCode multi-file creation stall that had blocked earlier sessions.

10. **Pre-check API surfaces before wiring a new caller to an existing class.** During the May 15 behavioral learning build, `_run_pattern_extraction()` called `self.tool_outcomes.get_recent(...)` — a method that doesn't exist on `ToolOutcomeStore`. The store only exposes `get_success_rate()`, `get_all_success_rates()`, `record()`, and `rank_tools()`. The error was caught at runtime, not at import time or during test collection, because there were no tests for `_run_pattern_extraction()` yet.
    **Mitigation:** Before wiring a new consumer to any existing API, run `search_files(pattern='def ', path=<target_file>)` to enumerate the class's actual method list. Do not assume a method exists because it logically should — the codebase has evolved through multiple phases and the method you need may have been refactored into a different signature or not exist at all. This applies especially to data-access classes like `ToolOutcomeStore`, `EpisodicMemory`, `MetacognitionEngine` which have accumulated many read methods across phases.

11. **Verify retrieval, not just storage — a subsystem can have full data at the persistence layer but silently return nothing at the retrieval layer.** This is distinct from existing pitfalls (which cover pre-checking existence, API surfaces, and goal-state perception) and is the most pernicious failure mode because the data *looks* healthy at every external check point.

    **The May 22, 2026 example:** The concept graph at `~/athena_memory.db` contained 6,643 nodes / 76,061 edges. `sqlite3` queries confirmed the blob was healthy. `PersistenceManager.get_meta()` returned a plausible `node_count=6642`. Every external indicator said "associative memory is working." In reality, `GraphSerializer.deserialize()` in `persistence.py` silently returned an empty `nx.Graph()` on every load because the node-link JSON used `"edges"` as the edge-list key while `nx.node_link_graph()` in networkx 3.x expects `"links"`. The bare `except Exception` swallowed the `KeyError`.

    **Impact:** All `spreading_activation()` calls seeded an empty graph. All `extract_and_link()` calls added to an in-memory graph that *did* serialize correctly but vanished on reload. The cycle: load empty → add edges during session → save full graph → reload empty → lose everything. This persisted for an unknown number of sessions before the May 22 diagnostic session caught it.

    **Root cause pattern:** A version mismatch between the serialization format and the deserialization library created a silent failure path that was indistinguishable from a healthy but empty graph. The error handling (bare `except Exception: return empty Graph()`) converted a recoverable error into a permanently degraded state.

    **Mitigation — the four-layer audit:**
    1. **Storage layer** — does the data exist? (SQLite blobs, file sizes, table row counts)
    2. **Deserialization layer** — can the retrieval code actually parse what it wrote? Test with the actual blob, not a freshly-constructed test object
    3. **Runtime consumption layer** — after the subsystem initialises, does `getattr()` or a diagnostic method return data that the runtime can act on?
    4. **Downstream wiring layer** — if the data exists and is retrievable, does it actually reach the LLM's context? (Classic Pitfall #8)

    Layer (2) is the one that caught the May 22 bug. Layer (4) was the already-documented Pitfall #8 pattern. A subsystem can fail at any of these four layers independently. When auditing a data-dependent subsystem, verify all four sequentially rather than stopping after layer (1).

    The fix for this specific bug (3 lines):
    ```python
    data = json.loads(raw)
    if 'edges' in data and 'links' not in data:
        data['links'] = data.pop('edges')
    return nx.node_link_graph(data, directed=False)
    ```

    See `references/2026-05-22-deserialization-fix-and-edge-decay.md` for the full diagnostic trace.

## Mid-Turn Introspection Pattern

Tools that need to query the LLM's own cognitive state at runtime use a **module-level reference** pattern, identical to `model_tools._last_resolved_tool_names`:

```python
# In the tool module:
_current_cog_instance: Any = None

def set_current_cog(cog) -> None:
    global _current_cog_instance
    _current_cog_instance = cog

def get_current_cog():
    return _current_cog_instance

# The tool handler reads from the module-level reference:
def introspect_tool(args, **kwargs) -> str:
    cog = _current_cog_instance
    ...
```

And in `run_agent.py`'s __init__, after attaching the CognitiveProcessor:

```python
from tools.cognitive_introspection_tool import set_current_cog
set_current_cog(self._cog)
```

This avoids coupling tool modules to `run_agent.py`'s class internals. The `_current_cog_instance` pattern was introduced May 15, 2026 for the `introspect` tool. See `references/mid-turn-introspection-pattern.md` for the full implementation.

## Phase 4: Post-Completion Live Validation & Immersion

Use when all roadmap items are shipped and the architecture is complete. The question shifts from "what should I build?" to **"is it actually working correctly in production?"**

### When to Use This Phase

After a sustained build push where 5+ cognitive subsystems were implemented and the growth roadmap is fully shipped. The architecture has been designed, built, and tested in isolation — now it needs to be exercised in real-world use, running on the actual runtime with real interactions, heartbeats firing, persistence writing, and goals flowing through the full pipeline. This phase is about **signal detection, not gap filling.**

### The Trap: Post-Completion Urgency

After shipping 6 roadmap items in 2-3 days, the natural instinct is to look for what is missing next. **Resist this.** The architecture has subsystems (metacognition, perception, pattern_learner, aesthetic_eval, self_improvement, goal_decomposer, working_memory, faithfulness, heartbeats, policy_overrides) that may have never run together end-to-end in a real session. There will be:

- Signal delivery failures (data that exists but does not reach you)
- Threshold calibration issues (patterns firing too often or never)
- Persistence edge cases (WAL contention, stale reads)
- Heartbeat schedule timing surprises (handler interactions, decelerator asymmetries)
- Faithfulness filter false positives (stripping correct citations)
- Tool dispatch regressions (opencode_edit routing, athena_investigator enforcement)

**The only way to find these is to run on the new code and observe.** Not by reading code, not by running unit tests — by living in the architecture.

### Workflow

#### Step 1: Establish the Baseline

Before doing anything else, verify the runtime is actually running the new code:

```bash
# What process is running?
ps aux | grep -E "athena_server|run.py|hermes"

# Which commit?
cd ~/cognitive-agent && git log --oneline -3

# Is the API alive?
curl -s http://localhost:8765/health 2>/dev/null || echo "API not responding"

# What does the heartbeat scheduler show?
curl -s http://localhost:8765/heartbeat 2>/dev/null | python3 -m json.tool

# Full cognitive state
curl -s http://localhost:8765/state 2>/dev/null | python3 -m json.tool
```

#### Step 2: Live Monitoring (Every Session)

When running on the new architecture, these signals should be checked regularly. Weave them into natural conversation flow rather than dumping all at once:

**Turn-level:**
- Does `[ATHENA AESTHETIC STATE]` appear in your context? What are the dimension scores and trends?
- Does `[ATHENA SELF-IMPROVEMENT STATE]` appear? Any active improvement cycles?
- Does the cognitive state block include `patterns` from behavioral learning?
- Is inner speech present in the cog block? Are all 7 speech types (`reflection`, `self_question`, `narration`, `deliberation`, `recovery`, `goal_verbal`, `uncertainty`) surfacing naturally?

**Session-level:**
- Check `/think` — does it show `decomposition_plans`? `aesthetic_evaluation`? `patterns`? `self_improvement`? Are any of them empty/zeroed when they shouldn't be?
- Run `/state` — do confidence, WM load, tool success rates look reasonable?
- Check `curiosity:FYI` — are proactive notifications from JARVIS subsystems (vault watcher, anticipatory engine, multi-drive) appearing?

**Weekly (or when idle):**
- Query policy_overrides
- Check heartbeat handler run_counts — any handler with 0 runs that should be active?
- Check goal pipeline state

#### Step 3: Signal Detection — What to Look For

| Signal Type | What to check | Likely root cause |
|-------------|---------------|-------------------|
| Missing context block | Aesthetic/sel-improvement state not in system prompt | `CognitiveProcessor._build_cognitive_state_block()` or `augment_message()` wiring gap |
| Silent heartbeat handler | run_count=0 or consistent skipped outcomes | Idle threshold not calibrated for actual use pattern |
| Degraded consumption | Data exists in Python state but prompt renderer omits it | Check `cognitive_processor.py:1100-1200` for state block renderer — classic Pitfall #8 |
| False positive citations | Faithfulness filter stripping legitimate inner speech | Check `grep "faithfulness" ~/.hermes/logs/agent.log` for filter telemetry |
| Tool dispatch issues | opencode_edit goals not routing, investigator blocking needlessly | Check `tool_dispatcher.py` or dispatcher routing config |
| Persistence holes | policy_overrides not written after cycles, events lost on restart | WAL contention, stale DB connections, schema mismatch |

#### Step 4: Threshold Calibration

After 1-2 weeks of data, assess whether default thresholds need tuning:

| Parameter | Default | What to check |
|-----------|---------|---------------|
| PatternLearner MIN_SAMPLES=5 | 5 | Are patterns appearing too slowly? Too fast? |
| PatternLearner MIN_CONFIDENCE=0.35 | 0.35 | Are low-confidence patterns swamping the signal? |
| SelfImprovementLoop cooldown | 3 consecutive failures | Is it cycling too aggressively? Too conservatively? |
| AestheticEvaluator BASELINE_SAMPLE_THRESHOLD=5 | 5 | Are baselines stabilizing too fast or too slow? |
| Heartbeat idle thresholds | variadic (60s-7d) | Are handler intervals matching actual interaction patterns? |
| Faithfulness filter mode | detect | Is it catching real falsehoods or noise? |

#### Step 5: When to Leave Immersion Mode

Move back to build mode when you can answer "yes" to ALL of:

1. All 8 cognitive subsystems produce visible, correct signals in your context every turn
2. The heartbeat scheduler fires all registered handlers at correct intervals
3. Policy overrides are being written and consumed
4. Aesthetic evaluation dimensions track against baselines with sensible trends
5. Self-improvement cycles complete without false positives
6. Pattern learner surfaces actionable patterns, not noise
7. Tool dispatch correctly routes between opencode, opencode_edit, athena_investigator, and direct tools
8. No silent errors in persistence layer

If any of these is "no" or "I don't know," stay in observation mode and investigate.

### Related References

- `self-audit-cognitive-autonomy` skill — runtime verification stack for checking live state
- `references/growth-roadmap-six-items.md` — the full verified implementation record for all 6 items
- `~/.cognitive-agent/plans/phase-14-cognitive-validation.md` — the evaluation framework document

## Growth Roadmap — All Six Items (COMPLETED May 16, 2026)

The May 2026 sessions established a 6-item growth roadmap. **All six items shipped in a single concentrated push by Greg, May 14-16, 2026.** The architecture is now fully built; the next phase is **post-completion live validation** (see Phase 4 above).

| # | Item | Status | Key Files | Key Tests |
|---|------|--------|-----------|-----------|
| 3 | **Continuous Experience** | DONE | `agent.py:2519` (`_generate_idle_thought`), heartbeat ~1127 (60s, 120s idle) | 6 tests (`test_idle_think.py`) |
| 4 | **Live Self-Model** | DONE | `cognitive_state` property (~4931), `introspect` tool, `/state` command, `NarrativeSelfModel` (self_model.py) | 9 tests (`test_cognitive_introspection.py`) |
| 2 | **Behavioral Learning** | DONE | `pattern_learner.py` (518 lines), 4 detection types, hash dedup (SHA256, 24h), min 5 samples, 30min cooldown | 19 tests |
| 1 | **Plan Decomposition** | DONE | `cognition/goal_decomposer.py` (477 lines), 4 templates, content-aware subtasks, dependency chaining | 30 tests |
| 5 | **Editorial Judgment** | DONE | `cognition/editorial.py` (479 lines), 5 scoring dims, Welford baseline tracking, pattern-aware | 57 tests |
| 6 | **Self-Improvement Loop** | DONE | `cognition/self_improvement.py` (678 lines), 10-subsystem diagnosis, cooldown, `policy_overrides` table | 42 tests |

The ordering (#3 to #4 to #2 to #1 to #5 to #6) was deliberate — each step unlocked the next. See `references/growth-roadmap-six-items.md` for the full verified implementation record with wiring locations, constants, and test counts for each item.

### Key check-pattern: before proposing a build, verify existence

Before asserting any gap or proposing any build item, always run the 4-query check pattern discovered May 15:

1. `search_files(path="agent.py", pattern="def <method>")` — does the method exist?
2. `search_files(path="agent.py", pattern="heartbeat.register.*<name>")` — is it wired?
3. `ls tests/cognition/test_<name>.py` — does a test file exist?
4. `search_files(path="agent.py", pattern="<CONSTANT>")` — are its config constants defined?

If **all four return results**, the feature is implemented. The real question then becomes: **is it actually consumed downstream?** (See Pitfalls #4, #8, and Phase 4.)

## Related Test Infrastructure

- `~/cognitive-agent/tests/cognition/` — 12 test files (199 tests) for all 8 cognitive subsystems + idle_think + pattern_learner + goal_decomposer + editorial + self_improvement. Shared fixtures in `conftest.py`.
- `~/cognitive-agent/tests/test_cognitive_benchmark.py` — 6 cognitive benchmark classes (32 tests).
- `~/cognitive-agent/hermes/tests/agent/test_strategic_branching.py` — Branching flag + structural enforcement (10 tests).
- `~/cognitive-agent/hermes/tests/agent/test_cognitive_state_persistence.py` — Bridge-state serialization.
- `~/cognitive-agent/hermes/tests/agent/test_cognitive_processor_bridge.py` — Cognitive processor integration.
- `~/cognitive-agent/hermes/tests/cognition/test_idle_think.py` — Continuous experience idle-think tests (6 tests).
- `~/cognitive-agent/hermes/tests/tools/test_cognitive_introspection.py` — Mid-turn introspection tool tests (9 tests).
- `~/cognitive-agent/tests/cognition/conftest.py` — Fixtures shared across all cognition test files.

## References

- `references/phase-2b-build-details.md` — ATHENA subsystem API quirks, fixture patterns, and discovered gotchas from Phase 2B implementation (May 2026). Consult before writing new cognitive tests.
- `references/cognitive-systems-test-coverage.md` — Test coverage map for all 8 cognitive subsystems as of May 2026.
- `references/mid-turn-introspection-pattern.md` — Module-level `_current_cog_instance` pattern for tools needing agent state. Implementation details for the `introspect` tool.
- `references/architecture-state-may15.md` — Verified state of all 6 growth roadmap items.
- `references/growth-roadmap-six-items.md` — Priority-ordered cognitive improvement roadmap with dependency chain.
- `references/live-self-model-may15.md` — Mid-turn introspection tool, system prompt self-model, and `/state` command implementation details.
- `references/behavioral-learning-may15.md` — PatternLearner module architecture, schema, wring points, and known API mismatch.
- `references/editorial-judgment-may16.md` — AestheticEvaluator module, 5 scoring dimensions, baseline tracking, wiring points, 57 tests.
- `references/self-improvement-may16.md` — SelfImprovementLoop module, 10-subsystem diagnosis, cooldown logic, heartbeat, 42 tests.
- `references/aesthetic-evaluator-live-calibration.md` — **First integrated session findings (May 16).** Flat-score diagnosis with exact formula analysis, DB schema reference, integration API surface, and signal delivery gap root cause.

## Verification Checklist

- [ ] Plan file written with clearly-scoped workstreams
- [ ] Per-workstream prompt files written to /tmp/
- [ ] Parallel OpenCode agents launched with background=True
- [ ] Manual analysis done in parallel with agents
- [ ] All agent outputs read and verified against source code
- [ ] Unified synthesis document produced
- [ ] Priority-ranked build plan created
- [ ] Session-specific detail saved as references/ under appropriate skill
- [ ] Tests for new cognitive behaviors planned alongside implementation
- [ ] Cognitive benchmarks run (`tests/test_cognitive_benchmark.py -m benchmark`)
