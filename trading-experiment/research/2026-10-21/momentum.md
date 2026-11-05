# Momentum memo, Wed 2026-10-21 (post-close, Run B)

**Verdict: HOLD; trail b) to SPY 768.30; c) becomes "no FTD by 10/27".** Day 3 made a higher high and a higher low, on light volume.

| | Close | Vol vs Tue | Low | 50-day |
|---|---|---|---|---|
| Nasdaq | 26,702.86 (+1.05%) | 6.87B vs 7.66B (prelim) | 26,507.07 | 26,627.56 |
| SPY | 773.09 (+0.53%) | 31.6M vs 35.0M | 768.40 | 768.34 |
| QQQ | 725.20 (+1.05%) | 31.5M vs 30.5M | 719.72 | 726.75 |

- The Nasdaq closed +1.05%, not +1.25%. The brief's figure was the 14:44 print; the index faded in the 15:00 hour.
- The Nasdaq closed above its 50-day for the first time since 10/15. SPY's low touched its own 50-day and held.

1. **Hold.**
   - **b):** sell if SPY is below 768.30 at the 14:43 check. That is today's low, and the 50-day sits there too. The call models about at cost there on Thursday (3.74). At the old 760.64 it models about 2.2, the same as a). The Nasdaq 26,023.10 leg stays.
   - **c):** sell at the 10/27 14:43 check if no FTD has come. The trail already covers its 50-day half. At a flat SPY the call models about 4.1 then.
2. **MSFT: no change.** The skip line rises to ~510.6 by 10/27. The 580C showed 4.10/4.55 after hours (quotes.py, 17:18 ET), already above the 3.60 ceiling.
3. **No.**
4. **Trigger: Thursday's FTD test (Day 4).** Versus Wednesday's close:
   - Nasdaq closes at 27,103 or more (+1.5%) on volume above Wednesday's final figure.
   - At 14:43: QQQ at 737.5 or more (+1.7%) on 22.1M shares or more.
   - META alone is not enough: its after-hours +3.6% (722.69, 17:15 ET) adds about 0.15 points (my estimate), and LRCX's -5.5% (246.50) offsets some.
   - If SPY gains 1%, the call's bid reaches about 7.50, so e) would fire.

**Sources** (10/21, 17:15-17:19 ET):
- Yahoo daily bars. Tuesday's preliminary 6.93B was revised to 7.66B, so Wednesday's Nasdaq volume may change too.
- Robinhood: 30-minute bars and quotes.
- The SPY option quote was rate-limited (Cboe 429), so I used the brief's 5.175 mark.
- Black-Scholes values (IV 12.45%, fitted to that mark) are my own calculations.
