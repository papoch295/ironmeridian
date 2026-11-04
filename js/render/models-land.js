// Western ground vehicle models (wheeled and tracked). Drawn with the helpers in models.js.
'use strict';

// Western (P) models.
Object.assign(Models.m, {
  // JLTV M1278 Heavy Guns Carrier (6.2 m, 2.6 m tall): high sloped hood, short four-door armoured cab with small thick
  // windows, big tyres on independent suspension (high clearance, V-belly), gunner in an O-GPK shield with an M2 on the roof.
  recon(ctx, C) {
    this.P(ctx, [[-0.86, 0.06], [-0.89, -0.1], [-0.42, -0.11], [-0.4, -0.35], [-0.36, -0.37], [0.12, -0.37], [0.3, -0.15], [0.78, -0.09], [0.87, -0.04], [0.88, 0.05],
      [0.74, 0.06], [0.7, -0.02], [0.6, -0.07], [0.44, -0.07], [0.34, -0.02], [0.3, 0.06], [0.0, 0.1], [-0.3, 0.06], [-0.34, -0.02], [-0.44, -0.07], [-0.6, -0.07], [-0.7, -0.02], [-0.74, 0.06]], C.body);
    this.topFace(ctx, C, -0.36, 0.12, -0.37, 0.024);
    this.topFace(ctx, C, -0.86, -0.42, -0.105, 0.018);
    this.P(ctx, [[0.3, -0.15], [0.33, -0.172], [0.78, -0.112], [0.78, -0.09]], Col.adj(C.body, 9));
    this.P(ctx, [[-0.04, -0.33], [0.1, -0.33], [0.22, -0.17], [-0.04, -0.17]], GLASS);
    this.R(ctx, -0.34, -0.33, 0.24, 0.15, GLASS, null, 0.01);
    this.glint(ctx, 0.02, -0.29);
    this.ln(ctx, -0.07, -0.36, -0.07, 0.06); this.ln(ctx, -0.39, -0.12, -0.39, 0.03); this.ln(ctx, 0.27, -0.14, 0.27, 0.04);
    for (let x = 0.42; x < 0.66; x += 0.06) this.ln(ctx, x, -0.12, x + 0.03, -0.1);
    this.R(ctx, 0.8, -0.06, 0.07, 0.04, '#d9d4b0', null, 0.01);
    this.R(ctx, 0.84, 0.0, 0.06, 0.07, C.dark, null, 0.01);
    this.R(ctx, 0.26, -0.24, 0.03, 0.07, C.dark, null, 0.005);
    if (this.pass === 'fill') for (const x of [0.52, -0.52]) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(x, 0.12, 0.2, Math.PI, 0); ctx.fill(); }
    this.wheels(ctx, [0.52, -0.52], 0.18);
    // Gunner protection kit: ring, shield with armoured glass, gunner, M2.
    this.R(ctx, -0.3, -0.42, 0.32, 0.05, C.dark, null, 0.01);
    this.R(ctx, -0.2, -0.54, 0.13, 0.1, C.cloth, null, 0.03);
    this.O(ctx, -0.135, -0.585, 0.058, Col.adj(C.cloth, -8));
    this.P(ctx, [[-0.32, -0.4], [0.0, -0.4], [0.0, -0.49], [-0.27, -0.49]], C.body);
    this.L(ctx, 0.02, -0.47, 0.44, -0.47, GUN, 0.024);
    this.R(ctx, 0.4, -0.487, 0.05, 0.034, GUN, null, 0.004);
    this.R(ctx, -0.04, -0.5, 0.09, 0.06, C.dark, null, 0.008);
    this.P(ctx, [[-0.03, -0.4], [0.07, -0.4], [0.08, -0.64], [-0.03, -0.66]], C.body);
    this.R(ctx, -0.01, -0.62, 0.065, 0.08, GLASS, null, 0.005);
    this.mirror(ctx, 0.2, -0.2);
    this.stow(ctx, -0.86, -0.155, 0.2, 0.045, 1);
    this.bolts(ctx, -0.36, 0.22, -0.13, 8);
    this.antenna(ctx, -0.66, -0.11, 0.42);
    this.pennant(ctx, C, -0.8, -0.1, 0.36);
  },

  // ---------- Wheeled vehicles ----------
  // HEMTT M977A4 (10.2 m, 8x8): blunt cab with armoured windscreen and exhaust stack behind it, long dropside cargo
  // bed with a folded loading crane at the very rear, two widely separated tandem axle pairs, big single tyres.
  truck(ctx, C) {
    this.R(ctx, -0.88, 0.03, 1.78, 0.05, C.dark, null, 0.01);
    this.R(ctx, -0.22, 0.04, 0.4, 0.09, C.dark, null, 0.02);
    this.ln(ctx, -0.02, 0.05, -0.02, 0.12, 'rgba(255,255,255,0.15)');
    this.P(ctx, [[-0.9, 0.04], [-0.9, -0.11], [0.24, -0.11], [0.24, 0.04]], C.body);
    for (let x = -0.76; x < 0.2; x += 0.12) this.ln(ctx, x, -0.1, x, 0.03);
    this.ln(ctx, -0.9, -0.04, 0.24, -0.04);
    this.R(ctx, -0.66, -0.25, 0.84, 0.14, '#6f6b52', null, 0.03);
    this.topFace(ctx, C, -0.66, 0.18, -0.25, 0.022, '#837d62');
    for (const x of [-0.38, -0.1]) this.ln(ctx, x, -0.24, x, -0.12, 'rgba(0,0,0,0.3)');
    // Rear loading crane: column and folded boom.
    this.R(ctx, -0.88, -0.32, 0.07, 0.22, C.dark, null, 0.01);
    this.L(ctx, -0.84, -0.3, -0.5, -0.29, C.dark, 0.03);
    this.R(ctx, 0.26, -0.37, 0.035, 0.3, C.dark, null, 0.01);
    this.P(ctx, [[0.32, 0.08], [0.32, -0.27], [0.36, -0.3], [0.8, -0.3], [0.86, -0.27], [0.91, -0.08], [0.93, -0.04], [0.93, 0.08]], C.body);
    this.topFace(ctx, C, 0.36, 0.8, -0.3, 0.024);
    this.P(ctx, [[0.72, -0.27], [0.84, -0.27], [0.88, -0.11], [0.72, -0.11]], GLASS);
    this.R(ctx, 0.46, -0.26, 0.2, 0.13, GLASS, null, 0.01);
    this.glint(ctx, 0.76, -0.23);
    this.bolts(ctx, 0.36, 0.86, -0.06, 8);
    this.R(ctx, 0.62, -0.06, 0.05, 0.015, Col.adj(C.body, -12), null, 0.004);
    this.ln(ctx, 0.42, -0.29, 0.42, 0.06); this.ln(ctx, 0.69, -0.29, 0.69, 0.06);
    this.R(ctx, 0.86, -0.06, 0.07, 0.11, C.dark, null, 0.01);
    this.R(ctx, 0.88, -0.05, 0.04, 0.03, '#d9d4b0', null, 0.005);
    this.R(ctx, 0.82, 0.06, 0.12, 0.035, C.dark, null, 0.01);
    this.wheels(ctx, [0.72, 0.46, -0.44, -0.7], 0.128);
    this.mirror(ctx, 0.9, -0.17);
    this.net(ctx, -0.62, -0.3, 0.44);
    this.stow(ctx, -0.14, -0.29, 0.22, 0.04, 2);
    this.bolts(ctx, -0.86, 0.2, 0.005, 14);
    for (const x of [0.3, -0.3]) this.R(ctx, x, 0.04, 0.03, 0.12, '#1d201b', null, 0.004);
    this.antenna(ctx, 0.5, -0.29, 0.36);
    this.pennant(ctx, C, 0.38, -0.3, 0.26);
  },
  // Stryker M1126 ICV (6.95 m, 8x8): slab sides, sloped nose with driver's periscopes, gap between axles 2 and 3,
  // commander's cupola and M151/CROWS remote weapon station with an M2 above the troop compartment.
  apc(ctx, C) {
    this.stryker(ctx, C);
    this.R(ctx, -0.5, -0.29, 0.12, 0.05, C.dark, null, 0.01);
    this.R(ctx, -0.16, -0.28, 0.24, 0.04, C.dark, null, 0.01);
    this.P(ctx, [[-0.12, -0.28], [-0.12, -0.36], [-0.06, -0.39], [0.06, -0.39], [0.06, -0.28]], Col.adj(C.dark, 8));
    this.R(ctx, 0.04, -0.42, 0.09, 0.07, C.dark, null, 0.01); this.R(ctx, 0.1, -0.41, 0.03, 0.04, GLASS, null, 0.004);
    this.R(ctx, -0.13, -0.35, 0.06, 0.05, Col.adj(C.dark, -6), null, 0.005);
    this.L(ctx, 0.04, -0.33, 0.44, -0.33, GUN, 0.02);
    this.R(ctx, 0.4, -0.345, 0.05, 0.03, GUN, null, 0.004);
    this.bolts(ctx, -0.84, 0.28, -0.17, 12);
    this.light(ctx, 0.86, -0.06);
    this.smoke(ctx, C, 0.24, -0.26, 3, -0.7, 0.03);
    this.stow(ctx, -0.86, -0.29, 0.26, 0.05, 1);
    this.mark(ctx, -0.72, -0.07, 'B12', 0.05);
    this.exhaust(ctx, 0.5, -0.215, 0.07, 0.03);
    this.antenna(ctx, -0.62, -0.24, 0.42);
    this.pennant(ctx, C, -0.78, -0.24, 0.32);
  },
  // M1134 ATGM: Stryker hull with a raised twin TOW launcher.
  td(ctx, C) {
    this.stryker(ctx, C);
    this.P(ctx, [[-0.12, -0.24], [-0.08, -0.36], [0.02, -0.36], [0.06, -0.24]], C.dark);
    this.L(ctx, -0.03, -0.36, -0.03, -0.42, C.dark, 0.03);
    this.P(ctx, [[-0.3, -0.4], [0.22, -0.43], [0.23, -0.52], [-0.29, -0.49]], C.body);
    this.O(ctx, 0.225, -0.455, 0.02, '#1a1c19', null, { noLine: true }); this.O(ctx, 0.225, -0.5, 0.02, '#1a1c19', null, { noLine: true });
    this.R(ctx, 0.08, -0.39, 0.06, 0.03, GLASS, null, 0.005);
    this.bolts(ctx, -0.84, 0.28, -0.17, 12);
    this.light(ctx, 0.86, -0.06);
    this.stow(ctx, -0.86, -0.29, 0.2, 0.05, 1);
    this.mark(ctx, -0.72, -0.07, 'C21', 0.05);
    this.antenna(ctx, -0.62, -0.24, 0.42);
    this.pennant(ctx, C, -0.78, -0.24, 0.32);
  },
  // AN/TWQ-1 Avenger (4.95 m, 2.64 m tall): heavy HMMWV with low wide hood and two-door cab; the gyro-stabilised
  // turret with its glazed gunner's canopy sits on the rear bed, a 4-round Stinger pod on each side, raised for firing.
  aa(ctx, C) {
    this.P(ctx, [[-0.88, 0.06], [-0.9, -0.08], [-0.04, -0.09], [-0.02, -0.3], [0.2, -0.3], [0.34, -0.11], [0.8, -0.07], [0.88, -0.03], [0.89, 0.05],
      [0.76, 0.06], [0.72, -0.01], [0.62, -0.05], [0.44, -0.05], [0.34, -0.01], [0.3, 0.06], [-0.32, 0.06], [-0.36, -0.01], [-0.46, -0.05], [-0.64, -0.05], [-0.74, -0.01], [-0.78, 0.06]], C.body);
    this.topFace(ctx, C, -0.02, 0.2, -0.3, 0.022);
    this.P(ctx, [[0.34, -0.11], [0.36, -0.13], [0.8, -0.09], [0.8, -0.07]], Col.adj(C.body, 9));
    this.P(ctx, [[0.02, -0.27], [0.18, -0.27], [0.29, -0.12], [0.02, -0.12]], GLASS);
    this.glint(ctx, 0.07, -0.23);
    this.ln(ctx, 0.0, -0.09, 0.0, 0.05); this.ln(ctx, 0.34, -0.1, 0.34, 0.03);
    for (let x = 0.44; x < 0.72; x += 0.07) this.ln(ctx, x, -0.09, x + 0.03, -0.075);
    this.R(ctx, 0.83, -0.05, 0.06, 0.035, '#d9d4b0', null, 0.01);
    if (this.pass === 'fill') for (const x of [0.53, -0.55]) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(x, 0.15, 0.17, Math.PI, 0); ctx.fill(); }
    this.wheels(ctx, [0.53, -0.55], 0.155);
    // Turret: ring, body with canopy, Stinger pod on the near side (elevated ~22°), FLIR/rangefinder box.
    this.R(ctx, -0.68, -0.13, 0.4, 0.05, C.dark, null, 0.01);
    this.ao(ctx, -0.66, -0.3, -0.08, 0.04);
    this.P(ctx, [[-0.72, -0.13], [-0.74, -0.4], [-0.68, -0.5], [-0.38, -0.5], [-0.3, -0.42], [-0.29, -0.13]], C.body);
    this.topFace(ctx, C, -0.68, -0.38, -0.5, 0.022);
    this.bolts(ctx, -0.7, -0.33, -0.2, 6);
    this.P(ctx, [[-0.66, -0.48], [-0.4, -0.48], [-0.34, -0.41], [-0.66, -0.41]], GLASS);
    this.glint(ctx, -0.6, -0.45, 0.015);
    this.R(ctx, -0.31, -0.33, 0.07, 0.06, C.dark, null, 0.01); this.R(ctx, -0.26, -0.32, 0.025, 0.035, GLASS, null, 0.004);
    ctx.save(); ctx.translate(-0.54, -0.22); ctx.rotate(-0.4);
    this.R(ctx, -0.2, -0.09, 0.64, 0.18, Col.adj(C.body, 10), null, 0.02);
    this.ln(ctx, -0.18, 0.0, 0.41, 0.0, 'rgba(0,0,0,0.4)');
    this.R(ctx, 0.4, -0.09, 0.045, 0.18, C.dark, null, 0.01);
    for (const y of [-0.045, 0.045]) this.O(ctx, 0.423, y, 0.03, '#c4c9bf', null, { noLine: true, flat: true });
    this.O(ctx, 0.0, 0.0, 0.04, C.dark);
    ctx.restore();
    this.mirror(ctx, 0.26, -0.18);
    this.bolts(ctx, -0.7, -0.32, -0.15, 5);
    this.stow(ctx, -0.88, -0.13, 0.14, 0.04);
    this.antenna(ctx, -0.25, -0.13, 0.4);
    this.pennant(ctx, C, 0.0, -0.3, 0.26);
  },
  // M777 155 mm towed howitzer (10.7 m deployed): split trails, two wheels, barrel elevated ~25°.
  arty(ctx, C) {
    ctx.save(); ctx.translate(0.03, -0.02);
    this.P(ctx, [[0.0, -0.06], [0.06, -0.04], [-0.86, 0.28], [-0.9, 0.26]], Col.adj(C.dark, -6));
    ctx.restore();
    this.P(ctx, [[0.0, -0.06], [0.06, -0.04], [-0.86, 0.28], [-0.9, 0.26]], C.dark);
    this.P(ctx, [[-0.92, 0.24], [-0.84, 0.24], [-0.86, 0.31], [-0.92, 0.31]], C.dark);
    this.P(ctx, [[0.1, 0.24], [0.3, 0.24], [0.32, 0.3], [0.08, 0.3]], C.dark);
    this.barrel(ctx, -0.2, 0.02, 1.02, -0.55, 0.03);
    ctx.save(); ctx.translate(1.0, -0.54); ctx.rotate(Math.atan2(-0.57, 1.22));
    this.R(ctx, -0.05, -0.028, 0.1, 0.056, GUN, null, 0.008);
    ctx.restore();
    this.L(ctx, -0.1, -0.06, 0.4, -0.29, C.body, 0.022);
    ctx.save(); ctx.translate(-0.2, 0.02); ctx.rotate(Math.atan2(-0.57, 1.22));
    this.R(ctx, 0, -0.035, 0.45, 0.07, C.body, null, 0.015);
    ctx.restore();
    this.R(ctx, -0.27, -0.03, 0.09, 0.07, C.dark, null, 0.01);
    this.P(ctx, [[-0.18, 0.05], [-0.12, -0.04], [0.14, -0.06], [0.24, 0.0], [0.2, 0.1], [-0.1, 0.12]], C.body);
    this.L(ctx, 0.1, 0.0, 0.25, -0.17, C.dark, 0.012);
    this.wheel(ctx, 0.02, 0.2, 0.1);
    this.bolts(ctx, -0.12, 0.16, 0.08, 5);
    // Gun crew: loader kneeling at the breech with a 155 mm round, ammunition crates on the ground behind.
    this.R(ctx, -0.82, 0.18, 0.14, 0.12, '#5a5236', null, 0.01, { camo: false });
    this.R(ctx, -0.66, 0.21, 0.12, 0.09, '#5a5236', null, 0.01, { camo: false });
    this.bolts(ctx, -0.8, -0.7, 0.2, 2); this.bolts(ctx, -0.64, -0.56, 0.23, 2);
    this.soldier(ctx, C, -0.42, 0.62, { pose: 'kneel', weapon: 'none', hand: [0.2, -0.3], pack: false });
    this.L(ctx, -0.36, 0.08, -0.22, 0.04, '#8a7a45', 0.04);
    this.pennant(ctx, C, -0.6, 0.18, 0.38);
  },

  // ---------- Tracked vehicles ----------
  // SPz Puma (7.4 m, 3.1 m to turret roof): high flat-topped hull with a long shallow glacis, deep modular armour skirts
  // hiding the upper half of the 6 evenly spaced road wheels (front sprocket), low unmanned turret with a long slim
  // 30 mm MK30-2/ABM, Spike LR (MELLS) twin launcher on the turret side and the commander's PERI sight on a tall mast.
  ifv(ctx, C) {
    this.tracks(ctx, [[-0.87, 0.15], [-0.83, 0.07], [-0.73, 0.05], [0.7, 0.05], [0.82, 0.07], [0.87, 0.13], [0.81, 0.22], [0.65, 0.3], [-0.63, 0.3], [-0.8, 0.24]],
      [-0.56, -0.335, -0.11, 0.115, 0.34, 0.565], 0.214, 0.084, [0.79, 0.13, 0.072], [-0.79, 0.15, 0.068]);
    this.P(ctx, [[-0.9, 0.1], [-0.92, -0.17], [-0.88, -0.2], [0.34, -0.2], [0.86, -0.06], [0.93, -0.01], [0.9, 0.06], [0.8, 0.1]], C.body);
    this.topFace(ctx, C, -0.88, 0.34, -0.2, 0.026);
    this.P(ctx, [[0.34, -0.2], [0.37, -0.224], [0.88, -0.078], [0.86, -0.06]], Col.adj(C.body, 9));
    this.ln(ctx, 0.34, -0.2, 0.34, -0.07);
    this.P(ctx, [[-0.89, -0.07], [0.7, -0.07], [0.84, -0.01], [0.82, 0.17], [-0.89, 0.17]], Col.adj(C.body, -6));
    for (const x of [-0.6, -0.3, 0.0, 0.3, 0.58]) this.ln(ctx, x, -0.07, x, 0.17);
    this.ln(ctx, -0.89, 0.13, 0.82, 0.13);
    this.bolts(ctx, -0.86, 0.78, -0.05, 16); this.bolts(ctx, -0.86, 0.78, 0.112, 16);
    this.tow(ctx, -0.84, -0.105, 0.3, -0.105);
    this.light(ctx, 0.87, -0.03);
    this.stow(ctx, -0.84, -0.245, 0.2, 0.045, 1);
    // Turret.
    this.ao(ctx, -0.32, 0.3, -0.2, 0.04);
    this.P(ctx, [[-0.32, -0.2], [-0.34, -0.31], [-0.3, -0.36], [0.12, -0.36], [0.26, -0.31], [0.3, -0.24], [0.26, -0.2]], C.body);
    this.topFace(ctx, C, -0.3, 0.12, -0.36, 0.026);
    this.ln(ctx, 0.12, -0.36, 0.24, -0.22);
    this.R(ctx, -0.27, -0.345, 0.3, 0.08, Col.adj(C.dark, 6), null, 0.012);
    this.R(ctx, 0.01, -0.345, 0.025, 0.08, C.dark, null, 0.006);
    if (this.pass === 'fill' && !this.small) { ctx.fillStyle = '#121411'; for (const y of [-0.325, -0.285]) { ctx.beginPath(); ctx.arc(0.023, y, 0.012, 0, Math.PI * 2); ctx.fill(); } }
    this.R(ctx, 0.2, -0.3, 0.1, 0.075, C.dark, null, 0.01);
    this.barrel(ctx, 0.28, -0.265, 1.08, -0.265, 0.022);
    this.R(ctx, 0.28, -0.28, 0.24, 0.03, GUN, null, 0.008);
    this.R(ctx, 1.04, -0.28, 0.05, 0.03, GUN, null, 0.004);
    this.R(ctx, 0.04, -0.41, 0.09, 0.05, C.dark, null, 0.01); this.R(ctx, 0.1, -0.405, 0.025, 0.035, GLASS, null, 0.004);
    this.L(ctx, -0.2, -0.36, -0.2, -0.47, C.dark, 0.03);
    this.R(ctx, -0.26, -0.53, 0.12, 0.07, C.dark, null, 0.012); this.R(ctx, -0.17, -0.52, 0.03, 0.045, GLASS, null, 0.004);
    this.glint(ctx, -0.155, -0.51, 0.008);
    this.smoke(ctx, C, -0.06, -0.36, 3, -0.9, 0.028);
    this.bolts(ctx, -0.28, 0.2, -0.225, 7);
    this.mark(ctx, -0.42, 0.03, '322', 0.055);
    this.exhaust(ctx, 0.62, -0.15, 0.08, 0.04);
    this.hatch(ctx, C, 0.42, -0.19, 0.1);
    this.antenna(ctx, -0.7, -0.2, 0.4);
    this.pennant(ctx, C, -0.82, -0.2, 0.32);
  },
  // M10 Booker (ASCOD 2 hull, ~8.4 m with gun, 7 road wheels, front sprocket, return rollers above a short skirt):
  // tall hull with a steep short nose, big upright box turret with flat faces and a long overhanging bustle,
  // slim 105 mm M35 gun with bore evacuator and no muzzle brake, tall commander's sight and roof MG.
  lt(ctx, C) {
    this.tracks(ctx, [[-0.87, 0.14], [-0.83, 0.07], [-0.73, 0.05], [0.7, 0.05], [0.82, 0.07], [0.87, 0.12], [0.81, 0.22], [0.66, 0.3], [-0.64, 0.3], [-0.8, 0.23]],
      [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6], 0.214, 0.078, [0.8, 0.13, 0.07], [-0.8, 0.15, 0.066], [-0.5, -0.1, 0.3]);
    this.P(ctx, [[-0.9, 0.08], [-0.92, -0.16], [-0.88, -0.18], [0.56, -0.18], [0.84, -0.1], [0.92, 0.0], [0.9, 0.06], [0.8, 0.08]], C.body);
    this.topFace(ctx, C, -0.88, 0.56, -0.18, 0.026);
    this.P(ctx, [[0.56, -0.18], [0.59, -0.204], [0.86, -0.118], [0.84, -0.1]], Col.adj(C.body, 9));
    this.P(ctx, [[-0.89, -0.05], [0.72, -0.05], [0.84, -0.01], [0.84, 0.06], [-0.89, 0.06]], Col.adj(C.body, -6));
    for (const x of [-0.5, -0.1, 0.3]) this.ln(ctx, x, -0.05, x, 0.06);
    this.bolts(ctx, -0.86, 0.8, -0.032, 15); this.bolts(ctx, -0.86, 0.8, 0.045, 15);
    this.tow(ctx, -0.84, -0.11, 0.48, -0.11);
    this.light(ctx, 0.87, -0.04);
    this.R(ctx, 0.66, -0.15, 0.06, 0.04, C.dark, null, 0.008);
    this.ao(ctx, -0.5, 0.3, -0.18, 0.05);
    this.P(ctx, [[-0.42, -0.18], [-0.44, -0.24], [-0.74, -0.25], [-0.76, -0.3], [-0.74, -0.42], [-0.68, -0.45], [0.14, -0.45], [0.3, -0.41], [0.34, -0.3], [0.32, -0.18]], C.body);
    this.topFace(ctx, C, -0.68, 0.16, -0.45, 0.028);
    this.ln(ctx, -0.44, -0.24, -0.44, -0.44); this.ln(ctx, 0.14, -0.45, 0.14, -0.19);
    this.R(ctx, -0.66, -0.4, 0.18, 0.1, Col.adj(C.dark, 6), null, 0.01);
    this.R(ctx, 0.2, -0.43, 0.08, 0.04, C.dark, null, 0.008);
    this.R(ctx, 0.27, -0.34, 0.1, 0.11, C.dark, null, 0.012);
    this.barrel(ctx, 0.36, -0.285, 1.26, -0.285, 0.026, { evac: 0.42 });
    this.R(ctx, 1.22, -0.302, 0.04, 0.034, GUN, null, 0.004);
    this.R(ctx, -0.14, -0.53, 0.09, 0.08, C.dark, null, 0.012); this.R(ctx, -0.08, -0.52, 0.025, 0.045, GLASS, null, 0.004);
    this.glint(ctx, -0.07, -0.51, 0.008);
    this.R(ctx, -0.4, -0.5, 0.1, 0.05, C.dark, null, 0.01); this.L(ctx, -0.3, -0.48, -0.16, -0.48, GUN, 0.012);
    this.bolts(ctx, -0.4, 0.1, -0.26, 8);
    this.smoke(ctx, C, 0.16, -0.45, 3, -0.7, 0.03);
    this.stow(ctx, -0.74, -0.5, 0.18, 0.05);
    this.mark(ctx, -0.36, -0.25, '12');
    this.net(ctx, -0.88, -0.225, 0.3);
    this.antenna(ctx, -0.56, -0.45, 0.44);
    this.pennant(ctx, C, -0.66, -0.45, 0.28);
  },
  // M1A2 Abrams (7.93 m hull, 9.77 m with gun, 2.44 m), drawn like a technical illustration: tall rear engine block,
  // long flat angular turret with a pointed nose and a tubular stowage rack along its side, mesh bustle rack at the
  // rear, 7 road wheels (wider gap before the front pair), rear sprocket exposed behind a short skirt piece, deep side
  // skirts with panel seams. Deck and turret roof are shown slightly from above.
  mbt(ctx, C) {
    const b = C.body, top = Col.adj(b, 9), dk = Col.adj(b, -10), rail = Col.adj(C.dark, 10);
    this.tracks(ctx, [[-0.87, 0.12], [-0.82, 0.05], [-0.72, 0.035], [0.78, 0.05], [0.86, 0.11], [0.81, 0.23], [0.67, 0.3], [-0.67, 0.3], [-0.82, 0.22]],
      [-0.575, -0.405, -0.235, -0.065, 0.105, 0.275, 0.5], 0.218, 0.078, [-0.75, 0.11, 0.075], [0.75, 0.12, 0.06]);
    // Hull: rear engine compartment, low deck, long glacis to a sharp nose; upper surfaces seen from above.
    this.P(ctx, [[-0.91, 0.03], [-0.92, -0.2], [-0.89, -0.235], [-0.56, -0.235], [-0.53, -0.13], [0.58, -0.13], [0.9, -0.05], [0.92, -0.02], [0.9, 0.03]], b);
    this.P(ctx, [[-0.89, -0.235], [-0.86, -0.262], [-0.58, -0.262], [-0.56, -0.235]], top);
    this.P(ctx, [[0.58, -0.13], [0.61, -0.152], [0.9, -0.068], [0.9, -0.05]], top);
    this.ln(ctx, -0.92, -0.12, -0.56, -0.12);
    // Rear: grille doors with round access covers, exhaust mesh, tail lights.
    for (const y of [-0.215, -0.11]) {
      this.R(ctx, -0.88, y, 0.13, 0.085, Col.adj(b, -3), null, 0.01);
      this.O(ctx, -0.815, y + 0.042, 0.026, Col.adj(b, -6));
      if (this.pass === 'fill' && !this.small) { ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = this.lw; ctx.beginPath(); ctx.arc(-0.815, y + 0.042, 0.016, 0, Math.PI * 2); ctx.stroke(); }
    }
    this.R(ctx, -0.72, -0.15, 0.15, 0.035, '#2d2c26', null, 0.004);
    if (this.pass === 'fill' && !this.small) for (let x = -0.71; x < -0.57; x += 0.012) this.ln(ctx, x, -0.15, x, -0.115, 'rgba(150,140,110,0.35)');
    this.R(ctx, -0.93, -0.25, 0.04, 0.025, dk, null, 0.004);
    // Side skirts: short rear piece (sprocket exposed below it), long main skirt with seams, handles and bolts.
    this.P(ctx, [[-0.88, -0.04], [0.7, -0.04], [0.84, -0.025], [0.92, 0.02], [0.9, 0.1], [0.84, 0.15], [-0.62, 0.16], [-0.63, 0.045], [-0.88, 0.035]], b);
    this.ln(ctx, -0.88, -0.018, 0.86, -0.018);
    for (const x of [-0.63, -0.32, 0.04, 0.18, 0.37]) this.ln(ctx, x, -0.04, x, 0.155);
    for (const x of [-0.26, -0.13]) this.R(ctx, x, -0.05, 0.05, 0.015, dk, null, 0.004);
    for (const x of [-0.6, -0.29, 0.07, 0.21, 0.4]) { this.bolts(ctx, x, x, 0.0, 1); this.bolts(ctx, x, x, 0.12, 1); }
    this.R(ctx, 0.6, 0.085, 0.045, 0.028, dk, null, 0.004);
    this.R(ctx, 0.36, 0.04, 0.012, 0.05, dk, null, 0.003);
    this.P(ctx, [[0.66, -0.04], [0.8, -0.062], [0.92, -0.02], [0.84, -0.025], [0.7, -0.04]], top);
    this.light(ctx, 0.88, -0.07);
    // Turret: roof (from above), side face, angled front face.
    this.ao(ctx, -0.45, 0.42, -0.13, 0.03);
    this.P(ctx, [[-0.6, -0.245], [-0.56, -0.32], [0.1, -0.345], [0.42, -0.28], [0.38, -0.245]], top);
    this.P(ctx, [[-0.6, -0.245], [0.38, -0.245], [0.5, -0.207], [0.49, -0.13], [0.25, -0.064], [-0.42, -0.075], [-0.6, -0.12]], b);
    this.P(ctx, [[0.38, -0.245], [0.42, -0.28], [0.53, -0.215], [0.5, -0.207]], Col.adj(b, -5));
    this.ln(ctx, -0.42, -0.075, -0.44, -0.245); this.ln(ctx, 0.25, -0.064, 0.31, -0.245);
    // Mesh bustle rack at the turret rear.
    this.R(ctx, -0.62, -0.35, 0.16, 0.12, Col.adj(b, -4), null, 0.008);
    if (this.pass === 'fill' && !this.small) {
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = this.lw; ctx.beginPath();
      for (let x = -0.61; x < -0.46; x += 0.016) { ctx.moveTo(x, -0.345); ctx.lineTo(x, -0.235); }
      for (let y = -0.34; y < -0.235; y += 0.016) { ctx.moveTo(-0.615, y); ctx.lineTo(-0.465, y); }
      ctx.stroke();
      this.ln(ctx, -0.54, -0.35, -0.54, -0.23, 'rgba(0,0,0,0.7)', 1.6);
    }
    // Side stowage rack: tubular posts and rails with a kit bag strapped behind them.
    this.O(ctx, 0.03, -0.17, 0.038, '#6a6646');
    for (const y of [-0.215, -0.168, -0.121]) this.L(ctx, -0.45, y, 0.0, y, rail, 0.009, { noOut: true });
    for (const x of [-0.44, -0.31, -0.17, -0.03]) this.L(ctx, x, -0.225, x, -0.095, rail, 0.009, { noOut: true });
    // Turret front: side box, smoke launcher cluster, gunner's primary sight with armoured doors.
    this.R(ctx, 0.14, -0.19, 0.09, 0.045, Col.adj(b, -3), null, 0.006);
    this.R(ctx, 0.16, -0.18, 0.025, 0.012, dk, null, 0.002);
    this.smoke(ctx, C, 0.07, -0.235, 3, -0.4, 0.022);
    this.R(ctx, 0.12, -0.33, 0.09, 0.075, top, null, 0.008);
    this.R(ctx, 0.14, -0.318, 0.05, 0.032, GLASS, null, 0.004);
    this.glint(ctx, 0.15, -0.31, 0.007);
    // Commander's station: cupola with vision blocks, remote weapon station with the M2; loader's hatch with M240.
    this.E(ctx, -0.12, -0.33, 0.085, 0.02, top);
    this.R(ctx, -0.18, -0.385, 0.11, 0.055, top, null, 0.015);
    for (let i = 0; i < 3; i++) this.R(ctx, -0.17 + i * 0.033, -0.372, 0.022, 0.02, GLASS, null, 0.003);
    this.R(ctx, -0.05, -0.44, 0.06, 0.05, '#3a4048', null, 0.008);
    this.L(ctx, 0.0, -0.425, 0.24, -0.425, '#2a3038', 0.013);
    this.R(ctx, -0.035, -0.465, 0.03, 0.03, '#3a4048', null, 0.005);
    this.E(ctx, 0.05, -0.336, 0.06, 0.016, top);
    this.R(ctx, 0.03, -0.38, 0.03, 0.04, '#2a3038', null, 0.004); this.L(ctx, 0.05, -0.372, 0.14, -0.372, '#2a3038', 0.009);
    // Antenna at the turret rear (the faction pennant flies from the second one).
    this.R(ctx, -0.492, -0.335, 0.024, 0.02, dk, null, 0.004); this.L(ctx, -0.48, -0.335, -0.48, -0.475, '#2a2b26', 0.008, { noOut: true });
    this.R(ctx, -0.462, -0.335, 0.024, 0.02, dk, null, 0.004);
    // 120 mm M256: mantlet, thick base sleeve, bore evacuator, slim barrel, muzzle reference sensor.
    const gy = -0.207;
    this.R(ctx, 0.47, gy - 0.034, 0.08, 0.068, Col.adj(b, -8), null, 0.01);
    this.L(ctx, 0.52, gy, 1.22, gy, Col.adj(b, -3), 0.032);
    this.L(ctx, 0.53, gy, 0.66, gy, Col.adj(b, -3), 0.046);
    this.P(ctx, [[0.66, gy - 0.022], [0.69, gy - 0.035], [0.8, gy - 0.035], [0.83, gy - 0.022], [0.83, gy + 0.022], [0.8, gy + 0.035], [0.69, gy + 0.035], [0.66, gy + 0.022]], Col.adj(b, -3));
    this.R(ctx, 1.19, gy - 0.022, 0.035, 0.044, Col.adj(b, -6), null, 0.006);
    this.R(ctx, 1.15, gy - 0.045, 0.03, 0.02, dk, null, 0.004);
    this.mark(ctx, -0.36, -0.15, '211', 0.05, 'rgba(30,30,25,0.55)');
    this.pennant(ctx, C, -0.45, -0.335, 0.32);
  },
  // Leopard 2A7 (7.7 m hull, 11 m with gun): wedge turret, full skirts, long 120 mm gun overhanging the nose.
  // Previous Western MBT model, kept for comparison while the Abrams prototype is evaluated (not referenced by a unit type).
  mbtLeo(ctx, C) {
    this.tracks(ctx, [[-0.86, 0.14], [-0.82, 0.08], [-0.72, 0.06], [0.72, 0.06], [0.83, 0.08], [0.88, 0.14], [0.82, 0.22], [0.68, 0.3], [-0.66, 0.3], [-0.8, 0.23]],
      [-0.58, -0.39, -0.19, 0, 0.19, 0.39, 0.58], 0.21, 0.08, [-0.76, 0.15, 0.072], [0.77, 0.16, 0.068]);
    this.P(ctx, [[-0.89, 0.12], [-0.91, 0.02], [-0.9, -0.08], [-0.8, -0.1], [0.3, -0.1], [0.45, -0.095], [0.86, -0.03], [0.91, 0.0], [0.9, 0.06], [0.82, 0.12]], C.body);
    this.P(ctx, [[-0.85, -0.01], [0.8, -0.01], [0.88, 0.02], [0.86, 0.18], [0.22, 0.18], [0.2, 0.15], [-0.85, 0.15]], Col.adj(C.body, -4));
    for (const x of [-0.45, -0.05, 0.22, 0.55]) this.ln(ctx, x, -0.01, x, 0.16);
    // Skirt bolts, tow cable on the upper hull side, headlight, driver's periscope, rear exhaust grille.
    this.bolts(ctx, -0.82, 0.8, 0.012, 16); this.bolts(ctx, -0.82, 0.18, 0.135, 10);
    this.tow(ctx, -0.8, -0.055, 0.24, -0.055);
    this.light(ctx, 0.85, -0.045);
    this.R(ctx, 0.5, -0.12, 0.06, 0.02, GLASS, null, 0.004);
    for (let x = -0.88; x < -0.8; x += 0.02) this.ln(ctx, x, -0.085, x, -0.02, 'rgba(0,0,0,0.55)');
    this.R(ctx, -0.72, -0.24, 0.07, 0.1, C.dark, null, 0.01);
    this.ao(ctx, -0.6, 0.3, -0.1, 0.04);
    this.P(ctx, [[-0.56, -0.1], [-0.66, -0.12], [-0.68, -0.2], [-0.63, -0.27], [-0.3, -0.29], [0.06, -0.29], [0.14, -0.28], [0.44, -0.205], [0.46, -0.185], [0.32, -0.16], [0.24, -0.12], [0.1, -0.105], [-0.2, -0.1]], C.body);
    this.ln(ctx, 0.14, -0.28, 0.32, -0.16);
    for (let i = 0; i < 4; i++) this.L(ctx, -0.3 + i * 0.04, -0.235, -0.27 + i * 0.04, -0.26, C.dark, 0.016);
    this.R(ctx, 0.2, -0.225, 0.09, 0.06, C.dark, null, 0.01);
    this.barrel(ctx, 0.26, -0.195, 1.3, -0.195, 0.028, { evac: 0.48 });
    this.R(ctx, -0.14, -0.335, 0.06, 0.048, C.dark, null, 0.01); this.R(ctx, -0.09, -0.33, 0.015, 0.035, GLASS, null, 0.003);
    this.R(ctx, 0.02, -0.315, 0.07, 0.028, C.dark, null, 0.005); this.R(ctx, 0.07, -0.31, 0.018, 0.018, GLASS, null, 0.003);
    this.glint(ctx, 0.075, -0.305, 0.008);
    this.R(ctx, -0.4, -0.33, 0.08, 0.04, C.dark, null, 0.01); this.L(ctx, -0.32, -0.32, -0.18, -0.32, GUN, 0.009);
    // Turret: bolted armour modules, commander's hatch, stowage basket on the bustle, radio antenna.
    this.bolts(ctx, -0.58, 0.06, -0.135, 9); this.bolts(ctx, 0.18, 0.36, -0.185, 3);
    this.stow(ctx, -0.68, -0.335, 0.2, 0.05, 1);
    this.net(ctx, -0.89, -0.135, 0.2);
    this.mark(ctx, -0.5, -0.165, '211');
    this.antenna(ctx, -0.46, -0.3, 0.46);
    this.pennant(ctx, C, -0.55, -0.27, 0.3);
  },
  // PzH 2000 (7.87 m hull, 11.7 m with gun): huge rear box turret, 8 m L52 barrel with pepper-pot brake.
  spg(ctx, C) {
    this.tracks(ctx, [[-0.86, 0.14], [-0.82, 0.08], [-0.72, 0.07], [0.72, 0.07], [0.83, 0.09], [0.88, 0.14], [0.82, 0.22], [0.68, 0.3], [-0.66, 0.3], [-0.8, 0.23]],
      [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6], 0.212, 0.08, [0.78, 0.14, 0.07], [-0.79, 0.16, 0.066]);
    this.P(ctx, [[-0.9, 0.12], [-0.92, 0.0], [-0.9, -0.13], [0.3, -0.135], [0.42, -0.13], [0.88, -0.03], [0.92, 0.01], [0.9, 0.07], [0.8, 0.12]], C.body);
    this.P(ctx, [[0.14, -0.133], [0.17, -0.156], [0.42, -0.152], [0.9, -0.048], [0.88, -0.03], [0.42, -0.13]], Col.adj(C.body, 9));
    this.P(ctx, [[-0.86, -0.02], [0.74, -0.02], [0.82, 0.01], [0.8, 0.14], [-0.86, 0.14]], Col.adj(C.body, -4));
    for (const x of [-0.45, -0.05, 0.35]) this.ln(ctx, x, -0.02, x, 0.14);
    this.bolts(ctx, -0.82, 0.72, 0.0, 15); this.bolts(ctx, -0.82, 0.72, 0.12, 15);
    this.light(ctx, 0.86, -0.035);
    this.tow(ctx, 0.18, -0.1, 0.6, -0.08);
    this.L(ctx, 0.62, -0.07, 0.75, -0.33, C.dark, 0.012); this.L(ctx, 0.7, -0.05, 0.75, -0.33, C.dark, 0.012);
    this.ao(ctx, -0.9, 0.15, -0.135, 0.04);
    this.P(ctx, [[-0.91, -0.13], [-0.92, -0.36], [-0.88, -0.4], [0.0, -0.4], [0.1, -0.37], [0.16, -0.24], [0.14, -0.135]], C.body);
    this.topFace(ctx, C, -0.88, 0.02, -0.4, 0.03);
    this.ln(ctx, -0.92, -0.3, 0.13, -0.3);
    for (const x of [-0.6, -0.3]) this.ln(ctx, x, -0.39, x, -0.14);
    this.R(ctx, -0.52, -0.44, 0.1, 0.04, C.dark, null, 0.01);
    this.R(ctx, -0.3, -0.43, 0.05, 0.03, GLASS, null, 0.004);
    this.R(ctx, 0.06, -0.31, 0.1, 0.08, C.dark, null, 0.01);
    this.barrel(ctx, 0.1, -0.27, 1.3, -0.44, 0.024);
    ctx.save(); ctx.translate(1.27, -0.435); ctx.rotate(Math.atan2(-0.17, 1.2));
    this.R(ctx, -0.045, -0.024, 0.09, 0.048, GUN, null, 0.008);
    if (this.pass === 'fill') { ctx.fillStyle = '#0d0f0d'; for (const dx of [-0.025, 0, 0.025]) ctx.fillRect(dx - 0.005, -0.016, 0.01, 0.032); }
    ctx.restore();
    this.bolts(ctx, -0.86, 0.06, -0.17, 10);
    this.smoke(ctx, C, -0.04, -0.4, 4, -0.8, 0.03);
    this.stow(ctx, -0.88, -0.25, 0.22, 0.05, 2);
    this.mark(ctx, -0.42, -0.215, 'A3');
    this.exhaust(ctx, -0.88, -0.1, 0.1, 0.04);
    this.antenna(ctx, -0.72, -0.4, 0.42);
    this.pennant(ctx, C, -0.82, -0.4, 0.26);
  },
  // M270 MLRS (6.97 m): Bradley-derived chassis with exposed return rollers, short armoured cab, long launcher box.
  mlrs(ctx, C) {
    this.tracks(ctx, [[-0.88, 0.15], [-0.84, 0.08], [-0.74, 0.06], [0.7, 0.06], [0.82, 0.08], [0.86, 0.13], [0.8, 0.22], [0.64, 0.3], [-0.62, 0.3], [-0.8, 0.24]],
      [-0.55, -0.33, -0.11, 0.11, 0.33, 0.55], 0.215, 0.08, [0.78, 0.13, 0.07], [-0.8, 0.15, 0.066], [-0.4, 0.0, 0.4]);
    this.P(ctx, [[-0.9, 0.12], [-0.91, 0.04], [-0.89, -0.04], [0.88, -0.04], [0.92, 0.02], [0.9, 0.08], [0.8, 0.12]], C.body);
    this.R(ctx, -0.7, -0.06, 0.9, 0.03, C.dark, null, 0.005);
    this.P(ctx, [[0.36, -0.04], [0.36, -0.34], [0.42, -0.37], [0.8, -0.37], [0.88, -0.3], [0.92, -0.14], [0.92, -0.04]], C.body);
    this.topFace(ctx, C, 0.42, 0.8, -0.37, 0.024);
    this.bolts(ctx, 0.4, 0.88, -0.08, 8);
    this.R(ctx, 0.62, -0.32, 0.24, 0.08, GLASS, null, 0.01); this.R(ctx, 0.44, -0.32, 0.14, 0.07, GLASS, null, 0.01);
    if (this.pass === 'fill') for (let x = 0.66; x < 0.86; x += 0.05) this.ln(ctx, x, -0.32, x, -0.24, 'rgba(0,0,0,0.6)', 1.4);
    this.glint(ctx, 0.66, -0.3);
    this.ao(ctx, -0.9, 0.32, -0.06, 0.04);
    this.P(ctx, [[-0.92, -0.06], [-0.93, -0.33], [-0.9, -0.36], [0.3, -0.36], [0.32, -0.33], [0.32, -0.06]], Col.adj(C.body, 3));
    this.topFace(ctx, C, -0.9, 0.3, -0.36, 0.03);
    this.ln(ctx, -0.92, -0.21, 0.32, -0.21, 'rgba(0,0,0,0.5)', 1.3);
    for (let x = -0.7; x < 0.3; x += 0.25) this.ln(ctx, x, -0.35, x, -0.07);
    this.R(ctx, -0.93, -0.35, 0.03, 0.28, C.dark, null, 0.005);
    this.bolts(ctx, -0.88, 0.28, -0.335, 12); this.bolts(ctx, -0.88, 0.28, -0.085, 12);
    this.mark(ctx, -0.6, -0.15, 'DANGER', 0.035, 'rgba(240,230,120,0.75)');
    this.light(ctx, 0.88, -0.07);
    this.antenna(ctx, 0.5, -0.37, 0.36);
    this.exhaust(ctx, 0.38, -0.12, 0.06, 0.04);
    this.pennant(ctx, C, 0.4, -0.37, 0.26);
  },
  // HIMARS (6.94 m): 6x6 FMTV truck, tall armoured cab, one big pod as tall as the cab.
  tbm(ctx, C) {
    this.R(ctx, -0.86, 0.0, 1.7, 0.05, C.dark, null, 0.01);
    this.R(ctx, -0.7, -0.1, 1.0, 0.08, C.dark, null, 0.01);
    this.P(ctx, [[-0.88, -0.1], [-0.89, -0.49], [-0.86, -0.52], [0.3, -0.52], [0.33, -0.49], [0.33, -0.1]], Col.adj(C.body, 3));
    this.topFace(ctx, C, -0.86, 0.3, -0.52, 0.03);
    for (let x = -0.68; x < 0.3; x += 0.2) this.ln(ctx, x, -0.51, x, -0.11);
    this.R(ctx, -0.89, -0.51, 0.03, 0.4, C.dark, null, 0.005);
    this.P(ctx, [[0.36, 0.04], [0.36, -0.4], [0.42, -0.44], [0.84, -0.44], [0.9, -0.38], [0.92, -0.2], [0.92, 0.04]], C.body);
    this.topFace(ctx, C, 0.42, 0.84, -0.44, 0.024);
    this.R(ctx, 0.78, -0.38, 0.12, 0.12, GLASS, null, 0.01); this.R(ctx, 0.46, -0.38, 0.2, 0.1, GLASS, null, 0.01);
    this.glint(ctx, 0.8, -0.36);
    this.R(ctx, 0.84, 0.03, 0.1, 0.04, C.dark, null, 0.01);
    this.wheels(ctx, [0.66, -0.36, -0.66], 0.14);
    this.bolts(ctx, -0.84, 0.28, -0.5, 12); this.bolts(ctx, -0.84, 0.28, -0.13, 12);
    this.mark(ctx, -0.6, -0.24, 'DANGER', 0.035, 'rgba(240,230,120,0.75)');
    this.mirror(ctx, 0.92, -0.26);
    this.light(ctx, 0.9, -0.08);
    this.antenna(ctx, 0.5, -0.44, 0.34);
    this.pennant(ctx, C, 0.42, -0.44, 0.26);
  },
});

// The Avenger has no search radar (passive FLIR turret), so the West SAM gets no rotating radar panel.
// Keep the old Pantsir radar for the East model unless models-east-land.js brings its own.
if (!Models.animE.aa) Models.animE.aa = Models.anim.aa;
Object.assign(Models.anim, { aa() {} });

// ---------- Added after Beta 1.0 ----------
Object.assign(Models.m, {
  // Switchblade 600 team: operator kneeling with the control tablet, loader, launch tube on a short bipod angled
  // up ~35°, and a drone already in the air (tube body, two pairs of folding wings, small pusher prop).
  loit(ctx, C) {
    this.soldier(ctx, C, -0.5, 0.82, { pose: 'kneel', weapon: 'bino' });
    this.soldier(ctx, C, -0.14, 0.9, { pose: 'kneel', pack: '#4f5539' });
    this.L(ctx, 0.3, 0.2, 0.2, 0.3, GUN, 0.022); this.L(ctx, 0.3, 0.2, 0.42, 0.3, GUN, 0.022);
    ctx.save(); ctx.translate(0.18, 0.26); ctx.rotate(-0.6);
    this.R(ctx, 0, -0.05, 0.62, 0.1, Col.adj(C.gear, 4), null, 0.03);
    this.R(ctx, 0.58, -0.055, 0.05, 0.11, C.dark, null, 0.01);
    this.ln(ctx, 0.2, -0.05, 0.2, 0.05); this.ln(ctx, 0.42, -0.05, 0.42, 0.05);
    ctx.restore();
    // The drone in flight above the team.
    this.E(ctx, 0.46, -0.5, 0.14, 0.03, '#6b7064');
    this.P(ctx, [[0.52, -0.52], [0.44, -0.62], [0.4, -0.62], [0.44, -0.52]], '#55594f');
    this.P(ctx, [[0.38, -0.49], [0.3, -0.4], [0.26, -0.4], [0.32, -0.49]], '#55594f');
    this.O(ctx, 0.59, -0.5, 0.022, GLASS);
    this.L(ctx, 0.31, -0.56, 0.31, -0.44, 'rgba(30,30,30,0.6)', 0.012, { noOut: true });
    this.pennant(ctx, C, 0.7, 0.3, 0.62);
  },
  // Patriot M903 launcher on the M983 HEMTT tractor (approx. 15 m combination): four-canister block raised ~32°
  // over the semitrailer, hydraulic strut, armoured tractor cab in front.
  sam2(ctx, C) {
    this.R(ctx, -0.92, 0.0, 1.84, 0.06, C.dark, null, 0.01);
    this.wheels(ctx, [0.72, 0.46, -0.44, -0.7], 0.12);
    this.P(ctx, [[0.5, 0.06], [0.5, -0.3], [0.56, -0.35], [0.86, -0.35], [0.93, -0.26], [0.95, -0.08], [0.95, 0.06]], C.body);
    this.topFace(ctx, C, 0.56, 0.86, -0.35, 0.022);
    this.R(ctx, 0.74, -0.3, 0.15, 0.1, GLASS, null, 0.01); this.R(ctx, 0.56, -0.3, 0.13, 0.09, GLASS, null, 0.01);
    this.glint(ctx, 0.77, -0.28);
    this.mirror(ctx, 0.96, -0.2); this.light(ctx, 0.93, -0.04);
    this.P(ctx, [[-0.86, 0.0], [-0.86, -0.1], [0.36, -0.1], [0.42, 0.0]], Col.adj(C.body, -4));
    this.bolts(ctx, -0.8, 0.3, -0.05, 10);
    this.L(ctx, 0.08, -0.1, -0.12, -0.38, GUN, 0.035);
    ctx.save(); ctx.translate(-0.78, -0.12); ctx.rotate(-0.55);
    this.R(ctx, 0, -0.3, 1.08, 0.3, Col.adj(C.body, 6), null, 0.02);
    this.topFace(ctx, C, 0.02, 1.06, -0.3, 0.02);
    this.ln(ctx, 0.02, -0.15, 1.04, -0.15, 'rgba(0,0,0,0.45)', 1.3);
    for (const x of [0.36, 0.72]) this.ln(ctx, x, -0.29, x, -0.01);
    this.R(ctx, 1.03, -0.3, 0.05, 0.3, C.dark, null, 0.01);
    this.mark(ctx, 0.5, -0.08, 'PAC-3', 0.05, 'rgba(240,230,120,0.75)');
    ctx.restore();
    this.antenna(ctx, 0.6, -0.35, 0.3);
    this.pennant(ctx, C, 0.86, -0.35, 0.26);
  },
});
