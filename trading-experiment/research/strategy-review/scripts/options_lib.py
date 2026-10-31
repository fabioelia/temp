"""Shared helpers for the D1-D4 options tests (Black-Scholes at VIX, Newey-West t-stats, data alignment).

Specification, fixed before any result was computed (2026-10-29):
  * Underlying: ^GSPC close (price index) for D1-D3; SPY close (not dividend-adjusted: option holders get no dividends) for D4.
    IWM close for the regime one-liner only.
  * IV = that day's ^VIX / 100 for every strike (no skew). IWM: Cboe RVX where it exists (from 2009-09-16), VIX x 1.25 before
    (protocol fallback; Yahoo has no ^RVX).
  * r = ^IRX / 100 (13-week T-bill), forward-filled.  q = trailing 365-day dividends / close (SPY for ^GSPC and SPY, IWM for IWM),
    back-filled with the first complete-year value before that.
  * Expiry = the last trading day on or before entry + 30 calendar days; T = calendar days / 365.
  * Fills at the close: buy at mid x 1.015, sell at mid x 0.985 (half a 3% spread each way), also at expiry on intrinsic value.
  * EV/$ = mean(proceeds / cost) per trade. Hit = share with proceeds > cost. t-stats: Newey-West (Bartlett), lag = 2 x holding
    sessions, on the daily series of overlapping trades.
"""
import csv
import math
import os
from datetime import date, timedelta
from statistics import NormalDist

import numpy as np

CACHE = '/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-data/options'
HALF_SPREAD = 0.015
_ND = NormalDist()


# ------------------------------------------------------------------ data
def load(name):
    """Return dict date->(close, volume) from the cached Yahoo CSV."""
    out = {}
    with open(os.path.join(CACHE, f'{name}.csv')) as f:
        for row in csv.DictReader(f):
            c = float(row['close'])
            if c > 0:
                out[date.fromisoformat(row['date'])] = (c, float(row['volume'] or 0))
    return out


def load_divs(name):
    out = []
    p = os.path.join(CACHE, f'{name}_div.csv')
    with open(p) as f:
        for row in csv.DictReader(f):
            out.append((date.fromisoformat(row['date']), float(row['dividend'])))
    return sorted(out)


def load_rvx_cboe():
    out = {}
    with open(os.path.join(CACHE, 'RVX_cboe.csv')) as f:
        for row in csv.DictReader(f):
            m, d, y = row['DATE'].split('/')
            c = float(row['CLOSE'])
            if c > 0:
                out[date(int(y), int(m), int(d))] = c
    return out


def ffill_on(dates, series, back=True):
    """Align dict date->value onto dates, forward-filling (and back-filling the start if back)."""
    vals = np.full(len(dates), np.nan)
    keys = sorted(series)
    j, last = 0, np.nan
    for i, d in enumerate(dates):
        while j < len(keys) and keys[j] <= d:
            last = series[keys[j]]
            j += 1
        vals[i] = last
    if back and np.isnan(vals[0]):
        first = vals[~np.isnan(vals)][0]
        vals[np.isnan(vals)] = first  # only leading NaNs remain after the forward fill
    return vals


def div_yield(dates, closes, divs):
    """Trailing 365-day dividend sum / close; back-filled before the first complete year."""
    q = np.full(len(dates), np.nan)
    if not divs:
        return np.zeros(len(dates))
    first_full = divs[0][0] + timedelta(days=365)
    for i, d in enumerate(dates):
        if d < first_full:
            continue
        s = sum(a for dd, a in divs if d - timedelta(days=365) < dd <= d)
        q[i] = s / closes[i]
    ok = ~np.isnan(q)
    q[~ok] = q[ok][0]
    return q


def market(underlying):
    """Aligned arrays on the underlying's trading dates: dates, S, iv, r, q, vol, vix."""
    px = load(underlying)
    dates = sorted(px)
    S = np.array([px[d][0] for d in dates])
    vol = np.array([px[d][1] for d in dates])
    vix_d = {d: v[0] for d, v in load('VIX').items()}
    irx_d = {d: v[0] for d, v in load('IRX').items()}
    vix = ffill_on(dates, vix_d)
    r = ffill_on(dates, irx_d) / 100.0
    if underlying == 'IWM':
        rvx = load_rvx_cboe()
        start = min(rvx)
        iv = np.array([np.nan] * len(dates))
        rv_al = ffill_on(dates, rvx, back=False)
        for i, d in enumerate(dates):
            iv[i] = rv_al[i] if d >= start else vix[i] * 1.25
        iv = iv / 100.0
        q = div_yield(dates, S, load_divs('IWM'))
    else:
        iv = vix / 100.0
        if underlying == 'SPY':
            q = div_yield(dates, S, load_divs('SPY'))
        else:  # ^GSPC: use SPY's yield mapped onto index dates
            spy = load('SPY')
            sd = sorted(spy)
            qs = div_yield(sd, np.array([spy[d][0] for d in sd]), load_divs('SPY'))
            q = ffill_on(dates, dict(zip(sd, qs)))
    return {'dates': dates, 'S': S, 'iv': iv, 'r': r, 'q': q, 'vol': vol, 'vix': vix}


def expiry_index(dates, dte=30):
    """For each entry i, the index of the last trading day on or before date_i + dte calendar days (-1 if beyond data)."""
    n = len(dates)
    out = np.full(n, -1, dtype=int)
    j = 0
    for i, d in enumerate(dates):
        tgt = d + timedelta(days=dte)
        if j < i:
            j = i
        while j + 1 < n and dates[j + 1] <= tgt:
            j += 1
        if j + 1 < n or dates[-1] >= tgt:  # we know the expiry day is inside the data
            out[i] = j
    return out


# ------------------------------------------------------------------ Black-Scholes
def ncdf(x):
    x = np.asarray(x, dtype=float)
    z = np.abs(x) / math.sqrt(2.0)
    t = 1.0 / (1.0 + 0.5 * z)
    erfc = t * np.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (
        -0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))))
    half = 0.5 * erfc  # = P(Z > |x|)
    return np.where(x >= 0, 1.0 - half, half)


def bs(S, K, T, sig, r, q, kind):
    S, K, T, sig, r, q = (np.asarray(a, dtype=float) for a in (S, K, T, sig, r, q))
    T = np.maximum(T, 0.0)
    intrinsic = np.maximum(S - K, 0.0) if kind == 'C' else np.maximum(K - S, 0.0)
    with np.errstate(divide='ignore', invalid='ignore'):
        sq = sig * np.sqrt(T)
        d1 = (np.log(S / K) + (r - q + 0.5 * sig * sig) * T) / sq
        d2 = d1 - sq
        if kind == 'C':
            p = S * np.exp(-q * T) * ncdf(d1) - K * np.exp(-r * T) * ncdf(d2)
        else:
            p = K * np.exp(-r * T) * ncdf(-d2) - S * np.exp(-q * T) * ncdf(-d1)
    return np.where(T <= 0, intrinsic, p)


def strike_for_delta(S, T, sig, r, q, delta, kind):
    """Strike whose BS delta is `delta` (call: e^-qT N(d1) = delta; put: -e^-qT N(-d1) = -delta, pass delta > 0)."""
    S, T, sig, r, q = (np.asarray(a, dtype=float) for a in (S, T, sig, r, q))
    target = delta * np.exp(q * T)
    if kind == 'C':
        d1 = np.array([_ND.inv_cdf(min(max(x, 1e-9), 1 - 1e-9)) for x in np.atleast_1d(target)])
    else:
        d1 = -np.array([_ND.inv_cdf(min(max(x, 1e-9), 1 - 1e-9)) for x in np.atleast_1d(target)])
    sq = sig * np.sqrt(T)
    return S * np.exp(-d1 * sq + (r - q + 0.5 * sig * sig) * T)


# ------------------------------------------------------------------ statistics
def nw_se_mean(x, lag):
    x = np.asarray(x, dtype=float)
    n = len(x)
    if n < 3:
        return float('nan')
    e = x - x.mean()
    v = e @ e / n
    for k in range(1, min(lag, n - 1) + 1):
        w = 1.0 - k / (lag + 1.0)
        v += 2.0 * w * (e[k:] @ e[:-k]) / n
    return math.sqrt(max(v, 0.0) / n)


def nw_t(x, base, lag):
    x = np.asarray(x, dtype=float)
    se = nw_se_mean(x, lag)
    return (x.mean() - base) / se if se > 0 else float('nan')


def hac_ols(y, X, lag):
    """OLS with Newey-West (Bartlett) covariance. Returns (beta, t)."""
    y = np.asarray(y, dtype=float)
    X = np.asarray(X, dtype=float)
    n = len(y)
    XtX_inv = np.linalg.inv(X.T @ X)
    b = XtX_inv @ X.T @ y
    u = y - X @ b
    g = X * u[:, None]
    S = g.T @ g
    for k in range(1, min(lag, n - 1) + 1):
        w = 1.0 - k / (lag + 1.0)
        G = g[k:].T @ g[:-k]
        S += w * (G + G.T)
    V = XtX_inv @ S @ XtX_inv
    return b, b / np.sqrt(np.diag(V))


def summary(ratio, base=1.0, lag=1):
    ratio = np.asarray(ratio, dtype=float)
    if len(ratio) == 0:
        return {'n': 0}
    return {'n': len(ratio), 'ev': ratio.mean(), 'median': float(np.median(ratio)), 'hit': float((ratio > 1.0).mean()),
            'p10': float(np.percentile(ratio, 10)), 'p90': float(np.percentile(ratio, 90)), 'worst': float(ratio.min()),
            't': nw_t(ratio, base, lag)}


PERIODS = [('full', date(1900, 1, 1), date(2100, 1, 1)),
           ('1990-2009', date(1900, 1, 1), date(2010, 1, 1)),
           ('2010-2026', date(2010, 1, 1), date(2100, 1, 1)),
           ('last10y', date(2016, 10, 29), date(2100, 1, 1)),
           ('last5y', date(2021, 10, 29), date(2100, 1, 1))]


def period_mask(dates, lo, hi):
    return np.array([lo <= d < hi for d in dates])
