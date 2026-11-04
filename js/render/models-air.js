// Helicopter and fixed-wing models for both factions. Drawn with the helpers in models.js.
// Aircraft are not camouflaged like ground vehicles: they use the faction air grey (C.jet) or white (Tu-160).
// Fixed-wing aircraft are seen slightly from above: the far wing peeks out above the fuselage, the near wing
// hangs below it, so the planform reads even at 30 px.
'use strict';

// ---------- Shared air helpers (prefixed air*) ----------
Object.assign(Models, {
  // Closed path from points, straight (P) or smoothed (S) like the core helpers, so it can be painted and reused.
  airPath(pts, smooth) {
    const p = new Path2D(), n = pts.length;
    if (!smooth) { pts.forEach(([a, b], i) => (i ? p.lineTo(a, b) : p.moveTo(a, b))); p.closePath(); return p; }
    const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
    const m0 = mid(n - 1); p.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const m = mid(i); p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
    p.closePath(); return p;
  },
  // Russian two-tone blue-grey splinter scheme (Su-35S): angular light and dark patches over the base grey.
  airSplinter(ctx, pts, col, smooth) {
    const path = this.airPath(pts, smooth), bb = this.bbox(pts);
    this.paint(ctx, path, col, bb);
    if (this.pass === 'out' || this.small) return;
    ctx.save(); ctx.clip(path);
    const P = [
      ['#b9c6ce', [[1.1, -0.2], [0.72, -0.2], [0.55, 0.2], [0.95, 0.2]]],
      ['#56708a', [[0.62, -0.3], [0.36, -0.3], [0.18, 0.25], [0.44, 0.25]]],
      ['#b9c6ce', [[0.2, -0.3], [-0.02, -0.3], [-0.2, 0.3], [0.02, 0.3]]],
      ['#56708a', [[-0.12, -0.5], [-0.42, -0.5], [-0.62, 0.3], [-0.3, 0.3]]],
      ['#b9c6ce', [[-0.56, -0.5], [-0.76, -0.5], [-0.98, 0.3], [-0.76, 0.3]]],
      ['#56708a', [[-0.86, -0.5], [-1.2, -0.5], [-1.2, 0.3], [-1.04, 0.3]]],
    ];
    ctx.globalAlpha *= 0.7;
    for (const [c, q] of P) { ctx.fillStyle = c; ctx.beginPath(); q.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.fill(); }
    ctx.globalAlpha /= 0.7;
    ctx.restore();
    this.cel(ctx, path, bb[1], Math.max(0.02, bb[3] - bb[1]));
    ctx.strokeStyle = Col.adj(col, -36); ctx.lineWidth = this.lw * 1.3; ctx.stroke(path);
  },
  // Main rotor seen slightly from above: translucent disc plus n blades, far blades fainter. dir = turning sense.
  airRotor(ctx, now, cx, y, r, sp, n, dir = 1, ry = 0.06) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(cx, y, r, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(215,225,232,0.17)'; ctx.fill();
    ctx.strokeStyle = 'rgba(235,242,248,0.16)'; ctx.lineWidth = this.lw; ctx.stroke();
    const bl = [];
    for (let i = 0; i < n; i++) { const a = dir * now * sp + (i * Math.PI * 2) / n; bl.push([Math.cos(a), Math.sin(a)]); }
    bl.sort((a, b) => a[1] - b[1]);
    const w = Math.max(0.03, this.lw * 1.6);
    for (const [c, s] of bl) {
      const k = (s + 1) / 2;
      ctx.strokeStyle = `rgba(22,25,28,${(0.4 + 0.45 * k).toFixed(2)})`; ctx.lineWidth = w * (0.8 + 0.3 * k);
      ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + c * r, y + s * ry); ctx.stroke();
    }
    ctx.fillStyle = '#25292a'; ctx.beginPath(); ctx.ellipse(cx, y, 0.055, 0.025, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // Tail rotor in side view. angs = blade angles (radians) relative to the hub; behind = on the far side of the fin.
  airTail(ctx, now, x, y, r, angs, behind) {
    const al = behind ? 0.5 : 1;
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = `rgba(215,225,232,${0.2 * al})`; ctx.fill();
    const a0 = now * 38;
    ctx.strokeStyle = `rgba(22,25,28,${0.8 * al})`; ctx.lineWidth = Math.max(0.022, this.lw * 1.3);
    ctx.beginPath();
    for (const a of angs) { ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a0 + a) * r, y + Math.sin(a0 + a) * r); }
    ctx.stroke();
    ctx.fillStyle = `rgba(37,41,42,${al})`; ctx.beginPath(); ctx.arc(x, y, 0.025, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  // Near wing seen from above: dark thickness edge below, lighter top surface on top.
  airWing(ctx, pts, col, t = 0.022) {
    const lo = pts.map(([a, b]) => [a, b + t]);
    this.P(ctx, lo, Col.adj(col, -28));
    this.P(ctx, pts, Col.adj(col, 8), null, { hi: true });
    this.airEdge(ctx, lo); this.airEdge(ctx, pts);
  },
  // Dark contour for parts that overlap the fuselage (the outline pass only draws the outer silhouette).
  airEdge(ctx, pts, smooth) {
    if (this.pass === 'out') return;
    ctx.strokeStyle = this.outCol; ctx.globalAlpha *= 0.8; ctx.lineWidth = this.lw * 1.5;
    ctx.stroke(Array.isArray(pts) ? this.airPath(pts, smooth) : pts); ctx.globalAlpha /= 0.8;
  },
  // Engine pod under a wing: pylon, nacelle with dark intake lip and exhaust cone. x0 = intake, x1 = exhaust.
  airPod(ctx, col, x0, x1, cy, r, wy) {
    const py = [[x0 - 0.06, wy], [x1 + 0.08, wy], [x1 + 0.06, cy], [x0 - 0.08, cy]];
    this.P(ctx, py, Col.adj(col, -14)); this.airEdge(ctx, py);
    this.R(ctx, x1, cy - r, x0 - x1, r * 2, col, null, r, { hi: true });
    const p = new Path2D(); if (p.roundRect) p.roundRect(x1, cy - r, x0 - x1, r * 2, r); else p.rect(x1, cy - r, x0 - x1, r * 2);
    this.airEdge(ctx, p);
    this.R(ctx, x0 - 0.03, cy - r * 0.86, 0.03, r * 1.72, '#1b1e1f', null, 0.012, { noLine: true });
    this.ln(ctx, x0 - 0.03, cy - r * 0.8, x0 - 0.03, cy + r * 0.8, 'rgba(230,236,240,0.7)', 1.5);
    this.P(ctx, [[x1 + 0.01, cy - r * 0.7], [x1 - 0.04, cy - r * 0.4], [x1 - 0.04, cy + r * 0.4], [x1 + 0.01, cy + r * 0.7]], '#3a3a36');
  },
});

// Western (P) models.
Object.assign(Models.m, {
  // ---------- Helicopters ----------
  // UH-60M Black Hawk (15.3 m fuselage, 16.4 m rotor, 5.1 m high): long low cabin with sliding door, engine/gearbox
  // hump, tall rearward-leaning tail pylon with canted tail rotor on the right, large stabilator, fixed tail wheel.
  thelo(ctx, C) {
    const B = Col.adj(C.jet, -14), D = Col.adj(B, -10);
    this.P(ctx, [[-0.74, -0.08], [-0.85, -0.4], [-0.93, -0.45], [-0.99, -0.41], [-0.92, -0.06]], B);
    this.S(ctx, [[0.98, 0.06], [0.995, -0.02], [0.94, -0.11], [0.82, -0.19], [0.66, -0.23], [0.3, -0.235], [-0.25, -0.225], [-0.4, -0.16], [-0.6, -0.115], [-0.85, -0.095], [-0.95, -0.085], [-0.95, -0.02], [-0.85, -0.02], [-0.6, 0.0], [-0.42, 0.06], [-0.3, 0.15], [0.0, 0.17], [0.7, 0.17], [0.88, 0.15], [0.96, 0.11]], B);
    // Engine and gearbox hump with exhaust, mast.
    this.S(ctx, [[0.54, -0.215], [0.46, -0.3], [0.3, -0.335], [-0.05, -0.335], [-0.22, -0.29], [-0.32, -0.215]], Col.adj(B, 5));
    this.P(ctx, [[-0.14, -0.31], [-0.3, -0.3], [-0.34, -0.23], [-0.18, -0.235]], D);
    this.O(ctx, 0.43, -0.27, 0.03, '#161918');
    this.R(ctx, 0.1, -0.44, 0.05, 0.11, C.dark, null, 0.01);
    // Cockpit, door and cabin windows.
    this.P(ctx, [[0.975, -0.035], [0.935, -0.11], [0.82, -0.185], [0.7, -0.205], [0.68, -0.07], [0.8, -0.03]], GLASS);
    this.P(ctx, [[0.96, 0.02], [0.93, 0.07], [0.86, 0.07], [0.87, 0.02]], GLASS);
    this.R(ctx, 0.52, -0.19, 0.13, 0.1, GLASS, null, 0.015);
    this.R(ctx, 0.12, -0.17, 0.17, 0.09, GLASS, null, 0.015);
    this.glint(ctx, 0.84, -0.13); this.glint(ctx, 0.2, -0.14, 0.014);
    this.ln(ctx, 0.37, -0.2, 0.37, 0.15, 'rgba(0,0,0,0.5)'); this.ln(ctx, 0.0, -0.2, 0.0, 0.15, 'rgba(0,0,0,0.5)');
    this.ln(ctx, -0.42, -0.14, -0.9, -0.07); this.ln(ctx, 0.66, 0.15, -0.2, 0.15, 'rgba(255,255,255,0.15)');
    // Stabilator, gear.
    this.P(ctx, [[-0.8, -0.1], [-1.05, -0.12], [-1.07, -0.075], [-0.82, -0.06]], Col.adj(B, 4));
    this.L(ctx, 0.43, 0.12, 0.45, 0.24, C.dark, 0.026); this.wheel(ctx, 0.45, 0.25, 0.05);
    this.L(ctx, -0.74, -0.02, -0.74, 0.08, C.dark, 0.018); this.wheel(ctx, -0.74, 0.09, 0.03);
    this.band(ctx, C, -0.955, -0.38, 0.1, 0.055);
    this.roundel(ctx, C, -0.14, -0.06, 0.055);
  },
  // AH-64E Apache Guardian (17.7 m incl. rotors, 14.6 m rotor): stepped tandem canopy (pilot above and behind the
  // gunner), TADS/PNVS nose turret, Longbow radome above the rotor, high engine nacelles, stub wings with Hellfire
  // racks, M230 chain gun under the nose, tailwheel, stabilator at the fin root, X-shaped tail rotor on the left.
  ahelo(ctx, C) {
    const B = Col.adj(C.jet, -22), D = Col.adj(B, -8);
    this.P(ctx, [[-0.72, -0.06], [-0.86, -0.37], [-0.95, -0.385], [-0.98, -0.31], [-0.92, -0.04]], B);
    this.S(ctx, [[0.88, 0.09], [0.9, -0.02], [0.8, -0.06], [0.6, -0.1], [0.35, -0.16], [0.1, -0.2], [-0.12, -0.19], [-0.3, -0.12], [-0.5, -0.08], [-0.85, -0.06], [-0.96, -0.06], [-0.96, 0.0], [-0.82, 0.01], [-0.5, 0.03], [-0.3, 0.07], [-0.1, 0.13], [0.2, 0.15], [0.6, 0.13], [0.8, 0.12]], B);
    // Stepped canopy frame and glass.
    this.P(ctx, [[0.87, -0.03], [0.78, -0.135], [0.59, -0.16], [0.53, -0.235], [0.3, -0.26], [0.21, -0.19], [0.21, -0.08]], Col.adj(B, 5));
    this.P(ctx, [[0.84, -0.04], [0.76, -0.125], [0.61, -0.14], [0.58, -0.06]], GLASS);
    this.P(ctx, [[0.55, -0.15], [0.5, -0.22], [0.32, -0.24], [0.26, -0.185], [0.27, -0.1], [0.53, -0.1]], GLASS);
    this.glint(ctx, 0.72, -0.1); this.glint(ctx, 0.44, -0.2);
    // Engine nacelle with exhaust, mast and Longbow radome.
    this.S(ctx, [[0.16, -0.17], [0.1, -0.235], [-0.12, -0.245], [-0.3, -0.2], [-0.33, -0.14], [-0.1, -0.12], [0.12, -0.12]], Col.adj(B, 7));
    this.O(ctx, 0.12, -0.18, 0.035, '#141716');
    this.R(ctx, -0.38, -0.215, 0.1, 0.065, '#1e2221', null, 0.02);
    this.R(ctx, 0.03, -0.38, 0.045, 0.16, C.dark, null, 0.01);
    this.E(ctx, 0.05, -0.45, 0.09, 0.05, Col.adj(B, 14));
    this.ln(ctx, -0.04, -0.45, 0.14, -0.45, 'rgba(0,0,0,0.35)');
    // Nose sensors and chain gun.
    this.O(ctx, 0.94, 0.04, 0.065, C.dark); this.O(ctx, 0.985, 0.035, 0.022, GLASS, null, { noLine: true });
    this.O(ctx, 0.88, -0.055, 0.03, C.dark);
    this.O(ctx, 0.52, 0.16, 0.035, C.dark); this.L(ctx, 0.52, 0.165, 0.76, 0.2, GUN, 0.02);
    // Stub wing with Hellfire rack.
    this.P(ctx, [[0.13, -0.01], [-0.19, -0.01], [-0.21, 0.025], [0.11, 0.025]], D);
    this.L(ctx, 0.0, 0.02, 0.0, 0.05, C.dark, 0.02);
    for (const y of [0.06, 0.095]) { this.R(ctx, -0.13, y - 0.013, 0.28, 0.026, '#636a4e', null, 0.013); if (this.pass === 'fill') { ctx.fillStyle = '#2b2f26'; ctx.fillRect(0.12, y - 0.013, 0.025, 0.026); } }
    // Stabilator, gear.
    this.P(ctx, [[-0.82, -0.03], [-1.03, -0.035], [-1.04, 0.0], [-0.84, 0.01]], Col.adj(B, 5));
    this.L(ctx, 0.4, 0.12, 0.42, 0.23, C.dark, 0.022); this.wheel(ctx, 0.42, 0.24, 0.045);
    this.L(ctx, -0.86, 0.0, -0.86, 0.1, C.dark, 0.018); this.wheel(ctx, -0.86, 0.11, 0.03);
    this.band(ctx, C, -0.94, -0.33, 0.09, 0.055);
    this.roundel(ctx, C, -0.42, -0.03, 0.04);
  },

  // ---------- Fixed wing ----------
  // C-17A Globemaster III (53 m long, 51.8 m span, 16.8 m high): high swept wing with winglets and four podded
  // F117 engines, T-tail, main gear sponsons, upswept rear fuselage with cargo ramp, raised cockpit.
  tplane(ctx, C) {
    const B = C.jet, D = Col.adj(B, -14);
    this.P(ctx, [[0.32, -0.15], [-0.14, -0.26], [-0.26, -0.26], [-0.12, -0.15]], D);
    this.P(ctx, [[-0.16, -0.26], [-0.2, -0.33], [-0.25, -0.33], [-0.26, -0.26]], D);
    // T-tail: far stabiliser half, fin, near half.
    this.P(ctx, [[-0.74, -0.5], [-0.93, -0.55], [-0.99, -0.55], [-0.94, -0.5]], D);
    this.P(ctx, [[-0.55, -0.12], [-0.78, -0.5], [-0.93, -0.51], [-0.97, -0.06]], B);
    this.P(ctx, [[-0.74, -0.5], [-0.98, -0.45], [-1.06, -0.45], [-0.95, -0.5]], Col.adj(B, 4));
    this.S(ctx, [[1.0, 0.05], [0.995, -0.03], [0.96, -0.09], [0.88, -0.14], [0.75, -0.155], [0.4, -0.16], [-0.3, -0.16], [-0.55, -0.13], [-0.8, -0.09], [-0.98, -0.06], [-1.0, -0.03], [-0.95, 0.0], [-0.75, 0.03], [-0.5, 0.1], [-0.35, 0.145], [0.6, 0.15], [0.85, 0.135], [0.95, 0.1]], B);
    this.S(ctx, [[0.25, 0.12], [0.2, 0.19], [-0.28, 0.19], [-0.36, 0.12]], Col.adj(B, -8));
    this.P(ctx, [[0.36, -0.155], [0.28, -0.195], [-0.15, -0.19], [-0.25, -0.155]], B);
    this.P(ctx, [[0.975, -0.06], [0.935, -0.1], [0.87, -0.13], [0.84, -0.11], [0.885, -0.065]], GLASS);
    this.ln(ctx, -0.36, 0.14, -0.78, 0.02, 'rgba(0,0,0,0.5)'); this.ln(ctx, 0.78, -0.1, 0.78, 0.1);
    // Near wing with winglet and its two engines.
    this.airWing(ctx, [[0.36, -0.15], [-0.16, 0.09], [-0.3, 0.09], [-0.14, -0.14]], B);
    this.P(ctx, [[-0.19, 0.09], [-0.25, 0.0], [-0.3, 0.0], [-0.31, 0.09]], Col.adj(B, 2));
    this.airPod(ctx, Col.adj(B, -3), 0.32, 0.06, 0.0, 0.06, -0.08);
    this.airPod(ctx, Col.adj(B, -3), 0.17, -0.09, 0.09, 0.06, 0.0);
    this.band(ctx, C, -0.88, -0.42, 0.11, 0.06);
    this.roundel(ctx, C, 0.55, -0.03, 0.05);
  },
  // F-35A Lightning II (15.7 m long, 10.7 m span, 4.4 m high): deep chined body, frameless gold-tinted canopy,
  // DSI intake bumps, trapezoid wing and tailplanes, twin outward-canted fins, single F135 nozzle.
  jet(ctx, C) {
    const B = Col.adj(C.jet, -16), D = Col.adj(B, -10);
    this.P(ctx, [[-0.44, -0.1], [-0.62, -0.35], [-0.74, -0.35], [-0.74, -0.1]], D);
    this.P(ctx, [[-0.58, -0.04], [-0.84, -0.12], [-0.95, -0.12], [-0.92, -0.04]], D);
    this.P(ctx, [[0.28, -0.04], [-0.2, -0.16], [-0.4, -0.16], [-0.44, -0.04]], D);
    this.S(ctx, [[1.04, 0.02], [0.94, -0.02], [0.8, -0.06], [0.62, -0.1], [0.4, -0.125], [0.1, -0.13], [-0.3, -0.11], [-0.7, -0.08], [-0.9, -0.065], [-0.92, 0.05], [-0.7, 0.07], [-0.3, 0.11], [0.2, 0.11], [0.5, 0.08], [0.75, 0.05], [0.92, 0.04]], B);
    this.ln(ctx, 0.95, 0.0, -0.85, 0.0, 'rgba(255,255,255,0.12)');
    // DSI intake.
    this.P(ctx, [[0.38, -0.085], [0.42, 0.045], [0.22, 0.055], [0.2, -0.085]], '#1b1f22');
    this.E(ctx, 0.39, -0.02, 0.05, 0.04, B);
    // Canopy.
    this.S(ctx, [[0.72, -0.07], [0.6, -0.15], [0.44, -0.185], [0.3, -0.175], [0.22, -0.12], [0.3, -0.105], [0.55, -0.09]], '#3b3220');
    if (this.pass === 'fill') { const p = this.airPath([[0.72, -0.07], [0.6, -0.15], [0.44, -0.185], [0.3, -0.175], [0.22, -0.12], [0.3, -0.105], [0.55, -0.09]], true); const g = ctx.createLinearGradient(0.3, -0.18, 0.6, -0.07); g.addColorStop(0, 'rgba(255,220,140,0.55)'); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ctx.fill(p); }
    this.glint(ctx, 0.44, -0.155);
    // Near wing, tailplane and fin.
    this.airWing(ctx, [[0.3, 0.02], [-0.22, 0.21], [-0.42, 0.21], [-0.46, 0.02]], B);
    this.airWing(ctx, [[-0.6, 0.03], [-0.86, 0.13], [-0.99, 0.13], [-0.93, 0.03]], B, 0.016);
    this.P(ctx, [[-0.5, -0.08], [-0.7, -0.31], [-0.82, -0.31], [-0.82, -0.07]], B);
    this.band(ctx, C, -0.81, -0.3, 0.13, 0.05);
    this.P(ctx, [[-0.9, -0.06], [-1.0, -0.045], [-1.0, 0.045], [-0.9, 0.055]], '#3c3833');
    this.roundel(ctx, C, -0.2, -0.04, 0.045);
    if (this.pass === 'fill') { const g = ctx.createRadialGradient(-1.01, 0, 0, -1.01, 0, 0.09); g.addColorStop(0, 'rgba(255,200,110,0.85)'); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(-1.01, 0, 0.09, 0, Math.PI * 2); ctx.fill(); }
  },
  // B-21 Raider (approx. 19 m long, 46 m span): tailless flying wing, straight swept leading edges, sawtooth
  // trailing edge, raised centre body with seamless cockpit windows and flush dorsal intakes. Drawn as a 3/4 view
  // from above (span compressed), because a flying wing is only a thin line in a pure side view.
  bomber(ctx, C) {
    const B = Col.adj(C.jet, -6), K = 0.1, ps = -0.12, cs = 0.99, sy = -0.05, se = 0.16;
    // Planform (u forward, v towards the viewer, h up, metres) -> unit space.
    const pr = (u, v, h = 0) => [(u * cs - v * ps) * K, ((u * ps + v * cs) * se - h * 0.95) * K + sy];
    const half = [[9.5, 0], [-6.6, 23], [-8.4, 22.4], [-4.8, 11.5], [-9.4, 5.5], [-8.4, 0]];
    const plan = (h) => [...half.map(([u, v]) => pr(u, v, h)), ...half.slice(1, -1).reverse().map(([u, v]) => pr(u, -v, h))];
    this.P(ctx, plan(-0.9), Col.adj(B, -22));
    this.P(ctx, plan(0), B);
    this.ln(ctx, ...pr(9.5, 0), ...pr(-6.6, 23), 'rgba(255,255,255,0.3)', 1.5);
    this.ln(ctx, ...pr(9.5, 0), ...pr(-6.6, -23), 'rgba(255,255,255,0.25)', 1.2);
    // Centre body hump.
    const hump = [];
    for (const [u, w, h] of [[8.4, 0.6, 0.6], [6, 3, 1.8], [2.5, 4.2, 2.3], [-2, 4.4, 2.1], [-5.5, 3, 1.2], [-7.4, 1, 0.3]]) hump.push(pr(u, w, h * 0.35));
    for (const [u, w, h] of [[-7.4, 1, 0.3], [-5.5, 3, 1.2], [-2, 4.4, 2.1], [2.5, 4.2, 2.3], [6, 3, 1.8], [8.4, 0.6, 0.6]]) hump.push(pr(u, -w * 0.4, h));
    this.S(ctx, hump, Col.adj(B, 5));
    // Cockpit windows and dorsal intakes.
    this.P(ctx, [pr(7.3, 0.2, 1.3), pr(5.8, 1.9, 1.9), pr(5.0, 1.6, 2.1), pr(6.4, 0, 1.8)], GLASS);
    this.P(ctx, [pr(7.3, -0.2, 1.3), pr(5.8, -1.9, 1.9), pr(5.0, -1.6, 2.1), pr(6.4, 0, 1.8)], GLASS);
    for (const s of [1, -1]) this.P(ctx, [pr(1.8, s * 2.2, 2.2), pr(0.8, s * 4.8, 1.5), pr(0.2, s * 4.6, 1.6), pr(1.2, s * 2.2, 2.3)], '#141719');
    this.glint(ctx, ...pr(6.4, 0.9, 1.8), 0.015);
    // Faction markings on the near wing.
    if (this.pass === 'fill') {
      ctx.fillStyle = C.accent;
      ctx.beginPath(); [pr(-2.2, 17, 0), pr(-3.4, 19.6, 0), pr(-5.0, 19.2, 0), pr(-3.8, 16.6, 0)].forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.fill();
      const [rx, ry] = pr(1, 10, 0);
      ctx.fillStyle = '#eef1f2'; ctx.beginPath(); ctx.ellipse(rx, ry, 0.05, 0.03, -0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.accent; ctx.beginPath(); ctx.ellipse(rx, ry, 0.031, 0.019, -0.15, 0, Math.PI * 2); ctx.fill();
    }
  },
});

// Western rotor animations (rotor heads match the reworked models).
Object.assign(Models.anim, {
  thelo(ctx, C, now) { Models.airRotor(ctx, now, 0.125, -0.44, 1.02, 13, 4); Models.airTail(ctx, now, -0.935, -0.37, 0.2, [0, Math.PI / 2, Math.PI, Math.PI * 1.5], true); },
  ahelo(ctx, C, now) { Models.airRotor(ctx, now, 0.052, -0.385, 0.93, 15, 4); Models.airTail(ctx, now, -0.93, -0.32, 0.18, [0, 0.96, Math.PI, Math.PI + 0.96]); },
});

// Eastern (E) models.
Object.assign(Models.mE, {
  // ---------- Helicopters ----------
  // Mi-8AMTSh Terminator (18.4 m fuselage, 21.3 m rotor, 5-blade): boxy cabin with round windows, multi-pane nose,
  // dust-protected intakes and IR exhaust screens on top, external fuel tank, outrigger pylons with rocket pods,
  // fixed tricycle gear, long boom with the tail rotor on the left.
  thelo(ctx, C) {
    const B = Col.adj(C.jet, -18), D = Col.adj(B, -10);
    this.P(ctx, [[-0.84, -0.08], [-0.95, -0.38], [-1.03, -0.4], [-1.04, -0.33], [-0.98, -0.06]], B);
    this.S(ctx, [[0.94, 0.09], [0.995, 0.0], [0.98, -0.09], [0.92, -0.17], [0.8, -0.215], [0.6, -0.225], [0.0, -0.225], [-0.35, -0.205], [-0.5, -0.145], [-0.85, -0.115], [-0.99, -0.105], [-0.99, -0.045], [-0.85, -0.045], [-0.55, -0.015], [-0.42, 0.1], [-0.35, 0.16], [0.0, 0.17], [0.7, 0.17], [0.86, 0.15]], B);
    // Engine deck: dust-protector intakes, exhaust screens, mast.
    this.S(ctx, [[0.72, -0.205], [0.66, -0.3], [0.55, -0.345], [0.0, -0.355], [-0.18, -0.325], [-0.28, -0.245], [-0.3, -0.205]], Col.adj(B, 5));
    this.E(ctx, 0.64, -0.285, 0.09, 0.05, Col.adj(B, 10));
    this.R(ctx, 0.71, -0.315, 0.035, 0.06, '#181b1b', null, 0.012);
    this.P(ctx, [[-0.04, -0.32], [-0.26, -0.315], [-0.32, -0.215], [-0.12, -0.22]], D);
    this.P(ctx, [[-0.24, -0.3], [-0.3, -0.29], [-0.33, -0.225], [-0.28, -0.23]], '#1a1d1d');
    this.R(ctx, 0.09, -0.45, 0.05, 0.11, C.dark, null, 0.01);
    // Glazed nose, armoured blister window, door and round cabin windows.
    this.P(ctx, [[0.985, -0.045], [0.95, -0.125], [0.86, -0.185], [0.74, -0.205], [0.72, -0.08], [0.86, -0.045]], GLASS);
    this.P(ctx, [[0.985, 0.0], [0.94, 0.07], [0.86, 0.07], [0.88, 0.0]], GLASS);
    this.ln(ctx, 0.9, -0.17, 0.9, -0.045, 'rgba(0,0,0,0.6)', 1.3); this.ln(ctx, 0.81, -0.2, 0.8, -0.05, 'rgba(0,0,0,0.6)', 1.3);
    this.glint(ctx, 0.86, -0.13);
    this.R(ctx, 0.6, -0.185, 0.09, 0.08, GLASS, null, 0.02);
    this.ln(ctx, 0.56, -0.2, 0.56, 0.15, 'rgba(0,0,0,0.5)'); this.ln(ctx, 0.43, -0.2, 0.43, 0.15, 'rgba(0,0,0,0.5)');
    for (const x of [0.495, 0.32, 0.18, 0.04, -0.1, -0.24]) this.O(ctx, x, -0.115, 0.033, GLASS);
    this.ln(ctx, -0.35, 0.15, -0.5, -0.12, 'rgba(0,0,0,0.5)');
    // Boom stabiliser, external tank, outrigger and rocket pods.
    this.P(ctx, [[-0.7, -0.07], [-0.88, -0.09], [-0.9, -0.05], [-0.72, -0.04]], Col.adj(B, 4));
    const tank = [[0.36, 0.0], [0.34, -0.035], [-0.08, -0.035], [-0.1, 0.0], [-0.1, 0.1], [-0.08, 0.13], [0.34, 0.13], [0.36, 0.1]];
    this.S(ctx, tank, Col.adj(B, 6)); this.airEdge(ctx, tank, true);
    this.R(ctx, -0.02, -0.02, 0.32, 0.026, C.dark, null, 0.01);
    this.L(ctx, 0.22, 0.0, 0.22, 0.12, C.dark, 0.018); this.L(ctx, 0.04, 0.0, 0.04, 0.12, C.dark, 0.018);
    this.R(ctx, -0.04, 0.115, 0.34, 0.075, '#4e5442', null, 0.037);
    this.O(ctx, 0.3, 0.1525, 0.03, '#2a2e26');
    // Gear and tail skid.
    this.L(ctx, 0.76, 0.14, 0.77, 0.24, C.dark, 0.02); this.wheel(ctx, 0.77, 0.25, 0.04);
    this.L(ctx, -0.1, 0.1, -0.16, 0.24, C.dark, 0.026); this.wheel(ctx, -0.16, 0.25, 0.055);
    this.L(ctx, -0.9, -0.05, -0.93, 0.03, C.dark, 0.016);
    this.band(ctx, C, -1.0, -0.33, 0.09, 0.055);
    this.roundel(ctx, C, -0.6, -0.065, 0.045);
  },
  // Ka-52M Alligator (13.5 m fuselage, two coaxial 3-blade rotors of 14.5 m, no tail rotor): radar nose, wide
  // side-by-side cockpit, GOES-451 sight ball, tall coaxial mast, stub wings with Vitebsk wingtip pods, Ataka tubes
  // and rocket pods, twin endplate fins on the tailplane plus central fin, gun on the right side.
  ahelo(ctx, C) {
    const B = Col.adj(C.jet, -24), D = Col.adj(B, -8);
    this.L(ctx, -0.05, 0.14, 0.62, 0.15, GUN, 0.026);
    this.P(ctx, [[-0.66, -0.08], [-0.8, -0.38], [-0.9, -0.39], [-0.91, -0.31], [-0.86, -0.06]], B);
    this.P(ctx, [[-0.79, 0.05], [-0.8, -0.18], [-0.88, -0.2], [-0.93, 0.06]], D);
    this.S(ctx, [[0.95, 0.06], [0.985, -0.02], [0.93, -0.085], [0.78, -0.125], [0.6, -0.225], [0.4, -0.275], [0.15, -0.275], [-0.1, -0.245], [-0.3, -0.145], [-0.6, -0.095], [-0.88, -0.075], [-0.88, 0.0], [-0.6, 0.02], [-0.3, 0.08], [-0.05, 0.155], [0.3, 0.165], [0.7, 0.145], [0.88, 0.11]], B);
    this.ln(ctx, 0.82, -0.11, 0.82, 0.12, 'rgba(0,0,0,0.45)');
    this.P(ctx, [[0.77, -0.115], [0.61, -0.225], [0.42, -0.265], [0.27, -0.255], [0.27, -0.115], [0.6, -0.1]], GLASS);
    this.ln(ctx, 0.5, -0.25, 0.5, -0.105, 'rgba(0,0,0,0.6)', 1.3); this.ln(ctx, 0.36, -0.26, 0.36, -0.11, 'rgba(0,0,0,0.6)', 1.3);
    this.glint(ctx, 0.6, -0.18); this.glint(ctx, 0.4, -0.22);
    this.O(ctx, 0.72, 0.18, 0.05, C.dark); this.O(ctx, 0.755, 0.175, 0.02, GLASS, null, { noLine: true });
    // Engines with exhaust boxes, coaxial mast.
    this.S(ctx, [[0.17, -0.245], [0.11, -0.305], [-0.12, -0.315], [-0.32, -0.255], [-0.34, -0.19], [-0.1, -0.17], [0.14, -0.18]], Col.adj(B, 7));
    this.O(ctx, 0.12, -0.25, 0.035, '#141716');
    this.P(ctx, [[-0.27, -0.26], [-0.43, -0.25], [-0.45, -0.18], [-0.3, -0.185]], D);
    this.R(ctx, 0.022, -0.585, 0.046, 0.3, C.dark, null, 0.01);
    this.R(ctx, -0.01, -0.5, 0.11, 0.035, Col.adj(C.dark, 8), null, 0.01);
    // Stub wing, wingtip pod, Ataka tubes, rocket pod.
    this.P(ctx, [[0.15, -0.02], [-0.22, -0.02], [-0.24, 0.015], [0.13, 0.015]], D);
    this.R(ctx, -0.17, -0.065, 0.27, 0.05, Col.adj(B, 4), null, 0.025);
    this.R(ctx, -0.14, 0.03, 0.3, 0.032, '#5c6345', null, 0.016);
    this.R(ctx, -0.1, 0.07, 0.24, 0.06, '#4a4f3c', null, 0.03);
    this.O(ctx, 0.14, 0.1, 0.024, '#2a2e26');
    // Tailplane with near endplate fin.
    this.P(ctx, [[-0.66, -0.05], [-0.9, -0.06], [-0.92, -0.02], [-0.68, -0.01]], Col.adj(B, 4));
    this.P(ctx, [[-0.82, 0.07], [-0.83, -0.16], [-0.9, -0.175], [-0.95, 0.08]], Col.adj(B, 6));
    this.band(ctx, C, -0.885, -0.33, 0.08, 0.055);
    this.roundel(ctx, C, -0.48, -0.05, 0.042);
  },

  // ---------- Fixed wing ----------
  // Il-76MD-90A (46.6 m long, 50.5 m span, 14.8 m high): shoulder wing with anhedral, four PS-90A engines on
  // pylons, glazed navigator nose under the cockpit with chin radar, long main gear fairings, T-tail, rear ramp.
  tplane(ctx, C) {
    const B = C.jet, D = Col.adj(B, -14);
    this.P(ctx, [[0.3, -0.15], [-0.16, -0.21], [-0.28, -0.21], [-0.14, -0.15]], D);
    this.P(ctx, [[-0.72, -0.5], [-0.92, -0.55], [-0.98, -0.55], [-0.93, -0.5]], D);
    this.P(ctx, [[-0.52, -0.12], [-0.76, -0.5], [-0.92, -0.51], [-0.96, -0.07]], B);
    this.E(ctx, -0.86, -0.505, 0.1, 0.022, Col.adj(B, 4));
    this.P(ctx, [[-0.72, -0.5], [-0.97, -0.45], [-1.05, -0.45], [-0.94, -0.5]], Col.adj(B, 4));
    this.S(ctx, [[1.0, 0.04], [0.99, -0.02], [0.94, -0.08], [0.86, -0.13], [0.76, -0.155], [0.4, -0.16], [-0.3, -0.16], [-0.55, -0.13], [-0.8, -0.085], [-0.98, -0.05], [-1.0, -0.02], [-0.96, 0.0], [-0.75, 0.03], [-0.5, 0.1], [-0.35, 0.145], [0.6, 0.15], [0.82, 0.14], [0.94, 0.1]], B);
    // Chin radar and glazed navigator station.
    this.S(ctx, [[0.95, 0.07], [0.9, 0.15], [0.74, 0.17], [0.66, 0.13], [0.7, 0.06]], Col.adj(B, -4));
    this.P(ctx, [[1.0, 0.02], [0.985, -0.03], [0.93, -0.055], [0.86, -0.05], [0.84, 0.03], [0.93, 0.06]], GLASS);
    this.ln(ctx, 0.95, -0.05, 0.95, 0.05, 'rgba(0,0,0,0.6)', 1.2); this.ln(ctx, 0.9, -0.055, 0.9, 0.05, 'rgba(0,0,0,0.6)', 1.2);
    this.P(ctx, [[0.92, -0.085], [0.88, -0.12], [0.8, -0.14], [0.78, -0.115], [0.84, -0.08]], GLASS);
    this.glint(ctx, 0.95, -0.02, 0.015);
    // Main gear fairings.
    this.S(ctx, [[0.26, 0.11], [0.2, 0.19], [-0.32, 0.19], [-0.38, 0.11]], Col.adj(B, -8));
    this.ln(ctx, -0.06, 0.12, -0.06, 0.185);
    this.P(ctx, [[0.33, -0.155], [0.26, -0.19], [-0.16, -0.185], [-0.26, -0.155]], B);
    this.ln(ctx, -0.36, 0.14, -0.78, 0.02, 'rgba(0,0,0,0.5)');
    // Near wing (anhedral: tip lower) with two engines.
    this.airWing(ctx, [[0.35, -0.15], [-0.17, 0.12], [-0.29, 0.12], [-0.14, -0.14]], B);
    this.airPod(ctx, Col.adj(B, -3), 0.31, 0.05, 0.01, 0.062, -0.075);
    this.airPod(ctx, Col.adj(B, -3), 0.16, -0.1, 0.11, 0.062, 0.02);
    this.band(ctx, C, -0.85, -0.4, 0.11, 0.06);
    this.roundel(ctx, C, 0.55, -0.04, 0.05);
  },
  // Su-35S (21.9 m long, 15.3 m span, 5.9 m high): long nose and bubble canopy, raised spine to the tail sting,
  // separate engine nacelles with rectangular intakes, LERX, twin fins and small ventral fins, two AL-41F1S
  // thrust-vectoring nozzles, two-tone blue-grey splinter scheme.
  jet(ctx, C) {
    const B = C.jet, D = Col.adj(B, -14);
    this.P(ctx, [[-0.5, -0.08], [-0.66, -0.37], [-0.76, -0.37], [-0.78, -0.08]], D);
    this.P(ctx, [[-0.6, -0.03], [-0.86, -0.1], [-0.96, -0.1], [-0.94, -0.03]], D);
    this.P(ctx, [[0.25, -0.02], [-0.42, -0.14], [-0.54, -0.14], [-0.56, -0.02]], D);
    this.R(ctx, -0.96, -0.035, 0.12, 0.07, '#5f5244', null, 0.02);
    this.S(ctx, [[0.34, 0.0], [0.34, 0.1], [0.24, 0.115], [-0.7, 0.105], [-0.86, 0.09], [-0.86, 0.0], [-0.4, -0.02]], Col.adj(B, -6));
    this.P(ctx, [[0.355, 0.0], [0.355, 0.105], [0.28, 0.11], [0.28, 0.0]], '#141a1e');
    this.P(ctx, [[-0.5, 0.09], [-0.58, 0.17], [-0.64, 0.17], [-0.63, 0.09]], D);
    this.airSplinter(ctx, [[1.07, 0.0], [0.96, -0.03], [0.8, -0.06], [0.6, -0.08], [0.45, -0.1], [0.2, -0.115], [-0.2, -0.1], [-0.6, -0.07], [-0.85, -0.05], [-1.04, -0.03], [-1.04, 0.0], [-0.85, 0.01], [-0.4, 0.03], [0.3, 0.04], [0.7, 0.04], [0.9, 0.03]], B, true);
    // Radome seam, canopy.
    this.ln(ctx, 0.84, -0.05, 0.84, 0.035, 'rgba(0,0,0,0.5)');
    this.S(ctx, [[0.68, -0.075], [0.57, -0.155], [0.45, -0.175], [0.34, -0.155], [0.3, -0.11], [0.5, -0.085]], GLASS);
    this.ln(ctx, 0.42, -0.17, 0.4, -0.095, 'rgba(0,0,0,0.6)', 1.2);
    this.glint(ctx, 0.52, -0.145);
    // Nozzles (near one lower), near wing with LERX and wingtip missile, near tailplane and fin.
    this.R(ctx, -0.99, 0.01, 0.14, 0.08, '#6a5a48', null, 0.025);
    this.ln(ctx, -0.95, 0.015, -0.95, 0.085, 'rgba(0,0,0,0.45)');
    this.P(ctx, [[0.66, 0.05], [0.25, 0.065], [-0.42, 0.24], [-0.54, 0.24], [-0.58, 0.065]], Col.adj(B, -28));
    this.airSplinter(ctx, [[0.66, 0.03], [0.25, 0.045], [-0.42, 0.22], [-0.54, 0.22], [-0.58, 0.045]], B);
    this.R(ctx, -0.6, 0.21, 0.22, 0.022, '#d8dcd8', null, 0.011);
    this.P(ctx, [[-0.62, 0.07], [-0.87, 0.16], [-1.01, 0.16], [-0.95, 0.07]], Col.adj(B, -28));
    this.airSplinter(ctx, [[-0.62, 0.05], [-0.87, 0.145], [-1.01, 0.145], [-0.95, 0.05]], B);
    this.airSplinter(ctx, [[-0.55, -0.06], [-0.7, -0.345], [-0.8, -0.345], [-0.83, -0.05]], B);
    this.band(ctx, C, -0.8, -0.33, 0.12, 0.05);
    this.roundel(ctx, C, 0.1, 0.0, 0.04);
  },
  // Tu-160M (54.1 m long, 13.1 m high): white swing-wing bomber (wings swept 65° in flight), long pointed nose
  // with refuelling probe, blended wing glove, NK-32-02 engines paired in two nacelles under the glove,
  // tall fin with all-moving upper section and mid-mounted tailplane.
  bomber(ctx, C) {
    const B = '#e3e7e9', D = Col.adj(B, -16);
    this.P(ctx, [[-0.72, -0.28], [-0.9, -0.33], [-0.96, -0.33], [-0.92, -0.28]], D);
    this.P(ctx, [[0.05, -0.04], [-0.64, -0.13], [-0.72, -0.13], [-0.16, -0.04]], D);
    this.P(ctx, [[-0.55, -0.05], [-0.78, -0.5], [-0.9, -0.5], [-0.98, -0.03]], B);
    this.ln(ctx, -0.67, -0.29, -0.93, -0.29, 'rgba(0,0,0,0.4)');
    this.L(ctx, 0.88, -0.035, 1.05, -0.03, '#3a3d3b', 0.012);
    this.S(ctx, [[1.0, 0.0], [0.94, -0.02], [0.82, -0.045], [0.66, -0.065], [0.56, -0.08], [0.4, -0.085], [0.0, -0.075], [-0.5, -0.06], [-0.85, -0.05], [-1.02, -0.035], [-1.02, -0.01], [-0.85, 0.0], [-0.4, 0.02], [0.2, 0.035], [0.6, 0.03], [0.85, 0.02], [0.95, 0.01]], B);
    this.ln(ctx, 0.9, -0.03, 0.9, 0.012, 'rgba(0,0,0,0.4)');
    this.P(ctx, [[0.68, -0.06], [0.64, -0.08], [0.56, -0.085], [0.56, -0.065]], GLASS);
    // Near wing (swept) behind the nacelle pair, wing glove.
    this.airWing(ctx, [[0.06, 0.02], [-0.7, 0.21], [-0.79, 0.21], [-0.2, 0.03]], Col.adj(B, -10), 0.018);
    this.P(ctx, [[0.52, 0.015], [0.08, 0.045], [-0.22, 0.04], [0.0, 0.0]], Col.adj(B, 2));
    // Nacelle: two engines side by side, so the inner nozzle shows above and behind the outer one.
    this.R(ctx, -0.72, 0.035, 0.12, 0.045, '#3c3c38', null, 0.02);
    this.S(ctx, [[0.18, 0.02], [0.16, 0.13], [0.05, 0.14], [-0.5, 0.135], [-0.62, 0.115], [-0.62, 0.035], [-0.4, 0.02]], Col.adj(B, -6));
    this.P(ctx, [[0.19, 0.02], [0.12, 0.02], [0.11, 0.135], [0.17, 0.135]], '#1d201c');
    this.ln(ctx, -0.1, 0.03, -0.1, 0.13); this.ln(ctx, -0.35, 0.03, -0.35, 0.13);
    this.R(ctx, -0.74, 0.08, 0.13, 0.05, '#34342f', null, 0.02);
    this.P(ctx, [[-0.55, -0.27], [-0.94, -0.22], [-1.02, -0.22], [-0.9, -0.27]], Col.adj(B, -3));
    this.band(ctx, C, -0.89, -0.46, 0.08, 0.1);
    this.roundel(ctx, C, 0.32, -0.03, 0.04);
  },
});

// Eastern rotor animations.
Object.assign(Models.animE, {
  thelo(ctx, C, now) { Models.airRotor(ctx, now, 0.115, -0.45, 1.1, 12, 5); Models.airTail(ctx, now, -1.0, -0.33, 0.19, [0, Math.PI * 2 / 3, Math.PI * 4 / 3]); },
  // Coaxial: two counter-rotating rotor discs on one mast, no tail rotor.
  ahelo(ctx, C, now) { Models.airRotor(ctx, now, 0.045, -0.4, 0.99, 14, 3, 1); Models.airRotor(ctx, now, 0.045, -0.585, 0.99, 14, 3, -1); },
});

// ---------- Added after Beta 1.0: reconnaissance drones ----------
Object.assign(Models.m, {
  // MQ-9B (11.7 m long, 24 m span): slim fuselage with the satcom bulge behind the nose, sensor ball under the
  // chin, very long straight wings, V-tail with ventral fin, pusher propeller at the tail (animated).
  uav(ctx, C) {
    const B = Col.adj(C.jet, 4), D = Col.adj(B, -14);
    this.P(ctx, [[0.16, -0.04], [0.07, -0.36], [-0.04, -0.36], [-0.07, -0.04]], D);
    this.P(ctx, [[-0.6, -0.03], [-0.76, -0.27], [-0.85, -0.27], [-0.8, -0.03]], D);
    this.P(ctx, [[-0.64, 0.04], [-0.76, 0.2], [-0.83, 0.2], [-0.8, 0.04]], D);
    this.S(ctx, [[0.88, 0.0], [0.82, -0.06], [0.62, -0.11], [0.3, -0.09], [-0.2, -0.06], [-0.76, -0.035], [-0.86, 0.0], [-0.76, 0.035], [-0.2, 0.06], [0.3, 0.075], [0.62, 0.07], [0.82, 0.05]], B);
    this.E(ctx, 0.56, -0.08, 0.2, 0.05, B);
    this.ln(ctx, 0.84, 0.0, -0.8, 0.0, 'rgba(255,255,255,0.14)');
    this.O(ctx, 0.62, 0.1, 0.055, '#2a2e30'); this.O(ctx, 0.65, 0.1, 0.03, GLASS); this.glint(ctx, 0.66, 0.09, 0.01);
    this.airWing(ctx, [[0.17, 0.02], [0.02, 0.38], [-0.1, 0.38], [-0.07, 0.02]], B);
    this.R(ctx, -0.02, 0.16, 0.12, 0.03, '#4a5054', null, 0.01);
    this.band(ctx, C, -0.83, -0.25, 0.09, 0.05);
    this.roundel(ctx, C, -0.3, -0.01, 0.04);
  },
});
Object.assign(Models.mE, {
  // Orion / Inokhodets (8 m long, 16 m span): rounder fuselage, wing on top, sensor ball further forward, plain
  // V-tail without ventral fin, pusher propeller. Russian air grey.
  uav(ctx, C) {
    const B = C.jet, D = Col.adj(B, -14);
    this.P(ctx, [[0.14, -0.07], [0.06, -0.38], [-0.05, -0.38], [-0.08, -0.07]], D);
    this.P(ctx, [[-0.56, -0.03], [-0.74, -0.3], [-0.84, -0.3], [-0.78, -0.03]], D);
    this.S(ctx, [[0.84, 0.0], [0.78, -0.07], [0.5, -0.1], [0.1, -0.09], [-0.3, -0.06], [-0.76, -0.03], [-0.86, 0.0], [-0.76, 0.04], [-0.3, 0.07], [0.1, 0.09], [0.5, 0.085], [0.78, 0.055]], B);
    this.ln(ctx, 0.8, 0.0, -0.8, 0.0, 'rgba(255,255,255,0.14)');
    this.O(ctx, 0.7, 0.1, 0.05, '#2a2e30'); this.O(ctx, 0.73, 0.1, 0.028, GLASS); this.glint(ctx, 0.74, 0.09, 0.01);
    this.airWing(ctx, [[0.15, -0.04], [0.02, 0.36], [-0.1, 0.36], [-0.08, -0.04]], B);
    this.band(ctx, C, -0.82, -0.28, 0.09, 0.05);
    this.roundel(ctx, C, -0.3, 0.0, 0.04);
  },
});
// Pusher propeller: a blade seen edge-on that sweeps up and down, over a faint disc.
Models.uavProp = function (ctx, now, x) {
  ctx.beginPath(); ctx.ellipse(x, 0, 0.025, 0.15, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(215,225,232,0.22)'; ctx.fill();
  const k = Math.sin(now * 40) * 0.15;
  ctx.strokeStyle = 'rgba(25,28,30,0.85)'; ctx.lineWidth = 0.03; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, -k); ctx.lineTo(x, k); ctx.stroke();
};
Object.assign(Models.anim, { uav(ctx, C, now) { Models.uavProp(ctx, now, -0.89); } });
Object.assign(Models.animE, { uav(ctx, C, now) { Models.uavProp(ctx, now, -0.89); } });
