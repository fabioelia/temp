# P1-P3 premium selling (2026-11-07)

These are the `claims.md` tests on the review's model (`scripts/premium_selling.py`). Chains: Cboe, 11/06 close. T-bills pay 4.0% ($55/yr on $1,385).

| ID | Verdict | Deciding numbers |
|---|---|---|
| P1 cash-secured put | **REJECTED** (for us) | No ETF passes. Best stock by the fixed rule: AAL 12P. Excess over T-bills +1.5%/yr (t 0.27): -12.5% before 2010, +5.0% after, -3.4% over the last 5 years. F -0.9%, RIVN -2.0%, NOK +3.5%, RIG +4.1% (all t < 1.2). SPY passes (+3.4%, t 3.2) but needs about $70k |
| P2 covered call | **WEAK** (F) | Sharpe 0.30 vs 0.25 for the stock (t 1.1); +0.02 since 2010; return 12.4% vs 14.1%/yr. ATM variant and MARA: REJECTED. RIG decays after 2010 |
| P3 SPY 0.20/0.10 put spread | **UNTESTABLE** (model only) | +0.082 per $ of risk per 30-day trade (t 7.3), 89% wins, 5.6% max losses. **At today's real skew (post-hoc): +0.015 (t 1.7), last 5 years +0.001** |

## Feasibility and concentration
Both strategies need an underlying at or below about $13.85.
* Liquid ETFs trade above it; UNG, BITO and TSLL fail the OI and spread screen.
* Only single stocks pass: AAL, F, RIVN, NOK and RIG for puts; F, RIG and MARA for calls.

One contract ties up 36-90% of the account in one company:
* AAL's worst 30-day put lost 58% of collateral (Feb 2020), and its monthly chain fell 77% from peak to trough. SPY's worst was -30%.
* On 11/05, AAL fell 5.1%.

## Evidence
* **Cboe PUT** (daily history 2007-2026) vs the S&P 500 total return:
  * CAGR 7.0% vs 10.7%;
  * Sharpe 0.54 vs 0.64, and 0.70 vs 0.88 since 2010;
  * max drawdown -33% vs -51%.

  Bondarenko (2019): Sharpe 0.65 vs 0.49 over 1986-2018. The premium buys lower volatility, not more money.
* **Cboe BXM** (2002-2026): CAGR 6.3% vs 10.2%; Sharpe 0.46 vs 0.62. Callan (1988-2006): 11.77% vs 11.67% at two-thirds of the volatility.
* **Israelov & Nielsen (2015), 1996-2014:**
  * BXM Sharpe was 0.37 vs 0.32.
  * Short volatility: Sharpe 0.98, but only 7% of the risk.
  * An uncompensated equity-reversal bet: 26% of the risk.
  * Downside beta 0.85 vs upside 0.46.
* **Model bias:** in-model SPY covered calls look strong (Sharpe 1.05 vs 0.58) only because calls are priced at VIX, not the real ~0.7x VIX. The index numbers override it.

## P3 tails and 11/05/2026 (SPY -4.41%, VIX 16.6 to 28.2)
* **Tails:** the worst month loses 100% of risk. In the one-at-a-time chain, 33 of 440 months lost at least half the risk.
* **11/05:**
  * A spread opened at the 11/04 close (739/724) lost 0.45x its risk that day, -$585 of $1,301.
  * Of the 21 open spreads, 15 had the short strike breached.
* **It no longer fits:** today's Dec-4 695/660 spread risks $3,209, more than the account.

## In dollars
* **AAL put:** about $42 gross per 42 days. The edge over T-bills is about +$18/yr, statistically zero, and -$41/yr over the last 5 years. A bad month costs about $700.
* **Bottom line:** none of P1-P3 gives this account a tested way to make money. The variance risk premium is confirmed only on the index, which the account cannot afford to sell.

*Post-hoc: skew re-pricing, 11/05 marks. Bondarenko is cited from Cboe's summary via search (www.cboe.com unreachable). The Callan and Israelov-Nielsen PDFs were read in full.*
