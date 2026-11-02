// Automatic test run: opens the game over file:// (exactly like the desktop install) in headless Edge or Chrome,
// starts the built-in self test (index.html?selftest) and prints the result. Exit code 0 = all fine, 1 = problems.
// Usage: node tools/selftest.js [runs=3] [game-minutes=20]
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const runs = parseInt(process.argv[2], 10) || 3;
const minutes = parseFloat(process.argv[3]) || 20;
const port = 9300 + Math.floor(Math.random() * 600);

const browsers = [
  process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter((p) => p && fs.existsSync(p));
if (!browsers.length) { console.error('Kein Edge/Chrome gefunden (Pfad per Umgebungsvariable BROWSER angeben).'); process.exit(2); }

const index = path.resolve(__dirname, '..', 'index.html');
const url = 'file:///' + index.replace(/\\/g, '/').replace(/ /g, '%20') + `?selftest=${runs}&min=${minutes}`;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'im-selftest-'));
const proc = spawn(browsers[0], ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', url], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const finish = (code) => { try { proc.kill(); } catch (e) { /* ignore */ } setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* ignore */ } process.exit(code); }, 500); };

(async () => {
  // Find the page target and talk to it over the DevTools protocol.
  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(500);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch (e) { /* not up yet */ }
  }
  if (!target) { console.error('Browser hat nicht geantwortet.'); finish(2); return; }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
      if (text.startsWith('[SelfTest]')) console.log(text.slice(11));
      else if (msg.params.type === 'error') console.log('  Konsole: ' + text.split('\n')[0]);
    }
  };
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Runtime.enable');
  const timeoutMs = runs * (minutes * 1500 + 30000) + 60000;
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    await sleep(1000);
    const r = await send('Runtime.evaluate', { expression: 'window.SELFTEST ? JSON.stringify(window.SELFTEST) : ""', returnByValue: true });
    const v = r && r.result && r.result.value;
    if (v) { const res = JSON.parse(v); finish(res.ok ? 0 : 1); return; }
  }
  console.error('Zeitüberschreitung: Selbsttest wurde nicht fertig.');
  finish(1);
})();
