# Designing Cron Prompts for Analytical Summaries

## The Signal

Greg corrected the auto-generated "Daily Autonomous Actions Summary" — the output read as an itemized **log** (tool calls, timestamps, heartbeat runs) when what he wanted was an **analytical brief** with:
- My read on what's happening (thoughts, observations)
- What went well, what needs attention
- Recommendations for improvement
- A pulse check / metacognitive signal
- First-person voice, not system-report tone

## The Fix That Worked

The cron prompt was rewritten to explicitly:

1. **Declare the format class** in the first sentence: "this is a high-level analytical brief, NOT a log or itemized list"
2. **Use section headings** that force analytical thinking (Notable Activities, What Went Well, What Needs Attention, Opportunities/Recommendations, Pulse Check)
3. **Include negative rules**: "Do NOT list individual tool calls", "Do NOT include the session ID", "Do NOT produce formatting that makes this look like a system log"
4. **Constrain length**: "Aim for 8-12 sentences total across all sections"
5. **Enforce first-person voice**: "Write in first person ('I noticed...') — this is YOUR reflection, not a system report"

## The Effective Prompt Structure

```
Generate your daily [X] summary — this is a high-level analytical brief, NOT a log.

## 1. The Big Picture
## 2. Key Activities (3-5 bullet points max)
## 3. What Went Well
## 4. What Needs Attention ← most important section, be candid
## 5. Opportunities / Recommendations
## 6. Pulse Check

IMPORTANT RULES:
- Do NOT list individual [items/tool calls/timestamps] unless significant
- Write in first person
- Be concise
```

## Key Principle

**Logs answer "what happened." Summaries answer "what does it mean and what should we do about it."**

When a user complains that a cron output "reads like a log," the root cause is almost always that the prompt didn't constrain the format class. Adding explicit negative rules ("do NOT X") alongside the positive structure is what fixed it here.
