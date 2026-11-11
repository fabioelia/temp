// The slice of the chrome.* extension API that background.js and the panel
// use, built on Electron, so the extension's own code runs unchanged in the
// menu bar app. Storage lives in the main process; renderers reach it over IPC
// (preload.cjs).
import { execFile } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BrowserWindow, Notification, app, powerMonitor, safeStorage, shell } from 'electron';

// ─── storage ─────────────────────────────────────────────────────────────
// chrome.storage.local, persisted to one file in the app's data folder. The
// file holds the GitHub token, so it is encrypted with the OS keychain
// (safeStorage) when that is available.
const FILE = join(app.getPath('userData'), 'storage.bin');
const listeners = { storage: [] };

function readStore() {
  if (!existsSync(FILE)) return {};
  try {
    const raw = readFileSync(FILE);
    const text = raw.subarray(0, 5).toString() === 'json:' ? raw.subarray(5).toString() : safeStorage.decryptString(raw);
    return JSON.parse(text);
  } catch (e) {
    console.error('PR Radar: could not read stored settings, starting fresh', e);
    return {};
  }
}

let writeTimer = null;
function writeStore(data) {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    const json = JSON.stringify(data);
    writeFileSync(FILE, safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(json) : Buffer.from(`json:${json}`));
  }, 200);
}

function makeArea(name, data, persist) {
  return {
    async get(keys) {
      if (keys == null) return structuredClone(data);
      const list = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
      return structuredClone(Object.fromEntries(list.filter((k) => k in data).map((k) => [k, data[k]])));
    },
    async set(items) {
      const changes = {};
      for (const [k, v] of Object.entries(items)) {
        changes[k] = { oldValue: data[k], newValue: v };
        data[k] = structuredClone(v);
      }
      if (persist) writeStore(data);
      for (const fn of listeners.storage) fn(changes, name);
      for (const w of BrowserWindow.getAllWindows()) w.webContents.send('storage-changed', changes, name);
    },
  };
}

export const storage = { local: makeArea('local', readStore(), true), session: makeArea('session', {}, false) };

// ─── Chrome tabs, over AppleScript (macOS) ───────────────────────────────
// Lets "switch to the tab already showing this PR" work from outside the
// browser. It never launches Chrome, and if macOS's automation prompt is
// declined every lookup comes back empty, so links just open normally.
function osa(lines) {
  if (process.platform !== 'darwin') return Promise.resolve(null);
  return new Promise((resolve) => execFile('osascript', lines.flatMap((l) => ['-e', l]), { timeout: 4000 }, (err, out) => resolve(err ? null : out.trim())));
}

const CHROME_TABS = [
  'set out to ""',
  'if application "Google Chrome" is running then',
  'tell application "Google Chrome"',
  'repeat with w in windows',
  'set i to 0',
  'repeat with t in tabs of w',
  'set i to i + 1',
  'set out to out & (id of w) & tab & i & tab & (URL of t) & linefeed',
  'end repeat',
  'end repeat',
  'end tell',
  'end if',
  'return out',
];
const ACTIVE_TAB = ['if application "Google Chrome" is running then', 'tell application "Google Chrome" to return URL of active tab of front window', 'end if', 'return ""'];

async function chromeTabs(query = {}) {
  if (query.active) {
    const url = await osa(ACTIVE_TAB);
    return url ? [{ id: 'active', windowId: 0, url }] : [];
  }
  const out = await osa(CHROME_TABS);
  const tabs = (out || '')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [windowId, index, url] = line.split('\t');
      return { id: `${windowId}:${index}`, windowId: Number(windowId), url };
    });
  const prefix = query.url ? query.url.replace(/\*$/, '') : '';
  return prefix ? tabs.filter((t) => t.url.startsWith(prefix)) : tabs;
}

async function focusChromeTab(id) {
  const [w, i] = String(id).split(':').map(Number);
  if (!w || !i) return;
  await osa(['tell application "Google Chrome"', `set active tab index of (first window whose id is ${w}) to ${i}`, `set index of (first window whose id is ${w}) to 1`, 'activate', 'end tell']);
}

// ─── the chrome object ───────────────────────────────────────────────────
const hooks = { startup: [], message: [], alarm: [], idle: [], notificationClick: [] };
const alarms = new Map();
const notifications = new Map();
let badgeHandler = () => {};

// What the app shell needs from this module: start-up, message dispatch,
// and where the badge text goes.
export const host = {
  onBadge: (fn) => (badgeHandler = fn),
  startup: () => hooks.startup.forEach((fn) => fn()),
  // Runs a chrome.runtime message through background.js's listeners and
  // resolves with the reply, as Chrome does.
  message: (msg) =>
    new Promise((resolve) => {
      let async = false;
      for (const fn of hooks.message) if (fn(msg, {}, resolve) === true) async = true;
      if (!async) resolve(undefined);
    }),
  tabsQuery: chromeTabs,
};

let lastIdle = 'active';
setInterval(async () => {
  const now = await chrome.idle.queryState(600);
  if (now !== lastIdle) hooks.idle.forEach((fn) => fn(now));
  lastIdle = now;
}, 60_000).unref?.();
powerMonitor.on('unlock-screen', () => hooks.idle.forEach((fn) => fn('active')));
powerMonitor.on('resume', () => hooks.idle.forEach((fn) => fn('active')));

const ICON = join(import.meta.dirname, 'ext', 'icon.png');

export const chrome = {
  storage: { ...storage, onChanged: { addListener: (fn) => listeners.storage.push(fn) } },
  runtime: {
    onInstalled: { addListener: () => {} },
    onStartup: { addListener: (fn) => hooks.startup.push(fn) },
    onMessage: { addListener: (fn) => hooks.message.push(fn) },
  },
  alarms: {
    create(name, { delayInMinutes, periodInMinutes }) {
      clearTimeout(alarms.get(name));
      const fire = () => {
        hooks.alarm.forEach((fn) => fn({ name }));
        if (periodInMinutes) alarms.set(name, setTimeout(fire, periodInMinutes * 60_000));
      };
      alarms.set(name, setTimeout(fire, (delayInMinutes ?? periodInMinutes) * 60_000));
    },
    async clear(name) {
      clearTimeout(alarms.get(name));
      return alarms.delete(name);
    },
    onAlarm: { addListener: (fn) => hooks.alarm.push(fn) },
  },
  idle: {
    setDetectionInterval: () => {},
    // Chrome's vocabulary: active | idle | locked. "unknown" counts as active
    // so a platform without idle detection still polls.
    async queryState(seconds) {
      const s = powerMonitor.getSystemIdleState(seconds);
      return s === 'idle' || s === 'locked' ? s : 'active';
    },
    onStateChanged: { addListener: (fn) => hooks.idle.push(fn) },
  },
  notifications: {
    create(id, { title, message }) {
      if (!Notification.isSupported()) return;
      const n = new Notification({ title, body: message, icon: ICON });
      n.on('click', () => hooks.notificationClick.forEach((fn) => fn(id)));
      notifications.set(id, n);
      n.show();
    },
    clear(id) {
      notifications.get(id)?.close();
      notifications.delete(id);
    },
    onClicked: { addListener: (fn) => hooks.notificationClick.push(fn) },
  },
  action: {
    setBadgeText: ({ text }) => badgeHandler(text),
    setBadgeBackgroundColor: () => {},
  },
  sidePanel: { setPanelBehavior: () => {} },
  tabs: {
    query: chromeTabs,
    create: ({ url }) => shell.openExternal(url),
    update: (id) => focusChromeTab(id),
  },
  windows: { update: async () => {} },
  // The artifact link needs the browser's GitHub login, so the browser
  // downloads it.
  downloads: { download: ({ url }) => shell.openExternal(url) },
};
