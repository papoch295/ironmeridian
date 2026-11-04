// Error handling and the built-in self test.
// Crash: any uncaught error pauses the game, writes an emergency save and shows a dialog instead of a frozen screen.
// SelfTest: index.html?selftest[=runs][&min=game-minutes] plays several AI-vs-idle games in fast forward and checks
// for errors, broken values and a lossless save/load round trip. Result in the on-screen panel and window.SELFTEST.
'use strict';

const Crash = {
  shown: false,
  errors: [],

  init() {
    window.addEventListener('error', (e) => this.report(e.error || e.message));
    window.addEventListener('unhandledrejection', (e) => this.report(e.reason));
  },

  report(err) {
    const msg = (err && (err.stack || err.message)) || String(err);
    console.error('[Iron Meridian]', err);
    this.errors.push(msg);
    if (SelfTest.active) { SelfTest.errors.push(msg); return; }
    if (this.shown) return;
    this.shown = true;
    const S = Game.state;
    if (S) S.paused = true;
    const show = (saved) => this.dialog(msg, saved);
    if (S && !S.over) {
      try { Saves.save(t('rescue') + ' – ' + Saves.defaultName(), 'rescue').then(show, () => show(false)); } catch (e) { show(false); }
    } else show(false);
  },

  dialog(msg, saved) {
    const body = `<h2>${U.esc(t('errTitle'))}</h2><p>${U.esc(t(saved ? 'errSaved' : 'errNoGame'))}</p>
      <div class="crash-msg">${U.esc(msg.split('\n').slice(0, 4).join('\n'))}</div>
      <div class="row end" style="margin-top:14px"><button class="btn" data-a="menu">${U.esc(t('mainMenu'))}</button>
      <button class="btn primary" data-a="cont">${U.esc(t('errCont'))}</button></div>`;
    try {
      Screens.modal(body);
      Screens.bindModal({
        cont: () => { this.shown = false; Screens.closeModal(); if (typeof UI !== 'undefined') UI.renderTime(); },
        menu: () => { this.shown = false; Screens.menu(); },
      });
    } catch (e) {
      // The UI itself is broken (e.g. during loading): last-resort message.
      alert(t('errTitle') + '\n\n' + msg.split('\n')[0]);
      this.shown = false;
    }
  },
};

const SelfTest = {
  active: false,
  errors: [],
  results: [],

  log(line) {
    console.log('[SelfTest] ' + line);
    let el = document.getElementById('selftest');
    if (!el) { el = document.createElement('div'); el.id = 'selftest'; el.className = 'panel-glass'; document.body.appendChild(el); }
    el.textContent += line + '\n';
  },

  // Run the simulation for `secs` game seconds in slices so the page stays responsive.
  simulate(secs) {
    return new Promise((res) => {
      const S = Game.state, end = S.t + secs;
      const slice = () => {
        const t0 = performance.now();
        try {
          while (S.t < end && !S.over && performance.now() - t0 < 40) Sim.step(Sim.DT);
        } catch (e) { this.errors.push((e && e.stack) || String(e)); res(); return; }
        if (S.t < end && !S.over) setTimeout(slice, 0); else res();
      };
      slice();
    });
  },

  // Values that must never become NaN/Infinity or point to nothing.
  check() {
    const S = Game.state, bad = [];
    for (const sd in S.side) for (const r of ['m', 'i', 'o']) if (!Number.isFinite(S.side[sd][r])) bad.push(`Ressource ${sd}.${r} = ${S.side[sd][r]}`);
    for (const u of S.units) {
      if (!UNIT_TYPES[u.t]) bad.push(`Einheit ${u.id}: unbekannter Typ ${u.t}`);
      if (!S.side[u.s]) bad.push(`Einheit ${u.id}: unbekannte Fraktion ${u.s}`);
      if (!Number.isFinite(u.x) || !Number.isFinite(u.y)) bad.push(`Einheit ${u.id} (${u.t}): Position ${u.x},${u.y}`);
      if (!Number.isFinite(u.hp)) bad.push(`Einheit ${u.id} (${u.t}): hp ${u.hp}`);
      if (!Game.byId.has(u.id)) bad.push(`Einheit ${u.id}: fehlt im Index`);
    }
    S.prov.forEach((pr, pid) => {
      if (!S.side[pr.o]) bad.push(`Provinz ${pid}: Besitzer ${pr.o}`);
      if (!Number.isFinite(pr.def)) bad.push(`Provinz ${pid}: Verteidigung ${pr.def}`);
    });
    return bad.slice(0, 10);
  },

  // Save, reload and compare: the reloaded state must be identical to the saved one.
  async roundTrip() {
    const before = JSON.stringify(Game.state);
    if (!(await Saves.save('Selbsttest', 'selftest'))) return 'Speichern fehlgeschlagen';
    const r = await Saves.load('selftest');
    await Saves.remove('selftest');
    if (r !== true) return 'Laden fehlgeschlagen: ' + r;
    const after = JSON.parse(JSON.stringify(Game.state)), ref = JSON.parse(before);
    after.paused = ref.paused;
    return JSON.stringify(after) === JSON.stringify(ref) ? null : 'geladener Stand weicht vom gespeicherten ab';
  },

  // Points victory and surrender: hand provinces over directly and check that the countdown starts, breaks when
  // the threshold is lost again and ends the game only after VICTORY.hold seconds.
  async vpTest() {
    try {
      const country = 'DE', own = Screens.ownTeam(country);
      const foe = BLOCS.find((b) => b.id !== own.id && b.members.some((k) => Geo.byKey[k]));
      const setup = () => { Game.newGame({ country, mode: 'bloc', enemyBloc: foe.id, difficulty: 'easy', seed: 7 }); Game.state.paused = true; return Game.state; };
      // Victory: give the player enemy provinces (largest first) until 75 % of the enemy points are taken.
      let S = setup();
      const ids = S.prov.map((p, i) => i).filter((i) => Game.hostile(S.prov[i].o, country))
        .sort((a, b) => PROVINCE_TYPES[Geo.provinces[b].type].vp - PROVINCE_TYPES[Geo.provinces[a].type].vp);
      const moved = [];
      for (const i of ids) { if (Sim.score().win >= 0.75) break; moved.push([i, S.prov[i].o]); S.prov[i].o = country; }
      Sim.checkEnd();
      if (!S.vp || S.vp.r !== 'win') return 'Countdown startet nicht (' + Math.round(Sim.score().win * 100) + ' %)';
      // Losing the points again breaks the countdown.
      for (const [i, o] of moved) S.prov[i].o = o;
      Sim.checkEnd();
      if (S.vp) return 'Countdown bricht nicht ab';
      for (const [i] of moved) S.prov[i].o = country;
      Sim.checkEnd();
      const t0 = S.t;
      await this.simulate(VICTORY.hold - 5);
      if (S.over) return 'Spiel endet vor Ablauf des Countdowns (' + Math.round(S.t - t0) + ' s)';
      // Units keep fighting meanwhile; if the AI won points back the countdown restarts, so shorten it then.
      for (const [i] of moved) S.prov[i].o = country;
      Sim.checkEnd();
      if (S.vp) S.vp.t = Math.min(S.vp.t, S.t + 6);
      await this.simulate(12);
      if (S.over !== 'win' || S.overWhy !== 'points') return 'kein Punktesieg nach dem Countdown (Ende: ' + S.over + ')';
      // Surrender: the player keeps only a fifth of the own country's points.
      S = setup();
      const home = Geo.byKey[country].provinces.slice().sort((a, b) => PROVINCE_TYPES[Geo.provinces[b].type].vp - PROVINCE_TYPES[Geo.provinces[a].type].vp);
      const enemyK = foe.members.find((k) => Geo.byKey[k] && S.side[k]);
      for (const i of home) { if (Sim.score().own < 0.2) break; S.prov[i].o = enemyK; }
      if (!Game.countProv(country)) S.prov[home[home.length - 1]].o = country;
      Sim.checkEnd();
      if (!S.vp || S.vp.r !== 'lose') return 'Kapitulations-Countdown startet nicht';
      S.vp.t = S.t; Sim.checkEnd();
      if (S.over !== 'lose' || S.overWhy !== 'points') return 'keine Kapitulation';
      // World war: the alliance has to hold VICTORY.world of all points on the map, not 70 % of the enemies'.
      Game.newGame({ country, mode: 'ffa', enemyBloc: foe.id, difficulty: 'easy', seed: 7 }); Game.state.paused = true; S = Game.state;
      if (Sim.score().win >= VICTORY.world) return 'Weltkrieg: Sieg schon zu Beginn erreicht';
      const rest = S.prov.map((p, i) => i).filter((i) => !Game.allied(S.prov[i].o, country));
      for (const i of rest) { if (Sim.score().win >= VICTORY.world + 0.01) break; S.prov[i].o = country; }
      Sim.checkEnd();
      if (!S.vp || S.vp.r !== 'win') return 'Weltkrieg: Countdown startet nicht (' + Math.round(Sim.score().win * 100) + ' %)';
      S.vp.t = S.t; Sim.checkEnd();
      if (S.over !== 'win' || S.overWhy !== 'points') return 'Weltkrieg: kein Weltmacht-Sieg';
      return null;
    } catch (e) { return (e && e.stack) || String(e); }
  },

  async run() {
    const q = new URLSearchParams(location.search);
    const runs = Math.max(1, parseInt(q.get('selftest'), 10) || 3), minutes = parseFloat(q.get('min')) || 20;
    this.q = q;
    // Any playable country; every third game is a world war, the others an alliance war against a random bloc.
    const countries = Geo.countries.filter((c) => Geo.playable(c)).map((c) => c.k);
    const diffs = ['easy', 'normal', 'hard'];
    this.active = true;
    this.log(`Selbsttest: ${runs} Partien à ${minutes} Spielminuten`);
    let allOk = true;
    for (let i = 0; i < runs; i++) {
      this.errors = [];
      const country = q.get('country') || countries[Math.floor(Math.random() * countries.length)];
      const own = Screens.ownTeam(country);
      const mode = q.get('mode') || (i % 3 === 2 ? 'ffa' : 'bloc');
      const foes = BLOCS.filter((b) => b.id !== own.id && b.members.some((k) => Geo.byKey[k]));
      const near = foes.filter((b) => Screens.blocTouches(own, b));
      const enemy = (near.length ? near : foes)[Math.floor(Math.random() * (near.length || foes.length))];
      const diff = diffs[i % 3];
      const t0 = performance.now();
      let problems = [];
      try {
        Game.newGame({ country, mode, enemyBloc: enemy.id, difficulty: diff });
        Screens.enterHud();
        Game.state.paused = true; // the main loop must not step the game in parallel
        // Alliance wars also test a declaration of war on a neutral neighbour halfway through.
        // The player's ground troops form army 1 and get an assault task on the nearest hostile province.
        {
          const S = Game.state, ids = S.units.filter((u) => u.s === country && UNIT_TYPES[u.t].dom === 'land' && !u.inside).slice(0, 10).map((u) => u.id);
          const g = { ids, side: country, ret: Tactics.RETREAT }, us = Tactics.members(g), [cx, cy] = Tactics.center(us);
          let best = null, bd = 1e9;
          S.prov.forEach((pr, pid) => { const p = Geo.provinces[pid]; if (Game.hostile(country, pr.o) && U.dist(cx, cy, p.x, p.y) < bd) { bd = U.dist(cx, cy, p.x, p.y); best = pid; } });
          if (us.length && best !== null) {
            Tactics.task(g, 'attack', Geo.provinces[best].x, Geo.provinces[best].y, best);
            UI.groups()['1'] = { ids, coh: true, task: g };
          }
        }
        await this.simulate(minutes * 30);
        if (mode === 'bloc') {
          const S = Game.state, nb = Geo.neighbors()[Geo.byKey[country].idx];
          const neutral = [...nb].map((ci) => Geo.countries[ci].k).find((k) => Game.rk(k) === 'N');
          if (neutral) { Game.declareWar(S.team[country], S.team[neutral]); this.log(`     Kriegserklärung an ${neutral}`); }
        }
        await this.simulate(minutes * 30);
        problems = this.check();
        const rt = await this.roundTrip();
        if (rt) problems.push('Speichern/Laden: ' + rt);
      } catch (e) { this.errors.push((e && e.stack) || String(e)); }
      const S = Game.state, me = S && S.player;
      problems = problems.concat(this.errors.map((m) => 'Fehler: ' + m.split('\n').slice(0, 2).join(' | ')));
      const ok = !problems.length;
      allOk = allOk && ok;
      const foeU = S ? S.units.filter((u) => Game.hostile(u.s, me)).length : 0, foeP = S ? S.prov.filter((p) => Game.hostile(p.o, me)).length : 0;
      const res = { country, mode, enemy: mode === 'ffa' ? 'alle' : enemy.id, diff, ok, problems, t: S && Math.round(S.t), over: S && S.over,
        units: { own: S ? Game.countUnits(me) : 0, foe: foeU, all: S ? S.units.length : 0 }, prov: { own: S ? Game.countProv(me) : 0, foe: foeP },
        ms: Math.round(performance.now() - t0) };
      this.results.push(res);
      this.log(`${ok ? 'OK  ' : 'FEHL'} #${i + 1} ${country} vs. ${res.enemy} (${mode}, ${diff}): t=${res.t}s, Einheiten eigen ${res.units.own} / Feind ${res.units.foe} / gesamt ${res.units.all}, Provinzen ${res.prov.own}/${res.prov.foe}${res.over ? ', Ende: ' + res.over : ''}, ${(res.ms / 1000).toFixed(1)} s`);
      for (const p of problems) this.log('     ' + p);
    }
    const vp = await this.vpTest();
    this.log(vp ? 'FEHL Punktesieg: ' + vp : 'OK   Punktesieg, Kapitulation und Weltmacht-Sieg');
    allOk = allOk && !vp;
    this.active = false;
    window.SELFTEST = { ok: allOk, results: this.results };
    this.log(allOk ? 'ERGEBNIS: alles in Ordnung' : 'ERGEBNIS: Probleme gefunden');
    Screens.menu();
  },
};
