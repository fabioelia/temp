#!/usr/bin/env python3
"""Contrarian persona, 2026-11-01: robustness of the drawdown-call result (contrarian_drawdown.py), red-team style (W44).

For each payoff column of the 10-session rows: EV/$ and Kelly f* as run, with the 3 best events dropped, at a 5% model spread
(instead of 3%: payoffs x (0.975/1.025)/(0.985/1.015)), and the share of 4,000 bootstrap resamples where Kelly f* is 0. Also the
dollar cost of one contract of the shadow QQQ calls against full Kelly.

Run (from /home/user/temp, after contrarian_drawdown.py):
  python3 -I trading-experiment/research/2026-11-01/scripts/contrarian_robust.py
"""
import csv
import sys

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
from sizing import kelly  # noqa: E402

D = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/contrarian1101'
EQUITY = 1917.92
SPREAD5 = (0.975 / 1.025) / (0.985 / 1.015)


def main():
    rows = [r for r in csv.DictReader(open(f'{D}/drawdown_events.csv')) if r['h'] == '10']
    rng = np.random.default_rng(5)
    for lab, lo in (('all', '0000'), ('2010-2026', '2010-01-01')):
        for col in ('A_call_hold', 'A_call_rule', 'B_call_hold', 'B_call_rule', 'A_put_hold', 'B_put_hold'):
            x = np.array([float(r[col]) for r in rows if r['entry'] >= lo and r.get(col) not in (None, '')])
            if len(x) < 10:
                continue
            drop3 = np.sort(x)[:-3]
            zero = np.mean([kelly(x[rng.integers(0, len(x), len(x))], step=0.005) == 0 for _ in range(4000)])
            print(f'{lab:9} {col:12} n {len(x):2d} | EV {x.mean():.3f} f* {kelly(x):.3f} | drop best 3: EV {drop3.mean():.3f} '
                  f'f* {kelly(drop3):.3f} | 5% spread: EV {(x * SPREAD5).mean():.3f} f* {kelly(x * SPREAD5):.3f} | '
                  f'bootstrap f*=0 in {zero:.0%}')
    for sym, ask in (('QQQ261130C00710000', 11.23), ('QQQ261204C00715000', 10.73)):
        print(f'{sym}: one contract costs ${ask * 100:,.0f} (Cboe ask, 10/30 close) = {ask * 100 / EQUITY:.0%} of equity')
    # Goal-budget arithmetic (a gamble, not an edge): one QQQ261130C00710000 at the 11.23 ask, held 10 sessions (model A payoffs)
    cost = 1123.0
    need = 1 + (2200 - EQUITY) / cost
    for lab, lo in (('all', '0000'), ('2010-2026', '2010-01-01')):
        x = np.array([float(r['A_call_hold']) for r in rows if r['entry'] >= lo])
        print(f'{lab:9} one-contract goal bet: P(payoff >= {need:.3f}, i.e. equity >= $2,200) {np.mean(x >= need):.0%}; '
              f'P(lose half or more) {np.mean(x <= 0.5):.0%}; mean equity after ${EQUITY - cost + cost * x.mean():,.0f}')


if __name__ == '__main__':
    main()
