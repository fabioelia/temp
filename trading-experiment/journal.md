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
