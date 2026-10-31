# Options & vol, Mon 2026-10-26 (Run B)

**Verdict: no trade Tue-Wed. IWM 11/20 call x2 on a Thu/Fri follow-through, re-struck. My 1.22 EV used fills above the GTC limits; with the limits it is 0.85-0.91 now and 0.92-1.11 on Thursday. Confidence 3.**

## 1. Candidates
Cboe chain 21:17 UTC; RV20 and θ/wk are my own (Yahoo closes, BS).

| Contract | Bid/ask | IV/RV20 | Δ | θ/wk | Filter |
|---|---|---|---|---|---|
| IWM 285C | 2.47/2.49 | 18.4/14.6 | 0.30 | -0.72 | pass; x2 $498 > cap |
| IWM 288C | 1.62/1.65 | 18.0/14.6 | 0.22 | -0.58 | pass |
| QQQ 750C | 3.61/3.65 | 19.9/18.9 | 0.19 | -1.41 | pass; ask > 3.60 |
| USO 175C | 6.05/6.40 | 55.7/33.9 | 0.39 | -1.44 | pass; IV > 48% |
| MSFT 580C | 4.35/4.60 | 33.6/19.6 | 0.18 | -1.79 | fail, 5.6% |
| GOOGL 345C | 4.20/4.40 | 39.9/21.2 | 0.23 | -1.48 | pass |

- **USO:** no strike has IV <= 48% (all 53-59%).
- **QQQ:** on a follow-through (QQQ >= 721) the 750C models 4.15-4.70, so it cannot fire. Δ >= 0.27 costs $565+.
- **MSFT tripwire:** fails on σ 5.68% > 5.0%, spread and ask. A flat print costs the 580C 69%.

## 2. Waiting cost, IWM 288C
- Flat to Thursday, the call goes 1.63 → 1.29: theta -0.25, and the FOMC bleed out of IV -0.10.
- The market prices ±2.1% (1 sd) through Thursday.
- Bought today, the call is -51% at 274, +5% at 279, +39% at 281. Its median Thursday mark is -9% to -2% (IWM 26 years, RUT 38).
- Waiting is about free.
- **Change:** at 279-281 the 288C models 1.65-2.43, so the 2.00 cap blocks the fill. Buy the lowest strike >= 287 asking <= 2.20 (Δ ≈ 0.27).

## 3. Event σ / median reaction (last 8 / 10 / 12; 8-K dates)

| Name | σ | Ratio |
|---|---|---|
| MSFT | 5.68% | 0.93/1.14/1.44 |
| GOOGL | 6.41% | 2.40/1.63/1.05 |
| AMZN | 8.53% | 1.45/1.45/1.31 |

None reaches 0.9 robustly.

## 4. Index vol
11/20 ATM IV vs RV20:
- SPY 14.8% vs 9.8% (VIX 1.9x);
- QQQ 23.5% vs 18.9%;
- IWM 20.0% vs 14.6%.

Contango does not make premium cheap.

## 5. Ranked
1. **IWM x2.** Not consensus. Follow-through-conditioned EV 1.07-1.11 (n 10-14, SE ~0.2). Thin. Confidence 3. No Anthropic link.
2. **No trade** on QQQ, USO and the three prints.

Sources: Cboe (quotes.py), Yahoo bars (17:20 ET), SEC 8-K 2.02 (research.py), Robinhood earnings, my replay.
