# V1: C1 on today's top-100 US universe (run 2026-11-11)

**Verdict: WEAK.** The pre-set rule needs t > 2 in both halves; 2005-2009 gives t 1.3. The 76 new names alone show no continuation after 2010 (t 0.6).

**Universe:** companiesmarketcap.com, "Largest companies in the USA by market cap" (CSV, 2026-11-11), ranks 1-100, one ticker per company (list in `scripts/c1_wide.py`).
- ADBE (rank 132) dropped out, so it is C1's other 24 plus **76** new names.
- **Survivorship:** these are today's winners, chosen with hindsight.
- 15 names never gapped 8% (BRK-B, JPM, V, XOM, JNJ, ...).
- Predecessor CIKs were added for DIS, MRVL and BLK; BLK's 2005-06 filings are still missing.

**Data:** 8,350 events with 8-K 2.02 dates (6,166 for the new names), with bars to 11/10. **Check:** on C1's 25 names, with bars cut at 10/23, the script reproduces C1 exactly (n 216, 61.6%, +0.90%, t 2.51, EV 1.003).

## Down gaps of 8% or more: buy at the reaction-day close, hold 5 sessions

Abnormal = the return vs SPY, minus that ticker's own drift for the year; t is clustered by month.

| Universe | n | Continued | Abnormal (t) | 2005-09 (t) | 2010-26 (t) | Put EV/$ 1.0x RV20 (CI) | 1.3x (CI) |
|---|---|---|---|---|---|---|---|
| **Top 100** | 436 | 58.7% | +0.73% (2.56) | +0.72% (1.33) | +0.74% (2.20) | **1.11 (1.01-1.22)** | 0.98 (0.91-1.06) |
| New 76 | 227 | 56.4% | +0.53% (1.28) | +1.24% (1.59) | +0.30% (0.62) | 1.08 (0.94-1.23) | 0.96 (0.85-1.06) |
| C1's 25 | 218 | 61.5% | +0.92% (2.59) | -0.05% (-0.07) | +1.18% (2.89) | 1.14 (1.01-1.29) | 1.01 (0.91-1.11) |

**Top 100, other cuts:**
- Raw return vs SPY: +0.70% (t 2.43); +0.63% after costs.
- C1's own halves also fail (2005-14: t 1.7; 2015-26: t 1.9).
- The earnings-only variant gives the same result.

**Options:** the put passes only at IV = 1.0x RV20.
- Break-even IV is 1.25x RV20 (C1's was 1.31x).
- With the gap day included in RV20, EV is 0.89.
- Real put IV after the print sits above the pre-print RV20 and carries skew, so 1.0x is optimistic.

## Candidates (down gaps of 8% or more per year)

| Universe | 2005-25 | 2021-25 | 2026 to date |
|---|---|---|---|
| Top 100 | 18.9 | 26.4 | 41 |
| C1's 25 | 9.6 | 13.0 | 17 |

That is about **0.2-0.3 extra a week** (one every 4 weeks), or 0.5 at 2026's pace, before the IV gate removes some.

**Read:** the wider list doubles the candidates but dilutes the edge. The continuation sits in C1's tech-heavy names after 2010, which points to selection, not a general effect. **No rule change; C1 stays on its 25 names.**
