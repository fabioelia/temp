# Momentum memo, Fri 2026-11-06 (Run B)

**Verdict: no trade Monday.** Script: `research/2026-11-06/scripts/momentum_1106.py` (spec fixed before the first run; Yahoo bars match the snapshot; Cboe delayed chain 17:19 ET).

## 1. Tape (11/6; Monday's levels in brackets)

| | Close | 50-day | 200-day |
|---|---|---|---|
| SPY | 735.29 | -4.0% [765.60] | +0.7% [730.59] |
| QQQ | 656.10 | -9.0% [721.06] | -3.6% [681.18] |
| IWM | 273.67 | -3.0% [281.83] | -1.9% [279.07] |

- **The Nasdaq is still in a correction, but stabilizing for one day.** ^NDX is -13.6% from its record (-14.7% Thursday). It closed above Thursday's low close, my pre-set label. One day is not a trend: QQQ has 9 distribution days and a falling 50-day.
- Breadth: 7 of 11 sectors are above their 50-day, and RSP/SPY is +7.4% over 20 sessions. That is rotation out of tech, not broad selling.

## 2. A +0-1% day after a -4% day

It lowers the call base rate, on a thin sample. Calls are 30-DTE at delta 0.375, entered at Monday's close and held 7 sessions, priced at VIX.

- Conditioned (n 2): EV 0.18 per $, against 0.97 for the other cases (Welch t -6.7).
- Wider cut, -3.5% days (n 7): 0.45 (t -2.75 vs random).
- All events: 0.90 against 0.89 for random entry. Kelly $0, so there is no edge.

## 3. Shadow book

QQQ261130P00675000 is open at 27.41/28.62 (Cboe), -18%. No exit fired.

**Consensus check:** a generic AI would buy calls on the dip. Mine differs, because the measured EV is at or below random.
