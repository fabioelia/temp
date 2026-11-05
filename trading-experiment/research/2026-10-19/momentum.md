# Momentum memo, Mon 2026-10-19 (post-close, Run B)

**Verdict: HOLD shot 1 and add a tape stop.** Today counts as Day 1, but a weak one: lower volume, a gap that faded, and SPY turned back at its 50-day.

| | Close | Vol vs Fri | Close in day's range | 50-day | Prior 10-day closing high | Rally low |
|---|---|---|---|---|---|---|
| SPY | 766.48 | 38.4M vs 64.0M | bottom 14% | 768.37 | 779.09 | 760.64 |
| QQQ | 718.36 | 36.8M vs 66.7M | bottom 22% | 726.68 | 759.66 | 707.23 |

- **Gap and fade:** both closed below their opens. SPY's high (770.46, 11:30-12:00 ET) was above its 50-day; the close was below it.
- **Light leaders:** NVDA +1.4% on 0.85x average volume, still under its 50-day. SMH closed in the bottom 9% of its range.
- **Distribution:** 8 days on SPY volume, 6 by Wednesday.
- **FTD window:** Thu 10/22-Fri 10/30. Needs QQQ up 1.7% or more and the S&P up 1.0% or more, on higher volume.

1. **Hold.** Add two exits:
   - **Rally fails:** sell at that pre-close if the Nasdaq trades below 26,023.10 or SPY closes below 760.64.
   - **No FTD:** if none by the 10/27 pre-close and SPY is still under its 50-day, sell (~2.41) rather than hold through the FOMC.
   - Model: time decay lifts the 1.87 stop from SPY ~759 now to ~766 by 10/30. The 7.50 target needs SPY ~780.
2. **MSFT: no change.** Skip the buy if MSFT closes below its 50-day (506.20) before 10/28.
3. **No.** No FTD is possible before Thursday, and COP failed Sunday's conditions (145.24, 4.1M shares).
4. **Trigger:** the rally low, Nasdaq 26,023.10 (QQQ 707.23) or SPY 760.64.

No proposals.

**Sources** (pulled 10/19, 17:16-17:25 ET):
- Yahoo chart API daily bars.
- Robinhood get_equity_historicals: 30-minute bars for 10/19; daily bars for 10/12-10/16 match Yahoo within 0.6%.
- The brief's closing mark (3.58).
- Distribution days, moving averages and Black-Scholes values (IV 12.2%) are my own calculations.
