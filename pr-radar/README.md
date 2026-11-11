# PR Radar

A Chrome side panel for keeping track of many open PRs and the Claude sessions behind them: CI and other checks, labels you care about, values pulled out of PR bodies and comments, and buttons for the actions you take most. It polls the GitHub API and nothing else; there is no server.

- **Side panel**: one section per search query, "needs you" PRs first. Each PR shows the checks you picked, your labels, links to its Claude sessions and preview, and extracted text such as the QA verdict. Filter box and a "Needs me" toggle.
- **Check details**: click a card's background to see every check on the latest commit, failures first. Each failure shows GitHub's annotations (file:line and message), the check's summary, a **Show log tail** button for Actions jobs (the failure lines plus the last 60 lines), and re-run.
- **Toolbar badge**: how many PRs need you.
- **Desktop notifications** when something you marked `notify` changes: a label is added, a check finishes, an extracted value changes, a draft is marked ready, or a PR leaves your list. Clicking one opens the PR.
- **Follows your tabs**: on a PR page or a Claude session page, the panel highlights that PR.
- **Badge on claude.ai**: on `claude.ai/code/session_…`, a small pill in the corner shows the PR(s) that link the session and their state. It reads only the page URL, never claude.ai's DOM.
- **Actions**: request QA or AI review, toggle `skip-qa`, mark a draft ready or convert it back to draft, close the PR, re-run a failed Actions job. **🏷 Labels…** opens a picker with every label in the repo, so you can add or remove any of them at once. Every write takes two clicks.
- **Artifacts**: clicking the QA verdict chip downloads that run's `qa-screenshots-pr<N>` artifact through your GitHub login in the browser. The artifact expires after 14 days.

## Install

1. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick this `pr-radar` folder.
2. Click the PR Radar icon to open the side panel, then ⚙ for settings.
3. Paste a GitHub token and click **Test**:
   - **Fine-grained token:** set **Resource owner** to the org. A token covers one owner, so make one per org you track. Under Repository permissions set Pull requests, Issues, Contents, Commit statuses and Actions to read. For the buttons, set Pull requests and Issues to write, and Actions to write for re-runs. The org may need to approve the token. GitHub doesn't let fine-grained tokens call the Checks API, so the panel reads checks from the **Actions API** instead (see below).
   - **Classic token:** the `repo` scope covers every repo you can reach and every check. If an org uses SAML single sign-on, click **Configure SSO** next to the token and authorize that org.
   - **Test** lists the repos the token can see. Pick one and click **Check access** for a read-only check of each permission the panel uses.
   - If a permission is missing, the panel still shows what it could read and names each blocked field.
4. Save. The first poll runs right away, then every `pollMinutes` minutes.

The token is kept in `chrome.storage.local` for this browser profile only.

## Configure

**Only the repos you set up are tracked.** Every search is limited to them (with `repo:` qualifiers), and PRs from any other repo are ignored. Each repo has its own labels, checks, extractors and buttons; searches and the General settings are shared. Under **Repos you track**, add a repo (it autocompletes from the repos your token can see), starting from the basics (an "All checks" summary chip, Claude session links, draft/ready/close buttons) or as a copy of a repo you already set up. The defaults come with `Newton-Research-Inc/newton` set up. Settings saved by an earlier version move under that repo.

The settings page has a **Form** tab and a **JSON** tab that edit the same config. In the form, every section has **+ Add**, ↑/↓ to reorder, ✕ to delete and a list of presets. When you pick a repo to edit, its labels and recent check names load, and the label and check-name fields autocomplete from them. Check names are typed as plain names; `*` means every check, and `/pattern/` is a regex. The JSON tab is there for copying a config to someone else or for anything the form doesn't cover. **Reset to defaults** loads the preset in `lib.js` (`DEFAULT_CONFIG`), which is tuned for the Newton monorepo.

The JSON fields:

| Key | What it does |
|---|---|
| `pollMinutes` | Poll interval (minimum 0.5). Each query is one GraphQL call; GitHub allows 5,000 points an hour. |
| `checksSource` | `auto` (default), `checks` or `actions`. See **Where checks come from** below. |
| `queries[]` | `{title, q}`: GitHub search syntax, one panel section each, limited to the repos in `repos`. A PR in several shows under the first. |
| `repos` | `{"owner/name": {labels, checks, extractors, actions}}`: the repos you track, each with the four lists below. |
| `labels[]` (per repo) | `{name, kind, notify}`: `kind` is `alert` (counts as "needs you"), `ok`, `pending` or `info`. Labels not listed stay hidden unless `showOtherLabels` is true. |
| `checks[]` (per repo) | `{label, match, rollup, notify, showTitle, alertTitle}`: `match` is a regex on the check name. If one name has several runs, the newest one that wasn't skipped counts. `rollup: true` sums every matching check into one chip, worst state first. `showTitle` shows the check's output title; `alertTitle` is a regex on that title that counts as "needs you". |
| `extractors[]` (per repo) | `{name, source, contains, regex, all, kind, notify, artifacts}`: pulls values out of the PR body (`body`), comments and review bodies (`comments`), or both (`all`). `contains` limits it to texts holding a marker. It takes capture group 1 if there is one, else the whole match. `all: true` keeps every match, otherwise the newest. `kind` is `link` or `text`. `artifacts` is a regex on artifact names: the chip then downloads the matching artifacts of the Actions run linked from the same text (the last `/actions/runs/<id>` link in it). |
| `actions[]` (per repo) | `{title, type, label, when}`: `type` is `addLabel`, `removeLabel`, `toggleLabel`, `markReady`, `convertToDraft` or `close`. `when` is `draft` or `ready`. An add button hides when the label is already there, and a remove button when it isn't; a toggle shows `+` or `−`. |
| `attention` | `{failedChecks, changesRequested, conflicts}`: other things that count as "needs you". |

Examples:

```json
{ "title": "Bot PRs I'm on", "q": "is:pr is:open repo:Newton-Research-Inc/newton author:app/the-newton-bot involves:@me" }
```

```json
{ "name": "Jira", "source": "body", "regex": "\\[(NP-\\d+)\\]", "kind": "text" }
```

## Where checks come from

With a classic token, checks come from GitHub's Checks API inside the main GraphQL query. A fine-grained token can't call that API (GitHub lists it as a fine-grained token limitation), and gets `null` back for each check run. In `auto` mode the panel then reads the PR's head commit from the **Actions API**: one call for its workflow runs, then one per run that wasn't fully skipped for its jobs. Every Actions job is also a check run with the same name, so configured check names match either way, and the jobs API adds the name of the failed step. Repeat requests carry the last ETag, and GitHub doesn't count the resulting 304s against the hourly limit, so polling stays cheap while nothing changes.

What the Actions API can't see: check runs that aren't Actions jobs, such as `review/gate` and the summary `CodeQL` check, and failure annotations. The **AI verdict** extractor reads the same verdict `review/gate` reports, from the AI review ledger comment, so it works with either token.

## What it doesn't do, and why

- **No preview probing.** Every request to a Newton preview URL counts as activity and wakes a sleeping preview (`apps/preview-router/proxy.go`). Polling `/readyz` would keep all your previews running. The preview state shown comes from the `preview / Build, deploy, comment` check and the link in the PR body, both from GitHub.
- **No live Claude session status** (working, blocked, idle). claude.ai has no public API for it, and scraping its pages would break whenever its UI changes. Sessions appear because a PR links them: the `## Agent session` section of the PR body, or any comment that contains a session URL.
- **Raw PR bodies are never stored.** Only extracted values are kept. Don't write an extractor that captures a secret: a Newton PR body's preview block carries an MCP token.
- **Agent PRs authored by a bot** (`the-newton-bot[bot]`) don't match `author:@me`. Add a query for them, like the example above.

## Develop

```bash
npm test
```

runs the unit tests for `lib.js` (Node 20+, no dependencies). The other files are plain ES modules with no build step: edit them, then click reload on `chrome://extensions`.

| File | Role |
|---|---|
| `lib.js` | Default config, GraphQL query, normalization, "needs you" rules, change detection, tab matching |
| `github.js` | GitHub API calls and the token access check |
| `background.js` | Polling, badge, notifications, write actions |
| `builder.js` | The settings form, generated from its `SECTIONS` table |
| `dom.js` | The text-only element helper both pages use |
| `sidepanel.*` | The panel |
| `options.*` | Token and JSON config editor |
| `content.js` | The badge on claude.ai session pages |
