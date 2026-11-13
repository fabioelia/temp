#!/usr/bin/env python3
"""Strategy v4, claims T2 (trend on non-equity ETFs) and T3 (gold sleeve), tested as pre-registered in ../claims.md
under ../../strategy-review/PROTOCOL.md. Results are written up in ../t2-t5.md. Helpers are imported from
../../strategy-v2/scripts/core_equity.py (load, metrics, fmt, BIL_ER) and ../../strategy-v3/scripts/etf_tests.py
(month_ends, simulate, boot).

Run (python -I, stdlib + numpy; both directories hold raw Yahoo v8 chart JSON, untouched):

  python3 -I t2_t3_sleeves.py V2_DATA_DIR V4_DATA_DIR > out.txt

  V2_DATA_DIR = the strategy-v2 cache (SPY_, IRX_, BIL_ files; last bar the 2026-11-06 close).
  V4_DATA_DIR = the new cache, fetched 2026-11-11 with curl -A 'Mozilla/5.0', one file per symbol and decade exactly
    as core_equity.py describes:
    https://query1.finance.yahoo.com/v8/finance/chart/{SYM}?period1={Jan 1 of Y}&period2={min(Jan 1 of Y+10,
    2026-11-07 12:00 UTC)}&interval=1d&events=div%2Csplit&includeAdjustedClose=true   saved as {SYM}_{Y}.json
    GLD, TLT, DBC for Y = 2000, 2010, 2020. period2 matches the v2 cache, so every series ends at the 2026-11-06 close.

Specification (every choice claims.md leaves open, fixed here before any result was computed):
  Common. Total return = Yahoo adjclose. Calendar = SPY sessions; an ETF must have no dates outside them; a SPY
    session missing from an ETF after its first bar carries the last price forward (count printed). Risk-free for
    Sharpe = ^IRX of the previous session / 100 x calendar days / 360. T-bill leg ("T-bills", "BIL", "SGOV") = BIL
    total return from 2007-05-31, before that the ^IRX accrual minus BIL's 0.1353%/yr expense ratio (as
    core_equity.py S2 and etf_tests.py). SPY stands in for VOO (VOO starts 2010-09) and the T-bill leg for SGOV
    (SGOV starts 2020-05). Month end = the last SPY session of a calendar month (2026-11-06 is not one). Weights set
    at a month-end close earn from the next session and drift until the next month end (etf_tests.simulate). Cost =
    rate x one-way turnover (1/2 x sum |target - drifted weight|, T-bill leg included), so a full switch costs the
    rate once; no cost for the first purchase. Halves (claims.md: split at 2015): returns dated <= 2014-12-31 and
    >= 2015-01-01. Sharpe and max drawdown within each period (core_equity.metrics). Bootstrap = etf_tests.boot:
    moving blocks of 63 sessions, 2,000 resamples, seed 20261111; t = Sharpe difference / bootstrap sd.
  T2 (Hurst-Ooi-Pedersen 2017, J. Portfolio Management 44(1), "A Century of Evidence on Trend-Following
    Investing"; the claim fixes one 12-month lookback). For each of GLD, TLT, DBC: at month end m, signal on if the
    ETF's total return from month end m-12 to month end m exceeds the T-bill leg's compounded return over the same
    12 months; on -> 100% ETF, off -> 100% T-bill leg, traded at that month-end close. 10 bps x one-way turnover.
    First signal at the ETF's 13th month-end close. Buy-and-hold = the ETF's total return on the same sessions, no
    cost. Sleeve = 1/3 per ETF slot (each slot the ETF or the T-bill leg by its own signal), rebalanced to 1/3 each
    at every month end, 10 bps x one-way turnover, from the first month end with all three signals (DBC's). Core
    comparison: 80% SPY / 20% sleeve vs 80% SPY / 20% T-bill leg, both rebalanced at the same month-end closes,
    5 bps x one-way turnover at the portfolio level (the sleeve's internal 10 bps is inside its return).
    Verdict: part A = trend Sharpe > buy-and-hold Sharpe for at least 2 of 3 ETFs in the half; part B = the 80/20
    sleeve portfolio's max drawdown smaller than the 80/20 T-bill portfolio's in the half. Claims rule = A and B in
    BOTH halves. PROTOCOL significance = at least 2 of 3 ETFs with a full-sample Sharpe-difference bootstrap t >= 2.
    CONFIRMED = rule + significance; rule without significance = WEAK ("fails significance"); rule failed: REJECTED
    if part A fails in 2015-2026, else WEAK.
  T3 (Erb-Harvey 2013, Financial Analysts Journal 69(4), "The Golden Dilemma"). 80% SPY / 20% GLD vs 80% SPY / 20%
    T-bill leg, both bought at GLD's first close (2004-11-18) and rebalanced to target at every month-end close,
    5 bps x one-way turnover. Verdict: claims rule = Sharpe higher AND max drawdown smaller in BOTH halves; CONFIRMED
    needs the rule plus a full-sample Sharpe-difference bootstrap t >= 2; rule without it = WEAK; rule failed:
    REJECTED if the Sharpe is lower in 2015-2026, else WEAK.
  Information only (no verdict): each ETF's time in market and switches/yr; calendar 2008 and 2022 returns.
  Dollars (write-up): a $50 probe holds the T2 sleeve or GLD instead of $50 of T-bills: CAGR difference x $50 per
    year and max drawdown x $50. A full sleeve is the 20% reserve ($276) of a $1,380 account: the two 80/20
    portfolios' CAGR difference x $1,380 per year and each portfolio's max drawdown x $1,380.
"""
import math
import os
import sys
from datetime import date

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'strategy-v2', 'scripts'))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'strategy-v3', 'scripts'))
import core_equity as ce  # noqa: E402
import etf_tests as et  # noqa: E402

SEED = 20261111
SPLIT15 = date(2014, 12, 31)
ETFS = ('GLD', 'TLT', 'DBC')
T2_COST, T3_COST, CORE_COST = 0.0010, 0.0005, 0.0005
HALVES = ('pre-2015', '2015-2026')


def periods15(ds):
    return (('full', np.ones(len(ds), bool)), ('pre-2015', ds <= SPLIT15), ('2015-2026', ds > SPLIT15))


def table(label, ds, cands, rf, base):
    print(f'\n## {label}: returns dated {ds[0]} .. {ds[-1]}')
    res = {}
    for per, mask in periods15(ds):
        print(f'  [{per}] sessions {mask.sum()}')
        for nm, r in cands.items():
            m = ce.metrics(ds[mask], r[mask], rf[mask])
            res[(nm, per)] = m
            print(f'    {nm:<30} {ce.fmt(m)[:-18]}')
        for nm, r in cands.items():
            if nm == base:
                continue
            d, t, lo, hi = et.boot(r[mask], cands[base][mask], rf[mask], seed=SEED)
            res[(nm, per, 'b')] = (d, t, lo, hi)
            print(f'    Sharpe diff {nm} - {base}: {d:+.3f}  bootstrap t {t:+.2f}  95% CI [{lo:+.3f}, {hi:+.3f}]')
    return res


def cal_year(ds, r, y):
    m = np.array([d.year == y for d in ds])
    return np.prod(1 + r[m]) - 1 if m.any() else float('nan')


def main():
    v2dir, v4dir = sys.argv[1], sys.argv[2]
    sds, _, sadj, _ = ce.load(v2dir, 'SPY')
    ids, iclose, _, _ = ce.load(v2dir, 'IRX')
    bds, _, badj, _ = ce.load(v2dir, 'BIL')
    n = len(sds)
    irx_i = np.searchsorted(ids, sds, side='right') - 1
    rf = np.zeros(n)
    gap = np.array([0] + [(sds[i] - sds[i - 1]).days for i in range(1, n)])
    rf[1:] = iclose[irx_i[:-1]] / 100 * gap[1:] / 360
    cash = rf - ce.BIL_ER * gap / 365
    bmap = dict(zip(bds, badj))
    for i in range(1, n):
        if sds[i - 1] in bmap and sds[i] in bmap:
            cash[i] = bmap[sds[i]] / bmap[sds[i - 1]] - 1
    spy_r = np.concatenate([[0.0], sadj[1:] / sadj[:-1] - 1])
    C = np.cumprod(1 + cash)
    me = et.month_ends(sds)
    pos = {d: i for i, d in enumerate(sds)}
    print(f'SPY {sds[0]}..{sds[-1]} ({n} sessions); ^IRX last {ids[-1]} {iclose[-1]:.3f}%; last month end {sds[me[-1]]}')

    P, R, first = {}, {}, {}
    for s in ETFS:
        ds_, _, a_, _ = ce.load(v4dir, s)
        bad = [d for d in ds_ if d not in pos]
        if bad:
            raise SystemExit(f'{s}: {len(bad)} dates not SPY sessions, first {bad[0]}')
        p = np.full(n, np.nan)
        for d, x in zip(ds_, a_):
            p[pos[d]] = x
        f0 = pos[ds_[0]]
        filled = 0
        for i in range(f0 + 1, n):
            if np.isnan(p[i]):
                p[i] = p[i - 1]
                filled += 1
        r = np.full(n, np.nan)
        r[1:] = p[1:] / p[:-1] - 1
        P[s], R[s], first[s] = p, r, f0
        q = np.nanargmax(np.abs(r))
        print(f'  {s}: {ds_[0]}..{ds_[-1]} n {len(ds_)}; SPY sessions forward-filled {filled}; largest |daily TR| '
              f'{r[q]*100:+.2f}% on {sds[q]}')

    # ------------------------------------------------------------ T2 per ETF
    sig, res2, starts = {}, {}, {}
    for s in ETFS:
        mes = [i for i in me if i >= first[s]]
        sg = {}
        for k in range(12, len(mes)):
            i, j = mes[k], mes[k - 12]
            sg[i] = float(P[s][i] / P[s][j] - 1 > C[i] / C[j] - 1)
        sig[s] = sg
        R2 = np.column_stack([cash, np.nan_to_num(R[s])])
        tr, turn, st = et.simulate(R2, {i: [1 - v, v] for i, v in sg.items()}, T2_COST)
        starts[s] = st
        sl = slice(st, None)
        ds2 = sds[sl]
        yrs = len(ds2) / 252
        tin = np.mean(list(sg.values()))
        sw = sum(1 for a, b in zip(list(sg.values())[:-1], list(sg.values())[1:]) if a != b)
        print(f'\nT2 {s}: first signal {sds[sorted(sg)[0]]}; months in {tin*100:.0f}%; switches/yr {sw/yrs:.2f}; '
              f'current signal (set {sds[sorted(sg)[-1]]}) {"IN" if sg[sorted(sg)[-1]] else "OUT (bills)"}')
        res2[s] = table(f'T2 {s} trend (12m TR > bills, 10 bps) vs buy-and-hold', ds2,
                        {f'{s} buy-and-hold': R[s][sl], f'{s} trend': tr[sl]}, rf[sl], f'{s} buy-and-hold')
        for y in (2008, 2022):
            print(f'    info: {y} return trend {cal_year(ds2, tr[sl], y)*100:+.1f}% vs buy-and-hold '
                  f'{cal_year(ds2, R[s][sl], y)*100:+.1f}%')

    # ------------------------------------------------------------ T2 sleeve and core
    keys = sorted(set(sig['GLD']) & set(sig['TLT']) & set(sig['DBC']))
    k0 = keys[0]
    keys = [i for i in me if i >= k0]
    R4 = np.column_stack([cash] + [np.nan_to_num(R[s]) for s in ETFS])
    tg = {}
    for i in keys:
        w = np.array([sig[s][i] / 3 for s in ETFS])
        tg[i] = np.concatenate([[1 - w.sum()], w])
    sleeve, sturn, sst = et.simulate(R4, tg, T2_COST)
    R3 = np.column_stack([cash, spy_r, sleeve])
    port, pturn, pst = et.simulate(R3, {i: [0.0, 0.8, 0.2] for i in keys}, CORE_COST)
    base, bturn, _ = et.simulate(R3, {i: [0.2, 0.8, 0.0] for i in keys}, CORE_COST)
    sl = slice(pst, None)
    ds3 = sds[sl]
    yrs3 = len(ds3) / 252
    print(f'\nT2 sleeve from {sds[k0]}; sleeve one-way turnover/yr {sum(sturn.values())/yrs3:.2f}; portfolio turnover/yr '
          f'{sum(pturn.values())/yrs3:.2f} vs {sum(bturn.values())/yrs3:.2f}')
    res2c = table('T2 core: 80% SPY / 20% trend sleeve vs 80% SPY / 20% T-bills (5 bps)', ds3,
                  {'80/20 SPY/T-bills': base[sl], '80/20 SPY/trend sleeve': port[sl], 'Sleeve alone (info)': sleeve[sl],
                   'T-bill leg (info)': cash[sl]},
                  rf[sl], '80/20 SPY/T-bills')
    for y in (2008, 2022):
        print(f'    info: {y} return sleeve {cal_year(ds3, sleeve[sl], y)*100:+.1f}%, 80/20 sleeve '
              f'{cal_year(ds3, port[sl], y)*100:+.1f}%, 80/20 bills {cal_year(ds3, base[sl], y)*100:+.1f}%')
    partA = {p: sum(res2[s][(f'{s} trend', p)]['sharpe'] > res2[s][(f'{s} buy-and-hold', p)]['sharpe'] for s in ETFS)
             for p in HALVES}
    partB = {p: bool(res2c[('80/20 SPY/trend sleeve', p)]['mdd'] > res2c[('80/20 SPY/T-bills', p)]['mdd']) for p in HALVES}
    tfull = {s: res2[s][(f'{s} trend', 'full', 'b')][1] for s in ETFS}
    nsig = sum(t >= 2 for t in tfull.values())
    rule = all(partA[p] >= 2 for p in HALVES) and all(partB.values())
    v2v = ('CONFIRMED' if nsig >= 2 else 'WEAK') if rule else ('REJECTED' if partA['2015-2026'] < 2 else 'WEAK')
    print(f'T2 VERDICT: ETFs with higher trend Sharpe pre-2015/2015-2026 {partA["pre-2015"]}/{partA["2015-2026"]} (need 2); '
          f'sleeve maxDD smaller pre/post {[partB[p] for p in HALVES]}; full-sample t '
          + ', '.join(f'{s} {t:+.2f}' for s, t in tfull.items()) + f' ({nsig} >= 2) -> {v2v}')

    # ------------------------------------------------------------ T3
    g0 = first['GLD']
    k3 = [g0] + [i for i in me if i > g0]
    RG = np.column_stack([cash, spy_r, np.nan_to_num(R['GLD'])])
    gp, gturn, gst = et.simulate(RG, {i: [0.0, 0.8, 0.2] for i in k3}, T3_COST)
    bp, bt3, _ = et.simulate(RG, {i: [0.2, 0.8, 0.0] for i in k3}, T3_COST)
    sl = slice(gst, None)
    ds4 = sds[sl]
    print(f'\nT3 first purchase {sds[g0]}; one-way turnover/yr {sum(gturn.values())/(len(ds4)/252):.2f} vs '
          f'{sum(bt3.values())/(len(ds4)/252):.2f}')
    res3 = table('T3 80% SPY / 20% GLD vs 80% SPY / 20% T-bills (5 bps)', ds4,
                 {'80/20 SPY/T-bills': bp[sl], '80/20 SPY/GLD': gp[sl], 'GLD alone (info)': R['GLD'][sl],
                  'SPY alone (info)': spy_r[sl]},
                 rf[sl], '80/20 SPY/T-bills')
    for y in (2008, 2022):
        print(f'    info: {y} return 80/20 GLD {cal_year(ds4, gp[sl], y)*100:+.1f}% vs 80/20 bills '
              f'{cal_year(ds4, bp[sl], y)*100:+.1f}%')
    hi = [bool(res3[('80/20 SPY/GLD', p)]['sharpe'] > res3[('80/20 SPY/T-bills', p)]['sharpe']) for p in HALVES]
    dd = [bool(res3[('80/20 SPY/GLD', p)]['mdd'] > res3[('80/20 SPY/T-bills', p)]['mdd']) for p in HALVES]
    t3 = res3[('80/20 SPY/GLD', 'full', 'b')][1]
    rule3 = all(hi) and all(dd)
    v3v = ('CONFIRMED' if t3 >= 2 else 'WEAK') if rule3 else ('REJECTED' if not hi[1] else 'WEAK')
    print(f'T3 VERDICT: Sharpe higher pre/post {hi}, maxDD smaller pre/post {dd}, full-sample t {t3:+.2f} -> {v3v}')

    # ------------------------------------------------------------ dollars
    print('\n## Dollars: $50 probe (vs $50 of T-bills) and full 20% sleeve on a $1,380 account')
    for lab, res, a, b in (('T2 sleeve', res2c, 'Sleeve alone (info)', 'T-bill leg (info)'),
                           ('T3 GLD', res3, 'GLD alone (info)', None)):
        for per in ('full',) + HALVES:
            ma = res[(a, per)]
            cb = res2c[('T-bill leg (info)', per)]['cagr'] if b else None
            if b is None:  # T-bill CAGR on T3's dates
                msk = dict(periods15(ds4))[per]
                cb = np.prod(1 + cash[sl][msk]) ** (252 / msk.sum()) - 1
            print(f'  {lab} $50 probe [{per}] CAGR {ma["cagr"]*100:.2f}% vs bills {cb*100:.2f}% -> '
                  f'{(ma["cagr"]-cb)*50:+.2f} $/yr; max drawdown ${ma["mdd"]*50:.2f}')
    for lab, res, a in (('T2', res2c, '80/20 SPY/trend sleeve'), ('T3', res3, '80/20 SPY/GLD')):
        for per in ('full',) + HALVES:
            ma, mb = res[(a, per)], res[('80/20 SPY/T-bills', per)]
            print(f'  {lab} full sleeve [{per}] CAGR {ma["cagr"]*100:.2f}% vs {mb["cagr"]*100:.2f}% -> '
                  f'{(ma["cagr"]-mb["cagr"])*1380:+.0f} $/yr on $1,380; max drawdown ${ma["mdd"]*1380:.0f} vs '
                  f'${mb["mdd"]*1380:.0f}')
    print(f'\nSUMMARY: T2 {v2v}; T3 {v3v}')


if __name__ == '__main__':
    main()
