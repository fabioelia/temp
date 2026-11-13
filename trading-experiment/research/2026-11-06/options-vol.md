# Options-vol, Fri 2026-11-06 (Run B): input for Sunday, not a recommendation

**No trade.** Sources: Cboe chain (22:17 UTC), SPY 735.29, ^VIX 25.64, ^IRX 4.00 (Yahoo). Scripts: `2026-11-02/scripts/goal_odds.py` (11/06 quotes = Monday buy, 8 checks) and `scripts/ov_1106.py`.

**1. Goal odds.** Only 12/18 has in-band OI ≥ 1,000, and it breaks the 5-week rule (39 days). 12/04 and 12/11 fail OI.

| 1 call, ask (Cboe) | Stop | P($2,200) | P(>SPY) | P(<$1,000) | EV/$ | Raw paths: P / EV |
|---|---|---|---|---|---|---|
| 12/18 755C, 10.30/10.44, Δ0.37, OI 12,169 | -50% | 22.0% | 24.8% | 42.1% | 1.015 (0.98-1.05) | 11.9% / 0.953 |
| same | none | 22.2% | 25.2% | 35.1% | 1.024 | 12.5% / 0.967 |
| 754-757C | either | 20-23% | 23-26% | 34-43% | 1.015-1.027 | 0.951-0.967 |
| ref: 12/04 750C, 9.47/9.60, OI 853 | -50% / none | 24.1 / 24.7% | 26.4 / 27.5% | 50.6 / 40.4% | 1.000 / 1.011 | 0.906 / 0.918 |

**2. VIX 23-28, 9D > 3M** (post-hoc, n 109, 32 episodes): an 8-session hold returns 1.24/$; delta-hedged it is 1.004 (t 0.0), so the gain is beta. Our +50%/-50% exits return 0.99. Full Kelly $450 is below the $1,044 cost.

**3. Intraday stops.** goal_odds can't model them. ov_1106 brackets them (755C, -50% stop):
- **Checks:** 14:43 only → +10:00 (open as proxy) → continuous (upper bound).
- **P(stop):** 37% → 43% → 55%.
- **P(<$1,000):** 42% → 46% → 55%.
- **EV/$:** 1.018 → 0.995 → 0.956.
- **p5 equity:** $691 → $698 → $786.

A 12:00 check lands between the last two.

**Consensus** ("buy the VIX-spike dip"): the measured gain is beta.
