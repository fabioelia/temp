"""11/11 extras (copy of extra_1110.py; one session left, 11/12) for CSCO 12/18: fit with the SGOV cap ($265) and the RV20 gate's sensitivity to the 1 session left (11/12)."""
import importlib.util, json, sys
from datetime import date
from pathlib import Path
import numpy as np
T0 = Path('/home/user/temp/trading-experiment')
def load(p, n):
    s = importlib.util.spec_from_file_location(n, p); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
cw = load(T0 / 'research/2026-11-01/scripts/catalyst_watch.py', 'cw')
ovg = load(T0 / 'research/2026-10-29/scripts/options_vol_gate.py', 'ovg')
sizing = load(T0 / 'research/strategy-review/scripts/sizing.py', 'sizing')
d, cache = Path(sys.argv[1]), Path(sys.argv[2])
pay = cw.Payoffs(sizing, cache)
EQ, SGOV, TODAY = 1393.59, 2.636818 * 100.52, date(2026, 11, 11)
a = cw.yahoo(d / 'y_CSCO.json', 'adj'); c = cw.yahoo(d / 'y_CSCO.json', 'close')
ds = sorted(x for x in a if x <= TODAY)[-21:]
lr = np.diff(np.log([a[x] for x in ds]))
print('last 5 CSCO closes:', [(str(x), round(c[x], 2)) for x in ds[-5:]])
for lab, add in (('flat', [0]), ('+1%', [.01]), ('-1%', [-.01]), ('+3%', [.03]), ('-3%', [-.03])):
    rv = cw.rv(np.concatenate([lr[1:], np.log(1 + np.array(add))]))
    print(f'RV20 to 11/12 with {lab} days: {rv:.2%} -> cap {1.3 * rv:.1%}')
irx = cw.yahoo(d / 'y_%5EIRX.json', 'close'); r = irx[max(x for x in irx if x <= TODAY)] / 100
raw = json.loads((d / 'CSCO_chain_std.json').read_text()); ts, meta, rows = ovg.load_chain(d / 'CSCO_chain_std.json')
exp, react = date(2026, 12, 18), date(2026, 11, 13); dte = (exp - react).days; T = dte / 365
strikes = sorted({x['K'] for x in rows if x['exp'] == exp and x['cp'] == 'P'})
oi = {x['K']: x['oi'] for x in rows if x['exp'] == exp and x['cp'] == 'P'}
rv_flat = cw.rv(np.concatenate([lr[1:], np.zeros(1)]))
S0 = c[TODAY]
for g in (0.92, 0.90, 0.88, 0.85):
    S, best = g * S0, None
    for iv in np.arange(0.10, 1.3 * rv_flat + 1e-9, 0.0025):
        f = min(sizing.kelly(pay(iv / rv_flat, dte=dte)) * EQ, SGOV)
        for K in strikes:
            px, dl = ovg.bs_put(S, K, T, iv, r)
            if 0.30 <= -dl <= 0.45 and f >= 102.5 * px:
                best = (iv, K, px * 1.025, f, oi.get(K, 0)); break
    print(f'fit (cap min(full Kelly, SGOV ${SGOV:.0f})) S {S:.2f} ({g - 1:+.0%}): ' + (
        f'IV <= {best[0]:.1%} ({best[0] / rv_flat:.2f}x), {best[1]:g}P ask~{best[2]:.2f}, budget ${best[3]:,.0f}, OI {best[4]}' if best else 'none'))
