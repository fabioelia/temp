# Contrarian memo, Sun 2026-10-18

**Verdict: buy one small call Monday, in the most hated index; drop the crowded semis call.** The fear is in hedges and headlines, not in holdings.

## Where the crowd is most one-sided
- **Headlines:** CNN Fear & Greed is at **17.9 (extreme fear)** at the 10/16 close, with SPY only 2.0% below its record. Since 2021 there were six such cases (below 20, SPY within 4% of its record). SPY was higher 22 sessions later in 5 of them and IWM in all 6. Only 2 went on to fall another 2%.
- **Index hedges:** Cboe's SPX put/call ratio hit **1.46**, the 97th percentile of 450 sessions since 1/2025. Friday's volume put/call: SPY 1.78, IWM 2.37, SMH 2.50, but **NVDA 0.72**. People hedge the ETF and buy calls on the leader.
- **No capitulation:** equity put/call 0.65 (79th percentile); VIX curve flat at 20.12/19.99/20.50 (9-day/30-day/3-month).
- **CFTC (10/13):** leveraged funds' net short in Russell 2000 futures is at the 6th percentile since 2017. Speculators' WTI net long is 40.6k contracts, the 4th percentile since 2016, down from 111.7k on 9/8.
- **BofA fund-manager survey (10/2-10/8):** a net 37% overweight tech, the most since 8/2020. Semis are named the most crowded trade.
- **Weekend:** "Black Monday" pieces, yet after the mine strikes ES is +0.22%, RTY +0.51%, Brent -0.8% (Yahoo, 18:21 ET).

## Challenges
- **"Wait Monday" is the lazy idea.** The forced sellers have already sold: Goldman's prime book says hedge funds reversed all their AI buying since 2025 (headline, 10/16). The seller still to come is CTAs below SPY ~747. That level is my stop, not my entry.
- **The NVDA run-up call is the crowded one.** NVDA 11/20 call OI is 912k against 590k in puts. The "IV ramp" is not a gain: the event variance is fixed and IV rises only because fewer days remain. Opposite case: "capex up, cash flow down" prints compress the multiple. Demote it; don't flip it (puts at 44% IV).
- **MSFT 10/28:** "cheap at 0.70x" rests on one print (+15.5% on 7/29). Without it, the other six moves have an RMS of 6.3% against 5.8% implied (0.93x), so there is no real edge.
- **USO put:** it sits on the speculators' side, on a date the President has telegraphed. April's -16% move had twice today's speculative length to unwind.
- **SPY calls:** under the $5 cap the 785C has delta 0.26, below the 0.30-0.45 band; IWM's 275C fits.

## Proposals (quotes are Friday 10/16 closes, Cboe delayed, pulled 10/18 18:33 ET)
1. `IWM261120C00275000 | 2026-11-20 | 275 | C | 0.42 | 4.67/4.74 (Cboe, 10/16 close; spread 1.5%) | 3,361 | Mon 10/19 at 14:43, 1 contract at the live ask ≤$5.00, if SPY ≥748 and IWM ≤274. If the ask is above $5.00, buy the 278C (3.46 ask, OI 1,540) | -50% stop; sell half at +100%, the rest at +200% or the 11/5 pre-close; exit on an IWM close <262 | 4`
2. `USO261120C00180000 | 2026-11-20 | 180 | C | 0.28 | 3.80/4.05 (Cboe, 10/16 close; spread 6.4%, passes the ETF limit only) | 2,539 | By 10/30, only on a Brent settle ≥$112, a hit on a Gulf export terminal, or Kpler flows <10 mb/d; next pre-close; replaces the USO put | -50% stop; sell half at +100%, the rest on the first ceasefire or US-strike headline, or by 11/2 | 3`

**What would change my mind:** a Monday close below SPY 748 with VIX ≥24. That is a real flush, so wait for flows trigger A. Six cases is a thin sample. I put the odds that #1 doubles at about 30%.

## Sources
Cboe daily put/call statistics (cdn.cboe.com, 1/2/2025-10/16/2026) and delayed chains (10/18 18:30 ET); `quotes.py` (18:33 ET); CNN Fear & Greed graphdata (10/16 close); CFTC disaggregated and TFF reports (WTI, RTY), 10/13; Yahoo chart API (daily bars; futures at 18:21 ET); Robinhood get_equity_quotes, get_earnings_results (MSFT); [BofA survey via Crypto Briefing](https://cryptobriefing.com/bofa-survey-fund-managers-overweight-tech/); headlines via `research.py news`: Yahoo/BeInCrypto "Black Monday Fears Grip Wall Street…" (10/18 13:51 ET) and Seeking Alpha "…reversed all global AI net buying since 2025 – Goldman Sachs Prime Book" (10/16 09:24 ET); committee memos 2026-10-18.
