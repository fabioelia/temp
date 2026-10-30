"""Claim E2 (Wikipedia attention spikes), alternative-data review, per ../../strategy-review/PROTOCOL.md and ../claims.md.

Run:  python3 -I wiki_analysis.py <alt_cache_dir> <earnings_cache_dir> <out_csv> [<events_csv>]
      alt_cache_dir: what wiki_fetch.py filled (wiki/, wiki_yahoo/). earnings_cache_dir: the strategy review's cached
      SEC submissions (strategy-data/earnings, sec/). Reads only cached raw JSON, no network.

Claim (claims.md): the 25 mega-caps' company articles, 2015-07 to 2026-10. Abnormal attention = views / trailing 60-day
median; spike = top 5% of each stock's own history. Outcome: next 5- and 20-session return beyond SPY, plus the next
5-session realized vol vs the prior RV20. All spikes and spikes away from earnings (excluding +/-3 sessions of an 8-K 2.02).
Splits 2015-2020 vs 2021-2026. Options: delta-0.35 call and put held 5 sessions at RV20 x 1.1.
Claimed sign (Da, Engelberg & Gao 2011): attention spikes are followed by HIGHER returns (price pressure over ~2 weeks,
reversal within the year), so the claimed sign is positive at 5 and at 20 sessions (cumulative); the call is the
claim-direction option.

Implementation choices FIXED BEFORE ANY RESULT WAS COMPUTED (2026-10-30 ~18:40 ET). claims.md leaves these open:
  Attention series
    * Wikimedia per-article daily views, en.wikipedia, all-access, agent=user (spiders excluded), UTC days.
    * Renamed articles: views of every title that served as the company's article are summed by day (a title missing on
      a day counts 0). After a page move the old title is a redirect whose views are not credited to the new title, so
      the sum is the continuous total. The title chains are in TITLES (checked for level breaks before any outcome).
    * A day with a summed total of 0 is missing. Ratio_D = views_D / median(views over D-60 .. D-1); needs >= 50 valid
      days in that window and a median > 0.
    * Spike: Ratio_D >= the 95th percentile of the stock's own Ratio over its whole valid history (as claims.md states;
      the threshold therefore uses the full sample. The real-time version is a post-hoc row).
  Timing (no look-ahead)
    * Day D (UTC) ends at 19:00/20:00 ET on calendar date D. Entry = close of the first session dated AFTER D (a 14:43 ET
      decision the next session can see D's count). Fri/Sat/Sun spikes all enter Monday: one event per (ticker, entry
      session), keeping the largest ratio. Sessions = SPY's Yahoo calendar.
  Earnings cut
    * Every 8-K (not 8-K/A) with item 2.02 from the cached SEC submissions, including predecessor CIKs (as in the
      strategy review). Reaction session: accepted >= 16:00 ET -> next session; < 09:30 -> that day if a session else the
      next; otherwise that day. No merging: any 2.02 counts.
    * Spike session = first session dated >= D. An event is 'near earnings' if any of its spike days has a spike session
      within +/-3 sessions of a 2.02 reaction session. 'Away from earnings' = the rest.
  Returns and baseline
    * Yahoo adjusted closes on SPY's calendar. Excess return over h sessions from the entry close = stock - SPY.
    * 'All days' = every session that could be an entry (the ticker's Ratio is defined on the calendar day before it).
      Baseline = mean h-session excess return of the same ticker over all days of the same calendar year.
      Abnormal = excess - baseline. Hit = excess > 0. Costs: 10 bps round trip for large caps.
    * t_iid and t_cl (cluster-robust): clusters = entry calendar month for 5-session outcomes, calendar quarter for
      20-session outcomes (20-session windows straddle adjacent months). 95% CI: cluster block bootstrap, 2000, seed 7.
  Volatility
    * RV20 = annualised stdev (ddof 1) of the 20 daily log returns ending at the entry close (what the options model
      uses). RV5 = sqrt(252 x mean of the 5 squared daily log returns after entry) (zero-mean: what an option holder
      earns gamma on). Test variable: log(RV5 / RV20) minus the same ticker-year all-days mean, t_cl by month.
    * Option-buyer check: share of events with RV5 > 1.1 x RV20, and mean of RV5^2 / (1.1 RV20)^2 (> 1 means realized
      variance beat the model's implied variance), for spikes and for all days.
  Options (Black-Scholes, r = 0, q = 0, no skew, no IV change: IV = 1.1 x RV20 at entry and exit)
    * Delta 0.35 call and put, 25 calendar DTE (inside the 21-35 rule; the same DTE as E1), held 5 sessions (T falls by
      calendar days). Pay half of a 3% spread each way: cost = model x 1.015, proceeds = model x 0.985.
      EV/$ = mean(proceeds / cost). Baseline: the same contract on all days. t_cl of (ratio - ticker-year all-days mean).
  Periods: full (2015-07 to 2026-10), 2015-2020, 2021-2026 (claims.md split; it plays the protocol's '2010-2026' role),
    last 10 years (entries from 2016-10-30).
  Verdict (PROTOCOL.md, made mechanical as in the strategy review), per return test:
    REJECTED  if full mean abnormal <= 0, or |t_cl| < 1, or the 2021-2026 mean <= 0 (only in early data).
    CONFIRMED if |t_cl| >= 2, the 2021-2026 mean >= half the full mean, mean - 10 bps > 0 and the call EV/$ > 1.0.
    WEAK      otherwise. |t| >= 3 'strong', 2-3 'suggestive'. The E2 headline is the 5-session test; 20 sessions is
              reported with its own verdict.
  Post-hoc rows (labelled 'post-hoc', declared here before any result, never used for a verdict):
    (a) episode onsets only (no spike for that ticker in the 5 calendar days before D);
    (b) real-time threshold: Ratio_D >= the 95th percentile of the stock's Ratio over days before D (>= 365 valid days);
    (c) the reversal leg: excess return from session +5 to +20 after entry.
"""
import bisect
import csv
import json
import math
import sys
import urllib.parse
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from statistics import NormalDist
from zoneinfo import ZoneInfo

import numpy as np

ET = ZoneInfo('America/New_York')
N = NormalDist()
HALF_SPREAD = 0.015
COST_RT = 0.0010
DTE, DELTA, IV_MULT = 25, 0.35, 1.1
START, END = date(2015, 7, 1), date(2026, 10, 30)
# Current title first, then predecessor titles (redirects after the move). Filled in from the continuity check.
TITLES = {"AAPL": ["Apple_Inc."], "MSFT": ["Microsoft"], "GOOGL": ["Alphabet_Inc."],
          "AMZN": ["Amazon_(company)", "Amazon.com"], "META": ["Meta_Platforms", "Facebook,_Inc."],
          "NVDA": ["Nvidia"], "TSLA": ["Tesla,_Inc.", "Tesla_Motors"], "NFLX": ["Netflix"],
          "AVGO": ["Broadcom", "Broadcom_Inc.", "Broadcom_Limited", "Avago_Technologies"], "INTC": ["Intel"],
          "AMD": ["AMD", "Advanced_Micro_Devices"], "ORCL": ["Oracle_Corporation"],
          "CRM": ["Salesforce", "Salesforce.com"], "ADBE": ["Adobe_Inc.", "Adobe_Systems"], "QCOM": ["Qualcomm"],
          "CSCO": ["Cisco", "Cisco_Systems"], "IBM": ["IBM"], "TXN": ["Texas_Instruments"],
          "MU": ["Micron_Technology"], "JPM": ["JPMorgan_Chase"], "BAC": ["Bank_of_America"], "XOM": ["ExxonMobil"],
          "CVX": ["Chevron_Corporation"], "WMT": ["Walmart"], "COST": ["Costco"]}
CIKS = {"AAPL": [320193], "MSFT": [789019], "GOOGL": [1652044, 1288776], "AMZN": [1018724], "META": [1326801],
        "NVDA": [1045810], "TSLA": [1318605], "NFLX": [1065280], "AVGO": [1730168, 1441634, 1649338], "INTC": [50863],
        "AMD": [2488], "ORCL": [1341439, 777676], "CRM": [1108524], "ADBE": [796343], "QCOM": [804328],
        "CSCO": [858877], "IBM": [51143], "TXN": [97476], "MU": [723125], "JPM": [19617], "BAC": [70858],
        "XOM": [2115436, 34088], "CVX": [93410], "WMT": [104169], "COST": [909832]}
PERIODS = [("full", START, END), ("2015-2020", START, date(2020, 12, 31)), ("2021-2026", date(2021, 1, 1), END),
           ("last10y", date(2016, 10, 30), END)]


# ------------------------------------------------------------------ data
def load_views(cache, titles):
    """Summed daily views by UTC date over the title chain; titles with no cached file are reported and skipped."""
    tot, used, missing = {}, [], []
    for t in titles:
        f = cache / 'wiki' / (urllib.parse.quote(t, safe='') + '.json')
        if not f.exists():
            missing.append(t)
            continue
        used.append(t)
        for it in json.loads(f.read_text()).get('items', []):
            d = datetime.strptime(it['timestamp'][:8], '%Y%m%d').date()
            tot[d] = tot.get(d, 0) + int(it['views'])
    return tot, used, missing


def load_prices(cache, sym):
    d = json.loads((cache / 'wiki_yahoo' / f'{sym}.json').read_text())['chart']['result'][0]
    out = {}
    for t, a in zip(d['timestamp'], d['indicators']['adjclose'][0]['adjclose']):
        if a is None or a <= 0:
            continue
        out[datetime.fromtimestamp(t, tz=timezone.utc).astimezone(ET).date()] = float(a)
    return out


def earnings_sessions(ecache, tk, sess_ord):
    """Reaction-session indices of every 8-K item 2.02 (no merging)."""
    out = set()
    for cik in CIKS[tk]:
        m = json.loads((ecache / 'sec' / f'CIK{cik:010d}.json').read_text())
        pages = [m['filings']['recent']] + [json.loads((ecache / 'sec' / f['name']).read_text())
                                            for f in m['filings'].get('files', [])]
        for p in pages:
            for i in range(len(p['form'])):
                if p['form'][i] != '8-K' or '2.02' not in (p['items'][i] or ''):
                    continue
                acc = datetime.strptime(p['acceptanceDateTime'][i][:19], '%Y-%m-%dT%H:%M:%S')
                acc = acc.replace(tzinfo=timezone.utc).astimezone(ET)
                if acc.date() < date(2015, 1, 1):
                    continue
                hm = acc.hour * 60 + acc.minute
                side = 'right' if hm >= 16 * 60 else 'left'
                k = int(np.searchsorted(sess_ord, acc.date().toordinal(), side=side))
                if k < len(sess_ord):
                    out.add(k)
    return sorted(out)


# ------------------------------------------------------------------ Black-Scholes (r = 0, q = 0), as the strategy review
def ncdf(x):
    return 0.5 * (1.0 + np.vectorize(math.erf)(np.asarray(x, float) / math.sqrt(2.0)))


def bs(S, K, T, sig, call):
    S, K, T, sig = (np.asarray(v, float) for v in (S, K, T, sig))
    T = np.maximum(T, 1e-6)
    sd = sig * np.sqrt(T)
    d1 = (np.log(S / K) + 0.5 * sd ** 2) / sd
    c = S * ncdf(d1) - K * ncdf(d1 - sd)
    return np.where(call, c, c - S + K)


def strike_for_delta(delta_abs, T, sig, call):
    target = np.where(call, delta_abs, 1.0 - delta_abs)
    d1 = np.vectorize(N.inv_cdf)(target)
    sd = sig * np.sqrt(T)
    return np.exp(-d1 * sd + 0.5 * sd ** 2)


def option_ratio(ret, cal_days, iv, call):
    T0 = DTE / 365.0
    K = strike_for_delta(DELTA, T0, iv, call)
    p0 = bs(1.0, K, T0, iv, call)
    p1 = bs(1.0 + ret, K, (DTE - cal_days) / 365.0, iv, call)
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
    return (m / se_iid if se_iid > 0 else float('nan'),
            m / se_cl if se_cl and se_cl > 0 else float('nan'))


def block_boot_ci(x, groups, reps=2000, seed=7):
    x = np.asarray(x, float)
    if len(x) < 3:
        return float('nan'), float('nan')
    rng = np.random.default_rng(seed)
    gl = sorted(set(groups))
    pos = {g: i for i, g in enumerate(gl)}
    sums, cnts = np.zeros(len(gl)), np.zeros(len(gl))
    for v, g in zip(x, groups):
        sums[pos[g]] += v
        cnts[pos[g]] += 1
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
    ok = abs(t) >= 2 and late['mean_abn'] >= 0.5 * m and m - COST_RT > 0 and ev is not None and ev > 1.0
    return 'CONFIRMED' if ok else 'WEAK'


# ------------------------------------------------------------------ main
def main():
    cache, ecache, out_csv = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    ev_csv = Path(sys.argv[4]) if len(sys.argv) > 4 else None
    spy_map = load_prices(cache, 'SPY')
    sessions = sorted(d for d in spy_map if START <= d <= END)
    sess_ord = np.array([d.toordinal() for d in sessions])
    nS = len(sessions)
    S = np.array([spy_map[d] for d in sessions])
    days = [START + timedelta(i) for i in range((END - START).days + 1)]

    def q_of(d):  # calendar quarter label
        return f'{d.year}Q{(d.month - 1) // 3 + 1}'

    allday, events, notes = [], [], []
    for tk, titles in TITLES.items():
        views, used, missing = load_views(cache, titles)
        notes.append((tk, used, missing))
        v = np.array([views.get(d, 0) for d in days], float)
        v[v <= 0] = np.nan
        ratio = np.full(len(days), np.nan)
        for i in range(60, len(days)):
            w = v[i - 60:i]
            w = w[~np.isnan(w)]
            if len(w) >= 50 and not np.isnan(v[i]):
                med = np.median(w)
                if med > 0:
                    ratio[i] = v[i] / med
        valid = ~np.isnan(ratio)
        thr = float(np.quantile(ratio[valid], 0.95))
        spike = valid & (ratio >= thr)
        # post-hoc (b): expanding real-time threshold, >= 365 prior valid days
        rt = np.zeros(len(days), bool)
        vals_sorted = []
        for i in range(len(days)):
            if valid[i]:
                if len(vals_sorted) >= 365:
                    k = (len(vals_sorted) - 1) * 0.95
                    lo, hi = int(math.floor(k)), int(math.ceil(k))
                    q = vals_sorted[lo] + (vals_sorted[hi] - vals_sorted[lo]) * (k - lo)
                    rt[i] = ratio[i] >= q
                bisect.insort(vals_sorted, ratio[i])
        # post-hoc (a): onset = no spike in the 5 calendar days before
        onset = np.array([spike[i] and not spike[max(0, i - 5):i].any() for i in range(len(days))])

        pm = load_prices(cache, tk)
        P = np.array([pm.get(d, np.nan) for d in sessions])
        earn = np.array(earnings_sessions(ecache, tk, sess_ord))
        lr = np.diff(np.log(P))  # lr[j] = log(P[j+1]/P[j])

        def entry_idx(d):
            return int(np.searchsorted(sess_ord, d.toordinal(), side='right'))

        def spike_sess(d):
            return int(np.searchsorted(sess_ord, d.toordinal(), side='left'))

        def near_earn(k):
            return bool(len(earn)) and bool((np.abs(earn - k) <= 3).any())

        def outcome(t):
            r = {}
            for h in (5, 20):
                if t + h < nS and not np.isnan(P[t]) and not np.isnan(P[t + h]):
                    r[f'ex{h}'] = (P[t + h] / P[t] - 1) - (S[t + h] / S[t] - 1)
                else:
                    r[f'ex{h}'] = np.nan
            r['ex5_20'] = np.nan if np.isnan(r['ex20']) or np.isnan(P[t + 5]) else \
                (P[t + 20] / P[t + 5] - 1) - (S[t + 20] / S[t + 5] - 1)
            r['ret5'] = P[t + 5] / P[t] - 1 if t + 5 < nS else np.nan
            r['cal5'] = (sessions[t + 5] - sessions[t]).days if t + 5 < nS else np.nan
            w = lr[t - 20:t] if t >= 20 else np.array([np.nan])
            r['rv20'] = float(np.std(w, ddof=1) * math.sqrt(252)) if len(w) == 20 and not np.isnan(w).any() else np.nan
            w5 = lr[t:t + 5] if t + 5 < nS else np.array([np.nan])
            r['rv5'] = float(math.sqrt(252 * np.mean(w5 ** 2))) if len(w5) == 5 and not np.isnan(w5).any() else np.nan
            return r

        # all days: sessions whose previous calendar day has a valid ratio
        day_idx = {d: i for i, d in enumerate(days)}
        ev_by_t = {}
        for i, d in enumerate(days):
            if not (spike[i] or rt[i]):
                continue
            t = entry_idx(d)
            if t >= nS:
                continue
            e = ev_by_t.setdefault(t, {'spike': False, 'rt': False, 'onset': False, 'near': False, 'ratio': 0.0,
                                       'spike_days': []})
            if spike[i]:
                e['spike'] = True
                e['onset'] |= bool(onset[i])
                e['near'] |= near_earn(spike_sess(d))
                e['ratio'] = max(e['ratio'], float(ratio[i]))
                e['spike_days'].append(d)
            if rt[i]:
                e['rt'] = True
                e['near_rt'] = e.get('near_rt', False) or near_earn(spike_sess(d))
        for t in range(nS):
            pd = sessions[t] - timedelta(1)
            i = day_idx.get(pd)
            if i is None or not valid[i] or np.isnan(P[t]):
                continue
            r = {'ticker': tk, 'entry': sessions[t], 'year': sessions[t].year,
                 'month': sessions[t].strftime('%Y-%m'), 'quarter': q_of(sessions[t])}
            r.update(outcome(t))
            allday.append(r)
            if t in ev_by_t:
                e = dict(r)
                e.update(ev_by_t[t])
                e['threshold'] = thr
                events.append(e)
        notes[-1] = notes[-1] + (thr, int(spike.sum()), int(valid.sum()))

    # ---------------- ticker-year baselines over all days
    def add_base(key, vals_fn):
        acc = {}
        for r in allday:
            x = vals_fn(r)
            if not np.isnan(x):
                acc.setdefault((r['ticker'], r['year']), []).append(x)
        return {k: float(np.mean(v)) for k, v in acc.items() if len(v) > 20}

    def lvol(r):
        return math.log(r['rv5'] / r['rv20']) if r['rv5'] > 0 and r['rv20'] > 0 else np.nan

    for r in allday:
        r['lvol'] = lvol(r) if not (np.isnan(r['rv5']) or np.isnan(r['rv20'])) else np.nan
        if not (np.isnan(r['ret5']) or np.isnan(r['rv20'])):
            iv = IV_MULT * r['rv20']
            r['call'] = float(option_ratio(np.array([r['ret5']]), np.array([r['cal5']]), np.array([iv]),
                                           np.array([True]))[0])
            r['put'] = float(option_ratio(np.array([r['ret5']]), np.array([r['cal5']]), np.array([iv]),
                                          np.array([False]))[0])
        else:
            r['call'] = r['put'] = np.nan
    base = {k: add_base(k, (lambda kk: lambda r: r[kk])(k)) for k in ('ex5', 'ex20', 'ex5_20', 'lvol', 'call', 'put')}
    allmap = {(r['ticker'], r['entry']): r for r in allday}
    for e in events:
        a = allmap[(e['ticker'], e['entry'])]
        for k in ('lvol', 'call', 'put'):
            e[k] = a[k]

    rows = []

    def stats_block(sel_all, key, cl):
        """sel_all: list of records. Returns stats for key with abnormal vs ticker-year baseline."""
        recs = [r for r in sel_all if not np.isnan(r[key]) and not np.isnan(base[key].get((r['ticker'], r['year']),
                                                                                         np.nan))]
        n = len(recs)
        if n == 0:
            return {'n': 0}
        x = np.array([r[key] for r in recs])
        abn = x - np.array([base[key][(r['ticker'], r['year'])] for r in recs])
        g = [r[cl] for r in recs]
        ti, tc = cluster_t(abn, g)
        lo, hi = block_boot_ci(abn, g)
        return {'n': n, 'n_tickers': len({r['ticker'] for r in recs}), 'mean': float(x.mean()),
                'median': float(np.median(x)), 'hit_rate': float((x > 0).mean()), 'mean_abn': float(abn.mean()),
                'median_abn': float(np.median(abn)), 't_iid': ti, 't_cl': tc, 'ci_lo': lo, 'ci_hi': hi,
                'worst': float(x.min()), 'worst_abn': float(abn.min()), 'clusters': len(set(g)), '_recs': recs}

    def plain(sel, key):
        x = np.array([r[key] for r in sel if not np.isnan(r[key])])
        if len(x) == 0:
            return {}
        return {'n': len(x), 'mean': float(x.mean()), 'median': float(np.median(x)), 'hit_rate': float((x > 0).mean())}

    def run_test(name, label, filt):
        res = {}
        for pname, a, b in PERIODS:
            sel = [e for e in events if filt(e) and a <= e['entry'] <= b]
            alls = [r for r in allday if a <= r['entry'] <= b]
            for key, h, cl, metric in (('ex5', 5, 'month', 'excess return'), ('ex20', 20, 'quarter', 'excess return'),
                                       ('ex5_20', 15, 'quarter', 'excess return +5..+20')):
                if key == 'ex5_20' and label != 'post-hoc':
                    continue
                st = stats_block(sel, key, cl)
                bl = plain([r for r in alls if not np.isnan(base[key].get((r['ticker'], r['year']), np.nan))], key)
                row = {'claim': 'E2', 'test': name, 'label': label, 'metric': metric, 'horizon': h, 'period': pname,
                       'cluster': cl}
                row.update({k: v for k, v in st.items() if not k.startswith('_')})
                row.update({'base_n': bl.get('n'), 'base_mean': bl.get('mean'), 'base_median': bl.get('median'),
                            'base_hit_rate': bl.get('hit_rate')})
                if st['n']:
                    row['mean_abn_net_cost'] = st['mean_abn'] - COST_RT
                res[(pname, key)] = row
                rows.append(row)
            # volatility (5 sessions)
            st = stats_block(sel, 'lvol', 'month')
            row = {'claim': 'E2', 'test': name, 'label': label, 'metric': 'log(RV5/RV20)', 'horizon': 5,
                   'period': pname, 'cluster': 'month'}
            row.update({k: v for k, v in st.items() if not k.startswith('_') and k != 'hit_rate'})
            if st['n']:
                recs = st['_recs']
                rv5 = np.array([r['rv5'] for r in recs])
                rv20 = np.array([r['rv20'] for r in recs])
                ba = [r for r in alls if not np.isnan(r['lvol'])]
                b5 = np.array([r['rv5'] for r in ba])
                b20 = np.array([r['rv20'] for r in ba])
                row.update({'rv5_mean': rv5.mean(), 'rv20_mean': rv20.mean(),
                            'ratio_median': float(np.median(rv5 / rv20)),
                            'share_rv5_gt_1.1rv20': float((rv5 > IV_MULT * rv20).mean()),
                            'var_ratio_vs_1.1rv20': float(np.mean(rv5 ** 2 / (IV_MULT * rv20) ** 2)),
                            'base_n': len(ba), 'base_mean': float(np.mean(np.log(b5 / b20))),
                            'base_ratio_median': float(np.median(b5 / b20)),
                            'base_share_rv5_gt_1.1rv20': float((b5 > IV_MULT * b20).mean()),
                            'base_var_ratio_vs_1.1rv20': float(np.mean(b5 ** 2 / (IV_MULT * b20) ** 2))})
            rows.append(row)
            # options
            for key in ('call', 'put'):
                st = stats_block(sel, key, 'month')
                bl = plain([r for r in alls if not np.isnan(base[key].get((r['ticker'], r['year']), np.nan))], key)
                row = {'claim': 'E2', 'test': name, 'label': label,
                       'metric': f'option EV/$: {key} d{DELTA} {DTE}DTE IV {IV_MULT}xRV20, 5 sessions, 3% spread',
                       'horizon': 5, 'period': pname, 'cluster': 'month'}
                row.update({k: v for k, v in st.items() if not k.startswith('_') and k != 'hit_rate'})
                if st['n']:
                    x = np.array([r[key] for r in st['_recs']])
                    row['p_win'] = float((x > 1).mean())
                bx = np.array([r[key] for r in alls if not np.isnan(r[key])])
                row.update({'base_n': bl.get('n'), 'base_mean': bl.get('mean'), 'base_median': bl.get('median'),
                            'base_p_win': float((bx > 1).mean()) if len(bx) else None})
                res[(pname, key)] = row
                rows.append(row)
        # verdicts
        if label != 'post-hoc':
            ev = res[('full', 'call')].get('mean')
            for key in ('ex5', 'ex20'):
                v = verdict(res[('full', key)], res[('2021-2026', key)], ev)
                for pname, _, _ in PERIODS:
                    res[(pname, key)]['verdict'] = v
        else:
            for k, r in res.items():
                r['verdict'] = 'post-hoc (no verdict)'

    run_test('all spikes (top 5% of own ratio history)', 'pre-registered', lambda e: e['spike'])
    run_test('spikes away from earnings (no 8-K 2.02 within +/-3 sessions)', 'pre-registered',
             lambda e: e['spike'] and not e['near'])
    run_test('post-hoc (a): spike episode onsets only', 'post-hoc', lambda e: e['spike'] and e['onset'])
    run_test('post-hoc (b): real-time expanding 95th pct threshold', 'post-hoc', lambda e: e['rt'])
    run_test('post-hoc (b): real-time threshold, away from earnings', 'post-hoc',
             lambda e: e['rt'] and not e.get('near_rt', False))

    cols = ['claim', 'test', 'label', 'metric', 'horizon', 'period', 'n', 'n_tickers', 'clusters', 'cluster', 'mean',
            'median', 'hit_rate', 'base_n', 'base_mean', 'base_median', 'base_hit_rate', 'mean_abn', 'median_abn',
            't_iid', 't_cl', 'ci_lo', 'ci_hi', 'worst', 'worst_abn', 'mean_abn_net_cost', 'p_win', 'base_p_win', 'rv5_mean',
            'rv20_mean', 'ratio_median', 'base_ratio_median', 'share_rv5_gt_1.1rv20', 'base_share_rv5_gt_1.1rv20',
            'var_ratio_vs_1.1rv20', 'base_var_ratio_vs_1.1rv20', 'verdict']
    with out_csv.open('w', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction='ignore')
        w.writeheader()
        for r in rows:
            w.writerow({k: (f'{v:.5f}' if isinstance(v, (float, np.floating)) else v) for k, v in r.items()
                        if k in cols})
    if ev_csv:
        keys = ['ticker', 'entry', 'spike_days', 'ratio', 'threshold', 'spike', 'onset', 'near', 'rt', 'ex5', 'ex20',
                'rv20', 'rv5', 'call', 'put']
        with ev_csv.open('w', newline='') as fh:
            w = csv.DictWriter(fh, fieldnames=keys, extrasaction='ignore')
            w.writeheader()
            for e in events:
                w.writerow({k: (';'.join(str(x) for x in e[k]) if k == 'spike_days' else
                                (f'{e[k]:.5f}' if isinstance(e.get(k), float) else e.get(k))) for k in keys})
    for tk, used, missing, thr, nsp, nval in notes:
        print(f'{tk:5s} titles={used} missing={missing} p95={thr:.2f} spike_days={nsp} valid_days={nval}')
    print('events:', sum(e['spike'] for e in events), 'away:', sum(e['spike'] and not e['near'] for e in events),
          'all days:', len(allday))


if __name__ == '__main__':
    main()
