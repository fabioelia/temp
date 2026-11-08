# Options-vol, Sun 2026-11-08 (Run C)

**No option trade Monday, and nothing here should delay the core buy. This week's only option idea is the CSCO C1 put (Fri 11/13): one contract, ask at most min(full Kelly/100, 2.77).**

Sources: `sizing.kelly` on `catalyst_watch.Payoffs` (C1 sample, n 216; fit_1104 method); `c1_vix_split.py` rows; `ov_backtest.simulate`; Cboe chains at Friday's close (stale this weekend). Script: scratchpad `ov1108/ov_1108.py` (output in `out.txt`).

## 1. C1 Kelly ceiling (equity $1,384.84; SGOV reserve $277)
| IV/RV20 | 15 DTE | 25 DTE | 35 DTE |
|---|---|---|---|
| 0.90x | $256 | $305 | $332 |
| 1.00x | $190 | $235 | $263 |
| 1.10x | $121 | $163 | $187 |
| 1.20x | $55 | $87 | $104 |
| 1.30x | $0 | $7 | $17 |

- **"$235 at most" is just one cell** (1.0x, 25 DTE). The reserve is the real cap below 0.86-0.97x.
- **At 1.0x:** bootstrap P(f*=0) is 1-2%. A 5% spread cuts the 35-DTE figure to $208.
- **Which stocks fit:** a 0.30Δ put fits only on a stock under about $100 at 40% IV, or under about $80 at 50% IV (35 DTE).
- **Post-hoc, ^VIX > 22 (n 67):** $138 at 1.0x and $0 at 1.2x.

## 2. ^VIX 25 with 9D > 3M: nothing has positive EV
- **The VRP is still there:** IV > RV on 74-83% of these days (2011+).
- **SPY puts** (Δ0.34-0.37, $993-1,238): 0.77-0.79 per $ over 10 sessions. Delta-hedged 1.00-1.09 (t ≤ 0.8). Kelly $0.
- **Calls:** the gain is beta that VOO already holds (ov_1106: hedged 1.004).

**Consensus check:** buying protection loses money, and selling premium is barred.
