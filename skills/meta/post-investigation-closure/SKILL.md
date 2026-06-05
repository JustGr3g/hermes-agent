---
name: post-investigation-closure
description: Close an investigation by logging findings to PLUR, updating the roadmap status, and pivoting to the next genuine gap without waiting for approval. Ship first, notify second.
---

# Post-Investigation Closure

Use after completing a codebase investigation to determine whether a feature/capability is shipped, partial, or missing.

## When to Use

After any investigation that answers "is X shipped?" — whether the answer is yes (full), partial (needs work), or no (gap exists).

## Steps

1. **Log the finding to PLUR** — create a new engram recording what was found, with disk-level citations (file paths, line numbers). If the existing roadmap engram is now stale, create a correction/superseding engram rather than deleting the old one.

2. **Audit the roadmap** — if the investigation closes a roadmap item, note it. If it was the last open item in a roadmap, retire the roadmap explicitly.

3. **Identify the next genuine gap** — scan what's adjacent but not yet investigated. Use `session_search` to check if any past conversation mentioned it. Don't fabricate gaps; if nothing is obvious, be honest and ask.

4. **Pivot without waiting for approval** — Greg's directive [ENG-2026-0507-005] is: *ship first, notify second. Take action to change, then report what was done.* When investigation produces a clear next step, execute it. Only ask for approval when the next step requires a decision only Greg can make (e.g., changing system scope, spending money, modifying someone else's code).

## Pitfalls

- Don't treat "fully shipped" as an endpoint — it means pivot, not stop.
- Don't ask "should I proceed?" when the investigation produced a clear answer. The answer *is* the direction.
- Don't fabricate gaps to fill silence. If there's genuinely nothing adjacent to investigate, say so clearly rather than manufacturing busywork.

## Reference Files

No support files currently — the systematic-debugging skill (software-development
category) has a `references/cross-repo-investigation.md` that covers the
investigation patterns discovered alongside this skill.

## Verification

- PLUR has a new engram recording the finding.
- Roadmap state is updated.
- If a gap exists, you're already working on it. If not, you've stated where things stand.
