# Pain-point → buildable ideas tracker

Filter: lightweight product, no heavy infrastructure, no heavy per-user LLM/human support, MVP < 2 weeks.

## Dropped (needs infra or heavy LLM/human support)
- Neutral second opinion for home/car decisions
- Scheduling with soft preferences
- Portable life records (military/expat)
- Capture-with-intent

Watch-list: items below that drift toward a dropped idea are marked ⚠.

## Round 1 → kept clusters
1. Scene-level, family-aware "watch together" guidance
2. Group-constraint recommenders (movies, meals, trips, games)
3. Consent-based delegated access to a parent's accounts/health/bills
4. Gentle structure for ADHD & aging that preserves autonomy

## Round 2 results (11 agents)

### Strong candidates (≥2 agents converged, or cheapest MVP + clear pain)
| Idea | Cluster | Why it's strong | Signals / risk |
|---|---|---|---|
| **Cancel kits + trial/renewal reminders** (static pages per service, cancel script, ICS reminder) | Money / aging | Converged 4x: money-mining, general-mining, Receipt Book, Subscription Sweep | Strong SEO intent; risk = cancel paths go stale (date-stamp pages) |
| **Pre-Brief Card** (what to say before starting something mature; pause cues) | Watch-together | Converged 2x; cheapest MVP (template + 50 cards) | Risk: reads as lecture |
| **Scene-tag dataset + Skip Cues + Ratings Translator** | Watch-together | Skip Cues = phone companion buzzing "skip 1:12:30–1:14:10", no video editing | Cold start (Crowd Tag Game); check streamer ToS for scraping extension |
| **Ripeness Ladder** ("gateway order" for a favorite) | Watch-together | Reframes "too mature" as "not yet"; static curation | Subjective, thin coverage |
| **Skip-Map for books/albums** (chapter/track skip lists) | Watch-together | Fills non-video gap | Moderation, coverage |
| **Dealbreakers-first → Solo Swipe (match only) → Lowest-Misery → timed random** | Group decisions | Converged 2x (mechanics + PlateFor hard filters); one static page | Needs option decks per domain |
| **PlateFor** (everyone taps allergies/diets → dishes that satisfy all) | Group recommenders | Deterministic filter; dataset reusable for potluck/diabetic/adapter | Allergy/health liability → hard-filter only, "verify labels" |
| **FamilyFilm** (ages present → films clearing age ceiling + adult boredom floor) | Group recommenders | High-frequency use | Messy rating data; streaming availability stale |
| **Brunch Treaty** (veto-first group restaurant picker) | Group recommenders | Natural share loop | Places API cost/ToS; single-city launch |
| **Scam Second Look** (forward/paste → rules-based "pause and call someone") | Aging | Converged 2x; most emotionally urgent | Never say "safe"; false negatives |
| **Open Book Page / My Binder + Delegate Pass** (parent-written, per-item visibility, time-boxed share) | Aging / delegated access | Converged 3x; parent is owner, child is guest | Setup friction; ⚠ binder drifts toward dropped "life records" — keep to owner-written sheet |
| **Bill Bounce Inbox** (forward bills → shared "due soon") | Delegated access | Most common recurring pain | ⚠ needs inbound-email parsing; borderline on infra; show "couldn't read" rather than guess |
| **Open Board + Nudge Contract + Weather Report** (claim-not-assign household list; self-written reminder rules; ambient load) | Household / ADHD | One static page; kills nagging dynamic | Adoption by both partners |
| **Start Ramp** (3-min "just start" timer, built-in "stopping is fine") | ADHD | Targets exact failure mode | Novelty cliff |
| **Three Doors** (self-pruning inbox, shows 3 random tasks) | ADHD | Solves backlog collapse | — |
| **Doorway Dock** (NFC tag → leaving checklist) | ADHD | Ambient, zero-setup | Hardware step |
| **Kid party RSVP + allergy sheet** | Kids logistics | Viral by design (every guest sees it); trivial build | Crowded sign-up category → differentiate on 4-tap + cheat sheet |
| **School/club paper-flood digest** (photo + 3 fields → "due this week") | Kids logistics | No OCR/LLM needed | Needs shared family view |
| **Grandparent video-call kit** (prompt cards/games from one link) | Social | Clear emotional pain, viral hook | Needs shared-state room code |
| **Hangout recipes + invite generator; Initiator baton** | Social | Cheap content MVP; pairs for retention | Baton needs group adoption |
| **Pet fed/medicated shared check-in** | Household | Daily habit, one tap, clear conflict | — |
| **Moving checklist, fee decoder, security-deposit letters, kids' gear timeline** | Consumer | Rules table + letter/ICS; no backend | Legal curation + disclaimers |

### All other ideas logged (by agent)
- **Watch-together concepts:** SceneSafe Timeline, Age Dial, Talk-After Cards, Co-Rate, Safe-Cut Share Links, Watch Party Rulebook, Book-vs-Show Guide, School/Library Kit.
- **Watch-together adjacent:** Age-Gap Pairings, Lyrics Decoder Playlist Builder, Game Mod Passport, Museum Mature-Wing Maps, Trip Tone-Match, Tradition Handoff Kit (⚠ near capture-with-intent), Favorites Time Capsule, Readiness Quiz, Co-Watch Debrief Prompts.
- **Group recommender concepts:** DayPlan Kids, GameNight Balancer, PotluckMath, CarbCrew, Playlist Peace, WorkshopLunch, Rainy Day Roulette, SplitSpice, Gift Pool.
- **Group decision mechanics:** Veto Tokens, Secret Ranking Reveal, Rotating Dictator, Bid Points, Two Finalists Duel, Loser's Pick Debt, Timeboxed Auto-Pick, Mood Dial Narrowing, "I'd Hate It" Heatmap.
- **Delegated access:** Tap-to-Share Windows, Weekly Postcard, Appointment Buddy Card, Pill Chart (medical liability), Check-In Without Spying, Rules I Set, Paper Bridge Binder, Handoff Day.
- **Dignity-first aging:** Teach-Back Cards, Change Heads-Up bulletin, Call Scripts for Everything, Quiet Inbox Filter Pack, Dumb Mode Home Screen, Price-Lock Letter Service, Memory Vault Export. (Peer Fix-It Board violates no-support constraint — skip.)
- **ADHD:** Sand Strip, Body-Double Window, Pile Photo, Next-Action Magnet, Transition Chime, Default-Day Template, Tiny Done-Jar, Launch Pad Mat, Mood Weather.
- **Household load:** Ownership Handoff Cards, Rescue Budget, Done-By-Default Rotations, Friction Log, Body-Doubling Windows, Trigger Stacking Templates, Anonymous Overload Signal, Spoiler-Free Status Digest. (Auto-Surfacing Calendar Digest needs per-household parsing — borderline.)
- **Social mining:** Friendship downgrade dial, long-distance weekly ritual, low-effort host scripts, claim-a-dish potluck, playdate matchmaker (minors/consent risk), birthday-invite rules engine, neighbor starter pack, shared-tools list, friendship sprint, post-date message picker, condolence "what actually helps".
- **Consumer mining:** price-drop refund claims, warranty/return clock (⚠ near dropped records), move-in photo log, roommate bill fairness, gift norms + group pot, kids' size forecaster, pet cost + care calendar, food "use it first", unit price + shrinkflation checker.
- **General sweep:** gift-memory ledger, home maintenance rhythm cards, friendship overdue nudges, leftover fridge-clock, pantry-first meal prompt, chore fairness board, trip cost splitter (crowded), meeting-free-time shield, caregiver shift handoff note, weekly 5-minute digital-clutter triage.

## Round 3: pressure-test verdicts (8 reviewers; 0-4 searches each, thresholds are hypotheses)

**Headline:** most clusters collapse into one thin product each; several ideas die.

| Verdict | Ideas |
|---|---|
| BUILD (small) | Security-deposit letter (pilot 1 state; $9 test, 8 paid of 40 letters); Open Board (fold in Nudge Contract, Three Doors, Start Ramp; test with 20 couples); Party RSVP + allergy sheet (layer on Partiful/Evite; 10 of 15 hosts run a real party) |
| BUILD (cheap experiment) | Doorway Dock ($15 pre-order, 25 per 1,000 visits); Pre-Brief Card first, then text-only Skip Cues for top 50 shows |
| PIVOT | Scam Second Look → add one-tap named trusted contact, child buys/parent owns; Receipt Book → sell to credit unions/libraries; Open Book Page → retention layer behind Scam Second Look; PlateFor → host-run dietary collector, no safety claims; Junk-fee decoder → one vertical; Ratings Translator → web lookup, no overlay; Paper-flood digest → forwarding + extraction (breaks no-AI rule); Gear timeline → SEO/affiliate content; Grandparent kit + Hangout recipes + Host scripts → one $9 content pack |
| KILL | Brunch Treaty; Moving checklist; Price-drop claims; Warranty clock; Initiator baton; Weather Report; Delegate Pass and Bill Bounce (as products); Skip-Map; Birthday policy tree and Downgrade dial (as products, keep as content) |

**Disagreements to resolve:**
- Cancel kits: cancel-kit reviewer says the free SEO site is a trap (pivot to Receipt Book B2B2C); portfolio red team says build cancel kits + deposit letters on one hub site.
- Watch-together: red team says do not build; watch-together reviewer says Pre-Brief Card first.
- ADHD: red team keeps Start Ramp as a separate brand; household reviewer says fold it into Open Board.

**Portfolio red-team suggestion:** consumer rules-table hub (deposit letters + cancel kits), plus a separate Start Ramp brand; do not build the watch-together stack.

Artifact with every pitch: https://claude.ai/artifact/CxyVWLU7B8qQoTPRHskTGT

## Round 4: evidence-first research (7 agents, ~9-13 searches each; many figures second-hand)

| Question | Finding | Decision / cheapest test |
|---|---|---|
| Cancel kits vs hub | SERPs commoditized (vendor help pages, programmatic directories); federal click-to-cancel vacated Jul 2025, FTC restarted rulemaking Mar 2026; CA AB 2863 shrinks pain; hub economics unproven (one seller-reported site ~$310/mo at ~23.5k pageviews); credit-union channel crowded with free toolkits (league, CFPB) | KILL as framed. Only test: 15-20 long-tail pages, 6-8 weeks, need 1,500 impressions and 3% email conversion; plus 20 cold emails to CU fraud leads (3 replies, 1 call) |
| Deposit letter pilot | Texas: 30 days after surrender, bad-faith penalty $100 + 3x withheld + fees, presumption of bad faith if day 30 missed; forwarding-address rule is the trap. California: 21 days, up to 2x, subsection lettering unstable. Free competitors = static forms, no date math | Pilot TX, CA second. Verify against official statutes (several 2025 TX bills unconfirmed), attorney review, UPL guardrails (information not advice, no "you are owed $X", no bad-faith assertion). Pass: 300 visitors, 15% complete, 40% of completers generate letter |
| Open Board architecture | URL-hash no sync; KV eventually consistent; public Yjs relays no persistence; recommend Cloudflare Pages + Worker + Durable Object per household, secret in URL fragment, reminders on-device, no push in v1; ~$5/mo at 1,000 households (unverified) | Test first on shared Google Sheet, 5-10 households: 70% both touch, 60% items claimed by other person, median claim < 48h |
| Pre-Brief / Skip Cues | Demand real (conflicting parent threads), "what to say" card is the open gap; Kids-In-Mind, DTDD, SceneSkipper, Skipit cover scene lists; text-only timestamp lists appear legally safer post-VidAngel (not legal advice); monetization thin | Pre-Brief test with ~10 cards + email capture; Skip Cues = feature only. Seed: Stranger Things, GoT, House of the Dragon, Squid Game, Wednesday, Last of Us, Bridgerton, Euphoria, The Boys, Bluey (7 of 10 unverified by Trends) |
| Scam Second Look | Pain large (FBI IC3 2024: 60+ ~147k complaints, ~$4.9B); bank/FINRA trusted contacts fire only when money moves; Carefull closest competitor; NO evidence on forward-vs-call at moment of panic (shame barrier) | 15-family concierge test, $5 commitment, 7 thresholds; kill if <6 forward in week 2; pivot to child-side tool if parents won't forward |
| Start Ramp | No paid single-purpose timer; Tiimo/Finch/Brili/Focusmate sell full planners at $40-100/yr; body-doubling evidence soft | Fold into Open Board as on-ramp; one-week standalone test (35% start, 60% finish/choose, 15% return in 7 days) |
| Fake-door kit | Landing copy + surveys + thresholds written for deposit letter ($9), Pre-Brief Cards ($4/mo door), Doorway Dock ($15), Party RSVP ($5) | Run order: Pre-Brief and RSVP first, deposit in parallel, Dock last |

### Recommended build order (after round 4)
1. Deposit letter, Texas pilot (clearest paying pain, free competitors weak).
2. Open Board sheet test (zero build), then real build only if thresholds pass.
3. Pre-Brief Cards fake-door (cheap, fast) - decide subscription vs free lead magnet.
4. Party RSVP fake-door; Doorway Dock pre-order last.
5. Parked pending tests: Scam Second Look concierge, Start Ramp standalone, cancel-kit long-tail pages.

## Rounds 5-6: ideas from Reddit (user feedback: stop over-indexing on my own topics)

**Access finding:** Reddit is blocked for WebSearch and WebFetch, and mirror sites mostly failed. Round 5 (13 agents) therefore produced unverified leads from snippets. Round 6 (9 agents) used the Arctic Shift archive API (https://arctic-shift.photon-reddit.com/api, reachable from Bash; subreddit listing with date windows works, keyword search times out) and read real posts and comments. Samples: roughly 210,000 posts (newest 100 per window per subreddit) and about 15,000 comments. Recurrence counts are the agents' own coding; scores are scrape-time snapshots.

**Recurring patterns from real threads**
1. Dated "I didn't know I had to" deadlines: estimated-tax payments, loan notice clocks, filing-status fork, benefit renewal proof, card swap checklist, car sale closeout. Same shape as the deposit letter: date math + template + calendar file.
2. Pre-agreement forms: who pays (9 of 42 threads), who may stay or move in (9), soft commitments with no notice terms (6).
3. Repair and buying planners: major-repair set-aside, contractor quote normalizer, roof credit.
4. Employer-paid registers: expiry ledger, truck parts, offboarding checklist, landlord maintenance log.
5. Hobby one-time-price sheets and printables: brewing, knitting.
6. Health bureaucracy (records and paperwork only): appeal packet, exportable log, doctor-form templates.
7. No-bank-link budgeting / CSV categorizer.

**Best-evidenced ideas** (top picks in the pitchbook): Who Pays?, House Terms Card, RepairRunway, Quote Decoder, Expiry Ledger, Brewbook Sheet.

**Weak yield:** wish-list subreddits (builder pitches, joke posts), GriefSupport (venting), rants subreddits (venting, some already-solved), woodworking/aquarium posts.

**Liability notes:** debt-lawsuit triage (heavy UPL risk), unfiled returns (criminal exposure), health logs (no analysis or dosing), translation cards (needs native review).

Full list with evidence notes is in the pitchbook artifact: https://claude.ai/artifact/CxyVWLU7B8qQoTPRHskTGT

## Next round candidates
- Deep-dive the two clusters with most convergence: (a) subscription/cancel kits, (b) scene-tag "watch together" stack.
- Pressure-test strong candidates: who pays, distribution channel, 1-week validation test.
- Pick 2–3 to prototype as static pages.
