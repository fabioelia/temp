# Strategy v3: ETF tests V2-V4, run 2026-11-11

Tests exactly as fixed in `claims.md`; open choices are fixed in `scripts/etf_tests.py`'s docstring
(`python3 -I scripts/etf_tests.py V2_DATA_DIR V3_DATA_DIR`). Yahoo daily adjusted closes to 2026-11-06. No test was changed after the results.

| ID | Verdict | Deciding numbers (pre-2010 / 2010-2026) | For a $1,380 account |
|---|---|---|---|
| V2 sector momentum, top 3 of 11 (12-1), monthly | **REJECTED** | Sharpe 0.12 vs SPY -0.05 / **0.67 vs 0.76**; bootstrap 95% CI of the difference [-0.07, +0.41] / [-0.30, +0.10]. Max drawdown -46.5% vs -55.2% / -30.3% vs -33.7% | On the $1,104 VOO sleeve: +$46/yr before 2010, **-$15/yr since**; max drawdown $514 vs $609 |
| V3 vol-managed core vs fixed 80/20 | **WEAK** (passes the S2 rule, fails significance) | Sharpe 0.38 vs 0.28 / 0.79 vs 0.75; max drawdown -31.1% vs -46.7% / -22.2% vs -27.5%; full-sample Sharpe difference +0.09, **t 1.36** (needs 2) | Return about equal: +$1/yr full sample, -$6/yr since 2010. Max drawdown $429 vs $645 ($306 vs $379 since 2010) |
| V4 pre-FOMC drift (close t-2 to close t) | **REJECTED** (early data only) | Net excess vs other days +0.52%/window (t 3.14) / **-0.01% (t -0.08)**; since 2016 -0.04% (t -0.24) | Moving the $276 reserve into VOO, 8 windows/yr: +$11.60/yr before 2010, **+$1.91/yr since**, of which the drift is -$0.22 (the rest is the ordinary equity premium). Worst window -$9.50 |

**Costs** (rate x one-way turnover, v2's per-switch convention): V2 10 bps, 2.7 turnovers/yr (0.27%/yr; at a doubled 20 bps, a sensitivity, Sharpe since 2010 is 0.65). V3 5 bps, 1.45/yr. V4 5 bps per window (one VOO round trip; SGOV's 2 bp spread not charged).

**What the tests say**
* **V2.** Sector momentum (Moskowitz & Grinblatt 1999) helped in 2000-2009 (2008: -29.8% vs -36.8%), but the CI includes zero, and since 2010 it trails SPY by 1.4 pts of CAGR.
* **V3.** Moreira & Muir's (2017) pattern appears in both halves at the same 80% average exposure: higher Sharpe, drawdowns a third smaller before 2010 and a fifth after. It is not significant. The 11.6% target was fit on the full sample, so exposure averaged 0.76 before 2010 and 0.84 after. Two labelled sensitivities, a per-half refit and next-close trading, agree (Sharpe 0.76-0.78 vs 0.75 since 2010). As WEAK it may only break a tie: the same return for smaller drawdowns is a preference, not an edge. Information only: October's realized vol was 11.1%, so the rule would hold 100% VOO now.
* **V4.** Lucca & Moench (2015, *J. Finance* 70(1), 329-371) found the drift in 1994-2011. We reproduce it before 2010 (+0.57% gross, t 3.44). It has vanished since 2010 and since 2016.

**FOMC dates:** 262 scheduled announcements, 1994-02-04 to 2026-10-28, listed in the script. Sources are the Fed's pages https://www.federalreserve.gov/monetarypolicy/fomchistorical1994.htm through `...2020.htm`, and https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm for 2021-2026. Excluded: unscheduled meetings, conference calls, notation votes and the cancelled March 2020 meeting.

**Labelled limits (not deviations):**
* V2's pre-2010 half starts in January 2000, because the first 12-1 signal needs 13 month ends after the December 1998 launch.
* V3 uses the claim's vol ratio, not M&M's variance ratio.
* V4 uses the claim's close-to-close window, not L&M's 2 pm to 2 pm.

**Bottom line:** nothing is CONFIRMED, so nothing changes. The 80% VOO / 20% SGOV core stays.
