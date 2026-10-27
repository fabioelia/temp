# Options & vol, Tue 2026-10-27 (Run B)

**Verdict: no trade Wed. After a +1.5% day from 280 the 287-290 band cannot fill under 2.20. Re-strike by ask, but the IWM EV/$ is about 1.00, so there is no edge. INTC continuation (1 lot) is the best Friday shot. MSFT/GOOGL reaction trades fail the caps.**

Sources: Cboe chain (quotes.py), timestamp 2026-10-27 21:16 UTC; Yahoo daily closes (17:17 ET); Fed calendar (federalreserve.gov); SEC 8-K 2.02 dates; my BS models and replays.

## 1. IWM 11/20 calls (close 280.18; θ is Cboe's, x7)
| K | Bid/ask | IV | Δ | θ/wk | OI |
|---|---|---|---|---|---|
| 287 | 2.67/2.72 | 17.8 | 0.33 | -0.68 | 20,891 |
| 288 | 2.34/2.38 | 17.7 | 0.30 | -0.65 | 5,842 |
| 289 | 2.03/2.07 | 17.5 | 0.27 | -0.61 | 2,474 |
| 290 | 1.77/1.80 | 17.4 | 0.25 | -0.58 | 50,801 |
| 291 | 1.51/1.55 | 17.3 | 0.22 | -0.54 | 2,324 |

- Waiting cost: the 288C ask went 1.65 → 2.38 (+44%) today.
- Wed flat plus Thu +1.5% puts IWM at 284.38. The band then models 2.76-4.33.
  - Under the cap: 292C 2.07-2.31 (Δ 0.29) and 293C 1.77-2.00.
  - Wed -1% gives the 289C; Wed +1% gives the 295C.
- **Change:** drop the band. Buy the lowest strike with ask ≤ 2.20 and Δ ≥ 0.26.
- **Stop:** the -50% backstop fires near IWM 279 a day after entry, so 276 never binds. Use 279.00.
- **EV/$** (IWM 2000-2026; +1.5% days, volume ≥75%, VIX ≤22; planned exits):
  - all: 1.00 (n 199, SE 0.05);
  - after a 2-day run-up: 0.97 (n 84);
  - since 2016: 1.07;
  - at +1.25%: 0.92.

## 2. Fed day
| | 10/28 straddle | Median FOMC-day move (last 8/10/12) | Ratio |
|---|---|---|---|
| SPY | 5.26 (±0.68%) | 0.55/0.28/0.27% | 1.2-2.5x |
| IWM | 2.83 (±1.01%) | 0.80/0.71/0.60% | 1.3-1.7x |

- 10/30 straddles: SPY ±1.16% and IWM ±1.58%. Against the median 3-session move that is 1.4-1.5x and 0.81-1.05x. That expiry cannot be bought (under 3 days).
- IWM fell on each of the last six FOMC days.
- The decision takes only ~0.3 vol out of IWM 11/20.
- No reason to buy before the decision.

## 3. After a 5% gap (IV = ex-event + 2 pts)
- **INTC** (98.43, 56.8%, 21 days): the 105C is Δ 0.35 at about 2.92, from d1 = (ln(98.43/105) + 0.201×0.0575) / (0.568×0.240) = -0.39.
  - 105C: OI 17,100, spread 4.4%. Passes, 1 lot.
  - 101-104C fail on OI.
  - Puts: 85P (Δ -0.33, about 2.85) and 87.5P (about 3.91) pass, 1 lot.
- **AMZN:** calls in the band cost 5.0-7.0. The 232.5P (about 4.1) is in the band, but its spread was 5.9% tonight.
- **MSFT** (7.2-13.0) and **GOOGL** (4.9-9.6) are over 4.50 throughout the band.
- Replay, 1 lot +50%: INTC 1.13 (n 26, SE 0.11); AMZN 1.21 (n 19).

## 4. IV vs RV20 (my calculation)
- SPY 14.2/10.0 (1.42x);
- QQQ 22.3/19.5 (1.14x);
- IWM 19.1/15.2 (1.26x).

None is at or below realized.

## 5. Ranked
1. **INTC Friday, 1 lot.** Confidence 3. Not consensus.
2. **IWM, re-struck.** Confidence 2. A partial consensus match (rotation), and EV 1.00 fails the test.
3. **AMZN puts, alternate.** Confidence 2. The Anthropic link is not the thesis.
4. **No trade** on Wednesday and on MSFT/GOOGL.
