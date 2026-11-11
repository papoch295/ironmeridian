// AI commanders: one per country at war (except the player's). Each runs its own economy, recruitment, defense,
// offensive waves, air force, navy and missile strikes against every faction it is at war with.
// Allies of the player play on "normal" settings; factions hostile to the player use the chosen difficulty.
'use strict';

const AI_MIX = {
  barracks: { inf: 4, at: 2, recon: 0.8, mortar: 1, eng: 1, medic: 0.5, sniper: 0.5, seal: 0.5, marine: 0.4 },
  factory: { ifv: 3, mbt: 3, apc: 1, lt: 1, aa: 1.5, arty: 1, spg: 1, mlrs: 1, td: 1, truck: 0.4, tbm: 0.4, sam2: 0.4, hq: 0.3, ew: 0.3, coast: 0.15 },
  airfield: { ahelo: 2, jet: 2, thelo: 0.3, bomber: 0.5, uav: 0.3, loit: 0.5, cas: 1, sjet: 0.5, awacs: 0.15 },
  shipyard: { corv: 1, sub: 1, dd: 1, frig: 1 },
};
const AI = {
  acc: 0,
  init(S) { S.ai = {}; },

  // Per-faction state, created on first use (also for countries that join a war later).
  st(S, k) {
    const D = DIFFICULTY[S.diff];
    return S.ai[k] || (S.ai[k] = { t: Math.random() * D.aiTick, missileT: D.grace + 30 + Math.random() * 30, def: {} });
  },

  update(dt) {
    this.acc += dt;
    if (this.acc < 0.5) return;
    const step = this.acc;
    this.acc = 0;
    const S = Game.state, D = DIFFICULTY[S.diff];
    Tactics.updateArmies(S);
    // Group provinces and units by owner once per AI frame.
    const prov = {}, units = {};
    S.prov.forEach((pr, pid) => { if (pr.o) (prov[pr.o] || (prov[pr.o] = [])).push(pid); });
    for (const u of S.units) (units[u.s] || (units[u.s] = [])).push(u);
    for (const k in S.side) {
      if (k === S.player || !Game.bell[Geo.byKey[k].idx]) continue; // neutrals wait until war reaches them
      const mine = prov[k] || [], mu = units[k] || [];
      if (!mine.length && !mu.length) continue;
      const A = this.st(S, k);
      A.t -= step; A.missileT -= step;
      if (A.t > 0) continue;
      const ally = Game.allied(k, S.player), Dk = ally ? DIFFICULTY.normal : D;
      A.t = Dk.aiTick;
      const enemy = [];
      for (const o in prov) if (Game.hostile(k, o)) for (const pid of prov[o]) enemy.push(pid);
      if (!enemy.length && !S.units.some((u) => Game.hostile(k, u.s))) continue;
      this.economy(S, Dk, k, mine, mu, A);
      this.landing(S, Dk, k, mine, enemy, mu, A);
      this.army(S, Dk, k, mine, enemy, mu, A);
      this.air(S, Dk, k, mine, enemy, mu);
      this.navy(S, Dk, k, enemy, mu);
      if (A.missileT <= 0) { A.missileT = 50 + Math.random() * 40 * Dk.aggr; if (Math.random() < Dk.missiles) this.missiles(S, k, mine, enemy); }
    }
  },

  // Hostile units that faction k can currently see.
  seenFoes(S, k, filter) { return S.units.filter((u) => Game.hostile(k, u.s) && Sim.sees(k, u) && !u.inside && (!filter || filter(u))); },

  pickWeighted(mix, ok) {
    const opts = Object.entries(mix).filter(([k]) => ok(k));
    const sum = opts.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * sum;
    for (const [k, w] of opts) { r -= w; if (r <= 0) return k; }
    return opts.length ? opts[0][0] : null;
  },

  economy(S, D, me, mine, mu, A) {
    const side = S.side[me];
    const cap = mine.find((pid) => Geo.provinces[pid].type === 'capital') ?? mine[0];
    if (cap === undefined) return;
    const want = [['barracks', 2], ['radar', 1], ['factory', 2], ['airfield', 2], ['radar', 2], ['factory', 3], ['shipyard', 1], ['silo', 1], ['airfield', 3], ['shipyard', 2]];
    // Air defense on Normal and Hard; nuclear research only on Hard.
    if (S.diff !== 'easy') want.splice(5, 0, ['aad', 1]);
    if (S.diff === 'hard') want.push(['aad', 2], ['lab', 1]);
    if (S.t > 60) for (const [b, lvl] of want) {
      const pr = S.prov[cap];
      if (pr.b[b] < lvl && !pr.q.some((q) => q.kind === 'bld') && !Game.canQueue(cap, 'bld', b) && side.m > 1500) { Game.queue(cap, 'bld', b); break; }
    }
    // Economic growth when rich.
    if (side.m > 4000 && Math.random() < 0.3) {
      const pid = mine.filter((p) => S.prov[p].lvl < 4 && !S.prov[p].q.length).sort((a, b) => S.prov[a].lvl - S.prov[b].lvl)[0];
      if (pid !== undefined) Game.queue(pid, 'upg');
    }
    // Army size limit grows with the country's weight (D.cap was tuned for a whole bloc of about 12 power).
    // In a world war over a hundred countries recruit at once, so every army is kept at half that size.
    const ffa = S.mode === 'ffa' ? 0.5 : 1;
    // Units already in production count towards the limit and the upkeep, otherwise every province with a barracks
    // would recruit from the starting money at the same moment (the "wave" at the start of a game).
    let queued = 0, qm = 0, qo = 0;
    for (const pid of mine) for (const q of S.prov[pid].q) if (q.kind === 'unit' && UNIT_TYPES[q.key]) { queued++; qm += UNIT_TYPES[q.key].cost.m; qo += UNIT_TYPES[q.key].cost.o; }
    if (mu.length + queued >= Math.max(4, Math.round(D.cap * Geo.byKey[me].power / 12 * ffa))) return;
    // Steady pace instead of bursts: one recruitment every few seconds, bigger countries faster, half pace while the
    // country is still mobilising (first D.mob seconds of its war). Missiles below are not affected.
    const pw = Geo.byKey[me].power, mob = S.t < (A.war0 ?? (A.war0 = S.t)) + D.mob ? 2 : 1;
    let canRec = S.t >= (A.recT || 0);
    for (const pid of mine) {
      const pr = S.prov[pid];
      if (pr.q.length || pr.cap) continue;
      const blds = ['factory', 'barracks', 'airfield', 'shipyard'].filter((b) => pr.b[b]);
      if (!blds.length) continue;
      const b = blds[Math.floor(Math.random() * blds.length)];
      const key = this.pickWeighted(AI_MIX[b], (k) => !Game.canQueue(pid, 'unit', k));
      // Only recruit what the economy can keep paying for (net income stays positive with the new unit).
      const c = key && UNIT_TYPES[key].cost;
      if (canRec && key && side.m - c.m > 500 && (!side.inc || (side.inc.m - (c.m + qm) * UPKEEP.m > 0 && side.inc.o - (c.o + qo) * UPKEEP.o > -2))) {
        Game.queue(pid, 'unit', key);
        canRec = false;
        A.recT = S.t + D.recGap * mob * (S.mode === 'ffa' ? 1.5 : 1) / (0.6 + 0.25 * pw);
      }
      if (pr.b.silo && pr.msl.srbm < 3 && !Game.canQueue(pid, 'msl', 'srbm') && side.m > 3000) Game.queue(pid, 'msl', 'srbm');
      if (pr.b.silo >= 3 && pr.msl.icbm < 1 && S.diff === 'hard' && !Game.canQueue(pid, 'msl', 'icbm')) Game.queue(pid, 'msl', 'icbm');
      if (pr.b.lab && S.diff === 'hard' && (side.nukes || 0) < 2 && side.m > 9000 && !Game.canQueue(pid, 'nuke', 'nuke')) Game.queue(pid, 'nuke', 'nuke');
    }
  },

  army(S, D, me, mine, enemy, mu, A) {
    const land = mu.filter((u) => !u.inside && UNIT_TYPES[u.t].dom === 'land' && !u.rout);
    const heli = mu.filter((u) => UNIT_TYPES[u.t].heli && UNIT_TYPES[u.t].w.length);
    if (!enemy.length) {
      // Hunt down whatever enemy units are left.
      const left = S.units.find((u) => Game.hostile(me, u.s) && !u.inside);
      if (left) Game.order(land.filter((u) => !u.ord), { k: 'amove', x: left.x, y: left.y });
      return;
    }
    // Defend provinces with visible enemies nearby.
    const threatened = [];
    for (const pid of mine) {
      const p = Geo.provinces[pid];
      const n = Game.hash.query(p.x, p.y, 2, []).filter((u) => Game.hostile(me, u.s) && Sim.sees(me, u) && !Sim.isAir(u)).length;
      if (n) threatened.push({ pid, n });
    }
    threatened.sort((a, b) => b.n - a.n);
    let O = A.off;
    // Plans from older versions (one big wave) are dropped; the AI plans anew.
    if (!O || (O.ph !== 'wait' && !O.groups)) O = A.off = { ph: 'wait', t: Math.max(S.t + 60, D.grace) };
    // Groups saved with separate role lists (first version of the battle groups) keep all ids in one list now.
    if (O.groups) for (const g of O.groups) if (g.sup) {
      g.ids = g.ids.concat(g.sup, g.rec || []); delete g.sup; delete g.rec; g.side = me;
      const p = O.ph === 'attack' ? this.groupTarget(O, g) : null;
      if (p != null) Object.assign(g, { pid: p, tx: Geo.provinces[p].x, ty: Geo.provinces[p].y, ret: Tactics.RETREAT, k: 'attack' });
      else if (O.ph === 'attack') g.ph = 'hold';
    }
    // Units of a running offensive or landing belong to their battle group and are not pulled into home defense.
    const used = new Set(O.ph === 'wait' ? [] : O.groups.flatMap((g) => g.ids));
    if (A.land && A.land.ids) A.land.ids.forEach((id) => used.add(id));
    this.probe(S, D, A, O, enemy, land, used);
    const free = land.filter((u) => !u.ord || u.ord.ai === 'wave-done');
    for (const th of threatened.slice(0, 4)) {
      const p = Geo.provinces[th.pid];
      const helpers = free.filter((u) => !used.has(u.id) && U.dist(u.x, u.y, p.x, p.y) < 6)
        .sort((a, b) => U.dist2(a.x, a.y, p.x, p.y) - U.dist2(b.x, b.y, p.x, p.y)).slice(0, Math.min(8, th.n + 2));
      helpers.forEach((u) => used.add(u.id));
      if (helpers.length) Game.order(helpers, { k: 'amove', x: p.x, y: p.y });
    }
    this.offensive(S, D, me, mine, enemy, land, heli, free.filter((u) => !used.has(u.id)), O);
    // Between offensives the idle troops man the front sections and dig in there.
    if (O.ph === 'wait') this.front(S, me, mine, enemy, land.filter((u) => !u.ord && !used.has(u.id)), A);
    // Units that arrived but the province still stands: push into the city center.
    for (const u of land) if (u.ord && u.ord.ai === 'wave' && !u.path && !u.tgt) u.ord.ai = 'wave-done';
  },

  // Scouting raids between offensives keep the front alive without a swarm: every D.probe seconds one reconnaissance
  // unit (or two light units) pushes into the nearest hostile province close by and comes back after 75 s.
  // Starts at half the grace time, so the first minutes are not empty although the big offensives come later.
  probe(S, D, A, O, enemy, land, used) {
    const P = A.probe;
    if (P && P.ids) {
      const us = P.ids.map((id) => Game.byId.get(id)).filter(Boolean);
      us.forEach((u) => used.add(u.id));
      if (S.t >= P.back || !us.length) { Game.order(us, { k: 'move', x: P.hx, y: P.hy }); A.probe = { t: S.t + D.probe * (0.8 + 0.4 * Math.random()) }; }
      return;
    }
    if (O.ph !== 'wait' || S.t < Math.max(D.grace * 0.5, P ? P.t : 0) || !enemy.length) return;
    const idle = land.filter((u) => !u.ord && !used.has(u.id));
    const rec = idle.filter((u) => u.t === 'recon'), light = idle.filter((u) => ['inf', 'lt', 'ifv', 'apc'].includes(u.t));
    const party = rec.length ? rec.slice(0, 1) : light.length >= 4 ? light.slice(0, 2) : [];
    A.probe = { t: S.t + 30 }; // retry soon when nothing fits
    if (!party.length) return;
    const [hx, hy] = Tactics.center(party), pid = this.nearestEnemy(enemy, { x: hx, y: hy });
    if (pid == null || U.dist(hx, hy, Geo.provinces[pid].x, Geo.provinces[pid].y) > 8) return;
    Game.order(party, { k: 'amove', x: Geo.provinces[pid].x, y: Geo.provinces[pid].y });
    A.probe = { ids: party.map((u) => u.id), back: S.t + 75, hx, hy };
    party.forEach((u) => used.add(u.id));
  },

  // Front sections: every FRONT_EVERY seconds idle land units are spread over the own provinces closest to the enemy
  // (at most FRONT_R away) and take position a little towards it, where they get cover and dig in. Units already
  // at a post stay; a quarter of the rest stays where it is as a reserve.
  FRONT_EVERY: 40,
  FRONT_R: 6,
  front(S, me, mine, enemy, idle, A) {
    if (S.t < (A.frT || 0) || !idle.length || !enemy.length) return;
    A.frT = S.t + this.FRONT_EVERY;
    const posts = [];
    for (const pid of mine) {
      const p = Geo.provinces[pid], e = this.nearestEnemy(enemy, p);
      if (e == null) continue;
      const q = Geo.provinces[e], d = U.dist(p.x, p.y, q.x, q.y);
      if (d < this.FRONT_R) posts.push({ p, q, d });
    }
    if (!posts.length) return;
    posts.sort((a, b) => a.d - b.d);
    const use = posts.slice(0, U.clamp(Math.ceil(idle.length / 4), 1, 6)), cnt = use.map(() => 0);
    const rest = idle.filter((u) => {
      const i = use.findIndex((s) => U.dist(u.x, u.y, s.p.x, s.p.y) < 1);
      if (i >= 0) cnt[i]++;
      return i < 0;
    });
    for (const u of rest.slice(0, Math.ceil(rest.length * 0.75))) {
      let bi = 0, bs = 1e18;
      use.forEach((s, i) => { const v = U.dist2(u.x, u.y, s.p.x, s.p.y) * (1 + cnt[i] * 0.5); if (v < bs) { bs = v; bi = i; } });
      const s = use[bi], k = Math.min(0.35, s.d * 0.3), a = Math.random() * Math.PI * 2;
      cnt[bi]++;
      Game.order([u], { k: 'move', x: s.p.x + (s.q.x - s.p.x) / s.d * k + Math.cos(a) * 0.15, y: s.p.y + (s.q.y - s.p.y) / s.d * k + Math.sin(a) * 0.15 });
    }
  },

  // Combat value of units (price × remaining health) and of a target: visible enemy ground units around it plus
  // its garrison. Offensives only attack where they have local superiority (D.sup).
  value(us) { return us.reduce((s, u) => s + UNIT_TYPES[u.t].cost.m * u.hp / UNIT_TYPES[u.t].hp, 0); },
  foeValue(S, me, pid) {
    const p = Geo.provinces[pid];
    const foes = Game.hash.query(p.x, p.y, 2, []).filter((u) => Game.hostile(me, u.s) && Sim.sees(me, u) && UNIT_TYPES[u.t].dom === 'land');
    return this.value(foes) + S.prov[pid].def * 4;
  },

  // Envelopment: a point beside the main target (about 70° off the main axis), on land the troops can reach.
  flankPoint(mp, st) {
    const d = U.clamp(U.dist(mp.x, mp.y, st[0], st[1]), 1.8, 3), a0 = Math.atan2(st[1] - mp.y, st[0] - mp.x);
    for (const da of [1.2, -1.2, 0.9, -0.9]) {
      const x = mp.x + Math.cos(a0 + da) * d, y = mp.y + Math.sin(a0 + da) * d;
      if (!Geo.isLand(x, y)) continue;
      const c = Geo.provinceAt(x, y);
      if (!c || !Game.bell[c.country]) continue;
      if (Path.find(st[0], st[1], x, y, 'land', Game.bell, 60000)) return [x, y];
    }
    return null;
  },
  FLANK_SYNC: 45, // seconds the main groups wait for the flanking group before they assault anyway

  // Offensives follow a fixed rhythm so the player can learn them: every D.offEvery seconds the troops first gather
  // at a staging province for D.gather seconds, then attack. The main axis keeps its direction until its target
  // falls (the next target is the one closest to it); a secondary axis hits a different target.
  // The force is split into battle groups of mixed roles instead of one swarm. Each group attacks in phases
  // (reconnaissance → artillery preparation → assault → hold) and breaks off when it has lost too much.
  // Between offensives the AI only defends. A gathering that the player's side can see raises a warning.
  OFF_MIN: 8,
  OFF_PARALLEL: 2,
  offensive(S, D, me, mine, enemy, land, heli, pool, O) {
    if (O.ph === 'wait') {
      if (S.t < O.t) return;
      // Fewer but stronger offensives: a country attacks only with at least OFF_MIN free units (small ones defend and
      // scout instead), and at most 2 countries of one alliance run an offensive at the same time.
      const busy = Object.keys(S.ai).filter((o) => o !== me && S.team[o] === S.team[me] && S.ai[o].off && S.ai[o].off.ph !== 'wait').length;
      if (pool.length < this.OFF_MIN || busy >= this.OFF_PARALLEL) { O.t = S.t + 30; return; }
      const prev = O.main != null && Game.hostile(me, S.prov[O.main].o) ? O.main : null;
      const main = prev ?? this.pickTarget(S, mine, enemy, land, O.main != null ? Geo.provinces[O.main] : null);
      if (main === null) { O.t = S.t + 30; return; }
      const mp = Geo.provinces[main];
      // Keep a small garrison at home.
      const force = pool.sort((a, b) => U.dist2(a.x, a.y, mp.x, mp.y) - U.dist2(b.x, b.y, mp.x, mp.y)).slice(0, Math.max(3, Math.floor(pool.length * 0.8)));
      const groups = this.formGroups(force);
      const st = this.stagingPoint(mine, mp, force);
      // One group (the last, usually the smallest) takes the secondary axis: either an envelopment of the main
      // target from the flank (chance D.flank) or an attack on a different target.
      const flank = groups.length >= 2 && Math.random() < D.flank ? this.flankPoint(mp, st) : null;
      const sideT = groups.length >= 2 && !flank ? this.pickSideTarget(S, mine, enemy, main) : null;
      groups.forEach((g, i) => { g.axis = i === groups.length - 1 ? (flank ? 'flank' : sideT !== null ? 'side' : 'main') : 'main'; });
      const ss = sideT === null ? null : this.stagingPoint(mine, Geo.provinces[sideT], force);
      Object.assign(O, { ph: 'gather', t: S.t + D.gather, next: S.t + D.offEvery, main, side: sideT, sx: st[0], sy: st[1],
        ssx: ss && ss[0], ssy: ss && ss[1], flank, groups, warned: false, waits: 0, syncT: null });
      // Groups on the same axis assemble side by side, not on one spot.
      const n = { main: 0, side: 0 };
      for (const g of groups) {
        if (g.axis === 'flank') { g.x = flank[0]; g.y = flank[1]; Game.order(Tactics.members(g), { k: 'amove', x: g.x, y: g.y, coh: 1 }); continue; }
        const [bx, by] = g.axis === 'side' ? ss : st, tp = Geo.provinces[g.axis === 'side' ? sideT : main];
        const a = Math.atan2(tp.y - by, tp.x - bx) + Math.PI / 2, off = (n[g.axis]++ - 0.5 * (groups.filter((x) => x.axis === g.axis).length - 1)) * 0.45;
        g.x = bx + Math.cos(a) * off; g.y = by + Math.sin(a) * off;
        Game.order(Tactics.members(g), { k: 'amove', x: g.x, y: g.y, coh: 1 });
      }
      return;
    }
    if (O.ph === 'gather') {
      // Warning when the player or an ally can see any of the gathering troops and the target is on their side.
      if (!O.warned && Game.hostile(me, S.player) && [O.main, O.side].some((p) => p != null && Game.allied(S.prov[p].o, S.player))
        && O.groups.some((g) => Tactics.members(g).some((u) => Sim.sees(S.player, u)))) {
        O.warned = true;
        Game.emit('aiGather', { k: me, x: O.sx, y: O.sy, pid: O.main });
      }
      if (S.t < O.t) return;
      // Attack: targets that fell in the meantime are replaced by the nearest hostile province.
      for (const key of ['main', 'side']) if (O[key] != null && !Game.hostile(me, S.prov[O[key]].o)) O[key] = this.nearestEnemy(enemy, Geo.provinces[O[key]]);
      // Local superiority: too strong a defence (as far as the AI can see) makes it switch to a weaker target near
      // the staging point, wait up to twice for 30 s, or call the offensive off.
      const own = this.value(O.groups.flatMap((g) => Tactics.members(g)));
      if (O.main != null && own < D.sup * this.foeValue(S, me, O.main)) {
        O.waits = (O.waits || 0) + 1;
        const alt = enemy.filter((pid) => pid !== O.main && U.dist(Geo.provinces[pid].x, Geo.provinces[pid].y, O.sx, O.sy) < 5)
          .map((pid) => ({ pid, v: this.foeValue(S, me, pid) })).filter((c) => own >= D.sup * c.v).sort((a, b) => a.v - b.v)[0];
        if (alt) {
          O.main = alt.pid; O.flank = null;
          for (const g of O.groups) if (g.axis === 'flank') g.axis = 'main';
        } else if (O.waits <= 2) { O.t = S.t + 30; return; }
        else {
          // Only a warned offensive is reported as called off (the player saw it coming).
          if (O.warned) Game.emit('aiCalledOff', { k: me, x: O.sx, y: O.sy });
          Object.assign(O, { ph: 'wait', t: S.t + D.offEvery * 0.5, groups: [], warned: false, flank: null });
          return;
        }
      }
      for (const g of O.groups) {
        const pid = this.groupTarget(O, g);
        if (pid == null) { g.ph = 'hold'; continue; }
        Object.assign(g, { side: me, pid, tx: Geo.provinces[pid].x, ty: Geo.provinces[pid].y, ret: Tactics.RETREAT, k: 'attack' });
        // The flanking group may still be on its way round: it marches up first and attacks from its side.
        const far = g.axis === 'flank' && U.dist(...Tactics.center(Tactics.members(g)), g.x, g.y) > 0.8;
        Tactics.phase(g, far ? 'approach' : 'recon');
      }
      const h = heli.filter((u) => !u.ord);
      if (h.length && O.main != null) Game.order(h, { k: 'amove', x: Geo.provinces[O.main].x, y: Geo.provinces[O.main].y });
      O.ph = 'attack';
      O.t = S.t + 300;
      return;
    }
    // Attack: every group runs through its own phases; the offensive ends when all are done or time is up.
    for (const g of O.groups) this.groupStep(S, me, g, O, enemy);
    if (S.t >= O.t || O.groups.every((g) => g.ph === 'hold' || g.ph === 'retreat' || g.ph === 'done'))
      Object.assign(O, { ph: 'wait', t: Math.max(O.next, S.t + 30), groups: [], warned: false, flank: null });
  },

  // Battle groups of 4–8 units: front units (tanks, infantry, IFVs) spread evenly, plus support (artillery, air
  // defense, medics, supply) and reconnaissance, so every group fights with combined arms (roles: Tactics.roles).
  formGroups(force) {
    const R = Tactics.roles(force), by = { front: [], sup: R.arty.concat(R.other), rec: R.rec };
    // Sorting by type first makes the round-robin below mix the types across groups.
    by.front = R.front.slice().sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
    const n = U.clamp(Math.round(by.front.length / 6), 1, 4);
    const groups = Array.from({ length: n }, () => ({ ids: [], ph: 'gather', t: 0, hp0: 0, front: 0 }));
    for (const r of ['front', 'sup', 'rec']) by[r].forEach((u, i) => { groups[i % n].ids.push(u.id); if (r === 'front') groups[i % n].front++; });
    // Groups without front units would only be support: they join the first group.
    for (const g of groups.slice(1)) if (!g.front) { groups[0].ids.push(...g.ids); g.ids = []; }
    return groups.filter((g) => g.ids.length).map(({ front, ...g }) => g);
  },

  groupTarget(O, g) { const pid = g.axis === 'side' && O.side != null ? O.side : O.main; return pid == null ? null : pid; },

  // One AI frame of a battle group (phases and retreat live in Tactics). Groups that have not attacked yet
  // switch to the nearest hostile province when their target fell to someone else.
  groupStep(S, me, g, O, enemy) {
    if (g.ph === 'hold' || g.ph === 'retreat' || g.ph === 'done') return;
    if ((g.ph === 'recon' || g.ph === 'prep') && !Game.hostile(me, S.prov[g.pid].o)) {
      const next = this.nearestEnemy(enemy, Geo.provinces[g.pid]);
      if (next == null) { g.ph = 'hold'; return; }
      O[g.axis === 'side' && O.side != null ? 'side' : 'main'] = next;
      Object.assign(g, { pid: next, tx: Geo.provinces[next].x, ty: Geo.provinces[next].y });
    }
    // Envelopment: the main groups hold their assault until the flanking group is in position (at most FLANK_SYNC s).
    if (g.axis === 'main' && O.flank && (g.ph === 'recon' || g.ph === 'prep') && S.t >= g.t - 0.5) {
      const fl = O.groups.find((x) => x.axis === 'flank');
      if (O.syncT == null) O.syncT = S.t + this.FLANK_SYNC;
      if (fl && fl.ph === 'approach' && S.t < O.syncT) g.t = S.t + 1;
    }
    const pid = g.pid;
    if (Tactics.step(g) === 'retreat') {
      const p = Geo.provinces[pid];
      if (Game.hostile(me, S.player) && Game.allied(S.prov[pid].o, S.player) && Tactics.members(g).some((u) => Sim.sees(S.player, u)))
        Game.emit('aiRetreat', { k: me, x: p.x, y: p.y, pid });
    }
  },

  // Own province closest to the target, a little towards it; without territory the troops' center.
  stagingPoint(mine, tp, us) {
    let best = null, bd = 1e18;
    for (const pid of mine) { const p = Geo.provinces[pid], d = U.dist2(p.x, p.y, tp.x, tp.y); if (d < bd) { bd = d; best = p; } }
    if (!best) return us.length ? [us.reduce((s, u) => s + u.x, 0) / us.length, us.reduce((s, u) => s + u.y, 0) / us.length] : [tp.x, tp.y];
    const d = Math.sqrt(bd), k = d > 1.5 ? 0.6 / d : 0;
    return [best.x + (tp.x - best.x) * k, best.y + (tp.y - best.y) * k];
  },

  nearestEnemy(enemy, p) {
    let best = null, bd = 1e18;
    for (const pid of enemy) { const q = Geo.provinces[pid], d = U.dist2(q.x, q.y, p.x, p.y); if (d < bd) { bd = d; best = pid; } }
    return best;
  },

  // Secondary axis: a different hostile province near our border, but clearly apart from the main target.
  pickSideTarget(S, mine, enemy, main) {
    const mp = Geo.provinces[main];
    let best = null, bs = 1e18;
    for (const pid of enemy) {
      const p = Geo.provinces[pid], dm = U.dist(p.x, p.y, mp.x, mp.y);
      if (dm < 4 || dm > 20) continue;
      let d = 1e18;
      for (const m of mine) d = Math.min(d, U.dist2(p.x, p.y, Geo.provinces[m].x, Geo.provinces[m].y));
      if (d < bs) { bs = d; best = pid; }
    }
    return best;
  },

  // Main target: the hostile province closest to our territory. After a fallen target (axis) the next one is
  // preferably taken near it, so an offensive keeps pushing along the same front section.
  pickTarget(S, mine, enemy, land, axis) {
    if (!land.length) return null;
    const cx = land.reduce((s, u) => s + u.x, 0) / land.length, cy = land.reduce((s, u) => s + u.y, 0) / land.length;
    const scored = enemy.map((pid) => {
      const p = Geo.provinces[pid];
      let dmin = 1e9;
      for (const m of mine) dmin = Math.min(dmin, U.dist2(p.x, p.y, Geo.provinces[m].x, Geo.provinces[m].y));
      if (!mine.length) dmin = U.dist2(p.x, p.y, cx, cy);
      const val = p.type === 'capital' ? 0.7 : p.type === 'industry' || p.type === 'oil' ? 0.85 : 1;
      return { pid, s: Math.sqrt(dmin) * val + U.dist(cx, cy, p.x, p.y) * 0.15 + (axis ? U.dist(axis.x, axis.y, p.x, p.y) * 0.5 : 0) };
    }).sort((a, b) => a.s - b.s);
    // Among the closest candidates, strongly held provinces (visible troops, garrison) are less attractive.
    const me = land[0].s, own = Math.max(1, this.value(land));
    const top = scored.slice(0, 8);
    for (const c of top) c.s += 4 * this.foeValue(S, me, c.pid) / own;
    top.sort((a, b) => a.s - b.s);
    scored.splice(0, top.length, ...top);
    for (const c of scored.slice(0, 4)) {
      const p = Geo.provinces[c.pid];
      if (Path.find(cx, cy, p.x, p.y, 'land', Game.bell, 120000)) return c.pid;
    }
    return scored.length ? scored[0].pid : null;
  },

  // Amphibious landings with a landing ship, run apart from the regular offensives:
  // plan (target coast, own embarkation coast, troops) → board → sail → land → attack in phases like a battle group.
  // Islands that cannot be reached over land are preferred; on Easy only those are attacked from the sea.
  // A loaded ship heading for the player's side raises a warning as soon as the player can see it.
  LAND_COOLDOWN: 1.5, // × D.offEvery between two landings of one faction
  landing(S, D, me, mine, enemy, mu, A) {
    let L = A.land;
    if (!L || L.ph === 'wait') {
      if (S.t < D.grace || (L && S.t < L.t) || !enemy.length) return;
      A.land = L = { ph: 'wait', t: S.t + 45 }; // next planning attempt, unless an operation starts now
      const ships = mu.filter((u) => UNIT_TYPES[u.t].cap && UNIT_TYPES[u.t].dom === 'sea');
      if (!ships.length) { this.buildLandingShip(S, me, mine); return; }
      // An idle ship that still carries troops (failed landing) lets them off first.
      for (const s of ships) if (!s.ord && s.cargo.length) Game.unload(s);
      const ship = ships.find((u) => !u.cargo.length && !u.ord) || null;
      if (!ship) return;
      this.planLanding(S, D, me, mine, enemy, mu, A, ship);
      return;
    }
    const ship = Game.unit(L.ship);
    const end = (cool) => { A.land = { ph: 'wait', t: S.t + (cool ? D.offEvery * this.LAND_COOLDOWN : 60) }; };
    if (L.ph === 'board') {
      // Troops walk to the ship at the coast; it sails once everyone is aboard (or after a while with whoever is).
      if (!ship) { end(false); return; }
      const waiting = L.ids.map((id) => Game.unit(id)).filter((u) => u && !u.inside && u.ord && u.ord.k === 'load');
      if (waiting.length && S.t < L.t) return;
      if (ship.cargo.length < 2) { Game.unload(ship, true); end(false); return; }
      L.ids = ship.cargo.slice();
      L.ph = 'sail'; L.t = S.t + 300;
      Game.order([ship], { k: 'move', x: L.sx, y: L.sy, unload: 1 });
      return;
    }
    if (L.ph === 'sail') {
      if (!ship) { end(true); return; } // sunk with everyone aboard
      if (!L.warned && Game.hostile(me, S.player) && Game.allied(S.prov[L.pid].o, S.player) && Sim.sees(S.player, ship)) {
        L.warned = true;
        Game.emit('aiLanding', { k: me, ev: 'sail', x: ship.x, y: ship.y, pid: L.pid });
      }
      if (ship.cargo.length) {
        // Still at sea. Arrived without a shore in reach, or took too long: land here if possible, otherwise
        // sail home with the troops (they get off there, see the waiting phase).
        if ((!ship.ord || S.t > L.t) && !Game.unload(ship)) { Game.order([ship], { k: 'move', x: L.hx, y: L.hy, unload: 1 }); end(true); }
        if (ship.cargo.length) return;
      }
      // Landed: the troops attack the target in phases; the beachhead is their fallback point.
      const g = { ids: L.ids.filter((id) => Game.unit(id)), side: me, ret: Tactics.RETREAT };
      if (!g.ids.length) { end(true); return; }
      const p = Geo.provinces[L.pid];
      Tactics.task(g, 'attack', p.x, p.y, L.pid);
      Object.assign(L, { ph: 'fight', g, t: S.t + 600 });
      if (Game.hostile(me, S.player) && Game.allied(S.prov[L.pid].o, S.player))
        Game.emit('aiLanding', { k: me, ev: 'land', x: ship.x, y: ship.y, pid: L.pid });
      Game.order([ship], { k: 'move', x: L.hx, y: L.hy }); // the empty ship heads home
      return;
    }
    if (L.ph === 'fight') {
      const g = L.g;
      g.ids = g.ids.filter((id) => Game.unit(id)); L.ids = g.ids;
      Tactics.step(g);
      if (!g.ids.length || g.ph === 'hold' || g.ph === 'done' || S.t > L.t) end(true);
      return;
    }
    end(false); // unknown phase (older save): plan anew
  },

  // A faction with a shipyard and no landing ship orders one.
  buildLandingShip(S, me, mine) {
    const side = S.side[me];
    if (side.m < 2500) return;
    if (mine.some((pid) => S.prov[pid].q.some((q) => q.kind === 'unit' && UNIT_TYPES[q.key] && UNIT_TYPES[q.key].cap && UNIT_TYPES[q.key].dom === 'sea'))) return;
    const pid = mine.find((p) => S.prov[p].b.shipyard && !S.prov[p].q.length && !Game.canQueue(p, 'unit', 'lst'));
    if (pid !== undefined) Game.queue(pid, 'unit', 'lst');
  },

  planLanding(S, D, me, mine, enemy, mu, A, ship) {
    const coastal = mine.filter((pid) => Geo.provinces[pid].seaPt);
    const targets = enemy.filter((pid) => Geo.provinces[pid].seaPt);
    if (!coastal.length || !targets.length) return;
    const used = new Set(A.off && A.off.ph !== 'wait' ? A.off.groups.flatMap((g) => g.ids) : []);
    const free = mu.filter((u) => !u.inside && !u.ord && !u.rout && !used.has(u.id) && UNIT_TYPES[u.t].dom === 'land' && Game.fits(ship, u));
    if (free.length < 3) return;
    // Candidate targets: the closest hostile coasts to our own coast; islands (no land route) come first.
    const near = (p) => { let d = 1e18, best = null; for (const c of coastal) { const q = Geo.provinces[c], e = U.dist2(p.x, p.y, q.x, q.y); if (e < d) { d = e; best = c; } } return [best, Math.sqrt(d)]; };
    const cand = targets.map((pid) => { const p = Geo.provinces[pid], [home, d] = near(p); return { pid, home, d }; })
      .filter((c) => c.d < 40).sort((a, b) => a.d - b.d).slice(0, 4);
    let pick = null;
    for (const c of cand) {
      const p = Geo.provinces[c.pid], h = Geo.provinces[c.home];
      const island = !Path.find(h.x, h.y, p.x, p.y, 'land', Game.bell, 60000);
      if (!island && (S.diff === 'easy' || Math.random() > 0.35)) continue;
      if (!Path.find(ship.x, ship.y, p.seaPt[0], p.seaPt[1], 'sea', Game.bell)) continue;
      pick = c; break;
    }
    if (!pick) return;
    const h = Geo.provinces[pick.home], p = Geo.provinces[pick.pid];
    // Landing party: front units and scouts nearest to the embarkation coast, one artillery piece at most.
    const pool = free.filter((u) => U.dist(u.x, u.y, h.x, h.y) < 6).sort((a, b) => U.dist2(a.x, a.y, h.x, h.y) - U.dist2(b.x, b.y, h.x, h.y));
    const R = Tactics.roles(pool), cap = UNIT_TYPES[ship.t].cap, party = [];
    let seats = 0;
    for (const u of R.front.concat(R.rec, R.arty.slice(0, 1))) {
      const s = UNIT_TYPES[u.t].seat || 1;
      if (seats + s > cap) continue;
      party.push(u); seats += s;
    }
    if (party.length < 3) return;
    if (!Game.autoLoad(party, [ship])) return;
    A.land = { ph: 'board', ship: ship.id, ids: party.map((u) => u.id), pid: pick.pid, sx: p.seaPt[0], sy: p.seaPt[1],
      hx: h.seaPt[0], hy: h.seaPt[1], t: S.t + 90 + U.dist(ship.x, ship.y, h.x, h.y) / 0.1, warned: false };
  },

  air(S, D, me, mine, enemy, mu) {
    // Reconnaissance drones: a standing mission over the nearest enemy province they can reach.
    // AWACS: a standing mission halfway towards it, so the radar plane stays behind the own lines.
    for (const d of mu) {
      const DT = UNIT_TYPES[d.t];
      if (!(DT.uav || DT.awacs) || !d.air || d.air.st !== 'ground' || d.cas) continue;
      const b = Geo.provinces[d.air.base];
      if (!b) continue;
      const reach = Game.airReach(d) * 0.7;
      let best = null, bd = reach * reach;
      for (const pid of enemy) { const p = Geo.provinces[pid], q = U.dist2(p.x, p.y, b.x, b.y); if (q < bd) { bd = q; best = p; } }
      if (best) Game.order([d], DT.awacs ? { k: 'cas', x: (b.x + best.x) / 2, y: (b.y + best.y) / 2 } : { k: 'cas', x: best.x, y: best.y });
    }
    const planes = mu.filter((u) => u.air && u.air.st === 'ground' && UNIT_TYPES[u.t].w.length && u.air.fuel >= (UNIT_TYPES[u.t].fuel || 400) * 0.95);
    if (!planes.length) return;
    let seen = this.seenFoes(S, me, (u) => !(u.air && u.air.st === 'ground'));
    const early = S.t < D.grace;
    // During the opening only intruders near our own territory are attacked.
    if (early) seen = seen.filter((u) => mine.some((pid) => U.dist2(Geo.provinces[pid].x, Geo.provinces[pid].y, u.x, u.y) < 9));
    for (const pl of planes) {
      if (Math.random() > D.air * 0.6) continue;
      const T = UNIT_TYPES[pl.t], b = Geo.provinces[pl.air.base];
      if (!b) continue;
      const range = (T.fuel || 400) * T.spd * 0.3;
      let tgt = null;
      if (seen.length) {
        const cand = seen.filter((u) => U.dist(u.x, u.y, b.x, b.y) < range);
        if (cand.length) tgt = cand[Math.floor(Math.random() * cand.length)];
      }
      if (tgt) Game.order([pl], { k: 'amove', x: tgt.x, y: tgt.y });
      else if (!early && (pl.t === 'bomber' || Math.random() < 0.3)) {
        const pid = enemy.find((p) => U.dist(Geo.provinces[p].x, Geo.provinces[p].y, b.x, b.y) < range);
        if (pid !== undefined) Game.order([pl], { k: 'amove', x: Geo.provinces[pid].x, y: Geo.provinces[pid].y });
      }
    }
  },

  navy(S, D, me, enemy, mu) {
    const ships = mu.filter((u) => UNIT_TYPES[u.t].dom === 'sea');
    if (!ships.length) return;
    const foeShips = this.seenFoes(S, me, (u) => UNIT_TYPES[u.t].dom === 'sea');
    const seen = this.seenFoes(S, me, (u) => UNIT_TYPES[u.t].dom === 'land');
    const early = S.t < D.grace;
    for (const sh of ships) {
      const T = UNIT_TYPES[sh.t];
      if (T.cap) continue; // landing ships are run by the landing operation (see landing)
      if (T.strike && sh.strikeCd <= 0 && !early && Math.random() < D.air) {
        const t = seen.find((u) => U.dist(u.x, u.y, sh.x, sh.y) < T.strike.r);
        if (t) Game.carrierStrike(sh, t.x, t.y);
      }
      if (T.slbm && sh.slbm > 0 && !early && Math.random() < 0.02 * D.missiles) {
        const pid = enemy.slice().sort((a, b) => S.prov[b].lvl - S.prov[a].lvl).find((p) => U.dist(Geo.provinces[p].x, Geo.provinces[p].y, sh.x, sh.y) < MISSILES.slbm.r);
        if (pid !== undefined) Game.launchMissile(me, 'slbm', sh.x, sh.y, Geo.provinces[pid].x, Geo.provinces[pid].y, { uid: sh.id });
      }
      if (sh.ord) continue;
      const near = foeShips.sort((a, b) => U.dist2(a.x, a.y, sh.x, sh.y) - U.dist2(b.x, b.y, sh.x, sh.y))[0];
      if (near && U.dist(near.x, near.y, sh.x, sh.y) < 25) { Game.order([sh], { k: 'attack', id: near.id }); continue; }
      let coast = null, bd = 1e18;
      for (const pid of enemy) { const p = Geo.provinces[pid]; if (!p.seaPt) continue; const d = U.dist2(p.x, p.y, sh.x, sh.y); if (d < bd) { bd = d; coast = p; } }
      if (coast && Math.random() < 0.25 && T.cls !== 'sub') Game.order([sh], { k: 'amove', x: coast.seaPt[0], y: coast.seaPt[1] });
    }
  },

  missiles(S, me, mine, enemy) {
    const seen = this.seenFoes(S, me, (u) => !Sim.isAir(u));
    for (const pid of mine) {
      const pr = S.prov[pid], p = Geo.provinces[pid];
      for (const key of ['icbm', 'srbm', 'cruise']) {
        if (pr.msl[key] <= 0) continue;
        const M = MISSILES[key];
        let best = null, bs = 0;
        // Best cluster of visible enemy units within range.
        for (const u of seen) {
          if (U.dist(p.x, p.y, u.x, u.y) > M.r) continue;
          const v = Game.hash.query(u.x, u.y, M.aoe, []).filter((o) => Game.hostile(me, o.s)).reduce((s, o) => s + UNIT_TYPES[o.t].cost.m, 0);
          if (v > bs) { bs = v; best = [u.x, u.y]; }
        }
        if ((!best || bs < 1200 || M.strategic) && enemy.length) {
          const q = enemy.map((e) => Geo.provinces[e]).filter((e) => U.dist(p.x, p.y, e.x, e.y) <= M.r).sort((a, b) => S.prov[b.id].lvl - S.prov[a.id].lvl)[0];
          if (q && (!best || M.strategic)) best = [q.x, q.y];
        }
        // On Hard the AI arms valuable strikes with a nuclear warhead when it has one.
        const nuke = best && S.diff === 'hard' && S.side[me].nukes > 0 && (bs > 4000 || M.strategic) && Math.random() < 0.5;
        if (best) { Game.launchMissile(me, key, p.x, p.y, best[0], best[1], { pid }, nuke); return; }
      }
    }
  },
};
