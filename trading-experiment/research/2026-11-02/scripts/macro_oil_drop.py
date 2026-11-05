"""Macro 11/02: does buying USO or XLE options after a one-day oil drop of 6% or more carry a measured edge?
Specification fixed before the first run.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-02/scripts/macro_oil_drop.py <yahoo_dir> <chain_dir> <out_dir>
Inputs: Yahoo v8 daily bars saved by research/2026-11-01/scripts/macro_fetch.py (y_<sym>.json, closes through Mon 11/2/2026) and the
Cboe delayed chains saved by research/2026-11-01/scripts/macro_chains.py (chain_<sym>.json, 11/2 closing quotes). Black-Scholes and
Newey-West helpers come from the strategy review's options_lib.py. Writes per-trade payoff CSVs to <out_dir> for sizing.py.

EVENT: CL=F (Yahoo continuous front month) close-to-close return <= -6.0% on day t, from 2006-04-11 (USO's first full day), with
  (a) the prior CL=F close >= $10 (drops April 2020's negative-price days) and (b) USO's same-day return <= -3.0% (drops roll artifacts
  in the continuous CL=F series; USO holds and rolls the front month itself). Today, Mon 11/2, qualifies (CL=F -7.5%, USO -7.1%).
  De-clustered variant: only events with no other event in the previous 10 sessions.
ENTRY: the close of t+1 (the next session's 14:43 check, proxied by its close; the event day is Mon 11/2, so the entry is Tue 11/3).
  An entry at the t close (no longer available) is shown for reference.
1. UNDERLYING BASE RATES. USO and XLE returns from the entry close over h = 1, 3, 5 and 11 sessions (11 = Tue 11/3 to the 11/18 window
   end): mean, share up, Newey-West t (lag h), against every day in the same span.
2. VOL PREMIUM AFTER DROPS. ^OVX at the entry close against USO's realized vol over the next 11 and 21 sessions.
3. OPTION EV PER $ AT TODAY'S IV. Every USO contract on the 11/2 chain that passes the contract rules (|delta| 0.30-0.45, OI >= 1,000,
   spread <= 10% of mid) with expiry 14-35 days after the 11/3 entry; primary = the 11/27 call and put (in band under the 21-35 DTE reading
   used on 11/01 as well). Each event path is laid onto today's close (snapshot USO 156.87): S_k = S0 x U[i+k] / U[i].
   * IV at entry = the contract's Cboe IV; IV at exit = that IV x ^OVX[i+k] / ^OVX[i] (the event's own vol change is carried over).
   * Cost = BS(S0) x (1 + half the quoted relative spread); value = BS(S_k) x (1 - half spread). r = ^IRX at 11/2, no dividend.
   * Raw paths (primary) and vol-normalized paths (log returns x today's IV / ^OVX[i], i.e. the event's move in units of its own implied
     vol, re-expressed at today's implied vol; removes the bias from events that sat in 80-100% vol regimes).
   * Exits: hold 5 sessions; hold to the window end (11 sessions); the playbook 1-contract set (sell all at +50% on a close, -50% backstop
     on a close, else the 11-session time exit). Underlying-level stops are not modelled.
   * Baseline: the same model entered at every USO close with an ^OVX value, 2007-2026 (the unconditional payoff).
   XLE: no contract passes the rules on the 11/2 chain (spreads 22-200%); a hypothetical 11/27 0.40-delta call and put at the chain's ATM
   IV with a 10% spread (the rule's maximum) is modelled on raw paths at constant IV, conditional and unconditional.
POST HOC (added after the first run, so it cannot count as evidence): the 11/27 primary contracts on events since 2025-01-01 and since
2026-01-01 (the Hormuz-war regime), and the puts without the 2008 and 2020 events (a robustness check of the hold-to-window figure).
Descriptive and model results, not a claim test: nothing here is pre-registered in research/strategy-review/claims.md.
"""
import csv
import json
import math
import os
import sys
from datetime import date, datetime, timezone

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import options_lib as L  # noqa: E402

YD, CD, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
SQ = math.sqrt
TODAY, ENTRY = date(2026, 11, 2), date(2026, 11, 3)
HOLD_END = 11  # sessions from the Tue 11/3 close to the Wed 11/18 close
S0_USO, S0_XLE = 156.87, 67.25  # snapshot official closes 11/2 (yahoo+cboe)


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


cl, uso, xle, ovx, irx, bz = yh('CL_F'), yh('USO'), yh('XLE'), yh('_OVX'), yh('_IRX'), yh('BZ_F')
ud = [d for d in sorted(uso) if d <= TODAY]
assert ud[-1] == TODAY, ud[-1]
U = np.array([uso[d] for d in ud])
X = L.ffill_on(ud, xle)
C = L.ffill_on(ud, cl, back=False)
O = L.ffill_on(ud, ovx, back=False) / 100
ovx_ok = np.array([d in ovx for d in ud])
O[~ovx_ok] = np.nan  # no forward-filled OVX on days it did not print
idx = {d: i for i, d in enumerate(ud)}
# CL=F returns on USO dates, from consecutive CL=F prints only
cld = sorted(cl)
clr = {}
for a, b in zip(cld[:-1], cld[1:]):
    clr[b] = (cl[b] / cl[a] - 1, cl[a])
lu = np.diff(np.log(U))
r_today = clr[TODAY][0]
print(f"== Today ({TODAY}): CL=F {cl[TODAY]:.2f} ({r_today:+.2%}), Brent BZ=F {bz[TODAY]:.2f} (Yahoo's prior BZ=F bar is the expired Dec "
      f"contract, so no change is computed here; the snapshot's Jan-on-Jan figure is -8.1%), "
      f"USO {U[-1]:.2f} ({U[-1] / U[-2] - 1:+.2%}), XLE {X[-1]:.2f} ({X[-1] / X[-2] - 1:+.2%}), ^OVX {100 * O[-1]:.2f} (Yahoo)")
rv20 = lu[-20:].std(ddof=1) * SQ(252)
rv20_pre = lu[-21:-1].std(ddof=1) * SQ(252)
print(f"   USO RV20 incl. today {rv20:.1%} (pre-drop {rv20_pre:.1%}); ^OVX / RV20 {O[-1] / rv20:.2f}")

# ------------------------------------------------------------------ events
ev = []
for i, d in enumerate(ud):
    if i == 0 or d < date(2006, 4, 11) or d not in clr:
        continue
    r, prev = clr[d]
    ur = U[i] / U[i - 1] - 1
    if r <= -0.06 and prev >= 10 and ur <= -0.03:
        ev.append(i)
evd = []
for i in ev:
    if not any(0 < i - j <= 10 for j in ev):
        evd.append(i)
hist = [i for i in ev if i + 1 + HOLD_END < len(ud)]  # events with a complete forward window
histd = [i for i in evd if i + 1 + HOLD_END < len(ud)]
print(f"\n== Events: CL=F <= -6% with USO <= -3% the same day, 2006-04-11..{TODAY}: {len(ev)} (incl. today); de-clustered (none in the "
      f"prior 10 sessions) {len(evd)}; with a full {HOLD_END}-session window {len(hist)} / {len(histd)}")
byyear = {}
for i in ev:
    byyear[ud[i].year] = byyear.get(ud[i].year, 0) + 1
print('   by year:', ', '.join(f'{y}: {n}' for y, n in sorted(byyear.items())))
print('   events since 2025-01-01 (date, CL=F, USO; USO entry->+5, entry->+11):')
for i in ev:
    if ud[i] >= date(2025, 1, 1):
        f5 = U[i + 6] / U[i + 1] - 1 if i + 6 < len(ud) else float('nan')
        f11 = U[i + 12] / U[i + 1] - 1 if i + 12 < len(ud) else float('nan')
        print(f"     {ud[i]} CL=F {clr[ud[i]][0]:+.1%} USO {U[i] / U[i - 1] - 1:+.1%} | +5 {f5:+.1%} +11 {f11:+.1%}")


# ------------------------------------------------------------------ 1. underlying base rates
def fwd(series, i0, h):
    return series[i0 + h] / series[i0] - 1


print(f"\n== 1. Underlying returns from the entry close (t+1), events vs every day 2006-04-11..")
allidx = [i for i in range(len(ud) - 1 - HOLD_END) if ud[i] >= date(2006, 4, 11)]
for nm, S in (('USO', U), ('XLE', X)):
    for lab, evs in (('all events', hist), ('de-clustered', histd), ('since 2020', [i for i in hist if ud[i] >= date(2020, 1, 1)])):
        parts = []
        for h in (1, 3, 5, HOLD_END):
            r = np.array([fwd(S, i + 1, h) for i in evs])
            t = r.mean() / L.nw_se_mean(r, h) if len(r) > 2 else float('nan')
            parts.append(f"h{h}: {r.mean():+.2%} up {np.mean(r > 0):.0%} t {t:+.2f}")
        print(f"   {nm} {lab:13} n {len(evs):3d} | " + ' | '.join(parts))
    base = []
    for h in (1, 3, 5, HOLD_END):
        r = np.array([fwd(S, i, h) for i in allidx])
        base.append(f"h{h}: {r.mean():+.2%} up {np.mean(r > 0):.0%}")
    print(f"   {nm} {'every day':13} n {len(allidx):4d} | " + ' | '.join(base))
    r0 = np.array([fwd(S, i, 1) for i in hist])
    print(f"   {nm} reference: the event-day close to t+1 (the bounce we cannot buy): {r0.mean():+.2%}, up {np.mean(r0 > 0):.0%}")

# ------------------------------------------------------------------ 2. vol premium after drops
print('\n== 2. ^OVX at the entry close vs USO realized vol afterwards')
for lab, evs in (('events', [i for i in ev if i + 22 < len(ud) and O[i + 1] == O[i + 1]]),
                 ('every day', [i for i in allidx if i + 22 < len(ud) and O[i] == O[i]])):
    off = 1 if lab == 'events' else 0
    o = np.array([O[i + off] for i in evs])
    r11 = np.array([lu[i + off:i + off + 11].std(ddof=1) * SQ(252) for i in evs])
    r21 = np.array([lu[i + off:i + off + 21].std(ddof=1) * SQ(252) for i in evs])
    print(f"   {lab:9} n {len(evs):4d}: OVX {100 * o.mean():.1f}; next-11 RV {100 * r11.mean():.1f} (RV/OVX {np.mean(r11 / o):.2f}, OVX higher "
          f"{np.mean(o > r11):.0%}); next-21 RV {100 * r21.mean():.1f} (RV/OVX {np.mean(r21 / o):.2f}, OVX higher {np.mean(o > r21):.0%})")
    if lab == 'events':
        dO = np.array([O[i + 1 + 5] / O[i + 1] for i in evs if O[i + 6] == O[i + 6]])
        print(f"   events: ^OVX 5 sessions after entry / at entry: median {np.median(dO):.3f}, mean {dO.mean():.3f}")

# ------------------------------------------------------------------ 3. option EV per $ at today's IV
r0 = irx[max(d for d in irx if d <= TODAY)] / 100
print(f"\n== 3. Option payoff per $ at today's IV (r {r0:.4f} from ^IRX; S0 = 11/2 official close; entry Tue 11/3)")
jU, QU = chain('USO')
print(f"   Cboe USO chain timestamp {jU.get('timestamp')} (UTC), current_price {jU['data']['current_price']}, close {jU['data']['close']}, "
      f"iv30 {jU['data'].get('iv30')}")
elig = []
for s, o in QU.items():
    k = s[-9]
    e = date(2000 + int(s[3:5]), int(s[5:7]), int(s[7:9]))
    b, a = o.get('bid') or 0.0, o.get('ask') or 0.0
    if b <= 0:
        continue
    mid = (a + b) / 2
    dte = (e - ENTRY).days
    if 14 <= dte <= 35 and 0.30 <= abs(o.get('delta') or 0) <= 0.45 and (o.get('open_interest') or 0) >= 1000 and (a - b) / mid <= 0.10:
        elig.append((e, k, int(s[-8:]) / 1000, s, b, a, o['iv'], o['delta'], int(o['open_interest'])))
elig.sort()
print(f"   eligible USO contracts (expiry 14-35 days after 11/3): {len(elig)}")


def sim(S, iv_path_ratio, starts, S0, K, e, iv0, kind, sp, norm, onorm):
    """Per-start payoffs (hold5, hold11, set1). starts are entry indices i; the path is S[i..i+11]."""
    out = []
    T0 = (e - ENTRY).days / 365
    cost = float(L.bs(S0, K, T0, iv0, r0, 0.0, kind)) * (1 + sp / 2)
    for i in starts:
        if norm:
            if not onorm[i] == onorm[i]:
                continue
            scale = iv0 / onorm[i]
            path_s = S0 * np.exp(scale * np.log(S[i:i + HOLD_END + 1] / S[i]))
        else:
            path_s = S0 * S[i:i + HOLD_END + 1] / S[i]
        vals = []
        for k in range(1, HOLD_END + 1):
            Tk = T0 - (ud[i + k] - ud[i]).days / 365
            ivk = iv0 * iv_path_ratio(i, k)
            vals.append(float(L.bs(path_s[k], K, max(Tk, 0.0), ivk, r0, 0.0, kind)) * (1 - sp / 2) / cost)
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


def ovx_ratio(i, k):
    a, b = O[i], O[i + k]
    return b / a if (a == a and b == b and a > 0) else 1.0


ev_entries = [i + 1 for i in hist]
ev_entries_d = [i + 1 for i in histd]
base_entries = [i for i in allidx if O[i] == O[i] and i + HOLD_END < len(ud)]


def line(tr, lab):
    if not tr:
        return f"{lab}: n 0"
    h5 = np.array([t[1] for t in tr])
    h11 = np.array([t[2] for t in tr])
    s1 = np.array([t[3] for t in tr])
    t5 = (h5.mean() - 1) / L.nw_se_mean(h5, 5) if len(tr) > 2 else float('nan')
    t1 = (s1.mean() - 1) / L.nw_se_mean(s1, HOLD_END) if len(tr) > 2 else float('nan')
    t11 = (h11.mean() - 1) / L.nw_se_mean(h11, HOLD_END) if len(tr) > 2 else float('nan')
    return (f"{lab}: n {len(tr):4d}; hold5 {h5.mean():.3f} (t {t5:+.2f}); hold11 {h11.mean():.3f} (t {t11:+.2f}); set1 {s1.mean():.3f} (t {t1:+.2f}), "
            f"+50% hit {np.mean(s1 >= 1.5 - 1e-9):.0%}, median set1 {np.median(s1):.2f}")


saved = {}
for e, k, K, s, b, a, iv, dl, oi in elig:
    sp = (a - b) / ((a + b) / 2)
    print(f"\n   {s} {b:.2f}/{a:.2f} (spread {sp:.1%}) iv {iv:.3f} delta {dl:+.2f} oi {oi}; DTE at entry {(e - ENTRY).days}")
    for norm in (False, True):
        tag = 'vol-normalized' if norm else 'raw paths'
        tr, cost = sim(U, ovx_ratio, ev_entries, S0_USO, K, e, iv, k, sp, norm, O)
        trd, _ = sim(U, ovx_ratio, ev_entries_d, S0_USO, K, e, iv, k, sp, norm, O)
        trs, _ = sim(U, ovx_ratio, [i for i in ev_entries if ud[i] >= date(2020, 1, 1)], S0_USO, K, e, iv, k, sp, norm, O)
        bl, _ = sim(U, ovx_ratio, base_entries, S0_USO, K, e, iv, k, sp, norm, O)
        print(f"     [{tag}] model cost/share {cost:.2f}")
        print('       ' + line(tr, 'events      '))
        print('       ' + line(trd, 'de-clustered'))
        print('       ' + line(trs, 'since 2020  '))
        print('       ' + line(bl, 'every day   '))
        saved[(s, norm)] = tr
        if e == date(2026, 11, 27):
            for suffix, rows in (('', tr), ('_declust', trd)):
                fn = os.path.join(OUT, f"{s}_{'norm' if norm else 'raw'}{suffix}.csv")
                with open(fn, 'w', newline='') as f:
                    w = csv.writer(f)
                    w.writerow(['date', 'hold5', 'hold11', 'set1'])
                    for t in rows:
                        w.writerow([t[0], f'{t[1]:.5f}', f'{t[2]:.5f}', f'{t[3]:.5f}'])

# XLE hypothetical
jX, QX = chain('XLE')
print(f"\n   XLE (Cboe chain timestamp {jX.get('timestamp')} UTC): no contract passes the rules; hypothetical 11/27 0.40-delta at the 67.5-strike "
      f"ATM IV, 10% spread, raw paths, constant IV")
civ, piv = QX['XLE261127C00067500']['iv'], QX['XLE261127P00067500']['iv']
for kind, iv in (('C', civ), ('P', piv)):
    T0 = (date(2026, 11, 27) - ENTRY).days / 365
    K = float(L.strike_for_delta(S0_XLE, T0, iv, r0, 0.0, 0.40, kind)[0])
    tr, cost = sim(X, lambda i, k: 1.0, ev_entries, S0_XLE, K, date(2026, 11, 27), iv, kind, 0.10, False, O)
    bl, _ = sim(X, lambda i, k: 1.0, base_entries, S0_XLE, K, date(2026, 11, 27), iv, kind, 0.10, False, O)
    print(f"     XLE {kind} K {K:.2f} iv {iv:.3f}: " + line(tr, 'events') + ' || ' + line(bl, 'every day'))
print('\n== POST HOC (added after the first run; not evidence): the 11/27 primary contracts, events in the war regime')
for s_ in ('USO261127C00163000', 'USO261127P00150000'):
    for norm in (False, True):
        tr = saved[(s_, norm)]
        for lo in (date(2025, 1, 1), date(2026, 1, 1)):
            sub = [t for t in tr if t[0] >= lo]
            print(f"   {s_} {'norm' if norm else 'raw '} entries since {lo}: " + line(sub, '').lstrip(': ')
                  + ' | set1 values ' + ' '.join(f'{t[3]:.2f}' for t in sub))
print('   Robustness of the put hold-to-window figures: events entered outside 2008 and 2020 only')
for s_ in [x[3] for x in elig if x[1] == 'P']:
    for norm in (False, True):
        sub = [t for t in saved[(s_, norm)] if t[0].year not in (2008, 2020)]
        print(f"   {s_} {'norm' if norm else 'raw '} excl. 2008 and 2020: " + line(sub, '').lstrip(': '))
print('\nwritten:', ', '.join(sorted(os.listdir(OUT))))
