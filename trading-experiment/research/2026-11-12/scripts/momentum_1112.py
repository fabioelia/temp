#!/usr/bin/env python3
"""Momentum persona, 2026-11-12 (Run B): the tape after Nvidia's CEO resignation, the W2 divergence flag, and the CSCO C1 line.

  python3 -I trading-experiment/research/2026-11-12/scripts/momentum_1112.py [--no-fetch] [--spy-xlsx PATH] [--xlk-xlsx PATH]

Run from /home/user/temp. Descriptive only: no edge figure is computed here (trend filters REJECTED; dip-buying calls after -4%
days retired; no market gates on C1). Data: Yahoo daily bars through quotes.get_json (cached in the scratchpad, last bar 2026-11-12);
index weights from the SSGA SPY and XLK daily holdings files (downloaded to the scratchpad; "As of" date printed).

PART A, the tape: last bar vs the brief's snapshot; 1-day change; distance from the 50- and 200-session simple means (including
  today) and from the 252-session high close; distribution days over the last 25 sessions (close <= -0.2% on volume above the
  prior session's, as in momentum_tape.py); volume vs the prior session and the 50-session mean.
PART B, semis and NVDA: SOXX, SMH, XLK, NVDA, AVGO, AMD, MU, CSCO; NVDA's open/low/close vs the prior close.
PART C, breadth (proxies): RSP - SPY and QQQE - QQQ (equal weight minus cap weight); the 11 SPDR sectors up today and above
  their 50- and 200-session means.
PART D, who loses: NVDA's SPY and XLK weights x its return = its contribution; the account's look-through NVDA exposure
  (VOO shares x VOO close x NVDA's SPY weight, VOO tracking the same index).
PART E, W2 (playbook: SPY up while XLK lags 1 point, SOXX lags 2.5 points, or the W0 basket is down 2%): applies only when SPY's
  1-day change is > 0; otherwise "not applicable", with the spreads printed for the log. W0 basket = the 11/11 permitting-bill
  basket (MSFT AMZN GOOGL GOOG META ORCL EQIX DLR IRM), weighted by tonight's SSGA SPY weights.
PART F, C1 line arithmetic for CSCO (tested rule: gap = close_t / close_{t-1} - 1 <= -0.08, earnings_analysis.py): the exact
  line, the change at 93.85 and the first qualifying cent; RV20 ending 11/12 (the C1 IV gate's denominator, ddof 1, adjusted
  closes, as earnings_analysis.rv20) and 1.3 x RV20.
"""
import argparse
import csv
import math
import os
import sys
import time
import urllib.parse
from datetime import datetime, timezone

import numpy as np

sys.dont_write_bytecode = True
sys.path.insert(0, "/home/user/temp/trading-experiment")
import quotes  # noqa: E402

SCR = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/m1112"
CACHE = os.path.join(SCR, "bars")
LAST = "2026-11-12"
SNAP = {"SPY": 757.12, "QQQ": 688.17, "IWM": 278.44, "NVDA": 166.19, "MSFT": 523.00, "META": 623.61, "AAPL": 354.88,
        "GOOGL": 298.70, "CSCO": 102.01}  # brief.md snapshot and "What moved" (CSCO), 11/12
SECTORS = ["XLK", "XLC", "XLY", "XLF", "XLV", "XLI", "XLB", "XLU", "XLP", "XLRE", "XLE"]
SEMIS = ["SOXX", "SMH", "XLK", "NVDA", "AVGO", "AMD", "MU", "CSCO"]
BASKET = ["MSFT", "AMZN", "GOOGL", "GOOG", "META", "ORCL", "EQIX", "DLR", "IRM"]
SYMS = sorted(set(["SPY", "QQQ", "IWM", "^GSPC", "^IXIC", "RSP", "QQQE", "VOO", "AAPL", "^VIX"] + SECTORS + SEMIS + BASKET))
VOO_SHARES = 1.515826  # brief.md, Robinhood reconciled 11/12


def ts(y):
    return int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())


def fetch(sym, start_year=2024):
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?interval=1d"
           f"&period1={ts(start_year)}&period2={int(time.time())}&includeAdjustedClose=true")
    r = quotes.get_json(url)["chart"]["result"][0]
    q = r["indicators"]["quote"][0]
    adj = (r["indicators"].get("adjclose") or [{}])[0].get("adjclose") or q["close"]
    rows = {}
    for i, t in enumerate(r.get("timestamp") or []):
        if q["close"][i] is None:
            continue
        day = datetime.fromtimestamp(t + 6 * 3600, timezone.utc).date().isoformat()
        rows[day] = (day, q["open"][i], q["high"][i], q["low"][i], q["close"][i],
                     adj[i] if adj[i] is not None else q["close"][i], q["volume"][i] or 0)
    return [rows[k] for k in sorted(rows)]


def get(sym, refetch):
    fn = os.path.join(CACHE, sym.replace("^", "") + ".csv")
    if refetch or not os.path.exists(fn):
        rows = fetch(sym)
        with open(fn, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["date", "open", "high", "low", "close", "adjclose", "volume"])
            w.writerows(rows)
        time.sleep(0.2)
    with open(fn) as f:
        rows = [r for r in csv.DictReader(f) if r["date"] <= LAST]
    out = {"date": [r["date"] for r in rows]}
    for k in ("open", "high", "low", "close", "adjclose", "volume"):
        out[k] = np.array([float(r[k] or 0) for r in rows])
    return out


def ssga_weights(path):
    import openpyxl
    ws = openpyxl.load_workbook(path, read_only=True).active
    asof, w = None, {}
    for r in ws.iter_rows(values_only=True):
        if r and r[0] == "Holdings:":
            asof = r[1]
        elif r and len(r) > 4 and isinstance(r[1], str) and isinstance(r[4], (int, float)):
            w[r[1]] = float(r[4])
    return asof, w


def chg(d, i=-1):
    return d["close"][i] / d["close"][i - 1] - 1


def dist_days(d, window=25):
    c, v, n = d["close"], d["volume"], len(d["close"])
    return [(d["date"][i], c[i] / c[i - 1] - 1, v[i] / v[i - 1]) for i in range(n - window, n)
            if c[i] / c[i - 1] - 1 <= -0.002 and v[i] > v[i - 1]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-fetch", action="store_true")
    ap.add_argument("--spy-xlsx", default=os.path.join(SCR, "dl", "spy.xlsx"))
    ap.add_argument("--xlk-xlsx", default=os.path.join(SCR, "dl", "xlk.xlsx"))
    a = ap.parse_args()
    os.makedirs(CACHE, exist_ok=True)
    data, missing = {}, []
    for s in SYMS:
        try:
            data[s] = get(s, not a.no_fetch)
        except Exception as e:  # noqa: BLE001
            missing.append(f"{s} ({e.__class__.__name__})")
    if missing:
        print("MISSING:", ", ".join(missing))

    print("== A0. Last bar vs the brief (close must match within 0.015)")
    for s, want in SNAP.items():
        d = data[s]
        ok = d["date"][-1] == LAST and abs(d["close"][-1] - want) < 0.015
        print(f"  {s:5} {d['date'][-1]} {d['close'][-1]:.2f} vs {want:.2f} {'OK' if ok else 'MISMATCH'}")

    print("\n== A1. Indexes: 1-day, vs 50d / 200d / 252-session high close, volume, distribution days (25 sessions)")
    for s in ("SPY", "QQQ", "IWM", "^GSPC", "^IXIC", "RSP"):
        d = data[s]
        c, v = d["close"], d["volume"]
        m50, m200, hi = c[-50:].mean(), c[-200:].mean(), c[-252:].max()
        dd = dist_days(d) if v[-1] > 0 else []
        print(f"  {s:6} {c[-1]:9.2f} {chg(d):+6.2%} | 50d {m50:9.2f} ({c[-1] / m50 - 1:+6.2%}) | 200d {m200:9.2f} "
              f"({c[-1] / m200 - 1:+6.2%}) | high {hi:9.2f} ({c[-1] / hi - 1:+6.2%}) | vol {v[-1] / max(v[-2], 1):.2f}x prior, "
              f"{v[-1] / max(v[-51:-1].mean(), 1):.2f}x 50d | dist {len(dd)}"
              + (f" (today {'YES' if dd and dd[-1][0] == LAST else 'no'})" if v[-1] > 0 else ""))
    print(f"  ^VIX {data['^VIX']['close'][-1]:.2f} ({chg(data['^VIX']):+.1%})")

    print("\n== B. Semis and NVDA")
    for s in SEMIS:
        d = data[s]
        c = d["close"]
        print(f"  {s:5} {c[-1]:9.2f} {chg(d):+6.2%} | 5d {c[-1] / c[-6] - 1:+6.2%} | vs 50d {c[-1] / c[-50:].mean() - 1:+6.2%} "
              f"| vs 200d {c[-1] / c[-200:].mean() - 1:+6.2%} | vol {d['volume'][-1] / max(d['volume'][-51:-1].mean(), 1):.2f}x 50d")
    n = data["NVDA"]
    pc = n["close"][-2]
    print(f"  NVDA prior close {pc:.2f}; open {n['open'][-1]:.2f} ({n['open'][-1] / pc - 1:+.2%}), low {n['low'][-1]:.2f} "
          f"({n['low'][-1] / pc - 1:+.2%}), high {n['high'][-1]:.2f}, close {n['close'][-1]:.2f} ({chg(n):+.2%}); "
          f"close in day range {(n['close'][-1] - n['low'][-1]) / (n['high'][-1] - n['low'][-1]):.0%}; "
          f"vol {n['volume'][-1]:,.0f} = {n['volume'][-1] / n['volume'][-51:-1].mean():.2f}x 50d")

    print("\n== C. Breadth proxies")
    print(f"  RSP - SPY {chg(data['RSP']) - chg(data['SPY']):+.2%} (RSP {chg(data['RSP']):+.2%}); "
          f"QQQE - QQQ {chg(data['QQQE']) - chg(data['QQQ']):+.2%} (QQQE {chg(data['QQQE']):+.2%}); "
          f"IWM - SPY {chg(data['IWM']) - chg(data['SPY']):+.2%}")
    up = [s for s in SECTORS if chg(data[s]) > 0]
    a50 = [s for s in SECTORS if data[s]["close"][-1] > data[s]["close"][-50:].mean()]
    a200 = [s for s in SECTORS if data[s]["close"][-1] > data[s]["close"][-200:].mean()]
    print(f"  sectors up {len(up)}/11 ({' '.join(up)}); above 50d {len(a50)}/11; above 200d {len(a200)}/11")
    print("  " + " ".join(f"{s} {chg(data[s]):+.1%}" for s in sorted(SECTORS, key=lambda s: chg(data[s]))))

    print("\n== D. Who loses: NVDA weight x return")
    asof, ws = ssga_weights(a.spy_xlsx)
    asof_k, wk = ssga_weights(a.xlk_xlsx)
    rn, rs = chg(data["NVDA"]), chg(data["SPY"])
    print(f"  SPY holdings {asof}: NVDA {ws['NVDA']:.2f}% -> contribution {ws['NVDA'] * rn:+.3f} pts of SPY's {rs * 100:+.3f} "
          f"({ws['NVDA'] * rn / (rs * 100):.0%}); SPY ex-NVDA approx {(rs * 100 - ws['NVDA'] * rn) / (1 - ws['NVDA'] / 100):+.3f}%")
    print(f"  XLK holdings {asof_k}: NVDA {wk['NVDA']:.2f}% -> {wk['NVDA'] * rn:+.3f} pts of XLK's {chg(data['XLK']) * 100:+.3f}")
    top = sorted(ws.items(), key=lambda kv: -kv[1])[:10]
    print("  SPY top 10: " + ", ".join(f"{k} {v:.2f}" for k, v in top))
    voo = VOO_SHARES * data["VOO"]["close"][-1]
    print(f"  Account: VOO {VOO_SHARES} x {data['VOO']['close'][-1]:.2f} = ${voo:,.2f}; look-through NVDA "
          f"${voo * ws['NVDA'] / 100:,.2f}; today's NVDA move on it ${voo * ws['NVDA'] / 100 * rn / (1 + rn):+.2f} (approx)")

    print("\n== E. W2 divergence flag")
    xl, so = chg(data["XLK"]) - rs, chg(data["SOXX"]) - rs
    bw = sum(ws.get(t, 0) for t in BASKET)
    br = sum(ws.get(t, 0) * chg(data[t]) for t in BASKET) / bw
    print(f"  SPY {rs:+.2%} -> W2 {'APPLIES' if rs > 0 else 'NOT APPLICABLE (SPY not up)'}")
    print(f"  logged: XLK {chg(data['XLK']):+.2%} (vs SPY {xl * 100:+.2f} pts; flag needs <= -1.0); SOXX {chg(data['SOXX']):+.2%} "
          f"(vs SPY {so * 100:+.2f}; needs <= -2.5); W0 basket {bw:.2f}% of SPY, {br:+.2%} (needs <= -2.0%)")
    print("  basket: " + ", ".join(f"{t} {ws.get(t, 0):.2f} {chg(data[t]):+.2%}" for t in BASKET))

    print("\n== F. CSCO C1 line")
    c = data["CSCO"]
    pre = c["close"][-1]
    line = 0.92 * pre
    print(f"  pre-earnings close {pre:.2f}; exact line 0.92 x {pre:.2f} = {line:.4f}; 93.85 is {93.85 / pre - 1:+.4%}; "
          f"93.84 is {93.84 / pre - 1:+.4%}; first qualifying cent {math.floor(line * 100) / 100:.2f}")
    p = c["adjclose"]
    rv = float(np.std(np.diff(np.log(p[-21:])), ddof=1) * math.sqrt(252))
    rvc = float(np.std(np.diff(np.log(c["close"][-21:])), ddof=1) * math.sqrt(252))
    print(f"  RV20 ending {c['date'][-1]} (adj closes {c['date'][-21]}..{c['date'][-1]}): {rv:.2%} (raw closes {rvc:.2%}); "
          f"IV cap 1.3x = {1.3 * rv:.2%}")
    print(f"  CSCO 11/12 {chg(c):+.2%}, vs 50d {pre / c['close'][-50:].mean() - 1:+.2%}, vs 252-session high "
          f"{pre / c['close'][-252:].max() - 1:+.2%}")


if __name__ == "__main__":
    main()
