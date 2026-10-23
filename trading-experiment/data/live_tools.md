# Robinhood connector: tool inventory and enabling checks (2026-10-18)

Connector: claude.ai custom connector "Robinhood" (agent.robinhood.com/mcp/trading), connected and enabled in this session.
Agent account: the single account the agent may trade, nickname "MCP", ending 5318, limited margin, options Level 2. (Main account ending 2202 is read-only to the agent and is never used.)

## Checks (all read-only, nothing placed)
| Check | Result |
|---|---|
| get_accounts | exactly one agent-tradable account (MCP, ••••5318), option_level_2, limited_margin |
| get_portfolio (MCP) | value $2,000, cash $2,000, buying power $2,000 (deposit still settling) |
| get_trade_approval_setting | approvals OFF (orders execute without a tap in the app: the owner's "fully automatic") |
| get_equity_positions / get_option_positions | none |
| get_equity_quotes SPY, XLE, NVDA | last regular-session trades 763.295 / 68.24 / 214.14; agree with the Yahoo+Cboe closes (763.25 / 68.24 / 214.13) |
| get_option_quotes NVDA 11/20 225C, XLE 11/20 68C | 6.10/6.25 and 2.28/2.55, identical to Cboe's chain: options now have two sources |
| get_option_instruments | contracts tradable; ticks $0.05 at/above $3.00, $0.01 below; sellout_datetime is Robinhood's forced-close time on expiry day |

## Tools the routine may call
Read: get_accounts, get_portfolio, get_trade_approval_setting, get_equity_quotes, get_index_quotes, get_equity_historicals, get_equity_fundamentals,
get_equity_analyst_ratings, get_equity_news, get_earnings_calendar, get_earnings_results, get_equity_positions, get_equity_tradability, get_option_chains,
get_option_instruments, get_option_quotes, get_option_positions, get_option_orders, get_equity_orders, get_sec_filing_index, get_sec_filing, get_sec_filing_facts.
Orders (only with an approved `live.py gate` ticket): review_option_order, place_option_order (single leg; buy-to-open / sell-to-close; limit; the ticket's ref_id),
cancel_option_order (own orders). Equity order tools stay unused while stock buys are off.

## Never call (still visible in the tool list: the owner should switch them off in the connector's tool permissions)
exercise_option, cancel_option_exercise, place_crypto_order, cancel_crypto_order, preview_crypto_order, place_advanced_order, cancel_advanced_order,
get_limited_margin_upgrade_info, decline_trade_approval, and every watchlist / alert / scan / Legend write tool.
