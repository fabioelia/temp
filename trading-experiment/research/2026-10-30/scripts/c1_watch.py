#!/usr/bin/env python3
"""Momentum persona, 2026-10-30: C1 watch levels for the 11/2-11/4 reporters, and a ^VIX split of the C1 events.

  python3 trading-experiment/research/2026-10-30/scripts/c1_watch.py [--events CSV] [--vix CSV]

Run from /home/user/temp.

PART 1 (levels, descriptive). For AAPL (reports 11/2 after the close; reaction day 11/3) and AMD (11/3 pm; reaction 11/4),
dates from the Robinhood earnings calendar (verified flag true), fetched 10/30 evening:
  * RV20 per earnings_analysis.py: annualised stdev (ddof 1) of the 20 daily log returns ending the session before the
    reaction day. That session is 11/2 (AAPL) or 11/3 (AMD), not yet traded, so the figure here, ending 10/30, is
    PROVISIONAL and must be recomputed at the 14:43 check.
  * The C1 IV cap = 1.3 x RV20; the 8% gap line = 0.92 x the prior close (provisional: 0.92 x the 10/30 close).
  * A Black-Scholes put (r = ^IRX, q = 0) at the IV cap for delta 0.30 / 0.35 / 0.45, 11/20 expiry, priced at the close of
    the reaction day with S on the gap line: is a delta-band put affordable under the $450 order cap?
PART 2 (fixed before the split was computed, 10/30 ~17:35 ET). The open Sunday question: does a ^VIX <= 22 gate belong
on C1? Events = the strategy-review C1 primary sample (events.csv written by earnings_analysis.py; gap <= -8%, ex5 not
missing). Split by the ^VIX close on the reaction day: <= 22 vs > 22 (at 14:43 we see the live value; the close is the
proxy). Continuation = -(ex5 - base5) (5-session excess vs SPY beyond the ticker-year baseline, signed for a down gap);
hit = ex5 < 0. Welch t on the difference. Stock level only: the option EV is not re-run here, so a split that matters at
stock level would still need the put model before any gate is changed.
"""
import argparse
import csv
import math
import sys
import urllib.parse
from datetime import date, datetime, timezone
from statistics import NormalDist

import numpy as np

sys.path.insert(0, "/home/user/temp/trading-experiment")
import quotes  # noqa: E402

SCR = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-data"
N = NormalDist()


def bars(sym, days=60):
    end = int(datetime.now(timezone.utc).timestamp())
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?interval=1d"
           f"&period1={end - days * 86400}&period2={end}")
    r = quotes.get_json(url)["chart"]["result"][0]
    q = r["indicators"]["quote"][0]
    out = []
    for t, c in zip(r["timestamp"], q["close"]):
        if c is not None:
            out.append((datetime.fromtimestamp(t + 6 * 3600, timezone.utc).date().isoformat(), c))
    return [x for x in out if x[0] <= "2026-10-30"]


def bs_put(S, K, T, sig, r):
    d1 = (math.log(S / K) + (r + 0.5 * sig * sig) * T) / (sig * math.sqrt(T))
    d2 = d1 - sig * math.sqrt(T)
    return K * math.exp(-r * T) * N.cdf(-d2) - S * N.cdf(-d1)


def strike_for(S, T, sig, r, delta):
    d1 = -N.inv_cdf(delta)  # put delta = -N(-d1)
    return S * math.exp(-d1 * sig * math.sqrt(T) + (r + 0.5 * sig * sig) * T)


def part1():
    irx = bars("^IRX", 10)[-1][1] / 100
    print(f"== Part 1. C1 watch levels (Yahoo daily closes to 2026-10-30; r = ^IRX {irx:.4f})")
    for sym, react in (("AAPL", date(2026, 11, 3)), ("AMD", date(2026, 11, 4))):
        b = bars(sym)
        c = np.array([x[1] for x in b])
        lr = np.diff(np.log(c[-21:]))
        rv = lr.std(ddof=1) * math.sqrt(252)
        cap = 1.3 * rv
        S = 0.92 * c[-1]
        T = (date(2026, 11, 20) - react).days / 365
        print(f"  {sym}: close {b[-1][0]} {c[-1]:.2f} | RV20 (provisional) {rv:.1%} -> IV cap {cap:.1%} | "
              f"gap line (provisional) {S:.2f} | reaction day {react}")
        for dl in (0.30, 0.35, 0.45):
            K = strike_for(S, T, cap, irx, dl)
            print(f"     delta {dl:.2f}: strike {K:7.2f}, model put {bs_put(S, K, T, cap, irx):6.2f} at the IV cap "
                  f"(x100 = ${100 * bs_put(S, K, T, cap, irx):,.0f})")


def part2(events, vixf):
    vix = {}
    with open(vixf) as f:
        for r in csv.DictReader(f):
            vix[r["date"]] = float(r["close"])
    rows = []
    with open(events) as f:
        for r in csv.DictReader(f):
            if r["gap"] and float(r["gap"]) <= -0.08 and r["ex5"] not in ("", "nan") and r["base5"] not in ("", "nan"):
                v = vix.get(r["react_date"])
                rows.append((r["ticker"], r["react_date"], float(r["gap"]), float(r["ex5"]), float(r["base5"]), v))
    print(f"\n== Part 2. C1 down gaps >= 8%: n {len(rows)} (strategy review: 216); with a ^VIX close: "
          f"{sum(1 for x in rows if x[5] is not None)}")
    groups = {}
    for name, test in (("VIX <= 22", lambda v: v <= 22), ("VIX > 22", lambda v: v > 22),
                       ("VIX > 25", lambda v: v > 25), ("VIX <= 18", lambda v: v <= 18)):
        g = [x for x in rows if x[5] is not None and test(x[5])]
        cont = np.array([-(x[3] - x[4]) for x in g])
        hit = np.mean([x[3] < 0 for x in g])
        t = cont.mean() / (cont.std(ddof=1) / math.sqrt(len(cont)))
        groups[name] = cont
        print(f"  {name:9} n {len(g):3} | continuation {cont.mean():+.2%} (t {t:+.2f}) median {np.median(cont):+.2%} | "
              f"hit {hit:.0%} | since 2015 n {sum(1 for x in g if x[1] >= '2015')}, "
              f"{np.mean([-(x[3] - x[4]) for x in g if x[1] >= '2015'] or [float('nan')]):+.2%}")
    a, b = groups["VIX <= 22"], groups["VIX > 22"]
    se = math.sqrt(a.var(ddof=1) / len(a) + b.var(ddof=1) / len(b))
    print(f"  difference (> 22 minus <= 22): {b.mean() - a.mean():+.2%}, Welch t {(b.mean() - a.mean()) / se:+.2f}")
    hi = [x for x in rows if x[5] is not None and x[5] > 22]
    print("  VIX > 22 events: " + ", ".join(f"{x[0]} {x[1]} (VIX {x[5]:.1f})" for x in sorted(hi, key=lambda x: x[1])[-12:]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--events", default=f"{SCR}/earnings/events.csv")
    ap.add_argument("--vix", default=f"{SCR}/VIX.csv")
    a = ap.parse_args()
    part1()
    part2(a.events, a.vix)


if __name__ == "__main__":
    main()
