# Store Shared Documents — Script Notes

## Script location
`~/cognitive-agent/hermes/scripts/store_shared_doc.py`

## Clean title extraction
The `_clean_title()` function in the script uses this priority:
1. First `# Heading` line in the document (via markitdown)
2. Stripped filename (removes `doc_<hash>_` prefix from Telegram cache paths)
3. Falls back to raw stem

## Dependencies
- `markitdown[all]` — installed in venv at `~/cognitive-agent/hermes/venv/`
- Extras include: PDF (pdfminer.six, pdfplumber, pypdfium2), DOCX (mammoth), PPTX (python-pptx), XLSX (openpyxl, xlrd), images (OCR via pytesseract), audio (speechrecognition, pydub), EPUB, CSV, HTML

## Real-world quirks (found 2026-05-27)
- **Markitdown PDF warnings:** "Could not get FontBBox from font descriptor because None cannot be parsed as 4 floats" — benign warnings from pdfminer, doesn't affect output
- **Telegram cache filename format:** `doc_bc8f814adb6d_From_AI_Agents_to_...pdf` — script strips `doc_[a-f0-9]{10,}_` prefix
- **Duplicate detection not implemented:** If same file shared twice (matching MD5), creates second dated folder. Manual dedup needed.

## Testing
```bash
# Quick test with a PDF
python scripts/store_shared_doc.py ~/Downloads/test.pdf --source telegram

# Verify output
ls "$OBSIDIAN_VAULT_PATH/00-Inbox/Shared Documents/"*/ 
head -10 "$OBSIDIAN_VAULT_PATH/00-Inbox/Shared Documents/"*/*.md
```
