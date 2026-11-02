// Small shared helpers.
'use strict';

const U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
  dist2: (ax, ay, bx, by) => (bx - ax) * (bx - ax) + (by - ay) * (by - ay),
  // Deterministic PRNG (mulberry32) so the world and saves are reproducible.
  rng(seed) {
    let a = seed >>> 0;
    const f = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (lo, hi) => lo + f() * (hi - lo);
    f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1));
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    f.state = () => a;
    return f;
  },
  hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  },
  fmt(n) {
    n = Math.floor(n);
    if (Math.abs(n) >= 100000) return (n / 1000).toFixed(0) + 'k';
    if (Math.abs(n) >= 10000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  },
  esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
};

// Binary min-heap keyed by a Float32Array of priorities (used by A*).
class MinHeap {
  constructor(cap) { this.a = new Int32Array(cap); this.n = 0; }
  clear() { this.n = 0; }
  push(v, pr) {
    if (this.n >= this.a.length) { const b = new Int32Array(this.a.length * 2); b.set(this.a); this.a = b; }
    const a = this.a; let i = this.n++;
    while (i > 0) { const p = (i - 1) >> 1; if (pr[a[p]] <= pr[v]) break; a[i] = a[p]; i = p; }
    a[i] = v;
  }
  pop(pr) {
    const a = this.a, top = a[0], last = a[--this.n];
    let i = 0;
    for (;;) {
      let c = 2 * i + 1;
      if (c >= this.n) break;
      if (c + 1 < this.n && pr[a[c + 1]] < pr[a[c]]) c++;
      if (pr[a[c]] >= pr[last]) break;
      a[i] = a[c]; i = c;
    }
    a[i] = last;
    return top;
  }
}

// Uniform-grid spatial hash for proximity queries on units.
class SpatialHash {
  constructor(cell) { this.cell = cell; this.map = new Map(); }
  clear() { this.map.clear(); }
  key(cx, cy) { return (cx + 1000) * 4096 + (cy + 1000); }
  insert(o) {
    const k = this.key(Math.floor(o.x / this.cell), Math.floor(o.y / this.cell));
    let b = this.map.get(k);
    if (!b) this.map.set(k, (b = []));
    b.push(o);
  }
  query(x, y, r, out) {
    out.length = 0;
    const c = this.cell, x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c), y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    const r2 = r * r;
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const b = this.map.get(this.key(cx, cy));
      if (!b) continue;
      for (const o of b) if (U.dist2(x, y, o.x, o.y) <= r2) out.push(o);
    }
    return out;
  }
}
