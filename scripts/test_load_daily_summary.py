#!/usr/bin/env python3
"""Regression tests for load_daily_summary.py freshness gating.

Run: python3 hermes/scripts/test_load_daily_summary.py

Locks in the 2026-05-31 fix: the loader must serve only *today's* summary.
Before the fix it returned the newest cron session within a 30h age window,
so on a morning where today's 06:30 cron had not yet produced a file it served
*yesterday's* summary — making the review re-process an already-adjudicated
report. The freshness gate keys on the summary's own embedded date.

No pytest dependency — plain asserts, exits non-zero on failure.
"""
from __future__ import annotations

import os
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path

import load_daily_summary as lds

CID = lds.CRON_ID


def _name(stamp: str) -> Path:
    return Path(f"/sessions/session_cron_{CID}_{stamp}.json")


def test_parse_session_dt() -> None:
    assert lds.parse_session_dt(_name("20260531_063058")).date() == datetime(2026, 5, 31).date()
    # Hour/min/sec are preserved (used by the age fallback when needed).
    dt = lds.parse_session_dt(_name("20260531_063058"))
    assert (dt.hour, dt.minute, dt.second) == (6, 30, 58)
    # Non-matching names parse to None (triggers the age fallback).
    assert lds.parse_session_dt(Path("/x/garbage.json")) is None
    assert lds.parse_session_dt(_name("2026_06")) is None
    print("ok parse_session_dt")


def test_same_day_is_fresh() -> None:
    now = datetime(2026, 5, 31, 7, 0, 0)
    fresh, why = lds.is_fresh(_name("20260531_063058"), now)
    assert fresh, why
    assert why == ""
    print("ok same-day summary is fresh")


def test_prior_day_is_stale() -> None:
    # The exact bug: review runs 05-31, newest summary is 05-30.
    now = datetime(2026, 5, 31, 7, 0, 0)
    fresh, why = lds.is_fresh(_name("20260530_063058"), now)
    assert not fresh
    assert "2026-05-30" in why and "2026-05-31" in why
    print("ok prior-day summary is stale")


def test_future_day_is_stale() -> None:
    # Clock skew / a stray future-dated file must not be served either —
    # "today's date" is an exact match, not ">= today".
    now = datetime(2026, 5, 31, 7, 0, 0)
    fresh, _ = lds.is_fresh(_name("20260601_063058"), now)
    assert not fresh
    print("ok future-day summary is stale")


def test_unparseable_name_falls_back_to_age() -> None:
    d = Path(tempfile.mkdtemp())
    p = d / f"session_cron_{CID}_WEIRDNAME.json"
    p.write_text("{}")
    # Fresh file -> age backstop passes.
    fresh, _ = lds.is_fresh(p, datetime.now())
    assert fresh
    # Backdate past MAX_AGE_HOURS -> stale via backstop.
    old = time.time() - (lds.MAX_AGE_HOURS + 10) * 3600
    os.utime(p, (old, old))
    fresh, why = lds.is_fresh(p, datetime.now())
    assert not fresh
    assert "could not be parsed" in why
    print("ok unparseable name falls back to age backstop")


if __name__ == "__main__":
    failures = 0
    for fn in [
        test_parse_session_dt,
        test_same_day_is_fresh,
        test_prior_day_is_stale,
        test_future_day_is_stale,
        test_unparseable_name_falls_back_to_age,
    ]:
        try:
            fn()
        except AssertionError as e:
            failures += 1
            print(f"FAIL {fn.__name__}: {e}")
    if failures:
        print(f"\n{failures} test(s) failed")
        sys.exit(1)
    print("\nall load_daily_summary tests passed")
