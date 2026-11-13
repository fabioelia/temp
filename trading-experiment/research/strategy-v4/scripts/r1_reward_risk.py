"""R1 (pre-registered in ../claims.md, 2026-11-11): does a wider target for the same stop raise the expected return?

Run: python3 -I r1_reward_risk.py <dir with SPY_*.json Yahoo daily files>
Amended 2026-11-11 (see claims.md): enter on scheduled closes every 21 sessions, skipping a date while a trade is open; exit at the first close at or below -k or at or above +R*k (k = 2%, 4%; R = 1, 2, 3), at most 250 sessions.
Excess per trade = trade log return - mean daily log return of the half x sessions held, minus 10 bps per round trip.
"""
import math
import sys
from datetime import date
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'strategy-v2' / 'scripts'))
import core_equity as ce  # noqa: E402

ds, _, adj, _ = ce.load(sys.argv[1], 'SPY')
lp = np.log(adj)
COST = 0.0010


def run(lo, hi, k, R):
    idx = np.where((ds >= lo) & (ds < hi))[0]
    mu = np.mean(np.diff(lp[idx]))
    i, out, hit_t, hit_s, held = idx[0], [], 0, 0, []
    end = idx[-1]
    while i < end:
        e = lp[i]
        start = i
        j = i + 1
        while j <= end and j - i <= 250:
            r = lp[j] - e
            if r <= math.log(1 - k):
                hit_s += 1
                break
            if r >= math.log(1 + R * k):
                hit_t += 1
                break
            j += 1
        j = min(j, end)
        out.append((lp[j] - e) - mu * (j - i) - COST)
        held.append(j - i)
        i = start + 21 * math.ceil(max(j - start, 1) / 21)
    x = np.array(out)
    t = x.mean() / (x.std(ddof=1) / math.sqrt(len(x)))
    share = hit_t / max(hit_t + hit_s, 1)
    return len(x), share, 1 / (1 + R), x.mean() * 1e4, t, np.mean(held)


print(f"{'half':9} {'k':>4} {'R':>2} {'trades':>6} {'target share':>12} {'1/(1+R)':>8} {'excess bps':>10} {'t':>6} {'days':>5}")
for name, lo, hi in (('1993-09', date(1993, 1, 1), date(2010, 1, 1)), ('2010-26', date(2010, 1, 1), date(2027, 1, 1))):
    for k in (0.02, 0.04):
        for R in (1, 2, 3):
            n, share, be, ex, t, d = run(lo, hi, k, R)
            print(f"{name:9} {k:4.0%} {R:2d} {n:6d} {share:12.1%} {be:8.1%} {ex:10.1f} {t:6.2f} {d:5.1f}")
