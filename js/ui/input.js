// Mouse, touch and keyboard input on the map canvas.
'use strict';

// Rebindable keyboard actions: [id, group, default key, label]. Groups decide when a key is live:
// time = always, cmd = only with units selected, cam = only without a selection. Keys may repeat across cmd/cam.
const KEY_ACTIONS = [
  ['pause', 'time', ' ', 'kPause'], ['speed1', 'time', '1', 'kSpeed1'], ['speed2', 'time', '2', 'kSpeed2'], ['speed3', 'time', '3', 'kSpeed3'],
  ['zoomIn', 'time', '+', 'kZoomIn'], ['zoomOut', 'time', '-', 'kZoomOut'], ['idle', 'time', 'i', 'kIdle'], ['obj', 'time', 'o', 'kObj'],
  ['move', 'cmd', 'm', 'cmdMove'], ['fast', 'cmd', 'f', 'cmdFast'], ['amove', 'cmd', 'a', 'cmdAttack'], ['stop', 'cmd', 's', 'cmdStop'],
  ['retreat', 'cmd', 'r', 'cmdRetreat'], ['stance', 'cmd', 'h', 'stance'], ['load', 'cmd', 'l', 'cmdLoad'], ['unload', 'cmd', 'e', 'cmdUnload'], ['box', 'cmd', 'b', 'cmdBox'],
  ['panUp', 'cam', 'w', 'kPanUp'], ['panDown', 'cam', 's', 'kPanDown'], ['panLeft', 'cam', 'a', 'kPanLeft'], ['panRight', 'cam', 'd', 'kPanRight'],
];
const KEY_GROUP = Object.fromEntries(KEY_ACTIONS.map(([id, g]) => [id, g]));
const KEY_RESERVED = ['escape', 'control', 'shift', 'alt', 'meta', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'f5', 'f11', 'f12'];

const Keys = {
  defaults() { return Object.fromEntries(KEY_ACTIONS.map(([id, , k]) => [id, k])); },
  map() { return Object.assign(this.defaults(), UI.settings.keys || {}); },
  of(id) { return this.map()[id] || ''; },
  // Two actions clash when they share a key and can be live at the same time.
  clash(a, b) { const ga = KEY_GROUP[a], gb = KEY_GROUP[b]; return a !== b && (ga === 'time' || gb === 'time' || ga === gb); },
  // Assign a key; a clashing action receives the old key of `id` (swap). Returns the swapped action or null.
  set(id, key) {
    const m = this.map(), old = m[id];
    let swapped = null;
    if (key) for (const o in m) if (m[o] === key && this.clash(id, o)) { m[o] = old; swapped = o; }
    m[id] = key;
    UI.settings.keys = m;
    UI.saveSettings();
    return swapped;
  },
  reset() { UI.settings.keys = this.defaults(); UI.saveSettings(); },
  // Action bound to key k in the current context.
  action(k, selected) {
    const m = this.map();
    for (const [id, g] of KEY_ACTIONS) if (m[id] === k && (g === 'time' || (g === 'cmd') === selected)) return id;
    if (k === '=' && m.zoomIn === '+') return 'zoomIn';
    return null;
  },
  label(k) {
    if (!k) return t('keyNone');
    if (k === ' ') return t('keySpace');
    return { arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', backspace: '⌫', enter: '↵' }[k] || (k.length === 1 ? k.toUpperCase() : k[0].toUpperCase() + k.slice(1));
  },
};

const Input = {
  keys: new Set(),
  ptrs: new Map(),
  touch: false,
  g: null,          // current gesture
  lastClick: { t: 0, x: 0, y: 0 },

  init(cv) {
    this.touch = matchMedia('(pointer: coarse)').matches;
    cv.addEventListener('pointerdown', (e) => this.down(e));
    addEventListener('pointermove', (e) => this.move(e));
    addEventListener('pointerup', (e) => this.up(e));
    addEventListener('pointercancel', (e) => { this.ptrs.delete(e.pointerId); this.g = null; Render.box = null; });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); Render.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('keydown', (e) => this.key(e, true));
    addEventListener('keyup', (e) => this.key(e, false));
    addEventListener('blur', () => this.keys.clear());
    const mini = $('#mini');
    const jump = (e) => { const r = mini.getBoundingClientRect(); const [x, y] = Render.miniToWorld((e.clientX - r.left) * mini.width / r.width, (e.clientY - r.top) * mini.height / r.height); Render.flyTo(x, y); };
    mini.addEventListener('pointerdown', (e) => { jump(e); this.miniDrag = true; e.stopPropagation(); });
    addEventListener('pointerup', () => { this.miniDrag = false; });
    mini.addEventListener('pointermove', (e) => { if (this.miniDrag) jump(e); });
  },

  down(e) {
    Sfx.unlock();
    if (e.pointerType === 'touch') { if (!this.touch) { this.touch = true; UI.renderCmdbar(); } }
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, btn: e.button, type: e.pointerType });
    if (this.ptrs.size === 2) {
      const [a, b] = [...this.ptrs.values()];
      clearTimeout(this.lp);
      Render.box = null;
      this.g = { kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      return;
    }
    if (this.ptrs.size > 2) return;
    const boxMode = UI.mode === 'box';
    this.g = { kind: 'pending', btn: e.button, type: e.pointerType, t: performance.now(), box: boxMode || (e.pointerType === 'mouse' && (e.shiftKey || e.ctrlKey)) };
    if (e.pointerType === 'touch' && !boxMode && Game.state) {
      // Long press starts a selection box on touch screens.
      this.lp = setTimeout(() => { if (this.g && this.g.kind === 'pending') { this.g.kind = 'box'; Render.box = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY }; navigator.vibrate && navigator.vibrate(15); } }, 450);
    }
  },

  move(e) {
    const p = this.ptrs.get(e.pointerId);
    if (!p) { this.hover(e); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    const g = this.g;
    if (!g) return;
    if (g.kind === 'pinch') {
      if (this.ptrs.size < 2) return;
      const [a, b] = [...this.ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      Render.pan(mx - g.mx, my - g.my);
      if (g.d > 0) Render.zoomAt(mx, my, d / g.d);
      g.d = d; g.mx = mx; g.my = my;
      return;
    }
    const moved = Math.hypot(e.clientX - p.sx, e.clientY - p.sy);
    if (g.kind === 'pending' && moved > (g.type === 'touch' ? 10 : 5)) {
      clearTimeout(this.lp);
      // Dragging pans the map (mouse and touch alike); Shift/Ctrl+drag or the Box button draws a selection box.
      const wantsBox = g.box && Game.state;
      g.kind = wantsBox ? 'box' : 'pan';
      if (wantsBox) Render.box = { x0: p.sx, y0: p.sy, x1: p.x, y1: p.y };
    }
    if (g.kind === 'pan') Render.pan(dx, dy);
    else if (g.kind === 'box') { Render.box.x1 = p.x; Render.box.y1 = p.y; }
  },

  up(e) {
    const p = this.ptrs.get(e.pointerId);
    this.ptrs.delete(e.pointerId);
    clearTimeout(this.lp);
    const g = this.g;
    if (!p || !g) return;
    if (g.kind === 'pinch') { if (this.ptrs.size === 0) this.g = null; return; }
    this.g = null;
    if (g.kind === 'box') {
      const b = Render.box;
      Render.box = null;
      if (b) this.boxSelect(b, e.shiftKey);
      if (UI.mode === 'box') UI.setMode(null);
      return;
    }
    if (g.kind !== 'pending' || !Game.state) return;
    if (e.target !== Render.cv && !Render.cv.contains(e.target)) return;
    const touch = g.type === 'touch';
    if (!touch && g.btn === 2) { UI.secondary(p.x, p.y); return; }
    const now = performance.now();
    const dbl = now - this.lastClick.t < 320 && Math.hypot(p.x - this.lastClick.x, p.y - this.lastClick.y) < 12;
    this.lastClick = { t: now, x: p.x, y: p.y };
    UI.primary(p.x, p.y, { touch, shift: e.shiftKey, dbl });
  },

  hover(e) {
    if (!Game.state || e.target !== Render.cv) return;
    const c = this.clusterAt(e.clientX, e.clientY), u = c ? c.rep : null;
    if (Render.hover !== c) Render.hover = c;
    Render.cv.style.cursor = UI.mode && UI.mode !== 'box' ? 'crosshair' : u ? 'pointer' : this.siteAt(e.clientX, e.clientY) !== null ? 'pointer' : 'default';
    Render.cv.title = u ? unitName(u.t) : '';
  },

  boxSelect(b, add) {
    const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
    if (x1 - x0 < 4 && y1 - y0 < 4) return;
    const ids = [];
    for (const u of Game.state.units) {
      if (u.s !== 'P' || u.inside || (u.air && u.air.st === 'ground')) continue;
      const [sx, sy] = Render.toScreen(u.x, u.y);
      if (sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1) ids.push(u.id);
    }
    if (ids.length) UI.select(ids, add); else if (!add) UI.deselect();
  },

  // Stack (cluster of overlapping units) under the cursor, see Render.buildClusters.
  clusterAt(sx, sy) {
    if (!Game.state || !Render.clusters) return null;
    const r = Math.max(18, Render.unitSize() * 1.05) * (this.touch ? 1.35 : 1);
    let best = null, bd = r * r;
    for (const c of Render.clusters) {
      let d = (c.sx - sx) ** 2 + (c.sy - sy) ** 2;
      if (c.dom === 'air') d *= 0.8; // aircraft are drawn on top
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  },

  unitAt(sx, sy) { const c = this.clusterAt(sx, sy); return c ? c.rep : null; },
  siteAt(sx, sy) {
    const S = Game.state, r = Render.siteSize() * (this.touch ? 1.3 : 0.9);
    let best = null, bd = r * r;
    for (const p of Geo.provinces) {
      if (!S.prov[p.id].o) continue;
      const [x, y] = Render.toScreen(p.x, p.y), d = (x - sx) ** 2 + (y - sy) ** 2;
      if (d < bd) { bd = d; best = p.id; }
    }
    return best;
  },

  key(e, down) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const k = e.key.toLowerCase();
    if (!down) { this.keys.delete(k); return; }
    // Settings dialog is waiting for a new key binding.
    if (Screens.capture) { Screens.captureKey(k); e.preventDefault(); return; }
    this.keys.add(k);
    const S = Game.state;
    if (!S || !$('#modal').hidden) { if (k === 'escape' && !$('#modal').hidden) Screens.closeModal(); return; }
    // Shift+digit gives other characters on many layouts, so the physical key decides.
    const dg = /^Digit[0-9]$/.test(e.code || '') ? e.code.slice(5) : /^[0-9]$/.test(k) ? k : null;
    if (dg !== null) {
      if (e.ctrlKey || e.metaKey) { if (UI.sel.size) { UI.setGroup(dg, [...UI.sel]); UI.toast(t('groupMade', dg)); Panels.show(); } e.preventDefault(); return; }
      if (e.shiftKey && dg !== '0') { if (UI.sel.size) { UI.addToGroup(dg, [...UI.sel]); UI.toast(t('addedToArmy', dg)); Panels.show(); } e.preventDefault(); return; }
      if (UI.groups()[dg]) {
        const again = performance.now() - (this.lastGroup || 0) < 350 && this.lastGroupK === dg;
        UI.select(UI.armyIds(dg));
        if (again) UI.centerSelection();
        this.lastGroup = performance.now(); this.lastGroupK = dg;
        return;
      }
    }
    if (k === 'escape') { if (UI.mode) UI.setMode(null); else if (UI.sel.size || Render.selProv !== null) UI.deselect(); else Screens.pauseMenu(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const sel = UI.sel.size > 0;
    switch (Keys.action(k, sel)) {
      case 'pause': UI.togglePause(); e.preventDefault(); break;
      case 'speed1': UI.setSpeed(1); break;
      case 'speed2': UI.setSpeed(2); break;
      case 'speed3': UI.setSpeed(4); break;
      case 'idle': Sfx.play('click'); UI.quickSelect('idle'); break;
      case 'obj': $('#btnObj').click(); break;
      case 'move': case 'fast': case 'amove': case 'load': case 'box': UI.command(Keys.action(k, sel)); break;
      case 'stop': case 'retreat': case 'unload': case 'stance': UI.command(Keys.action(k, sel)); break;
    }
  },

  // Keyboard panning (arrows always, rebindable camera keys only without a selection) and zoom.
  update(dt) {
    if (!this.keys.size) return;
    const sp = 600 * dt, free = !UI.sel.size, m = Keys.map();
    const held = (id) => m[id] && this.keys.has(m[id]);
    let dx = 0, dy = 0;
    if (this.keys.has('arrowleft') || (free && held('panLeft'))) dx += sp;
    if (this.keys.has('arrowright') || (free && held('panRight'))) dx -= sp;
    if (this.keys.has('arrowup') || (free && held('panUp'))) dy += sp;
    if (this.keys.has('arrowdown') || (free && held('panDown'))) dy -= sp;
    if (dx || dy) Render.pan(dx, dy);
    if (held('zoomIn') || (m.zoomIn === '+' && this.keys.has('='))) Render.zoomAt(Render.w / 2, Render.h / 2, 1 + dt * 2);
    if (held('zoomOut')) Render.zoomAt(Render.w / 2, Render.h / 2, 1 - dt * 2);
  },
};
