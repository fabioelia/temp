"""Shared helpers for the B1/B2 pattern tests (strategy-review, pre-registered 2026-10-29).

Fixed before any result was computed (claims.md is silent on these, so they are set here):
  * Baseline: the unconditional mean k-session forward return over every day of the same period ("random entry"),
    gross. Signal returns are net of the 5 bp SPY round trip, so excess = net signal - gross baseline.
  * Statistics: plain t on per-trade excess for B1 (one position at a time, so windows never overlap); a HAC t
    (Bartlett weights, bandwidth = holding horizon in sessions) for B2 events, whose windows can overlap.
    Plus a random-entry Monte Carlo (20,000 draws of n random days from the same period) for a one-sided p.
  * Options model: Black-Scholes call, S = price-only close (split-adjusted, no dividends), IV = ^VIX/100 on the
    day (x 1.25 for IWM, no ^RVX on Yahoo), r = ^IRX/100, q = SPY trailing 252-session dividend yield (3.0% before
    1994-02). Entry: 30 calendar DTE, strike set for delta 0.40, pay mid x 1.015. Exit: re-priced at the exit
    close's VIX with the remaining calendar days, receive mid x 0.985; at or past expiry, intrinsic value.
    EV per $ = mean(exit / entry). Baseline EV = the same option bought on every day of the period.
    The model ignores skew and event IV moves: results are approximate.
"""
import csv
import math
from datetime import date
from statistics import NormalDist

import numpy as np

DATA = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/strategy-data"
LAST = "2026-10-28"  # last complete session used
COST = 0.0005        # SPY round trip
HALF_SPREAD = 0.015
DTE = 30
DELTA = 0.40
N = NormalDist()
RNG = np.random.default_rng(20261029)


def load(sym):
    out = {}
    with open(f"{DATA}/{sym}.csv") as f:
        for r in csv.DictReader(f):
            if r["date"] <= LAST:
                out[r["date"]] = r
    return out


def series(sym):
    d = load(sym)
    dates = sorted(d)
    close = np.array([float(d[k]["close"]) for k in dates])
    adj = np.array([float(d[k]["adjclose"]) for k in dates])
    vol = np.array([float(d[k]["volume"] or 0) for k in dates])
    return dates, close, adj, vol


def to_date(s):
    return date.fromisoformat(s)


class OptionEnv:
    """Per-date IV, r and q aligned to an underlying's dates."""

    def __init__(self, dates, iv_mult=1.0):
        vix, irx = load("VIX"), load("IRX")
        spy = load("SPY")
        sd = sorted(spy)
        sc = {k: float(spy[k]["close"]) for k in sd}
        sa = {k: float(spy[k]["adjclose"]) for k in sd}
        qy = {}
        for i in range(252, len(sd)):
            a, b = sd[i - 252], sd[i]
            qy[b] = max(0.0, (sa[b] / sa[a]) / (sc[b] / sc[a]) - 1)
        self.iv, self.r, self.q = {}, {}, {}
        last_r, last_q = 0.05, 0.03
        for k in dates:
            if k in irx:
                last_r = float(irx[k]["close"]) / 100
            if k in qy:
                last_q = qy[k]
            self.r[k], self.q[k] = last_r, last_q
            if k in vix:
                self.iv[k] = float(vix[k]["close"]) / 100 * iv_mult


def bs_call(S, K, T, sig, r, q):
    if T <= 0:
        return max(S - K, 0.0)
    sq = sig * math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + 0.5 * sig * sig) * T) / sq
    d2 = d1 - sq
    return S * math.exp(-q * T) * N.cdf(d1) - K * math.exp(-r * T) * N.cdf(d2)


def strike_for_delta(S, T, sig, r, q, delta=DELTA):
    d1 = N.inv_cdf(delta * math.exp(q * T))
    return S * math.exp(-d1 * sig * math.sqrt(T) + (r - q + 0.5 * sig * sig) * T)


def option_path(dates, close, env, i, max_k, delta=DELTA):
    """Mid values of a 30 DTE call (delta 0.40 unless given) bought at close i, for sessions i..i+max_k.
    Returns (entry_paid, [exit_received for k = 1..]) or None without IV."""
    d0 = dates[i]
    if d0 not in env.iv:
        return None
    S, sig, r, q = close[i], env.iv[d0], env.r[d0], env.q[d0]
    T = DTE / 365
    K = strike_for_delta(S, T, sig, r, q, delta)
    paid = bs_call(S, K, T, sig, r, q) * (1 + HALF_SPREAD)
    t0 = to_date(d0)
    vals = []
    for k in range(1, max_k + 1):
        j = i + k
        if j >= len(dates):
            break
        dj = dates[j]
        left = DTE - (to_date(dj) - t0).days
        if left <= 0:
            vals.append(max(close[j] - K, 0.0))  # expired: intrinsic, then flat
            vals.extend([vals[-1]] * (max_k - k))
            break
        sig_j = env.iv.get(dj, sig)
        vals.append(bs_call(close[j], K, left / 365, sig_j, env.r[dj], env.q[dj]) * (1 - HALF_SPREAD))
    return paid, vals


def ev_rule(paid, vals, rule, k=10):
    """Value per $ under an exit rule: ('hold', k) or ('tgt_stop', +50% / -50% on closes, else session 15)."""
    if rule == "hold":
        if len(vals) < k:
            return None
        return vals[k - 1] / paid
    if rule == "tgt_stop":
        if len(vals) < 15:
            return None
        for v in vals[:15]:
            x = v / paid
            if x >= 1.5 or x <= 0.5:
                return x
        return vals[14] / paid
    raise ValueError(rule)


def hac_t(x, idx, h):
    """t-stat of mean(x) with Bartlett weights over event distance in sessions (bandwidth h)."""
    x = np.asarray(x, float)
    idx = np.asarray(idx)
    n = len(x)
    if n < 3:
        return float("nan")
    e = x - x.mean()
    d = np.abs(idx[:, None] - idx[None, :])
    w = np.clip(1 - d / h, 0, None)
    v = float(e @ w @ e) / n ** 2
    if v <= 0:
        v = float(e @ e) / n ** 2
    return float(x.mean() / math.sqrt(v * n / (n - 1)))


def plain_t(x):
    x = np.asarray(x, float)
    if len(x) < 3 or x.std(ddof=1) == 0:
        return float("nan")
    return float(x.mean() / (x.std(ddof=1) / math.sqrt(len(x))))


def random_entry_p(pool_by_k, ks, signal_mean, draws=20000):
    """One-sided p: share of random-entry samples (same holding lengths ks) with mean >= signal_mean."""
    ks = list(ks)
    tot = np.zeros(draws)
    for k in set(ks):
        m = ks.count(k)
        pool = pool_by_k[k]
        tot += RNG.choice(pool, size=(draws, m), replace=True).sum(axis=1)
    means = tot / len(ks)
    return float((means >= signal_mean).mean())


def perm_diff_p(a, b, draws=20000):
    """Two-sided permutation p for mean(a) - mean(b)."""
    a, b = np.asarray(a, float), np.asarray(b, float)
    obs = a.mean() - b.mean()
    allv = np.concatenate([a, b])
    na = len(a)
    cnt = 0
    for _ in range(draws):
        RNG.shuffle(allv)
        if abs(allv[:na].mean() - allv[na:].mean()) >= abs(obs) - 1e-12:
            cnt += 1
    return float(obs), cnt / draws


def boot_ci(x, draws=10000):
    x = np.asarray(x, float)
    if len(x) < 3:
        return float("nan"), float("nan")
    m = RNG.choice(x, size=(draws, len(x)), replace=True).mean(axis=1)
    return float(np.percentile(m, 2.5)), float(np.percentile(m, 97.5))


def boot_p_gt1(x, draws=10000):
    x = np.asarray(x, float)
    m = RNG.choice(x, size=(draws, len(x)), replace=True).mean(axis=1)
    return float((m > 1).mean())


def period_of(d, cuts):
    for name, lo, hi in cuts:
        if lo <= d <= hi:
            return name
    return None


def fmt(x, nd=4):
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return ""
    return f"{x:.{nd}f}"
