#!/usr/bin/env python3
"""Real-money safety gate and ledger for live mode (stdlib only). See LIVE_MODE.md.

This module never talks to a broker. The portfolio manager places orders through the broker connector
ONLY after `gate` approves a ticket, then reports what happened with `placed` / `record` / `fail`.
Everything the gate checks is enforced here, in code, from files in the repo:

  * KILL_SWITCH file present            -> every order refused (the owner can create it from GitHub in seconds)
  * live.enabled false                  -> every order refused
  * only orders the tracker has CONFIRMED today (pre-close decision flow), before the last-order cutoff
  * real capital cap                    -> never more than live.capital_cap_usd deployed, whatever the account holds
  * max single order, leveraged-ETF cap, 4 fills a day, no same-day round trips, no shorting
  * LOSS LIMIT: when the experiment is down live.loss_limit_usd (default $500) it STOPS: buys are refused, everything
    is sold to cash, then KILL_SWITCH is created. Only the owner re-arms it, after talking.
  * one ticket per order id, so a crashed or repeated run cannot place the same order twice

  live.py status
  live.py check [--marks XLE=68.1,GUSH=24.9]      run every pre-close and post-close; trips the loss limit
  live.py gate --order O003 [--ref-price 68.5] [--marks ...]
  live.py placed --ticket K001 --broker-order-id ABC
  live.py record --ticket K001 --qty 5.1 --avg-price 68.55 [--fees 0.01] [--broker-order-id ABC]
  live.py fail --ticket K001 --reason "..."
  live.py kill --reason "..."
"""
import argparse
import json
import math
import sys
from datetime import time

import tracker as T

ROOT, DATA = T.ROOT, T.DATA
LIVE_LEDGER, TICKETS, KILL = DATA / "live_ledger.csv", DATA / "live_tickets.csv", ROOT / "KILL_SWITCH"
STATE = DATA / "live_state.json"
LEDGER_COLS = ["id", "ts_et", "date", "ticker", "side", "qty", "avg_price", "notional", "fees", "order_id",
               "ticket", "broker_order_id", "note"]
TICKET_COLS = ["ticket", "ts_et", "date", "order_id", "ticker", "side", "usd", "qty", "status", "reason"]
LIVE = T.CFG.get("live", {})


def refuse(msg):
    print(f"REFUSED: {msg}")
    sys.exit(2)


def hhmm(s):
    h, m = s.split(":")
    return time(int(h), int(m))


def live_state():
    """Replay the live ledger: positions, cost basis, realized P/L, fills per day."""
    pos, realized, per_day = {}, 0.0, {}
    for r in T.read_csv(LIVE_LEDGER):
        t, q, px, fee = r["ticker"], float(r["qty"]), float(r["avg_price"]), float(r["fees"] or 0)
        per_day.setdefault(r["date"], []).append(r)
        p = pos.setdefault(t, {"qty": 0.0, "cost": 0.0})
        if r["side"] == "buy":
            p["qty"] += q
            p["cost"] += q * px + fee
        else:
            avg = p["cost"] / p["qty"]
            realized += q * px - fee - avg * q
            p["cost"] -= avg * q
            p["qty"] -= q
            if p["qty"] <= 1e-6:
                del pos[t]
    return {"pos": pos, "realized": realized, "per_day": per_day,
            "deployed": sum(p["cost"] for p in pos.values())}


def parse_marks(s):
    return {k.strip().upper(): float(v) for k, v in (kv.split("=") for kv in s.split(","))} if s else {}


def experiment_equity(st, day, extra=None):
    """Capital cap + realized + unrealized. Prices: marks passed in, else the latest recorded close, else cost."""
    paper = T.load_marks()
    unreal = 0.0
    for t, p in st["pos"].items():
        px = (extra or {}).get(t) or T.mark_on(paper, t, day)[0]
        if px:
            unreal += p["qty"] * px - p["cost"]
    return LIVE["capital_cap_usd"] + st["realized"] + unreal


def stopped():
    return json.loads(STATE.read_text()).get("stopped", False) if STATE.exists() else False


def set_stopped(reason, equity):
    STATE.write_text(json.dumps({"stopped": True, "at": T.now_et().isoformat(timespec="seconds"),
                                 "reason": reason, "equity": round(equity, 2)}, indent=1) + "\n")


def trip_if_breached(st, day, extra=None):
    """Persist the STOP the first time the loss limit is crossed. Returns (is_stopped, equity, loss)."""
    eq = experiment_equity(st, day, extra)
    loss = LIVE["capital_cap_usd"] - eq
    if loss >= LIVE.get("loss_limit_usd", 500) and not stopped():
        set_stopped(f"experiment down ${loss:,.2f} (limit ${LIVE.get('loss_limit_usd', 500):,.0f})", eq)
    return stopped(), eq, loss


def tickets():
    return T.read_csv(TICKETS)


def add_ticket(row):
    rows = tickets()
    row["ticket"] = f"K{len(rows) + 1:03d}"
    rows.append(row)
    T.write_csv(TICKETS, TICKET_COLS, rows)
    return row["ticket"]


def set_ticket(tid, **kw):
    rows = tickets()
    for r in rows:
        if r["ticket"] == tid:
            r.update(kw)
            T.write_csv(TICKETS, TICKET_COLS, rows)
            return r
    sys.exit(f"no ticket {tid}")


def cmd_gate(a):
    now = T.now_et()
    day = now.date().isoformat()
    if not LIVE.get("enabled"):
        refuse("live mode is not enabled in config.json (live.enabled is false)")
    if KILL.exists():
        refuse("KILL_SWITCH file is present: all real orders are halted until the owner removes it")
    if not T.is_trading_day(now.date()):
        refuse(f"{day} is not a trading day")
    o = next((r for r in T.read_csv(T.ORDERS) if r["id"] == a.order), None)
    if o is None or o["status"] != "pending":
        refuse(f"order {a.order} is not a pending order")
    tk, side = o["ticker"], o["side"]
    st = live_state()
    halted, eq, loss = trip_if_breached(st, day, parse_marks(a.marks))
    limit_time = hhmm(LIVE.get("flatten_cutoff_et", "15:58")) if (halted and side == "sell") else hhmm(LIVE.get("last_order_cutoff_et", "15:50"))
    if now.time() > limit_time:
        refuse(f"{now:%H:%M} ET is after the {limit_time:%H:%M} ET last-order cutoff")
    if not T.confirmed_for(o, day):
        refuse(f"order {a.order} was not confirmed today by the pre-close decision flow")
    if any(t["order_id"] == a.order and t["status"] in ("approved", "placed", "recorded") for t in tickets()):
        refuse(f"order {a.order} already has a ticket (no duplicate real orders)")
    cap = LIVE["capital_cap_usd"]
    todays = st["per_day"].get(day, [])
    open_tickets = [t for t in tickets() if t["date"] == day and t["status"] in ("approved", "placed")]
    if len(todays) + len(open_tickets) >= T.CFG["max_trades_per_day"]:
        refuse(f"daily cap of {T.CFG['max_trades_per_day']} real fills reached")
    if tk in {r["ticker"] for r in todays} | {t["ticker"] for t in open_tickets}:
        refuse(f"{tk} already traded today (no same-day round trips or repeat fills)")
    ref = a.ref_price
    usd = qty = None
    note = ""
    if side == "buy":
        if halted:
            refuse(f"LOSS LIMIT hit (experiment down ${loss:,.2f}): no new buys; sell everything to cash. Owner re-arms after talking")
        want = float(o["size_value"]) if o["size_type"] == "usd" else (float(o["size_value"]) * ref if ref else None)
        if want is None:
            refuse("a quantity-sized buy needs --ref-price")
        usd = min(want, cap - st["deployed"], LIVE.get("max_single_order_pct", 0.30) * cap)
        if tk in set(LIVE.get("leveraged_etfs", [])):
            usd = min(usd, LIVE.get("max_leveraged_each_pct", 0.15) * cap - st["pos"].get(tk, {"cost": 0.0})["cost"])
        usd = math.floor(usd * 100) / 100
        if usd < T.CFG["min_order_usd"]:
            refuse(f"no room under the real-capital caps (deployed ${st['deployed']:.2f} of ${cap:.2f})")
        if abs(usd - want) >= 0.01:
            note = f"reduced from ${want:.2f} by the real-money caps"
    else:
        held = st["pos"].get(tk, {"qty": 0.0})["qty"]
        if held <= 1e-9:
            refuse(f"the live ledger holds no {tk} to sell (no shorting)")
        kind = o["size_type"]
        if halted or kind == "all":
            qty = held
        elif kind == "pct":
            qty = held * float(o["size_value"]) / 100
        elif kind == "qty":
            qty = min(float(o["size_value"]), held)
        else:
            if not ref:
                refuse("a dollar-sized sell needs --ref-price")
            qty = min(float(o["size_value"]) / ref, held)
        qty = round(qty, 6)
    tid = add_ticket({"ts_et": now.isoformat(timespec="seconds"), "date": day, "order_id": o["id"], "ticker": tk,
                      "side": side, "usd": f"{usd:.2f}" if usd else "", "qty": f"{qty:.6f}" if qty else "",
                      "status": "approved", "reason": ""})
    print(json.dumps({"verdict": "APPROVED", "ticket": tid, "order": o["id"], "ticker": tk, "side": side,
                      "notional_usd": usd, "shares": qty, "sell_all": bool(side == "sell" and (halted or o["size_type"] == "all")),
                      "stopped": halted, "note": note}, indent=1))


def cmd_check(a):
    now = T.now_et()
    day = now.date().isoformat()
    if not LIVE.get("enabled"):
        print("live mode disabled: nothing to check")
        return
    st = live_state()
    halted, eq, loss = trip_if_breached(st, day, parse_marks(a.marks))
    print(f"experiment equity ${eq:,.2f} (cap ${LIVE['capital_cap_usd']:,.2f}); P/L ${-loss:+,.2f}; loss limit ${LIVE.get('loss_limit_usd', 500):,.0f}")
    if not halted:
        print("STATE: OK")
        return
    print("STATE: STOPPED. The loss limit was hit. No new buys. Sell everything to cash, then halt until the owner says otherwise.")
    if st["pos"]:
        print("FLATTEN REQUIRED, for each position create a confirmed sell and run it through the gate:")
        for t, p in sorted(st["pos"].items()):
            print(f"  tracker.py order add --ticker {t} --side sell --all --tier A --thesis 'LOSS LIMIT flatten' --confirm   # {p['qty']:.4f} sh")
        sys.exit(3)
    if not KILL.exists():
        KILL.write_text(f"{now.isoformat(timespec='seconds')} loss limit hit and flattened; halted until the owner re-arms\n")
        print("Flat. KILL_SWITCH created; commit and push it, tell the owner, and stop.")
    sys.exit(3)


def cmd_placed(a):
    r = set_ticket(a.ticket, status="placed", reason=f"broker order {a.broker_order_id}")
    print(f"ticket {r['ticket']} marked placed")


def cmd_record(a):
    now = T.now_et()
    tk = next((t for t in tickets() if t["ticket"] == a.ticket), None)
    if tk is None or tk["status"] not in ("approved", "placed"):
        sys.exit(f"ticket {a.ticket} is not open")
    rows = T.read_csv(LIVE_LEDGER)
    rows.append({"id": f"L{len(rows) + 1:03d}", "ts_et": now.isoformat(timespec="seconds"), "date": now.date().isoformat(),
                 "ticker": tk["ticker"], "side": tk["side"], "qty": f"{a.qty:.6f}", "avg_price": a.avg_price,
                 "notional": round(a.qty * a.avg_price, 2), "fees": a.fees, "order_id": tk["order_id"], "ticket": a.ticket,
                 "broker_order_id": a.broker_order_id or "", "note": a.note or ""})
    T.write_csv(LIVE_LEDGER, LEDGER_COLS, rows)
    set_ticket(a.ticket, status="recorded")
    print(f"recorded {rows[-1]['id']}: {tk['side']} {a.qty} {tk['ticker']} @ {a.avg_price}")


def cmd_fail(a):
    set_ticket(a.ticket, status="failed", reason=a.reason)
    print(f"ticket {a.ticket} marked failed: {a.reason}")


def cmd_kill(a):
    KILL.write_text(f"{T.now_et().isoformat(timespec='seconds')} {a.reason}\n")
    print(f"KILL_SWITCH created: {a.reason}. All real orders are now refused. Commit and push it. Only the owner removes it.")


def cmd_status(a):
    now = T.now_et()
    day = now.date().isoformat()
    st = live_state()
    cap = LIVE.get("capital_cap_usd", 0)
    print(f"live mode:        {'ENABLED' if LIVE.get('enabled') else 'disabled'}")
    print(f"kill switch:      {'PRESENT (all real orders refused)' if KILL.exists() else 'absent'}")
    print(f"loss-limit stop:  {'STOPPED' if stopped() else 'not tripped'} (limit ${LIVE.get('loss_limit_usd', 500):,.0f})")
    print(f"real capital cap: ${cap:,.2f}   deployed (cost): ${st['deployed']:,.2f}   realized: ${st['realized']:+,.2f}")
    if LIVE.get("enabled"):
        print(f"experiment equity (last known prices): ${experiment_equity(st, day):,.2f}")
    print(f"real fills today: {len(st['per_day'].get(day, []))} of {T.CFG['max_trades_per_day']}")
    for t, p in sorted(st["pos"].items()):
        print(f"  {t:6} {p['qty']:.4f} sh, cost ${p['cost']:,.2f}")
    open_t = [t for t in tickets() if t["status"] in ("approved", "placed")]
    if open_t:
        print("OPEN TICKETS (approved or placed but not recorded; reconcile with the broker before anything else):")
        for t in open_t:
            print(f"  {t['ticket']} {t['status']} {t['side']} {t['ticker']} order {t['order_id']}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("gate")
    g.add_argument("--order", required=True)
    g.add_argument("--ref-price", type=float)
    g.add_argument("--marks", help="fresh prices for held tickers, e.g. XLE=68.1,GUSH=24.9")
    g.set_defaults(fn=cmd_gate)
    c = sub.add_parser("check")
    c.add_argument("--marks")
    c.set_defaults(fn=cmd_check)
    pl = sub.add_parser("placed")
    pl.add_argument("--ticket", required=True)
    pl.add_argument("--broker-order-id", required=True)
    pl.set_defaults(fn=cmd_placed)
    r = sub.add_parser("record")
    r.add_argument("--ticket", required=True)
    r.add_argument("--qty", type=float, required=True)
    r.add_argument("--avg-price", type=float, required=True)
    r.add_argument("--fees", type=float, default=0.0)
    r.add_argument("--broker-order-id")
    r.add_argument("--note")
    r.set_defaults(fn=cmd_record)
    f = sub.add_parser("fail")
    f.add_argument("--ticket", required=True)
    f.add_argument("--reason", required=True)
    f.set_defaults(fn=cmd_fail)
    k = sub.add_parser("kill")
    k.add_argument("--reason", required=True)
    k.set_defaults(fn=cmd_kill)
    s = sub.add_parser("status")
    s.set_defaults(fn=cmd_status)
    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
