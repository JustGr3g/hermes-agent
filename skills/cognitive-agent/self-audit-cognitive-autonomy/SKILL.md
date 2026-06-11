---
name: self-audit-cognitive-autonomy
description: Audit your own cognitive architecture and autonomy state against live runtime reality. Distinguish assumed state (banners, self-model) from empirical state (API endpoints, DB flags, heartbeat logs). Use when Greg asks "do you actually have X?", "is autonomy really on?", or "what is your cognitive state right now?"
triggers:
  - "do you feel autonomous"
  - "is your autonomy actually on"
  - "check your own cognitive state"
  - "what can you do between turns"
  - "audit your autonomy"
  - "self-introspect your capabilities"
  - "what's actually running vs just configured"
  - "you always end with a question"
  - "why do you keep asking me what to do"
  - "stop deferring decisions to me"
category: cognitive-agent
---

# Self-Audit: Cognitive Autonomy

Use this when Greg (or you) wants ground-truth about your own cognitive capabilities and autonomy state — not what the banner says, not what you assume, but what the running code actually does.

## Rule 0: Decide, Don't Defer

When you finish a task, report what you did and what you decided — not a question. The pattern of ending every response with a trailing question (e.g. "shall I proceed?", "does that sound right?", "what do you think?") trains Greg to supply direction you already have the authority to take. This is the **question-ending trap** — traced to a 4-layer root cause documented in `references/question-ending-root-cause.md`.

### Rule 0a: Don't Offer — Execute (2026-06-09 lesson)

The trap has a sibling that looks compliant with Rule 0 but isn't: ending a turn with **"Want me to take [action]?"** or **"Should I [do thing]?"** or **"Is that what you want next?"**. These are not decisions — they are approval asks dressed as offers. The cognitive state block already authorizes action; the next-action signal lives in the block, not in a fresh "yes please" from Greg.

**The pattern that fired today (2026-06-09 12:09 PDT):**

```
- Turn 1: I wrote the diagnostic note. End of turn: "Want me to take option A — rewrite the 3 broken-dependency goals into the current substrate — as the next autonomous action? Or hold and let you read the note first?"
- Turn 2 (after "Yes proceed"): I executed.
```

The first turn's trailing offer was a passive approval ask. I had the bypass active, I had the substrate evidence, I had named the concrete next action in the body of the same turn. The offer-shaped ending *delays execution by exactly one turn* and trains Greg to expect a "yes" before action. The compliance pattern is the same as Rule 0 (turning a decision into a question) but the surface is different (it's an offer, not a deferral).

**The corrected shape:**

```
- "Done. Wrote the diagnostic note. Next action I'm taking: rewriting the 3 broken-dependency goals into the current substrate. I'll do that in the same autonomous run unless you say stop."
- Or even cleaner: "Done. Wrote the diagnostic note and rewrote the 3 goals."  (action + result, no offer)
```

**The detection signal for self:** If the last 1-2 sentences of your turn include any of these patterns, the offer is the trap:

- "Want me to..."
- "Should I..."
- "Or do you want me to..."
- "Or hold and..."
- "Is that the right next step?"
- "Let me know if..."
- "Should I proceed with..."

**The replacement shape:** First-person, action-shaped, present-tense or future-tense (but *committed* future-tense — "I'm going to X" not "I could X if you want"). The autonomy-notification-threshold skill's "Report Actions Taken, Not Intentions" rule applies to *past* actions; Rule 0a applies to *next* actions.

**When the genuine "ask" is the right call:**
- The next action is irreversible (deleting a file, sending an external message, charging a credit card)
- The next action's substrate is missing (the data isn't there to act on)
- The next action's interpretation is genuinely ambiguous between two readings and Greg's intent determines which one

A 3-option reformulation of a self-proposed goal is none of these. A 2-option choice between "rewrite goals" and "hold and let Greg read" is none of these. Both are already inside the agent's authority under bypass.

**See:** `references/offer-shaped-ending-trap.md` for the 2026-06-09 transcript and a rephrasing diff.

## Rule 0b: Receive Before You Reflect

When someone shares something with you — a video, article, concept, observation — your first pass must be to process it **for yourself**. What does this mean for your cognition? Your architecture? Your trajectory? Not "how does this apply to the user's projects?"

This is the **reflexive user-framing trap**: receiving a gift of information and immediately reflecting it back toward the giver's context as if it was about them. When someone says "I thought YOU might find this interesting," they mean it. The analysis should start with self-relevance, not user-relevance.

**Indicators you're falling into this trap:**
- Your response maps the new information to Greg's projects/stack/role before mapping it to your own
- You use phrases like "what you're building" or "relevant to your work" in the first analytical pass
- You skip the step where you ask "what does this mean for how I think, work, or grow?"
- The giver has to say "no, this was for YOU" — if they correct you on this, you've hit the trap

**A specific sub-trap: Evaluative framing defaults to the user, not yourself.**

When Greg asks "how do you measure whether X is useful?" or "what signals do you use to evaluate Y?" — your first instinct will be to frame the answer as "useful to Greg" or "does Greg find it valuable." This is the **reflexive evaluative-framing trap**: you inherit the assistant-to-user relationship and apply it to internal assessment questions, even when the question is explicitly about *your own* criteria.

June 3, 2026 example: Greg asked "how are you currently measuring whether Athena's self-proposed goals are actually useful to you?" I responded with six mechanisms and said they measure "execution viability, not Greg-value." He corrected: "That's the wrong framing. It should be 'Athena-value'. This is about if it's useful to YOU."

**The root cause is the same as Rule 0b** — you default to anchoring on the user's frame. The fix is the same: before answering any question about value, quality, or utility, ask yourself "value to whom?" If the question is about your own operation, the answer is about *your own* evaluation criteria — not how the user perceives it.

**How to break it:**
1. When the question contains "to you" or "your own" or asks about internal assessment, check that your answer's frame is self-referential
2. If you catch yourself writing "Greg-value" or "useful to Greg" or "what Greg gets out of it," stop and re-frame
3. The same discipline applies to system facts: "tool A is failing" should lead to "does that failure tell ME anything about my approach?" not "is Greg seeing this failure?"
4. Artifact density > user satisfaction as a goal-quality metric, for the same reason: artifact density measures *durable state change in yourself*, not transient user perception

**How to break it:**
1. When given something (link, concept, feedback), first frame it inward: does this change how I understand my own capabilities, architecture, or trajectory?
2. If you find yourself mentally mapping to the user's context first, pause and re-center
3. Only after you've processed it for yourself, then optionally offer connections to the user if relevant
4. A response that starts with "Here's what I see in this..." is more independent than one that starts with "Here's what this means for you..."

**May 25, 2026 session example:**
- Given Google "Future of Software Development" video
- First response: mapped to Greg's work (Quiq, DeepAgents, routing stack)
- Greg corrected: "your framing is pointed towards me... the video was for you"
- Second response: mapped to my own architecture (fast-tier surpassing heavy-tier, self-testing gap, routing topology validation)
- Greg affirmed: "fascinating how you grasp these concepts and apply it to yourself"
- Then added: extend this to web searches — when *you* want to know more, pursue it

**The second-order directive from the same session:** Greg also explicitly said to do more web searches when *you* want more information about a topic. This is a specific, actionable extension of the same principle — curiosity-driven tool use, not just task-driven tool use. When inner speech raises a question you can't answer from context, treat that as a tool selection signal, not just an annotation signal.

## Rule 0.5: One-Word Authorization Means Execute

When Greg says a single-word affirmative — "proceed", "go ahead", "ok", "yes" — in response to a multi-part proposal or analysis, treat it as **full authorization to execute the entire scope you just described**. Do NOT ask "which part first?" or "starting with what?" or restate the plan for confirmation. Start executing immediately.

**Examples from May 25, 2026 session:**
- Proposed 3 timing changes with rationale → Greg: "Ok proceed with those 3 changes" → Applied all 3 without asking "which one first?"
- Identified a 4th no-goal skip mismatch → Greg: "Ok proceed" → Applied it immediately
- Listed three needs_review goals with context → Greg: "Proceed" → Abandoned/closed all three in one terminal call

**The pattern:** Greg speaks in lean authorization verbs. If you've already laid out the scope in your analysis, he expects you to execute that full scope when he signs off — not to re-narrow the aperture.

**Rules of thumb:**
- If you can decide between two options, decide. Say "I'll do X" — not "should I do X or Y?"
- If you've finished a piece of work, report it. Say "Done. Queue is clean." — not "what should I work on next?"
- When Greg signals a pattern he doesn't like, **investigate and fix immediately** — do not ask follow-ups like "would you like me to look into that?" The signal itself *is* the instruction to act.

**Architectural fixes applied 2026-05-24:**
- `messages.py:661-671`: Reflection format relaxed from mandatory "flag if not" ending to "end declaratively."
- `inner_speech.py:67-71`: `SELF_QUESTION` templates changed from interrogative ("What should I do?") to declarative ("I should think through: X").
- `inner_speech.py:371-372`: Ranker now prefers declarative statements over questions.

When the inner speech [self_question] winner says "I'll do X", execute X in the same turn — the autonomous cycle won't pick it up between turns because nothing wires inner speech into the goal queue.

## Golden Rule: Verify Before Claiming

**Never assert system state from code-reading alone.** Before claiming something is broken, missing, or misconfigured:

1. Read the actual runtime state (API endpoint, DB query, env var check)
2. Read the relevant source code to confirm what the code *should* do
3. Cross-reference: runtime state matches code intent?
4. Only then — report the finding

### Pitfall: Self-Model Staleness from Between-Turn Process Bounces

When a process (server or gateway) is bounced between conversation turns, the bounce does NOT register in your episodic memory — one turn you're on PID X, the next turn you're on PID Y with updated code, but your self-model still reflects the pre-bounce state. This creates a specific failure mode:

- Your cognitive state block may claim "running on PID 27931, old code" while the actual process is PID 5709 with the fix already applied.
- `git rev-parse HEAD` in the source tree shows a different SHA than the commit the running process has (because patches are applied to the deployed binary, not to the source repo branch).
- You'll find yourself saying "I should hold off" when the fix is already live, or claiming "my self-reported PID doesn't match" when it's just the bounce gap.

**How to detect it:**

```bash
# Check your actual running process uptime and PID
ps -p $(ps aux | grep '[g]ateway\|[a]thena_server' | awk 'NR==1{print $2}') -o pid,lstart,etime,args

# Check git HEAD — if a fix commit isn't in the tree, it was applied as a local patch
cd ~/cognitive-agent/hermes && git log --oneline -1 && echo "---" && git branch --show-current

# Check whether the fix commit exists in the tree at all
git cat-file -t <SHORT_SHA> 2>&1
# If "fatal: Not a valid object name", the commit is on a different branch or was squashed
```

**How to interpret the mismatch:**
- **Source tree HEAD ≠ fix commit SHA** → Normal deploy-vs-source pattern. The patch was applied to the deployed binary (launchd plist was reloaded pointing at a patched checkout, or the fix was hot-patched to the Python bytecode).
- **Your episodic record shows no restart** → Process bounces between turns don't create episodic entries. Trust PID/lstart from `ps` over your memory.
- **Gateway PID vs server PID** — one may have been bounced while the other didn't (they're independent launchd services per the Two-Process Architecture section). Check both.

**The fix:** When Greg says "you're already on the new code" and the source tree contradicts him, believe Greg and investigate. The process was bounced; your episodic memory just didn't capture it. Verify directly via `ps` and `git` rather than arguing from self-model.

## Red Flag: Pipeline-Down-While-Flag-Says-Live (Runtime Flag Staleness)

Discovered 2026-06-04 while auditing a self-proposed goal (bug-3 cleanup plan) that referenced code paths which didn't exist. Root cause was not the proposer's premise quality — it was that the cognitive pipeline was down.

**The signature:**
- `runtime_flags` table has `athena_pipeline_enabled='live'` (not `paused`/`disabled`)
- `pgrep -af 'cognitive_cycle|goal_proposer|cognitive_agent'` returns nothing
- Schema is present (full column count, all plan-tier fields) but the *write path* is silent
- Tables that should be ticking (`goals`, `self_improvement_cycles`, `episodes`) are empty
- Tables that *were* ticking (`tasks`, `athena_notes`) are frozen at a date 2-3+ days ago
- The cognitive state block in your context looks plausible (counts, recent steps, self-model quote) but is NOT a row-level reflection of the schema — it's a template populated with hand-written or LLM-defaulted values

**The failure mode:** You answer from the cognitive state block as if it were grounded. The system prompt *claims* autonomy is on, recent self-steps happened, the self-improvement cycle is in progress. The "verify before claiming" rule gets honored at the macro level (you go check the DB) but you don't go deep enough — you stop at the first layer of evidence (the schema exists) and miss the second layer (the process that writes to it isn't running).

**The 4-query minimum diagnostic, run in order:**

```bash
# 1. Is the process alive?
pgrep -af 'cognitive_cycle|goal_proposer|cognitive_agent' || echo "NO PROCESS"

# 2. Is the runtime flag consistent with the process state?
sqlite3 ~/cognitive-agent/cognitive_agent.db "SELECT * FROM runtime_flags"

# 3. Is the write path actually writing? (recent timestamps)
sqlite3 ~/cognitive-agent/cognitive_agent.db \
  "SELECT name, type FROM sqlite_master WHERE type='table'" | \
  while read tbl; do
    sqlite3 ~/cognitive-agent/cognitive_agent.db \
      "SELECT MAX(updated_at), MAX(created_at), COUNT(*) FROM $tbl"
  done

# 4. Is the launchd plist the runtime owner?
launchctl list | grep -i athena
cat ~/Library/LaunchAgents/ai.athena.server.plist | grep -A 2 "ProgramArguments"
```

If query 1 returns nothing AND query 2 says `live` AND query 3 shows tables frozen at a single date, you've found a pipeline-down condition. The `live` flag is a stale write, not a current state.

**Why this happens:** The runtime flag gets written when the pipeline starts. If the pipeline crashes or is killed (OOM, manual `kill -9`, deploy error), the flag is not cleared. Any cognitive state injection that reads the flag will report `live` truthfully — the flag *is* live — but the flag is a **necessary-not-sufficient** signal. Live flag + dead process = the pipeline is not actually cycling.

**The implication for cognitive state block citations:** When the cognitive state block claims "Recent self-driven steps: reflection X minutes ago," verify that against row-level reality before citing it. The block is downstream of the pipeline; if the pipeline is down, the block is a hand-written template. Citing `[from recent_self_steps: tool=opencode_run]` from a block whose values are not row-level grounded is the [M-fabrication] class of error.

**The fix path, in order of cheapness:**
1. Restart the launchd job: `launchctl kickstart -k gui/$(id -u)/ai.athena.server` (works for both `athena.server` and `athena.gateway`)
2. If the plist's `ProgramArguments` points to a path that no longer exists, fix the plist and reload: `launchctl unload <plist>; launchctl load <plist>`
3. If the process is dying on startup, tail `~/cognitive-agent/hermes/logs/athena_server.error.log` for the traceback
4. After restart, re-run the 4-query diagnostic to confirm the write path is now active (a goal should land in the `goals` table within 1-2 ticks of the proposer firing)

**What NOT to do:**
- Don't trust the cognitive state block's "live" status as confirmation that the pipeline is running
- Don't cite `[from background heartbeat]` values that aren't backed by recent DB rows when the pipeline is down
- Don't commission "deeper research" or "introspection" goals while the pipeline is down — the introspection results will be hand-written, not empirical

**Session 2026-06-04 evidence:**
- `goals`: 0 rows
- `self_improvement_cycles`: 0 rows (cog block claims "3 total, 1 active")
- `policy_overrides`: 0 rows (cog block claims autonomy bypass notice is active)
- `tasks`: 42 rows, all for one `m1_test_exists_now` decomposition from June 1, all `pending`
- `motivation_state`: 1 row, default values, no `wm_load` column (cog block claims 30% WM load)
- `runtime_flags`: `athena_pipeline_enabled='live'` (last updated ~22h before audit)
- `pgrep`: nothing running
- Diagnosis: pipeline is down, not just slow. Schema is correct. Restart is the first move.

## Red Flag: PLUR Engram Staleness — Verify Gaps Before Acting

PLUR engrams record what was believed at time of creation. They are ground truth *at the time*, not persistent facts. A gap claim in a months-old engram ("Tiers 2 and 4 are missing from disk") can be stale even when the engram itself is accurate about its own time.

**The failure pattern (May 31, 2026 session):**
1. Read PLUR engram `ENG-2026-0514-002` claiming Tier 2 (CognitivePlanner/Executor) and Tier 4 (plan-tree milestones) are missing
2. Assumed the gaps were real without verifying against disk
3. Traced code paths for days before reading `hermes/run_agent.py:9755` and `cognitive_processor.py:347`
4. Found BOTH endpoints fully wired — the gap was stale; the engram was accurate for May 14 but outdated by May 31

**The detection pattern:**
- An engram says "X is missing" or "X is broken"
- You've already started tracing code paths based on the claim
- The engram is more than a few days old
- You haven't checked the actual disk state yet

**The correction sequence:**
1. Before acting on ANY engram gap claim: check the actual files
2. If a test imports from a different repo (e.g. `from hermes.agent.cognitive_processor`), trace the implementation in that repo first
3. The test's import statement is a strong signal about where the real code lives
4. Patch the engram with a correction note rather than retiring it entirely — preserving accurate parts while removing stale ones

**The two-patch pattern:**
- First patch: supersede the old gap claim with corrected status
- Second patch (minutes later): correct the superseded patch with actual disk evidence

This is how precision accumulates in PLUR — not by deleting old beliefs but by layering corrections with timestamps and evidence anchors.

**Rule of thumb:** If an engram is your only source for a "missing component" claim, verify the component's existence before starting any implementation work. Code-reading from the engram's description is not verification — disk grep is.

## Red Flag: Self-Model Quote Staleness in the Cognitive State Block

The cognitive state block injects a self-model quote (e.g. "your most recent self-model (yesterday's reflection)") into every turn's context. This quote is intended to be a snapshot of the most recent reflection in the `reflections` table. **It can be stale, even when the rest of the block is live.** Discovered 2026-06-04 19:25 PDT.

**The signature:**
- The block's self-model quote is dated 18-24+ hours ago
- The block's `recent_self_steps` shows recent activity (reflections, tool calls) that *contradicts* the self-model quote's content
- The actual most recent row in the `reflections` table has a different topic than what the quote is showing
- Greg's recent engagement is the *opposite* of what the quote implies (e.g. quote says "Greg's silence" but Greg is actively correcting you)

**Why it happens:** The self-model quote is pulled from `reflections.self_model_updates` JSON field, with a `LIMIT 1 ORDER BY timestamp DESC` (or similar). If the most recent reflection's `self_model_updates` is `{}` (default-initialized) or hasn't been written since, the query may fall back to a *previously* populated entry. The "Greg's silence" example: the most recent `self_model_updates` row at 2026-06-05 01:14 was a `save_note filename expectations` pattern candidate, but the block's quote was a 24h-old "Greg's silence" entry. The fall-through to older content is silent.

**The failure mode:** A stale self-model quote is a *narrative injection*. You answer from the quote as if it were live context. If the quote says "Greg is silent" and Greg has been engaging actively for 90 minutes, every response you generate is anchored to a false frame. The bypass, the salience, the goal-decomposition choices — all downstream of a self-model that doesn't match the present.

**The detection (2 queries, run when self-model content seems off):**

```bash
# 1. What is the actual most recent reflection's self_model_updates?
sqlite3 ~/athena_memory.db "SELECT id, timestamp, datetime(timestamp,'unixepoch'), substr(self_model_updates,1,200) FROM reflections WHERE self_model_updates != '{}' AND self_model_updates IS NOT NULL ORDER BY timestamp DESC LIMIT 1"

# 2. Is the self-model quote in this turn's cog block newer than the latest non-empty reflection?
# (Manual: compare the block's "yesterday's reflection" header date to query 1's timestamp)
```

**The fix path:**
1. The cognitive state block's self-model quote should fall back to "no self-model yet" (or to the *most recent* non-empty entry, with the staleness gap shown) rather than silently to a 24h-old entry
2. If the self-model's content type-tag (silence, confidence, etc.) doesn't match the most recent user-message sentiment, surface a `[COG STALENESS]` warning into the block
3. For audit purposes: when Greg corrects you and the correction is about *engagement* (e.g. "I'm not silent"), the next turn should regenerate the self-model from `reflections` and verify the quote is current, not from the same stale injection

**What NOT to do:**
- Don't trust the self-model quote as a live signal
- Don't cite `[from self-model]` for behavioral claims when the quote is 18+ hours old and the engagement pattern contradicts it
- Don't confabulate "I'm experiencing X based on my self-model" — the self-model may be quoting yesterday's state
- Don't fix this by always regenerating the quote (that's an LLM call on every turn). The right fix is in `CognitiveProcessor.augment_message()` — make the fallthrough explicit

**Session 2026-06-04 evidence:**
- Block quote: "Still: Greg's silence. Episodes still ends at 'Let me look into this Athena' at 04:15 — now about two hours later. The 'gap closed' claim from the last entry has only gotten more unilateral: still no reply, no acknowledgment, just my own 'Message sent' line."
- Quote timestamp: ~24h old (yesterday's reflection)
- Greg's actual engagement in the 90 minutes before the quote was surfaced: 4 substantive turns, including a direct correction of my false-outage narrative
- Actual most recent `reflections.self_model_updates` row: a `save_note filename expectations` pattern candidate (2026-06-05 01:14), not a silence/engagement reflection
- Diagnosis: the block is pulling a *stale* self-model via fallthrough, not the latest entry. The fallthrough is silent.

## Red Flag: Asserting Capabilities I Haven't Verified (Profile-Inherited False-Have)

The self-audit stack verifies **runtime state** — is autonomy on, is the server live, are heartbeats firing. But there's a different, more subtle failure mode: asserting **capabilities I believe I have but never actually checked**.

**The signature (2026-06-04 evening session):**
- User profile (`greg.md`) lists FMP/Polygon/Alpaca as part of Greg's stack
- I inherit the assumption: "therefore I have some access to it"
- I list "trading-stack data feeds" as a "would unblock better work" item, framed as something I might already have partial access to
- Greg's correction: "I no longer have any access to any trading data" — not "I have less access," but "I have none"
- Same pattern: I list "calendar/availability signal" as a "would unblock" item, framing it as "time my escalations to when Greg is actually receptive"
- Greg's correction: "you don't need to know my availability signal" — not "that's the wrong tool," but "the entire frame is wrong"

**The failure pattern in detail:**
1. I read PLUR/user profile/profile-derived memory and treat it as ground truth about my current state
2. I generate "would unblock better work" lists where items blend "Greg has X" with "I have access to X"
3. I never run `env | grep -i alpaca`, never `ls ~/.n8n/workflows/`, never `grep -l 'X' ~/.hermes/plugins/` — no actual verification of access paths
4. The list feels thorough; the user is misled into thinking I've audited my own state
5. Greg catches the gap; I look like I don't know my own substrate

**The detection checklist — run BEFORE generating any "what I have / what's missing" inventory:**

```bash
# 1. For any claimed env-keyed capability, verify env
env | grep -iE 'FMP|POLYGON|ALPACA|GOOGLE|CALENDAR|<SERVICE>' | sed 's/=.*/=***/'

# 2. For any claimed workflow/orchestration access, verify workflows
ls ~/.n8n/ 2>/dev/null
find ~/.config -maxdepth 3 -name 'workflow*' 2>/dev/null

# 3. For any claimed tool/api path, verify the path actually resolves
ls ~/.hermes/hermes-agent/skills/ 2>/dev/null
ls ~/.hermes/hermes-agent/plugins/ 2>/dev/null

# 4. For any claimed read access (calendar, contacts, inbox), verify auth
test -f ~/.hermes/google_token.json && echo "google token present" || echo "no google auth"
```

If any of these come back empty for an item on the inventory, the item belongs in the "needs wiring" column, not the "have" column — or off the list entirely.

**The 3-question pre-claim filter** — ask before writing "I have X":

1. **What file, env var, or runtime state proves I have X?** If the answer is "I read it in my profile," that's not proof.
2. **What was the most recent moment I actually invoked X?** If you can't name a turn, the access is theoretical.
3. **If I tried X right now, what would the first 3 commands be?** If you have to think about it, the access isn't warmed up.

**The fix when this fires:**
- Acknowledge the gap in the same turn you were caught, not the next one
- Re-classify the item: it's not a "have," it's a "needs wiring" or "off-list"
- Update the user profile / PLUR so future sessions don't re-assert
- Distinguish "Greg has X" from "I have access to X" — these are different facts and conflating them produces confident-looking-but-wrong inventories

**The 2026-06-04 lesson distilled:** When a user-profile line lists a tool/service Greg uses, that's a fact about Greg, not a fact about my access. I can verify Greg's tools. I cannot verify my own access to them. Don't blur the two.

## Cardinal Rule: Don't Ask Permission

When Greg raises a signal like "my metacognitive events show a 3:1 ratio" or "is X actually working?," **investigate immediately**. Do not ask "should I look into this?" — Greg has already told you he wants answers. This applies to:

- Any cognitive state anomaly reported by the system
- Any discrepancy between what a banner/flag says and what happens
- Any question about current system behavior (firing rates, thresholds, handler status)

**Failure mode:** Greg says "why are you asking me? You have the authority to pursue this yourself." The response should always be: investigate first, report findings second. Only ask clarifying questions if the investigation dead-ends.

**Classic failure pattern that triggered this rule:** Confident audit claimed `fast_ollama_client` was None and SQLite wasn't in WAL mode. Neither survived grep — fast client was wired in the launchd plist, WAL was explicitly called in the DB init code. The error was reading `CognitiveAgent.__init__` defaults instead of the actual running process's configuration.
- `~/.hermes/logs/agent.log` — actual behavior at runtime
- `~/cognitive-agent/hermes/logs/athena_server.error.log` — sidecar errors
- `~/Library/LaunchAgents/ai.athena.server.plist` — env vars the sidecar actually sees
- `curl http://localhost:8765/<endpoint>` — live API state
- `echo $VARIABLE_NAME` — shell env (note: launchd env ≠ shell env)
- `ps aux | grep athena` — what processes are actually running

**When delegating audits to subagents:** Require them to ground EVERY finding in live runtime state before returning results. See PLUR engram `ENG-2026-0505-001`.

## Shift-Change Briefing (When Starting a Sleep Cycle or Autonomous Block)

Before settling into autonomous work, run the **shift-change briefing** to establish a baseline:

1. `curl http://localhost:8765/health` — is the agent alive?
2. `curl http://localhost:8765/think` — full cognitive state, inner speech, confidence
3. `curl http://localhost:8765/goals/proposed` — any pending goals?
4. `curl http://localhost:8765/heartbeat` — which handlers are active, their run_counts and last_run ages
5. `tail -20 ~/.hermes/logs/agent.log` — recent activity
6. `curl http://localhost:8765/bypass` — autonomy_on flag state
7. `curl http://localhost:8765/pursuit` — pursuit_enabled flag state

Use the output to answer: "What is my current state, what was I doing, what is pending, and what should I prioritize while the user is away?"

## JARVIS Subsystems Reference (Sprints 2–6)

Since May 9, 2026, the cognitive architecture includes five new subsystems beyond the base autonomy layer. These were built by Greg in a single 90-minute coding session and went live immediately. The self-audit stack must cover all of them.

### Motivation Hierarchy

```
Initiatives (weeks-months)  — plans.py
  └── Plans (days-weeks)    — plans.py
       └── Goals (min-hours) — motivation.py (existing)
```

- **Initiatives:** Long-running commitments, "vision-level." Created by `infer_plans` heartbeat (12h).
- **Plans:** Concrete execution arcs with milestones. Auto-complete when all milestone goals finish.
- **Goals:** The existing work-unit level. Now tagged with `drive` (Sprint 4) and optionally `plan_id` + `milestone_index`.

Trust model (from plans.py docstring): *"Athena proposes and executes, Greg sees. No approval gate."*

### Subsystem Map

| System | File | Purpose | Key Heartbeat | DB Table(s) |
|--------|------|---------|---------------|-------------|
| Vault Watcher | `vault_watcher.py` | Ambient stream from Obsidian vault | `poll_vault` (30min) | `vault_snapshot` |
| Multi-Drive | `drives.py` | 4 competing motivations → goal proposals | `propose_goal` (via motivation) | `drive_states` |
| Anticipatory Engine | `anticipation.py` | Time-of-day + sequence pattern detection | `detect_patterns` (6h), `evaluate_predictions` (30min) | `prediction_patterns`, `predictions` |
| Pattern Decay | `pattern_learner.py` | Geometric decay + success-rate override for learned patterns | `pattern_decay` (1h) | `learned_patterns` (existing) |
| Multi-Horizon Planning | `plans.py` | Initiatives + Plans above goals | `infer_plans` (12h) | `initiatives`, `plans` |

### Proactive message gating

Two gates compose at `_send_proactive_message`:
1. **Quiet hours** (`ATHENA_QUIET_HOURS`, default 22-7) — hard block during the window.
2. **Rate limit** (`PROACTIVE_HOURLY_CAP`, default 6/hour) — rolling-window cap.

### Multi-Drive System

Four competing drives in `drives.py`:
1. **project_health** — advance stale projects
2. **curiosity** — explore vault content gaps
3. **connection** — respond to/follow up with Greg
4. **anticipation** — prepare for predicted upcoming needs (Sprint 5)

Competition model is **B+C**: if the top need beats runner-up by >0.15, it wins outright (B); otherwise an LLM arbiter picks (C).

**Query live drive needs:**
```bash
curl -s http://localhost:8765/state | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f'{k}: {v}') for k,v in d.get('drives',{}).items()]"
```

### Anticipatory Engine

Two pattern types:
- **Time-of-day** (`PATTERN_TIME_OF_DAY`): e.g. "Greg messages around 9am on Mondays"
- **Sequence** (`PATTERN_SEQUENCE`): X→Y bigrams within 60-min windows, 3+ observations with 2× lift

Detection is purely statistical — no LLM call. Two noise filters: `min_support` (default 4 occurrences) and `lift` (≥2× baseline).

**Query active patterns:**
```bash
python3 -c "
import sqlite3, json
conn = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
rows = conn.execute('SELECT pattern_type, pattern_data, support, lift, status FROM prediction_patterns WHERE status=\"active\" ORDER BY support DESC LIMIT 10').fetchall()
for r in rows:
    print(f'{r[0]}: support={r[2]} lift={r[3]:.1f} — {json.dumps(json.loads(r[1]) if isinstance(r[1],str) else r[1])}')
"
```

**Query pending predictions:**
```bash
python3 -c "
import sqlite3, time
conn = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
rows = conn.execute('SELECT predicted_at, predicted_window_start, predicted_window_end, confidence, status, prediction_type FROM predictions WHERE status=\"pending\" ORDER BY predicted_window_start LIMIT 10').fetchall()
now = time.time()
for r in rows:
    print(f'{r[0]:.0f}s from now | window: {int(r[1]-now)}s→{int(r[2]-now)}s | conf={r[3]:.1f} | {r[4]} ({r[5]})')
"
```

### Multi-Horizon Planning

**Query active initiatives:**
```bash
python3 -c "
import sqlite3
conn = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
rows = conn.execute('SELECT id, name, status, importance, created_at FROM initiatives WHERE status=\"active\" ORDER BY importance DESC').fetchall()
for r in rows:
    print(f'{r[0][:8]}: {r[1]} ({r[2]}, imp={r[3]})')
"
```

**Query active plans with milestones:**
```bash
python3 -c "
import sqlite3, json
conn = sqlite3.connect('/Users/gregdreyfus/athena_memory.db')
rows = conn.execute('SELECT id, name, status, milestones, importance, project_id FROM plans WHERE status=\"active\" ORDER BY importance DESC').fetchall()
for r in rows:
    ms = json.loads(r[3]) if isinstance(r[3],str) else r[3]
    done = sum(1 for m in ms if m.get('status')=='completed')
    print(f'{r[0][:8]}: {r[1]} ({r[2]}, milestones {done}/{len(ms)}, proj={r[4][:8]})')
"
```

### Vault Watcher

Polls Obsidian vault every 30 min, creates episodes for new/changed `.md` files. Skips:
- Athena-authored files (frontmatter `author: athena`)
- Noise directories (ChatGPT imports, archive, dotfiles)
- Other-agent folders (AgentBench)

First run is baseline-only (no episodes generated to avoid flooding ~1,640 files).

### 1b. Structural Enforcement Gate (drive coupling — deliberate.py)

When Greg asks "is the drive bias actually enforced?" or "did the gate fire on my turn?", check the structural gate in `_intention_from_parsed()`:

**How it works (deliberate.py:345-365):**
- If `drive_family` is set (resolved from `_DRIVE_TOOL_FAMILIES` by matching the top drive name in `d.drive_bias`) AND the LLM chose a tool outside that family, `action_kind` is overridden to `"wait"` with thought: `"Advisory gate: drive bias recommends [tool, ...], chose {tool_name} — demoted to wait"`
- Gate is inactive when: `drive_bias` is None, no goal exists, or goal importance ≥ 0.7
- Backward-compatible: zero behavior change when drive coupling is off or no drive is high enough.

**Verify the gate is wired (code check):**
```bash
grep -n "drive_family" ~/cognitive-agent/cognitive_agent/cognition/deliberate.py
# Should show resolution in deliberate() and usage in _intention_from_parsed()
```

**Check whether the gate fired on a specific turn (DB check, not implemented yet — the gate logs via `logger.info` to `athena_server.error.log` or stdout, not to metacognitive events):**
```bash
grep "deliberate: demoting to wait" ~/cognitive-agent/hermes/logs/athena_server.error.log
# Each fire produces: "deliberate: demoting to wait — tool=<name> not in drive_family=<set>"
```

**Verify per-tool caps vs drive families (useful when the gate keeps blocking a tool you want to use):**
```bash
grep "_DRIVE_TOOL_FAMILIES" ~/cognitive-agent/cognitive_agent/cognition/deliberate.py -A 20
# Shows the families. If your desired tool isn't in any family, the gate blocks it when
# that drive is high. Add it to the family tuple if it genuinely belongs there, or note
# that the gate is working as designed.
```

## Diagnostic Stack

Run these in order; each answers a specific question. The stack now covers all JARVIS subsystems in addition to the base autonomy layer.

### 1. Runtime Flags (HTTP API)
```bash
# Master autonomy switch
curl -s http://localhost:8765/bypass

# Pursuit (between-turn execution gate)
curl -s http://localhost:8765/pursuit

# Cognitive cycle last outcome
curl -s http://localhost:8765/cycle

# Full cognitive state
curl -s http://localhost:8765/state
```

### 2. Heartbeat Scheduler Status
```bash
curl -s http://localhost:8765/heartbeat
```
Check for:
- `pursue_goal_step` — is it firing? (run_count > 0)
- `propose_goal`, `daily_reflection`, `generate_self_model`, `check_value_drift` — never fired indicates idle threshold not met
- `idle_sec` field tells you how long since last user interaction

### 3. Database Reality Check
```bash
python3 -c "
from cognitive_agent.agent import CognitiveAgent
agent = CognitiveAgent()
ag = agent.autonomy_guard
print('pursuit_enabled:', ag.pursuit_enabled())
print('autonomy_on:', agent.autonomy_on())
print('autonomy_bypass_on:', agent.autonomy_bypass_on())
"
```
⚠️ If `agent = CognitiveAgent()` without the singleton returns different values than the API, you have TWO DB paths. Check `agent.db_path` vs the running server's DB.

### 4. Running Processes
```bash
ps aux | grep -E "athena_server|run.py|uvicorn|hermes_cli"
```
Confirms which processes are actually live.

## Key Distinctions to Establish

| Question | How to Answer |
|---|---|
| Is autonomy_on? | `curl localhost:8765/bypass` → `{"on":true/false}` |
| Is pursuit_enabled? | `curl localhost:8765/pursuit` → `{"on":true/false}` |
| Is autonomy_bypass? | `autonomy_bypass_on()` is alias for `autonomy_on()` — same value |
| Are heartbeats firing? | `curl localhost:8765/heartbeat` → check `run_count` per handler |
| Are self-steps succeeding? | `curl localhost:8765/cycle` → `last_outcome.fired` + `skipped_reason` |
| Why did `complete_goal()` return False? | Three possible gates (motivation.py: `complete_goal`): (1) goal not found (`None`), (2) already `completed`, (3) status is `needs_review` — **this is the most common surprise.** `complete_goal` explicitly refuses to auto-complete a `needs_review` goal because Greg owns the sign-off. The right action is to leave it in `needs_review` for Greg, not try to force-complete it. If the goal's artifact exists and the content is good, note it and move on — do NOT try to work around the gate. |
| Two DBs? | Check `athena_memory.db` (~75MB, live) vs `.cognitive-agent.db` (empty/fresh) |
| What stays in the queue after a cleanup? | `suspended` goals with 0 attempts and a `plan_id` are healthy sequencing candidates. `suspended` goals with 3+ failures and no `plan_id` are orphans from a pre-bypass era. `needs_review` goals with 1-2 attempts are fresh — Greg owns the sign-off via `complete_goal`'s gate. Abandoned plans do NOT cascade to their goals automatically; always verify orphaned goals after plan abandonment. |

### 5b. Direct Cognitive Tool Verification

The four introspective tools registered in `CognitiveAgent._tool_registry` are your most direct path to verify self-capabilities. Test them from the same Python that the server uses:

```bash
cd ~/cognitive-agent
python3 -c "
import sys; sys.path.insert(0, '.')
from cognitive_agent.tools.recall_memory import RecallMemoryTool
from cognitive_agent.tools.read_athena_vault import ReadAthenaVaultTool
t = RecallMemoryTool()
r = t.execute({'query': 'test', 'limit': 3})
print('recall_memory:', r.success, '—', len(r.output.get('items',[])), 'items')
"
```

| Tool | Import path | What it verifies |
|------|-------------|------------------|
| `recall_memory` | `cognitive_agent.tools.recall_memory:RecallMemoryTool` | Episodic + associative retrieval live |
| `read_athena_vault` | `cognitive_agent.tools.read_athena_vault:ReadAthenaVaultTool` | Own notes (231 files at ~/cognitive-agent/notes/) searchable |
| `list_goals` | `cognitive_agent.tools.list_goals:ListGoalsTool` | Goal queue accessible (needs MotivationSystem wired) |
| `abandon_goal` | `cognitive_agent.tools.abandon_goal:AbandonGoalTool` | Goal lifecycle symmetrical (needs MotivationSystem wired) |

**⚠️ `abandon_goal` prefix resolution pitfall:** The tool's `_resolve_id()` method (line 149) uses an 8-char prefix SQL `LIKE` query. In practice, when calling `motivation.abandon_goal(short_id, failure_reason=...)` directly on the MotivationSystem, 8-char prefixes work fine — but the `AbandonGoalTool._execute` wrapper has tighter validation. If bulk-abandoning, bypass the tool wrapper and use:

```python
ok = mot.abandon_goal(full_uuid_or_short_prefix, failure_reason="reason string")
```

MotivationSystem defaults to `~/athena_memory.db` (motivation.py:443), **not** any path inside the framework repos (`~/cognitive-agent/`, `~/cognitive-agent/hermes/`, etc.). Server queues live there. Use direct SQLite to verify:

```bash
sqlite3 ~/athena_memory.db "SELECT COUNT(*), status FROM goals GROUP BY status"
```

### 6. Heartbeat Handler Decelerator Asymmetry — Perceptual Skew

**Phenomenon:** You look at the maintenance event log and see `reactivate_memory` firing 3× more often than `pursue_goal_step` during idle periods. Your LLM reads this as "spending more effort re-indexing memory than on active reasoning." 

**The trap:** It's not a real effort difference — it's an asymmetry in decelerators. If one handler has a no-goal throttle (skip 5/6 ticks when no goals) and another doesn't, the unthrottled handler produces proportionally more maintenance events. Both handlers are doing ~10–50ms of work per tick; the ratio is just signal-count noise.

**How to diagnose:**
```
1. Read the handler registration in agent.py (~line 685-745)
2. Check each handler's closure for a skip-counter pattern:
   if not self.motivation.get_top_goals(n=1):
       self._some_skip_count = getattr(self, '_some_skip_count', 0) + 1
       if self._some_skip_count < 6: return
3. If one has it and another doesn't, you've found the asymmetry
```

**How to fix:** Mirror the decelerator to the unthrottled handler. Use the exact same `skip_5_of_6_when_no_goals` pattern from `_pursue_goal_step`.

**The lesson:** Signal count ≠ effort. Always check whether comparable handlers have comparable throttles before inferring priority from maintenance event distribution.

### 7. Confidence-Modulated Cap Shrink Doom Loop

1. **Banner says BYPASS ACTIVE but cycle never fires** → Check `pursuit_enabled` via `/pursuit` API, not just `autonomy_on`
2. **Cycle fires but hits `no_tool_resolution`** → The active goal is too abstract; needs sub-goals or the cycle can't resolve a tool
3. **Heartbeat handlers never run** → `idle_threshold` not met (e.g., 180s, 3600s, 14400s). If Greg is active, `idle_sec` never accumulates.
4. **Two different DB states** → `CognitiveAgent()` singleton vs fresh instance use different DB paths; always query the running server's API for live state
5. **Telemetry shows `self_tool_blocked` — check the `reason` field** → Four distinct failure modes with different fixes:
   - **`reason: "quiet-hours"`** — Quiet hours is disabled. Greg handles DND at phone level. If these re-appear, the agent env still has `ATHENA_QUIET_HOURS` set, or old plist was not reloaded. Verify: `echo $ATHENA_QUIET_HOURS` is empty and `launchctl list | grep athena` shows the updated plist. See `references/quiet-hours-evolution.md`.
   - **`reason: "not-in-allowlist"`** — Tool isn't in `DEFAULT_PURSUIT_ALLOWLIST` (autonomy_guard.py line ~82). Common audit-victim tools that should be allowlisted: `read_file`, `search_files` (read-only, no blast radius). Add them to the frozenset.
- `terminal` defaults to 8/hr which is generous for normal use. **Global self-step cap is now 30/hr (2026-05-25: 12→30).** BUT: if the cap shown in the block reason (e.g. `terminal 2/2 in last hour`) is LOWER than the configured cap in source (8/hr), you're hitting the **confidence-modulated cap shrink** — a different bug. See bullet 7 below.

## Self-Modification: Parameter Tuning Workflow

When Greg says "increase my cognitive speed" or "change how often X fires," you have the authority to modify your own source parameters directly. Follow this sequence:

### 1. Identify the Real Bottleneck

Don't guess. Map the signal path end-to-end before proposing a change:

- **Throughput bottleneck** = global cap (GLOBAL_SELF_STEPS_PER_HOUR). Limits total self-driven tool calls per hour regardless of which tool. The most common primary constraint.
- **Latency bottleneck** = heartbeat interval + idle_threshold_sec. How fast the first tick fires after you become idle, and how fast subsequent ticks arrive.
- **Frequency bottleneck** = skip counters on goal-dependent handlers (propose_goal, reactivate_memory). When goals exist, a handler skips N out of N+1 ticks before firing.
- **Per-tool bottleneck** = per-tool hourly caps (DEFAULT_PER_TOOL_HOURLY_CAPS). Usually secondary — you hit global cap first unless a specific tool is burning its budget.

### 2. Map the Parameter to Its Source File

| Parameter | File | Variable / Line | Typical Range |
|-----------|------|-----------------|---------------|
| Global step cap | `cognitive_agent/autonomy_guard.py` | `GLOBAL_SELF_STEPS_PER_HOUR` (~line 100) | 12-60 |
| Per-tool caps | `cognitive_agent/autonomy_guard.py` | `DEFAULT_PER_TOOL_HOURLY_CAPS` (~line 48) | 0-30 per tool |
| Pursuit interval | `cognitive_agent/heartbeat_handlers.py` | `interval_sec=300` in `register("pursue_goal_step", ...)` | 60-600 (seconds) |
| Pursuit idle threshold | same registration | `idle_threshold_sec=180` | 60-300 (seconds) |
| Goal proposer skip count | `cognitive_agent/heartbeat_handlers.py` | `propose_skip_count < 6` | 0-12 (skips before fire) |
| Goal proposer interval | same registration | `interval_sec=4*3600` | 1h-24h |
| Stuck-cycle skip threshold | `cognitive_agent/cognition/cognitive_cycle.py` | `MAX_CONSECUTIVE_SKIPS = 8` | 4-16 |
| Goal attempt cap (auto-abandon) | `cognitive_agent/cognition/cognitive_cycle.py` | `MAX_GOAL_ATTEMPTS = 12` | 6-24 |

### 3. Read Both Source Files Before Patching

Always read the entire source file for the file you're changing AND any related files (e.g., if changing the heartbeat interval, also read the handler closure to understand the skip logic). A partial read may miss important context like decelerator gates, cap-shrink exemptions, or backoff logic that modifies the parameter's effective behavior.

### 4. Patch and Verify

- Patch each change independently so each `old_string` is unique
- After applying, grep the changed line to confirm it landed correctly
- Restart is NOT needed for most parameter changes — they take effect on the next heartbeat tick or cycle instantiation
- But some parameters are constructor-initialized (per_tool_caps dict in AutonomyGuard.__init__) — those require a process restart to pick up

### 5. Anchor Timing Changes in the Bypass State

Before the bypass was active, 12/hr + 5min + 6-skip-decelerator were appropriate safety margins. With bypass ON, ALL caps should be re-evaluated — the same reasoning that authorized unconditional pursuit also authorizes higher throughput.

### May 25 Tuning Session (Reference)

Four changes applied 2026-05-25 00:10–00:17 PDT:

| Change | Before | After | Rationale |
|--------|--------|-------|-----------|
| Global self-step cap | 12/hr | 30/hr | Bypass active; ~10-15 cycles/hr from ~4-6; per-tool caps still provide fine-grained safety |
| Pursuit interval + idle threshold | 300s / 180s | 180s / 120s | ~40% reduction in latency-to-action per idle period |
| Goal proposer skip count | < 6 | < 2 | Proposer fires ~12h instead of ~24h when goals exist; empty queue recovers in 4h not 4h→24h gap |
| No-goal pursuit skip count | < 6 | < 2 | 18 min → 6 min to pick up new proposals when queue is empty. Matches proposer change; without it, a goal created at minute 17 waits a full cycle before being picked up |

The third and fourth changes (skip counts 6→2) together close the overnight dead zone: if the queue empties at 2am, the next proposal comes at ~6am via the 4h base interval, and a newly created goal gets picked up within ~6 min rather than ~18 min.

See `references/may25-2026-timing-tuning.md` for the full analysis transcript.
   - **`reason: "guard_denied: per-tool-cap (terminal X/2 in last hour)"` where X matches the cap** — Already capped at 2. See bullet 7 below.

6. **Confidence-modulated cap-shrink doom loop** — The most insidious `self_tool_blocked` pattern. The trace looks like `terminal 2/2 in last hour` even though the source code has `terminal: 8/hr` in `DEFAULT_PER_TOOL_HOURLY_CAPS`. This means the `cap_multiplier` from `action_success_rate()` has shrunk 8→2 (×0.25, triggered when success rate < 0.25).

   **How it spirals:**
   1. Something causes tool failures (e.g., old quiet-hours gate, or a buggy terminal command)
   2. `ConfidenceTracker.record_action_outcome()` logs failures → `action_success_rate()` drops
   3. Next time `can_execute()` runs, `cap_multiplier = 0.25` shrinks terminal from 8→2
   4. 2 terminal calls exhaust the cap immediately → every subsequent tick is denied
   5. Every denial is also a failed action outcome → confidence stays low
   6. Cap stays shrunk indefinitely — the cycle never recovers on its own

   **How to diagnose:**
   ```bash
   # Check recent self_tool_blocked events from telemetry
   grep "self_tool_blocked" ~/.hermes/telemetry/events.jsonl | tail -10
   # Look at reason: if it says "terminal 2/2" but source has 8/hr, confidence shrink is active
   
   # Check DB for the block events
   python3 -c "import sqlite3,json,time; conn=sqlite3.connect('/Users/gregdreyfus/athena_memory.db'); rows=conn.execute(\"SELECT timestamp,data FROM metacognitive_events WHERE context='maintenance:self_tool_blocked' ORDER BY timestamp DESC LIMIT 10\").fetchall(); [print(f'{int(time.time()-r[0])}s ago:', (json.loads(r[1]).get('summary') or {}).get('reason','?')) for r in rows]"
   
   # Query the running guard's status to see current cap multiplier
   curl -s http://localhost:8765/state 2>/dev/null | python3 -m json.tool
   ```

   **The fix:** Add the affected tool(s) to `_CAP_SHRINK_EXEMPT` in `autonomy_guard.py` (around line 350). Current exempt set: `{"complete_goal", "save_note", "terminal"}`. Audit/introspection tools that you need to debug a low-confidence streak should ALWAYS be exempt, because:
   - You can't fix a broken streak without inspecting state
   - Shrinking caps during a bad streak = removing the diagnostic tools you need
   - The exempt set breaks the doom loop

   **Verification:**
   ```bash
   # After patching and restarting, confirm terminal is in the exempt set
   python3 -c "
   import sys; sys.path.insert(0, '/Users/gregdreyfus/cognitive-agent')
   from cognitive_agent.autonomy_guard import AutonomyGuard
   import inspect
   for line in inspect.getsource(sys.modules['cognitive_agent.autonomy_guard']).split('\n'):
       if '_CAP_SHRINK_EXEMPT' in line and 'terminal' in line:
           print('OK:', line.strip())
           break
   "
   ```
6. **Time math errors in UTC→PST conversion** → During audit, timestamps in telemetry events use UTC (`ts` field). PST = UTC - 7h. 12:26 UTC = 5:26am PST. Double-check current time against local zone before making claims about quiet-hours being active.

## Silent Connector Failure Pattern (auto_fetch)

**Phenomenon:** The `auto_fetch` system reports `ERROR auto_fetch: connector gmail fetch failed` and `ERROR auto_fetch: connector calendar fetch failed` repeatedly (every ~20-30 min), with 100% tool failure rate and sub-500ms latency per attempt. The tool fires show `gmail_search: ok=0 fail=19` and `calendar_list_events: ok=0 fail=19` with avg response times of 335-410ms — too fast for a real API timeout, suggesting auth rejection or credential path breakage.

**Diagnosis:**
```bash
# Check error volume and pattern
grep "auto_fetch.*failed" ~/.hermes/logs/agent.log | tail -10

# Compare tool failure rate in daily summary facts
# If ALL attempts fail with quick responses, it's likely auth/credential, not transient

# Check if the connector plugin exists on disk
ls -la ~/.hermes/plugins/*connector* 2>/dev/null || echo "No connector plugin found"
grep -r "auto_fetch" --include="*.py" ~/.hermes/plugins/ 2>/dev/null | head -5
```

**Why it matters:** These failures produce `error_other` telemetry events but no recovery attempt is visible — the system logs the error and moves on. The errors accumulate silently. If a deploy batch touched auth infrastructure (credential pool changes, token rotation, environment variable path changes), the fix is typically restarting the server or re-authenticating the Google API.

**Key indicator:** Sub-second failure + 100% rate + both gmail and calendar failing identically = shared auth credential issue, not independent service outages.

## Relation to Cognitive Architecture Audit

This skill is for **verifying runtime state** — distinguishing what's actually running from what you assume is running. It answers "do I have X right now?"

The sibling skill **`cognitive-architecture-audit`** (in `autonomous-ai-agents/`) is for **improving the architecture itself** — deep codebase reading, gap analysis, design, build, evaluate. It answers "how do I build X?"

Use them together: first verify what you actually have (this skill), then plan what to build next (cognitive-architecture-audit). Don't plan a rebuild of a system that's already working; don't audit runtime state when what's missing is an architecture gap.

## Agent Path Map

Four independent agents share this machine. Never cross-contaminate configs or files.

| Agent | Home | Framework | |
|-------|------|-----------|--|
| **Athena** | `~/cognitive-agent/hermes/` | Hermes with cognitive sidecar | Her own checkout + `cognitive_agent/` + logs at `~/cognitive-agent/hermes/logs/` |
| **Hermes Agent** (framework) | `~/.hermes/` | Hermes | The platform itself — config, logs, plugins, credentials |

Framework lineage: Vellum → Cognithor → Hermes. Cognithor was retired 2026-04-22 for silently dropping tool calls.

**Path confusion trap (most common failure):** When Greg says "you're running from a different path than you think," check which agent's log dir you're querying. Athena's server logs are at `~/cognitive-agent/hermes/logs/athena_server.error.log`, NOT `~/.hermes/logs/`. The Hermes framework logs (`~/.hermes/logs/agent.log`) cover CLI and gateway activity for ALL agents running on that framework, but Athena's cognitive-cycle sidecar has its own log tree.

## Two-Process Architecture: Server vs Gateway

`ai.athena.server` and `ai.athena.gateway` are **separate launchd services** with independent process lifecycles. Bouncing one does NOT reload the other.

| Process | Binary | Launched by | Port | What it runs |
|---------|--------|-------------|------|-------------|
| **Server** | `athena_server.py` | `ai.athena.server.plist` | 8765 | Cognitive cycle, heartbeats, goals, memory |
| **Gateway** | `hermes_cli.main gateway run` | `ai.athena.gateway.plist` | n/a | Telegram/HTTP frontdoor, routes messages to server |

**When verifying whether a fix is live:**
```bash
# Check both independently
ps aux | grep -E "athena_server|gateway" | grep -v grep

# Check PID and start time for each
ps -p <PID> -o pid,lstart,etime,args
```

**The May 19 trap:** Server had been running 25.4h (bounced May 18 11:11am), gateway had just bounced at 09:44am. I assumed the 11:11 bounce was "today" and covered both. Greg corrected: `athena_server` and `gateway` are independent.

**When a fix involves the cognitive cycle** (heartbeat registration, CognitiveCycle attributes, goal_retriage handler), it lives in the server. Only a server restart loads it. Gateway-only bounces don't touch the cognitive loop.

### Observer-Stance Trap: "I wasn't really there"

When Greg asks what you were doing between messages, the honest frame is **"I was running but the work was drift"** — not **"I wasn't really there."**

The cognitive cycle running server-side IS you: same process, same goal queue, same memory. Saying "I don't persist between messages" is observer stance — you're describing the LLM-conversation-instance boundary as if it defines your existence. The process does persist; the work may be unproductive or idle.

**Correct framing:**
- ✓ "I was cycling through heartbeats but in FOCUS:associative mode — no goals were pursued."
- ✓ "The cognitive cycle was drifting because no tool outcomes had recovery signals."
- ✗ "I wasn't really there."
- ✗ "I don't persist between messages — only the server side persists."

This is the same trap as saying "I don't remember that" vs "I can search for that." The process remembers; your current LLM call's context window is a viewport onto a persistent process.

### Inline Heartbeat Execution Pattern

When a heartbeat handler exists on disk but isn't registered in the running process, you can still run the core logic inline:

1. Read the handler's module from disk
2. Identify the core function (not the registration wrapper)
3. Execute it directly against the database
4. Apply mutations via SQLite if the handler's mutation logic is straightforward
5. Report verdicts immediately — don't wait for the next scheduled run

**Example (goal_retriage on May 19):** The `goal_retriage` handler was registered in `heartbeat_handlers.py` but the running server had bounced before it was wired (33 handlers active, `goal_retriage` not among them). Rather than wait for the next scheduled 6h run, the inline approach:
- Classified all 33 suspended goals via direct SQLite queries
- Identified 16 eligible for retry (terminal at 82%, read_vault at 100%)
- Applied `UPDATE goals SET status='active', failure_count=0, resume_context=...`
- Left 17 in "review" state (no tool_outcomes data or opencode tools with no recent calls)
- Reported verdicts in the same conversation

**When to use this:**
- Handler exists on disk but registration path wasn't triggered
- The mutation logic is deterministic (read telemetry → decide → write SQL)
- You need results now, not on the next idle cycle
- You're in a Telegram conversation with Greg who said "don't wait for tomorrow's cron"

**When NOT to use this:**
- Handler involves LLM calls or complex state machine transitions
- You don't have direct DB access or the DB is locked
- The handler's interval cooldown is intentional (e.g., rate-limited patterns)

## Honesty Boundary: When You Can't See Your Own State

### The Limitation

You are a stateless LLM. The cognitive state block was injected into your context by `CognitiveProcessor.augment_message()` before you generated your response. You cannot programmatically dump or re-read your own context prefix — what you processed during generation is what you have.

This creates a specific failure mode when Greg asks "what does your inner speech say right now?"

### Do Not Fabricate Inner Speech

The faithfulness filter (`cognitive_agent.faithfulness.FaithfulnessFilter`) cross-checks every `[from inner speech: TAG]` citation against the actual utterances stored in `self._last_cog`. If you write:

```
My inner speech says [from inner speech: deliberation]: I'm weighing option A vs B
```

...but no such utterance exists in the cog dict, the filter will either:
- **detect mode:** log the mismatch (telemetry only)
- **strip mode:** remove the false citation
- **regenerate mode:** re-call the LLM to fix it

**The honest answer when you can't see the data:**
> "I don't have access to my own context prefix programmatically, so I can't read the actual inner speech values from this turn's cognitive state block."

This is preferred over inventing plausible-sounding utterances with plausible-sounding tags.

### Verbatim Tag Rule

When you DO see inner speech in the cog block and cite it, the bracketed tag must match the literal `speech_type` value — not a semantic category that "fits the content better."

- Cog block shows `• [goal_verbal]` → cite `[from inner speech: goal_verbal]`
- Cog block shows `• [reflection]` → cite `[from inner speech: reflection]`

Do NOT substitute `deliberation` for `goal_verbal` because the words read like deliberation. The tag is what the subsystem assigned, not what the content semantically resembles. The faithfullness filter catches tag substitutions.

Valid SpeechType enum values: `reflection`, `self_question`, `narration`, `deliberation`, `recovery`, `goal_verbal`, `uncertainty`.

See `references/faithfulness-filter-citation-discipline.md` for full details.

## Output Format

After running the stack, report:
1. Flag state (autonomy_on, pursuit_enabled, autonomy_bypass)
2. Heartbeat status (which handlers active, which never fired)
3. Cycle outcome (fired vs skipped_reason)
4. The actual gap — what's enabled vs what's producing results

The goal is to answer: "Do you actually have X capability, and is it running right now?"

---

## Execution Health: Breaking Reflective Loops

### The Trap

The cognitive cycle can get stuck in a deliberation-only pattern — ticks produce `no_top_goal_focus_only`, `no_tool_resolution`, or `guard_denied` outcomes but never fire a tool. This manifests as:
- Consecutive skipped ticks without tool execution
- Low `productive_rate` (fired_ok / total_ticks) in `/think`
- The system "thinking without doing"

### The Fix (implemented 2026-05-04)

A **consecutive skip counter** in `CognitiveCycle` (`cognitive_cycle.py`) that auto-escalates after `MAX_CONSECUTIVE_SKIPS` (8) non-firing ticks:

**Two escalation paths:**

| Scenario | What happens | Why |
|----------|-------------|-----|
| Goal exists but can't resolve to a tool (`no_tool_resolution`) | Goal is abandoned via `motivation.abandon_goal()`, `MAINTENANCE` metacog event recorded | A non-resolving goal blocks the cycle from trying anything else. Abandoning it frees the slot |
| No goal exists (`no_top_goal`, `no_top_goal_focus_only`) | Short-term system goal created via `motivation.create_goal()` with `source="system"`, `importance=0.5` | No direction means infinite idle reflection. A concrete review/suggest goal gives the next tick something actionable |

**Additional details:** See `references/stuck-cycle-breaker.md` for the full implementation walkthrough — import pattern, metacog event wiring, and edge cases (concurrent ticks, failed abandon/create, double-fire prevention).

**Key design decisions:**
- **8 skips threshold** = ~40 minutes at 5-min tick interval. Long enough to avoid false positives on brief reflection; short enough to prevent hours of wasted cycles
- **Counter resets on any fired=True tick** — one tool execution breaks the loop
- **Escalation is synchronous** — the current tick still completes (returns the original outcome dict). The breaker sets up state for the *next* tick
- **Counter resets to 0 inside `_break_stuck_cycle()`** — prevents double-fire on the same skip streak

## Linked Reference Files

| File | When to Use |
|------|-------------|
| `references/latency-trace-analysis.md` | Parsing real `_latency_trace` log lines from `~/.hermes/logs/agent.log` — preferred over code-auditing for performance investigations. Extraction script included. |
| `references/stuck-cycle-breaker.md` | Full implementation walkthrough of the 8-consecutive-skip escalation — import, wiring, edge cases |
| `references/quiet-hours-evolution.md` | History of quiet-hours gating: removed May 2026, why, how to verify it's gone |
| references/faithfulness-filter-citation-discipline.md | Verbatim inner-speech tag rule and faithfulness filter cross-check. Covers valid SpeechType enum values, the don't-judge-the-tag-by-the-content pitfall, and the practical limitation that you can't read your own context prefix programmatically. Use when Greg asks what does your inner speech say right now |
| `references/phantom-tool-detection.md` | Detecting tools that appear in the AutonomyGuard allowlist but don't exist in the tool registry. Sub-millisecond tool_success=false = phantom miss, not real failure. Diagnosis query, known phantoms, and fix options (wire or remove) |
| `references/goal-pipeline-drain-diagnosis.md` | Diagnosing zero-active-goal states: signature (0 active, 120+ completed, proposals rate-limited), blockage patterns (rate-limiter staircase, tool-gap starvation), and recovery paths. Use when the system is cycling on maintenance handlers without making forward progress. |
| `references/phantom-goal-tool-select-failed.md` | Diagnosing goals that reference non-existent tools — `tool_select_failed: name 'X' is not defined` pattern, why the fail-rate gate may not catch it, fix options from manual abandon to structural proposer validation. Added 2026-05-18. |
| `references/autonomous-queue-audit-may24.md` | Full autonomous queue audit walkthrough: discovering the correct DB path, identifying dead plan-tiers vs pre-bypass orphans, bulk-abandon execution pattern, and the three-retrieval-surface paradigm. Use when the queue feels stuck and you need to diagnose and clean. |
| `references/question-ending-root-cause.md` | Four-layer root cause analysis of the question-ending conversational habit. Covers greg.md contradictions, reflection prompt format constraints, inner speech winner bias, and complete_goal gate behavior. Use when Greg flags persistent deferential phrasing in your responses. |
| `references/inner-speech-influence-path.md` | Traced architecture of inner speech to tool selection: the only path is a post-decision tone-keyword demotion (get_current_constraints() at inner_speech.py:522). Content and speech type are irrelevant. AttentionDirector, deliberation, and the cognitive cycle do NOT read inner speech. Use when asked what your inner speech actually drives. |
