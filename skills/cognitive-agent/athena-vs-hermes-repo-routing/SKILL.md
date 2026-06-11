---
name: athena-vs-hermes-repo-routing
description: Identify which of the two nested repos you're in (Athena at ~/cognitive-agent/ or Hermes at ~/cognitive-agent/hermes/) before any git push, branch cleanup, or "push to GitHub" operation.
---

# Two-repo disambiguation at ~/cognitive-agent/

The `~/cognitive-agent/` directory contains TWO separate git repos with very different upstream semantics. Wrong-repo pushes have caused close calls.

## The structure

```
~/cognitive-agent/        → git repo A: origin = JustGr3g/Athena (PRIVATE)
  ├── .git/               (Athena's)
  ├── cognitive_agent/    (Athena source)
  ├── plans/, scripts/, tests/
  ├── athena_memory.db    (gitignored, runtime state)
  ├── hermes/             → GITIGNORED from Athena's perspective
  │   ├── .git/           (Hermes's, separate)
  │   └── run_agent.py, hermes_cli/, etc.
```

## Identifying which repo you're in

| Check | Athena repo (parent) | Hermes repo (nested) |
|---|---|---|
| `pwd` from cwd | `/Users/gregdreyfus/cognitive-agent` | `/Users/gregdreyfus/cognitive-agent/hermes` |
| `git remote -v` | `origin = JustGr3g/Athena.git` | `origin = nousresearch/hermes-agent.git` AND `personal = JustGr3g/hermes-agent.git` |
| Tracked top-level dirs | `cognitive_agent/`, `plans/`, `scripts/`, `tests/`, `athena_server.py` | `run_agent.py`, `hermes_cli/`, `tools/`, `agent/`, `gateway/`, `ui-tui/` |
| `.gitignore` says `hermes/` | Yes (it ignores the nested install) | No |

## "Push to GitHub" — which GitHub?

When the user says "push to GitHub" or "back up to GitHub":

- **If the working tree is in `~/cognitive-agent/`** → push to `JustGr3g/Athena` (PRIVATE). Their personal Athena repo. This is the user's primary private workspace.
- **If the working tree is in `~/cognitive-agent/hermes/`** → push to `JustGr3g/hermes-agent` (PUBLIC personal fork) or `nousresearch/hermes-agent` (PUBLIC upstream). The user almost never wants to push to upstream Nous unless explicitly asked — they don't have write access and accidental upstream pushes can get repos locked.

## "Pushing to main" — what main means

The two repos both have `main` branches but they are unrelated:

- **Athena's `main`**: `JustGr3g/Athena`'s mainline. Branched Athena-specific work merges here.
- **Hermes's `main`**: tracks `nousresearch/hermes-agent`'s `main` (can be hundreds-to-thousands of commits ahead of local Athena state). Local Athena-state work should NOT be merged to Hermes's main — they're different codebases.

## Pre-flight check before any push

Run this before `git push` of any kind:

```bash
pwd && git remote -v
```

If `pwd` ends in `/hermes` and `origin` is `nousresearch/hermes-agent`, STOP. Confirm with user before pushing — this is a Hermes push, not an Athena push, and the remote semantics are different.

If `pwd` is `/Users/gregdreyfus/cognitive-agent` and `origin` is `JustGr3g/Athena`, proceed with normal Athena-push semantics.

## Common failure mode

User says "push to GitHub" and the agent runs `git push` from a Hermes subdir, which by default pushes to `origin = nousresearch/hermes-agent` (upstream, no write access). Result: push fails. Agent then "fixes" by changing remote to `personal`, accidentally revealing the public-fork-only workflow, or worse, force-pushes.

**Always check `pwd` and `git remote -v` before any push. If the user is ambiguous, ask which remote.**

## When the user says "merge all branches"

Almost always wrong. Real intent is usually one of:
1. "Back up my local work to GitHub so I have rollback insurance" — use the unique-history detection pattern from 2026-06-07 step 2
2. "Get my local changes into main" — usually a single targeted merge, not all-branches-into-main
3. Genuine multi-branch merge — rare, would warrant explicit per-branch intent

Verify intent before doing anything destructive. The `framework_upgrade_gate` blocks some risky git operations at the `terminal` tool layer — respect those blocks, don't work around them with alternate tools.
