import type { EngineInterface, Register } from 'claude-code'

import {
  eastern,
  judgeBash,
  judgeEdit,
  judgeRobinhood,
  judgeWrite,
  isJournal,
  isLedger,
  openTickets,
  parseCsv,
  PLACES_ORDERS,
  robinhoodTool,
} from './rules'
import type { Config, Experiment, Ticket, Verdict } from './rules'

type Decision = { at: number; tool: string; allowed: boolean; why: string }

const LOG_KEY = 'decisions'
const LOG_MAX = 100

/** The experiment's folder under the session's working directory, if this checkout has one. */
async function findDir($: EngineInterface): Promise<string | undefined> {
  for (const dir of ['trading-experiment', '.']) {
    if ((await $.fs.exists(`${dir}/live.py`)) && (await $.fs.exists(`${dir}/config.json`))) return dir
  }
  return undefined
}

/** Reads what the rules judge against, fresh on every call: the files change under the session. */
async function loadExperiment($: EngineInterface): Promise<Experiment | undefined> {
  const dir = await findDir($)
  if (dir === undefined) return undefined
  const config = JSON.parse(await $.fs.read(`${dir}/config.json`)) as Config
  const ticketsPath = `${dir}/data/live_tickets.csv`
  const tickets = (await $.fs.exists(ticketsPath)) ? (parseCsv(await $.fs.read(ticketsPath)) as Ticket[]) : []
  const killSwitch = await $.fs.exists(`${dir}/KILL_SWITCH`)
  return { dir, config, tickets, killSwitch }
}

async function remember($: EngineInterface, d: Decision) {
  const log = ((await $.store.get(LOG_KEY)) as Decision[] | undefined) ?? []
  await $.store.set(LOG_KEY, [...log, d].slice(-LOG_MAX))
}

const name = (tool: string) => robinhoodTool(tool) ?? tool

export const register: Register = on => {
  /** Ticket sets the end-of-turn reminder already raised, so it asks once per set. */
  const nudged = new Set<string>()

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'trading-guard',
      description: 'Show what the trading guard enforces here and its recent decisions',
    })
    return next(e)
  })

  // Robinhood: every call is judged; an order-placing call the guard cannot judge is refused.
  on('tool.call', async ($, e, next) => {
    const tool = robinhoodTool(e.tool)
    if (tool === undefined) return next(e)

    const exp = await loadExperiment($)
    const verdict: Verdict = judgeRobinhood(tool, e as Record<string, unknown>, exp, await $.clock.now())
    const isOrder = PLACES_ORDERS.has(tool)

    if (!verdict.ok) {
      await remember($, { at: await $.clock.now(), tool, allowed: false, why: verdict.reason })
      $.ui.toast(`trading-guard blocked ${tool}: ${verdict.reason}`, { timeoutMs: 8000 })
      return { deny: `trading-guard: ${verdict.reason}` }
    }
    if (!isOrder) return next(e)

    await remember($, { at: await $.clock.now(), tool, allowed: true, why: `ticket ${verdict.ticket ?? '?'}` })
    const ran = await next(e)
    if (ran.deny === undefined && ran.isError !== true && verdict.ticket !== undefined) {
      return {
        ...ran,
        context: [
          ...(ran.context ?? []),
          `trading-guard: the order went out under gate ticket ${verdict.ticket}. Next: \`live.py placed --ticket ${verdict.ticket} --broker-order-id <id>\`, then confirm the execution and \`live.py record\` (or \`live.py fail\`).`,
        ],
      }
    }
    return ran
  }).catch(($, e, next) =>
    next.called
      ? next(e)
      : PLACES_ORDERS.has(robinhoodTool(e.tool) ?? '')
        ? { deny: 'trading-guard: the guard could not check this order, so it is refused (fail closed).' }
        : next(e),
  )

  // Kill switch and ledgers: shell commands.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (!/KILL_SWITCH|trading-experiment|\.csv|live_state|git\s/.test(e.command)) return next(e)
    const dir = await findDir($)
    const killSwitch = dir !== undefined && (await $.fs.exists(`${dir}/KILL_SWITCH`))
    const verdict = judgeBash(e.command, killSwitch)
    if (verdict.ok) return next(e)
    await remember($, { at: await $.clock.now(), tool: 'Bash', allowed: false, why: verdict.reason })
    return { deny: `trading-guard: ${verdict.reason}` }
  })

  // Ledgers and journal: file edits.
  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const verdict = judgeEdit(e.file_path, e.old_string, e.new_string, e.replace_all === true)
    if (verdict.ok) return next(e)
    await remember($, { at: await $.clock.now(), tool: 'Edit', allowed: false, why: verdict.reason })
    return { deny: `trading-guard: ${verdict.reason}` }
  })

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    if (!isLedger(e.file_path) && !isJournal(e.file_path)) return next(e)
    const current = (await $.fs.exists(e.file_path)) ? await $.fs.read(e.file_path) : undefined
    const verdict = judgeWrite(e.file_path, current, e.content)
    if (verdict.ok) return next(e)
    await remember($, { at: await $.clock.now(), tool: 'Write', allowed: false, why: verdict.reason })
    return { deny: `trading-guard: ${verdict.reason}` }
  })

  // A run must not end with a gate ticket left open (LIVE_MODE.md: reconcile before anything else).
  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId !== undefined || e.reason !== 'answer') return done
    const exp = await loadExperiment($)
    const open = exp === undefined ? [] : openTickets(exp.tickets)
    const key = open.map(t => `${t.ticket}:${t.status}`).join(',')
    if (open.length === 0 || nudged.has(key)) return done
    nudged.add(key)
    const list = open.map(t => `${t.ticket} (${t.order_id} ${t.side} ${t.ticker}, ${t.status} ${t.date})`).join('; ')
    $.ui.toast(`trading-guard: open gate tickets: ${list}`, { timeoutMs: 10000 })
    void $.prompt.submit({
      text:
        `trading-guard: these live.py gate tickets are still open: ${list}. ` +
        'Before this run ends, reconcile each with the broker (get_option_orders on the agent account): ' +
        '`live.py placed` if it was sent, `live.py record` once filled, or cancel it at the broker and `live.py fail --reason ...`. ' +
        'Never re-place an order without checking the broker first. If a ticket must stay open, say why in the journal.',
    })
    return done
  })

  on('command.run', { command: 'trading-guard' }, async $ => {
    const exp = await loadExperiment($)
    const now = await $.clock.now()
    const et = eastern(now)
    const log = (((await $.store.get(LOG_KEY)) as Decision[] | undefined) ?? []).slice(-12)
    const lines = [
      `trading-guard, ${et.date} ${et.hhmm} ${et.zone}`,
      exp === undefined
        ? 'No trading-experiment/ checkout here: every Robinhood order is refused; reads are allowed.'
        : [
            `Experiment: ${exp.dir}/ · live ${exp.config.live?.enabled === true ? 'enabled' : 'DISABLED'} · agent account ••••${exp.config.live?.agent_account_last4 ?? '?'}`,
            `Kill switch: ${exp.killSwitch ? 'ENGAGED (all real orders refused)' : 'off'}`,
            `Open tickets: ${openTickets(exp.tickets).map(t => `${t.ticket} ${t.status}`).join(', ') || 'none'}`,
          ].join('\n'),
      '',
      'Enforced: Robinhood orders need an approved, same-day live.py ticket (ref_id, side, size, premium, cutoff); single-leg buy-to-open / sell-to-close limits only; agent account only; no crypto, exercise, advanced orders or watchlist/alert/scan writes; KILL_SWITCH cannot be removed by the agent; ledgers and journal stay append-only.',
      '',
      log.length === 0 ? 'No decisions yet.' : 'Recent decisions:',
      ...log.map(d => `  ${eastern(d.at).date} ${eastern(d.at).hhmm} ${d.allowed ? 'allowed' : 'BLOCKED'} ${name(d.tool)}: ${d.why}`),
    ]
    return { text: lines.join('\n') }
  })
}
