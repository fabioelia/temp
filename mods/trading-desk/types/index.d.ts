export type DeskPosition = {
  ticker: string
  qty: number
  avgCost: number | null
  last: number | null
  value: number | null
  unrealizedPct: number | null
}

export type DeskOrder = {
  id: string
  side: string
  ticker: string
  size: string
  maxPrice: number | null
  state: string
}

/** What the desk read from trading-experiment/ on its last refresh. */
export type DeskSnapshot = {
  dir: string
  asof: string
  equity: number
  pnlPct: number
  goal: number
  endDate: string
  daysLeft: number
  requiredDaily: number
  benchmark: number
  benchmarkPct: number
  maxDrawdown: number
  fills: number
  curve: number[]
  positions: DeskPosition[]
  orders: DeskOrder[]
  killSwitch: boolean
  liveEnabled: boolean
  stopped: string | null
  openTickets: string[]
  holidays: string[]
  earlyClose: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'trading-desk': {
      snapshot: Shaped<DeskSnapshot | null>
      problem: string | null
      now: number
    }
  }
}
