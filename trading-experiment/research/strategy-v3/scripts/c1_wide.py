"""Strategy v3, claim V1 (pre-registered 2026-11-11): C1 on a wider universe, today's 100 largest US companies.

Run (from /home/user/temp; reads and writes only the cache dir and out_csv, never the repo):
  python3 -I trading-experiment/research/strategy-v3/scripts/c1_wide.py fetch <cache_dir>
  python3 -I trading-experiment/research/strategy-v3/scripts/c1_wide.py run   <cache_dir> <out_csv>

  fetch  caches SEC submissions JSON (all pages) for every CIK below and Yahoo adjusted daily bars 2005-01-01 to the
         2026-11-10 close for the 101 tickers plus SPY (the committed earnings_fetch.py code and URL, with period2 moved
         to 2026-11-11 00:00 UTC so no partial bar is read). The SEC needs a contact email: research.sec_ua() refuses
         without one. Then prints the predecessor-coverage check (below). Re-running skips cached files.
  run    no network. Builds the events and per-event rows with the committed C1 code and prints and writes the cells.

Universe (fixed 2026-11-11, before any result). Source: companiesmarketcap.com, "Largest companies in the USA by market
cap", CSV download on 2026-11-11 ~19:10 UTC (sha256 235750ef...ec51, cached in <cache_dir>/universe/). Ranks 1-100, one
ticker per company: Alphabet as GOOGL (C1's class), Berkshire as BRK-B. 24 of the 25 C1 names are in it; ADBE (rank 132,
$93B) is not, so the top 100 = 24 C1 names + 76 new names. ADBE is fetched only for the 25-name reproduction and the
25-name candidate rate. SURVIVORSHIP: these are today's winners, chosen with hindsight (SpaceX, Palantir, GE Vernova and
others only exist late in the sample; names that shrank or failed since 2005 are absent). The same-ticker-same-year
baseline removes each name's own drift, not the selection.

Definitions: identical to strategy-review C1 (earnings_analysis.py docstring), reused as code, not copied:
  * events, reaction day, 5-session merge, interim flag: earnings_analysis.build_events (CIKS replaced in place by the
    100-name map below; C1's predecessor CIKs kept); per-event rows: research/2026-10-30/scripts/c1_vix_split.build_rows
    (gap = adj close t / t-1 - 1 on SPY's calendar; ex5 = 5-session stock return - SPY return from the close of t;
    base5 = the same ticker's mean 5-session excess over every session of that calendar year; RV20 ending t-1).
  * Sample: primary variant (every 8-K item 2.02 event), gap <= -8%, entry at the reaction-day close, 5 sessions, 2005-2026.
  * '5-session excess' for the verdict = the review's abnormal return, -(ex5 - base5) (continuation > 0), with the
    month-clustered t (cluster_t), as C1's verdict used (PROTOCOL rule 3: against random entry, not zero). The raw signed
    excess vs SPY, -ex5, and its clustered t are reported alongside. % continuing = share with -ex5 > 0. Cost: 10 bps.
  * Halves: before and after 2010, i.e. 2005-2009 and 2010-2026, as strategy-v3/claims.md's protocol line and V2 define
    them. C1's table halves (2005-2014, 2015-2026) are reported as a second reading; if the two readings disagree the
    report says so, but the verdict uses the first.
  * Put model: earnings_analysis.option_ratio(ret5, cal5, 25 DTE, delta 0.35, IV = m x RV20 ending t-1 at entry and exit,
    half of a 3% spread each way), m = 1.0 and 1.3. EV per $ = mean ratio; 95% CI = block_boot_ci by reaction month
    (2000 draws, seed 7). Break-even multiple on c1_vix_split.GRID by linear interpolation. No skew, no IV change after
    the event: approximate. Sensitivity: RV20 ending t (gap day included).
  * Cells: all 100; the 76 new names alone; the 24 overlap names; the C1 25 (reproduction context). Periods: full,
    2005-2009, 2010-2026, 2005-2014, 2015-2026, last 10 years. Declared robustness: the earnings_only variant.
  * Candidates: down gaps <= -8% per calendar year (events with a gap, 5-day return not required), mean over 2005-2025
    and over 2021-2025, for the top 100 and for the C1 25; extra per week = (difference) / 52.
  * Verdict (claims.md V1, mechanical): CONFIRMED only if mean abnormal > 0 with t_cl > 2 in BOTH 2005-2009 and 2010-2026
    AND the full-sample put EV per $ at 1.0x RV20 > 1 with its CI lower bound > 1. Otherwise PROTOCOL.md's rule as
    earnings_analysis.verdict makes it: REJECTED if the full mean <= 0, |t_cl| < 1, or the 2010-2026 mean <= 0; else WEAK.
  * Reproduction gate: with the C1 25 names and bars cut at 2026-10-23 (the review's last bar), the run stops unless it
    reproduces earnings-results.csv (n 216, hit 0.61574, abnormal 0.00898, t_cl 2.50959, put EV at 1.3x 1.00265).
  * Predecessor coverage check (fetch, before any return is computed): a name is flagged when its Yahoo bars cover at
    least 252 sessions from 2005 before its first 8-K 2.02 event. A flagged name gets its predecessor registrant's CIK only
    when that registrant reported the same business under the same Yahoo ticker (EXTRA_CIKS, with the reason); the rest
    are listed in the report as gaps.
"""
import csv
import json
import math
import sys
import time
from datetime import date, datetime, timezone
from pathlib import Path

import numpy as np

REPO = Path('/home/user/temp/trading-experiment')
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(REPO / 'research/strategy-review/scripts'))
sys.path.insert(0, str(REPO / 'research/2026-10-30/scripts'))
import earnings_analysis as ea  # noqa: E402
import earnings_fetch as ef  # noqa: E402
import c1_vix_split as cv  # noqa: E402

C1_25 = ef.UNIVERSE
TOP100 = ("AAPL NVDA MSFT GOOGL AMZN SPCX AVGO META TSLA LLY BRK-B WMT MU AMD JPM V XOM JNJ MA ABBV COST KO PLTR CVX CSCO "
          "ORCL PG MRK UNH GE BAC HD INTC AMAT PM LRCX MS TXN PANW CAT RTX GS TMO NFLX WFC AMGN ANET DELL CRWD IBM AXP GEV "
          "KLAC GILD C DIS APH ADI MCD PEP QCOM VZ ABT BLK DE WELL NEE CRM UNP TMUS PFE DHR COP SCHW ISRG MRVL BX TJX T "
          "SCCO UBER SNDK IBKR LMT VRTX BA SPGI PGR APP LOW MO BMY PLD SBUX NEM MCK PH SYK ADP BKNG").split()
NEW = [t for t in TOP100 if t not in C1_25]
OVERLAP = [t for t in TOP100 if t in C1_25]
FETCH = TOP100 + [t for t in C1_25 if t not in TOP100]  # + ADBE
# Predecessor registrants (same business, same Yahoo ticker), C1's plus any the coverage check flags (reason given).
EXTRA_CIKS = dict(ef.EXTRA_CIKS)
EXTRA_CIKS.update({})
YAHOO = ef.YAHOO.replace('period2=1793000000', 'period2=1794355200')  # 2026-11-11 00:00 UTC: last bar 2026-11-10
REPRO_CUT = date(2026, 10, 23)
EXPECT = cv.EXPECT
PERIODS = [('full', 2005, 2026), ('2005-2009', 2005, 2009), ('2010-2026', 2010, 2026), ('2005-2014', 2005, 2014),
           ('2015-2026', 2015, 2026), ('last10y', None, None)]


# ------------------------------------------------------------------ fetch
def fetch(cache):
    import quotes
    import research
    research.sec_ua()  # exits ("Nothing was sent") if no SEC contact email is configured
    sec, yah = cache / 'sec', cache / 'yahoo'
    sec.mkdir(parents=True, exist_ok=True)
    yah.mkdir(parents=True, exist_ok=True)
    cikmap = {}
    for t in FETCH:
        ciks = [research.cik_for(t)] + EXTRA_CIKS.get(t, [])
        cikmap[t] = ciks
        for cik in ciks:
            main_file = sec / f'CIK{cik:010d}.json'
            data = ef.fetch_sec(t, lambda: json.loads(research.sec_get(
                f'https://data.sec.gov/submissions/CIK{cik:010d}.json')), main_file)
            for f in data.get('filings', {}).get('files', []):
                name = f['name']
                ef.fetch_sec(t, lambda: json.loads(research.sec_get('https://data.sec.gov/submissions/' + name)),
                             sec / name)
    (cache / 'ciks.json').write_text(json.dumps(cikmap))
    for s in FETCH + ['SPY']:
        out = yah / f'{s}.json'
        if out.exists():
            continue
        ef.save(out, quotes.get_json(YAHOO.format(sym=s)))
        time.sleep(0.5)
    coverage(cache)


def coverage(cache):
    """First Yahoo bar vs first 8-K 2.02 per name; flag >= 252 sessions of bars before the first event."""
    cikmap = json.loads((cache / 'ciks.json').read_text())
    spy = sorted(d for d in ea.load_prices(cache, 'SPY') if d >= date(2005, 1, 1))
    for t in FETCH:
        px = ea.load_prices(cache, t)
        first_px = min((d for d in px if d >= date(2005, 1, 1)), default=None)
        names, first_ev = [], None
        for cik in cikmap[t]:
            m = json.loads((cache / 'sec' / f'CIK{cik:010d}.json').read_text())
            names.append(f"{cik}:{m.get('name')}")
            for r in ea.sec_rows(cache, cik):
                if r['form'] == '8-K' and '2.02' in (r['items'] or '') and r['filingDate'] >= '2005-01-01':
                    d = date.fromisoformat(r['filingDate'])
                    first_ev = d if first_ev is None or d < first_ev else first_ev
        lag = sum(1 for d in spy if first_px and first_px <= d < (first_ev or date(2100, 1, 1)))
        flag = 'FLAG' if lag >= 252 else ''
        print(f'{t:6s} bars from {first_px} first 2.02 {first_ev} sessions before {lag:5d} {flag} {"; ".join(names)}')


# ------------------------------------------------------------------ run
ORIG_CIKS = dict(ea.CIKS)  # C1's 25-name map, before it is replaced


def set_universe(cikmap):
    ea.CIKS.clear()
    ea.CIKS.update(cikmap)  # cv.CIKS is the same dict object


def rows_for(cache, cikmap, cut=None):
    set_universe(cikmap)
    orig = cv.load_prices
    if cut:
        cv.load_prices = lambda c, s: {d: v for d, v in orig(c, s).items() if d <= cut}
    try:
        return cv.build_rows(cache)
    finally:
        cv.load_prices = orig


def put_ev(ok, mult, rvk='rv_pre'):
    ret = np.array([r['ret5'] for r in ok])
    cal = np.array([r['cal5'] for r in ok])
    rv = np.array([r[rvk] for r in ok])
    return ea.option_ratio(ret, cal, 25, 0.35, mult * rv, mult * rv, np.zeros(len(ok), bool))


def cell(sel):
    ss = [r for r in sel if not np.isnan(r['ex5']) and not np.isnan(r['base5'])]
    out = {'n': len(ss)}
    if len(ss) < 3:
        return out
    raw = -np.array([r['ex5'] for r in ss])
    abn = -np.array([r['ex5'] - r['base5'] for r in ss])
    g = [r['month'] for r in ss]
    _, t_raw = ea.cluster_t(raw, g)
    _, t_abn = ea.cluster_t(abn, g)
    lo, hi = ea.block_boot_ci(abn, g)
    out.update({'n_tickers': len({r['ticker'] for r in ss}), 'n_months': len(set(g)), 'hits': int((raw > 0).sum()),
                'hit_rate': float((raw > 0).mean()), 'mean_signed_ex': float(raw.mean()), 't_cl_signed_ex': t_raw,
                'mean_abn': float(abn.mean()), 'median_abn': float(np.median(abn)), 't_cl': t_abn, 'ci_lo': lo,
                'ci_hi': hi, 'worst_abn': float(abn.min()), 'mean_abn_net_cost': float(abn.mean() - ea.COST_RT),
                'mean_gap': float(np.mean([r['gap'] for r in ss]))})
    ok = [r for r in ss if not np.isnan(r['rv_pre']) and not np.isnan(r['ret5']) and not np.isnan(r['cal5'])]
    if len(ok) >= 3:
        mg = [r['month'] for r in ok]
        out['opt_n'] = len(ok)
        for m, key in ((1.0, '10'), (1.3, '13')):
            rat = put_ev(ok, m)
            out[f'ev{key}'] = float(rat.mean())
            out[f'ev{key}_lo'], out[f'ev{key}_hi'] = ea.block_boot_ci(rat, mg)
            out[f'ev{key}_pwin'] = float((rat > 1).mean())
            okr = [r for r in ok if not np.isnan(r['rv_incl'])]
            out[f'ev{key}_sens'] = float(put_ev(okr, m, 'rv_incl').mean())
        evs = {m: float(put_ev(ok, m).mean()) for m in cv.GRID}
        be = np.nan
        for a, b in zip(cv.GRID, cv.GRID[1:]):
            if evs[a] >= 1.0 > evs[b]:
                be = a + (evs[a] - 1.0) / (evs[a] - evs[b]) * (b - a)
        if evs[cv.GRID[0]] < 1.0:
            be = float('-inf')
        elif evs[cv.GRID[-1]] >= 1.0:
            be = float('inf')
        out['breakeven_iv_mult'] = be
    return out


def in_period(r, pname, lo, hi):
    if pname == 'last10y':
        return r['react_date'] >= date(2016, 11, 11)
    return lo <= r['year'] <= hi


def verdict(res):
    full, early, late = res['full'], res['2005-2009'], res['2010-2026']
    halves_ok = all(c.get('n', 0) >= 3 and c['mean_abn'] > 0 and c['t_cl'] > 2 for c in (early, late))
    ev_ok = full.get('ev10', 0) > 1 and full.get('ev10_lo', 0) > 1
    if halves_ok and ev_ok:
        return 'CONFIRMED'
    if full['mean_abn'] <= 0 or abs(full['t_cl']) < 1 or late.get('n', 0) < 3 or late['mean_abn'] <= 0:
        return 'REJECTED'
    return 'WEAK'


def run(cache, out_csv):
    cikmap = json.loads((cache / 'ciks.json').read_text())
    for t in C1_25:
        if sorted(cikmap[t]) != sorted(ORIG_CIKS[t]):
            print(f'note: {t} CIKs now {cikmap[t]} vs C1 {ORIG_CIKS[t]}')
    # reproduction gate: C1's 25-name map, bars cut at the review's last bar
    rep = [r for r in rows_for(cache, ORIG_CIKS, REPRO_CUT) if r['gap'] <= -0.08]
    s = cell(rep)
    got = {'n': s['n'], 'hit_rate': s['hit_rate'], 'mean_abn': s['mean_abn'], 't_cl': s['t_cl'], 'opt_ev': s['ev13']}
    print('reproduction (C1 25, bars to 2026-10-23):', {k: round(v, 5) for k, v in got.items()})
    for k, v in EXPECT.items():
        if abs(got[k] - v) > (0 if k == 'n' else 6e-5):
            sys.exit(f'reproduction failed: {k} {got[k]} vs {v}')

    rows = rows_for(cache, {t: cikmap[t] for t in FETCH})
    down = [r for r in rows if r['gap'] <= -0.08]
    groups = {'top100': set(TOP100), 'new76': set(NEW), 'overlap24': set(OVERLAP), 'c1_25': set(C1_25)}
    out, res = [], {}
    for variant, base_sel in (('primary', down), ('earnings_only', [r for r in down if not r['interim']])):
        for gname, tks in groups.items():
            for pname, lo, hi in PERIODS:
                c = cell([r for r in base_sel if r['ticker'] in tks and in_period(r, pname, lo, hi)])
                res[(variant, gname, pname)] = c
                out.append({'variant': variant, 'universe': gname, 'period': pname, **c})
    for variant in ('primary', 'earnings_only'):
        for gname in groups:
            v = verdict({p: res[(variant, gname, p)] for p, _, _ in PERIODS})
            alt_ok = all(res[(variant, gname, p)].get('n', 0) >= 3 and res[(variant, gname, p)]['mean_abn'] > 0
                         and res[(variant, gname, p)]['t_cl'] > 2 for p in ('2005-2014', '2015-2026'))
            for r in out:
                if r['variant'] == variant and r['universe'] == gname:
                    r['verdict_v1_rule'] = v
                    r['halves_2005_14_2015_26_pass'] = alt_ok
    # candidates per year (every down gap <= -8% with a gap; 5-day return not required)
    cand = {}
    for gname in ('top100', 'new76', 'c1_25'):
        by = {y: 0 for y in range(2005, 2027)}
        for r in down:
            if r['ticker'] in groups[gname]:
                by[r['year']] += 1
        cand[gname] = by
        out.append({'variant': 'candidates', 'universe': gname, 'period': 'per year 2005-2025 mean',
                    'n': float(np.mean([by[y] for y in range(2005, 2026)]))})
        out.append({'variant': 'candidates', 'universe': gname, 'period': 'per year 2021-2025 mean',
                    'n': float(np.mean([by[y] for y in range(2021, 2026)]))})
        out.append({'variant': 'candidates', 'universe': gname, 'period': '2026 to 11-10', 'n': by[2026]})

    cols = ['variant', 'universe', 'period', 'n', 'n_tickers', 'n_months', 'hits', 'hit_rate', 'mean_signed_ex',
            't_cl_signed_ex', 'mean_abn', 'median_abn', 't_cl', 'ci_lo', 'ci_hi', 'worst_abn', 'mean_abn_net_cost',
            'mean_gap', 'opt_n', 'ev10', 'ev10_lo', 'ev10_hi', 'ev10_pwin', 'ev10_sens', 'ev13', 'ev13_lo', 'ev13_hi',
            'ev13_pwin', 'ev13_sens', 'breakeven_iv_mult', 'verdict_v1_rule', 'halves_2005_14_2015_26_pass']
    with out_csv.open('w', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction='ignore')
        w.writeheader()
        for r in out:
            w.writerow({k: (f'{v:.5f}' if isinstance(v, float) else v) for k, v in r.items() if k in cols})

    show = ['n', 'n_tickers', 'hit_rate', 'mean_signed_ex', 't_cl_signed_ex', 'mean_abn', 't_cl', 'mean_abn_net_cost',
            'ev10', 'ev10_lo', 'ev10_hi', 'ev13', 'ev13_lo', 'ev13_hi', 'ev10_sens', 'ev13_sens', 'breakeven_iv_mult',
            'verdict_v1_rule', 'halves_2005_14_2015_26_pass']
    for r in out:
        print(r['variant'], r['universe'], r['period'], '|',
              {k: (round(r[k], 4) if isinstance(r.get(k), float) else r.get(k)) for k in show if k in r})
    for gname, by in cand.items():
        print('candidates', gname, by)
    # context: timing check and the names that contribute most down gaps
    allr = [r for r in rows if r['ticker'] in groups['new76']]
    print('new76 timing check: median |reaction-day move|', round(float(np.median([abs(r['gap']) for r in allr])), 4),
          'median |next-day move|', round(float(np.nanmedian([abs(r.get('day1', np.nan)) for r in allr])), 4),
          'events', len(allr))
    cnt = {}
    for r in down:
        if r['ticker'] in groups['top100']:
            cnt[r['ticker']] = cnt.get(r['ticker'], 0) + 1
    print('down-gap events by ticker (top100):', sorted(cnt.items(), key=lambda kv: -kv[1]))
    print('top100 names with no down gap <= -8%:', [t for t in TOP100 if t not in cnt])


# ------------------------------------------------------------------ main
def main():
    mode, cache = sys.argv[1], Path(sys.argv[2])
    if mode == 'fetch':
        fetch(cache)
    elif mode == 'coverage':
        coverage(cache)
    elif mode == 'run':
        run(cache, Path(sys.argv[3]))
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main()
