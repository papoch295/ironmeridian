// Procedural sound effects with the Web Audio API (no audio files needed).
'use strict';

const Sfx = {
  ctx: null, master: null, enabled: true, volume: 0.6, last: {},

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
      const n = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, n, n);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },

  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; },

  // Simple throttle so big battles do not turn into white noise.
  allow(name, gap) {
    const now = performance.now();
    if (now - (this.last[name] || 0) < gap) return false;
    this.last[name] = now;
    return true;
  },

  noiseBurst(dur, freq, q, gain, type = 'bandpass', at = 0) {
    const c = this.ctx, t = c.currentTime + at;
    const src = c.createBufferSource(); src.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
    return f;
  },

  tone(freq, dur, gain, type = 'sine', slide = 0, at = 0) {
    const c = this.ctx, t = c.currentTime + at;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },

  play(name, k = 1) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    k = U.clamp(k, 0, 1);
    if (k < 0.05) return;
    switch (name) {
      case 'mg': if (this.allow(name, 90)) for (let i = 0; i < 3; i++) this.noiseBurst(0.05, 1800, 1.2, 0.18 * k, 'bandpass', i * 0.06); break;
      case 'shot': if (this.allow(name, 120)) this.noiseBurst(0.12, 2500, 0.8, 0.25 * k); break;
      case 'cannon': if (this.allow(name, 140)) { this.noiseBurst(0.35, 300, 0.7, 0.45 * k, 'lowpass'); this.tone(90, 0.25, 0.25 * k, 'sine', 0.5); } break;
      case 'rocket': if (this.allow(name, 160)) { const f = this.noiseBurst(0.6, 900, 0.6, 0.18 * k); f.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 0.6); } break;
      case 'missile': if (this.allow(name, 300)) { const f = this.noiseBurst(1.4, 600, 0.5, 0.25 * k); f.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 1.4); } break;
      case 'shell': if (this.allow(name, 200)) this.tone(1400, 0.5, 0.05 * k, 'sine', 0.45); break;
      case 'boom': if (this.allow(name, 120)) { this.noiseBurst(0.8, 220, 0.6, 0.55 * k, 'lowpass'); this.tone(60, 0.6, 0.35 * k, 'sine', 0.4); } break;
      case 'bigboom': if (this.allow(name, 300)) { this.noiseBurst(2.2, 160, 0.5, 0.8 * k, 'lowpass'); this.tone(40, 1.8, 0.5 * k, 'sine', 0.4); } break;
      case 'click': this.tone(880, 0.05, 0.08, 'triangle'); break;
      case 'select': this.tone(660, 0.06, 0.07, 'triangle'); this.tone(990, 0.06, 0.05, 'triangle', 0, 0.05); break;
      case 'order': this.tone(520, 0.07, 0.07, 'square', 1.3); break;
      case 'build': this.tone(520, 0.12, 0.09, 'triangle'); this.tone(780, 0.18, 0.08, 'triangle', 0, 0.1); break;
      case 'alert': if (this.allow(name, 1500)) { this.tone(740, 0.18, 0.12, 'square'); this.tone(554, 0.25, 0.12, 'square', 0, 0.2); } break;
      case 'capture': this.tone(392, 0.15, 0.1, 'triangle'); this.tone(523, 0.15, 0.1, 'triangle', 0, 0.13); this.tone(784, 0.35, 0.1, 'triangle', 0, 0.26); break;
      case 'lost': this.tone(330, 0.3, 0.1, 'sawtooth', 0.7); this.tone(247, 0.5, 0.1, 'sawtooth', 0.7, 0.25); break;
      case 'victory': [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.6, 0.11, 'triangle', 0, i * 0.18)); break;
      case 'defeat': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.7, 0.11, 'sawtooth', 0.98, i * 0.25)); break;
    }
  },

  // Positional helper: quieter the farther the event is from the screen center; silent when off-screen.
  at(name, x, y, big) {
    const [sx, sy] = Render.toScreen(x, y);
    const m = 80;
    if (sx < -m || sy < -m || sx > Render.w + m || sy > Render.h + m) return;
    const zoomK = U.clamp(Render.cam.z / 25, 0.25, 1);
    this.play(name, zoomK * (big ? 1 : 0.8));
  },
};
