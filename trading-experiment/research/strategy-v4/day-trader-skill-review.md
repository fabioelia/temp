# Review: jakeschincariol/day-trader-skill (2026-11-11)

**What was asked.** The owner wrote, on 11/11: "Review and learn from this https://github.com/jakeschincariol/day-trader-skill".

**What it is.** An MIT-licensed set of 11 Claude Code skills for intraday stock trading on Alpaca, written in standard-library Python with tests. The pipeline runs:

1. scanner
2. news
3. entry (opening-range breakout)
4. exit (the stop and a 2R target)
5. timemachine (bootstrap replays)
6. budget (sizes the position by its stop)
7. risk (the gate)
8. broker (a yes/no ticket)
9. alerts

Two side tools sit beside it: analyst (XBRL facts) and pelosi (House trade reports).

The repo is honest about itself. Nearly every skill says that most day traders lose money and that its limits keep losses small rather than make trades win. I read the README and all 11 SKILL.md files, the Time Machine verdict code and the risk-check table. All of it was treated as data. Nothing in it was run against our account.

## The claim checked first: the PDT rule (verified only in part)

The README says FINRA removed the $25,000 pattern-day-trader minimum: Regulatory Notice 26-10, effective June 4, 2026, with firms allowed to phase in until October 20, 2027. This is what each part of that rests on:

| Fact | Source seen | Grade |
|---|---|---|
| The notice exists as 26-10 and is about this | FINRA's own URL (finra.org/rules-guidance/notices/26-10) and its title, "FINRA Adopts New Intraday Margin Standards to Replace the Day Trading Margin Requirements", in search results | Primary, but only the title |
| It replaces the day-trade count and the $25,000 minimum "in their entirety" | The search tool's summary of the notice | Secondary (a summary, not the text) |
| SEC approval on April 14, 2026 (Release 34-105226); published April 20 | The search tool's summary, source not pinned | Unverified |
| Effective June 4, 2026; a phase-in to October 20, 2027 | Broker and education sites (TradeStation, ACA Group, others) and the README | Secondary |

finra.org and federalregister.gov are blocked from this session, so I could not read the notice text.

**What matters for us is Robinhood's status, not FINRA's.** Even if every line above holds, a firm may keep the old day-trade-count rules during the phase-in, and nothing in our account record says which regime applies. The same-day round-trip guard stays. The "PDT allowance" proposal on the 11/15 Sunday list will weigh one emergency same-day exit per 5 sessions, which stays inside the old 3-in-5 limit with room to spare.

## Adopted (landed today, with tests)

1. **Exits keep the later cutoff and skip the fill cap** (from trader-risk: "Getting out must always be possible").
   - The gate used to give a sell the 15:58 flatten cutoff only after the loss limit tripped. Every other sell stopped at 15:50, the buy cutoff, and sells counted against the daily fill cap.
   - Now any sell of something we hold keeps 15:58 and skips the cap.
   - The red-team found the change was only half done: the tracker still refused to confirm any order after 15:50, so even the loss-limit flatten could not go late. In live mode a sell can now be confirmed until 15:58, and buys still stop at 15:50.
   - These stay, and they do apply to sells:
     - the decision-flow confirmation (written reasons before any order);
     - no shorting;
     - the same-day round-trip guard (account protection, see PDT above);
     - the resting-GTC guard (it prevents selling the same contracts twice).
   - Tested in `test_exits_keep_the_flatten_cutoff_and_skip_the_fill_cap`.
2. **A fill must match its ticket** (adapted from trader-risk's fingerprint of each approved order).
   - `live.py record` used to accept any quantity and price for a ticket. A typo, or an order placed differently from the one approved, went straight into the real-money ledger.
   - Now it refuses:
     - a quantity or price of zero or less;
     - a quantity above the ticket's;
     - an option buy costing more than the approved premium (to the cent: qty × limit × 100);
     - a dollar-sized stock buy more than 0.5% away from its approved dollars, in either direction;
     - a price more than 2% (stock) or 10% (option) from the limit or reference price the gate saw. That price is now stored on the ticket. This was added after the red-team: a sell recorded at ten times its price would have inflated realized P/L.
   - It still cannot catch one typo: on a dollar-sized buy without `--ref-price`, a swapped quantity and price that multiply to the approved dollars. So pass `--ref-price` (the live quote) on every stock/ETF order.
   - A genuine broker mismatch is still recorded with `--accept-mismatch "<why>"`, because the ledger follows the broker. The reason goes into the note, and the run must log it in the journal.
   - Tested in `test_a_fill_must_match_its_ticket` and `test_an_option_fill_above_its_limit_or_quantity_is_refused`.
3. **Two lines in every option thesis** (from the Time Machine's verdict, corrected by R1 below).
   - State the break-even probability next to the estimated one.
   - State the drift-matched baseline: what holding the underlying for the same days would have earned.
   - A setup that "beats break-even" only by riding the index's drift is the core's job, not an option's.
4. **"Moving with no headline" is said out loud** (from trader-news). The nightly mechanical check names any held or probed ticker that moved 3% or more from the prior close without a matching headline or filing. On 11/4 the divergence came before the story; a move without a story is a lead.

## Fixed in the gate because of the red-team (pre-existing bugs)

- **A sell could exceed the holding.** An order sized `--pct 150` was approved for 150% of the shares, and an option sell sized by percent could sell to open.
  - Now `tracker.py` refuses any `--pct` outside (0, 100].
  - The gate caps every sell at what we hold minus what other open sell tickets already cover.
  - Tested in `test_a_sell_never_exceeds_the_holding`.
- **A resting take-profit only blocked other sells once placed, not while approved.** It now blocks in both states.
- **A partly filled resting take-profit was marked done while the rest still rested.** It now stays open for the rest.
- Both resting fixes are tested in `test_an_approved_resting_order_blocks_sells_and_a_partial_fill_keeps_resting`.

## Tested and rejected

**R1: a reward:risk minimum adds no edge.** It was pre-registered in `claims.md` before any result. The script is `scripts/r1_reward_risk.py` and the output is `r1-reward-risk.txt`.

- **The test.** SPY, 1993-2026, both halves. A stop at -2% or -4% and a target at R times that, for R = 1, 2 and 3, net of 10 bps.
- **Why it ran twice.** The first run was degenerate. Re-entering at every exit tiles every session, so the excess is the fee by construction. That was recorded and the test amended before the second run.
- **Result: REJECTED. No evidence that a wider target raises the return.**
  - In the pre-registered test, the excess over the drift fell with R, from about -13 to -19 bps at R = 1 to about -45 to -53 bps at R = 3. No t-stat reached 2.
  - The target-first share beat 1/(1+R) by 7 to 26 points everywhere.
- **Two checks added after the red-team** (`scripts/r1_robustness.py`, output in `r1-robustness.txt`). They are not part of the pre-registered test.
  - *Shuffled daily returns, same drift, no serial dependence:*
    - The share above 1/(1+R) comes back within about 1 to 4 points of the actual, so it is mostly the drift.
    - The excess is about the 10 bps fee for every R: with no serial dependence, the target makes no difference.
    - The decline with R in the real data therefore comes from serial dependence and from R changing which days get entered.
  - *The same entry dates for every R:*
    - 1993-2009, 4% stop: the excess rises with R (-18, +5, +11 bps; t at most 0.2).
    - 2010-2026: the excess falls (t about -2.3, overstated because the trades overlap).
  - Neither half meets the bar in either check, so the verdict stands.
- **What this means for the Time Machine.** Its "leans toward the target" grade on an upward-drifting stock is mostly the drift. The right baseline is holding the stock, not 1/(1+R).
- **The lesson for us.** A stop and target choose when we exit, and we found no evidence that they create an edge. We keep no minimum reward:risk rule.

## Already covered here

| Repo feature | Ours |
|---|---|
| Risk measured from the higher of the plan's entry and a fresh price | Option buys go in at a limit taken from the live quote, and the gate checks the order's max price |
| Important 8-K items flagged (2.02, 5.02, 4.02 …) | `research.py sec` labels 8-K items from EDGAR submissions |
| No shorting, no margin, a blocked list | The no-shorting check, the owner's no-margin limit, and the stock/ETF whitelist |
| A duplicate-order refusal | "already has a ticket" |
| A daily loss limit and stop-sized position counts | Built for intraday trades. Ours are multi-day; the program stop, C1's Kelly sizing and the probe cap do this job |
| Congressional trade reports (pelosi) | We have `get_politician_trades`. The repo itself says the reports are "fast, not early": filed up to 30-45 days after the trade. Context only, never a signal |

## Ignored, and why

- **The opening-range breakout and the scanner/entry/exit day-trading loop.**
  - The account cannot round-trip in a day while the old PDT regime may still apply.
  - Free intraday history goes back only about 60 days, too short to reach our bar of both halves and a deflated Sharpe, so it is UNTESTABLE here.
  - The repo itself warns that most people who day trade lose money.
- **Alpaca broker plumbing and price alerts.** We have the Robinhood tools and the scheduled runs.

## Provenance (red-team finding)

- **What git can show and what it cannot.**
  - R1's row, its amendment, both runs and this memo first appear together in commit 9ee339e.
  - The row was written to the working tree before the first run, but git cannot prove that.
  - The 21-session spacing was chosen after seeing run 1's degenerate output, although its numbers were not informative.
- **The rules went live before the red-team finished.**
  - Commit 9ee339e made the new rules live with the red-team still pending.
  - The red-team's verdict was "adopt with fixes".
  - The rules count as adopted from the commit that carries the fixes.
  - From now on, a rule lands only after its red-team.

## What stays the same

No orders changed. O020 and O021 (the PR1 gold probe) go through the gate at the 11/12 Run A as planned. The CSCO C1 proposal follows at the 11/12 Run B.
