# Cognitive Architecture Audit — Phase 1

**Mission:** Read, map, and honestly critique the entire cognitive architecture to
identify where Hermes is a chat bot vs. an agent, and where to build next.

## Workstream A — Core Agent Loop (run_agent.py)
- Map the full run_conversation() loop: what happens in each turn
- Where does state persist? Where does it vanish?
- How does interrupt/budget/grace work?
- Where does genuine reasoning happen vs. template-filling?
- Output: architecture diagram + gap analysis

## Workstream B — Memory & Persistence (hermes_state.py + agent/ memory dir)
- How does SessionDB work? What's stored per turn vs. per session?
- What does memory recall actually inject into context?
- Where is there genuine long-term learning vs. ephemeral state?
- Output: memory architecture map + gaps

## Workstream C — Tool Dispatch & Agency (model_tools.py + tools/)
- How are tools discovered, schematized, dispatched?
- Does the agent truly "choose" tools or just pattern-match from last N turns?
- Where could tool selection be genuinely agentic vs. reactive?
- Output: tool dispatch flow + agentic gap analysis

## Workstream D — Metacognition & Self-Model
- What does the agent know about itself at runtime?
- Where is self-correction real vs. template?
- Is there a distinction between "what I am" vs. "what I project"?
- Output: self-model analysis

## Workstream E — Evaluation & Testing
- What tests exist for cognitive behaviors vs. functional correctness?
- Where is evaluation missing?
- How do we measure progress toward AGI targets?
- Output: test gap map + evaluation framework proposal

## Delivery
- Phase 1 deliverable: Comprehensive architecture map + gap document
- Phase 2: Priority-ranked build plan
- Phase 3: Implement first wave of cognitive improvements
