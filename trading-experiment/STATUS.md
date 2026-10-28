# Paper-trading scoreboard (as of 2026-10-28)

> SIMULATION. No real money. Prices come from public web sources; fills are modeled at the close with slippage and fees (see RULES.md).

**Equity $1,919.92** | P/L -$80.08 (-4.00%) | goal $2,200.00 by 2026-11-18 | -40.0% of the way
- Cash $1,919.92 | realized -$80.08 | fees paid $0.08 | slippage cost $25.00
- SPY buy-and-hold with same $: $2,014.21
- Trading days left: 15 | needed per day to hit goal: +0.91%
- Est. after-tax equity if liquidated (memo, 24% on gains): $1,919.92

## Positions

_All cash._

## Pending orders (fill at next close)

- O008 buy GOOGL261120P00280000 qty=1.0 stop=50.0% target=50.0% :: CONDITIONAL, conf 2 (catalyst + options-vol, red-team MODIFY applied). GOOGL post-earnings continuation after a real revenue miss (10/28 8-K; ~-10.5% after hours to 290.87). Confirm at the 10/29 14:43 check ONLY if all hold on live quotes: GOOGL <= 308.65 (-5% vs the 324.89 close) AND below its 10/29 open; standing gates ^TNX <= 5.10, core PCE m/m < 0.40%, ^VIX <= 22, HY OAS < 3.46%. Contract: the 11/20 put at delta 0.30-0.45 with live ask <= 4.00 (keeps a -50% loss above the $1,700 pause line), spread <= 5%, OI >= 1000; this 280P is the reference, and Run A cancels it and re-adds the qualifying strike if another one fits. 1 lot only; no widening of any filter. Exits fixed at entry: a GTC sell at +50% placed that evening; stop: GOOGL back above its 10/29 open at a 14:43 check, the -50% premium backstop; out 11/5 14:43. Edge: pooled continuation EV/$ 1.07-1.18 (n 93). Not the consensus view (buy the dip). Anthropic link disclosed: GOOGL is an Anthropic investor and cloud partner, but the thesis rests on GOOGL's own 8-K figures and a mega-cap base rate, not on Anthropic. If it fills, Friday's INTC shot is capped at $355 (combined <= $800).

## Stats

- Fills: 2 | closed round trips: 1 (W 0 / L 1)
- Fills priced by the cross-checked quote feed: 2 of 2
- Win rate: 0%
- Payoff: n/a
- Max drawdown: -10.93%

## Taxes (memo, not tax advice)

- Realized this year: short-term -$80.08, long-term $0.00. Options held under a year are short-term, taxed as ordinary income.
- Net loss -$80.08: offsets other capital gains, or up to $3,000 of ordinary income a year; the rest carries forward.
- Possible wash sales: 0

## Last 10 fills

| Date | Side | Ticker | Qty | Fill | Fees | Thesis |
|---|---|---|---|---|---|---|
| 2026-10-19 | buy | SPY261120C00790000 | 1.0000 | 3.62 | $0.04 | Alternate to O003, added pre-open 10/19: with SPY pre-market 767.23 the 11/20 785C shows 5.32/5.39 on Cboe, above O003's 5.00 ceiling. Same thesis, conditions and exits as O003 (historian base rate; confirm only if at 14:43 SPY 752-772, VIX 17-24, VIX9D <= VIX3M, Brent < 112, spread <= 5%; sell whole at bid >= 2x fill, -50% stop, out if no S&P record by 11/4, out by 11/18). Use only if O003's live ask is above 5.00; never both (one new shot a day). 790C pre-open 3.75/3.82, delta 0.24, OI 15,312; keeps the 11/20 expiry so the 22-session base-rate window fits, and keeps the MSFT reserve. |
| 2026-10-22 | sell | SPY261120C00790000 | 1.0000 | 2.82 | $0.04 | Shot 1 exit (Run A 10/22 14:45): exits a) and b) both triggered on live quotes. a) Robinhood bid 2.91 <= 3.00 stop (14:44:52); b) Nasdaq Composite 25,970.14 < 26,023.10 rally low (SPY 762.11, above 760.64). Risk-off on Houthi attacks on Saudi Arabia, US diplomats ordered out, Brent 112.91 (+3.8%), VIX 19.62 (+18%), QQQ -2.9%. Sell the whole contract to close at the bid side. |
