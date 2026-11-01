# Options & vol, Sun 2026-11-01 (Run C)

**Verdict: no trade under the rules. Every Kelly figure is $0.**

Data: Cboe chains (stamped 11/01 22:21 UTC, holding the 10/30 16:15 ET quotes), Cboe ^VIX 19.42 / ^VXN 28.50 / ^RVX 22.40, Yahoo closes. Scripts: `scripts/ov_fetch.py`, `ov_chains_events.py`, `ov_backtest.py` (reproduces D1's 1.13).

## 1. Index calls at the real skew: beta, not edge
11/20 is 18 DTE from Monday, outside our rule; the in-band expiries are 11/27, 11/30 and 12/04.

| 0.35-0.40Δ call | IV | x index vol | x RV20 | Hold 10d, 2010-26 | Delta-hedged | Our exits |
|---|---|---|---|---|---|---|
| SPY | 13.4-14.1% | 0.69-0.72 | 1.17-1.24 | 1.15-1.19 | 0.98-1.00 | 0.94-0.99 |
| QQQ | 22.2-23.3% | 0.78-0.82 | 0.96-1.00 | 1.16-1.19 | 0.93-0.96 | 0.92-0.97 |
| IWM | 18.2-18.9% | 0.81-0.84 | 1.14-1.19 | 1.02 | 0.92-0.95 | 0.87-0.91 |

* SPY call IV equals the median realized vol of the next 12 sessions (0.71x VIX): fair. D1's 1.13 is drift; delta-hedged it is about 1.00 (0.96-0.98 since 1993, t -1.4 to -2.7).
* The +50% cap cuts off the drift's upside tail, so our exits lose. Without drift they return 0.84-0.89; puts return 0.77-0.80.

## 2. Midterm and jobs premium: nothing is cheap
* SPY's implied daily move is flat at VIX's level: 0.79% Tue, 0.89% Wed, 0.82% Thu, 0.81% Fri.
* Midterm reaction days averaged 0.73x the prior daily RV20 (^GSPC 1970-2022, n 14), jobs days 1.02x (n 388); absolute moves only.
* The 11/6 SPY straddle (14.16/14.36) returns 0.68-0.97 per $, depending on whether history is scaled by RV20 or by VIX. QQQ returns 0.89 and IWM 0.72 (n 6). Straddles also break our DTE and delta rules.

## 3. Ideas, 11/2-11/6
1. **Cash.** It beats SPY only if SPY falls 2.7% in 12 sessions: 13-14% of SPY history, not 25%.
2. **C1 is blocked.** Full Kelly at IV/RV20 of 1.0x, 1.15x and 1.3x is $326, $173 and $10.
   * AAPL: its ex-event IV of 1.63x RV20 fails the gate.
   * AMD: one put costs $1,590 or more.
   * QCOM: in-band puts have OI below 400 and spreads of 10-57%.
3. **Goal budget (the owner's call; a gamble, Kelly $0): SPY261130C00770000**, 7.37/7.47 (Cboe), delta 0.37, OI 2,113.
   * One contract costs $747; +50% takes equity to $2,291.
   * Odds, 1993-2026 / 2010-26: P($2,200) 47%/49%; stopped 48%/45%; P(beat SPY) 48%/51%; EV 0.94/0.97 per $.
   * Worse choices: QQQ calls (0.92-0.96); IWM (36% all-in); the best put, SPY261130P00750000 (38%, EV 0.81).
   * Exits: all at +50% (GTC); stop if SPY ≤ 745 at 14:43; -50% backstop; time exit 11/18.

**Consensus:** a generic AI would say "buy the AI dip" or "buy election straddles". Idea 3 shares the dip direction with no edge (delta-hedged 1.00). No Anthropic link.
