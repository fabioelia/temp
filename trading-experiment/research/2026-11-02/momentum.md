# Momentum memo, Mon 2026-11-02 (Run B)

**Verdict: no trade. QQQ is 0.98 points above tomorrow's 200-day break level. The break put still loses, and the bounce still misses t 2.**

## 1. Re-run
Source: `scripts/momentum_200d_rerun.py` (11/01 spec unchanged; Yahoo bars to 11/02; Cboe 17:18 ET).
- QQQ 681.09 (snapshot OK), 200-day 679.82 (+0.19%, rising), -10.34% from its high.
- **11/3 break: a close below 680.11** (about 680.5 on 11/4 and 680.8 on 11/5 if flat). Any break is also a correction break.

| 10-day hold, M2 EV/$ | Sunday | Tonight (t) | Random |
|---|---|---|---|
| Break, put | 0.90 | 0.89 (-0.27) | 0.82 |
| Correction break, put | 0.72 | 0.71 (+0.35) | 0.82 |
| Reclaim, call | 1.49 | 1.46 (-0.58) | 1.07 |
| Pullback, call | 1.35 | 1.32 (+1.83) | 1.07 |

- No cell passes. With entry a day late, as in the shadow, the pullback call's t is 1.97.
- **Shadows:**
  - The 715C fired 11/2 at 14:44 (ask 8.98, `ideas-fired.csv`) and is now 8.31/8.55.
    - It stops on a close below 680.11.
    - +50% is 13.47; -50% is 4.49.
  - The put shadow fires if QQQ is below that day's level at 14:43.

## 2. Tape
- **Distribution days (25 sessions):**
  - QQQ 8, SPY 7, ^GSPC 6, ^IXIC 4, IWM 5.
  - Each is down one from 10/30 (9/28 aged out), except ^IXIC.
  - QQQ's -1.36% came on 0.63x the prior day's volume (Yahoo, possibly partial), so it does not count.
- QQQ (low 680.33, under 683.45) and ^IXIC made new correction lows. SPY and IWM held.
- **Read:** a Nasdaq correction testing its 200-day on lighter selling. SPY is -3.46%.

## 3. Ranked, 11/3-11/5
1. **No trade.**
   - Bounce-call Kelly: full $609, half $304, quarter $152, below one 710C ($891).
   - Break put: $0.
2. **Shadow QQQ261130P00675000** at 15.99/16.33 (Cboe; delta -0.41).
   - Trigger at 14:43: QQQ below its 200-day level.
   - EV 0.76.
   - Exits: +50%; stop on a close above the 200-day; -50%.
   - Confidence 1.
3. **C1 QCOM, 11/5:** the playbook's 11/20 put, IV at most 48%.
   - My post-hoc figure is about 45%.
   - Spreads are now 7-9%.
   - AMD costs at least $1,680, against full Kelly of at most $513.
- **Consensus** ("buy the 200-day" or "hedge the vote"): matches neither. Neither has an edge (t 1.83; EV 0.71).
