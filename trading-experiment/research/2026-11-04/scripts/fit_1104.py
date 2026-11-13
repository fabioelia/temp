"""catalyst 11/04: per OI-qualified 11/20 strike (OI >= 1000 tonight), the highest quoted IV at which full Kelly (15 DTE, RV20 to 11/04)
covers 1 contract at ask = model mid x 1.025 (a 5% spread), with the model delta inside 0.30-0.45. Run: python3 -I <this> <cat1104 dir> <cache>"""
import sys, importlib.util
from pathlib import Path
import numpy as np
W, cache = Path(sys.argv[1]), Path(sys.argv[2])
spec = importlib.util.spec_from_file_location('c', W / 'catalyst_1104.py'); c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
cw, ovg, sizing = c.load(c.CW_PATH, 'cw'), c.load(c.OVG_PATH, 'ovg'), c.load(c.SIZING_PATH, 'sizing')
pay = cw.Payoffs(sizing, cache)
a = cw.yahoo(W / 'data/y_QCOM.json', 'adj'); ds = sorted(d for d in a if d <= c.TODAY)[-21:]
rv20 = cw.rv(np.diff(np.log([a[d] for d in ds]))); r = 0.0403; T = 15 / 365
fk = {round(iv, 4): sizing.kelly(pay(iv / rv20, dte=15)) * c.EQUITY for iv in np.arange(0.36, 0.7201, 0.0025)}
for S in (159.33, 159.04, 158.0, 157.0, 155.0, 152.0, 150.0, 147.0, 145.0):
    out = []
    for K in (145.0, 150.0, 155.0, 160.0):
        best = None
        for iv, f in fk.items():
            px, d = ovg.bs_put(S, K, T, iv, r)
            if 0.30 <= -d <= 0.45 and f >= 102.5 * px:
                best = (iv, px * 1.025, d)
        out.append(f'{K:g}P ' + (f'IV<={best[0]:.1%} ({best[0] / rv20:.2f}x) ask~{best[1]:.2f} d{best[2]:+.2f}' if best else '-'))
    print(f'S {S:.2f}: ' + '; '.join(out))
