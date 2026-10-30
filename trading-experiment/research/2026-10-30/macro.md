# Macro memo, Fri 2026-10-30 (Run B)

**Verdict: no trade Mon 11/2 to Wed 11/4.** Friday was an AI derating, not broad risk-off. I found no macro edge, and both C1 candidates fail.

## 1. Next week, ranked by likely move (checkable at 14:43)
1. **Iran/Hormuz and the Saudi strikes, risk both ways.**
   - Over 250 sessions, CL=F and QQQ correlate at −0.31; on days CL=F moved 4% or more, QQQ moved 1.18% on average, against 0.93% otherwise.
   - QQQ fell 2.9% on the 10/22 Saudi-attack day.
   - Lines: **CL=F ≤ 97.80 (deal) or ≥ 108.10 (escalation)**, ±5% from 102.95.
2. **Jobs, Fri 11/6.** SPY's median move on first Fridays since 2021 was 0.84%, against 0.56% on all days. The Fed's hold drew two hike dissents (FOMC statement). Veto: **^TNX ≥ 5.10**.
3. **Wed 11/4: midterm results and Treasury's 08:30 refunding statement.** Its financing estimates come Mon at 15:00, after the check (treasury.gov). The risk is that Treasury drops its "at least the next several quarters" coupon guidance.
4. **OPEC+ 11/1 matters least.** A hold is expected (EnergyNow), and Saudi output is 4.5 mb/d below quota (houseofsaud).

## 2. Stress check
Friday against the 29 days since 2021 when QQQ fell 3% or more:
- RSP −0.79% (median −2.77%).
- HYG −0.19% (median −0.95%).
- XLP +1.41% and XLU +0.67%; both rose on only 2 of the 29.
- VIX9D/VIX 0.99 (median 1.06).

**Credit is wide, though, and drifting wider.**
- BAMLH0A0HYM2 was 3.26 on 10/29: +12bp in a day, a top-3.4% move, and the 95th percentile of the year. CCC sits at the 98th.
- A HYG/^FVX nowcast puts Friday's HY spread near 3.34 ±0.05, below the 3.46 gate.

**Broad risk-off at 14:43 means any two of:** HYG ≤ 77.00; RSP down 1.5% or more on the day; ^VIX9D above ^VIX3M; BAMLH0A0HYM2 above 3.46.

## 3. Ideas
1. **No trade.** Implied vol is at or above 20-day realized vol everywhere I checked: USO 0.52 vs 0.27, TLT 0.13 vs 0.11, IWM 0.19 vs 0.16. QQQ exceeds the size cap.
2. **The C1 candidates fail.** AMD's delta −0.30 put asks 18.55, about 4x the cap. AAPL's gate needs put IV ≤ about 0.19, but its puts trade at 0.34-0.39.
3. **Shadow only:** TLT 11/20 82C at 0.72/0.74, if ^TNX ≤ 4.85 and HYG ≤ 77.00.

**The ^VIX gate (post-hoc):** C1 put EV is 1.02 when VIX is at or below 22 (n 149) and 0.96 above it (n 67), with t 0.55. That is noise, so the tested IV gate should stay.

Consensus ("buy the AI dip"): no match. Anthropic is not any idea's thesis.

**Sources:** FRED, Yahoo, Cboe (quotes.py), Robinhood, treasury.gov, federalreserve.gov. Descriptive scripts: /tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/macro1030/
