# Earnings claims C1-C3 (tested 2026-10-29)

**Data.** 2,264 8-K 2.02 events (2005 to 10/2026) for the 25 names (plus predecessor CIKs), on Yahoo adjusted closes through 10/23. Timing check: the median reaction-day move is 4.6%, against 1.3% on adjacent days. **Abnormal** = the signed return net of SPY, minus that ticker's same-year average for the same holding period; t is month-clustered. `earnings_analysis.py` is pre-registered; `earnings_posthoc.py` gives no verdicts.

## C1: post-earnings continuation (entry at the reaction-day close)

| Gap | n | Continued 5d | Net SPY 5d / 10d | Abnormal 5d (t) | Abnormal 10d (t) | 5d 2005-14 | 5d 2015-26 |
|---|---|---|---|---|---|---|---|
| Down ≥5% | 421 | 59% | +0.45 / +0.20% | +0.60% (2.6) | +0.50% (1.7) | +0.53 (1.3) | +0.64 (2.3) |
| Down ≥8% | 216 | 62% | +0.80 / +0.20% | +0.90% (2.5) | +0.41% (0.9) | +0.68 (1.2) | +1.08 (2.4) |
| Up ≥5% | 443 | 54% | +0.76 / +1.36% | +0.26% (1.0) | +0.36% (1.1) | +0.08 (0.2) | +0.40 (1.1) |
| Up ≥8% | 252 | 53% | +0.83 / +1.72% | +0.23% (0.6) | +0.50% (1.1) | +0.05 (0.1) | +0.35 (0.8) |
| Both ≥5% | 864 | 57% | +0.61 / +0.79% | +0.42% (2.4) | +0.43% (2.0) | +0.29 (1.0) | +0.52 (2.2) |

Options: delta 0.35, 25 DTE, IV = 1.3x the pre-print RV20, held 5 sessions. No skew, so approximate.

| Gap | EV/$ (95% CI) | 2010-26 | Break-even IV | Verdict |
|---|---|---|---|---|
| Down ≥5%, put | 0.99 (0.91-1.08) | 1.02 | 1.27x RV20 | **WEAK** (options) |
| Down ≥8%, put | 1.00 (0.91-1.11) | 1.05 | 1.31x | **CONFIRMED by 0.003** |
| Down ≥10%, put (post-hoc) | 1.06 (0.92-1.21) | 1.13 | 1.49x | none |
| Up ≥5%, call | 1.02 (0.94-1.12) | 1.02 | 1.37x | **WEAK** |
| Up ≥8%, call | 1.02 (0.91-1.13) | 1.00 | 1.37x | **REJECTED** |
| Both ≥5% | 1.01 (0.95-1.06) | 1.02 | 1.32x | **CONFIRMED (marginal)** |

**Read.**
- **Down gaps:** +0.6-0.9% over 5 sessions (2010-26: +0.74%, t 3.0). Suggestive only; fades by day 10 (≥8%: t 0.9).
- **Up gaps:** no continuation beyond each stock's own drift (median about 0; 50% hit rate since 2010).
- **Options:** break-even. Random entries score 0.98 (calls) and 0.87 (puts). With the gap day in RV, every cell is 0.86-0.88.
- **Robustness:** the earnings-only variant and dropping intraday filings change nothing.
- **Persona figures:** not reproduced. "34/48" (71%) is 489/864 (57%) here; "n 93, EV 1.07-1.18" is n 216, EV 1.00. Stop citing them.

**GOOGL put and INTC rule.**
- **GOOGL.** A -10% gap sits in our best cell; even there the put is a coin-flip that pays the spread. It needs IV below about 1.31x RV20, or 1.46-1.70x on the friendlier 2010-26 or ≥10% cuts. GOOGL's RV20 to 10/23 is 21%, so the IV ceiling is about **28-31%, at most 36%**, measured against the contract's own quoted IV, skew included. GOOGL's own record adds nothing: 4 of 7 down gaps ≥8% continued. Any move should come within 5 sessions, so the 11/5 exit fits.
- **INTC.** The call leg has no edge: pooled up-gap continuation is 50% since 2010, and the calls' 1.02 EV is the random-call baseline plus noise. INTC's 8/13 up-gap record is anecdote. The put leg needs IV at or below about 65-69% (1.27-1.35x its 51% RV20). **Drop the INTC call rule. No GOOGL put unless its IV is at most about 30%.**

## C2: pre-earnings run-up (close t-7 to close t-1, net of SPY)

| Period | n | Up vs SPY | Net SPY | Abnormal (t) | Median | Worst | Call EV/$ |
|---|---|---|---|---|---|---|---|
| Full | 2,260 | 56% | +0.52% | +0.26% (2.7) | +0.25% | -34.1% | 1.34 |
| 2005-14 | 1,006 | 56% | +0.55% | +0.33% (2.1) | +0.20% | -34.1% | 1.33 |
| 2015-26 | 1,254 | 57% | +0.50% | +0.21% (1.7) | +0.28% | -23.6% | 1.35 |
| 2010-26 | 1,786 | 57% | +0.47% | +0.23% (2.3) | +0.27% | -23.6% | 1.34 |
| NVDA (post-hoc) | 90 | 60% | +1.43% | +0.68% (1.4) | +0.53% | -9.6% | 1.37 |

**Verdict: CONFIRMED by the protocol's letter, but only suggestive** (t 2.7; +0.16% after costs). The 1.34 EV comes from the assumed IV ramp (1.2x to 1.5x RV20). With flat IV it is 1.07; with the print priced into IV from entry (post-hoc), 1.04 (CI 1.00-1.08). A random call scores 1.03. The realistic edge is 1-4 cents per dollar.

**NVDA (11/17 print).** If NVDA reports after the 11/17 close, enter at the 11/9 close and sell at the 11/17 close. Since 2015 NVDA's own run-up beyond trend is -0.08% (t -0.1). The pooled +0.25% does not pay for the event IV a December chain already charges. A tie-breaker at most.

## C3: retail option buyers around earnings (literature only)

de Silva, Smith & So: retail investors who buy options before earnings lose 5-9% on average (10-14% on high-volatility announcements), from overpaying for implied vol that collapses after the print and from wide spreads. Untestable here; it supports our event-vol rule (implied move at most 0.9x the median recent reaction). C1 enters after the print and C2 exits before it, so both avoid the crush.

*Caveat:* the universe is today's mega-caps (survivorship). The baseline removes each name's own drift, not the selection. CSV verdicts on 10-day rows are stock-only.
