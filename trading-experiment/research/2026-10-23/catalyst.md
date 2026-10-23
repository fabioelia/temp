# Catalyst memo (Fri 2026-10-23, post-close, Run B)

**Verdict: no shot Monday. Keep MSFT on 10/28, but expect the rules to skip it.**

## (1) My week, scored
- **Right:**
  - The dates, all re-verified today. SpaceX was missing on Sunday; I added it Monday.
  - The 10/19 WAIT. Shot 1 lost $82.08.
  - The bear branch: META down 7.0%, SPY to 759.97.
- **Wrong: exits.** I named META as the binary, then wrote "exits unchanged" at +47%. That cost $257 against the peak (options-vol).
- **Half right: META.** The 8-K facts held: capex was narrowed. But I read "capex gets rewarded" off the +3.4% after-hours move, and META closed −7.0% the next day. I underweighted the Class C "capital raising" line and the −$2.12B free cash flow.
- **Weak: MSFT strikes.** I re-struck as the stock moved (580, 590, 590, 575) and missed that no strike has passed the 5% spread since 10/19.
- **Minor:**
  - "No MSFT filings" missed an immaterial 10/21 proxy.
  - The 10% event-size flag was moot: RULES.md exempts option premium.
- **Change:** every event I flag gets a written action for open positions, and I score it at the next regular close, never after hours.

## (2) Monday: no trade
- **Brent's $115 line printed only on December** (116.91, Yahoo BZZ26 16:59). That contract expires 10/30.
  - January closed at 111.66. That is the brief's ~111.5, because Yahoo's BZ=F rolled today.
  - USO should wait for a January settle above $115. Its 11/20 IV is already 57-59%.
- **At 14:43, log the live MSFT 570C-590C spreads.**

## (3) MSFT 10/28
- **Trend:** MSFT 524.51 is 16 above its 50-day (508.4; ~510.8 on 10/28 if flat, my calculation).
- **Strike walk:** 8% OTM is 566.5, so the walk starts at **570**.
- **Closing quotes** (Robinhood = Cboe, 15:59:59):
  - 570C 4.20/4.65; 575C 3.35/3.80.
  - 580C 2.79/3.25, a 15% spread (OI 15,039).
  - 590C 1.93/2.11, a 9% spread.
- **The ceiling buys the 580C, but the spread rule blocks every strike.** Above $3 the tick is $0.05, so a 5% spread leaves at most three ticks.
- **Event σ** is ~5.8-6.1% (my strip of the 10/30 straddle, 27.68). That is 0.1-0.4 under the 6.2% veto.
- **Filings:** no 8-K, 10-Q or Form 4 since 10/19.
- **Calendar** (Robinhood, all verified):
  - 10/28: VRT/GEV before the open; MSFT, GOOGL, NOW and KLAC after the close.
  - 10/29: AMZN/INTC, after our exit.
  - 10/30: XOM/CVX, now verified.
  - AAPL 11/2, AMD 11/3, NVDA 11/17. CRWV 11/9 is still unverified.
- **A skip by rule is fine. Confidence 3. No proposal.**

Sources (10/23, ET): Robinhood earnings calendar/results (17:10), quotes (15:59:59) and bars; Cboe via quotes.py (17:20); EDGAR via research.py (17:12); Yahoo futures (16:59); Fed RSS (17:15, nothing new since 10/16).
