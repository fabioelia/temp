#!/usr/bin/env python3
"""Quote layer for the paper-trading experiment (stdlib only).

Fail-closed by design: a price is returned only when independent providers agree, and
every price carries the providers and timestamps that produced it. The tracker calls this
module itself (`tracker.py day --auto-prices`), so prices are never typed in by hand.

Providers (all optional; the ones that answer are cross-checked):
  yahoo    keyless  live + daily closes   query1/query2.finance.yahoo.com
  cboe     keyless  daily closes          cdn.cboe.com (15-minute delayed quotes, so closes only)
  stooq    keyless  daily closes          stooq.com (off by default: resets connections from cloud IPs)
  finnhub  key      live                  finnhub.io           env FINNHUB_API_KEY
  alpaca   key      live + daily closes   data.alpaca.markets  env ALPACA_KEY_ID, ALPACA_SECRET_KEY

Keys are read from environment variables only (set them as environment secrets) and are never
printed or written to disk.

  quotes.py check                         which providers are reachable from this environment
  quotes.py get SPY XLE                   live consensus quote
  quotes.py closes --date 2026-10-19 --tickers SPY,XLE --out data/prices/2026-10-19.csv
"""
import argparse
import csv
import json
import os
import statistics
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
UA = "Mozilla/5.0 (paper-trading-experiment; +https://github.com/fabioelia/temp)"
TOL = 0.003  # providers must agree within 0.3% to form a consensus


class ProviderError(Exception):
    def __init__(self, kind, msg):
        super().__init__(msg)
        self.kind = kind


# ---------------------------------------------------------------- http
def base(name, default):
    return os.environ.get(f"QUOTES_BASE_{name.upper()}", default).rstrip("/")


def env(name):
    return os.environ.get(name, "").strip()


def http_get(url, headers=None, timeout=12):
    """Return (status, body). status 0 means no HTTP response (network layer)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:300]
    except Exception as e:  # noqa: BLE001 - classify below
        return 0, f"{type(e).__name__}: {e}"


def fail_kind(status, body):
    if status == 0:
        if "Tunnel connection failed" in body or "403" in body:
            return "blocked"
        if any(s in body for s in ("Name or service not known", "nodename nor servname", "getaddrinfo", "Temporary failure")):
            return "dns"
        return "network"
    return {401: "auth", 403: "auth", 429: "ratelimit"}.get(status, "http")


def get_json(url, headers=None):
    status, body = http_get(url, headers)
    if status != 200:
        raise ProviderError(fail_kind(status, body), f"HTTP {status}: {body[:120]}")
    try:
        return json.loads(body)
    except ValueError as e:
        raise ProviderError("parse", f"bad JSON: {e}") from e


def positive(x):
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return v if v > 0 else None


def mk(symbol, provider, price, ts, kind, bid=None, ask=None, delayed=False):
    return {"symbol": symbol, "provider": provider, "price": round(price, 4), "ts": ts, "kind": kind,
            "bid": bid, "ask": ask, "delayed": delayed}


# ---------------------------------------------------------------- parsers (pure; unit-tested)
def parse_yahoo_live(data, sym):
    try:
        meta = data["chart"]["result"][0]["meta"]
        price = positive(meta["regularMarketPrice"])
        ts = datetime.fromtimestamp(int(meta["regularMarketTime"]), timezone.utc)
    except (KeyError, IndexError, TypeError, ValueError) as e:
        raise ProviderError("parse", f"yahoo live: {e}") from e
    if price is None:
        raise ProviderError("parse", "yahoo live: no price")
    return mk(sym, "yahoo", price, ts, "live")


def parse_yahoo_daily(data, sym, day):
    try:
        res = data["chart"]["result"][0]
        stamps, closes = res["timestamp"], res["indicators"]["quote"][0]["close"]
    except (KeyError, IndexError, TypeError) as e:
        raise ProviderError("parse", f"yahoo daily: {e}") from e
    for t, c in zip(stamps, closes):
        if datetime.fromtimestamp(t, ET).date().isoformat() == day and positive(c):
            return mk(sym, "yahoo", float(c), datetime.fromtimestamp(t, timezone.utc), "close")
    raise ProviderError("nodata", f"yahoo daily: no close for {day}")


def parse_stooq_daily(text, sym, day):
    for line in text.strip().splitlines()[1:]:
        parts = line.split(",")
        if len(parts) >= 5 and parts[0] == day and positive(parts[4]):
            return mk(sym, "stooq", float(parts[4]), datetime.fromisoformat(day).replace(tzinfo=ET), "close")
    raise ProviderError("nodata", f"stooq daily: no close for {day}")


def parse_finnhub(data, sym):
    price = positive(data.get("c")) if isinstance(data, dict) else None
    t = data.get("t") if isinstance(data, dict) else None
    if price is None or not t:
        raise ProviderError("parse", "finnhub: empty quote (bad symbol or no key access)")
    return mk(sym, "finnhub", price, datetime.fromtimestamp(int(t), timezone.utc), "live")


def parse_alpaca_snapshot(data, sym):
    snap = (data.get("snapshots", data) if isinstance(data, dict) else {}).get(sym)
    try:
        trade = snap["latestTrade"]
        price = positive(trade["p"])
        ts = datetime.fromisoformat(trade["t"].replace("Z", "+00:00"))
    except (KeyError, TypeError, ValueError) as e:
        raise ProviderError("parse", f"alpaca snapshot: {e}") from e
    if price is None:
        raise ProviderError("parse", "alpaca snapshot: no price")
    qt = snap.get("latestQuote") or {}
    return mk(sym, "alpaca", price, ts, "live", bid=positive(qt.get("bp")), ask=positive(qt.get("ap")))


def parse_alpaca_bars(data, sym, day):
    for b in (data.get("bars") or {}).get(sym, []) if isinstance(data, dict) else []:
        ts = datetime.fromisoformat(b["t"].replace("Z", "+00:00"))
        if ts.astimezone(ET).date().isoformat() == day and positive(b.get("c")):
            return mk(sym, "alpaca", float(b["c"]), ts, "close")
    raise ProviderError("nodata", f"alpaca bars: no close for {day}")


def parse_cboe_daily(data, sym, day):
    """Cboe delayed quote: `close` is the official close of the session in `last_trade_time` (ET)."""
    try:
        q = data["data"]
        close, ltt = positive(q["close"]), q["last_trade_time"]
    except (KeyError, TypeError) as e:
        raise ProviderError("parse", f"cboe: {e}") from e
    if close is None or not ltt or ltt[:10] != day:
        raise ProviderError("nodata", f"cboe: last session {str(ltt)[:10]}, not {day}")
    return mk(sym, "cboe", close, datetime.fromisoformat(ltt).replace(tzinfo=ET), "close",
              bid=positive(q.get("bid")), ask=positive(q.get("ask")), delayed=True)


# ---------------------------------------------------------------- providers (network)
def yahoo_live(sym):
    err = None
    for host in ("query1.finance.yahoo.com", "query2.finance.yahoo.com"):
        url = f"{base('yahoo', 'https://' + host)}/v8/finance/chart/{urllib.parse.quote(sym)}?range=1d&interval=1m&includePrePost=false"
        try:
            return parse_yahoo_live(get_json(url), sym)
        except ProviderError as e:
            err = e
    raise err


def yahoo_daily(sym, day):
    err = None
    for host in ("query1.finance.yahoo.com", "query2.finance.yahoo.com"):
        url = f"{base('yahoo', 'https://' + host)}/v8/finance/chart/{urllib.parse.quote(sym)}?range=1mo&interval=1d"
        try:
            return parse_yahoo_daily(get_json(url), sym, day)
        except ProviderError as e:
            err = e
    raise err


def stooq_daily(sym, day):
    d = day.replace("-", "")
    url = f"{base('stooq', 'https://stooq.com')}/q/d/l/?s={sym.lower()}.us&i=d&d1={d}&d2={d}"
    status, body = http_get(url)
    if status != 200:
        raise ProviderError(fail_kind(status, body), f"HTTP {status}: {body[:120]}")
    return parse_stooq_daily(body, sym, day)


def cboe_daily(sym, day):
    url = f"{base('cboe', 'https://cdn.cboe.com')}/api/global/delayed_quotes/quotes/{urllib.parse.quote(sym)}.json"
    return parse_cboe_daily(get_json(url), sym, day)


def finnhub_live(sym):
    key = env("FINNHUB_API_KEY")
    if not key:
        raise ProviderError("nokey", "set FINNHUB_API_KEY")
    url = f"{base('finnhub', 'https://finnhub.io/api/v1')}/quote?symbol={urllib.parse.quote(sym)}&token={key}"
    try:
        return parse_finnhub(get_json(url), sym)
    except ProviderError as e:
        raise ProviderError(e.kind, str(e).replace(key, "***")) from None


def alpaca_headers():
    k, s = env("ALPACA_KEY_ID"), env("ALPACA_SECRET_KEY")
    if not (k and s):
        raise ProviderError("nokey", "set ALPACA_KEY_ID and ALPACA_SECRET_KEY")
    return {"APCA-API-KEY-ID": k, "APCA-API-SECRET-KEY": s}


def alpaca_live(sym):
    url = f"{base('alpaca', 'https://data.alpaca.markets')}/v2/stocks/snapshots?symbols={urllib.parse.quote(sym)}&feed=iex"
    return parse_alpaca_snapshot(get_json(url, alpaca_headers()), sym)


def alpaca_daily(sym, day):
    nxt = (date.fromisoformat(day) + timedelta(days=1)).isoformat()
    url = (f"{base('alpaca', 'https://data.alpaca.markets')}/v2/stocks/bars?symbols={urllib.parse.quote(sym)}"
           f"&timeframe=1Day&start={day}&end={nxt}&adjustment=raw&feed=sip&limit=5")
    return parse_alpaca_bars(get_json(url, alpaca_headers()), sym, day)


LIVE = {"yahoo": yahoo_live, "finnhub": finnhub_live, "alpaca": alpaca_live}
DAILY = {"yahoo": yahoo_daily, "cboe": cboe_daily, "alpaca": alpaca_daily}  # stooq_daily available but off


# ---------------------------------------------------------------- consensus
def consensus(quotes, tol=TOL, need=2):
    """quotes: list of quote dicts for one symbol. Returns dict with status ok|single|disagree|none."""
    if not quotes:
        return {"status": "none", "price": None, "quotes": []}
    prices = [q["price"] for q in quotes]
    med = statistics.median(prices)
    agree = [q for q in quotes if abs(q["price"] / med - 1) <= tol]
    if len(agree) >= need:
        return {"status": "ok", "price": round(statistics.median([q["price"] for q in agree]), 4), "quotes": agree}
    if len(quotes) == 1:
        return {"status": "single", "price": quotes[0]["price"], "quotes": quotes}
    return {"status": "disagree", "price": None, "quotes": quotes}


def gather(fetchers, *args):
    got, errors = [], {}
    for name, fn in fetchers.items():
        try:
            got.append(fn(*args))
        except ProviderError as e:
            errors[name] = f"{e.kind}: {e}"
    return got, errors


def closes(day, symbols, need=2, allow_single=False):
    """Official daily close of `day` per symbol. Returns {sym: {status, price, source, errors}}."""
    out = {}
    for sym in symbols:
        got, errors = gather(DAILY, sym, day)
        c = consensus(got, need=need)
        if c["status"] == "single" and allow_single:
            c["status"] = "ok"
        names = "+".join(q["provider"] for q in c["quotes"])
        spread = (max(q["price"] for q in c["quotes"]) / min(q["price"] for q in c["quotes"]) - 1) if c["quotes"] else 0
        out[sym] = {"status": c["status"], "price": c["price"], "errors": errors,
                    "source": f"{names} official close {day} ({len(c['quotes'])} sources, spread {spread:.2%})"}
    return out


def live(symbols, need=2, allow_single=False, max_age=120):
    """Live consensus quotes. Stale (older than max_age seconds) quotes are dropped."""
    now = datetime.now(timezone.utc)
    out = {}
    for sym in symbols:
        got, errors = gather(LIVE, sym)
        fresh = [q for q in got if (now - q["ts"]).total_seconds() <= max_age]
        c = consensus(fresh, need=need)
        if c["status"] == "single" and allow_single:
            c["status"] = "ok"
        if got and not fresh:
            errors["stale"] = f"newest quote is {int((now - max(q['ts'] for q in got)).total_seconds())}s old (market closed?)"
        names = "+".join(q["provider"] for q in c["quotes"])
        out[sym] = {"status": c["status"], "price": c["price"], "errors": errors,
                    "source": f"{names} live {now:%Y-%m-%dT%H:%M:%SZ} ({len(c['quotes'])} sources)"}
    return out


# ---------------------------------------------------------------- cli
def last_weekday(today=None):
    d = (today or datetime.now(ET).date()) - timedelta(days=1)
    while d.weekday() >= 5:
        d -= timedelta(days=1)
    return d.isoformat()


def cmd_check(a):
    day = a.date or last_weekday()
    rows, live_ok, close_ok = [], [], []
    for name, fn in LIVE.items():
        try:
            q = fn("SPY")
            rows.append((name, "live", f"OK  SPY {q['price']:.2f} @ {q['ts'].astimezone(ET):%Y-%m-%d %H:%M ET}"))
            live_ok.append(name)
        except ProviderError as e:
            rows.append((name, "live", f"{e.kind.upper():8} {e}"))
    for name, fn in DAILY.items():
        try:
            q = fn("SPY", day)
            rows.append((name, f"close {day}", f"OK  SPY {q['price']:.2f}"))
            close_ok.append(name)
        except ProviderError as e:
            rows.append((name, f"close {day}", f"{e.kind.upper():8} {e}"))
    for name, what, res in rows:
        print(f"{name:8} {what:17} {res}")
    print()
    print(f"official closes: {'READY' if len(close_ok) >= 2 else 'NOT READY'} ({len(close_ok)} sources; need 2)  {close_ok}")
    print(f"live quotes:     {'READY' if len(live_ok) >= 2 else 'NOT READY'} ({len(live_ok)} sources; need 2)  {live_ok}")
    sys.exit(0 if len(close_ok) >= 2 else 1)


def cmd_get(a):
    res = live([s.upper() for s in a.symbols], need=1 if a.allow_single else 2, allow_single=a.allow_single)
    bad = 0
    for sym, r in res.items():
        print(f"{sym:6} {r['status']:9} {r['price'] if r['price'] else '-':>10}  {r['source']}  {r['errors'] or ''}")
        bad += r["status"] != "ok"
    sys.exit(1 if bad else 0)


def cmd_closes(a):
    syms = [s.strip().upper() for s in a.tickers.split(",") if s.strip()]
    res = closes(a.date, syms, allow_single=a.allow_single)
    rows = []
    for sym, r in res.items():
        print(f"{sym:6} {r['status']:9} {r['price'] if r['price'] else '-':>10}  {r['source']}  {r['errors'] or ''}")
        if r["status"] == "ok":
            rows.append({"ticker": sym, "close": r["price"], "source": r["source"]})
    if a.out:
        with open(a.out, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["ticker", "close", "source"])
            w.writeheader()
            w.writerows(rows)
    sys.exit(0 if len(rows) == len(syms) else 1)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check")
    c.add_argument("--date")
    c.set_defaults(fn=cmd_check)
    g = sub.add_parser("get")
    g.add_argument("symbols", nargs="+")
    g.add_argument("--allow-single", action="store_true")
    g.set_defaults(fn=cmd_get)
    cl = sub.add_parser("closes")
    cl.add_argument("--date", required=True)
    cl.add_argument("--tickers", required=True)
    cl.add_argument("--out")
    cl.add_argument("--allow-single", action="store_true")
    cl.set_defaults(fn=cmd_closes)
    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
