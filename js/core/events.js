// Events (Beta 2, #49): every country at war gets an economic or military event every few minutes (EVENTS in
// units.js) and has to choose one of two answers. The player decides in a dialog (the game pauses), AI countries
// decide on their own. Effects: resources now, temporary modifiers (side.mods), a strike in one province
// (pr.strike = end time), free units, war weariness.
'use strict';

const Events = {
  // Gross income per minute of country k (at least a small floor so tiny countries still feel the amounts).
  per(k) { const s = Game.state.side[k], g = (s && s.gross) || Game.income(k); return { m: Math.max(60, g.m), i: Math.max(30, g.i), o: Math.max(10, g.o) }; },
  // Add a modifier: key 'inc_m' / 'inc_i' / 'inc_o' (income of one resource) or 'prod' (production speed).
  mod(k, key, f, mins) { const s = Game.state.side[k]; (s.mods = s.mods || []).push({ k: key, f, t: Game.state.t + mins * 60 }); },
  cap(k) { return Game.capProv(k); },
  // Free units at the capital (AI countries hostile to the player get the difficulty's force factor).
  give(k, types, xp) {
    const S = Game.state, cap = this.cap(k);
    if (!cap || S.prov[cap.id].o !== k) return 0;
    const n = Math.max(1, Math.round(types.length * Game.eK(k, 'forces')));
    for (const t of types.slice(0, n)) { const u = Game.spawnAt(t, k, cap.id); if (xp) u.xp = xp; }
    Game.cmdDirty && Game.cmdDirty();
    return n;
  },
  // Own province with the most industry (strike target) / with an airfield (sabotage target).
  bestProv(k, score) {
    const S = Game.state;
    let best = null, bs = 0;
    S.prov.forEach((pr, pid) => { if (pr.o === k) { const v = score(pr, pid); if (v > bs) { bs = v; best = pid; } } });
    return best;
  },

  // ---------- The events ----------
  // can(k) → context object or null; opts[i]: cost(k, ctx) (optional), args(k, ctx) for the effect text,
  // run(k, ctx) → result key suffix (optional), ai = how much an AI country likes it.
  LIST: {
    oil: {
      kind: 'eco', can: (k) => ({}),
      opts: [
        { args: (k) => [U.fmt(Math.round(Events.per(k).o * 3))], run: (k) => { Game.state.side[k].o += Math.round(Events.per(k).o * 3); Events.mod(k, 'inc_o', 0.5, 8); }, ai: 1 },
        { args: () => [], run: (k) => Events.mod(k, 'prod', 0.8, 6), ai: 1 },
      ],
    },
    boom: {
      kind: 'eco', can: (k) => ({}),
      opts: [
        { cost: (k) => ({ m: Math.round(Events.per(k).m * 2) }), args: (k) => [U.fmt(Math.round(Events.per(k).m * 2))], run: (k) => Events.mod(k, 'inc_i', 1.4, 10), ai: 1.2 },
        { args: (k) => [U.fmt(Math.round(Events.per(k).m * 2))], run: (k) => { Game.state.side[k].m += Math.round(Events.per(k).m * 2); }, ai: 1 },
      ],
    },
    strike: {
      kind: 'eco',
      can: (k) => { const pid = Events.bestProv(k, (pr, i) => PROVINCE_TYPES[Geo.provinces[i].type].i * pr.lvl); return pid === null ? null : { pid }; },
      opts: [
        { cost: (k) => ({ m: Math.round(Events.per(k).m * 1.5) }), args: (k) => [U.fmt(Math.round(Events.per(k).m * 1.5))], run: () => {}, ai: 1.3 },
        { args: () => [], run: (k, c) => { Game.state.prov[c.pid].strike = Game.state.t + 6 * 60; Game.weary(k, 4); }, ai: 1 },
      ],
    },
    sanctions: {
      kind: 'eco',
      // Mostly hits the side that is winning: only once the own alliance holds conquered victory points.
      can: (k) => ((Game.vpGain()[Game.team(k)] || 0) > 0 ? {} : null),
      opts: [
        { cost: (k) => ({ m: Math.round(Events.per(k).m * 2) }), args: (k) => [U.fmt(Math.round(Events.per(k).m * 2))], run: () => {}, ai: 1 },
        { args: () => [], run: (k) => { Events.mod(k, 'inc_m', 0.8, 8); Events.mod(k, 'inc_o', 0.8, 8); }, ai: 1.1 },
      ],
    },
    arms: {
      kind: 'mil', can: (k) => (Events.cap(k) && Game.state.prov[Events.cap(k).id].o === k ? {} : null),
      opts: [
        { units: ['mbt', 'ifv', 'aa'], args: () => [], run: (k) => { Events.give(k, ['mbt', 'ifv', 'aa']); }, ai: 1.3 },
        { args: (k) => [U.fmt(Math.round(Events.per(k).m * 3))], run: (k) => { Game.state.side[k].m += Math.round(Events.per(k).m * 3); }, ai: 1 },
      ],
    },
    volunteers: {
      // Both answers bring troops: only when the command limit has room for at least the smaller group.
      kind: 'mil', can: (k) => (Events.cap(k) && Game.state.prov[Events.cap(k).id].o === k && Game.cmdFree(k) >= 2 * Game.cmdW('inf') ? {} : null),
      opts: [
        { units: ['inf', 'inf', 'inf', 'inf'], args: () => [], run: (k) => { Events.give(k, ['inf', 'inf', 'inf', 'inf']); }, ai: 1.1 },
        { units: ['inf', 'inf'], args: () => [], run: (k) => { Events.give(k, ['inf', 'inf'], VET.xp[1]); }, ai: 1 },
      ],
    },
    sabotage: {
      kind: 'mil',
      can: (k) => { const pid = Events.bestProv(k, (pr) => pr.b.airfield); return pid === null ? null : { pid }; },
      opts: [
        { cost: (k) => ({ m: Math.round(Events.per(k).m) }), args: (k) => [U.fmt(Math.round(Events.per(k).m))], run: () => {}, ai: 1.2 },
        {
          args: () => [],
          run: (k, c) => {
            if (Math.random() < 0.5) return 'Lucky';
            const S = Game.state, pr = S.prov[c.pid];
            pr.b.airfield = Math.max(0, pr.b.airfield - 1);
            for (const u of S.units) if (u.s === k && u.air && u.air.st === 'ground' && u.air.base === c.pid) u.hp *= 0.5;
            return 'Hit';
          },
          ai: 1,
        },
      ],
    },
    deserters: {
      kind: 'mil',
      can: (k) => {
        const S = Game.state;
        if ((S.side[k].ww || 0) < 30) return null;
        return S.units.filter((u) => u.s === k && UNIT_TYPES[u.t].men && !u.inside).length >= 4 ? {} : null;
      },
      opts: [
        { cost: (k) => ({ m: Math.round(Events.per(k).m * 1.5) }), args: (k) => [U.fmt(Math.round(Events.per(k).m * 1.5))], run: (k) => Game.weary(k, -5), ai: 1.2 },
        {
          args: () => [],
          run: (k) => {
            const S = Game.state, inf = S.units.filter((u) => u.s === k && UNIT_TYPES[u.t].men && !u.inside).sort((a, b) => a.hp / UNIT_TYPES[a.t].hp - b.hp / UNIT_TYPES[b.t].hp);
            for (const u of inf.slice(0, 2)) { S.side[k].losses++; Game.removeUnit(u); }
            Game.weary(k, -8);
          },
          ai: 1,
        },
      ],
    },
  },

  // ---------- Modifiers ----------
  // Product of all running modifiers of one key for country k.
  modK(k, key) {
    const s = Game.state.side[k];
    if (!s || !s.mods || !s.mods.length) return 1;
    let f = 1;
    for (const m of s.mods) if (m.k === key && m.t > Game.state.t) f *= m.f;
    return f;
  },
  // Running modifiers of the player for the UI: [{ k, f, left (seconds) }].
  active(k) { const S = Game.state, s = S.side[k]; return ((s && s.mods) || []).filter((m) => m.t > S.t).map((m) => ({ k: m.k, f: m.f, left: m.t - S.t })); },

  // ---------- Timing ----------
  // Called every few seconds from Sim.step.
  tick() {
    const S = Game.state, E = S.ev;
    if (!E || !E.on || S.over) return;
    // Expired modifiers are dropped.
    for (const k in S.side) { const s = S.side[k]; if (s.mods && s.mods.length) s.mods = s.mods.filter((m) => m.t > S.t); }
    // The player did not answer in time (only possible without the dialog, e.g. in tests): the free answer applies.
    if (E.pend && S.t >= E.pend.t && !this.choose(this.freeOpt(E.pend.id))) E.pend = null;
    for (const k in S.side) {
      if (!Game.act[k] || !Game.countProv(k) || (k === S.player && E.pend)) continue;
      if (E.next[k] === undefined) { E.next[k] = S.t + EVENTS.first + Math.random() * EVENTS.spread; continue; }
      if (S.t < E.next[k]) continue;
      E.next[k] = S.t + EVENTS.every + Math.random() * EVENTS.spread;
      this.fire(k);
    }
  },
  // Pick an event that fits country k (not one of its last two) and let it decide.
  fire(k) {
    const S = Game.state, E = S.ev, last = E.last[k] || [];
    const cand = [];
    for (const id in this.LIST) {
      if (last.includes(id)) continue;
      const ctx = this.LIST[id].can(k);
      if (ctx) cand.push([id, ctx]);
    }
    if (!cand.length) return null;
    const [id, ctx] = cand[Math.floor(Math.random() * cand.length)];
    E.last[k] = [id].concat(last).slice(0, 2);
    if (k === S.player) {
      E.pend = { id, ctx, t: S.t + EVENTS.answer };
      Game.emit('eventPend', E.pend);
    } else this.apply(k, id, ctx, this.aiPick(k, id, ctx));
    return id;
  },
  // The answer that always works: no price and no new units (the last one if every answer brings units).
  freeOpt(id) { const o = this.LIST[id].opts, i = o.findIndex((x) => !x.cost && !x.units); return i >= 0 ? i : o.length - 1; },
  // Why an answer is not possible: 'evTooExpensive', 'evNoRoom' (command limit, CMD) or null.
  why(k, id, ctx, i) {
    const o = this.LIST[id].opts[i];
    if (o.cost && !Game.afford(k, o.cost(k, ctx))) return 'evTooExpensive';
    if (o.units && Game.cmdFree(k) < o.units.reduce((n, t) => n + Game.cmdW(t), 0)) return 'evNoRoom';
    return null;
  },
  ok(k, id, ctx, i) { return !this.why(k, id, ctx, i); },
  // AI: weighted random choice among the answers it can pay for.
  aiPick(k, id, ctx) {
    const opts = this.LIST[id].opts, w = opts.map((o, i) => (this.ok(k, id, ctx, i) ? o.ai : 0));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0 && w[i]) return i; }
    return this.freeOpt(id);
  },
  apply(k, id, ctx, i) {
    const o = this.LIST[id].opts[i];
    if (o.cost) Game.pay(k, o.cost(k, ctx));
    const res = o.run(k, ctx) || '';
    if (k === Game.state.player) Game.emit('eventDone', { id, i, ctx, res });
    return res;
  },
  // The player's answer to the pending event.
  choose(i) {
    const S = Game.state, P = S.ev && S.ev.pend;
    if (!P || i < 0 || !this.ok(S.player, P.id, P.ctx, i)) return false;
    S.ev.pend = null;
    this.apply(S.player, P.id, P.ctx, i);
    return true;
  },
};
