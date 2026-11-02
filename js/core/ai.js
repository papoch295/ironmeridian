// AI commanders: one per country at war (except the player's). Each runs its own economy, recruitment, defense,
// offensive waves, air force, navy and missile strikes against every faction it is at war with.
// Allies of the player play on "normal" settings; factions hostile to the player use the chosen difficulty.
'use strict';

const AI_MIX = {
  barracks: { inf: 4, at: 2, recon: 0.8, mortar: 1, eng: 1, medic: 0.5, sniper: 0.5, seal: 0.5 },
  factory: { ifv: 3, mbt: 3, apc: 1, lt: 1, aa: 1.5, arty: 1, spg: 1, mlrs: 1, td: 1, truck: 0.4, tbm: 0.4 },
  airfield: { ahelo: 2, jet: 2, thelo: 0.3, bomber: 0.5 },
  shipyard: { corv: 1, sub: 1, dd: 1 },
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
      this.economy(S, Dk, k, mine, mu);
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

  economy(S, D, me, mine, mu) {
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
    if (mu.length >= Math.max(4, Math.round(D.cap * Geo.byKey[me].power / 12 * ffa))) return;
    for (const pid of mine) {
      const pr = S.prov[pid];
      if (pr.q.length || pr.cap) continue;
      const blds = ['factory', 'barracks', 'airfield', 'shipyard'].filter((b) => pr.b[b]);
      if (!blds.length) continue;
      const b = blds[Math.floor(Math.random() * blds.length)];
      const key = this.pickWeighted(AI_MIX[b], (k) => !Game.canQueue(pid, 'unit', k));
      if (key && side.m - UNIT_TYPES[key].cost.m > 500) Game.queue(pid, 'unit', key);
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
    const O = A.off || (A.off = { ph: 'wait', t: Math.max(S.t + 60, D.grace) });
    const used = new Set(O.ph === 'gather' ? O.ids : []);
    const free = land.filter((u) => !u.ord || u.ord.ai === 'wave-done');
    for (const th of threatened.slice(0, 4)) {
      const p = Geo.provinces[th.pid];
      const helpers = free.filter((u) => !used.has(u.id) && U.dist(u.x, u.y, p.x, p.y) < 6)
        .sort((a, b) => U.dist2(a.x, a.y, p.x, p.y) - U.dist2(b.x, b.y, p.x, p.y)).slice(0, Math.min(8, th.n + 2));
      helpers.forEach((u) => used.add(u.id));
      if (helpers.length) Game.order(helpers, { k: 'amove', x: p.x, y: p.y });
    }
    this.offensive(S, D, me, mine, enemy, land, heli, free.filter((u) => !used.has(u.id)), O);
    // Units that arrived but the province still stands: push into the city center.
    for (const u of land) if (u.ord && u.ord.ai === 'wave' && !u.path && !u.tgt) u.ord.ai = 'wave-done';
  },

  // Offensives follow a fixed rhythm so the player can learn them: every D.offEvery seconds the troops first gather
  // at a staging province for D.gather seconds, then attack together. The main axis keeps its direction until its
  // target falls (the next target is the one closest to it); a smaller secondary push hits a different target.
  // Between offensives the AI only defends. A gathering that the player's side can see raises a warning.
  offensive(S, D, me, mine, enemy, land, heli, pool, O) {
    if (O.ph === 'wait') {
      if (S.t < O.t || pool.length < 3) return;
      const prev = O.main != null && Game.hostile(me, S.prov[O.main].o) ? O.main : null;
      const main = prev ?? this.pickTarget(S, mine, enemy, land, O.main != null ? Geo.provinces[O.main] : null);
      if (main === null) { O.t = S.t + 30; return; }
      const mp = Geo.provinces[main];
      const sideT = pool.length >= 8 ? this.pickSideTarget(S, mine, enemy, main) : null;
      // Keep a small garrison at home; a quarter of the force goes to the secondary axis.
      const force = pool.sort((a, b) => U.dist2(a.x, a.y, mp.x, mp.y) - U.dist2(b.x, b.y, mp.x, mp.y)).slice(0, Math.max(3, Math.floor(pool.length * 0.8)));
      const sideN = sideT === null ? 0 : Math.floor(force.length * 0.25);
      const sideU = force.splice(force.length - sideN, sideN);
      const st = this.stagingPoint(mine, mp, force), ss = sideT === null ? null : this.stagingPoint(mine, Geo.provinces[sideT], sideU);
      Object.assign(O, { ph: 'gather', t: S.t + D.gather, next: S.t + D.offEvery, main, side: sideT, sx: st[0], sy: st[1],
        ssx: ss && ss[0], ssy: ss && ss[1], ids: force.map((u) => u.id), sids: sideU.map((u) => u.id), warned: false });
      Game.order(force, { k: 'amove', x: st[0], y: st[1], coh: 1 });
      if (sideU.length) Game.order(sideU, { k: 'amove', x: ss[0], y: ss[1], coh: 1 });
      return;
    }
    const units = (ids) => ids.map((id) => Game.unit(id)).filter((u) => u && !u.inside);
    if (O.ph === 'gather') {
      // Warning when the player or an ally can see any of the gathering troops and the target is on their side.
      if (!O.warned && Game.hostile(me, S.player) && [O.main, O.side].some((p) => p != null && Game.allied(S.prov[p].o, S.player))
        && units(O.ids.concat(O.sids)).some((u) => Sim.sees(S.player, u))) {
        O.warned = true;
        Game.emit('aiGather', { k: me, x: O.sx, y: O.sy, pid: O.main });
      }
      if (S.t < O.t) return;
      // Attack: targets that fell in the meantime are replaced by the nearest hostile province.
      for (const key of ['main', 'side']) if (O[key] != null && !Game.hostile(me, S.prov[O[key]].o)) O[key] = this.nearestEnemy(enemy, Geo.provinces[O[key]]);
      const go = (us, pid) => {
        if (pid == null || !us.length) return;
        const p = Geo.provinces[pid];
        Game.order(us, { k: 'amove', x: p.x, y: p.y });
        us.forEach((u) => { if (u.ord) u.ord.ai = 'wave'; });
      };
      go(units(O.ids), O.main);
      go(units(O.sids), O.side ?? O.main);
      const h = heli.filter((u) => !u.ord);
      if (h.length && O.main != null) Game.order(h, { k: 'amove', x: Geo.provinces[O.main].x, y: Geo.provinces[O.main].y });
      O.ph = 'attack';
      O.t = S.t + 180;
      return;
    }
    // Attack phase: the arrow stays on the map until the push is over, then the AI waits for its next offensive.
    if (S.t >= O.t || O.main == null || !Game.hostile(me, S.prov[O.main].o)) Object.assign(O, { ph: 'wait', t: Math.max(O.next, S.t + 30), ids: [], sids: [], warned: false });
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
    for (const c of scored.slice(0, 4)) {
      const p = Geo.provinces[c.pid];
      if (Path.find(cx, cy, p.x, p.y, 'land', Game.bell, 120000)) return c.pid;
    }
    return scored.length ? scored[0].pid : null;
  },

  air(S, D, me, mine, enemy, mu) {
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
