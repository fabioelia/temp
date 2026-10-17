# Rules of the game

Simulation only. No brokerage account is touched. Nothing here is financial advice.

## Account and goal
* Start: **$2,000 cash**, Robinhood-style retail account. No margin, no shorting, no options, no crypto, no OTC.
* Window: first fills **Mon 2026-10-19** (close) through **Wed 2026-11-18** (close). 23 sessions; no NYSE holiday inside it.
* Goal: **$4,000** (+100%), or as close as possible. Doubling needs about +3.2% per day compounded over the 22 return days.
* Primary scoreboard: equity at the final close. Secondary (reported daily): return vs SPY buy-and-hold with the same $2,000,
  max drawdown, win rate, payoff ratio, fees plus slippage paid. One month cannot prove skill either way (see `research/2026-10-17/risk.md`);
  the secondary numbers are there to keep the result honest.

## Universe
US-listed stocks and ETFs (including leveraged and inverse ETFs), fractional shares allowed. Minimum order $1. A name needs a verifiable official close each
day or it cannot be traded.

## Execution protocol (no look-ahead)
1. Orders are **queued after a session closes** (`tracker.py order add`), with a written thesis.
2. They **fill at the next session's official close** (market-on-close style) plus slippage, in this order: sells first, then by priority.
3. A buy may carry `--max-price` (skipped if the close is above it, so a gap cannot make the committee chase). A stop or target is judged on **closing
   prices only**; a stop breach on the close of day D auto-queues a sell-all that fills at the close of D+1 (gap risk is part of the game).
4. A queued order is a day order: it is valid for the next session only unless `--gtd` extends it.

## Trade limits (enforced in code)
* **Max 4 fills per day** (each buy or sell fill counts as one). Unfilled/skipped orders do not count.
* **No same-day round trips and no second fill in the same ticker on one day.**
* No shorting (a sell is capped at shares held), cash can never go negative.
* Sale proceeds may fund a buy at the same close (Robinhood Instant behaviour). The no-round-trip rule keeps this clear of good-faith violations
  (T+1 settlement; PDT does not apply to this cash-style account).
* Trading days are real NYSE sessions only.

## Costs (all modeled; fills are charged both)
| Item | Value | Note |
|---|---|---|
| Commission | $0 | Robinhood equities/ETFs |
| SEC Sec. 31 fee | $20.60 per $1M sold | Effective 2026-04-04; waived on sales of $500 or less; rounded up to the cent |
| FINRA TAF | $0.000195 per share sold, max $9.79 | Waived on sales of 50 shares or less |
| CAT fee | ~$0.000001 per share | Immaterial; Robinhood reports it stopped passing CAT through |
| **Slippage** | Tier A 5 bps (mega-cap/liquid ETF), B 15 bps (mid-cap), C 30 bps (small/volatile), D 60 bps (stressed/illiquid) | Buys fill above the close, sells below it. **This is the real cost.** |
| Memo: tax | 24% federal on gains | Shown as an after-tax memo line, not deducted from equity |

Fee numbers come from search extracts of the Robinhood fee page and SEC/FINRA notices (see the risk memo). Regulatory fees are cents per trade at this size.

## Risk guardrails (CIO policy for this experiment)
The committee's own Monte Carlo says 2x is a 0-5% event and that the aggressive routes carry a 2-14% chance of losing half. The policy is therefore *bounded
convexity*: take the asymmetric shots, but cap the damage.
* **Exposure:** gross invested <= 100% of equity; a 3x ETF counts at 3x notional against the AI/semis theme cap.
* **Concentration:** max 4 positions, no single name above 30% of equity at entry. **Theme caps (cost basis, incl. leverage): AI/semis <= 40%, energy <= 40%.**
* **Risk per position to its closing stop:** <= 2% of equity core, <= 3% satellite (assume the realised loss is 1.5x planned, 2x for 3x ETFs).
* **Regime gate:** while the S&P 500 is below its prior 10-day closing high *and* VIX >= 20, keep invested <= 50%. Above 50% only after the S&P closes above its
  prior 10-day closing high with VIX falling.
* **Staging:** Mon <= 30% invested, Tue <= 55%, Wed <= 75%, unless a confirmed regime change justifies more (journal the reason).
* **Events:** <= 10% of equity in any one stock through its own earnings; <= 50% invested at the 10/28 close (FOMC); <= 35% at the 11/3 close (midterms).
* **Leveraged ETFs:** <= 15% of equity each, never averaged down, exit after 8 sessions without +5% progress.
* **Circuit breakers:** a -6% close-to-close equity day means no new buys next session; -15% from peak equity halves exposure; -25% goes to cash/SPY until
  the committee reviews in the journal.
* **Ratchet:** at +30% equity, lock a +10% floor (stops must not risk below it); above +60%, risk only profits above +30%.
* **Pyramiding:** add only to winners (up 3-5%, new closing high), then move the whole stop to breakeven. Never average down.
* **Trade budget:** the cap of 4 fills a day is a ceiling. Aim for <= 2 per day on average, weekly turnover <= 150%, and keep a slot free for stop exits.
* Doing nothing is a valid trade.

## Integrity rules
* Every order carries a written thesis; every fill carries a price source. `tracker.py validate` rechecks the ledger.
* The ledger, marks and journal are append-only. Corrections are dated notes in `journal.md`, never edits to past rows.
* **Quote integrity.** Prices come from `quotes.py`, which accepts a price only when at least two independent providers agree within 0.3% and records which providers and
  the spread. The tracker fetches them itself (`day --auto-prices`); the AI never types a price in. If the feed is unavailable, the fallback is cited web-search closes
  (two independent sources for any position over 25% of equity); fills priced that way are flagged on the scoreboard and by `validate`. If a close cannot be verified
  at all, the ticker is skipped (its order does not fill) and the mark carries the last verified close with a stale-mark warning.
* Never use information from after an order's fill date when queuing it. Git history timestamps each decision before its outcome.
* The committee may break a soft guardrail only with a dated journal entry that says which rule and why.
