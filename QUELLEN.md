# Iron Meridian – Quellen und Lizenzen

Iron Meridian kommt ohne fremde Programmbibliotheken, Grafiken, Schriften oder Tondateien aus. Die einzige externe Quelle
sind die Kartendaten.

## Kartendaten

| Quelle | Verwendung | Lizenz |
|---|---|---|
| **Natural Earth** (naturalearthdata.com), Ländergrenzen 1:50 Mio. und 1:110 Mio. | Weltkarte, Länderumrisse | gemeinfrei (Public Domain) |
| **world-atlas 2.0.2** (Mike Bostock), TopoJSON-Fassung der Natural-Earth-Daten | Ausgangsdatei für `tools/build-world.js` | ISC-Lizenz |

Die Datei `js/data/world.js` wird mit `node tools/build-world.js <countries-50m.json> <countries-110m.json>` aus
world-atlas erzeugt (vereinfachte Koordinaten, ISO-Ländercodes, deutsche und englische Ländernamen) und nicht von Hand
geändert. Provinzen, Städte und Bündnisse (`js/data/scenario.js`) sind eigene, vereinfachte Spielinhalte und keine
politische Aussage.

## Eigene Inhalte

- **Programmcode:** HTML, CSS und JavaScript ohne Abhängigkeiten und ohne Build-Schritt.
- **Grafik:** Alle Einheitenmodelle, NATO-Symbole, Karten-Icons und Effekte sind eigene Canvas-Zeichnungen
  (`js/render/`). Das App-Symbol `assets/icon.svg` ist ebenfalls selbst erstellt.
- **Ton:** Alle Geräusche werden zur Laufzeit mit der Web Audio API erzeugt; es gibt keine Tondateien.
- **Schriften:** Es werden keine Schriften mitgeliefert; das Spiel nutzt die Systemschriften des Geräts
  (z. B. Bahnschrift unter Windows, Roboto auf Android).
- **Texte:** Alle Texte auf Deutsch und Englisch sind selbst geschrieben (`js/i18n.js`).

## Reale Vorbilder

Die Einheiten tragen die Namen realer Waffensysteme als Vorbild (z. B. „Leopard 2A7 / T-90M“, „Patriot / S-400“).
Die Namen dienen nur der Beschreibung; Modelle und Werte sind eigene, stark vereinfachte Darstellungen. Es werden keine
Logos, Fotos oder offiziellen Abbildungen verwendet. Abmessungen für die Modelle stammen aus allgemein veröffentlichten
Angaben (Länge, Höhe, Radzahl).

## Spielerische Vorbilder

Das Spiel ist von **World Conqueror 4** (Weltkarte, Wirtschaft, Rekrutierung, Spielfiguren-Optik), **WARNO**
(taktische Führung) und **Supremacy: World War 3 / Conflict of Nations** (moderne Weltkarte, Bündnisse) inspiriert.
Aus diesen Spielen wurden keine Inhalte, Grafiken, Texte oder Daten übernommen.

## Werkzeuge

- **Node.js** für die Hilfsskripte in `tools/` (Entwicklungsserver, Kartenumwandlung, Selbsttest, Screenshots).
- **Microsoft Edge / Google Chrome** (headless) für den automatischen Selbsttest und die Screenshots.
- **GitHub Pages** für die Web-Version.
