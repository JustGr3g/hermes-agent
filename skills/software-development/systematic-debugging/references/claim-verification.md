# Claim Verification Against Live Runtime

## When to Use

Someone (user, release notes, changelog, another agent) tells you what changed in a deployed system. **Treat every claim as a hypothesis until you've independently verified it against live evidence.**

This is NOT about distrust — it's about rigor. Code on disk, config in repo, and what's actually running are three different things. Deployments fail, env vars get missed, modules don't import. Verify.

## The Pattern

### Phase 1: Decompose the Claims

For each claim, decide what evidence would prove or disprove it:

| Claim type | Evidence needed | Example |
|------------|----------------|---------|
| "Feature X was added" | Source code on disk | grep for the function/class/constant |
| "Config Y set to Z" | config.yaml + .env + env vars | read config, echo $VAR |
| "System is running new code" | Process uptime + log timestamps | ps, tail log |
| "Feature is active" | Code path + runtime condition check | grep the condition, check if prerequisite exists |

### Phase 2: Gather Evidence

For each claim, run targeted commands. The pattern:

```bash
# 1. Check source code for the feature
grep -n 'FEATURE_NAME\|KEY_CONSTANT' path/to/file.py | head -5

# 2. Check config files
grep -n 'setting_name' config.yaml ~/.hermes/config.yaml 2>/dev/null

# 3. Check runtime environment
echo $ENV_VAR

# 4. Check process state (is new code actually loaded?)
ps aux | grep process_name | grep -v grep
# Compare process start time to when code was changed

# 5. Check logs for initialization of the feature
tail -100 path/to/log.log | grep -i 'start\|init\|loaded\|feature_x'
```

### Phase 3: The Four-Outcome Assessment

For each claim, report one of:

- **CONFIRMED** — evidence directly matches claim (cite line numbers)
- **CONFIRMED with conditions** — code exists but needs X to be active (cite the condition)
- **NOT FOUND** — code doesn't exist on disk (claim may be inaccurate or deployed to wrong path)
- **UNABLE TO VERIFY** — can't access the evidence (process not running, log rotated, etc.)

### Phase 4: Report with Citations

Every finding must include:
- The exact file path and line number
- The relevant code/config/log snippet
- Whether it's code-on-disk or runtime evidence

## Concrete Example

This session's verification (May 21, 2026) demonstrates the pattern end-to-end:

### Claim: "300s per-turn wall-clock cap"
1. grep'd `run_agent.py` for `wall_clock_cap` → found code at lines 12126-12138
2. Checked if the cap is actually active → `cognitive_agent.tunables` module missing (silent import fail → cap = None = DISABLED)
3. Checked `ATHENA_MAX_RESPONSE_SECONDS` env var → not set
4. **Result: CONFIRMED with conditions** — code exists at lines 12126-15951 but cap is currently DISABLED because the tunables module doesn't exist on this path. Needs `ATHENA_MAX_RESPONSE_SECONDS` env var or `cognitive_agent.tunables` deployed to activate.

### Claim: "120s first-token deadline"
1. grep'd `run_agent.py` for `FIRST_TOKEN_DEADLINE` → found at line 8019
2. Checked the implementation logic → measures from stream attempt start (NOT reset by keep-alives, fixing the root cause of 5-hour turns)
3. **Result: CONFIRMED** — lines 8019-8128, active with 120s default.

### Claim: "Fallback chain deepseek → minimax → nemotron"
1. Read `config.yaml` lines 11-19 → confirmed minimax-m2.7 then nemotron-3-super
2. Check gateway startup resolver (`gateway/run.py` lines 337-372) → loads from config
3. **Result: CONFIRMED** — config.yaml lines 11-19, gateway loads it at startup.

### Claim: "Skill catalog pruned 96→29"
1. Counted SKILL.md files: `find skills -name 'SKILL.md' | wc -l` = 96
2. Counted disabled names in `config.yaml skills.disabled` = 67
3. 96 - 67 = 29 enabled ✓
4. Checked the new system prompt triggers in `agent/prompt_builder.py` → 6 concrete triggers at lines 1179-1193
5. **Result: CONFIRMED** — 96 on disk, 67 disabled in config, 6 triggers in prompt builder.

## Common Pitfalls

| Mistake | Why it happens | How to avoid |
|---------|---------------|--------------|
| Trusting file timestamps | File was touched but process hasn't restarted | Check process start time, not file mtime |
| Trusting `import` success | Code has the import but it silently fails (bare `except:`) | Mock the import and trace the fallback |
| Forgetting env vars | Code reads from env, env isn't set | Echo the var; check .env and config.yaml |
| Confusing codebases | Multiple agent frameworks on same machine | Always use absolute paths in grep/read |
| Confusing "code exists" with "code is active" | Feature code landed but gated by config/env | Check the gate condition too |
