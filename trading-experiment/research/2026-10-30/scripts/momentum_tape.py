#!/usr/bin/env python3
"""Momentum persona, 2026-10-30: the tape after the 10/30 tech selloff, and three rotation / continuation tests.

  python3 trading-experiment/research/2026-10-30/scripts/momentum_tape.py [--cache DIR] [--no-fetch]

Run from /home/user/temp. Data: Yahoo daily bars (chart API through quotes.get_json), cached as CSV in the scratchpad;
option quotes: Cboe delayed chain through quotes.option_quote. Network only through the repo's quote layer.

PART A, descriptive (no edge claim):
  * Check that the last bar is 2026-10-30 and that the SPY/QQQ/IWM/XLE/TLT closes match the brief's snapshot.
  * Distribution days (IBD convention as used in my 10/29 note): close <= -0.2% vs the prior close on volume above the
    prior session's, counted over the last 25 sessions. Variant: a day also drops once a later close is >= 5% above it.
    SPY and QQQ use ETF volume; ^GSPC and ^IXIC use Yahoo index volume (the same evening it can be partial).
  * Rally-attempt check: 10/23 low and close vs 10/30 low and close (SPY, QQQ, ^GSPC, ^IXIC, IWM).
  * Distance from the 252-session high close and intraday high; 50- and 200-session simple averages.
  * Leadership: 1-day and 5-day change of the SPDR sectors, SMH, TLT, GLD, IWM vs SPY.

PART B, tests FIXED BEFORE ANY RESULT WAS COMPUTED (2026-10-30 ~17:20 ET, before this script first ran):
  Signal day t (adjusted-close return of QQQ, day t vs t-1):
    R1 energy rotation:     QQQ <= -3.0% and XLE >= 0 the same day.          Outcome: XLE.
    R2 bond rotation:       QQQ <= -3.0% and TLT >= 0 the same day.          Outcome: TLT (data from 2002-07-30).
    R3 tape continuation:   QQQ <= -3.0% and QQQ close >= 0.90 x its 252-session high close (a shock early in a
                            decline, not inside a bear market).               Outcome: QQQ (a put buyer wants < 0).
  Entry at the close of t+1 (we cannot fill before Monday's close). Horizons h = 3, 5, 10 sessions; h = 5 is primary.
  Stock level: adjusted-close return from close t+1 to close t+1+h. Baseline = the mean h-session return of the same
  instrument over every day of the same period ("random entry"). Declumped events: after a used signal, skip signals
  for h sessions, so windows never overlap; plain t on (event - baseline). Periods: full (from 1999-03-11), 1999-2009,
  2010-2026. All-events means are shown for context only.
  Options translation (the option's own payoff odds, today's real quote):
    * Reference contracts fixed in advance from tonight's Cboe chain: R1 XLE261218C00072500, R2 TLT261120C00082000,
      R3 QQQ261120P00675000 (delta about 0.35-0.42; XLE has no 11/20 strike in band with a sane spread).
    * Entry: pay tonight's Cboe ask, at tonight's underlying close, standing in for Monday's state.
    * Exit after h sessions at S0 x (1 + event's price-only return), same quoted IV, T reduced by the calendar days
      (h=3: 3, h=5: 7, h=10: 14), r = ^IRX, q = 0. Exit mid = Cboe mid x BS(exit) / BS(entry) (removes model level),
      proceeds = exit mid x (1 - half the quoted spread / mid). EV/$ = mean(proceeds) / ask. 90% bootstrap CI over the
      declumped events (5,000 draws, seed 1030). Random-entry EV = the same calculation over every day of the period.
  An edge COUNTS only if, at h = 5: declumped |t| >= 2 with the sign the trade needs, the 2010-2026 excess has the same
  sign and at least half the full-sample size, and the option EV/$ > 1.0. Otherwise it is a narrative.
"""
import argparse
import csv
import math
import os
import sys
import time
import urllib.parse
from datetime import date, datetime, timezone

import numpy as np

sys.path.insert(0, "/home/user/temp/trading-experiment")
import quotes  # noqa: E402

CACHE = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/momentum-1030"
LONG = {"SPY": 1993, "QQQ": 1999, "XLE": 1998, "TLT": 2002, "^IRX": 2024}
SHORT = ["^GSPC", "^IXIC", "IWM", "XLK", "XLC", "XLY", "XLF", "XLV", "XLI", "XLB", "XLU", "XLP", "XLRE", "SMH", "GLD",
         "^VIX"]
SNAP = {"SPY": 755.72, "QQQ": 690.49, "IWM": 279.33, "TLT": 81.84, "XLE": 70.02}  # brief.md snapshot, 10/30
LAST = "2026-10-30"
RA_DAY = "2026-10-23"
REF = {"R1": ("XLE", "XLE261218C00072500"), "R2": ("TLT", "TLT261120C00082000"), "R3": ("QQQ", "QQQ261120P00675000")}
CAL = {3: 3, 5: 7, 10: 14}
RNG = np.random.default_rng(1030)


# ------------------------------------------------------------------ data
def ts(y):
    return int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())


def fetch(sym, start_year):
    rows, y, end = {}, start_year, int(time.time())
    while True:
        p1, p2 = ts(y), min(ts(y + 8), end)
        url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?interval=1d"
               f"&period1={p1}&period2={p2}&includeAdjustedClose=true")
        r = quotes.get_json(url)["chart"]["result"][0]
        if r["meta"].get("dataGranularity") != "1d":
            raise SystemExit(f"{sym} {y}: granularity {r['meta'].get('dataGranularity')}")
        q = r["indicators"]["quote"][0]
        adj = (r["indicators"].get("adjclose") or [{}])[0].get("adjclose") or q["close"]
        for i, t in enumerate(r.get("timestamp") or []):
            c = q["close"][i]
            if c is None:
                continue
            day = datetime.fromtimestamp(t + 6 * 3600, timezone.utc).date().isoformat()
            rows[day] = (day, q["open"][i], q["high"][i], q["low"][i], c, adj[i] if adj[i] is not None else c,
                         q["volume"][i] or 0)
        if p2 >= end:
            break
        y += 8
        time.sleep(0.3)
    return [rows[k] for k in sorted(rows)]


def get(sym, start, cache, refetch):
    fn = os.path.join(cache, sym.replace("^", "") + ".csv")
    if refetch or not os.path.exists(fn):
        rows = fetch(sym, start)
        with open(fn, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["date", "open", "high", "low", "close", "adjclose", "volume"])
            w.writerows(rows)
    with open(fn) as f:
        rows = [r for r in csv.DictReader(f) if r["date"] <= LAST]
    out = {"date": [r["date"] for r in rows]}
    for k in ("open", "high", "low", "close", "adjclose", "volume"):
        out[k] = np.array([float(r[k] or 0) for r in rows])
    return out


# ------------------------------------------------------------------ part A
def dist_days(d, window=25, removal=None):
    c, v = d["close"], d["volume"]
    n = len(c)
    out = []
    for i in range(n - window, n):
        if c[i] / c[i - 1] - 1 <= -0.002 and v[i] > v[i - 1]:
            if removal and np.any(c[i + 1:] >= c[i] * (1 + removal)):
                continue
            out.append((d["date"][i], c[i] / c[i - 1] - 1, v[i] / v[i - 1]))
    return out


def part_a(data):
    print("== A0. Last bar vs the brief's snapshot")
    for s, want in SNAP.items():
        d = data[s]
        print(f"  {s:4} {d['date'][-1]} close {d['close'][-1]:.2f}  snapshot {want:.2f}  "
              f"{'OK' if d['date'][-1] == LAST and abs(d['close'][-1] - want) < 0.015 else 'MISMATCH'}")
    print("\n== A1. Distribution days, last 25 sessions (<= -0.2% on volume above the prior session)")
    for s in ("SPY", "QQQ", "^GSPC", "^IXIC", "IWM"):
        d = data[s]
        dd, dd5 = dist_days(d), dist_days(d, removal=0.05)
        today = d["close"][-1] / d["close"][-2] - 1
        print(f"  {s:6} count {len(dd)} (with the 5% removal: {len(dd5)}); window starts {d['date'][-25]}; "
              f"10/30 {today:+.2%} on vol {d['volume'][-1]:,.0f} vs {d['volume'][-2]:,.0f} ({d['volume'][-1] / d['volume'][-2]:.2f}x), "
              f"50d avg vol {d['volume'][-51:-1].mean():,.0f}")
        print("         " + ", ".join(f"{x[0][5:]} {x[1]:+.2%} {x[2]:.2f}x" for x in dd))
    print("\n== A2. Rally attempt: 10/23 vs 10/30")
    for s in ("QQQ", "SPY", "^IXIC", "^GSPC", "IWM"):
        d = data[s]
        i = d["date"].index(RA_DAY)
        lo_since = min(d["low"][i:-1])
        print(f"  {s:6} 10/23 low {d['low'][i]:.2f} close {d['close'][i]:.2f} | low 10/26-10/29 {lo_since:.2f} | "
              f"10/30 low {d['low'][-1]:.2f} close {d['close'][-1]:.2f} | close vs 10/23 low {d['close'][-1] / d['low'][i] - 1:+.2%} "
              f"{'UNDERCUT' if d['low'][-1] < d['low'][i] else 'held'}")
    print("\n== A3. Distance from the 252-session high; moving averages")
    for s in ("^GSPC", "SPY", "^IXIC", "QQQ", "IWM", "XLE", "TLT"):
        d = data[s]
        c, h = d["close"][-252:], d["high"][-252:]
        j, k = int(np.argmax(c)), int(np.argmax(h))
        dates = d["date"][-252:]
        sma50, sma200 = d["close"][-50:].mean(), d["close"][-200:].mean()
        print(f"  {s:6} close {d['close'][-1]:9.2f} | high close {c[j]:9.2f} ({dates[j]}) {d['close'][-1] / c[j] - 1:+.2%} | "
              f"intraday high {h[k]:9.2f} ({dates[k]}) {d['close'][-1] / h[k] - 1:+.2%} | 50d {sma50:9.2f} "
              f"({d['close'][-1] / sma50 - 1:+.1%}) | 200d {sma200:9.2f} ({d['close'][-1] / sma200 - 1:+.1%})")
    print("\n== A4. Leadership (price-only closes; vs SPY)")
    spy = data["SPY"]["close"]
    s1, s5 = spy[-1] / spy[-2] - 1, spy[-1] / spy[-6] - 1
    rows = []
    for s in ("XLE", "TLT", "XLU", "XLP", "XLV", "GLD", "XLRE", "XLF", "XLB", "XLI", "XLY", "XLC", "XLK", "SMH", "IWM", "QQQ"):
        c = data[s]["close"]
        r1, r5 = c[-1] / c[-2] - 1, c[-1] / c[-6] - 1
        rows.append((r1, s, r5, c[-1] / c[-50:].mean() - 1))
    for r1, s, r5, m50 in sorted(rows, reverse=True):
        print(f"  {s:5} 1d {r1:+.2%} (vs SPY {r1 - s1:+.2%}) | 5d {r5:+.2%} (vs SPY {r5 - s5:+.2%}) | vs 50d {m50:+.1%}")
    print(f"  SPY   1d {s1:+.2%} | 5d {s5:+.2%}")
    vix = data["^VIX"]
    print(f"  ^VIX {vix['date'][-1]} {vix['close'][-1]:.2f} (prior {vix['close'][-2]:.2f})")


# ------------------------------------------------------------------ part B
def bs(S, K, T, sig, r, kind):
    T = max(T, 1e-9)
    d1 = (math.log(S / K) + (r + 0.5 * sig * sig) * T) / (sig * math.sqrt(T))
    d2 = d1 - sig * math.sqrt(T)
    N = lambda x: 0.5 * (1 + math.erf(x / math.sqrt(2)))  # noqa: E731
    if kind == "C":
        return S * N(d1) - K * math.exp(-r * T) * N(d2)
    return K * math.exp(-r * T) * N(-d2) - S * N(-d1)


def align(data, syms):
    common = sorted(set.intersection(*(set(data[s]["date"]) for s in syms)))
    out = {"date": common}
    for s in syms:
        idx = {dd: i for i, dd in enumerate(data[s]["date"])}
        ii = [idx[dd] for dd in common]
        out[s] = {"close": data[s]["close"][ii], "adj": data[s]["adjclose"][ii]}
    return out


def option_ev(rets_px, ref, S0, irx, h):
    q = quotes.option_quote(ref)
    occ = quotes.parse_occ(ref)
    K, kind = occ["strike"], occ["type"]
    T0 = (occ["expiry"] - date(2026, 11, 2)).days / 365
    T1 = T0 - CAL[h] / 365
    iv, mid, ask, bid = float(q["iv"]), q["mid"], q["ask"], q["bid"]
    base = bs(S0, K, T0, iv, irx, kind)
    hs = (ask - bid) / 2 / mid
    proceeds = np.array([mid * bs(S0 * (1 + x), K, T1, iv, irx, kind) / base * (1 - hs) for x in rets_px])
    return proceeds / ask, q


def run_test(name, A, sig_mask, out_sym, ref, data, irx):
    dates = A["date"]
    adj, px = A[out_sym]["adj"], A[out_sym]["close"]
    n = len(dates)
    print(f"\n== {name}: outcome {out_sym}, entry close t+1; reference {ref}")
    S0 = data[out_sym]["close"][-1]
    for h in (3, 5, 10):
        for pname, lo, hi in (("full", "1999-03-11", "2026-12-31"), ("1999-2009", "1999-03-11", "2009-12-31"),
                              ("2010-2026", "2010-01-01", "2026-12-31")):
            ok = [i for i in range(1, n - 1 - h) if lo <= dates[i] <= hi]
            base_all = np.array([adj[i + 1 + h] / adj[i + 1] - 1 for i in ok])
            base_px = np.array([px[i + 1 + h] / px[i + 1] - 1 for i in ok])
            baseline = base_all.mean()
            ev_idx = [i for i in ok if sig_mask[i]]
            used, last = [], -10 ** 9
            for i in ev_idx:
                if i - last > h:
                    used.append(i)
                    last = i
            if not used:
                print(f"  h={h:2} {pname:9} no events")
                continue
            r_all = np.array([adj[i + 1 + h] / adj[i + 1] - 1 for i in ev_idx])
            r = np.array([adj[i + 1 + h] / adj[i + 1] - 1 for i in used])
            rpx = np.array([px[i + 1 + h] / px[i + 1] - 1 for i in used])
            ex = r - baseline
            t = ex.mean() / (ex.std(ddof=1) / math.sqrt(len(ex))) if len(ex) > 2 else float("nan")
            line = (f"  h={h:2} {pname:9} n {len(used):3} (all {len(ev_idx):3}, mean {r_all.mean():+.2%}) | mean {r.mean():+.2%} "
                    f"median {np.median(r):+.2%} hit>0 {np.mean(r > 0):.0%} worst {r.min():+.2%} best {r.max():+.2%} | "
                    f"baseline {baseline:+.2%} | excess {ex.mean():+.2%} t {t:+.2f}")
            if pname in ("full", "2010-2026"):
                evs, q = option_ev(rpx, ref, S0, irx, h)
                boots = [RNG.choice(evs, len(evs)).mean() for _ in range(5000)]
                lo5, hi95 = np.percentile(boots, [5, 95])
                rnd, _ = option_ev(base_px, ref, S0, irx, h)
                line += (f" | option EV/$ {evs.mean():.2f} (90% CI {lo5:.2f}-{hi95:.2f}, win {np.mean(evs > 1):.0%}) "
                         f"vs random {rnd.mean():.2f}")
            print(line)
    q = quotes.option_quote(ref)
    print(f"  reference quote: bid {q['bid']} ask {q['ask']} iv {q['iv']} delta {q['delta']} oi {q['oi']} ({q['source']}); "
          f"S0 {S0:.2f}")
    today = sig_mask[-1]
    print(f"  signal on {dates[-1]}: {'YES' if today else 'no'}")


def part_b(data):
    A = align(data, ["QQQ", "XLE", "SPY"])
    q = A["QQQ"]["adj"]
    qr = np.r_[np.nan, q[1:] / q[:-1] - 1]
    xr = np.r_[np.nan, A["XLE"]["adj"][1:] / A["XLE"]["adj"][:-1] - 1]
    irx = data["^IRX"]["close"][-1] / 100
    print(f"\n(r = ^IRX {irx:.4f} on {data['^IRX']['date'][-1]})")
    run_test("R1 energy rotation", A, (qr <= -0.03) & (xr >= 0), "XLE", REF["R1"][1], data, irx)

    B = align(data, ["QQQ", "TLT"])
    q = B["QQQ"]["adj"]
    qr = np.r_[np.nan, q[1:] / q[:-1] - 1]
    tr = np.r_[np.nan, B["TLT"]["adj"][1:] / B["TLT"]["adj"][:-1] - 1]
    run_test("R2 bond rotation", B, (qr <= -0.03) & (tr >= 0), "TLT", REF["R2"][1], data, irx)

    C = align(data, ["QQQ", "SPY"])
    q, qc = C["QQQ"]["adj"], C["QQQ"]["close"]
    qr = np.r_[np.nan, q[1:] / q[:-1] - 1]
    hi252 = np.array([qc[max(0, i - 251): i + 1].max() for i in range(len(qc))])
    run_test("R3 tape continuation", C, (qr <= -0.03) & (qc >= 0.90 * hi252), "QQQ", REF["R3"][1], data, irx)

    print("\n== RV20 vs quoted IV (brief's 'IV at or below 20-day realized' edge path)")
    for s, ref in (("XLE", REF["R1"][1]), ("TLT", REF["R2"][1]), ("QQQ", REF["R3"][1])):
        c = data[s]["close"]
        lr = np.diff(np.log(c[-21:]))
        rv = lr.std(ddof=1) * math.sqrt(252)
        qq = quotes.option_quote(ref)
        print(f"  {s}: RV20 {rv:.1%} (20 log returns to {data[s]['date'][-1]}) vs {ref} IV {float(qq['iv']):.1%} -> "
              f"ratio {float(qq['iv']) / rv:.2f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=CACHE)
    ap.add_argument("--no-fetch", action="store_true")
    a = ap.parse_args()
    os.makedirs(a.cache, exist_ok=True)
    data = {}
    for s, y in LONG.items():
        data[s] = get(s, y, a.cache, not a.no_fetch)
    for s in SHORT:
        data[s] = get(s, 2024, a.cache, not a.no_fetch)
    print(f"Yahoo daily bars fetched {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC; cache {a.cache}\n")
    part_a(data)
    part_b(data)


if __name__ == "__main__":
    main()
