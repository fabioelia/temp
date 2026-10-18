# Options & vol memo (2026-10-18), derivatives/vol strategist

**Verdict: WAIT Mon 10/19.** Index vol isn't cheap. The edge is buying *cheap event vol at 14:43 on the print day* (META 10/21, MSFT 10/28). Sized to the chair's update ($1,000 budget; shot 1 ~$500, ≤$5/contract). RULES.md/config still show $500, so record the change first. Odds of tripling the budget: ~10%.

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
| MSFT 10/30 575C (10/28 → 10/29) | ~1.33 | +8.7 / +9.9% | −$137 if bought now | 7-16% | 4-11% | 0.7-4.5 |
| META 10/23 780C (10/21 → 10/22) | ~3.75 | +10.6 / +12.6% | −$130 if bought now | 9-16% | 4-8% | 0.7-1.55 |
| SPY 11/13 785C (→ 11/12) | 3.15 | +3.6 / +4.9% | $105/wk | 30% | 11% | 0.94 |
| NVDA 11/13 225C | 4.20 | +9.0 / +15.1% | $100/wk | 30% | 8% | 0.92 |
| QQQ 10/30 675P | 4.62 | −4.3 / −7.7% | $285/wk | 15% | 3% | 0.37 |

Breakevens: MSFT +8.9%, META +10.5%, SPY +3.3%. Only the cheap event vols show EV > 1. META falls below 1 with bootstrapped jumps, because its moves cluster at 8-11%.

## 4. Proposals
`OCC | expiry | strike | C/P | ref bid/ask (source, time) | IV | delta | OI | thesis + catalyst | entry | exit | conf`

1. `MSFT261030C00575000 | 10/30 | 575 | C | 2.47/2.70 (Cboe = Robinhood, 10/16 15:59 ET) | 36.7% | 0.14 | 15,741 | cheapest event vol; calls 3 vols under puts; print 10/28 after the close | Wed 10/28 14:43, after FOMC; re-strike ~8-9% OTM, ≤$2.50, floor($500/ask) contracts | sell everything 10/29 14:43 whether or not +100%/+200% is hit; no −50% stop overnight | 5`
2. `META261023C00780000 | 10/23 | 780 | C | 4.85/5.05 (Cboe = Robinhood, 10/16 15:59 ET) | 64.2% | 0.16 | 1,854 | cheap event vol; low EPS bar ($5.89 vs $7.25 a year ago); 8.8% off its high into the 10/21 print | Wed 10/21 14:43; re-strike ~9-10% OTM, ≤$5.00, 1 contract | sell everything 10/22 14:43 | 4`
3. `SPY261113C00785000 | 11/13 | 785 | C | 3.09/3.15 (Cboe = Robinhood, 10/16 16:14 ET) | 11.7% | 0.22 | 1,483 | cheapest vol on the surface: the relief shot | only after an S&P close above its prior 10-day closing high, by 10/30; 1 contract | +100% sell half, +200% the rest, −50% stop, out by 11/12 | 3`

## 5. How buyers lose here
**Buying the catalyst early and rich, then IV crush:** right on direction, still losing. The META 780C costs $5.05 now but ~$3.75 at Wednesday 14:43 if the price is unchanged; NFLX prices ±11% against ±7% history. Buy only on the print day, only at ≤0.9x, and sell at the next decision.

## Sources
Cboe delayed chains and ^VIX (cdn.cboe.com, 10/16 close, fetched 10/18); Robinhood read-only get_option_quotes (2026-10-16T19:59Z), get_earnings_results, get_equity_historicals; Yahoo chart API (^VIX9D, ^VIX3M, ^VVIX, ^SKEW); [days.to NVDA](https://days.to/nvidia-earnings); [NVDA IR notice](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Sets-Conference-Call-for-Second-Quarter-Financial-Results/default.aspx).
