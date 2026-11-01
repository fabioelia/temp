# trading-desk

A Claude Code mod that puts the AI trading experiment's scoreboard in a pane beside the chat. It reads the files `tracker.py` exports (`trading-experiment/data/export/*.json`) and the files the `live.py` gate writes. It re-reads them every minute and after any `tracker.py`, `live.py` or `git pull` command.

**The pane** (`/desk` opens it; it opens by itself when the checkout has `trading-experiment/`) shows:
- equity and P/L, SPY buy-and-hold over the same window and the gap in points, plus an equity sparkline
- the goal, sessions left and the daily return still needed; max drawdown; number of fills
- the New York clock and session phase, with a countdown to the 15:50 order cutoff (early-close days handled), and the next scheduled run (09:13, 14:43, 17:13, Sunday 18:22)
- kill switch, live mode and open gate tickets
- positions, and pending orders with readable contract names (`INTC 11/20 72.5P`)
- Refresh and Kill switch buttons (the kill switch asks for confirmation first)

**The status line** shows the same in one line: clock, phase, equity and the gap to SPY.

**The band above the prompt** appears only when something needs the owner: the kill switch is engaged, the loss limit has tripped, or a gate ticket is still open.

**A toast** fires 10 minutes before the order cutoff on trading days.

**`/kill-switch [reason]`** is the owner's stop. It writes `trading-experiment/KILL_SWITCH`, commits only that file, and pushes it to the current branch, so every scheduled run sees it after its `git pull`. It also tells the model to place nothing and never to remove the file. Only the owner removes it, as `LIVE_MODE.md` says.
