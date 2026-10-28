# Options & vol, Wed 2026-10-28 (Run B)

**Verdict: no shot Thursday; IWM goes to shadow.** Friday: an INTC put, 1 lot. GOOGL puts are shadow unless one passes every filter.

Sources: Cboe chain via quotes.py at 17:17 ET (16:15 quotes; parity gives IWM 281.53); Yahoo history; EDGAR 8-K 2.02 dates. Black-Scholes models are mine.

## 1. IWM at 285.51, Thu 14:43
| K | Tonight (Δ, OI) | IV held | IV -1 |
|---|---|---|---|
| 292 | 1.44/1.47 (0.22, 11,297) | 2.45 ✗ | 2.20, Δ0.31 |
| 293 | 1.23/1.26 (0.20, 7,573) | **2.13, Δ0.29** | 1.89, Δ0.28 |
| 294 | 1.04/1.08 (0.17, 9,848) | 1.86, Δ0.26 | 1.63 ✗ |

- **293C**, 2 lots ($426); the 294C if IV rides with moneyness. θ -0.73/wk (34%); IV 16.8% vs RV20 14.8%.
- **EV/$** (planned exits on +1.5% days, 2000-2026, n 202, SE 0.05): 0.92-1.05 by IV model. The any-day baseline is 0.86-0.93. **Not robustly above 1.0: shadow only.**

## 2. GOOGL put at ~291
- Implied move 6.2%; after hours -10.5%. Ex-event IV 29-31%; post-gap I estimate 33-36% (META's 11/20 is still 39.4% after its -7%).
- 280P: 4.46 mid at Δ0.29 (IV 33) to 5.20 at Δ0.30 (IV 36). The 285P costs 5.5-7.2. A strike fits only at IV ≤ 31% with GOOGL 288-290.
- **Liquidity:** OI passes (280P 10,886). Spread 12% pre-event; 2-4% expected after.
- **Base rate:** on 8%+ reactions, down-gaps continued 5 of 8 (mean -2.2%). 280P EV/$: 1.17-1.48 (n 8), 1.08-1.18 (n 42, 5%+, mirrored).
- Not consensus. The Anthropic link is not the thesis.

## 3. INTC (close 95.53 per Yahoo/Cboe; after hours 93.55)
- **Tonight:** 105C 3.25/3.45 (Δ0.33; the 6% spread fails); 85P 2.20/2.27 (Δ0.22).
- **Event ratio** 1.0-1.2x. Base IV 51-55%; RV20 52.4%.
- **+5%:** the 105C sits at Δ0.38-0.41 for 3.00-3.93, the only OI-qualified strike in band.
- **-5%:** the 85P drops to Δ0.27-0.29, so the band moves to the 87.5P (Δ0.36, 2.76-3.57) or the 90P (Δ0.44, 3.86-4.72).
- **Replay** (n 41): calls 0.68-0.97, puts 0.94-1.19. Last night's 1.13 does not hold.

## 4. Ranked
1. **Fri:** INTC put on -5%, 1 lot. Conf 2.
2. **Thu:** GOOGL 280P, only if it passes every filter. Conf 2.
3. **IWM 293C:** shadow. Conf 2 (consensus, no edge).
4. **INTC 105C:** shadow. Conf 1.
