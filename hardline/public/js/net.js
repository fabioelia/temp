// WebSocket client. Reconnects automatically and resumes the same seat using the
// token the server issued, so a dropped connection never costs the team a room.

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

  url() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}/ws`;
  }

  open() {
    this.wantOpen = true;
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url());
      this.ws = ws;
      let settled = false;
      ws.onopen = () => {
        this.retryMs = 400;
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
        if (!settled) {
          settled = true;
          reject(new Error('Could not reach the server.'));
        }
        if (!this.wantOpen) return this.setStatus('idle');
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
      await this.open();
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
