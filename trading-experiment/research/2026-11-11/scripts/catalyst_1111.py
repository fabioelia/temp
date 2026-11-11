"""catalyst, 2026-11-06 (Fri night): the C1 checks left in the window (11/9-11/18).

Who reports (fixed before any number was looked at):
  * Robinhood get_earnings_calendar(start 2026-11-09, 9 days, high_market_cap) filtered to the 25-name C1 sample
    (research/strategy-review/scripts/earnings_fetch.py UNIVERSE): only CSCO (11/12 pm, verified) and NVDA (11/17 pm, verified).
    WMT is 11/19 am on the same calendar (11/18-11/20 query), so its reaction day is after the window.
  * Cisco newsroom, "Cisco Schedules Conference Call for Q1 Fiscal Year 2027 Financial Results" (11/03): results after the close
    Thu 11/12, call 4:30 pm ET.  NVIDIA newsroom (cited 11/05): 11/17 after the close.
  * Reaction days: CSCO Fri 11/13, NVDA Wed 11/18.

Method = catalyst_1105.py (NVDA) / fit_1104.py, applied to both names:
  * RV20 = annualised stdev (ddof 1, sqrt 252) of the 20 daily log returns of Yahoo ADJUSTED closes ending 11/06, plus a provisional
    'flat roll' to t-1 (0% returns for the sessions still to trade: CSCO 4 = 11/9-11/12; NVDA 7 = 11/9-11/17). The real gate uses
    the t-1 close.  Gate = 1.3 x RV20.
  * Contracts: the shortest Friday expiry >= 14 calendar days after the reaction day, and the next one (two to five weeks):
    CSCO 11/27 (14 d) and 12/04 (21 d); NVDA 12/04 (16 d) and 12/11 (23 d).
    Added after the first run (run1): every CSCO 11/27, 12/04 and 12/11 put at 70-95 has OI <= 160 and spreads of 14-42% tonight,
    so the OI >= 1000 rule cannot pass there; the 12/18 monthly (35 d, the five-week edge) has OI 1,648-10,012 at 77.5-90, so it
    is added for CSCO.
  * Kelly: catalyst_watch.Payoffs (= sizing.c1_payoffs, checked inside) at each DTE, equity $1,384.84 (brief).
    One contract only if full Kelly covers its ask (W44 rule). Ask = Black-Scholes put x 1.025 (half of a 5% spread), r = ^IRX / 100.
  * Tonight's band puts (Cboe delayed chain): IV, delta, OI, spread, IV / RV20. Pre-print quotes include the event.
    Post-gap IV guess = ex-event IV (options_vol_gate.ex_event) x 1.04 (mild) / x 1.21 (shock), as on 11/01-11/05.
  * Fit table: per gap size, the highest IV at which full Kelly covers the cheapest band put (model delta 0.30-0.45).
  * History (descriptive): the share of each name's events in the earnings cache with a gap <= -8%.

Run (from /home/user/temp):  python3 -I <this> <data_dir> <earnings_cache>
"""
import csv
import importlib.util
import json
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
TODAY = date(2026, 11, 11)
EQUITY = 1393.59
GATE_X = 1.3
MILD, SHOCK = 1.04, 1.21
# name: (t-1, reaction day, flat sessions to t-1, expiries)
NAMES = {
    'CSCO': (date(2026, 11, 12), date(2026, 11, 13), 1, (date(2026, 11, 27), date(2026, 12, 4), date(2026, 12, 18))),
    'NVDA': (date(2026, 11, 17), date(2026, 11, 18), 4, (date(2026, 12, 4), date(2026, 12, 11), date(2026, 12, 18))),
}


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def fetch(d):
    sys.path.insert(0, str(TOOLKIT))
    import quotes  # noqa: E402
    for s in list(NAMES) + ['%5EIRX']:
        p = d / f'y_{s}.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(YAHOO.format(sym=s))))
    for s in NAMES:
        p = d / f'{s}_chain.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(CBOE.format(sym=s))))


def history(cache, sym):
    g = []
    with open(Path(cache) / 'events.csv') as fh:
        for row in csv.DictReader(fh):
            if row['ticker'] == sym:
                try:
                    g.append((row['react_date'], float(row['gap'])))
                except (TypeError, ValueError):
                    pass
    down = [x for x in g if x[1] <= -0.08]
    return len(g), down


def main():
    d, cache = Path(sys.argv[1]), Path(sys.argv[2])
    d.mkdir(parents=True, exist_ok=True)
    fetch(d)
    cw, ovg, sizing = load(CW_PATH, 'cw'), load(OVG_PATH, 'ovg'), load(SIZING_PATH, 'sizing')
    pay = cw.Payoffs(sizing, cache)
    irx = cw.yahoo(d / 'y_%5EIRX.json', 'close')
    r = irx[max(x for x in irx if x <= TODAY)] / 100
    print(f'r = ^IRX {max(x for x in irx if x <= TODAY)} / 100 = {r:.4f}; equity ${EQUITY:,.2f}')

    for sym, (pre, react, nflat, exps) in NAMES.items():
        a, c = cw.yahoo(d / f'y_{sym}.json', 'adj'), cw.yahoo(d / f'y_{sym}.json', 'close')
        assert max(c) == TODAY, f'Yahoo {sym} last bar {max(c)}'
        ds = sorted(x for x in a if x <= TODAY)[-21:]
        lr = np.diff(np.log([a[x] for x in ds]))
        rv20 = cw.rv(lr)
        rv_flat = cw.rv(np.concatenate([lr[nflat:], np.zeros(nflat)]))
        S0 = c[TODAY]
        n, down = history(cache, sym)
        print(f'\n######## {sym}: t-1 {pre}, reaction {react}; close {TODAY} {S0:.2f} (Yahoo), prior {c[ds[-2]]:.2f} '
              f'({S0 / c[ds[-2]] - 1:+.2%})')
        print(f'history: {len(down)}/{n} events with gap <= -8% ({len(down) / n:.1%}); last three: {down[-3:]}')
        print(f'RV20 {ds[0]}..{ds[-1]} = {rv20:.2%}; flat roll to {pre} = {rv_flat:.2%}; IV cap 1.3x = {GATE_X * rv20:.1%} now, '
              f'{GATE_X * rv_flat:.1%} flat')

        raw = json.loads((d / f'{sym}_chain.json').read_text())
        nraw = len(raw['data']['options'])
        raw['data']['options'] = [o for o in raw['data']['options'] if ovg.OCC.match(o['option'])]
        (d / f'{sym}_chain_std.json').write_text(json.dumps(raw))
        ts, meta, rows = ovg.load_chain(d / f'{sym}_chain_std.json')
        print(f'Cboe chain {ts} UTC; close {meta.get("close")}, iv30 {meta.get("iv30")}; rows {len(rows)} '
              f'(dropped {nraw - len(raw["data"]["options"])} non-OCC)')
        listed = sorted({x['exp'] for x in rows if react <= x['exp'] <= date(2026, 12, 31)})
        print('listed expiries to 12/31: ' + ', '.join(f'{e:%m/%d}({(e - react).days}d)' for e in listed))
        ex, E, pts = ovg.ex_event(rows, TODAY, react, meta['close'], tmin=0)
        print(f'ex-event IV {ex:.1%}, event sd {E:.1%}; post-gap guess {ex * MILD:.1%} (x1.04) to {ex * SHOCK:.1%} (x1.21); '
              f'k {ex * MILD / rv_flat:.2f}-{ex * SHOCK / rv_flat:.2f} flat; term ' + ', '.join(f'{t}d {v:.1%}' for t, v in pts[:6]))

        for exp in exps:
            if exp not in listed:
                print(f'\n-- {exp}: NOT LISTED on Cboe tonight')
                continue
            dte = (exp - react).days
            T = dte / 365
            print(f'\n-- {sym} {exp} puts ({dte} DTE from {react}); tonight\'s quotes, |delta| 0.30-0.45 marked --')
            puts = sorted((x for x in rows if x['exp'] == exp and x['cp'] == 'P' and 0.75 * S0 <= x['K'] <= 1.02 * S0),
                          key=lambda x: x['K'])
            for x in puts:
                mid = (x['bid'] + x['ask']) / 2
                if not mid:
                    continue
                print(f'  {x["sym"]} {x["bid"]:.2f}/{x["ask"]:.2f} ({(x["ask"] - x["bid"]) / mid:.1%}) IV {x["iv"]:.1%} '
                      f'({x["iv"] / rv20:.2f}x now, {x["iv"] / rv_flat:.2f}x flat) d {x["delta"]:+.2f} OI {x["oi"]}'
                      + ('  <- band' if 0.30 <= -x['delta'] <= 0.45 else ''))
            print(f'  C1 Kelly at {dte} DTE: ' + '; '.join(
                f'k {k:.2f} full ${sizing.kelly(pay(k, dte=dte)) * EQUITY:,.0f} / half ${sizing.kelly(pay(k, dte=dte)) * EQUITY / 2:,.0f}'
                f' / qtr ${sizing.kelly(pay(k, dte=dte)) * EQUITY / 4:,.0f}' for k in (1.0, 1.15, 1.25, 1.30)))
            # 11/09 refresh: ask ceiling (full Kelly / 100) on a k grid, as in the 11/08 CSV.
            print(f'  ask ceiling (full Kelly/100) at {dte} DTE: ' + '; '.join(
                f'k{k:.2f} {sizing.kelly(pay(k, dte=dte)) * EQUITY / 100:.2f}' for k in (0.90, 0.95, 1.0, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30)))
            # Added after run2 for the memo: the mean per-$ payoff (EV) of the same 216-row payoffs at this DTE.
            print(f'  C1 EV per $ at {dte} DTE: ' + '; '.join(f'k {k:.2f} {np.nanmean(pay(k, dte=dte)):.3f}'
                                                       for k in (1.0, 1.15, 1.25, 1.30)))
            strikes = sorted({x['K'] for x in rows if x['exp'] == exp and x['cp'] == 'P'})
            oi = {x['K']: x['oi'] for x in rows if x['exp'] == exp and x['cp'] == 'P'}
            for g in (0.92, 0.90, 0.88):
                S = g * S0
                out = []
                for iv in (ex * MILD, ex * SHOCK, GATE_X * rv_flat):
                    fk = sizing.kelly(pay(iv / rv_flat, dte=dte)) * EQUITY
                    band = [(K, *ovg.bs_put(S, K, T, iv, r)) for K in strikes if K >= 0.7 * S]
                    band = [(K, px * 1.025, dl) for K, px, dl in band if 0.30 <= -dl <= 0.45]
                    if band:
                        K, ask, dl = min(band, key=lambda z: z[1])
                        out.append(f'IV {iv:.1%} ({iv / rv_flat:.2f}x): {K:g}P ask~{ask:.2f} d{dl:+.2f} OI {oi.get(K, 0)} '
                                   f'vs full Kelly ${fk:,.0f} -> ' + ('FITS' if fk >= 100 * ask else 'no'))
                print(f'  gap S {S:.2f} ({g - 1:+.0%}): ' + '; '.join(out))
            fk = {round(iv, 4): sizing.kelly(pay(iv / rv_flat, dte=dte)) * EQUITY
                  for iv in np.arange(0.10, GATE_X * rv_flat + 1e-9, 0.0025)}
            for g in (0.92, 0.90, 0.88, 0.85):
                S, best = g * S0, None
                for iv, f in fk.items():
                    for K in strikes:
                        px, dl = ovg.bs_put(S, K, T, iv, r)
                        if 0.30 <= -dl <= 0.45 and f >= 102.5 * px:
                            best = (iv, K, px * 1.025, f, oi.get(K, 0))
                            break
                print(f'  fit S {S:.2f} ({g - 1:+.0%}): ' + (
                    f'IV <= {best[0]:.1%} ({best[0] / rv_flat:.2f}x), {best[1]:g}P ask~{best[2]:.2f}, full Kelly ${best[3]:,.0f}, '
                    f'OI tonight {best[4]}' if best else 'none'))


if __name__ == '__main__':
    main()
