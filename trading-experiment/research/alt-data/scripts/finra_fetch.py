"""Fetch data for claims E1/E1b (FINRA daily short-sale volume), per ../claims.md.

Run:  python3 -I finra_fetch.py <scratch_dir>
      scratch_dir gets  finra_yahoo/<SYM>.json  raw Yahoo daily chart JSON (adjclose + split-adjusted close)
                        finra_filtered.csv       FINRA CNMS rows for our symbols only (the full files are never stored)
                        finra_done.txt           dates fetched (resumable), finra_missing.txt dates that failed twice

* Trading days = SPY's Yahoo sessions from 2018-10-01 (the Q4-2018 files are only the 60-session z-score warm-up;
  signals are counted from 2019-01-02, as claims.md says) to today.
* Each file is streamed line by line and only rows whose Symbol is one of the 28 (plus FB, META's ticker before
  2022-06-09) are kept. About 3 requests a second; each failed file is retried once.
"""
import csv
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

sys.path.insert(0, '/home/user/temp/trading-experiment')
import quotes  # noqa: E402

SYMS = ("AAPL MSFT GOOGL AMZN META NVDA TSLA NFLX AVGO INTC AMD ORCL CRM ADBE QCOM CSCO IBM TXN MU JPM BAC XOM CVX "
        "WMT COST SPY QQQ IWM").split()
KEEP = set(SYMS) | {"FB"}
ET = ZoneInfo('America/New_York')
P1 = 1538352000 - 40 * 86400  # 2018-08-22: price history for RV20 before the first entries
URL = 'https://cdn.finra.org/equity/regsho/daily/CNMSshvol{}.txt'
UA = 'Mozilla/5.0 (research script; FINRA Reg SHO daily files)'
RATE = 3.0  # requests per second, all threads together

_lock = threading.Lock()
_last = [0.0]


def throttle():
    with _lock:
        wait = _last[0] + 1.0 / RATE - time.time()
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()


def fetch_yahoo(out):
    os.makedirs(os.path.join(out, 'finra_yahoo'), exist_ok=True)
    p2 = int(time.time()) + 86400
    for s in SYMS:
        path = os.path.join(out, 'finra_yahoo', f'{s}.json')
        url = (f'https://query1.finance.yahoo.com/v8/finance/chart/{s}?interval=1d&period1={P1}&period2={p2}'
               '&includeAdjustedClose=true&events=div%2Csplit')
        for attempt in (1, 2):
            try:
                d = quotes.get_json(url)
                break
            except quotes.ProviderError as e:
                if attempt == 2:
                    raise
                print('retry yahoo', s, e)
                time.sleep(2)
        with open(path, 'w') as f:
            json.dump(d, f)
        n = len(d['chart']['result'][0]['timestamp'])
        print('yahoo', s, n, 'bars')
        time.sleep(0.4)


def spy_sessions(out):
    d = json.load(open(os.path.join(out, 'finra_yahoo', 'SPY.json')))['chart']['result'][0]
    days = sorted({datetime.fromtimestamp(t, tz=timezone.utc).astimezone(ET).date() for t in d['timestamp']})
    return [x for x in days if x.isoformat() >= '2018-10-01']


def get_one(day):
    """Stream one file; return (status, rows)."""
    url = URL.format(day.strftime('%Y%m%d'))
    throttle()
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    rows = []
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            for raw in r:
                line = raw.decode('utf-8', 'replace').rstrip('\r\n')
                parts = line.split('|')
                if len(parts) >= 6 and parts[1] in KEEP:
                    rows.append(parts[:6])
        return 200, rows
    except urllib.error.HTTPError as e:
        return e.code, []
    except Exception as e:  # noqa: BLE001
        return 0, [str(e)]


def main():
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    if not os.path.exists(os.path.join(out, 'finra_yahoo', 'SPY.json')) or '--refresh-yahoo' in sys.argv:
        fetch_yahoo(out)
    days = spy_sessions(out)
    done_p = os.path.join(out, 'finra_done.txt')
    miss_p = os.path.join(out, 'finra_missing.txt')
    csv_p = os.path.join(out, 'finra_filtered.csv')
    done = set(open(done_p).read().split()) if os.path.exists(done_p) else set()
    todo = [d for d in days if d.strftime('%Y%m%d') not in done]
    print(len(days), 'sessions', len(todo), 'to fetch', flush=True)
    new = not os.path.exists(csv_p)
    fcsv = open(csv_p, 'a', newline='')
    w = csv.writer(fcsv)
    if new:
        w.writerow(['Date', 'Symbol', 'ShortVolume', 'ShortExemptVolume', 'TotalVolume', 'Market'])
    fdone = open(done_p, 'a')
    fmiss = open(miss_p, 'a')
    wlock = threading.Lock()
    t0 = time.time()
    count = [0]

    def work(day):
        st, rows = get_one(day)
        if st != 200:
            time.sleep(1.0)
            st, rows = get_one(day)
        with wlock:
            key = day.strftime('%Y%m%d')
            if st == 200:
                for r in rows:
                    w.writerow(r)
                fcsv.flush()
                fdone.write(key + '\n')
                fdone.flush()
            else:
                fmiss.write(f'{key} {st} {rows[:1]}\n')
                fmiss.flush()
            count[0] += 1
            if count[0] % 100 == 0:
                print(f'{count[0]}/{len(todo)} {time.time() - t0:.0f}s last {key} rows {len(rows)} st {st}', flush=True)

    with ThreadPoolExecutor(max_workers=3) as ex:
        list(ex.map(work, todo))
    print('done in', round(time.time() - t0), 's', flush=True)


if __name__ == '__main__':
    main()
