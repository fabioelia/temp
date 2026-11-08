# Catalyst memo (Sun 2026-11-08)

**Verdict: no trade Mon 11/9. CSCO C1 is conditional for Fri 11/13.** Weekend quotes are Friday's close, so they are stale. Figures come from `research/2026-11-06/scripts/catalyst_1106.py`, rerun tonight. The finer Kelly grid and NVDA 12/18 use the same functions; the output is in the scratchpad, `cat1108/run1.txt` and `run2.txt`.

**Who reports 11/9-11/17** (Robinhood calendar, verified): in the 25-name C1 sample, only **CSCO** (Thu 11/12 after the close) and **NVDA** (Tue 11/17 after the close). AMAT, HD, DIS and CRWV are outside the sample, so no C1.

**CSCO, Fri 11/13 14:43:** the 12/18 put (35 DTE) is the only expiry with OI of 1,000 or more.

| Input | Value |
|---|---|
| Line | 0.92 x the 11/12 close (86.34 at 93.85) |
| Band (model) | 82.5-87.5P at -8%; 80-85P at -10% |
| IV cap | 1.3 x RV20 to 11/12: 49.4% if flat, 52.9% after +/-2% days |
| Ask ceiling by IV/RV20 | 1.00: 2.63 (2.35 at the brief's $235); 1.10: 1.87; 1.20: 1.04; 1.25: 0.62 |

- One contract fits only at an IV of about 37-39%.
- Friday's spreads were 5.7-8.5%, above the 5% limit.
- EV is 1.10 per $ at 1.0x.
- Exit at the 11/20 14:43 check, with the -50% backstop.
- Who loses: CSCO holders. CSCO is well under 1% of VOO.

**NVDA (Anthropic-linked):** the 12/18 put is liquid, but one contract fits only at an IV of 35.5-37.5%, against an ex-event IV of 43.4%. Shadow only.

**SEC filings and news:**
- Apple is selling about $7.5B of notes (FWP 11/06).
- Form 4s are routine.
- **Sunday evening (Axios, DW): Huang admits an affair amid China-spy claims, and the board will investigate.** No 8-K has been filed. This is not a C1, because C1 covers earnings gaps only.

**Consensus:** a generic AI would trade the prints directionally. No match.
