"""research.py parsers (offline fixtures) and the SEC contact-email guard."""
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import research  # noqa: E402

FORM4 = """<ownershipDocument><aff10b5One>1</aff10b5One>
<reportingOwner><reportingOwnerId><rptOwnerName>HUANG JEN HSUN</rptOwnerName></reportingOwnerId>
<reportingOwnerRelationship><isDirector>1</isDirector><isOfficer>1</isOfficer><officerTitle>President and CEO</officerTitle></reportingOwnerRelationship></reportingOwner>
<nonDerivativeTable>
<nonDerivativeTransaction><transactionDate><value>2026-10-10</value></transactionDate>
<transactionCoding><transactionFormType>4</transactionFormType><transactionCode>S</transactionCode></transactionCoding>
<transactionAmounts><transactionShares><value>75000</value></transactionShares><transactionPricePerShare><value>212.5</value><footnoteId id="F1"/></transactionPricePerShare>
<transactionAcquiredDisposedCode><value>D</value></transactionAcquiredDisposedCode></transactionAmounts></nonDerivativeTransaction>
<nonDerivativeTransaction><transactionDate><value>2026-10-11</value></transactionDate>
<transactionCoding><transactionCode>P</transactionCode></transactionCoding>
<transactionAmounts><transactionShares><value>1000</value></transactionShares><transactionPricePerShare><value>205</value></transactionPricePerShare>
<transactionAcquiredDisposedCode><value>A</value></transactionAcquiredDisposedCode></transactionAmounts></nonDerivativeTransaction>
</nonDerivativeTable></ownershipDocument>"""

SUBS = {"cik": "1045810", "filings": {"recent": {
    "accessionNumber": ["0001045810-26-000101", "0001045810-26-000099", "0001045810-26-000050"],
    "filingDate": ["2026-10-15", "2026-10-12", "2026-08-27"],
    "form": ["8-K", "4", "10-Q"],
    "primaryDocument": ["nvda-8k.htm", "xslF345X05/wk-form4_1.xml", "nvda-10q.htm"],
    "primaryDocDescription": ["8-K", "FORM 4", "10-Q"],
    "items": ["2.02,9.01", "", ""]}}}


class Research(unittest.TestCase):
    def test_form4(self):
        f = research.parse_form4(FORM4)
        self.assertEqual((f["owner"], f["title"], f["plan_10b5_1"]), ("HUANG JEN HSUN", "President and CEO", True))
        self.assertEqual([(t["code"], t["shares"], t["price"]) for t in f["transactions"]], [("S", 75000, 212.5), ("P", 1000, 205)])

    def test_submissions_filters_and_links(self):
        rows = research.parse_submissions(SUBS, days=14, forms={"8-K", "4"}, today=date(2026, 10, 17))
        self.assertEqual([r["form"] for r in rows], ["8-K", "4"])
        self.assertIn("2.02 results of operations (earnings)", rows[0]["items"])
        self.assertTrue(rows[1]["raw_xml"].endswith("/000104581026000099/wk-form4_1.xml"))

    def test_numeric_cik_skips_the_ticker_list(self):  # an IPO filer has no ticker yet
        self.assertEqual(research.cik_for("2130357"), 2130357)

    def test_html_to_text_drops_scripts_and_keeps_paragraphs(self):
        raw = ("<html><title>Fed holds</title><script>var x=1</script><nav>menu</nav>"
               "<p>The Federal Reserve held rates steady on Wednesday, citing persistent inflation.</p>"
               "<p>short</p><p>Officials signaled one more increase is possible before year end.</p></html>")
        text = research.html_to_text(raw)
        self.assertTrue(text.startswith("Fed holds"))
        self.assertIn("held rates steady", text)
        self.assertNotIn("var x", text)
        self.assertNotIn("short", text)

    def test_rss(self):
        xml = ("<rss><channel><item><title>Nvidia slips &amp; recovers</title><link>https://x/1</link>"
               "<pubDate>Sat, 17 Oct 2026 17:35:13 GMT</pubDate><source url='y'>Yahoo Finance</source></item></channel></rss>")
        it = research.parse_rss(xml)[0]
        self.assertEqual((it["title"], it["source"], it["when"].day), ("Nvidia slips & recovers", "Yahoo Finance", 17))

    def test_sec_refuses_without_contact_email(self):
        env = {k: v for k, v in os.environ.items() if k != "SEC_CONTACT_EMAIL"}
        env["HOME"] = tempfile.mkdtemp()  # no ~/.config/trading-experiment/sec_contact_email here
        r = subprocess.run([sys.executable, "research.py", "sec", "filings", "NVDA"], cwd=Path(research.__file__).parent,
                           env=env, capture_output=True, text=True)
        if research.CFG.get("research", {}).get("sec_contact_email"):
            self.skipTest("a contact email is configured")
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("contact email", r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main()
