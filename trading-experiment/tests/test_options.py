"""Options-only strategy in the paper tracker: decision-time quotes, whole contracts, the $1,500 cash floor, expiry exits."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from zoneinfo import ZoneInfo

SRC = Path(__file__).resolve().parents[1]
ET = ZoneInfo("America/New_York")
CALL = "XLE261120C00068000"
NEAR = "XLE261023C00068000"   # expires Fri 10/23


class Chain(BaseHTTPRequestHandler):
    quotes = {CALL: (2.40, 2.55), NEAR: (0.90, 1.00)}

    def log_message(self, *a):
        pass

    def do_GET(self):  # noqa: N802
        if "/delayed_quotes/options/XLE.json" in self.path:
            opts = [{"option": k, "bid": b, "ask": a, "last_trade_price": (a + b) / 2, "theo": (a + b) / 2,
                     "last_trade_time": "2026-10-19T15:59:00", "iv": 0.26, "delta": 0.55, "open_interest": 12000, "volume": 3000}
                    for k, (b, a) in Chain.quotes.items()]
            body = json.dumps({"data": {"options": opts}})
        elif "/delayed_quotes/quotes/SPY.json" in self.path:
            body = json.dumps({"data": {"close": 760.0, "last_trade_time": self.server.day + "T16:00:00"}})
        elif "/chart/SPY" in self.path:
            ts = int(datetime.fromisoformat(self.server.day + "T09:30").replace(tzinfo=ET).timestamp())
            body = json.dumps({"chart": {"result": [{"meta": {}, "timestamp": [ts], "indicators": {"quote": [{"close": [760.0]}]}}]}})
        else:
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.end_headers()
        self.wfile.write(body.encode())


class Options(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = HTTPServer(("127.0.0.1", 0), Chain)
        cls.srv.day = "2026-10-19"
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def setUp(self):
        self.dir = tempfile.mkdtemp()
        for f in ("tracker.py", "quotes.py", "config.json"):
            shutil.copy(SRC / f, self.dir)
        cfg = Path(self.dir, "config.json")  # pin the fee so the arithmetic below does not move with config updates
        c = json.loads(cfg.read_text())
        c["strategy"]["option_fee_per_contract"] = 0.05
        c["strategy"]["loss_limit_usd"] = 500.0
        cfg.write_text(json.dumps(c))
        port = self.srv.server_address[1]
        self.env = dict(os.environ, QUOTES_BASE_CBOE=f"http://127.0.0.1:{port}", QUOTES_BASE_YAHOO=f"http://127.0.0.1:{port}",
                        NO_PROXY="127.0.0.1")
        for k in ("http_proxy", "HTTP_PROXY"):
            self.env.pop(k, None)
        Chain.quotes = {CALL: (2.40, 2.55), NEAR: (0.90, 1.00)}

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def run_t(self, now, *args, ok=True):
        r = subprocess.run([sys.executable, "tracker.py", *args], cwd=self.dir, env=dict(self.env, TRACKER_NOW=now),
                           capture_output=True, text=True)
        if ok:
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        return r.stdout + r.stderr

    def day(self, date):
        self.srv.day = date
        return self.run_t(f"{date}T17:13", "day", "--date", date, "--auto-prices")

    def buy(self, now, usd, ticker=CALL, ok=True):
        return self.run_t(now, "order", "add", "--ticker", ticker, "--side", "buy", "--usd", str(usd), "--tier", "O",
                          "--thesis", "t", "--confirm", ok=ok)

    def test_stock_buys_refused_in_options_strategy(self):
        out = self.run_t("2026-10-19T14:50", "order", "add", "--ticker", "XLE", "--side", "buy", "--usd", "300",
                         "--tier", "A", "--thesis", "t", ok=False)
        self.assertIn("switched off", out)

    def test_buy_fills_whole_contracts_at_decision_ask_within_the_floor(self):
        out = self.buy("2026-10-19T14:50", 2000)           # asks for everything
        self.assertIn("bid 2.4 / ask 2.55", out)
        Chain.quotes[CALL] = (3.00, 3.10)                  # after-close quote moves; fill must still use 2.55
        out = self.day("2026-10-19")
        self.assertIn(f"FILL T001 BUY 1.0000 {CALL} @ 2.55", out)  # $500 budget / $255 per contract = 1
        status = self.run_t("2026-10-19T17:20", "status")
        self.assertIn("Cash $1,744.95", status)            # 2000 - 255 - 0.05 fee
        # equity marks the contract at the post-close mid x 100: 1744.95 + 305
        self.assertIn("Equity $2,049.95", status)

    def test_floor_blocks_more_premium_than_the_loss_budget(self):
        self.buy("2026-10-19T14:50", 500)
        self.day("2026-10-19")
        out = self.buy("2026-10-20T14:50", 500)
        out = self.day("2026-10-20")
        self.assertIn("buys no contract", out)              # $244.95 left above the floor < $255

    def test_win_raises_the_budget(self):
        self.buy("2026-10-19T14:50", 500)
        self.day("2026-10-19")
        Chain.quotes[CALL] = (5.00, 5.20)
        self.run_t("2026-10-20T14:50", "order", "add", "--ticker", CALL, "--side", "sell", "--all", "--tier", "O",
                   "--thesis", "take profit", "--confirm")
        out = self.day("2026-10-20")
        self.assertIn(f"FILL T002 SELL 1.0000 {CALL} @ 5.0", out)
        status = self.run_t("2026-10-20T17:20", "status")
        self.assertIn("realized $244.90", status)          # (5.00-2.55)*100 - 0.05 - 0.05
        self.buy("2026-10-21T14:50", 2000)
        out = self.day("2026-10-21")
        # budget above the $1,500 floor is now $744.90: one contract at $5.20 ($520), more than the original $500 allowed
        self.assertIn("FILL T003 BUY 1.0000", out)
        self.assertIn("cash $1,724.85", out)

    def test_expiry_too_close_refused_and_auto_close_before_expiry(self):
        out = self.run_t("2026-10-21T14:50", "order", "add", "--ticker", NEAR, "--side", "buy", "--usd", "200",
                         "--tier", "O", "--thesis", "t", "--confirm", ok=False)
        self.assertIn("too close", out)
        self.buy("2026-10-19T14:50", 200, NEAR)
        self.day("2026-10-19")
        out = self.day("2026-10-20")        # expiry Fri 10/23 <= next-next session (10/22)? no; 10/21 run queues it
        out = self.day("2026-10-21")
        self.assertIn("EXPIRY", out)
        out = self.day("2026-10-22")
        self.assertIn(f"SELL 2.0000 {NEAR}", out)

    def test_confirm_fails_closed_without_a_quote(self):
        out = self.buy("2026-10-19T14:50", 300, "XLE261120C00099000", ok=False)
        self.assertIn("no option quote", out)


if __name__ == "__main__":
    unittest.main()
