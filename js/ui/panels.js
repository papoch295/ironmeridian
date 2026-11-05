// Side panel: province management (institutions, recruitment, queue, missiles) and unit details.
'use strict';

const Panels = {
  tab: 'form',
  view: 'recruit',     // province panel: recruit | build
  batch: 1,            // how many units one click recruits
  army: null,          // army that recruited units join: null | 'new' | army key
  enemy: null,
  special: null,       // overview instead of selection/province: null | 'air' | 'msl'
  min: false,          // folded to its head
  sig: '',

  el() { return $('#panel'); },
  close() { this.enemy = null; this.special = null; this.el().hidden = true; this.sig = ''; },

  // Air force / missile overview from the quick bar; a second tap closes it again.
  toggleSpecial(k) {
    if (this.special === k && !this.el().hidden) { this.close(); return; }
    Render.selection.clear();
    if (Render.selProv !== null) { Render.selProv = null; Render.dirty = true; }
    UI.setMode(null); UI.renderCmdbar();
    this.enemy = null; this.special = k; this.min = false; this.sig = '';
    this.refresh(true);
  },

  show() {
    this.enemy = null;
    this.special = null;
    this.sig = '';
    this.refresh(true);
  },
  showEnemy(u) { this.enemy = u; this.sig = ''; this.refresh(true); },

  // Re-render only when the visible data changed (keeps buttons stable under the finger).
  refresh(force) {
    const S = Game.state;
    if (!S) return;
    let sig, render;
    if (this.enemy) {
      const u = Game.unit(this.enemy.id);
      if (!u || !Sim.sees(S.player, u)) { this.close(); return; }
      sig = 'e' + u.id + Math.round(u.hp);
      render = () => this.enemyHtml(u);
    } else if (this.special === 'air') {
      const us = this.airUnits();
      sig = 'A' + us.map((u) => u.id + (u.air ? u.air.st + Math.round(u.air.fuel / (UNIT_TYPES[u.t].fuel || 400) * 10) + (u.air.base ?? '') : '') + (u.ord ? u.ord.k : '') + (u.cas ? 'C' : '') + u.cargo.join(',') + (u.lift ? 'L' : '')).join('|');
      render = () => this.airHtml(us);
    } else if (this.special === 'msl') {
      sig = 'M' + ['srbm', 'cruise', 'icbm', 'slbm'].map((k) => UI.missileSources(k).map((s) => s.name + s.n).join()).join('|') + (S.side[S.player].nukes || 0) + (UI.mode === 'missile' && UI.modeData ? UI.modeData.key : '');
      render = () => this.mslHtml();
    } else if (UI.sel.size) {
      const us = UI.selUnits();
      sig = 'u' + us.map((u) => u.id + ':' + Math.round(u.hp) + ':' + u.ammo.join(',') + ':' + u.cargo.join(',') + (u.lift ? 'L' : '') + u.stance + Math.round(u.sup / 10) + (u.nuke ? 'N' : '') + (u.air ? u.air.st + Math.round(u.air.fuel / 5) : '')).join('|') +
        JSON.stringify(UI.groups()) + Game.state.side[Game.me()].nukes;
      render = () => this.unitsHtml(us);
    } else if (Render.selProv !== null) {
      const pid = Render.selProv, pr = S.prov[pid];
      sig = 'p' + pid + pr.o + pr.lvl + JSON.stringify(pr.b) + pr.q.map((q) => q.key + 'x' + (q.n || 1)).join() + JSON.stringify(pr.msl) + this.tab + this.view + this.batch + this.army + Math.round(pr.def) + (pr.cap ? Math.round(pr.cap.p * 20) : '') +
        ['m', 'i', 'o'].map((k) => Math.floor(Game.state.side[Game.me()][k] / 50)).join() + Game.state.side[Game.me()].nukes + Object.keys(UI.groups()).join() + Sim.inFallout(Geo.provinces[pid]) +
        S.units.filter((u) => u.air && u.air.base === pid && u.air.st === 'ground' && u.s === Game.me()).map((u) => u.cargo.length).join();
      render = () => this.provHtml(pid);
    } else { this.close(); return; }
    // Progress bars update in place every tick.
    if (!force && sig === this.sig) { this.updateProgress(); return; }
    this.sig = sig;
    const body = this.el().querySelector('.p-body');
    const scroll = body ? body.scrollTop : 0;
    this.el().innerHTML = render();
    this.el().classList.toggle('min', this.min);
    this.el().hidden = false;
    const nb = this.el().querySelector('.p-body');
    if (nb) nb.scrollTop = scroll;
    this.bind();
    this.updateProgress();
  },

  updateProgress() {
    const S = Game.state;
    if (Render.selProv === null) return;
    const pr = S.prov[Render.selProv];
    this.el().querySelectorAll('[data-q]').forEach((b) => { const it = pr.q[+b.dataset.q]; if (it) b.style.width = (it.t / it.total * 100).toFixed(1) + '%'; });
  },

  head(title, sub, tag) {
    // The fold button shrinks the panel to its head so the map stays visible (mainly for phones).
    return `<div class="p-head"><div class="ttl" data-act="unfold"><h2>${U.esc(title)}</h2><div class="sub">${sub}</div></div>${tag || ''}<button class="ibtn x fold" data-act="fold" title="${U.esc(t(this.min ? 'panelOpen' : 'panelFold'))}">${this.min ? ICON.chevDown : ICON.chevUp}</button><button class="ibtn x" data-act="close">${ICON.close}</button></div>`;
  },

  // Owner tag: relation colour plus the owning country (o = faction key).
  sideTag(o) {
    const rk = Game.rk(o), c = o && Geo.byKey[o];
    const rel = rk === 'P' ? t('player') : rk === 'A' ? t('ally') : rk === 'E' ? t('enemy') : t('neutral');
    return `<span class="side-tag ${rk}" title="${U.esc(c ? countryName(c) : '')}">${U.esc(rel)}</span>`;
  },
  teamName(tm) { const b = BLOCS.find((x) => x.id === tm); return b ? L(b) : Geo.byKey[tm] ? countryName(Geo.byKey[tm]) : tm; },

  mult(c, n) { return { m: (c.m || 0) * n, i: (c.i || 0) * n, o: (c.o || 0) * n }; },
  // Running cost of what is being bought (see UPKEEP), shown on the recruitment cards.
  upkHtml(c) {
    const m = Math.round((c.m || 0) * UPKEEP.m), o = Math.round((c.o || 0) * UPKEEP.o);
    return `<span class="upk" title="${U.esc(t('upkTip', m, o))}">${U.esc(t('upkShort', m))}</span>`;
  },
  tabName(b) { return BUILDING_TABS[b] ? BUILDING_TABS[b][I18N.lang === 'en' ? 1 : 0] : L(BUILDINGS[b]); },
  reason(why, bld, tier) { return why === 'needBuilding' ? t('needBuilding', L(BUILDINGS[bld]), tier) : t(why); },

  provHtml(pid) {
    const S = Game.state, p = Geo.provinces[pid], pr = S.prov[pid], c = Geo.countries[p.country];
    const PT = PROVINCE_TYPES[p.type];
    let h = this.head(provName(p), `${U.esc(L(PT))} · ${U.esc(countryName(c))}`, this.sideTag(pr.o));
    h += '<div class="p-body">';
    const md = Game.maxDef(pid), df = pr.def / md, fallout = Sim.inFallout(p);
    const k = fallout ? 0 : pr.lvl * (pr.cap && pr.cap.s !== pr.o ? 0.5 : 1);
    const A = AAD_LEVELS[pr.b.aad || 0];
    h += `<div class="kv"><span>${U.esc(t('level'))}</span><b class="stars">${'★'.repeat(pr.lvl)}<span class="muted">${'★'.repeat(MAX_LEVEL - pr.lvl)}</span></b>
      <span>${U.esc(t('income'))}</span><b>${costHtml({ m: PT.m * k, i: PT.i * k, o: PT.o * k })}<span class="muted small"> ${t('perMin')}</span></b>
      <span>${U.esc(t('defense'))}</span><div><div class="bar ${df < 0.35 ? 'bad' : df < 0.7 ? 'warn' : ''}"><i style="width:${df * 100}%"></i></div></div>
      ${pr.o ? `<span>${U.esc(t('radarRange'))}</span><b>${Math.round(RADAR_RANGE[pr.b.radar || 0] * 111)} km${pr.b.radar ? ` <span class="muted small">(${U.esc(t('lvl', pr.b.radar))})</span>` : ''}</b>` : ''}
      ${A ? `<span>${U.esc(t('aaRange'))}</span><b>${Math.round(A.r * 111)} km <span class="muted small">(${U.esc(t('lvl', pr.b.aad))})</span></b>` : ''}</div>`;
    if (fallout) h += `<p class="small warn-line">☢ ${U.esc(t('falloutHere'))}</p>`;
    if (pr.cap && pr.cap.p > 0) h += `<p class="small" style="color:${COL[Game.rk(pr.cap.s)].fill}">${U.esc(t('capturing', Math.round(pr.cap.p * 100)))}</p>`;
    if (pr.o !== S.player) {
      const rk = Game.rk(pr.o);
      if (pr.o && pr.o !== c.k) h += `<p class="small muted">${U.esc(t('heldBy', countryName(Geo.byKey[pr.o])))}</p>`;
      if (rk !== 'N') h += `<h3>${U.esc(t('buildings'))}</h3>` + Object.keys(BUILDINGS).filter((b) => pr.b[b]).map((b) => `<div class="bld"><span class="nm">${U.esc(L(BUILDINGS[b]))}</span><span class="lv">${U.esc(t('lvl', pr.b[b]))}</span></div>`).join('');
      if (rk === 'N' && pr.o) {
        // Neutral country: the player may declare war on its whole alliance; neighbours may join the defender.
        const tm = S.team[pr.o];
        h += `<h3>${U.esc(t('diplomacy'))}</h3><p class="small muted">${U.esc(t('neutralInfo', this.teamName(tm)))}</p>
          <button class="btn danger" data-act="war" style="width:100%">${U.esc(t('declareWar'))}</button>`;
      }
      return h + '</div>';
    }
    const tabs = Object.keys(BUILDINGS).filter((b) => pr.b[b] > 0 && !BUILDINGS[b].noRecruit);
    // Battle groups come first: one tap recruits a whole army.
    if (['barracks', 'factory', 'airfield'].some((b) => pr.b[b] > 0)) tabs.unshift('form');
    // Two views keep the panel short: recruitment and construction. The queue is visible in both.
    h += `<div class="seg view-seg"><button data-act="view" data-k="recruit" class="${this.view === 'recruit' ? 'on' : ''}">${U.esc(t('recruit'))}</button><button data-act="view" data-k="build" class="${this.view === 'build' ? 'on' : ''}">${U.esc(t('develop'))}</button></div>`;
    h += `<h3>${U.esc(t('queue'))} <span class="muted small">${pr.q.length} / ${Game.QUEUE_MAX}</span></h3>`;
    if (!pr.q.length) h += `<p class="muted small">${U.esc(t('empty'))}</p>`;
    pr.q.forEach((it, i) => {
      const nm = it.kind === 'unit' ? unitName(it.key) : it.kind === 'msl' ? L(MISSILES[it.key]) : it.kind === 'nuke' ? L(NUKE) : it.kind === 'bld' ? `${L(BUILDINGS[it.key])} ↑` : `${t('upgradeProv')} ↑`;
      const img = it.kind === 'unit' ? `<img src="${UnitIcon.get(it.key)}" alt="">` : '';
      h += `<div class="qitem">${img}<span class="nm">${U.esc(nm)}${(it.n || 1) > 1 ? ` <b class="cnt">×${it.n}</b>` : ''}${it.g ? ` <span class="army-tag">${U.esc(it.g)}</span>` : ''}</span><div class="bar blue"><i data-q="${i}"></i></div><button data-act="cancel" data-i="${i}" title="${U.esc(t('cancel'))}">✕</button></div>`;
    });
    if (this.view === 'build' || !tabs.length) return h + this.buildHtml(pid, !tabs.length) + '</div>';

    if (!tabs.includes(this.tab)) this.tab = tabs[0];
    h += `<h3>${U.esc(t('recruit'))}</h3><div class="tabs">${tabs.map((b) => `<button data-act="tab" data-k="${b}" class="${b === this.tab ? 'on' : ''}">${U.esc(b === 'form' ? t('formations') : this.tabName(b))}${b !== 'form' ? `<small>${pr.b[b]}</small>` : ''}</button>`).join('')}</div>`;
    if (this.tab !== 'form') {
      h += `<div class="opt-row"><span>${U.esc(t('amount'))}</span><div class="seg small">${[1, 3, 5, 10].map((n) => `<button data-act="batch" data-k="${n}" class="${this.batch === n ? 'on' : ''}">×${n}</button>`).join('')}</div></div>`;
    }
    if (this.tab !== 'silo' && this.tab !== 'lab') h += this.armyPicker();
    h += '<div class="ugrid">';
    const n = this.tab === 'form' ? 1 : this.batch;
    if (this.tab === 'silo') {
      for (const key of ['srbm', 'cruise', 'icbm']) {
        const M = MISSILES[key], why = Game.canQueue(pid, 'msl', key);
        h += `<button class="ucard ${why ? 'off' : ''}" data-act="msl" data-k="${key}" title="${U.esc(why ? this.reason(why, 'silo', M.tier) : '')}">
          <span class="tm">${Math.round(M.time * TIME_SCALE)}s</span><span class="top"><img src="${UnitIcon.missile()}" alt=""><span class="nm">${U.esc(L(M))}</span></span>
          ${why === 'needBuilding' ? `<span class="lock">${U.esc(this.reason(why, 'silo', M.tier))}</span>` : costHtml(this.mult(M.cost, n), Game.me())}</button>`;
      }
    } else if (this.tab === 'lab') {
      const why = Game.canQueue(pid, 'nuke', 'nuke'), c = Game.itemCost(pid, 'nuke', 'nuke');
      h += `<button class="ucard nukecard ${why ? 'off' : ''}" data-act="nuke" data-k="nuke" title="${U.esc(why ? t(why) : '')}">
        <span class="tm">${Math.round(c.t)}s</span><span class="top"><span class="nuke-ico">☢</span><span class="nm">${U.esc(L(NUKE))}</span></span>${costHtml(this.mult(NUKE.cost, n), Game.me())}</button>`;
      h += `</div><p class="small muted">${U.esc(t('nukeInfo', Math.round(NUKE.r * 111)))}</p><div class="stat-line"><span>${U.esc(t('nukeStock'))}</span><b>☢ ${Game.state.side[Game.me()].nukes || 0}</b></div><div>`;
    } else if (this.tab === 'form') {
      for (const F of FORMATIONS) {
        let lock = null;
        for (const k in F.u) { const T = UNIT_TYPES[k]; if ((pr.b[T.bld] || 0) < T.tier) { lock = this.reason('needBuilding', T.bld, T.tier); break; } }
        const off = lock || !Game.afford(Game.me(), Game.formationCost(F)) || pr.q.length + Object.keys(F.u).length > Game.QUEUE_MAX;
        h += `<button class="ucard fcard ${off ? 'off' : ''}" data-act="form" data-k="${F.id}"><span class="nm">${U.esc(L(F))}</span>
          <span class="fl">${Object.keys(F.u).map((k) => `<span title="${U.esc(unitName(k))}"><img src="${UnitIcon.get(k)}" alt="">${F.u[k]}</span>`).join('')}</span>
          ${lock ? `<span class="lock">${U.esc(lock)}</span>` : costHtml(Game.formationCost(F), Game.me()) + this.upkHtml(Game.formationCost(F))}</button>`;
      }
    } else {
      for (const key in UNIT_TYPES) {
        const T = UNIT_TYPES[key];
        if (T.bld !== this.tab) continue;
        const why = Game.canQueue(pid, 'unit', key);
        h += `<button class="ucard ${why ? 'off' : ''}" data-act="unit" data-k="${key}" title="${U.esc(L({ de: T.dd, en: T.ed }))}">
          <span class="tm">${Math.round(T.time * TIME_SCALE)}s</span><span class="top"><img src="${UnitIcon.get(key)}" alt=""><span class="nm">${U.esc(L(T))}</span></span>
          ${why === 'needBuilding' ? `<span class="lock">${U.esc(this.reason(why, T.bld, T.tier))}</span>` : costHtml(this.mult(T.cost, n), Game.me()) + this.upkHtml(this.mult(T.cost, n))}</button>`;
      }
    }
    h += '</div>';
    if (this.tab === 'form') h += `<p class="small muted">${U.esc(t('formInfo'))}</p>`;
    // Missile inventory: conventional or nuclear launch.
    const inv = Object.keys(pr.msl).filter((k) => pr.msl[k] > 0), nukes = Game.state.side[Game.me()].nukes || 0;
    if (inv.length) {
      h += `<h3>${U.esc(t('missiles'))}</h3><div class="mini-list">` + inv.map((k) => `<div class="row"><span>${U.esc(L(MISSILES[k]))} × ${pr.msl[k]} <span class="muted small">(${MISSILES[k].r * 111 | 0} km)</span></span>
        <span class="row"><button class="btn sm primary" data-act="launch" data-k="${k}">${U.esc(t('launch'))}</button>${nukes ? `<button class="btn sm nuke" data-act="launchN" data-k="${k}" title="${U.esc(t('launchNuke'))}">☢</button>` : ''}</span></div>`).join('') + '</div>';
    }
    // Aircraft parked here.
    const parked = S.units.filter((u) => u.air && u.air.base === pid && u.air.st === 'ground' && u.s === Game.me());
    if (parked.length) {
      h += `<h3>${U.esc(t('aircraftHere'))}</h3><div class="groups">` + parked.map((u) => `<button class="gchip" data-act="selu" data-id="${u.id}"><img src="${UnitIcon.get(u.t)}" alt=""><span>${U.esc(unitName(u.t))}${u.nuke ? ' ☢' : ''}</span>${this.cargoTag(u)}</button>`).join('') + '</div>';
    }
    return h + '</div>';
  },

  // ---------- Transport load ----------
  // Load state of a transport: tag "used / capacity" coloured empty / partly / full, and the cargo grouped by type.
  cargoTag(u) {
    const T = UNIT_TYPES[u.t];
    if (!T.cap) return '';
    const used = Game.seatsUsed(u), st = used === 0 ? 'empty' : used >= T.cap ? 'full' : 'part';
    const tip = used === 0 ? t('cargoEmpty') : used >= T.cap ? t('cargoFull') : '';
    return `<span class="ctag ${st}${u.lift ? ' wait' : ''}" title="${U.esc(u.lift ? t('cargoWait') : tip)}">${used}/${T.cap}</span>`;
  },
  cargoIcons(u) {
    const by = {};
    for (const id of u.cargo) { const c = Game.unit(id); if (c) by[c.t] = (by[c.t] || 0) + 1; }
    const ks = Object.keys(by);
    if (!ks.length) return `<span class="cic muted">${U.esc(u.lift ? t('cargoWait') : t('cargoEmpty'))}</span>`;
    return '<span class="cic">' + ks.map((k) => `<span title="${U.esc(unitName(k))}"><img src="${UnitIcon.get(k)}" alt="">${by[k] > 1 ? '×' + by[k] : ''}</span>`).join('') + '</span>';
  },

  // ---------- Air force overview ----------
  airUnits() {
    const me = Game.me(), order = Object.keys(UNIT_TYPES);
    return Game.state.units.filter((u) => u.s === me && UNIT_TYPES[u.t].dom === 'air' && !u.inside)
      .sort((a, b) => order.indexOf(a.t) - order.indexOf(b.t) || a.id - b.id);
  },
  // Ready = parked, refuelled and rearmed without a standing mission, or a helicopter with nothing to do.
  airReady(u) {
    const T = UNIT_TYPES[u.t];
    if (!u.air) return !u.ord && !u.path;
    return u.air.st === 'ground' && !u.cas && u.air.fuel >= (T.fuel || 400) * 0.95 && T.w.every((k, i) => !W[k].ammo || u.ammo[i] >= W[k].ammo * 0.9);
  },

  airHtml(us) {
    let h = this.head(t('qAir'), U.esc(us.length === 1 ? t('airCount1') : t('airCount', us.length)));
    h += '<div class="p-body">';
    if (!us.length) return h + `<p class="muted small">${U.esc(t('airNone'))}</p></div>`;
    const ready = us.filter((u) => this.airReady(u)), cas = us.filter((u) => u.cas);
    h += `<div class="btn-row"><button class="btn sm primary" data-act="airReady" ${ready.length ? '' : 'disabled'}>${U.esc(t('airSelReady', ready.length))}</button>
      <button class="btn sm" data-act="airAll">${U.esc(t('airSelAll'))}</button>${cas.length ? `<button class="btn sm" data-act="airCasAll">${U.esc(t('airSelCas', cas.length))}</button>` : ''}</div>`;
    // Types: one tap selects every aircraft of that type.
    const types = {};
    for (const u of us) (types[u.t] = types[u.t] || []).push(u);
    h += '<div class="groups">' + Object.keys(types).map((k) => `<button class="gchip" data-act="airType" data-k="${k}" title="${U.esc(unitName(k))}"><img src="${UnitIcon.get(k)}" alt=""><b>${types[k].length}</b><span>${U.esc(unitName(k))}</span></button>`).join('') + '</div>';
    h += `<p class="small muted">${U.esc(t('airInfo'))}</p><div class="alist">`;
    for (const u of us) {
      const T = UNIT_TYPES[u.t], fuel = u.air ? u.air.fuel / (T.fuel || 400) : 1;
      const base = u.air && u.air.base !== null ? provName(Geo.provinces[u.air.base]) : '—';
      const cls = u.cas ? 'cas' : u.air && u.air.st === 'ground' ? 'ground' : 'fly';
      h += `<button class="arow ${cls}" data-act="selu" data-id="${u.id}"><img src="${UnitIcon.get(u.t)}" alt=""><span class="nm">${U.esc(unitName(u.t))}${u.nuke ? ' ☢' : ''}<small>${U.esc(base)} · ${U.esc(UI.airStatus(u))}</small>${T.cap ? this.cargoIcons(u) : ''}</span>${this.cargoTag(u)}${u.air ? `<div class="bar blue" title="${U.esc(t('fuel'))}"><i style="width:${Math.round(fuel * 100)}%"></i></div>` : ''}</button>`;
    }
    return h + '</div></div>';
  },

  // ---------- Missile overview ----------
  mslHtml() {
    const S = Game.state, nukes = S.side[S.player].nukes || 0;
    let h = this.head(t('missiles'), nukes ? `☢ ${nukes} · ${U.esc(t('nukeStock'))}` : U.esc(t('mslSub')));
    h += '<div class="p-body">';
    const keys = ['srbm', 'cruise', 'icbm', 'slbm'].map((k) => ({ k, src: UI.missileSources(k) })).filter((x) => x.src.length);
    if (!keys.length) return h + `<p class="muted small">${U.esc(t('mslNone'))}</p></div>`;
    h += `<p class="small muted">${U.esc(t('mslInfo'))}</p>`;
    for (const { k, src } of keys) {
      const M = MISSILES[k], n = src.reduce((s, x) => s + x.n, 0), on = UI.mode === 'missile' && UI.modeData && UI.modeData.auto && UI.modeData.key === k;
      h += `<div class="mrow${on ? ' on' : ''}"><img src="${UnitIcon.missile()}" alt=""><span class="nm">${U.esc(L(M))} <b>× ${n}</b><small>${Math.round(M.r * 111)} km · ${U.esc(src.length === 1 ? t('mslBase1') : t('mslBases', src.length))}</small></span>
        <button class="btn sm primary" data-act="mslFire" data-k="${k}">${U.esc(t('launch'))}</button>${nukes ? `<button class="btn sm nuke" data-act="mslNuke" data-k="${k}" title="${U.esc(t('launchNuke'))}">☢</button>` : ''}</div>`;
    }
    h += `<h3>${U.esc(t('mslSites'))}</h3><div class="alist">`;
    const sites = {};
    for (const { k, src } of keys) for (const s of src) { const id = s.pid !== undefined ? 'p' + s.pid : 'u' + s.uid; (sites[id] = sites[id] || { s, list: [] }).list.push(`${L(MISSILES[k])} × ${s.n}`); }
    for (const id in sites) { const { s, list } = sites[id]; h += `<button class="arow" data-act="mslSite" data-k="${id}"><span class="nm">${U.esc(s.name)}<small>${U.esc(list.join(', '))}</small></span></button>`; }
    return h + '</div></div>';
  },

  // Army that newly recruited units join.
  armyPicker() {
    const G = UI.groups(), keys = Object.keys(G).sort();
    if (this.army && this.army !== 'new' && !G[this.army]) this.army = null;
    const b = (k, label) => `<button data-act="army" data-k="${k}" class="${(this.army || '') === k ? 'on' : ''}">${U.esc(label)}</button>`;
    return `<div class="opt-row"><span>${U.esc(t('toArmy'))}</span><div class="seg small">${b('', '–')}${b('new', '+ ' + t('newShort'))}${keys.map((k) => b(k, k)).join('')}</div></div>`;
  },

  buildHtml(pid, none) {
    const pr = Game.state.prov[pid], p = Geo.provinces[pid];
    let h = none ? `<p class="small muted">${U.esc(t('noInstitution'))}</p>` : '';
    const upCost = Game.itemCost(pid, 'upg'), upWhy = Game.canQueue(pid, 'upg');
    h += `<h3>${U.esc(t('develop'))}</h3><div class="bld"><span class="nm">${U.esc(t('upgradeProv'))}<small>${U.esc(t('dUpgrade'))}</small></span>${upWhy === 'maxLevel' ? `<span class="muted small">${U.esc(t('maxLevel'))}</span>` : `${costHtml(upCost, Game.me())}<button class="btn sm" data-act="upg" ${upWhy ? 'disabled' : ''}>${U.esc(t('upgrade'))}</button>`}</div>`;
    h += `<h3>${U.esc(t('buildings'))}</h3>`;
    for (const b in BUILDINGS) {
      const B = BUILDINGS[b];
      if (B.coastal && !p.seaPt) continue;
      const why = Game.canQueue(pid, 'bld', b), cost = Game.itemCost(pid, 'bld', b);
      h += `<div class="bld"><span class="nm">${U.esc(L(B))}<small>${U.esc(t('d_' + b))}</small></span><span class="lv">${pr.b[b] ? U.esc(t('lvl', pr.b[b])) : '—'}</span>
        ${why === 'maxLevel' ? '' : `${costHtml(cost, Game.me())}<button class="btn sm" data-act="bld" data-k="${b}" ${why ? 'disabled' : ''}>${U.esc(pr.b[b] ? t('upgrade') : t('build'))}</button>`}</div>`;
    }
    return h;
  },

  // Army controls for the current selection.
  armyHtml(us) {
    const G = UI.groups(), ak = UI.selectedArmy(), ids = us.map((u) => u.id);
    if (ak) {
      const a = G[ak];
      const ret = a.ret !== false, str = a.task && a.task.hp0 ? Math.round(Tactics.strength(a.task) * 100) : null;
      return `<div class="army-box"><div class="army-row"><b class="army-badge">${U.esc(ak)}</b><span class="nm">${U.esc(t('army'))} ${U.esc(ak)}</span>${Input.touch ? '' : `<span class="muted small">${U.esc(t('armyKeys', ak, ak))}</span>`}</div>
        <div class="army-row"><span class="muted small">${U.esc(t('task'))}:</span><b class="small">${U.esc(UI.armyState(a, us))}</b>${str !== null ? `<span class="muted small">· ${U.esc(t('strength'))} ${str} %</span>` : ''}</div>
        <div class="army-row"><button class="achip ${ret ? 'on' : ''}" data-act="ret" title="${U.esc(t('autoRetreatTip'))}">${ret ? '✓ ' : ''}${U.esc(t('autoRetreat'))}</button>
        <button class="achip ${a.coh ? 'on' : ''}" data-act="coh">${a.coh ? '✓ ' : ''}${U.esc(t('keepTogether'))}</button>
        ${us.length > 1 ? `<button class="achip" data-act="split">${U.esc(t('splitArmy'))}</button>` : ''}<button class="achip bad" data-act="disband">${U.esc(t('disband'))}</button></div></div>`;
    }
    const inArmy = ids.some((id) => UI.armyOf(id));
    const keys = Object.keys(G).sort();
    return `<div class="army-box"><div class="army-row"><span class="muted small">${U.esc(t('army'))}:</span><button class="achip" data-act="newArmy">+ ${U.esc(t('newArmy'))}</button>
      ${keys.map((k) => `<button class="achip" data-act="toArmy" data-k="${k}" title="${U.esc(t('addToArmy', k))}">→ ${U.esc(k)}</button>`).join('')}
      ${inArmy ? `<button class="achip bad" data-act="unArmy">${U.esc(t('leaveArmy'))}</button>` : ''}</div></div>`;
  },

  unitsHtml(us) {
    if (us.length === 1) return this.unitHtml(us[0]);
    const groups = {};
    for (const u of us) (groups[u.t] = groups[u.t] || []).push(u);
    const ak = UI.selectedArmy();
    let h = this.head(ak ? `${t('army')} ${ak}` : t('selected', us.length), ak ? t('selected', us.length) : Object.keys(groups).length + ' ' + (I18N.lang === 'de' ? 'Typen' : 'types'));
    h += '<div class="p-body">' + this.armyHtml(us) + '<div class="groups">';
    for (const k in groups) h += `<button class="gchip" data-act="only" data-k="${k}"><img src="${UnitIcon.get(k)}" alt=""><b>${groups[k].length}</b><span>${U.esc(unitName(k))}</span></button>`;
    h += '</div>';
    const hp = us.reduce((s, u) => s + u.hp / UNIT_TYPES[u.t].hp, 0) / us.length;
    h += `<div class="kv" style="margin-top:12px"><span>${U.esc(t('hp'))}</span><div><div class="bar ${hp < 0.35 ? 'bad' : hp < 0.7 ? 'warn' : ''}"><i style="width:${hp * 100}%"></i></div></div>`;
    const cap = us.filter((u) => UNIT_TYPES[u.t].cap);
    if (cap.length) h += `<span>${U.esc(t('cargo'))}</span><b>${cap.reduce((s, u) => s + Game.seatsUsed(u), 0)} / ${cap.reduce((s, u) => s + UNIT_TYPES[u.t].cap, 0)}</b>`;
    h += '</div>';
    // Every unit individually, so a single squad can be pulled out of a stack.
    h += `<h3>${U.esc(t('units'))}</h3><div class="ulist">` + us.slice(0, 60).map((u) => {
      const f = u.hp / UNIT_TYPES[u.t].hp;
      return `<button class="uchip" data-act="selu" data-id="${u.id}" title="${U.esc(unitName(u.t))}"><img src="${UnitIcon.get(u.t)}" alt="">${UNIT_TYPES[u.t].cap ? this.cargoTag(u) : ''}<div class="bar ${f < 0.35 ? 'bad' : f < 0.7 ? 'warn' : ''}"><i style="width:${f * 100}%"></i></div></button>`;
    }).join('') + '</div>';
    return h + '</div>';
  },

  unitHtml(u) {
    const T = UNIT_TYPES[u.t];
    let h = this.head(unitName(u.t), U.esc(modelName(u)), this.sideTag(u.s));
    h += `<div class="p-body"><div class="unit-big"><img src="${UnitIcon.get(u.t, Game.look(u.s))}" alt=""><p class="desc">${U.esc(L({ de: T.dd, en: T.ed }))}</p></div>`;
    if (u.s === Game.me()) h += this.armyHtml([u]);
    const f = u.hp / T.hp;
    h += `<div class="kv"><span>${U.esc(T.men ? t('men') : t('hp'))}</span><div>${T.men ? Math.max(1, Math.ceil(f * T.men)) + ' / ' + T.men : Math.round(f * 100) + '%'}<div class="bar ${f < 0.35 ? 'bad' : f < 0.7 ? 'warn' : ''}"><i style="width:${f * 100}%"></i></div></div>`;
    if (T.cls === 'soft') h += `<span>${U.esc(t('sup'))}</span><div><div class="bar warn"><i style="width:${u.sup}%"></i></div></div>`;
    if (u.air) h += `<span>${U.esc(t('fuel'))}</span><div>${u.air.st === 'ground' ? U.esc(t('parked')) : ''}<div class="bar blue"><i style="width:${u.air.fuel / (T.fuel || 400) * 100}%"></i></div></div>`;
    if (T.cap) h += `<span>${U.esc(t('cargo'))}</span><b>${this.cargoTag(u)}${T.capVeh ? ` <span class="muted small">(${U.esc(t('vehOk'))})</span>` : ''}</b>`;
    h += `<span>${U.esc(t('kills'))}</span><b>${u.kills}</b></div>`;
    if (u.nuke) h += `<p class="small warn-line">☢ ${U.esc(t('nukeAboard'))}</p>`;
    if (T.w.length) {
      h += `<h3>${U.esc(t('ammo'))}</h3>`;
      T.w.forEach((k, i) => {
        const w = W[k];
        const wn = WEAPON_NAMES[k][I18N.lang === 'en' ? 1 : 0];
        h += `<div class="wpn"><span>${U.esc(wn)} · ${(w.r * 111).toFixed(0)} km</span><b>${w.ammo ? Math.floor(u.ammo[i]) + ' / ' + w.ammo : '<span style="font-family:Segoe UI,sans-serif">∞</span>'}</b></div>`;
      });
    }
    if (T.cap && (u.cargo.length || u.s === Game.me())) {
      const by = {};
      for (const id of u.cargo) { const c = Game.unit(id); if (c) by[c.t] = (by[c.t] || 0) + 1; }
      h += `<h3>${U.esc(t('cargo'))}</h3>` + (u.cargo.length ? '<div class="groups">' + Object.keys(by).map((k) => `<div class="gchip"><img src="${UnitIcon.get(k)}" alt="">${by[k] > 1 ? `<b>${by[k]}</b>` : ''}<span>${U.esc(unitName(k))}</span></div>`).join('') + '</div>' : `<p class="small muted">${U.esc(u.lift ? t('cargoWait') : t('cargoEmpty'))}</p>`);
    }
    if (u.slbm !== undefined) h += `<div class="wpn"><span>SLBM</span><b>${u.slbm} / ${T.slbm}</b></div>`;
    if (T.strike) h += `<div class="wpn"><span>${U.esc(t('cmdStrike'))}</span><b>${u.strikeCd > 0 ? Math.ceil(u.strikeCd) + 's' : t('ok')}</b></div>`;
    h += `<h3>${U.esc(t('stance'))}</h3><div class="seg">${['free', 'return', 'hold'].map((s) => `<button data-act="stance" data-k="${s}" class="${u.stance === s ? 'on' : ''}">${U.esc(t('st' + s[0].toUpperCase() + s.slice(1)))}</button>`).join('')}</div>`;
    return h + '</div>';
  },

  enemyHtml(u) {
    const T = UNIT_TYPES[u.t], f = u.hp / T.hp;
    return this.head(unitName(u.t), U.esc(modelName(u)), this.sideTag(u.s)) +
      `<div class="p-body"><div class="unit-big"><img src="${UnitIcon.get(u.t, Game.look(u.s))}" alt=""><p class="desc">${U.esc(L({ de: T.dd, en: T.ed }))}</p></div>
      <div class="kv"><span>${U.esc(t('hp'))}</span><div><div class="bar ${f < 0.35 ? 'bad' : f < 0.7 ? 'warn' : ''}"><i style="width:${f * 100}%"></i></div></div></div>
      <button class="btn sm" data-act="attackIt" ${UI.sel.size ? '' : 'disabled'}>${U.esc(t('cmdAttack'))}</button></div>`;
  },

  // Army key for recruitment ('new' reserves a fresh army number).
  recruitArmy() {
    if (this.army !== 'new') return this.army || null;
    const k = UI.reserveArmy();
    if (!k) UI.toast(t('armyFull'), 'bad');
    return k;
  },

  bind() {
    this.el().querySelectorAll('[data-act]').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const a = b.dataset.act, k = b.dataset.k, pid = Render.selProv;
        Sfx.play('click');
        if (a === 'close') { UI.deselect(); this.close(); return; }
        if (a === 'fold' || (a === 'unfold' && this.min)) { this.min = !this.min; this.refresh(true); return; }
        if (a === 'unfold') return;
        if (a === 'tab') { this.tab = k; this.refresh(true); return; }
        if (a === 'view') { this.view = k; this.refresh(true); return; }
        if (a === 'batch') { this.batch = +k; this.refresh(true); return; }
        if (a === 'army') { this.army = k || null; this.refresh(true); return; }
        if (a === 'war') {
          const S = Game.state, tm = S.team[S.prov[pid].o];
          Screens.ask(t('declareWar'), t('confirmWar', this.teamName(tm)), () => {
            if (Game.declareWar(S.team[S.player], tm)) Sfx.play('alert');
            this.refresh(true);
          });
          return;
        }
        if (a === 'unit' || a === 'msl' || a === 'bld' || a === 'upg' || a === 'nuke') {
          const n = a === 'bld' || a === 'upg' ? 1 : this.batch;
          const g = a === 'unit' ? this.recruitArmy() : null;
          if (a === 'unit' && this.army === 'new' && !g) return;
          const why = Game.queue(pid, a, k, { n, g });
          if (why) UI.toast(why === 'needBuilding' ? (a === 'nuke' ? t('needBuilding', L(BUILDINGS.lab), 1) : this.reason(why, a === 'msl' ? 'silo' : UNIT_TYPES[k].bld, a === 'msl' ? MISSILES[k].tier : UNIT_TYPES[k].tier)) : t(why), 'bad');
          else {
            const it = Game.state.prov[pid].q[Game.state.prov[pid].q.length - 1];
            if (n > 1 && it && it.n < n && it.key === k) UI.toast(t('batchPartial', it.n));
            if (g && this.army === 'new') { this.army = g; UI.toast(t('recruitToArmy', g)); }
            if (a === 'unit' || a === 'msl') UI.tutDone('recruit');
            Sfx.play('build');
          }
          this.refresh(true);
          return;
        }
        if (a === 'form') {
          const F = FORMATIONS.find((f) => f.id === k), g = UI.reserveArmy();
          if (!g) { UI.toast(t('armyFull'), 'bad'); return; }
          const why = Game.queueFormation(pid, F, g);
          if (why) { UI.toast(t(why), 'bad'); delete UI.groups()[g]; }
          else { UI.toast(t('formQueued', L(F), g)); UI.tutDone('recruit'); Sfx.play('build'); }
          this.refresh(true);
          return;
        }
        if (a === 'cancel') { Game.cancel(pid, +b.dataset.i); this.refresh(true); return; }
        if (a === 'launch') { UI.setMode('missile', { pid, key: k }); return; }
        if (a === 'launchN') { UI.setMode('missile', { pid, key: k, nuke: true }); return; }
        if (a === 'selu') { const u = Game.unit(+b.dataset.id), fromList = this.special === 'air'; UI.select([+b.dataset.id]); if (u && fromList) Render.flyTo(u.x, u.y); return; }
        if (a === 'airReady' || a === 'airAll' || a === 'airCasAll' || a === 'airType') {
          const us = this.airUnits().filter((u) => a === 'airAll' || (a === 'airReady' ? this.airReady(u) : a === 'airCasAll' ? u.cas : u.t === k));
          if (us.length) UI.select(us.map((u) => u.id));
          return;
        }
        if (a === 'mslFire' || a === 'mslNuke') { UI.setMode('missile', { key: k, auto: true, nuke: a === 'mslNuke' }); this.refresh(true); return; }
        if (a === 'mslSite') {
          if (k[0] === 'p') { const p = Geo.provinces[+k.slice(1)]; UI.selectProvince(p.id); Render.flyTo(p.x, p.y); }
          else { const u = Game.unit(+k.slice(1)); if (u) { UI.select([u.id]); Render.flyTo(u.x, u.y); } }
          return;
        }
        if (a === 'only') { UI.select(UI.selUnits().filter((u) => u.t === k).map((u) => u.id)); return; }
        if (a === 'stance') { Game.order(UI.selUnits(), { k: 'stance', v: k }); this.refresh(true); UI.renderCmdbar(); return; }
        if (a === 'newArmy') { UI.newGroup(); this.refresh(true); return; }
        if (a === 'toArmy') { UI.addToGroup(k, [...UI.sel]); UI.toast(t('addedToArmy', k)); this.refresh(true); return; }
        if (a === 'unArmy') { UI.removeFromGroups([...UI.sel]); this.refresh(true); return; }
        if (a === 'coh') { const g = UI.groups()[UI.selectedArmy()]; if (g) g.coh = !g.coh; this.refresh(true); return; }
        if (a === 'ret') {
          const g = UI.groups()[UI.selectedArmy()];
          if (g) { g.ret = g.ret === false; if (g.task) g.task.ret = g.ret ? Tactics.RETREAT : 0; }
          this.refresh(true); return;
        }
        if (a === 'split') { UI.splitArmy(); return; }
        if (a === 'disband') { const ak = UI.selectedArmy(); if (ak) { delete UI.groups()[ak]; UI.groupSig = ''; UI.renderGroups(); UI.renderCmdbar(); UI.toast(t('armyDisbanded', ak)); } this.refresh(true); return; }
        if (a === 'attackIt' && this.enemy) { UI.issue({ k: 'attack', id: this.enemy.id }); this.show(); }
      };
    });
  },
};
