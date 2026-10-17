# Daily routine (run after the US close, weekdays ~4:45 PM ET)

This file is the procedure the scheduled run follows. Edit it to change how the experiment runs.
Rules of the game live in `RULES.md`; read that first. All state lives in this repo, so every run
must end with a commit and a push (the container is ephemeral).

Branch: `claude/eloquent-allen-jqzfk2` (never open a PR, never push elsewhere).

## 0. Orient (2 min)
```bash
git fetch origin claude/eloquent-allen-jqzfk2 && git checkout claude/eloquent-allen-jqzfk2 && git pull origin claude/eloquent-allen-jqzfk2
TZ=America/New_York date              # D = today's ET date
python3 trading-experiment/tracker.py status
python3 trading-experiment/tracker.py order list --status pending
```
Read `RULES.md`, `playbook.md`, the last entry of `journal.md`, and today's `research/` folder if one exists.

* Not a trading day (weekend/holiday)? Weekdays that are holidays: stop. Sunday: do the **weekly review** (section 7). Saturday: stop.
* After `end_date` in `config.json`: do the **final report** (section 8) and stop the schedule.

## 1. Closing prices for D (the data step; be strict)
First see which feeds work from this environment today:
```bash
python3 trading-experiment/quotes.py check        # READY means two independent providers answered
```
**Preferred path (feed READY):** the tracker fetches cross-checked official closes itself. Prices are never typed in.
```bash
python3 trading-experiment/tracker.py day --date D --auto-prices --also CANDIDATE1,CANDIDATE2
```
It prices every held ticker, every ticker with a pending order, the benchmark, and any `--also` tickers (today's shortlist). A close is accepted only when at least two
providers agree within 0.3%; otherwise the ticker prints `NO VERIFIED CLOSE`, its order skips, and its mark carries the last verified close with a stale-mark warning.
Results are saved to `data/prices/D.csv` with the providers and spread for every price.

**Fallback path (feed NOT READY, e.g. the network policy blocks the quote hosts):** build `data/prices/D.csv` (`ticker,close,source`) by hand from WebSearch: the official
close of D, dated D, from AP / Reuters / CNBC / MarketWatch / Nasdaq / Yahoo / Google Finance snippets; a position larger than 25% of equity needs TWO independent sources;
never guess or interpolate; leave out anything unverifiable. Then pass `--prices-file` (instead of `--auto-prices`). These fills are flagged `WARN ... fallback source` by
`validate`, counted separately on the scoreboard, and the journal must say the feed was down and why. Say so to the user in the daily message: the experiment's credibility
depends on the feed, and `QUOTES_SETUP.md` explains how to restore it.

## 2. Book the day
```bash
python3 trading-experiment/tracker.py day --date D --auto-prices --also ...   # or --prices-file data/prices/D.csv on the fallback path
python3 trading-experiment/tracker.py validate
```
This (a) records marks, (b) fills last evening's queued orders at D's close with slippage and fees,
(c) snapshots equity vs the SPY benchmark, (d) auto-queues a sell for any stop breached on a close, and
(e) rewrites `STATUS.md` and `data/dashboard.json`. Read its output carefully: skipped orders and stop/target alerts matter.

## 3. Research round (fire the agents)
Wave 1, in parallel, in ONE message (fresh agents, so the brief must be self-contained: goal, rules, the portfolio from STATUS.md,
D's market recap, the next 5 trading days' calendar, and each agent's persona). Each writes `research/D/<name>.md` (max ~350 words,
cite sources, never invent prices) and replies in at most 100 words with ranked ideas (ticker, reference close + source, entry,
closing-basis stop, target, confidence 1-10, liquidity tier):
1. `macro` - macro/regime strategist (Druckenmiller/Soros school): rates, oil, dollar, Fed, election, what changed today.
2. `momentum` - trend/momentum trader (Livermore, Darvas, O'Neil, Minervini): leaders, breakouts, relative strength, what to cut.
3. `catalyst` - event/earnings specialist: catalysts in the next 1-5 days, what to hold through, what to avoid holding through.

Wave 2 after you draft orders: `risk` - the chief risk officer red-teams the draft orders and the portfolio (correlation, sizing,
fees/slippage, stop distance, ruin risk) and returns approve / modify / reject per order in at most 120 words.

Add the contrarian and historian personas on the weekly review, or when a regime change makes them useful.

## 4. Decide (you are the CIO)
Weigh the agents' opinions against `playbook.md`, the goal pace, and the risk limits in `RULES.md`. Doing nothing is a legal and
often correct trade; the 4-fill cap is a ceiling, not a target. Remember fills happen at the NEXT close, so choose entries that
make sense without intraday precision, and use `--max-price` so a gap does not make you chase.

```bash
python3 trading-experiment/tracker.py order add --ticker XYZ --side buy --usd 400 --tier A \
   --stop 95.50 --target 120 --max-price 104 --priority 2 --thesis "why, catalyst, risk"
```
Queue no more than 4 orders that could fill. Sells are processed first. Every order needs a written thesis.

## 5. Journal and playbook
Append to `journal.md` (newest at the bottom): date, market recap in two lines, equity vs SPY, agent opinions in one line each,
orders queued and why, the result of yesterday's orders, one lesson. If a lesson changes how you trade, edit `playbook.md`
and say so in the journal.

## 6. Publish
```bash
python3 trading-experiment/tracker.py report
git add -A && git commit -m "Day D: equity $X (P/L +/-Y%), orders queued: ..."   # end with the attribution lines
git push -u origin claude/eloquent-allen-jqzfk2     # retry on network errors: 2s, 4s, 8s, 16s
```
Then refresh the dashboard Artifact with `data/dashboard.json` (see `DASHBOARD.md`).

## 7. Weekly review (Sunday ~6 PM ET)
* Fire all six personas (macro, momentum, catalyst, contrarian, historian, risk) with the week's results.
* Post-mortem: which ideas worked or failed and why; which agent's calls added value; fees and slippage paid; drawdown.
* Re-plan the week ahead; queue Monday's orders (created on the Sunday date); update `playbook.md`.
* Do not re-trade history. The ledger is append-only; fixes go in the journal as dated notes.

## 8. Final report (first run after `end_date`)
Write `FINAL_REPORT.md`: result vs the $4,000 goal, vs SPY buy-and-hold, win rate, payoff, max drawdown, fees + slippage, the best
and worst decisions, what the experiment can and cannot show about AI trading skill. Commit, push, then disable the scheduled task.

## Guardrails for the runner
* Never fabricate a price, headline, or date. If data is missing, say so and skip.
* Never edit past ledger rows. Never queue an order using information from after its fill date.
* No real brokerage action of any kind. This is a simulation.
