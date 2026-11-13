# Catalyst memo (Wed 2026-11-04)

**Verdict:** QCOM is a conditional C1 for Thu 11/5 14:43 (conf 2). Kelly or the spread rule will probably block it. Figures come from `scripts/catalyst_1104.py` and `scripts/fit_1104.py` (committed by the orchestrator; the data stays in the scratchpad `cat1104/`) and sizing.py runs.

## The print (8-K Ex-99.1, EDGAR; consensus via Reuters/Globe and Mail and Quartz)
- **Q4 beat:** revenue $10.44B vs $10.11B; EPS $2.17 vs $2.16. Handsets missed at $5.14B (-26%) vs $5.25B.
- **Q1 guide:**
  - Revenue $10.4-11.2B, above the $10.48B consensus.
  - EPS midpoint $2.25 vs $2.27 (LSEG) or $2.32 (Bloomberg).
  - Input-cost margin squeeze; no Apple sales in the guide.
- **Read:** a mild EPS guide-down, mostly sell-the-news.
  - After hours, QCOM is 159.00 (Robinhood 17:20 ET), only -3.3% vs 164.43, the close before the +5.3% run-in.
  - C1 is mechanical, so this does not gate the trade.

## Trigger (14:43)
- QCOM ≤ 159.33. Buy 1 of the cheapest 11/20 put that has:
  - delta 0.30-0.45, OI ≥ 1,000, spread ≤ 5%;
  - IV ≤ **72.0%** (1.3 x RV20 of **55.4%** to 11/4; it was 52.1% to 11/3, Yahoo);
  - ask ≤ the ceiling below.
- **Strikes:** near 159 that is the 155P (OI 2,088); the 150P fits only at about 157 or lower. 152.5P (OI 139) and 157.5P (958) fail OI.
- **Exit:** 11/12 14:43, -50% backstop, no take-profit.

## Sizing
The quotes are stale: they are from 15:59, before the print (155P 3.05/3.90, Cboe and Robinhood). The expected post-gap IV is 46.7-54.3% (0.84-0.98x).

| IV/RV20 | Full Kelly, 15 DTE | sizing.py (25 DTE) |
|---|---|---|
| 0.84x | $405 | $477 |
| 1.00x | $262 | $324 |
| 1.15x | $124 | $172 |
| 1.25x | $29 | $67 |
| 1.30x | $0 | $10 |

- **Ask ceilings by IV:** 44% 4.48, 46% 4.15, 48% 3.82, 50% 3.53, 52% 3.20, 55% 2.67, 60% 1.86, 64% 1.14.
- **At the line:**
  - The 155P model ask is about 4.01 at 46.7% IV, so it fits only at IV ≤ 46.5%.
  - At 54.3% IV it is about 4.96. No.
- **Spread:** the 11/20 band ran 5.4-6.7% on 11/3.

## Others
- No other name in the 25-name sample reports (Robinhood calendar).
- MELI is -8.3% after hours, outside the sample; FICO and EXPE are small; APP is up.

**Ranked:** 1. QCOM261120P00155000.
- **Edge:** 62% continue; EV 1.40 at 0.84x.
- **Consensus:** a generic AI would skip it, so no match.
