# Audit: Memory Architecture

**Date:** 2026-05-12
**Source:** Manual code reading of hermes_state.py, agent/memory_manager.py, agent/memory_provider.py, agent/cognitive_processor.py
**Honesty level:** Critical

---

## 1. Memory Data Flow

```
User says something → run_conversation()
  │
  ├─ _build_system_prompt() [line 4885]
  │    └─ format_for_system_prompt("memory") → injects engram text
  │    └─ format_for_system_prompt("user") → injects user profile
  │    └─ MemoryManager.build_system_prompt() → external provider block
  │
  ├─ MemoryManager.prefetch_all(query) [line 285–302]
  │    └─ For each provider: provider.prefetch(query) → returns context text
  │    └─ Result cached as _ext_prefetch_cache [line 10647–10653]
  │
  ├─ augment_message() [cognitive_processor.py line 122]
  │    └─ CognitiveAgent.run() → returns cog dict with retrieval items
  │    └─ Builds "ATHENA COGNITIVE STATE" block with [M#] cited memories
  │    └─ Prepends to user message
  │
  ├─ record_result() [cognitive_processor.py line 605]
  │    └─ _build_episode() → stores in episodic memory
  │    └─ associative.extract_and_link() → concept graph
  │    └─ metacognition.record_retrieval_hit() → scores quality
  │
  ├─ verify_and_revise() [cognitive_processor.py line 689]
  │    └─ FaithfulnessFilter checks response claims vs cog state
  │
  └─ record_completion() [cognitive_processor.py line 768]
       └─ Stores final episode
       └─ Inner speech summary
       └─ Motivation update
       └─ WAL checkpoint for episodic memory DB
```

## 2. Storage Layers

| Layer | Backend | Scope | What's stored |
|-------|---------|-------|--------------|
| SessionDB | SQLite (FTS5) | Per-session transcript | Messages, tool calls, system prompt, session metadata |
| Built-in memory | JSON file (~/.hermes/) | Cross-session | User profile entries + "memory" entries (engrams) |
| External provider | Plugin-defined | Plugin-scoped | Honcho, Mem0, Supermemory, etc. |
| ATHENA episodic | SQLite (~/cognitive-agent/athena_memory.db) | Cross-session | Episode dataclasses with importance, emotion, causal links |
| ATHENA associative | Graph (SQLite-backed) | Cross-session | Concept graph with extracted entities and links |
| ATHENA retrieval | SQLite | Cross-session | Query-based retrieval with scoring |

## 3. Context Injection — What Actually Enters the Prompt

**Built-in memory** (run_agent.py line 4979–4988):
- memory_store.format_for_system_prompt("memory") → injected as system prompt block
- memory_store.format_for_system_prompt("user") → injected as system prompt block
- These are static text blocks. The LLM sees them as part of the system prompt — they're not dynamically queried per turn

**Prefetch cache** (line 10647–10653):
- MemoryManager.prefetch_all(query) runs ONCE per turn, cached for all iterations
- Result is passed to augment_message() as _ext_prefetch_cache
- The ATHENA cognitive block (cognitive_processor.py line 223–575) includes:
  - Relevant memories (top 1 memory + top 1 code-read: line 355–361)
  - Greg profile excerpt (first 600 chars: line 322–331)
  - Active goals, aspirations, inner speech
  - Self-model excerpt
- This is injected into the USER message, not system prompt, so it doesn't break prefix caching

**Critical note:** The ATHENA cognitive state block can be HUGE (hundreds of lines). This is prepended to EVERY user message on EVERY LLM call in the loop — so on a 50-iteration tool turn, the cognitive block is sent 50 times.

## 4. Learning Architecture — Genuine Learning vs. Storage/Retrieval

**What looks like learning but isn't:**
- **Memory save/recall**: Writing facts to JSON and injecting them into the next system prompt. This is static storage, not learning. The facts don't change the agent's behavior or architecture — they just add text to the prompt.
- **Episodic storage**: Episodes are appended to a DB but never automatically replayed or consolidated. They're only queried via explicit retrieval. No sleep-phase consolidation.
- **Associative graph**: Concepts are linked to episodes, but there's no active inference on the graph — no spreading activation, no generalization.

**Where genuine learning starts:**
- **Metacognition.record_retrieval_hit()**: Tracks whether retrieved memories were useful. This could inform future retrieval strategies, though the current implementation just tracks the score.
- **Motivation update from outcome** (cognitive_processor.py line 838–849): Records whether the turn was "successful" based on response length heuristic. Updates goal priority accordingly.
- **ACT-R decay on engrams (plur_batch_decay)**: Enforces memory decay curves — older, less-used memories weaken over time. This is a genuine cognitive-inspired process.

**The fundamental problem:** No learning is *self-directed*. The agent doesn't decide "I should remember that" or "I was wrong about X." All storage is triggered by external events (memory tool calls, turn boundaries) or fixed schedules.

## 5. Concrete Gaps (with references)

**Gap 1 — No working memory (hermes_state.py, run_agent.py line 10655 loop)**
The agent has no short-term scratchpad. When it reads a file in iteration 1 and needs to use that info in iteration 10, it must re-read the file or hope the LLM remembered it. The ATHENA working memory (cognitive_processor.py references wm state) exists in the cognitive_agent subsystem but doesn't persist tool results between iterations.

**Gap 2 — No self-directed memory consolidation (run_agent.py line 10411–10421)**
Memory extraction fires on a turn-count timer, not when the agent has learned something important. A trivial "ok" turn and a deep debugging session both trigger memory review at the same interval.

**Gap 3 — No cross-session reasoning continuity (cognitive_processor.py record_completion)**
After each session, episodic memories are stored and associative links are created. But there's no mechanism for the agent to *reflect* on past sessions — to notice patterns across days, to detect its own behavioral changes, to form longer-timescale self-model updates.

**Gap 4 — Retrieval is shallow (cognitive_processor.py line 355–361)**
The ATHENA retrieval returns top 1 memory + top 1 code-read, capped aggressively. This is pragmatic for token budgets but means the agent operates on very thin context. Deep, multi-fact reasoning requires more retrieved information.

**Gap 5 — No sleep/consolidation cycle (nowhere in the codebase)**
Biological memory requires consolidation during sleep. Current memory has no equivalent — no periodic process that re-weights memories, generalizes patterns, or prunes noise. The ACT-R decay in PLUR is the closest thing, but it only weakens old memories rather than consolidating important ones.
