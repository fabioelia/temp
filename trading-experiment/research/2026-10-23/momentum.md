# Momentum memo, Fri 2026-10-23 (post-close, Run B)

**Verdict: count zero, no index trade before Thu 10/29; keep MSFT; one conditional XLE shot.** Both indexes broke their lows: the Nasdaq 25,866.15 (vs 25,918.09) and the S&P 7,612.07 (vs 7,631.77).

## 1. My week
| Call | Result |
|---|---|
| No index/NVDA buy before an FTD (10/18) | **Right.** QQQ 760C 2.26/2.34 → 1.95/2.00; NVDA 210.96, never reclaimed 223.08. |
| Exit b), rally failure (10/19) | **Right.** Fired 10/22 at 2.93; the 790C bids 2.17 now. |
| Hold for 7.50; trail 768.30 (10/21) | **Wrong.** A 14:43 trail sells at the same 2.93 (SPY opened 766.37, at 762.11 by 14:44). Only selling Wednesday's 5.50 bid kept the gain, on a Day 3 I'd called light. |
| COP 150C (10/18) | **Right stock, wrong trigger.** The 3-day band never filled. COP broke out today (150.80, +3.55%); the call went from 4.45/4.60 to 6.30/6.60. |
| "Energy stalling", "USO no setup" (10/22) | **Wrong.** XLE +2.6% to a closing high, USO +4.3%, both ~1.2x volume. |
| TLT only on a close above 83.60 (10/22) | **Right.** Close 81.34; the 84C went from 0.48/0.50 to 0.35/0.36. |

**Change:** test each exit and trigger against one 14:43 check and overnight gaps. If a trail can't beat "sell now", propose selling (or half). Entry triggers become buy zones (pivot to +5%) that stay open until the pivot fails.

## 2. Monday
- **Count:** zero, on both. Earliest FTD: Thursday 10/29.
- **Distribution:** SPY 7, QQQ 7; not today (SPY 33.1M vs 54.1M).
- **Leaders:** energy only. Defensives faded (XLP -1.9% on 1.7x).
- **Trade:** index no. XLE yes, on a hold of its 68.78 flag pivot (it broke out on 1.24x).
- **Why XLE:** USO near-the-money calls exceed the $600 cap (175C 8.10/8.45).
- **Budget:** leaves ≥$437 above the floor.
- **Risk:** XOM/CVX report 10/30 before the open.

## 3. MSFT 10/28
**Keep.**
- 524.51 (the brief's 521.08 was Thursday).
- 50-day 508.43, ~510.7 by 10/28 if flat. The veto needs about -2.8%.
- Today: held 515.70 and closed at the top 13% of its range.
- Post-close quotes: the 570C and 575C are over 3.60; the 580C at 2.79/3.25 fits, but is 15% wide. Check the spread live.

`XLE261120C00070000 | 2026-11-20 | 70 | C | 0.49 | 2.00/2.15 (quotes.py Cboe, 10/23 17:17 ET; 7%) | OI 67,030 | buy 2 at the 10/26 or 10/27 14:43 if XLE is 68.78-72.22 and ask <= 2.40 (else the 71C/72C) | sell if XLE < 67.50 or bid <= 1.10; sell one at bid >= 3.20, then stop at cost; rest by 11/13 | 4`

**Sources** (10/23, 17:15-17:20 ET):
- Yahoo daily bars.
- Robinhood quotes.
- quotes.py.
- The journal.
- My own calculations: distribution counts, moving averages, Black-Scholes values.
