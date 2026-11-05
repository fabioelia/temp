"""Macro 11/01: cache Yahoo v8 daily bars (full history, interval=1d via period1/period2, not range=max which Yahoo down-samples).
Run (from /home/user/temp): python3 -I trading-experiment/research/2026-11-01/scripts/macro_fetch.py <out_dir> SYM [SYM ...]
Writes <out_dir>/y_<sym with ^ and = replaced by _>.json; prints the bar count and last bar date per symbol. Source: query1/query2.finance.yahoo.com."""
import json, os, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
now = int(time.time())
for s in sys.argv[2:]:
    for host in ('query1.finance.yahoo.com', 'query2.finance.yahoo.com'):
        url = f'https://{host}/v8/finance/chart/{urllib.parse.quote(s)}?period1=0&period2={now}&interval=1d&events=div'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            d = json.load(urllib.request.urlopen(req, timeout=30))
            r = d['chart']['result'][0]
            fn = os.path.join(out, 'y_' + s.replace('^', '_').replace('=', '_') + '.json')
            with open(fn, 'w') as f:
                json.dump(d, f)
            ts = r['timestamp']
            print(s, 'ok', len(ts), datetime.fromtimestamp(ts[0], timezone.utc).date(), '..', datetime.fromtimestamp(ts[-1], timezone.utc).date())
            break
        except Exception as e:  # noqa: BLE001 - report and try the other host
            print(s, host, 'ERR', e)
    time.sleep(0.3)
print('fetched_at', datetime.now(timezone.utc).isoformat())
