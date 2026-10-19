# Risk memo (red team), Mon 2026-10-19 post-close, Run B

Basis: the brief's closes and 3.58 mark. Levels are my Black-Scholes (IV 12.1%, which fits the mark). MSFT chain from quotes.py (Cboe delayed, 17:3x ET). Sizing per `live.py` lines 196-201.

| SPY where the bid hits 1.87 | 10/20 | 10/23 | 10/27 | 10/30 |
|---|---|---|---|---|
| | 757.7 | 760.0 | 763.2 | 765.8 |

- **a) APPROVE.** A -60% stop moves the line only ~2.8 points, about one day of theta. b) can't replace it, because a) is the tighter line after 10/23.
- **Whipsaw:** the 60% is the index's odds. On the flush path (SPY 748 by 10/23, call ~1.0), even SPY 785 on 11/4 is worth only ~6.2, below the 7.50 target. So the stops cost little.
- **b) MODIFY.** Judge both legs on the 14:43 print, not intraday.
  - Failure path: Thu 10/22, META/TSLA push the Nasdaq below 26,023 at the open (QQQ needs only -1.55%), and it recovers by 14:43 with SPY at 766.
  - b) sells at ~3.06. If SPY reaches 780 on 10/27, the call is worth ~6.2.
- **c) APPROVE.** At SPY 767 on 10/27 it sells at ~2.53. With SPY flat, a) fires by ~10/30 anyway.
- **d) APPROVE. e) APPROVE.** Judge "record close" on closes through 11/3.
- **MSFT tree: MODIFY.**
  - Order with `--qty 1 --max-price 3.60`. `--usd 365` buys 2 contracts at any ask ≤1.82, and the 580C gets there if MSFT falls to ~520.
  - Take the lowest strike ≥8% OTM that passes the filters, not a fixed 580. At MSFT 520, the 580 is 11.5% OTM.
  - At 15:30, read the 10y from ^TNX. Treasury's curve posts after the close.
