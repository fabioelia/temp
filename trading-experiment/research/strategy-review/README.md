# Strategy review, 2026-10-29: what the blogs claim, and what survived testing

**Owner's ask:** "Do some research search online blogs and articles to see other investment strategies and then confirm if they work before taking any
learnings from them."

**How:**
* Web search found the popular claims, summarized in the final message's sources.
* Each claim and its exact test were committed before any result (`PROTOCOL.md`, `claims.md`, commit ac5e715).
* Four test agents ran them on Yahoo daily data back to 1950 and SEC 8-K earnings dates back to 2005, with costs, splits before and after 2010, a
  random-entry baseline and an options model.
* The scripts are in `scripts/` and the details in `calendar.md`, `patterns.md`, `earnings.md` and `options.md`.

## Verdicts

| ID | Claim (popular source) | Verdict | The number that decides it |
|---|---|---|---|
| A1 | Midterm-year rally (CNBC/Stovall, Capital Group, 24/7 Wall St) | WEAK for election day to April; REJECTED for our window | Election to 4/30: 19/19 up, +14.1%, but the excess decayed to +3.0 pts since 2010 (n 4). Election to +11 sessions: excess +0.07% (z 0.08) |
| A2 | Halloween indicator (Bouman-Jacobsen) | WEAK | +4.9 pts/yr overall (t 3.25), but +2.4 (t 0.73) since 2010 and -0.15 over the last 10 years |
| A3 | Turn of the month (Lakonishok-Smidt) | WEAK | t 6.7 in 1950-89, t 0.58 since 2010; options EV 0.98 |
| B1 | Connors RSI(2) dip-buying on SPY (StockCharts, Quantified Strategies) | WEAK | t 3.5 overall, but the edge halved since 2010 (t 1.2). Calls: 0.93 per $, below random entry (0.96) |
| B2 | O'Neil follow-through day (IBD; Kraul's "74%") | WEAK | 10-day excess +0.27% (t 0.9). Options EV 1.08 since 2010, CI 0.86-1.31. IWM follow-through days: 0.95 |
| B2* | Our momentum persona: "0.81 after a run-up vs 1.27 after pullbacks" | NOT REPRODUCED (noise) | 0.88 vs 1.15 (p 0.33), and the order reverses since 2010 |
| C1 | Big earnings gaps continue (blogs) vs "PEAD is dead in large caps" (Martineau 2021) | Down gaps of 8% or more: CONFIRMED (barely). Up gaps: REJECTED/WEAK | Down 8%+: n 216, 62% continue, +0.90% over 5 sessions beyond SPY (t 2.5; since 2015 t 2.4), gone by day 10. **The put only breaks even (EV 1.00), and pays only when its IV is at most ~1.3x the pre-print 20-day realized vol.** Up gaps: 50% continue since 2010 |
| C1* | Our catalyst persona: "34/48 continued; n 93, EV 1.07-1.18" | NOT REPRODUCED | 57% of 864; EV 1.00 |
| C2 | Pre-earnings run-up (vendor "buy calls 7 days before") | Stock: CONFIRMED (small). Through options: WEAK | +0.26% (t 2.7). The calls' edge depends on an assumed IV ramp: 1.04 against 1.03 for a random call. NVDA's own run-up since 2015 is -0.08% |
| C3 | Retail option buyers lose 5-14% around earnings (de Silva, Smith & So) | Literature only | Consistent with our event-vol rule; no historical option prices to test it here |
| D1 | Buying options loses on average (variance risk premium) | CONFIRMED (model) | VIX was above the next 21 days' realized vol on 86% of days (+4.1 pts). At VIX pricing, a 0.35-delta call returns 0.83 per $ over 10 days. **At the real skew, OTM index calls are about fair (SPY 1.13 in 2010-26, a bull market's drift); the premium sits in puts** |
| D2 | "Buy options when IV is low" (tastylive, Barchart rules of thumb) | REJECTED | 0.84 vs 0.83 (t 0.4); to expiry the sign is wrong (0.60 vs 0.66) |
| D3 | Far-OTM "lottery" options lose more per $ | CONFIRMED (model) | Delta 0.10 returns 0.49 vs 0.93 for delta 0.50 (to expiry 0.10, hit 2%) |
| D4 | Our exits (+50%, +50/+100%, -50% stop) vs holding | WEAK | In-model, all the benefit comes from the -50% stop (+0.05, t 5.4); the targets are noise (t 0.1). At the real call skew (post-hoc), holding 15 days beats our exit set by ~0.14 per $ (t -3.6) |

## What we take from it (only CONFIRMED results change the playbook)
1. **Earnings continuation is a puts-only, down-gap rule, with an IV gate.** It applies to a mega-cap down 8% or more on the reaction day:
   * enter at that day's 14:43 check, a put at delta 0.30-0.45;
   * buy only if its quoted IV is at most 1.3x the pre-print 20-day realized vol;
   * hold at most 5 sessions.

   Up-gap call continuation rules are removed.

   Applied today: the GOOGL proposal O010 now needs put IV at or below 30%. The INTC call leg is dropped. On Friday, INTC or AMZN puts qualify only on a
   down gap of 8% or more that passes the IV gate.
2. **The options headwind is real and sits in puts.**
   * Buying puts needs a measured edge that beats the put premium.
   * Never buy below delta 0.25.
   * "IV is low" is never a reason on its own.
3. **No more "measured edges" without a script.** Three persona statistics failed to reproduce:
   * momentum's run-up split;
   * IWM's 1.05;
   * catalyst's 34/48 and its n 93.

   From now on an edge figure counts only if it comes from a committed script or a cited published study.
4. **Arguments retired:**
   * the midterm-window rally, the Halloween effect, the turn of the month, RSI(2) dips, and a follow-through day as an "edge figure";
   * for NVDA's own run-up, the evidence is -0.08%, so it can only break a tie.

## Open for the owner and the Sunday review (WEAK, so not changed)
* **D4 (exits):** with calls priced at the real skew, our +50% take-profit and stop-to-cost cut the expected value against simply holding 15 days (post-hoc,
  about -0.14 per $). The resting +50% take-profit was the owner's choice on 10/26. The evidence for changing it is not strong enough to act on yet, but it
  is the biggest open question.
* **The honest bottom line:** apart from the narrow down-gap put, none of the popular strategies gives us a tested edge through options, inside our window.
  Closing the 4.7-point gap to SPY would need a directional bet on the market (calls priced near fair), which is a gamble, not an edge.
