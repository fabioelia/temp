# Momentum memo, Fri 2026-10-30 (Run B)

**Verdict: no trade on 11/2; one conditional C1 put on AAPL on 11/3, probably gated out. No rotation or continuation trade has an edge.**

## 1. Tape
Source: `scripts/momentum_tape.py` on Yahoo bars (21:19 UTC); the closes match the snapshot.
- **The rally attempt failed.** QQQ hit a 683.45 low and closed 690.49, under the 10/23 low of 701.16. SPY, ^IXIC and ^GSPC undercut theirs too. IWM held.
- **Distribution days:** QQQ 9, SPY 8 (ETF volume), one more each than 10/29.
- **From the 10/6 record closes:** ^GSPC -3.05%, ^IXIC -7.84%, QQQ -9.11%.
- **Call:** a Nasdaq correction and an S&P pullback, not yet a break. A deeper break is a QQQ close below its 200-day average (679.52).

## 2. Leadership
XLE +1.91% (a 252-session high), XLP +1.41%, XLU +0.67%, TLT +0.43%; SMH -6.98%.

Tests (fixed before the run): after a QQQ drop of 3% or more, 5-session hold.

| Test | n | 5-day excess (t) | Option EV (random) |
|---|---|---|---|
| R1: XLE call | 48 | -0.10% (-0.16) | 0.88 (0.87) |
| R2: TLT call | 78 | -0.22% (-0.84) | 0.96 (0.97) |
| R3: QQQ put | 43 | +0.84% (+1.89), a bounce | 0.62 (0.87) |

- **The rotation is a narrative;** XLE also fails the spread rule (12/18 72.5C, 1.86/2.15). Puts on the tape lose.

## 3. Ranked (11/2-11/4)
1. **AAPL 11/20 put under C1, on 11/3. Confidence 2.**
   - **Trigger at 14:43:**
     - AAPL at or below 0.92 x the 11/2 close (317.06 at Friday's close).
     - Delta 0.30-0.45, ask at most 4.50.
     - IV at most 1.3x RV20 (about 18.9%, provisional).
     - ^VIX at or below 22.
   - **Contract:** reference AAPL261120P00315000 at 2.18/2.31 (Cboe, stale).
   - **Exits:** GTC +50%. Stop above 0.96 x the 11/2 close, -50% backstop. Out by 11/10.
- **AMD: no.** A delta-0.30 put models at about $1,836.
- **Consensus:** a generic AI says "rotate to energy" or "hedge with puts". Both test below 1. Mine does not match; edge: C1, 62% continue (n 216), EV 1.00.
- **For Sunday (^VIX gate, `scripts/c1_watch.py`):** C1 shows +1.19% (t 2.87) with ^VIX at or below 22 and +0.25% above it. The difference has t -1.18: weak support for keeping the gate.
