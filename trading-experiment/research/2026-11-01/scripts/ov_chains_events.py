#!/usr/bin/env python3
"""options-vol, 2026-11-01 (Run C). Offline analysis of the chains and bars that ov_fetch.py saved. Three parts:

  A. Index calls at the real skew: SPY, QQQ, IWM calls at |delta| 0.33-0.42 for the 11/20, 11/27 and 12/04 expiries, their IV against
     the index vol (^VIX, ^VXN, ^RVX: Cboe index quotes, 10/30 close) and against the ETF's realized vol (RV10/RV20/RV60, Yahoo closes
     to 10/30), plus our contract filters (21-35 DTE from Mon 11/2, OI >= 1,000, spread <= 5% of the mid).
  B. Event volatility for the week: ATM straddles (strike nearest the 10/30 close) for the 11/2-11/10 daily expiries; implied
     variance per day from consecutive expiries; the implied mean absolute move on Wed 11/4 (election reaction) and Fri 11/6 (jobs)
     against history: ^GSPC since 1950 and QQQ/IWM since 2000 on election day (Tue), the day after (Wed) and BLS jobs days (1994+).
     Historical moves are also expressed in multiples of the prior 20-session daily RV, then re-scaled to tonight's RV20 (and, for
     SPX, to tonight's ^VIX) so different vol regimes compare. EV/$ of the 11/4 and 11/6 straddles = mean re-scaled historical
     |move| over the same sessions / tonight's straddle mid (before spread costs).
  C. C1 gate and cost for this week's reporters (AAPL 11/2 pm, AMD 11/3 pm, QCOM 11/4 pm; Robinhood earnings calendar, verified):
     RV20 to 10/30, the 1.3x IV gate, the ex-event forward IV implied by tonight's term structure, the cost of a 0.35-0.40 delta put
     in the 21-35 DTE band after an 8% gap, and the C1 Kelly (sizing.py's own model) at each IV multiple: one contract only when full
     Kelly covers its cost.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-01/scripts/ov_chains_events.py <data_dir> <earnings_cache> <out_dir>

Choices fixed before results were read: the delta band, the DTE base date (Mon 11/2), mids for straddles, the BLS jobs-day rule
(the Saturday that ends the week containing the 12th, plus 20 days; on a market holiday the release shifts to the prior trading day
in July and to the next one otherwise, e.g. Good Friday; a date on Jan 1-3 moves a week later; 2013-10/11 and 2025-10/11/12 are
dropped, being shutdown-delayed), and the scaling (|move| / prior-20-session daily RV). All historical rows are descriptive:
nothing here is a pre-registered test.
"""
import csv
import json
import math
import os
import sys
from datetime import date, timedelta
from statistics import NormalDist

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import options_lib as L  # noqa: E402  (Black-Scholes, strike_for_delta)

ND = NormalDist()
ENTRY = date(2026, 11, 2)
CLOSE = {'SPY': 755.72, 'QQQ': 690.49, 'IWM': 279.33, 'AAPL': 344.63, 'AMD': 504.80, 'QCOM': 164.79}  # snapshot / Yahoo 10/30
IDX = {'SPY': '_VIX', 'QQQ': '_VXN', 'IWM': '_RVX'}
SQ2PI = math.sqrt(2 / math.pi)


def jload(d, f):
    return json.load(open(os.path.join(d, f)))


def bars(d, name):
    b = jload(d, f'yahoo_{name}.json')['bars']
    ds = sorted(b)
    return [date.fromisoformat(x) for x in ds], np.array([b[x][1] for x in ds], float)


def rv(closes, n, end=None):
    c = closes if end is None else closes[:end + 1]
    lr = np.diff(np.log(c[-(n + 1):]))
    return float(np.sqrt(252 * np.mean(lr ** 2)))


def occ(sym):
    return date(2000 + int(sym[-15:-13]), int(sym[-13:-11]), int(sym[-11:-9])), sym[-9], int(sym[-8:]) / 1000.0


def chain(d, u):
    j = jload(d, f'chain_{u}.json')
    out = []
    for o in j['data']['options']:
        exp, typ, k = occ(o['option'])
        out.append({'sym': o['option'], 'exp': exp, 'type': typ, 'k': k, 'bid': o.get('bid') or 0.0, 'ask': o.get('ask') or 0.0,
                    'iv': o.get('iv') or 0.0, 'delta': o.get('delta') or 0.0, 'oi': int(o.get('open_interest') or 0),
                    'theo': o.get('theo') or 0.0})
    return j['timestamp'], out


def mid(o):
    return (o['bid'] + o['ask']) / 2 if o['bid'] > 0 and o['ask'] > 0 else float('nan')


def spr(o):
    m = mid(o)
    return (o['ask'] - o['bid']) / m if m == m and m > 0 else float('nan')


# ------------------------------------------------------------------ A
def part_a(data, out_rows):
    print('\n=== A. Index calls at the real skew (Cboe delayed chains, 10/30 close; DTE from Mon 11/2) ===')
    for u in ('SPY', 'QQQ', 'IWM'):
        q = jload(data, f'quote_{IDX[u]}.json')['data']
        xv = float(q['current_price'])
        ds, c = bars(data, u)
        assert ds[-1] == date(2026, 10, 30), ds[-1]
        r10, r20, r60 = rv(c, 10), rv(c, 20), rv(c, 60)
        stamp, ch = chain(data, u)
        print(f'{u} close {CLOSE[u]} | {IDX[u][1:]} {xv} ({q["last_trade_time"]}) | RV10 {r10:.1%} RV20 {r20:.1%} RV60 {r60:.1%} | '
              f'chain file stamp {stamp}')
        for exp in (date(2026, 11, 20), date(2026, 11, 27), date(2026, 12, 4)):
            dte = (exp - ENTRY).days
            rows = [o for o in ch if o['exp'] == exp]
            calls = sorted([o for o in rows if o['type'] == 'C' and 0.33 <= o['delta'] <= 0.42], key=lambda o: o['k'])
            atm = min((o for o in rows if o['type'] == 'C'), key=lambda o: abs(o['delta'] - 0.5))
            puts = [o for o in rows if o['type'] == 'P' and 0.35 <= -o['delta'] <= 0.40]
            piv = float(np.median([o['iv'] for o in puts])) if puts else float('nan')
            print(f'  {exp} ({dte} DTE{"" if 21 <= dte <= 35 else ", OUTSIDE 21-35"}): ATM call IV {atm["iv"]:.1%} = {atm["iv"] * 100 / xv:.2f}x; '
                  f'0.35-0.40 put IV {piv:.1%} = {piv * 100 / xv:.2f}x')
            for o in calls:
                ok = 21 <= dte <= 35 and 0.30 <= o['delta'] <= 0.45 and o['oi'] >= 1000 and spr(o) <= 0.05
                row = {'part': 'A', 'underlying': u, 'contract': o['sym'], 'expiry': exp.isoformat(), 'dte_from_1102': dte,
                       'strike': o['k'], 'bid': o['bid'], 'ask': o['ask'], 'mid': round(mid(o), 3), 'spread_pct': round(spr(o), 4),
                       'iv': o['iv'], 'delta': o['delta'], 'oi': o['oi'], 'index_vol': xv, 'iv_over_index': round(o['iv'] * 100 / xv, 3),
                       'iv_over_rv10': round(o['iv'] / r10, 3), 'iv_over_rv20': round(o['iv'] / r20, 3),
                       'iv_over_rv60': round(o['iv'] / r60, 3), 'passes_filters': ok, 'source': f'Cboe delayed chain, file stamp {stamp}'}
                out_rows.append(row)
                print(f'    {o["sym"]} K {o["k"]:7.1f} {o["bid"]:6.2f}/{o["ask"]:6.2f} spr {spr(o):5.1%} IV {o["iv"]:.1%} d {o["delta"]:.2f} '
                      f'OI {o["oi"]:6d} | IV/{IDX[u][1:]} {o["iv"] * 100 / xv:.2f} IV/RV20 {o["iv"] / r20:.2f} IV/RV10 {o["iv"] / r10:.2f}'
                      f'{"  PASS" if ok else ""}')


# ------------------------------------------------------------------ B
def jobs_days(trading):
    """BLS Employment Situation release dates by rule (see the docstring), mapped to the reaction trading day."""
    ts = set(trading)
    out = []
    for y in range(1994, 2027):
        for m in range(1, 13):
            d12 = date(y, m, 12)
            sat = d12 + timedelta(days=(5 - d12.weekday()) % 7)
            rel = sat + timedelta(days=20)
            if rel.month == 1 and rel.day <= 3:
                rel += timedelta(days=7)
            if (rel.year, rel.month) in ((2013, 10), (2013, 11), (2025, 10), (2025, 11), (2025, 12)):
                continue
            if rel > trading[-1] or rel <= trading[0]:
                continue
            if rel not in ts:
                step = -1 if rel.month == 7 else 1
                while rel not in ts:
                    rel += timedelta(days=step)
            out.append(rel)
    return out


def election_day(y):
    nov1 = date(y, 11, 1)
    return nov1 + timedelta(days=(0 - nov1.weekday()) % 7 + 1)


def event_table(ds, c, vix_map=None):
    """Return dict of event label -> list of (date, |r|, |r| / prior daily RV20, |r| / (VIX_prev/sqrt252) or nan, r_window)."""
    lr = np.diff(np.log(c))  # lr[i-1] = return into day i
    idx = {d: i for i, d in enumerate(ds)}
    res = {}

    def rec(label, d, nwin=1, start_offset=0):
        i = idx.get(d)
        if i is None or i < 22 + nwin:
            return
        i0 = i - nwin + 1 + start_offset  # first day of the window
        prior = lr[i0 - 21:i0 - 1]  # 20 returns ending the day before the window
        sd = float(np.sqrt(np.mean(prior ** 2)))
        r = float(np.log(c[i] / c[i0 - 1]))
        vx = float('nan')
        if vix_map is not None and ds[i0 - 1] in vix_map:
            vx = vix_map[ds[i0 - 1]] / 100 / math.sqrt(252)
        res.setdefault(label, []).append((d, abs(r), abs(r) / sd if sd > 0 else float('nan'), abs(r) / vx if vx == vx else float('nan'),
                                           abs(r) / (sd * math.sqrt(nwin)) if sd > 0 else float('nan')))

    for y in range(1950, 2025, 2):  # the NYSE closed on election day until 1968 (1980 in presidential years): those years drop out
        e = election_day(y)
        tag = 'midterm' if y % 4 == 2 else 'presidential'
        if e in idx:
            rec(f'{tag} election day (Tue)', e)
            nxt = ds[idx[e] + 1]
            rec(f'{tag} day after (Wed)', nxt)
            rec(f'{tag} Fri-close to Wed-close (3 sessions)', nxt, nwin=3)
            fri = ds[idx[e] + 3] if idx[e] + 3 < len(ds) else None
            if fri is not None:
                rec(f'{tag} Fri-close to Fri-close (5 sessions)', fri, nwin=5)
    for d in jobs_days(ds):
        if d >= ds[0] + timedelta(days=40):
            rec('jobs day', d)
    # all days as the baseline
    allr = np.abs(lr)
    return res, allr


def stats(rows, k):
    x = np.array([r[k] for r in rows if r[k] == r[k]])
    if len(x) == 0:
        return dict(n=0, mean=float('nan'), median=float('nan'), rms=float('nan'))
    return dict(n=len(x), mean=float(x.mean()), median=float(np.median(x)), rms=float(np.sqrt(np.mean(x ** 2))))


def straddles(data, u):
    stamp, ch = chain(data, u)
    s = CLOSE[u]
    out = []
    for exp in sorted({o['exp'] for o in ch if o['exp'] <= date(2026, 11, 13)}):
        rows = [o for o in ch if o['exp'] == exp]
        ks = sorted({o['k'] for o in rows})
        k = min(ks, key=lambda x: abs(x - s))
        cc = next((o for o in rows if o['k'] == k and o['type'] == 'C'), None)
        pp = next((o for o in rows if o['k'] == k and o['type'] == 'P'), None)
        if not cc or not pp or mid(cc) != mid(cc) or mid(pp) != mid(pp):
            continue
        st = mid(cc) + mid(pp) - abs(s - k) * 0  # strike within half a tick of spot; no adjustment
        out.append({'exp': exp, 'k': k, 'straddle': st, 'call': (cc['bid'], cc['ask'], cc['sym']), 'put': (pp['bid'], pp['ask'], pp['sym']),
                    'spread': (cc['ask'] + pp['ask'] - cc['bid'] - pp['bid']) / st, 'oi': (cc['oi'], pp['oi'])})
    return stamp, out


def part_b(data, out_rows):
    print('\n=== B. Event volatility: straddles vs election-day and jobs-day history ===')
    trading_days = [date(2026, 11, 2) + timedelta(days=i) for i in range(12)]
    trading_days = [d for d in trading_days if d.weekday() < 5]
    vds, vc = bars(data, 'VIX')
    vix_map = dict(zip(vds, vc))
    hist = {}
    for u, name in (('SPY', 'GSPC'), ('QQQ', 'QQQ'), ('IWM', 'IWM')):
        ds, c = bars(data, name)
        res, allr = event_table(ds, c, vix_map if name == 'GSPC' else None)
        hist[u] = (res, ds, c)
        print(f'-- history on {name} ({ds[0]} to {ds[-1]})')
        for lab in sorted(res):
            rows = res[lab]
            sr, sn, sv, sw = stats(rows, 1), stats(rows, 2), stats(rows, 3), stats(rows, 4)
            last = ' '.join(f"{r[0].year}:{r[1] * 100:.1f}" for r in rows[-6:])
            print(f'   {lab:44s} n {sr["n"]:3d} mean |r| {sr["mean"]:.2%} median {sr["median"]:.2%} | x prior daily RV20: mean {sn["mean"]:.2f} '
                  f'median {sn["median"]:.2f}' + (f' | x VIX-daily: mean {sv["mean"]:.2f}' if sv['n'] else '') + f' | last: {last}')
            out_rows.append({'part': 'B-hist', 'underlying': name, 'contract': lab, 'n': sr['n'], 'mean_abs_move': round(sr['mean'], 5),
                             'median_abs_move': round(sr['median'], 5), 'mean_x_rv20daily': round(sn['mean'], 3),
                             'median_x_rv20daily': round(sn['median'], 3), 'mean_x_vixdaily': round(sv['mean'], 3) if sv['n'] else '',
                             'source': f'Yahoo daily closes {name}'})
        print(f'   {"all days":44s} n {len(allr)} mean |r| {allr.mean():.2%} median {np.median(allr):.2%}')

    for u in ('SPY', 'QQQ', 'IWM'):
        res, ds, c = hist[u]
        stamp, st = straddles(data, u)
        s = CLOSE[u]
        r20d = rv(c if u == 'SPY' else c, 20) / math.sqrt(252)
        if u == 'SPY':  # use SPY's own RV20 for scaling, ^GSPC history for multiples
            sds, sc = bars(data, 'SPY')
            r20d = rv(sc, 20) / math.sqrt(252)
        vixd = 19.42 / 100 / math.sqrt(252)
        print(f'-- {u} straddles at K nearest {s} (Cboe chain stamp {stamp}); daily RV20 {r20d:.2%}' +
              (f', VIX-daily {vixd:.2%}' if u == 'SPY' else ''))
        prev_w, prev_n = 0.0, 0
        for x in st:
            n_sess = sum(1 for d in trading_days if d <= x['exp'])
            sig = x['straddle'] / (SQ2PI * s)  # period sd implied by an ATM straddle
            w = sig ** 2
            fwd = math.sqrt(max(w - prev_w, 0) / max(n_sess - prev_n, 1)) if n_sess > prev_n else float('nan')
            print(f'   {x["exp"]} K {x["k"]:.0f} sessions {n_sess} straddle {x["straddle"]:.2f} ({x["straddle"] / s:.2%} of spot = implied mean |move|) '
                  f'spread {x["spread"]:.1%} | forward daily sd {fwd:.2%} = mean|move| {fwd * SQ2PI:.2%} '
                  f'= {fwd / r20d:.2f}x daily RV20 | OI C/P {x["oi"][0]}/{x["oi"][1]}')
            out_rows.append({'part': 'B-straddle', 'underlying': u, 'contract': f'{x["call"][2]}+{x["put"][2]}', 'expiry': x['exp'].isoformat(),
                             'strike': x['k'], 'bid': round(x['call'][0] + x['put'][0], 2), 'ask': round(x['call'][1] + x['put'][1], 2),
                             'mid': round(x['straddle'], 3), 'spread_pct': round(x['spread'], 4), 'sessions': n_sess,
                             'implied_mean_abs_move': round(x['straddle'] / s, 5), 'fwd_daily_sd': round(fwd, 5),
                             'fwd_x_rv20daily': round(fwd / r20d, 3), 'source': f'Cboe delayed chain, file stamp {stamp}'})
            prev_w, prev_n = w, n_sess
        # EV/$ of the 11/4 (3 sessions: Mon, Tue, Wed) and 11/6 (5 sessions) straddles from re-scaled history
        for exp, lab3, nwin in ((date(2026, 11, 4), 'Fri-close to Wed-close (3 sessions)', 3), (date(2026, 11, 6), 'Fri-close to Fri-close (5 sessions)', 5)):
            x = next((y for y in st if y['exp'] == exp), None)
            if not x:
                continue
            for tag in ('midterm', 'presidential'):
                rows = res.get(f'{tag} {lab3}', [])
                if not rows:
                    continue
                mrv = np.array([r[2] for r in rows])  # |r| / prior daily RV20 (whole window)
                ev_rv = float(np.mean(mrv) * r20d * s / x['straddle'])
                line = f'   EV/$ {exp} straddle vs {tag} windows (n {len(rows)}): re-scaled by RV20 {ev_rv:.2f}'
                rec = {'part': 'B-ev', 'underlying': u, 'contract': f'{exp} straddle vs {tag} {lab3}', 'n': len(rows),
                       'ev_rescaled_rv20': round(ev_rv, 3)}
                if u == 'SPY':
                    mvx = np.array([r[3] for r in rows if r[3] == r[3]])
                    ev_vx = float(np.mean(mvx) * vixd * s / x['straddle'])
                    line += f', by VIX {ev_vx:.2f} (n {len(mvx)})'
                    rec['ev_rescaled_vix'] = round(ev_vx, 3)
                    raw = float(np.mean([r[1] for r in rows if r[0].year >= 1990]) * s / x['straddle'])
                    line += f', raw |move| 1990+ {raw:.2f}'
                    rec['ev_raw_1990plus'] = round(raw, 3)
                print(line + f'  (bid/ask {x["call"][0] + x["put"][0]:.2f}/{x["call"][1] + x["put"][1]:.2f})')
                out_rows.append(rec)
        # single-day comparisons
        for lab, d in (('day after (Wed)', date(2026, 11, 4)), ('jobs day', date(2026, 11, 6))):
            keys = [k for k in res if lab in k and ('midterm' in k or lab == 'jobs day')]
            for k in keys:
                sn = stats(res[k], 2)
                print(f'   fair mean|move| for {d} from {k}: {sn["mean"] * r20d:.2%} (mean {sn["mean"]:.2f}x daily RV20, n {sn["n"]})')


# ------------------------------------------------------------------ C
def part_c(data, cache, out_rows):
    print('\n=== C. C1 this week: gate, ex-event IV, cost after an 8% gap, Kelly per contract ===')
    sys.path.insert(0, '/home/user/temp/trading-experiment/research/2026-10-30/scripts')
    import sizing as SZ  # noqa: E402
    from earnings_analysis import option_ratio  # noqa: E402
    from c1_vix_split import build_rows  # noqa: E402
    from pathlib import Path
    rows = [r for r in build_rows(Path(cache)) if r['gap'] <= -0.08]
    ok = [r for r in rows if not any(math.isnan(r.get(k, float('nan'))) for k in ('ret5', 'cal5', 'rv_pre'))]
    ret = np.array([r['ret5'] for r in ok]); cal = np.array([r['cal5'] for r in ok]); rvp = np.array([r['rv_pre'] for r in ok])
    callm = np.zeros(len(ok), dtype=bool)
    eq = 1917.92
    kel = {}
    for m in (0.8, 0.9, 1.0, 1.1, 1.15, 1.2, 1.25, 1.3):
        pay = option_ratio(ret, cal, 25, 0.35, m * rvp, m * rvp, callm)
        kel[m] = SZ.kelly(pay)
    print('   C1 full Kelly $ by IV multiple (sizing.py model, n %d): ' % len(ok) + ', '.join(f'{m:.2f}x ${kel[m] * eq:,.0f}' for m in kel))
    rel = {'AAPL': date(2026, 11, 3), 'AMD': date(2026, 11, 4), 'QCOM': date(2026, 11, 5)}
    for u, react in rel.items():
        ds, c = bars(data, u)
        r20 = rv(c, 20)
        stamp, ch = chain(data, u)
        s0 = CLOSE[u]
        # ex-event forward IV: first expiry after the reaction day vs the in-band expiries, ATM puts/calls averaged
        exps = sorted({o['exp'] for o in ch if o['exp'] > react})
        def atm_iv(exp):
            rows = [o for o in ch if o['exp'] == exp and o['iv'] > 0]
            k = min({o['k'] for o in rows}, key=lambda x: abs(x - s0))
            v = [o['iv'] for o in rows if o['k'] == k]
            return float(np.mean(v))
        e1 = exps[0]
        t1 = (e1 - date(2026, 10, 30)).days / 365
        v1 = atm_iv(e1)
        line = f'-- {u} (reaction {react}; close {s0}; RV20 to 10/30 {r20:.1%}; gate 1.3x = {1.3 * r20:.1%}); Cboe stamp {stamp}\n'
        line += f'   ATM IV {e1} {v1:.1%}'
        for e2 in [e for e in exps if 21 <= (e - react).days <= 35][:2]:
            t2 = (e2 - date(2026, 10, 30)).days / 365
            v2 = atm_iv(e2)
            fwd = math.sqrt(max(v2 ** 2 * t2 - v1 ** 2 * t1, 0) / (t2 - t1))
            line += f'; {e2} ({(e2 - react).days} DTE at entry) ATM IV {v2:.1%}, ex-event forward {fwd:.1%} = {fwd / r20:.2f}x RV20'
            # cost of a 0.35/0.40-delta put after an 8% gap at the gate and at lower multiples
            s1 = s0 * 0.92
            T = (e2 - react).days / 365
            for dl in (0.35, 0.40):
                costs = []
                for m in (0.9, 1.0, 1.15, 1.3, fwd / r20):
                    sig = m * r20
                    k = float(np.ravel(L.strike_for_delta(s1, T, sig, 0.04, 0.0, dl, 'P'))[0])
                    p = float(np.ravel(L.bs(s1, k, T, sig, 0.04, 0.0, 'P'))[0])
                    costs.append((m, p * 100))
                line += f'\n      {e2} {dl:.2f}-delta put after -8% (S {s1:.2f}): ' + ', '.join(f'IV {m:.2f}x -> ${cst:,.0f}' for m, cst in costs)
                out_rows.append({'part': 'C1', 'underlying': u, 'contract': f'{e2} {dl:.2f}-delta put after -8% gap', 'expiry': e2.isoformat(),
                                 'rv20': round(r20, 4), 'gate_iv': round(1.3 * r20, 4), 'ex_event_fwd_iv': round(fwd, 4),
                                 'cost_at_1.0x': round(costs[1][1], 0), 'cost_at_1.3x': round(costs[3][1], 0),
                                 'full_kelly_at_1.0x': round(kel[1.0] * eq, 0), 'full_kelly_at_1.3x': round(kel[1.3] * eq, 0),
                                 'source': f'Cboe delayed chain stamp {stamp}; Yahoo closes; BS estimate (not a quote)'})
        print(line)


def main():
    data, cache, out = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(out, exist_ok=True)
    rows = []
    part_a(data, rows)
    part_b(data, rows)
    part_c(data, cache, rows)
    keys = []
    for r in rows:
        for k in r:
            if k not in keys:
                keys.append(k)
    with open(os.path.join(out, 'ov_chains_events.csv'), 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)
    print('\nwrote', os.path.join(out, 'ov_chains_events.csv'), len(rows), 'rows')


if __name__ == '__main__':
    main()
