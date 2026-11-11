#!/usr/bin/env python3
"""Strategy v4, claims T4 (same-month seasonality) and T5 (long-only stock momentum), tested as pre-registered in
../claims.md under ../../strategy-review/PROTOCOL.md. Results are written up in ../t2-t5.md. Helpers are imported
from ../../strategy-v2/scripts/core_equity.py (load, nw_t, BIL_ER) and ../../strategy-v3/scripts/etf_tests.py
(month_ends).

Run (python -I, stdlib + numpy; the data directories hold raw downloads, untouched):

  python3 -I t4_t5_stocks.py V2_DATA_DIR V4_DATA_DIR MEMBERS_TSV > out.txt

  V2_DATA_DIR = the strategy-v2 cache (SPY_, IRX_, BIL_ files; last bar the 2026-11-06 close).
  V4_DATA_DIR = the new cache, fetched 2026-11-11 with curl -A 'Mozilla/5.0', one file per symbol and decade exactly
    as core_equity.py describes (period2 = 2026-11-07 12:00 UTC, so the last bar is the 2026-11-06 close):
    https://query1.finance.yahoo.com/v8/finance/chart/{SYM}?period1={Jan 1 of Y}&period2={min(Jan 1 of Y+10,
    2026-11-07 12:00 UTC)}&interval=1d&events=div%2Csplit&includeAdjustedClose=true   saved as {SYM}_{Y}.json
    for every member and Y = 1990, 2000, 2010, 2020. Yahoo answers HTTP 400 for a decade before a listing; such
    chunks are skipped (counted in the output).
  MEMBERS_TSV = today's S&P 100, parsed from the "Components" table of https://en.wikipedia.org/wiki/S%26P_100
    (fetched 2026-11-11; the table is marked "as of September 21, 2026"): 101 symbols. Yahoo symbols replace '.'
    with '-' (BRK.B -> BRK-B). GOOG is dropped and GOOGL kept, one share class per company, so 100 companies.

Survivorship (stated, not corrected): the universe is today's members, i.e. the companies that grew or stayed large
  enough to be in the S&P 100 in 2026. Every backtest month before 2026 therefore picks from future survivors and
  omits names that shrank, were acquired or failed. This biases both tests upward against SPY. As information only,
  each test also reports its excess over an equal-weight portfolio of the same eligible survivors (no cost), which
  carries the same bias, so the top-5 selection's own contribution is the excess over that portfolio.

Specification (every choice claims.md leaves open, fixed here before any result was computed):
  Monthly grid. Month end = the last SPY session of a calendar month (etf_tests.month_ends; 2026-11-06 is not
    one). Data window (claims.md: monthly total returns 1995-2026): month ends 1994-12-30 .. 2026-10-30, so the
    first monthly return is January 1995 and the last October 2026. A stock's month-end price = Yahoo adjclose of
    its last bar on or before the SPY month end, only if that bar is in the same calendar month (else missing).
    Monthly total return = ratio of consecutive month-end prices - 1, missing if either is missing. SPY monthly
    total return the same way from SPY adjclose. Risk-free (Sharpe only) = ^IRX accrual compounded over the month.
  Portfolio. At formation month end m: rank the eligible stocks, hold the top 5 at 20% each from the m close to the
    m+1 close (no look-ahead: every input is known at the m close). Cost = 10 bps x one-way turnover, turnover =
    1/2 x sum |20% target - drifted weight| over old and new holdings; no cost for the first purchase. Net month
    return = mean of the 5 returns - cost. A held stock with a missing holding-month return earns 0 (count printed).
    Excess = net month return - SPY's month return.
  T5 momentum 12-1 (Geczy-Samonov 2016, Financial Analysts Journal 72(5), "Two Centuries of Price-Return
    Momentum"; Blitz, Hanauer, Vidojevic 2020, J. Portfolio Management 46(6), on long legs): signal = total return
    from month end m-12 to month end m-1; eligible = prices at m-12, m-1 and m. First formation 1995-12-29
    (first holding month January 1996).
  T4 same-month seasonality (Keloharju, Linnainmaa, Nyberg 2016, J. Finance 71(4), "Return Seasonalities"): for
    holding month m+1 with calendar month M, signal = the mean of the stock's returns in calendar month M over all
    earlier years from 1995 (an expanding window); eligible = at least 10 such returns and a price at m. First
    holding month January 2005 (ten Januaries, 1995-2004).
  Periods (by holding month): full; pre-2010 (holding months <= 2009-12); 2010-2026 (>= 2010-01); since 2016
    (information only, PROTOCOL's last 10 years). Statistics: n, mean, median, hit rate, worst month of the
    monthly excess; t = mean / (sd / sqrt n) (non-overlapping months; Newey-West lag 3 printed as information);
    CAGR, Sharpe (monthly excess over the risk-free x sqrt 12) and max drawdown of the monthly equity curves;
    turnover per year.
  Verdict (claims.md + PROTOCOL): CONFIRMED only if the mean excess is > 0 with t > 2 in BOTH halves, the
    full-sample t >= 2, and the 2010-2026 mean is at least half the full-sample mean; REJECTED if the 2010-2026
    mean excess is <= 0; otherwise WEAK. "Right sign in both halves" (probe admission) is printed separately.
  Information only (no verdict): the excess with no cost; the excess over the equal-weight eligible-survivor
    portfolio; the November 2026 holdings each rule would form at the 2026-10-30 close.
  Dollars (write-up): a $50 probe ($10 x 5) instead of $50 of VOO: CAGR difference x $50 per year, worst monthly
    excess x $50, max drawdown x $50. A full sleeve replaces the 80% VOO sleeve of a $1,380 account ($1,104): CAGR
    difference x $1,104 per year and max drawdown x $1,104 vs SPY's.

POST-HOC (added 2026-11-11 AFTER the results were seen; information only, it changes no test and no verdict, and
  the registered output above it is byte-identical): a placebo that holds the 5 WORST-ranked eligible names under
  the same rules and costs, with its excess over SPY and the top-5-minus-bottom-5 spread (t as above).
"""
import glob
import json
import math
import os
import sys
from datetime import date, datetime, timezone

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'strategy-v2', 'scripts'))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'strategy-v3', 'scripts'))
import core_equity as ce  # noqa: E402
import etf_tests as et  # noqa: E402

COST = 0.0010
TOPN = 5
GRID0 = date(1994, 12, 30)
SPLIT = date(2009, 12, 31)
SINCE16 = date(2016, 1, 1)
MIN_SEASON = 10


def load_safe(data_dir, sym):
    """core_equity.load, but chunks Yahoo refused (no result / no bars) are skipped and counted."""
    rows, skipped = {}, 0
    for f in sorted(glob.glob(os.path.join(data_dir, f'{sym}_*.json'))):
        try:
            res = (json.load(open(f)).get('chart') or {}).get('result')
        except ValueError:
            res = None
        if not res or not res[0].get('timestamp'):
            skipped += 1
            continue
        res = res[0]
        if res['meta'].get('dataGranularity') != '1d':
            raise SystemExit(f'{f}: not daily')
        off = res['meta'].get('gmtoffset', 0)
        q = res['indicators']['quote'][0]
        adj = res['indicators'].get('adjclose', [{}])[0].get('adjclose') or [None] * len(res['timestamp'])
        for t, c, a in zip(res['timestamp'], q['close'], adj):
            if c is None:
                continue
            rows[datetime.fromtimestamp(t + off, timezone.utc).date()] = a if a is not None else c
    ds = sorted(rows)
    return np.array(ds), np.array([rows[d] for d in ds], float), skipped


def month_prices(ds, a, grid):
    out = np.full(len(grid), np.nan)
    if len(ds) == 0:
        return out
    idx = np.searchsorted(ds, grid, side='right') - 1
    for k, (g, i) in enumerate(zip(grid, idx)):
        if i >= 0 and ds[i].year == g.year and ds[i].month == g.month:
            out[k] = a[i]
    return out


def run(name, grid, A, Rm, spy_m, rf_m, syms, rank_fn, first_form):
    """rank_fn(m) -> (signal array over stocks, eligible mask). Returns per-holding-month records."""
    recs = []
    wd = None
    miss = 0
    for m in range(first_form, len(grid) - 1):
        h = m + 1
        sigv, ok = rank_fn(m)
        if ok.sum() < TOPN:
            continue
        order = [j for j in np.argsort(-np.where(ok, sigv, -np.inf)) if ok[j]][:TOPN]
        tgt = {j: 1.0 / TOPN for j in order}
        if wd is None:
            to = 0.0
        else:
            keys = set(tgt) | set(wd)
            to = 0.5 * sum(abs(tgt.get(j, 0.0) - wd.get(j, 0.0)) for j in keys)
        rr = []
        for j in order:
            x = Rm[j, h]
            if np.isnan(x):
                miss += 1
                x = 0.0
            rr.append(x)
        rr = np.array(rr)
        gross = rr.mean()
        net = gross - COST * to
        wd = {j: (1.0 / TOPN) * (1 + x) / (1 + gross) for j, x in zip(order, rr)}
        ewset = ok & ~np.isnan(Rm[:, h])
        ew = Rm[ewset, h].mean()
        recs.append(dict(d=grid[h], gross=gross, net=net, spy=spy_m[h], rf=rf_m[h], to=to, ew=ew,
                         held=[syms[j] for j in order], nelig=int(ok.sum())))
    print(f'\n## {name}: holding months {recs[0]["d"]} .. {recs[-1]["d"]} ({len(recs)}); eligible names at the first / last '
          f'formation {recs[0]["nelig"]} / {recs[-1]["nelig"]}; held stocks with a missing month return (earned 0): {miss}')
    return recs


def stats(recs, label):
    d = np.array([r['d'] for r in recs])
    net = np.array([r['net'] for r in recs])
    gross = np.array([r['gross'] for r in recs])
    spy = np.array([r['spy'] for r in recs])
    rf = np.array([r['rf'] for r in recs])
    ew = np.array([r['ew'] for r in recs])
    to = np.array([r['to'] for r in recs])
    out = {}
    print(f'  {"period":<11}{"n":>4} {"mean xs":>8} {"median":>7} {"hit":>5} {"t":>6} {"NW3 t":>6} {"worst":>7} | '
          f'{"CAGR":>6} {"SPY":>6} {"Sharpe":>6} {"SPY":>5} {"maxDD":>7} {"SPY":>7} | {"gross xs":>8} {"t":>5} | '
          f'{"xs vs EW":>8} {"t":>5} | {"TO/yr":>5}')
    for per, mask in (('full', np.ones(len(d), bool)), ('pre-2010', d <= SPLIT), ('2010-2026', d > SPLIT),
                      ('since 2016', d >= SINCE16)):
        if mask.sum() < 12:
            continue
        x = net[mask] - spy[mask]
        n = len(x)
        t = x.mean() / (x.std(ddof=1) / math.sqrt(n))
        g = gross[mask] - spy[mask]
        tg = g.mean() / (g.std(ddof=1) / math.sqrt(n))
        e = net[mask] - ew[mask]
        te = e.mean() / (e.std(ddof=1) / math.sqrt(n))

        def curve(r):
            eq = np.concatenate([[1.0], np.cumprod(1 + r)])
            return eq[-1] ** (12 / len(r)) - 1, (eq / np.maximum.accumulate(eq) - 1).min()

        def sharpe(r):
            z = r - rf[mask]
            return z.mean() / z.std(ddof=1) * math.sqrt(12)
        c, dd = curve(net[mask])
        cs, dds = curve(spy[mask])
        out[per] = dict(n=n, mean=x.mean(), t=t, cagr=c, cagr_spy=cs, mdd=dd, mdd_spy=dds, worst=x.min())
        print(f'  {per:<11}{n:>4} {x.mean()*100:>7.2f}% {np.median(x)*100:>6.2f}% {np.mean(x>0)*100:>4.0f}% {t:>6.2f} '
              f'{ce.nw_t(x, 3):>6.2f} {x.min()*100:>6.1f}% | {c*100:>5.1f}% {cs*100:>5.1f}% {sharpe(net[mask]):>6.2f} '
              f'{sharpe(spy[mask]):>5.2f} {dd*100:>6.1f}% {dds*100:>6.1f}% | {g.mean()*100:>7.2f}% {tg:>5.2f} | '
              f'{e.mean()*100:>7.2f}% {te:>5.2f} | {to[mask].sum()/(n/12):>5.1f}')
    ok = [bool(out[p]['mean'] > 0 and out[p]['t'] > 2) for p in ('pre-2010', '2010-2026')]
    full = out['full']
    conf = all(ok) and full['t'] >= 2 and out['2010-2026']['mean'] >= 0.5 * full['mean']
    v = 'CONFIRMED' if conf else ('REJECTED' if out['2010-2026']['mean'] <= 0 else 'WEAK')
    sign = all(out[p]['mean'] > 0 for p in ('pre-2010', '2010-2026'))
    print(f'{label} VERDICT: mean excess > 0 with t > 2 pre-2010 / 2010-2026 {ok}; full t {full["t"]:+.2f}; '
          f'right sign in both halves {sign} -> {v}')
    return out, v


def main():
    v2dir, v4dir, members = sys.argv[1], sys.argv[2], sys.argv[3]
    sds, _, sadj, _ = ce.load(v2dir, 'SPY')
    ids, iclose, _, _ = ce.load(v2dir, 'IRX')
    n = len(sds)
    irx_i = np.searchsorted(ids, sds, side='right') - 1
    rf = np.zeros(n)
    gap = np.array([0] + [(sds[i] - sds[i - 1]).days for i in range(1, n)])
    rf[1:] = iclose[irx_i[:-1]] / 100 * gap[1:] / 360
    me = et.month_ends(sds)
    gi = np.array([i for i in me if sds[i] >= GRID0])
    grid = sds[gi]
    spy_p = sadj[gi]
    spy_m = np.concatenate([[np.nan], spy_p[1:] / spy_p[:-1] - 1])
    lrf = np.concatenate([[0.0], np.cumsum(np.log1p(rf[1:]))])
    rf_m = np.concatenate([[np.nan], np.exp(lrf[gi[1:]] - lrf[gi[:-1]]) - 1])
    print(f'SPY {sds[0]}..{sds[-1]}; monthly grid {grid[0]} .. {grid[-1]} ({len(grid)} month ends)')

    raw = [l.split('\t')[0].strip() for l in open(members) if l.strip()]
    syms = [s.replace('.', '-') for s in raw if s != 'GOOG']
    print(f'Universe: {len(raw)} listed symbols, {len(syms)} after dropping GOOG')
    A = np.full((len(syms), len(grid)), np.nan)
    info, skipped = [], 0
    for j, s in enumerate(syms):
        ds_, a_, sk = load_safe(v4dir, s)
        skipped += sk
        if len(ds_) == 0:
            print(f'  {s}: NO DATA')
            continue
        A[j] = month_prices(ds_, a_, grid)
        info.append((s, ds_[0]))
    Rm = np.full_like(A, np.nan)
    Rm[:, 1:] = A[:, 1:] / A[:, :-1] - 1
    print(f'Chunks skipped (no bars before listing): {skipped}')
    late = sorted(info, key=lambda x: x[1])
    print('First Yahoo bar after 1995-01-01: ' + ', '.join(f'{s} {d}' for s, d in late if d > date(1995, 1, 1)))
    print(f'Names with a January 1995 return: {int((~np.isnan(Rm[:, 1])).sum())}')
    flat = [(abs(Rm[j, k]), syms[j], grid[k], Rm[j, k]) for j in range(len(syms)) for k in range(1, len(grid))
            if not np.isnan(Rm[j, k])]
    flat.sort(reverse=True)
    print('QC, 10 largest |monthly returns|: ' + ', '.join(f'{s} {d:%Y-%m} {x*100:+.0f}%' for _, s, d, x in flat[:10]))

    # ---------------------------------------------------------------- T5
    def mom(m):
        sig = A[:, m - 1] / A[:, m - 12] - 1
        ok = ~np.isnan(sig) & ~np.isnan(A[:, m])
        return sig, ok
    r5 = run('T5 momentum 12-1, top 5 of today\'s S&P 100, monthly, 10 bps', grid, A, Rm, spy_m, rf_m, syms, mom, 12)
    s5, v5 = stats(r5, 'T5')

    # ---------------------------------------------------------------- T4
    months = np.array([g.month for g in grid])

    def season(m):
        h = m + 1
        cols = [k for k in range(1, h) if months[k] == months[h]]
        X = Rm[:, cols]
        cnt = (~np.isnan(X)).sum(axis=1)
        with np.errstate(invalid='ignore'):
            mu = np.where(cnt > 0, np.nansum(X, axis=1) / np.maximum(cnt, 1), np.nan)
        ok = (cnt >= MIN_SEASON) & ~np.isnan(A[:, m])
        return mu, ok
    f4 = next(m for m in range(1, len(grid) - 1) if season(m)[1].sum() >= TOPN)
    r4 = run('T4 same-month seasonality, top 5 of today\'s S&P 100, monthly, 10 bps', grid, A, Rm, spy_m, rf_m, syms,
             season, f4)
    s4, v4 = stats(r4, 'T4')

    # ---------------------------------------------------------------- current picks (information only)
    m = len(grid) - 1
    for lab, fn in (('T5', mom), ('T4', season)):
        if lab == 'T4':
            h_month = 11
            cols = [k for k in range(1, len(grid)) if months[k] == h_month]
            X = Rm[:, cols]
            cnt = (~np.isnan(X)).sum(axis=1)
            sig = np.where(cnt > 0, np.nansum(X, axis=1) / np.maximum(cnt, 1), np.nan)
            ok = (cnt >= MIN_SEASON) & ~np.isnan(A[:, m])
        else:
            sig, ok = fn(m)
        order = [j for j in np.argsort(-np.where(ok, sig, -np.inf)) if ok[j]][:TOPN]
        print(f'{lab} holdings for November 2026, formed at {grid[m]} (information only): '
              + ', '.join(f'{syms[j]} {sig[j]*100:+.1f}%' for j in order))

    # ---------------------------------------------------------------- dollars
    print('\n## Dollars: $50 probe ($10 x 5) instead of $50 of VOO; full sleeve = the $1,104 VOO sleeve')
    for lab, s in (('T4', s4), ('T5', s5)):
        for per in ('full', 'pre-2010', '2010-2026', 'since 2016'):
            if per not in s:
                continue
            x = s[per]
            dc = x['cagr'] - x['cagr_spy']
            print(f'  {lab} [{per}] CAGR {x["cagr"]*100:.2f}% vs SPY {x["cagr_spy"]*100:.2f}%: $50 probe {dc*50:+.2f} $/yr, '
                  f'mean {x["mean"]*50:+.2f} $/month, worst month {x["worst"]*50:+.2f} $, max drawdown ${x["mdd"]*50:.2f}; '
                  f'$1,104 sleeve {dc*1104:+.0f} $/yr, max drawdown ${x["mdd"]*1104:.0f} vs SPY ${x["mdd_spy"]*1104:.0f}')
    # ---------------------------------------------------------------- POST-HOC (added after the results were seen;
    # information only, it changes no test and no verdict): the opposite selection, the 5 WORST-ranked eligible
    # names under the same rules and costs. If they also beat SPY, the excess over SPY is mostly survivorship.
    print('\n## POST-HOC placebo (added after the results; information only): bottom 5 by the same signal, same costs')
    for lab, fn, f0, top in (('T5', mom, 12, r5), ('T4', season, f4, r4)):
        bot = run(f'{lab} bottom 5 (placebo)', grid, A, Rm, spy_m, rf_m, syms,
                  lambda m, fn=fn: (lambda s, o: (-s, o))(*fn(m)), f0)
        bd = {r['d']: r for r in bot}
        for per, lo_, hi_ in (('full', date(1900, 1, 1), date(2100, 1, 1)), ('pre-2010', date(1900, 1, 1), SPLIT),
                              ('2010-2026', date(2010, 1, 1), date(2100, 1, 1))):
            rr = [r for r in top if lo_ <= r['d'] <= hi_ and r['d'] in bd]
            xb = np.array([bd[r['d']]['net'] - r['spy'] for r in rr])
            sp = np.array([r['net'] - bd[r['d']]['net'] for r in rr])
            tb = xb.mean() / (xb.std(ddof=1) / math.sqrt(len(xb)))
            ts = sp.mean() / (sp.std(ddof=1) / math.sqrt(len(sp)))
            print(f'  {lab} [{per}] n {len(rr)}: bottom 5 minus SPY {xb.mean()*100:+.2f}%/month (t {tb:+.2f}); '
                  f'top 5 minus bottom 5 {sp.mean()*100:+.2f}%/month (t {ts:+.2f})')
    print(f'\nSUMMARY: T4 {v4}; T5 {v5}')


if __name__ == '__main__':
    main()
