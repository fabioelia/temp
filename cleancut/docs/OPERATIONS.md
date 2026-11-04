# Running and maintaining CleanCut

**Short answer:** it is cheap to run and the code is small, but it is not
"set and forget". The server is the easy part. The ongoing work is keeping
the Netflix and Prime adapters alive as those sites change, and moderating the community
database once strangers can write to it.

## What has to run

| Piece | Needs | Cost |
| --- | --- | --- |
| **Extension** | Nothing at runtime. It ships as a zip in the user's browser. Updates go through the Web Store. | $5 once (developer account) |
| **Website** (`site/`) | Static hosting: GitHub Pages, Cloudflare Pages or Netlify | $0 |
| **Community server** (`server/`) | One small VM or container with **Node ≥ 22.13**, a **persistent disk** for the SQLite file, and an **HTTPS reverse proxy** (Caddy, nginx or a PaaS router) | ≈ $4–6/month (e.g. Fly.io, Railway, Hetzner, a $5 droplet) |
| **Domain** | One domain for the website and API (`api.` subdomain) | ≈ $10–15/year |
| **Scanner** (optional) | A machine with `ffmpeg`, only when you want to pre-seed titles | Your laptop |

Runtime dependencies on the server: **zero npm packages**. It uses Node's
built-in `node:http` and `node:sqlite`. The only dev dependency is `esbuild`
(extension build). That's a very small supply chain to keep patched.

### Deploying the server

```bash
git clone <repo> && cd cleancut
PORT=8787 HOST=0.0.0.0 TRUST_PROXY=1 CLEANCUT_DB=/data/cleancut.db \
  node --disable-warning=ExperimentalWarning server/src/index.js
```

- `TRUST_PROXY=1` is required behind a proxy. Without it, the rate limiter sees every
  user as one IP (the proxy's) and the whole service shares one 120-writes-per-minute budget.
  Only set it when a proxy you control really sits in front, since the header is client-supplied otherwise.
- Terminate HTTPS at the proxy. The extension, running on an `https://` site, needs an `https://` API.
- `CLEANCUT_DB` must point at the persistent volume.
- Run it under systemd, Docker, or your PaaS so it restarts on crash.
- A small `Dockerfile` (`FROM node:22-slim`, copy, `CMD`) is about 6 lines and worth adding when you pick a host.

**Backups:** SQLite in WAL mode. Nightly `sqlite3 cleancut.db ".backup backup.db"`
to object storage (or the host's volume snapshots). The whole database for
thousands of titles is a few MB.

**Capacity:** a lookup is one indexed SQLite read. A single $5 instance should comfortably serve tens of thousands of
active users; the limit you'll hit first is moderation, not CPU. If you outgrow one box, the move is to Postgres, a rewrite of `db.js` and the prepared statements in `app.js`.

## How maintainable is the code?

| Area | Assessment |
| --- | --- |
| Size | About 4k lines of source JS across extension, server, scanner and shared core. One person can hold it in their head. |
| Dependencies | Runtime: none on the server; the extension bundle is all first-party. Dev: esbuild. Optional: `onnxruntime-node` for the scanner only. |
| Tests | 27 unit/API/scanner tests (about a second), plus a headless-Chromium end-to-end test that loads the built extension. Run both before every release. |
| Structure | Platform-specific code is isolated in `extension/src/content/adapters.js` and `page-hook.js`. The decision engine, ratings and analyzer are pure functions in `shared/` and well covered. |
| Cross-browser | One source, builds for Chrome (service worker) and Firefox (background scripts). |
| Docs | The README covers the architecture, API and the known limits. |

## What will actually take your time

1. **Site changes (high, recurring).** Netflix and Prime Video don't promise stable
   internals. The code depends on their player API (Netflix seeking), JSON shapes
   (title and subtitle discovery), and DOM (Prime's clock). Expect breakage a few times a
   year; each is typically a few hours of work: find what changed, update the adapter, ship.
   Every dependence on site internals is marked in the code. When it breaks, **skips fail but
   mutes and blurs often keep working**, so users notice quickly.
   *Mitigation:* add a canary (below), and consider a way to push adapter selectors without a full
   Store review. Remote-config for selectors only is allowed (data, not code), but don't fetch code.
2. **Moderation (medium, grows with success).** Accounts are open (`POST /v1/users`), and anyone can submit tags
   and skip lists. Votes hide bad tags (score ≤ −3), and writes are rate-limited, but there is
   **no admin UI, no abuse reporting, no ban tool** yet. Plan on: a way to delete a user/tag (SQL
   for now), a report link on the hub, and a name filter for display names.
3. **Support (low to medium).** Most tickets will be "it didn't skip X" (no tag or subtitle cue), "subtitles not scanned yet" (turn on English captions), or a Prime timing offset (Sync nudge). The FAQ and support page answer
   these. Budget ≈ 1–3 hours/week at a few thousand users.
4. **Store housekeeping (low).** Each update needs a version bump and re-review (usually quick for small diffs, slower if permissions change). Respond to review emails within the window.
5. **Security and privacy (low, but non-negotiable).** Keep Node patched, never log request bodies or auth headers, keep the privacy policy in line with what the code sends. If you add a new data flow, update `privacy.html` *and* the dashboard's disclosures first.

## Monitoring (set up before launch)

- **Uptime:** a free uptime check on `GET /v1/titles?limit=1` (Better Stack, UptimeRobot).
- **Extension health:** the extension has no telemetry by design. Without it you learn about breakage from reviews and emails. Cheaper alternative: a weekly manual smoke test on one Netflix and one Prime title (10 minutes), and the existing e2e test for regressions in your own code.
- **Disk:** alert at 80% on the volume holding the DB.

## Support model

- Public support page, one shared mailbox, and an issue tracker for bugs.
- Triage rule: *"doesn't work on site X since date Y"* is top priority, *"missed a scene"* means ask for a tag, *"timing is off"* means Sync nudge and a note for the title.
- Respond to Store reviews. Quick replies to the bad ones help rating and visibility more than anything else.

## Rough monthly effort

| Stage | Hours/month | Out-of-pocket |
| --- | --- | --- |
| Quiet (no site changes, < 1k users) | 2–4 | ≈ $5 |
| Typical (a site change, a few thousand users) | 8–15 | ≈ $5–10 |
| Growing (needs moderation tooling, 10k+ users) | 15–30 | $10–30 |

## Suggested next improvements, in order

1. Production config: hosted API URL, store-build manifest, `Dockerfile`.
2. Real-account testing on Netflix and Prime, then fix the adapters.
3. Admin tooling: delete user/tag, ban by key, report button.
4. Adapter canary: a scheduled headless check that the title ID and subtitle URL can still be extracted from the live sites.
5. Cue-timing fingerprints for automatic cross-platform sync (already on the roadmap).
