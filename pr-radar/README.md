# PR Radar

A Chrome side panel for keeping track of many open PRs and the Claude sessions behind them: CI and other checks, labels you care about, values pulled out of PR bodies and comments, and buttons for the actions you take most. It polls the GitHub API and nothing else; there is no server.

- **Side panel**: one section per search query, "needs you" PRs first. Each PR shows the checks you picked, your labels, links to its Claude sessions and preview, and extracted text such as the QA verdict. Filter box and a "Needs me" toggle.
- **Toolbar badge**: how many PRs need you.
- **Desktop notifications** when something you marked `notify` changes: a label is added, a check finishes, an extracted value changes, a draft is marked ready, or a PR leaves your list. Clicking one opens the PR.
- **Follows your tabs**: on a PR page or a Claude session page, the panel highlights that PR.
- **Badge on claude.ai**: on `claude.ai/code/session_…`, a small pill in the corner shows the PR(s) that link the session and their state. It reads only the page URL, never claude.ai's DOM.
- **Actions**: add or remove a label (`qa-review`, `cursor-review`), mark a draft ready, re-run a failed Actions job. Every write takes two clicks.

## Install

1. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick this `pr-radar` folder.
2. Click the PR Radar icon to open the side panel, then ⚙ for settings.
3. Paste a GitHub token and click **Test**:
   - Classic token: `repo` scope.
   - Fine-grained token: read access to Pull requests, Issues, Checks and Metadata on the repos you track. Add write access to Pull requests and Issues for the label and mark-ready buttons, and to Actions for re-runs. An org can require approval for fine-grained tokens.
4. Save. The first poll runs right away, then every `pollMinutes` minutes.

The token is kept in `chrome.storage.local` for this browser profile only.

## Configure

The settings page holds the whole config as JSON, so you can copy it to someone else or keep variants. **Reset to defaults** loads the preset in `lib.js` (`DEFAULT_CONFIG`), which is tuned for the Newton monorepo.

| Key | What it does |
|---|---|
| `pollMinutes` | Poll interval (minimum 0.5). Each query is one GraphQL call; GitHub allows 5,000 points an hour. |
| `queries[]` | `{title, q}`: GitHub search syntax, one panel section each. A PR in several shows under the first. |
| `labels[]` | `{name, kind, notify}`: `kind` is `alert` (counts as "needs you"), `ok`, `pending` or `info`. Labels not listed stay hidden unless `showOtherLabels` is true. |
| `checks[]` | `{label, match, notify, showTitle, alertTitle}`: `match` is a regex on the check name. If one name has several runs, the newest one that wasn't skipped counts. `showTitle` shows the check's output title; `alertTitle` is a regex on that title that counts as "needs you". |
| `extractors[]` | `{name, source, contains, regex, all, kind, notify}`: pulls values out of the PR body (`body`), comments and review bodies (`comments`), or both (`all`). `contains` limits it to texts holding a marker. It takes capture group 1 if there is one, else the whole match. `all: true` keeps every match, otherwise the newest. `kind` is `link` or `text`. |
| `actions[]` | `{title, type, label, when}`: `type` is `addLabel`, `removeLabel` or `markReady`. `when` is `draft` or `ready`. A label button hides when the label is already there (or, for remove, when it isn't). |
| `attention` | `{failedChecks, changesRequested, conflicts}`: other things that count as "needs you". |

Examples:

```json
{ "title": "Bot PRs I'm on", "q": "is:pr is:open repo:Newton-Research-Inc/newton author:app/the-newton-bot involves:@me" }
```

```json
{ "name": "Jira", "source": "body", "regex": "\\[(NP-\\d+)\\]", "kind": "text" }
```

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
| `background.js` | Polling, badge, notifications, write actions |
| `sidepanel.*` | The panel |
| `options.*` | Token and JSON config editor |
| `content.js` | The badge on claude.ai session pages |
