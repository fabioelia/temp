#!/usr/bin/env python3
"""Momentum persona, 2026-11-03 (election night): (1) the tape and a pre-registered test of whether any tape condition checkable at the
Wed 11/4 14:43 check should block the goal-budget SPY call; (2) the re-run of research/2026-11-01/scripts/momentum_200d.py with bars
through 11/03, and Wednesday's shadow trigger levels.

  python3 -I trading-experiment/research/2026-11-03/scripts/momentum_1103.py [--no-fetch]

Run from /home/user/temp. Data: Yahoo daily bars through research/2026-10-30/scripts/momentum_tape.py (get/fetch, cached in the
scratchpad, last bar 2026-11-03); Cboe delayed chains through quotes.py; the historian's 13-session paths (paths13.csv, 1990-2026)
and the goal-budget model through research/2026-11-02/scripts/goal_odds.py (values, goal_exit, sessions_after; unchanged).

PART R, the re-run. The 11/01 SPECIFICATION IS UNCHANGED (signals B, B8, R, A; h 5/10/20; M1/M2/M3; fills; edge rule; Kelly; seed 1101).
  Inputs move only: last bar 2026-11-03; snapshot check QQQ 685.28 (brief.md, 11/03); entry day for M3 and the skew window 2026-11-04;
  M3 references re-picked from tonight's chain by the 11/01 rule (OI >= 1,000, |delta| 0.30-0.45, spread < 5% of mid, nearest to 30
  DTE, then nearest to 0.40 delta). Part F (12-session goal odds from 11/2) is dropped: goal_odds.py is the goal model now.
PART T, descriptive (no edge claim; the follow-through day is a retired argument and is not used):
  T1 distribution days (momentum_tape.dist_days, last 25 sessions) for SPY, QQQ, ^GSPC, ^IXIC, IWM, tonight and as of 11/02.
  T2 correction and rally-attempt state: the 252-session high close; the lowest low since it and its date; whether 11/03 undercut it;
     rally-attempt day count = sessions from the first up close after that low through 11/03 (day 1 = that up close).
  T3 Wednesday's levels: QQQ's 200-day break level on 11/4 (a close/price below the mean of the last 199 closes), signal A's state,
     B8's level; SPY's 50-day level on 11/4 (a price below the mean of the last 49 closes); SPY's lowest close since its high.
PART G, PRE-REGISTERED BEFORE ANY RESULT WAS COMPUTED (2026-11-03 ~17:30 ET): does a tape state at entry change the goal bet?
  Entry day t stands in for the Wed 11/4 14:43 check (its close for the 14:43 price). Conditions on day t:
    G1 selloff day:     ^GSPC day return <= -1.0%                  (Wed: SPY at or below 0.99 x 754.35 = 746.81)
    G2 rally day:       ^GSPC day return >= +1.0%                  (Wed: SPY at or above 1.01 x 754.35 = 761.89)
    G3 below 50-day:    ^GSPC close < its 50-session mean           (Wed: SPY below the mean of its last 49 closes)
    G4 Nasdaq break:    ^NDX close < its 200-session mean           (Wed: QQQ below the mean of its last 199 closes)
    G5 new correction low: ^GSPC close below its lowest close since its 252-session high close, and <= 0.97 x that high
                                                                     (Wed: SPY below its lowest close since its high)
    G6 heavy distribution: SPY distribution-day count >= 6 over the 25 sessions ending t-1 (known the night before; SPY volume, 1993+)
  Stock level: ^GSPC price-only return from close t to close t+10 (11/4 -> 11/18 is 10 sessions). Excess = event return minus the
    random-entry mean over the same period. Events declumped (after a used event, skip h sessions); plain t. Periods: full (from the
    first day the condition is defined) and 2010-2026. All qualifying days' mean shown for context.
  Option level: the goal-budget model (goal_odds.py: "vol" paths, "index" IV, -50% stop, first 14:43 check at >= $2,200, else 11/18)
    at tonight's reference call (the brief's goal-budget contract rule applied to tonight's Cboe chain: 11/30 or 12/04, delta
    0.35-0.40, OI >= 1000, spread <= 5%, nearest 0.375 delta) with entry 2026-11-04, spot 754.35, ^VIX 20.83, equity $1,917.92,
    SPY B&H $1,967.37 (brief). Paths are scaled on ALL entry days (as goal_odds.py does), then split by the condition on the entry
    day; 95% CIs from the historian's episode groups (hd.groups), 1,000 resamples, seed 7; difference vs the complement resampled
    independently.
  BLOCK RULE: a condition blocks the bet only if ALL hold: (i) declumped full-sample excess < 0 with t <= -2.0; (ii) 2010-2026 excess
    < 0 and at least half the full-sample size; (iii) on the condition's entry days the model gives P($2,200) < 35% or EV < 0.93 per $
    while all days pass. Six conditions are tested, so |t| 2-3 is suggestive only. The entry rule allows no delay (11/4 14:43 only),
    so a block means no bet. If no condition meets the rule: "no block".
PART S: Cboe marks for the shadow book and tonight's references.
"""
import argparse
import math
import os
import sys
from datetime import date, datetime, timezone

import numpy as np

sys.dont_write_bytecode = True
sys.path.insert(0, "/home/user/temp/trading-experiment")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/2026-10-30/scripts")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/2026-11-01/scripts")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/2026-11-02/scripts")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/strategy-review/scripts")
import quotes  # noqa: E402
import momentum_tape as MT  # noqa: E402
import momentum_200d as M  # noqa: E402
import goal_odds as GO  # noqa: E402
import historian_call_double as hd  # noqa: E402

LAST = "2026-11-03"
PREV = "2026-11-02"
SCR = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/momentum-1103"
ENTRY = date(2026, 11, 4)
END = date(2026, 11, 18)
H = 10
MT.LAST = LAST
M.LAST = LAST
M.SCR = SCR
M.ENTRY_DAY = ENTRY
M.SNAP = {"QQQ": 685.28}  # brief.md snapshot, 11/03
M.RNG = np.random.default_rng(1101)
SNAP_TAPE = {"SPY": 754.35, "QQQ": 685.28, "IWM": 279.79}  # brief.md snapshot, 11/03
TAPE = {"SPY": 1993, "QQQ": 1999, "^GSPC": 1950, "^IXIC": 2020, "IWM": 2020}
SHADOW = ["QQQ261204C00715000", "QQQ261130P00675000", "QQQ261130C00710000"]
# goal-budget inputs (brief.md, 11/03)
SPOT, VIX, EQUITY, BENCH, GOAL = 754.35, 20.83, 1917.92, 1967.37, 2200.0


# ------------------------------------------------------------------ helpers
def pick(und, kind, ok_exp, dlo, dhi, dte_target, d_target, max_spread):
    rows = []
    for sym, o in quotes.cboe_chain(und).items():
        occ = quotes.parse_occ(sym)
        if not occ or occ["type"] != kind or not ok_exp(occ["expiry"]):
            continue
        bid, ask, dl, oi = o.get("bid") or 0, o.get("ask") or 0, o.get("delta"), o.get("open_interest") or 0
        if not (bid > 0 and ask > bid and dl is not None and oi >= 1000):
            continue
        mid = (bid + ask) / 2
        if (ask - bid) / mid >= max_spread or not dlo <= abs(float(dl)) <= dhi:
            continue
        dte = (occ["expiry"] - ENTRY).days
        rows.append((abs(dte - dte_target), abs(abs(float(dl)) - d_target), sym))
    rows.sort()
    return rows[0][2] if rows else None


def show(sym):
    q = quotes.option_quote(sym)
    sp = (q["ask"] - q["bid"]) / q["mid"] if q["mid"] else float("nan")
    print(f"  {sym}: bid {q['bid']} ask {q['ask']} mid {q['mid']} spread {sp:.1%} iv {q['iv']} delta {q['delta']} oi {q['oi']} "
          f"last trade {q['last_trade_time']} ({q['source']})")
    return q


def cut(d, day):
    i = d["date"].index(day)
    return {k: v[:i + 1] for k, v in d.items()}


# ------------------------------------------------------------------ part T
def part_t(tape, q):
    print("\n== T1. Distribution days, last 25 sessions (<= -0.2% on volume above the prior session; index volume may be partial)")
    for s, d in tape.items():
        if s in SNAP_TAPE:
            ok = d["date"][-1] == LAST and abs(d["close"][-1] - SNAP_TAPE[s]) < 0.015
            print(f"  {s} last bar {d['date'][-1]} close {d['close'][-1]:.2f} vs snapshot {SNAP_TAPE[s]:.2f}: {'OK' if ok else 'MISMATCH'}")
        dd, dd5, old = MT.dist_days(d), MT.dist_days(d, removal=0.05), MT.dist_days(cut(d, PREV))
        r1 = d["close"][-1] / d["close"][-2] - 1
        print(f"  {s:6} count {len(dd)} (5% removal {len(dd5)}); as of 11/02 {len(old)}; window {d['date'][-25]}..{d['date'][-1]}; "
              f"11/03 {r1:+.2%} on vol {d['volume'][-1]:,.0f} vs {d['volume'][-2]:,.0f} ({d['volume'][-1] / max(d['volume'][-2], 1):.2f}x)")
        print("         " + ", ".join(f"{x[0][5:]} {x[1]:+.2%} {x[2]:.2f}x" for x in dd))
        print(f"         aged out since 11/02: {[x[0] for x in old if x[0] not in [y[0] for y in dd]]}; "
              f"next to age out: {d['date'][-25]} ({'a d-day' if d['date'][-25] in [y[0] for y in dd] else 'not a d-day'})")
    print("\n== T2. Correction and rally-attempt state (high = 252-session high close; low = lowest intraday low since it)")
    for s, d in tape.items():
        c, lo, dates = d["close"], d["low"], d["date"]
        j = len(c) - 252 + int(np.argmax(c[-252:]))
        m = j + int(np.argmin(lo[j:]))
        k = j + int(np.argmin(c[j:]))
        day1 = next((i for i in range(m + 1, len(c)) if c[i] > c[i - 1]), None)
        und = lo[-1] < lo[j:-1].min()
        att = f"day {len(c) - day1} of a rally attempt (day 1 {dates[day1]})" if day1 is not None else "no up close since the low"
        sma50, sma200 = c[-50:].mean(), c[-200:].mean()
        print(f"  {s:6} close {c[-1]:9.2f} | high {c[j]:9.2f} ({dates[j]}) {c[-1] / c[j] - 1:+.2%} | lowest low {lo[m]:9.2f} ({dates[m]}), "
              f"lowest close {c[k]:9.2f} ({dates[k]}) | 11/03 low {lo[-1]:.2f} {'UNDERCUT' if und else 'held'} | {att} | "
              f"close vs low {c[-1] / lo[m] - 1:+.2%} | 50d {sma50:.2f} ({c[-1] / sma50 - 1:+.1%}) | 200d {sma200:.2f} ({c[-1] / sma200 - 1:+.1%})")


def part_t3(qd, spy):
    c = qd["close"]
    print("\n== T3. Wednesday 11/4 levels (price-only closes; a 14:43 price below the level puts that day's value below the average)")
    hi = c[-252:].max()
    lv = c[-199:].sum() / 199
    sig, s, _, a_raw = M.signals(c)
    print(f"  QQQ 200-day tonight {s[-1]:.2f}; close {c[-1]:.2f} ({c[-1] / s[-1] - 1:+.2%}); 11/4 break level: QQQ < {lv:.2f} "
          f"(cushion {c[-1] - lv:.2f} points, {c[-1] / lv - 1:+.2%}); 11/5 about {(c[-198:].sum() + c[-1]) / 199:.2f} if 11/4 closes flat")
    print(f"  B8 needs <= 0.92 x high close {hi:.2f} = {0.92 * hi:.2f}: a break below {lv:.2f} is {'also' if lv <= 0.92 * hi else 'NOT'} a B8")
    prior20 = all(c[i] >= s[i] for i in range(len(c) - 20, len(c)))
    print(f"  B on 11/4 needs the 20 prior closes at or above the 200-day: {prior20}")
    last_a = [i for i in range(len(c) - 40, len(c)) if a_raw[i]]
    print(f"  A-qualifying days in the last 40 sessions: {[qd['date'][i] for i in last_a]}; a new A event needs 20 non-qualifying sessions "
          f"before it; R needs a prior B within 30 sessions (last B: {[qd['date'][i] for i in np.where(sig['B'])[0]][-1:]})")
    sc = spy["close"]
    l50 = sc[-49:].sum() / 49
    j = len(sc) - 252 + int(np.argmax(sc[-252:]))
    lowc = sc[j:].min()
    print(f"  SPY 50-day tonight {sc[-50:].mean():.2f}; 11/4 50-day level: SPY < {l50:.2f}; SPY high close {sc[j]:.2f} ({spy['date'][j]}), "
          f"lowest close since {lowc:.2f} ({spy['date'][j + int(np.argmin(sc[j:]))]}), 0.97 x high {0.97 * sc[j]:.2f}; "
          f"G1 level {0.99 * sc[-1]:.2f}; G2 level {1.01 * sc[-1]:.2f}")
    return lv


# ------------------------------------------------------------------ part G
def sma(c, n):
    return M.sma(c, n)


def conditions(gs, ndx, spy):
    dates, c = gs["date"], gs["close"]
    n = len(c)
    r1 = np.r_[np.nan, c[1:] / c[:-1] - 1]
    s50 = sma(c, 50)
    hi = M.rolling_max(c)
    # G5: close below its lowest close since the 252-session high close
    g5 = np.zeros(n, bool)
    for i in range(252, n):
        j = i - 251 + int(np.argmax(c[i - 251:i + 1]))
        if j < i and c[i] < c[j:i].min() and c[i] <= 0.97 * c[j]:
            g5[i] = True
    # G4 on ^NDX, mapped to ^GSPC dates
    s200n = sma(ndx["close"], 200)
    nb = {d: (not np.isnan(s)) and x < s for d, x, s in zip(ndx["date"], ndx["close"], s200n)}
    nd = {d: not np.isnan(s) for d, s in zip(ndx["date"], s200n)}
    g4 = np.array([nb.get(d, False) for d in dates])
    g4_def = np.array([nd.get(d, False) for d in dates])
    # G6: SPY distribution count over the 25 sessions ending t-1
    sc, sv = spy["close"], spy["volume"]
    isdd = np.r_[False, (sc[1:] / sc[:-1] - 1 <= -0.002) & (sv[1:] > sv[:-1]) & (sv[:-1] > 0)]
    cnt = np.full(len(sc), np.nan)
    for i in range(26, len(sc)):
        cnt[i] = isdd[i - 25:i].sum()
    cm = {d: x for d, x in zip(spy["date"], cnt)}
    g6 = np.array([(cm.get(d, np.nan) >= 6) for d in dates])
    g6_def = np.array([not np.isnan(cm.get(d, np.nan)) for d in dates])
    base = ~np.isnan(r1)
    return {
        "G1 selloff day (<= -1%)": (r1 <= -0.01, base),
        "G2 rally day (>= +1%)": (r1 >= 0.01, base),
        "G3 below the 50-day": (~np.isnan(s50) & (c < np.nan_to_num(s50, nan=-1)), ~np.isnan(s50)),
        "G4 ^NDX below its 200-day": (g4, g4_def),
        "G5 new correction low": (g5, np.arange(n) >= 252),
        "G6 SPY d-days >= 6": (g6, g6_def),
    }, cnt


def stock_test(dates, c, mask, defined, lo, hi):
    n = len(c)
    ok = np.array([lo <= dates[i] <= hi and defined[i] and i + H < n for i in range(n)])
    idx = np.where(ok)[0]
    fwd = c[idx + H] / c[idx] - 1
    base = fwd.mean()
    allev = np.where(ok & mask)[0]
    used, last = [], -10 ** 9
    for i in allev:
        if i - last > H:
            used.append(i)
            last = i
    used = np.array(used, int)
    if len(used) < 3:
        return None
    r = c[used + H] / c[used] - 1
    ex = r - base
    t = ex.mean() / (ex.std(ddof=1) / math.sqrt(len(ex)))
    ra = c[allev + H] / c[allev] - 1
    comp = np.where(ok & ~mask)[0]
    rc = c[comp + H] / c[comp] - 1
    return dict(n=len(used), nall=len(allev), mean=r.mean(), hit=float((r > 0).mean()), base=base, ex=ex.mean(), t=t,
                mall=ra.mean(), mcomp=rc.mean(), p_dn2=float((r <= -0.0222).mean()), first=dates[idx[0]])


def model_split(P, masks, ref, irx):
    q = quotes.option_quote(ref)
    occ = quotes.parse_occ(ref)
    steps = GO.sessions_after(ENTRY, END)
    m, g = GO.values(P, "SPY", SPOT, occ["strike"], q["bid"], q["ask"], float(q["iv"]), ENTRY, occ["expiry"], steps, VIX, None, irx)
    ok = ~np.isnan(m).any(1)
    cost = q["ask"] * 100
    final, mult, reached, stopped = GO.goal_exit(m, EQUITY, cost, GOAL, 0.5)
    spy_end = BENCH * g[:, -1]
    print(f"\n== G-model. goal_odds.py model at {ref} (bid {q['bid']} ask {q['ask']} iv {q['iv']} delta {q['delta']} oi {q['oi']}; "
          f"{q['source']}), spot {SPOT}, ^VIX {VIX}, ^IRX {irx:.2%}, entry {ENTRY}, {len(steps)} sessions to {END}; -50% stop; "
          f"cost ${cost:,.0f}")
    rng = np.random.default_rng(7)
    pdate = np.array([x.isoformat() for x in P["date"]])

    def stats(sel):
        return np.array([reached[sel].mean(), mult[sel].mean(), (final[sel] > spy_end[sel]).mean()])

    def boot(sel_idx):
        gsx = hd.groups(P["idx"][sel_idx])
        out = []
        for _ in range(1000):
            pk = np.concatenate([sel_idx[gsx[j]] for j in rng.integers(0, len(gsx), len(gsx))])
            out.append(stats(pk))
        return np.array(out), len(gsx)

    alli = np.where(ok)[0]
    ba, ng = boot(alli)
    pa = stats(alli)
    lo, hi = np.percentile(ba, [2.5, 97.5], axis=0)
    print(f"  ALL days n {len(alli)} ({ng} groups): P(goal) {pa[0]:.1%} ({lo[0]:.1%}-{hi[0]:.1%}), EV/$ {pa[1]:.3f} ({lo[1]:.3f}-{hi[1]:.3f}), "
          f"P(beat SPY) {pa[2]:.1%}  -> gates {'PASS' if pa[0] >= 0.35 and pa[1] >= 0.93 else 'FAIL'}")
    out = {}
    for name, mk in masks.items():
        sel = np.where(ok & mk(pdate))[0]
        comp = np.where(ok & ~mk(pdate))[0]
        if len(sel) < 20:
            print(f"  {name}: n {len(sel)} too few")
            continue
        bs_, ngs = boot(sel)
        bc, _ = boot(comp)
        ps, pc = stats(sel), stats(comp)
        lo, hi = np.percentile(bs_, [2.5, 97.5], axis=0)
        dlo, dhi = np.percentile(bs_ - bc, [2.5, 97.5], axis=0)
        gate = ps[0] >= 0.35 and ps[1] >= 0.93
        out[name] = dict(p=ps[0], ev=ps[1], gate=gate)
        print(f"  {name:28} n {len(sel):5} ({ngs} groups): P(goal) {ps[0]:.1%} ({lo[0]:.1%}-{hi[0]:.1%}) vs rest {pc[0]:.1%}, diff CI "
              f"{dlo[0]:+.1%}..{dhi[0]:+.1%} | EV/$ {ps[1]:.3f} ({lo[1]:.3f}-{hi[1]:.3f}) vs rest {pc[1]:.3f}, diff CI {dlo[1]:+.3f}..{dhi[1]:+.3f} "
              f"| P(beat SPY) {ps[2]:.1%} vs {pc[2]:.1%} | gates {'PASS' if gate else 'FAIL'}")
    return out, pa


def part_g(gs, ndx, spy, irx, ref):
    print(f"\n== G. Tape states at entry vs the next {H} sessions of ^GSPC (price-only; excess vs random entry, declumped, plain t)")
    cs, cnt = conditions(gs, ndx, spy)
    print(f"  SPY distribution count over the 25 sessions ending 11/03 (the state for an 11/4 entry): {cnt[-1]:.0f} "
          f"(G6 {'ON' if cnt[-1] >= 6 else 'off'})")
    res = {}
    for name, (mask, dfn) in cs.items():
        for pname, lo, hi in (("full", "1950-01-01", "2026-12-31"), ("2010-2026", "2010-01-01", "2026-12-31")):
            st = stock_test(gs["date"], gs["close"], mask, dfn, lo, hi)
            if st is None:
                print(f"  {name:28} {pname}: too few")
                continue
            res[(name, pname)] = st
            print(f"  {name:28} {pname:9} from {st['first']} n {st['n']:3} (all days {st['nall']:4}) mean {st['mean']:+.2%} hit {st['hit']:.0%} "
                  f"P(<=-2.22%) {st['p_dn2']:.0%} | base {st['base']:+.2%} | excess {st['ex']:+.2%} t {st['t']:+.2f} | all-days mean "
                  f"{st['mall']:+.2%} vs rest {st['mcomp']:+.2%}")
        print(f"  {'':28} on {gs['date'][-1]}: {'ON' if mask[-1] else 'off'}")
    gd = {d: i for i, d in enumerate(gs["date"])}

    def mk(mask):
        return lambda pdate: np.array([bool(mask[gd[d]]) if d in gd else False for d in pdate])

    P = GO.load_paths()
    mod, pa = model_split(P, {k: mk(v[0]) for k, v in cs.items()}, ref, irx)
    print("\n== G-verdict (pre-registered block rule)")
    any_block = False
    for name in cs:
        f, l8 = res.get((name, "full")), res.get((name, "2010-2026"))
        md = mod.get(name)
        if not (f and l8 and md):
            print(f"  {name}: insufficient data -> no block")
            continue
        c1 = f["ex"] < 0 and f["t"] <= -2.0
        c2 = l8["ex"] < 0 and abs(l8["ex"]) >= 0.5 * abs(f["ex"])
        c3 = (not md["gate"]) and pa[0] >= 0.35 and pa[1] >= 0.93
        blk = c1 and c2 and c3
        any_block |= blk
        print(f"  {name:28} (i) t {f['t']:+.2f} [{'ok' if c1 else 'fail'}] (ii) 2010-26 {l8['ex']:+.2%} [{'ok' if c2 else 'fail'}] "
              f"(iii) model P {md['p']:.1%} EV {md['ev']:.3f} [{'fails gates' if c3 else 'passes or all-days fails'}] -> "
              f"{'BLOCK' if blk else 'no block'}")
    print(f"  OVERALL: {'BLOCK' if any_block else 'no block'}")


# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-fetch", action="store_true")
    a = ap.parse_args()
    os.makedirs(SCR, exist_ok=True)
    fetch = not a.no_fetch
    d = {s: MT.get(s, y, SCR, fetch) for s, y in M.SPEC.items()}
    print(f"Yahoo daily bars fetched {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC; cache {SCR}; "
          + ", ".join(f"{s} {d[s]['date'][0]}..{d[s]['date'][-1]}" for s in M.SPEC))
    tape = {}
    for s, y in TAPE.items():
        tape[s] = d[s] if s in d else MT.get(s, y, SCR, fetch)
    irx = d["^IRX"]["close"][-1] / 100
    print(f"^IRX {d['^IRX']['date'][-1]} {irx:.2%}")

    # references by the 11/01 rule, and the goal-budget reference
    M.REF = {k: pick("QQQ", k, lambda e: 21 <= (e - ENTRY).days <= 35, 0.30, 0.45, 30, 0.40, 0.05) for k in ("P", "C")}
    gref = pick("SPY", "C", lambda e: e in (date(2026, 11, 30), date(2026, 12, 4)), 0.35, 0.40, 26, 0.375, 0.05)
    print(f"M3 references (11/01 rule, from 11/4): {M.REF}; goal-budget reference (brief rule): {gref}")

    M.part_a(d)
    lv = part_t3(d["QQQ"], tape["SPY"])
    part_t(tape, d["QQQ"])
    print("\n== S. Shadow book and references (Cboe delayed chain, tonight)")
    for sym in SHADOW + [M.REF["P"], M.REF["C"], gref]:
        show(sym)
    part_g(d["^GSPC"], d["^NDX"], tape["SPY"], irx, gref)

    stock = M.part_b(d)
    print("\n== E0. Skew ratio from tonight's QQQ chain (Cboe delayed; 11/03 close quotes), 21-35 DTE from 11/4")
    m = M.skew_m(d["^VXN"]["close"][-1] / 100)
    env = M.Env(d, m)
    res = M.part_c(d, env, stock)
    M.part_d(stock, res)
    M.part_e(env, stock, res)
    print(f"\n(11/4 QQQ break level {lv:.2f})")


if __name__ == "__main__":
    main()
