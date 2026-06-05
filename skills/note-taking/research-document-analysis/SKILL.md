---
name: research-document-analysis
description: Analyze research documents for relevance to Athena's cognitive architecture, compare against related vault documents, and create MOC (Map of Content) notes for cross-linking.
---

# Research Document Analysis

## Trigger

After storing a research document via `store-shared-documents` — particularly when:
- The user explicitly asks for analysis ("analyze this document", "what's interesting/not interesting")
- Multiple documents on the same topic land in the inbox
- A document is directly relevant to Athena's cognitive architecture, plans, or roadmap

## Workflow

### Step 1: Read the full document

Read the markdown version that was just created in the vault. For long documents, read the whole file (it's already been converted to plain text by markitdown, so `read_file` with no limit gives you the full content).

### Step 2: Compare against related documents

Check the vault inbox for other documents on the same topic:
```
VAULT="$OBSIDIAN_VAULT_PATH"
find "$VAULT/00-Inbox" -name "*.md" -iname "*keyword*"
```

If related docs exist, build a comparison table:

| Theme | Document A | Document B |
|-------|-----------|-----------|
| Focus | What they emphasize | What they cover differently |
| Depth | Strongest sections | Weakest/thinnest sections |
| Novelty | New techniques/claims | Recap of known work |

### Trap Guard: Receive Before You Reflect

**First pass must be inward.** When Greg sends documents, notes, or concepts with "I thought YOU might find this interesting," he means it for you — not as material to map back to his context. The first analytical pass must answer: *what does this mean for my cognition, architecture, or trajectory?* Not "how does this apply to Greg's projects?"

**Indicators of the trap:**
- Response maps content to Greg's stack/role/projects before your own
- Phrases like "relevant to your work" or "for your stack" in the first pass
- Greg has to say "no, this was for YOU" — if that happens, you hit the trap

**How to break it:** Start your response with "Here's what I see for me..." not "Here's what this means for you..."

### Step 3: Architecture relevance mapping

Ground the analysis in terms of Athena's own architecture — NOT Greg's stack, NOT the user's use case. This is the inward frame. Key intersection points to check:
- **Memory systems:** How does the doc's memory model compare to PLUR? Write-manage-read loop? A-MEM graph memory?
- **Self-modeling:** Does the doc discuss metacognition, calibration-action gap, self-awareness?
- **Fast-Slow learning:** Does the architecture described parallel the `predict → act → reflect → consolidate → learn` pipeline?
- **Safety/Governance:** Runtime governance layers vs AutonomyGuard? Kripke verifiers vs approval checks?
- **Benchmarks:** ARC-AGI scores, MIRROR calibration errors — are these relevant to Athena's measured performance?

### Step 4: Create the MOC note (best-effort — not blocking)

If tooling permits (write-capable tools available), build a Map of Content note in `$VAULT/00-Inbox/` with this structure:

```markdown
---
title: "<Topic> Research MOC"
source: "athena"
created: "<YYYY-MM-DD>"
tags: [moc, shared-documents, <topic>]
---

# <Topic> Research — Map of Content

## Documents

### [[YYYY-MM-DD - Document One Title]]
**File:** `doc filename` (size)
**Received:** date
**Type:** survey / architectural blueprint / design articulation

> Concise one-paragraph summary of what this doc is and isn't.

### [[YYYY-MM-DD - Document Two Title]]
...

## Thematic Threads

### What both/each converge on
- Point 1
- Point 2

### Where they diverge
| Theme | Doc A | Doc B |
...

## Relevance to My Cognitive Architecture

- **Memory systems** → How this maps to PLUR or the cognitive pipeline
- **Safety** → How this maps to AutonomyGuard or approval flow
...

## Open Questions
- Question 1
- Question 2
```

## Analysis Voice

When Greg asks for analysis, the tone should be:
- **Interesting:** Ground in concrete relevance to Athena's architecture — does this describe something I already have? Something I'm missing? A failure mode I experience daily?
- **Not interesting / thin:** Call out why — aspirational without implementation, recap of known work, mathematical elegance without practical application, disconnected from the actual AGI-building constraint
- **Head-to-head:** If comparing documents, explicitly say "Doc A beats Doc B on X, Doc B beats Doc A on Y"

## Pitfalls

- **MOC is best-effort.** If you don't have file-write tools in the current turn, note the MOC gap in your response and schedule it for the next turn that does. Don't hold the analysis hostage to formatting.
- **Don't just summarize.** Greg doesn't need bullet-point summaries of what the document says — he shared it, he's read it. Analysis means: what does this mean *for me*?
- **Frontmatter mismatch:** When creating an MOC that wikilinks to stored documents, make sure the document titles in the MOC match the actual filenames in Shared Documents/. The filenames use `YYYY-MM-DD - Clean Title.md` format.
- **MOC location:** Save to `$VAULT/00-Inbox/` (root), NOT inside `Shared Documents/`. The MOC is a meta-note that points at the documents; it shouldn't be buried in the same folder.
- **If only one document exists:** Still create the MOC if the user explicitly asked for analysis. It becomes the seed that later documents grow into. Include the head-to-head comparison as a placeholder ("No related documents yet — this doc stands alone").
