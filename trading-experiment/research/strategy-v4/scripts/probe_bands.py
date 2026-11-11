#!/usr/bin/env python3
"""Probe program (adopted 2026-11-11): pre-committed P/L bands for PR1, the gold probe ($50 GLDM, benchmarked against SGOV/T-bills).

Specification fixed before the first run (red-team: "commit the bands before any order"):
  * Series: GLD total return (Yahoo adjclose, 2004-11 to 2026-11-06) as the proxy for GLDM (same gold exposure; GLDM fee 0.10% vs GLD 0.40%);
    T-bills from ^IRX (previous session, /100 x days/360), as core_equity.py does.
  * Probe P/L relative to the benchmark = $50 x (cumulative GLD return - cumulative T-bill return) over 20, 40 and 60 sessions (weeks 4, 8, 12).
  * Bands: the 2nd percentile (kill line) and the 50th / 98th percentiles of a stationary block bootstrap (block 20 sessions, 20,000 paths,
    seed 20261111) of daily GLD-minus-T-bill excess returns. A probe below its 2nd-percentile band at a checkpoint is killed (program rule 1).
Run: python3 -I probe_bands.py <dir with GLD_*.json> <dir with IRX_*.json>
"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'strategy-v2' / 'scripts'))
import core_equity as ce  # noqa: E402

gds, gclose, gadj, _ = ce.load(sys.argv[1], 'GLD')
ids, iclose, _, _ = ce.load(sys.argv[2], 'IRX')
irx = dict(zip(ids, iclose))
keys = sorted(irx)
import bisect  # noqa: E402
def irx_at(d):
    return irx[keys[bisect.bisect_right(keys, d) - 1]]
r = gadj[1:] / gadj[:-1] - 1
rf = np.array([irx_at(gds[i - 1]) / 100 * (gds[i] - gds[i - 1]).days / 360 for i in range(1, len(gds))])
ex = r - rf
rng = np.random.default_rng(20261111)
n = len(ex)
print(f"GLD {gds[0]} .. {gds[-1]}: {n} daily excess returns, mean {ex.mean()*252*100:.2f}%/yr, vol {ex.std()*np.sqrt(252)*100:.1f}%")
for h in (20, 40, 60):
    paths = np.empty(20000)
    for k in range(20000):
        idx = []
        while len(idx) < h:
            s0 = rng.integers(0, n - 20)
            idx.extend(range(s0, s0 + 20))
        seg = ex[np.array(idx[:h])]
        paths[k] = 50 * (np.prod(1 + seg) - 1)
    p2, p50, p98 = np.percentile(paths, [2, 50, 98])
    print(f"week {h // 5:>2} ({h} sessions): 2nd pct ${p2:+.2f}  median ${p50:+.2f}  98th pct ${p98:+.2f}")
