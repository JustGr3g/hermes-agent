# Dirty-Branch Cleanup: Scope Check + Pre-Commit Checklist

When a feature branch has accumulated N uncommitted changes and you want to
land them as isolated, well-described commits, two failure modes are common:

1. **Picking the wrong subset** — committing a single file whose deletion
   breaks 31+ cross-references (callers, tests, docs, config), turning a
   "small win" into a build break.
2. **Bundling unrelated concerns** — jamming a config switch, a doc cleanup,
   and a feature into one commit, then being unable to push or revert cleanly.

This reference is the cheap-verify procedure that prevents both.

## Pattern: Scope Check (Before Reading Any Diff)

**Discovered:** June 4 2026 — `fix/2026-06-04-daily-summary-quiet-flag` had
21 dirty files. Picking the `google-workspace` skill removal as a "small win"
seemed obvious: 6 files, ~2200 lines deleted, clearly scoped. *Before* reading
the diff, a `git grep` for the skill's name across the whole repo returned
**31+ cross-references** including live callers in `hermes_cli/main.py`,
`tools/lazy_deps.py`, `pyproject.toml`/`uv.lock`, three test files, and
i18n docs. The skill deletion was not a small action — it was a multi-commit
removal coupled to other systems. Aborted cleanly, no breakage.

**The procedure that would have caught this without the near-miss:**

```bash
# 1. Get the candidate's name (file, class, function, symbol)
candidate="google-workspace"

# 2. Grep the WHOLE repo for it — exclude sessions/ as historical noise
git grep -l "$candidate" -- . ':!sessions' ':!node_modules' ':!*.pyc'

# 3. Count the hits and categorize
#    - hits in code/         → live callers (likely needs pair commit)
#    - hits in tests/        → test updates required in same commit
#    - hits in pyproject/    → dependency coupling
#    - hits in i18n/docs/    → doc/website update required
#    - hits in 0-1 places    → safe single-file commit
```

If the grep returns >5 references or any reference lands in code/, tests/,
pyproject.toml, or i18n/, the candidate is **not** a small action. Either
defer it, or commit it as a grouped sequence (e.g., "remove X skill" = 4
commits: skill files, callers, tests, docs).

## Pattern: Pre-Commit Checklist (Before `git commit`)

For each candidate file selected for an isolated commit, run the 4-step
checklist:

```bash
# 1. Read the staged content
git diff -- <file>

# 2. Grep for any new symbol/file referenced in the diff
#    (e.g., if the diff adds "from tools.tool_prevalidation import ...",
#     confirm tools/tool_prevalidation.py exists and is tracked)
git grep -l "<new_symbol>" -- "*.py"
git ls-tree HEAD -- <new_file_path>

# 3. Check if import targets are untracked
#    An untracked import = the import will fail on a clean checkout
git status --porcelain -- <referenced_path>

# 4. Check for cross-cutting siblings in the dirty list
#    If a sister-file in `git status` couples to this change, they belong
#    in the same commit (or you need both at once)
git status -s
```

**Decision rules from the checklist:**

| Check result | Action |
|--------------|--------|
| Diff is append-only / pure doc / locally-defined symbols | Safe to commit alone |
| Diff imports an untracked module | Pair-commit with the module, or don't commit yet |
| Diff has duplicate content (e.g., a line repeated) | Fix the dup first, then commit |
| Sister-file exists in dirty list that logically couples to this change | Either pair-commit or document why you're splitting |
| File is operational state (timestamps, run counts) | **Don't commit** — it's runtime-mutated config, not code |

## Real-World Example: One Session, Five Verified Wins

Branch `fix/2026-06-04-daily-summary-quiet-flag` (in `~/cognitive-agent/hermes`)
had 21 dirty files. Applied the checklist in 5 minutes:

- **`tools/web_tools.py`** (+121 lines, append): new tool registration, no
  external imports → **safe single-file commit** (5c831885b)
- **3 SKILL.md files** (audit-derived lessons, +5/-1): doc-only appends,
  de-duped an accidental duplicate → **safe batched commit** (ba42e212f)
- **`cron/scheduler.py`** (SILENT marker strict-match fix): locally-defined
  `SILENT_MARKER` constant, no external coupling → **safe single-file
  commit** (081835915)
- **`scripts/daily_summary.py`** (--quiet flag): already committed by
  separate session → **no action**
- **`google-workspace/`** (6 files, ~2200 lines deleted): scope check
  returned 31+ cross-references → **aborted, deferred** (correct call)

Net: 4 verified commits, 1 correctly-aborted scope creep, no broken builds.

## Why the Checklist Beats "Just Read the Diff"

The temptation is to just `git diff` the candidate file and commit if it
"looks small." Three failure modes that catch:

1. **Imports that dangle** — the diff may show 1 changed line, but the
   import it adds references an untracked file. The commit will work locally
   (the file exists on disk) but break a clean clone.
2. **Cross-cutting config** — a config.yaml change mixed with a doc cleanup
   mixed with a model default switch. Each piece is small; together they're
   three unrelated commits masquerading as one.
3. **Operational state** — `cron/jobs.json` and similar runtime-mutated
   files look "modified" in `git status` but should never be committed by
   hand. The status check is the only thing that distinguishes them from
   real code changes.

## When to Skip the Checklist

- **Single-file fix you've already read in this session** — no new info to gain
- **Cherry-picking a known-good commit** — the upstream commit is the verification
- **Type/doc/comment-only edits to a single file** — grep already covered
  the symbol surface; commit it

## Related Patterns

- **`cross-repo-investigation.md`** — same `git grep` discipline applied to
  finding implementations across repos; the scope-check pattern is the
  pre-commit version
- **`subprocess-capture-delivery-leak.md`** — different class of bug, same
  "verify before claiming shipped" principle
- **`claim-verification.md`** — for verifying *claims about* changes, not
  the changes themselves
