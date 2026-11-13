# Options-vol, Sun 2026-11-08 (Run C)

**No option trade Monday, and nothing here delays the core buy. The only option idea is the CSCO C1 put (Fri 11/13): one contract, ask ≤ min(full Kelly/100, 2.77).**

Sources: `sizing.kelly` on `catalyst_watch.Payoffs` (C1, n 216, fit_1104 method); `c1_vix_split.py`; `ov_backtest.simulate`; Friday Cboe chains (stale). Script: scratchpad `ov1108/ov_1108.py`.

## 1. C1 Kelly ceiling (equity $1,384.84, reserve $277)
| IV/RV20 | 15 DTE | 25 DTE | 35 DTE |
|---|---|---|---|
| 0.90x | $256 | $305 | $332 |
| 1.00x | $190 | $235 | $263 |
| 1.10x | $121 | $163 | $187 |
| 1.20x | $55 | $87 | $104 |
| 1.30x | $0 | $7 | $17 |

- **"$235 at most" is one cell.** Below 0.86-0.97x, the reserve is the cap instead.
- **At 1.0x:** bootstrap P(f*=0) is 1-2%. A 5% spread gives $208 at 35 DTE.
- **Which stocks fit (0.30Δ, 35 DTE):** under about $100 at 40% IV, under $80 at 50%.
- **Post-hoc, ^VIX > 22 (n 67):** $138 at 1.0x, $0 at 1.2x.

## 2. ^VIX 25 with 9D > 3M: nothing has positive EV
- **The VRP holds:** IV > RV on 74-83% of these days.
- **SPY puts** ($993-1,238): 0.77-0.79 per $ over 10 sessions. Hedged 1.00-1.09 (t ≤ 0.8). Kelly $0.
- **Calls:** the gain is beta that VOO already holds (hedged 1.004).

**Consensus check:** buying protection loses, and selling premium is barred.
