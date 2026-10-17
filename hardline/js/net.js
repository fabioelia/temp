// Session client. Reconnects automatically and resumes the same seat using the token the host
// issued, so a dropped connection never costs the team a room. The socket underneath is a
// WebSocket to a Node server, or a WebRTC pipe to the host's browser tab (see transport.js).

import { transportMode, openSocket } from './transport.js';

const KEY = 'hardline.session.v1'; // sessionStorage: per-tab, so two tabs can be two players

export class Net {
  constructor() {
    this.ws = null;
    this.status = 'idle'; // idle | connecting | open | reconnecting
    this.onMessage = () => {};
    this.onStatus = () => {};
    this.wantOpen = false;
    this.retryMs = 400;
    this.queue = [];
    this.intent = null; // p2p: { host: true } to create a session here, { code } to join one
    this.everOpen = false;
    this.failures = 0;
  }

  get session() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || 'null');
    } catch {
      return null;
    }
  }

  saveSession(s) {
    try {
      if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
      else sessionStorage.removeItem(KEY);
    } catch {}
  }

  setStatus(s) {
    if (this.status === s) return;
    this.status = s;
    this.onStatus(s);
  }

  /** Open the line. `intent` (p2p only): { host: true } to create here, or { code } to join. */
  async open(intent = this.intent) {
    this.intent = intent;
    this.wantOpen = true;
    const mode = await transportMode();
    return new Promise((resolve, reject) => {
      if (mode === 'p2p' && !intent?.host && !intent?.code) {
        this.wantOpen = false;
        return reject(new Error('No session to join.'));
      }
      const ws = openSocket(mode, mode === 'p2p' ? intent : {});
      this.ws = ws;
      let settled = false;
      ws.onopen = () => {
        this.retryMs = 400;
        this.failures = 0;
        this.everOpen = true;
        this.setStatus('open');
        clearInterval(this.pinger);
        this.pinger = setInterval(() => this.send({ t: 'ping' }), 15000);
        if (!settled) {
          settled = true;
          resolve();
        }
        const q = this.queue;
        this.queue = [];
        q.forEach((m) => this.send(m));
      };
      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (msg.t === 'joined') this.saveSession({ code: msg.code, token: msg.token });
        this.onMessage(msg);
      };
      ws.onclose = () => {
        clearInterval(this.pinger);
        if (this.ws !== ws) return;
        const reason = ws.failReason || 'Could not reach the server.';
        if (!settled) {
          settled = true;
          reject(new Error(reason));
        }
        if (!this.wantOpen) return this.setStatus('idle');
        if (!this.everOpen) {
          // never got a line in the first place: report it, don't loop
          this.wantOpen = false;
          return this.setStatus('idle');
        }
        // we had a line and lost it: keep trying to slip back into the same seat
        this.failures += 1;
        if (mode === 'p2p' && this.failures >= 3) {
          this.wantOpen = false;
          this.setStatus('idle');
          return this.onMessage({ t: 'error', code: 'no_session', message: 'Lost contact with the host. The session has ended.' });
        }
        this.setStatus('reconnecting');
        setTimeout(() => this.reconnect(), this.retryMs);
        this.retryMs = Math.min(4000, this.retryMs * 1.6);
      };
      ws.onerror = () => {};
    });
  }

  async reconnect() {
    if (!this.wantOpen) return;
    try {
      await this.open({ ...(this.intent ?? (this.session ? { code: this.session.code } : {})), resume: true });
      const s = this.session;
      if (s) this.send({ t: 'resume', code: s.code, token: s.token });
    } catch {
      // onclose schedules the next attempt
    }
  }

  send(msg) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(msg));
    else if (msg.t !== 'ping') this.queue.push(msg);
  }

  close() {
    this.wantOpen = false;
    this.saveSession(null);
    try {
      this.ws?.close();
    } catch {}
    this.setStatus('idle');
  }
}
