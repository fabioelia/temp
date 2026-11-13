#!/usr/bin/env python3
"""Momentum persona, 2026-11-02: re-run of research/2026-11-01/scripts/momentum_200d.py on Yahoo bars through 2026-11-02,
plus tonight's tape (distribution days, the correction low) and the trigger levels for Tue 11/3 to Thu 11/5.

  python3 -I trading-experiment/research/2026-11-02/scripts/momentum_200d_rerun.py [--no-fetch]

Run from /home/user/temp. The 11/01 SPECIFICATION IS UNCHANGED: same signals (B, B8, R, A), horizons, models (M1, M2, M3),
fills, edge rule, Kelly call and bootstrap seed (1101). Only the inputs move:
  * last bar 2026-11-02 (patched in both the 11/01 module and research/2026-10-30/scripts/momentum_tape.py, whose get() filters
    on its own LAST); snapshot check QQQ 681.09 (brief.md, 11/02); entry day for M3 and the skew window 2026-11-03;
    cache momentum-1102 in the scratchpad.
  * M3 reference contracts, re-picked from tonight's Cboe chain by the 11/01 rule (OI >= 1,000, |delta| in 0.30-0.45,
    spread < 5% of mid, nearest to 30 DTE and 0.40 delta): QQQ261130P00675000 and QQQ261130C00710000. The 11/01 references
    left the band (QQQ261204C00715000 is now delta 0.29); both are still marked in part S for the shadow book.
ADDED, descriptive only (no edge claim; the follow-through day is a retired argument and is not used):
  T1 distribution days: momentum_tape.dist_days (close <= -0.2% vs the prior close on volume above the prior session's, last
     25 sessions; variant: a day drops once a later close is >= 5% above it) for SPY, QQQ, ^GSPC, ^IXIC, IWM, tonight and
     as of 10/30 (the count in my 10/30 note), so the change is visible. Index volume can be partial in the evening.
  T2 correction state: the 252-session high close, the lowest close and low since it, whether 11/2 set a new low, and the
     50- and 200-session averages, for the same five series.
  T3 levels: the QQQ close that is a close below its own 200-day on 11/3 (mean of the last 199 closes), and the same level for
     11/4 and 11/5 if QQQ closes 11/3 (and 11/4) at 681.09 (a flat path, for orientation; the 14:43 check recomputes it).
     Signal A's band and the 0.92 x high (B8) level.
  S  shadow book: tonight's Cboe quotes for the 11/01 shadow contracts and the new references.
"""
import argparse
import os
import sys
from datetime import date, datetime, timezone

import numpy as np

sys.path.insert(0, "/home/user/temp/trading-experiment")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/2026-10-30/scripts")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/2026-11-01/scripts")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/strategy-review/scripts")
import quotes  # noqa: E402
import momentum_tape as MT  # noqa: E402
import momentum_200d as M  # noqa: E402

LAST = "2026-11-02"
SCR = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/momentum-1102"
MT.LAST = LAST
M.LAST = LAST
M.SCR = SCR
M.ENTRY_DAY = date(2026, 11, 3)
M.SNAP = {"QQQ": 681.09}  # brief.md snapshot, 11/02
M.REF = {"P": "QQQ261130P00675000", "C": "QQQ261130C00710000"}
M.RNG = np.random.default_rng(1101)
SHADOW = ["QQQ261204C00715000", "QQQ261127P00680000", "QQQ261130C00710000", "QQQ261130P00675000"]
TAPE = {"SPY": 1993, "QQQ": 1999, "^GSPC": 1950, "^IXIC": 2020, "IWM": 2020}
SNAP_TAPE = {"SPY": 752.10, "QQQ": 681.09, "IWM": 279.14}  # brief.md snapshot, 11/02


def t1_t2(tape):
    print("\n== T1. Distribution days, last 25 sessions (<= -0.2% on volume above the prior session)")
    for s, d in tape.items():
        if s in SNAP_TAPE:
            ok = d["date"][-1] == LAST and abs(d["close"][-1] - SNAP_TAPE[s]) < 0.015
            print(f"  {s} last bar {d['date'][-1]} close {d['close'][-1]:.2f} vs snapshot {SNAP_TAPE[s]:.2f}: {'OK' if ok else 'MISMATCH'}")
        i30 = d["date"].index("2026-10-30")
        d30 = {k: (v[:i30 + 1] if k != "date" else v[:i30 + 1]) for k, v in d.items()}
        dd, dd5, old = MT.dist_days(d), MT.dist_days(d, removal=0.05), MT.dist_days(d30)
        r1 = d["close"][-1] / d["close"][-2] - 1
        print(f"  {s:6} count {len(dd)} (5% removal: {len(dd5)}); as of 10/30: {len(old)}; window starts {d['date'][-25]}; "
              f"11/02 {r1:+.2%} on vol {d['volume'][-1]:,.0f} vs {d['volume'][-2]:,.0f} ({d['volume'][-1] / max(d['volume'][-2], 1):.2f}x)")
        print("         " + ", ".join(f"{x[0][5:]} {x[1]:+.2%} {x[2]:.2f}x" for x in dd))
        dropped = [x for x in old if x[0] not in [y[0] for y in dd]]
        print(f"         aged out since 10/30: {[x[0] for x in dropped]}")
    print("\n== T2. Correction state (closes; the high is the 252-session high close)")
    for s, d in tape.items():
        c, lo = d["close"], d["low"]
        j = len(c) - 252 + int(np.argmax(c[-252:]))
        k = j + int(np.argmin(c[j:]))
        m = j + int(np.argmin(lo[j:]))
        prev_lo = lo[j:-1].min()
        sma50, sma200 = c[-50:].mean(), c[-200:].mean()
        print(f"  {s:6} close {c[-1]:9.2f} | high close {c[j]:9.2f} ({d['date'][j]}) {c[-1] / c[j] - 1:+.2%} | lowest close since "
              f"{c[k]:9.2f} ({d['date'][k]}) | lowest low {lo[m]:9.2f} ({d['date'][m]}); 11/02 low {lo[-1]:.2f} "
              f"{'NEW LOW (undercut ' + format(prev_lo, '.2f') + ')' if lo[-1] < prev_lo else 'held ' + format(prev_lo, '.2f')} | "
              f"50d {sma50:9.2f} ({c[-1] / sma50 - 1:+.1%}) | 200d {sma200:9.2f} ({c[-1] / sma200 - 1:+.1%})")


def t3(q):
    c = q["close"]
    print("\n== T3. QQQ trigger levels (price-only closes; part A above labels its level 'Monday 11/2': it is the NEXT session, 11/3)")
    hi = c[-252:].max()
    lv3 = c[-199:].sum() / 199
    print(f"  11/3: a close below {lv3:.2f} is a close below its 200-day (mean of the last 199 closes); 200-day tonight {c[-200:].mean():.2f}")
    path = list(c)
    for day in ("11/4", "11/5"):
        path.append(681.09)
        lv = sum(path[-199:]) / 199
        print(f"  {day}: about {lv:.2f} if QQQ closes 681.09 on each session before (flat path; recompute at the check)")
    up3 = 1.03 * c[-199:].sum() / (200 - 1.03)
    print(f"  Signal A band on 11/3: {lv3:.2f} <= close <= {up3:.2f}; A already fired on its first qualifying day in 20 sessions "
          f"(the last 'A' event above), so a new A event needs 20 non-qualifying sessions first")
    print(f"  B8 (break in a correction) needs close <= 0.92 x high close {hi:.2f} = {0.92 * hi:.2f}; any break below {lv3:.2f} "
          f"{'is also a B8' if lv3 <= 0.92 * hi else 'is NOT a B8 unless QQQ is also below ' + format(0.92 * hi, '.2f')}")
    sig, s, _, _ = M.signals(c)
    print(f"  tonight: close {c[-1]:.2f}, 200-day {s[-1]:.2f} ({c[-1] / s[-1] - 1:+.2%}), cushion {c[-1] - lv3:.2f} points "
          f"({c[-1] / lv3 - 1:+.2%}) to the 11/3 break level")


def shadow():
    print("\n== S. Shadow book marks (Cboe delayed chain, tonight)")
    for sym in SHADOW:
        qd = quotes.option_quote(sym)
        print(f"  {sym}: bid {qd['bid']} ask {qd['ask']} mid {qd['mid']} spread {(qd['ask'] - qd['bid']) / qd['mid']:.1%} iv {qd['iv']} "
              f"delta {qd['delta']} oi {qd['oi']} last trade {qd['last_trade_time']} ({qd['source']})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-fetch", action="store_true")
    a = ap.parse_args()
    os.makedirs(SCR, exist_ok=True)
    d = {s: MT.get(s, y, SCR, not a.no_fetch) for s, y in M.SPEC.items()}
    print(f"Yahoo daily bars fetched {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC; cache {SCR}; "
          + ", ".join(f"{s} {d[s]['date'][0]}..{d[s]['date'][-1]}" for s in M.SPEC))
    tape = {s: (d[s] if s == "QQQ" else MT.get(s, y, SCR, not a.no_fetch)) for s, y in TAPE.items()}
    tape["^GSPC"] = d["^GSPC"] if "^GSPC" in d else tape["^GSPC"]
    M.part_a(d)
    t3(d["QQQ"])
    t1_t2(tape)
    shadow()
    stock = M.part_b(d)
    print("\n== E0. Skew ratio from tonight's QQQ chain (Cboe delayed; 11/02 close quotes), 21-35 DTE from 11/3")
    m = M.skew_m(d["^VXN"]["close"][-1] / 100)
    env = M.Env(d, m)
    res = M.part_c(d, env, stock)
    M.part_d(stock, res)
    M.part_e(env, stock, res)
    M.part_f(env)
    M.post_hoc(env, SCR, not a.no_fetch)


if __name__ == "__main__":
    main()
