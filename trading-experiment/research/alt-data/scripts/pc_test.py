#!/usr/bin/env python3
"""E3: Cboe put/call ratio as a contrarian indicator (alt-data claims, pre-registered 2026-10-30).

  python3 -I pc_test.py            (after pc_fetch.py)

Registered test (claims.md E3): Cboe equity P/C (equitypc.csv) and total P/C (totalpc.csv), with SPY. Signal: the 10-day average of
P/C in its top 10% of the trailing 252 days (bullish, contrarian); the bottom 10% is the bearish variant. Outcome: the next 5/10/21-session
SPY return against all days. Splits: first vs second half of the available history. Options: SPY 30 DTE delta-0.40 calls at VIX and at
0.72x VIX.

Choices not fixed by claims.md, written here before any result was computed (2026-10-30):
  * MA10_t = mean of the last 10 daily Cboe P/C prints through day t (end-of-day values). Rank_t = share of the 251 other MA10 values on
    days t-251..t-1 that are below MA10_t. High = rank >= 0.90, low = rank <= 0.10. Eligible once 252 MA10 values exist.
  * Equity P/C is the primary series (the claim's signal); total P/C gets the identical test, reported alongside.
  * Outcome: SPY adjusted close t -> t+h, simple return, h = 5, 10, 21. Entry at the close of the signal day (claim as stated).
  * Baseline = all eligible days of the same period and horizon. t = Newey-West (Bartlett, lag 2h) on b from OLS of the forward return on
    [1, signal dummy]; b = signal days minus other days, and diff vs all = (1 - share of signal days) x b, so the t is the same.
  * Costs: 5 bps per SPY round trip, charged to the signal trade only (conservative). Episodes = runs of signal days, merged across gaps
    of 5 sessions or fewer.
  * Periods: full; first and second half of the eligible days (split at the middle eligible day); pre-2010; 2010-2019 (the protocol's
    2010-2026 split: the archive ends 2019-10-04); last 10 years (2016-10-29 on, about 3 years of data).
  * Options: SPY unadjusted close, IV = VIX/100 x {1.00, 0.72}, r = ^IRX, q = SPY trailing 365-day dividends / close (back-filled),
    expiry = last trading day on or before entry + 30 calendar days, buy mid x 1.015, sell mid x 0.985. Horizons: 10 sessions (primary,
    as in D1), 5 sessions, and held to expiry. EV/$ on signal days vs all days of the same sample, NW lag 2h (expiry: 42).
  * Verdict (primary = equity P/C, 10 sessions; claimed sign: high -> diff > 0, low -> diff < 0):
      CONFIRMED: right sign with |t| >= 2 in the full sample; the second half AND 2010-2019 keep the sign with >= half the full-sample diff;
                 the diff net of costs keeps the sign; options gate: 10-session 0.40-delta call EV/$ on high days > 1.0 at both VIX and
                 0.72x VIX (bullish claim).
      WEAK: right sign with 1 <= |t| < 2, or decayed, or fails the options gate.
      REJECTED: |t| < 1 (no effect, as in the D tests), wrong sign, or the effect lives only in the first half / pre-2010.
    5/21-session horizons and total P/C are consistency checks reported with the verdict.
  * Not in claims.md, labelled post_hoc in the CSV (specified before results, but unregistered): (a) the bearish variant through a 30 DTE
    0.40-delta put; (b) the signal lagged one session (MA10 through t-1, entry at close t), because our decisions are at 14:43 ET and the
    day's P/C is final only after the close.
"""
import csv
import math
import sys
from datetime import date, timedelta

sys.dont_write_bytecode = True
import numpy as np  # noqa: E402

sys.path.insert(0, '/home/user/temp/trading-experiment/research/strategy-review/scripts')
import options_lib as L  # noqa: E402  (Black-Scholes, delta strikes, Newey-West: shared with the D1-D4 tests)

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/alt-data'
OUT = '/home/user/temp/trading-experiment/research/alt-data/putcall-results.csv'
H = (5, 10, 21)
COST = 0.0005
ROWS = []


# ------------------------------------------------------------------ data
def load_pc(name):
    rows = list(csv.reader(open(f'{CACHE}/cboe/{name}.csv')))
    hdr = [i for i, r in enumerate(rows) if r and r[0].strip().upper() == 'DATE'][0]
    assert rows[hdr][4].strip().upper() == 'P/C RATIO', rows[hdr]
    out = {}
    for r in rows[hdr + 1:]:
        if r and r[0].strip():
            m, d, y = (int(x) for x in r[0].strip().split('/'))
            out[date(y, m, d)] = float(r[4])
    return out


def load_y(name, col='close'):
    return {date.fromisoformat(r['date']): float(r[col]) for r in csv.DictReader(open(f'{CACHE}/yahoo/{name}.csv'))
            if float(r[col]) > 0}


def signal(pc, lag=0):
    """Return dict date -> (ma10, rank) on P/C dates; lag=1 uses MA10 through the previous session."""
    ds = sorted(pc)
    v = np.array([pc[d] for d in ds])
    ma = np.full(len(v), np.nan)
    for i in range(9, len(v)):
        ma[i] = v[i - 9:i + 1].mean()
    out = {}
    for i in range(len(v)):
        j = i - lag
        if j - 251 < 9 or j < 0:
            continue
        w = ma[j - 251:j]  # the 251 values before day j
        out[ds[i]] = (ma[j], float((w < ma[j]).mean()))
    return out


# ------------------------------------------------------------------ stats
def dummy_t(y, x, lag):
    X = np.column_stack([np.ones(len(y)), x.astype(float)])
    b, t = L.hac_ols(y, X, lag)
    return float(b[1]), float(t[1])


def episodes(mask, gap=5):
    idx = np.flatnonzero(mask)
    if len(idx) == 0:
        return 0
    return int(1 + (np.diff(idx) > gap + 1).sum())


def row(**k):
    base = dict(series='', signal='', test='', instrument='', horizon='', period='', n_signal='', n_all='', episodes='',
                mean_signal='', median_signal='', hit_signal='', worst_signal='', mean_all='', diff_vs_all='', diff_net_cost='',
                b_vs_others='', t_nw='', post_hoc='no', note='')
    base.update(k)
    ROWS.append(base)
    return base


def periods(dates):
    elig = sorted(dates)
    mid = elig[len(elig) // 2]
    return [('full', date(1900, 1, 1), date(2100, 1, 1)),
            (f'first half (<{mid})', date(1900, 1, 1), mid),
            (f'second half (>={mid})', mid, date(2100, 1, 1)),
            ('pre-2010', date(1900, 1, 1), date(2010, 1, 1)),
            ('2010-2019', date(2010, 1, 1), date(2100, 1, 1)),
            ('last10y (2016-10-29..2019-10)', date(2016, 10, 29), date(2100, 1, 1))]


# ------------------------------------------------------------------ main
def main():
    spy_adj = load_y('SPY', 'adjclose')
    spy = load_y('SPY', 'close')
    vix = load_y('VIX')
    irx = load_y('IRX')
    divs = sorted((date.fromisoformat(r['date']), float(r['dividend'])) for r in csv.DictReader(open(f'{CACHE}/yahoo/SPY_div.csv')))
    sd = sorted(spy)
    pos = {d: i for i, d in enumerate(sd)}
    A = np.array([spy_adj[d] for d in sd])
    S = np.array([spy[d] for d in sd])
    iv0 = L.ffill_on(sd, vix) / 100.0
    r = L.ffill_on(sd, irx) / 100.0
    q = L.div_yield(sd, S, divs)
    ex = L.expiry_index(sd)

    # option EV/$ per entry index, cached by (kind, ivmult, horizon)
    opt_cache = {}

    def opt(kind, mult, hz, idx):
        key = (kind, mult, hz)
        if key not in opt_cache:
            n = len(sd)
            ok = np.array([ex[i] > 0 and (hz == 'exp' or i + hz < ex[i]) for i in range(n)])
            ii = np.flatnonzero(ok)
            e = ex[ii]
            iv = iv0 * mult
            T0 = np.array([(sd[j] - sd[i]).days / 365.0 for i, j in zip(ii, e)])
            K = L.strike_for_delta(S[ii], T0, iv[ii], r[ii], q[ii], 0.40, kind)
            m0 = L.bs(S[ii], K, T0, iv[ii], r[ii], q[ii], kind)
            if hz == 'exp':
                x, T1 = e, np.zeros(len(ii))
            else:
                x = ii + hz
                T1 = np.array([(sd[j] - sd[k]).days / 365.0 for k, j in zip(x, e)])
            m1 = L.bs(S[x], K, T1, iv[x], r[x], q[x], kind)
            val = np.full(n, np.nan)
            val[ii] = m1 * (1 - L.HALF_SPREAD) / (m0 * (1 + L.HALF_SPREAD))
            opt_cache[key] = val
        return opt_cache[key][idx]

    for series in ('equitypc', 'totalpc'):
        pc = load_pc(series)
        for lag in (0, 1):
            sig = signal(pc, lag)
            dts = [d for d in sorted(sig) if d in pos]
            idx = np.array([pos[d] for d in dts])
            rank = np.array([sig[d][1] for d in dts])
            hi, lo = rank >= 0.90, rank <= 0.10
            pers = periods(dts)
            post = 'no' if lag == 0 else 'yes'
            lagnote = '' if lag == 0 else 'signal lagged 1 session (MA10 through t-1); unregistered, specified before results'
            if lag == 0:
                print(f'{series}: eligible {dts[0]}..{dts[-1]} n {len(dts)}; high {hi.sum()} ({hi.mean():.1%}), low {lo.sum()} ({lo.mean():.1%})')
            for h in H:
                ok = idx + h < len(sd)
                fwd = np.where(ok, A[np.minimum(idx + h, len(sd) - 1)] / A[idx] - 1, np.nan)
                for pname, a, b in pers:
                    pm = np.array([a <= d < b for d in dts]) & ok
                    y = fwd[pm]
                    for sname, msk in (('high P/C (top 10%)', hi), ('low P/C (bottom 10%)', lo)):
                        m = msk[pm]
                        if m.sum() < 3:
                            continue
                        bb, t = dummy_t(y, m, 2 * h)
                        ys = y[m]
                        row(series=series, signal=sname, test='SPY fwd return', instrument='SPY', horizon=f'{h}d', period=pname,
                            n_signal=int(m.sum()), n_all=len(y), episodes=episodes(m), mean_signal=ys.mean(),
                            median_signal=float(np.median(ys)), hit_signal=float((ys > 0).mean()), worst_signal=float(ys.min()),
                            mean_all=y.mean(), diff_vs_all=ys.mean() - y.mean(), diff_net_cost=ys.mean() - COST - y.mean(),
                            b_vs_others=bb, t_nw=t, post_hoc=post, note=lagnote)
            # options translation (equity and total, both lags)
            specs = [('C', 'high P/C (top 10%)', hi, 'no'), ('C', 'low P/C (bottom 10%)', lo, 'no'),
                     ('P', 'low P/C (bottom 10%)', lo, 'yes')]
            for kind, sname, msk, ph in specs:
                ph = 'yes' if (ph == 'yes' or lag == 1) else 'no'
                note = lagnote
                if kind == 'P':
                    note = (note + '; ' if note else '') + 'bearish variant via 0.40-delta put; unregistered, specified before results'
                for mult in (1.00, 0.72):
                    for hz in (10, 5, 'exp'):
                        val = opt(kind, mult, hz, idx)
                        lagw = 42 if hz == 'exp' else 2 * hz
                        for pname, a, b in pers:
                            pm = np.array([a <= d < b for d in dts]) & ~np.isnan(val)
                            y = val[pm]
                            m = msk[pm]
                            if m.sum() < 3:
                                continue
                            bb, t = dummy_t(y, m, lagw)
                            ys = y[m]
                            row(series=series, signal=sname, test=f'options EV/$ at {mult:.2f}x VIX',
                                instrument=f'SPY 30DTE 0.40d {"call" if kind == "C" else "put"}',
                                horizon=('expiry' if hz == 'exp' else f'{hz}d'), period=pname, n_signal=int(m.sum()), n_all=len(y),
                                episodes=episodes(m), mean_signal=ys.mean(), median_signal=float(np.median(ys)),
                                hit_signal=float((ys > 1).mean()), worst_signal=float(ys.min()), mean_all=y.mean(),
                                diff_vs_all=ys.mean() - y.mean(), b_vs_others=bb, t_nw=t, post_hoc=ph, note=note)

    with open(OUT, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(ROWS[0]))
        w.writeheader()
        for rr in ROWS:
            w.writerow({k: (f'{v:.5f}' if isinstance(v, float) and not math.isnan(v) else ('' if isinstance(v, float) else v))
                        for k, v in rr.items()})
    print(f'wrote {len(ROWS)} rows to {OUT}')

    # ------------------------------------------------------------------ verdict (registered rows only)
    def get(series, sname, test, hz, pstart):
        return [x for x in ROWS if x['series'] == series and x['signal'] == sname and x['test'] == test and x['horizon'] == hz
                and x['period'].startswith(pstart) and x['post_hoc'] == 'no'][0]

    for sname, sign in (('high P/C (top 10%)', 1), ('low P/C (bottom 10%)', -1)):
        f = get('equitypc', sname, 'SPY fwd return', '10d', 'full')
        s2 = get('equitypc', sname, 'SPY fwd return', '10d', 'second half')
        p10 = get('equitypc', sname, 'SPY fwd return', '10d', '2010-2019')
        d, t = f['diff_vs_all'] * sign, f['t_nw'] * sign
        keep = all(x['diff_vs_all'] * sign >= 0.5 * d for x in (s2, p10)) if d > 0 else False
        net = f['diff_net_cost'] * sign > 0 if sign > 0 else (f['diff_vs_all'] + COST) * sign > 0
        if sign > 0:
            g = [get('equitypc', sname, f'options EV/$ at {m:.2f}x VIX', '10d', 'full')['mean_signal'] for m in (1.0, 0.72)]
            gate = all(x > 1.0 for x in g)
        else:
            g, gate = [], None
        if d <= 0 or abs(t) < 1:
            v = 'REJECTED'
        elif t >= 2 and keep and net and gate is not False:
            v = 'CONFIRMED'
        else:
            v = 'WEAK'
        if d > 0 and not keep and all(x['diff_vs_all'] * sign <= 0 for x in (s2, p10)):
            v = 'REJECTED (early data only)'
        print(f'VERDICT {sname}: {v} | 10d diff {f["diff_vs_all"]:+.4f} t {f["t_nw"]:+.2f} | 2nd half {s2["diff_vs_all"]:+.4f} '
              f'2010-19 {p10["diff_vs_all"]:+.4f} | net {f["diff_net_cost"]:+.4f} | call EV/$ 10d at VIX, 0.72x: {g}')


if __name__ == '__main__':
    main()
