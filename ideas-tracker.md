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

## Next round candidates
- Deep-dive the two clusters with most convergence: (a) subscription/cancel kits, (b) scene-tag "watch together" stack.
- Pressure-test strong candidates: who pays, distribution channel, 1-week validation test.
- Pick 2–3 to prototype as static pages.
