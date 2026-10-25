# Options & vol, Sun 2026-10-25 (week 44 plan)

**Verdict: one shot, IWM 11/20 288C x2 on Monday. MSFT 10/28 becomes a tripwire only. GOOGL, AMZN, USO, XLE and TLT have no measured edge, and COP has no contract we can trade. Confidence 4.**

## 1. The week
- **Almost everything is priced above what it has delivered.**
  - Event σ: GOOGL 6.30% (1.14x its last 7 prints, RMS) and AMZN 8.83% (1.11x).
  - IV vs 20-day realized: USO 55% ATM and 63% at the 200C vs 32%; XLE 30 vs 20; TLT 13.5 vs 11; IWM 19 vs 14.
- **The only cheap vol is MSFT's event:** 5.48% = 0.87x its RMS without July. It is also the crowd's trade.
- **W43 lesson:** the winners were the trades the crowd wasn't paying for. Buy only where a measured number says so.

## 2. Ranked by EV per dollar
EV/$ is computed on Friday's chains with the new exits. It comes from my Monte Carlo plus a replay of historical paths through each option.

| # | Idea | EV/$ | Consensus? | Measured edge |
|---|---|---|---|---|
| 1 | IWM 288C x2 | 1.22 late-Oct replay; 1.00 all windows; 0.78 at 60-day realized | no | seasonal base rate |
| 2 | MSFT 575C x1, 10/28 | 0.93 at implied; 1.11 at ex-July σ; 0.59 replaying the 7 non-July prints | **yes** | variance yes, call no |
| 3 | TLT 82C x4 | 0.84-0.93 (needs +0.6% drift; the seasonal mean is +0.3%, t 0.5) | no | none |
| 4 | GOOGL 350C | 0.72-0.87 | yes | none (1.44x without its best print) |
| 5 | XLE 70C x2 | 0.77-0.88 | partly | none |
| 6 | AMZN 280C | 0.56-0.85 | yes | none (1.50x without its best print) |
| 7 | USO 200C | 0.63-0.85 (needs +7.9% drift) | yes | none |

COP: the 150C costs $660, over the cap, and the 155C/160C are 17-20% wide.

`IWM261120C00288000 | 2026-11-20 | 288 | C | 0.23 | 1.79/1.83 (Cboe, 10/23 15:59:59 ET) | 6,090 | Mon 10/26 14:43: IWM (quotes.py get) 273.50-279.50, ^TNX <= 5.05, ^VIX <= 22, ask <= 2.00, spread <= 5% (else the strike asking 1.60-2.00, delta >= 0.20); buy 2 | bank 1 at bid >= 1.5x fill (IWM ~280.2 by 10/28, ~282.8 by 11/4); past +40% the runner's stop goes to cost; the runner sells at 2x or at the 11/16 14:43; thesis stop IWM < 270.44 (20-day closing low) at 14:43; backstop bid <= 0.5x | no: a generic AI buys the MSFT/GOOGL/AMZN prints or oil | IWM rose from 10/26 to 11/18 in 20 of 26 years (mean +2.05%, t 2.5; 6 of 6 midterm years), above the +1.7% this call needs; late-Oct replay P(+50%) 46% vs 39% for all windows | 4`

The overlapping windows give only ~26 independent years, and the November effect is widely known. A hike (6.5%, per macro) breaks the trade. The alternative is the 285C x1 (delta 0.30, $265, 1.15 on the replay). Momentum's FTD trigger fits the same edge, but it pays more for it.

## 3. MSFT 10/28: no; a tripwire only
- **Consensus:** yes.
- **Edge:**
  - For variance, the edge is real: 0.87x.
  - The call alone does not clear 1.0 robustly. The 1.11 needs symmetric fat tails, and only 3 of the last 8 prints were up.
  - The catalyst's 480P is richer on skew: 0.81 at implied, 0.93 at ex-July σ.
- **Spreads:** every strike at least 8% out of the money was 9-15% wide at Friday's close. The 560C passes at 4.7%, but costs $655.
- **Tripwire, 10/28 ~15:30:** existing vetoes clear, event σ <= 5.0%, live spread <= 5% and ask <= 4.00.
  - Then buy 1 and sell it all at the 10/29 14:43.
  - EV/$ then is 1.12 at implied, 1.33 at ex-July σ and 0.71 on the replay. Confidence 2.

Sources:
- Cboe delayed chains: Friday's closing quotes, pulled 10/25 18:27-18:28 ET.
- Yahoo daily bars (pulled ~18:30 ET): realized vol, MSFT 50-day 508.43, eight prints per name, and IWM/TLT/XLE since 2000.
- My own MC and replay.
