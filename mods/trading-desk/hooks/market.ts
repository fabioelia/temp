// Pure helpers of the trading desk: New York time, the session's phase, the
// routine's next run, and the formatting the pane and status line share.

/** US Eastern daylight time: 2nd Sunday of March 02:00 to 1st Sunday of November 02:00. */
function isEasternDst(utcMs: number): boolean {
  const y = new Date(utcMs).getUTCFullYear()
  const march1 = new Date(Date.UTC(y, 2, 1)).getUTCDay()
  const start = Date.UTC(y, 2, 1 + ((7 - march1) % 7) + 7, 7)
  const nov1 = new Date(Date.UTC(y, 10, 1)).getUTCDay()
  const end = Date.UTC(y, 10, 1 + ((7 - nov1) % 7), 6)
  return utcMs >= start && utcMs < end
}

export type Eastern = { date: string; minutes: number; weekday: number; hhmm: string; zone: 'EDT' | 'EST' }

const pad = (n: number) => String(n).padStart(2, '0')

export function eastern(utcMs: number): Eastern {
  const dst = isEasternDst(utcMs)
  const d = new Date(utcMs + (dst ? -4 : -5) * 3_600_000)
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
    weekday: d.getUTCDay(),
    hhmm: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    zone: dst ? 'EDT' : 'EST',
  }
}

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const clock = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

export function duration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${pad(m)}m`
}

export type Tone = 'success' | 'warning' | 'error' | 'subtle'
export type Phase = { label: string; detail: string; tone: Tone; cutoffIn?: number }

const OPEN = 9 * 60 + 30

/** Where the NYSE session stands, with the experiment's 10-minutes-before-close order cutoff. */
export function marketPhase(utcMs: number, holidays: readonly string[], earlyClose: readonly string[]): Phase {
  const et = eastern(utcMs)
  if (et.weekday === 0 || et.weekday === 6) return { label: 'closed', detail: 'weekend', tone: 'subtle' }
  if (holidays.includes(et.date)) return { label: 'closed', detail: 'NYSE holiday', tone: 'subtle' }
  const close = earlyClose.includes(et.date) ? 13 * 60 : 16 * 60
  const cutoff = close - 10
  const m = et.minutes
  if (m < OPEN) return { label: 'pre-market', detail: `opens in ${duration(OPEN - m)}`, tone: 'subtle' }
  if (m < cutoff) {
    const left = cutoff - m
    return { label: 'open', detail: `order cutoff ${clock(cutoff)} in ${duration(left)}`, tone: left <= 15 ? 'warning' : 'success', cutoffIn: left }
  }
  if (m < close) return { label: 'closing', detail: `past the ${clock(cutoff)} order cutoff`, tone: 'warning' }
  return { label: 'closed', detail: 'after the close', tone: 'subtle' }
}

/** The four scheduled runs of DAILY_ROUTINE.md, New York time. */
const RUNS = [
  { days: [1, 2, 3, 4, 5], at: 9 * 60 + 13, name: 'pre-open news' },
  { days: [1, 2, 3, 4, 5], at: 14 * 60 + 43, name: 'pre-close decision' },
  { days: [1, 2, 3, 4, 5], at: 17 * 60 + 13, name: 'post-close' },
  { days: [0], at: 18 * 60 + 22, name: 'weekly review' },
] as const

export function nextRun(utcMs: number): { name: string; when: string; inMinutes: number } {
  const et = eastern(utcMs)
  for (let offset = 0; offset <= 7; offset++) {
    const weekday = (et.weekday + offset) % 7
    const due = RUNS.filter(r => (r.days as readonly number[]).includes(weekday) && (offset > 0 || r.at > et.minutes)).sort(
      (a, b) => a.at - b.at,
    )[0]
    if (due !== undefined) {
      const day = offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : DAYS[weekday]
      return { name: due.name, when: `${day} ${clock(due.at)}`, inMinutes: offset * 1440 + due.at - et.minutes }
    }
  }
  return { name: 'none', when: '', inMinutes: 0 }
}

export function money(n: number): string {
  const sign = n < 0 ? '-' : ''
  const [whole = '0', cents = '00'] = Math.abs(n).toFixed(2).split('.')
  return `${sign}$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`
}

export const percent = (fraction: number, digits = 2) => `${fraction >= 0 ? '+' : ''}${(fraction * 100).toFixed(digits)}%`

const BLOCKS = '▁▂▃▄▅▆▇█'

export function sparkline(values: readonly number[], width = 24): string {
  const tail = values.slice(-width)
  if (tail.length < 2) return ''
  const lo = Math.min(...tail)
  const hi = Math.max(...tail)
  return tail.map(v => BLOCKS[hi === lo ? 3 : Math.round(((v - lo) / (hi - lo)) * 7)] ?? '▁').join('')
}

/** OCC option symbol to something readable: INTC261120P00072500 -> INTC 11/20 72.5P. */
export function contract(ticker: string): string {
  const m = /^([A-Z.]{1,6})(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/.exec(ticker)
  if (!m) return ticker
  const strike = Number(m[6]) / 1000
  return `${m[1]} ${m[3]}/${m[4]} ${strike}${m[5]}`
}

/** RFC 4180 CSV to rows keyed by the header. */
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
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  const [head, ...body] = rows.filter(r => r.length > 1 || r[0] !== '')
  if (head === undefined) return []
  return body.map(r => Object.fromEntries(head.map((k, j) => [k, r[j] ?? ''])))
}
