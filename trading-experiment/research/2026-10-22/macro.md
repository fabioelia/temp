# Macro memo, Thu 2026-10-22 post-close (Druckenmiller/Soros seat)

**Verdict: the regime flipped from inflation fear to growth fear. TLT calls are the shot, on a Friday hold test. MSFT stays. Oil waits.**

## The regime
- **Oil rose and bonds rallied anyway.** Brent (Dec) was 112.87, up 3.7%, and closed "around $113"; it did not settle above $115. The Treasury 10y fell 17bp to 4.96%, the 10y breakeven fell from 2.37% to 2.32%, and the 5y real yield fell 22bp.
- **Fed pricing moved the same way.** Odds of an October hike fell to 5% (12.5% last night), and year-end pricing is 63.5bp, down from 80-90bp earlier this month. The drivers were AI capital-raising fears (META -7.5%, with less AI debt issuance) and a haven bid.
- **Oil now behaves as a tax, not an inflation impulse.** That is the regime TLT calls pay in.
- **Credit:** FRED is back, with HY OAS at 3.27% (10/21). HYG gained 0.16% when rates alone implied about +0.5%. My estimate for 10/22 is 3.35-3.40%.
- **Deal headlines are recycled.** Iran's seven conditions date from 9/25. The reported US/Israel strike plans fall after the midterms, and the White House invoked the Defense Production Act for oil today.

## Answers
1. **Ranking:**
   1. TLT 83C, on Fri 10/23 at 14:43.
   2. MSFT on 10/28. It is the opposite AI leg, so it pairs with TLT.
   3. A USO call, only on a Brent settle above $115 and only until 11/3. Pre-vote policy leans against it, and its IV is 54% against TLT's 14.6%.
   4. The flush buy. It has not fired (VIX 19.03); use QQQ, since SPY would be a wash sale.
   5. Puts. No switch has fired; HY is the closest.
   
   TLT's 1.85% move today was its largest in 60 sessions, and IV (14.6%) is above 11% realized. So I want a second day of confirmation rather than a chase.
2. **MSFT:** no change. The HYG fallback is dropped while FRED is up. The 3.46% HY veto is now only about 6-11bp away.
3. **Trigger:** ^TNX at or below 5.00% at the 14:43 check on 10/23.

`TLT261120C00083000 | 2026-11-20 | 83 | C | 0.34 | 0.75/0.76 (Cboe delayed, 17:20 ET; spread 1%) | 81,925 | 10/23 14:43 if ^TNX <= 5.00%: buy 6 contracts, limit 0.80 (<= $480, which leaves >= $437 above the floor); else re-check 10/27 | half at +100%, the rest at +200% or ^TNX <= 4.75%; closing stop -50%; sell at the 10/28 ~15:30 check if ^TNX > 5.05%; out by the 11/9 pre-close (CPI) | 5`

## Sources
- [Treasury nominal/real curves](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_yield_curve&field_tdr_date_value=2026), 10/22 (read 17:16 ET)
- [FRED HY OAS](https://fred.stlouisfed.org/series/BAMLH0A0HYM2), 17:17 ET
- Fed RSS, 17:25 ET: nothing new since 10/16 (blackout)
- investingLive: [Fed pricing](https://investinglive.com/central-banks/the-market-now-sees-a-22-chance-the-fed-doesn-t-hike-again-this-year/) 14:19 ET; [Defense Production Act and Brent](https://investinglive.com/commodities/trump-invokes-defense-production-act-for-oil-as-pump-prices-bite-12-days-before-midterms/) 16:56 ET
- Bloomberg headline, "AI Fears Fuel Haven Bid", 16:12 ET (Google News)
- Yahoo: BZZ26 and GC=F 16:59 ET; ^VIX 16:15 ET
- `quotes.py` closes (Yahoo+Cboe): HYG 77.10, TLT 81.74, USO 162.51
- Cboe chains, 17:20 ET
- The HY estimate is mine (HYG duration about 3)
