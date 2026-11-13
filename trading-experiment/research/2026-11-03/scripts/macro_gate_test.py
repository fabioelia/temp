"""Macro 11/03 (committed by the orchestrator in Run B; the data inputs stay in the scratchpad): do macro states on the entry day change the goal-budget odds?
Specification fixed before the first run.

Run (from /home/user/temp):
  python3 -I <this> <data_dir>
Inputs: <data_dir>/y__TNX.json, y__GSPC.json, y__VIX.json, y_HYG.json (Yahoo v8 daily, macro_fetch.py, through 11/3),
        fred_BAA10Y.csv, fred_BAMLH0A0HYM2.csv (FRED fredgraph.csv, fetched 11/3 22:17 UTC).
Model: research/2026-11-02/scripts/goal_odds.py, unchanged ("vol" paths, "index" IV, -50% stop, goal $2,200, end 11/18), at tonight's
reference quote: SPY261130C00768000 7.24/7.41, IV 0.1467, spot 754.35 (Cboe delayed chain 2026-11-03 22:17:26 UTC; SPY close 754.35),
^VIX 20.83, equity 1917.92, SPY B&H 1967.37, entry 2026-11-04 (10 checks). The model is run once on all 9,263 entry days; each
condition then keeps only the entry days t where it held. Conditions (state at the close of t, a proxy for the 14:43 check;
FRED series use the t-1 value, the latest print at 14:43):
  R1  ^TNX close > 5.10 (the 10y at 5.10%; the brief's example)
  R2  ^TNX 1-day change >= +0.10 (10bp)
  R3  ^TNX 5-day change >= +0.25
  C1  BAA10Y (t-1) 5-day change >= +0.15 (Moody's Baa - 10y, credit widening)
  C2  BAA10Y (t-1) at or above its trailing 252-session max (a 1-year credit high)
  C3  HYG 1-day return <= -1.0%
  C4  BAMLH0A0HYM2 (t-1) at or above its trailing 252-session max (FRED holds only 3 years: 2023-11 on)
  S1  ^GSPC 1-day return <= -2.0% (a shock-down reaction day)
  S2  ^GSPC 1-day return >= +1.5% (a relief-rally day)
  V1  ^VIX 1-day change >= +15%
Block rule, fixed in advance: a condition is evidence to block only if, on its entry days, the upper end of the 95% CI of P(goal)
is below 35% or the upper end of the EV/$ CI is below 0.93 (the playbook's own gates). Point estimates under a gate are a 'concern'.
CIs: goal_odds/hd episode groups, 1000 resamples, seed 7. Sensitivity: "raw" paths. Descriptive; not a committed test.
"""
import csv
import json
import os
import sys
from datetime import date, datetime, timezone

import numpy as np

ROOT = '/home/user/temp/trading-experiment'
sys.path.insert(0, os.path.join(ROOT, 'research', '2026-11-02', 'scripts'))
import goal_odds as go  # noqa: E402
import historian_call_double as hd  # noqa: E402

D = sys.argv[1]


def yh(fn, field='close'):
    r = json.load(open(os.path.join(D, fn)))['chart']['result'][0]
    out = {}
    for t, c in zip(r['timestamp'], r['indicators']['quote'][0][field]):
        if c is not None:
            out[datetime.fromtimestamp(t, tz=timezone.utc).date()] = float(c)
    return out


def fred(fn):
    out = {}
    with open(os.path.join(D, fn)) as f:
        for row in csv.reader(f):
            if row[0] == 'observation_date' or row[1] in ('', '.'):
                continue
            out[date.fromisoformat(row[0])] = float(row[1])
    return out


tnx, gspc, vix, hyg = yh('y__TNX.json'), yh('y__GSPC.json'), yh('y__VIX.json'), yh('y_HYG.json')
baa, hy = fred('fred_BAA10Y.csv'), fred('fred_BAMLH0A0HYM2.csv')

# ---- model on all entry days (tonight's reference quote)
SPOT, K, EXP, BID, ASK, IV, VIX_NOW = 754.35, 768.0, date(2026, 11, 30), 7.24, 7.41, 0.1467, 20.83
EQ, BENCH, GOAL, STOP = 1917.92, 1967.37, 2200.0, 0.5
ENTRY, END = date(2026, 11, 4), date(2026, 11, 18)
P = go.load_paths()
steps = go.sessions_after(ENTRY, END)
r = 3.97 / 100
cost = ASK * 100


def run(mode):
    m, g = go.values(P, 'SPY', SPOT, K, BID, ASK, IV, ENTRY, EXP, steps, VIX_NOW, None, r, 'index', mode=mode)
    ok = ~np.isnan(m).any(1)
    final, mult, reached, stopped = go.goal_exit(m, EQ, cost, GOAL, 1 - STOP)
    spy_end = BENCH * g[:, -1]
    return ok, mult, reached, stopped, final > spy_end


dates = P['date']


def series_state(s, d_list, lag=0):
    """Value of series s at the entry date (lag 0) or at the prior available date (lag 1), plus history arrays."""
    keys = sorted(s)
    pos = {d: i for i, d in enumerate(keys)}
    vals = np.array([s[d] for d in keys])
    return keys, pos, vals


def chg(s, n, lag=0):
    keys, pos, vals = series_state(s, None)
    out = np.full(len(dates), np.nan)
    for j, d in enumerate(dates):
        if lag:
            # latest print strictly before d
            i = np.searchsorted(np.array(keys, dtype='datetime64[D]'), np.datetime64(d), side='left') - 1
        else:
            i = pos.get(d, -1)
        if i - n >= 0:
            out[j] = vals[i] - vals[i - n]
    return out


def level(s, lag=0):
    keys, pos, vals = series_state(s, None)
    karr = np.array(keys, dtype='datetime64[D]')
    out = np.full(len(dates), np.nan)
    for j, d in enumerate(dates):
        i = (np.searchsorted(karr, np.datetime64(d), side='left') - 1) if lag else pos.get(d, -1)
        if i >= 0:
            out[j] = vals[i]
    return out


def at_max(s, n=252, lag=0):
    keys, pos, vals = series_state(s, None)
    karr = np.array(keys, dtype='datetime64[D]')
    out = np.zeros(len(dates), bool)
    have = np.zeros(len(dates), bool)
    for j, d in enumerate(dates):
        i = (np.searchsorted(karr, np.datetime64(d), side='left') - 1) if lag else pos.get(d, -1)
        if i - n + 1 >= 0:
            have[j] = True
            out[j] = vals[i] >= vals[i - n + 1:i + 1].max()
    return out, have


def ret(s, n=1):
    keys, pos, vals = series_state(s, None)
    out = np.full(len(dates), np.nan)
    for j, d in enumerate(dates):
        i = pos.get(d, -1)
        if i - n >= 0:
            out[j] = vals[i] / vals[i - n] - 1
    return out


tnx_lvl, tnx1, tnx5 = level(tnx), chg(tnx, 1), chg(tnx, 5)
baa5 = chg(baa, 5, lag=1)
baa_max, baa_have = at_max(baa, lag=1)
hy_max, hy_have = at_max(hy, lag=1)
hyg1, spx1, vix1 = ret(hyg), ret(gspc), ret(vix)

conds = [
    ('ALL', 'every entry day', np.ones(len(dates), bool)),
    ('R1', '^TNX close > 5.10', tnx_lvl > 5.10),
    ('R1b', '^TNX close <= 5.10 (complement)', tnx_lvl <= 5.10),
    ('R2', '^TNX 1-day change >= +0.10', tnx1 >= 0.10),
    ('R3', '^TNX 5-day change >= +0.25', tnx5 >= 0.25),
    ('C1', 'BAA10Y (t-1) 5-day change >= +0.15', baa5 >= 0.15),
    ('C2', 'BAA10Y (t-1) at a 252-session high', baa_max & baa_have),
    ('C3', 'HYG 1-day return <= -1.0%', hyg1 <= -0.01),
    ('C4', 'BAMLH0A0HYM2 (t-1) at a 252-session high', hy_max & hy_have),
    ('C4n', '  (entry days with a 252-session HY OAS history)', hy_have),
    ('S1', '^GSPC 1-day return <= -2.0%', spx1 <= -0.02),
    ('S2', '^GSPC 1-day return >= +1.5%', spx1 >= 0.015),
    ('V1', '^VIX 1-day change >= +15%', vix1 >= 0.15),
]

rng_seed, n_boot = 7, 1000
print(f'macro_gate_test: goal_odds model, 1 x SPY 11/30 768C at 7.24/7.41 (IV {IV}), spot {SPOT}, ^VIX {VIX_NOW}; '
      f'entry {ENTRY}, {len(steps)} checks to {END}; {len(dates):,} entry days {dates[0]} .. {dates[-1]}')
print(f'latest inputs: ^TNX {tnx[max(tnx)]:.3f} ({max(tnx)}), BAA10Y {baa[max(baa)]:.2f} ({max(baa)}), '
      f'BAMLH0A0HYM2 {hy[max(hy)]:.2f} ({max(hy)}); HY OAS 252-session max before then '
      f'{max(v for d, v in hy.items() if d < max(hy) and d >= sorted(hy)[-253]):.2f}')
for mode in ('vol', 'raw'):
    ok, mult, reached, stopped, ahead = run(mode)
    print(f'\n== mode "{mode}"')
    print(f'{"cond":5} {"definition":48} {"days":>6} {"epis":>5} {"P(goal)":>22} {"EV/$ (stop exit)":>22} {"P(ahead SPY)":>8} {"P(stop)":>8}  verdict')
    for code, lab, mask in conds:
        sel = np.where(mask & ok)[0]
        if len(sel) < 10:
            print(f'{code:5} {lab:48} {len(sel):6d}  too few')
            continue
        gs = hd.groups(sel)
        pg, ev = reached[sel].mean(), mult[sel].mean()
        rng = np.random.default_rng(rng_seed)
        draws = []
        for _ in range(n_boot):
            pick = np.concatenate([gs[j] for j in rng.integers(0, len(gs), len(gs))])
            s = sel[pick]
            draws.append((reached[s].mean(), mult[s].mean()))
        draws = np.array(draws)
        (pl, el), (ph, eh) = np.percentile(draws, [2.5, 97.5], axis=0)
        block = ph < 0.35 or eh < 0.93
        concern = pg < 0.35 or ev < 0.93
        v = 'BLOCK' if block else ('concern' if concern else 'pass')
        print(f'{code:5} {lab:48} {len(sel):6d} {len(gs):5d} {pg:7.1%} ({pl:5.1%}-{ph:5.1%}) {ev:7.3f} ({el:.3f}-{eh:.3f}) '
              f'{ahead[sel].mean():8.1%} {stopped[sel].mean():8.1%}  {v}')
print('\nfetched data: Yahoo v8 (macro_fetch.py, 2026-11-03T22:17:47Z); FRED fredgraph.csv (2026-11-03 22:17-22:18 UTC)')
