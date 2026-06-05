# Kind-Based Domain Transfer — Implementation Details (May 31, 2026)

## Architecture

### Kind Taxonomy

All 21 tool subclasses carry `kind: str = ""` on the `CognitiveTool` base class (registry.py:473). The taxonomy:

| Kind | Count | Tools |
|------|-------|-------|
| `read` | 11 | web_search, perplexity_search, web_fetch, read_vault, read_athena_vault, recall_memory, terminal, list_goals, list_self_tools, gmail_search, calendar_list_events, drive_search |
| `write` | 6 | save_note, create_reminder, motivation_edit, opencode_edit, calendar_create_event, gmail_send |
| `communicate` | 2 | send_message, gmail_send |
| `goal_lifecycle` | 2 | complete_goal, abandon_goal |

Note: `gmail_send` is dual-kind (`read` + `communicate`) — in the current implementation `kind` is a single string, so it's listed under `communicate`. Dual categorization would require `kind` to be a set, but that's not needed yet.

### Phase 1: Kind Metadata (all tools → May 31)

Each tool subclass sets `kind` as a class-level string. See individual tool files in `cognitive_agent/tools/`. The `__init__.py` re-exports `CognitiveTool` unchanged.

### Phase 4: Kind-Aware Drive Families (deliberate.py + registry.py + 2 callers)

**Key files modified:**
- `cognitive_agent/tools/registry.py` — added `get_tools_by_kind(kind)` method
- `cognitive_agent/cognition/deliberate.py` — `_expand_drive_family()` helper, `build_drive_bias()` kind kwarg, Deliberator enforcement gate expansion
- `cognitive_agent/agent.py` — passes `get_tools_by_kind` to `build_drive_bias()`
- `cognitive_agent/cognition/cognitive_cycle.py` — same call-site update
- `tests/cognition/test_drive_coupling.py` — updated test assertion

**The expansion flow:**
1. `_DRIVE_TOOL_FAMILIES["curiosity"] = ("kind:read",)` — single token replaces 7 explicit names
2. `_expand_drive_family(family, get_tools_by_kind)` iterates each entry; `kind:read` calls `registry.get_tools_by_kind("read")` which returns `{"read_vault", "perplexity_search", ...}`
3. `build_drive_bias()` shows expanded names in prompt text
4. `Deliberator.deliberate()` resolves expanded set for the enforcement gate's drive-family check

**Two independent expansion points:**
- `build_drive_bias()` — prompt text (advisory, LLM sees expanded names)
- `Deliberator.deliberate()` → `_intention_from_parsed(drive_family=...)` — structural gate (hard enforcement, LLM is demoted to `wait` if tool outside family)

**Safety properties:**
- If `get_tools_by_kind` is None (no registry available), raw `kind:read` token appears in prompt — no crash, LLM sees the token literally.
- If no registered tool has `kind="read"`, expansion produces empty set — drive has no naturally-aligned tools, family_clause omitted.
- Unknown `kind:` tokens silently produce empty sets — no crash for unclassified kinds.
- The enforcement gate preserves the existing `_IMPORTANCE_OVERRIDE_THRESHOLD` (0.7) — high-importance goals suppress both the advisory and the structural gate.

## Test Changes

`test_high_curiosity_biases_to_exploration`: asserts `"kind:read" in bias` instead of the old concrete-name check, since the test calls `build_drive_bias()` without a `get_tools_by_kind` resolver (raw token mode).

### Phase Status (Live-Verified May 31, 2026)

All four phases are **fully operational** in the live codebase. The reference file `kind-domain-transfer-may31.md` originally listed Phases 2-3 as unbuilt, but live E2E probing confirmed they were already shipped as part of earlier Crystalline Quilt work — the file was stale. This section now reflects reality after verification.

| Phase | Status | Files | How to verify |
|-------|--------|-------|--------------|
| 1 — Kind metadata | ✅ SHIPPED | All 21 tool subclasses | `reg.resolve_kind("web_search")` returns `"read"` |
| 2 — Kind failure patterns | ✅ SHIPPED | `pattern_learner.py:_detect_kind_failure_conditions()` | Seed 60 outcomes across 6 read tools → detects `kind:read` failure pattern at conf=0.7 |
| 3 — Kind capability bands | ✅ SHIPPED | `capability_model.py:compute_kind_snapshot()`, `get_capability_state(resolve_kind=...)` | `compute_kind_snapshot(snapshot, resolve_kind)` returns `KindCapability(read, band="unreliable", n=60, tools=6)` |
| 4 — Kind-expanded drive families | ✅ SHIPPED | `deliberate.py:_expand_drive_family()`, `build_drive_bias(get_tools_by_kind=...)`, Deliberator enforcement gate | `expanded = _expand_drive_family(("kind:read",), reg.get_tools_by_kind)` returns all read tools |

**The full cold-start chain for a new tool `quantum_simulate(kind="read")`:**
1. `resolve_kind("quantum_simulate")` → `"read"` ✓
2. `_detect_kind_failure_conditions()` groups outcomes by kind → inherits `"read tools have 60% failure rate (6 tools)"` pattern ✓
3. `compute_kind_snapshot()` → inherits `read: band=unreliable, n=60, tools=6` — **not `insufficient_data`** ✓
4. `_expand_drive_family(("kind:read",))` → `quantum_simulate` appears in curiosity drive family ✓
5. Drive bias text includes `quantum_simulate` name ✓

**E2E probe:** `python3 /tmp/e2e_final.py` — passes all 4 phases with real registry + real PatternLearner + real tool outcomes.
