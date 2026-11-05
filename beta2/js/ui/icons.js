// Inline SVG icons for the HUD and cached unit symbol images.
'use strict';

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const ICON = {
  money: svg('<circle cx="12" cy="12" r="9" stroke="#e8b54a"/><path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2.1 0 2.9 6 1.4 6 4.3 0 1.2-1.3 2.1-3 2.1-1.4 0-2.6-.6-3.1-1.6M12 6.5v11" stroke="#e8b54a"/>'),
  industry: svg('<path d="M3 20V10l5 3V10l5 3V6h3v14z" stroke="#9fb6c4"/><path d="M18 20V4h3v16M2 20h20" stroke="#9fb6c4"/>'),
  oil: svg('<path d="M12 3c3 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 3-6.5 6-11z" stroke="#7ec0a8"/>'),
  pause: svg('<path d="M8 5v14M16 5v14"/>'),
  play: svg('<path d="M7 5l12 7-12 7z" fill="currentColor"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  target: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  move: svg('<path d="M5 12h12M13 7l5 5-5 5"/>'),
  fast: svg('<path d="M4 7l6 5-6 5M12 7l6 5-6 5"/>'),
  attack: svg('<path d="M14.5 4.5l5 5-9 9H5.5v-5z"/><path d="M4 20l3-3"/>'),
  shield: svg('<path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6z"/>'),
  stop: svg('<rect x="6" y="6" width="12" height="12" rx="1"/>'),
  retreat: svg('<path d="M19 12H7M11 7l-5 5 5 5"/>'),
  fire: svg('<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.3-3.9 2.5-5 .3 1.7 1.1 2.6 2.1 3 .6-2.6.4-5.3.4-8z"/>'),
  load: svg('<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>'),
  unload: svg('<path d="M12 15V4M7 9l5-5 5 5M4 20h16"/>'),
  drop: svg('<path d="M4 10a8 8 0 0 1 16 0z"/><path d="M4 10l8 8 8-8M12 10v8"/>'),
  strike: svg('<path d="M2 16l20-8-6 10-4-3-3 4v-5z"/>'),
  missile: svg('<path d="M12 2c2 2 3 5 3 9v6H9v-6c0-4 1-7 3-9zM9 14l-3 4h3M15 14l3 4h-3M10 20h4"/>'),
  rtb: svg('<path d="M3 11l9-7 9 7M5 10v10h14V10"/>'),
  box: svg('<rect x="4" y="4" width="16" height="16" stroke-dasharray="3 3"/>'),
  deselect: svg('<circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/>'),
  build: svg('<path d="M14 6l4 4M4 20l9-9M12 4l8 8-3 3-8-8z"/>'),
  up: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  chevDown: svg('<path d="M6 9l6 6 6-6"/>'),
  chevUp: svg('<path d="M6 15l6-6 6 6"/>'),
  save: svg('<path d="M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7"/>'),
  qland: svg('<path d="M3 14h18v3.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M6 14v-3h10l2 3M10 11V8h4M14 9.5h7"/>'),
  qair: svg('<path d="M21 12l-8-2-3-7H8l1 7-4 1-2-2H2l1 3-1 3h1l2-2 4 1-1 7h2l3-7 8-2z"/>'),
  qsea: svg('<path d="M3 15h18l-3 4H6zM7 15V9h7l2 6M10 9V5"/>'),
  qmsl: svg('<path d="M12 2c2 2 3 5 3 9v6H9v-6c0-4 1-7 3-9zM9 14l-3 4h3M15 14l3 4h-3M10 20h4"/>'),
  qidle: svg('<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>'),
};

const UnitIcon = {
  cache: {},
  // side = model look key (Game.look); defaults to the player's own look. Symbols only need its relation letter.
  get(t, side = Game.state ? Game.look(Game.state.player) : 'P') {
    const key = t + side + (Render.models ? 'm' : 'n'), rk = side[0];
    if (this.cache[key]) return this.cache[key];
    const T = UNIT_TYPES[t];
    // Rendered at twice the display size so icons stay crisp on high-DPI screens.
    const c = document.createElement('canvas');
    c.width = 168; c.height = 120;
    const ctx = c.getContext('2d');
    if (Render.models) {
      const inf = T.cls === 'soft' && t !== 'recon';
      const sz = T.dom === 'land' ? (inf ? 56 : 64) : T.dom === 'sea' ? 80 : 76;
      Models.draw(ctx, t, side, 84, T.dom === 'land' ? (inf ? 74 : 70) : T.dom === 'sea' ? 68 : 58, sz, 0, 1);
    } else if (T.dom === 'land') Sym.counter(ctx, T.sym, rk, 84, 60, 80, 1);
    else Sym.craft(ctx, T.sym, rk, 84, 60, T.dom === 'sea' ? 104 : 92, -Math.PI / 2 + (T.dom === 'sea' ? Math.PI / 2 : 0), 1);
    return (this.cache[key] = c.toDataURL());
  },
  missile() {
    if (this.cache.msl) return this.cache.msl;
    const c = document.createElement('canvas');
    c.width = 84; c.height = 60;
    const ctx = c.getContext('2d');
    ctx.translate(42, 30); ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#d9dee2'; ctx.strokeStyle = '#0b1d2c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(14, -5); ctx.lineTo(-18, -5); ctx.lineTo(-24, -11); ctx.lineTo(-24, 11); ctx.lineTo(-18, 5); ctx.lineTo(14, 5); ctx.closePath();
    ctx.fill(); ctx.stroke();
    return (this.cache.msl = c.toDataURL());
  },
};

const costHtml = (c, side) => {
  const s = side ? Game.state.side[side] : null;
  const part = (k, ic) => (c[k] ? `<i class="${s && s[k] < c[k] ? 'no' : ''}">${ICON[ic]}${U.fmt(c[k])}</i>` : '');
  return `<span class="cost">${part('m', 'money')}${part('i', 'industry')}${part('o', 'oil')}</span>`;
};
