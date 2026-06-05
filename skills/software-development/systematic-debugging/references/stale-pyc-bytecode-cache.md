# Stale `.pyc` Bytecode Cache Pitfall

## Pattern

A bug fix exists in the `.py` source file but the running process continues to exhibit the **old behavior**. The fix is correct, tested, and committed — but invisible.

## Root Cause

Python's bytecode cache (`__pycache__/*.pyc`) is **not automatically invalidated** when the source file is modified in certain scenarios:

- **Lazy imports:** If a module is imported lazily (inside a method, not at module level), the `.pyc` timestamp check may not trigger a recompile. The cached bytecode from the first import continues to run.
- **Worktrees / copies:** If the process was started from one directory then files are edited in another copy, the `.pyc` at the original import path persists.
- **Hard restarts vs soft reloads:** A `launchctl kickstart` may not clean the bytecache — the OS restarts the Python process, which re-imports from `.pyc` that reflects pre-fix bytecode.
- **Cross-session imports:** If a module was imported in session A (compiling `.pyc`), then the source is patched in session B without clearing `__pycache__`, the new Python process in session B still loads the old `.pyc`.

## Detection

The failure signature is invisible at the code level:

```bash
# The .py file has the fix
grep "fix_function\|new_logic" module.py

# But the process still crashes with the OLD error
tail -20 logs/error.log
# → AttributeError: 'CognitiveAgent' object has no attribute 'hermes_home'
```

## Fix

```bash
# Nuke all bytecache in the project
find ~/cognitive-agent -name '__pycache__' -type d | while read d; do
  find "$d" -name '*.pyc' -delete
done
```

Or targeted:

```bash
rm -rf path/to/module/__pycache__
```

## Prevention

After editing any lazily-imported module, include bytecache cleanup in the deployment step:

```bash
launchctl unload ~/Library/LaunchAgents/ai.athena.server.plist
find ~/cognitive-agent -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null
launchctl load ~/Library/LaunchAgents/ai.athena.server.plist
```

## Real-World Example (2026-06-01)

The proposer (`goal_proposer.py`) had been crashing silently for 3 days with:

```
AttributeError: 'CognitiveAgent' object has no attribute 'hermes_home'
```

The `_resolve_hermes_home()` function (fixing the exact issue) already existed at line 55 of the source. But the `.pyc` at `__pycache__/goal_proposer.cpython-*.pyc` was compiled before the fix was committed. Every `propose_goal` heartbeat loaded the stale bytecode and crashed — zero new self-proposed goals for 3 days.

Clearing `__pycache__/` and restarting resolved it immediately.