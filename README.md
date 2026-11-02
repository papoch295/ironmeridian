# IRON MERIDIAN – Globaler Konflikt 2026 (Alpha 0.1)

Globales Echtzeit-Strategiespiel mit Pause für Einzelspieler gegen KI. Weltkarte mit allen Ländern, Provinzen mit Städten,
Industriegebieten, Ölfeldern, Häfen und Luftwaffenbasen, moderne Einheiten (2000–2026) zu Land, Luft und See sowie Raketen.

## ▶ Jetzt spielen (Handy & Browser)
**https://papoch295.github.io/ironmeridian/**

Einfach auf dem Handy öffnen, am besten im Querformat. Über „Zum Startbildschirm hinzufügen“ (Android: Chrome-Menü,
iPhone: Safari → Teilen) lässt es sich wie eine App starten.

## Starten
- **Desktop:** Verknüpfung „Iron Meridian“ auf dem Desktop (öffnet das Spiel als App-Fenster in Microsoft Edge).
- **Entwicklung:** `node tools/serve.js 8765` und dann `http://127.0.0.1:8765` öffnen. `index.html` läuft auch direkt per Doppelklick.
- **Neu installieren nach Änderungen:** `powershell -ExecutionPolicy Bypass -File tools\install-desktop.ps1`
  (kopiert das Spiel nach `Dokumente\IronMeridian` und erneuert die Verknüpfung).

## Testen
- **Automatischer Testlauf:** `node tools/selftest.js [Partien=3] [Spielminuten=20]` öffnet das Spiel unsichtbar in Edge/Chrome
  (über `file://`, wie die Desktop-Installation), spielt mehrere Partien KI gegen untätigen Spieler im Zeitraffer und prüft
  Fehler, kaputte Werte sowie Speichern/Laden. Exit-Code 0 = alles in Ordnung.
- Im Browser: `index.html?selftest=3&min=20` zeigt dasselbe Ergebnis unten links an.

## Spielstände
Beliebig viele benannte Spielstände plus drei rotierende Autosaves (alle 2 Spielminuten, beim Start, beim Kriegsende und wenn
das Spiel in den Hintergrund geht). Gespeichert wird in IndexedDB (gzip-komprimiert), die Liste im localStorage. Spielstände
enthalten Fingerabdrücke der Provinzen, damit sie auch nach Kartenänderungen ladbar bleiben. Stürzt das Spiel ab, wird es
angehalten und ein Notfall-Spielstand angelegt.

## Spielziel
Wähle deine Nation (dein Bündnis) und ein feindliches Bündnis. Du gewinnst, wenn alle feindlichen Provinzen erobert
und alle feindlichen Einheiten vernichtet sind. Du verlierst, wenn du alle Provinzen verlierst.

## Technik
- Reines HTML5 / CSS / JavaScript (Canvas 2D), keine Abhängigkeiten, kein Build-Schritt, läuft offline.
- Kartendaten: Natural Earth (gemeinfrei) über `world-atlas@2.0.2`, umgewandelt mit `tools/build-world.js`.
- Sound wird zur Laufzeit erzeugt (Web Audio), keine fremden Audiodateien.

| Ordner | Inhalt |
|---|---|
| `js/data` | Weltkarte (generiert), Städte & Bündnisse, Einheiten / Waffen / Gebäude |
| `js/core` | Geometrie & Provinzen, Wegfindung (A*), Spielzustand & Economy, Simulation, KI |
| `js/render` | Karten-Renderer, NATO-Symbole und Silhouetten |
| `js/ui` | HUD, Seitenleisten, Menüs, Eingabe (Maus, Touch, Tastatur) |

## Android-Port
Weil das Spiel eine reine Web-App ohne Server ist, lässt es sich mit **Capacitor** ohne Code-Änderungen als Android-App verpacken:
```
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Iron Meridian" com.ironmeridian.game --web-dir .
npx cap add android
npx cap open android
```
Touch-Steuerung (Tippen, Ziehen, Pinch-Zoom, Auswahlrahmen per langem Druck) und das Layout für Hoch- und Querformat sind bereits eingebaut.

## Bekannte Grenzen der Alpha
- Die Karte wiederholt sich nicht über die Datumsgrenze.
- Neutrale Länder sind für Bodentruppen gesperrt; Luftwaffe und Marine dürfen sie überqueren.
- Balancing ist auf „Normal“ abgestimmt und wird in späteren Versionen verfeinert.
