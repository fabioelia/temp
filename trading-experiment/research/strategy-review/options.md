# D1-D4: does buying options carry a structural headwind? (2026-10-29)

**Model as registered:** Black-Scholes. IV is that day's VIX for every strike. r = ^IRX and q = SPY's trailing yield. Expiry is 30 calendar days out, and each position is re-priced at every close. Fills are at the close with half of a 3% spread paid each way (expiry included). t is Newey-West with lag = 2x the hold length. Data: ^GSPC/^VIX/^IRX 1990-2026 and SPY 1993-2026 (Yahoo). Scripts: `scripts/options_*.py`. Every row is in `options-results.csv`; last-10y rows are there too. The post-hoc rows are labelled.

| Claim | Verdict | Key numbers |
|---|---|---|
| D1 VRP | **CONFIRMED** (in-model) | VIX > next-21d RV on 86% of days, +4.1 pts (t 13.5). The 0.35Δ call returns 0.83/$ over 10d (t -8.9) and 0.65/$ to expiry |
| D2 low IV | **REJECTED** | When IVR < 25%, the 0.35Δ call returns 0.84 vs 0.83 on all days (t 0.4). To expiry 0.60 vs 0.66 (t -1.7), the wrong sign |
| D3 far OTM | **CONFIRMED** (in-model) | 0.10Δ vs 0.50Δ: 0.49 vs 0.93 (t -37). To expiry 0.10 vs 0.88, with a 1.8% hit rate |
| D4 exits | **WEAK** | Our rules return 0.92 vs 0.87 for holding (t 2.7), but EV/$ < 1. The -50% stop does all of it |

## D1: VIX vs realized vol, and EV/$ for buying

| Period | n | VIX-RV (IV>RV) | 0.35Δ 10d EV / med / hit | 0.35Δ expiry EV / hit | ATM call 10d | ATM put 10d |
|---|---|---|---|---|---|---|
| 1990-2026 | 9252 | +4.1 (86%) | 0.83 / 0.68 / 30% | 0.65 / 25% | 0.93 | 0.78 |
| 1990-2009 | 5043 | +4.4 (87%) | 0.80 / 0.61 / 28% | 0.58 / 21% | 0.90 | 0.79 |
| 2010-2026 | 4209 | +3.8 (85%) | 0.87 / 0.75 / 34% (t -4.9) | 0.73 / 29% | 0.98 (t -1.0) | 0.76 |
| Last 5y | 1232 | +3.6 (84%) | 0.84 / 0.69 / 32% | 0.70 / 26% | 0.95 | 0.80 |

The spread costs about 3 cents per dollar; gross 10d EV for the 0.35Δ call is 0.86. The ATM call is WEAK on its own: its loss decayed after 2010 (gross 1.01). ATM puts are CONFIRMED.

## D2: IV rank (tastylive min-max, 252 days) below 25%, 0.35Δ call

| Period | 10d: low vs all (b, t) | Expiry: low vs all (b, t) |
|---|---|---|
| 1991-2026 | 0.84 vs 0.83 (+0.01, 0.4) | 0.60 vs 0.66 (-0.13, -1.7) |
| 1991-2009 | 0.81 vs 0.80 (+0.02, 0.4) | 0.52 vs 0.59 (-0.14, -1.3) |
| 2010-2026 | 0.86 vs 0.87 (-0.03, -0.7) | 0.66 vs 0.73 (-0.21, -2.1) |
| Last 5y | 0.82 vs 0.84 (-0.08, -0.8) | 0.59 vs 0.70 (-0.30, -1.6) |

Low IV is not cheap vol: on those days VIX/RV is 1.44, against 1.37 on other days. ATM calls and puts show the same picture (|t| < 1.7), and so does a percentile-rank definition tested post-hoc.

## D3: calls by delta, 1990-2026 (EV/$, hit rate)

| Δ | 0.10 | 0.20 | 0.30 | 0.40 | 0.50 |
|---|---|---|---|---|---|
| 10 sessions | 0.49, 12% | 0.67, 20% | 0.79, 27% | 0.87, 34% | 0.93, 39% |
| Expiry | 0.10, 2% | 0.30, 9% | 0.54, 20% | 0.74, 30% | 0.88, 39% |

The 0.10-minus-0.50 gap is -0.40 (1990-2009), -0.48 (2010-26) and -0.46 (last 5y) over 10d, and -0.67, -0.91 and -0.83 to expiry.

## D4: SPY 0.40Δ calls, entered at every close from 2010 to 2026 (n 4209), 15-session time exit

| Rule | EV/$ | Median | Hit | p10 | p90 | vs hold (t) | 1993-2009 | Last 5y | At real skew† |
|---|---|---|---|---|---|---|---|---|---|
| R0 hold to day 15 | 0.870 | 0.66 | 36% | 0.05 | 1.97 | - | (0.756) | (0.826) | (1.218) |
| R1 +50% | 0.872 | 0.77 | 43% | 0.05 | 1.69 | +0.002 (0.1) | +0.032 (1.7) | +0.020 | -0.120 (-3.2) |
| R2 +50%/+100% | 0.871 | 0.77 | 41% | 0.05 | 1.88 | +0.002 (0.1) | +0.020 | +0.011 | -0.092 (-3.0) |
| R3 -50% stop | 0.919 | 0.49 | 33% | 0.37 | 1.95 | +0.050 (5.4) | +0.062 (5.3) | +0.054 | -0.040 (-2.8) |
| R4a/R4b target+stop | 0.920/0.919 | 0.54 | 40/38% | 0.37 | 1.69/1.88 | +0.050 (2.3/2.8) | +0.093/+0.082 | +0.073/+0.064 | -0.152/-0.127 |
| R5a 1-contract set | 0.920 | 0.63 | 39% | 0.37 | 1.68 | +0.050 (2.3) | +0.097 (3.9) | +0.071 (1.6) | -0.158 (-3.6) |
| R5b 2+-contract set | 0.921 | 0.63 | 39% | 0.37 | 1.88 | +0.052 (2.7) | +0.086 (3.9) | +0.064 (1.7) | -0.141 (-3.6) |

**Best rule:** none is reliably best. R5b, R5a and R3 tie at 0.92 in the model. R5b minus R3 is +0.002 (t 0.1), so the targets and the stop-to-cost add nothing; the stop is the only part that does anything. The stop's edge is real in-model, but it exists because the model overprices OTM calls, which then decay fast. At real skew (†, post-hoc), holding wins and the +50% cap costs about 0.12. The exits move the left tail (p10 rises from 0.05 to 0.37) and the hit rate. They do not move EV.

On B2 follow-through days (my own signal code; n 38 from 2010 to 2026): holding returns 1.08 and R5b 1.07 (t -0.1). That is noise.

## Model biases (direction per result)

- **Skew.** VIX is a variance-swap rate across the whole strip, so it sits above ATM IV. In the Cboe chain at the 10/28 close, 21-35 DTE SPY calls traded at these multiples of VIX: 0.65 (0.10Δ), 0.71-0.73 (0.35-0.40Δ), 0.77 (ATM). Puts traded at 0.83 (0.40Δ) and 1.24 (0.10Δ). IWM calls traded at 0.85-0.86× RVX.
- **D1:** the model overstates the losses on calls and understates them on puts. Post-hoc, at today's skew the SPY 0.35-0.40Δ call returns 1.13/$ over 10d in 2010-26. The VRP sits mainly in puts: the 0.10Δ put returns 0.65 over 10d even at real IV.
- **D2:** the calm-market skew is steeper, so the model hurts calls most on low-IV days. The rejection holds only within the model.
- **D3:** the model favours the claim. At real skew the 10d gap vanishes (0.10Δ 1.04 vs 0.50Δ 1.05). It survives only to expiry in calm regimes (0.73 vs 1.17). Far-OTM puts are the real lottery tickets.
- **D4:** the model favours stops; see †.
- **VIX tenor.** VIX is a 30-day SPX measure. Exits happen with 9-20 days left, and in contango (today) shorter-dated IV is below VIX, so the model slightly overvalues exits.
- **Other.** Daily close checks miss intraday fills. A 3% spread is conservative for SPY (1.6% today). The post-hoc work applies one day's skew to all of history, and skew is flatter when VIX is high.

## Today's regime (VIX 15-19, VIX9D < VIX3M; 1155 entries, 2011-2026)

**The model expectancy is negative.** SPY 0.35-0.40Δ calls return 0.84-0.88/$ under our 2-contract exits and 0.74-0.81 held 15 sessions; IWM returns 0.83-0.85. Post-hoc, at today's real skew, SPY is about break-even (1.01 with our exits, 1.12 held; t ≤ 1.5) and IWM is still negative (0.91-0.92, t about -2).
