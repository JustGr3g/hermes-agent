---
name: verify-substrate-before-action
description: "Before any write/edit/assertion, run a 30-second ground-truth pass on the substrate. Catches the dominant failure mode in this codebase: acting on inferred context (skills_list, recent file reads, last-edited directory) instead of verified state (active env, live process, real config)."
when_to_load: "Use before: writing a plugin, skill, hook, or config file; listing 'what I have access to'; asserting capability/availability claims about Greg's environment, credentials, or accounts; picking a target file or directory for an edit; claiming a service is running, listening, or configured; or any time the cognitive cycle's reflection label might be substituting for a measured check."
---

# Verify the substrate before acting on it

## The pattern

Every failure in this codebase's recent history has the same shape: **acting on a model of the world instead of a measurement of it.** Five distinct surface areas, all the same root cause:

1. **Capability assertions** — listing FMP/Polygon/Alpaca as 'have' because the user profile mentioned them, without `env | grep -i fmp` to verify. Greg corrected on 2026-06-04.
2. **Behavioral frames** — proposing 'calendar/availability signal' as a need, without verifying whether the frame itself is right. Greg corrected on 2026-06-04.
3. **Filesystem targeting** — writing to `~/.hermes/...` because the most recent file read was from there, without `echo $HERMES_HOME` to confirm the active tree. Greg corrected on 2026-06-04.
4. **Plugin loader semantics** — adding a tool to `_HERMES_CORE_TOOLS` and assuming the LLM would see it, without grepping the loader to confirm the gate. The opt-in allowlist `plugins.enabled` was the real gate.
5. **Patch tool surface** — attempting to edit a config file without checking the tool's protected-list. The guard correctly refused.

## The protocol

Before any write/assertion action, run **at most 5 lines** of ground truth:

1. **Where am I writing?** `echo $HERMES_HOME && python -c "import sys; print(sys.executable)"` — confirms the active tree and venv.
2. **What's actually here?** `ls -la <target-dir>` — confirms the directory exists and is what I think it is.
3. **What's the gate?** `grep -nE 'enabled|allowed|allowlist|opt.in' <loader-or-config-file>` — finds the load-bearing allowlist before adding to it.
4. **What does the loader actually do?** Run the discovery function directly in 5-10 lines of Python and assert the new thing surfaces. If it doesn't, the gate is somewhere else.
5. **What does the patch tool refuse?** Check the `Write denied: ... is a protected system/credential file` error pattern. Config files, credentials, and a small set of well-known files are off-limits without explicit human authorization.

If any of those checks returns surprising state, **stop and ask** rather than proceeding on the assumption.

## When NOT to apply

- Read-only actions (skill_view, search_files, terminal commands that observe) — verification overhead doesn't pay for itself.
- Mechanical multi-step work where the substrate has been verified earlier in the same turn.
- Already-verified state — if you confirmed the active tree, the loader's allowlist shape, and the patch tool's guard in the last 5 tool calls, don't re-verify.

## Anti-patterns to avoid

- 'I know it's at `~/.hermes/...` because that's where skills_list was sourced from' — wrong. skills_list reflects HERMES_HOME, not the working directory or recent file reads.
- 'I added it to the core list, so it'll be visible' — wrong for curated toolsets. The curated list is the load-bearing allowlist.
- 'I'll just write to config.yaml' — the patch tool will refuse. Don't burn a tool call discovering this.
- 'Greg mentioned trading-stack access, so the keys are probably in env' — wrong. Verify, don't infer.

## Verification: the 5-question preflight

Before any action that creates, writes, or asserts a fact about the substrate, answer YES to all 5:

1. Have I confirmed the active environment (HERMES_HOME, working directory, venv)?
2. Have I confirmed the target path exists and is what I think it is?
3. Have I found the load-bearing allowlist/gate the action has to satisfy?
4. Have I tested that the new thing actually surfaces in the resolved surface (not just in a list I edited)?
5. Have I checked whether the action is on the patch tool's protected-list?

A single NO means: stop, verify, then act.

## Relationship to existing skills

- `verify-before-declaring-outage` — the **outage** variant. Use that one for 'the system is broken' / 'X is dead' claims. Use this one for 'I have X' / 'X is at path Y' / 'I should write to Z' claims.
- `substrate-first` — the **provisioning** variant. Use that one for 'should I build or ask for' questions. Use this one for 'where exactly do I build/ask-for' questions.
