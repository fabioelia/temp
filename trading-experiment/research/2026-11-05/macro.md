# Macro memo, Thu 2026-11-05 (Run B, after the AI-stock rout)

**Verdict: no trade.** The post-crash test (`scripts/macro_1105.py`, specification fixed before the first run) fails on every contract.

## 1. Driver: a policy shock; AI credit amplified it
- **Policy.** Reuters' close: chips sank on fears that tighter AI rules will slow the data-center buildout after the Democratic wins. SOX fell 12%, IREN/APLD 14%, GEV 7.5% ([Reuters via Devdiscourse](https://www.devdiscourse.com/article/international/4002353-us-stocks-nasdaq-posts-biggest-daily-drop-in-19-months-on-fears-of-ai-regulations)). Top Democrats called for a "national data center moratorium" (CNBC headline, 15:16 ET).
- **Credit: AI-specific, not broad.**
  - HYG fell 0.31%; its beta to SPY implied 1.03%, so it held up by 3.6 sd.
  - HY OAS was 3.32% on 11/4 (FRED), near its 1-year high of 3.46.
  - Bloomberg headlines: "Hedge Funds Were 'Massive' Sellers of AI Debt"; "Mystery Seller Seeks to Dump $500 Million of Data Center Loans".
- **Positioning.** The drop followed the best S&P day in 3 months, on 26.9B shares against 17.7B (Reuters).
- **Rates.** TLT +0.2% and ^TNX 4.84 show no flight to bonds. December hike odds fell to 67% from 78-80% (bloomingbit headline).

## 2. Jobs, and the post-crash test
- **Jobs.** The SPY 11/6 733 straddle is 10.85 (1.48%): C 5.39/5.46, P 5.61/5.71 (Cboe, 11/5 close). Measured against ^VIX-scaled jobs Fridays since 1990, it pays 0.83 ± 0.07 per $, so it is rich. It is untradeable (DTE 1).
- **Test.** ^GSPC ≤ -4% with VIX9D > VIX3M: n 17 since 2011 (6 episodes). Entry at the t+1 close, playbook exits, priced at today's IV.
  - The 11/20 745C pays 0.75 (t -3.9).
  - The puts pay 0.87-0.94 (vol-normalized 0.78-0.82). Kelly is $0.

## 3. Friday's 14:43 check
- **Halt levels** (^GSPC 7,353.73): Level 1 6,838.97 (SPY about 681.7), Level 2 6,397.75, Level 3 5,882.98. A halt before 15:25 lasts 15 minutes.
- **Events.** Jobs print at 08:30 (about 65k expected, IndexBox headline). Iran says five tankers were mined (Al Jazeera headline).

**Consensus** (buy the capitulation dip): no match, since calls pay 0.75.
