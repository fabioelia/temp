"""Fetch and cache the raw data for claim E2 (Wikipedia attention spikes), alt-data review 2026-10-30.

* Wikimedia pageviews REST API, en.wikipedia, all-access, agent=user, daily, 2015-07-01 to 2026-10-30, one request per
  article title, about 1 request a second, with a descriptive User-Agent (the API returns 429 without one).
* Yahoo daily bars (adjusted closes) from 2015-07-01 for the 25 names plus SPY, through the repo's quotes.get_json.

Raw downloads go to the scratchpad cache, never the repo. Re-running skips cached files.

Run:  python3 -I wiki_fetch.py <cache_dir> [--titles T1 T2 ...]   (--titles fetches extra, e.g. predecessor, titles only)
"""
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, '/home/user/temp/trading-experiment')
import quotes  # noqa: E402

UA = 'TradingExperimentResearch/1.0 (https://github.com/fabioelia/temp; research bot)'
WIKI = ('https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/{title}/daily/'
        '20150701/20261030')
YAHOO = ('https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&period1=1435708800&period2=1793000000'
         '&includeAdjustedClose=true')
ARTICLES = {"AAPL": "Apple_Inc.", "MSFT": "Microsoft", "GOOGL": "Alphabet_Inc.", "AMZN": "Amazon_(company)",
            "META": "Meta_Platforms", "NVDA": "Nvidia", "TSLA": "Tesla,_Inc.", "NFLX": "Netflix", "AVGO": "Broadcom",
            "INTC": "Intel", "AMD": "AMD", "ORCL": "Oracle_Corporation", "CRM": "Salesforce", "ADBE": "Adobe_Inc.",
            "QCOM": "Qualcomm", "CSCO": "Cisco", "IBM": "IBM", "TXN": "Texas_Instruments", "MU": "Micron_Technology",
            "JPM": "JPMorgan_Chase", "BAC": "Bank_of_America", "XOM": "ExxonMobil", "CVX": "Chevron_Corporation",
            "WMT": "Walmart", "COST": "Costco"}


def fname(title):
    return urllib.parse.quote(title, safe='') + '.json'


def wiki_get(title):
    url = WIKI.format(title=urllib.parse.quote(title, safe=''))
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        ra = e.headers.get('Retry-After') if e.headers else None
        return e.code, {'error': e.read().decode('utf-8', 'replace')[:300], 'retry_after': ra}


def fetch_wiki(wdir, title):
    out = wdir / fname(title)
    if out.exists():
        d = json.loads(out.read_text())
        return 'cached', len(d.get('items', []))
    for attempt in range(6):
        status, d = wiki_get(title)
        time.sleep(1.5)
        if status == 429:  # back off: Retry-After if given, else 30, 60, 120 ... s
            ra = d.get('retry_after')
            wait = int(ra) if ra and str(ra).isdigit() else 30 * 2 ** attempt
            print('  429, waiting', wait, 's', flush=True)
            time.sleep(wait)
            continue
        break
    if status == 200:
        out.write_text(json.dumps(d))
        (wdir / (fname(title) + '.missing')).unlink(missing_ok=True)
        return 200, len(d.get('items', []))
    (wdir / (fname(title) + '.missing')).write_text(json.dumps({'status': status, **d}))
    return status, 0


def main():
    cache = Path(sys.argv[1])
    wdir, ydir = cache / 'wiki', cache / 'wiki_yahoo'  # own folder: other claims share this cache
    wdir.mkdir(parents=True, exist_ok=True)
    ydir.mkdir(parents=True, exist_ok=True)
    if '--titles' in sys.argv:
        for t in sys.argv[sys.argv.index('--titles') + 1:]:
            print('wiki', t, *fetch_wiki(wdir, t), flush=True)
        return
    for tk, t in ARTICLES.items():
        print('wiki', tk, t, *fetch_wiki(wdir, t), flush=True)
    for s in list(ARTICLES) + ['SPY']:
        out = ydir / f'{s}.json'
        if out.exists():
            continue
        out.write_text(json.dumps(quotes.get_json(YAHOO.format(sym=s))))
        time.sleep(0.5)
        print('yahoo', s, flush=True)


if __name__ == '__main__':
    main()
