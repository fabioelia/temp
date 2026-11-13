#!/usr/bin/env python3
"""options-vol, Mon 2026-11-09 (Run B). Input for the committee, not a recommendation.

Q1  Refresh the C1 Kelly ceiling (research/2026-11-08/scripts/ov_1108.py q1, unchanged engine) on tonight's real equity $1,383.25 and the
    actual SGOV reserve $265.00 (2.636818 SGOV x 100.50; brief 11/09), at 14/21/28/35 DTE (the C1 band from Fri 11/13: 11/27, 12/04,
    12/11, 12/18 expiries) and k = IV / pre-print RV20 0.80-1.30. Binding size = min(full Kelly, reserve); ask ceiling = that / 100.
    Same 5% spread sensitivity, bootstrap P(f*=0) (catalyst_watch.boot_p0) and the k thresholds. POST-HOC (labelled): the reaction-day
    ^VIX <= 22 slice, since ^VIX closed 19.92 tonight (the 11/08 note quoted the > 22 slice).
    CSCO one-contract check: RV20 (ddof 1, sqrt 252, adjusted closes, the catalyst_1106 method) rolled forward with the 11/09 official
    close 98.65 (quotes.py closes, yahoo+cboe); a post-gap spot at the trigger 0.92 x 98.65; Black-Scholes 35-DTE put at |delta|
    0.30/0.35/0.40 on the 2.50 strike grid, r 4.0%, q 0, ask = BS x 1.025; does one contract fit the ceiling at k = IV / RV20?

Q2  Tuesday's CPI (08:30 ET). SPY 11/10 ATM straddle from tonight's Cboe chain (quotes.py chain, typed in below with its source): implied
    move vs ^VIX's mean absolute day. Context only: a 1-session straddle breaks the DTE (14-35), delta (0.30-0.45) and single-leg rules,
    and the earliest fill under the execution protocol is Tuesday's close, after the print.
    Descriptive baseline (no CPI dates are available offline; BLS and ALFRED could not be reached): EV per $ (before spread) of a
    1-session ATM straddle at tonight's implied z on EVERY ^GSPC day, z1 = |r_t| / (^VIX_{t-1} / 100 / sqrt 252), as macro_1105.py.

Run (from /home/user/temp):
  python3 -I <this> <earnings_cache> <vix_csv> <gspc_csv> <csco_yahoo_json>
"""
import csv
import importlib.util
import json
import math
import sys
from datetime import date, datetime, timezone
from pathlib import Path

import numpy as np

R = Path('/home/user/temp/trading-experiment')
EQ = 1383.25
RESERVE = 265.00
KS = (0.80, 0.90, 1.00, 1.10, 1.15, 1.20, 1.25, 1.30)
DTES = (14, 21, 28, 35)
CSCO_1109 = 98.65          # quotes.py closes --date 2026-11-09: yahoo+cboe official close, 2 sources, spread 0.00%


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def q1(cache, vix_csv, csco_json):
    sizing = load(R / 'research/strategy-review/scripts/sizing.py', 'sizing')
    cw = load(R / 'research/2026-11-01/scripts/catalyst_watch.py', 'catalyst_watch')
    ovg = load(R / 'research/2026-10-29/scripts/options_vol_gate.py', 'options_vol_gate')
    pay = cw.Payoffs(sizing, cache)
    print(f'Q1  C1 payoffs n {len(pay.ret)}; equity ${EQ:,.2f}; reserve ${RESERVE:,.2f}')
    print('cell = full Kelly $ (EV per $) / ask ceiling per share = min(full, reserve) / 100')
    print('k     ' + ''.join(f'{d:>24d}' for d in DTES))
    grid = {}
    for k in KS:
        cells = []
        for d in DTES:
            rr = pay(k, dte=d)
            full = sizing.kelly(rr) * EQ
            grid[(k, d)] = full
            cells.append(f'${full:4.0f} ({rr.mean():.3f}) <={min(full, RESERVE) / 100:4.2f}')
        print(f'{k:.2f}  ' + ''.join(f'{c:>24s}' for c in cells))
    print('5% spread (half 2.5%): ' + '; '.join(
        f'{d} DTE k {k:.2f} ${sizing.kelly(pay(k, dte=d, half_spread=0.025)) * EQ:.0f}' for d in (14, 35) for k in (0.9, 1.0, 1.15)))
    print('bootstrap P(f*=0) at k 1.0: ' + ', '.join(f'{d} DTE {cw.boot_p0(sizing, pay(1.0, dte=d)):.0%}' for d in DTES))
    for d in DTES:
        ks = np.arange(0.70, 1.4001, 0.01)
        fulls = [sizing.kelly(pay(k, dte=d)) * EQ for k in ks]
        k_res = max((k for k, f in zip(ks, fulls) if f >= RESERVE), default=float('nan'))
        k_zero = min((k for k, f in zip(ks, fulls) if f <= 0), default=float('nan'))
        print(f'  {d} DTE: full Kelly >= reserve up to k {k_res:.2f}; $0 from k {k_zero:.2f}')

    # POST-HOC: reaction-day ^VIX split (tonight 19.92)
    sys.path.insert(0, str(R / 'research/2026-10-30/scripts'))
    import c1_vix_split as vs
    vix = vs.load_vix(vix_csv)
    rows = [r for r in vs.build_rows(Path(cache)) if r['gap'] <= -0.08]
    ok = [r for r in rows if not any(math.isnan(r.get(k, float('nan'))) for k in ('ret5', 'cal5', 'rv_pre'))]
    assert len(ok) == len(pay.ret)
    v = np.array([vix.get(r['react_date'], np.nan) for r in ok])
    assert not np.isnan(v).any()
    lo = v <= 22
    print(f'\nPOST-HOC reaction-day ^VIX <= 22: n {lo.sum()} of {len(ok)}')
    for d in (14, 35):
        print(f'  {d} DTE: ' + '; '.join(
            f'k {k:.1f} ${sizing.kelly(pay(k, dte=d)[lo]) * EQ:.0f} ({pay(k, dte=d)[lo].mean():.3f})' for k in (0.9, 1.0, 1.1, 1.2, 1.3)))

    # CSCO one-contract check
    res = json.load(open(csco_json))['chart']['result'][0]
    ts = [datetime.fromtimestamp(t, tz=timezone.utc).date() for t in res['timestamp']]
    adj = res['indicators']['adjclose'][0]['adjclose']
    px = [(d, a) for d, a in zip(ts, adj) if a is not None]
    assert px[-1][0] == date(2026, 11, 6), px[-1]
    c = np.array([a for _, a in px] + [CSCO_1109])
    lr = np.diff(np.log(c))
    rv_1106 = np.std(lr[-21:-1], ddof=1) * math.sqrt(252)
    rv_1109 = np.std(lr[-20:], ddof=1) * math.sqrt(252)
    print(f'\nCSCO RV20 to 11/06 {rv_1106:.2%} (catalyst 11/08 printed 38.90%); with the 11/09 close {CSCO_1109} (+{CSCO_1109 / c[-2] - 1:.2%}): '
          f'{rv_1109:.2%}; 1.3x gate {1.3 * rv_1109:.1%}')
    S = round(0.92 * CSCO_1109, 2)
    T = 35 / 365
    print(f'Post-gap spot at the trigger, 0.92 x {CSCO_1109} = {S}; 35 DTE (12/18), r 4%, ask = BS x 1.025; ceiling = min(full Kelly 35 DTE, reserve)')
    for k in (0.9, 1.0, 1.1, 1.2, 1.3):
        iv = k * rv_1109
        full = sizing.kelly(pay(k, dte=35)) * EQ
        cap = min(full, RESERVE) / 100
        out = []
        for tgt in (0.30, 0.35, 0.40):
            best = None
            for K in np.arange(60, 110.01, 2.5):
                p, dl = ovg.bs_put(S, K, T, iv, 0.04)
                if best is None or abs(-dl - tgt) < abs(-best[2] - tgt):
                    best = (K, p, dl)
            K, p, dl = best
            ask = p * 1.025
            out.append(f'{K:.1f}P d {dl:.2f} ask {ask:.2f} {"FITS" if ask <= cap else "no"}')
        print(f'  k {k:.1f} (IV {iv:.1%}): ceiling {cap:.2f} | ' + ' | '.join(out))
    print('Cheapest in-band (|delta| 0.30-0.45) 12/18 strike on the 2.50 grid, by gap depth and k (ask = BS x 1.025 vs ceiling):')
    for g in (0.92, 0.89, 0.86, 0.83):
        s = g * CSCO_1109
        out = []
        for k in (0.8, 0.85, 0.9, 1.0, 1.1):
            iv = k * rv_1109
            cap = min(sizing.kelly(pay(k, dte=35)) * EQ, RESERVE) / 100
            band = []
            for K in np.arange(60, 110.01, 2.5):
                p, dl = ovg.bs_put(s, K, T, iv, 0.04)
                if 0.30 <= -dl <= 0.45:
                    band.append((p * 1.025, K, dl))
            a, K, dl = min(band)
            out.append(f'k {k:.2f}: {K:.1f}P d {dl:.2f} ask {a:.2f} vs {cap:.2f} {"FITS" if a <= cap else "no"}')
        print(f'  gap {g - 1:+.0%} (spot {s:.2f}): ' + ' | '.join(out))


def q2(gspc_csv, vix_csv):
    # Cboe delayed chain via quotes.py chain SPY --expiry 2026-11-10 (fetched 2026-11-09 evening; Monday closing quotes, single source)
    K, cb, ca, pb, pa = 753.0, 3.13, 3.15, 2.93, 2.95
    spot, vix0 = 752.69, 19.92  # brief snapshot: SPY official close (yahoo+cboe), ^VIX (Yahoo)
    cm, pm = (cb + ca) / 2, (pb + pa) / 2
    fwd = K + cm - pm
    st = cm + pm - abs(fwd - K)
    pct = st / fwd
    day_sd = vix0 / 100 / math.sqrt(252)
    z_imp = pct / day_sd
    print(f'\nQ2  SPY 11/10 {K:.0f} straddle: C {cb}/{ca} P {pb}/{pa}; parity spot {fwd:.2f}; straddle {st:.2f} = {pct:.2%} '
          f'(ask {ca + pa:.2f} = ${100 * (ca + pa):,.0f} vs reserve ${RESERVE:.0f}); ^VIX {vix0} mean |day| {0.798 * day_sd:.2%}; implied z {z_imp:.3f}; '
          f'implied annualized {pct / 0.798 * math.sqrt(252):.1%}')
    g, v = {}, {}
    for path, out in ((gspc_csv, g), (vix_csv, v)):
        with open(path) as fh:
            for r in csv.DictReader(fh):
                if r['close'] not in ('', 'None'):
                    out[date.fromisoformat(r['date'])] = float(r['close'])
    ds = sorted(set(g) & set(v))
    z, vx, yr = [], [], []
    for a, b in zip(ds[:-1], ds[1:]):
        z.append(abs(math.log(g[b] / g[a])) / (v[a] / 100 / math.sqrt(252)))
        vx.append(v[a])
        yr.append(b.year)
    z, vx, yr = np.array(z), np.array(vx), np.array(yr)
    print(f'   every ^GSPC day {ds[1]}..{ds[-1]} (D1-style baseline; not CPI days):')
    for name, m in (('all', np.ones(len(z), bool)), ('2011+', yr >= 2011), ('prior ^VIX 18-22', (vx >= 18) & (vx <= 22)),
                    ('2011+ & ^VIX 18-22', (yr >= 2011) & (vx >= 18) & (vx <= 22))):
        zz = z[m]
        print(f'   {name:20s} n {m.sum():5d}: mean z1 {zz.mean():.3f}, EV/$ at the mid {zz.mean() / z_imp:.3f}, '
              f'share of days the straddle pays {np.mean(zz > z_imp):.0%}')


if __name__ == '__main__':
    q1(sys.argv[1], sys.argv[2], sys.argv[4])
    q2(sys.argv[3], sys.argv[2])
