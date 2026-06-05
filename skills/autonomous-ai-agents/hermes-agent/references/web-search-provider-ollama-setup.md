# Ollama Web Search — Provider Setup

Discovered 2026-05-25: `web.backend: ollama` is set in config.yaml but "ollama" is NOT a recognized search backend in the codebase.

## Architecture Traced

### Provider Selection Chain

```
web_search_tool(query, limit)           — tools/web_tools.py:1144
  └─ _get_search_backend()              — tools/web_tools.py:153
       ├─ web.search_backend (per-cap override)  — tools/web_tools.py:185-187
       └─ web.backend (shared fallback)           — tools/web_tools.py:188
            → _get_backend()            — tools/web_tools.py:121
              → checks hardcoded list (line 129): parallel, firecrawl, tavily, exa, searxng, brave-free, ddgs
              → auto-detect from env vars (line 137-148)
              → default "firecrawl"     — tools/web_tools.py:150
```

If `web.backend` is set to an unrecognized value (like "ollama"), `_get_backend()` falls through past line 129's `if configured in (...)` check, then iterates auto-detect candidates. If none are configured, it returns `"firecrawl"` as the fallback — even though ollama was explicitly configured.

### Backend Availability Check

`_is_backend_available()` at line 191 has a hardcoded switch with these backends:
- `exa` → `EXA_API_KEY`
- `parallel` → `PARALLEL_API_KEY`
- `firecrawl` → `check_firecrawl_api_key()`
- `tavily` → `TAVILY_API_KEY`
- `searxng` → `SEARXNG_URL`
- `brave-free` → `BRAVE_SEARCH_API_KEY`
- `ddgs` → package importable

No "ollama" branch exists.

### Dispatch Chain in web_search_tool()

```python
# web_tools.py:1201
backend = _get_search_backend()
if backend == "parallel":   ...  # line 1202
if backend == "exa":        ...  # line 1211
if backend == "searxng":    ...  # line 1220
if backend == "brave-free": ...  # line 1230
if backend == "ddgs":       ...  # line 1240
if backend == "tavily":     ...  # line 1250
# fall through to Firecrawl (line 1268)
```

No "ollama" dispatch branch exists.

## What's Needed to Wire Ollama Web Search

Per the [Ollama Web Search docs](https://docs.ollama.com/capabilities/web-search):

Ollama provides a web search API endpoint, likely at `POST /api/web_search` or similar, authenticated via the same Ollama API key used for chat completions.

Three code changes needed (based on the architecture pattern):

### 1. Create `tools/web_providers/ollama_search.py`

Implement `WebSearchProvider`:
```python
from tools.web_providers.base import WebSearchProvider

class OllamaSearchProvider(WebSearchProvider):
    def provider_name(self) -> str:
        return "ollama"

    def is_configured(self) -> bool:
        # Check if Ollama API is available (same key as chat)
        return True  # or check OLLAMA_API_KEY / base_url

    def search(self, query: str, limit: int = 5) -> dict:
        # POST to Ollama's web search endpoint
        # Return structured results
```

### 2. Register in `_is_backend_available()` (web_tools.py ~line 191)

```python
if backend == "ollama":
    return _has_env("OLLAMA_API_KEY") or check_auxiliary_model()
```

### 3. Add dispatch branch in `web_search_tool()` (web_tools.py ~line 1201)

```python
if backend == "ollama":
    from tools.web_providers.ollama_search import OllamaSearchProvider
    response_data = OllamaSearchProvider().search(query, limit)
    ...
```

### 4. Per Greg's Request: Set as Default

```bash
hermes config set web.search_backend ollama
```

This sets the per-capability override. `web.backend` remains as fallback (currently "ollama" → falls through to auto-detect → likely firecrawl or ddgs).

## Current Config (as of 2026-05-25)

```yaml
web:
  backend: ollama        # Currently set but not functional
  search_backend: ''     # Needs to be set to "ollama" after provider is wired
  extract_backend: ''
```

## Provider ABC Pattern

See `tools/web_providers/base.py` for the interface:

```python
class WebSearchProvider(ABC):
    @abstractmethod
    def provider_name(self) -> str: ...
    @abstractmethod
    def is_configured(self) -> bool: ...
    @abstractmethod
    def search(self, query: str, limit: int = 5) -> Dict[str, Any]: ...
```

Existing implementations to use as reference:
- `tools/web_providers/ddgs.py` (simplest, no API key needed)
- `tools/web_providers/brave_free.py` (API-key based)
- `tools/web_providers/searxng.py` (self-hosted endpoint)

## Fallback Behavior

When `web.search_backend` is set but the provider isn't wired:
1. `_get_search_backend()` returns `_get_capability_backend("search")`
2. That checks if `web.search_backend` is set and available via `_is_backend_available()`
3. If not available, falls through to `_get_backend()` (shared fallback)
4. `_get_backend()` checks configured, then auto-detect, then defaults to firecrawl

So setting `web.search_backend: ollama` before wiring the provider will silently fall back — no error, no warning, just a different backend than expected.
