// Save games and settings. Settings live in localStorage; save games in IndexedDB (no 5 MB limit, gzip-compressed
// where the browser supports it) with a small index in localStorage so menus can list them synchronously.
// Every storage access is guarded: storage may be unavailable (private mode, blocked site data).
'use strict';

// The Beta 2 preview on the web (…/beta2/) keeps its own settings and save games, apart from the main version.
const CHANNEL = /\/beta2\//.test(location.pathname) ? 'beta2' : '';

const Store = {
  PREFIX: CHANNEL ? 'ironmeridian.' + CHANNEL + '.' : 'ironmeridian.',
  get(k, def) { try { const v = localStorage.getItem(this.PREFIX + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(this.PREFIX + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(this.PREFIX + k); } catch (e) { /* ignore */ } },
};

// Thin promise wrapper around one IndexedDB object store ('saves', keyed by save id).
const SaveDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      let req;
      try { req = indexedDB.open(CHANNEL ? 'ironmeridian-' + CHANNEL : 'ironmeridian', 1); } catch (e) { rej(e); return; }
      req.onupgradeneeded = () => req.result.createObjectStore('saves');
      req.onsuccess = () => { this.db = req.result; res(this.db); };
      req.onerror = () => rej(req.error);
    });
  },
  op(mode, fn) {
    return this.open().then((db) => new Promise((res, rej) => {
      const tx = db.transaction('saves', mode), st = tx.objectStore('saves');
      const r = fn(st);
      tx.oncomplete = () => res(r && r.result);
      tx.onerror = tx.onabort = () => rej(tx.error);
    }));
  },
  put(id, val) { return this.op('readwrite', (st) => st.put(val, id)); },
  get(id) { return this.op('readonly', (st) => st.get(id)); },
  del(id) { return this.op('readwrite', (st) => st.delete(id)); },
};

const Saves = {
  VERSION: 7,    // save format; older saves are migrated in migrate()
  AUTO_KEEP: 3,     // rotating autosaves
  index: [],        // [{ id, name, auto, when, country, eBloc, t, diff, prov }], newest first
  useDB: true,

  // Load the index and move saves from the old fixed localStorage slots (Alpha 0.1) into the new store once.
  init() {
    this.index = Store.get('saves.index', []);
    this.sort();
    if (typeof indexedDB === 'undefined') this.useDB = false;
    return this.migrateLegacy().catch(() => {});
  },

  async migrateLegacy() {
    for (const slot of ['auto', '1', '2', '3']) {
      const raw = Store.get('save.' + slot, null), m = Store.get('meta.' + slot, null);
      if (!raw || !m) continue;
      const id = 'legacy-' + slot;
      const name = slot === 'auto' ? t('autosave') : t('slot', slot);
      if (await this.write(id, raw)) {
        this.index = this.index.filter((e) => e.id !== id);
        this.index.push({ id, name, auto: false, when: m.when, country: m.country, eBloc: m.eBloc, t: m.t, diff: m.diff, prov: m.prov });
        this.sort(); this.saveIndex();
        Store.del('save.' + slot); Store.del('meta.' + slot);
      }
    }
  },

  sort() { this.index.sort((a, b) => b.when - a.when); },
  saveIndex() { return Store.set('saves.index', this.index); },
  list() { return this.index; },
  latest() { return this.index[0] || null; },
  get(id) { return this.index.find((e) => e.id === id) || null; },

  // Default name: country and in-game day, e.g. "Deutschland – Tag 12".
  defaultName(S = Game.state) {
    const c = Geo.byKey[S.player];
    return `${c ? countryName(c) : S.player} – ${t('days', Math.floor(S.t * 120 / 86400) + 1)}`;
  },

  // Province fingerprints (country + position) let saves survive changes to the province layout.
  provKeys() { return Geo.provinces.map((p) => [Geo.countries[p.country].k, +p.x.toFixed(3), +p.y.toFixed(3)]); },

  // Serialise, compress if possible and store. Returns true on success.
  async write(id, json) {
    let data = json;
    try {
      if (typeof CompressionStream !== 'undefined') {
        const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
        data = { gz: await new Response(stream).blob() };
      }
    } catch (e) { data = json; }
    if (this.useDB) {
      try { await SaveDB.put(id, data); return true; } catch (e) { this.useDB = false; }
    }
    return Store.set('blob.' + id, json);
  },

  async read(id) {
    let data = null;
    if (this.useDB) { try { data = await SaveDB.get(id); } catch (e) { data = null; } }
    if (data == null) data = Store.get('blob.' + id, null);
    if (data && data.gz) data = await new Response(data.gz.stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return data;
  },

  // Save the running game. id = existing save to overwrite, or null for a new one.
  async save(name, id = null, auto = false) {
    const S = Game.state;
    if (!S) return false;
    const json = JSON.stringify({ v: this.VERSION, keys: this.provKeys(), state: S });
    id = id || (auto ? 'auto-' : 'save-') + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    if (!(await this.write(id, json))) return false;
    const old = this.get(id);
    this.index = this.index.filter((e) => e.id !== id);
    this.index.push({ id, name: name || (old && old.name) || this.defaultName(S), auto, when: Date.now(), country: S.player, eBloc: S.eBloc, mode: S.mode, t: S.t, diff: S.diff, prov: Game.countProv(S.player) });
    this.sort();
    if (auto) for (const e of this.index.filter((x) => x.auto).slice(this.AUTO_KEEP)) await this.remove(e.id);
    return this.saveIndex();
  },

  autosave() {
    if (SelfTest.active) return Promise.resolve(false);
    return this.save(t('autosave') + ' – ' + this.defaultName(), null, true).catch(() => false); },

  async remove(id) {
    try { if (this.useDB) await SaveDB.del(id); } catch (e) { /* ignore */ }
    Store.del('blob.' + id);
    this.index = this.index.filter((e) => e.id !== id);
    this.saveIndex();
  },

  rename(id, name) { const e = this.get(id); if (e && name) { e.name = name; this.saveIndex(); } },

  // Load a save into Game.state. Resolves to true, or to an error key ('loadFail' / 'loadOld').
  async load(id) {
    let env;
    try { env = JSON.parse(await this.read(id)); } catch (e) { return 'loadFail'; }
    if (!env) return 'loadFail';
    const S = this.migrate(env);
    if (!S) return 'loadOld';
    Game.state = S;
    Game.rebuild();
    S.paused = true;
    return true;
  },

  // Bring any older save format up to date. Returns the state or null if it cannot be used any more.
  migrate(env) {
    let S, keys = null;
    if (env.state) { S = env.state; keys = env.keys || null; } else S = env; // Alpha 0.1 stored the bare state
    if (!S || !S.prov || !S.side) return null;
    // Format 1 → 2: radar, air defense, research, batch queue, nukes, fallout, armies as plain lists.
    for (const pr of S.prov) {
      for (const b of ['radar', 'aad', 'lab']) pr.b[b] = pr.b[b] || 0;
      for (const q of pr.q) q.n = q.n || 1;
    }
    for (const sd in S.side) S.side[sd].nukes = S.side[sd].nukes || 0;
    S.fallout = S.fallout || [];
    S.vp = S.vp || null; // points victory countdown (Beta 1, step 8)
    for (const k in S.groups || {}) if (Array.isArray(S.groups[k])) S.groups[k] = { ids: S.groups[k], coh: true };
    // Format 3 → 4: armies remember their target strength; what is alive now becomes the target.
    const typeOf = new Map((S.units || []).map((u) => [u.id, u.t]));
    for (const k in S.groups || {}) {
      const a = S.groups[k];
      if (a.plan) continue;
      a.plan = {};
      for (const id of a.ids) { const ty = typeOf.get(id); if (ty) a.plan[ty] = (a.plan[ty] || 0) + 1; }
    }
    if (S.cside) this.toFactions(S, keys);
    // Format 4 → 5: escalation. Running games keep their rules, so it stays off in older saves.
    S.esc = S.esc || { on: false, t: 0, n: {}, pend: null };
    // Format 5 → 6: war weariness per country and experience per unit start at zero.
    for (const sd in S.side) { S.side[sd].ww = S.side[sd].ww || 0; S.side[sd].wwL = S.side[sd].wwL || 0; }
    for (const u of S.units || []) u.xp = u.xp || 0;
    // Format 6 → 7: events. Like escalation they stay off in running games from older versions.
    S.ev = S.ev || { on: false, next: {}, last: {}, pend: null };
    S.v = this.VERSION;
    // Province layout changed since the save was made: map every current province onto the old one of the same
    // country closest to it. Without fingerprints (Alpha 0.1 saves) this is impossible.
    const cur = this.provKeys();
    const same = keys && keys.length === cur.length && keys.every((k, i) => k[0] === cur[i][0] && Math.abs(k[1] - cur[i][1]) < 1e-3 && Math.abs(k[2] - cur[i][2]) < 1e-3);
    if (!same && !(keys === null && S.prov.length === cur.length)) {
      if (!keys) return null;
      S.prov = this.remapProvinces(S, keys, cur);
    }
    return S;
  },

  // Format 2 → 3: the two sides 'P' / 'E' become country factions. Provinces go back to their own country when it
  // was part of that side, otherwise to the player / the strongest enemy country; units and stocks follow the same rule.
  toFactions(S, keys) {
    const pk = (pid) => (keys ? keys[pid][0] : Geo.countries[Geo.provinces[pid].country].k);
    const eMembers = Object.keys(S.cside).filter((k) => S.cside[k] === 'E' && Geo.byKey[k]);
    const eLeader = eMembers.sort((a, b) => Geo.byKey[b].power - Geo.byKey[a].power)[0] || S.player;
    const map = (s) => (s === 'P' ? S.player : s === 'E' ? eLeader : s);
    S.prov.forEach((pr, pid) => {
      const k = pk(pid);
      pr.o = pr.o === null ? k : S.cside[k] === pr.o ? k : map(pr.o);
      if (pr.cap) pr.cap.s = map(pr.cap.s);
    });
    for (const u of S.units) u.s = map(u.s);
    for (const m of S.missiles || []) m.side = map(m.side);
    for (const s of S.shots || []) s.side = map(s.side);
    for (const f of S.fallout || []) f.side = map(f.side);
    const old = S.side;
    S.team = {}; S.side = {}; S.war = {};
    for (const c of Geo.countries) {
      if (!c.provinces.length) continue;
      const b = BLOCS.find((x) => x.members.includes(c.k));
      S.team[c.k] = b ? b.id : c.k;
      S.side[c.k] = Game.newSide();
    }
    for (const pr of S.prov) if (pr.o && !S.side[pr.o]) S.side[pr.o] = Game.newSide();
    Object.assign(S.side[S.player], old.P);
    Object.assign(S.side[eLeader], old.E);
    S.war[Game.warKey(S.team[S.player], S.eBloc || S.team[eLeader])] = 1;
    S.mode = 'bloc';
    S.ai = {};
    delete S.cside;
  },

  remapProvinces(S, keys, cur) {
    const rnd = U.rng(S.seed || 1);
    const prov = cur.map(([k, x, y], pid) => {
      let best = -1, bd = 1e9;
      keys.forEach(([ok, ox, oy], i) => { if (ok === k) { const d = U.dist2(x, y, ox, oy); if (d < bd) { bd = d; best = i; } } });
      if (best >= 0) return JSON.parse(JSON.stringify(S.prov[best]));
      return Game.newProv(Geo.provinces[pid], k, rnd);
    });
    // References to old province ids are dropped; units and the AI pick new targets on their own.
    for (const u of S.units) { u.tgtP = null; if (u.air && u.air.base != null) u.air.base = null; }
    S.missiles = [];
    // AI plans point to province ids, so every faction plans anew.
    if (S.ai) for (const k in S.ai) if (S.ai[k] && typeof S.ai[k] === 'object') { S.ai[k].off = null; S.ai[k].def = {}; }
    return prov;
  },
};
