# Claude Code mods for the AI trading experiment

Two mods (Claude Code plugins made of function hooks) for the `trading-experiment/` on branch `claude/eloquent-allen-jqzfk2`:

| Mod | What it does |
|---|---|
| [`trading-guard`](trading-guard/README.md) | Enforces the live-mode rules in the harness. A Robinhood order goes out only with an approved, same-day `live.py gate` ticket (matched by `ref_id`, side, size, premium and cutoff), only on the agent account, and never while `KILL_SWITCH` exists. Forbidden tools are refused. The agent cannot remove the kill switch, and ledgers and journal stay append-only. A run that ends with an open ticket is asked to reconcile it. |
| [`trading-desk`](trading-desk/README.md) | A pane beside the chat with equity vs SPY, goal pace, positions, pending orders, the New York clock with the 15:50 cutoff countdown, the next scheduled run, and kill-switch state. Adds a status line, an alert band, a cutoff toast, `/desk` and the owner's `/kill-switch`. |

Both find `trading-experiment/` under the session's working directory and do nothing without it, except that the guard then refuses every Robinhood order (fail closed).

## Running them

From a checkout of the experiment branch, load them for one session:

```bash
claude --plugin-dir mods/trading-guard --plugin-dir mods/trading-desk
```

Or name them in `CLAUDE_CODE_PLUGIN_DIRS` (absolute paths, `:`-separated) where no flag can be given.

## Checking them

```bash
claude plugin validate mods/trading-guard
claude plugin test mods/trading-guard
claude plugin test mods/trading-desk
```
