#!/usr/bin/env python3
"""options-vol, 2026-11-02 (Run B), question 1: are the 11/4 and 11/6 SPY / QQQ / IWM straddles cheap enough to buy?

Offline: reads what ov_fetch.py saved (tonight's Cboe chains and index quotes, Yahoo daily closes) plus the strategy review's Cboe
RVX file (options_lib.load_rvx_cboe). Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-02/scripts/ov_events.py <data_dir> <out_dir>

Choices fixed before any result was read:
  * Entry = the Mon 11/2 close. The 11/4 straddle spans 2 sessions (Tue election day, Wed reaction); the 11/6 straddle spans 4 (Tue,
    Wed, Thu, Fri jobs day). Straddle strike = the listed strike where |call mid - put mid| is smallest; spot = the put-call-parity
    spot K + C - P at that strike (the 16:15 option quotes, not the 16:00 close). Buy at the ASK sum, hold to expiry, paid
    intrinsic (generous: it ignores the exit spread). EV per $ is also shown at the mid.
  * History, absolute size only (every draw is used with both signs, so no direction enters; the retired midterm-rally argument
    plays no part). Moves are scaled by the vol at the window's start and re-scaled to tonight's:
      RV20  = 20-session daily realized vol ending at the prior close (tonight: the ETF's own, to 11/2);
      IDX   = index vol at the prior close / sqrt(252): ^VIX for ^GSPC (1990+), ^VXN for QQQ (2001+), Cboe RVX for IWM (2009-09+);
      VIX9D = for SPY only: forward k-session |move| / (VIX9D x sqrt(k/252)) on ALL days 2011+ with VIX9D/VIX >= 1.05 at the start
              (tonight 22.46 / 21.15 = 1.062), i.e. inverted-front days like tonight, n days and distinct episodes reported.
  * Windows: (a) direct: the Mon-close -> Wed-close (2 sessions) and Mon-close -> Fri-close (4 sessions) moves of each midterm
    year (^GSPC 1970-2022; QQQ and IWM from their first midterm); (b) composite: independent draws per day type, Tue from midterm
    election days, Wed from midterm reaction days, Thu from all non-event days, Fri from BLS jobs days (research/2026-11-01's rule),
    100,000 draws. Presidential years are shown for reference only (tomorrow is a midterm).
  * Per-trade payoff files (payoff / ask) are written so sizing.py can size any line with EV above 1.
Everything here is descriptive: n is 6-14 per midterm window, no test is pre-registered, and straddles also break our contract rules
(DTE under 3 days, delta about 0.5): a straddle is not a legal trade, whatever its EV.
"""
import csv
import json
import math
import os
import sys
from datetime import date, timedelta

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/2026-11-01/scripts')
sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import options_lib as L  # noqa: E402
from ov_chains_events import election_day, jobs_days  # noqa: E402  (Sunday's committed rules)

MON = date(2026, 11, 2)
SESS = [date(2026, 11, 3), date(2026, 11, 4), date(2026, 11, 5), date(2026, 11, 6), date(2026, 11, 9), date(2026, 11, 10),
        date(2026, 11, 11), date(2026, 11, 12), date(2026, 11, 13)]
CLOSE = {'SPY': 752.10, 'QQQ': 681.09, 'IWM': 279.14}  # brief snapshot (Yahoo + Cboe official closes 11/2)
HIST = {'SPY': 'GSPC', 'QQQ': 'QQQ', 'IWM': 'IWM'}
IDXQ = {'SPY': '_VIX', 'QQQ': '_VXN', 'IWM': '_RVX'}
SQ = math.sqrt(2 / math.pi)
NDRAW = 100_000


def jload(d, f):
    return json.load(open(os.path.join(d, f)))


def ybars(d, name):
    b = jload(d, f'yahoo_{name}.json')['bars']
    ds = sorted(b)
    return [date.fromisoformat(x) for x in ds], np.array([b[x][1] for x in ds], float)


def chain(d, u):
    j = jload(d, f'chain_{u}.json')
    out = []
    for o in j['data']['options']:
        s = o['option']
        if not s.startswith(u + '2'):  # skip non-standard roots (e.g. B1SPY...)
            continue
        out.append({'sym': s, 'exp': date(2000 + int(s[-15:-13]), int(s[-13:-11]), int(s[-11:-9])), 'type': s[-9],
                    'k': int(s[-8:]) / 1000, 'bid': o.get('bid') or 0.0, 'ask': o.get('ask') or 0.0,
                    'oi': int(o.get('open_interest') or 0), 'iv': o.get('iv') or 0.0})
    return j['timestamp'], out


def straddles(data, u):
    stamp, ch = chain(data, u)
    out = []
    for exp in [e for e in sorted({o['exp'] for o in ch}) if MON < e <= SESS[-1]]:
        rows = {(o['k'], o['type']): o for o in ch if o['exp'] == exp}
        best = None
        for (k, t), c in rows.items():
            if t != 'C' or (k, 'P') not in rows:
                continue
            p = rows[(k, 'P')]
            if min(c['bid'], p['bid'], c['ask'], p['ask']) <= 0:
                continue
            gap = abs((c['bid'] + c['ask']) / 2 - (p['bid'] + p['ask']) / 2)
            if best is None or gap < best[0]:
                best = (gap, k, c, p)
        if best is None:
            continue
        _, k, c, p = best
        cm, pm = (c['bid'] + c['ask']) / 2, (p['bid'] + p['ask']) / 2
        out.append({'exp': exp, 'k': k, 'c': c, 'p': p, 'mid': cm + pm, 'bid': c['bid'] + p['bid'], 'ask': c['ask'] + p['ask'],
                    'spot': k + cm - pm, 'n': sum(1 for d in SESS if d <= exp)})
    return stamp, out


def rv_daily(c, end, n=20):
    lr = np.diff(np.log(c[end - n:end + 1]))
    return float(np.sqrt(np.mean(lr ** 2)))


def midterm_windows(ds, c, idxmap):
    """Per midterm year: (year, z values by window) with z = signed log move / start vol, for RV20 and IDX scalings."""
    pos = {d: i for i, d in enumerate(ds)}
    out = []
    for y in range(1950, 2026, 2):
        e = election_day(y)
        if e not in pos or pos[e] < 25 or pos[e] + 3 >= len(ds):
            continue
        ie = pos[e]
        im = ie - 1
        rec = {'year': y, 'kind': 'midterm' if y % 4 == 2 else 'presidential'}
        s_rv = rv_daily(c, im)
        x = idxmap.get(ds[im]) if idxmap else None
        s_ix = x / 100 / math.sqrt(252) if x else float('nan')
        for lab, a, b in (('tue', im, ie), ('wed', ie, ie + 1), ('mon_wed', im, ie + 1), ('mon_fri', im, ie + 3)):
            r = float(np.log(c[b] / c[a]))
            # per-day pools are scaled by the vol at their own start; windows by the Monday vol
            s0 = rv_daily(c, a) if lab in ('tue', 'wed') else s_rv
            xa = idxmap.get(ds[a]) if idxmap else None
            s1 = xa / 100 / math.sqrt(252) if xa else float('nan')
            rec[lab] = {'r': r, 'z_rv': r / s0, 'z_ix': r / s1 if s1 == s1 else float('nan'),
                        'z_ix_mon': r / s_ix if s_ix == s_ix else float('nan')}
        rec['fri_is_jobs'] = ds[ie + 3] in set(jobs_days(ds))
        out.append(rec)
    return out


def day_pools(ds, c, idxmap):
    """z = signed 1-day log move / prior vol, for jobs days and for all non-event days (the Thursday pool)."""
    jd = set(jobs_days(ds))
    ev = set()
    for y in range(1950, 2026, 2):
        e = election_day(y)
        ev |= {e + timedelta(days=i) for i in range(-1, 4)}
    pools = {'jobs': {'rv': [], 'ix': []}, 'normal': {'rv': [], 'ix': []}}
    for i in range(25, len(ds)):
        d = ds[i]
        r = float(np.log(c[i] / c[i - 1]))
        key = 'jobs' if d in jd else ('normal' if d not in ev else None)
        if key is None:
            continue
        pools[key]['rv'].append(r / rv_daily(c, i - 1))
        x = idxmap.get(ds[i - 1]) if idxmap else None
        if x:
            pools[key]['ix'].append(r / (x / 100 / math.sqrt(252)))
    return {k: {s: np.array(v) for s, v in d.items()} for k, d in pools.items()}


def payoff(S, K, r):
    return np.abs(S * np.exp(r) - K)


def sym(z):
    z = np.asarray([x for x in z if x == x], float)
    return np.concatenate([z, -z])


def main():
    data, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    rng = np.random.default_rng(20261102)
    rows = []
    vixd, vixv = ybars(data, 'VIX')
    vxnd, vxnv = ybars(data, 'VXN')
    v9d, v9v = ybars(data, 'VIX9D')
    idx_hist = {'SPY': dict(zip(vixd, vixv)), 'QQQ': dict(zip(vxnd, vxnv)), 'IWM': L.load_rvx_cboe()}
    q = {k: float(jload(data, f'quote_{k}.json')['data']['current_price']) for k in ('_VIX', '_VXN', '_RVX', '_VIX9D', '_VIX3M')}
    qt = {k: jload(data, f'quote_{k}.json')['data']['last_trade_time'] for k in q}
    print('Cboe index quotes: ' + ', '.join(f'{k[1:]} {v} ({qt[k]})' for k, v in q.items()))

    # ---------------- VIX9D inversion pool (SPX, 2011+)
    gd, gc = ybars(data, 'GSPC')
    gpos = {d: i for i, d in enumerate(gd)}
    v9 = dict(zip(v9d, v9v))
    vx = dict(zip(vixd, vixv))
    inv = {2: [], 4: []}
    allz = {2: [], 4: []}
    inv_days = []
    for d in sorted(v9):
        if d not in vx or d not in gpos or d >= MON:
            continue
        i = gpos[d]
        ratio = v9[d] / vx[d]
        for k in (2, 4):
            if i + k >= len(gd):
                continue
            r = float(np.log(gc[i + k] / gc[i]))
            z = r / (v9[d] / 100 * math.sqrt(k / 252))
            allz[k].append(z)
            if ratio >= 1.05:
                inv[k].append(z)
        if ratio >= 1.05:
            inv_days.append(d)
    episodes = 0
    last = None
    for d in inv_days:
        if last is None or (d - last).days > 14:
            episodes += 1
        last = d
    print(f'\nVIX9D/VIX >= 1.05 days 2011-01 to 2026-10 (Yahoo ^VIX9D, ^VIX): {len(inv_days)} days in {episodes} episodes; '
          f'tonight {q["_VIX9D"]}/{q["_VIX"]} = {q["_VIX9D"] / q["_VIX"]:.3f}')
    for k in (2, 4):
        a, b = np.abs(np.array(allz[k])), np.abs(np.array(inv[k]))
        print(f'  {k}-session SPX |move| / VIX9D-implied sd: all days mean {a.mean():.3f} (straddle at VIX9D returns {a.mean() / SQ:.2f} '
              f'per $ at mid, n {len(a)}); inverted days mean {b.mean():.3f} ({b.mean() / SQ:.2f} per $, n {len(b)})')
        rows.append({'section': 'vix9d_inversion', 'underlying': 'GSPC', 'window': f'{k} sessions', 'n': len(b), 'episodes': episodes,
                     'mean_abs_z': round(float(b.mean()), 4), 'ev_mid_at_vix9d': round(float(b.mean() / SQ), 4),
                     'all_days_mean_abs_z': round(float(a.mean()), 4), 'all_days_ev_mid_at_vix9d': round(float(a.mean() / SQ), 4),
                     'source': 'Yahoo ^GSPC, ^VIX9D, ^VIX daily closes'})

    for u in ('SPY', 'QQQ', 'IWM'):
        hd, hc = ybars(data, HIST[u])
        ed, ec = ybars(data, u)
        assert ed[-1] == MON, (u, ed[-1])
        s_rv_now = rv_daily(ec, len(ec) - 1) if u != 'SPY' else rv_daily(gc, len(gc) - 1)
        s_ix_now = q[IDXQ[u]] / 100 / math.sqrt(252)
        stamp, st = straddles(data, u)
        print(f'\n=== {u}: Cboe delayed chain file stamp {stamp} UTC (16:15 ET option quotes); close {CLOSE[u]}; '
              f'daily RV20 to 11/2 {s_rv_now:.2%} ({"^GSPC" if u == "SPY" else u}); {IDXQ[u][1:]} {q[IDXQ[u]]} -> daily {s_ix_now:.2%}')
        prev_w, prev_n = 0.0, 0
        implied_day = {}
        for x in st:
            sd = x['mid'] / (SQ * x['spot'])
            w = sd ** 2
            fwd = math.sqrt(max(w - prev_w, 0) / (x['n'] - prev_n)) if x['n'] > prev_n else float('nan')
            ann = sd * math.sqrt(252 / x['n'])
            implied_day[x['exp']] = fwd * SQ
            print(f'  {x["exp"]} K {x["k"]:g} (parity spot {x["spot"]:.2f}) {x["n"]} sess: {x["c"]["sym"]} {x["c"]["bid"]:.2f}/{x["c"]["ask"]:.2f} + '
                  f'P {x["p"]["bid"]:.2f}/{x["p"]["ask"]:.2f} = {x["bid"]:.2f}/{x["ask"]:.2f} (mid {x["mid"]:.2f}, {x["mid"] / x["spot"]:.2%} of spot, '
                  f'ann. {ann:.1%}) | forward day mean|move| {fwd * SQ:.2%} = {fwd / s_rv_now:.2f}x RV20, {fwd / s_ix_now:.2f}x {IDXQ[u][1:]} | '
                  f'OI C/P {x["c"]["oi"]}/{x["p"]["oi"]}')
            rows.append({'section': 'straddle', 'underlying': u, 'window': x['exp'].isoformat(), 'n': x['n'], 'strike': x['k'],
                         'call': x['c']['sym'], 'put': x['p']['sym'], 'bid': round(x['bid'], 2), 'ask': round(x['ask'], 2),
                         'mid': round(x['mid'], 3), 'parity_spot': round(x['spot'], 2), 'implied_ann_vol': round(ann, 4),
                         'fwd_day_mean_abs': round(fwd * SQ, 5), 'fwd_x_rv20': round(fwd / s_rv_now, 3), 'fwd_x_index': round(fwd / s_ix_now, 3),
                         'oi_call': x['c']['oi'], 'oi_put': x['p']['oi'], 'source': f'Cboe delayed chain, file stamp {stamp} UTC'})
            prev_w, prev_n = w, x['n']

        mw = midterm_windows(hd, hc, idx_hist[u])
        pools = day_pools(hd, hc, idx_hist[u])
        mids = [m for m in mw if m['kind'] == 'midterm']
        pres = [m for m in mw if m['kind'] == 'presidential']
        print(f'  history ({HIST[u]} {hd[0]} to {hd[-1]}): midterm years {[m["year"] for m in mids]}; '
              f'jobs days n {len(pools["jobs"]["rv"])}; normal days n {len(pools["normal"]["rv"])}')
        for lab, pool in (('midterm Tue (election day)', [m['tue'] for m in mids]), ('midterm Wed (reaction)', [m['wed'] for m in mids])):
            zr = np.abs([p['z_rv'] for p in pool]); zi = np.abs([p['z_ix'] for p in pool if p['z_ix'] == p['z_ix']])
            print(f'    {lab:28s} n {len(zr):2d}: mean |z| x RV20 {zr.mean():.2f}, x IDX {zi.mean() if len(zi) else float("nan"):.2f} (n {len(zi)}) '
                  f'-> fair mean|move| {zr.mean() * s_rv_now:.2%} (RV20) / {zi.mean() * s_ix_now if len(zi) else float("nan"):.2%} (IDX)')
        for lab in ('jobs', 'normal'):
            zr, zi = np.abs(pools[lab]['rv']), np.abs(pools[lab]['ix'])
            print(f'    {lab + " days":28s} n {len(zr):5d}: mean |z| x RV20 {zr.mean():.2f}, x IDX {zi.mean():.2f} (n {len(zi)}) '
                  f'-> fair mean|move| {zr.mean() * s_rv_now:.2%} / {zi.mean() * s_ix_now:.2%}')
        fair_day = {}
        for d, pz in ((SESS[0], [m['tue'] for m in mids]), (SESS[1], [m['wed'] for m in mids])):
            fair_day[d] = (np.mean(np.abs([p['z_rv'] for p in pz])) * s_rv_now,
                           np.nanmean(np.abs([p['z_ix'] for p in pz])) * s_ix_now)
        fair_day[SESS[2]] = (np.mean(np.abs(pools['normal']['rv'])) * s_rv_now, np.mean(np.abs(pools['normal']['ix'])) * s_ix_now)
        fair_day[SESS[3]] = (np.mean(np.abs(pools['jobs']['rv'])) * s_rv_now, np.mean(np.abs(pools['jobs']['ix'])) * s_ix_now)
        for d in SESS[:4]:
            if d in implied_day:
                print(f'    {d} implied mean|move| {implied_day[d]:.2%} vs fair {fair_day[d][0]:.2%} (RV20) / {fair_day[d][1]:.2%} (IDX): '
                      f'implied is {implied_day[d] / fair_day[d][0]:.2f}x / {implied_day[d] / fair_day[d][1]:.2f}x fair')
                rows.append({'section': 'day', 'underlying': u, 'window': d.isoformat(), 'implied_mean_abs': round(implied_day[d], 5),
                             'fair_rv20': round(fair_day[d][0], 5), 'fair_index': round(fair_day[d][1], 5)})

        # ---------------- EV per $ of the 11/4 and 11/6 straddles
        for exp, wkey, ndays in ((date(2026, 11, 4), 'mon_wed', 2), (date(2026, 11, 6), 'mon_fri', 4)):
            x = next((y for y in st if y['exp'] == exp), None)
            if x is None:
                continue
            S, K = x['spot'], x['k']
            print(f'  -- {exp} straddle K {K:g}: {x["bid"]:.2f}/{x["ask"]:.2f} ({ndays} sessions)')
            lines = []
            for scal, snow in (('RV20', s_rv_now), ('IDX', s_ix_now)):
                zkey = 'z_rv' if scal == 'RV20' else 'z_ix_mon'
                # (a) direct midterm windows
                z = sym([m[wkey][zkey] for m in mids])
                if len(z):
                    lines.append((f'direct midterm {wkey} x {scal}', len(z) // 2, payoff(S, K, z * snow)))
                zp = sym([m[wkey][zkey] for m in pres])
                if len(zp):
                    lines.append((f'(ref) direct presidential {wkey} x {scal}', len(zp) // 2, payoff(S, K, zp * snow)))
                # (b) composite bootstrap
                zk = 'z_rv' if scal == 'RV20' else 'z_ix'
                tue = sym([m['tue'][zk] for m in mids]); wed = sym([m['wed'][zk] for m in mids])
                if len(tue) and len(wed):
                    tot = rng.choice(tue, NDRAW) + rng.choice(wed, NDRAW)
                    if ndays == 4:
                        pk = 'rv' if scal == 'RV20' else 'ix'
                        tot = tot + rng.choice(sym(pools['normal'][pk]), NDRAW) + rng.choice(sym(pools['jobs'][pk]), NDRAW)
                    lines.append((f'composite (Tue, Wed{", Thu normal, Fri jobs" if ndays == 4 else ""}) x {scal}', len(tue) // 2,
                                  payoff(S, K, tot * snow)))
            if u == 'SPY':
                z9 = sym(inv[ndays])
                lines.append((f'VIX9D-inverted days 2011+ x VIX9D {q["_VIX9D"]}', len(inv[ndays]),
                              payoff(S, K, z9 * q['_VIX9D'] / 100 * math.sqrt(ndays / 252))))
                raw = sym([m[wkey]['r'] for m in mids if m['year'] >= 1990])
                lines.append(('raw midterm moves 1990+ (unscaled)', len(raw) // 2, payoff(S, K, raw)))
            for lab, n, pay in lines:
                ev_a, ev_m = pay.mean() / x['ask'], pay.mean() / x['mid']
                print(f'     {lab:58s} n {n:5d}: fair {pay.mean():6.2f} -> EV/$ at ask {ev_a:.2f}, at mid {ev_m:.2f}; '
                      f'P(payoff > ask) {np.mean(pay > x["ask"]):.0%}')
                rows.append({'section': 'ev', 'underlying': u, 'window': f'{exp} straddle K {K:g}', 'method': lab, 'n': n,
                             'ask': round(x['ask'], 2), 'mid': round(x['mid'], 3), 'fair_value': round(float(pay.mean()), 3),
                             'ev_per_usd_ask': round(float(ev_a), 4), 'ev_per_usd_mid': round(float(ev_m), 4),
                             'p_win': round(float(np.mean(pay > x['ask'])), 4),
                             'source': f'Cboe chain {stamp} UTC; Yahoo {HIST[u]} closes; index vol history'})
                if not lab.startswith('(ref)'):
                    fn = os.path.join(out, f'payoffs_{u}_{exp:%m%d}_{lab.split(" x ")[0].replace(" ", "_").replace("(", "").replace(")", "").replace(",", "")}_{lab.split(" x ")[-1].split(" ")[0]}.csv')
                    with open(fn, 'w', newline='') as f:
                        w = csv.writer(f)
                        w.writerow(['payoff_per_usd_ask'])
                        sample = pay if len(pay) <= 20000 else pay[:20000]
                        for v in sample:
                            w.writerow([f'{v / x["ask"]:.5f}'])
    keys = []
    for r in rows:
        for k in r:
            if k not in keys:
                keys.append(k)
    with open(os.path.join(out, 'ov_events.csv'), 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)
    print('\nwrote', os.path.join(out, 'ov_events.csv'), len(rows), 'rows')


if __name__ == '__main__':
    main()
