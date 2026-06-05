# Shadow Mode Enablement — 2026-06-02

## Decision

Flipped `athena_compose_resolution` from `"off"` → `"shadow"` in `cognitive_agent.db` runtime_flags.

## Rationale

The compose-resolution pipeline had been in `off` mode since it was built (~May 30). Goals hitting `no_tool_resolution` were failing silently (reflection-fallback only), accumulating attempt counts until the stuck_cycle handler abandoned them. The pipeline's groundedness gate was designed conservatively (cites evidence refs, ≥60 chars, NOGROUND signal), and shadow mode poses zero behavioral risk — outputs are logged via `logger.info` without dispatching.

## Risk Assessment (pre-flip)

**Delivery safeguards already in place:**
- Groundedness gate (citation check, length check, NOGROUND check)
- Telegram routing cues (conservative keyword match)
- Evidence-limited: compose is skipped if no memory evidence exists

**Real risk:** plausible-sounding nonsense that passes the gate. Low blast-radius — writes a shadow log entry.

**Recommendation before live:** Inspect 5-10 shadow outputs manually.

## How to Inspect

```
# View compose shadow outputs from the agent log
grep "compose-shadow" ~/.hermes/logs/agent.log | tail -20
```

Each line shows: goal ID prefix, the tool it would have used (save_note or send_message), and a 160-char preview of the synthesis text.

## Related PLUR

ENG-2026-0603-004 — compose resolution shadow mode flip recorded as architectural engram.