# Paper-trading scoreboard (as of 2026-10-30)

> SIMULATION. No real money. Prices come from public web sources; fills are modeled at the close with slippage and fees (see RULES.md).

**Equity $1,919.92** | P/L -$80.08 (-4.00%) | goal $2,200.00 by 2026-11-18 | -40.0% of the way
- Cash $1,919.92 | realized -$80.08 | fees paid $0.08 | slippage cost $25.00
- SPY buy-and-hold with same $: $1,970.94
- Trading days left: 13 | needed per day to hit goal: +1.05%
- Est. after-tax equity if liquidated (memo, 24% on gains): $1,919.92

## Positions

_All cash._

## Pending orders (fill at next close)

- O012 buy SPY261130C00770000 qty=1.0 stop= target= :: OWNER-ONLY GOAL BUDGET; it does NOT exist unless the owner approves it in writing in the conversation before the Mon 11/2 14:43 check, naming the stop choice. Kelly is $0 (EV per $ 0.94-1.04): this is a deliberate beta and variance bet for the $2,200 goal, not an edge, and it is far above the playbook's sizing method. Contract: 1 x SPY 11/30 770C (Cboe 10/30 7.37/7.47); buy at the 11/2 14:43 check only at a live ask <= 7.85 (about $785 at risk, about 40% of equity); if SPY has rallied past that, no fill. Exits: sell at the first 14:43 check where equity would be >= $2,200 (call bid about 10.30-10.67); otherwise sell at the 11/18 14:43 check. Stop per the owner's choice: none (the historian's simulation) or -50% (red-team: about 4 points lower odds on both goals, and the chance of losing 75% or more falls from about 1 in 4 to 3%). No resting GTC (the goal bid is below the gate's 1.4x minimum). Odds if it fills (historian, options-vol, red-team): P($2,200) about 44-56%, P(beat SPY) about 50-58%, P(finish below $1,600) about 1 in 3, worst case about $1,171 without a stop. Cash path: P(beat SPY) about 13-18%, P($2,200) 0. Scripts: research/2026-11-01/scripts/historian_*.py, ov_backtest.py; red-team check scratchpad/risk1101/goal_check.py.

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
