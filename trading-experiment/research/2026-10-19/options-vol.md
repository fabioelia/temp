# Options & vol, Mon 2026-10-19 post-close

**Verdict: hold shot 1 with its exits unchanged. Keep the MSFT plan and add a fallback strike. Nothing justifies breaking the no-new-buy rule.**

## 1. Shot 1: SPY 11/20 790C
- **Quote:** 3.56/3.60, IV 11.8% (Robinhood 16:14 ET; Cboe agrees).
- **Theta:** about **−$90 to −$104 a week** (~27% of the premium), and rising. With SPY flat, the call is worth ~2.9 on 10/23 and ~1.9 on 10/30.

| SPY needed by | 10/23 | 10/28 | 11/4 | 11/13 |
|---|---|---|---|---|
| 2x (bid ≥ 7.50) | 782-785 | 784-787 | 788-791 | 794-795 |
| −50% stop (bid ≤ 1.87) | 759-761 | 764-765 | 771-772 | 781-783 |

- **Record close:** 779.09 on 10/6. A record alone is worth only ~3.4-4.0 on 11/4.
- **Flat SPY:** decay alone trips the stop by 10/30-11/2, so the 11/4 rule rarely binds.
- **Monte Carlo:** P(2x) is 17-34%, P(stop) 65-81%, and EV per $1 is 0.77-1.10.
- **Alternatives:** dropping the stop or using a 1.5x target changes EV by at most ±0.11. **Keep the exits.**

## 2. MSFT 11/20 580C
- **Quote:** 4.50/4.70, spread 4.3%, OI 14,418 (Robinhood 15:59 ET; Cboe agrees).
- **Event vol:** the implied event move is 5.6%, against 8.2% historical, so **0.68x** (Sunday: 0.70x). Without July's +15.5% reaction, history is 6.3% (0.89x).
- **Ceiling binds:** MSFT is up 0.85%, so the projected 10/28 ask is ~3.59, at the $3.60 ceiling.
- **Payoff:** a flat print loses ~78%; 2x needs +5.6% to +6.7%. EV per $1 is 0.98 at the implied move and ~1.9 at the historical move.
- **Fallback:** the 590C (3.05/3.20, OI 7,045), not the 585C (OI 2,270, 5.3% spread).

## 3. Earnings week: implied event move / history
- NFLX: ~12% / 7.3%, 1.6x (Sunday: 1.52x).
- META: ~7.2% / 8.6%, 0.84x (Sunday: 0.91x).
- TSLA: 6.4-7.0% / 7.0%, ~0.95x (Sunday: 1.09x).
- **SPY:** prices 0.76% a day for 10/21-10/22, against 0.70% on a normal day and 1.05% on FOMC day.
- **VIX curve:** VIX9D 17.93 < VIX 18.44 < VIX3M 19.60.
- **Read:** the market is priced for a calm week, so shot 1 needs a real rally.

## 4. Break the rule?
**No.** The META 10/30 800C would cost ~3.16, more than the $265 above the MSFT reserve.

## 5. Trigger to watch
MSFT's event vol on 10/22, after META's capex news. If it is above 6.2%, skip shot 2.

`MSFT261120C00580000 | 2026-11-20 | 580 | C | 0.19 | 4.50/4.70 (Robinhood 15:59 ET) | 14,418 | 10/28 ~15:30 ET if ask ≤3.60, spread ≤5%, event σ ≤6.2%; else the 590C; else skip | sell 10/29 14:43 | 4`

Sources: Cboe chains and VIX (17:16 ET); Robinhood quotes, daily bars and earnings; Yahoo/Cboe closes.
