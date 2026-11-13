# Risk, 2026-11-12

**O023: MODIFY.** Correct: line 93.84 (0.92 x 102.01 = 93.8492, rounded down), exit, k 1.0 R1 numbers.
1. IV gate 58.35% (1.3 x 44.89%), not 58.4%.
2. Limit: the ceiling at the chosen strike's live IV, taking the higher-IV row between rows. Not a flat 2.65.
3. Approved alternates, each in band and through every gate: 92.5P, 87.5P, 85P, plus 82.5P (cheapest at -15%, cat1112/run1.txt).
4. Delete the k 0.84 pair, which no script outputs.
5. CSCO is 0.60% of SPY (SSGA 11/11), not 0.3%.

**O022: MODIFY.** Sell only after O023 passes live. Size: min(cost + $1, whole holding). If the put fails, hold the cash and rebuy SGOV Monday.

Nothing in the memos stops the check.
