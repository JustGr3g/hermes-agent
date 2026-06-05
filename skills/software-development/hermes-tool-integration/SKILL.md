---
name: hermes-tool-integration
description: "Use when wiring a new tool (built-in or plugin) into the Hermes tool layer so the agent loop can call it. Covers both the in-tree `tools/foo.py` path and the out-of-tree `plugins/foo/` path, the `_HERMES_CORE_TOOLS` vs curated-toolset distinction, the multi-HERMES_HOME trap, the never-raise `_request` contract, and the end-to-end verification sequence."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [hermes, tools, plugins, toolsets, integration, development]
    related_skills: [hermes-agent, hermes-agent-skill-authoring, requesting-code-review]
---

# Hermes Tool Integration

Hermes exposes tools to the LLM in two distinct ways: **built-in tools** that live in the in-tree `tools/` directory and self-register via `registry.register()` at module level, and **plugin tools** that live in `plugins/<name>/` and register via a `register(ctx)` hook called by the plugin loader. Both paths end in the same model_tools resolver, but the wiring is different, and there are four traps that bite every new tool author: writing to the wrong Hermes tree, forgetting the curated toolset, letting `_request`-style HTTP helpers raise unhandled exceptions, and forgetting that the **plugin loader is opt-in via the active `HERMES_HOME`'s `config.yaml`** — a separate file from any toolset list, and not the same as `~/.hermes/config.yaml` if you have multiple trees.

This skill is the *integration* layer between code and the agent loop. For pure code style or a single tool's domain logic, see other skills. For the canonical "Adding a Tool" reference bundled with Hermes, see the `hermes-agent` skill (this skill is the *complement* — it captures the integration pitfalls and the multi-tree, multi-toolset, never-raise nuances that the bundled reference documents in skeleton form only).

## When to Use

- You're adding a brand-new tool (built-in or plugin) to Hermes.
- You're adding a tool that wraps a local service (FastAPI on a port, a CLI, an SDK) and you want the agent to call it.
- You're debugging "I added the tool, but the agent never calls it" — almost always a curated-toolset gap or a `check_fn` that always returns False.
- You're moving a tool from one Hermes tree to another (e.g. from `~/.hermes/hermes-agent/` to a worktree under `~/cognitive-agent/hermes/`).
- You're adding a tool to a platform-specific toolset (e.g. `hermes-athena-telegram`) and need to know whether the core list edit alone is enough.

**Don't use for:**
- Pure prompt-engineering / system-prompt tuning (not a tool-layer concern).
- Slash commands — those go through `hermes_cli/commands.py` and a different registry.
- MCP server tooling — Hermes talks to MCP servers via the `mcp_tool.py` adapter, not via the registry this skill covers.

## Two Integration Paths

### Path A: In-tree built-in tool

Drop a `tools/<name>.py` file that calls `registry.register(...)` at module level. `tools/registry.py::discover_builtin_tools()` will pick it up automatically on next hermes load — no manual list edit. You *do* still need to add the name to `toolsets.py` so the toolset allowlist knows about it.

```python
# tools/my_thing.py
import json
from tools.registry import registry

def _check() -> bool:
    return True   # or env-var / port-listen check

def my_thing(query: str, task_id: str = None) -> str:
    return json.dumps({"ok": True, "query": query})

registry.register(
    name="my_thing",
    toolset="my_thing",
    schema={
        "name": "my_thing",
        "description": "Do the thing.",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    handler=lambda args, **kw: my_thing(
        query=args.get("query", ""), task_id=kw.get("task_id")
    ),
    check_fn=_check,
)
```

### Path B: Plugin (out-of-tree)

Create `plugins/<name>/plugin.yaml` + `plugins/<name>/__init__.py` with a `register(ctx)` function. The plugin loader discovers the YAML and calls your function with a context that has `ctx.register_tool(name=..., schema=..., handler=..., toolset=..., check_fn=..., emoji=...)`.

```yaml
# plugins/my_thing/plugin.yaml
name: my_thing
version: 0.1.0
description: "Wraps the MyThing service."
author: Hermes Agent
kind: backend
provides_tools:
  - my_thing
```

```python
# plugins/my_thing/__init__.py
def register(ctx) -> None:
    ctx.register_tool(
        name="my_thing",
        toolset="my_thing",
        schema={...},
        handler=_handle,
        check_fn=_my_thing_available,
        emoji="🔧",
    )
```

**Path B is the right default** for any tool that wraps an external service, an SDK, or a local daemon. It keeps the in-tree core clean and survives the next hermes-agent release without merge conflicts. The bundled `hermes-agent` skill covers Path A only — Path B is the practical default for new tools.

## The Three Traps

### Trap 1: Wrong Hermes tree

Hermes can be installed in multiple trees on the same machine (the main `~/.hermes/hermes-agent/` checkout, plus per-project worktrees like `~/cognitive-agent/hermes/`). Each tree has its own `tools/`, `plugins/`, `toolsets.py`, and `skills/`. **A file in the wrong tree is invisible to the agent and silently does nothing.**

Always confirm before writing:

```bash
echo "HERMES_HOME=$HERMES_HOME"
python -c "import sys; print(sys.executable)"
```

Both should point to the tree you intend to edit. If `HERMES_HOME=/Users/.../cognitive-agent/hermes` but your `cd` took you to `~/.hermes/hermes-agent/`, **every file you write is in the wrong place.** The same applies to `python` — use the venv at `$HERMES_HOME/venv/bin/python` for any integration test, not the system Python.

This trap fires when the most recent file read in the conversation came from one tree and the user is actually working in a different one. The two-line ground-truth above is the only reliable check.

### Trap 2: Curated toolset is the load-bearing allowlist

`toolsets.py` defines `_HERMES_CORE_TOOLS` (the shared default list) and a `TOOLSETS` dict of named bundles. Many named bundles — `hermes-cli`, `hermes-telegram`, `hermes-discord`, etc. — reference `_HERMES_CORE_TOOLS` directly and inherit whatever's in it. **But some don't.** The curated lists (e.g. `hermes-athena-telegram`) maintain an *explicit* allowlist of tools, ignoring `_HERMES_CORE_TOOLS` except for the items they enumerate. The curated lists exist to keep the tool-schema footprint small and cut cold-prefill cost.

Concrete consequence: adding your tool to `_HERMES_CORE_TOOLS` is *necessary but not sufficient* for it to be visible to the LLM. If the active session is using a curated toolset, you must also add the tool's name to that toolset's explicit list.

**Verification (do not skip):**

```python
from toolsets import TOOLSETS, _HERMES_CORE_TOOLS
# The active toolset name comes from the gateway/CLI config — for Telegram
# it's the one in the channel config, often "hermes-athena-telegram" or
# "hermes-telegram". Check the gateway's resolved toolset, not just the core list.
for name, ts in TOOLSETS.items():
    tools = ts.get("tools", [])
    if "my_thing" in tools or "my_thing" in (tools if isinstance(tools, list) else []):
        print(f"  {name}: ✓")
    else:
        pass
```

The right check: confirm the *resolved* toolset the current session is using actually contains your tool. If the gateway/CLI uses `hermes-athena-telegram`, look up `TOOLSETS["hermes-athena-telegram"]["tools"]` directly and add to that list — not just to `_HERMES_CORE_TOOLS`.

### Trap 3: `_request`-style helpers must never raise

If your tool's handler calls out to a local daemon (HTTP, gRPC, CLI, file), the handler should *never* propagate an unhandled exception. The agent layer treats exceptions as a hard error and may abort the turn; structured 0-error returns let the LLM see the failure and decide what to do.

The minimal pattern:

```python
def _request(method, path, *, params=None, body=None):
    try:
        with urllib.request.urlopen(_build_req(method, path, params, body), timeout=8.0) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, {"error": f"http_{e.code}", "body": _safe_read(e)}
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return 0, {"error": f"connection_failed: {e!r}"}
    except Exception as e:                   # ← the safety net
        # http.client.InvalidURL inherits from HTTPException, NOT ValueError.
        # Anything you don't catch here leaks to the agent loop.
        return 0, {"error": f"unexpected: {type(e).__name__}: {e!r}"}
```

**Why the broad `except Exception` is right, not lazy:** stdlib exceptions that look related often aren't. `http.client.InvalidURL` looks like a `ValueError` (it has "URL" in the name) but inherits from `HTTPException`. `ssl.SSLError` has its own hierarchy. A targeted catch list will miss something; an `Exception` catch-all with a structured error preserves the type name and lets the agent diagnose.

Verify the contract with a known-bad input before shipping — pass a dict where a string is expected and confirm you get a structured `{"status": 0, "body": {"error": "..."}}` response, not a traceback.

### Trap 4: Plugin loader is opt-in, and the allowlist lives in a profile-specific config

A plugin that has the right `plugin.yaml`, the right `__init__.py`, the right `toolsets.py` entry, and a passing `check_fn` **can still be invisible to the agent** if it's not in `plugins.enabled` in the *active* `HERMES_HOME`'s `config.yaml`.

The plugin loader (`hermes_cli/plugins.py::PluginManager.discover_and_load`) reads:

```python
def _get_enabled_plugins() -> Optional[set]:
    from hermes_cli.config import load_config
    config = load_config()   # ← reads $HERMES_HOME/config.yaml
    plugins_cfg = config.get("plugins")
    if "enabled" not in plugins_cfg:
        return None
    enabled = plugins_cfg.get("enabled")
    return set(enabled) if isinstance(enabled, list) else set(...)
```

Three ways this trap fires:

1. **You built the plugin but never added it to `plugins.enabled`.** The manifest parses, the loader finds it, and then logs `Skipping '<name>' (not in plugins.enabled)` at DEBUG. The plugin object is in `pm._plugins` but its `register(ctx)` is never called, so `_plugin_tool_names` does not include it. From the outside it looks like the plugin loaded but the tool never appeared.
2. **You added it to the wrong config.** `~/.hermes/config.yaml` and `~/cognitive-agent/hermes/config.yaml` are *different* files with *different* allowlists. The active `HERMES_HOME` is the one that gates the loader. Edits to the wrong config are silently ignored.
3. **You put the plugin in `disabled`.** Some profiles have `evey-cache`, `evey-reflect`, `evey-validate` listed under `plugins.disabled` (a deny-list that wins over `enabled`). Adding to `enabled` while still in `disabled` does nothing.

**Diagnostic probe** (do this when `tool_name in pm._plugin_tool_names` is False even though `tool_name in pm._plugins` is True):

```python
import logging
logging.basicConfig(level=logging.DEBUG)
from hermes_cli.plugins import PluginManager
pm = PluginManager()
pm.discover_and_load(force=True)
# Look for the "Skipping" line — that's the allowlist at work
# Also confirm:
print('enabled read:', pm._get_enabled_plugins.__wrapped__(pm) if hasattr(pm._get_enabled_plugins, '__wrapped__') else 'see _get_enabled_plugins()')
```

Or more simply, run with `HERMES_PLUGINS_DEBUG=1` and grep the boot log for the `Skipping` line. If you see it, the allowlist is the problem; the plugin is otherwise correct.

**Fix:** add the plugin's name to `plugins.enabled` in `$HERMES_HOME/config.yaml`. The list is usually alphabetical. **Do not edit `~/.hermes/config.yaml` from inside a non-main tree** — it's the wrong file. The patch tool's protected-file guard will (correctly) refuse, and that's your signal that you're at the wrong layer.

## End-to-End Verification Sequence

After writing the tool, run these in order. Any failure here means the tool will not be visible to the agent.

```bash
# 1. Confirm the active tree
echo "HERMES_HOME=$HERMES_HOME"
python -c "import sys; print(sys.executable)"

# 2. Activate that tree's venv
cd "$HERMES_HOME" && source venv/bin/activate

# 3. Confirm plugin/built-in imports cleanly
python -c "import my_thing_module; print(my_thing_module.__file__)"

# 4. Confirm registration works
python -c "
class _Ctx:
    def __init__(self): self.tools=[]
    def register_tool(self, **kw): self.tools.append(kw)
ctx = _Ctx()
import my_thing_module
my_thing_module.register(ctx)
print('registered:', [t['name'] for t in ctx.tools])
"

# 5. Confirm toolsets.py changes are in
python -c "
from toolsets import TOOLSETS, _HERMES_CORE_TOOLS
print('core:', 'my_thing' in _HERMES_CORE_TOOLS)
for name in ('hermes-cli','hermes-cron','hermes-telegram','hermes-athena-telegram'):
    if name in TOOLSETS:
        ts = TOOLSETS[name]
        in_curated = isinstance(ts.get('tools'), list) and 'my_thing' in ts['tools']
        in_core = 'my_thing' in _HERMES_CORE_TOOLS
        print(f'  {name}: curated_match={in_curated} core_match={in_core}')
"

# 6. Live smoke against the daemon / service
python -c "
import my_thing_module
r = my_thing_module._handle(query='ping')
print(r)
"

# 7. Restart the gateway (curated toolset changes take effect on next session,
#    not mid-conversation — prompt caching depends on this)
```

Step 7 is non-negotiable. The active session is *cached* and will not see the new tool until `/reset` (CLI) or `/restart` (gateway). Don't try to call the new tool from the same session that wrote it — you can't, and you shouldn't claim you can.

### Plugin-only verification (skips for built-ins)

```bash
# 8. Confirm the plugin loader picks it up AND the allowlist doesn't skip it
cd "$HERMES_HOME" && source venv/bin/activate
HERMES_PLUGINS_DEBUG=1 python -c "
import sys; sys.path.insert(0, '.')
from hermes_cli.plugins import PluginManager
pm = PluginManager()
pm.discover_and_load(force=True)
print('plugin dict:', 'my_thing' in pm._plugins)
print('plugin_tool_names:', 'my_thing' in pm._plugin_tool_names)
" 2>&1 | grep -E 'Skipping|plugin|Loaded'
```

If you see `Skipping 'my_thing' (not in plugins.enabled)` in the output, the plugin is fine — the active `config.yaml` is the problem. Add the name and rerun. If you see `Loaded plugin 'my_thing'` and `plugin_tool_names: True`, the tool is wired and will appear after the gateway restart in step 7.

## Common Pitfalls

1. **Writing to `~/.hermes/` when `HERMES_HOME=~/cognitive-agent/hermes/`.** See Trap 1. The two-line ground-truth is `echo $HERMES_HOME && python -c "import sys; print(sys.executable)"`.

2. **Adding the tool to `_HERMES_CORE_TOOLS` only.** See Trap 2. Check the *resolved* toolset, not the core list. For curated toolsets, you must edit the explicit `tools: [...]` array.

3. **Catching `ValueError` for URL exceptions.** `http.client.InvalidURL` is not a `ValueError`. Use `except Exception` for the safety net, with a structured error that preserves the type name.

4. **Forgetting `check_fn`.** Without a `check_fn`, the tool surfaces in the agent schema even when the daemon is down. The LLM will call it, get a connection error, and waste a turn. `check_fn` should hit a cheap liveness probe (e.g. `GET /health` with a 1s timeout) and return False when the dependency is unreachable.

5. **Forgetting `provides_tools` in `plugin.yaml`.** The plugin loader iterates the YAML and reads `provides_tools` to know what to surface in the resolved toolset. Without it, the plugin loads but the tool never appears.

6. **Trying to call the new tool from the same session.** Toolset changes don't take effect until the next session. Restart the gateway or start a new chat.

7. **Forgetting to add the plugin to `plugins.enabled` in the active `HERMES_HOME`'s `config.yaml`.** See Trap 4. The plugin loader is opt-in; without the allowlist entry, the manifest parses but `register(ctx)` never fires. The boot log will say `Skipping '<name>' (not in plugins.enabled)`.

7. **Mismatched handler signature.** The handler is called with `(args_dict, **kwargs)` where kwargs includes `task_id`, `session_id`, `tool_call_id`. Use `**kwargs` to absorb the rest, or list them explicitly. Forgetting `task_id` is the most common.

8. **Schema's `action` enum is wrong.** If the tool uses an action-enum pattern (one tool, many endpoints), the enum must list every action. Missing actions return structured errors but the LLM won't know they're available. Mirror the schema to a constant and reference it from both the enum and the dispatcher.

9. **Using the system Python instead of the Hermes venv.** The venv at `$HERMES_HOME/venv/` has the dependencies (urllib, json, etc., plus any SDKs). System Python may not — and if the venv isn't activated, the integration test will use the wrong interpreter.

10. **Not running the test from the active tree.** `python -c "import my_thing_module"` works from anywhere if the module is on `PYTHONPATH`, but the *import path* and *venv* are what matter. Always `cd $HERMES_HOME && source venv/bin/activate` before testing.

## Verification Checklist

- [ ] `echo $HERMES_HOME` and `python -c "import sys; print(sys.executable)"` both point to the tree you intend to edit
- [ ] Tool/plugin code is at `$HERMES_HOME/tools/foo.py` OR `$HERMES_HOME/plugins/foo/{__init__.py,plugin.yaml}`
- [ ] `plugin.yaml` has `provides_tools: [your_tool]` (plugins) — or the in-tree `tools/foo.py` calls `registry.register(...)` at module level (built-ins)
- [ ] `toolsets.py`: your tool's name is in `_HERMES_CORE_TOOLS` *and* in the explicit allowlist of any curated toolset the active session uses (find it from the gateway/CLI config)
- [ ] (Plugin tools only) your plugin's name is in `plugins.enabled` in `$HERMES_HOME/config.yaml` — verify with `HERMES_PLUGINS_DEBUG=1 python -c "..."` and confirm `plugin_tool_names: True`
- [ ] `_request`-style helper uses `except Exception` (or a structurally-correct catch list) and returns `{"status": 0, "body": {"error": "..."}}` on failure
- [ ] `check_fn` is wired and returns False when the dependency is unreachable
- [ ] Schema is valid JSON-schema and the handler signature accepts `(args, **kwargs)`
- [ ] Live integration test from the active venv: import + register + handle returns 200-shaped response
- [ ] Gateway has been restarted (or new session started) — toolset changes don't apply mid-conversation

## One-Shot Recipes

### Adding a new plugin tool that wraps a local FastAPI daemon

```bash
HERMES_HOME=$(echo $HERMES_HOME)   # capture, don't assume
cd "$HERMES_HOME"
source venv/bin/activate
mkdir -p plugins/my_thing
# write plugins/my_thing/plugin.yaml + __init__.py
# edit toolsets.py to add "my_thing" to BOTH _HERMES_CORE_TOOLS and the curated toolset
python -c "
import sys; sys.path.insert(0, '.')
import plugins.my_thing as P
class _Ctx:
    def __init__(self): self.tools=[]
    def register_tool(self, **kw): self.tools.append(kw)
ctx = _Ctx(); P.register(ctx)
print('registered:', [t['name'] for t in ctx.tools])
print('gate:', P._check_my_thing_available())
r = P._handle_my_thing(action='ping')
print('live:', r.get('status'), r.get('body'))
"
# restart gateway
```

### Moving a tool from one tree to another

```bash
# Wrong way: rsync and hope
# Right way:
SRC_TREE=~/.hermes/hermes-agent
DST_TREE=~/cognitive-agent/hermes
diff -r "$SRC_TREE/tools/foo.py" "$DST_TREE/tools/foo.py"   # are they identical?
diff -r "$SRC_TREE/toolsets.py" "$DST_TREE/toolsets.py"     # any divergence?
# Copy the tool file. Re-do the toolsets.py edit in the destination tree.
# Verify: cd $DST_TREE && source venv/bin/activate && python -c "import toolsets; 'foo' in toolsets._HERMES_CORE_TOOLS"
# Restart destination gateway.
```

### Diagnosing "agent never calls my tool"

1. Is the tool in the *resolved* toolset for the active session? `python -c "from toolsets import TOOLSETS; print(TOOLSETS['<active-toolset-name>']['tools'])"`
2. Is the tool's `check_fn` returning True in the running environment?
3. Is the daemon the tool wraps actually listening? (Most `check_fn` implementations hit `/health`.)
4. Did the gateway restart after the wiring? (Toolset changes don't apply mid-conversation.)
5. Is the handler raising? Add a `try/except` if it isn't already.
6. **For plugin tools:** is the plugin in `pm._plugin_tool_names` after `discover_and_load(force=True)`? If `False` but `pm._plugins` contains the plugin's manifest, the loader is skipping it — run with `HERMES_PLUGINS_DEBUG=1` and grep the boot log for `Skipping '<name>' (not in plugins.enabled)`. The fix is to add the plugin's name to `plugins.enabled` in `$HERMES_HOME/config.yaml`. (Trap 4.)
