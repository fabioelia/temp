## Risk red-team of the W44 review

**1. Grades**
- Outcome bias: "cash beat SPY", "gap narrowed" and "passing fired triggers was right" (n 9, marked mid-hold; the 30+ rule). Cut them.
- IWM: a hindsight B; its reason (the follow-through wait) is retired. B-, as on 10/28.
- GOOGL +8.9% is a one-day mark: neutral, not bad luck.

**2. Gates.** Defensible only because the tested sample had none.
- p 0.61 is underpowered (difference CI -0.26 to +0.14), not "no effect".
- "Stress helps a put" is contradicted: the stock edge sits at VIX <= 22 (t 3.0 vs 0.3).
- ^TNX and HY OAS are untested. Call it provisional.

**3. Kelly** (my bootstrap of sizing.py at 1.25x, INTC's level):
- f* is 0 in 38% of resamples, and also with the 3 best of 216 events dropped or the filter's 5% spread (the model uses 3%).
- Half-Kelly ($0-34) is under one contract ($242), so O011 sizes to zero: a tighter cap than the one removed.
- Tell the owner: Kelly guards the bankroll, not P($2,200); at EV near 1, size buys only variance. His call.

**4. Missed**
- P($2,200) under these rules is about 0, not 10-15%.
- Cash beats SPY only if SPY falls 2.6%: about 25%, not 35-45%.
- Expected trades: about zero. The doubting friend sees that.

**5. Better changes**
1. The owner picks: a cash finish, or a named goal budget above Kelly.
2. Script the goal odds and the rules' fire rate.
3. Stamp paper fills live; use a 5% model spread.
