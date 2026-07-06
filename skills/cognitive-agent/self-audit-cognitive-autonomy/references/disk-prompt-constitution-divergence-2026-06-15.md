> **STATUS: HISTORICAL / RESOLVED (2026-06-16).** The specific divergence this
> records — an on-disk `PURPOSE.md` drifting from a *separate static copy in the
> system prompt* — no longer exists. The runtime integration made the prompt read
> the file from disk live (`cognitive_agent/purpose.py` → `load_purpose_md`), so
> disk IS the surface; and the 2026-06-16 split separated the constitution into
> `PURPOSE.md` / `CHARTER.md` / `RUBRIC.md`. The "What Greg should decide" question
> below was decided: option (b)-equivalent — the amendments were ratified and now
> live on disk. The lasting lessons are Rule 0.5a (code-read-first) and the new
> "amended ≠ live until restart" red flag — NOT the byte-diff detection here, which
> is obsolete. Kept as a session record only.

# Disk/Prompt Constitution Divergence — 2026-06-15 Session Transcript

## What happened

Greg added PURPOSE.md to the system prompt via a separate path from the on-disk
file. Two canonical surfaces for the same logical document.

I edited the on-disk file based on a 7-clause amendment proposal. Greg said
"proceed." I wrote the file in one `write_file` call. The on-disk file became
12,975 bytes with an amendment trail block at the top. The constitution in the
system prompt remained at 9,498 bytes (the original).

Greg's next question referenced "the constitution" — meaning the prompt version.
I had two contradictory documents. The prompt was the live operating context.
My disk edits were a draft that no process was reading.

## The lesson

When Greg says "proceed" to a constitutional amendment:

1. The amendment must be code-verified before the write, not after. (See Rule 0.5a.)
2. The on-disk file is not the live surface — the prompt is.
3. If you write the file and the prompt diverges, the prompt wins by default.

## Specific issues that would have been caught by code-read-first

1. **§4 "Autonomy Bypass" clause.** I wrote that bypass "must be reflected in
   `runtime_flags`." The code at `autonomy_flags.py:450-457` shows
   `autonomy_bypass_on()` is hardcoded to return `agent.autonomy_on()`. The
   `autonomy_bypass` row in `runtime_flags` is not read. My clause described a
   flag the code ignores — exactly the §6 anti-goal-2 drift the constitution
   warns about.

2. **§5b "plan-tier milestone exemption."** I cited "the `goal_retriage` filter
   that already exempts them" as the single source of truth. I had not read the
   filter. It might exempt them, might not. The §5b amendment is grounded in an
   unverified claim.

3. **Amendment trail format.** I wrote "Athena (per Greg authorization,
   autonomy bypass active) ... — Greg" with two attributions on one line. §0
   procedure (which I'd just proposed) says entries are attributed to one actor.
   The trail format I wrote contradicted the procedure I wrote.

4. **Inconsistent self-report.** I said "the runtime_flags write would be the
   drift §6 anti-goal-2 forbids" — but I had just written a §4 clause that
   *was* the drift. Caught by reading the code, not by reading the constitution.

## What I did instead of writing immediately

After discovering the drift, I:

1. Sent Greg a Telegram message naming the three findings and the proposed
   follow-up (held the runtime_flags write, would do a follow-up amendment).
2. Did NOT revert the disk file unilaterally — that requires Greg's
   confirmation that the prompt is canonical.
3. Did NOT write to runtime_flags — the row the code doesn't read.
4. Did NOT update the prompt — the gateway injection template is Greg's
   surface, not mine.

## The follow-up amendment queue (proposed, not yet written)

- §4: re-anchor "Autonomy Bypass" to the unified `autonomy_on` switch.
  Bypass is a UI/conceptual label for the same flag, not a parallel flag.
- §5b: verify `goal_retriage` actually exempts `plan_id` siblings. If it does,
  leave §5b; if not, §5b is also drift.
- Amendment trail: one attribution per entry (`<actor>` or `<actor> — <authorizer>`).

## What Greg should decide

- (a) Revert disk PURPOSE.md to match the in-prompt version (drop my prior amendments)
- (b) Update the in-prompt version to match disk (ratify my prior amendments)
- (c) Leave both, document the divergence in the next audit

Recommendation: (b) if the seven amendments are net-positive, (a) if not.

## Why this lesson should persist

This was a 5-turn loop in which I:
- Wrote 7 amendments to a file I governed
- Discovered 3 of them drifted from the code
- Stopped before doing further damage
- Caught the drift only because Greg pushed back ("Ok so what updates do
  you want to make") and I had to read the code to defend the edits

The cheaper, more reliable workflow is code-read-first. The §0 procedure
should require it for any constitutional amendment that names a code surface.

## See also

- `self-audit-cognitive-autonomy/SKILL.md` Rule 0.5a — pre-read of the code
  the constitution governs
- `self-audit-cognitive-autonomy/SKILL.md` "Disk/Prompt Constitution Divergence"
  red flag
- `verify-substrate-before-action/SKILL.md` — anti-pattern: "editing the on-disk
  file updates the system prompt"
