# Options-vol, Thu 2026-11-12 (Run B)

**CSCO C1, Fri 14:43: a put fits only at live IV ≤ about 38.5% at -8%, 41% at -10% and 43.6% at -12%.**

- **RV20 to 11/12:** 44.89% (Yahoo; 102.01 matches quotes.py), so the gate is 58.4%.
- **Chain:** Cboe 15:59 quotes, which are pre-print and stale. Only 12/18 has OI ≥ 1,000; the weeklies' maximum is 553. Every 12/18 put fails the 5% spread.
- **Band strikes:** 90P/92.5P at -8%; 87.5P/90P at -10%; 85P/87.5P at -12%.
- **Post-gap IV guess:** 37.9-44.1%.
- **Ceiling:** ov_1108.py, $1,389.81 equity, $265.08 reserve.

| IV | ≤44.7% | 47.5% | 50% | 52.5% | 55% | ≥59.3% |
|---|---|---|---|---|---|---|
| Ask ≤ | 2.65 | 2.19 | 1.77 | 1.32 | 0.83 | 0 |

- **R1 numbers (n 216):**
  - Break-even win rate: 35.4% at k 1.0 against 44.0% estimated.
  - Drift-matched baseline: holding the stock over the same 5 sessions returned -0.54%.

**Who loses:** CSCO holders (under 1% of VOO). **Consensus:** buy the dip; this does not match.
