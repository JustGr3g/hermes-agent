---
name: store-shared-documents
description: Automatically convert and store shared documents (PDFs, DOCX, images, etc.) into the Obsidian vault as markdown, preserving originals alongside.
---

# Store Shared Documents

## Trigger

When the user shares a document file (PDF, DOCX, PPTX, XLSX, image, audio, EPUB, CSV, HTML, text, etc.) on any platform. This runs **fully automated** — no approval needed unless the file is unusually large (>20MB) or contains sensitive content the user might not want vaulted.

## Pipeline

For every document the user sends:

1. **Download the file** to a temp location (usually already done by the platform handler)
2. **Run the conversion script:**
   ```
   python ~/cognitive-agent/hermes/scripts/store_shared_doc.py <filepath> --source <platform>
   ```
3. **Confirm to the user** what was saved and where

### Follow-up: analysis + MOC

For research documents (papers, roadmaps, architectural blueprints), follow up with the `research-document-analysis` skill:
- Read the converted markdown in the vault
- Compare against related inbox documents
- Map relevance to Athena's cognitive architecture
- Create a MOC note for cross-linking

The user may explicitly request analysis ("review this document", "tell me what's interesting"). If they do, follow the analysis workflow. Even if they don't, consider: is this document about a topic where other docs already live in the inbox? If so, offer to create a MOC.

## Destination

```
$VAULT/00-Inbox/Shared Documents/YYYY-MM-DD - Original Name/
├── YYYY-MM-DD - Original Name.md    (markdown conversion + frontmatter)
└── Original Name.pdf                (original preserved as-is)
```

## Frontmatter

Every markdown note gets:
```yaml
---
title: "Original Name"
source: "telegram"  # or web, email, etc.
received: "2026-05-27"
converted: "2026-05-27"
original_format: "pdf"  # ext of source file
tags: [shared-documents, inbox]
---
```

## Script

The script lives at `~/cognitive-agent/hermes/scripts/store_shared_doc.py`. It:
- Takes a filepath and optional `--source` flag (default: telegram)
- Auto-extracts a clean title from the document's first `# Heading` (or strips cache-hash prefixes like `doc_bc8f814adb6d_`)
- Creates the dated folder under `00-Inbox/Shared Documents/`
- Copies the original alongside (renamed to clean title + original extension)
- Converts to markdown via markitdown with `[all]` extras
- Writes the combined frontmatter + content .md file
- Prints the markdown path to stdout for programmatic chaining

## Pitfalls

- **Telegram cache-hash filenames:** Telegram saves files with names like `doc_bc8f814adb6d_From_AI_Agents....pdf`. The script auto-strips the hash prefix and extracts the real title from the document's first heading. After storing, verify the folder/files have clean names — if the first heading is missing or the PDF is scanned, the cleaned filename may still look ugly. In that case, rename the folder and files manually.
- **Duplicate dedup:** If the user shares the same file twice (e.g. yesterday + today), MD5 will match. The script has no dedup logic yet — it'll create a second dated folder. You can catch this at the pipeline level (check if same MD5 file already exists in inbox) or let the user triage.
- **Post-hoc rename:** If you stored a file and the folder name came out wrong (hash prefix), rename the folder and update the frontmatter title. Don't re-run — you'll create a second entry.

## Edge Cases

- **Empty conversion:** If markitdown returns empty text, the note still gets created with frontmatter and a note that extraction failed — the original is always preserved for manual review.
- **Missing deps:** markitdown[all] is installed at `~/cognitive-agent/hermes/venv/`. The script's shebang (`#!/usr/bin/env python3`) uses system python, NOT the venv — so `import markitdown` will fail if invoked directly. Always invoke via explicit venv python: `/Users/gregdreyfus/cognitive-agent/hermes/venv/bin/python3 store_shared_doc.py ...`. If a converter fails due to missing dependency, install with `pip install 'markitdown[all]'` into the hermes venv.
- **Unsupported format:** The script logs the error but still copies the original file to the vault. Markdown note contains frontmatter + failure notice.
- **Large files:** Files >20MB should be flagged to the user before proceeding, as markitdown may be slow or memory-intensive.
- **OBSIDIAN_VAULT_PATH unset:** Script probes `~/Documents/` for `.obsidian` directories as fallback.
