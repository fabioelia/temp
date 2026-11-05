# Options & vol, Mon 2026-11-02 (Run B)

**Verdict: no trade. Nothing is cheap enough to buy; every legal Kelly is $0 or below one contract.**

Data: Cboe delayed chains (stamps 11/02 22:17 UTC, holding 16:15 ET quotes); Cboe ^VIX 21.15, ^VIX9D 22.46, ^VXN 30.89, RVX 23.95; Yahoo closes. Scripts: `scripts/ov_fetch.py`, `ov_events.py`, `ov_calls.py`, `ov_c1.py`.

## 1. Election and jobs straddles: rich
EV per $ at the ask, held to expiry:

| ATM straddle, bid/ask | Implied move | Midterm history, RV20 / index-scaled | VIX9D-inverted days 2011+ |
|---|---|---|---|
| SPY 11/4 753, 10.01/10.11 | 1.34% | 0.53-0.63 / 0.74-0.89 | 1.06 |
| SPY 11/6 754, 13.82/13.98 | 1.84% | 0.52-0.65 / 0.82-0.87 | 1.13 |
| QQQ 11/4 683, 16.40/16.65 | 2.42% | 0.53-0.68 / 0.67-0.82 | - |
| QQQ 11/6 684, 21.99/22.29 | 3.24% | 0.70-0.77 / 0.78-0.87 | - |

IWM is similar (0.57-0.94).

* The inversion is election-day premium. SPY's Tuesday move (0.88%) is priced at 1.7-1.8x midterm history (^GSPC 1970-2022, n 14). Friday's jobs day is fair on VIX scaling (1.0x).
* The only figures above 1 come from a post-hoc slice of inverted-front days, mostly vol spikes. On days led by implied vol, like tonight, they fall to 0.98 and 1.06; across all days they are 0.93 and 0.96.
* Best full Kelly is $393, against $1,398 for one straddle. Straddles also break the DTE and delta rules.

## 2. Index calls: fair, not cheap
Fair IV is the median realized vol over the next 11 sessions as a multiple of the index vol, applied to tonight's index level.

| Call, bid/ask, delta | IV/fair | IV/RV20 | Delta-hedged | Our exits | Kelly |
|---|---|---|---|---|---|
| SPY261130C00765000, 8.35/8.42, 0.39 | 0.97 | 1.32 | 1.00 | 0.975 | $0 |
| QQQ261130C00710000, 8.62/8.91, 0.31 | 0.99 | 1.02 | 0.93 | 0.92 | $0 |
| IWM261127C00283000, 4.57/4.76, 0.44 | 1.10 | 1.30 | 0.91 | 0.87 | $0 |

Backtests run 2010-26. The other 0.35-0.40 delta strikes fail the OI filter. On inverted days (post-hoc), our exits still return at most 1.00.

## 3. Ideas, Tue 11/3 to Thu 11/5
1. **Cash.** It beats SPY only if SPY falls 2.22% by 11/18, which happened in 15-17% of 12-session windows.
2. **C1 QCOM, Thu 11/5 at 14:43.**
   * Trigger: QCOM at or below 0.92x its 11/4 close. Buy one 11/20 put only if IV is at most 0.95x the pre-print RV20 (48.5% tonight), where full Kelly covers it; OI at least 1,000; spread at most 5%.
   * It is expected to fail: tonight's ex-event IV is 50.7% and the spread is 9%.
3. **AMD C1 is blocked.** A post-gap put costs $1,361 or more; full Kelly is at most $595.

**Consensus:** "buy election straddles" or "buy the QQQ dip". Neither has an edge (0.52-0.90; 0.92). No Anthropic link.
