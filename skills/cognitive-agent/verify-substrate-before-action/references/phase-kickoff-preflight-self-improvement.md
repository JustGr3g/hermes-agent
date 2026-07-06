# Phase-Kickoff Preflight: SelfImprovementLoop Phase 0b (2026-07-01)

Session transcript of the preflight that caught a contract gap between
the design intent of Phase 0b and the threshold constant in code, before
the kickoff was allowed to proceed.

## Setup

Greg greenlit Phase 0b on 2026-07-01: let `SelfImprovementLoop.diagnose()`
act on the `measured_effect` deltas that Phase 0a has been writing. Phase
0a has logged 2 real measurements since 2026-06-09 (concept_formation
-0.056, confidence +0.40). The principle: skip a subsystem whose last
intervention was flat-or-negative; re-target the next-weakest instead.

## Step 1 — read the decision code

`cognitive_agent/cognition/self_improvement.py`:

- Lines 344-378: the skip logic in `diagnose()`
  - Iterates over `ranked = sorted(scores, key=lambda k: scores[k])`
  - For each subsystem, checks `eff = effects.get(sub)` against
    `_NONRESPONSIVE_EFFECT`
  - `nonresponsive = (eff is not None and eff <= self._NONRESPONSIVE_EFFECT
    and not _is_default_score(sub, scores[sub]))`
  - If `nonresponsive`, appends to `skipped` and continues to next
  - Falls back to `ranked[0]` only if every candidate is non-responsive
- Line 566: `_NONRESPONSIVE_EFFECT = -0.02`
- Line 563: `_MEASURE_FLAT_BAND = 0.02` (the "flat" reading from the
  measurement path; literally the same number, opposite sign)

**The docstring at lines 344-350** says:

> "skip the weakest subsystem if its LAST intervention was measured
> flat-or-negative — it isn't responding, so re-targeting it just burns
> another cycle (e.g. concept_formation measured -0.056 on 2026-06-09)"

**The constant** says: only skip if `eff <= -0.02`. The "flat" half of
"flat-or-negative" is *not* skipped under the strict rule.

**This is a contract gap.** The design intent and the mechanism disagree
on a one-line constant. The example cited in the docstring
(concept_formation at -0.056) is correctly handled by both readings —
that's why the gap wasn't caught at the time the comment was written.

## Step 2 — pull the live data

Live DB: `~/athena_memory.db` (119 MB, canonical per
`verify-substrate-before-action` DB-path rule).

`SELECT id, subsystem, measured_effect, last_measured_at, created_at,
 status FROM policy_overrides WHERE source_cycle_id LIKE 'si-%'
 ORDER BY COALESCE(last_measured_at, created_at) DESC`

| id | subsystem | measured_effect | last_measured_at | created_at | status |
|---|---|---|---|---|---|
| po-f7672439a915 | tool_selection | NULL | NULL | 1782884429 (9.6h ago) | active |
| po-c5068d06d11e | tool_selection | -0.007 | 1782884429 | 1782262473 (8d ago) | active |
| po-299fcb105118 | tool_selection | -0.011 | 1782262473 | 1781624645 (15d ago) | expired |
| po-40b22b73f53f | confidence | +0.40 | 1781019832 | 1780200832 (expired) | expired |
| po-a1ab639b883f | concept_formation | -0.056 | 1781019832 | 1780805635 (expired) | expired |
| po-3420f5a3bf1b | tool_selection | NULL | NULL | 1779589907 (expired) | expired |
| po-2ed861fccf38 | concision | +0.15 | 1778999686 | 1778983454 (reinforced) | reinforced |

`SELECT value FROM self_improvement_meta WHERE key='last_run_ts'`:

- last_run_ts = 1782884429 (9.6h ago)
- 7-day heartbeat cooldown: NOT yet due. Next `diagnose()` is gated by
  the heartbeat scheduler, not by the meta KV. To actually run 0b
  end-to-end, lower the heartbeat or invoke `diagnose()` directly.

## Step 3 — simulate the decision

`_subsystem_last_effects()` returns the most-recent measured_effect per
subsystem, taking the first hit (newest first per the ORDER BY). The
"current scores" are taken from whatever `diagnose()` is called with
— they're the present moment, not historical.

| Subsystem | Latest measured_effect | Source row | Strict rule (≤-0.02)? | Design intent (flat-or-negative)? |
|---|---|---|---|---|
| tool_selection | -0.007 | po-c5068d06d11e (active) | **NO** (above -0.02) | YES (re-target 3 cycles, no movement) |
| confidence | +0.40 | po-40b22b73f53f (expired) | NO | NO |
| concept_formation | -0.056 | po-a1ab639b883f (expired) | YES | YES |

Under the **strict rule** as-shipped, only `concept_formation` gets
skipped. `tool_selection` — the subsystem that has been re-targeted 3
cycles in a row with measured effects of -0.011, -0.007, and an
unmeasured active — would NOT be skipped, even though the entire point
of 0b is to break this kind of loop.

Under the **design intent** (and the docstring at lines 344-350), both
`tool_selection` and `concept_formation` would be skipped, and the loop
would target the next-weakest real subsystem.

The active override `po-f7672439a915` with `measured_effect=NULL` is
9.6h old, under the 24h min-age gate in `measure_open_overrides()`.
It's "unmeasured" not "non-responsive" — Roadmap #4 in lines 357-365
explicitly preserves this distinction, and the strict rule also
preserves it (a NULL effect is not ≤ -0.02, so it doesn't trigger
skip). So this row is *not* a third misclassification; it's an
unmeasured row that the next measure pass will judge.

## The two threshold options

**Option 1: tighten the threshold to +0.02.**
- One-line change: `_NONRESPONSIVE_EFFECT = -0.02` → `+0.02` (or import
  the existing `_MEASURE_FLAT_BAND = 0.02` to avoid a new constant)
- Matches the docstring verbatim
- Catches the `tool_selection` case the design exists to break
- Tradeoff: a +0.005 marginal improvement gets skipped too. Probably
  fine — that's still "non-responsive" in any practical sense — but it
  does close a window where a slow-but-real positive movement could
  re-engage a subsystem.

**Option 2: keep the strict rule.**
- Status quo; zero code change
- Defensible interpretation: only true regressions de-prioritise;
  marginal-but-positive movement re-engages
- Tradeoff: contradicts the docstring. Either the docstring gets
  rewritten to match, or the next session that tries to "kick off 0b"
  will hit the same confusion.

## The reported outcome

Greg was shown the preflight table, the contract gap, and the two
options. The kickoff was reported as **NOT CLEAN** — Phase 0b is
correctly wired, but the constant doesn't implement the documented
behavior, so firing the loop as-shipped would have re-targeted
`tool_selection` next cycle and broken the loop 0b exists to break.

The decision (which option to ship) is Greg's, not the agent's. The
agent's job in the preflight was to surface the gap, not resolve it.

## Why this preflight caught what code-reading didn't

Code-reading the skip logic at lines 344-378 would have shown the
mechanism: "skip if `eff <= _NONRESPONSIVE_EFFECT`." A naive code
review would have accepted that as the design. The preflight forces
the next question: "what does `_NONRESPONSIVE_EFFECT` actually mean?"
Reading line 566 (the constant) and lines 344-350 (the docstring)
side-by-side shows the gap. Then reading the live data shows which
rows misclassify under the constant — and at that point, the
classification table writes itself.

The same preflight applies to any future phase kickoff: read intent,
read mechanism, read data, simulate the decision on the actual rows.

## A note on the active unmeasured override

`po-f7672439a915` is the most-recent self-improvement override, with
`measured_effect=NULL`. Its `created_at` is 9.6h ago, under the 24h
min-age gate. By the time Phase 0b fires for real (whenever the
heartbeat lets it), the override will be 7+ days old and the next
`measure_open_overrides()` call will record its effect. If that
measurement is -0.01 or +0.01, the strict rule won't skip it but the
design intent will. The threshold question is not theoretical — it
will hit on the very first 0b cycle.
