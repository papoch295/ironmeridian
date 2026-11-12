// Unit, weapon, missile and building definitions. Distances are map units (~1 unit = 1 degree of longitude).
'use strict';

// Target classes: soft (infantry), light (light vehicles), armor (tanks), heli, air, ship, sub.
const W = {
  rifle:   { r: 0.35, rof: 1.0, acc: 0.5,  dmg: { soft: 4, light: 0.6, heli: 0.6 }, sup: 4, fx: 'mg' },
  carbine: { r: 0.4,  rof: 0.9, acc: 0.7,  dmg: { soft: 7, light: 1, heli: 1 }, sup: 6, fx: 'mg' },
  rpg:     { r: 0.25, rof: 5,   acc: 0.55, dmg: { soft: 4, light: 18, armor: 12 }, ammo: 8, sup: 6, fx: 'rocket' },
  flamer:  { r: 0.2,  rof: 2,   acc: 0.7,  dmg: { soft: 12, light: 4 }, sup: 18, fx: 'mg' },
  sniper:  { r: 0.65, rof: 4,   acc: 0.85, dmg: { soft: 15 }, sup: 14, fx: 'shot' },
  atgm:    { r: 0.55, rof: 6,   acc: 0.72, dmg: { soft: 3, light: 32, armor: 48, heli: 14 }, ammo: 6, sup: 8, fx: 'rocket' },
  mg:      { r: 0.4,  rof: 0.5, acc: 0.45, dmg: { soft: 5, light: 1.5, heli: 1.2 }, sup: 6, fx: 'mg' },
  ac30:    { r: 0.45, rof: 1.2, acc: 0.55, dmg: { soft: 8, light: 16, armor: 4, heli: 9 }, sup: 8, fx: 'cannon' },
  ifvAtgm: { r: 0.6,  rof: 8,   acc: 0.7,  dmg: { light: 30, armor: 45, heli: 12 }, ammo: 2, sup: 6, fx: 'rocket' },
  gun120:  { r: 0.55, rof: 4,   acc: 0.72, dmg: { soft: 14, light: 40, armor: 55, ship: 8 }, sup: 12, fx: 'cannon' },
  gun105:  { r: 0.5,  rof: 3.5, acc: 0.65, dmg: { soft: 12, light: 32, armor: 28, ship: 6 }, sup: 10, fx: 'cannon' },
  hvAtgm:  { r: 0.85, rof: 7,   acc: 0.78, dmg: { light: 45, armor: 70, heli: 16 }, ammo: 10, sup: 8, fx: 'rocket' },
  mortar:  { r: 0.9,  rof: 4,   acc: 0.3,  dmg: { soft: 12, light: 5, armor: 1 }, minR: 0.1, aoe: 0.12, indirect: 1, ammo: 40, sup: 25, fx: 'shell' },
  how155:  { r: 2.0,  rof: 7,   acc: 0.3,  dmg: { soft: 25, light: 20, armor: 12, ship: 10 }, minR: 0.3, aoe: 0.18, indirect: 1, ammo: 30, sup: 40, fx: 'shell' },
  spg155:  { r: 2.4,  rof: 6,   acc: 0.32, dmg: { soft: 25, light: 20, armor: 14, ship: 10 }, minR: 0.3, aoe: 0.18, indirect: 1, ammo: 36, sup: 40, fx: 'shell' },
  mlrs:    { r: 3.0,  rof: 2,   acc: 0.25, dmg: { soft: 16, light: 14, armor: 6, ship: 6 }, minR: 0.5, aoe: 0.25, indirect: 1, ammo: 8, sup: 45, fx: 'rocket' },
  tbm:     { r: 9.0,  rof: 60,  acc: 0.85, dmg: { soft: 60, light: 80, armor: 60, ship: 60 }, minR: 1, aoe: 0.3, indirect: 1, ammo: 2, sup: 80, fx: 'missile' },
  sam:     { r: 2.6,  rof: 3,   acc: 0.8,  dmg: { heli: 65, air: 75 }, ammo: 8, fx: 'missile', aa: 1 },
  ciws:    { r: 0.8,  rof: 1.5, acc: 0.5,  dmg: { heli: 18, air: 20 }, fx: 'mg', aa: 1 },
  heliAtgm:{ r: 0.9,  rof: 5,   acc: 0.72, dmg: { soft: 14, light: 45, armor: 62, ship: 20 }, ammo: 12, sup: 10, fx: 'rocket' },
  heliGun: { r: 0.6,  rof: 1.0, acc: 0.55, dmg: { soft: 10, light: 12, armor: 3, heli: 10 }, sup: 10, fx: 'cannon' },
  aam:     { r: 1.6,  rof: 4,   acc: 0.72, dmg: { air: 80, heli: 65 }, ammo: 4, fx: 'missile', aa: 1 },
  agm:     { r: 0.5,  rof: 3,   acc: 0.7,  dmg: { soft: 40, light: 60, armor: 55, ship: 55 }, aoe: 0.2, ammo: 2, sup: 50, fx: 'bomb' },
  bombs:   { r: 0.5,  rof: 1.0, acc: 0.55, dmg: { soft: 50, light: 60, armor: 50, ship: 60 }, aoe: 0.3, ammo: 16, sup: 60, fx: 'bomb' },
  navGun:  { r: 2.0,  rof: 3,   acc: 0.4,  dmg: { soft: 20, light: 25, armor: 15, ship: 35 }, aoe: 0.1, sup: 30, fx: 'shell' },
  corvGun: { r: 1.5,  rof: 2.5, acc: 0.4,  dmg: { soft: 12, light: 15, armor: 8, ship: 22 }, aoe: 0.08, sup: 20, fx: 'shell' },
  ashm:    { r: 5.0,  rof: 15,  acc: 0.8,  dmg: { ship: 160 }, ammo: 8, fx: 'missile' },
  ashmS:   { r: 3.5,  rof: 15,  acc: 0.8,  dmg: { ship: 120 }, ammo: 4, fx: 'missile' },
  navSam:  { r: 3.2,  rof: 4,   acc: 0.75, dmg: { heli: 70, air: 70 }, ammo: 24, fx: 'missile', aa: 1 },
  asw:     { r: 1.2,  rof: 8,   acc: 0.6,  dmg: { sub: 60 }, ammo: 10, fx: 'torpedo' },
  torpedo: { r: 1.2,  rof: 8,   acc: 0.7,  dmg: { ship: 150, sub: 80 }, ammo: 12, fx: 'torpedo' },
  // Loitering munition: one drone per shot against a spotted vehicle far behind the front (standoff = stays back
  // like artillery in a battle group, noProv = never wasted on a province garrison).
  loiter:  { r: 2.4,  rof: 12,  acc: 0.8,  dmg: { light: 45, armor: 60, ship: 25 }, ammo: 3, sup: 20, fx: 'missile', standoff: 1, noProv: 1 },
  lrsam:   { r: 4.0,  rof: 5,   acc: 0.8,  dmg: { heli: 70, air: 85 }, ammo: 6, fx: 'missile', aa: 1 },
  // Beta 2 units: ground-attack aircraft (gun + Maverick / Kh-25), stealth fighter, frigate, coastal battery.
  gau:     { r: 0.6,  rof: 0.9, acc: 0.6,  dmg: { soft: 12, light: 24, armor: 16, heli: 10 }, sup: 25, fx: 'cannon' },
  mav:     { r: 0.8,  rof: 4,   acc: 0.75, dmg: { light: 50, armor: 65, ship: 30 }, ammo: 6, sup: 20, fx: 'rocket' },
  aam2:    { r: 2.1,  rof: 3.5, acc: 0.8,  dmg: { air: 90, heli: 70 }, ammo: 6, fx: 'missile', aa: 1 },
  navSamS: { r: 2.4,  rof: 4,   acc: 0.72, dmg: { heli: 60, air: 60 }, ammo: 16, fx: 'missile', aa: 1 },
  asw2:    { r: 1.6,  rof: 7,   acc: 0.7,  dmg: { sub: 75 }, ammo: 14, fx: 'torpedo' },
  ashmC:   { r: 4.5,  rof: 14,  acc: 0.8,  dmg: { ship: 140 }, ammo: 4, fx: 'missile', standoff: 1, noProv: 1 },
};

// cls: target class. dom: land/air/sea. bld/tier: required building and level. cost: m = money, i = industry, o = oil.
// men: squad size (infantry hp = men * 10). cap: transport slots. seat: slots it occupies. fuel: sortie seconds.
// Special roles: awacs (radius in which friendly aircraft shoot better; sees aircraft and ships at full range),
// sonar (share of vis at which submarines are found), amph (lands without disorder), jam (jamming radius),
// hq (command radius) – the effects are tuned in SUPPORT_FX below.
const UNIT_TYPES = {
  inf:    { cls: 'soft', dom: 'land', sym: 'inf', bld: 'barracks', tier: 1, cost: { m: 120, i: 20, o: 0 }, time: 14, men: 10, hp: 100, spd: 0.055, vis: 0.9, st: 0.3, seat: 1, w: ['rifle', 'rpg'],
    de: 'Infanterie', en: 'Infantry', mw: 'Mech. Infanteriezug', me: 'Motostrelki', dd: 'Rückgrat jeder Armee. Günstig, kann Provinzen erobern und Städte halten.', ed: 'Backbone of every army. Cheap, captures provinces and holds cities.' },
  seal:   { cls: 'soft', dom: 'land', sym: 'sof', bld: 'barracks', tier: 2, cost: { m: 380, i: 60, o: 0 }, time: 28, men: 6, hp: 80, spd: 0.065, vis: 1.15, st: 0.65, seat: 1, w: ['carbine', 'atgm'], capture: 2, airdrop: 1,
    de: 'Spezialeinheit (SEAL)', en: 'Special Forces (SEAL)', mw: 'Navy SEAL Team', me: 'Spetsnaz', dd: 'Elite-Trupp. Schwer zu entdecken, erobert doppelt so schnell, kann per Fallschirm abgesetzt werden.', ed: 'Elite squad. Hard to spot, captures twice as fast, can be air-dropped.' },
  sniper: { cls: 'soft', dom: 'land', sym: 'snp', bld: 'barracks', tier: 2, cost: { m: 200, i: 20, o: 0 }, time: 18, men: 2, hp: 25, spd: 0.05, vis: 1.4, st: 0.85, seat: 1, w: ['sniper'],
    de: 'Scharfschützen', en: 'Snipers', mw: 'Sniper Team M110', me: 'SV-98 Team', dd: 'Nahezu unsichtbar, große Sichtweite, tödlich gegen Infanterie.', ed: 'Nearly invisible, long sight, deadly against infantry.' },
  recon:  { cls: 'soft', dom: 'land', sym: 'rec', bld: 'barracks', tier: 1, cost: { m: 150, i: 30, o: 0 }, time: 14, men: 4, hp: 40, spd: 0.07, vis: 1.9, st: 0.7, seat: 1, w: ['rifle'],
    de: 'Aufklärer', en: 'Recon', mw: 'LRS Team', me: 'Razvedka', dd: 'Größte Sichtweite der Bodentruppen. Deckt den Nebel des Krieges auf.', ed: 'Longest sight of all ground troops. Lifts the fog of war.' },
  at:     { cls: 'soft', dom: 'land', sym: 'at', bld: 'barracks', tier: 1, cost: { m: 220, i: 50, o: 0 }, time: 18, men: 4, hp: 45, spd: 0.05, vis: 0.9, st: 0.45, seat: 1, w: ['atgm'],
    de: 'Panzerabwehrtrupp', en: 'Anti-Tank Team', mw: 'Javelin Team', me: 'Kornet Team', dd: 'Lenkflugkörper gegen Fahrzeuge und Hubschrauber.', ed: 'Guided missiles against vehicles and helicopters.' },
  eng:    { cls: 'soft', dom: 'land', sym: 'eng', bld: 'barracks', tier: 1, cost: { m: 160, i: 40, o: 0 }, time: 16, men: 8, hp: 80, spd: 0.055, vis: 0.9, st: 0.3, seat: 1, w: ['rifle', 'flamer'], capture: 2.5, repair: 1.5,
    de: 'Pioniere', en: 'Engineers', mw: 'Combat Engineers', me: 'Sapery', dd: 'Erobern Provinzen am schnellsten und reparieren Fahrzeuge in der Nähe.', ed: 'Fastest at capturing provinces; repair nearby vehicles.' },
  medic:  { cls: 'soft', dom: 'land', sym: 'med', bld: 'barracks', tier: 1, cost: { m: 140, i: 20, o: 0 }, time: 14, men: 4, hp: 40, spd: 0.06, vis: 0.9, st: 0.4, seat: 1, w: ['rifle'], heal: 1.2,
    de: 'Sanitäter', en: 'Medics', mw: 'Combat Medics', me: 'Sanitary', dd: 'Heilen Infanterie in der Umgebung und senken deren Unterdrückung.', ed: 'Heal nearby infantry and reduce their suppression.' },
  mortar: { cls: 'soft', dom: 'land', sym: 'mor', bld: 'barracks', tier: 1, cost: { m: 180, i: 40, o: 0 }, time: 16, men: 5, hp: 50, spd: 0.045, vis: 0.8, st: 0.4, seat: 1, w: ['mortar'],
    de: 'Mörsertrupp', en: 'Mortar Team', mw: 'M252 81mm', me: '2B14 Podnos', dd: 'Indirektes Feuer auf kurze Distanz. Stark gegen Infanterie.', ed: 'Short-range indirect fire. Strong against infantry.' },
  para:   { cls: 'soft', dom: 'land', sym: 'para', bld: 'airfield', tier: 1, cost: { m: 220, i: 40, o: 0 }, time: 18, men: 10, hp: 100, spd: 0.055, vis: 0.95, st: 0.35, seat: 1, w: ['rifle', 'rpg'], airdrop: 1,
    de: 'Fallschirmjäger', en: 'Paratroopers', mw: '82nd Airborne', me: 'VDV', dd: 'Wie Infanterie, aber per Transportflugzeug überall absetzbar.', ed: 'Like infantry, but can be dropped anywhere from a transport plane.' },
  truck:  { cls: 'light', dom: 'land', sym: 'sup', bld: 'factory', tier: 1, cost: { m: 120, i: 40, o: 10 }, time: 12, hp: 40, spd: 0.11, vis: 0.7, st: 0.2, seat: 2, w: [], supply: 1,
    de: 'Versorgungs-LKW', en: 'Supply Truck', mw: 'HEMTT', me: 'KamAZ-5350', dd: 'Füllt die Munition von Einheiten in der Nähe auf.', ed: 'Resupplies ammunition of nearby units.' },
  apc:    { cls: 'light', dom: 'land', sym: 'apc', bld: 'factory', tier: 1, cost: { m: 220, i: 80, o: 20 }, time: 16, hp: 90, spd: 0.11, vis: 0.9, st: 0.25, seat: 2, cap: 3, w: ['mg'],
    de: 'Transportpanzer (APC)', en: 'APC', mw: 'Stryker ICV', me: 'BTR-82A', dd: 'Schneller, leicht gepanzerter Transport für drei Infanterietrupps.', ed: 'Fast, lightly armored transport for three infantry squads.' },
  ifv:    { cls: 'light', dom: 'land', sym: 'ifv', bld: 'factory', tier: 1, cost: { m: 380, i: 140, o: 30 }, time: 22, hp: 140, spd: 0.1, vis: 0.95, st: 0.25, seat: 2, cap: 2, w: ['ac30', 'ifvAtgm'],
    de: 'Schützenpanzer (IFV)', en: 'IFV', mw: 'M2A3 Bradley / Puma', me: 'BMP-3', dd: 'Maschinenkanone und Panzerabwehrrakete, transportiert zwei Trupps.', ed: 'Autocannon and ATGM, carries two squads.' },
  lt:     { cls: 'light', dom: 'land', sym: 'lt', bld: 'factory', tier: 1, cost: { m: 450, i: 180, o: 40 }, time: 24, hp: 170, spd: 0.12, vis: 1.0, st: 0.3, seat: 2, w: ['gun105', 'mg'],
    de: 'Leichter Panzer', en: 'Light Tank', mw: 'M10 Booker', me: '2S25 Sprut-SD', dd: 'Schnell und beweglich, ideal für Aufklärung und Flanken.', ed: 'Fast and agile, ideal for scouting and flanking.' },
  aa:     { cls: 'light', dom: 'land', sym: 'aa', bld: 'factory', tier: 1, cost: { m: 500, i: 200, o: 30 }, time: 24, hp: 90, spd: 0.1, vis: 1.3, st: 0.25, seat: 2, w: ['sam'], intercept: 0.35,
    de: 'Flugabwehr (SAM)', en: 'Air Defense (SAM)', mw: 'NASAMS / Avenger', me: 'Pantsir-S1', dd: 'Schießt Flugzeuge und Hubschrauber ab, fängt Raketen teilweise ab.', ed: 'Shoots down aircraft and helicopters, partially intercepts missiles.' },
  arty:   { cls: 'light', dom: 'land', sym: 'art', bld: 'factory', tier: 1, cost: { m: 350, i: 150, o: 10 }, time: 22, hp: 60, spd: 0.05, vis: 0.7, st: 0.35, seat: 2, w: ['how155'],
    de: 'Feldartillerie', en: 'Towed Artillery', mw: 'M777 155mm', me: '2A65 Msta-B', dd: 'Gezogene Haubitze. Hohe Reichweite, aber langsam und verwundbar.', ed: 'Towed howitzer. Long range but slow and vulnerable.' },
  mbt:    { cls: 'armor', dom: 'land', sym: 'arm', bld: 'factory', tier: 2, cost: { m: 950, i: 420, o: 70 }, time: 44, hp: 300, spd: 0.1, vis: 1.0, st: 0.15, seat: 3, w: ['gun120', 'mg'],
    de: 'Kampfpanzer (MBT)', en: 'Main Battle Tank', mw: 'Leopard 2A7 / M1A2', me: 'T-90M', dd: 'Schwer gepanzert, starke Kanone. Herzstück jeder Offensive.', ed: 'Heavily armored with a powerful gun. Core of every offensive.' },
  td:     { cls: 'light', dom: 'land', sym: 'td', bld: 'factory', tier: 2, cost: { m: 660, i: 280, o: 40 }, time: 32, hp: 150, spd: 0.11, vis: 1.0, st: 0.35, seat: 2, w: ['hvAtgm'],
    de: 'Jagdpanzer', en: 'Tank Destroyer', mw: 'M1134 ATGM', me: '9P163 Kornet-T', dd: 'Weitreichende Panzerabwehr. Zerstört Panzer, bevor sie feuern können.', ed: 'Long-range anti-tank. Kills tanks before they can fire.' },
  spg:    { cls: 'light', dom: 'land', sym: 'spa', bld: 'factory', tier: 2, cost: { m: 820, i: 350, o: 45 }, time: 38, hp: 120, spd: 0.09, vis: 0.8, st: 0.25, seat: 3, w: ['spg155'],
    de: 'Panzerhaubitze', en: 'Self-Propelled Gun', mw: 'PzH 2000 / M109A7', me: '2S19M2 Msta-S', dd: 'Selbstfahrende Artillerie: feuert und wechselt schnell die Stellung.', ed: 'Self-propelled artillery: fires and relocates quickly.' },
  mlrs:   { cls: 'light', dom: 'land', sym: 'mlrs', bld: 'factory', tier: 2, cost: { m: 880, i: 380, o: 45 }, time: 40, hp: 90, spd: 0.1, vis: 0.8, st: 0.25, seat: 2, w: ['mlrs'],
    de: 'Raketenwerfer (kurz)', en: 'Rocket Artillery (short)', mw: 'M270 MLRS', me: 'BM-30 Smerch', dd: 'Salvenfeuer auf große Flächen. Verheerend gegen Ansammlungen.', ed: 'Saturation fire on large areas. Devastating against concentrations.' },
  tbm:    { cls: 'light', dom: 'land', sym: 'tbm', bld: 'factory', tier: 3, cost: { m: 1500, i: 600, o: 70 }, time: 52, hp: 90, spd: 0.09, vis: 0.8, st: 0.25, seat: 3, w: ['tbm'],
    de: 'Raketenartillerie (lang)', en: 'Rocket Artillery (long)', mw: 'HIMARS ATACMS', me: '9K720 Iskander-M', dd: 'Präzise Raketen mit sehr großer Reichweite gegen wichtige Ziele.', ed: 'Precise long-range missiles against high-value targets.' },
  thelo:  { cls: 'heli', dom: 'air', sym: 'thelo', bld: 'airfield', tier: 1, cost: { m: 450, i: 200, o: 40 }, time: 24, hp: 120, spd: 0.35, vis: 1.2, st: 0.2, cap: 4, w: ['mg'], heli: 1,
    de: 'Transporthubschrauber', en: 'Transport Helicopter', mw: 'UH-60M Black Hawk', me: 'Mi-8AMTSh', dd: 'Bringt vier Trupps schnell über Hindernisse und Flüsse.', ed: 'Moves four squads quickly over obstacles and rivers.' },
  ahelo:  { cls: 'heli', dom: 'air', sym: 'ahelo', bld: 'airfield', tier: 2, cost: { m: 1050, i: 460, o: 70 }, time: 40, hp: 160, spd: 0.4, vis: 1.3, st: 0.2, w: ['heliAtgm', 'heliGun'], heli: 1,
    de: 'Kampfhubschrauber', en: 'Attack Helicopter', mw: 'AH-64E Apache', me: 'Ka-52M Alligator', dd: 'Jagt Panzer aus der Luft. Anfällig für Flugabwehr.', ed: 'Hunts tanks from the air. Vulnerable to air defense.' },
  tplane: { cls: 'air', dom: 'air', sym: 'tpl', bld: 'airfield', tier: 1, cost: { m: 700, i: 300, o: 80 }, time: 30, hp: 160, spd: 0.75, vis: 1.0, st: 0.1, cap: 8, capVeh: 1, w: [], plane: 1,
    de: 'Transportflugzeug', en: 'Transport Aircraft', mw: 'C-17 Globemaster III', me: 'Il-76MD-90A', dd: 'Fliegt Truppen und Fahrzeuge zwischen Flugplätzen, setzt Fallschirmjäger ab.', ed: 'Flies troops and vehicles between airfields, drops paratroopers.' },
  jet:    { cls: 'air', dom: 'air', sym: 'jet', bld: 'airfield', tier: 2, cost: { m: 1600, i: 700, o: 130 }, time: 46, hp: 120, spd: 1.3, vis: 1.6, st: 0.3, w: ['aam', 'agm'], plane: 1, fuel: 70,
    de: 'Mehrzweckkampfjet', en: 'Multirole Fighter', mw: 'F-35A / Eurofighter', me: 'Su-35S', dd: 'Luftüberlegenheit und Präzisionsangriffe. Kehrt zum Auftanken zur Basis zurück.', ed: 'Air superiority and precision strikes. Returns to base to refuel.' },
  bomber: { cls: 'air', dom: 'air', sym: 'bmb', bld: 'airfield', tier: 3, cost: { m: 2900, i: 1200, o: 220 }, time: 64, hp: 220, spd: 0.9, vis: 1.2, st: 0.25, w: ['bombs'], plane: 1, fuel: 140,
    de: 'Strategischer Bomber', en: 'Strategic Bomber', mw: 'B-21 Raider', me: 'Tu-160M', dd: 'Teppichbombardement großer Flächen weit hinter der Front.', ed: 'Carpet-bombs large areas far behind the front.' },
  corv:   { cls: 'ship', dom: 'sea', sym: 'corv', bld: 'shipyard', tier: 1, cost: { m: 900, i: 400, o: 60 }, time: 34, hp: 260, spd: 0.17, vis: 1.6, st: 0.2, w: ['corvGun', 'ashmS', 'asw'],
    de: 'Korvette', en: 'Corvette', mw: 'Braunschweig-Klasse', me: 'Karakurt-Klasse', dd: 'Kleines, schnelles Küstenkampfschiff mit Seezielflugkörpern.', ed: 'Small, fast littoral warship with anti-ship missiles.' },
  sub:    { cls: 'sub', dom: 'sea', sym: 'sub', bld: 'shipyard', tier: 1, cost: { m: 1300, i: 600, o: 80 }, time: 40, hp: 220, spd: 0.14, vis: 1.3, st: 0.85, w: ['torpedo'],
    de: 'U-Boot', en: 'Submarine', mw: 'Typ 212CD', me: 'Kilo-Klasse (636.3)', dd: 'Unsichtbarer Jäger unter Wasser. Versenkt Schiffe mit Torpedos.', ed: 'Invisible underwater hunter. Sinks ships with torpedoes.' },
  dd:     { cls: 'ship', dom: 'sea', sym: 'dd', bld: 'shipyard', tier: 2, cost: { m: 2200, i: 1000, o: 150 }, time: 50, hp: 520, spd: 0.16, vis: 2.0, st: 0.15, w: ['navGun', 'ashm', 'navSam', 'asw'], intercept: 0.5,
    de: 'Zerstörer', en: 'Destroyer', mw: 'Arleigh-Burke-Klasse', me: 'Admiral-Gorschkow-Klasse', dd: 'Vielseitiges Kriegsschiff: Flugabwehr, Seeziele, Küstenbeschuss.', ed: 'Versatile warship: air defense, anti-ship, shore bombardment.' },
  cv:     { cls: 'ship', dom: 'sea', sym: 'cv', bld: 'shipyard', tier: 3, cost: { m: 6000, i: 3000, o: 400 }, time: 90, hp: 1200, spd: 0.13, vis: 2.2, st: 0.05, w: ['ciws'], strike: { r: 14, cd: 90 },
    de: 'Flugzeugträger', en: 'Aircraft Carrier', mw: 'Gerald-R.-Ford-Klasse', me: 'Fujian-Klasse', dd: 'Schwimmende Luftwaffenbasis: startet Luftschläge mit großer Reichweite.', ed: 'Floating air base: launches long-range air strikes.' },
  // ---------- Added after Beta 1.0: drones, long-range air defense, landing ship ----------
  uav:    { cls: 'air', dom: 'air', sym: 'uav', bld: 'airfield', tier: 1, cost: { m: 350, i: 150, o: 20 }, time: 22, hp: 50, spd: 0.4, vis: 12.5, st: 0.5, w: [], plane: 1, fuel: 260, uav: 1,
    de: 'Aufklärungsdrohne', en: 'Reconnaissance Drone', mw: 'MQ-9B Reaper', me: 'Orion (Inochodez)', dd: 'Langsam und unbewaffnet, aber mit riesiger Sichtweite – weiter als jede Radarstation. Im Dauereinsatz kreist sie über einem Gebiet und tankt von selbst nach.', ed: 'Slow and unarmed, but with a huge field of view – further than any radar station. On a standing mission it circles an area and refuels on its own.' },
  loit:   { cls: 'soft', dom: 'land', sym: 'loit', bld: 'airfield', tier: 1, cost: { m: 450, i: 150, o: 10 }, time: 26, men: 4, hp: 40, spd: 0.05, vis: 0.9, st: 0.55, seat: 1, w: ['loiter'],
    de: 'Kamikaze-Drohnentrupp', en: 'Loitering Munition Team', mw: 'Switchblade 600', me: 'Lancet-3', dd: 'Schickt Kamikaze-Drohnen auf gesichtete Fahrzeuge weit hinter der Front. 3 Drohnen, Nachschub in eigenen Provinzen und durch Versorgung.', ed: 'Sends loitering munitions at spotted vehicles far behind the front. 3 drones, resupplied in own provinces and by supply units.' },
  sam2:   { cls: 'light', dom: 'land', sym: 'sam2', bld: 'factory', tier: 3, cost: { m: 1800, i: 800, o: 60 }, time: 50, hp: 110, spd: 0.07, vis: 2.4, st: 0.2, seat: 3, w: ['lrsam'], intercept: 1.3, icR: 5,
    de: 'Weitreichende Flugabwehr', en: 'Long-Range Air Defense', mw: 'Patriot PAC-3 MSE', me: 'S-400 Triumf', dd: 'Schießt Flugzeuge auf große Entfernung ab und fängt Raketen in weitem Umkreis ab. Langsam und am Boden verwundbar.', ed: 'Downs aircraft at long range and intercepts missiles over a wide area. Slow and vulnerable on the ground.' },
  lst:    { cls: 'ship', dom: 'sea', sym: 'lst', bld: 'shipyard', tier: 1, cost: { m: 1000, i: 450, o: 60 }, time: 36, hp: 420, spd: 0.16, vis: 1.3, st: 0.15, cap: 16, capVeh: 1, w: ['corvGun', 'ciws'],
    de: 'Landungsschiff', en: 'Landing Ship', mw: 'San-Antonio-Klasse', me: 'Iwan-Gren-Klasse', dd: 'Bringt 16 Plätze Truppen und Fahrzeuge über See (Kampfpanzer = 3) und setzt sie an jeder Küste ab: „Transport nach“ und das Ufer antippen.', ed: 'Carries 16 slots of troops and vehicles across the sea (main battle tank = 3) and lands them on any coast: "Transport to" and tap the shore.' },
  ssbn:   { cls: 'sub', dom: 'sea', sym: 'ssbn', bld: 'shipyard', tier: 3, cost: { m: 5000, i: 2500, o: 300 }, time: 80, hp: 400, spd: 0.15, vis: 1.4, st: 0.8, w: ['torpedo'], slbm: 2,
    de: 'Atom-U-Boot (SSBN)', en: 'Ballistic Missile Sub (SSBN)', mw: 'Columbia-Klasse', me: 'Borei-A-Klasse', dd: 'Trägt ballistische Raketen. Lädt im eigenen Hafen nach.', ed: 'Carries ballistic missiles. Reloads in a friendly port.' },
  // ---------- Added in Beta 2 (ROADMAP 3.1) ----------
  cas:    { cls: 'air', dom: 'air', sym: 'cas', bld: 'airfield', tier: 1, cost: { m: 950, i: 420, o: 80 }, time: 34, hp: 230, spd: 0.75, vis: 1.4, st: 0.1, w: ['gau', 'mav'], plane: 1, fuel: 95,
    de: 'Erdkampfflugzeug', en: 'Ground-Attack Aircraft', mw: 'A-10C Thunderbolt II', me: 'Su-25SM3', dd: 'Billiger und robuster als der Kampfjet. Bordkanone und Lenkraketen gegen Fahrzeuge und Infanterie, wehrlos gegen Jäger.', ed: 'Cheaper and tougher than the fighter. Gun and guided missiles against vehicles and infantry, defenceless against fighters.' },
  sjet:   { cls: 'air', dom: 'air', sym: 'sjet', bld: 'airfield', tier: 3, cost: { m: 2600, i: 1150, o: 170 }, time: 58, hp: 110, spd: 1.45, vis: 1.8, st: 0.8, w: ['aam2', 'agm'], plane: 1, fuel: 70,
    de: 'Tarnkappen-Jäger', en: 'Stealth Fighter', mw: 'F-22A Raptor', me: 'Su-57', dd: 'Schwer zu orten: Flugabwehr und Jäger sehen ihn erst spät. Weitreichende Luft-Luft-Raketen, teuer.', ed: 'Hard to detect: air defense and fighters see it late. Long-range air-to-air missiles, expensive.' },
  awacs:  { cls: 'air', dom: 'air', sym: 'awacs', bld: 'airfield', tier: 2, cost: { m: 1400, i: 600, o: 110 }, time: 44, hp: 180, spd: 0.8, vis: 7, st: 0, w: [], plane: 1, fuel: 240, awacs: 2.5,
    de: 'Frühwarnflugzeug (AWACS)', en: 'Airborne Early Warning (AWACS)', mw: 'E-3G Sentry', me: 'A-50U', dd: 'Fliegendes Radar: entdeckt Flugzeuge und Schiffe auf große Entfernung, auch Tarnkappen-Jäger. Eigene Flugzeuge in der Nähe treffen besser. Unbewaffnet – im Dauereinsatz über eigenem Gebiet kreisen lassen.', ed: 'Flying radar: detects aircraft and ships at long range, stealth fighters included. Friendly aircraft nearby hit better. Unarmed – keep it circling over own territory on a standing mission.' },
  frig:   { cls: 'ship', dom: 'sea', sym: 'frig', bld: 'shipyard', tier: 2, cost: { m: 1500, i: 700, o: 100 }, time: 42, hp: 380, spd: 0.17, vis: 1.9, st: 0.15, w: ['corvGun', 'ashmS', 'navSamS', 'asw2'], intercept: 0.35, sonar: 0.8,
    de: 'Fregatte', en: 'Frigate', mw: 'F126 / FREMM', me: 'Admiral-Grigorowitsch-Klasse', dd: 'Zwischen Korvette und Zerstörer: bester U-Boot-Jäger der Flotte mit weitreichendem Sonar, dazu Flugabwehr und Seezielflugkörper.', ed: 'Between corvette and destroyer: the fleet\'s best submarine hunter with long-range sonar, plus air defense and anti-ship missiles.' },
  marine: { cls: 'soft', dom: 'land', sym: 'mar', bld: 'barracks', tier: 2, cost: { m: 240, i: 40, o: 0 }, time: 18, men: 10, hp: 110, spd: 0.058, vis: 0.95, st: 0.3, seat: 1, w: ['rifle', 'rpg'], capture: 1.5, amph: 1,
    de: 'Marineinfanterie', en: 'Marines', mw: 'USMC Rifle Squad', me: 'Morskaja Pechota', dd: 'Für Landungen: geht vom Landungsschiff geordnet an Land (andere Truppen sind kurz unterdrückt) und erobert schneller.', ed: 'Built for landings: goes ashore from a landing ship in good order (other troops are briefly suppressed) and captures faster.' },
  coast:  { cls: 'light', dom: 'land', sym: 'coast', bld: 'factory', tier: 2, cost: { m: 950, i: 420, o: 40 }, time: 36, hp: 80, spd: 0.09, vis: 2.2, st: 0.3, seat: 3, w: ['ashmC'],
    de: 'Küsten-Seezielbatterie', en: 'Coastal Missile Battery', mw: 'NMESIS (NSM)', me: 'K-300P Bastion-P', dd: 'Seezielflugkörper von Land: hält feindliche Schiffe und Landungen weit vor der Küste auf. Nur gegen Schiffe.', ed: 'Anti-ship missiles from land: stops enemy ships and landings far off the coast. Against ships only.' },
  ew:     { cls: 'light', dom: 'land', sym: 'ew', bld: 'factory', tier: 2, cost: { m: 700, i: 320, o: 30 }, time: 30, hp: 80, spd: 0.1, vis: 1.6, st: 0.3, seat: 2, w: [], jam: 1.8,
    de: 'EloKa-Fahrzeug', en: 'Electronic Warfare Vehicle', mw: 'TLS-BCT Stryker', me: '1RL257 Krasucha-4', dd: 'Elektronische Kampfführung: feindliche Lenkflugkörper und Kamikaze-Drohnen treffen im Störbereich deutlich schlechter, Aufklärungsdrohnen sehen dort keine Bodentruppen. Unbewaffnet.', ed: 'Electronic warfare: enemy guided missiles and loitering munitions hit far worse inside the jamming area, reconnaissance drones cannot see ground troops there. Unarmed.' },
  hq:     { cls: 'light', dom: 'land', sym: 'hq', bld: 'factory', tier: 1, cost: { m: 520, i: 220, o: 20 }, time: 26, hp: 110, spd: 0.1, vis: 1.2, st: 0.2, seat: 2, w: ['mg'], hq: 1.4,
    de: 'Gefechtsstand', en: 'Command Post', mw: 'M1130 Stryker CV', me: 'R-149MA1', dd: 'Führt die Truppen in der Nähe: sie treffen besser und erholen sich schneller von Unterdrückung. Fällt er aus, sind sie geschockt – gut schützen.', ed: 'Leads the troops nearby: they hit better and recover from suppression faster. If it is lost they are shocked – protect it well.' },
};

// Missiles are stored in a province's missile base and launched from there (SLBM from SSBN).
const MISSILES = {
  srbm:   { tier: 1, cost: { m: 900, i: 400, o: 50 }, time: 30, r: 25, dmg: 220, aoe: 0.5, spd: 3, intercept: 1, de: 'Kurzstreckenrakete (SRBM)', en: 'Short-Range Ballistic Missile', mw: 'PrSM', me: 'Iskander-M' },
  cruise: { tier: 2, cost: { m: 700, i: 300, o: 50 }, time: 25, r: 40, dmg: 160, aoe: 0.3, spd: 1.4, intercept: 1.6, de: 'Marschflugkörper', en: 'Cruise Missile', mw: 'Tomahawk Block V', me: 'Kalibr' },
  icbm:   { tier: 3, cost: { m: 8000, i: 4000, o: 500 }, time: 90, r: 400, dmg: 600, aoe: 1.4, spd: 6, intercept: 0, strategic: 1, de: 'Interkontinentalrakete (ICBM)', en: 'Intercontinental Ballistic Missile', mw: 'LGM-35 Sentinel', me: 'RS-28 Sarmat' },
  slbm:   { tier: 9, r: 80, dmg: 400, aoe: 1.0, spd: 5, intercept: 0.3, strategic: 1, de: 'U-Boot-Rakete (SLBM)', en: 'Submarine-Launched Missile', mw: 'Trident II D5', me: 'Bulava' },
};

// Institutions built in provinces (WC4-style). Level gates the unit tier.
const BUILDINGS = {
  barracks: { max: 3, m: 300, i: 150, t: 20, icon: 'B', de: 'Kaserne', en: 'Barracks' },
  factory:  { max: 3, m: 600, i: 300, t: 30, icon: 'F', de: 'Rüstungswerk', en: 'Arms Factory' },
  airfield: { max: 3, m: 800, i: 400, t: 35, icon: 'A', de: 'Flugplatz', en: 'Airfield' },
  shipyard: { max: 3, m: 1000, i: 500, t: 40, icon: 'S', de: 'Werft', en: 'Shipyard', coastal: 1 },
  silo:     { max: 3, m: 1500, i: 800, t: 45, icon: 'R', de: 'Raketenbasis', en: 'Missile Base' },
  radar:    { max: 3, m: 400, i: 200, t: 20, icon: 'D', de: 'Radarstation', en: 'Radar Station', noRecruit: 1 },
  aad:      { max: 3, m: 700, i: 350, t: 25, icon: 'L', de: 'Flugabwehrstellung', en: 'Air Defense Site', noRecruit: 1 },
  lab:      { max: 3, m: 2500, i: 1500, t: 60, icon: 'N', de: 'Forschungszentrum', en: 'Research Facility' },
};
// Short labels for the recruitment tabs.
const BUILDING_TABS = { barracks: ['Kaserne', 'Barracks'], factory: ['Werk', 'Factory'], airfield: ['Flugplatz', 'Airfield'], shipyard: ['Werft', 'Shipyard'], silo: ['Raketen', 'Missiles'], lab: ['Forschung', 'Research'] };

// Province air defense by site level: range (map units), seconds between shots, damage vs aircraft / helicopters,
// and how strongly it intercepts missiles aimed near the province.
const AAD_LEVELS = [null, { r: 1.2, cd: 3.5, air: 38, heli: 34, ic: 0.25 }, { r: 1.7, cd: 2.8, air: 46, heli: 40, ic: 0.4 }, { r: 2.3, cd: 2.2, air: 55, heli: 48, ic: 0.55 }];

// Nuclear warheads are built in a research facility and stocked nation-wide. Any missile from a missile base
// or a strategic bomber can carry one. Higher lab levels build faster. Fallout blocks income and production.
const NUKE = { cost: { m: 6000, i: 3000, o: 400 }, time: 120, r: 1.3, dmg: 1500, fallout: 150, falloutR: 1.0, de: 'Atomsprengkopf', en: 'Nuclear Warhead', mw: 'W80-4 / B61-12', me: 'RDS-Serie' };

// Battle-group templates recruited as one order; the units form a new army with all roles a group needs
// (front, reconnaissance, fire support, air defense / supply / medics – see Tactics.roles).
const FORMATIONS = [
  { id: 'infBg', de: 'Infanterie-Kampfgruppe', en: 'Infantry Battle Group', u: { inf: 3, at: 1, recon: 1, mortar: 1, medic: 1 } },
  { id: 'mechBg', de: 'Mech. Kampfgruppe', en: 'Mechanized Battle Group', u: { ifv: 2, inf: 2, at: 1, recon: 1, mortar: 1 } },
  { id: 'tankBg', de: 'Panzer-Kampfgruppe', en: 'Armored Battle Group', u: { mbt: 3, ifv: 1, recon: 1, aa: 1, truck: 1 } },
  { id: 'artyBty', de: 'Artilleriebatterie', en: 'Artillery Battery', u: { spg: 2, aa: 1, truck: 1 } },
  { id: 'airMob', de: 'Luftlandezug', en: 'Air Assault Platoon', u: { inf: 2, thelo: 1, ahelo: 1 } },
];

// Province types, base income per minute at level 1 (scaled by level) and victory points (vp).
const PROVINCE_TYPES = {
  capital:  { m: 70, i: 20, o: 10, def: 220, vp: 5, de: 'Hauptstadt', en: 'Capital' },
  city:     { m: 40, i: 6,  o: 0,  def: 140, vp: 2, de: 'Stadt', en: 'City' },
  industry: { m: 10, i: 40, o: 4,  def: 120, vp: 2, de: 'Industriegebiet', en: 'Industrial Zone' },
  oil:      { m: 15, i: 0,  o: 40, def: 90,  vp: 2, de: 'Ölfeld', en: 'Oil Field' },
  port:     { m: 30, i: 6,  o: 4,  def: 120, vp: 2, de: 'Hafenstadt', en: 'Port City' },
  airbase:  { m: 15, i: 6,  o: 0,  def: 120, vp: 1, de: 'Luftwaffenbasis', en: 'Air Base' },
};
// Points victory: the player wins once the enemies have lost VICTORY.win of their victory points and that holds for
// VICTORY.hold seconds; the player loses once the own country keeps less than VICTORY.lose of its points as long.
// World war (mode 'ffa'): the player's alliance has to hold VICTORY.world of all victory points on the map instead.
const VICTORY = { win: 0.7, world: 0.25, lose: 0.3, hold: 60 };
// Escalation (#44): a team at war that holds `gain` victory points more than its home countries are worth (plus `step`
// for every alliance that already joined against it) makes the nearest neutral alliance within `reach` of its
// conquests mobilise against it. The warning time and the pause between two escalations depend on the difficulty
// (DIFFICULTY.escWarn / escEvery). If the lead shrinks below `cancel` of the threshold meanwhile, the neutral stands down.
// pow: an alliance joins only if its military weight is at most this share of the leader's (DIFFICULTY.escPow when
// the leader is the player's alliance). forces: size of the mobilised armies. cash: treasury cap (× starting funds)
// of a joining country, because neutral countries save money all game long.
const ESCALATION = { gain: 12, step: 10, reach: 25, cancel: 0.75, pow: 1.2, forces: 0.6, cash: 2 };

// War weariness of every country (0–100, Beta 2, #47). Lost units add 100 points per `loss` × the country's size
// (1500 + 300 × power, like the starting money) in unit value (money + industry); destroyed enemy value lowers it by
// `kill` times as much. A lost province adds `lost` × its victory points, a conquered one removes `won` × them; it
// fades by `decay` points per minute. Income is reduced by up to `inc` (at 100), warnings for the player at `warn`.
const WEARY = { loss: 10, kill: 0.4, lost: 3, won: 2, decay: 1.2, inc: 0.2, warn: [50, 80] };

// Veterans (Beta 2, #50): experience = destroyed enemy share, weighted by value (0.5–2 × own value) plus `kill` per
// kill; area weapons (artillery, rockets, bombs) earn only `aoe` of it. Ranks at `xp` (Experienced, Veteran, Elite)
// give +`acc` accuracy and take −`sup` suppression per rank.
// Events (Beta 2, #49, js/core/events.js): the first one `first` to `first + spread` seconds after a country enters
// the war, then every `every` to `every + spread` seconds; the player has `answer` seconds before the free answer
// applies on its own (only without the dialog).
const EVENTS = { first: 300, every: 360, spread: 180, answer: 120 };

const VET = { xp: [1.2, 3, 6], kill: 0.25, aoe: 0.4, acc: 0.1, sup: 0.1 };

// Support effects of the Beta 2 units: accuracy factor for guided missiles fired into a hostile jamming area (jam),
// for aircraft firing air-to-air inside a friendly AWACS radius, and for land units near their command post (hq);
// hqSup = extra suppression recovery per second there, hqShock = suppression when the command post is destroyed,
// landSup = suppression of troops (except amph units) landed from a ship onto a foreign shore.
const SUPPORT_FX = { jamAcc: 0.6, awacsAcc: 1.25, hqAcc: 1.12, hqSup: 5, hqShock: 35, landSup: 40 };

const WEAPON_NAMES = {
  rifle: ['Sturmgewehre', 'Assault rifles'], carbine: ['Karabiner (schallgedämpft)', 'Suppressed carbines'], rpg: ['Panzerfaust', 'Rocket launcher'],
  flamer: ['Flammenwerfer', 'Flamethrower'], sniper: ['Präzisionsgewehr', 'Sniper rifle'], atgm: ['Panzerabwehrlenkrakete', 'Anti-tank missile'],
  mg: ['Maschinengewehr', 'Machine gun'], ac30: ['30-mm-Maschinenkanone', '30 mm autocannon'], ifvAtgm: ['Panzerabwehrlenkrakete', 'Anti-tank missile'],
  gun120: ['120-mm-Glattrohrkanone', '120 mm smoothbore gun'], gun105: ['105-mm-Kanone', '105 mm gun'], hvAtgm: ['Schwere Lenkrakete', 'Heavy ATGM'],
  mortar: ['81-mm-Mörser', '81 mm mortar'], how155: ['155-mm-Haubitze', '155 mm howitzer'], spg155: ['155-mm-Haubitze L52', '155 mm howitzer L52'],
  mlrs: ['Raketensalve', 'Rocket salvo'], tbm: ['Ballistische Rakete', 'Ballistic missile'], sam: ['Flugabwehrrakete', 'Surface-to-air missile'],
  ciws: ['Nahbereichsabwehr', 'CIWS'], heliAtgm: ['Lenkraketen', 'Guided missiles'], heliGun: ['30-mm-Kanone', '30 mm cannon'],
  aam: ['Luft-Luft-Rakete', 'Air-to-air missile'], agm: ['Präzisionsbombe', 'Precision bomb'], bombs: ['Bombenlast', 'Bomb load'],
  navGun: ['127-mm-Schiffsgeschütz', '127 mm naval gun'], corvGun: ['76-mm-Geschütz', '76 mm gun'], ashm: ['Seezielflugkörper', 'Anti-ship missile'],
  ashmS: ['Seezielflugkörper', 'Anti-ship missile'], navSam: ['Schiffsflugabwehr', 'Naval SAM'], asw: ['U-Jagd-Torpedo', 'ASW torpedo'], torpedo: ['Torpedo', 'Torpedo'],
  loiter: ['Kamikaze-Drohne', 'Loitering munition'], lrsam: ['Weitreichende Flugabwehrrakete', 'Long-range SAM'],
  gau: ['30-mm-Bordkanone', '30 mm gun'], mav: ['Luft-Boden-Lenkrakete', 'Air-to-ground missile'], aam2: ['Weitreichende Luft-Luft-Rakete', 'Long-range air-to-air missile'],
  navSamS: ['Schiffsflugabwehr (mittel)', 'Naval SAM (medium)'], asw2: ['U-Jagd-Torpedo (Bordhubschrauber)', 'ASW torpedo (ship helicopter)'], ashmC: ['Küsten-Seezielflugkörper', 'Coastal anti-ship missile'],
};
const MAX_LEVEL = 5;
const UPGRADE_COST = (lvl) => ({ m: 400 * lvl, i: 200 * lvl, t: 25 * lvl });
// Global multiplier for all recruitment and construction times.
const TIME_SCALE = 0.7;
// Tactical pace: ground and naval units move slower than their nominal speed; provinces take longer to capture.
const MOVE_SCALE = 0.75;
const CAPTURE_TIME = (lvl) => 10 + 5 * lvl;
// Upkeep per minute as a share of the unit's purchase price (money and oil). Large armies cost their economy.
// Tuned so a starting army uses about half of the money and three quarters of the oil income (Germany: 255/480, 32/42).
const UPKEEP = { m: 0.015, o: 0.03 };
// Entrenchment: a land unit that stands still digs in over DIG.time seconds and then takes DIG.max less damage
// (indirect fire ignores half of it, so artillery preparation pays off).
const DIG = { time: 75, max: 0.4 };
// Flank and rear: direct fire from a ground unit or helicopter that hits a ground unit from the side (60–120° off its
// facing) or from behind deals more damage, and the target's entrenchment only counts partly (dig = share it keeps).
// The facing is towards the unit's current target, otherwise its last direction of travel.
const FLANK = { side: 1.25, rear: 1.5, sideDig: 0.75, rearDig: 0.5 };
// Cover near the center of an own or allied province (r map units): damage factor for infantry and for vehicles.
// Built-up areas (capital, city, port, industry) protect much better than open country.
const COVER = { r: 0.6, urban: { soft: 0.55, veh: 0.8 }, open: { soft: 0.75, veh: 1 }, types: { capital: 1, city: 1, port: 1, industry: 1 } };
// Command limit: how many units a country can lead. base + per province (level × weight of its type); every unit
// counts 1, ships 2 (or w). Units in production count too. Upgrading or capturing provinces raises the limit.
// Germany at the start: about 40 of 49 used.
const CMD = { base: 12, per: { capital: 5, city: 2.5, port: 2.5, industry: 2.5, oil: 1.5, airbase: 1.5 }, ship: 2, w: { cv: 4, ssbn: 3 } };
// Suppression by indirect fire (artillery, mortars, rockets) is stronger than by direct fire.
const ARTY_SUP = 1.6;
// Province vision radius by radar level (0 = no radar).
const RADAR_RANGE = [1.1, 3, 5, 8];
