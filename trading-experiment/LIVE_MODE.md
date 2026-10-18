# Live mode: real money, fully automatic, hard limits

**Status: ENABLED 2026-10-18** after the checklist passed (results in `data/live_tools.md`). Agent account: "MCP", ending 5318 (options Level 2, approvals off, $2,000).
Every run first confirms the Robinhood tools are loaded; if they are missing, it makes no live orders and tells the owner.

## Authorization (the owner's own words, 2026-10-17)
* Chose "Real trades, fully automatic" after being told the committee's odds: about 1-5% to double, a 2-14% chance of losing half on aggressive routes.
* "I'm fine with 2000 play in real money. If we lose 500 we pull the plug until we talk again."
* 2026-10-18: "Update the 500 budget to 1k instead." The loss limit and the option budget are now **$1,000**.

## The limits (enforced in code by `live.py`, not just by intention)
| Limit | Value |
|---|---|
| Real capital at work | **$2,000 at most**, whatever the account holds |
| Loss limit | **Down $1,000** (experiment equity at or below $1,000): no new buys, everything sold to cash, then `KILL_SWITCH` is created and all orders stop **until the owner and Claude talk** |
| Largest single order | 30% of the cap ($600) |
| Options (current strategy) | buy-to-open / sell-to-close only, whole contracts, **limit orders at the broker's live quote**; premium only from cash above the **$1,000 floor**, so the $1,000 limit holds even if every option expires worthless |
| Stock / ETF buys | switched off by the options strategy (were: 30% per order, leveraged ETFs 15%) |
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
python3 trading-experiment/live.py check --marks XLE=68.1,...  # prices from the connector; trips the $1,000 limit
# for each order the tracker CONFIRMED today:
python3 trading-experiment/live.py gate --order O003 --marks ...   # APPROVED ticket (with the size it allows) or REFUSED
#   APPROVED -> place exactly that with the connector (market order; buy by dollar amount, sell by shares)
python3 trading-experiment/live.py placed --ticket K001 --broker-order-id <id>
#   confirm the execution with the connector's order status, then:
python3 trading-experiment/live.py record --ticket K001 --qty <filled shares> --avg-price <avg fill> --fees <fees>
#   anything unclear or failed:  live.py fail --ticket K001 --reason "..."   (never re-place without checking the broker's order history first)
```
Run B (post-close) reconciles: broker positions against `data/live_ledger.csv`, runs `live.py check`, and reports real P/L next to the paper P/L.

## Confirmation policy
Robinhood's tool guidance says that when in-app trade approvals are off, the agent should get explicit confirmation before each order. The owner has given standing, written
authorization for fully automatic trading within these limits (see Authorization above: "Real trades, fully automatic", "$2,000 ... if we lose $500 we pull the plug", raised to $1,000 on 2026-10-18), so the
unattended runs treat that authorization plus an approved `live.py gate` ticket as the confirmation. **Owner confirmed this explicitly on 2026-10-18: "yes thats right for my
confirmation. I dont want to tap for this."** Trade approvals stay off. If the owner turns trade approvals ON in the Robinhood app, every order goes to
the app for one-tap approval instead, and the runs simply place it for approval (`customer_approval_required` true) and report that it awaits the owner.

## Placing a real option order, step by step
1. `get_accounts` → use the single agent-tradable account (nickname MCP, ending 5318). Never the main account.
2. `get_option_instruments` (chain_symbol, expiration, strike, type) → the contract's `id`; `get_option_quotes` → live bid/ask, mark, `high_fill_rate_buy_price`.
3. Choose the limit: for a buy, the high-fill-rate buy price rounded **down** to the tick ($0.05 at/above $3.00, $0.01 below), never above the ask or the order's `--max-price`.
4. `live.py gate --order Oxxx --limit <price> --marks ...` → APPROVED ticket with `contracts`, `limit_price`, `ref_id`, or REFUSED (stop).
5. `review_option_order` (single leg, `side` buy, `position_effect` open, `quantity` = contracts, `type` limit, `price` = limit). If it returns order_checks alerts, stop and journal them.
6. `place_option_order` with the same legs/quantity/price and `ref_id` from the ticket → `live.py placed --ticket K... --broker-order-id <id>`.
7. `get_option_orders` until filled or the day's cutoff → `live.py record --ticket ... --qty <filled> --avg-price <avg>`; unfilled at 15:50 ET → `cancel_option_order`, `live.py fail`.
Selling to close is the same with `side` sell, `position_effect` close, limit at the bid side (high_fill_rate_sell_price rounded up to the tick).

## Real execution is not the paper model
Robinhood has no market-on-close orders, so a real order executes when it is placed (around 15:00-15:50 ET), not at the 16:00 close that the paper ledger assumes. Fractional and dollar-sized
orders are market orders only. Partial fills, rejected orders and wider live spreads are possible. The paper ledger keeps running as the shadow model; the live ledger records what actually
happened, and the scoreboard should show both.

## How Robinhood's agent access works (from Robinhood's help center, read 2026-10-17)
Sources: https://robinhood.com/us/en/support/articles/onboarding-an-external-agent/ , https://robinhood.com/us/en/support/articles/trading-with-your-agent/ ,
https://robinhood.com/us/en/support/articles/setting-up-an-agent/
* The agent can **place trades only in a dedicated Agentic / MCP account**, opened during the connect flow (desktop), which needs an open primary individual investing account in good
  standing. Fund that account with exactly the experiment's money ($2,000); the gate's cap is a second fence.
* The agent gets **read access to all of the owner's Robinhood accounts** (account numbers, positions, balances, order history). Robinhood does not narrow this. Our rule: read only the
  MCP account's data and market data; never look at the other accounts.
* Account type at opening: limited margin (default) or cash. Agentic accounts have **no margin borrowing**; limited margin only lets sale proceeds be reused before settlement, which
  matches how the tracker models same-day rotation. A cash account also works but may block buying with unsettled proceeds.
* **Trade approvals** are off by default for MCP accounts (rolling out; may be unavailable). Off means fully automatic, as the owner chose. Some trades may still ask for approval.
* No tool moves money: there are no deposit, withdrawal or transfer tools. Crypto needs a separate Robinhood Crypto account tied to the MCP account (do not set one up); options need an
  approved options level (do not apply).
* Order types: market (share- or dollar-based), limit, stop limit, stop market. **No market-on-close.**

### Tools the routine may use (everything else is off-limits)
| Purpose | Tools |
|---|---|
| Find the MCP account, check buying power | `get_accounts` (to identify the MCP account only), `get_portfolio` (MCP account) |
| Prices and research | `get_equity_quotes` (real-time, up to 20 symbols; the second live source for `quotes.py`), `get_index_quotes`, `get_equity_historicals`, `get_equity_fundamentals`, `get_equity_news`, `get_earnings_calendar`, `get_earnings_results`, `get_equity_analyst_ratings` |
| Before an order | `get_equity_tradability` (tradable? fractional?), `review_equity_order` (pre-trade warnings) |
| Orders (only with an approved `live.py gate` ticket) | `place_equity_order`, `get_equity_orders`, `cancel_equity_order` (own experiment orders only) |
| Reconciliation | `get_equity_positions`, `get_option_positions` (MCP account) |
| Options (current strategy) | `get_option_chains`, `get_option_instruments`, `get_option_quotes` (live bid/ask: the `--limit` for the gate), `review_option_order`, `place_option_order` (single-leg buy-to-open / sell-to-close, gate ticket only), `get_option_orders`, `cancel_option_order` (own orders only) |

**Never call:** `exercise_option`, `cancel_option_exercise`, any multi-leg or sell-to-open option order, any `*crypto*` tool, `place_advanced_order`, margin-upgrade tools, and no
watchlist, alert, scan or Legend writes. `get_option_level_upgrade_info` only to give the owner the link if the agent account lacks options approval.
In the connector's tool permissions: keep `place_option_order` ON (the strategy needs it); turn off at least `exercise_option`, `cancel_option_exercise`, `place_crypto_order`,
`place_advanced_order`. The agent account needs **options Level 2** (single-leg) approval of its own; the owner applies in the app if it is missing.

## Enabling checklist (all of it must pass before `live.enabled` becomes true)
1. Connect the connector at https://claude.ai/customize/connectors (custom connector, URL `https://agent.robinhood.com/mcp/trading`), sign in, and set every transfer, ACH, option, crypto and account-setting tool to off in its tool permissions.
2. Start a fresh session (connectors are read when a session starts). List the connector's tools; write them to `data/live_tools.md`, marked read-only or order-placing, and confirm the
   forbidden ones above are off. Identify the MCP account with `get_accounts` and record only its id.
3. Read-only test: `get_option_quotes` for one NVDA and one XLE contract (compare with `quotes.py option`); confirm the agent account's options level; `get_equity_quotes` for SPY, XLE, GUSH; `get_equity_tradability` for each proposal ticker (incl. GUSH, a leveraged ETF); `get_portfolio` for the MCP account
   (expect $2,000 buying power, no positions). Nothing placed.
4. Make the connector available to the unattended runs (the scheduled tasks were created without connectors, so they are recreated with it attached) and test that a scheduled run sees it.
5. Only then commit `live.enabled: true`. Watch the first live day closely.

## Connection attempt log
* 2026-10-17: `claude mcp add robinhood-trading --transport http https://agent.robinhood.com/mcp/trading` run in the cloud container. Registered, but `claude mcp list` reports
  `Failed to connect: ERR_PROXY_TUNNEL: Proxy refused to open a tunnel: 403 Forbidden`, because the environment's network policy does not allow `agent.robinhood.com`, and the server's sign-in
  could not be completed from a container anyway. The route that avoids both is the claude.ai custom connector in step 1.
* 2026-10-17, after full network access: `claude mcp list` reports `Needs authentication` (the host is reachable now). `claude mcp login --no-browser` would need the owner to paste the
  OAuth redirect URL (which carries an authorization code) back into this session; that is not done here. Use the claude.ai custom connector (step 1), which signs in in the owner's own browser.
