#!/usr/bin/env python3
"""A1-A3 calendar claims (midterm seasonality, Halloween indicator, turn of the month), tested as pre-registered in
../claims.md under ../PROTOCOL.md. Reads the raw Yahoo JSON cached by calendar_fetch.py. Run with python -I:

  python3 -I calendar_tests.py DATA_DIR OUT_CSV

Choices claims.md leaves open, fixed here before any result was computed:
  * A1 statistic: a permutation test of mean(midterm) - mean(other years), 100,000 label shuffles, seed 20261029. The
    protocol's |t| >= 2 and |t| >= 3 thresholds are applied to the normal-equivalent z of the two-sided permutation p
    (|z| >= 2 <=> p <= 0.0455). Welch t is reported alongside.
  * A1 baseline: every non-midterm year 1950-2025 over the same calendar window, using its own 'election day' (the
    Tuesday after the first Monday in November). 2026 is excluded everywhere.
  * A2 pairs May-Oct of year Y with Nov(Y)-Apr(Y+1), Y = 1950-2025.
  * A3 ToM = the last trading day of a month plus its first 3 trading days (Lakonishok-Smidt days -1..+3).
  * Costs: 5 bps per SPY round trip. A1/A2: one round trip per window. A3: one per month (in at the close of day -2,
    out at the close of day +3), i.e. 1.25 bps per ToM day.
  * Options translation (PROTOCOL rule 6; not listed in claims.md, so it can only block a CONFIRMED): a
    30-calendar-day, delta-0.40 call on ^GSPC. Black-Scholes with r = q = 0 and IV = the VIX close at entry. It is
    re-priced at exit with the days remaining and that day's VIX. Buy at mid x 1.015, sell at mid x 0.985. A1(c): the
    Oct 31 -> Nov 18 window, 1990-2025. A3: the day -2 close -> day +3 close, 1990-2026. Baseline: the same contract
    bought at every session close and held the same number of sessions.
  * Reading of the PROTOCOL verdicts: |t| < 1 is 'no effect' (REJECTED); 1 <= |t| < 2 with the right sign is 'fails
    significance' (WEAK); a 2010-2026 effect of the wrong sign is 'exists only in early data' (REJECTED); the right
    sign at under half the full-sample size is 'decayed' (WEAK). 'Survives costs' = the net excess is > 0 in the full
    sample and in 2010-2026.
Post-hoc rows are labelled 'POST-HOC' in the test column.
"""
import bisect
import csv
import glob
import json
import math
import os
import sys
from datetime import date, datetime, timedelta, timezone
from statistics import NormalDist

import numpy as np

ND = NormalDist()
TODAY = date(2026, 10, 29)
SEED = 20261029
NPERM = 100_000
COST_RT = 0.05      # percent per SPY round trip
HALF_SPREAD = 0.015  # half of a 3% option spread, paid each way
DTE, DELTA = 30, 0.40
MIDTERMS = set(range(1950, 2026, 4))  # 1950, 1954, ..., 2022
ROWS = []


# ---------------------------------------------------------------- data
def load(data_dir, sym, adjusted):
    rows = {}
    for p in sorted(glob.glob(os.path.join(data_dir, f'calendar_{sym}_*.json'))):
        with open(p) as f:
            res = json.load(f)['chart']['result'][0]
        if res['meta'].get('dataGranularity') != '1d':
            raise SystemExit(f'{p}: not daily bars')
        ts = res.get('timestamp') or []
        col = res['indicators']['quote'][0]['close']
        if adjusted:
            col = (res['indicators'].get('adjclose') or [{}])[0].get('adjclose') or col
        for t, c in zip(ts, col):
            d = datetime.fromtimestamp(t, timezone.utc).date()
            if c is not None and c > 0 and d < TODAY:
                rows[d] = float(c)
    dates = sorted(rows)
    return dates, np.array([rows[d] for d in dates])


def on_or_before(dates, d):
    return bisect.bisect_right(dates, d) - 1


def strictly_before(dates, d):
    return bisect.bisect_left(dates, d) - 1


def election_day(y):
    nov1 = date(y, 11, 1)
    return nov1 + timedelta(days=(0 - nov1.weekday()) % 7 + 1)  # Tuesday after the first Monday


# ---------------------------------------------------------------- statistics
def permutation(s, b, rng):
    pool = np.concatenate([s, b])
    k, n = len(s), len(pool)
    obs = s.mean() - b.mean()
    idx = np.argsort(rng.random((NPERM, n)), axis=1)[:, :k]
    sk = pool[idx].sum(1)
    diffs = sk / k - (pool.sum() - sk) / (n - k)
    p1 = (np.sum(diffs >= obs - 1e-12) + 1) / (NPERM + 1)
    p2 = (np.sum(np.abs(diffs) >= abs(obs) - 1e-12) + 1) / (NPERM + 1)
    z = math.copysign(ND.inv_cdf(1 - p2 / 2), obs)
    return p1, p2, z


def welch(s, b):
    se = math.sqrt(s.var(ddof=1) / len(s) + b.var(ddof=1) / len(b))
    return (s.mean() - b.mean()) / se, se


def row(claim, test, series, period, s, b=None, t=None, p1=None, p2=None, z=None, net=None, note='', worst=None):
    s = np.asarray(s, float)
    r = dict(claim=claim, test=test, series=series, period=period, n=len(s), mean_pct=s.mean(),
             median_pct=float(np.median(s)), hit_pos_pct=100 * (s > 0).mean(),
             worst_pct=s.min() if worst is None else worst)
    if b is not None:
        b = np.asarray(b, float)
        r.update(base_n=len(b), base_mean_pct=b.mean(), base_median_pct=float(np.median(b)),
                 base_hit_pos_pct=100 * (b > 0).mean(), hit_vs_base_median_pct=100 * (s > np.median(b)).mean(),
                 excess_pct=s.mean() - b.mean())
    r.update(t_stat=t, p_perm_one_sided=p1, p_perm_two_sided=p2, z_equiv=z, net_excess_pct=net, note=note)
    ROWS.append(r)
    return r


# ---------------------------------------------------------------- options model
def bs_call(S, K, T, sig):
    if T <= 0:
        return max(S - K, 0.0)
    v = sig * math.sqrt(T)
    d1 = (math.log(S / K) + 0.5 * v * v) / v
    return S * ND.cdf(d1) - K * ND.cdf(d1 - v)


def call_trade(dates, px, vix, i0, i1):
    """EV per $ of a 30 DTE delta-0.40 call bought at the close of i0 and sold at the close of i1."""
    S0, sig0, T0 = px[i0], vix(dates[i0]), DTE / 365
    v = sig0 * math.sqrt(T0)
    K = S0 * math.exp(-(ND.inv_cdf(DELTA) * v - 0.5 * v * v))
    c0 = bs_call(S0, K, T0, sig0)
    T1 = (DTE - (dates[i1] - dates[i0]).days) / 365
    c1 = bs_call(px[i1], K, T1, vix(dates[i1]))
    return c1 * (1 - HALF_SPREAD) / (c0 * (1 + HALF_SPREAD))


def make_vix(vdates, vpx):
    def f(d):
        i = on_or_before(vdates, d)
        if i < 0:
            raise KeyError(d)
        return vpx[i] / 100
    return f


# ---------------------------------------------------------------- A1
def a1(dates, px, rng):
    out = {}
    windows = {
        '(a) close before election -> Apr 30': lambda y: (strictly_before(dates, election_day(y)),
                                                          on_or_before(dates, date(y + 1, 4, 30))),
        '(b) close before election -> +11 sessions': lambda y: (strictly_before(dates, election_day(y)),
                                                                strictly_before(dates, election_day(y)) + 11),
        '(c) Oct 31 -> Nov 18': lambda y: (on_or_before(dates, date(y, 10, 31)), on_or_before(dates, date(y, 11, 18))),
        'POST-HOC (b2) close before election -> +12 sessions (= 11/18 in 2026)':
            lambda y: (strictly_before(dates, election_day(y)), strictly_before(dates, election_day(y)) + 12),
    }
    periods = {'full 1950-2025': (1950, 2025), 'pre-2010 1950-2009': (1950, 2009), '2010-2026': (2010, 2025),
               'last 10y 2016-2025': (2016, 2025)}
    for test, fn in windows.items():
        rets = {}
        for y in range(1950, 2026):
            i0, i1 = fn(y)
            rets[y] = 100 * (px[i1] / px[i0] - 1)
        out[test] = rets
        for pname, (y0, y1) in periods.items():
            s = np.array([rets[y] for y in range(y0, y1 + 1) if y in MIDTERMS])
            b = np.array([rets[y] for y in range(y0, y1 + 1) if y not in MIDTERMS])
            if len(s) < 3:
                row('A1', test, '^GSPC', pname, s, b, note=f'n={len(s)} midterms: too few for a test; descriptive only')
                continue
            t, _ = welch(s, b)
            p1, p2, z = permutation(s, b, rng)
            wy = min((y for y in range(y0, y1 + 1) if y in MIDTERMS), key=lambda y: rets[y])
            row('A1', test, '^GSPC', pname, s, b, t=t, p1=p1, p2=p2, z=z, net=s.mean() - b.mean() - COST_RT,
                note=f't = Welch; verdict uses z_equiv from the permutation p; worst midterm {wy}; midterm years ' +
                     ' '.join(f'{y}:{rets[y]:+.1f}' for y in range(y0, y1 + 1) if y in MIDTERMS and y >= 2010))
    return out


def a1_options(dates, px, vix):
    ev = {}
    for y in range(1990, 2026):
        i0, i1 = on_or_before(dates, date(y, 10, 31)), on_or_before(dates, date(y, 11, 18))
        ev[y] = call_trade(dates, px, vix, i0, i1)
    s = np.array([ev[y] for y in ev if y in MIDTERMS])
    b = np.array([ev[y] for y in ev if y not in MIDTERMS])
    start = on_or_before(dates, date(1990, 1, 2)) + 1
    rand = np.array([call_trade(dates, px, vix, i, i + 13) for i in range(start, len(dates) - 13)])
    t, _ = welch(s, b)
    row('A1', 'OPTIONS (c) 30DTE d0.40 call Oct31->Nov18, % on premium', '^GSPC+VIX', '1990-2025', 100 * (s - 1),
        100 * (b - 1), t=t,
        note=f'% return on premium after spreads (EV/$ = 1 + mean/100): midterm EV/$ {s.mean():.3f}, other years '
             f'{b.mean():.3f}, random 13-session entry {rand.mean():.3f} (n={len(rand)}); 2010-2022 midterms ' +
             ' '.join(f'{y}:{ev[y]:.2f}' for y in ev if y in MIDTERMS and y >= 2010))
    return s, b, rand


# ---------------------------------------------------------------- A2
def a2(dates, px):
    d, na, mo = {}, {}, {}
    for y in range(1950, 2026):
        ia, io, ia1 = (on_or_before(dates, date(y, 4, 30)), on_or_before(dates, date(y, 10, 31)),
                       on_or_before(dates, date(y + 1, 4, 30)))
        mo[y] = 100 * (px[io] / px[ia] - 1)
        na[y] = 100 * (px[ia1] / px[io] - 1)
        d[y] = na[y] - mo[y]
    periods = {'full 1950-2025': (1950, 2025), '1950-1989': (1950, 1989), '1990-2009': (1990, 2009),
               '2010-2026': (2010, 2025), 'last 10y 2016-2025': (2016, 2025)}
    for pname, (y0, y1) in periods.items():
        ys = range(y0, y1 + 1)
        x = np.array([d[y] for y in ys])
        t = x.mean() / (x.std(ddof=1) / math.sqrt(len(x)))
        wy = min(ys, key=lambda y: d[y])
        row('A2', 'Nov-Apr minus May-Oct, per year', '^GSPC', pname, x, t=t, net=x.mean() - COST_RT,
            note=f'Nov-Apr mean {np.mean([na[y] for y in ys]):+.2f}%, May-Oct mean {np.mean([mo[y] for y in ys]):+.2f}%; '
                 f'worst year {wy} (May-Oct {mo[wy]:+.1f}%, Nov-Apr {na[wy]:+.1f}%); May-Oct 2026 excluded (no Nov-Apr pair yet)')
    return d


# ---------------------------------------------------------------- A3
def tom_flags(dates):
    n = len(dates)
    k = np.zeros(n, int)
    last = np.zeros(n, bool)
    for i, d in enumerate(dates):
        k[i] = 1 if i == 0 or (dates[i - 1].year, dates[i - 1].month) != (d.year, d.month) else k[i - 1] + 1
        if i + 1 < n:
            last[i] = (dates[i + 1].year, dates[i + 1].month) != (d.year, d.month)
        else:  # final bar: month-end only if no weekday is left in the month
            nxt = d + timedelta(days=1)
            while nxt.weekday() >= 5:
                nxt += timedelta(days=1)
            last[i] = nxt.month != d.month
    return k, last


def a3(dates, px, series, periods):
    k, last = tom_flags(dates)
    tom = last | (k <= 3)
    r = np.full(len(px), np.nan)
    r[1:] = 100 * (px[1:] / px[:-1] - 1)
    darr = np.array(dates)
    res = {}
    for pname, (d0, d1) in periods.items():
        m = (darr >= d0) & (darr <= d1) & ~np.isnan(r)
        s, b = r[m & tom], r[m & ~tom]
        t, se = welch(s, b)
        net = s.mean() - COST_RT / 4 - b.mean()
        lr = np.log1p(r[m] / 100)
        share = 100 * np.log1p(s / 100).sum() / lr.sum()
        yrs = (min(d1, dates[-1]) - max(d0, dates[0])).days / 365.25
        row('A3', 'ToM day (-1..+3) vs other days, daily return', series, pname, s, b, t=t, net=net,
            note=f'ToM days {100 * len(s) / (len(s) + len(b)):.1f}% of days carry {share:.0f}% of the log return; '
                 f'net t {net / se:.2f}; ToM-only CAGR gross {100 * (math.exp(np.log1p(s / 100).sum() / yrs) - 1):.2f}% '
                 f'vs buy-hold {100 * (math.exp(lr.sum() / yrs) - 1):.2f}% (price only)')
        res[pname] = (s.mean() - b.mean(), s, b)
    # window version vs random entry: close of day -2 -> close of day +3, one trade per month
    idx_last = np.where(last)[0]
    win = [(i - 1, i + 3) for i in idx_last if i - 1 >= 0 and i + 3 < len(dates) and k[i + 3] == 3]
    four = 100 * (px[4:] / px[:-4] - 1)
    for pname, (d0, d1) in periods.items():
        w = np.array([100 * (px[j] / px[i] - 1) for i, j in win if d0 <= dates[i] <= d1])
        base = np.array([four[i] for i in range(len(four)) if d0 <= dates[i] <= d1])
        t = (w.mean() - base.mean()) / (w.std(ddof=1) / math.sqrt(len(w)))
        row('A3', 'ToM 4-session window (close -2 -> close +3) vs any 4 sessions', series, pname, w, base, t=t,
            net=w.mean() - COST_RT - base.mean(), note='baseline = all overlapping 4-session windows; one trade/month')
    return res, tom, r, win


def a3_options(dates, px, vix, win):
    start = on_or_before(dates, date(1990, 1, 2)) + 1
    s = np.array([call_trade(dates, px, vix, i, j) for i, j in win if dates[i] >= dates[start]])
    rand = np.array([call_trade(dates, px, vix, i, i + 4) for i in range(start, len(dates) - 4)])
    late = np.array([call_trade(dates, px, vix, i, j) for i, j in win if dates[i] >= date(2010, 1, 1)])
    rand_late = np.array([call_trade(dates, px, vix, i, i + 4) for i in range(len(dates) - 4) if dates[i] >= date(2010, 1, 1)])
    t = (s.mean() - rand.mean()) / (s.std(ddof=1) / math.sqrt(len(s)))
    row('A3', 'OPTIONS ToM 30DTE d0.40 call close -2 -> close +3, % on premium', '^GSPC+VIX', '1990-2026',
        100 * (s - 1), 100 * (rand - 1), t=t,
        note=f'% return on premium after spreads (EV/$ = 1 + mean/100): ToM EV/$ {s.mean():.3f} vs random 4-session '
             f'entry {rand.mean():.3f}; 2010-2026 ToM EV/$ {late.mean():.3f} (n={len(late)}) vs random '
             f'{rand_late.mean():.3f}')
    return s, rand, late, rand_late


# ---------------------------------------------------------------- verdicts (the docstring's reading of PROTOCOL.md)
def find(claim, test, period):
    return next(r for r in ROWS if r['claim'] == claim and r['test'] == test and r['period'] == period)


def verdict(full, late, use_z=False, ev=None):
    eff = lambda r: r['excess_pct'] if 'excess_pct' in r else r['mean_pct']  # noqa: E731
    st = full['z_equiv'] if use_z else full['t_stat']
    ef, el = eff(full), eff(late)
    if ef <= 0:
        return 'REJECTED', 'opposite sign in the full sample'
    if abs(st) < 1:
        return 'REJECTED', f'no effect (|t| {abs(st):.2f} < 1)'
    if el <= 0:
        return 'REJECTED', f'2010-2026 sign is wrong ({el:+.4f}): exists only in early data'
    why = []
    if st < 2:
        why.append(f'fails significance (t {st:.2f} < 2)')
    if el < 0.5 * ef:
        why.append(f'decayed: 2010-2026 {el:+.5f} < half of full {ef:+.5f}')
    if not (full['net_excess_pct'] > 0 and late['net_excess_pct'] > 0):
        why.append('fails costs')
    if ev is not None and ev <= 1:
        why.append(f'options EV/$ {ev:.3f} <= 1.0')
    if why:
        return 'WEAK', '; '.join(why)
    return 'CONFIRMED', 'all criteria met' + (' at |t| >= 3' if st >= 3 else '; 2 <= |t| < 3 is only suggestive')


# ---------------------------------------------------------------- main
def main():
    data_dir, out_csv = sys.argv[1], sys.argv[2]
    rng = np.random.default_rng(SEED)
    gd, gp = load(data_dir, 'GSPC', False)
    sd, sp = load(data_dir, 'SPY', True)
    vd, vp = load(data_dir, 'VIX', False)
    vix = make_vix(vd, vp)
    print(f'^GSPC {gd[0]}..{gd[-1]} n={len(gd)}; SPY {sd[0]}..{sd[-1]} n={len(sd)}; VIX {vd[0]}..{vd[-1]} n={len(vd)}')
    sat = sum(d.weekday() == 5 for d in gd)
    gaps = max((b - a).days for a, b in zip(gd, gd[1:]))
    print(f'^GSPC Saturday bars: {sat}; largest calendar gap {gaps} days')

    a1r = a1(gd, gp, rng)
    a1o = a1_options(gd, gp, vix)
    a2r = a2(gd, gp)
    gper = {'full 1950-2026': (date(1950, 1, 1), TODAY), '1950-1989': (date(1950, 1, 1), date(1989, 12, 31)),
            '1990-2009': (date(1990, 1, 1), date(2009, 12, 31)), '2010-2026': (date(2010, 1, 1), TODAY),
            'last 10y': (date(2016, 10, 29), TODAY)}
    sper = {'full 1993-2026': (date(1993, 1, 1), TODAY), '1993-2009': (date(1993, 1, 1), date(2009, 12, 31)),
            '2010-2026': (date(2010, 1, 1), TODAY), 'last 10y': (date(2016, 10, 29), TODAY)}
    a3g, tom, gr, gwin = a3(gd, gp, '^GSPC', gper)
    a3s, _, _, _ = a3(sd, sp, 'SPY', sper)
    a3o = a3_options(gd, gp, vix, gwin)

    # ------------------------------------------------ window implications (10/30 close -> 11/18 close = 13 sessions)
    spy_now = sp[-1]
    darr = np.array(gd)
    r13 = 100 * (gp[13:] / gp[:-13] - 1)
    late = darr[:-13] >= date(2010, 1, 1)
    sd13_full, sd13_late = r13.std(ddof=1), r13[late].std(ddof=1)
    mu13_full, mu13_late = r13.mean(), r13[late].mean()
    sd13_vix = vp[-1] * math.sqrt(13 / 252)
    print(f'\n13-session ^GSPC return: mean {mu13_full:+.2f}% sd {sd13_full:.2f}% (1950-2026); '
          f'mean {mu13_late:+.2f}% sd {sd13_late:.2f}% (2010-2026); VIX {vp[-1]:.2f} implies sd {sd13_vix:.2f}%; '
          f'SPY last close {spy_now:.2f} ({sd[-1]})')
    for name, s13, m13 in (('1950-2026', sd13_full, mu13_full), ('2010-2026', sd13_late, mu13_late)):
        row('WINDOW', '13-session return, any start', '^GSPC', name, r13 if name[0] == '1' else r13[late],
            note=f'sd {s13:.2f}%; SPY points per 1% = {spy_now / 100:.2f}; VIX-implied sd now {sd13_vix:.2f}%')
    imp = []
    c = a1r['(c) Oct 31 -> Nov 18']
    for pname, y0, m13 in (('1950-2025', 1950, mu13_full), ('2010-2025', 2010, mu13_late)):
        x = np.array([c[y] for y in range(y0, 2026)])
        row('A1', 'POST-HOC all years Oct 31 -> Nov 18 vs any 13 sessions (not a pre-registered claim)', '^GSPC', pname,
            x, t=(x.mean() - m13) / (x.std(ddof=1) / math.sqrt(len(x))), net=x.mean() - m13 - COST_RT,
            note=f'baseline = mean of all overlapping 13-session returns ({m13:+.3f}%); includes the ToM days')
    sess_a = np.mean([on_or_before(gd, date(y + 1, 4, 30)) - strictly_before(gd, election_day(y)) for y in range(1950, 2026)])
    ex_a = find('A1', '(a) close before election -> Apr 30', 'full 1950-2025')['excess_pct']
    imp.append((f'A1(a) excess pro-rated to 13 of its {sess_a:.0f} sessions', '1950-2025', ex_a * 13 / sess_a))
    for pname, (y0, y1) in (('1950-2025', (1950, 2025)), ('2010-2025', (2010, 2025))):
        s = np.mean([c[y] for y in range(y0, y1 + 1) if y in MIDTERMS])
        b = np.mean([c[y] for y in range(y0, y1 + 1) if y not in MIDTERMS])
        a = np.mean([c[y] for y in range(y0, y1 + 1)])
        imp.append(('A1(c) midterm minus other years, Oct31->Nov18', pname, s - b))
        imp.append(('A1(c) all years Oct31->Nov18 minus any 13 sessions', pname, a - (mu13_full if y0 == 1950 else mu13_late)))
    for pname, d0 in (('1950-2026', date(1950, 1, 1)), ('2010-2026', date(2010, 1, 1))):
        m = (darr >= d0) & ~np.isnan(gr)
        mon = np.array([d.month for d in gd])
        winter = np.isin(mon, [11, 12, 1, 2, 3, 4])
        imp.append(('A2 13 x (Nov-Apr minus May-Oct mean daily return)', pname,
                    13 * (gr[m & winter].mean() - gr[m & ~winter].mean())))
        key = 'full 1950-2026' if d0.year == 1950 else '2010-2026'
        imp.append(('A3 3 x ToM excess (days +1..+3 = 11/2-11/4)', pname, 3 * a3g[key][0]))
    print('\nWindow implications (percentage points of 13-session return; SPY $ points at last close):')
    for name, pname, v in imp:
        sdv = sd13_full if pname.startswith('1950') else sd13_late
        print(f'  {name:58s} {pname:10s} {v:+.2f} pp = {v / 100 * spy_now:+.1f} SPY pts = {v / sdv:+.2f} sd')
        ROWS.append(dict(claim='WINDOW', test=name, series='^GSPC', period=pname, excess_pct=v,
                         note=f'{v / 100 * spy_now:+.1f} SPY points at {spy_now:.2f}; {v / sdv:+.2f} x the 13-session sd '
                              f'({sdv:.2f}%)'))

    # ------------------------------------------------ verdicts
    print('\nVerdicts:')
    jobs = [('A1', '(a) close before election -> Apr 30', 'full 1950-2025', '2010-2026', True, None, '^GSPC'),
            ('A1', '(b) close before election -> +11 sessions', 'full 1950-2025', '2010-2026', True, None, '^GSPC'),
            ('A1', '(c) Oct 31 -> Nov 18', 'full 1950-2025', '2010-2026', True, a1o[0].mean(), '^GSPC'),
            ('A2', 'Nov-Apr minus May-Oct, per year', 'full 1950-2025', '2010-2026', False, None, '^GSPC'),
            ('A3', 'ToM day (-1..+3) vs other days, daily return', 'full 1950-2026', '2010-2026', False, a3o[0].mean(),
             '^GSPC'),
            ('A3', 'ToM day (-1..+3) vs other days, daily return', 'full 1993-2026', '2010-2026', False, a3o[0].mean(),
             'SPY')]
    for claim, test, pf, pl, use_z, ev, series in jobs:
        full = next(r for r in ROWS if r['claim'] == claim and r['test'] == test and r['period'] == pf and r['series'] == series)
        late = next(r for r in ROWS if r['claim'] == claim and r['test'] == test and r['period'] == pl and r['series'] == series)
        v, why = verdict(full, late, use_z, ev)
        print(f'  {claim} {test} [{series}]: {v} - {why}')
        ROWS.append(dict(claim=claim, test='VERDICT ' + test, series=series, period=f'{pf} / {pl}', verdict=v, note=why))

    # ------------------------------------------------ print + csv
    cols = ['claim', 'test', 'series', 'period', 'verdict', 'n', 'mean_pct', 'median_pct', 'hit_pos_pct', 'worst_pct',
            'base_n', 'base_mean_pct', 'base_median_pct', 'base_hit_pos_pct', 'hit_vs_base_median_pct', 'excess_pct',
            't_stat', 'p_perm_one_sided', 'p_perm_two_sided', 'z_equiv', 'net_excess_pct', 'note']
    print()
    for r in ROWS:
        if r['claim'] == 'WINDOW' or 'verdict' in r:
            continue
        f = lambda k, fmt='{:+.3f}': '' if r.get(k) is None else fmt.format(r[k])  # noqa: E731
        print(f"{r['claim']} | {r['test'][:62]:62s} | {r['series']:9s} | {r['period']:18s} | n {r['n']:5d} "
              f"mean {f('mean_pct')} med {f('median_pct')} hit {f('hit_pos_pct', '{:.0f}')}% worst {f('worst_pct', '{:+.2f}')} "
              f"|| base n {f('base_n', '{}')} mean {f('base_mean_pct')} hit {f('base_hit_pos_pct', '{:.0f}')}% "
              f">base-med {f('hit_vs_base_median_pct', '{:.0f}')}% || ex {f('excess_pct')} t {f('t_stat', '{:+.2f}')} "
              f"p1 {f('p_perm_one_sided', '{:.4f}')} p2 {f('p_perm_two_sided', '{:.4f}')} z {f('z_equiv', '{:+.2f}')} "
              f"net {f('net_excess_pct')}\n      {r['note']}")
    with open(out_csv, 'w', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        for r in ROWS:
            w.writerow({k: (round(v, 5) if isinstance(v, (float, np.floating)) else v) for k, v in
                        ((k, r.get(k)) for k in cols)})
    print(f'\nwrote {out_csv} ({len(ROWS)} rows)')


if __name__ == '__main__':
    main()
