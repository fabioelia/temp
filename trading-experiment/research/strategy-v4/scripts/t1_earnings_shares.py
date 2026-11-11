"""Strategy v4, claim T1: the earnings premium in shares (C2 without options), as pre-registered in ../claims.md.

Run:  python3 -I t1_earnings_shares.py <cache_dir> [<events_csv>]
      cache_dir = the C2 cache that ../../strategy-review/scripts/earnings_fetch.py filled (sec/ and yahoo/), e.g.
      /tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-data/earnings
      Reads only that cached raw JSON (no network). Yahoo bars there end 2026-10-23.

Claim (claims.md T1): buying a tested name at the close 7 sessions before its earnings date and selling at the close the
session before the print earns more than SPY. Test: the strategy-review C2 data and code, 25 names 2005-2026, 10 bps per
round trip. CONFIRMED if the per-event excess is > 0 with t > 2 in both halves (2005-09 and 2010-26) and since 2015.

Specification (every choice claims.md leaves open, FIXED HERE BEFORE ANY T1 RESULT WAS COMPUTED, 2026-11-11):
  Events and windows: exactly C2's. The event list, reaction day t, merge rule and price loader are imported from the
    committed earnings_analysis.py (PRIMARY = all 8-K item 2.02 events). Entry = adjusted close t-7, exit = adjusted
    close t-1 (the last close before the print for both after-close and pre-open filers). The sample is C2's: events
    with t >= 21, prices at t, t-1 and t-7, t-7 >= 20, and a defined same-year baseline (so n matches C2's 2,260).
  Per-event excess (the deciding statistic) = stock return t-7 -> t-1 minus SPY's return over the same closes, minus
    10 bps (one stock round trip; the SPY alternative is a hold, so it pays no cost).
  Periods by reaction date: full, 2005-2009, 2010-2026, 2015-2026 ("since 2015"), plus 2005-2014 and the last 10 years
    for information.
  t = C2's cluster-robust t by reaction-day calendar month (event windows of different names overlap in earnings
    season). Also reported: n, mean, median, hit rate (net excess > 0), month-block bootstrap 95% CI (2000 draws,
    seed 7), worst event, iid t.
  Verdict (claims.md rule, mechanical): CONFIRMED if the net excess mean > 0 and t_cl > 2 in 2005-2009, 2010-2026 AND
    2015-2026 (PROTOCOL's own CONFIRMED conditions - full-sample |t| >= 2, 2010-26 >= half the full mean, survives
    costs - are checked and printed too). REJECTED if the full-sample net mean <= 0, or |t_cl full| < 1, or the
    2010-2026 net mean <= 0 (C2's rule: no effect, or only in early data). WEAK otherwise.
  PROTOCOL rule-3 check (declared secondary, printed, not the T1 verdict): the same statistic against C2's random-entry
    baseline, i.e. net excess minus that ticker's mean 6-session excess over every entry day of the same calendar year
    (C2's 'abnormal'). Today's mega-caps beat SPY over 2005-2026 (survivorship), so the raw excess carries that drift;
    the secondary verdict applies the same thresholds to the abnormal and is reported beside the main one.
  Declared robustness (printed, not deciding): C2's 'earnings_only' variant (drops interim 2.02 filings).
"""
import csv
import sys
from datetime import date
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'strategy-review' / 'scripts'))
import earnings_analysis as ea  # noqa: E402  (committed C2 code: loaders, events, clustered t, bootstrap)

COST_RT = 0.0010
PERIODS = [("full", date(2005, 1, 1), date(2026, 12, 31)), ("2005-2009", date(2005, 1, 1), date(2009, 12, 31)),
           ("2010-2026", date(2010, 1, 1), date(2026, 12, 31)), ("2015-2026", date(2015, 1, 1), date(2026, 12, 31)),
           ("2005-2014", date(2005, 1, 1), date(2014, 12, 31)), ("last10y", date(2016, 10, 23), date(2026, 12, 31))]
DECIDING = ("2005-2009", "2010-2026", "2015-2026")


def build_rows(cache):
    spy_map = ea.load_prices(cache, 'SPY')
    sessions = sorted(d for d in spy_map if d >= date(2004, 11, 1))
    S = np.array([spy_map[d] for d in sessions])
    nS = len(sessions)
    years = np.array([d.year for d in sessions])
    px = {}
    for tk in ea.CIKS:
        m = ea.load_prices(cache, tk)
        px[tk] = np.array([m.get(d, np.nan) for d in sessions])
    # C2's same-year random-entry baseline for the 6-session window (identical to earnings_analysis.py, h = 6)
    base = {}
    h = 6
    for tk in ea.CIKS:
        p = px[tk]
        ex = np.full(nS, np.nan)
        ex[:nS - h] = (p[h:] / p[:-h] - 1) - (S[h:] / S[:-h] - 1)
        for y in np.unique(years):
            v = ex[years == y]
            v = v[~np.isnan(v)]
            base[(tk, int(y))] = float(v.mean()) if len(v) > 20 else np.nan
    rows = []
    for e in ea.build_events(cache, sessions):
        tk, t = e['ticker'], e['t']
        p = px[tk]
        if t < 21 or np.isnan(p[t]) or np.isnan(p[t - 1]):
            continue
        if not (t - 7 >= 20 and not np.isnan(p[t - 7])):
            continue
        b = base.get((tk, sessions[t - 7].year), np.nan)
        ex = (p[t - 1] / p[t - 7] - 1) - (S[t - 1] / S[t - 7] - 1)
        if np.isnan(ex) or np.isnan(b):
            continue
        d = sessions[t]
        rows.append({'ticker': tk, 'react_date': d, 'entry': sessions[t - 7], 'exit': sessions[t - 1],
                     'month': d.strftime('%Y-%m'), 'interim': e['interim'], 'stock_ret': p[t - 1] / p[t - 7] - 1,
                     'spy_ret': S[t - 1] / S[t - 7] - 1, 'ex_gross': ex, 'ex_net': ex - COST_RT,
                     'abn_net': ex - b - COST_RT})
    return rows


def stats(sel, key):
    x = np.array([r[key] for r in sel])
    g = [r['month'] for r in sel]
    ti, tc = ea.cluster_t(x, g)
    lo, hi = ea.block_boot_ci(x, g)
    return {'n': len(x), 'mean': x.mean(), 'median': float(np.median(x)), 'hit': float((x > 0).mean()), 't_iid': ti,
            't_cl': tc, 'ci_lo': lo, 'ci_hi': hi, 'worst': float(x.min())}


def verdict(res):
    full, late = res['full'], res['2010-2026']
    if full['mean'] <= 0 or abs(full['t_cl']) < 1 or late['mean'] <= 0:
        return 'REJECTED'
    if all(res[p]['mean'] > 0 and res[p]['t_cl'] > 2 for p in DECIDING):
        return 'CONFIRMED'
    return 'WEAK'


def protocol_check(res):
    full, late = res['full'], res['2010-2026']
    return (f"PROTOCOL: full |t| >= 2: {abs(full['t_cl']) >= 2}; 2010-26 >= half full mean: "
            f"{late['mean'] >= 0.5 * full['mean']}; survives costs (net mean > 0): {full['mean'] > 0}")


def report(rows, label):
    print(f'\n## {label}')
    for key, name in (('ex_net', 'net excess vs SPY (DECIDING)'), ('abn_net', 'net abnormal vs random entry (PROTOCOL rule 3)')):
        print(f'\n{name}')
        print('period        n     mean   median   hit    t_cl   t_iid   95% CI (block boot)    worst')
        res = {}
        for pname, a, b in PERIODS:
            sel = [r for r in rows if a <= r['react_date'] <= b]
            s = res[pname] = stats(sel, key)
            print(f"{pname:<10}{s['n']:>6} {s['mean']*100:>7.3f}% {s['median']*100:>6.3f}% {s['hit']*100:>5.1f}%"
                  f" {s['t_cl']:>6.2f} {s['t_iid']:>6.2f}   [{s['ci_lo']*100:>6.3f}%, {s['ci_hi']*100:>6.3f}%] "
                  f"{s['worst']*100:>7.2f}%")
        print('verdict (claims.md rule):', verdict(res), '|', protocol_check(res))
    if label.startswith('PRIMARY'):
        g = np.array([r['ex_gross'] for r in rows])
        print(f"\ngross excess (before 10 bps), full: mean {g.mean()*100:.3f}%; stock leg mean "
              f"{np.mean([r['stock_ret'] for r in rows])*100:.3f}%, SPY leg mean {np.mean([r['spy_ret'] for r in rows])*100:.3f}%")
        by = {}
        for r in rows:
            by.setdefault(r['ticker'], []).append(r['ex_net'])
        pos = sum(np.mean(v) > 0 for v in by.values())
        print(f'tickers with mean net excess > 0: {pos} of {len(by)}; last event exit {max(r["exit"] for r in rows)}')


def main():
    cache = Path(sys.argv[1])
    rows = build_rows(cache)
    report(rows, 'PRIMARY: all 8-K 2.02 events, close t-7 -> close t-1, 10 bps round trip')
    report([r for r in rows if not r['interim']], 'DECLARED ROBUSTNESS: earnings_only (interim 2.02s dropped)')
    if len(sys.argv) > 2:
        keys = ['ticker', 'react_date', 'entry', 'exit', 'interim', 'stock_ret', 'spy_ret', 'ex_gross', 'ex_net', 'abn_net']
        with open(sys.argv[2], 'w', newline='') as fh:
            w = csv.DictWriter(fh, fieldnames=keys, extrasaction='ignore')
            w.writeheader()
            for r in rows:
                w.writerow({k: (f'{r[k]:.6f}' if isinstance(r[k], float) else r[k]) for k in keys})


if __name__ == '__main__':
    main()
