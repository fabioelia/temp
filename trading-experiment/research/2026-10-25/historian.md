# Historian memo, Sun 2026-10-25

Grades: A = replicated research; B = 20+ episodes; C = n<20. My data pulls (all 10/25, ET):
- Yahoo daily closes, 18:32. The 10/23 closes match the brief.
- Fed FOMC calendars, 18:33.
- EDGAR 8-K Item 2.02 dates and times, 18:35.
- Cboe 10/23 closing option quotes via quotes.py, 18:35-18:45.

I computed the option odds myself: historical paths repriced with Black-Scholes at today's IV, raw and scaled to today's realized vol (C+).

**Verdict: wait Monday to Thursday. No MSFT shot. One conditional idea for Fri 10/30, confidence 3. Its odds are fair, which is not an edge.**

## 1. FOMC plus MSFT-earnings weeks (2004-2026, n=24, B-)
Only the S&P is 2-3% off its high: it is 2.5% below its 10/06 close. QQQ is 7.3% below its high and IWM 9.6% below.

| Fri-to-Fri | SPY | QQQ | IWM | MSFT | NVDA |
|---|---|---|---|---|---|
| Up | 54% | 50% | 46% | 42% | 42% |
| Median | +0.3% | -0.1% | -0.6% | -1.0% | -2.0% |
| Above +2% / below -2% | 1 / 6 | 2 / 6 | 3 / 7 | 7 / 9 | 7 / 12 |

- The other reporters did better: GOOGL, AMZN and META had medians of +1.7% to +2.5%.
- VIX rose in 16 of 24 weeks.
- With the S&P 1.5-4% off its high (calendar proxy, 1994-2026, n=14, C), SPY was up 57% of the time but above +2% only once.
- **Option odds, entry Monday:**
  - QQQ 750C reaches +50% by Friday 1/24 times, and 3/24 by 11/18 (EV/$ 0.55). This is the contrarian's contract.
  - IWM 285C reaches +50% by Friday 4/24 times.

## 2. Does the rotation persist? (B, C for n=21)
| After a week where… | n | Small caps beat S&P at +1/+2/+3 weeks | XLE beats SPY at +2/+3 weeks |
|---|---|---|---|
| RUT beat SPX by ≥2 pts (1988-) | 117 | 41/49/50% | – |
| IWM and XLE each beat SPY by ≥1.5 | 57 | 33/40/47% | 46/49% |
| IWM beat SPY by ≥2 and XLE led the 9 sectors | 21 | 57/52/57% | 38/43% |

- Base rate is about 50%, so persistence is a coin flip, and the first week gives some back.
- Calls are rich against realized vol: IWM IV 19% vs 14.3% realized (20-day), XLE 30% vs 19.7-21.7%.
- **Option odds, entry Monday:**
  - IWM 285C reaches +50% in 15-41% of analog paths (base 24-36%), EV/$ 0.62-1.08.
  - XLE 70C reaches +50% in 25-33% (base 29-31%), EV/$ 0.74-0.85.

## 3. MSFT
- **Last 12 reactions:** +3.1, -2.7, +1.8, -1.1, -6.1, -6.2, +7.6, +4.0, -2.9, -10.0, -3.9, +15.5.
  - Median -1.9%, median absolute move 3.9%, up 5 of 12.
  - RMS 6.7%, or 5.2% without July. Over all 88 prints the RMS is 5.2%.
- **Implied event σ is 5.44%.** That is the 10/30 straddle less the 26-27% forward vol. The ratio is 0.82x on 12 prints and 1.05x without July, so the options are fairly priced.
- **The ~9% OTM 575C** (model ask about 3.05 on 10/28 if MSFT is flat; the 570C's ~3.85 breaks the 3.60 ceiling):
  - To double by 10/29 it needs MSFT up 5.0-6.3%.
  - That happened in 2 of the last 12 prints (17%, 95% CI 5-45%) and in 9-15 of 88 (10-17%). At the implied σ the odds are 13-18%.
  - A flat print leaves 0.26-0.49x.
  - EV/$ is 1.36-1.65 on the last 12 prints, but **0.50-0.73 without July 2026**.
- **Consensus check: fails.** It is the generic AI trade, and its edge rests on one print.

## 4. One conditional idea (fair odds)
`IWM261120C00285000 | 2026-11-20 | 285 | C | 0.29 (≈0.26 on 10/30) | 2.61/2.65 (Cboe, 10/23 close) | 32,173 | Fri 10/30 14:43 only: x2 at ask ≤2.00 (model 1.92 if IWM unchanged), spread ≤5%; skip on a Fed hike (federalreserve.gov) or SPY <747.93 (4% under the 10/06 close) | sell one at bid ≥1.5x fill, the other at ≥2.0x; once past +40%, stop the rest at cost; thesis stop: IWM at 14:43 ≤3.5% under the entry spot; backstop bid ≤0.40x; out 11/18 14:43 | consensus: no (the generic AI trade is MSFT/QQQ into the prints), but it was last week's winner, so watch for recency bias | one leg reaches +50% in 43-50% of paths, EV/$ 1.06-1.14 (event-week Fridays near a high, n=14, C) vs 25-37% and 0.66-0.93 for any Friday since 2004; +50% needs IWM +1.6% by 11/2 or +2.9% by 11/11 | 3`

**Ranking:** waiting, then this conditional, then any Monday call (IWM, QQQ, XLE), then MSFT.
