# Options & vol, Tue 2026-10-27 (Run B)

**Verdict: no trade Wednesday.** After a +1.5% day from 280, the 287-290 band cannot fill under 2.20. Re-strike it by ask, but its EV/$ is about 1.00 (no edge). The best Friday shot is INTC, 1 lot.

Sources: Cboe chain via quotes.py (21:16 UTC); Yahoo closes; Fed calendar; SEC 8-K dates. Models and replays are mine.

## 1. IWM 11/20 calls (spot 280.18; θ = Cboe ×7)
| K | Bid/ask | IV | Δ | θ/wk |
|---|---|---|---|---|
| 287 | 2.67/2.72 | 17.8 | 0.33 | -0.68 |
| 288 | 2.34/2.38 | 17.7 | 0.30 | -0.65 |
| 289 | 2.03/2.07 | 17.5 | 0.27 | -0.61 |
| 290 | 1.77/1.80 | 17.4 | 0.25 | -0.58 |
| 291 | 1.51/1.55 | 17.3 | 0.22 | -0.54 |

- The 288C ask went from 1.65 to 2.38 (+44%) today.
- **Band:** with Wednesday flat, a Thursday fire is at IWM 284.38, where the band models 2.76-4.33.
  - Strikes under the cap: 292C at 2.07-2.31 (Δ 0.29) or 293C.
  - **Change:** buy the lowest strike with ask ≤ 2.20 and Δ ≥ 0.26.
- **Stop:** the -50% backstop fires near 279, so the 276 stop never binds. Use 279.00.
- **EV/$** (IWM 2000-2026, n 199, planned exits): 1.00, SE 0.05.
  - After a 2-day run-up: 0.97.
  - Since 2016: 1.07.

## 2. Fed day
| | 10/28 straddle | Median FOMC-day move, last 8/10/12 |
|---|---|---|
| SPY | ±0.68% | 0.55/0.28/0.27% (1.2-2.5x) |
| IWM | ±1.01% | 0.80/0.71/0.60% (1.3-1.7x) |

- The 10/30 straddle (SPY ±1.16%, IWM ±1.58%) is 1.4-1.5x and 0.8-1.05x the median 3-session move.
- IWM fell on each of the last six FOMC days.
- Nothing argues for buying before the decision.

## 3. After a 5% gap (IV: ex-event + 2 points)
- **INTC 105C:** at 98.43 and 56.8% IV, Δ 0.35 at about 2.92.
  - Arithmetic: d1 = (ln(98.43/105) + 0.201×0.0575) / (0.568×0.240) = -0.39.
  - OI 17,100 and spread 4.4%: passes, 1 lot.
  - 101-104C fail on OI.
  - On a gap down, the 85P and 87.5P pass.
- **AMZN:** calls cost 5-7. The 232.5P (~4.1) had a 5.9% spread tonight.
- **MSFT and GOOGL:** 4.9-13.0 across the band, so every strike fails the 4.50 cap.
- **Replay EV/$:** INTC 1.13 (n 26, SE 0.11); AMZN 1.21 (n 19).

## 4. IV vs my RV20

| | IV | RV20 | Ratio |
|---|---|---|---|
| SPY | 14.2 | 10.0 | 1.42x |
| QQQ | 22.3 | 19.5 | 1.14x |
| IWM | 19.1 | 15.2 | 1.26x |

None is at or below RV20.

## 5. Ranked
1. **INTC, 1 lot.** Confidence 3. Not consensus.
2. **IWM, re-struck.** Confidence 2. A partial consensus match, with EV 1.00.
3. **AMZN put.** Confidence 2. The Anthropic link is not the thesis.
4. **No trade** on Wednesday and on MSFT/GOOGL.
