# Risk memo (red team), Sun 2026-10-18

Quotes are Friday 10/16 closes (Cboe delayed, `quotes.py`, 10/18 18:45 ET). Payoff levels are my Black-Scholes. The month odds are my Monte Carlo (20k paths) plus a replay of the historian's 108 episodes (Yahoo, 1990-2026).

## Two gate traps (`live.py`)
1. **Sizing:** contracts = `min(want, budget) // (limit×100 + $0.04)`.
   - `--qty 1` buys 0 contracts, and `--qty 7` buys 6.
   - `--usd 500` at a $5.00 limit buys 0.
   - **Size with `--usd` above ceiling × contracts.**
2. **Order cap:** the $600 single-order cap is not coded for options, so enforce it by hand.

## P1 SPY 785C: APPROVE, modified
- **The 60% is the index's odds, not the option's.** In my replay, new highs came 60% of the time. The call analogue doubled only 35% of the time and lost half 61% of the time.
- **Failure path:** with SPY flat, decay alone hits the -50% stop around 10/30. Flows' modal path is a shake to SPY 743-753 before any squeeze, and that stops us out at the low.
- **Changes:**
  - Order: `--usd 520 --max-price 5.00`.
  - Extra triggers: VIX9D ≤ VIX3M, Brent < $112.
  - Exit: one contract can't be halved, so **sell all at bid ≥ 2× fill**. That needs SPY ~780 by 10/23.
  - No other buy before 10/28 while P1 is open, to protect the MSFT reserve. That rules out NVDA and QQQ on 10/22.

## P2 TLT 82C: MODIFY
- **Problems:**
  - At a 10y of 5.05% the call costs ~$0.80, above its own $0.72 ceiling.
  - IV is 14.4% against 11.3% realized.
  - The stop is only ~9bp of 10y away.
- **Changes:**
  - Only if SPY ≥752; keep the flush budget for SPY.
  - Buy the 11/20 call nearest 0.30 delta, ask ≤$0.90, `--usd 505`.
  - Out by the 11/12 pre-close.

## MSFT 580C, 10/28: APPROVE, modified
- **Failure path:** a flat print takes ~$3.40 to ~$0.90. A double needs +6.5%, which 2 of the last 12 prints delivered.
- **Changes:**
  - Order: `--usd 365`, and keep ≥$361 above the floor.
  - Journal waivers for the 10% earnings cap (this is 18%) and the 3%-risk rule.
  - Ticket by 15:45, or skip. Skip if the spread is over 5%.

## Arithmetic
- **Caps:** every order is under $600 (P1 $500.04, P2 $504.28, MSFT $360.04), ≤3 fills on any day, and the 3-day rule is cleared.
- **Floor:** if P1 and MSFT both go to zero, $139.92 is left.
- **Third shot: yes, if the stops hold.** The all-fail path keeps ~$470 (1,000 − 440 + 190 − 360 + 90). Buy after the 11/3 close (the 35% midterm cap blocks it earlier), with an 11/27 or later expiry.
- **Month:**
  - Worst realistic: ~$1,230.
  - Median: $1,630-2,050.
  - 90th percentile: $3,150-3,700.
  - $4,000: 4-7%.
  - Floor: $1,000.
