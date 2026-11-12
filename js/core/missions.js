// Missions (Beta 2, #48): the player always has one short-term goal with a time limit and a reward (MISSIONS in
// units.js). Kinds: capture a hostile province near the front, hold a threatened own province, destroy enemy
// units of one class. Success pays resources and lowers war weariness; failure only costs the reward. After a
// mission ends the next one follows after a short pause. AI countries have no missions.
'use strict';

const Missions = {
  // ---------- Candidates ----------
  // Hostile provinces within reach of the territory of the player's alliance (the front is often at an ally's
  // border); cities, ports and industry first.
  captureTarget(S) {
    const me = S.player, own = [], cand = [];
    S.prov.forEach((pr, i) => { if (pr.o && Game.allied(pr.o, me)) own.push(Geo.provinces[i]); });
    if (!own.length) return null;
    S.prov.forEach((pr, i) => {
      if (!pr.o || !Game.hostile(me, pr.o)) return;
      const p = Geo.provinces[i];
      let d = 1e9;
      for (const q of own) d = Math.min(d, U.dist(p.x, p.y, q.x, q.y));
      if (d > MISSIONS.reach || !Game.bell[p.country]) return;
      const val = p.type === 'capital' ? 1.6 : p.type === 'port' || p.type === 'city' || p.type === 'industry' ? 0.8 : 1;
      cand.push({ pid: i, s: d * val + pr.def / 200 });
    });
    cand.sort((a, b) => a.s - b.s);
    // A little variety among the best few.
    const top = cand.slice(0, 3);
    return top.length ? top[Math.floor(Math.random() * top.length)].pid : null;
  },
  // Province of the player's alliance under threat (own ones count double): a running AI offensive or
  // counteroffensive against it, otherwise visible enemy ground troops close by, otherwise the most valuable one near
  // the front. The mission succeeds while the alliance still holds it at the end.
  holdTarget(S) {
    const me = S.player, ours = (o) => o && Game.allied(o, me), w = (o) => (o === me ? 2 : 1);
    let best = null, bs = 0;
    for (const k in S.ai) {
      const O = S.ai[k].off;
      if (O && O.ph !== 'wait' && O.main != null && ours(S.prov[O.main].o) && Game.hostile(k, me)) {
        const sc = w(S.prov[O.main].o) * (O.ctr ? 2 : 1);
        if (sc > bs) { bs = sc; best = O.main; }
      }
    }
    if (best !== null) return best;
    S.prov.forEach((pr, i) => {
      if (!ours(pr.o)) return;
      const p = Geo.provinces[i];
      const n = Game.hash.query(p.x, p.y, MISSIONS.threat, []).filter((u) => Game.hostile(me, u.s) && Sim.sees(me, u) && UNIT_TYPES[u.t].dom === 'land').length;
      const sc = n ? (n * 10 + PROVINCE_TYPES[p.type].vp) * w(pr.o) : 0;
      if (sc > bs) { bs = sc; best = i; }
    });
    if (best !== null) return best;
    // Front: provinces with a hostile province nearby, the most valuable one.
    const hostile = [];
    S.prov.forEach((pr, i) => { if (pr.o && Game.hostile(me, pr.o)) hostile.push(Geo.provinces[i]); });
    S.prov.forEach((pr, i) => {
      if (!ours(pr.o)) return;
      const p = Geo.provinces[i];
      if (!hostile.some((q) => U.dist(p.x, p.y, q.x, q.y) < MISSIONS.reach * 0.6)) return;
      const sc = (PROVINCE_TYPES[p.type].vp + 0.1) * w(pr.o);
      if (sc > bs) { bs = sc; best = i; }
    });
    return best;
  },
  // Destroy: armour or aircraft when the enemy fields enough of them, otherwise any ground units.
  destroyGoal(S) {
    const me = S.player, foes = S.units.filter((u) => Game.hostile(me, u.s));
    const n = (f) => foes.filter(f).length;
    const opts = [];
    const armor = n((u) => this.fits('armor', u));
    if (armor >= 6) opts.push({ cls: 'armor', need: U.clamp(Math.round(armor * 0.2), 3, 6) });
    const air = n((u) => Sim.isAir(u));
    if (air >= 4) opts.push({ cls: 'air', need: U.clamp(Math.round(air * 0.25), 2, 4) });
    const land = n((u) => UNIT_TYPES[u.t].dom === 'land');
    if (land >= 10) opts.push({ cls: 'land', need: U.clamp(Math.round(land * 0.1), 4, 8) });
    return opts.length ? opts[Math.floor(Math.random() * opts.length)] : null;
  },
  // Does a destroyed unit count for the destroy goal?
  // armor = armed combat vehicles (tanks, IFVs, …), air = aircraft and helicopters, land = any ground unit.
  fits(cls, u) {
    const T = UNIT_TYPES[u.t];
    return cls === 'armor' ? T.dom === 'land' && (T.cls === 'armor' || T.cls === 'light') && T.w.length > 0 : cls === 'air' ? T.dom === 'air' : T.dom === 'land';
  },

  // ---------- Life cycle ----------
  // Called every few seconds from Sim.step.
  tick() {
    const S = Game.state, M = S.mis;
    if (!M || !M.on || S.over) return;
    const C = M.cur;
    if (!C) { if (S.t >= M.next) this.start(); return; }
    const team = Game.team(S.player);
    if (C.k === 'capture') {
      const o = S.prov[C.pid].o;
      if (o && Game.team(o) === team) return this.end(true);
      if (S.t >= C.t) return this.end(false);
    } else if (C.k === 'hold') {
      const o = S.prov[C.pid].o;
      if (!o || Game.team(o) !== team) return this.end(false);
      if (S.t >= C.t) return this.end(true);
    } else if (C.k === 'destroy') {
      if (C.got >= C.need) return this.end(true);
      if (S.t >= C.t) return this.end(false);
    }
  },
  // Pick a kind that fits the situation (not the same kind twice in a row when another one is possible).
  start() {
    const S = Game.state, M = S.mis, per = Events.per(S.player);
    const kinds = ['capture', 'hold', 'destroy'].sort(() => Math.random() - 0.5).sort((a, b) => (a === M.last) - (b === M.last));
    for (const k of kinds) {
      let C = null;
      if (k === 'capture') { const pid = this.captureTarget(S); if (pid !== null) C = { pid, t: S.t + MISSIONS.time.capture, rew: { m: Math.round(per.m * 4) }, ww: MISSIONS.ww.capture }; }
      else if (k === 'hold') { const pid = this.holdTarget(S); if (pid !== null) C = { pid, t: S.t + MISSIONS.time.hold, rew: { i: Math.round(per.i * 4), m: Math.round(per.m * 2) }, ww: MISSIONS.ww.hold }; }
      else { const g = this.destroyGoal(S); if (g) C = { cls: g.cls, need: g.need, got: 0, t: S.t + MISSIONS.time.destroy, rew: { o: Math.round(per.o * 4), m: Math.round(per.m * 2) }, ww: MISSIONS.ww.destroy }; }
      if (!C) continue;
      C.k = k; C.t0 = S.t;
      M.cur = C; M.last = k;
      Game.emit('missionNew', C);
      return C;
    }
    M.next = S.t + 30; // nothing fits right now
    return null;
  },
  end(ok) {
    const S = Game.state, M = S.mis, C = M.cur, s = S.side[S.player];
    M.cur = null;
    M.next = S.t + MISSIONS.pause + Math.random() * MISSIONS.pause;
    M.n = (M.n || 0) + 1;
    if (ok) {
      M.ok = (M.ok || 0) + 1;
      for (const r in C.rew) s[r] += C.rew[r];
      Game.weary(S.player, -C.ww);
    }
    Game.emit('missionEnd', { C, ok });
  },
  // Destroyed enemy units count for a running destroy goal.
  killed({ u, killer }) {
    const S = Game.state, C = S && S.mis && S.mis.cur;
    if (!C || C.k !== 'destroy' || !killer || killer.s !== S.player || !Game.hostile(S.player, u.s) || !this.fits(C.cls, u)) return;
    C.got++;
    Game.emit('missionProgress', C);
  },
};
Game.on('killed', (e) => Missions.killed(e));
