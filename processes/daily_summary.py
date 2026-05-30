"""
Daily Summary Process — deterministic workflow for Athena's daily autonomous actions summary.

Replaces the prompt-defined cron job with explicit Python steps:

  1. Gather facts (daily_summary_facts.py)
  2. Generate summary (LLM with ground-truth facts)
  3. Verify numeric claims (verify_summary_numbers.py)
  4. Remediate if issues found (max 2 retries)
  5. Return clean output or with verified issues noted

Each step is logged, timed, and recorded for audit. The process CANNOT
skip steps — every function call is explicit.
"""

from __future__ import annotations

import datetime
import json
import logging
import subprocess
import sys
from pathlib import Path
from typing import Any, Callable, Dict, Optional

from processes.registry import Process, ProcessContext, ProcessResult, process_registry

logger = logging.getLogger(__name__)

# Default paths — resolve at call time so tests can monkeypatch
HERMES_HOME = Path.home() / "cognitive-agent" / "hermes"


def _resolve_script(name: str) -> str:
    """Resolve a script name under HERMES_HOME/scripts/."""
    candidate = Path(name)
    if candidate.is_absolute():
        return str(candidate)
    return str(HERMES_HOME / "scripts" / candidate)


def _run_script(script_path: str, stdin_text: Optional[str] = None) -> tuple[bool, str]:
    """Run a script and capture stdout. Returns (success, output)."""
    path = Path(script_path)
    if not path.exists():
        return False, f"Script not found: {script_path}"
    try:
        proc = subprocess.run(
            [sys.executable, str(path)],
            input=stdin_text or "",
            capture_output=True,
            text=True,
            timeout=60,
        )
        if proc.returncode != 0:
            return False, proc.stderr.strip() or f"exit code {proc.returncode}"
        return True, proc.stdout.strip()
    except subprocess.TimeoutExpired:
        return False, "timed out (60s)"
    except Exception as e:
        return False, str(e)


class DailySummaryProcess(Process):
    """Deterministic daily summary generation with verification gates.

    The process:
      1. Gathers ground-truth facts from system DBs/logs
      2. Generates an analytical summary via LLM
      3. Verifies numeric claims against the facts
      4. If issues found, remediates (max 2 retries)
      5. Returns clean output or output with warning footer
    """

    name = "daily_summary"
    version = "1.1.0"
    description = (
        "Generate Athena's daily autonomous actions summary with "
        "explicit fact-gathering → generation → verification → remediation steps."
    )

    def __init__(self):
        self._generate_fn: Optional[Callable] = None

    def set_generate_fn(self, fn: Callable[[str], str]) -> None:
        """Inject a generation callable.

        When running from the cron scheduler, this wraps the AIAgent
        call so the process can generate without importing run_agent.
        """
        self._generate_fn = fn

    def run(self, inputs: dict, ctx: ProcessContext) -> ProcessResult:
        prompt = inputs.get("prompt", "")
        facts_script = inputs.get("facts_script", "daily_summary_facts.py")
        verify_script = inputs.get("verify_script", "verify_summary_numbers.py")
        max_retries = int(inputs.get("max_verify_retries", 2))

        # Step 1: Gather ground-truth facts
        ctx.log("Step 1: Gathering facts...")
        t0 = ctx.elapsed()
        facts_ok, facts_output = _run_script(_resolve_script(facts_script))
        facts_ms = int((ctx.elapsed() - t0) * 1000)

        if not facts_ok:
            ctx.record_step("gather_facts", "gather", "failed", facts_ms,
                            summary=f"facts script failed", output=facts_output)
            return ProcessResult(
                status="failed",
                output="",
                error=f"Facts gathering failed: {facts_output}",
            )

        ctx.record_step("gather_facts", "gather", "ok", facts_ms,
                        summary=f"Facts gathered: {len(facts_output)} chars")

        # Step 2: Generate summary
        if not prompt:
            ctx.record_step("generate_summary", "generate", "skipped", 0,
                            summary="No prompt provided")
            return ProcessResult(
                status="failed", output="",
                error="No prompt provided to daily_summary process",
            )

        # Build the full prompt with facts prepended
        full_prompt = (
            f"## Script Output\n\n{facts_output}\n\n---\n\n{prompt}"
        )

        ctx.log("Step 2: Generating summary...")
        t0 = ctx.elapsed()

        if self._generate_fn:
            # Cron mode: use injected callable (wraps AIAgent)
            try:
                final_response = self._generate_fn(full_prompt)
            except Exception as e:
                ctx.record_step("generate_summary", "generate", "failed",
                                int((ctx.elapsed() - t0) * 1000),
                                summary="Generation raised exception",
                                output=str(e))
                return ProcessResult(
                    status="failed", output="",
                    error=f"Generation failed: {e}",
                )
        else:
            # Standalone mode: run the prompt through the agent via a subprocess
            ok, final_response = _run_hermes_agent(full_prompt)
            if not ok:
                ctx.record_step("generate_summary", "generate", "failed",
                                int((ctx.elapsed() - t0) * 1000),
                                summary="Agent subprocess failed",
                                output=final_response)
                return ProcessResult(
                    status="failed", output="",
                    error=f"Agent subprocess failed: {final_response}",
                )

        gen_ms = int((ctx.elapsed() - t0) * 1000)
        ctx.record_step("generate_summary", "generate", "ok", gen_ms,
                        summary=f"Generated {len(final_response)} chars")

        # Step 3: Verify claims (with remediation loop)
        if not verify_script:
            ctx.log("No verify_script configured — skipping verification")
            ctx.record_step("verify_claims", "verify", "skipped", 0)
            return ProcessResult(status="ok", output=final_response)

        for attempt in range(1 + max_retries):
            ctx.log(f"Step 3: Verifying claims (attempt {attempt + 1}/{max_retries + 1})...")
            t0 = ctx.elapsed()
            v_ok, v_out = _run_script(_resolve_script(verify_script),
                                       stdin_text=final_response)
            v_ms = int((ctx.elapsed() - t0) * 1000)

            if v_ok and not v_out.strip():
                # Passed — clean
                ctx.record_step("verify_claims", "verify", "passed", v_ms,
                                summary="All claims verified")
                return ProcessResult(status="ok", output=final_response)

            if attempt < max_retries:
                ctx.record_step(
                    f"verify_claims_{attempt}", "verify", "failed", v_ms,
                    summary=f"Issues found, remediating (attempt {attempt + 1})",
                    output=v_out,
                )
                ctx.log(f"Remediation needed — issues found on attempt {attempt + 1}")

                # Step 3b: Remediate
                remediation_prompt = (
                    "The post-generation verifier found discrepancies in the "
                    "output below. Correct ALL of the following issues, then "
                    "re-generate the full deliverable with the fixes applied.\n\n"
                    "---\n"
                    f"## Verifier output\n{v_out}\n\n"
                    "---\n"
                    f"## Original prompt\n{prompt}\n\n"
                    "---\n"
                    f"## Faulty output to fix\n{final_response}"
                )

                t1 = ctx.elapsed()
                if self._generate_fn:
                    try:
                        remediation_result = self._generate_fn(remediation_prompt)
                        if remediation_result:
                            final_response = remediation_result
                    except Exception as e:
                        ctx.log(f"Remediation raised: {e}")
                else:
                    ok, rem_out = _run_hermes_agent(remediation_prompt)
                    if ok and rem_out:
                        final_response = rem_out

                remediate_ms = int((ctx.elapsed() - t1) * 1000)
                ctx.record_step("remediate", "remediate", "ok", remediate_ms,
                                summary=f"Remediated ({len(final_response)} chars)")
            else:
                # All retries exhausted — append warning footer
                ctx.record_step(
                    "verify_claims_final", "verify", "failed", v_ms,
                    summary=f"All {max_retries + 1} attempts exhausted, appending warning",
                    output=v_out,
                )
                final_response = f"{final_response}\n\n{v_out}"
                return ProcessResult(
                    status="with_issues",
                    output=final_response,
                    error=(
                        f"Verification found issues that persisted after "
                        f"{max_retries + 1} attempts"
                    ),
                )

        return ProcessResult(status="ok", output=final_response)


def _run_hermes_agent(prompt: str) -> tuple[bool, str]:
    """Run Hermes agent with a prompt via subprocess (standalone mode)."""
    try:
        proc = subprocess.run(
            ["hermes", "chat", "-q", prompt],
            capture_output=True,
            text=True,
            timeout=300,
        )
        if proc.returncode != 0:
            return False, proc.stderr.strip() or f"exit code {proc.returncode}"
        return True, proc.stdout.strip()
    except subprocess.TimeoutExpired:
        return False, "Hermes agent timed out (300s)"
    except FileNotFoundError:
        return False, "hermes command not found in PATH"
    except Exception as e:
        return False, str(e)


# Register the process
process_registry.register(DailySummaryProcess)
