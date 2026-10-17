# Live mode: real money, fully automatic, hard limits

**Status: DISABLED** (`live.enabled` is false in `config.json`). It is switched on only after the broker connector is connected and verified in a fresh session (checklist below).

## Authorization (the owner's own words, 2026-10-17)
* Chose "Real trades, fully automatic" after being told the committee's odds: about 1-5% to double, a 2-14% chance of losing half on aggressive routes.
* "I'm fine with 2000 play in real money. If we lose 500 we pull the plug until we talk again."

## The limits (enforced in code by `live.py`, not just by intention)
| Limit | Value |
|---|---|
| Real capital at work | **$2,000 at most**, whatever the account holds |
| Loss limit | **Down $500** (experiment equity at or below $1,500): no new buys, everything sold to cash, then `KILL_SWITCH` is created and all orders stop **until the owner and Claude talk** |
| Largest single order | 30% of the cap ($600) |
| Leveraged / inverse ETF | 15% of the cap ($300) per name |
| Fills per day | 4, no same-day round trips, no shorting |
| Orders allowed | only those the pre-close run confirmed that day, only through a `live.py gate` ticket, before 15:50 ET (flatten sells until 15:58) |
| Duplicates | one ticket per order id: a crashed or repeated run cannot place the same order twice |

"Pull the plug" is implemented as: sell all positions to cash, then halt. If you would rather it halt without selling, say so.

## Always forbidden
Deposits, withdrawals, transfers, ACH, wires; changing any account setting; options, crypto, margin, short selling; any order the gate did not approve; touching holdings that are not part of
the experiment; reading anything of the account beyond what the routine needs (prices, the experiment's positions and orders, buying power). If a tool looks like it does one of these, do not call it.

## Stop it yourself, any time
1. Create a file named `KILL_SWITCH` in `trading-experiment/` on the branch (GitHub "Add file" does it in seconds). Every run pulls first and refuses all orders while it exists.
2. Or tell me in chat. Or disable the scheduled tasks (`AI Trading Challenge: pre-close decision` is the only one that can place orders).
3. You can always sell manually in the Robinhood app. Tell me if you do, because the live ledger must then be reconciled.
Only the owner removes `KILL_SWITCH`, and the agent must never do it.

## How a run uses it (Run A, pre-close)
```bash
python3 trading-experiment/live.py status                       # open tickets? kill switch? stopped?
python3 trading-experiment/live.py check --marks XLE=68.1,...  # prices from the connector; trips the $500 limit
# for each order the tracker CONFIRMED today:
python3 trading-experiment/live.py gate --order O003 --marks ...   # APPROVED ticket (with the size it allows) or REFUSED
#   APPROVED -> place exactly that with the connector (market order; buy by dollar amount, sell by shares)
python3 trading-experiment/live.py placed --ticket K001 --broker-order-id <id>
#   confirm the execution with the connector's order status, then:
python3 trading-experiment/live.py record --ticket K001 --qty <filled shares> --avg-price <avg fill> --fees <fees>
#   anything unclear or failed:  live.py fail --ticket K001 --reason "..."   (never re-place without checking the broker's order history first)
```
Run B (post-close) reconciles: broker positions against `data/live_ledger.csv`, runs `live.py check`, and reports real P/L next to the paper P/L.

## Real execution is not the paper model
Robinhood has no market-on-close orders, so a real order executes when it is placed (around 15:00-15:50 ET), not at the 16:00 close that the paper ledger assumes. Fractional and dollar-sized
orders are market orders only. Partial fills, rejected orders and wider live spreads are possible. The paper ledger keeps running as the shadow model; the live ledger records what actually
happened, and the scoreboard should show both.

## Enabling checklist (all of it must pass before `live.enabled` becomes true)
1. Connect the connector at https://claude.ai/customize/connectors (custom connector, URL `https://agent.robinhood.com/mcp/trading`), sign in, and set every transfer, ACH, option, crypto and account-setting tool to off in its tool permissions.
2. Start a fresh session (connectors are read when a session starts). List the connector's tools; write them to `data/live_tools.md`, marked read-only or order-placing.
3. Read-only test: one quote (SPY) and the experiment's positions. Nothing placed.
4. Make the connector available to the unattended runs (the scheduled tasks were created without connectors, so they are recreated with it attached) and test that a scheduled run sees it.
5. Only then commit `live.enabled: true`. Watch the first live day closely.

## Connection attempt log
* 2026-10-17: `claude mcp add robinhood-trading --transport http https://agent.robinhood.com/mcp/trading` run in the cloud container. Registered, but `claude mcp list` reports
  `Failed to connect: ERR_PROXY_TUNNEL: Proxy refused to open a tunnel: 403 Forbidden`, because the environment's network policy does not allow `agent.robinhood.com`, and the server's sign-in
  could not be completed from a container anyway. The route that avoids both is the claude.ai custom connector in step 1.
