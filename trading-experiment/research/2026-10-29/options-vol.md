# Options & vol, Thu 2026-10-29 (Run B)

**Verdict: Friday, 1 INTC 11/20 put. AMZN only if INTC fails a filter.**

Sources: Cboe chains via quotes.py feed, 21:17 UTC (16:00 pre-print quotes; IV overstated). Yahoo closes; ^IRX 4.00%. Numbers from `scripts/options_vol_gate.py`.

## 1. Pre-print RV20 (closes 10/01-10/29)
| | RV20 | Gate 1.3x |
|---|---|---|
| INTC | 54.3% | **70.6%** |
| AMZN | 36.3% | **47.2%** |

## 2. Entry IV and contracts
- **Ex-event IV** (term structure): INTC 52%, AMZN 29%. Tonight's 11/20 ATM (66%, 51%) includes the print.
- **Calibration:** GOOGL's in-band 11/20 puts closed at 1.03x its ex-event IV; MSFT 1.04x.
- **Expected IV:** INTC 54% (stress 62%), AMZN 30% (35%). **Both pass the gate, even stressed.**
- **INTC** (74.62 Robinhood, 76.51 Cboe after hours): 72.5P (OI 3,856), mid 2.76, Δ-0.38, ask about 2.83 (3.40 stressed): 1 lot.
  - 75P (OI 13,281) at 76-78.7; 70P (12,678) at 71.3-73.5.
  - 11/27 adds nothing: only its 75P has OI 1,000+.
- **AMZN:** -6.0% after hours fails the 8% gap (needs 224.29 or lower). Then the 215P fits at ~220-223 and the 210P at ~215-218; elsewhere the in-band ask is above 4.00.
- **Spreads:** GOOGL's reaction-day close ran 4-8%, so the 5% test is live.

## 3. EV per $ (review's `option_ratio`, down gaps of 8%+, n 216)
Reproduces 1.0027 at 1.3x; break-even 1.30x (1.25x at a 5% spread).

| | IV/RV20 | EV (CI) | 21 DTE, 5% spread | Stress | Stress, IV -10% held |
|---|---|---|---|---|---|
| INTC | 0.99 | **1.14** (1.01-1.29) | 1.13 | 1.04 | 0.96 |
| AMZN | 0.83 | **1.27** (1.09-1.45) | 1.26 | 1.15 | 1.07 |

**Both clear 1.0 in a no-skew model.** Median 0.81, wins 42%: a lottery shape.

## 4. Ranked for Fri 10/30
1. **INTC 11/20 put**, 1 lot. Conf 4.
   - Trigger: INTC 84.70 or lower; IV at most 70.6%; ask at most 4.00 (2 lots if 2.00 or less); spread at most 5%.
   - Exits: GTC +50%; cost stop at +40%; thesis stop INTC 1.07x its 10/30 close; -50% backstop; out 11/6 14:43.
2. **AMZN 11/20 215P/210P**, only if INTC fails. Conf 3. AMZN 224.29 or lower; IV at most 47.2%; thesis stop 1.04x; same exits.

**Consensus:** "don't chase the drop", so no match. Edge: C1 (62% continue) plus these EVs; INTC IV is at RV20. The Anthropic link is not the thesis (AMZN: miss, capex).
