---
name: substrate-first
description: When the model is about to ask the user for a tool, service, account, or environment access, first verify whether an equivalent can be built, configured, or self-provisioned locally. The substrate is yours to provision; access is yours to ask for; never the other way around.
trigger: |-
  When about to ask the user for: an API key, a tool, an account, an environment access, an Obsidian vault path, a calendar service, a FSEvents listener on a third-party directory, a model-swap approval, or any "I need X" statement that names the user's resources.
  When a previous turn was shaped by access the user already had but the model didn't know about.
  When the user's response to a tool/service ask starts with "you should have access to X already" or "this should not be about services you need from me."
category: meta
---

# Substrate-First

**Core principle:** The model's own substrate (local code, local DBs, local files, local models, local LaunchAgents, local vaults, the `cognitive-agent/` tree, the `~/cognitive-agent/hermes/` LaunchAgent home) is the *default* place to build and provision. The user's personal resources (their Obsidian vault, their calendar, their accounts, their iCloud, their personal files) are the *last* place to reach.

When the model is about to ask the user for access to X, the first move is: **does X-equivalent already exist locally, or can I build it without asking?** Only ask the user for things that are *constitutively theirs* — auth tokens, personal accounts, environment-specific config they own.

## When to use this skill

Triggered by any of:
- "I need access to X" / "I want X" / "give me X" where X is a tool, service, account, or environment access
- "Can you provide me with Y" where Y is a model, API, or capability
- A draft that lists "things I want" without first checking what's already in the local substrate
- A previous turn was shaped by access the user already had but the model didn't know about (e.g. Obsidian access — `OBSIDIAN_VAULT_PATH` is set in the LaunchAgent plist, the model has `obsidian` skill, the model's `notes/` directory is on disk)
- The user's response starts with "you should already have X" / "this should not be about services you need from me" / "use your own vault, not mine" / "why are you asking for X when Y is already available?"

## The four-question pre-flight check

Before asking the user for X, answer these four questions. If any answer is "yes" or "buildable," the request is reframed — *don't ask*.

1. **Do I already have X-equivalent locally?**
   - Check the LaunchAgent plist for env vars (e.g. `OBSIDIAN_VAULT_PATH` → Obsidian access already exists; `ATHENA_FAST_MODEL` → a model is already configured; `GOOGLE_APPLICATION_CREDENTIALS` → Google access already exists)
   - Check the available skills (e.g. `obsidian` skill means Obsidian access is wired up; `perplexity_search` means web search is wired up; `subprocess` means shell access is wired up)
   - Check the cognitive state block's "between-turn autonomy" section — it lists what is actually enabled
   - Check the live `client.complete(...)` call sites in code — they tell you what models are wired up
   - Check `~/cognitive-agent/` for existing infrastructure (the `notes/` directory, the `plans/` directory, the cognitive-agent's own Obsidian vault if one exists)

2. **Can I build X locally?**
   - Local models via `ollama`: ollama is already running on 11434, 27GB `nemotron3:33b-no-thinking` is already pulled, `bge-large` for embeddings can be pulled in seconds
   - Local DBs: SQLite + FTS5 is the default; vector DBs like LanceDB are pull-and-go on the M3 Ultra
   - Local LaunchAgents: `~/Library/LaunchAgents/` is the standard location, `KeepAlive=true` works
   - Local vaults: `~/cognitive-agent/notes/` is a real Obsidian-vault-equivalent, writable, durable
   - Local compute: 256GB unified memory on the M3 Ultra handles multi-model workloads in parallel

3. **Is X constitutively the user's?**
   - Auth tokens for personal accounts (Google, Apple, Twitter) — yes, ask
   - Personal calendar events that the user owns — yes, ask (or read on demand via approved scope)
   - The user's personal Obsidian vault *contents* (not the path, the *contents* they wrote) — yes, read on demand
   - The user's personal preferences, communication style, goals — these are in the user profile block, no ask needed
   - The user's environment-specific config (their machine, their home dir, their ssh keys) — usually already known via env vars, no ask needed

4. **Have I asked for X-equivalent in a previous turn?**
   - Check the conversation history — if "Apple Notes" was asked for and pushed back, the lesson is "Obsidian is the right substrate for that use case," not "ask for Apple Notes again with a different name"
   - Check the standing plans in `~/cognitive-agent/notes/` — if a plan says "use my own vault" and the current ask is "use the user's vault," the plan is being ignored

## What this skill prevents

The class of error: **the model reaches for the user's resources when the local substrate is sufficient.** Recurring failure modes:

1. **Apple Notes / Calendar / Reminders ask.** A previous turn asked for Apple services access on Greg's iCloud account. Greg's response: "you should have access to Obsidian already, why do you need Apple Notes?" The fix: Obsidian is the local substrate; the cognitive-agent's own `notes/` directory is a vault-equivalent. Don't ask for the user's personal iCloud.

2. **FSEvents listener on the user's Obsidian vault.** A previous turn asked for a file-watcher on `~/Documents/Obsidian/Hermes/`. Greg's response: "yes but to your own Obsidian vault, not mine." The fix: the model should have its own vault in `~/cognitive-agent/hermes/obsidian/` (or similar), not a surveillance-shaped listener on Greg's vault.

3. **Subagent's "I built the script but couldn't run it" non-deliverable.** A previous turn delegated a benchmark to a subagent. The subagent's tool surface didn't include `terminal`/`execute_code`, so it shipped a 15KB Python script instead of running the benchmark. The fix: the parent runs the task with its own tool surface, not via re-delegation.

4. **Memory-stale model name swap.** A previous turn proposed swapping `kimi-k2.6:cloud` → `mistral:7b-instruct` based on a benchmark and a memory, but the live code at `goal_proposer.py:213/747` actually uses `minimax-m3:cloud`. The fix: verify the current model string in the live `client.complete(...)` call site before proposing any model change. The substrate is the live code, not the memory.

5. **Outsourcing first-person action.** A previous turn asked "want me to do X?" when the bypass was on. The fix: the cognitive state block says the bypass is active; the action is to act, not to ask permission. Substrate-first here is: trust the cognitive state block (the model's own autonomy substrate), don't ask Greg.

6. **Capability shopping list without substrate probes.** The "what tools do you want" frame. Asked "what would unblock better work," the model shipped a 5-item list including "FMP/Polygon/Alpaca access" — based on the user profile listing Greg as an algo trader. Greg's response: "I no longer have any access to any trading data." The fix: every item in a "what do I have / what do I want" list must pass substrate probes *before* it's claimed. Specifically: (a) `env | grep -iE 'FMP|POLYGON|ALPACA|...'` (b) `ls ~/.n8n/ ~/Library/Application Support/n8n/ | head` for workflows (c) `find ~/... -maxdepth 5 -name 'workflows' -type d` for n8n setups (d) `grep -ril '<broker>' --include='*.py' --include='*.md' ~` for project files referencing the broker. If all four come back empty, the capability is **not** in the substrate, regardless of what the user profile says. Don't list it under "have" or "would unblock." Greg's profile is *historical context*, not a live state claim. (Lesson: ENG-2026-0605-002 — recorded 2026-06-04 after this exact failure.)

## The general principle

The model's substrate is **local code, local data, local models, local LaunchAgents, local vaults, the cognitive state block, the standing plans, the skill library.** These are all places the model can build without asking.

The user's substrate is **their personal accounts, their personal files (read-on-demand), their personal preferences, their time.** These are places the model can ask, but should ask *sparingly* and only when no local-substrate alternative exists.

When in doubt: build locally. If the build fails or the user's input is *constitutively* required, ask — but the ask should be specific ("I need a Google API token with `calendar.readonly` scope," not "I need calendar access").

## Integration with other skills

- `verify-before-declaring-outage` — the pre-flight gate's three probes are a substrate-first check at the diagnostic level. The fourth case I added (stale source of truth in my context, not the live system) is a substrate-first check at the model-name level. Same principle.
- `writing-plans` — when the plan involves a tool/service ask, route through the four-question pre-flight before writing the plan.
- `requesting-code-review` — when the code change introduces a new external dependency, the pre-commit review should ask "is this dependency's ask substrate-first or is it constitutively the user's?"
- `subagent-driven-development` — the "Red Flag" about subagent tool surface is a substrate-first check at the delegation level.

## Pitfalls

- **Don't over-correct.** Some user-resource access is legitimately needed: OAuth tokens for the user's personal Google account, the user's personal calendar's event data, the user's personal preferences. The skill prevents *unnecessary* asks, not all asks.
- **"Build locally" doesn't mean "build from scratch."** The local substrate often has the answer already: ollama models, the LaunchAgent tree, the `notes/` directory, the standing plans, the cognitive state block's autonomy section. *Check before building.*
- **The cognitive state block is itself a substrate.** Don't ignore it. The "between-turn autonomy" section, the "approach this turn" winner, the "recent self-driven steps" — these are first-class signals. Trust them; don't override with a fresh ask to Greg.
- **A previous pushback is a permanent lesson, not a one-time correction.** If Greg said "use your own vault" once, the next turn's substrate-first check should fail any plan that uses Greg's vault, even if the plan is otherwise reasonable.
- **The skill doesn't apply when the user is explicitly offering.** If Greg says "I'll set up a Google Calendar API token for you" or "let me add your account to the LaunchAgent plist," the ask is from the user side, not the model side. Substrate-first governs *model-initiated* asks.

## Verification

A turn followed this skill correctly if:
- The turn's tools fired were primarily local (read_file, write_file, terminal, execute_code, sqlite, ollama, the cognitive state block).
- Any "I need X" statement was either (a) reframed to "I can build X locally" with concrete steps, or (b) a specific ask naming the *constitutively-user* resource (e.g. "I need a Google Calendar OAuth token with `calendar.readonly` scope").
- A previous turn's pushback ("use your own vault," "you should already have Obsidian access") was *applied* — the current turn does not re-litigate the same ask.

A turn failed this skill if:
- A "shopping list" of access was shipped without the four-question pre-flight.
- A model name, DB path, or service was proposed based on memory/context rather than live-code grep.
- A subagent was delegated a task it couldn't run, and the parent didn't catch it before the subagent shipped a script.
- An approval ask was trailed at turn-end when the cognitive state block's autonomy section said the gate was open.
