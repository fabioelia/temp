#!/usr/bin/env python3
"""options-vol 2026-11-10 wrapper: runs the committed research/2026-11-09/scripts/ov_1109.py q1 UNCHANGED, with only its
two constants refreshed (equity $1,379.57 and the SGOV reserve 2.636818 x 100.53 = $265.08, brief 11/10 + quotes.py closes),
then repeats its CSCO one-contract block with RV20 rolled one more day (11/10 official close 98.15, quotes.py closes,
yahoo+cboe), same formulas (ddof 1, sqrt 252, BS put r 4%, q 0, ask = BS x 1.025, 2.50 grid, 35 DTE to 12/18).

  python3 -I run_1110.py <earnings_cache> <vix_csv> <csco_json_to_1106> <csco_json_to_1109>
"""
import importlib.util
import json
import math
import sys
from datetime import date, datetime, timezone
from pathlib import Path

import numpy as np

R = Path('/home/user/temp/trading-experiment')
spec = importlib.util.spec_from_file_location('ov_1109', R / 'research/2026-11-09/scripts/ov_1109.py')
ov = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ov)
ov.EQ = 1379.57
ov.RESERVE = round(2.636818 * 100.53, 2)
CSCO_1110 = 98.15

cache, vix_csv, j1106, j1109 = sys.argv[1:5]
ov.q1(cache, vix_csv, j1106)

sizing = ov.load(R / 'research/strategy-review/scripts/sizing.py', 'sizing')
cw = ov.load(R / 'research/2026-11-01/scripts/catalyst_watch.py', 'catalyst_watch')
ovg = ov.load(R / 'research/2026-10-29/scripts/options_vol_gate.py', 'options_vol_gate')
pay = cw.Payoffs(sizing, cache)

res = json.load(open(j1109))['chart']['result'][0]
ts = [datetime.fromtimestamp(t, tz=timezone.utc).date() for t in res['timestamp']]
adj = res['indicators']['adjclose'][0]['adjclose']
px = [(d, a) for d, a in zip(ts, adj) if a is not None]
assert px[-1][0] == date(2026, 11, 9) and abs(px[-1][1] - 98.65) < 0.01, px[-1]
c = np.array([a for _, a in px] + [CSCO_1110])
lr = np.diff(np.log(c))
rv = np.std(lr[-20:], ddof=1) * math.sqrt(252)
rv_prev = np.std(lr[-21:-1], ddof=1) * math.sqrt(252)
drop = lr[-20]  # the day that leaves the window on 11/11 (next roll)
print(f'\n=== 11/10 roll: CSCO RV20 to 11/09 {rv_prev:.2%}; with 11/10 close {CSCO_1110} ({CSCO_1110 / c[-2] - 1:+.2%}): {rv:.2%}; '
      f'1.3x gate {1.3 * rv:.1%}; oldest return in window {math.exp(drop) - 1:+.2%}')
for g in (0.92, 0.89, 0.86):
    s = round(g * CSCO_1110, 2)
    T = 35 / 365
    out = []
    for k in (0.8, 0.85, 0.9, 1.0, 1.1, 1.2):
        iv = k * rv
        cap = min(sizing.kelly(pay(k, dte=35)) * ov.EQ, ov.RESERVE) / 100
        band = []
        for K in np.arange(60, 110.01, 2.5):
            p, dl = ovg.bs_put(s, K, T, iv, 0.04)
            if 0.30 <= -dl <= 0.45:
                band.append((p * 1.025, K, dl))
        a, K, dl = min(band)
        out.append(f'k {k:.2f} (IV {iv:.1%}): {K:.1f}P d {dl:.2f} ask {a:.2f} vs {cap:.2f} {"FITS" if a <= cap else "no"}')
    print(f'  gap {g - 1:+.0%} (spot {s:.2f}): ' + ' | '.join(out))
# max k at which the cheapest in-band 12/18 put fits, -8% gap
s = round(0.92 * CSCO_1110, 2)
for k in np.arange(0.70, 1.3001, 0.01):
    iv = k * rv
    cap = min(sizing.kelly(pay(k, dte=35)) * ov.EQ, ov.RESERVE) / 100
    band = [(ovg.bs_put(s, K, 35 / 365, iv, 0.04)[0] * 1.025, K) for K in np.arange(60, 110.01, 2.5)
            if 0.30 <= -ovg.bs_put(s, K, 35 / 365, iv, 0.04)[1] <= 0.45]
    a, K = min(band)
    if a > cap:
        print(f'  -8% gap (spot {s}): cheapest in-band put first fails at k {k:.2f} (IV {iv:.1%}): {K:.1f}P ask {a:.2f} vs {cap:.2f}')
        break
