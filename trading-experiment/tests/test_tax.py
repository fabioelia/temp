"""Tax memo: short-term P/L and possible wash sales across contracts on one underlying."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import tracker as T  # noqa: E402

A = "SPY261120C00785000"
B = "SPY261120C00790000"


def fill(day, side, ticker, price, qty=1, fees=0.04):
    return {"date": day, "side": side, "ticker": ticker, "qty": qty, "price": price, "fees": fees}


class TaxMemo(unittest.TestCase):
    def test_gain_is_short_term_with_no_wash_sale(self):
        tx = T.tax_memo([fill("2026-10-19", "buy", A, 4.40), fill("2026-10-23", "sell", A, 8.80)])
        self.assertEqual((tx["short_term"], tx["long_term"], tx["wash"]), (439.92, 0.0, []))
        self.assertAlmostEqual(tx["est_tax"], round(439.92 * T.CFG["tax_rate_memo"], 2))

    def test_loss_then_rebuy_on_the_same_underlying_within_30_days_is_flagged(self):
        tx = T.tax_memo([fill("2026-10-19", "buy", A, 4.40), fill("2026-10-30", "sell", A, 2.20),
                         fill("2026-11-04", "buy", B, 3.00)])
        self.assertEqual(len(tx["wash"]), 1)
        self.assertEqual((tx["wash"][0]["loss"], tx["wash"][0]["replacements"]), (-220.08, [f"2026-11-04 {B}"]))

    def test_rebuy_after_30_days_or_another_underlying_is_not_flagged(self):
        tx = T.tax_memo([fill("2026-10-19", "buy", A, 4.40), fill("2026-10-20", "sell", A, 2.20),
                         fill("2026-11-20", "buy", B, 3.00), fill("2026-10-21", "buy", "TLT261120C00082000", 0.69)])
        self.assertEqual(tx["wash"], [])

    def test_a_different_contract_bought_shortly_before_a_loss_is_flagged(self):
        tx = T.tax_memo([fill("2026-10-19", "buy", A, 4.40), fill("2026-10-22", "buy", B, 3.00),
                         fill("2026-10-30", "sell", A, 2.20)])
        self.assertEqual(len(tx["wash"]), 1)

    def test_empty_ledger(self):
        self.assertEqual(T.tax_memo([])["net"], 0)


if __name__ == "__main__":
    unittest.main()
