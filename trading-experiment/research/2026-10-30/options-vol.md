# Options & vol, Fri 2026-10-30 (Run B)

**Verdict: no trade Mon to Wed.**

## 1. C1 split (POST-HOC: input for Sunday's pre-registered rule, not a rule)
Same 216 events, abnormal return and put model as earnings.md; the run reproduces them. Files: `scripts/c1_vix_split.py` and `c1-vix-split.csv`. VIX is Yahoo's reaction-day close.

| Cell | n | Continued | Abnormal (t) | Put EV/$ (CI) |
|---|---|---|---|---|
| VIX ≤ 22 | 149 | 65% | +1.19% (3.0) | 1.02 (0.91-1.14) |
| VIX > 22 | 67 | 54% | +0.25% (0.3) | 0.96 (0.79-1.16) |
| Since 2010: ≤ 22 / > 22 | 125 / 46 | 66% / 59% | +1.40% / +0.46% | 1.05 / 1.04 |
| Gap 8-15% | 182 | 62% | +0.95% (2.8) | 0.98 |
| Gap ≥ 15% | 34 | 59% | +0.63% (0.6) | 1.11 |
| Entry at t+1 | 216 | 56% | +0.06% (0.2) | 0.92 |

* **The drift sits below VIX 22, but the difference is not significant** (bootstrap p 0.27). 21 of the 67 high-VIX events fall in 2007-09.
* **For the put, high VIX costs little:** -0.06 per $ overall (p 0.61) and -0.01 since 2010.
* **Wrong clock:** the gate read 22.58 at 14:44, while ^VIX closed at 19.42 (Yahoo 5-minute bars). On the tested variable, INTC was a VIX ≤ 22 event.
* **My lean for Sunday:** drop the gate. The IV ≤ 1.3x RV20 gate already prices vol. If the gate stays, test the t-1 close.
* **No day-late entries:** a Monday INTC put is not C1.

## 2. Shadow check: the first live C1 point
The INTC 11/20 60P was 2.42 at 14:43 (ideas-fired.csv). It closed 1.59/1.80, a 1.695 mid (quotes.py, Cboe): **-30%**. One case proves nothing.

## 3. Ideas
AAPL reports 11/2 and AMD 11/3, both after the close (Robinhood calendar).
1. **AAPL 11/20 put (C1), Tue 11/3 at 14:43.** Confidence 2; it probably fails its IV gate.
   - **Trigger:** AAPL at or below 0.92x its 11/2 close, on a 0.30-0.45 delta strike (about the 310P; ref 1.70/1.95, Cboe pre-print).
   - **IV gate:** at most 1.3x RV20 (14.5% to 10/30, so about 18.9%), against an ex-event IV of about 23%.
   - **Limits:** ask at most 4.50.
   - **Exits:** 11/10 at 14:43, or AAPL at or above 1.04x its 11/3 close, or the -50% backstop.
2. **AMD: no trade.** The in-band 470P asks 18.55, four times the cap.
3. **Nothing else:**
   - Event-vol ratios are AAPL 2.5 and AMD 1.5.
   - Index call IV is above RV20 (SPY 14% vs 11.6%).

**Consensus check:** a generic AI would "buy the tech dip". We do not match it. No Anthropic link.

Sources: snapshot; quotes.py (Cboe/Yahoo 10/30); Yahoo ^VIX bars; journal 10/30.
