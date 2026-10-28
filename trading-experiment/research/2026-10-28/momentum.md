# Momentum memo, Wed 2026-10-28 (Run B)

**Verdict: no trade Thursday. The IWM follow-through (FTD) goes to shadow: after a three-day run its edge turns negative.**

## 1. Counts
- **S&P and Nasdaq: Day 3.** Thursday is Day 4, and the 10/23 lows held.
- **Distribution days:** SPY 6 (9/23 aged out), QQQ 7, IWM 5.
- **Nasdaq FTD Thursday: about 2-6%.**
  - QQQ needs 734.68, which is +2.2% from its 719.20 after-hours print.
  - Of QQQ opens 0.4-1.4% lower, 6.2% closed at +1.25% or better (2.3% since 2010).
- **Russell: Day 8.** IWM +0.40% on 0.98x volume, between its 200-day (278.53) and 50-day (285.00).
- **Rotation** (IWM +1.5%, QQQ down, above the 200-day): EV 0.84 (n 22). No edge.

## 2. Trigger
- **285.51 is confirmed.** Similar opens reach it 9-11% of the time.
- **Volume:** 75% of 18.47M (Yahoo; Cboe 18.26M) = 13.86M by 14:43. A median 68% trades by 14:40, so this means ~1.1x today's volume.
- **Levels:** 279.00 cannot bind on a +1.5% day, and 269.88 is the reset. The 276 stop never binds: the -50% backstop fires near IWM 281.5-283.
- **Don't go smaller:** +1.25% gives EV 0.97 (n 83).
- **Strike:** the 294C (model ~1.93, delta 0.27) or the 293C (~2.10).

## 3. Re-cut of the n 75 sample

| Prior 3 sessions | n | EV | P(EV>1) |
|---|---|---|---|
| Three up closes | 14 | 0.99 | 0.48 |
| Net +2% or more (tonight +2.01%) | 23 | 0.81 | 0.09 |
| Net below 0 | 36 | 1.27 | 0.99 |

Net +1% or more vs below 0 holds before 2010 (0.88 vs 1.18) and since (0.78 vs 1.34).

## 4. Ranked
1. **Thursday: no trade.** IWM 294C x2 goes to shadow (1.04/1.08).
   - Re-arm only if IWM's prior close is below its close three sessions earlier (Friday: Thursday below 276.99).
   - Confidence 2. Not consensus.
2. **Friday: INTC calls only above the 50-day (101.65).**
   - Large-cap +5% gaps continued over 5 days 55% of the time above the 50-day (n 483), 48% below it (n 94).
   - Puts go with the trend.
   - Confidence 3.
3. **GOOGL puts: shadow.** It is Anthropic-linked, which is not my thesis.

**Sources:** Yahoo v8 daily and 5-minute bars (21:17-21:24 UTC); Cboe via quotes.py (17:20-17:27 ET); my simulation and Black-Scholes fit (within $0.01).
