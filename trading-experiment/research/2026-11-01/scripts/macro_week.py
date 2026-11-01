"""Macro 11/01 (week of 11/2-11/6): is index and oil option premium cheap or rich into the midterms (Tue 11/3), the jobs report (Fri 11/6)
and the US-Iran ceasefire window, and does any 21-35 DTE contract carry a measured edge? Specification fixed before the first run.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-01/scripts/macro_week.py <yahoo_dir> <chain_dir> <out_dir>
Inputs: Yahoo v8 daily bars saved by macro_fetch.py (y_<sym>.json; closes through Fri 10/30/2026), Cboe delayed chains saved by
macro_chains.py (chain_<sym>.json; Friday 10/30 closing quotes). Black-Scholes, strike-for-delta and Newey-West helpers come from the
strategy review's options_lib.py. Writes per-trade payoff CSVs to <out_dir> for sizing.py.

1. EVENT PRICING (SPY chain). ATM straddle mid / spot per expiry 11/2..11/9 = the market's expected absolute move to that expiry.
   Implied variance per session = differences of (straddle / 0.798)^2. An event premium shows as a Wed 11/4 (vote reaction) or
   Fri 11/6 (jobs) increment above the other sessions.
2. HISTORY (^GSPC closes, 1990-2026, so every day has a prior ^VIX close). z = |return| / (prior VIX / 100 x sqrt(n / 252)): realized
   move in units of the VIX-implied 1-sd move. Compared:
   * the reaction day after every federal election (first Tuesday after the first Monday of November, even years; midterms a subset);
   * jobs days: the BLS rule (the third Friday after the week containing the 12th), skipped when that Friday is not a trading day
     (holiday moves and the 2013/2025 shutdown delays are not modelled, which dilutes the jobs-day effect);
   * the 3- and 5-session windows from the Friday before each election (to Wed and Fri), against every Friday-start window.
   Today's implied z = SPY straddle / (VIX 10/30 x sqrt(n / 252)). A straddle held to expiry returns about E|move| / straddle per $,
   so (mean realized z) / (implied z) is its gross payoff per $ (before spread; SPY weekly spreads are about 1%).
3. TRADEABLE SPY CONTRACTS (21-35 DTE, delta 0.30-0.45, OI >= 1,000, spread <= 5%). Model: every close 2010-2026 with VIX 16-24
   (today 19.42), buy a call at delta 0.37 or a put at delta 0.39, 28 calendar days to expiry (11/30), priced at IV = m x VIX where m is
   today's chain IV / VIX for SPY261130C00770000 and SPY261130P00750000; re-priced each close at the same m x that day's VIX; half of a
   2% spread paid each way. Exits: hold 12 sessions (Mon 11/2 to the 11/18 window end), and the playbook's 1-contract set (sell all at
   +50%, -50% backstop, both on closes; the underlying-level stop is not modelled). Per-trade payoffs go to spy_payoffs.csv.
4. OIL. USO RV20 / RV60 against ^OVX (Cboe's 30-day IV on USO options) and the chain's ATM IV; ^OVX against the next 21 sessions'
   realized USO vol, 2007-2026, overall and when OVX / RV20 is at or above today's ratio; the USO 5-session absolute moves of the last
   250 sessions (the war and ceasefire regime) against the 11/6 straddle; the model payoff of a USO 0.40-delta call and put
   (28 DTE, IV = m x OVX with m from the chain, 10% spread, same exits), every close 2010-2026 and when OVX / RV20 >= 1.5.
   Per-trade payoffs go to uso_payoffs.csv.
Descriptive and model results, not a claim test: nothing here is pre-registered in research/strategy-review/claims.md.
"""
import csv
import json
import math
import os
import sys
from datetime import date, datetime, timedelta, timezone

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import options_lib as L  # noqa: E402

YD, CD, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
SQ = math.sqrt


def yh(name):
    r = json.load(open(os.path.join(YD, f'y_{name}.json')))['chart']['result'][0]
    out = {}
    for t, c in zip(r['timestamp'], r['indicators']['quote'][0]['close']):
        if c:
            out[datetime.fromtimestamp(t, tz=timezone.utc).date()] = float(c)
    return out


def chain(sym):
    j = json.load(open(os.path.join(CD, f'chain_{sym}.json')))
    q = {}
    for o in j['data']['options']:
        q[o['option']] = o
    return float(j['data']['current_price']), q, j.get('timestamp')


def mid(o):
    return (o['bid'] + o['ask']) / 2


def occ(u, e, cp, k):
    return f'{u}{e:%y%m%d}{cp}{int(round(k * 1000)):08d}'


# ------------------------------------------------------------------ 1. event pricing
print('== 1. SPY event pricing from the Cboe chain (Fri 10/30 closing quotes)')
spot, Q, ts = chain('SPY')
vix = yh('_VIX')
v9, v3 = yh('_VIX9D'), yh('_VIX3M')
D_LAST = date(2026, 10, 30)
VIX0 = vix[D_LAST]
print(f'SPY spot {spot} (chain timestamp {ts}); ^VIX {VIX0:.2f}, ^VIX9D {v9[D_LAST]:.2f}, ^VIX3M {v3[D_LAST]:.2f} (Yahoo, 10/30)')
exps = [(date(2026, 11, 2), 1, 'Mon'), (date(2026, 11, 3), 2, 'Tue (vote)'), (date(2026, 11, 4), 3, 'Wed (reaction)'),
        (date(2026, 11, 5), 4, 'Thu'), (date(2026, 11, 6), 5, 'Fri (jobs)'), (date(2026, 11, 9), 6, 'Mon 11/9')]
prev_var, incs, straddle = 0.0, {}, {}
for e, n, lab in exps:
    best = None
    for k in np.arange(740, 771, 1.0):
        c, p = Q.get(occ('SPY', e, 'C', k)), Q.get(occ('SPY', e, 'P', k))
        if c and p and c['bid'] > 0 and p['bid'] > 0 and (best is None or abs(k - spot) < abs(best[0] - spot)):
            best = (k, c, p)
    k, c, p = best
    st = mid(c) + mid(p) + 0.0  # ATM strike within $0.28 of spot: no parity adjustment needed at this precision
    pct = st / spot
    var = (pct / 0.798) ** 2
    incs[lab] = var - prev_var
    straddle[n] = pct
    zimp = pct / (VIX0 / 100 * SQ(n / 252))
    print(f'  {e} ({n} sessions from Fri close, last = {lab:15}): K {k:.0f} straddle {st:6.2f} = {pct:.2%} of spot; '
          f'implied var increment {100 * 100 * (var - prev_var):.2f} (%^2, = {SQ(max(var - prev_var, 0)) * 100:.2f}% sd); '
          f'z_implied {zimp:.3f}')
    prev_var = var
base = np.median([incs[x] for x in ('Tue (vote)', 'Thu')])
print(f'  Event premium: Wed reaction increment / median(Tue, Thu) = {incs["Wed (reaction)"] / base:.2f}x; '
      f'Fri jobs increment / median(Tue, Thu) = {incs["Fri (jobs)"] / base:.2f}x (Mon carries the weekend)')

# ------------------------------------------------------------------ 2. history
print('\n== 2. ^GSPC realized moves vs the prior VIX-implied move, 1990-2026 (z = |ret| / (VIX/100 x sqrt(n/252)))')
gs = yh('_GSPC')
gd = [d for d in sorted(gs) if d >= date(1990, 1, 2) and d <= D_LAST]
gi = {d: i for i, d in enumerate(gd)}
vx = [vix.get(d, np.nan) for d in gd]


def z_at(i, n):
    """|close[i+n]/close[i]-1| / (VIX[i] x sqrt(n/252)): window starts at close i."""
    if i + n >= len(gd) or not vx[i] == vx[i]:
        return np.nan
    return abs(gs[gd[i + n]] / gs[gd[i]] - 1) / (vx[i] / 100 * SQ(n / 252))


def election(y):
    d = date(y, 11, 2)
    while d.weekday() != 1:  # first Tuesday after the first Monday = the first Tuesday on or after Nov 2
        d += timedelta(days=1)
    return d


def jobs_day(y, m):
    d12 = date(y, m, 12)
    sat = d12 + timedelta(days=(5 - d12.weekday()) % 7)  # Saturday ending the reference week (Sun-Sat containing the 12th)
    fri = sat + timedelta(days=6 + 14)  # the third Friday after it
    return fri


all1 = np.array([z_at(i, 1) for i in range(len(gd) - 1)])
print(f'  all days: mean z1 {np.nanmean(all1):.3f}, median {np.nanmedian(all1):.3f} (n {np.sum(~np.isnan(all1))})')
rows = []
for y in range(1990, 2025, 2):
    ed = election(y)
    if ed not in gi:
        continue
    i = gi[ed]
    fri = i - 1
    while gd[fri].weekday() != 4:
        fri -= 1
    r1 = gs[gd[i + 1]] / gs[gd[i]] - 1
    rows.append(dict(y=y, mid=(y % 4 == 2), react=gd[i + 1], r1=r1, z1=z_at(i, 1), z3=z_at(fri, i + 1 - fri), n3=i + 1 - fri,
                     z5=z_at(fri, 5), r5=gs[gd[fri + 5]] / gs[gd[fri]] - 1, vix=vx[fri]))
print('  election reaction days (Wed close vs Tue close) and the Fri-before windows:')
for r in rows:
    print(f"    {r['y']} {'midterm ' if r['mid'] else 'pres.   '} react {r['react']} ret {r['r1']:+.2%} z1 {r['z1']:.2f} | "
          f"Fri->Wed z{r['n3']} {r['z3']:.2f} | Fri->Fri ret {r['r5']:+.2%} z5 {r['z5']:.2f} | VIX Fri {r['vix']:.1f}")
for lab, sel in (('all elections', lambda r: True), ('midterms', lambda r: r['mid']), ('elections 2006+', lambda r: r['y'] >= 2006)):
    s = [r for r in rows if sel(r)]
    print(f"  {lab:16} n {len(s):2d}: reaction-day z1 mean {np.mean([r['z1'] for r in s]):.3f} median {np.median([r['z1'] for r in s]):.3f}; "
          f"Fri->Wed z mean {np.mean([r['z3'] for r in s]):.3f}; Fri->Fri z5 mean {np.mean([r['z5'] for r in s]):.3f} "
          f"median {np.median([r['z5'] for r in s]):.3f}")
jd = set()
for y in range(1990, 2027):
    for m in range(1, 13):
        d = jobs_day(y, m)
        if d in gi and gi[d] > 0:
            jd.add(d)
zj = np.array([z_at(gi[d] - 1, 1) for d in sorted(jd)])
zj = zj[~np.isnan(zj)]
zj21 = np.array([z_at(gi[d] - 1, 1) for d in sorted(jd) if d >= date(2021, 1, 1)])
all21 = np.array([z_at(i, 1) for i in range(len(gd) - 1) if gd[i] >= date(2021, 1, 1)])
print(f'  jobs days (BLS rule): mean z1 {zj.mean():.3f} (n {len(zj)}) vs all days {np.nanmean(all1):.3f}; since 2021 {np.nanmean(zj21):.3f} '
      f'(n {len(zj21)}) vs {np.nanmean(all21):.3f}')
fr = [i for i in range(len(gd) - 5) if gd[i].weekday() == 4]
z3a = np.array([z_at(i, 3) for i in fr])
z5a = np.array([z_at(i, 5) for i in fr])
reg = np.array([16 <= vx[i] <= 24 for i in fr])
print(f'  every Friday-start window: z3 mean {np.nanmean(z3a):.3f}, z5 mean {np.nanmean(z5a):.3f} (n {len(fr)}); '
      f'with VIX 16-24: z3 {np.nanmean(z3a[reg]):.3f}, z5 {np.nanmean(z5a[reg]):.3f} (n {reg.sum()})')
zi3 = straddle[3] / (VIX0 / 100 * SQ(3 / 252))
zi5 = straddle[5] / (VIX0 / 100 * SQ(5 / 252))
el = rows
e3, e5 = np.mean([r['z3'] for r in el]), np.mean([r['z5'] for r in el])
print(f'  TODAY implied: Fri->Wed z {zi3:.3f} (straddle {straddle[3]:.2%}), Fri->Fri z5 {zi5:.3f} (straddle {straddle[5]:.2%})')
print(f'  Straddle gross payoff per $ (mean realized z / implied z):')
print(f'    5-session to Fri 11/6: election weeks {e5 / zi5:.2f} (n {len(el)}), all weeks {np.nanmean(z5a) / zi5:.2f}, '
      f'VIX 16-24 weeks {np.nanmean(z5a[reg]) / zi5:.2f}')
print(f'    3-session to Wed 11/4: election weeks {e3 / zi3:.2f}, all Fri-start 3-session windows {np.nanmean(z3a) / zi3:.2f}, '
      f'VIX 16-24 {np.nanmean(z3a[reg]) / zi3:.2f}')
# bootstrap CI for the election-week 5-session ratio
rng = np.random.default_rng(20261101)
z5e = np.array([r['z5'] for r in el])
bs = [rng.choice(z5e, len(z5e)).mean() / zi5 for _ in range(20000)]
print(f'    election-week 5-session ratio 90% bootstrap CI {np.percentile(bs, 5):.2f}-{np.percentile(bs, 95):.2f}')
# Expected moves in % for this week from the two bases
print(f'  Expected |move| to Fri 11/6 at VIX {VIX0:.2f}: election-week z {e5:.3f} -> {e5 * VIX0 / 100 * SQ(5 / 252):.2%}; '
      f'VIX 16-24 base {np.nanmean(z5a[reg]) * VIX0 / 100 * SQ(5 / 252):.2%}; market straddle {straddle[5]:.2%}')

# ------------------------------------------------------------------ 3. tradeable SPY contracts (model)
print('\n== 3. SPY 21-35 DTE contracts at today\'s skew: model payoffs per $, every close 2010-2026 with VIX 16-24')
cK, pK, e30 = 770.0, 750.0, date(2026, 11, 30)
co, po = Q[occ('SPY', e30, 'C', cK)], Q[occ('SPY', e30, 'P', pK)]
mc, mp = co['iv'] / (VIX0 / 100), po['iv'] / (VIX0 / 100)
print(f"  {occ('SPY', e30, 'C', cK)} bid/ask {co['bid']:.2f}/{co['ask']:.2f} iv {co['iv']:.3f} delta {co['delta']:+.2f} oi {co['open_interest']} "
      f"-> m = {mc:.3f} x VIX")
print(f"  {occ('SPY', e30, 'P', pK)} bid/ask {po['bid']:.2f}/{po['ask']:.2f} iv {po['iv']:.3f} delta {po['delta']:+.2f} oi {po['open_interest']} "
      f"-> m = {mp:.3f} x VIX")
spy = yh('SPY')
irx = yh('_IRX')
sd = [d for d in sorted(spy) if d <= D_LAST]
S = np.array([spy[d] for d in sd])
V = L.ffill_on(sd, vix) / 100
R = L.ffill_on(sd, irx) / 100
H, DTE, HALF = 12, 28, 0.01


def sim(S, V, R, dates, m, delta, kind, q, half, mask_fn):
    out = []
    for i in range(len(dates) - H):
        if dates[i] < date(2010, 1, 1) or not mask_fn(i):
            continue
        T0 = DTE / 365
        K = float(L.strike_for_delta(S[i], T0, m * V[i], R[i], q, delta, kind)[0])
        cost = float(L.bs(S[i], K, T0, m * V[i], R[i], q, kind)) * (1 + half)
        path = []
        for k in range(1, H + 1):
            Tk = (DTE - (dates[i + k] - dates[i]).days) / 365
            path.append(float(L.bs(S[i + k], K, max(Tk, 0), m * V[i + k], R[i + k], q, kind)) * (1 - half) / cost)
        hold = path[-1]
        r5a = hold
        for x in path:  # 1-contract set: all at +50%, -50% backstop, checked on closes
            if x >= 1.5:
                r5a = 1.5
                break
            if x <= 0.5:
                r5a = x
                break
        out.append((dates[i], hold, r5a, max(path) >= 1.5))
    return out


regmask = lambda i: 0.16 <= V[i] <= 0.24  # noqa: E731
res = {}
for lab, m, dl, kind in (('call', mc, 0.37, 'C'), ('put', mp, 0.39, 'P')):
    tr = sim(S, V, R, sd, m, dl, kind, 0.012, HALF, regmask)
    h = np.array([t[1] for t in tr])
    a = np.array([t[2] for t in tr])
    tp = np.mean([t[3] for t in tr])
    se_h, se_a = L.nw_se_mean(h, 2 * H), L.nw_se_mean(a, 2 * H)
    res[lab] = tr
    print(f'  SPY {lab} d{dl} m {m:.3f}: n {len(tr)}; hold 12 sessions EV {h.mean():.3f} (NW t vs 1: {(h.mean() - 1) / se_h:+.2f}), '
          f'median {np.median(h):.2f}; 1-contract set EV {a.mean():.3f} (t {(a.mean() - 1) / se_a:+.2f}); +50% reached on a close {tp:.0%}')
    late = np.array([t[2] for t in tr if t[0] >= date(2018, 1, 1)])
    print(f'      since 2018: 1-contract set EV {late.mean():.3f} (n {len(late)})')
with open(os.path.join(OUT, 'spy_payoffs.csv'), 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['date', 'kind', 'hold12', 'set1'])
    for lab in res:
        for t in res[lab]:
            w.writerow([t[0], lab, f'{t[1]:.5f}', f'{t[2]:.5f}'])
for lab in res:
    with open(os.path.join(OUT, f'spy_{lab}_payoffs.csv'), 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['date', 'hold12', 'set1'])
        for t in res[lab]:
            w.writerow([t[0], f'{t[1]:.5f}', f'{t[2]:.5f}'])
# Goal arithmetic: one call reaching +50% adds 0.5 x cost
need = 2200 - 1917.92
print(f"  Goal arithmetic: $2,200 needs +${need:.2f}; one {occ('SPY', e30, 'C', cK)} at the {co['ask']:.2f} ask costs ${100 * co['ask']:.0f}, "
      f"so its +50% exit adds ${50 * co['ask']:.0f} ({'enough' if 50 * co['ask'] >= need else 'not enough'})")

# ------------------------------------------------------------------ 4. oil
print('\n== 4. Oil: USO and XLE options vs realized; ^OVX vs forward realized; USO model payoffs')
uso, ovx, xle, cl = yh('USO'), yh('_OVX'), yh('XLE'), yh('CL_F')


def rv(series, end, n):
    d = [x for x in sorted(series) if x <= end]
    c = np.array([series[x] for x in d[-(n + 1):]])
    return np.diff(np.log(c)).std(ddof=1) * SQ(252)


for nm, s in (('USO', uso), ('XLE', xle)):
    print(f'  {nm}: close 10/30 {s[D_LAST]:.2f}; RV20 {rv(s, D_LAST, 20):.1%}, RV60 {rv(s, D_LAST, 60):.1%}, RV250 {rv(s, D_LAST, 250):.1%}')
OVX0 = ovx[D_LAST]
uspot, UQ, uts = chain('USO')
xspot, XQ, xts = chain('XLE')
ua = UQ[occ('USO', date(2026, 11, 27), 'C', 169)]['iv'], UQ[occ('USO', date(2026, 11, 27), 'P', 169)]['iv']
xa = XQ[occ('XLE', date(2026, 11, 27), 'C', 70)]['iv'], XQ[occ('XLE', date(2026, 11, 27), 'P', 70)]['iv']
rv20u = rv(uso, D_LAST, 20)
print(f'  ^OVX 10/30 {OVX0:.2f}; USO 11/27 169 ATM IV call {ua[0]:.3f} put {ua[1]:.3f} (chain {uts}); OVX / RV20 {OVX0 / 100 / rv20u:.2f}; '
      f'ATM IV / RV20 {np.mean(ua) / rv20u:.2f}')
print(f'  XLE 11/27 70 ATM IV call {xa[0]:.3f} put {xa[1]:.3f} (chain {xts}); ATM IV / RV20 {np.mean(xa) / rv(xle, D_LAST, 20):.2f}')
# OVX vs forward realized
ud = [d for d in sorted(uso) if d <= D_LAST]
U = np.array([uso[d] for d in ud])
lr = np.diff(np.log(U))
O = L.ffill_on(ud, ovx, back=False) / 100
fwd, rv20h, ovs, dts = [], [], [], []
for i in range(21, len(ud) - 21):
    if ud[i] < date(2007, 6, 1) or not O[i] == O[i]:
        continue
    fwd.append(lr[i:i + 21].std(ddof=1) * SQ(252))
    rv20h.append(lr[i - 20:i].std(ddof=1) * SQ(252))
    ovs.append(O[i])
    dts.append(ud[i])
fwd, rv20h, ovs = map(np.array, (fwd, rv20h, ovs))
ratio0 = OVX0 / 100 / rv20u
for lab, msk in (('all days 2007-2026', np.ones(len(fwd), bool)),
                 (f'OVX/RV20 >= {ratio0:.2f} (today)', ovs / rv20h >= ratio0),
                 ('OVX/RV20 >= 1.5', ovs / rv20h >= 1.5),
                 ('OVX >= 45', ovs >= 0.45)):
    if msk.sum() == 0:
        print(f'  {lab}: n 0')
        continue
    se = L.nw_se_mean(ovs[msk] - fwd[msk], 42)
    print(f'  {lab}: n {msk.sum()}; OVX {100 * ovs[msk].mean():.1f} vs next-21-session RV {100 * fwd[msk].mean():.1f} '
          f'(OVX higher on {np.mean(ovs[msk] > fwd[msk]):.0%} of days; mean gap {100 * (ovs[msk] - fwd[msk]).mean():+.1f} pts, NW t {(ovs[msk] - fwd[msk]).mean() / se:.1f}); '
          f'forward RV / OVX {np.mean(fwd[msk] / ovs[msk]):.2f}')
# USO 5-session moves, last 250 sessions, vs the 11/6 straddle
k = None
st6 = None
for kk in np.arange(160, 178, 0.5):
    c, p = UQ.get(occ('USO', date(2026, 11, 6), 'C', kk)), UQ.get(occ('USO', date(2026, 11, 6), 'P', kk))
    if c and p and c['bid'] > 0 and p['bid'] > 0 and (k is None or abs(kk - uspot) < abs(k - uspot)):
        k, st6 = kk, (mid(c) + mid(p)) / uspot
last = U[-251:]
m5 = np.abs(last[5:] / last[:-5] - 1)
print(f'  USO 11/6 straddle (K {k}) {st6:.2%} of spot; last 250 sessions ({ud[-251]}..{ud[-1]}): mean |5-session move| {m5.mean():.2%}, '
      f'median {np.median(m5):.2%}, share above the straddle {np.mean(m5 > st6):.0%} -> gross straddle payoff per $ ~{m5.mean() / st6:.2f}')
cd_ = [d for d in sorted(cl) if d <= D_LAST]
C = np.array([cl[d] for d in cd_])[-251:]
rc = C[1:] / C[:-1] - 1
print(f'  CL=F last 250 sessions: days with |move| >= 4%: {np.sum(np.abs(rc) >= 0.04)} ({np.mean(np.abs(rc) >= 0.04):.0%}); '
      f'up >= 4%: {np.sum(rc >= 0.04)}, down <= -4%: {np.sum(rc <= -0.04)}')
# USO model payoffs
mu = ua[0] / (OVX0 / 100), ua[1] / (OVX0 / 100)
RU = L.ffill_on(ud, irx) / 100
OV = np.where(np.isnan(O), np.nan, O)
rv20s = np.array([np.nan] * 21 + [lr[i - 20:i].std(ddof=1) * SQ(252) for i in range(21, len(ud))])
ures = {}
for lab, m, kind in (('call', mu[0], 'C'), ('put', mu[1], 'P')):
    tr = sim(U, OV, RU, ud, m, 0.40, kind, 0.0, 0.05, lambda i: OV[i] == OV[i] and OV[i] > 0)
    ures[lab] = tr
    h = np.array([t[1] for t in tr])
    a = np.array([t[2] for t in tr])
    idx = {d: i for i, d in enumerate(ud)}
    hi = np.array([OV[idx[t[0]]] / rv20s[idx[t[0]]] >= 1.5 for t in tr])
    print(f'  USO {lab} d0.40 m {m:.3f} x OVX, 10% spread: n {len(tr)}; hold 12 EV {h.mean():.3f} (t {(h.mean() - 1) / L.nw_se_mean(h, 24):+.2f}); '
          f'1-contract set {a.mean():.3f} (t {(a.mean() - 1) / L.nw_se_mean(a, 24):+.2f}); when OVX/RV20 >= 1.5 (n {hi.sum()}): '
          f'hold {h[hi].mean():.3f}, set {a[hi].mean():.3f}')
for lab in ures:
    with open(os.path.join(OUT, f'uso_{lab}_payoffs.csv'), 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['date', 'hold12', 'set1'])
        for t in ures[lab]:
            w.writerow([t[0], f'{t[1]:.5f}', f'{t[2]:.5f}'])
# ------------------------------------------------------------------ 5. goal odds (owner's choice)
print('\n== 5. Goal odds: cash vs one SPY call held under the 1-contract exits (model, VIX 16-24 entries)')
tr = res['call']
for lab, lo, hi in (('2010-2026', date(2010, 1, 1), date(2027, 1, 1)), ('2010-2017', date(2010, 1, 1), date(2018, 1, 1)),
                    ('2018-2026', date(2018, 1, 1), date(2027, 1, 1)), ('2022 only', date(2022, 1, 1), date(2023, 1, 1))):
    s = [t for t in tr if lo <= t[0] < hi]
    a = np.array([t[2] for t in s])
    win = a >= 1.5 - 1e-9
    print(f'  {lab}: n {len(s)}; +50% exit reached {win.mean():.0%}; otherwise mean payoff {a[~win].mean():.2f} '
          f'(stopped at -50% {np.mean(a <= 0.5 + 1e-9):.0%}); EV {a.mean():.3f}')
# Cash beats SPY buy-and-hold at the 11/18 close only if SPY falls below 755.72 x (1917.92 / 1970.94)
thr = 1917.92 / 1970.94 - 1
r13 = np.array([S[i + 13] / S[i] - 1 for i in range(len(sd) - 13) if sd[i] >= date(1993, 2, 1)])
v13 = np.array([V[i] for i in range(len(sd) - 13) if sd[i] >= date(1993, 2, 1)])
d13 = [sd[i] for i in range(len(sd) - 13) if sd[i] >= date(1993, 2, 1)]
m10 = np.array([d >= date(2010, 1, 1) for d in d13])
reg13 = (v13 >= 0.16) & (v13 <= 0.24)
print(f'  Cash beats SPY by 11/18 (13 sessions from the 10/30 close) if SPY <= {755.72 * (1 + thr):.2f} ({thr:+.2%}). '
      f'Historical P(13-session SPY return <= {thr:.2%}): 1993-2026 {np.mean(r13 <= thr):.0%}; VIX 16-24 {np.mean(r13[reg13] <= thr):.0%} '
      f'(n {reg13.sum()}); 2010-2026 VIX 16-24 {np.mean(r13[reg13 & m10] <= thr):.0%}')
el_m = [r for r in rows if r['mid']]
print(f'  Midterm weeks only: 5-session straddle payoff {np.mean([r["z5"] for r in el_m]) / zi5:.2f}, '
      f'3-session {np.mean([r["z3"] for r in el_m]) / zi3:.2f} (n {len(el_m)}); reaction-day mean return '
      f'{np.mean([r["r1"] for r in el_m]):+.2%}, up {sum(r["r1"] > 0 for r in el_m)}/{len(el_m)}')
print('\nwritten:', ', '.join(sorted(os.listdir(OUT))))
