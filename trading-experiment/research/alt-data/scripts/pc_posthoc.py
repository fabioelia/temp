#!/usr/bin/env python3
"""E3 post-hoc extension (decided 2026-10-30 AFTER the registered pc_test.py results were seen; every row is post_hoc=yes).

  python3 -I pc_posthoc.py        (after pc_test.py and pc_live.py)

Why: claims.md assumed the Cboe archive ends in 2019, so the protocol's 2010-2026 split could only be run as 2010-2019. While checking
the live page I found its JSON goes back to 2019-10-07, the next session after the archive. This script re-runs the IDENTICAL, already
fixed rule (pc_test.signal: MA10, rank vs the prior 251 MA10 values, top/bottom 10%; same horizons, costs, Newey-West, options model)
on the archive spliced with the daily JSON, and appends the rows to putcall-results.csv (series 'equitypc+daily', 'totalpc+daily').
Fixed before running this script: raw prints, no outlier cleaning (Nov-Dec 2022 has single-day equity P/C prints up to 2.40);
signal days are reported for 2019-10-07 onward (truly out of sample), 2010-2026 and 2007-2026. The registered verdict is not changed by
these rows; they can only flag decay or support.
"""
import csv
import math
import sys
from datetime import date

sys.dont_write_bytecode = True
import numpy as np  # noqa: E402

sys.path.insert(0, '/home/user/temp/trading-experiment/research/alt-data/scripts')
import pc_test as P  # noqa: E402

L = P.L
OUT = P.OUT
NOTE = 'post-hoc extension: archive spliced with Cboe daily JSON 2019-10-07..2026-10-29; identical rule'


def daily(col):
    return {date.fromisoformat(r['date']): float(r[col]) for r in csv.DictReader(open(f'{P.CACHE}/cboe_daily_series.csv'))}


def main():
    spy_adj, spy = P.load_y('SPY', 'adjclose'), P.load_y('SPY', 'close')
    vix, irx = P.load_y('VIX'), P.load_y('IRX')
    divs = sorted((date.fromisoformat(r['date']), float(r['dividend'])) for r in csv.DictReader(open(f'{P.CACHE}/yahoo/SPY_div.csv')))
    sd = sorted(spy)
    pos = {d: i for i, d in enumerate(sd)}
    A = np.array([spy_adj[d] for d in sd])
    S = np.array([spy[d] for d in sd])
    iv0, r = L.ffill_on(sd, vix) / 100.0, L.ffill_on(sd, irx) / 100.0
    q = L.div_yield(sd, S, divs)
    ex = L.expiry_index(sd)
    cache = {}

    def opt(kind, mult, hz):
        key = (kind, mult, hz)
        if key not in cache:
            n = len(sd)
            ii = np.flatnonzero([ex[i] > 0 and (hz == 'exp' or i + hz < ex[i]) for i in range(n)])
            e, iv = ex[ii], iv0 * mult
            T0 = np.array([(sd[j] - sd[i]).days / 365.0 for i, j in zip(ii, e)])
            K = L.strike_for_delta(S[ii], T0, iv[ii], r[ii], q[ii], 0.40, kind)
            m0 = L.bs(S[ii], K, T0, iv[ii], r[ii], q[ii], kind)
            if hz == 'exp':
                x, T1 = e, np.zeros(len(ii))
            else:
                x = ii + hz
                T1 = np.array([(sd[j] - sd[k]).days / 365.0 for k, j in zip(x, e)])
            val = np.full(n, np.nan)
            val[ii] = L.bs(S[x], K, T1, iv[x], r[x], q[x], kind) * (1 - L.HALF_SPREAD) / (m0 * (1 + L.HALF_SPREAD))
            cache[key] = val
        return cache[key]

    pers = [('post-archive 2019-10-07..2026', date(2019, 10, 7), date(2100, 1, 1)),
            ('2010-2026 (spliced)', date(2010, 1, 1), date(2100, 1, 1)),
            ('full 2007-2026 (spliced)', date(1900, 1, 1), date(2100, 1, 1)),
            ('last10y 2016-10-29..2026', date(2016, 10, 29), date(2100, 1, 1))]
    rows = []
    for name, col in (('equitypc', 'equity_pc'), ('totalpc', 'total_pc')):
        s = P.load_pc(name)
        s.update(daily(col))
        sig = P.signal(s, 0)
        dts = [d for d in sorted(sig) if d in pos]
        idx = np.array([pos[d] for d in dts])
        rank = np.array([sig[d][1] for d in dts])
        hi, lo = rank >= 0.90, rank <= 0.10
        print(f'{name}+daily: eligible {dts[0]}..{dts[-1]} n {len(dts)}; high {hi.sum()}, low {lo.sum()}')
        jobs = []
        for h in P.H:
            ok = idx + h < len(sd)
            fwd = np.where(ok, A[np.minimum(idx + h, len(sd) - 1)] / A[idx] - 1, np.nan)
            jobs.append(('SPY fwd return', 'SPY', f'{h}d', fwd, 2 * h, ok, 'ret'))
        for kind, inst in (('C', 'SPY 30DTE 0.40d call'), ('P', 'SPY 30DTE 0.40d put')):
            for mult in (1.00, 0.72):
                for hz in (10, 5, 'exp'):
                    v = opt(kind, mult, hz)[idx]
                    jobs.append((f'options EV/$ at {mult:.2f}x VIX', inst, 'expiry' if hz == 'exp' else f'{hz}d', v,
                                 42 if hz == 'exp' else 2 * hz, ~np.isnan(v), kind))
        for test, inst, hz, y_all, lag, ok, kind in jobs:
            for pname, a, b in pers:
                pm = np.array([a <= d < b for d in dts]) & ok
                y = y_all[pm]
                for sname, msk in (('high P/C (top 10%)', hi), ('low P/C (bottom 10%)', lo)):
                    if kind == 'P' and msk is hi:
                        continue
                    m = msk[pm]
                    if m.sum() < 3:
                        continue
                    bb, t = P.dummy_t(y, m, lag)
                    ys = y[m]
                    thr = 0 if kind == 'ret' else 1
                    rows.append(dict(series=f'{name}+daily', signal=sname, test=test, instrument=inst, horizon=hz, period=pname,
                                     n_signal=int(m.sum()), n_all=len(y), episodes=P.episodes(m), mean_signal=ys.mean(),
                                     median_signal=float(np.median(ys)), hit_signal=float((ys > thr).mean()),
                                     worst_signal=float(ys.min()), mean_all=y.mean(), diff_vs_all=ys.mean() - y.mean(),
                                     diff_net_cost=(ys.mean() - P.COST - y.mean()) if kind == 'ret' else '',
                                     b_vs_others=bb, t_nw=t, post_hoc='yes', note=NOTE))
    old = [x for x in csv.DictReader(open(OUT)) if not x['series'].endswith('+daily')]
    fields = list(old[0])
    with open(OUT, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(old)
        for rr in rows:
            w.writerow({k: (f'{v:.5f}' if isinstance(v, float) and not math.isnan(v) else ('' if isinstance(v, float) else v))
                        for k, v in rr.items()})
    print(f'appended {len(rows)} post-hoc rows to {OUT} (total {len(old) + len(rows)})')


if __name__ == '__main__':
    main()
