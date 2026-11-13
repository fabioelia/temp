# Options & vol, Wed 2026-11-04 (Run B)

**Verdict: QCOM C1 is a conditional single-contract buy, valid only if post-print put IV is no more than about 48.5%. No other vol idea.**

Sources: Cboe chain (21:20 UTC). These are 16:00 pre-print quotes, stale and 19-30% wide, so they are not Thursday's prices. Yahoo closes. QCOM 159.04 after hours (Robinhood, from the brief). Scripts: scratchpad `ov1104/qcom_c1_1104.py`, `oi_pass.py`; `sizing.py c1`; `goal_odds.py`.

## 1. QCOM C1 (Thu 14:43)
- **RV20 to 11/4:** 55.4%, so the 1.3x cap is **72.0%**.
- **Ex-event IV:** 44-45%.
- **Likely band IV:** 45.4-53.3% (**0.82-0.96x**), from the GOOGL/MSFT 1.03-1.04x and INTC 1.21x calibrations. Far below the cap.
- **Full Kelly (sizing.py):** $491 at 0.82x, $444 at 0.875x, $367 at 0.96x, $10 at 1.3x.
- **Band put:** the 152.5P and 157.5P fail OI, so near 159 it is the **155P** (Δ ≈0.37), costing $400-486.
- **Kelly covers it** only up to IV ≈48.5% (45.7% with 15-DTE Kelly).
- **Ask ceiling:** full Kelly/100 at the quoted IV: 4.87 at 45.7%, 4.44 at 48.5%, 4.20 at 49.9%, 3.77 at 52.6%. **Never above 4.40.**
- **Spread:** band spreads were 5.4-7.0% last night, so the 5% test may fail.

## 2. Held 780C (goal_odds.py)
- **Setup:** `--equity 1910.87` (cash plus the 6.72 ask), `--goal 2200.87` (9.62 bid), `--stop 0.4955` (3.39 bid).
- **Results:** P($2,200) **43.3%** (41.1-45.5%); P(beat SPY) 44.9%; EV/$ 1.011 (0.983-1.042): no edge.
- **Underlying needed:** SPY +0.97% by 11/5 or +1.83% by 11/18.
- **Caveat:** the model checks closes only, and an intraday GTC fill would slightly raise these odds.
- **No holiday through 11/18.** NVDA reports 11/17 after the close.

## 3. Vol ideas: none
Contango (9D 15.19 < 16.61 < 3M 18.80) is untested, and "IV is low" is retired. Calls are about fair and puts carry the premium. A second SPY call is barred.

*The brief's Anthropic guardrail line is truncated.*
