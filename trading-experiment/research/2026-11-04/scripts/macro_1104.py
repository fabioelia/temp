"""Macro 11/04 (Run B, the morning after the Democratic sweep): (1) what the SPY chain prices for Thu 11/5 and the Fri 11/6 jobs report,
and how that compares with jobs weeks since 1990; (2) whether a one-day oil drop of 6% or more that comes with FALLING ^VIX and a RISING
^GSPC (a "relief" drop, like today's Iran-peace headlines) carries an edge in USO options entered at Thursday's check, where the
11/02 test (research/2026-11-02/scripts/macro_oil_drop.py) found none across all drops; (3) the circuit-breaker levels for Thu 11/5.
Specification fixed before the first run.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-04/scripts/macro_1104.py <yahoo_dir> <chain_dir> <out_dir>
Inputs: Yahoo v8 daily bars saved by research/2026-11-01/scripts/macro_fetch.py (y_<sym>.json; closes through Wed 11/4/2026) and the
Cboe delayed chains saved by research/2026-11-01/scripts/macro_chains.py (chain_<sym>.json; 11/4 closing quotes). Black-Scholes and
Newey-West helpers come from the strategy review's options_lib.py. Writes per-trade payoff CSVs to <out_dir> for sizing.py.

1. JOBS PRICING. SPY ATM straddle mid (strike nearest the parity-implied spot at the 16:15 quote time) for the 11/5, 11/6, 11/9 and 11/10
   expiries. Implied variance per session = differences of (straddle% / 0.798)^2. Jobs premium = the Fri increment / the Thu increment.
   History (^GSPC 1990-2026): jobs Fridays by the BLS rule used in research/2026-11-01/scripts/macro_week.py (third Friday after the
   week containing the 12th; shutdown and holiday shifts not modelled). z = |return| / (^VIX at the window start / 100 x sqrt(n / 252)).
   * the 2-session window from the Wednesday close before each jobs Friday to the Friday close, against every 2-session window;
   * the jobs Friday alone (1 session), against every session.
   Implied z for the 11/6 straddle = straddle% / (^VIX 11/4 / 100 x sqrt(2 / 252)). Mean realized z / implied z = the straddle's gross
   payoff per $ held to expiry (before spread). Not tradeable under the rules (DTE 2 < 3), so this is pricing context only.
2. OIL, RELIEF DROPS. Events exactly as macro_oil_drop.py: CL=F close-to-close <= -6.0% (prior close >= $10), USO <= -3.0% the same day,
   from 2006-04-11. Pre-registered split by the event day's tape:
   * RELIEF: ^VIX change <= 0 and ^GSPC change > 0 on the event day (today: ^VIX -20.3%, ^GSPC up);
   * SCARE: all other events.
   Entry at the t+1 close (Thu 11/5's 14:43 check, proxied by its close). HOLD_END = 9 sessions (Thu 11/5 close to the Wed 11/18 close).
   a) USO returns from the entry close over h = 1, 3, 5, 9 sessions, Newey-West t (lag h), against every day.
   b) Option payoffs at today's IV: every USO contract on the 11/4 chain with expiry 14-35 days after 11/5, |delta| 0.30-0.45, OI >= 1,000,
      spread <= 10% of mid. Each event path is laid onto S0 = 145.41 (the snapshot's official 11/4 close); IV at exit = the Cboe IV x
      ^OVX[i+k] / ^OVX[i]; cost = BS x (1 + half spread), value = BS x (1 - half spread); r from ^IRX. Exits: hold 5 sessions; hold 9
      (to 11/18); the playbook 1-contract set (all at +50% on a close, -50% backstop on a close, else the 9-session time exit).
      Raw paths (primary) and vol-normalized paths (log moves x today's IV / ^OVX at entry), as in macro_oil_drop.py.
   PASS RULE (fixed now): an oil idea passes only if the RELIEF set1 mean payoff is > 1.00 with Newey-West t >= 2.0 on raw paths and the
   vol-normalized set1 mean is also > 1.00; then sizing.py must give full Kelly >= one contract's cost. Otherwise no trade.
3. CIRCUIT BREAKERS for Thu 11/5: Level 1 / 2 / 3 = 7% / 13% / 20% below the ^GSPC 11/4 close (Rule 7.12 / LULD plan; Level 1 or 2
   before 15:25 ET halts 15 minutes, Level 3 closes the market for the day).
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
TODAY, ENTRY = date(2026, 11, 4), date(2026, 11, 5)
HOLD_END = 9  # sessions from the Thu 11/5 close to the Wed 11/18 close (11/11 is a stock-market trading day)
S0_USO = 145.41  # snapshot official close 11/4 (yahoo+cboe)


def yh(name):
    r = json.load(open(os.path.join(YD, f'y_{name}.json')))['chart']['result'][0]
    out = {}
    for t, c in zip(r['timestamp'], r['indicators']['quote'][0]['close']):
        if c is not None:
            out[datetime.fromtimestamp(t, tz=timezone.utc).date()] = float(c)
    return out


def chain(sym):
    j = json.load(open(os.path.join(CD, f'chain_{sym}.json')))
    return j, {o['option']: o for o in j['data']['options']}


def occ(u, e, cp, k):
    return f'{u}{e:%y%m%d}{cp}{int(round(k * 1000)):08d}'


def mid(o):
    return (o['bid'] + o['ask']) / 2


gs, vix, cl, uso, ovx, irx = yh('_GSPC'), yh('_VIX'), yh('CL_F'), yh('USO'), yh('_OVX'), yh('_IRX')
assert max(gs) == TODAY and max(uso) == TODAY, (max(gs), max(uso))

# ------------------------------------------------------------------ 1. jobs pricing
print('== 1. SPY event pricing, Cboe chain (11/4 closing quotes)')
jS, QS = chain('SPY')
print(f"   chain timestamp {jS.get('timestamp')} UTC; current_price {jS['data']['current_price']} (after hours); close {jS['data']['close']}")
VIX0 = vix[TODAY]
prev_var, incs = 0.0, {}
exps = [(date(2026, 11, 5), 1, 'Thu 11/5'), (date(2026, 11, 6), 2, 'Fri 11/6 (jobs)'), (date(2026, 11, 9), 3, 'Mon 11/9'),
        (date(2026, 11, 10), 4, 'Tue 11/10')]
st_pct = {}
for e, n, lab in exps:
    best = None
    for k in np.arange(740, 800, 1.0):
        c, p = QS.get(occ('SPY', e, 'C', k)), QS.get(occ('SPY', e, 'P', k))
        if c and p and c['bid'] > 0 and p['bid'] > 0:
            fwd = k + mid(c) - mid(p)  # parity-implied spot at the quote time (r x T is negligible over days)
            if best is None or abs(k - fwd) < abs(best[0] - best[3]):
                best = (k, c, p, fwd)
    k, c, p, fwd = best
    st = mid(c) + mid(p) - abs(fwd - k)  # straddle at the forward: remove the intrinsic offset of a strike off the forward
    pct = st / fwd
    var = (pct / 0.798) ** 2
    incs[lab] = var - prev_var
    st_pct[n] = pct
    zimp = pct / (VIX0 / 100 * SQ(n / 252))
    print(f"   {e} ({n} session{'s' if n > 1 else ''} from Wed close, last {lab:16}) K {k:.0f}: C {c['bid']:.2f}/{c['ask']:.2f} "
          f"P {p['bid']:.2f}/{p['ask']:.2f}, implied spot {fwd:.2f}; straddle {st:.2f} = {pct:.2%}; session sd {100 * SQ(max(var - prev_var, 0)):.2f}%; "
          f"z_implied {zimp:.3f}")
    prev_var = var
print(f"   ^VIX 11/4 {VIX0:.2f} -> 1-day 1-sd {VIX0 / SQ(252):.2f}%; Fri jobs increment / Thu increment = "
      f"{incs['Fri 11/6 (jobs)'] / incs['Thu 11/5']:.2f}x")

gd = [d for d in sorted(gs) if date(1990, 1, 2) <= d <= TODAY]
gi = {d: i for i, d in enumerate(gd)}
vx = np.array([vix.get(d, np.nan) for d in gd])


def z_at(i, n):
    if i + n >= len(gd) or not vx[i] == vx[i]:
        return np.nan
    return abs(gs[gd[i + n]] / gs[gd[i]] - 1) / (vx[i] / 100 * SQ(n / 252))


def jobs_day(y, m):
    d12 = date(y, m, 12)
    sat = d12 + timedelta(days=(5 - d12.weekday()) % 7)
    return sat + timedelta(days=6 + 14)


jz1, jz2, jz2_21 = [], [], []
for y in range(1990, 2027):
    for m in range(1, 13):
        d = jobs_day(y, m)
        if d >= TODAY or d not in gi:
            continue
        i = gi[d]
        if gd[i - 2].weekday() != 2:  # the window must start on the Wednesday close (no holiday inside)
            continue
        jz1.append(z_at(i - 1, 1))
        jz2.append(z_at(i - 2, 2))
        if y >= 2021:
            jz2_21.append(z_at(i - 2, 2))
jz1, jz2, jz2_21 = np.array(jz1), np.array(jz2), np.array(jz2_21)
all1 = np.array([z_at(i, 1) for i in range(len(gd) - 1)])
all2 = np.array([z_at(i, 2) for i in range(len(gd) - 2)])
zi2 = st_pct[2] / (VIX0 / 100 * SQ(2 / 252))
print(f"   history: jobs Friday z1 mean {np.nanmean(jz1):.3f} (n {np.sum(~np.isnan(jz1))}) vs all days {np.nanmean(all1):.3f} "
      f"-> {np.nanmean(jz1) / np.nanmean(all1):.2f}x")
print(f"   Wed->Fri jobs windows z2 mean {np.nanmean(jz2):.3f} (n {np.sum(~np.isnan(jz2))}; since 2021 {np.nanmean(jz2_21):.3f}, n "
      f"{len(jz2_21)}) vs all 2-session windows {np.nanmean(all2):.3f}")
pay = jz2 / zi2
se = np.nanstd(pay, ddof=1) / SQ(np.sum(~np.isnan(pay)))
print(f"   11/6 straddle implied z2 {zi2:.3f}; payoff per $ held to expiry {np.nanmean(pay):.3f} (+/- {1.96 * se:.3f}); since 2021 "
      f"{np.nanmean(jz2_21) / zi2:.3f}; all windows {np.nanmean(all2) / zi2:.3f}; share of jobs windows beating the straddle "
      f"{np.nanmean(pay > 1):.0%}")
print("   Rule check: the 11/6 expiry is 1 day from a Thu 11/5 entry (the code refuses < 3 days; the rules want 2-5 weeks). Pricing only.")

# ------------------------------------------------------------------ 3. circuit breakers
g0 = gs[TODAY]
print(f"\n== 3. Circuit breakers for Thu 11/5 from the ^GSPC 11/4 close {g0:.2f}: Level 1 (-7%) {0.93 * g0:.2f}, Level 2 (-13%) "
      f"{0.87 * g0:.2f}, Level 3 (-20%) {0.80 * g0:.2f}")

# ------------------------------------------------------------------ 2. oil relief drops
ud = [d for d in sorted(uso) if d <= TODAY]
U = np.array([uso[d] for d in ud])
O = L.ffill_on(ud, ovx, back=False) / 100
O[~np.array([d in ovx for d in ud])] = np.nan
cld = sorted(cl)
clr = {b: (cl[b] / cl[a] - 1, cl[a]) for a, b in zip(cld[:-1], cld[1:])}
gsd = sorted(gs)
gsr = {b: gs[b] / gs[a] - 1 for a, b in zip(gsd[:-1], gsd[1:])}
vxd = sorted(vix)
vxr = {b: vix[b] / vix[a] - 1 for a, b in zip(vxd[:-1], vxd[1:])}
lu = np.diff(np.log(U))
print(f"\n== 2. Oil. Today: CL=F {cl[TODAY]:.2f} ({clr[TODAY][0]:+.2%}), USO {U[-1]:.2f} ({U[-1] / U[-2] - 1:+.2%}), ^OVX {100 * O[-1]:.2f}, "
      f"^VIX {vxr[TODAY]:+.1%}, ^GSPC {gsr[TODAY]:+.2%} (Yahoo); USO RV20 incl. today {lu[-20:].std(ddof=1) * SQ(252):.1%}, pre-drop "
      f"{lu[-21:-1].std(ddof=1) * SQ(252):.1%}")
ev = []
for i, d in enumerate(ud):
    if i == 0 or d < date(2006, 4, 11) or d not in clr:
        continue
    r, prev = clr[d]
    if r <= -0.06 and prev >= 10 and U[i] / U[i - 1] - 1 <= -0.03:
        ev.append(i)
relief = [i for i in ev if vxr.get(ud[i], np.nan) <= 0 and gsr.get(ud[i], np.nan) > 0]
scare = [i for i in ev if i not in relief]
full = lambda xs: [i for i in xs if i + 1 + HOLD_END < len(ud)]  # noqa: E731
print(f"   events (CL=F <= -6%, USO <= -3%) {len(ev)} incl. today; RELIEF {len(relief)} (full window {len(full(relief))}); SCARE {len(scare)} "
      f"(full window {len(full(scare))}); today is RELIEF: {ev[-1] in relief and ud[ev[-1]] == TODAY}")
print('   RELIEF events (date, CL=F, ^VIX, ^GSPC | USO entry->+5, entry->+9):')
for i in relief:
    f5 = U[i + 6] / U[i + 1] - 1 if i + 6 < len(ud) else float('nan')
    f9 = U[i + 1 + HOLD_END] / U[i + 1] - 1 if i + 1 + HOLD_END < len(ud) else float('nan')
    print(f"     {ud[i]} CL=F {clr[ud[i]][0]:+.1%} VIX {vxr[ud[i]]:+.1%} SPX {gsr[ud[i]]:+.1%} | +5 {f5:+.1%} +9 {f9:+.1%}")

allidx = [i for i in range(len(ud) - 1 - HOLD_END) if ud[i] >= date(2006, 4, 11)]
print('   a) USO returns from the t+1 close')
for lab, evs in (('RELIEF', full(relief)), ('SCARE', full(scare)), ('all events', full(ev))):
    parts = []
    for h in (1, 3, 5, HOLD_END):
        r = np.array([U[i + 1 + h] / U[i + 1] - 1 for i in evs])
        t = r.mean() / L.nw_se_mean(r, h) if len(r) > 2 else float('nan')
        parts.append(f"h{h}: {r.mean():+.2%} up {np.mean(r > 0):.0%} t {t:+.2f}")
    print(f"     {lab:10} n {len(evs):3d} | " + ' | '.join(parts))
base = [f"h{h}: {np.mean([U[i + h] / U[i] - 1 for i in allidx]):+.2%}" for h in (1, 3, 5, HOLD_END)]
print(f"     {'every day':10} n {len(allidx):4d} | " + ' | '.join(base))

r0 = irx[max(d for d in irx if d <= TODAY)] / 100
jU, QU = chain('USO')
print(f"   b) option payoffs per $ at today's IV (Cboe USO chain {jU.get('timestamp')} UTC, close {jU['data']['close']}; r {r0:.4f})")
elig = []
for s, o in QU.items():
    e = date(2000 + int(s[3:5]), int(s[5:7]), int(s[7:9]))
    b, a = o.get('bid') or 0.0, o.get('ask') or 0.0
    if b <= 0:
        continue
    dte = (e - ENTRY).days
    if 14 <= dte <= 35 and 0.30 <= abs(o.get('delta') or 0) <= 0.45 and (o.get('open_interest') or 0) >= 1000 and (a - b) / ((a + b) / 2) <= 0.10:
        elig.append((e, s[-9], int(s[-8:]) / 1000, s, b, a, o['iv'], o['delta'], int(o['open_interest'])))
elig.sort()
print(f"     eligible contracts (expiry 14-35 days after 11/5): {len(elig)}")


def ovx_ratio(i, k):
    a, b = O[i], O[i + k]
    return b / a if (a == a and b == b and a > 0) else 1.0


def sim(starts, K, e, iv0, kind, sp, norm):
    out = []
    T0 = (e - ENTRY).days / 365
    cost = float(L.bs(S0_USO, K, T0, iv0, r0, 0.0, kind)) * (1 + sp / 2)
    for i in starts:
        if norm:
            if not O[i] == O[i]:
                continue
            path = S0_USO * np.exp(iv0 / O[i] * np.log(U[i:i + HOLD_END + 1] / U[i]))
        else:
            path = S0_USO * U[i:i + HOLD_END + 1] / U[i]
        vals = []
        for k in range(1, HOLD_END + 1):
            Tk = T0 - (ud[i + k] - ud[i]).days / 365
            vals.append(float(L.bs(path[k], K, max(Tk, 0.0), iv0 * ovx_ratio(i, k), r0, 0.0, kind)) * (1 - sp / 2) / cost)
        s1 = vals[-1]
        for v in vals:
            if v >= 1.5:
                s1 = 1.5
                break
            if v <= 0.5:
                s1 = v
                break
        out.append((ud[i], vals[4], vals[-1], s1))
    return out, cost


def line(tr, lab):
    if len(tr) < 3:
        return f"{lab}: n {len(tr)}"
    h5, h9, s1 = (np.array([t[j] for t in tr]) for j in (1, 2, 3))
    t5 = (h5.mean() - 1) / L.nw_se_mean(h5, 5)
    t9 = (h9.mean() - 1) / L.nw_se_mean(h9, HOLD_END)
    t1 = (s1.mean() - 1) / L.nw_se_mean(s1, HOLD_END)
    return (f"{lab}: n {len(tr):4d}; hold5 {h5.mean():.3f} (t {t5:+.2f}); hold9 {h9.mean():.3f} (t {t9:+.2f}); set1 {s1.mean():.3f} "
            f"(t {t1:+.2f}), +50% hit {np.mean(s1 >= 1.5 - 1e-9):.0%}")


rel_e, sc_e = [i + 1 for i in full(relief)], [i + 1 for i in full(scare)]
base_e = [i for i in allidx if O[i] == O[i]]
verdict = []
for e, kind, K, s, b, a, iv, dl, oi in elig:
    sp = (a - b) / ((a + b) / 2)
    print(f"\n     {s} {b:.2f}/{a:.2f} (spread {sp:.1%}) iv {iv:.3f} delta {dl:+.2f} oi {oi}; DTE at entry {(e - ENTRY).days}")
    res = {}
    for norm in (False, True):
        tag = 'vol-normalized' if norm else 'raw paths'
        tr, cost = sim(rel_e, K, e, iv, kind, sp, norm)
        trs, _ = sim(sc_e, K, e, iv, kind, sp, norm)
        bl, _ = sim(base_e, K, e, iv, kind, sp, norm)
        print(f"       [{tag}] model cost/share {cost:.2f}")
        for x, lab in ((tr, 'RELIEF   '), (trs, 'SCARE    '), (bl, 'every day')):
            print('         ' + line(x, lab))
        res[norm] = tr
        with open(os.path.join(OUT, f"{s}_relief_{'norm' if norm else 'raw'}.csv"), 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(['date', 'hold5', 'hold9', 'set1'])
            for t in tr:
                w.writerow([t[0], f'{t[1]:.5f}', f'{t[2]:.5f}', f'{t[3]:.5f}'])
    s1r = np.array([t[3] for t in res[False]])
    s1n = np.array([t[3] for t in res[True]])
    tr_ = (s1r.mean() - 1) / L.nw_se_mean(s1r, HOLD_END) if len(s1r) > 2 else float('nan')
    ok = len(s1r) > 2 and s1r.mean() > 1 and tr_ >= 2.0 and s1n.mean() > 1
    verdict.append((s, s1r.mean(), tr_, s1n.mean(), ok))
print('\n   PASS RULE (RELIEF set1 raw > 1.00 with t >= 2.0 and vol-normalized set1 > 1.00):')
for s, m, t, mn, ok in verdict:
    print(f"     {s}: raw {m:.3f} (t {t:+.2f}), normalized {mn:.3f} -> {'PASS (size with sizing.py)' if ok else 'fail'}")
