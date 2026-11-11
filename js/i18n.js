// German / English UI strings. t('key', a, b) replaces {0}, {1}, ...
'use strict';

const STR = {
  de: {
    title: 'IRON MERIDIAN', subtitle: 'Globaler Konflikt 2026', alpha: 'Beta-Version', preview: 'Vorschau',
    newGame: 'Neues Spiel', cont: 'Fortsetzen', load: 'Laden', save: 'Speichern', settings: 'Einstellungen', help: 'Hilfe & Einheiten',
    tutorial: 'Tutorial', mainMenu: 'Hauptmenü', resume: 'Weiter spielen', back: 'Zurück', close: 'Schließen', panelFold: 'Fenster einklappen', panelOpen: 'Fenster ausklappen', cmdMore: 'Mehr', cmdLess: 'Weniger', start: 'Kampagne starten',
    loading: 'Lade Weltkarte…', loadingProv: 'Erzeuge Provinzen…',
    chooseCountry: 'Wähle deine Nation', chooseEnemy: 'Wähle den Feind', difficulty: 'Schwierigkeit',
    easy: 'Leicht', normal: 'Normal', hard: 'Schwer',
    easyD: 'Weniger KI-Einnahmen, langsamere Angriffe.', normalD: 'Ausgewogene Herausforderung.', hardD: 'Die KI ist reicher, größer und aggressiver.',
    yourBloc: 'Dein Bündnis', enemyBloc: 'Feindliches Bündnis', provinces: 'Provinzen', countries: 'Länder', power: 'Militärstärke',
    search: 'Land suchen…', notAdjacent: 'Keine Landgrenze – Angriff über See und Luft nötig.', adjacent: 'Gemeinsame Landgrenze.',
    money: 'Geld', industry: 'Industrie', oil: 'Öl', perMin: '/min', incTip: 'Einnahmen {0}/min, Unterhalt der Truppen {1}/min',
    paused: 'PAUSIERT', speed: 'Tempo', objectives: 'Ziele',
    objWin: 'Punktesieg: Nimm den Gegnern {0} % ihrer Siegpunkte ab und halte das {1} Min. lang. Hauptstädte zählen 5 Punkte, Städte, Häfen, Industrie und Ölfelder 2, Luftwaffenbasen 1.',
    objLose: 'Hält der Feind mehr als {0} % der Siegpunkte deines Heimatlands, kapituliert dein Land nach {1} Min.',
    objWinWorld: 'Weltmacht: Halte mit deinem Bündnis {0} % aller Siegpunkte der Welt {1} Min. lang, dann kapitulieren die Gegner. Hauptstädte zählen 5 Punkte, Städte, Häfen, Industrie und Ölfelder 2, Luftwaffenbasen 1.',
    objVpWorld: 'Anteil an der Welt', victoryWorld: 'Weltmacht: Dein Bündnis hält {0} % aller Siegpunkte der Welt. Die Gegner kapitulieren. Waffenstillstand!',
    objVp: 'Siegpunkte erobert', objOwnVp: 'Heimatland gehalten', objHoldWin: 'Sieg in {0} – Stellung halten!', objHoldLose: 'Kapitulation in {0} – Provinzen zurückerobern!',
    vpTagWin: 'SIEG IN {0}', vpTagLose: 'KAPITULATION IN {0}',
    evVpWin: 'Siegpunkte erreicht! Halte die Stellung {0} Min. lang, dann kapituliert der Gegner.', evVpWinBroken: 'Der Gegner hat Siegpunkte zurückgewonnen – der Sieg ist noch nicht sicher.',
    evVpLose: 'Dein Land steht vor der Kapitulation! Erobere Provinzen zurück, sonst ist die Partie in {0} Min. verloren.', evVpLoseBroken: 'Die Kapitulation ist abgewendet.',
    objProv: 'Erobert', objUnits: 'Feindliche Einheiten', objYourProv: 'Deine Provinzen', objYourUnits: 'Deine Einheiten',
    province: 'Provinz', owner: 'Besitzer', level: 'Stufe', defense: 'Garnison', income: 'Einnahmen', neutral: 'Neutral',
    player: 'Du', enemy: 'Feind', buildings: 'Institutionen', recruit: 'Rekrutieren', queue: 'Produktion', empty: 'Leer',
    upgrade: 'Ausbauen', upgradeProv: 'Provinz ausbauen', build: 'Bauen', lvl: 'St. {0}', missiles: 'Raketen', launch: 'Starten',
    capturing: 'Wird erobert: {0}%', needBuilding: 'Benötigt {0} Stufe {1}', notOwned: 'Nicht in deinem Besitz', queueFull: 'Warteschlange voll',
    noMoney: 'Nicht genug Ressourcen', cmdLimit: 'Kommandolimit erreicht', cmdShort: 'Kommando {0} / {1}',
    cmdTip: 'Kommandolimit: so viele Einheiten kann dein Land führen (Schiffe zählen doppelt, Einheiten in Produktion mit). Provinzen ausbauen oder erobern erhöht es.', maxLevel: 'Maximale Stufe', notCoastal: 'Nur an der Küste', outOfRange: 'Außer Reichweite', cooldown: 'Noch nicht bereit', none: 'Keine verfügbar',
    noTarget: 'Ziel wählen', parked: 'Am Boden', aircraftHere: 'Flugzeuge hier',
    selected: '{0} Einheiten ausgewählt', hp: 'Zustand', men: 'Soldaten', ammo: 'Munition', sup: 'Unterdrückung', fuel: 'Treibstoff', cargo: 'Ladung', kills: 'Abschüsse',
    cmdMove: 'Bewegen', cmdFast: 'Schnell', cmdAttack: 'Angriff', cmdStop: 'Stopp', cmdRetreat: 'Rückzug', cmdLoad: 'Einsteigen', cmdUnload: 'Aussteigen',
    cmdDrop: 'Absetzen', cmdStrike: 'Luftschlag', cmdSlbm: 'SLBM', cmdRtb: 'Zur Basis', cmdTakeoff: 'Starten', cmdBox: 'Rahmen',
    stance: 'Feuer', stFree: 'Frei', stReturn: 'Erwidern', stHold: 'Halten',
    hintMove: 'Ziel auf der Karte antippen', hintAttack: 'Angriffsziel oder Punkt antippen', hintLoad: 'Transporter antippen', hintDrop: 'Absetzpunkt antippen',
    hintStrike: 'Ziel für Luftschlag antippen', hintMissile: 'Ziel für {0} antippen', hintBox: 'Rahmen ziehen zum Auswählen',
    evCaptured: '{0} erobert!', evLost: '{0} verloren!', evProduced: '{0} bereit in {1}', evBuilt: '{0} in {1} fertig', evUpgraded: '{0} auf Stufe {1} ausgebaut',
    evLaunch: 'Feindlicher Raketenstart erkannt!', evLaunchOwn: 'Rakete gestartet', evIntercept: 'Rakete abgefangen', evMissileHit: 'Raketeneinschlag bei {0}',
    evNoPath: 'Kein Weg zum Ziel', evCrash: '{0} ohne Treibstoff abgestürzt', evRout: '{0} zieht sich ungeordnet zurück', evUnderAttack: '{0} wird angegriffen',
    evSaved: 'Spiel gespeichert', evLoaded: 'Spielstand geladen', evAutosave: 'Automatisch gespeichert',
    victory: 'SIEG', defeat: 'NIEDERLAGE', victoryText: 'Alle Gegner wurden vollständig besiegt.', defeatText: 'Dein Land hat alle Provinzen verloren.',
    victoryPts: 'Punktesieg: Der Gegner hat {0} % seiner Siegpunkte verloren und kapituliert. Waffenstillstand!',
    defeatPts: 'Der Feind hält {0} % der Siegpunkte deines Heimatlands – dein Land muss kapitulieren.', statVp: 'Siegpunkte erobert',
    ally: 'Verbündet', heldBy: 'Besetzt von {0}', diplomacy: 'Diplomatie', declareWar: 'Krieg erklären',
    neutralInfo: 'Dieses Land ist neutral und gehört zu: {0}. Eine Kriegserklärung gilt für das ganze Bündnis – Nachbarländer können sich dem Verteidiger anschließen.',
    confirmWar: 'Wirklich den Krieg erklären? Gegner: {0}. Das Land macht mobil, und seine Nachbarn könnten sich gegen dich stellen.',
    evWar: 'Krieg: {0} gegen {1}', evJoinWar: '{0} tritt gegen dich in den Krieg ein!', evAllyLost: 'Verbündete haben {0} verloren', evAllyCaptured: 'Verbündete erobern {0}',
    evGather: 'Aufklärung: {0} sammelt Truppen – Angriff auf {1} erwartet!',
    escalation: 'Eskalation', escOnD: 'Wer zu viel erobert, bekommt neue Gegner: Ein neutraler Nachbar mobilisiert mit Vorwarnung gegen die Seite, die am meisten erobert hat – auch gegen den Feind.',
    escOffD: 'Neutrale Länder greifen nicht von selbst in den Krieg ein.',
    evEscWarn: 'Eskalation: {0} mobilisiert gegen {1} – Kriegseintritt in {2} Minuten!', evEscOff: 'Eskalation: {0} bricht die Mobilmachung gegen {1} ab und bleibt neutral.',
    evEscJoin: 'Eskalation: {0} tritt gegen {1} in den Krieg ein!',
    objEsc: 'Netto eroberte Siegpunkte', objEscD: 'Ab {0} greift ein neutraler Nachbar gegen dein Bündnis ein. Das gilt genauso für den Feind.',
    objEscPend: '{0} mobilisiert gegen {1} – Kriegseintritt in {2}',
    evRetreat: '{0} bricht den Angriff ab und zieht sich zurück',
    evCalledOff: 'Aufklärung: {0} bläst den Angriff ab – unsere Verteidigung ist zu stark',
    evLandingSail: 'Aufklärung: Landungsschiff aus {0} mit Truppen an Bord – Kurs auf {1}!', evLanding: '{0} landet Truppen bei {1}!',
    objAllies: 'Verbündete Länder', gameMode: 'Spielmodus', modeBloc: 'Bündniskrieg', modeFfa: 'Weltkrieg',
    modeBlocD: 'Dein Bündnis gegen ein feindliches Bündnis. Alle anderen Länder bleiben neutral, bis jemand ihnen den Krieg erklärt.',
    modeFfaD: 'Jeder gegen jeden: Alle Bündnisse kämpfen gegeneinander. Länder ohne Bündnis bleiben zunächst neutral. Sieg als Weltmacht mit 25 % aller Siegpunkte.',
    noAlliance: 'Ohne Bündnis', alliesAi: 'Deine Verbündeten werden von der KI gesteuert und kämpfen mit dir.', yourProvinces: 'Deine Provinzen', bloc: 'Bündnis',
    statTime: 'Kriegsdauer', statKills: 'Feindverluste', statLosses: 'Eigene Verluste', statBuilt: 'Rekrutiert', statCaptured: 'Eroberte Provinzen',
    slot: 'Speicherplatz {0}', autosave: 'Automatisch', emptySlot: '— leer —', overwrite: 'Überschreiben', confirmMenu: 'Zum Hauptmenü? Nicht gespeicherter Fortschritt geht verloren.',
    saveNew: 'Neu speichern', saveName: 'Name des Spielstands', del: 'Löschen', confirmDel: 'Wirklich löschen?', noSaves: 'Noch keine Spielstände vorhanden.',
    saveFail: 'Speichern fehlgeschlagen – der Speicher des Browsers ist voll oder gesperrt.', loadFail: 'Dieser Spielstand ist beschädigt und kann nicht geladen werden.',
    loadOld: 'Dieser Spielstand stammt aus einer älteren Version mit anderer Karte und lässt sich nicht mehr laden.',
    errTitle: 'Ein Fehler ist aufgetreten', errSaved: 'Das Spiel wurde angehalten und ein Notfall-Spielstand angelegt. Du kannst weiterspielen oder ins Hauptmenü gehen.',
    errNoGame: 'Das Spiel wurde angehalten. Du kannst es weiter versuchen oder ins Hauptmenü gehen.', errCont: 'Weiterspielen', rescue: 'Notfall',
    language: 'Sprache', sound: 'Soundeffekte', volume: 'Lautstärke', on: 'An', off: 'Aus', showTutorial: 'Tutorial beim Start', fogOfWar: 'Nebel des Krieges',
    days: 'Tag {0}', yes: 'Ja', no: 'Nein', ok: 'OK', skip: 'Überspringen', next: 'Weiter', done: 'Los geht’s',
    helpControls: 'Steuerung', helpEconomy: 'Wirtschaft', helpCombat: 'Kampf', helpUnits: 'Einheiten',
    cost: 'Kosten', time: 'Bauzeit', range: 'Reichweite', speedStat: 'Tempo', vision: 'Sicht', stealth: 'Tarnung', requires: 'Benötigt',
    land: 'Boden', air: 'Luft', sea: 'See', missile: 'Rakete',
    qMsl: 'Raketen', cmdCas: 'Dauereinsatz', hintCas: 'Einsatzgebiet antippen – die Flugzeuge greifen dort an und fliegen nach dem Auftanken von selbst wieder hin',
    hintMissileAuto: 'Ziel für {0} antippen – die nächste Basis in Reichweite feuert', casSet: 'Dauereinsatz befohlen – jeder andere Befehl beendet ihn',
    casPartial: 'Nur {0} von {1} Flugzeugen erreichen das Gebiet von ihrem Flugplatz aus', evCasLost: '{0}: Einsatzgebiet vom neuen Flugplatz aus nicht erreichbar – Dauereinsatz beendet',
    mslNoSource: 'Keine Basis mit {0} erreicht dieses Ziel', mslLaunched: '{0} gestartet von {1}',
    airField: 'im Feld', airCasRefuel: 'Dauereinsatz – tankt auf', airRtb: 'Rückflug', airNuke: 'Atomschlag', airCas: 'Dauereinsatz', airMission: 'im Einsatz',
    airCount: '{0} Luftfahrzeuge', airCount1: '1 Luftfahrzeug', airNone: 'Keine Luftfahrzeuge. Baue einen Flugplatz und rekrutiere dort Hubschrauber und Flugzeuge.',
    airSelReady: 'Bereite wählen ({0})', airSelAll: 'Alle wählen', airSelCas: 'Im Dauereinsatz ({0})',
    airInfo: 'Antippen wählt aus. Dann „Dauereinsatz“: Die Flugzeuge greifen im Gebiet an, tanken auf und kehren immer wieder zurück.',
    mslSub: 'Vorrat im ganzen Land', mslNone: 'Keine Raketen. Baue in einer Provinz eine Raketenbasis und stelle dort Raketen her; U-Boote mit SLBM erscheinen hier ebenfalls.',
    mslInfo: '„Starten“ und dann das Ziel antippen: Die nächste Basis mit genug Reichweite feuert. Kreise auf der Karte zeigen die Reichweite.',
    mslBases: '{0} Standorte', mslBase1: '1 Standort', mslSites: 'Standorte',
    qLand: 'Bodentruppen', qAir: 'Luftwaffe', qSea: 'Marine', qIdle: 'Untätige', qNone: 'Keine passenden Einheiten im Bild',
    army: 'Armee', groupHint: 'Erst Einheiten auswählen, dann + Armee (oder Strg+Zahl)', groupMade: 'Armee {0} gebildet – Klick wählt sie, zweiter Klick zentriert',
    unitStyle: 'Einheitendarstellung', styleModels: 'Modelle', styleNato: 'NATO-Symbole',
    radar: 'Radar', radarRange: 'Radarreichweite', units: 'Einheiten',
    perfSetting: 'Leistungsanzeige (FPS)', perfUnits: 'Einheiten', perfMeasuring: 'Messung läuft, noch', perfRun: 'Messen (60 s)',
    perfStop: 'Stopp', perfCopy: 'Kopieren', perfCopied: 'Kopiert ✔', perfMenu: 'Hauptmenü', perfReport: 'Leistungsmessung',
    perfDur: 'Dauer', perfFrames: 'Bilder', perfWorst: 'längstes Bild', perfWork: 'Rechenzeit', perfFrame: 'Bild',
    perfGame: 'Partie', perfScreen: 'Bildschirm', perfDrawn: 'gezeichnet', perfVerdict: 'Ergebnis', perfTarget: 'Ziel 30+ FPS',
    setGeneral: 'Allgemein', setKeys: 'Tastenbelegung', keysHint: 'Auf eine Taste klicken und dann die neue Taste drücken. Esc bricht ab, Entf löscht die Belegung.',
    keyPress: 'Taste drücken…', keyNone: '—', keyReset: 'Standard wiederherstellen', keySwapped: '„{0}“ war schon belegt und wurde getauscht', keySpace: 'Leertaste',
    kgTime: 'Zeit', kgCmd: 'Befehle (mit Auswahl)', kgCam: 'Kamera', kgFixed: 'Fest belegt',
    kPause: 'Pause / Weiter', kSpeed1: 'Tempo 1×', kSpeed2: 'Tempo 2×', kSpeed3: 'Tempo 4×', kMenu: 'Menü öffnen',
    kPanUp: 'Karte nach oben', kPanDown: 'Karte nach unten', kPanLeft: 'Karte nach links', kPanRight: 'Karte nach rechts', kZoomIn: 'Hineinzoomen', kZoomOut: 'Herauszoomen',
    kIdle: 'Untätige Einheiten', kObj: 'Ziele anzeigen',
    kFixedEsc: 'Esc: Abbrechen / Auswahl aufheben / Menü', kFixedArrows: 'Pfeiltasten: Karte verschieben (immer)', kFixedGroups: 'Strg + 1–9: Armee bilden · Umschalt + 1–9: zur Armee hinzufügen · 1–9: Armee wählen (doppelt: zentrieren)',
    kPanNote: 'Kamera-Tasten bewegen die Karte nur, wenn keine Einheit ausgewählt ist.',
    develop: 'Ausbau', aaRange: 'Flugabwehr', falloutHere: 'Radioaktiver Fallout: keine Einnahmen, keine Produktion.', cancel: 'Abbrechen (Kosten werden erstattet)',
    formations: 'Kampfgruppen', amount: 'Anzahl', toArmy: 'Zu Armee', newShort: 'Neu', noInstitution: 'Hier steht noch keine Institution. Baue eine Kaserne, ein Rüstungswerk oder einen Flugplatz, um Einheiten zu rekrutieren.',
    dUpgrade: 'Mehr Einnahmen und stärkere Garnison', d_barracks: 'Infanterie und Spezialkräfte', d_factory: 'Fahrzeuge, Panzer, Artillerie', d_airfield: 'Hubschrauber und Flugzeuge',
    d_shipyard: 'Kriegsschiffe und U-Boote', d_silo: 'Raketen lagern und starten', d_radar: 'Größere Sichtweite der Provinz',
    d_aad: 'Schießt feindliche Flugzeuge, Hubschrauber und Raketen ab', d_lab: 'Baut Atomsprengköpfe für Raketen und Bomber',
    nukeInfo: 'Ein Atomsprengkopf kann auf jede Rakete einer Raketenbasis oder in einen strategischen Bomber geladen werden. Zerstört alles in ca. {0} km Umkreis und hinterlässt Fallout.',
    nukeStock: 'Atomsprengköpfe (landesweit)', formInfo: 'Eine Kampfgruppe rekrutiert Front, Aufklärung und Unterstützung auf einmal und bildet daraus eine neue Armee. Wähle die Armee aus und gib ihr „Großangriff“, „Vorrücken“ oder „Halten“ – den Rest erledigt sie selbst.', launchNuke: 'Mit Atomsprengkopf starten',
    armyKeys: 'Taste {0} wählt · Umschalt+{1} fügt hinzu', keepTogether: 'Formation halten', splitArmy: 'Aufteilen', disband: 'Auflösen', newArmy: 'Neue Armee', addToArmy: 'Zu Armee {0} hinzufügen',
    leaveArmy: 'Aus Armee entfernen', vehOk: 'auch Fahrzeuge', nukeAboard: 'Atombombe an Bord', armyFull: 'Alle 9 Armeen sind belegt',
    batchPartial: 'Nur {0} bezahlbar – so viele in Auftrag gegeben', recruitToArmy: 'Neue Einheiten bilden Armee {0}', formQueued: '{0} in Auftrag – wird Armee {1}', addedToArmy: 'Zu Armee {0} hinzugefügt',
    leadWith: 'Gemeinsam führen', leadTip: 'Mehrere Armeen wählen: Hier antippen, in der Armee-Leiste lange drücken oder Umschalt+Klick. Großangriff, Vorrücken und Halten gelten dann für alle.', armiesLed: 'Armeen {0}',
    mergeArmies: 'Zusammenlegen', mergeTip: 'Alle gewählten Armeen werden zu Armee {0}', armyMerged: 'Armee {0} geht in Armee {1} auf',
    missing: 'Fehlt', refill: 'Auffrischen', refillTip: 'Verluste werden automatisch in der nächsten passenden Institution nachgebaut und stoßen dann zur Armee. Kostet normal Geld und pausiert, solange der Unterhalt die Einnahmen übersteigt.',
    refillPaused: 'pausiert: Unterhalt zu hoch', refillTag: 'Ersatz für Verluste dieser Armee', refillOff: 'Auffrischen für Armee {0} abgeschaltet',
    repTip: 'Dauerauftrag: wird immer wieder gebaut, solange das Geld reicht und die Einnahmen den Unterhalt decken', repWait: 'wartet auf Geld',
    upkWarn: 'Unterhalt übersteigt die Einnahmen: {0} −{1}/min, Reserve reicht ca. {2} min. Auffrischen und Daueraufträge pausieren.', evUpkeep: 'Unterhalt zu hoch: {0} sinkt um {1}/min',
    armyDisbanded: 'Armee {0} aufgelöst', armySplit: 'Armee {0} aufgeteilt – neue Armee {1}', armyPending: 'Armee {0} wird noch rekrutiert',
    armyFight: 'Im Gefecht', armyMoving: 'Marsch', armyIdle: 'Bereit', armyRecruiting: 'Rekrutierung',
    cmdTaskAttack: 'Großangriff', cmdTaskAdvance: 'Vorrücken', cmdTaskHold: 'Halten',
    hintTaskAttack: 'Ziel antippen: Die Armee greift in Phasen an – Aufklärung, Artillerie, Sturm',
    hintTaskAdvance: 'Ziel antippen: Die Armee rückt vor und kämpft unterwegs, Unterstützung folgt',
    task_attack: 'Armee {0}: Großangriff befohlen', task_advance: 'Armee {0}: Vorrücken befohlen', task_hold: 'Armee {0} hält und gräbt sich ein',
    ph_approach: 'Anmarsch', ph_recon: 'Aufklärung', ph_prep: 'Artillerie', ph_assault: 'Sturm', ph_advance: 'Vormarsch', ph_hold: 'Hält Stellung', ph_dig: 'Verteidigt', ph_retreat: 'Rückzug',
    task: 'Auftrag', strength: 'Kampfkraft', autoRetreat: 'Rückzug bei Verlusten',
    autoRetreatTip: 'Bei einem Großangriff oder Vormarsch zieht sich die Armee zurück, wenn mehr als die Hälfte ihrer Kampfkraft verloren ist.',
    armyRep: 'Armee {0}: {1}', repFire: 'unter Beschuss', repLost: 'Verluste {0} ({1})', repRout: 'ungeordnet zurück: {0}',
    repKills: 'Abschüsse {0}', repReady: 'Verstärkung {0} ({1})', repRetreat: 'schwere Verluste, zieht sich zurück',
    repTaken: '{0} genommen, hält dort', repRecon: 'klärt das Ziel auf', repPrep: 'Artillerie bereitet den Angriff vor',
    repAssault: 'Sturmangriff', repArrived: 'Ziel erreicht', repBack: 'Rückzug beendet, hält Stellung',
    upkShort: 'Unterhalt {0}/min', upkTip: 'Laufende Kosten: {0} Geld und {1} Öl pro Minute',
    hintUnloadAt: 'Ziel antippen – dort wird ausgeladen', hintNuke: 'Ziel für den Atomschlag antippen', cmdAutoLoad: 'Verladen', cmdPickup: 'Aufnehmen', cmdUnloadAt: 'Transport nach', cmdAirlift: 'Lufttransport', hintAirlift: 'Ziel antippen – freie Hubschrauber und Transportflugzeuge holen die Truppen ab', liftNone: 'Kein freier Lufttransport in der Nähe', liftOk: 'Lufttransport: {0} Einheiten werden abgeholt', liftPartial: 'Lufttransport: {0} von {1} Einheiten (kein Platz mehr)', evLiftGo: '{0} startet mit {1} Einheiten an Bord', cargoEmpty: 'leer', cargoFull: 'voll', cargoWait: 'wartet auf Truppen', cmdNuke: 'Atomschlag',
    loadFull: 'Kein Platz in den Transportern', loadPartial: '{0} von {1} Einheiten steigen ein (kein Platz mehr)', loadOk: '{0} Einheiten steigen ein', loadNone: 'Keine passenden Einheiten in der Nähe',
    evNukeBomber: 'Bomber mit Atombombe gestartet', evNukeReady: 'Atomsprengkopf einsatzbereit', evLaunchNuke: 'FEINDLICHE ATOMRAKETE IM ANFLUG!', evLaunchOwnNuke: 'Atomrakete gestartet',
    evNuke: 'Atomdetonation bei {0}', evInterceptNuke: 'Atomrakete abgefangen – Sprengkopf verloren', evUnloaded: '{0} hat ausgeladen', noNukes: 'Kein Atomsprengkopf vorhanden – im Forschungszentrum bauen', armAtBase: 'Bomber muss zum Bewaffnen am Flugplatz stehen',
    dir: { N: 'Nord', NE: 'Nordost', E: 'Ost', SE: 'Südost', S: 'Süd', SW: 'Südwest', W: 'West', NW: 'Nordwest', C: 'Zentral' },
  },
  en: {
    title: 'IRON MERIDIAN', subtitle: 'Global Conflict 2026', alpha: 'Beta build', preview: 'Preview',
    newGame: 'New Game', cont: 'Continue', load: 'Load', save: 'Save', settings: 'Settings', help: 'Help & Units',
    tutorial: 'Tutorial', mainMenu: 'Main Menu', resume: 'Resume', back: 'Back', close: 'Close', panelFold: 'Fold panel', panelOpen: 'Unfold panel', cmdMore: 'More', cmdLess: 'Less', start: 'Start Campaign',
    loading: 'Loading world map…', loadingProv: 'Generating provinces…',
    chooseCountry: 'Choose your nation', chooseEnemy: 'Choose the enemy', difficulty: 'Difficulty',
    easy: 'Easy', normal: 'Normal', hard: 'Hard',
    easyD: 'Lower AI income, slower attacks.', normalD: 'A balanced challenge.', hardD: 'The AI is richer, larger and more aggressive.',
    yourBloc: 'Your alliance', enemyBloc: 'Enemy alliance', provinces: 'Provinces', countries: 'Countries', power: 'Military power',
    search: 'Search country…', notAdjacent: 'No land border – attack by sea and air required.', adjacent: 'Shared land border.',
    money: 'Money', industry: 'Industry', oil: 'Oil', perMin: '/min', incTip: 'Income {0}/min, troop upkeep {1}/min',
    paused: 'PAUSED', speed: 'Speed', objectives: 'Objectives',
    objWin: 'Points victory: take {0} % of the enemies\' victory points and hold that for {1} min. Capitals count 5 points; cities, ports, industry and oil fields 2; air bases 1.',
    objLose: 'If the enemy holds more than {0} % of the victory points of your homeland, your country surrenders after {1} min.',
    objWinWorld: 'World power: hold {0} % of all victory points in the world with your alliance for {1} min and your enemies surrender. Capitals count 5 points; cities, ports, industry and oil fields 2; air bases 1.',
    objVpWorld: 'Share of the world', victoryWorld: 'World power: your alliance holds {0} % of all victory points in the world. Your enemies surrender. Ceasefire!',
    objVp: 'Victory points taken', objOwnVp: 'Homeland held', objHoldWin: 'Victory in {0} – hold your ground!', objHoldLose: 'Surrender in {0} – retake provinces!',
    vpTagWin: 'VICTORY IN {0}', vpTagLose: 'SURRENDER IN {0}',
    evVpWin: 'Victory points reached! Hold your ground for {0} min and the enemy surrenders.', evVpWinBroken: 'The enemy has regained victory points – victory is not secured yet.',
    evVpLose: 'Your country is about to surrender! Retake provinces or the game is lost in {0} min.', evVpLoseBroken: 'Surrender averted.',
    objProv: 'Captured', objUnits: 'Enemy units', objYourProv: 'Your provinces', objYourUnits: 'Your units',
    province: 'Province', owner: 'Owner', level: 'Level', defense: 'Garrison', income: 'Income', neutral: 'Neutral',
    player: 'You', enemy: 'Enemy', buildings: 'Institutions', recruit: 'Recruit', queue: 'Production', empty: 'Empty',
    upgrade: 'Upgrade', upgradeProv: 'Develop province', build: 'Build', lvl: 'Lv {0}', missiles: 'Missiles', launch: 'Launch',
    capturing: 'Being captured: {0}%', needBuilding: 'Requires {0} level {1}', notOwned: 'Not yours', queueFull: 'Queue full',
    noMoney: 'Not enough resources', cmdLimit: 'Command limit reached', cmdShort: 'Command {0} / {1}',
    cmdTip: 'Command limit: how many units your country can lead (ships count double, units in production count too). Upgrading or capturing provinces raises it.', maxLevel: 'Maximum level', notCoastal: 'Coastal only', outOfRange: 'Out of range', cooldown: 'Not ready yet', none: 'None available',
    noTarget: 'Choose target', parked: 'Parked', aircraftHere: 'Aircraft here',
    selected: '{0} units selected', hp: 'Condition', men: 'Soldiers', ammo: 'Ammo', sup: 'Suppression', fuel: 'Fuel', cargo: 'Cargo', kills: 'Kills',
    cmdMove: 'Move', cmdFast: 'Fast', cmdAttack: 'Attack', cmdStop: 'Stop', cmdRetreat: 'Retreat', cmdLoad: 'Board', cmdUnload: 'Unload',
    cmdDrop: 'Air drop', cmdStrike: 'Air strike', cmdSlbm: 'SLBM', cmdRtb: 'Return', cmdTakeoff: 'Take off', cmdBox: 'Box',
    stance: 'Fire', stFree: 'Free', stReturn: 'Return', stHold: 'Hold',
    hintMove: 'Tap a destination on the map', hintAttack: 'Tap a target or point', hintLoad: 'Tap a transport', hintDrop: 'Tap the drop zone',
    hintStrike: 'Tap the air strike target', hintMissile: 'Tap a target for {0}', hintBox: 'Drag a box to select',
    evCaptured: '{0} captured!', evLost: '{0} lost!', evProduced: '{0} ready in {1}', evBuilt: '{0} completed in {1}', evUpgraded: '{0} developed to level {1}',
    evLaunch: 'Enemy missile launch detected!', evLaunchOwn: 'Missile launched', evIntercept: 'Missile intercepted', evMissileHit: 'Missile impact near {0}',
    evNoPath: 'No route to target', evCrash: '{0} ran out of fuel and crashed', evRout: '{0} is routing', evUnderAttack: '{0} under attack',
    evSaved: 'Game saved', evLoaded: 'Game loaded', evAutosave: 'Autosaved',
    victory: 'VICTORY', defeat: 'DEFEAT', victoryText: 'Every enemy has been completely defeated.', defeatText: 'Your country has lost all provinces.',
    victoryPts: 'Points victory: the enemy has lost {0} % of its victory points and surrenders. Ceasefire!',
    defeatPts: 'The enemy holds {0} % of the victory points of your homeland – your country has to surrender.', statVp: 'Victory points taken',
    ally: 'Allied', heldBy: 'Occupied by {0}', diplomacy: 'Diplomacy', declareWar: 'Declare war',
    neutralInfo: 'This country is neutral and belongs to: {0}. A declaration of war applies to the whole alliance – neighbouring countries may join the defender.',
    confirmWar: 'Really declare war on {0}? The country mobilises, and its neighbours might turn against you.',
    evWar: 'War: {0} against {1}', evJoinWar: '{0} enters the war against you!', evAllyLost: 'Allies lost {0}', evAllyCaptured: 'Allies captured {0}',
    evGather: 'Recon: {0} is massing troops – attack on {1} expected!',
    escalation: 'Escalation', escOnD: 'Conquer too much and new enemies appear: a neutral neighbour mobilises, with a warning, against the side that has conquered the most – the enemy included.',
    escOffD: 'Neutral countries never enter the war on their own.',
    evEscWarn: 'Escalation: {0} is mobilising against {1} – enters the war in {2} minutes!', evEscOff: 'Escalation: {0} calls off its mobilisation against {1} and stays neutral.',
    evEscJoin: 'Escalation: {0} enters the war against {1}!',
    objEsc: 'Net victory points conquered', objEscD: 'From {0} on a neutral neighbour turns against your alliance. The same applies to the enemy.',
    objEscPend: '{0} is mobilising against {1} – enters the war in {2}',
    evRetreat: '{0} breaks off the attack and falls back',
    evCalledOff: 'Intel: {0} calls off its attack – our defence is too strong',
    evLandingSail: 'Recon: landing ship from {0} with troops aboard – heading for {1}!', evLanding: '{0} is landing troops near {1}!',
    objAllies: 'Allied countries', gameMode: 'Game mode', modeBloc: 'Alliance war', modeFfa: 'World war',
    modeBlocD: 'Your alliance against one enemy alliance. Every other country stays neutral until someone declares war on it.',
    modeFfaD: 'Free for all: every alliance fights every other. Countries without an alliance stay neutral at first. Win as a world power with 25 % of all victory points.',
    noAlliance: 'No alliance', alliesAi: 'Your allies are controlled by the AI and fight alongside you.', yourProvinces: 'Your provinces', bloc: 'Alliance',
    statTime: 'War duration', statKills: 'Enemy losses', statLosses: 'Own losses', statBuilt: 'Recruited', statCaptured: 'Provinces captured',
    slot: 'Slot {0}', autosave: 'Autosave', emptySlot: '— empty —', overwrite: 'Overwrite', confirmMenu: 'Return to main menu? Unsaved progress will be lost.',
    saveNew: 'Save as new', saveName: 'Save name', del: 'Delete', confirmDel: 'Really delete?', noSaves: 'No saved games yet.',
    saveFail: 'Saving failed – browser storage is full or blocked.', loadFail: 'This save is damaged and cannot be loaded.',
    loadOld: 'This save comes from an older version with a different map and can no longer be loaded.',
    errTitle: 'An error occurred', errSaved: 'The game has been paused and an emergency save was created. You can keep playing or return to the main menu.',
    errNoGame: 'The game has been paused. You can try to continue or return to the main menu.', errCont: 'Keep playing', rescue: 'Emergency',
    language: 'Language', sound: 'Sound effects', volume: 'Volume', on: 'On', off: 'Off', showTutorial: 'Tutorial on start', fogOfWar: 'Fog of war',
    days: 'Day {0}', yes: 'Yes', no: 'No', ok: 'OK', skip: 'Skip', next: 'Next', done: 'Let’s go',
    helpControls: 'Controls', helpEconomy: 'Economy', helpCombat: 'Combat', helpUnits: 'Units',
    cost: 'Cost', time: 'Build time', range: 'Range', speedStat: 'Speed', vision: 'Vision', stealth: 'Stealth', requires: 'Requires',
    land: 'Ground', air: 'Air', sea: 'Naval', missile: 'Missile',
    qMsl: 'Missiles', cmdCas: 'Standing mission', hintCas: 'Tap the mission area – the aircraft attack there and return on their own after refuelling',
    hintMissileAuto: 'Tap a target for {0} – the closest base in range fires', casSet: 'Standing mission ordered – any other order ends it',
    casPartial: 'Only {0} of {1} aircraft can reach the area from their airfield', evCasLost: '{0}: mission area out of reach from the new airfield – standing mission ended',
    mslNoSource: 'No base with {0} reaches this target', mslLaunched: '{0} launched from {1}',
    airField: 'in the field', airCasRefuel: 'Standing mission – refuelling', airRtb: 'Returning', airNuke: 'Nuclear strike', airCas: 'Standing mission', airMission: 'On mission',
    airCount: '{0} aircraft', airCount1: '1 aircraft', airNone: 'No aircraft. Build an airfield and recruit helicopters and planes there.',
    airSelReady: 'Select ready ({0})', airSelAll: 'Select all', airSelCas: 'On standing mission ({0})',
    airInfo: 'Tap to select. Then "Standing mission": the aircraft attack in the area, refuel and keep coming back.',
    mslSub: 'Stock across the country', mslNone: 'No missiles. Build a missile base in a province and produce missiles there; submarines with SLBMs show up here too.',
    mslInfo: '"Launch", then tap the target: the closest base with enough range fires. Circles on the map show the range.',
    mslBases: '{0} sites', mslBase1: '1 site', mslSites: 'Sites',
    qLand: 'Ground', qAir: 'Air force', qSea: 'Navy', qIdle: 'Idle', qNone: 'No matching units on screen',
    army: 'Army', groupHint: 'Select units first, then + Army (or Ctrl+number)', groupMade: 'Army {0} formed – click selects it, second click centers',
    unitStyle: 'Unit display', styleModels: 'Models', styleNato: 'NATO symbols',
    radar: 'Radar', radarRange: 'Radar range', units: 'Units',
    perfSetting: 'Performance display (FPS)', perfUnits: 'Units', perfMeasuring: 'Measuring, remaining', perfRun: 'Measure (60 s)',
    perfStop: 'Stop', perfCopy: 'Copy', perfCopied: 'Copied ✔', perfMenu: 'Main menu', perfReport: 'performance test',
    perfDur: 'Duration', perfFrames: 'frames', perfWorst: 'longest frame', perfWork: 'Work time', perfFrame: 'frame',
    perfGame: 'Game', perfScreen: 'Screen', perfDrawn: 'drawn', perfVerdict: 'Result', perfTarget: 'target 30+ FPS',
    setGeneral: 'General', setKeys: 'Key bindings', keysHint: 'Click a key, then press the new key. Esc cancels, Delete clears the binding.',
    keyPress: 'Press a key…', keyNone: '—', keyReset: 'Restore defaults', keySwapped: '“{0}” was already bound and has been swapped', keySpace: 'Space',
    kgTime: 'Time', kgCmd: 'Orders (with selection)', kgCam: 'Camera', kgFixed: 'Fixed keys',
    kPause: 'Pause / resume', kSpeed1: 'Speed 1×', kSpeed2: 'Speed 2×', kSpeed3: 'Speed 4×', kMenu: 'Open menu',
    kPanUp: 'Pan up', kPanDown: 'Pan down', kPanLeft: 'Pan left', kPanRight: 'Pan right', kZoomIn: 'Zoom in', kZoomOut: 'Zoom out',
    kIdle: 'Idle units', kObj: 'Show objectives',
    kFixedEsc: 'Esc: cancel / deselect / menu', kFixedArrows: 'Arrow keys: pan the map (always)', kFixedGroups: 'Ctrl + 1–9: form army · Shift + 1–9: add to army · 1–9: select army (twice: center)',
    kPanNote: 'Camera keys only pan the map while no unit is selected.',
    develop: 'Develop', aaRange: 'Air defense', falloutHere: 'Radioactive fallout: no income, no production.', cancel: 'Cancel (costs refunded)',
    formations: 'Battle groups', amount: 'Amount', toArmy: 'To army', newShort: 'New', noInstitution: 'No institution here yet. Build barracks, an arms factory or an airfield to recruit units.',
    dUpgrade: 'More income and a stronger garrison', d_barracks: 'Infantry and special forces', d_factory: 'Vehicles, tanks, artillery', d_airfield: 'Helicopters and aircraft',
    d_shipyard: 'Warships and submarines', d_silo: 'Stores and launches missiles', d_radar: 'Wider province vision',
    d_aad: 'Shoots down enemy aircraft, helicopters and missiles', d_lab: 'Builds nuclear warheads for missiles and bombers',
    nukeInfo: 'A nuclear warhead fits any missile of a missile base or a strategic bomber. Destroys everything within about {0} km and leaves fallout.',
    nukeStock: 'Nuclear warheads (nation-wide)', formInfo: 'A battle group recruits front, reconnaissance and support at once and forms a new army from them. Select the army and give it "Assault", "Advance" or "Hold" – it handles the rest on its own.', launchNuke: 'Launch with nuclear warhead',
    armyKeys: 'Key {0} selects · Shift+{1} adds', keepTogether: 'Keep together', splitArmy: 'Split', disband: 'Disband', newArmy: 'New army', addToArmy: 'Add to army {0}',
    leaveArmy: 'Remove from army', vehOk: 'vehicles too', nukeAboard: 'Nuclear bomb on board', armyFull: 'All 9 armies are in use',
    batchPartial: 'Only {0} affordable – that many were ordered', recruitToArmy: 'New units will form army {0}', formQueued: '{0} ordered – will become army {1}', addedToArmy: 'Added to army {0}',
    leadWith: 'Lead together', leadTip: 'Select several armies: tap here, long-press in the army bar or Shift+click. Assault, advance and hold then apply to all of them.', armiesLed: 'Armies {0}',
    mergeArmies: 'Merge', mergeTip: 'All selected armies become army {0}', armyMerged: 'Army {0} merged into army {1}',
    missing: 'Missing', refill: 'Refill', refillTip: 'Losses are rebuilt automatically at the nearest suitable institution and then join the army. Costs the normal price and pauses while upkeep exceeds income.',
    refillPaused: 'paused: upkeep too high', refillTag: 'Replacement for losses of this army', refillOff: 'Refill switched off for army {0}',
    repTip: 'Standing order: built again and again as long as money lasts and income covers upkeep', repWait: 'waiting for funds',
    upkWarn: 'Upkeep exceeds income: {0} −{1}/min, reserves last about {2} min. Refills and standing orders are paused.', evUpkeep: 'Upkeep too high: {0} falling by {1}/min',
    armyDisbanded: 'Army {0} disbanded', armySplit: 'Army {0} split – new army {1}', armyPending: 'Army {0} is still being recruited',
    armyFight: 'In combat', armyMoving: 'Marching', armyIdle: 'Ready', armyRecruiting: 'Recruiting',
    cmdTaskAttack: 'Assault', cmdTaskAdvance: 'Advance', cmdTaskHold: 'Hold',
    hintTaskAttack: 'Tap a target: the army attacks in phases – reconnaissance, artillery, assault',
    hintTaskAdvance: 'Tap a target: the army advances and fights on the way, support follows',
    task_attack: 'Army {0}: assault ordered', task_advance: 'Army {0}: advance ordered', task_hold: 'Army {0} holds and digs in',
    ph_approach: 'Approach', ph_recon: 'Recon', ph_prep: 'Artillery', ph_assault: 'Assault', ph_advance: 'Advancing', ph_hold: 'Holding', ph_dig: 'Defending', ph_retreat: 'Retreating',
    task: 'Task', strength: 'Strength', autoRetreat: 'Retreat on losses',
    autoRetreatTip: 'During an assault or advance the army falls back once it has lost more than half of its combat strength.',
    armyRep: 'Army {0}: {1}', repFire: 'under fire', repLost: 'losses {0} ({1})', repRout: 'routing: {0}',
    repKills: 'kills {0}', repReady: 'reinforcements {0} ({1})', repRetreat: 'heavy losses, falling back',
    repTaken: '{0} taken, holding there', repRecon: 'scouting the target', repPrep: 'artillery preparing the attack',
    repAssault: 'assault', repArrived: 'objective reached', repBack: 'retreat complete, holding position',
    upkShort: 'Upkeep {0}/min', upkTip: 'Running cost: {0} money and {1} oil per minute',
    hintUnloadAt: 'Tap the destination – cargo unloads there', hintNuke: 'Tap the nuclear strike target', cmdAutoLoad: 'Load up', cmdPickup: 'Pick up', cmdUnloadAt: 'Transport to', cmdAirlift: 'Airlift', hintAirlift: 'Tap the destination – free helicopters and transport planes fetch the troops', liftNone: 'No free air transport nearby', liftOk: 'Airlift: picking up {0} units', liftPartial: 'Airlift: {0} of {1} units (no more room)', evLiftGo: '{0} takes off with {1} units aboard', cargoEmpty: 'empty', cargoFull: 'full', cargoWait: 'waiting for troops', cmdNuke: 'Nuke',
    loadFull: 'No room in the transports', loadPartial: '{0} of {1} units board (no more room)', loadOk: '{0} units boarding', loadNone: 'No suitable units nearby',
    evNukeBomber: 'Bomber with nuclear bomb launched', evNukeReady: 'Nuclear warhead ready', evLaunchNuke: 'ENEMY NUCLEAR MISSILE INBOUND!', evLaunchOwnNuke: 'Nuclear missile launched',
    evNuke: 'Nuclear detonation near {0}', evInterceptNuke: 'Nuclear missile intercepted – warhead lost', evUnloaded: '{0} unloaded', noNukes: 'No nuclear warhead – build one in a research facility', armAtBase: 'The bomber must be parked at an airfield to be armed',
    dir: { N: 'North', NE: 'Northeast', E: 'East', SE: 'Southeast', S: 'South', SW: 'Southwest', W: 'West', NW: 'Northwest', C: 'Central' },
  },
};

// Longer help and tutorial texts (HTML allowed).
const HELP = {
  de: {
    controls: `<h3>Maus & Tastatur</h3><ul>
      <li><b>Klick auf eigene Einheiten</b> wählt den ganzen Stapel. Danach <b>Klick auf ein Ziel</b>: Bewegen – in Feindgebiet automatisch mit Angriff. Klick auf Feind: Angreifen.</li>
      <li><b>Ziehen</b> verschiebt die Karte, <b>Shift + Ziehen</b> zieht einen Auswahlrahmen. <b>Mausrad</b>: Zoom. Rechtsklick gibt ebenfalls Befehle.</li>
      <li>Die Knöpfe <b>Bodentruppen / Marine</b> links wählen alle passenden Einheiten im Bild, <b>Untätige</b> springt zu Einheiten ohne Befehl. <b>Luftwaffe</b> und <b>Raketen</b> öffnen eine Übersicht über alle Flugzeuge bzw. den Raketenvorrat im ganzen Land.</li>
      <li>Im Auswahlfenster wählst du per Klick einen Typ oder eine <b>einzelne Einheit</b> aus dem Stapel.</li>
      <li><b>Leertaste</b>: Pause. <b>1–3</b>: Tempo. <b>Strg+1–9</b>: Armee bilden, <b>Umschalt+1–9</b>: zur Armee hinzufügen, <b>1–9</b>: Armee wählen (zweimal: zentrieren).</li>
      <li><b>A</b> Angriffsbewegung, <b>F</b> schnell, <b>S</b> Stopp, <b>R</b> Rückzug, <b>E</b> Aussteigen, <b>Esc</b> Abbrechen/Menü.</li>
      <li><b>Doppelklick</b> auf eine Einheit wählt alle sichtbaren Einheiten dieses Typs.</li></ul>
      <h3>Touch (Handy / Tablet)</h3><ul>
      <li><b>Tippen</b> wählt einen Stapel. Mit Auswahl auf die Karte tippen: Bewegen. Auf Feind tippen: Angreifen.</li>
      <li><b>Ein Finger ziehen</b>: Karte verschieben. <b>Zwei Finger</b>: Zoomen.</li>
      <li><b>Rahmen</b>-Knopf oder <b>lange drücken und ziehen</b>: Auswahlrahmen.</li>
      <li>Befehle wie Angriff, Schnell oder Absetzen über die Befehlsleiste unten wählen und dann das Ziel antippen.</li></ul>`,
    economy: `<h3>Ressourcen</h3><p><b>Geld</b>, <b>Industrie</b> und <b>Öl</b> fließen jede Minute aus deinen Provinzen. Hauptstädte und Städte bringen Geld,
      Industriegebiete Industrie, Ölfelder Öl. Die Stufe einer Provinz (1–5) vervielfacht ihre Erträge.</p>
      <h3>Provinzen ausbauen</h3><p>Wähle eine Provinz und baue sie aus, um die Einnahmen zu steigern. Umkämpfte Provinzen liefern nur die Hälfte.</p>
      <h3>Institutionen</h3><p>Einheiten werden in passenden Institutionen rekrutiert: <b>Kaserne</b> (Infanterie), <b>Rüstungswerk</b> (Fahrzeuge),
      <b>Flugplatz</b> (Luftwaffe), <b>Werft</b> (Marine, nur an der Küste) und <b>Raketenbasis</b> (Raketen). Höhere Stufen schalten stärkere Einheiten frei.</p>
      <p>Jede Provinz hat eine Warteschlange mit bis zu acht Aufträgen. Mit <b>Anzahl ×3 / ×5 / ×10</b> rekrutierst du mehrere Einheiten mit einem Klick,
      unter <b>Kampfgruppen</b> eine fertige Armee mit Front, Aufklärung und Unterstützung. Mit <b>Zu Armee</b> stoßen neue Einheiten automatisch zu einer Armee. Abbrechen erstattet die Kosten.</p>
      <h3>Unterhalt</h3><p>Jede Einheit kostet laufend Geld und Öl. Oben siehst du dein Einkommen nach Abzug des Unterhalts; wird es rot, ist die Armee größer als deine Wirtschaft.</p>
      <h3>Daueraufträge</h3><p>Mit <b>↻</b> in der Produktionsliste wird eine Einheit immer wieder gebaut, solange das Geld reicht und die Einnahmen den Unterhalt decken.</p>
      <h3>Flugabwehr & Forschung</h3><p>Die <b>Flugabwehrstellung</b> schützt eine Provinz vor Flugzeugen, Hubschraubern und Raketen.
      Im <b>Forschungszentrum</b> entstehen Atomsprengköpfe, die jede Rakete einer Raketenbasis oder ein strategischer Bomber tragen kann.</p>`,
    combat: `<h3>Echtzeit mit Pause</h3><p>Der Krieg läuft in Echtzeit. Pausiere jederzeit und gib in Ruhe Befehle – jede Einheit ist einzeln steuerbar.</p>
      <h3>Sieg & Niederlage</h3><p>Jede Provinz bringt <b>Siegpunkte</b>: Hauptstadt 5, Stadt, Hafen, Industrie und Ölfeld 2, Luftwaffenbasis 1.
      Hast du (mit deinen Verbündeten) den Gegnern 70&nbsp;% ihrer Siegpunkte abgenommen und hältst das eine Minute, kapitulieren sie – Punktesieg.
      Hält der Feind mehr als 70&nbsp;% der Siegpunkte deines Heimatlands, kapituliert dein Land nach einer Minute. Den Stand zeigt das Ziel-Symbol oben.</p>
      <h3>Erobern</h3><p>Jede Provinz hat eine <b>Garnison</b>, die sich wehrt. Zerstöre sie mit Angriffen, dann erobern Bodentruppen ohne feindliche Verteidiger
      in der Nähe die Provinz. Infanterie und Pioniere erobern am schnellsten. Eroberte Provinzen verlieren eine Stufe.</p>
      <h3>Unterdrückung & Moral</h3><p>Beschuss unterdrückt Infanterie: Sie trifft schlechter, bewegt sich langsamer und flieht bei 100&nbsp;% ungeordnet.</p>
      <h3>Nebel des Krieges</h3><p>Du siehst Feinde nur in Sichtweite deiner Einheiten und Provinzen. Aufklärer, Scharfschützen und U-Boote sind schwer zu entdecken.</p>
      <h3>Versorgung</h3><p>Munition und Zustand regenerieren in eigenen Provinzen, bei Versorgungs-LKW, Sanitätern und Pionieren. Flugzeuge kehren zum Tanken zur Basis zurück. Mit <b>Dauereinsatz</b> fliegen sie danach von selbst wieder ins Einsatzgebiet; der gestrichelte Kreis beim Zielen zeigt, wie weit sie von ihrem Flugplatz kommen.</p>
      <h3>Über See</h3><p>Bodentruppen schiffen sich an der Küste automatisch ein, sind auf See aber sehr verwundbar. Sicherer ist das <b>Landungsschiff</b> (Werft): Truppen und Fahrzeuge mit dem Schiff wählen, <b>Verladen</b>, dann <b>Transport nach</b> und das Ufer antippen. Transportflugzeuge fliegen Truppen zwischen Flugplätzen.</p>
      <h3>Drohnen und Raketenabwehr</h3><p>Die <b>Aufklärungsdrohne</b> (Flugplatz) sieht sehr weit; im <b>Dauereinsatz</b> kreist sie über einem Gebiet. Der <b>Kamikaze-Drohnentrupp</b> trifft Fahrzeuge bis weit hinter der Front, die eigene Einheiten oder Drohnen sehen. <b>Patriot / S-400</b> (Rüstungswerk Stufe 3) schießt Flugzeuge auf große Entfernung ab und fängt Raketen im weiten Umkreis ab.</p>
      <h3>Transport</h3><p>Wähle Transporter und Truppen gemeinsam und tippe <b>Verladen</b> – alles wird automatisch verteilt, Hubschrauber fliegen den Truppen entgegen.
      Nur Transporter gewählt: <b>Aufnehmen</b> lädt Einheiten in der Nähe. <b>Transport nach</b> fährt bzw. fliegt zum Ziel und lädt dort aus.
      Am schnellsten: nur die Truppen wählen, <b>Lufttransport</b> und das Ziel antippen. Freie Hubschrauber und geparkte Transportflugzeuge in der Nähe holen sie ab, starten, sobald alle an Bord sind, und laden am Ziel aus (Flugzeuge landen auf einem eigenen Flugplatz in der Nähe, sonst springen nur Fallschirmjäger). Die Anzeige <b>belegt/Plätze</b> am Transporter zeigt grau = leer, gelb = teilweise, grün = voll.</p>
      <h3>Armeen</h3><p>Armeen 1–9 bündeln Einheiten. Mit <b>Formation halten</b> marschiert die Armee im Tempo der langsamsten Einheit; Kampfeinheiten gehen vorn, Unterstützung hinten.</p>
      <h3>Mehrere Armeen führen</h3><p>Weitere Armeen nimmst du im Seitenfenster unter <b>Gemeinsam führen</b> dazu, mit langem Drücken in der Armee-Leiste oder mit Umschalt+Klick. Aufträge gelten dann für alle, sie rücken nebeneinander vor. <b>Zusammenlegen</b> macht daraus eine Armee.</p>
      <h3>Auffrischen</h3><p>Jede Armee merkt sich ihren Soll-Bestand. Mit <b>Auffrischen</b> werden Verluste in der nächsten passenden Institution nachgebaut und stoßen zur Armee. Das kostet normal Geld und pausiert, solange der Unterhalt die Einnahmen übersteigt; eine ganz vernichtete Armee wird nicht neu aufgestellt.</p>
      <h3>Aufträge für Armeen</h3><p>Ist eine ganze Armee gewählt, erscheinen unten <b>Großangriff</b>, <b>Vorrücken</b> und <b>Halten</b>. Beim Großangriff klären Aufklärer auf,
      die Artillerie bereitet vor, dann stürmt die Front. Flugabwehr, Sanitäter und Versorgung folgen von selbst. Mit <b>Rückzug bei Verlusten</b> bricht die Armee ab,
      bevor sie aufgerieben wird. Ein direkter Befehl hebt den Auftrag auf.</p>
      <h3>Eingraben</h3><p>Einheiten, die stillstehen, graben sich ein (Sandsack-Bogen) und nehmen bis zu 40&nbsp;% weniger Schaden. Artillerie wirkt dagegen am besten.</p>
      <h3>Atomwaffen</h3><p>Ein Atomschlag zerstört alle feindlichen Einheiten im Umkreis, verwüstet Provinzen und hinterlässt Fallout, der Bodentruppen beider Seiten schadet.</p>`,
  },
  en: {
    controls: `<h3>Mouse & keyboard</h3><ul>
      <li><b>Click your units</b> to select the whole stack, then <b>click a target</b>: move – automatically attack-move into enemy territory. Click an enemy: attack.</li>
      <li><b>Drag</b> pans the map, <b>Shift + drag</b> draws a selection box. <b>Mouse wheel</b>: zoom. Right click also gives orders.</li>
      <li>The <b>Ground / Navy</b> buttons on the left select matching units on screen, <b>Idle</b> jumps to units without orders. <b>Air force</b> and <b>Missiles</b> open an overview of every aircraft and of the missile stock across the country.</li>
      <li>In the selection panel, click a type or a <b>single unit</b> from the stack.</li>
      <li><b>Space</b>: pause. <b>1–3</b>: speed. <b>Ctrl+1–9</b>: form army, <b>Shift+1–9</b>: add to army, <b>1–9</b>: select army (twice: center).</li>
      <li><b>A</b> attack-move, <b>F</b> fast, <b>S</b> stop, <b>R</b> retreat, <b>E</b> unload, <b>Esc</b> cancel/menu.</li>
      <li><b>Double click</b> a unit to select all visible units of that type.</li></ul>
      <h3>Touch (phone / tablet)</h3><ul>
      <li><b>Tap</b> to select. With a selection, tap the map to move, tap an enemy to attack.</li>
      <li><b>One-finger drag</b>: pan. <b>Two fingers</b>: zoom.</li>
      <li><b>Box</b> button or <b>long-press and drag</b>: selection box.</li>
      <li>Pick commands such as Attack, Fast or Air drop in the bottom bar, then tap the target.</li></ul>`,
    economy: `<h3>Resources</h3><p><b>Money</b>, <b>industry</b> and <b>oil</b> flow from your provinces every minute. Capitals and cities yield money,
      industrial zones industry, oil fields oil. A province's level (1–5) multiplies its yield.</p>
      <h3>Developing provinces</h3><p>Select a province and develop it to raise income. Contested provinces only yield half.</p>
      <h3>Institutions</h3><p>Units are recruited in matching institutions: <b>Barracks</b> (infantry), <b>Arms Factory</b> (vehicles),
      <b>Airfield</b> (air force), <b>Shipyard</b> (navy, coast only) and <b>Missile Base</b> (missiles). Higher levels unlock stronger units.</p>
      <p>Each province has a queue of up to eight orders. With <b>Amount ×3 / ×5 / ×10</b> one click recruits several units,
      <b>Battle groups</b> recruit a ready army with front, reconnaissance and support. With <b>To army</b> new units automatically join an army. Cancelling refunds the cost.</p>
      <h3>Upkeep</h3><p>Every unit costs money and oil continuously. The top bar shows your income after upkeep; when it turns red, your army is larger than your economy.</p>
      <h3>Standing orders</h3><p>With <b>↻</b> in the production list a unit is built again and again as long as money lasts and income covers upkeep.</p>
      <h3>Air defense & research</h3><p>An <b>Air Defense Site</b> protects a province against aircraft, helicopters and missiles.
      A <b>Research Facility</b> builds nuclear warheads that any missile of a missile base or a strategic bomber can carry.</p>`,
    combat: `<h3>Real time with pause</h3><p>The war runs in real time. Pause at any moment and issue orders calmly – every unit can be commanded individually.</p>
      <h3>Victory & defeat</h3><p>Every province is worth <b>victory points</b>: capital 5; city, port, industry and oil field 2; air base 1.
      Once you and your allies have taken 70&nbsp;% of the enemies' victory points and hold that for one minute, they surrender – points victory.
      If the enemy holds more than 70&nbsp;% of your homeland's victory points, your country surrenders after one minute. The objectives icon at the top shows the score.</p>
      <h3>Capturing</h3><p>Every province has a <b>garrison</b> that fights back. Wear it down, then ground troops capture the province when no enemy defenders
      are nearby. Infantry and engineers capture fastest. Captured provinces lose one level.</p>
      <h3>Suppression & morale</h3><p>Incoming fire suppresses infantry: it shoots worse, moves slower and routs at 100&nbsp;%.</p>
      <h3>Fog of war</h3><p>You only see enemies within sight of your units and provinces. Recon, snipers and submarines are hard to spot.</p>
      <h3>Supply</h3><p>Ammo and condition recover in your own provinces, near supply trucks, medics and engineers. Aircraft return to base to refuel. With a <b>standing mission</b> they then fly back to the mission area on their own; the dashed circle while aiming shows how far they reach from their airfield.</p>
      <h3>Across the sea</h3><p>Ground troops embark automatically at the coast but are very vulnerable at sea. The <b>landing ship</b> (shipyard) is safer: select troops and vehicles together with the ship, <b>Load up</b>, then <b>Transport to</b> and tap the shore. Transport aircraft fly troops between airfields.</p>
      <h3>Drones and missile defense</h3><p>The <b>reconnaissance drone</b> (airfield) sees very far; on a <b>standing mission</b> it circles an area. The <b>loitering munition team</b> hits vehicles far behind the front that your units or drones can see. <b>Patriot / S-400</b> (arms factory level 3) downs aircraft at long range and intercepts missiles over a wide area.</p>
      <h3>Transport</h3><p>Select transports and troops together and tap <b>Load up</b> – everyone is distributed automatically, helicopters fly to meet the troops.
      Transports only: <b>Pick up</b> loads nearby units. <b>Transport to</b> drives or flies to the destination and unloads there.
      Quickest: select just the troops, tap <b>Airlift</b> and the destination. Free helicopters and parked transport planes nearby fetch them, take off once everyone is aboard and unload at the destination (planes land at an own airfield nearby, otherwise only paratroopers jump). The <b>used/slots</b> tag on a transport shows grey = empty, yellow = partly loaded, green = full.</p>
      <h3>Armies</h3><p>Armies 1–9 bundle units. With <b>Keep together</b> an army marches at the pace of its slowest unit; combat units lead, support follows.</p>
      <h3>Leading several armies</h3><p>Add more armies in the side panel under <b>Lead together</b>, with a long press in the army bar or with Shift+click. Tasks then apply to all of them, side by side. <b>Merge</b> turns them into one army.</p>
      <h3>Refill</h3><p>Every army remembers its target strength. With <b>Refill</b>, losses are rebuilt at the nearest suitable institution and join the army. This costs the normal price and pauses while upkeep exceeds income; an army that was wiped out is not raised again.</p>
      <h3>Army tasks</h3><p>With a whole army selected, <b>Assault</b>, <b>Advance</b> and <b>Hold</b> appear at the bottom. In an assault, scouts probe ahead,
      artillery prepares, then the front attacks. Air defense, medics and supply follow on their own. With <b>Retreat on losses</b> the army breaks off
      before it is destroyed. A direct order cancels the task.</p>
      <h3>Digging in</h3><p>Units that stand still dig in (sandbag arc) and take up to 40&nbsp;% less damage. Artillery works best against them.</p>
      <h3>Nuclear weapons</h3><p>A nuclear strike destroys every enemy unit in its radius, devastates provinces and leaves fallout that harms ground troops of both sides.</p>`,
  },
};

// Tutorial texts by step id; order, triggers and highlighted buttons are in UI.TUT_STEPS.
const TUTORIAL = {
  de: {
    welcome: { h: 'Willkommen, Kommandant', b: 'Dein Bündnis ist <b>blau</b> (Verbündete türkis), der Feind <b>rot</b>. Das Spiel ist pausiert – in Ruhe lernst du jetzt, deine Armeen zu führen.' },
    map: { h: 'Die Karte', b: 'Verschiebe die Karte durch Ziehen und zoome mit zwei Fingern oder dem Mausrad. Symbole zeigen Städte, Fabriken, Ölfelder, Häfen und Flugplätze.' },
    army: { h: 'Armeen', b: 'Deine Truppen sind in <b>Armeen</b> eingeteilt: gemischte Kampfgruppen mit Panzern, Infanterie, Artillerie und Unterstützung. Tippe auf <b>Armee 1</b>.' },
    armyPanel: { h: 'Die Armee', b: 'Rechts siehst du Auftrag und Zusammensetzung. <b>Rückzug bei Verlusten</b>: Die Armee bricht einen Angriff bei hohen Verlusten selbst ab. <b>Formation halten</b>: alle Einheiten bleiben zusammen.' },
    hold: { h: 'Halten', b: 'Ein Auftrag genügt, den Rest führt die Armee selbst aus. Tippe auf <b>Halten</b>: Die Armee bleibt stehen und gräbt sich ein – mit der Zeit verteidigt sie sich immer besser.' },
    attack: { h: 'Großangriff', b: 'Tippe auf <b>Großangriff</b> und dann auf eine feindliche (rote) Provinz. Die Armee klärt auf, lässt die Artillerie feuern, stürmt und hält das Ziel. <b>Vorrücken</b> marschiert und kämpft unterwegs, <b>Bewegen</b> ist ein einfacher Marschbefehl.' },
    time: { h: 'Zeit starten', b: 'Bisher war alles pausiert. Tippe auf <b>▶</b>, damit die Zeit läuft. Mit Pause kannst du jederzeit anhalten und in Ruhe Befehle geben.' },
    province: { h: 'Provinzen', b: 'Tippe auf das Symbol deiner Hauptstadt (Stern), um ihr Provinzfenster zu öffnen.' },
    recruit: { h: 'Kampfgruppen rekrutieren', b: 'Unter <b>Kampfgruppen</b> rekrutierst du mit einem Tippen eine ganze neue Armee. Sie erscheint nach der Bauzeit. Einzelne Einheiten gibt es in den Reitern der Institutionen.' },
    economy: { h: 'Wirtschaft', b: 'Oben siehst du Geld, Industrie und Öl. Jede Einheit kostet laufend <b>Unterhalt</b> – wird ein Wert rot, ist deine Armee zu groß für deine Wirtschaft (Antippen zeigt Einnahmen und Unterhalt). Unter <b>Ausbau</b> machst du Provinzen ertragreicher.' },
    objectives: { h: 'Ziele', b: 'Tippe auf das Ziel-Symbol: Dort siehst du deine Siegpunkte. Nimmst du den Gegnern 70 % ab und hältst das eine Minute, gewinnst du.' },
    ready: { h: 'Bereit', b: 'Achte auf die Meldungen links oben: Die Aufklärung warnt, wenn der Feind Truppen sammelt – antippen springt hin. Alle Details stehen unter <b>Menü → Hilfe & Einheiten</b>. Viel Erfolg!' },
  },
  en: {
    welcome: { h: 'Welcome, Commander', b: 'Your alliance is <b>blue</b> (allies teal), the enemy <b>red</b>. The game is paused – take your time to learn how to lead your armies.' },
    map: { h: 'The map', b: 'Drag to pan and zoom with two fingers or the mouse wheel. Icons mark cities, factories, oil fields, ports and airfields.' },
    army: { h: 'Armies', b: 'Your troops are organised in <b>armies</b>: mixed battle groups with tanks, infantry, artillery and support. Tap <b>army 1</b>.' },
    armyPanel: { h: 'The army', b: 'On the right you see its task and units. <b>Retreat on losses</b>: the army breaks off an attack on its own when losses are high. <b>Keep together</b>: all units stay in formation.' },
    hold: { h: 'Hold', b: 'One task is enough, the army carries out the rest itself. Tap <b>Hold</b>: the army stops and digs in – the longer it stays, the better it defends.' },
    attack: { h: 'Assault', b: 'Tap <b>Assault</b>, then an enemy (red) province. The army scouts, lets the artillery fire, storms and holds the target. <b>Advance</b> marches and fights on the way, <b>Move</b> is a plain march order.' },
    time: { h: 'Start the clock', b: 'Everything was paused so far. Tap <b>▶</b> to let time run. Pause at any moment to give orders calmly.' },
    province: { h: 'Provinces', b: 'Tap the icon of your capital (star) to open its province panel.' },
    recruit: { h: 'Recruit battle groups', b: 'Under <b>Battle groups</b> one tap recruits a whole new army. It appears after its build time. Single units are in the institution tabs.' },
    economy: { h: 'Economy', b: 'The top bar shows money, industry and oil. Every unit costs continuous <b>upkeep</b> – when a value turns red, your army is too large for your economy (tap it for income and upkeep). Use <b>Develop</b> to make provinces earn more.' },
    objectives: { h: 'Objectives', b: 'Tap the objectives icon: it shows your victory points. Take 70 % of the enemies\' points and hold for a minute to win.' },
    ready: { h: 'Ready', b: 'Watch the messages at the top left: reconnaissance warns you when the enemy gathers troops – tap to jump there. All details are under <b>Menu → Help & Units</b>. Good luck!' },
  },
};

const I18N = {
  lang: 'de',
  set(l) { this.lang = STR[l] ? l : 'de'; document.documentElement.lang = this.lang; },
};
function t(key, ...a) {
  let s = STR[I18N.lang][key] ?? STR.de[key] ?? key;
  if (typeof s === 'string') a.forEach((v, i) => { s = s.replace('{' + i + '}', v); });
  return s;
}
const L = (o) => (o ? o[I18N.lang] ?? o.de : '');
function countryName(c) { return I18N.lang === 'en' ? c.en : c.de; }
function provName(p) {
  if (p.name) return p.name;
  return `${L(PROVINCE_TYPES[p.type])} ${t('dir')[p.dir]}${p.suffix || ''}`;
}
function unitName(t) { return L(UNIT_TYPES[t]); }
function modelName(u) {
  const T = UNIT_TYPES[u.t];
  return EAST_DOCTRINE.has(u.s) ? T.me : T.mw;
}
