# Catalyst memo (Mon 2026-11-02)

**Verdict:** no C1 for AAPL or AMD. QCOM has one conditional put for Thu (conf 2). Figures: `scripts/catalyst_1102.py` unless cited.

## AAPL: no C1
- **The print beat** (exhibit 99.1): revenue $114.5B (+12%), record Services $31.57B. EPS $2.10 vs $1.98 estimated (Robinhood), including $0.05 of tariff refunds. Revenue beat per headlines (Reuters).
- **After hours:** 337.26-338.50 (Robinhood, 17:16-17:23 ET) vs the 338.32 close, so flat. The -8% line is 311.25.
- **The gate also fails:** 21.0% vs an expected put IV of 25-29%.

## AMD: no trade
- **Drop:** no filing (EDGAR); a steady fade.
  - SMH's -2.8% at beta 1.35 explains -3.7%; the residual is -4.1%.
  - It fits the Intel PC warning still spreading (INTC -8.8%, DELL -7.4%, MU -5.8%) and Melius target cuts (CNBC, via Gokhshtein). But NVDA, AVGO and QCOM, also cut, fell only 1.2-1.6%.
  - The Marvell/Lumentum read-across is weak: MRVL -12.7%, AVGO -1.2%.
- **RV20:** 72.7% (71.2% flat to 11/3). The gate is 92.6%, and the expected post-gap IV of 59-68% passes it.
- **Kelly:** no put sizes to one contract.
  - 11/20: the cheapest band put after a -8% to -15% gap costs $1,095-1,551, vs full Kelly of $312-432.
  - 11/27: band OI is 40-133.
  - Full Kelly would cover a contract only at IV ≤ 40%.
- The official close is 466.84 (Yahoo, Cboe), not the 466.74 the brief has from Robinhood's last trade.

## QCOM (Cboe 2026-11-02 22:20:30 UTC; close 162.08)
- RV20 51.3% (flat to 11/4), gate 66.7%. Expected post-gap IV 48-56%; P(-8% day) 23.6%.
- **IV cap:** full Kelly covers the cheapest 11/20 band put only at 0.85-0.97x RV20 (43.5-50%). The maximum ask by multiple: 0.86x 3.93, 0.90x 3.60, 0.94x 3.21, 0.97x 2.88.
- **Spread:** every 11/20 band put is over 5% tonight (5.8-8.7%).
- **OI:** 11/20 135-150P have 1,261-4,724 (pass); 11/27 has 132-251 (fails).

## Ranked
1. **QCOM261120P00145000**, 3.30/3.60 (Cboe), conf 2. Take the 140P or 150P if that one passes instead.
   - **Trigger (14:43):** QCOM ≤ 0.92 × 11/4 close; delta 0.30-0.45; OI ≥ 1,000; spread ≤ 5%; ask within the cap.
   - **Exit:** 11/12 14:43, -50% backstop.
   - **Edge:** 62% continue; EV 1.27/$ at 0.94x. It matches neither consensus view.
2. **AMD and AAPL:** shadow only.

Rerun 11/3 and 11/4; caps are RV20 multiples.

*Sources: EDGAR; Robinhood; Cboe; Yahoo; 24/7 Wall St.; Gokhshtein.*
