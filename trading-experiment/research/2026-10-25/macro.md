# Macro memo, Sun 2026-10-25 (Druckenmiller/Soros seat)

**Verdict: wait Monday. Kill Friday's USO 200C. MSFT 10/28: no.**

**Data trap.** Yahoo's BZ=F rolled tonight: at 18:29 ET it showed 110.44, which is BZF27 (Jan), while BZZ26.NYM was 115.32. Against Friday's 116.72 that reads as a fake -5.4%.
- BZZ26 expires Fri 10/30, so Brent triggers now name BZF27.NYM.
- USO triggers name CLZ26 (= CL=F), 101.86 (-1.4%).

## 1. The week
**Fed.** A hawkish hold is priced.
- Polymarket (18:30) has the hold at 93.5% and the hike at 6.5%. December +25bp is 76.5%.
- The September minutes say "most participants assessed that another increase ... would likely be appropriate by year end."
- My scenario estimates:
  - Hawkish hold (~70%): ^TNX 4.95-5.05.
  - Dovish hold (~23%): ^TNX down 5-8bp.
  - Hike (6.5%): ^TNX 5.05-5.10. HY OAS likely goes through 3.46%, and QQQ falls 2-3%.

**Credit.** HY OAS was 3.40% on 10/22 (FRED), 6bp under the 2026 high.

**Oil and tech.** Oil now taxes tech through growth. USO-QQQ correlation is -0.43 to -0.55.

**Supply.**
- EIA (10/21) has crude stocks down 14.8M bbl over three weeks.
- No lost barrels are confirmed: Saudi Arabia says it intercepted the missiles aimed at Yanbu.
- Energy Connects ("Trump Prepares for Iran Escalation After US, Israeli Polls") puts the escalation tail after 11/3. USO's implied vol already prices it.

## 2. Proposals
**USO 200C: killed.** It is now the consensus trade.
- Implied vol (IV) is 63% against 33% realized over 20 days.
- Base rate from 2026 H2 closes: it reached +50% before the -50% stop 42% of the time; the stop came first 55% of the time. Expected value is about -7%.

**TLT 82C: no.**
- IV is 13% against 11% realized.
- TLT fell in 8 of 14 FOMC weeks.
- It reached +50% before the stop only 17-27% of the time.

**One contrarian conditional: buy the deal dip.**

`USO261120C00180000 (or the lowest strike at delta 0.30-0.40) | 2026-11-20 | 180 | C | 0.39 | 6.55/6.90 (Cboe via quotes.py, 10/23 close) | 2,892 | 14:43 on 10/27-10/30 (15:30 on 10/28): strike IV <= 0.48 (USO's 120-day realized is 48%), ask <= 4.00, spread <= 10%, CLZ26 >= 92, no signed US-Iran deal | 1 contract; sell all at +50%; stop to cost at +40%; thesis stop on a USO close below its 50-day (146.47) or a signed deal; -50% backstop; out by the 11/13 pre-close | consensus? no: the generic AI buys oil on escalation | edge: IV at or below realized; none at Friday's 58% | 3`

## 3. MSFT 10/28: no
- **No edge.** It is the week's consensus AI trade, and a 0.87-0.94x ratio is noise around 1.0.
- **No contract qualifies.** No strike at least 8% out of the money passed ask <= 3.60 with a spread <= 5%: the 570C was 4.20/4.65 and the 580C 2.79/3.25.
- **Wrong regime.** It is long duration while oil taxes growth and HY sits 6bp from its veto.
- **Clear vetoes are not an edge.** ^TNX is 4.99, and MSFT is 524.51 against a 50-day of 508.43.

**Sources (10/25 ET):**
- Primary: Fed September minutes, Treasury par curve (10/23), EIA WPSR (10/21), FRED (BAMLH0A0HYM2).
- Markets: Polymarket (18:30), Yahoo futures (18:23-18:29), Cboe chains, Yahoo/Robinhood closes.
- News: Asharq Al-Awsat (13:37), Energy Connects (01:20).
