#!/usr/bin/env python3
"""Fetch Yahoo daily bars for the calendar claims (A1-A3) and cache the raw JSON in the scratchpad.

Fetches ^GSPC 1950-2026, SPY 1993-2026 and ^VIX 1990-2026 (IV for the options translation) in decade chunks so Yahoo cannot fall back to coarser bars on long ranges.
Raw responses are written untouched; parsing happens in calendar_tests.py (run with python -I).

  python3 calendar_fetch.py [OUT_DIR]
"""
import json
import os
import sys
import time
import urllib.parse
from datetime import datetime, timezone

sys.path.insert(0, '/home/user/temp/trading-experiment')
import quotes  # noqa: E402

OUT = sys.argv[1] if len(sys.argv) > 1 else \
    '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-data'
END = 1793246400  # 2026-10-29 04:00 UTC: includes the 10/28 close, excludes any partial 10/29 bar


def ts(y):
    return int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())


def fetch(sym, y0, y1):
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?interval=1d"
           f"&period1={ts(y0)}&period2={min(ts(y1), END)}&includeAdjustedClose=true&events=div,split")
    data = quotes.get_json(url)
    res = data['chart']['result'][0]
    stamps = res.get('timestamp') or []
    gran = res['meta'].get('dataGranularity')
    gaps = [b - a for a, b in zip(stamps, stamps[1:])]
    med = sorted(gaps)[len(gaps) // 2] if gaps else None
    if gran != '1d' or (med is not None and med > 4 * 86400):
        raise SystemExit(f"{sym} {y0}-{y1}: not daily (granularity {gran}, median gap {med}s)")
    return data, len(stamps)


def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = [('^GSPC', y, y + 10) for y in range(1950, 2030, 10)] + [('SPY', y, y + 10) for y in (1990, 2000, 2010, 2020)] \
        + [('^VIX', y, y + 10) for y in (1990, 2000, 2010, 2020)]
    for sym, y0, y1 in jobs:
        name = f"calendar_{sym.replace('^', '')}_{y0}.json"
        data, n = fetch(sym, y0, y1)
        with open(os.path.join(OUT, name), 'w') as f:
            json.dump(data, f)
        print(f"{name}: {n} daily bars")
        time.sleep(0.5)


if __name__ == '__main__':
    main()
