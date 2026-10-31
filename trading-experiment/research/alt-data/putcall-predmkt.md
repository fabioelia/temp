# E3 put/call contrarian and E7 prediction markets (2026-10-30)

Rows: `putcall-results.csv`. Code: `scripts/pc_*.py`, `scripts/predmkt.py`.

## E3: WEAK (registered). Out of sample (post-hoc), the edge vanished. Bearish variant: REJECTED

**Data.** Cboe `equitypc.csv` and `totalpc.csv` (header on row 3: DATE, CALL, PUT, TOTAL, P/C Ratio). They cover 2006-11-01 to 2019-10-04, 3,253 sessions, the same days as SPY. ETPs were dropped from equity volume on 2012-06-11; the level moved only 0.68 to 0.66. Signals run from 2007-11-14 (n 2,993).

**Equity P/C, next 10 sessions, minus all days (Newey-West t)**

| Signal | n (episodes) | Full | 2nd half | 2010-19 |
|---|---|---|---|---|
| Top 10% (bullish) | 345 (39) | +0.49% (t 1.37) | +0.49% | +0.39% |
| Bottom 10% (bearish) | 418 (30) | -0.19% (t -0.61) | -0.25% | -0.57% |

- Top 10% at 5 sessions: +0.46% (t 1.94). At 21 sessions: +0.61% (t 0.95). Net of 5 bps: +0.44%.
- Total P/C's 5-session t of 2.97 is the best of about 36 cells, so it does not count.
- **Options gate fails.** A 0.40Δ 30 DTE call held 10 sessions returns 0.93/$ at VIX (all days 0.88). At 0.72x VIX it returns 1.22 vs 1.09 (t 1.07).

**Post-hoc (decided after these results).**
- **Extension through 2026.** Cboe's daily JSON starts 2019-10-07, so the identical rule was run to 2026-10-29.
  - Top 10%, 2019-2026: **-0.65%** (t -1.32, 14 episodes). Spliced 2007-2026: +0.03% (t 0.10).
  - Calls on those days: 0.75 vs 0.92 at VIX.
  - **The bullish signal decayed.**
- **Bearish side.** Bottom 10% over 2010-2026: -0.47% (t -2.1). Suggestive only.
- **Timing.** A one-session lag (our 14:43 timing) changes little: +0.45%.

**Use.** No persona may cite high P/C as bullish support. No playbook change.

**Live.** Equity P/C **0.58** for 2026-10-29 (1,324,620 puts / 2,277,666 calls); total P/C 0.85.
- Source: `https://cdn.cboe.com/data/us/options/market_statistics/daily/2026-10-29_daily_options`, the JSON behind cboe.com's market-statistics/daily page.
- Fetched 22:21 UTC 10/30. The 10/30 file was still 403 at 18:21 ET, so at 14:43 only the prior session is available.
- The 10-day average, 0.595, is at the 55th percentile: **neutral**.

**Caveats.** Only 39 independent episodes. Black-Scholes ignores skew. The 2022 single-day spikes (up to 2.40) were kept raw.

## E7: event odds (documentation only)

Fetched 2026-10-30 22:27:45-52 UTC, after the close. Probability = bid/ask midpoint.

| Event | Polymarket | Kalshi |
|---|---|---|
| Fed 12/9 | Hike 25 bp 70.5%, hold 27.5%, any cut 1.3% | Hike 25 69.5%, hold 28.5%, any cut 1.0% |
| House (11/3) | D 93.5% | D 93.5% |
| Senate | D 70.5% | D 70.5% |
| US-Iran ceasefire holds | Through midterms 87.5%; 11/15 48.5%; 11/30 36.5% | none |
| US-Iran nuclear deal | By 11/30 10.5%; Hormuz deal 23.5% | Before 12/1 9.0% |
| WTI in November (thin) | Touches $110: 60.5%; $120: 25.5% | No open monthly market |

**Endpoints**
- Polymarket: `gamma-api.polymarket.com/events?slug=` plus these slugs:
  - `fed-decision-in-december-20260729232808632`
  - `which-party-will-win-the-house-in-2026` (and `-senate-`)
  - `us-iran-ceasefire-continues-through-the-midterms`
  - `us-iran-ceasefire-continues-throughptptpt`
  - `us-iran-final-nuclear-deal-by-20260621201254412`
  - `us-iran-hormuz-agreement-byptptpt-20260803235957575`
  - `what-price-will-wti-hit-in-november-2026`
- Kalshi: `api.elections.kalshi.com/trade-api/v2/events/<ticker>?with_nested_markets=true` for `KXFEDDECISION-26DEC`, `CONTROLH-2026`, `CONTROLS-2026` and `KXUSAIRANAGREEMENT-27`.
- `predmkt.py` prints all of these with exact URLs and timestamps. `--search` finds new slugs.

**Calibration.** Page & Clemen, *Economic Journal* 123(568):491-513, 2013 (ideas.repec.org/a/ecj/econjl/v123y2013i568p491-513.html).
- Near-term markets are reasonably calibrated.
- Distant events show a favourite-longshot bias: longshots are overpriced. This comes from abstract-level summaries; the full text is paywalled.
- So treat the 5-15% Iran tails as upper bounds. The liquid midterm and Fed markets are the more reliable inputs.
