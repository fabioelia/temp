#!/usr/bin/env python3
"""options-vol 2026-11-12 (Run B) wrapper, input for the CSCO C1 check Fri 11/13 14:43 (not a recommendation).

Runs the committed research/2026-11-08/scripts/ov_1108.py q1 UNCHANGED except its two constants (equity $1,389.81, brief 11/12;
SGOV reserve 2.636818 x 100.53 = $265.08, quotes.py closes 11/12 yahoo+cboe), then, with the same engine (catalyst_watch.Payoffs,
sizing.kelly; options_vol_gate.bs_put r 4%, q 0; ask = BS x 1.025 as fit_1104.py; 2.50 strike grid; 35/365):
  A  RV20 to the 11/12 close (Yahoo adjusted closes; ddof 1, sqrt 252 = catalyst_watch.rv); last close asserted = 102.01 (quotes.py).
  B  tonight's Cboe chain: 12/18 puts 75-110 (spread % of mid, IV, k = IV / RV20, delta, OI, gates); weeklies 11/27, 12/04, 12/11 put OI.
  C  band strikes (|delta| 0.30-0.45, 35 DTE) at -8/-10/-12% gaps from 102.01, at sticky-strike IV (tonight's quote per strike),
     the ex-event guesses (x1.04, x1.21; options_vol_gate.ex_event) and flat 35/40/45/50%.
  D  ask ceiling by quoted IV (35 DTE full Kelly at k = IV / RV20, capped at the reserve), plus a 5% spread sensitivity.
  E  fit: at each gap spot, the IV window where the cheapest in-band put's model ask <= the ceiling.
  F  the two R1 numbers at 35 DTE: break-even win rate p* = L / (W + L) vs the C1 sample's share of payoffs > 1 (n 216);
     the CSCO break-even price at session 5 for the cheapest in-band put at the line; the drift-matched baseline (same 216 windows:
     the stock's ret5, SPY's spy5; unconditional 5-session drift of the 25 names and SPY since 2004-11; SGOV carry on $265 for 7 days).
Fixed before reading any output.

  python3 -I run_1112.py <earnings_cache> <vix_csv> <csco_yahoo_json> <cboe_chain_json>
"""
import importlib.util
import json
import math
import sys
from datetime import date, datetime, timezone
from pathlib import Path

import numpy as np

R = Path('/home/user/temp/trading-experiment')
spec = importlib.util.spec_from_file_location('ov_1108', R / 'research/2026-11-08/scripts/ov_1108.py')
ov = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ov)
ov.EQ = 1389.81
ov.RESERVE = round(2.636818 * 100.53, 2)
CLOSE = 102.01          # quotes.py closes 2026-11-12: yahoo+cboe official close, 2 sources, spread 0.00%
LINE = round(0.92 * CLOSE, 2)
GAPS = (-0.08, -0.10, -0.12)
T = 35 / 365
RF = 0.04

cache, vix_csv, yj, chain = sys.argv[1:5]
ov.q1(cache, vix_csv)

sizing = ov.load(R / 'research/strategy-review/scripts/sizing.py', 'sizing')
cw = ov.load(R / 'research/2026-11-01/scripts/catalyst_watch.py', 'catalyst_watch')
ovg = ov.load(R / 'research/2026-10-29/scripts/options_vol_gate.py', 'options_vol_gate')
pay = cw.Payoffs(sizing, cache)

# A  RV20
res = json.load(open(yj))['chart']['result'][0]
ts = [datetime.fromtimestamp(t, tz=timezone.utc).date() for t in res['timestamp']]
adj = res['indicators']['adjclose'][0]['adjclose']
px = [(d, a) for d, a in zip(ts, adj) if a is not None]
assert px[-1][0] == date(2026, 11, 12) and abs(px[-1][1] - CLOSE) < 0.01, px[-1]
w = px[-21:]
lr = np.diff(np.log([a for _, a in w]))
RV = cw.rv(lr)
rv_prev = cw.rv(np.diff(np.log([a for _, a in px[-22:-1]])))
print(f'\n=== A  RV20 to 11/12: {RV:.2%} (21 closes {w[0][0]}..{w[-1][0]}, 20 log returns, ddof 1, x sqrt 252); '
      f'to 11/11 {rv_prev:.2%}; 1.3x gate {1.3 * RV:.2%}; mean |r| {np.mean(np.abs(lr)):.2%}')
print('  returns: ' + ', '.join(f'{d:%m/%d} {math.exp(x) - 1:+.2%}' for (d, _), x in zip(w[1:], lr)))
print(f'  left the window tonight: {px[-21][0]:%m/%d} {px[-21][1] / px[-22][1] - 1:+.2%}')

# B  chain
ts_c, meta, rows = ovg.load_chain(chain)
print(f'\n=== B  Cboe chain stamp {ts_c}; close {meta.get("close")}; last_trade_time {meta.get("last_trade_time")}; '
      f'current_price {meta.get("current_price")} (extended-hours print, not a close); iv30 {meta.get("iv30")}')
e1218 = date(2026, 12, 18)
iv_by_k = {}
for x in sorted((x for x in rows if x['exp'] == e1218 and x['cp'] == 'P' and 75 <= x['K'] <= 110), key=lambda x: x['K']):
    mid = (x['bid'] + x['ask']) / 2
    sp = (x['ask'] - x['bid']) / mid if mid else float('nan')
    iv_by_k[x['K']] = x['iv']
    g = [n for n, ok in (('spread', sp <= 0.05), ('OI', x['oi'] >= 1000), ('IV', x['iv'] <= 1.3 * RV)) if not ok]
    print(f'  {x["sym"]} {x["bid"]:.2f}/{x["ask"]:.2f} spread {sp:6.1%} IV {x["iv"]:.1%} k {x["iv"] / RV:.2f} d {x["delta"]:+.2f} '
          f'OI {x["oi"]:5d}' + (f'  fails {",".join(g)}' if g else '  passes spread/OI/IV'))
for e in (date(2026, 11, 27), date(2026, 12, 4), date(2026, 12, 11), e1218):
    ps = [x for x in rows if x['exp'] == e and x['cp'] == 'P']
    near = sorted((x for x in ps if 80 <= x['K'] <= 100), key=lambda x: x['K'])
    print(f'  {e:%m/%d} ({(e - date(2026, 11, 13)).days} DTE from 11/13) puts: max OI {max(x["oi"] for x in ps)} '
          f'(K {max(ps, key=lambda x: x["oi"])["K"]:g}); >=1000: {[x["K"] for x in ps if x["oi"] >= 1000]}; 80-100: '
          + ', '.join(f'{x["K"]:g} {x["oi"]}' for x in near))
base, ev_sd, pts = ovg.ex_event(rows, date(2026, 11, 12), date(2026, 11, 13), CLOSE)
print(f'  ex-event IV {base:.1%}; event-day sd {ev_sd:.1%}; post-gap guess x1.04 {1.04 * base:.1%} (k {1.04 * base / RV:.2f}), '
      f'x1.21 {1.21 * base:.1%} (k {1.21 * base / RV:.2f}); term ' + ', '.join(f'{t}d {v:.1%}' for t, v in pts))

# C  band strikes at the gaps
grid = np.arange(60, 110.01, 2.5)


def band(S, ivf):
    out = []
    for K in grid:
        iv = ivf(K)
        if not iv:
            continue
        p, dl = ovg.bs_put(S, K, T, iv, RF)
        if 0.30 <= -dl <= 0.45:
            out.append((K, -dl, p * 1.025, iv))
    return out


print('\n=== C  in-band strikes (|delta| 0.30-0.45, 35 DTE, r 4%): strike (delta, model ask = BS x 1.025, IV)')
scen = [('sticky-strike (tonight IV)', lambda K: iv_by_k.get(K)), (f'ex-event x1.04 {1.04 * base:.1%}', lambda K: 1.04 * base),
        (f'ex-event x1.21 {1.21 * base:.1%}', lambda K: 1.21 * base)] + [(f'flat {v:.0%}', (lambda v: lambda K: v)(v)) for v in (0.35, 0.40, 0.45, 0.50)]
for gp in GAPS:
    S = CLOSE * (1 + gp)
    print(f'  gap {gp:+.0%} -> spot {S:.2f}')
    for name, f in scen:
        b = band(S, f)
        print(f'    {name:28s}: ' + ('; '.join(f'{K:g}P (d {d:.2f}, {a:.2f}, IV {iv:.1%})' for K, d, a, iv in b) or 'none'))

# D  ceiling table by quoted IV
print(f'\n=== D  ask ceiling by quoted IV, 35 DTE, equity ${ov.EQ:,.2f}, reserve ${ov.RESERVE:.2f}, RV20 {RV:.2%}')
print('  IV     k     full Kelly $ (EV/$)   ceiling | 5% spread: full $, ceiling')
ceil = {}
for iv in np.round(np.arange(0.30, 0.6001, 0.025), 3):
    k = iv / RV
    rr = pay(k, dte=35)
    f = sizing.kelly(rr) * ov.EQ
    f5 = sizing.kelly(pay(k, dte=35, half_spread=0.025)) * ov.EQ
    ceil[iv] = min(f, ov.RESERVE) / 100
    print(f'  {iv:.1%}  {k:.2f}  ${f:5.0f} ({rr.mean():.3f})        {ceil[iv]:.2f}   | ${f5:5.0f}, {min(f5, ov.RESERVE) / 100:.2f}')
ks = np.arange(0.70, 1.4001, 0.005)
fk = [(k, sizing.kelly(pay(k, dte=35)) * ov.EQ) for k in ks]
k_res = max(k for k, f in fk if f >= ov.RESERVE)
k_zero = min(k for k, f in fk if f <= 0)
print(f'  ceiling = 2.65 (reserve binds) up to k {k_res:.3f} = IV {k_res * RV:.1%}; full Kelly $0 from k {k_zero:.3f} = IV {k_zero * RV:.1%}')

# E  fit at the gap spots
ivs = np.round(np.arange(0.250, 0.6501, 0.001), 3)
cap = {iv: min(sizing.kelly(pay(iv / RV, dte=35)) * ov.EQ, ov.RESERVE) / 100 for iv in ivs}
print('\n=== E  fit: IV window where the cheapest in-band put (flat IV) has model ask <= ceiling')
for gp in GAPS + (-0.09, -0.11, -0.14):
    S = CLOSE * (1 + gp)
    fits = []
    for iv in ivs:
        b = band(S, lambda K: iv)
        if b:
            c = min(b, key=lambda z: z[2])
            if c[2] <= cap[iv]:
                fits.append((iv, c))
    if not fits:
        print(f'  gap {gp:+.0%} (S {S:.2f}): no IV in 25-65% fits')
        continue
    wins, cur = [], [fits[0]]
    for f in fits[1:]:
        if round(f[0] - cur[-1][0], 3) <= 0.001:
            cur.append(f)
        else:
            wins.append(cur)
            cur = [f]
    wins.append(cur)
    print(f'  gap {gp:+.0%} (S {S:.2f}): ' + ' + '.join(
        f'IV {w_[0][0]:.1%}-{w_[-1][0]:.1%} (k {w_[0][0] / RV:.2f}-{w_[-1][0] / RV:.2f}; {w_[-1][1][0]:g}P ask {w_[-1][1][2]:.2f} '
        f'd {w_[-1][1][1]:.2f} at top)' for w_ in wins))

# F  the two R1 numbers
print('\n=== F  R1 numbers (35 DTE, C1 payoffs n 216)')
for k in (0.80, 0.90, 1.00, 1.10, 1.20, 1.30):
    rr = pay(k, dte=35)
    win = rr > 1.0
    W = (rr[win] - 1).mean()
    L = (1 - rr[~win]).mean()
    print(f'  k {k:.2f} (IV {k * RV:.1%}): EV {rr.mean():.3f}/$; win share {win.mean():.1%} (W +{W:.1%}, L -{L:.1%}); '
          f'break-even win rate p* = L/(W+L) {L / (W + L):.1%}; median {np.median(rr):.3f}; lost >= half {np.mean(rr <= 0.5):.0%}')
ret, cal = pay.ret, pay.cal
print(f'  stock ret5 on the 216 windows: mean {ret.mean():+.2%}, median {np.median(ret):+.2%}, down share {np.mean(ret < 0):.0%}; '
      f'mean cal days {cal.mean():.1f}')
sys.path.insert(0, str(R / 'research/2026-10-30/scripts'))
import c1_vix_split as vs
rows_ev = [r for r in vs.build_rows(Path(cache)) if r['gap'] <= -0.08]
ok = [r for r in rows_ev if not any(math.isnan(r.get(k, float('nan'))) for k in ('ret5', 'cal5', 'rv_pre'))]
spy5 = np.array([r['spy5'] for r in ok])
print(f'  SPY over the same 5 sessions: mean {spy5.mean():+.2%}, median {np.median(spy5):+.2%}')
ea = pay.ea
spy_map = ea.load_prices(Path(cache), 'SPY')
sess = sorted(d for d in spy_map if d >= date(2004, 11, 1))
Sx = np.array([spy_map[d] for d in sess])
allr = []
for tk in vs.CIKS:
    m = ea.load_prices(Path(cache), tk)
    p = np.array([m.get(d, np.nan) for d in sess])
    r5 = p[5:] / p[:-5] - 1
    allr.append(r5[~np.isnan(r5)])
allr = np.concatenate(allr)
s5 = Sx[5:] / Sx[:-5] - 1
print(f'  unconditional 5-session drift since 2004-11: 25 names mean {allr.mean():+.2%} (n {len(allr)}), SPY mean {s5.mean():+.2%}')
print(f'  SGOV carry on ${ov.RESERVE:.0f} for 7 days at ~4.0%: ${ov.RESERVE * 0.04 * 7 / 365:.2f}')
# CSCO break-even at session 5 for the cheapest in-band put at the line, same IV in and out, sell at BS x 0.985
for iv in (round(1.04 * base, 3), 0.40, 0.45):
    b = band(LINE, lambda K: iv)
    if not b:
        continue
    K, d, a, _ = min(b, key=lambda z: z[2])
    lo, hi = 50.0, 150.0
    for _ in range(80):
        m_ = (lo + hi) / 2
        v = ovg.bs_put(m_, K, 28 / 365, iv, RF)[0] * 0.985
        lo, hi = (m_, hi) if v > a else (lo, m_)
    be = (lo + hi) / 2
    mv = be / LINE - 1
    z = (math.log(be / LINE) - (RF - 0.5 * iv * iv) * 7 / 365) / (iv * math.sqrt(7 / 365))
    print(f'  at the line {LINE} IV {iv:.1%}: cheapest band {K:g}P d {d:.2f} model ask {a:.2f}; break-even 11/20 price {be:.2f} '
          f'({mv:+.2%}); C1 share with ret5 <= that {np.mean(ret <= mv):.1%}; implied (risk-neutral) P(S5 <= BE) {ovg.N.cdf(z):.1%}; '
          f'ceiling at this IV {cap.get(round(iv, 3), float("nan")):.2f}')
