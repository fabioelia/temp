# Strategy v2: what makes money for this account? (pre-registered 2026-11-07, before any result)

**Owner, 2026-11-07:** "just focus on making money"; "you need to figure out the best option for our targets"; "evolve the rules as we learn".
**Account facts (Robinhood get_accounts, 2026-11-07):** agent account ••••5318, *limited margin*, options Level 2 (long options, covered calls,
cash-secured puts; no spreads), $1,384.82 cash. Fractional shares and ETFs are available. The pattern-day-trader rule applies under $25k. No margin borrowing,
no transfers (owner).
**Protocol:** as in `research/strategy-review/PROTOCOL.md`. Each claim's test is fixed here. Costs are included. Results are split before and after 2010.
Verdicts: CONFIRMED / WEAK / REJECTED / UNTESTABLE. Only CONFIRMED claims become rules, through the rule-evolution process (RULES.md) at the Sunday review.

| ID | Claim | Test (fixed now) |
|---|---|---|
| S1 | Holding an S&P 500 ETF (SPY, dividends reinvested) has a positive expected return over 1-12 months | Daily total-return data 1993-2026: the distribution of 1-, 3-, 6- and 12-month returns (mean, median, % positive, 5th percentile), and since 2010. CONFIRMED if the mean is > 0 with t > 2 in both halves |
| S2 | A trend filter (hold SPY when it closes above its 200-day average, else a T-bill ETF; checked daily at the close, trading the next close) beats buy-and-hold on risk-adjusted return and drawdown | Same data, with 5 bps per switch. Compare CAGR, volatility, Sharpe, max drawdown and worst year, in both halves; also the 10-month-SMA monthly version (Faber 2007). CONFIRMED if Sharpe is higher and max drawdown smaller in both halves |
| S3 | Idle cash earns about the T-bill rate in a T-bill ETF (SGOV or BIL) with negligible risk | The current 30-day SEC yield and expense ratio (cited from the issuer), the price history's worst drawdown, and the bid-ask spread now |
| S4 | QQQ (Nasdaq-100) instead of SPY improves the risk-adjusted return of S1/S2 | Same tests on QQQ from 1999. CONFIRMED only if better in both halves |
| P1 | Cash-secured puts (Level 2) earn the variance risk premium for this account | Cited: the Cboe PutWrite index (PUT) against the S&P 500. Feasibility: list liquid underlyings whose strike x 100 fits $1,385 (OI >= 1,000, spread <= 10%), and model a monthly 0.30-delta cash-secured put on the best candidate with the review's option model (research/strategy-review/scripts). CONFIRMED only if feasible and EV per year > T-bills after costs, with the tail (worst month) stated |
| P2 | Covered calls (Level 2) improve risk-adjusted return over holding the stock | Cited: the Cboe BuyWrite index (BXM) and Israelov & Nielsen (2015). Feasibility at $1,385 (100 shares needed). Same verdict rule |
| P3 | Level 3 spreads (which only the owner can request) would add a tested edge | Model 30-DTE SPY put credit spreads (0.20/0.10 delta) with the review's model. Report EV and tail; UNTESTABLE beyond the model |
| A1 | An Anthropic-linked trade has tested support (the "IPO halo" on strategic holders AMZN/GOOGL, or ANT itself after listing) | Public information only. The ANT IPO timeline from SEC filings (CIK 2130357), the options-listing lag for new IPOs (cited), base rates for large-IPO first-month returns (cited, e.g. Ritter), and any testable event study on strategic holders around a large partner IPO. CONFIRMED only with a committed test or a cited study, never on optimism |
