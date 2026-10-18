# Playbook (living document; revised as the experiment teaches it something)

Version 2.1, 2026-10-18 (v2 2026-10-17; budget raised to $1,000 on 2026-10-18; Sunday review revisions on 2026-10-18). The owner chose options with the loss budget to go after the $4,000 target. Version 1 (stocks and ETFs, bounded convexity) is in git history.

## Stance: bold play with a capped budget
* **The arithmetic.** $4,000 needs +$2,000 from a $1,000 risk budget, about a 3x on premium. With a $1,000 loss limit, no strategy can do better than roughly a 1-in-3 chance
  even in a fair game; with option costs, a disciplined version is perhaps 8-20% (judgment, not a backtest). The most likely outcome is losing the $1,000 and stopping.
* **The structure (enforced in code).** Premium is paid only from cash above the $1,000 floor. Every open option can go to zero and the account still ends at $1,000 or better.
* **Contract arithmetic.** One contract costs premium x 100. Shot 1 of about $500 buys contracts priced up to $5.00; an all-in $1,000 shot up to $10.00. Below those prices the
  choice is between fewer at-the-money contracts and more far out-of-the-money ones; prefer delta 0.30-0.45 when the budget allows.
* **Few, deliberate shots.** Plan for two or three bets over the month, not twenty trades. Shot 1 is about half the budget (~$500) on the best dated catalyst in the next one to
  two weeks. If it wins, the budget grows and the next shot is sized from the new budget (roll the winnings). If it loses, shot 2 is the remaining ~$500. Doing nothing while
  waiting for a good setup is fine; the budget is the scarce resource, not time.

## What to buy
* **Underlyings:** liquid names and ETFs with large, dated catalysts: NVDA, MSFT, META, AMZN, GOOGL, TSLA, SMH, QQQ, SPY, IWM. TLT calls are the rates/credit hedge (they pay
  in a de-escalation and in an AI-credit crack). XLE options fail the spread filter (11-150%); use USO or COP for oil views.
* **Liquidity filter:** open interest at least 1,000 at the strike; bid-ask spread at most 5% of the mid for stocks (10% for sector and commodity ETFs such as USO). Check with
  `python3 trading-experiment/quotes.py chain NVDA --expiry 2026-11-20 --type C --near 214`.
* **Strike:** delta about 0.30-0.45 (out of the money, not a lottery ticket).
* **Expiry:** two to five weeks out, covering the catalyst plus a few days. Never a weekly that expires before the event. The code refuses any entry less than 3 calendar
  days before expiry, so a print-day buy needs the expiry after the next one (META 10/21 cannot use 10/23; MSFT 10/28 uses 11/20 because 11/06 is illiquid).
* **Direction from the regime switches below:** flip bullish means calls on semis and AI leaders; press bearish means QQQ or SMH puts; an oil spike means XLE calls.
* **Volatility:** implied volatility is high just before earnings and collapses after. Prefer buying the run-up and selling before the print, or buying after the print when the
  reaction confirms a trend. Hold through a print only when the expected move clearly exceeds the implied move, and say why in the journal.
* **Event vol rule (options-vol, 2026-10-18):** buy event premium only at the 14:43 decision on the print day, only where the implied event move is at most 0.9x the
  last seven reactions (MSFT 0.70x qualifies; NFLX 1.52x, AAPL and GOOGL 1.2x do not), and sell at the next day's decision. Buying the catalyst early pays the IV ramp twice.
* **FOMC days:** the 14:43 run falls inside the 14:30 press conference. On 10/28 decide after the presser (~15:30 ET), still before the 15:50 cutoff.
* **Pacing:** at most one new shot per day; keep at least $360 above the floor for the MSFT shot on 10/28 unless an earlier shot has already won.

## Exits
* Sell half at +100% on premium, the rest at +200% or right after the catalyst plays out.
* Closing-basis stop at -50% of premium, so a failed shot leaves half of it for the next one (set with `--stop-pct 50`).
* The tracker auto-sells any option one session before its expiry. Never hold into expiry, never exercise.

## Catalyst calendar for shots (re-judge every run)
* **Week of 10/19:** NFLX 10/20 (event vol very rich, no trade). META and TSLA report 10/21 after the close; LRCX, TXN and IBM the same evening. This is the AI-capex test.
  No event trade on META (no edge on an expiry that clears the 3-day rule); trade the reaction (decide 10/22) rather than holding through. Thu 10/22: earliest follow-through day.
* **10/28:** MSFT and GOOGL after the close, FOMC decision at 2pm. **10/29:** AMZN, INTC. **10/30:** XOM/CVX (unverified). **11/1:** OPEC+. **11/2:** AAPL. **11/3:** midterms, AMD after the close.
  **11/6:** jobs. **~11/10:** CPI.
* **11/9-11/17: the NVDA run-up.** NVDA reports **after the close on Tue 11/17** (company-verified per Robinhood `get_earnings_results`, checked 2026-10-18; it was wrongly assumed to be
  11/18). A run-up position must be **sold by the 11/17 close**; holding it overnight is a one-day bet on the print scored at the 11/18 close, and needs an explicit journal reason.

## Read of the tape (update 2026-10-18, Sunday)
* VIX closed 19.99 on 10/16 (not 21-22). Weekend: Iran says tankers hit mines in Hormuz, yet Sunday 18:13 ET futures were up (ES +0.2%, NQ +0.4%, RTY +0.5%) and oil down
  (WTI 98.29, Brent 108.81); macro reads the mine reports as recycled IRGC claims. FOMC 10/28: ~82% hold. Sentiment (contrarian, not re-checked): CNN Fear & Greed ~18, SPX put/call 97th percentile.
* **Base rate (verified):** with the S&P 1-3.5% below a record and VIX 17-24, 1990-2026, 102 independent episodes: a new closing high within 22 sessions 60%, a further
  -8% fall 7%, a rise of at least 2.85% (SPY to ~785) at some point 48% (historian; the chair reproduced it from Yahoo daily data). The flush-then-buy path beats the
  reclaim-then-buy path (after a reclaim SPY reached 785 only 37-39% of the time).
* Momentum: the Nasdaq is in a correction with 6-8 distribution days; leadership is energy, pharma, payments, AAPL. The earliest follow-through day is Thu 10/22.

## Read of the tape (2026-10-17)
* Late-cycle correction driven by liquidity and credit, not earnings. Stagflation flavour: Fed hiked 9/16 to 3.75-4.00%, CPI 3.7%, payrolls +29k, 10y ~5.1%,
  WTI ~$101 / Brent ~$110 (Hormuz). AI-capex credit is cracking (CoreWeave ~15% yield, Oracle CDS record), semis down 8 straight sessions.
* S&P 7,659 is 2% below its 10/6 record; Nasdaq is in a correction. No follow-through day yet (earliest Thu 10/22).
* Committee odds to 11/18 (macro): new S&P high 38%, chop 44%, -8% or worse 18%.
* Verified closes 10/16 (Yahoo + Cboe): SPY 763.25, XLE 68.24, NVDA 214.13, SOXL 93.67, SQQQ 38.90. NVDA 11/20 options: about 40% IV, 1-2% spreads, very deep open interest.

## Regime switches (act on these, not on feelings)
**Flip bullish** (calls on semis/AI leaders): any two of: S&P closes above 7,745 with the semis index up >2% on the day; Brent closes below $100 two days running; Oracle 5y CDS
below ~230bp or CRWV yield below 12%; a capex raise from Meta/MSFT/GOOGL that the stock rewards; a Nasdaq follow-through day.
**Press bearish** (QQQ/SMH puts): S&P closes below 7,428; VIX closes above 28; 10y above 5.25%; HY OAS above 346bp; an Oracle junk cut; a surprise hike on 10/28.
**Oil** (XLE calls or puts): Hormuz escalation versus a deal; WTI settling above $105 or below $94.

## SEC filings as an input (evidence grades as in the historian memo)
* **Insider open-market purchases** clustered across several officers (not 10b5-1 plan sales) predict modest outperformance over months [B]; useful as a tie-breaker for direction,
  not a timing signal for a two-week option.
* **8-K item 2.02 / 7.01** sets the real catalyst dates and the guidance the market reacts to [A, mechanically].
* **Debt and capex disclosures** (8-K 2.03, 10-Q notes) test the AI-credit and AI-capex theses directly [B].
* **Offerings and lockups** (S-1, 424B) add share supply; avoid calls into a known overhang [B-].

## Hypotheses to test during the month
1. Does buying after a confirming earnings reaction beat holding through the print, net of the volatility collapse?
2. How much of each shot's result came from direction versus implied-volatility changes? Log the IV at entry and exit.
3. How costly are spreads? Compare each fill with the mid at the same moment.
4. Which committee member's option ideas earn their keep? Score them weekly.

## Changelog
* 2026-10-18 (Sunday review, v2.1): event-vol rule, FOMC-day timing, one shot a day with a reserve for the 10/28 MSFT shot, the 3-day expiry note, the verified S&P base
  rate, TLT/IWM/COP added to the universe (XLE out), ETF spread limit covers commodity ETFs, calendar fixes (AMD 11/3; META event trade dropped).
* 2026-10-17: v1 written (stocks/ETFs, energy core).
* 2026-10-18: research toolkit (headlines, full text, Fed/EIA RSS, SEC filings and insider trades) and a 09:13 ET pre-open news run added at the owner's request.
* 2026-10-18: NVDA earnings date corrected to 11/17 after the close (semis-ai specialist, confirmed via Robinhood).
* 2026-10-18: loss budget raised to $1,000 by the owner (floor $1,000; shots ~$500; goal needs ~3x).
* 2026-10-17: v2. Owner chose options with the $500 loss budget; stock buys off; $1,500 cash floor enforced in code; XLE/GUSH proposals cancelled.
