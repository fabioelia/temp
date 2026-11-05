# Catalyst memo (Thu 2026-11-05)

**Verdict: no trade for Fri 11/6.** No C1 check is live, and Kelly blocks NVDA on 11/18. Figures: `scripts/catalyst_1105.py` (output in the scratchpad `cat1105/run3.txt`).

## 1. Who reports (Robinhood earnings calendar, 11/05-11/06, high market cap)
- **None of the 25-name C1 sample.**
- Thursday after the close, all outside the sample (Robinhood after-hours at about 17:16 ET, vs the 16:00 last trade):
  - Down: TEAM -16.4%, AXON -13.2%, DKNG -23%, AFRM -10.4%.
  - Up: NET +14.2%, ABNB +10.5%.
  - None is a mega-cap, so there is no C1.
- Friday before the open: ENB, VST, CHTR, HUM, MRNA. None is in the sample.

## 2. Today's drops
- **C1 does not apply.** It covers earnings gaps only.
- `research.py sec filings` shows no Item 2.02 for NVDA, AVGO, TSLA or TXN.
- MU and ORCL filed 8-Ks, but neither is earnings:
  - MU: a director retiring.
  - ORCL: a stock offering plus $10B of notes at 7.00-8.65%.
- QCOM's 14:43 trigger failed.

## 3. NVDA, 11/17 after the close
- **Date confirmed** (NVIDIA newsroom); the call is at 5 pm ET.
- Chatter, headlines only: Melius cut its target to $315 (ad-hoc-news, 11/4). No guidance change.
- **Reaction day is 11/18, the window's last session.** The 5-session hold ends 11/25.
- **Provisional C1 setup** (`fit_1104.py` method, 12/04 put, 16 DTE, equity $1,384.84):
  - RV20 is 45.7% (44.6% flat-rolled), so the IV cap is about 58%.
  - Tonight's band puts are at 64-67% IV (1.45-1.49x). Example: the 175P at 9.40/9.80, Cboe.
  - Full Kelly is $197 at 1.0x, $93 at 1.15x and $0 at 1.3x.
  - One contract fits only at IV ≤ 33-38%, which is out of reach with ^VIX at 28.
- NVDA is Anthropic-linked, so I used public facts only.

**Consensus:** a generic AI would trade NVDA into the print. No match. The measured edge is C1 EV 1.00 at the gate (n 216).
