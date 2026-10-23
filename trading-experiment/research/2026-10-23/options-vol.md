# Options & vol, Fri 2026-10-23 post-close (Run B)

**Verdict: no trade Monday. MSFT 10/28 is a conditional for 1 contract. Today no strike passes the 5% spread rule, and none has at any close since 10/20. Confidence 3.**

## 1. Scoring my week
- **Sunday: wait; SPY calls 0.92/$ (IV above realized).** Right. The 790C lost $82.
- **10/19-10/20: no take-profit below 7.50.** **Wrong, cost $257.** On 10/21 I wrote that holding gives up EV, then held for 2x anyway.
- **10/21: stop raised to bid ≤3.00.** Right. We sold at 2.93; the bid is now 2.17, so the old 1.87 stop would be $76 worse and still open.
- **10/21: no cost stop.** Neutral. With one check a day it would have filled at the same 2.93.
- **10/22: TLT EV −0.12 to +0.04.** The vol call was right (IV 13.6%). My trigger (TLT ≥81.00) was too loose, and the 83C fell from 0.755 to 0.54. Risk's tighter O007 kept us out.
- **MSFT 0.70x.** Overstated. July's +15.51% carries the 8.54% RMS; without it the ratio is 0.87x, and 0.94x on the median.

**Change:** lead with the estimate that survives dropping the best outlier, and set exits by my own EV sign.

## 2. Monday
No shot. At 14:43, log the live MSFT 570-580C spreads. SPY options are a wash sale until 11/21.

## 3. MSFT 10/28
- **Strike walk:** 8% OTM is 566.5, so the walk starts at 570 (the playbook says 575, the brief 580).
- **At the close, every strike fails the spread rule:**
  - 570C 4.20/4.65 (10%)
  - 575C 3.35/3.80 (13%)
  - 580C 2.79/3.25 (15%)
  - 590C 9% and 600C 7%
- **Event σ:** 5.47% against the 6.2% veto (pairs 5.14-5.55%).
- **10/28, MSFT flat:** the 570C asks ~3.90, over the ceiling, so the walk lands on the 575C at ~3.10.
- **Payoff:** a flat print loses 73%. EV/$ is 0.66 at the event size this season, 0.96 at implied, 1.18 at ex-July history and 1.88 at full history.
- **Size 1:**
  - Two contracts at 3.10 cost $620, over the $600 cap.
  - The +50% bank fires in only 3-4% of paths.
  - Buy 2 only if the ask is ≤3.00 and event σ ≤5.0%. Then sell one at 10/29 14:43, and keep the other only if its bid is ≥1.5x, with the stop at cost.

`MSFT261120C00575000 | 2026-11-20 | 575 | C | 0.16 | 3.35/3.80 (Robinhood = Cboe, 15:59:59 ET) | 5,711 | 10/28 ~15:30: lowest ≥8%-OTM strike, ask ≤3.60, spread ≤5%, event σ ≤6.2%; 1 contract | sell 10/29 14:43 | 3`

Sources: Robinhood quotes (15:59:59 ET), bars and earnings; Cboe chains (17:16 ET); my own Monte Carlo.
