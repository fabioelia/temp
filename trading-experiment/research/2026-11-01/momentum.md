# Momentum memo, Sun 2026-11-01 (Run C)

**Verdict: no trade. No 200-day setup has a measured edge, and the with-the-tape put loses.**

## 1. Tape
Source: `scripts/momentum_200d.py` (pre-registered; Yahoo bars to 10/30).
- QQQ 690.49, 200-day 679.52 (+1.6%, rising), -9.1% from the high. **Break level Monday: a close below 679.81.**
- EV: QQQ 30 DTE, delta 0.40, 10-session hold, today's skew (IV 0.89x/0.80x ^VXN).

| QQQ setup (n) | 10-day excess (t) | EV/$ (random) |
|---|---|---|
| 200-day break, put (25) | -0.25% (-0.27) | 0.90 (0.83) |
| Break in a correction, put (18) | +0.40% (+0.35) | 0.72 (0.83) |
| Reclaim, call (20) | -0.72% (-0.58) | 1.49 (1.09) |
| Pullback to a rising 200-day, call (24), fired 10/30 | +1.95% (+1.82) | 1.35 (1.09) |

- **All four fail t >= 2.** Breaks do not continue (^GSPC since 1950: -0.21%, n 78), and the bounce does not generalize (^NDX 1985-99: -2.66%).
- **Kelly** (sizing.py): break put $0; bounce call full $638 (half $319), below one 715C ($1,073).

## 2. Ranked, 11/2-11/6
1. **No trade.** Shadow QQQ261204C00715000 at 10.50/10.73 (Cboe, 10/30 close).
   - Trigger at 14:43: QQQ between 679.81 and 700.31.
   - Exits: +50%; stop on a QQQ close below its 200-day; -50%.
   - Confidence 1.
2. **Shadow** QQQ261127P00680000 at 13.82/14.12 (Cboe).
   - Trigger: QQQ below 679.81.
   - Exits: +50%; stop on a close back above the 200-day; -50%.
   - Confidence 1.
3. **C1 AAPL, 11/3 (post-hoc arithmetic).**
   - Full Kelly covers one put only at IV/RV20 of about 1.03x (IV about 15%).
   - The 11/27 puts sit at IV 0.33-0.35, with OI at most 993.
   - AMD never fits; QCOM's weeklies have OI under 300.
- **Consensus** ("buy the dip", "hedge with puts"): both fail.

## 3. Owner's choice
**I recommend cash.**
- **Goal odds are drift, not edge.** A random QQQ call held 11/2-11/18 on $1,000 reaches $2,200 28-38% of the time and halves 36-41% of the time. That comes from the bull market's drift, and the bet goes against a correcting tape.
- **It forfeits the SPY race:** the call loses exactly when SPY falls, which is cash's only way to win.
- **If the owner still bets:** name the dollars, one shot, a call (random puts return 0.76 per $), and plan to lose it.
