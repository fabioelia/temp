# Momentum memo, Sun 2026-10-25 (week 44 plan)

**Verdict: one shot, IWM 285C, only on a Russell follow-through day (FTD). Withdraw XLE. COP has no contract we can trade. MSFT no.**

## 1. The week
- **Count:**
  - S&P 500 and Nasdaq are at zero. Friday's lows (7,612.07; 25,866.15) undercut their rally lows.
  - Earliest FTD: Thu 10/29, after FOMC and MSFT/GOOGL.
  - Russell 2000: Day 5, its 10/16 low (IWM 269.88) intact. Monday is Day 6.
- **Distribution days:** SPY 7, QQQ 7, IWM 5 in the last 25 sessions.
- **Leadership: energy only, and thin.**
  - XLE, XOM, CVX, COP, APA and USO broke out Friday.
  - Only XLE, APA and USO did it on volume (1.22-1.29x their 50-day). XOM was 0.87x.
  - Their strength lines against SPY are 6-11% below March highs.
- **Other leaders:** V, MA, AAPL and LLY reversed from highs, and all report inside the window.
- **IWM** sits below its 50-day (286.41). It is a laggard bounce, not a leader.

## 2. The setups after last week's move
- **XLE: the chart works, the option doesn't.**
  - 0.8% above the 68.78 pivot.
  - IV is 1.47x realized.
  - In 49 extended 52-week-high closes since 2006, +3.5% (about +50% on the 70C) came before -2.6% only 41% of the time. Break-even is ~49%.
  - XOM/CVX report 10/30.
- **COP:** only the 150C passes the spread rule, at 6.30/6.60, which is $660, over the $450 cap.
- **IWM:** a trigger with an edge. Spreads are 1-2%, IV 19% against 18.1% realized over 10 days.

`IWM261120C00285000 | 2026-11-20 | 285 | C | 0.30 (~0.37 at trigger) | 2.61/2.65 (quotes.py Cboe, Fri close, read 10/25 18:36 ET) | OI 32,173 | 14:43 on 10/26, 10/27, 10/29 or 10/30 (not FOMC Wed): IWM >= 1.25% over its prior close and >= 279.00 (200-day 278.23); IWM volume by 14:43 >= 75% of the prior session's (Mon 15.6M); no print below 269.88; ask <= 3.70, spread <= 5% (else the 287C, OI 20,145) | 1 contract: sell all at bid >= 1.5x fill; stop to cost past +40%; thesis stop IWM < 274.00 at 14:43; backstop bid <= 0.5x fill; out by 11/13 | consensus: no (the generic trade is MSFT/GOOGL/QQQ earnings calls) | edge: in 63 IWM FTDs since 2007, +1.8% came before -1.8% 56% of the time. 15-day median +2.26% vs +0.97% on all days. +1.6-2.1% is about +50% on this call, 274 about -50 to -55%; break-even ~51%. About +5 points (±6), thin | 4`

## 3. MSFT 10/28: no
- It is the consensus trade.
- The robust edge (0.87-0.94x) is not enough.
- No strike has passed the 5% spread rule since 10/19.
- The Nasdaq count is zero: no buying a print during a correction.

**Sources:**
- Yahoo daily bars, 10/25 18:31-18:35 ET. They match the snapshot.
- Cboe chains via quotes.py, 18:36 ET (Friday's close).
- Robinhood earnings calendar, 18:37 ET.
- My calculations: 20-year base rates, realized vol and Black-Scholes values.
