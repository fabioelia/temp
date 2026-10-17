# HARDLINE

A two-player, voice-first co-op escape game set inside a simulated construct. Runs in the browser.

One of you is **jacked in** and can see the room but can't read it. The other is **aboard the Halcyon** holding a salvaged protocol manual that can read the room but can't see it. Describe, cross-reference, beat the clock, wake up.

- **The Operator** sees a 3D room — glyphs, doors, bullets, cables — with nothing labelled.
- **The Mentor** sees only a paper manual (cipher tables, location logs, physics rules, wiring schematics, a map) and a ship-status panel.
- There is **no in-game chat**. Voice is external (Discord). The game is built to make you talk.

```
npm install
npm start          # http://localhost:3000
```

Open it in two browsers (or send the invite link to a friend), start a Discord call, and jack in.
Requires Node 18+ and a browser with WebGL 2 (any current Chrome, Edge, Firefox or Safari). Headphones recommended.

### Playing over your local network

The server listens on **all network interfaces** (IPv4 and IPv6; it falls back to IPv4-only where IPv6 isn't available), so anyone on your Wi-Fi/LAN can join by your computer's local IP. On start-up it prints the addresses:

```
  This computer   http://localhost:3000
  On your network http://192.168.1.20:3000   <- send this to your partner
```

If the game is opened via `localhost`, the lobby's **Copy invite link** automatically uses your LAN address instead, so the link works for your friend. If they still can't connect, allow Node through your OS firewall for port 3000. Over plain `http://` on a LAN address, browsers withhold two conveniences — the clipboard (the link is shown in a toast instead) and microphone access (so the optional *duck the score while I'm talking* is unavailable); everything else works. Use HTTPS (e.g. a tunnel or reverse proxy) if you want those too.

### A TV screen you can cast

Both players can watch a **spoiler-free bridge display** on a TV. In the lobby (or the in-game **TV** button) choose **Show on TV**. That opens `/cast?code=ABCD` in a new tab; in Chrome use **⋮ → Cast…** and pick your Chromecast / TV with **Cast tab**, then press **F** for full screen. Or open `http://<your-ip>:3000/cast` on any device with a screen and enter the code.

It shows the shared clock inside an Agent-trace ring, the crew, mistakes, progress through the current room, a ship log, the descent through the five layers with your times, the story interstitials typed out large, and the *waking up* ending. **It never shows either player's secret half**, so it can't break the game when you both look at it: the server only sends spectators a stripped feed (names, clock, strikes, stage counts, story) and a test scans that feed for every puzzle key. *Sound: On* optionally plays the score and cues through the TV speakers. Up to six TV screens can watch one session; they are read-only and don't take a player seat.

## How a run works

1. **Create a private session.** You get a four-letter code and an invite link (`/?join=ABCD`). Two players max; no public matchmaking.
2. **Pick roles** (host chooses Operator / Mentor / random for the first room). By default roles **swap after every room**, so you both play both sides.
3. **Five rooms, one story.** Between rooms an in-fiction interstitial (typed radio chatter from the Halcyon, pages of the Protocol) covers the load. Both players press *Jack In* / *Open the Protocol* and the shared clock starts.
4. **Mistakes cost 15 seconds** off the shared clock. **Running out of time is a soft reset**: same room, fresh numbers (the puzzle is re-rolled so you can't just memorise it). Nobody loses the run.
5. **If a player drops, the clock stops.** Refreshing or reconnecting puts you back in the same seat, in the same room, with state intact.

### The rooms

| # | Room | Operator sees | Mentor holds | Tension |
|---|------|---------------|--------------|---------|
| 1 | **The Lobby** — keypad cipher door (3 doors) | A door that displays glyphs, a coloured wall sconce, a wall clock, a keypad | Four cipher tables (one per sconce colour) and the clock rule (odd minutes ⇒ enter the code backwards) | Describing glyphs precisely; remembering to read the clock |
| 2 | **The Corridor** — door-hopping (3 rows, 4→6 doors) | Identical doors, a faint glyph above each, a porthole showing an animated glimpse | Glyph verdicts (EXIT / TRAP / LOOP) and which glimpses the Agents hold | A door is safe only if the glyph *and* the glass agree |
| 3 | **The Atrium** — bullet time (3 volleys) | A frozen 3×3 field of bullets with coloured, short/long tracers | The drift chart and rules for what happens when time thaws | Calling a safe cell before the freeze breaks |
| 4 | **The Switchboard** — re-route the signal (4→6 cables) | Hanging coloured cables; jacks stamped with glyphs in a meaningless order | A tangled wiring schematic (tap to follow a trace) | Matching colours to glyphs through a diagram that doesn't match the panel |
| 5 | **The Hardline** — the maze | Only the 3×3 patch of maze around them: floor glyphs, low walls, red "watched" floor | The full map, but not where the Operator is | Localising a person you can't see, then routing around watched cells to a ringing phone |

Every room is solvable only by talking: the server sends each player *only their half* (see [Information split](#information-split)).

## Screenshots

Full-quality captures of every room, Operator on the left of each pair and Mentor on the right, are in [`docs/screenshots/`](docs/screenshots/) (regenerate with `npm run shots`), along with `6-tv-bridge.png`, the castable TV screen.

## Design handoff → implementation

| Handoff decision | What shipped |
|---|---|
| Platform: browser | Static client served by a small Node server; no build step (ES modules + import map). |
| Hyper-realistic full 3D | Three.js with PBR materials, a procedurally generated normal-mapped material set, real-time reflections on wet floors, shadows, volumetric light cones, bloom, depth-of-fog, scanlines, chromatic glitch. See [Visual fidelity](#visual-fidelity--an-honest-note). |
| 4–5 puzzle rooms | Five rooms, 13 puzzle stages in total. |
| Voice via Discord | No voice in the game. The lobby tells players to start a call; there is no text chat anywhere. |
| Connecting meta-narrative | The Halcyon crew, the Protocol and its author (Ada Kerr), the Agents, and a hardline phone — told through interstitials, ending with a page you "add" to the Protocol with both callsigns. |
| Private sessions only | Code + invite link; two seats; nothing public. |
| Roles chosen/random, swappable | Host picks Operator / Mentor / Random; swap-every-room toggle; either player can press *Swap roles* during an interstitial. |
| Shared countdown, soft reset on fail | One server-authoritative clock per room; expiry reloads the same room with a re-rolled puzzle. |
| Pause on disconnect | Server pauses the clock the instant a socket drops; clients auto-reconnect and resume the same seat. |
| Audio: score ducks under voice | See [Audio](#audio). |
| Interstitials: in-fiction, skippable after first playthrough | Typed radio/boot sequences double as load cover (the progress bar reflects real scene building). Skippable from your second run; the *resimulating* retry screens are always skippable. |
| Jack-in / wake-up bookends | Intro sequence on start; the "waking up" ending with per-layer stats. |

## Audio

All audio is synthesised with WebAudio (no asset files):

- **Score** — a dark industrial drone with a minor-sixth pad and sparse dissonant brass-cluster swells, rooted on a different note per room. It is deliberately quiet and thin so voices stay clear, and gets denser as the clock runs down.
- **Sound carries information** — three unmistakable feedback cues (*correct*: rising chime; *wrong*: a distorted falling buzz; *time low*: Agent-patrol stingers at 30 s and 10 s), a clock tick under 60 s and an accelerating heartbeat under 20 s, plus a rising system hum. Operator hotspots make a short code-flicker when highlighted; the Mentor's page-turns make paper sounds.
- **Ducking** — voice chat lives in Discord, so the game can't hear your partner. As an **opt-in** setting (*Audio → Duck the score while I'm talking*) it analyses *your* microphone locally to duck the score while you speak. Nothing is recorded or transmitted. There are also master / score / effects sliders and a mute.

## Architecture

```
server/
  index.js          static files + WebSocket endpoint (/ws), session registry
  session.js        one session: lobby → briefing → playing → solved|failed → … → ending
  puzzles/          one generator per room (cipher, doors, bullets, switchboard, maze)
shared/             code used by both server and browser (served at /shared/)
  glyphs.js         the construct's alphabet (SVG strokes; drawn in 3D and in the manual)
  rooms.js          roster, timings, penalty
  story.js          every line of narrative
  rng.js            seeded RNG
public/
  index.html, css/  screens, HUD, the paper manual
  cast.html         the TV / bridge display (served at /cast)
  js/main.js        app flow, interstitials, HUD, message routing
  js/cast.js        the TV screen: spectator connection, trace ring, ship log, descent map
  js/net.js         WebSocket client with auto-reconnect + seat resume
  js/audio.js       WebAudio score, SFX, tension, mic ducking
  js/stage.js       renderer, post-processing, camera rig, hotspots, tweens
  js/textures.js    procedural PBR textures, canvas textures, code-rain
  js/kit.js         room shells, wet floors, light cones, dust, glitching edges
  js/operator/*.js  the five 3D rooms
  js/mentor/*.js    the five manuals (+ shell.js: tabs and the ship panel)
test/               unit + protocol tests, solver bots, two-browser end-to-end
```

### Information split

The server is authoritative. Each puzzle's `create()` returns `{ state, views: { operator, mentor } }`; the answer lives only in `state` on the server. The two views are sent to different players and neither contains the other's reference data (a test asserts this per room). The Operator never receives the cipher tables, the door log, the drift chart, or the wiring; the Mentor never receives the glyph sequence, the doors, the bullets, or the maze position. Mentors can't send actions at all.

For the maze, the server only ever sends the Operator the 3×3 patch around them, not the whole map.

### Protocol (JSON over WebSocket)

Client → server: `create`, `join`, `resume`, `spectate` (read-only TV screen), `setPref`, `setSwap`, `start`, `ready`, `swap`, `act`, `again`, `leave`, `ping`.
Server → client: `joined`, `spectating`, `lobby`, `briefing` (role-specific view; spectators get no view), `go`, `fx` (result + per-role event + new view), `timer`, `pause`, `resume`, `failed`, `solved`, `ending`, `peer`, `partnerReady`, `error`.

The clock is a server value; clients count down locally from each `remainingMs` and are re-synced every 4 s and on every penalty.

## Tests

```
npm test            # puzzle + session/protocol tests (fast, no browser)
npm run e2e         # two real Chromium sessions play the whole game through the UI
node test/e2e/run.mjs resilience   # disconnect/rejoin/timeout scenarios only
npm run shots       # full-quality screenshots of every room into docs/screenshots/
```

- **Solver bots** play every room using *only* the two role views — the information two humans would have after talking — across 150 seeds per room. If they can solve it, it's solvable; the info-split test proves neither half is enough alone (blind guessing the cipher door wins <3 % of the time).
- **Session tests** drive the real WebSocket protocol: full five-room playthrough with role swapping, soft reset with re-rolled puzzle, 15 s penalties, the mentor being unable to act, pause-on-disconnect with a frozen clock, rejoin with state intact, lobby rules.
- **Network tests** start the server with its default settings and reach the page and the game protocol through this machine's real LAN address as well as loopback.
- **TV-feed tests** watch a live two-player session as a spectator and scan everything it receives for every puzzle-secret key (and the actual glyphs, sconce colour and typed code); they also cover mid-room catch-up, read-only enforcement and the cap.
- **End-to-end** launches the real server and two Chromium instances (software WebGL), reads each page's actual views, and clicks the actual 3D hotspots through all five rooms — including a deliberate mistake in each — then checks the ending screen. It also checks that a dropped partner pauses the clock (and that it is genuinely frozen) and that rejoining restores the same seat, that timer expiry produces the *resimulating* interstitial, and a pointer-picking regression (a not-yet-active hit box must never swallow a click meant for something behind it — this once made the final step into the phone unclickable), and the TV screen at 1080p (lobby, story, live room, reacting to a mistake, reconnecting after a reload, and no puzzle information anywhere on its page). The e2e runs use `?gfx=low` so software WebGL can keep up; screenshots land in `test/e2e/out/`.

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `PORT` / `HOST` | `3000` / `::` (all interfaces) | Where to listen. Set `HOST=127.0.0.1` to accept this computer only |
| `TIME_SCALE` | `1` | Multiply every room's clock (`0.1` = ten times shorter; handy for testing failure) |
| `START_ROOM` | `0` | Development aid: jump straight to room N (0–4) |
| `SOLVE_HOLD_MS` / `FAIL_RESET_MS` | `3400` / `4200` | How long the *layer cleared* / *resimulating* screens hold |

Room clocks and the penalty live in `shared/rooms.js`.

To play across the internet, run it anywhere that can serve HTTPS with WebSocket upgrades (the client uses `wss://` automatically) and share the invite link. Sessions are in memory; a restart ends them.

## Visual fidelity — an honest note

The handoff targets *hyper-realistic full 3D*. This build ships with no downloaded art assets: every texture, material and model is procedural, so it is high-fidelity-stylised rather than photoreal. What gets it most of the way is the lighting model (physically based materials, shadowed spot lights, wet-floor reflections, light shafts, fog, bloom) and heavy post-processing. If you want to push toward photorealism, the seams are clean: drop glTF models/PBR texture sets into `textures.js` / each room's builder, and bake or add an HDRI for `scene.environment` in `stage.js`. **Graphics: Auto / High / Low** (Settings, the ♪ button) — *Auto* drops resolution and then disables reflections if it can't hold ~25 fps; *Low* starts without reflections or MSAA (best for integrated GPUs). Changes apply from the next room.

## Known limitations

- **Colour-dependent puzzles.** The bullet tracers, cables, sconces and glimpses are distinguished by colour (glimpses and tracers also differ in motion/length). Players with colour-vision deficiency may struggle; a patterned/shape-coded mode would be the next accessibility step.
- **No partner-voice detection.** Ducking only hears *your* mic (see Audio).
- **Sessions are in memory** and single-server.
- **Touch** works for every hotspot, but the Operator rooms are best on a larger screen.
