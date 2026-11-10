# Options-vol, Tue 2026-11-10 (Run B)

**No option trade Wednesday.** No C1 name reacts Wednesday: CRWV is outside the 25-name sample, and NVDA's -5.5% came from the probe, not an earnings gap. Without C1, buying options fails D1: IV > RV on 84-85% of days, and SPY puts return 0.73-0.78 per $ (ov_1108.py). NVDA 12/11 160P asks 7.70 (Cboe), which is $770 against the $265 reserve. Anthropic link: NVIDIA is putting $10B into ANT's placement.

## C1 ceiling for the CSCO 12/18 put ($1,379.57 equity, $265.08 reserve)
| k = IV/RV20 | 14 DTE | 35 DTE |
|---|---|---|
| 0.90 | 2.48 | 2.65 |
| 1.00 | 1.83 | 2.62 |
| 1.10 | 1.17 | 1.86 |
| 1.20 | 0.48 | 1.03 |
| 1.30 | 0.00 | 0.17 |

Engine: research/2026-11-09/scripts/ov_1109.py q1, unchanged except the two constants. EV is 1.104/$ at k 1.0, 35 DTE (n 216); P(f*=0) 2%.

- **Facts for 14:43:**
  - RV20 is 44.1% (CSCO 98.15, quotes.py closes, yahoo+cboe).
  - At a -8% gap, the cheapest in-band put fits only at k ≤ 0.81 (IV ≤ about 36%).
  - Tonight's pre-print IV is 47-50% (Cboe).
- 12/18 is still the only expiry with OI ≥ 1,000.

**Who loses:** CSCO holders after a miss. **Consensus:** buy the dip; this does not match.
