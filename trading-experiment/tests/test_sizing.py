"""Kelly sizing for the no-cap regime (research/strategy-review/scripts/sizing.py)."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "research" / "strategy-review" / "scripts"))
import sizing  # noqa: E402


class Kelly(unittest.TestCase):
    def test_no_edge_sizes_zero(self):
        self.assertEqual(sizing.kelly([0.0, 2.0]), 0.0)          # mean 1.0: nothing to size
        self.assertEqual(sizing.kelly([0.5, 1.2, 1.1]), 0.0)     # mean below 1

    def test_even_money_coin_with_an_edge(self):
        # win 2x the stake with p = 0.6, lose it with 0.4: Kelly f* = p - q = 0.2
        f = sizing.kelly([2.0] * 6 + [0.0] * 4)
        self.assertAlmostEqual(f, 0.2, delta=0.005)

    def test_ignores_nan(self):
        self.assertAlmostEqual(sizing.kelly([2.0] * 6 + [0.0] * 4 + [float("nan")]), 0.2, delta=0.005)


if __name__ == "__main__":
    unittest.main()
