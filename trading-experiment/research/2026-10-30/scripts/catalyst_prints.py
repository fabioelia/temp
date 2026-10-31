"""catalyst, 2026-10-30: next week's C1-universe prints (AAPL, AMD, QCOM), their pre-print RV20 and C1 IV gate, what tonight's
chains imply about the print, an INTC check of how high post-gap put IV runs, and a post-hoc ^VIX split of the C1 sample.

Run (from /home/user/temp):
  python3 -I trading-experiment/research/2026-10-30/scripts/catalyst_prints.py <data_dir> <events_csv> <spy_csv> <vix_csv> <intc_pre_chain>

  data_dir        raw downloads, fetched on first run and then re-read (Yahoo 6-month daily charts for AAPL AMD QCOM INTC ^IRX;
                  Cboe delayed chains for AAPL AMD QCOM INTC). Use a fresh dir on Mon/Tue/Wed night to get the t-1 RV20.
  events_csv      the review's per-event file (earnings_analysis.py third argument; 2,264 8-K 2.02 events).
  spy_csv         Yahoo SPY daily bars (date,...,adjclose) for the session calendar (cal5 = sessions[t+5] - t).
  vix_csv         Yahoo ^VIX daily bars (date,open,high,low,close,...).
  intc_pre_chain  Cboe INTC chain saved 2026-10-28 21:17 UTC (pre-print; INTC reported 10/29 after the close).

Print dates (verified 10/30; reaction day = next session after an after-close release):
  AAPL  Mon 11/2 after close, call 5:00 pm ET (Apple IR notice as quoted by MacTrast 10/2026; Nasdaq: 11/02 after close) -> Tue 11/3
  AMD   Tue 11/3 after close, call 5:00 pm ET (AMD press release 10/6, ir.amd.com; Nasdaq: 11/03 after close)       -> Wed 11/4
  QCOM  Wed 11/4 after close, call 1:45 pm PT (Qualcomm release, syndicated by Investing News; Nasdaq: 11/04 AMC) -> Thu 11/5
  NYSE is open on election day (11/3).

Fixed choices (written before the numbers were looked at):
  * RV20 = annualised stdev (ddof 1, sqrt 252) of the 20 daily log returns of Yahoo ADJUSTED closes ending the last close
    before the print (the review's rv_pre). Tonight only 10/30 exists, so the figure is provisional; a 'flat' projection
    rolls the window to t-1 with 0% returns for the sessions still to come. Gate = 1.3 x RV20.
  * The C1 trigger is a reaction-day price at or below 0.92 x the t-1 close; tonight's level uses the 10/30 close.
  * Ex-event IV and event sd: options_vol_gate.ex_event (OLS of IV^2*T on T over expiries on/after the reaction day,
    T <= 60 days) on tonight's chain. Expected |move| = 0.798 x event sd. Event-vol ratio = that over the median |gap| of the
    name's last 8 and last 12 events in events_csv. Chain-implied P(reaction-day close <= -8%) = normal on log price with
    sd = sqrt(event sd^2 + ex-event IV^2 / 252).
  * INTC check: 11/20 put IV at |delta| 0.30-0.45 on tonight's (reaction-day close) chain over INTC's pre-print ex-event IV
    from the 10/28 chain. options-vol's 10/29 calibration was 1.03-1.04 (GOOGL, MSFT). Expected post-gap put IV for each
    name = its ex-event IV x 1.04 (mild) and x the INTC ratio (shock).
  * Contract preview: hypothetical spot = 0.90 x the 10/30 close (a 10% gap), Black-Scholes r = ^IRX/100, q = 0, T from the
    reaction day; puts on 11/20 and 11/27 whose model |delta| is 0.30-0.45 at both IVs, with tonight's OI >= 1000. Tonight's
    bid/ask are pre-print, pre-gap quotes, shown only as references.
  * ^VIX split (POST-HOC, no verdict): the review's down-gap >= 8% sample (gap <= -0.08, ex5 and base5 present), split at the
    reaction-day ^VIX close <= 22 vs > 22 (the O011 gate; at 14:43 we would see the live value). Per cell: n, continued
    (ex5 < 0), mean abnormal 5d = -(ex5 - base5), and EV per $ from earnings_analysis.option_ratio at IV = 1.3 x rv_pre.
  * Added after the first run (before any conclusion was written): section D, the same option_ratio over the whole
    down-gap >= 8% sample at each name's k = expected put IV / flat RV20 (mild and shock), as options-vol did for INTC.
"""
import csv
import importlib.util
import json
import math
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from statistics import NormalDist

import numpy as np

TOOLKIT = Path('/home/user/temp/trading-experiment')
OVG_PATH = TOOLKIT / 'research/2026-10-29/scripts/options_vol_gate.py'
EA_PATH = TOOLKIT / 'research/strategy-review/scripts/earnings_analysis.py'
YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=6mo&includeAdjustedClose=true'
CBOE = 'https://cdn.cboe.com/api/global/delayed_quotes/options/{sym}.json'
QUOTE_DAY = date(2026, 10, 30)
PRINTS = {  # ticker: (t-1 = last pre-print session, reaction day, sessions between 10/30 and t-1)
    'AAPL': (date(2026, 11, 2), date(2026, 11, 3), 1),
    'AMD': (date(2026, 11, 3), date(2026, 11, 4), 2),
    'QCOM': (date(2026, 11, 4), date(2026, 11, 5), 3),
}
GATE_X = 1.3
MILD = 1.04
N = NormalDist()
K_BY_NAME = []  # (ticker, k mild, k shock), filled in section B, priced in section D


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def fetch(data_dir):
    sys.path.insert(0, str(TOOLKIT))
    import quotes  # noqa: E402  (toolkit HTTP client with the proxy CA set up)
    for s in ('AAPL', 'AMD', 'QCOM', 'INTC', '%5EIRX'):
        p = data_dir / f'y_{s}.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(YAHOO.format(sym=s))))
    for s in ('AAPL', 'AMD', 'QCOM', 'INTC'):
        p = data_dir / f'{s}_chain.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(CBOE.format(sym=s))))


def yahoo(path, field):
    r = json.loads(Path(path).read_text())['chart']['result'][0]
    vals = r['indicators']['adjclose'][0]['adjclose'] if field == 'adj' else r['indicators']['quote'][0]['close']
    from zoneinfo import ZoneInfo
    et = ZoneInfo('America/New_York')
    return {datetime.fromtimestamp(t, tz=timezone.utc).astimezone(et).date(): float(c)
            for t, c in zip(r['timestamp'], vals) if c}


def rv_from_returns(lr):
    return float(np.std(lr, ddof=1) * math.sqrt(252))


def read_csv_by_date(path, col):
    out = {}
    with open(path) as fh:
        for r in csv.DictReader(fh):
            try:
                out[date.fromisoformat(r['date'])] = float(r[col])
            except (ValueError, TypeError):
                pass
    return out


def main():
    data_dir, events_csv, spy_csv, vix_csv, intc_pre = (Path(a) for a in sys.argv[1:6])
    data_dir.mkdir(parents=True, exist_ok=True)
    fetch(data_dir)
    ovg = load(OVG_PATH, 'options_vol_gate')
    ea = load(EA_PATH, 'earnings_analysis')
    irx = yahoo(data_dir / 'y_%5EIRX.json', 'close')
    r = irx[max(d for d in irx if d <= QUOTE_DAY)] / 100
    print(f'r = ^IRX {max(d for d in irx if d <= QUOTE_DAY)} / 100 = {r:.4f} (Yahoo)')

    # events file: per-name history of gaps
    ev_rows = []
    with open(events_csv) as fh:
        for row in csv.DictReader(fh):
            ev_rows.append(row)

    # ---------------------------------------------------------------- INTC check (post-gap put IV / ex-event IV)
    print('\n== A. INTC: reaction-day 11/20 band-put IV over pre-print ex-event IV ==')
    nov20, nov27 = date(2026, 11, 20), date(2026, 11, 27)
    ts0, m0, r0 = ovg.load_chain(intc_pre)
    ts1, m1, r1 = ovg.load_chain(data_dir / 'INTC_chain.json')
    post_iv, band = ovg.band_put_iv(r1, nov20)
    intc_ratios = []
    for tmin in (0, 4):
        sx, E, pts = ovg.ex_event(r0, date(2026, 10, 28), date(2026, 10, 30), m0['close'], tmin=tmin)
        intc_ratios.append(post_iv / sx)
        print(f'pre chain {ts0} UTC close {m0["close"]}: ex-event IV {sx:.1%}, event sd {E:.1%} (T>={tmin}, {len(pts)} exp)')
    print(f'post chain {ts1} UTC close {m1["close"]}: 11/20 band put IV {post_iv:.1%} '
          f'({", ".join(f"{x["K"]:g}P {x["iv"]:.1%}/{x["delta"]:.2f}/OI {x["oi"]}" for x in band)})')
    shock = float(np.mean(intc_ratios))
    print(f'INTC post/ex-event ratio {min(intc_ratios):.2f}-{max(intc_ratios):.2f} (mean {shock:.2f}); '
          f'options-vol GOOGL/MSFT 1.03-1.04')
    intc_adj = yahoo(data_dir / 'y_INTC.json', 'adj')
    ds = sorted(d for d in intc_adj if d <= date(2026, 10, 29))[-21:]
    rv_intc = rv_from_returns(np.diff(np.log([intc_adj[d] for d in ds])))
    print(f'INTC RV20 {ds[0]}..{ds[-1]} (adj) {rv_intc:.1%}; post-gap put IV / RV20 = {post_iv / rv_intc:.2f}x '
          f'(gate {GATE_X}x = {GATE_X * rv_intc:.1%})')
    for x in sorted((x for x in r1 if x['exp'] == nov20 and x['cp'] == 'P' and 55 <= x['K'] <= 66), key=lambda x: x['K']):
        mid = (x['bid'] + x['ask']) / 2
        spr = (x['ask'] - x['bid']) / mid if mid > 0 else float('nan')
        print(f'  {x["sym"]} {x["bid"]:.2f}/{x["ask"]:.2f} ({spr:.0%}) IV {x["iv"]:.1%} d {x["delta"]:.2f} OI {x["oi"]}')

    # ---------------------------------------------------------------- B. next week's prints
    print('\n== B. Next week\'s prints: RV20, gate, trigger, chain-implied move ==')
    for s, (tm1, react, nflat) in PRINTS.items():
        adj = yahoo(data_dir / f'y_{s}.json', 'adj')
        cl = yahoo(data_dir / f'y_{s}.json', 'close')
        last = max(d for d in adj if d <= QUOTE_DAY)
        ds = sorted(d for d in adj if d <= last)[-21:]
        lr = np.diff(np.log([adj[d] for d in ds]))
        rv = rv_from_returns(lr)
        rv_cl = rv_from_returns(np.diff(np.log([cl[d] for d in ds])))
        rv_flat = rv_from_returns(np.concatenate([lr[nflat:], np.zeros(nflat)]))
        print(f'{s}: last close {last} {cl[last]:.2f} (Yahoo); RV20 {ds[0]}..{ds[-1]} adj {rv:.1%} (raw close {rv_cl:.1%}); '
              f'gate {GATE_X * rv:.1%}; flat-to-{tm1} RV20 {rv_flat:.1%} gate {GATE_X * rv_flat:.1%}; '
              f'8% trigger at 10/30 close: {0.92 * cl[last]:.2f} (real one = 0.92 x {tm1} close); reaction day {react}')
        ts, m, rows = ovg.load_chain(data_dir / f'{s}_chain.json')
        exs = []
        for tmin in (0, 4):
            x, E, pts = ovg.ex_event(rows, QUOTE_DAY, react, m['close'], tmin=tmin)
            exs.append((x, E))
            print(f'   chain {ts} UTC close {m["close"]}: ex-event IV {x:.1%}, event sd {E:.1%}, exp |move| {0.798 * E:.1%} '
                  f'(T>={tmin}); ATM by expiry ' + ', '.join(f'{T}d {iv:.0%}' for T, iv in pts[:6]))
        x, E = exs[0]
        mine = [rw for rw in ev_rows if rw['ticker'] == s]
        gaps = [float(rw['gap']) for rw in mine]
        last8 = float(np.median(np.abs(gaps[-8:])))
        last12 = float(np.median(np.abs(gaps[-12:])))
        sd_day = math.sqrt(E ** 2 + x ** 2 / 252)
        p8 = N.cdf(math.log(0.92) / sd_day)
        d8_all = sum(g <= -0.08 for g in gaps)
        d8_12 = sum(g <= -0.08 for g in gaps[-12:])
        print(f'   history ({mine[0]["react_date"]}..{mine[-1]["react_date"]}, n {len(gaps)}): median |gap| last 8 '
              f'{last8:.1%}, last 12 {last12:.1%}; event-vol ratio {0.798 * E / last8:.2f} (8) / {0.798 * E / last12:.2f} (12); '
              f'down gaps <= -8%: {d8_all}/{len(gaps)} all, {d8_12}/12 last 12; last 12 gaps: '
              + ' '.join(f'{g:+.1%}' for g in gaps[-12:]))
        print(f'   chain-implied P(reaction-day <= -8%) {p8:.1%} (normal, sd {sd_day:.1%})')
        exp_mild, exp_shock = x * MILD, x * shock
        K_BY_NAME.append((s, exp_mild / rv_flat, exp_shock / rv_flat))
        cap = GATE_X * rv_flat
        print(f'   expected post-gap 11/20 put IV: mild {exp_mild:.1%}, INTC-shock {exp_shock:.1%} vs cap {cap:.1%} '
              f'(flat RV20) -> mild {"passes" if exp_mild <= cap else "FAILS"}, shock {"passes" if exp_shock <= cap else "FAILS"}')
        for gap in (0.92, 0.90, 0.88):  # 0.92 and 0.88 added after the first run (strike map for the trigger text)
            S = gap * cl[last]
            for exp in (nov20, nov27):
                T = (exp - react).days / 365
                for q in sorted((q for q in rows if q['exp'] == exp and q['cp'] == 'P' and 0.80 * S <= q['K'] <= S),
                                key=lambda q: q['K']):
                    pm, dm = ovg.bs_put(S, q['K'], T, exp_mild, r)
                    ps, dsh = ovg.bs_put(S, q['K'], T, exp_shock, r)
                    if not (0.30 <= -dm <= 0.45 and 0.30 <= -dsh <= 0.45) or q['oi'] < 1000:
                        continue
                    print(f'   {q["sym"]} OI {q["oi"]} tonight {q["bid"]:.2f}/{q["ask"]:.2f} | @S {S:.2f} ({gap - 1:+.0%}), '
                          f'T {(exp - react).days}d: mild {pm:.2f} d {dm:.2f}; shock {ps:.2f} d {dsh:.2f}')

    # ---------------------------------------------------------------- C. VIX split (post-hoc)
    print('\n== C. POST-HOC: C1 down-gap >= 8% sample split by reaction-day ^VIX close ==')
    spy = read_csv_by_date(spy_csv, 'adjclose')
    sessions = sorted(spy)
    pos = {d: i for i, d in enumerate(sessions)}
    vix = read_csv_by_date(vix_csv, 'close')
    sample = []
    for rw in ev_rows:
        try:
            g, ret5, rvp, ex5, b5 = (float(rw[k]) for k in ('gap', 'ret5', 'rv_pre', 'ex5', 'base5'))
        except (ValueError, TypeError):
            continue
        if not all(math.isfinite(v) for v in (g, ret5, rvp, ex5, b5)) or g > -0.08:
            continue
        d = date.fromisoformat(rw['react_date'])
        i = pos.get(d)
        if i is None or i + 5 >= len(sessions) or d not in vix:
            continue
        sample.append({'tk': rw['ticker'], 'd': d, 'ret5': ret5, 'rv': rvp, 'ex5': ex5, 'b5': b5,
                       'cal5': (sessions[i + 5] - d).days, 'vix': vix[d]})
    print(f'n {len(sample)} (review: 216); median VIX {np.median([e["vix"] for e in sample]):.1f}')

    def cell(evs, label):
        if not evs:
            print(f'{label}: n 0')
            return
        ret = np.array([e['ret5'] for e in evs])
        cal = np.array([e['cal5'] for e in evs])
        iv = GATE_X * np.array([e['rv'] for e in evs])
        rat = ea.option_ratio(ret, cal, 25, 0.35, iv, iv, np.zeros(len(evs), bool))
        ab = np.array([-(e['ex5'] - e['b5']) for e in evs])
        cont = np.mean([e['ex5'] < 0 for e in evs])
        _, tcl = ea.cluster_t(ab, [(e['d'].year, e['d'].month) for e in evs])
        print(f'{label}: n {len(evs)}, continued {cont:.0%}, abnormal 5d {ab.mean():+.2%} (t_cl {tcl:.1f}), '
              f'put EV/$ {rat.mean():.2f} (median {np.median(rat):.2f}, wins {np.mean(rat > 1):.0%})')

    # D. EV per $ at each name's expected k = expected put IV / flat RV20 (the review's model, whole sample, no skew)
    print('\n== D. EV per $ of the C1 put at k = expected IV / RV20 (option_ratio, n 216, 25 DTE, delta 0.35) ==')
    ret = np.array([e['ret5'] for e in sample])
    cal = np.array([e['cal5'] for e in sample])
    rvs = np.array([e['rv'] for e in sample])
    for s, k_m, k_s in K_BY_NAME:
        out = []
        for k in (k_m, k_s):
            rat = ea.option_ratio(ret, cal, 25, 0.35, k * rvs, k * rvs, np.zeros(len(sample), bool))
            out.append(f'k {k:.2f}: EV {rat.mean():.2f}')
        print(f'{s}: mild ' + out[0] + '; shock ' + out[1])

    cell(sample, 'all')
    cell([e for e in sample if e['vix'] <= 22], 'VIX <= 22')
    cell([e for e in sample if e['vix'] > 22], 'VIX > 22')
    cell([e for e in sample if e['vix'] > 22 and e['d'].year >= 2010], 'VIX > 22, 2010-26')
    cell([e for e in sample if e['vix'] <= 22 and e['d'].year >= 2010], 'VIX <= 22, 2010-26')


if __name__ == '__main__':
    main()
