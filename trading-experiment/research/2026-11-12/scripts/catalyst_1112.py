"""catalyst, 2026-11-12 (Thu night, Run B): the CSCO C1 check for Fri 11/13 14:43 and the NVDA shadow for Wed 11/18.

Copy of catalyst_1111.py + extra_1111.py. Changed: date, equity $1,389.81 (brief), SGOV reserve 2.636818 x 100.53 = $265.08
(brief), CSCO's pre-print window is now complete (t-1 = 11/12 = today, 0 flat sessions, so the IV gate is FINAL tonight),
NVDA has 3 sessions left to its t-1 (11/13, 11/16, 11/17). Both names: the 12/18 monthly only (the weeklies' OI is printed
for the re-check).

Added tonight (R1, adopted 11/11: every option thesis states two numbers), fixed before the numbers were looked at:
  * Break-even probability vs the estimated one, on the same 216 C1 payoffs sizing.py uses (catalyst_watch.Payoffs) at the
    contract's DTE and k = IV / RV20: estimated = share of events whose per-$ payoff > 1; break-even = L / (W + L), with
    W = mean gain per $ on the winners and L = mean loss per $ on the losers (the win rate at which EV = 1 with these sizes).
    The model is the session-5 time exit (no -50% backstop), as in sizing.c1_payoffs.
  * Drift-matched baseline: what holding the underlying for the same 5 sessions earned in the same 216 events (mean and
    median ret5, c1_vix_split.build_rows) next to the unconditional drift for those names and years (SPY 5-day + the name's
    same-year mean 5-day excess, i.e. spy5 + base5).

Run (from /home/user/temp):  python3 -I <this> <data_dir> <earnings_cache>
"""
import csv
import importlib.util
import json
import math
import sys
from datetime import date
from pathlib import Path

import numpy as np

TOOLKIT = Path('/home/user/temp/trading-experiment')
CW_PATH = TOOLKIT / 'research/2026-11-01/scripts/catalyst_watch.py'
OVG_PATH = TOOLKIT / 'research/2026-10-29/scripts/options_vol_gate.py'
SIZING_PATH = TOOLKIT / 'research/strategy-review/scripts/sizing.py'
YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1d&range=6mo&includeAdjustedClose=true'
CBOE = 'https://cdn.cboe.com/api/global/delayed_quotes/options/{sym}.json'
TODAY = date(2026, 11, 12)
EQUITY = 1389.81
SGOV = 2.636818 * 100.53
GATE_X = 1.3
MILD, SHOCK = 1.04, 1.21
KGRID = (0.80, 0.90, 1.0, 1.10, 1.20, 1.30)
# name: (t-1, reaction day, flat sessions to t-1, contract expiry, weeklies to re-check)
NAMES = {
    'CSCO': (date(2026, 11, 12), date(2026, 11, 13), 0, date(2026, 12, 18),
             (date(2026, 11, 27), date(2026, 12, 4), date(2026, 12, 11))),
    'NVDA': (date(2026, 11, 17), date(2026, 11, 18), 3, date(2026, 12, 18), (date(2026, 12, 4), date(2026, 12, 11))),
}


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def fetch(d):
    sys.path.insert(0, str(TOOLKIT))
    import quotes  # noqa: E402
    for s in list(NAMES) + ['%5EIRX']:
        p = d / f'y_{s}.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(YAHOO.format(sym=s))))
    for s in NAMES:
        p = d / f'{s}_chain.json'
        if not p.exists():
            p.write_text(json.dumps(quotes.get_json(CBOE.format(sym=s))))


def history(cache, sym):
    g = []
    with open(Path(cache) / 'events.csv') as fh:
        for row in csv.DictReader(fh):
            if row['ticker'] == sym:
                try:
                    g.append((row['react_date'], float(row['gap'])))
                except (TypeError, ValueError):
                    pass
    return len(g), [x for x in g if x[1] <= -0.08]


def r1_numbers(pay, k, dte):
    p = pay(k, dte=dte)
    p = p[~np.isnan(p)]
    win = p > 1
    W = float(np.mean(p[win] - 1)) if win.any() else float('nan')
    L = float(np.mean(1 - p[~win])) if (~win).any() else float('nan')
    return len(p), float(win.mean()), L / (W + L), W, L, float(np.mean(p))


def baseline(cache):
    sys.path.insert(0, str(TOOLKIT / 'research/strategy-review/scripts'))
    sys.path.insert(0, str(TOOLKIT / 'research/2026-10-30/scripts'))
    from c1_vix_split import build_rows
    rows = [r for r in build_rows(Path(cache)) if r['gap'] <= -0.08]
    ok = [r for r in rows if not any(math.isnan(r.get(k, float('nan'))) for k in ('ret5', 'cal5', 'rv_pre'))]
    ret = np.array([r['ret5'] for r in ok])
    spy = np.array([r['spy5'] for r in ok])
    unc = np.array([r['spy5'] + r['base5'] for r in ok if not math.isnan(r['base5'])])
    uncs = np.array([r['base5'] for r in ok if not math.isnan(r['base5'])])
    sp5 = np.array([r['spy5'] for r in ok if not math.isnan(r['base5'])])
    print(f'\nDRIFT-MATCHED BASELINE (same {len(ok)} C1 events, close t -> close t+5): holding the stock mean ret5 '
          f'{ret.mean():+.2%}, median {np.median(ret):+.2%}, share down {np.mean(ret < 0):.0%}; SPY same days {spy.mean():+.2%}; '
          f'stock - SPY {np.mean(ret - spy):+.2%}')
    print(f'  unconditional 5-session drift for the same names/years (spy5 + base5, n {len(unc)}): {unc.mean():+.2%} '
          f'(SPY part {sp5.mean():+.2%}, name excess {uncs.mean():+.2%})')
    return ret


def main():
    d, cache = Path(sys.argv[1]), Path(sys.argv[2])
    d.mkdir(parents=True, exist_ok=True)
    fetch(d)
    cw, ovg, sizing = load(CW_PATH, 'cw'), load(OVG_PATH, 'ovg'), load(SIZING_PATH, 'sizing')
    pay = cw.Payoffs(sizing, cache)
    irx = cw.yahoo(d / 'y_%5EIRX.json', 'close')
    r = irx[max(x for x in irx if x <= TODAY)] / 100
    print(f'r = ^IRX {max(x for x in irx if x <= TODAY)} / 100 = {r:.4f}; equity ${EQUITY:,.2f}; SGOV reserve ${SGOV:,.2f}')
    baseline(cache)

    for sym, (pre, react, nflat, exp, weeklies) in NAMES.items():
        a, c = cw.yahoo(d / f'y_{sym}.json', 'adj'), cw.yahoo(d / f'y_{sym}.json', 'close')
        assert max(c) == TODAY, f'Yahoo {sym} last bar {max(c)}'
        ds = sorted(x for x in a if x <= TODAY)[-21:]
        lr = np.diff(np.log([a[x] for x in ds]))
        rv20 = cw.rv(lr)
        rv_flat = cw.rv(np.concatenate([lr[nflat:], np.zeros(nflat)]))
        S0 = c[TODAY]
        n, down = history(cache, sym)
        print(f'\n######## {sym}: t-1 {pre}, reaction {react}; close {TODAY} {S0:.2f} (Yahoo), prior {c[ds[-2]]:.2f} '
              f'({S0 / c[ds[-2]] - 1:+.2%}); LINE 0.92 x {S0:.2f} = {0.92 * S0:.2f}')
        print(f'history: {len(down)}/{n} events with gap <= -8% ({len(down) / n:.1%}); last three: {down[-3:]}')
        print(f'RV20 {ds[0]}..{ds[-1]} = {rv20:.2%}; flat roll to {pre} ({nflat} sessions) = {rv_flat:.2%}; IV cap 1.3x = '
              f'{GATE_X * rv20:.1%} now, {GATE_X * rv_flat:.1%} flat')
        if nflat:
            for lab, add in (('+/-2% days', [0.02, -0.02, 0.0]), ('+/-4% days', [0.04, -0.04, 0.0]), ('three -3% days', [-0.03] * 3)):
                rv = cw.rv(np.concatenate([lr[nflat:], np.log(1 + np.array(add[:nflat]))]))
                print(f'  RV20 to {pre} with {lab}: {rv:.2%} -> cap {GATE_X * rv:.1%}')

        raw = json.loads((d / f'{sym}_chain.json').read_text())
        nraw = len(raw['data']['options'])
        raw['data']['options'] = [o for o in raw['data']['options'] if ovg.OCC.match(o['option'])]
        (d / f'{sym}_chain_std.json').write_text(json.dumps(raw))
        ts, meta, rows = ovg.load_chain(d / f'{sym}_chain_std.json')
        print(f'Cboe chain {ts} UTC; close {meta.get("close")}, iv30 {meta.get("iv30")}; rows {len(rows)} '
              f'(dropped {nraw - len(raw["data"]["options"])} non-OCC)')
        ex, E, pts = ovg.ex_event(rows, TODAY, react, meta['close'], tmin=0)
        print(f'ex-event IV {ex:.1%}, event sd {E:.1%}; post-gap guess {ex * MILD:.1%} (x1.04) to {ex * SHOCK:.1%} (x1.21); '
              f'k {ex * MILD / rv_flat:.2f}-{ex * SHOCK / rv_flat:.2f}; term ' + ', '.join(f'{t}d {v:.1%}' for t, v in pts[:6]))
        for w in weeklies:
            ws = [x for x in rows if x['exp'] == w and x['cp'] == 'P' and 0.75 * S0 <= x['K'] <= 1.0 * S0]
            print(f'  weekly {w} puts 75-100% of spot: max OI {max((x["oi"] for x in ws), default=0)} over {len(ws)} strikes')

        dte = (exp - react).days
        T = dte / 365
        print(f'\n-- {sym} {exp} puts ({dte} DTE from {react}); tonight\'s (pre-print) quotes, |delta| 0.30-0.45 marked --')
        puts = sorted((x for x in rows if x['exp'] == exp and x['cp'] == 'P' and 0.75 * S0 <= x['K'] <= 1.02 * S0),
                      key=lambda x: x['K'])
        for x in puts:
            mid = (x['bid'] + x['ask']) / 2
            if not mid:
                continue
            print(f'  {x["sym"]} {x["bid"]:.2f}/{x["ask"]:.2f} ({(x["ask"] - x["bid"]) / mid:.1%}) IV {x["iv"]:.1%} '
                  f'({x["iv"] / rv_flat:.2f}x) d {x["delta"]:+.2f} OI {x["oi"]}' + ('  <- band' if 0.30 <= -x['delta'] <= 0.45 else ''))
        print(f'  ask ceiling min(full Kelly, SGOV ${SGOV:.2f}) / 100 at {dte} DTE: ' + '; '.join(
            f'k{k:.2f} {min(sizing.kelly(pay(k, dte=dte)) * EQUITY, SGOV) / 100:.2f}'
            f'{"*" if sizing.kelly(pay(k, dte=dte)) * EQUITY > SGOV else ""}' for k in (0.80, 0.85, 0.90, 0.95, 1.0, 1.05, 1.10, 1.15,
                                                                                   1.20, 1.25, 1.30)) + '  (* = SGOV binds)')
        print(f'  R1 at {dte} DTE (n, P(win) est, P(win) break-even, mean gain W, mean loss L, EV per $):')
        for k in KGRID:
            nn, pw, pbe, W, L, ev = r1_numbers(pay, k, dte)
            print(f'    k {k:.2f}: n {nn}, est {pw:.1%} vs break-even {pbe:.1%}; W {W:+.1%}, L -{L:.1%}; EV {ev:.3f}')
        strikes = sorted({x['K'] for x in rows if x['exp'] == exp and x['cp'] == 'P'})
        oi = {x['K']: x['oi'] for x in rows if x['exp'] == exp and x['cp'] == 'P'}
        for g in (0.92, 0.90, 0.88, 0.85):
            S, best = g * S0, None
            for iv in np.arange(0.10, GATE_X * rv_flat + 1e-9, 0.0025):
                f = min(sizing.kelly(pay(iv / rv_flat, dte=dte)) * EQUITY, SGOV)
                for K in strikes:
                    px, dl = ovg.bs_put(S, K, T, iv, r)
                    if 0.30 <= -dl <= 0.45 and f >= 102.5 * px:
                        best = (iv, K, px * 1.025, f, oi.get(K, 0), dl)
                        break
            print(f'  fit (min(full Kelly, SGOV)) S {S:.2f} ({g - 1:+.0%}): ' + (
                f'IV <= {best[0]:.1%} ({best[0] / rv_flat:.2f}x), {best[1]:g}P ask~{best[2]:.2f} d{best[5]:+.2f}, budget '
                f'${best[3]:,.0f}, OI tonight {best[4]}' if best else 'none'))
            out = []
            for iv in (ex * MILD, ex * SHOCK):
                band = [(K, *ovg.bs_put(S, K, T, iv, r)) for K in strikes if K >= 0.7 * S]
                band = [(K, px * 1.025, dl) for K, px, dl in band if 0.30 <= -dl <= 0.45]
                fk = min(sizing.kelly(pay(iv / rv_flat, dte=dte)) * EQUITY, SGOV)
                if band:
                    K, ask, dl = min(band, key=lambda z: z[1])
                    out.append(f'IV {iv:.1%} ({iv / rv_flat:.2f}x): cheapest band {K:g}P ~{ask:.2f} d{dl:+.2f} OI {oi.get(K, 0)} '
                               f'vs budget ${fk:,.0f} -> ' + ('FITS' if fk >= 100 * ask else 'no'))
            print('      at the guessed IVs: ' + '; '.join(out))


if __name__ == '__main__':
    main()
