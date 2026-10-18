# Options & vol, Sunday update (2026-10-18, ~18:30 ET)

**Verdict: WAIT Mon 10/19. Place no order.** Only the MSFT event vol has an edge. Every other candidate returns $0.79-0.94 per $1 of premium, so those trades rest on direction calls, not on vol.

## 1. Re-check
All option quotes are from Friday's close (Cboe delayed chain, fetched 10/18 18:25 ET); nothing has repriced since. Every entry date clears the 3-day rule.

| Contract | Entry → exit | Bid/ask | OI · spread | Δ now → entry | IV vs realized | θ/wk now → entry | Ask at entry if unch. | Move for 2x | EV/$ (range) | P(2x) |
|---|---|---|---|---|---|---|---|---|---|---|
| MSFT 11/20 580C | 10/28 → 10/29 | 4.35/4.55 | 14,465 · 4.5% ✓ | 0.18 → 0.15 | event 5.8% vs 8.2% history (0.70x); base 22.4% vs rv20 22.3% | −$80 → −$267 | ~3.25 | +6.1% overnight | **1.32** (1.01-1.67) | 15% |
| SPY 11/13 785C | trigger, by 11/10 → 11/12 | 3.09/3.15 | 1,483 · 1.9% ✓ | 0.22 | 11.7% vs rv20 10.2% (ATM 14.7%) | −$102 | ~2.95 (Mon) | +1.9% | 0.94 (0.78-1.07) | 25% |
| SPY 11/20 785C | trigger → 11/17 | 4.35/4.40 | 12,330 · 1.1% ✓ | 0.26 | 12.0% vs 10.2% | −$105 | ~4.19 (Mon) | +2.1% | 0.92 (0.79-1.03) | 25% |
| NVDA 11/20 230C | 10/22 → 11/17 | 4.50/4.60 | 98,507 · 2.2% ✓ | 0.30 → 0.29 | base 32.5% plus a 5.7% print, vs rv20 24.4% / rv60 36.5% | −$73 → −$76 | ~4.01 | +6.2% | 0.91 (0.81-1.00) | 24% |
| USO 11/20 145P | 11/2 → 11/17 | 2.62/2.80 | 1,442 · **6.6%** ✗ at 5% (✓ at 10%) | −0.20 → −0.14 | 45.7% vs rv10 28.4% / rv20 38.6% | −$63 → −$66 | ~1.35 | −7.2% | 0.79 (0.62-0.95) | 18% |
| IWM 11/20 280C | 10/29-30 → 11/17 | 2.70/2.75 | 13,294 · 1.8% ✓ | 0.29 → 0.24 | 17.8% vs rv20 14.9% | −$58 → −$63 | ~1.68 | +2.8% | 0.79 (0.69-0.94) | 19% |

How the table was built:
- **Model:** Black-Scholes on trading-day time, calibrated to Friday's mids. Monte Carlo with fat tails and zero drift (20k paths). Buys at the ask, sells at the bid, and uses the default exits: −50% stop, half at 2x, the rest at 3x or at the time exit.
- **Ranges:** the low, central and high realized vol. For MSFT the range is the event size instead: 5.8% (implied), 7.0%, and 8.2% (history, from last night's memo).
- **Move for 2x:** the move needed one week after entry, with IV unchanged. For MSFT it is the move on 10/29 after the print, with IV at 24%.
- **Delta:** MSFT, SPY and USO sit below the preferred 0.30-0.45 on purpose, for convexity.

Filter flags:
- **USO:** every 11/20 put strike from 125 to 150 has a spread of 5.6-21%. At the ~$1.35 re-strike, a $0.15 spread is 11%, which fails even the 10% limit. The committee must rule on the limit, or USO is out.
- **MSFT:** a $0.20 spread on a ~$3.25 entry is 6.2%, which fails. Only the 560 and 580 strikes pass today.
- **SPY:** at SPY 773 (the reclaim trigger) the 785C would cost about $6.50, above the $5 cap. Use the 795C instead (~$3.65 modeled, OI 10,292).

## 2. Weekend news
- **Prices (Yahoo, 18:16 ET):** ES 7,719.25 (+0.19%), NQ +0.42%, RTY +0.46%, WTI 98.26 (−0.8%), Brent 108.80 (−1.0%).
- **Headlines:** oil fell despite new IRGC mine reports (Times of Israel 17:00 ET, Middle East Eye 17:30 ET). Iran says its offer to reopen Hormuz still stands (IBTimes 10:27 ET, unverified).
- **Equity vol:** the futures point to SPY near 765 at the open, with VIX a little under 20 (my estimate; there is no VIX futures quote). Neither flows trigger can fire Monday, because both need a qualifying close first.
- **Oil vol:** a market that shrugs off tanker fires has fading headline vol (rv10 28% against IV 46%). That makes USO puts richer, and an early deal would land before the 11/2 entry.
- **Order:** unchanged: NVDA (10/22, conditional), then MSFT (10/28), IWM, and USO last. SPY is bought whenever its trigger fires.
- **One change:** set aside $360 for MSFT. If NVDA fires, buy 1 contract only ($460 + $360 = $820 of the $1,000).

## 3. Shot-1 ranking (EV per $1 of premium)
1. **MSFT, 1.32.** The only positive edge.
2. **SPY 11/13, 0.94, and SPY 11/20, 0.92.** Prefer 11/20 for its open interest, and if the trigger fires after 10/23.
3. **NVDA, 0.91.**
4. **USO, 0.79.** It reaches 1.07-1.29 only if you add energy's 10-17% odds of a deal gap on top of the roughly 1-in-6 that the 46% IV already prices.
5. **IWM, 0.79.**

When EV is below 1, extra contracts only add expected loss, so buy one each (two for IWM).

**Monday 14:43: WAIT, no order.** Record SPY, VIX and VIX9D/VIX3M for the flows triggers.

## 4. Proposals
1. `MSFT261120C00580000 | 2026-11-20 | 580 | C | 0.18 | 4.35/4.55 (Cboe, 10/16 15:59 ET) | 14,465 | Wed 10/28 14:43 after FOMC, 1 contract, limit at the live ask with a $3.60 ceiling (implied event ≤6.2%, ≤0.75x history) and spread ≤5%; if MSFT has moved, use the 11/20 call ~9-10% OTM under the same tests, else skip | sell all 10/29 14:43, no overnight stop | 4`
2. `SPY261120C00785000 | 2026-11-20 | 785 | C | 0.26 | 4.35/4.40 (Cboe, 10/16 16:14 ET) | 12,330 | flows trigger A, B or C, 1 contract, ceiling $5.00; at SPY ≥773 use SPY261120C00795000 | half at 2x, rest at 3x, −50% stop, out by 11/17 | 3`

## 5. What the committee is most likely getting wrong
**NVDA's IV ramp into 11/17 is not a tailwind.** The print's variance is already in the 11/20 price. If NVDA sits at $214, IV rises from 38% to 61%, yet the 230C falls from $3.97 (10/22) to $2.26 by 11/6, which trips the −50% stop on time decay alone, and to $1.11 by 11/17. The $9.20 target needs NVDA at about $235 or higher on 11/17.

## Sources
- Cboe delayed chains via `quotes.py` (10/16 close, fetched 10/18 18:25 ET); closes from Yahoo and Cboe, which agree.
- Robinhood `get_equity_historicals` (daily bars 7/1-10/16, used for realized vol) and `get_earnings_calendar` (MSFT 10/28 after the close, verified, fetched 10/18).
- Yahoo chart API futures, 18:16 ET.
- Headlines via `research.py news`: Times of Israel, Middle East Eye, IBTimes, Bloomberg 18:07 ET, FXLeaders 18:26 ET.
