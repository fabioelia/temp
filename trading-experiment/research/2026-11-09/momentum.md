# Momentum memo, Mon 2026-11-09 (Run B)

**Verdict: no trade Tuesday. The shadow QQQ 11/30 675P is closed by its -50% backstop. Its 200-day exit did not fire.**

| 11/9 | Close | vs 50-day | vs 200-day [Tue break-even] | vs record |
|---|---|---|---|---|
| SPY | 752.69 (+2.4%) | -1.7% (765.35) | +3.0% (730.70) [730.89] | -3.4% |
| QQQ | 679.35 (+3.5%) | -5.7% (720.23) | -0.3% (681.17) [681.45] | -10.6% |
| IWM | 282.51 (+3.2%) | +0.2% | +1.2% | -7.4% |

- QQQ traded as high as 681.70 but closed below its 200-day. It has 9 distribution days. SMH is still -13.6% below its 50-day. 7 of 11 sectors are above their 50-day, and RSP/SPY is +7.1% over 20 sessions.
- **Shadow QQQ261130P00675000:** Cboe bid 13.69, ask 13.90 (17:17 ET). Against the 33.51 entry that is **-59.1% (-$1,982)**, below the 16.76 backstop. The exit is booked at the close bid, as on 11/5; no 14:43 quote was recorded.
- **Shadow SPY261130C00750000** (fired 14:47 at 13.36): 13.68/13.85, +2.4%, open. Exits: 20.04, 6.68, or a SPY close below 730.89.
- **No idea passes.** Trend filters are REJECTED, and no C1 setup exists for Tuesday. The next C1 check is CSCO, Fri 11/13.
- **Who loses:** QQQ put holders and shorts, and NVDA holders (-4.3%; about 7% of VOO).
- **Consensus** ("V-bottom, buy calls"): mine differs. momentum_1106.py's exact pattern, a Monday entry, returned -2.79% over 7 sessions, but n is 4 (narrative).

Sources: Yahoo bars via momentum_tape.py (they match the snapshot); quotes.py.
