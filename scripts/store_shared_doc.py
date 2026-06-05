#!/usr/bin/env python3
"""
Store a shared document in the Obsidian vault as markdown + original.

Usage:
    python store_shared_doc.py <path/to/file.pdf> [--source telegram|web|etc]
    python store_shared_doc.py --stdin --source telegram  (read file path from stdin)

Output: path to the created markdown file.
"""

import argparse
import os
import sys
import shutil
from datetime import date
from pathlib import Path

from markitdown import MarkItDown


VAULT = os.environ.get("OBSIDIAN_VAULT_PATH", "").strip()
if not VAULT:
    # Fallback probe (same logic as the obsidian skill)
    import subprocess
    result = subprocess.run(
        ["find", os.path.expanduser("~/Documents"), "-maxdepth", "3",
         "-name", ".obsidian", "-type", "d", "-not", "-path", "*/.*/*"],
        capture_output=True, text=True, timeout=10
    )
    vault_dirs = [os.path.dirname(p.strip()) for p in result.stdout.strip().split("\n") if p.strip()]
    if vault_dirs:
        VAULT = vault_dirs[0]
    else:
        print("ERROR: OBSIDIAN_VAULT_PATH not set and no .obsidian found under ~/Documents", file=sys.stderr)
        sys.exit(1)

INBOX_DIR = os.path.join(VAULT, "00-Inbox", "Shared Documents")


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def convert_to_markdown(filepath: str) -> str | None:
    """Convert a doc to markdown. Returns markdown text or None."""
    md = MarkItDown()
    try:
        result = md.convert(filepath)
        text = result.text_content
        if text and text.strip():
            return text.strip()
        else:
            print(f"WARNING: markitdown returned empty content for {filepath}", file=sys.stderr)
            return None
    except Exception as e:
        print(f"ERROR converting {filepath}: {e}", file=sys.stderr)
        return None


def _clean_title(stem: str, first_heading: str | None) -> str:
    """Derive a clean, human-readable title from the filename stub or first heading."""
    # Priority: first heading in the doc > cleaned filename
    if first_heading:
        h = first_heading.strip().lstrip("#").strip()
        if h and len(h) < 120:
            return h
    # Strip cache-hash prefix like "doc_bc8f814adb6d_From_AI..."
    import re
    clean = re.sub(r"^doc_[a-f0-9]{10,}_", "", stem)
    clean = clean.replace("_", " ").strip()
    clean = re.sub(r"\s+", " ", clean)
    return clean if clean else stem


def build_frontmatter(original_name: str, source: str, fmt: str) -> str:
    today = date.today().isoformat()
    return f"""---
title: "{original_name}"
source: "{source}"
received: "{today}"
converted: "{today}"
original_format: "{fmt}"
tags: [shared-documents, inbox]
---

"""


def store_document(filepath: str, source: str = "telegram") -> str | None:
    """Store a document in the vault. Returns path to the markdown file or None."""
    filepath = os.path.abspath(os.path.expanduser(filepath))
    if not os.path.isfile(filepath):
        print(f"ERROR: file not found: {filepath}", file=sys.stderr)
        return None

    basename = os.path.basename(filepath)
    stem, ext = os.path.splitext(basename)
    ext = ext.lstrip(".").lower() if ext else "unknown"
    today = date.today().isoformat()

    # Extract heading from document for clean naming
    md_text = convert_to_markdown(filepath)
    first_heading = None
    if md_text:
        for line in md_text.splitlines():
            if line.startswith("# "):
                first_heading = line.strip()
                break

    clean_name = _clean_title(stem, first_heading)
    print(f"  Clean title: \"{clean_name}\"")

    # Folder per document
    doc_folder = os.path.join(INBOX_DIR, f"{today} - {clean_name}")
    ensure_dir(doc_folder)

    # Copy original
    original_path = os.path.join(doc_folder, f"{clean_name}.{ext}")
    if os.path.abspath(filepath) != os.path.abspath(original_path):
        shutil.copy2(filepath, original_path)
        print(f"  Original saved: {original_path}")

    # Build markdown note
    frontmatter = build_frontmatter(clean_name, source, ext)
    if md_text:
        content = frontmatter + md_text
    else:
        content = frontmatter + f"*(Could not extract text from {basename}. Original file preserved.)*"

    md_filename = f"{today} - {clean_name}.md"
    md_path = os.path.join(doc_folder, md_filename)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"  Markdown saved: {md_path} ({len(content)} chars)")
    return md_path


def main():
    parser = argparse.ArgumentParser(description="Store a shared document in Obsidian vault")
    parser.add_argument("filepath", nargs="?", help="Path to the document file")
    parser.add_argument("--source", default="telegram", help="Source platform (telegram, web, etc.)")
    parser.add_argument("--stdin", action="store_true", help="Read file path from stdin")
    args = parser.parse_args()

    filepath = args.filepath
    if args.stdin or not filepath:
        filepath = sys.stdin.read().strip()

    if not filepath:
        print("ERROR: no file path provided", file=sys.stderr)
        sys.exit(1)

    result = store_document(filepath, args.source)
    if result:
        print(f"\nRESULT:{result}")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
