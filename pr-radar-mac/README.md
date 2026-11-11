# PR Radar for the Mac menu bar

PR Radar in the menu bar: an icon showing how many PRs need you, and the same panel as the Chrome extension in a popover under it. Cards, check details, logs, QA and Playwright reports, labels, buttons and settings all work as in the extension.

It runs the extension's own code. `npm start` and `npm run dist` copy the pages and logic from `../pr-radar` into `ext/`, and `shim.js` supplies the `chrome.*` calls they make (storage, messages, alarms, idle, notifications, the badge) on Electron. Change the extension, rebuild, and the app follows.

## Run it

From this folder, on your Mac (Node 20 or later):

```bash
npm install
```

```bash
npm start
```

The radar icon appears in the menu bar. Click it for the panel, right-click for Refresh, Settings…, **Open at login** and Quit. Open **Settings…** and paste your GitHub token (the same kind as the extension needs), add the repos you track, and save.

## Build the app

```bash
npm run dist
```

This writes a `.dmg` and a `.zip` to `dist/`. Drag **PR Radar** to Applications. The app isn't signed with an Apple Developer ID, so the first launch needs **right-click → Open → Open**. If macOS says the app "is damaged", clear the quarantine flag and open it again:

```bash
xattr -cr "/Applications/PR Radar.app"
```

## How it differs from the extension

- **Settings are separate.** The app keeps its own token and config, in its data folder (`~/Library/Application Support/PR Radar/storage.bin`), encrypted with your macOS keychain. To reuse the extension's setup, copy its settings from the **JSON** tab into the app's.
- **Links open in your browser.** A PR link first looks for a Chrome tab already showing that PR and switches to it, through AppleScript. The first time, macOS asks to let PR Radar control Google Chrome; if you decline, links simply open a new tab in your default browser.
- **The current-PR highlight** follows the front Chrome tab, read when you open the panel.
- **Artifact downloads** open in your browser, which has your GitHub login.
- **No claude.ai badge.** That lives in the browser, so it stays an extension feature.

## Files

| File | Role |
|---|---|
| `main.js` | Menu bar icon, the popover and settings windows, the bridge between them and the background code |
| `shim.js` | The `chrome.*` API on Electron: storage (keychain-encrypted), alarms, idle, notifications, badge, Chrome tabs over AppleScript |
| `preload.cjs` | Gives the pages `chrome.*` and sends their GitHub requests through the main process (a page outside an extension hits CORS on the job-log download) |
| `copy-ext.mjs` | Copies the extension's files into `ext/` |
| `assets/` | Menu bar template icons and the app icon |
