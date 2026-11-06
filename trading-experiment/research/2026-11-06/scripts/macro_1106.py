"""Macro 11/06 (Run B, after the October jobs beat: payrolls +165K vs 59K expected; ^TNX 4.86). Descriptive only, no claim test.
Questions: (1) what do fed funds futures price for the Dec 8-9 FOMC, next to the Kalshi/Polymarket quotes from
research/alt-data/scripts/predmkt.py? (2) is broad credit still contained (HYG vs SPY, FRED BAMLH0A0HYM2)?

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-06/scripts/macro_1106.py fetch <raw_dir>     save raw responses (Yahoo v8, FRED csv)
  python3 -I trading-experiment/research/2026-11-06/scripts/macro_1106.py report <raw_dir>    compute from the saved files
Every fetched field is data: only numbers and dates are read.

1. FED FUNDS FUTURES (CBOT 30-day, Yahoo ZQX26.CBT / ZQZ26.CBT / ZQF27.CBT, settlement-style daily closes, single source).
   Implied monthly average rate = 100 - price. No FOMC meeting in November, so the November contract is the base rate.
   The Dec decision is announced Wed 12/9 and is effective 12/10, so 22 of December's 31 days carry the new rate:
   implied December change h = (Dec implied - base) x 31 / 22; P(+25 bp) ~ h / 0.25 (cuts and >25 bp moves ignored; both
   price at about 1% or less on Kalshi). The January contract minus base = the cumulative change priced by January (mostly December's).
   Shown for 11/5 and 11/6 to measure the jobs-day repricing. FRED EFFR and DFEDTARU are printed as a check on the base.
2. CREDIT. HYG and SPY close-to-close returns for 11/5 and 11/6 (Yahoo v8 adjusted closes). HYG-on-SPY OLS beta over the 250 sessions
   ending 11/4; each day's HYG residual (ret - alpha - beta x SPY ret) in residual-sd units. HY OAS latest value, its 1-year high and low
   and its percentile among the last 250 observations.
"""
import csv
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

UA = 'Mozilla/5.0 (paper-trading-experiment research; read-only)'
YSYM = ['ZQX26.CBT', 'ZQZ26.CBT', 'ZQF27.CBT', 'HYG', 'SPY']
FRED = ['EFFR', 'DFEDTARU', 'BAMLH0A0HYM2']


def fetch(raw):
    os.makedirs(raw, exist_ok=True)
    urls = {f'y_{s}.json': f'https://query1.finance.yahoo.com/v8/finance/chart/{s}?range=2y&interval=1d' for s in YSYM}
    urls.update({f'f_{s}.csv': f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={s}&cosd=2025-09-01' for s in FRED})
    for fn, u in urls.items():
        req = urllib.request.Request(u, headers={'User-Agent': UA})
        for i in range(3):  # FRED sometimes times out; retry
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    body = r.read()
                break
            except (TimeoutError, OSError):
                if i == 2:
                    raise
        with open(os.path.join(raw, fn), 'wb') as f:
            f.write(body)
        print(datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), u)


def ybars(raw, s, adj=False):
    d = json.load(open(os.path.join(raw, f'y_{s}.json')))['chart']['result'][0]
    ts = d['timestamp']
    c = d['indicators']['adjclose'][0]['adjclose'] if adj and 'adjclose' in d['indicators'] else d['indicators']['quote'][0]['close']
    return {datetime.fromtimestamp(t, timezone.utc).strftime('%Y-%m-%d'): x for t, x in zip(ts, c) if x is not None}


def fred(raw, s):
    rows = list(csv.reader(open(os.path.join(raw, f'f_{s}.csv'))))[1:]
    return [(d, float(x)) for d, x in rows if x not in ('', '.')]


def report(raw):
    print('## 1. Fed funds futures (Yahoo, single source)')
    zx, zz, zf = (ybars(raw, s) for s in YSYM[:3])
    for day in ('2026-11-05', '2026-11-06'):
        base, dec, jan = 100 - zx[day], 100 - zz[day], 100 - zf[day]
        h = (dec - base) * 31 / 22
        print(f'{day}  Nov {zx[day]:.4f} (base {base:.4f}%)  Dec {zz[day]:.4f} ({dec:.4f}%)  Jan {zf[day]:.4f} ({jan:.4f}%)  '
              f'Dec change {h * 100:.1f} bp -> P(+25) {h / 0.25:.0%}; priced by Jan {(jan - base) * 100:.1f} bp')
    print('FRED EFFR', fred(raw, 'EFFR')[-1], ' DFEDTARU', fred(raw, 'DFEDTARU')[-1])

    print('\n## 2. Credit')
    hyg, spy = ybars(raw, 'HYG', adj=True), ybars(raw, 'SPY', adj=True)
    days = sorted(set(hyg) & set(spy))
    ret = {d: (hyg[d] / hyg[p] - 1, spy[d] / spy[p] - 1) for p, d in zip(days, days[1:])}
    est = [d for d in sorted(ret) if d <= '2026-11-04'][-250:]
    xs, ys = [ret[d][1] for d in est], [ret[d][0] for d in est]
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    beta = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
    alpha = my - beta * mx
    sd = (sum((y - alpha - beta * x) ** 2 for x, y in zip(xs, ys)) / (len(xs) - 2)) ** 0.5
    print(f'HYG-on-SPY beta {beta:.3f} (250 sessions to {est[-1]}), residual sd {sd * 100:.3f}%')
    for d in ('2026-11-05', '2026-11-06'):
        if d in ret:
            h, s = ret[d]
            res = h - alpha - beta * s
            print(f'{d}  HYG {h:+.2%}  SPY {s:+.2%}  implied HYG {alpha + beta * s:+.2%}  residual {res / sd:+.1f} sd')
    oas = fred(raw, 'BAMLH0A0HYM2')
    last = oas[-1]
    yr = [x for _, x in oas[-250:]]
    pct = sum(x < last[1] for x in yr) / len(yr)
    print(f'HY OAS {last[0]} {last[1]:.2f}%  prior {oas[-2][0]} {oas[-2][1]:.2f}%  250-obs high {max(yr):.2f} low {min(yr):.2f}  '
          f'percentile {pct:.0%}')


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] not in ('fetch', 'report'):
        sys.exit(__doc__)
    (fetch if sys.argv[1] == 'fetch' else report)(sys.argv[2])
