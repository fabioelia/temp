#!/usr/bin/env python3
"""Historian 2026-11-01: today's IV and quotes from the Cboe delayed chain (single source), for SPY and QQQ.

Run (from /home/user/temp):  python3 -I trading-experiment/research/2026-11-01/scripts/chain_snapshot.py
* Saves each raw chain to <CACHE>/cboe_<SYM>.json (untrusted data) and prints Cboe's own timestamp.
* Prints the calls nearest delta 0.40 for the 21-35 DTE expiries (from Mon 11/2: 11/27, 11/30, 12/04) with bid, ask, spread % of mid, IV,
  delta and OI, and flags the contract-rule checks (delta 0.30-0.45, OI >= 1,000, spread <= 5% of mid).
* Prints the risk-neutral probability that SPY closes 11/20 below the "cash beats SPY" level (put-spread digital), as a market cross-check.
Writes <CACHE>/calls040.csv for the downstream scripts.
"""
import csv
import json
import os
import sys
from datetime import date

sys.path.insert(0, '/home/user/temp/trading-experiment')
import quotes  # noqa: E402

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/hist1101'
EXPIRIES = ['2026-11-27', '2026-11-30', '2026-12-04']
CASH_LEVEL = 755.72 * 1919.92 / 1970.94   # SPY level at which paper equity equals SPY buy-and-hold (brief: SPY B&H $1,970.94 at 755.72)


def mid(o):
    b, a = o.get('bid') or 0, o.get('ask') or 0
    return (a + b) / 2 if a and b else None


def main():
    os.makedirs(CACHE, exist_ok=True)
    out = []
    chains = {}
    for u in ['SPY', 'QQQ']:
        d = quotes.get_json(f'https://cdn.cboe.com/api/global/delayed_quotes/options/{u}.json')
        with open(os.path.join(CACHE, f'cboe_{u}.json'), 'w') as f:
            json.dump(d, f)
        dd = d['data']
        print(f"{u}: Cboe timestamp {d['timestamp']}, underlying close {dd['close']} (last trade {dd['last_trade_time']}), Cboe iv30 {dd.get('iv30')}")
        chains[u] = {o['option']: o for o in dd['options'] if quotes.parse_occ(o['option'])}
        for exp in EXPIRIES:
            calls = [(o, quotes.parse_occ(s)) for s, o in chains[u].items()
                     if quotes.parse_occ(s)['expiry'].isoformat() == exp and quotes.parse_occ(s)['type'] == 'C' and o.get('delta')]
            calls.sort(key=lambda x: abs(x[0]['delta'] - 0.40))

            def passes(o):
                m = mid(o)
                return bool(m) and 0.30 <= o['delta'] <= 0.45 and int(o.get('open_interest') or 0) >= 1000 and (o['ask'] - o['bid']) / m <= 0.05
            shown = calls[:2] + [c for c in calls if passes(c[0])][:2]   # the two nearest delta 0.40, then the two nearest that pass every rule
            seen = set()
            for o, occ in shown:
                if o['option'] in seen:
                    continue
                seen.add(o['option'])
                m = mid(o)
                spr = (o['ask'] - o['bid']) / m if m else float('nan')
                oi = int(o.get('open_interest') or 0)
                ok = passes(o)
                dte = (occ['expiry'] - date(2026, 11, 2)).days
                print(f"  {o['option']} dte(11/2) {dte} K {occ['strike']:.0f} bid {o['bid']:.2f} ask {o['ask']:.2f} spread {spr:.1%} "
                      f"iv {o['iv']:.4f} delta {o['delta']:.3f} oi {oi} {'OK' if ok else 'fails rule'}")
                out.append({'underlying': u, 'contract': o['option'], 'expiry': exp, 'strike': occ['strike'], 'bid': o['bid'],
                            'ask': o['ask'], 'iv': o['iv'], 'delta': o['delta'], 'oi': oi, 'spread': round(spr, 4),
                            'spot': dd['close'], 'cboe_ts': d['timestamp'], 'rule_ok': ok})
    with open(os.path.join(CACHE, 'calls040.csv'), 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(out[0]))
        w.writeheader()
        w.writerows(out)
    # risk-neutral digital: P(SPY_11/20 < K) ~ (P(K+h) - P(K-h)) / 2h, from mids
    puts = {quotes.parse_occ(s)['strike']: o for s, o in chains['SPY'].items()
            if quotes.parse_occ(s)['expiry'].isoformat() == '2026-11-20' and quotes.parse_occ(s)['type'] == 'P'}
    k = round(CASH_LEVEL)
    for h in (1, 2, 5):
        lo, hi = puts.get(k - h), puts.get(k + h)
        if lo and hi and mid(lo) and mid(hi):
            print(f"SPY 11/20 risk-neutral P(close < {k}) from the {k - h}/{k + h} put mids: {(mid(hi) - mid(lo)) / (2 * h):.1%} "
                  f"(cash level {CASH_LEVEL:.2f}; IV {lo['iv']:.3f}/{hi['iv']:.3f})")


if __name__ == '__main__':
    main()
