# Momentum memo, Tue 2026-10-20 (post-close, Run B)

**Verdict: HOLD shot 1; exits unchanged.** Day 2 held up, with no distribution, but it was quiet rather than strong.

| | Close | Volume vs Mon | Low vs rally low | 50-day |
|---|---|---|---|---|
| SPY | 769.05 (+0.34%) | 34.5M vs 38.7M | 764.26 vs 760.64 | 768.29 |
| Nasdaq | 26,424.82 (-0.02%) | 6.93B vs 7.54B | 26,179.74 vs 26,023.10 | 26,622 |
| QQQ | 717.63 (-0.10%) | 29.5M vs 37.2M | 710.39 vs 707.23 | 726.62 |

- SPY's first close above its 50-day since 10/15.
- Both dipped below Monday's low, then closed mid-range. For the second day, the high came at 10:30-11:00 ET (SPY 772.28) and faded.
- The leaders traded light: NVDA and MSFT each fell 0.3% on about 0.67x their average volume.

1. **Hold.**
   - **b) stays:** the rally low did not move. Raising b) to today's low invites a whipsaw. From about 10/26, a) is the tighter stop: a 1.87 bid means SPY ~763 on 10/27.
   - **c) stays at 768.37:** at flat prices the live 50-day is ~767.8 by 10/27, so 768.37 is slightly stricter.
2. **MSFT: no change.** Skip the buy if MSFT closes below its live 50-day (506.72; ~510.5 by 10/27).
3. **No.**
4. **Trigger: Thursday 10/22 (Day 4), after the META/TSLA reports.** A follow-through day (FTD) needs, versus Wednesday's close and on higher volume:
   - Nasdaq up 1.5% or more (26,821 if Wednesday is flat).
   - QQQ up 1.7% or more (729.8, which is above its 50-day).
   - SPY up 1.0% or more (776.7, where the call models ~6.06).
   - At 14:43, QQQ has already traded 70% of Wednesday's volume and sits in the top quarter of its range.

No proposals.

**Sources** (pulled 10/20, 17:16-17:20 ET):
- Yahoo chart API daily bars. Today's volume may still be revised.
- Robinhood get_equity_historicals: 30-minute bars; its daily bars for 10/14-10/19 match Yahoo.
- quotes.py (Cboe, 17:17 ET): 4.10/4.13.
- Moving averages and Black-Scholes values (IV 12.2%) are my own calculations.
