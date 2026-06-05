# Structural Memory Retention — Design Conversation

**Conversation:** Sunday, May 31, 2026, 09:25–09:52 PDT
**Participants:** Greg (user), Athena (agent)

## Context

Greg's morning update noted the daily-summary cron had crashed on v0.15.2 merge issues (fixed), and shipped several improvements: stale tool-override clearing, goal proposer re-prompt, morning-review scoping. Athena ran a Sunday scan (costs offline, PLUR 52/582 healthy, goal backlog unreachable via dashboard DNS).

## Key Exchange

**Greg asked:** *"Walk me through your offline 'sleep' or 'dream' cycle: How do you mathematically differentiate a highly specific, low-frequency factual invariant you must keep from a redundant, low-activation noise node you need to delete?"*

**Athena's diagnosis:** The current architecture has three memory layers (PLUR engrams with ACT-R decay, episodic consolidation with associative clustering, and the concept graph with edge decay). All three share the same blindspot: the decay curve treats rare-but-vital facts identically to noise. PLUR engrams have no architectural guard; the rare invariant survives only because Athena *behaviorally* reinforces it by re-citing it.

**Greg's response:** *"Okay, I want you to formulate a well-researched well thought out and elegant solution to this Gap that you identified."*

## The Design

Athena proposed a 3-tier system whose core principle is: *Don't change how fast you forget — change what you're allowed to forget.*

**Tier 1 — Structural Salience (associative graph):** Before removing an edge below the decay threshold, check whether either endpoint has structural salience above a threshold. Salience combines degree centrality, betweenness centrality, and **inverse frequency** — the key insight being that rarely-accessed nodes get weighted UP, not down, because foundational invariants are accessed least.

**Tier 2 — Precision Anchors (episodic):** Episodes cited as knowledge anchors by high-precision engrams survive pruning even when their own importance is low. The anchor link is one-directional: the engram depends on the episode, not vice versa.

**Tier 3a — Irreducible Invariants (PLUR lifecycle):** A lifecycle with derivability checking — if all the invariant's terms already exist as connected concepts in the graph, the invariant IS derivable and gets rejected. If it's not derivable from existing associations, it's a primitive structural fact and gets preserved.

**Tier 3b — Reinforcement Schedule:** Weekly pass that finds verified invariants matching the profile (high precision, low access frequency, high penalty on loss) and reinforces them.

## Implementation

Athena implemented all three tiers in `cognitive_agent/`: Tier 1 in `memory/associative.py`, Tier 2 in `memory/episodic.py` + `memory_ops.py`, Tiers 3a/3b in a new `structural_retention.py` module. **All three tiers were wired into `consolidate()` as step 7 of the consolidation cycle in `memory_ops.py:585`.**

### Verification Test

After implementation, Athena verified the full pipeline end-to-end by proposing two real invariants from the conversation:

```python
from cognitive_agent.structural_retention import propose_invariant
from cognitive_agent.memory.associative import AssociativeMemory

a = AssociativeMemory(db_path="~/athena_memory.db")
result = propose_invariant(db_path,
    statement="Self-reported numeric counts in summaries routinely diverge from ground-truth DB state",
    rationale="Always trust the DB over the narrative channel",
    precision=0.95,
    associative=a,
)
# → status="verified" (primitive — not derivable from 2,355-node graph)
```

Both invariants passed derivability checking as primitive (not connected in the existing graph) and were promoted to `verified`. The reinforcement schedule correctly gated at 0 events (14-day window not elapsed). Test suite: 25/25 consolidation + episodic + associative tests passing.

### Graph Characteristics (at time of deployment)

- 2,355 nodes, 4,913 edges
- Betweenness centrality computed with `k=500` approximation (n ≥ 1000)
- Edge decay half-life: 14 days
- No existing invariants before proposal (clean deployment)

## Aftermath: Course Correction

Immediately following the structural retention implementation, Greg pointed out that Athena's roadmap summary was trusting a May-14 plan document (which described CognitivePlanner + CognitiveExecutor as missing, and plan-tree integration as not built) over actual disk state. Both were already built and live. This demonstrated the exact failure mode that ENG-2026-0520-001 ("self-report counts are unreliable — trust the DB over the narrative channel") was designed to catch.

### Subsequent Work: Structural Enforcement Gate

Greg then directed Athena to Tier 1's actual remaining gap: making cognitive signals force real tool-gating instead of advisory text. Athena implemented a structural enforcement gate in `cognitive_agent/cognition/deliberate.py`:

- `_intention_from_parsed()` (line 345-365): When `drive_family` is set AND the LLM picks a tool outside the recommended family, demotes `action_kind` to `"wait"` with a logged gate message
- `Deliberator.deliberate()` resolves `drive_family` from `_DRIVE_TOOL_FAMILIES` by matching the top drive name in `d.drive_bias`
- Gate is inactive when: no `drive_bias`, no goal, or goal importance ≥ 0.7
- Verified with unit tests (4 tests: no-drive passes, in-family passes, outside-family demoted, families listed)
- Pipeline integration tests: 3/3 passing
