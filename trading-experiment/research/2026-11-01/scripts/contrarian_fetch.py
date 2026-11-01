#!/usr/bin/env python3
"""Contrarian persona, 2026-11-01: fetch the raw inputs for the skew / IV-vs-RV read and the drawdown base-rate test.

Saves (to the scratchpad data folder; raw provider JSON, never edited):
  * Cboe delayed option chains for QQQ, SMH, NVDA (cdn.cboe.com, 15-min delayed; on a Sunday this is the Fri 10/30 close)
  * Yahoo daily bars, full history, for ^NDX, QQQ, SMH, NVDA, ^VXN, ^VIX, SPY

Run (from /home/user/temp):  python3 -I trading-experiment/research/2026-11-01/scripts/contrarian_fetch.py
"""
import json
import os
import sys
import urllib.parse
from datetime import datetime

sys.path.insert(0, '/home/user/temp/trading-experiment')
import quotes  # noqa: E402

OUT = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/contrarian1101/data'


def main():
    os.makedirs(OUT, exist_ok=True)
    stamp = datetime.now(quotes.ET).strftime('%Y-%m-%dT%H:%M ET')
    for u in ('QQQ', 'SMH', 'NVDA'):
        d = quotes.get_json(f'https://cdn.cboe.com/api/global/delayed_quotes/options/{u}.json')
        d['_fetched'] = stamp
        json.dump(d, open(os.path.join(OUT, f'chain_{u}.json'), 'w'))
        print(u, 'chain', len(d['data']['options']), 'options; cboe timestamp', d.get('timestamp'), '; fetched', stamp)
    for sym in ('^NDX', 'QQQ', 'SMH', 'NVDA', '^VXN', '^VIX', 'SPY'):
        url = (f'https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}'
               '?period1=0&period2=9999999999&interval=1d&events=div,split')
        d = quotes.get_json(url)
        res = d['chart']['result'][0]
        q = res['indicators']['quote'][0]
        rows = []
        for i, t in enumerate(res['timestamp']):
            c = q['close'][i]
            if c is None or c <= 0:
                continue
            rows.append([datetime.fromtimestamp(t, quotes.ET).date().isoformat(), q['open'][i], q['high'][i], q['low'][i], c,
                         q['volume'][i]])
        json.dump({'symbol': sym, 'fetched': stamp, 'source': 'Yahoo chart API v8, 1d', 'rows': rows},
                  open(os.path.join(OUT, f"bars_{sym.replace('^', '')}.json"), 'w'))
        print(sym, len(rows), 'bars', rows[0][0], '->', rows[-1][0], 'last close', rows[-1][4])


if __name__ == '__main__':
    main()
