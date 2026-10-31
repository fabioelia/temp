#!/usr/bin/env python3
"""Fetch Yahoo daily bars for the B1/B2 pattern tests and cache them as CSV in the scratchpad.

  python3 -I patterns_fetch.py [--out DIR]

Symbols: ^GSPC (1950-, with volume), SPY (1993-), ^VIX (1990-), ^IRX (risk-free, 1960-),
IWM (2000-) and ^RVX (2004-) for the post-hoc IWM check. Fetched in 8-year chunks so Yahoo
never falls back to coarser bars; each chunk's granularity is checked to be 1d.
"""
import argparse
import csv
import os
import sys
import time
import urllib.parse
from datetime import datetime, timezone

sys.path.insert(0, "/home/user/temp/trading-experiment")
import quotes  # noqa: E402

DEFAULT_OUT = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-data"
SYMBOLS = {"^GSPC": 1950, "SPY": 1993, "^VIX": 1990, "^IRX": 1960, "IWM": 2000, "^RVX": 2004}
END = int(time.time())  # through the latest bar


def ts(y):
    return int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())


def fetch(sym, start_year):
    rows = {}
    y = start_year
    while True:
        p1, p2 = ts(y), min(ts(y + 8), END)
        url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?interval=1d"
               f"&period1={p1}&period2={p2}&includeAdjustedClose=true")
        try:
            d = quotes.get_json(url)
        except quotes.ProviderError as e:  # a chunk before the symbol's history starts returns 404
            print(f"  {sym} {y}: {e}", file=sys.stderr)
            if p2 >= END:
                break
            y += 8
            continue
        r = d["chart"]["result"][0]
        gran = r["meta"].get("dataGranularity")
        if gran != "1d":
            raise SystemExit(f"{sym} {y}: granularity {gran}")
        q = r["indicators"]["quote"][0]
        adj = r["indicators"].get("adjclose", [{}])[0].get("adjclose") or q["close"]
        for i, t in enumerate(r.get("timestamp") or []):
            c = q["close"][i]
            if c is None:
                continue
            # Yahoo stamps daily bars at the session open (US/Eastern); the UTC date is the session date
            day = datetime.fromtimestamp(t + 6 * 3600, timezone.utc).date().isoformat()
            rows[day] = (day, q["open"][i], q["high"][i], q["low"][i], c, adj[i] if adj[i] is not None else c,
                         q["volume"][i] or 0)
        if p2 >= END:
            break
        y += 8
        time.sleep(0.3)
    return [rows[k] for k in sorted(rows)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    for sym, y in SYMBOLS.items():
        rows = fetch(sym, y)
        if not rows:
            print(f"{sym}: no data on Yahoo (the IWM check falls back to VIX x 1.25)")
            continue
        fn = os.path.join(a.out, sym.replace("^", "") + ".csv")
        with open(fn, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["date", "open", "high", "low", "close", "adjclose", "volume"])
            w.writerows(rows)
        print(f"{sym}: {len(rows)} bars {rows[0][0]} .. {rows[-1][0]} -> {fn}")


if __name__ == "__main__":
    main()
