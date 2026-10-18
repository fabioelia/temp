# Paper-trading scoreboard (as of 2026-10-19)

> SIMULATION. No real money. Prices come from public web sources; fills are modeled at the close with slippage and fees (see RULES.md).

**Equity $2,000.00** | P/L $0.00 (+0.00%) | goal $4,000.00 by 2026-11-18 | 0.0% of the way
- Cash $2,000.00 | realized $0.00 | fees paid $0.00 | slippage cost $0.00
- SPY buy-and-hold with same $: n/a
- Trading days left: 22 | needed per day to hit goal: +3.20%
- Est. after-tax equity if liquidated (memo, 24% on gains): $2,000.00

## Positions

_All cash._

## Pending orders (fill at next close)

- O003 buy SPY261120C00785000 usd=520.0 stop=50.0% target=100.0% :: Shot 1 (historian conf 5, flows contract, risk APPROVE modified). Base rate verified 1990-2026: S&P 1-3.5% below a record with VIX 17-24 -> new closing high within 22 sessions 60% (102 episodes), further -8% only 7%; but the call itself doubles only ~35% (risk replay). SPY call wing is the cheapest vol on the surface (IV ~11.7%). CONFIRM ONLY IF at 14:43: SPY 752-772, VIX 17-24, VIX9D <= VIX3M, Brent < 112, spread <= 5%, ask <= 5.00 (1 contract). SPY < 752: use flows' flush trigger instead (SPY <= 748, VIX >= 24, buy after VIX falls 10% off its peak); SPY > 772: skip. Exits: sell the whole contract at bid >= 2x fill; -50% stop on live quotes pre-close; sell all if no S&P record close by 11/4; out by the 11/18 pre-close. If it fills, no other new buy before 10/28 (protect the MSFT reserve).
- O004 buy TLT261120C00082000 usd=505.0 stop=50.0% target=100.0% :: Alternative to P1 only if P1 is not confirmed today (one new shot a day). Macro conf 5, risk MODIFY: the one idea that also pays if AI credit cracks (and in a Hormuz de-escalation). CONFIRM ONLY IF at 14:43: 10y <= 5.05%, Brent < 110, SPY >= 752 (keep the flush budget for SPY), spread <= 5%. Re-strike to the 11/20 call nearest 0.30 delta (cancel and add) if 82 has moved away; ask <= 0.90. Exits: -50% stop on live quotes, sell half at +100%, rest at +200%, out by the 11/12 pre-close.

## Stats

- Fills: 0 | closed round trips: 0 (W 0 / L 0)
- Fills priced by the cross-checked quote feed: 0 of 0
- Win rate: n/a
- Payoff: n/a
- Max drawdown: +0.00%

## Last 10 fills

| Date | Side | Ticker | Qty | Fill | Fees | Thesis |
|---|---|---|---|---|---|---|
