# Playbook (living document; revised as the experiment teaches it something)

Version 1, written Sat 2026-10-17 from the six committee memos in `research/2026-10-17/`. Each change gets a dated line in the changelog at the bottom.

## Stance: bounded convexity
The committee's numbers: P(+100% in 23 sessions) is about 1-5% for any strategy that does not also carry a double-digit chance of losing half. So the account
is run as: **a core in what is working, a small convex satellite for the 2x shot, cash for the confirmed bounce, and hard loss limits**. The realistic aim is to
beat SPY with controlled risk; the 2x is a lottery ticket we keep a strict price on. Doing nothing is a valid trade.

## Read of the tape (2026-10-17)
* Late-cycle correction driven by liquidity and credit, not earnings. Stagflation flavour: Fed hiked 9/16 to 3.75-4.00%, CPI 3.7%, payrolls +29k, 10y ~5.1%,
  WTI ~$101 / Brent ~$110 (Hormuz). AI-capex credit is cracking (CoreWeave ~15% yield, Oracle CDS record), semis down 8 straight sessions.
* S&P 7,659 is 2% below its 10/6 record; Nasdaq is in a correction. No follow-through day yet (earliest Thu 10/22).
* Leaders: energy, then utilities and staples. Fragile: debt-funded AI infrastructure, memory, small caps.
* Committee odds to 11/18 (macro): new S&P high 38%, chop 44%, -8% or worse 18%. Contrarian: 60% pullback in a bull market, 40% AI-credit deflation.

## Regime switches (act on these, not on feelings)
**Flip bullish** (add NVDA/SOXL/TQQQ, trim energy): any two of: S&P closes above 7,745 with the semis index up >2% on the day; Brent closes below $100 two days running;
Oracle 5y CDS below ~230bp or CRWV yield below 12%; a capex raise from Meta/MSFT/GOOGL that the stock rewards; Nasdaq follow-through day.
**Press bearish** (cut energy leverage, build SQQQ/cash): S&P closes below 7,428; VIX closes above 28; 10y above 5.25%; HY OAS above 346bp; an Oracle junk cut;
a surprise hike on 10/28.
**Energy exit:** WTI settles below $94 or XLE closes below 65 means review at once; Hormuz deal headlines are the main gap risk.

## Phase plan
1. **10/19-10/23, probe:** energy core only, <= 30% Monday and <= 55% by Tuesday. Watch META/TSLA (10/21 after close), TXN/LRCX/IBM (10/21). Decide any NVDA tranche
   on the evening of 10/21 (fills 10/22, after the prints). No tech longs before a follow-through day unless two flip signals fire.
2. **10/26-11/6, events:** MSFT/GOOGL/FOMC (10/28), INTC/AMZN (10/29), XOM/CVX (~10/30), AAPL (11/2), OPEC+ (11/1), midterms (11/3), jobs (11/6).
   <= 50% invested at the 10/28 close, <= 35% at the 11/3 close. Prefer trading reactions to events over holding through them.
3. **11/9-11/18, press or protect:** if ahead of pace and the regime is constructive, build into the NVDA run-up (report expected 11/18 after the close, so the scored
   value has no gap risk). If behind pace, the only lottery ticket allowed is one leveraged position <= 15% of equity with a hard stop. If the circuit breakers have
   tripped, protect: cash or SPY.

## Entry and exit rules
* Entry: buy leaders at or near highs only with the close-based trigger met; buy oversold quality only on a confirmed turn (first close above the prior day's high after a
  capitulation day), staged in thirds. Use `--max-price` so a gap never makes us chase (>2.5% above the reference).
* Stops are closing-basis, set when the order is queued. Stocks and 1x ETFs: -6/-7%. 2x: -10 to -12%. 3x: -15%.
  Assume the realised loss is 1.5x planned (2x for 3x ETFs); size so that planned risk to the stop is <= 2% of equity (<= 3% satellite).
* Targets: sell a third at +15% (+25% on 2x/3x), trail the rest under the 8-10 day low close.
* Add only to winners (up 3-5%, new closing high), then move the whole stop to breakeven. Never average down.
* Time stops: 3x ETFs after 8 sessions without +5%; others after 8-10 sessions flat.
* A stop breach on a close auto-queues a sell for the next close. Targets are a prompt for a committee decision, not an automatic sale.

## Evidence grades used to weigh ideas
* **A/B (use):** cross-sectional and industry momentum, 52-week-high effect, volatility-scaled sizing, loss limits, the daily-reset decay of leveraged ETFs, overtrading costs.
* **C (tie-breakers only):** seasonality (midterm Q4, Halloween, turn of month: worth about 1-3 points of a 100-point goal), the "worst week" bounce, FTD day counts, cup-and-handle
  geometry, pre-FOMC drift (the 24h window cannot be captured with close-to-close fills).
* **Never:** post-earnings drift in mega-caps as a standalone reason; trading a gap we cannot see.

## Hypotheses to test during the month (so the playbook learns)
1. Does the energy leadership survive a Hormuz headline? Measure the largest one-day XLE drawdown against the stop distance.
2. Does waiting for a follow-through day beat a Monday oversold bounce in NVDA? Track the paper "shadow" entry of NVDA at the 10/19 and 10/22 closes.
3. Close-to-close fills versus the decision close: how much does the one-day delay cost or save per trade?
4. Which committee member's ideas earn their keep? Log each agent's ranked picks and score them weekly.
5. Is the 2x-ETF sleeve worth its decay and gap risk versus holding the underlying with more size?

## Changelog
* 2026-10-17: v1 written. Energy core adopted by consensus; NVDA/SOXL/SQQQ held as conditional ideas pending flip signals.
