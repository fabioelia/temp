# Election post-mortem: the warning signs we missed (midterms, 11/3/2026)

Written 2026-11-11. Data: Yahoo and the Polymarket price history (fetched 11/11); scripts in scratchpad `pm_scripts/`. (hl) = Google News headline only.

## 1. What was public before our 11/4 14:43 entry

| Date | Signal |
|---|---|
| 8/14, Oct | BofA's Hartnett: a Democratic sweep plus Texas means a slump of more than 10%; he called Texas "affordability versus AI data centers" ([24/7 Wall St, 11/4](https://247wallst.com/investing/2026/11/04/bofa-warned-about-this-exact-election-night-in-august/); MarketWatch 10/9, hl) |
| 9/24 | Bloomberg: "AI Trade Is Ground Zero as Stock Investors Map Election Risks" (hl) |
| 9/3-10/31 | Sanders' federal data-center moratorium (Politico 9/3, hl). On 10/15 Hinojosa pledged a Texas moratorium (Texas holds about 27% of US data-center GW). Guardian 10/22: "How tech became the villain of the US midterms" (hl) |
| **11/2** | **Reuters listed the losers of a blue wave:** AI, data centers, MU/SNDK/STX, chip equipment, power providers. A sweep was at 72% on Polymarket. SocGen dissented ([Devdiscourse copy](https://www.devdiscourse.com/article/international/4001191-sectors-bracing-for-a-pivot-as-usmidterm-elections-loom)) |
| Oct | Polymarket "any state enacts a data-center moratorium by 12/31": 15% (10/5) to 31% (10/28). "US AI safety bill before 2027": 4.5% to 13% (11/2). Both are thin markets |
| 10/30-11/3 | AI was already de-rating: SOXX -8.2% on 10/30, QQQ -9% from its high. VXN/VIX 1.47 on 11/3, the 79th percentile of the past year |
| 11/3 night | NQ=F fell 2.4% between 16:00 and 21:00 ET, against -1.3% for ES=F. Our macro run ended at 19:05 ET ("ES flat") |
| **11/4** | Reuters at 07:45 ET: "AI data center stocks dip, renewables surge" (**this is in our own pre-open note**). At the close SPY was +1.7% and RSP +1.9%, but XLK was 0.0% and SOXX -3.1%. The losers Reuters named fell: MU -7.0%, SNDK -7.9%, STX -8.1%, VST -13.8%, GEV -9.3%. VXN/VIX rose to 1.51 (85th percentile) |

## 2. Evidence on elections and policy shocks

- **Index studies hide the sector fight.** Our 11/3 veto used [NBER w12751](https://www.nber.org/digest/jul07/effect-congressional-majorities-financial-variables), which measures only index moves. The cross-section moves a lot more: Knight (2006, *J. Public Econ.*) on 2000; Wagner, Zeckhauser and Ziegler (2018, *JFE*, [w23152](https://www.nber.org/papers/w23152.pdf)) on 2016.
- **Diffusion is slow when the consequences are complex.** In 2016 simple tax effects were priced fast and trade effects slowly (Wagner, Zeckhauser and Ziegler). Industries lead the market (Hong, Torous and Valkanov 2007, *JFE*). Regulation hits the whole sector (Bittlingmayer and Hazlett 2000, *JFE*, on Microsoft antitrust).
- **Rotation under a rising index:** SPY +1% or more with XLK lagging by at least 1 point on 2016-11-09 and 2020-11-09.
- **Options insure the political tail** (Kelly, Pástor and Veronesi 2016, *JF*, [w19812](https://www.nber.org/papers/w19812.pdf)). Index implied vol collapses after the vote, but the policy risk stays.

## 3. What was knowable, and what is hindsight

**Knowable:** the loser map, the sweep odds, the rising policy odds, an AI tape already de-rating, the Nasdaq-led drop on election night, and the 11/4 divergence, which was in our own notes.

We asked "is the result priced into the index?", not "who loses, and what is their weight?" NVDA alone is about 7.6% of SPY.

**Hindsight:**
- The size and timing (SOX -12% on 11/5; the "national moratorium" call at 15:16 ET, after our entry).
- The AI-bill odds fell on 11/4 (12% to 8%); the VIX at 16.6 priced calm.
- The history is thin. On SPY +1% days with SOXX lagging by 2.5 points or more (n 21 since 2001), the chance of a 5-day SPY drawdown of 3% or more was 48%, against 17% on other +1% days. With the VIX at 14-30 and 2026 excluded, n is 5 (40% against 13%). An XLK lag of 1 point or more (n 29) gives 24% against 15%.

**Verdict:** this was a reason to wait or size down, not a forecast.

## 4. A proposed policy-event watch

| # | What to watch | Signal | Action |
|---|---|---|---|
| W0 | Elections, bills and rulings, 30 days ahead | Write the loser basket (ETFs, SPY weight) from published notes before the event | Feeds W2 |
| W1 | Policy markets in the `predmkt.py` WATCH list | Odds up 2x, or by 10 points or more, in 30 days | Flag |
| W2 | **The divergence gate:** the event day plus 2 sessions | SPY up while XLK lags by 1 point or more, SOXX lags by 2.5 points or more, or the basket falls 2% or more | No new bullish index option; held calls get stop checks at 10:00 and 12:00 ET |
| W3 | Vol mismatch | VXN/VIX at or above its 80th percentile | Halve the size |
| W4 | Futures at 22:00 ET on the event night | NQ=F trails ES=F by 1 point or more | Pre-open flag |

**Pre-registered claims** (fixed now):

- **P1 (Yahoo, 1998-2012 in-sample, 2013-2026 out-of-sample):** On SPY +1% days, a sector with at least 10% weight that lags SPY by 2 or more of its own daily standard deviations raises P(SPY 5-day minimum ≤ -3%) by at least 1.5x against other +1% days, within VIX terciles. Pass: Fisher p < 0.10 out of sample; if it fails, W2 is a sizing check only.
- **P2:** With `goal_odds.py` pricing, delta 0.35-0.40 SPY calls entered on W2 days return at least 0.10 per dollar less than calls entered on all days.
- **P3 (forward):** After a W1 flag, the loser basket trails SPY over 10 sessions. Judged after 10 flags.
- **P4 (forward):** After a W4 flag, QQQ trails SPY the next day.
