"""Macro 11/02: update of Sunday's midterm view (index premium fair to rich) from the Monday close. Specification fixed before the first run.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-02/scripts/macro_midterm_update.py <yahoo_dir> <chain_dir>
Inputs: Yahoo v8 daily bars (research/2026-11-01/scripts/macro_fetch.py, closes through Mon 11/2) and the Cboe SPY chain
(research/2026-11-01/scripts/macro_chains.py, 11/2 closing quotes).

1. EVENT PRICING. SPY ATM straddle (strike nearest the 752.10 official close, both bids > 0) per expiry 11/3..11/9, as % of 752.10;
   implied variance per session = differences of (straddle / 0.798)^2. Event premium = the Wed 11/4 (vote reaction) increment and the
   Fri 11/6 (jobs) increment over the Thu 11/5 increment.
2. HISTORY (^GSPC 1990-2026, prior ^VIX close). z = |return| / (VIX at the window start / 100 x sqrt(n / 252)). Windows from the Monday
   close before each federal election: to Wed (2 sessions) and to Fri (4 sessions). Baselines: every Monday-start 2- and 4-session window,
   all and with VIX 18-24 (today 21.15). Straddle gross payoff per $ = mean realized z / today's implied z, with a 90% bootstrap CI.
3. The SPY 11/30 770C / 750P shadow quotes (the 11/01 goal-budget contract and its put twin).
Descriptive, not a claim test.
"""
import json
import math
import os
import sys
from datetime import date, datetime, timedelta, timezone

import numpy as np

YD, CD = sys.argv[1], sys.argv[2]
SQ = math.sqrt
TODAY, SPOT = date(2026, 11, 2), 752.10


def yh(name):
    r = json.load(open(os.path.join(YD, f'y_{name}.json')))['chart']['result'][0]
    out = {}
    for t, c in zip(r['timestamp'], r['indicators']['quote'][0]['close']):
        if c is not None:
            out[datetime.fromtimestamp(t, tz=timezone.utc).date()] = float(c)
    return out


def occ(u, e, cp, k):
    return f'{u}{e:%y%m%d}{cp}{int(round(k * 1000)):08d}'


j = json.load(open(os.path.join(CD, 'chain_SPY.json')))
Q = {o['option']: o for o in j['data']['options']}
vix, v9, v3, gs = yh('_VIX'), yh('_VIX9D'), yh('_VIX3M'), yh('_GSPC')
VIX0 = vix[TODAY]
print(f"== 1. SPY event pricing (Cboe chain timestamp {j.get('timestamp')} UTC; close {j['data']['close']}, current_price "
      f"{j['data']['current_price']}); ^VIX {VIX0:.2f}, ^VIX9D {v9[TODAY]:.2f}, ^VIX3M {v3[TODAY]:.2f} (Yahoo 11/2)")
exps = [(date(2026, 11, 3), 1, 'Tue (vote)'), (date(2026, 11, 4), 2, 'Wed (reaction)'), (date(2026, 11, 5), 3, 'Thu'),
        (date(2026, 11, 6), 4, 'Fri (jobs)'), (date(2026, 11, 9), 5, 'Mon 11/9')]
prev, inc, st = 0.0, {}, {}
for e, n, lab in exps:
    best = None
    for k in np.arange(740, 765, 1.0):
        c, p = Q.get(occ('SPY', e, 'C', k)), Q.get(occ('SPY', e, 'P', k))
        if c and p and c['bid'] > 0 and p['bid'] > 0 and (best is None or abs(k - SPOT) < abs(best[0] - SPOT)):
            best = (k, c, p)
    k, c, p = best
    s = (c['bid'] + c['ask']) / 2 + (p['bid'] + p['ask']) / 2
    pct = s / SPOT
    var = (pct / 0.798) ** 2
    inc[lab] = var - prev
    st[n] = pct
    print(f"   {e} ({n} sessions, last = {lab:14}): K {k:.0f} C {c['bid']:.2f}/{c['ask']:.2f} P {p['bid']:.2f}/{p['ask']:.2f} straddle "
          f"{s:.2f} = {pct:.2%}; session sd {SQ(max(var - prev, 0)) * 100:.2f}%; z_implied {pct / (VIX0 / 100 * SQ(n / 252)):.3f}")
    prev = var
thu = inc['Thu']
print(f"   Wed reaction increment / Thu = {inc['Wed (reaction)'] / thu:.2f}x; Tue / Thu = {inc['Tue (vote)'] / thu:.2f}x; "
      f"Fri jobs / Thu = {inc['Fri (jobs)'] / thu:.2f}x")

print('\n== 2. History from the Monday close (^GSPC, z vs the Monday VIX)')
gd = [d for d in sorted(gs) if date(1990, 1, 2) <= d <= TODAY]
gi = {d: i for i, d in enumerate(gd)}
vx = np.array([vix.get(d, np.nan) for d in gd])


def z_at(i, n):
    if i + n >= len(gd) or not vx[i] == vx[i]:
        return np.nan
    return abs(gs[gd[i + n]] / gs[gd[i]] - 1) / (vx[i] / 100 * SQ(n / 252))


def election(y):
    d = date(y, 11, 2)
    while d.weekday() != 1:
        d += timedelta(days=1)
    return d


rows = []
for y in range(1990, 2025, 2):
    E = election(y)
    if E not in gi:
        continue
    m = gi[E] - 1
    assert gd[m].weekday() == 0, (y, gd[m])
    rows.append(dict(y=y, mid=y % 4 == 2, z2=z_at(m, 2), z4=z_at(m, 4), r2=gs[gd[m + 2]] / gs[gd[m]] - 1, r4=gs[gd[m + 4]] / gs[gd[m]] - 1,
                     vix=vx[m]))
for r in rows:
    print(f"   {r['y']} {'midterm' if r['mid'] else 'pres.  '} Mon VIX {r['vix']:5.1f}: Mon->Wed {r['r2']:+.2%} z {r['z2']:.2f} | "
          f"Mon->Fri {r['r4']:+.2%} z {r['z4']:.2f}")
mon = [i for i in range(len(gd) - 4) if gd[i].weekday() == 0 and gd[i + 2].weekday() == 2 and gd[i + 4].weekday() == 4]
z2a, z4a = np.array([z_at(i, 2) for i in mon]), np.array([z_at(i, 4) for i in mon])
reg = np.array([18 <= vx[i] <= 24 for i in mon])
zi2, zi4 = st[2] / (VIX0 / 100 * SQ(2 / 252)), st[4] / (VIX0 / 100 * SQ(4 / 252))
rng = np.random.default_rng(20261102)
print(f"   TODAY implied z: to Wed {zi2:.3f} (straddle {st[2]:.2%}), to Fri {zi4:.3f} (straddle {st[4]:.2%})")
for lab, sel in (('all elections', lambda r: True), ('midterms', lambda r: r['mid']), ('elections 2006+', lambda r: r['y'] >= 2006)):
    s = [r for r in rows if sel(r)]
    a2, a4 = np.array([r['z2'] for r in s]), np.array([r['z4'] for r in s])
    b2 = [rng.choice(a2, len(a2)).mean() / zi2 for _ in range(20000)]
    b4 = [rng.choice(a4, len(a4)).mean() / zi4 for _ in range(20000)]
    print(f"   {lab:16} n {len(s):2d}: to Wed z {a2.mean():.3f} -> straddle payoff {a2.mean() / zi2:.2f} (90% CI {np.percentile(b2, 5):.2f}-"
          f"{np.percentile(b2, 95):.2f}); to Fri z {a4.mean():.3f} -> {a4.mean() / zi4:.2f} (CI {np.percentile(b4, 5):.2f}-{np.percentile(b4, 95):.2f}); "
          f"Mon->Wed up {sum(r['r2'] > 0 for r in s)}/{len(s)}, mean {np.mean([r['r2'] for r in s]):+.2%}")
print(f"   every Monday-start window n {len(mon)}: to Wed z {np.nanmean(z2a):.3f} -> {np.nanmean(z2a) / zi2:.2f}; to Fri z {np.nanmean(z4a):.3f} -> "
      f"{np.nanmean(z4a) / zi4:.2f}; with VIX 18-24 (n {reg.sum()}): {np.nanmean(z2a[reg]) / zi2:.2f} / {np.nanmean(z4a[reg]) / zi4:.2f}")
mids = [r for r in rows if r['mid']]
print(f"   expected |move| at VIX {VIX0:.2f}: to Wed, midterm z {np.mean([r['z2'] for r in mids]) * VIX0 / 100 * SQ(2 / 252):.2%}, all-election z "
      f"{np.mean([r['z2'] for r in rows]) * VIX0 / 100 * SQ(2 / 252):.2%}, market {st[2]:.2%}; to Fri, midterm "
      f"{np.mean([r['z4'] for r in mids]) * VIX0 / 100 * SQ(4 / 252):.2%}, all {np.mean([r['z4'] for r in rows]) * VIX0 / 100 * SQ(4 / 252):.2%}, "
      f"market {st[4]:.2%}")

print('\n== 3. Shadow quotes (Cboe, same chain)')
for s in ('SPY261130C00770000', 'SPY261130P00750000'):
    o = Q[s]
    print(f"   {s} {o['bid']:.2f}/{o['ask']:.2f} iv {o['iv']:.3f} delta {o['delta']:+.2f} oi {int(o['open_interest'])}")
