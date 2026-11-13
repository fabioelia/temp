# Options-vol, Wed 2026-11-11 (Run B)

**No option trade Thursday. CSCO C1 (Fri 14:43): IV must fall about 15 points for one 12/18 put to fit.**

Engine: ov_1109.py q1 at equity $1,393.59 and reserve $265.05 (scratchpad `ov1111/run_1111.py`). Sources: Cboe delayed chain at 11/11 22:17 UTC; CSCO 100.76 (quotes.py, yahoo+cboe).

| k = IV/RV20 | ≤1.00 | 1.10 | 1.15 | 1.20 | 1.25 | 1.30 |
|---|---|---|---|---|---|---|
| 12/18 ask ceiling | 2.65 | 1.88 | 1.46 | 1.05 | 0.63 | 0.17 |

- **RV20:** 45.70% to 11/11. Rolled flat to 11/12 it is 44.52%. The 1.3x gate is 57.9%.
- **Tonight:** 87.5-100P IV is 47.1-50.5% (k 1.06-1.13). Band spreads are 7-18%, so none passes 5%. Only 12/18 has OI ≥ 1,000.
- **Fit:** at the -8% line (~92.70) the 90P fits only at IV ≤ 34-36%. At spots from 80 to 95, nothing fits above 45.2%. Ex-event IV is 33.6%.

**Who loses:** CSCO holders after a miss. **Consensus:** buy the dip; no match.
