# Success-Criteria Blind Spot — 2026-06-01 Investigation

## The Gap

Goal objects carry a `success_criteria` field (text description of "what observable state means this goal is done"). ~200 goals in the DB have populated criteria. **Neither completion detector reads this field.**

## Evidence

### DB prevalence
```sql
SELECT COUNT(*) FROM goals WHERE success_criteria != '' AND success_criteria IS NOT NULL;
-- → 200
```

### Common criteria patterns (from live DB)
```
"A saved diagnostic note exists in the notes vault that ranks each open needs_review goal..."
"A note titled 'Open engineering queue — next step recommendation' exists in the vault..."
"A saved calibration note in the vault exists that names the specific mechanism..."
"A code change at cognitive_cycle.py exists that adds a validation guard..."
"A telegram message containing the name of the missing integration hook..."
"A note titled 'Active drives vs static aspirations' exists in the vault..."
"A saved note in the vault titled 'Completion-claim pattern analysis' exists..."
"A saved note titled 'Phase Completion Reversal Analysis' exists in the vault..."
```

All of these map cleanly to tool-specific patterns:
- `save_note` → "saved note titled X exists" / "saved note in vault exists" / "note titled Y exists"
- `send_message` → "telegram message containing X"
- `opencode_edit` → "code change at PATH exists"

### Which detectors miss it

| Site | Sees goal.content | Sees success_criteria | 
|---|---|---|
| `_deterministic_completion_check` (line 395) | ✅ | ❌ |
| `_check_goal_completion` (LLM detector, line 2533) | ✅ | ❌ |
| Pipeline `_build_deliberate_prompt` (deliberate.py:236) | ✅ | ❌ |
| Augmented target builder (line 1030) | ✅ | ❌ |

## Impact Scenario

Goal text: "Investigate the skill library"  
Success criteria: "A saved note in the vault exists that names the stale entry and the fix applied"

1. Tick 1: LLM fires `opencode_run` to search the skill directory — returns list of 150 skill entries.  
2. Tick 2: LLM fires `save_note` with the audit finding — note saved successfully.  
3. Tick 3: `_deterministic_completion_check` runs. Checks: goal.content has "save_note with title" pattern? No. Has telegram pattern? No. Has retrieval verb? Maybe, but cumulative < 200 chars. → returns None.  
4. Tick 4: `_check_goal_completion` runs. LLM sees tool=save_note, result=note saved, goal="Investigate the skill library". LLM thinks: "The goal says investigate, not 'save a note'. The note was saved, but investigation could continue." → NOT complete.  
5. Ticks 5-12: Goal keeps looping. Hits attempt ceiling 12. → **falsely abandoned with a completed artifact in the vault.**

The artifact is there — the goal is in `abandoned` status.

## Fix Architecture

Three layers, each addressing a detector:

### Layer 1: Deterministic matcher (`cognitive_cycle.py`, ~line 271)
Regex table maps (tool_name) → (criteria pattern) → (summary template). Runs at end of `_deterministic_completion_check`, before `return None`. Parameters: `goal_criteria: str = ""` added to function signature.

### Layer 2: LLM detector prompt injection (`_check_goal_completion`)
`criteria_block` built from `getattr(goal, "success_criteria", "")`, injected before decision instructions. Includes principle: "use criteria as THE definitive test — the criteria ARE the goal's own definition of done."

### Layer 3: Pipeline Deliberator prompt injection (`_build_deliberate_prompt`)
Add `success_criteria` line to the goal_block f-string, after `horizon`.

## Ordering within `_deterministic_completion_check`

The success-criteria check runs AFTER all tool-specific fast paths:

1. send_message + telegram pattern → done (existing)
2. save_note + title match → done (existing)
3. retrieval tool + single-call threshold → done (existing)
4. retrieval tool + cumulative threshold → done (existing)
5. **success_criteria match → done (NEW — 2026-06-01)**
6. return None → fallthrough to LLM detector

This ordering preserves the existing fast-paths as priority. The criteria matcher is the last-resort catch that catches goals where goal.content is too vague to match a tool-specific pattern but success_criteria is precise.

## Status (2026-06-01 18:47 PDT)

- **Layer 1:** APPLIED — `_SUCCESS_CRITERIA_RULES` table + `goal_criteria` param wired at call site
- **Layer 2:** DESIGNED, NOT APPLIED — file offset shifted after Layer 1 edits; needs fresh `read_file` for correct line numbers
- **Layer 3:** DESIGNED, NOT APPLIED — same offset issue

## Verification approach

After all layers are applied, run:
```python
# Create a goal with success_criteria matching a known pattern,
# fire the corresponding tool, verify deterministic check fires.
```