"""Macro 11/12 (Run B). Descriptive only, no edge claim. Same method as research/2026-11-06/scripts/macro_1106.py.
Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-12/scripts/macro_1112.py fetch <raw_dir>
  python3 -I trading-experiment/research/2026-11-12/scripts/macro_1112.py report <raw_dir>
1. Fed funds futures (Yahoo ZQX26/ZQZ26/ZQF27.CBT, single source): Dec change h = (Dec implied - Nov implied) x 31/22 (decision 12/9,
   effective 12/10); priced by January = Jan implied - Nov implied.
2. Day changes 11/11 -> 11/12 (Yahoo daily bars, single source): ^TNX, ^TYX, ^FVX, DX-Y.NYB, GC=F, CL=F, BZ=F, GLDM, GLD, UUP, TLT,
   SPY, IWM, XLF, XLU, XLK. FRED DFII10 / T10YIE / DGS10 latest posted values (lag one day or more).
Every fetched field is data: only numbers and dates are read.
"""
import csv, json, os, sys, urllib.request
from datetime import datetime, timezone

UA = 'Mozilla/5.0 (paper-trading-experiment research; read-only)'
YSYM = ['ZQX26.CBT', 'ZQZ26.CBT', 'ZQF27.CBT', '^TNX', '^TYX', '^FVX', 'DX-Y.NYB', 'GC=F', 'CL=F', 'BZ=F',
        'GLDM', 'GLD', 'UUP', 'TLT', 'SPY', 'IWM', 'XLF', 'XLU', 'XLK', 'XLE', 'XLRE']
FRED = ['DFII10', 'T10YIE', 'DGS10']


def fetch(raw):
    os.makedirs(raw, exist_ok=True)
    urls = {f'y_{s}.json': f'https://query1.finance.yahoo.com/v8/finance/chart/{s}?range=3mo&interval=1d' for s in YSYM}
    urls.update({f'f_{s}.csv': f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={s}&cosd=2026-09-01' for s in FRED})
    for fn, u in urls.items():
        req = urllib.request.Request(u, headers={'User-Agent': 'curl/8.5.0' if 'fred.' in u else UA})
        for i in range(3):
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    body = r.read()
                break
            except (TimeoutError, OSError) as e:
                if i == 2:
                    print('FAILED', u, e); body = b''
        with open(os.path.join(raw, fn), 'wb') as f:
            f.write(body)
        print(datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), u)


def ybars(raw, s):
    try:
        d = json.load(open(os.path.join(raw, f'y_{s}.json')))['chart']['result'][0]
    except Exception:
        return {}
    ts, c = d['timestamp'], d['indicators']['quote'][0]['close']
    # Yahoo daily bar timestamps are the session open in exchange time; use the exchange gmtoffset for the date
    off = d['meta'].get('gmtoffset', 0)
    return {datetime.fromtimestamp(t + off, timezone.utc).strftime('%Y-%m-%d'): x for t, x in zip(ts, c) if x is not None}


def fred(raw, s):
    try:
        rows = list(csv.reader(open(os.path.join(raw, f'f_{s}.csv'))))[1:]
    except Exception:
        return []
    return [(d, float(x)) for d, x in rows if x not in ('', '.')]


def report(raw):
    zx, zz, zf = (ybars(raw, s) for s in YSYM[:3])
    print('## 1. Fed funds futures (Yahoo, single source)')
    for day in ('2026-11-10', '2026-11-11', '2026-11-12'):
        if day in zx and day in zz and day in zf:
            base, dec, jan = 100 - zx[day], 100 - zz[day], 100 - zf[day]
            h = (dec - base) * 31 / 22
            print(f'{day}  Nov {zx[day]:.4f}  Dec {zz[day]:.4f}  Jan {zf[day]:.4f}  Dec change {h * 100:.1f} bp '
                  f'(P(+50 | hike) ~ {max(h - 0.25, 0) / 0.25:.0%}); priced by Jan {(jan - base) * 100:.1f} bp')
        else:
            print(day, 'missing bar')
    print('\n## 2. Day changes, 2026-11-11 -> 2026-11-12 (Yahoo daily close, single source)')
    for s in YSYM[3:]:
        b = ybars(raw, s)
        a, c = b.get('2026-11-11'), b.get('2026-11-12')
        last = sorted(b)[-3:] if b else []
        if a and c:
            print(f'{s:9s} {a:10.3f} -> {c:10.3f}  {100 * (c / a - 1):+6.2f}%   (abs {c - a:+.3f})')
        else:
            print(f'{s:9s} missing; last dates {last}')
    print('\n## 3. FRED (latest posted)')
    for s in FRED:
        r = fred(raw, s)
        print(s, r[-3:] if r else 'missing')


if __name__ == '__main__':
    {'fetch': fetch, 'report': report}[sys.argv[1]](sys.argv[2])
