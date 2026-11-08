#!/usr/bin/env python3
"""Rule-evolution test (2026-11-08, red-team request): does the stock-era REGIME GATE in RULES.md improve SPY buy-and-hold?

Specification fixed before the first run (the rule's own wording, RULES.md "Regime gate"): "while the S&P 500 is below its prior 10-day closing high *and*
VIX >= 20, keep invested <= 50%. Above 50% only after the S&P closes above its prior 10-day closing high with VIX falling."
  * State at close t (S&P proxied by SPY's split-adjusted close; ^VIX close): if close_t < max(close_{t-10..t-1}) and VIX_t >= 20 -> 50% invested;
    else if the state was 50%: back to 100% only when close_t > max(close_{t-10..t-1}) and VIX_t < VIX_{t-1}; otherwise unchanged. Start at 100%.
  * The weight earning the return of session d is the state at close d-2 (checked at the close, traded at the next close), as in S2.
  * Daily return = w x SPY total return + (1 - w) x the T-bill ETF leg (BIL, or ^IRX minus BIL's fee before 2007-05-31, as in core_equity.py).
    Cost: 5 bps x |change in w| per switch.
  * Verdict, same bar as S2 (claims.md): KEEP the gate only if its Sharpe is higher AND its max drawdown smaller in BOTH halves (pre-2010, 2010-2026);
    otherwise RETIRE it for the index core. Also printed: % of days at 50%, and the state at the last close (2026-11-06).
Run: python3 -I regime_gate.py <yahoo-raw dir of core_equity.py> <vix-raw dir with VIX_{1990,2000,2010,2020}.json>
"""
import math
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import core_equity as ce  # noqa: E402

raw, vraw = sys.argv[1], sys.argv[2]
sds, sclose, sadj, _ = ce.load(raw, 'SPY')
vds, vclose, _, _ = ce.load(vraw, 'VIX')
ids, iclose, _, _ = ce.load(raw, 'IRX')
bds, bclose, badj, _ = ce.load(raw, 'BIL')
vix = dict(zip(vds, vclose))
irx = dict(zip(ids, iclose))
bil = dict(zip(bds, badj))
keep = np.array([d in vix for d in sds])
ds, close, adj = sds[keep], sclose[keep], sadj[keep]
v = np.array([vix[d] for d in ds])
n = len(ds)

def irx_at(d, _keys=sorted(irx)):
    import bisect
    i = bisect.bisect_right(_keys, d) - 1
    return irx[_keys[i]]

rf = np.zeros(n)
cash = np.zeros(n)
for i in range(1, n):
    days = (ds[i] - ds[i - 1]).days
    rf[i] = irx_at(ds[i - 1]) / 100 * days / 360
    if ds[i] in bil and ds[i - 1] in bil and ds[i - 1] >= bds[0]:
        cash[i] = bil[ds[i]] / bil[ds[i - 1]] - 1
    else:
        cash[i] = rf[i] - 0.001353 * days / 365
eq = np.zeros(n)
eq[1:] = adj[1:] / adj[:-1] - 1

state = np.full(n, np.nan)
cur = 1.0
for t in range(10, n):
    hi = close[t - 10:t].max()
    if close[t] < hi and v[t] >= 20:
        cur = 0.5
    elif cur == 0.5 and close[t] > hi and v[t] < v[t - 1]:
        cur = 1.0
    state[t] = cur
w = np.full(n, np.nan)
w[2:] = state[:-2]
start = int(np.argmax(~np.isnan(w)))
ds, eq, cash, rf, w = ds[start:], eq[start:], cash[start:], rf[start:], w[start:]
sw = np.zeros(len(w))
sw[1:] = np.abs(w[1:] - w[:-1])
gate = w * eq + (1 - w) * cash - 0.0005 * sw
bh = eq.copy()

SPLIT = ce.SPLIT
res = {}
for name, mask in (('full', np.ones(len(ds), bool)), ('pre-2010', ds <= SPLIT), ('2010-2026', ds > SPLIT)):
    mb = ce.metrics(ds[mask], bh[mask], rf[mask])
    mg = ce.metrics(ds[mask], gate[mask], rf[mask], inpos=(w[mask] == 1.0))
    res[name] = (mb, mg)
    print(f"{name:10s} buy-and-hold: {ce.fmt(mb)}")
    print(f"{'':10s} regime gate:  {ce.fmt(mg)}  days at 50%: {np.mean(w[mask] == 0.5) * 100:.1f}%  switches/yr {sw[mask].astype(bool).sum() / (mask.sum() / 252):.1f}")
ok = all(res[h][1]['sharpe'] > res[h][0]['sharpe'] and res[h][1]['mdd'] > res[h][0]['mdd'] for h in ('pre-2010', '2010-2026'))
print(f"sample {ds[0]} .. {ds[-1]}; state at the last close ({sds[-1]}): {'50%' if state[-1] == 0.5 else '100%'} "
      f"(SPY {sclose[-1]:.2f} vs prior 10-day high {sclose[-11:-1].max():.2f}; VIX {vclose[-1]:.2f})")
print('VERDICT:', 'KEEP the regime gate' if ok else 'RETIRE the regime gate for the index core (fails the S2 bar)')
