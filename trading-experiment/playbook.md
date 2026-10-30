# Playbook (living document; revised as the experiment teaches it something)

Version 2.1, 2026-10-18 (v2 2026-10-17; budget raised to $1,000 on 2026-10-18; Sunday review revisions on 2026-10-18). The owner chose options with the loss budget to go after the $4,000 target; on 2026-10-24 the target became $2,200 (+10%) and beating SPY. Version 1 (stocks and ETFs, bounded convexity) is in git history.

## Stance: measured shots toward $2,200 (since 2026-10-24)
* **The arithmetic.** From $1,917.92 (10/23) the $2,200 goal needs about +$282, +31% on the $918 budget: one shot that doubles on ~$300, or two that each make
  +50%. Beating SPY needs about +3.3% more than SPY makes from here. Judgment, not a backtest: perhaps 25-35% to reach $2,200, and better than even to finish ahead of
  a losing SPY; the most likely bad outcome is now a few hundred dollars lost, not the whole budget.
* **Pacing for the lower target.** Shots of about $250-400 premium (no single shot above $450), at most two open at once, at least 2 contracts when the price allows so
  one can be banked; bank part at +50-100% and move the stop to cost past +40%. **Pause line:** if real equity closes below $1,700, open no new shot until the Sunday review
  re-plans. Near the goal, protect it: at or above $2,150, new shots only with house money above $2,000.
* (Before 10/24) $4,000 needed +$2,000 from a $1,000 risk budget, about a 3x on premium; judged 8-20% at best.
* **The structure (enforced in code).** Premium is paid only from cash above the $1,000 floor. Every open option can go to zero and the account still ends at $1,000 or better.
* **Contract arithmetic.** One contract costs premium x 100. Shot 1 of about $500 buys contracts priced up to $5.00; an all-in $1,000 shot up to $10.00. Below those prices the
  choice is between fewer at-the-money contracts and more far out-of-the-money ones; prefer delta 0.30-0.45 when the budget allows.
* **Few, deliberate shots.** Plan for two or three bets over the month, not twenty trades. Shot 1 is about half the budget (~$500) on the best dated catalyst in the next one to
  two weeks. If it wins, the budget grows and the next shot is sized from the new budget (roll the winnings). If it loses, shot 2 is the remaining ~$500. Doing nothing while
  waiting for a good setup is fine; the budget is the scarce resource, not time.

## Consensus check (W43 review)
* Every proposal says what a generic AI would recommend and whether it matches. A match without a measured edge is not a shot. **One governing figure per test:** the
  event-vol ratio uses the median of the last 8-12 reactions (not the RMS, not with outliers left in) and must be <= 0.9; or IV at or below 20-day realized; or a base rate
  translated into the option's own payoff odds with EV > 1. Last week's crowd (AI mega-caps) lost; this week's may be the rotation trade (oil, small caps): screen it the same way. The contrarian's best idea is always priced and ranked. Stated confidence is checked weekly against the shadow book;
  in W43 it ran inverse to outcome.

* **Evidence rules (strategy review 2026-10-29, `research/strategy-review/README.md`).** An edge figure counts only if it comes from a committed script
  (`research/.../scripts/`) or a cited published study. Three persona statistics failed to reproduce: momentum's run-up split, IWM's 1.05, catalyst's 34/48 and
  n 93. These arguments are retired and may not be cited as support:
  - the midterm-window rally (REJECTED) and the Halloween effect (WEAK since 2010);
  - the turn of the month and RSI(2) dips (WEAK, below random through options);
  - a follow-through day as an edge figure (WEAK, 10-day t 0.9; IWM 0.95);
  - "IV is low" as a reason to buy (REJECTED);
  - the pre-earnings run-up through calls (tie-break only).

## What to buy
* **Underlyings:** liquid names and ETFs with large, dated catalysts: NVDA, MSFT, META, AMZN, GOOGL, TSLA, SMH, QQQ, SPY, IWM. TLT calls are the rates/credit hedge (they pay
  in a de-escalation and in an AI-credit crack). XLE options fail the spread filter (11-150%); use USO or COP for oil views.
* **Liquidity filter:** open interest at least 1,000 at the strike; bid-ask spread at most 5% of the mid for stocks (10% for sector and commodity ETFs such as USO). Check with
  `python3 trading-experiment/quotes.py chain NVDA --expiry 2026-11-20 --type C --near 214`.
* **Strike:** delta about 0.30-0.45 (out of the money, not a lottery ticket).
* **Expiry:** two to five weeks out, covering the catalyst plus a few days. Never a weekly that expires before the event. The code refuses any entry less than 3 calendar
  days before expiry, so a print-day buy needs the expiry after the next one (META 10/21 cannot use 10/23; MSFT 10/28 uses 11/20 because 11/06 is illiquid).
* **Direction from the regime switches below:** flip bullish means calls on semis and AI leaders; press bearish means QQQ or SMH puts; an oil spike means XLE calls.
* **The options headwind (D1/D3 CONFIRMED, model):** implied vol beat realized on 86% of days since 1990, and the premium sits mostly in puts. OTM index calls trade near
  fair at the real skew. So a put needs a measured edge that beats that premium; never buy below delta 0.25 (delta 0.10 returns about 0.49 per $).
* **Volatility:** implied volatility is high just before earnings and collapses after. Prefer buying the run-up and selling before the print, or buying after the print when the
  reaction confirms a trend. Hold through a print only when the expected move clearly exceeds the implied move, and say why in the journal.
* **Event vol rule (options-vol, 2026-10-18):** buy event premium only at the 14:43 decision on the print day, only where the implied event move is at most 0.9x the
  last seven reactions (MSFT 0.70x qualifies; NFLX 1.52x, AAPL and GOOGL 1.2x do not), and sell at the next day's decision. Buying the catalyst early pays the IV ramp twice.
* **FOMC days:** the 14:43 run falls inside the 14:30 press conference. On 10/28 decide after the presser (~15:30 ET), still before the 15:50 cutoff.
* **Pacing:** at most one new shot per day. (The $360 reserve for the 10/28 MSFT shot ended when the W43 review dropped that shot; only conditional tripwires remain.)

## Exits (decided at entry; W43 review)
* Every buy carries its exit plan in the thesis before it is confirmed. **Two or more contracts:** half at +50%, the rest at +100%. **One contract:** all at +50%, not 2x
  (W43: a single contract held for 2x gave back +47%). These targets now rest at the broker as GTC limits from the evening of the buy (owner, 2026-10-26), so an
  intraday spike is banked. Once a 14:43 check shows +40% or more, the stop moves to cost.
* **Exception, C1 down-gap puts (2026-10-29):** they use the exit the strategy review confirmed: hold to session 5 (time exit at that day's 14:43 check),
  with the -50% backstop and no take-profit, and no resting GTC is placed. Two model checks found that a +50% target cuts this setup's EV below 1:
  the strategy review's D4 (holding beat the target set by about 0.14 at the real skew) and the 10/29 red-team (1.14 to 0.97, scripts/risk_exit_paths.py).
  The owner can override this.
* Stops go where the thesis is wrong, in the underlying (a level, a failed breakout); the -50% premium stop is the backstop (`--stop-pct 50`). Both are checked once a day
  at 14:43, so a gap can fill well past either.
* Honest note from the W43 red-team: replayed on shot 1, the +50% one-contract rule would not have fired (the best 14:43 check was +46.7%) and a stop at cost would still
  have filled at 2.93 after the gap; once-a-day checks cannot catch intraday peaks. Hence the resting GTC take-profit (owner approved 2026-10-26; placed in Run B
  on the evening of the buy, `LIVE_MODE.md` "Resting take-profit").
* A trigger's series must live through the trade (W43: BZZ26 expires 10/30, before an 11/3 exit); name the contract that does.
* After the catalyst plays out, sell what is left.
* The tracker auto-sells any option one session before its expiry. Never hold into expiry, never exercise.

## Open shots (exits checked at every 14:43 pre-close on live quotes)
* **Shot 1: CLOSED 10/22** at 2.93 real (bought 3.75 on 10/19; realized -$82.08 incl. fees; peak bid 5.50 on 10/21). Exits a) and b) fired together at the 10/22
  14:43 decision. The exit set below is kept as the template for the next index shot.
* **Shot 1 (template): 1 x SPY261120C00790000**, real fill 3.75 on 10/19 (paper 3.62). Sell the whole contract when any of these holds at the decision:
  a) bid <= 3.00 (raised 10/21 from 1.87 once the call was +38%: about SPY 767 on 10/23; checked once a day, so a gap can fill far lower, ~1.4 at SPY 760;
  on 10/28 a) and b) are checked at the ~15:30 MSFT decision, not during the 14:30 press conference); b) at the 14:43 price, SPY below 760.64 or the Nasdaq Composite below 26,023.10 (the rally low;
  not intraday lows); c) at the 10/27 pre-close, no Nasdaq follow-through day and SPY below its 50-day (768.37); d) the 10y closed above 5.31% with the 10y breakeven above
  2.40%; e) bid >= 7.50 (2x), no S&P record close by 11/4, or the 11/18 pre-close.
* **Week of 10/26 plan (Sunday 10/25 committee):** no Monday proposals; wait through the FOMC (Wed 2pm) and the MSFT/GOOGL (Wed) and AMZN (Thu) prints. The MSFT
  event shot is **dropped** (five of six personas: the consensus AI trade; robust edge 0.87-0.94x, call EV 0.59-1.11 by method; every >= 8%-OTM strike failed the spread
  rule). Thursday 10/29 is the first decision point, with these triggers checked at 14:43 (the idea watch logs any that fire, taken or not):
  - IWM 11/20 285C or 288C, 2 contracts (bank one at +50%): only on a Russell follow-through day (IWM >= +1.25% on the day and >= 279.00, volume >= 75% of the prior
    day's); stop IWM < 274 (momentum, conf 4; options-vol's 288C variant, seasonal EV 1.22x, conf 4; historian: fair odds; contrarian: no longer contrarian).
  - QQQ 11/20 750C, 1 contract (sell all at +50%): only on a Nasdaq follow-through day after the prints, VIX < 24, ask <= 3.60 (contrarian, conf 4: shorts crowded at the
    99th percentile; historian: +50% by Friday in 1 of 24 FOMC+MSFT weeks, so not before the prints).
  - USO 11/20 180C, 1 contract: deal-dip only, IV <= 48%, ask <= 4.00, WTI Dec (CLZ26) >= 92, no signed deal (macro, conf 3). Oil calls on strength are the crowd trade now.
* **Revision, Mon 10/26 Run B (research/2026-10-26/).** Tue 10/27 and Wed 10/28: no shot (all four personas). Gates for any Thursday/Friday buy: no Fed hike
  (Polymarket 6.5% on 10/26), ^TNX <= 5.10, HY OAS < 3.46% (3.38% on FRED), ^VIX <= 22. PCE and Q3 GDP print Thu 08:30 (BEA, per macro).
  - **IWM, Thu 10/29 or Fri 10/30 at 14:43:** IWM >= **+1.5%** on the day and >= 279.00, with volume by 14:43 >= 75% of the prior session's. The trigger was tightened
    from +1.25%: momentum's 75-day follow-through sample gives EV/$ 0.83 at +1.25% and 1.06 at +1.5%. Options-vol's 1.07-1.11 at +1.25% rests on n 10-14, and its
    seasonal 1.22 falls to 0.85-0.91 at the limit prices.
    Contract: 2 x the lowest 11/20 IWM call from 287 to 290 with ask <= 2.20, delta >= 0.26, spread <= 5%, OI >= 1000 ($440 at most).
    Exits: GTC sells, 1 at +50% and 1 at +100%; stop to cost once a 14:43 check shows +40%. Thesis stop: IWM < 276.00 at a 14:43 check (momentum: a failed
    follow-through; options-vol had 274). Backstop: -50%. Runner out 11/16 14:43.
    Waiting to Thursday costs about 21% of the premium if IWM goes nowhere (options-vol). The red-team sees the draft in Wednesday's Run B.
  - **Fri 10/30, only if IWM did not fire (one shot a day): INTC post-print continuation** (catalyst, conf 3; 34 of 48 pooled prints continued over 5 sessions;
    replay EV/$ 1.17-1.31).
    Trigger: INTC at least 5% above (call) or below (put) its 10/29 close at 14:43. Contract: an 11/20 strike at delta 0.30-0.45, ask <= 4.50, spread <= 5%,
    OI >= 1000. Size: 2 lots if the ask is <= 2.25, else 1.
    Exits: +50% GTC; thesis stop INTC back through its 10/29 close; -50% backstop; out 11/6 14:43. Alternate (conf 2): the same rule on AMZN puts.
  - **Dropped:**
    - QQQ 750C: delta 0.19, and on a real follow-through it prices above the 3.60 ceiling, so the trigger cannot fire.
    - MSFT, GOOGL and AMZN event trades: no event ratio robustly <= 0.9 (catalyst: 0.97-2.58x; options-vol: 0.93-2.40x by window).
    - XLE: the spread was 24% at the close.
  - USO deal-dip stays, but no 11/20 strike has IV <= 48% (53-59%). On a dip, re-strike to delta ~0.35, not the 180C.
  - Anthropic S-1: no persona proposes an AI trade on it. Momentum read the pop as narrow and on low volume; catalyst found the commitments mostly in existing backlog.
* **Revision, Tue 10/27 Run B (research/2026-10-27/).** IWM ran +1.2% to 280.18 without us. Wed 10/28: no shot (all four; options-vol prices the Fed-day
  premium at 1.2-2.5x the median FOMC move).
  - **IWM, Thu 10/29 (Fri only if INTC does not fire):** same trigger, +1.5% on the day, >= 279.00, volume >= 75% of the prior session's, 269.88 intact. Gates as
    before, plus core PCE m/m < 0.40% (Thu 08:30, macro).
    **Strike band moved:** after a +1.5% day the 287-290 calls price at 2.71-4.13 (macro), so buy 2 x the lowest 11/20 IWM call from 288 to 296 with
    ask <= 2.20 and delta >= 0.26. Tonight that is about the 292C (1.29/1.33) or 293C (1.10/1.13).
    **The edge is thin now:** EV/$ 1.05 (momentum, n 75) and 1.00 (options-vol, "no edge"), confidence 2-4. Wednesday's Run B red-team decides whether it stays a
    shot or goes to the shadow book.
    Thesis stop: IWM < 276.00 (momentum; options-vol wants 279).
  - **Fri 10/30: INTC post-print continuation, now ranked first** (options-vol EV/$ 1.13, n 26; catalyst 1.34). Rule unchanged; 105C at 2.92/3.05 and 85P at
    2.72/2.79 tonight. There are no new 8-Ks.
  - **Sizing if both fire:** the combined open premium stays <= $800, so Friday is 1 INTC lot when IWM is open (the $918 budget is not spent in one week).
  - **Shadow only:**
    - GOOGL +/-5% reaction calls/puts on Thursday (catalyst conf 2). They are Anthropic-linked, the calls match the consensus trade, and GOOGL-only EV/$ is 1.04.
    - AMZN 232.5P: the spread is 5.9%, above the 5% rule.
  - **Retired:**
    - USO deal-dip (macro: IV 52% vs 29% realized, the cap stays 48%).
    - AVGO 370C (catalyst).
    - The MSFT trades.
* **Revision, Wed 10/28 Run B (research/2026-10-28/, red-team MODIFY).** The Fed held 10-2 (two hike dissents); MSFT is +3.8% and GOOGL -10.5% after hours (a real revenue miss).
  - **IWM moved to shadow-only (red-team approved).** After a three-day run-up the follow-through EV is 0.81 (momentum, n 23; 1.27 after pullbacks, n 36), and
    options-vol puts it at 0.92-1.05. Macro alone said yes. The idea watch still logs it if it fires (IWM >= 285.51).
  - **Thu 10/29: proposal O008, 1 x GOOGL 11/20 put, conditional** (conf 2; catalyst + options-vol; pooled continuation EV/$ 1.07-1.18, n 93). The consensus view is
    "buy the dip", so this goes against it.
    Trigger at 14:43:
    - GOOGL at or below 308.65 and below its 10/29 open;
    - the standing gates hold.
    Contract: delta 0.30-0.45, ask at most 4.00, spread at most 5%, OI at least 1000.
    Exits: +50% GTC; stop on GOOGL back above its 10/29 open; -50% backstop (the real stop); out 11/5.
    It is Anthropic-linked: the thesis rests on GOOGL's own 8-K and a mega-cap base rate, and the link is disclosed in the order's thesis.
  - **Fri 10/30: INTC is split by persona.**
    - catalyst: 105C/90P, EV 1.34;
    - momentum: 110C only, above the 50-day 101.65;
    - options-vol: 87.5P, EV 0.94-1.19; 105C below 1.
    Thursday night's Run B drafts it after the print. Cap: $355 if O008 fills.
* **Revision, Thu 10/29 pre-open (strategy review C1, CONFIRMED by a hair).** Post-earnings continuation applies only after a mega-cap DOWN gap of 8% or more.
  - Enter at the reaction day's 14:43 check, buying a put at delta 0.30-0.45, only if its quoted IV is at most 1.3x the pre-print 20-day realized vol. Hold
    at most 5 sessions; the effect is gone by session 10.
  - Evidence: n 216, 62% continue, +0.90% beyond SPY (t 2.5; since 2015 t 2.4). Even so, the put is break-even (EV 1.00), so the IV gate is the edge.
  - Up-gap call continuation rules are removed (50% continuation since 2010).
  - **GOOGL:** proposal O010 (replaces O008) adds put IV at most 30%; GOOGL's RV20 was 21%. Valid 10/29 only.
  - **Fri 10/30:** INTC and AMZN qualify only on a down gap of 8% or more. The IV gate is about 66% for INTC (RV20 51%) and 1.3x RV20 for AMZN. The INTC call leg
    is dropped.
* **Revision, Thu 10/29 Run B (research/2026-10-29/, red-team MODIFY).**
  - GOOGL O010 was cancelled at 14:44: put IV was 32%, above the 30% cap.
  - **Fri 10/30: proposal O011, 1 x INTC 11/20 put (C1 rule).**
    Trigger: INTC at or below 84.70, put IV at most 70.6% (1.3x RV20 54.3%), delta 0.30-0.45, ask at most 3.00 (the weekend gap), spread at most 5%,
    OI at least 1000, gates as before.
    Exits: no take-profit; time exit 11/6 14:43; stop INTC at or above 1.04x its 10/30 close; -50% backstop.
    INTC was -19% after hours on a Q4 guide miss.
  - **AMZN put fallback: rejected** (shadow only; conf 1, and likely no in-band put at 3.00 or less).
  - **IWM:** +1.0% today on 0.95x volume, so no follow-through day. It stays shadow-only.
* **Revision, Fri 10/30 Run B (research/2026-10-30/).** O011 (INTC put) was cancelled at 14:44 on the ^VIX gate (22.58 live; VIX closed 19.42). Its 60P went
  from a 2.42 ask to a 1.695 mid, the first live C1 data point.
  - **No proposals for Mon 11/2** (all four personas). The Nasdaq broke its 10/23 rally-attempt low (QQQ 690.49; -9.1% from its high; the 200-day is 679.52).
    Friday was an AI derating, not broad risk-off: equal-weight RSP -0.8%, HY OAS ~3.26-3.34.
  - **C1 watchlist (reaction days):**
    - AAPL (prints 11/2, reacts 11/3) and AMD (11/3, reacts 11/4) are shadow only: AAPL's IV gate of about 19% is far below its 34-39% put IV, and AMD's
      puts cost over the size cap.
    - QCOM: prints 11/4, so a conditional put on 11/5 (conf 2; IV gate about 66%).
    - **Personas still wrote "+50% GTC" exits for C1 puts. The exception applies: C1 puts hold 5 sessions with the -50% backstop and no take-profit.**
  - **For Sunday's review, decided in advance:** whether C1 puts keep a ^VIX gate. Post-hoc split (research/2026-10-30/c1-vix-split.csv): VIX <= 22, n 149,
    EV 1.02, t 3.0; VIX > 22, n 67, EV 0.96, t 0.3. The difference is not significant (p 0.61), and since 2010 it is 1.05 vs 1.04. Also settle which VIX
    reading counts (14:43 live vs the close).
* **Exit design after shot 1 (options-vol post-mortem, cost $257 vs the 5.50 peak):** see Exits (decided at entry).

## Catalyst calendar for shots (re-judge every run)
* **Week of 10/19:** NFLX 10/20 (event vol very rich, no trade). META and TSLA report 10/21 after the close; LRCX, TXN and IBM the same evening. This is the AI-capex test.
  No event trade on META (no edge on an expiry that clears the 3-day rule); trade the reaction (decide 10/22) rather than holding through. Thu 10/22: earliest follow-through day.
* **10/28:** MSFT and GOOGL after the close, FOMC decision at 2pm. **10/29:** AMZN, INTC. **10/30:** XOM/CVX (unverified). **11/1:** OPEC+. **11/2:** AAPL. **11/3:** midterms, AMD after the close.
  **11/6:** jobs. **~11/10:** CPI.
* **Anthropic IPO (S-1 filed 10/26, Nasdaq "ANT"; owner flagged it; `research/2026-10-26/anthropic-s1.md`).** No price range yet; pricing is likely after our window
  or at its edge, so ANT itself is not tradable here. Watch `research.py sec filings 2130357 --days 7` in Run 0 for the S-1/A (price range, September numbers),
  then the roadshow and pricing dates. The filing moved AI names on 10/26 (NVDA, AVGO +2.3-2.4%). **Conflict guardrail:** every persona is Claude, built by
  Anthropic, so (1) no idea whose thesis is Anthropic or ANT itself; (2) an AMZN/GOOGL/MSFT/AVGO/NVDA idea may use only facts quoted from public filings and news,
  must pass the consensus check (the "IPO halo" is the consensus trade), and the red-team must say whether the Anthropic link is the thesis; (3) the journal
  discloses the link on any such trade.
* **11/9-11/17: the NVDA run-up** (strategy review C2: NVDA's own run-up since 2015 is -0.08%, and calls add nothing over a random call; tie-break only). NVDA reports **after the close on Tue 11/17** (company-verified per Robinhood `get_earnings_results`, checked 2026-10-18; it was wrongly assumed to be
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
**Press bearish** (QQQ/SMH puts; puts carry most of the volatility premium, so they also need a measured edge): S&P closes below 7,428; VIX closes above 28; 10y above 5.25%; HY OAS above 346bp; an Oracle junk cut; a surprise hike on 10/28.
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
* 2026-10-30 (Run B): no Monday proposals; C1 watchlist (QCOM 11/5); the VIX-gate decision for C1 goes to Sunday with the split data.
* 2026-10-29 (Run B): C1 down-gap puts exit as tested (hold 5 sessions, -50% backstop, no take-profit); INTC put O011 for Friday; AMZN fallback rejected.
* 2026-10-29 (strategy review, owner's ask): evidence rules (edges need a script or a study; retired arguments listed); earnings continuation
  is now a down-gap-only put rule with an IV gate; INTC call leg dropped; GOOGL O010 with IV <= 30%; puts need an edge beyond the premium.
* 2026-10-28 (Run B): IWM to shadow (EV 0.81 after a run-up); conditional GOOGL put O008 for Thursday (red-team modified: below the open, ask <= 4.00).
* 2026-10-27 (Run B): IWM strike band moved to 288-296 (the old band cannot fill at <= 2.20 after +1.5%); INTC Friday ranked first;
  combined premium <= $800 if both fire; USO deal-dip and AVGO 370C retired.
* 2026-10-26 (Run B): Thursday IWM trigger tightened to +1.5% (larger sample); QQQ 750C and the MSFT tripwires dropped; INTC continuation added for Friday;
  Anthropic S-1 conflict guardrail (owner flagged the filing).
* 2026-10-26: resting GTC take-profits at the broker (owner's go-ahead): +50% for one contract, half +50% / half +100% for two or more; placed after the close on the buy day.
* 2026-10-25 (Sunday plan): MSFT event shot dropped (consensus, no robust edge, spreads); wait through the FOMC; Thursday triggers for IWM, QQQ, USO.
* 2026-10-25 (W43 review): exits decided at entry (one contract sells at +50%); consensus check with a measured edge; fresh snapshot numbers and named series
  in every brief; ideas logged per persona and marked weekly.
* 2026-10-24: goal lowered to $2,200 (+10%) and beating SPY, by the owner; pacing for the lower target: $250-400 shots, max $450, two open, a $1,700 pause
  line, protect gains near the goal.
* 2026-10-23: weekly retrospective added to the Sunday review at the owner's request (review.py facts, process/outcome grading, root causes, at most 3 changes).
* 2026-10-22 (Run B): TLT shot 2a proposed (risk-modified: 5 lots, TLT >= 81.74 and 10y <= 4.96%, a runner); exit-design rule from the shot 1
  post-mortem; MSFT strike walk starts at 565 on the live chain.
* 2026-10-22: shot 1 closed by its raised stop and the Nasdaq rally-low exit on the Houthi/Saudi risk-off day (-$82.08 real). Budget above the floor $917.92.
  A new SPY option within 30 days of this loss would be a wash sale (deferral only; all positions close by 11/18).
* 2026-10-21: shot 1 stop raised to bid <= 3.00 (options-vol, risk-modified: checked at ~15:30 on FOMC day); momentum's SPY 768.30 trail rejected
  (inside one day's range). META's 2026 capex was narrowed to $135-145B, not raised (8-K), despite the headlines.
* 2026-10-20: shot 2 tree gains a credit veto (HY OAS > 3.46%) and a live strike walk; shot 1 exits unchanged after the Run B committee.
* 2026-10-19: shot 1 opened (SPY 11/20 790C @ 3.75 real); its exit set (a-e) and the shot-2 decision tree written down after the Run B committee and risk
  review; MSFT sizing by contract, not dollars. SpaceX reports Tue 10/20 after the close (catalyst, $2.0T).
* 2026-10-18 (Sunday review, v2.1): event-vol rule, FOMC-day timing, one shot a day with a reserve for the 10/28 MSFT shot, the 3-day expiry note, the verified S&P base
  rate, TLT/IWM/COP added to the universe (XLE out), ETF spread limit covers commodity ETFs, calendar fixes (AMD 11/3; META event trade dropped).
* 2026-10-17: v1 written (stocks/ETFs, energy core).
* 2026-10-18: research toolkit (headlines, full text, Fed/EIA RSS, SEC filings and insider trades) and a 09:13 ET pre-open news run added at the owner's request.
* 2026-10-18: NVDA earnings date corrected to 11/17 after the close (semis-ai specialist, confirmed via Robinhood).
* 2026-10-18: loss budget raised to $1,000 by the owner (floor $1,000; shots ~$500; goal needs ~3x).
* 2026-10-17: v2. Owner chose options with the $500 loss budget; stock buys off; $1,500 cash floor enforced in code; XLE/GUSH proposals cancelled.
