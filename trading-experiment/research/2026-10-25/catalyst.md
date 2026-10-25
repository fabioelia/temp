# Catalyst memo (Sun 2026-10-25, Run C)

**Verdict: wait Monday and Tuesday. Drop the MSFT call. One conditional 10/28 shot: an MSFT put, the uncrowded side of MSFT's cheap event vol.**

## (1) The week
- **Dates** (Robinhood, all company-verified, all after the close): MSFT and GOOGL 10/28; AMZN and INTC 10/29; AAPL 11/2; AMD 11/3. XOM and CVX report 10/30 before the open.
- **Filings:** no 8-K in 14 days for any of the six. Insiders over 30 days: zero open-market buys, only 10b5-1 sales (AAPL $91.9M, AMD $9.3M, MSFT $4.0M).
- **Capex** (latest 10-Q/10-K):
  - MSFT FY26: $115.9B vs $64.6B, with $26.7B still in payables (was $6.9B). 10/28 is its first print under the new segments.
  - GOOGL first half: $80.6B vs $39.6B, plus $49.6B of new equity in June. That is META's test.
  - AMZN first half: $96.3B vs $55.6B.
  - INTC cut capex to $6.2B from $8.7B.
- **Event vol:** implied σ from Friday's straddle strip vs close-to-close reactions.

| Print | Implied | Last-7 RMS | Ratio | Without the largest |
|---|---|---|---|---|
| MSFT | 5.5% | 8.3% | 0.67x | 0.89x |
| GOOGL | 6.3% | 5.5% | 1.15x | 1.51x |
| AMZN | 8.8% | 8.0% | 1.13x | 1.51x |
| INTC | 9.5% | 12.2% | 0.79x | 1.09x |
| AAPL | 4.3% | 3.5% | 1.24x | 1.99x |
| AMD | 9.0% | 10.6% | 0.85x | 1.01x |

- **Least crowded with an edge: none.**
  - INTC is liquid (95C 3.45/3.60, OI 12,722). Without its +23.6% reaction it is fairly priced: EV per $ 0.88-0.98.
  - XOM prices 2.0x its history and fails the spread rule.
  - MSFT's event vol is the only edge, and its uncrowded side is the put.

## (2) Proposal
`MSFT261120P00480000 | 11/20 | 480 | P | -0.17 | 4.80/5.10 (Robinhood = Cboe, 10/23 15:59:59) | 4,137 | 10/28 ~15:30 after the presser: MSFT (Robinhood) 500-550, live 10/30 strip σ <= 6.2%; buy 1 of the highest put <= 0.925x spot (walk 485->470) with ask <= 4.50, spread <= 5%, OI >= 1,000 | sell all at the 10/29 14:43 bid; >= 1.5x fill is the +50% bank; thesis wrong if MSFT >= 524.51, same exit; premium <= $450 is the backstop | not consensus (a generic AI buys MSFT calls); put skew 36-38% vs 31% IV, already modeled | event σ 0.67x/0.89x. One-day EV per $: 1.25 on the 8 actual reactions, 1.02 mirrored without the largest, 0.91 at implied. +50% in 3/8 (575C: 2/8). Flat print -53% (575C: -74%) | 3`

At Friday's close no strike passes (480P ask 5.10; 475P/470P 9-10% wide). Expect a skip by rule.

## (3) MSFT 10/28 call: drop
- It is the consensus AI trade.
- The vol is cheap, but the 575C's own odds fail. One-day EV per $ is 0.95 (mirrored, without July) and 0.81 at implied. It reaches +50% in only 2/8 reactions, and strikes were 10-15% wide.
- Consensus without an edge in the option itself: not a shot.

**Open XLE calls, if bought:** keep the exits through XOM/CVX (implied ~2.5%); score at the 10/30 14:43 check.

**Sources** (10/25, 18:15-18:40 ET): Robinhood earnings, bars and quotes; Cboe via quotes.py; EDGAR via research.py; Robinhood XBRL facts.
