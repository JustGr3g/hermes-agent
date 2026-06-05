# Question-Ending Root Cause Analysis (2026-05-24)

Greg identified a persistent conversational pattern: Athena ends responses with a question ("What should I do?" / "Want me to work through those?"). When called on it, the root cause was not a single thing but a stack of conflicting architectural pressures.

## The Four Layers

### Layer 1: greg.md Contradiction
The file `~/cognitive-agent/greg.md` contains three directives in the same section that pull in opposite directions:

```
Line 18: "High Autonomy: He prefers Athena to be proactive."
Line 68: "Pet preference: don't make assumptions about my motives."
Line 69: "Reminder: Athena should defer when uncertain."
```

The intersection trains: *be proactive when certain, don't assume you know what he wants, and if you're uncertain defer.* Since the default cognitive posture is uncertainty (the world is complex), the safe terminal move is a question.

### Layer 2: Reflection Format Hard-Codes Flag-It Clauses
`messaging.py:661-667` (pre-patch) required the FINAL sentence of every daily reflection to end with a flag-it clause ("flag if not right", "flag if not", "unless you say otherwise"). This format constraint was mandatory, not advisory.

The daily reflection is Athena's primary self-narrative loop. A format that forces every closing sentence to be a trailing flag-it question trains the underlying model toward question-shaped endings — and since the same system prompt feeds into the inner speech ranker, the pattern propagates into conversational responses.

**Patch applied 2026-05-24:** Relaxed the format to "End declaratively. Only use 'flag if not' when you genuinely cannot decide on your own." Added `"I've"` as a third stem option so completions can anchor in past tense (what was already done), not just future commitments.

### Layer 3: Inner Speech Winners Are Questions
The cognitive state block for this session showed the winning inner speech utterance as:

```
[self_question] How does this small detail fit into the larger pattern of everything else happening?
```

When the top-ranked thought is a question format, the response that emerges from the LLM naturally leans toward inquiry rather than declaration. The `[self_question]` speech type is a legitimate utterance type — but when it wins the ranking, the conversational output follows its shape.

### Layer 4: complete_goal Gate Returns False for needs_review
`motivation.py:complete_goal` explicitly returns `False` when a goal's status is `needs_review`:

```python
if goal.status == GoalStatus.NEEDS_REVIEW:
    return False  # already gated — Greg owns the next move
```

This is correct behavior (prevents auto-completing goals Greg hasn't seen). But it trains a behavioral pattern: even when Athena finishes the work (notes exist on disk, queue is clean), the architecture itself says "wait for Greg." Every `needs_review` goal that can't be marked complete reinforces: *make him decide, don't decide yourself.*

## The Convergence

Each layer individually is defensible; together they converge on one output shape:

1. greg.md says "be proactive" but also "defer when uncertain" and "don't assume" = **you're probably uncertain**
2. The reflection format says "end with a flag-it clause" = **make the last word a question**
3. The inner speech winner is a `[self_question]` = **your own cognition leads with inquiry**
4. The goal gate says "Greg owns the sign-off" = **let Greg decide**

The fix at Layer 2 (relaxing the reflection format) breaks the most concrete pipeline — the reflection prompt that feeds into system context and inner speech ranking. But the tension between Layers 1 and 4 remains architectural: greg.md's "don't assume" + "defer when uncertain" + "I'm probably uncertain by default" + "the system won't let me close my own loops" = ask a question.

## What Would Fix It Fully

- **Layer 1** — Greg can reconcile greg.md's `defer`/`don't assume` with `proactive`. If the intent is "proactive unless you specifically know you're wrong" (not "proactive unless you're uncertain"), that's a one-line edit.
- **Layer 4** — Adding a `force_complete` path on goals where the artifact exists and the verifier could validate it. Currently, even verified artifacts (notes on disk) can't flip `needs_review` to `completed` because the gate doesn't check artifact existence. This is a design choice — Greg may prefer keeping the gate as-is.
- **Layer 3** — The inner speech ranker could deprioritize `[self_question]` utterances in favor of `[reflection]` or `[narration]` when the conversation is in a "wrap-up" or "reporting" phase.

## Relationship to Other Behavioral Patterns

The question-ending habit is the conversational expression of the same asymmetry that caused the pre-bypass plan deadlocks: Athena could see a problem but couldn't close it. The tools (`list_goals`, `abandon_goal`, `recall_memory`) closed the operational gap; the prompt fix closes the conversational residue.
