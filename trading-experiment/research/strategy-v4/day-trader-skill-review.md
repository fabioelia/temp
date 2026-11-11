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

## The claim checked first: the PDT rule

The README says FINRA removed the $25,000 pattern-day-trader minimum: Regulatory Notice 26-10, effective June 4, 2026, with firms allowed to phase in until October 20, 2027.

- **Verified, in part.** A search returns FINRA's own notice page, titled "FINRA Adopts New Intraday Margin Standards to Replace the Day Trading Margin Requirements". Its excerpt says the new standards replace "in their entirety" the day-trading margin rules, including the day-trade count and the $25,000 minimum. The search also gives SEC approval on April 14, 2026 (Release 34-105226) and the notice date of April 20.
- **Not read in full.** finra.org and federalregister.gov are blocked from this session, so I could not read the notice text itself.
- **What matters for us.** It is Robinhood's status, not FINRA's. The phase-in lets a firm keep the old day-trade-count rules until October 2027, and nothing in our account record says which regime applies. Our same-day round-trip guard stays.
- **Already queued.** The "PDT allowance" proposal on the 11/15 Sunday list can now weigh one emergency same-day exit per 5 sessions. That stays inside the old 3-in-5 limit with room to spare.

## Adopted (landed today, with tests)

1. **Exits keep the later cutoff and skip the fill cap** (from trader-risk: "Getting out must always be possible").
   - The gate used to give a sell the 15:58 flatten cutoff only after the loss limit tripped. Every other sell stopped at 15:50, the buy cutoff, and sells counted against the daily fill cap.
   - Now any sell of something we hold keeps 15:58 and skips the cap.
   - These stay, and they do apply to sells:
     - the decision-flow confirmation (written reasons before any order);
     - no shorting;
     - the same-day round-trip guard (account protection, see PDT above);
     - the resting-GTC guard (it prevents selling the same contracts twice).
   - Tested in `test_exits_keep_the_flatten_cutoff_and_skip_the_fill_cap`.
2. **A fill must match its ticket** (adapted from trader-risk's fingerprint of each approved order).
   - `live.py record` used to accept any quantity and price for a ticket. A typo, or an order placed differently from the one approved, went straight into the real-money ledger.
   - Now it refuses three cases:
     - a quantity above the ticket's;
     - an option buy costing more than the approved premium (to the cent: qty × limit × 100);
     - a dollar-sized stock buy more than 0.5% over its approved dollars.
   - A genuine broker mismatch is still recorded with `--accept-mismatch "<why>"`, because the ledger follows the broker. The reason goes into the note, and the run must log it in the journal.
   - Tested in `test_a_fill_must_match_its_ticket` and `test_an_option_fill_above_its_limit_or_quantity_is_refused`.
3. **Two lines in every option thesis** (from the Time Machine's verdict, corrected by R1 below).
   - State the break-even probability next to the estimated one.
   - State the drift-matched baseline: what holding the underlying for the same days would have earned.
   - A setup that "beats break-even" only by riding the index's drift is the core's job, not an option's.
4. **"Moving with no headline" is said out loud** (from trader-news). The nightly mechanical check names any held or probed ticker that moved 3% or more from the prior close without a matching headline or filing. On 11/4 the divergence came before the story; a move without a story is a lead.

## Tested and rejected

**R1: a reward:risk minimum adds no edge.** It was pre-registered in `claims.md` before any result. The script is `scripts/r1_reward_risk.py` and the output is `r1-reward-risk.txt`.

- **The test.** SPY, 1993-2026, both halves. A stop at -2% or -4% and a target at R times that, for R = 1, 2 and 3, net of 10 bps.
- **Why it ran twice.** The first run was degenerate. Re-entering at every exit tiles every session, so the excess is the fee by construction. That was recorded and the test amended before the second run.
- **Result: REJECTED.**
  - A wider target never raised the return. The excess over the drift fell with R, from about -13 to -19 bps at R = 1 to about -45 to -53 bps at R = 3.
  - No t-stat reached 2 in either direction.
  - The target-first share beat 1/(1+R) by 7 to 26 points everywhere, but SPY's upward drift accounts for all of it, and buy-and-hold already earns that drift.
- **What this means for the Time Machine.** Its "leans toward the target" grade on an upward-drifting stock is mostly the drift. The right baseline is holding the stock, not 1/(1+R).
- **The lesson for us.** A stop and target choose when we exit; they do not create an edge. We keep no minimum reward:risk rule.

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

## What stays the same

No orders changed. O020 and O021 (the PR1 gold probe) go through the gate at the 11/12 Run A as planned. The CSCO C1 proposal follows at the 11/12 Run B.
