// Copies the game from a branch (default: beta2-transport) into beta2/ on the current branch, so GitHub Pages serves
// the Beta 2 preview at …/ironmeridian/beta2/ next to the main version. The preview keeps its own save games and
// offline cache (see CHANNEL in js/save.js and CH in sw.js on that branch).
// Usage: node tools/publish-beta2.js [branch]   – then commit beta2/ and push.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const branch = process.argv[2] || 'beta2-transport';
const root = path.resolve(__dirname, '..');
const dst = path.join(root, 'beta2');
const items = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets'];

const rev = execFileSync('git', ['rev-parse', '--short', branch], { cwd: root }).toString().trim();
fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(dst);
// File by file via git show: works the same on Windows and elsewhere, no tar needed.
const files = execFileSync('git', ['ls-tree', '-r', '--name-only', branch, '--', ...items], { cwd: root }).toString().split('\n').filter(Boolean);
for (const f of files) {
  const out = path.join(dst, f);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, execFileSync('git', ['show', `${branch}:${f}`], { cwd: root, maxBuffer: 1 << 28 }));
}
fs.writeFileSync(path.join(dst, 'BUILD.txt'), `Beta-2-Vorschau aus Branch ${branch} @ ${rev}\n`);
console.log(`beta2/ aus ${branch} @ ${rev} erstellt (${files.length} Dateien)`);
