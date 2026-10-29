# Earnings claims C1-C3 (tested 2026-10-29)

**Setup.**
- Scripts: `scripts/earnings_fetch.py`, `scripts/earnings_analysis.py` (pre-registered; open choices fixed in its header before the first run) and `scripts/earnings_posthoc.py` (post-hoc, no verdicts). All numbers are in `earnings-results.csv`.
- Events: 2,264 8-K 2.02 events across the 25 claims.md names, 2005 to 10/2026, priced on Yahoo adjusted closes (data ends 10/23).
- Timing check: median |move| on the reaction day is 4.6% for after-close filings, against 1.3% on the days either side.
- **Abnormal** = the signed return net of SPY, minus the same ticker's average for the same holding period in the same year. t is clustered by month.
- Options: Black-Scholes with half of a 3% spread each way. Skew and IV changes are ignored, so these results are approximate.

## C1: continuation after an earnings gap (entry at the reaction-day close)

| Gap | n | Continued 5d | Net of SPY 5d / 10d | Abnormal 5d (t) | Abnormal 10d (t) | 5d 2005-14 | 5d 2015-26 | 5d 2010-26 |
|---|---|---|---|---|---|---|---|---|
| Down ≥5% | 421 | 59% | +0.45% / +0.20% | +0.60% (2.6) | +0.50% (1.7) | +0.53% (1.3) | +0.64% (2.3) | +0.74% (3.0) |
| Down ≥8% | 216 | 62% | +0.80% / +0.20% | +0.90% (2.5) | +0.41% (0.9) | +0.68% (1.2) | +1.08% (2.4) | +1.15% (2.8) |
| Up ≥5% | 443 | 54% | +0.76% / +1.36% | +0.26% (1.0) | +0.36% (1.1) | +0.08% (0.2) | +0.40% (1.1) | +0.11% (0.4) |
| Up ≥8% | 252 | 53% | +0.83% / +1.72% | +0.23% (0.6) | +0.50% (1.1) | +0.05% (0.1) | +0.35% (0.8) | +0.06% (0.2) |
| Both ≥5% | 864 | 57% | +0.61% / +0.79% | +0.42% (2.4) | +0.43% (2.0) | +0.29% (1.0) | +0.52% (2.2) | +0.43% (2.1) |

The option is delta 0.35, 25 DTE, priced at IV = 1.3x the pre-print 20-day realized vol (RV20) and held 5 sessions:

| Gap | EV/$ (95% CI) | 2010-26 | RV incl. gap day | Break-even IV | Verdict |
|---|---|---|---|---|---|
| Down ≥5%, put | 0.99 (0.91-1.08) | 1.02 | 0.86 | 1.27x RV20 | **WEAK** (options) |
| Down ≥8%, put | 1.00 (0.91-1.11) | 1.05 | 0.86 | 1.31x | **CONFIRMED by 0.003** |
| Down ≥10%, put (post-hoc) | 1.06 (0.92-1.21) | 1.13 | 0.87 | 1.49x | none |
| Up ≥5%, call | 1.02 (0.94-1.12) | 1.02 | 0.88 | 1.37x | **WEAK** |
| Up ≥8%, call | 1.02 (0.91-1.13) | 1.00 | 0.86 | 1.37x | **REJECTED** |
| Both ≥5% | 1.01 (0.95-1.06) | 1.02 | 0.87 | 1.32x | **CONFIRMED (marginal)** |
| Random entry (baseline) | calls 0.98, puts 0.87 | | | | |

**Read.**
- **Down gaps continue at the stock level:** about +0.6-0.9% over 5 sessions, and stronger since 2010. The evidence is only suggestive (|t| 2.5-3.0 against a bar of 3). For ≥8% gaps the effect fades by day 10.
- **Up gaps do not continue** beyond each stock's own drift: the median is about 0 and the hit rate since 2010 is 50%.
- **Options are break-even.** The CONFIRMED cells clear EV/$ 1.0 by 0.003-0.014, well inside their CIs.
- **Robustness:** the declared earnings-only variant, which drops interim 2.02s, gives the same picture (down ≥8%: +0.88%, t 2.4; up ≥5%: +0.26%, t 1.1). So does dropping intraday-filed events.
- **The persona figures do not reproduce.** "34/48 continued" (71%) compares with 489/864 (57%) pooled; INTC alone is 28/41. "n 93, EV/$ 1.07-1.18" compares with n 216 and EV 1.00 for down ≥8%, and n 123 and EV 1.06 for down ≥10%. Those persona figures should stop being cited.

**GOOGL put and INTC rule.**
- **GOOGL.** A -10% gap sits in the down ≥8% cell, which has the best stock-level evidence we have. Even so, the put only breaks even in the model. It beats 1.0 only if its IV is below about 1.31x RV20 (1.46x on 2010-26 data; 1.49-1.70x for ≥10% gaps, post-hoc). GOOGL's RV20 to 10/23 was 21%, so the ceiling is about **28% IV, or 31-36% on the friendlier cuts**, measured against the contract's own quoted IV, skew included. Above about 31% there is no edge, just a coin-flip that pays the spread. GOOGL's own record adds nothing: 4 of 7 down gaps ≥8% continued. Any move should come within 5 sessions, so the 11/5 time exit fits. Our +50% target and stops were not modelled.
- **INTC.** The call leg has no support. Up gaps continue 54% of the time (50% since 2010), and the calls' 1.02 EV is the random-call baseline plus noise. INTC's 8/13 up-gap record is anecdote. The put leg has real stock drift but an EV of 0.99, which needs IV at or below about 1.3x INTC's 51% RV20, roughly 65%. **Drop the INTC call rule**, and treat the GOOGL put as a no-trade unless its IV prints at 30% or less.

## C2: pre-earnings run-up (close t-7 to close t-1, net of SPY)

| Period | n | Up vs SPY | Net of SPY | Abnormal (t) | Median | Worst | Call EV/$ |
|---|---|---|---|---|---|---|---|
| Full | 2,260 | 56% | +0.52% | +0.26% (2.7) | +0.25% | -34.1% | 1.34 (1.29-1.39) |
| 2005-14 | 1,006 | 56% | +0.55% | +0.33% (2.1) | +0.20% | -34.1% | 1.33 |
| 2015-26 | 1,254 | 57% | +0.50% | +0.21% (1.7) | +0.28% | -23.6% | 1.35 |
| 2010-26 | 1,786 | 57% | +0.47% | +0.23% (2.3) | +0.27% | -23.6% | 1.34 |
| Last 10y | 1,051 | 57% | +0.53% | +0.25% (1.8) | +0.25% | -23.6% | 1.36 |
| NVDA (post-hoc) | 90 | 60% | +1.43% | +0.68% (1.4) | +0.53% | -9.6% | 1.37 |

**Verdict: CONFIRMED by the protocol's letter, but only suggestive** (t 2.7). The effect is +0.16% after 10 bps of costs. The options pass rests on the assumed IV ramp from 1.2x to 1.5x RV20:
- with flat IV, EV/$ is 1.07;
- with the print priced into IV from entry (post-hoc), it is 1.04 (CI 1.00-1.08);
- a random call with flat IV scores 1.03.

The realistic edge is about 1-4 cents per dollar.

**NVDA (11/17 print).** Entry would be the 11/9 close and the exit the 11/17 close, since the playbook already requires a sale by then. NVDA's own run-up beyond its trend is +0.68% (t 1.4) over the full sample, but -0.08% (t -0.1) since 2015. The pooled +0.25% does not pay for the IV a December chain already charges for the print. Use it as a tie-breaker at most, not as a thesis.

## C3: retail option buyers around earnings (literature only)

de Silva, Smith & So report that retail investors buy options heavily before earnings and lose 5-9% on average, and 10-14% on high-volatility announcements. They overpay for implied vol that collapses after the print, and they pay wide spreads. This cannot be tested without historical option prices. It supports our event-vol rule (buy event premium only when the implied move is at most 0.9x the median recent reaction). C1 entries come after the print, and a C2 run-up exits before it, so both avoid the crush. Our 0.87 random-put baseline shows that even outside events, spreads and the vol premium cost us.

*Caveats:*
- The universe is today's mega-caps, so survivorship is present; the baseline corrects for each name's own drift, not for how the names were selected.
- CSV verdicts on the 10-session rows are stock-only.
