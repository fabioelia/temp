"""Macro 11/05 (Run B, the day after the AI-stock rout: ^GSPC -4.36%, ^VIX 28.18, ^VIX9D 32.66 > ^VIX3M 25.55). Questions:
(1) was the rout a broad credit scare? (2) what does the SPY chain price for the Fri 11/6 jobs report? (3) is there an index-option edge after a
4%+ ^GSPC down day with an inverted VIX term structure, entered at Friday's 14:43 check? (4) circuit-breaker levels for Fri 11/6.
Specification fixed before the first run.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-05/scripts/macro_1105.py <yahoo_dir> <chain_dir> <fred_csv> <out_dir>
Inputs: Yahoo v8 daily bars saved by research/2026-11-01/scripts/macro_fetch.py (y_<sym>.json for ^GSPC ^VIX ^VIX9D ^VIX3M ^IRX SPY HYG;
closes through Thu 11/5/2026); the Cboe delayed SPY chain saved by research/2026-11-01/scripts/macro_chains.py (11/5 closing quotes);
FRED BAMLH0A0HYM2 (fredgraph.csv). Black-Scholes and Newey-West helpers come from the strategy review's options_lib.py.
Writes per-trade payoff CSVs to <out_dir> for sizing.py.

1. CREDIT (descriptive). HYG and SPY 11/5 close-to-close returns. HYG-on-SPY OLS beta over the 250 sessions ending 11/4; today's HYG residual
   (HYG return - alpha - beta x SPY return) in residual-sd units. HY OAS latest value and its percentile among the last 250 observations.
2. JOBS PRICING (context only; DTE 1 < 3, not tradeable). SPY ATM straddle (strike nearest the parity-implied forward; straddle at the forward =
   C mid + P mid - |fwd - K|) for the 11/6, 11/9, 11/10, 11/13 and 11/20 expiries; implied % = straddle / fwd; per-session implied sd from the
   variance increments of (pct / 0.798)^2. History: jobs Fridays since 1990 by the BLS rule in macro_1104.py, 1-session
   z1 = |Fri return| / (^VIX Thu close / 100 / sqrt(252)); implied z for the 11/6 straddle = pct / (^VIX 11/5 / 100 / sqrt(252));
   payoff per $ held to expiry (before spread) = mean z1 / implied z. Also the subset whose Thursday ^VIX close was >= 25.
3. POST-CRASH TEST. Event day t: ^GSPC close-to-close <= -4.0%.
   PRIMARY set: ^VIX9D close > ^VIX3M close on day t (sample from 2011-01-04, the first ^VIX9D bar).
   SECONDARY set: ^VIX close > ^VIX3M close on day t (sample from the first ^VIX3M bar).
   Entry at the t+1 close (Fri 11/6's 14:43 check, proxied by its close). HOLD_END = 8 sessions (Fri 11/6 close to the Wed 11/18 close).
   Episodes: an event within 10 sessions of the previous event joins its episode; the EPISODE set keeps the first event of each PRIMARY episode.
   a) ^GSPC return t -> t+1 (the Friday move) and from the entry close over h = 1, 3, 5, 8 sessions, Newey-West t (lag h), vs every day since 2011.
   b) Option payoffs at today's IV. Contracts: for each Friday expiry 11/20, 11/27, 12/04, 12/11 (14-35 days after 11/6) and each of C and P, the
      contract on the 11/5 chain with |delta| nearest 0.375 among those with |delta| 0.30-0.45, OI >= 1,000 and spread <= 5% of mid.
      Each ^GSPC path from the entry close is laid onto S0 = 733.00 (the snapshot's official SPY 11/5 close); IV at day k = the Cboe IV x
      ^VIX[i+k] / ^VIX[i]; cost = BS x (1 + half spread), value = BS x (1 - half spread); r from ^IRX; q = 0 (no SPY ex-dividend before 12/11).
      Exits: hold 5; hold 8 (to 11/18); set1 = the playbook 1-contract rule (all at +50% on a close, capped at 1.50; the -50% backstop on a
      close; else the 8-session time exit). Raw paths (primary) and vol-normalized paths (log moves x contract IV / (^VIX[i] / 100)).
   PASS RULE (fixed now): a contract passes only if (i) the PRIMARY set1 raw mean > 1.00 with Newey-West t (lag 8) >= 2.0, (ii) the PRIMARY
   vol-normalized set1 mean > 1.00, (iii) the EPISODE set1 raw mean > 1.00 and (iv) the SECONDARY set1 raw mean > 1.00; then sizing.py must
   give full Kelly >= one contract's cost (equity 1,384.84). Otherwise no trade. Eight contracts are tested, so one pass is weak evidence.
4. CIRCUIT BREAKERS for Fri 11/6: Level 1 / 2 / 3 = 7% / 13% / 20% below the ^GSPC 11/5 close (Level 1 or 2 before 15:25 ET halts 15 minutes;
   Level 3 closes the market for the day).
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

YD, CD, FRED, OUT = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
os.makedirs(OUT, exist_ok=True)
SQ = math.sqrt
TODAY, ENTRY = date(2026, 11, 5), date(2026, 11, 6)
HOLD_END = 8
S0 = 733.00
EQUITY = 1384.84


def yh(name):
    r = json.load(open(os.path.join(YD, f'y_{name}.json')))['chart']['result'][0]
    out = {}
    for t, c in zip(r['timestamp'], r['indicators']['quote'][0]['close']):
        if c is not None:
            out[datetime.fromtimestamp(t, tz=timezone.utc).date()] = float(c)
    return out


def occ(u, e, cp, k):
    return f'{u}{e:%y%m%d}{cp}{int(round(k * 1000)):08d}'


def mid(o):
    return (o['bid'] + o['ask']) / 2


gs, vix, v9, v3, irx, spy, hyg = (yh(s) for s in ('_GSPC', '_VIX', '_VIX9D', '_VIX3M', '_IRX', 'SPY', 'HYG'))
for s, x in (('^GSPC', gs), ('^VIX', vix), ('^VIX9D', v9), ('^VIX3M', v3), ('SPY', spy), ('HYG', hyg)):
    assert max(x) == TODAY, (s, max(x))
print(f"Today (Yahoo): ^GSPC {gs[TODAY]:.2f}, ^VIX {vix[TODAY]:.2f}, ^VIX9D {v9[TODAY]:.2f}, ^VIX3M {v3[TODAY]:.2f}, SPY {spy[TODAY]:.2f}, "
      f"HYG {hyg[TODAY]:.2f}")

# ------------------------------------------------------------------ 1. credit
print('\n== 1. Credit')
cd = sorted(set(spy) & set(hyg))
rs = np.array([spy[b] / spy[a] - 1 for a, b in zip(cd[:-1], cd[1:])])
rh = np.array([hyg[b] / hyg[a] - 1 for a, b in zip(cd[:-1], cd[1:])])
assert cd[-1] == TODAY
xs, ys = rs[-251:-1], rh[-251:-1]
beta, alpha = np.polyfit(xs, ys, 1)
res = ys - (alpha + beta * xs)
pred = alpha + beta * rs[-1]
print(f"   SPY {rs[-1]:+.2%}, HYG {rh[-1]:+.2%} (Yahoo closes 11/4 -> 11/5). HYG-on-SPY beta {beta:.3f} (250 sessions to 11/4) -> expected "
      f"{pred:+.2%}; residual {rh[-1] - pred:+.2%} = {(rh[-1] - pred) / res.std(ddof=2):+.1f} sd (positive = HYG held up better than beta)")
fr = [r for r in csv.reader(open(FRED))][1:]
oas = [(d, float(x)) for d, x in fr if x not in ('', '.')]
last250 = np.array([x for _, x in oas[-250:]])
print(f"   HY OAS (FRED BAMLH0A0HYM2) latest {oas[-1][0]} {oas[-1][1]:.2f}%; percentile in the last {len(last250)} obs "
      f"{np.mean(last250 <= oas[-1][1]):.0%}; range {last250.min():.2f}-{last250.max():.2f}; prior 5: "
      + ', '.join(f"{d} {x:.2f}" for d, x in oas[-6:-1]))

# ------------------------------------------------------------------ 2. jobs pricing
print('\n== 2. SPY event pricing, Cboe chain (11/5 closing quotes)')
jS = json.load(open(os.path.join(CD, 'chain_SPY.json')))
QS = {o['option']: o for o in jS['data']['options']}
print(f"   chain timestamp {jS.get('timestamp')} UTC; current_price {jS['data']['current_price']} (after hours); close {jS['data']['close']}")
VIX0 = vix[TODAY]
prev_var, prev_n, pct6 = 0.0, 0, None
for e, n, lab in ((date(2026, 11, 6), 1, 'Fri 11/6 (jobs)'), (date(2026, 11, 9), 2, 'Mon 11/9'), (date(2026, 11, 10), 3, 'Tue 11/10 (CPI?)'),
                  (date(2026, 11, 13), 6, 'Fri 11/13'), (date(2026, 11, 20), 11, 'Fri 11/20')):
    best = None
    for k in np.arange(690, 780, 1.0):
        c, p = QS.get(occ('SPY', e, 'C', k)), QS.get(occ('SPY', e, 'P', k))
        if c and p and c['bid'] > 0 and p['bid'] > 0:
            fwd = k + mid(c) - mid(p)
            if best is None or abs(k - fwd) < abs(best[0] - best[3]):
                best = (k, c, p, fwd)
    if best is None:
        print(f"   {e}: no two-sided ATM quotes")
        continue
    k, c, p, fwd = best
    st = mid(c) + mid(p) - abs(fwd - k)
    pct = st / fwd
    var = (pct / 0.798) ** 2
    inc = (var - prev_var) / (n - prev_n)
    if n == 1:
        pct6 = pct
    print(f"   {e} ({n:2d} session{'s' if n > 1 else ' '}, {lab:16}) K {k:.0f}: C {c['bid']:.2f}/{c['ask']:.2f} P {p['bid']:.2f}/{p['ask']:.2f}, "
          f"implied spot {fwd:.2f}; straddle {st:.2f} = {pct:.2%}; per-session sd in this leg {100 * SQ(max(inc, 0)):.2f}%; "
          f"annualized {100 * SQ(max(inc, 0) * 252):.1f}")
    prev_var, prev_n = var, n
gd = [d for d in sorted(gs) if date(1990, 1, 2) <= d <= TODAY]
gi = {d: i for i, d in enumerate(gd)}
G = np.array([gs[d] for d in gd])
VX = np.array([vix.get(d, np.nan) for d in gd])


def jobs_day(y, m):
    d12 = date(y, m, 12)
    sat = d12 + timedelta(days=(5 - d12.weekday()) % 7)
    return sat + timedelta(days=6 + 14)


jz, jzh = [], []
for y in range(1990, 2027):
    for m in range(1, 13):
        d = jobs_day(y, m)
        if d >= TODAY or d not in gi:
            continue
        i = gi[d]
        if gd[i - 1].weekday() != 3 or VX[i - 1] != VX[i - 1]:
            continue
        z = abs(G[i] / G[i - 1] - 1) / (VX[i - 1] / 100 / SQ(252))
        jz.append(z)
        if VX[i - 1] >= 25:
            jzh.append(z)
jz, jzh = np.array(jz), np.array(jzh)
allz = np.array([abs(G[i + 1] / G[i] - 1) / (VX[i] / 100 / SQ(252)) for i in range(len(gd) - 1) if VX[i] == VX[i]])
zi = pct6 / (VIX0 / 100 / SQ(252))
print(f"   ^VIX 11/5 {VIX0:.2f} -> 1-day 1-sd {VIX0 / SQ(252):.2f}%; 11/6 straddle implied z {zi:.3f} (a fair straddle on a ^VIX-sized day "
      f"is 0.798)")
print(f"   jobs Fridays z1 mean {jz.mean():.3f} (n {len(jz)}), Thursday ^VIX >= 25: {jzh.mean():.3f} (n {len(jzh)}); all days {allz.mean():.3f}")
print(f"   payoff per $ of the 11/6 straddle held to expiry (before spread): all jobs Fridays {jz.mean() / zi:.3f} "
      f"(+/- {1.96 * jz.std(ddof=1) / SQ(len(jz)) / zi:.3f}); VIX>=25 subset {jzh.mean() / zi:.3f}; share beating it {np.mean(jz > zi):.0%}")
print("   Rule check: 11/6 is 1 day from an 11/5 decision (the rules want 2-5 weeks, never under 3 days). Pricing context only.")

# ------------------------------------------------------------------ 4. circuit breakers
g0 = gs[TODAY]
print(f"\n== 4. Circuit breakers for Fri 11/6 from the ^GSPC 11/5 close {g0:.2f}: Level 1 (-7%) {0.93 * g0:.2f}, Level 2 (-13%) "
      f"{0.87 * g0:.2f}, Level 3 (-20%) {0.80 * g0:.2f}; SPY equivalents ~{0.93 * S0:.2f} / {0.87 * S0:.2f} / {0.80 * S0:.2f}")

# ------------------------------------------------------------------ 3. post-crash test
print('\n== 3. Post-crash test (^GSPC <= -4.0% on day t, entry at the t+1 close, 8-session hold)')
d0 = min(v3)
td = [d for d in gd if d >= d0]
ti = {d: i for i, d in enumerate(td)}
P = np.array([gs[d] for d in td])
V = np.array([vix.get(d, np.nan) for d in td])
V9 = np.array([v9.get(d, np.nan) for d in td])
V3 = np.array([v3.get(d, np.nan) for d in td])
ret = np.r_[np.nan, P[1:] / P[:-1] - 1]
ev_all = [i for i in range(1, len(td)) if ret[i] <= -0.04]
prim = [i for i in ev_all if td[i] >= date(2011, 1, 4) and V9[i] == V9[i] and V3[i] == V3[i] and V9[i] > V3[i]]
sec = [i for i in ev_all if V[i] == V[i] and V3[i] == V3[i] and V[i] > V3[i]]
print(f"   ^VIX3M sample from {d0}; ^GSPC <= -4% days {len(ev_all)} (incl. today); PRIMARY (VIX9D > VIX3M, 2011+) {len(prim)}; "
      f"SECONDARY (VIX > VIX3M) {len(sec)}")
ep, last = [], -99
for i in prim:
    if i - last > 10:
        ep.append(i)
    last = i
full = lambda xs: [i for i in xs if i + 1 + HOLD_END < len(td)]  # noqa: E731
print(f"   PRIMARY episodes {len(ep)}; with a full window: PRIMARY {len(full(prim))}, EPISODE {len(full(ep))}, SECONDARY {len(full(sec))}")
print('   PRIMARY events (date, ^GSPC, ^VIX, VIX9D/VIX3M | t->t+1, entry->+5, entry->+8):')
for i in prim:
    a = P[i + 1] / P[i] - 1 if i + 1 < len(td) else float('nan')
    f5 = P[i + 6] / P[i + 1] - 1 if i + 6 < len(td) else float('nan')
    f8 = P[i + 1 + HOLD_END] / P[i + 1] - 1 if i + 1 + HOLD_END < len(td) else float('nan')
    print(f"     {td[i]} {ret[i]:+.1%} VIX {V[i]:.1f} ratio {V9[i] / V3[i]:.2f}{' *ep' if i in ep else ''} | t+1 {a:+.1%} +5 {f5:+.1%} +8 {f8:+.1%}")

base_i = [i for i in range(len(td) - 1 - HOLD_END) if td[i] >= date(2011, 1, 4)]
print('   a) ^GSPC returns')
for lab, evs in (('PRIMARY', full(prim)), ('EPISODE', full(ep)), ('SECONDARY', full(sec))):
    t1 = np.array([P[i + 1] / P[i] - 1 for i in evs])
    parts = [f"t->t+1 {t1.mean():+.2%} up {np.mean(t1 > 0):.0%}"]
    for h in (1, 3, 5, HOLD_END):
        r = np.array([P[i + 1 + h] / P[i + 1] - 1 for i in evs])
        t = r.mean() / L.nw_se_mean(r, h) if len(r) > 2 else float('nan')
        parts.append(f"h{h}: {r.mean():+.2%} up {np.mean(r > 0):.0%} t {t:+.2f}")
    print(f"     {lab:9} n {len(evs):3d} | " + ' | '.join(parts))
print(f"     {'every day':9} n {len(base_i):4d} | " + ' | '.join(f"h{h}: {np.mean([P[i + h] / P[i] - 1 for i in base_i]):+.2%}"
                                                          for h in (1, 3, 5, HOLD_END)))

r0 = irx[max(d for d in irx if d <= TODAY)] / 100
print(f"   b) option payoffs per $ at today's IV (S0 {S0}; r {r0:.4f}; q 0)")
picks = []
for e in (date(2026, 11, 20), date(2026, 11, 27), date(2026, 12, 4), date(2026, 12, 11)):
    for kind in ('C', 'P'):
        cands = []
        for s, o in QS.items():
            if not s.startswith(f"SPY{e:%y%m%d}{kind}"):
                continue
            b, a = o.get('bid') or 0.0, o.get('ask') or 0.0
            if b <= 0:
                continue
            dl = o.get('delta') or 0.0
            if 0.30 <= abs(dl) <= 0.45 and (o.get('open_interest') or 0) >= 1000 and (a - b) / ((a + b) / 2) <= 0.05:
                cands.append((abs(abs(dl) - 0.375), s, e, kind, int(s[-8:]) / 1000, b, a, o['iv'], dl, int(o['open_interest'])))
        print(f"     {e} {kind}: {len(cands)} eligible")
        if cands:
            picks.append(min(cands)[1:])


def sim(starts, K, e, iv0, kind, sp, norm):
    starts = [i for i in starts if V[i] == V[i] and all(V[i + k] == V[i + k] for k in range(HOLD_END + 1))]
    if not starts:
        return [], float('nan')
    idx = np.array(starts)
    T0 = (e - ENTRY).days / 365
    cost = float(L.bs(S0, K, T0, iv0, r0, 0.0, kind)) * (1 + sp / 2)
    seg = np.stack([P[idx + k] for k in range(HOLD_END + 1)], axis=1)
    if norm:
        seg = S0 * np.exp((iv0 / (V[idx] / 100))[:, None] * np.log(seg / seg[:, :1]))
    else:
        seg = S0 * seg / seg[:, :1]
    vals = np.empty((len(idx), HOLD_END))
    for k in range(1, HOLD_END + 1):
        Tk = np.array([T0 - (td[i + k] - td[i]).days / 365 for i in idx])
        vals[:, k - 1] = L.bs(seg[:, k], K, np.maximum(Tk, 0.0), iv0 * V[idx + k] / V[idx], r0, 0.0, kind) * (1 - sp / 2) / cost
    out = []
    for j, i in enumerate(idx):
        s1 = vals[j, -1]
        for v in vals[j]:
            if v >= 1.5:
                s1 = 1.5
                break
            if v <= 0.5:
                s1 = v
                break
        out.append((td[i], vals[j, 4], vals[j, -1], s1))
    return out, cost


def stats(tr):
    if len(tr) < 3:
        return None
    h5, h8, s1 = (np.array([t[j] for t in tr]) for j in (1, 2, 3))
    return dict(n=len(tr), h5=h5.mean(), t5=(h5.mean() - 1) / L.nw_se_mean(h5, 5), h8=h8.mean(), t8=(h8.mean() - 1) / L.nw_se_mean(h8, HOLD_END),
                s1=s1.mean(), ts1=(s1.mean() - 1) / L.nw_se_mean(s1, HOLD_END), hit=np.mean(s1 >= 1.5 - 1e-9), lose=np.mean(s1 <= 0.5))


def line(st, lab):
    if st is None:
        return f"{lab}: n < 3"
    return (f"{lab}: n {st['n']:4d}; hold5 {st['h5']:.3f} (t {st['t5']:+.2f}); hold8 {st['h8']:.3f} (t {st['t8']:+.2f}); set1 {st['s1']:.3f} "
            f"(t {st['ts1']:+.2f}), +50% hit {st['hit']:.0%}, -50% {st['lose']:.0%}")


ent = lambda xs: [i + 1 for i in full(xs)]  # noqa: E731
verdict = []
for s, e, kind, K, b, a, iv, dl, oi in picks:
    sp = (a - b) / ((a + b) / 2)
    print(f"\n     {s} {b:.2f}/{a:.2f} (spread {sp:.1%}) iv {iv:.3f} delta {dl:+.3f} oi {oi}; DTE at entry {(e - ENTRY).days}")
    got = {}
    for norm in (False, True):
        tag = 'vol-normalized' if norm else 'raw paths'
        rows = {}
        for lab, xs in (('PRIMARY  ', ent(prim)), ('EPISODE  ', ent(ep)), ('SECONDARY', ent(sec)), ('every day', base_i)):
            tr, cost = sim(xs, K, e, iv, kind, sp, norm)
            rows[lab.strip()] = (tr, stats(tr))
        print(f"       [{tag}] model cost/share {cost:.2f}")
        for lab, (tr, st) in rows.items():
            print('         ' + line(st, f"{lab:9}"))
        got[norm] = rows
        tr = rows['PRIMARY'][0]
        with open(os.path.join(OUT, f"{s}_primary_{'norm' if norm else 'raw'}.csv"), 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(['date', 'hold5', 'hold8', 'set1'])
            for t in tr:
                w.writerow([t[0], f'{t[1]:.5f}', f'{t[2]:.5f}', f'{t[3]:.5f}'])
    pr, pn = got[False]['PRIMARY'][1], got[True]['PRIMARY'][1]
    eps, se_ = got[False]['EPISODE'][1], got[False]['SECONDARY'][1]
    ok = bool(pr and pn and eps and se_ and pr['s1'] > 1 and pr['ts1'] >= 2.0 and pn['s1'] > 1 and eps['s1'] > 1 and se_['s1'] > 1)
    verdict.append((s, a, pr, pn, eps, se_, ok))
print('\n   PASS RULE ((i) PRIMARY set1 raw > 1.00 with t >= 2.0; (ii) PRIMARY normalized > 1.00; (iii) EPISODE raw > 1.00; (iv) SECONDARY raw > 1.00):')
for s, a, pr, pn, eps, se_, ok in verdict:
    f = lambda st: f"{st['s1']:.3f}" if st else 'n/a'  # noqa: E731
    print(f"     {s} ask {a:.2f}: primary {f(pr)} (t {pr['ts1'] if pr else float('nan'):+.2f}), normalized {f(pn)}, episode {f(eps)}, "
          f"secondary {f(se_)} -> {'PASS (size with sizing.py)' if ok else 'fail'}")
