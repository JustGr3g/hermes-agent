"""The Forum plugin — backend API routes.

Mounted at /api/plugins/forum/ by the Hermes dashboard plugin system.

Phase 1 (foundation): single /state endpoint that proxies Athena's
/health/detailed and returns the raw response. Phase 3 introduces a
proper transform from Athena state → Forum-shape JSON. Phase 7 adds
?ts= historical reconstruction backed by a forum_snapshots table.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter()


ATHENA_BASE_URL = "http://localhost:8765"
ATHENA_TIMEOUT_SEC = 5.0


@router.get("/state")
async def state(ts: Optional[float] = None) -> dict[str, Any]:
    """Return the current Forum-shape derived state.

    Phase 1: passes through Athena's /health/detailed verbatim. Phase 3
    will transform this into the Forum-specific shape (stage, pantheon,
    substrate, atmosphere, audience). Phase 7 will honor `ts=` for
    timeline scrubbing by querying the forum_snapshots table.
    """
    if ts is not None:
        # Stubbed for Phase 7. For now, always return live state.
        logger.info("forum/state: ts=%s requested but historical reconstruction is not yet implemented", ts)

    try:
        async with httpx.AsyncClient(timeout=ATHENA_TIMEOUT_SEC) as client:
            r = await client.get(f"{ATHENA_BASE_URL}/health/detailed")
            r.raise_for_status()
            return r.json()
    except httpx.HTTPError as e:
        logger.exception("forum/state: failed to reach Athena")
        raise HTTPException(
            status_code=503,
            detail=f"Athena unreachable at {ATHENA_BASE_URL}: {e}",
        )


@router.get("/health")
async def health() -> dict[str, Any]:
    """Liveness check for the Forum plugin backend itself."""
    return {"status": "ok", "plugin": "forum", "version": "0.1.0"}
