#!/usr/bin/env python3
"""P1-P3 premium-selling tests (strategy v2, pre-registered in research/strategy-v2/claims.md on 2026-11-07).

Run (from /home/user/temp):
    python3 -I trading-experiment/research/strategy-v2/scripts/premium_selling.py            # uses the scratchpad cache
    python3 -I trading-experiment/research/strategy-v2/scripts/premium_selling.py --refresh  # re-downloads everything first
Downloads go to the scratchpad (CACHE below), never to the repo. Output is printed; the write-up is premium-selling.md.

Specification (written before any result was computed; claims.md fixes the tests, this fixes the details it leaves open):

Model = the strategy review's (research/strategy-review/PROTOCOL.md, scripts/options_lib.py): Black-Scholes, r = ^IRX, q = trailing
365-day dividends / close, 30 calendar days to expiry (expiry = last session on or before entry + 30 days), entered at every close,
held to expiry and settled on intrinsic value; half a 3% spread paid on every option fill (sell at mid x 0.985, buy at mid x 1.015);
stock round trip 5 bps (SPY) or 10 bps (others), charged on assignment. IV = VIX for SPY, else the underlying's 20-day realized
vol x 1.1 (protocol). Continuous strikes from the target delta (options_lib.strike_for_delta). Periods: full, 1990/93-2009,
2010-2026, last 5 years. t-stats: Newey-West, lag 42 sessions (2 x the ~21-session holding period) on overlapping daily entries.

Feasibility scan (P1, P2): Cboe delayed chains (cdn.cboe.com, snapshot of the last close) for a fixed list of liquid ETFs, then large
stocks (UNIVERSE). Expiries with 21-45 DTE. The contract = the put (P1) or call (P2) whose |delta| is nearest 0.30, within 0.25-0.35.
Feasible if: P1 strike x 100 <= CASH; P2 spot x 100 <= CASH; open interest >= 1,000; (ask - bid) / mid <= 10%; bid > 0. A name passes
if any expiry in 21-45 DTE passes; the passing expiry nearest 30 DTE is reported. Best candidate (fixed rule, not chosen on
backtest results): ETFs before stocks; within a class the highest open interest on the selected contract. All other feasible
names are modelled too and reported as descriptive rows.

P1 cash-secured put: sell the 0.30-delta put; collateral = strike. Per trade return on collateral
    r = (put mid x 0.985 - max(K - S_T, 0) - [assigned] cost x S_T) / K.
The account's cash collateral is assumed to earn nothing (conservative; idle cash earns the T-bill rate only inside SGOV/BIL, S3),
so the test statistic is the excess e = r - IRX x days / 365. Annualized EV = mean(e) x 365 / mean days. Variant (reported, not the
verdict): collateral earning T-bills (the PUT-index convention), i.e. excess = r.
Verdict: CONFIRMED if feasible, annualized mean excess > 0 with NW t >= 2 in the full sample, and 2010-2026 excess > 0 and at least
half the full-sample value. WEAK: right sign but fails t or decays. REJECTED: excess <= 0, or |t| < 1, or not feasible.
Tail: worst single 30-day trade (the "worst month"), 1st percentile, and a non-overlapping monthly chain (start at the first date,
roll at each expiry): worst calendar year and max drawdown.

P2 covered call: long 100 shares, sell the 0.30-delta call each cycle (variant: ATM call, the BXM convention). Per trade return on S0
    r_cc = (adj_T / adj_0 - 1) + (call mid x 0.985 - max(S_T - K, 0) - [assigned] cost x S_T) / S0,  stock alone r_s = adj_T / adj_0 - 1
(adj = Yahoo dividend-adjusted close). Sharpe = mean(r - tbill) / sd(r - tbill) x sqrt(365 / mean days), over all overlapping entries.
Difference t = (Sharpe_cc - Sharpe_stock) / sd of a moving-block bootstrap (blocks of 126 sessions, 1,000 reps, seed 7).
Verdict: CONFIRMED if feasible, Sharpe_cc > Sharpe_stock with t >= 2 (full), the 2010-2026 difference > 0 and >= half the full one,
and the covered call's annualized mean return > T-bills. WEAK / REJECTED as for P1.

P3 SPY put credit spread (Level 3, owner-only): sell the 0.20-delta put, buy the 0.10-delta put, both at VIX (no skew), 30 DTE,
every close 1993-2026, held to expiry. Credit = short mid x 0.985 - long mid x 1.015; risk = width - credit;
EV per $ of risk = mean((credit - max(Ks - S_T, 0) + max(Kl - S_T, 0)) / risk). Report hit rate, share of max losses, the worst
month (worst trade and worst month of a non-overlapping chain), and NW t. Verdict: UNTESTABLE beyond the model (claims.md).
Post-hoc items (decided after the results, labelled POST-HOC in the output): today's real put skew applied to P3; the model IV vs
the chain IV of the P1/P2 contracts; the 11/05/2026 day applied to open P3 spreads and to the P1 candidate.

Index evidence: Cboe's published PUT and BXM daily histories (cdn.cboe.com) vs the S&P 500 total return (^SP500TR), monthly:
CAGR, vol, Sharpe over ^IRX, max drawdown, worst month, split at 2010 (PUT has daily data from 2007, BXM from 2002).
"""
import csv
import json
import math
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

import numpy as np

sys.path.insert(0, '/home/user/temp/trading-experiment')
sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import quotes  # noqa: E402
import options_lib as L  # noqa: E402

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-data/v2'
ET = ZoneInfo('America/New_York')
CASH = 1384.82
LAG = 42
HS = L.HALF_SPREAD
ETFS = ['SPY', 'QQQ', 'IWM', 'XLF', 'KRE', 'EWZ', 'FXI', 'KWEB', 'EEM', 'GDX', 'GDXJ', 'SLV', 'PSLV', 'SIL', 'URA', 'ARKK', 'TLT',
        'HYG', 'JETS', 'XLE', 'XLU', 'SCHD', 'UNG', 'BITO', 'IBIT', 'ETHA', 'TQQQ', 'SOXL', 'SQQQ', 'SOXS', 'SPXU', 'SDS', 'TZA',
        'UVXY', 'KOLD', 'BOIL', 'TSLL']
STOCKS = ['F', 'SOFI', 'NIO', 'PLUG', 'AAL', 'RIVN', 'LCID', 'SNAP', 'PFE', 'T', 'VALE', 'ITUB', 'BBD', 'NU', 'GRAB', 'NOK', 'ERIC',
          'KGC', 'HL', 'CDE', 'AG', 'BTG', 'CLF', 'RIG', 'MARA', 'RIOT', 'CLSK', 'OPEN', 'BB', 'AMC', 'INTC', 'WBD', 'KVUE', 'PCG',
          'HBAN', 'KEY', 'CCL', 'NCLH', 'JBLU', 'SIRI', 'ABEV', 'PBR', 'XPEV', 'LI', 'PTON', 'QS', 'ACHR', 'JOBY', 'SOUN', 'BBAI',
          'AGNC', 'STLA', 'HPE', 'LUMN', 'GT', 'WEN', 'M', 'KSS', 'CSX', 'KMI', 'ET', 'MPW', 'VZ', 'CMCSA', 'BAC', 'WFC', 'C', 'KO']
UNIVERSE = ETFS + STOCKS
YSYM = {'GSPC': '%5EGSPC', 'VIX': '%5EVIX', 'IRX': '%5EIRX', 'SP500TR': '%5ESP500TR'}


# ------------------------------------------------------------------ data
def yahoo(name, refresh=False):
    """Daily bars (date -> close, adjclose) and dividends for a Yahoo symbol, cached in the scratchpad."""
    p, pd_ = os.path.join(CACHE, f'y_{name}.csv'), os.path.join(CACHE, f'y_{name}_div.csv')
    if refresh or not os.path.exists(p):
        ysym = YSYM.get(name, name)
        rows, divs = {}, {}
        now = int(time.time()) + 86400
        for y in range(1970, 2030, 10):
            a = int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())
            b = min(int(datetime(y + 10, 1, 1, tzinfo=timezone.utc).timestamp()), now)
            if a >= now:
                break
            url = (f'https://query1.finance.yahoo.com/v8/finance/chart/{ysym}?interval=1d&period1={a}&period2={b}'
                   f'&events=div%7Csplit&includeAdjustedClose=true')
            try:
                res = quotes.get_json(url)['chart']['result'][0]
            except Exception:  # noqa: BLE001  (no data in that decade)
                continue
            ts = res.get('timestamp') or []
            q = res['indicators']['quote'][0]
            adj = (res['indicators'].get('adjclose') or [{}])[0].get('adjclose') or [None] * len(ts)
            for t, c, ac in zip(ts, q.get('close', []), adj):
                if c:
                    rows[datetime.fromtimestamp(t, ET).date().isoformat()] = (c, ac or c)
            for ev in ((res.get('events') or {}).get('dividends') or {}).values():
                divs[datetime.fromtimestamp(ev['date'], ET).date().isoformat()] = ev['amount']
        with open(p, 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(['date', 'close', 'adjclose'])
            for d in sorted(rows):
                w.writerow([d, *rows[d]])
        with open(pd_, 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(['date', 'dividend'])
            for d in sorted(divs):
                w.writerow([d, divs[d]])
    px = {}
    with open(p) as f:
        for r in csv.DictReader(f):
            px[date.fromisoformat(r['date'])] = (float(r['close']), float(r['adjclose']))
    dv = []
    with open(pd_) as f:
        for r in csv.DictReader(f):
            dv.append((date.fromisoformat(r['date']), float(r['dividend'])))
    return px, sorted(dv)


def chain(sym, refresh=False):
    p = os.path.join(CACHE, f'chain_{sym}.json')
    if refresh or not os.path.exists(p):
        try:
            data = quotes.get_json(f'https://cdn.cboe.com/api/global/delayed_quotes/options/{sym}.json')
        except Exception as e:  # noqa: BLE001
            return {'error': str(e)}
        with open(p, 'w') as f:
            json.dump(data, f)
    return json.load(open(p))


def cboe_index(name, refresh=False):
    p = os.path.join(CACHE, f'{name}_History.csv')
    if refresh or not os.path.exists(p):
        status, txt = quotes.http_get(f'https://cdn-api.cboe.com/api/global/us_indices/daily_prices/{name}_History.csv', timeout=30)
        if status != 200:
            raise RuntimeError(f'{name} history: HTTP {status}')
        open(p, 'w').write(txt)
    out = {}
    with open(p) as f:
        for r in csv.DictReader(f):
            m, d, y = r['DATE'].split('/')
            out[date(int(y), int(m), int(d))] = float(r[name])
    return out


def market(name, refresh=False):
    """Aligned arrays: dates, S (split-adjusted close), adj (total-return close), iv, r, q."""
    px, dv = yahoo(name, refresh)
    dates = sorted(px)
    S = np.array([px[d][0] for d in dates])
    adj = np.array([px[d][1] for d in dates])
    irx, _ = yahoo('IRX')
    r = L.ffill_on(dates, {d: v[0] for d, v in irx.items()}) / 100.0
    if name == 'SPY':
        vix, _ = yahoo('VIX')
        iv = L.ffill_on(dates, {d: v[0] for d, v in vix.items()}) / 100.0
    else:
        lr = np.diff(np.log(S), prepend=np.nan)
        iv = np.full(len(S), np.nan)
        for i in range(20, len(S)):
            iv[i] = np.std(lr[i - 19:i + 1], ddof=1) * math.sqrt(252) * 1.1
    q = L.div_yield(dates, S, dv) if dv else np.zeros(len(S))
    return {'dates': dates, 'S': S, 'adj': adj, 'iv': iv, 'r': r, 'q': q}


# ------------------------------------------------------------------ feasibility
def occ(sym):
    s = sym.strip()
    return s[:-15], date(2000 + int(s[-15:-13]), int(s[-13:-11]), int(s[-11:-9])), s[-9], int(s[-8:]) / 1000.0


def pick(data, typ, target=0.30, lo=21, hi=45):
    """Per expiry in [lo, hi] DTE: the contract of type typ with |delta| nearest target (within +-0.05)."""
    today = date.fromisoformat(data['timestamp'][:10])
    best = {}
    for o in data['data']['options']:
        _, exp, t, k = occ(o['option'])
        dte = (exp - today).days
        if t != typ or not lo <= dte <= hi or not o.get('delta'):
            continue
        dl = abs(float(o['delta']))
        if abs(dl - target) > 0.05:
            continue
        if exp not in best or abs(dl - target) < abs(abs(float(best[exp]['delta'])) - target):
            best[exp] = o | {'_dte': dte, '_k': k, '_exp': exp}
    return [best[e] for e in sorted(best)]


def feasible(o, spot, typ):
    bid, ask = float(o.get('bid') or 0), float(o.get('ask') or 0)
    mid = (bid + ask) / 2
    spr = (ask - bid) / mid if mid > 0 else 9.9
    cash_need = (o['_k'] if typ == 'P' else spot) * 100
    ok = bid > 0 and spr <= 0.10 and float(o.get('open_interest') or 0) >= 1000 and cash_need <= CASH
    return ok, spr, cash_need


def scan(refresh):
    with ThreadPoolExecutor(8) as ex:
        chains = dict(zip(UNIVERSE, ex.map(lambda s: chain(s, refresh), UNIVERSE)))
    res = {'P': [], 'C': []}
    print(f'\n==== FEASIBILITY (cash ${CASH:,.2f}; 0.30-delta, 21-45 DTE, OI >= 1000, spread <= 10%) ====')
    print('Underlyings priced at or below $13.85 (others cannot be cash-secured or covered with one contract):')
    for s in UNIVERSE:
        d = chains[s]
        if 'data' not in d:
            print(f'  {s:5} no chain ({d.get("error", "")[:60]})')
            continue
        spot = float(d['data']['current_price'] or 0)
        if spot > CASH / 100 * 1.15:  # well above the cash limit even for a put 15% OTM
            continue
        line = [f'  {s:5} {"ETF" if s in ETFS else "stk"} spot {spot:7.2f}']
        for typ in ('P', 'C'):
            cands = pick(d, typ)
            passing = [(o, *feasible(o, spot, typ)) for o in cands]
            ok = [p for p in passing if p[1]]
            show = min(ok or passing, key=lambda p: abs(p[0]['_dte'] - 30)) if passing else None
            if show is None:
                line.append(f'{typ}: no 0.30-delta contract')
                continue
            o, good, spr, need = show
            line.append(f'{typ}: {"PASS" if good else "fail"} {o["_exp"]} ({o["_dte"]}d) K {o["_k"]:.1f} d {float(o["delta"]):+.2f} '
                        f'bid {float(o["bid"]):.2f} ask {float(o["ask"]):.2f} spr {spr:.0%} OI {int(o.get("open_interest") or 0)} '
                        f'iv {float(o.get("iv") or 0):.2f} cash ${need:,.0f}')
            if good:
                res[typ].append({'sym': s, 'etf': s in ETFS, 'spot': spot, 'o': o, 'spr': spr})
        print(' | '.join(line))
    for typ in ('P', 'C'):
        res[typ].sort(key=lambda x: (not x['etf'], -float(x['o'].get('open_interest') or 0)))
        print(f'Feasible for {"P1 puts" if typ == "P" else "P2 covered calls"}: {[x["sym"] for x in res[typ]]}')
    return res, chains


# ------------------------------------------------------------------ option trades
def trades(m, kind, delta, cost, atm=False):
    d, S, iv, r, q = m['dates'], m['S'], m['iv'], m['r'], m['q']
    ex = L.expiry_index(d)
    idx = np.array([i for i in range(len(d)) if ex[i] > i and not np.isnan(iv[i])])
    e = ex[idx]
    T0 = np.array([(d[j] - d[i]).days / 365.0 for i, j in zip(idx, e)])
    K = S[idx].copy() if atm else L.strike_for_delta(S[idx], T0, iv[idx], r[idx], q[idx], delta, kind)
    mid = L.bs(S[idx], K, T0, iv[idx], r[idx], q[idx], kind)
    ST = S[e]
    pay = np.maximum(K - ST, 0) if kind == 'P' else np.maximum(ST - K, 0)
    assigned = pay > 0
    opt = mid * (1 - HS) - pay - assigned * cost * ST
    days = T0 * 365
    tb = r[idx] * T0
    return {'idx': idx, 'e': e, 'dates': [d[i] for i in idx], 'K': K, 'mid': mid, 'opt': opt, 'days': days, 'tb': tb,
            'S0': S[idx], 'ST': ST, 'stock': m['adj'][e] / m['adj'][idx] - 1, 'assigned': assigned}


def chain_path(t, n_dates):
    """Non-overlapping monthly chain: start at the first entry, roll at each expiry. Returns list of trade positions."""
    pos = {int(i): k for k, i in enumerate(t['idx'])}
    out, k = [], 0
    while k is not None and k < len(t['idx']):
        out.append(k)
        k = pos.get(int(t['e'][k]))
    return out


def tail_stats(rets, dates):
    eq = np.cumprod(1 + np.asarray(rets))
    dd = float((eq / np.maximum.accumulate(eq) - 1).min())
    yrs = {}
    for x, dt in zip(rets, dates):
        yrs[dt.year] = yrs.get(dt.year, 1.0) * (1 + x)
    wy = min(yrs.items(), key=lambda kv: kv[1])
    return dd, wy


PER = [('full', date(1900, 1, 1), date(2100, 1, 1)), ('pre-2010', date(1900, 1, 1), date(2010, 1, 1)),
       ('2010-2026', date(2010, 1, 1), date(2100, 1, 1)), ('last5y', date(2021, 11, 7), date(2100, 1, 1))]


def ann(x, days):
    return float(np.mean(x) * 365 / np.mean(days))


def p1(name, refresh, label=''):
    m = market(name, refresh)
    cost = 0.0005 if name == 'SPY' else 0.001
    t = trades(m, 'P', 0.30, cost)
    r = t['opt'] / t['K']
    e = r - t['tb']
    print(f'\n-- P1 cash-secured 0.30-delta put on {name} {label}(entries {t["dates"][0]} to {t["dates"][-1]}) --')
    print('  period      n     ann.EV(r)  ann.T-bill  ann.excess  NW t   hit   worst-month  p1     assigned')
    out = {}
    for pn, lo, hi in PER:
        mk = L.period_mask(t['dates'], lo, hi)
        if mk.sum() < 30:
            continue
        s = {'n': int(mk.sum()), 'ev': ann(r[mk], t['days'][mk]), 'tb': ann(t['tb'][mk], t['days'][mk]),
             'ex': ann(e[mk], t['days'][mk]), 't': L.nw_t(e[mk], 0.0, LAG), 'hit': float((r[mk] > 0).mean()),
             'worst': float(r[mk].min()), 'p1': float(np.percentile(r[mk], 1)), 'asg': float(t['assigned'][mk].mean()),
             'worst_date': t['dates'][int(np.argmin(np.where(mk, r, 9)))]}
        out[pn] = s
        print(f'  {pn:10} {s["n"]:5d}  {s["ev"]:+8.2%}   {s["tb"]:+8.2%}   {s["ex"]:+8.2%}  {s["t"]:5.2f}  {s["hit"]:.0%}  '
              f'{s["worst"]:+7.1%} ({s["worst_date"]})  {s["p1"]:+6.1%}  {s["asg"]:.0%}')
    ch = chain_path(t, len(m['dates']))
    cr = r[ch]
    dd, wy = tail_stats(cr, [t['dates'][k] for k in ch])
    print(f'  monthly chain (n {len(ch)}): worst month {cr.min():+.1%}, max drawdown {dd:+.1%}, worst year {wy[0]} {wy[1] - 1:+.1%}')
    f = out['full']
    verdict = ('CONFIRMED' if f['ex'] > 0 and f['t'] >= 2 and out.get('2010-2026', {}).get('ex', -1) >= 0.5 * f['ex'] else
               'REJECTED' if f['ex'] <= 0 or abs(f['t']) < 1 else 'WEAK')
    print(f'  variant (collateral earns T-bills, PUT convention): ann. excess = ann. EV(r) = {f["ev"]:+.2%} (NW t {L.nw_t(r, 0.0, LAG):.2f})')
    print(f'  registered verdict rule on this name: {verdict}')
    return {'m': m, 't': t, 'r': r, 'out': out, 'verdict': verdict, 'chain_dd': dd, 'chain_worst': float(cr.min())}


def sharpe(x, tb, days):
    ex_ = x - tb
    return float(np.mean(ex_) / np.std(ex_, ddof=1) * math.sqrt(365 / np.mean(days)))


def boot_sd(a, b, tb, days, reps=1000, block=126, seed=7):
    rng = np.random.default_rng(seed)
    n = len(a)
    nb = int(math.ceil(n / block))
    diffs = []
    for _ in range(reps):
        st = rng.integers(0, max(n - block, 1), nb)
        ix = np.concatenate([np.arange(s, min(s + block, n)) for s in st])[:n]
        diffs.append(sharpe(a[ix], tb[ix], days[ix]) - sharpe(b[ix], tb[ix], days[ix]))
    return float(np.std(diffs, ddof=1))


def p2(name, refresh, atm=False, label=''):
    m = market(name, refresh)
    cost = 0.0005 if name == 'SPY' else 0.001
    t = trades(m, 'C', 0.30, cost, atm=atm)
    rc = t['stock'] + t['opt'] / t['S0']
    rs = t['stock']
    print(f'\n-- P2 covered call ({"ATM" if atm else "0.30-delta"}) on {name} {label}(entries {t["dates"][0]} to {t["dates"][-1]}) --')
    print('  period      n     Sharpe cc  Sharpe stk  diff   boot t  ann.ret cc  ann.ret stk  T-bill  worst-month cc / stk')
    out = {}
    for pn, lo, hi in PER:
        mk = L.period_mask(t['dates'], lo, hi)
        if mk.sum() < 60:
            continue
        a, b, tb, dy = rc[mk], rs[mk], t['tb'][mk], t['days'][mk]
        s = {'n': int(mk.sum()), 'sc': sharpe(a, tb, dy), 'ss': sharpe(b, tb, dy), 'rc': ann(a, dy), 'rs': ann(b, dy),
             'tb': ann(tb, dy), 'wc': float(a.min()), 'ws': float(b.min())}
        s['diff'] = s['sc'] - s['ss']
        s['t'] = s['diff'] / boot_sd(a, b, tb, dy) if pn != 'last5y' else float('nan')
        out[pn] = s
        print(f'  {pn:10} {s["n"]:5d}  {s["sc"]:8.2f}   {s["ss"]:8.2f}  {s["diff"]:+.2f}  {s["t"]:5.2f}   {s["rc"]:+7.2%}    '
              f'{s["rs"]:+7.2%}    {s["tb"]:+.2%}  {s["wc"]:+.1%} / {s["ws"]:+.1%}')
    f, late = out['full'], out.get('2010-2026', {})
    ok = f['diff'] > 0 and f['t'] >= 2 and late.get('diff', -1) >= 0.5 * f['diff'] and f['rc'] > f['tb']
    verdict = 'CONFIRMED' if ok else ('REJECTED' if f['diff'] <= 0 or abs(f['t']) < 1 else 'WEAK')
    print(f'  registered verdict rule on this name: {verdict}')
    return {'out': out, 'verdict': verdict, 't': t}


# ------------------------------------------------------------------ P3
def spread_trades(m, d_short=0.20, d_long=0.10, mult_s=1.0, mult_l=1.0):
    d, S, iv, r, q = m['dates'], m['S'], m['iv'], m['r'], m['q']
    ex = L.expiry_index(d)
    idx = np.array([i for i in range(len(d)) if ex[i] > i])
    e = ex[idx]
    T0 = np.array([(d[j] - d[i]).days / 365.0 for i, j in zip(idx, e)])
    Ks = L.strike_for_delta(S[idx], T0, iv[idx] * mult_s, r[idx], q[idx], d_short, 'P')
    Kl = L.strike_for_delta(S[idx], T0, iv[idx] * mult_l, r[idx], q[idx], d_long, 'P')
    ms = L.bs(S[idx], Ks, T0, iv[idx] * mult_s, r[idx], q[idx], 'P')
    ml = L.bs(S[idx], Kl, T0, iv[idx] * mult_l, r[idx], q[idx], 'P')
    credit = ms * (1 - HS) - ml * (1 + HS)
    risk = (Ks - Kl) - credit
    ST = S[e]
    pnl = credit - np.maximum(Ks - ST, 0) + np.maximum(Kl - ST, 0)
    return {'idx': idx, 'e': e, 'dates': [d[i] for i in idx], 'Ks': Ks, 'Kl': Kl, 'credit': credit, 'risk': risk,
            'x': pnl / risk, 'maxloss': ST <= Kl, 'days': T0 * 365, 'T0': T0}


def p3_report(m, t, label):
    print(f'\n-- P3 SPY 30-DTE put credit spread 0.20/0.10 delta {label} --')
    print('  period      n     EV/$risk  ann.(x12) NW t   hit   max-loss share  credit/risk  worst trade (date)    p1')
    out = {}
    for pn, lo, hi in PER:
        mk = L.period_mask(t['dates'], lo, hi)
        x = t['x'][mk]
        s = {'n': int(mk.sum()), 'ev': float(x.mean()), 'ann': ann(x, t['days'][mk]), 't': L.nw_t(x, 0.0, LAG),
             'hit': float((x > 0).mean()), 'ml': float(t['maxloss'][mk].mean()), 'cr': float((t['credit'] / t['risk'])[mk].mean()),
             'worst': float(x.min()), 'wd': t['dates'][int(np.argmin(np.where(mk, t['x'], 9)))], 'p1': float(np.percentile(x, 1))}
        out[pn] = s
        print(f'  {pn:10} {s["n"]:5d}  {s["ev"]:+.4f}  {s["ann"]:+7.2%}  {s["t"]:5.2f}  {s["hit"]:.0%}   {s["ml"]:6.1%}        '
              f'{s["cr"]:.3f}     {s["worst"]:+.2f} ({s["wd"]})  {s["p1"]:+.2f}')
    ch = chain_path(t, len(m['dates']))
    cx = t['x'][ch]
    cd = [t['dates'][k] for k in ch]
    yrs = {}
    for x, dt in zip(cx, cd):
        yrs.setdefault(dt.year, []).append(x)
    worst_yr = min(yrs.items(), key=lambda kv: sum(kv[1]))
    print(f'  monthly chain (n {len(ch)}, one spread at a time): worst month {cx.min():+.2f} of risk; months losing >= 50% of risk '
          f'{int((cx <= -0.5).sum())}; worst year {worst_yr[0]} {sum(worst_yr[1]):+.2f} x risk (sum of 12 months)')
    return out


def skew_mults(spy_chain, vix_close):
    """POST-HOC: median IV / VIX for 21-35 DTE SPY puts near 0.20 and 0.10 delta in today's chain."""
    today = date.fromisoformat(spy_chain['timestamp'][:10])
    b = {0.20: [], 0.10: []}
    for o in spy_chain['data']['options']:
        _, exp, typ, k = occ(o['option'])
        if typ != 'P' or not 21 <= (exp - today).days <= 35 or not o.get('iv') or not o.get('delta'):
            continue
        dl = abs(float(o['delta']))
        for c in b:
            if abs(dl - c) <= 0.02:
                b[c].append(float(o['iv']) * 100 / vix_close)
    return {c: float(np.median(v)) if v else 1.0 for c, v in b.items()}


def p3_today(spy_chain):
    """Feasibility today: the 0.20 and 0.10 delta puts nearest 30 DTE in the live chain; credit at bid/ask; risk vs cash."""
    spot = float(spy_chain['data']['current_price'])
    sh = pick(spy_chain, 'P', 0.20, 21, 35)
    lg = pick(spy_chain, 'P', 0.10, 21, 35)
    exps = sorted(set(o['_exp'] for o in sh) & set(o['_exp'] for o in lg), key=lambda e: abs((e - date.fromisoformat(
        spy_chain['timestamp'][:10])).days - 30))
    if not exps:
        print('  no common 21-35 DTE expiry')
        return None
    e = exps[0]
    s = next(o for o in sh if o['_exp'] == e)
    lo = next(o for o in lg if o['_exp'] == e)
    credit_nat = float(s['bid']) - float(lo['ask'])
    credit_mid = (float(s['bid']) + float(s['ask'])) / 2 - (float(lo['bid']) + float(lo['ask'])) / 2
    width = s['_k'] - lo['_k']
    risk = (width - credit_nat) * 100
    print(f'  TODAY SPY {spot:.2f}: {e} ({s["_dte"]} DTE) short {s["_k"]:.0f}P (d {float(s["delta"]):+.2f}, iv {float(s["iv"]):.3f}) / '
          f'long {lo["_k"]:.0f}P (d {float(lo["delta"]):+.2f}, iv {float(lo["iv"]):.3f}); width ${width:.0f}; credit natural '
          f'${credit_nat * 100:.0f}, mid ${credit_mid * 100:.0f}; max loss ${risk:,.0f} vs cash ${CASH:,.0f} -> '
          f'{"fits" if risk <= CASH else "DOES NOT FIT"}; a $5-wide spread at these deltas is not the registered test')
    return {'spot': spot, 'width': width, 'risk': risk, 'credit_nat': credit_nat, 'exp': e}


def nov5(m, label):
    """POST-HOC: the 2026-11-05 session applied to P3 spreads opened at each prior close (marked at the 11/05 close at that VIX)."""
    d, S, iv, r, q = m['dates'], m['S'], m['iv'], m['r'], m['q']
    D = date(2026, 11, 5)
    if D not in d:
        print('  11/05/2026 not in data')
        return None
    j = d.index(D)
    print(f'\n-- POST-HOC 11/05/2026: SPY {S[j - 1]:.2f} -> {S[j]:.2f} ({S[j] / S[j - 1] - 1:+.2%}), VIX {iv[j - 1] * 100:.1f} -> '
          f'{iv[j] * 100:.1f}; {label} --')
    rows = []
    for i in range(j - 25, j):
        if (D - d[i]).days >= 30:  # a 30-day spread opened then had expired before 11/05
            continue
        T0 = 30 / 365.0
        Ks = float(L.strike_for_delta(S[i], T0, iv[i], r[i], q[i], 0.20, 'P'))
        Kl = float(L.strike_for_delta(S[i], T0, iv[i], r[i], q[i], 0.10, 'P'))
        cr = float(L.bs(S[i], Ks, T0, iv[i], r[i], q[i], 'P')) * (1 - HS) - float(L.bs(S[i], Kl, T0, iv[i], r[i], q[i], 'P')) * (1 + HS)
        risk = Ks - Kl - cr
        T1 = max(30 - (D - d[i]).days, 0) / 365.0
        mark = float(L.bs(S[j], Ks, T1, iv[j], r[j], q[j], 'P')) * (1 + HS) - float(L.bs(S[j], Kl, T1, iv[j], r[j], q[j], 'P')) * (1 - HS)
        mark0 = float(L.bs(S[j - 1], Ks, T1 + 1 / 365, iv[j - 1], r[j - 1], q[j - 1], 'P')) - float(
            L.bs(S[j - 1], Kl, T1 + 1 / 365, iv[j - 1], r[j - 1], q[j - 1], 'P'))
        pnl = cr - mark
        rows.append((d[i], Ks, Kl, cr, risk, pnl / risk, (mark0 - mark) / risk, S[j] < Ks))
    for dt, ks, kl, cr, rk, x, day, itm in rows[-1:] + rows[:1] + [min(rows, key=lambda z: z[5])]:
        print(f'  opened {dt}: short {ks:.0f} / long {kl:.0f}, credit {cr:.2f}, risk {rk:.2f}; open P&L at 11/05 close {x:+.2f} x risk '
              f'(that day alone {day:+.2f}); short strike breached: {itm}')
    print(f'  spreads opened on the {len(rows)} prior closes: mean open P&L {np.mean([z[5] for z in rows]):+.2f} x risk; '
          f'{sum(z[7] for z in rows)} with the short strike breached')
    return rows


# ------------------------------------------------------------------ index evidence
def monthly(series):
    ds = sorted(series)
    me = {}
    for d in ds:
        me[(d.year, d.month)] = (d, series[d])
    keys = sorted(me)
    return [(me[k][0], me[k][1]) for k in keys]


def index_stats(refresh):
    print('\n==== CBOE INDEX EVIDENCE (published daily histories, monthly returns, Sharpe over ^IRX) ====')
    tr, _ = yahoo('SP500TR', refresh)
    irx, _ = yahoo('IRX')
    irx_d = {d: v[0] for d, v in irx.items()}
    spx = {d: v[0] for d, v in tr.items()}
    for name, start in (('PUT', date(2007, 1, 1)), ('BXM', date(2002, 4, 1))):
        idx = {d: v for d, v in cboe_index(name, refresh).items() if d >= start}
        common = sorted(set(idx) & set(spx))
        mi = monthly({d: idx[d] for d in common})
        ms = monthly({d: spx[d] for d in common})
        dts = [a[0] for a in mi][1:]
        ri = np.array([b[1] / a[1] - 1 for a, b in zip(mi, mi[1:])])
        rs = np.array([b[1] / a[1] - 1 for a, b in zip(ms, ms[1:])])
        tb = L.ffill_on(dts, irx_d) / 100 / 12
        print(f'{name} vs S&P 500 TR, {dts[0]:%Y-%m} to {dts[-1]:%Y-%m}')
        for pn, lo, hi in PER[:3]:
            mk = L.period_mask(dts, lo, hi)
            if mk.sum() < 12:
                continue
            for lab, x in ((name, ri[mk]), ('SP500TR', rs[mk])):
                cagr = float(np.prod(1 + x) ** (12 / len(x)) - 1)
                vol = float(np.std(x, ddof=1) * math.sqrt(12))
                sh = float(np.mean(x - tb[mk]) / np.std(x - tb[mk], ddof=1) * math.sqrt(12))
                eq = np.cumprod(1 + x)
                dd = float((eq / np.maximum.accumulate(eq) - 1).min())
                print(f'  {pn:10} {lab:8} n {len(x):3d}  CAGR {cagr:+6.2%}  vol {vol:5.1%}  Sharpe {sh:5.2f}  maxDD {dd:+6.1%}  '
                      f'worst month {x.min():+6.1%}')


# ------------------------------------------------------------------ main
def main():
    refresh = '--refresh' in sys.argv
    os.makedirs(CACHE, exist_ok=True)
    for n in ('IRX', 'VIX', 'SPY'):
        yahoo(n, refresh)
    index_stats(refresh)
    feas, chains = scan(refresh)

    print('\n==== P1 CASH-SECURED PUTS ====')
    p1_res = {}
    for k, c in enumerate(feas['P']):
        p1_res[c['sym']] = p1(c['sym'], refresh, label='[BEST CANDIDATE] ' if k == 0 else '[descriptive] ')
    p1('SPY', False, label='[reference: needs ~$68k collateral, not feasible] ')
    for s, res in p1_res.items():  # POST-HOC: model IV vs chain IV today
        c = next(x for x in feas['P'] if x['sym'] == s)
        m = res['m']
        print(f'  POST-HOC {s}: model IV today (RV20 x 1.1) {m["iv"][-1]:.3f} vs chain IV of the 0.30-delta put {float(c["o"]["iv"]):.3f}')

    print('\n==== P2 COVERED CALLS ====')
    for k, c in enumerate(feas['C']):
        lab = '[BEST CANDIDATE] ' if k == 0 else '[descriptive] '
        p2(c['sym'], refresh, label=lab)
        p2(c['sym'], False, atm=True, label=lab + 'variant ')
    p2('SPY', False, label='[reference: 100 SPY shares ~$68k, not feasible] ')
    p2('SPY', False, atm=True, label='[reference, BXM-like ATM] ')

    print('\n==== P3 SPY PUT CREDIT SPREADS (model) ====')
    m = market('SPY')
    t = spread_trades(m)
    p3_report(m, t, '(registered: IV = VIX for both legs)')
    spy_chain = chains.get('SPY') or chain('SPY', refresh)
    vix_now = float(m['iv'][-1] * 100)
    mult = skew_mults(spy_chain, vix_now)
    print(f'\n  POST-HOC skew from today\'s chain (VIX {vix_now:.2f}): 0.20-delta put IV {mult[0.20]:.2f} x VIX, 0.10-delta {mult[0.10]:.2f} x VIX')
    t2 = spread_trades(m, mult_s=mult[0.20], mult_l=mult[0.10])
    p3_report(m, t2, f'POST-HOC at today\'s skew ({mult[0.20]:.2f}/{mult[0.10]:.2f} x VIX)')
    p3_today(spy_chain)
    nov5(m, 'registered model (IV = VIX)')

    if feas['P']:  # POST-HOC: the 11/05 day on the P1 best candidate
        s = feas['P'][0]['sym']
        mm = p1_res[s]['m']
        if date(2026, 11, 5) in mm['dates']:
            j = mm['dates'].index(date(2026, 11, 5))
            print(f'  POST-HOC 11/05/2026 on {s}: {mm["S"][j - 1]:.2f} -> {mm["S"][j]:.2f} ({mm["S"][j] / mm["S"][j - 1] - 1:+.2%})')


if __name__ == '__main__':
    main()
