"""The real-money gate: every refusal path, the happy path, and the $500 loss limit, with a controlled clock."""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SRC = Path(__file__).resolve().parents[1]
MON = "2026-10-19"


class Live(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        for f in ("tracker.py", "live.py", "quotes.py", "config.json"):
            shutil.copy(SRC / f, self.dir)
        self.set_live(enabled=True)
        p = Path(self.dir, "config.json")  # these tests exercise the stock path of the gate
        c = json.loads(p.read_text())
        c["strategy"]["allow_stock_buys"] = True
        c["live"]["loss_limit_usd"] = 500.0  # tests below assume the original $500 limit
        p.write_text(json.dumps(c))

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def set_live(self, **kw):
        p = Path(self.dir, "config.json")
        c = json.loads(p.read_text())
        c["live"].update(kw)
        p.write_text(json.dumps(c))

    def run_cmd(self, script, now, *args):
        env = dict(os.environ, TRACKER_NOW=now)
        r = subprocess.run([sys.executable, script, *args], cwd=self.dir, env=env, capture_output=True, text=True)
        return r.returncode, r.stdout + r.stderr

    def tracker(self, now, *args):
        rc, out = self.run_cmd("tracker.py", now, *args)
        self.assertEqual(rc, 0, out)
        return out

    def confirmed(self, ticker="XLE", usd="350", at=f"{MON}T14:50", side="buy", size=("--usd", None)):
        args = ["order", "add", "--ticker", ticker, "--side", side, "--tier", "A", "--thesis", "t", "--confirm"]
        args += ["--all"] if side == "sell" else ["--usd", usd]
        self.tracker(at, *args)

    def gate(self, order, at=f"{MON}T14:55", *extra):
        return self.run_cmd("live.py", at, "gate", "--order", order, *extra)

    def buy_and_record(self, ticker, usd, qty, px, day=MON, order="O001"):
        self.confirmed(ticker, usd, f"{day}T14:50")
        rc, out = self.gate(order, f"{day}T14:55")
        self.assertEqual(rc, 0, out)
        tid = json.loads(out)["ticket"]
        rc, out = self.run_cmd("live.py", f"{day}T14:57", "record", "--ticket", tid, "--qty", str(qty), "--avg-price", str(px))
        self.assertEqual(rc, 0, out)

    def test_refused_when_disabled_or_killed(self):
        self.confirmed()
        self.set_live(enabled=False)
        rc, out = self.gate("O001")
        self.assertEqual((rc, "not enabled" in out), (2, True))
        self.set_live(enabled=True)
        Path(self.dir, "KILL_SWITCH").write_text("stop")
        rc, out = self.gate("O001")
        self.assertEqual((rc, "KILL_SWITCH" in out), (2, True))

    def test_unconfirmed_order_refused(self):
        self.tracker("2026-10-17T10:00", "order", "add", "--ticker", "XLE", "--side", "buy", "--usd", "350", "--tier", "A", "--thesis", "t")
        rc, out = self.gate("O001")
        self.assertEqual((rc, "not confirmed today" in out), (2, True))

    def test_after_cutoff_refused(self):
        self.confirmed()
        rc, out = self.gate("O001", f"{MON}T15:51")
        self.assertEqual((rc, "cutoff" in out), (2, True))

    def test_happy_path_and_no_duplicate_ticket(self):
        self.confirmed()
        rc, out = self.gate("O001")
        self.assertEqual(rc, 0, out)
        t = json.loads(out)
        self.assertEqual((t["verdict"], t["notional_usd"]), ("APPROVED", 350.0))
        rc, out = self.gate("O001")
        self.assertEqual((rc, "already has a ticket" in out), (2, True))

    def test_single_order_cap(self):
        self.confirmed("XLE", "1500")
        self.assertEqual(json.loads(self.gate("O001")[1])["notional_usd"], 600.0)  # 30% of $2,000

    def test_leveraged_etf_cap(self):
        self.confirmed("GUSH", "500")
        self.assertEqual(json.loads(self.gate("O001")[1])["notional_usd"], 300.0)  # 15% of $2,000

    def test_total_capital_cap(self):
        self.buy_and_record("AAA", "600", 10, 60, order="O001")
        self.buy_and_record("BBB", "600", 10, 60, day="2026-10-20", order="O002")
        self.buy_and_record("CCC", "600", 10, 60, day="2026-10-21", order="O003")
        self.confirmed("DDD", "600", "2026-10-22T14:50")
        out = self.gate("O004", "2026-10-22T14:55")
        self.assertEqual(json.loads(out[1])["notional_usd"], 200.0)  # only $200 of the $2,000 is left

    def test_daily_fill_cap_and_repeat_ticker(self):
        for t in ["AAA", "BBB", "CCC", "DDD", "EEE"]:
            self.confirmed(t, "100")
        self.assertEqual([self.gate(f"O00{i}")[0] for i in range(1, 6)], [0, 0, 0, 0, 2])
        self.confirmed("AAA", "100")
        self.assertEqual(self.gate("O006")[0], 2)

    def test_sell_needs_a_holding_and_uses_recorded_shares(self):
        self.buy_and_record("XLE", "350", 5.1, 68.5)
        self.confirmed("ZZZ", at="2026-10-20T14:50", side="sell")
        rc, out = self.gate("O002", "2026-10-20T14:55")
        self.assertEqual((rc, "no shorting" in out), (2, True))
        self.confirmed("XLE", at="2026-10-20T14:51", side="sell")
        rc, out = self.gate("O003", "2026-10-20T14:56")
        self.assertEqual(rc, 0, out)
        self.assertAlmostEqual(json.loads(out)["shares"], 5.1)

    def test_loss_limit_stops_buys_forces_flatten_then_kills(self):
        self.buy_and_record("XLE", "600", 10, 60)  # cost $600
        # XLE collapses: experiment equity = 2000 - 600 + 10*0.01 -> down ~$600 > $500 limit
        rc, out = self.run_cmd("live.py", "2026-10-20T14:40", "check", "--marks", "XLE=0.01")
        self.assertEqual(rc, 3, out)
        self.assertIn("FLATTEN REQUIRED", out)
        # new buys are refused from now on, even with no marks passed
        self.confirmed("AAA", "100", "2026-10-20T14:50")
        rc, out = self.gate("O002", "2026-10-20T14:55")
        self.assertEqual((rc, "LOSS LIMIT" in out), (2, True))
        # a sell of the whole position is still approved (flatten), even when it asks for less
        self.tracker("2026-10-20T14:51", "order", "add", "--ticker", "XLE", "--side", "sell", "--pct", "10", "--tier", "A", "--thesis", "flatten", "--confirm")
        rc, out = self.gate("O003", "2026-10-20T14:56")
        self.assertEqual(rc, 0, out)
        t = json.loads(out)
        self.assertEqual((t["sell_all"], t["shares"]), (True, 10.0))
        self.run_cmd("live.py", "2026-10-20T14:57", "record", "--ticket", t["ticket"], "--qty", "10", "--avg-price", "0.01")
        # flat and stopped: the next check creates the kill switch
        rc, out = self.run_cmd("live.py", "2026-10-20T15:10", "check")
        self.assertEqual(rc, 3, out)
        self.assertTrue(Path(self.dir, "KILL_SWITCH").exists())
        self.confirmed("BBB", "100", "2026-10-21T14:50")
        self.assertIn("KILL_SWITCH", self.gate("O004", "2026-10-21T14:55")[1])

    def test_loss_below_limit_keeps_trading(self):
        self.buy_and_record("XLE", "600", 10, 60)
        rc, out = self.run_cmd("live.py", "2026-10-20T14:40", "check", "--marks", "XLE=55")  # -$50
        self.assertEqual(rc, 0, out)
        self.assertIn("STATE: OK", out)


if __name__ == "__main__":
    unittest.main()


class LiveOptions(unittest.TestCase):
    """Options through the real-money gate: limit orders, whole contracts, the $1,500 cash floor."""
    CALL = "XLE261120C00068000"

    def setUp(self):
        self.dir = tempfile.mkdtemp()
        for f in ("tracker.py", "live.py", "quotes.py", "config.json"):
            shutil.copy(SRC / f, self.dir)
        p = Path(self.dir, "config.json")
        c = json.loads(p.read_text())
        c["live"]["enabled"] = True
        c["live"]["loss_limit_usd"] = 500.0
        p.write_text(json.dumps(c))
        # orders are confirmed with stored quotes directly, so no network is needed
        Path(self.dir, "data").mkdir()
        cols = "id,created,ticker,side,size_type,size_value,tier,max_price,min_price,stop,target,stop_pct,target_pct,priority,gtd,status,filled_date,reason,thesis,auto,confirmed_on,confirmed_at,q_bid,q_ask,q_time,q_source"
        rows = [f"O001,{MON},{self.CALL},buy,usd,2000,O,,,,,,,5,{MON},pending,,,t,,{MON},{MON}T14:50-04:00,2.4,2.55,,cboe",
                f"O002,{MON},XLE,buy,usd,300,A,,,,,,,5,{MON},pending,,,t,,{MON},{MON}T14:50-04:00,,,,"]
        Path(self.dir, "data", "orders.csv").write_text(cols + "\n" + "\n".join(rows) + "\n")

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def gate(self, *args, at=f"{MON}T14:55"):
        r = subprocess.run([sys.executable, "live.py", "gate", *args], cwd=self.dir,
                           env=dict(os.environ, TRACKER_NOW=at), capture_output=True, text=True)
        return r.returncode, r.stdout + r.stderr

    def test_option_needs_limit_and_respects_the_floor(self):
        rc, out = self.gate("--order", "O001")
        self.assertEqual((rc, "--limit" in out), (2, True))
        rc, out = self.gate("--order", "O001", "--limit", "2.55")
        self.assertEqual(rc, 0, out)
        t = json.loads(out)
        self.assertEqual((t["contracts"], t["order_type"], t["premium_usd"]), (1, "limit", 255.0))  # $500 budget

    def test_option_limit_must_be_on_tick_and_ref_id_is_stable(self):
        rc, out = self.gate("--order", "O001", "--limit", "3.12")
        self.assertEqual((rc, "tick" in out), (2, True))
        rc, out = self.gate("--order", "O001", "--limit", "2.55")
        self.assertEqual(rc, 0, out)
        import uuid
        self.assertEqual(json.loads(out)["ref_id"], str(uuid.uuid5(uuid.NAMESPACE_URL, "https://github.com/fabioelia/temp/trading-experiment/K001")))

    def write_order(self, row):
        p = Path(self.dir, "data", "orders.csv")
        p.write_text(p.read_text() + row + "\n")

    def test_qty_sized_option_buys_the_contracts_asked_for(self):
        self.write_order(f"O003,{MON},XLE261120C00070000,buy,qty,1,O,,,,,,,5,{MON},pending,,,t,,{MON},{MON}T14:50-04:00,1.9,2.0,,cboe")
        rc, out = self.gate("--order", "O003", "--limit", "2.00")
        self.assertEqual(rc, 0, out)
        self.assertEqual(json.loads(out)["contracts"], 1)

    def set_loss_limit(self, usd):
        p = Path(self.dir, "config.json")
        c = json.loads(p.read_text())
        c["live"]["loss_limit_usd"] = usd
        p.write_text(json.dumps(c))

    def test_usd_sized_premium_equal_to_the_ask_buys_one_contract(self):
        self.set_loss_limit(1000.0)
        self.write_order(f"O003,{MON},XLE261120C00070000,buy,usd,500,O,,,,,,,5,{MON},pending,,,t,,{MON},{MON}T14:50-04:00,4.9,5.0,,cboe")
        rc, out = self.gate("--order", "O003", "--limit", "5.00")   # the fee is paid from the budget, not from the $500 asked for
        self.assertEqual(rc, 0, out)
        self.assertEqual(json.loads(out)["contracts"], 1)

    def test_fees_must_fit_above_the_floor(self):
        self.write_order(f"O003,{MON},XLE261120C00070000,buy,usd,500,O,,,,,,,5,{MON},pending,,,t,,{MON},{MON}T14:50-04:00,4.9,5.0,,cboe")
        rc, out = self.gate("--order", "O003", "--limit", "5.00")   # $500 budget: $500 premium + $0.04 fee does not fit
        self.assertEqual((rc, "buys no contract" in out), (2, True))

    def test_single_order_cap_applies_to_options(self):
        self.set_loss_limit(1000.0)
        rc, out = self.gate("--order", "O001", "--limit", "2.55")   # wants $2,000; floor allows $1,000; cap is 30% of $2,000
        self.assertEqual(rc, 0, out)
        t = json.loads(out)
        self.assertEqual((t["contracts"], t["premium_usd"]), (2, 510.0))

    def test_stock_buy_refused_in_options_strategy(self):
        rc, out = self.gate("--order", "O002")
        self.assertEqual((rc, "switched off" in out), (2, True))
