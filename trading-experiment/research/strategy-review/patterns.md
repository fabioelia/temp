# B1 RSI(2) and B2 follow-through day (2026-10-29)

Yahoo bars through 10/28; rows in `patterns-results.csv`. Net of 5 bps, vs random entry over the same days. Options: Black-Scholes at VIX, 30 DTE delta-0.40 call, 3% spread, no skew (approximate). Signals use the close; at 14:43 the bar is unfinished.

## B1: Connors RSI(2), SPY

| Test | Period | n | Mean | Median | Hit | Worst | Random | Excess | t | EV/$ (random) |
|---|---|---|---|---|---|---|---|---|---|---|
| B1 | 1993-2026 | 129 | +0.70% | +0.89% | 79% | −10.2% | +0.15% | +0.55% | 3.46 | 0.99 (0.95) |
| B1 | 1993-2009 | 52 | +1.06% | +1.05% | 83% | −2.5% | +0.12% | +0.94% | 4.37 | 1.07 (0.94) |
| B1 | 2010-2026 | 77 | +0.46% | +0.82% | 77% | −10.2% | +0.19% | +0.27% | 1.23 | 0.93 (0.96) |
| B1 | last 10y | 48 | +0.59% | +1.03% | 75% | −4.2% | +0.20% | +0.39% | 1.71 | 0.94 (0.97) |
| B1b | 1993-2026 | 253 | +0.77% | +0.95% | 83% | −7.7% | +0.21% | +0.56% | 5.07 | 0.97 (0.94) |
| B1b | 1993-2009 | 118 | +1.01% | +1.06% | 85% | −5.3% | +0.16% | +0.86% | 5.62 | 1.04 (0.92) |
| B1b | 2010-2026 | 135 | +0.56% | +0.80% | 81% | −7.7% | +0.27% | +0.29% | 1.84 | 0.91 (0.95) |

- The stock edge is real (median hold 3-4 sessions, random-entry p < 0.001). Since 2010 it is half its full size: 49% for B1, 51% for B1b.
- Through calls, both lose since 2010, below random entry. EV is 0.93 for B1 (CI 0.87-0.99) and 0.91 for B1b (0.85-0.96).
- Why: VIX is 20.1 at entry (18.4 average) and drops 1.5 points by the exit. Vega, theta and the spread beat a 0.5% bounce.

## B2: follow-through day, ^GSPC, +1.25%

| Period | n | 10d mean | Median | Hit | Worst | Random | Excess | HAC t | Success vs base | EV/$ hold 10 (random) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1950-2026 | 180 | +0.64% | +0.76% | 63% | −24.8% | +0.36% | +0.27% | 0.90 | 81% vs 75% | 0.97 (0.87), 1990-2026 |
| 1950-1989 | 84 | +0.64% | +0.77% | 65% | −11.2% | +0.34% | +0.30% | 0.82 | 81% vs 74% | none (no VIX) |
| 1990-2009 | 58 | +0.17% | +0.56% | 59% | −24.8% | +0.29% | −0.12% | −0.18 | 74% vs 76% | 0.89 (0.84) |
| 2010-2026 | 38 | +1.34% | +1.73% | 66% | −6.7% | +0.50% | +0.84% | 1.36 | 89% vs 77% | 1.08 (0.92), CI 0.86-1.31 |

- **22-session excess:** +0.26% overall (t 0.58); since 2010, +1.72% (t 2.43).
- **Variants:** +1.0% gives t 1.13 and EV 0.96; +1.5% gives t 0.81 and EV 0.91.
- **"Success"** (no close below the low in 22 sessions) is 81%, against Kraul's 74%. Partly mechanical.

### The persona's split (0.81 vs 1.27)

| Prior 3 sessions | n | 10d net | EV hold 10 (n) | EV +50%/−50% |
|---|---|---|---|---|
| ≥ +2% | 28 | −0.11% | 0.88 (16) | 0.98 |
| 0 to +2% | 85 | +0.65% | 0.85 (42) | 0.91 |
| < 0 | 67 | +0.93% | 1.15 (38) | 1.02 |
| Three up closes | 30 | +0.53% | 1.15 (16) | 1.17 |

- **Gap:** ≥ +2% minus < 0 is −0.27 EV (permutation p 0.33). With the +50/−50 exit it is −0.04 (p 0.84).
- **Since 2010 it reverses:** 1.24 (n 6) vs 1.20 (n 13).
- **IWM replica of the persona's setup** (post-hoc: +1.5%, delta 0.30, +50/−50 exit, n 86): 0.89 vs 0.97, p 0.62. All IWM FTDs give 0.95, not 1.05.
- **Stock level:** ≥ +2% lags in every period, but p ≥ 0.09.
- **Noise.** The split was picked after many cuts.

**Post-hoc:**
- As written, "Day 4+" admits Day 50-258 signals. Capping at Day 4-10 gives n 113, t 0.54, EV 0.97: unchanged.
- FTDs after shallow 2-5% dips: n 17, EV 0.91 (since 2010, n 5, EV 0.58). Too few to judge.

## Live now (10/28 close)
- **B1: no.** SPY 772.31, RSI(2) 85.
  - B1 needs a close ≤ 712.62, below the 200-day (725.2), so it cannot fire.
  - B1b needs ≤ 744.33 (−3.6%).
- **B2, S&P: not a tested setup.** The 10/23 low close (7,623.68) was only −2.5% from the 252-day high (7,818.93); the test needs −5%.
  - Thursday +1.25% means ≥ 7,840.78 on volume > 5.47B, a record close. That is the untested shallow-dip case.
- **IWM (post-hoc): qualifying.** The 10/16 low was −9.4%. Thursday is Day 9, prior 3 sessions +2.01%, and +1.5% needs ≥ 285.51.
  - Shadow is right, but because FTD calls sit near EV 0.95 (1.04 since 2010, CI 0.86-1.23), not because of the run.

## Verdicts

| Claim | Verdict | Reason |
|---|---|---|
| B1 | WEAK | t 3.46; decayed after 2010; calls 0.93, below random |
| B1b | WEAK | t 5.07; since 2010 at the half-size bar; calls 0.91, below random |
| B2 | WEAK | right sign, t 0.90; EV 0.97; 1.08 since 2010, CI spans 1 |
| Persona split | Not supported | p 0.33; reverses since 2010; absent on IWM. Drop it from briefs |
