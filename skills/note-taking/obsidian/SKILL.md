---
name: obsidian
description: Read, search, and create notes in the Obsidian vault.
---

# Obsidian Vault

**Location:** `OBSIDIAN_VAULT_PATH` is set in Athena's environment via both
LaunchAgent plists (`ai.athena.server.plist`, `ai.athena.gateway.plist`).
Always reference it as `$VAULT="$OBSIDIAN_VAULT_PATH"` in commands. Paths
may contain spaces — always quote them.

If `OBSIDIAN_VAULT_PATH` is unexpectedly empty, discover the vault with a
**tightly scoped** probe before falling back. Do NOT use `find ~/` —
walking the entire home dir times out (3+ minutes observed):

```bash
# Vault roots are the parent dir of any `.obsidian` folder.
find ~/Documents -maxdepth 3 -name ".obsidian" -type d 2>/dev/null
```

## Related Skills

- **`store-shared-documents`** — Automatically converts docs (PDFs, etc.) shared via Telegram into markdown + original, stored under `00-Inbox/Shared Documents/YYYY-MM-DD - Title/`. That folder is a good starting point for vault-wide searches — it's where inbound document content lands.

## Search rules (avoid the slow paths)

1. **Always anchor at `$VAULT`** — never `find ~/`, never `find /`.
2. **For filename keyword search**, prefer `find "$VAULT" -iname "*keyword*"` —
   `-iname` is case-insensitive, and bounded scope returns in <1s.
3. **For content search**, use `grep -rli "keyword" "$VAULT" --include="*.md"` —
   `-l` prints filenames only, much smaller output than full-line `-r`.
4. **When unsure of the right keyword**, list the structure first
   (`ls "$VAULT"` or `ls "$VAULT/01-Work"`) before searching. Greg's vault
   has a deliberate folder structure (e.g. `01-Work/Cresta/`) — listing it
   often surfaces the right folder faster than keyword search.
5. **Always set an explicit `timeout`** in the terminal tool when running
   a `find` you're not certain will be tightly bounded. 30s is reasonable
   for vault-scoped queries.

## Read a note

```bash
VAULT="$OBSIDIAN_VAULT_PATH"
cat "$VAULT/Note Name.md"
```

## List notes

```bash
VAULT="$OBSIDIAN_VAULT_PATH"

# In a specific folder (preferred — bounded)
ls "$VAULT/Subfolder/"

# All notes recursively (use only when you actually need every path)
find "$VAULT" -name "*.md" -type f
```

## Search

```bash
VAULT="$OBSIDIAN_VAULT_PATH"

# By filename
find "$VAULT" -name "*.md" -iname "*keyword*"

# By content
grep -rli "keyword" "$VAULT" --include="*.md"
```

## Summarize a folder of notes

When the user asks "summarize all notes about X," locate the folder first,
then read headers in one batch rather than reading each file individually:

```bash
VAULT="$OBSIDIAN_VAULT_PATH"

# Find the folder
find "$VAULT" -type d -iname "*topic*"

# Read first 40 lines of each .md in that folder
for f in "$VAULT/01-Work/Topic/"*.md; do
  echo "=== $(basename "$f") ==="
  head -40 "$f"
  echo
done
```

## Create a note

```bash
VAULT="$OBSIDIAN_VAULT_PATH"
cat > "$VAULT/New Note.md" << 'ENDNOTE'
# Title

Content here.
ENDNOTE
```

## Append to a note

```bash
VAULT="$OBSIDIAN_VAULT_PATH"
echo "
New content here." >> "$VAULT/Existing Note.md"
```

## Wikilinks

Obsidian links notes with `[[Note Name]]` syntax. When creating notes, use
these to link related content.
