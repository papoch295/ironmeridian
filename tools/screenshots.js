// Screenshots for the documentation: opens the game over file:// in headless Edge/Chrome, sets up a few scenes over
// the DevTools protocol and saves sharp PNGs to docs/screenshots/. Usage: node tools/screenshots.js
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const browsers = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter((p) => p && fs.existsSync(p));
if (!browsers.length) { console.error('Kein Edge/Chrome gefunden (Pfad per Umgebungsvariable BROWSER angeben).'); process.exit(2); }

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs', 'screenshots');
fs.mkdirSync(out, { recursive: true });
const fileUrl = (f) => 'file:///' + path.join(root, f).replace(/\\/g, '/').replace(/ /g, '%20');
const port = 9300 + Math.floor(Math.random() * 600);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'im-shots-'));
const proc = spawn(browsers[0], ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Start a game paused (tutorial off) and return once the HUD is up.
const START = (country, enemyOf) => `(() => {
  UI.settings.tutorial = false; Screens.tutorial = false;
  const enemy = BLOCS.find((b) => b.members.includes('${enemyOf}')).id;
  Object.assign(Screens.setup, { country: '${country}', mode: 'bloc', enemy, diff: 'normal' });
  Screens.startGame(); Game.state.paused = true; return true; })()`;

const SCENES = [
  { file: '01-hauptmenue.png', w: 1600, h: 900, url: 'index.html', js: 'true', wait: 2500 },
  { file: '02-szenario-auswahl.png', w: 1600, h: 900, url: 'index.html', js: `(() => { Screens.setupScreen(false); return true; })()`, wait: 1500 },
  // Armies at the front, army 1 selected: the command bar shows Grand attack / Advance / Hold.
  { file: '03-armee-befehle.png', w: 1600, h: 900, url: 'index.html', js: `(() => { ${START('DE', 'RU')};
      UI.selectGroup('1'); const us = UI.selUnits(); const x = us.reduce((s, u) => s + u.x, 0) / us.length, y = us.reduce((s, u) => s + u.y, 0) / us.length;
      Render.flyTo(x + 1.5, y, 30); UI.renderCmdbar(); return true; })()`, wait: 1500 },
  // The capital with its recruitment tabs (battle-group templates first).
  { file: '04-rekrutierung.png', w: 1600, h: 900, url: 'index.html', js: `(() => { ${START('US', 'CN')};
      const S = Game.state, cap = Geo.byKey.US.provinces.find((p) => Geo.provinces[p].type === 'capital');
      UI.selectProvince(cap); Render.flyTo(Geo.provinces[cap].x - 2, Geo.provinces[cap].y, 22); Panels.refresh(true); return true; })()`, wait: 1500 },
  // A few minutes of war: front, fighting, enemy offensive arrows.
  { file: '05-gefecht.png', w: 1600, h: 900, url: 'index.html', js: `(() => { ${START('PL', 'RU')};
      const S = Game.state; for (let i = 0; i < 9000 && !S.over; i++) Sim.step(0.1);
      const hot = S.units.filter((u) => u.s === S.player && S.t - u.lastHit < 6);
      const f = hot[0] || S.units.find((u) => u.s === S.player);
      Render.flyTo(f.x, f.y, 34); UI.selectGroup('1'); return true; })()`, wait: 2000 },
  // Phone in landscape (Android, 851 x 393 CSS px, 2x).
  { file: '06-handy-querformat.png', w: 851, h: 393, dpr: 2, mobile: true, url: 'index.html', js: `(() => { ${START('DE', 'RU')};
      UI.selectGroup('1'); const us = UI.selUnits(); Render.flyTo(us[0].x + 2, us[0].y, 22); return true; })()`, wait: 1500 },
  { file: '07-modelle.png', w: 1600, h: 900, url: 'tools/gallery.html?only=mbt,ifv,aa,sam2,uav,jet,lst,dd&sz=80', js: 'true', wait: 1500 },
];

(async () => {
  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(500);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch (e) { /* not up yet */ }
  }
  if (!target) { console.error('Browser hat nicht geantwortet.'); proc.kill(); process.exit(2); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  for (const sc of SCENES) {
    await send('Emulation.setDeviceMetricsOverride', { width: sc.w, height: sc.h, deviceScaleFactor: sc.dpr || 1, mobile: !!sc.mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: !!sc.mobile, maxTouchPoints: sc.mobile ? 5 : 1 });
    await send('Page.navigate', { url: fileUrl(sc.url) });
    // Wait until the game has booted (main menu visible) or the gallery is drawn.
    for (let i = 0; i < 60; i++) {
      await sleep(500);
      const r = await send('Runtime.evaluate', { expression: `typeof Screens === 'undefined' ? document.readyState === 'complete' : !document.querySelector('#menu').hidden`, returnByValue: true });
      if (r.result && r.result.result && r.result.result.value) break;
    }
    const r = await send('Runtime.evaluate', { expression: sc.js, returnByValue: true });
    if (r.result && r.result.exceptionDetails) { console.error(sc.file + ': ' + JSON.stringify(r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description)); continue; }
    await sleep(sc.wait);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, sc.file), Buffer.from(shot.result.data, 'base64'));
    console.log('gespeichert: docs/screenshots/' + sc.file);
  }
  ws.close(); proc.kill();
  setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* ignore */ } process.exit(0); }, 500);
})();
