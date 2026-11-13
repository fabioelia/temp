# Catalyst memo (Fri 2026-10-30, Run B)

**Verdict:** No trade from Mon 11/2 to Wed 11/4. One contingent QCOM put on Thu 11/5 (conf 2). No INTC entry Monday. Anthropic is not the thesis.

## 1. C1 prints (`scripts/catalyst_prints.py`)
| | Reports, after close | RV20 | Gate | -8% now | P(≤-8%) | Put IV after gap |
|---|---|---|---|---|---|---|
| AAPL | 11/2 | 14.5% | 18.8% | 317.06 | 5% | 25-29%: fails |
| AMD | 11/3 | 68.9% | 87.8% | 464.42 | 21% | 56-66% |
| QCOM | 11/4 | 51.9% | 66.5% | 151.61 | 23% | 48-56% |

- **Inputs:** RV20 runs to 10/30; rerun nightly. Put IV after a gap is the ex-event IV × 1.04-1.21; INTC today was ×1.21 (64.5%, inside its gate).
- **QCOM's gate:** it passes only because today's -11.1% sits in the window.
- **AMD:** in-band puts cost $1,400 or more.
- **Outside the sample:** PLTR, ARM, APP.

## 2. INTC
- **Filings:** no new 8-K and no Form 4s.
- **Analysts (10/30):** downgrades from Roth, BofA and Freedom; target cuts from Truist, Citi, TD Cowen and DA Davidson.
- **Monday is not the reaction day,** so no entry.

## 3. ^VIX gate (post-hoc)
| ^VIX | n | Continue | 5-day (t) | Put EV |
|---|---|---|---|---|
| ≤22 | 149 | 65% | +1.19% (3.0) | 1.02 |
| >22 | 67 | 54% | +0.25% (0.3) | 0.96 |

Keep the gate. Since 2010 the EVs are 1.05 vs 1.04.

## 4. Ranked
1. **QCOM 11/20 put, Thu 11/5 14:43. Conf 2.**
   - **Trigger:** QCOM ≤ 0.92 × its 11/4 close; put IV ≤ 1.3 × RV20 (about 66%).
   - **Contract:** delta 0.30-0.45, OI ≥ 1,000, spread ≤ 5%, ask ≤ 4.50.
   - **Reference:** 145P at 2.86/3.30 (Cboe, pre-gap).
   - **Exits:** +50% GTC; stop to cost after +40%; thesis stop QCOM ≥ 1.06 × its 11/5 close; -50% backstop; out by 11/12.
   - **Edge:** C1 continuation plus a model EV of 1.08-1.18.
   - **Risk:** spreads were 9-14% tonight.
2. **AAPL and AMD:** shadow only.

**Consensus:** a generic AI buys the dip, so no match.

**Sources:** Apple IR (via MacTrast); ir.amd.com; Qualcomm (via Investing News); Nasdaq; EDGAR; Google News; Yahoo; Cboe.
