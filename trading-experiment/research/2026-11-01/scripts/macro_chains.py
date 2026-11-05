"""Macro 11/01: save Cboe delayed option chains (the quotes.py source) and summarize them by expiry.
Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-11-01/scripts/macro_chains.py fetch <dir> SPY QQQ IWM USO XLE
  python3 -I trading-experiment/research/2026-11-01/scripts/macro_chains.py summary <dir> SPY [--max-exp 2026-12-11]
Source: https://cdn.cboe.com/api/global/delayed_quotes/options/<SYM>.json (15-minute delayed; on a weekend it shows Friday's close).
Summary per expiry: the ATM strike (nearest the chain's spot), call+put mid at that strike, the straddle as % of spot
(the market's expected absolute move to expiry, about 0.80 x the 1-sd move), the ATM IVs, and the 0.30-0.45 |delta| contracts that
pass OI >= 1,000 and spread <= 5% (10% for USO-type ETFs)."""
import json, os, re, sys, time, urllib.request
from datetime import date, datetime, timezone

OCC = re.compile(r'^([A-Z]{1,6})(\d{2})(\d{2})(\d{2})([CP])(\d{8})$')


def fetch(d, syms):
    os.makedirs(d, exist_ok=True)
    for s in syms:
        url = f'https://cdn.cboe.com/api/global/delayed_quotes/options/{s}.json'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        raw = urllib.request.urlopen(req, timeout=30).read()
        with open(os.path.join(d, f'chain_{s}.json'), 'wb') as f:
            f.write(raw)
        j = json.loads(raw)
        print(s, 'ok', len(j['data']['options']), 'contracts; cboe timestamp', j.get('timestamp'), '; spot', j['data'].get('current_price'),
              '; fetched', datetime.now(timezone.utc).isoformat(timespec='seconds'))
        time.sleep(0.3)


def load(d, s):
    j = json.load(open(os.path.join(d, f'chain_{s}.json')))
    rows = []
    for o in j['data']['options']:
        m = OCC.match(o['option'])
        if not m:
            continue
        u, yy, mm, dd, cp, k = m.groups()
        rows.append(dict(sym=o['option'], exp=date(2000 + int(yy), int(mm), int(dd)), cp=cp, k=int(k) / 1000,
                         bid=o.get('bid') or 0.0, ask=o.get('ask') or 0.0, iv=o.get('iv') or 0.0, delta=o.get('delta') or 0.0,
                         oi=int(o.get('open_interest') or 0), vol=int(o.get('volume') or 0)))
    return j, rows


def summary(d, s, max_exp, asof=date(2026, 10, 30), entry=date(2026, 11, 2)):
    j, rows = load(d, s)
    spot = float(j['data']['current_price'])
    print(f"{s}: spot {spot} (cboe chain current_price, timestamp {j.get('timestamp')}); DTE counted from entry {entry}")
    exps = sorted({r['exp'] for r in rows if r['exp'] <= max_exp})
    usotype = s in ('USO', 'UNG', 'XLE', 'XOP', 'GLD', 'SLV', 'TLT')
    lim = 0.10 if usotype else 0.05
    print(f"{'expiry':10} {'DTE':>4} {'K':>8} {'C mid':>7} {'P mid':>7} {'straddle%':>9} {'C iv':>6} {'P iv':>6}  eligible 0.30-0.45 |delta| (OI>=1000, spread<={lim:.0%})")
    out = {}
    for e in exps:
        byk = {}
        for r in rows:
            if r['exp'] == e:
                byk.setdefault(r['k'], {})[r['cp']] = r
        ks = [k for k, v in byk.items() if 'C' in v and 'P' in v and v['C']['bid'] > 0 and v['P']['bid'] > 0]
        if not ks:
            continue
        k = min(ks, key=lambda x: abs(x - spot))
        c, p = byk[k]['C'], byk[k]['P']
        cm, pm = (c['bid'] + c['ask']) / 2, (p['bid'] + p['ask']) / 2
        # straddle at the ATM strike, adjusted to spot by the call-put parity offset (|K - spot| is small)
        st = cm + pm
        el = []
        for r in rows:
            if r['exp'] != e or r['bid'] <= 0:
                continue
            mid = (r['bid'] + r['ask']) / 2
            if 0.30 <= abs(r['delta']) <= 0.45 and r['oi'] >= 1000 and (r['ask'] - r['bid']) / mid <= lim:
                el.append(f"{r['sym']} {r['bid']:.2f}/{r['ask']:.2f} iv {r['iv']:.3f} d {r['delta']:+.2f} oi {r['oi']}")
        dte = (e - entry).days
        out[e] = dict(dte=dte, k=k, straddle=st, pct=st / spot, civ=c['iv'], piv=p['iv'])
        print(f"{e} {dte:4d} {k:8.2f} {cm:7.2f} {pm:7.2f} {st / spot:9.2%} {c['iv']:6.3f} {p['iv']:6.3f}  {len(el)} eligible")
        if 21 <= dte <= 35 or (21 <= (e - date(2026, 11, 6)).days <= 35):
            for x in el:
                print('      ', x)
    return spot, out


if __name__ == '__main__':
    cmd, d = sys.argv[1], sys.argv[2]
    if cmd == 'fetch':
        fetch(d, sys.argv[3:])
    else:
        mx = date.fromisoformat(sys.argv[sys.argv.index('--max-exp') + 1]) if '--max-exp' in sys.argv else date(2026, 12, 11)
        for s in [a for a in sys.argv[3:] if not a.startswith('--') and not re.match(r'\d{4}-', a)]:
            summary(d, s, mx)
            print()
