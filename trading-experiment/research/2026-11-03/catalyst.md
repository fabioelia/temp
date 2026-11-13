# Catalyst memo (Tue 2026-11-03)

**Verdict:** no C1 tonight. QCOM stays conditional for Thu (conf 2). Figures come from scratchpad `cat1103/catalyst_1103.py` (a rerun of `2026-11-02/scripts/catalyst_1102.py`) unless cited.

## AMD: up gap, so no C1
- **Exhibit 99.1 (EDGAR):**
  - Revenue $13.38B (+45%); Data Center $8.5B (+97%).
  - EPS $2.09 vs $1.89 estimated (Robinhood).
  - Q4 guide about $17B vs $16.23B (LSEG, via Investing.com).
  - FCF $554M (vs $1,530M); inventories $11.46B (vs $7.92B).
- **After hours:** 516.24-519.50 (Robinhood, 17:17-17:20 ET) vs the official 483.90 close (Yahoo, Cboe), +6.7% to +7.4%. The brief's 484.50 is Robinhood's last trade.
- **Anthropic link (disclosed):** the release names Anthropic as a Helios customer.

## QCOM (Cboe 2026-11-03 21:24:53 UTC; close 164.43)
- **RV20:** 52.1% to 11/3, 51.7% flat to 11/4 (52.6-53.1% if 11/4 moves ±3%); gate 67.3%.
- **Implied:** expected move 8.5%; P(-8%) 22.4%. The post-gap put IV of 47.8-55.6% (0.92-1.07x) passes the gate.
- **Kelly (11/20, 15 DTE):**
  - At 0.92x: full $336, half $168, quarter $84. At 1.07x: full $197.
  - After a gap: -8% 145P $311 fits only at 0.92x; -10% 145P $429 and -12% 140P $346 do not.
  - **Binding:** full Kelly covers a contract only at IV 42.5-49% (0.82-0.95x).
  - Ask cap: 44% 3.98; 46% 3.64; 48% 3.31; 50% 2.92.
- **Spread fails:** the 11/20 band runs 5.4-6.7%; 145P 2.63/2.82 is 7.0%, 140P 7.7%, 150P 8.9%.
- **OI:** 11/20 130-160P 1,262-4,805 pass (152.5/157.5/162.5 fail); 11/27 and 12/04 fail.

## Other prints Wed/Thu (Robinhood calendar)
- No other 25-name sample stock.
- Outside the sample:
  - ARM ($216B, Wed pm), AZN ($285B, Thu am, date unverified), TM ($278B, Thu am).
  - MCD, NVO, UBER, COP, SONY ($136-186B).
- ARM's band is liquid (spreads 0.8-2.0%), but a post-gap put costs $579-870 against full Kelly of $197-388.

## Ranked
1. **QCOM261120P00145000**, 2.63/2.82 (Cboe), conf 2.
   - **Trigger (11/5 14:43):** QCOM ≤ 0.92 × its 11/4 close; the cheapest 11/20 put with delta 0.30-0.45, OI ≥ 1,000, spread ≤ 5% and ask ≤ the cap; 1 contract.
   - **Exit:** 11/12 14:43, -50% backstop, no take-profit.
   - **Edge:** 62% continue; EV 1.29/$. A generic AI would skip the print, so no match.
2. **ARM261120P00180000:** shadow only.

Rerun on 11/4.

*Sources: EDGAR, Robinhood, Cboe, Yahoo, Investing.com.*
