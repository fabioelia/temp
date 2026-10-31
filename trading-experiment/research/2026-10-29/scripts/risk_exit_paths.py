"""risk, 2026-10-29. POST-HOC, descriptive (no verdicts): the C1 down-gap >= 8% put (n 216) under daily-close exit rules vs
the review's hold-5 model, plus the "close below the reaction-day open" filter.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-10-29/scripts/risk_exit_paths.py <review_cache> <events_csv>
  review_cache: the earnings_analysis.py cache (contains yahoo/<TICKER>.json); events_csv: its per-event output.

Model: earnings_analysis.py's own bs()/strike_for_delta() (r 0, no skew), delta 0.35, 25 DTE, IV = k x rv_pre held flat,
half-spread 1.5% each way, entry at the reaction-day close, exits at daily closes only (a resting GTC that fills intraday is
NOT modelled: a target is credited at exactly its level when a close is at or above it). k 1.3 = the C1 gate; k 1.0 ~ the
options-vol expected INTC entry IV (54% / RV20 54.3%).
"""
import csv, json, math, sys, importlib.util
from datetime import date, datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
import numpy as np

EA = Path('/home/user/temp/trading-experiment/research/strategy-review/scripts/earnings_analysis.py')
spec = importlib.util.spec_from_file_location('ea', EA); ea = importlib.util.module_from_spec(spec); spec.loader.exec_module(ea)
ET = ZoneInfo('America/New_York'); HS = 0.015
cache, evcsv = Path(sys.argv[1]), Path(sys.argv[2])
spy = ea.load_prices(cache, 'SPY'); sessions = sorted(d for d in spy if d >= date(2004, 11, 1)); pos = {d: i for i, d in enumerate(sessions)}
px = {}
def prices(tk):
    if tk not in px:
        m = ea.load_prices(cache, tk); px[tk] = np.array([m.get(d, np.nan) for d in sessions])
    return px[tk]
evs = []
for r in csv.DictReader(open(evcsv)):  # same sample filter as summarise(): gap, rv_pre, ex5, base5 finite; gap <= -8%
    try:
        g, rv, ex5, b5 = float(r['gap']), float(r['rv_pre']), float(r['ex5']), float(r['base5'])
    except ValueError:
        continue
    if not all(math.isfinite(v) for v in (g, rv, ex5, b5)) or g > -0.08:
        continue
    d = date.fromisoformat(r['react_date']); i = pos[d]
    if i + 5 >= len(sessions):
        continue
    p = prices(r['ticker'])
    evs.append((r['ticker'], d, rv, p[i:i + 6] / p[i], np.array([(sessions[i + j] - d).days for j in range(6)])))

RULES = {  # (stop at value <= 0.5, thesis stop S/S0 >= x, target value, stop-to-cost after a +40% close)
    'hold 5': (False, None, None, False), '-50% stop': (True, None, None, False), 'thesis 1.07x': (False, 1.07, None, False),
    'thesis 1.04x + -50%': (True, 1.04, None, False), 'target +100%': (False, None, 2.0, False),
    'target +50%': (False, None, 1.5, False), 'playbook (+50%, -50%, cost, 1.07x)': (True, 1.07, 1.5, True)}

def run(k, rule):
    stop, th, tgt, cost = RULES[rule]; out = []
    for tk, d, rv, path, cal in evs:
        iv = k * rv; T0 = 25 / 365
        K = float(ea.strike_for_delta(0.35, T0, iv, False)); p0 = float(ea.bs(1.0, K, T0, iv, False)) * (1 + HS)
        val = [float(ea.bs(path[j], K, (25 - cal[j]) / 365, iv, False)) * (1 - HS) / p0 for j in range(6)]
        x, armed = val[5], False
        for j in range(1, 6):
            v, s = val[j], path[j]
            if (stop and v <= 0.5) or (th and s >= th) or (armed and v <= 1.0): x = v; break
            if tgt and v >= tgt: x = tgt; break
            if cost and v >= 1.4: armed = True
        out.append(x)
    return np.array(out)

print(f'n {len(evs)}')
for k in (1.3, 1.0):
    for rule in RULES:
        a = run(k, rule); print(f'k {k}  {rule:36} EV {a.mean():.3f}  median {np.median(a):.2f}  win {(a > 1).mean():.0%}')
# filter: reaction-day close below its open (raw Yahoo open/close)
oc = {}
for tk in {e[0] for e in evs}:
    res = json.loads((cache / 'yahoo' / f'{tk}.json').read_text())['chart']['result'][0]; q = res['indicators']['quote'][0]
    for t, o, c in zip(res['timestamp'], q['open'], q['close']):
        if o and c:
            oc[(tk, datetime.fromtimestamp(t, tz=timezone.utc).astimezone(ET).date())] = c / o
h13, h10 = run(1.3, 'hold 5'), run(1.0, 'hold 5')
for below in (True, False):
    idx = np.array([i for i, e in enumerate(evs) if (e[0], e[1]) in oc and (oc[(e[0], e[1])] < 1) == below])
    print(f'close<open {below}: n {len(idx)}, EV hold k1.3 {h13[idx].mean():.3f}, k1.0 {h10[idx].mean():.3f}')
# one-session gap-through: share of C1 puts (21 DTE, delta 0.38, 5% spread) worth <= 0.274 of cost (-72.6%, the $300 shot's
# room to the $1,700 pause line) or <= 0.50 after the first close; plus INTC's own events and the >= 15% gaps (raw 5d return)
for k in (1.3, 1.0):
    v = []
    for tk, d, rv, path, cal in evs:
        iv = k * rv; K = float(ea.strike_for_delta(0.38, 21 / 365, iv, False)); p0 = float(ea.bs(1.0, K, 21 / 365, iv, False)) * 1.025
        v.append(float(ea.bs(path[1], K, (21 - cal[1]) / 365, iv, False)) * 0.975 / p0)
    v = np.array(v); print(f'k {k} day-1: <=0.274 {(v <= 0.274).mean():.1%}, <=0.50 {(v <= 0.5).mean():.1%}, min {v.min():.2f}')
intc = [e for e in evs if e[0] == 'INTC']; big = [e for e in evs if e[3][0] == 1 and prices(e[0])[pos[e[1]] - 1] / prices(e[0])[pos[e[1]]] >= 1 / 0.85]
print(f'INTC down >= 8%: {sum(e[3][5] < 1 for e in intc)}/{len(intc)} lower after 5 sessions; '
      f'all names gap <= -15%: {sum(e[3][5] < 1 for e in big)}/{len(big)}')
