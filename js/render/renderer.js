// Canvas renderer: tactical world map, provinces, sites, fog of war, units, effects, minimap.
'use strict';

const Render = {
  cam: { x: 10, y: -50, z: 4 },
  dirty: true,
  preview: null,   // { P: Set, E: Set } country keys while choosing a scenario
  selection: new Set(),
  selProv: null,
  box: null,
  fog: true,
  models: true,
  hoverUnit: null,

  init(canvas, mini) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.layer = document.createElement('canvas'); this.lctx = this.layer.getContext('2d');
    this.fogCv = document.createElement('canvas'); this.fctx = this.fogCv.getContext('2d');
    this.mini = mini; this.mctx = mini.getContext('2d');
    this.neutralCol = Geo.countries.map((c) => {
      const h = U.hash(c.k), hue = 35 + (h % 70), sat = 9 + ((h >> 8) % 9), lit = 24 + ((h >> 16) % 8);
      return `hsl(${hue},${sat}%,${lit}%)`;
    });
    this.resize();
    addEventListener('resize', () => this.resize());
  },

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.w = innerWidth; this.h = innerHeight;
    for (const c of [this.cv, this.layer]) { c.width = Math.round(this.w * dpr); c.height = Math.round(this.h * dpr); }
    this.cv.style.width = this.w + 'px'; this.cv.style.height = this.h + 'px';
    this.fogCv.width = Math.ceil(this.w / 2); this.fogCv.height = Math.ceil(this.h / 2);
    this.zMin = Math.max(this.w / Geo.W, this.h / Geo.H) * 0.98;
    this.clampCam();
    this.dirty = true;
  },

  clampCam() {
    const c = this.cam;
    c.z = U.clamp(c.z, this.zMin, 260);
    const hw = this.w / 2 / c.z, hh = this.h / 2 / c.z;
    c.x = U.clamp(c.x, Geo.x0 + hw, Geo.x1 - hw);
    c.y = U.clamp(c.y, Geo.y0 + hh, Geo.y1 - hh);
    if (hw * 2 >= Geo.W) c.x = 0;
    if (hh * 2 >= Geo.H) c.y = (Geo.y0 + Geo.y1) / 2;
  },

  toScreen(x, y) { const c = this.cam; return [(x - c.x) * c.z + this.w / 2, (y - c.y) * c.z + this.h / 2]; },
  toWorld(sx, sy) { const c = this.cam; return [(sx - this.w / 2) / c.z + c.x, (sy - this.h / 2) / c.z + c.y]; },
  zoomAt(sx, sy, f) {
    const [wx, wy] = this.toWorld(sx, sy);
    this.cam.z *= f; this.clampCam();
    const [nx, ny] = this.toWorld(sx, sy);
    this.cam.x += wx - nx; this.cam.y += wy - ny;
    this.clampCam(); this.dirty = true;
  },
  pan(dx, dy) { this.cam.x -= dx / this.cam.z; this.cam.y -= dy / this.cam.z; this.clampCam(); this.dirty = true; },
  flyTo(x, y, z) { this.cam.x = x; this.cam.y = y; if (z) this.cam.z = z; this.clampCam(); this.dirty = true; },

  viewBox() { const [x0, y0] = this.toWorld(0, 0), [x1, y1] = this.toWorld(this.w, this.h); return [x0, y0, x1, y1]; },
  visible(b, vb) { return !(b[2] < vb[0] || b[0] > vb[2] || b[3] < vb[1] || b[1] > vb[3]); },

  // Relation key (P / A / E / N) of a country's own faction, or of the setup preview; null = plain map.
  sideOfCountry(c) {
    if (Game.state) return Game.state.team[c.k] ? Game.rk(c.k) : null;
    if (this.preview) return this.preview.P.has(c.k) ? 'P' : this.preview.A && this.preview.A.has(c.k) ? 'A' : this.preview.E.has(c.k) ? 'E' : null;
    return null;
  },

  provColor(side, shade, contested) {
    const b = COL[side].prov, k = 1 + shade * 2;
    const f = (v) => Math.round(U.clamp(v * k, 0, 255));
    return contested ? `rgb(${f(b[0] * 0.8 + 40)},${f(b[1] * 0.8 + 30)},${f(b[2] * 0.6)})` : `rgb(${f(b[0])},${f(b[1])},${f(b[2])})`;
  },

  // ---------- Static map layer (redrawn only when the camera or ownership changes) ----------
  drawLayer() {
    const ctx = this.lctx, c = this.cam, dpr = this.dpr, S = Game.state;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Ocean: deep radial gradient plus a faint grain so large water areas do not look flat.
    const g = ctx.createRadialGradient(this.w * 0.5, this.h * 0.42, 0, this.w * 0.5, this.h * 0.42, Math.max(this.w, this.h) * 0.75);
    g.addColorStop(0, '#12293a'); g.addColorStop(0.6, '#0c1d2a'); g.addColorStop(1, '#08131c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.w, this.h);
    ctx.fillStyle = this.grain(); ctx.fillRect(0, 0, this.w, this.h);
    const vb = this.viewBox();
    const tf = () => ctx.setTransform(c.z * dpr, 0, 0, c.z * dpr, (this.w / 2 - c.x * c.z) * dpr, (this.h / 2 - c.y * c.z) * dpr);
    // Graticule.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = 'rgba(140,190,210,0.06)'; ctx.lineWidth = 1;
    ctx.beginPath();
    const step = c.z > 30 ? 5 : 10;
    for (let lon = -180; lon <= 180; lon += step) { const [sx] = this.toScreen(lon, 0); ctx.moveTo(sx, 0); ctx.lineTo(sx, this.h); }
    for (let lat = -50; lat <= 80; lat += step) { const [, sy] = this.toScreen(0, Geo.projY(lat)); ctx.moveTo(0, sy); ctx.lineTo(this.w, sy); }
    ctx.stroke();
    tf();
    const hi = c.z > 7;
    const px = 1 / c.z;
    // Shallow-water halo along the coasts, then a dark offset copy of the land for a raised-relief look.
    ctx.lineJoin = 'round';
    const vis = Geo.countries.filter((co) => this.visible(co.bbox, vb));
    ctx.strokeStyle = 'rgba(90,160,200,0.06)'; ctx.lineWidth = 14 * px;
    for (const co of vis) ctx.stroke(co.pathLo);
    ctx.strokeStyle = 'rgba(120,185,215,0.12)'; ctx.lineWidth = 5 * px;
    for (const co of vis) ctx.stroke(hi ? co.path : co.pathLo);
    ctx.save(); ctx.translate(1.2 * px, 2 * px); ctx.fillStyle = 'rgba(2,6,10,0.55)';
    for (const co of vis) ctx.fill(co.pathLo);
    ctx.restore();
    ctx.strokeStyle = 'rgba(150,200,220,0.28)'; ctx.lineWidth = 1.6 * px;
    for (const co of vis) ctx.stroke(hi ? co.path : co.pathLo);
    for (const co of Geo.countries) {
      if (!this.visible(co.bbox, vb)) continue;
      const side = this.sideOfCountry(co);
      // Provinces are coloured by their current owner's relation to the player; untouched neutral land stays plain.
      if (!side || (S && side === 'N' && co.provinces.every((pid) => Game.rk(S.prov[pid].o) === 'N'))) { ctx.fillStyle = this.neutralCol[co.idx]; ctx.fill(hi ? co.path : co.pathLo); continue; }
      if (!S) { ctx.fillStyle = this.provColor(side, 0); ctx.fill(co.path); continue; }
      for (const pid of co.provinces) {
        const p = Geo.provinces[pid], pr = S.prov[pid], rk = Game.rk(pr.o);
        ctx.fillStyle = rk !== 'N' ? this.provColor(rk, p.shade, pr.cap && pr.cap.p > 0.05) : this.neutralCol[co.idx];
        ctx.fill(p.path);
      }
      // Province borders, clipped to the country so Voronoi seams over water are hidden.
      if (c.z > 2.5) {
        ctx.save(); ctx.clip(co.path);
        ctx.strokeStyle = 'rgba(5,10,16,0.45)'; ctx.lineWidth = 0.9 * px; ctx.setLineDash([3 * px, 2 * px]);
        for (const pid of co.provinces) ctx.stroke(Geo.provinces[pid].path);
        ctx.restore(); ctx.setLineDash([]);
      }
    }
    // Country borders.
    ctx.strokeStyle = 'rgba(8,12,14,0.85)'; ctx.lineWidth = 1.1 * px;
    for (const co of Geo.countries) if (this.visible(co.bbox, vb)) ctx.stroke(hi ? co.path : co.pathLo);
    // Highlight belligerent outlines: soft wide glow under a crisp line.
    const edge = { P: 'rgba(165,212,255,0.7)', A: 'rgba(160,240,226,0.7)', E: 'rgba(255,165,150,0.7)' };
    for (const co of vis) {
      const side = this.sideOfCountry(co);
      if (!side || side === 'N') continue;
      ctx.strokeStyle = COL[side].glow + '0.16)'; ctx.lineWidth = 5 * px;
      ctx.stroke(co.path);
      ctx.strokeStyle = edge[side]; ctx.lineWidth = 1.3 * px;
      ctx.stroke(co.path);
    }
    if (this.selProv !== null && S) {
      const p = Geo.provinces[this.selProv];
      ctx.save(); ctx.clip(Geo.countries[p.country].path);
      ctx.fillStyle = 'rgba(255,224,138,0.13)'; ctx.fill(p.path);
      ctx.strokeStyle = 'rgba(255,224,138,0.3)'; ctx.lineWidth = 6 * px; ctx.stroke(p.path);
      ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 2 * px; ctx.stroke(p.path);
      ctx.restore();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawLabels(ctx, vb);
    // Screen vignette (part of the static layer, so it costs nothing per frame).
    ctx.drawImage(this.vignette(), 0, 0, this.w, this.h);
    this.layerKey = this.camKey();
    this.dirty = false;
  },

  // Cached tile of faint noise used as an ocean texture.
  grain() {
    if (this._grain) return this._grain;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), img = g.createImageData(128, 128);
    let s = 1234567;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 16807) % 2147483647;
      const v = s % 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v > 127 ? 255 : 0;
      img.data[i + 3] = (s >> 8) % 7;
    }
    g.putImageData(img, 0, 0);
    return (this._grain = this.lctx.createPattern(c, 'repeat'));
  },

  vignette() {
    const key = this.w + 'x' + this.h;
    if (this._vig && this._vigKey === key) return this._vig;
    const c = this._vig || document.createElement('canvas');
    c.width = Math.ceil(this.w / 2); c.height = Math.ceil(this.h / 2);
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const r = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.58);
    r.addColorStop(0, 'rgba(2,5,8,0)'); r.addColorStop(1, 'rgba(2,5,8,0.55)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
    this._vigKey = key;
    return (this._vig = c);
  },

  // Order feedback: short expanding marker on the map where a command was given.
  pings: [],
  ping(x, y, kind) { this.pings.push({ x, y, kind, t0: performance.now() }); if (this.pings.length > 12) this.pings.shift(); },
  drawPings(ctx) {
    const now = performance.now();
    this.pings = this.pings.filter((p) => now - p.t0 < 700);
    for (const p of this.pings) {
      const k = (now - p.t0) / 700, [sx, sy] = this.toScreen(p.x, p.y);
      const col = p.kind === 'attack' ? '255,120,95' : p.kind === 'load' ? '143,209,106' : '150,215,255';
      ctx.save(); ctx.translate(sx, sy); ctx.scale(1, 0.6);
      ctx.strokeStyle = `rgba(${col},${1 - k})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 6 + k * 18, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 3 + k * 8, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      // Chevron dropping onto the target.
      const d = 6 + (1 - k) * 10;
      ctx.strokeStyle = `rgba(${col},${1 - k})`; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(sx - 6, sy - d - 6); ctx.lineTo(sx, sy - d); ctx.lineTo(sx + 6, sy - d - 6); ctx.stroke();
    }
  },

  camKey() { const c = this.cam; return c.x.toFixed(3) + c.y.toFixed(3) + c.z.toFixed(3) + this.w + 'x' + this.h; },

  drawLabels(ctx, vb) {
    const c = this.cam;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const co of Geo.countries) {
      if (!this.visible(co.bbox, vb)) continue;
      const wpx = (co.bbox[2] - co.bbox[0]) * c.z;
      if (wpx < 46) continue;
      let side = this.sideOfCountry(co);
      if (side === 'N') side = null;
      const size = U.clamp(Math.sqrt(co.area) * c.z * 0.09, 9, 26);
      if (c.z > 40 && !side) continue;
      const [sx, sy] = this.toScreen(co.label[0], co.label[1]);
      ctx.font = `600 ${size.toFixed(0)}px Bahnschrift, "Segoe UI", sans-serif`;
      ctx.letterSpacing = (size * 0.12).toFixed(1) + 'px';
      const name = countryName(co).toUpperCase();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,9,12,0.55)'; ctx.strokeText(name, sx, sy - (side && c.z > 10 ? size : 0));
      ctx.fillStyle = side === 'P' ? 'rgba(205,230,255,0.85)' : side === 'A' ? 'rgba(205,245,238,0.85)' : side === 'E' ? 'rgba(255,215,210,0.85)' : 'rgba(225,228,215,0.5)';
      ctx.fillText(name, sx, sy - (side && c.z > 10 ? size : 0));
    }
    ctx.letterSpacing = '0px';
  },

  // ---------- Frame ----------
  frame() {
    const ctx = this.ctx, dpr = this.dpr, S = Game.state;
    if (this.dirty || this.layerKey !== this.camKey()) this.drawLayer();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.layer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!S) { this.drawMini(); return; }
    const vb = this.viewBox();
    this.drawSites(ctx, vb, S);
    if (this.fog) this.drawFog(ctx, S);
    this.drawFallout(ctx, S);
    this.drawOrders(ctx, S);
    this.drawUnits(ctx, vb, S);
    this.drawThreats(ctx, S);
    this.drawFx(ctx, S);
    this.drawMissiles(ctx, S);
    this.drawPings(ctx);
    if (this.box) {
      const b = this.box;
      ctx.fillStyle = 'rgba(120,200,255,0.10)'; ctx.strokeStyle = 'rgba(160,215,255,0.9)'; ctx.lineWidth = 1;
      ctx.fillRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
      ctx.strokeRect(Math.min(b.x0, b.x1) + 0.5, Math.min(b.y0, b.y1) + 0.5, Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
    }
    this.drawMini();
  },

  siteSize() { return U.clamp(7 + this.cam.z * 0.18, 10, 20); },

  drawSites(ctx, vb, S) {
    const z = this.cam.z, s = this.siteSize();
    const parked = {}, me = S.player;
    for (const u of S.units) if (u.air && u.air.st === 'ground' && u.s === me) parked[u.air.base] = (parked[u.air.base] || 0) + 1;
    for (const p of Geo.provinces) {
      if (p.x < vb[0] - 1 || p.x > vb[2] + 1 || p.y < vb[1] - 1 || p.y > vb[3] + 1) continue;
      const pr = S.prov[p.id], rk = Game.rk(pr.o);
      if (rk === 'N' && (z < 9 || p.type !== 'capital')) continue;
      if (z < 3.2 && p.type !== 'capital') continue;
      const [sx, sy] = this.toScreen(p.x, p.y);
      Sym.site(ctx, p.type, rk, sx, sy, s);
      if (rk === 'N') continue;
      if (pr.o === me && pr.b.radar) {
        // Radar: rotating sweep on the icon, full coverage ring when the province is selected.
        const a = performance.now() / 600;
        ctx.strokeStyle = 'rgba(140,230,190,0.85)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(sx, sy, s * 0.8, a, a + 1.2); ctx.stroke();
        if (this.selProv === p.id) {
          ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(140,230,190,0.6)';
          ctx.beginPath(); ctx.arc(sx, sy, RADAR_RANGE[pr.b.radar] * z, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      if (pr.b.aad && (pr.o === me || this.selProv === p.id)) {
        // Air defense site: small chevrons on the icon, engagement ring when the province is selected.
        ctx.strokeStyle = pr.o === me ? 'rgba(255,190,120,0.9)' : 'rgba(255,140,120,0.9)'; ctx.lineWidth = 1.4;
        for (let i = 0; i < pr.b.aad; i++) { const yy = sy - s * 0.95 - i * 3.5; ctx.beginPath(); ctx.moveTo(sx - 4, yy + 2.5); ctx.lineTo(sx, yy); ctx.lineTo(sx + 4, yy + 2.5); ctx.stroke(); }
        if (this.selProv === p.id) {
          ctx.setLineDash([3, 6]); ctx.strokeStyle = 'rgba(255,170,110,0.55)';
          ctx.beginPath(); ctx.arc(sx, sy, AAD_LEVELS[pr.b.aad].r * z, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      const md = Game.maxDef(p.id);
      if (pr.def < md && z > 4) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(sx - s * 0.7, sy + s * 0.7, s * 1.4, 3);
        ctx.fillStyle = pr.def / md > 0.4 ? '#9fd38a' : '#e0a33a'; ctx.fillRect(sx - s * 0.7, sy + s * 0.7, s * 1.4 * pr.def / md, 3);
      }
      if (pr.cap && pr.cap.p > 0) {
        ctx.beginPath(); ctx.arc(sx, sy, s * 0.85, -Math.PI / 2, -Math.PI / 2 + pr.cap.p * Math.PI * 2);
        ctx.strokeStyle = COL[Game.rk(pr.cap.s)].fill; ctx.lineWidth = 3; ctx.stroke();
      }
      if (parked[p.id] && z > 4) {
        ctx.fillStyle = COL.P.fill; ctx.font = '700 10px Bahnschrift, "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('✈' + parked[p.id], sx + s * 0.75, sy - s * 0.5);
      }
      if (z > 14) {
        ctx.font = `600 ${U.clamp(z * 0.12, 10, 13)}px Bahnschrift, "Segoe UI", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(4,8,12,0.75)';
        const nm = provName(p);
        ctx.strokeText(nm, sx, sy + s * 0.95); ctx.fillStyle = '#e9eef0'; ctx.fillText(nm, sx, sy + s * 0.95);
        const lv = '★'.repeat(pr.lvl);
        ctx.font = '9px "Segoe UI", sans-serif'; ctx.fillStyle = COL.gold; ctx.fillText(lv, sx, sy + s * 0.95 + 13);
      }
    }
  },

  drawFog(ctx, S) {
    const f = this.fctx, fw = this.fogCv.width, fh = this.fogCv.height, z = this.cam.z / 2;
    f.globalCompositeOperation = 'source-over';
    f.clearRect(0, 0, fw, fh);
    f.fillStyle = 'rgba(3,7,11,0.4)'; f.fillRect(0, 0, fw, fh);
    f.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => {
      const [sx, sy] = this.toScreen(x, y);
      const R = r * z, cx = sx / 2, cy = sy / 2;
      if (cx + R < 0 || cy + R < 0 || cx - R > fw || cy - R > fh || R < 1) return;
      const g = f.createRadialGradient(cx, cy, R * 0.6, cx, cy, R);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      f.fillStyle = g; f.beginPath(); f.arc(cx, cy, R, 0, Math.PI * 2); f.fill();
    };
    // Vision is shared with allies.
    const me = S.player;
    for (const u of S.units) if (Game.allied(u.s, me) && !u.inside && !(u.air && u.air.st === 'ground')) hole(u.x, u.y, UNIT_TYPES[u.t].vis);
    S.prov.forEach((pr, pid) => { if (Game.allied(pr.o, me)) hole(Geo.provinces[pid].x, Geo.provinces[pid].y, RADAR_RANGE[pr.b.radar || 0]); });
    ctx.drawImage(this.fogCv, 0, 0, this.w, this.h);
  },

  drawOrders(ctx, S) {
    if (!this.selection.size) return;
    ctx.save();
    // Marching dashes show the direction of travel.
    ctx.setLineDash([6, 5]); ctx.lineDashOffset = -(performance.now() / 45) % 11; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (const id of this.selection) {
      const u = Game.unit(id);
      if (!u || u.inside) continue;
      let pts = null;
      if (u.path) pts = [u.x, u.y].concat(u.path.slice(u.pi));
      else if (u.ord && u.ord.x !== undefined && UNIT_TYPES[u.t].dom === 'air') pts = [u.x, u.y, u.ord.x, u.ord.y];
      if (!pts) continue;
      const k = u.ord ? u.ord.k : 'move';
      ctx.strokeStyle = k === 'amove' || k === 'attack' ? 'rgba(255,140,110,0.75)' : k === 'fast' ? 'rgba(255,220,120,0.75)' : 'rgba(150,215,255,0.7)';
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) { const [sx, sy] = this.toScreen(pts[i], pts[i + 1]); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); }
      ctx.stroke();
      const [ex, ey] = this.toScreen(pts[pts.length - 2], pts[pts.length - 1]);
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.ellipse(ex, ey, 6, 3.6, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex, ey, 2, 0, Math.PI * 2); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
      ctx.setLineDash([6, 5]);
    }
    ctx.restore();
  },

  // Enemy offensives that our reconnaissance spotted: red arrow from the staging area to the expected target.
  drawThreats(ctx, S) {
    const arrow = (x0, y0, pid, main) => {
      const p = Geo.provinces[pid];
      let [ax, ay] = this.toScreen(x0, y0);
      const [bx, by] = this.toScreen(p.x, p.y);
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 2) return;
      const ang = Math.atan2(by - ay, bx - ax), w = main ? 5 : 3.5, hd = main ? 18 : 13;
      // Short axes (neighbouring provinces) are stretched back so the arrow stays readable.
      if (len < 80) { ax = bx - Math.cos(ang) * 80; ay = by - Math.sin(ang) * 80; }
      const ex = bx - Math.cos(ang) * 8, ey = by - Math.sin(ang) * 8;
      const col = main ? 'rgba(255,80,60,0.95)' : 'rgba(255,125,95,0.85)';
      const shaft = () => { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex - Math.cos(ang) * hd * 0.6, ey - Math.sin(ang) * hd * 0.6); ctx.stroke(); };
      const head = () => {
        ctx.beginPath(); ctx.moveTo(ex, ey);
        ctx.lineTo(ex - Math.cos(ang - 0.45) * hd, ey - Math.sin(ang - 0.45) * hd);
        ctx.lineTo(ex - Math.cos(ang + 0.45) * hd, ey - Math.sin(ang + 0.45) * hd);
        ctx.closePath();
      };
      ctx.lineCap = 'round';
      // Dark outline first so the arrow stands out over red territory and unit models.
      ctx.strokeStyle = 'rgba(10,6,6,0.7)'; ctx.lineWidth = w + 3; ctx.setLineDash([]); shaft(); head(); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.setLineDash([12, 7]); ctx.lineDashOffset = -(performance.now() / 40) % 19; shaft();
      ctx.setLineDash([]); ctx.fillStyle = col; head(); ctx.fill();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ax, ay, w, 0, Math.PI * 2); ctx.stroke();
    };
    ctx.save();
    for (const k in S.ai) {
      const O = S.ai[k] && S.ai[k].off;
      if (!O || !O.warned || (O.ph !== 'gather' && O.ph !== 'attack') || !Game.hostile(k, S.player)) continue;
      if (O.main != null) arrow(O.sx, O.sy, O.main, true);
      if (O.side != null && O.ssx != null) arrow(O.ssx, O.ssy, O.side, false);
    }
    ctx.restore();
  },

  unitSize() { return this.models ? U.clamp(15 + this.cam.z * 0.2, 22, 38) : U.clamp(10 + this.cam.z * 0.16, 14, 26); },

  // Units that overlap on screen are merged into one stack (WC4-style) so they stay easy to tap.
  buildClusters(vb, S) {
    const s = this.unitSize(), cell = s * 1.5, map = new Map(), out = [];
    for (const u of S.units) {
      if (u.inside || (u.air && u.air.st === 'ground')) continue;
      if (!Sim.sees(S.player, u)) continue;
      if (u.x < vb[0] - 0.5 || u.x > vb[2] + 0.5 || u.y < vb[1] - 0.5 || u.y > vb[3] + 0.5) continue;
      const [sx, sy] = this.toScreen(u.x, u.y);
      const dom = UNIT_TYPES[u.t].dom;
      // Join the first stack of the same side and domain whose center is close enough on screen.
      const key = u.s + dom;
      let list = map.get(key);
      if (!list) map.set(key, (list = []));
      let c = null;
      for (const k of list) if ((k.cx - sx) ** 2 + (k.cy - sy) ** 2 < cell * cell) { c = k; break; }
      if (!c) { c = { side: u.s, dom, units: [], sx: 0, sy: 0, cx: sx, cy: sy }; list.push(c); out.push(c); }
      c.units.push(u); c.sx += sx; c.sy += sy;
    }
    for (const c of out) {
      c.sx /= c.units.length; c.sy /= c.units.length;
      // Representative: the most expensive unit in the stack.
      c.rep = c.units.reduce((a, b) => (UNIT_TYPES[b.t].cost.m > UNIT_TYPES[a.t].cost.m ? b : a));
    }
    const order = { sea: 0, land: 1, air: 2 };
    out.sort((a, b) => order[a.dom] - order[b.dom]);
    this.clusters = out;
    return out;
  },

  drawUnits(ctx, vb, S) {
    const s = this.unitSize();
    for (const c of this.buildClusters(vb, S)) {
      const u = c.rep, T = UNIT_TYPES[u.t], n = c.units.length;
      const sx = c.sx, sy = c.sy;
      const sel = c.units.some((x) => this.selection.has(x.id));
      const allSel = sel && c.units.every((x) => this.selection.has(x.id));
      const alpha = T.st > 0.6 && u.s === S.player && n === 1 ? 0.8 : 1;
      const rk = Game.rk(u.s), look = Game.look(u.s);
      // Combat feedback: red pulse when hit, hover ring under the cursor.
      const hit = c.units.some((x) => S.t - x.lastHit < 1.5);
      if (hit) {
        const k = 0.5 + 0.5 * Math.sin(performance.now() / 90);
        ctx.beginPath(); ctx.arc(sx, sy, s * (0.95 + 0.15 * k), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,80,60,${0.35 + 0.4 * k})`; ctx.lineWidth = 2.5; ctx.stroke();
      }
      // Ground ring under the stack: white on hover, pulsing gold when selected, plus corner brackets.
      const gy = sy + (T.dom === 'air' ? s * 0.55 : s * 0.3);
      if (this.hover === c && !sel) {
        ctx.beginPath(); ctx.ellipse(sx, gy, s * 1.0, s * 0.34, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      if (sel) {
        const pk = 0.5 + 0.5 * Math.sin(performance.now() / 260);
        ctx.beginPath(); ctx.ellipse(sx, gy, s * 1.05, s * 0.36, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,224,138,${allSel ? 0.12 + 0.06 * pk : 0.06})`; ctx.fill();
        ctx.strokeStyle = allSel ? `rgba(255,232,150,${0.75 + 0.25 * pk})` : 'rgba(255,243,176,0.5)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = allSel ? '#fff3b0' : 'rgba(255,243,176,0.55)'; ctx.lineWidth = 1.6;
        const r = s * 1.02;
        ctx.beginPath();
        for (const [ax, ay] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(sx + ax * r, sy + ay * r * 0.72 - ay * 6); ctx.lineTo(sx + ax * r, sy + ay * r * 0.72); ctx.lineTo(sx + ax * r - ax * 7, sy + ay * r * 0.72); }
        ctx.stroke();
      }
      // Stacks show a second frame behind the representative.
      const big = T.dom === 'sea' ? s * (u.t === 'cv' ? 1.45 : 1.4) : T.dom === 'air' ? s * (T.plane ? 1.25 : 1.15) : s;
      if (this.models) {
        // Unit models: stacks show a second plate behind the representative.
        if (n > 1 && !u.emb) { const u2 = c.units.find((x) => x !== u) || u; Models.draw(ctx, u2.t, look, sx + s * 0.28, sy - s * 0.22, s * 0.85, u.hd, 0.55); }
        if (u.emb) { Models.draw(ctx, 'corv', look, sx, sy, s * 1.2, u.hd, 0.9); Models.draw(ctx, u.t, look, sx, sy - s * 0.55, s * 0.7, u.hd, alpha); }
        else Models.draw(ctx, u.t, look, sx, sy, big, u.hd, T.cls === 'sub' ? 0.8 : alpha);
      } else {
        if (n > 1 && T.dom === 'land' && !u.emb) Sym.counter(ctx, T.sym, rk, sx + 3, sy - 3, s, 0.55);
        if (u.emb) {
          Sym.craft(ctx, 'corv', rk, sx, sy, s * 0.9, u.hd, 0.85);
          Sym.counter(ctx, T.sym, rk, sx, sy - s * 0.5, s * 0.6, alpha);
        } else if (T.dom === 'land') Sym.counter(ctx, T.sym, rk, sx, sy, s, alpha);
        else Sym.craft(ctx, T.sym, rk, sx, sy, T.dom === 'sea' ? s * (u.t === 'cv' ? 1.8 : 1.4) : s * (T.plane ? 1.15 : 1.05), u.hd, T.cls === 'sub' ? 0.75 : alpha);
      }
      // Health (average over the stack), suppression, cargo, stack size.
      const bw = s * 1.3, by = sy + s * 0.62;
      const f = c.units.reduce((a, x) => a + x.hp / UNIT_TYPES[x.t].hp, 0) / n;
      const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
      if (sel || f < 0.999) {
        rr(sx - bw / 2 - 1, by - 1, bw + 2, 5, 2.5); ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fill();
        if (f > 0) { rr(sx - bw / 2, by, Math.max(2, bw * f), 3, 1.5); ctx.fillStyle = f > 0.6 ? '#8fd16a' : f > 0.3 ? '#e2b33c' : '#e2553c'; ctx.fill(); }
      }
      if (n === 1 && u.sup > 20 && T.cls === 'soft') { rr(sx - bw / 2, by + 5, bw * u.sup / 100, 2, 1); ctx.fillStyle = 'rgba(255,214,90,0.9)'; ctx.fill(); }
      if (n > 1) {
        const tx = sx + s * 0.8, ty = sy - s * 0.58, txt = String(n);
        ctx.font = '700 11px Bahnschrift, "Segoe UI", sans-serif';
        const w = Math.max(17, ctx.measureText(txt).width + 9);
        rr(tx - w / 2, ty - 8.5, w, 17, 8.5);
        ctx.fillStyle = COL[rk].dark; ctx.fill();
        ctx.strokeStyle = COL[rk].fill; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, tx, ty + 0.5);
      } else {
        if (u.cargo.length) { ctx.fillStyle = '#fff'; ctx.font = '700 9px Bahnschrift, "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('+' + u.cargo.length, sx + s * 0.8, sy - s * 0.45); }
        if (T.cls === 'soft' && T.men && this.cam.z > 12) {
          ctx.fillStyle = '#e8eef2'; ctx.font = '600 9px Bahnschrift, "Segoe UI", sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          ctx.fillText(Math.max(1, Math.ceil(u.hp / T.hp * T.men)), sx - s * 0.8, sy - s * 0.45);
        }
      }
      // Army number badge.
      const g = this.groupOf && c.side === S.player ? this.groupOf.get(c.units.find((x) => this.groupOf.has(x.id))?.id) : null;
      if (g) {
        const gx = sx - s * 0.88, gy = sy - s * 0.62;
        rr(gx - 7.5, gy - 7.5, 15, 15, 3); ctx.fillStyle = '#e8b54a'; ctx.fill();
        ctx.strokeStyle = '#1a1205'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#1a1205'; ctx.font = '700 10px Bahnschrift, "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(g, gx, gy + 0.5);
      }
      if (c.units.some((x) => x.rout)) { ctx.fillStyle = '#ffd65a'; ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', sx, sy - s * 0.8); }
    }
  },

  // Radioactive fallout zones: pulsing yellow-green haze with a trefoil in the middle.
  drawFallout(ctx, S) {
    if (!S.fallout || !S.fallout.length) return;
    const pulse = 0.85 + 0.15 * Math.sin(performance.now() / 500);
    for (const f of S.fallout) {
      const left = U.clamp((f.until - S.t) / NUKE.fallout, 0, 1);
      const [sx, sy] = this.toScreen(f.x, f.y), R = f.r * this.cam.z;
      if (sx + R < 0 || sy + R < 0 || sx - R > this.w || sy - R > this.h) continue;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      g.addColorStop(0, `rgba(190,230,60,${0.28 * left * pulse})`); g.addColorStop(0.7, `rgba(150,200,40,${0.16 * left * pulse})`); g.addColorStop(1, 'rgba(120,170,30,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2); ctx.fill();
      ctx.setLineDash([5, 6]); ctx.strokeStyle = `rgba(220,240,90,${0.5 * left + 0.15})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = `rgba(240,250,120,${0.4 + 0.4 * left})`; ctx.font = `${U.clamp(R * 0.25, 12, 30)}px "Segoe UI Symbol", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('☢', sx, sy);
    }
  },

  drawFx(ctx, S) {
    const now = S.t;
    for (const f of Game.fx) {
      const age = now - f.t0;
      if (age < 0 || age > f.dur + 0.6) continue;
      const k = U.clamp(age / f.dur, 0, 1);
      const [ax, ay] = this.toScreen(f.x0, f.y0);
      if (f.k === 'boom') {
        if (age > f.dur) continue;
        const R = (f.huge ? f.huge * this.cam.z : (f.big ? 16 : 7)) * (0.4 + k);
        const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, R);
        g.addColorStop(0, `rgba(255,236,170,${0.9 * (1 - k)})`); g.addColorStop(0.4, `rgba(255,140,50,${0.7 * (1 - k)})`); g.addColorStop(1, 'rgba(80,40,20,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ax, ay, R, 0, Math.PI * 2); ctx.fill();
        if (f.big && !f.huge) { ctx.strokeStyle = `rgba(255,220,170,${0.5 * (1 - k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(ax, ay, R * 1.5, R * 0.9, 0, 0, Math.PI * 2); ctx.stroke(); }
        if (f.huge) { ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ax, ay, f.huge * this.cam.z * (0.3 + k * 1.2), 0, Math.PI * 2); ctx.stroke(); }
        if (f.nuke) {
          // Flash, second shock ring and a rising mushroom cloud.
          if (k < 0.12) { ctx.fillStyle = `rgba(255,255,240,${0.55 * (1 - k / 0.12)})`; ctx.fillRect(0, 0, this.w, this.h); }
          const Z = f.huge * this.cam.z;
          ctx.strokeStyle = `rgba(255,240,200,${0.5 * (1 - k)})`; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(ax, ay, Z * (0.1 + k * 1.8), 0, Math.PI * 2); ctx.stroke();
          const cy = ay - Z * 0.6 * Math.min(1, k * 2), cr = Z * (0.15 + 0.25 * Math.min(1, k * 1.5));
          ctx.fillStyle = `rgba(120,90,70,${0.55 * (1 - k)})`;
          ctx.fillRect(ax - cr * 0.18, cy, cr * 0.36, ay - cy);
          const cg = ctx.createRadialGradient(ax, cy, 0, ax, cy, cr);
          cg.addColorStop(0, `rgba(255,200,120,${0.8 * (1 - k)})`); cg.addColorStop(0.6, `rgba(170,110,80,${0.6 * (1 - k)})`); cg.addColorStop(1, 'rgba(90,70,60,0)');
          ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(ax, cy, cr, cr * 0.6, 0, 0, Math.PI * 2); ctx.fill();
        }
        continue;
      }
      if (f.k === 'chute') {
        const y = ay - 18 * (1 - k);
        ctx.strokeStyle = `rgba(230,240,245,${1 - k})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(ax, y - 6, 6, Math.PI, 0); ctx.moveTo(ax - 6, y - 6); ctx.lineTo(ax, y); ctx.lineTo(ax + 6, y - 6); ctx.stroke();
        continue;
      }
      if (age > f.dur) continue;
      const [bx, by] = this.toScreen(f.x1, f.y1);
      if (f.k === 'jet') { Sym.craft(ctx, 'jet', Game.rk(f.side), U.lerp(ax, bx, k), U.lerp(ay, by, k), 14, Math.atan2(by - ay, bx - ax), 1); continue; }
      if (f.k === 'mg' || f.k === 'cannon' || f.k === 'shot') {
        ctx.strokeStyle = f.k === 'cannon' ? `rgba(255,230,160,${1 - k})` : `rgba(255,214,120,${0.8 * (1 - k)})`;
        ctx.lineWidth = f.k === 'cannon' ? 1.6 : 0.8;
        const t0 = Math.max(0, k - 0.5), t1 = Math.min(1, k + 0.5);
        ctx.beginPath(); ctx.moveTo(U.lerp(ax, bx, t0), U.lerp(ay, by, t0)); ctx.lineTo(U.lerp(ax, bx, t1), U.lerp(ay, by, t1)); ctx.stroke();
        if (f.k === 'cannon' && k < 0.3) { ctx.fillStyle = 'rgba(255,240,190,0.9)'; ctx.beginPath(); ctx.arc(ax, ay, 2.5, 0, Math.PI * 2); ctx.fill(); }
        continue;
      }
      // Projectiles on a ballistic arc (shells, rockets, missiles) or flat (torpedo, bomb).
      const flat = f.k === 'torpedo' || f.k === 'bomb';
      const h = flat ? 0 : Math.min(120, Math.hypot(bx - ax, by - ay) * (f.k === 'shell' ? 0.35 : 0.2));
      const px = U.lerp(ax, bx, k), py = U.lerp(ay, by, k) - Math.sin(k * Math.PI) * h;
      if (f.k === 'rocket' || f.k === 'missile') {
        ctx.strokeStyle = 'rgba(220,225,230,0.45)'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let i = 0; i <= 6; i++) { const q = Math.max(0, k - i * 0.04); const qx = U.lerp(ax, bx, q), qy = U.lerp(ay, by, q) - Math.sin(q * Math.PI) * h; i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy); }
        ctx.stroke();
      }
      ctx.fillStyle = f.k === 'torpedo' ? 'rgba(180,230,255,0.9)' : '#ffe6a0';
      ctx.beginPath(); ctx.arc(px, py, f.k === 'missile' ? 2.2 : 1.6, 0, Math.PI * 2); ctx.fill();
    }
  },

  drawMissiles(ctx, S) {
    for (const m of S.missiles) {
      const k = U.clamp((S.t - m.t0) / m.dur, 0, 1);
      const [ax, ay] = this.toScreen(m.sx, m.sy), [bx, by] = this.toScreen(m.tx, m.ty);
      const h = Math.min(260, Math.hypot(bx - ax, by - ay) * 0.35);
      const mrk = Game.rk(m.side);
      ctx.strokeStyle = mrk === 'E' ? 'rgba(255,140,120,0.45)' : mrk === 'N' ? 'rgba(230,225,190,0.35)' : 'rgba(150,205,255,0.35)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) { const q = i / 24 * k; const qx = U.lerp(ax, bx, q), qy = U.lerp(ay, by, q) - Math.sin(q * Math.PI) * h; i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy); }
      ctx.stroke(); ctx.setLineDash([]);
      const px = U.lerp(ax, bx, k), py = U.lerp(ay, by, k) - Math.sin(k * Math.PI) * h;
      ctx.fillStyle = m.nuke ? '#ffd84a' : '#fff'; ctx.beginPath(); ctx.arc(px, py, m.nuke ? 3.4 : 2.6, 0, Math.PI * 2); ctx.fill();
      if (m.nuke) {
        // Nuclear missiles show their blast radius for both sides.
        const R = NUKE.r * this.cam.z, pulse = 0.5 + 0.5 * Math.sin(performance.now() / 90);
        ctx.strokeStyle = `rgba(255,216,74,${0.45 + 0.45 * pulse})`; ctx.lineWidth = 2; ctx.setLineDash([8, 5]);
        ctx.beginPath(); ctx.arc(bx, by, Math.max(10, R), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#ffd84a'; ctx.font = '14px "Segoe UI Symbol", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☢', px, py - 10);
      } else if (mrk === 'E') {
        const R = MISSILES[m.key].aoe * this.cam.z, pulse = 0.5 + 0.5 * Math.sin(performance.now() / 120);
        ctx.strokeStyle = `rgba(255,80,60,${0.4 + 0.4 * pulse})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(bx, by, Math.max(8, R), 0, Math.PI * 2); ctx.stroke();
      }
    }
  },

  // ---------- Minimap ----------
  drawMini() {
    const m = this.mini;
    if (!m || !m.offsetWidth) return;
    const w = m.width, h = m.height, ctx = this.mctx, S = Game.state;
    const sc = Math.min(w / Geo.W, h / Geo.H), ox = (w - Geo.W * sc) / 2, oy = (h - Geo.H * sc) / 2;
    const key = this.dirtyMini;
    if (!this.miniBase || key) {
      this.miniBase = this.miniBase || document.createElement('canvas');
      const b = this.miniBase; b.width = w; b.height = h;
      const bx = b.getContext('2d');
      const og = bx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
      og.addColorStop(0, '#11283a'); og.addColorStop(1, '#08131c');
      bx.fillStyle = og; bx.fillRect(0, 0, w, h);
      bx.setTransform(sc, 0, 0, sc, ox - Geo.x0 * sc, oy - Geo.y0 * sc);
      for (const co of Geo.countries) {
        let side = this.sideOfCountry(co);
        if (S && side) {
          // Colour by the relation that holds most of the country's provinces.
          const n = { P: 0, A: 0, E: 0, N: 0 };
          for (const pid of co.provinces) n[Game.rk(S.prov[pid].o)]++;
          side = Object.keys(n).reduce((a, b) => (n[b] > n[a] ? b : a));
        }
        bx.fillStyle = side && side !== 'N' ? this.provColor(side, 0.12) : '#3b4038';
        bx.fill(co.pathLo);
      }
      bx.strokeStyle = 'rgba(5,9,12,0.6)'; bx.lineWidth = 0.6 / sc;
      for (const co of Geo.countries) bx.stroke(co.pathLo);
      this.dirtyMini = false;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.miniBase, 0, 0);
    if (S) for (const u of S.units) {
      if (u.inside || !Sim.sees(S.player, u)) continue;
      const urk = Game.rk(u.s);
      ctx.fillStyle = urk === 'P' ? '#bfe2ff' : urk === 'A' ? '#a8f0e4' : urk === 'E' ? '#ff9a8a' : '#e6e0b8';
      ctx.fillRect(ox + (u.x - Geo.x0) * sc - 1.2, oy + (u.y - Geo.y0) * sc - 1.2, 2.6, 2.6);
    }
    // Combat pings: own units under fire.
    if (S) { ctx.strokeStyle = 'rgba(255,90,70,0.9)'; ctx.lineWidth = 2; for (const u of S.units) if (u.s === S.player && S.t - u.lastHit < 3 && !u.inside) { ctx.beginPath(); ctx.arc(ox + (u.x - Geo.x0) * sc, oy + (u.y - Geo.y0) * sc, 6 + (performance.now() / 60) % 8, 0, Math.PI * 2); ctx.stroke(); } }
    const vb = this.viewBox();
    const rx = ox + (vb[0] - Geo.x0) * sc, ry = oy + (vb[1] - Geo.y0) * sc, rw = (vb[2] - vb[0]) * sc, rh = (vb[3] - vb[1]) * sc;
    ctx.fillStyle = 'rgba(255,224,138,0.08)'; ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(rx) + 0.5, Math.round(ry) + 0.5, Math.round(rw), Math.round(rh));
    this.miniMap = { sc, ox, oy };
  },
  miniToWorld(mx, my) { const m = this.miniMap; return [(mx - m.ox) / m.sc + Geo.x0, (my - m.oy) / m.sc + Geo.y0]; },
};
