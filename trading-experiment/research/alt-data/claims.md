# Alternative data: claims under test (pre-registered 2026-10-30, before any result)

The owner asked (2026-10-30): "Research into alternative data sources". Same protocol as the strategy review (`../strategy-review/PROTOCOL.md`): claims and
tests fixed here before testing, a random-entry baseline, costs, splits, the options translation, and verdicts CONFIRMED / WEAK / REJECTED / UNTESTABLE. Only
CONFIRMED results may change the playbook.

## Access check (2026-10-30, from this container)
| Source | Reachable? | History |
|---|---|---|
| FINRA Reg SHO daily short-sale volume (cdn.finra.org, CNMS consolidated file) | yes | 2019-01 to now (2018-06 refused) |
| Wikipedia pageviews API (wikimedia.org REST, needs a descriptive User-Agent) | yes | 2015-07 to now |
| Cboe put/call ratio archive (cdn.cboe.com totalpc.csv, equitypc.csv) | yes | archive ends about 2019 |
| Cboe daily market statistics page | yes | live only |
| StockTwits API | yes | recent messages only |
| Polymarket and Kalshi APIs | yes | live probabilities |
| Robinhood `get_politician_trades` (TipRanks) | yes | about a year per ticker |
| USAspending, SEC full-text search, FRED | yes | long |
| Google Trends, Reddit, the House Stock Watcher S3, GitHub API, TSA | **no** (404/403) | none |
| CFTC COT history zips | **no** (403); the current week's file yes | - |

## Claims and exact tests
| ID | Claim | Source | Test |
|---|---|---|---|
| E1 | Heavy short selling predicts lower returns over the next days | Boehmer, Jones & Zhang (JF 2008, NYSE data); Lynch, Nikolic, Yan & Yu (aggregate shorting predicts market returns over 10 days); FINRA files are the free proxy. Caveat: they include market-maker shorts | 25 mega-caps (the C1 list) plus SPY, QQQ and IWM, 2019-2026. Ratio = ShortVolume / TotalVolume, z-scored against the stock's own trailing 60 sessions. Signal: z >= 1.645 (top 5%). Outcome: the next 5- and 10-session return beyond SPY (raw for SPY itself), against all days of the same stock. Splits 2019-2022 vs 2023-2026. Options: a 25 DTE delta-0.35 put at RV20 x 1.1, held 5 sessions. Variant E1b: z <= -1.645 (light shorting) predicts higher returns |
| E2 | Wikipedia attention spikes predict returns (Da, Engelberg & Gao 2011 for Google search: up then reversal; Pyun 2025: changes in views, long-short, weekly) | Da et al. JF 2011; Pyun SSRN 2025; Wei WWW 2016 | The same 25 mega-caps' company articles, 2015-07 to 2026-10. Abnormal attention = views / trailing 60-day median; spike = top 5% of each stock's own history. Outcome: the next 5- and 20-session return beyond SPY, plus the next 5-session realized vol vs the prior RV20. Report all spikes and spikes away from earnings (excluding +/-3 sessions of an 8-K 2.02). Splits 2015-2020 vs 2021-2026. Options: a delta-0.35 call and put held 5 sessions at RV20 x 1.1 |
| E3 | The equity put/call ratio is a contrarian indicator: high P/C means fear, and stocks rise after | Widely blogged (Investopedia, StockCharts); the academic evidence is mixed | Cboe equity P/C (equitypc.csv) and total P/C, with SPY. Signal: the 10-day average of equity P/C in its top 10% of the trailing 252 days (and the bottom 10% as the bearish variant). Outcome: the next 5/10/21-session SPY return against all days. Splits by the first and second half of the available history. Options: SPY 30 DTE delta-0.40 calls at VIX (and at 0.72x VIX, the real-skew note from D1) |
| E4 | Congressional trades beat the market | Ziobrowski et al.; post-STOCK Act studies find the edge gone (Huang & Xuan 2023 via VoxEU; NBER w26975) | UNTESTABLE HERE: the free history is about a year per ticker via Robinhood/TipRanks, and disclosures lag up to 45 days. Literature only |
| E5 | WallStreetBets due-diligence posts predict returns | Bradley, Hanousek, Jame & Xiao (RFS 2024): yes before GameStop, gone after | UNTESTABLE HERE (Reddit is blocked). Literature: not after 2021 |
| E6 | Implied-vol skew predicts single-stock returns | Xing, Zhang & Zhao (JFQA 2010) | UNTESTABLE HERE (no historical option prices). It could be computed live from the Cboe chain; literature only |
| E7 | Prediction markets give calibrated event odds | Wolfers & Zitzewitz (2004) and the calibration literature | Not a return signal. Document the Polymarket and Kalshi endpoints for the macro brief as event-probability inputs, with sources |
| E8 | Social sentiment (StockTwits/X) predicts returns | Bollen et al. 2011 (Twitter mood; replications failed); Renault 2017 (StockTwits, intraday) | UNTESTABLE HERE (no free history). Literature only |
