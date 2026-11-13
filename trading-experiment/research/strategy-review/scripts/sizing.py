"""Sizing for the no-cap regime (W44 review, change 3; 2026-11-01). A method, not a cap: the owner removed the buy caps on 2026-10-30.

Given a setup's tested per-$ payoff distribution R (option value at exit / premium paid, after spreads), the Kelly fraction f* maximizes
mean(log(1 + f * (R - 1))). The order's thesis quotes f*, half- and quarter-Kelly in dollars for the current equity, and the size actually chosen.
If the mean payoff is at or below 1, f* is 0: the setup has no edge to size.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/strategy-review/scripts/sizing.py c1 <earnings_cache> --equity 1917.92 --iv-mult 1.25
      C1 down-gap puts (gap <= -8%, entry at the reaction-day close, 5 sessions, delta 0.35, 25 DTE), priced at iv_mult x the pre-print RV20:
      pass the live put's quoted IV divided by the stock's pre-print RV20.
  python3 -I trading-experiment/research/strategy-review/scripts/sizing.py csv <file> <column> --equity 1917.92
      any saved per-trade payoff column (a value of 1.0 means the premium came back exactly).
"""
import argparse
import csv
import math
import sys

import numpy as np


def kelly(payoffs, step=0.0025):
    """Kelly fraction of equity to stake on a bet whose per-$ payoff multiples are `payoffs` (each >= 0)."""
    r = np.asarray([x for x in payoffs if x == x], dtype=float)
    if len(r) == 0 or r.mean() <= 1.0:
        return 0.0
    best_f, best_g = 0.0, 0.0
    for f in np.arange(step, 1.0, step):
        g = float(np.mean(np.log1p(f * (r - 1.0))))
        if g > best_g:
            best_f, best_g = float(f), g
    return best_f


def report(payoffs, equity, label):
    r = np.asarray([x for x in payoffs if x == x], dtype=float)
    f = kelly(r)
    print(f"{label}: n {len(r)}, mean payoff {r.mean():.3f} per $, median {np.median(r):.3f}, lost half or more {np.mean(r <= 0.5):.0%}")
    print(f"  Kelly f* {f:.3f} of equity -> full ${f * equity:,.0f}, half ${f * equity / 2:,.0f}, quarter ${f * equity / 4:,.0f} (equity ${equity:,.2f})")
    if f == 0:
        print("  No edge to size: the mean payoff is at or below 1.")
    return f


def c1_payoffs(cache, iv_mult):
    sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
    sys.path.insert(0, '/home/user/temp/trading-experiment/research/2026-10-30/scripts')
    from earnings_analysis import option_ratio  # the review's own put model
    from c1_vix_split import build_rows          # the review's per-event rows (reproduces n 216)
    from pathlib import Path
    rows = [r for r in build_rows(Path(cache)) if r['gap'] <= -0.08]
    ok = [r for r in rows if not any(math.isnan(r.get(k, float('nan'))) for k in ('ret5', 'cal5', 'rv_pre'))]
    ret = np.array([r['ret5'] for r in ok])
    cal = np.array([r['cal5'] for r in ok])
    rv = np.array([r['rv_pre'] for r in ok])
    call = np.zeros(len(ok), dtype=bool)
    return option_ratio(ret, cal, 25, 0.35, iv_mult * rv, iv_mult * rv, call)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    c = sub.add_parser('c1'); c.add_argument('cache'); c.add_argument('--equity', type=float, required=True)
    c.add_argument('--iv-mult', type=float, default=1.3)
    v = sub.add_parser('csv'); v.add_argument('file'); v.add_argument('column'); v.add_argument('--equity', type=float, required=True)
    a = ap.parse_args()
    if a.cmd == 'c1':
        report(c1_payoffs(a.cache, a.iv_mult), a.equity, f"C1 down-gap put at {a.iv_mult:.2f}x pre-print RV20")
    else:
        with open(a.file) as fh:
            vals = [float(row[a.column]) for row in csv.DictReader(fh) if row.get(a.column) not in (None, '', 'nan')]
        report(vals, a.equity, f"{a.file}:{a.column}")


if __name__ == '__main__':
    main()
