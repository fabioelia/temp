#!/usr/bin/env python3
"""Historian 2026-11-01: 13-session base rates for QQQ and SPY after a Nasdaq-100 drop of about 9% from its high.

Run (from /home/user/temp):  python3 -I trading-experiment/research/2026-11-01/scripts/base_rates.py
Needs hist_fetch.py's cache. Writes <CACHE>/paths13.csv (every entry day's 13-session NDX/GSPC/VIX/VXN paths) for call_double.py.

Specification (written before the results were looked at):
  * Series: ^NDX for QQQ (QQQ itself only from 1999-03) and ^GSPC for SPY (SPY only from 1993-01); price closes (unadjusted), because the
    challenge benchmark is SPY's price and neither ETF goes ex-dividend before 11/18. QQQ/SPY are checked against their indexes below.
  * Today (10/30 close): ^NDX 9.1% below its 252-session high close (10/06), ^GSPC 3.0% below. Window: 13 sessions (10/30 close to 11/18 close).
  * Conditions (3 variants, all reported):
      A  NDX 7-11% below its 252-session high close;
      B  A, and GSPC within 5% of its own 252-session high (a tech-led drop, as now);
      C  A, and the NDX high set within the last 30 sessions (a fast drop; the high was 18 sessions ago).
  * The "cash beats SPY" level: SPY 13-session return <= -2.59% (paper $1,919.92 vs SPY B&H $1,970.94) or -2.69% (real $1,917.92).
  * Overlap: entries on consecutive days share paths. Episodes are runs of qualifying days with gaps of 13 sessions or less. 95% CIs come
    from an episode (cluster) bootstrap, 2,000 resamples, seed 7.
  * Vol-scaled variant: each 13-session GSPC return divided by that day's ^VIX x sqrt(13/252), then the cash threshold is expressed at
    today's ^VIX 19.42 (and ^VXN 28.50 for NDX). It answers "how often does a move this large, in today's vol units, happen".
"""
import csv
import math
import os
from datetime import date

import numpy as np

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/hist1101'
H = 13
CASH_PAPER = 1919.92 / 1970.94 - 1      # -2.59%
CASH_REAL = 1917.92 / 1970.94 - 1       # -2.69%
VIX_NOW, VXN_NOW = 19.42, 28.50
RNG = np.random.default_rng(7)


def load(name):
    with open(os.path.join(CACHE, f'{name}.csv')) as f:
        return {date.fromisoformat(r['date']): float(r['close']) for r in csv.DictReader(f) if float(r['close']) > 0}


def align(dates, series):
    out, last = np.full(len(dates), np.nan), np.nan
    for i, d in enumerate(dates):
        last = series.get(d, last)
        out[i] = last
    return out


def episodes(idx):
    """Episode id per qualifying index: a new episode when the gap to the previous qualifying day exceeds H sessions."""
    ep, cur, prev = [], -1, -10 ** 9
    for i in idx:
        if i - prev > H:
            cur += 1
        ep.append(cur)
        prev = i
    return np.array(ep)


def cluster_ci(values_fn, ep, n_boot=2000):
    """95% CI of a statistic of qualifying rows, resampling whole episodes."""
    ids = np.unique(ep)
    groups = [np.where(ep == k)[0] for k in ids]
    stats = []
    for _ in range(n_boot):
        pick = RNG.integers(0, len(groups), len(groups))
        rows = np.concatenate([groups[k] for k in pick])
        stats.append(values_fn(rows))
    return np.percentile(stats, [2.5, 97.5])


def main():
    ndx, gspc, vix, vxn = load('NDX'), load('GSPC'), load('VIX'), load('VXN')
    qqq, spy = load('QQQ'), load('SPY')
    dates = sorted(set(ndx) & set(gspc))
    N = np.array([ndx[d] for d in dates])
    G = np.array([gspc[d] for d in dates])
    V = align(dates, vix)
    X = align(dates, vxn)
    n = len(dates)
    hiN = np.array([N[max(0, i - 251):i + 1].max() for i in range(n)])
    hiG = np.array([G[max(0, i - 251):i + 1].max() for i in range(n)])
    since_hi = np.array([i - (max(0, i - 251) + int(np.argmax(N[max(0, i - 251):i + 1]))) for i in range(n)])
    ddN, ddG = N / hiN - 1, G / hiG - 1
    print(f"Today {dates[-1]}: NDX {N[-1]:.2f}, {ddN[-1]:+.2%} from its 252-session high ({since_hi[-1]} sessions ago); "
          f"GSPC {G[-1]:.2f}, {ddG[-1]:+.2%}; VIX {V[-1]:.2f}, VXN {X[-1]:.2f}")

    # ETF vs index check over overlapping 13-session windows
    for etf, idxs, name in ((qqq, ndx, 'QQQ vs NDX'), (spy, gspc, 'SPY vs GSPC')):
        ds = [d for d in dates if d in etf and d in idxs]
        e = np.array([etf[d] for d in ds]); x = np.array([idxs[d] for d in ds])
        re, rx = e[H:] / e[:-H] - 1, x[H:] / x[:-H] - 1
        print(f"  {name}: 13-session price returns, corr {np.corrcoef(re, rx)[0, 1]:.4f}, mean gap {np.mean(re - rx):+.4%} (n {len(re)})")

    valid = np.arange(252, n - H)  # need a full year for the high, and the full forward window
    rN = N[valid + H] / N[valid] - 1
    rG = G[valid + H] / G[valid] - 1
    vd = [dates[i] for i in valid]
    condA = (ddN[valid] <= -0.07) & (ddN[valid] >= -0.11)
    condB = condA & (ddG[valid] >= -0.05)
    condC = condA & (since_hi[valid] <= 30)
    post = np.array([d >= date(2010, 1, 1) for d in vd])
    has_vix = ~np.isnan(V[valid])

    def block(label, m):
        idx = valid[m]
        ep = episodes(idx)
        a, b = rN[m], rG[m]
        p_paper = np.mean(b <= CASH_PAPER)
        lo, hi = cluster_ci(lambda r: np.mean(b[r] <= CASH_PAPER), ep)
        lo2, hi2 = cluster_ci(lambda r: np.mean(b[r]), ep)
        pct = lambda x: ' '.join(f'{v:+.1%}' for v in np.percentile(x, [5, 10, 25, 50, 75, 90, 95]))
        print(f"\n{label}: {len(idx)} days, {ep.max() + 1} episodes, {vd[np.where(m)[0][0]] if len(idx) else '-'} .. {vd[np.where(m)[0][-1]] if len(idx) else '-'}")
        print(f"  QQQ(NDX) 13d: mean {a.mean():+.2%} median {np.median(a):+.2%} sd {a.std():.2%} up {np.mean(a > 0):.0%} | p5..p95 {pct(a)}")
        print(f"  SPY(GSPC) 13d: mean {b.mean():+.2%} (CI {lo2:+.2%} to {hi2:+.2%}) median {np.median(b):+.2%} sd {b.std():.2%} up {np.mean(b > 0):.0%} | p5..p95 {pct(b)}")
        print(f"  P(SPY <= {CASH_PAPER:.2%}) = {p_paper:.1%} (episode CI {lo:.1%}-{hi:.1%}); P(SPY <= {CASH_REAL:.2%}) = {np.mean(b <= CASH_REAL):.1%}")
        print(f"  P(QQQ >= +5%) {np.mean(a >= 0.05):.1%}, >= +8% {np.mean(a >= 0.08):.1%}; P(SPY >= +3%) {np.mean(b >= 0.03):.1%}, >= +5% {np.mean(b >= 0.05):.1%}")
        return p_paper

    print('\n=== Unconditional and conditional 13-session base rates (1986-10 .. 2026-10 entries) ===')
    allm = np.ones(len(valid), bool)
    block('ALL days', allm)
    block('ALL days 2010-2026', post)
    block('A: NDX 7-11% below high', condA)
    block('A, 1986-2009', condA & ~post)
    block('A, 2010-2026', condA & post)
    block('B: A and GSPC within 5% of its high', condB)
    block('C: A and the NDX high within 30 sessions', condC)

    # vol-scaled: z = r13 / (VIX * sqrt(13/252)); threshold at today's VIX
    sc = math.sqrt(H / 252)
    zG = rG / (V[valid] / 100 * sc)
    zN = rN / (np.where(np.isnan(X[valid]), V[valid] * 1.3, X[valid]) / 100 * sc)  # VXN from 2001; VIX x 1.3 before (median VXN/VIX ratio check below)
    ok = has_vix & ~np.isnan(zG)
    thr = CASH_PAPER / (VIX_NOW / 100 * sc)
    print(f"\n=== Vol-scaled (VIX entries 1990-2026): cash threshold = {thr:.2f} VIX-sigmas at VIX {VIX_NOW} ===")
    both = ~np.isnan(X[valid]) & has_vix
    print(f"  median VXN/VIX since 2001: {np.median(X[valid][both] / V[valid][both]):.2f} (today {VXN_NOW / VIX_NOW:.2f})")
    for label, m in (('ALL', ok), ('2010-2026', ok & post), ('A', ok & condA), ('A 2010-2026', ok & condA & post), ('B', ok & condB), ('C', ok & condC)):
        idx = valid[m]
        ep = episodes(idx)
        p = np.mean(zG[m] <= thr)
        lo, hi = cluster_ci(lambda r: np.mean(zG[m][r] <= thr), ep)
        print(f"  {label:12} n {m.sum():5d} ({ep.max() + 1} ep): P(SPY <= -2.59% at today's vol) {p:.1%} (CI {lo:.1%}-{hi:.1%}); "
              f"z mean {np.mean(zG[m]):+.2f} sd {np.std(zG[m]):.2f}; realized/VIX ratio {np.std(rG[m]) / np.mean(V[valid][m] / 100 * sc):.2f}")

    with open(os.path.join(CACHE, 'paths13.csv'), 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['date', 'condA', 'condB', 'condC', 'vix0', 'vxn0'] + [f'n{k}' for k in range(1, H + 1)] + [f'g{k}' for k in range(1, H + 1)]
                   + [f'v{k}' for k in range(1, H + 1)] + [f'x{k}' for k in range(1, H + 1)])
        for j, i in enumerate(valid):
            if np.isnan(V[i]):
                continue
            w.writerow([dates[i].isoformat(), int(condA[j]), int(condB[j]), int(condC[j]), V[i], X[i]]
                       + [f'{N[i + k] / N[i]:.6f}' for k in range(1, H + 1)] + [f'{G[i + k] / G[i]:.6f}' for k in range(1, H + 1)]
                       + [f'{V[i + k]:.2f}' for k in range(1, H + 1)] + [f'{X[i + k]:.2f}' for k in range(1, H + 1)])
    print(f"\nwrote {CACHE}/paths13.csv")


if __name__ == '__main__':
    main()
