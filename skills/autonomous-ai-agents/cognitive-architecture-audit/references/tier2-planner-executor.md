# Tier 2 — CognitivePlanner + CognitiveExecutor (May 14, 2026)

## What was built

Two files that were missing from disk (`cognitive_agent/cognition/planner.py` and `cognitive_agent/cognition/executor.py`) — the `CognitiveLoop.run_turn()` lazy-imported them but the imports failed (ModuleNotFoundError), degrading the Observe→Plan→Act→Critic cycle.

## CognitivePlanner (`planner.py`, ~160 lines)

Deterministic signal-based strategy selector. No LLM calls — maps observed cognitive state to strategy names.

### Strategy selection rules

| Condition | Strategy | Priority |
|-----------|----------|----------|
| WM fill > 80% | `simplify` | Highest |
| `repeated_failure` or `high_frustration` signal | `replan` | High |
| `low_confidence` signal | `retrieve` | Medium |
| Active goals with zero recent episodes | `retrieve` | Medium |
| `uncertainty_rise` signal | `reflect` | Low |
| Nothing triggered | `reflect` | Default |

### Architectural notes

- Max 3 strategies per turn (`_MAX_STRATEGIES_PER_TURN = 3`)
- Deduplication preserves first occurrence order (not last)
- `ollama_client` parameter accepted for API compat, intentionally unused
- Returns `CognitivePlan` dataclass with `strategies: list[str]` and `reasoning: str`

## CognitiveExecutor (`executor.py`, ~240 lines)

Runs planned strategies against CognitiveAgent subsystems. Each strategy is an independent method called via dispatch dict.

### Strategy implementations

| Strategy | What it does | Fallback |
|----------|-------------|----------|
| `reflect` | Calls `inner_speech.metacognitive_narrate()` and `speech_monitor.emit()` | Deterministic text with signal summary |
| `retrieve` | Calls `agent.retrieval.retrieve(query, limit=3)` | Returns empty string |
| `simplify` | Calls `agent.wm.evict_low_importance()` if available, else `wm.prune()` | Returns "no eviction" |
| `replan` | Calls `agent.executive.decide()` | Returns degraded |
| `wait` | No-op — returns "Waiting" | N/A |

### Safety pattern

Every strategy wraps implementation in try/except and returns `StrategyResult(name, output, quality_score=0.0, degraded=True, error=str(e)[:100])` on failure. The dispatch dict guards against unknown strategy names.

## Integration point

`CognitiveLoop.run_turn()` in `loop.py` was already wired to call `self.planner.plan()` and `self.executor.execute()` — no changes needed there. One minor addition: `wm_capacity` was added to the `_observe()` state dict so the planner can compute WM fill ratio.

## Test results

- All 87 existing cognition tests passed
- All 5 planner smoke tests passed (default, overload, failure, confidence, dedup)
- All 5 executor smoke tests passed (wait, unknown, mixed, no-agent reflect, mock-agent reflect)