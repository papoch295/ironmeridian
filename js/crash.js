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

  // Escalation: conquests beyond the threshold make a neutral alliance mobilise (warning), it enters the war after
  // the warning time, stands down when the lead is lost, and nothing happens with the switch off or in old saves.
  escTest() {
    try {
      const country = 'DE', own = Screens.ownTeam(country), foe = BLOCS.find((b) => b.id === 'EU');
      const setup = (escalation) => { Game.newGame({ country, mode: 'bloc', enemyBloc: foe.id, difficulty: 'normal', seed: 7, escalation }); Game.state.paused = true; return Game.state; };
      const pt = own.id, vpOf = (i) => PROVINCE_TYPES[Geo.provinces[i].type].vp;
      // Hand enemy provinces closest to the player to the player until the threshold is passed.
      const conquer = (S) => {
        const c = Game.capProv(country), moved = [];
        const ids = S.prov.map((p, i) => i).filter((i) => Game.hostile(S.prov[i].o, country))
          .sort((a, b) => U.dist(c.x, c.y, Geo.provinces[a].x, Geo.provinces[a].y) - U.dist(c.x, c.y, Geo.provinces[b].x, Geo.provinces[b].y));
        for (const i of ids) { if ((Game.vpGain()[pt] || 0) >= Game.escNeed(pt) + 2) break; moved.push([i, S.prov[i].o]); S.prov[i].o = country; }
        return moved;
      };
      let S = setup(true);
      if (Game.vpGain()[pt]) return 'Vorsprung schon zu Beginn';
      let moved = conquer(S);
      Game.escalation();
      if (S.esc.pend) return 'Eskalation vor Ablauf der Schonfrist';
      S.t = S.esc.t; Game.escalation();
      const P = S.esc.pend;
      if (!P || P.vs !== pt) return 'keine Vorwarnung (Vorsprung ' + (Game.vpGain()[pt] || 0) + ' / ' + Game.escNeed(pt) + ')';
      if (Game.atWar(P.k, pt)) return 'Kriegseintritt ohne Vorwarnzeit';
      if (JSON.stringify(JSON.parse(JSON.stringify(S.esc))) !== JSON.stringify(S.esc)) return 'Zustand nicht speicherbar';
      // After the warning time the alliance is at war with the leader only and has an army.
      // An allied country without units must not be handed a new army when somebody turns against the alliance.
      const ally = own.members.find((c) => c !== country && Game.countProv(c));
      if (ally) for (const u of S.units.filter((x) => x.s === ally)) Game.removeUnit ? Game.removeUnit(u) : (S.units.splice(S.units.indexOf(u), 1), Game.byId.delete(u.id));
      const k = P.k, units0 = S.units.length;
      S.t = P.t; Game.escalation();
      if (ally && Game.countUnits(ally)) return 'führende Seite bekommt bei der Eskalation neue Armeen';
      if (!Game.atWar(k, pt) || S.esc.pend) return 'kein Kriegseintritt nach der Vorwarnzeit';
      if (Game.atWar(k, foe.id)) return 'Beigetretene kämpfen auch gegen den Feind';
      if (S.units.length <= units0 || !Game.teamKeys(k).some((c) => Game.isFoe(c) && Game.countUnits(c))) return 'keine Mobilmachung';
      if (Game.escNeed(pt) !== ESCALATION.gain + ESCALATION.step || S.esc.t <= S.t) return 'Schwelle oder Pause nicht erhöht';
      // Losing the lead during the warning time cancels the entry.
      S = setup(true); moved = conquer(S);
      S.t = S.esc.t; Game.escalation();
      if (!S.esc.pend) return 'keine Vorwarnung (Abbruch-Test)';
      const k2 = S.esc.pend.k;
      for (const [i, o] of moved) S.prov[i].o = o;
      Game.escalation();
      if (S.esc.pend || Game.atWar(k2, pt)) return 'Mobilmachung wird nicht abgebrochen';
      // The player declares war on the warned alliance: the warning is void and counts as the escalation.
      S = setup(true); conquer(S);
      S.t = S.esc.t; Game.escalation();
      if (!S.esc.pend) return 'keine Vorwarnung (Kriegserklärungs-Test)';
      Game.declareWar(pt, S.esc.pend.k, false);
      Game.escalation();
      if (S.esc.pend || !S.esc.n[pt] || S.esc.t <= S.t) return 'Vorwarnung bleibt trotz Kriegserklärung bestehen';
      // Switch off: nothing happens. Old saves come back with escalation off.
      S = setup(false); conquer(S);
      S.t = 5000; Game.escalation();
      if (S.esc.pend || Object.keys(S.war).length !== 1) return 'Eskalation trotz Schalter aus';
      const old = JSON.parse(JSON.stringify(S)); delete old.esc; old.v = 4;
      const mig = Saves.migrate({ state: old, keys: Saves.provKeys() });
      if (!mig || !mig.esc || mig.esc.on || mig.v !== Saves.VERSION) return 'alter Spielstand ohne Eskalations-Zustand';
      return null;
    } catch (e) { return (e && e.stack) || String(e); }
  },

  // War weariness (WEARY): losses raise it, kills lower it, it cuts income and fades; veterans (VET): experience from
  // damage, rank bonuses; old saves come back with both at zero.
  wearyTest() {
    try {
      const country = 'DE', foe = BLOCS.find((b) => b.id === 'EU');
      Game.newGame({ country, mode: 'bloc', enemyBloc: foe.id, difficulty: 'normal', seed: 7 });
      const S = Game.state, s = S.side[country];
      S.paused = true;
      if (s.ww) return 'Kriegsmüdigkeit schon zu Beginn';
      const inc0 = Game.income(country).m;
      const mine = S.units.filter((u) => u.s === country), enemy = S.units.find((u) => Game.hostile(u.s, country));
      for (const u of mine.slice(0, 12)) { Game.lose(u, enemy.s); Game.removeUnit(u); }
      if (!(s.ww > 0) || s.losses !== 12) return 'Verluste erhöhen die Kriegsmüdigkeit nicht';
      const inc1 = Game.income(country).m;
      if (Math.abs(inc1 / inc0 - Game.wearyK(country)) > 1e-6 || inc1 >= inc0) return 'Einkommen sinkt nicht (' + inc0 + ' → ' + inc1 + ')';
      const w0 = s.ww;
      Game.lose(enemy, country); Game.removeUnit(enemy);
      if (!(s.ww < w0)) return 'Abschüsse senken die Kriegsmüdigkeit nicht';
      Game.weary(country, 200);
      if (s.ww !== 100 || s.wwL !== WEARY.warn.length) return 'Obergrenze oder Warnstufen falsch';
      if (Math.abs(Game.wearyK(country) - (1 - WEARY.inc)) > 1e-9) return 'Einkommensabzug bei 100 % falsch';
      Game.economyTick(10);
      if (Math.abs(s.ww - (100 - 10 * WEARY.decay)) > 1e-6) return 'Kriegsmüdigkeit baut sich nicht ab';
      // Veterans: a shooter that destroys enough enemy value climbs the ranks and hits better.
      const a = S.units.find((u) => u.s === country && UNIT_TYPES[u.t].w.length && UNIT_TYPES[u.t].dom === 'land');
      const t = S.units.find((u) => Game.hostile(u.s, country) && u.t === a.t) || S.units.find((u) => Game.hostile(u.s, country));
      if (Game.rank(a)) return 'neue Einheit ist schon erfahren';
      for (let i = 0; i < 40 && Game.rank(a) < 3; i++) Game.gainXp(a, t, 0.5, i % 2 === 1);
      if (Game.rank(a) !== 3) return 'keine Elite-Stufe erreicht (xp ' + a.xp + ')';
      const old = JSON.parse(JSON.stringify(S)); old.v = 5;
      for (const k in old.side) { delete old.side[k].ww; delete old.side[k].wwL; }
      for (const u of old.units) delete u.xp;
      const mig = Saves.migrate({ state: old, keys: Saves.provKeys() });
      if (!mig || mig.side[country].ww !== 0 || mig.units.some((u) => u.xp !== 0) || mig.v !== Saves.VERSION) return 'alter Spielstand ohne Kriegsmüdigkeit/Erfahrung';
      return null;
    } catch (e) { return (e && e.stack) || String(e); }
  },

  // Events (#49): timing, the player's decision, every answer of every event, modifiers, strike, unanswered
  // decisions, the switch and old saves.
  eventTest() {
    try {
      const country = 'DE', foe = BLOCS.find((b) => b.id === 'EU');
      const setup = (events) => { Game.newGame({ country, mode: 'bloc', enemyBloc: foe.id, difficulty: 'normal', seed: 7, events }); Game.state.paused = true; return Game.state; };
      let S = setup(true);
      const s = S.side[country];
      Events.tick();
      const nx = S.ev.next[country];
      if (nx === undefined || nx < EVENTS.first || nx > EVENTS.first + EVENTS.spread) return 'erster Termin falsch: ' + nx;
      // The player's turn: a decision is pending, nothing has happened yet; an answer applies and clears it.
      S.t = nx; Events.tick();
      const P = S.ev.pend;
      if (!P || !Events.LIST[P.id]) return 'keine Entscheidung offen';
      if (JSON.stringify(JSON.parse(JSON.stringify(S.ev))) !== JSON.stringify(S.ev)) return 'Zustand nicht speicherbar';
      if (S.ev.next[country] < S.t + EVENTS.every) return 'nächster Termin zu früh';
      if (!Events.choose(Events.freeOpt(P.id)) || S.ev.pend) return 'Antwort wird nicht angenommen';
      // By the latest possible first date every AI country at war has had its first event.
      S.t = EVENTS.first + EVENTS.spread + 1; Events.tick();
      if (!Object.keys(S.ev.next).some((k) => k !== country && S.ev.last[k])) return 'KI-Länder bekommen keine Ereignisse';
      // Every answer of every event works where it is possible and charges its price.
      for (const id in Events.LIST) {
        for (let i = 0; i < Events.LIST[id].opts.length; i++) {
          S = setup(true);
          const sd = S.side[country];
          sd.m = sd.i = sd.o = 1e6; sd.ww = 40;
          if (id === 'sanctions') S.prov[S.prov.findIndex((pr) => Game.hostile(pr.o, country))].o = country;
          const ctx = Events.LIST[id].can(country);
          if (!ctx) return `Ereignis ${id} nicht möglich`;
          const o = Events.LIST[id].opts[i], m0 = sd.m, n0 = S.units.length;
          if (!Events.ok(country, id, ctx, i)) return `${id}/${i} trotz Geld nicht wählbar`;
          Events.apply(country, id, ctx, i);
          if (o.cost && Math.abs(sd.m - (m0 - o.cost(country, ctx).m)) > 1e-6) return `${id}/${i} kostet nicht den Preis`;
          if (o.units && S.units.length <= n0) return `${id}/${i} bringt keine Einheiten`;
          if (!['m', 'i', 'o'].every((r) => Number.isFinite(sd[r]))) return `${id}/${i} macht die Kasse kaputt`;
        }
      }
      // Too expensive answers cannot be chosen; the free one always can.
      S = setup(true);
      S.side[country].m = 0;
      if (Events.ok(country, 'boom', {}, 0) || !Events.ok(country, 'boom', {}, 1)) return 'Preisprüfung falsch';
      // Modifiers and strikes change the income and run out.
      const inc0 = Game.income(country);
      Events.mod(country, 'inc_m', 0.5, 1);
      if (Math.abs(Game.income(country).m - inc0.m * 0.5) > 1e-6) return 'Einkommens-Modifikator wirkt nicht';
      S.t += 61; Events.tick();
      if (Math.abs(Game.income(country).m - inc0.m) > 1e-6 || S.side[country].mods.length) return 'Modifikator läuft nicht ab';
      const ctx = Events.LIST.strike.can(country);
      S.prov[ctx.pid].strike = S.t + 60;
      if (!(Game.income(country).i < inc0.i)) return 'Streik senkt die Einnahmen nicht';
      // Unanswered decisions apply the free answer after the answer time.
      S.ev.pend = { id: 'boom', ctx: {}, t: S.t + EVENTS.answer };
      S.t += EVENTS.answer; Events.tick();
      if (S.ev.pend && S.ev.pend.id === 'boom') return 'offene Entscheidung verfällt nicht';
      // Switch off: nothing happens. Old saves come back with events off.
      S = setup(false); S.t = 5000; Events.tick();
      if (S.ev.pend || Object.keys(S.ev.next).length) return 'Ereignisse trotz Schalter aus';
      const old = JSON.parse(JSON.stringify(S)); delete old.ev; old.v = 6;
      const mig = Saves.migrate({ state: old, keys: Saves.provKeys() });
      if (!mig || !mig.ev || mig.ev.on || mig.v !== Saves.VERSION) return 'alter Spielstand ohne Ereignis-Zustand';
      return null;
    } catch (e) { return (e && e.stack) || String(e); }
  },

  // Counteroffensive (#51): an AI country that lost home provinces calls up a reserve, warns, attacks the lost province,
  // waits for its cooldown; late reserves are veterans; difficulty scales the reserve.
  counterTest() {
    try {
      const country = 'DE', foe = BLOCS.find((b) => b.id === 'EU'), k = 'BY';
      const setup = (diff) => {
        Game.newGame({ country, mode: 'bloc', enemyBloc: foe.id, difficulty: diff, seed: 7, events: false });
        const S = Game.state; S.paused = true;
        // Hand Belarusian home provinces (not the capital) to the player until enough victory points are lost.
        const home = Geo.byKey[k].provinces.filter((pid) => Geo.provinces[pid].type !== 'capital');
        let vp = 0;
        for (const pid of home) { if (vp >= COUNTER.min + 1) break; S.prov[pid].o = country; vp += PROVINCE_TYPES[Geo.provinces[pid].type].vp; }
        return S;
      };
      const mineOf = (S) => S.prov.map((pr, i) => i).filter((i) => S.prov[i].o === k);
      let S = setup('normal');
      const A = AI.st(S, k), O = A.off = { ph: 'wait', t: 0 };
      if (AI.homeLost(S, k, mineOf(S)).vp < COUNTER.min) return 'Testaufbau: zu wenig verloren';
      let warn = null;
      Game.on('ctrWarn', (e) => { if (e.k === k) warn = e; });
      const n0 = S.units.filter((u) => u.s === k).length;
      AI.counter(S, DIFFICULTY.normal, k, mineOf(S), A, O, []);
      if (!O.ctr || O.ph !== 'gather' || S.prov[O.main].o !== country) return 'keine Gegenoffensive geplant';
      if (!warn || warn.pid !== O.main || warn.t !== COUNTER.warn) return 'keine Vorwarnung';
      const n1 = S.units.filter((u) => u.s === k).length;
      if (n1 <= n0 || n1 - n0 > COUNTER.max) return 'Reserve fehlt oder zu groß: ' + (n1 - n0);
      if (S.units.some((u) => u.s === k && u.xp)) return 'frühe Reserve schon erfahren';
      if (JSON.stringify(JSON.parse(JSON.stringify(S.ai[k]))) !== JSON.stringify(S.ai[k])) return 'Zustand nicht speicherbar';
      // Cooldown: no second counteroffensive right away.
      Object.assign(O, { ph: 'wait', ctr: false });
      AI.counter(S, DIFFICULTY.normal, k, mineOf(S), A, O, []);
      if (O.ctr) return 'zweite Gegenoffensive ohne Pause';
      // After the warning time the attack starts (no superiority check).
      S = setup('normal');
      const A2 = AI.st(S, k), O2 = A2.off = { ph: 'wait', t: 1e9 };
      AI.counter(S, DIFFICULTY.normal, k, mineOf(S), A2, O2, []);
      const tgt = O2.main;
      S.paused = false;
      for (let i = 0; i < (COUNTER.warn + 15) * 10 && O2.ph === 'gather'; i++) Sim.step(0.1);
      if (O2.ph !== 'attack' || !O2.groups.length || O2.main !== tgt) return 'kein Angriff nach der Vorwarnzeit (' + O2.ph + ')';
      // Late reserves are veterans; easy brings a smaller reserve than hard.
      const size = (diff, late) => {
        const S3 = setup(diff); S3.t = late ? COUNTER.late : 0;
        const A3 = AI.st(S3, k), O3 = A3.off = { ph: 'wait', t: 1e9 }, b = S3.units.filter((u) => u.s === k).length;
        AI.counter(S3, DIFFICULTY[diff], k, mineOf(S3), A3, O3, []);
        const us = S3.units.filter((u) => u.s === k);
        return { n: us.length - b, vet: us.slice(b).every((u) => Game.rank(u) >= 2) };
      };
      const e = size('easy'), h = size('hard'), l = size('normal', true);
      if (!(e.n < h.n)) return `Schwierigkeit wirkt nicht (leicht ${e.n}, schwer ${h.n})`;
      if (!l.vet) return 'späte Reserve ohne Veteranen';
      return null;
    } catch (e) { return (e && e.stack) || String(e); }
  },

  // Missions (#48): first mission on time, capture / hold / destroy succeed and fail correctly, rewards are paid
  // only on success, kills count only when they fit, the switch, old saves.
  missionTest() {
    try {
      const country = 'DE', foe = BLOCS.find((b) => b.id === 'EU');
      const setup = (missions) => { Game.newGame({ country, mode: 'bloc', enemyBloc: foe.id, difficulty: 'normal', seed: 7, events: false, missions }); Game.state.paused = true; return Game.state; };
      let S = setup(true);
      const M = S.mis, s = S.side[country];
      Missions.tick();
      if (M.cur) return 'Mission vor dem ersten Termin';
      S.t = MISSIONS.first; Missions.tick();
      if (!M.cur || !M.cur.k || !(M.cur.t > S.t)) return 'keine erste Mission';
      if (JSON.stringify(JSON.parse(JSON.stringify(M))) !== JSON.stringify(M)) return 'Zustand nicht speicherbar';
      const run = (C) => { M.cur = Object.assign({ t0: S.t, rew: { m: 100 }, ww: 3 }, C); };
      // Capture: success when the province is ours (reward paid), failure after the deadline (nothing paid).
      const cp = Missions.captureTarget(S);
      if (cp === null || !Game.hostile(country, S.prov[cp].o)) return 'kein Eroberungsziel';
      run({ k: 'capture', pid: cp, t: S.t + 600 });
      const m0 = s.m, n0 = M.n;
      S.prov[cp].o = country; Missions.tick();
      if (M.cur || M.ok !== 1 || M.n !== n0 + 1 || s.m !== m0 + 100 || !(M.next > S.t)) return 'Eroberung wird nicht belohnt';
      const cp2 = Missions.captureTarget(S);
      run({ k: 'capture', pid: cp2, t: S.t + 1 });
      const m1 = s.m; S.t += 2; Missions.tick();
      if (M.cur || M.ok !== 1 || s.m !== m1) return 'verfehlte Eroberung wird belohnt oder bleibt offen';
      // Hold: success after the time, failure as soon as the province is lost.
      const hp = Missions.holdTarget(S);
      if (hp === null || !Game.allied(S.prov[hp].o, country)) return 'kein Halteziel';
      run({ k: 'hold', pid: hp, t: S.t + 10 });
      Missions.tick();
      if (!M.cur) return 'Halten endet zu früh';
      S.t += 10; Missions.tick();
      if (M.cur || M.ok !== 2) return 'gehaltene Provinz wird nicht belohnt';
      run({ k: 'hold', pid: hp, t: S.t + 100 });
      const enemyK = Object.keys(S.side).find((k) => Game.hostile(country, k) && Game.countProv(k));
      const hpO = S.prov[hp].o;
      S.prov[hp].o = enemyK; Missions.tick();
      if (M.cur || M.ok !== 2) return 'verlorene Provinz beendet die Mission nicht';
      S.prov[hp].o = hpO;
      // Destroy: only fitting kills by the player's units count.
      run({ k: 'destroy', cls: 'armor', need: 2, got: 0, t: S.t + 600 });
      const shooter = S.units.find((u) => u.s === country);
      const ally = S.units.find((u) => u.s !== country && Game.allied(u.s, country));
      const veh = S.units.filter((u) => Game.hostile(country, u.s) && Missions.fits('armor', u));
      const soft = S.units.find((u) => Game.hostile(country, u.s) && UNIT_TYPES[u.t].cls === 'soft');
      if (veh.length < 3 || !soft) return 'Testaufbau: zu wenige Feindeinheiten';
      Sim.kill(soft, shooter);
      if (ally) Sim.kill(veh[2], ally);
      if (M.cur.got !== 0) return 'unpassende Abschüsse zählen';
      Sim.kill(veh[0], shooter); Sim.kill(veh[1], shooter); Missions.tick();
      if (M.cur || M.ok !== 3) return 'Vernichtung wird nicht erkannt';
      // Switch off; old saves get missions.
      S = setup(false); S.t = 5000; Missions.tick();
      if (S.mis.cur) return 'Mission trotz Schalter aus';
      const old = JSON.parse(JSON.stringify(S)); delete old.mis; old.v = 7;
      const mig = Saves.migrate({ state: old, keys: Saves.provKeys() });
      if (!mig || !mig.mis || !mig.mis.on || mig.v !== Saves.VERSION) return 'alter Spielstand ohne Missionen';
      return null;
    } catch (e) { return (e && e.stack) || String(e); }
  },

  // Army control: target strength, refill, leading several armies, merging, standing orders, old saves.
  armyTest() {
    try {
      const country = 'DE', own = Screens.ownTeam(country);
      const foe = BLOCS.find((b) => b.id !== own.id && b.members.some((k) => Geo.byKey[k]));
      Game.newGame({ country, mode: 'bloc', enemyBloc: foe.id, difficulty: 'easy', seed: 7 });
      const S = Game.state, G = UI.groups(), s = S.side[country];
      S.paused = true;
      s.m = s.i = s.o = 1e6;
      const keys = Object.keys(G).sort();
      if (keys.length < 2) return 'weniger als zwei Startarmeen';
      const a = G[keys[0]], planN = (p) => Object.values(p).reduce((n, v) => n + v, 0);
      if (planN(a.plan) !== a.ids.length) return 'Soll-Bestand passt nicht zur Startarmee';
      // Refill: a lost unit is ordered once as a replacement and joins without raising the target strength.
      const cap = Geo.byKey[country].provinces.find((i) => Geo.provinces[i].type === 'capital');
      S.prov[cap].b.barracks = 3; S.prov[cap].b.factory = 3; S.prov[cap].q = [];
      s.inc = { m: 1, i: 1, o: 1 };
      const lost = a.ids.map((id) => Game.unit(id)).find((u) => UNIT_TYPES[u.t].bld === 'barracks' || UNIT_TYPES[u.t].bld === 'factory');
      if (!lost) return 'keine nachbaubare Einheit in der Armee';
      const plan0 = planN(a.plan);
      Game.removeUnit(lost);
      a.ids = a.ids.filter((id) => id !== lost.id);
      if (Tactics.missing(a, keys[0])[lost.t] !== 1) return 'Verlust wird nicht als fehlend erkannt';
      S.rfT = 0; Tactics.refill(S);
      const queued = S.prov.flatMap((pr, pid) => pr.q.filter((q) => q.rf && q.g === keys[0]).map((q) => [pid, q]));
      if (queued.length !== 1 || queued[0][1].key !== lost.t) return 'kein Ersatz in Auftrag';
      if (Tactics.missing(a, keys[0])[lost.t]) return 'Ersatz wird doppelt gezählt';
      const [rfP, rfQ] = queued[0], n0 = a.ids.length;
      S.prov[rfP].q = [rfQ]; rfQ.t = rfQ.total; Game.productionStep(0.01);
      if (a.ids.length !== n0 + 1 || planN(a.plan) !== plan0) return 'Ersatz stößt nicht zur Armee oder ändert den Soll-Bestand';
      // Switched off: no new order.
      Game.removeUnit(Game.unit(a.ids[a.ids.length - 1])); a.ids.pop();
      a.refill = false; S.rfT = 0; Tactics.refill(S);
      if (S.prov.some((pr) => pr.q.some((q) => q.rf && q.g === keys[0]))) return 'Auffrischen trotz Abschalten';
      a.refill = true;
      // Upkeep above income pauses the refill.
      s.inc = { m: -1, i: 1, o: 1 }; S.rfT = 0; Tactics.refill(S);
      if (S.prov.some((pr) => pr.q.some((q) => q.rf && q.g === keys[0]))) return 'Auffrischen trotz negativer Einnahmen';
      s.inc = { m: 1, i: 1, o: 1 };
      // Leading two armies together; the task reaches both.
      UI.selectGroup(keys[0]);
      UI.toggleArmy(keys[1]);
      if (UI.selectedArmies().join() !== keys.slice(0, 2).join()) return 'zwei Armeen nicht gemeinsam gewählt';
      UI.armyTask('hold');
      if (!G[keys[0]].task || !G[keys[1]].task) return 'Auftrag erreicht nicht beide Armeen';
      UI.toggleArmy(keys[1]);
      if (UI.selectedArmy() !== keys[0]) return 'Armee lässt sich nicht wieder abwählen';
      // Merging adds up units and target strengths, and redirects units still in production.
      const total = planN(G[keys[0]].plan) + planN(G[keys[1]].plan), ids = G[keys[0]].ids.length + G[keys[1]].ids.length;
      Game.queue(cap, 'unit', 'inf', { g: keys[1] });
      UI.mergeArmies(keys.slice(0, 2));
      if (G[keys[1]] || G[keys[0]].ids.length !== ids || planN(G[keys[0]].plan) !== total) return 'Zusammenlegen falsch';
      if (S.prov[cap].q.some((q) => q.g === keys[1])) return 'Auftrag bleibt bei aufgelöster Armee';
      S.prov[cap].q = [];
      // A unit moved out of an army lowers its target strength.
      const out = G[keys[0]].ids[0];
      UI.removeFromGroups([out]);
      if (planN(G[keys[0]].plan) !== total - 1) return 'Soll-Bestand sinkt beim Herauslösen nicht';
      // Standing order: rebuilds, pays each round, waits when upkeep exceeds income, unpaid rounds are not refunded.
      Game.queue(cap, 'unit', 'inf');
      const it = S.prov[cap].q[0], c = it.cost.m;
      it.rep = true; it.t = it.total;
      const u0 = S.units.length;
      Game.productionStep(0.01);
      if (S.units.length !== u0 + 1 || S.prov[cap].q[0] !== it || !it.unpaid) return 'Dauerauftrag läuft nicht weiter';
      s.inc.m = -1; const m1 = s.m; Game.productionStep(0.01);
      if (s.m !== m1 || !it.unpaid) return 'Dauerauftrag zahlt trotz negativer Einnahmen';
      Game.cancel(cap, 0);
      if (s.m !== m1) return 'unbezahlte Runde wird erstattet';
      s.inc.m = 1;
      Game.queue(cap, 'unit', 'inf'); const it2 = S.prov[cap].q[0]; it2.rep = true; it2.t = it2.total; Game.productionStep(0.01);
      const m2 = s.m; Game.productionStep(0.01);
      if (s.m !== m2 - c || it2.unpaid) return 'Dauerauftrag bezahlt die nächste Runde nicht';
      S.prov[cap].q = [];
      // Saves from before target strengths get one when loaded.
      const old = JSON.parse(JSON.stringify(S));
      for (const k in old.groups) delete old.groups[k].plan;
      const mig = Saves.migrate({ state: old, keys: Saves.provKeys() });
      if (!mig || Object.keys(mig.groups).some((k) => !mig.groups[k].plan)) return 'alter Spielstand bekommt keinen Soll-Bestand';
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
            UI.groups()['1'] = { ids, coh: true, task: g, plan: Tactics.planOf(ids) };
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
    const army = this.armyTest();
    this.log(army ? 'FEHL Armee-Führung: ' + army : 'OK   Soll-Bestand, Auffrischen, gemeinsame Führung, Zusammenlegen, Daueraufträge');
    allOk = allOk && !army;
    const esc = this.escTest();
    this.log(esc ? 'FEHL Eskalation: ' + esc : 'OK   Eskalation: Vorwarnung, Kriegseintritt, Abbruch, Schalter, alter Spielstand');
    allOk = allOk && !esc;
    const ww = this.wearyTest();
    this.log(ww ? 'FEHL Kriegsmüdigkeit/Veteranen: ' + ww : 'OK   Kriegsmüdigkeit, Einkommen, Abbau, Veteranen-Stufen, alter Spielstand');
    allOk = allOk && !ww;
    const ev = this.eventTest();
    this.log(ev ? 'FEHL Ereignisse: ' + ev : 'OK   Ereignisse: Termine, Entscheidung, alle Antworten, Folgen, Schalter, alter Spielstand');
    allOk = allOk && !ev;
    const ctr = this.counterTest();
    this.log(ctr ? 'FEHL Gegenoffensive: ' + ctr : 'OK   Gegenoffensive: Reserve, Vorwarnung, Angriff, Pause, Veteranen, Schwierigkeit');
    allOk = allOk && !ctr;
    const mis = this.missionTest();
    this.log(mis ? 'FEHL Missionen: ' + mis : 'OK   Missionen: Termin, Erobern, Halten, Vernichten, Belohnung, Schalter, alter Spielstand');
    allOk = allOk && !mis;
    this.active = false;
    window.SELFTEST = { ok: allOk, results: this.results };
    this.log(allOk ? 'ERGEBNIS: alles in Ordnung' : 'ERGEBNIS: Probleme gefunden');
    Screens.menu();
  },
};
