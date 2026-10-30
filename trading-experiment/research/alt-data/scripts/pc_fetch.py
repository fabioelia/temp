#!/usr/bin/env python3
"""E3 data fetch: Cboe put/call archive files and Yahoo daily bars, cached in the scratchpad (never in the repo).

  python3 -I pc_fetch.py [--out DIR]

Writes <out>/cboe/{equitypc,totalpc}.csv (raw, as served, after redirects) and
<out>/yahoo/{SPY,VIX,IRX}.csv (date,close,adjclose) plus SPY_div.csv (date,dividend).
^IRX (13-week T-bill) is the risk-free rate for the Black-Scholes translation, as in the strategy-review options tests.
"""
import argparse
import csv
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

sys.dont_write_bytecode = True
sys.path.insert(0, "/home/user/temp/trading-experiment")
import quotes  # noqa: E402

DEFAULT_OUT = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/alt-data"
CBOE = "https://cdn.cboe.com/resources/options/volume_and_call_put_ratios/{}.csv"
YAHOO = {"SPY": ("SPY", 2005), "VIX": ("^VIX", 2005), "IRX": ("^IRX", 2005)}
END = int(time.time())


def fetch_cboe(out):
    os.makedirs(out, exist_ok=True)
    for name in ("equitypc", "totalpc"):
        req = urllib.request.Request(CBOE.format(name), headers={"User-Agent": quotes.UA})
        with urllib.request.urlopen(req, timeout=30) as r:  # urllib follows redirects
            body = r.read()
            print(f"{name}: HTTP {r.status} final URL {r.geturl()} {len(body)} bytes")
        with open(os.path.join(out, f"{name}.csv"), "wb") as f:
            f.write(body)


def ts(y):
    return int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())


def fetch_yahoo(sym, y0):
    rows, divs = {}, {}
    y = y0
    while True:
        p1, p2 = ts(y), min(ts(y + 8), END)
        url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?interval=1d"
               f"&period1={p1}&period2={p2}&events=div&includeAdjustedClose=true")
        d = quotes.get_json(url)
        r = d["chart"]["result"][0]
        if r["meta"].get("dataGranularity") != "1d":
            raise SystemExit(f"{sym} {y}: granularity {r['meta'].get('dataGranularity')}")
        q = r["indicators"]["quote"][0]
        adj = (r["indicators"].get("adjclose") or [{}])[0].get("adjclose") or q["close"]
        for i, t in enumerate(r.get("timestamp") or []):
            c = q["close"][i]
            if c is None:
                continue
            day = datetime.fromtimestamp(t + 6 * 3600, timezone.utc).date().isoformat()  # bars stamped at the ET open
            rows[day] = (day, c, adj[i] if adj[i] is not None else c)
        for ev in ((r.get("events") or {}).get("dividends") or {}).values():
            divs[datetime.fromtimestamp(ev["date"] + 6 * 3600, timezone.utc).date().isoformat()] = ev["amount"]
        if p2 >= END:
            break
        y += 8
        time.sleep(0.3)
    return [rows[k] for k in sorted(rows)], divs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    a = ap.parse_args()
    fetch_cboe(os.path.join(a.out, "cboe"))
    yd = os.path.join(a.out, "yahoo")
    os.makedirs(yd, exist_ok=True)
    for name, (sym, y0) in YAHOO.items():
        rows, divs = fetch_yahoo(sym, y0)
        with open(os.path.join(yd, f"{name}.csv"), "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["date", "close", "adjclose"])
            w.writerows(rows)
        print(f"{sym}: {len(rows)} bars {rows[0][0]} .. {rows[-1][0]}")
        if name == "SPY":
            with open(os.path.join(yd, "SPY_div.csv"), "w", newline="") as f:
                w = csv.writer(f)
                w.writerow(["date", "dividend"])
                for k in sorted(divs):
                    w.writerow([k, divs[k]])
            print(f"SPY dividends: {len(divs)}")


if __name__ == "__main__":
    main()
