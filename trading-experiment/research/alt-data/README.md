# Alternative data review, 2026-10-30: what is reachable for free, and what survived testing

**Owner's ask:** "Research into alternative data sources." Same method as the strategy review: claims and tests committed before any result (`claims.md`,
commit b0291c9), then tested with costs, splits, a random-entry baseline and the options model. Details: `finra.md`, `wikipedia.md`, `putcall-predmkt.md`;
scripts in `scripts/`.

## Verdicts
| ID | Source | Claim | Verdict | The number that decides it |
|---|---|---|---|---|
| E1 | FINRA daily short-sale volume (all 2,032 files, 2019-2026) | Heavy shorting predicts weak returns | **REJECTED** | 3,788 signal days: +0.29% beyond SPY over 5 days vs +0.21% on all days (the wrong sign; t -0.5). Puts 0.87 per $ |
| E1b | Same | Light shorting predicts gains | **WEAK** | +0.16% beyond baseline (t 1.4), the same sign in both halves. Calls 1.10 per $ vs 1.07 for any-day calls |
| E2 | Wikipedia pageviews (25 mega-caps, 2015-2026, 4,491 spikes) | Attention spikes predict returns or volatility | **REJECTED** | 5-day abnormal -0.07% (t -0.7); 20-day -0.54%, the wrong sign; no volatility beyond RV20; options equal random entry (1.09 / 0.90) |
| E3 | Cboe equity put/call ratio | High P/C (fear) predicts a bounce | **WEAK; decayed** | +0.49% over 10 days (t 1.37, 39 episodes); calls 0.93 per $. 2019-2026 (post-hoc): -0.65% |
| E4 | Congressional trades (TipRanks via Robinhood) | Politicians beat the market | Untestable here (about a year of history) | Literature: the edge largely disappeared after the 2012 STOCK Act |
| E5 | WallStreetBets | Due-diligence posts predict returns | Untestable here (Reddit blocked) | Literature (Bradley et al., RFS 2024): yes before GameStop, gone after |
| E6 | Option-implied skew | Skew predicts stock returns | Untestable here (no option history) | Literature: Xing, Zhang & Zhao 2010; post-2010 persistence unverified |
| E7 | Polymarket and Kalshi | Calibrated event odds | **Adopted as a live input** (not a return signal) | 10/30: Fed hike 12/9 ~70%; House to the Democrats ~94%, Senate ~70%; ceasefire through the midterms ~88%; Iran deal by 11/30 ~9-10% (`scripts/predmkt.py`) |
| E8 | StockTwits/X sentiment | Sentiment predicts returns | Untestable here (no free history) | Literature: the Twitter-mood result failed replication |
| - | Google Trends, TSA, GitHub, House Stock Watcher | - | Blocked from this container | - |

## What we take from it
1. **No free alternative signal clears the bar for trading.** The two with history were rejected (FINRA heavy-short, Wikipedia attention), and the others are weak or decayed.
2. **Adopted:** `research/alt-data/scripts/predmkt.py` gives prediction-market odds as an input to the macro brief (event probabilities, not trade signals).
3. **Retired arguments** (added to the playbook's evidence rules): short-volume spikes, Wikipedia or web attention, and the put/call ratio may not be cited as edges.
4. **Honest bottom line:** across both reviews, the free, popular signals look arbitraged away. The alternative data with real published evidence (card spend, foot
   traffic, app downloads, satellite) is paid, and none of it is available here.
