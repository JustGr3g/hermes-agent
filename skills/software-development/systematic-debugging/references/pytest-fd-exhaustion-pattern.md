# Pytest FD Exhaustion — SQLite Connection Leak Pattern

## Symptom

Tests fail intermittently with:
```
sqlite3.OperationalError: unable to open database file
```

The error appears on random tests, often mid-suite. Re-running the same
test in isolation passes. The error is **always** on `sqlite3.connect()`
or an open-database operation — never on query/insert.

## Root Cause

FD (file descriptor) exhaustion. Each `CognitiveAgent` instance opens
5–7 SQLite connections (episodic, associative, retrieval, motivation,
metacognition, persistence). Pytest runs tests in a process with a
default FD limit of 256. If tests create agents without calling
`close()`, the FDs accumulate until `sqlite3.connect()` hits the
process limit.

## Detection

```bash
# Confirm FD exhaustion:
pytest tests/ -q --no-header 2>&1 | grep "OperationalError"
# Count how many tests fail — if it's >5 and all on open-DB operations,
# it's FD exhaustion, not a DB schema issue.
```

## The Fix: Autouse Fixture with Constructor Monkeypatch

Instead of modifying every test that creates an agent (45+ call sites in
`test_smoke.py`), patch the constructor at the module level and track
instances:

```python
_open_agents: list = []


@pytest.fixture(autouse=True)
def _close_all_agents():
    """Autouse fixture — closes every CognitiveAgent opened during the test."""
    from cognitive_agent.agent import CognitiveAgent
    original_init = CognitiveAgent.__init__

    def tracking_init(self, *args, **kwargs):
        original_init(self, *args, **kwargs)
        _open_agents.append(self)

    CognitiveAgent.__init__ = tracking_init
    before = len(_open_agents)
    yield
    while len(_open_agents) > before:
        ag = _open_agents.pop()
        try:
            ag.close()
        except Exception:
            pass
    CognitiveAgent.__init__ = original_init
```

**Key design decisions:**
- **Constructor patching** — catches every agent, including ones created in
  helper functions (`_make_cycle_agent()`), fixtures (`agent(db)`), and
  inline test setup.
- **`before` snapshot** — tracks how many agents existed at fixture start
  so parallel tests don't interfere. Only closes agents created during
  THIS test.
- **Restore original `__init__`** — tears down the patch after each test
  so no state leaks between tests.
- **Try/except around close** — an agent that failed to fully initialize
  can still have partially-open connections; best-effort cleanup is safer
  than crashing the fixture.

## When Not to Use This

- If the test file only creates 1-2 agents in well-structured fixtures
  (e.g., `yield` + `finally`), just fix those specific fixtures.
- If the agent's `close()` method is expensive (synchronous writes to
  multiple SQLite DBs), the tracking fixture may add ~10-20ms per test.
  For ~150 test files, this is ~2-3s total — negligible.
