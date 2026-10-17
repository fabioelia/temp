"""Offline tests for quotes.py: parsers, consensus rules, and the HTTP path via a local fake server."""
import json
import os
import sys
import threading
import unittest
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import quotes  # noqa: E402

ET = ZoneInfo("America/New_York")
DAY = "2026-10-19"
OPEN_TS = int(datetime(2026, 10, 19, 9, 30, tzinfo=ET).timestamp())


def yahoo_daily_json(close):
    return {"chart": {"result": [{"meta": {}, "timestamp": [OPEN_TS - 86400 * 3, OPEN_TS],
                                  "indicators": {"quote": [{"close": [700.0, close]}]}}], "error": None}}


def yahoo_live_json(price, ts):
    return {"chart": {"result": [{"meta": {"regularMarketPrice": price, "regularMarketTime": ts}}], "error": None}}


class Parsers(unittest.TestCase):
    def test_yahoo_daily_picks_the_requested_day(self):
        q = quotes.parse_yahoo_daily(yahoo_daily_json(712.34), "SPY", DAY)
        self.assertEqual(q["price"], 712.34)
        with self.assertRaises(quotes.ProviderError):
            quotes.parse_yahoo_daily(yahoo_daily_json(712.34), "SPY", "2026-10-20")

    def test_yahoo_daily_ignores_null_close(self):
        with self.assertRaises(quotes.ProviderError):
            quotes.parse_yahoo_daily(yahoo_daily_json(None), "SPY", DAY)

    def test_stooq_daily(self):
        csv_text = "Date,Open,High,Low,Close,Volume\n2026-10-19,1,2,3,712.30,100\n"
        self.assertEqual(quotes.parse_stooq_daily(csv_text, "SPY", DAY)["price"], 712.30)
        with self.assertRaises(quotes.ProviderError):
            quotes.parse_stooq_daily("No data", "SPY", DAY)

    def test_finnhub(self):
        q = quotes.parse_finnhub({"c": 68.5, "t": 1760900000}, "XLE")
        self.assertEqual(q["price"], 68.5)
        with self.assertRaises(quotes.ProviderError):
            quotes.parse_finnhub({"c": 0, "t": 0}, "XLE")

    def test_alpaca_snapshot_and_bars(self):
        snap = {"XLE": {"latestTrade": {"p": 68.4, "t": "2026-10-19T15:00:00Z"}, "latestQuote": {"bp": 68.39, "ap": 68.41}}}
        q = quotes.parse_alpaca_snapshot(snap, "XLE")
        self.assertEqual((q["price"], q["bid"], q["ask"]), (68.4, 68.39, 68.41))
        bars = {"bars": {"XLE": [{"t": "2026-10-19T04:00:00Z", "c": 68.55}]}}
        self.assertEqual(quotes.parse_alpaca_bars(bars, "XLE", DAY)["price"], 68.55)

    def test_failure_classification(self):
        self.assertEqual(quotes.fail_kind(0, "URLError: Tunnel connection failed: 403 Forbidden"), "blocked")
        self.assertEqual(quotes.fail_kind(0, "URLError: [Errno -2] Name or service not known"), "dns")
        self.assertEqual(quotes.fail_kind(401, ""), "auth")
        self.assertEqual(quotes.fail_kind(429, ""), "ratelimit")


def q(price, provider="yahoo"):
    return quotes.mk("SPY", provider, price, datetime.now(timezone.utc), "close")


class Consensus(unittest.TestCase):
    def test_two_agreeing_sources_ok(self):
        c = quotes.consensus([q(100.00), q(100.10, "stooq")])
        self.assertEqual(c["status"], "ok")
        self.assertAlmostEqual(c["price"], 100.05)

    def test_disagreement_fails_closed(self):
        c = quotes.consensus([q(100.0), q(101.0, "stooq")])
        self.assertEqual((c["status"], c["price"]), ("disagree", None))

    def test_single_source_is_not_ok_by_default(self):
        self.assertEqual(quotes.consensus([q(100.0)])["status"], "single")

    def test_outlier_is_dropped_when_two_others_agree(self):
        c = quotes.consensus([q(100.0), q(100.05, "stooq"), q(120.0, "alpaca")])
        self.assertEqual(c["status"], "ok")
        self.assertEqual(len(c["quotes"]), 2)

    def test_nothing(self):
        self.assertEqual(quotes.consensus([])["status"], "none")


class Handler(BaseHTTPRequestHandler):
    live_ts = 0
    bad_stooq = False

    def log_message(self, *a):
        pass

    def reply(self, body, code=200):
        data = body.encode() if isinstance(body, str) else json.dumps(body).encode()
        self.send_response(code)
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):  # noqa: N802
        p = self.path
        if "/v8/finance/chart/" in p and "interval=1d" in p:
            return self.reply(yahoo_daily_json(712.34))
        if "/v8/finance/chart/" in p:
            return self.reply(yahoo_live_json(68.50, Handler.live_ts))
        if p.startswith("/q/d/l/"):
            close = "799.00" if Handler.bad_stooq else "712.30"
            return self.reply(f"Date,Open,High,Low,Close,Volume\n{DAY},1,2,3,{close},9\n")
        if p.startswith("/api/v1/quote"):
            if "token=testkey" not in p:
                return self.reply({"error": "bad key"}, 401)
            return self.reply({"c": 68.52, "t": Handler.live_ts})
        self.reply("nope", 404)


class EndToEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = HTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        port = cls.srv.server_address[1]
        cls.saved = {k: os.environ.get(k) for k in ("QUOTES_BASE_YAHOO", "QUOTES_BASE_STOOQ", "QUOTES_BASE_FINNHUB", "FINNHUB_API_KEY")}
        os.environ.update({"QUOTES_BASE_YAHOO": f"http://127.0.0.1:{port}", "QUOTES_BASE_STOOQ": f"http://127.0.0.1:{port}",
                           "QUOTES_BASE_FINNHUB": f"http://127.0.0.1:{port}/api/v1", "FINNHUB_API_KEY": "testkey"})
        for k in ("http_proxy", "HTTP_PROXY", "all_proxy", "ALL_PROXY"):
            os.environ.pop(k, None)
        os.environ["NO_PROXY"] = "127.0.0.1"

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        for k, v in cls.saved.items():
            os.environ.pop(k, None) if v is None else os.environ.__setitem__(k, v)

    def test_closes_two_keyless_sources_agree(self):
        Handler.bad_stooq = False
        r = quotes.closes(DAY, ["SPY"])["SPY"]
        self.assertEqual(r["status"], "ok")
        self.assertAlmostEqual(r["price"], 712.32, places=2)
        self.assertIn("yahoo+stooq", r["source"])

    def test_closes_fail_closed_when_sources_disagree(self):
        Handler.bad_stooq = True
        r = quotes.closes(DAY, ["SPY"])["SPY"]
        self.assertEqual((r["status"], r["price"]), ("disagree", None))
        Handler.bad_stooq = False

    def test_live_fresh_quotes_need_two_sources(self):
        Handler.live_ts = int(datetime.now(timezone.utc).timestamp())
        r = quotes.live(["XLE"])["XLE"]
        self.assertEqual(r["status"], "ok")
        self.assertAlmostEqual(r["price"], 68.51, places=2)

    def test_live_stale_quotes_are_dropped(self):
        Handler.live_ts = int(datetime.now(timezone.utc).timestamp()) - 3600
        r = quotes.live(["XLE"])["XLE"]
        self.assertNotEqual(r["status"], "ok")
        self.assertIn("stale", r["errors"])

    def test_key_never_appears_in_errors(self):
        os.environ["FINNHUB_API_KEY"] = "wrongkey"
        try:
            with self.assertRaises(quotes.ProviderError) as cm:
                quotes.finnhub_live("XLE")
            self.assertNotIn("wrongkey", str(cm.exception))
        finally:
            os.environ["FINNHUB_API_KEY"] = "testkey"


if __name__ == "__main__":
    unittest.main()
