# Catalyst memo (Fri 2026-10-23, post-close, Run B)

**Verdict: no shot Monday. Keep MSFT on 10/28, but expect the rules to skip it.**

## (1) My week, scored
- **Right:**
  - The dates. All re-verified today; I missed SpaceX on Sunday.
  - The 10/19 WAIT. Shot 1 lost $82.08.
  - The bear branch: META below −6.9% would put SPY near 760. META fell 7.0% and SPY closed at 759.97.
- **Wrong: exits.** I named META as the binary, then wrote "exits unchanged" at +47%. That cost $257 against the peak (options-vol).
- **Half right: META.** The 8-K facts held: capex was narrowed. But I read "capex gets rewarded" off the +3.4% after-hours move, and META closed −7.0% the next day. I also underweighted the Class C "capital raising" line and the −$2.12B free cash flow.
- **Weak: MSFT strikes** (580, 590, 590, 575). I chased the stock and missed the real problem: no strike has passed the 5% spread since 10/19.
- **Minor:**
  - "No MSFT filings" missed a 10/21 proxy, which was immaterial.
  - My 10% event-size flag was moot, because RULES.md exempts option premium.
- **Change:** every event I flag gets a written action for open positions, and I score it at the next regular close, never after hours.

## (2) Monday: no trade
- **Brent's $115 line printed only on December** (116.91, Yahoo BZZ26, 16:59). That contract expires 10/30.
  - January, the next front month, closed at 111.66. That is the brief's ~111.5: Yahoo's BZ=F rolled today.
  - USO should wait for a January settle above $115. Its 11/20 IV is already 57-59%.
- **At 14:43, log the live MSFT 570C-590C spreads.**

## (3) MSFT 10/28
- MSFT closed at 524.51, 16 above its 50-day (508.4; ~510.8 on 10/28 if flat, my calculation).
- 8% out of the money is now 566.5, so the strike walk starts at **570**.
- Closing quotes (Robinhood = Cboe, 15:59:59):

  | Strike | Bid/ask |
  |---|---|
  | 570C | 4.20/4.65 |
  | 575C | 3.35/3.80 |
  | 580C | 2.79/3.25 (15% spread, OI 15,039) |
  | 590C | 1.93/2.11 (9% spread) |

  The ceiling buys the 580C, but the spread rule blocks every strike. Above $3.00 the tick is $0.05, so a 5% spread means three ticks or fewer.
- Event σ is about 5.8-6.1% (my strip of the 10/30 straddle, 27.68), 0.1-0.4 under the 6.2% veto.
- No 8-K, 10-Q or Form 4 since 10/19.
- Calendar (Robinhood, all verified):
  - 10/28: VRT and GEV before the open; MSFT, GOOGL, NOW and KLAC after the close.
  - 10/29: AMZN and INTC, after our exit.
  - 10/30: XOM and CVX (now verified).
  - Later: AAPL 11/2, AMD 11/3, NVDA 11/17. CRWV 11/9 is unverified.
- A skip by rule is fine. **Confidence 3. No proposal.**

## Sources (10/23, ET)
- Robinhood earnings calendar and results (17:10)
- Robinhood quotes (15:59:59) and daily bars
- Cboe via quotes.py (17:20)
- EDGAR via research.py (17:12)
- Yahoo futures (16:59)
- Fed RSS (17:15): nothing new since 10/16
