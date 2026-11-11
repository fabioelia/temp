# Probe program (strategy v4 draft, 2026-11-11)

Owner, 11/11: "try to have a handful to be probing and testing with." A **proposal** for the 11/15 rule-evolution vote (red-team first; nothing trades before adoption). Idea path: registered claim → committed backtest → verdict → probe (live $50 or paper) → checkpoints → graduate or retire.

## What the research says
* **Incubate small, scale later.** Davey runs systems 6-12 months without money first. Evans: incubated funds beat by 3.5% only until launch; picking winners from a batch inflates their record.
* **Backtest Sharpe barely predicts live results** (888 Quantopian algorithms, R² < 0.025); volatility (0.67) and drawdown (0.34) carry over.
* **Multiple testing.** Harvey-Liu-Zhu want t > 3. The deflated Sharpe (DSR) counts every trial: with about 32 registered claims the best null is expected near t 2.1, and DSR-95 needs about t 3.7. Published edges shrink 26-58% (McLean-Pontiff).
* **Power.** t ≈ Sharpe × √years, so a Sharpe of 0.5 needs 16 years to reach t 2. Carver: separating two rules takes decades.
* **Allocation.** 1/N beats optimizers under estimation error (DeMiguel et al.); full Kelly on an estimated edge overbets (MacLean-Thorp-Ziemba). Bandits need many fast pulls, so Thompson sampling only picks who fills a free slot.
* **Kill criteria:** a state plus a date, set in advance (Duke). Recovery takes about 3x the fall (triple penance) and repeated looks inflate false kills, so check only at fixed checkpoints.
* **Size.** Bogle's "funny money": at most 5%; core-satellite writers use 5-20%.

## Design
**Budget: $200 (about 14.5% of equity), carved from VOO.** Equity exposure stays near 80% and the SGOV reserve stays whole for C1. Trim VOO only at a close at or above its $692.87 cost (no realized loss, no wash sale); until then probes 1-2 borrow from SGOV. No top-ups between quarterly reviews: the most it can lose is $200, about $100 with stops.

**Slots: 4 live at $50 each, up to 4 paper.** Rule change: the 4-position limit becomes core 2 + probes 4 + options 2.

**Live admission:**
* A claim in `claims.md` with a committed script and a verdict of WEAK or better (the right sign in both halves).
* A line on who is on the other side.
* Stock or ETF only, fractional shares, held at least one session (PDT).
* No S&P 500 fund, and no SPY before 12/06.
* Pre-computed: expected signals a month, volatility, and 2nd-percentile P/L bands at weeks 4, 8 and 12 (block bootstrap of the backtest).

The $200 cap bounds this exception to "only CONFIRMED trades."

**Entry and exit:** as registered, through `live.py gate` at 14:43, judged on closes. Single stocks: hard stop at -$25.

**Kill** (any one, checked only at weeks 4, 8 and 12; the hard stop applies any day):
1. P/L below its band (about a 6% false-kill rate over three looks).
2. Fills cost more than 2x the model over at least 5 fills.
3. Signals fire under 1/3 or over 3x the expected rate.
4. An unregistered action: the probe is closed and re-registered.
5. Week 12 arrives without a CONFIRMED backtest.

**Graduate** (all four):
1. CONFIRMED under PROTOCOL.
2. DSR ≥ 0.95 over the whole register.
3. At least 12 weeks and 10 live signals inside the bands.
4. A red-team review and a Sunday vote.

Then size doubles, then rises to at most half-Kelly on the halved backtest mean.

**Refill:** at most one new live probe a week, ranked by a Thompson draw on each candidate's backtest mean and standard error.

**Paper probes** hold options ideas (a contract is $150-700) and covered calls (100 shares) in the `review.py` shadow book at stamped asks and bids, with the same checkpoints and kills; they count toward the DSR. One goes live only when CONFIRMED and min(Kelly, SGOV reserve) covers a contract.

**Weekly review (one row per probe):** signals vs expected; fills vs model; P/L vs the same dollars in VOO; distance to band; breaches; checkpoints due; the sleeve total and today's DSR hurdle. Nothing is reallocated on P/L between checkpoints.

**First candidates:** live, V3 (a volatility-managed $50 sleeve, VOO or SGOV monthly by Moreira-Muir; WEAK, better in both halves); paper, V1 wide C1 puts and the SPY 720P and 750C shadows. Slots 2-4 are open.

## What $50 probes can and cannot teach
**Cannot: show whether an edge exists.** At 25% volatility a $50 probe's 12-week P/L has a standard deviation of about $6, against $0.58 from a 5%-a-year edge. C1-like trades need about 270 for t 2. With 4 zero-edge probes, 9% odds one looks significant by luck (17% with 8).

**Can:** real fills and costs; whether signals fire as often as the backtest says; operational faults (gate, schedules, fractional fills); rule-following with real money; volatility and drawdown; gross failures. Edge evidence stays with the backtest; probes test the bridge from backtest to account.

Sources: [Davey](https://algoadvantage.substack.com/p/036-kevin-davey-part-i-its-all-about) · [Evans 2010](https://ideas.repec.org/a/bla/jfinan/v65y2010i4p1581-1611.html) · [Wiecki et al. 2016](https://quantpedia.com/quantopians-academic-paper-about-in-vs-out-of-sample-performance-of-trading-alg/) · [Harvey-Liu-Zhu](https://nber.org/papers/w20592) · [Harvey-Liu, Backtesting](https://people.duke.edu/~charvey/Research/Published_Papers/P120_Backtesting.PDF) · [DSR](https://papers.ssrn.com/abstract=2460551) · [PBO](https://papers.ssrn.com/abstract=2326253) · [MinTRL](https://www.risk.net/journal-risk/2223785/sharpe-ratio-efficient-frontier) · [Triple penance](https://www.risk.net/journal-of-risk/2435335/stop-outs-under-serial-correlation-and-the-triple-penance-rule) · [Lo 2002](https://econpapers.repec.org/RePEc:taf:ufajxx:v:58:y:2002:i:4:p:36-52) · [McLean-Pontiff](https://counterpointfunds.com/wp-content/uploads/2017/07/PredictabilityMcleanPontiff.pdf) · [DeMiguel et al.](https://ideas.repec.org/a/oup/rfinst/v22y2009i5p1915-1953.html) · [MacLean-Thorp-Ziemba](https://www.stat.berkeley.edu/~aldous/157/Papers/Good_Bad_Kelly.pdf) · [Thompson tutorial](https://arxiv.org/abs/1707.02038) · [Carver](https://www.cxoadvisory.com/big-ideas/a-few-notes-on-systematic-trading) · [Duke](https://davidepstein.substack.com/p/annie-duke-quit) · [CUSUM](https://researcher.ibm.com/publications/using-statistical-process-control-to-monitor-active-managers) · [Bogle](https://www.gurufocus.com/news/949291/jack-bogle-keep-your-serious-indexed-money-separate-from-your-fun-money-) · [Paper vs live](https://alpaca.markets/learn/paper-trading-vs-live-trading-a-data-backed-guide-on-when-to-start-trading-real-money).
