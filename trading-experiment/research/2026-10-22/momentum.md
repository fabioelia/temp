# Momentum memo, Thu 2026-10-22 (post-close, Run B)

**Verdict: WAIT to 10/28; keep MSFT.** The Nasdaq attempt failed: its low (25,918.09) broke the 26,023.10 rally low, and it closed at 26,008.86 (-2.60%) in the bottom 21% of its range.

- **Distribution:** 7 days on QQQ and 7 on SPY in 25 sessions. Today QQQ traded 63.5M (1.95x Wednesday). Nasdaq volume is preliminary (7.79B vs 7.82B), and Wednesday's was revised up 0.95B, so a distribution day is likely.
- **S&P:** its rally low holds (7,637.36 vs 7,631.77).
- **Leadership is defensive:** XLP +3.3% and PG +5.6% on more than 2x volume; V, MA and AAPL are at highs.
- **Narrow tech break:** RSP +0.73% while SMH fell 5.99%. META fell from 721 after hours to 648.85.
- **Energy is stalling:** XLE tagged a new high (68.78) and closed -0.87% on 1.4x volume while Brent rose 3.8%.

1. **Ranking:**
   - **MSFT 10/28** first.
   - **TLT calls** second, only on a close above 83.60, the top of its 8/28-10/7 range. Today's 50-day reclaim (81.74) on 64.6M shares, 2.1x the heaviest down day of the prior 10 sessions, is a pocket pivot. The 200-day (84.81) is still falling.
   - **USO:** no setup. It is 11.6% extended above its 50-day, and the new high came on 0.82x volume.
   - **Flush and puts:** far away.
   - **Index calls:** after an FTD only, earliest Wed 10/28.
2. **MSFT: no change.**
   - The 50-day is 507.88 now and about 510.3 on 10/28 if MSFT stays flat. Support is 510-514.
   - Today was a distribution day for MSFT itself (21.1M vs 13.9M shares).
   - The strike walk now lands on the 575C (3.25/3.55). It is 9% wide, so the spread rule binds.
3. **Trigger:** Friday closes up without trading below Nasdaq 25,918.09 (QQQ 701.90). That is Day 1, which makes Wed 10/28 Day 4. A QQQ close below 700 exposes its 200-day (676.89).

**Proposal:**
`TLT261120C00084000 | 2026-11-20 | 84 | C | 0.25 | 0.48/0.50 (quotes.py, 17:19 ET) | OI 91,274 | next 14:43 after a TLT close >= 83.60 (not 10/28), ask <= 1.10 | bid <= 0.55 or close < 82.50; half at +100%; rest 11/13 | 3`

**Sources** (10/22, 17:15-17:20 ET):
- Yahoo daily bars.
- Robinhood quotes.
- quotes.py (Cboe).
- META's after-hours price: the 10/21 catalyst memo.
- My own calculations: the distribution counts, 50-day projections and Black-Scholes values. With IV fitted at 14.2%, the 84C models about 1.00 at TLT 83.60.
