#!/usr/bin/env python3
"""Run B1 and B2 (pre-registered) plus the labelled post-hoc checks; write patterns-results.csv; print live status.

  python3 -I patterns_fetch.py && python3 -I patterns_run.py

POST-HOC (decided after the pre-registered results were seen; they cannot support a CONFIRMED verdict):
  PH1  B2 with an O'Neil-style day cap (FTD on Day 4-10 only): as written, "Day 4+" admits Day 50-258 signals.
  PH2  PH1 after shallow dips only (low 2-5% below the 252-day high): the setup the S&P is in now.
  PH3  The closest replication of the momentum persona's sample: IWM, +1.5%, delta 0.30, +50%/-50%/15-session exit.
"""
import csv
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)  # -I drops the script dir
import patterns_b1 as B1  # noqa: E402
import patterns_b2 as B2  # noqa: E402
import patterns_lib as L  # noqa: E402

OUT = os.path.join(os.path.dirname(HERE), "patterns-results.csv")
COLS = ["claim", "variant", "period", "horizon", "n", "mean", "median", "hit", "worst", "base_mean", "base_hit",
        "excess", "t", "p_random", "hold_mean", "hold_median", "ev", "ev_ci_lo", "ev_ci_hi", "ev_base", "ev_hit",
        "ev_worst", "p_gt1", "n_opt", "ev_tgtstop", "note"]


def main():
    rows = []
    r1, d1, s1 = B1.run()
    rows += r1
    r2, ev2, s2 = B2.run()
    rows += r2

    dates, close, _, vol = L.series("GSPC")
    env = L.OptionEnv(dates)
    ph1, ev_ph1, fin_ph1 = B2.analyse("B2-PH1", "^GSPC", dates, close, close, vol, 0.0125, L.COST, env, B2.PERIODS,
                                      post_hoc=True, tag_extra=" Day 4-10", day_max=10)
    ph2, ev_ph2, fin_ph2 = B2.analyse("B2-PH2", "^GSPC", dates, close, close, vol, 0.0125, L.COST, env, B2.PERIODS,
                                      post_hoc=True, tag_extra=" Day 4-10, dip 2-5%", day_max=10, dd_min=0.02,
                                      dd_max=0.05)
    di, ci, ai, vi = L.series("IWM")
    envi = L.OptionEnv(di, iv_mult=1.25)
    per_i = [("full", "2000-01-01", "2026-12-31"), ("2000-2009", "2000-01-01", "2009-12-31"),
             ("2010-2026", "2010-01-01", "2026-12-31")]
    ph3, _, _ = B2.analyse("B2-PH3", "IWM", di, ai, ci, vi, 0.015, 0.0010, envi, per_i, post_hoc=True,
                           delta=0.30, tag_extra=" delta 0.30")
    rows += ph1 + ph2 + ph3

    with open(OUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLS, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: (L.fmt(float(v), 4) if isinstance(v, (float, np.floating)) else
                            (v.item() if isinstance(v, np.generic) else v)) for k, v in r.items()})
    print(f"wrote {len(rows)} rows -> {OUT}")

    # ---- live status
    print("B1 status:", {k: (round(float(v), 2) if isinstance(v, (float, np.floating)) else v) for k, v in s1.items()})
    for thr in (0.0125, 0.010, 0.015):
        print(f"B2 ^GSPC {thr:.4f} scanner state at {dates[-1]}:", s2[("GSPC", thr)])
    print("PH2 shallow-dip state:", fin_ph2, dates[fin_ph2["low_i"]] if fin_ph2["low_i"] else None)
    hi = close[-252:].max()
    print(f"^GSPC close {close[-1]:.2f}; 252d closing high {hi:.2f}; 10/23 close {close[-4]:.2f} "
          f"= {close[-4] / hi - 1:+.2%} from the high; prior-3 for 10/29 = {close[-1] / close[-4] - 1:+.2%}; "
          f"+1.0/1.25/1.5% need {close[-1] * 1.01:.2f}/{close[-1] * 1.0125:.2f}/{close[-1] * 1.015:.2f} "
          f"on volume > {vol[-1] / 1e9:.3f}B")
    print("IWM prior-3 for 10/29:", f"{ai[-1] / ai[-4] - 1:+.2%}", "IWM 252d dd at 10/23:",
          f"{ai[-4] / ai[-252:].max() - 1:+.2%}")
    for name, evs in (("PH2", ev_ph2),):
        print(name, "events:", [(dates[e["i"]], e["day"], round(e["ret"] * 100, 2)) for e in evs][-12:])

    # ---- diagnostic: why B1's option EV trails its underlying edge (VIX level at entry, VIX change over the trade)
    sd, _, _, _ = L.series("SPY")
    vix = L.OptionEnv(sd).iv
    allv = np.array([vix[d] for d in sd if d in vix and d >= "2010-01-01"])
    for name in ("B1", "B1b"):
        tr = [t for t in d1[name] if t["entry"] >= "2010-01-01"]
        v0 = np.array([vix[t["entry"]] for t in tr])
        dv = np.array([vix[t["exit"]] - vix[t["entry"]] for t in tr])
        print(f"{name} 2010-2026: VIX at entry {v0.mean() * 100:.1f} vs {allv.mean() * 100:.1f} on all days; "
              f"VIX change entry->exit {dv.mean() * 100:+.2f} pts; mean hold {np.mean([t['k'] for t in tr]):.1f}")


if __name__ == "__main__":
    main()
