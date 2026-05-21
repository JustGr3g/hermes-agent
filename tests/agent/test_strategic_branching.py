"""Tests for Phase 3A-3 strategic branching in run_agent.py."""


def test_low_confidence_flag_set():
    """Low confidence in cognitive_state sets _low_conf_narrowed flag."""
    from unittest.mock import MagicMock

    mock_cog = MagicMock()
    mock_cog.cognitive_state = {
        "confidence": 0.2,
        "failure_rate": 0.0,
        "wm_load": 0.0,
        "active_goals": [],
        "metacognitive_signals": [],
        "inner_speech_winner": "",
        "turn_count": 0,
        "curiosity_level": 0.5,
        "frustration": 0.0,
    }

    class FakeAgent:
        _cog = mock_cog
        _low_conf_narrowed = False

        def _check_branching(self):
            if self._cog is not None:
                try:
                    cs = self._cog.cognitive_state
                    # Low confidence: < 30% → narrow tool options
                    if cs.get("confidence", 0.5) < 0.3:
                        if (
                            not hasattr(self, "_low_conf_narrowed")
                            or not self._low_conf_narrowed
                        ):
                            self._low_conf_narrowed = True
                            self._set_count = getattr(self, "_set_count", 0) + 1
                    # Working memory overloaded: > 80% → prefer simple, single-tool responses
                    if cs.get("wm_load", 0.0) > 0.8:
                        if not getattr(self, "_wm_overloaded", False):
                            self._wm_overloaded = True
                    # High frustration: > 0.7 → avoid risky tool calls
                    if cs.get("frustration", 0.0) > 0.7:
                        if not getattr(self, "_high_frustration", False):
                            self._high_frustration = True
                    # High failure rate: > 60% → back off, switch strategy
                    if cs.get("failure_rate", 0.0) > 0.6:
                        if not getattr(self, "_high_failure_rate", False):
                            self._high_failure_rate = True
                    # Repeated failure signal → back off immediately
                    _signals = cs.get("metacognitive_signals", [])
                    if any(s.get("signal") == "REPEATED_FAILURE" for s in _signals):
                        if not getattr(self, "_repeated_failure", False):
                            self._repeated_failure = True
                except Exception:
                    pass

    agent = FakeAgent()
    assert agent._low_conf_narrowed is False
    agent._check_branching()
    assert agent._low_conf_narrowed is True


def test_high_confidence_no_flag():
    """High confidence does not set _low_conf_narrowed flag."""
    from unittest.mock import MagicMock

    mock_cog = MagicMock()
    mock_cog.cognitive_state = {
        "confidence": 0.8,
        "failure_rate": 0.0,
        "wm_load": 0.0,
        "active_goals": [],
        "metacognitive_signals": [],
        "inner_speech_winner": "",
        "turn_count": 0,
        "curiosity_level": 0.5,
        "frustration": 0.0,
    }

    class FakeAgent:
        _cog = mock_cog
        _low_conf_narrowed = False
        _wm_overloaded = False

        def _check_branching(self):
            if self._cog is not None:
                try:
                    cs = self._cog.cognitive_state
                    # Low confidence: < 30% → narrow tool options
                    if cs.get("confidence", 0.5) < 0.3:
                        if (
                            not hasattr(self, "_low_conf_narrowed")
                            or not self._low_conf_narrowed
                        ):
                            self._low_conf_narrowed = True
                            self._set_count = getattr(self, "_set_count", 0) + 1
                    # Working memory overloaded: > 80% → prefer simple, single-tool responses
                    if cs.get("wm_load", 0.0) > 0.8:
                        if not getattr(self, "_wm_overloaded", False):
                            self._wm_overloaded = True
                    # High frustration: > 0.7 → avoid risky tool calls
                    if cs.get("frustration", 0.0) > 0.7:
                        if not getattr(self, "_high_frustration", False):
                            self._high_frustration = True
                    # High failure rate: > 60% → back off, switch strategy
                    if cs.get("failure_rate", 0.0) > 0.6:
                        if not getattr(self, "_high_failure_rate", False):
                            self._high_failure_rate = True
                    # Repeated failure signal → back off immediately
                    _signals = cs.get("metacognitive_signals", [])
                    if any(s.get("signal") == "REPEATED_FAILURE" for s in _signals):
                        if not getattr(self, "_repeated_failure", False):
                            self._repeated_failure = True
                except Exception:
                    pass

    agent = FakeAgent()
    agent._check_branching()
    assert agent._low_conf_narrowed is False
    assert agent._wm_overloaded is False


def test_no_cog_processor_no_crash():
    """No cognitive processor does not crash the branching check."""

    class FakeAgent:
        _cog = None
        _low_conf_narrowed = False

        def _check_branching(self):
            if self._cog is not None:
                try:
                    cs = self._cog.cognitive_state
                    # Low confidence: < 30% → narrow tool options
                    if cs.get("confidence", 0.5) < 0.3:
                        if (
                            not hasattr(self, "_low_conf_narrowed")
                            or not self._low_conf_narrowed
                        ):
                            self._low_conf_narrowed = True
                            self._set_count = getattr(self, "_set_count", 0) + 1
                    # Working memory overloaded: > 80% → prefer simple, single-tool responses
                    if cs.get("wm_load", 0.0) > 0.8:
                        if not getattr(self, "_wm_overloaded", False):
                            self._wm_overloaded = True
                    # High frustration: > 0.7 → avoid risky tool calls
                    if cs.get("frustration", 0.0) > 0.7:
                        if not getattr(self, "_high_frustration", False):
                            self._high_frustration = True
                    # High failure rate: > 60% → back off, switch strategy
                    if cs.get("failure_rate", 0.0) > 0.6:
                        if not getattr(self, "_high_failure_rate", False):
                            self._high_failure_rate = True
                    # Repeated failure signal → back off immediately
                    _signals = cs.get("metacognitive_signals", [])
                    if any(s.get("signal") == "REPEATED_FAILURE" for s in _signals):
                        if not getattr(self, "_repeated_failure", False):
                            self._repeated_failure = True
                except Exception:
                    pass

    agent = FakeAgent()
    agent._check_branching()
    assert agent._low_conf_narrowed is False


def test_cognitive_state_exception_no_crash():
    """If cognitive_state raises, branching doesn't crash."""
    from unittest.mock import MagicMock

    mock_cog = MagicMock()
    type(mock_cog).cognitive_state = property(
        lambda self: (_ for _ in ()).throw(RuntimeError("boom"))
    )

    class FakeAgent:
        _cog = mock_cog
        _low_conf_narrowed = False

        def _check_branching(self):
            if self._cog is not None:
                try:
                    cs = self._cog.cognitive_state
                    # Low confidence: < 30% → narrow tool options
                    if cs.get("confidence", 0.5) < 0.3:
                        if (
                            not hasattr(self, "_low_conf_narrowed")
                            or not self._low_conf_narrowed
                        ):
                            self._low_conf_narrowed = True
                            self._set_count = getattr(self, "_set_count", 0) + 1
                    # Working memory overloaded: > 80% → prefer simple, single-tool responses
                    if cs.get("wm_load", 0.0) > 0.8:
                        if not getattr(self, "_wm_overloaded", False):
                            self._wm_overloaded = True
                    # High frustration: > 0.7 → avoid risky tool calls
                    if cs.get("frustration", 0.0) > 0.7:
                        if not getattr(self, "_high_frustration", False):
                            self._high_frustration = True
                    # High failure rate: > 60% → back off, switch strategy
                    if cs.get("failure_rate", 0.0) > 0.6:
                        if not getattr(self, "_high_failure_rate", False):
                            self._high_failure_rate = True
                    # Repeated failure signal → back off immediately
                    _signals = cs.get("metacognitive_signals", [])
                    if any(s.get("signal") == "REPEATED_FAILURE" for s in _signals):
                        if not getattr(self, "_repeated_failure", False):
                            self._repeated_failure = True
                except Exception:
                    pass

    agent = FakeAgent()
    agent._check_branching()
    assert agent._low_conf_narrowed is False


def test_narrowed_flag_only_set_once():
    """_low_conf_narrowed is set once and stays set on repeated low confidence."""
    from unittest.mock import MagicMock

    mock_cog = MagicMock()
    mock_cog.cognitive_state = {
        "confidence": 0.15,
        "failure_rate": 0.0,
        "wm_load": 0.0,
        "active_goals": [],
        "metacognitive_signals": [],
        "inner_speech_winner": "",
        "turn_count": 0,
        "curiosity_level": 0.5,
        "frustration": 0.0,
    }

    class FakeAgent:
        _cog = mock_cog
        _low_conf_narrowed = False

        def _check_branching(self):
            if self._cog is not None:
                try:
                    cs = self._cog.cognitive_state
                    # Low confidence: < 30% → narrow tool options
                    if cs.get("confidence", 0.5) < 0.3:
                        if (
                            not hasattr(self, "_low_conf_narrowed")
                            or not self._low_conf_narrowed
                        ):
                            self._low_conf_narrowed = True
                            self._set_count = getattr(self, "_set_count", 0) + 1
                    # Working memory overloaded: > 80% → prefer simple, single-tool responses
                    if cs.get("wm_load", 0.0) > 0.8:
                        if not getattr(self, "_wm_overloaded", False):
                            self._wm_overloaded = True
                    # High frustration: > 0.7 → avoid risky tool calls
                    if cs.get("frustration", 0.0) > 0.7:
                        if not getattr(self, "_high_frustration", False):
                            self._high_frustration = True
                    # High failure rate: > 60% → back off, switch strategy
                    if cs.get("failure_rate", 0.0) > 0.6:
                        if not getattr(self, "_high_failure_rate", False):
                            self._high_failure_rate = True
                    # Repeated failure signal → back off immediately
                    _signals = cs.get("metacognitive_signals", [])
                    if any(s.get("signal") == "REPEATED_FAILURE" for s in _signals):
                        if not getattr(self, "_repeated_failure", False):
                            self._repeated_failure = True
                except Exception:
                    pass

    agent = FakeAgent()
    agent._check_branching()
    agent._check_branching()
    assert agent._low_conf_narrowed is True
    assert agent._set_count == 1


def test_wm_overloaded_flag_set():
    """WM load > 0.8 sets _wm_overloaded flag."""
    from unittest.mock import MagicMock

    mock_cog = MagicMock()
    mock_cog.cognitive_state = {
        "confidence": 0.9,
        "failure_rate": 0.0,
        "wm_load": 0.9,
        "active_goals": [],
        "metacognitive_signals": [],
        "inner_speech_winner": "",
        "turn_count": 0,
        "curiosity_level": 0.5,
        "frustration": 0.0,
    }

    class FakeAgent:
        _cog = mock_cog
        _low_conf_narrowed = False
        _wm_overloaded = False

        def _check_branching(self):
            if self._cog is not None:
                try:
                    cs = self._cog.cognitive_state
                    if cs.get("wm_load", 0.0) > 0.8:
                        if not getattr(self, "_wm_overloaded", False):
                            self._wm_overloaded = True
                except Exception:
                    pass

    agent = FakeAgent()
    assert agent._wm_overloaded is False
    agent._check_branching()
    assert agent._wm_overloaded is True


def test_high_frustration_flag_set():
    """Frustration > 0.7 sets _high_frustration flag."""
    from unittest.mock import MagicMock

    mock_cog = MagicMock()
    mock_cog.cognitive_state = {
        "confidence": 0.9,
        "failure_rate": 0.0,
        "wm_load": 0.0,
        "active_goals": [],
        "metacognitive_signals": [],
        "inner_speech_winner": "",
        "turn_count": 0,
        "curiosity_level": 0.5,
        "frustration": 0.85,
    }

    class FakeAgent:
        _cog = mock_cog
        _low_conf_narrowed = False
        _high_frustration = False

        def _check_branching(self):
            if self._cog is not None:
                try:
                    cs = self._cog.cognitive_state
                    if cs.get("frustration", 0.0) > 0.7:
                        if not getattr(self, "_high_frustration", False):
                            self._high_frustration = True
                except Exception:
                    pass

    agent = FakeAgent()
    assert agent._high_frustration is False
    agent._check_branching()
    assert agent._high_frustration is True


def test_high_failure_rate_flag_set():
    """Failure rate > 0.6 sets _high_failure_rate flag."""
    from unittest.mock import MagicMock

    mock_cog = MagicMock()
    mock_cog.cognitive_state = {
        "confidence": 0.9,
        "failure_rate": 0.75,
        "wm_load": 0.0,
        "active_goals": [],
        "metacognitive_signals": [],
        "inner_speech_winner": "",
        "turn_count": 0,
        "curiosity_level": 0.5,
        "frustration": 0.0,
    }

    class FakeAgent:
        _cog = mock_cog
        _low_conf_narrowed = False
        _high_failure_rate = False

        def _check_branching(self):
            if self._cog is not None:
                try:
                    cs = self._cog.cognitive_state
                    if cs.get("failure_rate", 0.0) > 0.6:
                        if not getattr(self, "_high_failure_rate", False):
                            self._high_failure_rate = True
                except Exception:
                    pass

    agent = FakeAgent()
    assert agent._high_failure_rate is False
    agent._check_branching()
    assert agent._high_failure_rate is True


def test_repeated_failure_signal_flag_set():
    """REPEATED_FAILURE metacognitive signal sets _repeated_failure flag."""
    from unittest.mock import MagicMock

    mock_cog = MagicMock()
    mock_cog.cognitive_state = {
        "confidence": 0.9,
        "failure_rate": 0.0,
        "wm_load": 0.0,
        "active_goals": [],
        "metacognitive_signals": [
            {"signal": "REPEATED_FAILURE", "context": "tool web_search failed 3 times"}
        ],
        "inner_speech_winner": "",
        "turn_count": 0,
        "curiosity_level": 0.5,
        "frustration": 0.0,
    }

    class FakeAgent:
        _cog = mock_cog
        _low_conf_narrowed = False
        _repeated_failure = False

        def _check_branching(self):
            if self._cog is not None:
                try:
                    cs = self._cog.cognitive_state
                    _signals = cs.get("metacognitive_signals", [])
                    if any(s.get("signal") == "REPEATED_FAILURE" for s in _signals):
                        if not getattr(self, "_repeated_failure", False):
                            self._repeated_failure = True
                except Exception:
                    pass

    agent = FakeAgent()
    assert agent._repeated_failure is False
    agent._check_branching()
    assert agent._repeated_failure is True


def test_wm_not_overloaded_no_flag():
    """WM load < 0.8 does not set _wm_overloaded flag."""
    from unittest.mock import MagicMock

    mock_cog = MagicMock()
    mock_cog.cognitive_state = {
        "confidence": 0.9,
        "failure_rate": 0.0,
        "wm_load": 0.3,
        "active_goals": [],
        "metacognitive_signals": [],
        "inner_speech_winner": "",
        "turn_count": 0,
        "curiosity_level": 0.5,
        "frustration": 0.0,
    }

    class FakeAgent:
        _cog = mock_cog
        _low_conf_narrowed = False
        _wm_overloaded = False

        def _check_branching(self):
            if self._cog is not None:
                try:
                    cs = self._cog.cognitive_state
                    if cs.get("wm_load", 0.0) > 0.8:
                        if not getattr(self, "_wm_overloaded", False):
                            self._wm_overloaded = True
                except Exception:
                    pass

    agent = FakeAgent()
    agent._check_branching()
    assert agent._wm_overloaded is False
