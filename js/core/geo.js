// World geometry: country shapes, land/sea raster, provinces (Voronoi cells clipped to borders).
'use strict';

const Geo = {
  MASK_RES: 4,   // mask pixels per map unit
  GRID_RES: 2,   // path grid cells per map unit
  countries: [],
  byKey: {},
  provinces: [], // static province data; dynamic state lives in Game.state.prov[]

  projY(lat) { return -1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * Math.PI / 180)) * 180 / Math.PI; },
  unprojLat(y) { return (Math.atan(Math.exp(-y * Math.PI / 180 / 1.25)) - Math.PI / 4) / 0.4 * 180 / Math.PI; },

  init(onProgress) {
    const D = WORLD_DATA;
    this.x0 = -180; this.x1 = 180;
    this.y0 = this.projY(D.latMax); this.y1 = this.projY(D.latMin);
    this.W = this.x1 - this.x0; this.H = this.y1 - this.y0;
    D.countries.forEach((c, idx) => {
      const co = { idx, k: c.k, de: c.de, en: c.en, hi: c.hi, lo: c.lo || c.hi, power: POWER[c.k] || 1 };
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9, area = 0, big = null, bigA = 0;
      for (const r of c.hi) {
        let a = 0;
        for (let i = 0; i < r.length; i += 2) {
          const x = r[i], y = r[i + 1];
          if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
          const j = (i + 2) % r.length;
          a += x * r[j + 1] - r[j] * y;
        }
        a = Math.abs(a / 2); area += a;
        if (a > bigA) { bigA = a; big = r; }
      }
      co.bbox = [bx0, by0, bx1, by1];
      co.area = area;
      co.label = this.centroid(big);
      co.path = this.toPath(c.hi);
      co.pathLo = this.toPath(co.lo);
      this.countries.push(co);
      this.byKey[c.k] = co;
    });
    onProgress && onProgress(0.25);
    this.buildMask();
    onProgress && onProgress(0.5);
    this.buildGrid();
    onProgress && onProgress(0.7);
    this.buildProvinces();
    onProgress && onProgress(1);
  },

  toPath(rings) {
    const p = new Path2D();
    for (const r of rings) {
      p.moveTo(r[0], r[1]);
      for (let i = 2; i < r.length; i += 2) p.lineTo(r[i], r[i + 1]);
      p.closePath();
    }
    return p;
  },

  centroid(r) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < r.length; i += 2) {
      const j = (i + 2) % r.length, f = r[i] * r[j + 1] - r[j] * r[i + 1];
      a += f; cx += (r[i] + r[j]) * f; cy += (r[i + 1] + r[j + 1]) * f;
    }
    a *= 0.5;
    return Math.abs(a) < 1e-9 ? [r[0], r[1]] : [cx / (6 * a), cy / (6 * a)];
  },

  pointInRings(rings, x, y) {
    let inside = false;
    for (const r of rings) {
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
    }
    return inside;
  },

  exactCountryAt(x, y) {
    for (const c of this.countries) {
      const b = c.bbox;
      if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
      if (this.pointInRings(c.hi, x, y)) return c.idx;
    }
    return -1;
  },

  // Rasterize every country with a color that encodes its index plus a checksum; anti-aliased edge pixels fail the checksum.
  buildMask() {
    const R = this.MASK_RES, w = Math.ceil(this.W * R), h = Math.ceil(this.H * R);
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.setTransform(R, 0, 0, R, -this.x0 * R, -this.y0 * R);
    for (const c of this.countries) {
      const i = c.idx + 1;
      ctx.fillStyle = `rgb(${i & 255},${(i * 73 + 11) & 255},${(i * 151 + 29) & 255})`;
      ctx.fill(c.path);
    }
    const px = ctx.getImageData(0, 0, w, h).data;
    const m = new Int16Array(w * h);
    for (let p = 0, q = 0; p < m.length; p++, q += 4) {
      if (px[q + 3] === 0) { m[p] = -1; continue; }
      const i = px[q];
      m[p] = px[q + 3] === 255 && i > 0 && px[q + 1] === ((i * 73 + 11) & 255) && px[q + 2] === ((i * 151 + 29) & 255) ? i - 1 : -2;
    }
    this.mask = m; this.mw = w; this.mh = h;
  },

  countryAt(x, y) {
    const mx = Math.floor((x - this.x0) * this.MASK_RES), my = Math.floor((y - this.y0) * this.MASK_RES);
    if (mx < 0 || my < 0 || mx >= this.mw || my >= this.mh) return -1;
    const v = this.mask[my * this.mw + mx];
    if (v !== -2) return v;
    const e = this.exactCountryAt(x, y);
    this.mask[my * this.mw + mx] = e === -1 ? -3 : e; // cache resolution (-3 = sea, resolved)
    return e;
  },

  isLand(x, y) { const c = this.countryAt(x, y); return c >= 0; },

  buildGrid() {
    const G = this.GRID_RES, gw = Math.ceil(this.W * G), gh = Math.ceil(this.H * G);
    const gc = new Int16Array(gw * gh).fill(-1), gs = new Uint8Array(gw * gh);
    const s = this.MASK_RES / G;
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
      let land = -1, sea = 0;
      for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) {
        const mx = gx * s + dx, my = gy * s + dy;
        if (mx >= this.mw || my >= this.mh) { sea = 1; continue; }
        let v = this.mask[my * this.mw + mx];
        if (v === -2) v = this.countryAt(this.x0 + (mx + 0.5) / this.MASK_RES, this.y0 + (my + 0.5) / this.MASK_RES);
        if (v < 0) sea = 1; else if (land < 0) land = v;
      }
      gc[gy * gw + gx] = land; gs[gy * gw + gx] = sea;
    }
    this.gc = gc; this.gs = gs; this.gw = gw; this.gh = gh;
  },

  cellOf(x, y) {
    const gx = U.clamp(Math.floor((x - this.x0) * this.GRID_RES), 0, this.gw - 1);
    const gy = U.clamp(Math.floor((y - this.y0) * this.GRID_RES), 0, this.gh - 1);
    return gy * this.gw + gx;
  },
  cellCenter(i) { return [this.x0 + ((i % this.gw) + 0.5) / this.GRID_RES, this.y0 + (Math.floor(i / this.gw) + 0.5) / this.GRID_RES]; },
  isSeaCell(i) { return this.gs[i] === 1 && this.gc[i] < 0; },

  nearestSea(x, y, maxR) {
    const G = this.GRID_RES, c0 = this.cellOf(x, y), cx = c0 % this.gw, cy = Math.floor(c0 / this.gw);
    let best = null, bd = 1e9;
    const R = Math.ceil(maxR * G);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const gx = cx + dx, gy = cy + dy;
      if (gx < 0 || gy < 0 || gx >= this.gw || gy >= this.gh) continue;
      const i = gy * this.gw + gx;
      if (!this.isSeaCell(i)) continue;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = this.cellCenter(i); }
    }
    return best && Math.sqrt(bd) / G <= maxR ? best : null;
  },

  // Sutherland-Hodgman: keep the part of ring r where (p - m) . n <= 0.
  clipHalf(r, mx, my, nx, ny) {
    const out = [], n = r.length;
    if (!n) return out;
    let px = r[n - 2], py = r[n - 1], pin = (px - mx) * nx + (py - my) * ny <= 0;
    for (let i = 0; i < n; i += 2) {
      const x = r[i], y = r[i + 1], cin = (x - mx) * nx + (y - my) * ny <= 0;
      if (cin !== pin) {
        const dp = (px - mx) * nx + (py - my) * ny, dc = (x - mx) * nx + (y - my) * ny, t = dp / (dp - dc);
        out.push(px + (x - px) * t, py + (y - py) * t);
      }
      if (cin) out.push(x, y);
      px = x; py = y; pin = cin;
    }
    return out;
  },

  buildProvinces() {
    const cityByCountry = {};
    for (const [name, lat, lon, cap] of CITIES) {
      const x = lon, y = this.projY(lat);
      let ci = this.countryAt(x, y);
      if (ci < 0) { // coastal city slightly off the simplified coastline: search nearby land
        for (const [dx, dy] of [[0.15, 0], [-0.15, 0], [0, 0.15], [0, -0.15], [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3]]) {
          ci = this.countryAt(x + dx, y + dy);
          if (ci >= 0) break;
        }
      }
      if (ci < 0) continue;
      (cityByCountry[ci] = cityByCountry[ci] || []).push({ name, x, y, cap: !!cap });
    }
    const DIRS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    for (const c of this.countries) {
      const rnd = U.rng(U.hash('prov:' + c.k));
      const n = U.clamp(Math.round(Math.sqrt(c.area) / 1.6) + Math.floor(c.power / 2), 1, 24);
      const cities = (cityByCountry[c.idx] || []).sort((a, b) => b.cap - a.cap);
      const sites = [];
      for (const ct of cities) {
        if (sites.length >= n) break;
        if (sites.some((s) => U.dist(s.x, s.y, ct.x, ct.y) < 0.9)) continue;
        sites.push({ x: ct.x, y: ct.y, name: ct.name, cap: ct.cap });
      }
      // Fill up with generated sites (best-candidate sampling keeps them spread out).
      let guard = 0;
      while (sites.length < n && guard++ < n * 4) {
        let best = null, bd = -1;
        for (let k = 0; k < 40; k++) {
          const x = rnd.range(c.bbox[0], c.bbox[2]), y = rnd.range(c.bbox[1], c.bbox[3]);
          if (this.countryAt(x, y) !== c.idx) continue;
          let d = 1e9;
          for (const s of sites) d = Math.min(d, U.dist2(s.x, s.y, x, y));
          if (d > bd) { bd = d; best = { x, y }; }
        }
        if (!best) continue;
        if (sites.length && bd < 0.36) break; // country too small for more
        sites.push(best);
      }
      if (!sites.length) {
        const [lx, ly] = c.label;
        sites.push({ x: lx, y: ly });
      }
      if (!sites.some((s) => s.cap)) sites[0].cap = true;
      if (this.countryAt(c.label[0], c.label[1]) !== c.idx) c.label = [sites[0].x, sites[0].y];
      const cx = sites.reduce((s, p) => s + p.x, 0) / sites.length, cy = sites.reduce((s, p) => s + p.y, 0) / sites.length;
      const oilChance = OIL_RICH.has(c.k) ? 0.45 : 0.12;
      c.provinces = [];
      sites.forEach((s, i) => {
        const sea = this.nearestSea(s.x, s.y, 1.3);
        let type;
        if (s.cap) type = 'capital';
        else if (s.name) type = sea && rnd() < 0.55 ? 'port' : rnd() < 0.25 ? 'industry' : 'city';
        else {
          const r = rnd();
          type = r < oilChance ? 'oil' : r < oilChance + 0.32 ? 'industry' : r < oilChance + 0.45 ? 'airbase' : sea && r < oilChance + 0.65 ? 'port' : 'city';
        }
        // Clip every country ring against the bisectors to the other sites -> Voronoi province.
        const rings = [];
        for (const r0 of c.hi) {
          let r = r0;
          for (const o of sites) {
            if (o === s || !r.length) continue;
            r = this.clipHalf(r, (s.x + o.x) / 2, (s.y + o.y) / 2, o.x - s.x, o.y - s.y);
          }
          if (r.length >= 6) rings.push(r);
        }
        const ang = Math.atan2(s.y - cy, s.x - cx), far = U.dist(s.x, s.y, cx, cy);
        const dir = far < Math.sqrt(c.area) * 0.12 ? 'C' : DIRS[(Math.round(ang / (Math.PI / 4)) + 8) % 8];
        const p = {
          id: this.provinces.length, country: c.idx, x: s.x, y: s.y, type, name: s.name || null, dir,
          seaPt: sea, coastal: !!sea, path: this.toPath(rings), rings,
          shade: rnd() * 0.08 - 0.04,
        };
        this.provinces.push(p);
        c.provinces.push(p.id);
      });
      // Disambiguate generated names ("Ölfeld Nord", "Ölfeld Nord II").
      const seen = {};
      for (const pid of c.provinces) {
        const p = this.provinces[pid];
        if (p.name) continue;
        const key = p.type + p.dir;
        seen[key] = (seen[key] || 0) + 1;
        p.suffix = seen[key] > 1 ? ' ' + ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][seen[key]] : '';
      }
    }
  },

  provinceAt(x, y) {
    const ci = this.countryAt(x, y);
    if (ci < 0) return null;
    let best = null, bd = 1e9;
    for (const pid of this.countries[ci].provinces) {
      const p = this.provinces[pid], d = U.dist2(p.x, p.y, x, y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  },
};
