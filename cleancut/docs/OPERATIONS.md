# Running and maintaining CleanCut

**Short answer:** with community data stored as reviewed files in the GitHub repo, there is
**nothing to host or keep running**, and it costs $0. The ongoing work is keeping the Netflix
and Prime adapters alive as those sites change, and reviewing contributed pull requests.

## What has to run

| Piece | What | Cost |
| --- | --- | --- |
| **Extension** | Nothing at runtime. A zip in the user's browser; updates go through the Web Store. | $5 once (developer account) |
| **Website + community data** | GitHub Pages, deployed by `.github/workflows/cleancut-data.yml` on every merge | $0 |
| **Moderation** | Pull requests on `cleancut/community/**`, checked by CI | your time |
| **Server (`server/`)** | **Not used by the extension.** Kept as an option if you later want accounts, votes and instant publishing. | n/a |

## How the data flows

```
 contributor                     GitHub                                     users
 ───────────                     ──────                                     ─────
 tags a scene (Alt+[ / Alt+])
 Options → Submit on GitHub ──▶  pull request: community/titles/.../x.json
                                 CI: node scripts/build-data.mjs --check
                                 maintainer reviews, merges
                                        │
                                        ▼  workflow: npm run site
                                 GitHub Pages:  /data/v1/index.json
                                                /data/v1/titles/<platform>/<hash>.json   ◀── extension downloads
```

- The extension downloads **one small `index.json`** (cached 6 hours), then **only** the file
  for a title that appears in it. Titles with no data cost no request.
- Data files are merged per title and de-duplicated by content, so many contributors can add
  tags for the same episode without merge conflicts (each contribution is its own file).
- Scale: one file per title. Thousands of titles is fine; the index grows by about 200 bytes
  per title. If the index passes roughly 1 MB, split it by platform.

## One-time setup

1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Merge to `master`. The workflow validates, builds `_site/` (website + `data/v1/`) and deploys.
3. Check `https://<user>.github.io/<repo>/data/v1/index.json` loads in a browser. Before any
   data exists it contains empty tables, which is correct.
4. If the repo name or owner differs from `fabioelia/temp`, update the three constants in
   `extension/src/config.js` and the repo/Pages links in `site/`.
5. Optional: branch protection on `master` requiring the **validate** check, so nothing
   malformed can merge.

## Maintainability

| Area | Assessment |
| --- | --- |
| Size | About 4k lines of source JS. One person can hold it in their head. |
| Dependencies | **Runtime: none.** Dev: `esbuild`. Optional: `onnxruntime-node` for the scanner only. |
| Tests | 34 unit tests (about a second) plus a headless-Chromium end-to-end test that loads the built extension and a static dataset. |
| Structure | Site-specific code is isolated in `extension/src/content/adapters.js` and `page-hook.js`. Ratings, engine, analyzer, dataset building and lookup are pure functions in `shared/`. |
| Hosting risk | None to operate. GitHub Pages is the only dependency, and the extension keeps working from its cache and your own tags if it's down. |

## What will actually take your time

1. **Site changes (high, recurring).** Netflix and Prime don't promise stable internals. The code depends on
   their player API (Netflix seeking), JSON shapes (title and subtitle discovery) and DOM (Prime's clock).
   Expect breakage a few times a year; each fix is typically a few hours: find what changed, update the
   adapter, ship. When Netflix's seeking breaks, skips fail but mutes and blurs keep working.
2. **Reviewing pull requests (grows with success).** Each is a small JSON diff. CI already rejects malformed
   files, so review is about accuracy and spam. See `community/README.md` for the checklist. At a few PRs a
   week this is minutes per PR; it becomes the bottleneck first. When it does, add co-maintainers or a
   `CODEOWNERS` entry for `community/`, and consider auto-merging PRs from trusted contributors.
3. **Support (low to medium).** Most reports are "it didn't skip X" (no tag or subtitle cue), "subtitles not scanned
   yet" (turn on English captions) or a Prime timing offset (Sync nudge). The support page answers these.
   Budget about 1–3 hours a week at a few thousand users.
4. **Store housekeeping (low).** Each update needs a version bump and re-review (usually quick for small diffs).
5. **Privacy (low, non-negotiable).** If you add any new data flow, update `site/privacy.html` and the dashboard
   disclosures first.

## Trade-offs of the static model

- **Slower to publish.** A tag appears for everyone after review, merge and the Pages deploy, plus up to 6 hours of
  index cache. That is a feature for quality, a cost for freshness.
- **No votes.** Quality control is the PR review, not crowd voting. A bad merged tag is fixed by another PR.
- **GitHub sees the title-file requests** (not CleanCut). The privacy policy says so. The index-first design means only
  titles that have data are ever requested.
- **Contributors need a GitHub account**, though not git: the extension opens a pre-filled "new file" page.
- **Cold start.** The dataset begins empty. Until it fills, most value is the subtitle scan and your own tags.
  Seed popular titles yourself (or with `cleancut-scan`) before announcing.

## Monitoring

- **Data:** the workflow's red check on a PR or on `master` is the alert. Watch the Actions tab.
- **Extension health:** there is no telemetry by design. You learn about breakage from reviews and emails. Do a weekly
  10-minute smoke test on one Netflix and one Prime title, and run `npm run test:e2e` before every release.

## Rough monthly effort

| Stage | Hours/month | Out-of-pocket |
| --- | --- | --- |
| Quiet (no site changes, < 1k users) | 2–4 | $0 |
| Typical (a site change, a few thousand users, a few PRs a week) | 8–15 | $0 |
| Growing (10k+ users, many contributors) | 15–30 | $0 (domain optional) |

## If you outgrow it

Re-adding a server is incremental, not a rewrite: `server/` still has accounts, votes and publishing, and the
extension's lookup is isolated in `shared/lookup.js` and `background.js`. Likely triggers: wanting instant publishing, vote-based
quality, or more contributors than you can review. Free-tier hosts that keep a disk are scarce, so budget roughly $2–5 a month.
