"""options-vol, 2026-10-30. POST-HOC split of the strategy review's C1 sample (down gaps of 8% or more) by ^VIX and by gap size.

Input for Sunday's pre-registered decision on whether C1 down-gap puts keep a ^VIX <= 22 gate. It is NOT a rule and gives no
verdicts: the split was chosen after the 10/30 O011 cancellation, so every row is labelled post-hoc.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-10-30/scripts/c1_vix_split.py <earnings_cache> <vix_csv> <out_csv>

  earnings_cache  the directory earnings_fetch.py filled (sec/ and yahoo/; Yahoo bars end 2026-10-23..26). Read only, no network.
  vix_csv         Yahoo ^VIX daily closes as options_fetch.py cached them (columns date,close,...; 1990 to 2026-10-29).

Choices fixed before any split was computed (2026-10-30 evening):
  * Events, gap, 5-session excess and abnormal return, hit ('continued'), month-clustered t, month-block bootstrap CI and the
    put model are earnings_analysis.py's own functions and definitions. The per-event rows are rebuilt with the same code as
    its main(); the script stops unless the pooled cell reproduces earnings-results.csv (primary, gap down >= 8%, 5 sessions:
    n 216, hit 0.61574, abnormal 0.00898, t_cl 2.50959, put EV 1.00265).
  * Sample: primary variant, gap <= -8%, entry at the reaction-day close t, 5 sessions.
  * VIX bucket: Yahoo ^VIX close on the reaction day t, <= 22 vs > 22 (the backtest's analogue of the 14:43 live check).
    Sensitivity: the ^VIX close on t-1 (before the print).
  * Gap buckets: -15% < gap <= -8% vs gap <= -15%. Cross cells VIX x gap are descriptive (small n).
  * Periods: full and 2010-2026. Robustness: the review's declared 'earnings_only' variant.
  * Difference high-VIX minus low-VIX (and >= 15% minus 8-15%): month-block bootstrap of the difference (2000 draws, seed 7,
    months of the cell resampled with replacement); p = two-sided share of draws on the other side of 0.
  * Put EV per $: option_ratio(ret5, cal5, 25 DTE, delta 0.35, IV = 1.3 x RV20 ending t-1 at entry and exit, half of a 3%
    spread each way), as in the review; its CI by month-block bootstrap; break-even IV multiple on the earnings_posthoc.py
    grid (1.0-2.0x) by linear interpolation ('inf' = EV >= 1 even at 2.0x; '-inf' = EV < 1 even at 1.0x); 'ev_sens' uses
    RV20 ending t (gap day included), as the review declared.
  * Context columns: mean raw 5-session stock return, mean SPY 5-session return, mean VIX, mean RV20, distinct months/tickers.
  * One further post-hoc row family (written before it was run): late entry at the t+1 close, exit at the t+5 close
    (4 sessions, still inside the 5-session hold), abnormal vs a 4-session same-ticker-same-year baseline, put model as above
    with 24 DTE. It answers "is a Monday INTC put still C1?" descriptively.
"""
import csv
import math
import sys
from datetime import date
from pathlib import Path

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')  # the committed review code
from earnings_analysis import (CIKS, COST_RT, block_boot_ci, build_events, cluster_t, load_prices,  # noqa: E402
                               option_ratio)

GRID = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0]
VIX_CUT = 22.0
EXPECT = {'n': 216, 'hit_rate': 0.61574, 'mean_abn': 0.00898, 't_cl': 2.50959, 'opt_ev': 1.00265}


def load_vix(path):
    out = {}
    with open(path) as fh:
        for r in csv.DictReader(fh):
            if r['close'] not in ('', 'None'):
                out[date.fromisoformat(r['date'])] = float(r['close'])
    return out


def build_rows(cache):
    """earnings_analysis.main()'s per-event rows, for the fields this split needs (same code, same order)."""
    spy_map = load_prices(cache, 'SPY')
    sessions = sorted(d for d in spy_map if d >= date(2004, 11, 1))
    S = np.array([spy_map[d] for d in sessions])
    nS = len(sessions)
    years = np.array([d.year for d in sessions])
    px = {}
    for tk in CIKS:
        m = load_prices(cache, tk)
        px[tk] = np.array([m.get(d, np.nan) for d in sessions])
    events = build_events(cache, sessions)

    def fwd(a, i, h, start=0):
        i0 = i + start
        return a[i0 + h] / a[i0] - 1.0 if i0 + h < nS else np.nan

    def rv20(p, end):
        if end - 20 < 0:
            return np.nan
        w = p[end - 20:end + 1]
        if np.isnan(w).any():
            return np.nan
        return float(np.std(np.diff(np.log(w)), ddof=1) * math.sqrt(252))

    base = {}
    for tk in CIKS:
        p = px[tk]
        for h in (4, 5):
            ex = np.full(nS, np.nan)
            ex[:nS - h] = (p[h:] / p[:-h] - 1) - (S[h:] / S[:-h] - 1)
            for y in np.unique(years):
                v = ex[years == y]
                v = v[~np.isnan(v)]
                base[(tk, int(y), h)] = float(v.mean()) if len(v) > 20 else np.nan
    rows = []
    for e in events:
        tk, t = e['ticker'], e['t']
        p = px[tk]
        if t < 21 or np.isnan(p[t]) or np.isnan(p[t - 1]):
            continue
        d = sessions[t]
        r = {'ticker': tk, 'react_date': d, 'prev_date': sessions[t - 1], 'interim': e['interim'],
             'gap': p[t] / p[t - 1] - 1, 'month': d.strftime('%Y-%m'), 'year': d.year,
             'ret5': fwd(p, t, 5), 'spy5': fwd(S, t, 5), 'base5': base.get((tk, d.year, 5), np.nan),
             'cal5': (sessions[t + 5] - d).days if t + 5 < nS else np.nan,
             'rv_pre': rv20(p, t - 1), 'rv_incl': rv20(p, t)}
        r['ex5'] = r['ret5'] - r['spy5']
        # late entry: close t+1 -> close t+5 (4 sessions)
        if t + 5 < nS:
            r['ret_late'] = fwd(p, t, 4, start=1)
            r['ex_late'] = r['ret_late'] - fwd(S, t, 4, start=1)
            r['base_late'] = base.get((tk, sessions[t + 1].year, 4), np.nan)
            r['cal_late'] = (sessions[t + 5] - sessions[t + 1]).days
            r['day1'] = p[t + 1] / p[t] - 1
        rows.append(r)
    return rows


def stats(sel, late=False):
    """One cell: the review's C1 statistics (sign = -1 for down gaps) plus the put model."""
    k_ex, k_base, k_ret, k_cal, dte = (('ex_late', 'base_late', 'ret_late', 'cal_late', 24) if late
                                       else ('ex5', 'base5', 'ret5', 'cal5', 25))
    ss = [r for r in sel if not np.isnan(r.get(k_ex, np.nan)) and not np.isnan(r.get(k_base, np.nan))]
    out = {'n': len(ss)}
    if len(ss) < 3:
        return out, ss, None
    sg = np.sign([r['gap'] for r in ss])
    raw = sg * np.array([r[k_ex] for r in ss])
    abn = sg * np.array([r[k_ex] - r[k_base] for r in ss])
    groups = [r['month'] for r in ss]
    ti, tc = cluster_t(abn, groups)
    lo, hi = block_boot_ci(abn, groups)
    out.update({'n_months': len(set(groups)), 'n_tickers': len({r['ticker'] for r in ss}),
                'hits': int((raw > 0).sum()), 'hit_rate': float((raw > 0).mean()), 'mean_signed_ex': float(raw.mean()),
                'mean_abn': float(abn.mean()), 'median_abn': float(np.median(abn)), 't_iid': ti, 't_cl': tc,
                'ci_lo': lo, 'ci_hi': hi, 'worst_abn': float(abn.min()), 'mean_abn_net_cost': float(abn.mean() - COST_RT),
                'mean_ret5': float(np.mean([r[k_ret] for r in ss])),
                'mean_vix': float(np.mean([r['vix_t'] for r in ss if not np.isnan(r['vix_t'])])),
                'mean_rv_pre': float(np.nanmean([r['rv_pre'] for r in ss])),
                'mean_gap': float(np.mean([r['gap'] for r in ss]))})
    if not late:
        out['mean_spy5'] = float(np.mean([r['spy5'] for r in ss]))
    ok = [r for r in ss if not np.isnan(r['rv_pre']) and not np.isnan(r[k_ret]) and not np.isnan(r[k_cal])]
    rat = None
    if len(ok) >= 3:
        ret = np.array([r[k_ret] for r in ok])
        cal = np.array([r[k_cal] for r in ok])
        call = np.array([r['gap'] > 0 for r in ok])
        rv = np.array([r['rv_pre'] for r in ok])
        evs = {m: float(option_ratio(ret, cal, dte, 0.35, m * rv, m * rv, call).mean()) for m in GRID}
        rat = option_ratio(ret, cal, dte, 0.35, 1.3 * rv, 1.3 * rv, call)
        elo, ehi = block_boot_ci(rat, [r['month'] for r in ok])
        be = np.nan
        for a, b in zip(GRID, GRID[1:]):
            if evs[a] >= 1.0 > evs[b]:
                be = a + (evs[a] - 1.0) / (evs[a] - evs[b]) * (b - a)
        if evs[GRID[0]] < 1.0:
            be = float('-inf')
        elif evs[GRID[-1]] >= 1.0:
            be = float('inf')
        out.update({'opt_n': len(ok), 'opt_ev': float(rat.mean()), 'opt_ev_ci_lo': elo, 'opt_ev_ci_hi': ehi,
                    'opt_median': float(np.median(rat)), 'opt_pwin': float((rat > 1).mean()),
                    'breakeven_iv_mult': be})
        if not late:
            iv_s = 1.3 * np.array([r['rv_incl'] for r in ok])
            out['opt_ev_sens'] = float(option_ratio(ret, cal, dte, 0.35, iv_s, iv_s, call).mean())
        rat = (rat, [r['month'] for r in ok])
    return out, ss, rat


def diff_boot(cell_a, cell_b, reps=2000, seed=7):
    """Month-block bootstrap of mean(b) - mean(a) for paired value lists [(value, month)], months resampled jointly."""
    months = sorted({m for _, m in cell_a} | {m for _, m in cell_b})
    mi = {m: i for i, m in enumerate(months)}
    sa, ca, sb, cb = (np.zeros(len(months)) for _ in range(4))
    for v, m in cell_a:
        sa[mi[m]] += v
        ca[mi[m]] += 1
    for v, m in cell_b:
        sb[mi[m]] += v
        cb[mi[m]] += 1
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(months), size=(reps, len(months)))
    na, nb = ca[idx].sum(1), cb[idx].sum(1)
    keep = (na > 0) & (nb > 0)
    d = sb[idx].sum(1)[keep] / nb[keep] - sa[idx].sum(1)[keep] / na[keep]
    point = sb.sum() / cb.sum() - sa.sum() / ca.sum()
    p = 2 * min((d <= 0).mean(), (d >= 0).mean())
    return float(point), float(np.percentile(d, 2.5)), float(np.percentile(d, 97.5)), float(min(p, 1.0))


def main():
    cache, vix_csv, out_csv = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    vix = load_vix(vix_csv)
    rows = build_rows(cache)
    for r in rows:
        r['vix_t'] = vix.get(r['react_date'], np.nan)
        r['vix_prev'] = vix.get(r['prev_date'], np.nan)
    down = [r for r in rows if r['gap'] <= -0.08]
    miss = [r for r in down if np.isnan(r['vix_t'])]
    if miss:
        sys.exit(f'no ^VIX close for {len(miss)} reaction days, e.g. {miss[0]["react_date"]}')

    pooled, _, _ = stats(down)
    for k, v in EXPECT.items():
        if abs(pooled[k] - v) > (0 if k == 'n' else 6e-5):
            sys.exit(f'reproduction failed: {k} {pooled[k]} vs {v}')
    print('reproduced earnings-results.csv: n', pooled['n'], 'hit', round(pooled['hit_rate'], 5), 'abn',
          round(pooled['mean_abn'], 5), 't_cl', round(pooled['t_cl'], 5), 'EV', round(pooled['opt_ev'], 5))

    out = []
    keep_vals = {}

    def add(split, bucket, period, variant, sel, late=False):
        s, ss, rat = stats(sel, late)
        row = {'label': 'post-hoc (input for a pre-registered rule; not a rule)', 'variant': variant,
               'entry': 't+1 close -> t+5 close' if late else 't close -> t+5 close', 'split': split, 'bucket': bucket,
               'period': period, **s}
        out.append(row)
        sg = -1.0
        k_ex, k_base = ('ex_late', 'base_late') if late else ('ex5', 'base5')
        keep_vals[(split, bucket, period, variant, late)] = (
            [(sg * (r[k_ex] - r[k_base]), r['month']) for r in ss],
            list(zip(rat[0].tolist(), rat[1])) if rat else [])
        return row

    splits = [
        ('all', 'gap <= -8%', lambda r: True),
        ('vix_t', 'VIX close t <= 22', lambda r: r['vix_t'] <= VIX_CUT),
        ('vix_t', 'VIX close t > 22', lambda r: r['vix_t'] > VIX_CUT),
        ('vix_prev', 'VIX close t-1 <= 22', lambda r: r['vix_prev'] <= VIX_CUT),
        ('vix_prev', 'VIX close t-1 > 22', lambda r: r['vix_prev'] > VIX_CUT),
        ('gap', 'gap -8% to -15%', lambda r: r['gap'] > -0.15),
        ('gap', 'gap <= -15%', lambda r: r['gap'] <= -0.15),
        ('vix_t x gap', 'VIX <= 22, gap -8% to -15%', lambda r: r['vix_t'] <= VIX_CUT and r['gap'] > -0.15),
        ('vix_t x gap', 'VIX <= 22, gap <= -15%', lambda r: r['vix_t'] <= VIX_CUT and r['gap'] <= -0.15),
        ('vix_t x gap', 'VIX > 22, gap -8% to -15%', lambda r: r['vix_t'] > VIX_CUT and r['gap'] > -0.15),
        ('vix_t x gap', 'VIX > 22, gap <= -15%', lambda r: r['vix_t'] > VIX_CUT and r['gap'] <= -0.15),
    ]
    for variant, base_sel in (('primary', down), ('earnings_only', [r for r in down if not r['interim']])):
        for period, lo in (('full', date(2005, 1, 1)), ('2010-2026', date(2010, 1, 1))):
            sel0 = [r for r in base_sel if r['react_date'] >= lo]
            for split, bucket, fn in splits:
                if variant == 'earnings_only' and split not in ('all', 'vix_t', 'gap'):
                    continue
                add(split, bucket, period, variant, [r for r in sel0 if fn(r)])
    # late entry (t+1), pooled and by the same buckets
    for split, bucket, fn in splits[:3] + splits[5:7]:
        add(split, bucket, 'full', 'primary', [r for r in down if fn(r)], late=True)

    # differences
    pairs = [('vix_t', 'VIX close t <= 22', 'VIX close t > 22'), ('vix_prev', 'VIX close t-1 <= 22', 'VIX close t-1 > 22'),
             ('gap', 'gap -8% to -15%', 'gap <= -15%')]
    for variant in ('primary', 'earnings_only'):
        for period in ('full', '2010-2026'):
            for split, a, b in pairs:
                ka, kb = (split, a, period, variant, False), (split, b, period, variant, False)
                if ka not in keep_vals or kb not in keep_vals:
                    continue
                row = {'label': 'post-hoc difference (second minus first bucket)', 'variant': variant,
                       'entry': 't close -> t+5 close', 'split': split, 'bucket': f'[{b}] minus [{a}]', 'period': period}
                for name, j in (('abn', 0), ('opt_ev', 1)):
                    pt, lo, hi, p = diff_boot(keep_vals[ka][j], keep_vals[kb][j])
                    row.update({f'diff_{name}': pt, f'diff_{name}_ci_lo': lo, f'diff_{name}_ci_hi': hi, f'diff_{name}_p': p})
                out.append(row)

    cols = ['label', 'variant', 'entry', 'split', 'bucket', 'period', 'n', 'n_months', 'n_tickers', 'hits', 'hit_rate',
            'mean_signed_ex', 'mean_abn', 'median_abn', 't_iid', 't_cl', 'ci_lo', 'ci_hi', 'worst_abn', 'mean_abn_net_cost',
            'mean_ret5', 'mean_spy5', 'mean_gap', 'mean_vix', 'mean_rv_pre', 'opt_n', 'opt_ev', 'opt_ev_ci_lo',
            'opt_ev_ci_hi', 'opt_median', 'opt_pwin', 'opt_ev_sens', 'breakeven_iv_mult',
            'diff_abn', 'diff_abn_ci_lo', 'diff_abn_ci_hi', 'diff_abn_p',
            'diff_opt_ev', 'diff_opt_ev_ci_lo', 'diff_opt_ev_ci_hi', 'diff_opt_ev_p']
    with out_csv.open('w', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction='ignore')
        w.writeheader()
        for r in out:
            w.writerow({k: (f'{v:.5f}' if isinstance(v, float) else v) for k, v in r.items() if k in cols})

    # console summary and the high-VIX / big-gap event lists (for the memo; not written to the CSV)
    show = ['n', 'n_months', 'hit_rate', 'mean_abn', 't_cl', 'mean_ret5', 'mean_spy5', 'opt_ev', 'opt_ev_ci_lo',
            'opt_ev_ci_hi', 'breakeven_iv_mult']
    for r in out:
        print(r['variant'], r['period'], r['entry'][:6], '|', r['bucket'], '|',
              {k: (round(r[k], 4) if isinstance(r.get(k), float) else r.get(k)) for k in show + [
                  'diff_abn', 'diff_abn_ci_lo', 'diff_abn_ci_hi', 'diff_abn_p', 'diff_opt_ev', 'diff_opt_ev_ci_lo',
                  'diff_opt_ev_ci_hi', 'diff_opt_ev_p'] if k in r})
    print('\nevents with VIX close t > 22 (ticker, date, gap, VIX t, VIX t-1, signed 5d excess, ret5, SPY5):')
    for r in sorted((r for r in down if r['vix_t'] > VIX_CUT), key=lambda r: r['react_date']):
        print(' ', r['ticker'], r['react_date'], f"{r['gap']:+.3f}", f"{r['vix_t']:.1f}", f"{r['vix_prev']:.1f}",
              f"{-r['ex5']:+.3f}", f"{r['ret5']:+.3f}", f"{r['spy5']:+.3f}")
    print('\nevents with gap <= -15%:')
    for r in sorted((r for r in down if r['gap'] <= -0.15), key=lambda r: r['react_date']):
        print(' ', r['ticker'], r['react_date'], f"{r['gap']:+.3f}", f"{r['vix_t']:.1f}", f"{-r['ex5']:+.3f}",
              f"{r['ret5']:+.3f}")
    print('\nINTC down gaps >= 8% in the sample:')
    for r in sorted((r for r in down if r['ticker'] == 'INTC'), key=lambda r: r['react_date']):
        print(' ', r['react_date'], f"{r['gap']:+.3f}", f"VIX {r['vix_t']:.1f}", f"5d signed ex {-r['ex5']:+.3f}")


if __name__ == '__main__':
    main()
