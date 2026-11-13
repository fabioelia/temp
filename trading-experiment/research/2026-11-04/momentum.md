# Momentum memo, Wed 2026-11-04 (Run B, after the Democratic sweep)

**Verdict: no momentum trade.** The rally is real on the tape but not a measured edge.

Sources: Yahoo daily bars fetched tonight (11/04 closes match the snapshot); Cboe delayed chain 17:18 ET; script
`/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/momentum_1104.py` (descriptive, no edge claim).

## 1. Tape

| | Close | vs record close | 20-session close range | 50-day | 200-day |
|---|---|---|---|---|---|
| SPY | 766.81 | -1.58% (779.09, 10/06) | 752.10-778.57, at 56% | 767.06 (-0.03%) | 729.91 (+5.1%) |
| QQQ | 691.95 | -8.91% (759.66, 10/06) | 681.09-751.27, at 15% | 723.56 (-4.4%) | 680.56 (+1.7%) |
| IWM | 284.02 | -6.91% (305.09, 8/14) | 270.44-284.02, at 100% | 283.19 (+0.3%) | 278.97 (+1.8%) |

- SPY's pullback was shallow (lowest close 752.10 on 11/02, -3.5%); it closed at its 50-day on 1.87x volume. Distribution days: SPY 6, QQQ 8, IWM 5.
- Day 2 of the rally attempt. A follow-through day is retired; the "^GSPC +1% day" state showed 10-session excess t +0.17 (`2026-11-03/scripts/momentum_1103.py`): no edge.
- QQQ lags, still in a correction (NVDA -3.2%); IWM is at a 20-session high.

## 2. Goal-budget call, SPY 12/04 780C (exits unchanged)

Black-Scholes **estimate**: IV 12.2% constant (Cboe 12.05%), r 4.03% (^IRX), scaled to the 6.66/6.72 close (Robinhood, brief), bid = mid - 0.03.

| 14:43 check | Bid 9.62 (goal) | Bid 3.39 (stop) |
|---|---|---|
| 11/05 | SPY ~774.2 | SPY ~756.6 |
| 11/10 | ~776.7 | ~760.2 |
| 11/13 | ~778.2 | ~762.4 |
| 11/18 | ~780.8 | ~766.4 |

- From the second week the goal needs SPY near its record close; flat SPY decays the bid to ~3.52 by 11/18.
- No market closure before 11/18 (11/11 is a stock-market trading day).

## 3. Shadow QQQ261204C00715000 (in at 8.98 on 11/2)

Cboe 8.52/8.69. No exit fired (13.47, 4.49, QQQ close below the 200-day): **open**. The 11/5 stop is a QQQ close below 680.88.
The 11/3 break-put shadow did not fire (QQQ held 680.50).

## 4. Ideas

1. **No trade.** The 11/01 spec has no passing cell (11/03 re-run); no new signal on 11/04; Kelly $0.
2. Shadow QQQ261130P00675000, 8.95/9.08 (Cboe): QQQ below 680.88 at 11/5 14:43; EV 0.88; confidence 1.

**Consensus** ("buy calls on the post-election rally"): no measured edge (t +0.17); my call differs.
