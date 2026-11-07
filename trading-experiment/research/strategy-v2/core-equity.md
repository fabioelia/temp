# Strategy v2: core equity and idle cash (S1-S4), run 2026-11-07

Tests as fixed in `claims.md`. Open choices are fixed in `scripts/core_equity.py`'s docstring (`python3 -I scripts/core_equity.py DATA_DIR`).
Data: Yahoo daily adjusted closes to the 2026-11-06 close.

| ID | Verdict | Deciding numbers (pre-2010 / 2010-2026) |
|---|---|---|
| S1 SPY return > 0 over 1-12 mo | **WEAK** (7 of 8 cells pass) | Net mean, with Newey-West t: 1 mo +0.67% / +1.15% (2.5 / 4.9); 3 mo +2.1% / +3.6% (2.5 / 6.0); 6 mo +4.3% / +7.2% (2.3 / 6.6); 12 mo +8.5% / +15.0% (**1.98** / 6.7) |
| S2 200-day filter | **REJECTED** | Sharpe 0.43 vs 0.28 / **0.68 vs 0.76**. Max drawdown -21.7% vs -55.2% / -21.9% vs -33.7%. Full-sample Sharpe difference t +0.38. CAGR since 2010: 9.2% vs 13.9% |
| S2 Faber 10-month | **REJECTED** | Sharpe 0.61 vs 0.28 / **0.59 vs 0.76**. Drawdown -19.1% / -24.7%. t +0.82 |
| S3 SGOV/BIL | **WEAK, closest version** (issuer pages unreachable) | SGOV's worst total-return drawdown is -0.03%; Yahoo's -0.30% on 11/02 is a dividend missing from its data. Spread 2 bp (extended-hours snapshot). Pre-set yield proxy: last distribution x12 = 3.59% vs ^IRX 4.00%. That fails the 0.30-pt band because distributions lag the Sep-Oct rate rise. POST-HOC: October accrual 4.01%. Expense ratio: 0.09% (secondary sources). BIL fails: drawdown -0.78%, from fee bleed at zero rates |
| S4 QQQ for SPY | **WEAK** | Buy-and-hold Sharpe 0.07 vs 0.00 / 0.84 vs 0.76 (t +0.17), but max drawdown **-83%** vs -55%. 200-day filter 0.14 vs 0.08 / 0.71 vs 0.68 (t +0.06). Faber is worse pre-2010 |

**Costs:**
* 5 bp per round trip, netted from every S1 window.
* 5 bp per filter switch: 6.7 switches a year for the daily filter (0.34%/yr) and 1.5 for Faber.
* No commission. Quoted spreads are about 2 bp for SPY and SGOV.

**What the tests say:**
* Only plain index exposure has a measured positive return.
* The filters buy smaller drawdowns with lower returns, and do not raise Sharpe since 2010.
* QQQ's extra return is matched by extra risk.

## What this means for a $1,385 account
The best candidate is SPY, held fractionally, with any cash not in SPY in SGOV (about 4%/yr, about **+$55/yr**, nearly riskless).

Historical SPY outcomes, net of costs:

| Horizon | Average | 5th-95th percentile |
|---|---|---|
| 1 month | **+$13** (+$17 since 2010) | -$93 to +$99 |
| 12 months | **+$171** (+$208 since 2010) | -$278 to +$500 |

The 2010-2026 figures came from an unusually strong market, so plan on the full-sample ones.

**Realistic worst case:**
* a 1-in-20 year loses about $280;
* a 2008-style crash: -$454 in a month, -$656 over 12 months, and -$765 peak to trough (-55%), with years to recover.

The 200-day filter capped the worst 12 months at -$245, but it lowered the average to +$134. That is a preference, not a tested edge.

Information only: SPY is 0.7% above its 200-day average, and QQQ is 3.6% below.
