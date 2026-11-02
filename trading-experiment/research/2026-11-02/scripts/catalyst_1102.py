"""catalyst, 2026-11-02 (Mon night): tonight's update of Sunday's C1 watch (research/2026-11-01/scripts/catalyst_watch.py) for
AAPL (printed tonight), AMD (prints 11/3, reacts Wed 11/4) and QCOM (prints 11/4, reacts Thu 11/5), plus a decomposition of AMD's
-7.5% session today.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-02/scripts/catalyst_1102.py <data_dir> <earnings_cache>

  data_dir        raw downloads, fetched on the first run and re-read after that: Yahoo 6-month daily charts (names below and
                  ^IRX), Yahoo 5-minute bars for 11/02 (AMD, SMH, QQQ, MRVL), Cboe delayed chains (AAPL, AMD, QCOM). Each chain
                  keeps Cboe's own timestamp, which the output prints.
  earnings_cache  the directory earnings_fetch.py filled (sec/, yahoo/, events.csv); read only.

Fixed choices (written before the numbers were looked at; same definitions as Sunday's script unless stated):
  * RV20 = annualised stdev (ddof 1, sqrt 252) of the 20 daily log returns of Yahoo ADJUSTED closes ending 11/02 (the last
    close). For AMD (t-1 = 11/03) and QCOM (t-1 = 11/04) the rule's window ends later, so a 'flat' roll with 0% returns for the
    sessions still to trade is shown too; the gate is 1.3 x the flat RV20 (Sunday's choice). AAPL's t-1 is 11/02: final.
  * Band puts tonight: Cboe 11/20 and 11/27 puts with |delta| 0.30-0.45 (pre-print closing quotes, the event priced in).
  * Expected post-gap put IV = options_vol_gate.ex_event(tonight's chain) x 1.04 (mild) and x 1.21 (shock); k = that / flat RV20.
  * Kelly: sizing.kelly on sizing.py's c1 payoffs (catalyst_watch.Payoffs, checked against sizing.c1_payoffs at k 1.0), at the
    DTE the put would have on its reaction day (AMD: 11/20 = 16, 11/27 = 23; QCOM: 11/20 = 15, 11/27 = 22), 3% spread; the 5%
    spread and bootstrap P(f* = 0) as sensitivities. Equity $1,917.92 (brief).
  * One-contract test (W44 red-team rule): one contract only if full Kelly >= its cost. Cost = Black-Scholes put x 1.025 x 100 at
    S = gap x tonight's close (tonight's close stands in for the t-1 close), r = ^IRX/100, q = 0, T from the reaction day, for
    tonight's listed strikes whose model |delta| is 0.30-0.45; the cheapest qualifying strike is the test.
  * Full scan (answers "could ANY band put size to one contract?"): IV from 20% to the 1.3x gate in 0.5-point steps, k = IV /
    flat RV20, full Kelly at that k and DTE vs the cheapest band cost at that IV, for gaps -8% to -20% in 1-point steps.
    Reported: the largest (full Kelly - cost) found; the QCOM IV cap = the highest IV at which full Kelly covers the cheapest
    band put at the stated gap, and the ask cap per strike = full Kelly at the quoted IV / 100.
  * AMD decomposition: OLS beta of AMD daily log returns on SMH over the 60 sessions ending 10/30, applied to SMH on 11/02;
    residual = AMD - beta x SMH. Same-day moves of the names Melius cut (NVDA, AVGO, MRVL, DELL, QCOM, CRWV; CNBC's Carl
    Quintanilla relaying the note, 11/02) and of INTC, LITE, MU, ARM, QQQ. Intraday path from Yahoo 5-minute bars (ET), with
    the midday check at the 12:45 bar (24/7 Wall St.'s 12:49 ET AMD quote of $489.03).
  * Chain-implied P(reaction-day close <= -8%) as in catalyst_watch.py.
"""
import importlib.util
import json
import math
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from statistics import NormalDist
from zoneinfo import ZoneInfo

import numpy as np

TOOLKIT = Path('/home/user/temp/trading-experiment')
CW_PATH = TOOLKIT / 'research/2026-11-01/scripts/catalyst_watch.py'
OVG_PATH = TOOLKIT / 'research/2026-10-29/scripts/options_vol_gate.py'
SIZING_PATH = TOOLKIT / 'research/strategy-review/scripts/sizing.py'
YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=6mo&includeAdjustedClose=true'
YAHOO5 = 'https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=5m&range=1d'
CBOE = 'https://cdn.cboe.com/api/global/delayed_quotes/options/{sym}.json'
ET = ZoneInfo('America/New_York')
TODAY = date(2026, 11, 2)
EQUITY = 1917.92
GATE_X = 1.3
MILD, SHOCK = 1.04, 1.21
EXPIRIES = (date(2026, 11, 20), date(2026, 11, 27))
N = NormalDist()
# ticker: (t-1, reaction day, sessions still to trade before t-1 is complete)
WATCH = {'AAPL': (date(2026, 11, 2), date(2026, 11, 3), 0),
         'AMD': (date(2026, 11, 3), date(2026, 11, 4), 1),
         'QCOM': (date(2026, 11, 4), date(2026, 11, 5), 2)}
PEERS = ['SMH', 'QQQ', 'INTC', 'NVDA', 'AVGO', 'MRVL', 'LITE', 'MU', 'ARM', 'DELL', 'CRWV']
INTRA = ['AMD', 'SMH', 'QQQ', 'MRVL']


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def fetch(data_dir):
    sys.path.insert(0, str(TOOLKIT))
    import quotes  # noqa: E402  (toolkit HTTP client with the proxy CA)
    jobs = [(f'y_{s}.json', YAHOO.format(sym=s)) for s in list(WATCH) + PEERS + ['%5EIRX']]
    jobs += [(f'i_{s}.json', YAHOO5.format(sym=s)) for s in INTRA]
    jobs += [(f'{s}_chain.json', CBOE.format(sym=s)) for s in WATCH]
    for name, url in jobs:
        p = data_dir / name
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(url)))


def intraday(path):
    r = json.loads(Path(path).read_text())['chart']['result'][0]
    out = {}
    for t, c in zip(r['timestamp'], r['indicators']['quote'][0]['close']):
        if c:
            d = datetime.fromtimestamp(t, tz=timezone.utc).astimezone(ET)
            out[d] = float(c)
    return out


def band_cost(ovg, rows, exp, S, T, iv, r):
    """Cheapest tonight-listed strike whose model |delta| is 0.30-0.45 at (S, iv); its cost x1.025 x100."""
    for K in sorted({q['K'] for q in rows if q['exp'] == exp and q['cp'] == 'P' and 0.70 * S <= q['K'] <= S}):
        px, d = ovg.bs_put(S, K, T, iv, r)
        if 0.30 <= -d <= 0.45:
            return K, 102.5 * px, d
    return None


def main():
    data_dir, cache = Path(sys.argv[1]), Path(sys.argv[2])
    data_dir.mkdir(parents=True, exist_ok=True)
    fetch(data_dir)
    cw = load(CW_PATH, 'catalyst_watch')
    ovg = load(OVG_PATH, 'options_vol_gate')
    sizing = load(SIZING_PATH, 'sizing')
    pay = cw.Payoffs(sizing, cache)
    irx = cw.yahoo(data_dir / 'y_%5EIRX.json', 'close')
    dr = max(d for d in irx if d <= TODAY)
    r_rate = irx[dr] / 100
    print(f'r = ^IRX {dr} close / 100 = {r_rate:.4f} (Yahoo); equity ${EQUITY:,.2f}')

    # ---------------------------------------------------------------- A. today's AMD move
    print('\n== A. AMD 11/02: sector vs own move (Yahoo daily closes) ==')
    cl = {s: cw.yahoo(data_dir / f'y_{s}.json', 'close') for s in ['AMD'] + PEERS + ['QCOM', 'AAPL']}
    adj = {s: cw.yahoo(data_dir / f'y_{s}.json', 'adj') for s in ['AMD', 'SMH']}
    assert max(cl['AMD']) == TODAY, f'Yahoo AMD last bar is {max(cl["AMD"])}, not {TODAY}'
    for s in ['AMD'] + PEERS + ['QCOM', 'AAPL']:
        ds = sorted(cl[s])
        if ds[-1] != TODAY:
            print(f'  {s}: no {TODAY} bar (last {ds[-1]})')
            continue
        p = ds[-2]
        print(f'  {s:5s} {cl[s][TODAY]:9.2f} vs {p} {cl[s][p]:9.2f}: {cl[s][TODAY] / cl[s][p] - 1:+.1%}')
    ds = sorted(d for d in adj['AMD'] if d in adj['SMH'])
    lr = {s: np.diff(np.log([adj[s][d] for d in ds])) for s in adj}
    i_end = ds.index(date(2026, 10, 30))
    xa, xs = lr['AMD'][i_end - 60:i_end], lr['SMH'][i_end - 60:i_end]
    beta = float(np.polyfit(xs, xa, 1)[0])
    a_t, s_t = lr['AMD'][-1], lr['SMH'][-1]
    print(f'  beta(AMD on SMH, 60 sessions to 10/30) {beta:.2f}; 11/02 AMD log ret {a_t:+.1%}, SMH {s_t:+.1%}, '
          f'beta x SMH {beta * s_t:+.1%}, residual {a_t - beta * s_t:+.1%}')
    a_p, s_p = lr['AMD'][-2], lr['SMH'][-2]
    print(f'  10/30 for reference: AMD {a_p:+.1%}, SMH {s_p:+.1%}, residual {a_p - beta * s_p:+.1%}')
    bars = {s: intraday(data_dir / f'i_{s}.json') for s in INTRA}
    day = {d.date() for d in bars['AMD']}
    print(f'  intraday bars dated {sorted(day)} (Yahoo 5m, ET bar start); change vs the 10/30 close:')
    prev = {s: cl[s][date(2026, 10, 30)] if s in cl else None for s in INTRA}
    prev['SMH'], prev['QQQ'], prev['MRVL'] = (cl['SMH'][date(2026, 10, 30)], cl['QQQ'][date(2026, 10, 30)],
                                              cl['MRVL'][date(2026, 10, 30)])
    for hhmm in ('09:30', '10:00', '11:00', '12:00', '12:45', '13:30', '14:00', '14:40', '15:00', '15:30', '15:55'):
        h, m = map(int, hhmm.split(':'))
        row = []
        for s in INTRA:
            v = [c for d, c in bars[s].items() if d.hour == h and d.minute == m]
            row.append(f'{s} {v[0]:.2f} ({v[0] / prev[s] - 1:+.1%})' if v else f'{s} n/a')
        print(f'    {hhmm}  ' + '  '.join(row))

    # ---------------------------------------------------------------- B. per-name watch
    out = {}
    for s, (tm1, react, nflat) in WATCH.items():
        print(f'\n== B. {s}: reports {tm1} after the close, reaction day {react} ==')
        a = cw.yahoo(data_dir / f'y_{s}.json', 'adj')
        c = cw.yahoo(data_dir / f'y_{s}.json', 'close')
        ds = sorted(d for d in a if d <= TODAY)[-21:]
        lr_ = np.diff(np.log([a[d] for d in ds]))
        rv20 = cw.rv(lr_)
        rv_flat = cw.rv(np.concatenate([lr_[nflat:], np.zeros(nflat)])) if nflat else rv20
        big = sorted(zip(ds[1:], lr_), key=lambda x: abs(x[1]))[-3:]
        S0 = c[TODAY]
        print(f'close {TODAY} {S0:.2f} (Yahoo); RV20 {ds[0]}..{ds[-1]} {rv20:.1%}; flat to {tm1} {rv_flat:.1%}; '
              f'gate 1.3x = {GATE_X * rv_flat:.1%}; largest days: ' + ', '.join(f'{d} {x:+.1%}' for d, x in big)
              + f'; -8% line at tonight\'s close {0.92 * S0:.2f}')
        ts, meta, rows = ovg.load_chain(data_dir / f'{s}_chain.json')
        print(f'Cboe chain timestamp {ts} (UTC), underlying close {meta.get("close")}, iv30 {meta.get("iv30")}')
        for exp in EXPIRIES:
            band = sorted((x for x in rows if x['exp'] == exp and x['cp'] == 'P' and 0.30 <= -x['delta'] <= 0.45),
                          key=lambda x: x['K'])
            print(f'  {exp}: {(exp - react).days} DTE from the reaction day; {len(band)} band puts tonight')
            for x in band:
                mid = (x['bid'] + x['ask']) / 2
                spr = (x['ask'] - x['bid']) / mid if mid > 0 else float('nan')
                print(f'    {x["sym"]} {x["bid"]:.2f}/{x["ask"]:.2f} ({spr:.1%}) IV {x["iv"]:.1%} d {x["delta"]:.2f} '
                      f'OI {x["oi"]} vol {x["vol"]}')
        ex, E, pts = ovg.ex_event(rows, TODAY, react, meta['close'], tmin=0)
        sd_day = math.sqrt(E ** 2 + ex ** 2 / 252)
        p8 = N.cdf(math.log(0.92) / sd_day)
        iv_m, iv_s = ex * MILD, ex * SHOCK
        k_m, k_s = iv_m / rv_flat, iv_s / rv_flat
        print(f'ex-event IV {ex:.1%}, event sd {E:.1%}, expected |move| {0.798 * E:.1%}; P(reaction day <= -8%) {p8:.1%}')
        print(f'expected post-gap put IV {iv_m:.1%} (x1.04) to {iv_s:.1%} (x1.21) -> k {k_m:.2f} to {k_s:.2f} vs gate 1.30')
        out[s] = dict(rv=rv_flat, rows=rows, react=react, S0=S0, k=(k_m, k_s), iv=(iv_m, iv_s), p8=p8, ts=ts)
        if s == 'AAPL':
            continue
        for exp in EXPIRIES:
            dte = (exp - react).days
            T = dte / 365
            print(f'  -- {exp} ({dte} DTE at entry) --')
            fulls = {}
            for lab, k in (('mild', k_m), ('shock', k_s)):
                rr = pay(k, dte=dte)
                f = sizing.kelly(rr)
                fulls[lab] = f * EQUITY
                extra = ''
                if f > 0:
                    extra = (f'; 5% spread full ${sizing.kelly(pay(k, dte=dte, half_spread=0.025)) * EQUITY:,.0f}; '
                             f'boot P(f*=0) {cw.boot_p0(sizing, rr):.0%}')
                print(f'  Kelly at k {k:.2f} ({lab}): EV {rr.mean():.3f}, f* {f:.3f} -> full ${f * EQUITY:,.0f}, '
                      f'half ${f * EQUITY / 2:,.0f}, quarter ${f * EQUITY / 4:,.0f}{extra}')
            for gap in (0.92, 0.90, 0.88, 0.85):
                S = gap * S0
                cm, cs = band_cost(ovg, rows, exp, S, T, iv_m, r_rate), band_cost(ovg, rows, exp, S, T, iv_s, r_rate)
                if not (cm and cs):
                    print(f'    {gap - 1:+.0%}: no band strike listed')
                    continue
                oi = {q['K']: q['oi'] for q in rows if q['exp'] == exp and q['cp'] == 'P'}
                print(f'    {gap - 1:+.0%} (S {S:.2f}): mild {cm[0]:g}P ${cm[1]:,.0f} (d {cm[2]:.2f}, OI {oi[cm[0]]}) vs full '
                      f'${fulls["mild"]:,.0f} -> {"FITS" if fulls["mild"] >= cm[1] else "no"}; shock {cs[0]:g}P ${cs[1]:,.0f} '
                      f'(d {cs[2]:.2f}, OI {oi[cs[0]]}) vs ${fulls["shock"]:,.0f} -> {"FITS" if fulls["shock"] >= cs[1] else "no"}')

    # ---------------------------------------------------------------- C. full scan: can any band put size to one contract?
    print('\n== C. Full scan: IV 20% .. 1.3x gate (0.5-pt steps) x gap -8% .. -20%: full Kelly(k = IV/RV20, DTE) - cheapest band cost ==')
    kcache = {}

    def full_k(k, dte):
        key = (round(k, 4), dte)
        if key not in kcache:
            kcache[key] = sizing.kelly(pay(k, dte=dte)) * EQUITY
        return kcache[key]

    for s in ('AMD', 'QCOM'):
        o = out[s]
        for exp in EXPIRIES:
            dte = (exp - o['react']).days
            T = dte / 365
            best, caps = None, {}
            for iv in np.arange(0.20, GATE_X * o['rv'] + 1e-9, 0.005):
                fk = full_k(iv / o['rv'], dte)
                for g in range(8, 21):
                    S = (1 - g / 100) * o['S0']
                    bc = band_cost(ovg, o['rows'], exp, S, T, iv, r_rate)
                    if not bc:
                        continue
                    m = fk - bc[1]
                    if best is None or m > best[0]:
                        best = (m, iv, g, bc[0], bc[1], fk)
                    if m >= 0:
                        caps[g] = max(caps.get(g, 0), iv)
            m, iv, g, K, cost, fk = best
            print(f'  {s} {exp} ({dte} DTE): best margin ${m:+,.0f} at IV {iv:.1%} (k {iv / o["rv"]:.2f}), gap -{g}%, '
                  f'{K:g}P cost ${cost:,.0f} vs full Kelly ${fk:,.0f}')
            if caps:
                print('    highest IV at which full Kelly covers the cheapest band put, by gap: '
                      + ', '.join(f'-{g}% {v:.1%} ({v / o["rv"]:.2f}x)' for g, v in sorted(caps.items())))
            else:
                print('    no (IV, gap) pair in the grid lets full Kelly cover one band contract')

    # ---------------------------------------------------------------- D. QCOM 14:43 lookup
    o = out['QCOM']
    print(f'\n== D. QCOM 14:43 lookup (RV20 flat {o["rv"]:.1%}): quoted IV -> k -> full Kelly -> max ask per contract ==')
    for exp in EXPIRIES:
        dte = (exp - o['react']).days
        print(f'  {exp} ({dte} DTE):')
        for iv in (0.40, 0.42, 0.44, 0.46, 0.48, 0.50, 0.52, 0.55, 0.60, 0.65):
            k = iv / o['rv']
            fk = full_k(k, dte)
            rr = pay(k, dte=dte)
            print(f'    IV {iv:.0%}: k {k:.2f}, EV {rr.mean():.3f}, full ${fk:,.0f}, half ${fk / 2:,.0f} -> ask <= {fk / 100:.2f}'
                  + ('  (above the 1.3x gate)' if k > GATE_X else ''))


if __name__ == '__main__':
    main()
