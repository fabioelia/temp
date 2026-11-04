# Paper-trading scoreboard (as of 2026-11-03)

> SIMULATION. No real money. Prices come from public web sources; fills are modeled at the close with slippage and fees (see RULES.md).

**Equity $1,919.92** | P/L -$80.08 (-4.00%) | goal $2,200.00 by 2026-11-18 | -40.0% of the way
- Cash $1,919.92 | realized -$80.08 | fees paid $0.08 | slippage cost $25.00
- SPY buy-and-hold with same $: $1,967.37
- Trading days left: 11 | needed per day to hit goal: +1.25%
- Est. after-tax equity if liquidated (memo, 24% on gains): $1,919.92

## Positions

_All cash._

## Pending orders (fill at next close)

- O014 buy SPY261204C00780000 qty=1.0 stop=50.0% target= :: Goal-budget bet (playbook, pre-registered 11/02 under the owner's autonomy grant), replacing O013. NOT AN EDGE: a choice of variance toward the owner's goals at a flat model EV. Size: 1 contract, about $673 (35% of equity); Kelly does not apply (no tested edge), so the size is the rule's one contract and $850 ceiling. Contract: the in-band call nearest delta 0.375 at the 14:44 check (Robinhood 19:45 UTC: 6.70/6.73, delta 0.369, IV 12.3%, OI 2149, spread 0.4%; Cboe 6.77/6.82). Gates, all PASS: goal_odds.py at the live quote with the -50% stop gives P($2,200) 44.7% (42.6-47.0) >= 35% and EV 1.020 (0.991-1.050) >= 0.93; P(ahead of SPY) 46.3% vs 4.4% in cash; P(below $1,600) 44.0%; no halt (^GSPC 7,703.87, +1.8%); ^VIX 16.79; risk red-team MODIFY (buy as specified; set the take-profit from actual cash after the fill). Exits: sell at the first 14:43 check with equity >= $2,200, via a resting GTC sell placed in Run B at ceil((2200 - cash after the buy, fees included) / 100) per share (about 9.56, 1.42x cost); the -50% stop at a 14:43 check (premium at or below half the fill); otherwise sell at the 11/18 14:43 check. No second contract, no averaging down.

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
