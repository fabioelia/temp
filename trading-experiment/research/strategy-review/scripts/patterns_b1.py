"""B1: Connors RSI(2) mean reversion on SPY (claims.md, pre-registered 2026-10-29).

As written: buy at the close when SPY > its 200-day SMA and RSI(2) < 5; sell at the close when SPY closes above its
5-day SMA. B1b: entry RSI(2) < 10 (same 200-day filter), exit at the first close with RSI(2) > 70.
SPY 1993-2026, dividend-adjusted closes, Wilder RSI. One position at a time; no stop. A trade open at the end of the
data is reported as live, not scored. Net of 5 bps vs a random entry with the same holding days.
Splits by entry date: 1993-2009, 2010-2026, last 10 years (2016-10-29 on).
Options: a 30 DTE delta-0.40 call held for the trade's sessions (patterns_lib for the model).
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # -I drops the script dir
import patterns_lib as L  # noqa: E402

PERIODS = [("full", "1993-01-01", "2026-12-31"), ("1993-2009", "1993-01-01", "2009-12-31"),
           ("2010-2026", "2010-01-01", "2026-12-31"), ("last10", "2016-10-29", "2026-12-31")]


def rsi_wilder(x, n=2):
    d = np.diff(x, prepend=np.nan)
    g, l_ = np.where(d > 0, d, 0.0), np.where(d < 0, -d, 0.0)
    out = np.full(len(x), np.nan)
    ag, al = g[1:n + 1].mean(), l_[1:n + 1].mean()
    for i in range(n, len(x)):
        if i > n:
            ag = (ag * (n - 1) + g[i]) / n
            al = (al * (n - 1) + l_[i]) / n
        out[i] = 100.0 if al == 0 else 100 - 100 / (1 + ag / al)
    return out, (ag, al)


def sma(x, n):
    c = np.cumsum(np.insert(x, 0, 0.0))
    out = np.full(len(x), np.nan)
    out[n - 1:] = (c[n:] - c[:-n]) / n
    return out


def trades(adj, rsi, s200, s5, entry_lvl, exit_rule):
    out, i, open_trade = [], 200, None
    while i < len(adj):
        if adj[i] > s200[i] and rsi[i] < entry_lvl:
            j = i + 1
            while j < len(adj):
                if (exit_rule == "sma5" and adj[j] > s5[j]) or (exit_rule == "rsi70" and rsi[j] > 70):
                    break
                j += 1
            if j >= len(adj):
                open_trade = i
                break
            out.append((i, j))
            i = j + 1
        else:
            i += 1
    return out, open_trade


def run():
    dates, close, adj, _ = L.series("SPY")
    rsi, (ag, al) = rsi_wilder(adj)
    s200, s5 = sma(adj, 200), sma(adj, 5)
    env = L.OptionEnv(dates)
    nd = len(dates)
    # forward k-session returns (gross) for the random-entry baseline
    fwd = {}
    opt_cache = {}

    def fwd_k(k):
        if k not in fwd:
            r = np.full(nd, np.nan)
            r[:nd - k] = adj[k:] / adj[:nd - k] - 1
            fwd[k] = r
        return fwd[k]

    def opt_ev_all(k):
        """EV/$ for a k-session hold bought on every day (baseline)."""
        if k not in opt_cache:
            ev = np.full(nd, np.nan)
            for i in range(nd - k):
                p = L.option_path(dates, close, env, i, k)
                if p and len(p[1]) >= k:
                    ev[i] = p[1][k - 1] / p[0]
            opt_cache[k] = ev
        return opt_cache[k]

    rows, detail = [], {}
    for name, entry_lvl, exit_rule in [("B1", 5, "sma5"), ("B1b", 10, "rsi70")]:
        tr, open_i = trades(adj, rsi, s200, s5, entry_lvl, exit_rule)
        recs = []
        for i, j in tr:
            k = j - i
            gross = adj[j] / adj[i] - 1
            p = L.option_path(dates, close, env, i, k)
            ev = p[1][k - 1] / p[0] if p and len(p[1]) >= k else None
            recs.append(dict(entry=dates[i], exit=dates[j], i=i, k=k, gross=gross, net=gross - L.COST, ev=ev))
        detail[name] = recs
        for pname, lo, hi in PERIODS:
            sel = [r for r in recs if lo <= r["entry"] <= hi]
            if not sel:
                continue
            idx_ok = np.array([lo <= d <= hi for d in dates])
            ks = [r["k"] for r in sel]
            pools, base_m, base_hit = {}, {}, {}
            for k in set(ks):
                v = fwd_k(k)[idx_ok]
                v = v[~np.isnan(v)]
                pools[k], base_m[k], base_hit[k] = v, v.mean(), (v > 0).mean()
            net = np.array([r["net"] for r in sel])
            base = np.array([base_m[r["k"]] for r in sel])
            exc = net - base
            p_rand = L.random_entry_p(pools, ks, net.mean())
            evs = np.array([r["ev"] for r in sel if r["ev"] is not None])
            ev_base = []
            for r in sel:
                e = opt_ev_all(r["k"])[idx_ok]
                ev_base.append(np.nanmean(e))
            lo_ci, hi_ci = L.boot_ci(evs) if len(evs) else (np.nan, np.nan)
            rows.append(dict(
                claim=name, variant=f"RSI2<{entry_lvl}, exit {'close>SMA5' if exit_rule == 'sma5' else 'RSI2>70'}",
                period=pname, horizon="trade", n=len(sel), mean=net.mean(), median=float(np.median(net)),
                hit=(net > 0).mean(), worst=net.min(), base_mean=base.mean(),
                base_hit=float(np.mean([base_hit[k] for k in ks])), excess=exc.mean(), t=L.plain_t(exc),
                p_random=p_rand, hold_mean=float(np.mean(ks)), hold_median=float(np.median(ks)),
                ev=evs.mean() if len(evs) else None, ev_ci_lo=lo_ci, ev_ci_hi=hi_ci,
                ev_base=float(np.mean(ev_base)), ev_hit=(evs > 1).mean() if len(evs) else None,
                ev_worst=evs.min() if len(evs) else None,
                note="t on per-trade excess (no overlap); p = random entry, same holding days; options from 1993 at VIX"))
        detail[name + "_open"] = dates[open_i] if open_i is not None else None

    # live status as of the last close
    i = nd - 1
    status = dict(date=dates[i], close=close[i], rsi2=rsi[i], sma200=s200[i], sma5=s5[i],
                  b1_open=detail["B1_open"], b1b_open=detail["B1b_open"])

    def rsi_next(px):
        d = px - adj[i]
        g, l_ = max(d, 0), max(-d, 0)
        a, b = (ag + g) / 2, (al + l_) / 2
        return 100.0 if b == 0 else 100 - 100 / (1 + a / b)

    for lvl in (5, 10):
        lo, hi = adj[i] * 0.8, adj[i]
        for _ in range(60):
            mid = (lo + hi) / 2
            if rsi_next(mid) < lvl:
                lo = mid
            else:
                hi = mid
        status[f"close_for_rsi_lt{lvl}"] = lo
    # the 200-day SMA tomorrow (approx: today's window rolled one day at an unchanged price)
    status["sma200_next"] = (adj[i - 198:i + 1].sum() + adj[i]) / 200
    return rows, detail, status


if __name__ == "__main__":
    rows, detail, status = run()
    for r in rows:
        print({k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.items() if k != "note"})
    print(status)
