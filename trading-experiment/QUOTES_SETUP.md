# Getting real quotes into the experiment

**Status (2026-10-17):** the sandbox's egress proxy blocks every quote host (HTTP 403 on the tunnel), so the experiment can only use cited web-search closes. Verified with
`python3 trading-experiment/quotes.py check`:

```
yahoo    live / close   BLOCKED (403)        stooq    close   BLOCKED (403)
finnhub.io, data.alpaca.markets, api.polygon.io, api.twelvedata.com   all unreachable (curl: connection refused by the proxy)
```
This is a network-policy setting that only the environment's owner can change. Nothing in the code or the session can, or should, route around it.

## The fix: allow the hosts (one time, about two minutes)
Environment menu in the session's title bar, then **Edit**, then **Network access**. Docs: https://code.claude.com/docs/en/cloud-environments#network-access

### Step 1 (do this one; no accounts, no keys)
Add these under **Allowed domains** (leave "Allow package managers" ticked):
```
query1.finance.yahoo.com
query2.finance.yahoo.com
stooq.com
```
That gives **official daily closes from two independent sources, cross-checked** (Yahoo + Stooq), plus a Yahoo live quote. Every fill then says which providers priced it.

### Step 2 (optional; needed only for intraday trading with a cross-checked live price)
Add a second independent live source. Pick one:
* **Finnhub** (free key at finnhub.io): allow `finnhub.io`, and set the environment variable `FINNHUB_API_KEY`.
* **Alpaca** (free account, market data only): allow `data.alpaca.markets`, and set `ALPACA_KEY_ID` and `ALPACA_SECRET_KEY`. Also adds a consolidated daily-bar close as a third source.

Put keys in the environment's settings (under Network secrets, or as environment variables). **Never paste a key into the chat.** A new session picks the settings up.

### Alternative: broaden access
Choose a wider access level (e.g. Full) instead of listing hosts. Simplest, but it lets the sandbox reach the whole internet, so the specific list above is the safer choice.

### Alternative: a market-data connector (no network change)
Connect one in claude.ai settings: **Alpha Vantage MCP**, **FMP** or **Financial Datasets** are in the registry (none is connected now). Caveats: it needs your login; real-time
quotes may need a paid plan; and the unattended scheduled runs would need the connector attached to them.

## Verify
```bash
python3 trading-experiment/quotes.py check
# Want:  official closes: READY (2+ sources)     live quotes: READY (2 sources) after Step 2
python3 trading-experiment/quotes.py closes --date 2026-10-16 --tickers SPY,XLE
```
Offline tests of the quote layer (parsers, consensus rules, HTTP path against a local fake server): `python3 -m unittest discover -s trading-experiment/tests -v`.

## How prices are accepted
* Two or more providers must agree within 0.3% (the median is used); one outlier among three is dropped; disagreement or a single source means **no price** and the order skips.
* Live quotes older than 120 seconds are rejected.
* API keys are read from environment variables only and are never printed or written to a file.
* The provider formats in `quotes.py` follow the public API documentation but were exercised only against a local fake server, because the real hosts are unreachable from here.
  The first `quotes.py check` after the hosts are allowed is the real test; if a provider answers in a different shape, that provider reports `PARSE` instead of a price.

## Next step once live quotes pass `check`
Intraday execution: add runs near the open and before the close so orders fill at a cross-checked live price (bid/ask when the provider gives it) instead of the next close, and
let the 4-fills-a-day cap be used for real timing decisions. Not built yet on purpose: it should be built against a feed that has been seen working.
