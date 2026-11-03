# Options & vol, Tue 2026-11-03 (Run B): dry run of Wednesday's goal-budget check

**Verdict: only SPY261130C00768000 passes every gate tonight. On Wednesday, prefer 11/30.**

Data: Cboe delayed chain (`quotes.py option`, 2026-11-03 17:16 ET). Spot 754.35 and ^VIX 20.83 from the brief. Model: `2026-11-02/scripts/goal_odds.py`, entry 11/04, -50% stop, 10 sessions, 9,263 paths, seed 7.

## Candidate (passes all gates)
| Contract | Bid/ask | IV | Delta Cboe/model | OI | Cost | P($2,200) | P(beat SPY) | P(<$1,600) | EV/$ |
|---|---|---|---|---|---|---|---|---|---|
| 11/30 768C | 7.24/7.41 | 14.67% | 0.365/0.357 | 1,084 | $741 | **46.8%** (44.8-48.9) | 47.7% | 47.7% | **1.013** (0.986-1.042) |

## Near misses (fail OI tonight; shadow runs)
| Contract | Cost | Delta Cboe/model | OI | P($2,200) | P(beat SPY) | P(<$1,600) | EV/$ |
|---|---|---|---|---|---|---|---|
| 11/30 766C | $832 | 0.391/0.384 | 781 | 49.1% | 50.1% | 45.8% | 1.013 |
| 11/30 767C | $786 | 0.378/0.371 | 571 | 48.0% | 49.0% | 46.6% | 1.015 |
| 12/04 769C | $824 | 0.372/0.362 | 344 | 48.0% | 49.5% | 44.7% | 1.010 |
| 12/04 770C | $779 | 0.360/0.350 (fails in model) | 817 | 47.0% | 48.5% | 45.5% | 1.011 |
| 11/30 769C | $697 | 0.351/0.344 (fails in model) | 964 | 45.7% | 46.6% | 48.6% | 1.015 |

Also out: 765C/11-30 (delta 0.405, $881). Spreads are 1.4-2.6%.

## Recommendation for Wednesday at 14:43
* **Rule:** highest P($2,200) among candidates passing every gate, ties broken by lower premium. The delta gate must pass on both Cboe and the script, whose delta runs 0.007-0.010 lower.
* **Prefer 11/30.** It is the only expiry with in-band OI of 1,000 or more, and at matched delta it ties 12/04 for less money (46.8% at $741 vs 47.0% at $779).
* Higher delta scores higher (49.1% at 0.39), but within the CIs. Re-read OI Wednesday and re-strike if SPY moves.

## Flags for the red-team
* Every -50% stop-out ends near $1,547, below $1,600. The stop raises P(<$1,600) from 36.1% to 47.7% and cuts P($2,200) from 50.5% to 46.8%. It stays binding.
* No edge: the EV CI includes 1, and raw paths give 38.7% and 0.974.
* Consensus: a generic AI would buy SPY calls after the election. This matches it, with no measured edge. No Anthropic link.
