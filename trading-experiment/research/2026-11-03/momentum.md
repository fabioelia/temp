# Momentum memo, Tue 2026-11-03 (Run B, election night)

**Verdict: no momentum trade. The tape check on Wednesday's goal-budget SPY call finds no block.**

Source: `scripts/momentum_1103.py` (Yahoo bars to 11/03, closes match the snapshot; Cboe 17:21 ET; the `goal_odds.py` model).

## 1. Tape
- **Distribution days (25 sessions):** QQQ 8, SPY 7, ^GSPC 6, ^IXIC 5, IWM 5.
  - None changed. ^IXIC's 11/02 day counts now that full volume is in.
  - 11/03 rose on lighter volume. SPY's 9/30 day ages out Wednesday.
- **Rally attempt:** day 1 on 11/03 for SPY, QQQ, ^GSPC and ^IXIC. The lows to hold are SPY 750.36 and QQQ 680.33. IWM is on day 12. This is descriptive only.
- **Block test:** six states, fixed before the run.
  - t is the 10-session ^GSPC excess.
  - P and EV come from the goal model on matching entry days (1990-2026), priced on SPY261130C00768000 at 7.24/7.41 (Cboe).

| State at Wed 14:43 | t | P($2,200) | EV/$ |
|---|---|---|---|
| All days | - | 46.8% | 1.013 |
| SPY <= 746.81 | +0.53 | 52.0% | 1.084 |
| SPY >= 761.89 | +0.17 | 45.0% | 0.996 |
| SPY < 767.06, its 50-day (on now) | +0.14 | 51.1% | 1.065 |
| QQQ < 680.50 | -0.08 | 47.7% | 1.028 |
| SPY < 752.10, a new low | +0.71 | 57.3% | 1.156 |
| 6+ SPY distribution days (on now) | +0.64 | 48.3% | 1.026 |

- **No block.** No state reaches t <= -2 or fails the gates. Tonight's quote passes; Wednesday's live run decides.

## 2. Re-run (11/01 spec unchanged)
- QQQ 685.28, 200-day 680.14 (+0.76%, rising). **11/4 break: below 680.50**, which is also a B8.

| 10-day M2 EV/$ | 11/02 | Tonight (t) | Random |
|---|---|---|---|
| Break put | 0.89 | 0.88 (-0.27) | 0.81 |
| Correction-break put | 0.71 | 0.70 (+0.35) | 0.81 |
| Reclaim call | 1.46 | 1.42 (-0.58) | 1.05 |
| Pullback call | 1.32 | 1.28 (+1.83) | 1.05 |

- No cell passes. M3 is void: evening QQQ spreads are 12-33%.
- **Wednesday:** only the break-put shadow can fire. A needs 20 non-qualifying sessions, and R needs a B.
- The open 715C shadow (8.98) is at 7.17/9.82. It exits at 13.47 or 4.49, or on a close below 680.50.

## 3. Ranked
1. **No trade.** Full Kelly is $571, below one band call (705C at $1,363).
2. **Goal-budget call:** no tape block.
3. **Shadow QQQ261130P00675000** at 14.35/16.73 (Cboe).
   - Trigger: QQQ below 680.50 at 14:43.
   - Exits: +50%; stop on a close above the 200-day; -50%.
   - EV 0.88. Confidence 1.
- **Consensus** ("wait out the vote"): no edge either way (t +0.64).
