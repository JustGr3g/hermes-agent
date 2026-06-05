# Ollama Web Search Provider

Created 2026-05-25 to make Ollama Web Search the default search backend.

## API Reference

**Endpoint:** `POST https://ollama.com/api/web_search`
**Auth:** `Authorization: Bearer $OLLAMA_API_KEY`
**Body:** `{"query": str, "max_results": int}` (max_results default 5, max 10)
**Response:** `{"results": [{"title": str, "url": str, "content": str}, ...]}`

**Fetch endpoint:** `POST https://ollama.com/api/web_fetch` — fetches page content by URL. Not currently wired into Hermes as an extract provider.

## Provider File

`tools/web_providers/ollama_search.py` — `OllamaSearchProvider` class implementing `WebSearchProvider`.

Key characteristics:
- Checks `OLLAMA_API_KEY` env var first, then `ATHENA_OLLAMA_API_KEY` as fallback
- Normalises Ollama `content` → `description` in the standard Hermes result format
- Max results capped at 10 (Ollama server limit)
- 20s HTTP timeout
- Returns `{"success": True, "data": {"web": [...]}}` or `{"success": False, "error": str}`

## Registration Points (web_tools.py)

Three changes made:

1. **`_is_backend_available("ollama")`** — checks `OLLAMA_API_KEY` or `ATHENA_OLLAMA_API_KEY`
2. **`_get_backend()`** — added `"ollama"` to the recognised backends tuple (line ~129)
3. **`web_search_tool()` dispatch** — imports `OllamaSearchProvider`, calls `.search()`, normalises through the standard debug/save/return pattern

## Config

```yaml
web:
  backend: ollama           # Shared fallback (now resolves correctly)
  search_backend: ollama    # Per-capability override for web_search
  extract_backend: ''       # Falls through to auto-detect (Firecrawl etc.)
```

## Verification

```python
from tools.web_providers.ollama_search import OllamaSearchProvider
provider = OllamaSearchProvider()
result = provider.search("query", limit=3)
# → {"success": True, "data": {"web": [...]}}
```

## Env Vars

`~/.hermes/.env`:
```
OLLAMA_API_KEY=b1ebe50df841474ab60340c0e7a5c63c.cyRyy1lgQ9SwZGC2KPUrACRn
ATHENA_OLLAMA_API_KEY=...  # fallback (same value)
```
