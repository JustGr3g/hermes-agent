---
name: removed-heartbeat-handler
description: Documents the surface_github_drafts handler that was removed from heartbeat_handlers.py in commit b54cb6f (May 29, 2026), including its connection to the no_tool_resolution pattern.
---

# Removed Heartbeat Handler: `surface_github_drafts`

## What Was Removed

The `surface_github_drafts` heartbeat handler (registered as `"surface_github_drafts"`) was removed in commit `b54cb6f` (May 29, 2026) as part of the GitHub tool family removal.

## What It Did

Polled the `github_pending_writes` table every 60 seconds for unsent draft previews (issues/PRs Athena had drafted via `github_propose_*` tools). When found, it fired a Telegram preview of each draft so Greg could `/gh-approve <slug>` to post them, or ignore them to let them rot.

## Why It Was Removed

The entire `github_*` tool family had **zero lifetime fires in 30+ days**. Greg doesn't triage GitHub issues through Telegram, so drafts queued by these tools would rot unread. The removal included 7 tools, the pending-writes table, the heartbeat handler, tests, and allowlist entries.

Zero usage → zero value → cleanup.

## Connection to the `no_tool_resolution` / Completion-Detection Gap

Not directly causal, but the removal tightened the heartbeat to **34 live handlers** (down from 35), reducing the per-tick overhead. The completion-detection gap (ENG-2026-0528-002) was a separate cognitive_cycle.py issue — goals looping on research tools without recognizing completion — which was addressed in cognitive_cycle.py patches (ENG-2026-0601-001/002/003) and committed at `cdee83a`.

## Architectural Lesson

Tool families that depend on a secondary review workflow (write-with-approval via `/gh-approve`) need evidence that the user actually engages that workflow before the tools earn their keep. The heartbeat handler was pure overhead for zero deliveries.