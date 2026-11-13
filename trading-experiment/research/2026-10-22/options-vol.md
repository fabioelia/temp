# Options & vol, Thu 2026-10-22 post-close (Run B)

**Verdict: wait for MSFT 10/28. The one earlier shot worth a conditional is TLT, the only surface where implied is not above realized. MSFT plan unchanged, confidence 3.**

## 1. Ranking by EV per dollar
EV/$ assumes zero drift, a 2x target, a −50% stop and an 11/13 time stop. It is shown as a range over 20-day to 5-day realized vol.

| 11/20 shot | Cost | Δ | IV / RV | θ/wk | 2x needs by 10/29; 11/5 | EV/$ |
|---|---|---|---|---|---|---|
| **TLT 83C ×6** | $456 | .37 | 14.1 / 11-15 | −$91 | +2.3% (83.63); +2.7% | **−0.12 to +0.04** |
| QQQ 745C (now) | $496 | .21 | 22.0 / 19-30 | −$160 | +4.3% (735); +5.3% | −0.22 to +0.08 |
| MSFT 575C, 10/28 | ~$290 | .15 | event σ 5.5-6.0% / 8.2% hist. | −$59 to 10/28 | +6.6% on 10/29 (flat print −78%) | −0.45 / −0.08 / +0.68 ¹ |
| SPY 765C at flush ² | ~$490 | .29 | ~15 / 13-18 | −$175 | +2.7% by 11/6 | −0.20 to +0.02 |
| QQQ 645P | $536 | −.15 | 32.7 / 19-30 | −$177 | −4.3% (674.5); −5.7% | −0.33 to −0.01 |
| SPY 735P ³ | $506 | −.21 | 18.9 / 10-13 | −$137 | −2.5% (744.9); −3.2% | −0.35 to −0.18 |
| USO 175C | $515 | .34 | 52.2 / 24-41 | −$115 | +8.5% (176.3); +10.2% | −0.41 to −0.15 ⁴ |

¹ Event σ of 4.0% (this season's pattern), 5.8% (implied) or 8.2% (MSFT history).
² SPY 748 and ATM IV ~17% are assumed. It needs about a +1% two-week bounce to break even.
³ A new SPY option is a wash sale; SPY calls now fare worse, at −0.28 to −0.11.
⁴ It needs P(USO +20% within two weeks) ≥8-11%. The model is lognormal, so jumps get no credit.

**TLT:** fair vol, and six contracts allow a partial exit. But the 83C went from 0.33 to 0.755 today, so it is a conditional, not a chase.

## 2. MSFT
- **Strike walk:** 8% OTM is now 562.8, so the walk starts at 565.
- **Today's chain:** the ceiling buys the 575C on price (3.25/3.55), but every strike from 565 to 590 is 7-12% wide.
- **10/28 projection (MSFT flat):** the 575C marks about 2.8 and the 570C about 3.5.
- **Event σ:** 5.5-6.0%, from the 10/30, 11/06 and 11/20 straddles. That is only 0.2-0.7 under the 6.2% veto.
- **50-day:** MSFT is 13 above it (507.9).

## 3. Trigger tomorrow
The 10y at 14:43: ≤5.00% keeps TLT live; >5.05% drops it.

## Shot 1 post-mortem
The exit design cost $257: the 10/21 14:44 decision saw a 5.50 bid (+47%), we held for 7.50, and we sold 2.93 a session later. A cost stop would not have helped, because the next check came after a one-session gap to 2.91. Ex ante, the entry mattered more: paying 12.4% IV for 9.6% realized cost −0.07 to −0.25 per dollar under every rule I simulated. A 1.4x take-profit adds ≤0.05/$ and lifts P(profit) from 17% to 32%, but cuts P(2x) from 17% to 2%. My 10/20 call (no target below 7.50) paid for P(2x) with a likely give-back. **Rule from now on:** with two or more contracts, sell half at the first bid ≥1.4x cost, lift the rest's stop to cost and keep 2x. With one contract, take 1.4x when entry IV is above 20-day realized; otherwise keep 2x and lift the stop to 1.2x once 1.4x prints. That rule would have banked +$175.

## Proposals
`TLT261120C00083000 | 2026-11-20 | 83 | C | 0.37 | 0.75/0.76 (Robinhood = Cboe, 16:14:59 ET) | 81,925 (spread 1%) | Fri 10/23 14:43: 6 contracts, ceiling 0.80, only if the 10y ≤5.00%, TLT ≥81.00 and macro waives Brent <$110 | sell 3 at bid ≥1.06, the rest at ≥1.52 with the stop at cost; all at ≤0.38; time stop 11/13 | 4`

`MSFT261120C00575000 | 2026-11-20 | 575 | C | 0.15 | 3.25/3.55 (Robinhood = Cboe, 15:59:59 ET) | 5,639 | 10/28 ~15:30: lowest strike ≥8% OTM from 565, ask ≤3.60, spread ≤5%, event σ ≤6.2%; else skip | sell 10/29 14:43 | 3`

**Sources:**
- Cboe chains (quotes.py), 17:15 ET.
- Robinhood option quotes and daily bars; last trades at 16:00 ET.
- Own Black-Scholes and Monte Carlo models (20,000 paths).
