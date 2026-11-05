#!/usr/bin/env python3
"""Momentum persona, 2026-11-05 (Run B, after the AI-stock rout): the tape, pre-registered base rates after a big S&P 500 down day,
and the exit of the shadow QQQ 12/04 715C.

  python3 -I trading-experiment/research/2026-11-05/scripts/momentum_1105.py [--no-fetch]

Run from /home/user/temp. Data: Yahoo daily bars through research/2026-10-30/scripts/momentum_tape.py (fetch/get, cached in the
scratchpad, last bar 2026-11-05); the option model and its 1990-2026/10/28 cache through research/strategy-review/scripts/options_lib.py
(the D1 model, unchanged); Cboe delayed chains through quotes.py; Kelly through research/strategy-review/scripts/sizing.py.

SPECIFICATION, FIXED BEFORE THE FIRST RUN (2026-11-05 ~22:30 ET). Nothing below is changed after a result is seen.

PART T, descriptive (no edge claim). SPY, QQQ, IWM, ^GSPC, ^NDX, ^IXIC through 2026-11-05 (SPY/QQQ/IWM checked against the brief's
  snapshot): record close and date, distance from it, correction (<= -10%) / bear (<= -20%) flags, 50- and 200-session simple means of
  closes (including today) and the distance from each, the lowest close since the record, distribution days over the last 25 sessions
  (momentum_tape.dist_days; ETF volume), and the 200-day / 50-day levels for Friday 11/6 (mean of the last 199 / 49 closes).

PART B, base rates after a big ^GSPC down day.
  Event day t: ^GSPC close(t) / close(t-1) - 1 <= -4.0% (primary threshold).
  Thinness rule: if the -4.0% threshold gives fewer than 20 declumped events in 1990-2026 (the options sample), the primary threshold
    becomes -3.5%. Both thresholds are always reported.
  Declumping: walk events in date order and keep one only if it is more than 9 sessions after the last kept event. One kept set per
    threshold is used for every horizon (stock and options), so the 1-, 5- and 9-session rows describe the same events.
  B1 stock: ^GSPC price-only return from close t to close t+h, h = 1, 5, 9 (11/5 close -> 11/18 close is 9 sessions). Baseline =
    the mean h-session return over every day of the same period ("random entry"). Excess = event return - baseline; plain t on the
    declumped excess (sample sd). Also: all-events mean, median, share up. Periods: 1950-2026, 1990-2009, 2010-2026.
  B2 options (1990-2026, options_lib.market('GSPC')): a 30-DTE ^GSPC call (expiry = last trading day on or before entry + 30 calendar
    days), strike at BS delta 0.35, 0.375 (primary), 0.40 at entry; IV = that day's ^VIX/100 at entry and the exit day's ^VIX/100 at exit
    (flat, no skew); r = ^IRX; q = SPY trailing yield; buy at mid x 1.015, sell at mid x 0.985 (options_lib.HALF_SPREAD). Payoff per $
    = proceeds / cost.
      Entry A: close t (as asked), hold h = 1, 5, 9 sessions.
      Entry B: close t+1 (the tradeable one: Friday 11/6's 14:43 check, at its close), hold h = 1, 5, 8 (8 = to the 11/18 close).
    Report on the declumped events: EV/$, median, hit (payoff > 1), share losing half or more; random-entry EV with the same entry
    offset, hold and delta over every day of the period; t vs 1.0 and t vs random (plain, declumped sd). Periods: 1990-2026, 1990-2009,
    2010-2026.
  B3 skew sensitivity: IV multiplier m = (tonight's Cboe IV of the reference SPY call) / (^VIX 28.18 / 100, brief), applied to ^VIX at
    entry and exit for the events and the random baseline alike. Reference call: tonight's SPY chain, expiry 2-5 weeks out nearest to
    30 DTE from 11/6, OI >= 1000, spread <= 5% of mid, delta 0.35-0.40, nearest 0.375.
  EDGE RULE: an edge COUNTS only if, at the primary cell (entry B, h = 8, delta 0.375, VIX pricing, primary threshold): declumped EV/$
    > 1.0 with t >= 2.0 vs 1.0, EV above the random-entry EV, and the 2010-2026 EV > 1.0 on at least 5 events. Otherwise it is a
    narrative. Kelly (sizing.kelly) on the primary cell's declumped payoffs is printed either way, at real equity $1,384.84 (brief).
  Not used: RSI(2) and the follow-through day (retired arguments); no market gates.

PART S: Cboe delayed quotes (after the close) for the shadow QQQ261204C00715000 (entered 11/2 14:44 at ask 8.98; exits 13.47 / 4.49 /
  QQQ close below its 200-day, 680.88 on 11/5), exit recorded at tonight's Cboe bid (a sale), mid and last trade also shown; and the
  B3 reference SPY call.
"""
import argparse
import csv
import math
import os
import sys
from datetime import date, timedelta

import numpy as np

sys.dont_write_bytecode = True
sys.path.insert(0, "/home/user/temp/trading-experiment")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/2026-10-30/scripts")
sys.path.insert(0, "/home/user/temp/trading-experiment/research/strategy-review/scripts")
import quotes  # noqa: E402
import momentum_tape as MT  # noqa: E402
import options_lib as L  # noqa: E402
import sizing  # noqa: E402

LAST = "2026-11-05"
MT.LAST = LAST
SCR = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/momentum-1105"
SNAP = {"SPY": 733.00, "QQQ": 647.05, "IWM": 270.98}  # brief.md snapshot, 11/05
START = {"SPY": 1993, "QQQ": 1999, "IWM": 2000, "^GSPC": 1950, "^NDX": 1985, "^IXIC": 1971}
VIX_NOW = 28.18  # brief.md snapshot
EQUITY = 1384.84  # brief.md, real
ENTRY_B = date(2026, 11, 6)
SHADOW = "QQQ261204C00715000"
THRESH = [-0.040, -0.035]
GAP = 9
PERIODS = [("1950-2026", date(1900, 1, 1), date(2100, 1, 1)), ("1990-2009", date(1990, 1, 1), date(2010, 1, 1)),
           ("2010-2026", date(2010, 1, 1), date(2100, 1, 1))]
OPT_PERIODS = PERIODS


# ------------------------------------------------------------------ part T
def tape(d, s):
    c, dt = d["close"], d["date"]
    ok = dt[-1] == LAST and (s not in SNAP or abs(c[-1] - SNAP[s]) < 0.015)
    j = int(np.argmax(c))
    dd = c[-1] / c[j] - 1
    flag = "BEAR (<= -20%)" if dd <= -0.20 else ("CORRECTION (<= -10%)" if dd <= -0.10 else "not in a correction")
    s50, s200 = c[-50:].mean(), c[-200:].mean()
    k = j + int(np.argmin(c[j:]))
    print(f"\n{s}: {dt[-1]} close {c[-1]:.2f} ({c[-1] / c[-2] - 1:+.2%}); snapshot {'OK' if ok else 'MISMATCH/none'}")
    print(f"  record close {c[j]:.2f} on {dt[j]}: {dd:+.2%} -> {flag}")
    print(f"  50-day {s50:.2f} ({c[-1] / s50 - 1:+.2%}); 200-day {s200:.2f} ({c[-1] / s200 - 1:+.2%}); "
          f"Fri 11/6 levels: 50-day {c[-49:].sum() / 49:.2f}, 200-day {c[-199:].sum() / 199:.2f}")
    print(f"  lowest close since the record {c[k]:.2f} ({dt[k]}); 20-session low {c[-20:].min():.2f}")
    if s in ("SPY", "QQQ", "IWM"):
        dds = MT.dist_days(d)
        print(f"  distribution days (25 sessions): {len(dds)}; today vol {d['volume'][-1]:,.0f} = "
              f"{d['volume'][-1] / d['volume'][-51:-1].mean():.2f}x the 50-day average")


# ------------------------------------------------------------------ part B
def events(ret, thr):
    idx = np.where(ret <= thr)[0]
    kept, last = [], -10 ** 9
    for i in idx:
        if i - last > GAP:
            kept.append(int(i))
            last = i
    return idx, np.array(kept, dtype=int)


def tstat(x, base=0.0):
    x = np.asarray(x, dtype=float)
    if len(x) < 3:
        return float("nan")
    sd = x.std(ddof=1)
    return (x.mean() - base) / (sd / math.sqrt(len(x))) if sd > 0 else float("nan")


def stock(dates, c, thr):
    n = len(c)
    ret = np.full(n, np.nan)
    ret[1:] = c[1:] / c[:-1] - 1
    allidx, kept = events(np.nan_to_num(ret, nan=0.0), thr)
    print(f"\n-- B1 stock, ^GSPC day <= {thr:.1%}: {len(allidx)} event days, {len(kept)} declumped (1950-2026)")
    for name, lo, hi in PERIODS:
        for h in (1, 5, 9):
            okd = np.array([lo <= d < hi for d in dates])
            fw = np.full(n, np.nan)
            fw[:n - h] = c[h:] / c[:n - h] - 1
            base = np.nanmean(fw[okd])
            ev_all = [i for i in allidx if okd[i] and i + h < n]
            ev = [i for i in kept if okd[i] and i + h < n]
            if not ev:
                continue
            x = fw[ev]
            xa = fw[ev_all]
            print(f"  {name} h={h}: declumped n {len(x)} mean {x.mean():+.2%} median {np.median(x):+.2%} up {np.mean(x > 0):.0%} "
                  f"| random {base:+.2%} | excess {x.mean() - base:+.2%} t {tstat(x - base):+.2f} "
                  f"|| all events n {len(xa)} mean {xa.mean():+.2%} up {np.mean(xa > 0):.0%}")
    return kept


def opt_payoffs(m, ent, h, delta, ivm):
    """Net payoff per $ for 30-DTE calls entered at index ent (array), held h sessions; None where the exit is past expiry."""
    dates, S, iv, r, q = m["dates"], m["S"], m["iv"] * ivm, m["r"], m["q"]
    ex = L.expiry_index(dates)
    ok = np.array([ex[i] > 0 and i + h < ex[i] for i in ent], dtype=bool)
    ent = np.asarray(ent)[ok]
    e = ex[ent]
    T0 = np.array([(dates[j] - dates[i]).days / 365.0 for i, j in zip(ent, e)])
    K = L.strike_for_delta(S[ent], T0, iv[ent], r[ent], q[ent], delta, "C")
    mid0 = L.bs(S[ent], K, T0, iv[ent], r[ent], q[ent], "C")
    x = ent + h
    T1 = np.array([(dates[j] - dates[k]).days / 365.0 for k, j in zip(x, e)])
    mid1 = L.bs(S[x], K, T1, iv[x], r[x], q[x], "C")
    return ent, mid1 * (1 - L.HALF_SPREAD) / (mid0 * (1 + L.HALF_SPREAD))


def options(m, kept_dates, ivm, label, primary_out=None):
    dates = m["dates"]
    pos = {d: i for i, d in enumerate(dates)}
    kept = np.array([pos[d] for d in kept_dates if d in pos], dtype=int)
    n = len(dates)
    print(f"\n-- B2 options {label} (IV = {ivm:.3f} x ^VIX), declumped events in the option data: {len(kept)}")
    for ename, off, hs in (("A close t", 0, (1, 5, 9)), ("B close t+1", 1, (1, 5, 8))):
        for delta in (0.35, 0.375, 0.40):
            for h in hs:
                for pname, lo, hi in OPT_PERIODS[:1] + OPT_PERIODS[1:]:
                    if pname == "1950-2026":
                        pname = "1990-2026"
                    okd = np.array([lo <= d < hi for d in dates])
                    ent_ev = np.array([i + off for i in kept if okd[i] and i + off < n], dtype=int)
                    ent_rn = np.array([i for i in range(n) if okd[i]], dtype=int)
                    _, pe = opt_payoffs(m, ent_ev, h, delta, ivm)
                    _, pr = opt_payoffs(m, ent_rn, h, delta, ivm)
                    if len(pe) == 0:
                        continue
                    rnd = pr.mean()
                    if delta == 0.375 or (h == hs[-1] and pname == "1990-2026"):
                        print(f"  {ename} d{delta:.3f} h={h} {pname}: n {len(pe)} EV {pe.mean():.3f} med {np.median(pe):.3f} "
                              f"hit {np.mean(pe > 1):.0%} lost>=50% {np.mean(pe <= 0.5):.0%} | random {rnd:.3f} | "
                              f"t vs 1 {tstat(pe, 1.0):+.2f}, t vs random {tstat(pe, rnd):+.2f}")
                    if primary_out is not None and off == 1 and h == 8 and delta == 0.375:
                        primary_out[pname] = (pe, rnd)


def part_b(no_fetch, ivm_ref):
    g = MT.get("^GSPC", START["^GSPC"], SCR, refetch=not no_fetch)
    dates = [date.fromisoformat(x) for x in g["date"]]
    c = g["close"]
    print(f"\n== B. ^GSPC {g['date'][0]}..{g['date'][-1]}; today {c[-1]:.2f} ({c[-1] / c[-2] - 1:+.2%})")
    m = L.market("GSPC")
    print(f"   option model data (options_lib cache) {m['dates'][0]}..{m['dates'][-1]}")
    # thinness rule on the options sample
    k4 = events(np.nan_to_num(np.r_[np.nan, c[1:] / c[:-1] - 1], nan=0.0), -0.040)[1]
    n4 = sum(1 for i in k4 if dates[i] >= date(1990, 1, 1) and dates[i] <= m["dates"][-1] - timedelta(days=14))
    primary = -0.040 if n4 >= 20 else -0.035
    print(f"   thinness rule: -4.0% gives {n4} declumped events in 1990-2026 -> primary threshold {primary:.1%}")
    res = {}
    for thr in THRESH:
        kept = stock(dates, c, thr)
        kd = [dates[i] for i in kept]
        print("   declumped events since 1990: " + ", ".join(
            f"{d.isoformat()} {c[i] / c[i - 1] - 1:+.1%}" for i, d in zip(kept, kd) if d >= date(1990, 1, 1)))
        out = {}
        options(m, kd, 1.0, f"thr {thr:.1%}, VIX pricing", out if thr == primary else None)
        if ivm_ref:
            out2 = {}
            options(m, kd, ivm_ref, f"thr {thr:.1%}, skew-adjusted", out2 if thr == primary else None)
            if thr == primary:
                res["skew"] = out2
        if thr == primary:
            res["vix"] = out
    p = res["vix"]
    full, rec = p.get("1990-2026"), p.get("2010-2026")
    pe, rnd = full
    passed = (pe.mean() > 1.0 and tstat(pe, 1.0) >= 2.0 and pe.mean() > rnd and rec is not None and len(rec[0]) >= 5
              and rec[0].mean() > 1.0)
    print(f"\n== EDGE RULE (primary cell: thr {primary:.1%}, entry close t+1, h 8, delta 0.375, VIX pricing): "
          f"EV {pe.mean():.3f} (t {tstat(pe, 1.0):+.2f}, n {len(pe)}) vs random {rnd:.3f}; 2010-2026 EV "
          f"{rec[0].mean() if rec else float('nan'):.3f} (n {len(rec[0]) if rec else 0}) -> {'COUNTS' if passed else 'NARRATIVE (no edge)'}")
    f = sizing.kelly(pe)
    print(f"   Kelly f* {f:.3f} -> full ${f * EQUITY:,.0f}, half ${f * EQUITY / 2:,.0f} (equity ${EQUITY:,.2f})")
    if "skew" in res and res["skew"].get("1990-2026"):
        ps, rs = res["skew"]["1990-2026"]
        print(f"   skew-adjusted primary cell: EV {ps.mean():.3f} (t {tstat(ps, 1.0):+.2f}) vs random {rs:.3f}; "
              f"Kelly f* {sizing.kelly(ps):.3f}")
    os.makedirs(SCR, exist_ok=True)
    with open(os.path.join(SCR, "primary_payoffs.csv"), "w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["payoff"])
        w.writerows([[f"{x:.6f}"] for x in pe])


# ------------------------------------------------------------------ part S
def show(sym):
    q = quotes.option_quote(sym)
    sp = (q["ask"] - q["bid"]) / q["mid"] if q["mid"] else float("nan")
    print(f"  {sym}: bid {q['bid']} ask {q['ask']} mid {q['mid']} spread {sp:.1%} iv {q['iv']} delta {q['delta']} oi {q['oi']} "
          f"last {q['last']} at {q['last_trade_time']} ({q['source']})")
    return q


def reference_call():
    rows = []
    for sym, o in quotes.cboe_chain("SPY").items():
        occ = quotes.parse_occ(sym)
        if not occ or occ["type"] != "C":
            continue
        dte = (occ["expiry"] - ENTRY_B).days
        if not 14 <= dte <= 35:
            continue
        bid, ask, dl, oi = o.get("bid") or 0, o.get("ask") or 0, o.get("delta"), o.get("open_interest") or 0
        if not (bid > 0 and ask > bid and dl is not None and oi >= 1000):
            continue
        mid = (bid + ask) / 2
        if (ask - bid) / mid > 0.05 or not 0.35 <= float(dl) <= 0.40:
            continue
        rows.append((abs(dte - 30), abs(float(dl) - 0.375), sym))
    rows.sort()
    return rows[0][2] if rows else None


def part_s():
    print("\n== S. Cboe delayed quotes")
    q = show(SHADOW)
    print(f"  shadow exit: sell at bid {q['bid']} vs entry ask 8.98 -> {q['bid'] / 8.98 - 1:+.1%}; at mid {q['mid']} -> "
          f"{(q['mid'] or 0) / 8.98 - 1:+.1%}")
    ref = reference_call()
    ivm = None
    if ref:
        r = show(ref)
        if r["iv"]:
            ivm = float(r["iv"]) / (VIX_NOW / 100.0)
            print(f"  B3 reference {ref}: IV {float(r['iv']):.4f} / ^VIX {VIX_NOW / 100:.4f} = multiplier {ivm:.3f}")
    else:
        print("  no B3 reference call passed the filters")
    return ivm


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-fetch", action="store_true")
    a = ap.parse_args()
    os.makedirs(SCR, exist_ok=True)
    print("== T. Tape")
    for s in ("SPY", "QQQ", "IWM", "^GSPC", "^NDX", "^IXIC"):
        tape(MT.get(s, START[s], SCR, refetch=not a.no_fetch), s)
    ivm = part_s()
    part_b(True, ivm)  # ^GSPC was fetched in the tape loop above


if __name__ == "__main__":
    main()
