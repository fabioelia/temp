# Routine: two runs per trading day, one on Sunday

Rules of the game live in `RULES.md`; read that first. All state lives in this repo, so every run must end with a commit and a push (the container is ephemeral).
Branch: `claude/eloquent-allen-jqzfk2` (never open a PR, never push elsewhere). Edit this file to change how the experiment runs.

**The principle: nothing is locked in.** An order queued on one run is only a *proposal*. It fills at a close only if it was re-confirmed ON THAT DAY, before the 15:50 ET
closing-order cutoff, by Run A, after re-checking that it is still the best use of the money. Every run re-evaluates every position and every proposal from scratch with the
newest information. Automatic stop-loss exits are the one exception: they fire without confirmation, though Run A may cancel one with a written reason.

| Run | When (ET) | Job |
|---|---|---|
| **A. Pre-close decision** | weekdays 14:43 | Re-evaluate everything, confirm/cancel/add orders that will fill at TODAY's close |
| **B. Post-close** | weekdays 17:13 | Book the day, verify closes, research, write the next session's *proposals*, journal, dashboard |
| **C. Sunday review** | Sunday 18:22 | Weekly post-mortem with all six personas, re-plan, write Monday's proposals |

## Orient (every run, 2 minutes)
```bash
git fetch origin claude/eloquent-allen-jqzfk2 && git checkout claude/eloquent-allen-jqzfk2 && git pull origin claude/eloquent-allen-jqzfk2
TZ=America/New_York date              # today's ET date and time; D = today's ET date
python3 trading-experiment/tracker.py status
python3 trading-experiment/tracker.py order list --status pending
python3 trading-experiment/quotes.py check        # READY means two independent providers answered
```
Read `RULES.md`, `playbook.md`, the last entries of `journal.md`. Weekend or NYSE holiday: Runs A and B do nothing (say so in one line). After `end_date` in `config.json`: write the
**final report** (last section) and disable the schedule.

---

## Run A: pre-close decision (weekdays ~14:43 ET; hard deadline 15:50 ET)

Goal: decide, with the freshest information available, what fills at today's close. The tracker refuses confirmations after 15:50 ET, so if the run is late, the safe default
happens: nothing new fills.

1. **Refresh the picture (fast).**
   * Feed READY: `python3 trading-experiment/quotes.py get TICKER ...` for every held ticker, every pending proposal, and the benchmark; compare live prices with each proposal's
     `--max-price`, each position's stop and target.
   * Feed not READY: WebSearch for the last hours' news on the same tickers and the swing factors (oil/Hormuz headlines, rates, AI-credit stress, index direction today). Treat any
     intraday price from search as unverified color, never as an execution price.
2. **Re-evaluate each position.** Hold, trim or exit? Check the stop, the target, the regime switches and time stops in `playbook.md`, and the guardrails in `RULES.md`
   (theme caps, staging caps, the 10/28 and 11/3 event caps, circuit breakers). A stop exit that auto-queued yesterday may be cancelled only with a written reason.
3. **Re-evaluate each proposal as if it were new.** Ask: *given what I know right now, is this still the best use of this money, at this size?* Compare it with the alternatives on the
   shortlist. Did the thesis change (news, oil, rates, a failed level, a flipped regime switch)? Is the price still inside its limit? Would adding it breach a cap?
4. **Act, all before 15:50 ET:**
   ```bash
   python3 trading-experiment/tracker.py order confirm O003 O004          # still the best bet: it will fill at today's close
   python3 trading-experiment/tracker.py order cancel O005 --reason "why"  # no longer the best bet
   python3 trading-experiment/tracker.py order add ... --confirm           # new idea, decided now, fills at today's close
   ```
   Anything left unconfirmed does not fill. At most 4 fills in total; doing nothing is a valid outcome. Prefer smaller steps and staging when the information is mixed.
5. **Red-team when it matters.** If today's confirmed buys total 20% or more of equity, or include a leveraged ETF, spawn one fresh `risk` agent with the order list, the portfolio
   and the guardrails (reply in at most 100 words: approve / modify / reject per order) and heed it before confirming.
6. **Journal and push.** Append a short "Pre-close" entry to `journal.md`: what changed since last evening, each order confirmed/cancelled/added and the one-line reason, the
   state of the feed. Commit and push.

## Run B: post-close (weekdays ~17:13 ET)

1. **Closing prices for D, then book the day.** Preferred path (feed READY): the tracker fetches cross-checked official closes itself; prices are never typed in.
   ```bash
   python3 trading-experiment/tracker.py day --date D --auto-prices --also CANDIDATE1,CANDIDATE2
   python3 trading-experiment/tracker.py validate
   ```
   It prices every held ticker, every pending proposal's ticker, the benchmark and the `--also` shortlist. A close is accepted only when at least two providers agree within 0.3%;
   otherwise `NO VERIFIED CLOSE`, the order skips, and the mark carries the last verified close with a stale-mark warning. Prices and spreads are saved to `data/prices/D.csv`.
   It then (a) fills the orders confirmed today by Run A at the close with slippage and fees, (b) snapshots equity versus SPY, (c) auto-queues a sell for any stop breached on the
   close, and (d) rewrites `STATUS.md` and `data/dashboard.json` and `data/export/`.

   **Fallback path (feed NOT READY):** build `data/prices/D.csv` (`ticker,close,source`) by hand from WebSearch: the official close of D, dated D, from AP / Reuters / CNBC / MarketWatch /
   Nasdaq / Yahoo / Google Finance snippets, two independent sources for any position over 25% of equity, never guessed or interpolated, unverifiable tickers left out. Pass
   `--prices-file` instead of `--auto-prices`. These fills are flagged by `validate` and counted separately; say in the journal and the user message that the feed was down
   (`QUOTES_SETUP.md` explains the fix).
2. **Research round for tomorrow.** Wave 1, in parallel, in ONE message (fresh agents, so each brief is self-contained: the goal, the rules, the portfolio from `STATUS.md`, today's
   market recap, the next five trading days' calendar, and the persona). Each writes `research/D/<name>.md` (max about 350 words, sources cited, never invent prices) and replies in at
   most 100 words with ranked ideas (ticker, reference close + source, entry, closing-basis stop, target, confidence 1-10, liquidity tier):
   `macro` (Druckenmiller/Soros school), `momentum` (Livermore, Darvas, O'Neil, Minervini), `catalyst` (event/earnings specialist). Add `contrarian` and `historian` when a regime change
   makes them useful. Then `risk` red-teams the draft proposals (approve / modify / reject, at most 120 words).
3. **Propose, do not commit.** Weigh the opinions against `playbook.md`, the goal pace and the guardrails, then queue tomorrow's ideas as proposals:
   ```bash
   python3 trading-experiment/tracker.py order add --ticker XYZ --side buy --usd 400 --tier A --stop 95.50 --target 120 --max-price 104 --priority 2 --thesis "why, catalyst, risk"
   ```
   These are non-binding. Tomorrow's Run A will re-judge them with fresh information. Use `--max-price` so a gap cannot make us chase. Every order needs a written thesis.
4. **Journal and playbook.** Append to `journal.md`: date, two-line market recap, equity versus SPY, which orders filled and why they had been confirmed, agent opinions in one line each,
   the proposals queued, one lesson. If a lesson changes how we trade, edit `playbook.md` and log it in the changelog.
5. **Publish.** `python3 trading-experiment/tracker.py report`, refresh the dashboard per `DASHBOARD.md`, then commit and push:
   `git add -A && git commit -m "Day D: equity $X (P/L +/-Y%), ..."` (end with the attribution lines), `git push -u origin claude/eloquent-allen-jqzfk2` (retry network errors: 2s, 4s, 8s, 16s).

## Run C: Sunday review (~18:22 ET)

* No `tracker.py day` (no session). Fire all six personas (macro, momentum, catalyst, contrarian, historian, risk) with the week's results and the weekend news.
* Post-mortem: which ideas worked or failed and why, which agent's calls earned their keep, fees and slippage, drawdown, how often Run A's re-check changed a proposal.
* Re-plan the week; cancel stale proposals and write Monday's proposals (created on the Sunday date). Monday's Run A makes the real decision.
* Update `playbook.md` with a dated changelog line. Do not re-trade history: the ledger is append-only; fixes go in the journal as dated notes.

## Final report (first run after `end_date`)
Write `FINAL_REPORT.md`: result against the $4,000 goal, against SPY buy-and-hold, win rate, payoff, max drawdown, fees plus slippage, how many fills used the cross-checked feed,
the best and worst decisions, and what the experiment can and cannot show about AI trading skill. Commit, push, then use `list_triggers` to find all three "AI Trading Challenge"
scheduled tasks and disable them with `update_trigger enabled=false`.

## Guardrails for the runner
* Never fabricate a price, headline or date. If data is missing, say so and skip.
* Never edit past ledger rows. Never use information from after an order's fill date when deciding it.
* A confirmation is a fresh decision, not a rubber stamp: write the reason in the journal.
* No real brokerage action of any kind. This is a simulation. If a brokerage connector is attached, use only its read-only quote tools (see `RULES.md`); never any order, transfer or account tool, and never the owner's real balances or positions.
