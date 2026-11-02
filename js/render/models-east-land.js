// Eastern (E) ground vehicle models (wheeled and tracked). Drawn with the helpers in models.js.
'use strict';

// Shared Eastern hull parts (prefix e_ to avoid clashes with other model files).
Object.assign(Models, {
  // BMP-3 hull (6.72 m hull, 2.3 m): 6 road wheels, front idler, rear sprocket, rubber skirt, long shallow glacis with trim vane.
  e_bmp3(ctx, C) {
    this.tracks(ctx, [[-0.88, 0.16], [-0.85, 0.09], [-0.76, 0.06], [0.7, 0.06], [0.81, 0.08], [0.86, 0.12], [0.8, 0.22], [0.64, 0.3], [-0.64, 0.3], [-0.82, 0.25]],
      [-0.58, -0.35, -0.12, 0.11, 0.34, 0.57], 0.21, 0.085, [-0.8, 0.16, 0.07], [0.79, 0.13, 0.066]);
    this.P(ctx, [[-0.9, 0.1], [-0.92, -0.1], [-0.88, -0.13], [0.36, -0.13], [0.9, -0.02], [0.94, 0.03], [0.88, 0.09], [0.78, 0.11]], C.body);
    this.topFace(ctx, C, -0.88, 0.36, -0.13, 0.024);
    this.P(ctx, [[0.36, -0.13], [0.39, -0.152], [0.92, -0.035], [0.9, -0.02]], Col.adj(C.body, 9));
    this.P(ctx, [[-0.88, -0.02], [0.74, -0.02], [0.84, 0.02], [0.8, 0.09], [-0.88, 0.09]], Col.adj(C.body, -5));
    for (const x of [-0.5, -0.12, 0.26]) this.ln(ctx, x, -0.02, x, 0.09);
    // Trim vane folded on the glacis, driver's periscopes, rear doors and exhaust.
    this.P(ctx, [[0.44, -0.115], [0.86, -0.025], [0.88, 0.0], [0.46, -0.095]], C.dark);
    this.R(ctx, 0.34, -0.155, 0.08, 0.03, C.dark, null, 0.005); this.R(ctx, 0.36, -0.15, 0.04, 0.015, GLASS, null, 0.003);
    this.ln(ctx, -0.86, -0.11, -0.86, 0.06, 'rgba(0,0,0,0.5)');
    this.R(ctx, -0.8, -0.07, 0.08, 0.04, C.dark, null, 0.01);
    // Skirt bolts, tow cable, headlights on the glacis, spare track links on the bow.
    this.bolts(ctx, -0.84, 0.72, 0.0, 15); this.bolts(ctx, -0.84, 0.72, 0.07, 15);
    this.tow(ctx, -0.7, -0.06, 0.3, -0.06);
    this.light(ctx, 0.82, -0.02);
    for (let i = 0; i < 3; i++) this.R(ctx, 0.56 + i * 0.07, -0.085 + i * 0.016, 0.06, 0.022, '#3a3d36', null, 0.004);
  },
});

Object.assign(Models.mE, {
  // GAZ Tigr-M (5.7 m, 2.4 m, wheelbase 3.3 m): long flat bonnet, upright boxy cab, small side windows, Kord MG on roof ring.
  recon(ctx, C) {
    ctx.save(); ctx.translate(0, -0.42);
    this.soldier(ctx, C, -0.2, 0.55, { weapon: 'none', pack: false });
    ctx.restore();
    this.P(ctx, [[-0.8, 0.1], [-0.81, -0.26], [-0.77, -0.3], [0.1, -0.3], [0.15, -0.27], [0.28, -0.11], [0.74, -0.085], [0.8, -0.055], [0.81, 0.1], [0.66, 0.1], [0.62, -0.01], [0.32, -0.01],
      [0.28, 0.1], [-0.28, 0.1], [-0.32, -0.01], [-0.62, -0.01], [-0.66, 0.1]], C.body);
    this.topFace(ctx, C, -0.77, 0.12, -0.3, 0.024);
    this.P(ctx, [[0.28, -0.11], [0.3, -0.13], [0.76, -0.105], [0.74, -0.085]], Col.adj(C.body, 9));
    this.P(ctx, [[0.11, -0.27], [0.14, -0.27], [0.25, -0.12], [0.12, -0.12]], GLASS);
    this.R(ctx, -0.12, -0.26, 0.17, 0.09, GLASS, null, 0.01); this.R(ctx, -0.48, -0.26, 0.17, 0.09, GLASS, null, 0.01);
    this.glint(ctx, 0.15, -0.22); this.glint(ctx, -0.08, -0.23);
    this.ln(ctx, 0.08, -0.29, 0.08, 0.04); this.ln(ctx, -0.26, -0.29, -0.26, -0.02); this.ln(ctx, -0.6, -0.29, -0.6, -0.02);
    this.ln(ctx, 0.28, -0.11, 0.8, -0.06, 'rgba(255,255,255,0.18)');
    this.R(ctx, 0.76, -0.05, 0.06, 0.1, C.dark, null, 0.01);
    if (this.pass === 'fill' && !this.small) for (let y = -0.035; y < 0.05; y += 0.025) this.ln(ctx, 0.77, y, 0.81, y, 'rgba(0,0,0,0.6)');
    this.R(ctx, 0.74, 0.05, 0.1, 0.035, C.dark, null, 0.01);
    this.R(ctx, -0.87, -0.22, 0.07, 0.2, '#262925', null, 0.03);
    this.wheels(ctx, [-0.47, 0.47], 0.15);
    // Roof ring with Kord 12.7 mm.
    this.R(ctx, -0.32, -0.34, 0.26, 0.05, C.dark, null, 0.01);
    this.R(ctx, -0.12, -0.42, 0.12, 0.06, GUN, null, 0.01);
    this.L(ctx, -0.02, -0.4, 0.3, -0.41, GUN, 0.024);
    this.R(ctx, 0.27, -0.425, 0.05, 0.03, GUN, null, 0.005);
    this.R(ctx, -0.14, -0.38, 0.06, 0.05, '#4a4b33', null, 0.008);
    this.mirror(ctx, 0.12, -0.18);
    this.light(ctx, 0.8, -0.075);
    this.bolts(ctx, -0.78, 0.06, -0.15, 9);
    this.antenna(ctx, -0.6, -0.3, 0.4);
    this.pennant(ctx, C, -0.72, -0.3, 0.3);
  },

  // ---------- Wheeled vehicles ----------
  // KamAZ-5350 Mustang (8.5 m, 6x6): flat-fronted cab-over cab, tarp-covered cargo body, front axle plus rear tandem.
  truck(ctx, C) {
    this.R(ctx, -0.88, 0.03, 1.76, 0.045, C.dark, null, 0.01);
    this.R(ctx, -0.9, -0.06, 1.2, 0.1, Col.adj(C.body, -6), null, 0.01);
    for (let x = -0.8; x < 0.3; x += 0.15) this.ln(ctx, x, -0.05, x, 0.04);
    this.R(ctx, -0.9, -0.29, 1.2, 0.24, C.cloth, null, 0.05);
    this.topFace(ctx, C, -0.88, 0.28, -0.29, 0.024, Col.adj(C.cloth, 8));
    for (const x of [-0.6, -0.3, 0.0]) this.ln(ctx, x, -0.28, x, -0.06, 'rgba(0,0,0,0.3)');
    this.ln(ctx, -0.88, -0.09, 0.28, -0.09, 'rgba(0,0,0,0.3)');
    this.R(ctx, 0.1, 0.0, 0.2, 0.08, C.dark, null, 0.02);
    // Cab: KamAZ cab-over with raked front, big door window, grille and bumper below.
    this.P(ctx, [[0.36, 0.08], [0.36, -0.25], [0.4, -0.28], [0.84, -0.28], [0.88, -0.24], [0.91, -0.06], [0.93, 0.0], [0.93, 0.09], [0.78, 0.09], [0.74, 0.0], [0.5, 0.0], [0.46, 0.08]], C.body);
    this.topFace(ctx, C, 0.4, 0.84, -0.28, 0.024);
    this.P(ctx, [[0.62, -0.25], [0.82, -0.25], [0.85, -0.13], [0.62, -0.13]], GLASS);
    this.R(ctx, 0.44, -0.24, 0.12, 0.08, GLASS, null, 0.01);
    this.glint(ctx, 0.66, -0.22);
    this.ln(ctx, 0.6, -0.27, 0.6, 0.0); this.ln(ctx, 0.88, -0.24, 0.91, -0.06);
    this.R(ctx, 0.88, -0.06, 0.06, 0.08, C.dark, null, 0.01);
    this.R(ctx, 0.84, 0.05, 0.11, 0.04, C.dark, null, 0.01);
    this.R(ctx, 0.62, -0.04, 0.1, 0.03, C.dark, null, 0.005);
    this.wheels(ctx, [0.62, -0.18, -0.46], 0.13);
    // Tarp tie-down ropes, mirror, headlight, mudflaps.
    if (this.pass === 'fill' && !this.small) for (let x = -0.84; x < 0.28; x += 0.1) this.ln(ctx, x, -0.09, x + 0.02, -0.05, 'rgba(30,25,15,0.7)', 1.4);
    this.mirror(ctx, 0.9, -0.17);
    this.light(ctx, 0.91, -0.015);
    for (const x of [0.4, -0.66]) this.R(ctx, x, 0.05, 0.03, 0.11, '#1d201b', null, 0.004);
    this.antenna(ctx, 0.5, -0.28, 0.34);
    this.pennant(ctx, C, 0.4, -0.28, 0.26);
  },
  // BTR-82A (7.65 m, 8x8): boat-shaped bow, sloped upper hull, wider gap between axles 2 and 3 with side door, small 30 mm turret.
  apc(ctx, C) {
    this.P(ctx, [[-0.82, 0.11], [-0.92, -0.04], [-0.88, -0.2], [-0.82, -0.22], [0.3, -0.22], [0.92, -0.01], [0.9, 0.04], [0.72, 0.12]], C.body);
    this.topFace(ctx, C, -0.84, 0.32, -0.22, 0.024);
    this.P(ctx, [[0.3, -0.22], [0.33, -0.242], [0.93, -0.027], [0.92, -0.01]], Col.adj(C.body, 9));
    this.ln(ctx, -0.9, -0.05, 0.9, -0.03, 'rgba(0,0,0,0.45)');
    this.ln(ctx, -0.84, -0.21, -0.84, 0.08, 'rgba(0,0,0,0.4)');
    this.R(ctx, 0.36, -0.215, 0.1, 0.035, C.dark, null, 0.005); this.R(ctx, 0.38, -0.205, 0.06, 0.015, GLASS, null, 0.003);
    this.R(ctx, 0.48, -0.18, 0.08, 0.03, C.dark, null, 0.005);
    this.P(ctx, [[0.0, -0.16], [0.13, -0.16], [0.13, -0.04], [0.0, -0.04]], C.dark);
    this.ln(ctx, 0.0, -0.1, 0.13, -0.1, 'rgba(255,255,255,0.15)');
    for (const x of [-0.6, -0.35, 0.3]) this.O(ctx, x, -0.12, 0.018, C.dark, null, { noLine: true });
    this.O(ctx, -0.88, 0.02, 0.03, '#1d201b', null, { noLine: true });
    if (this.pass === 'fill') for (const x of [0.6, 0.29, -0.17, -0.48]) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(x, 0.17, 0.15, Math.PI, 0); ctx.fill(); }
    this.wheels(ctx, [0.6, 0.29, -0.17, -0.48], 0.135);
    // BPPU turret: low cone, sight block, long thin 2A72 and coax PKT; smoke dischargers at the rear.
    this.ao(ctx, -0.04, 0.3, -0.22, 0.035);
    this.P(ctx, [[-0.04, -0.22], [-0.02, -0.31], [0.04, -0.34], [0.2, -0.34], [0.27, -0.3], [0.3, -0.22]], C.body);
    this.R(ctx, 0.04, -0.39, 0.09, 0.05, C.dark, null, 0.008); this.R(ctx, 0.1, -0.38, 0.025, 0.03, GLASS, null, 0.004);
    this.R(ctx, 0.25, -0.3, 0.06, 0.05, C.dark, null, 0.008);
    this.barrel(ctx, 0.29, -0.28, 0.98, -0.285, 0.017, { brake: 1 });
    this.L(ctx, 0.29, -0.245, 0.5, -0.245, GUN, 0.01);
    for (let i = 0; i < 3; i++) this.L(ctx, -0.06 + i * 0.03, -0.3 + i * 0.01, -0.02 + i * 0.03, -0.33 + i * 0.01, C.dark, 0.016);
    this.bolts(ctx, -0.8, 0.24, -0.17, 12);
    this.light(ctx, 0.84, -0.02);
    this.stow(ctx, -0.8, -0.27, 0.24, 0.05, 1);
    this.mark(ctx, -0.62, -0.1, '215', 0.05);
    this.exhaust(ctx, -0.5, -0.215, 0.1, 0.03);
    this.antenna(ctx, -0.56, -0.22, 0.42);
    this.pennant(ctx, C, -0.76, -0.22, 0.3);
  },
  // Kornet-T (9P162, BMP-3 hull): turret replaced by a flat roof housing, raised launcher arm with two Kornet canisters, armoured sight box front left.
  td(ctx, C) {
    this.e_bmp3(ctx, C);
    this.P(ctx, [[-0.5, -0.13], [-0.48, -0.2], [0.14, -0.2], [0.22, -0.13]], C.body);
    this.R(ctx, 0.24, -0.23, 0.12, 0.08, C.dark, null, 0.01); this.R(ctx, 0.31, -0.21, 0.04, 0.03, GLASS, null, 0.004);
    this.glint(ctx, 0.33, -0.2, 0.01);
    this.L(ctx, -0.2, -0.2, -0.12, -0.42, C.dark, 0.04);
    this.L(ctx, -0.06, -0.2, -0.12, -0.42, C.dark, 0.025);
    this.R(ctx, -0.2, -0.45, 0.14, 0.04, C.dark, null, 0.008);
    // Two launch canisters (left one higher), front caps.
    this.R(ctx, -0.34, -0.565, 0.46, 0.065, '#5d6743', null, 0.025);
    this.R(ctx, -0.28, -0.5, 0.46, 0.065, '#5d6743', null, 0.025);
    for (const [x, y] of [[0.12, -0.5325], [0.18, -0.4675]]) this.R(ctx, x - 0.02, y - 0.038, 0.04, 0.076, '#1e211c', null, 0.012);
    for (const [x, y] of [[-0.34, -0.5325], [-0.28, -0.4675]]) this.R(ctx, x - 0.012, y - 0.036, 0.03, 0.072, '#1e211c', null, 0.01);
    this.ln(ctx, -0.12, -0.56, -0.12, -0.505); this.ln(ctx, -0.06, -0.495, -0.06, -0.44);
    this.mark(ctx, -0.4, 0.035, '231', 0.05);
    this.stow(ctx, -0.86, -0.18, 0.18, 0.045);
    this.antenna(ctx, -0.6, -0.13, 0.4);
    this.pennant(ctx, C, -0.8, -0.13, 0.3);
  },
  // Pantsir-S1 on KamAZ-6560 8x8: cab-over cab, equipment box, turret with tracking radar dish in front, 2x6 missile tubes,
  // twin 2A38M 30 mm guns below them, rotating search radar on top (Models.animE.aa).
  aa(ctx, C) {
    this.R(ctx, -0.9, 0.03, 1.8, 0.045, C.dark, null, 0.01);
    this.P(ctx, [[0.5, 0.08], [0.5, -0.24], [0.54, -0.27], [0.86, -0.27], [0.9, -0.23], [0.92, -0.06], [0.94, 0.0], [0.94, 0.08]], C.body);
    this.topFace(ctx, C, 0.54, 0.86, -0.27, 0.022);
    this.P(ctx, [[0.72, -0.24], [0.87, -0.24], [0.89, -0.12], [0.72, -0.12]], GLASS);
    this.R(ctx, 0.56, -0.23, 0.12, 0.08, GLASS, null, 0.01);
    this.glint(ctx, 0.75, -0.21);
    this.R(ctx, 0.89, -0.05, 0.06, 0.08, C.dark, null, 0.01);
    this.R(ctx, 0.12, -0.14, 0.36, 0.18, C.body, null, 0.015);
    for (const x of [0.24, 0.36]) this.ln(ctx, x, -0.13, x, 0.03);
    this.R(ctx, -0.9, -0.1, 1.0, 0.14, Col.adj(C.body, -6), null, 0.01);
    if (this.pass === 'fill') for (const x of [0.66, 0.41, -0.3, -0.56]) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x, 0.18, 0.135, Math.PI, 0); ctx.fill(); }
    this.wheels(ctx, [0.66, 0.41, -0.3, -0.56], 0.12);
    // Combat module.
    this.ao(ctx, -0.66, 0.06, -0.1, 0.04);
    this.P(ctx, [[-0.66, -0.1], [-0.68, -0.34], [-0.62, -0.38], [-0.08, -0.38], [0.02, -0.32], [0.04, -0.1]], C.body);
    this.topFace(ctx, C, -0.62, -0.06, -0.38, 0.024);
    this.R(ctx, -0.36, -0.43, 0.06, 0.05, C.dark, null, 0.005);
    // Missile pack on the turret side (six tubes, two rows visible), slightly elevated.
    ctx.save(); ctx.translate(-0.64, -0.24); ctx.rotate(-0.08);
    this.R(ctx, 0, -0.11, 0.64, 0.11, '#5d6743', null, 0.02);
    this.ln(ctx, 0.02, -0.055, 0.62, -0.055, 'rgba(0,0,0,0.55)', 1.2);
    this.R(ctx, 0.2, -0.115, 0.03, 0.12, C.dark, null, 0.005); this.R(ctx, 0.44, -0.115, 0.03, 0.12, C.dark, null, 0.005);
    for (const y of [-0.0825, -0.0275]) this.O(ctx, 0.63, y, 0.024, '#1e211c', null, { noLine: true });
    ctx.restore();
    // Tracking radar dish on the turret front.
    this.O(ctx, 0.07, -0.3, 0.07, C.dark); this.O(ctx, 0.07, -0.3, 0.042, '#4a524c', null, { noLine: true });
    // Twin 2A38M 30 mm cannons below.
    this.R(ctx, -0.1, -0.22, 0.18, 0.09, C.dark, null, 0.015);
    this.L(ctx, 0.06, -0.2, 0.54, -0.215, GUN, 0.018); this.L(ctx, 0.06, -0.155, 0.54, -0.17, GUN, 0.018);
    this.mirror(ctx, 0.92, -0.17);
    this.light(ctx, 0.92, -0.01);
    this.bolts(ctx, -0.62, 0.0, -0.13, 8);
    this.exhaust(ctx, 0.3, -0.14, 0.08, 0.04);
    this.pennant(ctx, C, 0.54, -0.27, 0.26);
  },
  // 2A65 Msta-B 152 mm towed howitzer (12.7 m in travel, 8.1 m barrel): rearward-sloping shield over the wheels,
  // recuperators above the barrel, multi-baffle muzzle brake, split trails with folded caster wheels.
  arty(ctx, C) {
    ctx.save(); ctx.translate(0.04, -0.02);
    this.P(ctx, [[-0.02, 0.02], [0.06, 0.04], [-0.86, 0.28], [-0.9, 0.26]], Col.adj(C.dark, -6));
    ctx.restore();
    this.P(ctx, [[-0.02, 0.02], [0.06, 0.04], [-0.86, 0.28], [-0.9, 0.26]], C.dark);
    this.P(ctx, [[-0.93, 0.22], [-0.84, 0.23], [-0.86, 0.31], [-0.94, 0.31]], C.dark);
    this.wheel(ctx, -0.6, 0.15, 0.045);
    // Barrel 25°: breech, cradle with recuperators, muzzle brake.
    this.barrel(ctx, -0.26, 0.06, 1.02, -0.53, 0.032);
    ctx.save(); ctx.translate(0.99, -0.515); ctx.rotate(Math.atan2(-0.59, 1.28));
    this.R(ctx, -0.07, -0.034, 0.14, 0.068, GUN, null, 0.01);
    if (this.pass === 'fill') { ctx.fillStyle = '#0d0f0d'; for (const dx of [-0.04, -0.012, 0.016, 0.044]) ctx.fillRect(dx - 0.006, -0.024, 0.012, 0.048); }
    ctx.restore();
    ctx.save(); ctx.translate(-0.22, 0.0); ctx.rotate(Math.atan2(-0.59, 1.28));
    this.R(ctx, 0, -0.07, 0.62, 0.05, C.body, null, 0.02);
    this.R(ctx, 0, -0.02, 0.5, 0.07, C.body, null, 0.015);
    ctx.restore();
    this.R(ctx, -0.34, 0.02, 0.12, 0.08, C.dark, null, 0.01);
    this.wheel(ctx, 0.06, 0.17, 0.13);
    // Shield leaning back over the wheel.
    this.P(ctx, [[-0.14, 0.1], [0.32, 0.08], [0.22, -0.22], [0.02, -0.29], [-0.1, -0.2]], C.body);
    this.ln(ctx, -0.12, -0.05, 0.28, -0.07); this.ln(ctx, 0.02, -0.28, 0.12, 0.09);
    this.R(ctx, 0.0, 0.25, 0.16, 0.05, C.dark, null, 0.01);
    this.bolts(ctx, -0.08, 0.26, 0.05, 6);
    // Gun crew and ammunition crates (as on the Western howitzer).
    this.R(ctx, -0.86, 0.18, 0.14, 0.12, '#55553a', null, 0.01, { camo: false });
    this.R(ctx, -0.7, 0.21, 0.12, 0.09, '#55553a', null, 0.01, { camo: false });
    this.soldier(ctx, C, -0.46, 0.62, { pose: 'kneel', weapon: 'none', hand: [0.2, -0.3], pack: false });
    this.L(ctx, -0.4, 0.08, -0.26, 0.04, '#8a7a45', 0.04);
    this.pennant(ctx, C, -0.7, 0.2, 0.42);
  },
  // BM-30 Smerch (12.1 m, MAZ-543M 8x8): split crew cabs ahead of the front axle, 12-tube 300 mm pack (4 rows visible), axle pairs with wide gap.
  mlrs(ctx, C) {
    this.R(ctx, -0.9, 0.03, 1.5, 0.045, C.dark, null, 0.01);
    this.R(ctx, -0.84, -0.06, 1.4, 0.1, Col.adj(C.body, -6), null, 0.01);
    this.P(ctx, [[0.54, 0.08], [0.54, -0.23], [0.6, -0.26], [0.8, -0.26], [0.93, -0.1], [0.95, 0.0], [0.95, 0.08]], C.body);
    this.topFace(ctx, C, 0.6, 0.82, -0.26, 0.022);
    this.P(ctx, [[0.8, -0.235], [0.91, -0.1], [0.8, -0.1]], GLASS);
    this.R(ctx, 0.61, -0.22, 0.15, 0.09, GLASS, null, 0.01);
    this.glint(ctx, 0.83, -0.18);
    this.ln(ctx, 0.78, -0.25, 0.78, 0.04);
    this.R(ctx, 0.88, -0.04, 0.08, 0.1, C.dark, null, 0.01);
    // Elevating cradle and A-frame support.
    this.L(ctx, 0.3, -0.06, 0.24, -0.2, C.dark, 0.03); this.L(ctx, 0.1, -0.06, 0.24, -0.2, C.dark, 0.03);
    ctx.save(); ctx.translate(-0.86, -0.08); ctx.rotate(-0.1);
    this.R(ctx, 0, -0.26, 1.36, 0.26, '#5d6743', null, 0.02);
    for (let i = 1; i < 4; i++) this.ln(ctx, 0.02, -0.26 + i * 0.065, 1.34, -0.26 + i * 0.065, 'rgba(0,0,0,0.55)', 1.2);
    for (const x of [0.3, 0.7, 1.1]) this.R(ctx, x, -0.27, 0.04, 0.28, C.dark, null, 0.005);
    for (let i = 0; i < 4; i++) this.O(ctx, 1.34, -0.2275 + i * 0.065, 0.024, '#1e211c', null, { noLine: true });
    this.R(ctx, -0.02, -0.27, 0.05, 0.28, C.dark, null, 0.008);
    ctx.restore();
    this.wheels(ctx, [0.62, 0.3, -0.22, -0.54], 0.125);
    this.mirror(ctx, 0.93, -0.16);
    this.light(ctx, 0.93, -0.01);
    this.bolts(ctx, -0.82, 0.5, 0.0, 14);
    this.antenna(ctx, 0.7, -0.26, 0.34);
    this.pennant(ctx, C, 0.58, -0.26, 0.26);
  },
  // 9K720 Iskander-M (MZKT-7930 8x8, 13 m): long crew cab, low flat launcher body for two missiles, one missile shown on the
  // half-raised erector.
  tbm(ctx, C) {
    this.R(ctx, -0.9, 0.03, 1.8, 0.045, C.dark, null, 0.01);
    this.P(ctx, [[0.42, 0.08], [0.42, -0.24], [0.46, -0.27], [0.86, -0.27], [0.91, -0.22], [0.94, -0.06], [0.95, 0.08]], C.body);
    this.topFace(ctx, C, 0.46, 0.86, -0.27, 0.022);
    this.P(ctx, [[0.8, -0.24], [0.88, -0.22], [0.9, -0.12], [0.8, -0.12]], GLASS);
    this.R(ctx, 0.48, -0.23, 0.12, 0.08, GLASS, null, 0.01); this.R(ctx, 0.64, -0.23, 0.12, 0.08, GLASS, null, 0.01);
    this.glint(ctx, 0.82, -0.21);
    this.ln(ctx, 0.62, -0.26, 0.62, 0.04); this.ln(ctx, 0.78, -0.26, 0.78, 0.04);
    this.R(ctx, 0.9, -0.05, 0.06, 0.1, C.dark, null, 0.01);
    // Launcher body with hinged flat cover.
    this.P(ctx, [[-0.92, 0.06], [-0.93, -0.16], [-0.9, -0.19], [0.36, -0.19], [0.38, -0.16], [0.38, 0.06]], C.body);
    this.topFace(ctx, C, -0.9, 0.36, -0.19, 0.022);
    for (const x of [-0.56, -0.2, 0.14]) this.ln(ctx, x, -0.18, x, 0.05);
    this.ln(ctx, -0.92, -0.08, 0.38, -0.08, 'rgba(0,0,0,0.4)');
    // Erector beam, hydraulic ram, missile (9M723) with fins.
    this.L(ctx, -0.28, -0.18, -0.36, -0.33, GUN, 0.03);
    ctx.save(); ctx.translate(-0.86, -0.2); ctx.rotate(-0.3);
    this.R(ctx, 0.0, -0.025, 0.96, 0.035, C.dark, null, 0.01);
    this.S(ctx, [[0.04, -0.03], [0.04, -0.11], [0.74, -0.11], [0.9, -0.09], [1.0, -0.07], [0.9, -0.05], [0.74, -0.03]], '#76806a');
    this.P(ctx, [[0.04, -0.11], [0.0, -0.14], [0.12, -0.11]], '#4f5745'); this.P(ctx, [[0.04, -0.03], [0.0, 0.0], [0.12, -0.03]], '#4f5745');
    this.ln(ctx, 0.74, -0.11, 0.74, -0.03, 'rgba(0,0,0,0.45)');
    this.R(ctx, 0.3, -0.105, 0.06, 0.07, C.accent, null, 0.005, { noLine: true });
    ctx.restore();
    if (this.pass === 'fill') for (const x of [0.62, 0.34, -0.22, -0.5]) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x, 0.18, 0.135, Math.PI, 0); ctx.fill(); }
    this.wheels(ctx, [0.62, 0.34, -0.22, -0.5], 0.125);
    this.mirror(ctx, 0.93, -0.16);
    this.light(ctx, 0.93, -0.01);
    this.bolts(ctx, -0.9, 0.36, -0.17, 13); this.bolts(ctx, -0.9, 0.36, 0.04, 13);
    this.antenna(ctx, 0.6, -0.27, 0.34);
    this.pennant(ctx, C, 0.46, -0.27, 0.26);
  },

  // ---------- Tracked vehicles ----------
  // BMP-3 (7.14 m, 2.3 m): flat low hull, long glacis with trim vane, turret mid-hull with short 100 mm 2A70 and coaxial 30 mm 2A72.
  ifv(ctx, C) {
    this.e_bmp3(ctx, C);
    this.ao(ctx, -0.32, 0.3, -0.13, 0.035);
    this.P(ctx, [[-0.32, -0.13], [-0.34, -0.2], [-0.28, -0.27], [0.08, -0.29], [0.22, -0.25], [0.3, -0.18], [0.28, -0.13]], C.body);
    this.P(ctx, [[-0.28, -0.27], [-0.24, -0.295], [0.08, -0.312], [0.24, -0.27], [0.22, -0.25], [0.08, -0.29]], Col.adj(C.body, 9));
    this.R(ctx, 0.25, -0.24, 0.08, 0.09, C.dark, null, 0.01);
    this.barrel(ctx, 0.3, -0.215, 1.0, -0.22, 0.036);
    this.R(ctx, 0.96, -0.24, 0.06, 0.04, GUN, null, 0.006);
    this.barrel(ctx, 0.3, -0.165, 1.04, -0.17, 0.015, { brake: 1 });
    this.R(ctx, -0.16, -0.35, 0.08, 0.06, C.dark, null, 0.01); this.R(ctx, -0.11, -0.34, 0.02, 0.035, GLASS, null, 0.004);
    this.R(ctx, 0.06, -0.33, 0.09, 0.045, C.dark, null, 0.008); this.R(ctx, 0.12, -0.325, 0.02, 0.025, GLASS, null, 0.003);
    for (let i = 0; i < 3; i++) this.O(ctx, -0.24 + i * 0.05, -0.24, 0.015, C.dark, null, { noLine: true });
    this.bolts(ctx, -0.26, 0.2, -0.155, 7);
    this.stow(ctx, -0.84, -0.18, 0.2, 0.045, 1);
    this.mark(ctx, -0.42, 0.035, '214', 0.05);
    this.antenna(ctx, -0.3, -0.27, 0.42);
    this.pennant(ctx, C, -0.78, -0.13, 0.3);
  },
  // 2S25 Sprut-SD (7.08 m hull, 9.77 m with gun): very low BMD-3 boat hull, 7 small road wheels with exposed return rollers,
  // big flat turret with long 125 mm 2A75 smoothbore.
  lt(ctx, C) {
    this.tracks(ctx, [[-0.88, 0.16], [-0.85, 0.1], [-0.76, 0.07], [0.7, 0.07], [0.82, 0.09], [0.87, 0.14], [0.8, 0.23], [0.66, 0.3], [-0.64, 0.3], [-0.82, 0.25]],
      [-0.6, -0.4, -0.2, 0.0, 0.2, 0.4, 0.6], 0.225, 0.07, [-0.8, 0.17, 0.065], [0.8, 0.15, 0.06], [-0.5, -0.1, 0.3]);
    this.P(ctx, [[-0.9, 0.08], [-0.92, -0.04], [-0.88, -0.08], [0.28, -0.08], [0.94, 0.04], [0.9, 0.08]], C.body);
    this.topFace(ctx, C, -0.88, 0.3, -0.08, 0.022);
    this.ln(ctx, -0.88, 0.04, 0.88, 0.04, 'rgba(0,0,0,0.45)');
    this.bolts(ctx, -0.84, 0.8, 0.058, 16);
    this.tow(ctx, -0.8, -0.03, 0.2, -0.03);
    this.light(ctx, 0.84, 0.02);
    this.R(ctx, 0.6, -0.04, 0.08, 0.03, C.dark, null, 0.005);
    this.ao(ctx, -0.5, 0.32, -0.08, 0.04);
    this.P(ctx, [[-0.5, -0.08], [-0.62, -0.12], [-0.64, -0.2], [-0.58, -0.31], [-0.3, -0.33], [0.1, -0.33], [0.26, -0.28], [0.34, -0.18], [0.3, -0.09]], C.body);
    this.P(ctx, [[-0.58, -0.31], [-0.54, -0.338], [-0.3, -0.358], [0.1, -0.356], [0.28, -0.3], [0.26, -0.28], [0.1, -0.33], [-0.3, -0.33]], Col.adj(C.body, 9));
    this.ln(ctx, 0.1, -0.32, 0.32, -0.19);
    this.R(ctx, 0.26, -0.25, 0.09, 0.08, C.dark, null, 0.01);
    this.barrel(ctx, 0.32, -0.21, 1.32, -0.215, 0.026);
    for (const x of [0.6, 0.85]) this.ln(ctx, x, -0.226, x, -0.2, 'rgba(255,255,255,0.25)');
    this.R(ctx, 0.0, -0.38, 0.1, 0.05, C.dark, null, 0.008); this.R(ctx, 0.06, -0.375, 0.025, 0.03, GLASS, null, 0.004);
    this.R(ctx, -0.26, -0.39, 0.07, 0.06, C.dark, null, 0.008); this.R(ctx, -0.22, -0.38, 0.02, 0.035, GLASS, null, 0.003);
    for (let i = 0; i < 3; i++) this.L(ctx, 0.14 + i * 0.035, -0.29 + i * 0.015, 0.18 + i * 0.035, -0.31 + i * 0.015, C.dark, 0.016);
    this.bolts(ctx, -0.56, 0.2, -0.13, 10);
    this.stow(ctx, -0.62, -0.37, 0.2, 0.045);
    this.mark(ctx, -0.44, -0.165, '405');
    this.antenna(ctx, -0.42, -0.33, 0.42);
    this.pennant(ctx, C, -0.52, -0.33, 0.28);
  },
  // T-90M Proryv (6.86 m hull, 9.53 m with gun, 2.23 m): low hull, flat dome turret with Relikt ERA wedges, rear bustle with slat
  // cage, 125 mm 2A46M-4 with thermal sleeve, 6 large road wheels (rear sprocket), short rubber skirt with ERA panels at the front.
  mbt(ctx, C) {
    this.tracks(ctx, [[-0.88, 0.16], [-0.85, 0.09], [-0.76, 0.06], [0.72, 0.06], [0.82, 0.08], [0.87, 0.13], [0.8, 0.22], [0.66, 0.3], [-0.64, 0.3], [-0.82, 0.25]],
      [-0.56, -0.33, -0.1, 0.14, 0.37, 0.6], 0.2, 0.095, [-0.8, 0.16, 0.07], [0.8, 0.14, 0.062]);
    this.P(ctx, [[-0.88, 0.06], [-0.9, -0.05], [-0.86, -0.08], [0.36, -0.08], [0.86, 0.0], [0.92, 0.04], [0.88, 0.08]], C.body);
    this.topFace(ctx, C, -0.86, 0.38, -0.08, 0.022);
    this.P(ctx, [[0.36, -0.08], [0.39, -0.1], [0.88, -0.018], [0.86, 0.0]], Col.adj(C.body, 9));
    for (let x = 0.46; x < 0.84; x += 0.09) this.ln(ctx, x, -0.06 + (x - 0.36) * 0.16, x + 0.03, 0.0 + (x - 0.36) * 0.16 - 0.01);
    // Skirt: rubber rear, ERA blocks at the front.
    this.R(ctx, -0.86, -0.01, 1.08, 0.06, '#2f342a', null, 0.005);
    this.P(ctx, [[0.22, -0.02], [0.82, -0.02], [0.88, 0.04], [0.86, 0.09], [0.22, 0.09]], C.body);
    for (const x of [0.37, 0.52, 0.67]) this.ln(ctx, x, -0.01, x, 0.09);
    // Bolted ERA bricks, rubber skirt fixings, tow cable, glacis headlight, unditching log and fuel drum at the rear.
    for (const x of [0.29, 0.44, 0.59, 0.74]) this.bolts(ctx, x - 0.03, x + 0.03, 0.01, 2);
    this.bolts(ctx, -0.84, 0.18, 0.005, 10);
    this.tow(ctx, -0.8, -0.045, 0.3, -0.045);
    this.light(ctx, 0.8, -0.03);
    this.R(ctx, -0.9, -0.13, 0.34, 0.045, '#6b5332', null, 0.02, { camo: false });
    if (this.pass === 'fill' && !this.small) for (const x of [-0.84, -0.64]) this.ln(ctx, x, -0.13, x, -0.085, 'rgba(20,20,20,0.8)', 1.6);
    this.ao(ctx, -0.56, 0.4, -0.08, 0.035);
    // Slat cage behind the bustle.
    this.L(ctx, -0.84, -0.09, -0.84, -0.23, C.dark, 0.014); this.L(ctx, -0.84, -0.23, -0.6, -0.23, C.dark, 0.014);
    for (const x of [-0.78, -0.72, -0.66]) this.L(ctx, x, -0.09, x, -0.23, C.dark, 0.009);
    // Turret: low dome, ERA wedge forward.
    this.P(ctx, [[-0.52, -0.08], [-0.62, -0.12], [-0.64, -0.19], [-0.58, -0.24], [-0.32, -0.27], [0.0, -0.275], [0.14, -0.26], [0.46, -0.15], [0.44, -0.11], [0.3, -0.09]], C.body);
    // Turret dome and Relikt wedges seen slightly from above.
    this.P(ctx, [[-0.58, -0.24], [-0.53, -0.272], [-0.3, -0.298], [0.02, -0.302], [0.18, -0.28], [0.48, -0.168], [0.46, -0.15], [0.14, -0.26], [0.0, -0.275], [-0.32, -0.27]], Col.adj(C.body, 9));
    this.ln(ctx, 0.06, -0.27, 0.44, -0.12); this.ln(ctx, 0.22, -0.215, 0.24, -0.1); this.ln(ctx, 0.34, -0.175, 0.36, -0.1);
    for (let i = 0; i < 4; i++) this.L(ctx, -0.04 + i * 0.035, -0.235, -0.01 + i * 0.035, -0.255, C.dark, 0.015);
    this.R(ctx, 0.26, -0.2, 0.08, 0.07, C.dark, null, 0.01);
    this.barrel(ctx, 0.3, -0.165, 1.32, -0.165, 0.03, { evac: 0.42 });
    for (const x of [0.62, 0.9, 1.12]) this.ln(ctx, x, -0.18, x, -0.15, 'rgba(255,255,255,0.25)');
    this.R(ctx, -0.16, -0.33, 0.08, 0.06, C.dark, null, 0.01); this.R(ctx, -0.1, -0.325, 0.02, 0.04, GLASS, null, 0.004);
    this.glint(ctx, -0.09, -0.315, 0.008);
    this.R(ctx, 0.04, -0.31, 0.08, 0.04, C.dark, null, 0.006); this.R(ctx, 0.09, -0.305, 0.02, 0.025, GLASS, null, 0.003);
    this.R(ctx, -0.34, -0.315, 0.08, 0.045, C.dark, null, 0.008); this.L(ctx, -0.26, -0.3, -0.12, -0.3, GUN, 0.01);
    this.bolts(ctx, -0.58, -0.08, -0.12, 7);
    this.stow(ctx, -0.62, -0.285, 0.18, 0.045);
    this.mark(ctx, -0.5, -0.125, '137');
    this.exhaust(ctx, -0.5, -0.08, 0.12, 0.03);
    this.antenna(ctx, -0.28, -0.27, 0.44);
    this.pennant(ctx, C, -0.5, -0.25, 0.3);
  },
  // 2S19M2 Msta-S (7.15 m hull, 11.9 m with gun, 3 m): T-80/T-72 running gear (6 wheels, 5 return rollers), huge box turret,
  // long 152 mm 2A64 with bore evacuator and multi-baffle brake, remote 12.7 mm on the cupola.
  spg(ctx, C) {
    this.tracks(ctx, [[-0.88, 0.16], [-0.85, 0.09], [-0.76, 0.06], [0.72, 0.06], [0.82, 0.08], [0.87, 0.13], [0.8, 0.22], [0.66, 0.3], [-0.64, 0.3], [-0.82, 0.25]],
      [-0.56, -0.33, -0.1, 0.14, 0.37, 0.6], 0.205, 0.09, [-0.8, 0.16, 0.07], [0.8, 0.14, 0.062], [-0.45, -0.22, 0.02, 0.26, 0.49]);
    this.P(ctx, [[-0.88, 0.04], [-0.9, -0.05], [-0.86, -0.08], [0.38, -0.08], [0.86, 0.0], [0.92, 0.03], [0.88, 0.05]], C.body);
    this.P(ctx, [[0.24, -0.08], [0.27, -0.1], [0.4, -0.1], [0.88, -0.018], [0.86, 0.0], [0.38, -0.08]], Col.adj(C.body, 9));
    this.R(ctx, -0.86, 0.02, 1.7, 0.025, C.dark, null, 0.005);
    this.bolts(ctx, -0.84, 0.8, 0.032, 16);
    this.tow(ctx, 0.3, -0.06, 0.7, -0.04);
    this.light(ctx, 0.82, -0.02);
    this.ao(ctx, -0.88, 0.28, -0.08, 0.04);
    this.P(ctx, [[-0.86, -0.08], [-0.9, -0.12], [-0.9, -0.39], [-0.86, -0.42], [0.08, -0.42], [0.2, -0.37], [0.28, -0.2], [0.26, -0.08]], C.body);
    this.topFace(ctx, C, -0.86, 0.1, -0.42, 0.03);
    this.R(ctx, -0.5, -0.24, 0.14, 0.14, C.dark, null, 0.01);
    this.ln(ctx, -0.2, -0.41, -0.2, -0.09); this.ln(ctx, 0.08, -0.42, 0.26, -0.09);
    this.R(ctx, -0.76, -0.22, 0.16, 0.08, Col.adj(C.dark, 6), null, 0.01);
    // Cupola with remote 12.7 mm, gunner sight.
    this.R(ctx, -0.36, -0.47, 0.14, 0.05, C.dark, null, 0.01);
    this.L(ctx, -0.24, -0.47, -0.06, -0.47, GUN, 0.014);
    this.R(ctx, -0.04, -0.46, 0.07, 0.04, C.dark, null, 0.006); this.R(ctx, 0.0, -0.455, 0.02, 0.025, GLASS, null, 0.003);
    this.R(ctx, 0.2, -0.32, 0.1, 0.1, C.dark, null, 0.01);
    this.barrel(ctx, 0.26, -0.27, 1.3, -0.43, 0.027, { evac: 0.38 });
    ctx.save(); ctx.translate(1.27, -0.425); ctx.rotate(Math.atan2(-0.16, 1.04));
    this.R(ctx, -0.06, -0.026, 0.12, 0.052, GUN, null, 0.008);
    if (this.pass === 'fill') { ctx.fillStyle = '#0d0f0d'; for (const dx of [-0.035, -0.01, 0.015, 0.04]) ctx.fillRect(dx - 0.005, -0.018, 0.01, 0.036); }
    ctx.restore();
    this.bolts(ctx, -0.86, 0.22, -0.12, 11);
    this.smoke(ctx, C, 0.0, -0.42, 3, -0.8, 0.03);
    this.stow(ctx, -0.88, -0.37, 0.2, 0.05, 1);
    this.mark(ctx, -0.3, -0.16, '318');
    this.net(ctx, 0.3, -0.06, 0.24, 0.04);
    this.antenna(ctx, -0.6, -0.42, 0.42);
    this.pennant(ctx, C, -0.84, -0.42, 0.26);
  },
});

// Animated overlays (no ×1.12 land stretch here: model y maps to 0.3 + (y - 0.3) * 1.12).
Object.assign(Models.animE, {
  aa(ctx, C, now) {
    // Pantsir search radar: rectangular PESA panel on a mast, width follows cos to fake the rotation.
    const Y = (y) => 0.3 + (y - 0.3) * 1.12;
    const k = Math.cos(now * 2.2), w = 0.2 * Math.max(0.12, Math.abs(k));
    ctx.fillStyle = '#2b3030'; ctx.fillRect(-0.345, Y(-0.46), 0.03, Y(-0.43) - Y(-0.46));
    ctx.beginPath(); ctx.rect(-0.33 - w, Y(-0.64), w * 2, Y(-0.46) - Y(-0.64));
    ctx.fillStyle = k > 0 ? '#5e6a52' : '#3e4836'; ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = Models.lw * 1.6; ctx.stroke();
    if (k > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = Models.lw; ctx.beginPath();
      for (let i = 1; i < 4; i++) { const yy = Y(-0.64) + i * (Y(-0.46) - Y(-0.64)) / 4; ctx.moveTo(-0.33 - w, yy); ctx.lineTo(-0.33 + w, yy); }
      ctx.stroke();
    }
  },
});
