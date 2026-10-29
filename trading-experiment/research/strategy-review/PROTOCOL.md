# Strategy review: protocol (pre-registered 2026-10-29, before any test was run)

The owner asked (2026-10-29): "Do some research search online blogs and articles to see other investment strategies and then confirm if they work before
taking any learnings from them." This folder does that. The claims, the exact test for each, and the verdict rules below are committed to git **before**
any result is computed, so no rule can be tuned to fit the answer.

## Rules for every test
1. **Test the claim as its source states it.** Parameters come from the source, not from us. A variant is allowed only if it is listed in `claims.md`
   before testing, and every variant tried is reported, including the ones that fail.
2. **Data.**
   - Yahoo daily bars: `^GSPC` from 1950, `SPY` from 1993, `IWM` from 2000, `QQQ` from 1999, `^VIX` from 1990, `^RVX` from 2004. Use split- and
     dividend-adjusted closes where available. Fetch with the repo's `quotes.get_json`.
   - Earnings dates come from SEC 8-K item 2.02 filing dates (`research.py`, `submissions`).
   - Cache raw downloads in the scratchpad, never in the repo. Put scripts in `research/strategy-review/scripts/`.
3. **Baseline.** Compare against unconditional returns over the same holding period, the "random entry" baseline, not against zero.
4. **Statistics.** Report n, mean, median, hit rate, a t-stat or bootstrap 95% CI against the baseline, and the worst outcome. Overlapping windows need
   a correction: block bootstrap or Newey-West.
5. **Out of sample.** Report three periods for every claim: the full sample, an early half or pre-2010, and 2010-2026. Report the last 10 years when n
   allows. An effect that lives only in the early data is "decayed", not "confirmed".
6. **Costs.**
   - ETF and stock round trips: 5 bps for SPY/QQQ, 10 bps for IWM, 10 bps for large caps.
   - Options translation (where the claim is relevant to us): Black-Scholes with IV = VIX for SPX/SPY, RVX for IWM (VIX x 1.25 before 2004), or the
     stock's 20-day realized vol x 1.1 where no index exists.
   - Pay half of a 3% spread each way. Use 21-35 days to expiry and delta 0.30-0.45, which is our own contract rule.
   - The model ignores skew and the IV change after events, so options results are approximate and must say so.
7. **Multiple testing.** About 30 tests run in this review. A result counts as strong evidence only at |t| >= 3, roughly a Bonferroni 5% level. At
   2 <= |t| < 3 it is suggestive.

## Verdicts
* **CONFIRMED:** all of the following hold.
  - The claimed sign holds, with |t| >= 2 against the baseline in the full sample.
  - The same sign and at least half the full-sample magnitude hold in 2010-2026.
  - The effect survives costs.
  - Where the claim is used through options, model EV per $ is above 1.0 after spreads.
* **WEAK:** the right sign, but it fails significance, decayed after 2010, or fails the options translation.
* **REJECTED:** no effect, the opposite sign, or it exists only in early data.
* **UNTESTABLE HERE:** the data needed (historical option prices, intraday data) is not available. Literature only.

## What we do with the verdicts
* Only a CONFIRMED result may change `playbook.md`, and then with a changelog line citing this folder.
* A WEAK result may only break a tie between two otherwise-equal ideas.
* A REJECTED result removes that argument from our briefs: no persona may cite it as support.
* Claims our own personas already rely on are tested the same way: the follow-through day, the mega-cap continuation n 93, and the +50% exit.
