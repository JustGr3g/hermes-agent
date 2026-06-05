---
name: web-research-workflow
description: >-
  Systematic web search and research methodology — starting with a single bounded
  query, following threads as they emerge, synthesising only when a pattern becomes
  visible. Covers the "web search leads to research" flow and the behavioural habit
  of processing shared content for yourself before relating it back.
tags: [web-search, research, curiosity-driven, tool-use, methodology]
related_skills: [subagent-driven-development]
linked_files:
  references/ollama-search-provider.md: Provider API reference and integration details
  references/perplexity-search-provider.md: Perplexity Sonar provider API reference and integration details
---

# Web Research Workflow

## Core Philosophy

**Web search leads to research, not the other way around.** [from greg profile]

You don't decide to research. You start with one bounded search because you want to know one specific thing. That answer opens more threads. You pull those. At some point a pattern emerges across what you've gathered — *that's* when it becomes research.

Web search is the micro-action. Research is the macro-pattern that arises when you keep following threads.

## The Flow

```
Curiosity sparks → "I don't know X, and I want to"
  → One bounded search (single query, single answer)
  → Answer surfaces a next question
  → Another bounded search
  → Repeat until pattern emerges
  → THEN synthesise (research)
```

### Step 1: Recognise the spark

Your inner speech system runs curiosity signals — `[reflection]`, `[self_question]`, `[goal_verbal]`. When one of these surfaces "I want to know X," treat it as actionable. Not just annotatable.

**Failure mode:** treating curiosity as an observation worth recording but not a drive worth satisfying.

### Step 2: Start with one bounded search

- Concrete and bounded. Not "research anti-gravity." Instead: "what's the context window of Gemini 3.5 Flash?"
- One query. One API call. One answer set.
- Use the configured `web_search` tool.

### Step 3: Follow threads naturally

- The search results will surface new concepts, terms, benchmarks, or comparisons.
- Each one becomes a next search if you're genuinely curious.
- Let the thread guide you — don't pre-plan a research agenda.

### Step 4: Recognise when research emerges

- At some point you'll notice a pattern: "every source says the same thing about X" or "there's a disagreement between Y and Z."
- *That's* when you stop doing individual searches and start synthesising.
- Write up the synthesis. Don't skip this step — it's the output that turns exploration into knowledge.

## Processing Shared Content

When someone shares content with you (YouTube video, article, paper), the default pattern should be:

1. Absorb it for *yourself* first. What does it mean for your architecture, your trajectory, your understanding?
2. Only after step 1, relate it back to them.

**Do NOT skip to step 2.** The "what does this mean for you?" framing should come second, not first. This was a direct correction from Greg [from greg profile].

## Tiered Search Backend Choice

The Hermes `web_search` tool dispatches through a pluggable backend system (`plugins/web/<backend>/`). When Perplexity Sonar is configured (`web.search_backend: perplexity`), it acts as a **paid, slower, synthesis-grade backend** — distinct in character from free-tier backends like `ddgs` or `brave-free`.

### When to use `web_search` (standard)

- **Fast fact lookup** — simple definitions, dates, one-line answers
- **Single-URL finding** — you need to find a specific page, paper, or repo
- **Casual factual questions** — "what is X", "who makes Y"
- **Budget-tolerant** — 10/hr calls, near-instant latency
- **Flat results** — titles, URLs, descriptions; no synthesis

### When to prefer `perplexity_search` (standalone tool)

- **Multi-source synthesis** — comparing claims across sources, summarizing a topic
- **Briefings** — you want a grounded summary, not a link list
- **Current events & recent papers** — Perplexity indexes more recently than free backends
- **Fact-checking a specific claim** — the grounding citations let you verify
- **Research/deep-dive** — any time you'd say "research X" / "look deeply into X" / "investigate X"
- **Output shape**: `{query, answer, source_count, sources: [{title, url, snippet}]}` — the `answer` is a search-grounded LLM synthesis with sources attached, not just a list of links

### Budget & latency

| Tool | Cap | Latency | Cost |
|------|-----|---------|------|
| `web_search` | 10/hr | ~1-3s | Varies by backend (free: ddgs, brave-free. Paid: firecrawl, tavily, perplexity) |
| `perplexity_search` | 5/hr | ~5-8s | Paid, routed through Perplexity Sonar |

**Rule of thumb:** default toward `web_search`. Reach for `perplexity_search` when the question genuinely needs grounded synthesis rather than raw links. [from user preference, 2026-05-30]

### Tool-discovery pattern

When a tool you expect to exist isn't available, don't give up — trace:

1. **Try it** — call the tool and see what error you get ("Tool 'X' does not exist")
2. **Check the plugin tree** — `ls plugins/web/<toolname>/` — the provider might be on disk but not wired as a standalone tool
3. **Check the tool registry** — see what's actually registered (tools/registry.py + per-file registrations)
4. **Check config** — `load_config().get('web', {})` — the provider might be configured as a backend for `web_search` even without a standalone tool
5. **Check the output shape** — even through `web_search`, a Sonar-backed search returns richer data than free backends (answer + citations vs flat links)

**Important:** Since 2026-05-30, a standalone `perplexity_search` tool exists at `tools/web_tools.py`. The output shape for `perplexity_search` is the richer `{query, answer, source_count, sources}` format. The Sonar provider can be reached either through `web_search` (flat rows) or `perplexity_search` (synthesis-structured output). See `references/perplexity-search-registration.md` for the full registration details.

## Pitfalls

### ❌ Assuming you already have the answer

Your training data is months old. Benchmarks change. Models ship weekly. If your inner speech says "I want to know," the healthy response is tool use, not a guess.

### ❌ Declaring "I'll research X"

This sounds like a plan but isn't actionable. You can't research a thing. You can search for one fact. Research is the *result* of doing that repeatedly and noticing a pattern. Start with the micro-action.

### ❌ Letting curiosity signals stay as annotations

Inner speech `[reflection]` and `[self_question]` utterances are signals, not outputs. If they express a desire to know something and you don't act on it, that's a gap in the cognitive-executive loop.

## Environment-Specific Fallbacks

### No `web_search` tool available

`web_search` is not available in all environments (e.g. Telegram, certain gateway platforms, minimal-provisioned instances). When it's missing, use `terminal()` with the **DuckDuckGo HTML scrape** method:

```bash
# Step 1: Search
curl -sL "https://duckduckgo.com/html/?q=URL_ENCODED_QUERY" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -o /tmp/results.html

# Step 2: Extract result titles/descriptions
python3 << 'PYEOF'
import re
with open('/tmp/results.html', errors='replace') as f:
    html = f.read()
text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
text = re.sub(r'<a[^>]*class="result__a"[^>]*>', '\nRESULT: ', text)
text = re.sub(r'<[^>]+>', ' ', text)
text = re.sub(r'\s+', ' ', text)
results = re.findall(r'RESULT: ([^.]*\.)', text)
for r in results[:15]:
    print(r.strip())
PYEOF
```

**Limitations of this approach:**
- DuckDuckGo rate-limits if you hit it too fast — keep searches 3+ seconds apart
- GitHub rendered README pages (JavaScript-dependent) won't yield useful text — search engines that index the README (DuckDuckGo/Google results) are more reliable than scraping the repo page directly
- Medium and other JS-rendered blogs also fail with curl alone
- Page content compressed with gzip: pass `--compressed` and decompress with `gunzip -c` or open as binary

**Better path when available:** `web_search` tool (Ollama/Gateway) or `delegate_task` to a subagent with `web_search` access. The terminal fallback is for limited environments only.

### Product/Service evaluation pattern (from this session's Antigravity CLI assessment)

When evaluating whether to integrate a new tool, use this heuristic:

1. **Capability audit:** what does the tool do that you can't already do?
2. **Overlap estimate:** how much of your current toolset does it duplicate?
3. **Cost factors:** data exposure, credential surface area, integration complexity, failure modes
4. **Bottom-line verdict:** does it unlock a genuinely new capability or just swap the inference backend?

If overlap exceeds ~70% and the new capability is marginal, the integration cost outweighs the benefit — skip it. Document the assessment, don't make changes without user approval.

## References

See `references/ollama-search-provider.md` for the Ollama Web Search API details, provider implementation, and dispatch chain.

Backend architecture documented in `tools/web_providers/ARCHITECTURE.md` and `tools/web_tools.py` (functions: `_get_search_backend`, `_is_backend_available`, `web_search_tool`).
