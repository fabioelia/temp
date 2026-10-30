# Catalyst memo (Fri 2026-10-30, Run B)

**Verdict:** I have no catalyst trade for Mon 11/2 to Wed 11/4. The only C1 setup next week that passes our rules is a contingent QCOM put on **Thu 11/5** (conf 2). There is no INTC entry on Monday. Anthropic is not the thesis of any idea here.

## 1. Next week's C1 prints
Figures come from `scripts/catalyst_prints.py` (Yahoo adjusted closes; Cboe close chains, 10/30).

| | Release | Reaction day | RV20 to 10/30 | Gate (flat to t-1) | -8% now | Chain P(≤-8%) | Post-gap put IV |
|---|---|---|---|---|---|---|---|
| AAPL | Mon 11/2, after close | Tue 11/3 | 14.5% | **18.8%** | 317.06 | 4.7% | 24.6-28.7%: **fails** |
| AMD | Tue 11/3, after close | Wed 11/4 | 68.9% | **87.8%** | 464.42 | 21% | 56-66%: passes |
| QCOM | Wed 11/4, after close | Thu 11/5 | 51.9% | **66.5%** | 151.61 | 23% | 48-56%: passes |

- **How to read the table:**
  - The live trigger is 0.92 × the t-1 close. Rerun the script each night with a fresh data folder.
  - Post-gap put IV is the ex-event IV × 1.04 (GOOGL and MSFT on 10/29) up to × 1.21 (INTC today: 64.5% against 53.3%, which is 1.19x its RV20 and inside its 70.6% gate).
- **QCOM** fell 11.1% today and **AMD** 10.9%. QCOM's RV20 to 10/29 was 31.0%, so its gate passes only because today's drop sits in the window.
- **AMD:** the in-band puts model at 14-23 a share, which breaks the $450 cap.
- **AAPL:** its event-vol ratio is 1.98, and 3 of its 90 prints gapped -8% or worse.
- **Outside the C1 sample** (Nasdaq dates only): PLTR 11/2; ANET and AMGN 11/3; ARM and APP 11/4.

## 2. INTC
- **SEC:** no new 8-K, only the 10/29 Item 2.02 and a routine 10-Q filed 10/30. No Form 4s in 30 days.
- **Analysts, all on 10/30:**
  - downgrades from Roth, BofA (to Neutral) and Freedom Broker;
  - price-target cuts from Truist, DA Davidson, TD Cowen and Citi;
  - Jefferies called Q4 a "substantial" reset.

  I found nothing new after the close.
- **No.** A Monday entry does not count as the reaction day. The confirmed rule enters only at the reaction day's 14:43 check, which was 10/30.

## 3. ^VIX gate (post-hoc, C1 sample, for Sunday)
| Reaction-day ^VIX | n | Continued | 5-day move (t) | Put EV |
|---|---|---|---|---|
| ≤ 22 | 149 | 65% | +1.19% (3.0) | 1.02 |
| > 22 | 67 | 54% | +0.25% (0.3) | 0.96 |

Since 2010 the put EV is 1.05 against 1.04. The data lean toward keeping the gate, but this is a post-hoc split and gives no verdict.

## 4. Ranked
1. **QCOM 11/20 put, Thu 11/5 at 14:43.** Conf 2.
   - **Trigger:** QCOM at or below 0.92 × its 11/4 close, the ^VIX gate if Sunday keeps it, and the put's IV at most 1.3 × RV20 (about 66%).
   - **Contract:** delta 0.30-0.45, OI at least 1,000, spread at most 5%, ask at most 4.50; one lot.
   - **Reference strike:** the 145P, at 2.86/3.30 (Cboe close, pre-gap). Use the 150P on a shallow gap and the 140P at -12%.
   - **Exits:** sell all at +50% (GTC). Move the stop to cost after a +40% check. Thesis stop: QCOM at or above 1.06 × its 11/5 close. -50% backstop. Out by 11/12 at 14:43.
   - **Edge:** C1 (n 216, 62% continue, t 2.5). The no-skew model gives EV 1.08-1.18.
   - **Risks:** tonight's close spreads ran 9-14%.
2. **AAPL and AMD:** shadow only (AAPL fails the IV gate; AMD breaks the cost cap).

**Consensus:** a generic AI would buy the chip dip, so this does not match.

**Sources:** Apple's IR notice (as quoted by MacTrast); AMD's 10/6 release (ir.amd.com); Qualcomm's release (via Investing News); Nasdaq earnings dates; EDGAR; Google News headlines (MarketBeat, TipRanks, Investing.com, Yahoo); Yahoo; Cboe.
