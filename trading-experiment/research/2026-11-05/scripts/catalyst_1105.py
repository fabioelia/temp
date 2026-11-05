"""catalyst, 2026-11-05 (Thu night, after the AI rout): provisional C1 setup for NVDA, which prints Tue 11/17 after the close (NVIDIA
newsroom, "NVIDIA Sets Conference Call for Third-Quarter Financial Results"), so its reaction day is Wed 11/18, the window's last session.
No name in the 25-name C1 sample reports Thu 11/5 pm or Fri 11/6 am (Robinhood get_earnings_calendar 11/05-11/06, high_market_cap),
so tonight there is no live C1 check; this is the only C1 date left in the window.

Method: catalyst_1104.py / fit_1104.py (11/04, QCOM) adapted to NVDA, with:
  * RV20 = annualised stdev (ddof 1, sqrt 252) of the 20 daily log returns of Yahoo ADJUSTED closes ending 11/05, and a provisional
    'flat roll' to t-1 = 11/17 (8 more sessions at 0% return), as catalyst_watch.py did. The real gate uses the 11/17 close.
  * Contract: 12/04 puts (16 calendar days from 11/18, >= the 14-day C1 minimum; 11/27 is 9 days and fails).
  * Kelly: catalyst_watch.Payoffs (= sizing.c1_payoffs, checked inside) at dte 16, equity $1,384.84 (brief); one contract only if full
    Kelly covers its ask. Ask = Black-Scholes put x 1.025 (half of a 5% spread), r = ^IRX / 100.
  * Tonight's 12/04 band puts (Cboe delayed chain, closing quotes): IV, delta, OI, spread, and IV / RV20 now. These include the 11/17
    event, so they bound the post-gap IV from above; the ex-event IV (options_vol_gate.ex_event) x 1.04 / x 1.21 is the post-gap guess.

Run (from /home/user/temp):  python3 -I <this> <data_dir> <earnings_cache>
"""
import importlib.util
import json
import math
import sys
from datetime import date
from pathlib import Path

import numpy as np

TOOLKIT = Path('/home/user/temp/trading-experiment')
CW_PATH = TOOLKIT / 'research/2026-11-01/scripts/catalyst_watch.py'
OVG_PATH = TOOLKIT / 'research/2026-10-29/scripts/options_vol_gate.py'
SIZING_PATH = TOOLKIT / 'research/strategy-review/scripts/sizing.py'
YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=6mo&includeAdjustedClose=true'
CBOE = 'https://cdn.cboe.com/api/global/delayed_quotes/options/{sym}.json'
TODAY, PRE, REACT, EXP = date(2026, 11, 5), date(2026, 11, 17), date(2026, 11, 18), date(2026, 12, 4)
FLAT_SESSIONS = 8          # 11/6, 11/9, 11/10, 11/11, 11/12, 11/13, 11/16, 11/17
EQUITY = 1384.84
GATE_X = 1.3
MILD, SHOCK = 1.04, 1.21


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def fetch(d):
    sys.path.insert(0, str(TOOLKIT))
    import quotes  # noqa: E402
    for s in ('NVDA', '%5EIRX'):
        p = d / f'y_{s}.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(YAHOO.format(sym=s))))
    p = d / 'NVDA_chain.json'
    if not p.exists():
        p.write_text(json.dumps(quotes.get_json(CBOE.format(sym='NVDA'))))


def main():
    d, cache = Path(sys.argv[1]), Path(sys.argv[2])
    d.mkdir(parents=True, exist_ok=True)
    fetch(d)
    cw, ovg, sizing = load(CW_PATH, 'cw'), load(OVG_PATH, 'ovg'), load(SIZING_PATH, 'sizing')
    pay = cw.Payoffs(sizing, cache)
    irx = cw.yahoo(d / 'y_%5EIRX.json', 'close')
    r = irx[max(x for x in irx if x <= TODAY)] / 100
    a, c = cw.yahoo(d / 'y_NVDA.json', 'adj'), cw.yahoo(d / 'y_NVDA.json', 'close')
    assert max(c) == TODAY, f'Yahoo NVDA last bar {max(c)}'
    ds = sorted(x for x in a if x <= TODAY)[-21:]
    lr = np.diff(np.log([a[x] for x in ds]))
    rv20 = cw.rv(lr)
    rv_flat = cw.rv(np.concatenate([lr[FLAT_SESSIONS:], np.zeros(FLAT_SESSIONS)]))
    S0 = c[TODAY]
    print(f'r {r:.4f}; NVDA close {TODAY} {S0:.2f} (Yahoo), prior {c[ds[-2]]:.2f} ({S0 / c[ds[-2]] - 1:+.2%})')
    print(f'RV20 {ds[0]}..{ds[-1]} = {rv20:.2%}; flat roll to {PRE} = {rv_flat:.2%}; IV cap 1.3x = {GATE_X * rv20:.1%} now, '
          f'{GATE_X * rv_flat:.1%} flat')

    # Tonight's Cboe file carries 120 rows under a 'B1VDA' root (11/13 only) that options_vol_gate's OCC regex rejects; drop them.
    raw = json.loads((d / 'NVDA_chain.json').read_text())
    raw['data']['options'] = [o for o in raw['data']['options'] if ovg.OCC.match(o['option'])]
    (d / 'NVDA_chain_std.json').write_text(json.dumps(raw))
    ts, meta, rows = ovg.load_chain(d / 'NVDA_chain_std.json')
    print(f'\nCboe chain {ts} UTC; close {meta.get("close")}, iv30 {meta.get("iv30")}')
    puts = sorted((x for x in rows if x['exp'] == EXP and x['cp'] == 'P' and 0.75 * S0 <= x['K'] <= 1.02 * S0), key=lambda x: x['K'])
    for x in puts:
        mid = (x['bid'] + x['ask']) / 2
        if not mid:
            continue
        print(f'  {x["sym"]} {x["bid"]:.2f}/{x["ask"]:.2f} ({(x["ask"] - x["bid"]) / mid:.1%}) IV {x["iv"]:.1%} '
              f'({x["iv"] / rv20:.2f}x now, {x["iv"] / rv_flat:.2f}x flat) d {x["delta"]:+.2f} OI {x["oi"]}'
              + ('  <- band' if 0.30 <= -x['delta'] <= 0.45 else ''))
    ex, E, pts = ovg.ex_event(rows, TODAY, REACT, meta['close'], tmin=0)
    print(f'ex-event IV {ex:.1%}, 11/17 event sd {E:.1%}; post-gap guess {ex * MILD:.1%} (x1.04) to {ex * SHOCK:.1%} (x1.21); '
          f'k {ex * MILD / rv_flat:.2f}-{ex * SHOCK / rv_flat:.2f} flat; term ' + ', '.join(f'{t}d {v:.1%}' for t, v in pts[:6]))

    dte = (EXP - REACT).days
    T = dte / 365
    print(f'\n== C1 Kelly at dte {dte}, equity ${EQUITY:,.2f} ==')
    for k in (1.0, 1.15, 1.25, 1.30):
        f = sizing.kelly(pay(k, dte=dte))
        print(f'  k {k:.2f}: full ${f * EQUITY:,.0f}, half ${f * EQUITY / 2:,.0f}, quarter ${f * EQUITY / 4:,.0f}')

    strikes = sorted({x['K'] for x in rows if x['exp'] == EXP and x['cp'] == 'P'})
    oi = {x['K']: x['oi'] for x in rows if x['exp'] == EXP and x['cp'] == 'P'}
    print(f'\n== one-contract test after a gap (pre-print close proxy = {S0:.2f}; flat RV20 {rv_flat:.1%}) ==')
    for g in (0.92, 0.90, 0.88):
        S = g * S0
        out = []
        for iv in (ex * MILD, ex * SHOCK, GATE_X * rv_flat):
            fk = sizing.kelly(pay(iv / rv_flat, dte=dte)) * EQUITY
            band = [(K, *ovg.bs_put(S, K, T, iv, r)) for K in strikes if K >= 0.7 * S]
            # Added after the first run: no 12/04 strike near a -8..-12% spot has OI >= 1000 tonight (160P 769, 165P 558), and OI
            # can build by 11/18, so the cheapest band put is shown whatever its OI, with tonight's OI beside it.
            band = [(K, px * 1.025, dl) for K, px, dl in band if 0.30 <= -dl <= 0.45]
            if band:
                K, ask, dl = min(band, key=lambda z: z[1])
                out.append(f'IV {iv:.1%} ({iv / rv_flat:.2f}x): {K:g}P ask~{ask:.2f} d{dl:+.2f} OI {oi.get(K, 0)} vs full Kelly '
                           f'${fk:,.0f} -> ' + ('FITS' if fk >= 100 * ask else 'no'))
        print(f'  S {S:.2f} ({g - 1:+.0%}): ' + '; '.join(out))

    # fit_1104.py's table at dte 16: per spot, the highest quoted IV (25% .. the 1.3x cap) at which full Kelly covers the cheapest
    # band put at model ask (BS x 1.025). IV / RV20 uses the flat RV20; the real gate is recomputed with the 11/17 close.
    print(f'\n== fit table (dte {dte}): highest IV at which full Kelly covers 1 band put ==')
    fk = {round(iv, 4): sizing.kelly(pay(iv / rv_flat, dte=dte)) * EQUITY
          for iv in np.arange(0.25, GATE_X * rv_flat + 1e-9, 0.0025)}
    for g in (0.92, 0.90, 0.88, 0.85):
        S, best = g * S0, None
        for iv, f in fk.items():
            for K in strikes:
                px, dl = ovg.bs_put(S, K, T, iv, r)
                if 0.30 <= -dl <= 0.45 and f >= 102.5 * px:
                    best = (iv, K, px * 1.025, f)
                    break
        print(f'  S {S:.2f} ({g - 1:+.0%}): ' + (f'IV <= {best[0]:.1%} ({best[0] / rv_flat:.2f}x), {best[1]:g}P ask~{best[2]:.2f}, '
                                                 f'full Kelly ${best[3]:,.0f}' if best else 'none'))


if __name__ == '__main__':
    main()
