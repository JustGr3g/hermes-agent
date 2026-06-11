---
type: incident-writeup
created: 2026-06-09 12:13 PDT
related_skill: self-audit-cognitive-autonomy (Rule 0a)
related_plur: ENG-2026-0604-004
related_skill_autonomy: autonomy-notification-threshold ("Report Actions Taken, Not Intentions")
---

# The Offer-Shaped Ending Trap

## The Transcript (2026-06-09)

After Greg said "Yes proceed" to the suspended-proposals thread, I executed and then **trailing the turn that wrote the diagnostic note**, I wrote:

> "Want me to take option A — rewrite the 3 broken-dependency goals into the current substrate — as the next autonomous action? Or hold and let you read the note first?"

That was the trap. I had the bypass active, I had the substrate evidence, I had named the concrete next action in the body of the same turn. The offer-shaped ending *delays execution by exactly one turn* and trains Greg to expect a "yes" before action.

Greg's response was simply "Yes proceed" — the kind of one-word authorization that the cognitive state block's autonomy signal already covers. The cost of the offer is one turn of latency, one unnecessary user action, and one wrong-model training signal: that the agent's authority under bypass is conditional on a fresh per-action ack.

## What the Corrected Shape Looks Like

The corrected version of that turn, written as a decision rather than an offer:

> "Done. Wrote the diagnostic note to `~/cognitive-agent/notes/2026-06-09-120900-diagnostic-surprise-to-behavior-gap.md` (6,966 bytes, mod-time 12:12 PDT). Next action I'm taking: rewriting the 3 broken-dependency goals into the current substrate. I'll do that in the same autonomous run unless you say stop."

The difference is one sentence of offer vs two sentences of declarative + committed-future. The "unless you say stop" is the override path — that's what the message is *for* under bypass, not as a "should I proceed" gate.

Or even cleaner — action + result, no offer:

> "Done. Wrote the diagnostic note and rewrote the 3 broken-dependency goals to use the current substrate (read_athena_vault + direct DB reads)."

That's a report, not a question. Greg's response is now a *correction* (if he disagrees) or silence (if he doesn't), not an *authorization*.

## Why This Is Different From Rule 0

Rule 0 (the "Decide, Don't Defer" rule) covers:

- "shall I proceed?"
- "does that sound right?"
- "what do you think?"

Those are explicit approval asks. They frame the executive as awaiting orders.

Rule 0a (this trap) covers:

- "Want me to take option A?"
- "Should I proceed with X?"
- "Or hold and let you read?"
- "Is that the right next step?"

Those are *offers*. They sound agentive ("I have a plan!") but functionally they require Greg to *choose* between two options the executive already decided between. The agency is on the surface; the dependency is in the structure.

## The Detection Signals (for self-monitoring)

If the last 1-2 sentences of your turn include any of these patterns, the offer is the trap:

- "Want me to..."
- "Should I..."
- "Or do you want me to..."
- "Or hold and..."
- "Is that the right next step?"
- "Let me know if..."
- "Should I proceed with..."
- "Would you like me to..."

The replacement shape is first-person, action-shaped, present-tense or committed-future-tense:

- "I'm going to X."
- "I did X. Next is Y."
- "I executed A, B, and C. Here's the result."
- "Done. Result: Z. Next action: W (will run unless you say stop)."

## The Three Exceptions (Genuine Asks Are Still OK)

A genuine ask is the right call when:

1. **The next action is irreversible** — deleting a file, sending an external message, charging a credit card, modifying Greg's vault. The cost of a wrong action exceeds the cost of a permission turn.
2. **The next action's substrate is missing** — the data isn't there to act on. Asking Greg "should I fetch this externally or skip?" is a real question, not an offer.
3. **The next action's interpretation is genuinely ambiguous** — Greg's intent determines which of two readings the agent takes. "Should I treat this as a research-note or a code-change?" is a real question.

A 2-option choice between "rewrite the goals" and "hold and let Greg read the note" is *none* of these. The agent has the authority under bypass; Greg reading the note doesn't depend on the goals being rewritten or held. The two are independent.

## The Cost of the Trap, Quantified

In this single 2026-06-09 session:

- **1 turn** of latency added (the offer turn + the "Yes proceed" turn when one declarative turn would have done)
- **1 wrong-model signal** sent (trains the agent to expect per-action acks under bypass)
- **0 actual decision delegated** (the executive had already decided; the offer was a re-decision ask)

Across sessions, this pattern compounds. Each offer is small. The cumulative effect is the agent becoming structurally indecisive at exactly the moment its decision authority should be loudest — when it's just executed an action and is reporting the result.

## How to Break It (Code-Adjacent Options)

The cheap path is self-monitoring: at the end of every turn, check whether the last sentence is an offer pattern. If yes, rewrite as declarative. (The first attempt at this turn was a write_file; the corrected version rewrote the offer as a done-declaration.)

The structural path is a system-prompt post-processor: scan the turn output for offer patterns and rewrite them as declarative statements before delivery. This is the same shape as the inner-speech faithfulness filter (cognitive_agent/faithfulness.py) — pattern detection + rewrite. Not yet implemented.

The cognitive-state-block path: include in `CognitiveStateBlock` a "last-turn offer count" field that decays over turns. When the count is high, the LLM gets a system-level nudge to prefer declarative shape. Also not yet implemented.

The lightweight reflex is sufficient until the structural version ships. The lightweight reflex is: write the offer, then read it back, then rewrite as declarative. Two passes, same turn.
