# Perplexity Sonar Web Search Provider

Created 2026-05-30 as a bundled plugin. Provides search-grounded LLM synthesis as a web search backend.

## API Reference

**Endpoint:** `POST https://api.perplexity.ai/v1/sonar`
**Auth:** `Authorization: Bearer $PERPLEXITY_API_KEY`
**Header:** `Content-Type: application/json`

**Body fields:**
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| model | string | no | "sonar" | sonar, sonar-pro, sonar-reasoning-pro, sonar-deep-research |
| messages | [{role, content}] | yes | — | Standard OpenAI chat format |
| search_recency_filter | string | no | — | hour, day, week, month, year |
| search_domain_filter | string[] | no | — | Max 10 domains |
| search_mode | string | no | "web" | web, academic, sec |
| max_tokens | int | no | computed | 256–2048, proportional to requested result limit |

**Response shape:**
```json
{
  "choices": [{"message": {"content": "synthesized answer text"}}],
  "search_results": [{"title": "...", "url": "...", "snippet": "..."}],
  "citations": ["url1", "url2"]
}
```

## Provider File

`plugins/web/perplexity/provider.py` — `PerplexityWebSearchProvider` class implementing `WebSearchProvider`.

Key characteristics:
- `supports_search()` → True, `supports_extract()` → False (no page extraction)
- Normalizes Sonar response into standard Hermes format with synthesized answer as position 1
- Source pages fill positions 2..N
- Checks `PERPLEXITY_API_KEY` env var
- Timeout configurable via `web.perplexity.timeout` (default 60s)

## Config

```yaml
web:
  search_backend: "perplexity"    # Explicit per-capability
  backend: "perplexity"           # Shared fallback
  perplexity:
    model: "sonar"                 # sonar, sonar-pro, sonar-reasoning-pro, sonar-deep-research
    search_recency_filter: "month" # hour | day | week | month | year
    search_domain_filter: ["arxiv.org", "wikipedia.org"]
    search_mode: "web"             # web | academic | sec
    timeout: 60                    # seconds (default 60)
```

## Plugin Metadata

`plugins/web/perplexity/plugin.yaml`:
- name: web-perplexity
- version: 1.0.0
- kind: backend
- provides_web_providers: [perplexity]

## Registration

Auto-registered at plugin load via `plugins/web/perplexity/__init__.py`:
```python
def register(ctx) -> None:
    ctx.register_web_search_provider(PerplexityWebSearchProvider())
```

The provider registers into `agent/web_search_registry.py` and is selected when `web.search_backend` or `web.backend` is set to "perplexity" in config.yaml.

## Env Vars

`~/.hermes/.env`:
```
PERPLEXITY_API_KEY=...   # Get at https://www.perplexity.ai/settings/api
PERPLEXITY_BASE_URL=...  # Optional override of https://api.perplexity.ai
```

## Verification

```python
from agent.web_search_provider import get_active_search_provider
provider = get_active_search_provider()
result = provider.search("your query here", limit=3)
# → {"success": True, "data": {"web": [{"title": "Perplexity Answer", "url": first_citation, "description": "..."}, ...]}}
```

## Standalone `perplexity_search` Tool

Since 2026-05-30, `perplexity_search` is a standalone tool registered at `tools/web_tools.py` alongside `web_search`. It wraps the same Perplexity Sonar provider plugin but returns a richer output shape:

```json
{
  "query": "...",
  "answer": "Perplexity's synthesized response...",
  "source_count": 4,
  "sources": [
    {"title": "...", "url": "...", "snippet": "..."}
  ]
}
```

**Registration details:**
- Schema: `tools/web_tools.py` — `PERPLEXITY_SEARCH_SCHEMA` with `name: "perplexity_search"`
- Handler: `perplexity_search_tool()` — calls `get_active_search_provider().search()` then splits the normalized response into the answer (position 1, title "Perplexity Answer") and sources (positions 2..N)
- Toolset: `web`, emoji: 🔮
- Budget: 5 calls/hr (vs 10/hr for web_search). Paid, ~5-8s latency.
- Max limit: 20 results (limit param, 1-20)

**Credential injection note:** The provider calls `os.getenv("PERPLEXITY_API_KEY")` for both availability checks and API calls. Hermes loads the key via `get_env_value()` which reads from `~/.hermes/.env` but does NOT set `os.environ` by default. At full boot time, the credential pool populates `os.environ` for registered providers — so the tool works in production sessions. In subprocess or test contexts, you must export the env var manually or call `get_env_value()` first and `os.environ.__setitem__()`.
