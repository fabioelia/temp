"""Weekly review facts: round trips, MFE/MAE from daily marks, the real-versus-paper gap."""
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import review as R  # noqa: E402

C = "SPY261120C00790000"


class Review(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        for d, px in (("2026-10-19", 3.58), ("2026-10-20", 4.115), ("2026-10-21", 5.175), ("2026-10-22", 3.03)):
            (self.dir / f"{d}.csv").write_text(f"ticker,close,bid,ask,source\n{C},{px},,,cboe\nSPY,770,,,yahoo+cboe\n")
        self.old = R.PRICES
        R.PRICES = self.dir

    def tearDown(self):
        R.PRICES = self.old
        shutil.rmtree(self.dir, ignore_errors=True)

    def test_round_trip_pl_matches_the_real_shot(self):
        trips, open_pos = R.round_trips([
            {"date": "2026-10-19", "side": "buy", "ticker": C, "qty": 1, "price": 3.75, "fees": 0.04},
            {"date": "2026-10-22", "side": "sell", "ticker": C, "qty": 1, "price": 2.93, "fees": 0.04}])
        self.assertEqual((len(trips), open_pos), (1, {}))
        self.assertAlmostEqual(trips[0]["pl"], -82.08, places=2)
        self.assertEqual((trips[0]["opened"], trips[0]["closed"]), ("2026-10-19", "2026-10-22"))

    def test_marks_window_and_last_mark(self):
        ms = R.marks(C, "2026-10-19", "2026-10-21")
        self.assertEqual([m[1] for m in ms], [3.58, 4.115, 5.175])
        self.assertEqual(R.last_mark(C, "2026-10-23"), ("2026-10-22", 3.03))

    def test_partial_sells_make_separate_trips(self):
        trips, open_pos = R.round_trips([
            {"date": "2026-10-19", "side": "buy", "ticker": C, "qty": 3, "price": 1.00, "fees": 0},
            {"date": "2026-10-20", "side": "sell", "ticker": C, "qty": 1, "price": 2.00, "fees": 0},
            {"date": "2026-10-21", "side": "sell", "ticker": C, "qty": 1, "price": 0.50, "fees": 0}])
        self.assertEqual([round(t["pl"], 2) for t in trips], [100.0, -50.0])
        self.assertAlmostEqual(open_pos[C]["qty"], 1.0)

    def test_num_keeps_the_third_decimal_only_when_needed(self):
        self.assertEqual((R.num(5.175), R.num(2.93), R.num(3.0)), ("5.175", "2.93", "3.00"))


if __name__ == "__main__":
    unittest.main()
