# Historian memo, Sun 2026-11-01

**Sources.** Yahoo daily closes to 10/30 (fetched 11/01 18:40 ET). Cboe delayed chain stamped 11/01 22:21 UTC, holding the 10/30 close (`quotes.py` 18:48 ET). Scripts: `scripts/historian_*.py`.

## 1. Odds, 10/30 to 11/18 (13 sessions)
**A:** the NDX 7-11% below its 252-day high (now 9.1%; 96 episodes since 1986). **B:** A with the S&P within 5% of its high (now 3.0%; 67 episodes). CIs are episode-bootstrap.

| | All days | A | B |
|---|---|---|---|
| QQQ median (p10, p90) | +1.2% (-5.4, +6.5) | +1.9% (-4.9, +7.3) | +1.8% (-4.9, +6.8) |
| SPY median (p10, p90) | +0.8% (-3.7, +4.2) | +1.2% (-3.4, +5.0) | +1.0% (-3.1, +4.0) |
| **P(SPY at or below -2.59%)** | 14.9% | 15.0% (10-20) | 13.2% (8-19) |
| P(delta-0.40 call doubles), SPY / QQQ | 27 / 35% | 34 / 39% | 32 / 45% |
| EV per $, held to 11/18 | 1.04 / 1.20 | 1.22 / 1.44 | 1.14 / 1.55 |
| EV per $, 1-lot exit | 0.90 / 0.91 | 0.94 / 0.95 | 0.93 / 0.95 |

* **Calls:** SPY261130C00768000 (ask 8.40, IV 0.138) and QQQ261130C00707000 (ask 12.53, IV 0.226).
  - Paths are scaled to ^VIX 19.42 and ^VXN 28.50.
  - The model enters at Friday's quotes and checks closes only.
* **To double:** SPY needs +2.4-3.2% and QQQ +3.9-5.2%.
* **Cash beats SPY about 15% of the time, not 25%.** The vol-scaled models give 13-17%, and the Cboe put spread prices 18% (risk-neutral).
* **No edge:**
  - The dip excess is t 1.3 for A and t 0.4 for B.
  - The SPY EV CI (0.96-1.11) contains 1, and EV falls to 0.95 once the bull-market drift is removed.

## 2. Ideas for 11/2-11/6
1. **No trade.**
   - *C1 puts:* full Kelly ($326 at 1.0x RV20, $67 at 1.25x) never covers one contract after an 8% gap: AAPL about $295-386, QCOM $530+, AMD $2,200+. AAPL passes only at an IV of about 1.0x RV20 (14.5%), and its puts now quote IV 0.32-0.37.
   - *Index calls:* Kelly is $0 with the standard exit. Held to 11/18, full/half/quarter Kelly is $62/31/16 (SPY 770C) and $240/120/60 (QQQ 710C). Both are under one contract.
   - *Consensus check:* "buy the dip" has no measured edge.
2. **Goal-budget shadow:** 1 SPY261130C00770000 (bid 7.37, ask 7.47; Cboe 10/30).
   - Buy Mon 14:43 at an ask of 7.85 or less.
   - Sell at the first 14:43 check with equity of $2,200 or more (bid 10.30 or more); otherwise sell 11/18. No stop.
   - Confidence 2.

## 3. The owner's choice
* **Cash:** P(ahead of SPY) about 15% (13-18%); P($2,200) 0.
* **Goal budget, one SPY 770C ($747), sold at $2,200:**
  - P($2,200) about 50% (47-57%); P(ahead of SPY) about 55% (49-60%).
  - Cost: a 32-40% chance of finishing below $1,600 (worst case $1,171). The expected finish ($1,890-2,010) is about today's equity.
  - A QQQ 710C ($1,123) gives 46-71%, with a worst case of $795.
* Neither path is an edge. The bet buys the goal with downside, and cash loses to a rising SPY 85% of the time. The owner chooses the risk.
