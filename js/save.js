// Save games and settings. Settings live in localStorage; save games in IndexedDB (no 5 MB limit, gzip-compressed
// where the browser supports it) with a small index in localStorage so menus can list them synchronously.
// Every storage access is guarded: storage may be unavailable (private mode, blocked site data).
'use strict';

const Store = {
  PREFIX: 'ironmeridian.',
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
      try { req = indexedDB.open('ironmeridian', 1); } catch (e) { rej(e); return; }
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
  VERSION: 2,       // save format; older saves are migrated in migrate()
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
    this.index.push({ id, name: name || (old && old.name) || this.defaultName(S), auto, when: Date.now(), country: S.player, eBloc: S.eBloc, t: S.t, diff: S.diff, prov: Game.countProv('P') });
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
    for (const sd of ['P', 'E']) S.side[sd].nukes = S.side[sd].nukes || 0;
    S.fallout = S.fallout || [];
    for (const k in S.groups || {}) if (Array.isArray(S.groups[k])) S.groups[k] = { ids: S.groups[k], coh: true };
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

  remapProvinces(S, keys, cur) {
    const rnd = U.rng(S.seed || 1);
    const prov = cur.map(([k, x, y], pid) => {
      let best = -1, bd = 1e9;
      keys.forEach(([ok, ox, oy], i) => { if (ok === k) { const d = U.dist2(x, y, ox, oy); if (d < bd) { bd = d; best = i; } } });
      if (best >= 0) return JSON.parse(JSON.stringify(S.prov[best]));
      return Game.newProv(Geo.provinces[pid], S.cside[k] || null, rnd);
    });
    // References to old province ids are dropped; units and the AI pick new targets on their own.
    for (const u of S.units) { u.tgtP = null; if (u.air && u.air.base != null) u.air.base = null; }
    S.missiles = [];
    if (S.ai) { S.ai.target = null; S.ai.def = {}; }
    return prov;
  },
};
