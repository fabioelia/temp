# Strategy v4: candidates for the probe program (pre-registered 2026-11-11, before any result)

**Owner, 11/11:** "I dont think we should land 1 investment but try to a have a handful to be probing and testing with." The candidates are in
`candidates.md`, the program in `probe-program.md` (draft, to be red-teamed), the election lessons in `election-postmortem.md`. Protocol:
`research/strategy-review/PROTOCOL.md`, with costs, both halves (pre-2010 and 2010-2026 unless stated), and a committed script. **Probe admission needs a
WEAK-or-better verdict; graduating to a full rule needs CONFIRMED plus the multiple-testing bar in the program.** The account is long-only, with fractional
shares and no leverage.

| ID | Claim | Test (fixed now) |
|---|---|---|
| T1 | **Earnings premium in shares** (C2 without options): buying a tested name at the close 7 sessions before its earnings date and selling at the close the session before the print earns more than SPY | The strategy-review C2 data and code (earnings_fetch.py, earnings_analysis.py), 25 names 2005-2026, 10 bps per round trip. CONFIRMED if the per-event excess is > 0 with t > 2 in both halves (2005-09 and 2010-26) and since 2015 |
| T2 | **Trend on non-equity ETFs:** holding each of GLD, TLT, DBC (commodities) only while its 12-month total return exceeds T-bills (monthly, else BIL) beats holding them, and an equal-weight trend sleeve lowers the drawdown of an 80% VOO portfolio | Yahoo data from each ETF's start (GLD 2004, TLT 2002, DBC 2006), 10 bps per switch, monthly at the month-end close. Cited: Hurst-Ooi-Pedersen (2017). CONFIRMED if the trend version's Sharpe is higher than buy-and-hold for at least 2 of 3 ETFs in both halves (split at 2015 because the data starts late) AND the 80/20 VOO+sleeve max drawdown is smaller than 80/20 VOO+SGOV in both halves |
| T3 | **Gold sleeve:** 80% SPY / 20% GLD (monthly rebalance) beats 80% SPY / 20% T-bills on Sharpe and max drawdown | 2004-11 to 2026, 5 bps per rebalance turnover; halves split at 2015. CONFIRMED if Sharpe is higher and max drawdown smaller in both halves. Cited: Erb-Harvey (2013) on the lack of an expected-return anchor |
| T4 | **Same-month seasonality** (Keloharju-Linnainmaa-Nyberg 2016): the 5 of today's S&P 100 with the highest average return in the same calendar month over the prior 10+ years beat SPY in that month | Yahoo monthly total returns 1995-2026, today's S&P 100 (survivorship stated), long-only, 10 bps per turnover. CONFIRMED if the monthly excess is > 0 with t > 2 in both halves |
| T5 | **Long-only stock momentum:** the 5 of today's S&P 100 with the best 12-1 month return, rebalanced monthly, beat SPY | Same data, 10 bps per turnover. Cited: Geczy-Samonov (2016), Blitz et al. (2020). CONFIRMED if the excess is > 0 with t > 2 in both halves |
| P1 | **The election divergence gate** (as registered in `election-postmortem.md` section 4) | As written there: SPY +1% days, a sector of at least 10% weight lagging by 2+ of its own daily SDs; P(SPY 5-day minimum <= -3%) at least 1.5x, within VIX terciles; in-sample 1998-2012, out-of-sample 2013-2026; pass at Fisher p < 0.10 out of sample |
