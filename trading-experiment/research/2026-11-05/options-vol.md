# Options & vol, Thu 2026-11-05 (Run B)

**Verdict: no trade. No vol idea passes. A second variance bet buys only variance.**

Sources: Cboe delayed chain (stamp 22:17 UTC); Yahoo closes for ^VIX 28.18, ^VXN 38.26 and ^IRX 3.987. Scripts: `2026-11-02/scripts/goal_odds.py` ("vol" paths, modelled as a buy at the 11/5 close with 9 checks; a buy at the 11/6 14:43 check would have 8) and `scripts/ov_1105.py`, which runs the committed ov_backtest engine over 9 sessions.

## 1. Goal odds (equity $1,384.84, SPY B&H $1,911.68)
| Contract (bid/ask, Δ, OI) | Stop | P($2,200) | P(beat SPY) | P(<$1,000) | EV/$ |
|---|---|---|---|---|---|
| SPY261204C00750000 (9.45/9.61, 0.37, OI 449), $961 | -50% | 26.8% | 28.5% | 52.9% | 1.016 (0.98-1.06) |
| same | none | 27.9% | 30.2% | 41.5% | 1.034 |
| SPY261218C00750000 (12.43/12.66, 0.40, OI 31,027), $1,266 | -50% | 29.2% | 31.7% | 44.2% | 1.028 |
| same | none | 29.7% | 32.5% | 37.9% | 1.041 |
| 2x SPY261204C00759000 (5.70/5.85, 0.27, off-band), $1,170 | -50% / none | 34.5 / 37.5% | 35.3 / 38.9% | 56.8 / 45.9% | 1.03 / 1.06 |
| Cash | - | 0% | 0.0% | 0% | - |

* **Unaffordable or illegal:**
  - Two contracts in the 0.35-0.40 band would cost $1,922 or more, above our cash.
  - Every QQQ call in the band costs at least $1,398 (12/04 670C at 13.70/13.98), so it was not run.
  - No 12/04 call in the band has OI of 1,000 or more.
  - 12/18 is 43 days out, past the 5-week limit.
* **The edge vanishes on raw paths.** EV/$ falls to 0.88 for the 12/04 call and 0.94 for the 12/18 call.
* **Cash** beats SPY only if SPY falls another 27.6%.

## 2. Vol ideas: none pass
* **Implied vs realized:** the 12/04 750C's IV of 19.1% sits under "fair". Fair, the median realized vol over the next 9 sessions as a multiple of VIX, is 20.3% on all days, 22.0% when VIX ≥ 25 and 23.4% when VIX ≥ 25 with VIX9D > VIX3M (post-hoc, n 229).
* **That gap is not an edge.** After delta-hedging the payoff is 0.995 (t -0.3), 0.974 and 1.007 for those three groups.
* **The gains are beta.** Holding unhedged pays 1.13-1.29, which is market drift, not vol. Our exits return 0.95-0.99.
* **Kelly:** full Kelly is $0 on our exits, and $197-377 on hold-to-11/18 against $961 for one contract. The 12/18 calls fail too.
* **QQQ:** the hedged payoff is 0.92-0.94.
* **Puts** carry the premium (D1).

**Consensus:** a generic AI would say "buy the VIX-spike dip" or "sell rich premium". Selling is barred, and buying shows no measured edge.

## 3. Second variance bet (input, not a recommendation)
* **What it buys:** one 12/04 750C lifts P(beat SPY) from 0% to 28-30% and P($2,200) from 0% to 27-28%.
* **What it costs:** P(<$1,000) rises from 0% to 42-53%. With the stop it is 53%, because a -50% stop leaves about $904.
* **EV:** about 1.0, with no edge. Its CI includes 1.
