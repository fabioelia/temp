#!/usr/bin/env python3
"""Historian 2026-11-01: can a C1 down-gap put on this week's reporters (AAPL Mon, AMD Tue, QCOM Wed, all after the close) pass the
W44 rule "one contract only when full Kelly covers its cost"?

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-01/scripts/historian_c1_cost_check.py <earnings_cache>
Needs historian_hist_fetch.py's cache (Yahoo daily closes through 10/30) and the strategy review's earnings cache (for sizing.py's C1 payoffs).

Method (the review's own C1 model, so the cost and the Kelly figure are on the same footing):
  * RV20 = annualised stdev of the last 20 daily log returns. The rule uses the 20 ending the session before the reaction day; this
    uses the 20 ending 10/30 (1-3 sessions early), so it is an estimate to re-run on the reaction day.
  * Reaction-day price = the 10/30 close less 8% (the smallest gap that triggers C1).
  * Put: delta 0.35, 25 calendar DTE, IV = m x RV20, Black-Scholes with r = q = 0 (earnings_analysis.py's bs and strike_for_delta),
    bought at model x 1.015 (half a 3% spread). Contract cost = 100 x that.
  * Full Kelly at m = sizing.py's kelly() on the C1 payoffs priced at m (n 216), times real equity $1,917.92.
"""
import csv
import math
import os
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
from earnings_analysis import bs, strike_for_delta  # noqa: E402
from sizing import c1_payoffs, kelly  # noqa: E402

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/hist1101'
EQUITY = 1917.92
NAMES = [('AAPL', 'Tue 11/3'), ('AMD', 'Wed 11/4'), ('QCOM', 'Thu 11/5')]


def closes(sym):
    with open(os.path.join(CACHE, f'{sym}.csv')) as f:
        rows = list(csv.DictReader(f))
    return rows[-1]['date'], np.array([float(r['close']) for r in rows])


def main():
    cache = Path(sys.argv[1])
    mults = np.round(np.arange(1.00, 1.301, 0.05), 2)
    fk = {m: kelly(c1_payoffs(cache, m)) * EQUITY for m in mults}
    print('Full Kelly ($) by IV multiple: ' + ', '.join(f'{m:.2f}x ${fk[m]:,.0f}' for m in mults))
    T = 25 / 365
    for sym, day in NAMES:
        last, c = closes(sym)
        lr = np.diff(np.log(c[-21:]))
        rv = float(np.std(lr, ddof=1) * math.sqrt(252))
        s = c[-1] * 0.92
        print(f"\n{sym} (reaction day {day}): close {c[-1]:.2f} on {last} (Yahoo daily), RV20 {rv:.1%}; an 8% gap puts it at {s:.2f}")
        for m in mults:
            iv = m * rv
            k = float(strike_for_delta(0.35, T, iv, False))
            p = float(bs(1.0, k, T, iv, False)) * s * 1.015
            cost = 100 * p
            print(f"  IV {m:.2f}x = {iv:.1%}: 0.35-delta put ~{k * s:.0f} strike, ~${p:.2f} -> ${cost:,.0f} a contract vs full Kelly ${fk[m]:,.0f}: "
                  f"{'covers' if fk[m] >= cost else 'does NOT cover -> no trade'}")


if __name__ == '__main__':
    main()
