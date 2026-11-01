# Catalyst memo (Sun 2026-11-01)

**Verdict:** one conditional ticket (QCOM, Thu 11/5, conf 2), valid only if the chair admits an 11/20 expiry. AAPL fails the gate, and AMD costs 3-5x full Kelly. Expected C1 fills this week: about 0.05.

## Watchlist (`scripts/catalyst_watch.py`)
The 10/30 Yahoo closes and Cboe chains are 10/30 closing quotes, fetched 11/01 22:25-22:29 UTC. Dates: the Robinhood calendar (verified) and Google News; nothing else of the 25 reports.

| | AAPL | AMD | QCOM |
|---|---|---|---|
| Reacts | 11/3 | 11/4 | 11/5 |
| RV20 / gate | 14.5 / 18.8% | 67.6 / 87.8% | 51.1 / 66.5% |
| Band put IV, 11/20 · 11/27 | 31-34 · 30-31% | 70-71 · 65-67% | 65-66 · 60-61% |
| Post-gap IV, k | 25-29%, 1.70-1.98x | 56-65%, 0.83-0.97x | 48-56%, 0.94-1.10x |
| Full / half Kelly | $0 | $484-360 / $242-180 | $384-230 / $192-115 |
| Band put at -10% | $415-518 | $1,463-1,801 | $422-515 (-8%: $307) |
| Fits / P(≤-8%) | no / 5% | no / 21% | mild only / 23% |

- **Expiry conflict:** the brief's 21-35 days excludes 11/20 (15-17 DTE), and all band strikes on 11/27 and 12/4 have OI under 1,000. The playbook's "two to five weeks" admits 11/20. The chair should rule.
- **Gates:** the QCOM and AMD gates are wide only because 10/30 (-11.8%, -11.5%) is in the window. Rerun RV20 nightly.
- **Outside the sample:** PLTR, ANET, ARM and APP are descriptive only.
- **EDGAR (14 days):** no 8-Ks; the Form 4s are all 10b5-1 sales.

## Ranked
1. **QCOM261120P00145000 (or the 140P, if that is the band strike), 11/5 14:43, conf 2.** Reference 2.86/3.30 (Cboe).
   - **Trigger:** QCOM ≤ 0.92 × its 11/4 close; delta 0.30-0.45; OI ≥ 1,000; spread ≤ 5%; IV ≤ 0.94 × RV20 (about 48%) and ask ≤ 3.25 (the 16-DTE full Kelly is $326).
   - **Exit:** 11/12 14:43 with a -50% backstop; no take-profit.
   - **Edge:** model EV 1.18; bootstrap P(f* = 0) 1%.
   - **Consensus:** a generic AI would avoid options into prints or buy the dip; this matches neither.
2. **AAPL and AMD:** shadow only.

## Owner's choice
Under the rules, the best case is one QCOM put of about $310 with about $55 of model edge, so P($2,200) stays near zero. A goal budget buys variance, not edge. Its least-bad use is a C1 trade sized above Kelly, not a naked bet (random puts return 0.87 per $). For example, one AMD put ($1,460-1,800) after an 8% gap has a 36% model chance of reaching $2,200 and a 26-29% chance of losing half. Since the gap is only 21% likely, that is about 7.5% for the week, on a fragile model. My lean is evidence-only. If the owner wants the shot, he should name a dollar amount and limit it to C1 events.

*Sources: Robinhood; Google News; Yahoo; Cboe; EDGAR; sizing.py; earnings.md.*
