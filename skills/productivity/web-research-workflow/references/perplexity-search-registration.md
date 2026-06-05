# `perplexity_search` Tool Registration

Registered 2026-05-30 in `tools/web_tools.py` as a standalone tool alongside `web_search`.

## Schema

```python
PERPLEXITY_SEARCH_SCHEMA = {
    "name": "perplexity_search",
    "description": "Search the web with Perplexity Sonar — returns a synthesized answer grounded in source citations. Use this over web_search when you need multi-source synthesis: comparing claims, summarizing a topic, researching current events or papers, fact-checking a specific claim, or deep investigation. NOT for one-word lookups, finding a single URL, or casual factual questions — use web_search for those. Budget: 5 calls/hour. Average latency: 5-8 seconds.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query to research."
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of source citations to return. Defaults to 5, max 20.",
                "minimum": 1,
                "maximum": 20,
                "default": 5
            }
        },
        "required": ["query"]
    }
}
```

## Handler

`perplexity_search_tool(query, limit=5)`:

1. Uses same backend resolution as `web_search` — calls `_get_search_backend()` to find the configured backend, then `get_provider(backend)` or `get_active_search_provider()` as fallback
2. Calls `provider.search(query, limit)` — the normalized response has the Perplexity synthesis as position 1 (title "Perplexity Answer")
3. Splits the flat `data.web` rows into:
   - `answer` (position 1's description)
   - `sources` (positions 2..N, each: `{title, url, snippet}`)
4. Returns `{query, answer, source_count, sources}`

## Registry Entry

```python
registry.register(
    name="perplexity_search",
    toolset="web",
    schema=PERPLEXITY_SEARCH_SCHEMA,
    handler=lambda args, **kw: perplexity_search_tool(
        args.get("query", ""), limit=args.get("limit", 5)),
    check_fn=check_web_api_key,
    requires_env=_web_requires_env(),
    emoji="🔮",
    max_result_size_chars=50_000,
)
```

## Credential Injection Quirk

The `PerplexityWebSearchProvider` checks `os.getenv("PERPLEXITY_API_KEY")` for availability and API calls. Hermes loads keys via `get_env_value()` which reads `~/.hermes/.env` without writing to `os.environ`. In subprocess/test contexts the tool will error "No web search provider configured" or "PERPLEXITY_API_KEY environment variable not set."

**Workaround for testing:**

```python
from hermes_cli.config import get_env_value
import os
key = get_env_value("PERPLEXITY_API_KEY")
if key:
    os.environ["PERPLEXITY_API_KEY"] = key
```

At full boot (CLI or gateway), the credential pool populates `os.environ` for registered providers, so this is only an issue for isolated Python processes.
