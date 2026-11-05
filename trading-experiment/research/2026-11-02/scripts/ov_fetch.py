#!/usr/bin/env python3
"""options-vol, 2026-11-02 (Run B): fetch tonight's raw inputs into a data directory (network; the analysis scripts are offline).

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-02/scripts/ov_fetch.py <data_dir>

Saves, each with the fetch time and Cboe's own file timestamp:
  * Cboe delayed option chains (cdn.cboe.com/api/global/delayed_quotes/options/<SYM>.json) for SPY, QQQ, IWM, AMD, QCOM;
  * Cboe index quotes _VIX, _VXN, _RVX, _VIX9D, _VIX3M (cdn.cboe.com/api/global/delayed_quotes/quotes/<SYM>.json);
  * Yahoo daily bars (query1.finance.yahoo.com v8 chart, [open, close]): ^GSPC since 1950; SPY, QQQ, IWM, ^VIX, ^VXN, ^VIX9D,
    ^VIX3M over their full histories; AMD and QCOM since 2024 (RV20).
Same layout as research/2026-11-01/scripts/ov_fetch.py, so that night's offline scripts can read it; ^VIX9D/^VIX3M added.
"""
import json
import os
import sys
import time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

sys.path.insert(0, '/home/user/temp/trading-experiment')
import quotes  # noqa: E402  (the toolkit's HTTP layer)

ET = ZoneInfo('America/New_York')


def save(path, obj):
    with open(path, 'w') as f:
        json.dump(obj, f)


def main(out):
    os.makedirs(out, exist_ok=True)
    stamp = datetime.now(ET).strftime('%Y-%m-%dT%H:%M:%S %Z')
    log = {'fetched_at': stamp, 'files': {}}
    for u in ('SPY', 'QQQ', 'IWM', 'AMD', 'QCOM'):
        d = quotes.get_json(f'https://cdn.cboe.com/api/global/delayed_quotes/options/{u}.json')
        save(os.path.join(out, f'chain_{u}.json'), d)
        log['files'][f'chain_{u}'] = {'cboe_timestamp': d.get('timestamp'), 'n': len(d['data']['options']),
                                      'spot': d['data'].get('current_price'), 'close': d['data'].get('close')}
        print(u, d.get('timestamp'), len(d['data']['options']), 'options, spot', d['data'].get('current_price'),
              'close', d['data'].get('close'))
    for u in ('_VIX', '_VXN', '_RVX', '_VIX9D', '_VIX3M'):
        try:
            d = quotes.get_json(f'https://cdn.cboe.com/api/global/delayed_quotes/quotes/{u}.json')
            save(os.path.join(out, f'quote_{u}.json'), d)
            log['files'][f'quote_{u}'] = {'cboe_timestamp': d.get('timestamp'), 'price': d['data'].get('current_price'),
                                          'last_trade_time': d['data'].get('last_trade_time')}
            print(u, d.get('timestamp'), d['data'].get('current_price'), d['data'].get('last_trade_time'))
        except Exception as e:  # noqa: BLE001
            print(u, 'unavailable', e)
    now = int(time.time()) + 86400
    for name, ysym, start in (('GSPC', '%5EGSPC', 1950), ('SPY', 'SPY', 1990), ('QQQ', 'QQQ', 1990), ('IWM', 'IWM', 2000),
                              ('AMD', 'AMD', 2024), ('QCOM', 'QCOM', 2024), ('VIX', '%5EVIX', 1990), ('VXN', '%5EVXN', 2000),
                              ('VIX9D', '%5EVIX9D', 2010), ('VIX3M', '%5EVIX3M', 2006)):
        bars = {}
        y = start
        while True:
            a = int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())
            b = min(int(datetime(y + 10, 1, 1, tzinfo=timezone.utc).timestamp()), now)
            url = f'https://query1.finance.yahoo.com/v8/finance/chart/{ysym}?interval=1d&period1={a}&period2={b}'
            try:
                res = quotes.get_json(url)['chart']['result'][0]
                q = res['indicators']['quote'][0]
                for t, o, c in zip(res.get('timestamp') or [], q.get('open', []), q.get('close', [])):
                    if c is not None:
                        bars[datetime.fromtimestamp(t, ET).date().isoformat()] = [o, c]
            except Exception as e:  # noqa: BLE001
                print(name, y, 'error', e)
            if b >= now:
                break
            y += 10
        ds = sorted(bars)
        save(os.path.join(out, f'yahoo_{name}.json'), {'fetched_at': stamp, 'source': f'Yahoo v8 chart {ysym} 1d', 'bars': bars})
        log['files'][f'yahoo_{name}'] = {'first': ds[0] if ds else None, 'last': ds[-1] if ds else None, 'n': len(ds),
                                         'last_close': bars[ds[-1]][1] if ds else None}
        print(name, ds[0] if ds else '-', ds[-1] if ds else '-', len(ds), 'last close', bars[ds[-1]][1] if ds else '-')
    save(os.path.join(out, 'fetch_log.json'), log)


if __name__ == '__main__':
    main(sys.argv[1])
