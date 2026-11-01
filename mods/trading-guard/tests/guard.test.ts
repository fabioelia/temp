import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { eastern, ticketRefId } from '../hooks/rules'

// Monday 2026-11-02, 14:45 EST (19:45 UTC): inside the 09:30-15:50 order window.
const MON_1445 = Date.UTC(2026, 10, 2, 19, 45)
const MON_1555 = Date.UTC(2026, 10, 2, 20, 55)

const CONFIG = JSON.stringify({
  live: { enabled: true, agent_account_last4: '5318', last_order_cutoff_et: '15:50', flatten_cutoff_et: '15:58' },
  strategy: { allow_stock_buys: false, allow_options: true },
  holidays: ['2026-11-26'],
  early_close: ['2026-11-27'],
})

const TICKETS = [
  'ticket,ts_et,date,order_id,ticker,side,usd,qty,status,reason',
  'K003,2026-10-22T14:45:26-04:00,2026-10-22,O006,SPY261120C00790000,sell,,1.000000,recorded,broker order x',
  'K004,2026-11-02T14:44:00-05:00,2026-11-02,O012,INTC261120P00072500,buy,250.00,1,approved,',
].join('\n')

function world(on: On, files: Record<string, string>, now = MON_1445) {
  mock.clock(on, { now })
  mock.store(on)
  // The engine hands $.fs absolute paths, resolved against the session's directory.
  const find = (path: string) => Object.keys(files).find(k => path === k || path.endsWith(`/${k}`))
  on('fs.exists', (_, e) => ({ value: find(e.path) !== undefined }))
  on('fs.read', (_, e) => {
    const key = find(e.path)
    if (key === undefined) throw new Error(`ENOENT ${e.path}`)
    return { value: files[key] ?? '' }
  })
  on('ui.toast', () => ({ value: undefined }))
  on('tool.call', () => ({ result: { ok: true } }))
}

const EXPERIMENT = {
  'trading-experiment/live.py': '',
  'trading-experiment/config.json': CONFIG,
  'trading-experiment/data/live_tickets.csv': TICKETS,
}

const order = (over: Record<string, unknown> = {}) => ({
  tool: 'mcp__Robinhood__place_option_order' as const,
  account_number: '000005318',
  legs: [{ option_id: 'abc', side: 'buy', position_effect: 'open' }],
  quantity: '1',
  price: '2.45',
  type: 'limit',
  ref_id: ticketRefId('K004'),
  ...over,
})

test('ref_id matches Python uuid.uuid5 as live.py computes it', async () => {
  expect(ticketRefId('K001')).toBe('52fb5bd6-f754-52c8-9ed5-071888f284ff')
  expect(ticketRefId('K010')).toBe('98583bca-e279-50c4-8f6d-637cb06d1ff4')
})

test('New York time follows the November clock change', async () => {
  expect(eastern(Date.UTC(2026, 10, 1, 4, 33)).hhmm).toBe('00:33')
  expect(eastern(Date.UTC(2026, 10, 1, 4, 33)).zone).toBe('EDT')
  expect(eastern(MON_1445).hhmm).toBe('14:45')
  expect(eastern(MON_1445).zone).toBe('EST')
})

test('an order carrying an approved same-day ticket goes through', async ($, on) => {
  world(on, EXPERIMENT)
  const ran = await $.tool.call(order())
  expect(ran.deny).toBeUndefined()
})

test('orders without a valid ticket, or outside the rules, are refused', async ($, on) => {
  world(on, EXPERIMENT)
  const cases: [Record<string, unknown>, RegExp][] = [
    [{ ref_id: undefined }, /no ref_id/],
    [{ ref_id: ticketRefId('K999') }, /matches no live.py gate ticket/],
    [{ ref_id: ticketRefId('K003') }, /is recorded, not approved/],
    [{ quantity: '2' }, /approved 1, not 2/],
    [{ price: '2.60' }, /approved \$250.00/],
    [{ type: 'market' }, /limit orders/],
    [{ legs: [{ option_id: 'abc', side: 'sell', position_effect: 'open' }] }, /never sell to open/],
    [{ legs: [{ option_id: 'a', side: 'buy', position_effect: 'open' }, { option_id: 'b', side: 'sell', position_effect: 'open' }] }, /single-leg/],
    [{ account_number: '000002202' }, /not the experiment's agent account/],
  ]
  for (const [over, why] of cases) {
    const ran = await $.tool.call(order(over))
    expect(ran.deny).toMatch(why)
  }
})

test('the kill switch halts every order', async ($, on) => {
  world(on, { ...EXPERIMENT, 'trading-experiment/KILL_SWITCH': 'owner' })
  expect((await $.tool.call(order())).deny).toMatch(/KILL_SWITCH/)
})

test('a buy after the 15:50 cutoff is refused', async ($, on) => {
  world(on, EXPERIMENT, MON_1555)
  expect((await $.tool.call(order())).deny).toMatch(/09:30 and 15:50/)
})

test('no experiment checkout: orders refused, quotes allowed', async ($, on) => {
  world(on, {})
  expect((await $.tool.call(order())).deny).toMatch(/no trading-experiment/)
  const quote = await $.tool.call({ tool: 'mcp__Robinhood__get_option_quotes', ids: ['abc'] })
  expect(quote.deny).toBeUndefined()
})

test('forbidden Robinhood tools are refused whatever the arguments', async ($, on) => {
  world(on, EXPERIMENT)
  for (const tool of ['exercise_option', 'place_crypto_order', 'place_advanced_order', 'create_alert', 'add_to_watchlist'] as const) {
    const ran = await $.tool.call({ tool: `mcp__Robinhood__${tool}`, account_number: '000005318' })
    expect(ran.deny).toMatch(/off-limits/)
  }
  const stock = await $.tool.call({ tool: 'mcp__Robinhood__place_equity_order', account_number: '000005318', symbol: 'SPY', side: 'buy', type: 'market', dollar_amount: '100' })
  expect(stock.deny).toMatch(/options only/)
})

test('the agent cannot remove the kill switch or rewrite a ledger', async ($, on) => {
  world(on, { ...EXPERIMENT, 'trading-experiment/KILL_SWITCH': 'owner' })
  expect((await $.tool.call({ tool: 'Bash', command: 'rm trading-experiment/KILL_SWITCH' })).deny).toMatch(/only the owner/)
  expect((await $.tool.call({ tool: 'Bash', command: 'git clean -fd' })).deny).toMatch(/could delete it/)
  expect((await $.tool.call({ tool: 'Bash', command: "sed -i 's/2.93/3.10/' trading-experiment/data/live_ledger.csv" })).deny).toMatch(/append-only/)
  expect((await $.tool.call({ tool: 'Bash', command: 'python3 trading-experiment/live.py status' })).deny).toBeUndefined()
  expect((await $.tool.call({ tool: 'Bash', command: 'tail -3 trading-experiment/data/ledger.csv 2>/dev/null' })).deny).toBeUndefined()

  const ledger = await $.tool.call({ tool: 'Edit', file_path: '/repo/trading-experiment/data/ledger.csv', old_string: '3.62', new_string: '3.20' })
  expect(ledger.deny).toMatch(/append-only/)
  const rewrite = await $.tool.call({ tool: 'Edit', file_path: '/repo/trading-experiment/journal.md', old_string: 'lost $80', new_string: 'lost $8' })
  expect(rewrite.deny).toMatch(/append-only/)
  const append = await $.tool.call({ tool: 'Edit', file_path: '/repo/trading-experiment/journal.md', old_string: 'end.', new_string: 'end.\n\n## 2026-11-02 Run A' })
  expect(append.deny).toBeUndefined()
})

test('a resting take-profit ticket allows only its GTC sell at or above its level', async ($, on) => {
  const tickets = `${TICKETS}\nK005,2026-11-02T17:20:00-05:00,2026-11-02,,INTC261120P00072500,sell,resting,1,approved,resting GTC take-profit @ 3.70`
  world(on, { ...EXPERIMENT, 'trading-experiment/data/live_tickets.csv': tickets }, Date.UTC(2026, 10, 2, 22, 25))
  const sell = (over: Record<string, unknown>) =>
    order({ ref_id: ticketRefId('K005'), legs: [{ option_id: 'abc', side: 'sell', position_effect: 'close' }], time_in_force: 'gtc', price: '3.70', ...over })
  expect((await $.tool.call(sell({}))).deny).toBeUndefined()
  expect((await $.tool.call(sell({ price: '3.10' }))).deny).toMatch(/rests at 3.7/)
  expect((await $.tool.call(sell({ time_in_force: 'gfd' }))).deny).toMatch(/GTC sell to close/)
})

test('a turn that ends with an open gate ticket gets one reminder to reconcile it', async ($, on) => {
  world(on, EXPERIMENT)
  const asked: string[] = []
  on('prompt.submit', (_, e) => {
    asked.push(e.text)
    return { text: e.text }
  })
  on('turn.complete', (_, e) => ({ text: e.answer }))
  const end = { answer: 'done', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as const
  await $.turn.complete(end)
  await $.turn.complete({ ...end, turnId: 't2' })
  expect(asked.length).toBe(1)
  expect(asked[0]).toContain('K004 (O012 buy INTC261120P00072500, approved 2026-11-02)')
})
