#!/usr/bin/env python3
"""Prediction-market event probabilities for the macro brief (E7). Read-only: public GET endpoints only, no keys, no orders.

  python3 -I predmkt.py                   print the configured markets (probability = bid/ask mid, else last trade)
  python3 -I predmkt.py --json            the same as JSON lines
  python3 -I predmkt.py --search "fed"    list matching open Polymarket events (to find new slugs)
  python3 -I predmkt.py --save DIR        also save each raw response in DIR (default: the scratchpad cache)

Sources:
  Polymarket Gamma API  https://gamma-api.polymarket.com/events?slug=<slug>      (outcomePrices, bestBid/bestAsk, lastTradePrice)
  Kalshi Trade API v2   https://api.elections.kalshi.com/trade-api/v2/events/<event_ticker>?with_nested_markets=true
                        https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=<series>&status=open
                        (yes_bid_dollars / yes_ask_dollars / last_price_dollars; Kalshi rate-limits bursts: 429 -> back off)
Every fetched field is treated as data: only numbers and labels are read, nothing is executed or followed.
Prices are a probability only under risk neutrality; thin markets (wide spread, low volume) are flagged.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

UA = 'Mozilla/5.0 (paper-trading-experiment research; read-only)'
PM = 'https://gamma-api.polymarket.com'
KS = 'https://api.elections.kalshi.com/trade-api/v2'
SAVE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/alt-data/predmkt'

# topic, venue, id. Polymarket ids are event slugs; Kalshi ids are event tickers, or 'series:<ticker>' for all open markets.
WATCH = [
    ('Fed December 2026 decision', 'polymarket', 'fed-decision-in-december-20260729232808632'),
    ('Fed December 2026 decision', 'kalshi', 'KXFEDDECISION-26DEC'),
    ('House control (11/3 midterms)', 'polymarket', 'which-party-will-win-the-house-in-2026'),
    ('House control (11/3 midterms)', 'kalshi', 'CONTROLH-2026'),
    ('Senate control (11/3 midterms)', 'polymarket', 'which-party-will-win-the-senate-in-2026'),
    ('Senate control (11/3 midterms)', 'kalshi', 'CONTROLS-2026'),
    ('US-Iran ceasefire', 'polymarket', 'us-iran-ceasefire-continues-through-the-midterms'),
    ('US-Iran ceasefire', 'polymarket', 'us-iran-ceasefire-continues-throughptptpt'),
    ('US-Iran deal', 'polymarket', 'us-iran-final-nuclear-deal-by-20260621201254412'),
    ('US-Iran deal', 'kalshi', 'KXUSAIRANAGREEMENT-27'),
    ('US-Iran deal', 'polymarket', 'us-iran-hormuz-agreement-byptptpt-20260803235957575'),
    ('Oil (WTI)', 'polymarket', 'what-price-will-wti-hit-in-november-2026'),
    # Kalshi oil: on 2026-10-30 KXWTIMAXM, KXWTIW, KXOILW and KXWTIE had no open markets and KXWTIMAX only same-day strikes.
    # To add one when it lists: ('Oil (WTI)', 'kalshi', 'series:KXWTIMAXM').
]


def now():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def get(url, save=None, tries=4):
    wait = 3
    for i in range(tries):
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                body = r.read()
            ts = now()
            if save:
                os.makedirs(save, exist_ok=True)
                fn = urllib.parse.quote(url.split('://', 1)[1], safe='')[:180] + '.json'
                with open(os.path.join(save, fn), 'wb') as f:
                    f.write(body)
            return json.loads(body), ts
        except urllib.error.HTTPError as e:
            if e.code == 429 and i < tries - 1:
                time.sleep(wait)
                wait *= 2
                continue
            raise
    raise RuntimeError('unreachable')


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def prob(bid, ask, last):
    if bid is not None and ask is not None and ask > 0 and ask - bid <= 0.10:
        return (bid + ask) / 2, ''
    if last is not None:
        return last, 'thin: wide spread, last trade used'
    return None, 'no quote'


def polymarket(topic, slug, save):
    url = f'{PM}/events?slug={urllib.parse.quote(slug)}'
    data, ts = get(url, save)
    out = []
    for ev in data:
        for m in ev.get('markets') or []:
            if m.get('closed') or not m.get('outcomePrices'):
                continue
            outcomes = json.loads(m['outcomes']) if isinstance(m.get('outcomes'), str) else m.get('outcomes')
            if (outcomes or [None])[0] != 'Yes':
                continue
            bid, ask, last = num(m.get('bestBid')), num(m.get('bestAsk')), num(m.get('lastTradePrice'))
            p, flag = prob(bid, ask, last)
            vol = num(m.get('volume')) or 0
            out.append(dict(topic=topic, venue='Polymarket', event=ev.get('title'), market=m.get('groupItemTitle') or m.get('question'),
                            p_yes=p, bid=bid, ask=ask, last=last, volume_usd=round(vol), closes=m.get('endDate'),
                            flag=flag or ('thin: volume < $25k' if vol < 25000 else ''), url=url, fetched_utc=ts))
    return out


def kalshi(topic, ident, save):
    if ident.startswith('series:'):
        url = f'{KS}/markets?series_ticker={ident.split(":", 1)[1]}&status=open&limit=200'
        data, ts = get(url, save)
        events = {}
        for m in data.get('markets') or []:
            events.setdefault(m.get('event_ticker'), []).append(m)
        groups = [(k, k, v) for k, v in events.items()]
    else:
        url = f'{KS}/events/{ident}?with_nested_markets=true'
        data, ts = get(url, save)
        ev = data.get('event') or {}
        groups = [(ev.get('event_ticker'), ev.get('title'), ev.get('markets') or data.get('markets') or [])]
    out = []
    for _, title, markets in groups:
        for m in markets:
            if m.get('status') not in (None, 'active', 'open'):
                continue
            bid, ask, last = num(m.get('yes_bid_dollars')), num(m.get('yes_ask_dollars')), num(m.get('last_price_dollars'))
            p, flag = prob(bid, ask, last)
            vol = num(m.get('volume_fp')) or 0
            out.append(dict(topic=topic, venue='Kalshi', event=title, market=m.get('yes_sub_title') or m.get('ticker'), p_yes=p,
                            bid=bid, ask=ask, last=last, volume_usd=round(vol), closes=m.get('close_time'),
                            flag=flag or ('thin: volume < 25k contracts' if vol < 25000 else ''), url=url, fetched_utc=ts,
                            ticker=m.get('ticker')))
    return out


def search(q):
    url = f'{PM}/public-search?q={urllib.parse.quote(q)}&limit_per_type=20&events_status=active'
    data, ts = get(url)
    print(f'# {url} fetched {ts}')
    for e in data.get('events') or []:
        print(f"{e.get('slug')} | {e.get('title')} | ends {e.get('endDate')} | volume ${float(e.get('volume') or 0):,.0f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--json', action='store_true')
    ap.add_argument('--search')
    ap.add_argument('--save', nargs='?', const=SAVE, default=SAVE)
    a = ap.parse_args()
    if a.search:
        return search(a.search)
    rows = []
    order = list(dict.fromkeys(t for t, _, _ in WATCH))
    for topic, venue, ident in WATCH:
        try:
            rows += polymarket(topic, ident, a.save) if venue == 'polymarket' else kalshi(topic, ident, a.save)
        except Exception as e:  # noqa: BLE001 - one failed source must not hide the others
            rows.append(dict(topic=topic, venue=venue, event=ident, market='', p_yes=None, flag=f'FETCH FAILED: {type(e).__name__} {e}'[:120],
                             url=ident, fetched_utc=now()))
        if venue == 'kalshi':
            time.sleep(1.5)  # Kalshi throttles bursts
    stamp = now()
    rows = [r for r in rows if not r.get('closes') or r['closes'] > stamp or 'FAILED' in (r.get('flag') or '')]  # drop past-close markets
    rows.sort(key=lambda r: (order.index(r['topic']), r['venue'], r.get('event') or '', r.get('closes') or '', str(r.get('market'))))
    if a.json:
        for r in rows:
            print(json.dumps(r))
        return
    last_topic = None
    for r in rows:
        if r['topic'] != last_topic:
            print(f"\n## {r['topic']}")
            last_topic = r['topic']
        p = '  n/a' if r.get('p_yes') is None else f"{r['p_yes']:5.1%}"
        q = '' if r.get('bid') is None else f" (bid {r['bid']:.3f} / ask {r['ask']:.3f})"
        print(f"{r['venue']:10} {p}  {r['event']} :: {r['market']}{q}  vol {r.get('volume_usd', 0):,}  closes {r.get('closes')}"
              f"{'  [' + r['flag'] + ']' if r.get('flag') else ''}")
    print('\nSources (fetched UTC):')
    for u, t in sorted({(r['url'], r['fetched_utc']) for r in rows}):
        print(f'  {t}  {u}')


if __name__ == '__main__':
    main()
