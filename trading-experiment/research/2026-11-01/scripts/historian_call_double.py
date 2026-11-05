#!/usr/bin/env python3
"""Historian 2026-11-01: how often a 21-35 DTE delta-0.40 SPY or QQQ call doubles by 11/18, its EV per $ at today's IV, and the
owner's two paths (cash finish vs a goal budget in these calls): P(finish ahead of SPY) and P(reach $2,200).

Run (from /home/user/temp):  python3 -I trading-experiment/research/2026-11-01/scripts/historian_call_double.py
Needs historian_base_rates.py's paths13.csv and historian_chain_snapshot.py's Cboe quotes (cited below). Writes <CACHE>/payoffs_<contract>.csv for sizing.py.

Model (fixed before results):
  * Contracts and quotes: Cboe delayed chain, timestamp 2026-11-01 22:21 (10/30 closing quotes), 11/30 expiry (28 DTE from Mon 11/2):
      SPY261130C00768000  bid 8.30 ask 8.40  IV 0.1376  delta 0.398  (OI 831: fails the 1,000 rule; the delta-0.40 reference)
      SPY261130C00770000  bid 7.37 ask 7.47  IV 0.1351  delta 0.371  (passes every contract rule)
      QQQ261130C00707000  bid 12.29 ask 12.53 IV 0.2259 delta 0.399 (OI 238: fails; the delta-0.40 reference)
      QQQ261130C00710000  bid 10.99 ask 11.23 IV 0.2230 delta 0.373 (passes every contract rule)
  * Entry at the 10/30 close spot (SPY 755.72, QQQ 690.49) and the quoted ask. Monday's 14:43 price will differ.
  * Each historical 13-session path (^GSPC for SPY, ^NDX for QQQ, entries 1990-2026 with ^VIX) is applied to today's spot. Day k is
    11/2 .. 11/18. Black-Scholes, r = ^IRX 3.97%, q = 0 (neither ETF goes ex-dividend before 11/30).
  * Path scaling: "raw" applies each historical path as it happened; "vol" (primary) rescales its log returns, net of the unconditional
    mean daily log return (the drift is kept, not scaled), by today's vol index over the one on its entry day (^VIX 19.42 for SPY; ^VXN 28.50 for QQQ, or ^VIX x 1.21 before ^VXN starts in 2001), so paths from VIX-40
    episodes do not inflate the value of options priced at today's IV.
  * Sensitivity "volrf": as "vol", but each path's drift is replaced by the T-bill rate (no equity premium), to show how much of any
    EV above 1 is the 1990-2026 bull-market drift rather than an edge.
  * Uncertainty: 95% CIs from an episode bootstrap (runs of entry days with gaps over 13 sessions; 63-day blocks for the all-days rows).
  * IV path: primary = the contract's IV x (vol index on day k / on day 0) from the same historical episode (^VIX for SPY; ^VXN for QQQ
    from 2001, ^VIX before), which carries the usual vol crush in rallies. Variant = constant IV (sticky strike).
  * The model is scaled so it reproduces the quoted mid at entry; exits are at the model mid less half the quoted spread
    (variant: a 5% spread, the red-team's stress).
  * "Doubles" = the bid-side value reaches 2.0x the ask paid at any close through 11/18. Closing checks miss intraday touches.
  * Exits: H = hold to the 11/18 close; D = sell at 2.0x at a close, else 11/18; S = the brief's 1-contract rule (+50% resting GTC, filled at
    1.5x if a close is at or above it; -50% backstop at a close), else 11/18.
"""
import csv
import math
import os
from datetime import date

import numpy as np

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/hist1101'
H = 13
DAYS = [date(2026, 11, d) for d in (2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18)]
EXPIRY = date(2026, 11, 30)
T0 = (EXPIRY - date(2026, 10, 30)).days / 365
R = 0.0397
EQUITY_REAL, EQUITY_PAPER, SPY_BH = 1917.92, 1919.92, 1970.94
GOAL = 2200.0
VIX_NOW, VXN_NOW, VXN_VIX = 19.42, 28.50, 1.21
RNG = np.random.default_rng(7)
CONTRACTS = [('SPY261130C00768000', 'SPY', 755.72, 768, 8.30, 8.40, 0.1376),
             ('SPY261130C00770000', 'SPY', 755.72, 770, 7.37, 7.47, 0.1351),
             ('QQQ261130C00707000', 'QQQ', 690.49, 707, 12.29, 12.53, 0.2259),
             ('QQQ261130C00710000', 'QQQ', 690.49, 710, 10.99, 11.23, 0.2230)]


def ncdf(x):
    return 0.5 * (1.0 + np.vectorize(math.erf)(np.asarray(x, float) / math.sqrt(2.0)))


def bs_call(S, K, T, sig):
    S, T, sig = np.asarray(S, float), np.asarray(T, float), np.asarray(sig, float)
    sq = sig * np.sqrt(T)
    d1 = (np.log(S / K) + (R + 0.5 * sig * sig) * T) / sq
    return S * ncdf(d1) - K * np.exp(-R * T) * ncdf(d1 - sq)


def load_paths():
    with open(os.path.join(CACHE, 'paths13.csv')) as f:
        rows = list(csv.DictReader(f))
    P = {'date': np.array([date.fromisoformat(r['date']) for r in rows])}
    for k in ('condA', 'condB', 'condC'):
        P[k] = np.array([r[k] == '1' for r in rows])
    P['vix0'] = np.array([float(r['vix0']) for r in rows])
    P['vxn0'] = np.array([float(r['vxn0']) if r['vxn0'] != 'nan' else np.nan for r in rows])
    for p in 'ngvx':
        P[p] = np.array([[float(r[f'{p}{k}']) if r[f'{p}{k}'] != 'nan' else np.nan for k in range(1, H + 1)] for r in rows])
    P['idx'] = np.arange(len(rows))
    return P


def scaled(P, mode):
    """Path ratios for SPY (g) and QQQ (n), raw or rescaled to today's vol."""
    if mode == 'raw':
        return P['g'], P['n']
    sg = (VIX_NOW / P['vix0'])[:, None]
    vxn0 = np.where(np.isnan(P['vxn0']), P['vix0'] * VXN_VIX, P['vxn0'])
    sn = (VXN_NOW / vxn0)[:, None]
    k = np.arange(1, H + 1)[None, :]
    lg, ln_ = np.log(P['g']), np.log(P['n'])
    mg, mn = np.nanmean(lg[:, 0]), np.nanmean(ln_[:, 0])   # unconditional mean daily log return, kept as is (only the deviation is rescaled)
    if mode == 'volrf':   # sensitivity: no equity premium, the drift is the T-bill rate (each path keeps its own shape around it)
        rf = math.log(1 + R) / 252
        return np.exp(rf * k + sg * (lg - mg * k)), np.exp(rf * k + sn * (ln_ - mn * k))
    return np.exp(mg * k + sg * (lg - mg * k)), np.exp(mn * k + sn * (ln_ - mn * k))


def groups(rows):
    """Bootstrap groups: episodes (gaps over 13 sessions); if fewer than 20, 63-row blocks."""
    g, cur, prev = [], -1, -10 ** 9
    for i in rows:
        if i - prev > H:
            cur += 1
        g.append(cur)
        prev = i
    g = np.array(g)
    if g.max() + 1 < 20:
        g = np.arange(len(rows)) // 63
    return [np.where(g == k)[0] for k in np.unique(g)]


def ci(stat, rows, n_boot=1000):
    gs = groups(rows)
    out = []
    for _ in range(n_boot):
        pick = RNG.integers(0, len(gs), len(gs))
        out.append(stat(np.concatenate([gs[k] for k in pick])))
    lo, hi = np.percentile(out, [2.5, 97.5])
    return f'{lo:.2f}-{hi:.2f}' if abs(hi) > 1.5 or abs(lo) > 1.5 else f'{lo:.0%}-{hi:.0%}'


def values(P, und, S0, K, bid, ask, iv0, iv_model, spread=None, mode='vol'):
    """Bid-side value multiples (per $ of ask paid) on each of the 13 closes, per path; and the underlying path ratios."""
    g, nn = scaled(P, mode)
    ratio = g if und == 'SPY' else nn
    if und == 'SPY':
        volr = P['v'] / P['vix0'][:, None]
    else:
        has = ~np.isnan(P['vxn0'])
        volr = np.where(has[:, None], P['x'] / np.where(has, P['vxn0'], 1)[:, None], P['v'] / P['vix0'][:, None])
    T = np.array([(EXPIRY - d).days / 365 for d in DAYS])[None, :]
    sig = iv0 * (volr if iv_model == 'index' else np.ones_like(volr))
    mid0 = (bid + ask) / 2
    scale = mid0 / float(bs_call(S0, K, T0, iv0))
    hs = (ask - bid) / (2 * mid0) if spread is None else spread / 2
    return bs_call(S0 * ratio, K, T, sig) * scale * (1 - hs) / ask, ratio


def exits(m):
    """Per-path payoff multiples for exits H, D and S."""
    hold = m[:, -1]
    dbl = np.where((m >= 2.0).any(1), 2.0, hold)
    s = hold.copy()
    for i in range(len(m)):
        for k in range(H):
            if m[i, k] >= 1.5:
                s[i] = 1.5
                break
            if m[i, k] <= 0.5:
                s[i] = m[i, k]
                break
    return hold, dbl, s


def thresholds(S0, K, bid, ask, iv0):
    """Underlying move needed for the bid-side value to reach 2x the ask, at constant IV, on 11/2, 11/6, 11/12 and 11/18."""
    mid0 = (bid + ask) / 2
    scale = mid0 / float(bs_call(S0, K, T0, iv0))
    hs = (ask - bid) / (2 * mid0)
    out = []
    for d in (DAYS[0], DAYS[4], DAYS[8], DAYS[-1]):
        T = (EXPIRY - d).days / 365
        lo, hi = 0.0, 0.3
        for _ in range(60):
            x = (lo + hi) / 2
            v = float(bs_call(S0 * (1 + x), K, T, iv0)) * scale * (1 - hs) / ask
            lo, hi = (x, hi) if v < 2.0 else (lo, x)
        out.append(f'{d:%m/%d} {hi:+.2%}')
    return ', '.join(out)


def main():
    P = load_paths()
    post = P['date'] >= date(2010, 1, 1)
    conds = [('ALL 1990-2026', np.ones(len(post), bool)), ('ALL 2010-2026', post), ('A (NDX 7-11% off high)', P['condA']),
             ('A 2010-2026', P['condA'] & post), ('B (A, S&P within 5%)', P['condB']), ('C (A, fast drop)', P['condC'])]
    print(f"paths: {len(post)} entry days with VIX (1990-01 .. 2026-10); ^IRX {R:.2%}; expiry {EXPIRY}, T0 {T0 * 365:.0f} days")
    store = {}
    for sym, und, S0, K, bid, ask, iv0 in CONTRACTS:
        print(f"\n=== {sym}: ask {ask} (Cboe 2026-11-01 22:21 snapshot of the 10/30 close), IV {iv0}; to double at constant IV: "
              f"{thresholds(S0, K, bid, ask, iv0)} ===")
        for mode in ('vol', 'raw'):
            for ivm in ('index', 'const'):
                m, ratio = values(P, und, S0, K, bid, ask, iv0, ivm, mode=mode)
                ok = ~np.isnan(m).any(1)
                hold, dbl, s = exits(m)
                store[(sym, mode, ivm)] = (m, ok)
                for label, c in conds:
                    c = c & ok
                    rows = P['idx'][c]
                    hit2 = (m >= 2.0).any(1)
                    p2 = hit2[c].mean()
                    extra = ''
                    if mode == 'vol' and ivm == 'index':
                        extra = (f" | CI P(2x) {ci(lambda r: hit2[c][r].mean(), rows)}, EV H {ci(lambda r: hold[c][r].mean(), rows)}")
                    print(f"  [{mode},{ivm:5}] {label:24} n {c.sum():5d}  P(2x by 11/18) {p2:5.1%}  P(2x at 11/18) {np.mean(hold[c] >= 2):5.1%}  "
                          f"P(+50%) {np.mean((m[c] >= 1.5).any(1)):5.1%}  EV/$ H {hold[c].mean():.3f} (med {np.median(hold[c]):.2f}, "
                          f"<=0.5x {np.mean(hold[c] <= 0.5):.0%})  D {dbl[c].mean():.3f}  S {s[c].mean():.3f}{extra}")
                if mode == 'vol' and ivm == 'index':
                    with open(os.path.join(CACHE, f'payoffs_{sym}.csv'), 'w', newline='') as f:
                        w = csv.writer(f)
                        w.writerow(['date', 'condA', 'hold', 'double_exit', 'std_exit'])
                        for i in np.where(ok)[0]:
                            w.writerow([P['date'][i], int(P['condA'][i]), f'{hold[i]:.4f}', f'{dbl[i]:.4f}', f'{s[i]:.4f}'])
                    with open(os.path.join(CACHE, f'payoffs_{sym}_A.csv'), 'w', newline='') as f:
                        w = csv.writer(f)
                        w.writerow(['date', 'hold', 'double_exit', 'std_exit'])
                        for i in np.where(ok & P['condA'])[0]:
                            w.writerow([P['date'][i], f'{hold[i]:.4f}', f'{dbl[i]:.4f}', f'{s[i]:.4f}'])
        m5, _ = values(P, und, S0, K, bid, ask, iv0, 'index', spread=0.05)
        h5, d5, s5 = exits(m5)
        c = P['condA'] & ~np.isnan(m5).any(1)
        print(f"  [vol,index, 5% spread] A: EV/$ H {h5[c].mean():.3f} D {d5[c].mean():.3f} S {s5[c].mean():.3f}; "
              f"ALL: H {h5[~np.isnan(m5).any(1)].mean():.3f}")

    for mode in ('vol', 'raw'):
        ms, oks = store[('SPY261130C00768000', mode, 'index')]
        mq, okq = store[('QQQ261130C00707000', mode, 'index')]
        for label, c in conds:
            c = c & oks & okq
            print(f"  [{mode}] either delta-0.40 call doubles by 11/18 [{label}]: {np.mean((ms[c] >= 2).any(1) | (mq[c] >= 2).any(1)):.1%}")

    # ---- the owner's paths
    print("\n=== Owner's paths (real equity $1,917.92; cash beats SPY when SPY falls more than "
          f"{1 - EQUITY_REAL / SPY_BH:.2%}; goal = lock in at the first close with equity >= $2,200, else sell at the 11/18 close) ===")
    for mode in ('vol', 'raw'):
        g, _ = scaled(P, mode)
        for label, c in conds:
            g13 = g[c][:, -1]
            beat = EQUITY_REAL > SPY_BH * g13
            print(f"  [{mode}] CASH [{label}]: P(ahead of SPY) {beat.mean():.1%} (CI {ci(lambda r: beat[r].mean(), P['idx'][c])}); P($2,200) 0%")
        for sym, n_ct in (('SPY261130C00770000', 1), ('SPY261130C00770000', 2), ('QQQ261130C00710000', 1)):
            ask = [x for x in CONTRACTS if x[0] == sym][0][5]
            cost = n_ct * ask * 100
            m, ok = store[(sym, mode, 'index')]
            for label, c in conds:
                c = c & ok
                eq = EQUITY_REAL - cost + cost * m[c]               # equity at each close if sold there
                hit = (eq >= GOAL).any(1)
                first = np.argmax(eq >= GOAL, axis=1)
                final = np.where(hit, eq[np.arange(len(eq)), first], eq[:, -1])   # lock in at the goal, else sell 11/18
                spy_bh = SPY_BH * g[c][:, -1]
                ahead = final > spy_bh
                cis = ''
                if mode == 'vol' and label.startswith(('ALL 1990', 'A (')):
                    cis = f" CI {ci(lambda r: hit[r].mean(), P['idx'][c])}"
                if n_ct == 1:   # the brief's standard 1-contract exit instead of the goal lock: +50% resting GTC, -50% backstop, else 11/18
                    _, _, sx = exits(m[c])
                    fin_s = EQUITY_REAL - cost + cost * sx
                    print(f"  [{mode}] STD-EXIT 1 x {sym} [{label}]: P($2,200) {np.mean(fin_s >= GOAL):.1%}; P(ahead of SPY) "
                          f"{np.mean(fin_s > spy_bh):.1%}; mean final ${fin_s.mean():,.0f}")
                print(f"  [{mode}] GOAL {n_ct} x {sym} (${cost:,.0f}, needs {(GOAL - EQUITY_REAL) / cost:+.1%}) [{label}]: "
                      f"P($2,200) {hit.mean():.1%}{cis}; P(ahead of SPY) {ahead.mean():.1%}; mean final ${final.mean():,.0f}; "
                      f"median ${np.median(final):,.0f}; P(final < $1,600) {np.mean(final < 1600):.1%}")

    # ---- sensitivity: no equity premium (drift = T-bill rate), all days and condition A
    print("\n=== Sensitivity: vol-scaled paths with the drift set to the T-bill rate (no equity premium), index-IV ===")
    for sym, und, S0, K, bid, ask, iv0 in CONTRACTS:
        m, _ = values(P, und, S0, K, bid, ask, iv0, 'index', mode='volrf')
        ok = ~np.isnan(m).any(1)
        hold, dbl, sx = exits(m)
        for label, c in conds[:3]:
            c = c & ok
            print(f"  {sym} [{label}]: P(2x by 11/18) {(m[c] >= 2).any(1).mean():.1%}; EV/$ H {hold[c].mean():.3f} D {dbl[c].mean():.3f} S {sx[c].mean():.3f}")
        if sym in ('SPY261130C00770000', 'QQQ261130C00710000'):
            g, _ = scaled(P, 'volrf')
            for n_ct in ((1, 2) if und == 'SPY' else (1,)):
                cost = n_ct * ask * 100
                for label, c in conds[:3]:
                    c = c & ok
                    eq = EQUITY_REAL - cost + cost * m[c]
                    hit = (eq >= GOAL).any(1)
                    final = np.where(hit, eq[np.arange(len(eq)), np.argmax(eq >= GOAL, axis=1)], eq[:, -1])
                    print(f"    GOAL {n_ct} x {sym} [{label}]: P($2,200) {hit.mean():.1%}; P(ahead of SPY) {np.mean(final > SPY_BH * g[c][:, -1]):.1%}; "
                          f"mean final ${final.mean():,.0f}; P(final < $1,600) {np.mean(final < 1600):.1%}")
    g, _ = scaled(P, 'volrf')
    for label, c in conds[:3]:
        print(f"  CASH [{label}]: P(ahead of SPY) {np.mean(EQUITY_REAL > SPY_BH * g[c][:, -1]):.1%}")


if __name__ == '__main__':
    main()
