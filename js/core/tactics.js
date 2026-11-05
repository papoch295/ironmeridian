// Battle-group tactics shared by the AI and the player's armies: roles inside a group, attacks in phases
// (reconnaissance → artillery preparation → assault → hold), advance, hold, automatic retreat after heavy losses,
// and support units that follow the front on their own. A group is plain data kept in the game state:
// { ids, side, k: 'attack' | 'advance' | 'hold', ph, t, hp0, x, y (base / retreat point), tx, ty (target),
//   pid (target province or null), ret (share of front strength lost before breaking off, 0 = never) }
'use strict';

const Tactics = {
  RETREAT: 0.55,

  // Only ground units take part; aircraft and ships in an army keep their own orders.
  members(g) { return g.ids.map((id) => Game.unit(id)).filter((u) => u && !u.inside && UNIT_TYPES[u.t].dom === 'land'); },
  // Artillery role: indirect fire and standoff weapons (loitering munitions) stay behind the front.
  isArty(u) { return UNIT_TYPES[u.t].w.some((k) => W[k].indirect || W[k].standoff); },
  artyRange(u) { return Math.max(...UNIT_TYPES[u.t].w.filter((k) => W[k].indirect || W[k].standoff).map((k) => W[k].r)); },

  // front: tanks, IFVs, infantry · rec: scouts · arty: indirect fire · other: air defense, medics, supply.
  roles(us) {
    const R = { front: [], rec: [], arty: [], other: [] };
    for (const u of us) {
      if (u.t === 'recon') R.rec.push(u);
      else if (this.isArty(u)) R.arty.push(u);
      else if (Game.isSupport(UNIT_TYPES[u.t])) R.other.push(u);
      else R.front.push(u);
    }
    return R;
  },
  center(us) { return us.length ? [us.reduce((s, u) => s + u.x, 0) / us.length, us.reduce((s, u) => s + u.y, 0) / us.length] : [0, 0]; },
  frontHp(R) { return R.front.concat(R.rec).reduce((s, u) => s + u.hp, 0); },
  strength(g) { const R = this.roles(this.members(g)); return g.hp0 > 0 ? this.frontHp(R) / g.hp0 : 1; },

  // New task for a group; its current position becomes the base it falls back to.
  task(g, k, tx, ty, pid) {
    const us = this.members(g), [cx, cy] = this.center(us);
    Object.assign(g, { k, tx, ty, pid: pid ?? null, x: cx, y: cy, hp0: 0 });
    if (k === 'hold') { Game.order(us, { k: 'stop' }); g.ph = 'hold'; g.hp0 = this.frontHp(this.roles(us)); return; }
    // Distant targets: march up first, the attack phases start just before the target.
    this.phase(g, k === 'attack' ? (U.dist(cx, cy, tx, ty) > this.APPROACH ? 'approach' : 'recon') : 'advance');
  },
  APPROACH: 2,

  // Enter a phase and give the orders that belong to it.
  phase(g, ph) {
    const S = Game.state, us = this.members(g), R = this.roles(us);
    g.ph = ph;
    const d = Math.max(0.01, U.dist(g.x, g.y, g.tx, g.ty)), dx = (g.tx - g.x) / d, dy = (g.ty - g.y) / d;
    if (ph === 'approach') {
      // The whole group marches together to a point short of the target.
      const k = this.APPROACH * 0.75;
      Game.order(us, { k: 'amove', x: g.tx - dx * k, y: g.ty - dy * k, coh: 1 });
    } else if (ph === 'recon') {
      g.hp0 = this.frontHp(R);
      g.t = S.t + 25;
      // Scouts probe ahead; artillery moves into range of the target (never past the base).
      if (R.rec.length) Game.order(R.rec, { k: 'amove', x: g.tx - dx * Math.min(d, 1), y: g.ty - dy * Math.min(d, 1) });
      for (const u of R.arty) { const r = this.artyRange(u) * 0.8; if (d > r) Game.order([u], { k: 'move', x: g.tx - dx * r, y: g.ty - dy * r }); }
    } else if (ph === 'prep') {
      g.t = S.t + 40;
    } else if (ph === 'assault' || ph === 'advance') {
      if (!g.hp0) g.hp0 = this.frontHp(R);
      // Safety limit; an assault on a province normally ends when it falls (or with a retreat).
      g.t = S.t + 600;
      const front = R.front.concat(R.rec);
      Game.order(front, { k: 'amove', x: g.tx, y: g.ty, coh: 1 });
      front.forEach((u) => { if (u.ord) u.ord.ai = 'wave'; });
      // Air defense, medics and supply follow halfway; artillery keeps firing and moves up later (see follow).
      if (R.other.length) Game.order(R.other, { k: 'move', x: g.x + (g.tx - g.x) * 0.5, y: g.y + (g.ty - g.y) * 0.5 });
    } else if (ph === 'retreat') {
      // Break off: back to the base to repair and refill, no fighting on the way.
      Game.order(us, { k: 'move', x: g.x, y: g.y });
    }
  },

  // Advance the group by one step. Returns 'retreat' when it breaks off, 'taken' when its target province fell.
  step(g) {
    const S = Game.state, us = this.members(g);
    if (!us.length) { g.ph = 'done'; return null; }
    const R = this.roles(us);
    if (g.ph === 'retreat') { if (us.every((u) => !u.path)) g.ph = 'hold'; return null; }
    if (g.ph === 'hold' || g.ph === 'done') { this.follow(g, R); return null; }
    if (g.pid != null && !Game.hostile(g.side, S.prov[g.pid].o)) { g.ph = 'hold'; return 'taken'; }
    if (g.ret && g.hp0 > 0 && this.frontHp(R) < g.hp0 * (1 - g.ret)) { this.phase(g, 'retreat'); return 'retreat'; }
    if (g.ph === 'approach') {
      // Arrived (or ran into the enemy): this is the new base, the attack phases begin.
      const [cx, cy] = this.center(R.front.concat(R.rec).length ? R.front.concat(R.rec) : us);
      const contact = us.some((u) => S.t - u.lastHit < 2);
      if (contact || us.every((u) => !u.path) || U.dist(cx, cy, g.tx, g.ty) < this.APPROACH) { g.x = cx; g.y = cy; this.phase(g, 'recon'); }
      return null;
    }
    if (g.ph === 'recon') {
      // Contact or time up: artillery prepares the attack (skipped without artillery).
      const contact = Game.hash.query(g.tx, g.ty, 1.5, []).some((u) => Game.hostile(g.side, u.s) && Sim.sees(g.side, u));
      if (contact || S.t >= g.t) this.phase(g, R.arty.length ? 'prep' : 'assault');
    } else if (g.ph === 'prep') {
      if (S.t >= g.t) this.phase(g, 'assault');
    } else {
      // Assault / advance: a point target is reached when the front has arrived.
      const arrived = R.front.concat(R.rec).every((u) => !u.path);
      if (S.t >= g.t || (g.pid == null && arrived)) g.ph = 'hold';
      this.follow(g, R);
    }
    return null;
  },

  // Automatic roles: air defense, medics and supply stay close behind the front; artillery keeps within range.
  follow(g, R) {
    const front = R.front.concat(R.rec).filter((u) => !u.rout);
    if (!front.length) return;
    const [cx, cy] = this.center(front);
    const tx = g.tx ?? cx, ty = g.ty ?? cy, d = U.dist(cx, cy, tx, ty), dx = d > 0.01 ? (tx - cx) / d : 0, dy = d > 0.01 ? (ty - cy) / d : 0;
    for (const u of R.other) if (!u.path && U.dist(u.x, u.y, cx, cy) > 0.7) Game.order([u], { k: 'move', x: cx - dx * 0.35, y: cy - dy * 0.35 });
    if (g.ph === 'recon' || g.ph === 'prep') return;
    for (const u of R.arty) {
      const r = this.artyRange(u);
      if (!u.path && U.dist(u.x, u.y, cx, cy) > r * 0.75) { const b = Math.min(r * 0.5, 0.8); Game.order([u], { k: 'move', x: cx - dx * b, y: cy - dy * b }); }
    }
  },

  // The player's armies with a task (set in the army panel) run through the same steps every AI frame.
  updateArmies(S) {
    const G = S.groups;
    if (!G) return;
    for (const k in G) {
      const a = G[k], g = a.task;
      if (!g) continue;
      g.ids = a.ids; g.side = S.player;
      const ph0 = g.ph, ev = this.step(g);
      if (ev) Game.emit('armyTask', { k, ev, g });
      else if (g.ph !== ph0) Game.emit('armyTask', { k, ev: 'phase', g, from: ph0 });
      if (g.ph === 'done') a.task = null;
    }
  },
};
