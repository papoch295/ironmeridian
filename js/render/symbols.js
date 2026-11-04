// Tactical symbology: NATO-style counters for ground units, silhouettes for aircraft and ships, map site icons.
'use strict';

// Colours by relation to the player (Game.rk): P = own country, A = ally, E = enemy, N = neutral.
const COL = {
  P: { fill: '#6fb3ea', dark: '#0b1d2c', line: '#cfe8ff', prov: [46, 95, 143], glow: 'rgba(111,179,234,' },
  A: { fill: '#5fd0bf', dark: '#08241f', line: '#cff7f0', prov: [34, 116, 106], glow: 'rgba(95,208,191,' },
  E: { fill: '#ee6b5d', dark: '#2a0c0a', line: '#ffd6d0', prov: [143, 52, 52], glow: 'rgba(238,107,93,' },
  N: { fill: '#c9c48f', dark: '#22211a', line: '#f0ecd0', prov: [110, 106, 76], glow: 'rgba(201,196,143,' },
  gold: '#e8b54a', ink: '#0b141b',
};

const Sym = {
  // Ground unit counter (friendly/allied: rectangle, hostile: diamond, neutral: square) with its branch glyph.
  counter(ctx, sym, side, x, y, s, alpha) {
    const c = COL[side], hw = s * 0.75, hh = s * 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha ?? 1;
    ctx.beginPath();
    if (side === 'E') { const d = s * 0.66; ctx.moveTo(0, -d); ctx.lineTo(d, 0); ctx.lineTo(0, d); ctx.lineTo(-d, 0); ctx.closePath(); }
    else if (side === 'N') ctx.rect(-hh * 1.1, -hh * 1.1, hh * 2.2, hh * 2.2);
    else ctx.rect(-hw, -hh, hw * 2, hh * 2);
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = s * 0.35; ctx.shadowOffsetY = s * 0.08;
    ctx.fillStyle = c.fill; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.lineWidth = Math.max(1, s * 0.09); ctx.strokeStyle = c.dark; ctx.stroke();
    // Glyph area: shrink a little inside the diamond.
    const gw = side === 'E' ? hw * 0.62 : side === 'N' ? hh * 0.95 : hw * 0.92, gh = side === 'E' ? hh * 0.62 : hh * 0.92;
    ctx.strokeStyle = c.dark; ctx.fillStyle = c.dark; ctx.lineWidth = Math.max(1, s * 0.08); ctx.lineCap = 'round';
    this.glyph(ctx, sym, gw, gh, s);
    ctx.restore();
  },

  glyph(ctx, sym, w, h, s) {
    const X = () => { ctx.beginPath(); ctx.moveTo(-w, -h); ctx.lineTo(w, h); ctx.moveTo(w, -h); ctx.lineTo(-w, h); ctx.stroke(); };
    const ell = (k = 1) => { ctx.beginPath(); ctx.ellipse(0, 0, w * 0.62 * k, h * 0.5 * k, 0, 0, Math.PI * 2); ctx.stroke(); };
    const dot = (dx = 0, dy = 0, r = s * 0.1) => { ctx.beginPath(); ctx.arc(dx, dy, r, 0, Math.PI * 2); ctx.fill(); };
    const txt = (t, dy = 0, k = 0.36) => { ctx.font = `700 ${Math.round(s * k)}px Bahnschrift, "Segoe UI", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, 0, dy); };
    switch (sym) {
      case 'inf': X(); break;
      case 'sof': X(); txt('SF', h * 0.62, 0.3); break;
      case 'para': X(); ctx.beginPath(); ctx.arc(0, -h * 0.35, w * 0.35, Math.PI, 0); ctx.stroke(); break;
      case 'snp': ctx.beginPath(); ctx.arc(0, 0, h * 0.62, 0, Math.PI * 2); ctx.moveTo(-w * 0.6, 0); ctx.lineTo(w * 0.6, 0); ctx.moveTo(0, -h); ctx.lineTo(0, h); ctx.stroke(); break;
      case 'rec': ctx.beginPath(); ctx.moveTo(-w, h); ctx.lineTo(w, -h); ctx.stroke(); break;
      case 'at': ctx.beginPath(); ctx.moveTo(-w, h); ctx.lineTo(0, -h); ctx.lineTo(w, h); ctx.stroke(); break;
      case 'eng': ctx.beginPath(); ctx.moveTo(-w * 0.6, -h * 0.3); ctx.lineTo(w * 0.6, -h * 0.3); for (const k of [-0.6, 0, 0.6]) { ctx.moveTo(w * k, -h * 0.3); ctx.lineTo(w * k, h * 0.4); } ctx.stroke(); break;
      case 'med': ctx.beginPath(); ctx.moveTo(-w * 0.5, 0); ctx.lineTo(w * 0.5, 0); ctx.moveTo(0, -h * 0.7); ctx.lineTo(0, h * 0.7); ctx.lineWidth *= 1.6; ctx.stroke(); break;
      case 'mor': dot(0, h * 0.35); ctx.beginPath(); ctx.moveTo(0, h * 0.35); ctx.lineTo(0, -h * 0.7); ctx.moveTo(-w * 0.2, -h * 0.4); ctx.lineTo(0, -h * 0.75); ctx.lineTo(w * 0.2, -h * 0.4); ctx.stroke(); break;
      case 'sup': ctx.beginPath(); ctx.moveTo(-w, h * 0.45); ctx.lineTo(w, h * 0.45); ctx.stroke(); txt('LOG', -h * 0.15, 0.3); break;
      case 'apc': X(); ell(0.75); break;
      case 'ifv': X(); ell(0.75); dot(0, 0, s * 0.08); break;
      case 'lt': ell(0.9); txt('L', 0, 0.32); break;
      case 'arm': ell(); break;
      case 'td': ell(); ctx.beginPath(); ctx.moveTo(-w * 0.35, h * 0.3); ctx.lineTo(0, -h * 0.35); ctx.lineTo(w * 0.35, h * 0.3); ctx.stroke(); break;
      case 'aa': ctx.beginPath(); ctx.ellipse(0, h * 0.75, w * 0.7, h * 1.1, 0, Math.PI, 0); ctx.stroke(); break;
      case 'art': dot(0, 0, s * 0.14); break;
      case 'spa': ell(); dot(0, 0, s * 0.1); break;
      case 'mlrs': dot(-w * 0.35, h * 0.2, s * 0.08); dot(w * 0.35, h * 0.2, s * 0.08); dot(0, -h * 0.35, s * 0.08); break;
      case 'tbm': ctx.beginPath(); ctx.moveTo(0, h * 0.8); ctx.lineTo(0, -h * 0.8); ctx.moveTo(-w * 0.25, -h * 0.35); ctx.lineTo(0, -h * 0.85); ctx.lineTo(w * 0.25, -h * 0.35); ctx.stroke(); break;
      // Loitering munition team: infantry cross with a small drone wing above.
      case 'loit': X(); ctx.beginPath(); ctx.moveTo(-w * 0.5, -h * 0.55); ctx.lineTo(0, -h * 0.85); ctx.lineTo(w * 0.5, -h * 0.55); ctx.stroke(); break;
      // Long-range air defense: air-defense dome with a missile through it.
      case 'sam2': ctx.beginPath(); ctx.ellipse(0, h * 0.75, w * 0.7, h * 1.1, 0, Math.PI, 0); ctx.moveTo(0, h * 0.8); ctx.lineTo(0, -h * 0.75); ctx.moveTo(-w * 0.18, -h * 0.4); ctx.lineTo(0, -h * 0.8); ctx.lineTo(w * 0.18, -h * 0.4); ctx.stroke(); break;
      default: txt('?');
    }
  },

  // Top-down silhouettes, rotated to heading.
  craft(ctx, sym, side, x, y, s, hd, alpha) {
    const c = COL[side];
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha ?? 1;
    // Shadow for aircraft height impression.
    const air = !['corv', 'sub', 'dd', 'cv', 'ssbn', 'lst'].includes(sym);
    if (air) { ctx.save(); ctx.translate(s * 0.35, s * 0.45); ctx.rotate(hd); ctx.fillStyle = 'rgba(0,0,0,0.35)'; this.shape(ctx, sym, s); ctx.fill(); ctx.restore(); }
    ctx.rotate(hd);
    ctx.fillStyle = c.fill; ctx.strokeStyle = c.dark; ctx.lineWidth = Math.max(1, s * 0.07); ctx.lineJoin = 'round';
    this.shape(ctx, sym, s);
    ctx.fill(); ctx.stroke();
    if (sym === 'thelo' || sym === 'ahelo') {
      ctx.beginPath(); ctx.arc(-s * 0.05, 0, s * 0.62, 0, Math.PI * 2);
      ctx.strokeStyle = c.line; ctx.globalAlpha = (alpha ?? 1) * 0.45; ctx.lineWidth = Math.max(1, s * 0.05); ctx.stroke();
    }
    ctx.restore();
  },

  shape(ctx, sym, s) {
    const P = (pts) => { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a * s, b * s) : ctx.moveTo(a * s, b * s))); ctx.closePath(); };
    switch (sym) {
      case 'jet': P([[0.62, 0], [0.18, 0.1], [-0.05, 0.55], [-0.2, 0.55], [-0.12, 0.12], [-0.42, 0.1], [-0.55, 0.3], [-0.6, 0.3], [-0.55, 0], [-0.6, -0.3], [-0.55, -0.3], [-0.42, -0.1], [-0.12, -0.12], [-0.2, -0.55], [-0.05, -0.55], [0.18, -0.1]]); break;
      case 'bmb': P([[0.5, 0], [0.3, 0.08], [-0.15, 0.7], [-0.32, 0.7], [-0.2, 0.08], [-0.5, 0.06], [-0.55, 0.22], [-0.62, 0.22], [-0.58, 0], [-0.62, -0.22], [-0.55, -0.22], [-0.5, -0.06], [-0.2, -0.08], [-0.32, -0.7], [-0.15, -0.7], [0.3, -0.08]]); break;
      case 'tpl': P([[0.55, 0], [0.45, 0.1], [0.12, 0.1], [0.02, 0.7], [-0.12, 0.7], [-0.08, 0.1], [-0.45, 0.08], [-0.55, 0.3], [-0.62, 0.3], [-0.58, 0], [-0.62, -0.3], [-0.55, -0.3], [-0.45, -0.08], [-0.08, -0.1], [-0.12, -0.7], [0.02, -0.7], [0.12, -0.1], [0.45, -0.1]]); break;
      case 'thelo': case 'ahelo': P([[0.42, 0], [0.3, 0.14], [-0.1, 0.16], [-0.25, 0.06], [-0.62, 0.04], [-0.66, 0.16], [-0.7, 0.16], [-0.68, 0], [-0.7, -0.16], [-0.66, -0.16], [-0.62, -0.04], [-0.25, -0.06], [-0.1, -0.16], [0.3, -0.14]]); break;
      case 'cv': P([[0.75, -0.05], [0.6, 0.2], [-0.7, 0.2], [-0.75, 0.05], [-0.75, -0.18], [0.3, -0.25], [0.7, -0.18]]); break;
      case 'dd': P([[0.75, 0], [0.4, 0.13], [-0.65, 0.12], [-0.7, 0], [-0.65, -0.12], [0.4, -0.13]]); break;
      // MQ-9 / Orion seen from above: long straight wings, slim body, V-tail, pusher prop at the back.
      case 'uav': P([[0.42, 0], [0.3, 0.05], [0.08, 0.06], [0.04, 0.72], [-0.06, 0.72], [-0.08, 0.06], [-0.42, 0.04], [-0.56, 0.2], [-0.6, 0.2], [-0.54, 0], [-0.6, -0.2], [-0.56, -0.2], [-0.42, -0.04], [-0.08, -0.06], [-0.06, -0.72], [0.04, -0.72], [0.08, -0.06], [0.3, -0.05]]); break;
      // Landing ship: wide hull with a square stern (well deck).
      case 'lst': P([[0.68, 0], [0.42, 0.16], [-0.66, 0.16], [-0.66, -0.16], [0.42, -0.16]]); break;
      case 'corv': P([[0.6, 0], [0.3, 0.11], [-0.5, 0.1], [-0.55, 0], [-0.5, -0.1], [0.3, -0.11]]); break;
      case 'sub': case 'ssbn': ctx.beginPath(); ctx.ellipse(0, 0, s * (sym === 'ssbn' ? 0.72 : 0.6), s * 0.1, 0, 0, Math.PI * 2); ctx.rect(-s * 0.05, -s * 0.06, s * 0.16, s * 0.12); break;
      default: ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
    }
  },

  // Map site icon (city, factory, oil, port, airbase, capital) on an owner-colored disc (owner = relation key).
  site(ctx, type, rel, x, y, s) {
    const owner = rel && rel !== 'N' ? rel : null;
    const c = owner ? COL[owner] : COL.N;
    ctx.save();
    ctx.translate(x, y);
    // Soft shadow, then the disc with a subtle top light.
    ctx.beginPath(); ctx.arc(s * 0.05, s * 0.1, s * 0.66, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
    if (type === 'capital') { ctx.beginPath(); ctx.arc(0, 0, s * 0.82, 0, Math.PI * 2); ctx.fillStyle = 'rgba(232,181,74,0.16)'; ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 0, s * 0.62, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(0, -s * 0.62, 0, s * 0.62);
    g.addColorStop(0, owner ? 'rgba(255,255,255,0.12)' : 'rgba(60,64,60,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = owner ? c.dark : 'rgba(20,24,22,0.88)'; ctx.fill();
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(1, s * 0.1); ctx.strokeStyle = type === 'capital' ? COL.gold : c.fill; ctx.stroke();
    ctx.fillStyle = type === 'capital' ? COL.gold : c.line; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(1, s * 0.08);
    const k = s * 0.36;
    ctx.beginPath();
    switch (type) {
      case 'capital':
        for (let i = 0; i < 10; i++) { const r = i % 2 ? k * 0.45 : k * 1.05, a = -Math.PI / 2 + i * Math.PI / 5; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); break;
      case 'city': ctx.rect(-k * 0.9, -k * 0.2, k * 0.5, k * 1.0); ctx.rect(-k * 0.25, -k * 0.85, k * 0.5, k * 1.65); ctx.rect(k * 0.4, -k * 0.45, k * 0.5, k * 1.25); ctx.fill(); break;
      case 'industry': ctx.moveTo(-k, k * 0.8); ctx.lineTo(-k, -k * 0.1); ctx.lineTo(-k * 0.35, -k * 0.5); ctx.lineTo(-k * 0.35, -k * 0.1); ctx.lineTo(k * 0.3, -k * 0.5); ctx.lineTo(k * 0.3, -k * 0.9); ctx.lineTo(k, -k * 0.9); ctx.lineTo(k, k * 0.8); ctx.closePath(); ctx.fill(); break;
      case 'oil': ctx.moveTo(0, -k); ctx.lineTo(-k * 0.7, k * 0.85); ctx.moveTo(0, -k); ctx.lineTo(k * 0.7, k * 0.85); ctx.moveTo(-k * 0.4, k * 0.1); ctx.lineTo(k * 0.4, k * 0.1); ctx.moveTo(-k * 0.9, k * 0.85); ctx.lineTo(k * 0.9, k * 0.85); ctx.stroke(); break;
      case 'port': ctx.arc(0, -k * 0.65, k * 0.25, 0, Math.PI * 2); ctx.moveTo(0, -k * 0.4); ctx.lineTo(0, k * 0.9); ctx.moveTo(-k * 0.45, -k * 0.15); ctx.lineTo(k * 0.45, -k * 0.15);
        ctx.moveTo(-k * 0.85, k * 0.25); ctx.quadraticCurveTo(-k * 0.6, k * 0.9, 0, k * 0.9); ctx.quadraticCurveTo(k * 0.6, k * 0.9, k * 0.85, k * 0.25); ctx.stroke(); break;
      case 'airbase': ctx.rotate(-Math.PI / 2); this.shape(ctx, 'jet', k * 1.9); ctx.fill(); break;
    }
    ctx.restore();
  },
};
