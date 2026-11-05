# Options claims D1-D4 (2026-10-29)

**Model as registered:** Black-Scholes at that day's VIX for every strike (r = ^IRX, q = SPY yield), 30 DTE, re-priced at each close. Close fills pay half a 3% spread each way. t is Newey-West (lag 2x hold). All rows (with last-10y and post-hoc) are in `options-results.csv`; code: `scripts/options_*.py`.

| Claim | Verdict | Key numbers |
|---|---|---|
| D1 VRP | **CONFIRMED** (in-model) | VIX > next-21d RV 86% of days, +4.1 pts (t 13.5). 0.35Δ call: 0.83/$ over 10d (t -8.9), 0.65 to expiry |
| D2 low IV | **REJECTED** | IVR<25%: 0.84 vs 0.83 (t 0.4); expiry 0.60 vs 0.66 (t -1.7), wrong sign |
| D3 far OTM | **CONFIRMED** (in-model) | 0.10Δ 0.49 vs 0.50Δ 0.93 (t -37); to expiry 0.10 vs 0.88, hit 1.8% |
| D4 exits | **WEAK** | Rules 0.92 vs hold 0.87 (t 2.7), but EV/$ < 1; all from the -50% stop |

## D1: VIX vs realized vol; EV/$ for buying

| Period | n | VIX-RV (IV>RV) | 0.35Δ 10d EV/med/hit | 0.35Δ expiry EV/hit | ATM call 10d | ATM put 10d |
|---|---|---|---|---|---|---|
| 1990-2026 | 9252 | +4.1 (86%) | 0.83/0.68/30% | 0.65/25% | 0.93 | 0.78 |
| 1990-2009 | 5043 | +4.4 (87%) | 0.80/0.61/28% | 0.58/21% | 0.90 | 0.79 |
| 2010-2026 | 4209 | +3.8 (85%) | 0.87/0.75/34% (t -4.9) | 0.73/29% | 0.98 (t -1.0) | 0.76 |
| Last 5y | 1232 | +3.6 (84%) | 0.84/0.69/32% | 0.70/26% | 0.95 | 0.80 |

The spread costs 0.03/$ (gross 0.86). ATM call alone: WEAK (decayed after 2010; gross 1.01).

## D2: IV rank (252-day min-max) < 25%, 0.35Δ call

| Period | 10d low vs all (b, t) | Expiry low vs all (b, t) |
|---|---|---|
| 1991-2026 | 0.84 vs 0.83 (+0.01, 0.4) | 0.60 vs 0.66 (-0.13, -1.7) |
| 1991-2009 | 0.81 vs 0.80 (+0.02, 0.4) | 0.52 vs 0.59 (-0.14, -1.3) |
| 2010-2026 | 0.86 vs 0.87 (-0.03, -0.7) | 0.66 vs 0.73 (-0.21, -2.1) |
| Last 5y | 0.82 vs 0.84 (-0.08, -0.8) | 0.59 vs 0.70 (-0.30, -1.6) |

Low IV still overprices realized vol (VIX/RV 1.44 vs 1.37). ATM options and a post-hoc percentile rank agree.

## D3: calls by delta, 1990-2026 (EV/$, hit)

| Δ | 0.10 | 0.20 | 0.30 | 0.40 | 0.50 |
|---|---|---|---|---|---|
| 10d | 0.49, 12% | 0.67, 20% | 0.79, 27% | 0.87, 34% | 0.93, 39% |
| Expiry | 0.10, 2% | 0.30, 9% | 0.54, 20% | 0.74, 30% | 0.88, 39% |

0.10Δ minus 0.50Δ (1990-2009 / 2010-26 / last 5y): 10d -0.40/-0.48/-0.46, expiry -0.67/-0.91/-0.83.

## D4: SPY 0.40Δ calls, every close 2010-2026 (n 4209), 15-session time exit

| Rule | EV/$ | Med | Hit | p10 | p90 | vs hold (t) | vs hold 1993-2009 | vs hold last 5y | vs hold, real skew† |
|---|---|---|---|---|---|---|---|---|---|
| R0 hold to day 15 | 0.870 | 0.66 | 36% | 0.05 | 1.97 | - | (0.756) | (0.826) | (1.218) |
| R1 +50% | 0.872 | 0.77 | 43% | 0.05 | 1.69 | +0.002 (0.1) | +0.032 (1.7) | +0.020 | -0.120 (-3.2) |
| R2 +50%/+100% | 0.871 | 0.77 | 41% | 0.05 | 1.88 | +0.002 (0.1) | +0.020 | +0.011 | -0.092 (-3.0) |
| R3 -50% stop | 0.919 | 0.49 | 33% | 0.37 | 1.95 | +0.050 (5.4) | +0.062 (5.3) | +0.054 | -0.040 (-2.8) |
| R4a/b target+stop | 0.920/0.919 | 0.54 | 40/38% | 0.37 | 1.69/1.88 | +0.050 (2.3/2.8) | +0.093/+0.082 | +0.073/+0.064 | -0.152/-0.127 |
| R5a 1-contract set | 0.920 | 0.63 | 39% | 0.37 | 1.68 | +0.050 (2.3) | +0.097 (3.9) | +0.071 (1.6) | -0.158 (-3.6) |
| R5b 2+-contract set | 0.921 | 0.63 | 39% | 0.37 | 1.88 | +0.052 (2.7) | +0.086 (3.9) | +0.064 (1.7) | -0.141 (-3.6) |

**Best rule: none, reliably.** In-model R5b, R5a and R3 tie at 0.92. R5b minus R3 is +0.002 (t 0.1): the targets and the stop-to-cost are noise, and the -50% stop is the whole effect. It works only because OTM calls priced at VIX decay fast. At real skew (†, post-hoc: IV = 0.73x VIX) holding wins and the +50% cap costs 0.12. Exits change the shape of returns (p10 0.05 to 0.37, more hits), not EV. B2 days (my signal code, n 38, 2010-26): hold 1.08, R5b 1.07 (t -0.1).

## Model biases

- **Skew.** VIX is a variance-swap rate, above ATM IV. On the 10/28 Cboe chain, 21-35 DTE SPY calls traded at 0.65x VIX (0.10Δ), 0.71-0.73x (0.35-0.40Δ) and 0.77x (ATM); puts at 0.83x (0.40Δ) and 1.24x (0.10Δ). IWM calls traded at 0.85-0.86x RVX.
- **D1.** The model overstates call losses and understates put losses. At today's skew (post-hoc), SPY 0.35-0.40Δ calls return 1.13 over 10d in 2010-26. The VRP sits in puts: a 0.10Δ put returns 0.65 even at real IV.
- **D2.** Calm-market skew is steeper, so the model hurts calls most on low-IV days; the rejection is in-model only.
- **D3.** The model favours the claim. At real skew the 10d gap vanishes (1.04 vs 1.05) and survives only for calls held to expiry in calm regimes (0.73 vs 1.17). Far-OTM puts are the real lottery tickets.
- **Tenor.** VIX is 30-day; at exit (9-20 days left) contango IV is lower, so the model slightly overvalues exits.
- **Other.** Close-only checks miss intraday fills, and 3% is conservative for SPY (1.6% today). The post-hoc uses one day's skew for all history (skew flattens when VIX is high).

## Today's regime (VIX 15-19, VIX9D < VIX3M; 1155 entries 2011-2026)

**Model expectancy is negative.** SPY 0.35-0.40Δ calls return 0.84-0.88/$ with our 2-contract exits (0.74-0.81 held 15 sessions); IWM returns 0.83-0.85. At today's real skew (post-hoc), SPY is about break-even (1.01 with our exits, 1.12 held; t ≤ 1.5) and IWM is still negative (0.91-0.92, t ≈ -2).
