# A1: Anthropic-linked trade (run 2026-11-07)

**Conflict of interest.** Claude, built by Anthropic, wrote this. Only public filings, public data and public news are used. I have no non-public information about Anthropic. Any optimism about Anthropic is treated as the bias to test against.

**Verdict: REJECTED.** There is no tested "IPO halo" on strategic holders, and ANT itself has no entry rule. Script: `scripts/anthropic_a1.py` (the spec is in its docstring, fixed before any return was seen). Run it from /home/user/temp with `python3 -I trading-experiment/research/strategy-v2/scripts/anthropic_a1.py`; add `--ipo-base` for the base-rate check.

## 1. Timeline (EDGAR, CIK 2130357)
* Confidential filings: DRS on 6/01, then DRS/A on 7/13, 8/10, 9/04, 10/01 and 10/09.
* Public filings: S-1 on 10/26 and **S-1/A No. 1 on 11/02**, which adds financials through September 30.
* **No price range yet.** The cover still reads "between $ and $". There is no 424B prospectus.
* Press reports, not verified: the roadshow starts the week of 11/9, with talk of a $1.5-1.6T valuation and a listing before Thanksgiving. That would fall after our 11/18 window.
* Tooling gap: `research.py sec filings` filters by form by default and leaves out S-1/A and DRS/A. Watch with `--forms S-1,S-1/A,424B1,424B4`.

## 2. When options can list
Cboe Rule 4.3, Interpretation .01(b)(2)(A)(ii) (SR-CBOE-2023-043, Release 34-98277, effective on filing in September 2023) copies NYSE American Rule 915, which the SEC approved in Release 34-98013. If an IPO is worth at least $3B at the offer price, its options may list **on or after the 2nd business day after the IPO day**. Smaller IPOs must first show 3 days of closes at or above $3.

## 3. Base rates
* Ritter's own site (ufl.edu) is blocked in this session, so these come from secondary summaries:
  - The average first-day return was 18.8% (1980-2025).
  - Large IPOs (sales at or above $500M) averaged about +10% on day one, then trailed the market by about 4 points over 3 years.
  - Over 3 years, buyers at the first-day close trailed the market by about 21 points for all IPOs.
* Our own check covers 16 US IPOs that raised at least $3B (2008-2025). It buys at the first-day close and measures returns against SPY, net of costs:
  - +20 days: -4.9% (median -0.9%, t -1.5).
  - +60 days: -6.2%.
  - +250 days: -23.2% (median -30.8%, positive 20% of the time, t -2.0, n=15).

## 4. Halo event study
* **Sample.** 17 IPOs worth at least $5B with a listed minority holder (5-50% stake), giving 23 holder pairs. Yahoo was dropped for lack of data. Returns are clustered by IPO and measured against a local index, net of 10 bps.
* **Run-up (days -20 to -1): +2.4%** (t 1.70, median -0.45%, positive in 47% of cases).
  - Against the holder's own baseline: +0.9% (t 0.57).
  - GOOGL, AMZN and NVDA cases only (n=4): -0.6%.
  - Days -10 to -1: +0.4% (t 0.2).
* **IPO day to day +1: -1.8%** (t -2.74, positive in 24% of cases). It is negative in both halves: -1.9% in 2014-19 and -1.7% in 2020-25.
* **After the IPO (days +2 to +20): +1.4%** (t 0.8).
* **Limits.**
  - No case falls before 2010, so the protocol's pre/post-2010 split cannot be done.
  - The sample is mostly Tencent and SoftBank.
  - No analog has a stake as large, relative to the holder, as Google's or Amazon's in Anthropic.
  - The NIO and BEKE stakes were not re-verified.
* **Deviation.** The first run dropped holders with less than 800 days of history (SPOT, and UBER as a DIDI holder), which the spec does not allow. I fixed it and ran it again. The first run gave a run-up of +2.65% (t 1.79) and day 0-1 of -1.74% (t -2.51).

## Tradable rule
There is none for buying. The only effect with any weight has the sign opposite to the halo: holders lag by about 1.8% over the IPO day and the day after. That is suggestive (|t| below 3), and a 2-day move this small does not pay for put spreads. Use it only as a guard: **do not add AMZN or GOOGL into the ANT pricing for Anthropic reasons.** Do not chase ANT at the first-day close. Any test of an IPO-day "sell the news" effect must be pre-registered as a new claim.
