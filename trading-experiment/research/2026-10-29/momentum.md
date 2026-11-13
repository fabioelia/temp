# Momentum memo, Thu 2026-10-29 (Run B)

**Verdict: one conditional shot, a C1 put on INTC. AMZN only if INTC does not fire. No index trade.**

## 1. Tape
- **New distribution day.** S&P (SPY) is at **7**: down 0.38% on 39.4M vs 30.1M (Cboe 37.8M). Nasdaq (QQQ) is at **8**: down 1.42% on 36.9M vs 30.5M.
  - On index volume ^IXIC shows none (6.50B vs 7.99B). ^GSPC's figure is partial.
- **The rally attempt has not failed by the rule.** The 10/23 lows held (QQQ 701.16, SPY 758.68).
  - Day 4 brought a distribution day and no follow-through day. QQQ sits below its 50-day (725.41) and was 705.00 after hours.
- **IWM rose 0.97% on 1.14x Wednesday's volume, but only 0.95x its 50-day average.**
  - The whole bounce came on light volume, and it closed at 284.01, below its 50-day (284.64).
  - Its count is 4: the 10/16 day expired. Real in price, not on volume.

## 2. Levels

| | INTC (92.07; AH 73.93) | AMZN (243.79; AH 227.95) |
|---|---|---|
| Line for an 8% gap | 84.70 | 224.29 |
| Prior low | 84.65 | 225.55-226.16 |
| Shelf top | 81.88 | 227.01 |
| 200-day | 86.9 | 243.3 |

- The thesis is wrong when a 14:43 check shows the stock back above its shelf top.
- For an INTC put bought near 74, the -50% backstop (about 77-78) fires before any chart level.

## 3. Ranked
1. **INTC 11/20 put. Confidence 4.**
   - Trigger: INTC at or below 80.80 at 14:43.
   - Contract: delta 0.30-0.45, IV at most 70.6% (1.3x RV20 of 54.3%), ask at most 4.00. Reference: the 70P, model 2.46.
2. **AMZN 11/20 put. Confidence 3.**
   - Trigger: AMZN at or below 224.29, IV at most 47.2%. Reference: the 215P, model 3.81.
   - Amazon is an Anthropic investor. That is not the thesis.
- **Exits:** a GTC sell at +50%, the shelf stop, a -50% backstop, the stop to cost after +40%, and out by 11/6.
- **Consensus:** a generic AI would say "don't chase", so these ideas do not match it.
  - The edge is C1: 62% continue (n 216), with put EV 1.00 at 1.3x RV20.
  - My filters are untested.

**Sources:** Yahoo bars (21:17-21:21 UTC), Cboe via quotes.py (17:18 ET), and `earnings_analysis.py`.
