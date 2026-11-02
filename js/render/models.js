// Unit models in a comic / cel-shaded look: side-view figures on a hexagonal faction base, facing their direction of
// travel. Sprites are drawn in unit space (ground at y = 0.3, front towards +x, y up is negative), shaded automatically
// (hard light band, hard shadow, ink lines, heavy outer outline) and cached per type/side/facing/size as bitmaps.
'use strict';

// ---------- Color helpers ----------
const Col = {
  memo: new Map(),
  hsl(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let s = 0, hu = 0;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      hu = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hu *= 60;
    }
    return [hu, s * 100, l * 100];
  },
  // Lightness shift in percent points; shadows drift towards blue and gain a little saturation.
  adj(hex, dl) {
    if (hex[0] !== '#') return hex;
    const k = hex + dl;
    let v = this.memo.get(k);
    if (v) return v;
    const [h, s, l] = this.hsl(hex);
    const hh = dl < 0 ? h + (h > 50 && h < 230 ? 1 : -1) * Math.min(10, -dl * 0.4) + (h < 50 || h > 230 ? 0 : 0) : h;
    v = `hsl(${(hh + 360) % 360},${Math.min(100, s + (dl < 0 ? 5 : 0)).toFixed(1)}%,${Math.max(0, Math.min(100, l + dl)).toFixed(1)}%)`;
    this.memo.set(k, v);
    return v;
  },
};

// Faction palettes: vehicles wear one factory colour each, bright accents (plinth, pennants) for readability.
// West (P): CARC desert tan. East (E): Russian protective green. camo: uniform / helmet patterns (see
// Models.camoPaint, used for figures only); jet/ship/sub are the air and naval greys.
const MODEL_COL = {
  P: { body: '#b39b74', light: '#cdb892', dark: '#5f5240', cloth: '#7a7556', gear: '#4f5038', flag: '#3d8bff', accent: '#3d8bff', accentD: '#1d4fa8',
       camo: ['#3c4630', '#5e4c34', '#1f211b'], skin2: '#b5a57c',
       baseA: '#3a7ce6', baseB: '#173a80', rim: '#9fcaff', outline: '#0a121c', plate: '#0d1b2b', ship: '#8a959c', sub: '#2f3438', jet: '#7f878d' },
  E: { body: '#55633b', light: '#7a8656', dark: '#2a301c', cloth: '#5f6646', gear: '#3e4330', flag: '#e8423a', accent: '#e8423a', accentD: '#9a1f1a',
       camo: ['#9a8b5c', '#2a2c20', '#3f4a2a'], skin2: '#8d8f68',
       baseA: '#d8473e', baseB: '#7a1914', rim: '#ffab9c', outline: '#1c0b08', plate: '#2a0f0b', ship: '#7f8c92', sub: '#2a2e31', jet: '#8fa3b2' },
};
const TRACK = '#2a2d29', WHEEL = '#4a4f48', METAL = '#c9d0d4', GUN = '#2c302c', GLASS = '#13232f', SKIN = '#d9b08a', HULL_GREY = '#7d8a93', DECK = '#59636b';

const Models = {
  lw: 0.04,        // inner line width in unit space (set per draw)
  out: 0.06,       // outline width in unit space
  pass: 'fill',    // 'out' draws the silhouette outline, 'fill' the shaded model
  cache: new Map(),

  // Public entry point (same signature as before): draw unit type t of side at (x, y), size s px, heading hd.
  draw(ctx, t, side, x, y, s, hd, alpha = 1) {
    const T = UNIT_TYPES[t], face = Math.cos(hd || 0) < -0.15 ? -1 : 1;
    const dpr = (Render && Render.dpr) || 1;
    const air = T.dom === 'air', sea = T.dom === 'sea';
    // Gentle idle motion: helicopters/planes bob, ships rock slightly. Phase depends on position so units desync.
    const now = performance.now() / 1000, ph = (x * 0.37 + y * 0.21) % 6.28;
    const bob = air ? Math.sin(now * 2.2 + ph) * s * 0.05 : sea ? Math.sin(now * 1.1 + ph) * s * 0.02 : 0;
    if (air) this.airShadow(ctx, x, y, s, MODEL_COL[side]);
    const spr = this.sprite(t, side, face, s * dpr);
    const k = s / spr.px;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(spr.cv, x - spr.ox * k, y + bob - spr.oy * k, spr.cv.width * k, spr.cv.height * k);
    // Animated parts (rotors, radar) are drawn live on top of the cached body. Eastern models bring their own.
    const fn = side === 'E' && this.mE[t] ? this.animE[t] : this.anim[t];
    if (fn) {
      ctx.translate(x, y + bob); ctx.scale(s * face, s);
      if (air) ctx.translate(0, -0.25);
      this.pass = 'fill'; this.lw = 0.8 / s;
      fn.call(this, ctx, MODEL_COL[side], now);
    }
    ctx.restore();
  },

  // Hard hexagonal ground shadow beneath flying units, edged in the faction colour (aircraft wear neutral greys).
  airShadow(ctx, x, y, s, C) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const a = x + Math.cos(k * Math.PI / 3) * s * 0.5, b = y + s * 0.75 + Math.sin(k * Math.PI / 3) * s * 0.13; k ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    ctx.strokeStyle = C.accent; ctx.globalAlpha *= 0.85; ctx.lineWidth = Math.max(1.4, s * 0.045); ctx.lineJoin = 'round'; ctx.stroke(); ctx.globalAlpha /= 0.85;
  },

  // Cached sprite for (type, side, facing, size bucket). Sizes snap to 6-px steps so zooming reuses bitmaps.
  sprite(t, side, face, px) {
    const b = Math.max(12, Math.round(px / 6) * 6);
    const key = t + side + face + b;
    let spr = this.cache.get(key);
    if (spr) { this.cache.delete(key); this.cache.set(key, spr); return spr; }
    const W = Math.ceil(b * 3.0), H = Math.ceil(b * 2.15), ox = W / 2, oy = Math.round(b * 1.4);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.translate(ox, oy);
    this.render(ctx, t, side, face, b);
    spr = { cv, ox, oy, px: b };
    this.cache.set(key, spr);
    if (this.cache.size > 260) this.cache.delete(this.cache.keys().next().value);
    return spr;
  },

  render(ctx, t, side, face, s) {
    const T = UNIT_TYPES[t], C = MODEL_COL[side], fn = (side === 'E' && this.mE[t]) || this.m[t];
    const air = T.dom === 'air', sea = T.dom === 'sea';
    if (!sea && !air) this.base(ctx, C, s);
    if (sea) this.water(ctx, s, t);
    ctx.save();
    ctx.scale(s * face, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (air) ctx.translate(0, -0.25);
    // Figures are scaled up so they fill the base; ground vehicles get a slight vertical exaggeration for readability.
    if (!air && !sea) {
      const k = T.cls === 'soft' && t !== 'recon' ? [1.3, 1.3] : [1, 1.12];
      ctx.translate(0, 0.3); ctx.scale(k[0], k[1]); ctx.translate(0, -0.3);
    }
    this.face = face;
    // Comic look: heavy ink outline around the whole silhouette.
    const o = s < 30 ? 1.4 : s < 60 ? 1.6 : 1.8;
    this.out = o / s; this.lw = (s < 30 ? 0.6 : 0.8) / s; this.small = s < 26;
    this.outCol = C.outline;
    this.camoBase = C.body; this.camoCols = C.camo; this.camoSide = side;
    this.pass = 'out'; fn.call(this, ctx, C);
    this.pass = 'fill'; fn.call(this, ctx, C);
    if (sea) {
      // Everything below the waterline sinks into the water.
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = t === 'sub' || t === 'ssbn' ? 'rgba(12,34,50,0.62)' : 'rgba(12,34,50,0.5)';
      ctx.fillRect(-2, 0.065, 4, 1);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(230,245,255,0.6)'; ctx.lineWidth = 1.2 / s;
      ctx.beginPath(); ctx.moveTo(-1.02, 0.065); ctx.lineTo(1.02, 0.065); ctx.stroke();
    }
    ctx.restore();
    if (sea) {
      // Faction ring behind the hull, after the waterline pass so the submerged tint doesn't swallow it.
      const L = s * (t === 'cv' ? 1.12 : 1.06);
      ctx.globalCompositeOperation = 'destination-over';
      ctx.beginPath(); ctx.ellipse(0, s * 0.1, L * 0.92, s * 0.15, 0, 0, Math.PI * 2);
      ctx.strokeStyle = C.accent; ctx.globalAlpha = 0.85; ctx.lineWidth = Math.max(1.2, s * 0.035); ctx.stroke();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  },

  // Hexagonal comic plinth: hard drop shadow, faceted side wall, faction-coloured top with a dark inner field.
  base(ctx, C, s) {
    const gy = s * 0.3, rx = s * 0.86, ry = s * 0.22, wall = s * 0.08, lw = Math.max(1.2, s * 0.045);
    const pt = (k, kx, ky, dy) => [Math.cos(k * Math.PI / 3) * rx * kx, gy + dy + Math.sin(k * Math.PI / 3) * ry * ky];
    const hex = (kx, ky, dy) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const [a, b] = pt(k, kx, ky, dy); k ? ctx.lineTo(a, b) : ctx.moveTo(a, b); } ctx.closePath(); };
    const quad = (ps) => { ctx.beginPath(); ps.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); };
    hex(1.04, 1.1, wall + s * 0.05); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill();
    // Side wall: three visible facets (right, front, left), the front one lit.
    const wallCol = [Col.adj(C.baseB, -8), C.baseB, Col.adj(C.baseB, -14)];
    for (let k = 0; k < 3; k++) {
      const a = pt(k, 1, 1, 0), b = pt(k + 1, 1, 1, 0);
      quad([a, b, [b[0], b[1] + wall], [a[0], a[1] + wall]]);
      ctx.fillStyle = wallCol[k]; ctx.fill();
    }
    ctx.beginPath(); for (let k = 0; k <= 3; k++) { const [a, b] = pt(k, 1, 1, wall); k ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }
    for (let k = 3; k >= 0; k--) { const [a, b] = pt(k, 1, 1, 0); ctx.lineTo(a, b); }
    ctx.closePath(); ctx.strokeStyle = C.outline; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
    // Top face: faction colour rim, dark inner field, hard light edge along the far side.
    hex(1, 1, 0); ctx.fillStyle = C.baseA; ctx.fill(); ctx.stroke();
    hex(0.86, 0.8, 0); ctx.fillStyle = C.plate; ctx.fill();
    ctx.beginPath(); ctx.moveTo(...pt(3, 0.97, 0.9, 0)); ctx.lineTo(...pt(4, 0.97, 0.9, 0)); ctx.lineTo(...pt(5, 0.97, 0.9, 0));
    ctx.strokeStyle = C.rim; ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
  },

  // Water patch and foam line for ships (the faction ring is added at the end of render).
  water(ctx, s, t) {
    const sub = t === 'sub' || t === 'ssbn', L = s * (t === 'cv' ? 1.12 : 1.06);
    const g = ctx.createRadialGradient(0, s * 0.08, 0, 0, s * 0.08, L);
    g.addColorStop(0, 'rgba(10,30,45,0.55)'); g.addColorStop(1, 'rgba(10,30,45,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, s * 0.1, L, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = sub ? 'rgba(200,235,255,0.35)' : 'rgba(225,242,255,0.55)'; ctx.lineWidth = Math.max(1, s * 0.03);
    ctx.beginPath(); ctx.ellipse(0, s * 0.07, L * 0.98, s * 0.06, 0, 0, Math.PI); ctx.stroke();
  },

  // ---------- Shaded drawing helpers (unit space) ----------
  // Fill a path with the miniature recipe. col is the base color; glass/gun/track get special treatment.
  paint(ctx, path, col, bb, opt = {}) {
    if (this.pass === 'out') {
      if (opt.noOut) return;
      ctx.fillStyle = this.outCol; ctx.fill(path);
      ctx.strokeStyle = this.outCol; ctx.lineWidth = this.out * 2; ctx.stroke(path);
      return;
    }
    if (!col) return;
    const [x0, y0, x1, y1] = bb, h = Math.max(0.02, y1 - y0);
    if (col === GLASS) {
      // Dark pane with a hard diagonal reflection.
      ctx.fillStyle = GLASS; ctx.fill(path);
      ctx.save(); ctx.clip(path);
      ctx.fillStyle = 'rgba(160,215,245,0.5)';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * 0.7, y0); ctx.lineTo(x0 + (x1 - x0) * 0.35, y1); ctx.lineTo(x0, y1); ctx.fill();
      ctx.restore();
      return;
    }
    if (col[0] !== '#' || opt.flat) { ctx.fillStyle = col; ctx.fill(path); return; }
    // Painted-miniature gradient carries the volume; faint cel bands on top keep the stylised edge.
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, Col.adj(col, 14)); g.addColorStop(0.45, col); g.addColorStop(1, Col.adj(col, -17));
    ctx.fillStyle = g; ctx.fill(path);
    // Vehicles wear a single factory colour (grime only); camouflage patterns are reserved for uniforms and gear.
    if (!this.small) {
      if (opt.camo) this.camoPaint(ctx, path, y0, y1);
      if (opt.camo || (col === this.camoBase && opt.camo !== false)) this.dirt(ctx, path, y0, h);
    }
    this.cel(ctx, path, y0, h);
    // Inner line: crisp dark ink line in the local colour (technical-illustration look).
    if (!opt.noLine) { ctx.strokeStyle = Col.adj(col, -38); ctx.globalAlpha *= 0.9; ctx.lineWidth = this.lw; ctx.stroke(path); ctx.globalAlpha /= 0.9; }
  },
  // Soft light band along the top edge of a fill (the gradient in paint() does the rest of the volume).
  cel(ctx, path, y0, h) {
    ctx.save(); ctx.clip(path);
    if (!this.small || h > 0.08) {
      const t = Math.max(this.lw * 1.5, h * 0.22);
      const e = ctx.createLinearGradient(0, y0, 0, y0 + t);
      e.addColorStop(0, 'rgba(255,252,232,0.22)'); e.addColorStop(1, 'rgba(255,252,232,0)');
      ctx.fillStyle = e; ctx.fillRect(-3, y0 - 0.01, 6, t + 0.01);
    }
    ctx.restore();
  },
  // Weathering on camouflaged parts: soft grime smudges, dust rising from the lower edge, chipped-paint specks.
  dirt(ctx, path, y0, h) {
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < 14; i++) {
      const x = -1.25 + ((i * 0.613) % 2.5), y = y0 + h * ((i * 0.37) % 1), r = 0.05 + ((i * 0.29) % 1) * 0.09;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(40,32,20,0.16)'); g.addColorStop(1, 'rgba(40,32,20,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const d = ctx.createLinearGradient(0, y0 + h * 0.55, 0, y0 + h);
    d.addColorStop(0, 'rgba(120,100,70,0)'); d.addColorStop(1, 'rgba(120,100,70,0.38)');
    ctx.fillStyle = d; ctx.fillRect(-3, y0 + h * 0.55, 6, h * 0.46);
    ctx.fillStyle = 'rgba(30,28,22,0.35)';
    for (let i = 0; i < 18; i++) { const x = -1.2 + ((i * 0.377) % 2.4), y = y0 + h * (((i * 0.61) % 1) * 0.9 + 0.05); ctx.fillRect(x, y, this.lw * 1.6, this.lw * 1.2); }
    ctx.restore();
  },
  // Camouflage patches clipped to a path. The pattern lives in unit space, so all parts of a model share one
  // continuous scheme: West = large soft-edged NATO blotches, East = smaller angular Russian blotches.
  camoPat: {},
  camoPaint(ctx, path, y0, y1) {
    const side = this.camoSide;
    let pat = this.camoPat[side];
    if (!pat) {
      let seed = side === 'E' ? 7 : 3;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      pat = this.camoPat[side] = [];
      for (let i = 0; i < 46; i++) {
        const cx = -1.4 + rnd() * 2.8, cy = -0.75 + rnd() * 1.1, r = (side === 'E' ? 0.07 : 0.1) + rnd() * 0.09, n = side === 'E' ? 5 : 7, pts = [];
        for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + rnd() * 0.5, rr = r * (0.55 + rnd() * 0.6); pts.push([cx + Math.cos(a) * rr * 1.5, cy + Math.sin(a) * rr]); }
        pat.push({ c: i % 3, pts });
      }
    }
    ctx.save(); ctx.clip(path);
    ctx.globalAlpha *= 0.9;
    for (const b of pat) {
      ctx.fillStyle = this.camoCols[b.c];
      ctx.beginPath();
      if (side === 'E') b.pts.forEach(([a, c], i) => (i ? ctx.lineTo(a, c) : ctx.moveTo(a, c)));
      else {
        const p = b.pts, n = p.length, m = (i) => [(p[i % n][0] + p[(i + 1) % n][0]) / 2, (p[i % n][1] + p[(i + 1) % n][1]) / 2];
        const m0 = m(n - 1); ctx.moveTo(m0[0], m0[1]);
        for (let i = 0; i < n; i++) { const q = m(i); ctx.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },
  bbox(pts) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [a, b] of pts) { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, a); y1 = Math.max(y1, b); }
    return [x0, y0, x1, y1];
  },
  // Polygon. stroke argument kept for compatibility (ignored: inner lines are derived from the fill).
  P(ctx, pts, fill, stroke, opt) {
    const p = new Path2D();
    pts.forEach(([a, b], i) => (i ? p.lineTo(a, b) : p.moveTo(a, b)));
    p.closePath();
    this.paint(ctx, p, fill, this.bbox(pts), opt);
  },
  // Smooth closed shape through points (quadratic midpoints) – for hulls, fuselages and bodies.
  S(ctx, pts, fill, opt) {
    const p = new Path2D(), n = pts.length;
    const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
    const m0 = mid(n - 1);
    p.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const m = mid(i); p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
    p.closePath();
    this.paint(ctx, p, fill, this.bbox(pts), opt);
  },
  R(ctx, x, y, w, h, fill, stroke, r = 0.03, opt) {
    const p = new Path2D();
    if (p.roundRect) p.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else p.rect(x, y, w, h);
    this.paint(ctx, p, fill, [x, y, x + w, y + h], opt);
  },
  O(ctx, x, y, r, fill, stroke, opt) {
    const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2);
    this.paint(ctx, p, fill, [x - r, y - r, x + r, y + r], opt);
  },
  E(ctx, x, y, rx, ry, fill, opt) {
    const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    this.paint(ctx, p, fill, [x - rx, y - ry, x + rx, y + ry], opt);
  },
  // Line (barrels, masts, rifles). Gets an outline in the outline pass and a light top line on thick strokes.
  L(ctx, x0, y0, x1, y1, col, w, opt = {}) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    if (this.pass === 'out') { if (opt.noOut) return; ctx.strokeStyle = this.outCol; ctx.lineWidth = w + this.out * 2; ctx.stroke(); return; }
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    if (w > 0.035 && col[0] === '#' && !this.small) {
      const nx = (y1 - y0), ny = -(x1 - x0), l = Math.hypot(nx, ny) || 1, o = w * 0.22 * (ny < 0 ? 1 : -1);
      ctx.beginPath(); ctx.moveTo(x0 + nx / l * o, y0 + ny / l * o); ctx.lineTo(x1 + nx / l * o, y1 + ny / l * o);
      ctx.strokeStyle = Col.adj(col, 16); ctx.lineWidth = w * 0.28; ctx.stroke();
    }
  },
  // Gun barrel with optional muzzle brake / bore evacuator.
  barrel(ctx, x0, y0, x1, y1, w, opt = {}) {
    this.L(ctx, x0, y0, x1, y1, GUN, w);
    const dx = x1 - x0, dy = y1 - y0;
    if (opt.evac) { const k = opt.evac; this.L(ctx, x0 + dx * k - dx * 0.06, y0 + dy * k - dy * 0.06, x0 + dx * k + dx * 0.06, y0 + dy * k + dy * 0.06, GUN, w * 1.45); }
    if (opt.brake) this.L(ctx, x1 - dx * 0.07, y1 - dy * 0.07, x1, y1, GUN, w * 1.6);
  },
  // Small specular glint dots on optics / glass.
  glint(ctx, x, y, r = 0.02) {
    if (this.pass === 'out' || this.small) return;
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x + r * 2.2, y + r * 1.2, r * 0.7, 0, Math.PI * 2); ctx.fill();
  },
  // Ambient occlusion band under a joint (e.g. turret ring on hull).
  ao(ctx, x0, x1, y, h = 0.05) {
    if (this.pass === 'out') return;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x0, y, x1 - x0, h * 0.5);
  },

  // Tracked running gear: rubber track outline, road wheels, drive sprocket (front) and idler (rear).
  track(ctx, x0, x1, n, opt = {}) {
    const top = opt.top ?? 0.07, bot = 0.3, r = (bot - top) / 2;
    this.R(ctx, x0, top, x1 - x0, bot - top, TRACK, null, r, { noLine: true });
    if (this.pass === 'out') return;
    // Track pad texture.
    if (!this.small) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = this.lw;
      ctx.beginPath();
      for (let x = x0 + r; x < x1 - r; x += 0.07) { ctx.moveTo(x, bot - 0.012); ctx.lineTo(x, bot - 0.035); ctx.moveTo(x, top + 0.012); ctx.lineTo(x, top + 0.03); }
      ctx.stroke();
    }
    const wr = opt.wr || r * 0.68, wy = bot - wr - 0.02;
    for (let i = 0; i < n; i++) {
      const x = x0 + r + 0.02 + i * (x1 - x0 - 2 * r - 0.04) / (n - 1);
      this.wheel(ctx, x, wy, wr);
    }
    this.O(ctx, x1 - r * 0.85, top + r * 0.9, r * 0.6, WHEEL, null, { noLine: true });
    this.O(ctx, x0 + r * 0.85, top + r * 0.9, r * 0.55, WHEEL, null, { noLine: true });
    if (opt.rollers) for (const k of [0.3, 0.55, 0.8]) this.O(ctx, x0 + (x1 - x0) * k, top + 0.025, 0.022, WHEEL, null, { noLine: true });
  },
  // Road wheel: rubber tyre, dished steel disc painted in the vehicle colour, lightening ring, hub cap and bolt circle.
  wheel(ctx, x, y, r) {
    this.O(ctx, x, y, r, '#2e312c', null, { noLine: true });
    if (this.pass === 'out') return;
    const disc = this.camoBase || '#5d6359';
    this.O(ctx, x, y, r * 0.8, disc, null, { noLine: true, camo: false });
    if (this.small) { ctx.fillStyle = '#23261f'; ctx.beginPath(); ctx.arc(x, y, r * 0.22, 0, Math.PI * 2); ctx.fill(); return; }
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = this.lw;
    ctx.beginPath(); ctx.arc(x, y, r * 0.58, 0, Math.PI * 2); ctx.stroke();
    this.O(ctx, x, y, r * 0.34, Col.adj(disc, 6), null, { noLine: true });
    ctx.fillStyle = '#23261f';
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.22, y + Math.sin(a) * r * 0.22, Math.max(this.lw * 0.6, r * 0.05), 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.arc(x, y, r * 0.1, 0, Math.PI * 2); ctx.fill();
  },
  // Rubber tyres for wheeled vehicles: tread blocks round the rim, steel rim with bolt circle, central tyre-pressure hub.
  wheels(ctx, xs, r = 0.12) {
    for (const x of xs) {
      const y = 0.3 - r;
      this.O(ctx, x, y, r, '#262925', null, { noLine: true });
      if (this.pass === 'out') continue;
      if (!this.small) {
        ctx.strokeStyle = '#3b3f39'; ctx.lineWidth = this.lw * 1.4; ctx.beginPath();
        for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; ctx.moveTo(x + Math.cos(a) * r * 0.97, y + Math.sin(a) * r * 0.97); ctx.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8); }
        ctx.stroke();
      }
      this.O(ctx, x, y, r * 0.56, '#5e645b', null, { noLine: true });
      ctx.fillStyle = '#1d201b';
      if (!this.small) {
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = this.lw; ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.32, y + Math.sin(a) * r * 0.32, Math.max(this.lw * 0.6, r * 0.04), 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.beginPath(); ctx.arc(x, y, r * 0.16, 0, Math.PI * 2); ctx.fill();
    }
  },

  // ---------- Vehicle detail kit (fill-only fine detail is skipped on small sprites) ----------
  // Row of bolt heads / rivets between x0 and x1.
  bolts(ctx, x0, x1, y, n, r = 0.008) {
    if (this.pass === 'out' || this.small) return;
    for (let i = 0; i < n; i++) {
      const x = x0 + (n > 1 ? (x1 - x0) * i / (n - 1) : 0);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(x + r * 0.3, y + r * 0.3, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,230,0.35)'; ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.6, 0, Math.PI * 2); ctx.fill();
    }
  },
  // Bank of n smoke-grenade dischargers at (x, y), tubes angled forward-up by ang.
  smoke(ctx, C, x, y, n = 4, ang = -0.6, gap = 0.032) {
    for (let i = 0; i < n; i++) {
      const bx = x + i * gap, dx = Math.cos(ang) * 0.05, dy = Math.sin(ang) * 0.05;
      this.L(ctx, bx, y, bx + dx, y + dy, Col.adj(C.dark, 4), 0.022);
      if (this.pass === 'fill' && !this.small) { ctx.fillStyle = '#121411'; ctx.beginPath(); ctx.arc(bx + dx, y + dy, 0.007, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  // Headlight cluster with a wire guard (front of hull).
  light(ctx, x, y) {
    this.R(ctx, x - 0.025, y - 0.018, 0.05, 0.036, '#2a2d27', null, 0.008);
    if (this.pass === 'out' || this.small) return;
    ctx.fillStyle = '#e8e2b8'; ctx.beginPath(); ctx.arc(x + 0.008, y, 0.012, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = this.lw; ctx.beginPath(); ctx.arc(x, y, 0.03, -1.3, 1.3); ctx.stroke();
  },
  // Tow cable run along the hull side with shackle eyes at both ends.
  tow(ctx, x0, y0, x1, y1) {
    if (this.small) return;
    const mx = (x0 + x1) / 2, my = Math.max(y0, y1) + 0.02;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1);
    if (this.pass === 'out') return;
    ctx.strokeStyle = '#2b2a24'; ctx.lineWidth = 0.016; ctx.stroke();
    ctx.strokeStyle = 'rgba(200,190,150,0.35)'; ctx.lineWidth = 0.006; ctx.setLineDash([0.012, 0.01]); ctx.stroke(); ctx.setLineDash([]);
    for (const [a, b] of [[x0, y0], [x1, y1]]) { ctx.strokeStyle = '#1d1e1a'; ctx.lineWidth = this.lw * 1.4; ctx.beginPath(); ctx.arc(a, b, 0.014, 0, Math.PI * 2); ctx.stroke(); }
  },
  // Stowage: rolled tarp / kit bag strapped to a rack, plus optional jerrycans.
  stow(ctx, x, y, w, h, cans = 0) {
    this.R(ctx, x, y, w, h, '#6b6448', null, h * 0.45, { camo: false });
    if (this.pass === 'fill' && !this.small) for (const k of [0.25, 0.7]) this.ln(ctx, x + w * k, y, x + w * k, y + h, 'rgba(30,25,15,0.7)', 1.6);
    for (let i = 0; i < cans; i++) {
      const cx = x + w + 0.008 + i * 0.05;
      this.R(ctx, cx, y - 0.01, 0.045, h + 0.01, '#4e5a36', null, 0.006, { camo: false });
      if (this.pass === 'fill' && !this.small) { this.ln(ctx, cx + 0.008, y + 0.004, cx + 0.037, y + h - 0.004, 'rgba(0,0,0,0.45)'); this.ln(ctx, cx + 0.037, y + 0.004, cx + 0.008, y + h - 0.004, 'rgba(0,0,0,0.45)'); }
    }
  },
  // Hinged hatch seen edge-on: lid with a hinge knuckle and periscope / vision block.
  hatch(ctx, C, x, y, w = 0.1, open = false) {
    if (open) this.P(ctx, [[x, y], [x - 0.02, y - w * 0.9], [x + 0.012, y - w * 0.92], [x + 0.02, y]], Col.adj(C.body, -4), null, { camo: false });
    else this.R(ctx, x, y - 0.022, w, 0.024, Col.adj(C.dark, 8), null, 0.008);
    if (this.pass === 'fill' && !this.small && !open) { ctx.fillStyle = '#16231d'; ctx.fillRect(x + w * 0.65, y - 0.018, w * 0.22, 0.012); }
  },
  // Whip antenna with a base mount.
  antenna(ctx, x, y, h = 0.5, lean = -0.06) {
    this.R(ctx, x - 0.015, y - 0.02, 0.03, 0.025, '#2a2d27', null, 0.006);
    this.L(ctx, x, y - 0.02, x + lean, y - h, '#1b1d1a', 0.008, { noOut: true });
  },
  // Upper surface seen slightly from above: lighter strip along a roof / deck edge from x0 to x1 at height y.
  topFace(ctx, C, x0, x1, y, d = 0.026, col) { this.P(ctx, [[x0, y], [x0 + d, y - d], [x1 - d, y - d], [x1, y]], col || Col.adj(C.body, 9)); },
  // Crew member standing in an open hatch at (x, y = hatch rim): shoulders, head with helmet / headset, hatch ring.
  crew(ctx, C, x, y, k = 1) {
    const east = C === MODEL_COL.E, helm = east ? '#3b3e30' : C.skin2;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    this.R(ctx, -0.05, -0.07, 0.1, 0.08, C.cloth, null, 0.025, { camo: false });
    this.O(ctx, 0.005, -0.1, 0.034, SKIN, null, { noLine: true });
    if (east) this.S(ctx, [[-0.045, -0.095], [-0.04, -0.14], [0.02, -0.15], [0.05, -0.12], [0.045, -0.1]], helm);
    else this.S(ctx, [[-0.04, -0.1], [-0.04, -0.14], [0.015, -0.15], [0.048, -0.125], [0.05, -0.105]], helm);
    if (this.pass === 'fill' && !this.small) { ctx.fillStyle = '#1b1d1a'; ctx.fillRect(-0.045, -0.115, 0.016, 0.02); }
    this.R(ctx, -0.07, -0.012, 0.14, 0.022, Col.adj(C.dark, 6), null, 0.008);
    ctx.restore();
  },
  // Stencilled tactical number (fill pass only): dark stencil on Western vehicles, white numbers on Eastern ones.
  mark(ctx, x, y, txt, h = 0.05, col) {
    if (this.pass === 'out' || this.small) return;
    col = col || (this.camoSide === 'E' ? 'rgba(235,235,225,0.75)' : 'rgba(30,30,25,0.55)');
    // Mirrored sprites (facing left) flip the text back so it stays readable and covers the same hull area.
    const f = this.face < 0 ? -1 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(f * h / 10, h / 10);
    ctx.font = 'bold 12px sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = f < 0 ? 'right' : 'left'; ctx.fillStyle = col; ctx.fillText(txt, 0, 0);
    ctx.restore();
  },
  // Side mirror on a bracket (trucks, wheeled vehicles).
  mirror(ctx, x, y) {
    this.L(ctx, x, y, x + 0.04, y - 0.04, '#23261f', 0.01);
    this.R(ctx, x + 0.03, y - 0.09, 0.025, 0.06, '#2a2d27', null, 0.006);
  },
  // Rolled camouflage net strapped across a deck.
  net(ctx, x, y, w, h = 0.045) {
    this.R(ctx, x, y, w, h, '#4d5636', null, h * 0.5, { camo: false });
    if (this.pass === 'out' || this.small) return;
    ctx.strokeStyle = 'rgba(20,24,12,0.55)'; ctx.lineWidth = this.lw;
    ctx.beginPath(); for (let px = x + 0.01; px < x + w; px += 0.018) { ctx.moveTo(px, y + 0.004); ctx.lineTo(px + 0.01, y + h - 0.004); } ctx.stroke();
    for (const k of [0.2, 0.55, 0.85]) this.ln(ctx, x + w * k, y, x + w * k, y + h, 'rgba(20,18,10,0.85)', 1.8);
  },
  // Engine exhaust: dark grille and soot stain fading upwards/backwards.
  exhaust(ctx, x, y, w = 0.08, h = 0.05) {
    if (this.pass === 'out' || this.small) return;
    ctx.fillStyle = 'rgba(15,15,12,0.55)'; ctx.fillRect(x, y, w, h);
    for (let px = x + 0.012; px < x + w; px += 0.016) this.ln(ctx, px, y, px, y + h, 'rgba(120,120,110,0.45)');
    const g = ctx.createLinearGradient(x, y, x, y - h * 1.8);
    g.addColorStop(0, 'rgba(20,18,15,0.35)'); g.addColorStop(1, 'rgba(20,18,15,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 0.01, y - h * 1.8, w + 0.02, h * 1.8);
  },
  // Wire-mesh / slat panel (bar armour) between x0 and x1, y0..y1.
  slats(ctx, C, x0, x1, y0, y1, n = 6) {
    this.L(ctx, x0, y0, x1, y0, C.dark, 0.012); this.L(ctx, x0, y1, x1, y1, C.dark, 0.012);
    for (let i = 0; i <= n; i++) this.L(ctx, x0 + (x1 - x0) * i / n, y0, x0 + (x1 - x0) * i / n, y1, C.dark, 0.008);
  },
  // Faction pennant on a whip antenna.
  pennant(ctx, C, x, y, h = 0.42) {
    this.L(ctx, x, y, x, y - h, '#1b1d1a', 0.02);
    this.P(ctx, [[x, y - h], [x + 0.24, y - h + 0.06], [x, y - h + 0.13]], C.accent, null, { hi: true });
  },
  // Thin panel line / seam (fill pass only).
  ln(ctx, x0, y0, x1, y1, col = 'rgba(0,0,0,0.38)', w = 1) {
    if (this.pass === 'out' || this.small) return;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = col; ctx.lineWidth = this.lw * w; ctx.stroke();
  },
  // Running gear from a track outline polygon plus road wheel positions.
  tracks(ctx, pts, xs, wy, wr, spr, idl, rollers) {
    this.P(ctx, pts, TRACK, null, { noLine: true });
    if (this.pass === 'fill' && !this.small) {
      // Individual track shoes along the outer run (dashed pads), guide horns along the inner run, mud on the lower half.
      const p = new Path2D(); pts.forEach(([a, b], i) => (i ? p.lineTo(a, b) : p.moveTo(a, b))); p.closePath();
      ctx.save(); ctx.clip(p);
      ctx.lineJoin = 'miter';
      ctx.strokeStyle = '#43473f'; ctx.lineWidth = 0.05; ctx.setLineDash([0.026, 0.012]); ctx.stroke(p);
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 0.012; ctx.setLineDash([0.006, 0.032]); ctx.stroke(p);
      ctx.setLineDash([]);
      const [, by0, , by1] = this.bbox(pts), mud = ctx.createLinearGradient(0, by0 + (by1 - by0) * 0.5, 0, by1);
      mud.addColorStop(0, 'rgba(110,92,62,0)'); mud.addColorStop(1, 'rgba(110,92,62,0.45)');
      ctx.fillStyle = mud; ctx.fillRect(-2, by0, 4, by1 - by0);
      ctx.restore();
      ctx.lineJoin = 'round';
    }
    if (rollers) for (const x of rollers) { this.O(ctx, x, 0.085, 0.026, WHEEL, null, { noLine: true }); if (this.pass === 'fill' && !this.small) { ctx.fillStyle = '#23261f'; ctx.beginPath(); ctx.arc(x, 0.085, 0.008, 0, Math.PI * 2); ctx.fill(); } }
    for (const x of xs) this.wheel(ctx, x, wy, wr);
    if (spr) {
      this.O(ctx, spr[0], spr[1], spr[2], '#3a3e39', null, { noLine: true });
      if (this.pass === 'fill') {
        // Drive sprocket: teeth ring, hub with bolts.
        if (!this.small) { ctx.strokeStyle = '#555a52'; ctx.lineWidth = spr[2] * 0.3; ctx.setLineDash([spr[2] * 0.28, spr[2] * 0.22]); ctx.beginPath(); ctx.arc(spr[0], spr[1], spr[2] * 0.82, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
        this.O(ctx, spr[0], spr[1], spr[2] * 0.5, WHEEL, null, { noLine: true });
        this.bolts(ctx, spr[0] - spr[2] * 0.22, spr[0] + spr[2] * 0.22, spr[1], 3, spr[2] * 0.07);
      }
    }
    if (idl) this.wheel(ctx, idl[0], idl[1], idl[2]);
  },
  // Ship hull: hull color above the waterline, antifouling red below.
  shipHull(ctx, pts, col) {
    const p = new Path2D(); pts.forEach(([a, b], i) => (i ? p.lineTo(a, b) : p.moveTo(a, b))); p.closePath();
    this.paint(ctx, p, col, this.bbox(pts));
    if (this.pass === 'out') return;
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = '#5b2a24'; ctx.fillRect(-2, 0.06, 4, 1);
    ctx.fillStyle = '#1c1f22'; ctx.fillRect(-2, 0.045, 4, 0.016);
    ctx.restore();
  },
  // Stryker 8x8 hull (6.95 m), shared by APC and tank destroyer: wheel arches, chine line, gap between axles 2 and 3.
  stryker(ctx, C) {
    this.P(ctx, [[-0.9, 0.1], [-0.92, -0.02], [-0.9, -0.22], [-0.86, -0.24], [0.3, -0.24], [0.42, -0.225], [0.84, -0.08], [0.92, -0.02], [0.92, 0.04], [0.84, 0.1], [0.7, 0.13], [-0.8, 0.13]], C.body);
    this.ln(ctx, -0.9, -0.02, 0.86, -0.02, 'rgba(0,0,0,0.45)');
    this.ln(ctx, -0.89, -0.2, -0.89, 0.1, 'rgba(0,0,0,0.45)');
    for (let x = 0.5; x <= 0.62; x += 0.03) this.ln(ctx, x, -0.15, x - 0.02, -0.1);
    this.R(ctx, 0.42, -0.27, 0.07, 0.03, C.dark, null, 0.005); this.R(ctx, 0.44, -0.265, 0.03, 0.015, GLASS, null, 0.003);
    // Roof seen from above, side bolts, door hinges.
    this.P(ctx, [[-0.86, -0.24], [-0.83, -0.265], [0.3, -0.265], [0.34, -0.24]], Col.adj(C.body, 9));
    this.bolts(ctx, -0.84, 0.28, -0.17, 12);
    for (const y of [-0.2, -0.06]) this.R(ctx, -0.915, y, 0.025, 0.03, Col.adj(C.body, -10), null, 0.004);
    if (this.pass === 'fill') for (const x of [0.62, 0.31, -0.18, -0.49]) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(x, 0.16, 0.165, Math.PI, 0); ctx.fill(); }
    this.wheels(ctx, [0.62, 0.31, -0.18, -0.49], 0.14);
  },
  // Tiny parked jet silhouette for carrier decks.
  deckJet(ctx, x, y) {
    if (this.pass === 'out') return;
    this.P(ctx, [[x + 0.035, y], [x - 0.03, y - 0.008], [x - 0.035, y - 0.025], [x - 0.025, y - 0.008], [x - 0.035, y]], '#8b969d', null, { noLine: true, flat: true });
  },

  // Faction band painted across a body part (turret band, funnel band).
  band(ctx, C, x, y, w, h) { this.R(ctx, x, y, w, h, C.accent, null, 0.01, { noLine: true }); },
  roundel(ctx, C, x, y, r = 0.08) {
    this.O(ctx, x, y, r, '#eef1f2', null, { noLine: true });
    this.O(ctx, x, y, r * 0.62, C.accent, null, { noLine: true });
  },

  // ---------- Infantry figure (toy proportions, ~0.6 units tall, feet on y = 0.3) ----------
  // West (P), US Army / Bundeswehr 2025: ECH/ACH-type helmet with tan cover, ear-cup headset and NVG shroud, plate
  // carrier with mag pouches, Multicam/Flecktarn-like uniform, coyote boots, M4/HK416-type carbine with optic.
  // East (E), Ratnik kit: 6B47 helmet with Digital-Flora cover (deeper and rounder, no ear cut-out), 6B45 vest with
  // collar and groin flap, black boots, AK-12 with curved magazine and muzzle brake.
  // pose: stand | kneel | prone; weapon: rifle | carbine | long | tube | shovel | detector | bino | none.
  // Extras: pack (false | colour), cross (medic armband + bag), dark (special forces), nvg, mask (balaclava),
  // stripes (telnyashka collar), hat ('boonie' | 'ghillie'), hand ([x, y] target of the free hand, figure space),
  // east (override the side, normally taken from the palette).
  soldier(ctx, C, x, k = 1, opt = {}) {
    ctx.save(); ctx.translate(x, 0.3); ctx.scale(k, k);
    const east = opt.east ?? C === MODEL_COL.E, dark = !!opt.dark, fill = this.pass === 'fill', wpn = opt.weapon || 'rifle';
    const cloth = dark ? (east ? '#363b33' : '#3c4239') : C.cloth, clothD = Col.adj(cloth, -13);
    const gear = dark ? '#202427' : C.gear, gearD = Col.adj(gear, -9);
    const helm = dark ? '#272b2d' : east ? C.cloth : C.skin2;
    const boot = east || dark ? '#1c1c19' : '#5e4c34', glove = dark || east ? '#24261f' : '#6e5f45';
    const G = '#1b1d1a', G2 = '#30332d', cam = dark ? {} : { camo: true };
    const kneel = opt.pose === 'kneel', prone = opt.pose === 'prone', dy = kneel ? 0.08 : 0;
    const pack = opt.pack === false ? null : opt.pack || Col.adj(gear, -5);
    const smooth = (pts) => {
      const p = new Path2D(), n = pts.length, mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
      const m0 = mid(n - 1); p.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i++) { const m = mid(i); p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
      p.closePath(); return p;
    };
    // Two-segment arm from shoulder (sx, sy) to hand target (tx, ty), elbow bent downwards; armband on the upper arm.
    const arm = (sx, sy, tx, ty, w = 0.05) => {
      const L = 0.135, d = Math.min(Math.hypot(tx - sx, ty - sy), 2 * L - 0.001), th = Math.atan2(ty - sy, tx - sx), a = Math.acos(d / (2 * L));
      const ex = sx + Math.cos(th + a) * L, ey = sy + Math.sin(th + a) * L;
      this.L(ctx, sx, sy, ex, ey, cloth, w);
      this.L(ctx, ex, ey, tx, ty, cloth, w * 0.92);
      if (opt.cross || dark) {
        const bx = sx + (ex - sx) * 0.62, by = sy + (ey - sy) * 0.62;
        this.L(ctx, sx + (ex - sx) * 0.3, sy + (ey - sy) * 0.3, bx, by, opt.cross ? '#eef1f2' : C.accent, w * 1.04, { noOut: true });
        if (opt.cross && fill && !this.small) {
          const cx = sx + (ex - sx) * 0.46, cy = sy + (ey - sy) * 0.46, r = w * 0.36;
          ctx.strokeStyle = '#d33a2c'; ctx.lineWidth = w * 0.22; ctx.lineCap = 'butt';
          ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke(); ctx.lineCap = 'round';
        }
      }
      this.O(ctx, tx, ty, w * 0.5, glove, null, { noLine: true });
    };
    // Shoulder weapons in a local frame (origin = pistol grip, +x = muzzle). Returns nothing; draws West or East type.
    const rifle = (kind) => {
      const lng = kind === 'long', car = kind === 'carbine';
      if (east) {
        // AK-12 / SV-98: long receiver, curved plum magazine (rifle) or short box (sniper), muzzle brake or suppressor.
        this.P(ctx, [[-0.21, -0.022], [-0.09, -0.022], [-0.09, 0.012], [-0.15, 0.012], [-0.21, 0.042]], G2);
        this.R(ctx, -0.1, -0.03, lng ? 0.26 : 0.2, 0.04, G, null, 0.01);
        this.R(ctx, lng ? 0.12 : 0.09, -0.027, 0.09, 0.03, G2, null, 0.01);
        if (lng) { this.R(ctx, 0.2, -0.025, 0.14, 0.026, G, null, 0.01); this.R(ctx, -0.07, -0.072, 0.15, 0.03, G, null, 0.012); this.glint(ctx, 0.07, -0.06, 0.008); this.R(ctx, -0.02, 0.008, 0.035, 0.04, G2, null, 0.006); }
        else {
          this.L(ctx, 0.17, -0.012, car ? 0.21 : 0.25, -0.012, G, 0.016);
          if (car) this.R(ctx, 0.18, -0.025, 0.09, 0.026, G, null, 0.01); else this.R(ctx, 0.23, -0.022, 0.035, 0.02, G, null, 0.005);
          this.P(ctx, [[-0.032, 0.008], [0.004, 0.008], [0.03, 0.055], [0.024, 0.088], [-0.004, 0.082], [-0.004, 0.052]], '#3a2b26');
          this.R(ctx, -0.045, -0.05, 0.045, 0.022, G, null, 0.008);
        }
      } else {
        // M4 / HK416 / M110: straight magazine, rail with optic, short barrel (carbine with suppressor).
        this.P(ctx, [[-0.2, -0.018], [-0.09, -0.026], [-0.09, 0.012], [-0.14, 0.012], [-0.2, 0.038]], G2);
        this.R(ctx, -0.1, -0.03, lng ? 0.3 : car ? 0.2 : 0.25, 0.036, G, null, 0.01);
        if (lng) { this.R(ctx, 0.2, -0.024, 0.12, 0.024, G, null, 0.01); this.R(ctx, -0.06, -0.074, 0.14, 0.032, G, null, 0.012); this.glint(ctx, 0.07, -0.062, 0.008); }
        else {
          this.L(ctx, car ? 0.1 : 0.15, -0.012, car ? 0.13 : 0.2, -0.012, G, 0.016);
          if (car) this.R(ctx, 0.11, -0.025, 0.09, 0.026, G, null, 0.01);
          this.R(ctx, -0.06, -0.056, 0.06, 0.026, G, null, 0.008); this.glint(ctx, 0.0, -0.045, 0.007);
        }
        this.P(ctx, [[-0.035, 0.004], [0.0, 0.004], [0.008, lng ? 0.05 : 0.068], [-0.026, lng ? 0.052 : 0.07]], G2);
      }
      this.P(ctx, [[-0.082, 0.004], [-0.055, 0.004], [-0.064, 0.048], [-0.09, 0.044]], G);
    };
    // Helmet / headgear around a head at (hx, hy); faction band clipped to the helmet shell. Heads are drawn
    // 4 % oversized (just enough to read at map size) around the neck point.
    const head = (hx, hy) => {
      ctx.save(); ctx.translate(hx, hy + 0.05); ctx.scale(1.04, 1.04); ctx.translate(-hx, -hy - 0.05);
      head0(hx, hy);
      ctx.restore();
    };
    const head0 = (hx, hy) => {
      if (!opt.mask && !east && opt.hat !== 'ghillie') this.O(ctx, hx - 0.012, hy + 0.012, 0.03, '#2a2c26', null, { noLine: true });
      this.O(ctx, hx, hy, 0.06, opt.mask ? '#2b2f30' : SKIN, null, { noLine: true });
      this.P(ctx, [[hx + 0.05, hy - 0.018], [hx + 0.074, hy + 0.01], [hx + 0.05, hy + 0.016]], opt.mask ? '#2b2f30' : SKIN, null, { noLine: true });
      if (opt.mask && fill) { ctx.fillStyle = SKIN; ctx.fillRect(hx + 0.012, hy - 0.024, 0.05, 0.024); }
      if (opt.hat === 'boonie') {
        this.S(ctx, [[hx - 0.06, hy - 0.025], [hx - 0.05, hy - 0.08], [hx + 0.04, hy - 0.085], [hx + 0.06, hy - 0.025]], helm, cam);
        this.E(ctx, hx, hy - 0.025, 0.1, 0.018, helm, cam);
        if (fill) { ctx.fillStyle = C.accent; ctx.fillRect(hx - 0.055, hy - 0.05, 0.11, 0.016); }
        return;
      }
      if (opt.hat === 'ghillie') {
        const hood = smooth([[hx - 0.09, hy + 0.04], [hx - 0.1, hy - 0.06], [hx - 0.01, hy - 0.11], [hx + 0.07, hy - 0.08], [hx + 0.08, hy - 0.02], [hx + 0.02, hy - 0.03], [hx - 0.02, hy + 0.06]]);
        this.paint(ctx, hood, Col.adj(cloth, -4), [hx - 0.1, hy - 0.11, hx + 0.08, hy + 0.06], { camo: true });
        if (fill) { ctx.fillStyle = C.accent; ctx.fillRect(hx - 0.03, hy - 0.1, 0.06, 0.016); }
        return;
      }
      // West: high ear cut and short brim. East 6B47: deeper shell that comes down over the ears and neck.
      const pts = east
        ? [[hx - 0.09, hy + 0.04], [hx - 0.098, hy - 0.06], [hx - 0.01, hy - 0.122], [hx + 0.085, hy - 0.09], [hx + 0.098, hy - 0.012], [hx + 0.092, hy + 0.004], [hx + 0.02, hy - 0.002], [hx - 0.03, hy + 0.035]]
        : [[hx - 0.082, hy + 0.022], [hx - 0.09, hy - 0.06], [hx - 0.008, hy - 0.115], [hx + 0.08, hy - 0.088], [hx + 0.098, hy - 0.02], [hx + 0.088, hy - 0.006], [hx + 0.01, hy - 0.016], [hx - 0.022, hy + 0.004]];
      const hp = smooth(pts);
      this.paint(ctx, hp, helm, [hx - 0.09, hy - 0.12, hx + 0.1, hy + 0.04], dark ? {} : { camo: true });
      if (fill) { ctx.save(); ctx.clip(hp); ctx.fillStyle = C.accent; ctx.fillRect(hx - 0.12, hy - 0.06, 0.24, 0.024); ctx.restore(); }
      if (opt.nvg) {
        this.R(ctx, hx + 0.055, hy - 0.1, 0.035, 0.03, G, null, 0.008);
        this.R(ctx, hx + 0.058, hy - 0.045, 0.055, 0.034, G, null, 0.01);
        this.R(ctx, hx + 0.1, hy - 0.04, 0.016, 0.024, '#55e07a', null, 0.004, { noLine: true, hi: true });
      }
    };

    if (prone) {
      // Lying figure, head towards +x, chest on the ground.
      this.P(ctx, [[-0.44, -0.055], [-0.12, -0.09], [-0.1, -0.03], [-0.42, -0.012]], clothD);
      this.P(ctx, [[-0.42, -0.038], [-0.11, -0.07], [-0.08, 0], [-0.42, 0]], cloth, null, cam);
      this.P(ctx, [[-0.5, -0.075], [-0.43, -0.05], [-0.43, 0], [-0.49, 0]], boot);
      this.R(ctx, -0.16, -0.13, 0.26, 0.13, cloth, null, 0.05, cam);
      if (opt.hat === 'ghillie') {
        const back = smooth([[-0.46, -0.03], [-0.36, -0.13], [-0.1, -0.17], [0.06, -0.15], [0.09, -0.08], [-0.2, -0.05]]);
        this.paint(ctx, back, Col.adj(cloth, -4), [-0.46, -0.17, 0.09, -0.03], { camo: true });
      } else this.R(ctx, -0.14, -0.14, 0.2, 0.1, gear, null, 0.03);
      ctx.save(); ctx.translate(0.05, -0.058); ctx.rotate(-0.03);
      if (wpn === 'long') {
        // Bipod rifle; frame origin at the butt so the scope sits at eye level.
        ctx.translate(0.2, 0.0); rifle('long'); ctx.translate(-0.2, 0.0);
        this.L(ctx, 0.43, 0.0, 0.47, 0.058, G, 0.014); this.L(ctx, 0.43, 0.0, 0.39, 0.058, G, 0.014);
      }
      ctx.restore();
      head(0.13, -0.105);
      if (wpn !== 'none') arm(0.03, -0.085, 0.27, -0.075, 0.045);
      ctx.restore();
      return;
    }

    // Legs and boots (far leg darker).
    if (kneel) {
      this.P(ctx, [[-0.06, -0.19], [0.025, -0.19], [0.025, -0.06], [0.0, 0.0], [-0.14, 0.0], [-0.14, -0.05], [-0.055, -0.06]], clothD);
      this.P(ctx, [[-0.2, -0.05], [-0.14, -0.05], [-0.13, 0], [-0.2, 0]], boot);
      this.P(ctx, [[-0.02, -0.2], [0.12, -0.19], [0.145, -0.15], [0.135, -0.035], [0.085, -0.035], [0.085, -0.13], [-0.02, -0.12]], cloth, null, cam);
      this.O(ctx, 0.118, -0.16, 0.03, gearD, null, { noLine: true });
      this.P(ctx, [[0.075, -0.042], [0.142, -0.042], [0.178, -0.016], [0.178, 0], [0.075, 0]], boot);
    } else {
      this.P(ctx, [[-0.045, -0.26], [0.02, -0.26], [-0.005, -0.13], [-0.02, -0.035], [-0.075, -0.035], [-0.062, -0.13]], clothD);
      this.P(ctx, [[-0.098, -0.042], [-0.025, -0.042], [0.005, -0.016], [0.005, 0], [-0.098, 0]], boot);
      this.P(ctx, [[-0.022, -0.26], [0.05, -0.26], [0.066, -0.13], [0.06, -0.035], [0.006, -0.035], [0.004, -0.13]], cloth, null, cam);
      this.O(ctx, 0.04, -0.13, 0.028, gearD, null, { noLine: true });
      this.P(ctx, [[0.0, -0.042], [0.064, -0.042], [0.096, -0.016], [0.096, 0], [0.0, 0]], boot);
    }
    ctx.translate(0, dy);
    // Backpack (radio antenna on dark teams), torso, vest with pouches, belt.
    if (pack) {
      this.R(ctx, -0.158, -0.445, 0.09, 0.165, pack, null, 0.03, opt.cross ? {} : cam);
      if (east && !dark) this.R(ctx, -0.17, -0.475, 0.08, 0.04, Col.adj(pack, -8), null, 0.018);
      if (opt.cross && fill && !this.small) { ctx.fillStyle = '#d33a2c'; ctx.fillRect(-0.125, -0.405, 0.024, 0.07); ctx.fillRect(-0.148, -0.382, 0.07, 0.024); }
      if (dark) this.L(ctx, -0.14, -0.44, -0.18, -0.68, '#151716', 0.008, { noOut: true });
    }
    this.R(ctx, -0.08, -0.465, 0.16, 0.225, cloth, null, 0.045, cam);
    this.R(ctx, -0.092, -0.44, 0.185, 0.155, gear, null, 0.026);
    if (east) {
      this.P(ctx, [[-0.07, -0.475], [0.03, -0.478], [0.062, -0.432], [-0.08, -0.43]], gear);
      this.P(ctx, [[0.025, -0.292], [0.09, -0.292], [0.08, -0.215], [0.035, -0.215]], gear);
    }
    this.R(ctx, 0.055, -0.4, 0.05, 0.085, gearD, null, 0.012);
    this.R(ctx, -0.04, -0.38, 0.07, 0.06, gearD, null, 0.012);
    this.ln(ctx, -0.085, -0.41, 0.05, -0.41, 'rgba(0,0,0,0.3)');
    this.R(ctx, -0.086, -0.295, 0.182, 0.032, gearD, null, 0.01);
    if (opt.stripes && fill) {
      ctx.fillStyle = '#eef1f2'; ctx.fillRect(0.03, -0.482, 0.04, 0.03);
      if (!this.small) { ctx.fillStyle = '#2f5fae'; ctx.fillRect(0.03, -0.474, 0.04, 0.007); ctx.fillRect(0.03, -0.461, 0.04, 0.007); }
    }
    head(0.025, -0.52);
    // Weapon and arms (the trigger hand is on the far side of the gun, the support hand is the near arm).
    const sh = [0.005, -0.425];
    const frame = (ox, oy, a, fx, fy) => [ox + fx * Math.cos(a) - fy * Math.sin(a), oy + fx * Math.sin(a) + fy * Math.cos(a)];
    if (wpn === 'rifle' || wpn === 'carbine' || wpn === 'long') {
      const a = -0.1, ox = 0.02, oy = -0.372;
      this.O(ctx, ox - 0.07, oy + 0.02, 0.024, glove, null, { noLine: true });
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(a); rifle(wpn); ctx.restore();
      const t = frame(ox, oy, a, wpn === 'carbine' ? 0.085 : 0.12, -0.004);
      arm(sh[0], sh[1], t[0], t[1]);
    } else if (wpn === 'tube') {
      // FGM-148 Javelin: launch tube on the shoulder, end caps, CLU sight in front of the face on the left side.
      const a = -0.08, ox = 0.02, oy = -0.452;
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(a);
      this.R(ctx, -0.25, -0.04, 0.48, 0.08, '#5b6148', null, 0.035);
      this.R(ctx, 0.21, -0.05, 0.05, 0.1, '#30342c', null, 0.02);
      this.R(ctx, -0.28, -0.05, 0.05, 0.1, '#30342c', null, 0.02);
      this.R(ctx, -0.12, 0.03, 0.06, 0.035, '#30342c', null, 0.01);
      this.R(ctx, 0.04, -0.125, 0.135, 0.085, '#4a4d3c', null, 0.018);
      this.R(ctx, 0.165, -0.115, 0.024, 0.065, GLASS, null, 0.008);
      this.R(ctx, 0.03, -0.11, 0.02, 0.04, G, null, 0.006);
      this.glint(ctx, 0.177, -0.1, 0.008);
      ctx.restore();
      const t = frame(ox, oy, a, 0.11, -0.035);
      arm(sh[0], sh[1], t[0], t[1]);
    } else if (wpn === 'shovel') {
      this.L(ctx, 0.12, -0.06, 0.2, -0.46, '#6b4e2e', 0.025);
      this.P(ctx, [[0.07, -0.02], [0.15, -0.06], [0.14, 0.04], [0.09, 0.05]], METAL);
      arm(sh[0], sh[1], 0.165, -0.33);
    } else if (wpn === 'detector') {
      // Mine detector (AN/PSS-14 / IMP-type): pole down to a search head sweeping over the ground.
      this.L(ctx, 0.12, -0.34, 0.33, -0.04 - dy, G2, 0.018);
      this.E(ctx, 0.35, -0.03 - dy, 0.075, 0.02, '#3d4136');
      this.R(ctx, 0.11, -0.37, 0.05, 0.03, G, null, 0.008);
      arm(sh[0], sh[1], 0.13, -0.33);
    } else if (wpn === 'bino') {
      this.R(ctx, 0.065, -0.545, 0.06, 0.04, G, null, 0.01);
      this.glint(ctx, 0.12, -0.53, 0.007);
      arm(sh[0], sh[1], 0.085, -0.5);
    } else if (opt.hand) {
      arm(sh[0], sh[1], opt.hand[0], opt.hand[1] - dy);
    } else {
      arm(sh[0], sh[1], 0.04, -0.27);
    }
    ctx.restore();
  },
  // Squad: two smaller flank figures behind, one leader in front.
  squad(ctx, C, opt = {}) {
    ctx.save(); ctx.translate(0, -0.05);
    this.soldier(ctx, C, -0.38, 0.84, opt);
    this.soldier(ctx, C, 0.3, 0.84, opt);
    ctx.restore();
    this.soldier(ctx, C, -0.04, 1, opt);
  },

  // ---------- Animated overlays ----------
  anim: {
    thelo(ctx, C, now) { Models.rotor(ctx, now, 0.18, -0.355, 1.02, 13); Models.tailRotor(ctx, now, -0.94, -0.3, 0.15); },
    ahelo(ctx, C, now) { Models.rotor(ctx, now, 0.1, -0.3, 0.94, 15); Models.tailRotor(ctx, now, -0.9, -0.24, 0.15); },
    aa(ctx, C, now) {
      // Rotating search radar panel: its width follows cos to fake the rotation.
      const k = Math.cos(now * 2.6), w = 0.17 * Math.max(0.12, Math.abs(k));
      ctx.fillStyle = '#2b3030'; ctx.fillRect(-0.235, -0.36, 0.03, 0.04);
      ctx.beginPath(); ctx.rect(-0.22 - w, -0.47, w * 2, 0.11);
      ctx.fillStyle = k > 0 ? '#5b6560' : '#3c4440'; ctx.fill();
      ctx.strokeStyle = MODEL_COL.P.outline; ctx.lineWidth = Models.lw * 1.6; ctx.stroke();
      if (k > 0) { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = Models.lw; ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(-0.22 - w, -0.47 + i * 0.0275); ctx.lineTo(-0.22 + w, -0.47 + i * 0.0275); } ctx.stroke(); }
    },
  },
  // Animated overlays for Eastern models (filled by the model files; key = unit type).
  animE: {},
  rotor(ctx, now, cx, y, r, sp) {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, y, r, 0.045, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(215,225,230,0.22)'; ctx.fill();
    const a = Math.sin(now * sp), b = Math.cos(now * sp);
    ctx.strokeStyle = 'rgba(25,28,30,0.85)'; ctx.lineWidth = 0.035; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - a * r, y); ctx.lineTo(cx + a * r, y); ctx.stroke();
    ctx.strokeStyle = 'rgba(25,28,30,0.45)';
    ctx.beginPath(); ctx.moveTo(cx - b * r, y); ctx.lineTo(cx + b * r, y); ctx.stroke();
    ctx.fillStyle = '#2a2e2b'; ctx.beginPath(); ctx.arc(cx, y, 0.035, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  tailRotor(ctx, now, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(215,225,230,0.2)'; ctx.fill();
    const a = now * 40;
    ctx.strokeStyle = 'rgba(25,28,30,0.7)'; ctx.lineWidth = 0.025;
    ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke();
  },

  // ---------- Models (proportions from published dimensions, see comments) ----------
  m: {
    // ---------- Infantry ----------
    // Infantry squad (US Army / Bundeswehr): helmets with tan covers and headsets, plate carriers, M4/HK416 carbines.
    // Eastern side uses the same entry: soldier() switches to Ratnik kit (6B47, 6B45, AK-12) from the palette.
    inf(ctx, C) { this.squad(ctx, C); this.pennant(ctx, C, 0.62, 0.3, 0.78); },
    // Navy SEALs: dark kit, high-cut helmets with flipped-down quad-tube NVGs, suppressed short carbines (MK18-type),
    // radio antenna on the pack, faction colour as armband.
    seal(ctx, C) { this.squad(ctx, C, { dark: true, nvg: true, weapon: 'carbine' }); this.pennant(ctx, C, 0.62, 0.3, 0.78); },
    // 82nd Airborne: T-11 canopy (flat, wide skirt) with suspension lines to the landing trooper, squad behind him.
    para(ctx, C) {
      const pts = [[-0.56, -0.5], [-0.52, -0.76], [-0.18, -0.9], [0.18, -0.9], [0.52, -0.76], [0.56, -0.5], [0.28, -0.56], [0, -0.53], [-0.28, -0.56]];
      this.S(ctx, pts, '#8e977b');
      for (const x of [-0.36, -0.12, 0.12, 0.36]) this.ln(ctx, x * 1.25, -0.84 + Math.abs(x) * 0.25, x, -0.54, 'rgba(0,0,0,0.28)');
      for (const x of [-0.5, -0.26, 0.26, 0.5]) this.L(ctx, x, -0.52, x < 0 ? -0.07 : 0.0, -0.14, 'rgba(40,40,40,0.6)', 0.01, { noOut: true });
      this.squad(ctx, C);
      this.pennant(ctx, C, 0.64, 0.3, 0.62);
    },
    // Sniper team: West M110 SASS (suppressed, 10x scope, bipod), shooter in a boonie hat, spotter with binoculars.
    // East SV-98 team (bolt action, long suppressor), shooter in a Kikimora-type ghillie hood.
    sniper(ctx, C) {
      const east = C === MODEL_COL.E;
      this.soldier(ctx, C, -0.44, 0.82, { pose: 'kneel', weapon: 'bino' });
      this.soldier(ctx, C, 0.08, 0.95, { pose: 'prone', weapon: 'long', hat: east ? 'ghillie' : 'boonie', pack: false });
      this.pennant(ctx, C, -0.7, 0.3, 0.6);
    },
    // Javelin team: gunner kneeling with the FGM-148 (1.2 m tube, CLU sight on the left of the tube), assistant
    // with carbine and a spare round in his pack.
    at(ctx, C) {
      this.soldier(ctx, C, -0.38, 0.86, { pose: 'kneel', pack: '#4f5539' });
      this.soldier(ctx, C, 0.1, 1, { pose: 'kneel', weapon: 'tube' });
      this.pennant(ctx, C, 0.62, 0.3, 0.72);
    },
    // Combat engineers / sappers: mine detector sweep in front, shovel, demolition packs.
    eng(ctx, C) {
      ctx.save(); ctx.translate(0, -0.05);
      this.soldier(ctx, C, -0.4, 0.84, { weapon: 'shovel', pack: '#6b5b3b' });
      this.soldier(ctx, C, 0.3, 0.84, { pack: '#6b5b3b' });
      ctx.restore();
      this.soldier(ctx, C, -0.1, 1, { weapon: 'detector', pack: '#6b5b3b' });
      this.pennant(ctx, C, 0.66, 0.3, 0.72);
    },
    // Combat medics: red-cross armbands and aid bag, one medic treating a casualty on the ground.
    medic(ctx, C) {
      this.soldier(ctx, C, -0.44, 0.88, { cross: true });
      this.soldier(ctx, C, 0.3, 0.78, { pose: 'prone', weapon: 'none', pack: false });
      this.soldier(ctx, C, 0.0, 1, { cross: true, pose: 'kneel', weapon: 'none', hand: [0.2, -0.16], pack: '#4b5240' });
      this.pennant(ctx, C, 0.66, 0.3, 0.72);
    },
    // M252 81 mm mortar (1.27 m tube with finned breech and blast attenuator, round M3A1 baseplate, bipod with M64
    // sight): gunner kneeling at the sight, assistant facing the tube with a round ready to drop.
    // Shared with the East (2B14) via the east flag. Tube from the baseplate at (0.04, 0.255) to the muzzle.
    mortar(ctx, C, east = false) {
    const B = [0.04, 0.255], M = [0.27, -0.12], dx = M[0] - B[0], dy = M[1] - B[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
    const at = (t) => [B[0] + dx * t, B[1] + dy * t];
    this.soldier(ctx, C, -0.12, 0.9, { pose: 'kneel', weapon: 'none', hand: [0.27, -0.33], pack: false });
    // Baseplate, bipod (far leg darker), sight on the left of the bipod collar, tube.
    if (east) this.E(ctx, B[0], 0.278, 0.14, 0.026, '#2e322d');
    else this.P(ctx, [[-0.11, 0.3], [0.19, 0.3], [0.15, 0.255], [-0.07, 0.255]], '#2e322d');
    const c = at(0.62);
    this.L(ctx, c[0], c[1], 0.23, 0.3, '#22251f', 0.02);
    this.L(ctx, c[0], c[1], 0.32, 0.3, '#2c302a', 0.022);
    if (!east) this.L(ctx, 0.25, 0.2, 0.3, 0.2, '#2c302a', 0.016);
    this.L(ctx, B[0], B[1], M[0], M[1], east ? '#3a3f37' : '#363b35', east ? 0.058 : 0.066);
    this.O(ctx, B[0], B[1] - 0.01, 0.04, '#2c302a', null, { noLine: true });
    if (east) { const m = at(0.97); this.L(ctx, m[0], m[1], M[0], M[1], '#2c302a', 0.075); }
    else {
      const m = at(0.86); this.L(ctx, m[0], m[1], M[0], M[1], '#2c302a', 0.092);
      for (const t of [0.1, 0.17, 0.24]) { const p = at(t); this.ln(ctx, p[0] + uy * 0.04, p[1] - ux * 0.04, p[0] - uy * 0.04, p[1] + ux * 0.04, 'rgba(0,0,0,0.55)', 1.4); }
    }
    this.R(ctx, c[0] - 0.035, c[1] - 0.025, 0.07, 0.05, '#2a2e29', null, 0.01);
    this.R(ctx, c[0] - 0.1, c[1] - 0.06, 0.065, 0.04, '#2a2e29', null, 0.01);
    this.glint(ctx, c[0] - 0.09, c[1] - 0.05, 0.008);
    // Assistant on the far side, facing back towards the muzzle, round held over it.
    ctx.save(); ctx.translate(0.55, 0); ctx.scale(-1, 1);
    this.soldier(ctx, C, 0, 0.95, { weapon: 'none', hand: [0.25, -0.516], pack: false });
    ctx.restore();
    const r0 = [M[0] + ux * 0.03, M[1] + uy * 0.03], r1 = [M[0] + ux * 0.15, M[1] + uy * 0.15];
    this.L(ctx, r0[0], r0[1], r1[0], r1[1], '#5c6a45', 0.042);
    this.L(ctx, r0[0], r0[1], r0[0] + ux * 0.03, r0[1] + uy * 0.03, '#2c302a', 0.05);
    this.O(ctx, r1[0], r1[1], 0.016, '#b8a46a', null, { noLine: true });
    this.pennant(ctx, C, -0.62, 0.3, 0.6);
    },
  },
  // Eastern infantry models (missing types fall back to Models.m; soldier() already draws Ratnik kit for side E).
  mE: {
    // Spetsnaz: dark kit, balaclavas, suppressed AK-12 carbines, faction colour as armband.
    seal(ctx, C) { this.squad(ctx, C, { dark: true, mask: true, weapon: 'carbine' }); this.pennant(ctx, C, 0.62, 0.3, 0.78); },
    // VDV: D-10 canopy (rounder, deeper dome, olive) over the landing trooper, telnyashka stripes at the collar.
    para(ctx, C) {
      const pts = [[-0.5, -0.48], [-0.52, -0.74], [-0.26, -0.93], [0.26, -0.93], [0.52, -0.74], [0.5, -0.48], [0.22, -0.53], [0, -0.51], [-0.22, -0.53]];
      this.S(ctx, pts, '#76804f');
      this.O(ctx, 0, -0.875, 0.035, '#5a6340', null, { noLine: true });
      for (const x of [-0.34, -0.12, 0.12, 0.34]) this.ln(ctx, x * 1.2, -0.86 + Math.abs(x) * 0.3, x, -0.52, 'rgba(0,0,0,0.28)');
      for (const x of [-0.46, -0.22, 0.22, 0.46]) this.L(ctx, x, -0.5, x < 0 ? -0.07 : 0.0, -0.14, 'rgba(40,40,40,0.6)', 0.01, { noOut: true });
      this.squad(ctx, C, { stripes: true });
      this.pennant(ctx, C, 0.64, 0.3, 0.62);
    },
    // 9K135 Kornet team: 9P163M-1 tripod launcher, 1.2 m transport-launch container (152 mm) on the cradle, sight
    // unit on its left side; operator kneeling at the eyepiece, loader with AK-12 and a spare container on the ground.
    at(ctx, C) {
      this.soldier(ctx, C, -0.52, 0.8, { pose: 'kneel' });
      this.R(ctx, -0.72, 0.23, 0.38, 0.065, '#59603f', null, 0.03);
      this.R(ctx, -0.74, 0.222, 0.03, 0.08, '#3a3f2e', null, 0.01);
      this.soldier(ctx, C, -0.22, 0.92, { pose: 'kneel', weapon: 'none', hand: [0.2, -0.36], pack: false });
      this.L(ctx, 0.06, -0.02, 0.15, 0.3, '#22251f', 0.022);
      this.L(ctx, 0.06, -0.02, 0.32, 0.3, '#2c302a', 0.024);
      this.L(ctx, 0.06, -0.02, -0.06, 0.3, '#2c302a', 0.024);
      this.R(ctx, 0.02, -0.07, 0.08, 0.06, '#2c302a', null, 0.01);
      ctx.save(); ctx.translate(0.07, -0.19); ctx.rotate(-0.07);
      this.R(ctx, -0.25, -0.04, 0.56, 0.08, '#5d6540', null, 0.025);
      this.R(ctx, 0.29, -0.05, 0.035, 0.1, '#3a3f2e', null, 0.01);
      this.R(ctx, -0.27, -0.05, 0.035, 0.1, '#3a3f2e', null, 0.01);
      this.ln(ctx, 0.05, -0.04, 0.05, 0.04, 'rgba(0,0,0,0.4)');
      ctx.restore();
      this.R(ctx, -0.13, -0.17, 0.17, 0.1, '#3f4434', null, 0.015);
      this.R(ctx, 0.0, -0.16, 0.03, 0.06, GLASS, null, 0.006);
      this.R(ctx, -0.155, -0.14, 0.03, 0.04, '#1b1d1a', null, 0.006);
      this.glint(ctx, 0.012, -0.145, 0.008);
      this.pennant(ctx, C, 0.62, 0.3, 0.72);
    },
    // 2B14 Podnos 82 mm (1.22 m plain tube with muzzle ring, round baseplate, light bipod, MPM-44M sight).
    mortar(ctx, C) { this.m.mortar.call(this, ctx, C, true); },
  },
};
