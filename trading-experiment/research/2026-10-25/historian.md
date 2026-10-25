# Historian memo, Sun 2026-10-25

Grades: B = 20+ episodes, C = n<20. Data pulled 10/25 (ET):
- Yahoo daily closes (18:32)
- Fed FOMC calendars (18:33)
- EDGAR 8-K 2.02 times (18:35)
- Cboe 10/23 closing quotes (18:35-18:45)

Option odds are my Black-Scholes repricing of historical paths at today's IV, raw and scaled to realized vol.

**Verdict: wait Monday to Thursday, and no MSFT shot. One fair-odds conditional for Fri 10/30, confidence 3.**

## 1. FOMC plus MSFT-earnings weeks (2004-26, n=24, B-)
The S&P is 2.5% off its high, QQQ 7.3% and IWM 9.6%.

| Fri-Fri | SPY | QQQ | IWM | MSFT | NVDA |
|---|---|---|---|---|---|
| Up | 54% | 50% | 46% | 42% | 42% |
| Median | +0.3% | -0.1% | -0.6% | -1.0% | -2.0% |
| >+2% / <-2% | 1/6 | 2/6 | 3/7 | 7/9 | 7/12 |

- GOOGL, AMZN and META had medians of +1.7% to +2.5%. VIX rose in 16/24 of these weeks.
- With the S&P 1.5-4% off its high (proxy 1994-, n=14, C), SPY topped +2% once.
- **Bought Monday, the payoff odds of reaching +50%:**
  - The contrarian's QQQ 750C: 1/24 by Friday, 3/24 by 11/18 (EV/$ 0.55).
  - IWM 285C: 4/24 by Friday.

## 2. Rotation persistence
| After a week where | n | Small caps beat S&P +1/+2/+3 weeks | XLE beats SPY +2/+3 weeks |
|---|---|---|---|
| RUT beat SPX by ≥2 pts (1988-) | 117 | 41/49/50% | – |
| IWM and XLE each beat SPY by ≥1.5 | 57 | 33/40/47% | 46/49% |
| IWM beat SPY by ≥2, XLE top sector | 21 | 57/52/57% | 38/43% |

- The base rate is 50%, so this is a coin flip with a first-week giveback.
- IV is rich against realized: IWM 19% vs 14.3%, XLE 30% vs 20-22%.
- **Bought Monday, odds of reaching +50%:** IWM 285C 15-41% (EV/$ 0.62-1.08); XLE 70C 25-33% (EV/$ 0.74-0.85).

## 3. MSFT
- **Last 12 prints:** +3.1, -2.7, +1.8, -1.1, -6.1, -6.2, +7.6, +4.0, -2.9, -10.0, -3.9, +15.5.
  - Median -1.9%, median absolute move 3.9%.
  - RMS 6.7%, or 5.2% without July. Over 88 prints, RMS 5.2%.
- **Implied event σ 5.44%**, so the options are fairly priced (1.05x ex-July).
- **The ~9% OTM 575C** (ask ~3.05 on 10/28 if MSFT is flat; the 570C's ~3.85 breaks the ceiling) doubles by 10/29 only on MSFT +5.0-6.3%.
  - That happened in 2 of 12 prints (17%, CI 5-45%) and 10-17% of 88. A flat print leaves 0.26-0.49x.
  - EV/$ is 1.36-1.65, but **0.50-0.73 without July**.
- **Consensus check: fails.** This is the generic AI trade, and its edge is one print.

## 4. Proposal
`IWM261120C00285000 | 2026-11-20 | 285 | C | 0.29 (≈0.26 10/30) | 2.61/2.65 (Cboe 10/23 close) | 32,173 | Fri 10/30 14:43 only: x2, ask ≤2.00 (model 1.92), spread ≤5%; skip on a Fed hike or SPY <747.93 | sell one at 1.5x, one at 2.0x; past +40%, stop at cost; thesis stop IWM ≤3.5% under entry; backstop bid ≤0.40x; out 11/18 | consensus: no, but last week's winner | one leg reaches +50% in 43-50% of paths, EV/$ 1.06-1.14 (event-week Fridays near a high, n=14, C), vs 25-37% / 0.66-0.93 any Friday | 3`

Fair odds, not an edge: take it only as a pacing shot.
