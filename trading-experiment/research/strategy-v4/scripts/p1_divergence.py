#!/usr/bin/env python3
"""Strategy v4, claim P1: the election divergence gate, as registered in ../election-postmortem.md section 4 (and ../claims.md).

Run (stdlib + numpy; DATA_DIR holds the raw Yahoo v8 chart JSON, untouched):

  python3 -I p1_divergence.py DATA_DIR > out.txt

Data (fetched 2026-11-11 with curl -A 'Mozilla/5.0', one file per symbol and decade, the strategy-v2 core_equity.py
method, because range=max silently returns monthly bars):
  https://query1.finance.yahoo.com/v8/finance/chart/{SYM}?period1={Jan 1 of Y}&period2={min(Jan 1 of Y+10,
  2026-11-11 12:00 UTC)}&interval=1d&events=div%2Csplit&includeAdjustedClose=true   saved as {SYM}_{Y}.json (^VIX as VIX_)
  Y = 1990, 2000, 2010, 2020 for SPY, ^VIX, XLK XLF XLV XLY XLC XLI XLE XLP XLU XLB XLRE and SOXX.
  DATA_DIR = /tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-v4-data/p1_yahoo
  Last SPY bar: the 2026-11-10 close. The script refuses chunks that are not daily bars.

Claim (registered 2026-11-11): on SPY +1% days, a sector with at least 10% weight that lags SPY by 2 or more of its own
daily standard deviations raises P(SPY 5-day minimum <= -3%) by at least 1.5x against other +1% days, within VIX
terciles. In-sample 1998-2012, out-of-sample 2013-2026. Pass: Fisher p < 0.10 out of sample; if it fails, W2 is a sizing
check only.

Specification (every choice the registration leaves open, FIXED HERE BEFORE ANY P1 RESULT WAS COMPUTED, 2026-11-11):
  Series: Yahoo adjclose (split- and dividend-adjusted) for SPY and the ETFs; ^VIX close. Dates = timestamp +
    gmtoffset. Calendar = SPY's sessions; other series are aligned to it (missing = not available).
  SPY +1% day t: SPY adjclose return on t >= +1.00%.
  Sector weights: point-in-time SPY sector weights could not be sourced in this session (SSGA publishes only current
    holdings). DEVIATION, fixed set instead: XLK, XLF, XLV, XLY are treated as the sectors of 10%+ weight on every date.
    Reason: in published S&P 500 sector-weight histories these four are the only SPDR sectors at or near 10% for most
    of 1998-2026 (Tech about 14-35%, Financials about 10-22% with dips near 9% in 2009 and 2020, Health Care about
    9-15%, Consumer Discretionary about 9-14%). Excluded: XLC (exists only from 2018-06, about 8-11%), XLE (above 10%
    only about 2005-2011), XLI, XLP, XLU, XLB, XLRE (mostly below 10%). Figures are from memory, not sourced here.
  Lag: L_s(t) = r_SPY(t) - r_s(t). Own daily SD: sigma_s(t) = sample SD of the sector's daily returns over the 63
    sessions t-63..t-1 (all 63 required). Sector flag: L_s(t) >= 2 * sigma_s(t).
  Classified +1% day: all four sigmas defined. Flagged day = any of the four sectors flags; "other +1% days" = the
    classified +1% days where none flags.
  Outcome: hit(t) = 1 if min over k = 1..5 of SPY adjclose(t+k) / adjclose(t) - 1 <= -3.00%. Days without 5 later
    sessions are excluded.
  Samples by date t: in-sample 1998-01-01..2012-12-31 (effectively from 1999-03, the sector ETFs start 1998-12-22),
    out-of-sample 2013-01-01 on; full = both, for information.
  VIX terciles: cut points = the 1/3 and 2/3 quantiles (numpy default) of ^VIX close on day t over the classified +1%
    days of that sample; stratum 1 <= q1 < stratum 2 <= q2 < stratum 3.
  Effect size: Mantel-Haenszel risk ratio over the three strata, RR_MH = sum(a_k n0_k / N_k) / sum(c_k n1_k / N_k)
    (a = flagged hits, n1 = flagged days, c = other hits, n0 = other days, N = n0 + n1). Per-stratum and pooled
    rates are printed.
  Test ("Fisher within VIX terciles"): the one-sided stratified exact test, i.e. Fisher's exact test extended to
    strata (exact conditional Cochran-Mantel-Haenszel): conditional on every stratum's margins, the number of flagged
    hits is a sum of independent hypergeometrics; p = P(sum A_k >= observed). The pooled one-sided Fisher exact p
    (no strata) is printed for information.
  PASS (registered rule): out-of-sample RR_MH >= 1.5 AND out-of-sample stratified exact p < 0.10. Otherwise FAIL, and
    W2 becomes a sizing check only.
  PROTOCOL-style label for the probe program: CONFIRMED = PASS and in-sample RR_MH > 1; WEAK = out-of-sample
    RR_MH > 1 without that; REJECTED = out-of-sample RR_MH <= 1 or no flagged out-of-sample day.
  Caveat (printed): +1% days cluster in volatile spells and the 5-day windows overlap, so the exact p treats
    dependent days as independent and is anti-conservative.
  Declared sensitivity (printed, not deciding): first-in-cluster sample - a classified +1% day is kept only if no
    kept +1% day lies in the previous 5 sessions (chronological, greedy), same test.
  Declared supplementary (printed, not deciding): SOXX added as a fifth flagging series (from 2001-07; semis reached
    10% of SPY only in the 2020s, so it is outside the registered set), and the per-sector descriptive split.
  Descriptive only: how 2026-11-04 classifies (its 5-day window is incomplete, so it is not in any test).
"""
import glob
import json
import math
import os
import sys
from datetime import date, datetime, timezone

import numpy as np

SECTORS = ['XLK', 'XLF', 'XLV', 'XLY']
SD_WIN = 63
THRESH_UP = 0.01
DD = -0.03
H = 5
IS = (date(1998, 1, 1), date(2012, 12, 31))
OOS = (date(2013, 1, 1), date(2099, 12, 31))


def load(data_dir, sym):
    rows = {}
    for f in sorted(glob.glob(os.path.join(data_dir, f'{sym}_*.json'))):
        res = (json.load(open(f))['chart'].get('result') or [None])[0]
        if res is None:
            continue
        if res['meta'].get('dataGranularity') != '1d':
            raise SystemExit(f'{f}: not daily')
        off = res['meta'].get('gmtoffset', 0)
        ts = res.get('timestamp') or []
        q = res['indicators']['quote'][0]
        adj = (res['indicators'].get('adjclose') or [{}])[0].get('adjclose') or [None] * len(ts)
        for t, c, a in zip(ts, q['close'], adj):
            if c is None:
                continue
            rows[datetime.fromtimestamp(t + off, timezone.utc).date()] = a if a is not None else c
    return rows


def hyper_pmf(N, m, n):
    """pmf of the number of hits among n draws from N with m hits: dict a -> P."""
    lo, hi = max(0, n - (N - m)), min(n, m)
    den = math.comb(N, n)
    return {a: math.comb(m, a) * math.comb(N - m, n - a) / den for a in range(lo, hi + 1)}


def strat_exact_p(tables):
    """tables: list of (a, n1, c, n0). One-sided P(sum A >= sum a) under conditional independence."""
    dist = {0: 1.0}
    obs = 0
    for a, n1, c, n0 in tables:
        N, m = n1 + n0, a + c
        if n1 == 0 or n0 == 0:
            continue  # a stratum without both groups carries no information
        obs += a
        pmf = hyper_pmf(N, m, n1)
        new = {}
        for s, p in dist.items():
            for k, q in pmf.items():
                new[s + k] = new.get(s + k, 0.0) + p * q
        dist = new
    return sum(p for s, p in dist.items() if s >= obs)


def mh_rr(tables):
    num = sum(a * n0 / (n1 + n0) for a, n1, c, n0 in tables if n1 + n0 > 0)
    den = sum(c * n1 / (n1 + n0) for a, n1, c, n0 in tables if n1 + n0 > 0)
    return num / den if den > 0 else float('inf') if num > 0 else float('nan')


def analyse(days, label, flag_key='flag', quiet=False):
    """days: list of dicts with date, vix, hit, flag. Returns (rr, p, n_flag)."""
    v = np.array([d['vix'] for d in days])
    q1, q2 = np.quantile(v, [1 / 3, 2 / 3])
    tables = []
    lines = []
    for k, (lo, hi) in enumerate(((-np.inf, q1), (q1, q2), (q2, np.inf))):
        sel = [d for d in days if lo < d['vix'] <= hi]
        f = [d for d in sel if d[flag_key]]
        o = [d for d in sel if not d[flag_key]]
        a, n1 = sum(d['hit'] for d in f), len(f)
        c, n0 = sum(d['hit'] for d in o), len(o)
        tables.append((a, n1, c, n0))
        rf = a / n1 if n1 else float('nan')
        ro = c / n0 if n0 else float('nan')
        lines.append(f'  VIX tercile {k+1} ({max(lo, 0):5.1f}-{min(hi, 99):5.1f}]: flagged {a}/{n1} = {rf*100:5.1f}%'
                     f'   other {c}/{n0} = {ro*100:5.1f}%   ratio {rf/ro if ro else float("nan"):.2f}')
    rr, p = mh_rr(tables), strat_exact_p(tables)
    A = sum(t[0] for t in tables); N1 = sum(t[1] for t in tables)
    C = sum(t[2] for t in tables); N0 = sum(t[3] for t in tables)
    p_pool = strat_exact_p([(A, N1, C, N0)])
    if not quiet:
        print(f'\n{label}: n = {len(days)} classified +1% days, {N1} flagged')
        print('\n'.join(lines))
        print(f'  pooled: flagged {A}/{N1} = {A/max(N1,1)*100:.1f}%  other {C}/{N0} = {C/max(N0,1)*100:.1f}%  '
              f'pooled one-sided Fisher p = {p_pool:.3f} (info)')
        print(f'  RR_MH = {rr:.2f}   stratified exact one-sided p = {p:.3f}')
    return rr, p, N1


def main():
    data_dir = sys.argv[1]
    spy = load(data_dir, 'SPY')
    ds = sorted(spy)
    S = np.array([spy[d] for d in ds])
    n = len(ds)
    vixm = load(data_dir, 'VIX')
    vix = np.array([vixm.get(d, np.nan) for d in ds])
    rS = np.full(n, np.nan)
    rS[1:] = S[1:] / S[:-1] - 1
    ser = {}
    for s in SECTORS + ['SOXX']:
        m = load(data_dir, s)
        p = np.array([m.get(d, np.nan) for d in ds])
        r = np.full(n, np.nan)
        r[1:] = p[1:] / p[:-1] - 1
        sd = np.full(n, np.nan)
        for i in range(SD_WIN + 1, n):
            w = r[i - SD_WIN:i]
            if not np.isnan(w).any():
                sd[i] = w.std(ddof=1)
        ser[s] = (r, sd)
    print(f'SPY sessions {ds[0]}..{ds[-1]}; VIX missing on {int(np.isnan(vix).sum())} SPY sessions')
    days = []
    for i in range(1, n):
        if not rS[i] >= THRESH_UP:
            continue
        rec = {'date': ds[i], 'spy': rS[i], 'vix': vix[i], 'i': i}
        ok = True
        for s in SECTORS + ['SOXX']:
            r, sd = ser[s]
            if np.isnan(r[i]) or np.isnan(sd[i]):
                rec[s] = None
                if s in SECTORS:
                    ok = False
                continue
            rec[s] = (rS[i] - r[i]) / sd[i]
        if not ok or np.isnan(vix[i]):
            continue
        rec['flag'] = any(rec[s] >= 2 for s in SECTORS)
        rec['flag_soxx'] = rec['flag'] or (rec['SOXX'] is not None and rec['SOXX'] >= 2)
        if i + H < n:
            rec['hit'] = int(min(S[i + 1:i + H + 1] / S[i] - 1) <= DD)
            days.append(rec)
        elif ds[i] == date(2026, 11, 4):
            print('2026-11-04 (descriptive, window incomplete): lag in own SDs',
                  {s: round(rec[s], 2) for s in SECTORS + ['SOXX'] if rec[s] is not None}, 'flag', rec['flag'])
    for d in days[-1:]:
        print('last tested +1% day', d['date'])

    ins = [d for d in days if IS[0] <= d['date'] <= IS[1]]
    oos = [d for d in days if OOS[0] <= d['date'] <= OOS[1]]
    print('\n## Registered test (sectors XLK XLF XLV XLY, lag >= 2 own 63-day SDs, SPY 5-day min <= -3%)')
    rr_i, p_i, nf_i = analyse(ins, 'IN-SAMPLE 1998-2012')
    rr_o, p_o, nf_o = analyse(oos, 'OUT-OF-SAMPLE 2013-2026')
    analyse(days, 'FULL 1998-2026 (info)')
    passed = nf_o > 0 and rr_o >= 1.5 and p_o < 0.10
    if nf_o == 0 or not rr_o > 1:
        lab = 'REJECTED'
    elif passed and rr_i > 1:
        lab = 'CONFIRMED'
    else:
        lab = 'WEAK'
    print(f'\nREGISTERED VERDICT: {"PASS" if passed else "FAIL"} (OOS RR_MH {rr_o:.2f} vs 1.5; OOS p {p_o:.3f} vs 0.10)'
          f'; PROTOCOL-style label: {lab}')
    print('Caveat: +1% days cluster and 5-day windows overlap; the exact p treats them as independent (anti-conservative).')

    print('\n## Declared sensitivity: first-in-cluster (no kept +1% day in the previous 5 sessions); not deciding')
    for lbl, sample in (('IN-SAMPLE', ins), ('OUT-OF-SAMPLE', oos)):
        kept, last = [], -10
        for d in sample:
            if d['i'] - last > H:
                kept.append(d)
                last = d['i']
        analyse(kept, f'{lbl} first-in-cluster')

    print('\n## Declared supplementary: SOXX added as a fifth flagging series; not deciding')
    for lbl, sample in (('IN-SAMPLE', ins), ('OUT-OF-SAMPLE', oos)):
        analyse(sample, f'{lbl} with SOXX', flag_key='flag_soxx')

    print('\n## Descriptive: per-sector flags (a day can flag in several sectors)')
    for lbl, sample in (('IN-SAMPLE', ins), ('OUT-OF-SAMPLE', oos)):
        base = [d for d in sample if not d['flag']]
        br = sum(d['hit'] for d in base) / max(len(base), 1)
        parts = []
        for s in SECTORS + ['SOXX']:
            f = [d for d in sample if d[s] is not None and d[s] >= 2]
            parts.append(f"{s} {sum(d['hit'] for d in f)}/{len(f)}")
        print(f'  {lbl}: ' + ', '.join(parts) + f'; other +1% days {br*100:.1f}%')
    print('\nFlagged out-of-sample days (date, SPY %, lagging sector(s) in own SDs, VIX, hit):')
    for d in oos:
        if d['flag']:
            lag = ' '.join(f'{s} {d[s]:.1f}' for s in SECTORS if d[s] >= 2)
            print(f"  {d['date']} {d['spy']*100:+.2f}% {lag}  VIX {d['vix']:.1f}  hit {d['hit']}")


if __name__ == '__main__':
    main()
