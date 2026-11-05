// Game state, setup, orders, economy and production. Simulation of combat lives in sim.js.
'use strict';

const DIFFICULTY = {
  // pBonus: extra starting resources for the player. missiles/air: how eagerly the AI uses strategic weapons.
  // offEvery: seconds between two AI offensives; gather: how long the troops assemble before they attack.
  // recGap: seconds between two recruitments of a mid-sized country (bigger ones faster, see AI.economy); mob: the first
  // seconds of a war count as mobilisation (recruitment at half pace). probe: seconds between two scouting raids.
  easy:   { inc: 0.45, forces: 0.55, aiTick: 5,   aggr: 2.4, build: 0.6,  cap: 38,  grace: 480, pBonus: 1.6, missiles: 0,   air: 0.25, eDmg: 0.6, offEvery: 600, gather: 150, recGap: 45, mob: 240, probe: 150 },
  normal: { inc: 0.62, forces: 0.72, aiTick: 3.5, aggr: 1.85, build: 0.75, cap: 60,  grace: 330, pBonus: 1.35, missiles: 0.3, air: 0.4,  eDmg: 0.75, offEvery: 450, gather: 120, recGap: 30, mob: 180, probe: 100 },
  hard:   { inc: 1.3,  forces: 1.2,  aiTick: 1.5, aggr: 0.9, build: 1.25, cap: 128, grace: 90,  pBonus: 1,   missiles: 1,   air: 1,    eDmg: 1, offEvery: 300, gather: 75, recGap: 12, mob: 90, probe: 60 },
};
const START_DATE = Date.UTC(2026, 2, 1, 6, 0);
const blocOf = (k) => BLOCS.find((b) => b.members.includes(k)) || null;

const Game = {
  state: null,
  fx: [],
  handlers: {},
  hash: new SpatialHash(1.5),
  on(ev, fn) { (this.handlers[ev] = this.handlers[ev] || []).push(fn); },
  emit(ev, data) { (this.handlers[ev] || []).forEach((f) => f(data)); },

  T(u) { return UNIT_TYPES[u.t]; },
  unit(id) { return this.byId.get(id); },
  prov(pid) { return this.state.prov[pid]; },

  // Every country is its own faction (owner key = country code) with its own economy and AI. Alliances (blocs)
  // form teams; wars are fought between teams. mode 'bloc': the player's bloc against one enemy bloc, everybody
  // else neutral. mode 'ffa': all blocs at war with each other (countries outside a bloc stay neutral).
  newGame({ country, mode = 'bloc', enemyBloc, difficulty, seed }) {
    const pBloc = blocOf(country);
    const S = {
      v: 3 /* = Saves.VERSION */, seed: seed || (Math.random() * 1e9) | 0, t: 0, speed: 1, paused: false, diff: difficulty,
      mode, player: country, pBloc: pBloc ? pBloc.id : null, eBloc: mode === 'bloc' ? enemyBloc : null, nid: 1,
      side: {}, team: {}, war: {}, prov: [], units: [], shots: [], missiles: [], fallout: [], ai: {}, over: null, vp: null,
    };
    for (const c of Geo.countries) {
      if (!c.provinces.length) continue;
      const b = blocOf(c.k);
      S.team[c.k] = b ? b.id : c.k;
      S.side[c.k] = this.newSide();
    }
    const pt = S.team[country];
    if (mode === 'ffa') {
      const teams = [...new Set(BLOCS.map((b) => b.id).filter((id) => Object.values(S.team).includes(id)).concat(pt))];
      for (let i = 0; i < teams.length; i++) for (let j = i + 1; j < teams.length; j++) S.war[this.warKey(teams[i], teams[j])] = 1;
    } else S.war[this.warKey(pt, enemyBloc)] = 1;
    const rnd = U.rng(S.seed);
    for (const p of Geo.provinces) S.prov.push(this.newProv(p, Geo.countries[p.country].k, rnd));
    this.state = S;
    this.rebuild();
    const D = DIFFICULTY[difficulty];
    const teamPow = {};
    for (const k in S.team) teamPow[S.team[k]] = (teamPow[S.team[k]] || 0) + Geo.byKey[k].power;
    for (const k in S.side) {
      const c = Geo.byKey[k], rel = this.rk(k), pw = c.power, s = S.side[k];
      const mult = rel === 'P' ? D.pBonus : rel === 'E' ? D.inc : 1;
      s.m = Math.round((1500 + 300 * pw) * mult);
      s.i = Math.round((700 + 140 * pw) * mult);
      s.o = Math.round((350 + 80 * pw) * mult);
      // Only countries at war start with an army; neutral countries mobilise when war reaches them.
      if (!this.bell[c.idx]) continue;
      const scale = Math.min(1, 34 / teamPow[S.team[k]]) * (rel === 'E' ? D.forces : 1) * (mode === 'ffa' ? 0.5 : 1);
      this.spawnStartingForces(c, k, scale, this.foeCenter(k), rnd);
    }
    this.economyTick(0);
    AI.init(S);
    this.emit('started', S);
    return S;
  },

  newSide() { return { m: 0, i: 0, o: 0, inc: { m: 0, i: 0, o: 0 }, kills: 0, losses: 0, built: 0, captured: 0, nukes: 0 }; },

  // ---------- Factions, teams and wars ----------
  me() { return this.state.player; },
  team(k) { return this.state.team[k] || k; },
  warKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; },
  atWar(ta, tb) { return ta !== tb && !!this.state.war[this.warKey(ta, tb)]; },
  // Hot path (targeting, damage): team index lookup into a precomputed hostility matrix.
  hostile(a, b) {
    if (!a || !b || a === b) return false;
    const i = this.ti[a], j = this.ti[b];
    return i !== undefined && j !== undefined && this.H[i * this.nt + j] === 1;
  },
  allied(a, b) { return !!a && !!b && (a === b || this.team(a) === this.team(b)); },
  // Relation of a faction to the player: P = player, A = ally, E = enemy, N = neutral (used for colours and UI).
  rk(s) {
    if (!s) return 'N';
    let r = this.rkCache[s];
    if (!r) {
      const me = this.state.player;
      r = this.rkCache[s] = s === me ? 'P' : this.allied(s, me) ? 'A' : this.hostile(s, me) ? 'E' : 'N';
    }
    return r;
  },
  // Model palette key: relation colour + equipment doctrine (West / East).
  look(s) { return this.rk(s) + (EAST_DOCTRINE.has(s) ? 'E' : 'W'); },
  isFoe(s) { return this.rk(s) === 'E'; },
  // Damage / production / income factor of AI factions hostile to the player (difficulty).
  eK(s, key = 'eDmg') { return s && this.hostile(s, this.state.player) ? DIFFICULTY[this.state.diff][key] : 1; },
  vbit(s) { const i = this.ti[s]; return i === undefined ? 0 : this.tbits[i]; },

  // Average position of everything hostile to faction k (where its army should face).
  foeCenter(k) {
    let x = 0, y = 0, n = 0;
    this.state.prov.forEach((pr, i) => { if (this.hostile(pr.o, k)) { x += Geo.provinces[i].x; y += Geo.provinces[i].y; n++; } });
    return n ? [x / n, y / n] : [Geo.provinces[Geo.byKey[k].provinces[0]].x, Geo.provinces[Geo.byKey[k].provinces[0]].y];
  },

  // Declare war between two teams. The defending side mobilises; neighbours of the defender may join it.
  declareWar(ta, tb, neighbours = true) {
    const S = this.state;
    if (ta === tb || this.atWar(ta, tb)) return false;
    S.war[this.warKey(ta, tb)] = 1;
    const joined = [];
    if (neighbours) {
      // Only land neighbours near the defender's capital react (no overseas territories, no micro-states).
      const nb = Geo.neighbors(), def = Object.keys(S.team).filter((k) => S.team[k] === tb);
      const capOf = (k) => Geo.provinces[Geo.byKey[k].provinces.find((pid) => Geo.provinces[pid].type === 'capital') ?? Geo.byKey[k].provinces[0]];
      const cand = new Set();
      for (const k of def) {
        const ck = capOf(k);
        for (const ci of nb[Geo.byKey[k].idx]) {
          const oc = Geo.countries[ci], o = oc.k;
          if (!S.team[o] || S.team[o] === ta || S.team[o] === tb || !Geo.playable(oc)) continue;
          const co = capOf(o);
          if (U.dist(ck.x, ck.y, co.x, co.y) < 22) cand.add(S.team[o]);
        }
      }
      const rnd = U.rng((S.seed ^ Math.floor(S.t * 10)) >>> 0);
      for (const tc of cand) if (!this.atWar(tc, ta) && rnd() < 0.35) { S.war[this.warKey(tc, ta)] = 1; joined.push(tc); }
    }
    this.rebuild(true);
    for (const tm of [ta, tb, ...joined]) this.mobilize(tm);
    Render.dirty = true; Render.dirtyMini = true;
    this.emit('war', { a: ta, b: tb, joined });
    return true;
  },

  // Countries of a team that have no army yet raise one (smaller than a prepared starting force).
  mobilize(tm) {
    const S = this.state, rnd = U.rng((S.seed + S.nid) >>> 0);
    for (const k in S.team) {
      if (S.team[k] !== tm || k === S.player || !this.countProv(k) || S.units.some((u) => u.s === k)) continue;
      this.spawnStartingForces(Geo.byKey[k], k, 0.6, this.foeCenter(k), rnd);
    }
  },

  newProv(p, side, rnd) {
    const c = Geo.countries[p.country];
    const lvl = p.type === 'capital' ? 3 : p.type === 'city' || p.type === 'port' ? 2 : 1 + (rnd() < 0.3 ? 1 : 0);
    const b = { barracks: 0, factory: 0, airfield: 0, shipyard: 0, silo: 0, radar: 0, aad: 0, lab: 0 };
    if (side) {
      if (p.type === 'capital') {
        b.barracks = 2; b.factory = c.power >= 3 ? 2 : 1; b.airfield = c.power >= 4 ? 2 : 1;
        if (p.coastal && c.power >= 2) b.shipyard = c.power >= 6 ? 2 : 1;
        if (c.power >= 6) b.silo = 1;
        b.radar = 1;
        if (c.power >= 5) b.aad = 1;
      } else if (p.type === 'airbase') b.airfield = 1;
      else if (p.type === 'industry' && rnd() < 0.6) b.factory = 1;
      else if (p.type === 'port' && c.power >= 2) b.shipyard = 1;
      else if (p.type === 'city' && rnd() < 0.4) b.barracks = 1;
    }
    const pr = { o: side, lvl, b, q: [], def: 0, cap: null, msl: { srbm: 0, cruise: 0, icbm: 0 }, calm: 0 };
    pr.def = this.maxDef(p.id, pr);
    return pr;
  },

  maxDef(pid, pr) { return Math.round(PROVINCE_TYPES[Geo.provinces[pid].type].def * (0.6 + 0.2 * (pr || this.state.prov[pid]).lvl)); },

  // Derived lookups that are not saved: unit index, team indices, hostility matrix, vision bits, passable countries.
  rebuild(keepFx) {
    const S = this.state;
    this.byId = new Map(S.units.map((u) => [u.id, u]));
    const teams = [...new Set(Object.values(S.team))];
    const pt = S.team[S.player];
    const involved = (tm) => tm === pt || teams.some((o) => this.atWar(tm, o));
    // Teams that fight (and the player's) come first: they get their own vision bit (30 available).
    teams.sort((a, b) => (involved(b) ? 1 : 0) - (involved(a) ? 1 : 0));
    const tix = new Map(teams.map((tm, i) => [tm, i]));
    this.nt = teams.length;
    this.ti = {};
    for (const k in S.team) this.ti[k] = tix.get(S.team[k]);
    this.H = new Uint8Array(this.nt * this.nt);
    for (const key in S.war) {
      const [a, b] = key.split('|'), i = tix.get(a), j = tix.get(b);
      if (i !== undefined && j !== undefined) { this.H[i * this.nt + j] = 1; this.H[j * this.nt + i] = 1; }
    }
    this.tbits = new Int32Array(this.nt).map((_, i) => 1 << Math.min(i, 30));
    // Ground units may only enter countries that take part in a war (or the player's own team).
    this.bell = new Uint8Array(Geo.countries.length);
    this.act = {};
    for (const k in S.team) if (involved(S.team[k])) { this.bell[Geo.byKey[k].idx] = 1; this.act[k] = 1; }
    this.rkCache = {};
    if (!keepFx) this.fx = [];
    Sim.provIndex = null;
  },

  spawnStartingForces(c, side, scale, [ex, ey], rnd) {
    const p = c.power, f = (n) => Math.max(0, Math.round(n * scale));
    const provs = c.provinces.slice().sort((a, b) => U.dist2(Geo.provinces[a].x, Geo.provinces[a].y, ex, ey) - U.dist2(Geo.provinces[b].x, Geo.provinces[b].y, ex, ey));
    const cap = Geo.provinces[c.provinces.find((pid) => Geo.provinces[pid].type === 'capital') ?? c.provinces[0]];
    const coastal = c.provinces.map((pid) => Geo.provinces[pid]).find((q) => q.seaPt);
    const land = { inf: Math.max(1, f(1 + p)), at: f(Math.ceil(p / 2)), recon: p >= 2 ? 1 : 0, mortar: p >= 2 ? f(1) : 0, eng: p >= 3 ? 1 : 0, medic: p >= 4 ? 1 : 0,
      ifv: f(Math.ceil(p / 2)), apc: p >= 2 ? f(1) : 0, mbt: f(Math.floor(p / 2)), lt: p >= 3 ? f(1) : 0, aa: f(Math.ceil(p / 3)), arty: p >= 3 ? f(1) : 0,
      spg: p >= 5 ? f(1) : 0, mlrs: p >= 5 ? f(1) : 0, td: p >= 4 ? f(1) : 0, truck: p >= 3 ? 1 : 0, seal: p >= 6 ? 1 : 0, sniper: p >= 4 ? 1 : 0, tbm: p >= 8 ? 1 : 0,
      loit: p >= 5 ? 1 : 0, sam2: p >= 8 ? 1 : 0 };
    // The player starts with ready-made armies: land units are dealt round-robin into mixed battle groups,
    // the first ones at the front, the last one at the capital.
    const total = Object.values(land).reduce((s, n) => s + n, 0);
    const nG = side === this.state.player ? U.clamp(Math.round(total / 8), 1, 3) : 0;
    const spots = nG ? Array.from({ length: nG }, (_, i) => (nG > 1 && i === nG - 1 ? cap.id : provs[Math.min(i, provs.length - 1)])) : null;
    const armies = spots && spots.map(() => []);
    let k = 0;
    for (const t in land) for (let n = 0; n < land[t]; n++) {
      // Front provinces get most troops; every country keeps some at the capital.
      const pr = Geo.provinces[armies ? spots[k % nG] : k % 3 === 2 ? cap.id : provs[Math.min(provs.length - 1, Math.floor(rnd() * Math.min(provs.length, 3)))]];
      const u = this.spawn(t, side, pr.x + rnd.range(-0.25, 0.25), pr.y + rnd.range(-0.25, 0.25));
      if (armies) armies[k % nG].push(u.id);
      k++;
    }
    if (armies) {
      const G = (this.state.groups = this.state.groups || {});
      armies.forEach((ids, i) => { if (ids.length) G[String(i + 1)] = { ids, coh: true }; });
    }
    const air = { ahelo: p >= 4 ? f(1) : 0, thelo: p >= 3 ? 1 : 0, jet: f(Math.floor(p / 3)), tplane: p >= 5 ? 1 : 0, bomber: p >= 9 ? 1 : 0, uav: p >= 4 ? 1 : 0 };
    for (const t in air) for (let n = 0; n < air[t]; n++) this.spawnAt(t, side, cap.id);
    if (coastal) {
      const sea = { corv: p >= 2 ? 1 : 0, dd: p >= 4 ? Math.max(1, f(Math.floor(p / 4))) : 0, sub: p >= 3 ? 1 : 0, cv: p >= 9 ? 1 : 0, ssbn: p >= 9 ? 1 : 0, lst: p >= 6 ? 1 : 0 };
      for (const t in sea) for (let n = 0; n < sea[t]; n++) this.spawn(t, side, coastal.seaPt[0] + rnd.range(-0.2, 0.2), coastal.seaPt[1] + rnd.range(-0.2, 0.2));
    }
    if (p >= 4) this.state.prov[cap.id].msl.srbm = Math.max(1, Math.floor(p / 3));
  },

  spawn(t, side, x, y) {
    const T = UNIT_TYPES[t], S = this.state;
    const u = {
      id: S.nid++, t, s: side, x, y, hp: T.hp, sup: 0, ammo: T.w.map((w) => W[w].ammo || 0), cd: T.w.map(() => Math.random() * 2),
      ord: null, path: null, pi: 0, stance: 'free', tgt: null, tgtP: null, rt: Math.random(), inside: null, cargo: [], emb: false,
      lastHit: -99, rev: 0, vm: this.vbit(side), kills: 0, rout: 0, hd: 0, mv: false,
    };
    if (T.plane) u.air = { base: null, fuel: T.fuel || 400, st: 'fly' };
    if (T.slbm) u.slbm = T.slbm;
    if (T.strike) u.strikeCd = 0;
    S.units.push(u);
    this.byId.set(u.id, u);
    return u;
  },

  // Spawn a unit as produced by a province (planes start parked at their base, ships at the harbour).
  spawnAt(t, side, pid) {
    const p = Geo.provinces[pid], T = UNIT_TYPES[t];
    if (T.dom === 'sea') {
      const sp = p.seaPt || [p.x, p.y];
      return this.spawn(t, side, sp[0] + (Math.random() - 0.5) * 0.2, sp[1] + (Math.random() - 0.5) * 0.2);
    }
    const u = this.spawn(t, side, p.x + (Math.random() - 0.5) * 0.3, p.y + (Math.random() - 0.5) * 0.3);
    if (u.air) { u.air.base = pid; u.air.st = 'ground'; u.x = p.x; u.y = p.y; }
    return u;
  },

  removeUnit(u) {
    const S = this.state;
    const i = S.units.indexOf(u);
    if (i >= 0) S.units.splice(i, 1);
    this.byId.delete(u.id);
  },

  // ---------- Economy ----------
  // Income per minute of every faction in one pass over the provinces (contested provinces yield half).
  incomeAll() {
    const S = this.state, all = {};
    S.prov.forEach((pr, pid) => {
      if (!pr.o || Sim.inFallout(Geo.provinces[pid])) return;
      const inc = all[pr.o] || (all[pr.o] = { m: 0, i: 0, o: 0 });
      const T = PROVINCE_TYPES[Geo.provinces[pid].type], k = pr.lvl * (pr.cap && pr.cap.s !== pr.o ? 0.5 : 1);
      inc.m += T.m * k; inc.i += T.i * k; inc.o += T.o * k;
    });
    for (const sd in all) { const d = this.eK(sd, 'inc'); if (d !== 1) for (const r in all[sd]) all[sd][r] *= d; }
    return all;
  },
  income(side) { return this.incomeAll()[side] || { m: 0, i: 0, o: 0 }; },

  // Upkeep per minute of every faction's units (scaled like the income of AI factions hostile to the player).
  upkeepAll() {
    const all = {};
    for (const u of this.state.units) {
      const c = UNIT_TYPES[u.t].cost, k = all[u.s] || (all[u.s] = { m: 0, o: 0 });
      k.m += c.m * UPKEEP.m; k.o += c.o * UPKEEP.o;
    }
    for (const sd in all) { const d = this.eK(sd, 'inc'); all[sd].m *= d; all[sd].o *= d; }
    return all;
  },

  // s.gross = province income, s.upk = upkeep, s.inc = net income per minute. Upkeep that cannot be paid
  // leaves the treasury at zero, so nothing new can be built until the army shrinks or the economy grows.
  economyTick(dtMin) {
    const all = this.incomeAll(), upk = this.upkeepAll();
    for (const sd in this.state.side) {
      const s = this.state.side[sd], g = all[sd] || { m: 0, i: 0, o: 0 }, k = upk[sd] || { m: 0, o: 0 };
      s.gross = g; s.upk = k;
      s.inc = { m: g.m - k.m, i: g.i, o: g.o - k.o };
      s.m = Math.max(0, s.m + s.inc.m * dtMin); s.i += s.inc.i * dtMin; s.o = Math.max(0, s.o + s.inc.o * dtMin);
    }
  },

  afford(side, c) { const s = this.state.side[side]; return s.m >= (c.m || 0) && s.i >= (c.i || 0) && s.o >= (c.o || 0); },
  pay(side, c, k = 1) { const s = this.state.side[side]; s.m -= (c.m || 0) * k; s.i -= (c.i || 0) * k; s.o -= (c.o || 0) * k; },

  // ---------- Production ----------
  // Returns null when possible, otherwise a reason key for the UI.
  QUEUE_MAX: 8,
  canQueue(pid, kind, key) {
    const pr = this.state.prov[pid], p = Geo.provinces[pid];
    if (!pr.o) return 'notOwned';
    // A full queue still accepts more of the item at its end (merged into that batch).
    const last = pr.q[pr.q.length - 1];
    if (pr.q.length >= this.QUEUE_MAX && !(last && last.kind === kind && last.key === key && kind !== 'bld' && kind !== 'upg')) return 'queueFull';
    const c = this.itemCost(pid, kind, key);
    if (kind === 'unit') {
      const T = UNIT_TYPES[key];
      if ((pr.b[T.bld] || 0) < T.tier) return 'needBuilding';
      if (T.dom === 'sea' && !p.seaPt) return 'notCoastal';
    } else if (kind === 'msl') {
      if (pr.b.silo < MISSILES[key].tier) return 'needBuilding';
    } else if (kind === 'nuke') {
      if (!pr.b.lab) return 'needBuilding';
    } else if (kind === 'bld') {
      const B = BUILDINGS[key], cur = pr.b[key] + pr.q.filter((q) => q.kind === 'bld' && q.key === key).length;
      if (cur >= B.max) return 'maxLevel';
      if (B.coastal && !p.seaPt) return 'notCoastal';
    } else if (kind === 'upg') {
      if (pr.lvl + pr.q.filter((q) => q.kind === 'upg').length >= MAX_LEVEL) return 'maxLevel';
    }
    if (!this.afford(pr.o, c)) return 'noMoney';
    return null;
  },

  itemCost(pid, kind, key) {
    const pr = this.state.prov[pid];
    if (kind === 'unit') return { ...UNIT_TYPES[key].cost, t: UNIT_TYPES[key].time * TIME_SCALE };
    if (kind === 'msl') return { ...MISSILES[key].cost, t: MISSILES[key].time * TIME_SCALE };
    if (kind === 'nuke') return { ...NUKE.cost, t: NUKE.time * TIME_SCALE * (1 - 0.2 * Math.max(0, (pr.b.lab || 1) - 1)) };
    if (kind === 'bld') {
      const B = BUILDINGS[key], lvl = pr.b[key] + 1 + pr.q.filter((q) => q.kind === 'bld' && q.key === key).length;
      return { m: B.m * lvl, i: B.i * lvl, o: 0, t: B.t * lvl * TIME_SCALE };
    }
    const lvl = pr.lvl + pr.q.filter((q) => q.kind === 'upg').length;
    const up = UPGRADE_COST(lvl);
    return { ...up, o: 0, t: up.t * TIME_SCALE };
  },

  // Queue opt.n items at once (batch). Only as many as the side can afford are queued; more of the item that
  // ends the queue is merged into that entry. opt.g: army the units join when they are ready.
  queue(pid, kind, key, opt = {}) {
    const why = this.canQueue(pid, kind, key);
    if (why) return why;
    const pr = this.state.prov[pid], c = this.itemCost(pid, kind, key), s = this.state.side[pr.o];
    const batch = kind === 'unit' || kind === 'msl' || kind === 'nuke';
    let n = batch ? Math.max(1, opt.n || 1) : 1;
    for (const r of ['m', 'i', 'o']) if (c[r]) n = Math.min(n, Math.floor(s[r] / c[r]));
    if (n < 1) return 'noMoney';
    this.pay(pr.o, c, n);
    const cost = { m: c.m || 0, i: c.i || 0, o: c.o || 0 }, g = opt.g || null;
    const last = pr.q[pr.q.length - 1];
    if (batch && last && last.kind === kind && last.key === key && (last.g || null) === g) last.n = (last.n || 1) + n;
    else pr.q.push({ kind, key, n, t: 0, total: c.t, cost, g });
    return null;
  },

  // A formation queues all of its unit types at once – all or nothing.
  queueFormation(pid, F, g) {
    const pr = this.state.prov[pid];
    const types = Object.keys(F.u);
    if (pr.q.length + types.length > this.QUEUE_MAX) return 'queueFull';
    for (const k of types) { const why = this.canQueue(pid, 'unit', k); if (why && why !== 'noMoney') return why; }
    if (!this.afford(pr.o, this.formationCost(F))) return 'noMoney';
    for (const k of types) this.queue(pid, 'unit', k, { n: F.u[k], g });
    return null;
  },

  formationCost(F) {
    const c = { m: 0, i: 0, o: 0 };
    for (const k in F.u) for (const r in c) c[r] += (UNIT_TYPES[k].cost[r] || 0) * F.u[k];
    return c;
  },

  cancel(pid, idx) {
    const pr = this.state.prov[pid], it = pr.q[idx];
    if (!it) return;
    pr.q.splice(idx, 1);
    const s = this.state.side[pr.o], n = it.n || 1;
    s.m += it.cost.m * n; s.i += it.cost.i * n; s.o += it.cost.o * n;
  },

  productionStep(dt) {
    const S = this.state;
    S.prov.forEach((pr, pid) => {
      if (!pr.o || !pr.q.length || Sim.inFallout(Geo.provinces[pid])) return;
      const it = pr.q[0];
      const k = this.eK(pr.o, 'build');
      it.t += dt * k * (pr.cap ? 0.3 : 1);
      if (it.t < it.total) return;
      // A batch produces one item after the other.
      if ((it.n || 1) > 1) { it.n--; it.t = 0; } else pr.q.shift();
      const side = pr.o;
      let u = null;
      if (it.kind === 'unit') { u = this.spawnAt(it.key, side, pid); S.side[side].built++; }
      else if (it.kind === 'msl') pr.msl[it.key]++;
      else if (it.kind === 'nuke') S.side[side].nukes = (S.side[side].nukes || 0) + 1;
      else if (it.kind === 'bld') pr.b[it.key]++;
      else if (it.kind === 'upg') { pr.lvl++; pr.def = this.maxDef(pid); }
      if (side === S.player) this.emit('produced', { pid, it, u });
    });
  },

  // ---------- Orders (shared by player input and AI) ----------
  order(units, ord) {
    units = units.filter((u) => u && !u.inside && this.byId.has(u.id));
    if (!units.length) return;
    // Standing air mission (cas): planes attack around the point, refuel at their base and return on their own
    // (see Sim.plane) until any other order replaces it.
    if (ord.k !== 'stance') for (const u of units) { if (u.cas) delete u.cas; if (u.lift) delete u.lift; }
    if (ord.k === 'cas') {
      for (const u of units) if (u.air) u.cas = { x: ord.x, y: ord.y };
      ord = { k: 'amove', x: ord.x, y: ord.y };
    }
    if (ord.k === 'stop') { for (const u of units) { u.ord = null; u.path = null; u.tgt = null; u.tgtP = null; } return; }
    if (ord.k === 'stance') { for (const u of units) u.stance = ord.v; return; }
    if (ord.k === 'unload') { for (const u of units) this.unload(u); return; }
    if (ord.k === 'retreat') { for (const u of units) this.retreat(u); return; }
    if (ord.k === 'attack') {
      const t = this.unit(ord.id);
      if (!t) return;
      for (const u of units) { u.ord = { k: 'attack', id: t.id, x: t.x, y: t.y, rp: this.state.t }; u.tgt = t.id; this.planPath(u, t.x, t.y); }
      return;
    }
    if (ord.k === 'load') {
      const tr = this.unit(ord.id);
      if (!tr) return;
      for (const u of units) if (u !== tr && this.canCarry(tr, u)) { u.ord = { k: 'load', id: tr.id }; this.planPath(u, tr.x, tr.y); }
      return;
    }
    // move / fast / amove / drop: spread the group in a loose formation around the target point.
    // Combat units take the front rows, support (artillery, air defense, supply, medics) the rear.
    // ord.coh: land units stay together by moving at the pace of the slowest one.
    const cx = units.reduce((s, u) => s + u.x, 0) / units.length, cy = units.reduce((s, u) => s + u.y, 0) / units.length;
    const ang = Math.atan2(ord.y - cy, ord.x - cx), cols = Math.ceil(Math.sqrt(units.length)), sp = 0.11;
    const rank = (u) => (this.isSupport(this.T(u)) ? 1 : 0);
    const sorted = units.slice().sort((a, b) => rank(a) - rank(b) || U.dist2(a.x, a.y, ord.x, ord.y) - U.dist2(b.x, b.y, ord.x, ord.y));
    const land = units.filter((u) => this.T(u).dom === 'land');
    const cap = ord.coh && land.length > 1 ? Math.min(...land.map((u) => this.T(u).spd)) : 0;
    let shared = null;
    sorted.forEach((u, i) => {
      const r = Math.floor(i / cols) - (Math.ceil(units.length / cols) - 1) / 2, c = (i % cols) - (cols - 1) / 2;
      const ox = units.length > 1 ? (-Math.sin(ang) * c - Math.cos(ang) * r) * sp : 0, oy = units.length > 1 ? (Math.cos(ang) * c - Math.sin(ang) * r) * sp : 0;
      const tx = ord.x + ox, ty = ord.y + oy;
      u.ord = { k: ord.k, x: tx, y: ty };
      if (cap && this.T(u).dom === 'land') u.ord.cap = cap;
      if (ord.unload && u.cargo.length) u.ord.unload = 1;
      u.tgt = null; u.tgtP = null;
      if (u.air && u.air.st === 'ground') u.air.st = 'fly';
      shared = this.planPath(u, tx, ty, shared);
    });
  },

  // Paths for ground and naval units; air units fly straight. Reuses a group path when units start close together.
  planPath(u, tx, ty, shared) {
    const T = this.T(u);
    if (T.dom === 'air') { u.path = [tx, ty]; u.pi = 0; return shared; }
    const mode = T.dom === 'sea' ? 'sea' : 'land';
    if (shared && shared.mode === mode && U.dist(u.x, u.y, shared.sx, shared.sy) < 1.5 && shared.path.length > 2) {
      const k0 = Path.cost(Geo.cellOf(u.x, u.y), mode, this.bell);
      if (k0 && Path.lineOk(u.x, u.y, shared.path[0], shared.path[1], mode, this.bell, k0)) {
        u.path = shared.path.slice(0, -2).concat([tx, ty]); u.pi = 0;
        return shared;
      }
    }
    const p = Path.find(u.x, u.y, tx, ty, mode, this.bell);
    if (!p) { u.path = null; u.ord = null; if (u.s === this.state.player) this.emit('noPath', u); return shared; }
    u.path = p; u.pi = 0;
    return shared || { mode, sx: u.x, sy: u.y, path: p };
  },

  isSupport(T) { return T.dom === 'land' && !!(T.supply || T.heal || T.intercept || T.w.some((k) => W[k].indirect || W[k].standoff)); },

  seatsUsed(tr) { return tr.cargo.reduce((s, id) => s + (UNIT_TYPES[this.unit(id)?.t]?.seat || 0), 0); },
  // Could the unit ride in this transport at all (ignoring free seats)?
  fits(tr, u) {
    const TT = this.T(tr), UT = this.T(u);
    if (!TT.cap || tr.s !== u.s || UT.dom !== 'land' || u.cargo.length || u.inside || u === tr) return false;
    if (TT.plane && tr.air.st !== 'ground') return false; // planes only load while parked
    return UT.cls === 'soft' || !!TT.capVeh;
  },
  canCarry(tr, u) { return this.fits(tr, u) && this.seatsUsed(tr) + this.T(u).seat <= this.T(tr).cap; },

  // Distribute cargo over the given transports: bulky vehicles first, each to the nearest transport with room.
  // Helicopters and ground transports drive towards their passengers. Returns how many units board.
  autoLoad(cargo, transports) {
    const trs = transports.filter((tr) => this.T(tr).cap && (!this.T(tr).plane || tr.air.st === 'ground'));
    const room = new Map(trs.map((tr) => [tr.id, this.T(tr).cap - this.seatsUsed(tr)]));
    const riders = new Map();
    const list = cargo.filter((u) => !trs.includes(u)).sort((a, b) => this.T(b).seat - this.T(a).seat);
    let n = 0;
    for (const u of list) {
      let best = null, bd = 1e18;
      for (const tr of trs) {
        if (!this.fits(tr, u) || room.get(tr.id) < this.T(u).seat) continue;
        const d = U.dist2(u.x, u.y, tr.x, tr.y);
        if (d < bd) { bd = d; best = tr; }
      }
      if (!best) continue;
      room.set(best.id, room.get(best.id) - this.T(u).seat);
      if (!riders.has(best.id)) riders.set(best.id, []);
      riders.get(best.id).push(u);
      u.ord = { k: 'load', id: best.id }; u.tgt = null;
      this.planPath(u, best.x, best.y);
      if (u.ord) n++;
    }
    for (const tr of trs) {
      const rs = riders.get(tr.id);
      if (!rs || this.T(tr).plane) continue;
      let cx = rs.reduce((s, u) => s + u.x, 0) / rs.length, cy = rs.reduce((s, u) => s + u.y, 0) / rs.length;
      // Landing ships come to the nearest water next to the passengers; inland passengers walk to the ship.
      if (this.T(tr).dom === 'sea') { const w = Geo.nearestSea(cx, cy, 2); if (!w) continue; [cx, cy] = w; }
      if (U.dist(tr.x, tr.y, cx, cy) > 0.35) { tr.ord = { k: 'move', x: cx, y: cy }; tr.tgt = null; this.planPath(tr, cx, cy); }
    }
    return n;
  },

  // Transports pick up own units nearby: idle ones first, otherwise everyone in reach.
  pickUp(transports) {
    const S = this.state, near = [];
    for (const tr of transports) {
      const r = this.T(tr).plane ? 2 : 1.2;
      for (const u of S.units) if (u.s === tr.s && !transports.includes(u) && !near.includes(u) && this.fits(tr, u) && U.dist(u.x, u.y, tr.x, tr.y) < r) near.push(u);
    }
    const idle = near.filter((u) => !u.ord);
    return this.autoLoad(idle.length ? idle : near, transports);
  },

  // Air transports that can take part in an airlift of these troops to (x, y): the given ones if any, otherwise
  // idle helicopters within reach and parked transport planes at an airfield close to the troops.
  liftCarriers(cargo, x, y, given) {
    const S = this.state, side = cargo[0] && cargo[0].s;
    if (!cargo.length) return [];
    const cx = cargo.reduce((s, u) => s + u.x, 0) / cargo.length, cy = cargo.reduce((s, u) => s + u.y, 0) / cargo.length;
    const room = (tr) => this.T(tr).cap - this.seatsUsed(tr) > 0;
    const ok = (tr) => {
      const T = this.T(tr);
      if (tr.s !== side || T.dom !== 'air' || !T.cap || tr.inside || !room(tr)) return false;
      if (T.plane) {
        if (tr.air.st !== 'ground' || tr.cas || U.dist(tr.x, tr.y, cx, cy) > 3) return false;
        return x === undefined || U.dist(tr.x, tr.y, x, y) <= this.airReach(tr);
      }
      return U.dist(tr.x, tr.y, cx, cy) < 6;
    };
    if (given && given.length) return given.filter(ok);
    return S.units.filter((tr) => ok(tr) && !tr.lift && !tr.ord);
  },

  // One-tap airlift: the carriers pick up the troops, fly them to the point and unload there. Planes land at an own
  // airfield near the point; without one only paratroopers fly and jump. Returns how many units board.
  airlift(cargo, x, y, given) {
    cargo = cargo.filter((u) => !u.inside && this.T(u).dom === 'land' && !u.cargo.length);
    const trs = this.liftCarriers(cargo, x, y, given);
    if (!trs.length) return 0;
    const side = cargo[0].s;
    const field = this.nearestOwnProvince(x, y, side, true, (pr) => pr.b.airfield > 0);
    const canLand = field && U.dist(field.x, field.y, x, y) < 1.0;
    const planes = trs.filter((tr) => this.T(tr).plane), helis = trs.filter((tr) => !this.T(tr).plane);
    let n = 0;
    if (canLand) n = this.autoLoad(cargo, trs);
    else {
      n = this.autoLoad(cargo.filter((u) => this.T(u).airdrop), planes);
      n += this.autoLoad(cargo.filter((u) => !(u.ord && u.ord.k === 'load')), helis);
    }
    for (const tr of trs) {
      if (this.state.units.some((u) => u.ord && u.ord.k === 'load' && u.ord.id === tr.id)) tr.lift = { x, y, t: this.state.t };
    }
    return n;
  },

  board(u, tr) {
    u.inside = tr.id; u.ord = null; u.path = null; u.tgt = null;
    tr.cargo.push(u.id);
  },

  canUnloadHere(tr) {
    const T = this.T(tr);
    if (T.plane) return tr.air.st === 'ground';
    if (T.dom === 'sea') return !!this.shore(tr.x, tr.y);
    if (tr.emb) return false;
    const c = Geo.countryAt(tr.x, tr.y);
    return c >= 0 && this.bell[c];
  },

  // Nearest point on the land of a country at war (or the own side) within reach of a ship, or null.
  shore(x, y) {
    let best = null, bd = 1e9;
    for (let r = 0.15; r <= 1.05; r += 0.15) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r, c = Geo.countryAt(px, py);
        if (c >= 0 && this.bell[c]) { const d = r * r; if (d < bd) { bd = d; best = [px + Math.cos(a) * 0.1, py + Math.sin(a) * 0.1]; } }
      }
      if (best) return best;
    }
    return best;
  },

  unload(tr, force) {
    if (!tr.cargo.length || (!force && !this.canUnloadHere(tr))) return false;
    // Ships land their troops on the nearest shore, everyone else gets out next to the transport.
    const at = this.T(tr).dom === 'sea' ? this.shore(tr.x, tr.y) || [tr.x, tr.y] : [tr.x, tr.y];
    tr.cargo.forEach((id, i) => {
      const u = this.unit(id);
      if (!u) return;
      u.inside = null; u.emb = false;
      const a = (i / tr.cargo.length) * Math.PI * 2;
      u.x = at[0] + Math.cos(a) * 0.08; u.y = at[1] + Math.sin(a) * 0.08;
    });
    tr.cargo = [];
    return true;
  },

  retreat(u) {
    const p = this.nearestOwnProvince(u.x, u.y, u.s, true);
    if (!p) return;
    u.ord = { k: 'fast', x: p.x, y: p.y, retreat: 1 };
    u.tgt = null;
    this.planPath(u, p.x, p.y);
  },

  nearestOwnProvince(x, y, side, any, filter) {
    let best = null, bd = 1e18;
    this.state.prov.forEach((pr, pid) => {
      if (pr.o !== side || (filter && !filter(pr, pid))) return;
      const p = Geo.provinces[pid], d = U.dist2(p.x, p.y, x, y);
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  },

  // Strategic missile from a province's missile base (or an SSBN when fromUnit is given).
  launchMissile(side, key, sx, sy, tx, ty, from, nuke) {
    const M = MISSILES[key], sd = this.state.side[side];
    if (U.dist(sx, sy, tx, ty) > M.r) return 'outOfRange';
    if (nuke && !(sd.nukes > 0)) return 'noNukes';
    if (from.pid !== undefined) {
      const pr = this.state.prov[from.pid];
      if (pr.o !== side || pr.msl[key] <= 0) return 'none';
      pr.msl[key]--;
    } else {
      const u = this.unit(from.uid);
      if (!u || u.slbm <= 0) return 'none';
      u.slbm--;
      u.rev = this.state.t + 20;
    }
    if (nuke) sd.nukes--;
    const d = U.dist(sx, sy, tx, ty);
    this.state.missiles.push({ id: this.state.nid++, side, key, sx, sy, tx, ty, t0: this.state.t, dur: Math.max(4, d / M.spd), nuke: nuke ? 1 : 0 });
    this.emit('launch', { side, key, x: sx, y: sy, tx, ty, nuke: !!nuke });
    return null;
  },

  carrierStrike(u, tx, ty) {
    const T = this.T(u);
    if (!T.strike || u.strikeCd > 0) return 'cooldown';
    if (U.dist(u.x, u.y, tx, ty) > T.strike.r) return 'outOfRange';
    u.strikeCd = T.strike.cd;
    const dur = U.dist(u.x, u.y, tx, ty) / 1.3;
    this.state.shots.push({ t: this.state.t + dur, x: tx, y: ty, side: u.s, w: 'strike', src: u.id });
    this.fx.push({ k: 'jet', x0: u.x, y0: u.y, x1: tx, y1: ty, t0: this.state.t, dur, side: u.s });
    return null;
  },

  // Combat radius of a plane: how far from its airfield it can fly, fight a little and come back.
  airReach(u) { const T = this.T(u); return Math.max(0, ((T.fuel || 400) - 12) / 2 * T.spd); },
  // Origin of that radius: the plane's airfield, or the plane itself without one.
  airHome(u) { return u.air && u.air.base !== null ? Geo.provinces[u.air.base] : u; },

  // Send a strategic bomber on a nuclear strike. It is armed at its airfield from the national stock.
  nukeBomber(u, tx, ty) {
    const T = this.T(u), sd = this.state.side[u.s];
    if (!T.w.includes('bombs') || !u.air) return 'none';
    if (!u.nuke) {
      if (u.air.st !== 'ground') return 'armAtBase';
      if (!(sd.nukes > 0)) return 'noNukes';
    }
    const b = u.air.base !== null ? Geo.provinces[u.air.base] : u;
    const fuel = u.air.st === 'ground' ? T.fuel : u.air.fuel;
    if ((U.dist(u.x, u.y, tx, ty) + U.dist(tx, ty, b.x, b.y)) / T.spd + 6 > fuel) return 'outOfRange';
    if (!u.nuke) { sd.nukes--; u.nuke = 1; }
    if (u.air.st === 'ground') { u.air.st = 'fly'; u.air.fuel = T.fuel; }
    u.tgt = null; u.tgtP = null; u.path = null;
    u.ord = { k: 'nuke', x: tx, y: ty };
    return null;
  },

  gameDate() { return new Date(START_DATE + this.state.t * 120000); },

  countUnits(side) { return this.state.units.filter((u) => u.s === side).length; },
  countProv(side) { return this.state.prov.filter((p) => p.o === side).length; },
};
