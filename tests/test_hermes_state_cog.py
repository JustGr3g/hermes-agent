"""Tests for SessionDB cognitive state methods (Phase 2A)."""

import json
import pytest
import sqlite3
from pathlib import Path

from hermes_state import SessionDB


def _make_db(tmp_path: Path) -> SessionDB:
    """Create an in-memory-like SessionDB at a temp path."""
    db_path = tmp_path / "test_hermes_state.db"
    db = SessionDB(db_path)
    db.create_session("test-ses-001", "test", model="test-model")
    return db


class TestSessionDBCognitiveState:
    def test_get_nonexistent_session(self, tmp_path):
        """get_cognitive_state on a nonexistent session returns None."""
        db_path = tmp_path / "empty.db"
        db = SessionDB(db_path)
        assert db.get_cognitive_state("nonexistent") is None

    def test_update_and_get(self, tmp_path):
        """Round-trip store and retrieve cognitive state."""
        db = _make_db(tmp_path)
        db.update_cognitive_state("test-ses-001", '{"confidence": 0.8}')
        state = db.get_cognitive_state("test-ses-001")
        assert state == '{"confidence": 0.8}'

    def test_round_trip_json(self, tmp_path):
        """A full bridge-state JSON survives a round trip."""
        bridge = json.dumps({
            "session_id": "test-ses-001",
            "inner_speech_winner": "research more",
            "goals": [{"content": "audit", "priority": 0.8}],
            "metacognition": {"confidence": 0.75},
            "wm_summary": {"load": 0.4},
        })
        db = _make_db(tmp_path)
        db.update_cognitive_state("test-ses-001", bridge)
        loaded = db.get_cognitive_state("test-ses-001")
        data = json.loads(loaded)
        assert data["inner_speech_winner"] == "research more"
        assert data["metacognition"]["confidence"] == 0.75

    def test_update_overwrites(self, tmp_path):
        """Updating cognitive state overwrites the previous value."""
        db = _make_db(tmp_path)
        db.update_cognitive_state("test-ses-001", '{"v": 1}')
        db.update_cognitive_state("test-ses-001", '{"v": 2}')
        state = db.get_cognitive_state("test-ses-001")
        data = json.loads(state)
        assert data["v"] == 2

    def test_column_exists(self, tmp_path):
        """The cognitive_state column exists on a newly created DB."""
        db_path = tmp_path / "schema_test.db"
        db = SessionDB(db_path)
        # Inspect the schema directly
        conn = sqlite3.connect(str(db_path))
        cols = [row[1] for row in conn.execute("PRAGMA table_info(sessions)")]
        conn.close()
        assert "cognitive_state" in cols
