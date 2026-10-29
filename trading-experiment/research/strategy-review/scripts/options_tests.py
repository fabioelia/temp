#!/usr/bin/env python3
"""D1-D4 options tests (strategy review, pre-registered 2026-10-29). Run: python3 -I options_tests.py

Spec choices not fixed by claims.md, written here before any result was computed:
  * Every option horizon in D1-D3: 10 sessions (re-priced at that day's VIX) and held to expiry (intrinsic).
  * D1 VRP: RV = sqrt(252/21 * sum of the next 21 squared log returns of ^GSPC); compare with VIX on the entry day.
  * D1/D2 headline instrument = the delta-0.35 call (our 0.30-0.45 rule); CONFIRMED needs both horizons to agree, else WEAK.
    ATM call and ATM put are reported alongside.
  * D2: IV rank = (VIX - 252-day min) / (252-day max - min), window includes today (tastylive's IVR). Low = IVR < 0.25.
    Test: OLS of trade EV/$ on a low-IVR dummy (NW lag 2h); b = low-IVR minus other days. Baseline = all days with IVR defined.
  * D3 primary: paired daily difference EV/$(0.10-delta call) - EV/$(0.50-delta call); both horizons must agree.
    Puts by delta are descriptive only.
  * D4: SPY 30 DTE delta-0.40 call, entered at every close; registered sample 2010-2026 (the protocol's "full sample" for D4);
    1993-2009 is the out-of-sample half. Every rule has the same time exit at the session-15 close. Checks once a day at the close
    on bid = mid x 0.985 against cost = entry mid x 1.015. Rules: R0 hold to day 15; R1 +50% all; R2 half +50% / half +100%;
    R3 -50% stop; R4a R1+R3; R4b R2+R3; R5a R4a + stop to cost after a close at +40%; R5b R4b + the same.
    Paired difference vs R0 with NW lag 30.
  * D4 on B2 signal days: my own implementation of the B2 follow-through-day rule (+1.25% variant only), ^GSPC closes and volume.
  * Verdict reading of "no effect" (protocol ambiguity): right sign with |t| < 1 counts as no effect (REJECTED); 1 <= |t| < 2 is WEAK.
  * Regime slice for the one-liner: entries with 15 <= VIX <= 19 and VIX9D < VIX3M (2011+). Descriptive, no verdict.
Post-hoc items (decided after seeing results) are labelled post_hoc in the CSV.
"""
import csv
import sys
from datetime import date

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import options_lib as L  # noqa: E402

OUT = '/home/user/temp/trading-experiment/research/strategy-review/options-results.csv'
ROWS = []


def add(claim, test, instrument, horizon, period, s, base, note='', gross=None, extra=None):
    row = {'claim': claim, 'test': test, 'instrument': instrument, 'horizon': horizon, 'period': period,
           'n': s.get('n', 0), 'ev_per_dollar': s.get('ev'), 'ev_gross_mid': gross, 'median': s.get('median'),
           'hit_rate': s.get('hit'), 'p10': s.get('p10'), 'p90': s.get('p90'), 'worst': s.get('worst'),
           'baseline': base, 't_nw': s.get('t'), 'note': note}
    if extra:
        row.update(extra)
    ROWS.append(row)
    return row


def fmt(x, nd=3):
    return '' if x is None or (isinstance(x, float) and np.isnan(x)) else (f'{x:.{nd}f}' if isinstance(x, float) else str(x))


# ------------------------------------------------------------------ trades
def option_trades(m, kind, delta, horizon, ivmult=1.0):
    """Per-entry net and gross EV/$ for a 30 DTE option. delta=None means ATM spot strike. horizon = 10 or 'exp'."""
    dates, S, iv, r, q = m['dates'], m['S'], m['iv'] * ivmult, m['r'], m['q']
    n = len(dates)
    ex = L.expiry_index(dates)
    idx = np.array([i for i in range(n) if ex[i] > 0 and (horizon == 'exp' or (i + horizon < ex[i]))])
    e = ex[idx]
    T0 = np.array([(dates[j] - dates[i]).days / 365.0 for i, j in zip(idx, e)])
    if delta is None:
        K = S[idx].copy()
    else:
        K = L.strike_for_delta(S[idx], T0, iv[idx], r[idx], q[idx], delta, kind)
    mid0 = L.bs(S[idx], K, T0, iv[idx], r[idx], q[idx], kind)
    if horizon == 'exp':
        x = e
        T1 = np.zeros(len(idx))
    else:
        x = idx + horizon
        T1 = np.array([(dates[j] - dates[k]).days / 365.0 for k, j in zip(x, e)])
    mid1 = L.bs(S[x], K, T1, iv[x], r[x], q[x], kind)
    gross = mid1 / mid0
    net = mid1 * (1 - L.HALF_SPREAD) / (mid0 * (1 + L.HALF_SPREAD))
    hold = (e - idx) if horizon == 'exp' else np.full(len(idx), horizon)
    return {'idx': idx, 'dates': [dates[i] for i in idx], 'net': net, 'gross': gross, 'K': K, 'hold': hold}


def report_periods(claim, test, inst, hz, tr, lag, base=1.0, note='', min_date=None):
    out = {}
    for name, lo, hi in L.PERIODS:
        if min_date and lo < min_date:
            lo = max(lo, min_date)
        mk = L.period_mask(tr['dates'], lo, hi)
        if mk.sum() == 0:
            continue
        s = L.summary(tr['net'][mk], base, lag)
        g = float(tr['gross'][mk].mean())
        s['tg'] = L.nw_t(tr['gross'][mk], base, lag)
        add(claim, test, inst, hz, name, s, base, note, gross=g, extra={'t_gross': s['tg']})
        out[name] = s | {'gross': g}
    return out


H = 15

def paths(m, delta, ivmult=1.0):
    d_, S_, iv_, r_, q_ = m['dates'], m['S'], m['iv'] * ivmult, m['r'], m['q']
    ex_ = L.expiry_index(d_)
    idx = np.array([i for i in range(len(d_)) if ex_[i] > 0 and i + H < ex_[i]])
    e = ex_[idx]
    T0 = np.array([(d_[j] - d_[i]).days / 365.0 for i, j in zip(idx, e)])
    K = L.strike_for_delta(S_[idx], T0, iv_[idx], r_[idx], q_[idx], delta, 'C')
    cost = L.bs(S_[idx], K, T0, iv_[idx], r_[idx], q_[idx], 'C') * (1 + L.HALF_SPREAD)
    B = np.zeros((len(idx), H))
    for k in range(1, H + 1):
        x = idx + k
        Tk = np.array([(d_[j] - d_[xx]).days / 365.0 for xx, j in zip(x, e)])
        B[:, k - 1] = L.bs(S_[x], K, Tk, iv_[x], r_[x], q_[x], 'C') * (1 - L.HALF_SPREAD) / cost
    return idx, [d_[i] for i in idx], B

RULES = {'R0 hold to day 15': dict(),
         'R1 +50% all': dict(t1=1.5),
         'R2 half +50%/half +100%': dict(split=True),
         'R3 -50% stop': dict(stop=0.5),
         'R4a +50% all, -50% stop': dict(t1=1.5, stop=0.5),
         'R4b split, -50% stop': dict(split=True, stop=0.5),
         'R5a +50% all, -50% stop, cost stop after +40% (1 contract)': dict(t1=1.5, stop=0.5, be=True),
         'R5b split, -50% stop, cost stop after +40% (2+ contracts)': dict(split=True, stop=0.5, be=True)}

def apply_rule(B, t1=None, split=False, stop=None, be=False):
    out = np.zeros(len(B))
    days = np.zeros(len(B))
    for i, row in enumerate(B):
        frac, proc, half, armed = 1.0, 0.0, False, False
        for k, b in enumerate(row):
            last = k == H - 1
            if armed and b <= 1.0:
                proc += frac * b; frac = 0; break
            if stop is not None and b <= stop:
                proc += frac * b; frac = 0; break
            if split:
                if not half and b >= 1.5:
                    proc += 0.5 * b; frac = 0.5; half = True
                if half and b >= 2.0:
                    proc += frac * b; frac = 0; break
            elif t1 is not None and b >= t1:
                proc += frac * b; frac = 0; break
            if be and b >= 1.4:
                armed = True
            if last:
                proc += frac * b; frac = 0
        out[i] = proc
        days[i] = k + 1
    return out, days


def verdict_loss(full, recent):
    """Claim: EV/$ < 1 (buyer loses)."""
    if full['t'] <= -2 and (recent['ev'] - 1) < 0 and abs(recent['ev'] - 1) >= 0.5 * abs(full['ev'] - 1):
        return 'CONFIRMED'
    if full['ev'] < 1 and full['t'] <= -1:
        return 'WEAK'
    return 'REJECTED'


def main():
    g = L.market('GSPC')
    dates, S = g['dates'], g['S']
    n = len(dates)
    print('GSPC', dates[0], dates[-1], n, 'q range', g['q'].min().round(4), g['q'].max().round(4),
          'r range', g['r'].min().round(4), g['r'].max().round(4))

    # ---------------- D1a: VIX vs next-21-session realized vol
    lr = np.diff(np.log(S))
    rv = np.full(n, np.nan)
    for i in range(n - 21):
        rv[i] = np.sqrt(252.0 / 21.0 * np.sum(lr[i:i + 21] ** 2))
    vixf = g['vix'] / 100.0
    ok = ~np.isnan(rv)
    print('\nD1a  VIX vs next-21-session RV of ^GSPC')
    for name, lo, hi in L.PERIODS:
        mk = ok & L.period_mask(dates, lo, hi)
        diff = (vixf - rv)[mk] * 100
        ratio = (vixf / rv)[mk]
        share = float((vixf[mk] > rv[mk]).mean())
        t = L.nw_t(diff, 0.0, 42)
        print(f'  {name:10s} n {mk.sum():5d}  share IV>RV {share:.3f}  mean VIX/RV {ratio.mean():.3f}  median {np.median(ratio):.3f}'
              f'  mean VIX-RV {diff.mean():5.2f} pts  t {t:5.2f}')
        ROWS.append({'claim': 'D1', 'test': 'VIX minus next-21d RV (vol points)', 'instrument': '^VIX vs ^GSPC RV', 'horizon': '21',
                     'period': name, 'n': int(mk.sum()), 'ev_per_dollar': None, 'median': float(np.median(ratio)), 'hit_rate': share,
                     'baseline': 0.0, 't_nw': t, 'note': f'mean VIX/RV {ratio.mean():.3f}; mean VIX-RV {diff.mean():.2f} pts; hit_rate = share IV>RV; median = median VIX/RV'})

    # ---------------- D1b: option EV/$
    insts = [('ATM call', 'C', None), ('ATM put', 'P', None), ('0.35-delta call', 'C', 0.35)]
    d1 = {}
    print('\nD1b  model EV/$ (net of 3% spread; gross in brackets)')
    for label, kind, dl in insts:
        for hz in (10, 'exp'):
            tr = option_trades(g, kind, dl, hz)
            lag = 20 if hz == 10 else 42
            res = report_periods('D1', 'buy at VIX, EV/$ vs 1.0', label, str(hz), tr, lag)
            d1[(label, hz)] = (tr, res)
            line = '  '.join(f"{p} {res[p]['ev']:.3f} [{res[p]['gross']:.3f}] t{res[p]['t']:.1f}" for p in res)
            print(f'  {label:16s} {str(hz):4s} n {res["full"]["n"]}  med {res["full"]["median"]:.3f} hit {res["full"]["hit"]:.3f} | {line}')
    for key, (tr, res) in d1.items():
        v = verdict_loss(res['full'], res['2010-2026'])
        print('  verdict', key, v)

    # ---------------- D2: IV rank < 25%
    vix = g['vix']
    ivr = np.full(n, np.nan)
    pct = np.full(n, np.nan)
    for i in range(251, n):
        w = vix[i - 251:i + 1]
        lo, hi = w.min(), w.max()
        ivr[i] = (vix[i] - lo) / (hi - lo) if hi > lo else 0.5
        pct[i] = (w[:-1] < vix[i]).mean()
    print('\nD2  low IV rank (<25%) vs all days with IVR defined')
    d2 = {}
    for label, kind, dl in insts:
        for hz in (10, 'exp'):
            tr = d1[(label, hz)][0]
            lag = 20 if hz == 10 else 42
            for rank_name, rk, post in (('IVR', ivr, ''), ('IV percentile', pct, 'post_hoc: definition sensitivity')):
                rr = rk[tr['idx']]
                okr = ~np.isnan(rr)
                for name, lo, hi in L.PERIODS:
                    mk = okr & L.period_mask(tr['dates'], lo, hi)
                    y = tr['net'][mk]
                    D = (rr[mk] < 0.25).astype(float)
                    if D.sum() < 30:
                        continue
                    b, t = L.hac_ols(y, np.column_stack([np.ones(len(y)), D]), lag)
                    s_low = L.summary(y[D == 1], 1.0, lag)
                    s_all = L.summary(y, 1.0, lag)
                    add('D2', f'{rank_name}<25% minus other days', label, str(hz), name, s_low, s_all['ev'],
                        note=(post + '; ' if post else '') + f'baseline = all-days EV/$ {s_all["ev"]:.3f}; t_nw is for b (low minus rest); share of days low {D.mean():.2f}',
                        gross=float(tr['gross'][mk][D == 1].mean()), extra={'t_nw': float(t[1]), 'diff_vs_rest': float(b[1]),
                                                                          'diff_vs_all': float(s_low['ev'] - s_all['ev'])})
                    d2[(label, hz, rank_name, name)] = (s_low, s_all, float(b[1]), float(t[1]))
            r = {p: d2[(label, hz, 'IVR', p)] for p in ('full', '1990-2009', '2010-2026', 'last5y') if (label, hz, 'IVR', p) in d2}
            print(f'  {label:16s} {str(hz):4s} ' + '  '.join(
                f'{p}: low {v[0]["ev"]:.3f} (n {v[0]["n"]}) all {v[1]["ev"]:.3f} b {v[2]:+.3f} t {v[3]:.1f}' for p, v in r.items()))
            rp = d2.get((label, hz, 'IV percentile', 'full'))
            print(f'      [post-hoc percentile def] full: low {rp[0]["ev"]:.3f} b {rp[2]:+.3f} t {rp[3]:.1f}')

    # ---------------- D3: delta buckets
    print('\nD3  EV/$ by delta (calls; puts descriptive)')
    d3 = {}
    for kind in ('C', 'P'):
        for hz in (10, 'exp'):
            lag = 20 if hz == 10 else 42
            for dl in (0.10, 0.20, 0.30, 0.40, 0.50):
                tr = option_trades(g, kind, dl, hz)
                res = report_periods('D3', 'EV/$ by delta' + ('' if kind == 'C' else ' (puts, descriptive)'),
                                     f'{dl:.2f}-delta {"call" if kind == "C" else "put"}', str(hz), tr, lag)
                d3[(kind, hz, dl)] = tr
                print(f'  {kind} {str(hz):4s} d{dl:.2f}  ' + '  '.join(f"{p} {res[p]['ev']:.3f}[{res[p]['gross']:.3f}]" for p in res)
                      + f"  med {res['full']['median']:.3f} hit {res['full']['hit']:.3f}")
    for hz in (10, 'exp'):
        lag = 20 if hz == 10 else 42
        for other in (0.50, 0.40):
            a, b = d3[('C', hz, 0.10)], d3[('C', hz, other)]
            assert a['idx'].tolist() == b['idx'].tolist()
            for name, lo, hi in L.PERIODS:
                mk = L.period_mask(a['dates'], lo, hi)
                dif = a['net'][mk] - b['net'][mk]
                t = L.nw_t(dif, 0.0, lag)
                ROWS.append({'claim': 'D3', 'test': f'paired EV/$ 0.10-delta minus {other:.2f}-delta call', 'instrument': 'calls',
                             'horizon': str(hz), 'period': name, 'n': int(mk.sum()), 'ev_per_dollar': float(dif.mean()),
                             'baseline': 0.0, 't_nw': t, 'note': 'ev_per_dollar column holds the paired difference' +
                             ('' if other == 0.50 else '; secondary comparison with our 0.40 contract')})
                if name in ('full', '1990-2009', '2010-2026', 'last5y'):
                    print(f'  diff 0.10-{other:.2f} {str(hz):4s} {name:10s} {dif.mean():+.3f} t {t:.1f}')

    # ---------------- D4: exit rules on SPY 0.40-delta calls
    s = L.market('SPY')
    sd, sS, siv, sr, sq = s['dates'], s['S'], s['iv'], s['r'], s['q']
    sn = len(sd)
    sex = L.expiry_index(sd)
    idx4, dates4, B4 = paths(s, 0.40)
    print('\nD4  SPY', sd[0], sd[-1], 'entries', len(idx4), 'q', s['q'][-1].round(4))
    res4 = {}
    for rn, kw in RULES.items():
        res4[rn] = apply_rule(B4, **kw)
    base = res4['R0 hold to day 15'][0]
    for name, lo, hi in [('2010-2026 (registered)', date(2010, 1, 1), date(2100, 1, 1)),
                         ('1993-2009', date(1900, 1, 1), date(2010, 1, 1)),
                         ('full 1993-2026', date(1900, 1, 1), date(2100, 1, 1)),
                         ('last10y', date(2016, 10, 29), date(2100, 1, 1)),
                         ('last5y', date(2021, 10, 29), date(2100, 1, 1))]:
        mk = L.period_mask(dates4, lo, hi)
        print(f'  -- {name} n {mk.sum()}')
        for rn in RULES:
            v, dd = res4[rn]
            st = L.summary(v[mk], 1.0, 30)
            dif = v[mk] - base[mk]
            td = L.nw_t(dif, 0.0, 30) if rn != 'R0 hold to day 15' else float('nan')
            add('D4', 'exit rule on SPY 0.40-delta 30 DTE calls, every close', rn, '15', name, st, 1.0,
                note='t_nw = EV/$ vs 1.0; t_vs_hold = paired difference vs R0',
                extra={'diff_vs_hold': float(dif.mean()), 't_vs_hold': td, 'mean_days_held': float(dd[mk].mean())})
            print(f'    {rn:62s} EV {st["ev"]:.3f} med {st["median"]:.3f} hit {st["hit"]:.3f} p10 {st["p10"]:.3f} p90 {st["p90"]:.3f}'
                  f' worst {st["worst"]:.3f} t(EV-1) {st["t"]:.1f} | vs hold {dif.mean():+.4f} t {td:.1f} days {dd[mk].mean():.1f}')

    # ---------------- B2 follow-through-day signal days (my implementation, +1.25% variant)
    gv = g['vol']
    is_low = np.zeros(n, bool)
    dd252 = np.zeros(n)
    for i in range(251, n):
        is_low[i] = S[i] <= S[max(0, i - 24):i + 1].min()
        dd252[i] = S[i] / S[i - 251:i + 1].max() - 1
    sig = []
    low, day, used = None, 0, False
    for t in range(252, n):
        c = S[t]
        if low is not None and c < low:
            low, day = None, 0
        if is_low[t] and dd252[t] <= -0.05:
            low, day, used = c, 0, False
            continue
        if low is None:
            continue
        if day == 0:
            if c > S[t - 1]:
                day = 1
            continue
        day += 1
        if day >= 4 and not used and c / S[t - 1] - 1 >= 0.0125 and gv[t] > gv[t - 1] > 0:
            sig.append(dates[t]); used = True
    print('\nB2 signal days', len(sig), sig[:3], '...', sig[-5:])
    pos = {d: k for k, d in enumerate(dates4)}
    sidx = np.array([pos[d] for d in sig if d in pos])
    for name, lo, hi in [('B2 days 1993-2026', date(1900, 1, 1), date(2100, 1, 1)),
                         ('B2 days 2010-2026', date(2010, 1, 1), date(2100, 1, 1)),
                         ('B2 days 1993-2009', date(1900, 1, 1), date(2010, 1, 1))]:
        sel = np.array([k for k in sidx if lo <= dates4[k] < hi])
        print(f'  -- {name} n {len(sel)}')
        for rn in RULES:
            v = res4[rn][0][sel]
            st = L.summary(v, 1.0, 0)
            dif = v - base[sel]
            td = L.nw_t(dif, 0.0, 0) if rn != 'R0 hold to day 15' else float('nan')
            add('D4', 'exit rule on B2 follow-through days (+1.25%)', rn, '15', name, st, 1.0,
                note='signals rarely overlap; plain t (lag 0)', extra={'diff_vs_hold': float(dif.mean()), 't_vs_hold': td})
            print(f'    {rn:62s} EV {st["ev"]:.3f} med {st["median"]:.3f} hit {st["hit"]:.3f} p10 {st["p10"]:.3f} p90 {st["p90"]:.3f}'
                  f' | vs hold {dif.mean():+.4f} t {td:.1f}')

    # ---------------- regime slice for the one-liner (descriptive)
    v9 = {d: v[0] for d, v in L.load('VIX9D').items()}
    v3 = {d: v[0] for d, v in L.load('VIX3M').items()}
    print('\nRegime slice: 15 <= VIX <= 19 and VIX9D < VIX3M (descriptive)')
    for und in ('SPY', 'IWM'):
        m = s if und == 'SPY' else L.market('IWM')
        vixa = m['vix']
        for dl in (0.35, 0.40):
            ix, dts, B = paths(m, dl)
            r0, _ = apply_rule(B)
            r5, _ = apply_rule(B, **RULES['R5b split, -50% stop, cost stop after +40% (2+ contracts)'])
            tr10 = option_trades(m, 'C', dl, 10)
            trx = option_trades(m, 'C', dl, 'exp')
            for lab, vals, ixs, dd, lag in (('hold 15 (R0)', r0, ix, dts, 30), ('R5b our 2-contract rules', r5, ix, dts, 30),
                                             ('hold 10', tr10['net'], tr10['idx'], tr10['dates'], 20),
                                             ('to expiry', trx['net'], trx['idx'], trx['dates'], 42)):
                dts_arr = dd
                reg = np.array([(15 <= vixa[i] <= 19) and (d in v9) and (d in v3) and v9[d] < v3[d] for i, d in zip(ixs, dts_arr)])
                post11 = np.array([d >= date(2011, 1, 4) for d in dts_arr])
                for nm, mk in (('regime (2011-2026)', reg), ('all days 2011-2026', post11)):
                    st = L.summary(vals[mk], 1.0, lag)
                    add('regime', 'VIX 15-19 and VIX9D<VIX3M, descriptive', f'{und} {dl:.2f}-delta call', lab, nm, st, 1.0,
                        note=('IV = RVX (VIX x1.25 before 2009-09-16)' if und == 'IWM' else 'IV = VIX'))
                    print(f'  {und} d{dl:.2f} {lab:26s} {nm:20s} n {st["n"]:5d} EV {st["ev"]:.3f} med {st["median"]:.3f} hit {st["hit"]:.3f} t {st["t"]:.1f}')

    # ---------------- post-hoc checks (decided after seeing the results above; every row labelled post_hoc)
    import options_posthoc
    options_posthoc.run(g, s, add, ROWS, {'res4': res4, 'dates4': dates4, 'base': base, 'ivr': ivr, 'rv': rv, 'd1': d1,
                                            'option_trades': option_trades, 'paths': paths, 'apply_rule': apply_rule, 'RULES': RULES})

    keys = []
    for r in ROWS:
        for k in r:
            if k not in keys:
                keys.append(k)
    with open(OUT, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for r in ROWS:
            w.writerow({k: (fmt(v, 4) if isinstance(v, float) else v) for k, v in r.items()})
    print('\nwrote', OUT, len(ROWS), 'rows')


if __name__ == '__main__':
    main()
