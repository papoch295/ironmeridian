# Iron Meridian – Roadmap: von der Alpha zur Beta

Stand: 2. November 2026 (Alpha 0.1), Abschnitte 0, 3.1 und 9 aktualisiert am 4. November 2026 (Beta 1), Abschnitt 9 am 5. November 2026 (Beta 1.2), am 6. November 2026 (Beta 2) und am 7. November 2026 (Beta 1.2 abgegeben, ab jetzt nur noch Beta 2), aufgeräumt am 11. November 2026 (erledigte Punkte in allen Tabellen abgehakt, veraltete Termine entfernt). Grundlage: Durchsicht des Codes (`js/core`, `js/data`, `js/ui`, `js/save.js`).
Prioritäten: **P0** = höchste Priorität, kommt vor allem anderen (taktisches Gameplay, siehe 2.9 und 2.10) ·
**P1** = nötig, um die Alpha zu verlassen · **P2** = macht das Spiel deutlich besser · **P3** = später.
Aufwand: **S** = Stunden · **M** = 1–3 Tage · **L** = eine Woche oder mehr.

---

## 0. Was schon da ist (damit klar ist, worauf wir aufbauen)

**Stand Beta 1 (4. Nov.)** – alle acht Beta-1-Schritte aus Abschnitt 9 sind erledigt:
- Weltkarte mit allen Ländern, Provinzen (Hauptstadt, Stadt, Industrie, Ölfeld, Hafen, Luftwaffenbasis), Provinzstufen 1–5.
- Wirtschaft mit Geld, Industrie und Öl plus **Unterhalt** je Einheit; Institutionen: Kaserne, Rüstungswerk, Flugplatz, Werft,
  Raketenbasis, Radar, Flugabwehrstellung, Forschungszentrum (nur für Atomsprengköpfe).
- 34 Einheitentypen zu Land, Luft und See mit West- und Ost-Modellen (neu: Aufklärungs- und Kamikaze-Drohne,
  Patriot / S-400, Landungsschiff), Raketen (SRBM, Marschflugkörper, ICBM, SLBM), Atomwaffen
  mit Fallout, Transport, Nachschub, Reparatur, Sanitäter.
- **Beliebig viele Fraktionen:** jedes Land mit eigener Wirtschaft und KI, Bündnisse als Teams, freie Länderwahl, Modi
  „Bündniskrieg“ und „Weltkrieg“, Kriegserklärung an neutrale Länder mit Reaktion der Nachbarn.
- **Kampfgruppen und Armeen** (`js/core/tactics.js`) für Spieler und KI: Vorlagen, Großangriff in Phasen, Vorrücken, Halten,
  Rückzug bei Verlusten, automatische Rollen; Spieler startet mit 1–3 fertigen Armeen.
- Sichtweite und Nebel des Krieges, Radar, Niederhalten, **Eingraben**, langsameres Tempo.
- KI mit **festen Offensiven** (Sammeln, Hauptachse, Nebenangriff) und Vorwarnung durch Aufklärung; Leicht/Normal/Schwer.
- **Punktesieg** über Siegpunkte (70 % eine Minute halten) und Kapitulation des eigenen Landes.
- Spielstände: beliebig viele mit Namen, Löschen, IndexedDB, Migration, 3 rotierende Autosaves, Notfall-Spielstand.
- **Interaktives Tutorial** mit 12 Schritten an den echten Knöpfen. Deutsch/Englisch.
- Luftwaffen- und Raketen-Fenster, Dauereinsatz für Flugzeuge, Reichweitenkreise beim Zielen.
- Handy-Layout (einklappbare Fenster, zweistufige Befehlsleiste), Touch-Steuerung, Web-Version auf GitHub Pages mit
  Service Worker (offline), automatischer Selbsttest `node tools/selftest.js`.

Der frühere größte Umbau (nur zwei feste Seiten `P`/`E`) ist mit Schritt 2 erledigt.

**Stand Beta 2 (7. Nov., Branch `beta2-transport`, Vorschau unter `/beta2/`)** – drei Blöcke aus Abschnitt 9 sind erledigt:
- **Transport:** mehr Plätze (Transportpanzer 3, Schützenpanzer 2, Transporthubschrauber 4, Transportflugzeug 8,
  Landungsschiff 16), Ladeanzeige „belegt/Plätze“ auf der Karte und in allen Listen, neuer Befehl **Lufttransport**.
- **Regiment-Steuerung:** mehrere Armeen gemeinsam führen, Armeen zusammenlegen, Soll-Bestand mit Lücken-Anzeige,
  **Auffrischen** (#71), Daueraufträge und Unterhalt-Warnung (#72); Spielstand-Format 4.
- **Taktik ausbauen:** Flanken- und Rückenbonus, Deckung in Städten, stärkeres Niederhalten, teurere schwere Einheiten,
  **Kommandolimit**, KI-Frontabschnitte mit Übermacht-Regel und Umfassung (#61–#66).
- **Spieltiefe, Teil 1 – Eskalation (#44, 11. Nov.):** Hat ein Bündnis netto 12 Siegpunkte erobert, mobilisiert das
  nächste neutrale Bündnis mit Vorwarnung gegen es (gilt für Spieler und KI); Schalter im Setup, Spielstand-Format 5.
  Werte: `ESCALATION` in `js/data/units.js`, `escEvery` / `escWarn` / `escPow` in `DIFFICULTY`.
- 10 Modelle im Referenzstil neu gezeichnet (5. Nov.): Bradley, Abrams, Apache, Reaper, Spezialkräfte (West) sowie
  T-90M, BMP-3, Ka-52M, Orion, Spetsnaz (Ost).

---

## 1. Was „raus aus der Alpha“ bedeutet (Vorschlag für die Beta-Kriterien)

Bitte bestätigen oder ändern (Frage F1):

1. Eine Partie lässt sich von Anfang bis Ende ohne Absturz, Hänger oder kaputten Spielstand durchspielen (3 Testpartien je Modus).
2. Mehrere Spielstände mit Namen, Datum und Vorschaubild; Spielstände lassen sich **löschen**; alte Stände werden nach
   Updates migriert statt unbrauchbar.
3. Mindestens 2 Spielmodi (Bündnis gegen Bündnis, Jeder gegen jeden) und freie Länderwahl.
4. Die Mitte und das Ende einer Partie bleiben spannend (siehe Abschnitt 4).
5. Ein interaktives Tutorial, nach dem ein Neuling allein spielen kann.
6. Läuft flüssig (30+ FPS) auf einem Mittelklasse-Handy, als Web-Version online (für Beta 1 ausreichend, Entscheidung 5. Nov.) und später als installierbare APK (Beta 2).
7. Alle Texte in Deutsch und Englisch, keine Platzhalter, keine Konsolenfehler.

---

## 2. Fehlende Funktionen nach Bereich

### 2.1 Spielmodi, Länder, Szenarien
| # | Funktion | Prio | Aufwand |
|---|---|---|---|
| 1 | **Mehr-Seiten-Kern:** beliebig viele Fraktionen statt `P`/`E` (Besitz, Sicht, Kriegszustand, KI je Fraktion) – ✔ 2. Nov. (Beta 1) | P1 | L |
| 2 | **Freie Länderwahl:** jedes Land spielbar, nicht nur Bündnisführer; Start allein oder mit Bündnis – ✔ 2. Nov. (Beta 1) | P1 | M |
| 3 | **Modus „Jeder gegen jeden“** (alle Länder bzw. Bündnisse kämpfen gegeneinander) – ✔ 2. Nov. (Beta 1): Modus „Weltkrieg“ | P1 | M (nach #1) |
| 4 | **Modus „Mit befreundeter KI“:** Verbündete werden von der KI gesteuert und helfen aktiv – ✔ 2. Nov. (Beta 1) | P1 | M (nach #1) |
| 5 | **Alle Provinzen / ganze Welt bespielbar**, neutrale Länder angreifbar (Kriegserklärung) – ✔ 2. Nov. (Beta 1) | P1 | M |
| 6 | **Szenario-Auswahl:** vorgefertigte Lagen (z. B. „Baltikum 2026“, „Taiwan-Straße“, „Nahost“, „Weltkrieg“) mit eigenem Start, Zielen und Größe | P2 | M je Szenario |
| 7 | **Spieleinstellungen:** Kartengröße/Region, Startgeld, Siegbedingung, Atomwaffen an/aus, Spieltempo | P2 | M |
| 8 | **Siegbedingungen:** Eroberung, Hauptstädte, Punkte nach Zeit, Szenarioziele | P2 | M |
| 9 | Karte über die Datumsgrenze (Pazifik am Kartenrand) | P3 | M |

### 2.2 Spielstände (mehrere Sitzungen)
| # | Funktion | Prio | Aufwand |
|---|---|---|---|
| 10 | Unbegrenzte, **benannte Spielstände** mit Datum, Land, Spielzeit und kleinem Kartenbild – ✔ 2. Nov. (Beta 1) | P1 | M |
| 11 | **Versionierung und Migration:** Stände bleiben nach Updates ladbar (heute: neue Provinzanzahl macht sie unbrauchbar) – ✔ 2. Nov. (Beta 1) | P1 | M |
| 12 | Speicher auf **IndexedDB** umstellen (localStorage ist auf ca. 5 MB begrenzt, große Partien passen bald nicht mehr) – ✔ 2. Nov. (Beta 1) | P1 | S–M |
| 13 | Autosave alle X Minuten + rotierende Autosaves (3 Stück), Speichern beim Schließen der App – ✔ 2. Nov. (Beta 1) | P1 | S |
| 14 | Export/Import als Datei (Backup, Gerätewechsel) | P2 | S |
| 15 | Cloud-Speicher (Konto nötig) | P3 | L |

### 2.3 Gegner-KI (klug, aber fair und berechenbar)
| # | Funktion | Prio | Aufwand |
|---|---|---|---|
| 16 | **Angriffe ankündigen:** Aufklärung meldet „Feind sammelt Truppen bei X“ einige Minuten vorher (Vorwarnung) – ✔ 2. Nov. (Beta 1) | P1 | M |
| 17 | **Feste Angriffsachsen:** KI wählt 1–3 Frontabschnitte und bleibt dort, statt zufällig zu springen – ✔ 2. Nov. (Beta 1) | P1 | M |
| 18 | KI nutzt **Armeen** statt Einzelwellen (gemischte Verbände, Artillerie hinten, Panzer vorne) – ✔ 2. Nov. (Beta 1): KI-Kampfgruppen mit Rollen | P2 | M |
| 19 | KI-**Persönlichkeiten** je Land (vorsichtig, aggressiv, Luftmacht, Seemacht) | P2 | M |
| 20 | KI **zieht sich zurück**, verteidigt Hauptstadt, startet Gegenoffensiven, nutzt Transporte/Landungen | P2 | M |
| 21 | Verbündete KI (siehe #4) und KI gegen KI im Modus „Jeder gegen jeden“ – ✔ 2. Nov. (Beta 1) | P1 | M |

### 2.4 Bedienung und Übersicht
| # | Funktion | Prio | Aufwand |
|---|---|---|---|
| 22 | **Strategische Übersicht:** Frontlinien, Armeepfeile, Liste aller Armeen und Produktionen | P1 | M |
| 23 | **Ereignis-Meldungen** mit Klick zum Ort (Angriff, Provinz verloren, Einheit fertig) | P1 | S |
| 24 | Armee-Befehle: Verteidigen, Front halten, Patrouille, Rückzug bei X % Verlusten, Sammelpunkt je Institution | P2 | M |
| 25 | Wiederholte Produktion (Schleife) und Produktionsvorlagen – ✔ Vorlagen über Kampfgruppen-Vorlagen (2. Nov.), Schleife über Daueraufträge (6. Nov., Beta 2) | P2 | S |
| 26 | Obere Leiste im Hochformat zu breit (Menü-Knopf abgeschnitten) – Fehler – ✔ 2. Nov. (Beta 1) | P1 | S |
| 27 | Tooltips/Vergleich: Stärken und Schwächen jeder Einheit (gegen wen gut) | P2 | S |

### 2.5 Tutorial und Einstieg
| # | Funktion | Prio | Aufwand |
|---|---|---|---|
| 28 | **Interaktives Tutorial** in kleiner Spielszene: Pfeile/Hervorhebungen auf echte Knöpfe, Schritt erst nach Aktion – ✔ 3. Nov. (Beta 1) | P1 | M |
| 29 | Kapitel: Bewegen → Kämpfen → Erobern → Wirtschaft → Rekrutieren → Armeen → Luft/See → Raketen | P1 | M |
| 30 | Kontext-Tipps beim ersten Mal (erste Werft, erster Flugplatz, erste Rakete) | P2 | S |
| 31 | Einheiten-Lexikon mit Modellbild, Rolle, Konter | P2 | S |

### 2.6 Optik
| # | Funktion | Prio | Aufwand |
|---|---|---|---|
| 32 | Luftfahrzeuge, Schiffe und Infanterie im neuen Referenzstil (wie Abrams) – begonnen 5. Nov.: Apache, Ka-52M, Reaper, Orion, Spezialkräfte, Spetsnaz fertig; Schiffe offen | P2 | L |
| 33 | Gefechtseffekte: Mündungsfeuer, Explosionen, Rauch, Wracks, Krater | P2 | M |
| 34 | Kartenstil: Gelände (Wald, Gebirge, Wüste), Flüsse, Frontlinie, Wetter-/Tag-Nacht-Tönung | P2 | M–L |
| 35 | Überarbeitete Menüs (Hauptmenü mit Hintergrundbild, Ladebildschirm, Endbildschirm mit Statistik) | P2 | M |
| 36 | Einheitliche Icons für Institutionen und Ressourcen | P3 | S |

### 2.7 Stabilität und Qualität
| # | Funktion | Prio | Aufwand |
|---|---|---|---|
| 37 | **Automatische Tests** (Node-Skript): 30-min-Partie im Zeitraffer je Modus, prüft Fehler, Speicherstand, Sieg/Niederlage – ✔ 2. Nov. (Beta 1): `node tools/selftest.js` | P1 | M |
| 38 | Leistung: Begrenzung der Einheitenzahl, Sicht/Pfad nur bei Bedarf neu berechnen, Profiling auf Handy | P1 | M |
| 39 | Fehlerfang: Absturz zeigt Meldung + Autosave statt schwarzen Bildschirm – ✔ 2. Nov. (Beta 1): Meldung + Notfall-Spielstand | P1 | S |
| 40 | Balance-Tabellen pro Einheit (Kosten/Stärke) und Testläufe KI gegen KI | P2 | M |

### 2.8 Ton und Musik (spätere Phase, wie gewünscht)
| # | Funktion | Prio | Aufwand |
|---|---|---|---|
| 41 | Waffensounds je Typ, Funksprüche/Bestätigungen, Umgebungsgeräusche | P3 | M |
| 42 | Musik (eigene oder lizenzfreie Stücke), getrennte Lautstärken | P3 | M |

### 2.9 Taktisches Gameplay statt Masse (P0 – höchste Priorität)
Feedback vom 2. Nov.: Die KI schwärmt mit einer ganzen Armee auf einen Punkt und spielt nicht taktisch; das Spiel soll
**langsamer und taktischer** werden, **kein Spam**. Ursache im Code: Jede Offensive schickt 80 % aller freien
Bodentruppen mit einem einzigen Angriffsbefehl auf ein Ziel, und die Wirtschaft rekrutiert ohne Pause bis zur Obergrenze.
Gilt für KI **und** Spieler gleichermaßen.

| # | Funktion | Prio | Aufwand |
|---|---|---|---|
| 55 | **Unterhalt:** jede Einheit kostet laufend Geld und Öl; große Armeen belasten die Wirtschaft, Spam lohnt sich nicht mehr – ✔ 2. Nov. (Beta 1) | P0 | M |
| 56 | **Langsameres Tempo:** Bewegung, Eroberung und Verteidigungsaufbau von Provinzen langsamer; Partien länger, jede Bewegung zählt – ✔ 2. Nov. (Beta 1) | P0 | S–M |
| 57 | **Eingraben:** stehende Einheiten bekommen mit der Zeit einen wachsenden Verteidigungsbonus; gehaltene Stellungen brauchen vorbereitete Angriffe – ✔ 2. Nov. (Beta 1) | P0 | M |
| 58 | **KI-Kampfgruppen statt Blob:** Gruppen aus 4–8 Einheiten mit Rollen (Aufklärer vorn, Panzer/Infanterie Mitte, Artillerie und Flak hinten), je Gruppe ein eigener Auftrag – ✔ 2. Nov. (Beta 1) | P0 | L |
| 59 | **Angriff in Phasen:** Aufklärung → Artillerie-Vorbereitung auf erkannte Ziele → Sturm → Stellung halten und eingraben – ✔ 2. Nov. (Beta 1) | P0 | M |
| 60 | **Rückzug und Schonung:** Gruppe bricht bei hohen Verlusten ab, zieht sich zurück, repariert/füllt auf und greift erneut an – ✔ 2. Nov. (Beta 1) | P0 | M |
| 61 | Kommandolimit: Einheitenzahl hängt an Hauptquartieren/Provinzstufe statt nur am Geld – ✔ 7. Nov. (Beta 2): Limit aus Provinzstufen (`CMD`), Anzeige „Kommando x / y“ | P2 | M |
| 62 | Längere Bauzeiten und höhere Preise für schwere Einheiten – ✔ 7. Nov. (Beta 2): Kampfpanzer, Panzerhaubitze, Raketenwerfer, Kampfhubschrauber, Jets, Bomber u. a. ca. 15 % teurer und 25–35 % längere Bauzeit | P2 | S |
| 63 | KI-Frontabschnitte: Gruppen halten eine Linie, Angriff nur mit örtlicher Übermacht – ✔ 7. Nov. (Beta 2) | P2 | M |
| 64 | Echte Umfassung: Nebenachse greift zeitgleich an einer anderen Seite an – ✔ 7. Nov. (Beta 2) | P2 | M |
| 65 | Flanken- und Rückenbonus im Kampf – ✔ 7. Nov. (Beta 2): +25 % / +50 %, Eingraben zählt weniger | P2 | S–M |
| 66 | Städte als Verteidigungsbonus, stärkeres Niederhalten durch Artillerie – ✔ 7. Nov. (Beta 2) | P2 | S |

### 2.10 Einfachere Führung für den Spieler (P0 – gehört zu 2.9)
Wenn das Spiel langsamer und taktischer wird, darf es nicht mehr Klickarbeit werden. Weniger, aber wertvollere Einheiten
helfen schon; dazu soll der Spieler in **Kampfgruppen** denken statt in Einzeleinheiten.

| # | Funktion | Prio | Aufwand |
|---|---|---|---|
| 67 | **Kampfgruppen-Vorlagen:** eine ganze Gruppe (z. B. „Mechanisierte Kampfgruppe“, „Panzerkampfgruppe“, „Artilleriebatterie“) mit einem Tippen rekrutieren; sie erscheint direkt als Armee – ✔ 2. Nov. (Beta 1) | P0 | M |
| 68 | **Gruppen-Haltungen per Knopf:** Halten/Eingraben, Vorrücken, Angreifen, Rückzug bei X % Verlusten – die Gruppe führt den Rest selbst aus – ✔ 2. Nov. (Beta 1) | P0 | M |
| 69 | **Automatische Rollen in der Gruppe:** Artillerie hält Abstand und feuert auf Sicht, Flak, Sanitäter und Versorgung folgen von selbst – ✔ 2. Nov. (Beta 1) | P0 | M |
| 70 | **Armee-Übersicht:** Liste aller Kampfgruppen mit Stärke, Zustand und Auftrag; Tippen springt hin – ✔ 2. Nov. (Beta 1) | P0 | S–M |
| 71 | Automatisches Auffrischen: Verluste werden in der nächsten passenden Institution nachgebaut (abschaltbar) – ✔ 6. Nov. (Beta 2) | P1 | M |
| 72 | Daueraufträge in der Produktion und Unterhalt-Anzeige mit Warnung, wenn die Einnahmen nicht reichen – ✔ 6. Nov. (Beta 2) | P1 | S |
| 73 | Gebündelte Meldungen je Gruppe („Kampfgruppe 2 wird angegriffen“, „Ziel erreicht“, „zieht sich zurück“) – ✔ 5. Nov. | P1 | S |

---

## 3. Fehlende Einheiten und Gebäude

Vorhanden: Infanterie, Spezialkräfte, Scharfschützen, Aufklärer, Panzerabwehr, Pioniere, Sanitäter, Mörser, Fallschirmjäger,
Lkw, Transportpanzer, Schützenpanzer, leichter Panzer, Flugabwehr (Kurzstrecke), weitreichende Flugabwehr (Patriot / S-400),
Feldartillerie, Kampfpanzer, Jagdpanzer, Panzerhaubitze, Raketenwerfer (kurz/lang), Transport- und Kampfhubschrauber,
Transportflugzeug, Kampfjet, Bomber, Aufklärungsdrohne, Kamikaze-Drohnentrupp, Korvette, U-Boot, Zerstörer,
Flugzeugträger, Atom-U-Boot, Landungsschiff.

### 3.1 Einheiten (Vorschläge, du entscheidest – Frage F7)
Überarbeitet am 4. November 2026 auf Wunsch nach neuen Einheiten. Jede neue Einheit braucht West- und Ost-Modell, Werte,
Texte DE/EN und KI-Einbindung.

**Top 4 – für Beta 1 umgesetzt** (passen zu „taktisch statt Spam“ und nutzen Kampfgruppen und Raketen, die es schon gibt):

| Einheit | Vorbild West / Ost | Rolle im Spiel | Warum | Prio |
|---|---|---|---|---|
| **Aufklärungsdrohne** | MQ-9 Reaper / Orion | langsam, billig, sehr große Sichtweite, unbewaffnet | passt zu 2026; erkennt KI-Offensiven früh (ergänzt die Vorwarnung) | P1 |
| **Kamikaze-Drohne** | Switchblade / Lancet | Einweg-Präzisionsschlag mit hohem Schaden gegen ein Fahrzeug | billiges Mittel gegen Panzer, auch für kleine Länder | P1 |
| **Weitreichende Flugabwehr** | Patriot / S-400 | schützt ein großes Gebiet, fängt feindliche Raketen ab | Gegenstück zu den Raketen, die heute kaum abzuwehren sind | P1 |
| **Landungsschiff** | San-Antonio-Klasse / Iwan-Rogow | trägt eine ganze Kampfgruppe, landet an jeder Küste | Landungen als echte Mechanik (Inseln: Taiwan, Großbritannien, Japan) | P1 |

**✔ Alle vier umgesetzt (4. Nov.).** Entschieden: Drohnen kommen vom **Flugplatz** (keine eigene Fabrik), Patriot / S-400
ist eine **eigene Einheit** (Rüstungswerk Stufe 3). KI-Landungen mit dem Landungsschiff ✔ 5. Nov. (eigene Operation neben den Offensiven, Inseln zuerst, Vorwarnung).

**Weitere Kandidaten (Beta 2):**

| Bereich | Einheit | Rolle im Spiel | Prio |
|---|---|---|---|
| Land | **Elektronische Kampfführung** (EloKa-Fahrzeug) | stört Drohnen, Radar, Lenkwaffen in der Nähe | P2 |
| Land | **Hauptquartier / Gefechtsstand** | Bonus für Armee in Reichweite, lohnendes Ziel für den Feind | P2 |
| Land | **Küsten-Seezielbatterie** (NSM / Bastion) | Küstenverteidigung | P2 |
| Land | **Brückenleger / Minenleger / Minenräumer** | Flüsse, Sperren, Verteidigungslinien | P2 |
| Land | **Bergepanzer** | repariert/birgt Panzer | P3 |
| Luft | **Erdkampfflugzeug** (A-10 / Su-25) | billiger und robuster als der Kampfjet gegen Bodentruppen | P2 |
| Luft | **AWACS** | Luftlagebild, Bonus für Jäger | P2 |
| Luft | **Tarnkappen-Jäger** | schwer zu orten, teuer | P2 |
| Luft | **Tankflugzeug** | größere Reichweite für Jets | P3 |
| See | **Fregatte** (U-Jagd/Flugabwehr) | Lücke zwischen Korvette und Zerstörer | P2 |
| See | **Schnellboot, Minensucher** | Küstenkrieg | P3 |
| Infanterie | **Marineinfanterie** | Landungsbonus (passt zum Landungsschiff) | P2 |
| Infanterie | **Gebirgsjäger** | Geländebonus (braucht erst Gelände, F14) | P3 |

### 3.2 Gebäude / Institutionen
| Gebäude | Wirkung | Prio |
|---|---|---|
| **Bunker / Befestigungslinie** | Verteidigungsbonus, macht Fronten planbar | P1 |
| **Nachschubdepot** | versorgt Armeen in Reichweite (Basis für Nachschublinien, siehe 4) | P1 |
| ~~**Drohnenfabrik**~~ | entfällt: Drohnen kommen vom Flugplatz (Entscheidung 4. Nov., siehe 3.1) | – |
| **Raffinerie / Kraftwerk** | mehr Öl bzw. Industrie, lohnende Angriffsziele | P2 |
| **Lazarett** | heilt Infanterie, weniger Verluste | P2 |
| **Geheimdienstzentrale** | Spionage, Sabotage, Vorwarnung (siehe 16) | P2 |
| **Forschungszentrum ausbauen** | echter Technologiebaum statt nur Atomwaffen (siehe 4) | P1 |
| **Küstenbatterie, Flughafen (zivil), Propagandaministerium** | Spezialrollen | P3 |

---

## 4. Die langweilige Mitte und das Ende beheben

Ursachen im aktuellen Code: Der Gegner ist ein einziges Bündnis; sobald der Spieler vorne liegt, gibt es keine neuen
Herausforderungen. Die KI schickt Wellen zur nächstgelegenen Provinz, wird mit weniger Provinzen schwächer
(Schneeball-Effekt). Es fehlen Ziele zwischen „Start“ und „alles erobert“.

Vorschläge (bitte bei F3 auswählen):

| # | Mechanik | Wirkung gegen Langeweile | Prio |
|---|---|---|---|
| 43 | **Technologiebaum** (z. B. 4 Zweige × 5 Stufen: Panzer, Luft, See, Raketen/Elektronik) | neue Einheiten und Stufen im späten Spiel, langfristige Ziele | P1 |
| 44 | **Eskalation:** Weitere Länder treten nach Ereignissen in den Krieg ein (gegen den Stärksten) – ✔ 11. Nov. (Beta 2): ab 12 netto eroberten Siegpunkten, mit Vorwarnung, Schalter im Setup | Neue Gegner, wenn man zu stark wird | P1 |
| 45 | **Besatzung und Widerstand:** eroberte Provinzen bringen anfangs wenig, Aufstände/Partisanen, Garnison nötig | Erobern kostet etwas, schnelles Durchrollen wird gebremst | P1 |
| 46 | **Nachschublinien:** Armeen weit weg von Depots/Häfen verlieren Munition und Kampfkraft | Planung statt Spam, Fronten statt Blobs | P2 |
| 47 | **Kriegsmüdigkeit / Moral der Nation:** hohe Verluste senken Einkommen, Siege heben es | Verluste haben Folgen | P2 |
| 48 | **Missionen und Ziele** während der Partie (Hafen X halten, Hauptstadt in 20 min, Konvoi schützen) mit Belohnungen | ständig kurzfristige Ziele | P1 |
| 49 | **Ereignisse:** Wetter, Sanktionen, Ölkrise, Putsch, Waffenlieferung, Atomalarm | Abwechslung, Entscheidungen | P2 |
| 50 | **Erfahrung / Veteranen-Einheiten und Generäle** | Bindung an eigene Armeen, Anreiz sie zu schonen | P2 |
| 51 | **Gegenoffensiven der KI** in festen Abständen, Spitzen-KI-Einheiten im Endspiel | Druck bleibt bestehen | P1 |
| 52 | **Siegpunkte / Waffenstillstand:** Partie kann mit Punktesieg enden, statt jede letzte Einheit zu jagen (✔ Beta 1) | kein zähes Aufräumen am Ende | P1 |
| 53 | **Automatisierung:** Fronten an „Generäle“ (Hilfs-KI) übergeben | weniger Klickarbeit bei großen Reichen | P2 |
| 54 | **Diplomatie (einfach):** Bündnisangebote, Frieden, Kriegserklärung, Waffenlieferungen | Politische Ebene | P2 |

---

## 5. Aufs Handy bringen – Schritt für Schritt erklärt

Das Spiel ist eine reine Web-App (HTML/CSS/JS, keine Abhängigkeiten). Es gibt zwei Wege aufs Handy, die sich ergänzen:

### 5.1 Weg A: Web-Version + „Zum Startbildschirm hinzufügen“ (PWA) – schnellster Weg
1. **Online stellen** (siehe 7). Die Seite muss über `https://` erreichbar sein.
2. ~~**Service Worker**~~ – erledigt (3. Nov.): `sw.js` speichert alle Spieldateien zwischen. Online wird jede Datei
   kurz beim Server nachgefragt (neue Version sofort beim nächsten Start), offline kommt die gespeicherte Kopie.
   Neue Dateien in `FILES` eintragen und `CACHE` hochzählen; der Selbsttest bricht ab, wenn eine Datei fehlt.
3. `manifest.webmanifest`: Name, `display: fullscreen` und `orientation: any` (seit 5. Nov. nicht mehr auf Querformat
   gesperrt, damit Tablets auch im Hochformat drehen) sind gesetzt. Offen: Symbole als PNG in 192 und 512 px (heute nur
   `assets/icon.svg`), die manche Android-Versionen für das Startbildschirm-Symbol brauchen.
4. Auf dem Handy die Seite in Chrome öffnen → Menü → **„Zum Startbildschirm hinzufügen“**. Es erscheint ein App-Symbol,
   das Spiel startet im Vollbild wie eine App.
5. Vorteil: Updates kommen automatisch. Nachteil: nicht im Play Store.

### 5.2 Vor jedem Handy-Release: mobil tauglich machen (P1)
- Auf echtem Gerät testen (Android mit Chrome → am PC `chrome://inspect` für Konsole und Leistung).
- Bedienelemente mindestens 44 px groß, Hochformat-Fehler (#26) beheben, Ränder für Kamera-Ausschnitt (`safe-area-inset`).
- Leistung: Zielwert 30+ FPS auf Mittelklasse-Handy; Grafikqualität-Einstellung (Effekte/Schatten aus).
- Speichern beim Wechsel in den Hintergrund (`visibilitychange`), weil Android Apps jederzeit beendet.
- Bildschirm wach halten während des Spiels (Wake Lock).

---

## 6. APK bauen (Android-App) – Schritt für Schritt

Werkzeug: **Capacitor** (verpackt die Web-App in eine Android-Hülle). Einmalige Vorbereitung am PC:

1. **Installieren:** Node.js (LTS), **Android Studio** (mit Android SDK und einem Emulator), Java JDK 17 (kommt mit Android Studio).
2. **Projekt vorbereiten:** Die Spieldateien in einen Ordner `www/` kopieren lassen (ein kleines Skript; Werkzeuge wie
   `tools/` gehören nicht in die App).
3. **Capacitor einrichten** im Projektordner:
   ```
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Iron Meridian" com.ironmeridian.game --web-dir www
   npx cap add android
   ```
4. **Bei jeder Änderung:** `npx cap sync` (kopiert `www/` in die Android-App).
5. **Testen:** `npx cap open android` öffnet Android Studio → grüner Play-Knopf startet die App im Emulator oder am
   per USB verbundenen Handy (dort „Entwickleroptionen“ und „USB-Debugging“ einschalten).
6. **APK erzeugen:** In Android Studio **Build → Build Bundle(s)/APK(s) → Build APK**. Die Datei liegt dann unter
   `android/app/build/outputs/apk/debug/app-debug.apk` und kann direkt aufs Handy kopiert und installiert werden
   („Installation aus unbekannten Quellen“ erlauben).
7. **Für den Play Store:** **Build → Generate Signed Bundle** (`.aab`), dafür einmal einen Signaturschlüssel anlegen und
   **sicher aufbewahren** (ohne ihn keine Updates). Google-Play-Entwicklerkonto: einmalig 25 US-Dollar, dazu Datenschutzerklärung,
   Screenshots, Altersfreigabe (Kriegsspiel → Fragebogen), bei neuen Konten Testphase mit Testern.
8. **App-Feinheiten:** Querformat erzwingen, Vollbild, Zurück-Taste öffnet Pausemenü, App-Symbol und Startbild (Splash),
   Spielstände über Capacitor-Speicher sichern (Android löscht WebView-Speicher selten, aber möglich).

Aufwand gesamt: M (erstes Mal), danach S pro Update.

---

## 7. Live-Version im Web

| Anbieter | Kosten | Eignung |
|---|---|---|
| **itch.io** | kostenlos | Ideal für Spiele: Seite mit Bildern, Feedback, Community, spielbar im Browser (ZIP hochladen) |
| **GitHub Pages** | kostenlos | Einfach, wenn der Code auf GitHub liegt; automatische Veröffentlichung bei jedem Push |
| **Netlify / Cloudflare Pages** | kostenlos | Eigene Domain leicht möglich, schnelle Auslieferung weltweit |

Schritte (Beispiel GitHub Pages):
1. ~~Git-Repository anlegen~~ – erledigt (papoch295/ironmeridian, öffentlich).
2. ~~Pages aktivieren~~ – erledigt: **https://papoch295.github.io/ironmeridian/**, Link steht oben in der README.
3. ~~Service Worker (5.1)~~ – erledigt.
4. Optional eigene Domain, Versionsanzeige im Hauptmenü, Kanal für Feedback (Formular oder Discord).

---

## 8. Kommende Ideen (nach der Beta)

- Mehrspieler (zuerst „Hot Seat“ oder asynchron, später online) – braucht einen Server.
- Szenario-Editor: eigene Lagen bauen und teilen.
- Erfolge/Achievements, Ranglisten für Szenarien.
- Historische Kampagnen (z. B. „Golfkrieg 1991“) mit älteren Einheiten.
- Wetter und Tag/Nacht mit Wirkung auf Sicht und Luftwaffe.
- Wirtschaft vertiefen: Handel, Rohstoffe, Embargos.
- Modding: Einheiten als Datendateien, die Spieler ändern können.
- iOS-Version (gleicher Capacitor-Weg, braucht einen Mac und 99 US-Dollar/Jahr).

---

## 9. Plan: Beta 1 zur Uni-Abgabe, danach Beta 2

Festgelegt am 2. November 2026 nach deinen Antworten (Abschnitt 10). Gearbeitet wird täglich.

**Rahmen aus deinen Antworten:** vorerst kostenlos und ohne Werbung; Android-Handy zum Testen ist vorhanden; GitHub-Konto,
Android Studio und Google-Play-Konto fehlen noch. Vorbild neben World Conqueror 4 und WARNO: **Supremacy: World War 3 /
Conflict of Nations** (moderne Weltkarte, Provinzen, Bündnisse, Forschung, Spionage, auf Handy spielbar).

### Beta 1 – Uni-Abgabe (✔ abgegeben am 7. Nov. 2026 als `v1.2-beta`)
Alles, was die Abgabe stabil, vorführbar und spürbar besser macht. Reihenfolge = Arbeitsreihenfolge.

**Stand 2. Nov.:** Schritt 1 erledigt (Repository auf GitHub: papoch295/ironmeridian, öffentlich): Spielstände (Namen,
Löschen, IndexedDB, Migration, 3 Autosaves, Speichern im Hintergrund), Fehlerfang mit Notfall-Spielstand,
Hochformat-Leiste, automatischer Testlauf `node tools/selftest.js`.
Schritt 2 erledigt: jedes Land eine eigene Fraktion (Wirtschaft, KI), Bündnisse als Teams, Spieler steuert nur sein
Land, Verbündete per KI, freie Länderwahl (auch ohne Bündnis), Modi „Bündniskrieg“ und „Weltkrieg“, Kriegserklärung
an neutrale Länder mit Mobilmachung und Reaktion der Nachbarn, alte Spielstände werden umgewandelt.
Schritt 3 erledigt: feste Offensiven im Takt der Schwierigkeit (Leicht alle 8, Normal 6, Schwer 4 Spielminuten), erst
Sammeln an einer Grenzprovinz (2,5 / 2 / 1¼ Minuten), dann gemeinsamer Angriff; eine Hauptachse, die bis zum Fall des
Ziels gleich bleibt, plus kleiner Nebenangriff; dazwischen nur Verteidigung. Sehen eigene oder verbündete Einheiten bzw.
Radar das Sammeln, kommt die Meldung „Aufklärung: … sammelt Truppen“ und ein roter Pfeil Sammelort → Ziel.
Schritt 4 erledigt: Tempo langsamer (Bewegung ×0,75, Eroberung 10 + 5 s je Stufe, Bauzeiten ×0,7), **Unterhalt**
(1,5 % des Preises in Geld und 3 % des Öls pro Minute, Anzeige netto mit Aufschlüsselung im Tooltip; KI rekrutiert nur, was
sie bezahlen kann), **Eingraben** (bis −40 % Schaden nach 75 s Stillstand, Artillerie ignoriert die Hälfte; Sandsack-Bogen
unter der Einheit), **KI-Kampfgruppen** (1–4 gemischte Gruppen à 5–9 Einheiten statt einem Schwarm) mit Phasen
Aufklärung → Artillerie-Vorbereitung → Sturm → Halten und **Rückzug** bei mehr als 55 % Verlusten (Meldung an den Spieler).
Werte zum Feintuning: `MOVE_SCALE`, `CAPTURE_TIME`, `UPKEEP`, `DIG` in `js/data/units.js`.
Schritt 5 erledigt: gemeinsame Gruppen-Taktik für KI und Spieler (`js/core/tactics.js`). **Kampfgruppen-Vorlagen**
(Infanterie-, Mech.- und Panzer-Kampfgruppe mit Aufklärer, Mörser/Flak/Versorgung; Artilleriebatterie, Luftlandezug) mit
Unterhaltsanzeige auf jeder Rekrutierungskarte. Ist eine ganze Armee gewählt, stehen vorn in der Befehlsleiste
**Großangriff** (Anmarsch → Aufklärung → Artillerie → Sturm → Halten), **Vorrücken** und **Halten**; Flak, Sanitäter und
Versorgung folgen selbst, Artillerie bleibt in Reichweite; **Rückzug bei Verlusten** ist je Armee schaltbar. Die
Armee-Leiste und das Armee-Panel zeigen Auftrag/Phase und Kampfkraft; Meldungen bei Rückzug und eingenommenem Ziel.
Ein direkter Befehl hebt den Auftrag auf.
Web: Das Spiel läuft unter **https://papoch295.github.io/ironmeridian/** (GitHub Pages, aktualisiert sich bei jedem Push).
Schritt 6 erledigt (3. Nov.): Service Worker `sw.js` – Web-Version startet auch offline, Updates sind beim nächsten
Start da (Netz zuerst, Cache als Rückfall). Der Selbsttest prüft, dass jede Datei aus `index.html` im Offline-Cache steht.
Einstieg überarbeitet (3. Nov., nach Gesamtdurchsicht): Der Spieler startet mit 1–3 fertigen, gemischten Armeen (vorn an
der Front, die letzte an der Hauptstadt) statt mit losen Einzeleinheiten; „Kampfgruppen“ ist der erste, vorgewählte
Rekrutierungs-Reiter; Armee-Befehle erscheinen sofort nach „Neue Armee“; Tutorial-Texte erklären Armeen; Menü zeigt „Beta“.
Handy-Layout (3. Nov.): Seitenfenster schmaler und per Knopf einklappbar (nur Titelzeile bleibt); Befehlsleiste auf
kleinen Bildschirmen zweistufig (Hauptbefehle + „Mehr“), im Hochformat zweizeilig statt Überlauf; Schnellleiste
zweispaltig; Setup mit festem Fußbereich, Schwierigkeit vor der Feindliste; Ziel-Anzeige „Erobert 0 / 50“; neue Symbole
für Bodentruppen und Untätige; keine Tastatur-Hinweise auf Touch-Geräten.
Schritt 7 erledigt (3. Nov.): interaktives Tutorial mit 12 Schritten. Es startet aus dem Menü direkt (Deutschland,
Leicht), hebt den jeweils gemeinten echten Knopf golden pulsierend hervor und geht bei Handlungsschritten erst nach der
Aktion weiter: Armee 1 wählen, Halten, Großangriff auf eine rote Provinz, Zeit starten, Hauptstadt öffnen,
Kampfgruppe rekrutieren, Ziele öffnen. Der Tipp-Kasten weicht Fenster und Befehlsleiste aus (Quer-, Hochformat, Desktop).
Schritt 8 erledigt (3. Nov.): **Punktesieg**. Jede Provinz bringt Siegpunkte (Hauptstadt 5, Stadt/Hafen/Industrie/Ölfeld 2,
Luftwaffenbasis 1). Haben Spieler und Verbündete den Gegnern 70 % ihrer Siegpunkte abgenommen und halten das 1 Spielminute,
kapitulieren sie (Waffenstillstand, eigener Endtext). Umgekehrt kapituliert das eigene Land, wenn der Feind mehr als 70 %
seiner Heimat-Siegpunkte 1 Minute lang hält. Countdown als Banner unter der Leiste, Meldungen bei Beginn und Abbruch,
Ziele-Fenster mit Siegpunkt-Balken und Schwelle (scrollt auf kleinen Bildschirmen). Totaler Sieg/Niederlage gelten weiter
sofort. Werte: `VICTORY` und `vp` in `PROVINCE_TYPES` (`js/data/units.js`). Der Selbsttest prüft Countdown, Abbruch,
Punktesieg und Kapitulation.
Nachtrag 4. Nov. (nach den Testpartien): Im **Weltkrieg** war die 70 %-Regel unerreichbar, weil die ganze Welt als
Feindgebiet zählt. Dort gilt jetzt der **Weltmacht-Sieg**: das eigene Bündnis hält 25 % aller Siegpunkte der Welt (zuerst 35 %, nach Nachtest gesenkt) eine
Minute lang (`VICTORY.world`). Ziele-Fenster, Endbildschirm und Setup-Text passen sich an; der Selbsttest prüft auch das.

**Neu priorisiert am 2. Nov.:** Taktisches Gameplay (2.9) und einfachere Führung (2.10) haben **P0** und kommen direkt
nach Schritt 3. Die Eskalation rutscht nach Beta 2, vom alten Schritt 4 bleibt nur der Punktesieg.

| Schritt | Inhalt | Punkte | Stand |
|---|---|---|---|
| 1. Fundament | GitHub-Konto (du) + Repository (ich), Spielstände mit Namen, **Löschen**, IndexedDB, Migration nach Updates, rotierende Autosaves, Fehlerfang, automatischer Testlauf, Hochformat-Fehler | #10–#13, #26, #37, #39 | erledigt |
| 2. Mehr-Seiten-Kern | beliebig viele Fraktionen, **freie Länderwahl** (alle außer Zwergstaaten wie Vatikan), **Jeder gegen jeden** mit Bündnissen, neutrale Länder angreifbar und Nachbarn reagieren, KI je Fraktion | #1–#5, #21 | erledigt |
| 3. KI-Angriffsmuster | **feste Angriffsmuster** (Achsen, Zeitpunkte), einfache Vorwarnung durch Aufklärung | #16, #17 | erledigt |
| **4. Taktisches Gameplay (P0)** | **Unterhalt**, **langsameres Tempo**, **Eingraben**; KI mit **Kampfgruppen**, **Angriff in Phasen**, **Rückzug bei Verlusten** | #55–#60 | erledigt |
| **5. Einfachere Führung (P0)** | **Kampfgruppen-Vorlagen** (eine Gruppe mit einem Tippen), **Gruppen-Haltungen** per Knopf, **automatische Rollen** in der Gruppe, **Armee-Übersicht** | #67–#70 | erledigt |
| 6. Web live | Veröffentlichung auf GitHub Pages, Service Worker für Offline und saubere Updates | 5.1, 7 | erledigt |
| 7. Tutorial | interaktives Tutorial in einfacher Fassung (Hervorhebungen, Schritt erst nach Aktion), erklärt Kampfgruppen und Haltungen | #28 | erledigt |
| 8. Punktesieg | Partie endet mit Punktesieg statt Aufräumen bis zur letzten Einheit | #52 | erledigt |

Reihenfolge innerhalb von Schritt 4: erst Tempo, Unterhalt und Eingraben (Regeln, die für alle gelten), dann die
KI-Kampfgruppen darauf abstimmen; Balance jeweils per Testskript KI gegen untätigen Spieler und KI gegen KI.
Schritt 5 kann parallel zu den KI-Kampfgruppen entstehen, weil KI und Spieler dieselbe Gruppen-Logik nutzen sollen.

Puffer: Wenn die Zeit knapp wird, fällt zuerst Schritt 8 weg, dann wird Schritt 7 auf eine verbesserte Textfassung
reduziert, danach rutschen #60 (Rückzug) und #70 (Armee-Übersicht) nach Beta 2. Schritte 4 und 5 im Kern sowie 6 sind gesetzt.

**Bis zur Abgabe (Vorschlag vom 4. Nov.):** keine großen neuen Funktionen mehr, stattdessen absichern und vorzeigbar machen.

| Schritt | Inhalt | Stand |
|---|---|---|
| 9. Dokumentation | README und Roadmap auf Beta 1, kurze Spielanleitung, Screenshots, Quellen/Lizenzen (Natural Earth), `CHANGELOG.md` | erledigt (`SPIELANLEITUNG.md`, `QUELLEN.md`, `docs/screenshots/`) |
| 10. Handy-Test (vorgezogen aus Beta 2) | Web-Version auf deinem Android testen: FPS, Bedienung, Hoch-/Querformat, Offline-Start | erledigt (Nachtest ohne Fehler) |
| 11. Testpartien | je Modus 3 Partien bis zum Ende, Ergebnisse und FPS als kurzes Testprotokoll festhalten | erledigt (TESTPROTOKOLL.md, Abschnitte 6–7) |
| 12. Abschluss | sichtbare Versionsnummer, git-Tag als Abgabestand, danach auf `main` nur Fehlerbehebung | erledigt: Beta 1.2 mit Tag `v1.2-beta` (5. Nov., ersetzt `v1.1-beta`) als Abgabestand, danach nur Fehlerbehebung |
| optional | gebündelte Meldungen (#73) vorziehen, falls Zeit bleibt; APK nur, falls die Uni eine installierbare App verlangt | #73 erledigt (5. Nov.); APK für die Abgabe **nicht nötig** (Entscheidung 5. Nov.: Web-App reicht), kommt in Beta 2 |
| optional | **neue Einheiten** vor dem Freeze: Top 4 aus Abschnitt 3.1 (Aufklärungsdrohne, Kamikaze-Drohne, Patriot/S-400, Landungsschiff) | erledigt |

**Nachtrag 4. Nov.:** Bedienung von Luftwaffe und Raketen verbessert (Luftwaffen- und Raketen-Fenster, Dauereinsatz,
Reichweitenkreise). Erster Handy-Test: Es ruckelte, und im Querformat lagen Befehlsknöpfe hinter anderen Fenstern. Behoben:
Die Schnellleiste endet über der Befehlsleiste (scrollt bei vielen Armeen), die Befehlsleiste nutzt die volle Breite; die
Karte wird beim Verschieben/Zoomen nur verschoben statt neu gezeichnet (am PC ca. 2 statt 11–17 ms pro Bild), Nebel
schneller, Touch-Geräte zeichnen mit 1,5-facher Auflösung. Nachtest auf dem Handy: keine Fehler.
Testpartien mit den neuen Einheiten (6 × 120 min, KI gegen KI): stabil; der Kamikaze-Drohnentrupp war zu stark
(21 % aller Abschüsse) und wurde abgeschwächt (jetzt 5 %), Details in `TESTPROTOKOLL.md`.

**7. Nov.: Beta 1.2 (`v1.2-beta`) ist fertig und an der Uni abgegeben.** Ab jetzt wird nur noch an Beta 2 gearbeitet.

### Beta 2 und folgende – Dezember 2026 bis Februar 2027 (begonnen 6. Nov.)
| Block | Inhalt | Punkte |
|---|---|---|
| **Zuerst: Transport** (Notiz 5. Nov.) – ✔ auf Branch `beta2-transport` | Transport mit Flugzeug/Helikopter weiter vereinfachen; bessere UI, um einzelne Flugzeuge/Helikopter zu unterscheiden (voll/leer, welche Truppen an Bord); mehr Kapazität für alle Transporte (Land, Luft, Wasser) | aus Notiz 5. Nov. |
| Regiment-Steuerung – ✔ 6. Nov. auf Branch `beta2-transport` | Mehrere Armeen gemeinsam führen, Zusammenlegen, Soll-Bestand mit Anzeige der Lücken, Auffrischen, Daueraufträge, Unterhalt-Warnung | Notiz 5. Nov., #71, #72 |
| Taktik ausbauen – ✔ 7. Nov. auf Branch `beta2-transport` | Kommandolimit, teurere schwere Einheiten, KI-Frontabschnitte, echte Umfassung, Flanken- und Rückenbonus, Städte als Verteidigung | #61–#66 |
| **Jetzt: Spieltiefe** (seit 11. Nov.) | ✔ **Eskalation** (11. Nov.). Danach in dieser Reihenfolge (Entscheidung 11. Nov.): Kriegsmüdigkeit (#47) und Veteranen (#50), Ereignisse (#49), Gegenoffensiven (#51), Missionen (#48), Besatzung und Widerstand (#45), Technologiebaum (#43), Nachschublinien (#46), zuletzt Automatisierung und Generäle (#53) | #43–#51, #53 |
| Diplomatie & Spionage | Krieg/Frieden/Bündnis, Spionage deckt KI-Angriffsmuster auf, Geheimdienstzentrale | #54, #16, 3.2 |
| Optik | Luftfahrzeuge, Schiffe und Infanterie im Referenzstil, Gefechtseffekte, Menüs | #32, #33, #35 |
| Bedienung | strategische Übersicht (Frontlinien, Armeepfeile), Ereignis-Meldungen, ausführliches Tutorial (Armee-Befehle sind in Beta 1 als #68 enthalten) | #22, #23, #25, #29–#31 |
| Notiz 5. Nov. – begonnen | **Einheitenmodelle** realistischer, aber im WC4-Stil, nach Referenzbildern. ✔ 10 Modelle (5. Nov.): Bradley, Abrams, Apache, Reaper, Spezialkräfte, T-90M, BMP-3, Ka-52M, Orion, Spetsnaz; die übrigen Einheiten sind offen | aus Notiz 5. Nov., #32 |
| Notiz 5. Nov. – Taktik | Gameplay taktischer: Einheiten müssen ihrer Beschreibung gerecht werden; klare Aufgabenverteilung und Trennung der Rollen | aus Notiz 5. Nov., ergänzt 2.9 |
| Notiz 5. Nov. – Inhalt | Neue Einheiten + Gebäude | aus Notiz 5. Nov., Abschnitt 3 |
| Mobil – **ans Ende gestellt** (Entscheidung 11. Nov.: Spieltiefe geht vor) | Handy-Tests auf deinem Android, Android Studio einrichten, APK über Capacitor, PNG-Symbole 192/512 px | 5.2, 6 |
| Später (laut deinen Antworten) | Szenarien mit Briefing, neue Einheiten/Gebäude, mehr Wirtschaft, Gelände und Wetter, Folgen von Atomwaffen, KI-Regeln auf Schwer, Play Store | #6, Abschnitt 3, F8, F14–F16 |

**Nachtrag 7. Nov. (Taktik ausbauen):** Werte in `js/data/units.js` (`FLANK`, `COVER`, `ARTY_SUP`, `CMD`) und `DIFFICULTY`
(`cmd`, `sup`, `flank`). Vergleich alt/neu, untätiger Spieler (Deutschland gegen Eurasien, 40 Spielminuten): auf Normal hält
das eigene Bündnis 12–18 statt 12–15 Provinzen bei weniger Verlusten (Deckung, Frontabschnitte, Übermacht-Regel); auf Schwer
ist die KI dank häufiger Umfassungen deutlich gefährlicher (9–11 statt 15–16 Provinzen). Selbsttest ohne Fehler.

---

## 10. Entscheidungen (Fragebogen vom 2. Nov., alle beantwortet)

Deine Antworten stehen jeweils am Ende der Frage. Neue offene Fragen kommen ans Ende dieses Abschnitts.

**Rahmen**
- **F1** Passen die Beta-Kriterien in Abschnitt 1? Was fehlt, was ist zu viel? Woran erkennst du „fertig und richtig“? spielstände kann man löschen
- **F2** Wie viel Zeit pro Woche steckst du (und ich) hinein, und gibt es ein festes Zieldatum für die Beta? mind jeden tag erste abgabe mitte gegen ende nov
- **F11** Hast du schon: GitHub-Konto, Android Studio, ein Android-Handy zum Testen, ein Google-Play-Konto? Soll das Spiel
  kostenlos sein, später etwas kosten oder Werbung haben? kein git hub, muss man also einrichten, ich habe ein Android, vorerst kostenlos ohne werbung
- **F12** Ist das Uni-Projekt (Abgabe Mitte November) noch ein eigener Termin, für den vorher etwas fertig sein muss? das soll die erste beta stehen

**Spielmodi und Länder**
- **F4** Soll man jedes einzelne Land spielen können, auch Kleinstaaten wie Luxemburg? Oder nur Länder ab einer gewissen Größe? alle ausser Vatikan und dergleichen
- **F5** Im Modus „Jeder gegen jeden“: einzelne Länder gegeneinander (sehr viele Gegner) oder die festen Bündnisse gegeneinander? jedes land für sich aber trotzdem bündnisse
- **F6** Welche Szenarien wünschst du dir zuerst (Region, Zeit, Gegner)? Sollen Szenarien eine Geschichte/Briefing haben? Ja hat aber zeit bis nach der ersten beta
- **F13** Sollen neutrale Länder angreifbar sein, und reagieren dann ihre Nachbarn? ja

**Spielmechaniken (bitte jeweils Ja / Nein / Später)**
- **F3** Gegen die Langeweile (Abschnitt 4): Technologiebaum, Eskalation durch weitere Länder, Besatzung und Widerstand,
  Nachschublinien, Kriegsmüdigkeit, Missionen, Ereignisse, Veteranen/Generäle, Siegpunkte, Automatisierung, Diplomatie? ja
- **F8** Wie viel Wirtschaft soll es geben: so einfach wie jetzt, oder mehr (Handel, Rohstoffe, Bevölkerung)? später
- **F9** Diplomatie: gar nicht, einfach (Krieg/Frieden/Bündnis) oder ausführlich (Verträge, Handel, Spionage)? ja
- **F14** Gelände und Wetter: Sollen Wald, Gebirge, Flüsse, Städte und Wetter die Kämpfe beeinflussen? später
- **F15** Sollen Atomwaffen bleiben? Wenn ja: mit Folgen (Weltmeinung, Gegenschlag, Spielende)? später

**KI**
- **F10** „Bestimmte Angriffe erwarten können“: Reicht eine Vorwarnung („Feind sammelt sich bei X“), oder sollen
  Angriffe feste Muster/Zeitpunkte haben, die man lernen kann? feste nuster, kann auch durch Spionage erkannt werden
- **F16** Soll die KI schummeln dürfen (mehr Geld auf Schwer) oder immer nach denselben Regeln spielen wie du? später

**Einheiten und Optik**
- **F7** Welche neuen Einheiten und Gebäude aus Abschnitt 3 willst du? Fehlt eine, die dir besonders wichtig ist? später
- **F17** Sollen Flugzeuge, Schiffe und Infanterie ebenfalls im neuen Referenzstil neu gezeichnet werden? ja
- **F18** Gibt es Spiele (außer World Conqueror 4 und WARNO), deren Funktionen du dir zum Vorbild nehmen möchtest? ja, supremacy World war 3
  (im Fragebogen außerdem: Conflict of Nations – gleiches Spielprinzip)
