# Änderungsprotokoll – Iron Meridian

## Beta 1.0 – 4. November 2026 (`v1.0-beta`)

Erste Beta, Stand für die Uni-Abgabe. Gegenüber der Alpha 0.1:

**Spielmodi und Länder**
- Jedes Land ist eine eigene Fraktion mit eigener Wirtschaft und KI; Bündnisse kämpfen als Teams.
- Freie Länderwahl (alle Länder außer Zwergstaaten), Modi „Bündniskrieg“ und „Weltkrieg“ (jeder gegen jeden).
- Neutrale Länder lassen sich per Kriegserklärung angreifen; sie machen mobil, Nachbarn reagieren.

**Taktisches Gameplay**
- Langsameres Tempo, Unterhalt in Geld und Öl, Eingraben (bis −40 % Schaden).
- Kampfgruppen-Vorlagen und Armee-Befehle: Großangriff in Phasen, Vorrücken, Halten, Rückzug bei Verlusten.
- Start mit 1–3 fertigen Armeen statt loser Einzeleinheiten.
- KI mit Kampfgruppen statt Schwarm, festen Offensiven im Takt der Schwierigkeit und Vorwarnung durch Aufklärung.

**Spielende**
- Punktesieg: 70 % der feindlichen Siegpunkte eine Minute lang halten; Kapitulation bei Verlust der Heimat.
- Weltkrieg: Weltmacht-Sieg mit 25 % aller Siegpunkte der Welt.

**Bedienung und Einstieg**
- Interaktives Tutorial mit 12 Schritten an den echten Knöpfen.
- Handy-Layout: einklappbare Fenster, zweistufige Befehlsleiste, Hochformat.

**Technik und Stabilität**
- Beliebig viele benannte Spielstände in IndexedDB, Löschen, Migration alter Stände, 3 rotierende Autosaves.
- Fehlerfang mit Notfall-Spielstand, automatischer Selbsttest (`node tools/selftest.js`).
- Web-Version auf GitHub Pages mit Service Worker (offline spielbar, saubere Updates).

Testergebnisse: siehe [`TESTPROTOKOLL.md`](TESTPROTOKOLL.md).

## Alpha 0.1 – bis 2. November 2026

Weltkarte mit Provinzen, Wirtschaft und Institutionen, 30 Einheitentypen mit West- und Ost-Modellen, Raketen und
Atomwaffen, Nebel des Krieges, KI gegen zwei feste Seiten, 3 Spielstand-Slots, Text-Tutorial, Deutsch/Englisch.
