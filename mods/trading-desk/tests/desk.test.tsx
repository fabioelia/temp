import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

// Monday 2026-11-02, 15:42 EST: eight minutes before the 15:50 order cutoff.
const MON_1542 = Date.UTC(2026, 10, 2, 20, 42)

const FILES: Record<string, string> = {
  'trading-experiment/tracker.py': '',
  'trading-experiment/config.json': JSON.stringify({ live: { enabled: true }, holidays: ['2026-11-26'], early_close: ['2026-11-27'] }),
  'trading-experiment/data/export/summary.json': JSON.stringify([
    {
      asof: '2026-10-30',
      equity: 1919.92,
      pnl_pct: -0.04,
      goal: 2200,
      end_date: '2026-11-18',
      trading_days_left: 13,
      required_daily_return: 0.0105,
      benchmark_value: 1970.94,
      benchmark_pnl_pct: -0.0145,
      max_drawdown: -0.1093,
      fills: 2,
    },
  ]),
  'trading-experiment/data/export/equity.json': JSON.stringify([
    { date: '2026-10-16', equity: 2000 },
    { date: '2026-10-21', equity: 2155.46 },
    { date: '2026-10-22', equity: 1919.92 },
    { date: '2026-11-18', equity: null },
  ]),
  'trading-experiment/data/export/positions.json': '[]',
  'trading-experiment/data/export/orders.json': JSON.stringify([
    { id: 'O011', side: 'buy', ticker: 'INTC261120P00072500', size: '1 sh', max_price: 3, status: 'pending', state: 'Proposal, not yet confirmed' },
    { id: 'O010', side: 'buy', ticker: 'GOOGL261120P00280000', size: '1 sh', max_price: 4, status: 'cancelled', state: '' },
  ]),
  'trading-experiment/data/live_tickets.csv': 'ticket,ts_et,date,order_id,ticker,side,usd,qty,status,reason\nK003,x,2026-10-22,O006,SPY261120C00790000,sell,,1,recorded,ok\n',
}

function world(on: On, files: Record<string, string>) {
  const clock = mock.clock(on, { now: MON_1542 })
  const find = (path: string) => Object.keys(files).find(k => path === k || path.endsWith(`/${k}`))
  on('fs.exists', (_, e) => ({ value: find(e.path) !== undefined }))
  on('fs.read', (_, e) => {
    const key = find(e.path)
    if (key === undefined) throw new Error(`ENOENT ${e.path}`)
    return { value: files[key] ?? '' }
  })
  on('fs.write', (_, e) => {
    files[e.path] = e.text
    return { value: undefined }
  })
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  return clock
}

const pane = (surface: 'terminal' | 'desktop' | 'vscode' | 'mobile') =>
  ({
    plugin: 'trading-desk',
    surface,
    component: 'Pane',
    requestId: 'trading-desk',
    props: { title: 'Trading desk', isFocused: false, bodyColumns: 44, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
  }) as const

const band = (surface: 'terminal' | 'desktop') =>
  ({
    plugin: 'trading-desk',
    surface,
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 80, scroll: { offset: 0, bodyRows: 10 }, view: {} },
  }) as const

test('the desk shows the scoreboard, the clock and pending orders on every surface', async ($, on) => {
  world(on, { ...FILES })
  await $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount(pane(surface))
    expect((await ui.find({ type: 'Text', text: /\$1,919\.92/ }))?.text).toContain('-4.00%')
    expect((await ui.find({ type: 'Text', text: /^SPY/ }))?.text).toContain('-2.6 pts')
    expect((await ui.find({ type: 'Text', text: /15:42 EST/ }))?.text).toContain('order cutoff 15:50 in 8m')
    expect((await ui.find({ type: 'Text', text: /Next run/ }))?.text).toContain('post-close, today 17:13')
    expect((await ui.find({ type: 'Text', text: /O011/ }))?.text).toContain('INTC 11/20 72.5P')
    expect(await ui.find({ type: 'Text', text: /O010/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /All cash/ })).toBeDefined()
    await ui.unmount()
  }
})

test('the band stays empty until something needs the owner, then names it', async ($, on) => {
  const files = { ...FILES }
  world(on, files)
  // The engine's own band, beneath the plugin: what shows when the desk has nothing to say.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })

  const quiet = await $.ui.mount(band('terminal'))
  expect(await quiet.find({ type: 'Text', text: /KILL SWITCH/ })).toBeUndefined()
  expect(await quiet.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await quiet.unmount()

  const ran = await $.command.run({
    command: 'kill-switch',
    args: 'testing the stop',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 120 },
  })
  expect(ran.text).toContain('Committed and pushed')
  expect(Object.entries(files).find(([k]) => k.endsWith('KILL_SWITCH'))?.[1]).toContain('Reason: testing the stop')

  for (const surface of ['terminal', 'desktop'] as const) {
    const loud = await $.ui.mount(band(surface))
    expect(await loud.find({ type: 'Text', text: /KILL SWITCH ENGAGED/ })).toBeDefined()
    await loud.unmount()
  }
})

test('outside the experiment the pane says so', async ($, on) => {
  world(on, {})
  await $.session.start({ cwd: '/elsewhere', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount(pane('desktop'))
  expect(await ui.find({ type: 'Text', text: /No trading-experiment/ })).toBeDefined()
  await ui.unmount()
})
