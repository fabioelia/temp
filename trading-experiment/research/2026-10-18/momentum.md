# Momentum memo, Sun 2026-10-18

**Verdict: WAIT on Monday.** A follow-through day (FTD) cannot come before Thu 10/22. The Nasdaq is in a correction and the leaders are defensive. Buy calls on a price trigger, not a date.

## Tape (10/16 closes; Yahoo and Robinhood bars agree)
| | Close | Prior 10-day closing high | 50-day | 200-day | Below 52-wk high | 3-month RS vs SPY |
|---|---|---|---|---|---|---|
| SPY | 763.25 | 779.09 | 768.50 | 725.01 | 2.4% | n/a |
| QQQ | 709.80 | 759.66 | 726.77 | 674.91 | 7.0% | -0.9 |
| IWM | 270.44 | 283.38 | 289.07 | 277.65 | 11.4% | -10.3 |
| SMH | 539.79 | 633.90 | 579.03 | 511.35 | 19.7% | -6.3 |
| NVDA | 214.13 | 239.24 | 223.08 | 202.97 | 12.0% | +2.5 |
| AVGO | 328.75 | 376.51 | 365.73 | 368.19 | 33.6% | -15.9 |
| MSFT | 529.05 | 543.45 | 505.53 | 435.25 | 4.5% | +28.7 |
| META | 709.33 | 762.50 | 655.24 | 631.98 | 9.0% | +7.0 |

- **Distribution days** (last 25 sessions; the count depends on the volume source):
  - S&P 500: 7 on index volume, 8 on SPY volume. Three drop out of the window by Wednesday.
  - Nasdaq: 6 on QQQ volume (Friday's 66.9M shares was the heaviest of the 25). Yahoo's composite volume shows 2.
  - IBD's own label: not found.
- **Support:** QQQ 700-705, with four lows there since 8/24. A break exposes the 200-day at 674.91.
- **Semis are not in bases.** SMH has 9 straight down closes on rising volume. NVDA is under its 50-day, after 3 down days on 118-127M shares (its average is 116M).
- **Leaders** (at or near highs):
  - Energy: XLE, XOM, CVX, COP and EOG.
  - Payments and pharma: V (a record), MA, ABBV and LLY. LLY's calls cost more than $5.00.
  - AAPL rose 0.4% Friday on 1.5x volume while QQQ fell 2.5%. It is capped at 348.15 and reports 11/2.
  - MSFT's breakout level is 553.82, but it reports 10/28.
  - The only proper base breakout with a liquid call under $5: **COP**. Its pivot is 141.62 (a 4.5-week, 13%-deep base). It broke out 10/14 and reports 11/5 before the open.

## FTD conditions
1. **Day 1:** Monday closes above Nasdaq 26,140 (QQQ 709.80). The rally low is then 26,023 (QQQ 707.23). If Monday closes down, the earliest FTD becomes Fri 10/23. Any trade below the rally low resets the count.
2. **FTD on Day 4-10 (10/22-10/30):** the Nasdaq closes up 1.5% or more (QQQ up 1.7% or more) on higher volume, and the S&P is up 1.0% or more. A QQQ close above its 50-day (726.77) makes it stronger.
3. **The 14:43 test:**
   - The Nasdaq is up 1.7% or more.
   - QQQ has already traded at least 70% of the prior session's volume.
   - The index is in the top quarter of its day's range.
   - AAPL, MSFT or NVDA is up on above-average volume.
   - If the FTD is confirmed only at the close, buy at the next 14:43, provided QQQ is within 1% of that close.
4. **Failure:** a Nasdaq close below the FTD day's low means sell.

## Proposals (Friday 10/16 close quotes; both pass the liquidity filter)
1. `QQQ261120C00760000 | 2026-11-20 | 760 | C | delta 0.12 now, ~0.22 at QQQ 728 | 2.26/2.34 (Cboe) = 2.30/2.34 (Robinhood, 16:14 ET) | OI 41,942 | entry: confirmed FTD, earliest Thu 10/22 14:43; take the highest-delta 11/20 strike with ask ≤$5.00 (model: ~$4.50 at QQQ 728) | exit: half at +100% (QQQ ~757), the rest at +200% or the 11/13 pre-close; sell on an FTD failure or at -50% | confidence 5`
   - If only the S&P follows through, substitute an SPY 11/20 ~792C (delta ~0.29 at SPY 775).
2. `COP261120C00150000 | 2026-11-20 | 150 | C | delta 0.44 | 4.45/4.60 (Cboe = Robinhood, 15:59 ET) | OI 13,321 | entry: Mon-Wed 14:43, only if all hold: COP at 146.60-148.70, at least 4.6M shares traded, XLE up, WTI at $95 or more; ask ≤$5.00 | exit: stop on a COP close below 141.62 or -50%; half at +100% (COP ~158); the rest by the 11/4 pre-close | confidence 4`
   - Oil fell on Sunday despite the mine headlines, so COP needs Monday's tape to confirm.

**What the committee may be getting wrong:** buying NVDA on 10/22 because of the date. It is a laggard under distribution. I would join only after an FTD, and only if NVDA reclaims 223.08 on more than 127.1M shares.

**Rules of thumb:** the FTD thresholds and the "Day 4" count are folklore, and many FTDs fail. Hence the stop at the FTD day's low.

**Sources** (pulled 10/18, 18:20-18:40 ET):
- Yahoo chart API daily bars, cross-checked with Robinhood get_equity_historicals.
- Robinhood get_earnings_calendar.
- quotes.py (Cboe delayed) and Robinhood get_option_quotes (10/16, 19:59-20:14Z).
- Futures from the brief.
- Distribution, RS, base and Black-Scholes figures are my own calculations.
