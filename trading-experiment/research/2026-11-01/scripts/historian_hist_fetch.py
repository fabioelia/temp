#!/usr/bin/env python3
"""Historian 2026-11-01: fetch Yahoo daily bars (unadjusted close, adjusted close) into the scratchpad cache.

Run (from /home/user/temp):  python3 -I trading-experiment/research/2026-11-01/scripts/historian_hist_fetch.py
Writes <CACHE>/<name>.csv with date,close,adjclose and prints the last bar of each series with the fetch time (ET),
so every number downstream can cite "Yahoo daily, fetched <time>". Fetches in 10-year chunks so Yahoo returns daily bars.
"""
import csv
import os
import sys
import time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

sys.path.insert(0, '/home/user/temp/trading-experiment')
import quotes  # noqa: E402

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/hist1101'
ET = ZoneInfo('America/New_York')
SYMS = {'NDX': ('%5ENDX', 1985), 'QQQ': ('QQQ', 1999), 'SPY': ('SPY', 1993), 'GSPC': ('%5EGSPC', 1950),
        'VIX': ('%5EVIX', 1990), 'VXN': ('%5EVXN', 2001), 'IRX': ('%5EIRX', 2016),
        'AAPL': ('AAPL', 2025), 'AMD': ('AMD', 2025), 'QCOM': ('QCOM', 2025)}


def chunks(y0):
    now = int(time.time()) + 86400
    y = y0
    while True:
        a = int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())
        b = int(datetime(y + 10, 1, 1, tzinfo=timezone.utc).timestamp())
        yield a, min(b, now)
        if b >= now:
            break
        y += 10


def main():
    os.makedirs(CACHE, exist_ok=True)
    print('fetched', datetime.now(ET).strftime('%Y-%m-%d %H:%M ET'))
    for name, (ysym, y0) in SYMS.items():
        rows = {}
        for a, b in chunks(y0):
            url = (f'https://query1.finance.yahoo.com/v8/finance/chart/{ysym}?interval=1d&period1={a}&period2={b}'
                   f'&includeAdjustedClose=true')
            try:
                res = quotes.get_json(url)['chart']['result'][0]
            except Exception as e:  # noqa: BLE001
                print(name, a, 'ERROR', e)
                continue
            ts = res.get('timestamp') or []
            q = res['indicators']['quote'][0]
            adj = (res['indicators'].get('adjclose') or [{}])[0].get('adjclose') or [None] * len(ts)
            for t, c, ac in zip(ts, q.get('close', []), adj):
                if c is None:
                    continue
                rows[datetime.fromtimestamp(t, ET).date().isoformat()] = (c, ac if ac is not None else c)
        ds = sorted(rows)
        with open(os.path.join(CACHE, f'{name}.csv'), 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(['date', 'close', 'adjclose'])
            for d in ds:
                w.writerow([d, *rows[d]])
        print(f'{name:5} {ds[0]} .. {ds[-1]} n {len(ds):6d}  last close {rows[ds[-1]][0]:.2f}')


if __name__ == '__main__':
    main()
