# Can an AI make smart trades? A paper-trading challenge

A **$2,000** account, one month (**Mon 2026-10-19 to Wed 2026-11-18**, 23 trading days): real orders in a Robinhood agent account through a capped, audited
gate (`LIVE_MODE.md`), with a paper ledger as the shadow model. The goal was to double it; since 2026-10-24 it is **$2,200 (+10%) and beating SPY buy-and-hold**.
Nothing here is financial advice.

An AI portfolio manager (Claude) runs the account. Every trading day after the close it:

1. pulls official closing prices and books the day,
2. fires a committee of research agents, each playing a different elite investor (macro strategist, momentum trader,
   event/earnings specialist, contrarian, market historian, risk officer),
3. decides which orders to queue (maximum 4 fills per day),
4. writes down its reasoning, commits everything to git, and refreshes the dashboard.

## Why you can trust the scoreboard
* **No look-ahead, nothing locked in.** Orders are only proposals. A pre-close run re-judges each one on the day it would fill and confirms it (before 15:50 ET) or drops it; confirmed orders fill at that day's close, plus slippage and fees.
* **Append-only ledger.** `data/ledger.csv` is never edited; git history timestamps every decision before its outcome exists.
* **Every fill carries a written thesis and a price source.** `tracker.py validate` re-checks all rules from the ledger.
* **A benchmark.** The same $2,000 put into SPY on day one. Beating a risk-free coin flip is not the same as beating the market.
* **Cross-checked prices.** The tracker pulls official closes itself from at least two independent providers and records them; fills priced any other way are flagged.
* **Costs are modeled**: regulatory fees, plus slippage by liquidity tier. Slippage is the big one at this scale.

## Files
| File | What it is |
|---|---|
| `RULES.md` | The rules of the game: universe, limits, fills, fees, risk guardrails |
| `STATUS.md` | Auto-generated scoreboard (equity, positions, pending orders, stats) |
| `journal.md` | Daily log: decisions, agent opinions, lessons |
| `playbook.md` | The strategy, revised as the experiment teaches it something |
| `research/<date>/` | Each agent's memo, one folder per day |
| `data/` | `ledger.csv`, `orders.csv`, `marks.csv`, `equity.csv`, `exits.json`, `dashboard.json`, `export/` |
| `tracker.py` | The rules engine and reporter (Python stdlib only) |
| `research.py` | Headlines (Google News RSS), full-text reading, RSS feeds, SEC EDGAR filings and insider trades |
| `quotes.py` | Cross-checked quote layer (Yahoo, Stooq, Finnhub, Alpaca); fails closed. Setup: `QUOTES_SETUP.md` |
| `DAILY_ROUTINE.md` | The procedure the scheduled run follows |

## Schedule
Four durable scheduled tasks wake the portfolio manager (times are New York time, so the Nov 1 clock change is handled):
* **Weekdays 9:13 AM ET (pre-open news)**: overnight and pre-market news and new SEC filings; adjusts proposals only, never trades.
* **Weekdays 2:43 PM ET (pre-close decision)**: re-evaluate every position and every proposal with fresh information; confirm, cancel or add orders for today's close.
* **Weekdays 5:13 PM ET (post-close)**: book the day, fire the research agents, write the next session's *proposals*, journal, refresh the dashboard, commit and push.
* **Sundays 6:22 PM ET**: weekly review with all six personas, post-mortem, playbook revision, re-plan Monday.
After 2026-11-18 the first run writes `FINAL_REPORT.md` and disables both tasks. The live dashboard is described in `DASHBOARD.md`.

## Honest expectations
Doubling in a month needs about **+3% per day, compounded, every day**. Strategies with a real chance of getting there also have a real
chance of losing half the account, and one month is far too small a sample to prove or disprove anything about AI skill. The scoreboard
therefore reports return, benchmark-relative return, drawdown, win rate and payoff ratio, not just the final number.

## Commands
```bash
python3 trading-experiment/tracker.py status            # print the scoreboard
python3 trading-experiment/tracker.py order list --status pending
python3 trading-experiment/tracker.py validate          # re-check the ledger against the rules
```
