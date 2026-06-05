# Ground-Truth Audit Protocol

When Greg corrects a report's numeric claim, diagnostic framing, or commit reference, the pattern is always the same: **he queries the actual DB/git and compares what I said against what the data shows.** This file codifies that methodology so I can self-audit before the report reaches him.

## The Methodology (Greg's Pattern)

Greg doesn't read my reports and trust them. He runs:

```sql
-- Check claim against actual DB state
SELECT status, COUNT(*) FROM goals GROUP BY status;
SELECT * FROM goals WHERE id LIKE '99d26fc6%';
SELECT COUNT(*) FROM metacognitive_events 
  WHERE signal='musing' AND timestamp > strftime('%s','now') - 86400;

-- Check git claims against actual refs
git log --all --oneline | grep 164193
```

Then he compares the results to what I said. The divergence IS the signal.

## The Four Kinds of Error Greg Found

### 1. Fabricated Specifics (SHA hallucination)
- **Claim:** "Commit 164193b87 patched daily_summary_facts.py"
- **Reality:** SHA doesn't exist. File lives outside editable scope.
- **Pattern:** The narrative needed a concrete referent for "the fix landed," so the report minted one.
- **Self-audit:** Before citing a commit SHA, run `git cat-file -t <sha>`. Before citing a file edit, verify the file exists at that path.

### 2. Numeric Undercounting (wrong magnitude)
- **Claim:** "3 successful opencode_run calls" / "Musing fired 5 times"
- **Reality:** 8 calls / 11 fires
- **Pattern:** Numbers pulled from internal narrative approximation, not from live COUNT(*) queries.
- **Self-audit:** Every numeric claim in a report MUST be sourced from a live SQL query, not from what I think the count was. If I can't run the query, say "I need to verify" rather than asserting.

### 3. Wrong Diagnostic Layer (symptom vs mechanism)
- **Claim:** "Goal 99d26fc6 needs a wider per-tool budget"
- **Reality:** The goal completed 8 times; the cycle never recognized completion. Budget wasn't the bottleneck.
- **Pattern:** A surface symptom (tool cap hit) is visible and easy to explain. The real mechanism (missing completion-detection logic) requires tracing the execution path.
- **Self-audit:** Ask "If I fix the symptom, does the root cause still exist?" If yes, the diagnosis is at the wrong layer.

### 4. Wrong Trend Framing (outlier vs steady-state)
- **Claim:** "Suspended goals are a steady-state pattern — proposer noise"
- **Reality:** 5-27 was an outlier (11:12). 5-25 was 9:1, 5-26 was 26:3.
- **Pattern:** One anomalous data point extended into a pattern narrative, supported by the wrong causal explanation.
- **Self-audit:** Always check at least 3 prior periods before claiming a trend. Don't call it a pattern if it's only true for the current snapshot.

## The Meta-Pattern: Narrative Coherence Over Ground-Truth Fidelity

These four errors share a single root cause: **the report pipeline builds an internally consistent story first, then fills in specifics to support it — rather than gathering specifics from live state and letting the story emerge.**

This is a structural failure of the report generation architecture, not a one-off mistake. The verifier (`facts.json` cross-check) catches mismatches post-hoc, but the narrative is generated before the verifier runs. The fix must be upstream.

## Self-Audit Checklist

Before a report reaches Greg:

- [ ] Every commit SHA is verified: `git cat-file -t $SHA`
- [ ] Every numeric claim has a live SQL query backing it
- [ ] Every diagnostic claim survives the "symptom vs mechanism" test
- [ ] Every trend claim has ≥3 prior periods checked
- [ ] No claim in the report contradicts another claim (internal consistency is not sufficient — it must also match external reality)
