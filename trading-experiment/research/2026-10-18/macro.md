# Macro memo, Sun 2026-10-18 (Druckenmiller/Soros seat)

**Verdict: no default fill Monday.**
- **Shot 1 is a rates trade:** TLT 11/20 82C, triggered once the 10y is ≤5.05%. The trigger can fire as early as Monday at 14:43.
- **Any equity call waits** for the 10/28 FOMC.
- Option quotes are Friday 10/16 closes (Cboe delayed, pulled 10/18 18:30 ET).

## Regime, 10/19-11/18 (S&P closes)
| Outcome | Now | Saturday |
|---|---|---|
| New high (>7,819) | **40%** | 38% |
| Chop | **43%** | 44% |
| ≤7,193 (-8%) | **17%** | 18% |

The shift comes from bonds.

**The Sunday puzzle: the mines are noise and the oil shock has stopped compounding.**
- **Serial claims, unverified.** The IRGC has claimed mine hits since 10/10, aimed at "non-compliant" ships on the US-backed lane (WANA 18:01 ET). They don't cut the ~68% flow that Friday's Brent +3.7% priced.
- **"WTI -$3" (FXLeaders 18:11 ET) is a contract roll.** Yahoo's CL=F is now December. November WTI is 101.23 against its 101.41 settle; Brent is 108.95 against 109.86 (Yahoo, 18:18 ET).
- **Cross-asset agrees:** ZN +9/32 (10y ≈5.06%), DXY flat, gold +0.3%.
- **Policy is the marginal barrel:** Vance's "won decisively in some ways", the Russian diesel waiver (Reuters 18:24 ET), and IEA/SPR releases.
- **What breaks this reading:** a hit on a compliant tanker or a terminal confirmed by UKMTO or CENTCOM; Kpler flows <10 mb/d; a Brent settle >$112; or oil rising with the 10y >5.15%.

## Primary sources
**FOMC minutes (Sep 15-16, released 10/7)**
- "Most participants assessed that another increase... would likely be appropriate by year end"; inflation risks are "more skewed to the upside".
- The staff assumed gasoline would fall.
- Term premium is blamed on buyback implementation, AI debt issuance and geopolitics.
- **10/28: hold 82%, hike 18%.** December is the live meeting, and the risk is a hawkish hold. After the 9/16 hike, the 10y *fell* 7bp.

**Treasury curve (10/16)**
- 10y 5.09% (5.31% on 10/5), 30y 5.43% (5.66%), 2y 4.74%.
- Bonds are hedging again: since 10/5, TLT is up 3.8% while IWM is down 4.6%.
- AI credit stress shrinks the AI issuance that competes with Treasuries for capital. **The 10y at 5.1% is cheap unless oil re-escalates.**

**EIA (week to 10/9)**
- Crude stocks -8.6M bbl, distillate -12.3% y/y, SPR -30.6% y/y.
- With buffers this thin, oil falls only on a real deal, so USO puts stay post-11/3.

## Proposals
1. `TLT261120C00082000 | 2026-11-20 | 82 | C | 0.31 | 0.67/0.69 (Cboe delayed, 10/16 close) | 46,305 (spread 2.9%, passes) | Entry: first 14:43 from 10/19 with the 10y ≤5.05% and Brent <$110; latest 10/28 14:43 if the Fed holds; skip if the 10y >5.20%. 7 contracts, ≤$500 | Exit: half at +100% (10y ~4.95%), rest at +200% or 10y ≤4.80%; stop -50% (≈10y 5.15%); out by the 11/12 pre-close | 5`
   - Black-Scholes estimate: a 10y at 4.90% by 10/28 gives about 2.8x.
2. `SPY261120C00785000 | 2026-11-20 | 785 | C | 0.26 | 4.35/4.40 (Cboe delayed, 10/16 close) | 12,330 (spread 1.1%, passes) | Entry: 10/28 14:43 only on a hold with no new hike language, the 10y ≤5.00% and SPY ≥760; 1 contract | Exit: half at +100%, rest at +200% or by the 11/17 pre-close; stop -50% | 4`
   - Not IWM: it trades AI credit, not rates.

## What the committee is getting wrong
- **NVDA, SPY, MSFT, IWM calls and USO puts are one bet:** de-escalation plus AI relief.
- **Nothing pays if AI credit cracks.**
- **TLT calls (IV 14.5%) pay in two of three paths:** a deal or a credit crack.

## Sources
- Fed RSS (read 10/18 18:20 ET); [FOMC minutes 9/15-16](https://www.federalreserve.gov/monetarypolicy/fomcminutes20260916.htm), read in full
- [Treasury par curve](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_yield_curve&field_tdr_date_value=2026) (through 10/16)
- EIA WPSR [table1.csv](https://ir.eia.gov/wpsr/table1.csv) (week to 10/9)
- News:
  - [FXLeaders 10/18](https://www.fxleaders.com/news/2026/10/18/oil-prices-fall-with-wti-3-down-as-vance-signals-possible-de-escalation-in-iran-war/)
  - research.py news 10/18 (WANA 18:01 ET; Reuters headline 18:24 ET)
  - IRGC claim pattern: [Kurdistan24](https://www.kurdistan24.net/en/story/936168)
- Market data:
  - Yahoo futures (CLX26, CLZ26, BZ=F, ZN=F; 18:18 ET)
  - Daily closes for TLT, ^TNX and IWM
  - quotes.py chains
