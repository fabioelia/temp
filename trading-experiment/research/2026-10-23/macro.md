# Macro memo, Fri 2026-10-23 post-close (Druckenmiller/Soros seat)

**Verdict: my oil tripwire fired. Monday: one conditional USO call. Keep MSFT; watch credit.**

**Brief fix:** the brief's Brent ~111.5 is the January contract. Front-month Brent (BZZ26, expiring 10/30) was 116.3-116.6 at the 14:30 ET settle and closed at 116.91, above my $115 line.

## 1. Scorecard
- **Exit d) guarded the wrong tail.** The loss came through growth instead: on 10/22 the 10y fell 17bp and the Nasdaq fell 2.7%.
- **TLT: right thesis, bad execution.**
  - The 10y went from 5.09% to 5.00%, and the 82C gained 26%.
  - My Brent <$110 filter blocked the trigger on the day oil drove the rally.
  - Risk was right to cancel my chase.
- **Oil: wrong.** I wrote "stopped compounding," then Brent rose 6% through the Saudi vector I had called priced. My tripwires did work.
- **Fed and credit: right.** October hike odds fell from 18% to 7%. HY OAS printed 3.40%, as I estimated.
- **Change:** name the exact series in every trigger, and test a filter's sign before using it. Oil now shows in the 5y breakeven, 2.37% to 2.48% (a 60-day high), not in the 10y (2.34%).

## 2. Monday
- **The tape:** stagflation. Oil rose, the 2y and 10y each added 4bp, and stocks fell.
- **The tail:** no lost barrels are confirmed yet. A source told Argus that Yanbu was undamaged after the 10/19 claims; it has been Saudi Arabia's main outlet since Hormuz closed, so a confirmed hit there is the tail.
- **The entry:** the 200C rose from 1.74 to 2.955 today, so Monday must hold Friday's close.

`USO261120C00200000 | 2026-11-20 | 200 | C | 0.20 | 2.92/2.99 (Robinhood = Cboe, 15:59:59 ET; spread 2%) | 2,435 | Mon 10/26 14:43 only if BZZ26 >= 115, USO >= 169.53 and no strike or deal headline: buy 1, ceiling 3.60 (>= $557 left above the floor) | sell at the first bid >= 1.4x fill; stop at a bid <= 0.5x fill; sell on a strike or deal headline; out by the 11/3 pre-close | 3`

## 3. MSFT 10/28: keep
- **Vetoes clear:**
  - Hike odds are 7%.
  - The 10y is 31bp below its veto.
  - MSFT is 16 above its 50-day (508.4).
  - The 10/30 straddle prices a 5.3% move.
- **Binding veto:** HY OAS is 3.40%, against the 3.46% limit. I put the odds of a breach by 10/27 at about one in three (estimate); if it fires, USO is the leg that pays.
- **Strike walk:** start at 570.

**Sources:**
- Treasury (17:15 ET), FRED (17:16), Polymarket (17:16)
- Yahoo (16:59), Dow Jones via MarketScreener (14:36), Argus (after the 10/19 claims)
- quotes.py (Yahoo + Cboe), Robinhood
