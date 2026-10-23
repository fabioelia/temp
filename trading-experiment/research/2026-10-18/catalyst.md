# Catalyst memo (Sun 2026-10-18), event and earnings specialist

**Verdict: WAIT Mon 10/19; keep shot 1 for Wed 10/28.** Option quotes are Friday 10/16 closes.

## 1. Dates (Robinhood get_earnings_results, 10/18 ~18:00 ET; all verified, all after the close)
NFLX 10/20 · META/TSLA/LRCX/TXN/IBM 10/21 · MSFT/GOOGL 10/28 · AMZN/INTC 10/29 · AAPL 11/2 · AMD 11/3 · NVDA 11/17 · AVGO 12/9.
- **No brief date is wrong.** Two are missing: **AMD 11/3, on midterm day**, and CRWV ~11/9 (unverified).
- FOMC 10/27-28 is confirmed on federalreserve.gov. My 10/17 memo's NVDA 11/18 was wrong; it is 11/17.

## 2. SEC read (EDGAR, 10/18)
**No 8-Ks in 14 days** at MSFT, META, NVDA, AVGO (or GOOGL, AMZN, NFLX, TSLA): no pre-announcement and no new debt. **Open-market buys in 30 days: $0 everywhere.**

| | Insider sales (30d) | Filing highlights | For a 2-4 week option |
|---|---|---|---|
| MSFT | CFO $4.0M (10b5-1) | Q1 guide (8-K 9/2, Item 7.01 Reg FD): Azure +44-45% cc, capex >$50B. Debt $40B; purchase commitments $194B; unstarted leases $329B | Cleanest balance sheet, cheapest event vol. **Hold-through candidate** |
| META | $54M (10b5-1) | LT debt $84B vs cash $90B; commitments $349B; unstarted leases $279B + $68B | A free-cash-flow vote. Weeklies cost $10+ at 0.30 delta. Pass |
| NVDA | $315M, **$300M by director Stevens outside a plan** (9/18, ~$220) | 8-K 8/17 (Items 1.01/2.03): OpenAI lease guarantees capped at $105B, from 2028. 8-K 9/3 (8.01): Hugging Face, $11.9B. Supply commitments $279B (from $119B) | Pre-11/17 expiries carry no print premium |
| AVGO | $250M Samueli (10b5-1) | AI revenue guide $21.7B; RPO $179B; debt $59B | No catalyst in the window. Pass |

**Implication:** about $1.2T of contracted spend means capex can't shrink this quarter. "Capex held" is priced; **the reaction is the signal.**
- After the 4/29 prints: NVDA -4.6%, MSFT -3.9%.
- After 7/29: MSFT +15.5%; NVDA +5.7% over two sessions (Robinhood bars).

## 3. Shot 1: FOMC 2pm 10/28, then MSFT/GOOGL after the close, then AMZN 10/29
We see the Fed first. MSFT implies a 5.8% move against 8.2% historical (options-vol).

1. `MSFT261120C00580000 | 11/20 | 580 | C | 0.18 | 4.35/4.55 (Cboe = Robinhood, 10/16 15:59 ET) | OI 14,465 | Wed 10/28: decide after the press conference (~15:30, before 15:50); no hike, SPY not down >1.5% that day; re-strike to ask ≤$5, spread ≤5%, OI ≥1,000; 1 contract | sell everything at the 10/29 decision | conf 5`
   - Spread 4.5% passes. Delta is under 0.30 because the 0.30-delta 560C asks $9.00.
2. `NVDA261113C00225000 | 11/13 | 225 | C | 0.32 | 4.05/4.20 (Cboe = Robinhood, 10/16 15:59 ET) | OI 5,694 | same window, **instead of #1**; re-strike to delta 0.30-0.40, ask ≤$5 | sell at the 10/30 decision, after AMZN; -50% stop | conf 3`
   - Spread 3.6%. Expires before the 11/17 print.
   - My Black-Scholes estimate: ~$2.35 if flat on 10/28; doubles at about +4% by 10/30.

**Why not earlier:**
- Bought Tue 10/20, META 10/23 clears the 3-day rule, so the rule isn't the problem. Price is: the $5 strike (780C, 4.85/5.05) is 0.16 delta and breaks even at +10.7%.
- MSFT 10/30 spreads are 6-20%.
- LRCX fails liquidity (280C: OI 596, spread 11%).
- NFLX and TSLA event vol is rich.

**Change my mind:** if META and NVDA both close 10/22 up on the day, with NVDA ≥$214, take semis-ai's NVDA 11/20 230C instead.

**Rule note:** $320 held through MSFT's print is 16% of equity, above RULES.md's 10% earnings guideline (policy, not code). The chair should waive it explicitly.

Sources: Robinhood get_earnings_results, get_option_quotes (2026-10-16T19:59:59Z) and get_equity_historicals (10/18); EDGAR: MSFT 10-K and 8-K 9/2, META 10-Q, NVDA 10-Q and 8-Ks 8/17 and 9/3, AVGO 10-Q and 8-K 9/2, Form 4s (10/18 ~18:00 ET); Cboe chains via quotes.py (10/16 close); federalreserve.gov FOMC calendar (10/18).
