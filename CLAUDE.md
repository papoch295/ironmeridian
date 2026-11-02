# Iron Meridian – Projektanleitung für Claude

Dieses Projekt ist ausschließlich das Spiel **IRON MERIDIAN – Globaler Konflikt 2026**. Bearbeite in diesem Ordner nur dieses Spiel.

## Worum es geht
- Bewertetes Uni-Projekt (Abgabe ca. Mitte November 2026). Es muss professionell wirken und stabil laufen.
- Eigenes Echtzeit-Strategiespiel mit Pause, Einzelspieler gegen KI. Inspiriert von World Conqueror 4 (Weltkarte, Economy,
  Rekrutierung in Institutionen, Spielfiguren-Optik) und WARNO (Micromanagement, taktische Optik). Keine Inhalte oder
  Grafiken dieser Spiele übernehmen, alles bleibt eigen.
- Zielplattform Handy; zuerst als Web-App, später Android über Capacitor (siehe README.md).

## Arbeitsweise mit dem Nutzer
- Sprache: Deutsch.
- **Nicht auf dem Desktop installieren, bevor der Nutzer ausdrücklich „Go“ gibt.** Änderungen zuerst nur im Projektordner
  machen und im Vorschau-Browser testen (`.claude/launch.json`, Server `node tools/serve.js 8765`).
- Installieren = `powershell -ExecutionPolicy Bypass -File tools\install-desktop.ps1` (kopiert nach `Dokumente\IronMeridian`
  und erneuert die Desktop-Verknüpfung „Iron Meridian“).
- Bei unklarem Feedback lieber kurz mit konkreten Optionen nachfragen, statt zu raten.
- Bisheriges Feedback: KI war zu stark (inzwischen auf Leicht/Normal deutlich entschärft), Bedienung soll einfach sein
  (Stapel, Klick-Befehle, Armeen), Modelle im WC4-Stil (Seitenansicht-Spielfiguren).
- Feedback 2. Nov.: Gameplay soll langsamer und taktischer werden, kein Einheiten-Spam, KI ohne „Schwarm“ – dafür muss die
  Führung für den Spieler einfacher werden (Kampfgruppen statt Einzeleinheiten). Höchste Priorität, siehe ROADMAP.md 2.9/2.10.

## Technik
- Reines HTML/CSS/JavaScript, Canvas 2D, keine Abhängigkeiten, kein Build-Schritt, läuft offline und per `file://`.
- Klassische `<script>`-Dateien mit globalen Objekten (keine ES-Module, sonst geht `file://` kaputt). Reihenfolge in `index.html`.
- `js/data/world.js` ist generiert (`node tools/build-world.js <50m.json> <110m.json>`, Quelle world-atlas@2.0.2) – nicht von Hand ändern.
- Wichtige Stellen:
  - Balance/Schwierigkeit: `DIFFICULTY` in `js/core/game.js`; Einheiten, Waffen, Gebäude, `TIME_SCALE`, `RADAR_RANGE` in `js/data/units.js`.
  - Simulation (Kampf, Sicht, Eroberung): `js/core/sim.js`; KI: `js/core/ai.js`.
  - Darstellung: `js/render/renderer.js`, NATO-Symbole `js/render/symbols.js`. Modelle: Kern, Helfer, Tarnung und Infanterie
    in `js/render/models.js`; Fahrzeuge in `models-land.js` (West) / `models-east-land.js` (Ost), `models-air.js`, `models-sea.js`.
    Jede Fraktion hat eigene Modelle (`Models.m` = West/P, `Models.mE` = Ost/E, Vorbilder `mw`/`me` in `units.js`).
    Modell-Galerie zum Prüfen: `tools/gallery.html?only=mbt,ifv&sz=90` (bzw. `only=land|air|sea`).
  - Oberfläche: `js/ui/*.js`, Texte DE/EN in `js/i18n.js` (immer beide Sprachen pflegen).
- Testen: Balance per Skript im Vorschau-Browser (z. B. `Sim.step(0.1)` in einer Schleife, untätiger Spieler auf Leicht/Normal),
  danach Konsole auf Fehler prüfen und Handy-Format (z. B. 812×375 und 390×844) ansehen.
- Automatischer Test: `node tools/selftest.js 3 20` (headless Edge über `file://`, Exit-Code 0 = ok); nach Änderungen an
  Simulation, KI oder Spielständen immer laufen lassen. Im Browser: `index.html?selftest=3&min=20`.
- Spielstände liegen in IndexedDB (`js/save.js`, Liste im `localStorage`). Formatänderungen in `Saves.migrate()` nachziehen
  und `Saves.VERSION` sowie `v` in `Game.newGame` erhöhen; Provinz-Fingerabdrücke halten Stände bei Kartenänderungen ladbar.
- Roadmap und Beta-Plan: `ROADMAP.md`. Git-Repository ist lokal angelegt (Branch `main`), GitHub-Konto fehlt noch.
