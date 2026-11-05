// Boot sequence and main loop.
'use strict';

(function boot() {
  I18N.set(Store.get('settings', {}).lang || 'de');
  $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  const bar = $('#loadBar'), txt = $('#loadText');
  const progress = (p) => { bar.style.width = (p * 100).toFixed(0) + '%'; if (p >= 0.7) txt.textContent = t('loadingProv'); };
  // Let the loading screen paint before the heavy geometry work.
  setTimeout(() => {
    Geo.init(progress);
    Path.init();
    Render.init($('#map'), $('#mini'));
    UI.init();
    Input.init($('#map'));
    Render.flyTo(15, Geo.projY(30), Render.zMin * 1.6);
    Crash.init();
    Perf.init();
    Saves.init().then(() => {
      Screens.menu();
      requestAnimationFrame(loop);
      if (/[?&]selftest\b/.test(location.search)) SelfTest.run();
    });
  }, 50);
  // Android and browsers may kill a hidden page at any time: autosave when the game goes to the background.
  document.addEventListener('visibilitychange', () => {
    const S = Game.state;
    if (document.hidden && S && !S.over && !SelfTest.active) Saves.autosave();
  });
  // Web version: offline start and clean updates (sw.js). Not available over file:// (desktop install, self test).
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service Worker:', e)));
  }

  let last = performance.now(), acc = 0, drift = 1;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const S = Game.state;
    // A failing simulation step pauses the game and opens the error dialog instead of freezing the loop.
    try {
      if (S && !S.paused && !S.over) {
        acc += dt * S.speed;
        let n = 0;
        while (acc >= Sim.DT && n++ < 16) { Sim.step(Sim.DT); acc -= Sim.DT; }
        if (n >= 16) acc = 0;
        if (S.t >= Screens.autosaveAt) { Screens.autosaveAt = S.t + 120; Saves.autosave().then((ok) => ok && UI.log(t('evAutosave'), 'info')); }
      } else acc = 0;
      if (!S && Screens.attract) {
        // Slow drift across the map behind the main menu.
        const x = Render.cam.x;
        Render.cam.x += dt * 1.5 * drift; Render.clampCam();
        if (Render.cam.x === x) drift = -drift;
      }
      Input.update(dt);
      Render.frame();
      UI.tick(dt);
    } catch (e) { acc = 0; Crash.report(e); }
    Perf.frame(now, performance.now() - now);
    requestAnimationFrame(loop);
  }
})();
