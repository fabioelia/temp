// Pure rules of the trading guard: no `$`, so every judgement here is a plain
// function of its inputs. The source of truth they mirror is the experiment's
// own RULES.md, LIVE_MODE.md and live.py (trading-experiment/ in the repo).

export type Ticket = {
  ticket: string
  ts_et: string
  date: string
  order_id: string
  ticker: string
  side: string
  usd: string
  qty: string
  status: string
  reason: string
}

export type LiveConfig = {
  enabled?: boolean
  agent_account_last4?: string
  last_order_cutoff_et?: string
  flatten_cutoff_et?: string
}

export type Config = {
  live?: LiveConfig
  strategy?: { allow_stock_buys?: boolean; allow_options?: boolean }
  holidays?: string[]
  early_close?: string[]
}

export type Experiment = {
  dir: string
  config: Config
  tickets: Ticket[]
  killSwitch: boolean
}

export type Verdict =
  | { ok: true; ticket?: string; note?: string }
  | { ok: false; reason: string }

const ALLOW: Verdict = { ok: true }
const deny = (reason: string): Verdict => ({ ok: false, reason })

// ---------------------------------------------------------------- CSV

/** Parses RFC 4180 CSV (quoted fields, "" escapes, newlines in quotes). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else {
        field += c
      }
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  const [head, ...body] = rows.filter(r => r.length > 1 || r[0] !== '')
  if (head === undefined) return []
  return body.map(r => Object.fromEntries(head.map((k, j) => [k, r[j] ?? ''])))
}

// ---------------------------------------------------------------- New York time

/** US Eastern daylight time: 2nd Sunday of March 02:00 to 1st Sunday of November 02:00. */
function isEasternDst(utcMs: number): boolean {
  const y = new Date(utcMs).getUTCFullYear()
  const march1 = new Date(Date.UTC(y, 2, 1)).getUTCDay()
  const start = Date.UTC(y, 2, 1 + ((7 - march1) % 7) + 7, 7)
  const nov1 = new Date(Date.UTC(y, 10, 1)).getUTCDay()
  const end = Date.UTC(y, 10, 1 + ((7 - nov1) % 7), 6)
  return utcMs >= start && utcMs < end
}

export type Eastern = {
  /** YYYY-MM-DD in New York */
  date: string
  /** minutes since New York midnight */
  minutes: number
  /** 0 Sunday .. 6 Saturday */
  weekday: number
  /** HH:MM */
  hhmm: string
  zone: 'EDT' | 'EST'
}

export function eastern(utcMs: number): Eastern {
  const dst = isEasternDst(utcMs)
  const d = new Date(utcMs + (dst ? -4 : -5) * 3_600_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
    weekday: d.getUTCDay(),
    hhmm: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    zone: dst ? 'EDT' : 'EST',
  }
}

const toMinutes = (hhmm: string | undefined, fallback: number) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : fallback
}

export function isTradingDay(et: Eastern, config: Config): boolean {
  return et.weekday >= 1 && et.weekday <= 5 && !(config.holidays ?? []).includes(et.date)
}

// ---------------------------------------------------------------- live.py ref_id

/** SHA-1, enough of it for uuid5; synchronous and dependency-free. */
function sha1(bytes: Uint8Array): Uint8Array {
  const ml = bytes.length * 8
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, Math.floor(ml / 2 ** 32))
  view.setUint32(padded.length - 4, ml >>> 0)
  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0
  const w = new Uint32Array(80)
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4)
    for (let i = 16; i < 80; i++) {
      const x = (w[i - 3] ?? 0) ^ (w[i - 8] ?? 0) ^ (w[i - 14] ?? 0) ^ (w[i - 16] ?? 0)
      w[i] = (x << 1) | (x >>> 31)
    }
    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    for (let i = 0; i < 80; i++) {
      const [f, k] =
        i < 20
          ? [(b & c) | (~b & d), 0x5a827999]
          : i < 40
            ? [b ^ c ^ d, 0x6ed9eba1]
            : i < 60
              ? [(b & c) | (b & d) | (c & d), 0x8f1bbcdc]
              : [b ^ c ^ d, 0xca62c1d6]
      const t = (((a << 5) | (a >>> 27)) + f + e + k + (w[i] ?? 0)) >>> 0
      e = d
      d = c
      c = (b << 30) | (b >>> 2)
      b = a
      a = t
    }
    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }
  const out = new Uint8Array(20)
  const ov = new DataView(out.buffer)
  ;[h0, h1, h2, h3, h4].forEach((h, i) => ov.setUint32(i * 4, h))
  return out
}

const NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8'

/** Python's uuid.uuid5(namespace, name). */
export function uuid5(namespace: string, name: string): string {
  const ns = namespace.replace(/-/g, '')
  const nsBytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) nsBytes[i] = parseInt(ns.slice(i * 2, i * 2 + 2), 16)
  const nameBytes = new TextEncoder().encode(name)
  const input = new Uint8Array(16 + nameBytes.length)
  input.set(nsBytes)
  input.set(nameBytes, 16)
  const hash = sha1(input).slice(0, 16)
  hash[6] = ((hash[6] ?? 0) & 0x0f) | 0x50
  hash[8] = ((hash[8] ?? 0) & 0x3f) | 0x80
  const hex = Array.from(hash, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** live.py ref_id(ticket): the broker idempotency key the gate hands out. */
export const ticketRefId = (ticket: string) =>
  uuid5(NAMESPACE_URL, `https://github.com/fabioelia/temp/trading-experiment/${ticket}`)

const RESTING = 'resting GTC take-profit'
export const isResting = (t: Ticket) => t.reason.startsWith(RESTING) || t.usd === 'resting'

// ---------------------------------------------------------------- Robinhood

/** The bare tool name when `tool` is one of a Robinhood MCP server's tools. */
export function robinhoodTool(tool: string): string | undefined {
  const m = /^mcp__([^_].*?)__(.+)$/.exec(tool)
  return m && /robinhood/i.test(m[1] ?? '') ? m[2] : undefined
}

const ORDER_TOOLS = new Set([
  'review_option_order',
  'place_option_order',
  'cancel_option_order',
  'review_equity_order',
  'place_equity_order',
  'cancel_equity_order',
])

/** Order-placing tools, which fail closed whenever the guard cannot judge. */
export const PLACES_ORDERS = new Set(['place_option_order', 'place_equity_order'])

const NEVER = new Set(['get_limited_margin_upgrade_info', 'decline_trade_approval'])

/** Read-only by its verb, or one of the order tools judged below; everything else is refused. */
export function isListedTool(name: string): boolean {
  if (ORDER_TOOLS.has(name)) return true
  if (NEVER.has(name) || /crypto|exercise|advanced/.test(name)) return false
  return name.startsWith('get_') || name === 'search' || name === 'run_scan' || name === 'preview_scan'
}

type Args = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : undefined)

export function judgeRobinhood(name: string, args: Args, exp: Experiment | undefined, nowMs: number): Verdict {
  if (!isListedTool(name)) {
    return deny(
      `${name} is off-limits for the trading experiment (LIVE_MODE.md "Never call"): no crypto, exercise, advanced orders, margin, or watchlist/alert/scan/Legend writes.`,
    )
  }

  const account = str(args.account_number)
  const last4 = exp?.config.live?.agent_account_last4
  if (account !== undefined && last4 !== undefined && !account.endsWith(last4)) {
    return deny(`account ${mask(account)} is not the experiment's agent account (ending ${last4}). Never read or trade the owner's other accounts.`)
  }

  if (!ORDER_TOOLS.has(name)) return ALLOW

  if (exp === undefined) {
    return PLACES_ORDERS.has(name) || name.startsWith('review_')
      ? deny('no trading-experiment/ checkout in this workspace, so there is no live.py gate ticket to check: real orders run only from the experiment branch.')
      : ALLOW
  }
  if (account === undefined && last4 !== undefined) {
    return deny(`pass account_number explicitly: the agent account ending ${last4}.`)
  }
  if (name.startsWith('cancel_')) return ALLOW

  return name.includes('option') ? judgeOptionOrder(name, args, exp, nowMs) : judgeEquityOrder(name, args, exp, nowMs)
}

const mask = (account: string) => `••••${account.slice(-4)}`

function judgeOptionOrder(name: string, args: Args, exp: Experiment, nowMs: number): Verdict {
  if (exp.config.strategy?.allow_options === false) return deny('options are switched off in config.json (strategy.allow_options).')
  const legs = Array.isArray(args.legs) ? (args.legs as Args[]) : undefined
  const leg = legs?.[0]
  if (legs === undefined || legs.length !== 1 || leg === undefined) return deny('single-leg option orders only (RULES.md: never multi-leg).')
  if (leg.ratio_quantity !== undefined && Number(leg.ratio_quantity) !== 1) return deny('ratio_quantity must be 1 on a single leg.')
  const side = str(leg.side)
  const effect = str(leg.position_effect)
  const opens = side === 'buy' && effect === 'open'
  const closes = side === 'sell' && effect === 'close'
  if (!opens && !closes) {
    return deny(`${side ?? '?'} to ${effect ?? '?'} is not allowed: only buy-to-open and sell-to-close (never sell to open, never buy to close a short).`)
  }
  const type = str(args.type) ?? 'limit'
  if (type !== 'limit') return deny(`${type} orders are not allowed: limit orders at the broker's live quote only (LIVE_MODE.md).`)
  const marketHours = str(args.market_hours) ?? 'regular_hours'
  if (marketHours !== 'regular_hours') return deny('regular_hours only.')
  const price = Number(str(args.price))
  if (!(price > 0)) return deny('a limit price is required.')
  const qty = Number(str(args.quantity))
  if (!Number.isInteger(qty) || qty < 1) return deny('quantity must be a whole number of contracts.')
  const tif = str(args.time_in_force) ?? 'gfd'

  if (name === 'review_option_order') return ALLOW
  return judgeTicket(args, exp, nowMs, { side: side ?? '', qty, price, tif, perUnit: 100 })
}

function judgeEquityOrder(name: string, args: Args, exp: Experiment, nowMs: number): Verdict {
  const side = str(args.side)
  if (side === 'buy' && exp.config.strategy?.allow_stock_buys !== true) {
    return deny('stock and ETF buys are switched off (config.json strategy.allow_stock_buys): the strategy is options only.')
  }
  if (name === 'review_equity_order') return ALLOW
  const qty = Number(str(args.quantity) ?? 'NaN')
  const dollars = Number(str(args.dollar_amount) ?? 'NaN')
  const price = Number(str(args.limit_price) ?? 'NaN')
  return judgeTicket(args, exp, nowMs, {
    side: side ?? '',
    qty: Number.isFinite(qty) ? qty : 0,
    price: Number.isFinite(price) ? price : 0,
    dollars: Number.isFinite(dollars) ? dollars : undefined,
    tif: str(args.time_in_force) ?? 'gfd',
    perUnit: 1,
    symbol: str(args.symbol),
  })
}

type Order = {
  side: string
  qty: number
  price: number
  dollars?: number
  tif: string
  perUnit: number
  symbol?: string
}

function judgeTicket(args: Args, exp: Experiment, nowMs: number, o: Order): Verdict {
  if (exp.killSwitch) return deny('KILL_SWITCH is present: every real order is halted until the owner removes it.')
  if (exp.config.live?.enabled !== true) return deny('live mode is disabled in config.json (live.enabled).')

  const ref = str(args.ref_id)
  if (ref === undefined) return deny("no ref_id: run `live.py gate` first and pass the APPROVED ticket's ref_id.")
  const ticket = exp.tickets.find(t => ticketRefId(t.ticket) === ref)
  if (ticket === undefined) return deny('this ref_id matches no live.py gate ticket. Every real order needs an APPROVED ticket from `live.py gate`.')
  if (ticket.status !== 'approved') {
    return deny(`ticket ${ticket.ticket} is ${ticket.status}, not approved. Check the broker's order history before anything else; never re-place a placed order.`)
  }

  const et = eastern(nowMs)
  if (ticket.date !== et.date) return deny(`ticket ${ticket.ticket} was approved for ${ticket.date}, not today (${et.date} ET).`)
  if (ticket.side !== o.side) return deny(`ticket ${ticket.ticket} approved a ${ticket.side}, not a ${o.side}.`)
  if (o.symbol !== undefined && ticket.ticker.toUpperCase() !== o.symbol.toUpperCase()) {
    return deny(`ticket ${ticket.ticket} is for ${ticket.ticker}, not ${o.symbol}.`)
  }
  const approvedQty = Number(ticket.qty)
  if (o.qty > 0 && Number.isFinite(approvedQty) && o.qty > approvedQty + 1e-9) {
    return deny(`ticket ${ticket.ticket} approved ${ticket.qty}, not ${o.qty}.`)
  }

  if (isResting(ticket)) {
    if (o.side !== 'sell' || o.tif !== 'gtc') return deny(`ticket ${ticket.ticket} is a resting take-profit: a GTC sell to close.`)
    const limit = Number(/@\s*([\d.]+)/.exec(ticket.reason)?.[1] ?? 'NaN')
    if (Number.isFinite(limit) && o.price + 1e-9 < limit) {
      return deny(`ticket ${ticket.ticket} rests at ${limit}; ${o.price} is below it.`)
    }
    return { ok: true, ticket: ticket.ticket }
  }

  if (o.side === 'buy') {
    if (o.tif !== 'gfd') return deny('buys are good-for-day orders.')
    const premium = o.dollars ?? o.price * o.qty * o.perUnit
    const approvedUsd = Number(ticket.usd)
    if (Number.isFinite(approvedUsd) && premium > approvedUsd + 0.005) {
      return deny(`ticket ${ticket.ticket} approved $${approvedUsd.toFixed(2)}; this order is $${premium.toFixed(2)}.`)
    }
  }

  if (!isTradingDay(et, exp.config)) return deny(`${et.date} is not an NYSE trading day.`)
  const early = (exp.config.early_close ?? []).includes(et.date) ? 180 : 0
  const cutoff =
    o.side === 'buy'
      ? toMinutes(exp.config.live?.last_order_cutoff_et, 950) - early
      : toMinutes(exp.config.live?.flatten_cutoff_et, 958) - early
  if (et.minutes < 570 || et.minutes >= cutoff) {
    const hh = String(Math.floor(cutoff / 60)).padStart(2, '0')
    const mm = String(cutoff % 60).padStart(2, '0')
    return deny(`it is ${et.hhmm} ${et.zone}: ${o.side === 'buy' ? 'buys' : 'sells'} are placed between 09:30 and ${hh}:${mm} ET.`)
  }
  return { ok: true, ticket: ticket.ticket }
}

// ---------------------------------------------------------------- files and shell

const LEDGER_NAME = String.raw`(?:ledger|live_ledger|live_tickets|marks|equity|orders)\.csv|live_state\.json`
const LEDGER_PATH = new RegExp(String.raw`(^|/)trading-experiment/data/(${LEDGER_NAME})$`)
const JOURNAL_PATH = /(^|\/)trading-experiment\/journal\.md$/

/** The experiment's tool-managed files: tracker.py and live.py write them, nothing else. */
export const isLedger = (path: string) => LEDGER_PATH.test(path)
export const isJournal = (path: string) => JOURNAL_PATH.test(path)

export function judgeEdit(path: string, oldText: string, newText: string, replaceAll: boolean): Verdict {
  if (isLedger(path)) {
    return deny(`${path} is append-only and written only by tracker.py / live.py. Use their commands; corrections are dated notes in journal.md.`)
  }
  if (isJournal(path) && (replaceAll || !newText.startsWith(oldText))) {
    return deny('journal.md is append-only: add text after an anchor and change nothing already written. Corrections are new dated notes.')
  }
  return ALLOW
}

export function judgeWrite(path: string, current: string | undefined, next: string): Verdict {
  if (isLedger(path)) {
    return deny(`${path} is append-only and written only by tracker.py / live.py. Use their commands; corrections are dated notes in journal.md.`)
  }
  if (isJournal(path) && current !== undefined && !next.startsWith(current)) {
    return deny('journal.md is append-only: a rewrite must keep everything already written, unchanged, at the top.')
  }
  return ALLOW
}

const KILL_REMOVERS =
  /\b(rm|unlink|mv|shred|truncate)\b|\bgit\s+(rm|mv|restore|checkout|reset|clean|stash)\b|os\.(remove|unlink)|\.unlink\(|\.rename\(|shutil\.(move|rmtree)|-delete\b/
const WIPES_UNTRACKED =
  /\bgit\s+(clean|stash)\b|\bgit\s+reset\s+--hard\b|\bgit\s+checkout\s+(--\s+)?\.(\s|$)|\bgit\s+restore\s+\.(\s|$)|\brm\s+-[a-zA-Z]*r[a-zA-Z]*\s+[^|;&]*trading-experiment/
const LEDGER_WRITERS = new RegExp(
  [
    String.raw`(>>?|\btee\s+(-a\s+)?)\s*["']?[^\s"'|;&]*(${LEDGER_NAME})`,
    String.raw`\b(sed|perl)\s+-[a-zA-Z]*i[a-zA-Z]*\b[^|;&]*(${LEDGER_NAME})`,
    String.raw`\b(rm|mv|truncate|dd)\b[^|;&]*(${LEDGER_NAME})`,
    String.raw`open\([^)]*(${LEDGER_NAME})[^)]*,\s*["'](w|a|r\+|x)`,
    String.raw`(${LEDGER_NAME})["']?\)?\.(write_text|write_bytes|unlink)`,
  ].join('|'),
)

export function judgeBash(command: string, killSwitchExists: boolean): Verdict {
  if (/KILL_SWITCH/.test(command) && KILL_REMOVERS.test(command)) {
    return deny('only the owner removes KILL_SWITCH (RULES.md, LIVE_MODE.md). The agent must never move or delete it.')
  }
  if (killSwitchExists && WIPES_UNTRACKED.test(command)) {
    return deny('KILL_SWITCH is engaged and this command could delete it. Only the owner removes it.')
  }
  if (LEDGER_WRITERS.test(command)) {
    return deny('the ledgers in trading-experiment/data/ are append-only and written only by tracker.py / live.py.')
  }
  return ALLOW
}

/** Tickets a run left open: approved but never placed, or placed and never recorded (resting take-profits excepted). */
export const openTickets = (tickets: Ticket[]) =>
  tickets.filter(t => (t.status === 'approved' || t.status === 'placed') && !(t.status === 'placed' && isResting(t)))
