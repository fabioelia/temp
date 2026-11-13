# A1: Anthropic-linked trade (run 2026-11-07)

**Conflict of interest.** Claude, built by Anthropic, wrote this. Only public filings, data and news are used. I have no non-public information about Anthropic, and I treat optimism about Anthropic as the bias to test against.

**Verdict: REJECTED.** There is no tested halo on strategic holders, and ANT itself has no entry rule. The spec is fixed in the docstring of `scripts/anthropic_a1.py`. Run it from /home/user/temp with `python3 -I trading-experiment/research/strategy-v2/scripts/anthropic_a1.py`, adding `[--ipo-base]` for the base-rate check.

**1. Timeline (EDGAR, CIK 2130357).**
* Filings: confidential DRS on 6/01, five DRS/A (7/13-10/09), the S-1 on 10/26, and S-1/A No. 1 on 11/02, which adds financials through 9/30.
* **No price range yet** ("between $ and $"). There is no 424B prospectus.
* Press reports, not verified: the roadshow starts the week of 11/9 and listing comes before Thanksgiving, after our 11/18 window.
* `research.py sec filings` leaves out S-1/A by default. Watch with `--forms S-1,S-1/A,424B4`.

**2. When options can list.** Cboe Rule 4.3, Interpretation .01(b)(2)(A)(ii) (Release 34-98277, 2023) mirrors NYSE American Rule 915 (34-98013). If an IPO is worth at least $3B at the offer price, its options may list **on or after the 2nd business day after the IPO day**.

**3. Base rates.**
* Ritter, via secondary summaries (ufl.edu is blocked here):
  - The average first-day return was 18.8% (1980-2025).
  - Large IPOs averaged about +10% on day one, then trailed the market by about 4 points over 3 years.
* Our check covers 16 US IPOs that raised at least $3B (2008-2025). It buys at the first-day close and measures returns against SPY:
  - +20 days: -4.9% (median -0.9%, t -1.5).
  - +250 days: -23.2% (median -30.8%, positive in 20% of cases, t -2.0).

**4. Halo event study.**
* **Sample.** 17 IPOs worth at least $5B with a listed 5-50% holder, giving 23 holder pairs. Returns are clustered by IPO, measured against a local index, net of 10 bps.

| Window | Mean | t | Note |
|---|---|---|---|
| Days -20 to -1 | +2.4% | 1.70 | Median -0.45%; against the holder's own baseline +0.9% (t 0.57); GOOGL/AMZN/NVDA cases -0.6% |
| Days -10 to -1 | +0.4% | 0.20 | |
| **IPO day to day +1** | **-1.8%** | **-2.74** | Positive in 24% of cases; 2014-19 -1.9%, 2020-25 -1.7% |
| Days +2 to +20 | +1.4% | 0.80 | |

* **Limits.**
  - No case falls before 2010.
  - The sample is mostly Tencent and SoftBank.
  - No analog has a stake as large, relative to the holder, as Google's or Amazon's.
  - The NIO and BEKE stakes were not re-verified.
* **Deviation.** The first run wrongly dropped two holders that had short histories. After the fix the results are similar (the first run gave t 1.79 and -2.51).

**Tradable rule.** There is none for buying. The only effect with weight runs opposite to the halo: holders lag by about 1.8% over the IPO day and the day after. That is suggestive (|t| below 3) and too small to pay for put spreads. Use it as a guard only:
* Do not add AMZN or GOOGL into the ANT pricing.
* Do not chase ANT at the first-day close.
* Re-test "sell the news" only as a new pre-registered claim.
