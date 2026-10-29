# Macro memo, Thu 2026-10-29 (Druckenmiller/Soros seat)

**Verdict: no macro veto on Friday's INTC C1 put. Buy 1 contract, at most $300. AMZN fails sizing; IWM is shadow only.**

## 1. Gates and credit
- **Thursday's gates all passed:**
  - core PCE 0.3%; ^TNX 4.99; CL=F 102.86; ^VIX 17.20.
  - BAMLH0A0HYM2 was 3.14 on 10/28 (FRED retry worked), inside the 3.46 gate.
  - IWM did not fire (284.01 against its 285.51 trigger).
- **Credit ignored GOOGL's −12.6%:** HYG closed 77.58 (prior 77.59) and LQD rose 0.14% (Yahoo+Cboe). BB OAS is at a month low of 1.84.
- **The stress sits elsewhere:** CCC OAS is 13.07, the 98th percentile of the year (FRED). European junk is at its "widest since 2009" (Bloomberg).
- **Liquidity is a little tighter (FRED):** reserves are down $136bn in three weeks, and SOFR is 3.94 against IORB at 3.90.
- **Read: unchanged.** This is an equity and IG-supply selloff, idiosyncratic, which is the setting C1 measures. HYG below 77.00 on Friday would make it systemic.

## 2. Weekend: do not skip, but size down
- **No measured weekend penalty:**
  - C1 events whose reaction day was a Friday: 70% continued, put EV 1.08 (n 71).
  - Monday-Thursday: 57%, put EV 0.96 (n 145).
  - Post-hoc, with t 1.1, so noise.
- **Gap-through-stop risk:** 2.8% of C1 puts were at or below 0.46 of cost after one close (worst 0.14). The pause line leaves $217.92 of room, so a $300 shot survives a −72% gap and a $400 shot only −54%.
- **The tails are two-sided:**
  - Iran is "drafting response to Vance letter" (Washington Times).
  - Over 250 sessions, CL=F ≤ −5% days lifted INTC 1.94% (n 13); CL=F ≥ +3% days cut it 1.45% (n 42).
  - OPEC+ is expected to hold (Coinpaper).
  - Midterms: +0.07% excess (z 0.08, test A1).

## 3. Ranked
1. **INTC 11/20 put, C1, confidence 4.**
   - Trigger at 14:43: INTC ≤ 84.70; delta −0.30 to −0.45; IV ≤ 0.70 (1.3 × RV20 of 54.3%); ask ≤ 3.00.
   - Skip if CL=F ≤ 98.00.
   - Consensus: matches. Edge: 62% continue (n 216), EV 1.00 at 1.31x RV20.
2. **AMZN: no trade.** A 0.30-delta put models at 4.34-5.68, above the caps.
3. **IWM 290C (2.71/2.76, Cboe): shadow.** IV 0.17 is above RV20 15.4%, so no edge.
- Anthropic is not the thesis of any idea.

**Sources:** FRED; Yahoo; Cboe via quotes.py; research.py headlines; earnings_analysis.py. Descriptive scripts (not committed): /tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/macro1029/
