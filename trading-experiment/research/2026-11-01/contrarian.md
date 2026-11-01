# Contrarian memo, Sun 2026-11-01

**Verdict: no trade.** The fear is in the headlines more than in option prices. The contrarian edge I measured, QQQ calls after a first -8% close, fails my pre-registered bar, and full Kelly does not cover one contract.

## 1. The story and its price
- **Story:** "AI stocks just lost $5 trillion — but history says... sweetest stretch starts now" (Yahoo, 11/1), and "AI investors rush to hedge" (WSJ via Yahoo, 10/31). Hedging and dip-buying are both consensus; the dip case rests on a retired calendar argument.
- **Price** (Cboe 10/30 close, about 28 DTE, `contrarian_skew.py`; vol points):

| | ATM IV | RV20/RV10 | ATM/RV20 | 25d put skew | 25d call skew | RR25 (10/17) |
|---|---|---|---|---|---|---|
| QQQ | 24.5 | 22.9/28.0 | 1.07x | +4.3 | -2.9 | 7.2 (8.3) |
| SMH | 41.9 | 43.7/57.1 | 0.96x | +4.4 | -2.4 | 8.7 (5.8) |
| NVDA | 44.5 | 32.5/38.8 | 1.37x | +3.6 | -2.8 | 6.0 (5.6) |

- **Read:** hedging lifted the IV level, not QQQ's put skew (flatter than 10/17). QQQ and SMH price less vol than they just realized; VIX is in contango (19.25/19.42/20.78). NVDA's premium is its 11/17 report, inside every eligible expiry.

## 2. The test (fixed in the script before the run)
^NDX's first close 8% or more below its 252-session high: n 59 since 1986 (10/30 is the 60th, -9.1%). Buy next close, hold 10 sessions, 0.40 delta, 28 DTE (`contrarian_drawdown.py`, `contrarian_robust.py`).
- **^NDX:** +0.39% vs +0.64% on all days, up 61% vs 60%. No rebound edge.
- **Calls held:** 1.19 per $ (CI 0.91-1.49), VXN-priced 1.30 (n 29); without the best 3, 0.90-1.03. With our +50% take-profit, 0.89-0.92 since 2010.
- **Puts (the crowd's trade):** 0.68-0.89.
- **Kelly:** full $336-518 vs $1,123 a contract, so no trade. Verdict: WEAK.

## 3. Ideas, 11/2-11/6
1. **No trade.** Shadow: QQQ261130C00710000, 10.99/11.23 (Cboe 10/30). Mon 14:43 if QQQ <= 706.00 and IV <= 25%; hold 10 sessions. Confidence 2. It matches the generic AI's "buy the dip" by direction, with no proven edge.
2. **C1 as written** (AAPL, AMD, QCOM reaction days): full Kelly is at most $326 at 1.00x, so one contract only if ask x 100 <= full Kelly. Likely zero.

## 4. The owner's choice
Swinging big to beat a doubter is what trailing players do under contest pressure, and the friend expects that or nothing; a contrarian prices the dare instead. Evidence-only most likely means a cash finish, which beats SPY only if SPY falls another 2.6% (about 25%). A named goal budget is a gamble, not an edge, so put it where the price is least bad: one QQQ 710C (about $1,123), held 10 sessions with no take-profit. The model gives it 36-42% to reach $2,200 and 36-38% to lose half the stake, at about fair EV. Never the puts. My vote: cash, unless the owner names the budget in writing before Monday 14:43.

**Sources:** snapshot and odds from the brief; Yahoo bars; Cboe chains fetched 11/01 18:38 ET; headlines via research.py news. A headline citing "Anthropic debt concerns" is not used (conflict guardrail).
