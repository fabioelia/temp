"""The pre-close confirmation gate: proposals do not fill unless re-confirmed on the fill day before 15:50 ET."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SRC = Path(__file__).resolve().parents[1]


class Gate(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        for f in ("tracker.py", "quotes.py", "config.json"):
            shutil.copy(SRC / f, self.dir)
        cfg = Path(self.dir, "config.json")  # these tests exercise the stock engine, so allow stock buys here
        c = json.loads(cfg.read_text())
        c["strategy"]["allow_stock_buys"] = True
        cfg.write_text(json.dumps(c))

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def run_tracker(self, now, *args, ok=True):
        env = dict(os.environ, TRACKER_NOW=now)
        r = subprocess.run([sys.executable, "tracker.py", *args], cwd=self.dir, env=env, capture_output=True, text=True)
        if ok:
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        else:
            self.assertNotEqual(r.returncode, 0, r.stdout)
        return r.stdout + r.stderr

    def propose(self, ticker="XLE", at="2026-10-17T10:00", *extra):
        return self.run_tracker(at, "order", "add", "--ticker", ticker, "--side", "buy", "--usd", "300", "--tier", "A",
                                "--thesis", "t", *extra)

    def day(self, date, prices):
        return self.run_tracker(f"{date}T17:13", "day", "--date", date, "--prices", prices)

    def test_unconfirmed_proposal_does_not_fill(self):
        self.propose()
        out = self.day("2026-10-19", "XLE=68.5,SPY=760")
        self.assertIn("not re-confirmed", out)
        self.assertNotIn("FILL", out)

    def test_confirm_before_cutoff_fills(self):
        self.propose()
        self.run_tracker("2026-10-19T14:50", "order", "confirm", "O001")
        self.assertIn("FILL", self.day("2026-10-19", "XLE=68.5,SPY=760"))

    def test_confirm_after_cutoff_or_on_weekend_refused(self):
        self.propose()
        self.assertIn("cutoff", self.run_tracker("2026-10-19T16:10", "order", "confirm", "O001", ok=False))
        self.assertIn("not a trading day", self.run_tracker("2026-10-17T10:05", "order", "confirm", "O001", ok=False))

    def test_same_day_decide_and_fill(self):
        self.run_tracker("2026-10-20T15:10", "order", "add", "--ticker", "XLE", "--side", "buy", "--usd", "300",
                         "--tier", "A", "--thesis", "fresh", "--confirm")
        self.assertIn("FILL", self.day("2026-10-20", "XLE=68.5,SPY=760"))
        self.run_tracker("2026-10-21T15:55", "order", "add", "--ticker", "XLE", "--side", "buy", "--usd", "50",
                         "--tier", "A", "--thesis", "late", "--confirm", ok=False)

    def test_stop_exit_fires_without_confirmation(self):
        self.run_tracker("2026-10-19T14:50", "order", "add", "--ticker", "XLE", "--side", "buy", "--usd", "300",
                         "--tier", "A", "--stop", "65", "--thesis", "s", "--confirm")
        self.day("2026-10-19", "XLE=68.5,SPY=760")
        self.assertIn("STOP HIT", self.day("2026-10-20", "XLE=64.0,SPY=758"))
        self.assertIn("FILL", self.day("2026-10-21", "XLE=63.5,SPY=757"))


if __name__ == "__main__":
    unittest.main()
