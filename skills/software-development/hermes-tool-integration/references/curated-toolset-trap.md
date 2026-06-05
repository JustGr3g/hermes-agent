# The Curated-Toolset Trap

`toolsets.py` has two kinds of toolset definitions:

1. **Bundles that inherit `_HERMES_CORE_TOOLS`** — most platforms. Add your tool to `_HERMES_CORE_TOOLS` and it shows up everywhere. Examples: `hermes-cli`, `hermes-cron`, `hermes-telegram`, `hermes-discord`, `hermes-whatsapp`, `hermes-slack`, `hermes-signal`, `hermes-bluebubbles`, `hermes-homeassistant`, `hermes-email`, `hermes-mattermost`, `hermes-matrix`, `hermes-dingtalk`, `hermes-feishu`, `hermes-weixin`, `hermes-qqbot`, `hermes-wecom`, `hermes-wecom-callback`, `hermes-yuanbao`, `hermes-sms`.

2. **Curated bundles with explicit allowlists** — these maintain their own `tools: [...]` list, ignoring `_HERMES_CORE_TOOLS` except for the items they enumerate. They exist to keep the tool-schema footprint small and cut cold-prefill cost on the main model. Example: `hermes-athena-telegram`.

The trap: editing `_HERMES_CORE_TOOLS` does NOT make your tool visible to a session using a curated toolset. You must also edit the explicit list in that toolset.

## How to identify the active toolset

The active toolset for the current session is determined by the gateway or CLI config. For Telegram, the channel config in `~/.hermes/config.yaml` typically points to a toolset name. Quick check:

```python
import sys; sys.path.insert(0, '/path/to/hermes')
from toolsets import TOOLSETS
# Look at the actual session — the gateway logs the resolved toolset at startup.
# For example, "hermes-athena-telegram" appears in gateway.log when the channel comes up.
print(list(TOOLSETS.keys()))
```

Or, more directly — look at your last `gateway.log` line for the active session:

```bash
grep -i "toolset" ~/.hermes/logs/gateway.log | tail -5
```

## How to find every curated toolset

```python
from toolsets import TOOLSETS, _HERMES_CORE_TOOLS
curated = []
for name, ts in TOOLSETS.items():
    tools = ts.get("tools", [])
    # Bundles that reference _HERMES_CORE_TOOLS directly will have the same
    # object identity; curated ones have a fresh list.
    if isinstance(tools, list) and tools is not _HERMES_CORE_TOOLS:
        # A curated list is one that doesn't share identity with the core list
        # and doesn't extend it (e.g. hermes-discord: _HERMES_CORE_TOOLS + ["discord"]).
        if tools == _HERMES_CORE_TOOLS:
            continue
        curated.append((name, tools))
for name, tools in curated:
    print(name, "->", len(tools), "tools")
```

A curated list is one whose `tools` field is a literal list (not the `_HERMES_CORE_TOOLS` reference). The `hermes-athena-telegram` is the canonical example in the cognitive-agent tree.

## The right edit

When wiring a new tool, edit *both*:

```python
# 1. Add to _HERMES_CORE_TOOLS (covers 14+ platform toolsets)
_HERMES_CORE_TOOLS = [
    ...
    "todo", "memory",
    "my_thing",                  # ← here
    "session_search",
    ...
]

# 2. ALSO add to the curated toolset the active session uses
"hermes-athena-telegram": {
    "description": "...",
    "tools": [
        ...
        "todo", "memory",
        "my_thing",              # ← and here, with a comment
        "session_search",
        ...
    ],
}
```

## Verify the edit reached the right list

Don't trust the edit was applied correctly. Run a check that lists every toolset the new tool is in:

```python
from toolsets import TOOLSETS, _HERMES_CORE_TOOLS
TARGET = "my_thing"
in_core = TARGET in _HERMES_CORE_TOOLS
print(f"core: {in_core}")
for name, ts in TOOLSETS.items():
    tools = ts.get("tools", [])
    if isinstance(tools, list) and TARGET in tools:
        print(f"  ✓ {name}")
```

The session's *resolved* toolset name is what matters — that's the one the LLM sees. If `hermes-athena-telegram` is the active toolset and `my_thing` is in its `tools` list, the LLM will see it. If it's only in `_HERMES_CORE_TOOLS`, the LLM won't, even if 18 other toolsets include it.

## Why curated toolsets exist

From the comment in `toolsets.py` for `hermes-athena-telegram`:

> Curated toolset for Athena's Telegram channel — pruned to drop tools that have zero usage in 69 sessions of telemetry: browser_* (12), TTS, image_generate, process, clarify, ha_* (4), kanban_* (7). Reduces the tool-schema footprint in every prompt by ~26 tools / ~16KB to cut cold-prefill cost on the main model.

The cost rationale is real. A curated list exists because the team measured that 26 tools were never called in 69 sessions of telemetry. Adding a brand-new tool to the curated list bypasses that data, but the cost of *not* adding it is the LLM not knowing the tool exists.

The right trade-off: **add the tool with a dated comment** (so future curators can re-evaluate once telemetry accrues), and patch the curated list when the tool starts showing real usage.

## What I learned the hard way

Adding `athena` to `_HERMES_CORE_TOOLS` and verifying via `resolve_toolset` returned the tool — but `resolve_toolset` followed the core list, not the curated list. The session was using `hermes-athena-telegram`, a curated list that didn't have `athena`. The LLM never would have seen it. The fix was a second patch to the curated list, and a more rigorous verification: don't ask "is the tool in the core list?" ask "is the tool in the *resolved* toolset the active session is using?"
