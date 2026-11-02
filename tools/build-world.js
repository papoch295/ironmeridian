// Converts world-atlas TopoJSON (Natural Earth, public domain) into js/data/world.js.
// Usage: node tools/build-world.js <countries-50m.json> <countries-110m.json>
'use strict';
const fs = require('fs');
const path = require('path');

const [hiPath, loPath] = process.argv.slice(2);
if (!hiPath || !loPath) { console.error('usage: build-world.js <50m.json> <110m.json>'); process.exit(1); }

// ISO 3166 numeric -> alpha-2 (alpha-2 is used as the game's country key and for localized names)
const NUM2A2 = ('716ZW 894ZM 887YE 704VN 862VE 336VA 548VU 860UZ 858UY 583FM 584MH 580MP 850VI 316GU 016AS 630PR 840US ' +
  '239GS 086IO 654SH 612PN 660AI 238FK 136KY 060BM 092VG 796TC 500MS 832JE 831GG 833IM 826GB 784AE 804UA 800UG 795TM ' +
  '792TR 788TN 780TT 776TO 768TG 626TL 764TH 834TZ 762TJ 158TW 760SY 756CH 752SE 748SZ 740SR 728SS 729SD 144LK 724ES ' +
  '410KR 710ZA 706SO 090SB 703SK 705SI 702SG 694SL 690SC 688RS 686SN 682SA 678ST 674SM 882WS 670VC 662LC 659KN 646RW ' +
  '643RU 642RO 634QA 620PT 616PL 608PH 604PE 600PY 598PG 591PA 585PW 586PK 512OM 578NO 408KP 566NG 562NE 558NI 554NZ ' +
  '570NU 184CK 528NL 533AW 531CW 524NP 520NR 516NA 508MZ 504MA 732EH 499ME 496MN 498MD 492MC 484MX 480MU 478MR 470MT ' +
  '466ML 462MV 458MY 454MW 450MG 807MK 442LU 440LT 438LI 434LY 430LR 426LS 422LB 428LV 418LA 417KG 414KW 296KI 404KE ' +
  '398KZ 400JO 392JP 388JM 380IT 376IL 275PS 372IE 368IQ 364IR 360ID 356IN 352IS 348HU 340HN 332HT 328GY 624GW 324GN ' +
  '320GT 308GD 300GR 288GH 276DE 268GE 270GM 266GA 250FR 666PM 876WF 663MF 652BL 258PF 540NC 260TF 248AX 246FI 242FJ ' +
  '231ET 233EE 232ER 226GQ 222SV 818EG 218EC 214DO 212DM 262DJ 304GL 234FO 208DK 203CZ 196CY 192CU 191HR 384CI 188CR ' +
  '180CD 178CG 174KM 170CO 156CN 446MO 344HK 152CL 148TD 140CF 132CV 124CA 120CM 116KH 104MM 108BI 854BF 100BG 096BN ' +
  '076BR 072BW 070BA 068BO 064BT 204BJ 084BZ 056BE 112BY 052BB 050BD 048BH 044BS 031AZ 040AT 036AU 334HM 574NF 051AM ' +
  '032AR 028AG 024AO 020AD 012DZ 008AL 004AF 010AQ 534SX').split(' ').reduce((m, s) => (m[s.slice(0, 3)] = s.slice(3), m), {});
const NAMELESS = { 'Kosovo': 'XK', 'Somaliland': 'XS', 'N. Cyprus': 'XC', 'Siachen Glacier': 'XG', 'Indian Ocean Ter.': 'AU' };
const MERGE_BY_NAME = { 'Ashmore and Cartier Is.': 'AU' };
const DROP = new Set(['AQ', 'TF', 'HM', 'GS']); // outside the playable latitude band

const DE = new Intl.DisplayNames(['de'], { type: 'region' });
const EN = new Intl.DisplayNames(['en'], { type: 'region' });
const CUSTOM = { XS: ['Somaliland', 'Somaliland'], XC: ['Nordzypern', 'Northern Cyprus'], XG: ['Siachen', 'Siachen'] };

// Miller cylindrical projection, output in "map degrees"; screen y grows southwards.
const D2R = Math.PI / 180;
const projY = (lat) => -1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * D2R)) / D2R;
const LAT_MIN = -58, LAT_MAX = 84;

function decode(topo) {
  const { scale, translate } = topo.transform;
  const arcs = topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; });
  });
  const ring = (ids) => {
    const out = [];
    for (const i of ids) {
      const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
      for (let k = out.length ? 1 : 0; k < a.length; k++) out.push(a[k]);
    }
    return out;
  };
  return topo.objects.countries.geometries.map((g) => {
    const polys = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
    // Only outer rings are kept: holes (lakes, enclaves) are negligible at this scale.
    return { id: g.id, name: g.properties.name, rings: polys.map((p) => ring(p[0])) };
  });
}

function simplify(pts, tol) { // Douglas-Peucker on projected points
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-9;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len;
      if (d > best) { best = d; bi = i; }
    }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// Clip a ring to the half-plane x <= edge (sign = 1) or x >= edge (sign = -1).
function clipX(ring, edge, sign) {
  const out = [], inside = (p) => sign * (p[0] - edge) <= 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[(i + ring.length - 1) % ring.length], b = ring[i];
    if (inside(b)) {
      if (!inside(a)) out.push([edge, a[1] + (b[1] - a[1]) * (edge - a[0]) / (b[0] - a[0])]);
      out.push(b);
    } else if (inside(a)) out.push([edge, a[1] + (b[1] - a[1]) * (edge - a[0]) / (b[0] - a[0])]);
  }
  if (out.length) out.push(out[0]);
  return out;
}

// Rings crossing the antimeridian (Russia, Fiji, Aleutians) are unwrapped and split into two parts.
function splitAntimeridian(r) {
  const u = [r[0].slice()];
  for (let i = 1; i < r.length; i++) {
    let lon = r[i][0];
    const prev = u[i - 1][0];
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    u.push([lon, r[i][1]]);
  }
  const minX = Math.min(...u.map((p) => p[0])), maxX = Math.max(...u.map((p) => p[0]));
  if (maxX <= 180.0001 && minX >= -180.0001) return [u];
  const shift = maxX > 180 ? -360 : 360;
  const a = shift < 0 ? clipX(u, 180, 1) : clipX(u, -180, -1);
  const b = shift < 0 ? clipX(u.map(([x, y]) => [x + shift, y]), -180, -1) : clipX(u.map(([x, y]) => [x + shift, y]), 180, 1);
  return [a, b].filter((x) => x.length >= 4);
}

function prepare(rings, tol, minArea) {
  const out = [];
  for (const r of rings.flatMap(splitAntimeridian)) {
    const p = r.map(([lon, lat]) => [lon, projY(Math.max(LAT_MIN, Math.min(LAT_MAX, lat)))]);
    let area = 0;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) area += (p[j][0] - p[i][0]) * (p[j][1] + p[i][1]);
    if (Math.abs(area / 2) < minArea) continue;
    // Rings are closed (first == last), so split at the farthest point before simplifying both halves.
    let far = 0, fd = -1;
    for (let i = 1; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[0][0], p[i][1] - p[0][1]); if (d > fd) { fd = d; far = i; } }
    const s = simplify(p.slice(0, far + 1), tol).concat(simplify(p.slice(far), tol).slice(1, -1));
    if (s.length < 3) continue;
    out.push(s.flatMap(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]));
  }
  return out;
}

function keyOf(c) {
  if (MERGE_BY_NAME[c.name]) return MERGE_BY_NAME[c.name];
  if (c.id === undefined) return NAMELESS[c.name];
  return NUM2A2[c.id];
}

const hi = decode(JSON.parse(fs.readFileSync(hiPath, 'utf8')));
const lo = decode(JSON.parse(fs.readFileSync(loPath, 'utf8')));
const loByKey = {};
for (const c of lo) { const k = keyOf(c); if (k) (loByKey[k] = loByKey[k] || []).push(...c.rings); }

const byKey = new Map();
for (const c of hi) {
  const k = keyOf(c);
  if (!k) { console.warn('unmapped', c.id, c.name); continue; }
  if (DROP.has(k)) continue;
  if (!byKey.has(k)) byKey.set(k, { k, rings: [], en: c.name });
  byKey.get(k).rings.push(...c.rings);
}

const countries = [];
let pts = 0;
for (const c of byKey.values()) {
  const h = prepare(c.rings, 0.04, 0.002);
  if (!h.length) continue;
  const l = loByKey[c.k] ? prepare(loByKey[c.k], 0.18, 0.05) : [];
  const names = CUSTOM[c.k] || [DE.of(c.k), EN.of(c.k)];
  countries.push({ k: c.k, de: names[0], en: names[1], hi: h, lo: l.length ? l : null });
  pts += h.reduce((s, r) => s + r.length / 2, 0);
}
countries.sort((a, b) => a.k.localeCompare(b.k));

const out = path.join(__dirname, '..', 'js', 'data', 'world.js');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out,
  '// Generated by tools/build-world.js from world-atlas 2.0.2 (Natural Earth, public domain). Do not edit.\n' +
  'const WORLD_DATA = ' + JSON.stringify({ latMin: LAT_MIN, latMax: LAT_MAX, countries }) + ';\n');
console.log(`${countries.length} countries, ${pts} points, ${(fs.statSync(out).size / 1024).toFixed(0)} KB -> ${out}`);
