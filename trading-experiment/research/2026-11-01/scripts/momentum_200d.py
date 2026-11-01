#!/usr/bin/env python3
"""Momentum persona, 2026-11-01: is there a tape setup at QQQ's 200-day average with a measured edge for 21-35 DTE options?

  python3 -I trading-experiment/research/2026-11-01/scripts/momentum_200d.py [--no-fetch]

Run from /home/user/temp. Data: Yahoo daily bars through quotes.get_json (the fetch/get helpers of
research/2026-10-30/scripts/momentum_tape.py), cached in the scratchpad, last bar 2026-10-30. Option quotes: Cboe delayed chain
through quotes.option_quote / quotes.cboe_chain. Option maths: research/strategy-review/scripts/options_lib.py (bs,
strike_for_delta). Kelly: research/strategy-review/scripts/sizing.py (kelly, report).

SPECIFICATION, FIXED BEFORE ANY RESULT WAS COMPUTED (2026-11-01, written before this script first ran)
Series: C = price-only close (split-adjusted). SMA_t = mean of C over t-199..t. HI_t = max C over t-251..t.
Signals (day t, all on closes):
  B  "break":     C_t < SMA_t, and C >= SMA on each of the 20 prior sessions (the first close below after an uptrend).
  B8 "break in a correction": B and C_t <= 0.92 x HI_t (today QQQ is -9.1% from its high; any break this week is also a B8).
  R  "reclaim":   the first close back above SMA within 30 sessions after a B break (C_t > SMA_t).
  A  "pullback to a rising 200-day" (the state on 10/30): SMA_t <= C_t <= 1.03 x SMA_t, C_t <= 0.93 x HI_t, SMA_t > SMA_{t-20},
     and C >= SMA on each of the 20 prior sessions. Event = a qualifying day with no qualifying day in the 20 prior sessions.
  B and A need 20 sessions above SMA first, and R follows a B, so events of one signal are >= 21 sessions apart (no overlap at h <= 20).
Entry: the close of t (stands in for the 14:43 check on t). Robustness: the close of t+1.
Horizons: h = 5, 10, 20 sessions. PRIMARY h = 10.
Stock level: QQQ adjusted close (dividends in), net of 5 bps, minus the random-entry baseline = mean h-session return over every
  day of the same period from the first day SMA exists. Plain t on the per-event excess (events do not overlap).
  Periods: QQQ full (1999-03-10 on; first SMA 1999-12), 1999-2009, 2010-2026.
  Breadth checks, same definitions, price index, no cost: ^NDX 1985-1999 (before QQQ: out of sample) and ^NDX full;
  ^GSPC 1950-2026, 1950-1999 and 2010-2026.
Options (QQQ, from the first ^VXN close, 2001-01-23): 30 calendar DTE, |delta| 0.40, the PUT and the CALL for every signal.
  S = QQQ price-only close; r = ^IRX/100 forward-filled; q = QQQ trailing-252-session dividend yield from adjclose/close.
  M1 (protocol): IV = ^VXN/100 at entry and at exit, no skew.
  M2 (real skew, PRIMARY): IV = m x ^VXN/100, m = median Cboe IV / ^VXN close of today's QQQ chain contracts with 21-35 DTE
     from 2026-11-02, |delta| 0.35-0.45 and a bid, separately for puts and calls; the same m at entry and exit.
     It applies today's skew to all of history: approximate.
  Fills: pay mid x 1.015, receive mid x 0.985 (half of a 3% spread; intrinsic at or past expiry also x 0.985).
  E1: hold h sessions (5, 10, 20). E2 (the playbook's 1-contract exit): sell at the first close >= +50% or <= -50%, else at
     session 15.
  EV/$ = mean(proceeds / cost); 90% bootstrap CI (5,000 draws, seed 1101); random-entry EV = the same option bought on every day
  of the period.
  M3 (translation to today's contracts): reference QQQ261127P00680000 and QQQ261204C00715000 (OI >= 1,000, delta in band,
     spread < 5%). Each event's h-session log return is scaled by today's ^VXN / ^VXN at entry; entry pays today's Cboe ask at
     the 10/30 close, exit mid = Cboe mid x BS(exit)/BS(entry) at the quoted IV, minus half the quoted spread; T falls by
     7 / 14 / 28 calendar days for h = 5 / 10 / 20. Entry date 2026-11-02.
EDGE COUNTS only if, for the trade's side at h = 10, all hold: the QQQ stock-level excess has the trade's sign with |t| >= 2 in the
  full sample; 2010-2026 has the same sign and at least half the full-sample size; M2 option EV/$ > 1.0 and above its random-entry
  EV. Otherwise it is a narrative. With 4 signals x 2 sides x 3 horizons, |t| >= 3 is strong evidence and 2-3 suggestive.
Kelly: per-$ payoffs of each cell at M2, h = 10 (and E2), through sizing.kelly/report at equity $1,917.92. Saved to the
  scratchpad as CSV for `sizing.py csv`.
Goal odds (descriptive, not an edge): the random-entry M2 call and put held 12 sessions (Mon 11/2 close to Wed 11/18 close),
  2010-2026: P(payoff per $ >= 1 + (2200 - 1917.92) / budget) for budgets $250, $500, $1,000 and $1,917.92, and the expected $.
"""
import argparse
import csv
import math
import os
import sys
from datetime import date, datetime, timezone

import numpy as np

sys.path.insert(0, "/home/user/temp/trading-experiment")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/2026-10-30/scripts")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/strategy-review/scripts")
import quotes  # noqa: E402
import momentum_tape as MT  # noqa: E402
import options_lib as OL  # noqa: E402
import sizing  # noqa: E402

SCR = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/momentum-1101"
LAST = "2026-10-30"
ENTRY_DAY = date(2026, 11, 2)
EQUITY, GOAL = 1917.92, 2200.0
REF = {"P": "QQQ261127P00680000", "C": "QQQ261204C00715000"}
SNAP = {"QQQ": 690.49}  # brief.md snapshot, 10/30
HS = 0.015
DTE, DELTA = 30, 0.40
HORIZONS = (5, 10, 20)
CAL = {5: 7, 10: 14, 12: 16, 20: 28}
RNG = np.random.default_rng(1101)
SPEC = {"QQQ": 1999, "^NDX": 1985, "^GSPC": 1950, "^VXN": 2001, "^IRX": 1990}


# ------------------------------------------------------------------ data and signals
def sma(c, n=200):
    out = np.full(len(c), np.nan)
    cs = np.cumsum(np.r_[0.0, c])
    out[n - 1:] = (cs[n:] - cs[:-n]) / n
    return out


def rolling_max(c, n=252):
    return np.array([c[max(0, i - n + 1): i + 1].max() for i in range(len(c))])


def signals(c):
    n = len(c)
    s, hi = sma(c), rolling_max(c)
    above = np.where(np.isnan(s), False, c >= s)
    prior20 = np.zeros(n, bool)
    for i in range(220, n):
        prior20[i] = above[i - 20:i].all()
    valid = ~np.isnan(s)
    B = valid & (c < np.nan_to_num(s, nan=-1)) & prior20
    B8 = B & (c <= 0.92 * hi)
    R = np.zeros(n, bool)
    for b in np.where(B)[0]:
        for t in range(b + 1, min(n, b + 31)):
            if c[t] > s[t]:
                R[t] = True
                break
    s20 = np.r_[np.full(20, np.nan), s[:-20]]
    a_raw = valid & (c >= np.nan_to_num(s, nan=np.inf)) & (c <= 1.03 * np.nan_to_num(s, nan=0)) & (c <= 0.93 * hi) \
        & (np.nan_to_num(s, nan=0) > np.nan_to_num(s20, nan=np.inf)) & prior20
    A = np.array([a_raw[i] and not a_raw[max(0, i - 20):i].any() for i in range(n)])
    return {"B": B, "B8": B8, "R": R, "A": A}, s, hi, a_raw


def ffill(dates, src_dates, src_vals):
    m = dict(zip(src_dates, src_vals))
    out, last = np.full(len(dates), np.nan), np.nan
    for i, d in enumerate(dates):
        if d in m and m[d] > 0:
            last = m[d]
        out[i] = last
    return out


# ------------------------------------------------------------------ part A: the tape today
def part_a(d):
    q = d["QQQ"]
    c, dates = q["close"], q["date"]
    sig, s, hi, a_raw = signals(c)
    print("== A. QQQ and its 200-day on", dates[-1])
    print(f"  close {c[-1]:.2f} (snapshot {SNAP['QQQ']:.2f}: {'OK' if abs(c[-1] - SNAP['QQQ']) < 0.015 and dates[-1] == LAST else 'MISMATCH'})"
          f" | SMA200 {s[-1]:.2f} ({c[-1] / s[-1] - 1:+.2%}) | 252-session high close {hi[-1]:.2f} ({c[-1] / hi[-1] - 1:+.2%})"
          f" | SMA200 20 sessions ago {s[-21]:.2f} (rising: {s[-1] > s[-21]})")
    run = 0
    for i in range(len(c) - 1, 0, -1):
        if c[i] >= s[i]:
            run += 1
        else:
            break
    print(f"  consecutive closes at or above the 200-day: {run} (since {dates[len(c) - run]})")
    for k, v in sig.items():
        last = [dates[i] for i in np.where(v)[0]][-3:]
        print(f"  signal {k:2}: fires on {dates[-1]}: {'YES' if v[-1] else 'no'}; last events {last}")
    qual = [dates[i] for i in range(len(c) - 30, len(c)) if a_raw[i]]
    print(f"  A-qualifying days in the last 30 sessions: {qual}")
    lvl = c[-199:].sum() / 199
    print(f"  Monday 11/2 break level: QQQ closes below {lvl:.2f} (= mean of the last 199 closes) -> close below its own 200-day")
    up = 1.03 * c[-199:].sum() / (200 - 1.03)
    print(f"  A's band on 11/2: {lvl:.2f} <= close <= {up:.2f} (1.03 x that day's SMA200) and close <= {0.93 * hi[-1]:.2f} (0.93 x high close)")
    return sig


# ------------------------------------------------------------------ part B: stock level
def stock_cell(dates, px, ev_mask, s, h, lo, hi, cost, lag=0):
    n = len(px)
    ok = np.array([lo <= dates[i] <= hi and not np.isnan(s[i]) and i + lag + h < n for i in range(n)])
    idx = np.where(ok)[0]
    fwd = px[idx + lag + h] / px[idx + lag] - 1
    base = fwd.mean()
    ev = np.where(ok & ev_mask)[0]
    if len(ev) < 2:
        return None
    r = px[ev + lag + h] / px[ev + lag] - 1 - cost
    ex = r - base
    t = ex.mean() / (ex.std(ddof=1) / math.sqrt(len(ex)))
    return dict(n=len(ev), mean=r.mean(), med=float(np.median(r)), hit=float((r > 0).mean()), worst=r.min(), best=r.max(),
                base=base, ex=ex.mean(), t=t, idx=ev)


def part_b(d):
    print("\n== B. Stock level (excess = net event return minus random entry, same period; plain t)")
    out = {}
    cfg = [("QQQ", "adjclose", 0.0005, [("full", "1999-01-01", "2026-12-31"), ("1999-2009", "1999-01-01", "2009-12-31"),
                                         ("2010-2026", "2010-01-01", "2026-12-31")]),
           ("^NDX", "close", 0.0, [("1985-1999", "1985-01-01", "1999-03-09"), ("full", "1985-01-01", "2026-12-31")]),
           ("^GSPC", "close", 0.0, [("full", "1950-01-01", "2026-12-31"), ("1950-1999", "1950-01-01", "1999-12-31"),
                                    ("2010-2026", "2010-01-01", "2026-12-31")])]
    for sym, col, cost, periods in cfg:
        x = d[sym]
        sig, s, _, _ = signals(x["close"])
        px = x[col]
        for k in ("B", "B8", "R", "A"):
            for lag in ((0, 1) if sym == "QQQ" else (0,)):
                for h in HORIZONS:
                    for pname, lo, hi in periods:
                        st = stock_cell(x["date"], px, sig[k], s, h, lo, hi, cost, lag)
                        if st is None:
                            print(f"  {sym:5} {k:2} entry t+{lag} h={h:2} {pname:9} n<2")
                            continue
                        out[(sym, k, lag, h, pname)] = st
                        print(f"  {sym:5} {k:2} entry t+{lag} h={h:2} {pname:9} n {st['n']:3} mean {st['mean']:+.2%} med {st['med']:+.2%} "
                              f"hit {st['hit']:.0%} worst {st['worst']:+.2%} best {st['best']:+.2%} | base {st['base']:+.2%} | "
                              f"excess {st['ex']:+.2%} t {st['t']:+.2f}")
    return out


# ------------------------------------------------------------------ part C: options
class Env:
    def __init__(self, d, m):
        q = d["QQQ"]
        self.dates = q["date"]
        self.S = q["close"]
        self.adj = q["adjclose"]
        self.ord = np.array([date.fromisoformat(x).toordinal() for x in self.dates])
        self.vxn = ffill(self.dates, d["^VXN"]["date"], d["^VXN"]["close"]) / 100
        first_vxn = d["^VXN"]["date"][0]
        self.vxn[np.array([x < first_vxn for x in self.dates])] = np.nan
        self.r = ffill(self.dates, d["^IRX"]["date"], d["^IRX"]["close"]) / 100
        n = len(self.S)
        qy = np.full(n, np.nan)
        for i in range(252, n):
            qy[i] = max(0.0, (self.adj[i] / self.adj[i - 252]) / (self.S[i] / self.S[i - 252]) - 1)
        qy[:252] = qy[252]
        self.q = qy
        self.m = m

    def iv(self, model, kind):
        return self.vxn * (1.0 if model == "M1" else self.m[kind])


def payoffs(env, e, h, kind, model):
    """Hold-h payoff per $ for entries e (array of indices)."""
    iv = env.iv(model, kind)
    S0, T0 = env.S[e], DTE / 365
    K = OL.strike_for_delta(S0, np.full(len(e), T0), iv[e], env.r[e], env.q[e], DELTA, kind)
    cost = OL.bs(S0, K, T0, iv[e], env.r[e], env.q[e], kind) * (1 + HS)
    x = e + h
    T1 = np.maximum(DTE - (env.ord[x] - env.ord[e]), 0) / 365
    val = OL.bs(env.S[x], K, T1, iv[x], env.r[x], env.q[x], kind) * (1 - HS)
    return val / cost


def payoffs_e2(env, e, kind, model):
    iv = env.iv(model, kind)
    S0, T0 = env.S[e], DTE / 365
    K = OL.strike_for_delta(S0, np.full(len(e), T0), iv[e], env.r[e], env.q[e], DELTA, kind)
    cost = OL.bs(S0, K, T0, iv[e], env.r[e], env.q[e], kind) * (1 + HS)
    out = np.full(len(e), np.nan)
    done = np.zeros(len(e), bool)
    for k in range(1, 16):
        x = e + k
        T1 = np.maximum(DTE - (env.ord[x] - env.ord[e]), 0) / 365
        v = OL.bs(env.S[x], K, T1, iv[x], env.r[x], env.q[x], kind) * (1 - HS) / cost
        hit = ~done & ((v >= 1.5) | (v <= 0.5) | (k == 15))
        out[hit] = v[hit]
        done |= hit
    return out


def boot(v):
    b = [RNG.choice(v, len(v)).mean() for _ in range(5000)]
    return np.percentile(b, [5, 95])


def part_c(d, env, stock):
    print(f"\n== C. QQQ options (30 DTE, |delta| {DELTA}); M1 IV = VXN; M2 IV = m x VXN, m put {env.m['P']:.3f}, call {env.m['C']:.3f}")
    sig, s, _, _ = signals(env.S)
    n = len(env.S)
    res = {}
    periods = [("full", "2001-01-23", "2026-12-31"), ("2010-2026", "2010-01-01", "2026-12-31")]
    for k in ("B", "B8", "R", "A"):
        for kind in ("P", "C"):
            for model in ("M1", "M2"):
                for rule in [("hold", h) for h in HORIZONS] + [("E2", 15)]:
                    for pname, lo, hi in periods:
                        span = rule[1]
                        ok = np.array([lo <= env.dates[i] <= hi and not np.isnan(env.vxn[i]) and i + span < n
                                       and not np.isnan(s[i]) for i in range(n)])
                        base_e = np.where(ok)[0]
                        ev = np.where(ok & sig[k])[0]
                        if len(ev) < 3:
                            continue
                        if rule[0] == "hold":
                            v = payoffs(env, ev, span, kind, model)
                            b = payoffs(env, base_e, span, kind, model)
                        else:
                            v = payoffs_e2(env, ev, kind, model)
                            b = payoffs_e2(env, base_e, kind, model)
                        lo5, hi95 = boot(v)
                        tag = f"hold {span}" if rule[0] == "hold" else "E2 +50/-50/15d"
                        res[(k, kind, model, tag, pname)] = dict(v=v, idx=ev, base=b.mean())
                        print(f"  {k:2} {'put ' if kind == 'P' else 'call'} {model} {tag:15} {pname:9} n {len(v):3} EV/$ {v.mean():.3f} "
                              f"(90% CI {lo5:.2f}-{hi95:.2f}) med {np.median(v):.2f} win {np.mean(v > 1):.0%} lost>=half {np.mean(v <= 0.5):.0%}"
                              f" | random {b.mean():.3f}")
    return res


# ------------------------------------------------------------------ part D: verdicts and Kelly
def part_d(stock, res):
    print("\n== D. Verdicts (pre-registered rule, h = 10, M2) and Kelly at equity $1,917.92")
    rows = []
    for k in ("B", "B8", "R", "A"):
        full = stock.get(("QQQ", k, 0, 10, "full"))
        late = stock.get(("QQQ", k, 0, 10, "2010-2026"))
        for kind in ("P", "C"):
            sign = -1 if kind == "P" else 1
            o = res.get((k, kind, "M2", "hold 10", "full"))
            if not (full and late and o):
                print(f"  {k} {kind}: insufficient data")
                continue
            c1 = sign * full["ex"] > 0 and abs(full["t"]) >= 2
            c2 = sign * late["ex"] > 0 and abs(late["ex"]) >= 0.5 * abs(full["ex"])
            c3 = o["v"].mean() > 1.0 and o["v"].mean() > o["base"]
            verdict = "EDGE COUNTS" if (c1 and c2 and c3) else "NO EDGE (narrative)"
            print(f"  {k:2} {'put ' if kind == 'P' else 'call'}: stock excess full {full['ex']:+.2%} (t {full['t']:+.2f}) [{'ok' if c1 else 'fail'}];"
                  f" 2010-26 {late['ex']:+.2%} [{'ok' if c2 else 'fail'}]; M2 EV/$ {o['v'].mean():.3f} vs random {o['base']:.3f}"
                  f" [{'ok' if c3 else 'fail'}] -> {verdict}")
            for tag in ("hold 10", "E2 +50/-50/15d"):
                oo = res.get((k, kind, "M2", tag, "full"))
                if oo is None:
                    continue
                sizing.report(oo["v"], EQUITY, f"    Kelly {k} {kind} M2 {tag}")
                for j, val in zip(oo["idx"], oo["v"]):
                    rows.append({"signal": k, "kind": kind, "rule": tag, "entry_index": int(j), "payoff": f"{val:.6f}"})
    fn = os.path.join(SCR, "payoffs_m2.csv")
    with open(fn, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["signal", "kind", "rule", "entry_index", "payoff"])
        w.writeheader()
        w.writerows(rows)
    print(f"  per-event payoffs saved: {fn}")


# ------------------------------------------------------------------ part E: today's contracts (M3) and the skew ratio
def skew_m(vxn_close):
    out = {}
    for kind in ("P", "C"):
        vals = []
        for sym, o in quotes.cboe_chain("QQQ").items():
            occ = quotes.parse_occ(sym)
            if not occ or occ["type"] != kind:
                continue
            dte = (occ["expiry"] - ENTRY_DAY).days
            if not 21 <= dte <= 35 or not o.get("iv") or not o.get("delta") or not (o.get("bid") or 0) > 0:
                continue
            if 0.35 <= abs(float(o["delta"])) <= 0.45:
                vals.append(float(o["iv"]) / vxn_close)
        vals.sort()
        out[kind] = vals[len(vals) // 2]
        print(f"  skew ratio {kind}: n {len(vals)}, median Cboe IV / VXN {out[kind]:.3f} (range {vals[0]:.3f}-{vals[-1]:.3f}); "
              f"VXN close {vxn_close * 100:.2f}")
    return out


def part_e(env, stock, res):
    print("\n== E. M3: today's reference contracts, each event's vol-scaled move")
    irx = env.r[-1]
    vxn_now = env.vxn[-1]
    S0 = env.S[-1]
    for k in ("B", "B8", "R", "A"):
        st = stock.get(("QQQ", k, 0, 10, "full"))
        if st is None:
            continue
        ev = st["idx"]
        ev = ev[~np.isnan(env.vxn[ev])]
        for kind in ("P", "C"):
            ref = REF[kind]
            qd = quotes.option_quote(ref)
            occ = quotes.parse_occ(ref)
            K, iv, mid, ask, bid = occ["strike"], float(qd["iv"]), qd["mid"], qd["ask"], qd["bid"]
            T0 = (occ["expiry"] - ENTRY_DAY).days / 365
            base = float(OL.bs(S0, K, T0, iv, irx, 0.0, kind))
            hs = (ask - bid) / 2 / mid
            parts = []
            for h in HORIZONS:
                e = ev[ev + h < len(env.S)]
                lr = np.log(env.S[e + h] / env.S[e]) * (vxn_now / env.vxn[e])
                T1 = max(T0 - CAL[h] / 365, 0)
                ex = np.array([float(OL.bs(S0 * math.exp(x), K, T1, iv, irx, 0.0, kind)) for x in lr])
                pay = mid * ex / base * (1 - hs) / ask
                parts.append(f"h={h} EV/$ {pay.mean():.3f} (n {len(pay)}, win {np.mean(pay > 1):.0%})")
            print(f"  {k:2} {ref} ask {ask} bid {bid} iv {iv:.4f} delta {qd['delta']} oi {qd['oi']}: " + "; ".join(parts))
    for kind in ("P", "C"):
        qd = quotes.option_quote(REF[kind])
        print(f"  quote {REF[kind]}: bid {qd['bid']} ask {qd['ask']} spread {(qd['ask'] - qd['bid']) / qd['mid']:.1%} of mid, iv {qd['iv']}, "
              f"delta {qd['delta']}, oi {qd['oi']} ({qd['source']})")


# ------------------------------------------------------------------ part F: goal odds (descriptive)
def part_f(env):
    print("\n== F. Goal odds, descriptive: a random-entry QQQ option (M2) held 12 sessions (11/2 close to 11/18 close), 2010-2026")
    n = len(env.S)
    ok = np.array([env.dates[i] >= "2010-01-01" and i + 12 < n for i in range(n)])
    e = np.where(ok)[0]
    for kind in ("C", "P"):
        v = payoffs(env, e, 12, kind, "M2")
        print(f"  {'call' if kind == 'C' else 'put '} 0.40-delta: n {len(v)}, EV/$ {v.mean():.3f}, median {np.median(v):.2f}, "
              f"lost half or more {np.mean(v <= 0.5):.0%}")
        for b in (250, 500, 1000, EQUITY):
            need = 1 + (GOAL - EQUITY) / b
            print(f"    budget ${b:,.2f}: needs {need:.2f}x -> P(reach $2,200) {np.mean(v >= need):.1%}; expected $ {b * (v.mean() - 1):+,.0f}; "
                  f"P(lose >= half the budget) {np.mean(v <= 0.5):.0%}")


# ------------------------------------------------------------------ POST-HOC (written after parts A-F were seen; no edge claims)
EARN_CACHE = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-data/earnings"
C1_NAMES = {"AAPL": "Tue 11/3 (reports Mon 11/2 after the close)", "AMD": "Wed 11/4 (reports Tue 11/3 after the close)",
            "QCOM": "Thu 11/5 (reports Wed 11/4 after the close)"}


def post_hoc(env, cache, refetch):
    print("\n== POST-HOC G1. Goal odds at M1 (IV = VXN, no skew) and over 2001-2026, to bracket part F's M2 figures")
    n = len(env.S)
    for lo in ("2001-01-23", "2010-01-01"):
        e = np.where(np.array([env.dates[i] >= lo and i + 12 < n and not np.isnan(env.vxn[i]) for i in range(n)]))[0]
        for model in ("M1", "M2"):
            v = payoffs(env, e, 12, "C", model)
            p = {b: np.mean(v >= 1 + (GOAL - EQUITY) / b) for b in (500, 1000, EQUITY)}
            print(f"  call {model} from {lo}: n {len(v)} EV/$ {v.mean():.3f}; P(reach $2,200) at $500 {p[500]:.1%}, "
                  f"$1,000 {p[1000]:.1%}, all-in {p[EQUITY]:.1%}; P(lose >= half) {np.mean(v <= 0.5):.0%}")
    print("\n== POST-HOC G2. C1 arithmetic for this week's reporters: does full Kelly cover one 0.35-delta, 25-DTE put after an 8% gap?")
    print("   (pre-print RV20 provisional: 20 log returns to 10/30; contract = BS mid at IV = mult x RV20, r = ^IRX, q = 0, x 100)")
    fk = {}
    for mult in (0.8, 0.9, 1.0, 1.15, 1.25):
        fk[mult] = sizing.kelly(sizing.c1_payoffs(EARN_CACHE, mult)) * EQUITY
    print("   full Kelly $: " + ", ".join(f"{m:.2f}x ${v:,.0f}" for m, v in fk.items()))
    for sym, when in C1_NAMES.items():
        x = MT.get(sym, 2025, cache, refetch)
        c = x["close"]
        rv = np.diff(np.log(c[-21:])).std(ddof=1) * math.sqrt(252)
        sg = 0.92 * c[-1]
        cells = []
        for mult in fk:
            iv = mult * rv
            K = float(OL.strike_for_delta(sg, 25 / 365, iv, env.r[-1], 0.0, 0.35, "P")[0])
            cost = float(OL.bs(sg, K, 25 / 365, iv, env.r[-1], 0.0, "P")) * 100
            cells.append(f"{mult:.2f}x: K {K:.0f} ${cost:,.0f} {'OK' if fk[mult] >= cost else 'no'}")
        print(f"  {sym:4} {x['date'][-1]} close {c[-1]:.2f}, gap level (0.92x) {sg:.2f}, RV20 {rv:.1%}; reaction day {when}")
        print("       " + " | ".join(cells))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-fetch", action="store_true")
    ap.add_argument("--post-hoc-only", action="store_true")
    a = ap.parse_args()
    if a.post_hoc_only:
        d = {s: MT.get(s, y, SCR, False) for s, y in SPEC.items()}
        m = skew_m(d["^VXN"]["close"][-1] / 100)
        post_hoc(Env(d, m), SCR, not a.no_fetch)
        return
    os.makedirs(SCR, exist_ok=True)
    d = {s: MT.get(s, y, SCR, not a.no_fetch) for s, y in SPEC.items()}
    print(f"Yahoo daily bars fetched {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC; cache {SCR}; "
          + ", ".join(f"{s} {d[s]['date'][0]}..{d[s]['date'][-1]}" for s in SPEC))
    part_a(d)
    stock = part_b(d)
    print("\n== E0. Skew ratio from today's QQQ chain (Cboe delayed; 10/30 close quotes)")
    m = skew_m(d["^VXN"]["close"][-1] / 100)
    env = Env(d, m)
    res = part_c(d, env, stock)
    part_d(stock, res)
    part_e(env, stock, res)
    part_f(env)
    post_hoc(env, SCR, not a.no_fetch)


if __name__ == "__main__":
    main()
