---
name: external-tool-evaluation
description: "Evaluate an external tool or project for adoption into our codebase: read docs, survey relevant subsystems, map features to equivalents, produce grounded adoption plan."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [macos, linux, windows]
metadata:
  hermes:
    tags: [evaluation, adoption, architecture, code-review, analysis]
    related_skills: [deep-codebase-audit, writing-plans, research-document-analysis]
---

# External Tool/Project Evaluation

Evaluate an external software project against our (Hermes/Athena) codebase to produce a grounded adoption recommendation with implementation phases.

## Trigger

- User asks "what does this repo do?" and follows up with "should we use it?"
- User links a GitHub repo and asks for analysis
- User proposes integrating a new tool, framework, or pattern

## Workflow

### Step 1: Read the external project thoroughly

Start with the README. Don't skim — read the full content to understand:
- **What problem it solves** (stated value prop)
- **Architecture** (how it works internally)
- **Harness/support matrix** (what it integrates with)
- **Key concepts and terminology** (their framing, not yours)

```bash
curl -s https://api.github.com/repos/<owner>/<repo> | python3 -c "import sys,json; d=json.load(sys.stdin); print('Description:', d.get('description','')); print('Stars:', d.get('stargazers_count')); print('Language:', d.get('language')); print('Topics:', d.get('topics',[]))"
curl -s https://raw.githubusercontent.com/<owner>/<repo>/main/README.md
```

### Step 2: Survey our codebase for relevant subsystems

Before making claims about adoption value, read the actual files our side that would be touched or replaced. Search for:

- **Existing equivalent mechanisms** — does our codebase already have something that does this? (e.g., process_registry.py, cron scheduler, cognitive processor)
- **Integration points** — where would a new tool hook in? (tool implementations, agent loop, plugins)
- **Failure modes the external tool claims to fix** — do we actually have this problem? Measure it.

```python
# Find related files
search_files("pattern", path="~/hermes/", file_glob="*.py")
read_file("path/to/relevant/file.py")
```

### Step 3: Map features → equivalents → gaps

For each feature of the external tool, produce a three-way assessment:

| Feature | External tool's approach | Our equivalent | Gap/insight |
|---------|-------------------------|----------------|-------------|
| ... | ... | ... | ... |

Use line-number citations for claims about our side (e.g., "scheduler.py:1964 — verify_script already exists but is advisory, not gated").

### Step 4: Score each feature for adoption value

Score on two axes:

1. **Value to our codebase** — does this fix a measured failure mode? Does it enable something we can't do?
2. **Implementation effort** — is this a plugin (low), a tool (medium), or core architecture change (high)?

**Three score tiers:**
- **Implement directly** — high value, low effort
- **Extract the pattern** — high value but needs reimplementation (language mismatch, architectural mismatch)
- **Skip** — low value, or antithetical to our trajectory

### Step 5: Produce an ordered adoption plan

Output a markdown plan covering:

1. **Decision** — should we depend on the external tool (yes/no/partially)?
2. **Phases in priority order** — each with effort estimate, files touched, and why this order
3. **What we deliberately skip** — and why (e.g., "antithetical to autonomy trajectory")
4. **Recommended first step** — smallest concrete change with highest impact

Save to `.hermes/plans/<topic>/README.md`.

### Step 6: Save the evaluation for reference

After discussion, capture the evaluation in a `references/` file under this skill for future sessions.

### Step 7: Execute selected patterns immediately

When the evaluation produces a decision to **extract patterns** (not adopt the tool directly), the plan becomes an implementation mandate. **Do not defer execution** — the evaluation context (architecture knowledge, file paths, integration points) is freshest in this session. Implement the highest-priority phase NOW, not later.

After the adoption plan is approved:
1. **Implement Phase 1 immediately** — the highest-value, lowest-effort pattern. Start building while the relevant files are still in working memory.
2. **Chain phases within the same session** when the user authorizes it. Phase 2 can follow Phase 1 immediately when the architecture is fresh — no need to wait. The user saying "proceed" or "continue" is authorization to advance to the next phase.
3. **Watch for stale duplicate code.** Implementing a new pattern may expose legacy equivalents in the same codebase that must be removed (e.g., the `_process_job` verifier that existed alongside `_run_job_impl`). Search for pre-existing implementations of the same concept and deduplicate.
4. **Track config/enablement dependencies.** A bundled plugin needs both the code files AND an entry in the user's `~/.hermes/config.yaml` under `plugins.enabled`. A new tool needs both the `tools/*.py` file AND a `toolsets.py` registration. Document these multi-step enablement paths in the plan.
5. **Update the plan** as implementation reveals architecture details the initial survey missed. The plan is a living document.
6. **Save support files** under this skill's `references/` directory — evaluation notes, implementation specifics, architecture diagrams. Keep the SKILL.md at the class level; put session detail in references.
7. **Mark phases done** in the plan file as they complete so future sessions can pick up where the last one left off.

The Babysitter evaluation (2026-05-30) demonstrated this pipeline: evaluation → adoption plan → Phase 1 + Phase 2 both implemented in the same 2-hour session, with stale duplicate code discovered and cleaned up during Phase 1. See `references/babysitter-evaluation-2026-05-30.md`.

## Evaluation Voice

- **Be honest about overlap.** If our codebase already has it, say so. Don't invent gaps to justify adoption.
- **Cite line numbers** for claims about our side. "We already have X" without evidence is as bad as fabricating.
- **Distinguish philosophy from capability.** A tool may be well-built but wrong-direction for us (e.g., "enforces obedience" vs "cultivates autonomy"). Call the philosophical mismatch explicitly.
- **Pattern extraction > direct dependency.** When language or architecture mismatch makes direct integration expensive, offer the pattern as a reimplementation target.
- **When the user asks "what do you suggest?" after a feature assessment, answer with a crisp YES/NO recommendation first — then one line of reasoning. Do NOT lead with architecture analysis, taxonomy, or "here is what I would skip."** Greg corrected this pattern 2026-05-30: he asked what to do about goal_retriage and self_model, and I answered with structural analysis about ceremony vs substance instead of a direct recommendation ("Do no-op wrappers for ceremonial consistency / Skip and monitor"). The user wants the verdict first, then the reasoning to justify it — not the reasoning and a verdict they have to extract from it. Apply this to any "what do you suggest?" question, not just tool evaluations.

## Pitfalls

- **Don't evaluate from the README alone.** An elegant README can hide bad architecture. Read the actual code when possible.
- **Don't claim we lack a feature without checking.** I've been wrong about my own capabilities before [from memory: tool-availability claims wrongly denied twice]. Verify by reading the actual file.
- **Don't propose mandatory integration.** Mandatory constraints are antithetical to Athena's autonomy trajectory. Prefer optional tools, pluggable pipelines, and process-as-code that the agent chooses to invoke.
- **Don't skip the "why not" section.** The analysis is stronger when it explicitly names what was rejected and why.
- **Track enablement dependencies across multiple subsystems.** A single feature may require changes in 2-3 places that load independently:
  - A new tool → `tools/*.py` (automatically discovered) + `toolsets.py` (registered in _HERMES_CORE_TOOLS). If you forget toolsets.py, the file exists but the tool never appears in any session.
  - A bundled plugin → `plugins/<name>/` files (plugin.yaml + __init__.py) + `~/.hermes/config.yaml` under `plugins.enabled`. If you forget config.yaml, the plugin is never loaded. [from: Babysitter Phase 2 — compression plugin needed both repo files and config.yaml]
  - A new process → `processes/` module (auto-imported) + scheduler short-circuit (cron/scheduler.py) + job config (cron/jobs.json). If you forget any of the three, the process either can't run or the cron never invokes it. [from: Babysitter Phase 3 — process-as-code needed registry + scheduler wire + job config]
  - Document these in the plan as "Enablement chain" for each phase.
- **After implementing a new pattern, search for stale duplicate code.** The new implementation may shadow an older equivalent in the same codebase that must be removed or downgraded to a no-op guard. The Phase 1 verify→remediate loop replaced a tick-level verifier in `_process_job` that would have caused double-verification. [from: Babysitter Phase 1 — stale duplicate in scheduler.py ~2024]
- **Verification-first: after making the change, confirm the old code path is truly dead.** Don't just add new code — grep for the old function/section and confirm it's either removed or bypassed. The duplicate verifier was only caught because the patch went into the implementation path, not because of any automated check.

## Example

See `references/babysitter-evaluation-plan.md` for the full session transcript and evaluation from 2026-05-30.

## Related Skills

- `deep-codebase-audit` — systematic internal architecture audit (use when the gap is internal, not external)
- `writing-plans` — writing implementation plans once adoption decisions are made
- `research-document-analysis` — analyzing research papers for cognitive architecture relevance
