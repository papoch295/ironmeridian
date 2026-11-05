// Grid A* pathfinding. Ground units may cross water (auto-embark, high cost) but never neutral land.
'use strict';

const Path = {
  SEA_COST: 7,
  init() {
    const n = Geo.gw * Geo.gh;
    this.g = new Float32Array(n);
    this.f = new Float32Array(n);
    this.from = new Int32Array(n);
    this.stamp = new Uint32Array(n);
    this.closed = new Uint32Array(n);
    this.gen = 0;
    this.heap = new MinHeap(4096);
  },

  // Cost of entering cell i for a mover, or 0 if blocked. belligerent: Uint8Array per country (1 = at war).
  cost(i, mode, belligerent) {
    if (mode === 'sea') return Geo.gs[i] ? 1 : 0;
    const c = Geo.gc[i];
    if (c >= 0) return belligerent[c] ? 1 : (Geo.gs[i] ? this.SEA_COST : 0);
    return this.SEA_COST;
  },

  find(sx, sy, tx, ty, mode, belligerent, maxIter = 220000) {
    const gw = Geo.gw, gh = Geo.gh;
    let s = Geo.cellOf(sx, sy), t = Geo.cellOf(tx, ty);
    if (!this.cost(t, mode, belligerent)) t = this.nearestPassable(t, mode, belligerent);
    if (t < 0) return null;
    if (s === t) return [tx, ty];
    const gen = ++this.gen, G = this.g, F = this.f, from = this.from, st = this.stamp, cl = this.closed, heap = this.heap;
    heap.clear();
    const tx0 = t % gw, ty0 = (t / gw) | 0;
    const h = (i) => { const dx = Math.abs((i % gw) - tx0), dy = Math.abs(((i / gw) | 0) - ty0); return (dx + dy + (1.4142 - 2) * Math.min(dx, dy)); };
    G[s] = 0; F[s] = h(s); st[s] = gen; from[s] = -1;
    heap.push(s, F);
    let iter = 0, found = false;
    while (heap.n && iter++ < maxIter) {
      const c = heap.pop(F);
      if (c === t) { found = true; break; }
      if (cl[c] === gen) continue;
      cl[c] = gen;
      const cx = c % gw, cy = (c / gw) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = cy + dy;
        if (ny < 0 || ny >= gh) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cx + dx;
          if (nx < 0 || nx >= gw) continue;
          const ni = ny * gw + nx;
          if (cl[ni] === gen) continue;
          const k = this.cost(ni, mode, belligerent);
          if (!k) continue;
          if (dx && dy && (!this.cost(cy * gw + nx, mode, belligerent) || !this.cost(ny * gw + cx, mode, belligerent))) continue;
          const ng = G[c] + k * (dx && dy ? 1.4142 : 1);
          if (st[ni] !== gen || ng < G[ni]) {
            st[ni] = gen; G[ni] = ng; F[ni] = ng + h(ni); from[ni] = c;
            heap.push(ni, F);
          }
        }
      }
    }
    if (!found) return null;
    const cells = [];
    for (let c = t; c !== -1; c = from[c]) cells.push(c);
    cells.reverse();
    return this.smooth(sx, sy, cells, tx, ty, mode, belligerent, t === Geo.cellOf(tx, ty));
  },

  nearestPassable(t, mode, belligerent) {
    const gw = Geo.gw, cx = t % gw, cy = (t / gw) | 0;
    for (let r = 1; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= gw || y >= Geo.gh) continue;
      if (this.cost(y * gw + x, mode, belligerent)) return y * gw + x;
    }
    return -1;
  },

  // Walkable straight segment with the same terrain cost (keeps land/sea transitions as waypoints).
  lineOk(ax, ay, bx, by, mode, belligerent, k0) {
    const d = U.dist(ax, ay, bx, by), steps = Math.ceil(d * Geo.GRID_RES * 2);
    for (let i = 1; i <= steps; i++) {
      const k = this.cost(Geo.cellOf(ax + (bx - ax) * i / steps, ay + (by - ay) * i / steps), mode, belligerent);
      if (k !== k0) return false;
    }
    return true;
  },

  smooth(sx, sy, cells, tx, ty, mode, belligerent, exact) {
    const pts = cells.map((c) => Geo.cellCenter(c));
    pts[0] = [sx, sy];
    if (exact) pts[pts.length - 1] = [tx, ty];
    const out = [];
    let a = 0;
    while (a < pts.length - 1) {
      const k0 = this.cost(Geo.cellOf(pts[a][0], pts[a][1]), mode, belligerent) || 1;
      let b = a + 1;
      const lim = Math.min(pts.length - 1, a + 80);
      while (b < lim && this.lineOk(pts[a][0], pts[a][1], pts[b + 1][0], pts[b + 1][1], mode, belligerent, k0)) b++;
      out.push(pts[b][0], pts[b][1]);
      a = b;
    }
    return out;
  },
};
