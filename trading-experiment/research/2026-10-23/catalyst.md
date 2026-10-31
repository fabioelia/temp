# Catalyst memo (Fri 2026-10-23, post-close, Run B)

**Verdict: no shot Monday. Keep the MSFT 10/28 plan, but expect its own rules to skip it.**

## (1) My week, scored
- **Right:**
  - The earnings dates. All re-verified today, though SpaceX was missing from Sunday's list.
  - The 10/19 WAIT. Shot 1 lost $82.08.
  - The bear branch: META fell 7.0% and SPY went to 759.97.
- **Wrong: exits.** I named META as the binary risk, then wrote "exits unchanged" at +47%. That cost $257 against the peak (options-vol).
- **Half right: META.** The 8-K facts held (capex was narrowed). But I called "capex gets rewarded" from the +3.4% after-hours move, and META closed −7.0% the next day. I also underweighted the Class C "capital raising" line and the −$2.12B free cash flow.
- **Weak: MSFT strikes.** My picks moved with the stock (580, 590, 590, 575), and I missed that no strike has passed the 5% spread at any close since 10/19.
- **Minor:** "no MSFT filings" missed an immaterial 10/21 proxy. My 10% event-size flag was moot, because RULES.md exempts option premium.
- **Change:** every event I flag gets a written action for open positions. I score it at the next regular close, never after hours.

## (2) Monday: no trade
- Brent crossed the $115 line only on the December contract (116.91, Yahoo BZZ26, 16:59; settle unverified), and that contract expires 10/30.
  - January closed at 111.66. That is the brief's "~111.5", because Yahoo's BZ=F rolled today.
  - USO waits for a January settle above $115. Its 11/20 IV is already 57-59%.
- At 14:43, log the live spreads on the MSFT 570C-590C.

## (3) MSFT 10/28
- **Trend:** MSFT 524.51 is 16 above its 50-day average (508.4; about 510.8 by 10/28 if flat, my calculation).
- **Strike walk:** 8% out of the money is 566.5, so the walk now starts at **570**.
- **Closing quotes** (Robinhood = Cboe, 15:59:59): 570C 4.20/4.65, 575C 3.35/3.80, 580C 2.79/3.25 (15% wide, OI 15,039), 590C 1.93/2.11 (9%).
  - The ceiling buys the 580C, but the spread rule blocks every strike.
  - Above $3 the tick is $0.05, so a 5% spread leaves at most three ticks.
- **Event σ:** about 5.8-6.1% (my strip of the 10/30 straddle, 27.68), only 0.1-0.4 under the 6.2% veto.
- **Filings:** no 8-K, 10-Q or Form 4 since 10/19.
- **Calendar** (Robinhood, all verified):
  - 10/28: VRT and GEV before the open; the FOMC meeting is 10/27-28 (federalreserve.gov, 17:25); MSFT, GOOGL, NOW and KLAC after the close.
  - 10/29: AMZN and INTC, after our exit.
  - 10/30: XOM and CVX, now verified.
  - AAPL 11/2, AMD 11/3, NVDA 11/17. CRWV 11/9 is unverified.
- **A skip by rule is fine. Confidence 3. No proposal.**

Sources (10/23, ET):
- Robinhood earnings calendar and results (17:10), quotes (15:59:59), daily bars.
- Cboe via quotes.py (17:20).
- EDGAR (17:12).
- Yahoo futures (16:59).
- Fed RSS (17:15): nothing new since 10/16.
