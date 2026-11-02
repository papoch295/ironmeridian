// Scenario data: real cities, alliance blocs, national strength and doctrine.
'use strict';

// [name, lat, lon, isCapital]. Order within a country = importance; extra provinces are generated.
const CITIES = [
  ['Washington', 38.9, -77.0, 1], ['New York', 40.7, -74.0], ['Los Angeles', 34.05, -118.2], ['Chicago', 41.9, -87.6],
  ['Houston', 29.8, -95.4], ['Seattle', 47.6, -122.3], ['Denver', 39.7, -105.0], ['Atlanta', 33.75, -84.4], ['Miami', 25.8, -80.2],
  ['Anchorage', 61.2, -149.9], ['San Diego', 32.7, -117.2], ['Dallas', 32.8, -96.8], ['Minneapolis', 44.98, -93.3], ['Phoenix', 33.45, -112.1],
  ['Ottawa', 45.4, -75.7, 1], ['Toronto', 43.65, -79.4], ['Vancouver', 49.3, -123.1], ['Montreal', 45.5, -73.6], ['Calgary', 51.05, -114.1], ['Winnipeg', 49.9, -97.1],
  ['Mexiko-Stadt', 19.4, -99.1, 1], ['Monterrey', 25.7, -100.3], ['Guadalajara', 20.7, -103.35],
  ['Havanna', 23.1, -82.4, 1], ['Guatemala-Stadt', 14.6, -90.5, 1], ['Panama-Stadt', 8.98, -79.5, 1],
  ['Bogotá', 4.7, -74.1, 1], ['Medellín', 6.25, -75.6], ['Caracas', 10.5, -66.9, 1], ['Maracaibo', 10.65, -71.6],
  ['Quito', -0.2, -78.5, 1], ['Guayaquil', -2.2, -79.9], ['Lima', -12.05, -77.0, 1], ['Arequipa', -16.4, -71.5],
  ['La Paz', -16.5, -68.15, 1], ['Santiago', -33.45, -70.65, 1], ['Antofagasta', -23.65, -70.4],
  ['Buenos Aires', -34.6, -58.4, 1], ['Córdoba', -31.4, -64.2], ['Mendoza', -32.9, -68.85], ['Asunción', -25.3, -57.6, 1], ['Montevideo', -34.9, -56.2, 1],
  ['Brasília', -15.8, -47.9, 1], ['São Paulo', -23.55, -46.6], ['Rio de Janeiro', -22.9, -43.2], ['Manaus', -3.1, -60.0], ['Salvador', -12.97, -38.5],
  ['Recife', -8.05, -34.9], ['Porto Alegre', -30.0, -51.2], ['Belém', -1.45, -48.5],
  ['London', 51.5, -0.13, 1], ['Manchester', 53.5, -2.25], ['Glasgow', 55.86, -4.25], ['Belfast', 54.6, -5.9], ['Plymouth', 50.37, -4.14],
  ['Dublin', 53.35, -6.26, 1], ['Paris', 48.86, 2.35, 1], ['Marseille', 43.3, 5.37], ['Lyon', 45.76, 4.84], ['Bordeaux', 44.84, -0.58], ['Brest', 48.39, -4.49], ['Lille', 50.63, 3.06], ['Toulouse', 43.6, 1.44],
  ['Madrid', 40.42, -3.7, 1], ['Barcelona', 41.39, 2.17], ['Sevilla', 37.39, -5.98], ['Bilbao', 43.26, -2.93], ['Valencia', 39.47, -0.38],
  ['Lissabon', 38.72, -9.14, 1], ['Porto', 41.15, -8.61], ['Brüssel', 50.85, 4.35, 1], ['Antwerpen', 51.22, 4.4], ['Amsterdam', 52.37, 4.9, 1], ['Rotterdam', 51.92, 4.48], ['Luxemburg', 49.61, 6.13, 1],
  ['Berlin', 52.52, 13.4, 1], ['Hamburg', 53.55, 10.0], ['München', 48.14, 11.58], ['Köln', 50.94, 6.96], ['Frankfurt', 50.11, 8.68], ['Stuttgart', 48.78, 9.18], ['Leipzig', 51.34, 12.37], ['Hannover', 52.37, 9.74], ['Kiel', 54.32, 10.14],
  ['Wien', 48.21, 16.37, 1], ['Graz', 47.07, 15.44], ['Bern', 46.95, 7.45, 1], ['Zürich', 47.38, 8.54], ['Kopenhagen', 55.68, 12.57, 1], ['Aarhus', 56.16, 10.2],
  ['Warschau', 52.23, 21.01, 1], ['Krakau', 50.06, 19.94], ['Danzig', 54.35, 18.65], ['Breslau', 51.11, 17.03], ['Posen', 52.41, 16.93],
  ['Prag', 50.08, 14.44, 1], ['Brünn', 49.2, 16.61], ['Bratislava', 48.15, 17.11, 1], ['Košice', 48.72, 21.26], ['Budapest', 47.5, 19.04, 1], ['Debrecen', 47.53, 21.63],
  ['Rom', 41.9, 12.5, 1], ['Mailand', 45.46, 9.19], ['Neapel', 40.85, 14.27], ['Turin', 45.07, 7.69], ['Palermo', 38.12, 13.36], ['Venedig', 45.44, 12.33], ['Tarent', 40.47, 17.24],
  ['Athen', 37.98, 23.73, 1], ['Thessaloniki', 40.64, 22.94], ['Ankara', 39.93, 32.86, 1], ['Istanbul', 41.01, 28.98], ['Izmir', 38.42, 27.14], ['Erzurum', 39.9, 41.27], ['Adana', 37.0, 35.32], ['Trabzon', 41.0, 39.72],
  ['Sofia', 42.7, 23.32, 1], ['Warna', 43.21, 27.91], ['Bukarest', 44.43, 26.1, 1], ['Constanța', 44.18, 28.63], ['Cluj-Napoca', 46.77, 23.6],
  ['Zagreb', 45.81, 15.98, 1], ['Split', 43.51, 16.44], ['Ljubljana', 46.06, 14.51, 1], ['Tirana', 41.33, 19.82, 1], ['Belgrad', 44.8, 20.47, 1], ['Sarajevo', 43.86, 18.41, 1], ['Skopje', 41.99, 21.43, 1], ['Podgorica', 42.44, 19.26, 1],
  ['Stockholm', 59.33, 18.07, 1], ['Göteborg', 57.71, 11.97], ['Kiruna', 67.86, 20.23], ['Oslo', 59.91, 10.75, 1], ['Bergen', 60.39, 5.32], ['Tromsø', 69.65, 18.96], ['Trondheim', 63.43, 10.4],
  ['Helsinki', 60.17, 24.94, 1], ['Oulu', 65.01, 25.47], ['Tallinn', 59.44, 24.75, 1], ['Riga', 56.95, 24.11, 1], ['Vilnius', 54.69, 25.28, 1], ['Kaunas', 54.9, 23.9], ['Reykjavík', 64.15, -21.94, 1],
  ['Kiew', 50.45, 30.52, 1], ['Charkiw', 49.99, 36.23], ['Odessa', 46.48, 30.72], ['Lwiw', 49.84, 24.03], ['Dnipro', 48.46, 35.05], ['Chișinău', 47.01, 28.86, 1],
  ['Minsk', 53.9, 27.56, 1], ['Homel', 52.44, 30.98], ['Tiflis', 41.72, 44.79, 1], ['Baku', 40.41, 49.87, 1], ['Jerewan', 40.18, 44.51, 1],
  ['Moskau', 55.76, 37.62, 1], ['Sankt Petersburg', 59.94, 30.31], ['Kaliningrad', 54.71, 20.51], ['Murmansk', 68.97, 33.08], ['Rostow am Don', 47.24, 39.71], ['Wolgograd', 48.71, 44.51],
  ['Kasan', 55.79, 49.12], ['Jekaterinburg', 56.84, 60.6], ['Nowosibirsk', 55.01, 82.93], ['Omsk', 54.99, 73.37], ['Krasnojarsk', 56.01, 92.85], ['Irkutsk', 52.29, 104.3],
  ['Jakutsk', 62.03, 129.73], ['Chabarowsk', 48.48, 135.08], ['Wladiwostok', 43.12, 131.89], ['Norilsk', 69.35, 88.2], ['Petropawlowsk', 53.02, 158.65], ['Sewastopol', 44.6, 33.52],
  ['Astana', 51.17, 71.45, 1], ['Almaty', 43.24, 76.89], ['Atyrau', 47.1, 51.9], ['Taschkent', 41.3, 69.24, 1], ['Bischkek', 42.87, 74.59, 1], ['Duschanbe', 38.56, 68.77, 1], ['Aşgabat', 37.96, 58.33, 1],
  ['Peking', 39.9, 116.4, 1], ['Shanghai', 31.23, 121.47], ['Guangzhou', 23.13, 113.26], ['Chongqing', 29.56, 106.55], ['Wuhan', 30.59, 114.3], ['Chengdu', 30.57, 104.07],
  ['Harbin', 45.8, 126.53], ['Xi’an', 34.34, 108.94], ['Ürümqi', 43.83, 87.62], ['Lhasa', 29.65, 91.1], ['Kunming', 25.04, 102.71], ['Shenyang', 41.8, 123.43], ['Lanzhou', 36.06, 103.83], ['Xiamen', 24.48, 118.09], ['Qingdao', 36.07, 120.38],
  ['Ulaanbaatar', 47.92, 106.92, 1], ['Pjöngjang', 39.04, 125.76, 1], ['Hamhŭng', 39.92, 127.54], ['Seoul', 37.57, 126.98, 1], ['Busan', 35.18, 129.08],
  ['Tokio', 35.68, 139.69, 1], ['Osaka', 34.69, 135.5], ['Sapporo', 43.06, 141.35], ['Fukuoka', 33.59, 130.4], ['Sendai', 38.27, 140.87], ['Naha', 26.21, 127.68],
  ['Taipeh', 25.03, 121.57, 1], ['Kaohsiung', 22.63, 120.3], ['Manila', 14.6, 120.98, 1], ['Davao', 7.07, 125.61], ['Hanoi', 21.03, 105.85, 1], ['Ho-Chi-Minh-Stadt', 10.82, 106.63],
  ['Bangkok', 13.76, 100.5, 1], ['Chiang Mai', 18.79, 98.98], ['Vientiane', 17.97, 102.63, 1], ['Phnom Penh', 11.56, 104.92, 1], ['Naypyidaw', 19.76, 96.08, 1], ['Rangun', 16.87, 96.2],
  ['Kuala Lumpur', 3.14, 101.69, 1], ['Kuching', 1.55, 110.35], ['Singapur', 1.35, 103.82, 1], ['Jakarta', -6.2, 106.85, 1], ['Surabaya', -7.25, 112.75], ['Medan', 3.6, 98.67], ['Makassar', -5.14, 119.42], ['Jayapura', -2.53, 140.72],
  ['Neu-Delhi', 28.61, 77.21, 1], ['Mumbai', 19.08, 72.88], ['Kolkata', 22.57, 88.36], ['Chennai', 13.08, 80.27], ['Bangalore', 12.97, 77.59], ['Hyderabad', 17.39, 78.49], ['Ahmedabad', 23.02, 72.57], ['Srinagar', 34.08, 74.8], ['Guwahati', 26.14, 91.74],
  ['Islamabad', 33.68, 73.05, 1], ['Karatschi', 24.86, 67.0], ['Lahore', 31.55, 74.34], ['Quetta', 30.18, 66.98], ['Kabul', 34.53, 69.17, 1], ['Kandahar', 31.63, 65.71], ['Herat', 34.35, 62.2],
  ['Dhaka', 23.81, 90.41, 1], ['Chittagong', 22.36, 91.78], ['Kathmandu', 27.72, 85.32, 1], ['Thimphu', 27.47, 89.64, 1], ['Colombo', 6.93, 79.86, 1],
  ['Teheran', 35.69, 51.39, 1], ['Isfahan', 32.65, 51.67], ['Täbris', 38.08, 46.29], ['Maschhad', 36.3, 59.6], ['Bandar Abbas', 27.18, 56.27], ['Ahvaz', 31.32, 48.67], ['Schiras', 29.59, 52.58],
  ['Bagdad', 33.31, 44.36, 1], ['Basra', 30.51, 47.81], ['Mossul', 36.34, 43.13], ['Damaskus', 33.51, 36.29, 1], ['Aleppo', 36.2, 37.13], ['Latakia', 35.52, 35.78], ['Beirut', 33.89, 35.5, 1],
  ['Jerusalem', 31.77, 35.21, 1], ['Haifa', 32.79, 34.99], ['Amman', 31.95, 35.93, 1], ['Riad', 24.71, 46.68, 1], ['Dschidda', 21.49, 39.19], ['Dammam', 26.43, 50.1], ['Tabuk', 28.38, 36.57],
  ['Kuwait-Stadt', 29.38, 47.99, 1], ['Doha', 25.29, 51.53, 1], ['Abu Dhabi', 24.45, 54.38, 1], ['Dubai', 25.2, 55.27], ['Manama', 26.23, 50.59, 1], ['Maskat', 23.59, 58.41, 1], ['Sanaa', 15.37, 44.19, 1], ['Aden', 12.79, 45.02],
  ['Kairo', 30.04, 31.24, 1], ['Alexandria', 31.2, 29.92], ['Assuan', 24.09, 32.9], ['Tripolis', 32.89, 13.19, 1], ['Bengasi', 32.12, 20.07], ['Tunis', 36.81, 10.18, 1], ['Algier', 36.75, 3.06, 1], ['Oran', 35.7, -0.63],
  ['Rabat', 34.02, -6.83, 1], ['Casablanca', 33.57, -7.59], ['Khartum', 15.5, 32.56, 1], ['Port Sudan', 19.62, 37.22], ['Dschuba', 4.85, 31.58, 1], ['N’Djamena', 12.13, 15.06, 1],
  ['Addis Abeba', 9.03, 38.74, 1], ['Asmara', 15.32, 38.93, 1], ['Mogadischu', 2.05, 45.32, 1], ['Nairobi', -1.29, 36.82, 1], ['Mombasa', -4.04, 39.67], ['Kampala', 0.35, 32.58, 1], ['Daressalam', -6.79, 39.21, 1], ['Dodoma', -6.16, 35.75],
  ['Abuja', 9.08, 7.4, 1], ['Lagos', 6.52, 3.38], ['Kano', 12.0, 8.52], ['Port Harcourt', 4.82, 7.03], ['Accra', 5.6, -0.19, 1], ['Kumasi', 6.69, -1.62], ['Yamoussoukro', 6.83, -5.29, 1], ['Abidjan', 5.36, -4.0],
  ['Dakar', 14.72, -17.47, 1], ['Bamako', 12.64, -8.0, 1], ['Niamey', 13.51, 2.11, 1], ['Ouagadougou', 12.37, -1.52, 1], ['Kinshasa', -4.44, 15.27, 1], ['Lubumbashi', -11.66, 27.48], ['Kisangani', 0.52, 25.2],
  ['Luanda', -8.84, 13.23, 1], ['Huambo', -12.78, 15.74], ['Windhuk', -22.56, 17.08, 1], ['Gaborone', -24.63, 25.92, 1], ['Harare', -17.83, 31.05, 1], ['Bulawayo', -20.15, 28.58], ['Maputo', -25.97, 32.57, 1], ['Beira', -19.84, 34.84],
  ['Pretoria', -25.75, 28.19, 1], ['Johannesburg', -26.2, 28.05], ['Kapstadt', -33.92, 18.42], ['Durban', -29.86, 31.02], ['Port Elizabeth', -33.96, 25.6], ['Antananarivo', -18.88, 47.51, 1],
  ['Canberra', -35.28, 149.13, 1], ['Sydney', -33.87, 151.21], ['Melbourne', -37.81, 144.96], ['Brisbane', -27.47, 153.03], ['Perth', -31.95, 115.86], ['Darwin', -12.46, 130.84], ['Adelaide', -34.93, 138.6], ['Cairns', -16.92, 145.77],
  ['Wellington', -41.29, 174.78, 1], ['Auckland', -36.85, 174.76], ['Christchurch', -43.53, 172.64], ['Port Moresby', -9.44, 147.18, 1],
];

// Alliance blocs. The player leads one bloc and fights exactly one other bloc; all others stay neutral.
const BLOCS = [
  { id: 'NA', de: 'Nordamerikanisches Kommando', en: 'North American Command', members: ['US', 'CA', 'MX'] },
  { id: 'WE', de: 'Westeuropäischer Verbund', en: 'Western European Union', members: ['FR', 'GB', 'IE', 'ES', 'PT', 'BE', 'NL', 'LU'] },
  { id: 'CE', de: 'Mitteleuropäische Allianz', en: 'Central European Alliance', members: ['DE', 'PL', 'CZ', 'AT', 'SK', 'HU', 'CH', 'DK'] },
  { id: 'SE', de: 'Mittelmeer-Pakt', en: 'Mediterranean Pact', members: ['IT', 'GR', 'TR', 'BG', 'RO', 'HR', 'SI', 'AL'] },
  { id: 'NE', de: 'Nordischer Rat', en: 'Nordic Council', members: ['SE', 'NO', 'FI', 'EE', 'LV', 'LT', 'IS'] },
  { id: 'BS', de: 'Schwarzmeer-Bund', en: 'Black Sea League', members: ['UA', 'MD', 'GE', 'AZ', 'RS', 'BA', 'ME', 'MK'] },
  { id: 'EU', de: 'Eurasische Union', en: 'Eurasian Union', members: ['RU', 'BY', 'KZ', 'AM', 'KG', 'TJ'] },
  { id: 'EA', de: 'Ostasiatischer Pakt', en: 'East Asian Pact', members: ['CN', 'KP', 'MN', 'LA', 'MM', 'KH'] },
  { id: 'PA', de: 'Pazifische Allianz', en: 'Pacific Alliance', members: ['JP', 'KR', 'TW', 'PH', 'AU', 'NZ', 'PG'] },
  { id: 'SA', de: 'Südostasiatische Liga', en: 'Southeast Asian League', members: ['ID', 'MY', 'TH', 'VN', 'SG', 'BN'] },
  { id: 'IN', de: 'Südasiatische Föderation', en: 'South Asian Federation', members: ['IN', 'BD', 'NP', 'LK', 'BT'] },
  { id: 'CA', de: 'Zentralasiatischer Block', en: 'Central Asian Bloc', members: ['PK', 'AF', 'UZ', 'TM'] },
  { id: 'ME', de: 'Achse des Ostens', en: 'Eastern Axis', members: ['IR', 'IQ', 'SY', 'YE', 'LB'] },
  { id: 'GC', de: 'Golf-Koalition', en: 'Gulf Coalition', members: ['SA', 'AE', 'QA', 'KW', 'OM', 'BH', 'JO', 'IL'] },
  { id: 'NF', de: 'Nordafrikanische Union', en: 'North African Union', members: ['EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'TD'] },
  { id: 'WA', de: 'Westafrikanische Gemeinschaft', en: 'West African Community', members: ['NG', 'GH', 'CI', 'SN', 'ML', 'NE', 'BF'] },
  { id: 'EF', de: 'Ostafrikanischer Bund', en: 'East African League', members: ['ET', 'KE', 'TZ', 'UG', 'SO', 'SS', 'ER'] },
  { id: 'ZA', de: 'Südafrikanische Allianz', en: 'Southern African Alliance', members: ['ZA', 'NA', 'BW', 'ZW', 'MZ', 'AO', 'CD', 'MG'] },
  { id: 'SB', de: 'Südamerikanischer Pakt', en: 'South American Pact', members: ['BR', 'AR', 'CL', 'UY', 'PY', 'BO'] },
  { id: 'AN', de: 'Anden-Bund', en: 'Andean League', members: ['CO', 'VE', 'PE', 'EC', 'PA', 'CU'] },
];

// Military weight (1 = minor power). Drives starting forces and province count.
const POWER = {
  US: 10, CN: 9, RU: 9, IN: 7, GB: 6, FR: 6, DE: 5, JP: 5, KR: 5, TR: 5, IR: 4, PK: 4, IL: 4, SA: 4, BR: 4, IT: 4, EG: 3,
  PL: 3, AU: 3, UA: 3, KP: 3, TW: 3, ES: 3, CA: 3, ID: 3, VN: 3, DZ: 2, MX: 2, TH: 2, SE: 2, GR: 2, NG: 2, IQ: 2, AE: 2,
  SY: 2, AR: 2, ZA: 2, CO: 2, KZ: 2, BY: 2, NO: 2, FI: 2, NL: 2, RO: 2, MY: 2, PH: 2, CL: 2, VE: 2, ET: 2, MA: 2, BD: 2,
};

// Countries fielding Eastern equipment (model names in the unit cards).
const EAST_DOCTRINE = new Set(['RU', 'BY', 'KZ', 'AM', 'KG', 'TJ', 'CN', 'KP', 'MN', 'LA', 'MM', 'KH', 'IR', 'IQ', 'SY', 'YE',
  'LB', 'VN', 'UZ', 'TM', 'AF', 'DZ', 'LY', 'SD', 'VE', 'CU', 'ET', 'ER', 'AO', 'MZ', 'ZW', 'RS', 'IN', 'BD', 'PK', 'EG', 'AZ']);

// Countries with large oil and gas reserves get extra oil fields.
const OIL_RICH = new Set(['SA', 'RU', 'IR', 'IQ', 'US', 'CA', 'VE', 'KW', 'AE', 'NG', 'KZ', 'NO', 'LY', 'DZ', 'QA', 'BR',
  'MX', 'CN', 'AO', 'AZ', 'OM', 'TM', 'GB', 'ID', 'MY', 'EG', 'CO', 'EC', 'SY', 'YE', 'SD', 'BN', 'GA', 'CG']);
