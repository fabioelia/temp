#!/usr/bin/env python3
"""A1 event study: do strategic holders gain into (or after) a large partner IPO? (the "IPO halo")

Run (from /home/user/temp):
  python3 -I trading-experiment/research/strategy-v2/scripts/anthropic_a1.py [--cache DIR] [--refresh]

Specification (fixed 2026-11-07 in this file BEFORE any return was fetched or computed):
* Case rule. US-exchange IPOs (not direct listings or SPACs), 2004-2025, valued at >= $5B at the offer price, where a
  separately listed company held a disclosed pre-IPO stake of >= 5% and < 50% (a minority strategic holder, so equity
  carve-outs are excluded). Cases come from prospectus principal-holder tables as widely reported in public news; the
  list below was written from public sources before looking at any return. A case whose holder has no Yahoo data is
  dropped and reported, never replaced. Excluded by the rule (named so the choice is visible): Arm 2023 (SoftBank ~90%,
  a carve-out; its anchor investors held < 5%), Snowflake 2020 (Salesforce < 5%), Facebook 2012 (Microsoft ~1.3%),
  Instacart 2023 (PepsiCo anchor < 5%), Spotify 2018 (direct listing), Snap 2017 (Tencent's 12% came after the IPO).
* Day 0 is the IPO's first US trading day. For Tokyo or Hong Kong holders, day 0 is the first local session after that
  date, since those markets close before the US open.
* Return: buy-and-hold abnormal return (BHAR) = holder adjusted-close return minus the benchmark's over the window.
  Benchmarks: SPY (US-listed holders), ^N225 (Tokyo), ^HSI (Hong Kong).
* Windows (holder trading days): RUN20 [-20,-1] and RUN10 [-10,-1] (the "halo" run-up, i.e. buy now, sell before the
  IPO), EVT [0,+1], POST20 [+2,+20] and POST60 [+2,+60] (after the IPO).
* Own baseline ("random entry"): the holder's mean BHAR over every window of the same length starting in days
  [-780,-60]; "excess" = BHAR minus that baseline.
* Aggregation: average holders within an IPO first (clustered), then across IPOs. t = mean / (sd / sqrt(n)); a 95%
  bootstrap CI over IPOs (10,000 draws, seed 1). Cost: 10 bps per round trip, subtracted from every window.
* Periods: protocol split pre-2010 / 2010-2026 (no case predates 2010, so pre-2010 n = 0), plus the halves
  2014-2019 and 2020-2025. Subgroup reported descriptively: US mega-cap platform holders (GOOGL, AMZN, NVDA).
* Supplementary base rate (--ipo-base, fixed 2026-11-07 before its returns were fetched): US IPOs raising >= $3B,
  2008-2025 (V 2008, GM 2010, HCA 2011, META 2012, BABA 2014, CFG 2014, UBER 2019, SNOW 2020, ABNB 2020, DASH 2020,
  CPNG 2021, DIDIY 2021, RIVN 2021, KVUE 2023, ARM 2023, LINE 2024, MDLN 2025). Entry at the first-day close (the first
  price a non-allocated buyer can get); BHAR vs SPY to +5, +20, +60 and +250 trading days, net of 10 bps. A ticker
  whose first Yahoo bar is not within 3 days of the IPO date is dropped and reported.
* Verdict rule (PROTOCOL.md): CONFIRMED needs |t| >= 2 with the claimed sign (positive run-up) in the full sample and the
  same sign with >= half the magnitude in the later half; |t| >= 3 counts as strong given ~30 tests.
Raw Yahoo bars are cached in the scratchpad, never in the repo.
"""
import argparse
import json
import os
import random
import statistics as st
import sys
import time
import urllib.parse
from datetime import datetime, timezone

sys.path.insert(0, "/home/user/temp/trading-experiment")
import quotes  # noqa: E402

CACHE = "/tmp/claude-0/-home-user-temp/0906fcb7-1711-5c60-a4e7-f4583c431f3e/scratchpad/a1-data"
COST = 0.0010

# (IPO ticker, IPO date, [(holder ticker, approx pre-IPO stake %, note)]) -- fixed before any return was seen
CASES = [
    ("JD", "2014-05-22", [("0700.HK", 15, "Tencent; also e-commerce partner")]),
    ("BABA", "2014-09-19", [("9984.T", 34, "SoftBank"), ("YHOO", 22, "Yahoo (delisted; likely no data)")]),
    ("SE", "2017-10-20", [("0700.HK", 40, "Tencent; games licensor")]),
    ("PDD", "2018-07-26", [("0700.HK", 18, "Tencent; WeChat traffic partner")]),
    ("NIO", "2018-09-12", [("0700.HK", 15, "Tencent; stake not re-verified this session")]),
    ("MRNA", "2018-12-07", [("AZN", 8, "AstraZeneca; R&D partner")]),
    ("TME", "2018-12-12", [("SPOT", 9, "Spotify; share swap")]),
    ("LYFT", "2019-03-29", [("4755.T", 13, "Rakuten"), ("GM", 8, "GM; AV partner"), ("GOOGL", 5, "Alphabet/CapitalG")]),
    ("UBER", "2019-05-10", [("9984.T", 16, "SoftBank"), ("GOOGL", 5, "Alphabet/GV")]),
    ("BEKE", "2020-08-13", [("0700.HK", 12, "Tencent; stake not re-verified this session")]),
    ("XPEV", "2020-08-27", [("BABA", 14, "Alibaba")]),
    ("CPNG", "2021-03-11", [("9984.T", 37, "SoftBank Vision Fund")]),
    ("DIDI", "2021-06-30", [("9984.T", 21, "SoftBank"), ("UBER", 12, "Uber"), ("0700.HK", 7, "Tencent")]),
    ("RIVN", "2021-11-10", [("AMZN", 20, "Amazon; 100k-van customer"), ("F", 12, "Ford")]),
    ("KVYO", "2023-09-20", [("SHOP", 11, "Shopify; integration partner")]),
    ("RDDT", "2024-03-21", [("0700.HK", 11, "Tencent")]),
    ("CRWV", "2025-03-28", [("NVDA", 6, "NVIDIA; GPU supplier, anchored the IPO")]),
]
MEGA = {"GOOGL", "AMZN", "NVDA"}
WINDOWS = {"RUN20": (-20, -1), "RUN10": (-10, -1), "EVT": (0, 1), "POST20": (2, 20), "POST60": (2, 60)}


def bench(sym):
    return "^N225" if sym.endswith(".T") else "^HSI" if sym.endswith(".HK") else "SPY"


def fetch(sym, cache, refresh, start=2010):
    fn = os.path.join(cache, sym.replace("^", "") + (f"-{start}" if start != 2010 else "") + ".json")
    if os.path.exists(fn) and not refresh:
        return json.load(open(fn))
    rows = {}
    for y in range(start, 2027, 8):
        p1 = int(datetime(y, 1, 1, tzinfo=timezone.utc).timestamp())
        p2 = min(int(datetime(y + 8, 1, 1, tzinfo=timezone.utc).timestamp()), int(time.time()))
        url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?interval=1d"
               f"&period1={p1}&period2={p2}&includeAdjustedClose=true")
        try:
            r = quotes.get_json(url)["chart"]["result"][0]
        except (quotes.ProviderError, KeyError, TypeError, IndexError) as e:
            print(f"  {sym} {y}: {e}", file=sys.stderr)
            continue
        if r["meta"].get("dataGranularity") != "1d":
            raise SystemExit(f"{sym}: granularity {r['meta'].get('dataGranularity')}")
        off = r["meta"].get("gmtoffset", 0)
        q = r["indicators"]["quote"][0]
        if not q.get("close"):  # a chunk before the listing date has no bars
            continue
        adj = (r["indicators"].get("adjclose") or [{}])[0].get("adjclose") or q["close"]
        for i, t in enumerate(r.get("timestamp") or []):
            v = adj[i] if adj[i] is not None else q["close"][i]
            if v:
                rows[datetime.fromtimestamp(t + off, timezone.utc).date().isoformat()] = v
        time.sleep(0.3)
    out = sorted(rows.items())
    os.makedirs(cache, exist_ok=True)
    json.dump(out, open(fn, "w"))
    return out


def bhar(h, b, d0, lo, hi):
    """BHAR over holder days [d0+lo, d0+hi], entering at the close of day d0+lo-1. Benchmark aligned by date."""
    hd = [d for d, _ in h]
    i0, i1 = d0 + lo - 1, d0 + hi
    if i0 < 0 or i1 >= len(h):
        return None
    bm = dict(b)
    def bpx(day):  # benchmark close on that date, or the last one before it
        while day not in bm:
            j = hd.index(day) - 1
            if j < 0:
                return None
            day = hd[j]
        return bm[day]
    b0, b1 = bpx(hd[i0]), bpx(hd[i1])
    if not b0 or not b1:
        return None
    return h[i1][1] / h[i0][1] - b1 / b0


def summarize(vals):
    n = len(vals)
    if n < 2:
        return f"n={n}" + (f" value {vals[0]*100:+.2f}%" if n else "")
    m, sd = st.mean(vals), st.stdev(vals)
    t = m / (sd / n ** 0.5) if sd else float("nan")
    rnd = random.Random(1)
    boots = sorted(st.mean(rnd.choices(vals, k=n)) for _ in range(10000))
    return (f"n={n:2d} mean {m*100:+6.2f}% median {st.median(vals)*100:+6.2f}% hit {sum(v > 0 for v in vals)/n:4.0%} "
            f"t {t:+5.2f} CI95 [{boots[250]*100:+.2f}, {boots[9750]*100:+.2f}] worst {min(vals)*100:+.2f}%")


BIG_IPOS = [("V", "2008-03-19"), ("GM", "2010-11-18"), ("HCA", "2011-03-10"), ("META", "2012-05-18"),
            ("BABA", "2014-09-19"), ("CFG", "2014-09-24"), ("UBER", "2019-05-10"), ("SNOW", "2020-09-16"),
            ("ABNB", "2020-12-10"), ("DASH", "2020-12-09"), ("CPNG", "2021-03-11"), ("DIDIY", "2021-06-30"),
            ("RIVN", "2021-11-10"), ("KVUE", "2023-05-04"), ("ARM", "2023-09-14"), ("LINE", "2024-07-25"),
            ("MDLN", "2025-12-17")]


def ipo_base(a):
    spy = dict(fetch("SPY", a.cache, a.refresh, 2008))
    out = {k: [] for k in (5, 20, 60, 250)}
    for sym, day in BIG_IPOS:
        h = fetch(sym, a.cache, a.refresh, 2008)
        if not h or abs((datetime.fromisoformat(h[0][0]) - datetime.fromisoformat(day)).days) > 3:
            print(f"DROPPED {sym}: first Yahoo bar {h[0][0] if h else None}, IPO {day}")
            continue
        line = []
        for k in out:
            if k < len(h) and h[0][0] in spy and h[k][0] in spy:
                x = h[k][1] / h[0][1] - spy[h[k][0]] / spy[h[0][0]] - COST
                out[k].append(x)
                line.append(f"+{k}d {x*100:+7.2f}%")
        print(f"{sym:6} {day} " + " ".join(line))
    print("\n== first-day close entry, BHAR vs SPY net of 10 bps")
    for k, v in out.items():
        print(f"   +{k:3d} days  {summarize(v)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=CACHE)
    ap.add_argument("--refresh", action="store_true")
    ap.add_argument("--ipo-base", action="store_true", help="run the supplementary large-IPO base rate instead")
    a = ap.parse_args()
    if a.ipo_base:
        return ipo_base(a)
    data = {}
    for _, _, hs in CASES:
        for sym, _, _ in hs:
            for s in (sym, bench(sym)):
                if s not in data:
                    data[s] = fetch(s, a.cache, a.refresh)
    rows = []  # (ipo, year, holder, {window: (bhar_net, excess_net)})
    for ipo, day, hs in CASES:
        for sym, pct, note in hs:
            h, b = data[sym], data[bench(sym)]
            dates = [d for d, _ in h]
            foreign = sym.endswith((".T", ".HK"))
            later = [i for i, d in enumerate(dates) if (d > day if foreign else d >= day)]
            if not h or not later or later[0] < 61:  # need the run-up window; the baseline uses what history exists
                print(f"DROPPED {ipo}/{sym}: no usable Yahoo history around {day}")
                continue
            d0 = later[0]
            res = {}
            for w, (lo, hi) in WINDOWS.items():
                x = bhar(h, b, d0, lo, hi)
                if x is None:
                    continue
                length = hi - lo + 1
                base = [bhar(h, b, d0 + k + 1 - lo, lo, hi) for k in range(-780, -60 - length + 1, 5)]
                base = [v for v in base if v is not None]
                res[w] = (x - COST, x - st.mean(base) - COST if len(base) >= 20 else None)
            rows.append((ipo, int(day[:4]), sym, res))
            print(f"{ipo:5} {day} {sym:8} {pct:3d}% day0 {dates[d0]} " +
                  " ".join(f"{w} {res[w][0]*100:+6.2f}%" for w in WINDOWS if w in res))

    def cluster(sel, w, k):
        by = {}
        for ipo, yr, sym, res in rows:
            if sel(ipo, yr, sym) and w in res and res[w][k] is not None:
                by.setdefault(ipo, []).append(res[w][k])
        return [st.mean(v) for v in by.values()]

    groups = [("ALL (clustered by IPO)", lambda i, y, s: True), ("pre-2010", lambda i, y, s: y < 2010),
              ("2010-2026", lambda i, y, s: y >= 2010), ("2014-2019", lambda i, y, s: y <= 2019),
              ("2020-2025", lambda i, y, s: y >= 2020), ("mega-cap US holders", lambda i, y, s: s in MEGA)]
    for k, label in ((0, "BHAR vs benchmark, net of 10 bps"), (1, "excess over holder's own baseline, net")):
        print(f"\n== {label}")
        for w in WINDOWS:
            print(f"-- {w} {WINDOWS[w]}")
            for g, sel in groups:
                print(f"   {g:24} {summarize(cluster(sel, w, k))}")


if __name__ == "__main__":
    main()
