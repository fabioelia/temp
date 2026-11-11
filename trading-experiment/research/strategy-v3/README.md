# Strategy v3 (2026-11-11): more than one thing to trade? Verdicts

Owner, 11/11: "Do we only [have] 1 thing to check for?" Claims were fixed in `claims.md` before any data; details are in `c1-wide.md` and `etf-tests.md`.

| ID | Claim | Verdict | Deciding numbers |
|---|---|---|---|
| V1 | C1 on the 100 largest US companies | WEAK | n 436 down gaps of 8%+ (of 8,350 events): 58.7% continue, +0.73% 5-session excess (t 2.56). 2005-09 t 1.33 fails the both-halves bar. **The 76 new names alone:** n 227, +0.53% (t 1.28), 2010-26 t 0.62, so no edge outside the original 25. Put EV 1.11 (CI 1.01-1.22) at 1.0x RV20; 0.98 at 1.3x. It would add only about 0.2-0.5 candidates a week |
| V2 | Sector momentum rotation (top 3 of 11, monthly) | REJECTED | Sharpe 0.12 vs SPY -0.05 before 2010, 0.67 vs 0.76 since; the CIs include zero |
| V3 | Volatility-managed core (Moreira & Muir 2017) | WEAK | Sharpe higher in both halves (0.38 vs 0.28; 0.79 vs 0.75), smaller drawdowns (worst about $429 vs $645 on $1,380), but full-sample t 1.36 |
| V4 | Pre-FOMC drift (Lucca & Moench 2015) | REJECTED | +0.52% per window before 2010 (t 3.14), -0.01% since (t -0.08), -0.04% since 2016 |

## What it means
* **Nothing new is adopted.** C1 stays on its 25 tested names: the extra names show no edge on their own, so widening would only add noise.
* **V3 is the one worth watching.** It is the only idea that improved risk-adjusted return in both halves, but it is not significant. It goes to the
  Sunday rule-evolution list as "re-test with a longer sample (e.g. 1950-, on ^GSPC) before adopting".
* The honest answer to the owner's question stays "yes, one tradeable setup", plus the index core, which does the money-making.
