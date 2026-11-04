# Änderungsprotokoll – Iron Meridian

## Unveröffentlicht – Bedienung Luftwaffe und Raketen (nach Spieler-Feedback)

- **Luftwaffen-Fenster** (Schnellleiste „Luftwaffe“): alle eigenen Flugzeuge und Hubschrauber im ganzen Land, auch
  gelandete, mit Flugplatz, Status und Treibstoff; „Bereite wählen“, „Alle wählen“ und Auswahl nach Typ.
- **Dauereinsatz** für Flugzeuge: greifen im Einsatzgebiet an, tanken auf und fliegen von selbst wieder hin, bis ein
  anderer Befehl kommt. Bleibt in Spielständen erhalten.
- **Raketen-Fenster** (neuer Knopf „Raketen“): Vorrat aller Basen und U-Boote; „Starten“ und Ziel antippen, die nächste
  Basis mit genug Reichweite feuert automatisch.
- **Reichweite auf der Karte**: Kreise beim Zielen mit Raketen, Luftschlägen und Flugzeugen; mit der Maus zeigt eine
  grüne bzw. rote Linie, ob das Ziel erreichbar ist.
- **Vier neue Einheiten** mit eigenen West- und Ost-Modellen:
  - **Aufklärungsdrohne** (MQ-9B / Orion, Flugplatz): unbewaffnet, sehr große Sichtweite, kreist im Dauereinsatz über
    einem Gebiet und tankt von selbst nach.
  - **Kamikaze-Drohnentrupp** (Switchblade 600 / Lancet-3, Flugplatz): 4 Drohnen mit 2,4 Feldern Reichweite gegen
    gesichtete Fahrzeuge und Schiffe; hält sich in der Kampfgruppe wie Artillerie hinten.
  - **Weitreichende Flugabwehr** (Patriot / S-400, Rüstungswerk Stufe 3): trifft Flugzeuge auf 4 Felder und fängt
    Raketen im Umkreis von 5 Feldern ab (Kurzstreckenraketen etwa 65 %, Marschflugkörper bis 85 %).
  - **Landungsschiff** (San-Antonio- / Iwan-Gren-Klasse, Werft): 10 Plätze für Truppen und Fahrzeuge, setzt sie am
    nächsten Ufer ab („Transport nach“ und das Ufer antippen).
  - Die KI baut Drohnen und Flugabwehr und schickt Aufklärungsdrohnen über die Front; große Länder starten mit einigen
    der neuen Einheiten. Hilfe im Spiel ergänzt.
- **Handy (nach dem ersten Test):** Im Querformat liegen die Befehlsknöpfe nicht mehr hinter der Schnellleiste oder dem
  Seitenfenster. Verschieben und Zoomen der Karte laufen deutlich flüssiger, der Nebel des Krieges wird schneller gezeichnet.

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
