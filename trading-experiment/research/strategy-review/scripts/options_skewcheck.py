#!/usr/bin/env python3
"""Post-hoc calibration of the no-skew bias: today's IV of 21-35 DTE SPY/IWM options by delta, relative to VIX (SPY) and RVX (IWM).

Run: python3 -I options_skewcheck.py fetch   (saves the Cboe delayed chains and index quotes to the scratchpad cache)
     python3 -I options_skewcheck.py         (reads the saved JSON and prints IV / index-vol by delta bucket)
"""
import json
import os
import sys
from datetime import date

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-data/options'


def fetch():
    sys.path.insert(0, '/home/user/temp/trading-experiment')
    import quotes
    for u in ('SPY', 'IWM', '_VIX'):
        data = quotes.get_json(f'https://cdn.cboe.com/api/global/delayed_quotes/options/{u}.json')
        with open(os.path.join(CACHE, f'chain_{u}.json'), 'w') as f:
            json.dump(data, f)
        print(u, 'saved', len(data.get('data', {}).get('options', [])), 'options')
    try:  # no RVX option chain on Cboe's CDN; try the index quote
        data = quotes.get_json('https://cdn.cboe.com/api/global/delayed_quotes/quotes/_RVX.json')
        with open(os.path.join(CACHE, 'quote__RVX.json'), 'w') as f:
            json.dump(data, f)
        print('_RVX quote saved')
    except Exception as e:  # noqa: BLE001
        print('_RVX quote unavailable:', e)


def occ(sym):
    s = sym.strip()
    root = s[:-15]
    y, m, d = int(s[-15:-13]), int(s[-13:-11]), int(s[-11:-9])
    return root, date(2000 + y, m, d), s[-9], int(s[-8:]) / 1000.0


def main():
    vix = json.load(open(os.path.join(CACHE, 'chain__VIX.json')))['data']
    qp = os.path.join(CACHE, 'quote__RVX.json')
    if os.path.exists(qp):
        rv = float(json.load(open(qp))['data']['current_price'])
    else:  # last close in the Cboe RVX history file
        rv = float(open(os.path.join(CACHE, 'RVX_cboe.csv')).read().strip().splitlines()[-1].split(',')[4])
    idx_vol = {'SPY': float(vix['current_price']), 'IWM': rv}
    print('VIX', idx_vol['SPY'], 'RVX', idx_vol['IWM'], 'quote time', vix.get('last_trade_time'))
    for u in ('SPY', 'IWM'):
        data = json.load(open(os.path.join(CACHE, f'chain_{u}.json')))['data']
        today = date.fromisoformat(str(data.get('last_trade_time', '2026-10-29'))[:10])
        spot = float(data['current_price'])
        buckets = {}
        for o in data['options']:
            root, exp, typ, k = occ(o['option'])
            dte = (exp - today).days
            if not 21 <= dte <= 35 or not o.get('iv') or not o.get('delta'):
                continue
            dl = abs(float(o['delta']))
            for lo, hi, lab in ((0.08, 0.12, '0.10'), (0.18, 0.22, '0.20'), (0.28, 0.32, '0.30'), (0.33, 0.37, '0.35'),
                                (0.38, 0.42, '0.40'), (0.48, 0.52, '0.50')):
                if lo <= dl <= hi and (o.get('bid') or 0) > 0:
                    buckets.setdefault((typ, lab), []).append(float(o['iv']) * 100 / idx_vol[u])
        print(f'{u} spot {spot}  IV / {"VIX" if u == "SPY" else "RVX"} by |delta| (21-35 DTE, quoted contracts)')
        for key in sorted(buckets):
            v = sorted(buckets[key])
            print(f'   {key[0]} {key[1]}  n {len(v):3d}  median ratio {v[len(v) // 2]:.3f}  range {v[0]:.3f}-{v[-1]:.3f}')


if __name__ == '__main__':
    fetch() if sys.argv[1:] == ['fetch'] else main()
