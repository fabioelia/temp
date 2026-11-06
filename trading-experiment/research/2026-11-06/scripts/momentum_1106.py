#!/usr/bin/env python3
"""Momentum persona, 2026-11-06 (Run B, the day after the -4.4% rout): the tape and breadth, a pre-registered test of whether a
+0-1% day after a -4% ^GSPC day changes the call base rate for a Monday entry, and the open shadow QQQ 11/30 675P.

  python3 -I trading-experiment/research/2026-11-06/scripts/momentum_1106.py [--no-fetch]

Run from /home/user/temp. Re-uses research/2026-11-05/scripts/momentum_1105.py (events, tstat, show: unchanged), Yahoo daily bars via
research/2026-10-30/scripts/momentum_tape.py (fetch/get, cached in the scratchpad, last bar 2026-11-06), the D1 option model and its
1990-2026/10/28 cache via research/strategy-review/scripts/options_lib.py, Cboe delayed chains via quotes.py, Kelly via
research/strategy-review/scripts/sizing.py.

SPECIFICATION, FIXED BEFORE THE FIRST RUN (2026-11-06 evening ET). Nothing below is changed after a result is seen.

PART T, descriptive (no edge claim). SPY, QQQ, IWM, ^GSPC, ^NDX, ^IXIC through 2026-11-06 (SPY/QQQ/IWM checked against the brief's
  snapshot): as in momentum_1105 (record close, drawdown, correction/bear flag, 50- and 200-session simple means including today and the
  distance from each, lowest close since the record, distribution days, volume vs 50-day) plus Monday 11/9 levels (mean of the last
  49 / 199 closes). "Deepening or stabilizing" (for ^NDX, ^IXIC, QQQ), defined now: DEEPENING if today's close is a new lowest close
  since the record; STABILIZING if today's close is above the lowest close since the record AND above the prior close; otherwise MIXED.
  One day cannot establish a trend; this is a label, not an edge.
  Breadth (descriptive): the 11 sector SPDRs (XLK XLC XLY XLF XLV XLI XLB XLU XLP XLRE XLE) plus SMH and RSP: share of the 11 sectors
  above their 50-day and 200-day; RSP/SPY ratio change over 5 and 20 sessions.

PART B, the conditional base rate.
  Event day t: ^GSPC close(t)/close(t-1) - 1 <= -4.0% (primary; -3.5% secondary), declumped as in momentum_1105 (keep an event only if
    more than 9 sessions after the last kept one). r1 = ^GSPC return on day t+1.
  Groups: ALL kept events; C (primary): 0.0% <= r1 <= +1.0% (Friday 11/6 is such a day if ^GSPC's r1 is in range; printed); NOT-C: the
    rest; U (secondary): r1 > 0.
  Entry M = close of day t+2 (Monday 11/9's 14:43 check, at its close). Hold h = 1, 5, 7 sessions (11/9 close -> 11/18 close = 7).
  B1 stock: ^GSPC price return close t+2 -> close t+2+h per group, 1950-2026 and 2010-2026; random baseline = mean h-session return over
    every day of the period; plain t on excess. The C events are listed with dates, r1 and the 7-session return.
  B2 options (1990-2026 option sample): 30-DTE ^GSPC call, strike at BS delta 0.375 (0.35/0.40 also shown at h 7), IV = ^VIX/100 at entry
    and exit, r = ^IRX, q = SPY yield, buy mid x 1.015, sell mid x 0.985. Per group: n, EV/$, median, hit, lost >= 50%, random EV (same
    h, delta, all days of the period), t vs 1, t vs random; Welch t of C vs NOT-C. Puts (delta 0.375, h 7) as a secondary line.
  B3 skew: IV multiplier = Cboe IV of a reference SPY call (puts: put) / (^VIX 25.64 / 100, brief). Reference: tonight's SPY chain,
    expiry 14-35 DTE from 11/9 nearest 30, OI >= 1000, spread <= 5% of mid, |delta| 0.35-0.40 nearest 0.375. Applied to events and the
    random baseline alike.
  EDGE RULE (primary cell: C, -4.0%, entry M, h 7, call delta 0.375, VIX pricing): counts only if n >= 10, EV/$ > 1.0 with t >= 2.0 vs
    1.0, EV > random, and the 2010-2026 EV > 1.0 on at least 5 events. Otherwise a narrative.
  "DOES IT CHANGE THE BASE RATE": YES only if the Welch t of C vs NOT-C at the primary cell has |t| >= 2.0; otherwise "no measurable
    change". Kelly (sizing.kelly) on the primary cell and on ALL at entry M, h 7, at real equity $1,384.84 (brief).
  Not used: RSI(2) and the follow-through day (retired); no market gates.

PART S: Cboe delayed quotes for the shadow QQQ261130P00675000 (fired 11/5 14:45 at ask 33.51; exits +50% = 50.27, -50% = 16.76, stop on
  a QQQ close back above its 200-day). Exit check: tonight's bid vs the levels; the 11/6 QQQ low from Yahoo with a BS value of the put at
  that low (tonight's IV, flat) as a rough check on the +50% GTC; QQQ close vs its 200-day.
"""
import argparse
import math
import os
import sys
from datetime import date, timedelta

import numpy as np

sys.dont_write_bytecode = True
sys.path.insert(0, "/home/user/temp/trading-experiment")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/2026-10-30/scripts")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/2026-11-05/scripts")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/strategy-review/scripts")
import quotes  # noqa: E402
import momentum_tape as MT  # noqa: E402
import momentum_1105 as M5  # noqa: E402
import options_lib as L  # noqa: E402
import sizing  # noqa: E402

LAST = "2026-11-06"
MT.LAST = LAST
SCR = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/momentum-1106"
SNAP = {"SPY": 735.29, "QQQ": 656.10, "IWM": 273.67}  # brief.md snapshot, 11/06
START = {"SPY": 1993, "QQQ": 1999, "IWM": 2000, "^GSPC": 1950, "^NDX": 1985, "^IXIC": 1971}
SECTORS = ["XLK", "XLC", "XLY", "XLF", "XLV", "XLI", "XLB", "XLU", "XLP", "XLRE", "XLE"]
VIX_NOW = 25.64  # brief.md snapshot
EQUITY = 1384.84  # brief.md, real
ENTRY_M = date(2026, 11, 9)
SHADOW, SH_ENTRY = "QQQ261130P00675000", 33.51
THRESH = [-0.040, -0.035]
C_LO, C_HI = 0.0, 0.010
HS = (1, 5, 7)
PERIODS = [("1950-2026", date(1900, 1, 1), date(2100, 1, 1)), ("2010-2026", date(2010, 1, 1), date(2100, 1, 1))]
OPT_PERIODS = [("1990-2026", date(1900, 1, 1), date(2100, 1, 1)), ("2010-2026", date(2010, 1, 1), date(2100, 1, 1))]
tstat = M5.tstat


def welch(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    if len(a) < 2 or len(b) < 2:
        return float("nan")
    se = math.sqrt(a.var(ddof=1) / len(a) + b.var(ddof=1) / len(b))
    return (a.mean() - b.mean()) / se if se > 0 else float("nan")


# ------------------------------------------------------------------ part T
def tape(d, s):
    c, dt = d["close"], d["date"]
    ok = dt[-1] == LAST and (s not in SNAP or abs(c[-1] - SNAP[s]) < 0.015)
    j = int(np.argmax(c))
    dd, dd_prev = c[-1] / c[j] - 1, c[-2] / c[j] - 1
    flag = "BEAR (<= -20%)" if dd <= -0.20 else ("CORRECTION (<= -10%)" if dd <= -0.10 else "not in a correction")
    s50, s200 = c[-50:].mean(), c[-200:].mean()
    k = j + int(np.argmin(c[j:]))
    print(f"\n{s}: {dt[-1]} close {c[-1]:.2f} ({c[-1] / c[-2] - 1:+.2%}); snapshot {'OK' if ok else 'MISMATCH/none'}")
    print(f"  record close {c[j]:.2f} on {dt[j]}: {dd:+.2%} (prior day {dd_prev:+.2%}) -> {flag}")
    print(f"  50-day {s50:.2f} ({c[-1] / s50 - 1:+.2%}); 200-day {s200:.2f} ({c[-1] / s200 - 1:+.2%}); "
          f"Mon 11/9 levels: 50-day {c[-49:].sum() / 49:.2f}, 200-day {c[-199:].sum() / 199:.2f}")
    print(f"  50-day 5 sessions ago {c[-55:-5].mean():.2f}, 200-day 5 sessions ago {c[-205:-5].mean():.2f}")
    print(f"  lowest close since the record {c[k]:.2f} ({dt[k]}); today {c[-1] / c[k] - 1:+.2%} above it; "
          f"5-session change {c[-1] / c[-6] - 1:+.2%}; intraday low today {d['low'][-1]:.2f}")
    if s in ("^NDX", "^IXIC", "QQQ"):
        if k == len(c) - 1:
            lab = "DEEPENING (new lowest close since the record)"
        elif c[-1] > c[-2]:
            lab = "STABILIZING (above the post-record low close and up on the day)"
        else:
            lab = "MIXED"
        print(f"  label: {lab}")
    if s in ("SPY", "QQQ", "IWM"):
        dds = MT.dist_days(d)
        print(f"  distribution days (25 sessions): {len(dds)}; today vol {d['volume'][-1]:,.0f} = "
              f"{d['volume'][-1] / d['volume'][-51:-1].mean():.2f}x the 50-day average")


def breadth(no_fetch, spy):
    print("\n-- Breadth (11 sector SPDRs, SMH, RSP)")
    a50 = a200 = 0
    for s in SECTORS + ["SMH", "RSP"]:
        try:
            d = MT.get(s, 2024, SCR, refetch=not no_fetch)
        except Exception as e:  # noqa: BLE001
            print(f"  {s}: fetch failed {e}")
            continue
        c = d["close"]
        if d["date"][-1] != LAST:
            print(f"  {s}: last bar {d['date'][-1]} (stale)")
            continue
        m50, m200 = c[-50:].mean(), c[-200:].mean()
        if s in SECTORS:
            a50 += c[-1] > m50
            a200 += c[-1] > m200
        print(f"  {s}: {c[-1]:.2f} ({c[-1] / c[-2] - 1:+.2%}) vs 50-day {c[-1] / m50 - 1:+.2%}, vs 200-day {c[-1] / m200 - 1:+.2%}")
        if s == "RSP":
            sc = dict(zip(spy["date"], spy["close"]))
            r = [c[i] / sc[d["date"][i]] for i in range(len(c)) if d["date"][i] in sc]
            print(f"  RSP/SPY ratio: 5-session {r[-1] / r[-6] - 1:+.2%}, 20-session {r[-1] / r[-21] - 1:+.2%}")
    print(f"  sectors above 50-day: {a50}/11; above 200-day: {a200}/11")


# ------------------------------------------------------------------ part B
def groups(kept, ret, n):
    """Split kept event indices by r1 = ret[t+1]."""
    g = {"ALL": [], "C": [], "NOT-C": [], "U": []}
    for i in kept:
        if i + 2 >= n:
            continue
        r1 = ret[i + 1]
        g["ALL"].append(i)
        (g["C"] if C_LO <= r1 <= C_HI else g["NOT-C"]).append(i)
        if r1 > 0:
            g["U"].append(i)
    return {k: np.array(v, dtype=int) for k, v in g.items()}


def stock(dates, c, thr):
    n = len(c)
    ret = np.zeros(n)
    ret[1:] = c[1:] / c[:-1] - 1
    allidx, kept = M5.events(ret, thr)
    G = groups(kept, ret, n)
    print(f"\n-- B1 stock, ^GSPC day <= {thr:.1%}: {len(allidx)} event days, {len(kept)} declumped; group sizes (1950-2026) "
          + ", ".join(f"{k} {len(v)}" for k, v in G.items()))
    for name, lo, hi in PERIODS:
        okd = np.array([lo <= d < hi for d in dates])
        for h in HS:
            fw = np.full(n, np.nan)
            fw[:n - h] = c[h:] / c[:n - h] - 1
            base = np.nanmean(fw[okd])
            parts = []
            for gname, idx in G.items():
                ent = [i + 2 for i in idx if okd[i] and i + 2 + h < n]
                if not ent:
                    continue
                x = fw[ent]
                parts.append(f"{gname} n {len(x)} mean {x.mean():+.2%} med {np.median(x):+.2%} up {np.mean(x > 0):.0%} "
                             f"t {tstat(x - base):+.2f}")
            print(f"  {name} h={h} (random {base:+.2%}): " + " | ".join(parts))
    fw7 = np.full(n, np.nan)
    fw7[:n - 7] = c[7:] / c[:n - 7] - 1
    print("   C events: " + "; ".join(
        f"{dates[i].isoformat()} {ret[i]:+.1%}, r1 {ret[i + 1]:+.2%}, M->+7 {fw7[i + 2]:+.2%}" if i + 9 < n else
        f"{dates[i].isoformat()} {ret[i]:+.1%}, r1 {ret[i + 1]:+.2%}, M->+7 n/a" for i in G["C"]))
    return {k: [dates[i] for i in v] for k, v in G.items()}


def opt_payoffs(m, ent, h, delta, ivm, kind):
    dates, S, iv, r, q = m["dates"], m["S"], m["iv"] * ivm, m["r"], m["q"]
    ex = L.expiry_index(dates)
    ent = np.asarray(ent, dtype=int)
    ok = np.array([ex[i] > 0 and i + h < ex[i] for i in ent], dtype=bool)
    ent = ent[ok]
    if len(ent) == 0:
        return np.array([])
    e = ex[ent]
    T0 = np.array([(dates[j] - dates[i]).days / 365.0 for i, j in zip(ent, e)])
    K = L.strike_for_delta(S[ent], T0, iv[ent], r[ent], q[ent], delta, kind)
    mid0 = L.bs(S[ent], K, T0, iv[ent], r[ent], q[ent], kind)
    x = ent + h
    T1 = np.array([(dates[j] - dates[k]).days / 365.0 for k, j in zip(x, e)])
    mid1 = L.bs(S[x], K, T1, iv[x], r[x], q[x], kind)
    return mid1 * (1 - L.HALF_SPREAD) / (mid0 * (1 + L.HALF_SPREAD))


def options(m, G, ivm, kind, label, cells):
    dates = m["dates"]
    pos = {d: i for i, d in enumerate(dates)}
    n = len(dates)
    print(f"\n-- B2 options {label}: {'calls' if kind == 'C' else 'puts'}, IV = {ivm:.3f} x ^VIX, entry close t+2")
    rnd_cache = {}
    for pname, lo, hi in OPT_PERIODS:
        okd = np.array([lo <= d < hi for d in dates])
        for delta, hs in ((0.375, HS if kind == "C" else (7,)), (0.35, (7,)), (0.40, (7,))):
            if kind == "P" and delta != 0.375:
                continue
            for h in hs:
                key = (pname, delta, h)
                if key not in rnd_cache:
                    rnd_cache[key] = opt_payoffs(m, np.where(okd)[0], h, delta, ivm, kind).mean()
                rnd = rnd_cache[key]
                res = {}
                for gname, gd in G.items():
                    ent = [pos[d] + 2 for d in gd if d in pos and okd[pos[d]] and pos[d] + 2 < n]
                    res[gname] = opt_payoffs(m, ent, h, delta, ivm, kind)
                line = []
                for gname, pe in res.items():
                    if len(pe) == 0:
                        continue
                    line.append(f"{gname} n {len(pe)} EV {pe.mean():.3f} med {np.median(pe):.3f} hit {np.mean(pe > 1):.0%} "
                                f"lost50 {np.mean(pe <= 0.5):.0%} t1 {tstat(pe, 1.0):+.2f} tR {tstat(pe, rnd):+.2f}")
                wt = welch(res["C"], res["NOT-C"])
                print(f"  {pname} d{delta:.3f} h={h} (random {rnd:.3f}; Welch C vs NOT-C {wt:+.2f}):\n    " + "\n    ".join(line))
                cells[(pname, delta, h)] = (res, rnd, wt)


def part_b(no_fetch, ivm_c, ivm_p):
    g = MT.get("^GSPC", START["^GSPC"], SCR, refetch=not no_fetch)
    dates = [date.fromisoformat(x) for x in g["date"]]
    c = g["close"]
    print(f"\n== B. ^GSPC {g['date'][0]}..{g['date'][-1]}; 11/5 {c[-2] / c[-3] - 1:+.2%}, 11/6 r1 {c[-1] / c[-2] - 1:+.2%} "
          f"-> in C ({C_LO:.1%}..{C_HI:.1%}): {C_LO <= c[-1] / c[-2] - 1 <= C_HI}")
    m = L.market("GSPC")
    print(f"   option model data {m['dates'][0]}..{m['dates'][-1]}")
    prim = None
    for thr in THRESH:
        G = stock(dates, c, thr)
        cells = {}
        options(m, G, 1.0, "C", f"thr {thr:.1%}, VIX pricing", cells)
        if thr == THRESH[0]:
            prim = cells
            if ivm_c:
                options(m, G, ivm_c, "C", f"thr {thr:.1%}, skew-adjusted", {})
            options(m, G, 1.0, "P", f"thr {thr:.1%}, VIX pricing", {})
            if ivm_p:
                options(m, G, ivm_p, "P", f"thr {thr:.1%}, skew-adjusted", {})
    res, rnd, wt = prim[("1990-2026", 0.375, 7)]
    rec = prim[("2010-2026", 0.375, 7)][0]["C"]
    pe = res["C"]
    passed = (len(pe) >= 10 and pe.mean() > 1.0 and tstat(pe, 1.0) >= 2.0 and pe.mean() > rnd and len(rec) >= 5
              and rec.mean() > 1.0)
    print(f"\n== EDGE RULE (C, -4.0%, entry close t+2, h 7, call d0.375, VIX): n {len(pe)} EV {pe.mean():.3f} (t {tstat(pe, 1.0):+.2f})"
          f" vs random {rnd:.3f}; ALL {res['ALL'].mean():.3f} (n {len(res['ALL'])}); NOT-C {res['NOT-C'].mean():.3f}; 2010-2026 C EV "
          f"{rec.mean() if len(rec) else float('nan'):.3f} (n {len(rec)}) -> {'COUNTS' if passed else 'NARRATIVE (no edge)'}")
    print(f"== BASE-RATE CHANGE: Welch t C vs NOT-C {wt:+.2f} -> {'YES' if abs(wt) >= 2.0 else 'no measurable change'}")
    for gname in ("C", "ALL"):
        f = sizing.kelly(res[gname])
        print(f"   Kelly {gname}: f* {f:.3f} -> full ${f * EQUITY:,.0f}, half ${f * EQUITY / 2:,.0f}")


# ------------------------------------------------------------------ part S
def reference(kind):
    rows = []
    for sym, o in quotes.cboe_chain("SPY").items():
        occ = quotes.parse_occ(sym)
        if not occ or occ["type"] != kind:
            continue
        dte = (occ["expiry"] - ENTRY_M).days
        if not 14 <= dte <= 35:
            continue
        bid, ask, dl, oi = o.get("bid") or 0, o.get("ask") or 0, o.get("delta"), o.get("open_interest") or 0
        if not (bid > 0 and ask > bid and dl is not None and oi >= 1000):
            continue
        mid = (bid + ask) / 2
        if (ask - bid) / mid > 0.05 or not 0.35 <= abs(float(dl)) <= 0.40:
            continue
        rows.append((abs(dte - 30), abs(abs(float(dl)) - 0.375), sym))
    rows.sort()
    return rows[0][2] if rows else None


def part_s(qqq):
    print("\n== S. Cboe delayed quotes")
    q = M5.show(SHADOW)
    print(f"  shadow: bid {q['bid']} vs entry ask {SH_ENTRY} -> {q['bid'] / SH_ENTRY - 1:+.1%}; mid {q['mid']} -> "
          f"{(q['mid'] or 0) / SH_ENTRY - 1:+.1%}; levels +50% {SH_ENTRY * 1.5:.2f}, -50% {SH_ENTRY * 0.5:.2f}")
    c = qqq["close"]
    s200 = c[-200:].mean()
    lo = qqq["low"][-1]
    print(f"  QQQ 11/6 close {c[-1]:.2f}, low {lo:.2f}, high {qqq['high'][-1]:.2f}; 200-day {s200:.2f} -> close above: {c[-1] > s200}")
    if q["iv"]:
        T = (date(2026, 11, 30) - date(2026, 11, 6)).days / 365.0
        v = float(L.bs(lo, 675.0, T, float(q["iv"]), 0.037, 0.005, "P"))
        print(f"  rough BS value at the 11/6 low (IV {float(q['iv']):.3f}, r 3.7%, q 0.5%, T at the close): {v:.2f} "
              f"vs +50% level {SH_ENTRY * 1.5:.2f}")
    out = []
    for kind in ("C", "P"):
        ref = reference(kind)
        ivm = None
        if ref:
            r = M5.show(ref)
            if r["iv"]:
                ivm = float(r["iv"]) / (VIX_NOW / 100.0)
                print(f"  B3 reference {ref}: IV {float(r['iv']):.4f} / ^VIX {VIX_NOW / 100:.4f} = multiplier {ivm:.3f}")
        else:
            print(f"  no B3 reference {kind} passed the filters")
        out.append(ivm)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-fetch", action="store_true")
    a = ap.parse_args()
    os.makedirs(SCR, exist_ok=True)
    print("== T. Tape")
    data = {}
    for s in ("SPY", "QQQ", "IWM", "^GSPC", "^NDX", "^IXIC"):
        data[s] = MT.get(s, START[s], SCR, refetch=not a.no_fetch)
        tape(data[s], s)
    breadth(a.no_fetch, data["SPY"])
    ivm_c, ivm_p = part_s(data["QQQ"])
    part_b(True, ivm_c, ivm_p)  # ^GSPC was fetched in the tape loop above


if __name__ == "__main__":
    main()
