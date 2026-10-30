# Catalyst memo (Fri 2026-10-30, Run B)

**Verdict:** I have no trade for Mon 11/2 to Wed 11/4. The one C1 setup that passes our rules comes on **Thu 11/5**, a QCOM put (conf 2). There is no INTC entry on Monday, and Anthropic is not the thesis of anything here.

## 1. C1 prints (`scripts/catalyst_prints.py`)
| | Reports | Reaction | RV20 | Gate | -8% now | P(≤-8%) | Put IV after a gap |
|---|---|---|---|---|---|---|---|
| AAPL | 11/2 after close | 11/3 | 14.5% | 18.8% | 317.06 | 5% | 25-29%: **fails** |
| AMD | 11/3 after close | 11/4 | 68.9% | 87.8% | 464.42 | 21% | 56-66% |
| QCOM | 11/4 after close | 11/5 | 51.9% | 66.5% | 151.61 | 23% | 48-56% |

- **Inputs:** RV20 runs to 10/30; the gate holds it flat to t-1. The live trigger is 0.92 × the t-1 close, so rerun the script each night.
- **Put IV after a gap:** the ex-event IV × 1.04 (GOOGL and MSFT) up to × 1.21 (INTC today: 64.5%, inside its 70.6% gate).
- **QCOM** passes the gate only because today's -11.1% sits in its RV20 window (31.0% to 10/29).
- **AMD:** in-band puts model at 14-23, over the $450 cap.
- **Outside the sample** (Nasdaq dates only): PLTR 11/2; ARM and APP 11/4.

## 2. INTC
- **Filings:** no new 8-K (just the 10-Q on 10/30) and no Form 4s in 30 days.
- **Analysts, 10/30:**
  - downgrades from Roth, BofA and Freedom Broker;
  - price-target cuts from Truist, Citi, TD Cowen and DA Davidson.

  Nothing new came after the close.
- **No.** Monday is not the reaction day. The rule enters only at the reaction day's 14:43 check, which was 10/30.

## 3. ^VIX gate (post-hoc, for Sunday)
- **^VIX ≤ 22:** n 149, 65% continue, +1.19% (t 3.0), put EV 1.02.
- **^VIX > 22:** n 67, 54% continue, +0.25% (t 0.3), put EV 0.96.

The data lean toward keeping the gate. Since 2010 the put EVs are 1.05 and 1.04.

## 4. Ranked
1. **QCOM 11/20 put, Thu 11/5 at 14:43.** Conf 2.
   - **Trigger:** QCOM at or below 0.92 × its 11/4 close, and the put's IV at most 1.3 × RV20 (about 66%).
   - **Contract:** delta 0.30-0.45, OI at least 1,000, spread at most 5%, ask at most 4.50; one lot.
   - **Reference:** the 145P at 2.86/3.30 (Cboe close, pre-gap). Use the 150P on a shallow gap and the 140P at -12%.
   - **Exits:** sell at +50% (GTC). Move the stop to cost after +40%. Thesis stop: QCOM at or above 1.06 × its 11/5 close. -50% backstop. Out by 11/12.
   - **Edge:** C1 (62% continue, n 216, t 2.5) plus a model EV of 1.08-1.18.
   - **Risk:** tonight's spreads ran 9-14%.
2. **AAPL and AMD:** shadow only.

**Consensus:** a generic AI would buy the chip dip, so this is no match.

**Sources:** Apple's IR notice (via MacTrast); ir.amd.com; Qualcomm's release (via Investing News); Nasdaq; EDGAR; Google News; Yahoo; Cboe.
