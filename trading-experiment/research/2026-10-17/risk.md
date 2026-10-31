# CRO / Quant memo: odds, sizing, fees, traps (2026-10-17)

**Verdict:** 2x in a month is a 0-5% event for any plausible strategy. The aggressive version also carries a 2-14% chance of losing half. Run it as "beat SPY with controlled risk" and treat 2x as a free lottery ticket.

## 1. The math
- 23 fill days, but the first fill (Mon 10/19 close) earns no P&L, so there are **22 return days**. 2x needs **+3.20%/day compounded**.
- Full Kelly reaches an *expected* doubling only at annualised Sharpe ~4.0. "54% win, 1.5:1" is +0.35R per trade, roughly Sharpe 2.7. That is elite, not "small."
- Monte Carlo: 200k paths, Student-t(4) tails, 3bp/day cost drag, 3x ETFs reset daily (decay built in).

| Strategy (daily vol) | Zero edge: P(≥$4k) / P(<$2k) / P(<$1k), % | Sharpe 1 | "54%/1.5:1" (Sharpe 2.7) |
|---|---|---|---|
| A. 1-2 hi-beta names (3%) | 0.0 / 54 / 0.0 | 0.0 / 42 / 0.0 | 0.0 / 24 / 0.0 |
| B1. 3x broad ETF (5%) | 0.1 / 56 / 0.6 | 0.3 / 43 / 0.4 | 1.0 / 25 / 0.2 |
| B2. 3x semis ETF (6.5%) | 0.7 / 56 / 2.4 | 1.4 / 44 / 1.4 | 4.4 / 26 / 0.6 |
| C. 4-5 diversified (1.75%) | 0.0 / 55 / 0.0 | 0.0 / 43 / 0.0 | 0.0 / 24 / 0.0 |

- **What it takes:** a 10% chance of 2x needs Sharpe 2.7 and ~8%/day vol (~125% annualised). With zero edge, 11%/day vol gives 5%, with a 14% chance of ending below $1k.
- **Trade-model check** (8 all-in trades, +1.5R/-1R, 54%): risking 10% per trade gives 5.6% / 28% / 0.2%. Risking 15% gives 20% / 28% / 2.1%. The same 15% on a coin flip gives 3.5% / 64% / **14%**.
- **Luck:** under zero edge, B2 has an 18% chance of +25% or more and 21% of -25% or worse. The SD of the 22-day return is A 14%, B2 30%, C 8%, SPY ~5%. Rejecting "no edge" at 5% in 22 days needs Sharpe ~5.8. Proving a true Sharpe of 1 takes ~2.7 years. **One month proves nothing about AI skill.**
- **Scoreboard:** excess return vs 100% SPY on the same $2,000; alpha/beta from daily marks; return/vol and Sortino; max drawdown; hit rate; payoff ratio; R-expectancy; cost and turnover; share of P&L from the best trade; rule breaches. Pre-log every thesis, stop and target.

## 2. Sizing and risk rules
- Zero edge means Kelly is 0. At Sharpe 1 and 3% vol, full Kelly is 2.1x equity; at Sharpe 0.5 it is ~1.0x. With no margin and an unknown edge: **gross exposure ≤1x, half-Kelly, 3x ETFs counted at 3x notional.**
- P(2x) rises with variance; the median falls with it. Fix the scoring function before sizing.
- **Per trade:** planned risk to the closing stop ≤1.5% of equity (~$30) core, ≤2.5% (~$50) satellite. Assume a realised stop of 1.5x planned (2x for 3x ETFs).
- **Portfolio:** open risk to stops ≤8%; max 5 positions; ≤25% in any name.
- **Day:** a close-to-close loss of -6% means no new buys next day and exposure cut to ≤50%.
- **Breaker:** -15% from peak halves exposure; -25% goes to cash/SPY until a committee vote. In the sim, for B2 this cut P(<$1.5k) from 21% to 16% and P(<$1k) from 2.4% to under 0.4%, with 2x odds unchanged.
- **Correlation:** AI/semis/Nasdaq beta is one factor, capped at 40% of equity (leveraged ETFs at 3x).
- **Cash:** go to 50%+ after two stop-outs in a week, or ahead of FOMC 10/27-28 (unverified), megacap earnings 10/26-30, and midterms 11/3.
- **Deployment:** Mon ≤30% (core only), Tue +25%, Wed +25%, 20% reserve. Staging was not simulated.

## 3. Fees and realism
I could not fetch robinhood.com or sec.gov directly, so these figures come from search extracts of the cited pages.
- (a) **Commission $0.** **SEC Sec. 31: $20.60 per $1M of sales, effective 4/4/2026**; it was $0.00 until 4/3/2026. Robinhood rounds it up to the cent and waives it on sales of $500 or less, so a $2,000 sale pays $0.05. **FINRA TAF: $0.000195/share, max $9.79/trade, waived on sales of 50 shares or less** (2025: $0.000166 / $8.30). **CAT:** Robinhood's SG page says it stopped 12/1/2025. The US page text conflicts, and exchange rulebooks show $0.000001/share (immaterial). A full liquidation costs ≈$0.05-0.07 in fees, about 0.3bp. **Slippage is the real cost**: 100% turnover every 3 days costs ~0.7%/month at 5bp/side and ~4.4% at 30bp.
- (b) Typical US equity ETF spreads are 2-20bp (median 9). Leveraged ETPs average 0.29% (median 0.32%). TQQQ, SOXL, SPY and mega-caps are probably 1-3bp (**unverified**). 5bp is fair in calm markets but optimistic in stress.
- (c) Fractional: exchange-listed only, usually price >$1 and market cap >$25M; "not all securities are eligible." **Leveraged/inverse ETF eligibility is unverified**, so check the ticket and plan on whole shares.
- (d) T+1 settlement. Cash accounts can't trade with unsettled funds, so sell Monday and buy Tuesday; same-day recycling risks a good-faith violation (90-day restriction: weak source, **unverified**). **PDT:** the SEC approved FINRA's Rule 4210 rewrite on 4/14/2026, removing the $25k minimum and 4-trade flag. It took effect 6/4/2026 with broker phase-in to 10/20/2027. It never applied to cash accounts.
- (e) Tax: short-term gains are ordinary income; assume **24% federal** (single, 2026 taxable income $105,700-$201,775). A doubling nets $2,000 - $480 = $1,520.
- (f) No NYSE holiday from 10/19 to 11/18: 23 full sessions, 9:30-16:00 ET. Veterans Day (Wed 11/11) is not an NYSE holiday (confirm on nyse.com). Thanksgiving is 11/26 with a 1pm close 11/27, both outside the window. DST ends Sun 11/1: the US close moves from 20:00 to 21:00 UTC.

## 4. Trap list
1. **Close-only fills and gaps.** Signals decay a day and stops gap through. *Safeguard:* size to 1.5-2x planned risk; stops ≥1.5 ATR.
2. **Stale search prices.** *Safeguard:* each ticket carries the source and timestamp of the official close, a second-source check within 0.5%, and rejection if the price is over a session old.
3. **Leveraged-ETF decay.** 3x on a 2-2.5%/day underlying loses 2.6-4.1% of NAV in 22 days; a -33% drop needs +50% to recover. *Safeguard:* hold ≤5 sessions, ≤25% of equity, never average down.
4. **Overtrading.** *Safeguard:* ≤2 trades/day by default, weekly turnover ≤150%, a 2-session lockout after a stop, a written thesis before every ticket.
5. **Correlated bets and a lucky scoreboard.** NVDA + SOXL + TQQQ is one bet. *Safeguard:* the factor cap, and judge process and excess return, not ending equity.

## 5. Portfolio template (no ticker calls: no verified prices, search budget exhausted)
- **Core 40-50%:** 2 liquid, beta 1-1.3 ETFs or mega-caps, staged in, -7% close stop.
- **Satellite ≤30%:** 1-2 high-beta names, or one 3x ETF at ≤15% (counts as 45%).
- **Cash ≥20%** in week 1, ≥10% after.
- **Realistic target:** +5-15% ($2,100-2,300).

## Sources (accessed 2026-10-17)
- Robinhood fees: https://robinhood.com/us/en/support/articles/trading-fees-on-robinhood ; SG (CAT): https://robinhood.com/sg/en/support/articles/trading-fees-on-robinhood/
- SEC fee advisory 2026-2 (Release 34-104909, 2026-02-27): https://www.sec.gov/rules-regulations/fee-rate-advisories/2026-2
- FINRA TAF 2026: https://help.revolut.com/en-IT/help/wealth/order-execution-fees-and-limits/trading-regulatory-fees/ ; https://investrade.com/commissions-fees/
- CAT fee 2026-1: https://listingcenter.nasdaq.com/rulebook/phlx/rules/Phlx%20General%207A
- Fractional shares, customer agreement (rev. 2026-10-01): https://robinhood.com/us/en/support/articles/fractional-shares ; https://cdn.robinhood.com/assets/robinhood/legal/Robinhood-Customer-Agreement.pdf
- Settlement: https://robinhood.com/us/en/support/articles/settlement-and-buying-power/
- PDT: https://international.schwab.com/story/sec-approves-scrapping-25000-day-trader-minimum ; https://www.quantinsti.com/articles/finra-pdt-rule-removal-2026/
- NYSE calendar: https://www.nyse.com/trade/hours-calendars ; https://www.businesswire.com/news/home/20251223981478/en
- Spreads: https://www.etf.com/sections/news/why-trading-spreads-matter-etfs ; https://www.investmentexecutive.com/report-cards/etf-guide/key-insights-about-bid-ask-spread-costs/
- 2026 tax brackets (Rev. Proc. 2025-32): https://q3adv.com/federal-income-tax-brackets-2026/
- Monte Carlo code: /tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/mc.py and mc2.py
