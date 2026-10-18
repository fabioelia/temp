# Journal (append-only, newest at the bottom)

## Day 0, Saturday 2026-10-17: committee session, no fills yet

**Setup.** $2,000 simulated, goal $4,000 by 2026-11-18. Six research agents ran in parallel: macro (Druckenmiller/Soros), momentum (Livermore/O'Neil/Minervini),
event/catalyst, contrarian (Burry/Klarman), market historian, and risk/quant. Memos are in `research/2026-10-17/`. Page fetching was blocked for every agent, so all
figures are search-snippet level and each memo flags what is unverified. Prices below are Friday 10/16 reference levels only; nothing fills until Monday's close.

**Tape.** S&P 7,659.44 (-1.1%), Nasdaq 26,140.03 (-2.1%), Dow 52,002.41. Semis down 8 sessions in a row; CoreWeave -12%; energy sector +2.5%; WTI ~$101, Brent ~$110;
10y ~5.09%; Fed hiked 9/16; CPI 3.7%; payrolls +29k; VIX ~21-22.

**Votes.**
| Idea | Macro | Momentum | Catalyst | Contrarian | Historian | Risk | Outcome |
|---|---|---|---|---|---|---|---|
| XLE core | 6 | 6 | 4 (post-print) | winner if AI unwinds | n/a | template: liquid beta ETF | **Adopted, Monday** |
| 2x energy (GUSH/ERX) | 5 | 3 | n/a | n/a | n/a | 3x/2x cap 15% | **Adopted small, Monday** |
| NVDA bounce | avoid until credit stabilises | skip AI/semis | 5, after 10/21 prints | 6, buy now | n/a | n/a | **Deferred**: needs flip signals or the 10/21 evening review |
| SOXL bounce | conditional | skip | 3 | 4 | 3 | cap 15% | **Conditional** on a follow-through day |
| SQQQ hedge | 5 on a relief bounce | n/a | n/a | 5 on a relief bounce | n/a | n/a | **Conditional**: shares a failure mode with XLE (Iran deal plus AI relief) |
| COP / VLO breakouts | n/a | 5 / 4 | n/a | n/a | n/a | n/a | Not now: same theme as XLE |

**Honest odds from the committee.** Macro ~4%, momentum 1-2% for its plan, contrarian ~5%, catalyst 3-7%, historian ~4% (disciplined bold) and ~1% (conventional), risk 0-5%
with a 2-14% chance of losing half on aggressive routes. A single month cannot show skill (rejecting zero edge in 22 days needs a Sharpe near 5.8), so the scoreboard also tracks
SPY buy-and-hold, drawdown, win rate and payoff.

**Decision (CIO).** Bounded convexity. Core in the one leading sector, a small leveraged sleeve for the 2x shot, the rest in cash until the bounce is confirmed. Queued for the
Monday 10/19 close:
* O001 buy XLE $350 (17.5%), max price 69.50, closing stop 64.00, target 74.00.
* O002 buy GUSH $200 (10%, counts 2x against the 40% energy theme cap), stop -12% and target +25% of the actual fill.
Deployed 27.5% (limit 30% Monday); energy theme 37.5% including leverage (limit 40%); planned risk to stops ~2.4% of equity before overshoot.

**Why not more.** Macro's "pay-to-wait week", momentum's "40-50% invested, energy only", and risk's staging rule all point the same way, and the goal pace (+3.2% a day) does not
justify taking the first fill at full size into a tape with a 7-day-old oil run, a chip rout, and an FOMC in nine sessions.

**Open items for the first run.** Verify Monday's closes for XLE and GUSH (GUSH was never price-checked); verify SPY's 10/19 close for the benchmark. Sunday evening's review may cancel
or amend O001/O002 using weekend news (Hormuz headlines are the swing factor).

**Fee numbers adopted** (from the risk memo's search extracts): $0 commission, SEC fee $20.60 per $1M sold (since 4/4/2026, waived on sales of $500 or less), FINRA TAF
$0.000195/share (max $9.79, waived on 50 shares or less). At this size they are cents; slippage by tier is the cost that matters.

**Setup notes (Day 0).** `tracker.py` self-tested on synthetic prices in a scratch copy only (cap of 4 fills, same-day round-trip block, no shorting, stop auto-queue, fees and
waivers, idempotent reruns); the real ledger is empty. Dashboard artifact created and loaded with the baseline (all cash, two queued orders); it had not been opened yet, so
its rendering is unverified. Schedules created: weekday close 17:13 ET, Sunday review 18:22 ET. The Day-0 risk red-team was the risk memo's own sizing template, applied to the
two orders above; the daily routine adds a separate red-team pass.

**Amendment, Day 0 (user challenge: "why lock in buys early; shouldn't each run re-evaluate whether it is still the best bet?").** Correct. O001 (XLE) and O002 (GUSH) were written on
Saturday, but the tracker treated them as binding and would have filled them at Monday's close with no further look, three days of news later. Fixed the same day:
* Every queued order is now a *proposal*. It fills only if re-confirmed on the fill day before the 15:50 ET closing-order cutoff (`tracker.py order confirm`, or a fresh
  `order add --confirm`); otherwise it is skipped with that reason. Automatic stop exits are the one exception (a run may still cancel one, with a written reason).
* New scheduled run at 14:43 ET each trading day (Run A) whose only job is to re-judge every position and proposal with the freshest information and confirm, cancel or add.
  The 17:13 ET run (Run B) books the day and writes the next day's *proposals*; the Sunday run (Run C) writes Monday's.
* O001 and O002 are now unconfirmed proposals. They will fill on Monday only if Monday's pre-close run still judges them the best use of the money.
* Tested with a fixed clock: unconfirmed proposal skips, confirm before the cutoff fills, confirm after the cutoff or on a weekend is refused, same-day decide-and-fill works, stops fire
  unconfirmed.

**Note, Day 0 (user shared `claude mcp add robinhood-trading --transport http https://agent.robinhood.com/mcp/trading`).** Not added by me: that command targets a local CLI, this cloud
session reads connectors from claude.ai, and the registry has no Robinhood entry (it would be a custom connector). Rule added to `RULES.md` and the routine: a brokerage connector,
if one is ever attached, is read-only quotes only, with no order, transfer or account tools and no reading of real balances or positions.

**Live mode authorized (owner, 2026-10-17):** "I'm fine with 2000 play in real money. If we lose 500 we pull the plug until we talk again. In parallel start the connection to Robinhood, it's not clear it will even work."
Built `live.py` (kill switch, $2,000 real-capital cap, 30% single-order and 15% leveraged caps, 4 fills a day, one ticket per order, a $500 loss limit that sells to cash and then halts; 32 tests
pass). `live.enabled` stays false until the connector is verified. Connection attempt: `claude mcp add` ran, and the proxy refuses `agent.robinhood.com` (403). See `LIVE_MODE.md`.

**Quotes live, Day 0 (environment given full network access).** `quotes.py check`: official closes READY from Yahoo + Cboe (independent; agreed to the cent on SPY 763.25, XLE 68.24,
GUSH 50.12, NVDA 214.13, SOXL 93.67, SQQQ 38.90 for 10/16). The agents' search-derived references for XLE, NVDA and SOXL were correct; GUSH is now price-verified. Stooq resets
connections from this IP and is off; Nasdaq times out; CNBC refuses. Live intraday quotes are Yahoo-only for now. Robinhood server now reachable but needs sign-in via the claude.ai connector.

**Robinhood agent access, researched (owner finishing setup on desktop).** Per Robinhood's help center: trades only in a dedicated MCP account (fund it with the $2,000); read access to all
accounts (we read only the MCP account); no money-movement tools exist; trade approvals off by default (matches "fully automatic"); no market-on-close order type; `get_equity_quotes` is
real-time and becomes the second live quote source. Tool allow/deny list written into `LIVE_MODE.md`.

**Strategy change, Day 0 (owner: "I'm looking for you to help drive to hit the targets"; chose "Options with the $500 budget").** Explained first: with a $500 loss limit, even a fair
game caps the chance of $4,000 at about 1 in 5; stocks/ETFs only ~1-3%; buying options with the budget ~5-15% (judgment), most likely ending at -$500 and stopping. Built and tested
(41 tests): options in the tracker and the real-money gate (OCC symbols, whole contracts, 100x multiplier, fills at the decision-time bid/ask from Cboe's delayed chain, $0.05/contract
fees), a $1,500 cash floor that premium can never touch, refusal of stock buys, auto-sale one session before expiry. O001/O002 (XLE/GUSH) cancelled. Playbook v2 written. The Sunday
review will pick the first shot. Note: the owner's screenshots showed the main account (options Level 2, margin investing off); the agent account needs its own options approval.

**Research upgrades (owner asked, 2026-10-18).** Added `research.py`: Google News RSS headlines, full-text reading (works for Yahoo Finance articles, PR Newswire, Fed, EIA, SEC; AP, CNBC,
Reuters, Seeking Alpha, BLS and others block this cloud IP), generic RSS (Fed press feed tested), and SEC EDGAR commands (recent filings with 8-K item meanings, Form 4 insider
buys/sells with 10b5-1 flags, full-text search). SEC refuses anonymous automated requests; its policy requires a contact email in the User-Agent, so the SEC commands wait for one.
Added a 09:13 ET pre-open news run (no agents, proposals only, never confirms). Agent briefs now require the toolkit; the catalyst agent must check filings and insider activity.

**SEC access verified (2026-10-18).** Contact email set outside the repo (container home file; the environment variable `SEC_CONTACT_EMAIL` is the durable home for it). Live test: NVDA filings, Form 4 insider sales (director sales of ~$298M on 9/18, a 10b5-1 plan sale by the general counsel), EDGAR full-text search for "CoreWeave" 8-Ks. Fixed a parser bug that read Form 4 prices as $0 when footnotes sit beside the value.

**Robinhood connected and live mode enabled (2026-10-18).** The claude.ai Robinhood connector is connected; the stale container-local registration was removed. Checklist (read-only, nothing
placed): one agent-tradable account (MCP, ending 5318, options Level 2, limited margin), $2,000 cash and buying power (deposit settling), trade approvals off, no positions; Robinhood's
real-time stock and option quotes match Yahoo/Cboe exactly, so options now have two price sources. Gate gained option tick-size checks and a deterministic ref_id per ticket (47 tests).
`live.enabled` set true. Still visible and never to be called: exercise_option, crypto and advanced-order tools (owner asked to switch them off). The first possible real order is
Monday's 14:43 ET run, only if it confirms a proposal and the gate approves it.

**Dry run, 2026-10-18 (owner asked; scratch copy, simulated Sun 18:30 to Wed 17:13 ET; real ledger untouched).** Proposals for NVDA 11/20 225C ($6.25 ask) and 240C ($2.36 ask), $250 each,
confirmed Monday 14:50 with live Cboe quotes. Gate: 225C REFUSED (one contract costs $625, above the $500 budget); 240C APPROVED for 1 contract at a $2.35 limit with a stable ref_id;
a second gate call REFUSED as a duplicate. Robinhood `review_option_order` on that exact ticket (simulation only, nothing placed): no alerts, no in-app approval required, fees $0.04
per contract (config updated from $0.05). Paper booking: filled at the stamped ask 2.36, marked at Cboe mid; a simulated slump to 1.10 tripped the -50% stop on Tuesday's close and the
automatic exit filled Wednesday at 0.98, realizing -58%. Fix: the pre-close run now checks option stops on live quotes and exits the same day. Also learned: a $250 shot only buys
contracts priced at $2.50 or less (for NVDA that means strikes about 12% out of the money, delta ~0.19), which shapes every proposal. Robinhood's guide asks for explicit
confirmation per order when approvals are off; the owner's standing authorization is treated as that confirmation (LIVE_MODE.md), or the owner can turn approvals on.

**Budget raised (owner, 2026-10-18): "Update the 500 budget to 1k instead."** Loss limit and option budget are now $1,000 in paper and live mode; the cash floor drops to $1,000.
Hitting -$1,000 sells to cash and halts until the owner and Claude talk. Arithmetic: the goal now needs the budget to roughly triple (was 5x); fair-game ceiling about 1 in 3; my
estimate for the options approach 8-20%, most likely outcome still losing the budget. Shots become ~$500 (contracts up to $5.00) or $1,000 all-in (up to $10.00). The four
specialists running now were told mid-research. Tests pin the old $500 limit so they keep checking fixed arithmetic.

**Confirmation policy confirmed (owner, 2026-10-18):** "yes thats right for my confirmation. I dont want to tap for this." Standing authorization plus an approved gate ticket is the
per-order confirmation; Robinhood trade approvals stay off.

**Correction (2026-10-18):** NVDA reports Tue 11/17 after the close, company-verified (Robinhood `get_earnings_results`), not 11/18 as assumed. Flagged by the semis-ai specialist.
NVDA run-up positions must be sold by the 11/17 close unless holding through the print is a deliberate, journaled choice.

**Correction (2026-10-18):** VIX closed 19.99 on Fri 10/16 (intraday high 22.31; Yahoo daily bars), not "~21-22" as written in the 10/17 macro notes. It closed just under the
regime gate's VIX >= 20 line, so the gate reads borderline, not risk-off. Flagged by the flows specialist.

**Four specialists, 2026-10-18 (owner asked for expert subagents; memos in `research/2026-10-18/`).** All four say WAIT on Mon 10/19: no fill. Candidates for the Sunday review to weigh
(budget $1,000 above the floor, shots ~$500, so only one or two of these can run):
- semis-ai: NVDA261120C00230000 (ask 4.60) from 10/22, sold by the 11/17 close before earnings; AVGO 11/20 370C conf 5; NVDA 11/20 195P hedge conf 3.
- energy: XLE options unusable (spreads 11-150%); USO261120P00145000 pre-close 11/2 conf 4; USO calls only on escalation; do not stack with QQQ/SMH calls.
- flows: dealers short gamma below SPX ~7,717-7,812, CTA trigger 7,704; buy SPY261120C00785000 (conf 5) on a flush (SPY <=748, VIX >=24, then VIX -10% off its peak) or a
  reclaim (SPY >=773, VIX <=18), fallback 11/4; IWM 11/20 280C after FOMC conf 4.
- options-vol: buy event vol only at 14:43 on the print day, where implied move / history <= 0.9; MSFT261120C00580000 bought 10/28 after FOMC, sold 10/29 (conf 4, model EV
  1.23x premium, 0.89x if MSFT only moves the implied 5.8%); SPY261113C00785000 after an S&P close above its prior 10-day high (conf 3); META dropped (no edge once the 3-day
  expiry rule forces the 10/30 contract); no index puts (VIX 20, SKEW 169).
Agreement: a SPY ~785 call is the relief shot, but only on a trigger, not on Monday. Disagreement: semis-ai would carry NVDA premium into its print; options-vol's models give that
EV ~0.9 and warn about IV crush. The options-vol first draft put both event trades on 2-day expiries the gate refuses; caught and re-struck before any proposal was queued.
