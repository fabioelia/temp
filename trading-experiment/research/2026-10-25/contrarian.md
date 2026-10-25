# Contrarian memo, Sun 2026-10-25

**Verdict: the crowd swapped sides, so I do too. Stop adding to the rotation. Buy one QQQ upside call Monday: the leg that hedge funds and this committee are both short. Drop the MSFT call.**

## 1. Where the crowd leans now
- **Against AI.**
  - Goldman's prime book: short leverage is at the 99th percentile of 5 years and net leverage near a 3-year low. Global IT had its heaviest two-week selling in a decade (Bloomberg, 10/22).
  - SMH/SPY fell 10.5% in 10 days (3rd percentile, 1 year). SMH Friday volume put/call was 3.11.
  - Today's committee files no tech-upside idea: an MSFT put, an IWM breakout call, a USO dip call. Last week's lesson ("AI ideas lose") is becoming our own crowded prior.
- **Into the rotation, whose fuel is spent.**
  - XLE/XLK +15.6% in 10 days (99th percentile), RSP/SPY 99th, IWM/QQQ 97th.
  - Leveraged funds covered 38.6k Russell contracts in the week to 10/20, a 99.4th-percentile week since 2017. Their short went from the 6th to the 34th percentile, so my IWM thesis has played out.
  - USO 11/20 IV rose from 47 to 56, against 32.7% realized (1.7x), with calls 7.4 vols over puts. Part of the 180C's +66% was vol.
- **Not crowded:** WTI managed-money net long is 36.2k (3.7th percentile since 2016), so no USO put either. Index fear eased: SPX put/call is 1.25 (71st percentile), down from 1.46 (97th).
- **Honest limit:** extreme rotations don't reliably reverse. XLE/XLK reversed 8 of 14 times within 17 sessions; IWM/QQQ 20 of 35. So I don't fade the winners; I buy the hated leg, where the base rate helps.

## 2. Proposal
`QQQ261120C00750000 | 2026-11-20 | 750 | C | 0.16 | 3.30/3.37 (Cboe close, quotes.py 10/25 18:43 ET; 2%) | 34,557 | Mon 10/26 14:43: buy 1 if QQQ 698.00-716.00, ^VIX < 24, live ask <= 3.60, IV <= 22%, spread <= 5%. If it fails, recheck once Thu 10/29 14:43 (after Fed, MSFT, GOOGL) with QQQ 701.16-716.00 and the same price rules; never chase above 716 | 1 contract: sell all at a 14:43 bid >= 1.5x fill; stop to cost once a bid shows +40%; sell if QQQ < 690.00 at 14:43 (thesis: shorts win at new lows); backstop bid <= 0.5x fill; time exit 11/4 14:43 (11/6 if bought Thursday); after-hours prints never count | Consensus? No by positioning; partly by story (Goldman: "buy the AI dip, pick your spots"). A generic AI buys MSFT/NVDA into prints or energy | Edge: in 24 QQQ pullbacks like Friday's since 2009, this exact exit plan returned 1.31/$ (1.23 without the best, 1.16 without the best two), +50% bank in 13/24, vs 0.99 on all days and 1.02 at its own 21% IV. Wing IV 21% < ATM 25%, about 10-day realized 22.3% | 4`

- **Rotation:** taking profits means not adding: no USO calls at 56% IV. Momentum's IWM 285C buys the spent leg; it is not contrarian.
- **Wrong if:**
  - a Fed hike;
  - QQQ below 690;
  - long-only capitulation. BofA's early-October survey was still a net 37% overweight tech, NQ asset managers are at the 88th percentile long, and NQ leveraged funds have already covered to flat (+950).

## 3. MSFT 10/28: drop
- It is the consensus trade, its robust edge is 0.87-0.94x, and no strike has passed the 5% spread rule since 10/20.
- It is the AI safe haven: 3.5% off its high (QQQ 7.3%, SMH 21.2%), +1.6% over 20 days, OI put/call 0.59. A squeeze lifts the shorted names, not the haven.
- The QQQ call replaces it. Same factor: one or the other.

## Sources
All times ET, 10/25.
- **Cboe:**
  - daily put/call, 10/19-10/23, against 455 sessions (18:33);
  - delayed chains and quotes.py (18:23-18:43).
- **CFTC:** TFF and disaggregated reports for 10/20 (18:36).
- **Yahoo:** daily bars, 1-year and 25-year (18:40). The base rates and path sims are mine.
- **Goldman prime book:** via Bloomberg (10/22 05:51), FA Mag, IBTimes and 24/7 Wall St (10/23).
- **Headlines:**
  - Yahoo, "Fed expected to hold… not done hiking" (17:00);
  - Gulf News, "Trump rules out Iran strike" (11:58);
  - Dark Side of the Boom, Goldman "buy the AI dip" (10/24 23:01).
- **Not verified:** CNN Fear & Greed (it blocks automated reads).
- **Committee:** memos from 10/23 and today's ideas CSVs.
