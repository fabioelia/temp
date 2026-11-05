# FINRA short-sale volume: E1 and E1b (tested 2026-10-30)

Pre-registered in `claims.md`; open choices were fixed in the `scripts/finra_analysis.py` docstring before any result.

**Data.**
- FINRA CNMS files 2018-10-01 to 2026-10-30: 2,032, none missing, fetched in 11 minutes (full period used; Q4 2018 is z-score warm-up).
- Only the 28 symbols were kept (FB = META before 2022-06-09). Prices: Yahoo adjusted closes.

**Method.**
- Signal: ShortVolume / TotalVolume, z-scored against the symbol's prior 60 sessions.
- Entry: the close of t+1. Day t's file appears around 18:00 ET, after our 14:43 decision.
- Outcome: the next 5 or 10 sessions beyond SPY.
- Baseline: all 55k symbol-days. Abnormal = the signal-day result minus that symbol's all-day mean.
- t: month-block bootstrap, signed in the claimed direction.
- Costs: 5-10 bps round trip.
- Options: 25 DTE, delta 0.35, IV = 1.1 x RV20, held 5 sessions, paying half a 3% spread each way.

## Results

Hit = the share of returns that moved in the claimed direction.

| Test | h | n | Mean / median / hit | All days | Abnormal (t) | 2019-22 (t) | 2023-26 (t) |
|---|---|---|---|---|---|---|---|
| E1 heavy, z >= 1.645 | 5 | 3,788 | +0.29% / +0.10% / 47.9% | +0.21% / +0.08% / 48.8% | +0.07% (**-0.5**) | +0.05% (-0.3) | +0.11% (-0.6) |
| E1 | 10 | 3,785 | +0.44% / +0.21% / 47.9% | +0.42% / +0.13% / 48.7% | 0.00% (0.0) | +0.26% (-1.0) | -0.25% (+0.7) |
| E1b light, z <= -1.645 | 5 | 3,442 | +0.37% / +0.13% / 51.9% | +0.21% / +0.08% / 51.2% | +0.16% (**+1.4**) | +0.12% (+0.7) | +0.21% (+1.5) |
| E1b | 10 | 3,434 | +0.60% / +0.25% / 52.6% | +0.42% / +0.13% / 51.3% | +0.19% (+1.1) | +0.22% (+1.0) | +0.18% (+0.7) |

Worst 5-session result: -32% (E1), -37% (E1b).

**Options (approximate: no skew, no change in IV).**
- **E1 put:** EV/$ 0.87 (28% win), against 0.91 for the same put bought on any day.
- **E1b call:** EV/$ 1.10 (CI 1.04-1.17, 41% win), against 1.07 for any day. The any-day figure reflects the 2019-26 mega-cap rally and a model IV that is probably cheaper than real quotes. The signal itself adds only about +0.03.

## Verdicts

- **E1: REJECTED.** Heavy shorting is followed by slightly *higher* returns at 5 sessions and nothing at 10; puts lose 13%.
  - This fits the caveat in claims.md: FINRA short volume is mostly market makers filling buy orders.
  - The ETF subgroup, which proxies the aggregate claim of Lynch et al., also shows nothing (n 309, t 0.0).
- **E1b: WEAK.**
  - For: the sign holds in both halves, the result survives costs (+0.07% net), and call EV is above 1.
  - Against: t is 1.4, below 2, and the median abnormal is -0.03%, so a few large up moves carry the mean.
  - Per the protocol, it may only break ties.

**Declared sensitivities (descriptive only).**
- Entry at the close of t (not tradeable): E1 t -0.5; E1b t 1.3. E1b's 2023-26 half reaches t 2.4 here, but that is an untradeable subperiod and does not count.
- Stocks only: E1 t -0.6; E1b t 1.5.
- ETFs only: both nil.

## Live (10/29 and 10/30 files)

No signal. Nearest: BAC (z -1.61 on 10/30, -1.45 on 10/29), QQQ (+1.46), ORCL (-1.45).

## Files

`finra-results.csv` (48 rows: t-stats, CIs, costs, option EVs, verdicts); `scripts/finra_fetch.py`, `scripts/finra_analysis.py`. Filtered data stays in the scratchpad.
