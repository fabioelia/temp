# Strategy v4 candidates (2026-11-11): ideas for the probe slots

Owner, 11/11: "have a handful to be probing and testing with." This is a ranked list of ideas for the open slots in `probe-program.md`. Each idea still needs a registered claim and a committed script before it can go live. Every idea here is long-only stock or ETF, fractional, and held at least one night, so the PDT rule never binds.

**ETF screen** (computed 11/11 from Yahoo monthly adjusted closes, as excess returns over BIL; the script is not committed, so re-derive these numbers before citing them):

| ETF (start) | Sharpe vs SPY | Excess/yr vs SPY (t) | Correlation with SPY |
|---|---|---|---|
| MTUM (2013) | 0.80 vs 0.87 | +1.1% (0.44) | 0.84 |
| QUAL (2013) | 0.85 vs 0.88 | -0.4% | 0.98 |
| VLUE (2013) | 0.67 vs 0.87 | -0.6% | 0.88 |
| USMV (2011) | 0.91 vs 0.96 | -3.1% | 0.85 |
| AVUV (2019) | 0.58 vs 0.80 | +1.7% | 0.78 |
| DBMF (2019) | 0.62 vs 0.80 | alpha +8.3% (2.0), beta -0.10 | -0.15 |
| GLD (2007) | 0.51 vs 0.65 | alpha +8.1% (2.0) | 0.08 |
| PKW, buybacks (2007) | 0.59 vs 0.65 | alpha 0.0% | 0.91 |

**No single-factor ETF beat SPY on Sharpe after it launched.**

## Ranked candidates

| # | Probe | Evidence (replication) | Edge after costs | $50 version | Data / testable here? | Claim to register |
|---|---|---|---|---|---|---|
| 1 | **Earnings premium in shares** (C2 without options) | Announcing firms earn more: [Barber et al. 2013, 46 countries](https://alphaarchitect.com/introducing-the-global-earnings-announcement-premium/); Savor-Wilson 2016 (+9.9% a year annualized). Ours, C2: +0.26% (t 2.7), 2015-26 t 1.7. Some evidence it is fading (Heitz et al. 2020) | +0.16% an event, about 8¢ per $50 | $25 each of 2 tested names, bought at close t-7 and sold at close t-1 | Yes, the C2 script exists | Live mean stays inside the C2 confidence interval after 30 or more events. Variant C2b holds through the print (re-run first) |
| 2 | **Trend on non-equity assets** (diversifier, not equity timing; S2 tested SPY only) | [Hurst-Ooi-Pedersen 2017](https://www.aqr.com/Insights/Research/Journal-Article/A-Century-of-Evidence-on-Trend-Following-Investing): 67 markets since 1880. Critique: [Huang et al. 2020](https://profiles.wustl.edu/en/publications/time-series-momentum-is-it-there/), where asset by asset 47 of 55 have t < 1.65 | Its value is a correlation near zero, not alpha | $50 DBMF (check fractional tradability), or a 10-month SMA rule on GLD/IEF/DBC | Yes: Yahoo futures (GC=F, ZN=F, CL=F, 2000-) and ETFs | A 10% sleeve raises the core's Sharpe in 2000-12 and 2013-26, and is positive in 2022 |
| 3 | **Gold sleeve** (risk parity-lite; true risk parity needs leverage) | 80/20 SPY/GLD: Sharpe 0.75 vs 0.65 (2007-26), better in both halves, max drawdown -40% vs -51%. 60/40 with IEF failed after 2022: the stock-bond correlation went from -0.32 to +0.54, and the Sharpe fell to 0.27. [Erb-Harvey 2013](https://www.nber.org/papers/w18706): no anchor for an expected return | A diversifier; any premium is unproven | $50 GLDM | Partly: GC=F from 2000 only | Beats 80/20 VOO/SGOV on Sharpe and drawdown in both halves and in every 5-year block |
| 4 | **Stock momentum (12-1), long-only** | [Geczy-Samonov 2016](https://papers.ssrn.com/abstract=2292544): about 0.4% a month, 1801-2012. Replicates in [JKP 2023](https://doi.org/10.1111/jofi.13249). [Blitz et al. 2020](https://repub.eur.nl/pub/130144): the long leg carries the premium. Prone to crashes | MTUM live +1.1% a year (t 0.44) | Top 5 of the S&P 100 at $10 each, rebalanced monthly; or $50 MTUM | Yes: Yahoo (survivorship bias) plus Ken French's momentum deciles from 1927 | Top decile minus the market after publication (1993-) has t > 3, positive in both halves |
| 5 | **Insider purchase clusters** | Lakonishok-Lee 2001; [Cohen-Malloy-Pomorski 2012](https://www.nber.org/papers/w16454): opportunistic buys earn 82 bp a month value-weighted. Alldredge-Blank 2019: clusters [+2.1% the next month](https://www.interactivebrokers.com/campus/traders-insight/securities/stocks/what-corporate-insider-buying-can-tell-investors-evidence-from-academic-research/). Concentrated in small caps | Unknown above $2B | At 2 or more officers/directors with open-market buys (code P) of $100k or more within 5 days: buy $25, hold 21 sessions | Yes, but a large fetch: `research.py sec insiders` live, and Form 4 XML back to 2003 | 21-session excess vs SPY has t > 3 and is positive in 2004-14 and 2015-26 |
| 6 | **Same-month seasonality** (stock-level, not the calendar tests) | [Keloharju-Linnainmaa-Nyberg 2016](https://econpapers.repec.org/RePEc:bla:jfinan:v:71:y:2016:i:4:p:1557-1590): about 13% a year long-short, also in commodities and country indices; Heston-Sadka 2008. Overlaps with #1 | Unknown; turnover is high | Top 5 of the S&P 100 by past same-calendar-month returns, monthly | Yes, Yahoo | Top quintile vs the equal-weight universe has t > 3, both halves |
| 7 | **PEAD on surprise, mid caps** | Bernard-Thomas 1989. [Martineau 2022](https://cfr.ivo-welch.info/published/papers/martineau2021rest.pdf): gone in large caps by 2006. [Subrahmanyam](https://anderson-review.ucla.edu/is-post-earnings-announcement-drift-a-thing-again) finds it alive, but with microcaps included. Our up gaps were REJECTED | Probably ≤ 0 after spreads | Top surprise decile in the S&P 400, held 60 sessions | Yes: EPS from SEC XBRL (2009-) and a seasonal random walk, so no consensus is needed | Top decile 60-day excess vs IJH has t > 3 |
| 8 | **Factor tilts** (value, size, quality, low vol) | Indexes went from +2.77% a year before listing to -0.44% after ([Huang-Song-Xiang 2024](https://ideas.repec.org/a/cup/jfinqa/v59y2024i6p2515-2546_2.html)). Value: 0.42% → 0.11% a month ([Fama-French 2021](https://papers.ssrn.com/abstract=3525096)). Size is weak ([Alquist et al. 2018](https://alphaarchitect.com/fact-fiction-and-the-size-effect/)). [BAB disputed](https://mysimon.rochester.edu/novy-marx/research/BABAB.pdf) | About 0, per the screen | Paper only | Yes: Ken French, [Open Source Asset Pricing](https://www.openassetpricing.com/) | Long-only top portfolio's market alpha has t > 3 after publication |
| 9 | **Dividend initiations** | [Michaely-Thaler-Womack 1995](https://www.nber.org/papers/w4778): +7.5% over 12 months. [Boehme-Sorescu 2002](https://econpapers.repec.org/RePEc:bla:jfinan:v:57:y:2002:i:2:p:871-900): significant only when equal-weighted | Small; rare in large caps (META, GOOGL, CRM in 2024) | $25 on an initiation, held 60 sessions | Yes, from Yahoo dividend events | n is likely under 50: an event watch only |

## Not worth a slot
* **Buyback announcements.** Ikenberry et al. 1995 found the drift, but [Fu-Huang 2016](https://econpapers.repec.org/RePEc:inm:ormnsc:v:62:y:2016:i:4:p:964-984) finds it gone for 2003-12 announcements, and PKW's alpha is 0.0%.
* **S&P 500 additions.** The effect went from 7.4% in the 1990s to under 1% ([Greenwood-Sammon 2025](https://www.nber.org/system/files/working_papers/w30748/w30748.pdf)), and it sits in the announcement gap, which we cannot capture.
* **Analyst revisions.** Chan-Jegadeesh-Lakonishok 1996 needs paid I/B/E/S history; Robinhood shows only current ratings. Untestable here.

## Where to find more (reachable from this container on 11/11)
* [Open Source Asset Pricing](https://www.openassetpricing.com/): Chen-Zimmermann, 200+ predictors' monthly returns, with 98% reproduced.
* [JKP factors](https://jkpfactors.com/)
* [Ken French library](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html)
* [AQR datasets](https://www.aqr.com/Insights/Datasets)
* [Quantpedia](https://quantpedia.com/), [Alpha Architect](https://alphaarchitect.com/), [CXO Advisory](https://www.cxoadvisory.com/)
* [SSRN](https://www.ssrn.com/), and the replication papers in Critical Finance Review.

## Warnings
* **Multiple testing.** [Harvey-Liu-Zhu 2016](https://nber.org/papers/w20592) want t > 3. [Hou-Xue-Zhang 2020](https://ideas.repec.org/a/oup/rfinst/v33y2020i5p2019-2133..html): 65% of 452 anomalies fail at t 1.96 once microcaps are controlled (82% fail at 2.78). JKP 2023 is more hopeful, but even the survivors are small.
* **Decay.** [McLean-Pontiff 2016](https://doi.org/10.1111/jofi.12365): anomaly returns are 26% lower out-of-sample and 58% lower after publication.
* **Costs.** [Chen-Velikov 2023](https://www.federalreserve.gov/econres/feds/zeroing-in-on-the-expected-returns-of-anomalies.htm): the average anomaly nets about 4 bp a month after costs and decay, and the best about 10 bp.
* **Power** (see `probe-program.md`). MTUM's +1.1% a year at about 9% tracking error would need about 80 years to reach t 2. The backtest decides; the probes test fills and how often signals fire.
