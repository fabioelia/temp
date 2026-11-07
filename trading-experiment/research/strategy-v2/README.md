# Strategy v2 (2026-11-07): what makes money for this account? Verdicts

Claims and tests were fixed in `claims.md` before any result. Details are in `core-equity.md`, `premium-selling.md` and `anthropic-a1.md`; the scripts
are in `scripts/`.

| ID | Claim | Verdict | Deciding numbers |
|---|---|---|---|
| S1 | Holding SPY has a positive expected return (1-12 months) | WEAK (7 of 8 cells pass; pre-2010 12-month t 1.98, just under 2) | For $1,385: 12 months average +$171, range -$278 to +$500; a 1-in-20 bad year about -$280; a 2008-style crash -$650 to -$765 |
| S2 | A trend filter (200-day; Faber 10-month) beats buy-and-hold | REJECTED | It halves drawdowns (-22% vs -55%), but the Sharpe since 2010 is 0.68 / 0.59 vs 0.76 |
| S3 | Idle cash earns the T-bill rate in SGOV/BIL | WEAK (closest version: issuer pages blocked) | Drawdown -0.03%, spread 2 bp, yield about 3.6-4.0% (about +$55 a year on $1,385) |
| S4 | QQQ instead of SPY | WEAK | Sharpe higher in both halves, but not significantly (t 0.17); max drawdown -83% |
| P1 | Cash-secured puts | REJECTED for this account | No ETF fits $1,385. The single stocks that fit (AAL, F, RIVN, NOK, RIG) give t < 1.2 against T-bills; one contract is 36-90% of the account in one company (AAL's worst month -58% of collateral). SPY would pass (+3.4%/yr, t 3.2) but needs about $70k |
| P2 | Covered calls | WEAK | F: Sharpe 0.30 vs 0.25 (t 1.1), fading after 2010. The cited Cboe BXM trails the S&P 500 (0.46 vs 0.62), and PUT does too (0.54 vs 0.64) |
| P3 | SPY put credit spreads (Level 3) | UNTESTABLE (model only) | +0.082 per $ of risk in the model, +0.015 at the real skew; the worst month loses all the risk; on 11/05 one lost 0.45x its risk; today's spread risks $3,209, more than the account |
| A1 | An Anthropic-linked trade has support | REJECTED | Large-IPO buyers lost 23% vs SPY over a year (n 16, t -2.0); holders fell 1.8% around IPO day (t -2.7). Guard only: no AMZN or GOOGL adds into the ANT pricing |

## What it means (input for the Sunday 11/08 rule-evolution vote; nothing is adopted yet)
* The only source of positive expected return that this account can reach is the **equity premium**: hold a broad index ETF, with idle cash in a T-bill
  ETF. S1 missed CONFIRMED by one cell (t 1.98 vs 2); the evidence rules also accept cited studies, and the equity premium is among the best-documented
  (the review should cite them, e.g. Dimson-Marsh-Staunton, before adopting).
* Timing it (trend filters), selling premium at this size, Level 3 spreads and Anthropic-linked trades all failed.
* Long options stay limited to measured edges (C1), sized by Kelly. The cost is honest: an index ETF can fall 40-55% in a crash; the expected gain is about
  12% a year, not +10% a month.
