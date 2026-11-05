# Macro memo, Thu 2026-11-05 (Run B, after the AI-stock rout)

**Verdict: no trade.** The post-crash test (`scripts/macro_1105.py`, specification fixed before the first run) fails on every contract.

## 1. What drove the rout: a policy shock, with AI credit as the amplifier
- **Policy (primary).** Reuters' close says chipmakers sank on fears that tighter AI regulation will slow the data-center buildout after the Democratic wins. The semiconductor index fell 12%, IREN and APLD fell 14%, and GEV fell 7.5% ([Reuters via Devdiscourse](https://www.devdiscourse.com/article/international/4002353-us-stocks-nasdaq-posts-biggest-daily-drop-in-19-months-on-fears-of-ai-regulations)). Top Democrats called for a "national data center moratorium" (CNBC, 15:16 ET headline).
- **Credit: AI-specific, not broad.** HYG fell 0.31% against SPY's 4.41%. Its 250-day beta implied a 1.03% fall, so HYG held up by 3.6 sd. HY OAS was 3.32% on 11/4 (FRED; the 11/5 print is not out yet), close to its 1-year high of 3.46. Headlines (Bloomberg): "Hedge Funds Were 'Massive' Sellers of AI Debt" (15:27 ET), "Mystery Seller Seeks to Dump $500 Million of Data Center Loans" (13:52 ET).
- **Positioning.** The drop came the day after the S&P's best day in 3 months, on 26.9B shares traded against a 17.7B average (Reuters).
- **Rates.** TLT rose only 0.2% and ^TNX was 4.84, so there was no flight to bonds. Odds of a December hike fell to 67% (bloomingbit headline) from 78-80% on 11/4. Hammack and Barkin favor gradual hikes (Reuters headline).

## 2. Jobs, and the post-crash test
- **Jobs pricing.** The SPY 11/6 733 straddle is 10.85, or 1.48%: C 5.39/5.46, P 5.61/5.71 (Cboe, 11/5 closing quotes). Against jobs Fridays since 1990, scaled by ^VIX, it pays 0.83 ± 0.07 per $, so it is rich. It is not tradeable (DTE 1).
- **Test.** The event is ^GSPC ≤ -4% with VIX9D > VIX3M: n 17 since 2011, in 6 episodes. Entry is at the t+1 close, with the playbook exits, priced at today's IV.
  - The 745C for 11/20 pays 0.75 (t -3.9).
  - The four puts pay 0.87-0.94 (vol-normalized 0.78-0.82). Kelly is $0.

## 3. Friday's 14:43 check
- **Halt levels** (from the ^GSPC close of 7,353.73): Level 1 at 6,838.97 (SPY about 681.7), Level 2 at 6,397.75, Level 3 at 5,882.98. A Level 1 or 2 halt before 15:25 lasts 15 minutes.
- **Scheduled events.** Jobs print at 08:30 (about 65k expected, IndexBox headline). Iran says five tankers were hit by mines (Al Jazeera headline). Bonds are closed 11/11.

**Consensus** (buy the capitulation dip): no match, since calls pay 0.75.
