# Energy & geopolitics: oil to 11/18 (written Sun 2026-10-18)

**Bottom line: WAIT. Energy should not be shot 1.** Energy's shot is a **USO put bought pre-close on 11/2**. **Avoid XLE options.** Sized to the chair's new budget ($500 per shot, $1,000 in total; the floor is confirmed in config.json).

## Tape (verified)
- 10/16 settles: Brent $109.86 (highest since May), WTI $101.41.
- Hormuz flows are contested: Kpler's 7-day average was 11.62 mb/d (68%) on 10/13, while CENTCOM claims ">100M bbl" a week. Two more tankers hit mines on 10/17.
- EIA (week to 10/9): crude -8.6M bbl to 415.6M, distillate 102.6M, SPR 283.0M.
- Washington is working to cap prices: the IEA is releasing its last 100M bbl plus 20M bbl of diesel, the US has offered 17M SPR barrels, Russia sanctions are waived, and relief for Iran's shadow fleet is under review.
- **The election clock decides it.**
  - Iran says its attack pace is meant to sway the midterms.
  - Trump said prices likely won't fall until after the midterms, and floated the MOAB "after the Nov. 3 election".
  - Iran's 7-day plan (first tabled 9/25: lift the blockade, waive sanctions, include Lebanon) has not been accepted.
  - Deals have failed three times this year (April, August, September).
  - In June 2025, US strikes were followed by Brent -6.4% and then a ceasefire.

## Scenarios to 11/18
| Scenario | Prob | Oil | XLE | XOP |
|---|---|---|---|---|
| Escalation (a Brent close ≥ $120) | **30%** | $120-135 | +5-8% | +6-10% |
| Stalemate | **45%** | Brent $95-120 | ±3%, time decay wins | ±4% |
| Deal (a WTI close < $90) | **25%** (2/3 of it after 11/3) | WTI $80-88 | -8-10% | -10-12% |

The April ceasefire template: over 8 sessions USO fell 16%, XLE 8.5% and XOP 11.5%, then oil rebounded 30%.

**Dates:** EIA 10/21, 10/28 (FOMC), 11/4, 11/12 (Thursday), 11/18. Earnings: VLO 10/22; XOM/CVX 10/30 before the open (Robinhood-verified). OPEC+ 11/1 is a non-event, since output is capped by exports. Midterms 11/3.

## How much is priced into equities
- XLE is up 50% YTD and at a high, but its beta to USO is only **0.32** (40 sessions). Since 8/20, USO is up 20% and XLE 7%.
- Equities price the backwardated curve, not spot. The crowding is a flow risk, not an oil call.
- Premium is rich: XLE IV 26% against 21-23% realized; USO IV 46-50% against 40%.
- My model's expected value per $1 of premium: XLE 68C/70C **~$0.75-0.80** (the 68C needs XLE near 73 to double); USO options ~$1.00.
- **USO is the vehicle.**

## Proposals
Reference quotes: Cboe delayed, 10/16 close, pulled 10/17 22:31 ET.

1. `USO261120P00145000 | 2026-11-20 | 145 | P | 2.62/2.80 (Cboe, 10/16 close) | 46% | -0.20 | 1,442 | Post-election end of the war (a deal, or a strike then a ceasefire) takes WTI to $83-90; modeled 5-11x from the 11/2 entry | WAIT. Confirm in the 11/2 pre-close run (11/3 at the latest), only if Brent ≥ $100 and no deal is priced. Re-strike to ~10% OTM; modeled ~$1.20, so 3-4 contracts for ≤ $500 | Half at +100%, the rest at +200% or on a signed deal; closing stop -50%; hard exit 11/17 | 4`
2. `USO261120C00190000 | 2026-11-20 | 190 | C | 2.40/2.59 (Cboe, 10/16 close) | 53% | 0.19 | 1,385 | Pre-election escalation (Iran's pace, Houthi strikes on Saudi Arabia, the IEA's stocks used up): Brent $125-135, 2-4.5x | TRIGGER: Kpler flows < 10 mb/d, a hit on a Gulf export terminal, or a Brent close > $115. Buy at the next pre-close, 1-2 contracts for ≤ $500 | Sell into the spike; sell everything on the first US-strike headline; stop -50%; out by the 11/3 close | 3`
3. `USO261218P00140000 | 2026-12-18 | 140 | P | 3.55/3.70 (Cboe, 10/16 close) | 46% | -0.20 | 8,677 | Early-deal version of #1; the Dec expiry survives a false start | TRIGGER before 11/2: the US formally engages the 7-day plan (dated talks, a blockade pause, or an Iran sanctions waiver) while USO > 150; 1 contract | Half at +100%, the rest at +200%; stop -50%; hard exit 11/18 | 3`

#1 and #3 are the same bet: cap them at $500 combined.

## Cross-asset
- **Escalation:** CPI rises (gasoline at a record-for-the-season $4.41). The 10-year retests 5.25-5.31% and the risk of a 10/28 hike rises. Long-duration and AI-credit names (CRWV, ORCL) are hit hardest.
- **Stalemate:** Rates stay near 5% and tech trades on its own prints.
- **Deal:** Oil falls 15-25%, the 10-year drops 15-30bp, tech and AI rally, and XLE lags. **USO puts and QQQ/SMH calls are the same bet.** If shot 1 is AI calls, pair it with #2, not #1.

## Sources
- Settles, Eurasia odds, MOAB remark, SPR: [Rigzone/Bloomberg 10/16](https://www.rigzone.com/news/wire/brent_oil_hits_110_as_supply_risks_mount-16-oct-2026-184870-article/)
- Kpler flows, EIA draw: [OilPrice 10/16](https://oilprice.com/Latest-Energy-News/World-News/Oil-Prices-Head-for-Weekly-Gain-as-Hormuz-Attacks-Rattle-Markets.html); IEA release: [HDFCSky 10/17](https://hdfcsky.com/news/brent-holds-above-105-as-hormuz-attacks-cut-gulf-flows-68percent-wti-jumps-5-81percent-on-record-us-inventory-draw)
- Midterm attack tactic: [Al Jazeera 10/14](https://www.aljazeera.com/news/2026/10/14/iran-steps-up-hormuz-surveillance-attacks-soar-oil-flows-crash-again); mines: [RFE/RL 10/17](https://rferl.org/a/iran-live-blog-trump-middle-east/33803414.html)
- 7-day plan: [Al Jazeera 9/25](https://www.aljazeera.com/news/2026/9/25/whats-in-irans-seven-day-plan-to-reopen-the-strait-of-hormuz) (restated 10/17, Middle East Eye via Google News)
- Trump on prices after the midterms: [WSMV 9/9](https://www.wsmv.com/2026/09/09/trump-oil-prices-likely-wont-come-down-until-after-midterms-iran-war-continues/); Bessent $40: [World Oil 9/4](https://worldoil.com/news/2026/9/4/bessent-sees-oil-falling-as-low-as-40-after-iran-war/); August false start: [Khaleej Times 8/4](https://www.khaleejtimes.com/business/oil-plunges-5-after-qatar-bessent-raise-hopes-of-a-us-iran-deal)
- OPEC+: [Nairametrics 10/5](https://nairametrics.com/2026/10/05/opec-keeps-november-oil-production-unchanged-at-31-01-million-bpd/)
- June 2025 precedent: [The National 6/23/25](https://www.thenationalnews.com/business/energy/2025/06/23/qatar-base-oil-prices-iran/)
- Gasoline: [AAA 10/1](https://gasprices.aaa.com/national-average-dips-following-record-setting-september/)
- EIA: [stocks table](https://www.eia.gov/dnav/pet/pet_stoc_wstk_dcu_nus_w.htm); [schedule](https://www.eia.gov/petroleum/supply/weekly/schedule.php) (the 11/12 date is inferred)
- Prices, betas, realized vol, April path, earnings dates: Robinhood `get_equity_historicals` / `get_earnings_calendar`; closes: `quotes.py` (Yahoo and Cboe agree); options: `quotes.py chain` (Cboe delayed, single source)
- Rates context: committee macro memo 2026-10-17
- Payoff multiples are my Black-Scholes scenario estimates, not quotes
