# Historian memo, 2026-10-17 (market historian / trading craft)

Grades: A = replicated/large-sample or mathematical identity; B = decent data, regime-dependent; C = anecdote/folklore. "[own]" = my knowledge, not freshly verified. Search budget ran out and page fetches were blocked, so figures come from search snippets and are mostly secondary.

**Bottom line:** calendar edges are worth about 1-3 points of a 100-point goal. Doubling in a month needs a fat right tail (leverage plus concentration plus luck). The best historical stock-only years were 5-6x slower than this target. Play it as a staged lottery with hard loss limits, not as an edge.

## 1. Calendar edges (Oct 19 - Nov 18)

| Edge | Evidence | Size vs costs | Grade |
|---|---|---|---|
| Midterm Q4 / post-election | Q4 of a midterm year plus the next two quarters were up 87% of the time since 1926 (Fisher). Six months after midterms were up 18/18 since 1950, avg +13.9% (Schaeffer 2018). Shiller 1871+: the month after is +0.5% (55% up), 3 months +6% (76%), 6 months +10% (87%) | Most of the edge falls after Nov 18. Only 11 sessions (Nov 4-18) are inside the window, so about +0.5-1.5% | B (n about 19) |
| October to November | Sources conflict. Detrick (since 1950): October is the best midterm month, about 79% up, November +2.7% avg. Fisher (since 1926): October negative in 8 midterm years, avg +0.5% | The disagreement shows the pattern is sample-dependent | C |
| Halloween (Nov-Apr) | 36 of 37 countries (Bouman-Jacobsen, 1970-98). Dow +7.5% vs +0.3% since 1950 (secondary) | Window has 12 sessions of it, about +1% | A- |
| Pre-FOMC drift (Oct 28) | +49 bp over 24h (1994-2011). Vanished after 2015 (Kurov et al.). Alive only in high-vol regimes (109 bp vs 9.7 bp above/below median implied vol). VIX about 20 on Oct 16 | Fills at closes cannot capture the 24h window. Skip | B- |
| Turn of month | Last 4 + first 3 days (Quantpedia). A Fed paper finds it gone after 1990 in futures | Under 1% | B- |
| PEAD | Dead in large caps since 2006 (Martineau). 2025 papers dispute that. Classic spread about 4.2% per 60 days (1970s-80s) | Microcaps only, noisy | B- |
| Buy the dip / worst week | CXO: after weeks below -4%, next week averages +0.19% with high variance. ICFS (vendor): after 5%+ weeks, 62% up next week. This week was only -1.9% | About nil | C |

Regime caution: Oct 16 was a chip rout (8 straight down days, SOXX -4.1%). Brent was reported near $110 and core CPI 3.7%. That is closer to 2022 than to the benign-dip bull market where dip-buying works.

## 2. Playbooks

- **Larry Williams 1987:** $10k to $1.14M (+11,376%) in a 12-month futures contest [Wikipedia]. Futures leverage, so not transferable.
- **Schwartz (1984), Ryan (1985-87):** Ryan won the stock division three times (161%, 160%, >100%) with a 7% max loss and 6-12 month holds on leaders. Schwartz traded S&P futures and cut losses fast. His sources conflict on return figures. The Ryan approach is long-only, so it transfers, but at yearly pace in a bull tape.
- **Minervini:** 155% in 1997 (own $250k, long-only). 334.8% in 2021 (prior record 119.1%). Normal stop about 5%. Reportedly used leverage and large size. J Law: 353.9% (2024), 252.3% (2025). No verified win rates for anyone. I will not invent them.
- **Darvas:** $10k to $2M in about 18 months (1957-58 bull market). Box breakouts with stops just below entry. Mostly transferable, but at a slower pace.
- **Livermore:** lost his roughly $3M (1907) and roughly $100M (1929) fortunes, with 3-5 bankruptcies. This is the cautionary case on over-sizing.
- **Turtles, PTJ, Druckenmiller:** multi-market futures, volatility-sized units. Turtle win rate is about 35-40% [own]. PTJ never averages losers. Concentration "when conviction is high" [own]. Needs leverage and diversification we lack.

**Lesson:** every stock-only champion made 100-350% over a year, in speculative bull tapes, with 5-8% stops. Best verified is about 13%/month compounded (334.8% over a year). A 100% month needs about 5.7x that log-pace.

## 3. The odds

- No credible published base rate exists for +100% in a month.
- Proxies: of Brazilian day traders who lasted 300+ days, 97% lost money and 1.1% beat minimum wage (Chague et al., secondary). In Taiwan, under 1% were predictably profitable (Barber et al.).
- My simulation (fat-tailed daily returns, 23 sessions, zero drift), holding one leveraged ETF:
  - 3x on a 28%-vol index: P(2x) 0.2%, P(0.5x or worse) 0.9%, median 0.97.
  - 3x on 50%-vol semis: P(2x) 3.6%, P(0.5x or worse) 10%, median 0.92.
  - 3x at 60% vol: P(2x) 5.9%, P(0.5x or worse) 15.8%.
- Drag is (L²-L)/2·σ²: 3x@28% costs about 2% per month, 3x@50% about 7%, 2x@28% about 0.7% (Avellaneda-Zhang) [A]. TQQQ fell about 81% in 2022 vs about 35% for QQQ.
- No reliable "% blown up" statistic exists. The FCA found 82% of leveraged trades were held past the one-day recommendation, and Guedj et al. model a 3% shortfall within 3 weeks.
- **My estimate:** P(≥ +100%) about 4% (range 2-6%) for a disciplined bold strategy, about 1% for a conventional one. P(≥ +50%) about 12%. P(end below $2,000) about 50%.
- A theorem (Dubins-Savage 1965 [own], A): when the goal is a threshold in a subfair or fair game, bold play maximizes P(hit). Variance is the only lever here.

## 4. Playbook (10 rules)

1. **Regime gate [C/B].** Cap gross exposure at 40% while SPX is below its 10-day high and VIX is above 20. Go to 80-100% only after SPX closes above its 10-day high with VIX falling. Every champion bought only in uptrends.
2. **Tight closing stops [B].** Stop at -6% for stocks and 1x ETFs, -10% for 2x, -15% for 3x. Closing stops fill at the next close, so realized loss is worse than the trigger. Size to risk ≤3% of equity per position.
3. **Concentration cap [C].** At most 3 positions, none above 40% of equity. 3x ETFs total ≤50%.
4. **Pyramid winners only [C].** Add at +5% with the stop moved to breakeven. Never average down (Livermore, Darvas, Ryan, PTJ).
5. **Time stop on 3x [A].** Exit after 8 sessions without +5% progress. Decay plus dead money.
6. **Event discipline [B].** Do not hold more than 10% of equity in a single stock through its earnings. The implied gap (TSLA about ±6.3%) is larger than the stop. Use after-close decisions to trade reactions after FOMC (Oct 28), election (Nov 3) and jobs (Nov 6 est.).
7. **Trade budget [A].** At most 40 fills total, about 1.5 per day. Keep 2 fills/day free for stops. Overtrading is the best-documented retail loss driver (Barber-Odean).
8. **Calendar as tiebreaker [B-].** Prefer net-long beta Oct 29 to Nov 18. Never size on it alone.
9. **Scale out [C/B].** Sell a third at +15% (+25% on 3x). Trail the rest below the 8-day-low close.
10. **Equity ratchet [A/C].** Halve size at -15% from peak equity. At +30%, lock a +10% floor. Above +60%, risk only profits above +30%.

## 5. Ideas (index refs: S&P 7,659.44, Nasdaq 26,140.03 at Oct 16 close; ETF prices must come from the committee feed)

1. **QQQ, or QLD (2x) at ≤30% of equity.** Buy at the Oct 29 close (decide after FOMC on Oct 28; skip if Oct 28 is a -1.5% day). Checkpoint Nov 4, exit by Nov 18. Stop: QQQ close -4% (QLD -8%). Target: QQQ +4%. Confidence 4/10.
2. **SMH/SOXX capitulation bounce, SOXL ≤15% of equity.** Enter only after a first close above the prior day's high following the slide. Stop: -7% (SOXL -18%). Target: +10% (SOXL +25%). Confidence 3/10 because oil and inflation work against it.
3. **TSLA post-print drift.** Reports Oct 21 after close, consensus EPS $0.43. If it gaps up and closes in the top quarter of its range on Oct 22, buy at the Oct 23 close. Stop -7%, target +15%, hold ≤10 days. Confidence 3/10.

## Sources (accessed 2026-10-17)
- Fisher: https://www.fisherinvestments.com/en-us/marketminder/sp-500-performance-around-the-past-14-midterm-elections
- Schaeffer's 2018: https://www.schaeffersresearch.com/content/analysis/2018/10/31/what-midterm-elections-could-mean-for-stocks
- Stacker/KEYT, 2026-10-08 (Shiller data): https://keyt.com/stacker-personal-finance-investing/2026/10/08/the-midterms-are-coming-heres-what-the-stock-market-has-actually-done-before-and-after-since-1874/
- Fortune, 2026-09-23 (Detrick): https://fortune.com/2026/09/23/in-midterm-years-october-usually-best-month-for-stocks-gains-78-9-of-the-time
- Bouman-Jacobsen: https://www.tias.edu/docs/default-source/Kennisartikelen/ssrn-id76248.pdf?sfvrsn=2
- Kurov et al.: https://ideas.repec.org/a/eee/finlet/v40y2021ics1544612320315956.html
- Quantpedia FOMC: https://quantpedia.com/fomc-equity-drift-occurs-in-periods-of-high-uncertainty/
- Quantpedia turn of month: https://quantpedia.com/strategies/turn-of-the-month-in-equity-indexes
- Fed working paper on turn of month: https://fedinprint.org/item/fedawp/13394/original
- Martineau (PEAD): https://ideas.repec.org/a/now/jnlcfr/104.00000122.html
- UCLA Anderson on PEAD: https://anderson-review.ucla.edu/is-post-earnings-announcement-drift-a-thing-again/
- CXO: https://www.cxoadvisory.com/technical-trading/are-bad-weeks-months-followed-by-bad-or-good-ones
- ICFS: https://icfs.com/specialists-desk/sp-500-weekly-drops-5-or-more
- Avellaneda-Zhang: https://math.nyu.edu/~avellane/LeveragedETF20090515.pdf
- Guedj et al.: https://www.slcg.com/files/research-papers/Leveraged%20ETFs,%20Holding%20Periods%20and%20Investment%20Shortfalls.pdf
- TQQQ 2022 drawdown (Yahoo): https://finance.yahoo.com/markets/options/articles/investors-leveraged-etfs-avoid-them-202000411.html
- Day-trader studies (secondary): https://curvedtrading.com/articles/en/trading/day-trading-statistics/
- Williams: https://en.wikipedia.org/wiki/Larry_R._Williams
- Ryan: https://www.turtletrader.com/?p=2010
- Schwartz: https://www.turtletrader.com/trader-schwartz
- Minervini: https://traderlion.com/investing-champions/mark-minervinis-risk-management/
- 2021 championship results: https://www.businesswire.com/news/home/20220124005241/en/2021-United-States-Investing-Championship-Winners-%E2%80%94-Minervini-Smashes-Record
- J Law: https://www.bolsamania.com/nota-de-prensa_print/mercados/j-law-sets-two-year-record-with-1499-return-in-us-investing-championship--21854364.html
- Darvas: https://www.nasdaq.com/articles/how-nicolas-darvas-used-box-theory-to-20x-his-money
- Livermore: https://www.businessinsider.in/why-wall-street-traders-are-obsessed-with-jesse-livermore/articleshow/48116842.cms
- PTJ: https://completetradersedge.com/paul-tudor-jones-market-wizard
- Oct 16 close (AP via WTOP): https://wtop.com/national/2026/10/how-major-us-stock-indexes-fared-friday-10-16-2026
- VIX/oil (Whatfinger, secondary): https://money.whatfinger.com/2026/10/16/tech-stocks-sink-as-the-selloff-spreads-to-software-brent-tops-110-and-coreweave-slides/
- Fed calendar: https://www.federalreserve.gov/newsevents/2026-october.htm
- Earnings week of Oct 19: https://www.stocktitan.net/articles/earnings-calendar-week-of-october-19-2026
