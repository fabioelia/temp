#!/usr/bin/env python3
"""Contrarian persona, 2026-11-01: does buying calls (against the crowd) or puts (with it) pay after the Nasdaq-100's first
close 8% below its high?

PRE-REGISTERED before any result was computed (written 2026-11-01, before the first run; not changed after it):
  Event   ^NDX closes >= 8% below its trailing 252-session closing high, and it is the first such close since ^NDX last closed
          within 2% of that high (one event per correction episode). Today's analog: 10/30, -9.1% from the 10/6 high.
  Entry   the close of the NEXT session (t+1, the Mon 11/2 analog; we cannot trade the event-day close any more).
  Hold    10 sessions (Mon 11/2 -> Mon 11/16, before NVDA's 11/17 print and the 11/18 window end); 5 sessions reported too.
  Options 28 DTE, |delta| 0.40, Black-Scholes r = q = 0 (the review's own earnings_analysis.option_ratio, half a 3% spread each way).
          Model A (1985-2026): IV = m x RV20 at entry, held constant to exit (as C1 is sized). m = today's QQQ 0.40-delta IV / RV20
                   from contrarian_skew.py: calls 1.01, puts 1.14.
          Model B (2001-2026): IV = k x ^VXN, re-priced at the exit day's ^VXN (captures the vol crush or spike).
                   k = today's QQQ 0.40-delta IV / ^VXN 28.50: calls 0.232/0.285 = 0.81, puts 0.260/0.285 = 0.91.
          Exits: (i) hold to the time exit; (ii) the brief's non-C1 rule for 1 contract, on daily closes: sell at +50%, sell at -50%,
                 else at the time exit (closes only, so intraday target hits are missed: a conservative bias for (ii)).
  Report  forward ^NDX return (and vs the all-days mean), P(up), EV per $ with an episode bootstrap CI, splits 1985-2009 and
          2010-2026, and Kelly f* via research/strategy-review/scripts/sizing.py's kelly() on the per-event payoffs.
  Verdict an edge counts only if EV/$ > 1 in both models and both splits, with the bootstrap CI's lower end above 0.95.

Run (from /home/user/temp; contrarian_fetch.py first):
  python3 -I trading-experiment/research/2026-11-01/scripts/contrarian_drawdown.py
It writes the per-event rows to the scratchpad (contrarian1101/drawdown_events.csv).
"""
import csv
import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
from earnings_analysis import bs, strike_for_delta, HALF_SPREAD  # noqa: E402
from sizing import kelly  # noqa: E402

D = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/contrarian1101'
DTE, DELTA = 28, 0.40
M_CALL, M_PUT = 1.01, 1.14          # model A multipliers (IV / RV20), from contrarian_skew.py on the 10/30 QQQ chain
K_CALL, K_PUT = 0.81, 0.91          # model B multipliers (IV / ^VXN)
EQUITY = 1917.92


def bars(sym):
    rows = json.load(open(os.path.join(D, 'data', f'bars_{sym}.json')))['rows']
    return [r[0] for r in rows], np.array([r[4] for r in rows], float)


def events(dates, c):
    out, armed = [], True
    for i in range(252, len(c)):
        hi = c[i - 251:i + 1].max()
        if c[i] >= 0.98 * hi:
            armed = True
        if armed and c[i] <= 0.92 * hi:
            out.append(i)
            armed = False
    return out


def rv20(c, i):
    lr = np.diff(np.log(c[i - 20:i + 1]))
    return lr.std(ddof=1) * math.sqrt(252)


def cal_days(d0, d1):
    from datetime import date
    return (date.fromisoformat(d1) - date.fromisoformat(d0)).days


def price_path(S0, path_S, path_days, iv0, path_iv, call):
    """Per-$ value along the path (sell side, after half spread) for a 28 DTE |0.40| delta option bought at S0 with iv0."""
    T0 = DTE / 365.0
    K = float(strike_for_delta(DELTA, T0, iv0, call)) * S0
    p0 = float(bs(S0, K, T0, iv0, call)) * (1 + HALF_SPREAD)
    vals = [float(bs(s, K, (DTE - dd) / 365.0, v, call)) * (1 - HALF_SPREAD) / p0 for s, dd, v in zip(path_S, path_days, path_iv)]
    return vals


def exit_rule(vals):
    for v in vals:
        if v >= 1.5 or v <= 0.5:
            return v
    return vals[-1]


def boot(x, reps=4000, seed=11):
    x = np.asarray(x, float)
    rng = np.random.default_rng(seed)
    m = x[rng.integers(0, len(x), size=(reps, len(x)))].mean(1)
    return np.percentile(m, 2.5), np.percentile(m, 97.5)


def main():
    dates, c = bars('NDX')
    vd, vc = bars('VXN')
    vxn = dict(zip(vd, vc))
    ev = events(dates, c)
    rows = []
    for i in ev:
        e = i + 1
        for h in (5, 10):
            if e + h >= len(c):
                continue
            path = list(range(e + 1, e + h + 1))
            S0, pS = c[e], [c[j] for j in path]
            days = [cal_days(dates[e], dates[j]) for j in path]
            r20 = rv20(c, e)
            row = {'event': dates[i], 'entry': dates[e], 'h': h, 'dd_event': c[i] / c[i - 251:i + 1].max() - 1,
                   'ret': c[e + h] / S0 - 1, 'rv20': r20}
            for typ, call, m, k in (('call', True, M_CALL, K_CALL), ('put', False, M_PUT, K_PUT)):
                a = price_path(S0, pS, days, m * r20, [m * r20] * h, call)
                row[f'A_{typ}_hold'], row[f'A_{typ}_rule'] = a[-1], exit_rule(a)
                if dates[e] in vxn and all(dates[j] in vxn for j in path):
                    b = price_path(S0, pS, days, k * vxn[dates[e]] / 100, [k * vxn[dates[j]] / 100 for j in path], call)
                    row[f'B_{typ}_hold'], row[f'B_{typ}_rule'] = b[-1], exit_rule(b)
            rows.append(row)
    keys = sorted({k for r in rows for k in r})
    with open(os.path.join(D, 'drawdown_events.csv'), 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)

    # all-days baseline for the forward return
    for h in (5, 10):
        base = np.array([c[j + h] / c[j] - 1 for j in range(252, len(c) - h)])
        base10 = np.array([c[j + h] / c[j] - 1 for j in range(len(c) - h) if dates[j] >= '2010-01-01'])
        print(f'All days {h}d ^NDX: mean {base.mean():+.2%}, P(up) {np.mean(base > 0):.0%}; since 2010 mean {base10.mean():+.2%}, '
              f'P(up) {np.mean(base10 > 0):.0%}')
    print(f'Events (first -8% close per episode, 1986-2026): {len(ev)}; latest {dates[ev[-1]]} (dd {c[ev[-1]] / c[ev[-1] - 251:ev[-1] + 1].max() - 1:+.1%})')
    for h in (10, 5):
        for lab, lo, hi in (('all', '0000', '9999'), ('1986-2009', '0000', '2010-01-01'), ('2010-2026', '2010-01-01', '9999')):
            sub = [r for r in rows if r['h'] == h and lo <= r['entry'] < hi]
            if not sub:
                continue
            ret = np.array([r['ret'] for r in sub])
            line = f'h {h:2d} {lab:9} n {len(sub):2d} | ^NDX ret mean {ret.mean():+.2%} med {np.median(ret):+.2%} P(up) {np.mean(ret > 0):.0%}'
            print(line)
            for col in ('A_call_hold', 'A_call_rule', 'A_put_hold', 'A_put_rule', 'B_call_hold', 'B_call_rule', 'B_put_hold', 'B_put_rule'):
                x = np.array([r[col] for r in sub if col in r])
                if len(x) < 5:
                    continue
                lo95, hi95 = boot(x)
                f = kelly(x)
                print(f'      {col:12} n {len(x):2d} EV/$ {x.mean():.3f} [{lo95:.2f}, {hi95:.2f}] med {np.median(x):.2f} '
                      f'hit {np.mean(x > 1):.0%} | Kelly f* {f:.3f} -> full ${f * EQUITY:,.0f} half ${f * EQUITY / 2:,.0f} quarter ${f * EQUITY / 4:,.0f}')
    print('\nLast 12 events (h 10):')
    for r in [r for r in rows if r['h'] == 10][-12:]:
        print(f"  {r['event']} entry {r['entry']} dd {r['dd_event']:+.1%} ret10 {r['ret']:+.2%} A call {r['A_call_hold']:.2f} "
              f"A put {r['A_put_hold']:.2f} B call {r.get('B_call_hold', float('nan')):.2f} B put {r.get('B_put_hold', float('nan')):.2f}")


if __name__ == '__main__':
    main()
