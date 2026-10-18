# Energy & geopolitics: oil to 11/18 (written Sun 2026-10-18)

**Bottom line: WAIT. Energy should not be shot 1.** Until the election, oil is in a stalemate with spikes, and option premium is rich. Energy's best shot is a **USO put bought pre-close on 11/2**, sized for the post-election binary. **Avoid XLE options.** Sized to the chair's new budget: $500 per shot, $1,000 in total. The $1,000 floor is confirmed in config.json.

## Tape (verified)
- 10/16 settles: Brent (Dec) $109.86 (+3.7%), highest since May. WTI (Nov) $101.41 (+3.5%). Eurasia Group raised its escalation odds to 65%.
- Hormuz flows are contested. Kpler's 7-day average was 11.62 mb/d (68% of 17.15) as of 10/13. CENTCOM says it escorted ">100M bbl crude" last week. Two more tankers hit mines on 10/17.
- EIA, week to 10/9: commercial crude 415.6M bbl (-8.6M), distillate 102.6M, SPR 283.0M.
- Washington is working hard to push prices down:
  - the IEA is releasing its last 100M bbl plus 20M bbl of diesel (10/15);
  - the US has offered 17M bbl from the SPR;
  - Russia sanctions have been waived;
  - easing sanctions on Iran's shadow fleet is under review.
- **The election clock drives everything.**
  - An Iranian official says the pace of attacks is meant to sway the midterms.
  - Trump said in September that prices likely won't fall until after the midterms. He did not rule out using the MOAB "after the Nov. 3 election".
  - Iran has re-floated its 7-day reopening plan, first tabled 9/25. Its conditions: lift the blockade, waive sanctions, and a ceasefire that includes Lebanon.
  - Deal hopes have already failed three times this year (April, August, September).
  - June 2025 precedent: US strikes were followed by Brent -6.4% the next day and then a ceasefire. A strike can end in a crash.

## Scenarios to 11/18
| Scenario | Prob | Oil | XLE | XOP |
|---|---|---|---|---|
| Escalation (a Brent close ≥ $120) | **30%** | Brent $120-135 | +5-8% (~72-74) | +6-10% |
| Stalemate (Brent $95-120) | **45%** | headline chop | ±3%, time decay wins | ±4% |
| De-escalation / deal (a WTI close < $90) | **25%** (about 2/3 of it after 11/3) | WTI $80-88 | -8-10% (~62) | -10-12% |

Template: the April ceasefire. On 4/8 USO closed -10% (-14% at the open), XLE -3.5% and XOP -4.8%. Over 8 sessions, USO fell 16%, XLE 8.5% and XOP 11.5%. Then oil rebounded 30% when the deal frayed.

**Dated decision points:**
- 10/19 open (weekend mine strikes).
- EIA reports 10/21, 10/28 (FOMC the same day), 11/4, Thu 11/12 (Veterans Day delay) and 11/18.
- Energy earnings (Robinhood-verified): HAL 10/20, VLO 10/22, SLB 10/23, PSX 10/28, XOM/CVX 10/30 before the open.
- OPEC+ 11/1: a likely non-event. Gulf output is capped by exports, and the quota of 31.01 mb/d is unchanged.
- Midterms 11/3.

## How much is priced into equities
- XLE is up 50% YTD (45.65 to 68.24) and sits at a high. But its daily beta to USO is only **0.32** (correlation 0.61, 40 sessions). Since 8/20, USO is up 20% and XLE 7%.
- Energy stocks price the backwardated futures curve, not $110 spot, so XLE moves are muted in both directions. The crowding is an equity-flow risk, not an oil call.
- Option premium is rich: XLE IV 26% against 21-23% realized; USO IV 46-50% against 40% realized.
- My scenario model, value per $1 of premium:
  - XLE 68C/70C: about **$0.75-0.80**. The brief's 68C needs XLE near 73 to double.
  - USO options: about $1.00.
- USO is the clean way to trade oil. OIH (-8% since 8/20) has no edge.

## Proposals
Reference quotes: Cboe delayed, 10/16 close, pulled 10/17 22:31 ET. Spreads should tighten intraday.

1. `USO261120P00145000 | 2026-11-20 | 145 | P | 2.62/2.80 (Cboe delayed, 10/16 close) | 46% | -0.20 | 1,442 | After 11/3 the war ends (a deal, or a strike then a ceasefire), taking WTI to $83-90; modeled 5-11x from an 11/2 entry | WAIT. Confirm in the 11/2 pre-close run (11/3 at the latest), only if Brent ≥ $100 and no deal is priced. Re-strike to ~10% OTM, delta ~0.20; modeled cost ~$1.20, so 3-4 contracts for ≤ $500 | Sell half at +100%, the rest at +200% or on a signed-deal headline; closing stop -50%; hard exit 11/17 | 4`
2. `USO261120C00190000 | 2026-11-20 | 190 | C | 2.40/2.59 (Cboe delayed, 10/16 close) | 53% | 0.19 | 1,385 | Escalation before 11/3: Iran's attack pace, Houthi strikes on Saudi Arabia and the IEA's last stocks used up push Brent to $125-135; modeled 2-4.5x | TRIGGER ONLY: Kpler 7-day flows < 10 mb/d, a confirmed hit on a Gulf export terminal, or a Brent close > $115. Buy at the next pre-close, 1-2 contracts for ≤ $500 | Sell into the spike: half at +100%, the rest at +200%; sell everything on the first US-strike headline (the June 2025 reversal); stop -50%; out by the 11/3 close unless Brent > $125 | 3`
3. `USO261218P00140000 | 2026-12-18 | 140 | P | 3.55/3.70 (Cboe delayed, 10/16 close) | 46% | -0.20 | 8,677 | Early-deal version of #1; the Dec expiry survives a false start | TRIGGER ONLY, before 11/2: the US formally engages the 7-day plan (dated direct talks, a blockade pause, or an Iran-specific sanctions waiver) while USO > 150; 1 contract | Half at +100%, the rest at +200%; stop -50%; hard exit 11/18 | 3`

#1 and #3 are the same bet, so cap them at $500 combined.

## Cross-asset
- **Escalation:**
  - Headline CPI rises (gasoline is already at a record-for-the-season $4.41).
  - The 10-year retests its 5.25-5.31% high from 10/5, and the risk of a 10/28 rate hike rises.
  - Long-duration tech and AI-credit names (CRWV, ORCL) are hit hardest; energy is the only hedge.
- **Stalemate:** Rates stay near 5%. Tech trades on its own prints (META, MSFT, GOOGL) and energy just carries.
- **Deal:**
  - Oil falls 15-25% and the 10-year drops 15-30bp (Bessent ties lower oil to lower yields).
  - Tech and AI rally, and XLE lags.
  - **USO puts and QQQ/SMH calls are the same bet.** Don't stack them. If shot 1 is AI calls, the natural complement is #2 (escalation), not #1.

## Sources
- Settles, Eurasia odds, MOAB remark, SPR: [Rigzone/Bloomberg 10/16](https://www.rigzone.com/news/wire/brent_oil_hits_110_as_supply_risks_mount-16-oct-2026-184870-article/)
- Kpler flows, EIA draw: [OilPrice 10/16](https://oilprice.com/Latest-Energy-News/World-News/Oil-Prices-Head-for-Weekly-Gain-as-Hormuz-Attacks-Rattle-Markets.html); IEA release: [HDFCSky 10/17](https://hdfcsky.com/news/brent-holds-above-105-as-hormuz-attacks-cut-gulf-flows-68percent-wti-jumps-5-81percent-on-record-us-inventory-draw)
- Midterm attack tactic, September flows: [Al Jazeera 10/14](https://www.aljazeera.com/news/2026/10/14/iran-steps-up-hormuz-surveillance-attacks-soar-oil-flows-crash-again); mines: [RFE/RL 10/17](https://rferl.org/a/iran-live-blog-trump-middle-east/33803414.html)
- 7-day plan: [Al Jazeera 9/25](https://www.aljazeera.com/news/2026/9/25/whats-in-irans-seven-day-plan-to-reopen-the-strait-of-hormuz); restated 10/17 (Middle East Eye and others, via Google News RSS)
- Trump on prices after the midterms: [WSMV 9/9](https://www.wsmv.com/2026/09/09/trump-oil-prices-likely-wont-come-down-until-after-midterms-iran-war-continues/); Bessent $40: [World Oil 9/4](https://worldoil.com/news/2026/9/4/bessent-sees-oil-falling-as-low-as-40-after-iran-war/); August deal false start: [Khaleej Times 8/4](https://www.khaleejtimes.com/business/oil-plunges-5-after-qatar-bessent-raise-hopes-of-a-us-iran-deal)
- Shadow-fleet relief: Middle East Eye and Marine Insight 10/16 (Google News RSS)
- OPEC+ quota and the 11/1 meeting: [Nairametrics 10/5](https://nairametrics.com/2026/10/05/opec-keeps-november-oil-production-unchanged-at-31-01-million-bpd/)
- June 2025 precedent: [The National 6/23/25](https://www.thenationalnews.com/business/energy/2025/06/23/qatar-base-oil-prices-iran/)
- Gasoline price: [AAA 10/1](https://gasprices.aaa.com/national-average-dips-following-record-setting-september/)
- EIA stocks table: [eia.gov, week to 10/9](https://www.eia.gov/dnav/pet/pet_stoc_wstk_dcu_nus_w.htm); Veterans Day timing: [EIA schedule](https://www.eia.gov/petroleum/supply/weekly/schedule.php) (the 2026 date is inferred)
- Prices, betas, realized vol, April path: Robinhood `get_equity_historicals`; earnings dates: Robinhood `get_earnings_calendar`; closes: `quotes.py` (Yahoo and Cboe agree); options: `quotes.py chain` (Cboe delayed, single source)
- Rates and CPI context: committee macro memo 2026-10-17 and its sources
- Payoff multiples are Black-Scholes scenario estimates (my judgment), not quotes
