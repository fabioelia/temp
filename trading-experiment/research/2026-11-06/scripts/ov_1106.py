#!/usr/bin/env python3
"""options-vol, 2026-11-06 (Run B), questions 2 and 3 for the Sunday 11/8 review (input, not a recommendation).

Q2: per-$ payoff of a 0.35-0.40 delta SPY call bought at tonight's IV multiple when ^VIX is near 25 and ^VIX9D > ^VIX3M at entry.
    Engine: research/2026-11-01/scripts/ov_backtest.py (Black-Scholes at IV = m x ^VIX, sticky ratio, half tonight's spread each way,
    the review's rates and dividends), as ov_1105.py, with tonight's entry (11/6 close quotes = a Mon 11/9 buy, goal_odds' convention)
    and H = 8 sessions (11/9 .. 11/18). ^VIX9D / ^VIX3M come from tonight's Yahoo bars (not the review cache, which is stale).
    Payoffs: hold8 (8th close), stop8 (-50% at a close, else 8th close: the goal-budget bet's exit without its rare goal sale),
    rule1 (+50% / -50% / 8th close), hedged8 (hold8 minus entry delta x the underlying move per $: the non-beta part).
    Slices fixed before any result was read: all; 2011+ (VIX9D era); VIX 23-28; VIX 23-28 & 9D>3M; VIX>=25 & 9D>3M (11/05's slice).
    The slices are POST-HOC and descriptive (evidence rules); t = Newey-West lag 24 on overlapping daily entries; "episodes" counts
    runs of entry days separated by more than H sessions.

Q3: does adding intraday stop checks change goal_odds' loss distribution? goal_odds sees one check per session (the close), so it
    cannot model a 10:00 or 12:00 check. This rebuilds its "vol"-path model (goal_odds.values, same paths, scaling and pricing) on
    1993+ entry days and adds SPY's daily open and low (Yahoo, unadjusted, as a ratio to the prior close, vol-scaled like the close):
      close   : 14:43 checks only (goal_odds; same 1993+ subset, for a like-for-like comparison)
      +open   : a stop check at the open as well (proxy for 10:00; the open is 9:30), selling at the open value
      +cont.  : continuous stop (upper bound for 10:00 + 12:00 + 14:43): sells at the open value if it gapped through -50%, else at
                exactly -50% if the day's low reaches it
    IV at an intraday check: the prior close's ^VIX ratio at the open, the same day's close ratio at the low (both understate intraday
    IV on down days, so they overstate stop-outs: still bounds). Time to expiry: that day's. The goal sale stays at the 14:43 check.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-06/scripts/ov_1106.py fetch <data_dir>   # Yahoo SPY daily OHLC (network)
  python3 -I trading-experiment/research/2026-11-06/scripts/ov_1106.py run <data_dir>     # offline
data_dir: tonight's ov_fetch.py output (Cboe chain stamp 2026-11-06 22:17 UTC; Yahoo bars to 11/06) plus yahoo_SPY_ohlc.json.
"""
import json
import math
import os
import sys
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

import numpy as np

sys.dont_write_bytecode = True
R = '/home/user/temp/trading-experiment'
sys.path.insert(0, R)
sys.path.insert(0, f'{R}/research/2026-11-01/scripts')
sys.path.insert(0, f'{R}/research/2026-11-02/scripts')
sys.path.insert(0, f'{R}/research/strategy-review/scripts')
import ov_backtest as OB  # noqa: E402
import options_lib as L  # noqa: E402
from sizing import kelly  # noqa: E402

ENTRY, END = date(2026, 11, 6), date(2026, 11, 18)
OB.ENTRY = ENTRY
OB.H = H = 8
EQ, BENCH, GOAL, VIX, IRX = 1384.84, 1917.66, 2200.0, 25.64, 4.0
SPOT = 735.29
PICK = ('SPY261218C00755000', 'SPY261204C00750000')   # 12/18: highest-OI in-band strike; 12/04: reference (OI 853, fails 1,000)
ET = ZoneInfo('America/New_York')


def fetch(out):
    import quotes
    bars, now, y = {}, int(datetime.now(timezone.utc).timestamp()) + 86400, 1993
    while True:
        a = int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())
        b = min(int(datetime(y + 10, 1, 1, tzinfo=timezone.utc).timestamp()), now)
        res = quotes.get_json(f'https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&period1={a}&period2={b}')['chart']['result'][0]
        q = res['indicators']['quote'][0]
        for t, o, h, lo, c in zip(res['timestamp'], q['open'], q['high'], q['low'], q['close']):
            if None not in (o, h, lo, c):
                bars[datetime.fromtimestamp(t, ET).date().isoformat()] = [o, h, lo, c]
        if b >= now:
            break
        y += 10
    json.dump({'fetched_at': datetime.now(ET).isoformat(), 'source': 'Yahoo v8 chart SPY 1d [open, high, low, close]', 'bars': bars},
              open(os.path.join(out, 'yahoo_SPY_ohlc.json'), 'w'))
    ds = sorted(bars)
    print('SPY OHLC', ds[0], ds[-1], len(ds), bars[ds[-1]])


def episodes(idx):
    return int(1 + np.sum(np.diff(np.sort(idx)) > H)) if len(idx) else 0


def q2(data):
    ch = OB.jload(data, 'chain_SPY.json')
    opts = {o['option']: o for o in ch['data']['options']}
    m = OB.market(data, 'SPY')
    dts = m['dates']
    m['v9'] = L.ffill_on(dts, {date.fromisoformat(k): v[1] for k, v in OB.jload(data, 'yahoo_VIX9D.json')['bars'].items() if v[1]}, back=False)
    m['v3'] = L.ffill_on(dts, {date.fromisoformat(k): v[1] for k, v in OB.jload(data, 'yahoo_VIX3M.json')['bars'].items() if v[1]}, back=False)
    vix, v9, v3 = m['vix'], m['v9'], m['v3']
    inv = v9 > v3
    near = (vix >= 23) & (vix <= 28)
    print(f'Q2: SPY chain stamp {ch["timestamp"]} UTC, close {ch["data"].get("close")}; ^VIX {VIX}; H {H} sessions; history {dts[0]} .. {dts[-1]}')
    for sym in PICK:
        o = opts[sym]
        e = date(2000 + int(sym[-15:-13]), int(sym[-13:-11]), int(sym[-11:-9]))
        dte = (e - ENTRY).days
        spr = (o['ask'] - o['bid']) / ((o['ask'] + o['bid']) / 2)
        mult = o['iv'] * 100 / VIX
        cost1 = o['ask'] * 100
        print(f'-- {sym} bid {o["bid"]:.2f} ask {o["ask"]:.2f} IV {o["iv"]:.4f} ({mult:.3f}x ^VIX) delta {o["delta"]:.3f} '
              f'OI {int(o.get("open_interest") or 0)} spread {spr:.1%} DTE {dte}; 1 contract ${cost1:,.0f}')
        sim = OB.simulate(m, 'C', abs(o['delta']), dte, mult, spr / 2)
        idx, B = sim['idx'], sim['B']
        ed = np.array([dts[i] for i in idx])
        hold = B[:, H - 1]
        stopk = np.where((B <= 0.5).any(1), B[np.arange(len(B)), np.argmax(B <= 0.5, axis=1)], hold)
        r1, h50, _, st1 = OB.rule(B, False)
        hedged = hold - sim['d0'] * (sim['Sk'][:, H - 1] - sim['S0']) / sim['cost']
        masks = {'all': np.ones(len(idx), bool), '2011+': ed >= date(2011, 1, 4),
                 'VIX 23-28': near[idx], 'VIX 23-28 & 9D>3M': (near & inv)[idx], 'VIX>=25 & 9D>3M': ((vix >= 25) & inv)[idx]}
        for pname, mk in masks.items():
            if pname != 'all' and pname != '2011+':
                mk = mk & (ed >= date(2011, 1, 4))   # VIX9D history starts 2011; VIX-only slice kept on the same era
            if mk.sum() < 30:
                print(f'   {pname}: n {mk.sum()} (too few)')
                continue
            s = {k: OB.stats(a[mk]) for k, a in (('hold', hold), ('stop', stopk), ('r1', r1), ('hed', hedged))}
            fk = kelly(stopk[mk])
            print(f'   {pname:20s} n {s["hold"]["n"]:5d} ({episodes(idx[mk])} episodes) | hold8 {s["hold"]["ev"]:.3f} (t {s["hold"]["t"]:+.1f}, '
                  f'hit {s["hold"]["hit"]:.0%}) | stop8 {s["stop"]["ev"]:.3f} (t {s["stop"]["t"]:+.1f}, stopped {(B[mk] <= 0.5).any(1).mean():.0%}) '
                  f'| rule1 {s["r1"]["ev"]:.3f} (t {s["r1"]["t"]:+.1f}) | hedged8 {s["hed"]["ev"]:.3f} (t {s["hed"]["t"]:+.1f}) '
                  f'| full Kelly stop8 ${fk * EQ:,.0f} vs ${cost1:,.0f}')


def q3(data):
    import goal_odds as G
    P = G.load_paths()
    ohlc = OB.jload(data, 'yahoo_SPY_ohlc.json')['bars']
    sd = sorted(date.fromisoformat(k) for k in ohlc)
    pos = {d: i for i, d in enumerate(sd)}
    O = np.array([ohlc[d.isoformat()][0] for d in sd])
    Lo = np.array([ohlc[d.isoformat()][2] for d in sd])
    C = np.array([ohlc[d.isoformat()][3] for d in sd])
    rows = [i for i, d in enumerate(P['date']) if d in pos and pos[d] + H < len(sd) and d >= date(1993, 2, 1)]
    rows = np.array(rows)
    j0 = np.array([pos[P['date'][i]] for i in rows])
    k = np.arange(1, H + 1)
    ro = np.log(O[j0[:, None] + k] / C[j0[:, None] + k - 1])    # open vs prior close, per session
    rl = np.log(Lo[j0[:, None] + k] / C[j0[:, None] + k - 1])   # low vs prior close
    sub = {key: (P[key][rows] if P[key].ndim == 1 else P[key][rows]) for key in P if key != 'date'}
    sub['date'], sub['idx'] = P['date'][rows], np.arange(len(rows))
    steps = G.sessions_after(ENTRY, END)
    assert len(steps) == H
    r = IRX / 100
    g, _ = G.scaled(sub, H, VIX, None, r, 'vol')                 # vol-scaled ^GSPC close ratios (goal_odds "vol")
    sg = (VIX / sub['vix0'])[:, None]
    gprev = np.hstack([np.ones((len(rows), 1)), g[:, :-1]])
    S_open = gprev * np.exp(sg * ro)
    S_low = np.minimum(gprev * np.exp(sg * rl), S_open)
    volr = sub['v'][:, :H] / sub['vix0'][:, None]
    volr_prev = np.hstack([np.ones((len(rows), 1)), volr[:, :-1]])
    ok = ~(np.isnan(g).any(1) | np.isnan(S_open).any(1) | np.isnan(S_low).any(1) | np.isnan(volr).any(1))
    print(f'\nQ3: goal_odds "vol" paths on 1993+ entry days with SPY open/low: {ok.sum():,} paths {sub["date"][ok][0]} .. {sub["date"][ok][-1]}; '
          f'entry {ENTRY} (quotes), checks {steps[0]:%m/%d} .. {steps[-1]:%m/%d}')
    chain = {o['option']: o for o in OB.jload(data, 'chain_SPY.json')['data']['options']}
    for sym in PICK:
        o = chain[sym]
        K = int(sym[-8:]) / 1000
        e = date(2000 + int(sym[-15:-13]), int(sym[-13:-11]), int(sym[-11:-9]))
        T = np.array([(e - d).days / 365 for d in steps])[None, :]
        bid, ask, iv = o['bid'], o['ask'], o['iv']
        mid0 = (bid + ask) / 2
        scale = mid0 / float(G.bs_call(SPOT, K, (e - ENTRY).days / 365, iv, r))
        hs = (ask - bid) / (2 * mid0)
        val = lambda S, vr: G.bs_call(SPOT * S, K, T, iv * vr, r) * scale * (1 - hs) / ask  # noqa: E731
        mc, mo, ml = val(g[ok], volr[ok]), val(S_open[ok], volr_prev[ok]), val(S_low[ok], volr[ok])
        chk, _ = G.values(sub, 'SPY', SPOT, K, bid, ask, iv, ENTRY, e, steps, VIX, None, r, 'index', mode='vol')
        assert np.allclose(chk[ok], mc)   # same as goal_odds
        cost = ask * 100
        spy_end = BENCH * g[ok][:, -1]
        grp = G.hd.groups(np.where(ok)[0])
        print(f'-- 1 x {sym} at ask {ask:.2f} (${cost:,.0f}); bid {bid:.2f}, IV {iv:.4f}')
        print(f'   {"checks":8s} {"P($2,200)":>9s} {"P(>SPY)":>8s} {"P(<$1,000)":>10s} {"P(stop)":>8s} {"EV/$":>6s} {"p5":>6s} {"p10":>6s} '
              f'{"p25":>6s} {"median":>7s} {"stopped but would have hit $2,200 / ended above entry, close-only":>10s}')
        res = {}
        for name in ('close', '+open', '+cont.'):
            n, N = mc.shape
            mult, reached, stopped, sk = np.empty(n), np.zeros(n, bool), np.zeros(n, bool), np.full(n, -1)
            for i in range(n):
                for kk in range(N):
                    if name != 'close':
                        if mo[i, kk] <= 0.5:
                            mult[i], stopped[i], sk[i] = mo[i, kk], True, kk; break
                        if name == '+cont.' and ml[i, kk] <= 0.5:
                            mult[i], stopped[i], sk[i] = 0.5, True, kk; break
                    if EQ - cost + cost * mc[i, kk] >= GOAL:
                        mult[i], reached[i] = mc[i, kk], True; break
                    if mc[i, kk] <= 0.5:
                        mult[i], stopped[i], sk[i] = mc[i, kk], True, kk; break
                else:
                    mult[i] = mc[i, -1]
            fin = EQ - cost + cost * mult
            res[name] = dict(mult=mult, reached=reached, stopped=stopped, fin=fin)
        base = res['close']
        _, _, reach_ns, _ = G.goal_exit(mc, EQ, cost, GOAL, None)       # no-stop path outcome, for "stopped then recovered"
        nostop_fin = G.goal_exit(mc, EQ, cost, GOAL, None)[0]
        for name, x in res.items():
            fin = x['fin']
            pc = np.percentile(fin, [5, 10, 25, 50])
            extra = x['stopped'] & ~base['stopped']
            rec = f'{(extra & reach_ns).mean():.1%} / {(extra & (nostop_fin > EQ)).mean():.1%}' if name != 'close' else '-'
            # CI on EV and P(<$1,000) by goal_odds' episode bootstrap
            rng = np.random.default_rng(7)
            bev, bfl = [], []
            for _ in range(500):
                pick = np.concatenate([grp[j] for j in rng.integers(0, len(grp), len(grp))])
                bev.append(x['mult'][pick].mean()); bfl.append((fin[pick] < 1000).mean())
            print(f'   {name:8s} {x["reached"].mean():9.1%} {(fin > spy_end).mean():8.1%} {(fin < 1000).mean():10.1%} {x["stopped"].mean():8.1%} '
                  f'{x["mult"].mean():6.3f} {pc[0]:6.0f} {pc[1]:6.0f} {pc[2]:6.0f} {pc[3]:7.0f}   {rec}'
                  f'   [EV CI {np.percentile(bev, 2.5):.3f}-{np.percentile(bev, 97.5):.3f}; P(<$1,000) CI {np.percentile(bfl, 2.5):.1%}-{np.percentile(bfl, 97.5):.1%}]')
        d = res['+cont.']['mult'] - base['mult']
        print(f'   continuous vs close-only, per path: EV/$ {d.mean():+.3f}; paths changed {np.mean(d != 0):.1%}; '
              f'of those, worse {np.mean(d[d != 0] < 0):.0%}')


if __name__ == '__main__':
    cmd, data = sys.argv[1], sys.argv[2]
    if cmd == 'fetch':
        fetch(data)
    else:
        q2(data)
        q3(data)
