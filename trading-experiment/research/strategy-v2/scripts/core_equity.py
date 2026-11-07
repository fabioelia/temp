#!/usr/bin/env python3
"""Strategy v2, claims S1-S4 (core equity and idle cash), tested as pre-registered in ../claims.md under
../../strategy-review/PROTOCOL.md. Results are written up in ../core-equity.md.

Run (python -I, stdlib + numpy; DATA_DIR holds the raw Yahoo v8 chart JSON, untouched):

  python3 -I core_equity.py DATA_DIR > out.txt

Data (fetched 2026-11-07 with curl -A 'Mozilla/5.0', one file per symbol and decade, because range=max silently
returns monthly bars):
  https://query1.finance.yahoo.com/v8/finance/chart/{SYM}?period1={Jan 1 of Y}&period2={min(Jan 1 of Y+10,
  2026-11-07 12:00 UTC)}&interval=1d&events=div%2Csplit&includeAdjustedClose=true   saved as {SYM}_{Y}.json
  SPY and QQQ for Y = 1990..2020, ^IRX (saved as IRX_) for 1960..2020, SGOV for 2020, BIL for 2000..2020.
  Last bar: the 2026-11-06 close. The script refuses chunks that are not daily bars.

Specification (every choice claims.md leaves open, fixed here before any result was computed):
  Series. 'Total return' = Yahoo adjclose (split- and dividend-adjusted). The trend signals use Yahoo 'close'
    (split-adjusted price, as on a chart). Dates are exchange-local (timestamp + gmtoffset).
  Risk-free (for Sharpe): ^IRX of the previous session / 100 x calendar days / 360, accrued per SPY session.
  T-bill ETF leg (S2): BIL total return from its first full session (2007-05-31); before that the ^IRX accrual minus
    BIL's gross expense ratio 0.1353%/yr (x calendar days / 365).
  Halves. pre-2010 = daily returns dated <= 2009-12-31; 2010-2026 = returns dated >= 2010-01-01. A holding window
    belongs to a half only if all of its daily returns do; windows straddling 2010 count only in the full sample.
  S1. Holding windows of h = 21, 63, 126 and 252 sessions (1, 3, 6, 12 months), one starting at every close.
    Return net of one 5 bp round trip: (1+r)(1-0.0005)-1. Report n, mean, median, % > 0, 5th percentile, worst,
    and the Newey-West t of the mean against 0 (Bartlett kernel, lag = h; claims.md's test is "mean > 0", so the
    baseline is zero; the excess over T-bills is printed for information only).
    Verdict: CONFIRMED if mean > 0 with NW t > 2 at all four horizons in both halves; REJECTED if the 2010-2026
    mean is <= 0 at most horizons; otherwise WEAK (per horizon detail printed).
  S2 daily. Signal at close t: close > mean of the last 200 closes (including t). The position earning the return
    of session d is the signal at close d-2 (checked at the close, traded at the next close). In: SPY total
    return. Out: the T-bill ETF leg. 5 bps is charged on each switch (each change of position).
  S2 Faber (2007) monthly. At each month's last close: close > mean of the last 10 month-end closes -> SPY for the
    next month, else T-bills; traded at that same close as Faber states (a next-close version is printed as a
    labelled sensitivity). 5 bps per switch.
  S2 evaluation: buy-and-hold and both filters on identical dates, from the first session where both filters are
    defined. No entry cost for anyone. Metrics per period: CAGR (252 sessions/yr), annualized vol, Sharpe (mean
    daily excess over the risk-free / sd x sqrt 252), max drawdown of the equity curve within the period, worst
    calendar year (years with >= 126 sessions in the period), switches/yr, % time in equity.
    Verdict (claims.md rule + PROTOCOL): the claims rule = filter Sharpe higher AND max drawdown smaller in BOTH
    halves. CONFIRMED needs the claims rule plus |t| >= 2 for the full-sample Sharpe difference (moving-block
    bootstrap of paired daily returns, block 63 sessions, 2,000 resamples, seed 20261107). Claims rule met but
    |t| < 2: WEAK ("fails significance"). Claims rule failed in 2010-2026: REJECTED if the filter's Sharpe is lower
    there, else WEAK.
  S3. Closest version (issuer pages unreachable from this session; see core-equity.md): trailing distribution
    yields from Yahoo dividend events, the worst drawdown of the total-return and price series, the worst session.
    Pre-set thresholds: yield within 0.30 pts of ^IRX, worst total-return drawdown shallower than -0.5%,
    regular-session spread <= 5 bps.
  S4. The same S1 statistics on QQQ (1999-03-10 on), and QQQ vs SPY on identical dates for buy-and-hold, the daily
    trend filter and the Faber filter. CONFIRMED only if QQQ's Sharpe is higher in both halves and the full-sample
    Sharpe-difference |t| >= 2; higher in both halves but |t| < 2: WEAK; lower in 2010-2026: REJECTED.
  Dollar view (for the write-up): rolling 21- and 252-session returns of each candidate's equity curve, full sample
    and 2010-2026: mean, 5th/50th/95th percentile, worst.
Data note found after running (not a change to any test): Yahoo's SGOV and BIL adjclose lacks the 2026-11-02
distribution (ex-date), so both show a false ~-0.3% session that day; core-equity.md reports SGOV's drawdown through
2026-10-30 alongside. SGOV's October accrual rate in core-equity.md is POST-HOC.
"""
import glob
import json
import math
import os
import sys
from datetime import date, datetime, timedelta, timezone

import numpy as np

COST_RT = 0.0005      # SPY/QQQ round trip (PROTOCOL rule 6)
COST_SWITCH = 0.0005  # per switch (claims.md S2)
BIL_ER = 0.001353     # BIL gross expense ratio, used only for the pre-2007 synthetic T-bill ETF
SPLIT = date(2009, 12, 31)
HS = (21, 63, 126, 252)


def load(data_dir, sym):
    rows = {}
    divs = {}
    for f in sorted(glob.glob(os.path.join(data_dir, f'{sym}_*.json'))):
        res = json.load(open(f))['chart']['result'][0]
        if res['meta'].get('dataGranularity') != '1d':
            raise SystemExit(f'{f}: not daily')
        off = res['meta'].get('gmtoffset', 0)
        ts = res.get('timestamp') or []
        q = res['indicators']['quote'][0]
        adj = res['indicators'].get('adjclose', [{}])[0].get('adjclose') or [None] * len(ts)
        for t, c, a in zip(ts, q['close'], adj):
            if c is None:
                continue
            d = datetime.fromtimestamp(t + off, timezone.utc).date()
            rows[d] = (c, a if a is not None else c)
        for v in (res.get('events', {}).get('dividends') or {}).values():
            divs[datetime.fromtimestamp(v['date'] + off, timezone.utc).date()] = v['amount']
    ds = sorted(rows)
    return np.array(ds), np.array([rows[d][0] for d in ds]), np.array([rows[d][1] for d in ds]), divs


def nw_t(x, lag):
    x = np.asarray(x, float)
    n = len(x)
    if n < 3:
        return float('nan')
    m = x.mean()
    e = x - m
    v = e @ e / n
    for j in range(1, min(lag, n - 1) + 1):
        v += 2 * (1 - j / (lag + 1)) * (e[j:] @ e[:-j]) / n
    return m / math.sqrt(v / n) if v > 0 else float('nan')


def s1_table(name, ds, adj, rf_daily):
    print(f'\n## S1 statistics: {name} total return, net of {COST_RT*1e4:.0f} bp round trip')
    print('horizon period      n      mean   median  %pos     p5     worst   NW_t  | excess_vs_bills mean (info)')
    out = {}
    lrf = np.concatenate([[0.0], np.cumsum(np.log1p(rf_daily[1:]))])
    for h in HS:
        r = adj[h:] / adj[:-h] - 1
        rn = (1 + r) * (1 - COST_RT) - 1
        rb = np.exp(lrf[h:] - lrf[:-h]) - 1
        start, end = ds[:-h], ds[h:]
        for per, mask in (('full', np.ones(len(r), bool)), ('pre-2010', end <= SPLIT), ('2010-2026', start >= SPLIT)):
            x = rn[mask]
            if len(x) < 30:
                continue
            t = nw_t(x, h)
            out[(h, per)] = (x.mean(), t)
            print(f'{h:>5}d  {per:<10}{len(x):>6} {x.mean()*100:>7.2f}% {np.median(x)*100:>6.2f}% {np.mean(x>0)*100:>5.1f}'
                  f' {np.percentile(x,5)*100:>7.2f}% {x.min()*100:>7.2f}% {t:>6.2f}  | {(x-rb[mask]).mean()*100:>6.2f}%')
    return out


def s1_verdict(out):
    ok = all(out[(h, p)][0] > 0 and out[(h, p)][1] > 2 for h in HS for p in ('pre-2010', '2010-2026'))
    if ok:
        return 'CONFIRMED'
    if sum(out[(h, '2010-2026')][0] <= 0 for h in HS) > len(HS) / 2:
        return 'REJECTED'
    return 'WEAK'


def sma(x, n):
    c = np.concatenate([[0.0], np.cumsum(x)])
    out = np.full(len(x), np.nan)
    out[n - 1:] = (c[n:] - c[:-n]) / n
    return out


def positions(ds, close):
    """Return (pos_daily, pos_faber, pos_faber_next): position earning the return of session d (index d)."""
    n = len(close)
    s200 = sma(close, 200)
    sig = np.where(np.isnan(s200), np.nan, (close > s200).astype(float))
    pd_ = np.full(n, np.nan)
    pd_[2:] = sig[:-2]
    # month-end closes; the last bar (2026-11-06) is not a confirmed month end, so it is excluded
    me = np.array([i for i in range(n - 1) if ds[i + 1].month != ds[i].month])
    mclose = close[me]
    msig = np.full(len(me), np.nan)
    for k in range(9, len(me)):
        msig[k] = float(mclose[k] > mclose[k - 9:k + 1].mean())
    pf = np.full(n, np.nan)
    pfn = np.full(n, np.nan)
    for k, i in enumerate(me):
        nxt = me[k + 1] if k + 1 < len(me) else n - 1
        pf[i + 1:nxt + 1] = msig[k]          # traded at the signal close (Faber)
        pfn[i + 2:min(nxt + 2, n)] = msig[k]  # traded at the next close (sensitivity)
    return pd_, pf, pfn


def strat_returns(pos, eq_r, cash_r):
    r = np.where(pos == 1, eq_r, cash_r)
    sw = np.zeros(len(pos), bool)
    sw[1:] = (pos[1:] != pos[:-1]) & ~np.isnan(pos[:-1])
    return r - COST_SWITCH * sw, sw


def metrics(ds, r, rf, inpos=None):
    n = len(r)
    eq = np.cumprod(1 + r)
    cagr = eq[-1] ** (252 / n) - 1
    vol = r.std(ddof=1) * math.sqrt(252)
    ex = r - rf
    sh = ex.mean() / ex.std(ddof=1) * math.sqrt(252)
    peak = np.maximum.accumulate(np.concatenate([[1.0], eq]))
    mdd = (np.concatenate([[1.0], eq]) / peak - 1).min()
    years = {}
    for d, x in zip(ds, r):
        years.setdefault(d.year, []).append(x)
    yr = {y: np.prod(1 + np.array(v)) - 1 for y, v in years.items() if len(v) >= 126}
    wy = min(yr, key=yr.get)
    return dict(cagr=cagr, vol=vol, sharpe=sh, mdd=mdd, worst_year=(wy, yr[wy]), n=n,
                tin=(np.nanmean(inpos == 1) if inpos is not None else 1.0))


def boot_sharpe_t(a, b, rf, seed=20261107, block=63, reps=2000):
    rng = np.random.default_rng(seed)
    n = len(a)
    nb = int(math.ceil(n / block))
    xa, xb = a - rf, b - rf

    def sh(x):
        return x.mean(axis=-1) / x.std(axis=-1, ddof=1) * math.sqrt(252)
    d0 = sh(xa) - sh(xb)
    ds = np.empty(reps)
    for k in range(0, reps, 250):
        m = min(250, reps - k)
        st = rng.integers(0, n - block + 1, size=(m, nb))
        idx = (st[:, :, None] + np.arange(block)[None, None, :]).reshape(m, -1)[:, :n]
        ds[k:k + m] = sh(xa[idx]) - sh(xb[idx])
    return d0, d0 / ds.std(ddof=1)


def fmt(m):
    return (f"CAGR {m['cagr']*100:6.2f}%  vol {m['vol']*100:5.1f}%  Sharpe {m['sharpe']:5.2f}  maxDD {m['mdd']*100:6.1f}%  "
            f"worst yr {m['worst_year'][0]} {m['worst_year'][1]*100:6.1f}%  in-equity {m['tin']*100:5.1f}%")


def periods(ds):
    return (('full', np.ones(len(ds), bool)), ('pre-2010', ds <= SPLIT), ('2010-2026', ds > SPLIT))


def compare(label, ds, cands, rf, base_key):
    """cands: {name: (returns, pos or None, switches or None)}. Prints metrics per period; returns dict."""
    print(f'\n## {label}: {ds[0]} .. {ds[-1]} (returns dated)')
    res = {}
    for per, mask in periods(ds):
        print(f'  [{per}] sessions {mask.sum()}')
        for nm, (r, pos, sw) in cands.items():
            m = metrics(ds[mask], r[mask], rf[mask], pos[mask] if pos is not None else None)
            if sw is not None:
                m['sw_yr'] = sw[mask].sum() / (mask.sum() / 252)
            res[(nm, per)] = m
            extra = f"  switches/yr {m['sw_yr']:.1f}" if sw is not None else ''
            print(f'    {nm:<22} {fmt(m)}{extra}')
        for nm, (r, _, _) in cands.items():
            if nm == base_key:
                continue
            d, t = boot_sharpe_t(r[mask], cands[base_key][0][mask], rf[mask])
            res[(nm, per, 't')] = (d, t)
            print(f'    Sharpe diff {nm} - {base_key}: {d:+.3f} (block-bootstrap t {t:+.2f})')
    return res


def verdict_pair(res, a, b):
    hi = [bool(res[(a, p)]['sharpe'] > res[(b, p)]['sharpe']) for p in ('pre-2010', '2010-2026')]
    dd = [bool(res[(a, p)]['mdd'] > res[(b, p)]['mdd']) for p in ('pre-2010', '2010-2026')]
    return hi, dd


def roll_table(name, ds, r):
    eq = np.concatenate([[1.0], np.cumprod(1 + r)])
    dd = np.concatenate([[ds[0] - timedelta(days=1)], ds])
    for h in (21, 252):
        x = eq[h:] / eq[:-h] - 1
        st = dd[:-h]
        for per, mask in (('full', np.ones(len(x), bool)), ('2010-2026', st >= SPLIT)):
            y = x[mask]
            print(f'    {name:<22} {h:>3}d {per:<10} n {len(y):>5}  mean {y.mean()*100:6.2f}%  p5 {np.percentile(y,5)*100:7.2f}%  '
                  f'p50 {np.median(y)*100:6.2f}%  p95 {np.percentile(y,95)*100:6.2f}%  worst {y.min()*100:7.2f}%')


def main():
    data = sys.argv[1]
    sds, sclose, sadj, sdiv = load(data, 'SPY')
    qds, qclose, qadj, qdiv = load(data, 'QQQ')
    ids, iclose, _, _ = load(data, 'IRX')
    bds, bclose, badj, bdiv = load(data, 'BIL')
    gds, gclose, gadj, gdiv = load(data, 'SGOV')
    for nm, ds_, a in (('SPY', sds, sadj), ('QQQ', qds, qadj), ('BIL', bds, badj), ('SGOV', gds, gadj)):
        r = a[1:] / a[:-1] - 1
        k = np.argmax(np.abs(r))
        print(f'{nm}: {len(ds_)} sessions {ds_[0]}..{ds_[-1]}; largest |daily TR| {r[k]*100:+.2f}% on {ds_[k+1]}')

    irx = dict(zip(ids, iclose))
    idates = list(ids)

    def irx_at(d):  # last ^IRX on or before d
        lo, hi = 0, len(idates) - 1
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if idates[mid] <= d:
                lo = mid
            else:
                hi = mid - 1
        return irx[idates[lo]]

    def rf_series(ds):
        rf = np.zeros(len(ds))
        for i in range(1, len(ds)):
            rf[i] = irx_at(ds[i - 1]) / 100 * (ds[i] - ds[i - 1]).days / 360
        return rf

    def cash_series(ds, rf):
        bmap = dict(zip(bds, badj))
        c = rf - BIL_ER * np.array([0] + [(ds[i] - ds[i - 1]).days for i in range(1, len(ds))]) / 365
        for i in range(1, len(ds)):
            if ds[i - 1] in bmap and ds[i] in bmap:
                c[i] = bmap[ds[i]] / bmap[ds[i - 1]] - 1
        return c

    s_rf = rf_series(sds)
    s_cash = cash_series(sds, s_rf)
    print(f'^IRX last: {ids[-1]} {iclose[-1]:.3f}%')

    # ---------------- S1
    s1 = s1_table('SPY', sds, sadj, s_rf)
    print(f'S1 verdict (SPY): {s1_verdict(s1)}')

    # ---------------- S2
    seq = np.concatenate([[0.0], sadj[1:] / sadj[:-1] - 1])
    pdl, pf, pfn = positions(sds, sclose)
    st = max(np.argmax(~np.isnan(pdl)), np.argmax(~np.isnan(pf)), np.argmax(~np.isnan(pfn))) + 1
    sl = slice(st, None)
    rd, swd = strat_returns(pdl, seq, s_cash)
    rfb, swf = strat_returns(pf, seq, s_cash)
    rfn, swn = strat_returns(pfn, seq, s_cash)
    cands = {'SPY buy-and-hold': (seq[sl], None, None),
             'SPY 200d daily': (rd[sl], pdl[sl], swd[sl]),
             'SPY Faber 10m': (rfb[sl], pf[sl], swf[sl]),
             'SPY Faber next-close*': (rfn[sl], pfn[sl], swn[sl]),
             'T-bill ETF leg': (s_cash[sl], None, None)}
    s2 = compare('S2 SPY trend filters vs buy-and-hold (5 bps per switch)', sds[sl], cands, s_rf[sl], 'SPY buy-and-hold')
    for nm in ('SPY 200d daily', 'SPY Faber 10m', 'SPY Faber next-close*'):
        hi, dd = verdict_pair(s2, nm, 'SPY buy-and-hold')
        t = s2[(nm, 'full', 't')][1]
        rule = all(hi) and all(dd)
        v = ('CONFIRMED' if abs(t) >= 2 and t > 0 else 'WEAK') if rule else ('REJECTED' if not hi[1] else 'WEAK')
        print(f'S2 {nm}: Sharpe higher pre/post {hi}, maxDD smaller pre/post {dd}, full-sample t {t:+.2f} -> {v}')

    # ---------------- S3
    print('\n## S3 T-bill ETFs')
    for nm, ds_, cl, a, dv in (('SGOV', gds, gclose, gadj, gdiv), ('BIL', bds, bclose, badj, bdiv)):
        eq = a / a[0]
        mdd_tr = (eq / np.maximum.accumulate(eq) - 1).min()
        k = np.argmin(eq / np.maximum.accumulate(eq) - 1)
        mdd_px = (cl / np.maximum.accumulate(cl) - 1).min()
        r = a[1:] / a[:-1] - 1
        last = sorted(dv)[-1]
        ttm = sum(v for d, v in dv.items() if d > ds_[-1] - timedelta(days=365))
        r1y = a[-1] / a[np.searchsorted(ds_, ds_[-1] - timedelta(days=365))] - 1
        print(f'  {nm}: worst TR drawdown {mdd_tr*100:.3f}% (trough {ds_[k]}), worst price drawdown {mdd_px*100:.2f}%, '
              f'worst session TR {r.min()*100:+.3f}%; last distribution {last} {dv[last]:.4f} -> x12/price '
              f'{dv[last]*12/cl[-1]*100:.2f}%; TTM distributions/price {ttm/cl[-1]*100:.2f}%; trailing 1y TR {r1y*100:.2f}%')
        tr = {}
        for d, x in zip(ds_[1:], r):
            tr.setdefault(d.year, []).append(x)
        print('    calendar-year TR: ' + ', '.join(f'{y} {(np.prod(1+np.array(v))-1)*100:.2f}%' for y, v in sorted(tr.items())))

    # ---------------- S4
    q1 = s1_table('QQQ', qds, qadj, rf_series(qds))
    print(f'S1-on-QQQ verdict: {s1_verdict(q1)}')
    common = np.array(sorted(set(qds) & set(sds)))
    si = np.searchsorted(sds, common)
    qi = np.searchsorted(qds, common)
    c_rf = s_rf[si]
    c_cash = s_cash[si]
    sp_r = np.concatenate([[0.0], sadj[si][1:] / sadj[si][:-1] - 1])
    qq_r = np.concatenate([[0.0], qadj[qi][1:] / qadj[qi][:-1] - 1])
    spd, spf, _ = positions(common, sclose[si])
    qqd, qqf, _ = positions(common, qclose[qi])
    st = max(np.argmax(~np.isnan(qqd)), np.argmax(~np.isnan(qqf))) + 1
    sl = slice(st, None)
    srd, ssw = strat_returns(spd, sp_r, c_cash)
    qrd, qsw = strat_returns(qqd, qq_r, c_cash)
    srf, ssf = strat_returns(spf, sp_r, c_cash)
    qrf, qsf = strat_returns(qqf, qq_r, c_cash)
    print('\n(S4 buy-and-hold comparison from the first QQQ session; filters from the first session both filters exist)')
    s4a = compare('S4a buy-and-hold QQQ vs SPY', common[1:], {'SPY buy-and-hold': (sp_r[1:], None, None),
                                                              'QQQ buy-and-hold': (qq_r[1:], None, None)},
                  c_rf[1:], 'SPY buy-and-hold')
    s4b = compare('S4b trend filters QQQ vs SPY', common[sl], {'SPY 200d daily': (srd[sl], spd[sl], ssw[sl]),
                                                               'QQQ 200d daily': (qrd[sl], qqd[sl], qsw[sl]),
                                                               'SPY Faber 10m': (srf[sl], spf[sl], ssf[sl]),
                                                               'QQQ Faber 10m': (qrf[sl], qqf[sl], qsf[sl])},
                  c_rf[sl], 'SPY 200d daily')
    pair_t = {}
    for per, mask in periods(common[sl]):
        d, t = boot_sharpe_t(qrf[sl][mask], srf[sl][mask], c_rf[sl][mask])
        pair_t[per] = t
        print(f'    (Faber pair, {per}) Sharpe diff QQQ Faber - SPY Faber: {d:+.3f} (block-bootstrap t {t:+.2f})')
    for lab, res, a, b in (('S4a B&H', s4a, 'QQQ buy-and-hold', 'SPY buy-and-hold'),
                           ('S4b 200d', s4b, 'QQQ 200d daily', 'SPY 200d daily'),
                           ('S4b Faber', s4b, 'QQQ Faber 10m', 'SPY Faber 10m')):
        hi = [bool(res[(a, p)]['sharpe'] > res[(b, p)]['sharpe']) for p in ('pre-2010', '2010-2026')]
        tt = pair_t['full'] if lab == 'S4b Faber' else res[(a, 'full', 't')][1]
        v = ('CONFIRMED' if tt >= 2 else 'WEAK') if all(hi) else ('REJECTED' if not hi[1] else 'WEAK')
        print(f'{lab}: QQQ Sharpe higher pre/post {hi}, full t {tt:+.2f} -> {v}')

    # ---------------- dollar view
    print('\n## Rolling 1-month (21d) and 12-month (252d) returns of each candidate (equity curves above)')
    st2 = max(np.argmax(~np.isnan(pdl)), np.argmax(~np.isnan(pf))) + 1
    roll_table('SPY buy-and-hold', sds[st2:], seq[st2:])
    roll_table('SPY 200d daily', sds[st2:], rd[st2:])
    roll_table('SPY Faber 10m', sds[st2:], rfb[st2:])
    roll_table('T-bill ETF leg', sds[st2:], s_cash[st2:])
    roll_table('QQQ buy-and-hold', common[1:], qq_r[1:])
    roll_table('QQQ 200d daily', common[sl], qrd[sl])
    print(f'\nCurrent signals (close {sds[-1]}): SPY {sclose[-1]:.2f} vs 200d {sma(sclose,200)[-1]:.2f}; '
          f'QQQ {qclose[-1]:.2f} vs 200d {sma(qclose,200)[-1]:.2f}')


if __name__ == '__main__':
    main()
