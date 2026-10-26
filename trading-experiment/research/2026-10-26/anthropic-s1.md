# Anthropic, PBC S-1 (filed 2026-10-26): what it means for the challenge

Source: https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm (CIK 2130357; the owner flagged it 10/26).
Watch new filings with `python3 trading-experiment/research.py sec filings 2130357 --days 7` (numeric CIK, since there is no ticker yet).

**Conflict of interest, stated first.** Every persona here is Claude, which Anthropic builds. Our read of Anthropic's prospects is not neutral, and we hold
no non-public information about the offering; only the public filing and public news are used. Guardrail in `playbook.md` ("Anthropic IPO").

## Facts from the filing (initial S-1: price range, share counts, the commitments-table total and the 10/31 run-rate are still blank)
* **Correction (Run B, 10/26):** the per-counterparty minimum commitments are disclosed (MD&A, Liquidity, Contractual Obligations). Google: at least
  $114.5B (April 2026-July 2033), plus an estimated $125-150B of further TPU compute in 2028-31 outside the table. Amazon: at least $110.0B (May
  2026-April 2036). Microsoft: at least $44.9B (November 2026-May 2033). Broadcom: equipment-lease rent of about $161.2B, with up to $42.0B of notes
  to finance it. Plus NVIDIA-GPU compute through SpaceXAI and others. The catalyst agent found this; I had read the blank table total as no disclosure.
* Class A common stock, Nasdaq Global Select, proposed symbol **"ANT"**. Representatives Goldman Sachs and Morgan Stanley; 21 underwriters. A controlled company:
  a founder LLC holds 50.1% of the vote (Class F), and the Long-Term Benefit Trust elects a board majority (Class T).
* Revenue (Summary Consolidated Financial Data): 2023 $41M, 2024 $386M, 2025 $4,585M; **H1 2026 $16,286M vs $1,163M in H1 2025**. Compute and infrastructure
  expense was $8,945M in H1 2026, against $2,334M a year earlier. Operating loss narrowed to $693M (from $2,135M). The $80.7B H1 net loss is mostly a $72.4B non-cash
  fair-value charge on convertible notes and SAFEs, driven by the rise in valuation.
* Series H-1 (May-June 2026): $45.7B at $589.0095 a share; Google put in $10.0B and Amazon $5.0B. The cloud providers are Amazon, Google and Microsoft, with Broadcom as a
  supplier; all hold equity and are also customers. Amazon's notes convert only up to 12% of capitalization ($6.2B of rollover notes remain outstanding). Google has
  $20.0B of capacity left under its 2026 note agreement, and post-IPO draws can be taken in Class N stock at the 30-day VWAP.
* The staged lock-ups (180 and 365 days) release on earnings dates from the FY26 report onward, so none of them fall inside our window.

## What it means for us (window ends 11/18)
1. **ANT itself is out of reach.** There is no price range yet. My reading of standard practice, not of the filing: if Anthropic filed confidentially first, the
   roadshow can start 15 days after this public filing (about 11/10 at the earliest). The June 30 financials also go stale after 135 days (about 11/12), so an
   amendment with September numbers should come before pricing. Options on a new listing only start a few days after the IPO. Stock buys are off in any case.
2. **It is a sentiment catalyst for AI names now.** Reuters and Forbes (10/26) credit the filing with today's AI rally: NVDA +2.4%, AVGO +2.3%, MSFT +1.5%,
   QQQ +1.1%; GOOGL fell 1.1% (Yahoo closes, single source). The 14:43 run read the day as broad risk-on and missed the cause.
3. **Hard data for the AI-capex thesis.** Revenue is up 14x year on year and compute spend 3.8x. That is direct evidence the AI demand behind hyperscaler capex is real
   and growing, and it counts against the "AI-capex credit cracking" bear case in the regime switches. The per-counterparty minimums above are large, but the catalyst agent finds them mostly in
   the partners' disclosed backlog already (it cites a $50.5B mark-up in Amazon's Q2 10-Q; not re-checked here), so they do not change the setup into the prints.
4. **"Buy the cloud providers and suppliers into the Anthropic IPO" is the consensus AI trade.** Under the W43 consensus check it needs a measured edge
   (event vol at or below 0.9x history, or IV at or below realized). This week the AMZN, GOOGL and MSFT options also carry their earnings, which options-vol found
   priced rich (1.11-1.14x).
5. **Supply** (hypothesis, grade C): a very large IPO can pull money out of the AI megacaps as funds make room, and a cornerstone holder can fall after the IPO even
   when it rose into it. Both are anecdotes here, not base rates; neither is a trigger.
