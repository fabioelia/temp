#!/usr/bin/env python3
"""Cboe daily put/call ratios after the archive ends (2019-10-07 onward), read-only, cached per day in the scratchpad.

  python3 -I pc_live.py                      fetch any missing sessions, write the series CSV, print the latest values + E3 signal state
  python3 -I pc_live.py --start 2026-10-01   only from this date

Source: the JSON behind https://www.cboe.com/markets/us/options/market-statistics/daily/ :
  https://cdn.cboe.com/data/us/options/market_statistics/daily/<YYYY-MM-DD>_daily_options
(Cboe Options Exchange, end of day; a session's file appears after the close, and requests for later dates return 403).
Its earliest date is 2019-10-07, the next session after the equitypc.csv / totalpc.csv archive ends (2019-10-04).
Session dates come from the cached Yahoo SPY bars (pc_fetch.py). Fetched JSON is parsed as data only (numeric fields).
"""
import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/alt-data'
URL = 'https://cdn.cboe.com/data/us/options/market_statistics/daily/{}_daily_options'
UA = 'Mozilla/5.0 (paper-trading-experiment research; read-only)'
FIRST = date(2019, 10, 7)


def fetch(d):
    fn = os.path.join(CACHE, 'cboe_daily', f'{d}.json')
    if os.path.exists(fn):
        return d, 'cached'
    req = urllib.request.Request(URL.format(d), headers={'User-Agent': UA})
    err = ''
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                body = r.read()
            json.loads(body)
            with open(fn, 'wb') as f:
                f.write(body)
            return d, 'ok'
        except urllib.error.HTTPError as e:
            if e.code in (403, 404):
                return d, f'HTTP {e.code} (not published)'
            time.sleep(1 + attempt)
        except Exception as e:  # noqa: BLE001
            err = f'{type(e).__name__}'
            time.sleep(1 + attempt)
    return d, f'failed {err}'


def parse(d):
    fn = os.path.join(CACHE, 'cboe_daily', f'{d}.json')
    if not os.path.exists(fn):
        return None
    j = json.load(open(fn))
    rat = {r['name']: float(r['value']) for r in j['ratios']}
    eq = {r['name']: r for r in j['EQUITY OPTIONS']}['VOLUME']
    tot = {r['name']: r for r in j['SUM OF ALL PRODUCTS']}['VOLUME']
    return {'date': d.isoformat(), 'equity_pc': rat['EQUITY PUT/CALL RATIO'], 'total_pc': rat['TOTAL PUT/CALL RATIO'],
            'equity_call': int(eq['call']), 'equity_put': int(eq['put']), 'total_call': int(tot['call']), 'total_put': int(tot['put']),
            'fetched_utc': datetime.fromtimestamp(os.path.getmtime(fn), timezone.utc).strftime('%Y-%m-%dT%H:%MZ')}


def sessions(start):
    days = [date.fromisoformat(r['date']) for r in csv.DictReader(open(os.path.join(CACHE, 'yahoo', 'SPY.csv')))]
    today = datetime.now(timezone.utc).date()
    extra = [today] if today not in days and today.weekday() < 5 else []  # today's file if the SPY cache is a day behind
    return [d for d in days + extra if d >= start]


def archive(name):
    rows = list(csv.reader(open(os.path.join(CACHE, 'cboe', f'{name}.csv'))))
    h = [i for i, r in enumerate(rows) if r and r[0].strip().upper() == 'DATE'][0]
    out = {}
    for r in rows[h + 1:]:
        if r and r[0].strip():
            m, dd, y = (int(x) for x in r[0].strip().split('/'))
            out[date(y, m, dd)] = float(r[4])
    return out


def state(series):
    """E3 signal state on the last date: MA10 and its rank among the previous 251 MA10 values (registered definition)."""
    ds = sorted(series)
    v = [series[d] for d in ds]
    ma = [sum(v[i - 9:i + 1]) / 10 for i in range(9, len(v))]
    if len(ma) < 252:
        return None
    last, prev = ma[-1], ma[-252:-1]
    rank = sum(1 for x in prev if x < last) / len(prev)
    return ds[-1], last, rank


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--start', default=FIRST.isoformat())
    a = ap.parse_args()
    os.makedirs(os.path.join(CACHE, 'cboe_daily'), exist_ok=True)
    days = sessions(max(date.fromisoformat(a.start), FIRST))
    with ThreadPoolExecutor(max_workers=4) as ex:
        res = list(ex.map(fetch, days))
    bad = [(d, s) for d, s in res if s not in ('ok', 'cached')]
    print(f'sessions {len(days)}: fetched {sum(s == "ok" for _, s in res)}, cached {sum(s == "cached" for _, s in res)}, '
          f'missing {len(bad)} {bad[-3:]}')
    rows = [p for p in (parse(d) for d in days) if p]
    allrows = [p for p in (parse(d) for d in sessions(FIRST)) if p] if a.start != FIRST.isoformat() else rows
    out = os.path.join(CACHE, 'cboe_daily_series.csv')
    with open(out, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(allrows[0]))
        w.writeheader()
        w.writerows(allrows)
    print(f'wrote {out}: {allrows[0]["date"]} .. {allrows[-1]["date"]} ({len(allrows)} sessions)')
    last = allrows[-1]
    print(f'LATEST {last["date"]}: equity P/C {last["equity_pc"]:.2f} (puts {last["equity_put"]:,} / calls {last["equity_call"]:,}), '
          f'total P/C {last["total_pc"]:.2f}; source {URL.format(last["date"])} fetched {last["fetched_utc"]}')
    for name, col in (('equitypc', 'equity_pc'), ('totalpc', 'total_pc')):
        s = archive(name)
        s.update({date.fromisoformat(r['date']): r[col] for r in allrows})
        st = state(s)
        if st:
            d, ma, rank = st
            tag = 'TOP 10% (bullish contrarian)' if rank >= 0.90 else ('BOTTOM 10% (bearish variant)' if rank <= 0.10 else 'neutral')
            print(f'E3 state {name} {d}: MA10 {ma:.3f}, rank vs prior 251 MA10 values {rank:.0%} -> {tag}')


if __name__ == '__main__':
    main()
