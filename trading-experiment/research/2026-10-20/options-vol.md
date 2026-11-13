# Options & vol, Tue 2026-10-20 post-close

**Verdict: hold shot 1; keep exits a-e and the 7.50 target. MSFT plan unchanged. No rule break.**

## 1. Shot 1: 790C at 4.10/4.13 (Robinhood 16:14:59 ET)
- **Theta (SPY flat):** −$105 to −$113 this week (to ~3.06 on 10/27), then −$111 (to ~1.95 on 11/3).

| SPY at 14:43 | 10/21 | 10/23 | 10/27 | 10/30 | 11/4 |
|---|---|---|---|---|---|
| 2x (bid 7.50) | 779-781 | 780-782 | 782-784 | 784-786 | 786-788 |
| Stop (bid 1.87) | 759.5-761 | 761.5-763 | 764-765 | 767 | 771 |

- **Stop:** from Thursday, a) is tighter than b). With SPY flat, a) trips around 11/3-11/4.
- **Take-profit below 7.50: no.**
  - A partial sale is impossible with one contract.
  - In 20,000 paths, up to base-rate drift, a lower full target changed EV by 0.10 at most.
  - A 5.60 target raises P(win) from 25-29% to 37-42%, but cuts P(2x) to ~9%.

## 2. MSFT: 8% OTM is 574.4 (Robinhood 15:59:59 ET)
- **Today:** the 575C (5.40 ask) and 580C (4.55 ask) fail the ceiling. The lowest that fits is the 585C at 3.35/3.60 (OI 2,423).
- **Spreads:** every strike was 7-12% wide, so none passed the 5% filter.
- **10/28, MSFT flat:** the 580C projects to a 3.0-3.3 mid, so it fits.
- **Event σ:** 5.0-5.6% against an 8.5% history, about 0.6x.
- **Additions to the plan:** walk the strikes 575→580→585→590, and re-check the spread by 15:45.

## 3. Wednesday
- **Event σ vs history:** META 8.2% vs 9.3% (0.88x); TSLA 7.0% vs 7.5% (0.94x).
- **SPY:** priced at 0.69% a day through Thursday.
- **Break the rule? No.** META sits on the 0.9x line, and only $264 is free above the MSFT reserve.

## 4. Trigger
Thu 10/22 at 14:43, after META and TSLA:
- **Hold:** SPY ≥761 and the Nasdaq ≥26,023.10.
- **2x:** SPY ~780.

`MSFT261120C00580000 | 2026-11-20 | 580 | C | 0.18 | 4.05/4.55 (Robinhood, 15:59:59 ET) | 14,535 | 10/28 ~15:30: lowest ≥8%-OTM strike, ask ≤3.60, spread ≤5%, event σ ≤6.2%; else skip | sell 10/29 14:43 | 4`

Sources: Robinhood quotes, earnings dates and bars; Cboe chains and VIX (16:15-17:16 ET); my Black-Scholes model with a put-call-parity forward.
