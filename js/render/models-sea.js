// Ship and submarine models for both factions. Drawn with the helpers in models.js.
// Heights above the waterline (y = 0.065) are exaggerated roughly 2.5x so the silhouettes read at 30-40 px:
// corvette = one low block + one mast, destroyer = tall block + tall mast, carrier = long flat deck with island.
'use strict';

const SEA_GREY = '#4d5559', SEA_DARK = '#3a4246', SEA_ARRAY = '#353d42', SEA_MAST = '#2a2e30', SEA_LIGHT = '#d8dde0';

// Shared naval helpers (prefix sea).
Object.assign(Models, {
  // Flush deck hatches (VLS cells): dark plate with cell seams.
  seaVls(ctx, x0, x1, y, h = 0.014) {
    this.R(ctx, x0, y - h, x1 - x0, h, SEA_DARK, null, 0.003, { noLine: true });
    if (this.pass !== 'fill' || this.small) return;
    for (let x = x0 + 0.018; x < x1 - 0.005; x += 0.018) this.ln(ctx, x, y - h, x, y, 'rgba(0,0,0,0.55)');
  },
  // Thin signal mast with the faction pennant on top.
  seaFlag(ctx, C, x, y, h) {
    this.L(ctx, x, y, x, y - h, SEA_MAST, 0.011);
    this.P(ctx, [[x, y - h], [x + 0.13, y - h + 0.025], [x, y - h + 0.055]], C.accent, null, { hi: true });
  },
  // Parked jet on a flight deck (side view): fuselage, fin, canopy. No outline so the deck stays clean.
  seaJet(ctx, x, y, k = 1, col = '#8b969d') {
    if (this.pass === 'out') return;
    const p = (a, b) => [x + a * k, y + b * k];
    this.P(ctx, [p(0.055, -0.006), p(0.025, -0.016), p(-0.03, -0.017), p(-0.042, -0.05), p(-0.056, -0.05), p(-0.062, -0.012), p(-0.066, -0.004), p(-0.04, 0), p(0.045, 0)], col, null, { noLine: true, noOut: true });
    if (this.small) return;
    ctx.fillStyle = 'rgba(25,45,60,0.95)'; ctx.beginPath(); ctx.ellipse(x + 0.018 * k, y - 0.018 * k, 0.016 * k, 0.007 * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - 0.035 * k, y - 0.005 * k, 0.06 * k, 0.005 * k);
  },
  // Octagonal radar array face.
  seaOct(ctx, x, y, r, col = SEA_ARRAY) {
    const o = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    this.P(ctx, o, col, null, { noLine: true });
    if (this.pass === 'fill' && !this.small) this.ln(ctx, x - r * 0.6, y - r * 0.6, x + r * 0.2, y - r * 0.9, 'rgba(255,255,255,0.25)');
  },
  // Sail masts / periscopes.
  seaPeri(ctx, xs, y, hs) { xs.forEach((x, i) => this.L(ctx, x, y, x, y - hs[i], '#1b1e20', 0.013)); },
  // Painted hull number near the bow (mirrored back when the model faces left so it stays readable).
  seaNum(ctx, txt, x, y, h = 0.055) {
    if (this.pass !== 'fill' || this.small) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(this.face, 1);
    ctx.font = `bold ${h}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(240,244,246,0.9)'; ctx.fillText(txt, 0, 0);
    ctx.restore();
  },
});

// Western (P) models.
Object.assign(Models.m, {
  // ---------- Ships ----------
  // K130 Braunschweig (89 m): high flared bow, 76 mm OTO gun forward, faceted superstructure under one big pyramid
  // mast with TRS-3D radar, low stealth funnel, RBS-15 launchers amidships, drone hangar and helipad aft.
  corv(ctx, C) {
    const H = C.ship, SS = Col.adj(C.ship, 8);
    this.shipHull(ctx, [[0.96, -0.15], [0.7, -0.115], [0.3, -0.095], [-0.6, -0.085], [-0.94, -0.085], [-0.95, 0.06], [-0.9, 0.12], [0.5, 0.14], [0.8, 0.12], [0.91, 0.04]], H);
    // Superstructure with sloped (stealth) walls, hangar block aft.
    this.P(ctx, [[0.4, -0.098], [0.34, -0.25], [-0.08, -0.25], [-0.13, -0.21], [-0.6, -0.21], [-0.64, -0.086]], SS);
    this.P(ctx, [[0.335, -0.235], [0.22, -0.24], [0.22, -0.218], [0.33, -0.212]], GLASS);
    this.R(ctx, -0.62, -0.18, 0.12, 0.085, Col.adj(H, -10), null, 0.004);
    // Pyramid mast with radar platform.
    this.P(ctx, [[0.17, -0.25], [0.11, -0.46], [-0.01, -0.46], [-0.06, -0.25]], SS);
    this.P(ctx, [[0.15, -0.36], [0.12, -0.44], [0.02, -0.44], [0.04, -0.36]], SEA_ARRAY, null, { noLine: true });
    this.R(ctx, -0.02, -0.5, 0.14, 0.035, SEA_GREY, null, 0.006);
    this.seaFlag(ctx, C, 0.05, -0.5, 0.12);
    // Low funnel with faction band.
    this.P(ctx, [[-0.17, -0.21], [-0.2, -0.3], [-0.33, -0.3], [-0.35, -0.21]], SS);
    this.band(ctx, C, -0.335, -0.282, 0.13, 0.024);
    // RBS-15 canisters (angled pair) and aft RAM launcher.
    ctx.save(); ctx.translate(-0.47, -0.215); ctx.rotate(-0.22);
    this.R(ctx, -0.07, -0.026, 0.14, 0.026, SEA_GREY, null, 0.004); this.R(ctx, -0.07, -0.05, 0.14, 0.026, SEA_GREY, null, 0.004);
    ctx.restore();
    this.R(ctx, 0.36, -0.15, 0.05, 0.04, SEA_GREY, null, 0.006);
    // 76 mm gun.
    this.P(ctx, [[0.7, -0.118], [0.675, -0.165], [0.58, -0.172], [0.55, -0.112]], SS);
    this.L(ctx, 0.67, -0.148, 0.86, -0.162, GUN, 0.016);
    this.ln(ctx, -0.64, -0.086, -0.94, -0.086, 'rgba(255,255,255,0.4)');
    this.seaNum(ctx, '261', 0.76, -0.045);
  },
  // Arleigh Burke Flight III (155 m): Mk 45 127 mm gun, 32-cell VLS, tall block bridge with SPY-6 octagons,
  // raked lattice mast, two funnels, aft SPY faces on the hangar, 64-cell VLS and a lowered flight deck.
  dd(ctx, C) {
    const H = C.ship, SS = Col.adj(C.ship, 8);
    this.shipHull(ctx, [[1.0, -0.1], [0.8, -0.085], [0.45, -0.065], [0.0, -0.055], [-0.62, -0.045], [-0.65, -0.02], [-1.0, -0.02], [-1.0, 0.06], [-0.96, 0.11], [-0.85, 0.13], [0.4, 0.15], [0.75, 0.13], [0.78, 0.18], [0.86, 0.18], [0.9, 0.12], [0.96, 0.05]], H);
    // Funnels behind the blocks they rise from.
    this.P(ctx, [[0.03, -0.1], [0.01, -0.4], [-0.11, -0.4], [-0.13, -0.1]], SS);
    this.P(ctx, [[-0.3, -0.1], [-0.32, -0.38], [-0.44, -0.38], [-0.46, -0.1]], SS);
    this.R(ctx, -0.105, -0.42, 0.11, 0.025, '#1d201f', null, 0.004); this.R(ctx, -0.435, -0.4, 0.11, 0.025, '#1d201f', null, 0.004);
    this.band(ctx, C, -0.115, -0.35, 0.125, 0.026); this.band(ctx, C, -0.445, -0.33, 0.125, 0.026);
    // Forward superstructure and bridge.
    this.P(ctx, [[0.38, -0.062], [0.34, -0.3], [0.06, -0.3], [0.02, -0.2], [0.0, -0.055]], SS);
    this.P(ctx, [[0.34, -0.3], [0.32, -0.36], [0.13, -0.36], [0.13, -0.3]], SS);
    this.P(ctx, [[0.325, -0.348], [0.2, -0.352], [0.2, -0.332], [0.32, -0.328]], GLASS);
    this.seaOct(ctx, 0.25, -0.2, 0.056);
    // Mid deckhouse and hangar with aft arrays.
    this.P(ctx, [[0.0, -0.055], [0.0, -0.2], [-0.47, -0.2], [-0.47, -0.045]], SS);
    this.P(ctx, [[-0.47, -0.045], [-0.47, -0.25], [-0.66, -0.22], [-0.68, -0.045]], SS);
    this.seaOct(ctx, -0.54, -0.15, 0.048);
    // Raked lattice tripod mast.
    this.L(ctx, 0.2, -0.36, 0.11, -0.76, SEA_MAST, 0.016); this.L(ctx, 0.08, -0.36, 0.11, -0.76, SEA_MAST, 0.016);
    this.L(ctx, 0.05, -0.55, 0.19, -0.55, SEA_MAST, 0.011); this.L(ctx, 0.07, -0.66, 0.16, -0.66, SEA_MAST, 0.01);
    this.O(ctx, 0.13, -0.61, 0.016, SEA_LIGHT);
    this.seaFlag(ctx, C, 0.11, -0.76, 0.06);
    // VLS fore and aft, 127 mm gun.
    this.seaVls(ctx, 0.4, 0.53, -0.066); this.seaVls(ctx, -0.79, -0.69, -0.045);
    this.O(ctx, 0.36, -0.33, 0.018, SEA_LIGHT);
    this.P(ctx, [[0.72, -0.08], [0.7, -0.135], [0.58, -0.145], [0.55, -0.074]], SS);
    this.L(ctx, 0.69, -0.115, 0.88, -0.135, GUN, 0.017);
    this.ln(ctx, -0.65, -0.021, -1.0, -0.021, 'rgba(255,255,255,0.4)');
    this.seaNum(ctx, '125', 0.76, -0.025);
  },
  // Gerald R. Ford (337 m): long flat deck overhanging the bow, small island well aft with flat radar faces,
  // short mast, hangar-deck openings in the side, jets parked along the deck.
  cv(ctx, C) {
    const H = C.ship, SS = Col.adj(C.ship, 8);
    this.shipHull(ctx, [[1.0, -0.13], [-1.0, -0.13], [-1.0, -0.05], [-0.99, 0.0], [-0.97, 0.08], [-0.9, 0.13], [0.78, 0.13], [0.86, 0.12], [0.9, 0.09], [0.88, 0.06], [0.92, 0.03], [0.96, -0.06], [0.99, -0.1]], H);
    this.ln(ctx, -1.0, -0.09, 0.99, -0.09, 'rgba(0,0,0,0.45)', 2);
    this.R(ctx, -0.74, -0.125, 0.12, 0.05, '#1f2427', null, 0.005); this.R(ctx, 0.12, -0.125, 0.1, 0.04, '#1f2427', null, 0.005);
    this.R(ctx, -1.01, -0.148, 2.02, 0.022, DECK, null, 0.004, { noLine: true });
    this.band(ctx, C, 0.5, -0.115, 0.3, 0.02);
    // Island: two-level block, flat array faces, short pole mast.
    this.P(ctx, [[-0.32, -0.148], [-0.33, -0.32], [-0.5, -0.32], [-0.5, -0.148]], SS);
    this.P(ctx, [[-0.34, -0.32], [-0.35, -0.4], [-0.47, -0.4], [-0.48, -0.32]], SS);
    this.P(ctx, [[-0.35, -0.385], [-0.46, -0.385], [-0.46, -0.365], [-0.355, -0.365]], GLASS);
    this.seaOct(ctx, -0.39, -0.272, 0.03);
    this.P(ctx, [[-0.38, -0.4], [-0.44, -0.4], [-0.415, -0.56]], '#3b4144');
    this.L(ctx, -0.46, -0.48, -0.37, -0.48, SEA_MAST, 0.009);
    this.seaFlag(ctx, C, -0.415, -0.56, 0.05);
    this.seaNum(ctx, '78', -0.41, -0.195, 0.065);
    for (const x of [0.88, 0.74, 0.6, 0.18, -0.06, -0.2, -0.6, -0.74, -0.88]) this.seaJet(ctx, x, -0.148, 1.1);
  },
  // Type 212CD (73 m): diamond-shaped pressure-hull casing (hard chine along the side), tall sail with sloped
  // leading edge well forward, X-rudder; mostly submerged.
  sub(ctx, C) {
    const B = C.sub;
    this.P(ctx, [[-0.78, 0.02], [-0.9, -0.09], [-0.98, -0.085], [-0.93, 0.05]], B);
    this.P(ctx, [[-0.78, 0.14], [-0.9, 0.25], [-0.98, 0.245], [-0.93, 0.11]], B);
    this.P(ctx, [[1.0, 0.08], [0.96, 0.0], [0.86, -0.045], [0.6, -0.055], [-0.4, -0.05], [-0.7, -0.025], [-0.9, 0.03], [-1.0, 0.08], [-0.9, 0.13], [-0.7, 0.18], [-0.4, 0.2], [0.6, 0.21], [0.86, 0.2], [0.96, 0.16]], B);
    this.ln(ctx, -0.88, 0.075, 0.97, 0.075, 'rgba(255,255,255,0.18)', 1.5);
    this.seaPeri(ctx, [0.36, 0.3, 0.25], -0.26, [0.1, 0.07, 0.05]);
    this.P(ctx, [[0.52, -0.05], [0.43, -0.265], [0.22, -0.265], [0.17, -0.05]], Col.adj(B, 8));
    this.band(ctx, C, 0.21, -0.22, 0.24, 0.025);
    this.E(ctx, -1.01, 0.08, 0.015, 0.06, '#1b1e20');
  },
  // Columbia SSBN (171 m): long slender hull, sail far forward, flat missile deck with 16 flush hatches,
  // X-stern and shrouded pump-jet.
  ssbn(ctx, C) {
    const B = Col.adj(C.sub, -4);
    this.P(ctx, [[-0.76, 0.0], [-0.86, -0.1], [-0.93, -0.1], [-0.9, 0.03]], B);
    this.P(ctx, [[-0.76, 0.16], [-0.86, 0.26], [-0.93, 0.26], [-0.9, 0.13]], B);
    this.S(ctx, [[1.0, 0.08], [0.98, 0.03], [0.94, 0.0], [0.86, -0.025], [0.7, -0.03], [-0.55, -0.03], [-0.75, -0.005], [-0.92, 0.04], [-0.95, 0.08], [-0.92, 0.12], [-0.75, 0.165], [-0.55, 0.185], [0.7, 0.185], [0.86, 0.18], [0.94, 0.16], [0.98, 0.13]], B);
    // Pump-jet shroud.
    this.P(ctx, [[-0.9, 0.025], [-1.02, 0.035], [-1.02, 0.125], [-0.9, 0.135]], '#1b1e20');
    this.seaVls(ctx, -0.36, 0.3, -0.028, 0.012);
    this.seaPeri(ctx, [0.6, 0.55, 0.5], -0.17, [0.07, 0.05, 0.04]);
    this.P(ctx, [[0.68, -0.03], [0.62, -0.17], [0.46, -0.17], [0.43, -0.03]], Col.adj(B, 8));
    this.band(ctx, C, 0.46, -0.13, 0.19, 0.022);
  },
});

// Eastern (E) models.
Object.assign(Models.mE, {
  // ---------- Ships ----------
  // Project 22800 Karakurt (67 m): small missile corvette – short, low hull with a high bow, AK-176MA 76 mm turret,
  // compact faceted bridge block with a column mast and radome, 8-cell 3S14 VLS amidships, Pantsir-M aft.
  corv(ctx, C) {
    const H = C.ship, SS = Col.adj(C.ship, 8);
    this.shipHull(ctx, [[0.88, -0.14], [0.6, -0.1], [0.2, -0.078], [-0.4, -0.068], [-0.84, -0.068], [-0.85, 0.06], [-0.79, 0.12], [0.4, 0.13], [0.73, 0.11], [0.83, 0.03]], H);
    // Bridge block and the column mast with its radome.
    this.P(ctx, [[0.42, -0.088], [0.33, -0.24], [0.0, -0.24], [-0.08, -0.17], [-0.1, -0.075]], SS);
    this.P(ctx, [[0.325, -0.225], [0.2, -0.23], [0.2, -0.207], [0.315, -0.2]], GLASS);
    this.P(ctx, [[0.17, -0.24], [0.14, -0.42], [0.05, -0.42], [0.03, -0.24]], SS);
    this.R(ctx, 0.055, -0.39, 0.08, 0.04, SEA_ARRAY, null, 0.004, { noLine: true });
    this.E(ctx, 0.095, -0.45, 0.06, 0.04, SEA_LIGHT);
    this.seaFlag(ctx, C, 0.095, -0.49, 0.1);
    // 3S14 VLS block.
    this.P(ctx, [[-0.1, -0.072], [-0.11, -0.12], [-0.33, -0.12], [-0.34, -0.07]], Col.adj(H, -4));
    this.seaVls(ctx, -0.31, -0.13, -0.12, 0.012);
    // Aft deckhouse with Pantsir-M: turret, radar head, missile packs and twin 30 mm guns.
    this.P(ctx, [[-0.36, -0.07], [-0.38, -0.17], [-0.66, -0.17], [-0.68, -0.068]], SS);
    this.band(ctx, C, -0.64, -0.135, 0.24, 0.024);
    this.P(ctx, [[-0.42, -0.17], [-0.45, -0.24], [-0.6, -0.24], [-0.62, -0.17]], Col.adj(H, -6));
    this.R(ctx, -0.55, -0.3, 0.07, 0.06, SEA_GREY, null, 0.006);
    this.L(ctx, -0.6, -0.215, -0.47, -0.25, '#4b5357', 0.026); this.L(ctx, -0.6, -0.185, -0.47, -0.215, '#4b5357', 0.026);
    this.L(ctx, -0.45, -0.2, -0.34, -0.21, GUN, 0.011);
    // AK-176MA 76 mm stealth turret.
    this.P(ctx, [[0.66, -0.11], [0.63, -0.17], [0.54, -0.175], [0.51, -0.103]], SS);
    this.L(ctx, 0.63, -0.148, 0.81, -0.16, GUN, 0.016);
    this.ln(ctx, -0.68, -0.069, -0.84, -0.069, 'rgba(255,255,255,0.4)');
  },
  // Admiral Gorshkov, Project 22350 (135 m): A-192M 130 mm gun, raised UKSK/Redut VLS deck, bridge block under a
  // single tall pyramid mast carrying the four Poliment AESA faces and a Furke radar, one funnel, hangar with
  // Palash CIWS, flush flight deck.
  dd(ctx, C) {
    const H = C.ship, SS = Col.adj(C.ship, 8);
    this.shipHull(ctx, [[0.98, -0.11], [0.75, -0.09], [0.4, -0.07], [0.0, -0.06], [-0.97, -0.055], [-0.97, 0.06], [-0.93, 0.11], [-0.8, 0.13], [0.45, 0.14], [0.78, 0.12], [0.8, 0.17], [0.87, 0.17], [0.9, 0.11], [0.95, 0.04]], H);
    // Funnel and hangar block.
    this.P(ctx, [[-0.1, -0.15], [-0.12, -0.35], [-0.26, -0.35], [-0.28, -0.15]], SS);
    this.R(ctx, -0.25, -0.37, 0.12, 0.025, '#1d201f', null, 0.004);
    this.band(ctx, C, -0.27, -0.3, 0.155, 0.026);
    this.P(ctx, [[-0.02, -0.058], [-0.02, -0.2], [-0.66, -0.2], [-0.68, -0.056]], SS);
    this.P(ctx, [[-0.6, -0.2], [-0.61, -0.24], [-0.53, -0.24], [-0.52, -0.2]], Col.adj(H, -6));
    this.L(ctx, -0.54, -0.225, -0.46, -0.235, GUN, 0.01);
    this.R(ctx, -0.64, -0.17, 0.08, 0.1, Col.adj(H, -10), null, 0.004);
    // Forward superstructure, bridge.
    this.P(ctx, [[0.36, -0.068], [0.32, -0.28], [0.02, -0.28], [-0.02, -0.058]], SS);
    this.P(ctx, [[0.31, -0.265], [0.2, -0.27], [0.2, -0.248], [0.3, -0.243]], GLASS);
    // Pyramid mast with AESA faces, Furke drum and pole.
    this.P(ctx, [[0.24, -0.28], [0.19, -0.62], [0.06, -0.62], [0.02, -0.28]], SS);
    this.P(ctx, [[0.205, -0.48], [0.19, -0.59], [0.07, -0.59], [0.075, -0.48]], SEA_ARRAY, null, { noLine: true });
    if (this.pass === 'fill' && !this.small) this.ln(ctx, 0.08, -0.58, 0.18, -0.58, 'rgba(255,255,255,0.25)');
    this.R(ctx, 0.07, -0.68, 0.11, 0.05, SEA_GREY, null, 0.01);
    this.seaFlag(ctx, C, 0.125, -0.68, 0.1);
    // Raised VLS deck and the 130 mm gun.
    this.P(ctx, [[0.53, -0.072], [0.51, -0.11], [0.36, -0.11], [0.36, -0.066]], Col.adj(H, -4));
    this.seaVls(ctx, 0.38, 0.5, -0.11, 0.012);
    this.P(ctx, [[0.73, -0.088], [0.705, -0.16], [0.58, -0.165], [0.555, -0.082]], SS);
    this.L(ctx, 0.7, -0.13, 0.93, -0.148, GUN, 0.019);
    this.ln(ctx, -0.68, -0.056, -0.97, -0.056, 'rgba(255,255,255,0.4)');
    this.seaNum(ctx, '454', 0.75, -0.03);
  },
  // Fujian, Type 003 (316 m): flat catapult deck (no ski jump), island set further forward than on US carriers,
  // tall and slab-sided with Type 346B array faces and an integrated mast, raised jet blast deflectors behind
  // the two bow catapults and the waist catapult, J-15/J-35 jets parked on deck.
  cv(ctx, C) {
    const H = C.ship, SS = Col.adj(C.ship, 8);
    this.shipHull(ctx, [[1.0, -0.13], [-0.98, -0.13], [-0.98, -0.05], [-0.97, 0.02], [-0.94, 0.09], [-0.86, 0.13], [0.75, 0.13], [0.84, 0.11], [0.88, 0.07], [0.94, 0.0], [0.99, -0.09]], H);
    this.ln(ctx, -0.98, -0.085, 0.99, -0.085, 'rgba(0,0,0,0.45)', 2);
    this.R(ctx, -0.5, -0.125, 0.14, 0.05, '#1f2427', null, 0.005);
    this.R(ctx, -0.99, -0.148, 2.0, 0.022, DECK, null, 0.004, { noLine: true });
    this.band(ctx, C, 0.45, -0.115, 0.32, 0.02);
    this.seaNum(ctx, '18', 0.86, -0.06, 0.07);
    // Island: tall single block with an integrated mast cap.
    this.P(ctx, [[0.16, -0.148], [0.15, -0.36], [-0.06, -0.36], [-0.08, -0.148]], SS);
    this.P(ctx, [[0.12, -0.36], [0.1, -0.47], [-0.02, -0.47], [-0.04, -0.36]], SS);
    this.P(ctx, [[0.145, -0.345], [0.02, -0.348], [0.02, -0.328], [0.142, -0.325]], GLASS);
    this.R(ctx, -0.04, -0.3, 0.085, 0.085, SEA_ARRAY, null, 0.006, { noLine: true });
    this.R(ctx, 0.0, -0.455, 0.08, 0.06, SEA_ARRAY, null, 0.006, { noLine: true });
    this.R(ctx, -0.07, -0.26, 0.04, 0.08, '#1f2427', null, 0.004);
    this.seaFlag(ctx, C, 0.04, -0.47, 0.12);
    // Raised jet blast deflectors behind the catapult positions, jets on the catapults and parked aft.
    for (const x of [0.62, 0.42, -0.28]) this.P(ctx, [[x, -0.148], [x - 0.03, -0.2], [x - 0.04, -0.198], [x - 0.02, -0.148]], '#4b5357', null, { noLine: true });
    for (const x of [0.71, 0.51, -0.19]) this.seaJet(ctx, x, -0.148, 1.15, '#93a2ab');
    for (const x of [-0.45, -0.6, -0.75, -0.9, 0.28]) this.seaJet(ctx, x, -0.148, 1.1, '#93a2ab');
  },
  // Kilo, Project 636.3 (73.8 m, beam 9.9 m): short, very fat hull with a blunt rounded bow, flat deck casing,
  // long low sail amidships, cruciform stern planes and a single large seven-blade propeller.
  sub(ctx, C) {
    const B = C.sub;
    this.P(ctx, [[-0.74, 0.0], [-0.84, -0.1], [-0.91, -0.1], [-0.88, 0.03]], B);
    this.P(ctx, [[-0.74, 0.17], [-0.84, 0.27], [-0.91, 0.27], [-0.88, 0.14]], B);
    this.S(ctx, [[0.98, 0.1], [0.97, 0.0], [0.9, -0.06], [0.7, -0.075], [0.0, -0.075], [-0.45, -0.065], [-0.7, -0.03], [-0.88, 0.04], [-0.92, 0.09], [-0.88, 0.14], [-0.7, 0.2], [-0.45, 0.24], [0.0, 0.255], [0.7, 0.25], [0.9, 0.22], [0.97, 0.18]], B);
    this.L(ctx, -0.84, 0.09, -0.92, 0.09, '#1b1e20', 0.02);
    this.R(ctx, -0.98, 0.0, 0.05, 0.18, '#1b1e20', null, 0.02);
    this.seaPeri(ctx, [0.06, 0.0, -0.06], -0.25, [0.09, 0.06, 0.07]);
    this.S(ctx, [[0.22, -0.065], [0.2, -0.2], [0.16, -0.255], [0.1, -0.26], [-0.16, -0.26], [-0.2, -0.24], [-0.24, -0.07]], Col.adj(B, 8));
    this.band(ctx, C, -0.17, -0.22, 0.34, 0.025);
  },
  // Borei-A, Project 955A (170 m): long hull with a pronounced turtle-back hump over the 16 Bulava tubes behind
  // the forward-raked sail, cruciform stern with fin-tipped horizontal planes, pump-jet.
  ssbn(ctx, C) {
    const B = Col.adj(C.sub, -4);
    this.P(ctx, [[-0.7, 0.0], [-0.8, -0.1], [-0.9, -0.1], [-0.9, 0.03]], B);
    this.P(ctx, [[-0.7, 0.16], [-0.8, 0.24], [-0.9, 0.24], [-0.9, 0.13]], B);
    this.L(ctx, -0.72, 0.085, -0.88, 0.085, B, 0.028);
    this.R(ctx, -0.89, 0.035, 0.035, 0.1, B, null, 0.008);
    this.S(ctx, [[1.0, 0.08], [0.98, 0.03], [0.94, 0.0], [0.86, -0.025], [0.62, -0.03], [0.38, -0.03], [0.25, -0.1], [-0.4, -0.1], [-0.56, -0.03], [-0.75, -0.005], [-0.92, 0.04], [-0.95, 0.08], [-0.92, 0.12], [-0.75, 0.165], [-0.55, 0.185], [0.7, 0.185], [0.86, 0.18], [0.94, 0.16], [0.98, 0.13]], B);
    this.P(ctx, [[-0.9, 0.025], [-1.02, 0.03], [-1.02, 0.13], [-0.9, 0.135]], '#1b1e20');
    this.seaVls(ctx, -0.36, 0.14, -0.085, 0.01);
    this.seaPeri(ctx, [0.56, 0.5, 0.46], -0.19, [0.07, 0.05, 0.06]);
    this.P(ctx, [[0.66, -0.03], [0.56, -0.19], [0.42, -0.19], [0.36, -0.035]], Col.adj(B, 8));
    this.band(ctx, C, 0.42, -0.15, 0.16, 0.022);
  },
});
