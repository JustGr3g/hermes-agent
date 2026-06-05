# Deserialization Fix + Edge Decay (2026-05-22)

## Silent Graph Deserialization Bug

**File:** `cognitive_agent/persistence.py` — `GraphSerializer.deserialize()`

**Root cause:** The SQLite blob at `~/athena_memory.db` used `"edges"` as the edge-list key in the node-link JSON. `nx.node_link_graph()` in networkx 3.x expects `"links"`. The bare `except Exception` in the catch-all swallowed the KeyError and returned an empty `nx.Graph()` on every load.

**Impact:** Associative memory was effectively empty — 6,643 nodes / 76,061 edges present in the blob but zero at runtime. Every `spreading_activation()` seeded an empty graph. Every `extract_and_link()` added to in-memory graph that *did* serialize correctly but vanished on reload.

**Fix (3 lines):**
```python
data = json.loads(raw)
if 'edges' in data and 'links' not in data:
    data['links'] = data.pop('edges')
return nx.node_link_graph(data, directed=False)
```

**Verified:** Loading now returns 6,643 nodes / 76,061 edges. Spreading activation produces 1,841 concepts from seed terms.

## Recency-Aware Edge Decay

**File:** `cognitive_agent/memory/associative.py` — new `decay_edges()` method

- 14-day half-life: weight halves every 14 days without re-access
- Removal threshold at 0.01
- Legacy backfill: edges without `last_accessed` get backfilled to `now` on first call
- `add_edge()` stamps `last_accessed` at creation
- `update_edge_weight()` and `spreading_activation()` traversal bump `last_accessed` on traversed edges
- `ConceptEdge` dataclass got `last_accessed` field

**Wired into:** `CognitiveCycle.__init__()` — runs once on server restart.

## DB VACUUM

406MB → 50MB (356MB reclaimed) via `sqlite3` on a backup copy. The live server holds the lock on the original DB; swap on restart:
```
cp ~/athena_memory.db.pre_vacuum ~/athena_memory.db
```

## PLUR Assessment

Only 49 engrams, 345 episodes. `plur batch-decay` CLI doesn't exist in v0.8.0. Not urgent.

## Self-Model Update

Saved as AthenaNote in `self-reflection` category. Key reframe: prior 50% effectiveness score was structurally bounded by three compounded failures (augment fan-out, cognitive-state discard, silent graph deserialization). All three now resolved.
