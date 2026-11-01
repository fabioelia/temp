#!/usr/bin/env python3
"""options-vol, 2026-11-01 (Run C). Edge or beta? Index options at tonight's real skew, the payoff odds of a "goal budget" bet, and Kelly.

For each of SPY, QQQ, IWM, expiries 11/27 (25 DTE from Mon 11/2) and 12/04 (32 DTE), calls and puts nearest |delta| 0.35 and 0.40 on
tonight's Cboe chain (ov_fetch.py), the contract's own IV is turned into a multiple m of its index vol (^VIX, ^VXN, ^RVX at the 10/30
close). Every historical close is then an entry: strike at that delta with IV = m x index vol, Black-Scholes (options_lib), re-priced at
each later close with IV = m x that day's index vol (a sticky-ratio assumption), paying half of tonight's quoted spread each way.

Payoff per $ (value at exit / cost):
  hold10      sold at the 10th close (the strategy review's D1 horizon)
  hold12      sold at the 12th close (Mon 11/2 entry -> Wed 11/18 close, the challenge's last day)
  rule1       our exits for 1 contract: all at +50% (a resting limit: proceeds 1.5 when a close is at or above it), -50% backstop at a close
              (sold at that close), else the 12th close
  rule2       our exits for 2+ contracts: half at +50%, the rest at +100% (limits), -50% backstop, else the 12th close
  hedged10    hold10 minus the entry delta times the underlying's move, per $ of premium: the part of the payoff that is NOT beta
              (vol and time decay; second-order drift effects remain)
  rule1_zd    rule1 with the underlying's drift removed (log-price detrended by the sample's mean daily log return)

Index-vol data: Yahoo ^VIX (1990+) and ^VXN (2001+) closes; RVX from the strategy review's Cboe file (2009-09+, to 10/28). Rates: the
review's ^IRX cache. Dividends: SPY and IWM trailing yield (the review's cache); QQQ a constant 0.6%.
Periods: full (each pair's data start), 2010-2026, last 5y, and a POST-HOC regime slice like tonight's (17 <= ^VIX <= 22 and
^VIX9D < ^VIX3M at entry). t-stats are Newey-West with lag 24 on the daily series of overlapping trades.

Kelly: research/strategy-review/scripts/sizing.py's kelly() on each payoff array, at equity $1,917.92; one contract is allowed only when
full Kelly covers its cost (brief, W44 red-team). Robustness: P(f* = 0) over 300 month-block bootstrap resamples (21-session blocks).

Goal odds: n contracts at tonight's ask; rule1 if n = 1, rule2 if n >= 2. P(goal) = P(gain >= $282.08) (equity $1,917.92 -> $2,200).
P(beat SPY) = P(1,917.92 + gain > 1,970.94 x SPY's return over the same 12 sessions), the brief's figures, ignoring the 10/30 -> 11/2 move.

A check row reproduces the review's post-hoc D1 figure (SPY 0.35-delta call, IV 0.712 x VIX, 30 DTE, 3% spread, 10 sessions, 2010-26:
1.13 in options-results.csv, there on ^GSPC).

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-01/scripts/ov_backtest.py <data_dir> <out_dir>
Writes <out_dir>/ov_backtest.csv (one row per contract x period x payoff) and <out_dir>/payoffs_<contract>.csv (per-trade payoffs).
"""
import csv
import json
import math
import os
import sys
from datetime import date

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import options_lib as L  # noqa: E402
from sizing import kelly  # noqa: E402

ENTRY = date(2026, 11, 2)
EQ, SPYBH, GOAL = 1917.92, 1970.94, 2200.0
H = 12
IDXQ = {'SPY': '_VIX', 'QQQ': '_VXN', 'IWM': '_RVX'}
CHECK_START = {'SPY': date(1993, 2, 1), 'QQQ': date(2001, 2, 1), 'IWM': date(2009, 9, 16)}


def jload(d, f):
    return json.load(open(os.path.join(d, f)))


def ybars(d, name):
    b = jload(d, f'yahoo_{name}.json')['bars']
    return {date.fromisoformat(k): v[1] for k, v in b.items() if v[1]}


def market(data, u):
    px = ybars(data, u)
    if u == 'SPY':
        xv = ybars(data, 'VIX')
    elif u == 'QQQ':
        xv = ybars(data, 'VXN')
    else:
        xv = L.load_rvx_cboe()
    dates = sorted(d for d in px if d in xv or (u == 'IWM' and d > max(xv) and d <= date(2026, 10, 30)))
    dates = [d for d in dates if d >= min(xv)]
    S = np.array([px[d] for d in dates])
    X = L.ffill_on(dates, xv, back=False) / 100.0
    r = L.ffill_on(dates, {d: v[0] for d, v in L.load('IRX').items()}) / 100.0
    q = L.div_yield(dates, S, L.load_divs(u)) if u in ('SPY', 'IWM') else np.full(len(dates), 0.006)
    vix = L.ffill_on(dates, ybars(data, 'VIX'))
    v9 = L.ffill_on(dates, {d: v[0] for d, v in L.load('VIX9D').items()}, back=False)
    v3 = L.ffill_on(dates, {d: v[0] for d, v in L.load('VIX3M').items()}, back=False)
    spy = ybars(data, 'SPY')
    spyS = np.array([spy.get(d, np.nan) for d in dates])
    return {'dates': dates, 'S': S, 'X': X, 'r': r, 'q': q, 'vix': vix, 'v9': v9, 'v3': v3, 'spy': spyS}


def bs_delta(S, K, T, sig, r, q, kind):
    d1 = (np.log(S / K) + (r - q + 0.5 * sig * sig) * T) / (sig * np.sqrt(T))
    return np.exp(-q * T) * L.ncdf(d1) if kind == 'C' else -np.exp(-q * T) * L.ncdf(-d1)


def simulate(m, kind, delta, dte, mult, hs, drift_adj=0.0):
    """Per-entry value paths B[:, k-1] = bid at close k / cost, plus entry delta, strike, cost and S paths."""
    dates, S, X, r, q = m['dates'], m['S'], m['X'], m['r'], m['q']
    n = len(dates)
    idx = np.array([i for i in range(n - H) if X[i] == X[i] and all(X[i + k] == X[i + k] for k in range(1, H + 1))])
    T0 = np.full(len(idx), dte / 365.0)
    sig0 = mult * X[idx]
    K = np.ravel(L.strike_for_delta(S[idx], T0, sig0, r[idx], q[idx], delta, kind))
    mid0 = L.bs(S[idx], K, T0, sig0, r[idx], q[idx], kind)
    cost = mid0 * (1 + hs)
    d0 = bs_delta(S[idx], K, T0, sig0, r[idx], q[idx], kind)
    B = np.zeros((len(idx), H))
    Sk = np.zeros((len(idx), H))
    for k in range(1, H + 1):
        x = idx + k
        s_adj = S[x] * np.exp(-drift_adj * k)
        Tk = np.array([(dte - (dates[j] - dates[i]).days) / 365.0 for i, j in zip(idx, x)])
        B[:, k - 1] = L.bs(s_adj, K, np.maximum(Tk, 0), mult * X[x], r[x], q[x], kind) * (1 - hs) / cost
        Sk[:, k - 1] = s_adj
    return {'idx': idx, 'B': B, 'S0': S[idx], 'Sk': Sk, 'd0': d0, 'mid0': mid0, 'cost': cost}


def rule(B, split):
    out = np.zeros(len(B))
    hit50 = np.zeros(len(B), bool)
    hit100 = np.zeros(len(B), bool)
    stopped = np.zeros(len(B), bool)
    for i, row in enumerate(B):
        frac, proc, half = 1.0, 0.0, False
        for k, b in enumerate(row):
            if b <= 0.5:
                proc += frac * b; frac = 0; stopped[i] = True; break
            if not split:
                if b >= 1.5:
                    proc += 1.5; frac = 0; hit50[i] = True; break
            else:
                if not half and b >= 1.5:
                    proc += 0.75; frac = 0.5; half = True; hit50[i] = True
                if half and b >= 2.0:
                    proc += 1.0; frac = 0; hit100[i] = True; break
            if k == len(row) - 1:
                proc += frac * b; frac = 0
        out[i] = proc
    return out, hit50, hit100, stopped


def kelly_fast(r, grid=np.arange(0.01, 1.0, 0.01)):
    r = np.asarray(r, float)
    if r.mean() <= 1.0:
        return 0.0
    g = np.log1p(np.outer(grid, r - 1.0)).mean(axis=1)
    j = int(np.argmax(g))
    return float(grid[j]) if g[j] > 0 else 0.0


def block_boot_p0(r, rng, nb=300, blk=21):
    r = np.asarray(r, float)
    n = len(r)
    nblk = n // blk
    zero = 0
    for _ in range(nb):
        starts = rng.integers(0, n - blk, nblk)
        s = np.concatenate([r[a:a + blk] for a in starts])
        zero += kelly_fast(s) == 0.0
    return zero / nb


def pick_contracts(data, u, xv):
    ch = jload(data, f'chain_{u}.json')
    stamp = ch['timestamp']
    out = []
    for exp in (date(2026, 11, 27), date(2026, 12, 4)):
        for kind in ('C', 'P'):
            rows = []
            for o in ch['data']['options']:
                s = o['option']
                e = date(2000 + int(s[-15:-13]), int(s[-13:-11]), int(s[-11:-9]))
                if e != exp or s[-9] != kind or not o.get('iv') or not o.get('bid') or not o.get('ask'):
                    continue
                rows.append(o)
            for tgt in (0.35, 0.40):
                o = min(rows, key=lambda o: abs(abs(o['delta']) - tgt))
                midp = (o['bid'] + o['ask']) / 2
                out.append({'underlying': u, 'contract': o['option'], 'kind': kind, 'expiry': exp, 'dte': (exp - ENTRY).days,
                            'target_delta': tgt, 'delta': o['delta'], 'iv': o['iv'], 'mult': o['iv'] * 100 / xv, 'bid': o['bid'],
                            'ask': o['ask'], 'spread': (o['ask'] - o['bid']) / midp, 'oi': int(o.get('open_interest') or 0),
                            'stamp': stamp, 'strike': int(o['option'][-8:]) / 1000})
    return out


def stats(x, lag=24):
    x = np.asarray(x, float)
    return {'n': len(x), 'ev': float(x.mean()), 'median': float(np.median(x)), 'hit': float((x > 1).mean()),
            't': L.nw_t(x, 1.0, lag) if len(x) > 30 else float('nan')}


def main():
    data, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    rng = np.random.default_rng(20261101)
    rows = []
    mk = {}
    for u in ('SPY', 'QQQ', 'IWM'):
        mk[u] = market(data, u)

    # ---- check: reproduce the review's D1 post-hoc figure
    m = mk['SPY']
    sim = simulate(m, 'C', 0.35, 30, 0.712, 0.015)
    per = np.array([m['dates'][i] >= date(2010, 1, 1) for i in sim['idx']])
    print(f'CHECK SPY 0.35-delta call, IV 0.712 x VIX, 30 DTE, 3% spread, hold 10, 2010-26: EV {sim["B"][per, 9].mean():.3f} '
          f'(review: 1.133 on ^GSPC)')

    # ---- realized vs implied: next-12-session RV / index vol at entry
    print('\nForward realized vol over the next 12 sessions / index vol at entry (mean, median), and 12-session SPY return < -2.69% share')
    for u in ('SPY', 'QQQ', 'IWM'):
        m = mk[u]
        lr = np.diff(np.log(m['S']))
        n = len(m['S'])
        rv12 = np.full(n, np.nan)
        for i in range(n - H):
            rv12[i] = math.sqrt(252 / H * np.sum(lr[i:i + H] ** 2))
        ratio = rv12 / m['X']
        for pname, lo in (('full', date(1900, 1, 1)), ('2010-2026', date(2010, 1, 1))):
            ok = np.array([d >= lo for d in m['dates']]) & ~np.isnan(ratio)
            reg = ok & (m['vix'] >= 17) & (m['vix'] <= 22) & (m['v9'] < m['v3'])
            print(f'  {u} {pname:9s} RV12/index: mean {np.nanmean(ratio[ok]):.3f} median {np.nanmedian(ratio[ok]):.3f} (n {ok.sum()}) | '
                  f'regime mean {np.nanmean(ratio[reg]):.3f} median {np.nanmedian(ratio[reg]):.3f} (n {reg.sum()})')
            rows.append({'section': 'rv_vs_index', 'underlying': u, 'period': pname, 'n': int(ok.sum()),
                         'mean': round(float(np.nanmean(ratio[ok])), 4), 'median': round(float(np.nanmedian(ratio[ok])), 4),
                         'regime_mean': round(float(np.nanmean(ratio[reg])), 4), 'regime_n': int(reg.sum())})
    sm = mk['SPY']
    spy12 = sm['S'][H:] / sm['S'][:-H]
    for pname, lo in (('full', date(1993, 1, 1)), ('2010-2026', date(2010, 1, 1))):
        ok = np.array([d >= lo for d in sm['dates'][:-H]])
        print(f'  SPY 12-session return below -2.69% (cash beats SPY): {np.mean(spy12[ok] < EQ / SPYBH):.1%} ({pname})')

    # ---- contracts
    print('\nContracts at tonight\'s skew (Cboe chain), payoffs per $ (net of half the quoted spread each way)')
    for u in ('SPY', 'QQQ', 'IWM'):
        xv = float(jload(data, f'quote_{IDXQ[u]}.json')['data']['current_price'])
        m = mk[u]
        dts = m['dates']
        for c in pick_contracts(data, u, xv):
            hs = c['spread'] / 2
            sim = simulate(m, c['kind'], abs(c['delta']), c['dte'], c['mult'], hs)
            idx = sim['idx']
            B = sim['B']
            ed = [dts[i] for i in idx]
            hold10, hold12 = B[:, 9], B[:, 11]
            r1, h50, _, st1 = rule(B, False)
            r2, h50b, h100, st2 = rule(B, True)
            hedged = hold10 - sim['d0'] * (sim['Sk'][:, 9] - sim['S0']) / sim['cost']
            masks = {'full': np.ones(len(idx), bool), '2010-2026': np.array([d >= date(2010, 1, 1) for d in ed]),
                     'last5y': np.array([d >= date(2021, 10, 29) for d in ed]),
                     'regime (post-hoc)': (m['vix'][idx] >= 17) & (m['vix'][idx] <= 22) & (m['v9'][idx] < m['v3'][idx])}
            # zero-drift versions, per period (drift of that period)
            lr = np.diff(np.log(m['S']))
            zd = {}
            for pname, mask in masks.items():
                if pname.startswith('regime'):
                    mu = float(np.mean(lr))
                else:
                    lo = min(d for d, k in zip(ed, mask) if k)
                    mu = float(np.mean(lr[[i for i, d in enumerate(dts[1:]) if d >= lo]]))
                simz = simulate(m, c['kind'], abs(c['delta']), c['dte'], c['mult'], hs, drift_adj=mu)
                zd[pname] = (rule(simz['B'], False)[0], rule(simz['B'], True)[0], mu)
            cost1 = c['ask'] * 100
            tag = (f"{c['contract']} ({c['kind']} d {c['delta']:+.2f}, IV {c['iv']:.1%} = {c['mult']:.2f}x {IDXQ[u][1:]}, "
                   f"{c['bid']:.2f}/{c['ask']:.2f}, spr {c['spread']:.1%}, OI {c['oi']}, {c['dte']} DTE)")
            print(f'-- {tag}')
            spy_r = np.array([m['spy'][i + H] / m['spy'][i] if m['spy'][i] == m['spy'][i] else np.nan for i in idx])
            for pname, mask in masks.items():
                if mask.sum() < 50:
                    continue
                s10, s12, s1, s2, sh = (stats(a[mask]) for a in (hold10, hold12, r1, r2, hedged))
                z1, z2, mu = zd[pname]
                z1s = stats(z1[mask]); z2s = stats(z2[mask])
                f1 = kelly(r1[mask]); f2 = kelly(r2[mask]); fz = kelly(z1[mask])
                p0 = block_boot_p0(r1[mask], rng) if pname in ('full', '2010-2026') else float('nan')
                # goal odds for budgets: 1 contract, $1,000, all-in
                goal = {}
                for blab, budget in (('1 contract', cost1), ('$1,000', 1000.0), ('all-in', EQ)):
                    nct = max(1, int(budget // cost1)) if budget >= cost1 else 0
                    if nct == 0:
                        goal[blab] = (0, float('nan'), float('nan'), float('nan'))
                        continue
                    pay = r1 if nct == 1 else r2
                    gain = nct * cost1 * (pay[mask] - 1)
                    sr = spy_r[mask]
                    okm = ~np.isnan(sr)
                    goal[blab] = (nct, float(np.mean(gain >= GOAL - EQ)), float(np.mean((EQ + gain[okm]) > SPYBH * sr[okm])),
                                  float(np.mean(gain)))
                print(f'   {pname:17s} n {s10["n"]:5d} | hold10 {s10["ev"]:.3f} (t {s10["t"]:.1f}) hedged10 {sh["ev"]:.3f} (t {sh["t"]:.1f}) | '
                      f'hold12 {s12["ev"]:.3f} | rule1 {s1["ev"]:.3f} (t {s1["t"]:.1f}; +50% {h50[mask].mean():.0%}, stop {st1[mask].mean():.0%}) '
                      f'zero-drift {z1s["ev"]:.3f} | rule2 {s2["ev"]:.3f} (+100% {h100[mask].mean():.0%}) zero-drift {z2s["ev"]:.3f}')
                print(f'   {"":17s} Kelly rule1 f* {f1:.3f} -> full ${f1 * EQ:,.0f} half ${f1 * EQ / 2:,.0f} quarter ${f1 * EQ / 4:,.0f} vs 1 contract '
                      f'${cost1:,.0f} ({"covers" if f1 * EQ >= cost1 else "does not cover"}); P(f*=0) boot {p0:.0%}; rule2 f* {f2:.3f}; '
                      f'zero-drift rule1 f* {fz:.3f}')
                print(f'   {"":17s} goal odds: ' + '; '.join(f'{b} (n {g[0]}): P($2,200) {g[1]:.0%}, P(beat SPY) {g[2]:.0%}, mean gain ${g[3]:,.0f}'
                                                       for b, g in goal.items() if g[0]))
                rows.append({'section': 'contract', 'underlying': u, 'contract': c['contract'], 'kind': c['kind'], 'delta': c['delta'],
                             'dte': c['dte'], 'iv': c['iv'], 'iv_over_index': round(c['mult'], 3), 'bid': c['bid'], 'ask': c['ask'],
                             'spread': round(c['spread'], 4), 'oi': c['oi'], 'period': pname, 'n': s10['n'],
                             'hold10': round(s10['ev'], 4), 't_hold10': round(s10['t'], 2), 'hedged10': round(sh['ev'], 4),
                             't_hedged10': round(sh['t'], 2), 'hold12': round(s12['ev'], 4), 'rule1': round(s1['ev'], 4),
                             't_rule1': round(s1['t'], 2), 'rule1_median': round(s1['median'], 4), 'p_plus50': round(float(h50[mask].mean()), 4),
                             'p_stop': round(float(st1[mask].mean()), 4), 'rule1_zero_drift': round(z1s['ev'], 4), 'rule2': round(s2['ev'], 4),
                             'p_plus100': round(float(h100[mask].mean()), 4), 'rule2_zero_drift': round(z2s['ev'], 4),
                             'drift_removed_daily': round(mu, 6), 'kelly_rule1': f1, 'kelly_rule2': f2, 'kelly_rule1_zero_drift': fz,
                             'full_kelly_usd': round(f1 * EQ, 0), 'one_contract_usd': cost1, 'p_kelly0_boot': p0,
                             **{f'goal_{b}_{k}': (round(v, 4) if isinstance(v, float) else v) for b, g in goal.items()
                                for k, v in zip(('n', 'p2200', 'pbeatspy', 'meangain'), g)},
                             'source': f'Cboe delayed chain stamp {c["stamp"]}; Yahoo/Cboe index vol history'})
                if pname == '2010-2026':
                    with open(os.path.join(out, f'payoffs_{c["contract"]}.csv'), 'w', newline='') as f:
                        w = csv.writer(f)
                        w.writerow(['entry', 'hold10', 'hold12', 'rule1', 'rule2', 'hedged10', 'rule1_zero_drift'])
                        for j in np.where(mask)[0]:
                            w.writerow([ed[j], f'{hold10[j]:.4f}', f'{hold12[j]:.4f}', f'{r1[j]:.4f}', f'{r2[j]:.4f}', f'{hedged[j]:.4f}',
                                        f'{z1[j]:.4f}'])
    keys = []
    for r in rows:
        for k in r:
            if k not in keys:
                keys.append(k)
    with open(os.path.join(out, 'ov_backtest.csv'), 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)
    print('\nwrote', os.path.join(out, 'ov_backtest.csv'), len(rows), 'rows')


if __name__ == '__main__':
    main()
