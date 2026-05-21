# This directory IS Athena's install root (HERMES_HOME)

You are inside Athena.

## Athena's layout

`HERMES_HOME` = `/Users/gregdreyfus/cognitive-agent/hermes` (this dir).

- **Canonical `.env`:** `~/cognitive-agent/hermes/.env` (here). Holds `TELEGRAM_BOT_TOKEN`, `ATHENA_OLLAMA_API_KEY`, `TELEGRAM_ALLOWED_USERS`.
- **`~/cognitive-agent/.env`** is a symlink → `hermes/.env`. It exists because `athena_server.py` chdirs to its own parent (`~/cognitive-agent/`) at startup ([athena_server.py:427-428](../athena_server.py)) and `python-dotenv` loads `.env` from cwd. Single source of truth, two access paths.
- **Athena-specific source:** `~/cognitive-agent/cognitive_agent/` (one level up — extends the framework with 8 cognitive systems).
- **Entry point:** `~/cognitive-agent/athena_server.py` (FastAPI, port 8765).
- **LaunchAgent:** `~/Library/LaunchAgents/ai.athena.server.plist`.
- **Logs:** `~/cognitive-agent/hermes/logs/athena_server.{log,error.log}`.

## Editing rules

- ✅ Edit `.env` here when changing Athena's secrets/config.
- ✅ Edit framework code here only when deliberately changing Athena's framework (rare; this is a vendored fork of `nousresearch/hermes-agent v0.11.0`).
- ❌ Athena's install is sovereign — keep her config here and don't import it from anywhere else.
