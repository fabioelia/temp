# Options & vol, Sunday update (2026-10-18, ~18:30 ET)

**Verdict: WAIT Mon 10/19. Place no order.** Only the MSFT event vol has an edge. Every other candidate returns $0.79-0.94 per $1 of premium, so those trades are direction calls.

## 1. Re-check
Quotes are Friday's close (Cboe delayed, fetched 10/18 18:25 ET). Every entry date clears the 3-day rule.

| Contract | Entry → exit | Bid/ask · OI · spread | Δ | IV vs realized | θ/wk | Ask at entry if unch. | 2x needs | EV/$ (range) | P(2x) |
|---|---|---|---|---|---|---|---|---|---|
| MSFT 11/20 580C | 10/28 → 10/29 | 4.35/4.55 · 14,465 · 4.5% ✓ | 0.18 | event 5.8% vs 8.2% history | −$80 (−$267 at entry) | 3.25 | +6.1% overnight | **1.32** (1.01-1.67) | 15% |
| SPY 11/13 785C | trigger → 11/12 | 3.09/3.15 · 1,483 · 1.9% ✓ | 0.22 | 11.7% vs 10.2% | −$102 | 2.95 | +1.9% | 0.94 (0.78-1.07) | 25% |
| SPY 11/20 785C | trigger → 11/17 | 4.35/4.40 · 12,330 · 1.1% ✓ | 0.26 | 12.0% vs 10.2% | −$105 | 4.19 | +2.1% | 0.92 (0.79-1.03) | 25% |
| NVDA 11/20 230C | 10/22 → 11/17 | 4.50/4.60 · 98,507 · 2.2% ✓ | 0.30 | 32.5% + 5.7% print vs 24/37% | −$73 | 4.01 | +6.2% | 0.91 (0.81-1.00) | 24% |
| USO 11/20 145P | 11/2 → 11/17 | 2.62/2.80 · 1,442 · **6.6% ✗** | −0.20 | 45.7% vs 28/39% | −$63 | 1.35 | −7.2% | 0.79 (0.62-0.95) | 18% |
| IWM 11/20 280C | 10/29 → 11/17 | 2.70/2.75 · 13,294 · 1.8% ✓ | 0.29 | 17.8% vs 14.9% | −$58 | 1.68 | +2.8% | 0.79 (0.69-0.94) | 19% |

How to read it:
- **Realized vol** is the 20-day figure; where two are given, they are rv10/rv20 for USO and rv20/rv60 for NVDA.
- **EV** comes from Black-Scholes on trading-day time, calibrated to Friday's mids, plus a fat-tailed zero-drift Monte Carlo. It buys at the ask, sells at the bid and uses the default exits. The range runs from low to high realized vol; for MSFT it runs from the implied event size to the historical one.
- **"2x needs"** is the move needed one week after entry with IV unchanged. For MSFT it is the move on 10/29, with IV at 24% after the print.

Filter flags:
- **USO:** every 11/20 put strike from 125 to 150 has a spread of 5.6-21%. At the ~$1.35 re-strike it fails even the 10% limit, so USO needs a committee ruling or it is out.
- **MSFT:** a $0.20 spread on a $3.25 entry is 6.2%, so check the spread live.
- **SPY:** at SPY 773 the 785C is about $6.50, over the cap. Use the 795C instead (OI 10,292).

## 2. Weekend news
- **Prices (Yahoo, 18:16 ET):** ES +0.19%, NQ +0.42%, RTY +0.46%, WTI 98.26 (−0.8%), Brent 108.80 (−1.0%).
- **Headlines:** oil fell despite new IRGC mine reports (Times of Israel 17:00 ET, Middle East Eye 17:30 ET). Iran says its offer to reopen Hormuz stands (IBTimes 10:27 ET, unverified).
- **Equities:** the futures point to SPY near 765, VIX probably a little under 20 (my estimate). Neither flows trigger can fire Monday, because both need a qualifying close first.
- **Oil:** headline vol is fading (USO rv10 28% against IV 46%), so the puts are richer. An early deal would land before the 11/2 entry.
- **Order:** unchanged: NVDA (10/22, conditional), then MSFT, IWM, and USO last; SPY on its trigger. If NVDA fires, buy 1 contract and keep $360 for MSFT ($820 of the $1,000).

## 3. Shot-1 ranking (EV per $1)
1. MSFT 1.32
2. SPY 11/13 0.94 and SPY 11/20 0.92 (prefer 11/20 for its open interest)
3. NVDA 0.91
4. USO 0.79
5. IWM 0.79

USO reaches 1.07-1.29 only if energy's 10-17% odds of a deal gap come on top of what the 46% IV already prices. Below 1.0, extra contracts only add expected loss, so buy one each.

**Monday 14:43: WAIT, no order.** Record SPY, VIX and VIX9D/VIX3M for the flows triggers.

## 4. Proposals
1. `MSFT261120C00580000 | 2026-11-20 | 580 | C | 0.18 | 4.35/4.55 (Cboe, 10/16 15:59 ET) | 14,465 | Wed 10/28 14:43 after FOMC, 1 contract, live ask with a $3.60 ceiling (implied event ≤6.2%) and spread ≤5%; if MSFT has moved, use the 11/20 call ~9-10% OTM under the same tests, else skip | sell all 10/29 14:43 | 4`
2. `SPY261120C00785000 | 2026-11-20 | 785 | C | 0.26 | 4.35/4.40 (Cboe, 10/16 16:14 ET) | 12,330 | flows trigger A, B or C, 1 contract, ≤$5.00; at SPY ≥773 use SPY261120C00795000 | half at 2x, rest at 3x, −50% stop, out by 11/17 | 3`

## 5. What the committee is most likely getting wrong
**NVDA's IV ramp is not a tailwind.** The print's variance is already in the price. If NVDA holds at $214, IV climbs from 38% to 61% while the 230C falls from $3.97 (10/22) to $2.26 (11/6), which trips the −50% stop on decay alone, and to $1.11 by 11/17. The $9.20 target needs NVDA at about $235 on 11/17.

## Sources
- Cboe chains via `quotes.py`; closes from Yahoo and Cboe.
- Robinhood daily bars (7/1-10/16, for realized vol) and `get_earnings_calendar` (MSFT 10/28 after the close, verified).
- Yahoo futures, 18:16 ET; headlines via `research.py news`.
