// Screens and dialogs: main menu, scenario setup, pause menu, save/load, settings, help, end of war.
'use strict';

const Screens = {
  setup: { country: 'DE', mode: 'bloc', enemy: 'EU', diff: 'normal', esc: true, ev: true },
  attract: true,

  show(id) {
    for (const s of ['#loading', '#menu', '#setup']) $(s).hidden = s !== id;
    $('#hud').hidden = id !== null;
  },

  // ---------- Main menu ----------
  menu() {
    Game.state = null;
    Render.selection.clear(); Render.selProv = null; Render.preview = null; Render.dirty = true; Render.dirtyMini = true;
    this.attract = true;
    this.closeModal();
    $('#tut').hidden = true;
    this.show('#menu');
    $('#mCont').disabled = !Saves.latest();
    $('#mNew').onclick = () => this.setupScreen(false);
    $('#mTut').onclick = () => this.setupScreen(true);
    $('#mCont').onclick = () => { const l = Saves.latest(); if (l) this.loadSlot(l.id); };
    $('#mLoad').onclick = () => this.slots('load');
    $('#mHelp').onclick = () => this.help();
    $('#mSettings').onclick = () => this.settings();
  },

  // ---------- Scenario setup ----------
  neighbors() { return Geo.neighbors(); },

  blocTouches(a, b) {
    const nb = this.neighbors();
    const B = new Set(b.members.filter((k) => Geo.byKey[k]).map((k) => Geo.byKey[k].idx));
    return a.members.some((k) => Geo.byKey[k] && [...nb[Geo.byKey[k].idx]].some((i) => B.has(i)));
  },

  // The player's team: their bloc, or the country alone when it belongs to no bloc.
  ownTeam(k) { return BLOCS.find((b) => b.members.includes(k)) || { id: k, de: countryName(Geo.byKey[k]), en: countryName(Geo.byKey[k]), members: [k], solo: true }; },

  setupScreen(tutorial) {
    this.tutorial = tutorial;
    this.attract = false;
    // The tutorial skips the setup: a fixed, easy scenario starts right away.
    if (tutorial) { Object.assign(this.setup, { country: 'DE', mode: 'bloc', enemy: 'EU', diff: 'easy' }); this.startGame(); return; }
    $$('#escSeg button').forEach((b) => (b.onclick = () => { this.setup.esc = b.dataset.esc === '1'; Sfx.play('click'); this.renderSetup(); }));
    $$('#evSeg button').forEach((b) => (b.onclick = () => { this.setup.ev = b.dataset.ev === '1'; Sfx.play('click'); this.renderSetup(); }));
    this.show('#setup');
    $('#setupSearch').value = '';
    $('#setupSearch').oninput = () => this.renderNations();
    $('#setupBack').onclick = () => this.menu();
    $('#setupStart').onclick = () => this.startGame();
    $$('#diffSeg button').forEach((b) => (b.onclick = () => { this.setup.diff = b.dataset.diff; this.renderSetup(); }));
    $$('#modeSeg button').forEach((b) => (b.onclick = () => { this.setup.mode = b.dataset.mode; Sfx.play('click'); this.renderSetup(); }));
    this.renderNations();
    this.renderSetup();
  },

  // Every playable country, grouped by alliance; countries outside the blocs are listed last.
  renderNations() {
    const q = $('#setupSearch').value.trim().toLowerCase();
    const match = (k) => Geo.byKey[k] && Geo.playable(Geo.byKey[k]) && (!q || countryName(Geo.byKey[k]).toLowerCase().includes(q));
    const btn = (k) => `<button class="nation ${k === this.setup.country ? 'on' : ''}" data-k="${k}">${U.esc(countryName(Geo.byKey[k]))}<small>${'▮'.repeat(Math.min(10, Geo.byKey[k].power))}</small></button>`;
    let h = '';
    for (const b of BLOCS) {
      const ms = b.members.filter(match);
      if (ms.length) h += `<div class="bloc"><div class="bloc-name">${U.esc(L(b))}</div><div class="nation-grid">${ms.map(btn).join('')}</div></div>`;
    }
    const inBloc = new Set(BLOCS.flatMap((b) => b.members));
    const free = Geo.countries.filter((c) => !inBloc.has(c.k) && match(c.k)).sort((a, b) => countryName(a).localeCompare(countryName(b))).map((c) => c.k);
    if (free.length) h += `<div class="bloc"><div class="bloc-name">${U.esc(t('noAlliance'))}</div><div class="nation-grid">${free.map(btn).join('')}</div></div>`;
    $('#blocList').innerHTML = h;
    $$('#blocList .nation').forEach((b) => (b.onclick = () => {
      this.setup.country = b.dataset.k;
      const own = this.ownTeam(b.dataset.k);
      if (own.id === this.setup.enemy || !BLOCS.some((x) => x.id === this.setup.enemy)) this.setup.enemy = BLOCS.find((x) => x.id !== own.id && this.blocTouches(own, x))?.id || BLOCS.find((x) => x.id !== own.id).id;
      Sfx.unlock(); Sfx.play('click');
      this.renderNations(); this.renderSetup();
    }));
  },

  renderSetup() {
    const S = this.setup, own = this.ownTeam(S.country), en = BLOCS.find((b) => b.id === S.enemy), ffa = S.mode === 'ffa';
    const c = Geo.byKey[S.country];
    const members = (b) => b.members.filter((k) => Geo.byKey[k]);
    const provCount = (b) => members(b).reduce((s, k) => s + Geo.byKey[k].provinces.length, 0);
    const pow = (b) => members(b).reduce((s, k) => s + Geo.byKey[k].power, 0);
    const allies = members(own).filter((k) => k !== S.country);
    $('#setupInfo').innerHTML = `<h2>${U.esc(countryName(c))}</h2>
      <div class="stat-line"><span>${U.esc(t('yourBloc'))}</span><b>${U.esc(own.solo ? t('noAlliance') : L(own))}</b></div>
      ${allies.length ? `<div class="chips"><span class="chip own">${U.esc(countryName(c))}</span>${allies.map((k) => `<span class="chip ally">${U.esc(countryName(Geo.byKey[k]))}</span>`).join('')}</div>
      <p class="muted small">${U.esc(t('alliesAi'))}</p>` : ''}
      <div class="stat-line" style="margin-top:8px"><span>${U.esc(t('yourProvinces'))}</span><b>${c.provinces.length}</b></div>
      <div class="stat-line"><span>${U.esc(t('power'))}</span><b>${c.power}${allies.length ? ` <span class="muted small">(${U.esc(t('bloc'))} ${pow(own)})</span>` : ''}</b></div>`;
    $$('#modeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === S.mode));
    $('#modeDesc').textContent = t(ffa ? 'modeFfaD' : 'modeBlocD');
    $('#enemyHead').hidden = ffa; $('#enemyList').hidden = ffa;
    if (!ffa) {
      $('#enemyList').innerHTML = BLOCS.filter((b) => b.id !== own.id).map((b) => {
        const touch = this.blocTouches(own, b);
        return `<button class="enemy-opt ${b.id === S.enemy ? 'on' : ''}" data-b="${b.id}"><b>${U.esc(L(b))}</b>
          <span>${members(b).map((k) => U.esc(countryName(Geo.byKey[k]))).join(', ')}</span><br>
          <span>${provCount(b)} ${U.esc(t('provinces'))} · ${U.esc(t('power'))} ${pow(b)} · ${touch ? '⬌ ' + U.esc(t('adjacent')) : '⚓ ' + U.esc(t('notAdjacent'))}</span></button>`;
      }).join('');
      $$('#enemyList .enemy-opt').forEach((b) => (b.onclick = () => { S.enemy = b.dataset.b; Sfx.play('click'); this.renderSetup(); }));
    }
    $$('#diffSeg button').forEach((b) => b.classList.toggle('on', b.dataset.diff === S.diff));
    $('#diffDesc').textContent = t(S.diff + 'D');
    $$('#escSeg button').forEach((b) => b.classList.toggle('on', (b.dataset.esc === '1') === !!S.esc));
    $('#escDesc').textContent = t(S.esc ? 'escOnD' : 'escOffD');
    $$('#evSeg button').forEach((b) => b.classList.toggle('on', (b.dataset.ev === '1') === (S.ev !== false)));
    $('#evDesc').textContent = t(S.ev !== false ? 'evOnD' : 'evOffD');
    // Preview on the map: own country, allies, enemies (world war: every other bloc).
    const foes = ffa ? BLOCS.filter((b) => b.id !== own.id).flatMap(members) : members(en);
    Render.preview = { P: new Set([S.country]), A: new Set(allies), E: new Set(foes) };
    Render.dirty = true; Render.dirtyMini = true;
    const all = (ffa ? members(own) : members(own).concat(members(en))).map((k) => Geo.byKey[k]);
    const bx0 = Math.min(...all.map((x) => x.bbox[0])), by0 = Math.min(...all.map((x) => x.bbox[1])), bx1 = Math.max(...all.map((x) => x.bbox[2])), by1 = Math.max(...all.map((x) => x.bbox[3]));
    const z = Math.min(Render.w * 0.45 / Math.max(5, bx1 - bx0), Render.h * 0.8 / Math.max(5, by1 - by0));
    Render.flyTo((bx0 + bx1) / 2, (by0 + by1) / 2, z);
  },

  startGame() {
    Sfx.unlock();
    Render.preview = null;
    const S = Game.newGame({ country: this.setup.country, mode: this.setup.mode, enemyBloc: this.setup.enemy, difficulty: this.setup.diff,
      escalation: this.setup.esc && !this.tutorial, events: this.setup.ev !== false && !this.tutorial }); // the tutorial stays a plain two-sided war
    this.enterHud();
    S.paused = true;
    UI.renderTime();
    const cap = Geo.byKey[S.player].provinces.map((pid) => Geo.provinces[pid]).find((p) => p.type === 'capital');
    if (cap) Render.flyTo(cap.x, cap.y, 16);
    if (this.tutorial || UI.settings.tutorial) UI.startTutorial();
    Saves.autosave();
  },

  enterHud() {
    this.attract = false;
    this.show(null);
    this.closeModal();
    $('#objBox').hidden = true;
    $('#log').innerHTML = '';
    const c = Geo.byKey[Game.state.player];
    $('#tbNation').innerHTML = `<span class="dot"></span>${U.esc(countryName(c))}`;
    Render.selection.clear(); Render.selProv = null; Render.dirty = true; Render.dirtyMini = true;
    Panels.close();
    UI.renderCmdbar();
    UI.renderTop();
    this.autosaveAt = Game.state.t + 120;
  },

  async loadSlot(id) {
    const r = await Saves.load(id);
    if (r !== true) { this.modal(`<h2>${U.esc(t('load'))}</h2><p>${U.esc(t(r))}</p><div class="row end"><button class="btn primary" data-a="ok">${U.esc(t('ok'))}</button></div>`); this.bindModal({ ok: () => this.slots('load') }); return; }
    this.enterHud();
    const S = Game.state;
    const any = S.units.find((u) => u.s === S.player) || Geo.provinces[S.prov.findIndex((p) => p.o === S.player)];
    if (any) Render.flyTo(any.x, any.y, 14);
    UI.log(t('evLoaded'), 'info');
    UI.renderTime();
    // A decision that was open when the game was saved comes back.
    if (S.ev && S.ev.pend) setTimeout(() => UI.eventDialog(), 0);
  },

  // ---------- Modals ----------
  modal(html, wide) {
    $('#modalBody').innerHTML = html;
    $('#modal .modal-box').classList.toggle('wide', !!wide);
    $('#modal').hidden = false;
    $('#modal').onclick = (e) => { if (e.target.id === 'modal') this.closeModal(); };
  },
  closeModal() {
    // An open event decision cannot be dismissed (Escape, click beside the box): it needs an answer.
    if (UI.evModal && Game.state && Game.state.ev && Game.state.ev.pend) return;
    UI.evModal = false;
    $('#modal').hidden = true;
    this.capture = null;
    if (this.resumeOnClose && Game.state && !Game.state.over) { Game.state.paused = false; UI.renderTime(); }
    this.resumeOnClose = false;
  },

  pauseMenu() {
    const S = Game.state;
    this.resumeOnClose = !S.paused;
    S.paused = true; UI.renderTime();
    this.modal(`<h2>${U.esc(t('paused'))}</h2><div class="modal-list">
      <button class="btn primary" data-a="resume">${U.esc(t('resume'))}</button>
      <button class="btn" data-a="save">${U.esc(t('save'))}</button>
      <button class="btn" data-a="load">${U.esc(t('load'))}</button>
      <button class="btn" data-a="help">${U.esc(t('help'))}</button>
      <button class="btn" data-a="settings">${U.esc(t('settings'))}</button>
      <button class="btn danger" data-a="menu">${U.esc(t('mainMenu'))}</button></div>`);
    this.bindModal({
      resume: () => this.closeModal(), save: () => this.slots('save'), load: () => this.slots('load'),
      help: () => this.help(), settings: () => this.settings(),
      menu: () => this.confirm(t('confirmMenu'), () => this.menu()),
    });
  },

  bindModal(map) { $$('#modalBody [data-a]').forEach((b) => (b.onclick = () => { Sfx.play('click'); map[b.dataset.a] && map[b.dataset.a](b); })); },

  confirm(text, yes) {
    this.modal(`<h2>${U.esc(t('mainMenu'))}</h2><p>${U.esc(text)}</p><div class="row end"><button class="btn" data-a="no">${U.esc(t('no'))}</button><button class="btn primary" data-a="yes">${U.esc(t('yes'))}</button></div>`);
    this.bindModal({ no: () => this.pauseMenu(), yes: () => { this.resumeOnClose = false; yes(); } });
  },

  // In-game yes/no question that pauses the game while it is open and resumes afterwards.
  ask(title, text, yes) {
    const S = Game.state;
    this.resumeOnClose = S && !S.paused;
    if (S) { S.paused = true; UI.renderTime(); }
    this.modal(`<h2>${U.esc(title)}</h2><p>${U.esc(text)}</p><div class="row end"><button class="btn" data-a="no">${U.esc(t('no'))}</button><button class="btn danger" data-a="yes">${U.esc(t('yes'))}</button></div>`);
    this.bindModal({ no: () => this.closeModal(), yes: () => { this.closeModal(); yes(); } });
  },

  // Save / load dialog: any number of named saves (newest first) plus the rotating autosaves.
  // kind = 'save' | 'load'; askDel = id of a save whose deletion waits for confirmation.
  slots(kind, askDel = null) {
    const back = () => (Game.state ? this.pauseMenu() : this.closeModal());
    const fmt = (m) => {
      const bloc = BLOCS.find((b) => b.id === m.eBloc), d = new Date(m.when);
      return `${U.esc(bloc ? 'vs. ' + L(bloc) : m.mode === 'ffa' ? t('modeFfa') : '')}<br>${d.toLocaleString(I18N.lang === 'de' ? 'de-DE' : 'en-GB')} · ${U.esc(t('days', Math.floor(m.t * 120 / 86400) + 1))} · ${U.esc(t(m.diff))} · ${m.prov} ${U.esc(t('provinces'))}`;
    };
    let h = `<h2>${U.esc(t(kind))}</h2>`;
    if (kind === 'save') {
      h += `<div class="row save-new"><input id="saveName" class="input" maxlength="48" value="${U.esc(Saves.defaultName())}" aria-label="${U.esc(t('saveName'))}">
        <button class="btn primary" data-a="saveNew">${U.esc(t('saveNew'))}</button></div>`;
    }
    h += '<div class="modal-list slot-list">';
    const list = Saves.list().filter((m) => kind === 'load' || !m.auto);
    if (!list.length) h += `<p class="muted">${U.esc(t('noSaves'))}</p>`;
    for (const m of list) {
      const id = U.esc(m.id);
      const actions = askDel === m.id
        ? `<span class="small">${U.esc(t('confirmDel'))}</span><button class="btn sm" data-a="noDel">${U.esc(t('no'))}</button><button class="btn sm danger" data-a="del" data-s="${id}">${U.esc(t('yes'))}</button>`
        : `<button class="btn sm ${kind === 'save' ? '' : 'primary'}" data-a="${kind}" data-s="${id}">${U.esc(kind === 'save' ? t('overwrite') : t('load'))}</button>
           <button class="btn sm ghost" data-a="askDel" data-s="${id}" aria-label="${U.esc(t('del'))}">${U.esc(t('del'))}</button>`;
      h += `<div class="slot"><div class="info"><b>${U.esc(m.name)}</b>${m.auto ? ` <span class="tag">${U.esc(t('autosave'))}</span>` : ''}<br>${fmt(m)}</div><div class="slot-actions">${actions}</div></div>`;
    }
    h += `</div><div class="row end"><button class="btn" data-a="back">${U.esc(t('back'))}</button></div>`;
    this.modal(h);
    const done = (ok) => { if (ok) { UI.log(t('evSaved'), 'good'); this.slots('save'); } else UI.toast(t('saveFail'), 'bad'); };
    this.bindModal({
      back,
      saveNew: () => Saves.save($('#saveName').value.trim()).then(done),
      save: (b) => Saves.save(null, b.dataset.s).then(done),
      load: (b) => { this.resumeOnClose = false; this.loadSlot(b.dataset.s); },
      askDel: (b) => this.slots(kind, b.dataset.s),
      noDel: () => this.slots(kind),
      del: (b) => Saves.remove(b.dataset.s).then(() => { this.slots(kind); if (!Game.state) $('#mCont').disabled = !Saves.latest(); }),
    });
    const inp = $('#saveName');
    if (inp) inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') Saves.save(inp.value.trim()).then(done); };
  },

  settings(tab = this.setTab || 'general') {
    this.setTab = tab;
    this.capture = null;
    const s = UI.settings;
    const tabs = `<div class="tabs">${[['general', t('setGeneral')], ['keys', t('setKeys')]].map(([k, l]) => `<button data-a="stab" data-k="${k}" class="${k === tab ? 'on' : ''}">${U.esc(l)}</button>`).join('')}</div>`;
    if (tab === 'keys') { this.keysTab(tabs); return; }
    const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-a="set" data-k="${key}" data-v="${v}" class="${String(s[key]) === String(v) ? 'on' : ''}">${U.esc(l)}</button>`).join('')}</div>`;
    this.modal(`<h2>${U.esc(t('settings'))}</h2>${tabs}
      <div class="setting"><span>${U.esc(t('language'))}</span>${seg('lang', [['de', 'Deutsch'], ['en', 'English']])}</div>
      <div class="setting"><span>${U.esc(t('sound'))}</span>${seg('sound', [[true, t('on')], [false, t('off')]])}</div>
      <div class="setting"><span>${U.esc(t('volume'))}</span><input type="range" min="0" max="1" step="0.05" value="${s.volume}" id="volRange"></div>
      <div class="setting"><span>${U.esc(t('fogOfWar'))}</span>${seg('fog', [[true, t('on')], [false, t('off')]])}</div>
      <div class="setting"><span>${U.esc(t('unitStyle'))}</span>${seg('models', [[true, t('styleModels')], [false, t('styleNato')]])}</div>
      <div class="setting"><span>${U.esc(t('showTutorial'))}</span>${seg('tutorial', [[true, t('on')], [false, t('off')]])}</div>
      <div class="setting"><span>${U.esc(t('perfSetting'))}</span>${seg('perf', [[true, t('on')], [false, t('off')]])}</div>
      <div class="row end"><button class="btn primary" data-a="back">${U.esc(t('close'))}</button></div>`);
    $('#volRange').oninput = (e) => { s.volume = +e.target.value; Sfx.setVolume(s.volume); UI.saveSettings(); };
    this.bindModal({
      back: () => (Game.state ? this.pauseMenu() : this.closeModal()),
      stab: (b) => this.settings(b.dataset.k),
      set: (b) => {
        const v = b.dataset.v === 'true' ? true : b.dataset.v === 'false' ? false : b.dataset.v;
        s[b.dataset.k] = v;
        if (b.dataset.k === 'lang') { I18N.set(v); UI.applyLang(); if (Game.state) { UI.renderCmdbar(); Panels.show(); const c = Geo.byKey[Game.state.player]; $('#tbNation').innerHTML = `<span class="dot"></span>${U.esc(countryName(c))}`; } else if (!$('#setup').hidden) { this.renderNations(); this.renderSetup(); } }
        if (b.dataset.k === 'sound') Sfx.enabled = v;
        if (b.dataset.k === 'fog') Render.fog = v;
        if (b.dataset.k === 'perf') Perf.set(v);
        Perf.paintButtons();
        if (b.dataset.k === 'models') { Render.models = v; if (Game.state) { Panels.show(); } }
        UI.saveSettings();
        this.settings();
      },
    });
  },

  // Key bindings tab: grouped list of actions, click a key cap and press the new key.
  keysTab(tabs) {
    const m = Keys.map();
    const groups = [['time', t('kgTime')], ['cmd', t('kgCmd')], ['cam', t('kgCam')]];
    let h = `<h2>${U.esc(t('settings'))}</h2>${tabs}<p class="desc">${U.esc(t('keysHint'))}</p>${this.keyMsg ? `<p class="key-msg">${U.esc(this.keyMsg)}</p>` : ''}<div class="keys-grid">`;
    this.keyMsg = '';
    for (const [g, gl] of groups) {
      h += `<div class="keys-col"><h3>${U.esc(gl)}</h3>`;
      for (const [id, grp, , lbl] of KEY_ACTIONS) {
        if (grp !== g) continue;
        const cap = this.capture === id;
        h += `<div class="keyrow"><span>${U.esc(t(lbl))}</span><button class="keycap${cap ? ' wait' : ''}${m[id] ? '' : ' empty'}" data-a="bind" data-k="${id}">${U.esc(cap ? t('keyPress') : Keys.label(m[id]))}</button></div>`;
      }
      if (g === 'cam') h += `<p class="muted small">${U.esc(t('kPanNote'))}</p>`;
      h += '</div>';
    }
    h += `<div class="keys-col"><h3>${U.esc(t('kgFixed'))}</h3><ul class="keys-fixed"><li>${U.esc(t('kFixedEsc'))}</li><li>${U.esc(t('kFixedArrows'))}</li><li>${U.esc(t('kFixedGroups'))}</li></ul></div></div>
      <div class="row end"><button class="btn" data-a="reset">${U.esc(t('keyReset'))}</button><button class="btn primary" data-a="back">${U.esc(t('close'))}</button></div>`;
    const scroll = $('#modal .modal-box').scrollTop;
    this.modal(h, true);
    $('#modal .modal-box').scrollTop = scroll;
    this.bindModal({
      back: () => { this.capture = null; Game.state ? this.pauseMenu() : this.closeModal(); },
      stab: (b) => this.settings(b.dataset.k),
      bind: (b) => { this.capture = this.capture === b.dataset.k ? null : b.dataset.k; this.keysTab(tabs); },
      reset: () => { Keys.reset(); this.capture = null; this.keysTab(tabs); if (Game.state) UI.renderCmdbar(); },
    });
  },

  // Called by Input while a key cap is waiting for a key.
  captureKey(k) {
    const id = this.capture;
    if (k === 'escape') { this.settings('keys'); return; }
    if (k === 'delete' || k === 'backspace') Keys.set(id, '');
    else if (['control', 'shift', 'alt', 'meta'].includes(k)) return;
    else if (KEY_RESERVED.includes(k) || (/^[0-9]$/.test(k) && KEY_GROUP[id] !== 'time')) { Sfx.play('click'); return; }
    else {
      const sw = Keys.set(id, k);
      if (sw) this.keyMsg = t('keySwapped', t(KEY_ACTIONS.find((a) => a[0] === sw)[3]));
    }
    Sfx.play('click');
    this.settings('keys');
    if (Game.state) UI.renderCmdbar();
  },

  help(tab = 'controls') {
    const tabs = [['controls', t('helpControls')], ['economy', t('helpEconomy')], ['combat', t('helpCombat')], ['units', t('helpUnits')]];
    let body;
    if (tab === 'units') {
      const row = (key) => {
        const T = UNIT_TYPES[key];
        const rng = Math.max(0, ...T.w.map((k) => W[k].r));
        return `<tr><td><img src="${UnitIcon.get(key)}" alt=""></td><td><b>${U.esc(L(T))}</b><div class="d">${U.esc(T.mw)} / ${U.esc(T.me)}</div><div class="d">${U.esc(L({ de: T.dd, en: T.ed }))}</div></td>
          <td>${U.esc(L(BUILDINGS[T.bld]))} ${T.tier}</td><td>${costHtml(T.cost)}</td><td>${T.hp}</td><td>${rng ? (rng * 111).toFixed(0) + ' km' : '—'}</td><td>${(T.spd * 111 * 60).toFixed(0)}</td></tr>`;
      };
      const sect = (dom, label) => `<tr><th colspan="7" style="padding-top:14px;color:var(--accent)">${U.esc(label)}</th></tr>` + Object.keys(UNIT_TYPES).filter((k) => UNIT_TYPES[k].dom === dom).map(row).join('');
      body = `<table class="ency"><tr><th></th><th></th><th>${U.esc(t('requires'))}</th><th>${U.esc(t('cost'))}</th><th>HP</th><th>${U.esc(t('range'))}</th><th>${U.esc(t('speedStat'))}</th></tr>
        ${sect('land', t('land'))}${sect('air', t('air'))}${sect('sea', t('sea'))}
        <tr><th colspan="7" style="padding-top:14px;color:var(--accent)">${U.esc(t('missile'))}</th></tr>
        ${Object.keys(MISSILES).filter((k) => MISSILES[k].cost).map((k) => { const M = MISSILES[k]; return `<tr><td><img src="${UnitIcon.missile()}" alt=""></td><td><b>${U.esc(L(M))}</b><div class="d">${U.esc(M.mw)} / ${U.esc(M.me)}</div></td><td>${U.esc(L(BUILDINGS.silo))} ${M.tier}</td><td>${costHtml(M.cost)}</td><td>${M.dmg}</td><td>${(M.r * 111).toFixed(0)} km</td><td>—</td></tr>`; }).join('')}
        <tr><td><span class="nuke-ico">☢</span></td><td><b>${U.esc(L(NUKE))}</b><div class="d">${U.esc(NUKE.mw)} / ${U.esc(NUKE.me)}</div><div class="d">${U.esc(t('nukeInfo', Math.round(NUKE.r * 111)))}</div></td><td>${U.esc(L(BUILDINGS.lab))} 1</td><td>${costHtml(NUKE.cost)}</td><td>${NUKE.dmg}</td><td>—</td><td>—</td></tr></table>`;
    } else body = `<div class="help-body">${HELP[I18N.lang][tab]}</div>`;
    this.modal(`<h2>${U.esc(t('help'))}</h2><div class="tabs">${tabs.map(([k, l]) => `<button data-a="tab" data-k="${k}" class="${k === tab ? 'on' : ''}">${U.esc(l)}</button>`).join('')}</div>${body}
      <div class="row end"><button class="btn primary" data-a="back">${U.esc(t('close'))}</button></div>`, true);
    this.bindModal({ tab: (b) => this.help(b.dataset.k), back: () => (Game.state ? this.pauseMenu() : this.closeModal()) });
  },

  endScreen(r) {
    // The game may have been left (main menu, next self-test run) before the delayed end screen appears.
    const S = Game.state;
    if (!S || !S.over) return;
    const s = S.side[S.player];
    const days = Math.floor(S.t * 120 / 86400) + 1;
    const sc = Sim.score(), pts = S.overWhy === 'points';
    const text = pts ? t(r === 'win' ? (sc.world ? 'victoryWorld' : 'victoryPts') : 'defeatPts', Math.round((r === 'win' ? sc.win : 1 - sc.own) * 100)) : t(r === 'win' ? 'victoryText' : 'defeatText');
    this.modal(`<div class="end-title ${r === 'win' ? 'win' : 'lose'}">${U.esc(t(r === 'win' ? 'victory' : 'defeat'))}</div>
      <p style="text-align:center" class="muted">${U.esc(text)}</p>
      <div class="end-stats">
        <div class="stat-line"><span>${U.esc(t('statTime'))}</span><b>${U.esc(t('days', days))}</b></div>
        <div class="stat-line"><span>${U.esc(t(sc.world ? 'objVpWorld' : 'statVp'))}</span><b>${Math.round(sc.win * 100)} %</b></div>
        <div class="stat-line"><span>${U.esc(t('statCaptured'))}</span><b>${s.captured}</b></div>
        <div class="stat-line"><span>${U.esc(t('statKills'))}</span><b>${s.kills}</b></div>
        <div class="stat-line"><span>${U.esc(t('statLosses'))}</span><b>${s.losses}</b></div>
        <div class="stat-line"><span>${U.esc(t('statBuilt'))}</span><b>${s.built}</b></div>
      </div>
      <div class="row end"><button class="btn primary" data-a="menu">${U.esc(t('mainMenu'))}</button></div>`);
    this.bindModal({ menu: () => this.menu() });
  },
};
