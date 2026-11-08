# Momentum memo, Sun 2026-11-08 (Run C re-plan)

**Verdict: no momentum objection to Monday's lump-sum core buy. No option trade.** Weekend quotes are stale (Friday 11/6 closes).

## Tape (11/6 close; Monday's levels in brackets)

| | Close | 50-day | 200-day | Week |
|---|---|---|---|---|
| SPY | 735.29 | -4.0% [765.60] | +0.7% [730.59] | -2.7% |
| QQQ | 656.10 | -9.0% [721.06] | -3.6% [681.18] | -5.0% |

- SPY's -4.4% was one day (11/5). Its week was -2.7%. Both 50-days are still above their 200-days.
- A -0.64% Monday would put SPY under its 200-day. That is not a rule (S2 REJECTED).
- Breadth: 7 of 11 sectors are above their 50-day, and RSP/SPY is +7.4% over 20 sessions. That is rotation out of tech (XLK is -12.6% and SMH -18.0% vs their 50-days).

## Is buying right after the drop worse? No committed test says so

- `regime_gate.py`: the gate is ON now (50%). Cutting to 50% in that state lowered the Sharpe in both halves (0.18 vs 0.29, and 0.67 vs 0.76).
- `momentum_1105.py`: after a -4% ^GSPC day (n 34), 9 sessions +0.48%, excess t +0.14.
- `momentum_1106.py` B1, the exact pattern (a -4% day, then 0 to +1%, Monday entry): 7 sessions -2.79% vs +0.25% random. t -1.28 (1 session: t -2.09), **n 4**. That is below its n >= 10 bar, so it is a narrative.
- `core_equity.py` does not condition on the prior week, and no other test does.

**Consensus check:** a generic AI would say "wait for the 200-day to hold." Mine differs, because no test supports waiting.

Sources: the tape and B1 come from momentum_1106.py's unchanged functions, re-run on its cached Yahoo bars (closes match the snapshot). Also regime-gate.txt and `quotes.py closes`.
