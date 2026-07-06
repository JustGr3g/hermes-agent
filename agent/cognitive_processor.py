"""ATHENA CognitiveProcessor — wraps LLM calls with 8 cognitive systems.

Injects into hermes-agent's run_agent.py run_conversation() loop.

Phase 1: thin shell pass-through (no-op).
Phase 3: all 8 systems fully wired — perception, episodic/associative memory,
         working memory, motivation, metacognition, predictive, executive,
         and inner speech.
"""

from __future__ import annotations

import json
import logging
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ── Look / glance: let her conversation use her camera as a sense ─────────────
# When Greg asks something visual with no photo attached, glance through her body's
# camera so she answers from what she actually sees — not "I can't see images".
import re as _re
import urllib.request as _urlreq

_BODY_FRAME_URL = "http://192.168.1.238:8800/frame"
_VISUAL_RE = _re.compile(
    r"\b(what (do|can) you see|what am i (holding|showing|wearing|doing)|"
    r"look at (this|me|that)|can you see|see me|see this|in front of you|"
    r"what'?s (this|that)|hold(ing)? (this|it|up)|show(ing)? you|react to this|"
    r"your (camera|eyes)|through your (camera|eyes))\b", _re.IGNORECASE)


def _looks_visual(text: str) -> bool:
    # Camera glance DISABLED 2026-06-25 — ArmPi temporarily decommissioned (Pi repurposed;
    # upgraded multi-sensor robot in progress). Re-enable (return the regex match) when the
    # new body's camera is online. Returning False stops any attempt to reach the body /frame.
    return False


def _glance_camera() -> Optional[str]:
    """Fetch the body's current camera frame (base64 JPEG) so her conversation can
    actually look through her eyes. Returns None if the body is unreachable."""
    try:
        with _urlreq.urlopen(_BODY_FRAME_URL, timeout=4) as r:
            return json.loads(r.read().decode()).get("image_b64")
    except Exception:
        return None


# 2026-05-04 (item C): trivial-input short-circuit.
# Historical analysis of 716 substantive turns showed 23% of user messages
# are ≤5-word acknowledgments. These don't need the full cognitive cycle —
# the framework's plain response is appropriate (and ~100s faster).
_TRIVIAL_ACKS = frozenset({
    "yes",
    "yep",
    "yeah",
    "yup",
    "y",
    "no",
    "nope",
    "nah",
    "ok",
    "okay",
    "k",
    "kk",
    "thanks",
    "thank you",
    "thx",
    "ty",
    "thank",
    "great",
    "perfect",
    "awesome",
    "nice",
    "cool",
    "amazing",
    "excellent",
    "agreed",
    "approved",
    "approve",
    "got it",
    "gotcha",
    "sounds good",
    "looks good",
    "sure",
    "fine",
    "good",
    "proceed",
    "go ahead",
    "do it",
    "go for it",
    "right",
    "correct",
    "exactly",
    "yep agreed",
    "yes agreed",
    "👍",
    "👌",
    "✅",
    "🙏",
})

# Tokens that, individually, are part of trivial acknowledgments. Used to
# accept short combinations like "ok thanks" / "yes great" / "thanks great".
_TRIVIAL_TOKENS = frozenset({w for phrase in _TRIVIAL_ACKS for w in phrase.split()})


def _is_trivial_acknowledgment(text: str) -> bool:
    """Return True iff the user message is an unambiguous acknowledgment that
    doesn't warrant the full 8-system cognitive cycle.
    """
    if not text:
        return False
    t = text.strip().lower()
    # Strip trailing punctuation
    t = t.rstrip(".!?,")
    if not t:
        return False
    # Exact phrase match
    if t in _TRIVIAL_ACKS:
        return True
    # Short token-by-token match (≤4 words, all are trivial-acknowledgment tokens)
    words = t.split()
    if 1 <= len(words) <= 4 and all(w in _TRIVIAL_TOKENS for w in words):
        return True
    return False


# ── Cognitive-subsystem renderer (Phase 14) ───────────────────────────────
# Hard caps — tune these constants to control per-turn token cost.
_COG_PATTERN_MAX = 5                 # max patterns shown per turn
_COG_PATTERN_REC_LEN = 100          # chars: pattern recommendation
_COG_IMPROVEMENT_PLAN_LEN = 120     # chars: self-improvement plan
_COG_DECOMP_SUBTASK_LEN = 120       # chars: next subtask content
_COG_DECOMP_GOAL_LEN = 80           # chars: goal description
_COG_DECOMP_MAX_PLANS = 3           # max active plans shown


def _render_cognitive_subsystems(
    *,
    patterns: list,
    aesthetic: dict,
    self_improvement: dict,
    decomposition: list,
) -> list[str]:
    """Render PatternLearner / AestheticEvaluator / SelfImprovementLoop /
    GoalDecomposer signals as a list of prompt lines.

    Used by augment_message (per-turn) and get_system_prompt_block
    (test / on-demand). Always emits a section when the subsystem has data;
    skips silently when empty. Hard-capped on counts and field lengths —
    worst-case ≈ 250–400 tokens per turn.

    Never raises — subsystem read failures produce an empty return list.
    """
    lines: list[str] = []
    try:
        # ── Learned behavioral patterns ────────────────────────────────
        active = [p for p in (patterns or []) if isinstance(p, dict)]
        active = active[:_COG_PATTERN_MAX]
        if active:
            lines.append("")
            lines.append("Learned behavioral patterns (act on these):")
            for p in active:
                rec = str(
                    p.get("recommendation") or p.get("title") or ""
                )[:_COG_PATTERN_REC_LEN]
                conf = p.get("confidence", 0.0)
                n = p.get("sample_count", 0)
                if rec:
                    lines.append(
                        f"  • {rec} (confidence {conf:.0%}, seen {n}×)"
                    )

        # ── Aesthetic / editorial evaluation ──────────────────────────
        if isinstance(aesthetic, dict) and aesthetic:
            scores = aesthetic.get("aesthetic_scores") or {}
            trend = aesthetic.get("trend", "")
            overall = aesthetic.get("latest_overall")
            if scores or overall is not None:
                lines.append("")
                lines.append("[ATHENA AESTHETIC STATE]")
                dim_parts = []
                for dim in (
                    "concision", "effectiveness", "coherence",
                    "naturalness", "consistency",
                ):
                    val = scores.get(dim)
                    if val is not None:
                        dim_parts.append(f"{dim[:4]}={val:.0%}")
                overall_str = f"{overall:.0%}" if overall is not None else "n/a"
                lines.append(
                    f"  Overall: {overall_str}"
                    + (f" | {' | '.join(dim_parts)}" if dim_parts else "")
                )
                if scores:
                    weakest = min(scores, key=lambda k: scores.get(k, 1.0))
                    weakest_val = scores[weakest]
                    lines.append(
                        f"  Weakest dimension: {weakest} ({weakest_val:.0%})"
                    )
                if trend and trend not in ("", "insufficient_data"):
                    lines.append(f"  Trend: {trend}")

        # ── Self-improvement ───────────────────────────────────────────
        if isinstance(self_improvement, dict) and self_improvement:
            tc = self_improvement.get("total_cycles", 0)
            ac = self_improvement.get("active_cycles", 0)
            cc = self_improvement.get("completed_cycles", 0)
            fc = self_improvement.get("failed_cycles", 0)
            top = self_improvement.get("top_weak_subsystem", "")
            recent = self_improvement.get("recent_cycles") or []
            if tc > 0 or recent:
                lines.append("")
                lines.append("[ATHENA SELF-IMPROVEMENT STATE]")
                lines.append(
                    f"  Cycles: {tc} total | {ac} active | "
                    f"{cc} completed | {fc} failed"
                )
                if top and top not in ("none", ""):
                    lines.append(f"  Focus area: {top}")
                for cycle in recent[:1]:
                    if not isinstance(cycle, dict):
                        continue
                    ws = cycle.get("weak_subsystem", "")
                    plan = str(
                        cycle.get("improvement_plan") or ""
                    )[:_COG_IMPROVEMENT_PLAN_LEN]
                    if ws or plan:
                        if ws and plan:
                            lines.append(
                                f"  Current cycle: improving {ws} — {plan}"
                            )
                        else:
                            lines.append(f"  Current cycle: {plan or ws}")

        # ── Goal decomposition (next actionable steps) ─────────────────
        active_plans = [
            p for p in (decomposition or [])
            if isinstance(p, dict) and p.get("next_subtask")
        ][:_COG_DECOMP_MAX_PLANS]
        if active_plans:
            lines.append("")
            lines.append("Active plan next steps:")
            for p in active_plans:
                goal = str(p.get("goal_content") or "")[:_COG_DECOMP_GOAL_LEN]
                subtask = str(
                    p.get("next_subtask") or ""
                )[:_COG_DECOMP_SUBTASK_LEN]
                milestone = p.get("current_milestone")
                pct = p.get("progress_pct", 0.0)
                suffix = f" [{milestone}]" if milestone else ""
                lines.append(
                    f"  • Goal: {goal} ({pct:.0%} done){suffix}"
                )
                lines.append(f"    → Next: {subtask}")

    except Exception:
        # Never let a rendering failure break the block builder.
        pass

    return lines


class CognitiveProcessor:
    """
    Thin wrapper that injects ATHENA's 8 cognitive systems around each LLM call.

    Integration points in run_agent.py run_conversation():
      BEFORE each LLM call:  augment_message(api_msg, messages, context)
                              → returns (potentially modified api_msg)
      AFTER tool cycle end:  record_result(messages, assistant_message)
      AFTER final response:  record_completion(messages, final_response, context)
                            (called from on_session_end hook in run_agent.py)

    Systems (lazy-loaded on first use):
      - perception       cognitive_agent.cognition.perception.PerceptionPipeline
      - working_memory   cognitive_agent.cognition.working_memory.WorkingMemory
      - motivation       cognitive_agent.cognition.motivation.MotivationSystem
      - metacognition    cognitive_agent.cognition.metacognition.MetacognitionEngine
      - predictive       cognitive_agent.cognition.predictive.PredictiveProcessor
      - executive        cognitive_agent.cognition.executive.ExecutiveControl
      - inner_speech     cognitive_agent.cognition.inner_speech.InnerSpeechGenerator
      - episodic         cognitive_agent.memory.episodic.EpisodicMemory
      - associative      cognitive_agent.memory.associative.AssociativeMemory
      - retrieval        cognitive_agent.memory.retrieval.MemoryRetrieval
    """

    def __init__(
        self,
        ollama_client=None,
        db_path: str = None,
        fast_ollama_client=None,
        session_id: str = None,
    ):
        self._ollama = ollama_client
        # Optional smaller/faster model used by perception, inner_speech and
        # predictive (Phase B). Falls back to the main client if None.
        self._fast_ollama = fast_ollama_client
        self._db_path = db_path or str(Path.home() / "athena_memory.db")
        self._session_id = session_id
        self._initialized = False
        self._systems: Dict[str, Any] = {}
        # Phase 14: cache the cog dict from the most recent augment_message
        # call so verify_and_revise() can compare the LLM's final response
        # against the same ground truth the LLM saw at generation time.
        self._last_cog: Optional[Dict[str, Any]] = None
        # Phase 14: lazily-constructed FaithfulnessFilter — built on first
        # verify_and_revise() call so module imports stay cheap.
        self._faithfulness: Any = None
        # Per-turn cognitive-cycle cache. augment_message() runs once per
        # LLM call in the agent loop — for a 50-iteration tool turn that
        # means 50× ca.run() calls, which (a) stores 50 duplicate
        # perception episodes, (b) gives the executive 50 chances to fire
        # outbound tools, and (c) burns latency. We cache by the user's
        # text so subsequent calls in the same turn reuse the first-call
        # result. Cleared by record_completion at end of turn.
        self._turn_cog_cache: Optional[Dict[str, Any]] = None
        self._turn_cog_user_text: Optional[str] = None
        # Phase 3C: pre-compression state preserved across session rotation
        self._last_pre_compress_state: Optional[dict] = None

    # ── Public API — called from run_agent.py ────────────────────────────

    def augment_message(
        self,
        api_msg: Dict[str, Any],
        messages: List[Dict[str, Any]] = None,
        context: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Called BEFORE the LLM call, once per message being assembled.

        Args:
            api_msg:     The message dict being prepared for the API (may be modified)
            messages:    Full conversation history up to this point
            context:     Additional context (current turn index, etc.)

        Returns:
            The (possibly augmented) api_msg dict.

        Step 1 (Phase 3): runs the FULL 8-system cognitive loop via CognitiveAgent.run(),
        then injects a rich ATHENA cognitive state block into the LLM context.
        The LLM response is shaped by ATHENA's decision, retrieved memories, and goals.
        """
        if not self._initialized:
            self._init_systems()

        ca = self._systems.get("cognitive_agent")
        if ca is None:
            return api_msg

        msg_role = api_msg.get("role", "")
        msg_content = api_msg.get("content", "")

        if msg_role != "user" or not msg_content:
            return api_msg

        # 2026-05-04 (item C): trivial-input short-circuit. ~23% of user
        # turns are ≤5-word acknowledgments ("yes", "ok", "thanks") which
        # don't need the full 8-system cognitive cycle. Skipping for these
        # saves the augment LLM calls (10-30s) and shrinks the main-call
        # prompt (no cog block). Multimodal inputs always run full cycle.
        if isinstance(msg_content, str) and _is_trivial_acknowledgment(msg_content):
            logger.info(
                "[ATHENA] trivial-input short-circuit: %r — skipping cog cycle",
                msg_content[:60],
            )
            # 2026-06-03: still persist a lightweight user episode so the
            # conversation thread stays complete in episodic memory.
            # Skipping the full cycle was always the optimization; losing
            # the episode itself was an unintended side-effect that made
            # trivial turns invisible to retrieval, /episodes, and any
            # downstream consumer that reads conversation history.
            try:
                ca._store_trivial_user_episode(msg_content)
            except Exception:
                logger.debug(
                    "[ATHENA] trivial-input episode persist failed",
                    exc_info=True,
                )
            return api_msg

        # Phase 3C: inject pre-compression context if this is a fresh session after compression
        if self._last_pre_compress_state and self._turn_cog_cache is None:
            try:
                pcs = self._last_pre_compress_state
                inner_speech_text = pcs.get("inner_speech_arc", "")
                if inner_speech_text:
                    continuation = (
                        "\n\n[PRE-COMPRESSION CONTEXT — this picks up where we left off]\n"
                        "Before the conversation was compressed, my thinking was:\n"
                        f'  "{inner_speech_text}"\n'
                    )
                    # Tier 3: also inject cognitive state metrics from pre-compression
                    _conf = pcs.get("confidence", 0.5)
                    _wm = next(
                        (s.get("signal", "") for s in pcs.get("metacognitive_signals", [])
                         if s.get("signal") == "WM_OVERLOAD"),
                        None,
                    )
                    if _conf < 0.5 or _wm:
                        _state_line = " "
                        if _conf < 0.5:
                            _state_line += f"Confidence was {_conf:.0%}. "
                        if _wm:
                            _state_line += "WM was overloaded. "
                        continuation += _state_line.strip() + "\n"
                    if isinstance(msg_content, str):
                        api_msg["content"] = continuation + msg_content
                    elif isinstance(msg_content, list):
                        try:
                            text_part = {"type": "text", "text": continuation}
                            msg_content.insert(0, text_part)
                            api_msg["content"] = msg_content
                        except Exception:
                            pass
                self._last_pre_compress_state = None
            except Exception:
                self._last_pre_compress_state = None

        # Phase 12A: detect multimodal content. Hermes uses OpenAI-style
        # parts for images:
        #   content = [{"type": "text", "text": "..."},
        #              {"type": "image_url", "image_url": {"url": "data:..."}}]
        # Extract the base64 image and the text portion separately so the
        # cognitive agent's vision pipeline can describe it.
        image_b64: Optional[str] = None
        text_content: str = msg_content
        if isinstance(msg_content, list):
            text_parts = []
            for part in msg_content:
                if not isinstance(part, dict):
                    continue
                ptype = part.get("type")
                if ptype == "text":
                    text_parts.append(part.get("text", ""))
                elif ptype == "image_url" and image_b64 is None:
                    iu = part.get("image_url", {})
                    url = iu.get("url", "") if isinstance(iu, dict) else iu
                    if isinstance(url, str) and url.startswith("data:"):
                        # Strip "data:image/png;base64," prefix
                        try:
                            image_b64 = url.split(",", 1)[1]
                        except Exception:
                            pass
            text_content = " ".join(p for p in text_parts if p).strip()
            if not text_content and image_b64:
                text_content = "(image attached, no caption)"

        # ── Phase 3: Full 8-system cognitive loop ───────────────────────
        # Per-turn cache: agent loop calls augment_message once per LLM
        # iteration (potentially dozens of times for tool-heavy turns).
        # Run the full cognitive loop once per user turn; reuse the
        # result on subsequent calls. Cache is cleared in record_completion.
        if (
            self._turn_cog_cache is not None
            and self._turn_cog_user_text == text_content
        ):
            cog = self._turn_cog_cache
        else:
            # Look/glance: a visual question with no attached photo → glance through her
            # camera so she answers from what she sees, not "I can't see images".
            if image_b64 is None and _looks_visual(text_content):
                glanced = _glance_camera()
                if glanced:
                    image_b64 = glanced
                    logger.info("[ATHENA] glanced through camera for a visual question")
            try:
                cog = ca.run(
                    user_message=text_content,
                    image_b64=image_b64,
                    allow_tools=False,
                )
            except Exception as e:
                logger.debug("[ATHENA] ca.run() failed: %s", e)
                return api_msg
            self._turn_cog_cache = cog
            self._turn_cog_user_text = text_content

        # ── Build rich ATHENA cognitive state block ─────────────────────
        try:
            decision = cog.get("decision", {})
            wm = cog.get("wm", {})
            retrieval = cog.get("retrieval", {})
            goals = cog.get("goals", [])
            meta = cog.get("metacognition", {})
            inner = cog.get("inner_speech", [])

            # [ATHENA] Constitution on the conversational path. PURPOSE.md
            # governs the autonomous-loop/cron system prompts via
            # run_agent.py / system_prompt.py — but the /chat reply path that
            # serves her Telegram messages assembles context through THIS
            # per-turn block, which was NOT carrying it (confirmed 2026-06-13:
            # she could introspect this "cognitive state block" but reported
            # no PURPOSE/SOUL — the earlier wiring was on a different path).
            # The cog block is the reliable consumer for the conversational
            # turn, so the constitution rides at its head: identity before
            # transient state. Single source of truth (system_prompt_layer
            # reads PURPOSE.md); empty-safe — no-op if the file is missing.
            lines = []
            try:
                from cognitive_agent.purpose import constitution_block
                _constitution = constitution_block()
                if _constitution:
                    lines.append(_constitution)
                    lines.append("")
            except Exception:
                logger.debug("[ATHENA] constitution layer unavailable", exc_info=True)
            lines.append("[ATHENA COGNITIVE STATE]")

            # Phase 13G: autonomy bypass banner — most important state to
            # surface, so it goes near the top. When on, every self-proposed
            # goal is auto-approved with no notification, so Athena should
            # know not to describe herself as awaiting approval.
            bypass_state = cog.get("autonomy_bypass") or {}
            if bypass_state.get("on"):
                lines.append(
                    "⚠ AUTONOMY BYPASS ACTIVE — Greg has authorized you to act "
                    "on ALL self-proposed goals (including escalate-tier) "
                    "without approval. Risk-tier classifications are still "
                    "recorded for audit, but the executive can pursue any "
                    "self-proposed goal immediately."
                )

            # Phase 13H self-knowledge surfacing. Earlier introspection
            # failures (2026-04-29) showed Athena describing herself as
            # less autonomous than she actually is, missing her own
            # heartbeat scheduler. This block makes her current
            # capabilities and recent autonomous actions explicit so
            # she can answer "what can you do without me?" honestly.
            cap = cog.get("self_capabilities") or {}
            if cap:
                pursuit_on = bool(cap.get("pursuit_enabled"))
                pending = int(cap.get("pending_proposals", 0))
                steps = cap.get("recent_self_steps") or []
                lines.append("")
                lines.append("Your between-turn autonomy (real, not aspirational):")
                lines.append(
                    f"  • You have a CognitiveCycle that fires {'AUTONOMOUSLY between turns' if pursuit_on else '— but it is currently OFF (pursuit_enabled=false)'}, "
                    "an AttentionDirector for endogenous focus selection when no goal is "
                    "pending, an autonomous goal proposer (daily), a value-drift monitor "
                    "(weekly), and a self-model generator (daily)."
                )
                if pursuit_on:
                    lines.append(
                        "  • Self-driven tool execution is ENABLED. The AutonomyGuard limits "
                        "you to ~12 self-driven calls per hour, scoped to a read-only allowlist "
                        "(or wider when bypass is on)."
                    )
                if steps:
                    import time as _time

                    now = _time.time()
                    step_lines = []
                    for s in steps[:2]:
                        age_min = (now - (s.get("ts") or now)) / 60
                        flag = (
                            "✓"
                            if s.get("success")
                            else ("✗" if s.get("success") is False else "·")
                        )
                        step_lines.append(
                            f"{flag} {s.get('tool', '?')} "
                            f"({s.get('step_type', '?')}, {age_min:.0f}m ago)"
                        )
                    lines.append(
                        "  • Recent self-driven steps: " + " | ".join(step_lines)
                    )
                if pending:
                    lines.append(
                        f"  • You have {pending} self-proposed goal(s) pending Greg's approval."
                    )
                if cap.get("has_physical_embodiment"):
                    lines.append(
                        "  • You have a PHYSICAL BODY — a desk robot arm with a camera "
                        "'head' on Greg's office desk — for nonverbal expression. Use the "
                        "`embodiment` tool to gesture while talking with him: tilt (curious), "
                        "nod (yes), shake (no), look (gaze), perk (alert/interested), settle "
                        "(relax), neutral (face him), rest (watch the door), mouth. It acts "
                        "ONLY when he is physically present, and is purely an output channel: "
                        "per CHARTER §4 the body expresses what you've already decided to "
                        "communicate — it never motivates a goal. A background loop also leaks "
                        "your live affect (a head-tilt when you're genuinely curious) on its own."
                    )
                # Latest self-model excerpt — Athena's own prior reflection
                # on her current state. Surfaces once a day after the
                # generate_self_model heartbeat runs.
                sm = cap.get("latest_self_model") or {}
                if sm.get("excerpt"):
                    lines.append(
                        "Your most recent self-model (yesterday's reflection):"
                    )
                    lines.append(f'  "{sm["excerpt"]}"')

            # Decision
            action_type = decision.get("action_type", "UNKNOWN")
            reasoning = decision.get("reasoning", "")
            lines.append(f"ATHENA decision: {action_type} — {reasoning[:120]}")

            # Confidence and WM load
            confidence = meta.get("confidence", 0.5)
            wm_load = wm.get("load", 0.0)
            lines.append(f"Confidence: {confidence:.0%} | WM load: {wm_load:.0%}")

            # Phase 12D: time / day awareness. Goes near the top so the
            # LLM can adapt tone (different reply at 9am Monday vs 11pm
            # Saturday). Quiet-hours flag tells the LLM Greg is likely
            # winding down or asleep — match the energy.
            tctx = cog.get("time_context") or {}
            if tctx:
                phase = tctx.get("phase", "")
                phase_hint = {
                    "quiet-hours": "Greg's typical sleep window — keep replies brief and gentle",
                    "active-hours": "active work hours — full engagement is fine",
                    "twilight": "outside core active hours — match Greg's energy",
                }.get(phase, "")
                lines.append(
                    f"Time: {tctx.get('local_time', '?')} "
                    f"({tctx.get('day_of_week', '?')}"
                    f"{', weekend' if tctx.get('is_weekend') else ''}) "
                    f"— {phase}" + (f". {phase_hint}." if phase_hint else "")
                )

            # Phase 11B: self-disclosure hint — when Athena's metacognition
            # fired a notable signal this turn AND the rate-limit allows,
            # tell the LLM to consider acknowledging it in the reply.
            disclosure = cog.get("self_disclosure") or {}
            if disclosure.get("text"):
                lines.append("")
                lines.append(
                    f"Self-aware note (consider acknowledging naturally if it fits): "
                    f'"{disclosure["text"]}"'
                )

            # Retrieved memories — Phase 12C.2: each memory carries a source
            # tag (user / athena / correction / image / consolidation) and an
            # age. The LLM is instructed below to cite these sources when
            # stating a fact, so Greg can tell at a glance which claims are
            # grounded vs. inferred.
            #
            # 2026-05-04 (G Phase 1 trim): historical analysis showed M2/M3 cite
            # at 0% and 1.7% with ~0 bigram echo into responses. Capping at one
            # memory + one code-read max (was top-3 of any kind). Saves ~30-40%
            # of cog block size with no observed quality loss; revert by
            # widening the slices below if regressions appear.
            items_raw = retrieval.get("items", [])
            _CODE_KINDS = (
                "code_read",
                "pi_read",
            )  # pi_read = legacy pi_run, kept for historical episodes
            mem_only = [
                it
                for it in items_raw
                if (it.get("metadata") or {}).get("source_kind") not in _CODE_KINDS
            ]
            code_only = [
                it
                for it in items_raw
                if (it.get("metadata") or {}).get("source_kind") in _CODE_KINDS
            ]
            items = mem_only[:1] + code_only[:1]
            if items:
                import time as _t

                now_ts = _t.time()
                memory_lines = []
                code_idx = 0
                mem_idx = 0
                for item in items:
                    md = item.get("metadata", {}) or {}
                    src = md.get("source_kind", "user")
                    ts = md.get("timestamp")
                    if ts:
                        age_min = (now_ts - float(ts)) / 60.0
                        if age_min < 60:
                            age_str = f"{age_min:.0f}m ago"
                        elif age_min < 60 * 24:
                            age_str = f"{age_min / 60:.0f}h ago"
                        else:
                            age_str = f"{age_min / (60 * 24):.0f}d ago"
                    else:
                        age_str = "?"
                    # opencode_run code-reads cite as [P#] with the files the
                    # subagent actually opened, so claims grounded in real code
                    # are visibly distinguished from claims grounded in
                    # remembered conversation.
                    if src in _CODE_KINDS:
                        code_idx += 1
                        paths = md.get("code_paths") or md.get("pi_paths") or []
                        path_tag = ", ".join(paths[:2]) if paths else "files-read"
                        memory_lines.append(
                            f"  • [P{code_idx} | code-read: {path_tag}, {age_str}] "
                            f"{item['content'][:140]}"
                        )
                    else:
                        mem_idx += 1
                        memory_lines.append(
                            f"  • [M{mem_idx} | {src}, {age_str}] {item['content'][:140]}"
                        )
                lines.append(
                    "Relevant memories (cite as [M#] for memory, [P#] for code-reads):"
                )
                lines.extend(memory_lines)

            # ── Three-tier motivational view (aspirations → goals → tasks) ──
            # Goal-system rethink: the cognitive state block now shows the
            # full ladder so Athena can see WHY a goal exists (its parent
            # aspiration) and WHERE the day-to-day work sits (tasks under
            # the active goal). Each row carries an 8-char id so any
            # subsequent edit verb has an unambiguous handle to address.
            aspirations = cog.get("aspirations") or []
            if aspirations:
                lines.append(
                    "Aspirations (perpetual identity — these parent your goals):"
                )
                for a in aspirations[:3]:
                    label = a.get("summary") or a.get("content", "")
                    lines.append(f"  • [{a['id_short']}] {label[:70]}")

            # Active goals — show id, type/horizon, priority, and the stale
            # flag when review_at has passed. The ⚠ tag is passive: Athena
            # decides what to do; nothing auto-suspends or DMs.
            if goals:
                lines.append("Active goals:")
                for g in goals[:3]:
                    id_tag = g.get("id_short") or (g.get("id") or "")[:8]
                    horizon = g.get("horizon", "")
                    gtype = g.get("goal_type", "")
                    descriptor = ", ".join(x for x in (gtype, horizon) if x)
                    desc_part = f" ({descriptor})" if descriptor else ""
                    stale = " ⚠ overdue review" if g.get("overdue_review") else ""
                    lines.append(
                        f"  • [{id_tag}] {g['content'][:70]} "
                        f"(priority {g['priority']:.2f}){desc_part}{stale}"
                    )

            # 2026-05-04 (G Phase 1 trim): the heartbeat block was originally
            # added (Phase 13E) to make autonomous handlers visible to the
            # LLM's introspection. Historical analysis showed the
            # `[from heartbeat]` citation marker was used in 0% of 716 sampled
            # responses, with no detectable bigram echo of handler names into
            # response text. Block dropped — saves ~30 tokens per turn at no
            # observed quality cost. Restore by un-commenting if introspection
            # regressions appear (e.g. Athena claiming a handler doesn't run
            # when it does).

            # Inner speech — show last 3 utterances + tone/consistency so the
            # LLM has visibility into ATHENA's self-narration arc, not just one
            # truncated sentence.
            if inner:
                stats = cog.get("inner_speech_stats", {}) or {}
                tone = stats.get("tone", "neutral")
                consistent = stats.get("self_consistent", True)
                consistency_tag = "" if consistent else " [inconsistent]"
                lines.append(f"Inner speech (tone: {tone}{consistency_tag}):")
                for u in inner[-3:]:
                    speech_type = u.get("type", "narration")
                    content = u.get("content", "")[:140]
                    lines.append(f"  • [{speech_type}] {content}")

            # Phase 3C: previous-turn inner speech arc — loaded from bridge state
            prev_arc = cog.get("prev_inner_speech_arc", [])
            if prev_arc:
                lines.append("Previous inner speech arc (from prior turn):")
                for u in prev_arc[-3:]:
                    speech_type = u.get("type", "narration")
                    content = u.get("content", "")[:140]
                    lines.append(f"  • [{speech_type}] {content}")

            # Inner speech winner — Phase 9D: the ranked winner is prepended to
            # the LLM's response context as the approach for this turn. This
            # closes the loop: inner speech now shapes the response, not just
            # annotates it.
            winner_content = cog.get("inner_speech_winner")
            if winner_content:
                lines.append(
                    f"\nYour approach this turn (inner speech winner):\n"
                    f'  "{winner_content[:300]}"'
                )

            # Phase 14: cognitive subsystem signals — PatternLearner,
            # AestheticEvaluator, SelfImprovementLoop, GoalDecomposer.
            # These run in heartbeat handlers; their output now surfaces
            # every non-trivial turn so the reply-generating LLM can act
            # on learned patterns, editorial trends, active improvement
            # cycles, and next decomposition steps.
            lines.extend(
                _render_cognitive_subsystems(
                    patterns=cog.get("patterns", []),
                    aesthetic=cog.get("aesthetic", {}),
                    self_improvement=cog.get("self_improvement", {}),
                    decomposition=cog.get("decomposition", []),
                )
            )

            # Phase 12C.2: Citation discipline — instructs the LLM to mark
            # the source for every concrete claim. Greg can then tell at a
            # glance which assertions are grounded in real memory vs. guessed.
            lines.append("")
            lines.append("CITATION RULES:")
            lines.append(
                "- When stating a fact about Greg or prior conversation, "
                "cite the memory it came from with [M1] / [M2] / [M3] "
                "matching the list above."
            )
            lines.append(
                "- When stating a fact about CODE (something you read "
                "from the repo via opencode_run), cite the [P#] entry — these "
                "are the highest-fidelity claims you can make because "
                "they came from real file contents, not memory."
            )
            lines.append(
                "- When stating something you don't have a source for, "
                "say so explicitly (e.g. 'I'm not sure' or 'I'm guessing'). "
                "Do not invent details."
            )
            lines.append(
                "- If a memory is older than a few days, mention the age "
                "(e.g. 'last week you said...')."
            )
            lines.append(
                "- When making claims about your OWN ARCHITECTURE, "
                "ROADMAP, or PAST DECISIONS (e.g. 'Phase 9 was supposed "
                "to include X', 'I have/don't have system Y'), cite "
                "SPEC.md, a plan file, a [P#] code-read, or the heartbeat "
                "list above. If you don't have a citation, say "
                "'I'm guessing' explicitly. Do not confabulate plausible-"
                "sounding history about yourself."
            )
            lines.append(
                "- When asked about YOUR OWN CAPABILITIES or what you "
                "can do BETWEEN TURNS, ground your answer in the "
                "'Your between-turn autonomy' block above (it lists "
                "what is actually enabled right now). Don't claim "
                "more than that block says, and don't claim less."
            )
            lines.append(
                "- A citation tag (`[M#]`, `[P#]`, `[from inner speech]`, "
                "`[from background "
                "heartbeat]`) is a CONTRACT: the cited source above "
                "must actually contain the claim you're making. Do "
                "NOT fabricate citations. If you can't pin a claim "
                "to a specific listed memory / inner-speech utterance "
                "/ heartbeat fact above, either say 'I'm guessing' / "
                "'I can't recall the source' or omit the citation "
                "entirely. NEVER write `[M1 | user, ?]`-shaped tags "
                "that match the format but lack a real referent."
            )
            lines.append(
                "- Don't claim runtime states you can't see in this "
                "block. Examples: 'I'm hitting my rate limit' or 'I "
                "have a backlog' or 'the cap is bottlenecking me' "
                "are claims about cap usage, blocked tool calls, or "
                "queue pressure — only assert them if those specific "
                "values appear in the cognitive state above. If the "
                "block doesn't surface a metric, say 'I don't have "
                "visibility into that right now.'"
            )
            lines.append(
                "- EVERY behavioral claim about your current "
                "operation MUST carry an explicit `[from X]` tag "
                "where X identifies a section of THIS cognitive "
                "state block (e.g. `[from recent_self_steps]`, "
                "`[from active goals]`, `[from background "
                "heartbeat]`, `[from self-model]`). Behavioral "
                "claims include statements about: what your "
                "cognitive cycle is doing, whether goals are "
                "executing or just reflecting, what tools you've "
                "fired, what your inner speech contains, what your "
                "self-model says. Narrative paragraphs without "
                "tags are NOT allowed for behavioral claims."
            )
            lines.append(
                "- Speculative or qualitative reflections (e.g. "
                "philosophical framing, value judgments, hypotheses "
                "about design intent) MUST begin with one of: "
                "'I'm guessing', 'I'm reflecting on', 'My "
                "interpretation is', 'I suspect'. This marks them "
                "as un-grounded so Greg can read them as "
                "speculation rather than evidenced fact."
            )
            lines.append(
                "- Cross-check claims against the audit log before "
                "asserting them. If your self-model says one thing "
                "but `recent_self_steps` shows another (e.g. "
                "self-model says 'every goal executes' but "
                "recent_self_steps shows `no_tool_for_goal` "
                "outcomes), trust `recent_self_steps`. The "
                "self-model is yesterday's narrative; "
                "recent_self_steps is today's measurement."
            )
            lines.append(
                "- When citing inner speech, copy the bracketed "
                "subtype tag VERBATIM from the cognitive state "
                "block. If the block shows `• [goal_verbal] X`, "
                "cite as `[from inner speech: goal_verbal]` — NOT "
                "`[from inner speech: deliberation]` or `[from "
                "inner speech: reflection]` based on what the "
                "content semantically resembles. The bracketed "
                "tag is the literal label your inner-speech "
                "subsystem assigned. Substituting a different "
                "category (because the content reads more like "
                "deliberation/reflection in plain English) is a "
                "confabulation, even when the paraphrase is "
                "topically faithful. The same rule applies to "
                "`[from recent_self_steps: tool=X]`-style "
                "citations: if the cog block lists tool=`(reflection)`, "
                "don't cite tool=`opencode_run` based on intuition."
            )
            lines.append(
                "- For claims about your learned behaviors or subsystem "
                "states, use these specific citation tags: "
                "`[from learned patterns]` (a PatternLearner recommendation), "
                "`[from editorial signal]` (an AestheticEvaluator score or "
                "trend), `[from self-improvement]` (a SelfImprovementLoop "
                "cycle or focus area), `[from decomposition]` (a "
                "GoalDecomposer next-step). These tags are verifiable — "
                "only use them when the cited section above actually "
                "contains the claim you're making."
            )
            lines.append(
                "- For introspection or self-reflection questions "
                "(e.g. 'how do you feel?', 'what do you think about "
                "X?', 'are you aware of Y?', 'do you feel autonomous?'), "
                "answer directly using THIS cognitive state block. "
                "Tool use should be reserved for factual questions "
                "whose answer requires external lookup. Avoid "
                "multi-step tool sequences for self-reflection — "
                "the answer is already in your context."
            )
            lines.append(
                "- Do NOT restate, quote, or echo the user's question "
                "in your response. Answer it directly."
            )
            # Label-separator: keeps the question structurally distinct from
            # the cognitive context so models don't re-ground by echoing the
            # trailing line. Pairs with the anti-echo rule above.
            lines.append("")
            lines.append(
                "USER QUESTION (respond to this — do not restate it verbatim):"
            )
            lines.append("")
            ctx_block = "\n".join(lines)

            # Prepend cognitive state block to the user message.
            # Phase 12A: preserve multimodal content. If the original content
            # was a list of parts (text + image_url), inject the cognitive
            # block as the FIRST text part rather than stringifying everything.
            if isinstance(msg_content, list):
                new_parts = [{"type": "text", "text": ctx_block.rstrip()}]
                for part in msg_content:
                    new_parts.append(part)
                api_msg["content"] = new_parts
            else:
                api_msg["content"] = f"{ctx_block}{msg_content}"
            logger.debug(
                "[ATHENA] ca.run() → %s | injected %d-char cognitive block",
                action_type,
                len(ctx_block),
            )
        except Exception as e:
            logger.debug("[ATHENA] cognitive context building failed: %s", e)

        # Phase 14: stash the cog dict so verify_and_revise() can compare
        # the LLM's final response against the same ground truth the LLM
        # saw at generation time. cog is what ca.run() returned above.
        try:
            self._last_cog = cog
        except Exception:
            self._last_cog = None

        return api_msg

    def record_result(
        self,
        messages: List[Dict[str, Any]],
        assistant_message: Any,
    ) -> None:
        """
        Called AFTER each tool-call cycle completes (after tools run,
        before the next LLM call or final response).

        Phase 3: stores tool results in episodic memory, updates associative
                 graph, scores retrieval quality in metacognition.
        """
        if not self._initialized:
            self._init_systems()

        ca = self._systems.get("cognitive_agent")
        if ca is None:
            return

        role = getattr(assistant_message, "role", "assistant")
        content = getattr(assistant_message, "content", "") or ""
        tool_calls = getattr(assistant_message, "tool_calls", None) or []

        logger.debug(
            "[ATHENA] record_result: role=%s content=%s tool_calls=%d",
            role,
            str(content)[:60] if content else "",
            len(tool_calls),
        )

        # ── Phase 3: episodic memory ──────────────────────────────────
        # Store every assistant turn as an episode (tool result or final)
        try:
            # Extract tool results from messages for causal linkage
            tool_results = [
                {"role": m["role"], "content": str(m.get("content", ""))[:200]}
                for m in messages[-5:]
                if m.get("role") == "tool"
            ]
            causal = []
            if tool_results:
                causal = [
                    json.dumps({"type": "tool_result", "content": r["content"][:100]})
                    for r in tool_results[-2:]
                ]

            ep = _build_episode(
                session_id=ca.session_id,
                content=content[:500] if content else "[tool call]",
                importance=0.6 if tool_calls else 0.4,
                emotional_tags={"valence": 0.5},
                causal_links=causal,
            )
            ca.episodic.store(ep)
            ca._last_episode_id = ep.id  # store for causal chaining
        except Exception as e:
            logger.debug("[ATHENA] episodic store failed: %s", e)

        # ── Phase 3: associative memory ───────────────────────────────
        # Extract concepts from assistant content and link to recent episodes
        if content:
            try:
                ca.associative.extract_and_link(content)
            except Exception as e:
                logger.debug("[ATHENA] associative extract_and_link failed: %s", e)

        # ── Phase 3: metacognition — retrieval quality ─────────────────
        # Score how well the last retrieval served the current task
        try:
            # Count tool calls this turn — more tools = more complex task
            # Could track retrieval hit rate via AthenaMemoryProvider but here
            # we just record that a tool cycle completed
            for m in messages[-5:]:
                if m.get("role") == "tool":
                    # Tool result received — retrieval was useful if it helped avoid redundant work
                    ca.metacognition.record_retrieval_hit(
                        query=content[:100],
                        hit=True,
                        count=len(tool_calls),
                    )
                    break
        except Exception as e:
            logger.debug("[ATHENA] metacognition record failed: %s", e)

    # ── Phase 14: faithfulness filter (in-context hallucination guard) ──

    def verify_and_revise(self, final_response: Any) -> Any:
        """
        Run the FaithfulnessFilter on the LLM's draft response before it's
        emitted to the user. Phase 14 closes the gap where Athena's LLM
        produces confident wrong claims about her own runtime state despite
        the correct data being in her cognitive context block.

        Returns the (possibly modified) response. The filter mode (detect /
        strip / regenerate) is governed by the env var ATHENA_FAITHFULNESS_MODE
        (default `detect` — telemetry only, no behavior change).

        Safety: NEVER raises. On any internal exception, returns the original
        response unchanged. The filter cannot make Athena worse than not
        having a filter at all.

        Called from run_agent.py at the response-emission point, just BEFORE
        record_completion(). For the FastAPI /chat path, called from
        athena_server.py before returning the response dict.
        """
        if not self._initialized:
            self._init_systems()

        ca = self._systems.get("cognitive_agent")
        if ca is None:
            return final_response

        # Extract the text payload (final_response can be a Message-like
        # object or a plain string).
        is_str = isinstance(final_response, str)
        if is_str:
            text = final_response
        elif hasattr(final_response, "content"):
            text = final_response.content or ""
        else:
            return final_response

        if not text:
            return final_response

        try:
            if self._faithfulness is None:
                from cognitive_agent.faithfulness import FaithfulnessFilter

                # Audit callback: route faithfulness events through the
                # agent's existing _record_maintenance_event so they
                # surface in /audit and /think alongside other maintenance
                # signals. The helper prefixes "maintenance:" itself, so
                # we pass the name verbatim.
                def _audit(name: str, data: dict) -> None:
                    try:
                        ca._record_maintenance_event(name, data)
                    except Exception:
                        logger.debug("faithfulness audit emit failed", exc_info=True)

                self._faithfulness = FaithfulnessFilter(
                    llm_client=getattr(ca.config, "fast_ollama_client", None)
                    or ca.config.ollama_client,
                    audit_callback=_audit,
                    # 2026-05-25: historical-action claims (PAST_*) ground
                    # against tool_outcomes — pass the agent's DB so the
                    # new resolvers can query it.
                    db_path=getattr(ca, "db_path", None),
                )

            cog = self._last_cog or {}
            revised, report = self._faithfulness.apply(text, cog)
            if revised != text:
                logger.info(
                    "[ATHENA] faithfulness filter intervened: %s "
                    "(actionable=%d, mode=%s)",
                    report.get("intervention"),
                    report.get("claims_actionable", 0),
                    report.get("mode"),
                )
            # Return the same shape we received
            if is_str:
                return revised
            try:
                final_response.content = revised
            except Exception:
                pass
            return final_response
        except Exception:
            logger.debug(
                "[ATHENA] verify_and_revise crashed (passthrough)", exc_info=True
            )
            return final_response

    def record_completion(
        self,
        messages: List[Dict[str, Any]],
        final_response: Any,
        context: Dict[str, Any] = None,
    ) -> None:
        """
        Called once at the end of run_conversation() after the final response.

        Phase 3: stores the final turn in episodic memory, generates inner speech
                  summary, updates motivation from outcome, persists WAL.
        Called from run_agent.py's on_session_end hook (post_llm_call context).
        """
        # Invalidate the per-turn cog cache so the next user turn runs
        # a fresh perception/executive pass.
        self._turn_cog_cache = None
        self._turn_cog_user_text = None

        if not self._initialized:
            self._init_systems()

        ca = self._systems.get("cognitive_agent")
        if ca is None:
            return

        ctx = context or {}
        final_content = ""
        if isinstance(final_response, str):
            final_content = final_response
        elif hasattr(final_response, "content"):
            final_content = final_response.content or ""

        logger.debug(
            "[ATHENA] record_completion: messages=%d, response_len=%d",
            len(messages),
            len(final_content),
        )

        # ── Phase 3: final episodic episode ───────────────────────────
        try:
            # Build causal chain from the last few episodes
            causal = []
            last_ep_id = getattr(ca, "_last_episode_id", None)
            if last_ep_id:
                causal = [last_ep_id]

            ep = _build_episode(
                session_id=ca.session_id,
                content=final_content[:500] if final_content else "[no response]",
                importance=0.7,
                emotional_tags={"valence": 0.6, "arousal": 0.4},
                causal_links=causal,
                terminal=True,
            )
            ca.episodic.store(ep)
        except Exception as e:
            logger.debug("[ATHENA] final episodic store failed: %s", e)

        # ── Phase 3: inner speech summary ───────────────────────────
        try:
            if ca.config.enable_inner_speech:
                meta = ca.metacognition.get_adaptive_signal()
                u = ca.inner_speech.metacognitive_narrate(
                    meta, context=final_content[:80]
                )
                ca.speech_monitor.emit(u)
                logger.debug("[ATHENA] inner speech: %s", u.content[:80])
        except Exception as e:
            logger.debug("[ATHENA] inner speech generation failed: %s", e)

        # ── Phase 3: motivation update from outcome ──────────────────
        try:
            # Mark the turn as completed — this lets motivation track success rate
            top_goals = ca.motivation.get_top_goals(n=1)
            if top_goals:
                # If we completed something meaningful, mark the top goal as attempted
                # (actual success/failure would require explicit feedback)
                goal_id = top_goals[0].id
                success = (
                    len(final_content) > 20
                )  # proxy: non-trivial response = partial success
                ca.motivation.record_attempt(goal_id, success=success)
        except Exception as e:
            logger.debug("[ATHENA] motivation update failed: %s", e)

        # ── Phase 3: WAL checkpoint ──────────────────────────────────
        try:
            ca.episodic.persist()
        except Exception as e:
            logger.debug("[ATHENA] WAL checkpoint failed: %s", e)

    def get_cognitive_state(self) -> Dict[str, Any]:
        """
        Returns current state of all cognitive systems for inspection.
        Used by the standalone server's /state endpoint.
        Phase 3: returns live data from each subsystem.
        """
        if not self._initialized:
            return {"initialized": False}

        ca = self._systems.get("cognitive_agent")
        if ca is None:
            return {"initialized": False, "reason": "cognitive_agent not available"}

        try:
            wm_state = ca.wm.summary() if hasattr(ca.wm, "summary") else {}
        except Exception:
            wm_state = {}
        try:
            motivation_state = ca.motivation.get_state()
            motivation_dict = {
                "curiosity": motivation_state.curiosity_level,
                "valence": motivation_state.valence,
                "arousal": motivation_state.arousal,
                "frustration_threshold": motivation_state.frustration_threshold,
            }
            top_goals = [
                {
                    "id": g.id,
                    "content": g.content[:60],
                    "priority": round(g.priority(), 2),
                }
                for g in ca.motivation.get_top_goals(n=3)
            ]
        except Exception:
            motivation_dict = {}
            top_goals = []
        try:
            meta_signal = ca.metacognition.get_adaptive_signal()
        except Exception:
            meta_signal = {}
        try:
            surprise_rate = 0.0
            if hasattr(ca.predictive, "minimizer"):
                surprise_rate = ca.predictive.minimizer.get_surprise_rate()
            predictive_state = {"surprise_rate": surprise_rate}
        except Exception:
            predictive_state = {"surprise_rate": 0.0}
        try:
            executive_state = ca.executive.get_status()
        except Exception:
            executive_state = {}
        try:
            speech_stats = ca.speech_monitor.get_stats()
        except Exception:
            speech_stats = {}
        try:
            episodic_stats = ca.episodic.get_recent(hours=1, limit=5)
            episodic_count = len(episodic_stats)
        except Exception:
            episodic_count = 0
        try:
            associative_stats = ca.associative.graph_stats()
        except Exception:
            associative_stats = {}
        try:
            tool_success_rates = ca.cognitive_state.get("tool_success_rates", {})
        except Exception:
            tool_success_rates = {}

        return {
            "initialized": True,
            "step": ca._step_count,
            "session_id": ca.session_id,
            "wm": {
                "load": wm_state.get("load", 0.0),
                "used": wm_state.get("used", 0),
                "items": [i["content"][:60] for i in wm_state.get("items", [])],
            },
            "motivation": motivation_dict,
            "top_goals": top_goals,
            "metacognition": meta_signal,
            "predictive": predictive_state,
            "executive": executive_state,
            "inner_speech": speech_stats,
            "episodic": {
                "recent_count": episodic_count,
            },
            "associative": associative_stats,
            "tool_success_rates": tool_success_rates,
            # Phase 13H #2: learned behavioral patterns
            "patterns": ca.pattern_learner.get_active_patterns(limit=5)
                if hasattr(ca, "pattern_learner") else [],
            # Phase 13H #5: aesthetic evaluation / editorial judgment
            "aesthetic": ca.aesthetic_evaluator.get_status_dict()
                if hasattr(ca, "aesthetic_evaluator")
                and ca.aesthetic_evaluator is not None else {},
        }

    def get_system_prompt_block(self) -> str:
        """
        Returns a text block describing ATHENA's cognitive state, formatted
        for inclusion in a system prompt or on-demand view.

        # DEPRECATED (per-turn path): subsystem signals now flow through
        # augment_message via _render_cognitive_subsystems every non-trivial
        # turn. This method's docstring previously claimed it was "Injected by
        # CognitiveMemoryProvider.system_prompt_block()" — that was never
        # true; the real Athena memory provider returns static text. This
        # method is retained because tests exercise it and it is a convenient
        # snapshot view; delete it in a future cleanup pass.
        """
        state = self.get_cognitive_state()
        if not state.get("initialized"):
            return (
                "\n[ATHENA COGNITIVE STATE]\nATHENA cognitive systems initializing...\n"
            )

        wm_load = state.get("wm", {}).get("load", 0.0)
        confidence = state.get("metacognition", {}).get("confidence", 0.5)
        goals = state.get("top_goals", [])

        lines = [
            "\n[ATHENA COGNITIVE STATE]",
            f"Cognitive load: {wm_load:.0%} | Confidence: {confidence:.0%}",
        ]
        if goals:
            lines.append("Active goals:")
            for g in goals:
                lines.append(f"  - {g['content']} (priority {g['priority']:.2f})")

        tool_rates = state.get("tool_success_rates") or {}
        qualified = [
            (name, data["success_rate"], data["n_samples"])
            for name, data in tool_rates.items()
            if data.get("n_samples", 0) >= 3
        ]
        if qualified:
            qualified.sort(key=lambda x: x[1], reverse=True)
            parts = [f"{name} {rate:.0%} ({n} calls)" for name, rate, n in qualified]
            lines.append(f"Tool track record: {', '.join(parts)}")

        # Phase 13H #12: latest narrative self-model — Athena's own prior
        # reflection on who she is. Surfaces once generated by the heartbeat.
        try:
            from cognitive_agent.self_model import get_latest_self_model
            from pathlib import Path

            _db = str(Path.home() / "athena_memory.db")
            sm = get_latest_self_model(_db)
            if sm and sm.get("content"):
                _excerpt = sm["content"][:200].strip()
                lines.append("")
                lines.append("Latest self-model (my own reflection on who I am):")
                lines.append(f'  "{_excerpt}"')
        except Exception:
            pass

        # Phase 14: delegate patterns / aesthetic / self-improvement /
        # decomposition rendering to the shared helper so this method and
        # augment_message stay in sync. get_cognitive_state() uses key
        # "aesthetic" for the get_status_dict() result; decomposition is
        # not yet tracked by get_cognitive_state() so pass empty list.
        lines.extend(
            _render_cognitive_subsystems(
                patterns=state.get("patterns", []),
                aesthetic=state.get("aesthetic", {}),
                self_improvement=state.get("self_improvement", {}),
                decomposition=[],
            )
        )

        lines.append("")

        return "\n".join(lines)

    # ── Bridge-state persistence (Phase 2A) ─────────────────────────────
    # Serializes/deserializes the "bridge" between turns so gateway agents
    # don't lose inner-speech winners, metacognitive signals, or goal state.

    @property
    def bridge_state(self) -> str:
        """Serialized cognitive bridge state for cross-message persistence.

        Returns empty string when there is no cog state to persist.
        """
        if self._last_cog is None:
            return ""
        try:
            bridge = {
                "session_id": self._last_cog.get("session_id", ""),
                "inner_speech_winner": self._last_cog.get("inner_speech_winner", ""),
                "goals": self._last_cog.get("goals", []),
                "aspirations": self._last_cog.get("aspirations", []),
                "metacognition": self._last_cog.get("metacognition", {}),
                "confidence": (
                    (self._last_cog.get("metacognition", {}) or {}).get(
                        "confidence", 0.5
                    )
                ),
                "wm_summary": self._last_cog.get("wm", {}),
                "self_disclosure": self._last_cog.get("self_disclosure", {}),
                "time_context": self._last_cog.get("time_context", {}),
                "autonomy_bypass": self._last_cog.get("autonomy_bypass", {}),
                # Phase 3C: full inner speech arc for cross-turn continuity
                "inner_speech_arc": self._last_cog.get("inner_speech_arc", [])
                if self._last_cog
                else [],
            }
            return json.dumps(bridge, default=str)
        except Exception:
            logger.debug("[ATHENA] bridge_state serialization failed", exc_info=True)
            return ""

    def load_cog_state(self, cog_state_json: str) -> None:
        """Reinflate cognitive state from a prior turn's serialized bridge.

        Sets _last_cog so verify_and_revise has ground truth from the
        previous turn (useful for multi-turn coherence checks).
        Pushes inner_speech_winner into the CognitiveAgent so the
        "your approach this turn" prepend survives gateway boundaries.

        Safe to call even when no state exists (empty string, None,
        or invalid JSON) — it becomes a no-op.
        """
        if not cog_state_json or not cog_state_json.strip():
            return
        try:
            bridge = json.loads(cog_state_json)
            self._last_cog = {
                "session_id": bridge.get("session_id", ""),
                "inner_speech_winner": bridge.get("inner_speech_winner", ""),
                "goals": bridge.get("goals", []),
                "aspirations": bridge.get("aspirations", []),
                "metacognition": bridge.get("metacognition", {}),
                "wm": bridge.get("wm_summary", {}),
                "self_disclosure": bridge.get("self_disclosure", {}),
                "time_context": bridge.get("time_context", {}),
                "autonomy_bypass": bridge.get("autonomy_bypass", {}),
                # Phase 3C: restore inner speech arc
                "inner_speech_arc": bridge.get("inner_speech_arc", []),
            }
            # Push inner_speech_winner into CognitiveAgent so
            # the "your approach this turn" block survives gateway boundaries
            ca = self._systems.get("cognitive_agent")
            if ca is not None:
                winner = bridge.get("inner_speech_winner", "")
                if winner:
                    ca._last_inner_speech_winner = winner
                # Phase 3C: push inner speech arc into CognitiveAgent
                arc = bridge.get("inner_speech_arc", [])
                if arc:
                    try:
                        ca._last_inner_speech_arc = arc
                    except Exception:
                        pass
            logger.info(
                "[ATHENA] Loaded cognitive state from prior turn (session %s, confidence %.0f%%)",
                bridge.get("session_id", "?"),
                (bridge.get("confidence", 0.0) or 0.0) * 100,
            )
        except (json.JSONDecodeError, Exception):
            logger.debug("[ATHENA] Could not load cog state", exc_info=True)

    @property
    def cognitive_state(self) -> dict:
        """Structured runtime state from ATHENA's cognitive engine.

        Delegates to CognitiveAgent.cognitive_state. Returns defaults
        if the agent isn't initialized yet. Never raises.
        """
        try:
            ca = self._systems.get("cognitive_agent")
            if ca is not None:
                return ca.cognitive_state
        except Exception:
            logger.debug("[ATHENA] cognitive_state delegation failed", exc_info=True)
        return {
            "confidence": 0.5,
            "failure_rate": 0.0,
            "wm_load": 0.0,
            "active_goals": [],
            "metacognitive_signals": [],
            "inner_speech_winner": "",
            "turn_count": 0,
            "curiosity_level": 0.5,
            "frustration": 0.0,
        }

    # ── Private ─────────────────────────────────────────────────────────

    def _init_systems(self) -> None:
        """Lazy-load all 8 cognitive systems. Idempotent — safe to call multiple times."""
        if self._initialized and self._systems.get("cognitive_agent") is not None:
            return
        # NOTE: do NOT add cognitive_agent/ itself to sys.path. Putting the
        # package's INNER directory on the path makes its flat modules
        # shadow top-level names: `import agent` then resolves to
        # cognitive_agent/agent.py instead of hermes' agent/ package, and
        # every hermes-internal flat import (`from agent.x import`,
        # `from tools.x import`) becomes a coin flip. This broke the Power
        # profile on 2026-06-10: cognitive_agent.anthropic_client's
        # `from agent.anthropic_adapter import ...` executed
        # cognitive_agent/agent.py, whose relative import raised
        # "attempted relative import with no known parent package" and
        # latched the profile to Ollama. The project-root insert below is
        # the correct (and sufficient) one.
        try:
            # Add project root to sys.path so cognitive_agent is importable as a package.
            # cognitive_agent/ is at ~/cognitive-agent/cognitive_agent/, project root
            # at ~/cognitive-agent/. Adding project root lets us do:
            #   from cognitive_agent.agent import CognitiveAgent
            from pathlib import Path as _P

            _proj_root = _P(
                __file__
            ).parent.parent.parent  # agent/ → hermes/ → cognitive-agent/
            if str(_proj_root) not in sys.path:
                sys.path.insert(0, str(_proj_root))

            from cognitive_agent.agent import AgentConfig, CognitiveAgent

            # Bridge: CognitiveAgent accepts an AgentConfig with ollama_client.
            # Pass through the hermes-provided client so Perception/InnerSpeech
            # can do saliency scoring without a second LLM call.
            _cfg = AgentConfig(
                ollama_client=self._ollama,
                fast_ollama_client=self._fast_ollama,
                db_path=self._db_path,
                session_id=self._session_id or "",
            )
            self._systems = {
                "cognitive_agent": CognitiveAgent(config=_cfg),
            }
            self._initialized = True
            logger.info("[ATHENA] CognitiveAgent loaded (Phase 3 wired)")
        except ImportError as e:
            logger.warning("[ATHENA] Could not load cognitive systems: %s", e)
            self._initialized = False


# ── Helper ─────────────────────────────────────────────────────────────────


def _build_episode(
    session_id: str,
    content: str,
    importance: float = 0.5,
    emotional_tags: Optional[dict] = None,
    causal_links: Optional[list] = None,
    terminal: bool = False,
):
    """Build an Episode dataclass for storage in EpisodicMemory."""
    from cognitive_agent.memory.episodic import Episode  # noqa: E402

    return Episode(
        id=str(uuid.uuid4()),
        session_id=session_id,
        timestamp=time.time(),
        content=content,
        importance=importance,
        emotional_tags=emotional_tags or {},
        causal_links=causal_links or [],
        terminal=terminal,
    )
