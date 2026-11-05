# Risk memo (red team), Thu 2026-10-22 post-close, Run B

**P1, 6 x TLT 83C at a 0.80 ceiling: MODIFY.**

Basis: the 83C quotes 0.75/0.76, IV 14.6%, delta 0.34, OI 81,925 (quotes.py, Cboe, 17:28 ET). The TLT levels below come from my Black-Scholes model, with IV fitted at 13.9% to the 0.755 mid at TLT 81.74.

- **Zero EV against a ~4x need.** Reaching $4,000 takes +$2,082, which is 4.3x this $480. The draft's exits (1.06 and 1.52) pay at most +$294, against −$252 at the stop. Options-vol puts EV at −0.12 to +0.04 per dollar. A trade that close to zero earns its place only with an uncapped runner.
- **The 10y ≤ 5.00% trigger filters almost nothing.** The 10y is at 4.96% (macro, 17:16 ET), so the trigger fails only if it gives back about 4bp (TLT about 81.2, my duration estimate). The 0.80 ceiling binds near TLT 81.9. Together they fill on a flat or fading day and miss a confirming one, which is the opposite of macro's "second day."
- **Momentum's 83.60 is a better filter but a worse price.** At 83.60 the 83C models about 1.60, above the draft's top exit. That level is also 1.4% under the falling 200-day average (84.81, momentum memo).
- **Hedge or doubled bet?** On the AI axis the two shots hedge each other (on 10/22 the 10y fell 17bp and MSFT fell 2.2%), so we pay time decay on both legs while one of them loses. On budget they are a doubled bet: $845 of $918. TLT alone carries the FOMC risk.
- **Failure path:** Friday is flat, so the order fills at 0.80. The haven bid then fades. On 10/28 the press conference is hawkish (63.5bp of hikes priced, macro). The 14:43 check falls mid-press-conference with TLT about 80.9 and the bid at 0.38: −$252. A flat MSFT print (−74%) would then leave about $395.

`TLT261120C00083000 | 2026-11-20 | 83 | C | 0.34 | 0.75/0.76 (quotes.py, Cboe, 17:28 ET) | 81,925 | Fri 10/23 14:43 only if TLT >= 81.74 and ^TNX <= 4.96%, spread <= 5%: buy 5, ceiling 0.90 (<= $450; >= $467 stays above the floor) | sell 2 at the first bid >= 1.4x fill and lift the rest's stop to fill; sell 2 at 2x; hold 1 runner to 3x or ^TNX <= 4.75%; stop all at bid <= 50% of fill; on 10/28 judge at the ~15:30 check, not mid-press-conference; out by the 11/12 pre-close | 3`
