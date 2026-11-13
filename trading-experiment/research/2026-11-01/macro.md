# Macro memo, Sun 2026-11-01 (week of 11/2-11/6)

**Verdict: no trade.** Under the playbook exits every tested payoff is at or below 1.00, so sizing.py gives $0 (`scripts/macro_week.py`).

## 1. Midterms and jobs: premium is fair
- SPY straddles (Cboe) price 1.49% to Wed 11/4 and 1.89% to Fri 11/6. Wednesday holds 1.21x a normal day's variance, Friday 1.00x.
- At today's price a straddle would have returned 0.88 in ordinary weeks, 0.98 in the 9 midterm weeks, and 1.28 in all 18 election weeks (CI 0.98-1.59; presidential years).
- Jobs days run 1.17x normal; that is tradeable only in weeklies, which the DTE rule bars.
- Expect 1.7-2.4%, direction unknown: midterm reaction days rose 6 of 9 times, mean +0.11%.

## 2. Oil: no edge, no eligible contract
- USO ATM IV (0.53) and ^OVX (58.48) are about 2x RV20 (26.7%).
- OVX beat next-21-session realized vol on 78% of days since 2007; at today's ratio, 1.04 (n 49).
- USO 0.40Δ model payoffs: calls 0.80, puts 0.78.
- No USO contract has OI of 1,000; XLE spreads run 17-160%.
- The risk is the ceasefire: 91.5% through 11/4, 73.5% through 11/8 (Polymarket).

## 3. Ideas
1. **No trade.**
2. Shadow: SPY261130C00770000 at 7.37/7.47.
   - Playbook exits: 0.977 (t −0.8), Kelly $0.
   - Held 12 sessions: 1.25 (bull-market drift); full Kelly $412 is under the $747 cost.
3. Shadow: USO261127C00180000 at 5.75/5.95; it fails the OI rule.

C1: one contract needs a put ask of 3.26 or less; AAPL's ask 5.75+.

**Consensus** ("buy the dip, midterm rally, long oil"): no match.

## 4. The owner's choice
**My recommendation: name a goal budget of one SPY call; without that, stay in cash.**
- In cash, P($2,200) is about 0, and we beat SPY only if it closes at or below 735.39 on 11/18 (15-17% of past 13-session windows).
- One 770C reaches $2,200 at its +50% exit: model hit rate 49% (44% since 2018), otherwise a loss of about $390. EV 0.93-0.98 means an expected cost of $15-55.
- It is a gamble, but the most fairly priced one (puts 0.78, oil 0.80). Never two contracts, never average down.

Sources: Cboe chains (fetched 11/01 23:39 UTC), Yahoo daily bars, predmkt.py, sizing.py. Script output: `/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/macro1101/macro_week_out.txt`.
