# Options-vol, Mon 2026-11-09 (Run B)

**No option trade Tuesday. CSCO C1 (Fri 11/13): one 12/18 put, ask ≤ min(full Kelly/100, 2.65).**

Sources: Cboe delayed chains (quotes.py, 11/9 closing quotes); CSCO 98.65 (quotes.py closes, yahoo+cboe); brief snapshot. Script: scratchpad `ov1109/ov_1109.py` (ov_1108 engine, n 216).

## 1. CPI: no idea can pass
- **The earliest fill is Tuesday's close, after the print.** The 11/10 straddle would also be 0DTE and two legs, outside the rules.
- **It is priced:** SPY 753 straddle 6.08 mid (Cboe) = 0.78%, about 1.05x an average ^VIX day. One costs $610; the reserve is $265.
- **Average-day baseline:** 0.95 per $ (n 9,273). No CPI-date history: BLS and ALFRED would not load.
- **D1 holds:** IV > RV on 84-85% of days.

## 2. C1 ceiling ($1,383.25 equity, $265 reserve)
| k = IV/RV20 | 14 DTE | 35 DTE |
|---|---|---|
| 0.90 | 2.49 | 2.65 |
| 1.00 | 1.83 | 2.63 |
| 1.10 | 1.18 | 1.87 |
| 1.20 | 0.48 | 1.04 |
| 1.30 | 0.00 | 0.17 |

- **Fact for 14:43:** today's +5.1% lifted RV20 from 38.9% to 44.2%.
  - At the -8% trigger (90.76), the 87.5P (Δ0.34) fits only at k ≤ 0.85: IV ≤ about 37.5%.
- 12/18 is still the only expiry with OI ≥ 1,000.

**Who loses:** CSCO holders after a miss. **Consensus:** buy the dip; this does not match.
