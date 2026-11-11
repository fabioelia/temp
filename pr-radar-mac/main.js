// PR Radar in the menu bar: a tray icon showing how many PRs need you, and
// the extension's side panel as a popover under it. The extension's
// background.js runs here unchanged, on the chrome.* API from shim.js.
import { join } from 'node:path';
import { BrowserWindow, Menu, Tray, app, ipcMain, nativeImage, nativeTheme, screen, shell } from 'electron';
import { chrome, host, storage } from './shim.js';

const DIR = import.meta.dirname;
const PANEL = { width: 420, height: 680 };

// Tests point the app at a mock GitHub; never set in normal use.
if (process.env.PR_RADAR_API) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, init) => realFetch(typeof url === 'string' ? url.replace('https://api.github.com', process.env.PR_RADAR_API) : url, init);
}

if (!app.requestSingleInstanceLock()) app.quit();

let tray = null;
let panel = null;
let settings = null;
let badge = '';

const pageWindow = (opts) =>
  new BrowserWindow({
    ...opts,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0d1015' : '#f5f6f8',
    webPreferences: { preload: join(DIR, 'preload.cjs'), contextIsolation: false, sandbox: true, nodeIntegration: false },
  });

// Every link leaves the app for the browser; these windows only ever show
// the bundled pages.
function keepLinksOut(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('file:')) return;
    e.preventDefault();
    shell.openExternal(url);
  });
}

function getPanel() {
  if (panel && !panel.isDestroyed()) return panel;
  panel = pageWindow({ ...PANEL, show: false, frame: false, resizable: true, movable: false, minimizable: false, maximizable: false, fullscreenable: false, skipTaskbar: true, alwaysOnTop: true });
  panel.loadFile(join(DIR, 'ext', 'sidepanel.html'));
  panel.on('blur', () => !panel.webContents.isDevToolsOpened() && panel.hide());
  keepLinksOut(panel);
  return panel;
}

// Centered under the menu bar icon, kept on screen. Linux and some setups
// report no tray position; the top-right corner stands in.
function placePanel(win) {
  const b = tray.getBounds();
  const { workArea } = screen.getDisplayMatching(b.width ? b : screen.getPrimaryDisplay().bounds);
  const [w] = win.getSize();
  const x = b.width ? b.x + b.width / 2 - w / 2 : workArea.x + workArea.width - w;
  win.setPosition(Math.round(Math.min(Math.max(x, workArea.x + 8), workArea.x + workArea.width - w - 8)), Math.round(b.height ? b.y + b.height + 4 : workArea.y + 8));
}

function togglePanel() {
  const win = getPanel();
  if (win.isVisible()) return win.hide();
  placePanel(win);
  win.show();
  win.focus();
  // The panel highlights the PR open in the front Chrome tab; it may have
  // changed while the panel was hidden.
  win.webContents.send('tabs-activated');
}

function openSettings() {
  if (settings && !settings.isDestroyed()) return settings.show(), settings.focus();
  settings = pageWindow({ width: 1000, height: 860, title: 'PR Radar settings' });
  settings.loadFile(join(DIR, 'ext', 'options.html'));
  keepLinksOut(settings);
  panel?.hide();
  app.focus({ steal: true });
}

function setBadge(text) {
  badge = text || '';
  // "!" means no token or a failed poll; a number is how many PRs need you.
  tray?.setTitle(badge ? ` ${badge}` : '', { fontType: 'monospacedDigit' });
  tray?.setToolTip(badge === '!' ? 'PR Radar: needs attention (open it to see why)' : badge ? `PR Radar: ${badge} PR${badge === '1' ? '' : 's'} need you` : 'PR Radar');
}

function contextMenu() {
  return Menu.buildFromTemplate([
    { label: 'Open PR Radar', click: togglePanel },
    { label: 'Refresh now', click: () => host.message({ type: 'refresh' }) },
    { label: 'Settings…', accelerator: 'Command+,', click: openSettings },
    { type: 'separator' },
    { label: 'Open at login', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
    { type: 'separator' },
    { label: 'Quit PR Radar', accelerator: 'Command+Q', click: () => app.quit() },
  ]);
}

ipcMain.handle('storage:get', (_e, area, keys) => storage[area].get(keys));
ipcMain.handle('storage:set', (_e, area, items) => storage[area].set(items));
ipcMain.handle('runtime:message', (_e, msg) => host.message(msg));
ipcMain.handle('open-settings', () => openSettings());
ipcMain.handle('tabs:query', (_e, q) => host.tabsQuery(q));
ipcMain.handle('net:fetch', async (_e, url, init) => {
  const res = await fetch(url, init);
  const empty = res.status === 204 || res.status === 304;
  return { status: res.status, statusText: res.statusText, headers: Object.fromEntries(res.headers), body: empty ? null : await res.text() };
});

// A menu bar app has no windows most of the time; that is not a reason to quit.
app.on('window-all-closed', () => {});
app.on('second-instance', togglePanel);

app.whenReady().then(async () => {
  app.dock?.hide();
  // Without an Edit menu, Cmd+V and friends don't work in the windows'
  // text fields on macOS (pasting the token, for one).
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]));
  const icon = nativeImage.createFromPath(join(DIR, 'assets', 'trayTemplate.png'));
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.on('click', togglePanel);
  tray.on('right-click', () => tray.popUpContextMenu(contextMenu()));
  tray.setContextMenu(process.platform === 'darwin' ? null : contextMenu());
  host.onBadge(setBadge);
  setBadge('');
  globalThis.chrome = chrome;
  await import('./ext/background.js');
  host.startup();
  // Read by the end-to-end test; harmless otherwise.
  globalThis.prRadar = { togglePanel, openSettings, badge: () => badge, panel: () => panel, settings: () => settings };
});
