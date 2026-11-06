# Reflection after the goal-call loss (owner's question, 11/05 evening: "Could we have avoided the loss?")

## What happened in the world
* **11/3:** Democrats won both chambers. On 11/4 the index rallied (SPY +1.7%), but the AI trade was already being sold: NVDA -3.2% on the day, and Reuters at
  07:45 ET ran "AI data center stocks dip, renewables surge after Democrat sweep".
* **11/5:** the "AI crackdown" fear became a rout. NPR reported "Fears of an AI crackdown after midterms spark $2 trillion rout in tech stocks"; SOX fell 12.25%
  and the Nasdaq 5.5% into a correction; SPY -4.4%; ^VIX 16.6 -> 28.2, with VIX9D above VIX3M. Hedge funds dumped AI debt (Bloomberg), though broad credit
  held (HYG -0.3%).
* **Next:** Friday's jobs report, with rate-hike risk on a strong print (Barron's).

## The loss, and what each choice cost
Total real P/L is -$615.16: Shot 1 -$82.08 and Shot 2 -$533.08.

| How Shot 2's stop could have been checked | Call price (Robinhood 30-min bars, trade prints) | Loss |
|---|---|---|
| Not entering | - | $0 |
| Stop checked about 10:00 ET 11/5 (the call was already at the 3.39 stop) | ~3.38 | ~-$341 |
| Stop checked about 10:30 ET | ~2.83 | ~-$396 |
| Stop checked about 11:30 ET | ~2.27 | ~-$452 |
| **The stop as designed (14:43 check only)** | **1.46 (filled)** | **-$533** |

## Avoidable or not
1. **The bet itself (not avoidable, given the decision to chase the goal).** No tested edge existed. Cash locked in losing the challenge, so the variance
   bet was taken at a modelled 45% chance of $2,200 and a 44% chance of a stop. Losing a disclosed coin flip is not by itself the error.
2. **The once-a-day stop (avoidable, about $190).** The playbook knew a 14:43-only check gaps (the 10/18 dry run realized -58% on a -50% stop). On a 4%
   down day it realized -79%. A mid-morning check or a resting stop-limit would have sold near 3.3-3.4.
3. **Misreading the driver again (avoidable as a warning, not as a forecast).** We named 11/4's driver as "the Democratic sweep: stocks and bonds up". We
   never asked who loses from it. The losers were AI and semis, the heaviest weights in SPY, and the divergence (NVDA -3.2% on a +1.7% SPY day) was visible
   at entry. This repeats the 10/26 lesson (calling the Anthropic-S-1 rally "broad risk-on"). It would not have made the crash predictable, since the market
   itself priced ^VIX at 16.6. But it was a reason to wait, or to size smaller.
4. **Model overconfidence.** goal_odds rescales calm history to the entry VIX. Right after a regime-changing event, that understates jump risk: it gave
   1.9% for a 75%+ loss, and that happened on day 1.
5. **Size.** 35% of equity in one OTM call. I resolved the 30% single-name ambiguity in the trade's favour after the fact. A 30% cap would have meant a
   cheaper strike and a similar percentage loss, so it would not have changed much, but the order of events was wrong.

## Changes proposed for the Sunday review (each tested or justified before adoption)
* An intraday stop check for any open option (about 10:00 and 12:00 ET as well as 14:43), or a resting stop-limit order with a floor. This trades gap
  protection against noise; the review weighs it.
* An entry checklist line: "Who loses from today's driver, and what is their weight in the underlying?" It is a judgment check, not an edge claim.
* Model tails after event days are treated as optimistic: size so that a 75%+ loss on day 1 is survivable for the goal.
