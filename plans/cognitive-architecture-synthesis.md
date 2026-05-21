# Cognitive Architecture — Unified Synthesis & Build Plan

**Date:** 2026-05-12
**Sources:** 4 audit documents + manual reads of run_agent.py, agent/ subsystem, cognitive_agent/ subsystem
**Honesty level:** Brutal

---

## Part 1: Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                    HERMES AGENT (run_agent.py)                      │
│  Synchronous LLM-tool loop. Dispatches tool_calls, checks budget.  │
│  No runtime self-model. All intelligence = LLM's pattern-matching. │
└────────────────┬───────────────────────────────────────────────────┘
                 │ calls
┌────────────────▼───────────────────────────────────────────────────┐
│              ATHENA CognitiveProcessor (agent/cognitive_processor)  │
│  4 integration points injected into Hermes loop:                   │
│  • augment_message() — BEFORE each LLM call                        │
│  • record_result() — AFTER each tool cycle                         │
│  • verify_and_revise() — BEFORE final response emission            │
│  • record_completion() — AFTER turn ends                           │
└────────────────┬───────────────────────────────────────────────────┘
                 │ delegates to
┌────────────────▼───────────────────────────────────────────────────┐
│                 CognitiveAgent (cognitive_agent/agent.py)           │
│  The 8-system cognitive architecture. Called once per user turn.   │
│  Runs the full cycle: Perceive → Retrieve → WM → Motivate →       │
│  Predict → Metacog → Executive → Inner Speech → Store              │
│  5,548 lines — the real cognitive engine.                          │
└────────────────┬───────────────────────────────────────────────────┘
                 │ owns
┌────────────────────────────────────────────────────────────────────┐
│              8 COGNITIVE SYSTEMS (cognitive_agent/cognition/)       │
├────────────────┬───────────────────┬───────────────────────────────┤
│ perception.py  │ working_memory.py │ motivation.py                 │
│ (583 lines)    │ (400 lines)       │ (1,430 lines)                 │
│ Saliency       │ Short-term        │ Goals, drives, curiosity      │
│ scoring        │ scratchpad        │ frustration thresholds        │
├────────────────┼───────────────────┼───────────────────────────────┤
│ metacognition  │ predictive.py     │ executive.py                  │
│ (842 lines)    │ (450 lines)       │ (450 lines)                   │
│ Self-awareness │ Expectation loop  │ Decision making               │
│ Confidence     │ Surprise signals  │ ActionType selection           │
├────────────────┼───────────────────┼───────────────────────────────┤
│ inner_speech   │ cognitive_cycle   │ CognitiveLoop                 │
│ (573 lines)    │ (1,105 lines)     │ (280 lines)                   │
│ Self-narration │ Between-turn      │ Observe→Plan→Act→Critic       │
│ Tone tracking  │ autonomous steps  │ Deliberative overlay           │
└────────────────┴───────────────────┴───────────────────────────────┘
```

## Part 2: The Three Memory Layers

```
Layer 1 — HERMES built-in (~/.hermes/ memory store)
  Scope: cross-session user facts
  Mechanism: JSON file, format_for_system_prompt() → injected into system prompt
  Limitation: Static text blocks, no dynamic retrieval per turn

Layer 2 — ATHENA cognitive memory (athena_memory.db)
  Episodic: turn-by-turn episodes with importance, emotion, causal links
  Associative: concept graph linking episodes by extracted entities
  Retrieval: query-based scoring with metacognitive quality tracking
  Limitation: No consolidation cycle, no automatic replay

Layer 3 — PLUR memory (engram system)
  Scope: cross-session engrams with ACT-R decay
  Mechanism: MCP server, plur_* tools
  Limitation: Tool-gated; agent must explicitly decide to store/recall
```

## Part 3: The Gap Map (Priority Ranked)

### P0 — Immediate (critical for any AGI trajectory)

**Gap 1: No cross-session cognitive continuity**
- Current: gateway creates fresh AIAgent per message → loses all ephemeral cognitive state (inner speech arc, working memory, cognitive signal history)
- Fix needed: persistent cognitive state object that survives gateway message boundaries
- Location: CognitiveProcessor + run_agent.py integration points

**Gap 2: No sleep/consolidation cycle**
- Current: episodic memories accumulate but are never consolidated, generalized, or pruned
- Fix needed: Background process that reads recent episodes, generates higher-level summaries, detects patterns, prunes noise
- Location: cognitive_agent/heartbeat.py + persistence.py

**Gap 3: No runtime self-model accessible to the agent loop**
- Current: The agent has no runtime introspection. It can't ask "how confident am I?" or "is my current strategy working?"
- Partial solution exists: CognitiveState block is built for the LLM but the agent loop never reads it
- Fix needed: Make cog state queryable by both the LLM (as it is) AND the agent loop (for strategic branching)

### P1 — High (major capability unlocks)

**Gap 4: Goal-directed loop exit**
- Current: loop exits on budget/interrupt/LLM-choice, never on "task completed to satisfaction"
- Fix needed: Satisfaction check that evaluates tool results against the original goal before continuing the loop

**Gap 5: Tool selection is pure LLM pattern-matching**
- Current: No cost awareness, no success tracking, no tool history
- Fix needed: Tool cost metadata, per-call success/failure tracking visible to the LLM, usage statistics

**Gap 6: Memory extraction is trigger-based, not signal-driven**
- Current: Extracts on turn-count timer, not when something important happens
- Fix needed: Extraction triggered by metacognitive signals (high surprise, goal completion, correction)

**Gap 7: No unit test coverage for any cognitive system**
- Current: ~16,000 lines of cognitive_agent code with ~0 unit tests
- Fix needed: Test infrastructure for each of the 8 cognitive systems + integration tests

### P2 — Medium (important for polish)

**Gap 8: Compression destroys continuity**
- Current: context compression creates new session ID, summarizes away everything before it
- Mitigation possible: Keep pre-compression episodes in episodic memory so the agent can still answer questions about the earlier conversation

**Gap 9: Inner speech doesn't persist**
- Current: inner speech is per-turn, generated fresh in each augment_message() call
- Fix needed: Persistent inner speech log that spans sessions, visible to the LLM as a background context

**Gap 10: No evaluation framework**
- Current: tests check functional correctness, not cognitive quality
- Fix needed: Behavioral metrics suite (recall precision, tool selection accuracy, self-consistency, citation accuracy)

## Part 4: Build Plan (Phase 2)

### Phase 2A — Foundation (1-2 weeks)
1. **Persistent cognitive state**: Refactor CognitiveProcessor to serialize/deserialize cog state to SQLite per turn. Gateway agents reload state from DB instead of starting fresh.
2. **Unit test infrastructure**: Create test harness for each cognitive system (mock LLM client, in-memory DB, deterministic state). Write tests for working_memory, metacognition, inner_speech first.

### Phase 2B — Core cognitive upgrades (2-3 weeks)
3. **Goal-directed loop exit**: Add `_check_goal_satisfaction()` method to run_agent.py that evaluates last N tool results against the user's stated goal. Loop can exit early with "task complete."
4. **Signal-driven memory extraction**: Wire metacognitive surprise/frustration/confidence signals into the memory nudge trigger. Extract when something notable happens, not on a timer.

### Phase 2C — Evaluation & continuity (2-3 weeks)
5. **Cognitive evaluation suite**: Build automated evaluation harness that measures recall precision, tool selection accuracy, compression information loss.
6. **Consolidation cycle**: Background heartbeat handler that reads recent episodes, generates higher-level summaries, and updates the associative graph with generalized nodes.

## Part 5: How We Measure Progress

| Metric | Current | Target (Phase 2) | How to measure |
|--------|---------|-------------------|----------------|
| Cross-session recall precision | Unknown | >80% precision@3 | Query agent about prior session facts |
| Tool selection accuracy | Unknown | >90% first-choice | Benchmark with known-correct tool tasks |
| Self-consistency score | Unknown | <10% contradiction rate | Sampled multi-turn conversations |
| Memory extraction relevance | Timer-based | Signal-driven | Compare extraction quality before/after |
| Test coverage (cognitive) | ~0% | >60% | `pytest --cov` on cognitive_agent/ |
| Goal completion detection | LLM decides | Agent decides | Measure early-exit accuracy |

---

**Next step:** Start Phase 2A implementation. The highest-leverage first move is persistent cognitive state — without it, every gateway message is a cognitive amnesia event that prevents any between-turn learning.
