# Playbook (living document; revised as the experiment teaches it something)

Version 2.1, 2026-10-18 (v2 2026-10-17; budget raised to $1,000 on 2026-10-18; Sunday review revisions on 2026-10-18). The owner chose options with the loss budget to go after the $4,000 target; on 2026-10-24 the target became $2,200 (+10%) and beating SPY. Version 1 (stocks and ETFs, bounded convexity) is in git history.

## Stance since 2026-11-07: make money (owner retired the $2,200 / 11/18 target)
* **Objective:** grow the agent account (now $1,384.84) with a positive expected return and controlled drawdowns, with no date or amount target (RULES.md,
  "Owner's mandate"). The owner's fixed limits: the money in the MCP account, no transfers, no margin borrowing, the kill switch. Everything else here is Claude's
  and evolves through the rule-evolution process.
* **What the evidence says so far (our own reviews):** buying options loses on average (D1, D3 CONFIRMED); the only confirmed option setup (C1 down-gap puts)
  is about break-even and rare; every popular timing rule tested failed or decayed; the goal-budget variance bet was a deliberate gamble, not an edge. A
  goal-free "make money" mandate removes the reason to gamble. The research now asks what has a positive expected return for this account: equity
  exposure (the equity premium) with or without a trend filter, a T-bill ETF for idle cash, Level 2 premium selling (cash-secured puts, covered calls), and
  long options only where an edge is measured.
* **Adopted 2026-11-08 (rule-evolution vote, red-team MODIFY): the index core.** About 80% VOO and about 20% SGOV, bought as a lump sum at the next
  pre-close check, held without stops or timing rules (the trend filters, the regime gate and staging all failed tests or were retired). Options only for
  CONFIRMED setups (C1), sized at most min(full Kelly at the contract's DTE on current equity, the SGOV reserve), about $190-263 at IV = RV20
  (ov_1108.py), from the SGOV reserve; never sell VOO to fund options. The exception:
  S1 was WEAK, not CONFIRMED (t 1.98 in one cell), and the core rests on it plus the cited equity-premium literature. **Honest expectations:** about
  +$100 a year on the account; a 2008 replay is about -$610 on the core (about -$890 if the reserve were also lost; the worst in sample, not the worst
  possible). **VOO, not SPY:** same index, a lower fee (0.03%), and it may avoid a wash sale against the 11/5 SPY call loss; whether same-index ETFs
  count as substantially identical is unsettled, the worst case only defers the $533 loss, and the owner's IRAs count too. **No SPY shares or SPY options
  before 12/06** (30 days after the 11/05 loss).
* **Retired 2026-11-07:** the goal-budget variance bet (it existed only to chase the date target), the goal arithmetic below, and the daily fill cap.

## Probe program, policy-event watch and research cadence (adopted 2026-11-11; research/strategy-v4/adoption-2026-11-11.md, red-team MODIFY)
* **Probes (registry `data/probes.csv`):** plumbing tests, not edge evidence (the second stated exception).
  - **PR1 gold (live):** $50 GLDM, funded by trimming $50 of VOO. Benchmarked against SGOV, with bands committed in `research/strategy-v4/probe-bands-pr1.txt`:
    killed at a checkpoint below -$4.91 at week 4, -$6.38 at week 8 or -$7.41 at week 12. It is the only gold holding.
  - **PR3 earnings run-up in shares (live, event-driven, WEAK):** $25 each in up to 2 of the 25 C1 names, from 7 sessions before earnings to the session
    before the print; the tiebreak and the date re-check are in the registry; no stop. It starts with the next eligible event.
  - **Paper:** PR2 (the non-equity trend sleeve), PV3 (the volatility-managed core), PV1 (C1 on 76 more names).
  - **PR4:** open, only for a question paper cannot answer.
  - **Program rules:** a -$50 program-wide stop pauses all probes until the Sunday vote; kills are checked at weeks 4, 8 and 12; every probe is retired by week
    24; graduation needs CONFIRMED on independent data plus a deflated Sharpe of at least 0.95 across the register.
* **Policy-event watch (logging, not a trading rule):** the qualifying events are federal elections; a bill touching AI, data centers, chips, energy or
  tariffs passing a chamber; a major court ruling or executive order on those; and an FOMC decision with a change priced at 50% or more.
  - **W0:** a "who loses" basket with index weights, written by Run B within 10 sessions of the event.
  - **W1:** policy prediction markets added to `predmkt.py`'s watch list; a doubling, or a move of 10 points in 30 days, is flagged.
  - **W2:** a divergence flag (SPY up while XLK lags 1 point, SOXX lags 2.5 points, or the basket is down 2%), logged only, because P1 failed out of sample.
  - **W4:** NQ=F vs ES=F after an event that resolves after the close, recorded in Run 0, with a gap of 1 point or more flagged.
* **Research cadence:** a nightly mechanical check in every Run B:
  - broker-ledger reconciliation and the kill switch;
  - earnings-date changes and 8-Ks for held names and C1 names;
  - the W1/W4 flags and the probe stop.
  The full persona round runs only when, within 2 sessions, there is a C1 reaction day, a PR3 entry or exit, an open-option or probe decision, or a
  qualifying policy event; when an unscheduled shock hits (for example the 11/4 moratorium call); and always on Sunday.

## (Retired 2026-11-07) Stance: measured shots toward $2,200 (since 2026-10-24)
* **The arithmetic.** From $1,917.92 (10/23) the $2,200 goal needs about +$282, +31% on the $918 budget: one shot that doubles on ~$300, or two that each make
  +50%. Beating SPY needs about +3.3% more than SPY makes from here. Judgment, not a backtest: perhaps 25-35% to reach $2,200, and better than even to finish ahead of
  a losing SPY; the most likely bad outcome is now a few hundred dollars lost, not the whole budget.
* **Sizing since 2026-10-30 (owner: "Remove caps on place a buy. You have 2 k to work with").** There are no dollar caps on a buy: no shot-size band, no $450
  maximum, no $1,700 pause line, no house-money rule. The whole $2,000 is available.
  - Each order's thesis states its size and why: the strength of the measured edge, and what a total loss would leave.
  - **Sizing method (W44 review, 2026-11-01; a method, not a cap):** run `research/strategy-review/scripts/sizing.py` on the setup's tested per-$ payoff
    distribution, quote the Kelly fraction and the dollars at full, half and quarter Kelly in the thesis, and plan at half-Kelly (the estimate is noisy).
    Above half-Kelly the thesis says why.
  - For C1 puts (n 216) at the put's IV divided by the pre-print RV20, with $1,918 of equity:

    | IV/RV20 | Kelly | Full | Half |
    |---|---|---|---|
    | 1.00x | 0.170 | $326 | $163 |
    | 1.15x | 0.090 | $173 | $86 |
    | 1.25x | 0.035 | $67 | $34 |
    | 1.30x and above | 0 | $0 | $0 |

    The caps are gone, but the evidence still says C1 is a small bet.
  - **Red-team (W44):** these figures are fragile. At 1.25x, f* is 0 in 38% of bootstrap resamples. **Rule: buy one contract only when full Kelly covers its
    cost; otherwise no trade.** The method guards the bankroll; it does not raise the odds of $2,200. Any bet above Kelly would be a deliberate gamble, and
    only the owner can choose one, as a named budget.
  - Still in force: at most 4 fills a day, at most 4 positions, never average down, and the evidence rules and gates.
  - (Before: $250-400 shots, max $450, a $1,700 pause line.)
* (Before 10/24) $4,000 needed +$2,000 from a $1,000 risk budget, about a 3x on premium; judged 8-20% at best.
* **The structure (enforced in code).** Since 2026-10-30 premium may use any cash up to the $2,000 capital cap, with no floor. Every open option can go to zero, so the whole $2,000 is at risk (it was a $1,000 floor).
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
  - Strategy v2 (2026-11-07/08, `research/strategy-v2/README.md`): trend filters (REJECTED), the stock-era regime gate (REJECTED), cash-secured puts at
    this size (REJECTED), covered calls (WEAK, not adopted), Level 3 spreads (UNTESTABLE; not requested), Anthropic-linked buys (REJECTED; guard: no
    AMZN/GOOGL adds into the ANT pricing), dip-buying calls after a -4% day (0.75-0.80 per $).
  - Alternative data (review 2026-10-30, `research/alt-data/README.md`): FINRA short-volume spikes (REJECTED), Wikipedia attention spikes (REJECTED), the put/call
    ratio (WEAK, decayed). Prediction-market odds (`research/alt-data/scripts/predmkt.py`) are an input to the macro brief, not a signal.

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
* **C1 rule, final (W44 review, 2026-11-01):** a mega-cap down gap of 8% or more on the reaction day; a put at delta 0.30-0.45 bought at that day's 14:43
  check, only if its quoted IV is at most 1.3x the pre-print RV20; spread at most 5%; OI at least 1000; sized with sizing.py.
  - **No market gates** (^VIX, ^TNX, HY OAS), **provisional**: the tested sample had none, so this matches the test. But the VIX split is underpowered
    (p 0.61), and the stock edge sits at VIX <= 22 (t 3.0 vs 0.3). ^TNX and HY OAS were never tested. Revisit with more data.
  - Exit as below.
  - **The line (clarified 2026-11-12, momentum's catch):** 0.92 x the pre-earnings close, rounded DOWN to the cent, so the trigger is a gap of
    8% or more as tested (11/12: 0.92 x 102.01 = 93.8492, so the line is 93.84; 93.85 would fire at -7.9992%). Not a rule change.
  - **C1 expiry (chair's ruling, 2026-11-01):** at least 14 calendar days at entry (the 5-session hold leaves a week of buffer), so an 11/20 put
    qualifies for an 11/5 entry.
* **Exception, C1 down-gap puts (2026-10-29):** they use the exit the strategy review confirmed: hold to session 5 (time exit at that day's 14:43 check),
  with the -50% backstop and no take-profit, and no resting GTC is placed. Two model checks found that a +50% target cuts this setup's EV below 1:
  the strategy review's D4 (holding beat the target set by about 0.14 at the real skew) and the 10/29 red-team (1.14 to 0.97, scripts/risk_exit_paths.py).
  The owner can override this.
* Stops go where the thesis is wrong, in the underlying (a level, a failed breakout); the -50% premium stop is the backstop (`--stop-pct 50`). They are checked
  at 14:43 and, **since 2026-11-08, at a mid-session check (about 11:00 ET) while any non-C1 option is open** (on 11/5 the call hit its stop by 10:00 and
  was sold at 14:43, costing about $190). The check is a scheduled task created at the entry and removed at the exit. C1 puts keep their tested 14:43-only
  exit until it is re-tested. A gap can still fill past any stop.
* **Index core (VOO, SGOV): no stop and no take-profit.** It is sold only on a rule change, at the owner's request, or to rebalance; it is never sold to fund
  options. The owner is alerted if equity falls below $1,000.
* Honest note from the W43 red-team: replayed on shot 1, the +50% one-contract rule would not have fired (the best 14:43 check was +46.7%) and a stop at cost would still
  have filled at 2.93 after the gap; once-a-day checks cannot catch intraday peaks. Hence the resting GTC take-profit (owner approved 2026-10-26; placed in Run B
  on the evening of the buy, `LIVE_MODE.md` "Resting take-profit").
* A trigger's series must live through the trade (W43: BZZ26 expires 10/30, before an 11/3 exit); name the contract that does.
* After the catalyst plays out, sell what is left.
* The tracker auto-sells any option one session before its expiry. Never hold into expiry, never exercise.

## Open shots (exits checked at every 14:43 pre-close on live quotes)
* **Shot 2: CLOSED 11/5 by the -50% stop**, sold at 1.46 real (paper 1.31). Realized -$533.08: bought 6.79 on 11/4 ($679.04), out $145.96. An AI-stock rout
  (SPY -3.7% at 14:43, -4.4% at the close; ^VIX 28.18) gapped it from 6.69 to 1.43 in one session, far through the 3.39 stop. The rule record below is kept.
* **Shot 2 (record): the goal-budget call. 1 x SPY261204C00780000**, real fill 6.79 on 11/4 at 14:48 ET (cost $679.04 with fees; Robinhood avg $679; cash after
  the buy $1,238.87). It is not an edge (playbook, Goal-budget bet). Exits, checked in this order at every 14:43 check on live Robinhood quotes:
  a) **goal:** account equity at least $2,200, i.e. a bid of at least 9.62 = ceil((2200 - 1238.87) / 100). A resting GTC sell of 1 at 9.62 (1.42x cost) goes in
  Run B on 11/4 (`live.py resting`). If cash changes, recompute it.
  b) **-50% stop:** the bid at or below 3.39 (half of 6.79), at a 14:43 check. A gap can fill lower, and nothing else triggers it.
  c) **time:** sell at the 11/18 14:43 check.
  No second contract and no averaging down. The 11/6 jobs report, ~11/10 CPI and NVDA on 11/17 after the close are on the tape. A sale at a) or b) cancels the
  resting GTC first.
  **If another position is opened (red-team 11/04):** the 9.62 GTC then equals $2,200 only if the other position holds its value. It stays as the call's
  take-profit, and a new rule is added: sell everything at any 14:43 check where account equity is at least $2,200.
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

* **Week of 11/2 plan (Sunday 11/1 review and re-plan; research/2026-11-01/, reviews/2026-W44.md):** all six personas say no trade passes the rules this week.
  Every script-backed Kelly figure is $0 or below one contract: index calls are priced about fair (beta, not edge), the midterm and jobs premium is fair to
  rich, oil options are rich, and the QQQ dip, 200-day and contrarian setups fail.
  - **C1 watch (conditional, decided at each reaction day's 14:43 check):**
    - AAPL (prints Mon 11/2, reacts 11/3) fails its IV gate unless the put is about 1.03x RV20.
    - AMD (11/3, reacts 11/4) costs too much for Kelly.
    - **QCOM (11/4, reacts Thu 11/5):** 11/20 put. Binding gate: IV at most 48% (where full Kelly covers one contract). Spread at most 5%, kept hard (live 11/20
      spreads were 10-14%). OI at least 1000; QCOM at or below 0.92x its 11/4 close.
  - **Owner-only goal budget: O012** (1 x SPY 11/30 770C, ask at most 7.85 at the 11/2 14:43 check). It is confirmed **only** with the owner's written approval
    and stop choice before 14:43. It is not an edge (Kelly $0).
    - If it fills: P($2,200) about 44-56%; P(beat SPY) about 50-58%; P(below $1,600) about 1 in 3; a 75%+ loss about 1 in 4 with no stop, or 3% with a -50% stop.
    - Cash path: P(beat SPY) about 13-18%.
  - **Update, Mon 11/2 Run B (research/2026-11-02/):**
    - O012 was cancelled (no owner approval).
    - AAPL beat and was flat after hours: no C1.
    - AMD's C1 is blocked (a band put costs $1,095-1,361 against full Kelly of $312-595).
    - QCOM Thu 11/5 stays conditional at IV of about 44-48.5% and a hard 5% spread. Tonight's spreads are 5.8-8.7%, so it is likely to fail.
    - Oil after a 6%+ drop has no edge (74 cases since 2006; calls 0.67-0.75 per $). The midterm premium is fair to rich.
    - All four personas: no trade for Tuesday.
  - **Update, Tue 11/3 Run B (research/2026-11-03/):**
    - **O013 queued:** the goal-budget call (1 x SPY 11/30 768C reference, ask at most 8.50) for the Wed 11/4 14:43 check only, under the rule below.
      Tonight's dry run: P($2,200) 46.8%, EV 1.013.
    - Macro: the midterms went as priced, leaning further Democratic. No rate, credit or VIX gate is needed (`scripts/macro_gate_test.py`); the only block is a
      circuit-breaker day (S&P 500 Level 1 = 7,039.10).
    - Momentum: no tape block.
    - AMD gapped up about 7% after hours, so there is no C1. QCOM Thu 11/5 stays conditional and is likely to fail on spread.
  - **Update, Wed 11/4 (research/2026-11-04/):**
    - **The goal-budget call was bought:** 1 x SPY 12/04 780C at 6.79 real (Shot 2 above), with a resting GTC at 9.62.
    - **O016 queued (O015 as modified by the red-team), the QCOM C1 put for Thu 11/5 14:43.** QCOM is -8.2% after hours, just under its 159.33 line.
      - Contract: the 11/20 155P (the 150P if QCOM is 157 or lower).
      - Gates: spread at most 5%; IV at most 72%; and the ask within full Kelly at its quoted IV on the 15-DTE table (4.15 at 46%, 3.82 at 48%, 3.53 at
        50%). Likely blocked by Kelly or by the spread.
    - Macro, momentum and options-vol: no trade. Oil relief drops have no edge (26 cases, 0.84 per $). The jobs straddle is 0.84%. Thursday's Level 1
      circuit breaker is ^GSPC 7,150.42.

  - **Update, Thu 11/5 Run B (research/2026-11-05/):**
    - Shot 2 was stopped out (sold 1.46; -$533), and the account is in cash ($1,384.84).
    - All four personas: no trade for Friday.
    - **No second goal-budget bet on Friday.** Calls entered after a -4% day pay 0.75-0.80 per $ (macro_1105.py, momentum_1105.py), below the 0.93
      gate. The 12/04 band fails OI, and the bet would be about 70% of equity. The Sunday review decides on any pre-registered second bet.

  - **Update, Fri 11/6 Run B (research/2026-11-06/):** all four personas say no trade for Monday. CSCO C1 is conditional for Fri 11/13 (Kelly fits only at
    IV <= ~38%). A December hike is priced at 77%; CPI is Tue 11/10. A second variance bet would now give about 22% for $2,200 and 42%+ below $1,000, and
    only on a 12/18 expiry that breaks the 5-week rule. The Sunday review decides.

* **Week of 11/9 plan (Sunday 11/8 review, research/2026-11-08/, reviews/2026-W45.md):**
  - **Mon 11/9 14:43: the index core.** O018 VOO $1,100, then O019 SGOV $265 once VOO shows filled; about $19.82 stays in cash. Skip on a halt, a quote
    older than 2 minutes, unleveraged buying power below $1,375, or a review alert; a partial fill is cancelled at 15:30 and finished the next session.
    Seven personas found nothing that should delay it (historian: after a 10%+ Nasdaq correction the S&P's next 12 months averaged +14.7% vs +9.4% on
    any day, n 14 episodes; the downside tail is wider, with the 1-month 10th percentile -9% to -10%).
  - **Fri 11/13 14:43: CSCO C1, conditional** (reports Thu 11/12 after the close; the proposal is written in Thursday's Run B from the 11/12 close). The
    trigger is CSCO at or below 0.92x that close; 1 12/18 put (the only expiry with OI >= 1,000), delta 0.30-0.45, spread <= 5%, IV <= 1.3x RV20, ask
    <= min(full Kelly/100 at 35 DTE, 2.77): 2.63 at IV = RV20, 1.87 at 1.1x. Funded by selling SGOV. It is likely to fail on IV or spread.
  - **Update, Mon 11/9:** the core was bought (1.587599 VOO @ 692.87, 2.636818 SGOV @ 100.50; cash $19.82). No proposals for Tuesday. CSCO's line moves with its
    11/12 close (about 90.76 at 98.65); RV20 rose to 44.2%, so the put fits only at IV of about 37.5-43%.
  - **Update, Tue 11/10:** the hot CPI (0.4% headline, 0.3% core) left the core held (no rule acts on it). No Wednesday proposals. CSCO's line is about 90.30
    at 98.15; the put fits only at IV of 36-42%. ANT's S-1/A No. 2 assumes $74.00 with a $26B private placement (Google, NVIDIA $10B each); A1 stays REJECTED.
  - **Update, Wed 11/11:** decision night. PR1 goes ahead Thursday (O020 VOO -$50, then O021 GLDM $50). CSCO line 92.70 at the 11/12 close of 100.76;
    one 12/18 put fits only at IV of about 34-36% at -8% (49% tonight), and every band spread fails 5% tonight: stand down if the in-band IV is above
    about 45%. **W0 (policy-event watch) for the Senate energy permitting bill** (data centers pay their own transmission; final passage votes "next week",
    Reuters 11/11): the losers basket is MSFT 6.10, AMZN 4.10, GOOGL/GOOG 4.69, META 2.18, ORCL 0.36, EQIX 0.16, DLR 0.10, IRM 0.05 = 17.7% of SPY (SSGA
    11/10; the cost is about $5.5B a year, small against the weight). The vote days plus 2 sessions are W2-flag days and decision nights. The FOMC is on
    Dec 9 (25 bp priced, about 13% odds of 50 bp); its W0 is due at the 11/24 Run B. PR3's first event is CRM (buy 11/23); its bands are committed at the
    11/15 review.
  - **Update, Thu 11/12:** PR1 is running (0.65123 GLDM @ 76.78, funded by 0.071773 VOO @ 696.53). NVDA's CEO resigned (8-K 5.02); NVDA closed -4.3%.
    CSCO closed 102.01, then beat and raised (8-K 2.02; FY27 guide raised, Q2 guide below Q1, gross margin 65.6% vs 68.1%), roughly flat after hours.
    **Fri 11/13 C1 (O025, red-team MODIFY):** fire only at CSCO <= 93.84 (rounded down); 1 x the cheapest in-band 12/18 put (90P illustrative;
    92.5/87.5/85/82.5P pre-cleared); IV <= 58.35%; limit from the ceiling table at the live IV (2.65 at <= 44.7%, 1.77 at 50%); funded by O024 (SGOV,
    sold only after the put passes every gate, min(cost + $1, the holding)). It fits only at IV of about 38.5-44% after an 8-12% gap.
  - **Update, Fri 11/13:** CSCO's C1 did not fire (95.595 at 14:44, −6.3% against the 93.84 line); O024/O025 cancelled; SGOV stays whole. Next: the Sunday
    11/15 review (PR3 bands for CRM, the PDT allowance proposal, the V3 retest, and the permitting-vote timing for W0/W2), then NVDA's C1 shadow on Wed 11/18.
  - **Watch:** CPI Tue 11/10 (not a reason to delay); NVDA's board probe of its CEO (Axios, DW, 11/8; no 8-K yet); NVDA earnings 11/17 after the close
    (C1 shadow only; the reserve could not fund it after a CSCO trade); the ANT IPO pricing (guard: no AMZN or GOOGL adds). No SPY shares or options before 12/06.

* **Goal-budget bet, decided by Claude under the owner's autonomy grant (2026-11-02: "You dont need my approval to do anything work autonomously").**
  The owner's goals are $2,200 and beating SPY; they removed the buy caps and gave the whole $2,000. With no evidence-backed edge available, a cash finish beats SPY
  only about 15% of the time and reaches $2,200 never.
  One SPY call raises those to about 45-55%, at a flat expected value (0.94-1.04 per $, so a choice of variance, not an edge). Claude takes it, with the -50%
  stop: the red-team found the stop costs about 4 points of goal odds and cuts the chance of a 75%+ loss from about 1 in 4 to 3%.
  **Pre-registered entry rule (written 11/02 evening, before Wednesday's prices):**
  - **When:** Wed 11/4 at the 14:43 check only. That is after the midterm vote: the event premium was rich (midterm straddles returned 0.52-0.90 per $), and the
    morning-after IV crush lowers the entry cost.
  - **Contract:** 1 SPY call, 11/30 or 12/04 expiry, delta 0.35-0.40, OI at least 1000, spread at most 5%, premium at most $850.
  - **Confirm only if all hold:**
    - `research/2026-11-02/scripts/goal_odds.py` (the parameterized historian model) at the live quote, with the -50% stop, gives P($2,200) of at least 35%
      and a model EV of at least 0.93 per $;
    - no market-closing halt or circuit-breaker day;
    - a fresh risk red-team does not reject it (the buy is 20% or more of equity).
  - **Exits:** sell at the first 14:43 check where equity is at least $2,200, with a resting GTC at that call price if it is at least 1.4x cost, else checked at
    14:43; the -50% stop at a 14:43 check; otherwise sell at the 11/18 14:43 check.
  - **Other decisions under the autonomy grant:** the take-profit question for other trades stays as is (D4 is WEAK evidence, not enough to change). There is no
    separate "stop and talk" loss point; the owner gave the whole $2,000 and autonomy, and the kill switch remains theirs.

## Catalyst calendar for shots (re-judge every run)
* **Week of 10/19:** NFLX 10/20 (event vol very rich, no trade). META and TSLA report 10/21 after the close; LRCX, TXN and IBM the same evening. This is the AI-capex test.
  No event trade on META (no edge on an expiry that clears the 3-day rule); trade the reaction (decide 10/22) rather than holding through. Thu 10/22: earliest follow-through day.
* **10/28:** MSFT and GOOGL after the close, FOMC decision at 2pm. **10/29:** AMZN, INTC. **10/30:** XOM/CVX (unverified). **11/1:** OPEC+. **11/2:** AAPL. **11/3:** midterms, AMD after the close.
  **11/6:** jobs. **~11/10:** CPI.
* **Anthropic IPO (S-1 filed 10/26, Nasdaq "ANT"; owner flagged it; `research/2026-10-26/anthropic-s1.md`).** No price range yet; pricing is likely after our window
  or at its edge, so ANT itself is not tradable here. Watch `research.py sec filings 2130357 --days 7` in Run 0 for the S-1/A (price range, September numbers),
  then the roadshow and pricing dates. The filing moved AI names on 10/26 (NVDA, AVGO +2.3-2.4%). **Conflict guardrail:** every persona is Claude, built by
  Anthropic. **Revised 2026-11-07 (owner: "Absolutely research and if the data recommends moving on these do it"):** (1) an Anthropic-linked idea, ANT
  itself included once it lists, is allowed when the evidence supports it, through the normal evidence rules; (2) always public information only: Claude has
  no non-public information about Anthropic and must never claim or use any; (3) the conflict is disclosed in the thesis and the journal; (4) the red-team
  states whether the thesis leans on optimism about Anthropic, and the consensus check still applies (the "IPO halo" is the consensus trade). (Before: no
  idea whose thesis was Anthropic or ANT.)
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
* 2026-11-12 (Run B, decision night): PR1 started; the CSCO C1 proposal O025 + funding O024 (red-team MODIFY); the C1 line is rounded down to the cent (momentum caught 93.85 vs 93.8492).
* 2026-11-11 (owner: "Review and learn from this" day-trader-skill repo): exits keep the 15:58 cutoff and skip the fill cap; `record` checks a fill against its ticket; option theses state the break-even and the drift-matched baseline; a move with no story is journaled. R1 (a reward:risk minimum) was REJECTED, so no such rule. The FINRA PDT change was verified only in part, and the same-day guard stays until 11/15. The red-team said "adopt with fixes". It also found three older gate bugs, now fixed: a `--pct` above 100 oversold; an approved, unplaced resting order did not block other sells; a part-filled resting order was closed. Memo: `research/strategy-v4/day-trader-skill-review.md`.
* 2026-11-11 (Run B): the first W0 basket (Senate permitting bill, losers 17.7% of SPY); PR3's buy date fixed to match the tested script.
* 2026-11-11 (owner's delegation; red-team MODIFY): the probe program (PR1 gold live, PR3 earnings run-up event-driven, PR2/PV3/PV1 paper; a -$50
  program stop; the whitelist and an 8-ticker limit in code), the policy-event watch (W0, W1, W2-as-flag, W4) and the nightly mechanical check replacing the
  daily persona round, which now runs only on decision nights. Strategy v3 and v4 verdicts were added to the evidence list.
* 2026-11-10: core held through the hot CPI; no Wednesday proposals; ANT S-1/A No. 2 noted (A1 unchanged).
* 2026-11-09: the index core was bought (VOO $1,100, SGOV $265); no Tuesday proposals.
* 2026-11-08 (Sunday rule-evolution vote, red-team MODIFY): the index core adopted (about 80% VOO, 20% SGOV; a stated exception, S1 WEAK); the regime gate,
  staging, circuit breakers and ratchet retired for the core (regime_gate.py: lower Sharpe in both halves); options only for CONFIRMED setups, Kelly on
  current equity, never funded by selling VOO; a mid-session stop check for non-C1 options; a "who loses from today's driver?" line in every brief and
  thesis; an owner alert below $1,000.
* 2026-11-07 (owner's new mandate): the objective is to make money, with no date or amount target; the cap is the money in the agent account, with no
  transfers; no daily fill cap; instrument choice delegated to Claude; the Anthropic guardrail is evidence-based (public information only, disclosed); a
  rule-evolution process is added (RULES.md). The goal-budget bet is retired. Strategy research started for the Sunday 11/8 review.
* 2026-11-06 (Run B): no proposals for Monday; CSCO C1 conditional for 11/13; second-bet odds handed to the Sunday review.
* 2026-11-05: the goal call was stopped out (-$533); no second bet on Friday (conditional EV 0.75-0.80 per $ after -4% days); decided Sunday.
* 2026-11-04: the goal-budget call was bought (SPY 12/04 780C at 6.79 real; GTC at 9.62; stop 3.39). O016 (QCOM C1; a 4.40 cap; equity >= $2,200 closes both) is conditional for 11/5. The C1 size
  gate uses the 15-DTE Kelly table when it is lower than sizing.py's 25-DTE figure.
* 2026-11-03 (Run B): O013 (the goal-budget SPY call) queued for the Wed 11/4 14:43 check; no macro or tape veto; no C1 on AMD.
* 2026-11-02 (evening, owner's autonomy grant): Claude decides the goal budget, which is one SPY call with a -50% stop, entered Wed 11/4 under a pre-registered rule.
* 2026-11-02 (Run B): no proposals for 11/3; QCOM C1 conditional for 11/5; O012 cancelled without owner approval.
* 2026-11-01 (Sunday re-plan): no rule-passing trade this week; the C1 watch (QCOM); the owner-only goal budget O012 framed with full odds; C1 expiry at least 14 days.
* 2026-11-01 (W44 review): C1 rule final (no market gates; the VIX split shows no effect); a Kelly sizing method (sizing.py, plan at half-Kelly); the shadow book no longer marks unfired ideas.
* 2026-10-30 (alternative-data review, owner's ask): no free alt-data signal passes; short volume, attention and put/call are retired as arguments; prediction-market odds are adopted as a macro input.
* 2026-10-30 (owner, 2026-10-30: "Remove caps on place a buy. You have 2 k to work with"): no cash floor, no single-order cap, no pacing caps; the loss limit is the full $2,000. Kept: 4 fills a day, 4 positions, evidence rules, kill switch.
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
