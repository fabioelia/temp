# Strategy v4 candidates (2026-11-11): ideas for the probe slots

Owner, 11/11: "have a handful to be probing and testing with." This ranks ideas for the open slots in `probe-program.md`. Each idea still needs a registered claim and a committed script. All are long-only stock or ETF, fractional, and held overnight, so PDT never binds.

**ETF screen** (Yahoo monthly closes, excess over BIL; the script is not committed, so re-derive before citing):

| ETF | Sharpe vs SPY | Result |
|---|---|---|
| MTUM (2013) | 0.80 vs 0.87 | +1.1%/yr (t 0.44) |
| QUAL | 0.85 vs 0.88 | - |
| VLUE | 0.67 vs 0.87 | - |
| USMV | 0.91 vs 0.96 | - |
| AVUV | 0.58 vs 0.80 | - |
| DBMF (2019) | - | alpha +8.3% (t 2.0), correlation -0.15 |
| GLD (2007) | - | alpha +8.1% (t 2.0), correlation 0.08 |
| PKW (buybacks) | - | alpha 0.0% |

**No factor ETF beat SPY's Sharpe after launch.**

## Ranked candidates

| # | Probe | Evidence | Edge after costs | $50 version | Data | Claim to register |
|---|---|---|---|---|---|---|
| 1 | **Earnings premium in shares** (C2 without options) | [Barber et al. 2013](https://alphaarchitect.com/introducing-the-global-earnings-announcement-premium/), 46 countries; Savor-Wilson 2016. Ours: +0.26% (t 2.7), 2015-26 t 1.7. Possibly fading (Heitz et al. 2020) | +0.16%/event | $25 each of 2 tested names, close t-7 to close t-1 | Script exists | Live mean stays inside C2's confidence interval after 30+ events. Variant: hold through the print |
| 2 | **Trend on non-equity assets** (S2 tested only SPY) | [Hurst-Ooi-Pedersen 2017](https://www.aqr.com/Insights/Research/Journal-Article/A-Century-of-Evidence-on-Trend-Following-Investing), 67 markets since 1880. Critique: [Huang et al. 2020](https://profiles.wustl.edu/en/publications/time-series-momentum-is-it-there/), 47 of 55 assets have t < 1.65 | A diversifier more than alpha | DBMF, or a 10-month SMA on GLD/IEF/DBC | Yahoo futures and ETFs, 2000- | A 10% sleeve lifts the core's Sharpe in 2000-12 and 2013-26, and is positive in 2022 |
| 3 | **Gold sleeve** (risk parity-lite; no leverage) | 80/20 SPY/GLD: Sharpe 0.75 vs 0.65 (2007-26), both halves; max drawdown -40% vs -51%. 60/40 with IEF failed after 2022, when the stock-bond correlation went from -0.32 to +0.54. [Erb-Harvey 2013](https://www.nber.org/papers/w18706): no anchor for an expected return | Unproven premium | GLDM | GC=F, 2000- | Beats VOO/SGOV on Sharpe and drawdown in both halves and in every 5-year block |
| 4 | **Stock momentum, 12-1, long-only** | [Geczy-Samonov 2016](https://papers.ssrn.com/abstract=2292544): about 0.4%/month, 1801-2012. Replicates in [JKP 2023](https://doi.org/10.1111/jofi.13249). Long legs carry it ([Blitz et al. 2020](https://repub.eur.nl/pub/130144)). Crash-prone | MTUM: +1.1%/yr | Top 5 of the S&P 100, $10 each, monthly | Yahoo (survivorship bias); Ken French deciles 1927- | Top decile minus the market after 1993: t > 3, both halves |
| 5 | **Insider purchase clusters** | [Cohen-Malloy-Pomorski 2012](https://www.nber.org/papers/w16454): opportunistic buys +82 bp/month value-weighted. Alldredge-Blank 2019: clusters [+2.1% next month](https://www.interactivebrokers.com/campus/traders-insight/securities/stocks/what-corporate-insider-buying-can-tell-investors-evidence-from-academic-research/). Mostly small caps | Unknown above $2B | 2+ officers buying (code P) ≥ $100k within 5 days: $25, hold 21 sessions | `research.py sec insiders`; Form 4 XML 2003- (a big fetch) | 21-session excess: t > 3, positive in 2004-14 and 2015-26 |
| 6 | **Same-month seasonality** (stock-level, unlike the calendar tests) | [Keloharju-Linnainmaa-Nyberg 2016](https://econpapers.repec.org/RePEc:bla:jfinan:v:71:y:2016:i:4:p:1557-1590): about 13%/yr long-short, also in commodities and country indices. Overlaps with #1 | Unknown; high turnover | Top 5 of the S&P 100 by same-month history | Yahoo | Top quintile vs equal-weight: t > 3, both halves |
| 7 | **PEAD on surprise, mid caps** | [Martineau 2022](https://cfr.ivo-welch.info/published/papers/martineau2021rest.pdf): gone in large caps by 2006. [Subrahmanyam](https://anderson-review.ucla.edu/is-post-earnings-announcement-drift-a-thing-again): alive with microcaps included. Our up gaps were REJECTED | Likely ≤ 0 | Top surprise decile of the S&P 400, 60 sessions | SEC XBRL EPS (2009-), seasonal random walk | Top-decile excess vs IJH: t > 3 |
| 8 | **Factor tilts** (value, size, quality, low vol) | [Huang-Song-Xiang 2024](https://ideas.repec.org/a/cup/jfinqa/v59y2024i6p2515-2546_2.html): +2.8%/yr before listing, -0.4% after. [Fama-French 2021](https://papers.ssrn.com/abstract=3525096): value 0.42 → 0.11%/month. Size weak ([Alquist et al. 2018](https://alphaarchitect.com/fact-fiction-and-the-size-effect/)). [BAB disputed](https://mysimon.rochester.edu/novy-marx/research/BABAB.pdf) | About 0 | Paper only | Ken French; [Open Source Asset Pricing](https://www.openassetpricing.com/) | Long-only alpha after publication: t > 3 |
| 9 | **Dividend initiations** | [Michaely-Thaler-Womack 1995](https://www.nber.org/papers/w4778): +7.5% over 12 months. [Boehme-Sorescu 2002](https://econpapers.repec.org/RePEc:bla:jfinan:v:57:y:2002:i:2:p:871-900): equal-weighted only | Small and rare | $25, held 60 sessions | Yahoo dividend events | n under 50: a watch list only |

## Not worth a slot
* **Buybacks.** [Fu-Huang 2016](https://econpapers.repec.org/RePEc:inm:ormnsc:v:62:y:2016:i:4:p:964-984): the drift is gone after 2003, and PKW's alpha is 0.
* **S&P additions.** 7.4% in the 1990s, under 1% now, and it sits in the announcement gap ([Greenwood-Sammon 2025](https://www.nber.org/system/files/working_papers/w30748/w30748.pdf)).
* **Analyst revisions.** Needs paid I/B/E/S history, so it is untestable here.

## Idea sources (reachable on 11/11)
[Open Source Asset Pricing](https://www.openassetpricing.com/) (200+ predictors, 98% reproduced) · [JKP](https://jkpfactors.com/) · [Ken French](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html) · [AQR data](https://www.aqr.com/Insights/Datasets) · [Quantpedia](https://quantpedia.com/) · [Alpha Architect](https://alphaarchitect.com/) · [SSRN](https://www.ssrn.com/) · Critical Finance Review replications.

## Warnings
* **Multiple testing.** [Harvey-Liu-Zhu 2016](https://nber.org/papers/w20592): t > 3. [Hou-Xue-Zhang 2020](https://ideas.repec.org/a/oup/rfinst/v33y2020i5p2019-2133..html): 65% of 452 anomalies fail at t 1.96 once microcaps are controlled.
* **Decay.** [McLean-Pontiff 2016](https://doi.org/10.1111/jofi.12365): 26% lower out-of-sample, 58% lower after publication.
* **Costs.** [Chen-Velikov 2023](https://www.federalreserve.gov/econres/feds/zeroing-in-on-the-expected-returns-of-anomalies.htm): the average anomaly nets about 4 bp/month.
* **Power.** MTUM's edge would need about 80 years to reach t 2. Backtests decide; probes test the plumbing.
