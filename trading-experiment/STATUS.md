# Paper-trading scoreboard (as of 2026-11-10)

> The paper ledger: the shadow model of the real account (live mode is on; real fills are in data/live_ledger.csv). Paper fills are modeled at the close with slippage and fees (see RULES.md).

**Equity $1,364.45** | P/L -$635.55 (-31.78%) since the start | objective: make money (no date or amount target since 2026-11-07)
- Cash $3.84 | realized -$631.16 | fees paid $0.18 | slippage cost $49.68
- SPY buy-and-hold with same $: $1,955.81
- No end date (the owner retired it on 2026-11-07)
- Est. after-tax equity if liquidated (memo, 24% on gains): $1,364.45

## Positions

| Ticker | Qty | Avg cost | Last | Value | Unreal. | Stop | Target |
|---|---|---|---|---|---|---|---|
| SGOV | 2.6354 | 100.55 | 100.53 | $264.94 | -$0.06 (-0.02%) |  |  |
| VOO | 1.5891 | 692.22 | 689.50 | $1,095.67 | -$4.33 (-0.39%) |  |  |

## Pending orders (fill at next close)

_None._

## Stats

- Fills: 6 | closed round trips: 2 (W 0 / L 2)
- Fills priced by the cross-checked quote feed: 6 of 6
- Win rate: 0%
- Payoff: n/a
- Max drawdown: -36.70%

## Taxes (memo, not tax advice)

- Realized this year: short-term -$631.16, long-term $0.00. Options held under a year are short-term, taxed as ordinary income.
- Net loss -$631.16: offsets other capital gains, or up to $3,000 of ordinary income a year; the rest carries forward.
- Possible wash sales: 2
  - 2026-10-22 SPY261120C00790000 loss -$80.08 -> replaced by 2026-11-04 SPY261204C00780000
  - 2026-11-05 SPY261204C00780000 loss -$551.08 -> replaced by 2026-10-19 SPY261120C00790000

## Last 10 fills

| Date | Side | Ticker | Qty | Fill | Fees | Thesis |
|---|---|---|---|---|---|---|
| 2026-10-19 | buy | SPY261120C00790000 | 1.0000 | 3.62 | $0.04 | Alternate to O003, added pre-open 10/19: with SPY pre-market 767.23 the 11/20 785C shows 5.32/5.39 on Cboe, above O003's 5.00 ceiling. Same thesis, conditions and exits as O003 (historian base rate; confirm only if at 14:43 SPY 752-772, VIX 17-24, VIX9D <= VIX3M, Brent < 112, spread <= 5%; sell whole at bid >= 2x fill, -50% stop, out if no S&P record by 11/4, out by 11/18). Use only if O003's live ask is above 5.00; never both (one new shot a day). 790C pre-open 3.75/3.82, delta 0.24, OI 15,312; keeps the 11/20 expiry so the 22-session base-rate window fits, and keeps the MSFT reserve. |
| 2026-10-22 | sell | SPY261120C00790000 | 1.0000 | 2.82 | $0.04 | Shot 1 exit (Run A 10/22 14:45): exits a) and b) both triggered on live quotes. a) Robinhood bid 2.91 <= 3.00 stop (14:44:52); b) Nasdaq Composite 25,970.14 < 26,023.10 rally low (SPY 762.11, above 760.64). Risk-off on Houthi attacks on Saudi Arabia, US diplomats ordered out, Brent 112.91 (+3.8%), VIX 19.62 (+18%), QQQ -2.9%. Sell the whole contract to close at the bid side. |
| 2026-11-04 | buy | SPY261204C00780000 | 1.0000 | 6.82 | $0.04 | Goal-budget bet (playbook, pre-registered 11/02 under the owner's autonomy grant), replacing O013. NOT AN EDGE: a choice of variance toward the owner's goals at a flat model EV. Size: 1 contract, about $673 (35% of equity); Kelly does not apply (no tested edge), so the size is the rule's one contract and $850 ceiling. Contract: the in-band call nearest delta 0.375 at the 14:44 check (Robinhood 19:45 UTC: 6.70/6.73, delta 0.369, IV 12.3%, OI 2149, spread 0.4%; Cboe 6.77/6.82). Gates, all PASS: goal_odds.py at the live quote with the -50% stop gives P($2,200) 44.7% (42.6-47.0) >= 35% and EV 1.020 (0.991-1.050) >= 0.93; P(ahead of SPY) 46.3% vs 4.4% in cash; P(below $1,600) 44.0%; no halt (^GSPC 7,703.87, +1.8%); ^VIX 16.79; risk red-team MODIFY (buy as specified; set the take-profit from actual cash after the fill). Exits: sell at the first 14:43 check with equity >= $2,200, via a resting GTC sell placed in Run B at ceil((2200 - cash after the buy, fees included) / 100) per share (about 9.56, 1.42x cost); the -50% stop at a 14:43 check (premium at or below half the fill); otherwise sell at the 11/18 14:43 check. No second contract, no averaging down. |
| 2026-11-05 | sell | SPY261204C00780000 | 1.0000 | 1.31 | $0.04 | Stop exit (playbook Open shots, Shot 2 b): the -50% stop at a 14:43 check. Live Robinhood bid 1.43 / ask 1.49 at 19:44 UTC, at or below 3.39 (half of the 6.79 fill). SPY 738.70 (-3.7%) in an AI-stock rout (Reuters, Bloomberg; ^VIX 26.32, +58%). Pre-registered; no discretion. The resting 9.62 GTC (K007) was cancelled first. |
| 2026-11-09 | buy | VOO | 1.5891 | 692.2159 | $0.01 | Index core (adopted at the 11/08 rule-evolution vote, red-team MODIFY): about 80% of equity in VOO (S&P 500, 0.03% fee), a lump sum held without stops or timing rules. Evidence: strategy v2 S1 WEAK (7 of 8 cells; a stated exception backed by the equity-premium literature: Dimson-Marsh-Staunton); trend filters and the regime gate REJECTED (regime_gate.py); staging retired (Vanguard 2012). Size: $1,100 of $1,384.84 (79%); expect about +$100 a year on the account; a 2008 replay about -$610 on the core. Who loses from today's driver: AI-regulation fears hit the AI/semis weights (VOO holds them at index weight; no extra tilt). Execution (risk persona): a dollar-amount market order through the gate at the 14:43 check; skip if a halt, a quote older than 2 minutes, unleveraged buying power below $1,375, or any review_equity_order alert; if partially filled by 15:30, cancel the rest and finish next session. VOO, not SPY: no SPY shares or options before 12/06 (wash-sale window). Exits: none (no stop, no take-profit); sold only on a rule change, at the owner's request or to rebalance; never sold to fund options. Persona checks 11/08: macro, momentum, contrarian, historian, risk found nothing that should delay it. |
| 2026-11-09 | buy | SGOV | 2.6354 | 100.5502 | $0.01 | Index core reserve (adopted 11/08): about 20% of equity in SGOV (0-3 month T-bills, about 3.6-4.0% a year, worst drawdown -0.03%; strategy v2 S3 WEAK, closest version). It is the dry powder for CONFIRMED option setups (one C1 contract: full Kelly about $235 at most) so VOO is never sold to fund options. Size $265; about $19.82 stays in cash as a buffer (the ledger counts $0.02 more than the broker). Placed after VOO shows filled. Same execution checks as VOO. Exits: sold only to fund a CONFIRMED setup, on a rule change or at the owner's request. |
