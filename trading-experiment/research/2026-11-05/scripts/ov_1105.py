#!/usr/bin/env python3
"""options-vol, 2026-11-05 (Run B), question 2: after tonight's vol spike (^VIX 28.18, ^VIX9D 32.66 > ^VIX3M 25.55), does buying a
0.35-0.40 delta SPY or QQQ call at tonight's IV pay per $ over the 9 sessions to the 11/18 close? Implied vs realized, payoff, Kelly.

Offline. Reuses the committed engine research/2026-11-01/scripts/ov_backtest.py (Black-Scholes at IV = m x index vol, sticky ratio,
half the quoted spread each way, the review's rates and dividends), as research/2026-11-02/scripts/ov_calls.py did, with tonight's
entry (11/5 close quotes) and horizon (H = 9 sessions, 11/6 .. 11/18).
  data_dir: tonight's Cboe chains (ov_fetch.py, Cboe stamp 2026-11-05 22:17 UTC = 17:17 ET; the fetch stopped at AMD on a Cboe HTTP 429), plus the
            Yahoo daily bars from the 11/02 fetch (history to 11/02; only the history is used, never a price after it).
  Index vols tonight (Yahoo official closes 11/05 via quotes.py closes): ^VIX 28.18, ^VXN 38.26.
Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-05/scripts/ov_1105.py <data_dir>

Per contract: m = IV / index vol; payoffs per $ of the ask: hold9 (sold at the 9th close), rule1 (our 1-contract exits: all at +50%,
-50% backstop, else the 9th close), hedged9 (hold9 minus entry delta x the underlying's move per $: the non-beta part). Fair IV =
median(realized vol over the next 9 sessions / index vol at entry) x tonight's index vol. Kelly: sizing.py's kelly() at equity
$1,384.84; one contract only when full Kelly covers its cost (W44 rule).
Periods: full, 2010-2026, and two POST-HOC slices like tonight (descriptive, not an edge under the evidence rules):
  (a) ^VIX >= 25 at entry; (b) ^VIX >= 25 and ^VIX9D > ^VIX3M at entry (VIX9D history starts 2011).
Choices fixed before any result was read: the contracts (nearest delta 0.375 on 12/04 and the OI-passing 12/18 strikes), H, the slices.
"""
import math
import os
import sys
from datetime import date

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/2026-11-01/scripts')
sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import ov_backtest as OB  # noqa: E402  (committed engine)
import options_lib as L  # noqa: E402
from sizing import kelly  # noqa: E402

OB.ENTRY = date(2026, 11, 5)
OB.H = H = 9
EQ = 1384.84
XV = {'SPY': 28.18, 'QQQ': 38.26}
PICK = {'SPY': ('SPY261204C00750000', 'SPY261218C00750000', 'SPY261218C00755000'),
        'QQQ': ('QQQ261204C00670000', 'QQQ261218C00675000', 'QQQ261218C00670000')}


def main():
    data = sys.argv[1]
    for u in ('SPY', 'QQQ'):
        ch = OB.jload(data, f'chain_{u}.json')
        opts = {o['option']: o for o in ch['data']['options']}
        xv = XV[u]
        m = OB.market(data, u)
        dts, S, X = m['dates'], m['S'], m['X']
        n = len(dts)
        lr = np.diff(np.log(S))
        fwd = np.full(n, np.nan)
        for i in range(21, n - H):
            fwd[i] = math.sqrt(252 / H * np.sum(lr[i:i + H] ** 2))
        vix, v9, v3 = m['vix'], m['v9'], m['v3']
        spike = vix >= 25
        inv = spike & (v9 > v3)
        ok = ~np.isnan(fwd) & ~np.isnan(X)
        ratio = fwd / X
        print(f'\n=== {u}: chain stamp {ch["timestamp"]} UTC, close {ch["data"].get("close")} | index vol {xv} | history '
              f'{dts[0]} .. {dts[-1]}')
        print('  fair IV (median next-9-session RV / index vol x tonight): ' + '; '.join(
            f'{k} {np.nanmedian(ratio[ok & mk]):.3f} -> {np.nanmedian(ratio[ok & mk]) * xv:.1f}% (n {int((ok & mk).sum())})'
            for k, mk in (('all', np.ones(n, bool)), ('VIX>=25', spike), ('VIX>=25 & 9D>3M', inv))))
        for sym in PICK[u]:
            o = opts[sym]
            e = date(2000 + int(sym[-15:-13]), int(sym[-13:-11]), int(sym[-11:-9]))
            dte = (e - OB.ENTRY).days
            midp = (o['bid'] + o['ask']) / 2
            spr = (o['ask'] - o['bid']) / midp
            mult = o['iv'] * 100 / xv
            cost1 = o['ask'] * 100
            print(f'-- {sym} bid {o["bid"]:.2f} ask {o["ask"]:.2f} IV {o["iv"]:.4f} ({mult:.3f}x index) delta {o["delta"]:.3f} '
                  f'OI {int(o.get("open_interest") or 0)} spread {spr:.1%} DTE {dte}; 1 contract ${cost1:,.0f}')
            sim = OB.simulate(m, 'C', abs(o['delta']), dte, mult, spr / 2)
            idx, B = sim['idx'], sim['B']
            ed = [dts[i] for i in idx]
            hold = B[:, H - 1]
            r1, h50, _, st1 = OB.rule(B, False)
            hedged = hold - sim['d0'] * (sim['Sk'][:, H - 1] - sim['S0']) / sim['cost']
            masks = {'full': np.ones(len(idx), bool), '2010-2026': np.array([d >= date(2010, 1, 1) for d in ed]),
                     'VIX>=25 (post-hoc)': spike[idx], 'VIX>=25 & 9D>3M (post-hoc)': inv[idx]}
            for pname, mask in masks.items():
                if mask.sum() < 30:
                    print(f'   {pname}: n {mask.sum()} (too few)')
                    continue
                sh, s1, sg = (OB.stats(a[mask]) for a in (hold, r1, hedged))
                fh, f1 = kelly(hold[mask]), kelly(r1[mask])
                print(f'   {pname:28s} n {sh["n"]:5d} | hold9 {sh["ev"]:.3f} (t {sh["t"]:.1f}, hit {sh["hit"]:.0%}) '
                      f'hedged9 {sg["ev"]:.3f} (t {sg["t"]:.1f}) | rule1 {s1["ev"]:.3f} (t {s1["t"]:.1f}; +50% {h50[mask].mean():.0%}, '
                      f'stop {st1[mask].mean():.0%}) | full Kelly hold9 ${fh * EQ:,.0f}, rule1 ${f1 * EQ:,.0f} (half ${f1 * EQ / 2:,.0f}, '
                      f'quarter ${f1 * EQ / 4:,.0f}) vs ${cost1:,.0f}: {"covers" if f1 * EQ >= cost1 else "does not cover"}')


if __name__ == '__main__':
    main()
