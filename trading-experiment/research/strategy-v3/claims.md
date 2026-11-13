# Strategy v3: more than one thing to trade (pre-registered 2026-11-11, before any result)

**Why:** the owner asked (11/11), "Do we only [have] 1 thing to check for?" Today the only tradeable setup is C1 (earnings down-gap puts) on a 25-name
universe, which gives about one candidate a week. Their standing ask: "discover new strategies".
**Protocol:** `research/strategy-review/PROTOCOL.md`, with costs included and results split before and after 2010. Verdicts: CONFIRMED / WEAK / REJECTED /
UNTESTABLE. Only CONFIRMED claims become rules, through the rule-evolution process at the Sunday review.
**Account limits** (strategy v2): about $1,380, limited margin, options Level 2 (no spreads), no shorting, no margin borrowing; the pattern-day-trader rule
applies; the index core (about 80% VOO, 20% SGOV) stays unless a test beats it.

| ID | Claim | Test (fixed now) |
|---|---|---|
| V1 | **C1 on a wider universe:** the earnings down-gap continuation holds beyond the 25 names, for the 100 largest US companies by market cap | Same definition and tests as strategy-review C1 (gap <= -8% vs the pre-print close, entry at the reaction-day close, 5-session excess return vs SPY, put EV per $ with the review's option model at IV <= 1.3x the pre-print RV20), on today's top-100 US market caps (survivorship stated), 2005-2026 with 8-K item 2.02 dates. CONFIRMED only if the 5-session excess is > 0 with t > 2 in both halves AND the put EV per $ at 1.0x RV20 is above 1 with a CI above 1 |
| V2 | **Sector momentum rotation:** holding the 3 of 11 SPDR sector ETFs with the best trailing 12-month (skip 1) return, rebalanced monthly, beats VOO risk-adjusted | Total-return data from 1999 (9 original sectors), then 11; 10 bps per rebalance turnover; Sharpe and max drawdown vs SPY in both halves (1999-2009, 2010-2026). Cited: Moskowitz & Grinblatt (1999). CONFIRMED only if Sharpe is higher in both halves with a block-bootstrap CI excluding zero |
| V3 | **Volatility-managed core** (Moreira & Muir 2017): scaling VOO exposure by target vol / last month's realized vol (cap 100%, the rest in T-bills, monthly) beats a fixed 80% VOO | SPY total return and T-bills from 1993, monthly rebalance at the month-end close, 5 bps per turnover; compared with a fixed 80/20 portfolio at the same average exposure. CONFIRMED only if Sharpe is higher in both halves and max drawdown smaller (the S2 bar) |
| V4 | **Pre-FOMC drift** (Lucca & Moench 2015): the S&P 500 earns most of its excess return in the 24 hours before scheduled FOMC announcements, so moving the SGOV reserve into VOO for those sessions adds return | Scheduled FOMC dates 1994-2026 (cited Fed calendar); the return from the close two sessions before to the close on announcement day vs other days; both halves; and since 2016 (the published finding is said to have weakened). CONFIRMED only if the excess is > 0 with t > 2 in both halves and since 2016 |
