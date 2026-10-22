# Macro memo, Thu 2026-10-22 post-close (Druckenmiller/Soros seat)

**Verdict: the market now fears growth, not inflation. Buy TLT calls if the bond rally holds Friday; keep MSFT; oil waits.**

## Regime
- **Bonds rallied while oil rose.**
  - Brent was 112.87 (+3.7%), short of a $115 settle.
  - The 10y fell 17bp to 4.96%. The breakeven fell from 2.37% to 2.32%, and the 5y real yield fell 22bp.
  - The odds of an October hike fell to 5% (from 12.5%); year-end pricing is 63.5bp (80-90bp earlier this month).
  - Drivers: AI capital-raising fears and a haven bid. **Oil now acts as a tax on growth, which is the regime TLT calls pay in.**
- **Credit:** HY OAS was 3.27% on 10/21. HYG rose 0.16% while rates alone implied about +0.5%, so I estimate 3.35-3.40%.
- **The deal headlines are recycled** (Iran's terms date from 9/25). The reported strike plans fall after the midterms.

## Answers
1. **Ranking:**
   1. TLT 83C, Fri 10/23 at 14:43.
   2. MSFT on 10/28. It is the opposite AI leg, so the two make a pair.
   3. A USO call, only on a Brent settle above $115 and only until 11/3. Its IV is 54%, against TLT's 14.6%.
   4. The flush buy (VIX 19.03); use QQQ to avoid a wash sale.
   5. Puts. No switch has fired.
   
   TLT's +1.85% was its biggest move in 60 sessions, so I want a second day of confirmation, not a chase.
2. **MSFT: unchanged.** I am dropping the HYG fallback now that FRED is back. The 3.46% veto is only about 6-11bp away.
3. **Trigger:** ^TNX at or below 5.00% at 14:43 on 10/23.

`TLT261120C00083000 | 2026-11-20 | 83 | C | 0.34 | 0.75/0.76 (Cboe delayed, 17:20 ET; spread 1%) | 81,925 | 10/23 14:43 if ^TNX <= 5.00%: buy 6 contracts, limit 0.80 (<= $480, leaving >= $437 above the floor); else re-check 10/27 | half at +100%, the rest at +200% or ^TNX <= 4.75%; closing stop -50%; sell at the 10/28 ~15:30 check if ^TNX > 5.05%; out by the 11/9 pre-close (CPI) | 5`

## Sources
- [Treasury nominal/real curves](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_yield_curve&field_tdr_date_value=2026), 10/22 (read 17:16 ET)
- [FRED HY OAS](https://fred.stlouisfed.org/series/BAMLH0A0HYM2), 17:17 ET
- Fed RSS, 17:25 ET: nothing new since 10/16
- investingLive: [Fed pricing](https://investinglive.com/central-banks/the-market-now-sees-a-22-chance-the-fed-doesn-t-hike-again-this-year/) 14:19 ET; [the Defense Production Act and Brent ~$113](https://investinglive.com/commodities/trump-invokes-defense-production-act-for-oil-as-pump-prices-bite-12-days-before-midterms/) 16:56 ET
- Bloomberg headline ("AI Fears Fuel Haven Bid"), 16:12 ET (Google News)
- Yahoo: BZZ26 at 16:59 ET; ^VIX at 16:15 ET
- `quotes.py` closes (Yahoo+Cboe): HYG 77.10, TLT 81.74
- Cboe chains, 17:20 ET
- The HY figure is my estimate (HYG duration about 3)
