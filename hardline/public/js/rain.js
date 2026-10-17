// Falling green code on a 2D canvas.

export const KANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:.=*+-<>¦';

export class Rain {
  constructor(canvas, { size = 16, speed = 1, color = '#2dff7a', head = '#d9ffe6', fade = 0.075, density = 1 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = size;
    this.speed = speed;
    this.color = color;
    this.head = head;
    this.fade = fade;
    this.density = density;
    this.running = false;
    this.last = 0;
    this.acc = 0;
    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.dpr = dpr;
    this.cols = Math.ceil(w / this.size);
    this.drops = Array.from({ length: this.cols }, () => (Math.random() < this.density ? -Math.random() * 60 : -9999));
    this.rows = Math.ceil(h / this.size);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      this.acc += (now - this.last) * this.speed;
      this.last = now;
      while (this.acc > 55) {
        this.acc -= 55;
        this.step();
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
  }

  step() {
    const { ctx, size, dpr } = this;
    ctx.fillStyle = `rgba(0,6,2,${this.fade})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = `${size * dpr}px ui-monospace, "Cascadia Mono", Menlo, "DejaVu Sans Mono", monospace`;
    ctx.textBaseline = 'top';
    for (let i = 0; i < this.cols; i++) {
      let y = this.drops[i];
      if (y < -5000) {
        if (Math.random() < 0.002 * this.density) this.drops[i] = 0;
        continue;
      }
      const ch = KANA[Math.floor(Math.random() * KANA.length)];
      const x = i * size * dpr;
      ctx.fillStyle = this.color;
      ctx.fillText(ch, x, Math.floor(y) * size * dpr);
      if (y >= 1) {
        ctx.fillStyle = this.head;
        ctx.globalAlpha = 0.9;
        ctx.fillText(KANA[Math.floor(Math.random() * KANA.length)], x, Math.floor(y) * size * dpr);
        ctx.globalAlpha = 1;
      }
      this.drops[i] = y + 1;
      if (y * size > this.canvas.height / dpr && Math.random() > 0.965) this.drops[i] = Math.random() < 0.3 ? -9999 : 0;
    }
  }
}
