# Momentum memo, Thu 2026-11-05 (Run B, after the AI-stock rout)

**Verdict: no trade.** Buying calls after a -4% day priced below random entry. Script: `research/2026-11-05/scripts/momentum_1105.py` (spec fixed before
the first run; Yahoo bars, closes match the snapshot; Cboe delayed chain 17:19 ET).

## 1. Tape

| | Close | vs record close | 50-day | 200-day | Dist. days |
|---|---|---|---|---|---|
| SPY | 733.00 | -5.9% (779.09, 10/06) | 766.40 (-4.4%) | 730.15 (+0.4%) | 7 |
| QQQ | 647.05 | -14.8% (759.66, 10/06) | 722.27 (-10.4%) | 680.71 (-4.9%) | 9 |
| IWM | 270.98 | -11.2% (305.09, 8/14) | 282.63 (-4.1%) | 278.98 (-2.9%) | 6 |

- **The Nasdaq is in a correction:** ^IXIC is -11.9% and ^NDX -14.7% below their 10/06 record closes. IWM is too.
- SPY is 0.4% above its 200-day (Friday's level is 730.36), on 2.9x its average volume. ^GSPC fell -4.36%.

## 2. Base rates after a ^GSPC day of -4% or worse (the thin-sample rule did not trigger: 25 events since 1990)

| Horizon | ^GSPC mean (n 34, 1950-2026) | Up | Excess t | Call EV/$ (VIX) | Random entry |
|---|---|---|---|---|---|
| 1 | +0.47% | 65% | +0.51 | 1.05 | 0.96 |
| 5 | +0.51% | 50% | +0.38 | 0.93 | 0.92 |
| 9 | +0.48% (median +1.52%) | 62% | +0.14 | 0.84 | 0.87 |

- Calls: 30-DTE, 0.375 delta, event-close entry (n 25). Since 2010 (n 10): 9-session +1.08%, t 0.32.
- **Tradeable entry (Friday close, hold to 11/18):** EV 0.80 vs 0.88 for random entry (t -1.80), and 0.82 since 2010. Kelly $0.
- **At tonight's call skew** (0.78x VIX, from the 11/20 745C): 0.93 vs 1.00, still below random. **No edge.**
- Same as B1 (dip-buying calls 0.93 vs 0.96 random). No RSI(2) or follow-through day.

## 3. Shadow book

- **QQQ261204C00715000: EXITED** at the 11/5 close, Cboe bid 2.12 (ask 2.28, last 2.25 at 15:58), against an entry of 8.98. That is **-76.4% (-$686)**.
  Both exits fired (-50% level, QQQ close below its 200-day); the gap went through the stop.
- QQQ261130P00675000, which fired at 33.51 today: 35.64/37.11, open.

**Consensus** ("buy the dip, VIX 28"): my call differs. The measured EV is 0.80 per $, below random entry.
