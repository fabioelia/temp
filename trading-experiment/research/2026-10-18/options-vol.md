# Options & vol memo (2026-10-18), derivatives/vol strategist

**Verdict: WAIT Mon 10/19.** Index vol isn't cheap. The edge is buying *cheap event vol at 14:43 on the print day* (MSFT 10/28). The ≥3-day expiry rule (`min_days_to_expiry`) forces later expiries: the MSFT edge survives, thinner, and META's does not. Sized to the $1,000 budget (shot 1 ~$500, ≤$5/contract). Odds of tripling the budget: ~10%.

## 1. Event vol: implied event σ vs. RMS of the last 7 reactions
| Report | Implied / history | Read |
|---|---|---|
| NFLX 10/20 | 11.1 / 7.3 (1.52x) | very rich |
| TSLA 10/21 | 7.6 / 7.0 (median 3.6) | rich |
| META 10/21 | 7.9 / 8.6 (0.91x) | cheap |
| **MSFT 10/28** | **5.8 / 8.2 (0.70x)** | cheapest |
| GOOGL 10/28, AMZN 10/29 | 6.7/5.5, 8.2/8.0 | rich, fair |
| INTC 10/29, AMD 11/3 | 9.6/12.2, 8.1/10.6 | cheap |
| AAPL 11/2, NVDA 11/17 | 4.2/3.5, 6.0/5.4 | rich |

**NVDA date conflict:** Robinhood lists 11/17 after the close ("verified"); the brief says ~11/18. Exit NVDA options by 11/17 14:43 until IR confirms.

## 2. Term structure and skew
- VIX 19.99 (14.84 on 10/9) ≈ VIX9D 20.12 < VIX3M 20.50; VVIX 110; SKEW 169. **Tails are expensive, so no index puts.** Universa buys tails at a VIX of 14, not after a 35% spike.
- SPY ATM 14.7% flat to 11/20 vs. 10.2% realized (20 days); 25Δ put 18.6% vs. call 11.9%. QQQ 22.4% (24.2% on 10/30) vs. 17.9% realized. IWM 20% vs. 14%: rich.
- NVDA 34-37% through 11/13, 40% at 11/20 (the print) vs. 24% realized (20 days) / 36% (60 days). SMH and XLE spreads are too wide for ≤$5 contracts.
- **Cheapest convexity:** the index call wing (at realized vol), then the event names at ≤0.9x. **Dearest:** index puts (1.8x realized) and NFLX.

## 3. Designs (Monte Carlo, zero drift; fat tails, leverage effect, event jumps from implied to historical size; buy at the ask, sell at the bid)
| Contract (in → out) | Cost | Move for 2x / 5x | Bleed | P(2x) | P(5x) | EV×prem |
|---|---|---|---|---|---|---|
| **MSFT 11/20 580C** (10/28 → 10/29); was 10/30 575C, refused by the 3-day rule | ~3.18 (was 1.33) | +6.5 / +10.5% (was +8.7/+9.9) | −$137 if bought now | 10-21%, central 16% (was 7-16%) | 3-9% (was 4-11%) | 0.84-1.86, central 1.23 (was 0.7-4.5, central 1.84) |
| META 10/30 800C (10/21 → 10/22); was 10/23 780C, refused | ~3.55 (was 3.75) | +9.8 / +13.4% (was +10.6/+12.6) | −$125 if bought now | 8-16% (was 9-16%) | 2-7% (was 4-8%) | 0.67-1.31, central 1.04 (was 0.7-1.55, central 1.24) |
| SPY 11/13 785C (→ 11/12) | 3.15 | +3.6 / +4.9% | $105/wk | 30% | 11% | 0.94 |
| NVDA 11/13 225C | 4.20 | +9.0 / +15.1% | $100/wk | 30% | 8% | 0.92 |
| QQQ 10/30 675P | 4.62 | −4.3 / −7.7% | $285/wk | 15% | 3% | 0.37 |

Breakevens: MSFT +10.2% (was +8.9%), META +13.3% (was +10.5%), SPY +3.3%. MSFT 11/06 is no alternative: 23-26% spreads, OI under 1,000, EV 0.63-0.74 at implied sizes. **Does the edge survive the extra week of premium?** MSFT: yes, thinner (central EV 1.23; 0.89 if MSFT only moves the implied amount). META: no (central 1.04, 0.91 at implied, 0.67 bootstrapped), so it is dropped.

## 4. Proposals
`OCC | expiry | strike | C/P | ref bid/ask (source, time) | IV | delta | OI | thesis + catalyst | entry | exit | conf`

1. `MSFT261120C00580000 | 11/20 | 580 | C | 4.35/4.55 (Cboe = Robinhood, 10/16 15:59 ET) | 29.5% | 0.18 | 14,465 | cheapest event vol (5.8% vs 8.2%); calls 3 vols under puts; print 10/28 after the close | Wed 10/28 14:43, after FOMC; re-strike to the 11/20 call ~9-10% OTM, 1 contract, ≤$5.00 limit on the $0.05 tick (est. ~$3.20) | sell everything 10/29 14:43 whether or not +100%/+200% is hit; no −50% stop overnight | 4 (was 5)`
2. `SPY261113C00785000 | 11/13 | 785 | C | 3.09/3.15 (Cboe = Robinhood, 10/16 16:14 ET) | 11.7% | 0.22 | 1,483 | cheapest vol on the surface: the relief shot | only after an S&P close above its prior 10-day closing high, by 10/30; 1 contract | +100% sell half, +200% the rest, −50% stop, out by 11/12 | 3`
- **META 10/21: no proposal.** META261030C00800000 (4.45/4.80, OI 1,965) clears the rule, but it has no edge left.

## 5. How buyers lose here
**Buying the catalyst early and rich, then IV crush:** right on direction, still losing. The MSFT 11/20 580C costs $4.55 now but ~$3.18 on 10/28 if the price is unchanged; NFLX prices ±11% against ±7% history. Buy only on the print day, only at ≤0.9x, and sell at the next decision.

## Sources
Cboe delayed chains and ^VIX (cdn.cboe.com, 10/16 close, fetched 10/18); Robinhood read-only get_option_quotes (2026-10-16T19:59Z), get_earnings_results, get_equity_historicals; Yahoo chart API (^VIX9D, ^VIX3M, ^VVIX, ^SKEW); [days.to NVDA](https://days.to/nvidia-earnings); [NVDA IR notice](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Sets-Conference-Call-for-Second-Quarter-Financial-Results/default.aspx).
