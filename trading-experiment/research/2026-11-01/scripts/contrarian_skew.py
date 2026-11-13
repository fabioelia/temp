#!/usr/bin/env python3
"""Contrarian persona, 2026-11-01: where do QQQ / SMH / NVDA options price the "AI wipeout" story?

For each Cboe delayed chain (today's, plus earlier saved snapshots for comparison) it reports, on the expiry closest to 28 DTE
inside 21-35 DTE: Cboe IV interpolated in delta at the 0.25 / 0.40 / 0.50 call and put, put skew (25d put - 50d put), call skew
(25d call - 50d call), the 25d risk reversal, and IV against close-to-close realized vol (RV10, RV20; Yahoo closes up to the
chain's date). Then it lists contracts that pass the brief's filters for an entry on Mon 11/2 (21-35 DTE from 11/2 and still
>= 21 from 11/6 where possible, |delta| 0.30-0.45, OI >= 1,000, spread <= 5% of mid).

Run (from /home/user/temp; run contrarian_fetch.py first):
  python3 -I trading-experiment/research/2026-11-01/scripts/contrarian_skew.py
"""
import json
import math
import os
from datetime import date

D = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad'
NOW = os.path.join(D, 'contrarian1101/data')
SNAPS = {  # underlying -> [(label, path)]; the earlier files are this project's own saved Cboe pulls
    'QQQ': [('10/17 close', f'{D}/cboe_chains/QQQ.json'), ('10/27 close', f'{D}/chains/QQQ.json'), ('10/30 close', f'{NOW}/chain_QQQ.json')],
    'SMH': [('10/17 close', f'{D}/cboe_chains/SMH.json'), ('10/30 close', f'{NOW}/chain_SMH.json')],
    'NVDA': [('10/17 close', f'{D}/cboe_chains/NVDA.json'), ('10/26 close', f'{D}/chains/NVDA_1026.json'), ('10/30 close', f'{NOW}/chain_NVDA.json')],
}
DATA_DATE = {'10/17 close': date(2026, 10, 17), '10/26 close': date(2026, 10, 26), '10/27 close': date(2026, 10, 27),
             '10/30 close': date(2026, 10, 30)}


def occ(sym):
    s = sym.strip()
    return s[:-15], date(2000 + int(s[-15:-13]), int(s[-13:-11]), int(s[-11:-9])), s[-9], int(s[-8:]) / 1000.0


def bars(sym):
    return json.load(open(os.path.join(NOW, f'bars_{sym}.json')))['rows']


def rv(sym, upto, n):
    c = [r[4] for r in bars(sym) if r[0] <= upto.isoformat()]
    lr = [math.log(c[i] / c[i - 1]) for i in range(len(c) - n, len(c))]
    m = sum(lr) / n
    return math.sqrt(sum((x - m) ** 2 for x in lr) / (n - 1) * 252)


def interp(points, target):
    """points: [(delta, iv)] sorted by delta; linear interpolation in delta."""
    pts = sorted(points)
    for (d0, v0), (d1, v1) in zip(pts, pts[1:]):
        if d0 <= target <= d1 and d1 > d0:
            return v0 + (v1 - v0) * (target - d0) / (d1 - d0)
    return float('nan')


def surface(path, asof):
    d = json.load(open(path))['data']
    by_exp = {}
    for o in d['options']:
        _, exp, typ, k = occ(o['option'])
        dte = (exp - asof).days
        if not 21 <= dte <= 35 or not o.get('iv') or not o.get('delta') or not (o.get('bid') or 0) > 0:
            continue
        by_exp.setdefault(exp, {'C': [], 'P': []})[typ].append((abs(float(o['delta'])), float(o['iv'])))
    exp = min(by_exp, key=lambda e: abs((e - asof).days - 28))
    s = by_exp[exp]
    iv = {f'{t}{x:.2f}': interp(s[t], x) for t in 'CP' for x in (0.25, 0.40, 0.50)}
    return d['current_price'], exp, (exp - asof).days, iv


def candidates(u, path, entry=date(2026, 11, 2)):
    d = json.load(open(path))['data']
    out = []
    for o in d['options']:
        _, exp, typ, k = occ(o['option'])
        dte = (exp - entry).days
        bid, ask = o.get('bid') or 0, o.get('ask') or 0
        if not 21 <= dte <= 35 or not bid or not ask:
            continue
        mid = (bid + ask) / 2
        dl = abs(float(o.get('delta') or 0))
        if 0.30 <= dl <= 0.45 and (o.get('open_interest') or 0) >= 1000 and (ask - bid) / mid <= 0.05:
            out.append((exp, typ, k, o['option'], bid, ask, (ask - bid) / mid, float(o['iv']), float(o['delta']), int(o['open_interest'])))
    return sorted(out)


def main():
    print('Surface on the expiry nearest 28 DTE (21-35), Cboe iv field interpolated in |delta|; RV close-to-close (Yahoo)')
    print(f"{'und':5} {'chain':12} {'spot':>9} {'exp':10} {'dte':>3} | {'P25':>5} {'P40':>5} {'P50':>5} {'C50':>5} {'C40':>5} {'C25':>5} | "
          f"{'pSkew':>5} {'cSkew':>5} {'RR25':>5} | {'RV10':>5} {'RV20':>5} | {'ATM/RV20':>8} {'C40/RV20':>8} {'P40/RV20':>8}")
    for u, snaps in SNAPS.items():
        for lab, path in snaps:
            asof = DATA_DATE[lab]
            spot, exp, dte, iv = surface(path, asof)
            atm = (iv['C0.50'] + iv['P0.50']) / 2
            r10, r20 = rv(u, asof, 10), rv(u, asof, 20)
            print(f"{u:5} {lab:12} {spot:9.2f} {exp} {dte:3d} | {iv['P0.25']:5.3f} {iv['P0.40']:5.3f} {iv['P0.50']:5.3f} {iv['C0.50']:5.3f} "
                  f"{iv['C0.40']:5.3f} {iv['C0.25']:5.3f} | {iv['P0.25'] - iv['P0.50']:+5.3f} {iv['C0.25'] - iv['C0.50']:+5.3f} "
                  f"{iv['P0.25'] - iv['C0.25']:+5.3f} | {r10:5.3f} {r20:5.3f} | {atm / r20:8.2f} {iv['C0.40'] / r20:8.2f} {iv['P0.40'] / r20:8.2f}")
    for sym in ('VXN', 'VIX'):
        b = bars(sym)
        print(f"^{sym} close {b[-1][0]} {b[-1][4]:.2f} (Yahoo)")
    ndx = bars('NDX')
    hi = max(r[4] for r in ndx[-252:])
    hid = [r[0] for r in ndx[-252:] if r[4] == hi][0]
    print(f"^NDX close {ndx[-1][0]} {ndx[-1][4]:.2f}; 252-session closing high {hi:.2f} on {hid}; drawdown {ndx[-1][4] / hi - 1:+.1%}")
    for u in ('QQQ', 'SMH', 'NVDA'):
        b = bars(u)
        hi = max(r[4] for r in b[-252:])
        hid = [r[0] for r in b[-252:] if r[4] == hi][0]
        print(f"{u} close {b[-1][0]} {b[-1][4]:.2f}; 252-session closing high {hi:.2f} on {hid}; drawdown {b[-1][4] / hi - 1:+.1%}")
    print('\nContracts passing the brief filters for a Mon 11/2 entry (21-35 DTE from 11/2, |delta| 0.30-0.45, OI >= 1000, spread <= 5%),'
          ' Cboe delayed chain at the 10/30 close')
    for u in ('QQQ', 'SMH', 'NVDA'):
        c = candidates(u, f'{NOW}/chain_{u}.json')
        if not c:
            print(f'  {u}: none')
        for exp, typ, k, sym, bid, ask, spr, iv, dl, oi in c:
            print(f'  {sym} {exp} {typ} {k:8.2f} bid {bid:7.2f} ask {ask:7.2f} spread {spr:4.1%} iv {iv:.3f} delta {dl:+.2f} oi {oi}')


if __name__ == '__main__':
    main()
