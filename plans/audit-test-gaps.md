# Audit: Test Gap Analysis & Evaluation Framework

**Date:** 2026-05-12
**Source:** Manual examination of tests/ and ~/cognitive-agent/tests/
**Honesty level:** Critical

---

## 1. Test Coverage Overview

### Hermes tests (tests/ directory)
- **~366,849 lines across ~900 files**
- Largest: test_run_agent.py (5,225), test_hermes_state.py (2,945), test_tui_gateway_server.py (3,925)
- **Focus**: Functional correctness — tool schemas parse, session DB saves, gateway dispatches correctly, CLI commands work
- **Cognitive behaviors**: Zero. No test asks "does the agent reason better after compression?" or "does memory retrieval improve with usage?"

### ATHENA cognitive tests (~/cognitive-agent/tests/)
- **4,859 lines across 7 test files**
- test_smoke.py: 2,620 lines — integration smoke tests, not unit tests
- test_faithfulness.py: 551 lines — FaithfulnessFilter only
- test_integration.py: 517 lines — integration scenarios
- test_agent_stance_proactive.py: 339 lines — proactive stance behavior
- test_cognitive_loop.py: 236 lines — cognitive loop cycle
- test_google_workspace_tools.py: 303 lines — Google Workspace tool
- test_remote_cognitive_processor.py: 264 lines — remote processor

## 2. What's NOT Tested (cognitive_agent subsystem)

| Module | Lines | Tests? | Gap severity |
|--------|-------|--------|-------------|
| agent.py (CognitiveAgent) | 5,548 | Partial (smoke tests only) | **Critical** |
| motivation.py | 1,430 | **None** | **Critical** |
| cognitive_cycle.py | 1,105 | **None** | **Critical** |
| inner_speech.py | 573 | **None** | **Critical** |
| working_memory.py | 400 | **None** | **Critical** |
| perception.py | 583 | **None** | **Critical** |
| predictive.py | 450 | **None** | **Critical** |
| metacognition.py | 842 | **None** | **Critical** |
| episodic.py | 404 | **None** | **Critical** |
| associative.py | 390 | **None** | **Critical** |
| retrieval.py | 432 | **None** | **Critical** |
| executive.py | 450 | **None** | **Critical** |
| self_model.py | (~100) | **None** | High |
| heartbeat.py | (~150) | **None** | High |
| autonomy_guard.py | 788 | **None** | High |
| anticipation.py | 906 | **None** | High |
| plans.py | 723 | **None** | High |
| drives.py | 706 | **None** | High |
| persistence.py | 401 | **None** | High |

**Total untested cognitive agent code: ~16,000+ lines** — roughly 70% of the cognitive_agent subsystem has zero unit test coverage.

## 3. What Hermes Tests Don't Cover

| Cognitive Behavior | Who owns it | Test coverage |
|-------------------|-------------|--------------|
| Agent loop exit quality | Hermes (run_agent.py) | 0 — loop exits on budget/interrupt/LLM choice, never on "task is done" |
| Memory extraction correctness | Hermes (memory + nudge) | 0 — no test verifies right facts were extracted at right time |
| Context compression quality | Hermes (_compress_context) | 0 — no test measures information loss after compression |
| Tool selection quality | Both (LLM picks, Hermes dispatches) | 0 — no test verifies the LLM chose the right tool |
| Cognitive state accuracy | ATHENA (CognitiveProcessor) | 0 — no test verifies the cog block matches actual system state |
| Cross-session continuity | Both | 0 — no integration test runs session A → session B and checks recall |
| Faithfulness of responses | ATHENA (FaithfulnessFilter) | 551 lines — tested but only in detect mode |

## 4. Evaluation Framework Proposal

Current "evaluation" is binary: tests pass or fail. For AGI progress we need **measurement**:

### Tier 1: Behavioral Invariants (what we test NOW, should keep)
- Tool schemas parse correctly
- Session DB round-trips work
- Gateway dispatches to correct channels
- CLI commands resolve correctly

### Tier 2: Cognitive Quality Metrics (what we NEED)
- **Memory recall precision@k** — when asked a question, does the agent retrieve relevant engrams?
- **Tool selection accuracy** — given a task, does the agent pick the right tool first time?
- **Compression information loss** — after compress, does the agent still answer questions about the pre-compression conversation?
- **Self-consistency** — across multiple turns, does the agent contradict itself about facts it should know?
- **Citation accuracy** — when Athena cites [M1], does the cited memory actually contain the claim?

### Tier 3: AGI Progression Metrics (long-term)
- **Goal-directed persistence** — does the agent follow multi-turn goals without steering?
- **Learning rate** — does the agent get better at tasks over time (within a session, across sessions)?
- **Self-model accuracy** — does the agent's self-description match its actual runtime state?
- **Adaptation to user** — after N sessions, does the agent need less steering to produce correct output?
- **Surprise detection** — does the agent identify when its predictions were wrong and update?
