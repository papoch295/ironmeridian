// Performance overlay for device tests: live FPS and frame time, plus a 60-second measurement with a copyable report.
// Switched on in Settings ("Performance display") or with index.html?fps. Costs nothing while it is off.
'use strict';

const Perf = {
  on: false,
  el: null,
  last: 0,
  frames: [],     // frame intervals (ms) of the last second, for the live value
  work: [],       // time spent in sim + render per frame (ms), last second
  run: null,      // active measurement: { start, iv: [], wk: [], units: max }
  result: '',
  shown: 0,

  init() {
    this.set(!!UI.settings.perf || /[?&]fps\b/.test(location.search));
    // A page in the background gets no frames; the gap after returning is not a slow frame, so it is not counted.
    document.addEventListener('visibilitychange', () => { this.last = 0; });
  },

  set(on) {
    this.on = on;
    if (on && !this.el) {
      const el = document.createElement('div');
      el.id = 'perf'; el.className = 'panel-glass';
      el.innerHTML = '<div id="perfLive"></div><div id="perfRes"></div><div class="perf-btns"><button class="btn" id="perfRun"></button><button class="btn" id="perfCopy" hidden></button><button class="btn" id="perfClose" hidden></button></div>';
      document.body.appendChild(el);
      this.el = el;
      $('#perfRun').onclick = () => (this.run ? this.stop() : this.startRun());
      $('#perfCopy').onclick = () => this.copy();
      $('#perfClose').onclick = () => { this.result = ''; $('#perfRes').textContent = ''; this.paintButtons(); };
    }
    if (this.el) this.el.hidden = !on;
    if (!on) this.run = null;
    this.paintButtons();
  },

  // Called once per animation frame from the main loop: now = rAF time, work = ms spent in this frame's update + draw.
  frame(now, work) {
    if (!this.on) return;
    if (this.last) {
      const iv = now - this.last;
      this.frames.push(iv); this.work.push(work);
      let sum = 0; for (const f of this.frames) sum += f;
      while (sum > 1000 && this.frames.length > 1) { sum -= this.frames.shift(); this.work.shift(); }
      if (this.run) {
        this.run.iv.push(iv); this.run.wk.push(work);
        this.run.units = Math.max(this.run.units, Game.state ? Game.state.units.length : 0);
        if (now - this.run.start >= 60000) this.finish();
      }
    }
    this.last = now;
    if (now - this.shown > 250) { this.shown = now; this.paintLive(now); }
  },

  stats(iv, wk) {
    const n = iv.length;
    if (!n) return null;
    let sum = 0, wsum = 0; for (let i = 0; i < n; i++) { sum += iv[i]; wsum += wk[i]; }
    const sorted = iv.slice().sort((a, b) => b - a);
    // "1 % low": average FPS of the slowest 1 % of frames – shows stutter that the average hides.
    const k = Math.max(1, Math.round(n / 100));
    let slow = 0; for (let i = 0; i < k; i++) slow += sorted[i];
    return { fps: 1000 * n / sum, low: 1000 * k / slow, worst: sorted[0], work: wsum / n, n, secs: sum / 1000 };
  },

  paintLive(now) {
    const s = this.stats(this.frames, this.work);
    const S = Game.state;
    let h = s ? `<b>${s.fps.toFixed(0)} FPS</b> · ${s.work.toFixed(1)} ms · ${t('perfUnits')} ${S ? S.units.length : 0}` : '…';
    if (this.run) h += `<br>${t('perfMeasuring')} ${Math.ceil(60 - (now - this.run.start) / 1000)} s`;
    $('#perfLive').innerHTML = h;
  },

  paintButtons() {
    if (!this.el) return;
    $('#perfRun').textContent = this.run ? t('perfStop') : t('perfRun');
    $('#perfCopy').textContent = t('perfCopy');
    $('#perfCopy').hidden = !this.result;
    $('#perfClose').textContent = t('close');
    $('#perfClose').hidden = !this.result;
  },

  startRun() {
    this.run = { start: performance.now(), iv: [], wk: [], units: 0 };
    this.result = ''; $('#perfRes').textContent = '';
    this.paintButtons();
  },

  stop() { if (this.run && this.run.iv.length > 30) this.finish(); else { this.run = null; this.paintButtons(); } },

  finish() {
    const r = this.run, s = this.stats(r.iv, r.wk);
    this.run = null;
    const S = Game.state;
    const mode = S ? `${S.player} · ${S.mode} · ${S.diff} · ${S.speed}x${S.paused ? ' (' + t('paused') + ')' : ''}` : t('perfMenu');
    const ua = navigator.userAgent.match(/Android [\d.]+|iPhone OS [\d_]+|Windows NT [\d.]+|Mac OS X [\d_]+/);
    this.result = [
      `Iron Meridian ${t('perfReport')} ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      `${t('perfDur')}: ${s.secs.toFixed(0)} s, ${s.n} ${t('perfFrames')}`,
      `Ø FPS: ${s.fps.toFixed(1)}   1 % low: ${s.low.toFixed(1)}   ${t('perfWorst')}: ${s.worst.toFixed(0)} ms`,
      `${t('perfWork')}: ${s.work.toFixed(1)} ms/${t('perfFrame')}`,
      `${t('perfUnits')}: max ${r.units}   ${t('perfGame')}: ${mode}`,
      `${t('perfScreen')}: ${innerWidth}×${innerHeight}, DPR ${devicePixelRatio} (${t('perfDrawn')} ${Render.dpr}), ${ua ? ua[0] : navigator.platform}`,
      `${t('perfVerdict')}: ${s.fps >= 30 ? '✔' : '✘'} ${t('perfTarget')}`,
    ].join('\n');
    $('#perfRes').textContent = this.result;
    this.paintButtons();
    this.paintLive(performance.now());
  },

  copy() {
    const done = () => { $('#perfCopy').textContent = t('perfCopied'); setTimeout(() => this.paintButtons(), 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(this.result).then(done, () => this.selectRes());
    else this.selectRes();
  },

  // Fallback without clipboard access (e.g. http on the phone): select the text so it can be copied by hand.
  selectRes() {
    const r = document.createRange(); r.selectNodeContents($('#perfRes'));
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  },
};
