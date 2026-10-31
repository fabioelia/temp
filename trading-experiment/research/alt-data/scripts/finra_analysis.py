"""Claims E1 / E1b (FINRA daily short-sale volume), per ../claims.md and ../../strategy-review/PROTOCOL.md.

Run:  python3 -I finra_analysis.py <scratch_dir> <out_csv> [<events_csv>]
      reads <scratch_dir>/finra_filtered.csv and <scratch_dir>/finra_yahoo/<SYM>.json (made by finra_fetch.py); no network.

FIXED IN claims.md: 25 mega-caps + SPY/QQQ/IWM, 2019-2026; ratio = ShortVolume / TotalVolume; z against the stock's own
trailing 60 sessions; E1 signal z >= 1.645 predicts LOWER returns; E1b z <= -1.645 predicts HIGHER returns; outcome = next 5-
and 10-session return beyond SPY (raw for SPY), against all days of the same stock; split 2019-2022 vs 2023-2026; options =
25 DTE delta-0.35 put (E1) / call (E1b) at RV20 x 1.1, held 5 sessions.

IMPLEMENTATION CHOICES, FIXED 2026-10-30 BEFORE ANY RESULT WAS COMPUTED (claims.md leaves these open):
  Data
    * Sessions = SPY's Yahoo sessions. FINRA rows on non-sessions are dropped. FB rows are META before 2022-06-09.
    * ratio = ShortVolume / TotalVolume (ShortExemptVolume is not added again); missing file or symbol -> NaN.
    * z_t = (ratio_t - mean) / sd (ddof 1) of the ratios of the 60 sessions t-60..t-1 (today excluded); needs >= 50
      valid of the 60. Q4-2018 files are warm-up only: signal dates run from 2019-01-02.
  Timing
    * The file for day t is published about 18:00 ET on t, after our 14:43 decision, so PRIMARY entry = close of t+1
      (the first 14:43 decision that can see it). Outcome = adj close t+1+h / adj close t+1 - 1, h = 5, 10.
    * Declared sensitivity (never used for a verdict): entry at close t (academic timing, not tradeable).
  Returns and baseline
    * Yahoo adjusted closes. Excess = stock h-return - SPY h-return; SPY itself uses its raw h-return.
    * Baseline = mean excess over ALL days of the same symbol with a valid z and forward return, in the same reporting
      period (full / 2019-2022 / 2023-2026), same entry convention. Abnormal = excess - baseline(symbol, period, h).
    * Claimed direction s = -1 (E1), +1 (E1b). Hit = share with s x excess > 0 (signal days and all days alike).
      Worst = min of s x excess.
  Statistics
    * Month-block bootstrap (calendar month of the signal date t), 2000 draws, seed 7: t_boot = mean abnormal / sd of the
      bootstrap means; 95% CI = 2.5/97.5 percentiles. Verdicts use t_boot. Also t_cl (analytic, clustered by month).
    * Signal days are all counted (consecutive signal days of the same stock overlap; the month blocks absorb that).
  Costs: round trip 5 bps SPY/QQQ, 10 bps IWM and the stocks; net = s x mean abnormal - mean cost.
  Options (Black-Scholes, r = 0, q = 0, no skew, no IV change)
    * Entry at the primary entry close; underlying = Yahoo split-adjusted close (not dividend-adjusted: holders get no
      dividends). RV20 = annualised sd (ddof 1, sqrt 252) of the 20 daily log adjusted-close returns ending at entry.
    * IV = 1.1 x RV20 at entry and exit; 25 calendar DTE; |delta| 0.35; E1 put, E1b call; held 5 sessions (T falls by
      calendar days). Buy at model x 1.015, sell at model x 0.985. EV/$ = mean(proceeds / cost).
    * Options baseline (context): the same contract bought on every day of the same symbols and period.
  Verdict, per horizon (m = s x full mean abnormal, t = s x t_boot, late = s x 2023-2026 mean abnormal):
    REJECTED  if m <= 0, or t < 1, or late <= 0 (only in early data).
    CONFIRMED if t >= 2, late >= 0.5 m, m - cost > 0 and the 5-session options EV/$ > 1.0.
    WEAK      otherwise. |t| >= 3 strong, 2-3 suggestive (about 30 tests in the review).
    The claim's overall verdict is the 5-session one (our options hold); the 10-session verdict is reported beside it.
  Declared descriptive rows (never used for a verdict): entry at close t; stocks only (25); ETFs only (SPY, QQQ, IWM).
  Live check: z for every symbol on the last two FINRA dates (2026-10-29 and 2026-10-30).
"""
import csv
import json
import math
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from statistics import NormalDist
from zoneinfo import ZoneInfo

import numpy as np

SYMS = ("AAPL MSFT GOOGL AMZN META NVDA TSLA NFLX AVGO INTC AMD ORCL CRM ADBE QCOM CSCO IBM TXN MU JPM BAC XOM CVX "
        "WMT COST SPY QQQ IWM").split()
ETFS = {'SPY', 'QQQ', 'IWM'}
COST = {s: (0.0005 if s in ('SPY', 'QQQ') else 0.0010) for s in SYMS}
META_SWITCH = date(2022, 6, 9)
START = date(2019, 1, 2)
PERIODS = [('full', date(2019, 1, 1), date(2026, 12, 31)), ('2019-2022', date(2019, 1, 1), date(2022, 12, 31)),
           ('2023-2026', date(2023, 1, 1), date(2026, 12, 31))]
ZCUT = 1.645
WIN, MINVALID = 60, 50
DTE, DELTA, IVX, HOLD = 25, 0.35, 1.1, 5
HALF_SPREAD = 0.015
ET = ZoneInfo('America/New_York')
N = NormalDist()


# ------------------------------------------------------------------ data
def load_yahoo(path):
    d = json.loads(Path(path).read_text())['chart']['result'][0]
    adj = d['indicators']['adjclose'][0]['adjclose']
    cl = d['indicators']['quote'][0]['close']
    a, c = {}, {}
    for t, x, y in zip(d['timestamp'], adj, cl):
        day = datetime.fromtimestamp(t, tz=timezone.utc).astimezone(ET).date()
        if x is not None and x > 0:
            a[day] = float(x)
        if y is not None and y > 0:
            c[day] = float(y)
    return a, c


def load_finra(path):
    """dict (symbol, date) -> ratio, with FB mapped to META before the switch."""
    out = {}
    with open(path) as f:
        for row in csv.DictReader(f):
            try:
                d = datetime.strptime(row['Date'], '%Y%m%d').date()
                sv, tv = float(row['ShortVolume']), float(row['TotalVolume'])
            except (ValueError, TypeError):
                continue
            s = row['Symbol']
            if s == 'FB':
                if d >= META_SWITCH:
                    continue
                s = 'META'
            elif s == 'META' and d < META_SWITCH:
                continue
            if s in SYMS and tv > 0:
                out[(s, d)] = sv / tv
    return out


# ------------------------------------------------------------------ Black-Scholes (r = 0, q = 0), S = 1
def ncdf(x):
    return 0.5 * (1.0 + np.vectorize(math.erf)(np.asarray(x, float) / math.sqrt(2.0)))


def bs(S, K, T, sig, call):
    S, K, T, sig = (np.asarray(v, float) for v in (S, K, T, sig))
    T = np.maximum(T, 1e-6)
    sd = sig * np.sqrt(T)
    d1 = (np.log(S / K) + 0.5 * sd ** 2) / sd
    d2 = d1 - sd
    c = S * ncdf(d1) - K * ncdf(d2)
    return np.where(call, c, c - S + K)


def option_ratio(ret, cal_days, iv, call):
    T0 = DTE / 365.0
    target = DELTA if call else 1.0 - DELTA
    d1 = N.inv_cdf(target)
    sd = iv * math.sqrt(T0)
    K = np.exp(-d1 * sd + 0.5 * sd ** 2)
    p0 = bs(1.0, K, T0, iv, call)
    p1 = bs(1.0 + ret, K, (DTE - cal_days) / 365.0, iv, call)
    return p1 * (1 - HALF_SPREAD) / (p0 * (1 + HALF_SPREAD))


# ------------------------------------------------------------------ stats
def cluster_t(x, groups):
    x = np.asarray(x, float)
    n = len(x)
    if n < 3:
        return float('nan')
    m = x.mean()
    u = {}
    for v, g in zip(x - m, groups):
        u[g] = u.get(g, 0.0) + v
    G = len(u)
    s = np.array(list(u.values()))
    se = math.sqrt((s ** 2).sum()) / n * math.sqrt(G / (G - 1)) if G > 1 else float('nan')
    return m / se if se and se > 0 else float('nan')


def block_boot(x, groups, reps=2000, seed=7):
    """Month-block bootstrap: returns (t, ci_lo, ci_hi) for the mean of x."""
    x = np.asarray(x, float)
    if len(x) < 3:
        return float('nan'), float('nan'), float('nan')
    rng = np.random.default_rng(seed)
    gl = sorted(set(groups))
    by = {g: [0.0, 0] for g in gl}
    for v, g in zip(x, groups):
        by[g][0] += v
        by[g][1] += 1
    sums = np.array([by[g][0] for g in gl])
    cnts = np.array([by[g][1] for g in gl])
    idx = rng.integers(0, len(gl), size=(reps, len(gl)))
    means = sums[idx].sum(1) / cnts[idx].sum(1)
    se = means.std(ddof=1)
    return (x.mean() / se if se > 0 else float('nan'), float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5)))


def verdict(m, t, late, cost, ev):
    if any(v is None or (isinstance(v, float) and math.isnan(v)) for v in (m, t, late)):
        return 'n/a'
    if m <= 0 or t < 1 or late <= 0:
        return 'REJECTED'
    if t >= 2 and late >= 0.5 * m and m - cost > 0 and ev is not None and ev > 1.0:
        return 'CONFIRMED'
    return 'WEAK'


# ------------------------------------------------------------------ main
def main():
    scratch, out_csv = Path(sys.argv[1]), Path(sys.argv[2])
    ev_csv = Path(sys.argv[3]) if len(sys.argv) > 3 else None
    spy_adj, _ = load_yahoo(scratch / 'finra_yahoo' / 'SPY.json')
    sessions = sorted(d for d in spy_adj if d >= date(2018, 8, 1))
    nS = len(sessions)
    sidx = {d: i for i, d in enumerate(sessions)}
    fin = load_finra(scratch / 'finra_filtered.csv')
    fin_dates = sorted({d for (_, d) in fin})
    print('FINRA dates', fin_dates[0], '..', fin_dates[-1], len(fin_dates), 'files; sessions', sessions[0], '..',
          sessions[-1])
    finra_sessions = [d for d in sessions if d >= date(2018, 10, 1)]
    missing = [d for d in finra_sessions if d not in set(fin_dates)]
    print('sessions with no FINRA rows:', len(missing), [str(d) for d in missing[:12]])

    S = np.array([spy_adj[d] for d in sessions])
    A, C, R, Z = {}, {}, {}, {}
    for s in SYMS:
        a, c = load_yahoo(scratch / 'finra_yahoo' / f'{s}.json')
        A[s] = np.array([a.get(d, np.nan) for d in sessions])
        C[s] = np.array([c.get(d, np.nan) for d in sessions])
        r = np.array([fin.get((s, d), np.nan) for d in sessions])
        R[s] = r
        z = np.full(nS, np.nan)
        for i in range(WIN, nS):
            w = r[i - WIN:i]
            w = w[~np.isnan(w)]
            if len(w) >= MINVALID and not np.isnan(r[i]):
                sd = w.std(ddof=1)
                if sd > 0:
                    z[i] = (r[i] - w.mean()) / sd
        Z[s] = z

    def fwd(a, i, h):
        return a[i + h] / a[i] - 1.0 if i + h < nS else np.nan

    def rv20(a, end):
        if end - 20 < 0:
            return np.nan
        w = a[end - 20:end + 1]
        if np.isnan(w).any():
            return np.nan
        return float(np.std(np.diff(np.log(w)), ddof=1) * math.sqrt(252))

    # one record per symbol-day with a valid z, both entry conventions
    recs = []
    for s in SYMS:
        a, c, z = A[s], C[s], Z[s]
        for i in range(nS):
            d = sessions[i]
            if d < START or np.isnan(z[i]):
                continue
            r = {'sym': s, 'date': d, 'month': d.strftime('%Y-%m'), 'z': z[i], 'ratio': R[s][i]}
            for conv, e in (('t1', i + 1), ('t0', i)):
                for h in (5, 10):
                    if e + h < nS and not np.isnan(a[e]) and not np.isnan(a[e + h]):
                        ret = fwd(a, e, h)
                        r[f'ex{h}_{conv}'] = ret if s == 'SPY' else ret - fwd(S, e, h)
                    else:
                        r[f'ex{h}_{conv}'] = np.nan
                if e + HOLD < nS and not np.isnan(c[e]) and not np.isnan(c[e + HOLD]):
                    r[f'oret_{conv}'] = c[e + HOLD] / c[e] - 1
                    r[f'ocal_{conv}'] = (sessions[e + HOLD] - sessions[e]).days
                    r[f'rv_{conv}'] = rv20(a, e)
                else:
                    r[f'oret_{conv}'] = r[f'ocal_{conv}'] = r[f'rv_{conv}'] = np.nan
            recs.append(r)
    print('symbol-days with valid z:', len(recs))

    # options ratios for every record (put and call), so baselines come for free
    for conv in ('t1', 't0'):
        ok = [r for r in recs if not np.isnan(r[f'oret_{conv}']) and not np.isnan(r[f'rv_{conv}']) and r[f'rv_{conv}'] > 0]
        for r in recs:
            r[f'put_{conv}'] = r[f'call_{conv}'] = np.nan
        ret = np.array([r[f'oret_{conv}'] for r in ok])
        cal = np.array([r[f'ocal_{conv}'] for r in ok], float)
        iv = IVX * np.array([r[f'rv_{conv}'] for r in ok])
        puts, calls = option_ratio(ret, cal, iv, False), option_ratio(ret, cal, iv, True)
        for r, pv, cv in zip(ok, puts, calls):
            r[f'put_{conv}'], r[f'call_{conv}'] = float(pv), float(cv)

    rows = []

    def run(claim, test, label, conv, universe, sgn):
        is_sig = (lambda r: r['z'] >= ZCUT) if sgn < 0 else (lambda r: r['z'] <= -ZCUT)
        okind = 'put' if sgn < 0 else 'call'
        res = {}
        for h in (5, 10):
            for pname, lo, hi in PERIODS:
                pool = [r for r in recs if r['sym'] in universe and lo <= r['date'] <= hi and not np.isnan(r[f'ex{h}_{conv}'])]
                acc = {}
                for r in pool:
                    a = acc.setdefault(r['sym'], [0.0, 0])
                    a[0] += r[f'ex{h}_{conv}']
                    a[1] += 1
                base = {k: v[0] / v[1] for k, v in acc.items()}
                sig = [r for r in pool if is_sig(r)]
                allx = np.array([r[f'ex{h}_{conv}'] for r in pool])
                x = np.array([r[f'ex{h}_{conv}'] for r in sig])
                abn = np.array([r[f'ex{h}_{conv}'] - base[r['sym']] for r in sig])
                months = [r['month'] for r in sig]
                n = len(sig)
                tb, lo95, hi95 = block_boot(abn, months)
                cost = float(np.mean([COST[r['sym']] for r in sig])) if n else np.nan
                o = [r[f'{okind}_{conv}'] for r in sig if not np.isnan(r[f'{okind}_{conv}'])]
                ob = [r[f'{okind}_{conv}'] for r in pool if not np.isnan(r[f'{okind}_{conv}'])]
                om = [r['month'] for r in sig if not np.isnan(r[f'{okind}_{conv}'])]
                ot, olo, ohi = block_boot(np.array(o) - 1.0, om) if len(o) >= 3 else (np.nan, np.nan, np.nan)
                row = {'claim': claim, 'test': test, 'label': label, 'horizon': h, 'period': pname, 'n': n,
                       'hit_rate': float((sgn * x > 0).mean()) if n else np.nan,
                       'mean_ex': float(x.mean()) if n else np.nan, 'median_ex': float(np.median(x)) if n else np.nan,
                       'all_n': len(allx), 'all_mean_ex': float(allx.mean()), 'all_median_ex': float(np.median(allx)),
                       'all_hit_rate': float((sgn * allx > 0).mean()),
                       'mean_abn': float(abn.mean()) if n else np.nan,
                       'median_abn': float(np.median(abn)) if n else np.nan,
                       't_boot': tb, 't_cl': cluster_t(abn, months), 'ci_lo': lo95, 'ci_hi': hi95,
                       'worst': float((sgn * x).min()) if n else np.nan, 'cost': cost,
                       'net_signed': float(sgn * abn.mean() - cost) if n else np.nan,
                       'opt': okind, 'opt_n': len(o), 'opt_ev': float(np.mean(o)) if o else np.nan,
                       'opt_median': float(np.median(o)) if o else np.nan,
                       'opt_pwin': float(np.mean(np.array(o) > 1.0)) if o else np.nan,
                       'opt_t_vs1': ot, 'opt_ci_lo': olo + 1.0, 'opt_ci_hi': ohi + 1.0,
                       'opt_base_ev': float(np.mean(ob)) if ob else np.nan, 'verdict': ''}
                res[(h, pname)] = row
                rows.append(row)
        if label == 'pre-registered':
            ev = res[(5, 'full')]['opt_ev']
            for h in (5, 10):
                f, late = res[(h, 'full')], res[(h, '2023-2026')]
                f['verdict'] = verdict(sgn * f['mean_abn'], sgn * f['t_boot'], sgn * late['mean_abn'], f['cost'], ev)
        else:
            for h in (5, 10):
                res[(h, 'full')]['verdict'] = 'descriptive'
        return res

    for claim, test, sgn in (('E1', 'heavy shorting z >= 1.645 -> lower', -1), ('E1b', 'light shorting z <= -1.645 -> higher', 1)):
        run(claim, test, 'pre-registered', 't1', SYMS, sgn)
        run(claim, test + ' | entry close t (not tradeable)', 'declared sensitivity', 't0', SYMS, sgn)
        run(claim, test + ' | stocks only', 'declared subgroup', 't1', [s for s in SYMS if s not in ETFS], sgn)
        run(claim, test + ' | ETFs only', 'declared subgroup', 't1', [s for s in SYMS if s in ETFS], sgn)

    cols = list(rows[0].keys())
    with open(out_csv, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in rows:
            w.writerow({k: (f'{v:.5f}' if isinstance(v, float) else v) for k, v in r.items()})
    print('wrote', out_csv, len(rows), 'rows')

    if ev_csv:
        keys = ['sym', 'date', 'z', 'ratio', 'ex5_t1', 'ex10_t1', 'put_t1', 'call_t1', 'rv_t1']
        with open(ev_csv, 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(keys)
            for r in recs:
                if abs(r['z']) >= ZCUT:
                    w.writerow([r[k] if not isinstance(r[k], float) else f'{r[k]:.6f}' for k in keys])

    # ---------------- print the headline table
    fmt = '{:4} {:40.40} {:>2} {:9} {:>5} {:>6} {:>8} {:>8} {:>7} {:>8} {:>6} {:>6} {:>6} {:>6} {}'
    print(fmt.format('clm', 'test', 'h', 'period', 'n', 'hit', 'mean_ex', 'all_mean', 'all_hit', 'mean_abn', 't_bt', 't_cl',
                     'optEV', 'optB', 'verdict'))
    for r in rows:
        print(fmt.format(r['claim'], r['test'], r['horizon'], r['period'], r['n'], f"{r['hit_rate']:.3f}",
                         f"{r['mean_ex']:+.4f}", f"{r['all_mean_ex']:+.4f}", f"{r['all_hit_rate']:.3f}",
                         f"{r['mean_abn']:+.4f}", f"{r['t_boot']:+.2f}", f"{r['t_cl']:+.2f}", f"{r['opt_ev']:.3f}",
                         f"{r['opt_base_ev']:.3f}", r['verdict']))

    # ---------------- live check: the last two FINRA dates
    last2 = [d for d in sessions if d in set(fin_dates)][-2:]
    print('\nLIVE z on', [str(d) for d in last2])
    for s in SYMS:
        vals = []
        for d in last2:
            i = sidx[d]
            zz = Z[s][i]
            flag = 'E1' if zz >= ZCUT else ('E1b' if zz <= -ZCUT else '')
            vals.append(f'{d} ratio {R[s][i]:.3f} z {zz:+.2f} {flag}')
        print(f'{s:5}', ' | '.join(vals))


if __name__ == '__main__':
    main()
