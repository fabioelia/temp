"""Post-hoc checks for D1-D4, decided AFTER the registered results were seen. Called from options_tests.py; every CSV row is
labelled claim='post_hoc'. None of these changes a registered test or verdict; they size the model's biases and the noise.

  P1  D4 decomposition: which part of the exit rules does the work (paired differences between rules), and NW-lag robustness.
  P2  D2 mechanism: VIX / realized vol on low-IV-rank days versus other days.
  P3  Regime VRP: next-21-session realized vol relative to VIX (SPY) or RVX (IWM) in today's regime.
  P4  Skew: re-price with IV = m x VIX. (a) uniform m; (b) m by delta bucket from today's real Cboe chain (options_skewcheck.py).
"""
import sys
from datetime import date

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import options_lib as L  # noqa: E402
import options_skewcheck as SK  # noqa: E402

R0 = 'R0 hold to day 15'
R3 = 'R3 -50% stop'
R5A = 'R5a +50% all, -50% stop, cost stop after +40% (1 contract)'
R5B = 'R5b split, -50% stop, cost stop after +40% (2+ contracts)'


def regime_mask(dates, vix, v9, v3):
    return np.array([(15 <= vix[i] <= 19) and (d in v9) and (d in v3) and v9[d] < v3[d] for i, d in enumerate(dates)])


def run(g, s, add, ROWS, ctx):
    option_trades, paths, apply_rule, RULES = ctx['option_trades'], ctx['paths'], ctx['apply_rule'], ctx['RULES']
    res4, dates4 = ctx['res4'], ctx['dates4']
    print('\n==== POST-HOC ====')

    # P1 decomposition and robustness
    print('P1  D4 paired differences (NW t at lag 30 / 60 / 120; non-overlapping every 15th entry)')
    for name, lo, hi in (('2010-2026', date(2010, 1, 1), date(2100, 1, 1)), ('1993-2009', date(1900, 1, 1), date(2010, 1, 1))):
        mk = L.period_mask(dates4, lo, hi)
        for a, b in ((R3, R0), (R5B, R0), (R5A, R0), (R5B, R3), (R5A, R3), ('R1 +50% all', R0), (R5A, R5B)):
            d = res4[a][0][mk] - res4[b][0][mk]
            ts = [L.nw_t(d, 0.0, lg) for lg in (30, 60, 120)]
            dn = d[::15]
            tn = dn.mean() / (dn.std(ddof=1) / np.sqrt(len(dn)))
            ROWS.append({'claim': 'post_hoc', 'test': f'D4 paired difference: {a} minus {b}', 'instrument': 'SPY 0.40-delta call',
                         'horizon': '15', 'period': name, 'n': int(mk.sum()), 'ev_per_dollar': float(d.mean()), 'baseline': 0.0,
                         't_nw': ts[0], 'note': f'post_hoc; ev_per_dollar holds the difference; t lag60 {ts[1]:.2f}, lag120 {ts[2]:.2f}, '
                                                f'non-overlapping t {tn:.2f} (n {len(dn)})'})
            print(f'  {name} {a[:24]:24s} - {b[:24]:24s} {d.mean():+.4f}  t {ts[0]:.1f} / {ts[1]:.1f} / {ts[2]:.1f}  non-overlap {tn:.1f}')

    # P2 D2 mechanism
    vix, rv, ivr = g['vix'] / 100, ctx['rv'], ctx['ivr']
    ok = ~np.isnan(rv) & ~np.isnan(ivr)
    print('P2  VIX/RV by IV rank')
    for lab, mk in (('IVR<25%', ok & (ivr < 0.25)), ('IVR>=25%', ok & (ivr >= 0.25))):
        ratio = vix[mk] / rv[mk]
        ROWS.append({'claim': 'post_hoc', 'test': 'D2 mechanism: VIX / next-21d RV', 'instrument': lab, 'horizon': '21', 'period': 'full',
                     'n': int(mk.sum()), 'median': float(np.median(ratio)), 'hit_rate': float((vix[mk] > rv[mk]).mean()),
                     'note': f'post_hoc; mean VIX/RV {ratio.mean():.3f}; mean VIX {vix[mk].mean() * 100:.1f}; mean RV {rv[mk].mean() * 100:.1f}'})
        print(f'  {lab:9s} n {mk.sum()} mean VIX {vix[mk].mean() * 100:.1f} RV {rv[mk].mean() * 100:.1f} VIX/RV mean {ratio.mean():.3f} '
              f'median {np.median(ratio):.3f} share IV>RV {(vix[mk] > rv[mk]).mean():.3f}')

    # P3 regime VRP for SPY (vs VIX) and IWM (vs RVX)
    v9 = {d: v[0] for d, v in L.load('VIX9D').items()}
    v3 = {d: v[0] for d, v in L.load('VIX3M').items()}
    iwm = L.market('IWM')
    print('P3  next-21-session RV / index vol, today\'s regime vs all days 2011-2026')
    for und, m in (('SPY', s), ('IWM', iwm)):
        lr = np.diff(np.log(m['S']))
        n = len(m['S'])
        rvu = np.full(n, np.nan)
        for i in range(n - 21):
            rvu[i] = np.sqrt(252.0 / 21.0 * np.sum(lr[i:i + 21] ** 2))
        reg = regime_mask(m['dates'], m['vix'], v9, v3) & ~np.isnan(rvu)
        allm = np.array([d >= date(2011, 1, 4) for d in m['dates']]) & ~np.isnan(rvu)
        for lab, mk in (('regime', reg), ('all 2011-2026', allm)):
            x = rvu[mk] / m['iv'][mk]
            ROWS.append({'claim': 'post_hoc', 'test': 'regime: next-21d RV / index vol', 'instrument': und, 'horizon': '21', 'period': lab,
                         'n': int(mk.sum()), 'median': float(np.median(x)),
                         'note': f'post_hoc; mean RV/IV {x.mean():.3f}; index vol = {"VIX" if und == "SPY" else "RVX (VIX x1.25 before 2009-09)"}'})
            print(f'  {und} {lab:14s} n {mk.sum()} RV/index-vol mean {x.mean():.3f} median {np.median(x):.3f}')

    # P4a uniform multiplier
    print('P4a uniform IV multiplier m (calls m, puts 2 - m is NOT used; puts get 1.1/1.2/1.3 above VIX)')
    for mult in (1.0, 0.9, 0.85, 0.8):
        for label, dl, kind in (('^GSPC 0.35-delta call', 0.35, 'C'), ('^GSPC 0.10-delta call', 0.10, 'C'), ('^GSPC 0.10-delta put', 0.10, 'P')):
            mm = mult if kind == 'C' else {1.0: 1.0, 0.9: 1.1, 0.85: 1.2, 0.8: 1.3}[mult]
            for hz in (10, 'exp'):
                tr = option_trades(g, kind, dl, hz, ivmult=mm)
                st = L.summary(tr['net'], 1.0, 20 if hz == 10 else 42)
                add('post_hoc', 'skew sensitivity: IV = m x VIX at entry and exit (uniform m)', label, str(hz), 'full', st, 1.0,
                    note=f'post_hoc; m = {mm}', extra={'iv_multiplier': mm})
                print(f'  m {mm:.2f} {label:24s} {str(hz):4s} EV {st["ev"]:.3f} med {st["median"]:.3f} hit {st["hit"]:.3f}')
        ix, dts, B = paths(s, 0.40, ivmult=mult)
        mk = L.period_mask(dts, date(2010, 1, 1), date(2100, 1, 1))
        for rn in (R0, R3, R5B):
            v, _ = apply_rule(B, **RULES[rn])
            st = L.summary(v[mk], 1.0, 30)
            add('post_hoc', 'skew sensitivity: IV = m x VIX at entry and exit (uniform m)', f'SPY 0.40-delta call {rn}', '15', '2010-2026',
                st, 1.0, note=f'post_hoc; m = {mult}', extra={'iv_multiplier': mult})
            print(f'  m {mult:.2f} SPY 0.40 {rn[:22]:22s} 2010-26 EV {st["ev"]:.3f} med {st["median"]:.3f}')

    # P4b multipliers by delta from today's chain
    ratios = SK.ratios()
    print('P4b today\'s chain multipliers:', {f'{k[0]} {k[1]} {k[2]:.2f}': round(v, 3) for k, v in ratios.items()})
    greg = regime_mask(g['dates'], g['vix'], v9, v3)
    print('  D3 / D1 at today\'s SPY skew (IV = bucket ratio x VIX), full sample and today\'s regime')
    for kind in ('C', 'P'):
        for dl in (0.10, 0.20, 0.30, 0.35, 0.40, 0.50):
            m = ratios[('SPY', kind, dl)]
            for hz in (10, 'exp'):
                tr = option_trades(g, kind, dl, hz, ivmult=m)
                regm = greg[tr['idx']]
                for per, mk in (('full', np.ones(len(regm), bool)), ('2010-2026', L.period_mask(tr['dates'], date(2010, 1, 1), date(2100, 1, 1))),
                                ('regime (2011-2026)', regm)):
                    st = L.summary(tr['net'][mk], 1.0, 20 if hz == 10 else 42)
                    add('post_hoc', "skew: IV = today's SPY IV/VIX for the delta bucket", f'^GSPC {dl:.2f}-delta {"call" if kind == "C" else "put"}',
                        str(hz), per, st, 1.0, note=f'post_hoc; m = {m:.3f} (Cboe chain 2026-10-28 close); applies a calm-market skew to all history',
                        extra={'iv_multiplier': m})
                p = {per: L.summary(tr['net'][mk], 1.0, 20 if hz == 10 else 42)['ev'] for per, mk in
                     (('full', np.ones(len(regm), bool)), ('2010-26', L.period_mask(tr['dates'], date(2010, 1, 1), date(2100, 1, 1))), ('regime', regm))}
                print(f'   {kind} {dl:.2f} m {m:.3f} {str(hz):4s} ' + '  '.join(f'{k} {v:.3f}' for k, v in p.items()))
    print('  One-liner at today\'s skew: regime entries (15<=VIX<=19, VIX9D<VIX3M), 2011-2026')
    for und, m in (('SPY', s), ('IWM', iwm)):
        for dl in (0.35, 0.40):
            mult = ratios[(und, 'C', dl)]
            for mm, tag in ((1.0, 'model (IV = index vol)'), (mult, f"today's skew m {mult:.3f}")):
                ix, dts, B = paths(m, dl, ivmult=mm)
                reg = regime_mask(dts, m['vix'][ix], v9, v3)
                tr10 = option_trades(m, 'C', dl, 10, ivmult=mm)
                reg10 = regime_mask(tr10['dates'], m['vix'][tr10['idx']], v9, v3)
                out = []
                for lab, vals, mk, lag in (('hold 15', apply_rule(B)[0], reg, 30), ('R5b', apply_rule(B, **RULES[R5B])[0], reg, 30),
                                           ('R5a', apply_rule(B, **RULES[R5A])[0], reg, 30), ('hold 10', tr10['net'], reg10, 20)):
                    st = L.summary(vals[mk], 1.0, lag)
                    add('post_hoc', "regime one-liner at model IV and at today's skew", f'{und} {dl:.2f}-delta call {lab}', lab,
                        'regime (2011-2026)', st, 1.0, note=f'post_hoc; {tag}', extra={'iv_multiplier': mm})
                    out.append(f'{lab} EV {st["ev"]:.3f} (t {st["t"]:.1f}, hit {st["hit"]:.2f})')
                print(f'   {und} {dl:.2f} {tag:26s} n {reg.sum()}  ' + '  '.join(out))
