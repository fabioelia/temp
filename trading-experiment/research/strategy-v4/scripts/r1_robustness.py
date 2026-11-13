"""R1 robustness checks, added 2026-11-11 after the red-team. They are NOT part of the pre-registered test; its verdict stands as run.

Run: python3 -I r1_robustness.py <dir with SPY_*.json Yahoo daily files>
A. iid shuffle: the half's daily log returns in random order (same drift, no serial dependence), the same amended test, 100 shuffles (seed 11).
   This shows what the target-first share and the excess look like from the drift alone.
B. Shared entries: every 21st close is an entry for every R (trades may overlap, so t is overstated), so R no longer changes which days are entered.
"""
import math
import sys
from datetime import date
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'strategy-v2' / 'scripts'))
import core_equity as ce  # noqa: E402

ds, _, adj, _ = ce.load(sys.argv[1], 'SPY')
COST = 0.0010


def trade(lp, i, end, k, R):
    e = lp[i]
    for j in range(i + 1, min(end, i + 250) + 1):
        r = lp[j] - e
        if r <= math.log(1 - k):
            return j, -1
        if r >= math.log(1 + R * k):
            return j, 1
    return min(end, i + 250), 0


def amended(lp, k, R):
    mu = np.mean(np.diff(lp))
    end, i, out, ht, hs = len(lp) - 1, 0, [], 0, 0
    while i < end:
        j, h = trade(lp, i, end, k, R)
        ht, hs = ht + (h == 1), hs + (h == -1)
        out.append((lp[j] - lp[i]) - mu * (j - i) - COST)
        i = i + 21 * math.ceil(max(j - i, 1) / 21)
    return ht / max(ht + hs, 1), np.mean(out) * 1e4


def shared(lp, k, R):
    mu = np.mean(np.diff(lp))
    end, out = len(lp) - 1, []
    for i in range(0, end, 21):
        j, _ = trade(lp, i, end, k, R)
        out.append((lp[j] - lp[i]) - mu * (j - i) - COST)
    x = np.array(out)
    return x.mean() * 1e4, x.mean() / (x.std(ddof=1) / math.sqrt(len(x)))


rng = np.random.default_rng(11)
print(f"{'half':9} {'k':>4} {'R':>2} {'A: shuffled share':>17} {'A: shuffled excess bps':>22} {'B: shared excess bps':>20} {'B: t (overstated)':>17}")
for name, lo, hi in (('1993-09', date(1993, 1, 1), date(2010, 1, 1)), ('2010-26', date(2010, 1, 1), date(2027, 1, 1))):
    lp = np.log(adj[(ds >= lo) & (ds < hi)])
    rets = np.diff(lp)
    shuffles = [np.concatenate([[lp[0]], lp[0] + np.cumsum(rng.permutation(rets))]) for _ in range(100)]
    for k in (0.02, 0.04):
        for R in (1, 2, 3):
            a = np.array([amended(s, k, R) for s in shuffles])
            bx, bt = shared(lp, k, R)
            print(f"{name:9} {k:4.0%} {R:2d} {a[:, 0].mean():17.1%} {a[:, 1].mean():22.1f} {bx:20.1f} {bt:17.2f}")
