# Momentum memo, Tue 2026-10-27 (Run B)

**Verdict: no trade Wednesday. Keep Thursday's IWM follow-through (FTD) at +1.5%, but move the strike band to 288-296. The 287-290 band cannot fill on a real trigger.**

## 1. Counts
- **S&P and Nasdaq: Day 2.** Thu 10/29 is still the earliest FTD. The 10/23 lows (7,612; 25,866) held.
- **Distribution days: SPY 7, QQQ 7, IWM 5, unchanged.** All three closed up, so none was added and none aged out. SPY's 9/23 drops after Wednesday.
- **Russell: Day 7; Thursday is Day 9.** IWM rose 1.15% on 1.22x volume (18.76M, Cboe) and closed above its 200-day (278.43) for the first time since 10/12. Not an FTD.

## 2. Trigger
- **No new-high pivot.** In the 75-case sample, FTDs at a new rally closing high had EV 0.94 (n=57); the others, 1.35 (n=18). Above the 50-day: 0.99.
- **Re-run at the new base** (entry 284.38, 293C, IV 17.65%, after costs):
  - +1.5%: EV 1.05 (bootstrap P>1 0.74). Keep +1.5%.
  - +1.25%: 0.99.
- **Caveats:** Day 8+ above the 200-day gives 0.93 (n=17), and a Friday entry 0.99. If both fire Friday, give the shot to INTC.
- **Levels:** keep 279.00 as the 200-day guard. The 276 stop never binds: the -50% backstop sits near 280.3.

## 3. Strike
- **Tonight (Cboe 17:19 ET):**

| Strike | Bid/ask | Delta |
|---|---|---|
| 288C | 2.34/2.38 | 0.30 |
| 289C | 2.03/2.07 | 0.27 |
| 290C | 1.77/1.80 | 0.25 |

  Only the 289C qualifies.
- **At a 284.38 trigger** (my Black-Scholes, fitted to the skew within $0.01):
  - 287-290C ask 2.74-4.25.
  - The 293C fits (~2.02, delta 0.27), or the 292C (~2.08, delta 0.29) if IV eases.
  - Rule of thumb: strike ≈ 1.03 x spot.

## 4. Chips broadened, the market narrowed
- **Chips:** all 20 S&P semis rose (median +3.72%). NVDA lagged (+0.90% on 0.73x its 50-day volume).
- **The market narrowed:**
  - S&P members: 245 up, 257 down.
  - RSP +0.11% vs SPY +0.56%.
  - SMH is below its 50-day on 0.78x Monday's volume.
- **Anthropic:** not my thesis.

## 5. Ranked
1. **IWM 293C (or 292C) x2**, conditional Thursday, confidence 3. It is not the consensus trade. Edge: EV 1.05.
2. **Otherwise, no trade.** The SMH 585C (10.10/12.40) fails the cap and the spread rule.

**Sources:** Yahoo v8 bars (21:17-21:22 UTC), Cboe via quotes.py, my model.
