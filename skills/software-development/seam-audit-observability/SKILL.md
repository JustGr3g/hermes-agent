---
name: seam-audit-observability
description: When a tool records a short status code but discards the rich context that produced it, the next "why is the system failing?" investigation becomes log archaeology. The fix is small: thread a context parameter through the recording path, write it into a queryable column, lock with a contract test. Use when a failure pattern shows up in tool_outcomes / outcomes / error logs without a path to its cause.
---

# Pattern: Seam-Audit Observability

## When to use

- A failure pattern shows up repeatedly in DB tables (e.g., `tool_outcomes` with `success=0` for a synthetic row, or `error=None` where context should be present).
- The investigation of "why is this thing failing?" requires reading multiple log lines, joining tables, or running an LLM on raw output.
- A helper function takes a `reason` parameter and the value is partially captured — the short code makes it to a column, but the rich detail is in a string that's only logged or only stored on a different table.
- A diagnosis that should be one SQL query takes 30 minutes of file/log archaeology instead.

## The five-step pattern (in order)

### Step 1: Find the recording seam

A "seam" is the place where a system records its state to a persistent store without a verification path. Common shapes:
- `record(success, error)` where `error` is `None` on a synthetic row.
- A helper that builds a status string and writes only the string, not the context.
- A wrapper that catches an exception and returns a `False` success flag with the exception discarded.
- A log line that says "synth:foo_resolution" with no payload.

Find the seam by querying for the failure pattern. `SELECT tool_name, COUNT(*) FROM tool_outcomes WHERE success=0 GROUP BY tool_name ORDER BY COUNT(*) DESC LIMIT 10` is usually enough to surface the dominant pattern. Then `grep` for the literal string in the codebase to find where it's written.

### Step 2: Verify the discards

Read the recording path. Confirm the rich context is *available at the call site* but *not flowing to the persisted column*. The mismatch is the gap. A common tell:
- A `CycleOutcome.skipped_reason` field that has `f"tool_select_failed: {e}"` — the rich context is constructed but not written anywhere queryable.
- A try/except that builds a `reason` and a `context` and only writes `reason`.
- A struct that has both `code` and `details` fields, but the persistence only takes `code`.

### Step 3: Thread the context through

Smallest possible change:
- Add an optional `context: Optional[str] = None` parameter to the helper signature. Backward-compatible: existing call sites that don't pass it keep working.
- At each call site, pass the rich context. If the call site is in an exception handler, pass `str(e)[:N]`. If the call site is in a conditional, pass the relevant fields.
- Write the context into a queryable column. `args_summary="reason=X | context=Y"` is a fine shape — `reason` is the short code (cheap to group by), `context` is the rich detail (cheap to grep).
- Cap the context at a sensible bound (e.g., 460 chars) to stay under column width budgets.

### Step 4: Write a contract test that locks the behavior

The contract test asserts the *invariant* the seam is supposed to provide. For an observability seam, the invariants are:
- Context is captured into a queryable column.
- Backward-compat: helper still works without context (existing call sites must not break).
- Cap is enforced: a 1000-char context produces a 460-char substring, not 500, not 1000.
- The helper never raises on store failure (preserves the "best-effort" contract from before).

Each invariant is a separate test. The test file lives in `tests/<scope>/test_<seam_name>_audit.py`.

### Step 5: Run the verification gate

Standard suite. The change is small enough that a focused pytest is the gate. Verify:
- New tests pass.
- Pre-existing tests in the file pass.
- Adjacent subsystem tests pass (no regression in the call sites).
- Full subsystem suite stays green.

A live verification is the next failure to occur through the recording path — when it does, query the column and confirm the new shape is in the data.

## What this pattern replaces

- The "the diagnostic info is in the log file" pattern that requires log archaeology.
- The "I'll just add a print statement" pattern that doesn't survive a restart.
- The "the failure is in the LLM response" pattern where the rich context is in a different table than the failure code.
- The "I have to read the code to know what failed" pattern where the recording path is opaque.

## Pitfalls

- **Don't change the column type.** Adding a JSON column or restructuring the table is a v2 change. Stay with TEXT/args_summary. The context is a free-form string; the consumer can parse it later.
- **Don't lose the short code.** The `reason` short code is what makes the failures *group-able*. Keep it as the column's primary key (e.g., `tool_name="synth:no_tool_resolution"`). The context is the payload.
- **Don't cap the context too tight.** 460 chars is a soft cap. If the failure is "TypeError: cannot unpack non-iterable NoneType object at line 1842 of foo.py" — that's 60 chars and fits. If the failure is a 2KB stack trace, the cap kicks in and you lose the tail. Acceptable trade; the cap is for the column width, not for the diagnostic completeness.
- **Don't skip the backward-compat test.** Existing call sites must keep working. The new parameter is optional. A test that calls the helper without `context` and asserts success is the guard.
- **Don't trust the column width budget by inspection.** Look at the actual rows in the column. A 1000-char cap might exceed the column type's width, or might be far below the practical limit. Use the data to set the cap.

## Verification

The pattern is self-verifying: every observability-seam fix has a recording helper, a context parameter, four contract tests, and a verification gate. If a fix lacks any of these, the pattern wasn't followed.

## Reference case

`tests/cognition/test_synth_outcome_audit.py` — the contract test for the `_record_synth_outcome` fix. Four tests:
1. `test_synth_outcome_writes_context_to_args_summary` — the core invariant
2. `test_synth_outcome_works_without_context` — backward-compat
3. `test_synth_outcome_caps_long_context_at_460_chars` — the cap
4. `test_synth_outcome_swallows_store_exceptions` — best-effort contract preserved

The fix is at `cognitive_cycle.py:2341-2389` (`_record_synth_outcome` extended with optional `context` parameter) and the four call sites are at lines 919-927, 1157-1161, 1247-1250, 1394-1398. 756/756 cognition tests pass after the change.

Before the fix, `args_summary` was `None` for all `synth:no_tool_resolution` rows (41 in the 7-day window pre-fix). After the fix, the same rows carry the rich context that produced the failure. The next "why is this goal dying?" investigation is one SQL query against `args_summary` instead of a 30-minute file walk.
