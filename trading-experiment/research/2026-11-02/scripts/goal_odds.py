#!/usr/bin/env python3
"""Goal odds for buying a call now: the historian's 2026-11-01 model (historian_call_double.py), with its hard-coded inputs as arguments.

Run (from /home/user/temp), e.g. at the Wed 11/4 14:43 check with the live quote:
  python3 -I trading-experiment/research/2026-11-02/scripts/goal_odds.py --underlying SPY --entry-date 2026-11-04 --end-date 2026-11-18 \
      --spot 752.10 --strike 765 --expiry 2026-11-30 --bid 8.35 --ask 8.42 --iv 0.1495 --vix 21.15 \
      --equity 1917.92 --spy-bench-equity 1961.50 --goal 2200 [--stop 0.5] [--irx 3.97]
Needs the historian's paths13.csv (historian_base_rates.py; rebuild: historian_hist_fetch.py, then historian_base_rates.py).

Model (the historian's, numbers unchanged; tests/test_goal_odds.py checks it against historian_call_double.py):
  * Sessions: N = NYSE sessions after --entry-date through --end-date (holidays from config.json). The entry day's own move is already in
    a 14:43 spot; each later session is one 14:43 check, modelled with that session's close. The historian's case (10/30-close quotes for
    a Monday 11/2 entry, day 1 = 11/2) is --entry-date 2026-10-30: 13 sessions. paths13.csv holds 13 sessions, so N is at most 13.
  * Paths: every entry day 1990-2026 with ^VIX; the first N sessions of its ^GSPC (SPY) or ^NDX (QQQ) path are applied to --spot.
    "vol" (default): log returns, net of the unconditional mean daily log return, rescaled by --vix over that day's ^VIX (--vxn over
    ^VXN for QQQ; ^VIX x 1.21 before 2001). "raw": as they happened. "volrf": "vol" with the drift set to the T-bill rate.
  * IV on day k: --iv x (vol index on day k / on day 0) from the same episode ("index", default), or constant ("const").
  * Black-Scholes, r = --irx, q = 0, T = calendar days / 365, scaled to reproduce the quoted mid at entry. Every exit is at the model
    mid less half the quoted spread. m = that value per $ of the ask paid. Equity at a check = --equity - premium + premium x m
    (premium = contracts x ask x 100; fees are ignored, as in the historian's model).
  * Exits: sell at the first check with equity >= --goal; with a stop, sell at the first check with m <= 1 - --stop; else sell at the
    --end-date check. Cash = no trade. SPY buy-and-hold ends at --spy-bench-equity x SPY's (^GSPC) path ratio; "ahead" = strictly above.
  * 95% CIs: the historian's bootstrap groups (hd.groups: episodes, or 63-day blocks when there are fewer than 20, as for all days),
    --boot resamples with seed --seed; one set of resamples serves every statistic.
"""
import argparse
import json
import math
import os
import sys
from datetime import date, timedelta
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True   # leave no .pyc beside the historian's dated scripts
ROOT = Path(__file__).resolve().parents[3]   # trading-experiment/
sys.path.insert(0, str(ROOT / 'research' / '2026-11-01' / 'scripts'))
import historian_call_double as hd  # noqa: E402  (reused: ncdf, load_paths, groups, VXN_VIX, CACHE)

PCTS = (5, 10, 25, 50, 75, 90, 95)
EXITS = ('goal_stop', 'goal', 'cash')


# ---------------------------------------------------------------- calendar
def holidays():
    with open(ROOT / 'config.json') as f:
        return {date.fromisoformat(x) for x in json.load(f)['holidays']}


def sessions_after(entry, end, hol=None):
    """NYSE sessions in (entry, end]: the 14:43 checks after a buy on `entry`."""
    hol = holidays() if hol is None else hol
    out, d = [], entry
    while d < end:
        d += timedelta(days=1)
        if d.weekday() < 5 and d not in hol:
            out.append(d)
    return out


# ---------------------------------------------------------------- the historian's model, parameterized
def bs_call(S, K, T, sig, r):
    """hd.bs_call with the rate as an argument."""
    S, T, sig = np.asarray(S, float), np.asarray(T, float), np.asarray(sig, float)
    sq = sig * np.sqrt(T)
    d1 = (np.log(S / K) + (r + 0.5 * sig * sig) * T) / sq
    return S * hd.ncdf(d1) - K * np.exp(-r * T) * hd.ncdf(d1 - sq)


def scaled(P, n, vix_now, vxn_now, r, mode='vol'):
    """hd.scaled for sessions 1..n, with today's vol indexes and the rate as arguments: (SPY, QQQ) path ratios."""
    g, nn = P['g'][:, :n], P['n'][:, :n]
    if mode == 'raw':
        return g, nn
    sg = (vix_now / P['vix0'])[:, None]
    vxn0 = np.where(np.isnan(P['vxn0']), P['vix0'] * hd.VXN_VIX, P['vxn0'])
    sn = ((np.nan if vxn_now is None else vxn_now) / vxn0)[:, None]
    k = np.arange(1, n + 1)[None, :]
    lg, ln_ = np.log(g), np.log(nn)
    mg, mn = np.nanmean(lg[:, 0]), np.nanmean(ln_[:, 0])   # unconditional mean daily log return, kept (only the deviation is rescaled)
    if mode == 'volrf':
        rf = math.log(1 + r) / 252
        return np.exp(rf * k + sg * (lg - mg * k)), np.exp(rf * k + sn * (ln_ - mn * k))
    return np.exp(mg * k + sg * (lg - mg * k)), np.exp(mn * k + sn * (ln_ - mn * k))


def values(P, und, S0, K, bid, ask, iv0, entry, expiry, steps, vix_now, vxn_now, r, iv_model='index', spread=None, mode='vol'):
    """hd.values with the dates, vol indexes and rate as arguments: bid-side value multiples (per $ of ask) at each check, and the
    (SPY, underlying) path ratios."""
    n = len(steps)
    g, nn = scaled(P, n, vix_now, vxn_now, r, mode)
    ratio = g if und == 'SPY' else nn
    if und == 'SPY':
        volr = P['v'][:, :n] / P['vix0'][:, None]
    else:
        has = ~np.isnan(P['vxn0'])
        volr = np.where(has[:, None], P['x'][:, :n] / np.where(has, P['vxn0'], 1)[:, None], P['v'][:, :n] / P['vix0'][:, None])
    T = np.array([(expiry - d).days / 365 for d in steps])[None, :]
    T0 = (expiry - entry).days / 365
    sig = iv0 * (volr if iv_model == 'index' else np.ones_like(volr))
    mid0 = (bid + ask) / 2
    scale = mid0 / float(bs_call(S0, K, T0, iv0, r))
    hs = (ask - bid) / (2 * mid0) if spread is None else spread / 2
    return bs_call(S0 * ratio, K, T, sig, r) * scale * (1 - hs) / ask, g


def goal_exit(m, equity, cost, goal, stop_mult=None):
    """Per path: final equity, exit multiple, goal reached, stopped. Sell at the first check with equity >= goal or (with a stop)
    m <= stop_mult, else at the last check. With no stop this is the historian's GOAL path."""
    eq = equity - cost + cost * m
    at_goal = eq >= goal
    at_stop = np.zeros_like(at_goal) if stop_mult is None else m <= stop_mult
    trig = at_goal | at_stop
    fired = trig.any(1)
    i, k = np.arange(len(m)), np.where(fired, np.argmax(trig, axis=1), m.shape[1] - 1)
    mult = m[i, k]
    reached = fired & at_goal[i, k]
    return equity - cost + cost * mult, mult, reached, fired & ~reached


def move_needed(S0, K, bid, ask, iv0, entry, expiry, day, r, target):
    """Underlying move for the bid-side value to reach `target` x the ask on `day`, at constant IV (as hd.thresholds)."""
    mid0 = (bid + ask) / 2
    scale = mid0 / float(bs_call(S0, K, (expiry - entry).days / 365, iv0, r))
    hs = (ask - bid) / (2 * mid0)
    T = (expiry - day).days / 365
    f = lambda x: float(bs_call(S0 * (1 + x), K, T, iv0, r)) * scale * (1 - hs) / ask   # noqa: E731
    lo, hi = -0.5, 1.0
    if f(hi) < target:
        return math.inf
    for _ in range(60):
        x = (lo + hi) / 2
        lo, hi = (x, hi) if f(x) < target else (lo, x)
    return hi


def load_paths():
    path = os.path.join(hd.CACHE, 'paths13.csv')
    if not os.path.exists(path):
        raise SystemExit(f'{path} is missing: run historian_hist_fetch.py, then historian_base_rates.py (research/2026-11-01/scripts)')
    return hd.load_paths()


# ---------------------------------------------------------------- the odds
def model(*, underlying, entry, end, spot, strike, expiry, bid, ask, iv, vix, equity, bench, goal=2200.0, stop=0.5, irx=3.97,
          vxn=None, contracts=1, floor=1600.0, mode='vol', iv_model='index', n_boot=1000, seed=7, P=None, sensitivity=True):
    """Odds of the goal exits (with and without the stop) and the cash path. Returns a dict (see report())."""
    und = underlying.upper()
    if und not in ('SPY', 'QQQ'):
        raise ValueError('underlying must be SPY (^GSPC paths) or QQQ (^NDX paths)')
    if und == 'QQQ' and vxn is None:
        raise ValueError('QQQ needs --vxn')
    if not 0 < bid < ask:
        raise ValueError('need 0 < bid < ask')
    if not 0 < iv < 3:
        raise ValueError('pass IV as a decimal, e.g. 0.1351')
    if not 0 < stop < 1:
        raise ValueError('--stop is the loss fraction that triggers the stop, e.g. 0.5 for -50%')
    steps = sessions_after(entry, end)
    if not 1 <= len(steps) <= hd.H:
        raise ValueError(f'{len(steps)} sessions in ({entry}, {end}]; the cached paths hold 1-{hd.H}')
    if expiry <= end:
        raise ValueError('expiry must be after the end date (the model has no expiry-day payoff)')
    P = load_paths() if P is None else P
    r = irx / 100
    n = len(steps)
    cost = contracts * ask * 100

    def run(mode_, ivm):
        m, g = values(P, und, spot, strike, bid, ask, iv, entry, expiry, steps, vix, vxn, r, ivm, mode=mode_)
        ok = ~np.isnan(m).any(1)
        return m[ok], g[ok], P['idx'][ok]

    m, g, rows = run(mode, iv_model)
    spy_end = bench * g[:, -1]
    paths = {}
    for name, sm in (('goal_stop', 1 - stop), ('goal', None)):
        final, mult, reached, stopped = goal_exit(m, equity, cost, goal, sm)
        paths[name] = dict(final=final, mult=mult, reached=reached, stopped=stopped)
    paths['cash'] = dict(final=np.full(len(m), float(equity)), mult=None, reached=np.full(len(m), equity >= goal),
                         stopped=np.zeros(len(m), bool))

    stats = {}
    for name, p in paths.items():
        stats[name] = {
            'p_goal': lambda r_, p=p: p['reached'][r_].mean(),
            'p_ahead': lambda r_, p=p: (p['final'][r_] > spy_end[r_]).mean(),
            'p_below': lambda r_, p=p: (p['final'][r_] < floor).mean(),
            'mean': lambda r_, p=p: p['final'][r_].mean(),
            'median': lambda r_, p=p: np.median(p['final'][r_]),
        }
        if p['mult'] is not None:
            stats[name]['ev'] = lambda r_, p=p: p['mult'][r_].mean()
    keys = [(e, s) for e in stats for s in stats[e]]
    every = np.arange(len(m))
    point = {e: {s: float(stats[e][s](every)) for s in stats[e]} for e in stats}
    rng = np.random.default_rng(seed)
    gs = hd.groups(rows)
    draws = np.empty((n_boot, len(keys)))
    for b in range(n_boot):
        pick = np.concatenate([gs[j] for j in rng.integers(0, len(gs), len(gs))])
        draws[b] = [stats[e][s](pick) for e, s in keys]
    lo, hi = np.percentile(draws, [2.5, 97.5], axis=0) if n_boot else (np.full(len(keys), np.nan),) * 2
    ci = {e: {} for e in stats}
    for (e, s), a, z in zip(keys, lo, hi):
        ci[e][s] = (float(a), float(z))
    out = {e: dict(point[e], ci=ci[e], pcts={q: float(v) for q, v in zip(PCTS, np.percentile(paths[e]['final'], PCTS))},
                   p_stopped=float(paths[e]['stopped'].mean()),
                   p_loss75=float((paths[e]['mult'] <= 0.25).mean()) if paths[e]['mult'] is not None else 0.0) for e in EXITS}

    need = (goal - equity + cost) / cost
    T0 = (expiry - entry).days / 365
    d1 = (math.log(spot / strike) + (r + 0.5 * iv * iv) * T0) / (iv * math.sqrt(T0))
    res = dict(underlying=und, entry=entry, end=end, steps=steps, n=n, spot=spot, strike=strike, expiry=expiry, bid=bid, ask=ask, iv=iv,
               vix=vix, vxn=vxn, r=r, equity=equity, bench=bench, goal=goal, stop=stop, floor=floor, contracts=contracts, cost=cost,
               need=need, mode=mode, iv_model=iv_model, n_boot=n_boot, seed=seed, n_paths=len(m),
               first_date=P['date'][rows[0]], last_date=P['date'][rows[-1]], n_groups=len(gs),
               spread=(ask - bid) / ((ask + bid) / 2), delta=0.5 * (1 + math.erf(d1 / math.sqrt(2))),
               ev_hold=float(m[:, -1].mean()), cash_beat_level=equity / bench - 1,
               moves={d: move_needed(spot, strike, bid, ask, iv, entry, expiry, d, r, need) for d in (steps[0], steps[-1])} if need > 0 else {},
               exits=out, sens={})
    if sensitivity:
        for mode_ in ('raw', 'volrf'):
            ms, _, _ = run(mode_, iv_model)
            row = {}
            for name, sm in (('goal_stop', 1 - stop), ('goal', None)):
                _, mult, reached, _ = goal_exit(ms, equity, cost, goal, sm)
                row[name] = (float(reached.mean()), float(mult.mean()))
            res['sens'][mode_] = row
    return res


# ---------------------------------------------------------------- output
def report(res):
    pc = lambda x: f'{x:.1%}'   # noqa: E731
    usd = lambda x: f'${x:,.0f}'   # noqa: E731
    stop_lbl = f'-{res["stop"]:.0%} stop'
    end = f'{res["end"]:%m/%d}'
    print(f'goal_odds (historian 2026-11-01 model, "{res["mode"]}" paths, "{res["iv_model"]}" IV): {res["contracts"]} x {res["underlying"]} '
          f'{res["expiry"]} {res["strike"]:g}C')
    print(f'  quote: spot {res["spot"]:.2f}, bid {res["bid"]:.2f} ask {res["ask"]:.2f} (spread {res["spread"]:.1%}), IV {res["iv"]:.4f}, '
          f'VIX {res["vix"]:.2f}' + (f', VXN {res["vxn"]:.2f}' if res['vxn'] else '') + f', ^IRX {res["r"]:.2%}; BS delta {res["delta"]:.3f}')
    print(f'  entry {res["entry"]} (T {(res["expiry"] - res["entry"]).days} days); {res["n"]} sessions {res["steps"][0]:%m/%d} .. '
          f'{res["steps"][-1]:%m/%d} (14:43 checks, modelled at the close); paths: {res["n_paths"]:,} entry days '
          f'{res["first_date"]} .. {res["last_date"]}; CIs {res["n_boot"]} resamples of {res["n_groups"]} groups, seed {res["seed"]}')
    mv = ', '.join(f'{v:+.2%} by {d:%m/%d}' for d, v in res['moves'].items())
    print(f'  equity ${res["equity"]:,.2f}; premium ${res["cost"]:,.2f} ({res["cost"] / res["equity"]:.0%} of equity); ${res["goal"]:,.0f} needs the '
          f'call at {res["need"]:.3f}x the ask (bid {res["need"] * res["ask"]:.2f}); underlying at constant IV: {mv}')
    print(f'  SPY B&H ${res["bench"]:,.2f}: cash is ahead if SPY falls more than {-res["cash_beat_level"]:.2%}; '
          f'EV/$ if simply held to {end}: {res["ev_hold"]:.3f}')
    cols = (f'goal or {end}, {stop_lbl}', f'goal or {end}, no stop', 'cash')
    w = 27
    print(f'\n  {"":30}' + ''.join(f'{c:>{w}}' for c in cols))

    def row(label, fmt, key, cis=True):
        cells = []
        for e in EXITS:
            x = res['exits'][e]
            if key not in x:
                cells.append('-')
                continue
            a, b = x['ci'].get(key, (None, None))
            same = a is None or not np.isfinite(a) or (abs(a - x[key]) < 1e-12 and abs(b - x[key]) < 1e-12)
            cells.append(fmt(x[key]) + ('' if not cis or same else f' ({fmt(a)}-{fmt(b)})'))
        print(f'  {label:30}' + ''.join(f'{c:>{w}}' for c in cells))

    row(f'P(${res["goal"]:,.0f} at a 14:43 check)', pc, 'p_goal')
    row('P(finish ahead of SPY B&H)', pc, 'p_ahead')
    row(f'P(finish below ${res["floor"]:,.0f})', pc, 'p_below')
    row('mean finishing equity', usd, 'mean')
    row('median finishing equity', usd, 'median')
    for q in PCTS:
        if q != 50:
            print(f'  {f"  p{q}":30}' + ''.join(f'{usd(res["exits"][e]["pcts"][q]):>{w}}' for e in EXITS))
    row('model EV per $ of the call', lambda x: f'{x:.3f}', 'ev')
    print(f'  {"P(stopped) / P(call -75%+)":30}' + ''.join(
        f'{(pc(res["exits"][e]["p_stopped"]) + " / " + pc(res["exits"][e]["p_loss75"])) if e != "cash" else "-":>{w}}' for e in EXITS))
    for mode_, r_ in res['sens'].items():
        lbl = {'raw': 'raw paths (not vol-scaled)', 'volrf': 'no equity premium (volrf)'}[mode_]
        print(f'  {"sens: " + lbl:30}' + ''.join(f'{f"P(goal) {r_[e][0]:.1%}, EV {r_[e][1]:.3f}":>{w}}' for e in ('goal_stop', 'goal')))
    gs = res['exits']['goal_stop']
    checks = [(f'P(goal, {stop_lbl}) >= 35%', gs['p_goal'] >= 0.35), (f'EV/$ ({stop_lbl} exit) >= 0.93', gs['ev'] >= 0.93),
              ('premium <= $850', res['cost'] <= 850), ('spread <= 5%', res['spread'] <= 0.05), ('delta 0.35-0.40', 0.35 <= res['delta'] <= 0.40)]
    print('\n  playbook 11/4 gates (model part): ' + '; '.join(f'{k} {"PASS" if v else "FAIL"}' for k, v in checks)
          + '. Not checked here: OI >= 1000, halt or circuit-breaker day, the risk red-team.')


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    d = date.fromisoformat
    p.add_argument('--underlying', required=True, choices=['SPY', 'QQQ', 'spy', 'qqq'])
    p.add_argument('--entry-date', type=d, required=True, help='date of the quote and the buy (the model starts here)')
    p.add_argument('--end-date', type=d, default=date(2026, 11, 18), help='last 14:43 check (default 2026-11-18)')
    p.add_argument('--spot', type=float, required=True)
    p.add_argument('--strike', type=float, required=True)
    p.add_argument('--expiry', type=d, required=True)
    p.add_argument('--bid', type=float, required=True)
    p.add_argument('--ask', type=float, required=True)
    p.add_argument('--iv', type=float, required=True, help='the contract IV as a decimal, e.g. 0.1351')
    p.add_argument('--vix', type=float, required=True, help='^VIX now (scales the SPY paths)')
    p.add_argument('--vxn', type=float, help='^VXN now (QQQ only)')
    p.add_argument('--equity', type=float, required=True, help='account equity now')
    p.add_argument('--spy-bench-equity', type=float, required=True, help='SPY buy-and-hold benchmark equity at the same time as --spot')
    p.add_argument('--goal', type=float, default=2200.0)
    p.add_argument('--stop', type=float, default=0.5, help='stop at this loss on the call at a 14:43 check (default 0.5 = -50%%)')
    p.add_argument('--irx', type=float, default=3.97, help='T-bill rate in percent (default 3.97)')
    p.add_argument('--contracts', type=int, default=1)
    p.add_argument('--floor', type=float, default=1600.0, help='report P(finish below this), default 1600')
    p.add_argument('--mode', choices=['vol', 'raw', 'volrf'], default='vol')
    p.add_argument('--iv-model', choices=['index', 'const'], default='index')
    p.add_argument('--boot', type=int, default=1000)
    p.add_argument('--seed', type=int, default=7)
    a = p.parse_args(argv)
    try:
        res = model(underlying=a.underlying, entry=a.entry_date, end=a.end_date, spot=a.spot, strike=a.strike, expiry=a.expiry, bid=a.bid,
                    ask=a.ask, iv=a.iv, vix=a.vix, vxn=a.vxn, equity=a.equity, bench=a.spy_bench_equity, goal=a.goal, stop=a.stop,
                    irx=a.irx, contracts=a.contracts, floor=a.floor, mode=a.mode, iv_model=a.iv_model, n_boot=a.boot, seed=a.seed)
    except ValueError as e:
        p.error(str(e))
    report(res)


if __name__ == '__main__':
    main()
