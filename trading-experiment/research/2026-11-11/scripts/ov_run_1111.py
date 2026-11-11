#!/usr/bin/env python3
"""options-vol 2026-11-11 wrapper: runs the committed research/2026-11-09/scripts/ov_1109.py q1 UNCHANGED, with only its two
constants refreshed (equity $1,393.59, brief 11/11; SGOV reserve 2.636818 x 100.52 = $265.05, quotes.py closes 11/11), then
repeats the ov_run_1110.py CSCO block with RV20 through the 11/11 official close 100.76 (quotes.py closes, yahoo+cboe) and a
flat roll to 11/12 (0% return), same formulas (ddof 1, sqrt 252, adjusted closes; BS put r 4%, q 0, ask = BS x 1.025, 2.50 grid,
35 DTE to 12/18). Added tonight (fixed before looking at the fit output):
  * tonight's 12/18 put row (Cboe delayed closing quotes) with spread % of mid, IV and k = IV / RV20;
  * options_vol_gate.ex_event on tonight's chain (react day 11/13), x1.04 / x1.21 post-gap guesses (catalyst_watch calibrations);
  * a post-gap spot scan 80.00-95.00: the IV range (0.1% steps, 25-65%) where the cheapest in-band put fits one contract;
  * 11/12 sensitivity of RV20 (+/-2%, +/-4% days).

  python3 -I run_1111.py <earnings_cache> <vix_csv> <csco_json_to_1106> <csco_json_to_1111> <cboe_chain_json>
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
ov.EQ = 1393.59
ov.RESERVE = round(2.636818 * 100.52, 2)
CSCO_1111 = 100.76

cache, vix_csv, j1106, j1111, chain = sys.argv[1:6]
ov.q1(cache, vix_csv, j1106)

sizing = ov.load(R / 'research/strategy-review/scripts/sizing.py', 'sizing')
cw = ov.load(R / 'research/2026-11-01/scripts/catalyst_watch.py', 'catalyst_watch')
ovg = ov.load(R / 'research/2026-10-29/scripts/options_vol_gate.py', 'options_vol_gate')
pay = cw.Payoffs(sizing, cache)

res = json.load(open(j1111))['chart']['result'][0]
ts = [datetime.fromtimestamp(t, tz=timezone.utc).date() for t in res['timestamp']]
adj = res['indicators']['adjclose'][0]['adjclose']
px = [(d, a) for d, a in zip(ts, adj) if a is not None]
assert px[-1][0] == date(2026, 11, 11) and abs(px[-1][1] - CSCO_1111) < 0.01, px[-1]
c = np.array([a for _, a in px])
lr = np.diff(np.log(c))
rv = np.std(lr[-20:], ddof=1) * math.sqrt(252)
rv_prev = np.std(lr[-21:-1], ddof=1) * math.sqrt(252)
flat = np.std(np.append(lr[-19:], 0.0), ddof=1) * math.sqrt(252)
print(f'\n=== 11/11 roll: RV20 to 11/10 {rv_prev:.2%}; with 11/11 close {CSCO_1111} ({math.exp(lr[-1]) - 1:+.2%}): {rv:.2%}; '
      f'flat roll to 11/12 {flat:.2%}; 1.3x gate {1.3 * flat:.1%}; return leaving on 11/12 {math.exp(lr[-20]) - 1:+.2%}')
print('  11/12 sensitivity: ' + '; '.join(
    f'{m:+.0%} -> {np.std(np.append(lr[-19:], math.log(1 + m)), ddof=1) * math.sqrt(252):.2%}' for m in (-0.04, -0.02, 0.02, 0.04)))

# tonight's chain
ts_c, meta, rows = ovg.load_chain(chain)
print(f'\nCboe chain {ts_c}; close {meta.get("close")}; iv30 {meta.get("iv30")}')
e1218 = date(2026, 12, 18)
for x in sorted((x for x in rows if x['exp'] == e1218 and x['cp'] == 'P' and 75 <= x['K'] <= 105), key=lambda x: x['K']):
    mid = (x['bid'] + x['ask']) / 2
    sp = (x['ask'] - x['bid']) / mid if mid else float('nan')
    band = '  <- band' if 0.30 <= -x['delta'] <= 0.45 else ''
    print(f'  {x["sym"]} {x["bid"]:.2f}/{x["ask"]:.2f} spread {sp:5.1%} IV {x["iv"]:.1%} (k {x["iv"] / rv:.2f} now, '
          f'{x["iv"] / flat:.2f} flat) d {x["delta"]:.2f} OI {x["oi"]}{band}')
oi = {}
for x in rows:
    if x['cp'] == 'P' and date(2026, 11, 27) <= x['exp'] <= date(2026, 12, 18):
        oi[x['exp']] = max(oi.get(x['exp'], 0), x['oi'])
print('  max put OI by expiry (C1 band 14-35 DTE from 11/13): ' + ', '.join(f'{e:%m/%d} {v}' for e, v in sorted(oi.items())))
base, ev_sd, pts = ovg.ex_event(rows, date(2026, 11, 11), date(2026, 11, 13), CSCO_1111)
print(f'  ex-event IV {base:.1%}; event-day sd {ev_sd:.1%}; post-gap guess x1.04 {1.04 * base:.1%} (k {1.04 * base / flat:.2f} flat), '
      f'x1.21 {1.21 * base:.1%} (k {1.21 * base / flat:.2f}); term ' + ', '.join(f'{t}d {v:.1%}' for t, v in pts))

# fit scan
T = 35 / 365
ivs = np.round(np.arange(0.250, 0.6501, 0.001), 3)
cap = {iv: min(sizing.kelly(pay(iv / flat, dte=35)) * ov.EQ, ov.RESERVE) / 100 for iv in ivs}


def cheapest(S, iv):
    band = []
    for K in np.arange(60, 110.01, 2.5):
        p, dl = ovg.bs_put(S, K, T, iv, 0.04)
        if 0.30 <= -dl <= 0.45:
            band.append((p * 1.025, K, dl))
    return min(band) if band else None


print(f'\nFit scan (RV20 flat {flat:.2%}; ceiling = min(full Kelly 35 DTE at k = IV / flat, reserve ${ov.RESERVE}) / 100):')
for S in np.arange(80.0, 95.01, 0.5):
    fits = []
    for iv in ivs:
        b = cheapest(S, iv)
        if b and b[0] <= cap[iv]:
            fits.append((iv, b))
    if not fits:
        print(f'  S {S:6.2f} ({S / CSCO_1111 - 1:+.1%} vs 11/11): no IV in 25-65% fits')
        continue
    wins, cur = [], [fits[0]]
    for f in fits[1:]:
        if round(f[0] - cur[-1][0], 3) <= 0.001:
            cur.append(f)
        else:
            wins.append(cur)
            cur = [f]
    wins.append(cur)
    txt = ' + '.join(f'IV {w[0][0]:.1%}-{w[-1][0]:.1%} (k {w[0][0] / flat:.2f}-{w[-1][0] / flat:.2f}; '
                     f'{w[-1][1][1]:.1f}P ask {w[-1][1][0]:.2f} d {w[-1][1][2]:.2f} at the top)' for w in wins)
    print(f'  S {S:6.2f} ({S / CSCO_1111 - 1:+.1%} vs 11/11): {txt}')
