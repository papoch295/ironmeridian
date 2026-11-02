// Real-time simulation: movement, targeting, combat, aircraft, capture, support and victory.
'use strict';

const Sim = {
  DT: 0.1,
  near: [],
  near2: [],

  step(dt) {
    const S = Game.state;
    if (!S || S.over) return;
    S.t += dt;
    const h = Game.hash;
    h.clear();
    for (const u of S.units) if (!u.inside && !(u.air && u.air.st === 'ground')) h.insert(u);
    const half = Math.floor(S.t * 2) !== Math.floor((S.t - dt) * 2);
    const sec = Math.floor(S.t) !== Math.floor(S.t - dt);
    if (half) { this.visibility(); this.provinces(0.5); }
    for (const u of S.units.slice()) if (Game.byId.has(u.id)) this.updateUnit(u, dt);
    this.resolveShots();
    this.resolveMissiles();
    if (sec) this.support(1);
    Game.productionStep(dt);
    if (Math.floor(S.t / 10) !== Math.floor((S.t - dt) / 10)) Game.economyTick(10 / 60);
    AI.update(dt);
    if (Math.floor(S.t / 2) !== Math.floor((S.t - dt) / 2)) this.checkEnd();
    if (this.fxClean++ > 50) { this.fxClean = 0; Game.fx = Game.fx.filter((f) => S.t - f.t0 < (f.dur || 1) + 0.5); }
  },
  fxClean: 0,

  cls(u) { return u.emb ? 'ship' : UNIT_TYPES[u.t].cls; },
  inFallout(p) {
    const S = Game.state, F = S.fallout;
    if (!F || !F.length) return false;
    for (const f of F) if (f.until > S.t && U.dist2(p.x, p.y, f.x, f.y) < f.r * f.r) return true;
    return false;
  },
  isAir(u) { return UNIT_TYPES[u.t].dom === 'air'; },
  // Vision is shared within a team: u.vm holds one bit per team that currently sees the unit.
  sees(side, u) { return u.s === side || (u.vm & Game.vbit(side)) !== 0; },

  // ---------- Visibility (fog of war) ----------
  visibility() {
    const S = Game.state, h = Game.hash, near = this.near;
    for (const e of S.units) {
      if (e.inside) continue;
      const T = UNIT_TYPES[e.t];
      e.vm = Game.vbit(e.s);
      if (e.air && e.air.st === 'ground') continue;
      const stealth = e.rev > S.t ? T.st * 0.3 : T.st;
      const isSub = T.cls === 'sub';
      h.query(e.x, e.y, 2.6, near);
      for (const o of near) {
        const ob = Game.vbit(o.s);
        if (e.vm & ob || Game.allied(o.s, e.s)) continue;
        const OT = UNIT_TYPES[o.t];
        let r = OT.vis * (1 - stealth * 0.6);
        if (isSub) r = OT.w.includes('asw') || OT.w.includes('torpedo') ? OT.vis * 0.55 : 0;
        if (U.dist2(o.x, o.y, e.x, e.y) <= r * r) e.vm |= ob;
      }
    }
    // Owned provinces see their surroundings.
    const owned = new Set();
    S.prov.forEach((pr, pid) => {
      if (!pr.o) return;
      owned.add(pr.o);
      if (!Game.act[pr.o]) return; // countries at peace do not need to spot anyone
      // Radar stations widen a province's view; infantry stays hard to spot, submarines invisible.
      const p = Geo.provinces[pid], bit = Game.vbit(pr.o), R = RADAR_RANGE[pr.b.radar || 0];
      h.query(p.x, p.y, R, near);
      for (const e of near) {
        const ET = UNIT_TYPES[e.t];
        if (e.vm & bit || ET.cls === 'sub' || Game.allied(e.s, pr.o)) continue;
        const r = (ET.cls === 'soft' ? Math.max(1.1, R * 0.5) : R) * (1 - ET.st * 0.5);
        if (U.dist(p.x, p.y, e.x, e.y) <= r) e.vm |= bit;
      }
    });
    // A faction without territory has nowhere to hide.
    for (const u of S.units) if (!owned.has(u.s)) u.vm = 0x7fffffff;
  },

  // ---------- Units ----------
  updateUnit(u, dt) {
    const S = Game.state, T = UNIT_TYPES[u.t];
    if (u.inside) {
      const tr = Game.unit(u.inside);
      if (!tr) { Game.removeUnit(u); return; }
      u.x = tr.x; u.y = tr.y;
      return;
    }
    for (let i = 0; i < u.cd.length; i++) if (u.cd[i] > 0) u.cd[i] -= dt;
    if (u.strikeCd > 0) u.strikeCd -= dt;
    if (S.t - u.lastHit > 3 && u.sup > 0) u.sup = Math.max(0, u.sup - (u.rout ? 14 : 8) * dt);
    if (u.rout > 0) { u.rout -= dt; if (u.rout <= 0) u.rout = 0; }
    else if (T.cls === 'soft' && u.sup >= 95) {
      u.rout = 8; Game.retreat(u);
      if (u.s === S.player) Game.emit('rout', u);
    }
    if (u.air) { this.plane(u, dt, T); return; }
    u.rt -= dt;
    if (u.rt <= 0) { u.rt = 0.5 + Math.random() * 0.1; this.acquire(u, T); }
    const o = u.ord;
    let moveOk = true;
    if (o) {
      if (o.k === 'amove' && this.engaged(u, T)) moveOk = false;
      else if (o.k === 'attack') moveOk = this.attackStep(u, T, o);
      else if (o.k === 'load') moveOk = this.loadStep(u, o);
    }
    if (moveOk && u.path) {
      let spd = T.spd;
      if (T.dom === 'land') {
        if (u.emb) spd = 0.1;
        else if (o && o.k === 'fast') spd *= 1.4;
        if (o && o.cap && !u.emb) spd = Math.min(spd, o.cap * (o.k === 'fast' ? 1.4 : 1));
        if (T.cls === 'soft' && u.sup > 50) spd *= 0.55;
        if (u.rout) spd *= 1.15;
      }
      if (this.follow(u, dt, spd)) {
        if (o && (o.k === 'move' || o.k === 'fast' || o.k === 'amove')) {
          if (o.retreat) u.rout = 0;
          u.ord = null;
          if (o.unload && u.cargo.length && Game.unload(u) && u.s === S.player) Game.emit('unloaded', u);
        }
      }
      if (T.dom === 'land') {
        const c = Geo.cellOf(u.x, u.y);
        const wasEmb = u.emb;
        u.emb = Geo.gc[c] < 0;
        if (u.emb && !wasEmb) u.sup = 0;
      }
    } else u.mv = false;
    for (const id of u.cargo) { const c = Game.unit(id); if (c) { c.x = u.x; c.y = u.y; } }
    const fast = o && o.k === 'fast';
    if (!fast && !u.emb && !u.rout && u.stance !== 'hold') this.fire(u, T);
  },

  follow(u, dt, spd) {
    let step = spd * dt;
    u.mv = true;
    while (u.path && step > 0) {
      const tx = u.path[u.pi], ty = u.path[u.pi + 1], d = U.dist(u.x, u.y, tx, ty);
      if (d > 1e-6) u.hd = Math.atan2(ty - u.y, tx - u.x);
      if (d <= step) {
        u.x = tx; u.y = ty; step -= d; u.pi += 2;
        if (u.pi >= u.path.length) { u.path = null; u.mv = false; return true; }
      } else { u.x += (tx - u.x) / d * step; u.y += (ty - u.y) / d * step; step = 0; }
    }
    return false;
  },

  attackStep(u, T, o) {
    const t = Game.unit(o.id);
    if (!t || t.inside) { u.ord = null; u.path = null; return false; }
    if (!this.sees(u.s, t) && Game.state.t - o.rp > 20) { u.ord = null; return false; }
    u.tgt = t.id;
    if (this.inRangeOf(u, T, t)) { u.path = null; return false; }
    if (Game.state.t - o.rp > 3 && U.dist(t.x, t.y, o.x, o.y) > 0.3) {
      o.rp = Game.state.t; o.x = t.x; o.y = t.y;
      Game.planPath(u, t.x, t.y);
      if (u.ord) u.ord = o;
    }
    return true;
  },

  loadStep(u, o) {
    const tr = Game.unit(o.id);
    if (!tr || !Game.canCarry(tr, u)) { u.ord = null; u.path = null; return false; }
    const parked = tr.air && tr.air.st === 'ground';
    if (U.dist(u.x, u.y, tr.x, tr.y) < (parked ? 0.8 : 0.22)) { Game.board(u, tr); return false; }
    if (!u.path || (!parked && U.dist(u.path[u.path.length - 2], u.path[u.path.length - 1], tr.x, tr.y) > 0.3)) {
      Game.planPath(u, tr.x, tr.y);
      if (u.ord === null) return false;
      u.ord = o;
    }
    return true;
  },

  weaponsFor(T) { return T.w.map((k) => W[k]); },

  canHit(w, cls, d) { return (w.dmg[cls] || 0) > 0 && d <= w.r && d >= (w.minR || 0); },

  inRangeOf(u, T, t) {
    const cls = this.cls(t), d = U.dist(u.x, u.y, t.x, t.y);
    return T.w.some((k, i) => this.canHit(W[k], cls, d) && (!W[k].ammo || u.ammo[i] >= 1));
  },

  engaged(u, T) {
    const t = u.tgt && Game.unit(u.tgt);
    if (t && this.inRangeOf(u, T, t)) return true;
    if (u.tgtP !== null && u.tgtP !== undefined) {
      const p = Geo.provinces[u.tgtP];
      return U.dist(u.x, u.y, p.x, p.y) <= this.groundRange(u, T);
    }
    return false;
  },

  groundRange(u, T) {
    let r = 0;
    T.w.forEach((k, i) => { const w = W[k]; if ((w.dmg.soft || w.dmg.light) && (!w.ammo || u.ammo[i] >= 1)) r = Math.max(r, w.r); });
    return r;
  },

  acquire(u, T, extra = 0) {
    const S = Game.state;
    if (!T.w.length || u.inside) { u.tgt = null; return; }
    if (u.stance === 'return' && S.t - u.lastHit > 8) { u.tgt = null; u.tgtP = null; return; }
    let maxR = 0;
    T.w.forEach((k, i) => { if (!W[k].ammo || u.ammo[i] >= 1) maxR = Math.max(maxR, W[k].r); });
    if (!maxR) { u.tgt = null; return; }
    const R = maxR + extra;
    const near = Game.hash.query(u.x, u.y, R, this.near2);
    let best = null, bs = -1;
    for (const t of near) {
      if (!Game.hostile(u.s, t.s) || !this.sees(u.s, t)) continue;
      const cls = this.cls(t), d = U.dist(u.x, u.y, t.x, t.y);
      let eff = 0;
      T.w.forEach((k, i) => {
        const w = W[k];
        if ((w.dmg[cls] || 0) > 0 && d >= (w.minR || 0) && d <= w.r + extra && (!w.ammo || u.ammo[i] >= 1)) eff = Math.max(eff, w.dmg[cls]);
      });
      if (!eff) continue;
      const score = eff / (0.3 + d) * (t.id === u.tgt ? 1.3 : 1) * (t.id === u.lastAtk ? 1.2 : 1);
      if (score > bs) { bs = score; best = t; }
    }
    if (u.ord && u.ord.k === 'attack' && Game.unit(u.ord.id)) best = Game.unit(u.ord.id);
    u.tgt = best ? best.id : null;
    u.tgtP = null;
    // AI factions leave the provinces of the player's team alone during the opening grace period.
    const grace = S.t < DIFFICULTY[S.diff].grace && !Game.allied(u.s, S.player);
    const ok = (pr) => Game.hostile(u.s, pr.o) && pr.def > 0 && !(grace && Game.allied(pr.o, S.player));
    if (!best) {
      // No units around: shell the enemy garrison of a nearby province.
      const gr = this.groundRange(u, T);
      if (gr > 0) {
        const p = Geo.provinceAt(u.x, u.y);
        const cands = p ? Geo.countries[p.country].provinces : [];
        for (const pid of cands) {
          const pr = S.prov[pid], q = Geo.provinces[pid];
          if (ok(pr) && U.dist(u.x, u.y, q.x, q.y) <= gr) { u.tgtP = pid; break; }
        }
        if (u.tgtP === null) {
          // Also check provinces just across a border.
          for (const pid of this.provsNear(u.x, u.y, gr)) if (ok(S.prov[pid])) { u.tgtP = pid; break; }
        }
      }
    }
  },

  provsNear(x, y, r) {
    if (!this.provIndex) {
      this.provIndex = new SpatialHash(2);
      for (const p of Geo.provinces) if (Game.bell[p.country]) this.provIndex.insert(p);
    }
    return this.provIndex.query(x, y, r, []).map((p) => p.id);
  },

  fire(u, T) {
    const S = Game.state;
    const t = u.tgt ? Game.unit(u.tgt) : null;
    for (let i = 0; i < T.w.length; i++) {
      if (u.cd[i] > 0) continue;
      const w = W[T.w[i]];
      if (w.ammo && u.ammo[i] < 1) continue;
      let target = null;
      if (t && this.canHit(w, this.cls(t), U.dist(u.x, u.y, t.x, t.y))) target = t;
      else if (w.aa || !t) {
        // Secondary weapons (e.g. air defense on a destroyer) pick their own target.
        const near = Game.hash.query(u.x, u.y, w.r, this.near2);
        for (const e of near) if (Game.hostile(u.s, e.s) && this.sees(u.s, e) && this.canHit(w, this.cls(e), U.dist(u.x, u.y, e.x, e.y))) { target = e; break; }
      }
      if (target) { this.shoot(u, w, i, target.x, target.y, target); continue; }
      if (u.tgtP !== null && u.tgtP !== undefined && (w.dmg.soft || w.dmg.light) && !w.aa) {
        const p = Geo.provinces[u.tgtP], pr = S.prov[u.tgtP];
        if (Game.hostile(u.s, pr.o) && pr.def > 0 && U.dist(u.x, u.y, p.x, p.y) <= w.r) this.shoot(u, w, i, p.x, p.y, null, u.tgtP);
      }
    }
  },

  shoot(u, w, i, tx, ty, target, pid) {
    const S = Game.state, T = UNIT_TYPES[u.t];
    u.cd[i] = w.rof * (0.85 + Math.random() * 0.3);
    if (w.ammo) u.ammo[i]--;
    u.rev = S.t + (T.st > 0.6 ? 1.5 : 4);
    u.lf = S.t;
    const d = U.dist(u.x, u.y, tx, ty);
    Game.fx.push({ k: w.fx, x0: u.x, y0: u.y, x1: tx, y1: ty, t0: S.t, dur: w.indirect || w.fx === 'missile' ? Math.max(0.4, d / (w.fx === 'missile' ? 2.5 : 1.6)) : 0.15, side: u.s });
    Game.emit('shot', { w, x: u.x, y: u.y, u });
    const firepower = T.cls === 'soft' && T.men ? 0.4 + 0.6 * u.hp / T.hp : 1;
    let acc = w.acc * (u.sup > 60 ? 0.55 : 1) * (u.mv && !T.heli && !T.plane ? 0.8 : 1);
    if (target && target.mv && !w.indirect) acc *= 0.85;
    if (w.aoe) {
      const miss = Math.random() > acc;
      const sc = miss ? 0.08 + Math.random() * 0.25 : Math.random() * 0.04;
      const a = Math.random() * Math.PI * 2;
      const delay = w.indirect || w.fx === 'missile' || w.fx === 'bomb' ? Math.max(0.4, d / (w.fx === 'missile' ? 2.5 : 1.6)) : 0.1;
      S.shots.push({ t: S.t + delay, x: tx + Math.cos(a) * sc, y: ty + Math.sin(a) * sc, side: u.s, w: T.w[i], src: u.id, k: firepower });
      return;
    }
    if (pid !== undefined && pid !== null) { this.hitProvince(pid, (w.dmg.light || w.dmg.soft) * 0.5 * firepower, u.s); return; }
    if (Math.random() < acc && target) this.hitUnit(target, w, u, firepower);
  },

  hitUnit(t, w, attacker, mult) {
    const S = Game.state, cls = this.cls(t);
    const base = w.dmg ? w.dmg[cls] || 0 : 0;
    if (!base) return;
    let dmg = base * (0.8 + Math.random() * 0.4) * (mult || 1);
    if (attacker) dmg *= Game.eK(attacker.s);
    if (cls === 'soft' && this.inCover(t)) dmg *= 0.7;
    if (t.emb) dmg *= 1.5;
    t.hp -= dmg;
    t.sup = Math.min(100, t.sup + (w.sup || 5) * (cls === 'soft' ? 1 : 0.5));
    t.lastHit = S.t;
    if (attacker) t.lastAtk = attacker.id;
    if (t.hp <= 0) this.kill(t, attacker);
    else if (t.s === S.player) Game.emit('underFire', t);
  },

  inCover(u) {
    const p = Geo.provinceAt(u.x, u.y);
    return p && Game.allied(Game.state.prov[p.id].o, u.s) && U.dist(u.x, u.y, p.x, p.y) < 0.6;
  },

  hitProvince(pid, dmg, side) {
    const pr = Game.state.prov[pid];
    if (!Game.hostile(side, pr.o)) return;
    dmg *= Game.eK(side);
    pr.def = Math.max(0, pr.def - dmg);
    pr.calm = 0;
  },

  kill(t, killer) {
    const S = Game.state, T = UNIT_TYPES[t.t];
    Game.fx.push({ k: 'boom', x0: t.x, y0: t.y, t0: S.t, dur: T.cls === 'soft' ? 0.6 : 1.4, big: T.cls !== 'soft', side: t.s });
    for (const id of t.cargo) {
      const c = Game.unit(id);
      if (!c) continue;
      if (!T.plane && !t.emb && Geo.isLand(t.x, t.y)) { c.inside = null; c.hp *= 0.5; c.x = t.x + (Math.random() - 0.5) * 0.1; c.y = t.y + (Math.random() - 0.5) * 0.1; }
      else { S.side[c.s].losses++; Game.removeUnit(c); }
    }
    t.cargo = [];
    S.side[t.s].losses++;
    if (killer) { S.side[killer.s].kills++; killer.kills++; }
    Game.removeUnit(t);
    Game.emit('killed', { u: t, killer });
  },

  // ---------- Aircraft ----------
  plane(u, dt, T) {
    const S = Game.state, a = u.air;
    const baseOk = (pid) => pid !== null && S.prov[pid].o === u.s && S.prov[pid].b.airfield > 0;
    if (!baseOk(a.base)) {
      const nb = Game.nearestOwnProvince(u.x, u.y, u.s, true, (pr) => pr.b.airfield > 0);
      if (nb) a.base = nb.id;
      else if (a.st === 'ground') { S.side[u.s].losses++; Game.removeUnit(u); return; }
      else a.base = null;
    }
    if (a.st === 'ground') {
      const b = Geo.provinces[a.base];
      u.x = b.x; u.y = b.y; u.mv = false;
      a.fuel = Math.min(T.fuel || 400, a.fuel + (T.fuel || 400) * dt / 25);
      u.hp = Math.min(T.hp, u.hp + 2 * dt);
      T.w.forEach((k, i) => { if (W[k].ammo) u.ammo[i] = Math.min(W[k].ammo, u.ammo[i] + W[k].ammo * dt / 25); });
      return;
    }
    a.fuel -= dt;
    if (a.fuel <= 0) {
      Game.fx.push({ k: 'boom', x0: u.x, y0: u.y, t0: S.t, dur: 1.2, big: 1 });
      S.side[u.s].losses++;
      for (const id of u.cargo) { const c = Game.unit(id); if (c) Game.removeUnit(c); }
      Game.removeUnit(u);
      if (u.s === S.player) Game.emit('crash', u);
      return;
    }
    const base = a.base !== null ? Geo.provinces[a.base] : null;
    const combat = T.w.length > 0;
    const o = u.ord;
    const outOfAmmo = combat && !(o && o.k === 'nuke') && T.w.every((k, i) => W[k].ammo && u.ammo[i] < 1);
    if (base && (!o || o.k !== 'rtb')) {
      const need = U.dist(u.x, u.y, base.x, base.y) / T.spd + 4;
      if (a.fuel < need || outOfAmmo) u.ord = { k: 'rtb' };
    }
    const ord = u.ord;
    if (ord && ord.k === 'rtb') {
      if (!base) { this.orbit(u, dt, T, u.x, u.y); return; }
      if (this.flyTo(u, dt, T.spd, base.x, base.y, 0.05)) this.land(u, a.base);
      return;
    }
    // Nuclear strike: fly straight to the target, ignore everything else.
    if (ord && ord.k === 'nuke') {
      if (this.flyTo(u, dt, T.spd, ord.x, ord.y, 0.1)) { u.nuke = 0; this.nuke(u.s, ord.x, ord.y); u.ord = { k: 'rtb' }; }
      return;
    }
    // Combat aircraft hunt targets near their patrol point.
    u.rt -= dt;
    if (combat && u.rt <= 0) { u.rt = 0.5; if (u.stance !== 'hold') this.acquire(u, T, ord && ord.k === 'move' ? 0 : T.vis * 1.3); }
    const t = u.tgt ? Game.unit(u.tgt) : null;
    if (ord && ord.k === 'attack') {
      const tt = Game.unit(ord.id);
      if (!tt) u.ord = null; else u.tgt = tt.id;
    }
    const tgt = u.tgt ? Game.unit(u.tgt) : t;
    if (tgt && combat && (!ord || ord.k !== 'move' || this.inRangeOf(u, T, tgt))) {
      const d = U.dist(u.x, u.y, tgt.x, tgt.y);
      if (d > 0.25) this.flyTo(u, dt, T.spd, tgt.x, tgt.y, 0);
      else this.orbit(u, dt, T, tgt.x, tgt.y);
      this.fire(u, T);
      return;
    }
    if (u.tgtP !== null && u.tgtP !== undefined && combat) {
      const p = Geo.provinces[u.tgtP];
      if (U.dist(u.x, u.y, p.x, p.y) > 0.3) this.flyTo(u, dt, T.spd, p.x, p.y, 0); else this.orbit(u, dt, T, p.x, p.y);
      this.fire(u, T);
      return;
    }
    if (ord && (ord.k === 'move' || ord.k === 'amove' || ord.k === 'fast' || ord.k === 'drop')) {
      if (ord.k === 'drop' && U.dist(u.x, u.y, ord.x, ord.y) < 0.3) { this.drop(u); u.ord = { k: 'rtb' }; return; }
      if (U.dist(u.x, u.y, ord.x, ord.y) > 0.08) { this.flyTo(u, dt, T.spd, ord.x, ord.y, 0); return; }
      if (T.cap) {
        // Transport aircraft land at a friendly airfield near the destination and unload.
        const ap = Game.nearestOwnProvince(ord.x, ord.y, u.s, true, (pr) => pr.b.airfield > 0);
        if (ap && U.dist(ap.x, ap.y, ord.x, ord.y) < 1.0) { a.base = ap.id; u.ord = { k: 'rtb' }; return; }
        // No airfield there: paratroopers jump, everyone else flies back.
        if (ord.unload && u.cargo.length) { this.drop(u); u.ord = { k: 'rtb' }; return; }
      }
      ord.hold = ord.hold || 1;
      this.orbit(u, dt, T, ord.x, ord.y);
      return;
    }
    this.orbit(u, dt, T, u.ox ?? u.x, u.oy ?? u.y);
  },

  flyTo(u, dt, spd, x, y, eps) {
    const d = U.dist(u.x, u.y, x, y), step = spd * dt;
    u.mv = true; u.ox = undefined;
    if (d <= Math.max(step, eps)) { u.x = x; u.y = y; return true; }
    u.hd = Math.atan2(y - u.y, x - u.x);
    u.x += (x - u.x) / d * step; u.y += (y - u.y) / d * step;
    return false;
  },

  orbit(u, dt, T, cx, cy) {
    if (u.ox === undefined) { u.ox = cx; u.oy = cy; }
    u.ox = cx; u.oy = cy;
    const r = 0.3, w = T.spd / r * 0.6;
    u.oa = (u.oa ?? Math.atan2(u.y - cy, u.x - cx)) + w * dt;
    const tx = cx + Math.cos(u.oa) * r, ty = cy + Math.sin(u.oa) * r;
    u.hd = u.oa + Math.PI / 2;
    u.x += (tx - u.x) * Math.min(1, dt * 3); u.y += (ty - u.y) * Math.min(1, dt * 3);
    u.mv = true;
  },

  land(u, pid) {
    u.air.st = 'ground'; u.air.base = pid; u.ord = null; u.path = null; u.tgt = null; u.ox = undefined;
    if (u.cargo.length) Game.unload(u, true);
  },

  drop(u) {
    const keep = [];
    for (const id of u.cargo) {
      const c = Game.unit(id);
      if (!c) continue;
      if (UNIT_TYPES[c.t].airdrop && Geo.isLand(u.x, u.y)) {
        c.inside = null; c.x = u.x + (Math.random() - 0.5) * 0.25; c.y = u.y + (Math.random() - 0.5) * 0.25;
        Game.fx.push({ k: 'chute', x0: c.x, y0: c.y, t0: Game.state.t, dur: 2.5 });
      } else keep.push(id);
    }
    u.cargo = keep;
  },

  // ---------- Impacts ----------
  resolveShots() {
    const S = Game.state;
    if (!S.shots.length) return;
    const rest = [];
    for (const s of S.shots) {
      if (s.t > S.t) { rest.push(s); continue; }
      const w = s.w === 'strike' ? { dmg: { soft: 40, light: 80, armor: 70, ship: 140 }, aoe: 0.35, sup: 60 } : W[s.w];
      const src = Game.unit(s.src);
      const k = !src ? Game.eK(s.side) : 1;
      this.areaDamage(s.x, s.y, w.aoe || 0.15, s.side, (t, f) => this.hitUnit(t, w, src, f * (s.k || 1) * k), w.aa);
      Game.fx.push({ k: 'boom', x0: s.x, y0: s.y, t0: S.t, dur: 0.9, big: w.aoe >= 0.25, side: s.side });
      Game.emit('impact', s);
      for (const pid of this.provsNear(s.x, s.y, (w.aoe || 0.1) + 0.3)) this.hitProvince(pid, (w.dmg.light || w.dmg.soft || 0) * 0.8, s.side);
    }
    S.shots = rest;
  },

  areaDamage(x, y, r, side, fn, hitsAir) {
    const near = Game.hash.query(x, y, r, []);
    for (const t of near) {
      if (!Game.hostile(side, t.s) || (this.isAir(t) && !hitsAir)) continue;
      const d = U.dist(x, y, t.x, t.y);
      fn(t, 1 - (d / r) * 0.6);
    }
  },

  resolveMissiles() {
    const S = Game.state;
    if (!S.missiles.length) return;
    S.missiles = S.missiles.filter((m) => {
      if (S.t < m.t0 + m.dur) return true;
      const M = MISSILES[m.key];
      // Air defense near the impact point (units and province air defense sites) may intercept the missile.
      let pass = 1;
      for (const u of Game.hash.query(m.tx, m.ty, 3, [])) {
        const ic = UNIT_TYPES[u.t].intercept;
        if (ic && Game.hostile(u.s, m.side)) pass *= 1 - Math.min(0.9, ic * M.intercept * 0.5);
      }
      for (const pid of this.provsNear(m.tx, m.ty, 2.5)) {
        const pr = S.prov[pid], A = AAD_LEVELS[pr.b.aad || 0], q = Geo.provinces[pid];
        if (A && Game.hostile(pr.o, m.side) && U.dist(q.x, q.y, m.tx, m.ty) <= A.r) pass *= 1 - Math.min(0.9, A.ic * M.intercept * 0.5);
      }
      if (Math.random() > Math.max(0.15, pass)) {
        Game.fx.push({ k: 'boom', x0: U.lerp(m.sx, m.tx, 0.92), y0: U.lerp(m.sy, m.ty, 0.92), t0: S.t, dur: 1, big: 1 });
        Game.emit('intercepted', m);
        return false;
      }
      if (m.nuke) { this.nuke(m.side, m.tx, m.ty); Game.emit('missileHit', m); return false; }
      const w = { dmg: { soft: M.dmg, light: M.dmg, armor: M.dmg * 0.8, ship: M.dmg, sub: M.dmg * 0.4, heli: M.dmg * 0.5 }, sup: 100 };
      const k = Game.eK(m.side);
      this.areaDamage(m.tx, m.ty, M.aoe, m.side, (t, f) => this.hitUnit(t, w, null, f * k));
      for (const pid of this.provsNear(m.tx, m.ty, M.aoe + 0.3)) {
        this.hitProvince(pid, M.dmg, m.side);
        const pr = S.prov[pid];
        if (M.strategic && Game.hostile(pr.o, m.side)) {
          pr.lvl = Math.max(1, pr.lvl - 1);
          for (const b in pr.b) if (pr.b[b] > 0) pr.b[b]--;
          pr.def = Math.min(pr.def, Game.maxDef(pid));
        }
      }
      Game.fx.push({ k: 'boom', x0: m.tx, y0: m.ty, t0: S.t, dur: M.strategic ? 4 : 2, big: 1, huge: M.strategic ? M.aoe : 0 });
      Game.emit('missileHit', m);
      return false;
    });
  },

  // Nuclear detonation: destroys enemy units in the blast radius (aircraft included), wrecks enemy provinces
  // and leaves fallout that blocks income and production and slowly harms ground troops of both sides.
  nuke(side, x, y) {
    const S = Game.state, R = NUKE.r, D = NUKE.dmg;
    const w = { dmg: { soft: D, light: D, armor: D, ship: D, sub: D * 0.5, heli: D, air: D * 0.6 }, sup: 100 };
    this.areaDamage(x, y, R, side, (t, f) => this.hitUnit(t, w, null, f), true);
    const hit = new Set();
    for (const pid of this.provsNear(x, y, R + 0.3)) {
      const pr = S.prov[pid], q = Geo.provinces[pid];
      if (!Game.hostile(side, pr.o) || U.dist(q.x, q.y, x, y) > R + 0.3) continue;
      hit.add(pid);
      pr.lvl = Math.max(1, pr.lvl - 2);
      for (const b in pr.b) if (pr.b[b] > 0) pr.b[b]--;
      pr.q = []; pr.def = 0; pr.calm = 0;
      for (const k in pr.msl) pr.msl[k] = 0;
    }
    // Aircraft parked on the destroyed airfields burn with them.
    for (const u of S.units.slice()) if (u.air && u.air.st === 'ground' && Game.hostile(side, u.s) && hit.has(u.air.base)) this.kill(u, null);
    S.fallout = S.fallout || [];
    S.fallout.push({ x, y, r: NUKE.falloutR, until: S.t + NUKE.fallout, side });
    Game.fx.push({ k: 'boom', x0: x, y0: y, t0: S.t, dur: 5, big: 1, huge: R, nuke: 1 });
    Game.emit('nuke', { side, x, y });
    Render.dirty = true; Render.dirtyMini = true;
  },

  // ---------- Provinces: garrison fire, air defense, capture, regeneration ----------
  provinces(dt) {
    const S = Game.state, near = this.near;
    S.prov.forEach((pr, pid) => {
      if (!pr.o) return;
      // Countries at peace cannot be attacked: only their garrison regenerates.
      if (!Game.act[pr.o]) { pr.calm = (pr.calm || 0) + dt; if (pr.calm > 8) pr.def = Math.min(Game.maxDef(pid), pr.def + 3 * dt); return; }
      const p = Geo.provinces[pid];
      Game.hash.query(p.x, p.y, 0.7, near);
      let atk = 0, def = 0, capPower = 0, atkSide = null, victim = null;
      for (const u of near) {
        const T = UNIT_TYPES[u.t];
        if (T.dom !== 'land' || u.emb) continue;
        if (Game.allied(u.s, pr.o)) def++;
        else if (Game.hostile(u.s, pr.o)) {
          // Several attackers: the province goes to the faction whose unit arrived first in the list.
          if (!atkSide) atkSide = u.s;
          atk++; capPower += T.capture || (T.cls === 'soft' ? 1 : 0.5); if (!victim || Math.random() < 0.3) victim = u;
        }
      }
      pr.fcd = (pr.fcd || 0) - dt;
      if (atk && pr.def > 0 && pr.fcd <= 0 && victim) {
        pr.fcd = 2.5;
        const k = Math.sqrt(pr.lvl);
        this.hitUnit(victim, { dmg: { soft: 6 * k, light: 4 * k, armor: 1.5 * k }, sup: 15 }, null, 1);
        Game.fx.push({ k: 'mg', x0: p.x, y0: p.y, x1: victim.x, y1: victim.y, t0: S.t, dur: 0.15, side: pr.o });
      }
      // Air defense site: engages visible enemy aircraft and helicopters in range.
      const A = AAD_LEVELS[pr.b.aad || 0];
      if (A) {
        pr.acd = (pr.acd || 0) - dt;
        if (pr.acd <= 0) {
          let tgt = null, bd = A.r * A.r;
          for (const e of Game.hash.query(p.x, p.y, A.r, this.near2)) {
            const c = UNIT_TYPES[e.t].cls;
            if (!Game.hostile(pr.o, e.s) || (c !== 'air' && c !== 'heli') || !this.sees(pr.o, e)) continue;
            const d = U.dist2(p.x, p.y, e.x, e.y);
            if (d < bd) { bd = d; tgt = e; }
          }
          if (tgt) {
            pr.acd = A.cd;
            Game.fx.push({ k: 'missile', x0: p.x, y0: p.y, x1: tgt.x, y1: tgt.y, t0: S.t, dur: Math.max(0.4, Math.sqrt(bd) / 2.5), side: pr.o });
            if (Math.random() < 0.7) this.hitUnit(tgt, { dmg: { air: A.air, heli: A.heli }, sup: 10 }, null, Game.eK(pr.o));
          }
        }
      }
      if (atk) pr.calm = 0; else pr.calm = (pr.calm || 0) + dt;
      if (atk && !def && pr.def <= 0) {
        if (!pr.cap || pr.cap.s !== atkSide) pr.cap = { s: atkSide, p: 0 };
        pr.cap.p += dt * capPower / (6 + 3 * pr.lvl);
        if (pr.cap.p >= 1) this.capture(pid, atkSide);
      } else if (pr.cap) {
        pr.cap.p -= dt * 0.05;
        if (pr.cap.p <= 0 || def) pr.cap = null;
      }
      if (pr.calm > 8) pr.def = Math.min(Game.maxDef(pid), pr.def + 3 * dt);
    });
  },

  capture(pid, side) {
    const S = Game.state, pr = S.prov[pid], prev = pr.o;
    pr.o = side; pr.cap = null; pr.q = []; pr.msl = { srbm: 0, cruise: 0, icbm: 0 };
    pr.lvl = Math.max(1, pr.lvl - 1);
    for (const b in pr.b) if (pr.b[b] > 1) pr.b[b]--;
    pr.def = Math.round(Game.maxDef(pid) * 0.3);
    pr.calm = 0;
    S.side[side].captured++;
    Game.emit('captured', { pid, side, prev });
  },

  // ---------- Support: resupply, healing, repair (every second) ----------
  support(dt) {
    const S = Game.state, near = this.near;
    // Fallout harms ground troops of both sides and fades after a while.
    if (S.fallout && S.fallout.length) {
      S.fallout = S.fallout.filter((f) => f.until > S.t);
      for (const f of S.fallout) for (const u of Game.hash.query(f.x, f.y, f.r, [])) {
        const T = UNIT_TYPES[u.t];
        if (T.dom !== 'land' || !Game.byId.has(u.id)) continue;
        u.hp -= T.hp * 0.012 * dt * (T.cls === 'soft' ? 1.5 : 1);
        if (u.hp <= 0) this.kill(u, null);
      }
    }
    for (const u of S.units) {
      if (u.inside || (u.air && u.air.st === 'ground')) continue;
      const T = UNIT_TYPES[u.t];
      const p = T.dom === 'land' ? Geo.provinceAt(u.x, u.y) : null;
      if (p && Game.allied(S.prov[p.id].o, u.s) && U.dist(u.x, u.y, p.x, p.y) < 0.8) {
        this.resupply(u, T, 0.05 * dt);
        u.hp = Math.min(T.hp, u.hp + (T.cls === 'soft' ? 0.6 : S.prov[p.id].b.factory ? 0.5 : 0.15) * dt);
      }
      if (T.dom === 'sea') {
        const port = Game.nearestOwnProvince(u.x, u.y, u.s, false, (pr, pid) => Geo.provinces[pid].seaPt && pr.b.shipyard > 0);
        if (port && U.dist(u.x, u.y, port.seaPt[0], port.seaPt[1]) < 1.2) {
          u.hp = Math.min(T.hp, u.hp + 3 * dt); this.resupply(u, T, 0.1 * dt);
          if (T.slbm && u.slbm < T.slbm && Math.random() < 0.04) u.slbm++;
        }
      }
      if (T.supply || T.heal || T.repair) {
        Game.hash.query(u.x, u.y, 0.45, near);
        for (const f of near) {
          if (f === u || !Game.allied(f.s, u.s)) continue;
          const FT = UNIT_TYPES[f.t];
          if (T.supply && FT.dom === 'land') this.resupply(f, FT, 0.2 * dt);
          if (T.heal && FT.cls === 'soft') { f.hp = Math.min(FT.hp, f.hp + T.heal * dt); f.sup = Math.max(0, f.sup - 8 * dt); }
          if (T.repair && FT.dom === 'land' && FT.cls !== 'soft') f.hp = Math.min(FT.hp, f.hp + T.repair * dt);
        }
      }
    }
  },

  resupply(u, T, frac) {
    T.w.forEach((k, i) => { const a = W[k].ammo; if (a) u.ammo[i] = Math.min(a, u.ammo[i] + a * frac); });
  },

  // The player wins when no faction at war with them holds a province or a unit, and loses with the last own province.
  checkEnd() {
    const S = Game.state, me = S.player;
    if (!Game.countProv(me)) { S.over = 'lose'; Game.emit('over', 'lose'); return; }
    if (S.prov.some((p) => Game.hostile(p.o, me)) || S.units.some((u) => Game.hostile(u.s, me))) return;
    S.over = 'win'; Game.emit('over', 'win');
  },
};
