#!/usr/bin/env python3
"""
Weekly TOM review helper.

Reads ~/cognitive-agent/data/blocked_messages.jsonl and prints a tabular
summary of recent gate decisions. Designed for the log-only-mode workflow:
mark each message useful/not-useful by eye, then decide whether the
would_have_blocked flag would have served you well.

Usage:
    python3 tom_review.py                  # last 7 days
    python3 tom_review.py --days 14        # last 14 days
    python3 tom_review.py --json           # raw json, one decision per line
    python3 tom_review.py --by-state       # aggregate by attention state

The jsonl rows come in two shapes:
  - mode=log_only       (always allowed; would_have_blocked tells the story)
  - mode=enforcing      (the legacy block path; would_have_blocked=true always)
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path

LOG = Path.home() / "cognitive-agent" / "data" / "blocked_messages.jsonl"


def load(days: int) -> list[dict]:
    if not LOG.exists():
        return []
    cutoff = (datetime.now() - timedelta(days=days)).timestamp()
    out: list[dict] = []
    with open(LOG, errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except Exception:
                continue
            if row.get("ts", 0) >= cutoff:
                out.append(row)
    return out


def fmt_ts(ts: float) -> str:
    return datetime.fromtimestamp(ts).strftime("%m-%d %H:%M")


def render_table(rows: list[dict]) -> None:
    if not rows:
        print("(no rows)")
        return
    rows = sorted(rows, key=lambda r: r.get("ts", 0))
    print(f"{'when':<13}{'mode':<11}{'state':<15}{'imp':>5}{'thr':>5}  {'wouldblock':<10}  preview")
    print("-" * 130)
    for r in rows:
        ts = fmt_ts(r.get("ts", 0))
        mode = r.get("mode", "?")
        state = r.get("attention_state", "?")
        imp = r.get("importance")
        thr = r.get("threshold")
        wb = r.get("would_have_blocked", r.get("would_block", "?"))
        msg = (r.get("message") or "")[:70].replace("\n", " ")
        imp_s = f"{imp:.2f}" if isinstance(imp, (int, float)) else "?"
        thr_s = f"{thr:.2f}" if isinstance(thr, (int, float)) else "?"
        wb_s = "BLOCK" if wb is True else ("allow" if wb is False else str(wb))
        print(f"{ts:<13}{mode:<11}{state:<15}{imp_s:>5}{thr_s:>5}  {wb_s:<10}  {msg}")


def render_by_state(rows: list[dict]) -> None:
    by_state: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_state[r.get("attention_state", "?")].append(r)
    print(f"{'state':<15}{'n':>5}{'avg_imp':>9}{'avg_thr':>9}{'wouldblock_rate':>17}")
    print("-" * 56)
    for state, items in sorted(by_state.items()):
        n = len(items)
        imps = [i.get("importance") for i in items if isinstance(i.get("importance"), (int, float))]
        thrs = [i.get("threshold") for i in items if isinstance(i.get("threshold"), (int, float))]
        wbs = [i.get("would_have_blocked") for i in items]
        wb_count = sum(1 for w in wbs if w is True)
        avg_imp = sum(imps) / len(imps) if imps else 0.0
        avg_thr = sum(thrs) / len(thrs) if thrs else 0.0
        wb_rate = (wb_count / n) if n else 0.0
        print(f"{state:<15}{n:>5}{avg_imp:>9.2f}{avg_thr:>9.2f}{wb_rate:>16.0%}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--json", action="store_true", help="dump raw rows")
    ap.add_argument("--by-state", action="store_true", help="aggregate by state")
    args = ap.parse_args()

    rows = load(args.days)

    if args.json:
        for r in rows:
            print(json.dumps(r))
        return 0

    print(f"# TOM gate decisions — last {args.days} days — {len(rows)} rows")
    print(f"# source: {LOG}\n")

    if args.by_state:
        render_by_state(rows)
        return 0

    render_table(rows)

    # Trailing summary
    print()
    modes = Counter(r.get("mode", "?") for r in rows)
    wb = sum(1 for r in rows if r.get("would_have_blocked") is True)
    print(f"summary: modes={dict(modes)}  would_have_blocked={wb}/{len(rows)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
