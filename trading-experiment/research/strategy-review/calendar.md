# Calendar claims A1-A3

Data: Yahoo daily ^GSPC 1950 to 10/28/2026, SPY (adjusted) from 1993, ^VIX from 1990. The code is `scripts/calendar_*.py` and the numbers are in `calendar-results.csv`. Open choices were fixed in the script docstring before the first run. A1 uses a 100k-shuffle permutation test, with two-sided p ≤ 0.046 treated as |t| ≥ 2.

## Verdicts

| Claim | Verdict | Why |
|---|---|---|
| A1(a) election → Apr 30 | **WEAK** | Full-sample p < 1e-5, but decayed: 2010-26 excess +3.0 vs full +10.2 pp (n = 4) |
| A1(b) election → +11 sessions | **REJECTED** | No effect (z 0.08) |
| A1(c) Oct 31 → Nov 18 | **REJECTED** | No effect (z 0.55); 2010-26 negative; options EV/$ 0.86 |
| A2 Halloween | **WEAK** | Full t 3.25, but decayed: 2010-26 +2.432 vs a threshold of 2.433 (knife-edge); last 10y −0.15 |
| A3 Turn of month | **WEAK** | Full t 5.18, but decayed (2010-26 t 0.58); SPY full t 1.27; options EV/$ 0.98 |

## A1: midterm vs other years (^GSPC %)

| Test | Period | n mid/oth | Mean | Median | Up | Others | Excess | Welch t | Perm p | Worst |
|---|---|---|---|---|---|---|---|---|---|---|
| (a) | 1950-2025 | 19/57 | +14.06 | +15.86 | 100% | +3.82 | +10.24 | 5.21 | <1e-5 | +0.94 |
| (a) | 1950-2009 | 15/45 | +15.43 | +17.32 | 100% | +3.26 | +12.17 | 5.64 | <1e-5 | +0.94 |
| (a) | 2010-2025 | 4/12 | +8.90 | +8.55 | 100% | +5.91 | +2.99 | 0.78 | 0.58 | +3.36 |
| (b) | 1950-2025 | 19/57 | +0.48 | −0.04 | 47% | +0.41 | +0.07 | 0.08 | 0.94 | −6.68 |
| (b) | 1950-2009 | 15/45 | +0.42 | −0.04 | 47% | +0.28 | +0.14 | 0.14 | 0.90 | −6.68 |
| (b) | 2010-2025 | 4/12 | +0.71 | +0.59 | 50% | +0.90 | −0.19 | −0.09 | 0.93 | −3.52 |
| (c) | 1950-2025 | 19/57 | +1.54 | +1.67 | 79% | +0.99 | +0.55 | 0.63 | 0.58 | −6.27 |
| (c) | 1950-2009 | 15/45 | +1.54 | +1.69 | 73% | +0.81 | +0.73 | 0.69 | 0.53 | −6.27 |
| (c) | 2010-2025 | 4/12 | +1.53 | +1.40 | 100% | +1.66 | −0.13 | −0.11 | 0.95 | +0.90 |

* Stovall replicates: +14.1%, 19/19 up. The last 10 years hold n = 2 midterms, too few to test.
* Options on (c), 1990-2025 (30 DTE delta-0.40 call, IV = VIX, 3% spread): EV/$ 0.86 for midterms (n = 9), 1.17 for other years, 0.85 at random.
* **Post-hoc**: +12 sessions (to 11/18): excess +0.50, t 0.52. All years, Oct 31 → Nov 18 vs a random 13 sessions: +0.66 pp, t 1.54. Neither is significant.

## A2: Nov-Apr minus May-Oct (^GSPC, pp/year)

| Period | n | Mean | Median | Hit | t | Worst |
|---|---|---|---|---|---|---|
| 1950-2025 | 76 | +4.87 | +4.25 | 62% | 3.25 | −20.4 (2021) |
| 1950-1989 | 40 | +5.85 | +4.41 | 62% | 2.75 | −17.8 |
| 1990-2009 | 20 | +4.85 | +4.23 | 70% | 1.75 | −15.1 |
| 2010-2025 | 16 | +2.43 | +2.92 | 50% | 0.73 | −20.4 |
| 2016-2025 | 10 | −0.15 | +0.52 | 50% | −0.03 | −20.4 |

Costs are negligible. Since 2010 summers have strengthened (+4.9%); winters are unchanged (+7.4%).

## A3: ToM days −1..+3 vs others (% per day)

| Series | Period | ToM | Other | Excess | t | Up ToM/oth | ToM share of return |
|---|---|---|---|---|---|---|---|
| ^GSPC | 1950-2026 | .111 | .019 | +.092 | 5.18 | 57/52% | 64% |
| ^GSPC | 1950-1989 | .147 | .007 | +.139 | 6.67 | 59/51% | 90% |
| ^GSPC | 1990-2009 | .075 | .019 | +.056 | 1.34 | 54/53% | 57% |
| ^GSPC | 2010-2026 | .071 | .047 | +.024 | 0.58 | 54/55% | 27% |
| SPY | 1993-2026 | .080 | .040 | +.040 | 1.27 | 55/54% | 34% |
| SPY | 2010-2026 | .076 | .054 | +.022 | 0.53 | 54/55% | 26% |

ToM days are 19% of days; the worst was −8.9%. Net of 5 bps per round trip, the 4-session ToM window beats a random 4 sessions by +0.25 pp (t 4.7), and by +0.02 pp since 2010 (t 0.5). Options EV/$: 0.98 vs 0.94 at random.

## Our window, 10/30-11/18 (13 sessions)

Noise (the sd of 13-session returns): 3.40% historically, 3.84% at today's VIX of 16.9, about ±$26-30 on SPY at $772.

| Source | Edge, pp | SPY $ | sd |
|---|---|---|---|
| A1(c), full / 2010-25 | +0.55 / −0.13 | +4.2 / −1.0 | 0.16 / −0.04 |
| A1(a) pro-rated, 13 of 121 sessions | +1.10 | +8.5 | 0.32 |
| A2, 13 × daily Nov-Apr excess, full / 2010-26 | +0.49 / +0.26 | +3.8 / +2.0 | 0.14 / 0.08 |
| A3 on 11/2-11/4, full / 2010-26 | +0.28 / +0.07 | +2.1 / +0.6 | 0.08 / 0.02 |

These edges overlap and do not add. The midterm effect is a drift to April 2027, with nothing in the first 2-3 weeks. On 2010-era estimates the calendar is worth 0-1 SPY point against ±26-30 of noise, and every long-call translation has EV/$ below 1.0.

Nothing is CONFIRMED, so the playbook does not change. A1(a), A2 and A3 can only break ties, and "stocks rally right after midterms" may not be cited. The options model ignores skew and the post-election IV drop.
