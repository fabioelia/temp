"""catalyst, 2026-11-01: the week's C1 watchlist (AAPL, AMD, QCOM in the review's 25-name sample; PLTR, ANET, ARM, APP outside it),
with the pre-print RV20 and IV gate, tonight's band-put IVs, the likely post-gap put IV multiple, and the sizing.py Kelly size against
the cost of one in-band contract after a gap.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-01/scripts/catalyst_watch.py <data_dir> <earnings_cache>

  data_dir        raw downloads, fetched on the first run and re-read after that (Yahoo 6-month daily charts and Cboe delayed
                  chains for the seven names, Yahoo ^IRX). Each chain keeps Cboe's own timestamp.
  earnings_cache  the directory earnings_fetch.py filled (sec/, yahoo/, events.csv); read only.

Print dates (verified 11/01): Robinhood earnings calendar (get_earnings_calendar 11/02-11/06, high_market_cap, verified=true) and
Google News headlines (TOKENPOST 11/01 "AMD will report Q3 results Nov. 3"; ad-hoc-news 11/01 "Qualcomm ... November 4 earnings";
CMC Markets / MarketBeat 11/01 on Apple). Reaction day = the next session after an after-close release. No other name of the 25 reports
11/02-11/06 on that calendar.

Fixed choices (written before the numbers were looked at):
  * RV20 = annualised stdev (ddof 1, sqrt 252) of the 20 daily log returns of Yahoo ADJUSTED closes ending 10/30 (the last close; the
    rule's window ends t-1, so this is provisional) and a 'flat' roll to t-1 with 0% returns for the sessions still to trade.
    Gate = 1.3 x flat RV20.
  * Tonight's band puts: Cboe 11/20 and 11/27 puts with |delta| 0.30-0.45 (pre-print quotes, the event priced in).
  * Expected post-gap put IV = ex-event IV (options_vol_gate.ex_event on tonight's chain, T >= 0) x 1.04 (GOOGL/MSFT 10/29
    calibration, 2026-10-29 options-vol) and x 1.21 (INTC 10/30, 2026-10-30 catalyst_prints.py). k = that / flat RV20.
  * Kelly: sizing.py's own kelly() on sizing.py's c1 payoffs (n 216, 25 DTE, delta 0.35, IV = k x rv_pre, 3% spread), equity
    $1,917.92 (brief). The rows are built once and the payoffs checked against sizing.c1_payoffs at k 1.0.
    Sensitivities with the same functions: DTE 16 (an 11/20 put bought on the reaction day), a 5% spread (red-team factor), and a
    bootstrap P(f* = 0) (1000 draws, seed 7, step 0.005, as the red-team ran it).
  * One-contract test (W44 red-team rule): one contract only if full Kelly >= its cost. Cost = Black-Scholes put at S = 0.92 / 0.90 /
    0.88 x the 10/30 close (r = ^IRX/100, q = 0, T from the reaction day) at the mild and the shock IV, times 1.025 (half of a 5%
    spread), x 100. Strikes = tonight's chain strikes whose model |delta| is 0.30-0.45 at both IVs; the cheapest one is the test.
    OI is tonight's (the reaction day's 14:43 OI is the prior close's, so it cannot build on the day).
  * Contract window: the brief says 21-35 days to expiry; the playbook says two to five weeks. Both are shown per expiry.
  * Chain-implied P(reaction-day close <= -8%) as in catalyst_prints.py (normal on log price, sd = sqrt(E^2 + ex-IV^2/252)).
  * Added after the first run (before any conclusion was written), for the owner's goal-budget question: with one C1 put of cost X
    and nothing else, the share of the 216 sizing.py payoffs at k that lift equity to $2,200 (R >= 1 + 282.08 / X) and that lose
    half or more, for X = the cheapest band cost of AMD and QCOM at -10% (11/20, mild and shock IV).
"""
import csv
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
OVG_PATH = TOOLKIT / 'research/2026-10-29/scripts/options_vol_gate.py'
SIZING_PATH = TOOLKIT / 'research/strategy-review/scripts/sizing.py'
YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=6mo&includeAdjustedClose=true'
CBOE = 'https://cdn.cboe.com/api/global/delayed_quotes/options/{sym}.json'
ET = ZoneInfo('America/New_York')
LAST = date(2026, 10, 30)
EQUITY = 1917.92
GATE_X = 1.3
MILD, SHOCK = 1.04, 1.21
EXPIRIES = (date(2026, 11, 20), date(2026, 11, 27), date(2026, 12, 4))
N = NormalDist()
# ticker: (t-1 = last pre-print session, reaction day, sessions still to trade before t-1 is complete, in the 25-name sample)
WATCH = {
    'AAPL': (date(2026, 11, 2), date(2026, 11, 3), 1, True),
    'AMD': (date(2026, 11, 3), date(2026, 11, 4), 2, True),
    'QCOM': (date(2026, 11, 4), date(2026, 11, 5), 3, True),
    'PLTR': (date(2026, 11, 2), date(2026, 11, 3), 1, False),
    'ANET': (date(2026, 11, 3), date(2026, 11, 4), 2, False),
    'ARM': (date(2026, 11, 4), date(2026, 11, 5), 3, False),
    'APP': (date(2026, 11, 4), date(2026, 11, 5), 3, False),
}


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def fetch(data_dir):
    sys.path.insert(0, str(TOOLKIT))
    import quotes  # noqa: E402  (toolkit HTTP client with the proxy CA)
    for s in list(WATCH) + ['%5EIRX']:
        p = data_dir / f'y_{s}.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(YAHOO.format(sym=s))))
    for s in WATCH:
        p = data_dir / f'{s}_chain.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(CBOE.format(sym=s))))


def yahoo(path, field):
    r = json.loads(Path(path).read_text())['chart']['result'][0]
    vals = r['indicators']['adjclose'][0]['adjclose'] if field == 'adj' else r['indicators']['quote'][0]['close']
    return {datetime.fromtimestamp(t, tz=timezone.utc).astimezone(ET).date(): float(c)
            for t, c in zip(r['timestamp'], vals) if c}


def rv(lr):
    return float(np.std(lr, ddof=1) * math.sqrt(252))


class Payoffs:
    """sizing.py's c1 payoffs with the event rows built once."""

    def __init__(self, sizing, cache):
        sys.path.insert(0, str(TOOLKIT / 'research/strategy-review/scripts'))
        sys.path.insert(0, str(TOOLKIT / 'research/2026-10-30/scripts'))
        import earnings_analysis as ea
        from c1_vix_split import build_rows
        self.ea, self.sizing = ea, sizing
        rows = [r for r in build_rows(Path(cache)) if r['gap'] <= -0.08]
        ok = [r for r in rows if not any(math.isnan(r.get(k, float('nan'))) for k in ('ret5', 'cal5', 'rv_pre'))]
        self.ret = np.array([r['ret5'] for r in ok])
        self.cal = np.array([r['cal5'] for r in ok])
        self.rvp = np.array([r['rv_pre'] for r in ok])
        ref = np.asarray(sizing.c1_payoffs(cache, 1.0), float)
        assert np.allclose(ref, self(1.0)), 'payoffs differ from sizing.c1_payoffs'

    def __call__(self, k, dte=25, half_spread=0.015):
        self.ea.HALF_SPREAD = half_spread
        out = self.ea.option_ratio(self.ret, self.cal, dte, 0.35, k * self.rvp, k * self.rvp, np.zeros(len(self.ret), bool))
        self.ea.HALF_SPREAD = 0.015
        return np.asarray(out, float)


def boot_p0(sizing, r, reps=1000, seed=7):
    rng = np.random.default_rng(seed)
    return float(np.mean([sizing.kelly(r[rng.integers(0, len(r), len(r))], step=0.005) == 0 for _ in range(reps)]))


def main():
    data_dir, cache = Path(sys.argv[1]), Path(sys.argv[2])
    data_dir.mkdir(parents=True, exist_ok=True)
    fetch(data_dir)
    ovg = load(OVG_PATH, 'options_vol_gate')
    sizing = load(SIZING_PATH, 'sizing')
    pay = Payoffs(sizing, cache)
    irx = yahoo(data_dir / 'y_%5EIRX.json', 'close')
    r_rate = irx[max(d for d in irx if d <= LAST)] / 100
    print(f'r = ^IRX {max(d for d in irx if d <= LAST)} close / 100 = {r_rate:.4f} (Yahoo); equity ${EQUITY:,.2f}')

    print('\n== Kelly grid (sizing.kelly on sizing.py c1 payoffs, n 216) ==')
    print('k     full    half  | 16 DTE full | 5% spread full')
    for k in (0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30):
        f = sizing.kelly(pay(k))
        f16 = sizing.kelly(pay(k, dte=16))
        f5 = sizing.kelly(pay(k, half_spread=0.025))
        print(f'{k:.2f}  ${f * EQUITY:5.0f}  ${f * EQUITY / 2:5.0f}  |  ${f16 * EQUITY:5.0f}     |  ${f5 * EQUITY:5.0f}')

    hist = {}
    with open(cache / 'events.csv') as fh:
        for row in csv.DictReader(fh):
            try:
                hist.setdefault(row['ticker'], []).append(float(row['gap']))
            except (ValueError, TypeError):
                pass

    for s, (tm1, react, nflat, in_sample) in WATCH.items():
        print(f'\n== {s} ({"in the 25-name sample" if in_sample else "OUTSIDE the tested sample: descriptive only"}); '
              f'reports {tm1} after the close, reaction day {react} ==')
        adj = yahoo(data_dir / f'y_{s}.json', 'adj')
        cl = yahoo(data_dir / f'y_{s}.json', 'close')
        ds = sorted(d for d in adj if d <= LAST)[-21:]
        lr = np.diff(np.log([adj[d] for d in ds]))
        rv20, rv_flat = rv(lr), rv(np.concatenate([lr[nflat:], np.zeros(nflat)]))
        big = sorted(zip(ds[1:], lr), key=lambda x: abs(x[1]))[-2:]
        print(f'close {LAST} {cl[LAST]:.2f} (Yahoo); RV20 {ds[0]}..{ds[-1]} {rv20:.1%}; flat to {tm1} {rv_flat:.1%}; '
              f'gate 1.3x = {GATE_X * rv_flat:.1%}; largest days in window: '
              + ', '.join(f'{d} {x:+.1%}' for d, x in big) + f'; -8% line at the 10/30 close {0.92 * cl[LAST]:.2f}')
        if s in hist:
            g = hist[s]
            print(f'history n {len(g)}: down gaps <= -8% {sum(x <= -0.08 for x in g)} ({sum(x <= -0.08 for x in g[-12:])} of the last 12)')
        ts, meta, rows = ovg.load_chain(data_dir / f'{s}_chain.json')
        print(f'Cboe chain timestamp {ts} (UTC), underlying close {meta.get("close")}, iv30 {meta.get("iv30")}')
        for exp in EXPIRIES:
            band = sorted((x for x in rows if x['exp'] == exp and x['cp'] == 'P' and 0.30 <= -x['delta'] <= 0.45),
                          key=lambda x: x['K'])
            dte = (exp - react).days
            ok_brief, ok_play = 21 <= dte <= 35, 14 <= dte <= 35
            print(f'  {exp}: {dte} DTE from the reaction day (brief 21-35: {"ok" if ok_brief else "FAILS"}; '
                  f'playbook 2-5 weeks: {"ok" if ok_play else "FAILS"}); {len(band)} band puts tonight')
            for x in band:
                mid = (x['bid'] + x['ask']) / 2
                spr = (x['ask'] - x['bid']) / mid if mid > 0 else float('nan')
                print(f'    {x["sym"]} {x["bid"]:.2f}/{x["ask"]:.2f} ({spr:.0%}) IV {x["iv"]:.1%} d {x["delta"]:.2f} OI {x["oi"]}')
        ex, E, pts = ovg.ex_event(rows, LAST, react, meta['close'], tmin=0)
        sd_day = math.sqrt(E ** 2 + ex ** 2 / 252)
        p8 = N.cdf(math.log(0.92) / sd_day)
        iv_m, iv_s = ex * MILD, ex * SHOCK
        k_m, k_s = iv_m / rv_flat, iv_s / rv_flat
        print(f'ex-event IV {ex:.1%}, event sd {E:.1%}, expected |move| {0.798 * E:.1%}; P(reaction day <= -8%) {p8:.1%}')
        print(f'expected post-gap put IV {iv_m:.1%} (x1.04) to {iv_s:.1%} (x1.21) -> k {k_m:.2f} to {k_s:.2f} vs gate 1.30: '
              f'{"passes" if k_s <= GATE_X else ("mild passes, shock fails" if k_m <= GATE_X else "FAILS")}')
        fulls = {}
        for lab, k in (('mild', k_m), ('shock', k_s)):
            rr = pay(k)
            f = sizing.kelly(rr)
            fulls[lab] = f * EQUITY
            extra = ''
            if 0 < f:
                extra = (f'; 16 DTE full ${sizing.kelly(pay(k, dte=16)) * EQUITY:,.0f}; 5% spread full '
                         f'${sizing.kelly(pay(k, half_spread=0.025)) * EQUITY:,.0f}; boot P(f*=0) {boot_p0(sizing, rr):.0%}')
            print(f'  Kelly at k {k:.2f} ({lab}): EV {rr.mean():.3f}, f* {f:.3f} -> full ${f * EQUITY:,.0f}, '
                  f'half ${f * EQUITY / 2:,.0f}, quarter ${f * EQUITY / 4:,.0f}{extra}')
        for exp in EXPIRIES:
            if not any(x['exp'] == exp for x in rows):
                print(f'  {exp}: not listed')
                continue
            T = (exp - react).days / 365
            for gap in (0.92, 0.90, 0.88):
                S = gap * cl[LAST]
                best = None
                for q in sorted((q for q in rows if q['exp'] == exp and q['cp'] == 'P' and 0.75 * S <= q['K'] <= S),
                                key=lambda q: q['K']):
                    pm, dm = ovg.bs_put(S, q['K'], T, iv_m, r_rate)
                    ps, dsh = ovg.bs_put(S, q['K'], T, iv_s, r_rate)
                    if not (0.30 <= -dm <= 0.45 and 0.30 <= -dsh <= 0.45):
                        continue
                    cm, cs = 102.5 * pm, 102.5 * ps
                    if best is None:
                        best = (q, cm, cs, dm, dsh)
                    print(f'    {q["sym"]} @S {S:.2f} ({gap - 1:+.0%}): cost mild ${cm:,.0f} (d {dm:.2f}), shock ${cs:,.0f} '
                          f'(d {dsh:.2f}); OI tonight {q["oi"]} {"ok" if q["oi"] >= 1000 else "FAILS"}')
                if best:
                    q, cm, cs, _, _ = best
                    print(f'  -> {exp} {gap - 1:+.0%}: cheapest band {q["K"]:g}P; one contract fits? mild '
                          f'{"YES" if fulls["mild"] >= cm else "no"} (${fulls["mild"]:,.0f} vs ${cm:,.0f}), shock '
                          f'{"YES" if fulls["shock"] >= cs else "no"} (${fulls["shock"]:,.0f} vs ${cs:,.0f})')
                    if s in ('AMD', 'QCOM') and exp == EXPIRIES[0] and gap == 0.90:
                        GOAL.append((s, p8, (('mild', k_m, cm), ('shock', k_s, cs))))

    print('\n== E. Goal-budget arithmetic: one C1 put of cost X, nothing else (sizing.py payoffs, n 216, 25 DTE) ==')
    for s, p8, cases in GOAL:
        for lab, k, X in cases:
            rr = pay(k)
            need = 1 + (2200 - EQUITY) / X
            print(f'{s} {lab}: X ${X:,.0f} at k {k:.2f}: P(R >= {need:.2f}, equity >= $2,200) {np.mean(rr >= need):.0%}; '
                  f'P(lose half or more) {np.mean(rr <= 0.5):.0%}; mean ${X * (rr.mean() - 1):+,.0f}; '
                  f'x P(gap <= -8%) {p8:.0%} -> {p8 * np.mean(rr >= need):.1%} this week')


GOAL = []


if __name__ == '__main__':
    main()
