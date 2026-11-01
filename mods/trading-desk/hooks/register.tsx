import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { DeskOrder, DeskPosition, DeskSnapshot } from '../types'
import { contract, DAYS, eastern, marketPhase, money, nextRun, parseCsv, percent, sparkline } from './market'

const PANE = 'trading-desk'
// Change the tag when DeskSnapshot's fields change: a reload declines the old value.
const snapshot = atom({ plugin: 'trading-desk', key: 'snapshot' } as const, null, { shape: 'snapshot-1' })
const problem = atom({ plugin: 'trading-desk', key: 'problem' } as const, null)
const now = atom({ plugin: 'trading-desk', key: 'now' } as const, 0)

type Json = Record<string, unknown>
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const text = (v: unknown) => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v))

async function findDir($: EngineInterface): Promise<string | undefined> {
  for (const dir of ['trading-experiment', '.']) {
    if ((await $.fs.exists(`${dir}/tracker.py`)) && (await $.fs.exists(`${dir}/config.json`))) return dir
  }
  return undefined
}

async function readJson<T>($: EngineInterface, path: string, fallback: T): Promise<T> {
  return (await $.fs.exists(path)) ? (JSON.parse(await $.fs.read(path)) as T) : fallback
}

/** Reads the scoreboard the tracker exports, plus the live-mode files the gate writes. */
async function loadSnapshot($: EngineInterface): Promise<DeskSnapshot | null> {
  const dir = await findDir($)
  if (dir === undefined) return null
  const config = await readJson<Json>($, `${dir}/config.json`, {})
  const live = (config.live ?? {}) as Json
  const s = (await readJson<Json[]>($, `${dir}/data/export/summary.json`, []))[0] ?? {}
  const curve = (await readJson<Json[]>($, `${dir}/data/export/equity.json`, []))
    .map(r => r.equity)
    .filter((v): v is number => typeof v === 'number')
  const positions: DeskPosition[] = (await readJson<Json[]>($, `${dir}/data/export/positions.json`, [])).map(p => ({
    ticker: text(p.ticker),
    qty: num(p.qty),
    avgCost: numOrNull(p.avg_cost),
    last: numOrNull(p.last),
    value: numOrNull(p.value),
    unrealizedPct: numOrNull(p.unrealized_pct),
  }))
  const orders: DeskOrder[] = (await readJson<Json[]>($, `${dir}/data/export/orders.json`, []))
    .filter(o => o.status === 'pending')
    .map(o => ({
      id: text(o.id),
      side: text(o.side),
      ticker: text(o.ticker),
      size: text(o.size),
      maxPrice: numOrNull(o.max_price),
      state: text(o.state),
    }))
  const ticketsPath = `${dir}/data/live_tickets.csv`
  const tickets = (await $.fs.exists(ticketsPath)) ? parseCsv(await $.fs.read(ticketsPath)) : []
  const openTickets = tickets
    .filter(t => {
      const resting = (t.reason ?? '').startsWith('resting GTC take-profit') || t.usd === 'resting'
      return (t.status === 'approved' || t.status === 'placed') && !(t.status === 'placed' && resting)
    })
    .map(t => `${t.ticket} ${t.status}`)
  const state = await readJson<Json>($, `${dir}/data/live_state.json`, {})

  return {
    dir,
    asof: text(s.asof),
    equity: num(s.equity),
    pnlPct: num(s.pnl_pct),
    goal: num(s.goal),
    endDate: text(s.end_date),
    daysLeft: num(s.trading_days_left),
    requiredDaily: num(s.required_daily_return),
    benchmark: num(s.benchmark_value),
    benchmarkPct: num(s.benchmark_pnl_pct),
    maxDrawdown: num(s.max_drawdown),
    fills: num(s.fills),
    curve,
    positions,
    orders,
    killSwitch: await $.fs.exists(`${dir}/KILL_SWITCH`),
    liveEnabled: live.enabled === true,
    stopped: state.stopped === true ? text(state.reason) || 'stopped' : null,
    openTickets,
    holidays: Array.isArray(config.holidays) ? config.holidays.map(text) : [],
    earlyClose: Array.isArray(config.early_close) ? config.early_close.map(text) : [],
  }
}

function statusLine(snap: DeskSnapshot, nowMs: number): string {
  const et = eastern(nowMs)
  const phase = marketPhase(nowMs, snap.holidays, snap.earlyClose)
  const gap = (snap.pnlPct - snap.benchmarkPct) * 100
  return [
    snap.killSwitch ? 'KILL SWITCH ON' : undefined,
    `${DAYS[et.weekday]} ${et.hhmm} ${et.zone} ${phase.label}${phase.cutoffIn !== undefined ? ` (cutoff ${phase.detail.split(' in ')[1]})` : ''}`,
    `${money(snap.equity)} ${percent(snap.pnlPct, 1)}`,
    `${gap >= 0 ? '+' : ''}${gap.toFixed(1)} pts vs SPY`,
  ]
    .filter(Boolean)
    .join(' · ')
}

let warnedCutoff = ''

async function refresh($: EngineInterface) {
  const at = await $.clock.now()
  try {
    const snap = await loadSnapshot($)
    await update($, snapshot, () => snap)
    await update($, problem, () => null)
    $.ui.status(snap === null ? undefined : statusLine(snap, at))
  } catch (err) {
    await update($, problem, () => `Could not read the experiment: ${err instanceof Error ? err.message : String(err)}`)
  }
  await update($, now, () => at)
}

async function tick($: EngineInterface) {
  await refresh($)
  const snap = await read($, snapshot)
  if (snap === null) return
  const at = await $.clock.now()
  const phase = marketPhase(at, snap.holidays, snap.earlyClose)
  const today = eastern(at).date
  if (phase.cutoffIn !== undefined && phase.cutoffIn <= 10 && warnedCutoff !== today) {
    warnedCutoff = today
    $.ui.toast(`${phase.cutoffIn} min to the order cutoff: confirm or cancel today's proposals now.`, { timeoutMs: 10000 })
  }
}

/** The owner's stop: KILL_SWITCH written, committed and pushed, as LIVE_MODE.md asks. */
async function engageKillSwitch($: EngineInterface, reason: string): Promise<string> {
  const dir = await findDir($)
  if (dir === undefined) return 'No trading-experiment/ checkout here, so there is nothing to stop from this session.'
  const path = `${dir}/KILL_SWITCH`
  if (await $.fs.exists(path)) return 'The kill switch is already engaged.'
  const et = eastern(await $.clock.now())
  await $.fs.write(
    path,
    `Engaged by the owner from the trading desk, ${et.date} ${et.hhmm} ${et.zone}.\nReason: ${reason}\n` +
      'Every real order is refused while this file exists. Only the owner removes it (RULES.md, LIVE_MODE.md).\n',
  )
  const lines = [`KILL_SWITCH written to ${path}: every real order is now refused.`]
  const git = (args: string[]) => $.process.run(['git', ...args], { timeoutMs: 60_000 })
  const added = await git(['add', '--', path])
  const committed = added.exitCode === 0 ? await git(['commit', '-m', `KILL_SWITCH: owner stop (${reason})`, '--', path]) : added
  if (committed.exitCode !== 0) {
    lines.push(`Not committed: ${(committed.stderr || committed.stdout).trim().slice(0, 300)}`)
  } else {
    const pushed = await git(['push', 'origin', 'HEAD'])
    lines.push(
      pushed.exitCode === 0
        ? 'Committed and pushed, so every scheduled run sees it after its git pull.'
        : `Committed but not pushed: ${pushed.stderr.trim().slice(0, 300)}. Add the file on GitHub too ("Add file" on the experiment branch).`,
    )
  }
  await refresh($)
  return lines.join('\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'desk', description: 'Open the trading desk: scoreboard, market clock, orders and kill switch' })
    await $.command.register({
      name: 'kill-switch',
      description: "Owner's stop: write, commit and push trading-experiment/KILL_SWITCH so no real order goes out",
      argumentHint: '[reason]',
      immediate: true,
    })
    await refresh($)
    if ((await read($, snapshot)) !== null) void $.ui.open({ id: PANE, title: 'Trading desk' })
    $.clock.every(60_000, () => void tick($))
    return next(e)
  })

  // The tracker, the gate and git move the files the desk reads: re-read after them.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (/tracker\.py|live\.py|KILL_SWITCH|git\s+(pull|checkout|fetch|reset|merge|switch)/.test(e.command)) await refresh($)
    return ran
  })

  on('command.run', { command: 'desk' }, async $ => {
    await refresh($)
    const opened = await $.ui.open({ id: PANE, title: 'Trading desk' })
    if ((await read($, snapshot)) === null) return { text: 'No trading-experiment/ folder in this checkout. Check out the experiment branch to use the desk.' }
    return { text: opened.isPlaced ? 'Trading desk opened.' : `Trading desk is waiting for room: ${opened.reason}` }
  })

  on('command.run', { command: 'kill-switch' }, async ($, e) => {
    const reason = e.args.trim() || 'owner stop'
    const result = await engageKillSwitch($, reason)
    return {
      text: result,
      context: [
        'The owner engaged the trading kill switch. Make no real orders, place nothing through Robinhood, and never remove or move trading-experiment/KILL_SWITCH: only the owner does that.',
      ],
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const snap = await read($, snapshot)
    if (e.props.hasSurvey || snap === null) return next(e)
    const alerts = [
      snap.killSwitch ? { tone: 'error', line: 'KILL SWITCH ENGAGED: every real order is refused until the owner removes trading-experiment/KILL_SWITCH.' } : undefined,
      snap.stopped !== null ? { tone: 'error', line: `Loss limit tripped: ${snap.stopped}` } : undefined,
      snap.openTickets.length > 0 ? { tone: 'warning', line: `Open gate tickets: ${snap.openTickets.join(', ')}. Reconcile them with the broker.` } : undefined,
    ].filter(a => a !== undefined)
    if (alerts.length === 0) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {alerts.map(a => (
          <Text color={a.tone}>{a.line}</Text>
        ))}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const snap = await read($, snapshot)
    const trouble = await read($, problem)
    const at = (await read($, now)) || (await $.clock.now())

    if (snap === null) {
      return (
        <Box flexDirection="column">
          {trouble !== null && <Text color="warning">{trouble}</Text>}
          <Text dimColor>No trading-experiment/ folder in this checkout.</Text>
          <Text dimColor>Open the session on the experiment branch to see the desk.</Text>
        </Box>
      )
    }

    const et = eastern(at)
    const phase = marketPhase(at, snap.holidays, snap.earlyClose)
    const run = nextRun(at)
    const gap = (snap.pnlPct - snap.benchmarkPct) * 100
    const spark = sparkline(snap.curve, Math.max(8, Math.min(30, e.props.bodyColumns - 2)))

    return (
      <Box flexDirection="column">
        {trouble !== null && <Text color="warning">{trouble}</Text>}
        <Text bold>
          {money(snap.equity)} <Text color={snap.pnlPct >= 0 ? 'success' : 'error'}>{percent(snap.pnlPct)}</Text>
        </Text>
        <Text>
          SPY {money(snap.benchmark)} <Text dimColor>{percent(snap.benchmarkPct)}</Text>{' '}
          <Text color={gap >= 0 ? 'success' : 'error'}>
            {gap >= 0 ? '+' : ''}
            {gap.toFixed(1)} pts
          </Text>
        </Text>
        {spark !== '' && <Text color="claude">{spark}</Text>}
        <Text dimColor>
          Goal {money(snap.goal)} by {snap.endDate} · {snap.daysLeft} sessions · needs {percent(snap.requiredDaily)}/day
        </Text>
        <Text dimColor>
          Max drawdown {percent(snap.maxDrawdown, 1)} · {snap.fills} fills
        </Text>
        <Text> </Text>
        <Text>
          {DAYS[et.weekday]} {et.hhmm} {et.zone} · <Text color={phase.tone}>{phase.label}</Text> · {phase.detail}
        </Text>
        <Text dimColor>
          Next run: {run.name}, {run.when}
        </Text>
        <Text>
          Kill switch <Text color={snap.killSwitch ? 'error' : 'success'}>{snap.killSwitch ? 'ENGAGED' : 'off'}</Text> · live{' '}
          {snap.liveEnabled ? 'on' : 'off'} · tickets {snap.openTickets.length === 0 ? 'none open' : snap.openTickets.join(', ')}
        </Text>
        {snap.stopped !== null && <Text color="error">Loss limit tripped: {snap.stopped}</Text>}
        <Text> </Text>
        <Text bold>Positions</Text>
        {snap.positions.length === 0 ? (
          <Text dimColor>All cash.</Text>
        ) : (
          snap.positions.map(p => (
            <Text>
              {contract(p.ticker)} ×{p.qty} {p.value !== null ? money(p.value) : ''}{' '}
              {p.unrealizedPct !== null && (
                <Text color={p.unrealizedPct >= 0 ? 'success' : 'error'}>{percent(p.unrealizedPct, 1)}</Text>
              )}
            </Text>
          ))
        )}
        <Text bold>Pending orders</Text>
        {snap.orders.length === 0 ? (
          <Text dimColor>None.</Text>
        ) : (
          snap.orders.map(o => (
            <Text>
              {o.id} {o.side} {contract(o.ticker)}
              {o.maxPrice !== null ? ` ≤${o.maxPrice}` : ''} <Text dimColor>{o.state}</Text>
            </Text>
          ))
        )}
        <Text> </Text>
        <Text dimColor>
          Scoreboard as of {snap.asof} · read {et.hhmm}
        </Text>
        <Box flexDirection="row" gap={1}>
          <Button key="refresh" label="Refresh" onPress={() => void refresh($)} />
          {!snap.killSwitch && (
            <Button
              key="kill"
              label="Kill switch"
              onPress={async () => {
                const answer = await $.ui.ask('Engage the kill switch? Every real order stops until you remove the file yourself.', [
                  'Engage the kill switch',
                  'Cancel',
                ])
                if (answer === 'Engage the kill switch') $.ui.toast(await engageKillSwitch($, 'pressed on the trading desk'), { timeoutMs: 10000 })
              }}
            />
          )}
        </Box>
      </Box>
    )
  })
}
