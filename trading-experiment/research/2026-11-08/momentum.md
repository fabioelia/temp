# Momentum memo, Sun 2026-11-08 (Run C re-plan)

**Verdict: no momentum objection to Monday's lump-sum core buy. No option trade.** Quotes are Friday closes (weekend, stale).

| 11/6 | Close | vs 50-day [Mon] | vs 200-day [Mon] | Week |
|---|---|---|---|---|
| SPY | 735.29 | -4.0% [765.60] | +0.7% [730.59] | -2.7% |
| QQQ | 656.10 | -9.0% [721.06] | -3.6% [681.18] | -5.0% |

- SPY's -4.4% was one day (11/5). Both 50-days are still above their 200-days. A -0.64% Monday puts SPY under its 200-day, which is not a rule (S2 REJECTED).
- 7 of 11 sectors are above their 50-day, and RSP/SPY is +7.4% over 20 sessions: rotation out of tech.

**No committed test shows that buying right after the drop is worse:**
- `regime_gate.py`: the gate is ON now. Cutting to 50% in that state lowered the Sharpe in both halves (0.67 vs 0.76 since 2010).
- `momentum_1105.py`: after a -4% day, 9 sessions +0.48% (n 34, excess t +0.14).
- `momentum_1106.py` B1, the exact pattern (a -4% day, then 0 to +1%): 7 sessions -2.79% vs +0.25% random, t -1.28, **n 4**. That is below its n >= 10 bar.
- No test conditions on a weekly drop.

**Consensus** ("wait for the 200-day to hold"): mine differs, because no test supports waiting.

Sources: momentum_1106.py's functions re-run unchanged on its cached Yahoo bars (closes match), regime-gate.txt, and quotes.py.
