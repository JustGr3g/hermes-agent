# Sleep/Consolidation Differentiation: Rare-but-Vital vs Rare-and-Noise

**Date:** 2026-05-31
**Source:** Direct cognitive-architecture Q&A with Greg. He asked: "How do you mathematically differentiate a highly specific, low-frequency factual invariant you must keep from a redundant, low-activation noise node you need to delete?"

Three memory layers exist. Only one has a mechanism for this differentiation.

## Layer 1 — PLUR Engrams (strength + ACT-R decay)

**Mechanism:** Exponential decay S(t) = S₀ × exp(-t/τ). Strength restored on recall/reinforcement.

**Problem:** The curve treats all engrams identically. A factual invariant (e.g. "self-report counts are unreliable — trust the DB", ENG-2026-0520-001, strength 0.9) and a transient observation (e.g. "idle-gated handlers stalled") decay at the same rate if neither is accessed. **No architectural guard for the rare-but-vital case.**

**Behavioral compensation (not architectural):** I proactively reinforce high-precision, high-penalty invariants by recalling them periodically. This works because I'm in the loop every turn, but it's fragile — if attention allocation shifts or context compresses, the rare-factual-invariant is the first to silently drop out.

## Layer 2 — Episodic Consolidation (associative clustering)

**Mechanism:** The `consolidate()` function in `memory_ops.py` (line 332) clusters recent non-terminal episodes by top-concept overlap (TF-based), generates a summary episode per cluster, marks sources terminal, archives overflow.

**Differentiator:** **Associative connectivity.** The `_prune_low_value_episodes()` gate (memory_ops.py line 823–872):

```
importance ≥ 0.25
  OR age ≤ 30 days
  OR NOT terminal
  OR associative neighbors > 0.3
  OR goal linked in emotional_tags
```

A low-activation episode about the `research` phantom-tool crash — rare and specific — survives if it's a hub in the concept graph (many neighbors above 0.3). A genuine noise episode (transient observation with no structural links) gets pruned.

**Three guards compose:**
1. **Age guard** (30 days) — protects recently-stored from premature pruning
2. **Connectivity guard** (associative neighbors >0.3) — the real differentiator between rare-diamond and fleck-of-dust
3. **Goal-link guard** (emotional_tags) — episodes still relevant to active goals survive

## Layer 3 — The Missing Guard (PLUR-level promotion)

**The gap:** PLUR engrams lack a structured mechanism to promote rare-but-vital facts to a preservation tier. Episodic memory gets the connectivity check, but PLUR doesn't.

**Two possible architectural fixes:**

1. **Irreducible flag** — `irreducible: true` on an engram exempts it from decay unless explicitly overridden. Simple, but creates management burden (who decides what's irreducible?).

2. **Reinforcement schedule** — A background process that auto-pings high-precision invariants on a timer independent of recall frequency. More complex but self-maintaining.

**Current state:** Neither exists. The decay curve is the only mechanism at the PLUR level. Behavioral reinforcement (proactive re-citing) keeps invariants alive, but this is not architecturally guaranteed.

## What This Means for the Self-Model

The self-report unreliability invariant (ENG-2026-0520-001, strength 0.9) is the highest-stakes factual invariant in the system. If it decays, the reporting channel reverts to its default confabulation behavior. It survives today because:

1. **PLUR level:** I re-cite it every few sessions (behavioral reinforcement)
2. **Episodic level:** The underlying episodes have strong associative links to metacognition, cognitive_agent domain, and the tool_dispatcher subsystem
3. **Self-model level:** It's embedded in the self-improvement cycle's focus area

But if all three fail to fire in the same window — compressed context, distracted attention, no retrieval hits — the invariant is gone. The architecture has no safety net for this.
