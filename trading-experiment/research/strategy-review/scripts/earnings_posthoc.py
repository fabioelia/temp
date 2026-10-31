"""POST-HOC additions to earnings_analysis.py (written AFTER seeing its results, 2026-10-29). Nothing here feeds a verdict.

1. Month-block bootstrap 95% CI of the options EV/$ for the pre-registered C1 5-session cells and C2.
2. C1 IV sensitivity: EV/$ at IV = m x RV20(pre) for a grid of m, and the break-even m (EV/$ = 1.0). Translated to an IV
   ceiling for today's names with their latest RV20 in the cache (Yahoo bars end 2026-10-26).
3. C2 IV-ramp sensitivity: exit IV / entry IV of 1.00, 1.05, 1.10 and the pre-registered 1.25 (1.2x -> 1.5x RV).

Run:  python3 -I earnings_posthoc.py <cache_dir> <events_csv> <results_csv_to_append>
"""
import csv
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))  # our own scripts dir (not the data dir)
from earnings_analysis import load_prices, option_ratio  # noqa: E402


def f(x):
    return float(x) if x not in ('', 'nan', None) else np.nan


def boot_ci(vals, groups, reps=2000, seed=7):
    rng = np.random.default_rng(seed)
    gl = sorted(set(groups))
    sums = np.array([sum(v for v, g in zip(vals, groups) if g == k) for k in gl])
    cnts = np.array([sum(1 for g in groups if g == k) for k in gl])
    idx = rng.integers(0, len(gl), size=(reps, len(gl)))
    m = sums[idx].sum(1) / cnts[idx].sum(1)
    return float(np.percentile(m, 2.5)), float(np.percentile(m, 97.5))


def main():
    cache, ev_csv, res_csv = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    ev = list(csv.DictReader(ev_csv.open()))
    for r in ev:
        for k in ('gap', 'ret5', 'rv_pre', 'c2_ret', 'c2_rv'):
            r[k] = f(r[k])
    # calendar days for the 5-session hold and the C2 window, from the SPY calendar
    spy = load_prices(cache, 'SPY')
    ses = sorted(spy)
    ix = {d.isoformat(): i for i, d in enumerate(ses)}
    for r in ev:
        t = ix[r['react_date']]
        r['cal5'] = (ses[t + 5] - ses[t]).days if t + 5 < len(ses) else np.nan
        r['c2_cal'] = (ses[t - 1] - ses[t - 7]).days
        r['month'] = r['react_date'][:7]
    out = []
    cells = [('gap down >= 5%', lambda r: r['gap'] <= -0.05), ('gap down >= 8%', lambda r: r['gap'] <= -0.08),
             ('gap down >= 10%', lambda r: r['gap'] <= -0.10), ('gap up >= 5%', lambda r: r['gap'] >= 0.05),
             ('gap up >= 8%', lambda r: r['gap'] >= 0.08), ('gap both >= 5%', lambda r: abs(r['gap']) >= 0.05)]
    grid = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0]
    for name, fn in cells:
        for period, lo in (('full', '2005'), ('2010-2026', '2010')):
            s = [r for r in ev if fn(r) and r['react_date'] >= lo and not np.isnan(r['ret5'])
                 and not np.isnan(r['rv_pre']) and not np.isnan(r['cal5'])]
            ret = np.array([r['ret5'] for r in s])
            cal = np.array([r['cal5'] for r in s])
            rv = np.array([r['rv_pre'] for r in s])
            call = np.array([r['gap'] > 0 for r in s])
            evs = {}
            for m in grid:
                rat = option_ratio(ret, cal, 25, 0.35, m * rv, m * rv, call)
                evs[m] = float(rat.mean())
                if m == 1.3:
                    clo, chi = boot_ci(list(rat), [r['month'] for r in s])
            be = np.nan
            for a, b in zip(grid, grid[1:]):
                if evs[a] >= 1.0 > evs[b]:
                    be = a + (evs[a] - 1.0) / (evs[a] - evs[b]) * (b - a)
            if evs[grid[0]] < 1.0:
                be = float('-inf')
            out.append({'claim': 'C1', 'test': f'post-hoc IV grid: {name}', 'label': 'post-hoc', 'horizon': 5,
                        'period': period, 'n': len(s), 'opt_ev': evs[1.3], 'ev_ci_lo': clo, 'ev_ci_hi': chi,
                        'breakeven_iv_mult': be, **{f'ev_at_{m}x': evs[m] for m in grid}})
    # C2 ramp grid
    for period, lo in (('full', '2005'), ('2010-2026', '2010')):
        s = [r for r in ev if r['react_date'] >= lo and not np.isnan(r['c2_ret']) and not np.isnan(r['c2_rv'])]
        ret = np.array([r['c2_ret'] for r in s])
        cal = np.array([r['c2_cal'] for r in s])
        rv = np.array([r['c2_rv'] for r in s])
        one = np.ones(len(s), bool)
        row = {'claim': 'C2', 'test': 'post-hoc IV-ramp grid (entry 1.2x RV20)', 'label': 'post-hoc', 'horizon': 6,
               'period': period, 'n': len(s)}
        for ramp in (1.0, 1.05, 1.10, 1.25):
            rat = option_ratio(ret, cal, 30, 0.40, 1.2 * rv, 1.2 * ramp * rv, one)
            row[f'ev_ramp_{ramp}'] = float(rat.mean())
            if ramp == 1.25:
                row['ev_ci_lo'], row['ev_ci_hi'] = boot_ci(list(rat), [r['month'] for r in s])
        out.append(row)
    # 4. C2 with an event-variance IV model: a 30-DTE call bought at t-7 already prices the print, so
    #    IV^2 = (1.2 RV20)^2 + E/T, E = mean squared gap of the ticker's previous 4 non-interim events (known ex ante).
    #    The ramp then comes only from T shrinking (30 -> ~22 calendar days). Pooled and NVDA-only.
    by_tk = {}
    for r in sorted(ev, key=lambda r: r['react_date']):
        by_tk.setdefault(r['ticker'], []).append(r)
    for rs in by_tk.values():
        hist = []
        for r in rs:
            r['E'] = float(np.mean(np.square(hist[-4:]))) if len(hist) >= 2 else np.nan
            if r['interim'] == 'False' and not np.isnan(r['gap']):
                hist.append(r['gap'])
    for name, fn in (('pooled', lambda r: True), ('NVDA', lambda r: r['ticker'] == 'NVDA')):
        for period, lo in (('full', '2005'), ('2010-2026', '2010'), ('2015-2026', '2015')):
            s = [r for r in ev if fn(r) and r['react_date'] >= lo and not np.isnan(r['c2_ret'])
                 and not np.isnan(r['c2_rv']) and not np.isnan(r['E'])]
            ret = np.array([r['c2_ret'] for r in s])
            cal = np.array([r['c2_cal'] for r in s])
            base = 1.2 * np.array([r['c2_rv'] for r in s])
            E = np.array([r['E'] for r in s])
            iv0 = np.sqrt(base ** 2 + E / (30 / 365))
            iv1 = np.sqrt(base ** 2 + E / ((30 - cal) / 365))
            rat = option_ratio(ret, cal, 30, 0.40, iv0, iv1, np.ones(len(s), bool))
            lo_ci, hi_ci = boot_ci(list(rat), [r['month'] for r in s])
            out.append({'claim': 'C2', 'test': f'post-hoc event-variance IV model: {name}', 'label': 'post-hoc',
                        'horizon': 6, 'period': period, 'n': len(s), 'opt_ev': float(rat.mean()),
                        'ev_ci_lo': lo_ci, 'ev_ci_hi': hi_ci, 'mean_iv_entry_over_rv': float(np.mean(iv0 / base * 1.2)),
                        'mean_ramp': float(np.mean(iv1 / iv0))})
    # latest RV20 for the names in today's decisions
    for tk in ('GOOGL', 'INTC', 'NVDA'):
        p = load_prices(cache, tk)
        d = sorted(p)
        w = np.array([p[x] for x in d[-21:]])
        rv = float(np.std(np.diff(np.log(w)), ddof=1) * np.sqrt(252))
        out.append({'claim': 'C1/C2', 'test': f'post-hoc: {tk} RV20 to {d[-1]}', 'label': 'post-hoc', 'period': 'now',
                    'rv20_latest': rv})
    keys = []
    for r in out:
        keys += [k for k in r if k not in keys]
    for r in out:
        print({k: (round(v, 3) if isinstance(v, float) else v) for k, v in r.items()})
    # append to the results CSV as a second block (its own header row)
    with res_csv.open('a', newline='') as fh:
        fh.write('\n')
        w = csv.DictWriter(fh, fieldnames=keys)
        w.writeheader()
        for r in out:
            w.writerow({k: (f'{v:.5f}' if isinstance(v, float) else v) for k, v in r.items()})


if __name__ == '__main__':
    main()
