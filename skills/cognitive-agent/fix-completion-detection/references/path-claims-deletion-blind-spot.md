# path-claims-deletion-blind-spot

**Date discovered:** 2026-06-04 19:25 PDT
**Grounding incident:** bug-3 cleanup plan (goal 9ae74a38, abandoned 01:10:36 today)
**Related file:** `~/cognitive-agent/cognitive_agent/cognition/path_claims.py`
**Related call site:** `~/cognitive-agent/cognitive_agent/goal_proposer.py:977-980`

## The finding

`path_claims.classify_and_check()` returns `(path, role, exists)` tuples. The goal_proposer's gate at line 977-980 filters to `role == "source" and not exists` — only firing the existence check on paths classified as **source** (i.e. existing context being read). Paths classified as **deliverable** skip the check on the assumption that the file is *about to be created*.

**The bug:** A goal that says *"delete X"* or *"remove Y"* is both a deliverable action AND a claim that X already exists. The classifier at `classify_path_role()` (lines 109-133) walks back 5 tokens and picks the role based on the closer marker. For "Remove the `temp_bug3_fix` utility functions", "Remove" is closer to the path than any source-marker, so role = `deliverable`, and the existence check is **skipped**.

**The result:** Goals that propose removing or cleaning up a non-existent file pass the premise check. The bug-3 plan: "Remove outdated validation logic in the legacy input handler. Delete the `temp_bug3_fix` utility functions. Clean up deprecated environment variables used solely for the Bug-3 workaround." — no source-marker in the lookback window, so `utils/legacy_helper.py` (the 06-03 plan) and `temp_bug3_fix` (the 06-04 plan) were both treated as deliverable and never existence-checked. Both files don't exist on disk. The gate passed.

## The proposed one-line fix

In `goal_proposer.py:977-980`, expand the filter to also include deletion-shaped deliverables:

```python
# Current
return [
    p for (p, role, exists) in _path_claims.classify_and_check(_claim_text)
    if role == "source" and not exists
]

# Proposed
_DELIVERY_VERBS = frozenset({"remove", "removing", "removes", "removed",
                              "delete", "deleting", "deletes", "deleted",
                              "drop", "dropping", "drops", "dropped",
                              "clean up", "cleanup"})
def _is_deletion_shaped(text, path):
    """A path classified as deliverable but preceded by a deletion verb is
    an implicit claim that the file currently exists. Run the negative check."""
    tokens = _path_claims._WORD_TOKEN.findall(text)
    for i, tok in enumerate(tokens):
        if tok == path or tok.endswith("/" + path.rsplit("/", 1)[-1]):
            lookback = tokens[max(0, i-5):i]
            if any(t.lower() in _DELIVERY_VERBS for t in lookback):
                return True
    return False

# Gate becomes:
suspicious = [
    (p, role, exists) for (p, role, exists) in _path_claims.classify_and_check(_claim_text)
    if (role == "source" and not exists)
    or (role == "deliverable" and not exists and _is_deletion_shaped(_claim_text, p))
]
```

A non-existent file at the start of a removal goal is a **confabulation signal**, not completion evidence. The proposer should reject or flag the goal for review.

## Why this is a "fix-completion-detection" reference, not its own skill

The class is *proposer premise verification*, which is broader than completion detection. But the existing `fix-completion-detection` skill is the closest umbrella — it documents the cumulative-context fix (ENG-2026-0528-002), the success-criteria three-layer fix (2026-06-01), the per-shape proposer feedback loop, and the proposer's `_build_ground_truth_block()`. The deletion-blind-spot is a sibling fix in the same class. A standalone umbrella skill would be premature — there's only one grounded instance (bug-3) and the code fix is a single call-site change. If a second instance surfaces (e.g. a "refactor X" goal that confabulates an existing file's name), that's the signal to consolidate into a `references/path-claims-classification-gaps.md` series.

## The lesson (general, not just deletion-claims)

The premise-verification gate at `goal_proposer.py:977-980` is **verb-shape-blind**. It treats "read X" and "write X" differently (the former triggers existence check, the latter doesn't), but the boundary between read-shape and write-shape is drawn by a 5-token lookback that's *direction* of action, not *implicit claim about current state*. Any goal verb that asserts a file's current state — including "remove", "refactor", "fix", "patch", "rename" — has the same blind spot.

A more robust fix would be: for every path mentioned in the goal text, regardless of role, run a *claim-extraction* check that asks "is the goal asserting this file currently exists in a specific shape?" If yes, verify the assertion. If no (purely additive: "create X with content Y"), skip.

The simpler one-line fix above is the *minimum viable* correction. The general fix is a deeper refactor of `classify_and_check()` that should not be attempted in a calibration turn.

## Status

- **Discovered:** 2026-06-04 19:25 PDT
- **Code fix proposed:** not yet implemented. Out of scope for the calibration turn that surfaced it. The bug-3 goal is `abandoned` in `~/athena_memory.db` so there's no live goal blocked on this fix.
- **Grounds for confidence:** the bug-3 plan's content was LLM-generated against fictional targets, the proposer passed it, the verifier caught the path-mismatch in the deliverable, and the human review caught the deeper issue. The pattern is reproducible by reading the code: a "remove X" goal with no path that exists can be constructed and the gate will pass it.
- **Where to look next session:** the same call site has the same blind spot for `classify_path_role()` returning `deliverable` for verbs in the `_DELIVERABLE_PRECEDERS` set (lines 57-73 of `path_claims.py`). The fix above addresses deletion; a future pass would extend to refactor/fix/patch verbs.

## Related

- `path_claims.py:109-133` — `classify_path_role` (the role-classifier with the 5-token lookback)
- `path_claims.py:142-152` — `classify_and_check` (the convenience wrapper that returns `(path, role, exists)`)
- `goal_proposer.py:977-980` — the gate that filters for `role == "source" and not exists`
- `references/goal-pipeline-diagnosis.md` — sibling fix document for the completion-detection side of the same pipeline
