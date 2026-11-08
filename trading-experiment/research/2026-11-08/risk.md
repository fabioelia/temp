# Risk, Sun 2026-11-08: Monday's index-core execution

**Verdict: buy Monday. I found nothing that stops it.** Weekend quotes are stale (VOO 676.10, SGOV 100.4845, Fri 15:59:59 ET).

* **Orders:** VOO **$1,100.00** (79.4%), then SGOV **$265.00** (19.1%) once VOO shows filled. Both are dollar-amount market orders. $19.82 stays in cash. The total also fits the paper ledger's $1,368.84.
* **No borrowing:** Robinhood shows cash, buying power and unleveraged buying power all at $1,384.82 (get_portfolio, ••5318, limited_margin). The gate now sizes from realized cash (live.py 219-224). The cash test passes, and the live suite passes 27/27. In a dry run on a scratch copy the gate allowed up to $1,384.84, **$0.02 above the broker's cash**. That is probably sell fees the ledger never recorded, so the buffer stays.
* **Fractional:** VOO and SGOV are both tradable (get_equity_tradability). Dollar orders run in regular hours only, are Not Held, and get their share count from the last trade. The 5% buying-power reserve applies only to orders queued outside market hours [1][2].
* **Wash sale:** §1091 covers option losses [3]. VOO is unlikely to count as identical to SPY calls, and the worst case only defers $533. Make no SPY buys before 12/06.
* **Paperwork:** RULES.md (stock buys off, the 30% single-name line) and data/live_tools.md need a journal note.

[1] robinhood.com/us/en/support/articles/fractional-shares/ [2] …/market-order-update/ [3] law.cornell.edu/uscode/text/26/1091
