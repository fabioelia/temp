"""Fetch and cache the raw data for claims C1/C2 (strategy review, 2026-10-29).

SEC submissions JSON (recent + older pages) for the 25-name universe in claims.md, and Yahoo daily bars (adjusted) for the
same names plus SPY. Raw downloads are cached in the scratchpad, never in the repo. Re-running skips cached files.

Run:  python3 -I earnings_fetch.py <cache_dir>
"""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, '/home/user/temp/trading-experiment')
import quotes    # noqa: E402
import research  # noqa: E402

UNIVERSE = "AAPL MSFT GOOGL AMZN META NVDA TSLA NFLX AVGO INTC AMD ORCL CRM ADBE QCOM CSCO IBM TXN MU JPM BAC XOM CVX WMT COST".split()
# Predecessor registrants whose earnings 8-Ks are filed under another CIK but whose price history is the same Yahoo ticker.
# GOOGL: Google Inc. (CIK 1288776) filed until the 2015 Alphabet reorganisation. AVGO: Avago Technologies (1441634) then
# Broadcom Ltd (1649338) before Broadcom Inc. (1730168). XOM: Exxon Mobil Corp (34088) before the ExxonMobil Holdings
# reorganisation (the ticker now maps to 2115436). ORCL: the pre-2006 Oracle registrant (777676).
EXTRA_CIKS = {"GOOGL": [1288776], "AVGO": [1441634, 1649338], "XOM": [34088], "ORCL": [777676]}
YAHOO = ('https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&period1=1104537600&period2=1793000000'
         '&includeAdjustedClose=true')


def save(path, obj):
    path.write_text(json.dumps(obj))


def fetch_sec(label, getter, out):
    if out.exists():
        return json.loads(out.read_text())
    data = getter()
    save(out, data)
    time.sleep(0.25)  # with sec_get's own 0.15 s sleep: < 3 requests/second
    return data


def main():
    cache = Path(sys.argv[1])
    sec, yah = cache / 'sec', cache / 'yahoo'
    sec.mkdir(parents=True, exist_ok=True)
    yah.mkdir(parents=True, exist_ok=True)
    for t in UNIVERSE:
        ciks = [research.cik_for(t)] + EXTRA_CIKS.get(t, [])
        for cik in ciks:
            main_file = sec / f'CIK{cik:010d}.json'
            data = fetch_sec(t, lambda: json.loads(research.sec_get(
                f'https://data.sec.gov/submissions/CIK{cik:010d}.json')), main_file)
            for f in data.get('filings', {}).get('files', []):
                name = f['name']
                fetch_sec(t, lambda: json.loads(research.sec_get('https://data.sec.gov/submissions/' + name)), sec / name)
            print(t, cik, data.get('name'), 'older pages:', len(data.get('filings', {}).get('files', [])), flush=True)
    for s in UNIVERSE + ['SPY']:
        out = yah / f'{s}.json'
        if out.exists():
            continue
        save(out, quotes.get_json(YAHOO.format(sym=s)))
        time.sleep(0.5)
        print('yahoo', s, flush=True)


if __name__ == '__main__':
    main()
