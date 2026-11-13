#!/usr/bin/env python3
"""options-vol, Sun 2026-11-08 (Run C). Two questions from the brief (input, not a recommendation).

Q1  The C1 Kelly ceiling on current equity $1,384.84 at 15-35 DTE across IV/RV20 multiples, against the ~20% SGOV reserve
    (0.20 x 1,384.84 = $276.97) that must pay for any option (never VOO).
    Engine: research/2026-11-01/scripts/catalyst_watch.Payoffs (= strategy-review sizing.c1_payoffs at any DTE; it asserts the match)
    and sizing.kelly(), the fit_1104.py method (15-DTE Kelly at k = IV / pre-print RV20, ask = model mid x 1.025).
    Fixed before any number was read: DTE 15, 21, 25, 28, 35; k 0.80-1.30; bootstrap P(f*=0) (catalyst_watch.boot_p0, 1000 draws,
    seed 7) at k 1.0; a 5% spread sensitivity (half spread 2.5%) at 15 and 35 DTE; the binding size = min(full Kelly, reserve).
    POST-HOC sensitivity (labelled so; not a rule): the same Kelly on the C1 events with ^VIX > 22 on the reaction day
    (research/2026-10-30/scripts/c1_vix_split.py rows and VIX file), because ^VIX is about 25 now.
    One-contract screen: Black-Scholes put price per $ of spot at |delta| 0.30 (the cheapest band strike), q = 0, r = 4.0%,
    -> the highest spot at which one contract (x 1.025 for half a 5% spread) fits min(full Kelly, reserve), at k = 1.0.

Q2  ^VIX ~25 with ^VIX9D > ^VIX3M: is any long option positive-EV?
    (a) The VRP (D1's measure) by regime: ^VIX minus the next 21 sessions' realized vol of ^GSPC (annualised, ddof 1), share IV > RV.
    (b) SPY puts at the real skew in the regime, with research/2026-11-01/scripts/ov_backtest.simulate (the engine ov_1106.py used for
        calls): the 11/06 Cboe chain's in-band put (OI >= 1,000, spread <= 5%, delta 0.30-0.45, 14-35 DTE from Mon 11/9) nearest
        |delta| 0.35 per expiry; IV multiple of ^VIX from that quote; hold 10 sessions (D1's horizon); hedged10 = hold minus the
        entry delta x the move (the non-beta part). Slices as ov_1106.py (2011+ for every 9D slice). Post-hoc, descriptive.

Run (from /home/user/temp):
  python3 -I <this> <earnings_cache> <vix_csv> <ov1106_data_dir>
"""
import csv
import importlib.util
import math
import sys
from datetime import date
from pathlib import Path

import numpy as np

R = Path('/home/user/temp/trading-experiment')
EQ = 1384.84
RESERVE = round(0.20 * EQ, 2)
KS = (0.80, 0.90, 1.00, 1.10, 1.15, 1.20, 1.25, 1.30)
DTES = (15, 21, 25, 28, 35)


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def q1(cache, vix_csv):
    sizing = load(R / 'research/strategy-review/scripts/sizing.py', 'sizing')
    cw = load(R / 'research/2026-11-01/scripts/catalyst_watch.py', 'catalyst_watch')
    ovg = load(R / 'research/2026-10-29/scripts/options_vol_gate.py', 'options_vol_gate')
    pay = cw.Payoffs(sizing, cache)
    print(f'Q1  C1 payoffs n {len(pay.ret)} (catalyst_watch.Payoffs, matched to sizing.c1_payoffs); equity ${EQ:,.2f}; reserve ${RESERVE:,.2f}')
    print('full Kelly $ (EV per $) by DTE x k; cell = full $ / binding min(full, reserve) / ask ceiling per share')
    print('k     ' + ''.join(f'{d:>26d}' for d in DTES))
    grid = {}
    for k in KS:
        cells = []
        for d in DTES:
            rr = pay(k, dte=d)
            f = sizing.kelly(rr)
            full = f * EQ
            grid[(k, d)] = (full, rr.mean())
            b = min(full, RESERVE)
            cells.append(f'${full:4.0f} ({rr.mean():.3f}) ask<={b / 100:4.2f}')
        print(f'{k:.2f}  ' + ''.join(f'{c:>26s}' for c in cells))
    print('5% spread (half 2.5%): ' + '; '.join(
        f'{d} DTE k {k:.2f} ${sizing.kelly(pay(k, dte=d, half_spread=0.025)) * EQ:.0f}' for d in (15, 35) for k in (0.9, 1.0, 1.15)))
    print('bootstrap P(f*=0) at k 1.0: ' + ', '.join(f'{d} DTE {cw.boot_p0(sizing, pay(1.0, dte=d)):.0%}' for d in (15, 25, 35)))
    # k where full Kelly falls to the reserve and to $0
    for d in DTES:
        ks = np.arange(0.70, 1.4001, 0.01)
        fulls = [sizing.kelly(pay(k, dte=d)) * EQ for k in ks]
        k_res = max((k for k, f in zip(ks, fulls) if f >= RESERVE), default=float('nan'))
        k_zero = min((k for k, f in zip(ks, fulls) if f <= 0), default=float('nan'))
        print(f'  {d} DTE: full Kelly >= reserve up to k {k_res:.2f}; full Kelly = $0 from k {k_zero:.2f}')

    # POST-HOC: reaction-day ^VIX > 22
    sys.path.insert(0, str(R / 'research/2026-10-30/scripts'))
    import c1_vix_split as vs
    vix = vs.load_vix(vix_csv)
    rows = [r for r in vs.build_rows(Path(cache)) if r['gap'] <= -0.08]
    ok = [r for r in rows if not any(math.isnan(r.get(k, float('nan'))) for k in ('ret5', 'cal5', 'rv_pre'))]
    assert len(ok) == len(pay.ret)
    v = np.array([vix.get(r['react_date'], np.nan) for r in ok])
    hi = v > 22
    print(f'\nPOST-HOC: reaction-day ^VIX > 22: n {hi.sum()} of {len(ok)} (VIX missing {np.isnan(v).sum()})')
    for d in (15, 25, 35):
        line = []
        for k in (0.8, 0.9, 1.0, 1.1, 1.2):
            rr = pay(k, dte=d)
            line.append(f'k {k:.1f} hi ${sizing.kelly(rr[hi]) * EQ:.0f} ({rr[hi].mean():.3f}) / lo ${sizing.kelly(rr[~hi]) * EQ:.0f} ({rr[~hi].mean():.3f})')
        print(f'  {d} DTE: ' + '; '.join(line))

    # one-contract screen at k = 1.0
    print('\nOne-contract screen, k 1.0 (IV = RV20): put/spot at |delta| 0.30 and the highest spot where 1 contract x 1.025 fits min(full, reserve)')
    for d in (15, 25, 35):
        T = d / 365
        b = min(grid[(1.0, d)][0], RESERVE)
        out = []
        for iv in (0.30, 0.40, 0.50, 0.60):
            # strike for |delta| 0.30 on a spot of 1
            lo, hi_ = 0.5, 1.0
            for _ in range(60):
                K = (lo + hi_) / 2
                px, dl = ovg.bs_put(1.0, K, T, iv, 0.04)
                if -dl > 0.30:
                    hi_ = K
                else:
                    lo = K
            px, dl = ovg.bs_put(1.0, K, T, iv, 0.04)
            out.append(f'IV {iv:.0%}: {px:.2%} of spot (K {K:.3f}S) -> S <= ${b / (100 * 1.025 * px):,.0f}')
        print(f'  {d} DTE (cap ${b:.0f}): ' + '; '.join(out))


def q2(data):
    sys.path.insert(0, str(R / 'research/2026-11-01/scripts'))
    sys.path.insert(0, str(R / 'research/strategy-review/scripts'))
    import ov_backtest as OB
    import options_lib as L
    from sizing import kelly
    OB.ENTRY = date(2026, 11, 9)
    OB.H = H = 10
    m = OB.market(data, 'SPY')
    dts = m['dates']
    m['v9'] = L.ffill_on(dts, {date.fromisoformat(k): v[1] for k, v in OB.jload(data, 'yahoo_VIX9D.json')['bars'].items() if v[1]}, back=False)
    m['v3'] = L.ffill_on(dts, {date.fromisoformat(k): v[1] for k, v in OB.jload(data, 'yahoo_VIX3M.json')['bars'].items() if v[1]}, back=False)
    vix, v9, v3 = m['vix'], m['v9'], m['v3']
    era = np.array([d >= date(2011, 1, 4) for d in dts])
    slices = {'all 1993+': np.ones(len(dts), bool), '2011+': era, 'VIX 23-28 (2011+)': era & (vix >= 23) & (vix <= 28),
              'VIX 23-28 & 9D>3M': era & (vix >= 23) & (vix <= 28) & (v9 > v3), 'VIX>=25 & 9D>3M': era & (vix >= 25) & (v9 > v3)}

    # (a) VRP by regime: ^VIX vs the next 21 sessions' realized vol of ^GSPC
    g = OB.ybars(data, 'GSPC')
    gd = sorted(d for d in g)
    gpos = {d: i for i, d in enumerate(gd)}
    gp = np.array([g[d] for d in gd])
    rvf = np.full(len(dts), np.nan)
    for i, d in enumerate(dts):
        j = gpos.get(d)
        if j is not None and j + 21 < len(gp):
            rvf[i] = np.std(np.diff(np.log(gp[j:j + 22])), ddof=1) * math.sqrt(252) * 100
    print('\nQ2a  VRP (D1 measure): ^VIX minus next-21-session ^GSPC RV')
    for name, mk in slices.items():
        s = mk & ~np.isnan(rvf) & ~np.isnan(vix)
        if name != 'all 1993+' and 'VIX' in name:
            pass
        dd = vix[s] - rvf[s]
        print(f'  {name:20s} n {s.sum():5d}: mean VIX {vix[s].mean():5.1f}, mean RV21 {rvf[s].mean():5.1f}, VIX-RV {dd.mean():+5.1f} pts '
              f'(median {np.median(dd):+5.1f}), IV>RV {np.mean(dd > 0):.0%}, VIX/RV median {np.median(vix[s] / rvf[s]):.2f}')

    # (b) SPY puts at the real skew
    ch = OB.jload(data, 'chain_SPY.json')
    picks = {}
    for o in ch['data']['options']:
        sy = o['option']
        if sy[-9] != 'P' or not o.get('bid') or not o.get('ask') or not o.get('iv'):
            continue
        e = date(2000 + int(sy[-15:-13]), int(sy[-13:-11]), int(sy[-11:-9]))
        dte = (e - OB.ENTRY).days
        mid = (o['bid'] + o['ask']) / 2
        if 14 <= dte <= 35 and 0.30 <= abs(o['delta']) <= 0.45 and int(o.get('open_interest') or 0) >= 1000 and (o['ask'] - o['bid']) / mid <= 0.05:
            if e not in picks or abs(abs(o['delta']) - 0.35) < abs(abs(picks[e]['delta']) - 0.35):
                picks[e] = o
    vix_now = OB.jload(data, 'quote__VIX.json')
    VIXC = 25.64
    print(f'\nQ2b  SPY puts, chain stamp {ch["timestamp"]} UTC (Fri close quotes; stale for Monday), ^VIX {VIXC}; hold {H} sessions; history {dts[0]}..{dts[-1]}')
    for e in sorted(picks):
        o = picks[e]
        dte = (e - OB.ENTRY).days
        spr = (o['ask'] - o['bid']) / ((o['ask'] + o['bid']) / 2)
        mult = o['iv'] * 100 / VIXC
        sim = OB.simulate(m, 'P', abs(o['delta']), dte, mult, spr / 2)
        idx, B = sim['idx'], sim['B']
        hold = B[:, H - 1]
        hedged = hold - sim['d0'] * (sim['Sk'][:, H - 1] - sim['S0']) / sim['cost']
        r1, _, _, _ = OB.rule(B, False)
        print(f'-- {o["option"]} {o["bid"]:.2f}/{o["ask"]:.2f} IV {o["iv"]:.4f} ({mult:.3f}x VIX) delta {o["delta"]:.3f} OI {int(o["open_interest"])} '
              f'DTE {dte}; 1 contract ${o["ask"] * 100:,.0f} vs reserve ${RESERVE:,.0f}')
        for name, mk in slices.items():
            mm = mk[idx]
            if mm.sum() < 30:
                print(f'   {name}: n {mm.sum()} (too few)'); continue
            sh, sd, s1 = OB.stats(hold[mm]), OB.stats(hedged[mm]), OB.stats(r1[mm])
            print(f'   {name:20s} n {sh["n"]:5d} | hold10 {sh["ev"]:.3f} (t {sh["t"]:+.1f}, hit {sh["hit"]:.0%}) | hedged10 {sd["ev"]:.3f} (t {sd["t"]:+.1f}) '
                  f'| +50/-50 {s1["ev"]:.3f} | full Kelly hold10 ${kelly(hold[mm]) * EQ:,.0f}')


if __name__ == '__main__':
    q1(sys.argv[1], sys.argv[2])
    q2(sys.argv[3])
