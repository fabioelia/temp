#!/usr/bin/env python3
"""Historian 2026-11-08: S&P 500 base rates over 1, 3 and 12 months after (a) a Nasdaq correction of 10%+ and (b) a week with a 4%+
single-day S&P 500 drop. Question: does the history argue for or against Monday's index-core buy (80% VOO / 20% SGOV), beyond the
unconditional S1 numbers (research/strategy-v2/core-equity.md)? Descriptive base rates plus one fixed decision rule; not a claim test
under research/strategy-review/claims.md.

Run (from /home/user/temp; stdlib + numpy):
  python3 -I trading-experiment/research/2026-11-08/scripts/historian_1108.py DATA_DIR

DATA_DIR holds raw Yahoo v8 chart JSON, untouched, fetched 2026-11-08 18:36 ET with curl -A 'Mozilla/5.0', one file per symbol and decade
(range=max returns monthly bars):
  https://query1.finance.yahoo.com/v8/finance/chart/{SYM}?period1={Jan 1 of Y}&period2={min(Jan 1 of Y+10, 2026-11-08 12:00 UTC)}
  &interval=1d&events=div%2Csplit&includeAdjustedClose=true   saved as {NAME}_{Y}.json
  GSPC = ^GSPC (Y 1950..2020), IXIC = ^IXIC (1970..2020), NDX = ^NDX (1980..2020), SPY (1990..2020). Last bar expected: 2026-11-06.
The script refuses chunks that are not daily bars. Dates are exchange-local (timestamp + gmtoffset).

SPECIFICATION, FIXED BEFORE THE FIRST RUN (2026-11-08 evening ET). Nothing below is changed after a result is seen.
  Master calendar: ^GSPC sessions. Other series are looked up by date (missing date = condition False / return skipped).
  Returns: r_h(t) = ^GSPC close(t+h) / close(t) - 1, h = 21, 63, 252 sessions (1, 3, 12 months), price only (dividends excluded, about
    1.3-2% a year; conditional and baseline are on the same basis). Robustness: SPY adjclose (total return, the S1 basis) from 1993.
    A window running past the last bar is dropped for that horizon (n is per horizon).
  Drawdown dd_X(t) = close_X(t) / running max of X's own closes up to t - 1 (record close since the series starts).
  Path pain: MAE_h(t) = min over k = 1..h of close(t+k) / close(t) - 1; reported as mean, 10th percentile and P(MAE <= -10%).
  (a) Nasdaq correction.
    A1 PRIMARY: first-crossing events on ^IXIC (from 1971-02-05). Armed at the start; event at the first close with dd_IXIC <= -10% while
       armed, then disarmed; re-armed at the first later close with dd_IXIC >= -5%. Entry = the crossing close t.
    A1+5 (secondary timing): the same events, entry at the close 5 sessions after the crossing (about a week later, as now).
    A2 (secondary, state): every close with -20% < dd_IXIC <= -10% (in a correction, not a bear market; now about -13%).
    A3 (secondary, tech-led): A2 and dd_GSPC > -10% at the same close.
    A1-NDX, A2-NDX (robustness): A1 and A2 on ^NDX (from 1985-10-01) instead of ^IXIC.
  (b) S&P 4% week.
    B1 PRIMARY: every ISO calendar week containing at least one ^GSPC close-to-close return <= -4.0% (1950 on). Entry = the close of the
       first session of the next ISO week (now: Monday 11/9, after Thursday 11/5's -4.36%). Several -4% days in one week = one event.
    B1e (secondary): the first B1 week of each episode; a B1 week starts a new episode if its first -4% day is more than 63 sessions after
       the previous B1 week's last -4% day.
  (c) Joint, as now. C: B1 weeks with dd_IXIC <= -10% at the entry close (1971 on).
  Baseline for each sample: every close of the master calendar from the first date that sample's series exist (^GSPC: 1950-01-03;
    ^IXIC: 1971-02-05; ^NDX: 1985-10-01; SPY: 1993-01-29) with a full h window. Excess = sample mean - baseline mean.
  Clusters (for overlap): within a sample, entries sorted by date; a new cluster starts when an entry is more than h sessions after the
    previous entry (horizon-specific). "Episodes" = the number of clusters at that h.
  Inference: cluster bootstrap, resampling whole clusters, 5,000 resamples, seed 20261108; 95% CI (2.5/97.5 percentiles) of the sample
    mean and of the excess (baseline treated as fixed); "t" = excess / bootstrap sd of the excess. Pre-2010 / 2010-2026 means by entry date.
  Per cell: n, episodes, mean, median, % > 0, p10, worst, MAE (mean, p10, P <= -10%), baseline mean / median / % > 0 / p10, excess, CIs, t.
  DECISION RULE (primary cells only: A1 and B1, ^GSPC price, h = 21, 63, 252; six cells):
    cell FOR      if excess > 0 and its 95% CI lower bound > 0 and episodes >= 10;
    cell AGAINST  if excess < 0 and its 95% CI upper bound < 0 and episodes >= 10;
    otherwise NEUTRAL.
    Overall: FOR if at least one cell is FOR and none AGAINST; AGAINST if at least one AGAINST and none FOR; otherwise NO MEASURABLE
    DIFFERENCE (S1 stands unchanged). An overall FOR/AGAINST resting on a single cell is labelled WEAK (six tests at 5% give about a 26%
    chance of one false pass). Secondary and robustness rows inform the write-up but do not change the verdict.
    Separately, per primary cell: "conditional mean > 0" if the 95% CI of the sample mean lies above 0.
  Dollar view: the core's VOO leg = 80% x $1,384.84 (brief) = $1,107.87; mean dollar change per horizon, conditional vs baseline.
  Current state (printed, no forward data): last bar, dd of ^IXIC / ^NDX / ^GSPC, the latest A1 crossing, the latest B1 week.
"""
import glob
import json
import os
import sys
from datetime import date, datetime, timezone

import numpy as np

HS = (21, 63, 252)
THRESH_DROP = -0.040
CORR, BEAR, REARM = -0.10, -0.20, -0.05
EP_GAP_B = 63
NBOOT = 5000
SEED = 20261108
VOO_AMT = 0.80 * 1384.84
SPLIT = date(2010, 1, 1)


def load(data_dir, name):
    files = sorted(glob.glob(os.path.join(data_dir, f'{name}_*.json')))
    if not files:
        raise SystemExit(f'no files for {name}')
    rows = {}
    for f in files:
        with open(f) as fh:
            res = json.load(fh)['chart']['result'][0]
        if res['meta'].get('dataGranularity') != '1d':
            raise SystemExit(f'{f}: not daily')
        off = res['meta'].get('gmtoffset', 0) or 0
        ts = res.get('timestamp') or []
        q = res['indicators']['quote'][0]
        adj = (res['indicators'].get('adjclose') or [{}])[0].get('adjclose') or [None] * len(ts)
        for t, c, a in zip(ts, q.get('close', []), adj):
            if c is None or c <= 0:
                continue
            d = datetime.fromtimestamp(t + off, tz=timezone.utc).date()
            rows[d] = (float(c), float(a) if a is not None else float(c))
    return rows


def own_dd(rows):
    ds = sorted(rows)
    c = np.array([rows[d][0] for d in ds])
    dd = c / np.maximum.accumulate(c) - 1
    return dict(zip(ds, dd))


def clusters(idx, h):
    out, cur, prev = [], -1, None
    for i in idx:
        if prev is None or i - prev > h:
            cur += 1
        out.append(cur)
        prev = i
    return np.array(out, dtype=int)


def boot(vals, cl, base_mean, rng):
    ids = np.unique(cl)
    sums = np.array([vals[cl == k].sum() for k in ids])
    cnts = np.array([(cl == k).sum() for k in ids])
    pick = rng.integers(0, len(ids), size=(NBOOT, len(ids)))
    means = sums[pick].sum(axis=1) / cnts[pick].sum(axis=1)
    exc = means - base_mean
    return np.percentile(means, [2.5, 97.5]), np.percentile(exc, [2.5, 97.5]), exc.std(ddof=1)


def pct(x):
    return f'{100 * x:+.1f}%'


class Panel:
    def __init__(self, cal, px):
        self.cal = cal
        self.px = px  # close (or adjclose) array aligned to cal, NaN where missing
        self.n = len(cal)

    def fwd(self, t, h):
        if t + h >= self.n:
            return None
        a, b = self.px[t], self.px[t + h]
        if not (np.isfinite(a) and np.isfinite(b)):
            return None
        return b / a - 1

    def mae(self, t, h):
        if t + h >= self.n:
            return None
        seg = self.px[t + 1:t + h + 1]
        if not np.all(np.isfinite(seg)) or not np.isfinite(self.px[t]):
            return None
        return seg.min() / self.px[t] - 1


def cell(label, panel, idx, start, h, rng, out_rows):
    """Statistics for one sample (entry indices idx) at horizon h against the baseline from index start."""
    ev = [(t, panel.fwd(t, h), panel.mae(t, h)) for t in sorted(set(idx)) if t >= start]
    ev = [e for e in ev if e[1] is not None]
    base = np.array([v for v in (panel.fwd(t, h) for t in range(start, panel.n)) if v is not None])
    bm = base.mean()
    if not ev:
        print(f'  {label:<22} h={h:<3} n=0')
        return None
    ti = [e[0] for e in ev]
    v = np.array([e[1] for e in ev])
    m = np.array([e[2] for e in ev])
    cl = clusters(ti, h)
    neps = len(np.unique(cl))
    ci_m, ci_x, sd_x = boot(v, cl, bm, rng)
    pre = [x for t, x in zip(ti, v) if panel.cal[t] < SPLIT]
    post = [x for t, x in zip(ti, v) if panel.cal[t] >= SPLIT]
    exc = v.mean() - bm
    tval = exc / sd_x if sd_x > 0 else float('nan')
    print(f'  {label:<22} h={h:<3} n={len(v):<5} eps={neps:<3} mean {pct(v.mean())} [CI {pct(ci_m[0])},{pct(ci_m[1])}] '
          f'med {pct(np.median(v))} >0 {100 * (v > 0).mean():.0f}% p10 {pct(np.percentile(v, 10))} worst {pct(v.min())} | '
          f'base {pct(bm)} med {pct(np.median(base))} >0 {100 * (base > 0).mean():.0f}% p10 {pct(np.percentile(base, 10))} | '
          f'excess {pct(exc)} [CI {pct(ci_x[0])},{pct(ci_x[1])}] t {tval:+.2f} | '
          f'MAE mean {pct(m.mean())} p10 {pct(np.percentile(m, 10))} P<=-10% {100 * (m <= -0.10).mean():.0f}% | '
          f'pre2010 {pct(np.mean(pre)) if pre else "na"} (n {len(pre)}) 2010+ {pct(np.mean(post)) if post else "na"} (n {len(post)})')
    r = dict(label=label, h=h, n=len(v), eps=neps, mean=v.mean(), ci_m=ci_m, base=bm, exc=exc, ci_x=ci_x, t=tval,
             p_pos=(v > 0).mean(), base_pos=(base > 0).mean(), p10=np.percentile(v, 10), base_p10=np.percentile(base, 10),
             mae_p10=np.percentile(m, 10), mae_hit=(m <= -0.10).mean())
    out_rows.append(r)
    return r


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    data_dir = sys.argv[1]
    G, IX, NDX, SPY = (load(data_dir, k) for k in ('GSPC', 'IXIC', 'NDX', 'SPY'))
    for name, rows in (('GSPC', G), ('IXIC', IX), ('NDX', NDX), ('SPY', SPY)):
        ds = sorted(rows)
        years = {}
        for d in ds:
            years[d.year] = years.get(d.year, 0) + 1
        thin = [y for y, k in years.items() if y not in (ds[0].year, ds[-1].year) and not 240 <= k <= 260]
        print(f'{name}: {ds[0]} .. {ds[-1]}  sessions {len(ds)}  last close {rows[ds[-1]][0]:.2f} (adj {rows[ds[-1]][1]:.2f})'
              f'  years outside 240-260 sessions: {thin if thin else "none"}')
    cal = sorted(G)
    pos = {d: i for i, d in enumerate(cal)}
    n = len(cal)
    gc = np.array([G[d][0] for d in cal])
    spy_adj = np.array([SPY[d][1] if d in SPY else np.nan for d in cal])
    P_g = Panel(cal, gc)
    P_s = Panel(cal, spy_adj)
    ddG = own_dd(G)
    ddI_own, ddN_own = own_dd(IX), own_dd(NDX)
    ddI = np.array([ddI_own.get(d, np.nan) for d in cal])
    ddN = np.array([ddN_own.get(d, np.nan) for d in cal])
    ddGa = np.array([ddG[d] for d in cal])
    r1 = np.r_[np.nan, gc[1:] / gc[:-1] - 1]

    start_g = 0
    start_i = pos[min(d for d in IX if d in pos)]
    start_n = pos[min(d for d in NDX if d in pos)]
    start_s = pos[min(d for d in SPY if d in pos)]

    def a1(dd, st):
        ev, armed = [], True
        for t in range(st, n):
            x = dd[t]
            if not np.isfinite(x):
                continue
            if armed and x <= CORR:
                ev.append(t)
                armed = False
            elif not armed and x >= REARM:
                armed = True
        return ev

    A1 = a1(ddI, start_i)
    A1p5 = [t + 5 for t in A1 if t + 5 < n]
    A2 = [t for t in range(start_i, n) if np.isfinite(ddI[t]) and BEAR < ddI[t] <= CORR]
    A3 = [t for t in A2 if ddGa[t] > CORR]
    A1N = a1(ddN, start_n)
    A2N = [t for t in range(start_n, n) if np.isfinite(ddN[t]) and BEAR < ddN[t] <= CORR]

    weeks = {}
    for t in range(1, n):
        if r1[t] <= THRESH_DROP:
            weeks.setdefault(cal[t].isocalendar()[:2], []).append(t)
    wk_of = [d.isocalendar()[:2] for d in cal]
    B1_rows = []  # (week, drop indices, entry index or None)
    for wk in sorted(weeks):
        last = max(weeks[wk])
        j = last + 1
        while j < n and wk_of[j] == wk:
            j += 1
        B1_rows.append((wk, weeks[wk], j if j < n else None))
    B1 = [e for _, _, e in B1_rows if e is not None]
    B1e, prev_last = [], None
    for wk, drops, e in B1_rows:
        if prev_last is None or min(drops) - prev_last > EP_GAP_B:
            if e is not None:
                B1e.append(e)
        prev_last = max(drops)
    C = [e for e in B1 if np.isfinite(ddI[e]) and ddI[e] <= CORR]

    print('\nCURRENT STATE (last bar, no forward data)')
    t = n - 1
    print(f'  last bar {cal[t]}: ^GSPC {gc[t]:.2f} dd {pct(ddGa[t])}; ^IXIC dd {pct(ddI[t])}; ^NDX dd {pct(ddN[t])}; '
          f'^GSPC day return {pct(r1[t])}')
    print(f'  latest A1 (^IXIC) crossing: {cal[A1[-1]]} (dd {pct(ddI[A1[-1]])}); latest A1-NDX crossing: {cal[A1N[-1]]} '
          f'(dd {pct(ddN[A1N[-1]])})')
    wk, drops, e = B1_rows[-1]
    print(f'  latest B1 week {wk}: -4% days {[(str(cal[i]), pct(r1[i])) for i in drops]}; entry '
          f'{cal[e] if e is not None else "next session (Mon 11/9, not yet traded)"}')
    print(f'  now in A2: {BEAR < ddI[t] <= CORR}; in A3: {BEAR < ddI[t] <= CORR and ddGa[t] > CORR}; joint C condition now: '
          f'{ddI[t] <= CORR}')

    print('\nA1 EVENTS (^IXIC first close <= -10% from its record; re-armed at -5%); ^GSPC price returns from the crossing close')
    for t in A1:
        f = [P_g.fwd(t, h) for h in HS]
        print(f'  {cal[t]}  IXIC dd {pct(ddI[t])}  GSPC dd {pct(ddGa[t])}  ' +
              '  '.join(f'{h}d {pct(x) if x is not None else "  na  "}' for h, x in zip(HS, f)))
    print('\nB1 WEEKS (a ^GSPC close-to-close <= -4.0%); entry = first close of the next ISO week; ^GSPC price returns')
    for wk, drops, e in B1_rows:
        f = [P_g.fwd(e, h) if e is not None else None for h in HS]
        print(f'  {cal[drops[0]]} ({len(drops)} day{"s" if len(drops) > 1 else ""}, worst {pct(min(r1[i] for i in drops))})  '
              f'entry {cal[e] if e is not None else "pending"}  ' +
              '  '.join(f'{h}d {pct(x) if x is not None else "  na  "}' for h, x in zip(HS, f)) +
              (f'  IXIC dd {pct(ddI[e])}' if e is not None and np.isfinite(ddI[e]) else ''))

    rng = np.random.default_rng(SEED)
    rows = []
    print('\nCELLS (^GSPC price unless marked SPY-TR). eps = clusters at that horizon; CIs = cluster bootstrap')
    spec = [
        ('A1 IXIC cross [P]', P_g, A1, start_i),
        ('B1 4%-week [P]', P_g, B1, start_g),
        ('A1+5 IXIC', P_g, A1p5, start_i),
        ('A2 IXIC band', P_g, A2, start_i),
        ('A3 IXIC band, SPX>-10', P_g, A3, start_i),
        ('A1 NDX cross', P_g, A1N, start_n),
        ('A2 NDX band', P_g, A2N, start_n),
        ('B1e first-of-episode', P_g, B1e, start_g),
        ('C joint (B1 & IXIC<=-10)', P_g, C, start_i),
        ('A1 IXIC SPY-TR', P_s, A1, start_s),
        ('B1 4%-week SPY-TR', P_s, B1, start_s),
        ('C joint SPY-TR', P_s, C, start_s),
    ]
    for label, panel, idx, st in spec:
        for h in HS:
            cell(label, panel, idx, st, h, rng, rows)
        print()

    print('DECISION RULE (primary cells)')
    verdicts = []
    for r in rows:
        if not r['label'].endswith('[P]'):
            continue
        if r['exc'] > 0 and r['ci_x'][0] > 0 and r['eps'] >= 10:
            v = 'FOR'
        elif r['exc'] < 0 and r['ci_x'][1] < 0 and r['eps'] >= 10:
            v = 'AGAINST'
        else:
            v = 'NEUTRAL'
        verdicts.append(v)
        pos_mean = 'yes' if r['ci_m'][0] > 0 else 'no'
        print(f'  {r["label"]:<20} h={r["h"]:<3} eps {r["eps"]:<3} excess {pct(r["exc"])} CI [{pct(r["ci_x"][0])},'
              f'{pct(r["ci_x"][1])}] -> {v}; conditional mean > 0 (CI above 0): {pos_mean} ({pct(r["mean"])})')
    nf, na = verdicts.count('FOR'), verdicts.count('AGAINST')
    if nf and not na:
        overall = 'FOR' + (' (WEAK: one cell)' if nf == 1 else '')
    elif na and not nf:
        overall = 'AGAINST' + (' (WEAK: one cell)' if na == 1 else '')
    else:
        overall = 'NO MEASURABLE DIFFERENCE (S1 stands unchanged)'
    print(f'  OVERALL: {overall}')

    print(f'\nDOLLAR VIEW (VOO leg ${VOO_AMT:,.2f}; ^GSPC price, dividends excluded)')
    for r in rows:
        if r['label'].endswith('[P]') or r['label'].startswith('C joint ('):
            print(f'  {r["label"]:<26} h={r["h"]:<3} conditional {VOO_AMT * r["mean"]:+8.0f}  baseline {VOO_AMT * r["base"]:+8.0f}  '
                  f'p10 {VOO_AMT * r["p10"]:+8.0f} (base {VOO_AMT * r["base_p10"]:+8.0f})  path p10 {VOO_AMT * r["mae_p10"]:+8.0f}')


if __name__ == '__main__':
    main()
