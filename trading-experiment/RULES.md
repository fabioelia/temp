# Rules of the game

Nothing here is financial advice.

**Real money through live mode, with the paper ledger as the shadow model.** (Mandate and rule-evolution process: next section.) Live mode has been ENABLED since 2026-10-18 (`LIVE_MODE.md`). The owner authorized real
orders for up to $2,000; the loss limit is the full $2,000 since 2026-10-30 (it was $500, then $1,000). Every real order must pass `live.py gate` (confirmed by the
pre-close run, capped, ticketed, never duplicated). Outside the gate, a brokerage connector may be used only for read-only quotes and the experiment's own positions.
Never deposits, withdrawals, transfers or account changes; never selling options to open, multi-leg options or exercise (buying calls/puts is the strategy, below);
never crypto, margin or shorting; never the owner's other holdings. A `KILL_SWITCH` file stops everything until the owner removes it; the agent must never remove it.
(Header corrected 2026-11-07: it still said "simulation only" and a $1,000 loss limit. A one-page summary of every rule in force is the dashboard's
"The rules in force" section, from `data/export/rules.json`.)

## Owner's mandate (2026-11-07) and how the rules evolve
The owner, 2026-11-07: "Forget about the date target + target amount. Instead just focus on making money instead." "At most is the money on the mcp account
and no transfers. Ignore fills limit for the day you can do more if needed." "2k budget the rest defined on there is up to u." On the Anthropic guardrail:
"Absolutely research and if the data recommends moving on these do it." On options-only: "you need to figure out the best option for our targets."
"I really want you to evolve the rules as we learn and get better and discover new strategies."
* **Objective:** make money. Grow the agent account with a positive expected return and controlled drawdowns. There is no date or amount target and no end
  date; SPY buy-and-hold stays as the yardstick the results are reported against, not a target.
* **The owner's limits (fixed):** at most the money in the MCP agent account (the original $2,000, now its balance); no transfers in or out; no margin borrowing;
  the agent account only; the kill switch. Everything else in this file is Claude's rulebook and changes as the evidence does.
* **How a rule changes (the rule-evolution process):**
  1. A proposal names the rule, the change and the evidence: a committed script or a cited study, tested on data before the decision. Losses and wins
     from our own trades count as evidence only with their sample size stated.
  2. A fresh risk red-team reviews it.
  3. It is adopted at the Sunday review (or sooner if a rule is causing harm now), with a dated changelog line in `playbook.md` and the journal.
  4. The dashboard's "The rules in force" list (`data/export/rules.json`) is updated in the same run.
  A rule that keeps failing its own test is retired the same way.

## Account and goal
* Start: **$2,000 cash**, Robinhood-style retail account. No margin, no shorting, no crypto, no OTC. Options only as the strategy below allows (buy to open, sell to close; owner's choice 2026-10-17).
* Window: first fills **Mon 2026-10-19** (close). **No end date since 2026-11-07** (it was the 11/18 close).
* Objective since 2026-11-07: **make money** (see the mandate above). Retired: the $2,200 (+10%) goal by 11/18 and the "beat SPY" target (owner, 2026-10-24,
  had set them; before that $4,000, +100%). SPY buy-and-hold remains the reported yardstick.
* Primary scoreboard: equity at the final close. Secondary (reported daily): return vs SPY buy-and-hold with the same $2,000,
  max drawdown, win rate, payoff ratio, fees plus slippage paid. One month cannot prove skill either way (see `research/2026-10-17/risk.md`);
  the secondary numbers are there to keep the result honest.

## Strategy and universe (owner, 2026-10-17: "Options with the $500 budget"; 2026-10-18: "Update the 500 budget to 1k instead"; 2026-10-30: "Remove caps on place a buy. You have 2 k to work with")
* **Instrument choice is Claude's since 2026-11-07** (owner: "you need to figure out the best option for our targets"). The account allows stocks and ETFs
  (fractional), long options, and at options Level 2 covered calls and cash-secured puts; spreads need Level 3, which only the owner can request. Until the
  strategy research adopts a change through the process above, the rules below (options buying only) stay in force.
* **Adopted 2026-11-08 (rule-evolution vote; strategy v2):** an **index core** of about 80% of equity in VOO (S&P 500) and about 20% in SGOV (T-bills),
  bought as a lump sum, held without stops or timing rules. This is a **stated exception** to "only CONFIRMED claims trade": S1 came back WEAK (7 of 8
  cells pass; the miss is t 1.98, a power issue), and the cited literature (Dimson-Marsh-Staunton; Vanguard 2012 on lump sum vs staging) supports a
  positive mean. Expect about +$100 a year on the account, not a monthly gain; a 2008 replay would cost about $610 on the core (about $890 if the reserve
  were also lost). That is the worst case in the sample, not the worst possible.
* **Options:** long calls or puts only for CONFIRMED setups (C1 today), sized by Kelly on current equity (about $235 at most now), funded from the SGOV
  reserve, never by selling VOO. No bet with EV below 1 unless the owner names a budget for it. Selling options to open stays off (P1 REJECTED, P2 WEAK
  and not adopted). The option rules below still apply to any option trade. Never sell an option to open, never multi-leg, never
  exercise; close every option at least one session before it expires (the tracker auto-queues this). Stock and ETF buys are on since 2026-11-08 for the index core only (`strategy.allow_stock_buys`; VOO and SGOV).
* **The whole $2,000 is the budget (since 2026-10-30, owner).** There is no cash floor and no single-order cap any more: premium may use any cash on hand, up to
  the $2,000 capital cap. Every open option can still expire worthless, so **the whole $2,000 can be lost**. (Before: premium came only from cash above a $1,000
  floor; from 10/24 a single order was capped at $450, with a $1,700 pause line. All removed by the owner's instruction.)
* Sizing is a judgment written into each order's thesis: the evidence for the setup, the size, and what a total loss would leave.
* Whole contracts only (1 contract = 100 shares). A ticker needs a quote at decision time; options fill at the bid/ask stamped when the order is confirmed (Cboe delayed chain in paper,
  the broker's live quote with a limit order in live mode). Option marks are single-source (Cboe), flagged as such.

## Taxes (US; a memo for the owner, not tax advice)
* Every trade here is held for days or weeks, so every gain is **short-term**: taxed as ordinary income at the owner's marginal rate plus state tax. `config.json`
  `tax_rate_memo` (24% now) drives the estimate in `STATUS.md`; set it to the owner's real combined rate when known. Net losses offset other capital gains, then up to
  $3,000 a year of ordinary income, and the rest carries forward. Robinhood's 1099-B for the agent account is the official record; `data/live_ledger.csv` is the backup.
* **Wash sales.** A loss is disallowed (deferred into the replacement's cost) when the same or a substantially identical security is bought within 30 days before or
  after the losing sale, **in any of the owner's accounts, IRAs included** (an IRA purchase makes the loss permanent). Options on one underlying at nearby strikes may
  count as substantially identical, and buying calls within 30 days of a losing sale of the shares counts. `tracker.py report` and `live.py status` flag possible cases.
  Within the experiment a flag only shifts timing: every position closes by 11/18, so a deferred loss is released inside 2026 unless a replacement is bought after the
  last exit, before 12/18. The owner's main account and IRAs are never read here, so the owner checks that side (see `LIVE_MODE.md`).
* **No same-day round trips** (enforced by the gate) keeps the account clear of the pattern-day-trader rule.
* Section 1256 index options (SPX, XSP) would be taxed 60% long-term / 40% short-term, which saves roughly $20-40 per $400 of gain (24-37% brackets). Checked
  2026-10-19: XSP 11/20 calls quote 1-2% spreads, as tight as SPY's, but open interest is only 16-304 per strike (the liquidity filter wants 1,000), and the quote, ledger
  and gate code handle stock/ETF options only (index roots, cash settlement). So the experiment keeps SPY/ETF/stock options for now; revisit for a large index shot
  (code support, tests and a Robinhood order review for any index-option fee first).

## Execution protocol (no look-ahead, nothing locked in)
1. Orders queued by the evening and Sunday runs are **proposals**. They are not binding and fill nothing by themselves (`tracker.py order add ...`, each with a written thesis).
2. A pre-close run on the fill day re-evaluates every position and every proposal with the newest information, then **confirms** (`order confirm`), cancels, or adds a new order
   with `order add --confirm`. The tracker only accepts a confirmation on a trading day **before 15:50 ET** (the NYSE closing-order cutoff). An order that is not confirmed that
   day does not fill (it is skipped with that reason).
3. Confirmed orders **fill at that day's official close** (market-on-close style) plus slippage, sells first, then by priority. The decision therefore uses information up to
   about 15:00-15:50 ET, never the close itself.
4. A buy may carry `--max-price` (skipped if the close is above it, so a gap cannot make the committee chase). A stop or target is judged on **closing prices only**; a stop
   breach on the close of day D auto-queues a sell-all that fills at the close of D+1 without needing confirmation. A run may cancel it, but only with a written reason.
5. A proposal is valid for the next session only unless `--gtd` extends it.

## Trade limits (enforced in code)
* **No daily fill cap since 2026-11-07** (owner: "Ignore fills limit for the day you can do more if needed"; it was 4 a day).
* **Pattern-day-trader guard:** the agent account is *limited margin* with under $25,000, so more than 3 day trades in 5 business days would restrict it for
  90 days. The code still refuses same-day round trips; a change to allow up to 3 per 5 sessions for risk exits goes through the process above.
* **No same-day round trips and no second fill in the same ticker on one day.**
* No shorting (a sell is capped at shares held), cash can never go negative.
* Sale proceeds may fund a buy at the same close (Robinhood Instant behaviour). The no-round-trip rule keeps this clear of good-faith violations
  (T+1 settlement). The account is limited margin, so the PDT rule does apply (see above).
* Trading days are real NYSE sessions only.

## Costs (all modeled; fills are charged both)
| Item | Value | Note |
|---|---|---|
| Commission | $0 | Robinhood equities/ETFs |
| SEC Sec. 31 fee | $20.60 per $1M sold | Effective 2026-04-04; waived on sales of $500 or less; rounded up to the cent |
| FINRA TAF | $0.000195 per share sold, max $9.79 | Waived on sales of 50 shares or less |
| CAT fee | ~$0.000001 per share | Immaterial; Robinhood reports it stopped passing CAT through |
| **Slippage** | Tier A 5 bps (mega-cap/liquid ETF), B 15 bps (mid-cap), C 30 bps (small/volatile), D 60 bps (stressed/illiquid) | Buys fill above the close, sells below it. **This is the real cost.** |
| Options | $0.05 per contract each way (regulatory/clearing, conservative) + SEC fee on sales; fills at the ask (buy) / bid (sell), so the spread is paid in full | Tier `O` |
| Memo: tax | 24% federal on gains | Shown as an after-tax memo line, not deducted from equity |

Fee numbers come from search extracts of the Robinhood fee page and SEC/FINRA notices (see the risk memo). Regulatory fees are cents per trade at this size.

## Risk guardrails (CIO policy for this experiment)
The committee's own Monte Carlo says 2x is a 0-5% event and that the aggressive routes carry a 2-14% chance of losing half. The policy is therefore *bounded
convexity*: take the asymmetric shots, but cap the damage.
* **Under the options strategy (owner's choice 2026-10-17; caps removed 2026-10-30):** an option's worst case is its premium. The stock-era limits below on risk
  per position, the regime gate, staging, event exposure, the -15%/-25% drawdown breakers and the ratchet do not apply to option premium.
  - **Removed 2026-10-30 (owner):** the $1,000 floor and loss limit, the 22.5% ($450) single-order cap, and the playbook's buy caps ($250-400 shots, the $1,700
    pause line, the near-goal house-money rule).
  - **Still in force:** the money in the agent account as the cap (no transfers), no same-day round trips (PDT guard), at most 4 positions, never average down, the evidence rules and gates in
    `playbook.md`, the kill switch and the gate tickets.
  - The live loss-limit stop is set to the full $2,000, so it trips only if everything is lost. The owner can stop everything at any time with `KILL_SWITCH`.
* **Exposure:** gross invested <= 100% of equity; a 3x ETF counts at 3x notional against the AI/semis theme cap.
* **Concentration:** max 4 positions (VOO and SGOV count), no single name above 30% of equity at entry. (Clarified 11/04, after the goal-budget call was bought at 35% of equity:
  for option premium, only the "Still in force" list above applies, which keeps the 4-position limit. The 30% single-name line is a stock-era limit and
  was superseded by the owner's 10/30 removal of the single-order cap. The gate's `max_single_order_pct` is 1.0. The ambiguity is logged in the journal.) **Theme caps (cost basis, incl. leverage): AI/semis <= 40%, energy <= 40%.**
* **Risk per position to its closing stop:** <= 2% of equity core, <= 3% satellite (assume the realised loss is 1.5x planned, 2x for 3x ETFs).
* **Regime gate (RETIRED 2026-11-08 for the index core):** it was: while the S&P 500 is below its prior 10-day closing high *and* VIX >= 20, keep invested
  <= 50%. Tested (`research/strategy-v2/scripts/regime_gate.py`): it lowered the Sharpe in both halves (0.18 vs 0.29 before 2010; 0.67 vs 0.76 since) while
  shrinking drawdowns (-40% vs -55%). It failed the S2 bar.
* **Staging (RETIRED 2026-11-08):** a lump sum beat staged entry about two-thirds of the time (Vanguard 2012); the core is bought in one order.
* **Events:** <= 10% of equity in any one stock through its own earnings; <= 50% invested at the 10/28 close (FOMC); <= 35% at the 11/3 close (midterms).
* **Leveraged ETFs:** <= 15% of equity each, never averaged down, exit after 8 sessions without +5% progress.
* **Circuit breakers and the ratchet (RETIRED 2026-11-08 for the index core):** untested timing rules of the kind that failed S2 and the regime-gate test.
  In their place: **alert the owner if equity falls below $1,000** (config `owner_alert_equity_usd`). The live loss stop is set at -$2,000, so it trips only
  at $0; the kill switch is the owner's.
* **Pyramiding:** add only to winners (up 3-5%, new closing high), then move the whole stop to breakeven. Never average down.
* **Trade budget:** the cap of 4 fills a day is a ceiling. Aim for <= 2 per day on average, weekly turnover <= 150%, and keep a slot free for stop exits.
* Doing nothing is a valid trade.

## Integrity rules
* Every order carries a written thesis; every fill carries a price source. `tracker.py validate` rechecks the ledger.
* The ledger, marks and journal are append-only. Corrections are dated notes in `journal.md`, never edits to past rows.
* **Quote integrity.** Prices come from `quotes.py`, which accepts a price only when at least two independent providers agree within 0.3% and records which providers and
  the spread. The tracker fetches them itself (`day --auto-prices`); the AI never types a price in. If the feed is unavailable, the fallback is cited web-search closes
  (two independent sources for any position over 25% of equity); fills priced that way are flagged on the scoreboard and by `validate`. If a close cannot be verified
  at all, the ticker is skipped (its order does not fill) and the mark carries the last verified close with a stale-mark warning.
* Never use information from after an order's fill date when queuing it. Git history timestamps each decision before its outcome.
* The committee may break a soft guardrail only with a dated journal entry that says which rule and why.
