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
