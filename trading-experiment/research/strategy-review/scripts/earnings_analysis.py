"""Claims C1 (post-earnings continuation after big gaps) and C2 (pre-earnings run-up), per PROTOCOL.md and claims.md.

Run:  python3 -I earnings_analysis.py <cache_dir> <out_csv> [<events_csv>]
      (cache_dir is what earnings_fetch.py filled; reads only cached raw JSON, no network)

Implementation choices FIXED BEFORE ANY RESULT WAS COMPUTED (2026-10-29 ~08:25 ET). claims.md leaves these open:
  Events
    * Form '8-K' (amendments excluded) whose items contain 2.02, accepted 2005-01-01 or later. acceptanceDateTime is UTC
      (checked: AAPL 20:30Z = 16:30 ET) and is converted to America/New_York.
    * Reaction day t: accepted >= 16:00 ET -> next session; < 09:30 -> that day if it is a session, else the next one;
      09:30-16:00 -> same day, labelled 'intraday'. Sessions = SPY's Yahoo calendar.
    * A filing whose reaction day is within 5 sessions after the previous event of the same ticker is merged into it
      (e.g. IBM's follow-up 2.02 the next day). PRIMARY = all remaining 2.02 events, as claims.md says.
    * Declared robustness variant 'earnings_only': also drop a 2.02 that is followed by another 2.02 of the same ticker
      6-40 calendar days later (interim updates: XOM/CVX 'earnings considerations', TSLA deliveries, pre-announcements).
    * Predecessor CIKs: GOOGL + Google Inc.; AVGO + Avago + Broadcom Ltd; XOM + Exxon Mobil Corp; ORCL + old Oracle.
  Returns
    * Yahoo adjusted closes on SPY's calendar. Gap = adj close t / adj close t-1 - 1 (raw, not market-adjusted).
    * Excess return over h sessions from close t = stock return - SPY return (simple difference).
    * Baseline ('random entry'): mean h-session excess return of the same ticker over every entry day of the same
      calendar year. Abnormal = sign(gap) * (excess - baseline). Mean abnormal > 0 = continuation beyond baseline.
    * Hit = signed excess return (net of SPY, before baseline) > 0, i.e. 'continued'.
    * t_iid and t_cl (cluster-robust by reaction-day calendar month; event windows of different names overlap in
      earnings season). Verdicts use t_cl. 95% CI: month-block bootstrap, 2000 draws, seed 7.
    * Costs: 10 bps round trip for large caps.
  Options (Black-Scholes, r = 0, no dividends, no skew, no event IV crush beyond what is stated)
    * RV20 = annualised stdev of the 20 daily log returns ending the session BEFORE entry's event day:
      C1: ending t-1 (excludes the gap day itself). C2: ending t-7 (the entry day).
    * C1: delta 0.35 (call for up gaps, put for down gaps), 25 calendar DTE, IV = 1.3 x RV20 at entry and at exit,
      held 5 sessions (T shrinks by calendar days). Declared sensitivity: RV20 ending t (includes the gap day).
    * C2: delta 0.40 call, 30 calendar DTE, IV = 1.2 x RV20 at t-7, exit at close t-1 with IV = 1.5 x the same RV20.
      Declared sensitivity: no ramp (exit IV = 1.2 x RV20).
    * Pay half of a 3% spread each way: cost = model x 1.015, proceeds = model x 0.985. EV/$ = mean(proceeds/cost).
    * Options baseline: the same contract bought on every session (same tickers, same years), for context only.
  Verdict (per PROTOCOL.md, made mechanical here):
    REJECTED  if full-sample mean abnormal <= 0, or |t_cl| < 1 (no detectable effect), or the 2010-2026 mean <= 0
              (only in early data).
    CONFIRMED if |t_cl| >= 2, the 2010-2026 mean >= half the full mean, mean - 10 bps > 0, and options EV/$ > 1.0.
    WEAK      otherwise. |t| >= 3 is 'strong', 2-3 'suggestive' (about 30 tests in the review).
  Post-hoc rows (labelled 'post-hoc', never used for a verdict): down gaps >= 10% (today's GOOGL size) and single-name
  descriptive rows for GOOGL and INTC.
"""
import csv
import json
import math
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from statistics import NormalDist
from zoneinfo import ZoneInfo

import numpy as np

ET = ZoneInfo('America/New_York')
CIKS = {"AAPL": [320193], "MSFT": [789019], "GOOGL": [1652044, 1288776], "AMZN": [1018724], "META": [1326801],
        "NVDA": [1045810], "TSLA": [1318605], "NFLX": [1065280], "AVGO": [1730168, 1441634, 1649338], "INTC": [50863],
        "AMD": [2488], "ORCL": [1341439, 777676], "CRM": [1108524], "ADBE": [796343], "QCOM": [804328],
        "CSCO": [858877], "IBM": [51143], "TXN": [97476], "MU": [723125], "JPM": [19617], "BAC": [70858],
        "XOM": [2115436, 34088], "CVX": [93410], "WMT": [104169], "COST": [909832]}
PERIODS = [("full", date(2005, 1, 1), date(2026, 12, 31)), ("2005-2014", date(2005, 1, 1), date(2014, 12, 31)),
           ("2015-2026", date(2015, 1, 1), date(2026, 12, 31)), ("2005-2009", date(2005, 1, 1), date(2009, 12, 31)),
           ("2010-2026", date(2010, 1, 1), date(2026, 12, 31)), ("last10y", date(2016, 10, 29), date(2026, 12, 31))]
COST_RT = 0.0010
HALF_SPREAD = 0.015
N = NormalDist()


# ------------------------------------------------------------------ data
def load_prices(cache, sym):
    d = json.loads((cache / 'yahoo' / f'{sym}.json').read_text())['chart']['result'][0]
    ts = d['timestamp']
    adj = d['indicators']['adjclose'][0]['adjclose']
    out = {}
    for t, a in zip(ts, adj):
        if a is None or a <= 0:
            continue
        # Yahoo daily timestamps are the session open (09:30 ET); take the ET calendar date
        out[datetime.fromtimestamp(t, tz=timezone.utc).astimezone(ET).date()] = float(a)
    return out


def sec_rows(cache, cik):
    m = json.loads((cache / 'sec' / f'CIK{cik:010d}.json').read_text())
    pages = [m['filings']['recent']] + [json.loads((cache / 'sec' / f['name']).read_text())
                                        for f in m['filings'].get('files', [])]
    for p in pages:
        for i in range(len(p['form'])):
            yield {k: p[k][i] for k in ('form', 'filingDate', 'acceptanceDateTime', 'items', 'accessionNumber')}


def build_events(cache, sessions):
    """Return list of dicts: ticker, accepted_et, t_idx, timing, interim(bool)."""
    sidx = {d: i for i, d in enumerate(sessions)}
    sess_arr = np.array([d.toordinal() for d in sessions])
    events = []
    for tk, ciks in CIKS.items():
        filings = []
        for cik in ciks:
            for r in sec_rows(cache, cik):
                if r['form'] != '8-K' or '2.02' not in (r['items'] or ''):
                    continue
                acc = datetime.strptime(r['acceptanceDateTime'][:19], '%Y-%m-%dT%H:%M:%S').replace(tzinfo=timezone.utc)
                acc = acc.astimezone(ET)
                if acc.date() < date(2005, 1, 1):
                    continue
                filings.append((acc, r['accessionNumber']))
        filings = sorted(set(filings))
        evs = []
        for acc, accn in filings:
            d = acc.date()
            hm = acc.hour * 60 + acc.minute
            if hm >= 16 * 60:
                timing = 'after_close'
                k = int(np.searchsorted(sess_arr, d.toordinal(), side='right'))  # first session > d
            elif hm < 9 * 60 + 30:
                timing = 'pre_open'
                k = int(np.searchsorted(sess_arr, d.toordinal(), side='left'))  # first session >= d
            else:
                timing = 'intraday'
                k = int(np.searchsorted(sess_arr, d.toordinal(), side='left'))
                if sessions[min(k, len(sessions) - 1)] != d:
                    timing = 'intraday_nonsession'
            if k >= len(sessions):
                continue
            evs.append({'ticker': tk, 'accepted_et': acc, 'accession': accn, 't': k, 'timing': timing})
        # merge filings within 5 sessions after the previous kept event
        kept = []
        for e in evs:
            if kept and e['t'] - kept[-1]['t'] <= 5:
                kept[-1]['merged'] = kept[-1].get('merged', 0) + 1
                continue
            kept.append(e)
        # interim flag: followed by another 2.02 of the same ticker 6-40 calendar days later
        for i, e in enumerate(kept):
            e['interim'] = False
            if i + 1 < len(kept):
                gap_days = (kept[i + 1]['accepted_et'].date() - e['accepted_et'].date()).days
                e['interim'] = 6 <= gap_days <= 40
        events += kept
    return events


# ------------------------------------------------------------------ Black-Scholes (r = 0, q = 0)
def ncdf(x):
    return 0.5 * (1.0 + np.vectorize(math.erf)(np.asarray(x, float) / math.sqrt(2.0)))


def bs(S, K, T, sig, call):
    S, K, T, sig = (np.asarray(v, float) for v in (S, K, T, sig))
    T = np.maximum(T, 1e-6)
    sd = sig * np.sqrt(T)
    d1 = (np.log(S / K) + 0.5 * sd ** 2) / sd
    d2 = d1 - sd
    c = S * ncdf(d1) - K * ncdf(d2)
    return np.where(call, c, c - S + K)


def strike_for_delta(delta_abs, T, sig, call):
    """S = 1. Call delta N(d1) = delta; put delta N(d1) - 1 = -delta."""
    target = np.where(call, delta_abs, 1.0 - delta_abs)
    d1 = np.vectorize(N.inv_cdf)(target)
    sd = sig * np.sqrt(T)
    return np.exp(-d1 * sd + 0.5 * sd ** 2)


def option_ratio(ret, cal_days, dte, delta_abs, iv_in, iv_out, call):
    """Proceeds/cost per $ for buying at model x (1+half spread) and selling at model x (1-half spread)."""
    T0 = dte / 365.0
    K = strike_for_delta(delta_abs, T0, iv_in, call)
    p0 = bs(1.0, K, T0, iv_in, call)
    p1 = bs(1.0 + ret, K, (dte - cal_days) / 365.0, iv_out, call)
    return p1 * (1 - HALF_SPREAD) / (p0 * (1 + HALF_SPREAD))


# ------------------------------------------------------------------ stats
def cluster_t(x, groups):
    x = np.asarray(x, float)
    n = len(x)
    if n < 3:
        return float('nan'), float('nan')
    m = x.mean()
    se_iid = x.std(ddof=1) / math.sqrt(n)
    u = {}
    for v, g in zip(x - m, groups):
        u[g] = u.get(g, 0.0) + v
    G = len(u)
    s = np.array(list(u.values()))
    se_cl = math.sqrt((s ** 2).sum()) / n * math.sqrt(G / (G - 1)) if G > 1 else float('nan')
    return m / se_iid if se_iid > 0 else float('nan'), m / se_cl if se_cl and se_cl > 0 else float('nan')


def block_boot_ci(x, groups, reps=2000, seed=7):
    x = np.asarray(x, float)
    if len(x) < 3:
        return float('nan'), float('nan')
    rng = np.random.default_rng(seed)
    gl = sorted(set(groups))
    by = {g: [] for g in gl}
    for v, g in zip(x, groups):
        by[g].append(v)
    sums = np.array([sum(by[g]) for g in gl])
    cnts = np.array([len(by[g]) for g in gl])
    idx = rng.integers(0, len(gl), size=(reps, len(gl)))
    means = sums[idx].sum(1) / cnts[idx].sum(1)
    return float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5))


def verdict(full, late, ev):
    if not full or full['n'] < 3:
        return 'n/a'
    m, t = full['mean_abn'], full['t_cl']
    if m <= 0 or abs(t) < 1:
        return 'REJECTED'
    if late is None or late['n'] < 3 or late['mean_abn'] <= 0:
        return 'REJECTED'
    ok = abs(t) >= 2 and late['mean_abn'] >= 0.5 * m and m - COST_RT > 0 and (ev is None or ev > 1.0)
    return 'CONFIRMED' if ok else 'WEAK'


# ------------------------------------------------------------------ main
def main():
    cache, out_csv = Path(sys.argv[1]), Path(sys.argv[2])
    ev_csv = Path(sys.argv[3]) if len(sys.argv) > 3 else None
    spy_map = load_prices(cache, 'SPY')
    sessions = sorted(d for d in spy_map if d >= date(2004, 11, 1))
    S = np.array([spy_map[d] for d in sessions])
    nS = len(sessions)
    years = np.array([d.year for d in sessions])
    px = {}
    for tk in CIKS:
        m = load_prices(cache, tk)
        px[tk] = np.array([m.get(d, np.nan) for d in sessions])
    events = build_events(cache, sessions)

    def fwd(a, i, h):
        return a[i + h] / a[i] - 1.0 if i + h < nS else np.nan

    def rv20(p, end):
        if end - 20 < 0:
            return np.nan
        w = p[end - 20:end + 1]
        if np.isnan(w).any():
            return np.nan
        return float(np.std(np.diff(np.log(w)), ddof=1) * math.sqrt(252))

    # per ticker x year baseline of h-session excess returns (entry every session)
    base = {}
    for tk in CIKS:
        p = px[tk]
        for h in (5, 6, 10):
            ex = np.full(nS, np.nan)
            ex[:nS - h] = (p[h:] / p[:-h] - 1) - (S[h:] / S[:-h] - 1)
            for y in np.unique(years):
                v = ex[years == y]
                v = v[~np.isnan(v)]
                base[(tk, int(y), h)] = float(v.mean()) if len(v) > 20 else np.nan

    rows = []
    for e in events:
        tk, t = e['ticker'], e['t']
        p = px[tk]
        if t < 21 or np.isnan(p[t]) or np.isnan(p[t - 1]):
            continue
        d = sessions[t]
        r = {'ticker': tk, 'react_date': d, 'accepted_et': e['accepted_et'].strftime('%Y-%m-%d %H:%M'),
             'timing': e['timing'], 'interim': e['interim'], 'merged': e.get('merged', 0),
             'gap': p[t] / p[t - 1] - 1, 'month': d.strftime('%Y-%m'), 'year': d.year}
        for h in (5, 10):
            r[f'ret{h}'] = fwd(p, t, h)
            r[f'ex{h}'] = fwd(p, t, h) - fwd(S, t, h)
            r[f'base{h}'] = base.get((tk, d.year, h), np.nan)
            r[f'cal{h}'] = (sessions[t + h] - d).days if t + h < nS else np.nan
        r['rv_pre'] = rv20(p, t - 1)
        r['rv_incl'] = rv20(p, t)
        # C2 window: close t-7 -> close t-1
        if t - 7 >= 20 and not np.isnan(p[t - 7]):
            r['c2_ret'] = p[t - 1] / p[t - 7] - 1
            r['c2_ex'] = r['c2_ret'] - (S[t - 1] / S[t - 7] - 1)
            r['c2_base'] = base.get((tk, sessions[t - 7].year, 6), np.nan)
            r['c2_cal'] = (sessions[t - 1] - sessions[t - 7]).days
            r['c2_rv'] = rv20(p, t - 7)
        rows.append(r)

    out = []

    def summarise(sel, claim, test, label, h, kind):
        """kind 'c1' (signed continuation) or 'c2' (long run-up)."""
        res = {}
        for pname, a, b in PERIODS:
            ss = [r for r in sel if a <= r['react_date'] <= b]
            if kind == 'c1':
                ss = [r for r in ss if not np.isnan(r[f'ex{h}']) and not np.isnan(r[f'base{h}'])]
                sg = np.array([np.sign(r['gap']) for r in ss])
                raw = sg * np.array([r[f'ex{h}'] for r in ss])
                abn = sg * np.array([r[f'ex{h}'] - r[f'base{h}'] for r in ss])
            else:
                ss = [r for r in ss if not np.isnan(r.get('c2_ex', np.nan)) and not np.isnan(r.get('c2_base', np.nan))]
                raw = np.array([r['c2_ex'] for r in ss])
                abn = np.array([r['c2_ex'] - r['c2_base'] for r in ss])
            n = len(ss)
            row = {'claim': claim, 'test': test, 'label': label, 'horizon': h, 'period': pname, 'n': n}
            if n == 0:
                res[pname] = None
                out.append(row)
                continue
            groups = [r['month'] for r in ss]
            ti, tc = cluster_t(abn, groups)
            lo, hi = block_boot_ci(abn, groups)
            row.update({'mean_signed_ex': raw.mean(), 'mean_abn': abn.mean(), 'median_abn': float(np.median(abn)),
                        'hit_rate': float((raw > 0).mean()), 'hits': int((raw > 0).sum()), 't_iid': ti, 't_cl': tc,
                        'ci_lo': lo, 'ci_hi': hi, 'worst_abn': float(abn.min()), 'mean_abn_net_cost': abn.mean() - COST_RT})
            # options
            ev = ev_sens = None
            if kind == 'c1' and h == 5:
                ok = [i for i, r in enumerate(ss) if not np.isnan(r['rv_pre']) and not np.isnan(r['ret5'])]
                if ok:
                    ret = np.array([ss[i]['ret5'] for i in ok])
                    cal = np.array([ss[i]['cal5'] for i in ok])
                    call = np.array([ss[i]['gap'] > 0 for i in ok])
                    for key, rvk in (('ev', 'rv_pre'), ('ev_sens', 'rv_incl')):
                        iv = 1.3 * np.array([ss[i][rvk] for i in ok])
                        rat = option_ratio(ret, cal, 25, 0.35, iv, iv, call)
                        row[f'opt_{key}'] = float(rat.mean())
                        if key == 'ev':
                            row['opt_median'] = float(np.median(rat))
                            row['opt_pwin'] = float((rat > 1).mean())
                    ev = row['opt_ev']
            if kind == 'c2':
                ok = [i for i, r in enumerate(ss) if not np.isnan(r['c2_rv'])]
                ret = np.array([ss[i]['c2_ret'] for i in ok])
                cal = np.array([ss[i]['c2_cal'] for i in ok])
                rv = np.array([ss[i]['c2_rv'] for i in ok])
                rat = option_ratio(ret, cal, 30, 0.40, 1.2 * rv, 1.5 * rv, np.ones(len(ok), bool))
                row.update({'opt_ev': float(rat.mean()), 'opt_median': float(np.median(rat)),
                            'opt_pwin': float((rat > 1).mean())})
                row['opt_ev_sens'] = float(option_ratio(ret, cal, 30, 0.40, 1.2 * rv, 1.2 * rv,
                                                        np.ones(len(ok), bool)).mean())
                ev = row['opt_ev']
            row['_ev'] = ev
            res[pname] = row
            out.append(row)
        full, late = res.get('full'), res.get('2010-2026')
        v = verdict(full, late, full['_ev'] if full else None) if label != 'post-hoc' else 'post-hoc (no verdict)'
        for pname, _, _ in PERIODS:
            if res.get(pname):
                res[pname]['verdict'] = v
        return res

    for variant, base_sel in (('primary', rows), ('earnings_only', [r for r in rows if not r['interim']])):
        lab = 'pre-registered' if variant == 'primary' else 'declared robustness'
        for thr in (0.05, 0.08):
            for dname, f in (('down', lambda r: r['gap'] <= -thr), ('up', lambda r: r['gap'] >= thr),
                             ('both', lambda r: abs(r['gap']) >= thr)):
                sel = [r for r in base_sel if f(r)]
                for h in (5, 10):
                    summarise(sel, 'C1', f'{variant}: gap {dname} >= {int(thr * 100)}%', lab, h, 'c1')
        summarise(base_sel, 'C2', f'{variant}: all events, t-7 -> t-1', lab, 6, 'c2')
    # post-hoc, descriptive
    for h in (5, 10):
        summarise([r for r in rows if r['gap'] <= -0.10], 'C1', 'post-hoc: gap down >= 10%', 'post-hoc', h, 'c1')
        summarise([r for r in rows if r['ticker'] == 'GOOGL' and r['gap'] <= -0.05], 'C1',
                  'post-hoc: GOOGL gap down >= 5%', 'post-hoc', h, 'c1')
        summarise([r for r in rows if r['ticker'] == 'INTC' and abs(r['gap']) >= 0.05], 'C1',
                  'post-hoc: INTC |gap| >= 5%', 'post-hoc', h, 'c1')
        summarise([r for r in rows if r['timing'] != 'intraday' and abs(r['gap']) >= 0.05], 'C1',
                  'post-hoc: |gap| >= 5% excluding intraday-filed', 'post-hoc', h, 'c1')
    summarise([r for r in rows if r['ticker'] == 'NVDA'], 'C2', 'post-hoc: NVDA only, t-7 -> t-1', 'post-hoc', 6, 'c2')

    # options baseline: same contracts on every session for every ticker (context, not a test)
    ctx = []
    for tk in CIKS:
        p = px[tk]
        for i in range(21, nS - 6):
            if np.isnan(p[i]) or np.isnan(p[i + 6]) or sessions[i] < date(2005, 1, 1):
                continue
            ctx.append((p[i + 5] / p[i] - 1, (sessions[i + 5] - sessions[i]).days, p[i + 6] / p[i] - 1,
                        (sessions[i + 6] - sessions[i]).days, rv20(p, i)))
    ctx = np.array([c for c in ctx if not np.isnan(c[4])])
    for name, call in (('random call', True), ('random put', False)):
        rat = option_ratio(ctx[:, 0], ctx[:, 1], 25, 0.35, 1.3 * ctx[:, 4], 1.3 * ctx[:, 4],
                           np.full(len(ctx), call))
        out.append({'claim': 'C1', 'test': f'baseline: {name} d0.35 25DTE IV 1.3xRV, every session, 5 sessions',
                    'label': 'baseline', 'horizon': 5, 'period': 'full', 'n': len(ctx), 'opt_ev': float(rat.mean()),
                    'opt_median': float(np.median(rat)), 'opt_pwin': float((rat > 1).mean())})
    rat = option_ratio(ctx[:, 2], ctx[:, 3], 30, 0.40, 1.2 * ctx[:, 4], 1.2 * ctx[:, 4], np.full(len(ctx), True))
    out.append({'claim': 'C2', 'test': 'baseline: random call d0.40 30DTE IV 1.2xRV flat, every session, 6 sessions',
                'label': 'baseline', 'horizon': 6, 'period': 'full', 'n': len(ctx), 'opt_ev': float(rat.mean()),
                'opt_median': float(np.median(rat)), 'opt_pwin': float((rat > 1).mean())})

    cols = ['claim', 'test', 'label', 'horizon', 'period', 'n', 'hits', 'hit_rate', 'mean_signed_ex', 'mean_abn',
            'median_abn', 't_iid', 't_cl', 'ci_lo', 'ci_hi', 'worst_abn', 'mean_abn_net_cost', 'opt_ev', 'opt_median',
            'opt_pwin', 'opt_ev_sens', 'verdict']
    with out_csv.open('w', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction='ignore')
        w.writeheader()
        for r in out:
            w.writerow({k: (f'{v:.5f}' if isinstance(v, float) else v) for k, v in r.items() if k in cols})
    if ev_csv:
        keys = ['ticker', 'react_date', 'accepted_et', 'timing', 'interim', 'merged', 'gap', 'ret5', 'ex5', 'base5',
                'ret10', 'ex10', 'base10', 'rv_pre', 'rv_incl', 'c2_ret', 'c2_ex', 'c2_base', 'c2_rv']
        with ev_csv.open('w', newline='') as fh:
            w = csv.DictWriter(fh, fieldnames=keys, extrasaction='ignore')
            w.writeheader()
            for r in rows:
                w.writerow({k: (f'{r[k]:.5f}' if isinstance(r.get(k), float) else r.get(k)) for k in keys})
    timing = {}
    for r in rows:
        timing[r['timing']] = timing.get(r['timing'], 0) + 1
    print('events with prices:', len(rows), 'timing:', timing, 'interim-flagged:', sum(r['interim'] for r in rows),
          'merged filings:', sum(r['merged'] for r in rows))


if __name__ == '__main__':
    main()
