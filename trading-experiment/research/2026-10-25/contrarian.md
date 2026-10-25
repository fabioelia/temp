# Contrarian memo, Sun 2026-10-25

**Verdict: the crowd swapped sides, so I do too. Stop adding to the rotation. Buy one QQQ upside call Monday, the leg that hedge funds and this committee are both short. Drop the MSFT call.**

## 1. Where the crowd leans
- **Against AI.**
  - Goldman's prime book has short leverage at the 99th percentile of 5 years and net leverage near a 3-year low, after the heaviest two-week IT selling in a decade (Bloomberg, 10/22).
  - SMH/SPY fell 10.5% in 10 days (3rd percentile).
  - Today's committee has no tech-upside idea. Last week's lesson ("AI loses") is becoming our own crowded prior.
- **Into a rotation whose fuel is spent.**
  - XLE/XLK +15.6% in 10 days (99th percentile), IWM/QQQ 97th.
  - Leveraged funds covered 38.6k Russell contracts in the week to 10/20 (a 99.4th-percentile week since 2017), so my IWM thesis has played out.
  - USO IV went from 47 to 56, against 32.7% realized.
- **Not crowded:** WTI speculators' net long is at the 3.7th percentile, so no USO put.
- **Limit:** extreme rotations reverse only about half the time (XLE/XLK 8/14, IWM/QQQ 20/35). I buy the hated leg instead of fading the winners.

## 2. Proposal
`QQQ261120C00750000 | 2026-11-20 | 750 | C | 0.16 | 3.30/3.37 (Cboe close, quotes.py 10/25 18:43 ET; 2%) | 34,557 | Mon 10/26 14:43: buy 1 if QQQ 698.00-716.00, ^VIX < 24, live ask <= 3.60, IV <= 22%, spread <= 5%; else once Thu 10/29 14:43 with QQQ 701.16-716.00, same price rules; never above 716 | 1 contract: sell all at a 14:43 bid >= 1.5x fill; stop to cost after +40%; sell if QQQ < 690.00 at 14:43; backstop bid <= 0.5x; out 11/4 14:43 (11/6 if bought Thu); after-hours moves never count | Consensus? No by positioning, partly by story (Goldman: "buy the AI dip, pick your spots"); a generic AI buys MSFT/NVDA into prints, or energy | Edge: in 24 similar QQQ pullbacks since 2009, this exit plan returned 1.31/$ (1.23 without the best, 1.16 without the best two; +50% banked in 13/24), vs 0.99 on all days and 1.02 at its own 21% IV; wing IV 21% < ATM 25%, about 10-day realized 22.3% | 4`

- **Rotation:** taking profits means not adding: no USO calls at 56% IV, and momentum's IWM 285C is not contrarian.
- **Wrong if:**
  - a Fed hike;
  - QQQ below 690;
  - long-only capitulation: BofA's early-October survey was still net 37% overweight tech, and NQ asset managers are at the 88th percentile long.

## 3. MSFT 10/28: drop
- It is the consensus trade, its robust edge is 0.87-0.94x, and no strike has met the 5% spread since 10/20.
- It is also the AI haven: 3.5% off its high (SMH 21.2%), with OI put/call 0.59.
- QQQ replaces it, not both.

## Sources
All times ET, 10/25.
- **Cboe:** daily put/call 10/19-10/23 (18:33); chains and quotes.py (18:23-18:43).
- **CFTC:** TFF and disaggregated reports, 10/20 (18:36).
- **Yahoo:** 1-year and 25-year bars (18:40). Base rates and path sims are mine.
- **Goldman prime book:** via Bloomberg (10/22 05:51), FA Mag, IBTimes.
- **Headlines:** Yahoo, "Fed expected to hold… not done hiking" (17:00); Gulf News, "Trump rules out Iran strike" (11:58); Dark Side of the Boom, "Goldman… buy the AI dip… pick your spots" (10/24 23:01).
- **Not verified:** CNN Fear & Greed (it blocks automated reads).
