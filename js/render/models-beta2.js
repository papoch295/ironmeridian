// Models of the units added in Beta 2 (ROADMAP 3.1) for both factions: command post, electronic warfare vehicle,
// coastal missile battery, marines, ground-attack aircraft, stealth fighter, AWACS and frigate.
// Drawn with the helpers in models.js, models-air.js (air*) and models-sea.js (sea*); load this file after them.
'use strict';

// ---------- Shared helpers ----------
Object.assign(Models, {
  // BTR-80 family hull (7.65 m, 8x8) without a turret: boat-shaped bow, sloped upper hull, side door between axles 2 and 3.
  btrHull(ctx, C) {
    this.P(ctx, [[-0.82, 0.11], [-0.92, -0.04], [-0.88, -0.2], [-0.82, -0.22], [0.3, -0.22], [0.92, -0.01], [0.9, 0.04], [0.72, 0.12]], C.body);
    this.topFace(ctx, C, -0.84, 0.32, -0.22, 0.024);
    this.P(ctx, [[0.3, -0.22], [0.33, -0.242], [0.93, -0.027], [0.92, -0.01]], Col.adj(C.body, 9));
    this.ln(ctx, -0.9, -0.05, 0.9, -0.03, 'rgba(0,0,0,0.45)');
    this.R(ctx, 0.36, -0.215, 0.1, 0.035, C.dark, null, 0.005); this.R(ctx, 0.38, -0.205, 0.06, 0.015, GLASS, null, 0.003);
    this.P(ctx, [[0.0, -0.16], [0.13, -0.16], [0.13, -0.04], [0.0, -0.04]], C.dark);
    this.O(ctx, -0.88, 0.02, 0.03, '#1d201b', null, { noLine: true });
    if (this.pass === 'fill') for (const x of [0.6, 0.29, -0.17, -0.48]) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(x, 0.17, 0.15, Math.PI, 0); ctx.fill(); }
    this.wheels(ctx, [0.6, 0.29, -0.17, -0.48], 0.135);
    this.bolts(ctx, -0.8, 0.24, -0.17, 12);
    this.light(ctx, 0.84, -0.02);
  },
  // Heavy Eastern 8x8 truck (MZKT / BAZ, about 13 m): chassis rail, long crew cab at the front; body() draws the
  // superstructure between cab and wheels.
  truck8E(ctx, C, body) {
    this.R(ctx, -0.9, 0.03, 1.8, 0.045, C.dark, null, 0.01);
    this.P(ctx, [[0.42, 0.08], [0.42, -0.24], [0.46, -0.27], [0.86, -0.27], [0.91, -0.22], [0.94, -0.06], [0.95, 0.08]], C.body);
    this.topFace(ctx, C, 0.46, 0.86, -0.27, 0.022);
    this.P(ctx, [[0.8, -0.24], [0.88, -0.22], [0.9, -0.12], [0.8, -0.12]], GLASS);
    this.R(ctx, 0.48, -0.23, 0.12, 0.08, GLASS, null, 0.01); this.R(ctx, 0.64, -0.23, 0.12, 0.08, GLASS, null, 0.01);
    this.ln(ctx, 0.62, -0.26, 0.62, 0.04); this.ln(ctx, 0.78, -0.26, 0.78, 0.04);
    this.R(ctx, 0.9, -0.05, 0.06, 0.1, C.dark, null, 0.01);
    body.call(this);
    if (this.pass === 'fill') for (const x of [0.62, 0.34, -0.22, -0.5]) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x, 0.18, 0.135, Math.PI, 0); ctx.fill(); }
    this.wheels(ctx, [0.62, 0.34, -0.22, -0.5], 0.125);
    this.mirror(ctx, 0.93, -0.16);
    this.light(ctx, 0.93, -0.01);
  },
  // Parabolic dish seen from the side, facing forward and up, on a pedestal standing at (x, y).
  dish(ctx, C, x, y, r, h) {
    this.L(ctx, x, y, x, y - h, C.dark, 0.035);
    ctx.save(); ctx.translate(x, y - h); ctx.rotate(-0.5);
    this.S(ctx, [[-0.02, -r], [r * 0.42, -r * 0.62], [r * 0.5, 0], [r * 0.42, r * 0.62], [-0.02, r], [r * 0.12, 0]], Col.adj(C.body, 6));
    this.L(ctx, r * 0.12, 0, r * 0.75, 0, C.dark, 0.012);
    this.O(ctx, r * 0.78, 0, 0.018, C.dark, null, { noLine: true });
    ctx.restore();
  },
  // Strip of shallow surf under a squad that has just come ashore.
  surf(ctx) {
    this.E(ctx, 0, 0.3, 0.72, 0.03, '#49758e', { noLine: true, flat: true });
    if (this.pass === 'out' || this.small) return;
    ctx.strokeStyle = 'rgba(232,244,250,0.65)'; ctx.lineWidth = this.lw * 1.4; ctx.beginPath();
    for (const [a, b] of [[-0.6, -0.36], [-0.22, 0.1], [0.26, 0.56]]) { ctx.moveTo(a, 0.298); ctx.quadraticCurveTo((a + b) / 2, 0.278, b, 0.298); }
    ctx.stroke();
  },
});

// ---------- West ----------
Object.assign(Models.m, {
  // M1130 Stryker Commander's Vehicle: ICV hull with a raised command roof, satcom dome, several whip antennas,
  // rolled camouflage net and tent extension stowed on the roof.
  hq(ctx, C) {
    this.stryker(ctx, C);
    this.P(ctx, [[-0.86, -0.262], [-0.84, -0.335], [-0.12, -0.335], [-0.06, -0.262]], C.body);
    this.topFace(ctx, C, -0.84, -0.12, -0.335, 0.02);
    for (const x of [-0.7, -0.52, -0.34]) this.R(ctx, x, -0.318, 0.1, 0.028, GLASS, null, 0.005);
    this.R(ctx, -0.5, -0.375, 0.06, 0.04, C.dark, null, 0.006);
    this.O(ctx, -0.47, -0.41, 0.05, '#c6cac2');
    this.net(ctx, -0.02, -0.308, 0.3);
    this.hatch(ctx, C, 0.3, -0.265, 0.1);
    this.R(ctx, -0.26, -0.375, 0.1, 0.04, Col.adj(C.dark, 6), null, 0.006);
    this.bolts(ctx, -0.84, 0.28, -0.17, 12);
    this.light(ctx, 0.86, -0.06);
    this.mark(ctx, -0.72, -0.07, 'HQ 6', 0.05);
    this.exhaust(ctx, 0.5, -0.215, 0.07, 0.03);
    this.antenna(ctx, -0.8, -0.335, 0.5, -0.1); this.antenna(ctx, -0.64, -0.335, 0.6, -0.03); this.antenna(ctx, -0.18, -0.335, 0.46, 0.05);
    this.pennant(ctx, C, 0.14, -0.265, 0.34);
  },
  // TLS-BCT (Terrestrial Layer System) on Stryker: raised sensor mast with direction-finding dipoles, jammer panel,
  // roof-mounted antenna boxes and a small dome.
  ew(ctx, C) {
    this.stryker(ctx, C);
    this.R(ctx, -0.3, -0.305, 0.36, 0.045, C.dark, null, 0.008);
    this.O(ctx, 0.16, -0.31, 0.045, '#c6cac2');
    this.R(ctx, -0.6, -0.31, 0.2, 0.05, Col.adj(C.dark, 6), null, 0.008);
    this.L(ctx, -0.5, -0.3, -0.5, -0.84, C.dark, 0.03);
    this.L(ctx, -0.5, -0.56, -0.5, -0.84, Col.adj(C.dark, 8), 0.02);
    for (const [y, w] of [[-0.82, 0.13], [-0.74, 0.11], [-0.66, 0.09]]) { this.L(ctx, -0.5 - w, y, -0.5 + w, y, '#1b1d1a', 0.012); this.O(ctx, -0.5 - w, y, 0.012, '#1b1d1a', null, { noLine: true }); this.O(ctx, -0.5 + w, y, 0.012, '#1b1d1a', null, { noLine: true }); }
    this.R(ctx, -0.57, -0.52, 0.14, 0.09, Col.adj(C.body, -6), null, 0.008);
    this.ln(ctx, -0.5, -0.52, -0.5, -0.43);
    this.bolts(ctx, -0.84, 0.28, -0.17, 12);
    this.light(ctx, 0.86, -0.06);
    this.mark(ctx, -0.72, -0.07, 'E31', 0.05);
    this.exhaust(ctx, 0.5, -0.215, 0.07, 0.03);
    this.antenna(ctx, -0.8, -0.24, 0.4, -0.08); this.antenna(ctx, 0.3, -0.24, 0.36, 0.05);
    this.pennant(ctx, C, -0.2, -0.305, 0.3);
  },
  // NMESIS: unmanned JLTV-based ROGUE Fires carrier (no cab, sensor pod on the bonnet) with a launcher for two
  // Naval Strike Missile canisters, raised for firing.
  coast(ctx, C) {
    this.R(ctx, -0.82, 0.02, 1.66, 0.05, C.dark, null, 0.01);
    this.P(ctx, [[-0.84, 0.04], [-0.85, -0.1], [0.28, -0.1], [0.34, -0.22], [0.62, -0.22], [0.8, -0.12], [0.88, -0.04], [0.88, 0.05]], C.body);
    this.topFace(ctx, C, 0.34, 0.62, -0.22, 0.02);
    this.ln(ctx, 0.3, -0.1, 0.3, 0.04); this.ln(ctx, -0.84, -0.03, 0.3, -0.03, 'rgba(0,0,0,0.4)');
    for (let x = 0.4; x <= 0.58; x += 0.045) this.ln(ctx, x, -0.19, x, -0.12);
    this.R(ctx, 0.44, -0.285, 0.13, 0.065, C.dark, null, 0.01); this.R(ctx, 0.535, -0.272, 0.03, 0.04, GLASS, null, 0.005);
    this.glint(ctx, 0.55, -0.26, 0.008);
    this.R(ctx, -0.7, -0.15, 0.62, 0.055, C.dark, null, 0.008);
    this.L(ctx, -0.22, -0.13, -0.06, -0.4, GUN, 0.028);
    ctx.save(); ctx.translate(-0.7, -0.16); ctx.rotate(-0.42);
    for (const y of [-0.125, -0.25]) {
      this.R(ctx, 0, y, 0.98, 0.115, Col.adj(C.body, -5), null, 0.012);
      this.R(ctx, 0.95, y - 0.006, 0.04, 0.127, C.dark, null, 0.008);
      this.R(ctx, -0.02, y - 0.006, 0.04, 0.127, C.dark, null, 0.008);
      for (const x of [0.24, 0.48, 0.72]) this.ln(ctx, x, y, x, y + 0.115);
    }
    this.R(ctx, 0.1, -0.012, 0.8, 0.03, C.dark, null, 0.006);
    ctx.restore();
    if (this.pass === 'fill') for (const x of [0.58, -0.52]) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(x, 0.15, 0.18, Math.PI, 0); ctx.fill(); }
    this.wheels(ctx, [0.58, -0.52], 0.16);
    this.light(ctx, 0.86, -0.03);
    this.mark(ctx, -0.14, -0.065, 'NSM', 0.045);
    this.antenna(ctx, 0.38, -0.22, 0.4, 0.04);
    this.pennant(ctx, C, 0.7, -0.17, 0.3);
  },
  // US Marine rifle squad coming ashore: MARPAT woodland utilities, coyote plate carriers and packs.
  marine(ctx, C) {
    this.surf(ctx);
    this.squad(ctx, { ...C, cloth: '#646a4c', gear: '#6f6046', skin2: '#6e7052' }, { pack: '#6a5b40' });
    this.pennant(ctx, C, 0.62, 0.3, 0.78);
  },

  // A-10C Thunderbolt II (16.3 m long, 17.5 m span, 4.5 m high): straight low wing, bubble canopy far forward,
  // two TF34 turbofans in pods high on the rear fuselage, twin fins on the tailplane tips, GAU-8 in the nose,
  // main gear pods and Mavericks under the wing.
  cas(ctx, C) {
    const B = C.jet, D = Col.adj(B, -13);
    this.P(ctx, [[0.24, -0.07], [0.14, -0.27], [0.0, -0.27], [-0.1, -0.07]], D);
    this.P(ctx, [[-0.8, -0.05], [-0.84, -0.31], [-0.96, -0.31], [-0.99, -0.05]], D);
    this.R(ctx, -0.5, -0.3, 0.4, 0.15, D, null, 0.07);
    this.S(ctx, [[0.98, 0.02], [0.9, -0.05], [0.74, -0.09], [0.5, -0.1], [0.0, -0.09], [-0.6, -0.07], [-0.9, -0.05], [-0.96, -0.01], [-0.9, 0.03], [-0.5, 0.07], [0.2, 0.09], [0.7, 0.085], [0.9, 0.06]], B);
    this.S(ctx, [[0.76, -0.085], [0.67, -0.17], [0.53, -0.195], [0.42, -0.165], [0.36, -0.1], [0.56, -0.09]], GLASS);
    this.ln(ctx, 0.56, -0.19, 0.55, -0.095, 'rgba(0,0,0,0.6)', 1.2);
    this.glint(ctx, 0.6, -0.16);
    this.L(ctx, 0.9, 0.045, 1.05, 0.05, GUN, 0.022);
    this.ln(ctx, 0.86, -0.06, 0.86, 0.06, 'rgba(0,0,0,0.45)'); this.ln(ctx, 0.3, -0.095, 0.3, 0.085); this.ln(ctx, -0.3, -0.08, -0.3, 0.06); this.ln(ctx, 0.9, 0.0, -0.9, -0.01, 'rgba(255,255,255,0.12)');
    // Near engine pod on its pylon, tailplane with the near fin.
    this.P(ctx, [[-0.42, -0.1], [-0.2, -0.1], [-0.22, -0.065], [-0.4, -0.065]], D);
    this.R(ctx, -0.54, -0.26, 0.44, 0.16, Col.adj(B, 2), null, 0.075);
    this.E(ctx, -0.115, -0.18, 0.022, 0.07, '#1b1e1f', { noLine: true });
    this.P(ctx, [[-0.53, -0.235], [-0.6, -0.215], [-0.6, -0.145], [-0.53, -0.125]], '#3a3a36');
    this.ln(ctx, -0.3, -0.26, -0.3, -0.1); this.ln(ctx, -0.16, -0.25, -0.16, -0.11);
    this.P(ctx, [[-0.7, -0.035], [-0.99, -0.04], [-1.0, -0.012], [-0.72, -0.005]], Col.adj(B, 4));
    this.P(ctx, [[-0.78, -0.02], [-0.83, -0.28], [-0.95, -0.28], [-0.98, -0.02]], B);
    this.band(ctx, C, -0.93, -0.25, 0.09, 0.045);
    // Near wing, gear pod, Maverick rails.
    this.airWing(ctx, [[0.26, 0.03], [0.14, 0.31], [-0.02, 0.31], [-0.12, 0.04]], B);
    this.R(ctx, 0.0, 0.11, 0.22, 0.045, D, null, 0.02);
    for (const y of [0.19, 0.25]) { this.R(ctx, 0.02, y, 0.16, 0.024, '#d5d9d6', null, 0.012); this.R(ctx, 0.0, y + 0.002, 0.03, 0.02, '#3a3d3b', null, 0.004, { noLine: true }); }
    this.roundel(ctx, C, -0.52, -0.005, 0.04);
  },
  // F-22A Raptor (18.9 m long, 13.6 m span, 5.1 m high): chined nose, large canopy, caret intakes, diamond wing,
  // big outward-canted twin fins, flat thrust-vectoring nozzles.
  sjet(ctx, C) {
    const B = Col.adj(C.jet, -8), D = Col.adj(B, -11);
    this.P(ctx, [[-0.42, -0.1], [-0.6, -0.41], [-0.78, -0.41], [-0.82, -0.1]], D);
    this.P(ctx, [[-0.58, -0.04], [-0.86, -0.13], [-0.99, -0.13], [-0.94, -0.04]], D);
    this.P(ctx, [[0.3, -0.05], [-0.22, -0.19], [-0.44, -0.19], [-0.46, -0.05]], D);
    this.S(ctx, [[1.06, 0.01], [0.95, -0.02], [0.78, -0.06], [0.6, -0.1], [0.38, -0.125], [0.05, -0.13], [-0.35, -0.11], [-0.75, -0.08], [-0.92, -0.065], [-0.94, 0.045], [-0.7, 0.07], [-0.3, 0.105], [0.2, 0.105], [0.5, 0.08], [0.78, 0.05], [0.95, 0.035]], B);
    this.ln(ctx, 1.0, 0.0, -0.88, 0.0, 'rgba(255,255,255,0.12)');
    this.P(ctx, [[0.42, -0.07], [0.36, 0.05], [0.18, 0.06], [0.2, -0.08]], '#1b1f22');
    this.S(ctx, [[0.76, -0.065], [0.63, -0.155], [0.46, -0.195], [0.3, -0.18], [0.2, -0.125], [0.3, -0.105], [0.56, -0.09]], GLASS);
    if (this.pass === 'fill') { const p = this.airPath([[0.76, -0.065], [0.63, -0.155], [0.46, -0.195], [0.3, -0.18], [0.2, -0.125], [0.3, -0.105], [0.56, -0.09]], true); const g = ctx.createLinearGradient(0.3, -0.19, 0.62, -0.07); g.addColorStop(0, 'rgba(214,176,96,0.3)'); g.addColorStop(1, 'rgba(214,176,96,0)'); ctx.fillStyle = g; ctx.fill(p); }
    this.glint(ctx, 0.46, -0.16);
    this.ln(ctx, 0.86, -0.045, 0.86, 0.04, 'rgba(0,0,0,0.45)'); this.ln(ctx, 0.14, 0.06, -0.34, 0.075, 'rgba(0,0,0,0.4)');
    this.ln(ctx, -0.28, -0.11, -0.3, 0.1); this.ln(ctx, -0.64, -0.085, -0.64, 0.07);
    this.airWing(ctx, [[0.32, 0.02], [-0.24, 0.23], [-0.46, 0.23], [-0.48, 0.02]], B);
    this.airWing(ctx, [[-0.6, 0.03], [-0.88, 0.14], [-1.02, 0.14], [-0.95, 0.03]], B, 0.016);
    this.P(ctx, [[-0.48, -0.08], [-0.68, -0.37], [-0.86, -0.37], [-0.88, -0.07]], B);
    this.band(ctx, C, -0.85, -0.35, 0.14, 0.045);
    this.P(ctx, [[-0.92, -0.055], [-1.03, -0.03], [-1.03, 0.03], [-0.92, 0.05]], '#3c3a36');
    this.roundel(ctx, C, -0.18, -0.04, 0.042);
  },
  // E-3G Sentry (46.6 m long, 44.4 m span, 12.6 m high, Boeing 707 airframe): low swept wing with four engines,
  // conventional tail, 9.1 m rotodome on two struts above the rear fuselage.
  awacs(ctx, C) {
    const B = C.jet, D = Col.adj(B, -14);
    this.P(ctx, [[0.3, -0.07], [-0.14, -0.24], [-0.27, -0.24], [-0.08, -0.07]], D);
    this.P(ctx, [[-0.7, -0.07], [-0.92, -0.17], [-1.0, -0.17], [-0.9, -0.07]], D);
    this.P(ctx, [[-0.6, -0.08], [-0.82, -0.47], [-0.94, -0.47], [-0.93, -0.06]], B);
    this.L(ctx, -0.9, -0.47, -1.0, -0.5, '#3a3d3b', 0.012);
    this.S(ctx, [[1.0, 0.02], [0.97, -0.04], [0.9, -0.08], [0.78, -0.095], [0.4, -0.1], [-0.4, -0.095], [-0.75, -0.08], [-0.98, -0.045], [-1.0, -0.015], [-0.95, 0.01], [-0.7, 0.05], [-0.4, 0.085], [0.6, 0.095], [0.86, 0.085], [0.96, 0.06]], B);
    this.P(ctx, [[0.955, -0.045], [0.91, -0.075], [0.85, -0.085], [0.83, -0.06], [0.88, -0.04]], GLASS);
    this.seaWin(ctx, 0.74, -0.6, -0.035, 4, 0.016, 0.012, 'rgba(18,30,38,0.8)');
    for (const x of [0.7, 0.42, -0.5]) this.ln(ctx, x, -0.095, x, 0.088, 'rgba(0,0,0,0.22)');
    this.R(ctx, 0.62, -0.035, 0.045, 0.1, Col.adj(B, -3), null, 0.01);
    this.ln(ctx, 0.95, 0.0, -0.95, -0.005, 'rgba(255,255,255,0.12)'); this.ln(ctx, 0.9, -0.07, 0.9, 0.07, 'rgba(0,0,0,0.4)');
    // Rotodome: two struts, dark disc with the white dielectric band.
    this.L(ctx, -0.28, -0.09, -0.3, -0.27, D, 0.03); this.L(ctx, -0.46, -0.09, -0.44, -0.27, D, 0.03);
    this.E(ctx, -0.37, -0.29, 0.27, 0.047, '#2b2f31');
    this.E(ctx, -0.37, -0.29, 0.1, 0.047, '#d5d9da', { noLine: true });
    // Near wing with two engine pods, near tailplane.
    this.airWing(ctx, [[0.3, 0.05], [-0.2, 0.29], [-0.32, 0.29], [-0.1, 0.06]], B);
    this.airPod(ctx, Col.adj(B, -3), 0.27, 0.07, 0.17, 0.042, 0.1);
    this.airPod(ctx, Col.adj(B, -3), 0.1, -0.1, 0.26, 0.042, 0.19);
    this.airWing(ctx, [[-0.7, 0.0], [-0.93, 0.09], [-1.01, 0.09], [-0.9, 0.0]], B, 0.014);
    this.band(ctx, C, -0.91, -0.4, 0.09, 0.05);
    this.roundel(ctx, C, 0.5, -0.02, 0.045);
  },

  // F126 / FREMM type frigate (about 145 m): 127 mm gun, VLS on the forecastle, bridge block under one enclosed
  // mast with fixed radar faces, single funnel, second sensor mast, hangar and flight deck aft.
  frig(ctx, C) {
    const H = C.ship, SS = Col.adj(C.ship, 8);
    this.shipHull(ctx, [[0.97, -0.12], [0.76, -0.095], [0.4, -0.075], [0.0, -0.065], [-0.6, -0.06], [-0.62, -0.03], [-0.97, -0.03], [-0.97, 0.06], [-0.92, 0.12], [0.45, 0.14], [0.78, 0.12], [0.9, 0.04]], H);
    this.P(ctx, [[-0.12, -0.2], [-0.14, -0.36], [-0.28, -0.36], [-0.3, -0.2]], SS);
    this.R(ctx, -0.275, -0.38, 0.13, 0.025, '#1d201f', null, 0.004);
    this.band(ctx, C, -0.285, -0.31, 0.15, 0.024);
    this.P(ctx, [[0.36, -0.078], [0.31, -0.27], [0.02, -0.27], [-0.02, -0.2], [-0.6, -0.2], [-0.62, -0.06]], SS);
    this.P(ctx, [[0.305, -0.255], [0.19, -0.26], [0.19, -0.238], [0.3, -0.233]], GLASS);
    this.P(ctx, [[0.2, -0.27], [0.15, -0.56], [0.04, -0.56], [0.0, -0.27]], SS);
    this.seaOct(ctx, 0.1, -0.43, 0.04);
    this.R(ctx, 0.05, -0.6, 0.09, 0.04, SEA_GREY, null, 0.008);
    this.seaFlag(ctx, C, 0.095, -0.6, 0.1);
    this.P(ctx, [[-0.36, -0.2], [-0.39, -0.38], [-0.45, -0.38], [-0.48, -0.2]], SS);
    this.seaDome(ctx, -0.42, -0.38, 0.022);
    this.R(ctx, -0.6, -0.17, 0.05, 0.105, Col.adj(H, -10), null, 0.004);
    this.seaVls(ctx, 0.4, 0.52, -0.078);
    this.P(ctx, [[0.72, -0.092], [0.695, -0.15], [0.59, -0.156], [0.56, -0.086]], SS);
    this.L(ctx, 0.68, -0.128, 0.87, -0.145, GUN, 0.016);
    this.ln(ctx, -0.62, -0.031, -0.97, -0.031, 'rgba(255,255,255,0.4)');
    this.seaSeams(ctx, [0.16, -0.06, -0.34], -0.19, -0.07);
    this.ln(ctx, 0.33, -0.17, 0.0, -0.17, 'rgba(0,0,0,0.25)');
    this.seaDoor(ctx, 0.27, -0.074); this.seaDoor(ctx, -0.1, -0.064);
    this.seaBay(ctx, -0.26, -0.15, 0.13, 0.058);
    this.seaCiws(ctx, -0.53, -0.2);
    this.seaDome(ctx, 0.27, -0.27, 0.018); this.seaNav(ctx, 0.06, -0.27);
    this.seaRafts(ctx, -0.02, -0.2, 3);
    this.seaRail(ctx, -0.96, -0.63, -0.03); this.seaRail(ctx, 0.75, 0.95, -0.094, -0.117);
    this.seaNum(ctx, '222', 0.76, -0.035);
  },
});

// ---------- East ----------
Object.assign(Models.mE, {
  // R-149MA1 command and staff vehicle (BTR-80 chassis): raised box body over the rear hull, telescopic mast and
  // generator stowed on the roof, a forest of whip antennas.
  hq(ctx, C) {
    this.btrHull(ctx, C);
    this.P(ctx, [[-0.86, -0.215], [-0.84, -0.35], [0.1, -0.35], [0.26, -0.215]], C.body);
    this.topFace(ctx, C, -0.84, 0.1, -0.35, 0.022);
    for (const x of [-0.66, -0.4]) this.R(ctx, x, -0.32, 0.12, 0.05, GLASS, null, 0.006);
    this.ln(ctx, -0.16, -0.345, -0.16, -0.22); this.ln(ctx, -0.84, -0.27, 0.16, -0.27, 'rgba(0,0,0,0.3)');
    this.R(ctx, -0.78, -0.395, 0.74, 0.032, C.dark, null, 0.012);
    this.R(ctx, -0.02, -0.4, 0.1, 0.05, Col.adj(C.dark, 6), null, 0.006);
    this.stow(ctx, -0.5, -0.44, 0.22, 0.045);
    this.mark(ctx, -0.62, -0.1, 'K-01', 0.05);
    this.exhaust(ctx, -0.5, -0.215, 0.1, 0.03);
    this.antenna(ctx, -0.82, -0.35, 0.52, -0.1); this.antenna(ctx, -0.6, -0.395, 0.56, -0.04); this.antenna(ctx, 0.04, -0.4, 0.44, 0.05);
    this.pennant(ctx, C, 0.34, -0.2, 0.34);
  },
  // 1RL257 Krasukha-4 (BAZ-6910 8x8): box body with two large parabolic jammer dishes and a smaller receiving
  // dish, raised on pedestals in the operating position.
  ew(ctx, C) {
    this.truck8E(ctx, C, function () {
      this.P(ctx, [[-0.92, 0.05], [-0.93, -0.2], [-0.9, -0.23], [0.36, -0.23], [0.38, -0.2], [0.38, 0.05]], C.body);
      this.topFace(ctx, C, -0.9, 0.36, -0.23, 0.022);
      for (const x of [-0.6, -0.26, 0.08]) this.ln(ctx, x, -0.22, x, 0.04);
      this.R(ctx, -0.84, -0.15, 0.12, 0.16, Col.adj(C.body, -6), null, 0.006);
      this.exhaust(ctx, 0.2, -0.18, 0.1, 0.04);
      this.dish(ctx, C, -0.62, -0.23, 0.2, 0.28);
      this.dish(ctx, C, -0.12, -0.23, 0.16, 0.2);
      this.R(ctx, 0.14, -0.3, 0.14, 0.07, C.dark, null, 0.01);
      this.O(ctx, 0.21, -0.33, 0.045, '#b9beb2');
      this.bolts(ctx, -0.9, 0.36, -0.2, 13);
      this.mark(ctx, -0.5, -0.08, '412', 0.05);
    });
    this.antenna(ctx, 0.6, -0.27, 0.34);
    this.pennant(ctx, C, 0.46, -0.27, 0.26);
  },
  // K-300P Bastion-P launcher (K-340P on MZKT-7930): two 8.9 m transport-launch containers for P-800 Oniks,
  // raised from the rear of the 8x8 truck.
  coast(ctx, C) {
    this.truck8E(ctx, C, function () {
      this.P(ctx, [[-0.92, 0.05], [-0.93, -0.1], [-0.9, -0.13], [0.36, -0.13], [0.38, -0.1], [0.38, 0.05]], C.body);
      this.topFace(ctx, C, -0.9, 0.36, -0.13, 0.02);
      for (const x of [-0.5, -0.1]) this.ln(ctx, x, -0.12, x, 0.04);
      this.R(ctx, 0.16, -0.22, 0.2, 0.09, Col.adj(C.body, -5), null, 0.008);
      this.L(ctx, -0.3, -0.12, -0.34, -0.5, GUN, 0.03);
      ctx.save(); ctx.translate(-0.88, -0.15); ctx.rotate(-0.62);
      for (const y of [-0.11, -0.225]) {
        this.R(ctx, 0, y, 1.12, 0.1, Col.adj(C.body, 4), null, 0.045);
        this.R(ctx, 1.08, y - 0.005, 0.05, 0.11, C.dark, null, 0.02);
        for (const x of [0.2, 0.48, 0.76]) this.ln(ctx, x, y, x, y + 0.1, 'rgba(0,0,0,0.4)', 1.3);
      }
      this.R(ctx, 0.04, -0.012, 0.9, 0.03, C.dark, null, 0.006);
      ctx.restore();
      this.bolts(ctx, -0.9, 0.36, 0.03, 13);
      this.mark(ctx, -0.08, -0.05, '306', 0.05);
    });
    this.antenna(ctx, 0.6, -0.27, 0.34);
    this.pennant(ctx, C, 0.46, -0.27, 0.26);
  },
  // Naval infantry (Morskaya Pekhota) coming ashore: dark field uniform, black vests, telnyashka at the collar.
  marine(ctx, C) {
    this.surf(ctx);
    this.squad(ctx, { ...C, cloth: '#414a3c', gear: '#232628' }, { stripes: true, pack: '#2e3230' });
    this.pennant(ctx, C, 0.62, 0.3, 0.78);
  },

  // Su-25SM3 (15.5 m long, 14.4 m span, 4.8 m high): shoulder wing with wingtip pods, engines in nacelles along
  // the fuselage sides, single tall fin, flat-sided nose with the laser window, rocket pods under the wing.
  cas(ctx, C) {
    const B = '#69725c', D = Col.adj(B, -12);
    this.P(ctx, [[0.2, -0.08], [0.08, -0.27], [-0.08, -0.27], [-0.16, -0.08]], D);
    this.P(ctx, [[-0.7, -0.06], [-0.9, -0.14], [-0.99, -0.14], [-0.92, -0.06]], D);
    this.P(ctx, [[-0.56, -0.08], [-0.8, -0.38], [-0.93, -0.38], [-0.95, -0.06]], B);
    this.ln(ctx, -0.84, -0.37, -0.9, -0.07);
    this.S(ctx, [[1.0, 0.02], [0.93, -0.04], [0.76, -0.085], [0.5, -0.1], [0.0, -0.095], [-0.6, -0.08], [-0.92, -0.06], [-0.99, -0.02], [-0.92, 0.02], [-0.5, 0.05], [0.2, 0.07], [0.7, 0.07], [0.92, 0.055]], B);
    this.R(ctx, 0.975, -0.015, 0.03, 0.04, GLASS, null, 0.006, { noLine: true });
    this.S(ctx, [[0.74, -0.085], [0.66, -0.16], [0.54, -0.18], [0.44, -0.16], [0.4, -0.1], [0.56, -0.09]], GLASS);
    this.ln(ctx, 0.56, -0.175, 0.55, -0.095, 'rgba(0,0,0,0.6)', 1.2);
    this.glint(ctx, 0.6, -0.15);
    this.ln(ctx, 0.88, -0.055, 0.88, 0.05, 'rgba(0,0,0,0.45)'); this.ln(ctx, 0.3, -0.095, 0.3, 0.07); this.ln(ctx, 0.95, 0.0, -0.95, -0.02, 'rgba(255,255,255,0.12)');
    // Engine nacelle along the fuselage side: intake lip at the front, nozzle at the rear.
    this.R(ctx, -0.62, -0.02, 0.9, 0.115, Col.adj(B, 3), null, 0.05);
    this.E(ctx, 0.275, 0.037, 0.02, 0.052, '#1b1e1f', { noLine: true });
    this.P(ctx, [[-0.61, 0.0], [-0.69, 0.015], [-0.69, 0.065], [-0.61, 0.08]], '#3a3a36');
    this.ln(ctx, 0.0, -0.015, 0.0, 0.09); this.ln(ctx, -0.36, -0.015, -0.36, 0.09);
    // Near wing with wingtip airbrake pod, pylons with a B-8 rocket pod and Kh-25 missiles; near tailplane.
    this.airWing(ctx, [[0.22, 0.0], [0.04, 0.31], [-0.14, 0.31], [-0.2, 0.02]], B);
    this.R(ctx, -0.17, 0.295, 0.26, 0.03, D, null, 0.015);
    this.R(ctx, -0.04, 0.12, 0.2, 0.05, '#4e5442', null, 0.02); this.E(ctx, 0.16, 0.145, 0.01, 0.024, '#22251f', { noLine: true });
    this.R(ctx, -0.08, 0.215, 0.2, 0.024, '#d5d9d6', null, 0.012);
    this.airWing(ctx, [[-0.7, -0.02], [-0.93, 0.07], [-1.01, 0.07], [-0.92, -0.02]], B, 0.014);
    this.band(ctx, C, -0.92, -0.34, 0.1, 0.045);
    this.roundel(ctx, C, -0.42, -0.045, 0.036);
  },
  // Su-57 (20.1 m long, 14.1 m span, 4.6 m high): long flat blended fuselage with a low canopy, movable leading-edge
  // root extensions, widely spaced engine nacelles, small all-moving canted fins, splinter camouflage.
  sjet(ctx, C) {
    const B = Col.adj(C.jet, -12), D = Col.adj(B, -12);
    this.P(ctx, [[-0.52, -0.08], [-0.66, -0.31], [-0.8, -0.31], [-0.84, -0.08]], D);
    this.P(ctx, [[-0.62, -0.03], [-0.88, -0.11], [-0.99, -0.11], [-0.95, -0.03]], D);
    this.P(ctx, [[0.3, -0.02], [-0.36, -0.15], [-0.52, -0.15], [-0.56, -0.02]], D);
    this.S(ctx, [[0.36, 0.0], [0.36, 0.1], [0.26, 0.115], [-0.72, 0.105], [-0.9, 0.09], [-0.9, 0.0], [-0.4, -0.02]], Col.adj(B, -6));
    this.P(ctx, [[0.375, 0.0], [0.375, 0.105], [0.3, 0.11], [0.31, 0.0]], '#141a1e');
    this.airSplinter(ctx, [[1.08, 0.0], [0.97, -0.03], [0.8, -0.055], [0.6, -0.075], [0.42, -0.095], [0.2, -0.105], [-0.2, -0.095], [-0.6, -0.07], [-0.86, -0.05], [-1.06, -0.025], [-1.06, 0.0], [-0.86, 0.012], [-0.4, 0.03], [0.3, 0.04], [0.7, 0.04], [0.9, 0.03]], B, true);
    this.ln(ctx, 0.86, -0.045, 0.86, 0.035, 'rgba(0,0,0,0.5)');
    this.S(ctx, [[0.7, -0.07], [0.6, -0.135], [0.47, -0.155], [0.36, -0.14], [0.31, -0.1], [0.5, -0.08]], GLASS);
    this.glint(ctx, 0.5, -0.13);
    this.R(ctx, -1.02, 0.015, 0.14, 0.075, '#55504a', null, 0.02);
    this.ln(ctx, -0.97, 0.02, -0.97, 0.085, 'rgba(0,0,0,0.45)');
    // Near wing with the leading-edge extension, near tailplane and fin.
    this.P(ctx, [[0.68, 0.05], [0.28, 0.065], [-0.4, 0.25], [-0.56, 0.25], [-0.6, 0.065]], Col.adj(B, -28));
    this.airSplinter(ctx, [[0.68, 0.03], [0.28, 0.045], [-0.4, 0.23], [-0.56, 0.23], [-0.6, 0.045]], B);
    this.ln(ctx, 0.3, 0.045, 0.1, 0.1, 'rgba(0,0,0,0.4)');
    this.P(ctx, [[-0.64, 0.07], [-0.9, 0.16], [-1.03, 0.16], [-0.97, 0.07]], Col.adj(B, -28));
    this.airSplinter(ctx, [[-0.64, 0.05], [-0.9, 0.145], [-1.03, 0.145], [-0.97, 0.05]], B);
    this.airSplinter(ctx, [[-0.57, -0.06], [-0.7, -0.29], [-0.84, -0.29], [-0.88, -0.05]], B);
    this.band(ctx, C, -0.84, -0.275, 0.12, 0.045);
    this.roundel(ctx, C, 0.08, 0.0, 0.038);
  },
  // A-50U (Il-76MD airframe): the transport's fuselage, shoulder wing and T-tail with a 10.5 m rotodome on a
  // pylon behind the wing and a satcom fairing above the cockpit.
  awacs(ctx, C) {
    this.mE.tplane.call(this, ctx, C);
    const D = Col.adj(C.jet, -14);
    this.S(ctx, [[0.72, -0.15], [0.66, -0.19], [0.5, -0.19], [0.44, -0.155]], Col.adj(C.jet, 4));
    this.P(ctx, [[-0.3, -0.16], [-0.34, -0.3], [-0.52, -0.3], [-0.56, -0.15]], D);
    this.E(ctx, -0.43, -0.32, 0.28, 0.048, '#3b4144');
    this.E(ctx, -0.43, -0.32, 0.1, 0.048, '#cfd4d5', { noLine: true });
  },

  // Admiral Grigorovich class, Project 11356R (125 m): A-190 100 mm gun, Shtil-1 and Kalibr VLS on the
  // forecastle, upright bridge block, tripod mast with the Fregat radar bar, large funnel amidships, Kashtan CIWS
  // and hangar aft.
  frig(ctx, C) {
    const H = C.ship, SS = Col.adj(C.ship, 8);
    this.shipHull(ctx, [[0.96, -0.13], [0.72, -0.1], [0.35, -0.08], [-0.55, -0.075], [-0.57, -0.045], [-0.96, -0.045], [-0.96, 0.06], [-0.9, 0.12], [0.45, 0.14], [0.76, 0.12], [0.88, 0.04]], H);
    this.P(ctx, [[-0.14, -0.19], [-0.16, -0.36], [-0.32, -0.36], [-0.34, -0.19]], SS);
    this.R(ctx, -0.31, -0.38, 0.14, 0.025, '#1d201f', null, 0.004);
    this.band(ctx, C, -0.325, -0.31, 0.17, 0.024);
    this.P(ctx, [[0.05, -0.08], [0.05, -0.19], [-0.55, -0.19], [-0.56, -0.076]], SS);
    this.P(ctx, [[0.34, -0.082], [0.32, -0.25], [0.05, -0.25], [0.05, -0.08]], SS);
    this.P(ctx, [[0.31, -0.235], [0.2, -0.24], [0.2, -0.218], [0.305, -0.213]], GLASS);
    this.L(ctx, 0.23, -0.25, 0.16, -0.6, SEA_MAST, 0.016); this.L(ctx, 0.09, -0.25, 0.16, -0.6, SEA_MAST, 0.016);
    this.L(ctx, 0.1, -0.44, 0.22, -0.44, SEA_MAST, 0.011);
    this.O(ctx, 0.16, -0.5, 0.016, SEA_LIGHT);
    this.R(ctx, 0.07, -0.645, 0.18, 0.04, SEA_ARRAY, null, 0.006, { noLine: true });
    this.seaFlag(ctx, C, 0.16, -0.645, 0.08);
    this.L(ctx, -0.44, -0.19, -0.44, -0.4, SEA_MAST, 0.014);
    this.seaDome(ctx, -0.44, -0.4, 0.02);
    this.R(ctx, -0.55, -0.165, 0.05, 0.09, Col.adj(H, -10), null, 0.004);
    this.P(ctx, [[0.56, -0.092], [0.55, -0.125], [0.42, -0.125], [0.41, -0.086]], Col.adj(H, -4));
    this.seaVls(ctx, 0.43, 0.54, -0.125, 0.012);
    this.P(ctx, [[0.74, -0.102], [0.71, -0.16], [0.62, -0.165], [0.6, -0.096]], SS);
    this.L(ctx, 0.7, -0.14, 0.88, -0.155, GUN, 0.016);
    this.ln(ctx, -0.57, -0.046, -0.96, -0.046, 'rgba(255,255,255,0.4)');
    this.seaSeams(ctx, [0.2, -0.04, -0.38], -0.18, -0.085);
    this.seaWin(ctx, 0.1, 0.28, -0.15, 5, 0.011, 0.011);
    this.seaDoor(ctx, 0.27, -0.084); this.seaDoor(ctx, -0.08, -0.08);
    this.seaBay(ctx, -0.02, -0.165, 0.06, 0.05);
    this.seaCiws(ctx, -0.5, -0.19); this.seaNav(ctx, 0.27, -0.25);
    this.seaRafts(ctx, -0.12, -0.19, 3);
    this.seaRail(ctx, -0.95, -0.58, -0.045); this.seaRail(ctx, 0.75, 0.94, -0.104, -0.127);
    this.seaNum(ctx, '745', 0.74, -0.04);
  },
});
