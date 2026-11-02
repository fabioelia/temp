#!/usr/bin/env python3
"""options-vol, 2026-11-02 (Run B), question 2: are SPY / QQQ / IWM calls at 0.35-0.40 delta (11/27-12/04) below fair tonight?

Offline: reads ov_fetch.py's data directory (tonight's Cboe chains and index quotes, Yahoo closes) and reuses the committed engine of
research/2026-11-01/scripts/ov_backtest.py (Black-Scholes at IV = m x index vol, sticky ratio, half the quoted spread each way, the
review's rates and dividends), with tonight's entry (Tue 11/3 at the 14:43 check, modelled at a close) and horizon (11 sessions to
the 11/18 close). Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-02/scripts/ov_calls.py <data_dir> <out_dir>

Part A, realized vs implied: each call's IV against the ETF's RV10/RV20/RV60 to 11/2, and against a "fair" IV = the historical
median of (realized vol over the next 11 sessions / index vol at entry) x tonight's index vol (^VIX, ^VXN, Cboe RVX), unconditional
and in two post-hoc slices like tonight: (i) ^VIX9D / ^VIX >= 1.05, (ii) trailing RV20 / index vol within 0.10 of tonight's.
Part B, payoff per $ of each contract (Sunday's definitions): hold10, hedged10 (minus entry delta x the underlying move: the non-beta
part), rule1 (our 1-contract exits: all at +50%, -50% backstop, else the 11/18 close), rule1 with drift removed; Kelly (sizing.py)
on rule1, P(f* = 0) over 300 month-block bootstraps, and whether full Kelly covers one contract (the W44 rule). Goal odds use
equity $1,917.92 and SPY buy-and-hold $1,961.50 (brief, 11/2). Periods: full, 2010-2026, and the two post-hoc slices.
Choices fixed before results were read: the same contract picker as Sunday (filters with DTE counted from 11/3), the slices above.
"""
import csv
import json
import math
import os
import sys
from datetime import date

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/2026-11-01/scripts')
sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import ov_backtest as OB  # noqa: E402  (Sunday's committed engine)
import options_lib as L  # noqa: E402
from sizing import kelly  # noqa: E402

OB.ENTRY = date(2026, 11, 3)
OB.H = 11
H = 11
EQ, SPYBH, GOAL = 1917.92, 1961.50, 2200.0
IDXQ = {'SPY': '_VIX', 'QQQ': '_VXN', 'IWM': '_RVX'}


def jload(d, f):
    return json.load(open(os.path.join(d, f)))


def ybars(d, name):
    b = jload(d, f'yahoo_{name}.json')['bars']
    return {date.fromisoformat(k): v[1] for k, v in b.items() if v[1]}


def rv(c, n):
    lr = np.diff(np.log(c[-(n + 1):]))
    return float(np.sqrt(252 * np.mean(lr ** 2)))


def main():
    data, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    rng = np.random.default_rng(20261102)
    rows = []
    v9 = ybars(data, 'VIX9D')
    vx = ybars(data, 'VIX')
    # cash path: all cash beats SPY buy-and-hold at the 11/18 close only if SPY's 12-session return (11/2 close -> 11/18 close) is
    # below EQ / SPYBH - 1; share of all 12-session windows of SPY closes (Yahoo) where that happened
    sp = ybars(data, 'SPY')
    sd = sorted(sp)
    sc = np.array([sp[d] for d in sd])
    r12 = sc[12:] / sc[:-12] - 1
    thr = EQ / SPYBH - 1
    inv12 = np.array([(d in v9 and d in vx and v9[d] / vx[d] >= 1.05) for d in sd[:-12]])
    for pname, msk in (('1993-2026', np.ones(len(r12), bool)), ('2010-2026', np.array([d >= date(2010, 1, 1) for d in sd[:-12]])),
                       ('inverted front (post-hoc)', inv12)):
        print(f'cash beats SPY (SPY 12-session return < {thr:.2%}): {np.mean(r12[msk] < thr):.1%} of windows, {pname} (n {msk.sum()})')
        rows.append({'underlying': 'SPY', 'contract': 'cash', 'period': pname, 'n': int(msk.sum()),
                     'pbeatspy_1ct': round(float(np.mean(r12[msk] < thr)), 4), 'source': 'Yahoo SPY daily closes'})
    for u in ('SPY', 'QQQ', 'IWM'):
        xv = float(jload(data, f'quote_{IDXQ[u]}.json')['data']['current_price'])
        px = ybars(data, u)
        ds = sorted(px)
        assert ds[-1] == date(2026, 11, 2), ds[-1]
        c = np.array([px[d] for d in ds])
        r10, r20, r60 = rv(c, 10), rv(c, 20), rv(c, 60)
        rvx_now = r20 / (xv / 100)
        m = OB.market(data, u)
        dts, S, X = m['dates'], m['S'], m['X']
        n = len(dts)
        lr = np.diff(np.log(S))
        fwd = np.full(n, np.nan)
        trail = np.full(n, np.nan)
        for i in range(21, n - H):
            fwd[i] = math.sqrt(252 / H * np.sum(lr[i:i + H] ** 2))
        for i in range(21, n):
            trail[i] = math.sqrt(252 / 20 * np.sum(lr[i - 20:i] ** 2))
        inv = np.array([(d in v9 and d in vx and v9[d] / vx[d] >= 1.05) for d in dts])
        simr = np.abs(trail / X - rvx_now) <= 0.10
        ok = ~np.isnan(fwd) & ~np.isnan(X)
        ratio = fwd / X
        fair = {'all': float(np.nanmedian(ratio[ok])), 'inverted': float(np.nanmedian(ratio[ok & inv])),
                'similar RV20/index': float(np.nanmedian(ratio[ok & simr]))}
        nfair = {'all': int(ok.sum()), 'inverted': int((ok & inv).sum()), 'similar RV20/index': int((ok & simr).sum())}
        stamp = jload(data, f'chain_{u}.json')['timestamp']
        print(f'\n=== {u}: close {c[-1]:.2f} (Yahoo 11/2) | {IDXQ[u][1:]} {xv} (Cboe) | RV10 {r10:.1%} RV20 {r20:.1%} RV60 {r60:.1%} | '
              f'RV20/index {rvx_now:.2f} | chain stamp {stamp} UTC')
        print('  fair IV (median next-11-session RV / index vol x tonight\'s index): ' +
              '; '.join(f'{k} {fair[k]:.3f} -> {fair[k] * xv:.1f}% (n {nfair[k]})' for k in fair))
        for c_ in OB.pick_contracts(data, u, xv):
            iv = c_['iv']
            print(f'-- {c_["contract"]} {c_["kind"]} d {c_["delta"]:+.2f} IV {iv:.1%} ({c_["mult"]:.2f}x {IDXQ[u][1:]}; '
                  f'{iv / r20:.2f}x RV20, {iv / r10:.2f}x RV10, {iv / r60:.2f}x RV60; vs fair-all {iv * 100 / (fair["all"] * xv):.2f}x) '
                  f'{c_["bid"]:.2f}/{c_["ask"]:.2f} spr {c_["spread"]:.1%} OI {c_["oi"]} {c_["dte"]} DTE from 11/3 '
                  f'{"passes filters" if c_["passes"] else "FAILS a filter"}')
            hs = c_['spread'] / 2
            sim = OB.simulate(m, c_['kind'], abs(c_['delta']), c_['dte'], c_['mult'], hs)
            idx, B = sim['idx'], sim['B']
            ed = [dts[i] for i in idx]
            hold10 = B[:, 9]
            r1, h50, _, st1 = OB.rule(B, False)
            hedged = hold10 - sim['d0'] * (sim['Sk'][:, 9] - sim['S0']) / sim['cost']
            masks = {'full': np.ones(len(idx), bool), '2010-2026': np.array([d >= date(2010, 1, 1) for d in ed]),
                     'inverted (post-hoc)': inv[idx], 'similar RV20/index (post-hoc)': simr[idx]}
            mu_all = float(np.mean(lr))
            simz = OB.simulate(m, c_['kind'], abs(c_['delta']), c_['dte'], c_['mult'], hs, drift_adj=mu_all)
            z1 = OB.rule(simz['B'], False)[0]
            spy_r = np.array([m['spy'][i + H] / m['spy'][i] if m['spy'][i] == m['spy'][i] else np.nan for i in idx])
            cost1 = c_['ask'] * 100
            for pname, mask in masks.items():
                if mask.sum() < 50:
                    print(f'   {pname}: n {mask.sum()} (too few)')
                    continue
                s10, s1, sh, sz = (OB.stats(a[mask]) for a in (hold10, r1, hedged, z1))
                f1 = kelly(r1[mask])
                p0 = OB.block_boot_p0(r1[mask], rng) if pname in ('full', '2010-2026') else float('nan')
                gain = cost1 * (r1[mask] - 1)
                sr = spy_r[mask]
                okm = ~np.isnan(sr)
                p2200 = float(np.mean(gain >= GOAL - EQ))
                pbeat = float(np.mean((EQ + gain[okm]) > SPYBH * sr[okm]))
                print(f'   {pname:30s} n {s10["n"]:5d} | hold10 {s10["ev"]:.3f} (t {s10["t"]:.1f}) hedged10 {sh["ev"]:.3f} (t {sh["t"]:.1f}) | '
                      f'rule1 {s1["ev"]:.3f} (+50% {h50[mask].mean():.0%}, stop {st1[mask].mean():.0%}) zero-drift {sz["ev"]:.3f} | '
                      f'Kelly f* {f1:.3f} full ${f1 * EQ:,.0f} half ${f1 * EQ / 2:,.0f} quarter ${f1 * EQ / 4:,.0f} vs 1 contract ${cost1:,.0f} '
                      f'({"covers" if f1 * EQ >= cost1 else "does not cover"}); P(f*=0) {p0:.0%} | 1 contract: P($2,200) {p2200:.0%}, '
                      f'P(beat SPY) {pbeat:.0%}')
                rows.append({'underlying': u, 'contract': c_['contract'], 'kind': c_['kind'], 'delta': c_['delta'], 'dte_from_1103': c_['dte'],
                             'iv': iv, 'iv_over_index': round(c_['mult'], 3), 'iv_over_rv20': round(iv / r20, 3),
                             'iv_over_rv10': round(iv / r10, 3), 'iv_over_rv60': round(iv / r60, 3),
                             'iv_over_fair_all': round(iv * 100 / (fair['all'] * xv), 3), 'bid': c_['bid'], 'ask': c_['ask'],
                             'spread': round(c_['spread'], 4), 'oi': c_['oi'], 'passes_filters': c_['passes'], 'period': pname, 'n': s10['n'],
                             'hold10': round(s10['ev'], 4), 't_hold10': round(s10['t'], 2), 'hedged10': round(sh['ev'], 4),
                             't_hedged10': round(sh['t'], 2), 'rule1': round(s1['ev'], 4), 'rule1_zero_drift': round(sz['ev'], 4),
                             'p_plus50': round(float(h50[mask].mean()), 4), 'p_stop': round(float(st1[mask].mean()), 4),
                             'kelly_rule1': f1, 'full_kelly_usd': round(f1 * EQ, 0), 'one_contract_usd': cost1, 'p_kelly0_boot': p0,
                             'p2200_1ct': round(p2200, 4), 'pbeatspy_1ct': round(pbeat, 4),
                             'source': f'Cboe delayed chain stamp {stamp} UTC; Yahoo closes; index-vol history'})
                if pname == '2010-2026':
                    with open(os.path.join(out, f'payoffs_{c_["contract"]}.csv'), 'w', newline='') as f:
                        w = csv.writer(f)
                        w.writerow(['entry', 'hold10', 'rule1', 'hedged10', 'rule1_zero_drift'])
                        for j in np.where(mask)[0]:
                            w.writerow([ed[j], f'{hold10[j]:.4f}', f'{r1[j]:.4f}', f'{hedged[j]:.4f}', f'{z1[j]:.4f}'])
    keys = []
    for r in rows:
        for k in r:
            if k not in keys:
                keys.append(k)
    with open(os.path.join(out, 'ov_calls.csv'), 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)
    print('\nwrote', os.path.join(out, 'ov_calls.csv'), len(rows), 'rows')


if __name__ == '__main__':
    main()
