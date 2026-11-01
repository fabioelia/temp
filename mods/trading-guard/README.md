# trading-guard

A Claude Code mod that enforces the AI trading experiment's live-mode rules (`trading-experiment/RULES.md`, `LIVE_MODE.md`) inside the harness, so a rule holds even when a run forgets it. It reads `trading-experiment/config.json`, `data/live_tickets.csv` and `KILL_SWITCH` fresh on every call.

**Robinhood calls** (any MCP server whose name contains "robinhood")
- `place_option_order` goes out only with the `ref_id` of a `live.py gate` ticket. That ticket must be `approved` and dated today (New York time), and its side must match. The order's contracts must not exceed the ticket's, and for buys the limit × contracts × 100 must not exceed the approved premium.
- Single-leg orders only: buy-to-open or sell-to-close, as limit orders in regular hours. Buys are good-for-day and placed between 09:30 and the 15:50 cutoff; sells must go in by 15:58. A resting take-profit ticket allows only its GTC sell at or above its level.
- Every order is refused while `KILL_SWITCH` exists, while `live.enabled` is false, or when no experiment checkout is present (fail closed).
- `account_number` must be the agent account (`live.agent_account_last4`). This applies to reads too.
- Stock buys are refused while `strategy.allow_stock_buys` is false. `exercise_option`, crypto tools, advanced orders, margin tools and watchlist/alert/scan/Legend writes are always refused. Read-only `get_*` tools and `search` pass.

**Files and shell**
- The agent cannot delete or move `KILL_SWITCH`. While it exists, commands that could wipe it (`git clean`, `git stash`, `git reset --hard`, …) are refused.
- `data/{ledger,live_ledger,live_tickets,marks,equity,orders}.csv` and `live_state.json` change only through `tracker.py` / `live.py`. Direct edits, writes, redirects and `sed -i` are refused.
- `journal.md` is append-only: an edit may add text but not change anything already there.

**End of turn.** If a gate ticket is still open (approved but never placed, or placed but never recorded), the guard queues one prompt asking the run to reconcile it with the broker.

`/trading-guard` shows what is enforced in this checkout and the guard's recent decisions.

Limits: the guard cannot match the contract itself, because `option_id` is an opaque broker id. Robinhood's `review_option_order` and the gate cover that. The shell checks are best effort: they match command text and do not sandbox the shell.
