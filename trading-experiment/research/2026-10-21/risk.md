# Risk memo (red team), Wed 2026-10-21 post-close, Run B

Basis: the brief's 790C quote of 5.15/5.20 (Cboe, 16:15 ET) and SPY's 773.09 close. Levels come from my Black-Scholes model, with IV 12.4% fitted to that mark.

**a) bid ≤3.00: MODIFY.** Keep the level, but on 10/28 judge a) and b) at the ~15:30 MSFT check, after the press conference. Orders still go in before 15:50.
- **Trip line:** SPY ~766 on 10/23, 768.8 on 10/27 and 769.6 on 10/28. The 10/28 line is only 0.45% below tonight's close.
- **Failure path:** On 10/28, SPY is at 768 at 14:43, during the press conference, and IV has dropped after the statement. The bid is ~2.65, so the stop sells. The press conference then turns, and SPY reaches 775 by 15:30, where the call is worth ~4.4.
- **The "worst case −$75" claim is wrong.** a) is a 14:43 trigger, not a floor: at SPY 760 at 14:43 the sale fills at ~1.4, a loss of about $235.
- **Flat SPY:** the bid falls below 3.00 around 11/2, two sessions before e)'s 11/4 check. I accept that.

**b) KEEP; reject 768.30.** The Nasdaq leg is the thesis exit for a break led only by tech, such as chip equipment (LRCX −5.8% after hours, catalyst memo). By 10/26, a) already sits at SPY ~768.

**c)–e) APPROVE.** MSFT: the 590C quote (2.82/3.05, Cboe, 17:18 ET) is 7.8% wide, so it fails the 5% spread rule. The spread is the limit that binds, not the 3.60 ceiling.
