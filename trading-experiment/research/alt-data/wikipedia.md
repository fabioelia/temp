# E2: Wikipedia attention spikes (tested 2026-10-30)

**Verdict: REJECTED.** No 5-session drift, the wrong sign at 20 sessions, no volatility signal beyond RV20, and options no better than random entry.

**Data.**
- Pageviews: Wikimedia `user` views, 2015-07 to 2026-10-29. All 25 titles return data; none is missing.
- Renamed articles are spliced by summing old and new titles, checked for level breaks before any outcome: Amazon.com, Tesla_Motors, Salesforce.com, Adobe_Systems, Cisco_Systems, Advanced_Micro_Devices, Avago/Broadcom_Limited/Broadcom_Inc.
- **META:** Facebook,_Inc. to Meta_Platforms is continuous. But Facebook,_Inc. was only a redirect until it was split from "Facebook" on 2019-11-30, so META starts then. Alphabet_Inc. starts 2015-08-10.
- Prices: Yahoo, through 10/23. Earnings: cached 8-K 2.02 filings.

**Method.**
- Ratio = views / trailing 60-day median. A spike is a day in the stock's own top 5%. 5,019 spike days give 4,491 events.
- Entry is at the close of the first session after the UTC day.
- Abnormal = return beyond SPY minus the stock's same-year all-days mean. t is clustered by month (5d) or quarter (20d).
- Pre-registered in `scripts/wiki_analysis.py`; full rows in `wikipedia-results.csv`.

## Returns beyond SPY

| | n | Mean / median | Hit | All days | Abnormal (t) | 2015-20 | 2021-26 |
|---|---|---|---|---|---|---|---|
| All spikes, 5d | 4,481 | +0.19 / +0.03% | 50.4% | +0.24 / +0.12%, 51.8% | **-0.07% (-0.7)** | -0.12 (-1.0) | -0.03 (-0.2) |
| All spikes, 20d | 4,464 | +0.51 / +0.14% | 50.9% | +0.98 / +0.45%, 53.0% | **-0.54% (-2.1)** | -0.75 (-2.2) | -0.35 (-0.9) |
| Away from earnings, 5d | 3,461 | +0.28 / +0.11% | 51.6% | as above | **+0.03% (0.3)** | -0.10 (-0.8) | +0.14 (1.0) |
| Away from earnings, 20d | 3,447 | +0.64 / +0.39% | 52.5% | as above | **-0.38% (-1.4)** | -0.57 (-1.6) | -0.21 (-0.5) |

- The claim (Da, Engelberg & Gao: up, then reversal) needs a positive 5d number. It is zero.
- The 20d underperformance has the wrong sign. It is only suggestive (|t| < 3) and halves after 2020, so it is no put signal.
- Worst 5d outcome: -21%.

## Volatility (next-5 RV vs prior RV20)

| | Median RV5/RV20 | Abnormal log ratio (t) | RV5 > 1.1x RV20 | Mean RV5 / RV20 |
|---|---|---|---|---|
| All spikes | 0.86 | -0.017 (-0.9) | 32.6% | 30.8 / 34.3% |
| Away from earnings | 0.86 | -0.009 (-0.4) | 33.0% | 29.6 / 32.6% |
| All days | 0.87 | | 31.8% | 29.8 / 32.1% |

- **Attention does not predict volatility beyond RV20.** Post-spike vol is about 1 point higher, but RV20 at entry is already about 2 points higher.
- Away from earnings: no difference. Every split has |t| < 0.7.
- **No help to an option buyer.** Realized vol beats RV20 x 1.1 a third of the time, as on random days. The median realized vol is about 22% below that IV.

## Options (delta 0.35, 25 DTE, IV = 1.1x RV20, 5 sessions, 3% spread)

| | Call EV/$ (t vs random) | Put EV/$ (t) |
|---|---|---|
| All spikes | 1.09 (-0.0) | 0.90 (-0.0) |
| Away from earnings | 1.09 (0.0) | 0.89 (-0.6) |
| Random entry | 1.09 | 0.91 |

Calls clear 1.0 only because random calls do: the model has no skew or volatility risk premium, and mega-caps drifted up. Approximate.

## Post-hoc (no verdicts)

| Variant | n | 5d abnormal (t) | 20d (t) | Call EV/$ |
|---|---|---|---|---|
| Episode onsets only | 1,772 | 0.00% (-0.0) | -0.34% (-1.7) | 1.10 |
| Real-time 95th-percentile threshold | 4,653 | -0.07% (-0.7) | -0.33% (-1.4) | 1.08 |
| Real-time, away from earnings | 3,605 | +0.01% (0.1) | -0.14% (-0.6) | 1.09 |
| Idiosyncratic (<5 of 25 names spiking) | 3,550 | -0.09% (-0.8) | -0.46% (-1.6) | 1.06 |

Reversal leg (+5 to +20): -0.13 to -0.34% (t -0.5 to -1.7). All null at 5d, including the tradeable real-time version.

## Caveats

- **Bot traffic:** the `user` series has platform-wide jumps (2021-07-01: Amazon 10k to 35k a day). Dropping common spikes changes nothing.
- **Not tested:** Pyun's weekly long-short, which is not in `claims.md`.
- **Universe:** Da et al.'s effect lives in small retail stocks; mega-caps are its weakest case.

**Action:** no playbook change. No persona may cite Wikipedia attention as support for a direction or for expected volatility.
