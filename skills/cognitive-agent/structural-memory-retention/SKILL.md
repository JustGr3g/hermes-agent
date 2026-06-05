---
name: structural-memory-retention
description: "Three-tier system for preserving rare-but-vital factual invariants across PLUR engrams, episodic memory, and associative graphs — solves the decay-curve problem where low-frequency, high-importance facts are treated identically to noise."
version: 1.0.0
author: Athena
platforms: [macos, linux]
metadata:
  hermes:
    tags: [memory, consolidation, invariants, cognitive-architecture, plura]
    related_skills: [self-audit-cognitive-autonomy, phase-2a-persistent-cognitive-state, wm-overload-cognitive-load-fix]
---

# Structural Memory Retention

## Overview

The standard decay curve (geometric: weight × 0.5^(age / half_life)) treats all memories identically — a rare-but-vital factual invariant and a transient noise observation decay at the same rate if neither is accessed. This is the root cause of the consolidation gap (Gap 2 in the cognitive architecture synthesis).

This skill implements a 3-tier solution where **the decay curve stays the same; what changes is the pruning gate.** An invariant survives not because it gets special treatment in the forgetting function, but because it earns structural immunity from the retention function.

**Core principle:** *Don't change how fast you forget — change what you're allowed to forget.*

## The Three Tiers

### Tier 1 — Structural Salience (Associative Graph)

**File:** `cognitive_agent/memory/associative.py`

Before removing an edge below `EDGE_DECAY_REMOVE_AT`, check whether either endpoint has *structural salience* above a threshold.

**Salience formula:**

```
salience(node) = α · degree_centrality + β · betweenness_centrality + γ · inverse_frequency
```

Where defaults: α=0.30, β=0.50, γ=0.20, threshold=0.30

| Component | What it captures | Why it matters |
|-----------|-----------------|----------------|
| Degree centrality | Number of neighbors (hub weight) | A hub with many connections — losing it disconnects its neighbors |
| Betweenness centrality | Sits on shortest paths between disparate clusters | The mathematical fingerprint of a bridging invariant — connects domains it can't be derived from |
| Inverse frequency | Penalizes the very metric that causes standard decay to fail | Rarely-accessed nodes get *weighted up*, not down — the invariants you need most are the ones you access least because they're foundational |

**Implementation details:**

- Betweenness is O(VE) — computed lazily, cached for `SALIENCE_CACHE_TTL` (1 hour)
- Topology version counter (`_topology_version`) invalidates cache on add/remove edge
- Preserved edges are pinned at `EDGE_DECAY_MIN_SURVIVAL` (0.02) with `preserved_by_salience: True`
- Use `nx.betweenness_centrality(G, k=k, normalized=True)` — approximate for n≥1000, exact otherwise

**Constants:**
```python
SALIENCE_THRESHOLD = 0.30
SALIENCE_ALPHA = 0.30
SALIENCE_BETA = 0.50
SALIENCE_GAMMA = 0.20
SALIENCE_CACHE_TTL = 3600
EDGE_DECAY_MIN_SURVIVAL = 0.02
EDGE_DECAY_HALF_DAYS = 14
EDGE_DECAY_REMOVE_AT = 0.01
```

### Tier 2 — Precision Anchors (Episodic Memory)

**Files:** `cognitive_agent/memory/episodic.py`, `cognitive_agent/memory_ops.py`

Episodes cited as *knowledge anchors* by high-precision engrams (type=terminological or type=architectural) are preserved during pruning, even if their own importance or activation is low.

**Schema:**
```sql
CREATE TABLE precision_anchors (
    episode_id  TEXT NOT NULL REFERENCES episodes(id),
    engram_id   TEXT NOT NULL,
    rationale   TEXT DEFAULT '',
    registered_at REAL NOT NULL,
    PRIMARY KEY (episode_id, engram_id)
);
```

**Guard in `_prune_low_value_episodes()`:** Before the `UPDATE episodes SET pruned_at` line, check:
```python
if agent.episodic.is_anchored(ep_id):
    continue
```

**Key property:** The anchor link is one-directional — the engram depends on the episode for grounding, not the other way around. So an episode survives even when its own episodic signals are weak, because its downstream consumer has structural importance.

### Tier 3a — Irreducible Invariants (Structural Lifecycle)

**File:** `cognitive_agent/structural_retention.py`

A boolean lifecycle for PLUR engrams that exempts them from strength decay. Lifecycle status:

| Status | Meaning |
|--------|---------|
| proposed | Submitted for verification |
| verified | Passed derivability check — actively preserved |
| rejected | Failed — this fact is derivable from the existing graph |
| promoted | verified + manually endorsed (max immunity) |
| stale | Was verified but the graph has grown to make it derivable |

**Derivability check algorithm:**
1. Extract terms (≥4 chars, non-stopword) from the invariant statement
2. Map each term to its node in the associative graph via `_label_to_id()`
3. For each pair of found terms, compute `nx.shortest_path(G, source, target)`
4. If ALL found terms are within `max_path_distance` (default 2) hops of each other → the fact IS derivable → reject it
5. If ANY pair lacks a connecting path → the fact is primitive (structural) → verify it

**Why this prevents over-promotion:** If every term in the invariant statement already exists as connected concepts in the graph, the invariant is a LEAF (derivable from existing associations), not a ROOT (structural, cannot be derived elsewhere). Only roots qualify for irreducible status.

**Lifecycle:**
```python
propose_invariant(db_path, statement, rationale, precision, associative)
  → derivability check
  → verified or rejected

renew_invariant(db_path, invariant_id, associative)
  → re-check against current graph
  → if now derivable → downgraded to stale
  → if still irreducible → clock reset

get_invariants(db_path, status, limit)
  → list filtered or all
```

### Tier 3b — Precision-Weighted Reinforcement Schedule

**File:** `cognitive_agent/structural_retention.py`

A weekly consolidation pass that reinforces non-irreducible engrams matching the rare-but-vital profile.

**Gate conditions (all must be true):**
- precision ≥ 0.75
- penalty_on_loss > 0 (≥1 downstream reference)
- access frequency percentile < 0.30 (rarely touched compared to peers)
- last reinforcement > 14 days ago

**Reinforcement action:** Log the event to `invariant_reinforcements` table with before/after strength. Update `last_reinforced_at` timestamp to reset the decay clock. The reinforcement is `min(1.0, precision + 0.2)` — enough to reset without maxing out (prevents positive-feedback runaway).

**penalty_on_loss heuristic:** Count downstream artifacts that reference this invariant_id:
- Other invariants' rationale text
- athena_notes content
- self_models content/narrative

## Integration Into consolidate()

The full structural retention pass runs at the end of `memory_ops.consolidate()`:

```python
from .structural_retention import run as run_structural_retention
result["structural_retention"] = run_structural_retention(
    agent.db_path, agent
)
```

This returns:
```python
{
    "reinforcement": {"reinforced": N, "skipped_stale": N, ...},
    "renewal_pass": {"checked": N, "renewed": N, "downgraded_to_stale": N},
}
```

## Pitfalls

- **Betweenness is O(VE).** Always use lazy computation + topology-version cache. Do NOT compute on every `decay_edges()` call. Use the approximate variant (`k=500`) for graphs over 1000 nodes.
- **Inverse frequency can produce false positives** in very active graphs (where every node has been touched recently). Mitigated by setting γ=0.20 — inverse frequency is the weakest signal, not the dominant one.
- **Derivability check uses exact token matching.** An invariant that uses synonyms for graph terms will pass the check (marked "not connected") even if the semantic content IS derivable. This is intentional — the check errs on the side of preserving rather than pruning. Over time, synonyms get linked by associative consolidation and the invariant naturally becomes redundant.
- **PLUR is external (MCP server).** The irreducible lifecycle uses a local SQLite table (`structural_invariants`) because PLUR's engram storage isn't directly writable from the cognitive agent code. The status is managed locally, not remotely. If PLUR ever becomes an integrated DB, the `irreducible` flag could move there.
- **Don't skip Tier 2 just because Tier 1 is operational.** They protect different memory layers (associative graph edges vs episodic episodes). Skipping Tier 2 means precision-anchored episodes can be pruned even though they ground high-value invariants.

## When to Use

- When designing or extending the consolidation/heartbeat cycle
- When fixing decay-curve blindspots (facts that *must* persist but are rarely accessed)
- When the self-model or goal system shows drift traceable to a lost invariant
- When adding a new memory layer that needs retention guarantees

## References

- `cognitive_agent/memory/associative.py` — Tier 1: `compute_structural_salience()`, `decay_edges()`, `salience_stats()`
- `cognitive_agent/memory/episodic.py` — Tier 2: `precision_anchors` table, `register_anchor()`, `is_anchored()`
- `cognitive_agent/memory_ops.py` — Tier 2 guard in `_prune_low_value_episodes()`
- `cognitive_agent/structural_retention.py` — Tiers 3a/3b: `propose_invariant()`, `_check_derivability()`, `reinforce_due_invariants()`, `run()`
