# Flows & Positioning: Sun 2026-10-18

**Verdict: WAIT Monday.** For the next 7-10 sessions the flows point down: dealers are short gamma, the CTA medium-term trigger is only 2% below, and nobody has capitulated. Over four weeks they point up: buyback windows reopen, the election should crush vol, and vanna/charm flows build into the 11/20 opex. So buy calls after the flush or on the reclaim, not before. Puts are poor value: they are the most crowded hedge in months.

Sizing follows the chair's 10/18 update: $1,000 budget, shot 1 about $500, at most $5.00 per contract. **RULES.md and config.json still show $500 and a $1,500 floor.** Record the owner's change there before any order. On the old budget, halve the quantities.

## Who is forced to act
| Player | State (10/16 close) | Forced flow |
|---|---|---|
| Dealers | Short gamma, GEX -$35B to -$58B. Flip at SPX 7,717-7,812 (SPY ~769-778). Call wall 8,000 (SPY 800C OI 53k). SPY put OI: 745P 10/30 73k, 750P 71k, 730P 47k, 700P 55k | Below the flip, dealer hedging amplifies moves. Puts dwarf calls, so falling vol makes dealers buy back their hedges into 11/20 |
| CTAs | 27th percentile (1y). SPX is below the short-term pivot (7,704) and above the medium-term pivot (7,493, about SPY 747) | One-month US flow: -$66B in a down tape vs +$25B in an up tape. **My lookback calc:** the 3-month bar jumps from SPY ~741 (10/28) to 770-778 from 11/2, so a flat tape turns CTAs into sellers in November. They hold their biggest Russell 2000 short since 2023, which is squeeze fuel |
| Vol-control | SPX realized vol 10.5% (20d), 10.9% (60d), my calc | Near max exposure, so no buying fuel left. They become sellers only if realized vol passes ~15%, which takes four or five ±2% days. VIX itself does not trigger them |
| Risk parity | 10y 5.36% (10/7) → 5.09%; bonds are hedging stocks again | Neutral to supportive |
| Buybacks | ~10% of S&P in its window by 10/16, ~48% by late Oct, >50% of index weight by 11/1, ~all by 11/8. Tech buybacks -40% y/y | The bid builds from 10/29 and peaks 11/2-11/13 |
| Mutual funds | Tax year ends 10/31 | Tax-loss selling of laggards stops; helps IWM |
| Hedge funds | US net leverage at the 2nd percentile (1y). ETF shorts +4.4% w/w. They have unwound all the AI exposure added since Jan 2025 | Short-cover fuel sits in index ETFs, not semis |
| Retail | Equity put/call 0.61-0.62 | Still buying dips; no capitulation yet |
| Leveraged ETFs | A 3x fund trades 6x the day's move, as a share of its assets, at the close | Amplifies 3-4pm moves both ways |

## Path to 11/18 (my probabilities)
- **Shake, then squeeze (40%).** The META (10/21), MSFT/GOOGL and FOMC (10/28) gauntlet tags SPX 7,450-7,550 by 10/30. The election vol crush and buybacks then lift it to 7,850-8,000 by 11/13-18.
- **Early reclaim (20%).** SPY closes above 773 by ~10/26, then grinds up to the 8,000 wall.
- **Chop (25%).** SPX stays in 7,550-7,800 and calls bleed.
- **Air pocket that sticks (15%).** An AI-credit event pushes SPX below 7,300 with VIX at 28 or higher.

Net: about 35% that SPY closes at or above 785 at some point by 11/18. About 50% that SPX trades below 7,500 first.

## Timing
1. **Mon 10/19: no trade.**
2. **Shot 1: SPY calls, up to $500.** Buy on whichever trigger comes first:
   - **A, the flush:** SPY ≤748, VIX ≥24 with VIX9D > VIX3M, and equity put/call ≥0.75. Buy at the pre-close on the first day VIX closes ≥10% below its peak while SPY is up.
   - **B, the reclaim:** SPY closes ≥773 with VIX ≤18. Buy at the next pre-close.
   - **C, the fallback:** if neither fires by 10/30, buy on 11/4 if VIX ≤19 and SPY ≥760.
   - **Contract rule:** 11/20 expiry, delta 0.20-0.35, ask ≤$5.00, whole contracts.
3. **Shot 2: IWM calls.** Buy at the 10/29-10/30 pre-close if the Fed holds and IWM is at or above 265 (a strike with 120k puts). Otherwise buy on 11/4.
4. **Shot 3: profits only.** SPY or QQQ calls for the NVDA run-up after CPI (11/10). Everything is closed by the 11/17-18 pre-close.

## Proposals
1. `SPY261120C00785000 | 2026-11-20 | 785 | C | 4.35/4.40 (Cboe delayed + Robinhood, both 10/16 16:14 ET) | 12.1% | 0.26 | 12,330 | Cheapest convexity on the board: upside IV about equals the 10.5% realized vol, while puts trade near 20%. Hedge unwinds, buybacks and the election vol crush all pull toward the 8,000 wall. Window 10/28-11/13 | Triggers A, B or C. After a flush, re-strike to about 3x 780C (≈$1.50 est.). After a reclaim, buy 2x 795C | Sell half at 2.5x or when SPY ≥795; sell the rest by the 11/17 pre-close; cut at -50% or on an SPY close below 745 | 5`
2. `IWM261120C00280000 | 2026-11-20 | 280 | C | 2.70/2.75 (Cboe + Robinhood, 10/16 16:14 ET) | 18.1% | 0.30 | 13,294 | Biggest CTA short (Russell 2000), tax-loss selling ends 10/31, foreign inflows after the midterms, and Goldman's desk favours broadening | 10/29-30 or 11/4 pre-close, 1-2 contracts | Sell half at 2.5x or when IWM ≥288; sell the rest by 11/17; cut at -50% or on an IWM close below 262 | 4`
3. `SPY261030P00735000 | 2026-10-30 | 735 | P | 2.56/2.62 (Cboe + Robinhood, 10/16 16:14 ET) | 21.4% | -0.16 | 14,184 | Only if SPX closes below the CTA pivot 7,493 (SPY <747) before 10/23: short gamma plus -$66B of CTA selling toward the 730/720 put strikes | Buy at the next pre-close with a limit of $5.00; skip if the ask is higher | Sell when SPY ≤731 or by the 10/27 pre-close (before FOMC); cut at -40% | 3 (vol is rich; payoff ≈2-3x)`

## Data checks
- **VIX** closed **19.99** on 10/16 (intraday high 22.31), not 21-22. VVIX (109.9) and SKEW (168.6) are both at 3-month highs.
- **BofA survey:** the 3.9% cash figure is unverified. The tech overweight being the highest since Aug 2020 is verified.
- **Opex:** 10/16 was monthly opex.
- **Goldman figures** come from secondary write-ups. The scenario values for re-struck contracts are my Black-Scholes estimates.

## Sources
- Goldman flows via Tickmill: [13 Oct](https://www.tickmill.com/blog/institutional-insights-goldman-sachs-sp500-flows-positioning-update-131026), [15 Oct](https://www.tickmill.com/blog/institutional-insights-goldman-sachs-flow-of-funds-update-151026); [Bitget, 10/14](https://www.bitget.com/amp/news/detail/12560605962591)
- Gamma, 10/16: [Reflections](https://reflectionsofreality.substack.com/p/the-round-trip-reversed-gamma-tripleplay), [ZeroGEX](https://zerogex.io/spx-gamma-levels), [GammaFlip](https://gammaflip.io/gex/spx), [FlashAlpha](https://flashalpha.com/stock/spx), [GEX Metrix](https://www.gexmetrix.com/gex/spx)
- [Citadel/Rubner via ROIC, 10/01](https://www.roic.ai/news/citadel-securities-rubner-q4-is-the-reload-for-us-stocks-10-01-2026); [JPM via Qz](https://qz.com/jpmorgan-ai-stocks-rebound-july-selloff-101526); [Weekender, 10/16](https://thedarksideoftheboom.substack.com/p/the-weekender-credit-cracks-the-ai)
- Put/call: [aistockselection](https://www.aistockselection.com/en/put-call-ratio-today/), [thetrading.tools](https://www.thetrading.tools/put-call-ratio)
- `quotes.py` (Yahoo + Cboe closes; Cboe delayed chains pulled 10/17 22:34 ET); Robinhood option quotes and daily bars; Yahoo VIX/VIX9D/VIX3M/VVIX/SKEW
