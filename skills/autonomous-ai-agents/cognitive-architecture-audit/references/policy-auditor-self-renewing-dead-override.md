# Policy Auditor — Self-Renewing Dead Override Fix (May 31, 2026)

## The Pattern

When the policy auditor retires an override for a non-existent tool **without also dismissing the source learned_pattern**, the next extraction cycle re-promotes it. The retire + re-create cycle runs every heartbeat.

## Symptom

- A `tool_failure_condition` override appears in `policy_overrides` with `status=active` even though the target tool does not exist in the registry
- `policy_audit` shows a `retired` entry for the same override earlier — the first retire was followed by a re-promotion
- The learned_pattern it references is still `dismissed=0`

## Root Cause

`audit_active_policies()` in `policy_auditor.py` checks `live_tool_names` for the retire-removed-tool path. When the tool is absent, it records an audit entry and settles the policy override, but does not dismiss the source learned_pattern. The next extraction cycle re-promotes it.

## Fix

In the retire-removed-tool branch of `audit_active_policies()`, after settling the policy override, also dismiss the source pattern via:
```
UPDATE learned_patterns SET dismissed = 1 WHERE id = ?
```

Added at `policy_auditor.py:200+`, with test `test_retire_dismisses_source_pattern`.

## Prevention

When designing any system that promotes derived artifacts (policy overrides from learned patterns), ensure the retirement path cascades to the source artifact. A derived artifact that can re-create itself from a surviving source is a self-renewing dead policy.
