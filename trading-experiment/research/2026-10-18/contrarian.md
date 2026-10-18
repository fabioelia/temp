# Contrarian memo, Sun 2026-10-18

**Verdict: make one small buy Monday, in the most hated index; drop the crowded semis call.** Fear sits in hedges and headlines, not in what people own. A unanimous "wait for the flush" is the crowd's own trade.

## Where the crowd leans hardest (checked by me)
| Gauge | Reading |
|---|---|
| CNN Fear & Greed | **17.9, extreme fear**, at the 10/16 close (46.5 on 10/9), with SPY only 2.0% below its record. Six earlier cases since 2021 (below 20, SPY within 4% of its record): 22 sessions later SPY was higher 5 of 6 times and IWM 6 of 6. SPY fell another 2% or more only twice |
| Cboe SPX put/call | **1.46**: 97th percentile of 450 sessions since 1/2025, and the highest of 20 monthly expiries |
| Friday volume put/call | SPY 1.78, IWM 2.37, SMH 2.50, but **NVDA 0.72**: traders hedge the ETF and buy calls on the leader |
| Equity put/call; VIX curve | 0.65, 79th percentile (it reached 0.75 or more on 6% of days). VIX9D 20.12, VIX 19.99, VIX3M 20.50: flat, no panic |
| CFTC, 10/13 | Russell 2000 leveraged funds net short 91.6k contracts (6th percentile since 2017). WTI speculators net long only 40.6k (4th percentile since 2016, down from 111.7k on 9/8), with 2026-high shorts |
| BofA fund manager survey (10/2-10/8) | Tech net 37% overweight (the most since 8/2020); semis named the most crowded trade |
| Weekend | "Black Monday" headlines, yet after the mine strikes ES is +0.22%, RTY +0.51% and Brent -0.8% (Yahoo, 18:21 ET) |

## Challenges
- **"Wait Monday" is the lazy idea.** The hedge funds were the forced sellers, and they have sold: a Goldman prime-book headline (10/16) says they reversed all their AI buying since 2025. The seller still to come is the CTAs, below SPY ~747; I use that level as my stop, not my entry. Trigger A stacks four conditions.
- **The NVDA run-up call is the crowded idea.** NVDA 11/20 call open interest is 912k against 590k in puts. The "IV ramp" is not a gain: the earnings variance is fixed, and IV rises only because fewer days remain, so the holder still pays time decay. The best case for the other side: a week of "capex up, free cash flow down" (GOOGL Q2 FCF -$5.9B) would shrink the multiple. Demote the call; do not flip it, since puts trade at 44% IV.
- **MSFT on 10/28:** "cheap at 0.70x" rests on one print (+15.5% on 7/29). Without it, the RMS of the other six moves is 6.3% against 5.8% implied: almost no edge.
- **USO put:** it sits on the speculators' side, on a date the President telegraphed. April's -16% template had twice today's speculative length to liquidate.
- **SPY calls:** under the $5 cap, the 785C has delta 0.26, below the 0.30-0.45 band.

## Proposals (quotes are Friday 10/16 closes, Cboe delayed, pulled 10/18 18:33 ET)
1. `IWM261120C00275000 | 2026-11-20 | 275 | C | 0.42 | 4.67/4.74 (Cboe, 10/16 close; spread 1.5%; IV 19% vs 14.3% realized) | 3,361 | Mon 10/19 at the 14:43 decision, 1 contract at the live ask ≤$5.00, only if SPY ≥748 and IWM ≤274. If the ask is above $5.00, buy the 278C (3.38/3.46, OI 1,540). If SPY <748, stand aside for flows trigger A | -50% stop; half at +100%; the rest at +200% or the 11/5 pre-close; exit on an IWM close <262 | 4`
2. `USO261120C00180000 | 2026-11-20 | 180 | C | 0.28 | 3.80/4.05 (Cboe, 10/16 close; spread 6.4%, passes only the ETF limit) | 2,539 | Trigger by 10/30: Brent settles ≥$112, a Gulf export terminal is hit, or Kpler flows fall below 10 mb/d; buy at the next pre-close, 1 contract. It replaces the USO put; shot-2 money | -50% stop; half at +100%; the rest on the first ceasefire or US-strike headline, or by the 11/2 pre-close | 3`

**What changes my mind:** a Monday close below SPY 748 with VIX at 24 or higher. Then the flush is real and waiting is right. **Caveat:** six cases is a thin sample. I give #1 about a 30% chance of doubling.

## Sources
Cboe daily put/call statistics (cdn.cboe.com market_statistics/daily, 1/2/2025-10/16/2026) and delayed chains (10/18 18:30 ET); `quotes.py` (18:33 ET). CNN Fear & Greed graphdata (10/16 close). CFTC disaggregated and TFF reports (WTI 067651, RTY 239742), 10/13. Yahoo chart API (daily bars; futures 18:21 ET). Robinhood get_equity_quotes and get_earnings_results (MSFT). [BofA survey via Crypto Briefing](https://cryptobriefing.com/bofa-survey-fund-managers-overweight-tech/). Headlines via `research.py news`: Yahoo/BeInCrypto "Black Monday Fears Grip Wall Street…" (10/18 13:51 ET) and Seeking Alpha "…reversed all global AI net buying since 2025 – Goldman Sachs Prime Book" (10/16 09:24 ET). Committee memos 2026-10-18.
