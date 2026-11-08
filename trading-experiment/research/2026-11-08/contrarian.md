# Contrarian memo, Sun 2026-11-08

**Verdict:** nothing should stop Monday's core buy. My best case against its size fails the evidence rules. **No trade.**

## The case: buy about half the VOO now
Moreira & Muir (2017, *J. Finance* 72(4)) scale equity by 1 / last month's variance and report a market alpha of about 4.9% a year. SPY's 21-day realized vol is 19.7%, against a 13.3% median since 1993. That rule would buy about half the planned VOO.

## Why it fails
- **Our committed test** (`regime_gate.py`, reproduced tonight; its state today is 50%): de-risking when VIX ≥ 20 lowered the Sharpe in both halves, 0.18 vs 0.29 and 0.67 vs 0.76.
- **Out of sample:** Cederburg et al. (2020, *JFE* 138(1)) find no reliable real-time gain. The rule also needs leverage, and we have no margin.

## Waiting until after CPI
Savor & Wilson (2013, *JFQA* 48(2)): 11.4 bp on announcement days vs 1.1 bp on other days. Waiting gives that up.

## Information only (uncommitted)
In today's state with VIX ≥ 25, the average 12-month return was higher than on all days, but the pre-2010 5th percentile was -35% (vs -27%). That argues for the 20% SGOV, not for waiting.

## Idea: none
The crowd is buying CPI puts, so the core is already the contrarian trade. C1's universe excludes CRWV.
