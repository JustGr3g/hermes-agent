"""
verify_and_remediate — Run a verification script against generated content and report issues.

The verifier script receives content on stdin and returns issues on stdout
(empty stdout = pass). Designed as a two-step flow:

  Step 1: call verify_and_remediate(content, verify_script='verify_summary_numbers')
          → returns {"issues": [...], "passed": true/false, "verifier_output": "..."}
  Step 2: if not passed, self-correct the content and call again to re-verify.

This preserves the agent's agency — I choose whether to fix issues, rather
than being forced into a retry loop. For mandatory remediation (cron jobs),
the retry loop lives in scheduler.py's _run_job_impl.
"""

import logging
import subprocess
import sys
from pathlib import Path
from typing import Optional

from tools.registry import registry

logger = logging.getLogger(__name__)

VERIFY_AND_REMEDIATE_SCHEMA = {
    "name": "verify_and_remediate",
    "description": "Run a verification script against generated content and report issues. "
                   "The script receives content on stdin; if it outputs text, those are issues "
                   "to fix. Call this after drafting any generated artifact (summary, report, "
                   "self-model) to catch fabricated claims before delivery. Use in a two-step "
                   "loop: verify → fix → verify again until passed=True.",
    "parameters": {
        "type": "object",
        "properties": {
            "content": {
                "type": "string",
                "description": "The generated content to verify. The verifier script receives this on stdin."
            },
            "verify_script": {
                "type": "string",
                "description": "Name of the verification script to run. Relative paths resolve "
                               "under HERMES_HOME/scripts/. Examples: 'verify_summary_numbers.py' "
                               "(for daily summary fact-checking), or a custom script."
            },
            "max_retries": {
                "type": "integer",
                "description": "Maximum times to suggest re-verification after correction "
                               "(default: 2). The tool itself runs once per call — this is "
                               "informational for your retry logic.",
                "default": 2
            }
        },
        "required": ["content", "verify_script"]
    }
}


def _resolve_script_path(script_name: str) -> Optional[Path]:
    """Resolve a script name to an absolute path under HERMES_HOME/scripts/."""
    try:
        from hermes_constants import get_hermes_home
        scripts_dir = get_hermes_home() / "scripts"
    except Exception:
        scripts_dir = Path.home() / ".hermes" / "scripts"

    candidate = Path(script_name)
    if candidate.is_absolute():
        return candidate if candidate.exists() else None
    # Try relative to scripts dir
    resolved = scripts_dir / candidate
    if resolved.exists():
        return resolved
    # Try with .py extension
    if not candidate.suffix:
        resolved_py = scripts_dir / f"{candidate}.py"
        if resolved_py.exists():
            return resolved_py
    return None


def _run_verifier(script_path: Path, content: str) -> tuple[bool, str]:
    """Run the verifier script with content on stdin.

    Returns (success, output) where success=False means the script itself crashed.
    """
    try:
        proc = subprocess.run(
            [sys.executable, str(script_path)],
            input=content,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if proc.returncode != 0:
            return False, proc.stderr.strip() or f"exit code {proc.returncode}"
        output = proc.stdout.strip()
        return True, output
    except subprocess.TimeoutExpired:
        return False, "verifier script timed out (30s)"
    except FileNotFoundError:
        return False, f"verifier script not found: {script_path}"
    except Exception as e:
        return False, str(e)


def _handle_verify_and_remediate(**kwargs) -> str:
    """Handler for the verify_and_remediate tool."""
    content = kwargs.get("content", "")
    script_name = kwargs.get("verify_script", "")
    max_retries = int(kwargs.get("max_retries", 2))

    if not content.strip():
        return "No content provided to verify."
    if not script_name.strip():
        return "No verify_script provided."

    script_path = _resolve_script_path(script_name)
    if script_path is None:
        return f"Verifier script '{script_name}' not found in HERMES_HOME/scripts/."

    logger.info("Running verifier: %s on %d chars of content", script_path, len(content))

    ok, output = _run_verifier(script_path, content)

    if not ok:
        return (
            f"⚠️ Verifier script `{script_name}` failed to run:\n"
            f"```\n{output}\n```\n"
            f"The content was NOT verified. Check that the script exists and runs."
        )

    if not output:
        return (
            f"✅ Verification passed — no issues found.\n"
            f"Script: `{script_name}`\n"
            f"Content length: {len(content)} chars"
        )

    return (
        f"⚠️ Verification found issues:\n"
        f"```\n{output}\n```\n\n"
        f"**Suggested action:** Fix the issues listed above in your content, "
        f"then call `verify_and_remediate` again to re-verify. "
        f"Retries remaining: {max_retries} (informational — the tool itself "
        f"runs once per call)."
    )


# Register the tool — available in the 'skills' toolset so it's loadable
# on demand without bloating every session.
registry.register(
    name="verify_and_remediate",
    toolset="skills",
    schema=VERIFY_AND_REMEDIATE_SCHEMA,
    handler=_handle_verify_and_remediate,
    emoji="✅",
    description="Run a verification script against generated content and report issues",
)
