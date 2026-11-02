# Macro memo, Mon 2026-11-02 (Run B, for Tue 11/3 to Thu 11/5)

**Verdict: no trade.** Every oil payoff under our exits is below 1.00, and index event premium is fair to rich. Kelly $0.

## 1. Oil after a drop of 6% or more: no edge
- **Test** (`scripts/macro_oil_drop.py`): 74 days since 2006 with CL=F -6% or worse and USO -3% or worse (32 de-clustered); entry at the next close.
- **Direction:** USO -1.3% over 5 sessions (t -0.7), de-clustered +1.2%. XLE +1.1% (t +1.2), de-clustered -0.5%. No signal.
- **Vol:** after drops, the next 11 sessions realized 0.86x ^OVX, the same as any day (0.84x). Today USO IV is 0.58-0.62 against an RV20 of 37.8%.
- **EV per $ at today's IV** (Cboe USO chain, 2026-11-02 22:16:30 UTC; all 9 eligible contracts; +50%/-50% exits): calls 0.67-0.75, puts 0.82-0.87, every t -1.5 or lower. Kelly $0.
- Puts held to 11/18 show 1.50-1.84, carried by 2008 and 2020 (0.30-0.55 without them); full Kelly $273 is under one contract ($635).
- XLE has no eligible contract (closing spreads 22-200%).
- **Post hoc, not evidence:** 2026's 7 drops (about 4 episodes) bounced; the 163C returned 1.03-1.20. A shadow row only.

## 2. Midterms: still fair to rich
- SPY straddles (Cboe, 22:17 UTC) price 1.33% to Wed and 1.85% to Fri. Wednesday carries 1.33x Thursday's variance (`scripts/macro_midterm_update.py`).
- From the Monday close, midterm weeks returned 0.90 to Wed (CI 0.61-1.23) and 0.84 to Fri; ordinary weeks 0.82-0.94. All 18 elections: 1.18-1.26, lifted by presidential years.
- Odds (predmkt.py, 22:17 UTC):
  - House D 93.7-94.5%; Senate D 74.5-76.5% (70-72% Sunday).
  - Ceasefire through 11/8 73.5%, through 11/30 36%; a nuclear deal by 11/30 7.5-8.5%.
  - December hike 72.5%.
- Expected move by Wednesday: 1.2-1.6%, direction unknown.

## 3. Ideas
1. **No trade.**
2. Shadow: USO261127C00163000 at 6.90/7.25 (Cboe). Payoff 0.75; full, half and quarter Kelly $0. Tests the 2026 bounce.
3. Shadow: USO261127P00150000 at 5.85/6.35 (Cboe). Payoff 0.86; Kelly $0.
- C1 (AMD 11/4, QCOM 11/5) as in the playbook. The SPY 770C goal budget (now 6.14/6.22) stays the owner's call.

**Consensus** ("buy the oil dip", "midterm rally"): no match.

**Sources:** Yahoo bars and Cboe chains (fetched 22:16-22:17 UTC), predmkt.py, sizing.py, research.py news (Reuters: talks ended "with no breakthrough"). Output: `/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/macro1102/` (oil_out, midterm_out, sizing_out).
