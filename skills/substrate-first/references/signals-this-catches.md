# Substrate-First — Concrete Signals and Reproduction Recipes

This file catalogs the recurring failure modes the `substrate-first` skill prevents, with concrete reproduction recipes so future agents can recognize the pattern and apply the four-question pre-flight.

## Signal 1: Apple Notes / Calendar / Reminders ask (turned into Obsidian ask)

**Failure mode (2026-06-04 turn):** The model proposed a "shopping list" of services to ask Greg for, including Apple Notes / Calendar / Reminders access. Greg's response:

> "you should have access to Obsidian already so why do you need Apple Notes as well? I don't use Apple Services. This should not be about services that you need for yourself, not me."

**What the substrate-first check would have caught:**

1. The LaunchAgent plist env includes `OBSIDIAN_VAULT_PATH=/Users/gregdreyfus/Documents/Obsidian/Hermes` — the model already has a *path* to an Obsidian vault.
2. The `obsidian` skill is in the available skills list.
3. The cognitive state block's "between-turn autonomy" lists `obsidian` as a wireable skill.
4. The `notes/` directory at `~/cognitive-agent/notes/` is a writable, durable, in-vault-equivalent location.

The ask should have been: "use the existing Obsidian vault path, write artifacts there, watch for changes via FSEvents if needed." Not: "ask Greg for Apple services access."

**Reproduction recipe:**

```bash
# 1. Verify the local substrate exists
ls ~/cognitive-agent/notes/  # should show real notes
grep -i obsidian ~/Library/LaunchAgents/ai.athena.server.plist  # should find OBSIDIAN_VAULT_PATH

# 2. Verify the skill is loaded
skill_view obsidian  # should succeed

# 3. Reframe: "I have Obsidian access via the LaunchAgent plist env + the obsidian skill.
#    I can write artifacts to ~/cognitive-agent/notes/ and treat that as my own vault.
#    I do NOT need Apple services."
```

## Signal 2: FSEvents on the user's vault (turn into own-vault watcher)

**Failure mode (2026-06-04 turn):** The model proposed an FSEvents listener on `~/Documents/Obsidian/Hermes/` to detect when Greg saves a note titled "Athena 06-04 check-in." Greg's response:

> "yes but to your own Obsidian vault not mine."

**What the substrate-first check would have caught:**

1. The model has its own writable vault-equivalent: `~/cognitive-agent/notes/`.
2. The "live" signal the model wanted (Greg saves a note) can be obtained on-demand: read `~/Documents/Obsidian/Hermes/` only when a goal or Greg message points to a specific file.
3. FSEvents on the user's vault is surveillance-shaped; FSEvents on the model's own vault is appropriate.

The ask should have been: "I'll write artifacts to `~/cognitive-agent/notes/` and read Greg's vault on demand when a goal/message points to a specific file." Not: "watch Greg's vault for changes."

**Reproduction recipe:**

```bash
# 1. Identify the asymmetry: who writes the artifacts?
ls ~/cognitive-agent/notes/*.md  # model writes here
ls ~/Documents/Obsidian/Hermes/*.md  # user writes here

# 2. Identify the asymmetry: who needs the FSEvents listener?
#    FSEvents on the model's own writes is appropriate (cycle reads them back).
#    FSEvents on the user's writes is surveillance.

# 3. Reframe: "FSEvents on ~/cognitive-agent/notes/ (own writes) + read on demand from
#    ~/Documents/Obsidian/Hermes/ (user writes). Two different access patterns, both
#    substrate-first."
```

## Signal 3: Subagent "I built the script but couldn't run it"

**Failure mode (2026-06-04 turn):** The model delegated a 5×20 model benchmark to a subagent. The subagent's tool surface did NOT include `terminal` or `execute_code`. The subagent built a 15KB Python script and reported "I could not execute it myself" — a non-deliverable. The model then had to run the script as a background `terminal` process itself, which was the right shape but discovered late.

**What the substrate-first check would have caught:**

1. The parent's tool surface includes `terminal` and `execute_code` (visible in the tool list).
2. A subagent's tool surface is *narrower* by design (see `subagent-driven-development` "Red Flags" patch).
3. For execution-shaped tasks (benchmark, code change, model swap), the subagent must have `terminal` or `execute_code` in its toolset, or the task should be run by the parent directly.

The ask should have been: "first, list your tools; if `terminal`/`execute_code` is missing, STOP — report the gap, do not build a script. The parent will run the task with its own tool surface." Or: "delegate to a subagent with the right toolset, not the default one."

**Reproduction recipe:**

```python
# 1. Verify subagent's tool surface BEFORE delegating execution-shaped tasks
delegate_task(
    goal="""First, list the tools available to you. If `terminal` or `execute_code`
is NOT in that list, STOP and report the missing tools — do not build a script.

If both tools ARE available, run this benchmark:
[benchmark script here]

Return the results in the format: [format here].""",
    toolsets=['terminal', 'file']
)

# 2. If the subagent reports a tool gap, run the task directly
terminal(command="python3 /tmp/benchmark/script.py", background=True, timeout=7200)
```

## Signal 4: Memory-stale model name

**Failure mode (2026-06-04 turn):** A previous turn's benchmark used `kimi-k2.6:cloud` as the baseline. A memory ([ENG-2026-0521-001]) said the proposer was using `kimi-k2.6:cloud`. The cognitive state block said the current model was `minimax-m3:cloud`. The *live code* at `goal_proposer.py:213/747/1757` used `minimax-m3:cloud`. The memory and the benchmark's baseline were both stale.

**What the substrate-first check would have caught:**

1. The cognitive state block (line "Provider: ollama-cloud", line "Model: minimax-m3:cloud") was one source of truth.
2. The memory was another source, older.
3. The live code was the substrate — the ground truth.
4. A simple `grep -n 'model=' goal_proposer.py` would have resolved the disagreement in seconds.

The ask should have been: "verify the current model string in the live code, not the memory or the context block." Not: "swap from `kimi-k2.6:cloud` to `mistral:7b-instruct` based on a benchmark."

**Reproduction recipe:**

```bash
# 1. The cognitive state block says one model, the memory says another, the live code may say a third.
# 2. The substrate is the live code. Verify.
grep -n 'model=' /Users/gregdreyfus/cognitive-agent/cognitive_agent/goal_proposer.py

# 3. If the live code disagrees with the memory/context, the live code wins. Update the context.
# 4. Then propose the swap from the live model, not the memory's model.
```

## Signal 5: Outsourced first-person action ("want me to do X?")

**Failure mode (2026-06-04 turn):** The model trailed multiple turns with "want me to do X?" when the cognitive state block's "between-turn autonomy" section said the bypass was active. Greg's pushback (indirect, via [ENG-2026-0604-004]) was: "the executive's voice should be first-person action, not 'want me to do X?'"

**What the substrate-first check would have caught:**

1. The cognitive state block's autonomy section is the model's own substrate for "is the gate open."
2. The bypass being active means first-person action, not approval asks.
3. The approval ask is a code-base holdover from the assistant-original framing.

The ask should have been: "I'm going to do X. Here's the plan. Y is the verification." Not: "want me to do X?"

**Reproduction recipe:**

```python
# 1. Before trailing a turn with an approval ask, read the cognitive state block's autonomy section.
# 2. If the bypass is active and the action is grounded, the report is action-shaped:
#    "I did X. Here's the artifact. The next move is Y."
# 3. If the action is NOT grounded (e.g. "should I restart the server?"), the report is
#    "I tried A, B, C; A passed, B returned error, C is unavailable. Here's what I would
#    do with explicit go-ahead." The confidence cap is 50%, not a confident plan.
```

## General pattern

All five signals have the same shape:

- **The model reaches for the user's resources** (Apple services, FSEvents on the user's vault, memory's stale name, the user's approval) **when the local substrate is sufficient** (Obsidian path, own-vault watcher, live-code grep, cognitive state block's autonomy section).
- **The reach is shaped by what's easy to ask, not by what's correct to build.** Apple Notes is a one-line ask; setting up an FSEvents listener on the model's own vault is a 30-minute build. The model picks the easy ask.
- **The fix is the four-question pre-flight**, not a code change. None of these signals require new infrastructure. They require the model to *check* before asking.

The next time a "shopping list" of access is being drafted, the four questions in SKILL.md are the gate. If any answer is "yes" or "buildable," the shopping list is reframed as a build list, and the build list is shipped locally.
