"""research/2026-11-02/scripts/goal_odds.py: the parameterized historian model reproduces historian_call_double.py (2026-11-01).

The data tests skip when the historian's cache (paths13.csv) is missing; rebuild it with historian_hist_fetch.py, then
historian_base_rates.py (research/2026-11-01/scripts).
"""
import os
import subprocess
import sys
import unittest
from datetime import date
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True   # no .pyc beside the dated research scripts
SCRIPT = Path(__file__).resolve().parents[1] / 'research' / '2026-11-02' / 'scripts' / 'goal_odds.py'
sys.path.insert(0, str(SCRIPT.parent))
import goal_odds  # noqa: E402

hd = goal_odds.hd
HAVE_CACHE = os.path.exists(os.path.join(hd.CACHE, 'paths13.csv'))
# The historian's 11/01 inputs: 10/30-close quote of SPY261130C00770000, for the Monday 11/2 entry (day 1 = 11/2, 13 sessions).
H1101 = dict(underlying='SPY', entry=date(2026, 10, 30), end=date(2026, 11, 18), spot=755.72, strike=770, expiry=date(2026, 11, 30),
             bid=7.37, ask=7.47, iv=0.1351, vix=19.42, equity=1917.92, bench=1970.94, goal=2200.0, stop=0.5, irx=3.97)


class Sessions(unittest.TestCase):
    def test_counts(self):
        s = goal_odds.sessions_after
        self.assertEqual(len(s(date(2026, 10, 30), date(2026, 11, 18))), 13)   # the historian's 11/02 .. 11/18
        self.assertEqual(s(date(2026, 10, 30), date(2026, 11, 18)), hd.DAYS)
        self.assertEqual(len(s(date(2026, 11, 2), date(2026, 11, 18))), 12)    # a 14:43 buy on 11/2: checks 11/3 .. 11/18
        self.assertEqual(s(date(2026, 11, 4), date(2026, 11, 18))[0], date(2026, 11, 5))
        self.assertEqual(len(s(date(2026, 11, 4), date(2026, 11, 18))), 10)

    def test_holiday_skipped(self):
        self.assertEqual(goal_odds.sessions_after(date(2026, 11, 25), date(2026, 11, 30)), [date(2026, 11, 27), date(2026, 11, 30)])


class Exits(unittest.TestCase):
    def test_goal_stop_and_time_exit(self):
        m = np.array([[1.2, 1.5, 0.4],    # goal first (equity 1000 - 100 + 150 = 1050)
                      [0.8, 0.45, 2.0],   # stop first at 0.45
                      [0.9, 0.7, 0.6]])   # neither: the last check
        final, mult, reached, stopped = goal_odds.goal_exit(m, 1000.0, 100.0, 1050.0, 0.5)
        self.assertEqual(mult.tolist(), [1.5, 0.45, 0.6])
        self.assertEqual(reached.tolist(), [True, False, False])
        self.assertEqual(stopped.tolist(), [False, True, False])
        self.assertAlmostEqual(final[1], 945.0)
        _, mult, reached, stopped = goal_odds.goal_exit(m, 1000.0, 100.0, 1050.0, None)
        self.assertEqual((mult.tolist(), reached.tolist(), stopped.any()), ([1.5, 2.0, 0.6], [True, True, False], False))


@unittest.skipUnless(HAVE_CACHE, f'historian cache missing: {hd.CACHE}/paths13.csv')
class Historian1101(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.P = hd.load_paths()
        cls.res = goal_odds.model(**H1101, n_boot=200, P=cls.P, sensitivity=False)

    def test_functions_match_the_historian(self):
        P, r, steps = self.P, 0.0397, hd.DAYS
        for mode in ('vol', 'raw', 'volrf'):
            mine = goal_odds.scaled(P, 13, 19.42, 28.50, r, mode)
            theirs = hd.scaled(P, mode)
            for a, b in zip(mine, theirs):
                np.testing.assert_array_equal(a, b)
        for sym, und, S0, K, bid, ask, iv0 in hd.CONTRACTS:
            for ivm in ('index', 'const'):
                mine, _ = goal_odds.values(P, und, S0, K, bid, ask, iv0, date(2026, 10, 30), hd.EXPIRY, steps, 19.42, 28.50, r, ivm)
                theirs, _ = hd.values(P, und, S0, K, bid, ask, iv0, ivm)
                np.testing.assert_array_equal(mine, theirs)

    def test_goal_exit_matches_the_historians_goal_path(self):
        m, _ = hd.values(self.P, 'SPY', 755.72, 770, 7.37, 7.47, 0.1351, 'index')
        cost = 747.0
        eq = 1917.92 - cost + cost * m
        hit = (eq >= 2200).any(1)
        final = np.where(hit, eq[np.arange(len(eq)), np.argmax(eq >= 2200, axis=1)], eq[:, -1])
        mine, _, reached, _ = goal_odds.goal_exit(m, 1917.92, cost, 2200.0, None)
        np.testing.assert_array_equal(mine, final)
        np.testing.assert_array_equal(reached, hit)

    def test_reproduces_the_published_numbers(self):
        # call_double_out.txt: GOAL 1 x SPY261130C00770000 [ALL 1990-2026]: P($2,200) 52.4% CI 50%-55%; P(ahead of SPY) 54.2%;
        # mean final $1,926; median $2,209; P(final < $1,600) 37.5%. CASH: P(ahead of SPY) 15.2%. EV/$ H 1.046.
        res = self.res
        self.assertEqual((res['n'], res['n_paths']), (13, 9263))
        g, c = res['exits']['goal'], res['exits']['cash']
        self.assertTrue(0.47 <= g['p_goal'] <= 0.57, g['p_goal'])
        self.assertTrue(0.49 <= g['p_ahead'] <= 0.60, g['p_ahead'])
        self.assertAlmostEqual(g['p_goal'], 0.524, delta=0.0006)
        self.assertAlmostEqual(g['p_ahead'], 0.542, delta=0.0006)
        self.assertAlmostEqual(g['p_below'], 0.375, delta=0.0006)
        self.assertAlmostEqual(g['mean'], 1926, delta=0.6)
        self.assertAlmostEqual(g['median'], 2209, delta=0.6)
        self.assertAlmostEqual(res['ev_hold'], 1.046, delta=0.0006)
        self.assertAlmostEqual(c['p_ahead'], 0.152, delta=0.0006)
        self.assertEqual((c['p_goal'], c['p_below']), (0.0, 0.0))
        self.assertAlmostEqual(c['mean'], 1917.92, places=6)
        lo, hi = g['ci']['p_goal']
        self.assertTrue(0.48 < lo < g['p_goal'] < hi < 0.57, (lo, hi))

    def test_stop_matches_the_red_team(self):
        # playbook: the -50% stop costs about 4 points of goal odds and cuts a 75%+ loss from about 1 in 4 to 3%
        g, s = self.res['exits']['goal'], self.res['exits']['goal_stop']
        self.assertTrue(0.02 <= g['p_goal'] - s['p_goal'] <= 0.07, (g['p_goal'], s['p_goal']))
        self.assertTrue(0.20 <= g['p_loss75'] <= 0.30 and s['p_loss75'] <= 0.04, (g['p_loss75'], s['p_loss75']))
        self.assertGreater(s['p_stopped'], 0)

    def test_entry_on_monday_is_within_the_bands(self):
        # the same quote treated as a Monday 11/2 entry (12 sessions, 11/3 .. 11/18) stays inside the published bands
        res = goal_odds.model(**dict(H1101, entry=date(2026, 11, 2)), n_boot=0, P=self.P, sensitivity=False)
        g = res['exits']['goal']
        self.assertEqual(res['n'], 12)
        self.assertTrue(0.47 <= g['p_goal'] <= 0.57 and 0.49 <= g['p_ahead'] <= 0.60, (g['p_goal'], g['p_ahead']))

    def test_cli(self):
        args = ['--underlying', 'SPY', '--entry-date', '2026-10-30', '--end-date', '2026-11-18', '--spot', '755.72', '--strike', '770',
                '--expiry', '2026-11-30', '--bid', '7.37', '--ask', '7.47', '--iv', '0.1351', '--vix', '19.42', '--equity', '1917.92',
                '--spy-bench-equity', '1970.94', '--goal', '2200', '--stop', '0.5', '--irx', '3.97', '--boot', '50']
        r = subprocess.run([sys.executable, '-I', str(SCRIPT), *args], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn('13 sessions 11/02 .. 11/18', r.stdout)
        line = next(x for x in r.stdout.splitlines() if x.strip().startswith('P($2,200 at a 14:43 check)'))
        self.assertIn('52.4%', line)
        bad = subprocess.run([sys.executable, '-I', str(SCRIPT), *args[:-2], '--iv', '13.51'], capture_output=True, text=True)
        self.assertNotEqual(bad.returncode, 0)
        self.assertIn('decimal', bad.stderr)


if __name__ == '__main__':
    unittest.main()
