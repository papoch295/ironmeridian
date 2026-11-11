# Änderungsprotokoll – Iron Meridian

## Beta 2 – in Arbeit (Branch `beta2-transport`)

- **Acht neue Einheiten (ROADMAP 3.1)** mit eigenen West- und Ost-Modellen, auch für die KI:
  Erdkampfflugzeug (A-10C / Su-25SM3), Tarnkappen-Jäger (F-22A / Su-57), AWACS (E-3G / A-50U), Fregatte
  (F126 / Admiral Grigorowitsch), Marineinfanterie, Küsten-Seezielbatterie (NMESIS / Bastion-P), EloKa-Fahrzeug
  (TLS-BCT / Krasucha-4) und Gefechtsstand (Stryker CV / R-149MA1). Neue Wirkungen (`SUPPORT_FX` in `units.js`):
  Gefechtsstand stärkt Truppen in der Nähe, EloKa stört Lenkflugkörper und Drohnenaufklärung, AWACS sieht Flugzeuge
  und Schiffe weit und stärkt eigene Flugzeuge, Fregatte mit weitreichendem Sonar, Landungen an fremder Küste
  unterdrücken alle Truppen außer Marineinfanterie. Spielstand-Format unverändert.
- **Realistischere Einheitenmodelle:** neuer Zeichenstil für alle Modelle (feine Kontur, gedämpfte Farben, flacher
  Fraktionsring statt Sockel, Infanterie in natürlichen Proportionen, detailliertere Schiffe und Luftfahrzeuge).

- **Eskalation (#44):** Hat ein Bündnis netto 12 Siegpunkte erobert, mobilisiert das nächste neutrale Bündnis gegen es –
  mit Vorwarnung (Leicht 4, Normal 3, Schwer 2 Minuten) und Abbruch, wenn der Vorsprung wieder verloren geht. Gilt für
  Spieler und KI gleich; jeder Eintritt hebt die Schwelle um 10. Schalter im Setup (Standard an), Stand im Ziele-Fenster.
  Spielstand-Format 5 (ältere Stände laufen ohne Eskalation weiter), Selbsttest um einen Eskalations-Test erweitert.

- **Mehrere Armeen führen:** „Gemeinsam führen“ im Seitenfenster, langes Drücken in der Armee-Leiste oder Umschalt+Klick;
  Großangriff, Vorrücken und Halten gelten für alle, die Armeen rücken nebeneinander vor. **Zusammenlegen** macht eine daraus.
- **Soll-Bestand und Auffrischen (#71):** Jede Armee merkt sich ihre Sollstärke und zeigt, was fehlt. Verluste werden in der
  nächsten passenden Institution nachgebaut (abschaltbar, pausiert bei zu hohem Unterhalt; Abbruch eines Ersatzauftrags schaltet es ab).
- **Daueraufträge (#72):** ↻ in der Produktionsliste baut eine Einheit immer wieder.
- **Unterhalt-Warnung (#72):** Meldung und Hinweis im Rekrutierungsfenster mit der Zeit, die die Reserve noch reicht.
- Spielstand-Format 4: Alte Stände übernehmen den aktuellen Bestand als Soll. Selbsttest um einen Armee-Test erweitert.

## Beta 1.2 – 5. November 2026 (`v1.2-beta`)

Neuer Abgabestand für die Uni (ersetzt `v1.1-beta`): KI-Feinschliff und Leistungsanzeige für den Handy-Test.

- **Weniger KI-Ansturm am Start:** Die KI rekrutiert in gleichmäßigem Takt statt in allen Provinzen auf einmal, mit
  Mobilmachung in den ersten Minuten; Einheiten in Produktion zählen bei Limit und Unterhalt mit.
- **Weniger, stärkere Offensiven:** seltener, erst ab 8 Einheiten, höchstens 2 Länder eines Bündnisses gleichzeitig;
  dazwischen kleine Aufklärungsvorstöße an der Front. Messwerte in `TESTPROTOKOLL.md` Abschnitt 11.
- **Armee-Limit der KI −25 %** (Leicht 38, Normal 60, Schwer 128): Die KI bleibt etwa bei ihrer Startarmee und baut
  vor allem Verluste nach (Bündniskrieg Normal höchstens ca. 80 statt 107 Feindeinheiten).

- **Leistungsanzeige** für den Handy-Test: FPS, Rechenzeit und Einheitenzahl oben links, 60-Sekunden-Messung mit
  kopierbarem Bericht. Einstellungen → „Leistungsanzeige (FPS)“ oder Adresse mit `?fps`. Ablauf in `TESTPROTOKOLL.md`
  Abschnitt 10.

## Beta 1.1 – 5. November 2026 (`v1.1-beta`)

Stand für die Uni-Abgabe. Ab hier nur noch Fehlerbehebungen (Feature-Freeze), Testergebnisse in `TESTPROTOKOLL.md`
Abschnitte 5–9.

- **Luftwaffen-Fenster** (Schnellleiste „Luftwaffe“): alle eigenen Flugzeuge und Hubschrauber im ganzen Land, auch
  gelandete, mit Flugplatz, Status und Treibstoff; „Bereite wählen“, „Alle wählen“ und Auswahl nach Typ.
- **Dauereinsatz** für Flugzeuge: greifen im Einsatzgebiet an, tanken auf und fliegen von selbst wieder hin, bis ein
  anderer Befehl kommt. Bleibt in Spielständen erhalten.
- **Raketen-Fenster** (neuer Knopf „Raketen“): Vorrat aller Basen und U-Boote; „Starten“ und Ziel antippen, die nächste
  Basis mit genug Reichweite feuert automatisch.
- **Reichweite auf der Karte**: Kreise beim Zielen mit Raketen, Luftschlägen und Flugzeugen; mit der Maus zeigt eine
  grüne bzw. rote Linie, ob das Ziel erreichbar ist.
- **Vier neue Einheiten** mit eigenen West- und Ost-Modellen:
  - **Aufklärungsdrohne** (MQ-9B / Orion, Flugplatz): unbewaffnet, Sichtweite 12,5 Felder (weiter als jede Radarstation), kreist im Dauereinsatz über
    einem Gebiet und tankt von selbst nach.
  - **Kamikaze-Drohnentrupp** (Switchblade 600 / Lancet-3, Flugplatz): 3 Drohnen mit 2,4 Feldern Reichweite gegen
    gesichtete Fahrzeuge und Schiffe; hält sich in der Kampfgruppe wie Artillerie hinten.
  - **Weitreichende Flugabwehr** (Patriot / S-400, Rüstungswerk Stufe 3): trifft Flugzeuge auf 4 Felder und fängt
    Raketen im Umkreis von 5 Feldern ab (Kurzstreckenraketen etwa 65 %, Marschflugkörper bis 85 %).
  - **Landungsschiff** (San-Antonio- / Iwan-Gren-Klasse, Werft): 10 Plätze für Truppen und Fahrzeuge, setzt sie am
    nächsten Ufer ab („Transport nach“ und das Ufer antippen).
  - Die KI baut Drohnen und Flugabwehr und schickt Aufklärungsdrohnen über die Front; große Länder starten mit einigen
    der neuen Einheiten. Hilfe im Spiel ergänzt.
- **Dokumentation:** Spielanleitung mit Screenshots (`SPIELANLEITUNG.md`), Quellen und Lizenzen (`QUELLEN.md`),
  Skript `tools/screenshots.js`. Hauptmenü: Titel „MERIDIAN“ wurde auf breiten Bildschirmen abgeschnitten – behoben.
- **Handy (nach dem ersten Test):** Im Querformat liegen die Befehlsknöpfe nicht mehr hinter der Schnellleiste oder dem
  Seitenfenster. Verschieben und Zoomen der Karte laufen deutlich flüssiger, der Nebel des Krieges wird schneller gezeichnet.
- **Gebündelte Meldungen je Armee:** Was einer Armee innerhalb von 30 Spielsekunden passiert, steht in einer Zeile, die
  sich laufend aktualisiert, z. B. „Armee 2: Sturmangriff · unter Beschuss · Verluste 2 (Kampfpanzer, Infanterie) ·
  Abschüsse 3“. Gemeldet werden die Phasen des Großangriffs (Aufklärung, Artillerie, Sturm), Ziel erreicht bzw. genommen,
  Rückzug und Rückzug beendet, Verluste nach Typ, ungeordneter Rückzug, Abschüsse und Verstärkung aus einer
  Kampfgruppen-Vorlage (statt einer Zeile je Einheit). Antippen springt zur Armee. Auf Handys im Querformat stehen die
  Meldungen jetzt neben der Schnellleiste statt verdeckt darunter.
- **KI-Landungen:** Die KI setzt Landungsschiffe für eigene Landungsoperationen ein, getrennt von den normalen
  Offensiven. Ein Trupp aus bis zu 10 Plätzen schifft sich an der nächsten eigenen Küste ein, setzt an einer feindlichen
  Küste ab und greift von dort in Phasen an, mit Rückzug bei hohen Verlusten. Inseln ohne Landweg haben Vorrang, auf
  „Leicht“ landet die KI nur dort. Sieht der Spieler das beladene Schiff, kommt die Meldung „Landungsschiff … Kurs auf …“,
  beim Absetzen „… landet Truppen bei …“. Scheitert das Absetzen, fährt das Schiff mit den Truppen heim. Die KI baut ein
  Landungsschiff, wenn sie keines hat, und größere Länder starten wie der Spieler mit einem.
- **Modelle im neuen Referenzstil:** West M2A3 Bradley, M1 Abrams (TUSK), AH-64E Apache, MQ-9B Reaper und
  Spezialkräfte. Dazu jetzt ihre Ost-Gegenstücke: T-90M (Relikt-Reaktivpanzerung an Wanne, Seitenschürze und Turm,
  Gitterschutz, PK-PAN-Panoramavisier, fernbedientes MG), BMP-3 (Staukästen, Schwimmschild, 100-mm- und 30-mm-Waffe,
  Sozh-Visier), Ka-52M (GOES-451-Sichtkugel, Staubfilter, B-8-Raketenbehälter, Vitebsk-Behälter, 2A42-Kanone),
  Orion (Satcom-Kuppel, Lufteinlass, Sensorkugel) und Spetsnaz (Nachtsicht-Monokular, Headset, AK-12 mit Visier).

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
