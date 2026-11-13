# Macro memo, Fri 2026-11-06 (Run B, after the jobs beat)

**Verdict: no trade for Mon 11/9.** No setup with a measured edge applies.

## 1. Fed and CPI
- **Next FOMC is Dec 8-9** ([fedratecalc](https://fedratecalc.com/fomc-meeting-schedule/); federalreserve.gov unreachable here). Odds of a 25 bp hike:
  - Kalshi 77.5% (0.77/0.78) and Polymarket 76.5% (0.76/0.77) (`predmkt.py`, 22:17 UTC).
  - Fed funds futures (ZQZ26 95.985, Yahoo, single source) imply 77%, up from 66% on 11/5 (`scripts/macro_1106.py`).
  - The target ceiling is 4.00% and EFFR is 3.88% (FRED).
- **October CPI: Tue 11/10 at 08:30 ET.** The [BLS schedule](https://www.bls.gov/schedule/news_release/cpi.htm) is blocked from this IP, so the date comes from two calendars that cite it ([thriveinmarkets](https://thriveinmarkets.com/calendar/dates/cpi-2026/), [eco3min](https://eco3min.fr/en/next-us-cpi-release/)).
  - The SPY 11/10 735 straddle is 13.04 at mid (Cboe, 11/6 close). That is about 1.6% at the 736.2 forward.

## 2. AI regulation and credit
- **Plans, not law.** Headlines say Democrats plan a "flood of AI bills" (Reuters, 11/6 16:36 ET) and "Big Tech probes starting in January" (BigGo).
  - Named measures: the Sanders/Ocasio-Cortez AI Data Center Moratorium Act from March ([DCD](https://datacenterdynamics.com/en/news/ocasio-cortez-and-sanders-introduce-ai-data-center-moratorium-act)); Pallone's call for a moratorium ([E&E](https://www.eenews.net/articles/pallone-calls-for-national-data-center-moratorium/)); Cantwell's push for mandatory pre-deployment testing ([Nextgov](https://www.nextgov.com/artificial-intelligence/2026/09/lawmakers-clash-safety-testing-language-development-ai-legislation-people-familiar-say/415948/)).
  - Democrats lack 60 Senate votes (Tech Times). No agency step is named, and nothing can be enacted before 11/18.
- **Credit: prices contained, spreads at a 1-year high.**
  - HYG held up by +4.3 sd on 11/5 and lagged by -0.8 sd on 11/6 (closes 77.28 -> 77.23).
  - HY OAS was 3.48% on 11/5 (FRED), up from 3.32%. That is the highest of the last 250 observations.

## 3. Idea
- **Shadow only:** SPY 12/4 720P (Cboe 11/6 close: 10.60/10.72, delta -0.34, OI 2,657).
  - The nearest measured figure is 0.92 per $ for post-crash puts (macro_1105.py), so Kelly is $0.
- **Consensus** (buy puts into CPI with hike risk): it matches the shadow, but there is no measured edge.

Line 41 of the brief (the guardrail) is cut off. Please clarify it.
