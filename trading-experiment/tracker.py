#!/usr/bin/env python3
"""Paper-trading ledger, rules engine and reporter (stdlib only).

Protocol (see RULES.md):
  * Orders are queued AFTER a session closes (`order add`).
  * They fill at the NEXT session's official close +/- slippage (`day`).
  * `day` also records closing marks, books equity, auto-queues stop exits and
    rewrites STATUS.md and data/dashboard.json.

Main entry points:
  tracker.py order add --ticker NVDA --side buy --usd 500 --tier A --stop 170 --thesis "..."
  tracker.py day --date 2026-10-19 --prices-file prices.csv      # ticker,close,source
  tracker.py status | validate | report | order list | order cancel O001
"""
import argparse
import csv
import json
import math
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
CFG = json.loads((ROOT / "config.json").read_text())

LEDGER = DATA / "ledger.csv"
ORDERS = DATA / "orders.csv"
MARKS = DATA / "marks.csv"
EQUITY = DATA / "equity.csv"
EXITS = DATA / "exits.json"
STATUS_MD = ROOT / "STATUS.md"
DASH_JSON = DATA / "dashboard.json"

LEDGER_COLS = ["id", "date", "ticker", "side", "qty", "close_price", "fill_price", "gross", "fees",
               "cash_delta", "tier", "slip_bps", "order_id", "thesis", "price_source"]
ORDER_COLS = ["id", "created", "ticker", "side", "size_type", "size_value", "tier", "max_price",
              "min_price", "stop", "target", "stop_pct", "target_pct", "priority", "gtd", "status", "filled_date", "reason", "thesis"]
MARK_COLS = ["date", "ticker", "close", "source"]
EQUITY_COLS = ["date", "cash", "positions_value", "equity", "pnl", "pnl_pct", "fees_cum", "slippage_cum",
               "realized", "unrealized", "trades_today", "bench_close", "bench_value"]

HOLIDAYS = {date.fromisoformat(x) for x in CFG["holidays"]}
FEES = CFG["fees"]


# ---------------------------------------------------------------- helpers
def d(s):
    return date.fromisoformat(s) if isinstance(s, str) else s


def is_trading_day(x):
    return x.weekday() < 5 and x not in HOLIDAYS


def next_trading_day(x):
    x += timedelta(days=1)
    while not is_trading_day(x):
        x += timedelta(days=1)
    return x


def trading_days_after(x, end):
    """Trading days in (x, end]."""
    n, cur = 0, x
    while cur < end:
        cur += timedelta(days=1)
        if is_trading_day(cur):
            n += 1
    return n


def read_csv(path):
    if not path.exists():
        return []
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path, cols, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in rows:
            w.writerow({c: r.get(c, "") for c in cols})


def load_exits():
    return json.loads(EXITS.read_text()) if EXITS.exists() else {}


def save_exits(x):
    EXITS.write_text(json.dumps(x, indent=2, sort_keys=True) + "\n")


def floor6(x):
    return math.floor(x * 1e6 + 1e-9) / 1e6


def fnum(x, default=None):
    return float(x) if x not in ("", None) else default


def calc_fees(side, qty, price):
    notional = qty * price
    f = FEES["commission_per_order"] + FEES["cat_per_share"] * qty
    if side == "sell":
        if notional > FEES.get("sec_waived_if_sale_usd_le", 0):
            f += FEES["sec_per_million_sold"] * notional / 1e6
        if qty > FEES.get("taf_waived_if_shares_le", 0):
            f += min(FEES["finra_taf_per_share_sold"] * qty, FEES["finra_taf_max_per_trade"])
    if f > 0 and FEES["round_up_to_cent"]:
        f = math.ceil(f * 100 - 1e-9) / 100
    return round(f, 4)


def money(x):
    return f"-${abs(x):,.2f}" if x < 0 else f"${x:,.2f}"


def pct(x):
    return f"{x * 100:+.2f}%"


# ---------------------------------------------------------------- state
def replay(upto=None):
    cash = CFG["starting_cash"]
    pos, per_day, closed = {}, {}, []
    realized = fees = slip = 0.0
    for r in read_csv(LEDGER):
        if upto and r["date"] > upto:
            break
        t, q = r["ticker"], float(r["qty"])
        fp, cp, f = float(r["fill_price"]), float(r["close_price"]), float(r["fees"])
        cash += float(r["cash_delta"])
        fees += f
        slip += abs(fp - cp) * q
        per_day.setdefault(r["date"], []).append(r)
        p = pos.setdefault(t, {"qty": 0.0, "cost": 0.0, "opened": r["date"]})
        if r["side"] == "buy":
            if p["qty"] <= 1e-9:
                p["opened"] = r["date"]
            p["qty"] += q
            p["cost"] += q * fp + f
        else:
            avg = p["cost"] / p["qty"]
            pl = (q * fp - f) - avg * q
            realized += pl
            closed.append({"ticker": t, "opened": p["opened"], "closed": r["date"], "qty": q,
                           "entry": avg, "exit": fp, "pl": pl, "ret": pl / (avg * q)})
            p["cost"] -= avg * q
            p["qty"] -= q
            if p["qty"] <= 1e-6:
                del pos[t]
    return {"cash": cash, "pos": pos, "per_day": per_day, "closed": closed,
            "realized": realized, "fees": fees, "slippage": slip}


def load_marks():
    marks = {}
    for r in read_csv(MARKS):
        marks.setdefault(r["ticker"], {})[r["date"]] = (float(r["close"]), r["source"])
    return marks


def mark_on(marks, ticker, day):
    """Latest close on or before `day`; returns (price, date_of_price)."""
    series = marks.get(ticker, {})
    ds = [k for k in series if k <= day]
    if not ds:
        return None, None
    k = max(ds)
    return series[k][0], k


# ---------------------------------------------------------------- orders
def next_id(prefix, rows):
    return f"{prefix}{len(rows) + 1:03d}"


def cmd_order_add(a):
    orders = read_csv(ORDERS)
    created = d(a.created) if a.created else date.today()
    if a.tier not in CFG["slippage_bps"]:
        sys.exit(f"tier must be one of {list(CFG['slippage_bps'])}")
    sizes = [("usd", a.usd), ("qty", a.qty), ("pct", a.pct)]
    chosen = [(k, v) for k, v in sizes if v is not None]
    if a.all:
        chosen.append(("all", 1))
    if len(chosen) != 1:
        sys.exit("give exactly one of --usd/--qty/--pct/--all")
    if a.side == "buy" and chosen[0][0] not in ("usd", "qty"):
        sys.exit("buys are sized with --usd or --qty")
    if not a.thesis:
        sys.exit("--thesis is required (every order needs a written reason)")
    gtd = d(a.gtd) if a.gtd else next_trading_day(created)
    o = {"id": next_id("O", orders), "created": created.isoformat(), "ticker": a.ticker.upper(),
         "side": a.side, "size_type": chosen[0][0], "size_value": chosen[0][1], "tier": a.tier,
         "max_price": a.max_price if a.max_price is not None else "",
         "min_price": a.min_price if a.min_price is not None else "",
         "stop": a.stop if a.stop is not None else "", "target": a.target if a.target is not None else "",
         "stop_pct": a.stop_pct if a.stop_pct is not None else "",
         "target_pct": a.target_pct if a.target_pct is not None else "",
         "priority": a.priority, "gtd": gtd.isoformat(), "status": "pending", "filled_date": "",
         "reason": "", "thesis": a.thesis}
    orders.append(o)
    write_csv(ORDERS, ORDER_COLS, orders)
    print(f"queued {o['id']}: {o['side']} {o['ticker']} {o['size_type']}={o['size_value']} "
          f"(fills at close of {next_trading_day(created)} .. {gtd})")


def cmd_order_list(a):
    rows = read_csv(ORDERS)
    if a.status:
        rows = [r for r in rows if r["status"] == a.status]
    for r in rows:
        print(f"{r['id']} {r['status']:9} {r['created']} {r['side']:4} {r['ticker']:6} "
              f"{r['size_type']}={r['size_value']} tier={r['tier']} stop={r['stop'] or r.get('stop_pct', '') + '%'} "
              f"target={r['target'] or r.get('target_pct', '') + '%'} "
              f"maxpx={r['max_price']} gtd={r['gtd']} {r['reason']}")


def cmd_order_cancel(a):
    rows = read_csv(ORDERS)
    for r in rows:
        if r["id"] == a.id and r["status"] == "pending":
            r["status"], r["reason"] = "cancelled", a.reason or "cancelled"
            write_csv(ORDERS, ORDER_COLS, rows)
            print(f"cancelled {a.id}")
            return
    sys.exit(f"no pending order {a.id}")


def process_orders(D, prices, sources):
    """Fill eligible pending orders at the close of D. Returns list of messages."""
    msgs = []
    day = D.isoformat()
    orders = read_csv(ORDERS)
    ledger = read_csv(LEDGER)
    exits = load_exits()
    for o in orders:
        if o["status"] == "pending" and o["gtd"] < day:
            o["status"], o["reason"] = "expired", f"not filled by {o['gtd']}"
    elig = [o for o in orders if o["status"] == "pending" and o["created"] < day <= o["gtd"]]
    elig.sort(key=lambda o: (o["side"] != "sell", int(o["priority"]), o["id"]))
    todays = [r for r in ledger if r["date"] == day]
    n_today, touched = len(todays), {r["ticker"] for r in todays}

    def skip(o, why):
        o["status"], o["reason"] = "skipped", why
        msgs.append(f"SKIP {o['id']} {o['side']} {o['ticker']}: {why}")

    for o in elig:
        t, side = o["ticker"], o["side"]
        px = prices.get(t)
        state = replay()
        cash, held = state["cash"], state["pos"].get(t, {"qty": 0.0})["qty"]
        if px is None:
            skip(o, "no closing price supplied")
            continue
        if n_today >= CFG["max_trades_per_day"]:
            skip(o, f"daily cap of {CFG['max_trades_per_day']} fills reached")
            continue
        if t in touched:
            skip(o, "ticker already traded today (no same-day round trips)")
            continue
        slip_bps = CFG["slippage_bps"][o["tier"]]
        if side == "buy":
            if o["max_price"] and px > float(o["max_price"]):
                skip(o, f"close {px} above max_price {o['max_price']}")
                continue
            fp = round(px * (1 + slip_bps / 1e4), 4)
            usd = float(o["size_value"]) if o["size_type"] == "usd" else float(o["size_value"]) * fp
            usd = min(usd, cash)
            if usd < CFG["min_order_usd"]:
                skip(o, "insufficient cash")
                continue
            qty = floor6((usd - calc_fees("buy", usd / fp, fp)) / fp)
            while qty > 0 and round(qty * fp, 2) + calc_fees("buy", qty, fp) > cash + 1e-9:
                qty = floor6(qty - 1e-6)
            if qty <= 0:
                skip(o, "order rounds to zero shares")
                continue
        else:
            if held <= 1e-9:
                skip(o, "no position to sell (no shorting)")
                continue
            if o["min_price"] and px < float(o["min_price"]):
                skip(o, f"close {px} below min_price {o['min_price']}")
                continue
            fp = round(px * (1 - slip_bps / 1e4), 4)
            if o["size_type"] == "all":
                qty = held
            elif o["size_type"] == "pct":
                qty = floor6(held * float(o["size_value"]) / 100)
            elif o["size_type"] == "qty":
                qty = min(float(o["size_value"]), held)
            else:
                qty = min(floor6(float(o["size_value"]) / fp), held)
            if held - qty < 1e-5:
                qty = held
        fees = calc_fees(side, qty, fp)
        gross = round(qty * fp, 2)
        delta = round(-(gross + fees) if side == "buy" else gross - fees, 2)
        row = {"id": next_id("T", ledger), "date": day, "ticker": t, "side": side, "qty": f"{qty:.6f}",
               "close_price": px, "fill_price": fp, "gross": gross, "fees": fees, "cash_delta": delta,
               "tier": o["tier"], "slip_bps": slip_bps, "order_id": o["id"], "thesis": o["thesis"],
               "price_source": sources.get(t, "")}
        ledger.append(row)
        write_csv(LEDGER, LEDGER_COLS, ledger)
        n_today += 1
        touched.add(t)
        o["status"], o["filled_date"] = "filled", day
        if side == "buy" and (o["stop"] or o["target"] or o.get("stop_pct") or o.get("target_pct")):
            ex = exits.setdefault(t, {})
            if o["stop"]:
                ex["stop"] = float(o["stop"])
            elif o.get("stop_pct"):
                ex["stop"] = round(fp * (1 - float(o["stop_pct"]) / 100), 4)
            if o["target"]:
                ex["target"] = float(o["target"])
            elif o.get("target_pct"):
                ex["target"] = round(fp * (1 + float(o["target_pct"]) / 100), 4)
        msgs.append(f"FILL {row['id']} {side.upper()} {qty:.4f} {t} @ {fp} (close {px}, fees ${fees:.2f}) "
                    f"cash {money(delta)}")
    after = replay()
    for t in list(exits):
        if t not in after["pos"]:
            del exits[t]
    save_exits(exits)
    write_csv(ORDERS, ORDER_COLS, orders)
    return msgs


# ---------------------------------------------------------------- day close
def load_prices(a):
    prices, sources = {}, {}
    if a.prices_file:
        for r in read_csv(Path(a.prices_file)):
            prices[r["ticker"].upper()] = float(r["close"])
            sources[r["ticker"].upper()] = r.get("source", "")
    if a.prices:
        for kv in a.prices.split(","):
            k, v = kv.split("=")
            prices[k.strip().upper()] = float(v)
            sources.setdefault(k.strip().upper(), a.source or "")
    return prices, sources


def snapshot(D):
    day = D.isoformat()
    st = replay(day)
    marks = load_marks()
    value, unreal, stale = 0.0, 0.0, []
    for t, p in st["pos"].items():
        px, pd = mark_on(marks, t, day)
        if px is None:
            sys.exit(f"no mark for held ticker {t}; supply its close")
        if pd != day:
            stale.append(f"{t} (last mark {pd})")
        value += p["qty"] * px
        unreal += p["qty"] * px - p["cost"]
    equity = st["cash"] + value
    bench = CFG["benchmark"]
    bpx, _ = mark_on(marks, bench, day)
    b0, _ = mark_on(marks, bench, CFG["start_date"])
    bval = ""
    if bpx and b0 and day >= CFG["start_date"]:
        entry = b0 * (1 + CFG["slippage_bps"]["A"] / 1e4)
        bval = round(CFG["starting_cash"] / entry * bpx, 2)
    row = {"date": day, "cash": round(st["cash"], 2), "positions_value": round(value, 2),
           "equity": round(equity, 2), "pnl": round(equity - CFG["starting_cash"], 2),
           "pnl_pct": round(equity / CFG["starting_cash"] - 1, 6), "fees_cum": round(st["fees"], 2),
           "slippage_cum": round(st["slippage"], 2), "realized": round(st["realized"], 2),
           "unrealized": round(unreal, 2), "trades_today": len(st["per_day"].get(day, [])),
           "bench_close": bpx or "", "bench_value": bval}
    rows = [r for r in read_csv(EQUITY) if r["date"] != day] + [row]
    rows.sort(key=lambda r: r["date"])
    write_csv(EQUITY, EQUITY_COLS, rows)
    return row, stale


def check_exits(D, prices):
    """Auto-queue sells for stop breaches (closing basis); flag targets."""
    msgs, day = [], D.isoformat()
    st, exits, orders = replay(), load_exits(), read_csv(ORDERS)
    for t, p in st["pos"].items():
        px = prices.get(t)
        ex = exits.get(t, {})
        if px is None:
            continue
        pending_sell = any(o["ticker"] == t and o["side"] == "sell" and o["status"] == "pending" for o in orders)
        if ex.get("stop") and px <= ex["stop"] and not pending_sell:
            o = {"id": next_id("O", orders), "created": day, "ticker": t, "side": "sell", "size_type": "all",
                 "size_value": 1, "tier": "A", "max_price": "", "min_price": "", "stop": "", "target": "",
                 "priority": 0, "gtd": next_trading_day(D).isoformat(), "status": "pending", "filled_date": "",
                 "reason": "", "thesis": f"AUTO-STOP: close {px} <= stop {ex['stop']}"}
            orders.append(o)
            msgs.append(f"STOP HIT {t}: close {px} <= {ex['stop']} -> queued {o['id']} sell-all for next close")
        elif ex.get("target") and px >= ex["target"]:
            msgs.append(f"TARGET HIT {t}: close {px} >= {ex['target']} -> committee decision needed")
    write_csv(ORDERS, ORDER_COLS, orders)
    return msgs


def auto_prices(D, extra):
    """Official closes from the multi-provider quote layer (quotes.py); unverifiable tickers are left out."""
    import quotes
    tickers = set(replay()["pos"]) | {o["ticker"] for o in read_csv(ORDERS) if o["status"] == "pending"}
    tickers |= {CFG["benchmark"]} | {t.strip().upper() for t in extra.split(",") if t.strip()}
    prices, sources, msgs = {}, {}, []
    for sym, r in quotes.closes(D.isoformat(), sorted(tickers)).items():
        if r["status"] == "ok":
            prices[sym], sources[sym] = r["price"], r["source"]
        else:
            msgs.append(f"NO VERIFIED CLOSE {sym}: {r['status']} {r['errors'] or ''}")
    if prices:
        write_csv(DATA / "prices" / f"{D.isoformat()}.csv", ["ticker", "close", "source"],
                  [{"ticker": t, "close": prices[t], "source": sources[t]} for t in sorted(prices)])
    return prices, sources, msgs


def cmd_day(a):
    D = d(a.date)
    if not is_trading_day(D):
        sys.exit(f"{D} is not a US trading day")
    if D < d(CFG["start_date"]):
        sys.exit(f"experiment starts {CFG['start_date']}")
    prices, sources, feed_msgs = {}, {}, []
    if a.auto_prices:
        prices, sources, feed_msgs = auto_prices(D, a.also or "")
    manual, manual_src = load_prices(a)
    for t, px in manual.items():  # manual/search prices only fill gaps the feed could not verify
        if t not in prices:
            prices[t], sources[t] = px, manual_src.get(t, "") or "manual entry"
    if not prices:
        sys.exit("no prices: quote feed returned nothing and none were supplied (use --prices-file or --prices)\n" + "\n".join(feed_msgs))
    marks = [r for r in read_csv(MARKS) if not (r["date"] == D.isoformat() and r["ticker"] in prices)]
    for t, px in prices.items():
        marks.append({"date": D.isoformat(), "ticker": t, "close": px, "source": sources.get(t, "")})
    marks.sort(key=lambda r: (r["date"], r["ticker"]))
    write_csv(MARKS, MARK_COLS, marks)
    msgs = feed_msgs + process_orders(D, prices, sources)
    row, stale = snapshot(D)
    msgs += check_exits(D, prices)
    write_reports(D)
    print("\n".join(msgs) if msgs else "no order activity")
    if stale:
        print("WARNING stale marks:", ", ".join(stale))
    print(f"\n{D}: equity {money(row['equity'])}  P/L {money(row['pnl'])} ({pct(row['pnl_pct'])})  "
          f"cash {money(row['cash'])}  fees to date {money(row['fees_cum'])}  "
          f"{CFG['benchmark']} bench {row['bench_value'] or 'n/a'}")


# ---------------------------------------------------------------- reporting
def stats():
    st = replay()
    eq = read_csv(EQUITY)
    closed = st["closed"]
    wins = [c["pl"] for c in closed if c["pl"] > 0]
    losses = [c["pl"] for c in closed if c["pl"] <= 0]
    peak, mdd = CFG["starting_cash"], 0.0
    series = [CFG["starting_cash"]] + [float(r["equity"]) for r in eq]
    for v in series:
        peak = max(peak, v)
        mdd = min(mdd, v / peak - 1)
    daily = [series[i] / series[i - 1] - 1 for i in range(1, len(series))]
    return {"closed_trades": len(closed), "wins": len(wins), "losses": len(losses),
            "win_rate": (len(wins) / len(closed)) if closed else None,
            "avg_win": sum(wins) / len(wins) if wins else None,
            "avg_loss": sum(losses) / len(losses) if losses else None,
            "payoff": (sum(wins) / len(wins)) / abs(sum(losses) / len(losses)) if wins and losses and sum(losses) else None,
            "max_drawdown": mdd, "best_day": max(daily) if daily else None,
            "worst_day": min(daily) if daily else None, "total_fills": sum(len(v) for v in st["per_day"].values()),
            "verified_fills": sum(1 for v in st["per_day"].values() for r in v
                                  if "official close" in r["price_source"] or " live " in r["price_source"])}


def build_dashboard(D):
    st = replay()
    marks = load_marks()
    day = D.isoformat()
    exits = load_exits()
    eq_rows = read_csv(EQUITY)
    positions = []
    for t, p in sorted(st["pos"].items()):
        px, pd = mark_on(marks, t, day)
        positions.append({"ticker": t, "qty": round(p["qty"], 6), "avg_cost": round(p["cost"] / p["qty"], 4),
                          "last": px, "last_date": pd, "value": round(p["qty"] * px, 2),
                          "unrealized": round(p["qty"] * px - p["cost"], 2),
                          "unrealized_pct": round(p["qty"] * px / p["cost"] - 1, 4),
                          "stop": exits.get(t, {}).get("stop"), "target": exits.get(t, {}).get("target"),
                          "opened": p["opened"]})
    last = eq_rows[-1] if eq_rows else None
    equity = float(last["equity"]) if last else CFG["starting_cash"]
    days_left = trading_days_after(D, d(CFG["end_date"]))
    goal = CFG["goal_equity"]
    req = (goal / equity) ** (1 / days_left) - 1 if days_left > 0 and equity > 0 else None
    series = [{"date": CFG["baseline_date"], "equity": CFG["starting_cash"], "bench": CFG["starting_cash"]}]
    for r in eq_rows:
        series.append({"date": r["date"], "equity": float(r["equity"]),
                       "bench": float(r["bench_value"]) if r["bench_value"] else None})
    return {"asof": day, "start_cash": CFG["starting_cash"], "goal": goal, "end_date": CFG["end_date"],
            "equity": equity, "pnl": equity - CFG["starting_cash"], "pnl_pct": equity / CFG["starting_cash"] - 1,
            "cash": st["cash"], "fees": st["fees"], "slippage": st["slippage"], "realized": st["realized"],
            "progress_to_goal": (equity - CFG["starting_cash"]) / (goal - CFG["starting_cash"]),
            "trading_days_left": days_left, "required_daily_return": req,
            "bench_value": float(last["bench_value"]) if last and last["bench_value"] else None,
            "benchmark": CFG["benchmark"], "series": series, "positions": positions,
            "pending_orders": [o for o in read_csv(ORDERS) if o["status"] == "pending"],
            "recent_orders": [o for o in read_csv(ORDERS) if o["status"] != "pending"][-12:],
            "trades": read_csv(LEDGER), "stats": stats(),
            "est_after_tax_equity": CFG["starting_cash"] + (equity - CFG["starting_cash"]) *
                                    (1 - CFG["tax_rate_memo"]) if equity > CFG["starting_cash"] else equity}


def export_rows(b):
    """Row-array JSON files for the dashboard artifact (data/export/*.json)."""
    out = DATA / "export"
    out.mkdir(parents=True, exist_ok=True)
    s, start, goal = b["stats"], CFG["starting_cash"], CFG["goal_equity"]
    base, end = d(CFG["baseline_date"]), d(CFG["end_date"])
    n_total = trading_days_after(base, end)
    have = {x["date"]: x for x in b["series"]}
    days, cur = [base], base
    while cur < end:
        cur = next_trading_day(cur)
        days.append(cur)
    curve = []
    for day in days:
        i = trading_days_after(base, day)
        row = have.get(day.isoformat(), {})
        curve.append({"date": day.isoformat(), "equity": row.get("equity"), "benchmark": row.get("bench"),
                      "pace": round(start * (goal / start) ** (i / n_total), 2)})
    spy_pnl = (b["bench_value"] / start - 1) if b["bench_value"] else None
    summary = [{"asof": b["asof"], "equity": round(b["equity"], 2), "pnl": round(b["pnl"], 2),
                "pnl_pct": round(b["pnl_pct"], 4), "goal": goal, "end_date": b["end_date"],
                "progress_to_goal": round(b["progress_to_goal"], 4), "cash": round(b["cash"], 2),
                "fees": round(b["fees"], 2), "slippage": round(b["slippage"], 2),
                "realized": round(b["realized"], 2), "benchmark_value": b["bench_value"],
                "benchmark_pnl_pct": round(spy_pnl, 4) if spy_pnl is not None else None,
                "trading_days_left": b["trading_days_left"],
                "required_daily_return": round(b["required_daily_return"], 4) if b["required_daily_return"] else None,
                "fills": s["total_fills"], "verified_fills": s["verified_fills"], "closed_trades": s["closed_trades"],
                "win_rate": round(s["win_rate"], 4) if s["win_rate"] is not None else None,
                "payoff": round(s["payoff"], 2) if s["payoff"] else None,
                "max_drawdown": round(s["max_drawdown"], 4),
                "after_tax_equity": round(b["est_after_tax_equity"], 2)}]
    orders = [{"id": o["id"], "created": o["created"], "side": o["side"], "ticker": o["ticker"],
               "size": size_label(o), "stop": level_label(o["stop"], o.get("stop_pct"), "-"),
               "target": level_label(o["target"], o.get("target_pct"), "+"),
               "max_price": fnum(o["max_price"]), "status": o["status"], "reason": o["reason"], "thesis": o["thesis"]}
              for o in read_csv(ORDERS) if o["status"] == "pending" or o["created"] >= week_ago(b)]
    trades = [{"id": t["id"], "date": t["date"], "side": t["side"], "ticker": t["ticker"], "qty": float(t["qty"]),
               "fill_price": float(t["fill_price"]), "gross": float(t["gross"]), "fees": float(t["fees"]),
               "slippage_bps": float(t["slip_bps"]), "thesis": t["thesis"], "price_source": t["price_source"]}
              for t in b["trades"]]
    files = {"summary": summary, "equity": curve, "positions": b["positions"] or [], "orders": orders, "trades": trades}
    for name, rows in files.items():
        (out / f"{name}.json").write_text(json.dumps(rows, indent=1, default=str) + "\n")


def size_label(o):
    v = float(o["size_value"])
    return {"usd": f"${v:,.0f}", "qty": f"{v:g} sh", "pct": f"{v:g}% of position"}.get(o["size_type"], "entire position")


def level_label(price, pct_of_fill, sign):
    if price not in ("", None):
        return f"{float(price):,.2f}"
    return f"{sign}{float(pct_of_fill):g}% of fill" if pct_of_fill not in ("", None) else ""


def week_ago(b, days=7):
    return (d(b["asof"]) - timedelta(days=days)).isoformat()


def write_reports(D):
    b = build_dashboard(D)
    DASH_JSON.write_text(json.dumps(b, indent=2, default=str) + "\n")
    export_rows(b)
    s = b["stats"]
    L = [f"# Paper-trading scoreboard (as of {b['asof']})", "",
         "> SIMULATION. No real money. Prices come from public web sources; fills are modeled at the close "
         "with slippage and fees (see RULES.md).", "",
         f"**Equity {money(b['equity'])}** | P/L {money(b['pnl'])} ({pct(b['pnl_pct'])}) | goal "
         f"{money(b['goal'])} by {b['end_date']} | {b['progress_to_goal'] * 100:.1f}% of the way",
         f"- Cash {money(b['cash'])} | realized {money(b['realized'])} | fees paid {money(b['fees'])} | "
         f"slippage cost {money(b['slippage'])}",
         f"- {b['benchmark']} buy-and-hold with same $: {money(b['bench_value']) if b['bench_value'] else 'n/a'}",
         f"- Trading days left: {b['trading_days_left']}"
         + (f" | needed per day to hit goal: {pct(b['required_daily_return'])}" if b["required_daily_return"] else ""),
         f"- Est. after-tax equity if liquidated (memo, {int(CFG['tax_rate_memo'] * 100)}% on gains): "
         f"{money(b['est_after_tax_equity'])}", "", "## Positions", ""]
    if b["positions"]:
        L += ["| Ticker | Qty | Avg cost | Last | Value | Unreal. | Stop | Target |", "|---|---|---|---|---|---|---|---|"]
        for p in b["positions"]:
            L.append(f"| {p['ticker']} | {p['qty']:.4f} | {p['avg_cost']:.2f} | {p['last']:.2f} | {money(p['value'])} | "
                     f"{money(p['unrealized'])} ({pct(p['unrealized_pct'])}) | {p['stop'] or ''} | {p['target'] or ''} |")
    else:
        L.append("_All cash._")
    L += ["", "## Pending orders (fill at next close)", ""]
    L += [f"- {o['id']} {o['side']} {o['ticker']} {o['size_type']}={o['size_value']} "
          f"stop={o['stop'] or (o.get('stop_pct') and o['stop_pct'] + '%') or ''} "
          f"target={o['target'] or (o.get('target_pct') and o['target_pct'] + '%') or ''} :: {o['thesis']}"
          for o in b["pending_orders"]] or ["_None._"]
    L += ["", "## Stats", "",
          f"- Fills: {s['total_fills']} | closed round trips: {s['closed_trades']} (W {s['wins']} / L {s['losses']})",
          f"- Fills priced by the cross-checked quote feed: {s['verified_fills']} of {s['total_fills']}"
          + ("" if s["verified_fills"] == s["total_fills"] else " (the rest used fallback sources, see price_source)"),
          f"- Win rate: {s['win_rate'] * 100:.0f}%" if s["win_rate"] is not None else "- Win rate: n/a",
          f"- Payoff (avg win / avg loss): {s['payoff']:.2f}" if s["payoff"] else "- Payoff: n/a",
          f"- Max drawdown: {pct(s['max_drawdown'])}"]
    L += ["", "## Last 10 fills", "", "| Date | Side | Ticker | Qty | Fill | Fees | Thesis |", "|---|---|---|---|---|---|---|"]
    for t in b["trades"][-10:]:
        L.append(f"| {t['date']} | {t['side']} | {t['ticker']} | {float(t['qty']):.4f} | {t['fill_price']} | "
                 f"${float(t['fees']):.2f} | {t['thesis']} |")
    STATUS_MD.write_text("\n".join(L) + "\n")


def cmd_report(a):
    eq = read_csv(EQUITY)
    D = d(a.date) if a.date else (d(eq[-1]["date"]) if eq else d(CFG["start_date"]))
    write_reports(D)
    print(STATUS_MD.read_text())


def cmd_validate(a):
    errs = []
    rows = read_csv(LEDGER)
    cash, pos, by_day = CFG["starting_cash"], {}, {}
    for r in rows:
        day = d(r["date"])
        if not is_trading_day(day):
            errs.append(f"{r['id']}: {r['date']} not a trading day")
        by_day.setdefault(r["date"], []).append(r)
        cash += float(r["cash_delta"])
        q = float(r["qty"]) * (1 if r["side"] == "buy" else -1)
        pos[r["ticker"]] = pos.get(r["ticker"], 0.0) + q
        if cash < -0.005:
            errs.append(f"{r['id']}: negative cash {cash:.2f}")
        if pos[r["ticker"]] < -1e-6:
            errs.append(f"{r['id']}: short position in {r['ticker']}")
        if not r["thesis"] or not r["price_source"]:
            errs.append(f"{r['id']}: missing thesis or price_source")
    for day, rs in by_day.items():
        if len(rs) > CFG["max_trades_per_day"]:
            errs.append(f"{day}: {len(rs)} fills exceeds cap")
        ts = [r["ticker"] for r in rs]
        if len(ts) != len(set(ts)):
            errs.append(f"{day}: ticker traded twice (round trip)")
    for r in rows:
        if "official close" not in r["price_source"] and " live " not in r["price_source"]:
            print(f"WARN {r['id']}: priced from a fallback source, not the cross-checked feed: {r['price_source'][:80]}")
    print("OK: ledger satisfies all rules" if not errs else "\n".join(errs))
    sys.exit(1 if errs else 0)


# ---------------------------------------------------------------- cli
def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    o = sub.add_parser("order").add_subparsers(dest="ocmd", required=True)
    oa = o.add_parser("add")
    oa.add_argument("--ticker", required=True)
    oa.add_argument("--side", choices=["buy", "sell"], required=True)
    oa.add_argument("--usd", type=float)
    oa.add_argument("--qty", type=float)
    oa.add_argument("--pct", type=float)
    oa.add_argument("--all", action="store_true")
    oa.add_argument("--tier", default="A")
    oa.add_argument("--max-price", type=float)
    oa.add_argument("--min-price", type=float)
    oa.add_argument("--stop", type=float)
    oa.add_argument("--target", type=float)
    oa.add_argument("--stop-pct", type=float, help="stop as percent below the actual fill price")
    oa.add_argument("--target-pct", type=float, help="target as percent above the actual fill price")
    oa.add_argument("--priority", type=int, default=5, help="lower fills first (sells always first)")
    oa.add_argument("--created")
    oa.add_argument("--gtd", help="good-till date; default: next trading day only")
    oa.add_argument("--thesis")
    oa.set_defaults(fn=cmd_order_add)
    ol = o.add_parser("list")
    ol.add_argument("--status")
    ol.set_defaults(fn=cmd_order_list)
    oc = o.add_parser("cancel")
    oc.add_argument("id")
    oc.add_argument("--reason")
    oc.set_defaults(fn=cmd_order_cancel)
    dy = sub.add_parser("day", help="close the books for a session")
    dy.add_argument("--date", required=True)
    dy.add_argument("--prices-file")
    dy.add_argument("--prices")
    dy.add_argument("--source")
    dy.add_argument("--auto-prices", action="store_true", help="fetch cross-checked official closes via quotes.py")
    dy.add_argument("--also", help="extra tickers to price with --auto-prices (comma separated)")
    dy.set_defaults(fn=cmd_day)
    for name, fn in (("status", cmd_report), ("report", cmd_report)):
        s = sub.add_parser(name)
        s.add_argument("--date")
        s.set_defaults(fn=fn)
    v = sub.add_parser("validate")
    v.set_defaults(fn=cmd_validate)
    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
