# Historian memo, Sun 2026-10-18

Grades: A = replicated research; B = 20+ episodes; C = n<20 or anecdote. Data pulled 10/18 18:27 ET from Yahoo daily (^GSPC, ^VIX, SPY, ^SOX, ^TNX, MSFT, META, CL=F) and EIA WTI spot (1986-). The calculations are mine. Option quotes are Friday 10/16 closes (Cboe via quotes.py).

**Verdict:** buy one SPY call Monday if the conditions below hold. Otherwise wait only for a flush. Do not wait for the "reclaim".

## 1. S&P near a record (1-3.5% below, VIX 17-24, 1990-2026, one entry per 22 sessions)
| Setup | n | New high within 22 sessions | Further -5% | Further -8% |
|---|---|---|---|---|
| All (B) | 108 | 60% | 17% | 7% |
| VIX up ≥20% in 5 days (now +35%) (B) | 48 | 69% | 15% | 4% |
| WTI up ≥30% y/y (now +71%) (B-) | 31 | 58% | 26% | 13% |

- The median wait for the new high is 7 sessions.
- The +1.3% "reclaim" (SPY ≈773) arrives before the -2% "flush" (≈748) 62-67% of the time. After a reclaim, SPY went on to reach 785 only 37-39% of the time; after a flush, 60-67%.
- **Seasonality**, 10/16 to +22 sessions (1950-2025): up 68% of the time, versus 62% for any 22 sessions. In midterm years: 15/19 up, mean +3.0% (B-, since many of those Octobers were bear-market lows).

## 2. Oil after shipping attacks
Seventeen episodes: the Tanker War (1987-88), 2019, 2021, the Red Sea (2023-25) and June 2025 (B-/C).
- **Oil:** up the next day 12/17 times (median +1.3%), but up 20 sessions later only 6/17 (median -1.5%).
- **S&P:** up 20 sessions later 12/17, which is the base rate. The 1987-88 losses had other causes (the crash, the trade report).
- **2026:** after 15 days of WTI +5% or more, oil was lower 20 sessions later 7 times, a coin flip.

**Why oil is falling now:**
- WTI already rose 10.4% last week.
- Mines that do not cut flows reduce uncertainty.
- Attacks bring escorts, IEA releases and pressure for a deal (WTI -8.6% on 6/23/25).
- Yahoo CL=F rolled to December, so it reads -3% against Friday's November settle when the real move is -0.7%.

## 3. Option odds
- **SPY, 5-week 0.25Δ calls** (synthetic backtest, 1993-2026, Black-Scholes, vol scaled to VIX or to realized; grade C+):
  - In today's setup they reached 2x 37-53% of the time, 3x 21-36% and 5x 7-20%.
  - With the default exits, 19-26% ended at 2x or better, and 63-70% at -50% or worse.
  - Literature backs this (index calls are near fair, the puts are the expensive side): Bondarenko 2014, Coval-Shumway 2001 [own memory], B.
- **MSFT/META 5-week calls** (vol = 1.1-1.3x realized): reached 2x 24-36%, 5x 3-11%. Single-stock OTM calls lose on average (Ni 2008, Boyer-Vorkink 2014 [own memory], A-).
- **MSFT 580C test** (2x needs +6.5%, 5x needs +10.5%):
  - Over the last 12 prints, 2 met the 2x move and 1 met the 5x move, i.e. 17% and 8% (95% CI 5-45%).
  - Expected value of 1.3-1.65x comes entirely from the +15.5% on 7/29/26; without it, 0.4-0.75x.
  - The RMS move over 12 and 16 prints, 6.7% and 6.4%, against about 6.0% implied ([earnings-watcher](https://earnings-watcher.com/wiki/msft-earnings-october-2026), C), means the options are fairly priced, not 0.70x cheap.
- **NVDA "capitulation":** after the 7 SOX 8-day losing streaks since 1994, only 2 were up 22 sessions later (C).

## 4. Ranking and proposal
History ranks the ideas: SPY call, then IWM (untested), then NVDA (C), then USO put (C), then MSFT (one outlier).

`SPY261120C00785000 | 2026-11-20 | 785 | C | 0.26 | 4.35/4.40 (Cboe delayed, Fri 10/16 close) | 12,330 | Mon 10/19 14:43, 1 contract, limit at the ask ≤$5.00, only if SPY 752-772 and VIX 17-24 (below 752: flows' flush trigger; above 772: skip) | -50% stop (≤2.20); half at ≥8.80, rest ≥13.20; sell if no S&P record by 11/4; out by the 11/18 pre-close | 5`

- **Liquidity check:** spread 1.1%. Delta is below the preferred range. The 784C (0.28Δ, 4.66/4.74, OI 1,140) is the alternative.
- **What the payoffs need:** 2x needs SPY ≈780 by 10/23 or ≈790 by 11/12.

**Sources:**
- Yahoo chart API; [EIA RWTC](https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RWTC&f=D)
- Robinhood get_earnings_results
- [earnings-watcher MSFT](https://earnings-watcher.com/wiki/msft-stock-after-earnings)
- Mine reports: Al Jazeera 10/17 22:02 ET, Times of Israel 10/18 17:00 ET
- Pre-2025 event dates are from memory, checked against price gaps.
