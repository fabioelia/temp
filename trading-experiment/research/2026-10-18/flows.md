# Flows & Positioning, Sun 2026-10-18

**Verdict: WAIT Monday.** Flows lean down for the next 7-10 sessions: dealers are short gamma, the CTA medium-term trigger is 2% below, and nobody has capitulated. Over 4 weeks they lean up: buybacks, the election vol crush and vanna/charm into 11/20. Buy calls after a flush or a reclaim, not before. Puts are the most crowded hedge in months.

Sizing follows the chair's 10/18 update: $1,000 budget, shot 1 about $500, at most $5.00 a contract. RULES.md and config.json still show $500, so record the change first; on $500, halve the quantities. NVDA reports **11/17 after the close**, so every call is out by the 11/17 pre-close.

## Who is forced to act
| Player | State (10/16) | Forced flow |
|---|---|---|
| Dealers | Short gamma, GEX -$35B to -$58B. Flip at SPX 7,717-7,812 (SPY ~769-778). Call wall 8,000 (SPY 800C open interest 53k). SPY put OI: 745P (10/30) 73k, 750P 71k, 730P 47k | Below the flip they amplify moves. Put OI dwarfs calls, so falling vol brings hedge buybacks |
| CTAs | 27th percentile. Below the 7,704 short-term pivot; medium-term pivot at 7,493 (SPY ~747) | 1-month US flow: -$66B in a down tape, +$25B in an up tape. My calc: the 3-month bar rises from SPY ~741 (10/28) to 770-778 after 11/2, so a flat November makes them sellers. Their largest Russell 2000 short since 2023 is squeeze fuel |
| Vol-control funds | SPX realized vol 10.5% (20-day; my calc) | Near max exposure, so no buying fuel left. They sell above ~15% realized vol (four or five ±2% days) |
| Buybacks | ~10% of S&P companies in their window by 10/16 → ~48% by late Oct → nearly all by 11/8. Tech -40% y/y | The bid peaks 11/2-11/13 |
| Mutual funds | Tax year ends 10/31 | Tax-loss selling of laggards stops; helps IWM |
| Hedge funds | US net leverage at the 2nd percentile; ETF shorts +4.4% w/w; AI longs fully unwound | Short-cover fuel sits in index ETFs |
| Retail | Equity put/call 0.61-0.62 | No capitulation |
| Others | Risk parity: bonds are hedging again (10y 5.36% → 5.09%). 3x ETFs trade 6x the day's move at the close | Risk parity neutral; 3x ETFs amplify 3-4pm moves |

## Path to 11/18 (my probabilities)
- **Shake, then squeeze, 40%.** META (10/21), MSFT/GOOGL and FOMC (10/28) push SPX to 7,450-7,550 by 10/30. The vol crush and buybacks then lift it to 7,850-8,000 by 11/13-17.
- **Early reclaim, 20%.** SPY closes above 773 by about 10/26 and grinds toward 8,000.
- **Chop, 25%.** SPX holds 7,550-7,800 and calls bleed.
- **Air pocket that sticks, 15%.** An AI-credit event takes SPX below 7,300 with VIX at 28 or higher.

That gives about a 35% chance that SPY closes at 785 or higher at some point by 11/18.

## Timing
1. **Monday: no trade.**
2. **Shot 1: SPY calls, up to $500.** Buy on the first of three triggers:
   - **A (flush):** SPY ≤748, VIX ≥24, VIX9D > VIX3M, and equity put/call ≥0.75. Buy at the pre-close of the first day VIX closes ≥10% off its peak with SPY up.
   - **B (reclaim):** SPY closes ≥773 with VIX ≤18. Buy at the next pre-close.
   - **C (fallback):** if neither has fired by 10/30, buy on 11/4 if VIX ≤19 and SPY ≥760.
   - **Contract rule:** 11/20 expiry, delta 0.20-0.35, ask ≤$5.00.
3. **Shot 2: IWM calls.** Buy at the 10/29-30 pre-close if the Fed holds and IWM ≥265 (the 120k-OI put strike). Otherwise buy on 11/4.
4. **Shot 3: profits only.** SPY or QQQ calls for the run-up into NVDA, after CPI (11/10). Out by the 11/17 pre-close.

## Proposals
1. `SPY261120C00785000 | 2026-11-20 | 785 | C | 4.35/4.40 (Cboe delayed + Robinhood, 10/16 16:14 ET) | 12.1% | 0.26 | 12,330 | Cheapest convexity: upside IV ≈ realized 10.5% (puts ~20%). Hedge unwind, buybacks and the vol crush pull toward the 8,000 wall, 10/28-11/13 | Trigger A, B or C. After a flush, switch to ~3x 780C (≈$1.50, est.); after a reclaim, 2x 795C | Sell half at 2.5x or SPY ≥795; sell the rest by the 11/17 pre-close; cut at -50% or an SPY close <745 | 5`
2. `IWM261120C00280000 | 2026-11-20 | 280 | C | 2.70/2.75 (Cboe + Robinhood, 10/16 16:14 ET) | 18.1% | 0.30 | 13,294 | Biggest CTA short (Russell 2000), tax-loss selling ends 10/31, foreign inflows after the midterms; Goldman's desk favours broadening | Pre-close 10/29-30 or 11/4, 1-2 contracts | Sell half at 2.5x or IWM ≥288; sell the rest by 11/17; cut at -50% or an IWM close <262 | 4`
3. `SPY261030P00735000 | 2026-10-30 | 735 | P | 2.56/2.62 (Cboe + Robinhood, 10/16 16:14 ET) | 21.4% | -0.16 | 14,184 | Only if SPX closes below the 7,493 CTA pivot (SPY <747) before 10/23: short gamma plus -$66B of CTA selling toward the 730/720 put OI | Next pre-close, limit $5.00, else skip | Sell at SPY ≤731 or by the 10/27 pre-close; cut at -40% | 3 (rich vol, ~2-3x payoff)`

## Data checks
- **Corrections:** VIX closed 19.99 (high 22.31), not 21-22. VVIX 109.9 and SKEW 168.6 are 3-month highs.
- **Unverified:** BofA's 3.9% cash. Goldman figures come from secondary sources.

## Sources
- Goldman flows via Tickmill: [10/13](https://www.tickmill.com/blog/institutional-insights-goldman-sachs-sp500-flows-positioning-update-131026), [10/15](https://www.tickmill.com/blog/institutional-insights-goldman-sachs-flow-of-funds-update-151026); [Bitget 10/14](https://www.bitget.com/amp/news/detail/12560605962591)
- Gamma, 10/16: [Reflections](https://reflectionsofreality.substack.com/p/the-round-trip-reversed-gamma-tripleplay), [ZeroGEX](https://zerogex.io/spx-gamma-levels), [GammaFlip](https://gammaflip.io/gex/spx), [FlashAlpha](https://flashalpha.com/stock/spx), [GEX Metrix](https://www.gexmetrix.com/gex/spx)
- [Citadel/Rubner (ROIC, 10/01)](https://www.roic.ai/news/citadel-securities-rubner-q4-is-the-reload-for-us-stocks-10-01-2026); [JPM (Qz)](https://qz.com/jpmorgan-ai-stocks-rebound-july-selloff-101526); [Weekender 10/16](https://thedarksideoftheboom.substack.com/p/the-weekender-credit-cracks-the-ai)
- Put/call: [aistockselection](https://www.aistockselection.com/en/put-call-ratio-today/), [thetrading.tools](https://www.thetrading.tools/put-call-ratio)
- `quotes.py` (Yahoo + Cboe closes; Cboe chains pulled 10/17 22:34 ET); Robinhood option quotes and daily bars; Yahoo VIX/VIX9D/VIX3M/VVIX/SKEW
