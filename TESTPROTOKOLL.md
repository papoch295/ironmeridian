# Iron Meridian – Testprotokoll Beta 1

Stand: 4. November 2026, Commit `39c797c` (Beta 1, alle acht Schritte erledigt).

## 1. Automatischer Selbsttest

`node tools/selftest.js 6 20` – headless Edge über `file://`, KI gegen untätigen Spieler, je 20 Spielminuten,
zur Halbzeit Kriegserklärung an einen neutralen Nachbarn (Bündniskrieg), danach Speichern/Laden-Vergleich.

| # | Land | Gegner | Modus | Stufe | Spielzeit | Einheiten gesamt | Ende | Ergebnis |
|---|---|---|---|---|---|---|---|---|
| 1 | EH | Nordafrikanische Union | Bündniskrieg | Leicht | 14 min | 63 | Niederlage | OK |
| 2 | IR | Ostafrikanischer Bund | Bündniskrieg | Normal | 20 min | 237 | – | OK |
| 3 | TN | alle | Weltkrieg | Schwer | 20 min | 1593 | – | OK |
| 4 | IT | Eurasische Union | Bündniskrieg | Leicht | 20 min | 231 | – | OK |
| 5 | BO | Westeurop. Verbund | Bündniskrieg | Normal | 20 min | 287 | – | OK |
| 6 | UY | alle | Weltkrieg | Schwer | 20 min | 1565 | – | OK |
| – | Punktesieg und Kapitulation (Countdown, Abbruch, Sieg, Kapitulation) | | | | | | | OK |

**Ergebnis: Exit-Code 0, keine Fehler, keine kaputten Werte, Spielstände nach Laden identisch, Offline-Cache vollständig.**

## 2. Partien bis zum Ende (KI gegen KI)

Im Vorschau-Browser (`localhost`) übernimmt die KI auch das Land des Spielers; die Partie läuft im Zeitraffer, bis sie
endet oder 120 Spielminuten erreicht sind. Je Modus 3 Partien. „Sieg %“ = Anteil der feindlichen Siegpunkte, den die
Spielerseite hält (Schwelle 70 %); „Heimat %“ = eigene Siegpunkte, die nicht besetzt sind.

| Land | Modus | Gegner | Stufe | Ende | Spielzeit | Sieg % | Heimat % | Einheiten max. |
|---|---|---|---|---|---|---|---|---|
| DE | Bündniskrieg | Westeurop. Verbund | Normal | Niederlage (alle Provinzen verloren) | 29 min | 0 | 0 | 237 |
| US | Bündniskrieg | Westeurop. Verbund | Normal | **Punktesieg** | 82 min | 78 | 100 | 247 |
| IN | Bündniskrieg | Ostasiatischer Pakt | Leicht | offen nach 120 min | 120 min | 31 | 100 | 144 |
| FR | Weltkrieg | alle | Normal | offen nach 120 min | 120 min | 13 | 100 | 982 |
| BR | Weltkrieg | alle | Normal | offen nach 120 min | 120 min | 2 | 100 | 955 |
| TR | Weltkrieg | alle | Leicht | offen nach 120 min | 120 min | 3 | 100 | 799 |

Keine Ausnahmen, keine Konsolenfehler, Werteprüfung (`SelfTest.check`) nach jeder Partie ohne Befund.

## 3. Befunde

1. **Stabilität: gut.** 12 Partien, insgesamt rund 13 Spielstunden, ohne Absturz, Hänger oder kaputten Spielstand.
2. **Weltkrieg ist nicht zu gewinnen.** Im Weltkrieg zählen die Siegpunkte *aller* Länder im Krieg als Feindgebiet.
   70 % der Welt zu halten ist praktisch unerreichbar; nach 2 Spielstunden lagen alle drei Partien bei 2–13 %.
   Die Siegbedingung muss für diesen Modus angepasst werden (Entscheidung offen, siehe unten).
3. **Bündniskrieg endet**, aber unterschiedlich schnell: ein Punktesieg nach 82 min, eine Niederlage nach 29 min,
   eine Partie nach 120 min erst bei 31 %. Die KI auf Spielerseite ist ein schwacher Angreifer; ein Mensch mit
   Großangriff kommt voraussichtlich schneller voran. Die 29-min-Niederlage von Deutschland kam als Totalverlust,
   bevor der Kapitulations-Countdown (1 min) greifen konnte – korrekt, aber auffällig schnell.
4. **Viele Einheiten im Weltkrieg:** 800–1000 Einheiten auf Normal, bis 1600 auf Schwer. Auf dem PC unkritisch für
   die Simulation; auf dem Handy muss die Bildrate damit geprüft werden.
5. **Nicht gemessen:** Bildrate (FPS). Die Vorschau lief verdeckt, daher keine aussagekräftigen Werte. Das gehört in
   den Handy-Test (Schritt 10).

## 4. Änderung: Weltmacht-Sieg im Weltkrieg

Entscheidung 4. Nov.: Variante A. Im Weltkrieg gewinnt, wessen Bündnis **einen Anteil aller Siegpunkte der Welt** eine Minute
lang hält (`VICTORY.world` in `js/data/units.js`, zunächst 35 %, jetzt 25 %). Zu Beginn hält jedes Bündnis höchstens etwa 5 %. Ziele-Fenster
(„Anteil an der Welt 13 % / 35 %“), Endbildschirm und Setup-Text sind angepasst (DE/EN). Selbsttest
`node tools/selftest.js 3 20`: Exit-Code 0, inklusive neuem Test für den Weltmacht-Sieg.

Nachtest im Weltkrieg (KI führt auch das Spielerland, bis 180 Spielminuten):

| Land | Stufe | Start | 60 min | 120 min | 180 min | Ende |
|---|---|---|---|---|---|---|
| FR | Normal | 4 % | 9 % | 12 % | 13 % | offen |
| BR | Normal | 3 % | 7 % | 8 % | – | offen (Test abgebrochen) |

Der Anteil wächst anfangs und flacht dann ab. Mit KI-Führung sind 35 % in drei Spielstunden nicht erreichbar.
**Daher am 4. Nov. auf 25 % gesenkt** (etwa das Fünffache des Startwerts). Selbsttest danach: Exit-Code 0.
Eine echte Weltkrieg-Partie von Hand steht noch aus und zeigt, ob 25 % in 2–3 Spielstunden passt.

---

# Nachtest 4. November 2026 – Handy-Korrekturen und vier neue Einheiten

Stand: Commit `4252345` (Aufklärungsdrohne, Kamikaze-Drohnentrupp, Patriot / S-400, Landungsschiff) plus Balance-Anpassung.

## 5. Handy-Test (Android, Chrome, Web-Version)

1. Test: Ruckeln beim Verschieben/Zoomen, im Querformat lagen Befehlsknöpfe hinter der Schnellleiste bzw. dem Seitenfenster.
Behoben (Commit `811832f`), Nachtest auf dem Handy inklusive der neuen Einheiten: **keine Fehler**.

## 6. Partien KI gegen KI mit den neuen Einheiten (120 Spielminuten)

Gleiches Verfahren wie Abschnitt 2 (KI führt auch das Spielerland). „Sieg %“ wie oben; im Weltkrieg Anteil an allen
Siegpunkten der Welt (Schwelle 25 %).

| Land | Modus | Gegner | Stufe | Ende | Sieg % nach 30 / 60 / 90 / 120 min | Heimat % | Einheiten max. |
|---|---|---|---|---|---|---|---|
| DE | Bündniskrieg | Eurasische Union | Normal | offen | 13 / 23 / 30 / 40 | 100 | 207 |
| US | Bündniskrieg | Ostasiatischer Pakt | Normal | offen | 0 / 6 / 8 / 8 | 100 | 235 |
| PL | Bündniskrieg | Eurasische Union | Leicht | offen | 13 / 23 / 30 / 39 | 100 | 173 |
| FR | Weltkrieg | alle | Normal | offen | 5 / 6 / 7 / 8 | 100 | 977 |
| IN | Weltkrieg | alle | Normal | offen | 3 / 4 / 5 / 6 | 90 | 942 |
| TR | Weltkrieg | alle | Leicht | offen | 5 / 6 / 7 / 7 | 100 | 807 |

Keine Ausnahmen, Werteprüfung (`SelfTest.check`) nach jeder Partie ohne Befund. Wie schon in Abschnitt 2 endet mit
KI-Führung keine Partie in 2 Spielstunden; ein Mensch mit Großangriff ist deutlich schneller.

## 7. Balance der neuen Einheiten

Abschüsse nach Typ der schießenden Einheit, Weltkrieg Frankreich, Normal, 60 Spielminuten:

| Einheit | vorher: Abschüsse (Anteil) / gebaut | nachher: Abschüsse (Anteil) / gebaut |
|---|---|---|
| Kamikaze-Drohnentrupp | **412 (21 %, Platz 1)** / 201 | 87 (5 %) / 89 |
| Korvette | 297 (15 %) | 306 (18 %) |
| Schützenpanzer | 122 (6 %) | 180 (11 %) |
| Abschüsse gesamt | 1946 | 1676 |

**Befund:** Der Kamikaze-Drohnentrupp war billig, ohne Öl, schnell gebaut und in eigenen Provinzen in 20 s wieder
aufgefüllt – die KI baute ihn massenhaft und er lieferte die meisten Abschüsse (widerspricht „kein Spam“).
**Angepasst:** Kosten 450 / 150 / 10 Öl statt 300 / 100 / 0, Bauzeit 26 statt 20 s, 3 statt 4 Drohnen, 12 statt 9 s
zwischen zwei Starts, Schaden 45 / 60 statt 55 / 70 (leicht / gepanzert); KI-Gewicht am Flugplatz 0,5 statt 1.
Aufklärungsdrohne: schwerer zu entdecken (Tarnung 0,5 statt 0,4), KI-Gewicht 0,3 statt 0,5.

Weitere Beobachtungen: Patriot / S-400 erscheint selten (Rüstungswerk Stufe 3) und ist unauffällig; im Einzeltest
fing es rund 62 % der Kurzstreckenraketen ab. Das Landungsschiff wird von der KI nicht gebaut (nur Startausstattung
des Spielers) und hat im Test Truppen sicher an die polnische Küste gebracht. Aufklärungsdrohnen gehen oft verloren
(Flugabwehr), sind aber billig.

# Nachtest 5. November 2026 – KI-Landungen, gebündelte Meldungen, Ost-Modelle

Stand: Commit `6e16cc8` (KI-Landungen `bd517ed`, gebündelte Meldungen `20448db`, Ost-Modelle im Referenzstil).

## 8. KI-Landungen (untätiger Spieler)

Verfahren: Partie im Vorschau-Browser mit `Sim.step` im Zeitraffer, Spieler untätig. Mitgezählt wurden die Phasen der
Landungsoperationen aller KI-Fraktionen: geplant (Truppen gehen an Bord), ausgelaufen, gelandet (Angriff beginnt),
Ziel am Ende gehalten. Dazu die Meldungen an den Spieler („Kurs auf …“ / „landet Truppen bei …“).

| Land | Modus | Gegner | Stufe | Spielzeit | geplant | ausgelaufen | gelandet | Ziel gehalten | davon gegen Spieler-Bündnis | Meldungen Kurs / Landung |
|---|---|---|---|---|---|---|---|---|---|---|
| JP | Bündniskrieg | Ostasiatischer Pakt | Normal | 90 min | 7 | 6 | 5 | 2 | 3 | 4 / 3 |
| JP | Bündniskrieg | Ostasiatischer Pakt | Leicht | 74 min (Sieg) | 0 | 0 | 0 | 0 | 0 | 0 / 0 |
| GB | Bündniskrieg | Eurasische Union | Normal | 90 min | 7 | 6 | 2 | 0 | 1 | 1 / 0 |
| ID | Bündniskrieg | Pazifische Allianz | Normal | 90 min | 11 | 9 | 9 | 1 | 3 | 3 / 3 |
| US | Bündniskrieg | Ostasiatischer Pakt | Schwer | 90 min | 0 | 0 | 0 | 0 | 0 | 0 / 0 |
| FR | Weltkrieg | alle | Normal | 60 min | 41 | 30 | 28 | 12 | 0 | 0 / 0 |

Keine Ausnahmen, Werteprüfung (`SelfTest.check`) nach jeder Partie ohne Befund. Automatischer Selbsttest
(`node tools/selftest.js 3 20`) auf demselben Stand: **alles in Ordnung**.

**Befunde:**
- Die KI landet regelmäßig, vor allem auf Inseln und über schmale Meerengen (China → Taiwan / Philippinen,
  USA → Kuba, Italien / Spanien → Tunesien). Die Vorwarnung erscheint, sobald der Spieler das Schiff sieht.
- Ein Teil der ausgelaufenen Schiffe kommt nicht an (z. B. Großbritannien: 6 ausgelaufen, 2 gelandet): Sie werden
  versenkt oder finden keinen Landeplatz und fahren mit den Truppen heim. Das ist gewollt (Küstenschutz lohnt sich).
- Über den Pazifik (USA gegen Ostasien) plant die KI keine Landungen, weil sie nur Küsten in der Nähe der eigenen
  Küste angreift.
- Auf „Leicht“ landete China in dieser Partie gar nicht (dort nur Inseln ohne Landweg). Der untätige Spieler gewann
  nach 74 min durch seine KI-Verbündeten. Leicht bleibt damit wie gewünscht nachsichtig.

## 9. Ost-Modelle im Referenzstil

T-90M, BMP-3, Ka-52M, Orion und Spetsnaz in der Modell-Galerie geprüft (rechts und links gespiegelt, 32 / 60 / 90 /
220 px), Spielstart ohne Konsolenfehler. Vergleichsbild West / Ost: `referenzbilder/vergleich/ost-nachher.png`
(nicht Teil der Abgabe).

## 10. Bildrate auf dem Handy (Kriterium „30+ FPS“) – vorbereitet, Messung offen

Werkzeug (neu, 5. Nov.): **Leistungsanzeige** oben links mit FPS, Rechenzeit pro Bild und Einheitenzahl.
Einschalten unter *Einstellungen → Leistungsanzeige (FPS)* oder mit
`https://papoch295.github.io/ironmeridian/?fps`. „Messen (60 s)“ zeichnet eine Minute auf und zeigt einen Bericht
(Ø FPS, „1 % low“ = Durchschnitt der langsamsten 1 % der Bilder, längstes Bild, Rechenzeit, Gerät, Auflösung);
„Kopieren“ legt ihn in die Zwischenablage. Zeiten, in denen die App im Hintergrund war, zählen nicht.

Ablauf auf dem Android-Handy (Chrome, Querformat, Ton an, Nebel an, Modelle an):
1. Bündniskrieg Deutschland gegen Eurasische Union, Normal, Tempo 1×: 60 s messen, dabei Karte verschieben und zoomen.
2. Dieselbe Partie nach ca. 20 Spielminuten (mehr Einheiten, Kämpfe im Bild), Tempo 2×.
3. Weltkrieg (z. B. Frankreich, Normal) nach ca. 20 Spielminuten, ganze Welt herausgezoomt (viele hundert Einheiten).
4. Wie 3, aber auf eine Front hineingezoomt.

Bestanden, wenn Ø FPS ≥ 30 in allen Läufen; „1 % low“ unter 15 als spürbares Ruckeln notieren.

| Lauf | Gerät | Lage | Einheiten | Ø FPS | 1 % low | längstes Bild | Rechenzeit | Ergebnis |
|---|---|---|---|---|---|---|---|---|
| 1 | | Bündniskrieg DE, Start, 1× | | | | | | |
| 2 | | Bündniskrieg DE, 20 min, 2× | | | | | | |
| 3 | | Weltkrieg FR, 20 min, ganze Welt | | | | | | |
| 4 | | Weltkrieg FR, 20 min, Front nah | | | | | | |

Gegenprobe am PC (Vorschau-Browser, Rechenlogik mit künstlichen Bildzeiten): Ø und „1 % low“ werden richtig berechnet;
Selbsttest `node tools/selftest.js 3 20` danach mit Exit-Code 0.
