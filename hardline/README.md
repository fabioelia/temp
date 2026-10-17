# HARDLINE

A two-player, voice-first co-op escape game set inside a simulated construct. Runs in the browser — **as plain static files, no server needed** — so it can live on GitHub Pages.

One of you is **jacked in** and can see the room but can't read it. The other is **aboard the Halcyon** holding a salvaged protocol manual that can read the room but can't see it. Describe, cross-reference, beat the clock, wake up.

- **The Operator** sees a 3D room — glyphs, doors, bullets, cables, vault dials — with nothing labelled.
- **The Mentor** sees only a paper manual (cipher tables, logs, physics rules, wiring schematics, maps, gate keys) and a ship-status panel.
- There is **no in-game chat**. Voice is external (Discord). The game is built to make you talk.

## Play it

### On a static host (GitHub Pages and friends)

Open the page, type a callsign, **Create a private session**, and send your partner the four-letter code or the invite link. That's the whole setup.

There is no game server. **The player who creates the session *is* the server**: their browser tab runs the game engine (`engine/`) and your partner (and any TV screen) connects straight to it over a WebRTC data channel, introduced by [PeerJS](https://peerjs.com)'s free public broker — the same approach as Pixel Pitch on this site. So:

- **The host's tab must stay open** until the run is over. If the host closes it, the session ends for everyone (the others are returned to the start page).
- If the *partner's* connection drops the shared clock pauses; refreshing puts them back in the same seat and the clock resumes.
- If a player is on a VPN or a strict corporate network, direct WebRTC can fail. Add a TURN relay (a free [metered.ca](https://www.metered.ca/stun-turn) account works): open the game once with `?turn=USERNAME:CREDENTIAL@standard.relay.metered.ca`. It is remembered in that browser and carried into invite links, and a setting already stored by Pixel Pitch is picked up automatically.
- Keep the host's tab in the foreground if you can. Browsers throttle timers in background tabs; an open WebRTC connection exempts it from the worst of that, but the Operator's 3D view also stops rendering when hidden.

### Run it yourself (LAN / local)

```
npm install
npm start          # http://localhost:3000
```

Open it in two browsers (or send the invite link to a friend), start a Discord call, and jack in. Requires Node 18+ and a browser with WebGL 2 (any current Chrome, Edge, Firefox or Safari). Headphones recommended.

When a Node server is behind the page the game uses plain WebSockets instead of WebRTC (no internet needed at all) — the server marks the HTML it serves and the page picks the transport on its own. `?transport=ws` / `?transport=p2p` force one for testing.

**Playing over your local network.** The server listens on **all network interfaces** (IPv4 and IPv6; it falls back to IPv4-only where IPv6 isn't available), so anyone on your Wi-Fi/LAN can join by your computer's local IP. On start-up it prints the addresses:

```
  This computer   http://localhost:3000
  On your network http://192.168.1.20:3000   <- send this to your partner
```

If the game is opened via `localhost`, **Copy invite link** uses your LAN address instead, so the link works for your friend. If they still can't connect, allow Node through your OS firewall for port 3000. Over plain `http://` on a LAN address, browsers withhold two conveniences — the clipboard (the link is shown in a toast instead) and microphone access (so the optional *duck the score while I'm talking* is unavailable); everything else works.

### A TV screen you can cast

Both players can watch a **spoiler-free bridge display** on a TV. In the lobby (or the in-game **TV** button) choose **Show on TV**. That opens `cast.html?code=ABCD` in a new tab; in Chrome use **⋮ → Cast…** and pick your Chromecast / TV with **Cast tab**, then press **F** for full screen. Or open `cast.html` on any device with a screen and enter the code. (On a static host the TV connects to the host's tab like the second player does.)

It shows the shared clock inside an Agent-trace ring, the crew, mistakes, progress through the current room, a ship log, the descent through the layers with your times, the story interstitials typed out large, and the *waking up* ending. **It never shows either player's secret half**, so it can't break the game when you both look at it: the engine only sends spectators a stripped feed (names, clock, strikes, stage counts, story) and a test scans that feed for every puzzle key. Up to six TV screens can watch one session; they are read-only and don't take a player seat.

## How a run works

1. **Create a private session.** You get a four-letter code and an invite link (`?join=ABCD`). Two players max; no public matchmaking.
2. **Pick roles and a run.** The host chooses Operator / Mentor / random for the first room, and which **run** to play:
   - **Classic** — the five original layers (Lobby → Corridor → Atrium → Switchboard → Hardline).
   - **Deep Loop** — six harder rooms beneath the hardline: more rules, more talking.
   - **Gauntlet** — all eleven, back to back.

   By default roles **swap after every room**, so you both play both sides.
3. **Rooms, one story.** Between rooms an in-fiction interstitial (typed radio chatter from the Halcyon, pages of the Protocol) covers the load. Both players press *Jack In* / *Open the Protocol* and the shared clock starts.
4. **Mistakes cost 15 seconds** off the shared clock. **Running out of time is a soft reset**: same room, fresh numbers (the puzzle is re-rolled so you can't just memorise it). Nobody loses the run.
5. **If a player drops, the clock stops.** Reconnecting puts you back in the same seat, in the same room, with state intact.

### The rooms

| # | Room | Operator sees | Mentor holds | Tension |
|---|------|---------------|--------------|---------|
| 1 | **The Lobby** — keypad cipher door | A door that displays glyphs, a coloured wall sconce, a wall clock, a keypad | Four cipher tables (one per sconce colour) and the clock rule (odd minutes ⇒ enter the code backwards) | Describing glyphs precisely; remembering to read the clock |
| 2 | **The Corridor** — door-hopping | Identical doors, a faint glyph above each, a porthole showing an animated glimpse | Glyph verdicts (EXIT / TRAP / LOOP) and which glimpses the Agents hold | A door is safe only if the glyph *and* the glass agree |
| 3 | **The Atrium** — bullet time | A frozen 3×3 field of numbered cells. Each bullet is a **coloured badge with its own shape** and a row of pips for its speed | The drift chart: how each *colour + shape* moves once time thaws | Calling a safe cell before the freeze breaks |
| 4 | **The Switchboard** — re-route the signal | Hanging coloured cables; jacks stamped with glyphs in a meaningless order | A tangled wiring schematic (tap to follow a trace) | Matching colours to glyphs through a diagram that doesn't match the panel |
| 5 | **The Hardline** — the maze | Only the 3×3 patch of maze around them: floor glyphs, low walls, red "watched" floor | The full map, but not where the Operator is | Localising a person you can't see, then routing around watched cells to a ringing phone |

**Deep Loop**

| # | Room | Operator sees | Mentor holds | Tension |
|---|------|---------------|--------------|---------|
| 6 | **The Echo Chamber** — a flashing monitor, four pylons | A sequence of coloured flashes, each with a glyph; four pylons to press | A rule table mapping flash colour → pylon, in **three columns that shift every time you slip**, plus which glyphs *invert* the answer | The rules change underneath you after a mistake — the manual highlights which column is live |
| 7 | **The Vault** — a round door, 3–4 glyph dials | Dials and a lever; a failed try lights **how many dials were right** (and costs a strike) | A glyph → letter legend and logical clues ("dial 2 is not C", "B comes before D", "exactly one of A, E, F") that leave ≤ 3 codes | Deduction from clues first, then from the feedback — never a blind guess |
| 8 | **The Substation** — overloaded transformers | Towers glowing red, glyph-marked levers, no idea what a lever does | The wiring: every lever flips several nodes at once (hidden triangular algebra), and a what-if tool that never picks for you | Find a lever set that leaves *every* node safe |
| 9 | **The Signal Room** — triangulate a position | Compass dials, one per beacon: some read clockwise, some counter-clockwise, one may **flicker (a decoy)** | A 10×10 map of the beacons and a protractor | Different bearing conventions, a decoy to throw out, then a single map square to enter |
| 10 | **The Logic Wall** — switches → gates → a lamp | Switch numbers, gate chips with a letter, a glyph and what feeds them. Wires don't light up | Which glyph is AND / OR / XOR / NAND / NOR / XNOR — **re-rolled every attempt** | Evaluate a circuit you can only see half of; work backwards from the lamp |
| 11 | **The Mosaic** — a nonogram split between you | A wall of tiles and the **row** clues | The **column** clues and a scratch grid | Neither half is solvable alone; every picture is solvable by line logic (no guessing) |

Every room is solvable only by talking: the engine sends each player *only their half* (see [Information split](#information-split)).

## Screenshots

Captures of every room — Operator on the left of each pair, Mentor on the right — are in [`docs/screenshots/`](docs/screenshots/), along with `6-tv-bridge.png`, the castable TV screen. The first five rooms are full-quality captures (`npm run shots` regenerates them); the Deep Loop captures were taken at the low-graphics setting that the automated tests use, so a real GPU at *High* looks crisper.

## Design handoff → implementation

| Handoff decision | What shipped |
|---|---|
| Platform: browser | Static files — ES modules + an import map, no build step — that can be served by any static host. An optional Node server adds LAN play over WebSockets. |
| Hyper-realistic full 3D | Three.js with PBR materials, a procedurally generated normal-mapped material set, real-time reflections on wet floors, shadows, volumetric light cones, bloom, depth-of-fog, scanlines, chromatic glitch. See [Visual fidelity](#visual-fidelity--an-honest-note). |
| 4–5 puzzle rooms | Five rooms in the classic run — plus six harder ones in the Deep Loop. |
| Voice via Discord | No voice in the game. The lobby tells players to start a call; there is no text chat anywhere. |
| Connecting meta-narrative | The Halcyon crew, the Protocol and its author (Ada Kerr), the Agents, and a hardline phone — told through interstitials, ending with a page you "add" to the Protocol with both callsigns. |
| Private sessions only | Code + invite link; two seats; nothing public. |
| Roles chosen/random, swappable | Host picks Operator / Mentor / Random; swap-every-room toggle; either player can press *Swap roles* during an interstitial. |
| Shared countdown, soft reset on fail | One authoritative clock per room; expiry reloads the same room with a re-rolled puzzle. |
| Pause on disconnect | The engine pauses the clock the instant a connection drops; clients auto-reconnect and resume the same seat. |
| Audio: score ducks under voice | See [Audio](#audio). |
| Interstitials: in-fiction, skippable after first playthrough | Typed radio/boot sequences double as load cover (the progress bar reflects real scene building). Skippable from your second run; the *resimulating* retry screens are always skippable. |
| Jack-in / wake-up bookends | Intro sequence on start; the "waking up" ending with per-layer stats. |

## Audio

All audio is synthesised with WebAudio (no asset files):

- **Score** — a dark industrial drone with a minor-sixth pad and sparse dissonant brass-cluster swells, rooted on a different note per room. It is deliberately quiet and thin so voices stay clear, and gets denser as the clock runs down.
- **Sound carries information** — three unmistakable feedback cues (*correct*: rising chime; *wrong*: a distorted falling buzz; *time low*: Agent-patrol stingers at 30 s and 10 s), a clock tick under 60 s and an accelerating heartbeat under 20 s, plus a rising system hum. The Echo Chamber's pylons each have their own note, so you can hear the sequence as well as see it.
- **Ducking** — voice chat lives in Discord, so the game can't hear your partner. As an **opt-in** setting (*Audio → Duck the score while I'm talking*) it analyses *your* microphone locally to duck the score while you speak. Nothing is recorded or transmitted. There are also master / score / effects sliders and a mute.

## Architecture

The project folder **is** the static site; there is no build step.

```
index.html, cast.html   the game and the TV screen
css/                    screens, HUD, the paper manual
js/                     the browser app
  main.js               app flow, interstitials, HUD, message routing
  net.js                session client: auto-reconnect + seat resume
  transport.js          how bytes travel: WebSocket (Node server) or WebRTC (host's tab)
  cast.js               the TV screen: spectator connection, trace ring, ship log, descent map
  audio.js              WebAudio score, SFX, tension, mic ducking
  stage.js              renderer, post-processing, camera rig, hotspots, tweens
  textures.js, kit.js   procedural PBR textures, room shells, wet floors, light cones, …
  operator/*.js         the eleven 3D rooms
  mentor/*.js           the eleven manuals (+ shell.js: tabs, notes and the ship panel)
engine/                 the game itself — no Node-only dependencies, runs in Node *and* in a browser
  session.js            one session: lobby → briefing → playing → solved|failed → … → ending
  hub.js                connections → sessions (create / join / resume / spectate)
  puzzles/              one generator per room
shared/                 used by the engine and the browser
  glyphs.js, rooms.js, story.js, rng.js, bulletlook.js
vendor/                 three.js (minified) and PeerJS — no CDN needed
server/index.js         the optional Node server: serves the files above + a /ws endpoint (LAN play)
test/                   unit + protocol tests, solver bots, two-browser end-to-end
docs/screenshots/
```

### One engine, two transports

`engine/hub.js` takes anything shaped like a WebSocket (`send`, `close`, `readyState`, `on('message' | 'close')`). The Node server hands it real WebSockets. On a static host, `js/transport.js` creates the hub **inside the host player's tab**, registers a PeerJS peer named after the session code, and hands the hub a WebRTC data channel for every guest or TV screen that connects; the host's own client talks to the hub through an in-memory pipe. Both look like a WebSocket to the page, so `net.js`, `main.js` and `cast.js` don't care which they have. The same code, the same protocol and the same tests cover both.

### Information split

The engine is authoritative. Each puzzle's `create()` returns `{ state, views: { operator, mentor } }`; the answer lives only in `state`. The two views are sent to different players and neither contains the other's reference data (a test asserts this per room). The Operator never receives the cipher tables, the gate key, the column clues or the wiring; the Mentor never receives the glyph sequence, the doors, the dials, the bullets, the tiles or the maze position. Mentors can't send actions at all.

On a static host the engine lives in the *host's* browser, so a determined host could open dev-tools and read the Mentor's half. That is the cost of having no server; this is a co-op game between friends, and the in-memory state is the same one the host's own tab already holds.

### Protocol (JSON messages)

Client → engine: `create`, `join`, `resume`, `spectate` (read-only TV screen), `setPref`, `setChapter`, `setSwap`, `start`, `ready`, `swap`, `act`, `again`, `leave`, `ping`.
Engine → client: `joined`, `spectating`, `lobby`, `briefing` (role-specific view; spectators get no view), `go`, `fx` (result + per-role event + new view), `timer`, `pause`, `resume`, `failed`, `solved`, `ending`, `peer`, `partnerReady`, `error`.

The clock is an engine value; clients count down locally from each `remainingMs` and are re-synced every 4 s and on every penalty.

## Tests

```
npm test                            # puzzle + session/protocol tests (fast, no browser)
npm run e2e                         # real Chromium sessions play the game through the UI
node test/e2e/run.mjs deep          # just the Deep Loop, all six rooms
node test/e2e/run.mjs static        # just the static-hosting scenario
node test/e2e/run.mjs resilience    # disconnect/rejoin/timeout scenarios only
npm run stress                      # build every room from many generated puzzles
npm run shots                       # full-quality screenshots into docs/screenshots/
```

- **Solver bots** play every room using *only* the two role views — the information two humans would have after talking — across 120–150 seeds per room. If they can solve it, it's solvable; the info-split tests prove neither half is enough alone (the Vault's clues leave several codes and the dials alone leave hundreds; Echo's rules genuinely change after a mistake; the Mosaic's rows and columns *together* determine the picture by line logic; and so on).
- **Session tests** drive the real protocol over WebSockets: full playthroughs of the classic run, the **Deep Loop** and the **Gauntlet** (every room solved from the two role views, roles swapping each room), soft reset with a re-rolled puzzle, 15 s penalties, the mentor being unable to act, pause-on-disconnect with a frozen clock, rejoin with state intact, lobby rules.
- **Network tests** start the server with its default settings and reach the page and the protocol through this machine's real LAN address as well as loopback.
- **TV-feed tests** watch a live session as a spectator and scan everything it receives for every puzzle-secret key; they also cover mid-room catch-up, read-only enforcement and the cap.
- **End-to-end** launches two Chromium instances (software WebGL), reads each page's actual views, and clicks the actual 3D hotspots through every room — including a deliberate mistake in each — then checks the ending screen. It covers the classic run, the whole **Deep Loop**, pause/rejoin, timer expiry, a pointer-picking regression, and the TV screen. The **static-hosting scenario** serves the folder with a plain file server under `/games/hardline/` (no `/healthz`, nothing dynamic, like GitHub Pages) plus a local PeerJS broker, and checks that the page chooses WebRTC on its own, a partner and a TV join by code, a dropped partner pauses the clock and resumes the same seat, and the host leaving returns everyone to the start page.
- **Stress** builds every Operator scene and Mentor manual in a real browser from many generated puzzles (all stages) — bugs that depend on which puzzle you happen to draw only show up this way.

The e2e runs use `?gfx=low` so software WebGL can keep up; screenshots land in `test/e2e/out/`.

## Configuration

| Setting | Default | Purpose |
|---|---|---|
| `PORT` / `HOST` (env) | `3000` / `::` (all interfaces) | Node server only: where to listen. Set `HOST=127.0.0.1` to accept this computer only |
| `TIME_SCALE` | `1` | Multiply every room's clock (`0.1` = ten times shorter; handy for testing failure) |
| `START_ROOM` | first room | Development aid: jump straight to a room, by position or id (`mosaic`) |
| `SOLVE_HOLD_MS` / `FAIL_RESET_MS` | `3400` / `4200` | How long the *layer cleared* / *resimulating* screens hold |
| `?gfx=auto\|high\|low` | `auto` | Graphics setting (also in Settings) |
| `?transport=ws\|p2p` | auto | Force a transport |
| `?turn=USER:CRED@host` | — | TURN relay for WebRTC (remembered) |

The first four are environment variables for the Node server; in a browser tab that is hosting, `window.HARDLINE_ENV = { START_ROOM: 'mosaic' }` set before the page loads does the same job. Room clocks and the penalty live in `shared/rooms.js`.

## Visual fidelity — an honest note

The handoff targets *hyper-realistic full 3D*. This build ships with no downloaded art assets: every texture, material and model is procedural, so it is high-fidelity-stylised rather than photoreal. What gets it most of the way is the lighting model (physically based materials, shadowed spot lights, wet-floor reflections, light shafts, fog, bloom) and heavy post-processing. If you want to push toward photorealism, the seams are clean: drop glTF models/PBR texture sets into `textures.js` / each room's builder, and bake or add an HDRI for `scene.environment` in `stage.js`. **Graphics: Auto / High / Low** (Settings, the ♪ button) — *Auto* drops resolution and then disables reflections if it can't hold ~25 fps; *Low* starts without reflections or MSAA (best for integrated GPUs). Changes apply from the next room.

## Known limitations

- **Never tested on a real GPU or by ear.** Everything above was built and tested in a sandbox with software WebGL and no sound card: frame rates on real hardware, the actual loudness balance of the synthesised score, and how the mix sounds in headphones have not been verified by a person.
- **The peer-to-peer path was tested against a local broker, not the public one.** The WebRTC code is exercised end to end (two browsers and a TV screen, pause/rejoin, host leaving) with a local PeerJS server standing in for PeerJS's public one; I could not reach the public broker from the sandbox. It is the same broker and the same approach Pixel Pitch already relies on.
- **A host's tab is the server.** Static hosting means the host must keep their tab open, and a host who reloads ends the session. Strict networks may need the TURN option above.
- **Colour-dependent puzzles.** The Atrium's bullets now differ by shape as well as colour, but cables, sconces, glimpses, Echo's pylons and the Substation's lamps still lean on colour. Players with colour-vision deficiency may struggle; a patterned mode would be the next accessibility step.
- **No partner-voice detection.** Ducking only hears *your* mic (see Audio).
- **Sessions are in memory.** Restarting the Node server (or closing the host's tab) ends them.
- **Touch** works for every hotspot, but the Operator rooms are best on a larger screen.
