"""options-vol, 2026-10-29: pre-print RV20 and the C1 IV gate for INTC and AMZN, a post-print IV and contract preview from
tonight's Cboe chain, and EV per $ from the strategy review's own C1 option model at the expected entry IV.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-10-29/scripts/options_vol_gate.py <data_dir> <events_csv> <googl_pre_chain> <msft_pre_chain>

  data_dir        raw downloads; fetched on first run (Yahoo daily chart for INTC AMZN GOOGL MSFT ^IRX, Cboe delayed chains for
                  INTC AMZN GOOGL MSFT) and saved as y_<sym>.json / <sym>_chain.json, so a re-run reads the same raw data.
  events_csv      the per-event file earnings_analysis.py writes as its third argument (2,264 8-K 2.02 events, rv_pre, ret5, cal5).
  googl_pre_chain Cboe chain saved 2026-10-28 ~17:17 ET (GOOGL's pre-print close quotes; it reported 10/28 after the close).
  msft_pre_chain  Cboe chain saved 2026-10-27 ~17:16 ET (MSFT's pre-print close quotes; it reported 10/28 after the close).

Fixed choices (written before the INTC/AMZN numbers were looked at):
  * RV20 = annualised stdev (ddof 1, sqrt 252) of the 20 daily log returns of Yahoo closes ending the last close BEFORE the
    print (INTC/AMZN: 10/29; GOOGL/MSFT: 10/28). Same definition as rv20(p, t-1) in earnings_analysis.py. Gate = 1.3 x RV20.
  * Ex-event IV from the pre-print chain: ATM IV per expiry = mean of call and put Cboe IV at the two strikes bracketing the
    close, interpolated linearly. OLS of total variance IV^2 * T on T (T = calendar days from the quote date) over expiries
    on or after the reaction day with T <= 60: slope = ex-event variance, intercept = event variance. Variant: T >= 4 only.
  * Post-print IV calibration: on the reaction-day close chain (10/29) of GOOGL and MSFT, the mean Cboe IV of the 11/20 puts
    with |delta| 0.30-0.45, divided by that name's pre-print ex-event IV. INTC/AMZN expected put IV = their ex-event IV x
    that ratio (low = min, high = max of the two ratios and of both regression variants).
  * Contract preview: Black-Scholes, r = ^IRX close 10/29 / 100, q = 0, entry at Fri 10/30 close, T = calendar days to
    expiry / 365 (11/20: 21 days; 11/27: 28 days). OI and tonight's quotes from the Cboe chain (pre-print, close quotes).
  * EV per $: earnings_analysis.option_ratio unchanged (delta 0.35, 25 DTE, IV = k x rv_pre at entry and exit, 5 sessions,
    half of a 3% spread each way) over the pre-registered down-gap >= 8% sample, with k = expected IV / RV20. Sensitivities:
    21 DTE, the chosen strike's delta, a 5% spread, exit IV 10% below entry IV, 2010-2026, and the post-hoc >= 10% cell.
  * Added after the first run (before any conclusion was written): a stress case of 1.15x the central IV, because the
    calibration rests on two names only; and a strike picker over entry spots of -10%..+7% around the after-hours print
    (OI >= 1000, |delta| 0.30-0.45 nearest 0.375, model ask = mid + half of a 5% spread <= 4.00; 'x2' if <= 2.00).
"""
import csv
import importlib.util
import json
import math
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from statistics import NormalDist
from zoneinfo import ZoneInfo

import numpy as np

ET = ZoneInfo('America/New_York')
N = NormalDist()
OCC = re.compile(r'^([A-Z]+)(\d{6})([CP])(\d{8})$')
TOOLKIT = Path('/home/user/temp/trading-experiment')
EA_PATH = TOOLKIT / 'research/strategy-review/scripts/earnings_analysis.py'
YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=6mo&includeAdjustedClose=true'
CBOE = 'https://cdn.cboe.com/api/global/delayed_quotes/options/{sym}.json'
# After-hours prints from the brief (Robinhood extended hours, 17:15 ET 10/29; NOT closes)
AH = {'INTC': 74.62, 'AMZN': 229.16}
PRE_CLOSE_DAY = date(2026, 10, 29)
ENTRY = date(2026, 10, 30)
GATE_X = 1.3
STRESS = 1.15


# ------------------------------------------------------------------ data
def fetch(data_dir):
    sys.path.insert(0, str(TOOLKIT))
    import quotes  # noqa: E402  (toolkit HTTP client with the proxy CA set up)
    for s in ('INTC', 'AMZN', 'GOOGL', 'MSFT', '%5EIRX'):
        p = data_dir / f'y_{s}.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(YAHOO.format(sym=s))))
    for s in ('INTC', 'AMZN', 'GOOGL', 'MSFT'):
        p = data_dir / f'{s}_chain.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(CBOE.format(sym=s))))


def yahoo_closes(path):
    r = json.loads(Path(path).read_text())['chart']['result'][0]
    out = {}
    for t, c in zip(r['timestamp'], r['indicators']['quote'][0]['close']):
        if c:
            out[datetime.fromtimestamp(t, tz=timezone.utc).astimezone(ET).date()] = float(c)
    return out


def rv20(closes, end):
    ds = sorted(d for d in closes if d <= end)[-21:]
    assert ds[-1] == end, f'no close on {end}'
    lr = np.diff(np.log([closes[d] for d in ds]))
    return float(np.std(lr, ddof=1) * math.sqrt(252)), ds[0], ds[-1]


def load_chain(path):
    d = json.loads(Path(path).read_text())
    rows = []
    for o in d['data']['options']:
        u, e, cp, k = OCC.match(o['option']).groups()
        rows.append({'sym': o['option'], 'exp': date(2000 + int(e[:2]), int(e[2:4]), int(e[4:])), 'cp': cp,
                     'K': int(k) / 1000, 'bid': o['bid'] or 0.0, 'ask': o['ask'] or 0.0, 'iv': o['iv'] or 0.0,
                     'delta': o['delta'] or 0.0, 'oi': int(o['open_interest'] or 0), 'vol': int(o['volume'] or 0)})
    meta = {k: v for k, v in d['data'].items() if k != 'options'}
    return d['timestamp'], meta, rows


# ------------------------------------------------------------------ vol
def atm_iv(rows, exp, S):
    r = [x for x in rows if x['exp'] == exp and x['iv'] > 0 and x['bid'] > 0]
    ks = sorted({x['K'] for x in r})
    lo = max([k for k in ks if k <= S], default=None)
    hi = min([k for k in ks if k >= S], default=None)
    if lo is None or hi is None:
        return None
    iv = {k: np.mean([x['iv'] for x in r if x['K'] == k]) for k in (lo, hi)}
    return float(iv[lo]) if hi == lo else float(iv[lo] + (iv[hi] - iv[lo]) * (S - lo) / (hi - lo))


def ex_event(rows, quote_day, react_day, S, tmin=0, tmax=60):
    pts = []
    for e in sorted({x['exp'] for x in rows}):
        T = (e - quote_day).days
        if e < react_day or T < tmin or T > tmax:
            continue
        iv = atm_iv(rows, e, S)
        if iv:
            pts.append((T, iv))
    T = np.array([p[0] for p in pts], float)
    w = np.array([p[1] ** 2 * p[0] for p in pts])
    slope, icpt = np.polyfit(T, w, 1)
    return math.sqrt(max(slope, 0)), math.sqrt(max(icpt, 0) / 365), pts


def band_put_iv(rows, exp, lo=0.30, hi=0.45):
    v = [x for x in rows if x['exp'] == exp and x['cp'] == 'P' and lo <= -x['delta'] <= hi and x['iv'] > 0]
    return float(np.mean([x['iv'] for x in v])), v


def bs_put(S, K, T, sig, r):
    sd = sig * math.sqrt(T)
    d1 = (math.log(S / K) + (r + 0.5 * sig * sig) * T) / sd
    d2 = d1 - sd
    px = K * math.exp(-r * T) * N.cdf(-d2) - S * N.cdf(-d1)
    return px, N.cdf(d1) - 1.0


# ------------------------------------------------------------------ EV (review model, unchanged)
def load_ea():
    spec = importlib.util.spec_from_file_location('earnings_analysis', EA_PATH)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def load_events(path):
    out = []
    with open(path) as fh:
        for r in csv.DictReader(fh):
            try:  # same filter as the review's summarise(): ex5 and base5 present, then rv_pre and ret5 for the option
                g, ret5, rv = float(r['gap']), float(r['ret5']), float(r['rv_pre'])
                ex5, b5 = float(r['ex5']), float(r['base5'])
            except (ValueError, TypeError):
                continue
            if not all(math.isfinite(v) for v in (g, ret5, rv, ex5, b5)):
                continue
            out.append({'tk': r['ticker'], 'd': date.fromisoformat(r['react_date']), 'gap': g, 'ret5': ret5, 'rv': rv})
    return out


def ev(ea, evs, k, dte=25, delta=0.35, half_spread=0.015, exit_mult=1.0):
    ea.HALF_SPREAD = half_spread
    ret = np.array([e['ret5'] for e in evs])
    # cal5 = calendar days spanned by the 5 sessions held, from SPY's session calendar (load_events_with_cal)
    cal = np.array([e['cal5'] for e in evs])
    iv = k * np.array([e['rv'] for e in evs])
    rat = ea.option_ratio(ret, cal, dte, delta, iv, exit_mult * iv, np.zeros(len(evs), bool))
    ea.HALF_SPREAD = 0.015
    return float(rat.mean()), float(np.median(rat)), float((rat > 1).mean())


def breakeven_k(ea, evs, **kw):
    lo, hi = 0.5, 3.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if ev(ea, evs, mid, **kw)[0] > 1.0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


# ------------------------------------------------------------------ main
def main():
    data_dir, events_csv, googl_pre, msft_pre = (Path(a) for a in sys.argv[1:5])
    data_dir.mkdir(parents=True, exist_ok=True)
    fetch(data_dir)
    irx = yahoo_closes(data_dir / 'y_%5EIRX.json')[PRE_CLOSE_DAY] / 100
    print(f'r = ^IRX close {PRE_CLOSE_DAY} = {irx:.4f} (Yahoo)')

    # 1. RV20 and gate
    print('\n== 1. Pre-print RV20 (Yahoo daily closes) and the C1 gate (1.3x) ==')
    rv = {}
    for s, end in (('INTC', PRE_CLOSE_DAY), ('AMZN', PRE_CLOSE_DAY), ('GOOGL', date(2026, 10, 28)), ('MSFT', date(2026, 10, 28))):
        cl = yahoo_closes(data_dir / f'y_{s}.json')
        v, a, b = rv20(cl, end)
        rv[s] = v
        print(f'{s:5} closes {a}..{b} (last {cl[b]:.2f}): RV20 {v:.2%}  gate {GATE_X * v:.1%}')

    # 2a. calibration: pre-print ex-event IV vs reaction-day put IV (GOOGL, MSFT)
    print('\n== 2a. Calibration: reaction-day 11/20 put IV (|delta| 0.30-0.45) / pre-print ex-event IV ==')
    ratios = []
    nov20 = date(2026, 11, 20)
    for s, pre_path, qday in (('GOOGL', googl_pre, date(2026, 10, 28)), ('MSFT', msft_pre, date(2026, 10, 27))):
        ts0, m0, r0 = load_chain(pre_path)
        ts1, m1, r1 = load_chain(data_dir / f'{s}_chain.json')
        post_iv, band = band_put_iv(r1, nov20)
        for tmin in (0, 4):
            sx, E, pts = ex_event(r0, qday, date(2026, 10, 29), m0['close'], tmin=tmin)
            ratios.append(post_iv / sx)
            print(f'{s}: pre chain {ts0} UTC close {m0["close"]}; ex-event IV {sx:.1%}, event move sd {E:.1%} '
                  f'(T>={tmin}, {len(pts)} expiries); post chain {ts1} UTC close {m1["close"]}: band put IV {post_iv:.1%} '
                  f'({", ".join(f"{x["K"]:g}P {x["iv"]:.1%}/{x["delta"]:.2f}" for x in band)}); ratio {post_iv / sx:.2f}; '
                  f'gate {GATE_X * rv[s]:.1%}')
    rlo, rhi = min(ratios), max(ratios)
    print(f'post/ex-event ratio range {rlo:.2f}-{rhi:.2f}')

    # 2b. INTC and AMZN: ex-event IV, expected post-print IV, contracts
    print('\n== 2b. INTC / AMZN: tonight\'s chain (pre-print 16:00 close quotes), ex-event IV, expected entry IV ==')
    exp_iv = {}
    for s in ('INTC', 'AMZN'):
        ts, m, rows = load_chain(data_dir / f'{s}_chain.json')
        sx = []
        for tmin in (0, 4):
            x, E, pts = ex_event(rows, PRE_CLOSE_DAY, ENTRY, m['close'], tmin=tmin)
            sx.append(x)
            print(f'{s}: chain {ts} UTC; close {m["close"]}; Cboe ext-hours last {m["current_price"]} '
                  f'(bid {m["bid"]}/ask {m["ask"]}); ex-event IV {x:.1%}, event sd {E:.1%} (T>={tmin}); '
                  f'ATM IV by expiry ' + ', '.join(f'{T}d {iv:.0%}' for T, iv in pts[:8]))
        lo, hi = min(sx) * rlo, max(sx) * rhi
        mid = float(np.mean(sx)) * float(np.mean(ratios))
        stress = STRESS * mid  # the calibration has only two names; a +15% stress for a stickier post-shock IV
        exp_iv[s] = (lo, mid, hi, stress)
        print(f'{s}: expected 11/20 band-put IV at Fri close {lo:.1%}-{hi:.1%} (central {mid:.1%}; stress x{STRESS} '
              f'{stress:.1%}) vs gate {GATE_X * rv[s]:.1%} -> {"PASSES" if stress <= GATE_X * rv[s] else "AT RISK"} '
              f'(even the stress case); IV/RV20 {mid / rv[s]:.2f}x central, {stress / rv[s]:.2f}x stress; '
              f'tonight\'s pre-print 11/20 ATM IV {atm_iv(rows, nov20, m["close"]):.1%}')
        for exp in (nov20, date(2026, 11, 27)):
            T = (exp - ENTRY).days / 365
            Sah = AH[s]
            print(f'  {exp} (T {(exp - ENTRY).days}d), entry spots: AH {Sah}, -4%, +4%; IV low/central/high')
            ks = sorted({x['K'] for x in rows if x['exp'] == exp and x['cp'] == 'P' and 0.84 * Sah <= x['K'] <= 1.07 * Sah})
            for K in ks:
                q = next(x for x in rows if x['exp'] == exp and x['cp'] == 'P' and x['K'] == K)
                cells = []
                for S in (Sah, 0.96 * Sah, 1.04 * Sah):
                    for iv in (lo, mid, hi):
                        p, d = bs_put(S, K, T, iv, irx)
                        cells.append((S, iv, p, d))
                c = cells[1]
                spr = (q['ask'] - q['bid']) / ((q['ask'] + q['bid']) / 2) if q['bid'] > 0 else float('nan')
                print(f'   {q["sym"]} OI {q["oi"]:6d} | tonight {q["bid"]:.2f}/{q["ask"]:.2f} ({spr:.0%}, IV {q["iv"]:.0%}, '
                      f'd {q["delta"]:.2f}) | @AH {c[0]:.2f} IV {c[1]:.1%}: mid {c[2]:.2f} d {c[3]:.2f}, ask@5% {c[2] * 1.025:.2f}'
                      f' | IV lo/hi mid {cells[0][2]:.2f}/{cells[2][2]:.2f} d {cells[0][3]:.2f}/{cells[2][3]:.2f}'
                      f' | S-4% {cells[4][2]:.2f} d {cells[4][3]:.2f} | S+4% {cells[7][2]:.2f} d {cells[7][3]:.2f}')
            # strike picker: at each entry spot, the OI>=1000 strike with |delta| in 0.30-0.45 nearest 0.375 whose ask
            # (model mid + half of a 5% spread) is <= 4.00 (2 lots if <= 2.00); central and stress IV
            grid = np.arange(0.90, 1.071, 0.01) * Sah
            for iv in (mid, stress):
                picks = []
                for S in grid:
                    best = None
                    for K in ks:
                        q = next(x for x in rows if x['exp'] == exp and x['cp'] == 'P' and x['K'] == K)
                        p, d = bs_put(S, K, T, iv, irx)
                        if q['oi'] >= 1000 and 0.30 <= -d <= 0.45 and p * 1.025 <= 4.00:
                            if best is None or abs(-d - 0.375) < abs(-best[2] - 0.375):
                                best = (K, p, d)
                    picks.append(f'{S:.2f}:' + (f'{best[0]:g}P {best[1] * 1.025:.2f}/d{-best[2]:.2f}'
                                                + ('x2' if best[1] * 1.025 <= 2.00 else '') if best else 'none'))
                print(f'   picker IV {iv:.1%}: ' + '  '.join(picks))
            if s == 'AMZN' and exp == nov20:  # finer view of the -8% gap zone: every in-band OI-qualified strike
                for S in np.arange(212.0, 224.30, 1.0):
                    cells = []
                    for K in ks:
                        q = next(x for x in rows if x['exp'] == exp and x['cp'] == 'P' and x['K'] == K)
                        for iv in (mid, stress):
                            p, d = bs_put(S, K, T, iv, irx)
                            if q['oi'] >= 1000 and 0.30 <= -d <= 0.45:
                                cells.append(f'{K:g}P@{iv:.0%} ask {p * 1.025:.2f} d{-d:.2f}')
                    print(f'   AMZN {S:.2f}: ' + ('; '.join(cells) or 'no strike in band'))
            # spot range that keeps each strike in the delta band (central IV)
            for K in ks:
                inb = [S for S in np.arange(0.85 * Sah, 1.12 * Sah, 0.01 * (1 if s == 'INTC' else 1))
                       if 0.30 <= -bs_put(S, K, T, mid, irx)[1] <= 0.45]
                if inb:
                    print(f'   {K:g}P in band 0.30-0.45 for {s} {min(inb):.2f}-{max(inb):.2f} (IV {mid:.1%})')

    # 3. EV per $ (review model)
    print('\n== 3. EV per $ (earnings_analysis.option_ratio, unchanged) ==')
    ea = load_ea()
    evs_all = load_events_with_cal(events_csv)
    d8 = [e for e in evs_all if e['gap'] <= -0.08]
    d8_late = [e for e in d8 if e['d'] >= date(2010, 1, 1)]
    d10 = [e for e in evs_all if e['gap'] <= -0.10]
    print(f'down >= 8%: n {len(d8)} (2010-26 {len(d8_late)}); down >= 10% (post-hoc) n {len(d10)}')
    print(f'check: k 1.30, model as registered -> EV {ev(ea, d8, 1.3)[0]:.4f} (review: 1.00265)')
    print(f'break-even k: 25 DTE {breakeven_k(ea, d8):.3f}; 21 DTE {breakeven_k(ea, d8, dte=21):.3f}; '
          f'21 DTE 5% spread {breakeven_k(ea, d8, dte=21, half_spread=0.025):.3f}')
    for s in ('INTC', 'AMZN'):
        lo, mid, hi, stress = exp_iv[s]
        for lab, iv in (('low', lo), ('central', mid), ('high', hi), ('stress', stress), ('at gate', GATE_X * rv[s])):
            k = iv / rv[s]
            base = ev(ea, d8, k)
            v21 = ev(ea, d8, k, dte=21, delta=0.38, half_spread=0.025)
            crush = ev(ea, d8, k, dte=21, delta=0.38, half_spread=0.025, exit_mult=0.9)
            late = ev(ea, d8_late, k)
            big = ev(ea, d10, k)
            print(f'{s} {lab:7} IV {iv:.1%} k {k:.2f}: EV {base[0]:.2f} (median {base[1]:.2f}, win {base[2]:.0%}) | '
                  f'21DTE d0.38 5% spread {v21[0]:.2f} | + exit IV -10% {crush[0]:.2f} | 2010-26 {late[0]:.2f} | '
                  f'>=10% post-hoc {big[0]:.2f}')
    # bootstrap CI (month blocks as in the review) for the central INTC case
    rng = np.random.default_rng(7)
    for s in ('INTC', 'AMZN'):
        k = exp_iv[s][1] / rv[s]
        ea.HALF_SPREAD = 0.015
        rat = ea.option_ratio(np.array([e['ret5'] for e in d8]), np.array([e['cal5'] for e in d8]), 25, 0.35,
                              k * np.array([e['rv'] for e in d8]), k * np.array([e['rv'] for e in d8]),
                              np.zeros(len(d8), bool))
        months = sorted({e['d'].strftime('%Y-%m') for e in d8})
        by = {mo: [r for r, e in zip(rat, d8) if e['d'].strftime('%Y-%m') == mo] for mo in months}
        sums = np.array([sum(by[mo]) for mo in months])
        cnts = np.array([len(by[mo]) for mo in months])
        idx = rng.integers(0, len(months), size=(2000, len(months)))
        bm = sums[idx].sum(1) / cnts[idx].sum(1)
        print(f'{s} central k {k:.2f}: EV {rat.mean():.2f}, 95% month-block CI {np.percentile(bm, 2.5):.2f}-'
              f'{np.percentile(bm, 97.5):.2f}')


def load_events_with_cal(path):
    """Events plus cal5. The review's events file has no cal5 column, so it is recomputed exactly as earnings_analysis.py
    does (sessions[t + 5] - sessions[t]) from SPY's session calendar in the review's Yahoo cache, which sits next to the
    events file (<cache>/yahoo/SPY.json)."""
    evs = load_events(path)
    spy = Path(path).parent / 'yahoo' / 'SPY.json'
    d = json.loads(spy.read_text())['chart']['result'][0]
    sessions = sorted({datetime.fromtimestamp(t, tz=timezone.utc).astimezone(ET).date()
                       for t, a in zip(d['timestamp'], d['indicators']['adjclose'][0]['adjclose']) if a})
    pos = {x: i for i, x in enumerate(sessions)}
    out = []
    for e in evs:
        i = pos.get(e['d'])
        if i is None or i + 5 >= len(sessions):
            continue
        e['cal5'] = (sessions[i + 5] - e['d']).days
        out.append(e)
    return out


if __name__ == '__main__':
    main()
