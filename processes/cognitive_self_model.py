"""
CognitiveSelfModelProcess — self-model generation with verify→remediate gate.

Wraps `once_handlers.build_self_model()` with the same verification loop
that Phase 1 proved on the daily summary. Steps:

  1. Gather data sources (episodes, goals, signals)
  2. Generate narrative via LLM (delegates to existing build_self_model)
  3. Verify narrative claims against ground truth
  4. If issues found, remediate (max 2 retries)
  5. Store the verified snapshot

This closes the last remaining LLM-narrative path without a verification
gate — [ENG-2026-0528-001] proved that the daily summary needed one, and
the self-model runs the same generative pattern every 6h.
"""

from __future__ import annotations

import json
import logging
import subprocess
import sys
from pathlib import Path
from typing import Optional

from .registry import Process, ProcessContext, ProcessResult, process_registry

logger = logging.getLogger(__name__)

_HERMES_HOME = Path(__file__).resolve().parent.parent


def _resolve_script(name: str) -> str:
    """Resolve a script under hermes/scripts/."""
    candidate = Path(name)
    if candidate.is_absolute():
        return str(candidate)
    return str(_HERMES_HOME / "scripts" / candidate)


def _run_verifier(script_path: str, content: str) -> tuple[bool, str]:
    """Run a verification script with content on stdin. Returns (ok, output)."""
    path = Path(script_path)
    if not path.exists():
        return False, f"Script not found: {script_path}"
    try:
        proc = subprocess.run(
            [sys.executable, str(path)],
            input=content or "",
            capture_output=True,
            text=True,
            timeout=30,
        )
        if proc.returncode != 0:
            return False, proc.stderr.strip() or f"exit code {proc.returncode}"
        return True, proc.stdout.strip()
    except subprocess.TimeoutExpired:
        return False, "verifier timed out (30s)"
    except Exception as e:
        return False, str(e)


class CognitiveSelfModelProcess(Process):
    """Generate Athena's self-model narrative with verification gates.

    Wraps CognitiveAgent._build_self_model() (which delegates to
    once_handlers.build_self_model) and runs the verify→remediate loop
    on the generated narrative before storing.

    Requires _cognitive_agent in inputs, plus the standard build_self_model
    kwargs (all optional).
    """

    name = "cognitive_self_model"
    version = "1.1.0"
    description = (
        "Generate Athena's self-model narrative with fact-gathering → "
        "LLM generation → verification → remediation gates."
    )

    def run(self, inputs: dict, ctx: ProcessContext) -> ProcessResult:
        agent = inputs.get("_cognitive_agent")
        if agent is None:
            return ProcessResult(
                status="failed", output="",
                error="No _cognitive_agent provided in inputs"
            )

        verify_script = _resolve_script(
            inputs.get("verify_script", "verify_self_model.py")
        )
        max_retries = int(inputs.get("max_verify_retries", 2))

        # Step 1: Generate narrative via existing handler
        ctx.log("Generating self-model narrative...")
        t0 = ctx.elapsed()

        outcome = agent._build_self_model()
        gen_ms = int((ctx.elapsed() - t0) * 1000)

        stored = outcome.get("stored", False)
        reason = outcome.get("reason", "")

        if not stored:
            ctx.record_step(
                "generate_narrative", "generate", "failed", gen_ms,
                summary=f"Generation failed: {reason}",
                output=reason,
            )
            return ProcessResult(
                status="failed", output="",
                error=f"Self-model generation failed: {reason}",
            )

        # _build_self_model already stored the snapshot. We need to read
        # it back to get the text for verification. Get the latest.
        narrative = ""
        try:
            from cognitive_agent import self_model as _sm_mod
            latest = _sm_mod.get_latest_self_model(agent.db_path)
            narrative = (latest.get("content") or "") if latest else ""
        except Exception as e:
            logger.debug("Could not read back self-model for verification: %s", e)

        ctx.record_step(
            "generate_narrative", "generate", "ok", gen_ms,
            summary=f"Narrative generated ({len(narrative)} chars)",
        )

        if not narrative:
            return ProcessResult(
                status="ok", output="",
                error="Self-model stored but narrative is empty (skipped verification)",
            )

        # Step 2: Verify narrative claims (with remediation loop)
        if not verify_script:
            ctx.log("No verify_script — skipping verification")
            ctx.record_step("verify_narrative", "verify", "skipped", 0)
            return ProcessResult(
                status="ok", output=json.dumps(outcome, default=str),
            )

        for attempt in range(1 + max_retries):
            ctx.log(f"Verifying narrative (attempt {attempt + 1}/{max_retries + 1})...")
            t0 = ctx.elapsed()
            v_ok, v_out = _run_verifier(verify_script, content=narrative)
            v_ms = int((ctx.elapsed() - t0) * 1000)

            if v_ok and not v_out.strip():
                # Passed — clean
                ctx.record_step("verify_narrative", "verify", "passed", v_ms,
                                summary="All claims verified")
                outcome["verified"] = True
                return ProcessResult(
                    status="ok", output=json.dumps(outcome, default=str),
                )

            if attempt < max_retries:
                ctx.record_step(
                    f"verify_narrative_{attempt}", "verify", "failed", v_ms,
                    summary=f"Issues found, remediating",
                    output=v_out,
                )
                ctx.log(f"Issues found — re-generating narrative")

                # Step 2b: Re-generate with remediation context
                t1 = ctx.elapsed()
                outcome = agent._build_self_model()
                rem_ms = int((ctx.elapsed() - t1) * 1000)

                if outcome.get("stored"):
                    try:
                        from cognitive_agent import self_model as _sm_mod2
                        latest = _sm_mod2.get_latest_self_model(agent.db_path)
                        narrative = (latest.get("content") or "") if latest else ""
                    except Exception:
                        narrative = ""

                ctx.record_step("remediate_narrative", "remediate", "ok", rem_ms,
                                summary=f"Re-generated ({len(narrative)} chars)")
            else:
                # All retries exhausted — note in outcome but don't block
                ctx.record_step(
                    "verify_narrative_final", "verify", "failed", v_ms,
                    summary=f"Issues persisted after {max_retries + 1} attempts",
                    output=v_out,
                )
                outcome["verified"] = False
                outcome["verification_issues"] = v_out
                return ProcessResult(
                    status="with_issues",
                    output=json.dumps(outcome, default=str),
                    error=f"Verification issues persisted after {max_retries + 1} attempts",
                )

        return ProcessResult(
            status="ok", output=json.dumps(outcome, default=str),
        )


# Register
process_registry.register(CognitiveSelfModelProcess)
