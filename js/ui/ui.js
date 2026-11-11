// HUD controller: selection, order modes, command bar, top bar, log, toasts, tutorial and game events.
'use strict';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const UI = {
  mode: null,          // pending order mode: move | fast | amove | load | unloadAt | drop | strike | slbm | missile | nuke | cas | box
  modeData: null,
  settings: { lang: 'de', sound: true, volume: 0.6, fog: true, tutorial: true, models: true, perf: false, keys: null },
  tutStep: -1,
  tutFlags: {},
  tick4: 0,

  init() {
    Object.assign(this.settings, Store.get('settings', {}));
    I18N.set(this.settings.lang);
    Sfx.enabled = this.settings.sound; Sfx.setVolume(this.settings.volume);
    Render.fog = this.settings.fog;
    Render.models = this.settings.models;
    $('#btnPause').innerHTML = ICON.pause;
    $('#btnObj').innerHTML = ICON.target;
    $('#btnMenu').innerHTML = ICON.menu;
    $('#btnPause').onclick = () => this.togglePause();
    $$('#speedSeg button').forEach((b) => (b.onclick = () => this.setSpeed(+b.dataset.speed)));
    $('#btnMenu').onclick = () => Screens.pauseMenu();
    $$('#quick button').forEach((b) => { b.innerHTML = ICON['q' + b.dataset.q] + '<span>' + U.esc(t('q' + b.dataset.q[0].toUpperCase() + b.dataset.q.slice(1))) + '</span>'; b.onclick = () => { Sfx.play('click'); const q = b.dataset.q; if (q === 'air' || q === 'msl') Panels.toggleSpecial(q); else this.quickSelect(q); }; });
    // Tap selects an army. Shift/Ctrl+click, right click or a long press adds it to the armies being led together.
    $('#groups').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      Sfx.play('click');
      if (b.dataset.g === 'new') this.newGroup();
      else if (e.shiftKey || e.ctrlKey || e.metaKey) this.toggleArmy(b.dataset.g);
      else this.selectGroup(b.dataset.g);
    });
    $('#groups').addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      const b = e.target.closest('button');
      if (b && b.dataset.g !== 'new') { Sfx.play('click'); this.toggleArmy(b.dataset.g); }
    });
    $('#btnObj').onclick = () => { const o = $('#objBox'); o.hidden = !o.hidden; this.renderObjectives(); if (!o.hidden) this.tutDone('obj'); };
    for (const [id, k] of [['#resM', 'money'], ['#resI', 'industry'], ['#resO', 'oil']]) $(id).innerHTML = `${ICON[k]}<span class="num"><span class="v">0</span><span class="inc"></span></span>`;
    this.applyLang();
    this.wireGameEvents();
  },

  saveSettings() { Store.set('settings', this.settings); },

  applyLang() {
    $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    $$('[data-title]').forEach((el) => { el.title = t(el.dataset.title); });
    $('#setupSearch').placeholder = t('search');
    Render.dirty = true; Render.dirtyMini = true;
  },

  // ---------- Selection ----------
  get sel() { return Render.selection; },
  selUnits() { return Array.from(Render.selection).map((id) => Game.unit(id)).filter((u) => u && !u.inside); },

  select(ids, add) {
    if (!add) Render.selection.clear();
    for (const id of ids) Render.selection.add(id);
    if (Render.selection.size) { Render.selProv = null; Render.dirty = true; this.tutDone('select'); if (this.selectedArmy()) this.tutDone('army'); Sfx.play('select'); }
    this.setMode(null);
    Panels.show();
    this.renderCmdbar();
  },

  selectProvince(pid) {
    Render.selection.clear();
    Render.selProv = pid; Render.dirty = true;
    this.setMode(null);
    if (Game.state.prov[pid].o === Game.me()) this.tutDone('province');
    Sfx.play('click');
    Panels.show();
    this.renderCmdbar();
  },

  deselect() {
    Render.selection.clear();
    if (Render.selProv !== null) { Render.selProv = null; Render.dirty = true; }
    this.setMode(null);
    Panels.show();
    this.renderCmdbar();
  },

  pruneSelection() {
    let changed = false;
    for (const id of Render.selection) { const u = Game.unit(id); if (!u || u.inside) { Render.selection.delete(id); changed = true; } }
    if (changed) { Panels.show(); this.renderCmdbar(); }
  },

  // ---------- Modes & orders ----------
  setMode(m, data) {
    this.mode = m; this.modeData = data || null;
    const hint = $('#hint');
    const txt = { move: t('hintMove'), fast: t('hintMove'), amove: t('hintAttack'), tAttack: t('hintTaskAttack'), tAdvance: t('hintTaskAdvance'), load: t('hintLoad'), unloadAt: t('hintUnloadAt'), airlift: t('hintAirlift'), drop: t('hintDrop'), cas: t('hintCas'), strike: t('hintStrike'), slbm: t('hintMissile', 'SLBM'),
      missile: data && (data.nuke ? t('hintNuke') : t(data.auto ? 'hintMissileAuto' : 'hintMissile', L(MISSILES[data.key]))), nuke: t('hintNuke'), box: t('hintBox') }[m];
    if (txt) { hint.innerHTML = `<span>${U.esc(txt)}</span><button>${U.esc(t('close'))}</button>`; hint.hidden = false; hint.querySelector('button').onclick = () => this.setMode(null); }
    else hint.hidden = true;
    hint.classList.toggle('nuke', m === 'nuke' || !!(data && data.nuke));
    $('#map').classList.toggle('order', !!m && m !== 'box');
    $$('#cmdbar .cmd[data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  },

  issue(ord) {
    const units = this.selUnits();
    if (!units.length) return;
    // Smart order: a plain move into enemy territory becomes an attack-move.
    if (ord.k === 'move') {
      const p = Geo.provinceAt(ord.x, ord.y);
      if (p && Game.isFoe(Game.state.prov[p.id].o)) ord = { ...ord, k: 'amove' };
    }
    // A direct order replaces the task of every army it touches: the player takes over.
    this.clearTasks(units);
    // Armies set to "keep together" march at the pace of their slowest unit.
    const aks = this.selectedArmies();
    if (aks.length && aks.every((k) => this.groups()[k].coh) && ['move', 'fast', 'amove'].includes(ord.k)) ord = { ...ord, coh: 1 };
    Game.order(units, ord);
    if (['move', 'fast', 'amove', 'attack'].includes(ord.k)) this.tutDone('move');
    // Ground marker where the order was given (or on the attacked unit).
    const tgt = ord.id !== undefined ? Game.unit(ord.id) : ord;
    if (tgt && tgt.x !== undefined) Render.ping(tgt.x, tgt.y, ord.k === 'amove' || ord.k === 'attack' ? 'attack' : ord.k === 'load' ? 'load' : 'move');
    Sfx.play('order');
  },

  // Primary tap / left click on the map.
  primary(sx, sy, opts = {}) {
    if (!Game.state) return;
    const [wx, wy] = Render.toWorld(sx, sy);
    const stack = Input.clusterAt(sx, sy), hit = stack ? stack.rep : null;
    if (this.mode && this.mode !== 'box') { this.applyMode(wx, wy, hit); return; }
    // Own stack: select the whole stack (double click: every unit of that type on screen).
    if (stack && stack.side === Game.me()) {
      const ids = stack.units.map((u) => u.id);
      // Clicking the same stack again narrows the selection: whole stack -> same type -> single unit.
      if (!opts.dbl && !opts.shift && ids.length > 1 && [...this.sel].every((id) => ids.includes(id)) && this.sel.size) {
        const piv = this.nearestOf(stack.units, wx, wy), same = stack.units.filter((u) => u.t === piv.t).map((u) => u.id);
        const next = this.sel.size === ids.length && same.length < ids.length ? same : this.sel.size > 1 ? [piv.id] : ids;
        this.select(next);
        if (next.length < ids.length) this.toast(next.length === 1 ? unitName(piv.t) : ` × ${unitName(piv.t)}`);
        return;
      }
      if (opts.dbl) {
        const vb = Render.viewBox();
        this.select(Game.state.units.filter((u) => u.s === Game.me() && u.t === hit.t && !u.inside && !(u.air && u.air.st === 'ground') && u.x > vb[0] && u.x < vb[2] && u.y > vb[1] && u.y < vb[3]).map((u) => u.id), opts.shift);
      } else if (opts.shift && ids.every((id) => this.sel.has(id))) { ids.forEach((id) => this.sel.delete(id)); Panels.show(); this.renderCmdbar(); }
      else this.select(ids, opts.shift);
      return;
    }
    // With units selected every click on the map is an order (WC4 style: select, then tap the target).
    if (this.sel.size) {
      if (hit && Game.isFoe(hit.s)) { this.issue({ k: 'attack', id: this.nearestOf(stack.units, wx, wy).id }); return; }
      const site = Input.siteAt(sx, sy);
      const p = site !== null ? Geo.provinces[site] : null;
      this.issue({ k: 'move', x: p ? p.x : wx, y: p ? p.y : wy });
      return;
    }
    if (hit && hit.s !== Game.me()) { this.showEnemy(hit); return; }
    const site = Input.siteAt(sx, sy);
    if (site !== null) { this.selectProvince(site); return; }
    const p = Geo.provinceAt(wx, wy);
    if (p) { this.selectProvince(p.id); return; }
    this.deselect();
  },

  nearestOf(units, x, y) { return units.reduce((a, b) => (U.dist2(b.x, b.y, x, y) < U.dist2(a.x, a.y, x, y) ? b : a)); },

  // Quick selection buttons: all own units of a domain on screen, or all idle units.
  quickSelect(kind) {
    const vb = Render.viewBox();
    const inView = (u) => u.x > vb[0] && u.x < vb[2] && u.y > vb[1] && u.y < vb[3];
    const ids = Game.state.units.filter((u) => {
      if (u.s !== Game.me() || u.inside || (u.air && u.air.st === 'ground')) return false;
      const T = UNIT_TYPES[u.t];
      if (kind === 'idle') return !u.ord && !u.path && T.w.length > 0;
      return T.dom === kind && inView(u) && (kind !== 'land' || T.w.length > 0);
    }).map((u) => u.id);
    if (!ids.length) { this.toast(t('qNone'), ''); return; }
    this.select(ids);
    if (kind === 'idle') { const u = Game.unit(ids[0]); Render.flyTo(u.x, u.y); }
  },

  showEnemy(u) { if (Render.selProv !== null) { Render.selProv = null; Render.dirty = true; } Panels.showEnemy(u); },

  // Right click: context order.
  secondary(sx, sy) {
    if (!Game.state) return;
    if (this.mode) { this.setMode(null); return; }
    if (!this.sel.size) return;
    const [wx, wy] = Render.toWorld(sx, sy);
    const stack = Input.clusterAt(sx, sy), hit = stack ? stack.rep : null;
    if (hit && Game.isFoe(hit.s)) { this.issue({ k: 'attack', id: this.nearestOf(stack.units, wx, wy).id }); return; }
    const trs = stack && stack.side === Game.me() ? stack.units.filter((u) => UNIT_TYPES[u.t].cap && !this.sel.has(u.id)) : [];
    if (trs.length && this.loadInto(trs)) return;
    this.issue({ k: Input.keys.has('a') ? 'amove' : 'move', x: wx, y: wy });
  },

  applyMode(wx, wy, hit) {
    const m = this.mode, d = this.modeData;
    if (m === 'tAttack' || m === 'tAdvance') this.armyTask(m === 'tAttack' ? 'attack' : 'advance', wx, wy, hit);
    else if (m === 'move' || m === 'fast') this.issue({ k: m, x: wx, y: wy });
    else if (m === 'amove') this.issue(hit && Game.isFoe(hit.s) ? { k: 'attack', id: hit.id } : { k: 'amove', x: wx, y: wy });
    else if (m === 'load') {
      // Any transport in the tapped stack (or a parked plane at the tapped airfield) takes the selected units.
      const stack = Input.clusterAt(...Render.toScreen(wx, wy));
      let trs = stack && stack.side === Game.me() ? stack.units.filter((u) => UNIT_TYPES[u.t].cap && !this.sel.has(u.id)) : [];
      if (!trs.length) {
        const site = Input.siteAt(...Render.toScreen(wx, wy));
        if (site !== null) trs = Game.state.units.filter((u) => u.s === Game.me() && u.air && u.air.base === site && u.air.st === 'ground' && UNIT_TYPES[u.t].cap);
      }
      if (!trs.length || !this.loadInto(trs)) { this.toast(t('hintLoad'), 'bad'); return; }
    } else if (m === 'unloadAt') {
      this.issueTransport(wx, wy);
    } else if (m === 'airlift') {
      this.issueAirlift(wx, wy);
    } else if (m === 'nuke') {
      const bombers = this.selUnits().filter((u) => UNIT_TYPES[u.t].w.includes('bombs')).sort((a, b) => (b.nuke || 0) - (a.nuke || 0));
      let err = 'noNukes';
      for (const u of bombers) { err = Game.nukeBomber(u, wx, wy); if (!err) break; }
      if (err) { this.toast(t(err), 'bad'); return; }
      Render.ping(wx, wy, 'attack'); Sfx.play('alert');
      this.log(t('evNukeBomber'), 'warn', wx, wy);
    }
    else if (m === 'cas') {
      // Standing air mission: only planes whose airfield can reach the point take it.
      const planes = this.selUnits().filter((u) => u.air && (UNIT_TYPES[u.t].w.length || UNIT_TYPES[u.t].uav));
      const ok = planes.filter((u) => this.inAirReach(u, wx, wy));
      if (!ok.length) { this.toast(t('outOfRange'), 'bad'); return; }
      if (ok.length < planes.length) this.toast(t('casPartial', ok.length, planes.length), 'bad');
      else this.toast(t('casSet', ok.length));
      this.clearTasks(ok);
      Game.order(ok, { k: 'cas', x: wx, y: wy });
      Render.ping(wx, wy, 'attack'); Sfx.play('order');
      Panels.refresh(true);
    }
    else if (m === 'drop') { Game.order(this.selUnits().filter((u) => UNIT_TYPES[u.t].plane && u.cargo.length), { k: 'drop', x: wx, y: wy }); Sfx.play('order'); }
    else if (m === 'strike') {
      for (const u of this.selUnits().filter((u) => UNIT_TYPES[u.t].strike)) { const r = Game.carrierStrike(u, wx, wy); if (r) this.toast(t(r), 'bad'); else Sfx.play('order'); }
    } else if (m === 'slbm') {
      const u = this.selUnits().find((u) => u.slbm > 0);
      if (u) { const r = Game.launchMissile(Game.me(), 'slbm', u.x, u.y, wx, wy, { uid: u.id }); if (r) { this.toast(t(r), 'bad'); return; } }
    } else if (m === 'missile' && d.auto) {
      // From the missile overview: the closest base (or submarine) that reaches the target fires.
      const M = MISSILES[d.key], src = this.missileSources(d.key).filter((s) => U.dist(s.x, s.y, wx, wy) <= M.r)
        .sort((a, b) => U.dist2(a.x, a.y, wx, wy) - U.dist2(b.x, b.y, wx, wy))[0];
      if (!src) { this.toast(t('mslNoSource', L(M)), 'bad'); return; }
      const r = Game.launchMissile(Game.me(), d.key, src.x, src.y, wx, wy, src.from, d.nuke);
      if (r) { this.toast(t(r), 'bad'); return; }
      this.toast(t('mslLaunched', L(M), src.name));
      Render.ping(wx, wy, 'attack');
      Panels.refresh(true);
    } else if (m === 'missile') {
      const p = Geo.provinces[d.pid];
      const r = Game.launchMissile(Game.me(), d.key, p.x, p.y, wx, wy, { pid: d.pid }, d.nuke);
      if (r) { this.toast(t(r), 'bad'); return; }
      Panels.show();
    }
    this.setMode(null);
  },

  // ---------- Air force and missiles ----------
  inAirReach(u, x, y) { const h = Game.airHome(u); return U.dist(h.x, h.y, x, y) <= Game.airReach(u); },
  // Everything of the player that can fire missile type key: { x, y, name, n, from } for Game.launchMissile.
  missileSources(key) {
    const S = Game.state, me = Game.me(), out = [];
    if (key === 'slbm') {
      for (const u of S.units) if (u.s === me && u.slbm > 0 && !u.inside) out.push({ x: u.x, y: u.y, name: unitName(u.t), n: u.slbm, from: { uid: u.id }, uid: u.id });
    } else {
      S.prov.forEach((pr, pid) => { if (pr.o === me && pr.msl && pr.msl[key] > 0) { const p = Geo.provinces[pid]; out.push({ x: p.x, y: p.y, name: provName(p), n: pr.msl[key], from: { pid }, pid }); } });
    }
    return out;
  },
  // Short status of an aircraft for the air force overview.
  airStatus(u) {
    if (!u.air) return t('airField');
    if (u.air.st === 'ground') return u.cas ? t('airCasRefuel') : t('parked');
    if (u.ord && u.ord.k === 'rtb') return t('airRtb');
    if (u.ord && u.ord.k === 'nuke') return t('airNuke');
    return u.cas ? t('airCas') : t('airMission');
  },

  // ---------- Army tasks (shared battle-group tactics, see Tactics) ----------
  // attack: reconnaissance → artillery → assault on the tapped province or point; advance: march there and fight
  // on the way; hold: stop and dig in. Support units follow on their own; heavy losses trigger a retreat.
  armyTask(kind, wx, wy, hit) {
    const aks = this.selectedArmies();
    if (!aks.length) return;
    let x = wx, y = wy, pid = null;
    if (kind !== 'hold') {
      const sx = Render.toScreen(wx, wy), site = Input.siteAt(sx[0], sx[1]);
      const p = site !== null ? Geo.provinces[site] : Geo.provinceAt(wx, wy);
      if (hit && Game.isFoe(hit.s)) { x = hit.x; y = hit.y; }
      else if (p && Game.hostile(Game.me(), Game.state.prov[p.id].o)) { x = p.x; y = p.y; pid = p.id; }
      else if (site !== null) { x = p.x; y = p.y; }
    }
    // Several armies get the same task side by side instead of piling onto one point.
    aks.forEach((ak, i) => {
      const a = this.groups()[ak];
      let ax = x, ay = y;
      if (kind !== 'hold' && aks.length > 1) {
        const [cx, cy] = Tactics.center(this.armyIds(ak).map((id) => Game.unit(id)));
        const d = Math.max(0.01, U.dist(cx, cy, x, y)), off = (i - (aks.length - 1) / 2) * this.ARMY_GAP;
        const ox = x - ((y - cy) / d) * off, oy = y + ((x - cx) / d) * off;
        if (Geo.provinceAt(ox, oy)) { ax = ox; ay = oy; }
      }
      const g = { ids: a.ids.slice(), side: Game.me(), ret: a.ret === false ? 0 : Tactics.RETREAT };
      Tactics.task(g, kind, ax, ay, pid);
      a.task = g;
    });
    if (kind !== 'hold') Render.ping(x, y, kind === 'attack' ? 'attack' : 'move');
    this.toast(t('task_' + kind, aks.join(', ')));
    this.tutDone(kind === 'hold' ? 'hold' : 'move');
    Sfx.play('order');
    this.groupSig = ''; this.renderGroups(); Panels.show();
  },
  ARMY_GAP: 0.3,
  clearTasks(units) {
    const G = this.groups();
    for (const k in G) if (G[k].task && units.some((u) => G[k].ids.includes(u.id))) { G[k].task = null; this.groupSig = ''; }
  },
  // Short status of an army for the army bar and the panel.
  armyState(a, us) {
    const S = Game.state, g = a.task;
    if (g && g.ph !== 'done') return t('ph_' + (g.k === 'hold' && g.ph === 'hold' ? 'dig' : g.ph));
    const fight = us.some((u) => S.t - u.lastHit < 3 || S.t - (u.lf || -99) < 3);
    if (fight) return t('armyFight');
    if (us.some((u) => u.path || (u.ord && u.ord.k !== 'rtb'))) return t('armyMoving');
    const land = us.filter((u) => UNIT_TYPES[u.t].dom === 'land');
    if (land.length && land.every((u) => (u.dig || 0) > 0.9)) return t('ph_dig');
    return us.length ? t('armyIdle') : t('armyRecruiting');
  },

  // Selected cargo boards the given transports (distributed automatically).
  loadInto(trs) {
    const cargo = this.selUnits().filter((u) => trs.some((tr) => Game.fits(tr, u)));
    if (!cargo.length) return false;
    const n = Game.autoLoad(cargo, trs);
    if (!n) { this.toast(t('loadFull'), 'bad'); return true; }
    Render.ping(trs[0].x, trs[0].y, 'load'); Sfx.play('order');
    if (n < cargo.length) this.toast(t('loadPartial', n, cargo.length));
    return true;
  },

  // Split a selection into carriers (air transports first) and the units that can ride in them.
  loadSplit(us) {
    const air = us.filter((u) => UNIT_TYPES[u.t].cap && UNIT_TYPES[u.t].dom === 'air');
    const carriers = air.length ? air : us.filter((u) => UNIT_TYPES[u.t].cap);
    const cargo = us.filter((u) => !carriers.includes(u) && carriers.some((tr) => Game.fits(tr, u)));
    const room = carriers.reduce((s, tr) => s + UNIT_TYPES[tr.t].cap - Game.seatsUsed(tr), 0);
    return { carriers, cargo, room };
  },

  // One tap: free helicopters / parked transport planes (the selected ones, otherwise nearby) fetch the selected
  // troops and fly them to the point.
  airliftSplit(us) {
    const given = us.filter((u) => UNIT_TYPES[u.t].cap && UNIT_TYPES[u.t].dom === 'air');
    const cargo = us.filter((u) => UNIT_TYPES[u.t].dom === 'land' && !u.cargo.length);
    return { given, cargo };
  },
  issueAirlift(wx, wy) {
    const { given, cargo } = this.airliftSplit(this.selUnits());
    const n = Game.airlift(cargo, wx, wy, given);
    if (!n) { this.toast(t('liftNone'), 'bad'); return; }
    this.toast(n < cargo.length ? t('liftPartial', n, cargo.length) : t('liftOk', n));
    Render.ping(wx, wy, 'load'); Sfx.play('order');
  },

  // Loaded transports drive / fly to the point and unload there (transport aircraft land at a nearby airfield or drop paratroopers).
  issueTransport(wx, wy) {
    const trs = this.selUnits().filter((u) => u.cargo.length);
    if (!trs.length) return;
    Game.order(trs, { k: 'move', x: wx, y: wy, unload: 1 });
    Render.ping(wx, wy, 'load'); Sfx.play('order');
  },

  togglePause(force) {
    const S = Game.state;
    if (!S) return;
    S.paused = force ?? !S.paused;
    this.tutDone(S.paused ? 'pause' : 'play');
    this.renderTime();
  },
  setSpeed(v) { if (!Game.state) return; Game.state.speed = v; Game.state.paused = false; this.tutDone('play'); this.renderTime(); },

  // ---------- Command bar ----------
  renderCmdbar() {
    const bar = $('#cmdbar');
    const us = this.selUnits();
    if (!us.length) { bar.hidden = true; bar.innerHTML = ''; this.cmdMore = false; return; }
    const types = us.map((u) => UNIT_TYPES[u.t]);
    const anyLand = types.some((T) => T.dom === 'land'), anyPlane = types.some((T) => T.plane);
    const soft = us.some((u) => UNIT_TYPES[u.t].dom === 'land' && !UNIT_TYPES[u.t].cap);
    // Key hint in the corner shows the player's current binding for that command.
    const kh = (id) => { const k = Keys.of(id); return k ? `<span class="k">${U.esc(Keys.label(k))}</span>` : ''; };
    const btn = (id, icon, label, mode) => `<button class="cmd" data-c="${id}" ${mode ? `data-mode="${mode}"` : ''}>${KEY_GROUP[id] ? kh(id) : ''}${ICON[icon]}<span>${U.esc(label)}</span></button>`;
    // A whole army gets tasks first: it then fights on its own (see Tactics).
    // Small screens show the main orders first; stop, retreat, stance, box and close sit behind "More".
    let h = '<div class="cmd-main">';
    const armyBar = this.selectedArmies().length > 0 && anyLand;
    if (armyBar) {
      h += btn('tAttack', 'target', t('cmdTaskAttack'), 'tAttack') + btn('tAdvance', 'fast', t('cmdTaskAdvance'), 'tAdvance') + btn('tHold', 'shield', t('cmdTaskHold'));
      h += '<div class="sep"></div>';
    }
    h += btn('move', 'move', t('cmdMove'), 'move');
    if (anyLand) h += btn('fast', 'fast', t('cmdFast'), 'fast');
    h += btn('amove', 'attack', t('cmdAttack'), 'amove');
    // Situational orders (loading, transport, strikes) come right after the main orders so they stay visible on phones.
    let c = '';
    const ls = this.loadSplit(us);
    if (ls.carriers.length && ls.cargo.length && ls.room > 0) c += btn('autoload', 'load', t('cmdAutoLoad'));
    else if (ls.carriers.length && ls.room > 0) c += btn('pickup', 'load', t('cmdPickup'));
    // Boarding a transport is rare, so it waits behind "More" with the other secondary orders.
    const al = this.airliftSplit(us);
    if (al.cargo.length && Game.liftCarriers(al.cargo, undefined, undefined, al.given).length) c += btn('airlift', 'drop', t('cmdAirlift'), 'airlift');
    const board = soft && !ls.carriers.length ? btn('load', 'load', t('cmdLoad'), 'load') : '';
    if (us.some((u) => u.cargo.length)) { c += btn('unloadAt', 'drop', t('cmdUnloadAt'), 'unloadAt'); c += btn('unload', 'unload', t('cmdUnload')); }
    if (us.some((u) => UNIT_TYPES[u.t].plane && u.cargo.length)) c += btn('drop', 'drop', t('cmdDrop'), 'drop');
    if (us.some((u) => u.air && (UNIT_TYPES[u.t].w.length || UNIT_TYPES[u.t].uav))) c += btn('cas', 'target', t('cmdCas'), 'cas');
    if (anyPlane) c += btn('rtb', 'rtb', t('cmdRtb'));
    if (us.some((u) => UNIT_TYPES[u.t].strike)) c += btn('strike', 'strike', t('cmdStrike'), 'strike');
    if (us.some((u) => u.slbm > 0)) c += btn('slbm', 'missile', t('cmdSlbm'), 'slbm');
    if (us.some((u) => UNIT_TYPES[u.t].w.includes('bombs') && (u.nuke || Game.state.side[Game.me()].nukes > 0))) c += `<button class="cmd nuke" data-c="nuke" data-mode="nuke"><b class="nuke-ico">☢</b><span>${U.esc(t('cmdNuke'))}</span></button>`;
    // A whole army leads with its tasks; its situational orders move behind "More" as well.
    if (c && !armyBar) h += '<div class="sep"></div>' + c + '<div class="sep"></div>';
    h += '</div><div class="cmd-more">' + (armyBar ? c : '') + board;
    h += btn('stop', 'stop', t('cmdStop'));
    if (anyLand) h += btn('retreat', 'retreat', t('cmdRetreat'));
    const st = us[0].stance;
    h += `<button class="cmd" data-c="stance">${kh('stance')}${ICON.fire}<span>${U.esc({ free: t('stFree'), return: t('stReturn'), hold: t('stHold') }[st])}</span></button>`;
    h += btn('box', 'box', t('cmdBox'), 'box');
    h += btn('deselect', 'deselect', t('close'));
    h += '</div>' + btn('more', this.cmdMore ? 'retreat' : 'menu', t(this.cmdMore ? 'cmdLess' : 'cmdMore'));
    bar.innerHTML = h;
    bar.classList.toggle('more', !!this.cmdMore);
    bar.hidden = false;
    bar.querySelectorAll('.cmd').forEach((b) => (b.onclick = () => this.command(b.dataset.c)));
    this.setMode(this.mode, this.modeData);
  },

  command(c) {
    Sfx.play('click');
    const us = this.selUnits();
    switch (c) {
      case 'tHold': this.armyTask('hold'); break;
      case 'tAttack': case 'tAdvance': case 'move': case 'fast': case 'amove': case 'load': case 'unloadAt': case 'airlift': case 'drop': case 'cas': case 'strike': case 'slbm': case 'nuke': case 'box': this.setMode(this.mode === c ? null : c); break;
      case 'autoload': {
        const ls = this.loadSplit(us), n = Game.autoLoad(ls.cargo, ls.carriers);
        this.toast(n ? (n < ls.cargo.length ? t('loadPartial', n, ls.cargo.length) : t('loadOk', n)) : t('loadFull'), n ? '' : 'bad');
        // Keep only the transports selected, ready for the next order.
        if (n) this.select(ls.carriers.map((u) => u.id));
        break;
      }
      case 'pickup': {
        const n = Game.pickUp(this.loadSplit(us).carriers);
        this.toast(n ? t('loadOk', n) : t('loadNone'), n ? '' : 'bad');
        break;
      }
      case 'stop': this.clearTasks(us); Game.order(us, { k: 'stop' }); break;
      case 'retreat': this.clearTasks(us); Game.order(us, { k: 'retreat' }); break;
      case 'unload': {
        const ok = us.filter((u) => u.cargo.length).map((u) => Game.unload(u));
        if (!ok.some(Boolean)) this.toast(t('notOwned'), 'bad');
        this.pruneSelection(); break;
      }
      case 'rtb': for (const u of us) if (u.air) { delete u.cas; u.ord = { k: 'rtb' }; } Panels.refresh(true); break;
      case 'stance': {
        const next = { free: 'return', return: 'hold', hold: 'free' }[us[0].stance];
        Game.order(us, { k: 'stance', v: next }); this.renderCmdbar(); Panels.show(); break;
      }
      case 'deselect': this.deselect(); break;
      case 'more': this.cmdMore = !this.cmdMore; this.renderCmdbar(); break;
    }
  },

  // ---------- Top bar ----------
  renderTop() {
    const S = Game.state;
    if (!S) return;
    const s = S.side[S.player];
    for (const [id, k] of [['#resM', 'm'], ['#resI', 'i'], ['#resO', 'o']]) {
      const el = $(id);
      el.querySelector('.v').textContent = U.fmt(s[k]);
      // Net income after upkeep; the tooltip splits it into income and upkeep.
      const inc = el.querySelector('.inc'), n = s.inc[k];
      inc.textContent = (n < 0 ? '−' : '+') + U.fmt(Math.abs(n)) + t('perMin');
      inc.classList.toggle('neg', n < 0);
      // Phones hide the income line: the value itself turns red, and a tap shows the breakdown.
      el.classList.toggle('neg', n < 0);
      el.title = s.gross ? t('incTip', U.fmt(s.gross[k]), U.fmt(s.upk[k] || 0)) : '';
      if (!el.onclick) el.onclick = () => { const sd = Game.state && Game.state.side[Game.me()]; if (sd && sd.gross) this.toast(t('incTip', U.fmt(sd.gross[k]), U.fmt(sd.upk[k] || 0)) + ' → ' + (sd.inc[k] < 0 ? '−' : '+') + U.fmt(Math.abs(sd.inc[k])) + t('perMin')); };
    }
    this.renderTime();
  },

  renderTime() {
    const S = Game.state;
    if (!S) return;
    const d = Game.gameDate();
    const day = Math.floor(S.t * 120 / 86400) + 1;
    const loc = I18N.lang === 'de' ? 'de-DE' : 'en-GB';
    $('#clock').innerHTML = `<b>${d.toLocaleDateString(loc, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}</b>${d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} · ${t('days', day)}`;
    const p = $('#btnPause');
    p.classList.toggle('on', S.paused);
    p.innerHTML = S.paused ? ICON.play : ICON.pause;
    $('#pausedTag').hidden = !S.paused || !!S.over;
    // Points victory / surrender countdown, always visible while it runs.
    const vt = $('#vpTag');
    vt.hidden = !S.vp || !!S.over;
    if (S.vp) { vt.className = S.vp.r; vt.textContent = t(S.vp.r === 'win' ? 'vpTagWin' : 'vpTagLose', this.clockStr(S.vp.t - S.t)); }
    $$('#speedSeg button').forEach((b) => b.classList.toggle('on', !S.paused && +b.dataset.speed === S.speed));
  },

  // Seconds as m:ss (countdowns).
  clockStr(sec) { const s = Math.max(0, Math.ceil(sec)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); },

  renderObjectives() {
    const box = $('#objBox');
    if (box.hidden || !Game.state) return;
    const S = Game.state;
    const me = S.player;
    // Enemy provinces: everything held by factions at war with the player, measured against what they started with.
    const eTotal = S.prov.filter((p, i) => Game.hostile(Geo.countries[Geo.provinces[i].country].k, me) || Game.hostile(p.o, me)).length;
    const ep = S.prov.filter((p) => Game.hostile(p.o, me)).length, eu = S.units.filter((u) => Game.hostile(u.s, me)).length;
    const allies = Object.keys(S.team).filter((k) => k !== me && Game.allied(k, me) && Game.countProv(k)).length;
    // Victory points: meter with a mark at the threshold; own country turns red below the surrender line.
    const sc = Sim.score(), pct = (x) => Math.round(x * 100), mins = VICTORY.hold / 60;
    const hold = S.vp ? `<p class="vp-hold ${S.vp.r}">${U.esc(t(S.vp.r === 'win' ? 'objHoldWin' : 'objHoldLose', this.clockStr(S.vp.t - S.t)))}</p>` : '';
    box.innerHTML = `<h2>${U.esc(t('objectives'))}</h2><p class="desc">${U.esc(t(sc.world ? 'objWinWorld' : 'objWin', pct(sc.need), mins))}</p>${hold}
      <div class="stat-line"><span>${U.esc(t(sc.world ? 'objVpWorld' : 'objVp'))}</span><b>${pct(sc.win)} % / ${pct(sc.need)} %</b></div>
      <div class="meter vp"><i style="width:${Math.min(100, pct(sc.win))}%"></i><s style="left:${pct(sc.need)}%"></s></div>
      <div class="stat-line"><span>${U.esc(t('objOwnVp'))}</span><b class="${sc.own < VICTORY.lose ? 'neg' : ''}">${pct(sc.own)} %</b></div>
      <p class="desc small">${U.esc(t('objLose', 100 - pct(VICTORY.lose), mins))}</p>
      <div class="stat-line"><span>${U.esc(t('objProv'))}</span><b>${eTotal - ep} / ${eTotal}</b></div>
      <div class="stat-line"><span>${U.esc(t('objUnits'))}</span><b>${eu}</b></div>
      <div class="stat-line"><span>${U.esc(t('objYourProv'))}</span><b>${Game.countProv(me)}</b></div>
      <div class="stat-line"><span>${U.esc(t('objYourUnits'))}</span><b>${Game.countUnits(me)}</b></div>
      <div class="stat-line"><span>${U.esc(t('objAllies'))}</span><b>${allies}</b></div>${this.escHtml()}`;
  },

  // Escalation in the objectives window: own net conquests against the threshold, and a pending entry into the war.
  escHtml() {
    const S = Game.state, E = S.esc;
    if (!E || !E.on) return '';
    const pt = Game.team(S.player), gain = Game.vpGain()[pt] || 0, need = Game.escNeed(pt);
    const pend = E.pend ? `<p class="vp-hold ${E.pend.vs === pt ? 'lose' : Game.atWar(E.pend.vs, pt) ? '' : 'other'}">${U.esc(t('objEscPend', Panels.teamName(E.pend.k), Panels.teamName(E.pend.vs), this.clockStr(E.pend.t - S.t)))}</p>` : '';
    return `<h3 class="obj-sub">${U.esc(t('escalation'))}</h3>${pend}
      <div class="stat-line"><span>${U.esc(t('objEsc'))}</span><b class="${gain >= need ? 'neg' : ''}">${gain} / ${need}</b></div>
      <p class="desc small">${U.esc(t('objEscD', need))}</p>`;
  },

  // ---------- Log & toasts ----------
  log(text, kind = 'info', x, y) {
    const el = document.createElement('div');
    el.className = 'log-item ' + kind;
    el.textContent = text;
    if (x !== undefined) { el.style.pointerEvents = 'auto'; el.style.cursor = 'pointer'; el.onclick = () => Render.flyTo(x, y, Math.max(Render.cam.z, 18)); }
    const log = $('#log');
    log.prepend(el);
    while (log.children.length > 6) log.lastChild.remove();
    this.fadeLater(el);
    return el;
  },
  fadeLater(el) {
    clearTimeout(el.fadeT);
    el.style.opacity = '';
    el.fadeT = setTimeout(() => { el.style.opacity = '0'; el.fadeT = setTimeout(() => el.remove(), 700); }, 9000);
  },

  // ---------- Bundled army reports (#73) ----------
  // Everything that happens to one army within a few seconds (phase, fire, losses, kills, reinforcements) is
  // collected into a single log line that updates in place instead of one line per unit.
  ARMY_SEV: { info: 0, good: 1, warn: 2, bad: 3 },
  ARMY_WINDOW: 30, // game seconds one line keeps collecting

  armyNote(k, add, x, y) {
    const R = (this.armyRep = this.armyRep || {});
    let r = R[k];
    const now = Game.state.t;
    if (!r || !r.el || !r.el.isConnected || now - r.t0 > this.ARMY_WINDOW || now < r.t0) {
      r = R[k] = { t0: now, lost: {}, ready: {}, kills: 0, rout: new Set(), fire: false, st: null, kind: 'info' };
    }
    if (add.lost) r.lost[add.lost] = (r.lost[add.lost] || 0) + 1;
    if (add.ready) r.ready[add.ready] = (r.ready[add.ready] || 0) + 1;
    if (add.kill) r.kills++;
    if (add.rout) r.rout.add(add.rout);
    if (add.fire) r.fire = true;
    if (add.st) r.st = add.st;
    const kind = add.lost ? 'bad' : add.fire || add.rout ? 'warn' : add.kill ? 'good' : add.kind || 'info';
    if (this.ARMY_SEV[kind] > this.ARMY_SEV[r.kind]) r.kind = kind;
    const types = (m) => {
      const e = Object.entries(m).sort((a, b) => b[1] - a[1]);
      return e.slice(0, 3).map(([tk, n]) => unitName(tk) + (n > 1 ? ' ×' + n : '')).join(', ') + (e.length > 3 ? ', …' : '');
    };
    const sum = (m) => Object.values(m).reduce((s, n) => s + n, 0);
    const parts = [];
    if (r.st) parts.push(r.st);
    if (r.fire) parts.push(t('repFire'));
    if (sum(r.lost)) parts.push(t('repLost', sum(r.lost), types(r.lost)));
    if (r.rout.size) parts.push(t('repRout', r.rout.size));
    if (r.kills) parts.push(t('repKills', r.kills));
    if (sum(r.ready)) parts.push(t('repReady', sum(r.ready), types(r.ready)));
    const text = t('armyRep', k, parts.join(' · '));
    if (x !== undefined) { r.x = x; r.y = y; }
    if (r.el && r.el.isConnected) {
      r.el.textContent = text;
      r.el.className = 'log-item ' + r.kind;
      if (r.x !== undefined && !r.el.onclick) { r.el.style.pointerEvents = 'auto'; r.el.style.cursor = 'pointer'; }
      r.el.onclick = r.x !== undefined ? () => Render.flyTo(r.x, r.y, Math.max(Render.cam.z, 18)) : null;
      const log = $('#log');
      if (log.firstChild !== r.el) log.prepend(r.el);
      this.fadeLater(r.el);
    } else {
      r.el = this.log(text, r.kind, r.x, r.y);
      if (r.x !== undefined) r.el.onclick = () => Render.flyTo(r.x, r.y, Math.max(Render.cam.z, 18));
    }
  },

  toast(text, kind = '') {
    const now = performance.now();
    if (this.lastToast === text && now - this.lastToastT < 1500) return;
    this.lastToast = text; this.lastToastT = now;
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = text;
    $('#toasts').append(el);
    setTimeout(() => el.remove(), 2600);
  },

  // ---------- Game events -> feedback ----------
  wireGameEvents() {
    const pName = (pid) => provName(Geo.provinces[pid]);
    // With many factions only events that concern the player's country or its allies are reported.
    const me = () => Game.state.player;
    const ours = (x, y) => { const p = Geo.provinceAt(x, y); return p && Game.allied(Game.state.prov[p.id].o, me()); };
    Game.on('captured', ({ pid, side, prev }) => {
      Render.dirty = true; Render.dirtyMini = true;
      const p = Geo.provinces[pid];
      if (side === me()) { this.log(t('evCaptured', pName(pid)), 'good', p.x, p.y); Sfx.play('capture'); }
      else if (prev === me()) { this.log(t('evLost', pName(pid)), 'bad', p.x, p.y); Sfx.play('lost'); this.toast(t('evLost', pName(pid)), 'bad'); }
      else if (Game.allied(prev, me())) this.log(t('evAllyLost', pName(pid)), 'warn', p.x, p.y);
      else if (Game.allied(side, me())) this.log(t('evAllyCaptured', pName(pid)), 'info', p.x, p.y);
      if (Render.selProv === pid) Panels.show();
    });
    // Escalation: a neutral alliance mobilises against the leading side, stands down or enters the war. Loud when
    // it concerns the player's alliance (bad) or its enemies (good), a quiet log line for wars between others.
    const escNote = (key, { k, vs, x, y }, arg) => {
      const pt = Game.team(me()), kind = vs === pt ? 'bad' : Game.atWar(vs, pt) ? 'good' : 'info';
      const msg = t(key, Panels.teamName(k), Panels.teamName(vs), arg);
      this.log(msg, key === 'evEscOff' ? (kind === 'bad' ? 'good' : 'info') : kind, x, y);
      if (kind === 'info') return;
      this.toast(msg, key === 'evEscOff' ? (kind === 'bad' ? 'good' : 'warn') : kind);
      if (key !== 'evEscOff') { Sfx.play('alert'); if (x !== undefined) Render.ping(x, y, kind === 'bad' ? 'attack' : 'move'); }
    };
    Game.on('escWarn', (e) => { escNote('evEscWarn', e, Math.round(e.t / 60)); this.renderObjectives(); });
    Game.on('escOff', (e) => { escNote('evEscOff', e); this.renderObjectives(); });
    Game.on('war', ({ a, b, joined, why, at }) => {
      Render.dirty = true; Render.dirtyMini = true;
      if (why === 'esc') {
        // Point at the same country as the warning did (the one closest to the leader's conquests).
        const c = at ? { x: at[0], y: at[1] } : Game.capProv(Game.teamKeys(a)[0]);
        escNote('evEscJoin', { k: a, vs: b, x: c.x, y: c.y });
        if (Render.selProv !== null) Panels.show();
        this.renderObjectives();
        return;
      }
      this.toast(t('evWar', Panels.teamName(a), Panels.teamName(b)), 'warn');
      this.log(t('evWar', Panels.teamName(a), Panels.teamName(b)), 'warn');
      for (const tm of joined) this.log(t('evJoinWar', Panels.teamName(tm)), 'bad');
      Sfx.play('alert');
      if (Render.selProv !== null) Panels.show();
    });
    Game.on('casLost', (u) => this.log(t('evCasLost', unitName(u.t)), 'warn', u.x, u.y));
    Game.on('upkeepShort', (s) => {
      const k = s.inc.m < 0 ? 'm' : 'o', txt = t('evUpkeep', t(k === 'm' ? 'money' : 'oil'), U.fmt(-s.inc[k]));
      this.toast(txt, 'warn');
      this.log(txt, 'warn');
      Sfx.play('alert');
    });
    Game.on('produced', ({ pid, it, u }) => {
      const p = Geo.provinces[pid];
      if (u && it.g) this.joinArmy(it.g, u, it.rf);
      if (it.kind === 'nuke') this.toast(t('evNukeReady'), 'warn');
      if (it.kind === 'unit' && u && it.g) this.armyNote(it.g, { ready: it.key }, p.x, p.y);
      else if (it.kind === 'unit') this.log(t('evProduced', unitName(it.key), pName(pid)), 'info', p.x, p.y);
      else if (it.kind === 'msl') this.log(t('evProduced', L(MISSILES[it.key]), pName(pid)), 'info', p.x, p.y);
      else if (it.kind === 'nuke') this.log(t('evProduced', L(NUKE), pName(pid)), 'warn', p.x, p.y);
      else if (it.kind === 'bld') this.log(t('evBuilt', L(BUILDINGS[it.key]), pName(pid)), 'info', p.x, p.y);
      else this.log(t('evUpgraded', pName(pid), Game.state.prov[pid].lvl), 'good', p.x, p.y);
      Sfx.play('build');
      if (Render.selProv === pid) Panels.show();
    });
    Game.on('killed', ({ u, killer }) => {
      if (u.s === me()) { const k = this.armyOf(u.id); if (k) this.armyNote(k, { lost: u.t }, u.x, u.y); }
      else if (killer && killer.s === me()) { const k = this.armyOf(killer.id); if (k) this.armyNote(k, { kill: 1 }); }
      Sfx.at(UNIT_TYPES[u.t].cls === 'soft' ? 'mg' : 'boom', u.x, u.y, UNIT_TYPES[u.t].cls !== 'soft');
      if (Render.selection.has(u.id)) { Render.selection.delete(u.id); Panels.show(); this.renderCmdbar(); }
      if (Panels.enemy && Panels.enemy.id === u.id) Panels.close();
    });
    Game.on('shot', ({ w, x, y }) => Sfx.at(w.fx, x, y));
    Game.on('impact', (s) => Sfx.at('boom', s.x, s.y));
    Game.on('launch', (m) => {
      const own = m.side === me(), incoming = !Game.allied(m.side, me()) && ours(m.tx, m.ty);
      if (own) this.log(t(m.nuke ? 'evLaunchOwnNuke' : 'evLaunchOwn'), m.nuke ? 'warn' : 'info', m.tx, m.ty);
      else if (incoming) { const msg = t(m.nuke ? 'evLaunchNuke' : 'evLaunch'); this.toast(msg, 'bad'); this.log(msg, 'bad', m.tx, m.ty); Sfx.play('alert'); }
      Sfx.at('missile', m.x, m.y, true);
    });
    Game.on('intercepted', (m) => {
      if (m.side === me() || ours(m.tx, m.ty)) this.log(t(m.nuke ? 'evInterceptNuke' : 'evIntercept'), m.side === me() ? 'warn' : 'good', m.tx, m.ty);
    });
    Game.on('missileHit', (m) => {
      const p = Geo.provinceAt(m.tx, m.ty);
      if (m.side === me() || ours(m.tx, m.ty)) this.log(t('evMissileHit', p ? provName(p) : '—'), m.side === me() ? 'good' : 'bad', m.tx, m.ty);
      Sfx.at('bigboom', m.tx, m.ty, true);
      Render.dirty = true;
    });
    Game.on('nuke', ({ side, x, y }) => {
      const p = Geo.provinceAt(x, y), nm = p ? provName(p) : '—';
      this.log(t('evNuke', nm), Game.allied(side, me()) ? 'good' : 'bad', x, y);
      if (!Game.allied(side, me())) this.toast(t('evNuke', nm), 'bad');
      Sfx.at('bigboom', x, y, true);
      if (Render.selProv !== null) Panels.show();
    });
    Game.on('aiGather', ({ k, x, y, pid }) => {
      const msg = t('evGather', countryName(Geo.byKey[k]), pName(pid));
      this.toast(msg, 'bad'); this.log(msg, 'bad', x, y); Sfx.play('alert');
      Render.ping(x, y, 'attack');
    });
    Game.on('armyTask', ({ k, ev, g, from }) => {
      const [cx, cy] = Tactics.center(Tactics.members(g));
      if (ev === 'retreat') { this.armyNote(k, { st: t('repRetreat'), kind: 'warn' }, g.x, g.y); Sfx.play('alert'); }
      else if (ev === 'taken' && g.pid != null) this.armyNote(k, { st: t('repTaken', pName(g.pid)), kind: 'good' }, g.tx, g.ty);
      else if (ev === 'phase') {
        // Phase changes of a running task; the start of a task is the player's own order and is not reported.
        const st = g.ph === 'recon' ? t('repRecon') : g.ph === 'prep' ? t('repPrep') : g.ph === 'assault' ? t('repAssault')
          : g.ph === 'hold' && from === 'retreat' ? t('repBack')
          : g.ph === 'hold' && g.pid == null && (from === 'assault' || from === 'advance') ? t('repArrived') : null;
        if (st) this.armyNote(k, { st }, cx, cy);
      }
      this.groupSig = '';
    });
    Game.on('aiLanding', ({ k, ev, x, y, pid }) => {
      const msg = t(ev === 'sail' ? 'evLandingSail' : 'evLanding', countryName(Geo.byKey[k]), pName(pid));
      this.toast(msg, 'bad'); this.log(msg, 'bad', x, y); Sfx.play('alert');
      Render.ping(x, y, 'attack');
    });
    Game.on('aiCalledOff', ({ k, x, y }) => this.log(t('evCalledOff', countryName(Geo.byKey[k])), 'good', x, y));
    Game.on('aiRetreat', ({ k, x, y }) =>this.log(t('evRetreat', countryName(Geo.byKey[k])), 'good', x, y));
    Game.on('liftGo', (u) => this.log(t('evLiftGo', unitName(u.t), u.cargo.length), 'info', u.x, u.y));
    Game.on('unloaded', (u) => this.log(t('evUnloaded', unitName(u.t)), 'info', u.x, u.y));
    Game.on('noPath', () => this.toast(t('evNoPath'), 'bad'));
    Game.on('crash', (u) => this.log(t('evCrash', unitName(u.t)), 'warn', u.x, u.y));
    Game.on('rout', (u) => {
      const k = this.armyOf(u.id);
      if (k) this.armyNote(k, { rout: u.id }, u.x, u.y);
      else if (this.sel.has(u.id)) this.log(t('evRout', unitName(u.t)), 'warn', u.x, u.y);
    });
    Game.on('vpHold', ({ r, ev }) => {
      const key = r === 'win' ? (ev === 'start' ? 'evVpWin' : 'evVpWinBroken') : ev === 'start' ? 'evVpLose' : 'evVpLoseBroken';
      const kind = (r === 'win') === (ev === 'start') ? 'good' : 'bad';
      const msg = t(key, VICTORY.hold / 60);
      this.toast(msg, kind); this.log(msg, kind);
      if (!SelfTest.active) Sfx.play(kind === 'good' ? 'capture' : 'alert');
      this.renderTime();
    });
    Game.on('over', (r) => {
      if (SelfTest.active) return;
      const S = Game.state;
      Sfx.play(r === 'win' ? 'victory' : 'defeat'); Saves.autosave();
      setTimeout(() => { if (Game.state === S) Screens.endScreen(r); }, 600);
    });
  },

  // ---------- Tutorial ----------
  // Each step: text id (TUTORIAL), the action that completes it (until, see tutDone) and the real buttons to highlight
  // (hl: the first visible match wins, so a fallback can point at the step before, e.g. the army button).
  TUT_STEPS: [
    { id: 'welcome' },
    { id: 'map' },
    { id: 'army', until: 'army', hl: ['#groups .grp[data-g="1"]'] },
    { id: 'armyPanel', hl: ['#panel .army-box'] },
    { id: 'hold', until: 'hold', hl: ['#cmdbar [data-c="tHold"]', '#groups .grp[data-g="1"]'] },
    { id: 'attack', until: 'move', hl: ['#cmdbar [data-c="tAttack"].on', '#cmdbar [data-c="tAttack"]', '#groups .grp[data-g="1"]'] },
    { id: 'time', until: 'play', hl: ['#btnPause'] },
    { id: 'province', until: 'province', enter: () => { const c = Game.state && Geo.byKey[Game.me()].provinces.map((pid) => Geo.provinces[pid]).find((p) => p.type === 'capital'); if (c) Render.flyTo(c.x, c.y, Math.max(Render.cam.z, 16)); } },
    { id: 'recruit', until: 'recruit', hl: ['#panel .fcard:not(.off)', '#panel .tabs [data-k="form"]'] },
    { id: 'economy', hl: ['.res-group'] },
    { id: 'objectives', until: 'obj', hl: ['#btnObj'] },
    { id: 'ready' },
  ],
  startTutorial() { this.tutStep = 0; this.tutFlags = {}; this.renderTut(); },
  tutDone(flag) {
    this.tutFlags[flag] = true;
    const st = this.TUT_STEPS[this.tutStep];
    if (st && st.until === flag) { this.tutStep++; this.renderTut(); }
  },
  endTut() { this.tutStep = -1; $('#tut').hidden = true; this.tutHighlight(); },
  renderTut() {
    const box = $('#tut'), steps = this.TUT_STEPS;
    const st = steps[this.tutStep];
    if (!st) { this.endTut(); return; }
    if (st.until && this.tutFlags[st.until]) { this.tutStep++; this.renderTut(); return; }
    const tx = TUTORIAL[I18N.lang][st.id], last = this.tutStep === steps.length - 1;
    box.innerHTML = `<h4>${U.esc(tx.h)}</h4><p>${tx.b}</p><div class="row"><span class="steps">${this.tutStep + 1} / ${steps.length}</span>
      <span class="row"><button class="btn sm" id="tutSkip">${U.esc(t('skip'))}</button>${st.until ? '' : `<button class="btn sm primary" id="tutNext">${U.esc(last ? t('done') : t('next'))}</button>`}</span></div>`;
    box.hidden = false;
    $('#tutSkip').onclick = () => this.endTut();
    const n = $('#tutNext');
    if (n) n.onclick = () => { this.tutStep++; this.renderTut(); };
    if (st.enter) st.enter();
    this.tutHighlight();
  },
  // Marks the button the current step talks about; runs again with the HUD refresh, because bars and panels re-render.
  tutHighlight() {
    const st = this.tutStep >= 0 ? this.TUT_STEPS[this.tutStep] : null;
    let el = null;
    if (st && st.hl) for (const s of st.hl) { el = $$(s).find((e) => e.offsetParent); if (el) break; }
    $$('.tut-hl').forEach((e) => e !== el && e.classList.remove('tut-hl'));
    // A newly marked button inside a scrolling panel is scrolled into view once.
    if (el && !el.classList.contains('tut-hl')) { el.classList.add('tut-hl'); if (el.closest('.p-body')) el.scrollIntoView({ block: 'nearest' }); }
    // Portrait: the tip moves to the top when the highlighted button or the open panel fills the lower half.
    const box = $('#tut');
    if (box.hidden) return;
    const low = !$('#panel').hidden || (el && el.getBoundingClientRect().bottom > innerHeight * 0.55);
    box.classList.toggle('top', innerHeight > innerWidth && low);
  },

  // Called every frame.
  tick(dt) {
    if (!Game.state) return;
    this.tick4 += dt;
    if (this.tick4 >= 0.25) {
      this.tick4 = 0;
      this.renderTop();
      this.pruneSelection();
      Panels.refresh();
      this.renderObjectives();
      this.renderGroups();
      if (this.tutStep >= 0) this.tutHighlight();
    }
  },

  // ---------- Armies (persistent unit groups 1–9, saved with the game) ----------
  // An army is { ids: [unit ids], coh: keep together }. A unit belongs to at most one army.
  groups() {
    const S = Game.state, G = (S.groups = S.groups || {});
    for (const k in G) if (Array.isArray(G[k])) G[k] = { ids: G[k], coh: true };
    return G;
  },
  armyIds(k) { const a = this.groups()[k]; return a ? a.ids.filter((id) => Game.unit(id)) : []; },
  armyOf(id) { const G = this.groups(); for (const k in G) if (G[k].ids.includes(id)) return k; return null; },
  pendingArmy(k) { return Game.state.prov.some((pr) => pr.o === Game.me() && pr.q.some((q) => q.g === k)); },
  freeArmyKey() {
    const G = this.groups();
    for (let i = 1; i <= 9; i++) { const k = String(i); if (!G[k] || (!this.armyIds(k).length && !this.pendingArmy(k) && !G[k].res)) return k; }
    return null;
  },
  // The army whose units are exactly the current selection.
  selectedArmy() {
    if (!this.sel.size) return null;
    const k = this.armyOf([...this.sel][0]);
    if (!k) return null;
    const ids = this.armyIds(k);
    return ids.length === this.sel.size && ids.every((id) => this.sel.has(id)) ? k : null;
  },
  // All armies when the selection is exactly one or more whole armies, otherwise an empty list.
  selectedArmies() {
    if (!this.sel.size) return [];
    const keys = new Set();
    for (const id of this.sel) { const k = this.armyOf(id); if (!k) return []; keys.add(k); }
    let n = 0;
    for (const k of keys) { const ids = this.armyIds(k); if (!ids.every((id) => this.sel.has(id))) return []; n += ids.length; }
    return n === this.sel.size ? [...keys].sort() : [];
  },
  // Add a whole army to the selection, or take it out again.
  toggleArmy(k) {
    const ids = this.armyIds(k);
    if (!ids.length) { if (this.pendingArmy(k)) this.toast(t('armyPending', k)); return; }
    const cur = [...this.sel], on = ids.every((id) => this.sel.has(id));
    const next = on ? cur.filter((id) => !ids.includes(id)) : cur.concat(ids.filter((id) => !this.sel.has(id)));
    if (next.length) this.select(next); else this.selectGroup(k);
    this.groupSig = ''; this.renderGroups();
  },
  // Merge the given armies into the first one: units, target strength and units still in production.
  mergeArmies(keys) {
    const G = this.groups(), into = keys[0], a = G[into];
    const mates = this.armyIds(into).map((id) => Game.unit(id)).filter((m) => !m.inside && UNIT_TYPES[m.t].dom === 'land');
    for (const k of keys.slice(1)) {
      const b = G[k];
      if (!b) continue;
      const moved = this.armyIds(k).map((id) => Game.unit(id));
      a.ids.push(...moved.map((u) => u.id));
      for (const ty in b.plan || {}) Tactics.planAdd(a, ty, b.plan[ty]);
      for (const pr of Game.state.prov) if (pr.o === Game.me()) for (const q of pr.q) if (q.g === k) q.g = into;
      delete G[k];
      // The newcomers drive to the army they now belong to.
      const land = moved.filter((u) => !u.inside && UNIT_TYPES[u.t].dom === 'land');
      if (mates.length && land.length) { const [cx, cy] = Tactics.center(mates); Game.order(land, { k: 'move', x: cx, y: cy, coh: 1 }); }
    }
    this.toast(t('armyMerged', keys.slice(1).join(', '), into));
    this.groupSig = ''; this.renderGroups(); this.renderCmdbar();
    this.select(this.armyIds(into));
  },
  // Take units out of the target strength of the armies they leave (or of army `only`).
  planDrop(ids, keep) {
    const G = this.groups();
    for (const g in G) {
      if (g === keep) continue;
      for (const id of ids) { const u = Game.unit(id); if (u && G[g].ids.includes(id)) Tactics.planAdd(G[g], u.t, -1); }
    }
  },
  setGroup(k, ids) {
    const G = this.groups(), old = G[k];
    this.planDrop(ids, k);
    for (const g in G) G[g].ids = G[g].ids.filter((id) => !ids.includes(id));
    const a = { ...(old || {}), ids: ids.slice(), coh: old ? old.coh : true, task: null, plan: { ...((old && old.plan) || {}) } };
    delete a.res;
    if (old) for (const id of old.ids) { const u = Game.unit(id); if (u && !ids.includes(id)) Tactics.planAdd(a, u.t, -1); }
    for (const id of ids) { const u = Game.unit(id); if (u && !(old && old.ids.includes(id))) Tactics.planAdd(a, u.t, 1); }
    G[k] = a;
    this.groupSig = '';
    this.renderGroups();
    // Army tasks (attack, advance, hold) appear as soon as the selection is an army.
    this.renderCmdbar();
  },
  addToGroup(k, ids) { const cur = this.armyIds(k); this.setGroup(k, cur.concat(ids.filter((id) => !cur.includes(id)))); },
  removeFromGroups(ids) { const G = this.groups(); this.planDrop(ids); for (const g in G) G[g].ids = G[g].ids.filter((id) => !ids.includes(id)); this.groupSig = ''; this.renderGroups(); this.renderCmdbar(); },
  // Reserve an army number for units that are still being recruited.
  reserveArmy() {
    const k = this.freeArmyKey();
    if (!k) return null;
    this.groups()[k] = { ids: [], coh: true, plan: {}, res: Game.state.t + 2 };
    this.groupSig = '';
    return k;
  },
  newGroup(ids = [...this.sel]) {
    if (!ids.length) { this.toast(t('groupHint')); return null; }
    const k = this.freeArmyKey();
    if (!k) { this.toast(t('armyFull'), 'bad'); return null; }
    this.setGroup(k, ids);
    this.toast(t('groupMade', k));
    return k;
  },
  // Split the selected army: the second half of each unit type forms a new army.
  splitArmy() {
    const ak = this.selectedArmy(), us = this.selUnits();
    if (!ak || us.length < 2) return;
    const byType = {};
    for (const u of us) (byType[u.t] = byType[u.t] || []).push(u);
    let half = [];
    for (const k in byType) half = half.concat(byType[k].slice(Math.ceil(byType[k].length / 2)));
    if (!half.length) half = [us[us.length - 1]];
    const k = this.freeArmyKey();
    if (!k) { this.toast(t('armyFull'), 'bad'); return; }
    this.setGroup(k, half.map((u) => u.id));
    this.toast(t('armySplit', ak, k));
    this.select(half.map((u) => u.id));
  },
  // A freshly recruited unit joins its army and drives to the army's ground forces.
  // A replacement (rf) fills a gap; anything else raises the army's target strength.
  joinArmy(k, u, rf) {
    const G = this.groups();
    if (!G[k]) G[k] = { ids: [], coh: true, plan: {} };
    const mates = this.armyIds(k).map((id) => Game.unit(id)).filter((m) => !m.inside && UNIT_TYPES[m.t].dom === 'land');
    G[k].ids.push(u.id); delete G[k].res;
    if (!rf) Tactics.planAdd(G[k], u.t, 1);
    this.groupSig = '';
    if (!u.air && UNIT_TYPES[u.t].dom !== 'sea' && mates.length) {
      const cx = mates.reduce((s, m) => s + m.x, 0) / mates.length, cy = mates.reduce((s, m) => s + m.y, 0) / mates.length;
      if (U.dist(u.x, u.y, cx, cy) > 0.5) Game.order([u], { k: 'move', x: cx, y: cy });
    }
  },
  // Replacements still in production are refunded when they are no longer wanted.
  cancelRefills(k) {
    Game.state.prov.forEach((pr, pid) => {
      if (pr.o !== Game.me()) return;
      for (let i = pr.q.length - 1; i >= 0; i--) if (pr.q[i].rf && pr.q[i].g === k) Game.cancel(pid, i);
    });
  },
  selectGroup(k) {
    const ids = this.armyIds(k);
    if (!ids.length) { if (this.pendingArmy(k)) this.toast(t('armyPending', k)); return; }
    const again = ids.length === this.sel.size && ids.every((id) => this.sel.has(id));
    this.select(ids);
    if (again) this.centerSelection();
  },
  centerSelection() {
    const us = this.selUnits();
    if (us.length) Render.flyTo(us.reduce((s, u) => s + u.x, 0) / us.length, us.reduce((s, u) => s + u.y, 0) / us.length);
  },
  renderGroups() {
    const S = Game.state, G = this.groups(), box = $('#groups');
    const rows = [];
    Render.groupOf = new Map();
    const pending = {};
    for (const pr of S.prov) if (pr.o === Game.me()) for (const q of pr.q) if (q.g) pending[q.g] = (pending[q.g] || 0) + (q.n || 1);
    for (const k of Object.keys(G).sort()) {
      G[k].ids = G[k].ids.filter((id) => Game.unit(id));
      if (G[k].res && G[k].res < S.t && !pending[k]) delete G[k].res;
      if (!G[k].ids.length && !pending[k] && !G[k].res) { delete G[k]; continue; }
      const us = G[k].ids.map((id) => Game.unit(id));
      us.forEach((u) => Render.groupOf.set(u.id, k));
      const hp = us.length ? us.reduce((s, u) => s + u.hp / UNIT_TYPES[u.t].hp, 0) / us.length : 0;
      const fight = us.some((u) => S.t - u.lastHit < 3 || S.t - (u.lf || -99) < 3);
      const moving = us.some((u) => u.path || (u.ord && u.ord.k !== 'rtb'));
      if (fight && !(this.fightT && this.fightT[k] > S.t)) { (this.fightT = this.fightT || {})[k] = S.t + 30; if (us.some((u) => S.t - u.lastHit < 3)) this.armyNote(k, { fire: true }, us[0].x, us[0].y); }
      // Icon of the strongest unit type shows what the army is made of.
      const main = us.slice().sort((a, b) => UNIT_TYPES[b.t].cost.m - UNIT_TYPES[a.t].cost.m)[0];
      const sel = us.length && us.every((u) => this.sel.has(u.id));
      const st = this.armyState(G[k], us);
      rows.push(`<button data-g="${k}" class="grp${sel ? ' on' : ''}${fight ? ' fight' : ''}${moving && !fight ? ' moving' : ''}" title="${U.esc(t('army') + ' ' + k + ' · ' + st)}"><b>${k}</b>${main ? `<img src="${UnitIcon.get(main.t)}" alt="">` : ''}<span>${U.esc(st)}</span><em>${us.length}${pending[k] ? `<small>+${pending[k]}</small>` : ''}</em><i style="width:${Math.round(hp * 100)}%"></i></button>`);
    }
    rows.push(`<button data-g="new" class="grp add" ${this.sel.size ? '' : 'disabled'} title="${U.esc(t('groupHint'))}">+ ${U.esc(t('army'))}</button>`);
    const html = rows.join('');
    if (html !== this.groupSig) { this.groupSig = html; box.innerHTML = html; }
  },
};
