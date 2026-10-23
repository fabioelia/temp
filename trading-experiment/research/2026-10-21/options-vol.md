# Options & vol, Wed 2026-10-21 post-close

**Verdict: hold shot 1, and raise stop a) from bid ≤1.87 to ≤3.00; b) to e) and the 7.50 target stay. MSFT plan unchanged, confidence 3 (was 4). No rule break.**

## 1. Shot 1: 790C at 5.15/5.20, IV 12.1% (Robinhood = Cboe, 16:14:59 ET)
- **Theta (SPY flat):** −$123 to 10/28, then −$134 to 11/4.
- **A 7.50 bid needs SPY at:** 780 on 10/22, 780-781 on 10/23, 786-787 on 11/4. The record close is 779.09.
- **P(2x):** 9-17% by 10/23, 30-44% by 11/4.

Stop tests: 12,000 paths × 5 vol/drift cases, ranges across the cases. Changes are measured against the current stop.

| Stop | SPY trip 10/23 | P(2x) | P(exit ≤1.87) | EV/share |
|---|---|---|---|---|
| bid ≤1.87 | 760-762 | 29-47% | 29-35% | — |
| **bid ≤3.00** | 767 | −1.4 to −3.7 pts | 6-11% | −0.02 to +0.18 |
| bid ≤3.75 (cost) | 770 | −4.7 to −9.6 pts | 2-5% | −0.08 to +0.41 |
| SPY <768.37 | 768 | −1.6 to −4.7 pts | 14-19% | −0.03 to +0.17 |

- **Cost stop: no.** It sits inside one day's range, fires in 54-67% of paths, and decay alone trips it on 10/29.
- **Fixed SPY level: no.** The 3.00 bid stop beats it on both columns.
- **Bid ≤3.00: yes.** The worst case becomes −$75 instead of −$188.
- **Holding gives up EV** unless realized vol (8.6-9.5%) reaches the 11.7% implied. We hold for the 2x.

## 2. MSFT: the 580C is still the strike (8% OTM is 575.6)
- **Quote:** 4.10/4.55, OI 14,700. With MSFT flat it projects to a 3.26-3.37 mid at 15:30 on 10/28.
- **Spread:** every strike from 575 to 600 closed 7-10% wide, so the 5% spread rule is the likely veto.
- **Event σ:** 5.6-5.8%, about the same as Tuesday. MSFT's history is 8.5% RMS, 5.8% median.
- **After META:** MSFT options closed before META reported, and MSFT was flat after hours.
- **Why confidence 3:** every print this season moved less than implied: META +3.4% after hours vs 7.1%, NFLX −5.3% vs 11.1%, SpaceX +7.8% vs 8.1%, TSLA −0.5% after hours vs 7.0%.

## 3. Break the rule? No
Index calls are rich: 11.7% implied vs 8.6-9.5% realized.

## 4. Trigger
Thursday 14:43: SPY ≥780 sells at 2x; ≤767 trips the new stop.

`MSFT261120C00580000 | 2026-11-20 | 580 | C | 0.18 | 4.10/4.55 (Robinhood = Cboe, 15:59:59 ET) | 14,700 | 10/28 ~15:30: lowest ≥8%-OTM strike, ask ≤3.60, spread ≤5%, event σ ≤6.2%; else skip | sell 10/29 14:43 | 3`

**Sources:**
- Robinhood quotes and bars, after hours 17:15-17:17 ET.
- Cboe chains, 17:15 ET.
- META 8-K on EDGAR: item 1.01 confirms the Class C. The capex guide is not verified.
- Own Black-Scholes and Monte Carlo models.
