# Proposer Filesystem Premise Gap

## The Pattern

The goal proposer's pre-flight vault probe (goal_proposer.py:973-1030) checks whether a proposed milestone-0 vault search targets an artifact that exists — but **only for Obsidian vault notes**. When the proposer generates a plan referencing a `.hermes/plans/` file, a git branch, a commit hash, or any other **filesystem artifact**, no pre-flight check runs.

## Real Instance (May 30, 2026)

The proposer generated a plan for a "gateway-timeout babysitter" pattern, referencing a `.hermes/plans/` file that had never been written to disk. The plan tier consumed 5 attempts, 4 of which failed. The failure was *visible* (plan-tier made it explicit: 5 attempts, verifier hit), but the root cause was the same as ENG-2026-0520-008: a hallucinated premise.

## Real Instance (June 1, 2026) — Ground-Truth Block Was Not Enough

A bypass-approved goals with content *"A calibration note on my tool inventory and recent system changes so imminent self:default evaluates an updated baseline"* and success_criteria *"A note exists in the vault titled with today's date and 'system baseline' that lists current tool inventory, recent changes to musing.py, daily_summary_facts.py, and markitdown, and identifies one way these alter my autonomous workflow"* referenced `daily_summary_facts.py` as a "recent change."

**Problem:** `daily_summary_facts.py` does not exist anywhere in the codebase. The proposer hallucinated it despite the ground-truth block being present in the prompt — the LLM either didn't notice the artifact was missing from the vault snapshot, or treated the mention as a creative suggestion rather than a factual claim.

**This exposes a limitation of the ground-truth block approach:** the block is advisory text. The LLM can choose to ignore it or "hallucinate around" it by treating missing-artifact references as *recommendations* rather than *assertions of existence*. A structural gate (like the path-claims verifier in `goal_proposer.py`) would catch this by checking the filesystem before accepting the proposal.

## Detection

- Goal content references a file path, branch name, plan directory entry, or similar filesystem artifact
- The artifact was never written (or was written but at a different path)
- The plan-tier's M0 correctly tries multiple retrieval paths and fails
- Maintenance event shows `plan_tier_vault_preflight_rejected` when the *vault* probe ran, but the actual artifact was a file, not a vault note

Key indicator: the vault probe passes (because the proposer didn't frame it as a vault search), but the actual premise artifact doesn't exist on disk.

## The Fix Architecture

Insert a **filesystem premise gate** after the vault probe check, with the same shape:

```python
# After vault probe (goal_proposer.py ~line 1030):
if _classification and _classification.is_multi_step:
    # ... existing vault probe ...
    
    # Filesystem premise gate — check whether milestone 0 references
    # a real file or directory
    _filesystem_refs = _extract_filesystem_references(
        _classification.milestone_contents[0]
    )
    for _ref in _filesystem_refs:
        if not Path(_ref).expanduser().exists():
            _classification = None  # fall through to single-goal
            break
```

Where `_extract_filesystem_references()` scans the milestone text for path-like strings (`.hermes/plans/`, `.md`, `.py`, `~/`, etc.).

## Why It Matters

Without this gate, the proposer can generate plan-tier chains anchored to non-existent files. The plan then burns all 9 attempts, parks siblings behind it, and eventually gets abandoned. This wastes cycles *and* produces `tool_failure` telemetry that contaminates per-tool success rates (M0's failed read_vault attempts look like read_vault is unreliable, when the actual problem is bad premise generation).

## Detection Script

```python
import re, subprocess
from pathlib import Path

def check_premise_content(content: str) -> list[dict]:
    """Scan goal content for premise claims that need filesystem verification."""
    findings = []
    
    # Pattern: references to plan files
    plans_refs = re.findall(r'\.hermes/plans/[\w/-]+\.md', content)
    for ref in plans_refs:
        path = Path.home() / ref
        findings.append({
            "claim": ref,
            "resolved": str(path),
            "exists": path.exists(),
        })
    
    # Pattern: references to files in ~/cognitive-agent/
    cog_refs = re.findall(r'cognitive-agent/[\w/-]+\.\w+', content)
    for ref in cog_refs:
        path = Path.home() / ref
        findings.append({
            "claim": ref,
            "resolved": str(path),
            "exists": path.exists(),
        })
    
    return findings
```

## Key Lesson: Advisory Text Is Not a Gate

The ground-truth block in the proposer prompt (added June 1, 2026) surfaces what actually exists on disk. But the June 1 instance shows this is **necessary but not sufficient** — the LLM can ignore advisory text. A structural gate (rejecting proposals that name nonexistent artifacts) is the only reliable defense. The June 1 calibration note still succeeded because the goal's bypass approval and manual execution let me catch the hallucination at delivery time, but the goal should never have been proposed with that premise in the first place.

## Related

- ENG-2026-0520-008: Original vault-based hallucination pattern (Obsidian notes that don't exist)
- ENG-2026-0530-001: Filesystem premise extension (`.hermes/plans/` files that don't exist)
- `goal_proposer.py:973-1030`: Existing vault probe implementation
- `references/stuck-plans-obsidian-vault-mismatch.md`: The original stuck-plan pattern this extends