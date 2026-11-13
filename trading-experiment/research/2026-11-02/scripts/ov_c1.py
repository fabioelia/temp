#!/usr/bin/env python3
"""options-vol, 2026-11-02 (Run B): the C1 watch for this week's remaining reporters, re-run on tonight's chains.

AMD reports Tue 11/3 after the close (reaction Wed 11/4); QCOM reports Wed 11/4 after the close (reaction Thu 11/5) (brief, week ahead).
For each: RV20 to the 11/2 close (Yahoo; the reaction-day check must use the pre-print RV20 through the print day), the 1.3x IV gate,
the ex-event forward IV implied by tonight's term structure, the Black-Scholes cost of a 0.35 / 0.40-delta put after an exact -8% gap
for each expiry at least 14 calendar days after the reaction day (the chair's 11/01 ruling) up to 35, and C1 full Kelly at each IV
multiple (sizing.py's C1 model, the review's n 216 rows). It reports the highest IV multiple at which full Kelly still covers one
contract (the W44 rule), i.e. the binding IV ceiling, and tonight's OI and spread at the strikes such a put would use.
Costs are model estimates, not quotes. Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-02/scripts/ov_c1.py <data_dir> <earnings_cache>
"""
import json
import math
import os
import sys
from datetime import date
from pathlib import Path

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
sys.path.insert(0, '/home/user/temp/trading-experiment/research/2026-10-30/scripts')
import options_lib as L  # noqa: E402
import sizing as SZ  # noqa: E402
from earnings_analysis import option_ratio  # noqa: E402
from c1_vix_split import build_rows  # noqa: E402

EQ = 1917.92
REACT = {'AMD': date(2026, 11, 4), 'QCOM': date(2026, 11, 5)}
MULTS = (0.7, 0.8, 0.9, 1.0, 1.1, 1.15, 1.2, 1.25, 1.3)


def jload(d, f):
    return json.load(open(os.path.join(d, f)))


def main():
    data, cache = sys.argv[1], sys.argv[2]
    rows = [r for r in build_rows(Path(cache)) if r['gap'] <= -0.08]
    ok = [r for r in rows if not any(math.isnan(r.get(k, float('nan'))) for k in ('ret5', 'cal5', 'rv_pre'))]
    ret = np.array([r['ret5'] for r in ok]); cal = np.array([r['cal5'] for r in ok]); rvp = np.array([r['rv_pre'] for r in ok])
    callm = np.zeros(len(ok), dtype=bool)
    grid = np.round(np.arange(0.60, 1.401, 0.01), 2)
    kel = {m: SZ.kelly(option_ratio(ret, cal, 25, 0.35, m * rvp, m * rvp, callm)) * EQ for m in grid}
    print(f'C1 full Kelly $ (sizing.py model, n {len(ok)}, equity ${EQ:,.2f}): ' + ', '.join(f'{m:.2f}x ${kel[round(m, 2)]:,.0f}' for m in MULTS))
    for u, react in REACT.items():
        b = jload(data, f'yahoo_{u}.json')['bars']
        ds = sorted(b)
        c = np.array([b[d][1] for d in ds])
        s0 = float(c[-1])
        lr = np.diff(np.log(c[-21:]))
        r20 = float(np.sqrt(252 * np.mean(lr ** 2)))
        ch = jload(data, f'chain_{u}.json')
        stamp = ch['timestamp']
        opts = []
        for o in ch['data']['options']:
            s = o['option']
            if not s.startswith(u + '2'):
                continue
            opts.append({'sym': s, 'exp': date(2000 + int(s[-15:-13]), int(s[-13:-11]), int(s[-11:-9])), 'type': s[-9],
                         'k': int(s[-8:]) / 1000, 'bid': o.get('bid') or 0.0, 'ask': o.get('ask') or 0.0, 'iv': o.get('iv') or 0.0,
                         'oi': int(o.get('open_interest') or 0)})

        def atm_iv(exp):
            rr = [o for o in opts if o['exp'] == exp and o['iv'] > 0]
            k = min({o['k'] for o in rr}, key=lambda x: abs(x - s0))
            return float(np.mean([o['iv'] for o in rr if o['k'] == k]))
        exps = sorted({o['exp'] for o in opts if o['exp'] > react})
        e1 = exps[0]
        t1 = (e1 - date(2026, 11, 2)).days / 365
        v1 = atm_iv(e1)
        print(f'\n-- {u}: close {s0:.2f} (Yahoo 11/2); RV20 to 11/2 {r20:.1%}; 1.3x gate {1.3 * r20:.1%}; reaction {react}; Cboe chain stamp {stamp} UTC')
        print(f'   ATM IV {e1} (first expiry after the print) {v1:.1%}')
        s1 = s0 * 0.92
        for e2 in [e for e in exps if 14 <= (e - react).days <= 35]:
            t2 = (e2 - date(2026, 11, 2)).days / 365
            v2 = atm_iv(e2)
            fwd = math.sqrt(max(v2 ** 2 * t2 - v1 ** 2 * t1, 0) / (t2 - t1))
            T = (e2 - react).days / 365
            print(f'   {e2} ({(e2 - react).days} DTE at entry): ATM IV {v2:.1%}; ex-event forward IV {fwd:.1%} = {fwd / r20:.2f}x RV20')
            for dl in (0.35, 0.40):
                cost = {}
                for m in grid:
                    sig = m * r20
                    k = float(np.ravel(L.strike_for_delta(s1, T, sig, 0.04, 0.0, dl, 'P'))[0])
                    cost[m] = (float(np.ravel(L.bs(s1, k, T, sig, 0.04, 0.0, 'P'))[0]) * 100, k)
                covered = [m for m in grid if kel[m] >= cost[m][0]]
                mstar = max(covered) if covered else None
                kf = cost[round(1.0, 2)][1]
                near = sorted([o for o in opts if o['exp'] == e2 and o['type'] == 'P'], key=lambda o: abs(o['k'] - kf))[:3]
                liq = '; '.join(f'K {o["k"]:g} OI {o["oi"]} spr {((o["ask"] - o["bid"]) / ((o["ask"] + o["bid"]) / 2)):.0%}'
                                if o['bid'] > 0 else f'K {o["k"]:g} OI {o["oi"]} no bid' for o in near)
                print(f'      {dl:.2f}-delta put after -8% (S {s1:.2f}): ' +
                      ', '.join(f'{m:.2f}x ${cost[m][0]:,.0f}' for m in (0.8, 0.9, 1.0, 1.15, 1.3)) +
                      f' | full Kelly covers one contract up to IV {mstar:.2f}x RV20 = {mstar * r20:.1%}' if mstar else
                      f'      {dl:.2f}-delta put after -8% (S {s1:.2f}): ' + ', '.join(f'{m:.2f}x ${cost[m][0]:,.0f}' for m in (0.8, 0.9, 1.0, 1.15, 1.3)) +
                      ' | full Kelly never covers one contract (0.60-1.40x)')
                print(f'         tonight near the 1.0x strike {kf:.1f}: {liq}')


if __name__ == '__main__':
    main()
