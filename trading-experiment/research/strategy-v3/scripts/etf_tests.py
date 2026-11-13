#!/usr/bin/env python3
"""Strategy v3, claims V2-V4 (sector momentum rotation, volatility-managed core, pre-FOMC drift), tested as
pre-registered in ../claims.md under ../../strategy-review/PROTOCOL.md. Results are written up in ../etf-tests.md.
Helpers (load, metrics, nw_t, periods, SPLIT) are imported from ../../strategy-v2/scripts/core_equity.py.

Run (python -I, stdlib + numpy; both directories hold raw Yahoo v8 chart JSON, untouched):

  python3 -I etf_tests.py V2_DATA_DIR V3_DATA_DIR > out.txt

  V2_DATA_DIR = the strategy-v2 cache (SPY_, IRX_, BIL_ files; last bar the 2026-11-06 close).
  V3_DATA_DIR = the new sector-ETF cache, fetched 2026-11-11 with curl -A 'Mozilla/5.0', one file per symbol and
    decade exactly as core_equity.py describes:
    https://query1.finance.yahoo.com/v8/finance/chart/{SYM}?period1={Jan 1 of Y}&period2={min(Jan 1 of Y+10,
    2026-11-07 12:00 UTC)}&interval=1d&events=div%2Csplit&includeAdjustedClose=true   saved as {SYM}_{Y}.json
    XLB XLE XLF XLI XLK XLP XLU XLV XLY for Y = 1990, 2000, 2010, 2020 (first bar 1998-12-22); XLRE (first bar
    2015-10-08) and XLC (2018-06-19) for Y = 2010, 2020. period2 matches the v2 cache, so every series ends at the
    2026-11-06 close.

Specification (every choice claims.md leaves open, fixed here before any result was computed):
  Common. Total return = Yahoo adjclose. Calendar = SPY sessions. Risk-free for Sharpe = ^IRX of the previous
    session / 100 x calendar days / 360 (as core_equity.py). T-bill leg (what the reserve earns) = BIL total return
    from 2007-05-31, before that ^IRX accrual minus BIL's 0.1353%/yr expense ratio (as core_equity.py S2).
    Month end = the last SPY session of a calendar month; 2026-11-06 is not one. A rebalance happens at a
    month-end close; the new weights earn from the next session on and drift with returns until the next month
    end. Cost = rate x one-way turnover, turnover = 1/2 x sum|target weight - drifted weight| over all holdings
    including the T-bill leg (so a 100% SPY -> bills switch costs the rate once, as v2's "per switch"); it is
    deducted from the first session after the rebalance. No cost for the first purchase (as v2). Halves: returns
    dated <= 2009-12-31 / >= 2010-01-01 (core_equity.periods). Sharpe = mean daily excess / sd x sqrt 252;
    max drawdown within the period (core_equity.metrics).
  Bootstrap. Moving-block bootstrap of the paired daily returns, block 63 sessions, 2,000 resamples, seed
    20261111: Sharpe difference, its bootstrap t (difference / bootstrap sd) and the 2.5-97.5 percentile CI.
  V2 sector momentum (Moskowitz & Grinblatt 1999, J. Finance 54(4), "Do Industries Explain Momentum?").
    Universe: the 9 original Select Sector SPDRs from 1999, then XLRE and XLC as soon as each has a signal.
    Signal at month end m: total return from the close of month end m-12 to month end m-1 (12 months, skip the
    most recent 1); an ETF needs a close at both. Hold the top 3, 1/3 each, from the month-end-m close to the next
    month end (the signal is known a month earlier, so no look-ahead). Cost 10 bps x one-way turnover (PROTOCOL's
    10 bp large-cap round trip). First formation 1999-12-31, so the pre-2010 half is 2000-01..2009-12.
    Benchmark: SPY total return, buy-and-hold, same sessions. Verdict: CONFIRMED only if, in BOTH halves, the
    rotation's Sharpe is higher than SPY's AND the half's 95% bootstrap CI of the difference excludes zero;
    REJECTED if its Sharpe is not higher in 2010-2026; otherwise WEAK. Max drawdowns are reported.
    Labelled sensitivity (information only, no verdict): cost doubled to 20 bps.
  V3 volatility-managed core (Moreira & Muir 2017, J. Finance 72(4), "Volatility-Managed Portfolios"), as the claim
    states it: the vol ratio, not M&M's variance ratio. At month end m: realized vol = population sd of SPY's daily
    total returns of the sessions of month m x sqrt 252; SPY weight = min(1, target / realized vol), the rest in
    the T-bill leg, traded at that month-end close (the claim's "at the month-end close"). First rebalance at the
    first full month (1993-02-26). Target vol: fixed once, by bisection, so the session-weighted mean SPY weight
    over the full sample is 0.80, the "same average exposure" as the fixed 80/20, which is rebalanced to 80% SPY /
    20% T-bill leg at the same closes. Both pay 5 bps x one-way turnover. Verdict, the S2 bar exactly as in
    core_equity.py: rule = Sharpe higher AND max drawdown smaller in BOTH halves; CONFIRMED needs the rule plus a
    full-sample Sharpe-difference bootstrap t >= 2; rule met but t < 2: WEAK; rule failed: REJECTED if its Sharpe
    is lower in 2010-2026, else WEAK. Labelled sensitivities (information only): the target refit within each half
    (mean weight 0.80 in each), and trading at the next close.
  V4 pre-FOMC drift (Lucca & Moench 2015, J. Finance 70(1), "The Pre-FOMC Announcement Drift"). Dates: FOMC_DATES
    below, the last day of every scheduled meeting 1994-2026 from the Federal Reserve's own calendars (unscheduled
    meetings, conference calls, notation votes and the cancelled 2020-03-17/18 meeting excluded; the 2003-09-15
    entry, an agenda only, is part of the 2003-09-16 meeting). Window for announcement day t (session index i):
    the sessions i-1 and i, i.e. the close two sessions before (i-2) to the close on announcement day. Test: OLS of
    SPY daily excess return (total return minus the risk-free) on a constant and a window dummy, Newey-West
    standard errors with lag 5; window excess vs other days = 2 x slope. Net = 2 x slope - 5 bps (one VOO round
    trip per window, PROTOCOL; SGOV's 2 bp spread not charged). Periods: 1994-01-03 on (full), pre-2010,
    2010-2026, and returns dated >= 2016-01-01. Verdict: CONFIRMED only if the net excess is > 0 with t > 2 (t of
    the net excess, same SE) in pre-2010, 2010-2026 and since 2016; REJECTED if the net excess is <= 0 in both
    2010-2026 and since 2016; otherwise WEAK. Also printed: n, mean/median/hit rate/worst of the 2-session window
    return, and (labelled information only) the two sessions separately (t-2->t-1 and t-1->t).
  Dollars (write-up): $1,380 account; V2 replaces the 80% VOO sleeve ($1,104), V3 replaces the whole 80/20
    ($1,380), V4 moves the 20% reserve ($276) into VOO for each window: CAGR difference x sleeve per year, the
    sleeve's max drawdown in dollars, and for V4 windows per year x net (window return minus bills minus 5 bps).

Sources for FOMC_DATES (fetched 2026-11-11):
  https://www.federalreserve.gov/monetarypolicy/fomchistorical{1994..2020}.htm  (one page per year)
  https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm               (2021-2026)
"""
import math
import os
import sys
from datetime import date

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'strategy-v2', 'scripts'))
import core_equity as ce  # noqa: E402

SEED = 20261111
SECTORS = ('XLB', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLU', 'XLV', 'XLY', 'XLRE', 'XLC')
V2_COST, V3_COST, V4_COST = 0.0010, 0.0005, 0.0005
SINCE16 = date(2016, 1, 1)

# Last day of each scheduled FOMC meeting (announcement day), from the Federal Reserve pages cited above.
_FOMC = {
    1994: '0204 0322 0517 0706 0816 0927 1115 1220', 1995: '0201 0328 0523 0706 0822 0926 1115 1219',
    1996: '0131 0326 0521 0703 0820 0924 1113 1217', 1997: '0205 0325 0520 0702 0819 0930 1112 1216',
    1998: '0204 0331 0519 0701 0818 0929 1117 1222', 1999: '0203 0330 0518 0630 0824 1005 1116 1221',
    2000: '0202 0321 0516 0628 0822 1003 1115 1219', 2001: '0131 0320 0515 0627 0821 1002 1106 1211',
    2002: '0130 0319 0507 0626 0813 0924 1106 1210', 2003: '0129 0318 0506 0625 0812 0916 1028 1209',
    2004: '0128 0316 0504 0630 0810 0921 1110 1214', 2005: '0202 0322 0503 0630 0809 0920 1101 1213',
    2006: '0131 0328 0510 0629 0808 0920 1025 1212', 2007: '0131 0321 0509 0628 0807 0918 1031 1211',
    2008: '0130 0318 0430 0625 0805 0916 1029 1216', 2009: '0128 0318 0429 0624 0812 0923 1104 1216',
    2010: '0127 0316 0428 0623 0810 0921 1103 1214', 2011: '0126 0315 0427 0622 0809 0921 1102 1213',
    2012: '0125 0313 0425 0620 0801 0913 1024 1212', 2013: '0130 0320 0501 0619 0731 0918 1030 1218',
    2014: '0129 0319 0430 0618 0730 0917 1029 1217', 2015: '0128 0318 0429 0617 0729 0917 1028 1216',
    2016: '0127 0316 0427 0615 0727 0921 1102 1214', 2017: '0201 0315 0503 0614 0726 0920 1101 1213',
    2018: '0131 0321 0502 0613 0801 0926 1108 1219', 2019: '0130 0320 0501 0619 0731 0918 1030 1211',
    2020: '0129 0429 0610 0729 0916 1105 1216',
    2021: '0127 0317 0428 0616 0728 0922 1103 1215', 2022: '0126 0316 0504 0615 0727 0921 1102 1214',
    2023: '0201 0322 0503 0614 0726 0920 1101 1213', 2024: '0131 0320 0501 0612 0731 0918 1107 1218',
    2025: '0129 0319 0507 0618 0730 0917 1029 1210', 2026: '0128 0318 0429 0617 0729 0916 1028 1209',
}
FOMC_DATES = [date(y, int(s[:2]), int(s[2:])) for y, v in sorted(_FOMC.items()) for s in v.split()]


# ---------------------------------------------------------------- shared helpers
def month_ends(ds):
    return np.array([i for i in range(len(ds) - 1) if ds[i + 1].month != ds[i].month])


def simulate(R, targets, rate):
    """R: sessions x assets daily simple returns (column 0 may be the T-bill leg). targets: {month-end index i:
    weight vector}; weights earn from i+1. Returns (daily portfolio returns, turnover per rebalance dict, start)."""
    n, k = R.shape
    keys = sorted(targets)
    r = np.zeros(n)
    w = None
    turn = {}
    for a, i in enumerate(keys):
        tgt = np.asarray(targets[i], float)
        to = 0.0 if w is None else 0.5 * np.abs(tgt - w).sum()
        turn[i] = to
        w = tgt.copy()
        end = keys[a + 1] if a + 1 < len(keys) else n - 1
        for d in range(i + 1, end + 1):
            rr = np.nan_to_num(R[d])
            g = float(w @ rr)
            r[d] = g - (rate * to if d == i + 1 else 0.0)
            w = w * (1 + rr) / (1 + g)
    return r, turn, keys[0] + 1


def boot(a, b, rf, block=63, reps=2000, seed=SEED):
    rng = np.random.default_rng(seed)
    n = len(a)
    nb = int(math.ceil(n / block))
    xa, xb = a - rf, b - rf

    def sh(x):
        return x.mean(axis=-1) / x.std(axis=-1, ddof=1) * math.sqrt(252)
    d0 = sh(xa) - sh(xb)
    dd = np.empty(reps)
    for k in range(0, reps, 250):
        m = min(250, reps - k)
        st = rng.integers(0, n - block + 1, size=(m, nb))
        idx = (st[:, :, None] + np.arange(block)[None, None, :]).reshape(m, -1)[:, :n]
        dd[k:k + m] = sh(xa[idx]) - sh(xb[idx])
    return d0, d0 / dd.std(ddof=1), np.percentile(dd, 2.5), np.percentile(dd, 97.5)


def table(label, ds, cands, rf, base):
    print(f'\n## {label}: returns dated {ds[0]} .. {ds[-1]}')
    res = {}
    for per, mask in ce.periods(ds):
        print(f'  [{per}] sessions {mask.sum()}')
        for nm, r in cands.items():
            m = ce.metrics(ds[mask], r[mask], rf[mask])
            res[(nm, per)] = m
            print(f'    {nm:<26} {ce.fmt(m)[:-18]}')
        for nm, r in cands.items():
            if nm == base:
                continue
            d, t, lo, hi = boot(r[mask], cands[base][mask], rf[mask])
            res[(nm, per, 'b')] = (d, t, lo, hi)
            print(f'    Sharpe diff {nm} - {base}: {d:+.3f}  bootstrap t {t:+.2f}  95% CI [{lo:+.3f}, {hi:+.3f}]')
    return res


def hac_dummy(y, D, lag=5):
    """OLS y = a + b D; returns b, Newey-West SE of b."""
    X = np.column_stack([np.ones(len(y)), D.astype(float)])
    XtXi = np.linalg.inv(X.T @ X)
    beta = XtXi @ X.T @ y
    e = y - X @ beta
    u = X * e[:, None]
    S = u.T @ u
    for j in range(1, lag + 1):
        G = u[j:].T @ u[:-j]
        S += (1 - j / (lag + 1)) * (G + G.T)
    V = XtXi @ S @ XtXi
    return beta[1], math.sqrt(V[1, 1])


def main():
    v2dir, v3dir = sys.argv[1], sys.argv[2]
    sds, sclose, sadj, _ = ce.load(v2dir, 'SPY')
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
    me = month_ends(sds)
    pos = {d: i for i, d in enumerate(sds)}
    print(f'SPY {sds[0]}..{sds[-1]} ({n} sessions); ^IRX last {ids[-1]} {iclose[-1]:.3f}%; last month end {sds[me[-1]]}')

    # ------------------------------------------------------------ V2
    k = len(SECTORS)
    P = np.full((n, k), np.nan)
    for j, s in enumerate(SECTORS):
        ds_, _, a_, _ = ce.load(v3dir, s)
        bad = [d for d in ds_ if d not in pos]
        if bad:
            raise SystemExit(f'{s}: {len(bad)} dates not SPY sessions, first {bad[0]}')
        for d, x in zip(ds_, a_):
            P[pos[d], j] = x
        r_ = a_[1:] / a_[:-1] - 1
        q = np.argmax(np.abs(r_))
        print(f'  {s}: {ds_[0]}..{ds_[-1]} n {len(ds_)}; largest |daily TR| {r_[q]*100:+.2f}% on {ds_[q+1]}')
    RS = np.full((n, k), np.nan)
    RS[1:] = P[1:] / P[:-1] - 1
    first = np.argmax(~np.isnan(P[:, 0]))
    mes = [i for i in me if i >= first]
    targets, held, nelig = {}, {}, {}
    for m in range(12, len(mes)):
        i, a12, a1 = mes[m], mes[m - 12], mes[m - 1]
        sig = P[a1] / P[a12] - 1
        ok = ~np.isnan(sig)
        order = [j for j in np.argsort(-np.where(ok, sig, -np.inf)) if ok[j]][:3]
        w = np.zeros(k)
        w[order] = 1 / 3
        targets[i] = w
        held[i] = [SECTORS[j] for j in order]
        nelig[i] = int(ok.sum())
    ch =[(sds[i], nelig[i]) for a, i in enumerate(sorted(nelig)) if a == 0 or nelig[i] != nelig[sorted(nelig)[a - 1]]]
    print('V2 eligible-universe changes (formation date, count):', ', '.join(f'{d} {c}' for d, c in ch))
    rot, turn, st = simulate(RS, targets, V2_COST)
    rot2, _, _ = simulate(RS, targets, 2 * V2_COST)
    sl = slice(st, None)
    ds2 = sds[sl]
    yrs = len(ds2) / 252
    to_yr = sum(turn.values()) / yrs
    print(f'V2 first formation {sds[sorted(targets)[0]]}; mean one-way turnover per rebalance '
          f'{np.mean(list(turn.values())[1:]):.3f}, per year {to_yr:.2f} -> cost {to_yr*V2_COST*100:.2f}%/yr')
    cnt = {}
    for v in held.values():
        for s in v:
            cnt[s] = cnt.get(s, 0) + 1
    print('V2 months held: ' + ', '.join(f'{s} {cnt.get(s,0)}' for s in SECTORS))
    v2 = table('V2 sector momentum top-3 (12-1) vs SPY', ds2,
               {'SPY buy-and-hold': spy_r[sl], 'Sector top-3 (10 bps)': rot[sl], 'Sector top-3 (20 bps)*': rot2[sl]},
               rf[sl], 'SPY buy-and-hold')
    hi = [bool(v2[('Sector top-3 (10 bps)', p)]['sharpe'] > v2[('SPY buy-and-hold', p)]['sharpe']) for p in ('pre-2010', '2010-2026')]
    ci = [bool(v2[('Sector top-3 (10 bps)', p, 'b')][2] > 0) for p in ('pre-2010', '2010-2026')]
    v2v = 'CONFIRMED' if all(hi) and all(ci) else ('REJECTED' if not hi[1] else 'WEAK')
    print(f'V2 VERDICT: Sharpe higher pre/post {hi}, CI lower bound > 0 pre/post {ci} -> {v2v}   (* = sensitivity)')
    print(f'V2 holdings formed at {sds[me[-1]]} (information only): {held[me[-1]]}')

    # ------------------------------------------------------------ V3
    R3 = np.column_stack([cash, spy_r])
    rv = {}
    for a in range(1, len(me)):
        x = spy_r[me[a - 1] + 1:me[a] + 1]
        rv[me[a]] = x.std() * math.sqrt(252)
    keys = sorted(rv)
    span = {i: (keys[a + 1] if a + 1 < len(keys) else n - 1) - i for a, i in enumerate(keys)}

    def weights(tgt, ks):
        return {i: min(1.0, tgt / rv[i]) for i in ks}

    def mean_w(tgt, ks):
        w = weights(tgt, ks)
        return sum(w[i] * span[i] for i in ks) / sum(span[i] for i in ks)

    def fit(ks):
        lo, hi_ = 0.001, 2.0
        for _ in range(100):
            mid = (lo + hi_) / 2
            lo, hi_ = (mid, hi_) if mean_w(mid, ks) < 0.80 else (lo, mid)
        return (lo + hi_) / 2

    tgt = fit(keys)
    wv = weights(tgt, keys)
    vm, tvm, st3 = simulate(R3, {i: [1 - w, w] for i, w in wv.items()}, V3_COST)
    fx, tfx, _ = simulate(R3, {i: [0.2, 0.8] for i in keys}, V3_COST)
    # sensitivity: next-close trading (weights earn from i+2)
    vmn, _, _ = simulate(R3, {i + 1: [1 - w, w] for i, w in wv.items() if i + 1 < n - 1}, V3_COST)
    # sensitivity: target refit within each half
    kp = [i for i in keys if sds[i] < date(2009, 12, 31)]
    kq = [i for i in keys if i not in set(kp)]
    tp, tq = fit(kp), fit(kq)
    wh = {**weights(tp, kp), **weights(tq, kq)}
    vmh, _, _ = simulate(R3, {i: [1 - w, w] for i, w in wh.items()}, V3_COST)
    sl3 = slice(st3 + 1, None)  # common start for the next-close sensitivity
    ds3 = sds[sl3]
    yrs3 = len(ds3) / 252
    print(f'\nV3 target vol {tgt*100:.2f}% (full-sample fit; per-half refit* {tp*100:.2f}% / {tq*100:.2f}%); first rebalance '
          f'{sds[keys[0]]}; one-way turnover/yr vol-managed {sum(tvm.values())/yrs3:.2f}, fixed 80/20 {sum(tfx.values())/yrs3:.2f}')
    for per, msk in (('full', np.ones(len(keys), bool)), ('pre-2010', np.array([sds[i] < date(2009, 12, 31) for i in keys])),
                     ('2010-2026', np.array([sds[i] >= date(2009, 12, 31) for i in keys]))):
        ks = [i for i, b in zip(keys, msk) if b]
        ww = np.array([wv[i] for i in ks])
        print(f'  [{per}] session-weighted mean SPY weight {mean_w(tgt, ks):.3f}; months at 100% {np.mean(ww >= 1)*100:.0f}%; '
              f'min weight {ww.min():.2f}')
    v3 = table('V3 vol-managed SPY vs fixed 80/20 (5 bps per turnover)', ds3,
               {'Fixed 80/20': fx[sl3], 'Vol-managed': vm[sl3], 'Vol-managed next-close*': vmn[sl3],
                'Vol-managed per-half fit*': vmh[sl3], 'SPY buy-and-hold (info)': spy_r[sl3]},
               rf[sl3], 'Fixed 80/20')
    hi3 = [bool(v3[('Vol-managed', p)]['sharpe'] > v3[('Fixed 80/20', p)]['sharpe']) for p in ('pre-2010', '2010-2026')]
    dd3 = [bool(v3[('Vol-managed', p)]['mdd'] > v3[('Fixed 80/20', p)]['mdd']) for p in ('pre-2010', '2010-2026')]
    t3 = v3[('Vol-managed', 'full', 'b')][1]
    rule = all(hi3) and all(dd3)
    v3v = ('CONFIRMED' if t3 >= 2 else 'WEAK') if rule else ('REJECTED' if not hi3[1] else 'WEAK')
    print(f'V3 VERDICT: Sharpe higher pre/post {hi3}, maxDD smaller pre/post {dd3}, full-sample t {t3:+.2f} -> {v3v}')
    print(f'V3 weight set at {sds[keys[-1]]} (information only): {wv[keys[-1]]:.2f} (October realized vol {rv[keys[-1]]*100:.1f}%)')

    # ------------------------------------------------------------ V4
    fd = [d for d in FOMC_DATES if d <= sds[-1]]
    missing = [d for d in fd if d not in pos]
    if missing:
        raise SystemExit(f'FOMC dates not SPY sessions: {missing}')
    st4 = pos[next(d for d in sds if d >= date(1994, 1, 1))]
    D = np.zeros(n, bool)
    Dpre = np.zeros(n, bool)
    Dann = np.zeros(n, bool)
    for d in fd:
        i = pos[d]
        D[i - 1:i + 1] = True
        Dpre[i - 1] = True
        Dann[i] = True
    ex = spy_r - rf
    win = np.array([pos[d] for d in fd])
    W = sadj[win] / sadj[win - 2] - 1
    Wb = np.array([np.prod(1 + cash[i - 1:i + 1]) - 1 for i in win])
    wd = np.array(fd)
    print(f'\n## V4 pre-FOMC window (close t-2 -> close t), {len(fd)} scheduled announcements {fd[0]}..{fd[-1]}')
    v4 = {}
    for per, lo_, hi_ in (('full', date(1994, 1, 1), date(2100, 1, 1)), ('pre-2010', date(1994, 1, 1), date(2009, 12, 31)),
                          ('2010-2026', date(2010, 1, 1), date(2100, 1, 1)), ('since 2016', SINCE16, date(2100, 1, 1))):
        msk = np.array([lo_ <= d <= hi_ for d in sds])
        msk[:st4] = False
        y = ex[msk]
        b, se = hac_dummy(y, D[msk])
        g, net = 2 * b, 2 * b - V4_COST
        tg, tn = g / (2 * se), net / (2 * se)
        wm = np.array([lo_ <= d <= hi_ for d in wd])
        x = W[wm]
        base2 = 2 * ex[msk & ~D].mean() + 2 * rf[msk & ~D].mean()
        bp, sp = hac_dummy(y, Dpre[msk])
        ba, sa = hac_dummy(y, Dann[msk])
        per_yr = wm.sum() / (msk.sum() / 252)
        gain = (x - Wb[wm] - V4_COST).mean()
        v4[per] = (net, tn)
        print(f'  [{per}] windows {wm.sum()} ({per_yr:.1f}/yr); window TR mean {x.mean()*100:+.3f}% median {np.median(x)*100:+.3f}% '
              f'hit {np.mean(x>0)*100:.0f}% worst {x.min()*100:+.2f}% ({wd[wm][np.argmin(x)]}); other-days 2-session mean '
              f'{base2*100:+.3f}%')
        print(f'      excess vs other days: gross {g*100:+.3f}% (NW t {tg:+.2f}), net of 5 bps {net*100:+.3f}% (t {tn:+.2f}); '
              f'info*: day t-1 {bp*100:+.3f}% (t {bp/sp:+.2f}), day t {ba*100:+.3f}% (t {ba/sa:+.2f}); '
              f'window minus bills minus 5 bps {gain*100:+.3f}%/window')
    ok = [bool(v4[p][0] > 0 and v4[p][1] > 2) for p in ('pre-2010', '2010-2026', 'since 2016')]
    v4v = 'CONFIRMED' if all(ok) else ('REJECTED' if v4['2010-2026'][0] <= 0 and v4['since 2016'][0] <= 0 else 'WEAK')
    print(f'V4 VERDICT: net > 0 with t > 2 in pre-2010 / 2010-2026 / since 2016: {ok} -> {v4v}')

    # ------------------------------------------------------------ dollars
    print('\n## Dollars for a $1,380 account (V2 sleeve $1,104, V3 $1,380, V4 reserve $276)')
    for lab, res, a, b_, sleeve in (('V2', v2, 'Sector top-3 (10 bps)', 'SPY buy-and-hold', 1104),
                                    ('V3', v3, 'Vol-managed', 'Fixed 80/20', 1380)):
        for per in ('full', 'pre-2010', '2010-2026'):
            ma, mb = res[(a, per)], res[(b_, per)]
            print(f'  {lab} [{per}] CAGR {ma["cagr"]*100:.2f}% vs {mb["cagr"]*100:.2f}% -> {(ma["cagr"]-mb["cagr"])*sleeve:+.0f} $/yr; '
                  f'max drawdown ${ma["mdd"]*sleeve:.0f} vs ${mb["mdd"]*sleeve:.0f}')
    for per in ('full', 'pre-2010', '2010-2026', 'since 2016'):
        lo_ = {'full': date(1994, 1, 1), 'pre-2010': date(1994, 1, 1), '2010-2026': date(2010, 1, 1), 'since 2016': SINCE16}[per]
        hi_ = date(2009, 12, 31) if per == 'pre-2010' else date(2100, 1, 1)
        wm = np.array([lo_ <= d <= hi_ for d in wd])
        g = (W[wm] - Wb[wm] - V4_COST)
        yrs4 = (min(hi_, sds[-1]) - lo_).days / 365.25
        print(f'  V4 [{per}] per window {g.mean()*276:+.2f} $ (worst {g.min()*276:+.2f} $); per year '
              f'{g.sum()/yrs4*276:+.2f} $; of which vs-other-days drift (net) {v4[per][0]*276*wm.sum()/yrs4:+.2f} $')
    print(f'\nSUMMARY: V2 {v2v}; V3 {v3v}; V4 {v4v}')


if __name__ == '__main__':
    main()
