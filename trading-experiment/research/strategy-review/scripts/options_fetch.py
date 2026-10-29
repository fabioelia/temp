#!/usr/bin/env python3
"""Fetch Yahoo daily bars for the options (D1-D4) tests into the scratchpad cache.

Run:  python3 -I options_fetch.py
Writes <CACHE>/<name>.csv with date,close,adjclose,volume and <CACHE>/<name>_div.csv (dividends, where Yahoo has them).
Fetches in 10-year chunks so Yahoo always returns daily bars; checks the bar spacing.
"""
import csv
import json
import os
import sys
import time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

sys.path.insert(0, '/home/user/temp/trading-experiment')
import quotes  # noqa: E402

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-data/options'
ET = ZoneInfo('America/New_York')
SYMS = {'GSPC': '%5EGSPC', 'VIX': '%5EVIX', 'SPY': 'SPY', 'IRX': '%5EIRX', 'IWM': 'IWM',
        'RVX': '%5ERVX', 'VIX9D': '%5EVIX9D', 'VIX3M': '%5EVIX3M'}
START = datetime(1990, 1, 1, tzinfo=timezone.utc)


def chunks():
    y = 1990
    now = int(time.time()) + 86400
    while True:
        a = int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())
        b = int(datetime(y + 10, 1, 1, tzinfo=timezone.utc).timestamp())
        yield a, min(b, now)
        if b >= now:
            break
        y += 10


def main():
    os.makedirs(CACHE, exist_ok=True)
    for name, ysym in SYMS.items():
        rows, divs = {}, {}
        for a, b in chunks():
            url = (f'https://query1.finance.yahoo.com/v8/finance/chart/{ysym}?interval=1d&period1={a}&period2={b}'
                   f'&events=div&includeAdjustedClose=true')
            try:
                data = quotes.get_json(url)
            except Exception as e:  # noqa: BLE001
                print(name, a, 'ERROR', e)
                continue
            res = (data.get('chart') or {}).get('result')
            if not res:
                print(name, a, 'no result')
                continue
            res = res[0]
            gran = res.get('meta', {}).get('dataGranularity')
            ts = res.get('timestamp') or []
            q = res['indicators']['quote'][0]
            adj = (res['indicators'].get('adjclose') or [{}])[0].get('adjclose') or [None] * len(ts)
            for t, c, v, ac in zip(ts, q.get('close', []), q.get('volume', []), adj):
                if c is None:
                    continue
                d = datetime.fromtimestamp(t, ET).date().isoformat()
                rows[d] = (c, ac if ac is not None else c, v if v is not None else 0)
            for _, ev in ((res.get('events') or {}).get('dividends') or {}).items():
                d = datetime.fromtimestamp(ev['date'], ET).date().isoformat()
                divs[d] = ev['amount']
            print(name, datetime.fromtimestamp(a, timezone.utc).date(), 'granularity', gran, 'bars', len(ts))
        ds = sorted(rows)
        if len(ds) > 10:
            gaps = [(datetime.fromisoformat(y) - datetime.fromisoformat(x)).days for x, y in zip(ds, ds[1:])]
            print(name, ds[0], ds[-1], 'n', len(ds), 'max gap days', max(gaps))
        with open(os.path.join(CACHE, f'{name}.csv'), 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(['date', 'close', 'adjclose', 'volume'])
            for d in ds:
                w.writerow([d, *rows[d]])
        if divs:
            with open(os.path.join(CACHE, f'{name}_div.csv'), 'w', newline='') as f:
                w = csv.writer(f)
                w.writerow(['date', 'dividend'])
                for d in sorted(divs):
                    w.writerow([d, divs[d]])


if __name__ == '__main__':
    main()
