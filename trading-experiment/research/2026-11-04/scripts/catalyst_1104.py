"""catalyst, 2026-11-04 (Wed night): QCOM C1 check for Thu 11/5 14:43, after tonight's print. Rerun of
scratchpad cat1103/catalyst_1103.py (itself a rerun of research/2026-11-02/scripts/catalyst_1102.py) with: TODAY = 11/04, the 11/04 close
in the RV20 window (no flat sessions), equity $1,907.87, the Robinhood after-hours print 159.04 (brief, 17:15 ET) as the post-print spot,
11/20 only (15 DTE at entry; the 11/27 and 12/04 strikes failed OI last night).

Run (from /home/user/temp):  python3 -I <this> <data_dir> <earnings_cache>
"""
import importlib.util
import json
import math
import sys
from datetime import date
from pathlib import Path
from statistics import NormalDist

import numpy as np

TOOLKIT = Path('/home/user/temp/trading-experiment')
CW_PATH = TOOLKIT / 'research/2026-11-01/scripts/catalyst_watch.py'
OVG_PATH = TOOLKIT / 'research/2026-10-29/scripts/options_vol_gate.py'
SIZING_PATH = TOOLKIT / 'research/strategy-review/scripts/sizing.py'
TODAY, REACT, EXP = date(2026, 11, 4), date(2026, 11, 5), date(2026, 11, 20)
EQUITY = 1907.87
GATE_X = 1.3
MILD, SHOCK = 1.04, 1.21
S_AH = 159.04          # Robinhood after-hours, 17:15 ET (brief)
LINE = 159.33          # 0.92 x 173.19 (brief)
N = NormalDist()


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def band(ovg, strikes, S, T, iv, r):
    out = []
    for K in strikes:
        px, d = ovg.bs_put(S, K, T, iv, r)
        if 0.30 <= -d <= 0.45:
            out.append((K, px, d))
    return out


def main():
    data_dir, cache = Path(sys.argv[1]), Path(sys.argv[2])
    cw = load(CW_PATH, 'catalyst_watch')
    ovg = load(OVG_PATH, 'options_vol_gate')
    sizing = load(SIZING_PATH, 'sizing')
    pay = cw.Payoffs(sizing, cache)
    irx = cw.yahoo(data_dir / 'y_%5EIRX.json', 'close')
    dr = max(d for d in irx if d <= TODAY)
    r = irx[dr] / 100
    print(f'r = ^IRX {dr} close / 100 = {r:.4f} (Yahoo); equity ${EQUITY:,.2f}')

    a = cw.yahoo(data_dir / 'y_QCOM.json', 'adj')
    c = cw.yahoo(data_dir / 'y_QCOM.json', 'close')
    assert max(c) == TODAY, f'Yahoo QCOM last bar is {max(c)}, not {TODAY}'
    ds = sorted(d for d in a if d <= TODAY)[-21:]
    lr = np.diff(np.log([a[d] for d in ds]))
    rv20 = cw.rv(lr)
    ds_prev = sorted(d for d in a if d <= date(2026, 11, 3))[-21:]
    rv_prev = cw.rv(np.diff(np.log([a[d] for d in ds_prev])))
    big = sorted(zip(ds[1:], lr), key=lambda x: abs(x[1]))[-3:]
    S0 = c[TODAY]
    print(f'QCOM close {TODAY} {S0:.2f} (Yahoo), prior {ds[-2]} {c[ds[-2]]:.2f} ({S0 / c[ds[-2]] - 1:+.2%}); '
          f'RV20 {ds[0]}..{ds[-1]} = {rv20:.2%} (to 11/03: {rv_prev:.2%}); IV cap 1.3x = {GATE_X * rv20:.2%}; '
          f'largest days ' + ', '.join(f'{d} {x:+.1%}' for d, x in big))
    print(f'C1 line 0.92 x {S0:.2f} = {0.92 * S0:.2f}; after-hours {S_AH} = {S_AH / S0 - 1:+.2%}')
    print('IV at each multiple: ' + ', '.join(f'{k:.2f}x {k * rv20:.1%}' for k in (0.8, 0.9, 1.0, 1.1, 1.15, 1.2, 1.25, 1.3)))

    ts, meta, rows = ovg.load_chain(data_dir / 'QCOM_chain.json')
    print(f'\nCboe chain timestamp {ts} UTC; close {meta.get("close")}, current_price {meta.get("current_price")}, '
          f'last_trade_time {meta.get("last_trade_time")}, iv30 {meta.get("iv30")}')
    puts = sorted((x for x in rows if x['exp'] == EXP and x['cp'] == 'P' and 135 <= x['K'] <= 170), key=lambda x: x['K'])
    print(f'{EXP} puts (closing quotes, pre-print):')
    for x in puts:
        mid = (x['bid'] + x['ask']) / 2
        spr = (x['ask'] - x['bid']) / mid if mid > 0 else float('nan')
        print(f'  {x["sym"]} {x["bid"]:.2f}/{x["ask"]:.2f} ({spr:.1%}) IV {x["iv"]:.1%} d {x["delta"]:+.2f} OI {x["oi"]} vol {x["vol"]}')
    ex, E, pts = ovg.ex_event(rows, TODAY, REACT, meta['close'], tmin=0)
    sd_day = math.sqrt(E ** 2 + ex ** 2 / 252)
    print(f'ex-event IV {ex:.1%}, event sd {E:.1%}, expected |move| {0.798 * E:.1%}; P(<= -8%) {N.cdf(math.log(0.92) / sd_day):.1%}; '
          f'term pts ' + ', '.join(f'{t}d {v:.1%}' for t, v in pts[:5]))
    iv_m, iv_s = ex * MILD, ex * SHOCK
    print(f'expected post-gap put IV {iv_m:.1%} (x1.04) to {iv_s:.1%} (x1.21) -> k {iv_m / rv20:.2f} to {iv_s / rv20:.2f} vs cap 1.30')

    dte = (EXP - REACT).days
    T = dte / 365
    oi = {x['K']: x['oi'] for x in rows if x['exp'] == EXP and x['cp'] == 'P'}
    q = {x['K']: x for x in rows if x['exp'] == EXP and x['cp'] == 'P'}
    strikes = sorted(K for K in oi if 0.70 * S_AH <= K <= S_AH * 1.02)

    print(f'\n== {EXP} ({dte} DTE at entry): C1 Kelly (catalyst_watch.Payoffs = sizing.c1_payoffs at dte {dte}) ==')
    for k in (1.0, 1.15, 1.25, 1.30, iv_m / rv20, iv_s / rv20):
        rr = pay(k, dte=dte)
        f = sizing.kelly(rr)
        print(f'  k {k:.2f} (IV {k * rv20:.1%}): EV {rr.mean():.3f}, f* {f:.3f} -> full ${f * EQUITY:,.0f}, half ${f * EQUITY / 2:,.0f}, '
              f'quarter ${f * EQUITY / 4:,.0f}' + (f'; boot P(f*=0) {cw.boot_p0(sizing, rr):.0%}' if f > 0 else ''))

    print(f'\n== 14:43 lookup (RV20 {rv20:.1%}): quoted IV -> k -> full Kelly -> ask ceiling; model band put at the after-hours spot ==')
    for iv in (0.40, 0.42, 0.44, 0.46, 0.48, 0.50, 0.52, 0.55, 0.58, 0.60, 0.64, GATE_X * rv20):
        k = iv / rv20
        rr = pay(k, dte=dte)
        fk = sizing.kelly(rr) * EQUITY
        cheapest = []
        for S in (LINE, S_AH, 155.0, 150.0):
            b = band(ovg, strikes, S, T, iv, r)
            if b:
                K, px, d = b[0]
                cheapest.append(f'S {S:.2f}: {K:g}P {px:.2f} d {d:+.2f} OI {oi[K]} -> {"FITS" if fk >= 100 * px else "no"}')
        print(f'  IV {iv:.1%}: k {k:.2f}, EV {rr.mean():.3f}, full ${fk:,.0f}, half ${fk / 2:,.0f} -> ask <= {fk / 100:.2f}'
              + ('  (above the 1.3x cap)' if k > GATE_X + 1e-9 else '') + '\n      ' + '; '.join(cheapest))

    print(f'\n== where the band sits at S {S_AH} (model deltas), with tonight\'s OI and closing spread ==')
    for iv in (0.45, 0.50, 0.55, 0.60, 0.65):
        b = band(ovg, strikes, S_AH, T, iv, r)
        print(f'  IV {iv:.0%}: ' + ', '.join(
            f'{K:g}P {px:.2f} d {d:+.2f} OI {oi[K]} spr {(q[K]["ask"] - q[K]["bid"]) / ((q[K]["ask"] + q[K]["bid"]) / 2):.1%}'
            for K, px, d in b))

    print('\n== highest IV at which full Kelly covers the cheapest band put, by spot ==')
    for S in (LINE, S_AH, 157.0, 155.0, 152.0, 150.0, 145.0):
        best = None
        for iv in np.arange(0.30, GATE_X * rv20 + 1e-9, 0.0025):
            b = band(ovg, strikes, S, T, iv, r)
            if b and sizing.kelly(pay(iv / rv20, dte=dte)) * EQUITY >= 100 * b[0][1]:
                best = (iv, b[0])
        print(f'  S {S:.2f} ({S / S0 - 1:+.1%}): ' + (f'IV <= {best[0]:.2%} ({best[0] / rv20:.2f}x), {best[1][0]:g}P ~{best[1][1]:.2f}'
                                                     if best else 'none in 30% .. cap'))


if __name__ == '__main__':
    main()
