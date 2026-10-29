# Paper-trading scoreboard (as of 2026-10-29)

> SIMULATION. No real money. Prices come from public web sources; fills are modeled at the close with slippage and fees (see RULES.md).

**Equity $1,919.92** | P/L -$80.08 (-4.00%) | goal $2,200.00 by 2026-11-18 | -40.0% of the way
- Cash $1,919.92 | realized -$80.08 | fees paid $0.08 | slippage cost $25.00
- SPY buy-and-hold with same $: $2,006.51
- Trading days left: 14 | needed per day to hit goal: +0.98%
- Est. after-tax equity if liquidated (memo, 24% on gains): $1,919.92

## Positions

_All cash._

## Pending orders (fill at next close)

- O011 buy INTC261120P00072500 qty=1.0 stop=50.0% target= :: CONDITIONAL, C1 down-gap put (strategy review: mega-cap down gaps >= 8% continue 5 sessions, n 216, 62%, +0.90% beyond SPY, t 2.5; put EV 1.00 at an IV of 1.3x RV20). All four personas back it; red-team MODIFY applied. INTC closed 92.07 on 10/29 and was ~74.62 after hours (-19%) on a Q4 guide miss ($15.0-16.0B vs $17.07B LSEG); the 10/14 blast is minor; INTC's own record is 11/14 lower after 5 sessions. Confirm at the 10/30 14:43 check ONLY if ALL hold on live quotes: (1) INTC <= 84.70 (-8% vs 92.07); (2) the chosen 11/20 put's quoted IV <= 70.6% (1.3x the pre-print RV20 of 54.3%, research/2026-10-29/scripts/options_vol_gate.py); (3) delta 0.30-0.45, live ask <= 3.00 (1 lot, so a -72% weekend gap keeps equity above $1,700), spread <= 5%, OI >= 1000; (4) standing gates ^TNX <= 5.10, ^VIX <= 22, HY OAS < 3.46% (3.14 on 10/28). The 72.5P is the reference; Run A re-adds the qualifying strike if another one fits; no widening. Exits as the C1 rule was confirmed (playbook Exits exception): NO take-profit and no resting GTC; time exit at the 11/6 14:43 check (session 5); thesis stop INTC >= 1.04x its 10/30 close at a 14:43 check; the -50% backstop. Edge: C1 EV 1.00 at the gate, 1.14 at the expected entry IV of 54% (options-vol model, no skew). The CL=F and below-the-open conditions were dropped (no script; post-hoc EV 0.99 vs 1.04). AMZN fallback rejected (shadow only). No Anthropic link.

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
