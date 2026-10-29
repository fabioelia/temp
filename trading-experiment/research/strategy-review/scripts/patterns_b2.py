"""B2: O'Neil follow-through day (claims.md, pre-registered 2026-10-29).

Definitions (claims.md; the details marked * are fixed here because claims.md does not spell them out):
  * Qualifying low: a close that is the lowest of the last 25 closes (incl. itself) and >= 5% below the highest close
    of the last 252 sessions (closes*, since ^GSPC highs/lows are not real before 1962).
  * Day 1 = the first up close after a qualifying low; later sessions count Day 2, 3, ... An attempt ends at a
    close strictly below the rally low (that close re-arms if it qualifies) or at its FTD. No day cap (as written)*.
    A new 25-session low that stays above the rally low does not reset a live attempt*.
  * FTD = Day >= 4, close-to-close gain >= 1.25% (variants 1.0%, 1.5%), volume > the prior session's volume.
    Only the first FTD of an attempt counts.
  * Forward 5/10/22-session returns from the FTD close, net of 5 bps, vs every day of the same period.
  * Success = no close below the rally low in the 22 sessions after the FTD. Baseline* = every Day 4+ attempt day
    that is not an FTD.
  * Persona split* = net change over the 3 sessions before the FTD, close(t-1)/close(t-4)-1: >= +2%, 0 to 2%, < 0;
    and "three up closes". Tested by a two-sided permutation test of (>= 2%) minus (< 0).
  * Options (1990 on, VIX): 30 DTE delta-0.40 call at the FTD close. Primary hold = 10 sessions*; also 5 sessions
    and the D4-style +50% target / -50% stop on closes, else exit at session 15.
Periods: full, 1950-1989, 1990-2009, 2010-2026, last 10 years. IWM (2000-2026, 10 bps, IV = VIX x 1.25) is a
POST-HOC check of the momentum persona's universe, not part of the pre-registered test.
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # -I drops the script dir
import patterns_lib as L  # noqa: E402

PERIODS = [("full", "1950-01-01", "2026-12-31"), ("1950-1989", "1950-01-01", "1989-12-31"),
           ("1990-2009", "1990-01-01", "2009-12-31"), ("2010-2026", "2010-01-01", "2026-12-31"),
           ("last10", "2016-10-29", "2026-12-31")]
HORIZONS = (5, 10, 22)
OPT_RULES = [("opt_hold5", "hold", 5), ("opt_hold10", "hold", 10), ("opt_tgt50_stop50_15d", "tgt_stop", 15)]


def ftd_scan(close, vol, thr, start=251, dd_min=0.05, dd_max=None, day_max=None):
    """Defaults are the pre-registered test. dd_max / day_max exist only for the labelled post-hoc checks."""
    events, attempt_days = [], []
    state, low, low_i, day = "idle", None, None, 0
    final = None
    for t in range(start, len(close)):
        c = close[t]
        dd = c / close[t - 251:t + 1].max() - 1
        qual = c <= close[t - 24:t + 1].min() and dd <= -dd_min and (dd_max is None or dd > -dd_max)
        if state == "attempt":
            if c < low:
                state, low, low_i = ("armed", c, t) if qual else ("idle", None, None)
                continue
            day += 1
            if day_max is not None and day > day_max:
                state, low, low_i = ("armed", c, t) if qual else ("idle", None, None)
                continue
            ret = c / close[t - 1] - 1
            is_ftd = day >= 4 and ret >= thr and vol[t] > vol[t - 1]
            if day >= 4 and not is_ftd:
                attempt_days.append((t, low))
            if is_ftd:
                events.append(dict(i=t, low=low, low_i=low_i, day=day, ret=ret, vratio=vol[t] / vol[t - 1]))
                state = "idle"
            continue
        if state == "armed":
            if c > close[t - 1]:
                state, day = "attempt", 1
            elif c < low:
                state, low, low_i = ("armed", c, t) if qual else ("idle", None, None)
            continue
        if qual:
            state, low, low_i = "armed", c, t
    final = dict(state=state, low=low, low_i=low_i, day=day if state == "attempt" else 0)
    return events, attempt_days, final


def analyse(label, sym, dates, px, close, vol, thr, cost, env, periods, post_hoc=False, delta=L.DELTA, tag_extra="",
            **scan_kw):
    nd = len(dates)
    events, att, final = ftd_scan(px, vol, thr, **scan_kw)
    fwd = {}
    for k in HORIZONS:
        r = np.full(nd, np.nan)
        r[:nd - k] = px[k:] / px[:nd - k] - 1
        fwd[k] = r
    # options: every-day baseline and per-event values
    opt_all = {name: np.full(nd, np.nan) for name, _, _ in OPT_RULES}
    for i in range(nd):
        if dates[i] < "1990-01-02" or dates[i] not in env.iv:
            continue
        p = L.option_path(dates, close, env, i, 15, delta=delta)
        if not p:
            continue
        for name, rule, k in OPT_RULES:
            v = L.ev_rule(p[0], p[1], rule, k)
            if v is not None:
                opt_all[name][i] = v
    for e in events:
        i = e["i"]
        e["date"] = dates[i]
        for k in HORIZONS:
            e[f"r{k}"] = fwd[k][i] - cost if not np.isnan(fwd[k][i]) else None
        e["success"] = bool(px[i + 1:i + 23].min() >= e["low"]) if i + 22 < nd else None
        e["prior3"] = px[i - 1] / px[i - 4] - 1
        e["up3"] = bool(all(px[i - j] > px[i - j - 1] for j in (1, 2, 3)))
        for name, _, _ in OPT_RULES:
            v = opt_all[name][i]
            e[name] = None if np.isnan(v) else float(v)
    rows = []
    tag = f"{label} {sym} FTD >= {thr * 100:.2f}%{tag_extra}" + (" [POST-HOC]" if post_hoc else "")
    for pname, lo, hi in periods:
        ok = np.array([lo <= d <= hi for d in dates])
        sel = [e for e in events if lo <= e["date"] <= hi]
        if not sel:
            continue
        for k in HORIZONS:
            s = [e for e in sel if e[f"r{k}"] is not None]
            if len(s) < 3:
                continue
            pool = fwd[k][ok]
            pool = pool[~np.isnan(pool)]
            net = np.array([e[f"r{k}"] for e in s])
            exc = net - pool.mean()
            rows.append(dict(claim=label, variant=tag, period=pname, horizon=f"{k}d", n=len(s), mean=net.mean(),
                             median=float(np.median(net)), hit=(net > 0).mean(), worst=net.min(),
                             base_mean=pool.mean(), base_hit=(pool > 0).mean(), excess=exc.mean(),
                             t=L.hac_t(exc, [e["i"] for e in s], k),
                             p_random=L.random_entry_p({k: pool}, [k] * len(s), net.mean()),
                             note=f"HAC t (Bartlett, bw {k}); p = random entry, same period"))
        s = [e for e in sel if e["success"] is not None]
        base_s = [bool(px[t + 1:t + 23].min() >= low) for t, low in att
                  if lo <= dates[t] <= hi and t + 22 < nd]
        if s:
            sr = np.mean([e["success"] for e in s])
            bs = np.mean(base_s) if base_s else np.nan
            se = np.sqrt(bs * (1 - bs) / len(s)) if base_s else np.nan
            rows.append(dict(claim=label, variant=tag, period=pname, horizon="success22", n=len(s), mean=sr,
                             base_mean=bs, excess=sr - bs, t=(sr - bs) / se if se else np.nan,
                             note=f"no close below rally low in 22 sessions; base = {len(base_s)} non-FTD Day 4+ days"))
        for name, _, _ in OPT_RULES:
            v = np.array([e[name] for e in sel if e[name] is not None])
            if len(v) < 3:
                continue
            b = opt_all[name][ok]
            b = b[~np.isnan(b)]
            lo_ci, hi_ci = L.boot_ci(v)
            rows.append(dict(claim=label, variant=tag, period=pname, horizon=name, n=len(v), ev=v.mean(),
                             median=float(np.median(v)), ev_ci_lo=lo_ci, ev_ci_hi=hi_ci, ev_base=b.mean(),
                             ev_hit=(v > 1).mean(), ev_worst=v.min(), p_gt1=L.boot_p_gt1(v),
                             p_random=L.random_entry_p({0: b}, [0] * len(v), v.mean()),
                             note=f"BS at VIX, 3% spread; 30 DTE delta {delta:.2f} call; skew ignored"))
        # persona split
        groups = {"prior3>=+2%": [e for e in sel if e["prior3"] >= 0.02],
                  "prior3 0..2%": [e for e in sel if 0 <= e["prior3"] < 0.02],
                  "prior3<0": [e for e in sel if e["prior3"] < 0],
                  "three up closes": [e for e in sel if e["up3"]]}
        for g, ge in groups.items():
            r10 = np.array([e["r10"] for e in ge if e["r10"] is not None])
            o10 = np.array([e["opt_hold10"] for e in ge if e["opt_hold10"] is not None])
            ots = np.array([e["opt_tgt50_stop50_15d"] for e in ge if e["opt_tgt50_stop50_15d"] is not None])
            pool = fwd[10][ok]
            pool = pool[~np.isnan(pool)]
            rows.append(dict(claim=label, variant=tag, period=pname, horizon=f"split {g}", n=len(r10),
                             mean=r10.mean() if len(r10) else None, excess=r10.mean() - pool.mean() if len(r10) else None,
                             hit=(r10 > 0).mean() if len(r10) else None, n_opt=len(o10),
                             ev=o10.mean() if len(o10) else None, ev_tgtstop=ots.mean() if len(ots) else None,
                             p_gt1=L.boot_p_gt1(o10) if len(o10) >= 3 else None,
                             note="10-session underlying (net) and option EV/$ (hold 10; tgt/stop)"))
        a = groups["prior3>=+2%"]
        b = groups["prior3<0"]
        for metric in ("r10", "opt_hold10", "opt_tgt50_stop50_15d"):
            va = [e[metric] for e in a if e[metric] is not None]
            vb = [e[metric] for e in b if e[metric] is not None]
            if len(va) >= 3 and len(vb) >= 3:
                d, p = L.perm_diff_p(va, vb)
                rows.append(dict(claim=label, variant=tag, period=pname, horizon=f"split diff {metric}",
                                 n=len(va) + len(vb), mean=d, p_random=p,
                                 note=f"(>= +2%: n {len(va)}) minus (< 0: n {len(vb)}); two-sided permutation p"))
    return rows, events, final


def run():
    out_rows, ev_out, status = [], {}, {}
    dates, close, adj, vol = L.series("GSPC")
    env = L.OptionEnv(dates)
    for thr in (0.0125, 0.010, 0.015):
        rows, events, final = analyse("B2", "^GSPC", dates, close, close, vol, thr, L.COST, env, PERIODS)
        out_rows += rows
        ev_out[("GSPC", thr)] = events
        status[("GSPC", thr)] = final
    status["GSPC_last"] = dict(date=dates[-1], close=close[-1], vol=vol[-1],
                               prior3_for_next=close[-1] / close[-4] - 1,
                               high252=close[-252:].max(), low25=close[-25:].min())
    status["GSPC_dates"] = dates
    status["GSPC_close"] = close
    # POST-HOC: IWM, the persona's universe
    d2, c2, a2, v2 = L.series("IWM")
    env2 = L.OptionEnv(d2, iv_mult=1.25)
    per2 = [("full", "2000-01-01", "2026-12-31"), ("2000-2009", "2000-01-01", "2009-12-31"),
            ("2010-2026", "2010-01-01", "2026-12-31"), ("last10", "2016-10-29", "2026-12-31")]
    for thr in (0.0125, 0.015):
        rows, events, final = analyse("B2-IWM", "IWM", d2, a2, c2, v2, thr, 0.0010, env2, per2, post_hoc=True)
        out_rows += rows
        ev_out[("IWM", thr)] = events
        status[("IWM", thr)] = final
    status["IWM_dates"], status["IWM_px"] = d2, a2
    return out_rows, ev_out, status


if __name__ == "__main__":
    rows, ev, st = run()
    for r in rows:
        print({k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.items() if k not in ("note", "variant")},
              r["variant"])
    for k, v in st.items():
        if not str(k).endswith(("_dates", "_close", "_px")):
            print(k, v)
